import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get health timeline for current user
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { type } = req.query;
  let timeline = db.getTimelineByUser(req.user.id);

  if (type && type !== 'all') {
    timeline = timeline.filter(t => t.event_type === type);
  }

  return res.json(timeline);
});

// Add manual timeline event (e.g. past appointment, medication change)
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { event_type, title, description, date } = req.body;

    if (!title || !event_type) {
      return res.status(400).json({ error: 'Event type and title are required' });
    }

    const event = db.createTimelineEvent({
      id: `tl-${Date.now()}`,
      user_id: req.user.id,
      event_type: event_type || 'appointment',
      title,
      description: description || '',
      date: date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    });

    return res.status(201).json(event);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add timeline event' });
  }
});

export default router;
