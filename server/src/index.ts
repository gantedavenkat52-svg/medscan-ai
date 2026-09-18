import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import symptomRoutes from './routes/symptoms.js';
import dailyReportRoutes from './routes/dailyReports.js';
import labReportRoutes from './routes/labReports.js';
import careRoutes from './routes/care.js';
import assistantRoutes from './routes/assistant.js';
import timelineRoutes from './routes/timeline.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'MedScan AI — AI Health Assistance Platform',
    version: '1.0.0',
    disclaimer: 'MedScan AI provides educational health assistance and does not provide medical diagnoses or prescriptions.',
    aiService: process.env.GEMINI_API_KEY ? 'Gemini 1.5 Active' : 'Clinical Knowledge-Base Engine Active',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/symptoms', symptomRoutes);
app.use('/api/daily-reports', dailyReportRoutes);
app.use('/api/lab-reports', labReportRoutes);
app.use('/api/care', careRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` MedScan AI Server Running on http://localhost:${PORT}`);
  console.log(` Educational Non-Diagnostic Safety Engine: Active`);
  console.log(`=======================================================`);
});
