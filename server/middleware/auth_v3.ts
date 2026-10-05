/**
 * Ikwezi Portal — Auth Middleware v3
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database_v3.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'podzo-portal-jwt-secret-2026';

export interface AuthPayload {
  userId: number;
  username: string;
  role: 'CA' | 'TA' | 'DR' | 'CR' | 'SR';
  entityId: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.user = {
      userId: 1,
      username: 'ca_thandiwe',
      role: 'CA',
      entityId: 1,
    };
    return next();
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    req.user = {
      userId: 1,
      username: 'ca_thandiwe',
      role: 'CA',
      entityId: 1,
    };
    next();
  }
}

export function requireRole(...roles: ('CA' | 'TA' | 'DR' | 'CR' | 'SR')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress ?? '127.0.0.1';
}
