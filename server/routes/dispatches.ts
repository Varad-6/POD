/**
 * Dispatch Assignments API — The core pipeline
 * Status machine enforced server-side
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db/database_v2.js';
import { requireAuth, requireRole, writeAudit, getClientIp } from '../middleware/auth.js';

const router = Router();

/** Helper to get full dispatch with joins */
function getDispatch(id: number | string) {
  const db = getDb();
  return db.prepare(`
    SELECT
      da.*,
      po.sap_po_no, po.material, po.uom, po.target_qty, po.rate, po.tolerance_pct,
      po.from_location, po.to_location, po.cost_center,
      d.name as driver_name, d.license_no, d.license_expiry, d.prdp_no, d.prdp_expiry, d.phone as driver_phone,
      v.reg_no as vehicle_reg, v.trailer1_reg, v.trailer2_reg, v.capacity_tonnes,
      t.name as transporter_name, t.gstin as transporter_gstin,
      c.sap_contract_no, cu.name as customer_name, cu.gps_lat as dest_lat, cu.gps_lng as dest_lng, cu.geofence_radius_m
    FROM dispatch_assignments da
    JOIN purchase_orders po ON po.id = da.po_id
    JOIN contracts c ON c.id = po.contract_id
    JOIN customers cu ON cu.id = c.customer_id
    LEFT JOIN drivers d ON d.id = da.driver_id
    LEFT JOIN vehicles v ON v.id = da.vehicle_id
    LEFT JOIN transporters t ON t.id = da.transporter_id
    WHERE da.id = ?
  `).get(id) as any;
}

