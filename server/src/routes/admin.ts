import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get Admin platform metrics
router.get('/stats', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response) => {
  const stats = db.getStats();
  return res.json({
    stats,
    system_status: 'Healthy',
    timestamp: new Date().toISOString()
  });
});

// Admin adds a doctor
router.post('/doctors', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      specialty,
      qualifications,
      experience_years,
      hospital_affiliation,
      location,
      city,
      postal_code,
      consultation_types,
      languages,
      available_hours,
      contact_phone,
      contact_email,
      image_url,
      rating,
      review_count
    } = req.body;

    if (!name || !specialty || !city) {
      return res.status(400).json({ error: 'Name, specialty, and city are required' });
    }

    const doctor = db.addDoctor({
      id: `doc-${Date.now()}`,
      name,
      specialty,
      qualifications: qualifications || 'MD',
      experience_years: Number(experience_years) || 5,
      hospital_affiliation: hospital_affiliation || 'General Hospital',
      location: location || 'Medical Suite',
      city,
      postal_code: postal_code || '10001',
      consultation_types: consultation_types || ['in_person'],
      languages: languages || ['English'],
      available_hours: available_hours || 'Mon - Fri: 9:00 AM - 5:00 PM',
      contact_phone: contact_phone || '+1 (555) 000-0000',
      contact_email: contact_email || 'info@provider.org',
      image_url: image_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      rating: Number(rating) || 4.5,
      review_count: Number(review_count) || 0
    });

    return res.status(201).json(doctor);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add doctor' });
  }
});

// Admin adds a hospital
router.post('/hospitals', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      hospital_type,
      address,
      city,
      postal_code,
      distance_km,
      emergency_services,
      trauma_level,
      specialties,
      contact_phone,
      emergency_phone,
      website,
      directions_url
      ,rating,
      review_count
    } = req.body;

    if (!name || !city || !address) {
      return res.status(400).json({ error: 'Name, address, and city are required' });
    }

    const hospital = db.addHospital({
      id: `hosp-${Date.now()}`,
      name,
      hospital_type: hospital_type || 'General Hospital',
      address,
      city,
      postal_code: postal_code || '10001',
      distance_km: Number(distance_km) || 3.0,
      emergency_services: Boolean(emergency_services),
      trauma_level: trauma_level || 'Emergency Care',
      specialties: Array.isArray(specialties) ? specialties : ['Emergency Medicine', 'General Surgery'],
      contact_phone: contact_phone || '+1 (555) 000-0000',
      emergency_phone: emergency_phone || '+1 (555) 911-0000',
      website: website || 'https://hospital.org',
      directions_url: directions_url || 'https://maps.google.com'
      ,rating: Number(rating) || 4.5,
      review_count: Number(review_count) || 0
    });

    return res.status(201).json(hospital);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add hospital' });
  }
});

// Admin adds a diagnostic lab
router.post('/labs', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      address,
      city,
      postal_code,
      available_tests,
      home_sample_collection,
      accreditations,
      operating_hours,
      contact_phone,
      contact_email,
      booking_url
    } = req.body;

    if (!name || !city || !address) {
      return res.status(400).json({ error: 'Name, address, and city are required' });
    }

    const lab = db.addDiagnosticLab({
      id: `lab-org-${Date.now()}`,
      name,
      address,
      city,
      postal_code: postal_code || '10001',
      available_tests: Array.isArray(available_tests) ? available_tests : ['Routine Blood Work'],
      home_sample_collection: Boolean(home_sample_collection),
      accreditations: Array.isArray(accreditations) ? accreditations : ['CLIA Certified'],
      operating_hours: operating_hours || 'Mon - Sat: 8:00 AM - 6:00 PM',
      contact_phone: contact_phone || '+1 (555) 000-0000',
      contact_email: contact_email || 'lab@diagnostic.org',
      booking_url: booking_url || 'https://diagnostic.org'
    });

    return res.status(201).json(lab);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add diagnostic lab' });
  }
});

export default router;
