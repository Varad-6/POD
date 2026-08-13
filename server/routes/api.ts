// ============================================================
// POD — REST API Routes (Express + SQLite)
// ============================================================

import { Router } from 'express';
import { db } from '../db/database';

export const apiRouter = Router();

// GET /api/health
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    system: 'POD Express API Server',
    database: 'SQLite (WAL Mode)',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/contracts
apiRouter.get('/contracts', (req, res) => {
  try {
    const contracts = db.prepare('SELECT * FROM contracts ORDER BY valid_from DESC').all();
    res.json(contracts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/purchase-orders
apiRouter.get('/purchase-orders', (req, res) => {
  try {
    const pos = db.prepare('SELECT * FROM purchase_orders ORDER BY po_date DESC').all();
    res.json(pos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/purchase-orders/:id/accept
apiRouter.put('/purchase-orders/:id/accept', (req, res) => {
  const { id } = req.params;
  const { signedBy, signatureHash } = req.body;
  const now = new Date().toISOString();

  try {
    const stmt = db.prepare(`
      UPDATE purchase_orders
      SET status = 'ACCEPTED_SIGNED', signed_by = ?, signed_date = ?
      WHERE purchase_order_no = ?
    `);
    const info = stmt.run(signedBy || 'Transporter Admin', now, id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    res.json({ success: true, message: `PO #${id} acknowledged`, signedDate: now });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transport-runs
apiRouter.get('/transport-runs', (req, res) => {
  try {
    const runs = db.prepare('SELECT * FROM transport_runs ORDER BY waybill_no DESC').all();
    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transport-runs
apiRouter.post('/transport-runs', (req, res) => {
  const r = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO transport_runs (
        waybill_no, po_ref, loading_wayslip_no, horse_reg_no, trailer1_reg_no, trailer2_reg_no,
        driver_name, driver_id_no, dispatch_tare_kg, dispatch_gross_kg, dispatch_net_kg,
        arrival_gross_kg, arrival_tare_kg, arrival_net_kg, accepted_net_kg, site,
        product_description, offload_date, pod_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      r.waybillNo, r.poRef, r.loadingWaySlipNo, r.horseRegNo, r.trailer1RegNo || '', r.trailer2RegNo || '',
      r.driverName, r.driverIdNo, r.dispatchTareWeightKg, r.dispatchGrossWeightKg, r.dispatchNetWeightKg,
      r.arrivalGrossWeightKg, r.arrivalTareWeightKg, r.arrivalNetWeightKg, r.acceptedNetWeightKg,
      r.site, r.productDescription, r.offloadDate, r.podStatus || 'PENDING_POD'
    );

    res.status(201).json({ success: true, waybillNo: r.waybillNo });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/invoices
apiRouter.get('/invoices', (req, res) => {
  try {
    const invoices = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all();
    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
