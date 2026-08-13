/**
 * Purchase Orders API
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db/database_v2.js';
import { requireAuth, requireRole, writeAudit, getClientIp } from '../middleware/auth.js';

const router = Router();

// GET /api/v2/pos
router.get('/', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const { status, contract_id } = req.query;

  let query = `
    SELECT po.*, c.sap_contract_no, cu.name as customer_name, cu.id as customer_id_ref
    FROM purchase_orders po
    JOIN contracts c ON c.id = po.contract_id
    JOIN customers cu ON cu.id = c.customer_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) { query += ' AND po.status = ?'; params.push(status); }
  if (contract_id) { query += ' AND po.contract_id = ?'; params.push(contract_id); }
  query += ' ORDER BY po.created_at DESC';

  return res.json(db.prepare(query).all(...params));
});

// GET /api/v2/pos/:id
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const po = db.prepare(`
    SELECT po.*, c.sap_contract_no, cu.name as customer_name
    FROM purchase_orders po
    JOIN contracts c ON c.id = po.contract_id
    JOIN customers cu ON cu.id = c.customer_id
    WHERE po.id = ?
  `).get(req.params.id) as any;

  if (!po) return res.status(404).json({ error: 'PO not found' });

  const dispatches = db.prepare(`
    SELECT da.*, d.name as driver_name, v.reg_no as vehicle_reg, t.name as transporter_name
    FROM dispatch_assignments da
    LEFT JOIN drivers d ON d.id = da.driver_id
    LEFT JOIN vehicles v ON v.id = da.vehicle_id
    LEFT JOIN transporters t ON t.id = da.transporter_id
    WHERE da.po_id = ?
    ORDER BY da.created_at DESC
  `).all(po.id);

  return res.json({ ...po, dispatches });
});

// POST /api/v2/pos
router.post('/', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { contract_id, sap_po_no, material, uom, target_qty, rate, tolerance_pct, cost_center, from_location, to_location, payment_terms } = req.body;

  if (!contract_id || !sap_po_no || !material || !target_qty || !rate || !from_location || !to_location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = db.prepare(`
    INSERT INTO purchase_orders (contract_id, sap_po_no, material, uom, target_qty, rate, tolerance_pct, cost_center, from_location, to_location, payment_terms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(contract_id, sap_po_no, material, uom ?? 'TON', target_qty, rate, tolerance_pct ?? 0.5, cost_center ?? null, from_location, to_location, payment_terms ?? 'Net 30');

  writeAudit({
    entityType: 'purchase_order', entityId: Number(result.lastInsertRowid),
    action: 'RECORD_CREATED', toStatus: 'OPEN',
    userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req)
  });

  db.prepare(`
    INSERT INTO sap_sync_log (entity_type, entity_id, sap_ref, direction, payload_json, status)
    VALUES ('PO', ?, ?, 'IN', ?, 'SUCCESS')
  `).run(result.lastInsertRowid, sap_po_no, JSON.stringify(req.body));

  return res.status(201).json({ id: result.lastInsertRowid, message: 'PO created' });
});

export default router;
