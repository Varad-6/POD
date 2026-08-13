/**
 * Ikwezi Portal — Auth Routes
 * POST /api/v2/auth/login
 * POST /api/v2/auth/logout
 * GET  /api/v2/auth/me
 */
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database_v2.js';
import { JWT_SECRET, requireAuth, getClientIp } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const db = getDb();
  const user = db.prepare(
    'SELECT id, username, password_hash, role, display_name, email, entity_id FROM users WHERE username = ? AND is_active = 1'
  ).get(username) as any;

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    entityId: user.entity_id,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

  // Log session
  const ip = getClientIp(req);
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  const sessionId = crypto.randomUUID();
  db.prepare(
    'INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(sessionId, user.id, ip, req.headers['user-agent'] ?? '', expiresAt);

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.display_name,
      email: user.email,
      entityId: user.entity_id,
    }
  });
});

router.get('/me', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, username, role, display_name, email, entity_id FROM users WHERE id = ?'
  ).get(req.user!.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.display_name,
    email: user.email,
    entityId: user.entity_id,
  });
});

router.post('/logout', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  // Revoke all sessions for user (simple approach)
  db.prepare('UPDATE sessions SET is_revoked = 1 WHERE user_id = ?').run(req.user!.userId);
  return res.json({ message: 'Logged out successfully' });
});

export default router;
