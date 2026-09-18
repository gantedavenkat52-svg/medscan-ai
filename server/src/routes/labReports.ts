import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { LabExtractor } from '../services/ocr/labExtractor.js';
import { interpretLabReport } from '../services/ai/labReportAnalysis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are supported for laboratory reports'));
    }
  }
});

const router = Router();

// Get available pre-built sample reports for instant one-click testing
router.get('/samples', (_req, res: Response) => {
  const samples = LabExtractor.getSampleTemplates();
  return res.json(samples);
});

// Analyze a pre-built sample report
router.post('/sample-analyze', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { sampleId } = req.body;
    const sample = LabExtractor.getSampleTemplates().find(s => s.id === sampleId);

    if (!sample) {
      return res.status(404).json({ error: 'Sample report template not found' });
    }

    const interpreted = await interpretLabReport(
      sample.items,
      sample.labName,
      sample.reportType,
      97.5,
      process.env.GEMINI_API_KEY
    );

    const reportId = `lab-${Date.now()}`;
    const reportDate = new Date().toISOString().split('T')[0];

    const labReport = db.createLabReport({
      id: reportId,
      user_id: req.user.id,
      lab_name: interpreted.lab_name,
      report_type: interpreted.report_type,
      report_date: reportDate,
      file_name: `${sample.id}.pdf`,
      file_url: `/uploads/${sample.id}.pdf`,
      ocr_confidence: interpreted.ocr_confidence,
      is_low_confidence: interpreted.is_low_confidence,
      overall_summary: interpreted.overall_summary,
      results: interpreted.results.map(r => ({ ...r, lab_report_id: reportId })),
      created_at: new Date().toISOString()
    });

    // Add to timeline
    const reviewCount = labReport.results.filter(r => r.status === 'review').length;
    db.createTimelineEvent({
      id: `tl-lab-${Date.now()}`,
      user_id: req.user.id,
      event_type: 'lab_report',
      title: `Lab Report Analyzed: ${labReport.report_type}`,
      description: `${labReport.lab_name} — ${labReport.results.length} markers analyzed (${reviewCount} outside printed reference ranges).`,
      reference_id: reportId,
      date: reportDate,
      created_at: new Date().toISOString()
    });

    return res.status(201).json(labReport);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to process sample lab report' });
  }
});

// Upload and analyze real document
router.post('/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a valid lab report file (PDF, JPG, or PNG)' });
  }

  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // Step 1: Extract text and values via OCR abstraction
    const extraction = await LabExtractor.extractFromFile(filePath, originalName);

    // Step 2: Clinical interpretation
    const interpreted = await interpretLabReport(
      extraction.extracted_items,
      extraction.lab_name,
      extraction.report_type,
      extraction.ocr_confidence,
      process.env.GEMINI_API_KEY
    );

    const reportId = `lab-${Date.now()}`;
    const reportDate = new Date().toISOString().split('T')[0];

    const labReport = db.createLabReport({
      id: reportId,
      user_id: req.user.id,
      lab_name: interpreted.lab_name,
      report_type: interpreted.report_type,
      report_date: reportDate,
      file_name: originalName,
      file_url: `/uploads/${req.file.filename}`,
      ocr_confidence: interpreted.ocr_confidence,
      is_low_confidence: interpreted.is_low_confidence,
      overall_summary: interpreted.overall_summary,
      results: interpreted.results.map(r => ({ ...r, lab_report_id: reportId })),
      created_at: new Date().toISOString()
    });

    // Add to timeline
    const reviewCount = labReport.results.filter(r => r.status === 'review').length;
    db.createTimelineEvent({
      id: `tl-lab-${Date.now()}`,
      user_id: req.user.id,
      event_type: 'lab_report',
      title: `Lab Report Uploaded: ${labReport.report_type}`,
      description: `${labReport.lab_name} — ${labReport.results.length} markers analyzed (${reviewCount} to review).`,
      reference_id: reportId,
      date: reportDate,
      created_at: new Date().toISOString()
    });

    return res.status(201).json(labReport);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to process lab report' });
  }
});

// Get user's lab reports
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const reports = db.getLabReportsByUser(req.user.id);
  return res.json(reports);
});

// Get single report by ID
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const report = db.getLabReportById(req.params.id);
  if (!report) return res.status(404).json({ error: 'Lab report not found' });
  if (report.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  return res.json(report);
});

// Marker Trends Over Time
router.get('/trends/markers', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const reports = db.getLabReportsByUser(req.user.id);
  
  // Track trendable tests
  const targetMarkers = ['Fasting Blood Glucose', 'Total Cholesterol', 'HDL Cholesterol ("Good")', 'LDL Cholesterol ("Bad")', '25-Hydroxy Vitamin D', 'Hemoglobin'];
  const trends: Record<string, Array<{ date: string; value: number; unit: string; status: string }>> = {};

  for (const m of targetMarkers) {
    trends[m] = [];
  }

  for (const report of reports) {
    for (const resItem of report.results) {
      if (targetMarkers.includes(resItem.test_name)) {
        const numVal = parseFloat(String(resItem.result_value).replace(/[^0-9.]/g, ''));
        if (!isNaN(numVal)) {
          trends[resItem.test_name].push({
            date: report.report_date,
            value: numVal,
            unit: resItem.unit,
            status: resItem.status
          });
        }
      }
    }
  }

  // Sort chronological
  for (const k of Object.keys(trends)) {
    trends[k].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  return res.json({
    disclaimer: 'Laboratory marker trends are for tracking changes over time and do not constitute a medical diagnosis.',
    trends
  });
});

export default router;
