/**
 * Ikwezi Transporter Portal — Core API Router V3
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db/database_v3.js';
import { requireAuth, requireRole, getClientIp } from '../middleware/auth_v3.js';

const router = Router();

// Helper to compute Haversine distance in meters
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// GET /api/v3/search?q=
router.get('/search', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const q = (req.query.q as string || '').trim();
  if (!q) {
    return res.json({ contracts: [], purchaseOrders: [], assignments: [], drivers: [], vehicles: [] });
  }

  const searchTerm = `%${q}%`;

  const contracts = db.prepare(`
    SELECT c.*, cu.name as customer_name
    FROM contracts c JOIN customers cu ON cu.id = c.customer_id
    WHERE c.sap_contract_no LIKE ? OR cu.name LIKE ?
  `).all(searchTerm, searchTerm);

  const purchaseOrders = db.prepare(`
    SELECT po.*, c.sap_contract_no
    FROM purchase_orders po JOIN contracts c ON c.id = po.contract_id
    WHERE po.sap_po_no LIKE ? OR po.material LIKE ? OR po.cost_center LIKE ?
  `).all(searchTerm, searchTerm, searchTerm);

  const assignments = db.prepare(`
    SELECT ta.*, d.name as driver_name, v.reg_no as vehicle_reg, po.sap_po_no
    FROM transport_assignments ta
    JOIN drivers d ON d.id = ta.driver_id
    JOIN vehicles v ON v.id = ta.vehicle_id
    JOIN job_configs jc ON jc.id = ta.job_config_id
    JOIN purchase_orders po ON po.id = jc.po_id
    WHERE ta.id LIKE ? OR d.name LIKE ? OR v.reg_no LIKE ? OR ta.status LIKE ?
  `).all(searchTerm, searchTerm, searchTerm, searchTerm);

  const drivers = db.prepare(`
    SELECT d.*, t.name as transporter_name
    FROM drivers d JOIN transporters t ON t.id = d.transporter_id
    WHERE d.name LIKE ? OR d.license_no LIKE ?
  `).all(searchTerm, searchTerm);

  const vehicles = db.prepare(`
    SELECT v.*, t.name as transporter_name
    FROM vehicles v JOIN transporters t ON t.id = v.transporter_id
    WHERE v.reg_no LIKE ?
  `).all(searchTerm);

  return res.json({
    query: q,
    contracts,
    purchaseOrders,
    assignments,
    drivers,
    vehicles,
  });
});

// GET /api/v3/assignments
router.get('/assignments', requireAuth, requireRole('CA', 'TA', 'SR'), (req: Request, res: Response) => {
  const db = getDb();
  const status = req.query.status;
  let query = `
    SELECT ta.*, d.name as driver_name, d.phone as driver_phone, v.reg_no as vehicle_reg, po.sap_po_no, po.material
    FROM transport_assignments ta
    JOIN job_configs jc ON jc.id = ta.job_config_id
    JOIN purchase_orders po ON po.id = jc.po_id
    JOIN drivers d ON d.id = ta.driver_id
    JOIN vehicles v ON v.id = ta.vehicle_id
  `;
  const params: any[] = [];
  if (status) {
    query += ' WHERE ta.status = ?';
    params.push(status);
  }
  query += ' ORDER BY ta.id DESC';
  return res.json(db.prepare(query).all(...params));
});

// GET /api/v3/contracts
router.get('/contracts', requireAuth, requireRole('CA', 'TA', 'CR'), (req: Request, res: Response) => {
  const db = getDb();
  const contracts = db.prepare(`
    SELECT c.*, cu.name as customer_name
    FROM contracts c
    JOIN customers cu ON cu.id = c.customer_id
  `).all();
  return res.json(contracts);
});

// GET /api/v3/contracts/:id
router.get('/contracts/:id', requireAuth, requireRole('CA', 'TA', 'CR'), (req: Request, res: Response) => {
  const db = getDb();
  const contract = db.prepare(`
    SELECT c.*, cu.name as customer_name
    FROM contracts c
    JOIN customers cu ON cu.id = c.customer_id
    WHERE c.id = ?
  `).get(req.params.id) as any;

  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  const pos = db.prepare('SELECT * FROM purchase_orders WHERE contract_id = ?').all(contract.id);
  return res.json({ ...contract, purchase_orders: pos });
});

// GET /api/v3/contracts/:id/pdf
router.get('/contracts/:id/pdf', requireAuth, requireRole('CA', 'TA'), (req: Request, res: Response) => {
  const db = getDb();
  const contract = db.prepare('SELECT pdf_url FROM contracts WHERE id = ?').get(req.params.id) as any;
  if (!contract) return res.status(404).json({ error: 'Contract not found' });
  return res.json({ pdf_url: contract.pdf_url || '/uploads/contracts/default.pdf' });
});

// POST /api/v3/po/:id/distribute
router.post('/po/:id/distribute', requireAuth, requireRole('CA'), (req: Request, res: Response) => {
  const db = getDb();
  const poId = req.params.id;
  const { transporter_id, availability_window, timebound } = req.body;

  if (!transporter_id || !availability_window || !timebound) {
    return res.status(400).json({ error: 'transporter_id, availability_window, and timebound required' });
  }

  // Create job configuration
  const result = db.prepare(`
    INSERT INTO job_configs (po_id, transporter_id, availability_window, timebound, status)
    VALUES (?, ?, ?, ?, 'PENDING')
  `).run(poId, transporter_id, availability_window, timebound);

  // Sync log
  db.prepare(`
    INSERT INTO sap_sync_log (entity_type, sap_ref, direction, payload_json)
    VALUES ('JOB_CONFIG', ?, 'OUT', ?)
  `).run(result.lastInsertRowid.toString(), JSON.stringify({ po_id: poId, transporter_id, availability_window, timebound }));

  return res.status(201).json({ id: result.lastInsertRowid, message: 'Job configuration created' });
});

// GET /api/v3/review-queue
router.get('/review-queue', requireAuth, requireRole('CA', 'SR'), (req: Request, res: Response) => {
  const db = getDb();
  const status = req.query.status || 'OPEN';
  const reviews = db.prepare(`
    SELECT rq.*, ta.scheduled_date, d.name as driver_name, v.reg_no as vehicle_reg, po.sap_po_no, po.material
    FROM review_queue rq
    JOIN transport_assignments ta ON ta.id = rq.assignment_id
    JOIN job_configs jc ON jc.id = ta.job_config_id
    JOIN purchase_orders po ON po.id = jc.po_id
    JOIN drivers d ON d.id = ta.driver_id
    JOIN vehicles v ON v.id = ta.vehicle_id
    WHERE rq.status = ?
  `).all(status);
  return res.json(reviews);
});

// PATCH /api/v3/review-queue/:id/resolve
router.patch('/review-queue/:id/resolve', requireAuth, requireRole('CA', 'SR'), (req: Request, res: Response) => {
  const db = getDb();
  const { resolution_notes } = req.body;

  const review = db.prepare('SELECT * FROM review_queue WHERE id = ?').get(req.params.id) as any;
  if (!review) return res.status(404).json({ error: 'Review item not found' });

  db.prepare(`
    UPDATE review_queue
    SET status = 'RESOLVED', resolved_by_role = ?, resolved_by_user_id = ?, resolution_notes = ?, blocks_miro_bool = 0
    WHERE id = ?
  `).run(req.user!.role, req.user!.userId, resolution_notes ?? 'Resolved manually', req.params.id);

  // Check if there are other open review blocks for this assignment
  const remainingBlock = db.prepare(`
    SELECT COUNT(*) as count FROM review_queue WHERE assignment_id = ? AND status = 'OPEN' AND blocks_miro_bool = 1
  `).get(review.assignment_id) as any;

  if (remainingBlock.count === 0) {
    db.prepare("UPDATE transport_assignments SET status = 'APPROVED' WHERE id = ?").run(review.assignment_id);
  }

  return res.json({ message: 'Review resolved and MIRO blocks lifted' });
});

// POST /api/v3/ca-verification/:assignmentId
router.post('/ca-verification/:assignmentId', requireAuth, requireRole('CA'), (req: Request, res: Response) => {
  const db = getDb();
  const assignmentId = req.params.assignmentId;
  const { verified_bool, notes } = req.body;

  if (verified_bool === undefined) {
    return res.status(400).json({ error: 'verified_bool is required' });
  }

  // Record verification
  db.prepare(`
    INSERT OR REPLACE INTO ca_verification (assignment_id, verified_bool, verified_by, notes)
    VALUES (?, ?, ?, ?)
  `).run(assignmentId, verified_bool ? 1 : 0, req.user!.userId, notes ?? '');

  if (verified_bool) {
    // Fetch weights & PO target info
    const assignment = db.prepare(`
      SELECT ta.*, po.rate, po.id as po_id
      FROM transport_assignments ta
      JOIN job_configs jc ON jc.id = ta.job_config_id
      JOIN purchase_orders po ON po.id = jc.po_id
      WHERE ta.id = ?
    `).get(assignmentId) as any;

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Compute accepted payload from destination weighbridge logs (DEST_GROSS - DEST_TARE)
    const weights = db.prepare('SELECT checkpoint, weight_kg FROM weight_logs WHERE assignment_id = ?').all(assignmentId) as any[];
    const destGross = weights.find(w => w.stage === 'DEST_GROSS')?.weight_kg || 0;
    const destTare = weights.find(w => w.stage === 'DEST_TARE')?.weight_kg || 0;
    const acceptedPayload = (destGross - destTare) || 34000.0; // fallback if weigh logs empty in demo

    const totalValue = (acceptedPayload / 1000) * assignment.rate;

    // Create delivery invoice
    const delInv = db.prepare(`
      INSERT OR REPLACE INTO delivery_invoices (assignment_id, accepted_payload, rate, total_value, status)
      VALUES (?, ?, ?, ?, 'SENT_TO_CA')
    `).run(assignmentId, acceptedPayload, assignment.rate, totalValue);

    // Create main invoice
    db.prepare(`
      INSERT OR REPLACE INTO main_invoices (delivery_invoice_id, po_id, status)
      VALUES (?, ?, 'PO_DONE')
    `).run(delInv.lastInsertRowid, assignment.po_id);

    db.prepare("UPDATE transport_assignments SET status = 'APPROVED' WHERE id = ?").run(assignmentId);
  }

  return res.json({ message: 'CA Verification recorded' });
});

// GET /api/v3/delivery-invoices
router.get('/delivery-invoices', requireAuth, requireRole('CA', 'TA'), (req: Request, res: Response) => {
  const db = getDb();
  const status = req.query.status || 'SENT_TO_CA';
  const invoices = db.prepare(`
    SELECT di.*, ta.scheduled_date, d.name as driver_name, po.sap_po_no, po.material
    FROM delivery_invoices di
    JOIN transport_assignments ta ON ta.id = di.assignment_id
    JOIN job_configs jc ON jc.id = ta.job_config_id
    JOIN purchase_orders po ON po.id = jc.po_id
    JOIN drivers d ON d.id = ta.driver_id
    WHERE di.status = ?
  `).all(status);
  return res.json(invoices);
});

// GET /api/v3/miro
router.get('/miro', requireAuth, requireRole('CA'), (req: Request, res: Response) => {
  const db = getDb();
  const list = db.prepare(`
    SELECT mi.*, di.total_value, di.accepted_payload as accepted_payload_kg,
           po.sap_po_no, po.material, t.name as transporter_name, cu.name as customer_name
    FROM miro_invoices mi
    JOIN main_invoices mai ON mai.id = mi.main_invoice_id
    JOIN delivery_invoices di ON di.id = mai.delivery_invoice_id
    JOIN transport_assignments ta ON ta.id = di.assignment_id
    JOIN job_configs jc ON jc.id = ta.job_config_id
    JOIN transporters t ON t.id = jc.transporter_id
    JOIN purchase_orders po ON po.id = jc.po_id
    JOIN contracts c ON c.id = po.contract_id
    JOIN customers cu ON cu.id = c.customer_id
    ORDER BY mi.id DESC
  `).all();
  return res.json(list);
});

// POST /api/v3/miro — Park MIRO (with blocks_miro_bool check)
router.post('/miro', requireAuth, requireRole('CA'), (req: Request, res: Response) => {
  const db = getDb();
  const { freight_invoice_id } = req.body;

  if (!freight_invoice_id) {
    return res.status(400).json({ error: 'freight_invoice_id required' });
  }

  // Retrieve main invoice ID & assignment ID
  const mainInv = db.prepare(`
    SELECT mi.id as main_invoice_id, di.assignment_id, di.total_value
    FROM main_invoices mi
    JOIN delivery_invoices di ON di.id = mi.delivery_invoice_id
    WHERE di.id = ?
  `).get(freight_invoice_id) as any;

  if (!mainInv) return res.status(404).json({ error: 'Main invoice not found for delivery invoice' });

  // CRITICAL REVIEW CHECK: blocks_miro_bool
  const openBlock = db.prepare(`
    SELECT id FROM review_queue
    WHERE assignment_id = ? AND status = 'OPEN' AND blocks_miro_bool = 1
  `).get(mainInv.assignment_id) as any;

  if (openBlock) {
    return res.status(403).json({
      error: 'MIRO posting blocked. Resolve pending items in review queue first.',
      review_id: openBlock.id
    });
  }

  const sapInvoiceNo = `MIRO-SAP-${Date.now()}`;
  const sapRef = `BAPI-REF-${Date.now()}`;

  const result = db.prepare(`
    INSERT INTO miro_invoices (main_invoice_id, sap_invoice_no, status, sap_ref)
    VALUES (?, ?, 'PARKED', ?)
  `).run(mainInv.main_invoice_id, sapInvoiceNo, sapRef);

  db.prepare("UPDATE transport_assignments SET status = 'MIRO_PARKED' WHERE id = ?").run(mainInv.assignment_id);

  return res.status(201).json({ id: result.lastInsertRowid, sap_invoice_no: sapInvoiceNo, status: 'PARKED' });
});

// POST /api/v3/miro/:id/post — Post MIRO
router.post('/miro/:id/post', requireAuth, requireRole('CA'), (req: Request, res: Response) => {
  const db = getDb();
  const miroId = req.params.id;

  const miro = db.prepare(`
    SELECT mi.*, di.assignment_id, di.total_value
    FROM miro_invoices mi
    JOIN main_invoices mai ON mai.id = mi.main_invoice_id
    JOIN delivery_invoices di ON di.id = mai.delivery_invoice_id
    WHERE mi.id = ?
  `).get(miroId) as any;

  if (!miro) return res.status(404).json({ error: 'Miro invoice not found' });

  db.prepare(`
    UPDATE miro_invoices
    SET status = 'POSTED', posted_date = datetime('now')
    WHERE id = ?
  `).run(miroId);

  db.prepare("UPDATE transport_assignments SET status = 'MIRO_POSTED' WHERE id = ?").run(miro.assignment_id);

  // Write sync log OUT
  db.prepare(`
    INSERT INTO sap_sync_log (entity_type, sap_ref, direction, payload_json)
    VALUES ('MIRO_INVOICE', ?, 'OUT', ?)
  `).run(miro.sap_invoice_no, JSON.stringify({ miro_id: miroId, sap_invoice_no: miro.sap_invoice_no, amount: miro.total_value }));

  return res.json({ message: 'MIRO posted successfully' });
});

// POST /api/v3/miro/:id/clear — Clear payment
router.post('/miro/:id/clear', requireAuth, requireRole('CA'), (req: Request, res: Response) => {
  const db = getDb();
  const miroId = req.params.id;
  const { payment_ref } = req.body;

  const miro = db.prepare(`
    SELECT mi.*, di.assignment_id
    FROM miro_invoices mi
    JOIN main_invoices mai ON mai.id = mi.main_invoice_id
    JOIN delivery_invoices di ON di.id = mai.delivery_invoice_id
    WHERE mi.id = ?
  `).get(miroId) as any;

  if (!miro) return res.status(404).json({ error: 'Miro invoice not found' });

  db.prepare(`
    UPDATE miro_invoices
    SET status = 'CLEARED', posted_date = datetime('now'), sap_ref = ?
    WHERE id = ?
  `).run(payment_ref ?? 'PMT-CLEARED', miroId);

  db.prepare("UPDATE transport_assignments SET status = 'CLEARED' WHERE id = ?").run(miro.assignment_id);

  return res.json({ message: 'MIRO invoice payment cleared' });
});

// ─── TA ENDPOINTS ────────────────────────────────────────────

// GET /api/v3/job-configs
router.get('/job-configs', requireAuth, requireRole('TA', 'CA'), (req: Request, res: Response) => {
  const db = getDb();
  const status = req.query.status || 'PENDING';
  const configs = db.prepare(`
    SELECT jc.*, po.sap_po_no, po.material, po.target_qty, po.rate
    FROM job_configs jc
    JOIN purchase_orders po ON po.id = jc.po_id
    WHERE jc.status = ?
  `).all(status);
  return res.json(configs);
});

// POST /api/v3/job-configs/:id/assign
router.post('/job-configs/:id/assign', requireAuth, requireRole('TA'), (req: Request, res: Response) => {
  const db = getDb();
  const configId = req.params.id;
  const { driver_id, vehicle_id, license_no, gstin, scheduled_date, location } = req.body;

  if (!driver_id || !vehicle_id || !license_no || !gstin || !scheduled_date) {
    return res.status(400).json({ error: 'driver_id, vehicle_id, license_no, gstin, and scheduled_date required' });
  }

  // Create transport assignment
  const result = db.prepare(`
    INSERT INTO transport_assignments (job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ASSIGNED')
  `).run(configId, driver_id, vehicle_id, location ?? 'Mine Siding', license_no, gstin, scheduled_date);

  db.prepare("UPDATE job_configs SET status = 'ASSIGNED' WHERE id = ?").run(configId);

  return res.status(201).json({ id: result.lastInsertRowid, message: 'Transport assignment configured' });
});

// ─── SUPERVISOR (SR) ENDPOINTS ────────────────────────────────

// POST /api/v3/assignments/:id/arrival-schedule
router.post('/assignments/:id/arrival-schedule', requireAuth, requireRole('SR'), (req: Request, res: Response) => {
  const db = getDb();
  const { arrival_date, arrival_time } = req.body;
  if (!arrival_date || !arrival_time) {
    return res.status(400).json({ error: 'arrival_date and arrival_time required' });
  }
  // Store details or update transport assignment
  return res.json({ message: 'Arrival schedule configured successfully' });
});

// POST /api/v3/assignments/:id/supervisor-check
router.post('/assignments/:id/supervisor-check', requireAuth, requireRole('SR'), (req: Request, res: Response) => {
  const db = getDb();
  const assignmentId = req.params.id;
  const { arrival_date, arrival_time, weight_check_bool, bilty_check_bool, material_check_bool, license_check_bool } = req.body;

  if (!arrival_date || !arrival_time) {
    return res.status(400).json({ error: 'arrival_date and arrival_time are required' });
  }

  db.prepare(`
    INSERT INTO supervisor_checks (assignment_id, arrival_date, arrival_time, weight_check_bool, bilty_check_bool, material_check_bool, license_check_bool, checked_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(assignmentId, arrival_date, arrival_time, weight_check_bool ? 1 : 0, bilty_check_bool ? 1 : 0, material_check_bool ? 1 : 0, license_check_bool ? 1 : 0, req.user!.userId);

  return res.json({ message: 'Supervisor check logged' });
});

// POST /api/v3/assignments/:id/gate-check
router.post('/assignments/:id/gate-check', requireAuth, requireRole('SR'), (req: Request, res: Response) => {
  const db = getDb();
  const assignmentId = req.params.id;
  const { license_valid, prdp_valid, bilty_valid, material_match, reason } = req.body;

  if (license_valid === false || prdp_valid === false || bilty_valid === false || material_match === false) {
    db.prepare("UPDATE transport_assignments SET status = 'GATE_DENIED' WHERE id = ?").run(assignmentId);
    return res.json({ status: 'GATE_DENIED', message: 'Gate entry denied. Transporter notified.' });
  }

  db.prepare("UPDATE transport_assignments SET status = 'MINE_TARE_LOGGED' WHERE id = ?").run(assignmentId);
  return res.json({ status: 'MINE_TARE_LOGGED', message: 'Gate check passed. Vehicle cleared for tare log.' });
});

// POST /api/v3/assignments/:id/stamp
router.post('/assignments/:id/stamp', requireAuth, requireRole('SR'), (req: Request, res: Response) => {
  const db = getDb();
  const assignmentId = req.params.id;
  const { gps_lat, gps_lng, otp_match_bool, bilty_no, bilty_date, upload_url } = req.body;

  const ip = getClientIp(req);

  db.prepare(`
    INSERT INTO supervisor_stamp (assignment_id, ip_address, gps_lat, gps_lng, otp_match_bool)
    VALUES (?, ?, ?, ?, ?)
  `).run(assignmentId, ip, gps_lat ?? 0.0, gps_lng ?? 0.0, otp_match_bool ? 1 : 0);

  if (bilty_no && bilty_date && upload_url) {
    db.prepare(`
      INSERT OR REPLACE INTO bilty_uploads (assignment_id, bilty_no, bilty_date, upload_url)
      VALUES (?, ?, ?, ?)
    `).run(assignmentId, bilty_no, bilty_date, upload_url);
  }

  db.prepare("UPDATE transport_assignments SET status = 'DISPATCHED' WHERE id = ?").run(assignmentId);

  return res.json({ message: 'Supervisor stamp captured. Vehicle dispatched.' });
});

// ─── DRIVER (DR) ENDPOINTS ────────────────────────────────────

// GET /api/v3/assignments/mine
router.get('/assignments/mine', requireAuth, requireRole('DR'), (req: Request, res: Response) => {
  const db = getDb();
  const list = db.prepare(`
    SELECT ta.*, po.sap_po_no, po.material, 
           'Emoyeni Mine Siding' AS from_location, 
           'Duvha Power Station' AS to_location
    FROM transport_assignments ta
    JOIN job_configs jc ON jc.id = ta.job_config_id
    JOIN purchase_orders po ON po.id = jc.po_id
    WHERE ta.driver_id = ?
    ORDER BY ta.id DESC
  `).all(req.user!.entityId || 1);
  return res.json(list);
});

// POST /api/v3/assignments/:id/otp/generate
router.post('/assignments/:id/otp/generate', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const assignmentId = req.params.id;
  const { stage } = req.body;

  if (!stage || !['PICKUP', 'DELIVERY'].includes(stage)) {
    return res.status(400).json({ error: 'Valid stage (PICKUP/DELIVERY) required' });
  }

  const code = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4 digit OTP

  db.prepare(`
    INSERT INTO otp_verifications (assignment_id, stage, otp_code, status)
    VALUES (?, ?, ?, 'PENDING')
  `).run(assignmentId, stage, code);

  return res.json({ otp_code: code, message: `OTP generated for ${stage}` });
});

// POST /api/v3/assignments/:id/otp/verify
router.post('/assignments/:id/otp/verify', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const assignmentId = req.params.id;
  const { stage, otp_code } = req.body;

  const match = db.prepare(`
    SELECT id FROM otp_verifications
    WHERE assignment_id = ? AND stage = ? AND otp_code = ? AND status = 'PENDING'
    ORDER BY id DESC LIMIT 1
  `).get(assignmentId, stage, otp_code) as any;

  if (!match) {
    return res.status(400).json({ error: 'Invalid or expired OTP code' });
  }

  db.prepare(`
    UPDATE otp_verifications
    SET status = 'VERIFIED', verified_at = datetime('now'), verified_by_role = ?
    WHERE id = ?
  `).run(req.user!.role, match.id);

  // Advance status based on stage
  if (stage === 'PICKUP') {
    db.prepare("UPDATE transport_assignments SET status = 'DISPATCHED' WHERE id = ?").run(assignmentId);
  } else {
    db.prepare("UPDATE transport_assignments SET status = 'DELIVERED' WHERE id = ?").run(assignmentId);
  }

  return res.json({ message: 'OTP verified successfully' });
});

// POST /api/v3/assignments/:id/weight-log
router.post('/assignments/:id/weight-log', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const assignmentId = req.params.id;
  const { stage, weight_kg, truck_detail } = req.body;

  if (!stage || !weight_kg) {
    return res.status(400).json({ error: 'stage and weight_kg required' });
  }

  db.prepare(`
    INSERT INTO weight_logs (assignment_id, stage, weight_kg, truck_detail)
    VALUES (?, ?, ?, ?)
  `).run(assignmentId, stage, weight_kg, truck_detail ?? '');

  // Advance status machine based on weight check progress
  if (stage === 'MINE_TARE') {
    db.prepare("UPDATE transport_assignments SET status = 'MINE_TARE_LOGGED' WHERE id = ?").run(assignmentId);
  } else if (stage === 'MINE_GROSS') {
    db.prepare("UPDATE transport_assignments SET status = 'MINE_GROSS_LOGGED' WHERE id = ?").run(assignmentId);
  } else if (stage === 'DEST_GROSS') {
    db.prepare("UPDATE transport_assignments SET status = 'DELIVERED' WHERE id = ?").run(assignmentId);
  }

  return res.json({ message: 'Weight log recorded' });
});

// POST /api/v3/assignments/:id/transit-event
router.post('/assignments/:id/transit-event', requireAuth, requireRole('DR'), (req: Request, res: Response) => {
  const db = getDb();
  const assignmentId = req.params.id;
  const { status, gps_lat, gps_lng } = req.body;

  if (!gps_lat || !gps_lng) {
    return res.status(400).json({ error: 'GPS coordinates required' });
  }

  db.prepare(`
    INSERT INTO transit_events (assignment_id, status, gps_lat, gps_lng)
    VALUES (?, ?, ?, ?)
  `).run(assignmentId, status ?? 'EN_ROUTE', gps_lat, gps_lng);

  return res.json({ message: 'Transit event recorded' });
});

// POST /api/v3/assignments/:id/arrived
router.post('/assignments/:id/arrived', requireAuth, requireRole('DR'), (req: Request, res: Response) => {
  const db = getDb();
  const assignmentId = req.params.id;
  const { gps_lat, gps_lng } = req.body;

  if (!gps_lat || !gps_lng) {
    return res.status(400).json({ error: 'GPS coordinates required' });
  }

  const ip = getClientIp(req);
  const device = req.headers['user-agent'] || 'Mobile Browser';

  // Get destination site details
  const customer = db.prepare(`
    SELECT cu.gps_lat, cu.gps_lng
    FROM transport_assignments ta
    JOIN job_configs jc ON jc.id = ta.job_config_id
    JOIN purchase_orders po ON po.id = jc.po_id
    JOIN contracts c ON c.id = po.contract_id
    JOIN customers cu ON cu.id = c.customer_id
    WHERE ta.id = ?
  `).get(assignmentId) as any;

  let outsideGeofence = false;
  if (customer) {
    const distance = getHaversineDistance(gps_lat, gps_lng, customer.gps_lat, customer.gps_lng);
    if (distance > 500) {
      outsideGeofence = true;
    }
  }

  db.prepare(`
    INSERT OR REPLACE INTO arrival_confirmations (assignment_id, gps_lat, gps_lng, ip_address, device_info)
    VALUES (?, ?, ?, ?, ?)
  `).run(assignmentId, gps_lat, gps_lng, ip, device);

  db.prepare("UPDATE transport_assignments SET status = 'ARRIVED' WHERE id = ?").run(assignmentId);

  db.prepare(`
    INSERT INTO transit_events (assignment_id, status, gps_lat, gps_lng)
    VALUES (?, 'ARRIVED', ?, ?)
  `).run(assignmentId, gps_lat, gps_lng);

  return res.json({
    message: outsideGeofence ? 'Arrived outside geofence (500m limit) - flagged but accepted with warning.' : 'Arrived inside geofence.',
    ip_captured: ip,
    outside_geofence: outsideGeofence
  });
});

// POST /api/v3/assignments/:id/pod-upload
router.post('/assignments/:id/pod-upload', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const assignmentId = req.params.id;
  const { pod_file_url } = req.body;

  if (!pod_file_url) {
    return res.status(400).json({ error: 'pod_file_url required' });
  }

  // Insert base POD record
  db.prepare(`
    INSERT OR REPLACE INTO pod_documents (assignment_id, pod_file_url, match_status)
    VALUES (?, ?, 'PENDING')
  `).run(assignmentId, pod_file_url);

  db.prepare("UPDATE transport_assignments SET status = 'POD_UPLOADED' WHERE id = ?").run(assignmentId);

  // ──────── DOCUMENT PROCESSING / AI SIMULATION ────────
  // Read weights & PO details
  const weights = db.prepare('SELECT stage, weight_kg FROM weight_logs WHERE assignment_id = ?').all(assignmentId) as any[];
  const destGross = weights.find(w => w.stage === 'DEST_GROSS')?.weight_kg || 0;
  const destTare = weights.find(w => w.stage === 'DEST_TARE')?.weight_kg || 0;
  const acceptedPayload = (destGross - destTare) || 34000.0; // in kg

  const poInfo = db.prepare(`
    SELECT po.target_qty, po.tolerance_pct, po.sap_po_no
    FROM transport_assignments ta
    JOIN job_configs jc ON jc.id = ta.job_config_id
    JOIN purchase_orders po ON po.id = jc.po_id
    WHERE ta.id = ?
  `).get(assignmentId) as any;

  // Simulate OCR results
  // Make weight match mostly or deviate slightly
  const hasMismatch = Math.random() > 0.8;
  const ocrWeight = hasMismatch ? (acceptedPayload / 1000 - 3.5) : (acceptedPayload / 1000);
  const confidence = hasMismatch ? 65.0 : 92.5;
  const ocrWaybill = hasMismatch ? 'WB-MISMATCH-1234' : poInfo.sap_po_no;

  const matchStatus = (ocrWaybill === poInfo.sap_po_no && confidence >= 70) ? 'MATCH' : 'MISMATCH';

  // Save OCR results
  db.prepare(`
    UPDATE pod_documents
    SET ocr_waybill_extracted = ?, ocr_weight_extracted = ?, ocr_confidence_pct = ?, match_status = ?
    WHERE assignment_id = ?
  `).run(ocrWaybill, ocrWeight, confidence, matchStatus, assignmentId);

  // Run variance calculation
  const targetQtyKg = poInfo.target_qty * 1000;
  const variancePct = ((acceptedPayload - targetQtyKg) / targetQtyKg) * 100;
  const passBool = Math.abs(variancePct) <= poInfo.tolerance_pct ? 1 : 0;

  db.prepare(`
    INSERT OR REPLACE INTO variance_checks (assignment_id, stage, accepted_payload, po_target_qty, variance_pct, tolerance_pct, pass_bool)
    VALUES (?, 'DEST', ?, ?, ?, ?, ?)
  `).run(assignmentId, acceptedPayload, poInfo.target_qty, variancePct, poInfo.tolerance_pct, passBool);

  let underReview = false;
  // Trigger review queue if checks fail
  if (matchStatus === 'MISMATCH' || confidence < 70) {
    db.prepare(`
      INSERT INTO review_queue (assignment_id, flag_reason, status, blocks_miro_bool)
      VALUES (?, 'OCR_MISMATCH', 'OPEN', 1)
    `).run(assignmentId);
    underReview = true;
  }

  if (passBool === 0) {
    db.prepare(`
      INSERT INTO review_queue (assignment_id, flag_reason, status, blocks_miro_bool)
      VALUES (?, 'TOLERANCE_EXCEEDED', 'OPEN', 1)
    `).run(assignmentId);
    underReview = true;
  }

  if (underReview) {
    db.prepare("UPDATE transport_assignments SET status = 'UNDER_REVIEW' WHERE id = ?").run(assignmentId);
  } else {
    db.prepare("UPDATE transport_assignments SET status = 'APPROVED' WHERE id = ?").run(assignmentId);
  }

  return res.json({
    message: 'POD processed successfully',
    ocr: {
      ocr_waybill_extracted: ocrWaybill,
      ocr_weight_extracted: ocrWeight,
      ocr_confidence_pct: confidence,
      match_status: matchStatus
    },
    variance: {
      variance_pct: variancePct,
      pass_bool: passBool === 1
    },
    under_review: underReview
  });
});

// ─── CUSTOMER (CR) ENDPOINTS ──────────────────────────────────

// GET /api/v3/assignments/incoming (Tenant-filtered!)
router.get('/assignments/incoming', requireAuth, requireRole('CR'), (req: Request, res: Response) => {
  const db = getDb();
  // Tenant-filtered strictly by logged in customer's entity_id
  const customerId = req.user!.entityId || 1;

  const incoming = db.prepare(`
    SELECT ta.*, po.sap_po_no, po.material, 
           'Emoyeni Mine Siding' AS from_location, 
           'Duvha Power Station' AS to_location, 
           d.name as driver_name, v.reg_no as vehicle_reg
    FROM transport_assignments ta
    JOIN job_configs jc ON jc.id = ta.job_config_id
    JOIN purchase_orders po ON po.id = jc.po_id
    JOIN contracts c ON c.id = po.contract_id
    JOIN customers cu ON cu.id = c.customer_id
    JOIN drivers d ON d.id = ta.driver_id
    JOIN vehicles v ON v.id = ta.vehicle_id
    WHERE cu.id = ? AND ta.status IN ('DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW', 'APPROVED')
  `).all(customerId);

  return res.json(incoming);
});

// POST /api/v3/assignments/:id/capture-delivery
router.post('/assignments/:id/capture-delivery', requireAuth, requireRole('CR'), (req: Request, res: Response) => {
  const db = getDb();
  const assignmentId = req.params.id;
  const { truck_data, issues, weight_log_ref, unit_calc } = req.body;

  if (!truck_data) {
    return res.status(400).json({ error: 'truck_data is required' });
  }

  db.prepare(`
    INSERT OR REPLACE INTO delivery_capture (assignment_id, truck_data_json, issues_text, weight_log_ref, unit_calc, stamp_confirmed_bool)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(assignmentId, JSON.stringify(truck_data), issues ?? '', weight_log_ref ?? null, unit_calc ?? '');

  return res.json({ message: 'Delivery details logged. Awaiting stamp confirmation.' });
});

// POST /api/v3/assignments/:id/stamp-confirm
router.post('/assignments/:id/stamp-confirm', requireAuth, requireRole('CR'), (req: Request, res: Response) => {
  const db = getDb();
  const assignmentId = req.params.id;

  // OTP check
  const otpCheck = db.prepare(`
    SELECT status FROM otp_verifications
    WHERE assignment_id = ? AND stage = 'DELIVERY' AND status = 'VERIFIED'
    ORDER BY id DESC LIMIT 1
  `).get(assignmentId) as any;

  if (!otpCheck) {
    return res.status(400).json({ error: 'Stamping requires DELIVERY OTP verification first. Signature replaced.' });
  }

  db.prepare(`
    UPDATE delivery_capture
    SET stamp_confirmed_bool = 1, stamped_at = datetime('now')
    WHERE assignment_id = ?
  `).run(assignmentId);

  db.prepare("UPDATE transport_assignments SET status = 'DELIVERED' WHERE id = ?").run(assignmentId);

  return res.json({ message: 'Stamping complete. Delivery confirmed.' });
});

// ─── TRANSPORTER, DRIVER & VEHICLE ENDPOINTS ──────────────────

// GET /api/v3/transporters
router.get('/transporters', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const list = db.prepare('SELECT id, name, gstin FROM transporters').all();
  return res.json(list);
});

// GET /api/v3/transporters/:id/drivers
router.get('/transporters/:id/drivers', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const list = db.prepare('SELECT * FROM drivers WHERE transporter_id = ?').all(req.params.id);
  return res.json(list);
});

// GET /api/v3/transporters/:id/vehicles
router.get('/transporters/:id/vehicles', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const list = db.prepare('SELECT * FROM vehicles WHERE transporter_id = ?').all(req.params.id);
  return res.json(list);
});

export default router;
