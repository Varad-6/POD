/**
 * POD Documents + Review Queue API
 * Simulated OCR pipeline
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db/database_v2.js';
import { requireAuth, requireRole, writeAudit, getClientIp } from '../middleware/auth.js';

const router = Router();

// POST /api/v2/pod/submit — Driver submits POD scan (simulated OCR)
router.post('/submit', requireAuth, requireRole('DRIVER', 'TRANSPORTER_ADMIN'), (req: Request, res: Response) => {
  const db = getDb();
  const { dispatch_id, scanned_pod_url, waybill_no } = req.body;
  if (!dispatch_id || !scanned_pod_url) {
    return res.status(400).json({ error: 'dispatch_id and scanned_pod_url required' });
  }

  const dispatch = db.prepare(`
    SELECT da.*, po.target_qty, po.tolerance_pct
    FROM dispatch_assignments da JOIN purchase_orders po ON po.id = da.po_id
    WHERE da.id = ?
  `).get(dispatch_id) as any;

  if (!dispatch) return res.status(404).json({ error: 'Dispatch not found' });

  // Simulated OCR: In production, call a real OCR service
  const weights = db.prepare("SELECT * FROM weighbridge_logs WHERE dispatch_id = ?").all(dispatch_id) as any[];
  const mineGross = weights.find(w => w.checkpoint === 'MINE_GROSS')?.weight_kg;
  const mineTare  = weights.find(w => w.checkpoint === 'MINE_TARE')?.weight_kg;
  const mineNetKg = mineGross && mineTare ? mineGross - mineTare : null;

  // Simulate OCR extraction with slight noise
  const ocrWeight = mineNetKg ? parseFloat((mineNetKg / 1000 + (Math.random() - 0.5) * 0.3).toFixed(2)) : null;
  const confidence = 70 + Math.random() * 25; // 70–95%
  const ocrWaybill = waybill_no || `WB-SIM-${Date.now()}`;

  let matchStatus: string;
  if (!ocrWeight) {
    matchStatus = 'PENDING_REVIEW';
  } else {
    const diff = Math.abs((ocrWeight - mineNetKg! / 1000) / (mineNetKg! / 1000)) * 100;
    if (diff <= 0.5 && confidence >= 85) {
      matchStatus = 'MATCH';
    } else if (diff > 2 || confidence < 70) {
      matchStatus = 'MISMATCH';
    } else {
      matchStatus = 'PENDING_REVIEW';
    }
  }

  const podResult = db.prepare(`
    INSERT INTO pod_documents (dispatch_id, scanned_pod_url, ocr_extracted_waybill, ocr_extracted_weight, ocr_confidence_pct, match_status, uploaded_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(dispatch_id, scanned_pod_url, ocrWaybill, ocrWeight, parseFloat(confidence.toFixed(1)), matchStatus, req.user!.userId);

  const podId = Number(podResult.lastInsertRowid);

  // Auto-flag for review if not MATCH
  if (matchStatus !== 'MATCH') {
    db.prepare(`
      INSERT INTO review_queue (pod_id, dispatch_id, flag_reason, blocks_miro_bool)
      VALUES (?, ?, ?, 1)
    `).run(podId, dispatch_id, matchStatus === 'MISMATCH' ? 'OCR_MISMATCH' : 'LOW_CONFIDENCE');

    db.prepare("UPDATE dispatch_assignments SET status = 'POD_REVIEW', updated_at = datetime('now') WHERE id = ?").run(dispatch_id);
  } else {
    db.prepare("UPDATE dispatch_assignments SET status = 'APPROVED', updated_at = datetime('now') WHERE id = ?").run(dispatch_id);
  }

  writeAudit({ entityType: 'pod_document', entityId: podId, action: 'POD_SUBMITTED', toStatus: matchStatus, userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req), metadata: { matchStatus, confidence } });

  return res.status(201).json({
    pod_id: podId,
    match_status: matchStatus,
    ocr_extracted_weight: ocrWeight,
    ocr_extracted_waybill: ocrWaybill,
    ocr_confidence_pct: parseFloat(confidence.toFixed(1)),
    dispatch_new_status: matchStatus === 'MATCH' ? 'APPROVED' : 'POD_REVIEW',
    message: matchStatus === 'MATCH' ? 'POD matched and approved' : 'POD flagged for review'
  });
});

// GET /api/v2/pod/review-queue — All open reviews
router.get('/review-queue', requireAuth, requireRole('COMPANY_ADMIN', 'SUPERVISOR'), (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT rq.*, pd.scanned_pod_url, pd.ocr_extracted_weight, pd.ocr_confidence_pct, pd.match_status,
      da.status as dispatch_status,
      po.sap_po_no, po.material, po.target_qty,
      d.name as driver_name, t.name as transporter_name, cu.name as customer_name
    FROM review_queue rq
    JOIN pod_documents pd ON pd.id = rq.pod_id
    JOIN dispatch_assignments da ON da.id = rq.dispatch_id
    JOIN purchase_orders po ON po.id = da.po_id
    JOIN contracts c ON c.id = po.contract_id
    JOIN customers cu ON cu.id = c.customer_id
    LEFT JOIN drivers d ON d.id = da.driver_id
    LEFT JOIN transporters t ON t.id = da.transporter_id
    WHERE rq.status = 'OPEN'
    ORDER BY rq.created_at DESC
  `).all();
  return res.json(rows);
});

// PATCH /api/v2/pod/review-queue/:id/resolve — CA/SR resolves review
router.patch('/review-queue/:id/resolve', requireAuth, requireRole('COMPANY_ADMIN', 'SUPERVISOR'), (req: Request, res: Response) => {
  const db = getDb();
  const { resolution_notes, override_reason } = req.body;
  const review = db.prepare('SELECT * FROM review_queue WHERE id = ? AND status = "OPEN"').get(req.params.id) as any;
  if (!review) return res.status(404).json({ error: 'Open review not found' });

  db.prepare(`
    UPDATE review_queue SET
      status = 'RESOLVED',
      resolved_by_role = ?,
      resolved_by_user_id = ?,
      resolution_notes = ?,
      override_reason = ?,
      blocks_miro_bool = 0,
      resolved_at = datetime('now')
    WHERE id = ?
  `).run(req.user!.role, req.user!.userId, resolution_notes ?? null, override_reason ?? null, review.id);

  // Advance dispatch to APPROVED
  db.prepare("UPDATE dispatch_assignments SET status = 'APPROVED', updated_at = datetime('now') WHERE id = ?").run(review.dispatch_id);

  writeAudit({ entityType: 'review_queue', entityId: review.id, action: 'REVIEW_RESOLVED', fromStatus: 'OPEN', toStatus: 'RESOLVED', userId: req.user!.userId, role: req.user!.role, ip: getClientIp(req), metadata: { override_reason, resolution_notes } });
  return res.json({ message: 'Review resolved, dispatch approved' });
});

// GET /api/v2/pod/dispatch/:dispatchId
router.get('/dispatch/:dispatchId', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const pods = db.prepare('SELECT * FROM pod_documents WHERE dispatch_id = ? ORDER BY created_at DESC').all(req.params.dispatchId);
  return res.json(pods);
});

export default router;
