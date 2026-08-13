/**
 * Contracts API — GET/POST/PUT
 * Role access: CA can create; all roles can read
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db/database_v2.js';
import { requireAuth, requireRole, writeAudit, getClientIp } from '../middleware/auth.js';

const router = Router();

// GET /api/v2/contracts
router.get('/', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.*, cu.name as customer_name, cu.sap_customer_no
    FROM contracts c
    JOIN customers cu ON cu.id = c.customer_id
    ORDER BY c.created_at DESC
  `).all();
  return res.json(rows);
});

// GET /api/v2/contracts/:id
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const contract = db.prepare(`
    SELECT c.*, cu.name as customer_name
    FROM contracts c JOIN customers cu ON cu.id = c.customer_id
    WHERE c.id = ?
  `).get(req.params.id) as any;

  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  const pos = db.prepare('SELECT * FROM purchase_orders WHERE contract_id = ?').all(contract.id);
  return res.json({ ...contract, purchase_orders: pos });
});

// POST /api/v2/contracts
router.post('/', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { sap_contract_no, customer_id, start_date, end_date, material, uom, terms, pdf_url } = req.body;

  if (!sap_contract_no || !customer_id || !start_date || !end_date || !material) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = db.prepare(`
    INSERT INTO contracts (sap_contract_no, customer_id, start_date, end_date, material, uom, terms, pdf_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(sap_contract_no, customer_id, start_date, end_date, material, uom ?? 'TON', terms ?? null, pdf_url ?? null);

  writeAudit({
    entityType: 'contract', entityId: Number(result.lastInsertRowid),
    action: 'RECORD_CREATED', toStatus: 'ACTIVE',
    userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req)
  });

  // Log SAP sync
  db.prepare(`
    INSERT INTO sap_sync_log (entity_type, entity_id, sap_ref, direction, payload_json, status)
    VALUES ('CONTRACT', ?, ?, 'IN', ?, 'SUCCESS')
  `).run(result.lastInsertRowid, sap_contract_no, JSON.stringify(req.body));

  return res.status(201).json({ id: result.lastInsertRowid, message: 'Contract created' });
});

// PUT /api/v2/contracts/:id/status
router.put('/:id/status', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { status } = req.body;
  if (!['ACTIVE','EXPIRED','TERMINATED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const existing = db.prepare('SELECT status FROM contracts WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare('UPDATE contracts SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, req.params.id);

  writeAudit({
    entityType: 'contract', entityId: Number(req.params.id),
    action: 'STATUS_CHANGE', fromStatus: existing.status, toStatus: status,
    userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req)
  });

  return res.json({ message: 'Status updated' });
});

// GET /api/v2/contracts/:id/pos
router.get('/:id/pos', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM purchase_orders WHERE contract_id = ? ORDER BY created_at DESC').all(req.params.id);
  return res.json(rows);
});

export default router;
