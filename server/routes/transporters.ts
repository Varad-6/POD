/**
 * Transporters, Drivers, Vehicles API
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db/database_v2.js';
import { requireAuth, requireRole, writeAudit, getClientIp } from '../middleware/auth.js';

const router = Router();

// ── TRANSPORTERS ──────────────────────────────────────────────

router.get('/', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM transporters WHERE is_active = 1 ORDER BY name').all();
  return res.json(rows);
});

router.post('/', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { name, gstin, contact_name, contact_phone, contact_email } = req.body;
  if (!name || !gstin) return res.status(400).json({ error: 'name and gstin required' });

  const result = db.prepare(
    'INSERT INTO transporters (name, gstin, contact_name, contact_phone, contact_email) VALUES (?, ?, ?, ?, ?)'
  ).run(name, gstin, contact_name ?? null, contact_phone ?? null, contact_email ?? null);

  writeAudit({ entityType: 'transporter', entityId: Number(result.lastInsertRowid), action: 'RECORD_CREATED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req) });
  return res.status(201).json({ id: result.lastInsertRowid });
});

// ── DRIVERS ───────────────────────────────────────────────────

router.get('/:transporterId/drivers', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM drivers WHERE transporter_id = ? AND is_active = 1').all(req.params.transporterId);
  return res.json(rows);
});

router.post('/:transporterId/drivers', requireAuth, requireRole('COMPANY_ADMIN', 'TRANSPORTER_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { name, license_no, license_expiry, prdp_no, prdp_expiry, phone } = req.body;
  if (!name || !license_no || !license_expiry || !prdp_no || !prdp_expiry) {
    return res.status(400).json({ error: 'Missing required driver fields' });
  }

  const result = db.prepare(
    'INSERT INTO drivers (transporter_id, name, license_no, license_expiry, prdp_no, prdp_expiry, phone) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.transporterId, name, license_no, license_expiry, prdp_no, prdp_expiry, phone ?? null);

  writeAudit({ entityType: 'driver', entityId: Number(result.lastInsertRowid), action: 'RECORD_CREATED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req) });
  return res.status(201).json({ id: result.lastInsertRowid });
});

// ── VEHICLES ──────────────────────────────────────────────────

router.get('/:transporterId/vehicles', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM vehicles WHERE transporter_id = ? AND is_active = 1').all(req.params.transporterId);
  return res.json(rows);
});

router.post('/:transporterId/vehicles', requireAuth, requireRole('COMPANY_ADMIN', 'TRANSPORTER_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { reg_no, trailer1_reg, trailer2_reg, capacity_tonnes } = req.body;
  if (!reg_no) return res.status(400).json({ error: 'reg_no required' });

  const result = db.prepare(
    'INSERT INTO vehicles (transporter_id, reg_no, trailer1_reg, trailer2_reg, capacity_tonnes) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.transporterId, reg_no, trailer1_reg ?? null, trailer2_reg ?? null, capacity_tonnes ?? null);

  writeAudit({ entityType: 'vehicle', entityId: Number(result.lastInsertRowid), action: 'RECORD_CREATED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req) });
  return res.status(201).json({ id: result.lastInsertRowid });
});

// GET all drivers (CA uses this for overview)
router.get('/drivers/all', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT d.*, t.name as transporter_name,
      CASE WHEN d.license_expiry < date('now') THEN 1 ELSE 0 END as license_expired,
      CASE WHEN d.prdp_expiry < date('now') THEN 1 ELSE 0 END as prdp_expired
    FROM drivers d JOIN transporters t ON t.id = d.transporter_id
    WHERE d.is_active = 1
    ORDER BY t.name, d.name
  `).all();
  return res.json(rows);
});

export default router;
