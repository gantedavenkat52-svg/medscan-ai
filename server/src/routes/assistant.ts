import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { askAssistant } from '../services/ai/medicalEducation.js';

const router = Router();

// Ask MedScan Assistant a question
router.post('/ask', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'A question or message is required' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const response = await askAssistant(req.user.id, message.trim(), geminiApiKey);

    // Save conversation to user's history
    let conv = db.getAIConversation(req.user.id);
    const now = new Date().toISOString();

    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        user_id: req.user.id,
        title: message.slice(0, 40) + '...',
        messages: [],
        updated_at: now,
        created_at: now
      };
    }

    conv.messages.push({
      role: 'user',
      content: message,
      timestamp: now,
      safety_evaluated: true
    });

    conv.messages.push({
      role: 'assistant',
      content: response.answer,
      timestamp: new Date().toISOString(),
      safety_evaluated: true
    });

    db.saveAIConversation(conv);

    return res.json({
      answer: response.answer,
      isEmergency: response.isEmergency,
      disclaimer: response.disclaimer,
      conversationId: conv.id
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to process assistant question' });
  }
});

// Get user's assistant conversation history
router.get('/history', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const conv = db.getAIConversation(req.user.id);
  return res.json(conv || { messages: [] });
});

export default router;