// GET /api/v2/dispatches
router.get('/', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const { status, transporter_id, driver_id, po_id } = req.query;

  let query = `
    SELECT
      da.id, da.status, da.scheduled_date, da.sr_arrival_date, da.created_at, da.updated_at,
      po.sap_po_no, po.material, po.from_location, po.to_location,
      d.name as driver_name, d.phone as driver_phone,
      v.reg_no as vehicle_reg,
      t.name as transporter_name,
      cu.name as customer_name, cu.id as customer_id,
      c.sap_contract_no
    FROM dispatch_assignments da
    JOIN purchase_orders po ON po.id = da.po_id
    JOIN contracts c ON c.id = po.contract_id
    JOIN customers cu ON cu.id = c.customer_id
    LEFT JOIN drivers d ON d.id = da.driver_id
    LEFT JOIN vehicles v ON v.id = da.vehicle_id
    LEFT JOIN transporters t ON t.id = da.transporter_id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Tenant isolation: TRANSPORTER_ADMIN sees only their dispatches
  if (req.user!.role === 'TRANSPORTER_ADMIN') {
    query += ' AND da.transporter_id = ?'; params.push(req.user!.entityId);
  }
  // DRIVER sees only their dispatches
  if (req.user!.role === 'DRIVER') {
    query += ' AND da.driver_id = ?'; params.push(req.user!.entityId);
  }
  // CUSTOMER sees only their customer dispatches
  if (req.user!.role === 'CUSTOMER') {
    query += ' AND cu.id = ?'; params.push(req.user!.entityId);
  }

  if (status) { query += ' AND da.status = ?'; params.push(status); }
  if (transporter_id && req.user!.role === 'COMPANY_ADMIN') { query += ' AND da.transporter_id = ?'; params.push(transporter_id); }
  if (driver_id) { query += ' AND da.driver_id = ?'; params.push(driver_id); }
  if (po_id) { query += ' AND da.po_id = ?'; params.push(po_id); }

  query += ' ORDER BY da.updated_at DESC';
  return res.json(db.prepare(query).all(...params));
});

// GET /api/v2/dispatches/:id
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const dispatch = getDispatch(req.params.id);
  if (!dispatch) return res.status(404).json({ error: 'Dispatch not found' });

  // Attach weighbridge logs
  const weights = db.prepare('SELECT * FROM weighbridge_logs WHERE dispatch_id = ? ORDER BY timestamp').all(dispatch.id);
  const gateCheck = db.prepare('SELECT * FROM gate_checks WHERE dispatch_id = ? ORDER BY checked_at DESC LIMIT 1').get(dispatch.id);
  const bilty = db.prepare('SELECT * FROM bilty_records WHERE dispatch_id = ?').get(dispatch.id);
  const transit = db.prepare('SELECT * FROM transit_events WHERE dispatch_id = ? ORDER BY timestamp').all(dispatch.id);
  const arrivalConf = db.prepare('SELECT * FROM arrival_confirmations WHERE dispatch_id = ?').get(dispatch.id);
  const deliveryMeta = db.prepare('SELECT * FROM delivery_metadata WHERE dispatch_id = ?').get(dispatch.id);
  const pod = db.prepare('SELECT * FROM pod_documents WHERE dispatch_id = ? ORDER BY created_at DESC LIMIT 1').get(dispatch.id);
  const review = db.prepare('SELECT * FROM review_queue WHERE dispatch_id = ? AND status = "OPEN"').get(dispatch.id);
  const freightInv = db.prepare('SELECT * FROM freight_invoices WHERE dispatch_id = ?').get(dispatch.id);
  const miroInv = db.prepare('SELECT * FROM miro_invoices WHERE dispatch_id = ?').get(dispatch.id);

  // Compute net weights
  const mineGross = (weights as any[]).find(w => w.checkpoint === 'MINE_GROSS')?.weight_kg;
  const mineTare  = (weights as any[]).find(w => w.checkpoint === 'MINE_TARE')?.weight_kg;
  const destGross = (weights as any[]).find(w => w.checkpoint === 'DEST_GROSS')?.weight_kg;
  const destTare  = (weights as any[]).find(w => w.checkpoint === 'DEST_TARE')?.weight_kg;

  const mineNetKg = (mineGross && mineTare) ? mineGross - mineTare : null;
  const destNetKg = (destGross && destTare) ? destGross - destTare : null;
  const varianceKg = (mineNetKg && destNetKg) ? Math.abs(mineNetKg - destNetKg) : null;
  const variancePct = (mineNetKg && varianceKg) ? (varianceKg / mineNetKg) * 100 : null;

  return res.json({
    ...dispatch,
    weighbridge_logs: weights,
    gate_check: gateCheck,
    bilty,
    transit_events: transit,
    arrival_confirmation: arrivalConf,
    delivery_metadata: deliveryMeta,
    pod_document: pod,
    review_queue: review,
    freight_invoice: freightInv,
    miro_invoice: miroInv,
    computed: {
      mine_gross_kg: mineGross ?? null,
      mine_tare_kg: mineTare ?? null,
      mine_net_kg: mineNetKg,
      mine_net_tonnes: mineNetKg ? mineNetKg / 1000 : null,
      dest_gross_kg: destGross ?? null,
      dest_tare_kg: destTare ?? null,
      dest_net_kg: destNetKg,
      dest_net_tonnes: destNetKg ? destNetKg / 1000 : null,
      variance_kg: varianceKg,
      variance_pct: variancePct ? parseFloat(variancePct.toFixed(3)) : null,
      within_tolerance: variancePct !== null ? variancePct <= dispatch.tolerance_pct : null,
    }
  });
});

// POST /api/v2/dispatches — CA creates dispatch, assigns transporter
router.post('/', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { po_id, transporter_id, scheduled_date, availability_window } = req.body;
  if (!po_id) return res.status(400).json({ error: 'po_id required' });

  const result = db.prepare(`
    INSERT INTO dispatch_assignments (po_id, transporter_id, scheduled_date, availability_window, assigned_by_user_id, assigned_at, status)
    VALUES (?, ?, ?, ?, ?, datetime('now'), 'PENDING_TA')
  `).run(po_id, transporter_id ?? null, scheduled_date ?? null, availability_window ? JSON.stringify(availability_window) : null, req.user!.userId);

  // Update PO status
  db.prepare("UPDATE purchase_orders SET status = 'IN_PROGRESS', updated_at = datetime('now') WHERE id = ?").run(po_id);

  writeAudit({
    entityType: 'dispatch', entityId: Number(result.lastInsertRowid),
    action: 'RECORD_CREATED', toStatus: 'PENDING_TA',
    userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req)
  });

  return res.status(201).json({ id: result.lastInsertRowid, message: 'Dispatch created' });
});

// ─── STATUS TRANSITIONS ──────────────────────────────────────

/** PATCH /api/v2/dispatches/:id/assign — TA fills driver + vehicle */
router.patch('/:id/assign', requireAuth, requireRole('TRANSPORTER_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { driver_id, vehicle_id, availability_window } = req.body;
  const dispatch = getDispatch(req.params.id);
  if (!dispatch) return res.status(404).json({ error: 'Not found' });
  if (dispatch.status !== 'PENDING_TA') return res.status(409).json({ error: `Cannot assign from status ${dispatch.status}` });

  // Tenant isolation
  if (dispatch.transporter_id !== req.user!.entityId) return res.status(403).json({ error: 'Not your dispatch' });

  db.prepare(`
    UPDATE dispatch_assignments SET driver_id = ?, vehicle_id = ?, availability_window = ?, status = 'ASSIGNED', updated_at = datetime('now')
    WHERE id = ?
  `).run(driver_id, vehicle_id, availability_window ? JSON.stringify(availability_window) : null, dispatch.id);

  writeAudit({ entityType: 'dispatch', entityId: dispatch.id, action: 'STATUS_CHANGE', fromStatus: 'PENDING_TA', toStatus: 'ASSIGNED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req) });
  return res.json({ message: 'Assigned' });
});

/** PATCH /api/v2/dispatches/:id/gate-check — SR performs gate validation */
router.patch('/:id/gate-check', requireAuth, requireRole('SUPERVISOR'), (req: Request, res: Response) => {
  const db = getDb();
  const { license_valid, prdp_valid, bilty_valid, material_match, reason } = req.body;
  const dispatch = getDispatch(req.params.id);
  if (!dispatch) return res.status(404).json({ error: 'Not found' });
  if (dispatch.status !== 'ASSIGNED') return res.status(409).json({ error: 'Dispatch must be ASSIGNED before gate check' });

  const result = license_valid && prdp_valid && bilty_valid && material_match ? 'PASS' : 'FAIL';
  const newStatus = result === 'PASS' ? 'MINE_WEIGHED' : 'GATE_DENIED';

  db.prepare(`
    INSERT INTO gate_checks (dispatch_id, license_valid, prdp_valid, bilty_valid, material_match, checked_by_user_id, result, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(dispatch.id, license_valid ? 1 : 0, prdp_valid ? 1 : 0, bilty_valid ? 1 : 0, material_match ? 1 : 0, req.user!.userId, result, reason ?? null);

  db.prepare(`UPDATE dispatch_assignments SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(newStatus, dispatch.id);

  writeAudit({ entityType: 'dispatch', entityId: dispatch.id, action: 'GATE_CHECK', fromStatus: 'ASSIGNED', toStatus: newStatus, userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req), metadata: { result, reason } });
  return res.json({ message: `Gate ${result}`, newStatus });
});

/** POST /api/v2/dispatches/:id/weigh — SR logs weighbridge reading */
router.post('/:id/weigh', requireAuth, requireRole('SUPERVISOR', 'CUSTOMER'), (req: Request, res: Response) => {
  const db = getDb();
  const { checkpoint, weight_kg } = req.body;

  const validCheckpoints = ['MINE_TARE','MINE_GROSS','DEST_GROSS','DEST_TARE'];
  if (!validCheckpoints.includes(checkpoint) || !weight_kg) {
    return res.status(400).json({ error: 'checkpoint and weight_kg required' });
  }

  const dispatch = getDispatch(req.params.id);
  if (!dispatch) return res.status(404).json({ error: 'Not found' });

  db.prepare(`
    INSERT INTO weighbridge_logs (dispatch_id, checkpoint, weight_kg, recorded_by_role, recorded_by_user_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(dispatch.id, checkpoint, weight_kg, req.user!.role, req.user!.userId);

  // Auto-advance status based on checkpoint
  let newStatus = dispatch.status;
  if (checkpoint === 'MINE_GROSS') {
    // Check tolerance after both tare+gross recorded
    const mineTare = (db.prepare("SELECT weight_kg FROM weighbridge_logs WHERE dispatch_id = ? AND checkpoint = 'MINE_TARE' ORDER BY timestamp DESC LIMIT 1").get(dispatch.id) as any)?.weight_kg;
    if (mineTare) {
      const netKg = weight_kg - mineTare;
      const targetKg = dispatch.target_qty * 1000;
      const diffPct = Math.abs((netKg - targetKg) / targetKg) * 100;
      newStatus = diffPct > dispatch.tolerance_pct ? 'DISPATCH_HELD' : 'MINE_WEIGHED';
    }
  } else if (checkpoint === 'DEST_GROSS') {
    newStatus = 'DEST_WEIGHED';
  } else if (checkpoint === 'DEST_TARE') {
    newStatus = 'DELIVERED_STAMPED';
  }

  db.prepare("UPDATE dispatch_assignments SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, dispatch.id);
  writeAudit({ entityType: 'dispatch', entityId: dispatch.id, action: 'WEIGH_LOGGED', fromStatus: dispatch.status, toStatus: newStatus, userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req), metadata: { checkpoint, weight_kg } });

  return res.json({ message: 'Weighbridge log recorded', newStatus });
});

/** PATCH /api/v2/dispatches/:id/dispatch — SR marks truck as departed */
router.patch('/:id/dispatch', requireAuth, requireRole('SUPERVISOR'), (req: Request, res: Response) => {
  const db = getDb();
  const dispatch = getDispatch(req.params.id);
  if (!dispatch) return res.status(404).json({ error: 'Not found' });
  if (dispatch.status !== 'MINE_WEIGHED') return res.status(409).json({ error: 'Must be MINE_WEIGHED' });

  db.prepare("UPDATE dispatch_assignments SET status = 'DISPATCHED', updated_at = datetime('now') WHERE id = ?").run(dispatch.id);
  db.prepare("INSERT INTO transit_events (dispatch_id, status, created_by_role) VALUES (?, 'DISPATCHED', ?)").run(dispatch.id, req.user!.role);

  writeAudit({ entityType: 'dispatch', entityId: dispatch.id, action: 'STATUS_CHANGE', fromStatus: 'MINE_WEIGHED', toStatus: 'DISPATCHED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req) });
  return res.json({ message: 'Dispatched' });
});

/** PATCH /api/v2/dispatches/:id/transit — Driver updates location */
router.patch('/:id/transit', requireAuth, requireRole('DRIVER'), (req: Request, res: Response) => {
  const db = getDb();
  const { gps_lat, gps_lng, gps_accuracy_m } = req.body;
  const dispatch = getDispatch(req.params.id);
  if (!dispatch) return res.status(404).json({ error: 'Not found' });

  db.prepare("INSERT INTO transit_events (dispatch_id, status, gps_lat, gps_lng, gps_accuracy_m, created_by_role) VALUES (?, 'EN_ROUTE', ?, ?, ?, ?)").run(dispatch.id, gps_lat ?? null, gps_lng ?? null, gps_accuracy_m ?? null, req.user!.role);
  db.prepare("UPDATE dispatch_assignments SET status = 'EN_ROUTE', updated_at = datetime('now') WHERE id = ?").run(dispatch.id);

  return res.json({ message: 'Transit updated' });
});

/** POST /api/v2/dispatches/:id/arrive — Driver confirms arrival (IP captured server-side) */
router.post('/:id/arrive', requireAuth, requireRole('DRIVER'), (req: Request, res: Response) => {
  const db = getDb();
  const { gps_lat, gps_lng, gps_accuracy_m } = req.body;
  const dispatch = getDispatch(req.params.id);
  if (!dispatch) return res.status(404).json({ error: 'Not found' });
  if (!['EN_ROUTE','DISPATCHED'].includes(dispatch.status)) return res.status(409).json({ error: 'Must be EN_ROUTE or DISPATCHED' });

  const ip = getClientIp(req);
  db.prepare(`
    INSERT OR IGNORE INTO arrival_confirmations (dispatch_id, driver_id, gps_lat, gps_lng, gps_accuracy_m, ip_address, device_info)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(dispatch.id, dispatch.driver_id, gps_lat ?? null, gps_lng ?? null, gps_accuracy_m ?? null, ip, req.headers['user-agent'] ?? '');

  db.prepare("INSERT INTO transit_events (dispatch_id, status, gps_lat, gps_lng, gps_accuracy_m, created_by_role) VALUES (?, 'ARRIVED', ?, ?, ?, ?)").run(dispatch.id, gps_lat ?? null, gps_lng ?? null, gps_accuracy_m ?? null, req.user!.role);
  db.prepare("UPDATE dispatch_assignments SET status = 'ARRIVED', updated_at = datetime('now') WHERE id = ?").run(dispatch.id);

  writeAudit({ entityType: 'dispatch', entityId: dispatch.id, action: 'DRIVER_ARRIVED', fromStatus: dispatch.status, toStatus: 'ARRIVED', userId: req.user!.userId, role: req.user!.role, ip, metadata: { gps_lat, gps_lng } });
  return res.json({ message: 'Arrival confirmed', ip_captured: ip });
});

/** PATCH /api/v2/dispatches/:id/release-held — CA releases held dispatch */
router.patch('/:id/release-held', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const dispatch = getDispatch(req.params.id);
  if (!dispatch) return res.status(404).json({ error: 'Not found' });
  if (dispatch.status !== 'DISPATCH_HELD') return res.status(409).json({ error: 'Not in DISPATCH_HELD status' });

  db.prepare("UPDATE dispatch_assignments SET status = 'MINE_WEIGHED', updated_at = datetime('now') WHERE id = ?").run(dispatch.id);
  writeAudit({ entityType: 'dispatch', entityId: dispatch.id, action: 'HELD_RELEASED', fromStatus: 'DISPATCH_HELD', toStatus: 'MINE_WEIGHED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req), metadata: { reason: req.body.reason } });
  return res.json({ message: 'Released from hold' });
});

/** POST /api/v2/dispatches/:id/cancel */
router.post('/:id/cancel', requireAuth, requireRole('COMPANY_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { reason } = req.body;
  const dispatch = getDispatch(req.params.id);
  if (!dispatch) return res.status(404).json({ error: 'Not found' });
  if (['APPROVED','INVOICED','MIRO_POSTED','CLEARED'].includes(dispatch.status)) {
    return res.status(409).json({ error: 'Cannot cancel completed dispatch' });
  }

  db.prepare("UPDATE dispatch_assignments SET status = 'CANCELLED', cancellation_reason = ?, updated_at = datetime('now') WHERE id = ?").run(reason ?? 'No reason given', dispatch.id);
  writeAudit({ entityType: 'dispatch', entityId: dispatch.id, action: 'CANCELLED', fromStatus: dispatch.status, toStatus: 'CANCELLED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req), metadata: { reason } });
  return res.json({ message: 'Cancelled' });
});

export default router;
