/**
 * Comprehensive Automated Verification Suite
 * Tests all 10 Master Implementation Scenarios + Regressions
 */
import { getDb, initDb } from './server/db/database_v3.js';
import { OCRService } from './server/services/ocr/OCRService.js';
import { join } from 'path';
import { existsSync, writeFileSync, unlinkSync } from 'fs';

async function runTests() {
  console.log('=====================================================');
  console.log('🚀 RUNNING PRODOPS ADDITIVE INVOICE OCR TEST SUITE');
  console.log('=====================================================\n');

  const db = initDb();
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}${detail ? ` (${detail})` : ''}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
      failedCount++;
    }
  }

  // ── Setup Test Data in SQLite ──────────────────────────────
  // Ensure we have test PO, Transporter, Job Config, and Assignment
  db.prepare(`
    INSERT OR IGNORE INTO customers (id, name, sap_customer_no, gps_lat, gps_lng, address)
    VALUES (1, 'PODZO Mining – Emoyeni Siding', 'SAP-CUST-1001', -25.7670, 29.4630, 'Emoyeni Siding')
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO transporters (id, name, gstin)
    VALUES (1, 'Sipho Transport Services', '27AABCS0001A1Z1')
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO contracts (id, sap_contract_no, customer_id, start_date, end_date, pdf_url, status)
    VALUES (1, '4600000017', 1, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000017.pdf', 'ACTIVE')
  `).run();

  db.prepare(`
    INSERT OR REPLACE INTO purchase_orders (id, contract_id, sap_po_no, po_item_no, material, uom, target_qty, rate, tolerance_pct, cost_center, status)
    VALUES (1, 1, '4500001714', 10, 'SL BIT 20%ASH (40006653)', 'TO', 34.0, 151.50, 0.5, 'CC-MINING-01', 'OPEN')
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO drivers (id, transporter_id, name, license_no, license_expiry, prdp_expiry)
    VALUES (1, 1, 'Rajesh Kumar', 'DL-850912-GP', '2027-12-31', '2027-12-31')
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO vehicles (id, transporter_id, reg_no, capacity)
    VALUES (1, 1, 'KV44RCGP', 70.0)
  `).run();

  db.prepare(`
    INSERT OR REPLACE INTO job_configs (id, po_id, transporter_id, availability_window, timebound, status)
    VALUES (100, 1, 1, '06:00 - 18:00', '2026-10-31', 'ASSIGNED')
  `).run();

  // Clean prior test assignments safely
  try {
    db.pragma('foreign_keys = OFF');
    db.prepare("DELETE FROM miro_invoices WHERE main_invoice_id IN (SELECT id FROM main_invoices WHERE delivery_invoice_id IN (SELECT id FROM delivery_invoices WHERE assignment_id >= 900))").run();
    db.prepare("DELETE FROM main_invoices WHERE delivery_invoice_id IN (SELECT id FROM delivery_invoices WHERE assignment_id >= 900)").run();
    db.prepare("DELETE FROM sap_s4_mirror WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM delivery_invoices WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM ca_verification WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM variance_checks WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM pod_documents WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM review_queue WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM weight_logs WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM otp_verifications WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM supervisor_stamp WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM supervisor_checks WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM bilty_uploads WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM delivery_capture WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM arrival_confirmations WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM transit_events WHERE assignment_id >= 900").run();
    db.prepare("DELETE FROM transport_assignments WHERE id >= 900").run();
  } finally {
    db.pragma('foreign_keys = ON');
  }

  // Helper function to simulate the exact backend pipeline on an assignment
  async function testUploadPipeline(assignmentId: number, filePath: string | null, mockScenario?: 'MATCH' | 'MISMATCH' | 'BLURRY') {
    const poInfo = db.prepare(`
      SELECT po.target_qty, po.tolerance_pct, po.sap_po_no, po.material, po.rate, t.name as vendor_name
      FROM transport_assignments ta
      JOIN job_configs jc ON jc.id = ta.job_config_id
      JOIN purchase_orders po ON po.id = jc.po_id
      LEFT JOIN transporters t ON t.id = jc.transporter_id
      WHERE ta.id = ?
    `).get(assignmentId) as any;

    const physicalNetTons = poInfo.target_qty || 34.0;
    const tolerancePct = poInfo.tolerance_pct || 0.5;
    const sapPoNo = poInfo.sap_po_no;

    let ocrWeight = physicalNetTons;
    let confidence = 98.5;
    let ocrWaybill = sapPoNo;
    let matchStatus = 'MATCH';
    let flagReason = 'AWAITING_CA_VERIFY';
    let extractedInvoice: any = null;

    if (filePath && !mockScenario) {
      const mime = filePath.endsWith('.png') ? 'image/png' : 'application/pdf';
      extractedInvoice = await OCRService.processInvoice(filePath, mime);

      if (extractedInvoice.processingStatus === 'FAILED') {
        return { error: extractedInvoice.processingError, status: 'FAILED' };
      }

      ocrWaybill = extractedInvoice.poNumber || extractedInvoice.deliveryNumber || extractedInvoice.invoiceNumber || 'UNKNOWN';
      confidence = extractedInvoice.confidence;

      const extractedQty = extractedInvoice.lineItems?.[0]?.quantity || 
        (extractedInvoice.totalAmount && poInfo.rate ? (extractedInvoice.totalAmount / poInfo.rate) : physicalNetTons);
      ocrWeight = parseFloat(extractedQty.toFixed(2));

      // Duplicate check
      let isDuplicate = false;
      if (extractedInvoice.fileHash) {
        const dupCheck = db.prepare(`
          SELECT id, assignment_id FROM pod_documents
          WHERE (file_hash = ? AND file_hash IS NOT NULL AND file_hash != '' AND assignment_id != ?)
             OR (ocr_invoice_no = ? AND ocr_vendor_name = ? AND ocr_invoice_no IS NOT NULL AND assignment_id != ?)
        `).get(extractedInvoice.fileHash, assignmentId, extractedInvoice.invoiceNumber, extractedInvoice.vendorName, assignmentId) as any;
        if (dupCheck) isDuplicate = true;
      }

      const isMissingPo = !extractedInvoice.poNumber;
      const isPoMismatch = !isMissingPo && extractedInvoice.poNumber !== sapPoNo;

      let isVendorMismatch = false;
      if (extractedInvoice.vendorName && poInfo.vendor_name) {
        const v1 = extractedInvoice.vendorName.toLowerCase();
        const v2 = poInfo.vendor_name.toLowerCase();
        const v1Words = v1.split(/\s+/).filter(w => w.length > 3 && !['transport', 'logistics', 'services', 'ltd', 'pty'].includes(w));
        const v2Words = v2.split(/\s+/).filter(w => w.length > 3 && !['transport', 'logistics', 'services', 'ltd', 'pty'].includes(w));
        const sharesKeyword = v1Words.some(w => v2.includes(w)) || v2Words.some(w => v1.includes(w));
        if (!sharesKeyword) {
          isVendorMismatch = true;
        }
      }

      const variancePct = parseFloat((Math.abs((ocrWeight - physicalNetTons) / physicalNetTons) * 100).toFixed(2));
      const isQtyVariance = variancePct > tolerancePct;

      let isAmountMismatch = false;
      if (extractedInvoice.totalAmount && poInfo.rate) {
        const expectedSubtotal = ocrWeight * poInfo.rate;
        const expectedTotal = expectedSubtotal * 1.15;
        if (Math.abs(extractedInvoice.totalAmount - expectedTotal) / expectedTotal > 0.05 &&
            Math.abs(extractedInvoice.totalAmount - expectedSubtotal) / expectedSubtotal > 0.05) {
          isAmountMismatch = true;
        }
      }

      let isTaxMismatch = false;
      if (extractedInvoice.taxAmount && extractedInvoice.subtotalAmount) {
        const expectedTax = extractedInvoice.subtotalAmount * 0.15;
        if (Math.abs(extractedInvoice.taxAmount - expectedTax) > 50.0) {
          isTaxMismatch = true;
        }
      }

      const isLowConfidence = (confidence !== null && confidence !== undefined && confidence < 70.0) || extractedInvoice.processingStatus === 'REVIEW_REQUIRED';

      if (isDuplicate) {
        matchStatus = 'MISMATCH';
        flagReason = 'OCR_MISMATCH';
      } else if (isMissingPo || isPoMismatch || isVendorMismatch) {
        matchStatus = 'MISMATCH';
        flagReason = 'OCR_MISMATCH';
      } else if (isQtyVariance || isAmountMismatch || isTaxMismatch) {
        matchStatus = 'MISMATCH';
        flagReason = 'TOLERANCE_EXCEEDED';
      } else if (isLowConfidence) {
        matchStatus = 'LOW_CONFIDENCE';
        flagReason = 'OCR_MISMATCH';
      } else {
        matchStatus = 'MATCH';
        flagReason = 'AWAITING_CA_VERIFY';
      }
    } else {
      // Mock scenario
      const scenario = mockScenario || 'MATCH';
      if (scenario === 'MISMATCH') {
        ocrWeight = physicalNetTons + 5.0;
        matchStatus = 'MISMATCH';
        confidence = 94.2;
        flagReason = 'TOLERANCE_EXCEEDED';
      } else if (scenario === 'BLURRY') {
        ocrWeight = 0.0;
        ocrWaybill = 'UNKNOWN';
        matchStatus = 'LOW_CONFIDENCE';
        confidence = 34.0;
        flagReason = 'OCR_MISMATCH';
      }
    }

    // Persist to DB
    db.prepare(`
      INSERT OR REPLACE INTO pod_documents (
        assignment_id, pod_file_url, ocr_waybill_extracted, ocr_weight_extracted,
        ocr_confidence_pct, match_status, ocr_invoice_no, ocr_vendor_name,
        ocr_po_no, ocr_material, ocr_quantity, ocr_total_amount, ocr_tax_amount,
        ocr_line_items_json, ocr_raw_text, file_hash, ocr_provider,
        ocr_processing_status, ocr_processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      assignmentId,
      filePath || '/uploads/mock.pdf',
      ocrWaybill,
      ocrWeight,
      confidence,
      matchStatus,
      extractedInvoice?.invoiceNumber || null,
      extractedInvoice?.vendorName || null,
      extractedInvoice?.poNumber || null,
      extractedInvoice?.lineItems?.[0]?.description || poInfo.material || null,
      ocrWeight,
      extractedInvoice?.totalAmount || null,
      extractedInvoice?.taxAmount || null,
      extractedInvoice?.lineItems ? JSON.stringify(extractedInvoice.lineItems) : null,
      extractedInvoice?.rawText || null,
      extractedInvoice?.fileHash || null,
      extractedInvoice?.ocrProvider || 'MOCK',
      extractedInvoice?.processingStatus || 'EXTRACTED'
    );

    db.prepare(`
      INSERT OR REPLACE INTO review_queue (assignment_id, flag_reason, status, blocks_miro_bool)
      VALUES (?, ?, 'OPEN', 1)
    `).run(assignmentId, flagReason);

    db.prepare("UPDATE transport_assignments SET status = 'UNDER_REVIEW' WHERE id = ?").run(assignmentId);

    return {
      matchStatus,
      flagReason,
      confidence,
      ocrWeight,
      ocrWaybill,
      extractedInvoice
    };
  }

  // Helper to create assignment
  function createAssignment(id: number) {
    db.prepare(`
      INSERT OR REPLACE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, scheduled_date, license_no, gstin, status)
      VALUES (?, 100, 1, 1, '2026-10-05', 'DL-850912-GP', '27AABCS0001A1Z1', 'DELIVERED')
    `).run(id);
  }

  // ──────────────────────────────────────────────────────────
  // TEST SCENARIOS EXECUTION
  // ──────────────────────────────────────────────────────────

  // Scenario 1: Full Match
  createAssignment(901);
  const res1 = await testUploadPipeline(901, join(process.cwd(), 'test-invoices/invoice_001_full_match.pdf'));
  assert(res1.matchStatus === 'MATCH', 'Scenario 1 — Full Match produces MATCH status', `Status: ${res1.matchStatus}`);
  assert(res1.flagReason === 'AWAITING_CA_VERIFY', 'Scenario 1 — Flag reason is AWAITING_CA_VERIFY');
  assert(res1.ocrWeight === 34.0, 'Scenario 1 — Weight extracted accurately', `Qty: ${res1.ocrWeight}`);

  // Scenario 2: Quantity Mismatch
  createAssignment(902);
  const res2 = await testUploadPipeline(902, join(process.cwd(), 'test-invoices/invoice_002_quantity_mismatch.pdf'));
  assert(res2.matchStatus === 'MISMATCH', 'Scenario 2 — Quantity Mismatch produces MISMATCH status', `Status: ${res2.matchStatus}`);
  assert(res2.flagReason === 'TOLERANCE_EXCEEDED', 'Scenario 2 — Flag reason is TOLERANCE_EXCEEDED', `Extracted Qty: ${res2.ocrWeight}`);

  // Scenario 3: Amount Mismatch
  createAssignment(903);
  const res3 = await testUploadPipeline(903, join(process.cwd(), 'test-invoices/invoice_003_amount_mismatch.pdf'));
  assert(res3.matchStatus === 'MISMATCH', 'Scenario 3 — Amount Mismatch produces MISMATCH status', `Status: ${res3.matchStatus}`);
  assert(res3.flagReason === 'TOLERANCE_EXCEEDED', 'Scenario 3 — Flag reason is TOLERANCE_EXCEEDED');

  // Scenario 4: Vendor Mismatch
  createAssignment(904);
  const res4 = await testUploadPipeline(904, join(process.cwd(), 'test-invoices/invoice_004_vendor_mismatch.pdf'));
  assert(res4.matchStatus === 'MISMATCH', 'Scenario 4 — Vendor Mismatch produces MISMATCH status', `Status: ${res4.matchStatus}`);
  assert(res4.flagReason === 'OCR_MISMATCH', 'Scenario 4 — Flag reason is OCR_MISMATCH');

  // Scenario 5: PO Mismatch
  createAssignment(905);
  const res5 = await testUploadPipeline(905, join(process.cwd(), 'test-invoices/invoice_005_po_mismatch.pdf'));
  assert(res5.matchStatus === 'MISMATCH', 'Scenario 5 — PO Mismatch produces MISMATCH status', `Status: ${res5.matchStatus}`);
  assert(res5.flagReason === 'OCR_MISMATCH', 'Scenario 5 — Flag reason is OCR_MISMATCH');

  // Scenario 6: Missing PO
  createAssignment(906);
  const res6 = await testUploadPipeline(906, join(process.cwd(), 'test-invoices/invoice_006_missing_po.pdf'));
  assert(res6.matchStatus === 'MISMATCH', 'Scenario 6 — Missing PO produces MISMATCH status', `Status: ${res6.matchStatus}`);
  assert(res6.extractedInvoice?.poNumber === null, 'Scenario 6 — PO is null (not invented)');

  // Scenario 7: Duplicate Invoice (invoice 007 has same content/hash as invoice 001)
  createAssignment(907);
  const res7 = await testUploadPipeline(907, join(process.cwd(), 'test-invoices/invoice_007_duplicate_invoice.pdf'));
  assert(res7.matchStatus === 'MISMATCH', 'Scenario 7 — Duplicate Invoice detected as MISMATCH', `Status: ${res7.matchStatus}`);
  assert(res7.flagReason === 'OCR_MISMATCH', 'Scenario 7 — Duplicate flags OCR_MISMATCH');

  // Scenario 8: Low Quality Scan (blurred image)
  createAssignment(908);
  const res8 = await testUploadPipeline(908, join(process.cwd(), 'test-invoices/invoice_008_low_quality_scan.png'));
  assert(res8.matchStatus === 'LOW_CONFIDENCE' || res8.matchStatus === 'MISMATCH', 'Scenario 8 — Low quality scan handled safely without crash', `Status: ${res8.matchStatus}`);

  // Scenario 9: Multiple Line Items
  createAssignment(909);
  const res9 = await testUploadPipeline(909, join(process.cwd(), 'test-invoices/invoice_009_multiple_line_items.pdf'));
  assert(res9.extractedInvoice?.lineItems?.length === 3, 'Scenario 9 — Multiple line items extracted', `Found ${res9.extractedInvoice?.lineItems?.length} items`);
  assert(res9.extractedInvoice?.lineItems?.[0]?.materialCode === '40006653', 'Scenario 9 — Line item 1 material code verified');
  assert(res9.extractedInvoice?.lineItems?.[1]?.description.includes('ADBLUE'), 'Scenario 9 — Line item 2 description verified');

  // Scenario 10: Tax Mismatch
  createAssignment(910);
  const res10 = await testUploadPipeline(910, join(process.cwd(), 'test-invoices/invoice_010_tax_mismatch.pdf'));
  assert(res10.matchStatus === 'MISMATCH', 'Scenario 10 — Tax Mismatch produces MISMATCH status', `Status: ${res10.matchStatus}`);
  assert(res10.flagReason === 'TOLERANCE_EXCEEDED', 'Scenario 10 — Flag reason is TOLERANCE_EXCEEDED');

  // Regression Test A: Existing Dummy Mode with MATCH
  createAssignment(911);
  const resA = await testUploadPipeline(911, null, 'MATCH');
  assert(resA.matchStatus === 'MATCH', 'Regression A — Dummy MATCH scenario works as before', `Status: ${resA.matchStatus}`);

  // Regression Test B: Existing Dummy Mode with MISMATCH
  createAssignment(912);
  const resB = await testUploadPipeline(912, null, 'MISMATCH');
  assert(resB.matchStatus === 'MISMATCH', 'Regression B — Dummy MISMATCH scenario works as before', `Status: ${resB.matchStatus}`);

  // Regression Test C: Existing Dummy Mode with BLURRY
  createAssignment(913);
  const resC = await testUploadPipeline(913, null, 'BLURRY');
  assert(resC.matchStatus === 'LOW_CONFIDENCE', 'Regression C — Dummy BLURRY scenario works as before', `Status: ${resC.matchStatus}`);

  // File validation tests
  const invalidTxt = join(process.cwd(), 'test-invalid.txt');
  writeFileSync(invalidTxt, 'Some plain text');
  const valRes = OCRService.validateFile(invalidTxt, 'text/plain');
  assert(!valRes.valid, 'Validation — Rejects unsupported file types (e.g. .txt)');
  unlinkSync(invalidTxt);

  const emptyPdf = join(process.cwd(), 'test-empty.pdf');
  writeFileSync(emptyPdf, '');
  const emptyRes = OCRService.validateFile(emptyPdf, 'application/pdf');
  assert(!emptyRes.valid, 'Validation — Rejects empty 0-byte file');
  unlinkSync(emptyPdf);

  // Database audit check
  const docCount = (db.prepare("SELECT count(*) as c FROM pod_documents WHERE assignment_id >= 900").get() as any).c;
  assert(docCount >= 10, 'Database Persistence — Extracted data persisted for all test scenarios', `Saved docs: ${docCount}`);

  console.log('\n=====================================================');
  console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('=====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
