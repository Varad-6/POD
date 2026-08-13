// ============================================================
// POD — SQLite Database Initialization & Data Seeding
// ============================================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import {
  CONTRACTS,
  PURCHASE_ORDERS,
  OFFLOAD_RECORDS,
  INVOICES,
  USERS,
} from '../../src/data/mockData';

const dbPath = path.resolve(process.cwd(), 'db', 'pod_database.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initDatabase() {
  const schemaPath = path.resolve(process.cwd(), 'server', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Seed Contracts if empty
  const contractCount = (db.prepare('SELECT COUNT(*) as count FROM contracts').get() as any).count;
  if (contractCount === 0) {
    console.info('[DB] Seeding Contracts table...');
    const insertContract = db.prepare(`
      INSERT INTO contracts (
        contract_number, quality_type, target_quantity, uom, net_value, rate,
        valid_from, valid_to, sold_to_party, currency, from_location, to_location, sap_sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    CONTRACTS.forEach((c: any) => {
      insertContract.run(
        c.contractNumber, c.qualityType, c.targetQuantity, c.uom, c.netValue, c.rate,
        c.validFrom, c.validTo, c.soldToParty, c.currency, c.fromLocation, c.toLocation, c.sapSyncStatus || 'SYNCED'
      );
    });
  }

  // Seed POs if empty
  const poCount = (db.prepare('SELECT COUNT(*) as count FROM purchase_orders').get() as any).count;
  if (poCount === 0) {
    console.info('[DB] Seeding Purchase Orders table...');
    const insertPO = db.prepare(`
      INSERT INTO purchase_orders (
        purchase_order_no, contract_ref, transporter, product_description, rate, unit,
        target_quantity, cost_center, from_location, to_location, payment_terms, po_date, status,
        signed_by, signed_date, bilty_no, bilty_date, consignor_name, consignee_name, declared_value, sap_sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    PURCHASE_ORDERS.forEach((po: any) => {
      insertPO.run(
        po.purchaseOrderNo, po.contractRef, po.transporter, po.productDescription, po.rate, po.unit,
        po.targetQuantity, po.costCenter, po.fromLocation, po.toLocation, po.paymentTerms, po.poDate, po.status,
        po.signedBy || null, po.signedDate || null, po.biltyNo || null, po.biltyDate || null,
        po.consignorName || null, po.consigneeName || null, po.declaredValue || null, po.sapSyncStatus || 'SYNCED'
      );
    });
  }

  // Seed Transport Runs if empty
  const runCount = (db.prepare('SELECT COUNT(*) as count FROM transport_runs').get() as any).count;
  if (runCount === 0) {
    console.info('[DB] Seeding Transport Runs table...');
    const insertRun = db.prepare(`
      INSERT INTO transport_runs (
        waybill_no, po_ref, loading_wayslip_no, horse_reg_no, trailer1_reg_no, trailer2_reg_no,
        driver_name, driver_id_no, driver_license_no, license_expiry_date, is_license_valid,
        bilty_no, bilty_date, consignor_name, consignee_name, declared_value,
        dispatch_tare_kg, dispatch_gross_kg, dispatch_net_kg, arrival_gross_kg, arrival_tare_kg, arrival_net_kg,
        total_units, damaged_units, damaged_weight_kg, damage_reason, accepted_net_kg,
        weight_exception_reason, exception_notes, loading_km, offloading_km, operator_name, site,
        product_description, offload_date, pod_status, pre_dispatch, customer_check, uploaded_file_name, rejection_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    OFFLOAD_RECORDS.forEach((r: any) => {
      insertRun.run(
        r.waybillNo, r.poRef, r.loadingWaySlipNo, r.horseRegNo, r.trailer1RegNo || '', r.trailer2RegNo || '',
        r.driverName, r.driverIdNo, r.driverLicenseNo || '', r.licenseExpiryDate || '', r.isLicenseValid ? 1 : 0,
        r.biltyNo || '', r.biltyDate || '', r.consignorName || '', r.consigneeName || '', r.declaredValue || 0,
        r.dispatchTareWeightKg || r.tareWeightKg || 12000, r.dispatchGrossWeightKg || r.grossWeightKg || 42000,
        r.dispatchNetWeightKg || r.netWeightKg || 30000, r.arrivalGrossWeightKg || r.grossWeightKg || 41850,
        r.arrivalTareWeightKg || r.tareWeightKg || 12000, r.arrivalNetWeightKg || r.netWeightKg || 29850,
        r.totalUnits || 0, r.damagedUnits || 0, r.damagedWeightKg || 0, r.damageReason || '', r.acceptedNetWeightKg || r.netWeightKg || 29850,
        r.weightExceptionReason || 'NONE', r.exceptionNotes || '', r.loadingKm || 0, r.offloadingKm || 0,
        r.operatorName || '', r.site || '', r.productDescription || '', r.offloadDate || '', r.podStatus || 'PENDING_POD',
        r.preDispatch || 'PASSED', r.customerCheck || 'STAMPED_CONFIRMED', r.uploadedFileName || null, r.rejectionReason || null
      );
    });
  }

  console.info('[DB] SQLite database initialized and synced cleanly!');
}
