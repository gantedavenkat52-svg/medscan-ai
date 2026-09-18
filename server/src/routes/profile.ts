import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get profile
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const profile = db.getProfile(req.user.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  return res.json(profile);
});

// Update profile
router.put('/', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const {
      name,
      date_of_birth,
      age,
      gender,
      blood_group,
      allergies,
      existing_conditions,
      medications,
      emergency_contact,
      privacy_settings
    } = req.body;

    const updated = db.upsertProfile({
      user_id: req.user.id,
      name: name || 'User',
      date_of_birth,
      age: age ? Number(age) : undefined,
      gender,
      blood_group,
      allergies: Array.isArray(allergies) ? allergies : [],
      existing_conditions: Array.isArray(existing_conditions) ? existing_conditions : [],
      medications: Array.isArray(medications) ? medications : [],
      emergency_contact,
      privacy_settings,
      updated_at: new Date().toISOString()
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

// Export profile and health data package (JSON)
router.get('/export', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const profile = db.getProfile(req.user.id);
  const symptoms = db.getSymptomAssessmentsByUser(req.user.id);
  const dailyReports = db.getDailyHealthReportsByUser(req.user.id);
  const labReports = db.getLabReportsByUser(req.user.id);
  const timeline = db.getTimelineByUser(req.user.id);
  const appointments = db.getAppointmentsByUser(req.user.id);

  const exportPackage = {
    exported_at: new Date().toISOString(),
    platform: 'MedScan AI — AI Health Assistance Platform',
    disclaimer: 'This data export contains user-reported and laboratory-extracted health records for personal reference. It is not an official clinical diagnostic record.',
    profile,
    symptoms_history: symptoms,
    daily_health_reports: dailyReports,
    laboratory_reports: labReports,
    health_timeline: timeline,
    appointments
  };

  res.setHeader('Content-Disposition', `attachment; filename="medscan_health_export_${req.user.id}.json"`);
  res.setHeader('Content-Type', 'application/json');
  return res.json(exportPackage);
});

export default router;
