import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { generateDailyHealthSummary } from '../services/ai/healthReportSummary.js';

const router = Router();

// Create daily health report
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const {
      date,
      energy_level,
      sleep_hours,
      sleep_quality,
      water_intake_liters,
      exercise_minutes,
      mood,
      symptoms_reported,
      vitals
    } = req.body;

    const reportDate = date || new Date().toISOString().split('T')[0];

    // Find previous report for comparative analysis
    const previous = db.getLatestDailyReport(req.user.id);

    // Generate AI Summary and delta observations
    const summaryAnalysis = generateDailyHealthSummary(
      {
        energy_level: Number(energy_level) || 3,
        sleep_hours: Number(sleep_hours) || 7,
        sleep_quality: sleep_quality || 'Good',
        water_intake_liters: Number(water_intake_liters) || 2.0,
        exercise_minutes: Number(exercise_minutes) || 0,
        mood: mood || 'Balanced',
        symptoms_reported: Array.isArray(symptoms_reported) ? symptoms_reported : [],
        vitals
      },
      previous
    );

    const report = db.createDailyHealthReport({
      id: `dhr-${Date.now()}`,
      user_id: req.user.id,
      date: reportDate,
      energy_level: Number(energy_level) || 3,
      sleep_hours: Number(sleep_hours) || 7,
      sleep_quality: sleep_quality || 'Good',
      water_intake_liters: Number(water_intake_liters) || 2.0,
      exercise_minutes: Number(exercise_minutes) || 0,
      mood: mood || 'Balanced',
      symptoms_reported: Array.isArray(symptoms_reported) ? symptoms_reported : [],
      vitals,
      ai_summary: summaryAnalysis.ai_summary,
      ai_changes: summaryAnalysis.ai_changes,
      ai_recommendations: summaryAnalysis.ai_recommendations,
      created_at: new Date().toISOString()
    });

    // Add event to health timeline
    db.createTimelineEvent({
      id: `tl-dhr-${Date.now()}`,
      user_id: req.user.id,
      event_type: 'daily_report',
      title: `Daily Health Report: ${reportDate}`,
      description: `Energy: ${report.energy_level}/5, Sleep: ${report.sleep_hours}h (${report.sleep_quality}), Water: ${report.water_intake_liters}L. Mood: ${report.mood}.`,
      reference_id: report.id,
      date: reportDate,
      created_at: new Date().toISOString()
    });

    return res.status(201).json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to save daily health report' });
  }
});

// Get user's daily health reports
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const reports = db.getDailyHealthReportsByUser(req.user.id);
  return res.json(reports);
});

// Get latest report
router.get('/latest', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const latest = db.getLatestDailyReport(req.user.id);
  return res.json(latest || null);
});

export default router;
