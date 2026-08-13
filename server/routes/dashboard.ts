/**
 * Dashboard Stats + Audit Log API
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db/database_v2.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/v2/dashboard/stats — Role-aware summary stats
router.get('/stats', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const { role, entityId } = req.user!;

  if (role === 'COMPANY_ADMIN') {
    const totalDispatches = (db.prepare("SELECT COUNT(*) as c FROM dispatch_assignments WHERE status != 'CANCELLED'").get() as any).c;
    const activeDispatches = (db.prepare("SELECT COUNT(*) as c FROM dispatch_assignments WHERE status IN ('ASSIGNED','MINE_WEIGHED','DISPATCHED','EN_ROUTE','ARRIVED','DEST_WEIGHED')").get() as any).c;
    const pendingReview = (db.prepare("SELECT COUNT(*) as c FROM review_queue WHERE status = 'OPEN'").get() as any).c;
    const pendingInvoices = (db.prepare("SELECT COUNT(*) as c FROM freight_invoices WHERE status = 'SUBMITTED'").get() as any).c;
    const miroParked = (db.prepare("SELECT COUNT(*) as c FROM miro_invoices WHERE status = 'PARKED'").get() as any).c;
    const totalPayload = (db.prepare("SELECT COALESCE(SUM(accepted_payload_kg)/1000.0, 0) as t FROM freight_invoices WHERE status IN ('APPROVED','SUBMITTED')").get() as any).t;
    const totalRevenue = (db.prepare("SELECT COALESCE(SUM(total_value), 0) as t FROM freight_invoices WHERE status IN ('APPROVED','SUBMITTED')").get() as any).t;

    const statusBreakdown = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM dispatch_assignments
      GROUP BY status
      ORDER BY count DESC
    `).all();

    const recentDispatches = db.prepare(`
      SELECT da.id, da.status, da.updated_at, po.sap_po_no, po.material,
        d.name as driver_name, t.name as transporter_name, cu.name as customer_name
      FROM dispatch_assignments da
      JOIN purchase_orders po ON po.id = da.po_id
      JOIN contracts c ON c.id = po.contract_id
      JOIN customers cu ON cu.id = c.customer_id
      LEFT JOIN drivers d ON d.id = da.driver_id
      LEFT JOIN transporters t ON t.id = da.transporter_id
      ORDER BY da.updated_at DESC LIMIT 10
    `).all();

    return res.json({ totalDispatches, activeDispatches, pendingReview, pendingInvoices, miroParked, totalPayloadTonnes: totalPayload, totalRevenue, statusBreakdown, recentDispatches });
  }

  if (role === 'TRANSPORTER_ADMIN') {
    const total = (db.prepare("SELECT COUNT(*) as c FROM dispatch_assignments WHERE transporter_id = ?").get(entityId) as any).c;
    const pending = (db.prepare("SELECT COUNT(*) as c FROM dispatch_assignments WHERE transporter_id = ? AND status = 'PENDING_TA'").get(entityId) as any).c;
    const active = (db.prepare("SELECT COUNT(*) as c FROM dispatch_assignments WHERE transporter_id = ? AND status IN ('ASSIGNED','DISPATCHED','EN_ROUTE')").get(entityId) as any).c;
    const expiringLicenses = db.prepare("SELECT name, license_expiry, prdp_expiry FROM drivers WHERE transporter_id = ? AND (license_expiry < date('now', '+30 days') OR prdp_expiry < date('now', '+30 days'))").all(entityId);
    return res.json({ total, pendingAssignment: pending, active, expiringLicenses });
  }

  if (role === 'DRIVER') {
    const myDispatches = db.prepare(`
      SELECT da.id, da.status, da.scheduled_date, po.sap_po_no, po.material, po.from_location, po.to_location
      FROM dispatch_assignments da JOIN purchase_orders po ON po.id = da.po_id
      WHERE da.driver_id = ? ORDER BY da.updated_at DESC LIMIT 5
    `).all(entityId);
    const current = myDispatches.find((d: any) => !['CANCELLED','CLEARED','APPROVED'].includes(d.status));
    return res.json({ currentDispatch: current ?? null, recentDispatches: myDispatches });
  }

  if (role === 'CUSTOMER') {
    const incoming = (db.prepare(`
      SELECT COUNT(*) as c FROM dispatch_assignments da
      JOIN purchase_orders po ON po.id = da.po_id
      JOIN contracts c ON c.id = po.contract_id
      WHERE c.customer_id = ? AND da.status IN ('EN_ROUTE','DISPATCHED')
    `).get(entityId) as any).c;

    const totalReceived = (db.prepare(`
      SELECT COALESCE(SUM(wl.weight_kg), 0) as t FROM weighbridge_logs wl
      JOIN dispatch_assignments da ON da.id = wl.dispatch_id
      JOIN purchase_orders po ON po.id = da.po_id
      JOIN contracts c ON c.id = po.contract_id
      WHERE c.customer_id = ? AND wl.checkpoint = 'DEST_GROSS'
    `).get(entityId) as any).t;

    return res.json({ incomingTrucks: incoming, totalReceivedKg: totalReceived });
  }

  if (role === 'SUPERVISOR') {
    const pendingGate = (db.prepare("SELECT COUNT(*) as c FROM dispatch_assignments WHERE status = 'ASSIGNED'").get() as any).c;
    const held = (db.prepare("SELECT COUNT(*) as c FROM dispatch_assignments WHERE status = 'DISPATCH_HELD'").get() as any).c;
    const todayDispatched = (db.prepare("SELECT COUNT(*) as c FROM dispatch_assignments WHERE status = 'DISPATCHED' AND date(updated_at) = date('now')").get() as any).c;
    return res.json({ pendingGateCheck: pendingGate, heldDispatches: held, todayDispatched });
  }

  return res.json({});
});

// GET /api/v2/dashboard/audit-log
router.get('/audit-log', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { entity_type, entity_id, limit = 50 } = req.query;
  let query = `
    SELECT al.*, u.display_name as performed_by_name
    FROM audit_log al LEFT JOIN users u ON u.id = al.performed_by_user_id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (entity_type) { query += ' AND al.entity_type = ?'; params.push(entity_type); }
  if (entity_id) { query += ' AND al.entity_id = ?'; params.push(entity_id); }
  query += ` ORDER BY al.created_at DESC LIMIT ?`;
  params.push(Number(limit));

  return res.json(db.prepare(query).all(...params));
});

// GET /api/v2/dashboard/sap-sync
router.get('/sap-sync', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM sap_sync_log ORDER BY synced_at DESC LIMIT 100').all();
  return res.json(rows);
});

export default router;
