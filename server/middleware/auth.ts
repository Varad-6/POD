/**
 * Ikwezi Portal — Auth Middleware
 * JWT-based, role-guarded, IP-logging
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database_v2.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'ikwezi-portal-jwt-secret-2026';

export interface AuthPayload {
  userId: number;
  username: string;
  role: string;
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
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
  };
}

/** Writes an immutable audit row on every state transition */
export function writeAudit(opts: {
  entityType: string;
  entityId: number;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  userId?: number;
  role?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO audit_log (entity_type, entity_id, action, from_status, to_status, performed_by_user_id, performed_by_role, metadata_json, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    opts.entityType,
    opts.entityId,
    opts.action,
    opts.fromStatus ?? null,
    opts.toStatus ?? null,
    opts.userId ?? null,
    opts.role ?? null,
    opts.metadata ? JSON.stringify(opts.metadata) : null,
    opts.ip ?? null
  );
}

/** Safely resolves IP from request (server-side, never trust client body) */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}
