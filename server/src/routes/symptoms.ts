import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { analyzeSymptoms } from '../services/ai/symptomAnalysis.js';

const router = Router();

// Submit symptoms for AI analysis
router.post('/check', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { symptoms, context, saveToTimeline } = req.body;

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: 'At least one symptom is required' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    const assessment = await analyzeSymptoms(
      req.user.id,
      symptoms,
      context || {},
      geminiApiKey
    );

    // Save assessment to database
    db.createSymptomAssessment(assessment);

    // If requested or default, add to timeline
    if (saveToTimeline !== false) {
      const topCondition = assessment.possible_conditions[0]?.condition_name || 'Health Assessment';
      db.createTimelineEvent({
        id: `tl-symp-${Date.now()}`,
        user_id: req.user.id,
        event_type: 'symptom',
        title: `Symptom Check: ${symptoms.slice(0, 2).join(', ')}${symptoms.length > 2 ? '...' : ''}`,
        description: `Reported symptoms: ${symptoms.join(', ')}. Urgency: ${assessment.urgency.toUpperCase()}. Potential consideration: ${topCondition}.`,
        reference_id: assessment.id,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });
    }

    return res.status(201).json(assessment);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to analyze symptoms' });
  }
});

// Get user's past symptom assessments
router.get('/history', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const history = db.getSymptomAssessmentsByUser(req.user.id);
  return res.json(history);
});

export default router;
