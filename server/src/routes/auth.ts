import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/db.js';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userId = `usr-${Date.now()}`;

    const newUser = db.createUser({
      id: userId,
      email,
      password_hash,
      role: 'patient',
      created_at: new Date().toISOString()
    });

    db.upsertProfile({
      user_id: userId,
      name,
      updated_at: new Date().toISOString()
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const profile = db.getProfile(user.id);
    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: profile?.name || 'User'
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// One-Click Demo Mode Login (Instant access to pre-seeded Sarah Jenkins patient)
router.post('/demo-login', async (req: Request, res: Response) => {
  try {
    const demoUser = db.findUserByEmail('demo@medscan.ai');
    if (!demoUser) {
      return res.status(404).json({ error: 'Demo user not found. Please run seed script.' });
    }

    const profile = db.getProfile(demoUser.id);
    const token = generateToken(demoUser);

    return res.json({
      token,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        role: demoUser.role,
        name: profile?.name || 'Sarah Jenkins (Demo Patient)',
        isDemo: true
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Current User Profile
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const user = db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const profile = db.getProfile(user.id);

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: profile?.name || 'User',
      isDemo: user.email === 'demo@medscan.ai'
    },
    profile
  });
});

export default router;
