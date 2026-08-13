/**
 * Freight Invoice + MIRO Invoice API
 * blocks_miro_bool enforced: POST /miro returns 403 if open review exists
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db/database_v2.js';
import { requireAuth, requireRole, writeAudit, getClientIp } from '../middleware/auth.js';

const router = Router();

// POST /api/v2/invoices/freight — TA submits freight invoice
router.post('/freight', requireAuth, requireRole('TRANSPORTER_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { dispatch_id, accepted_payload_kg, tax_invoice_no, tax_invoice_pdf_url } = req.body;
  if (!dispatch_id || !accepted_payload_kg) {
    return res.status(400).json({ error: 'dispatch_id and accepted_payload_kg required' });
  }

  const dispatch = db.prepare(`
    SELECT da.*, po.rate, po.tolerance_pct, po.target_qty, t.name as transporter_name
    FROM dispatch_assignments da
    JOIN purchase_orders po ON po.id = da.po_id
    LEFT JOIN transporters t ON t.id = da.transporter_id
    WHERE da.id = ?
  `).get(dispatch_id) as any;

  if (!dispatch) return res.status(404).json({ error: 'Dispatch not found' });
  if (dispatch.status !== 'APPROVED') return res.status(409).json({ error: 'Dispatch must be APPROVED to submit invoice' });

  // Tenant isolation
  if (dispatch.transporter_id !== req.user!.entityId) {
    return res.status(403).json({ error: 'Not your dispatch' });
  }

  const totalValue = (accepted_payload_kg / 1000) * dispatch.rate;

  const result = db.prepare(`
    INSERT INTO freight_invoices (dispatch_id, accepted_payload_kg, rate_per_uom, total_value, tax_invoice_no, tax_invoice_pdf_url, submitted_by_user_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
  `).run(dispatch_id, accepted_payload_kg, dispatch.rate, totalValue, tax_invoice_no ?? null, tax_invoice_pdf_url ?? null, req.user!.userId);

  db.prepare("UPDATE dispatch_assignments SET status = 'INVOICED', updated_at = datetime('now') WHERE id = ?").run(dispatch_id);

  writeAudit({ entityType: 'freight_invoice', entityId: Number(result.lastInsertRowid), action: 'INVOICE_SUBMITTED', toStatus: 'SUBMITTED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req), metadata: { total_value: totalValue } });

  return res.status(201).json({ id: result.lastInsertRowid, total_value: totalValue, message: 'Invoice submitted' });
});

// GET /api/v2/invoices/freight — List freight invoices
router.get('/freight', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  let query = `
    SELECT fi.*, da.status as dispatch_status, po.sap_po_no, po.material,
      t.name as transporter_name, cu.name as customer_name
    FROM freight_invoices fi
    JOIN dispatch_assignments da ON da.id = fi.dispatch_id
    JOIN purchase_orders po ON po.id = da.po_id
    JOIN contracts c ON c.id = po.contract_id
    JOIN customers cu ON cu.id = c.customer_id
    LEFT JOIN transporters t ON t.id = da.transporter_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (req.user!.role === 'TRANSPORTER_ADMIN') {
    query += ' AND da.transporter_id = ?'; params.push(req.user!.entityId);
  }
  query += ' ORDER BY fi.created_at DESC';

  return res.json(db.prepare(query).all(...params));
});

// PATCH /api/v2/invoices/freight/:id/approve — CA approves invoice
router.patch('/freight/:id/approve', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const inv = db.prepare('SELECT * FROM freight_invoices WHERE id = ?').get(req.params.id) as any;
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  if (inv.status !== 'SUBMITTED') return res.status(409).json({ error: 'Invoice not in SUBMITTED state' });

  db.prepare("UPDATE freight_invoices SET status = 'APPROVED', reviewed_by_user_id = ?, updated_at = datetime('now') WHERE id = ?").run(req.user!.userId, inv.id);
  writeAudit({ entityType: 'freight_invoice', entityId: inv.id, action: 'INVOICE_APPROVED', fromStatus: 'SUBMITTED', toStatus: 'APPROVED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req) });

  return res.json({ message: 'Invoice approved' });
});

// PATCH /api/v2/invoices/freight/:id/reject
router.patch('/freight/:id/reject', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { rejection_reason } = req.body;
  const inv = db.prepare('SELECT * FROM freight_invoices WHERE id = ?').get(req.params.id) as any;
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  db.prepare("UPDATE freight_invoices SET status = 'REJECTED', rejection_reason = ?, reviewed_by_user_id = ?, updated_at = datetime('now') WHERE id = ?").run(rejection_reason ?? 'No reason', req.user!.userId, inv.id);
  writeAudit({ entityType: 'freight_invoice', entityId: inv.id, action: 'INVOICE_REJECTED', fromStatus: inv.status, toStatus: 'REJECTED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req) });

  return res.json({ message: 'Invoice rejected' });
});

// POST /api/v2/invoices/miro — CA parks MIRO invoice (BLOCKED if open review exists)
router.post('/miro', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { freight_invoice_id, waybill_no } = req.body;
  if (!freight_invoice_id) return res.status(400).json({ error: 'freight_invoice_id required' });

  const freightInv = db.prepare('SELECT * FROM freight_invoices WHERE id = ? AND status = "APPROVED"').get(freight_invoice_id) as any;
  if (!freightInv) return res.status(404).json({ error: 'Approved freight invoice not found' });

  // CRITICAL: blocks_miro_bool check
  const openReview = db.prepare(`
    SELECT id FROM review_queue WHERE dispatch_id = ? AND status = 'OPEN' AND blocks_miro_bool = 1
  `).get(freightInv.dispatch_id) as any;

  if (openReview) {
    return res.status(403).json({
      error: 'MIRO blocked: Open review queue item exists. Resolve the review before posting to SAP.',
      review_id: openReview.id
    });
  }

  const sapInvoiceNo = `MIRO-${Date.now()}-${freightInv.id}`;
  const result = db.prepare(`
    INSERT INTO miro_invoices (freight_invoice_id, dispatch_id, sap_invoice_no, waybill_no, status)
    VALUES (?, ?, ?, ?, 'PARKED')
  `).run(freight_invoice_id, freightInv.dispatch_id, sapInvoiceNo, waybill_no ?? null);

  db.prepare("UPDATE dispatch_assignments SET status = 'MIRO_PARKED', updated_at = datetime('now') WHERE id = ?").run(freightInv.dispatch_id);

  // Simulate SAP BAPI sync log
  db.prepare(`
    INSERT INTO sap_sync_log (entity_type, entity_id, sap_ref, direction, payload_json, status)
    VALUES ('INVOICE', ?, ?, 'OUT', ?, 'SUCCESS')
  `).run(result.lastInsertRowid, sapInvoiceNo, JSON.stringify({ freight_invoice_id, waybill_no, total: freightInv.total_value }));

  writeAudit({ entityType: 'miro_invoice', entityId: Number(result.lastInsertRowid), action: 'MIRO_PARKED', toStatus: 'PARKED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req) });
  return res.status(201).json({ id: result.lastInsertRowid, sap_invoice_no: sapInvoiceNo, message: 'MIRO parked' });
});

// PATCH /api/v2/invoices/miro/:id/post — CA posts MIRO to SAP
router.patch('/miro/:id/post', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const miro = db.prepare('SELECT * FROM miro_invoices WHERE id = ? AND status = "PARKED"').get(req.params.id) as any;
  if (!miro) return res.status(404).json({ error: 'Parked MIRO not found' });

  const bapiRef = `BAPI-${Date.now()}-${req.user!.userId}`;
  db.prepare("UPDATE miro_invoices SET status = 'POSTED', posted_date = datetime('now'), sap_bapi_ref = ?, posted_by_user_id = ?, updated_at = datetime('now') WHERE id = ?").run(bapiRef, req.user!.userId, miro.id);
  db.prepare("UPDATE dispatch_assignments SET status = 'MIRO_POSTED', updated_at = datetime('now') WHERE id = ?").run(miro.dispatch_id);

  writeAudit({ entityType: 'miro_invoice', entityId: miro.id, action: 'MIRO_POSTED', fromStatus: 'PARKED', toStatus: 'POSTED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req) });
  return res.json({ message: 'MIRO posted to SAP', sap_bapi_ref: bapiRef });
});

// PATCH /api/v2/invoices/miro/:id/clear — CA marks payment cleared
router.patch('/miro/:id/clear', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { payment_ref } = req.body;
  const miro = db.prepare('SELECT * FROM miro_invoices WHERE id = ? AND status = "POSTED"').get(req.params.id) as any;
  if (!miro) return res.status(404).json({ error: 'Posted MIRO not found' });

  db.prepare("UPDATE miro_invoices SET status = 'CLEARED', cleared_date = datetime('now'), payment_ref = ?, cleared_by_user_id = ?, updated_at = datetime('now') WHERE id = ?").run(payment_ref ?? null, req.user!.userId, miro.id);
  db.prepare("UPDATE dispatch_assignments SET status = 'CLEARED', updated_at = datetime('now') WHERE id = ?").run(miro.dispatch_id);

  writeAudit({ entityType: 'miro_invoice', entityId: miro.id, action: 'PAYMENT_CLEARED', fromStatus: 'POSTED', toStatus: 'CLEARED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req), metadata: { payment_ref } });
  return res.json({ message: 'Payment cleared' });
});

// GET /api/v2/invoices/miro
router.get('/miro', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT mi.*, fi.total_value, fi.tax_invoice_no, fi.accepted_payload_kg,
      po.sap_po_no, po.material, t.name as transporter_name, cu.name as customer_name
    FROM miro_invoices mi
    JOIN freight_invoices fi ON fi.id = mi.freight_invoice_id
    JOIN dispatch_assignments da ON da.id = mi.dispatch_id
    JOIN purchase_orders po ON po.id = da.po_id
    JOIN contracts c ON c.id = po.contract_id
    JOIN customers cu ON cu.id = c.customer_id
    LEFT JOIN transporters t ON t.id = da.transporter_id
    ORDER BY mi.created_at DESC
  `).all();
  return res.json(rows);
});

export default router;
