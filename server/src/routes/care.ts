import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getCareRecommendations } from '../services/care/careRecommendations.js';

const router = Router();

router.post('/recommendations', (req: Request, res: Response) => {
  const { conditions, flaggedTests, city, urgent } = req.body;

  if (!Array.isArray(conditions) && !Array.isArray(flaggedTests)) {
    return res.status(400).json({ error: 'Conditions or flagged report markers are required' });
  }

  return res.json(getCareRecommendations({ conditions, flaggedTests, city, urgent }));
});

// Search Doctors
router.get('/doctors', (req: Request, res: Response) => {
  const { specialty, city, consultation_type, search } = req.query;

  const results = db.searchDoctors({
    specialty: specialty as string,
    city: city as string,
    consultation_type: consultation_type as any,
    search: search as string
  });

  return res.json({
    disclaimer: 'Doctors matching your selected criteria. MedScan AI does not rank or certify physicians.',
    total: results.length,
    doctors: results
  });
});

router.get('/doctors/:doctorId/availability', (req: Request, res: Response) => {
  const doctor = db.getData().doctors.find(item => item.id === req.params.doctorId);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  const slots = ['09:00', '10:30', '13:30', '15:00'].map((time, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    return { date: date.toISOString().split('T')[0], time };
  });

  return res.json({ doctor_id: doctor.id, slots });
});

router.get('/appointments', authenticateToken, (req: AuthRequest, res: Response) => {
  return res.json({ appointments: db.getAppointmentsByUser(req.user!.id) });
});

// Search Hospitals
router.get('/hospitals', (req: Request, res: Response) => {
  const { city, emergency_only, specialty, search } = req.query;

  const results = db.searchHospitals({
    city: city as string,
    emergency_only: emergency_only === 'true',
    specialty: specialty as string,
    search: search as string
  });

  return res.json({
    disclaimer: 'Service and emergency availability can change dynamically. Always contact the hospital directly to confirm in an urgent situation.',
    total: results.length,
    hospitals: results
  });
});

// Search Diagnostic Labs
router.get('/labs', (req: Request, res: Response) => {
  const { city, home_collection_only, test, search } = req.query;

  const results = db.searchDiagnosticLabs({
    city: city as string,
    home_collection_only: home_collection_only === 'true',
    test: test as string,
    search: search as string
  });

  return res.json({
    disclaimer: 'Prices, test availability, and sample pickup schedules may vary. Confirm directly with the diagnostic laboratory.',
    total: results.length,
    labs: results
  });
});

// Book appointment / Contact request mock endpoint
router.post('/appointments/request', authenticateToken, (req: AuthRequest, res: Response) => {
  const { provider_id, provider_type, patient_name, preferred_date, time = '09:00' } = req.body;

  if (!provider_id || !patient_name || !preferred_date) {
    return res.status(400).json({ error: 'Provider, patient name, and date are required' });
  }

  const doctor = db.getData().doctors.find(item => item.id === provider_id);
  const appointment = db.createAppointment({
    id: `apt-${Date.now()}`,
    user_id: req.user!.id,
    provider_id,
    provider_name: doctor?.name || provider_id,
    provider_type: provider_type || 'Doctor Consultation',
    specialty: doctor?.specialty,
    date: preferred_date,
    time,
    patient_name,
    status: 'confirmed',
    created_at: new Date().toISOString()
  });

  return res.status(201).json({
    success: true,
    message: 'Appointment booked. Please call the clinic if you need to change it.',
    appointment_reference: appointment.id,
    appointment
  });
});

export default router;
