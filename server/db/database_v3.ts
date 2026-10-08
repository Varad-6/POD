/**
 * PODZO Portal — Database Initializer v3
 */
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const DB_PATH = join(__dirname, 'podzo_portal_v3.db');
const SCHEMA_PATH = join(__dirname, 'schema_v3.sql');
const SEED_PATH   = join(__dirname, 'seed_v3.sql');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDb(): Database.Database {
  const instance = getDb();

  // Run schema
  const schema = readFileSync(SCHEMA_PATH, 'utf8');
  instance.exec(schema);
  console.log('[DB V3] Schema applied.');

  // Safe table migration checks
  const addColumnIfNotExists = (tableName: string, columnName: string, columnDef: string) => {
    try {
      const columns = instance.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
      const exists = columns.some(col => col.name === columnName);
      if (!exists) {
        instance.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
        console.log(`[DB V3] Added column ${columnName} to table ${tableName}.`);
      }
    } catch (err) {
      console.warn(`[DB V3] Alter table warning for ${tableName}.${columnName}:`, err);
    }
  };

  addColumnIfNotExists('transport_assignments', 'queue_entry_time', 'TEXT');
  addColumnIfNotExists('transport_assignments', 'actual_arrival_time', 'TEXT');
  addColumnIfNotExists('transport_assignments', 'loading_status', "TEXT DEFAULT 'PENDING'");
  addColumnIfNotExists('transport_assignments', 'journey_authorized', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('transport_assignments', 'queue_time_mins', 'INTEGER');
  addColumnIfNotExists('transport_assignments', 'penalty_amount', 'REAL');
  addColumnIfNotExists('transport_assignments', 'dispatch_ip', 'TEXT');
  addColumnIfNotExists('transport_assignments', 'dispatch_user_agent', 'TEXT');
  addColumnIfNotExists('transport_assignments', 'assigned_qty', 'REAL DEFAULT NULL');
  addColumnIfNotExists('purchase_orders', 'allowed_queue_time_mins', 'INTEGER DEFAULT 60');
  addColumnIfNotExists('purchase_orders', 'detention_rate_per_hour', 'REAL DEFAULT 150.00');
  addColumnIfNotExists('purchase_orders', 'po_item_no', 'INTEGER DEFAULT 10');
  addColumnIfNotExists('miro_invoices', 'paid_amount', 'REAL DEFAULT 0.0');

  // OCR Metadata extensions on pod_documents
  addColumnIfNotExists('pod_documents', 'ocr_invoice_no', 'TEXT');
  addColumnIfNotExists('pod_documents', 'ocr_vendor_name', 'TEXT');
  addColumnIfNotExists('pod_documents', 'ocr_po_no', 'TEXT');
  addColumnIfNotExists('pod_documents', 'ocr_material', 'TEXT');
  addColumnIfNotExists('pod_documents', 'ocr_quantity', 'REAL');
  addColumnIfNotExists('pod_documents', 'ocr_total_amount', 'REAL');
  addColumnIfNotExists('pod_documents', 'ocr_tax_amount', 'REAL');
  addColumnIfNotExists('pod_documents', 'ocr_line_items_json', 'TEXT');
  addColumnIfNotExists('pod_documents', 'ocr_raw_text', 'TEXT');
  addColumnIfNotExists('pod_documents', 'file_hash', 'TEXT');
  addColumnIfNotExists('pod_documents', 'ocr_provider', 'TEXT');
  addColumnIfNotExists('pod_documents', 'ocr_processing_status', "TEXT DEFAULT 'EXTRACTED'");
  addColumnIfNotExists('pod_documents', 'scanned_pod_url', 'TEXT');

  // Migration for review_queue to remove any legacy CHECK constraint restrictions
  try {
    const tableSql = (instance.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='review_queue'").get() as any)?.sql || '';
    if (tableSql.includes('CHECK') && !tableSql.includes('AWAITING_CA_VERIFY')) {
      console.log('[DB V3] Migrating review_queue table schema to support all verification reasons...');
      instance.exec(`
        CREATE TABLE IF NOT EXISTS review_queue_new (
          id                  INTEGER PRIMARY KEY AUTOINCREMENT,
          assignment_id       INTEGER NOT NULL REFERENCES transport_assignments(id),
          flag_reason         TEXT NOT NULL,
          status              TEXT NOT NULL DEFAULT 'OPEN',
          resolved_by_role    TEXT,
          resolved_by_user_id INTEGER REFERENCES users(id),
          resolution_notes    TEXT,
          blocks_miro_bool    INTEGER NOT NULL DEFAULT 1,
          created_at          TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT OR IGNORE INTO review_queue_new (id, assignment_id, flag_reason, status, resolved_by_role, resolved_by_user_id, resolution_notes, blocks_miro_bool, created_at)
        SELECT id, assignment_id, flag_reason, status, resolved_by_role, resolved_by_user_id, resolution_notes, blocks_miro_bool, created_at FROM review_queue;
        DROP TABLE review_queue;
        ALTER TABLE review_queue_new RENAME TO review_queue;
      `);
      console.log('[DB V3] review_queue migrated successfully.');
    }
  } catch (err) {
    console.warn('[DB V3] review_queue migration check warning:', err);
  }

  // Ensure job_config_pos junction table exists
  instance.exec(`
    CREATE TABLE IF NOT EXISTS job_config_pos (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      job_config_id     INTEGER NOT NULL REFERENCES job_configs(id) ON DELETE CASCADE,
      po_id             INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      planned_qty       REAL NOT NULL,
      uom               TEXT NOT NULL DEFAULT 'TO',
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(job_config_id, po_id)
    );
  `);


  // Check if seeded (ensure all core personas exist)
  const userCount = (instance.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (userCount < 13) {
    const seed = readFileSync(SEED_PATH, 'utf8');
    instance.exec(seed);

    // Hash passwords properly
    const DEMO_PASSWORD = 'Demo@1234';
    const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
    instance.prepare('UPDATE users SET password_hash = ?').run(hash);
    console.log('[DB V3] Seed data synchronized. All users set to password: Demo@1234');
  } else {
    console.log(`[DB V3] Database already has ${userCount} users, skipping seed.`);
  }

  // Ensure users table allows 'SA' role in CHECK constraint
  try {
    const userTableSql = (instance.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as any)?.sql || '';
    if (userTableSql.includes('CHECK') && !userTableSql.includes("'SA'")) {
      console.log("[DB V3] Migrating users table to add 'SA' role...");
      instance.exec(`
        CREATE TABLE users_new (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          username        TEXT    NOT NULL UNIQUE,
          password_hash   TEXT    NOT NULL,
          role            TEXT    NOT NULL CHECK (role IN ('CA', 'TA', 'DR', 'SR', 'CR', 'LA', 'SA')),
          display_name    TEXT    NOT NULL,
          email           TEXT    NOT NULL,
          phone           TEXT,
          transporter_id  INTEGER REFERENCES transporters(id),
          customer_id     INTEGER REFERENCES customers(id),
          is_active       INTEGER NOT NULL DEFAULT 1,
          created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
        );
        INSERT OR IGNORE INTO users_new (id, username, password_hash, role, display_name, email, phone, transporter_id, customer_id, is_active, created_at)
        SELECT id, username, password_hash, role, display_name, email, phone, transporter_id, customer_id, is_active, created_at FROM users;
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
      `);
      console.log("[DB V3] users table migrated with 'SA' role.");
    }
  } catch (err) {
    console.warn('[DB V3] users table migration check warning:', err);
  }

  // Ensure sa_staging01 user is specifically inserted if missing
  const hasSa = instance.prepare("SELECT id FROM users WHERE username = 'sa_staging01'").get();
  if (!hasSa) {
    const DEMO_PASSWORD = 'Demo@1234';
    const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
    instance.prepare(`
      INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, email, phone)
      VALUES (13, 'sa_staging01', ?, 'SA', 'Staging Controller', 'staging@podzo.co.za', '+27110001014')
    `).run(hash);
    console.log('[DB V3] Staging user sa_staging01 initialized.');
  }

  addColumnIfNotExists('sales_orders', 'total_net_amount', 'REAL DEFAULT 0.0');
  addColumnIfNotExists('sales_orders', 'currency', "TEXT DEFAULT 'INR'");

  // Outbound Deliveries table
  instance.exec(`
    CREATE TABLE IF NOT EXISTS outbound_deliveries (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      so_id             INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
      sap_so_no         TEXT NOT NULL,
      sap_delivery_no   TEXT UNIQUE NOT NULL,
      delivery_type     TEXT NOT NULL CHECK(delivery_type IN ('COMPLETE','PARTIAL')),
      status            TEXT NOT NULL DEFAULT 'OPEN',
      delivered_qty     REAL DEFAULT 0,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Ensure POC Sales Orders (2318, 2320, 2321, 2322) are seeded if table is empty or update with real SAP master data
  try {
    console.log('[DB V3] Synchronizing authentic SAP master data & deliveries matching screenshots...');
    const insertCustomer = instance.prepare(`
      INSERT OR REPLACE INTO customers (id, name, sap_customer_no, gps_lat, gps_lng, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Customer 122: DP WORLD PVT LTD, Pune (from Screenshot 5 & 6)
    insertCustomer.run(1, 'DP WORLD PVT LTD', '122', 18.5308, 73.8475, '123, Shivajinagar pune, Pune, Maharashtra, 414305, India');
    // Customer 90000501: Company Atharv Pharma abc, Pune (from Screenshot 4)
    insertCustomer.run(2, 'Company Atharv Pharma abc', '90000501', 18.5204, 73.8567, '6, Pune, Maharashtra, 987789, India');
    // Customer 131: Industrial Mining Customer (SO 2318)
    insertCustomer.run(3, 'Industrial Mining Services', '131', -25.7670, 29.4630, 'Industrial Area Siding, Emoyeni, ZA');

    const insertSO = instance.prepare(`
      INSERT OR REPLACE INTO sales_orders (id, sap_so_no, customer_id, sap_customer_no, created_date, delivery_date, overall_status, total_net_amount, currency, portal_status)
      VALUES (?, ?, ?, ?, date('now'), date('now', '+2 days'), 'A', ?, 'INR', 'OPEN')
    `);
    const insertItem = instance.prepare(`
      INSERT OR REPLACE INTO sales_order_items (so_id, sap_so_no, item_no, material, material_desc, order_qty, uom, net_price, plant, storage_location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertDelivery = instance.prepare(`
      INSERT OR REPLACE INTO outbound_deliveries (so_id, sap_so_no, sap_delivery_no, delivery_type, status)
      VALUES (?, ?, ?, ?, 'OPEN')
    `);

    // SO 2318 (Case 1: Single line item complete delivery 80001469)
    insertSO.run(1, '2318', 3, '131', 99.99);
    insertItem.run(1, '2318', '10', '33', 'Brake Pad', 1.0, 'EA', 99.99, '1001', 'SL01');
    insertDelivery.run(1, '2318', '80001469', 'COMPLETE');

    // SO 2321 (Case 2: Multiple material partial delivery 80001471, 80001472 - DP WORLD PVT LTD)
    insertSO.run(2, '2321', 1, '122', 268013.20);
    insertItem.run(2, '2321', '100', '99', 'chair 01', 10.0, 'PC', 12000.00, 'RBP1', 'SL01');
    insertItem.run(2, '2321', '200', '33', 'Drilling machine spare part', 10.0, 'EA', 202000.00, 'RBP1', 'SL01');
    insertItem.run(2, '2321', '300', '41', 'Battery1', 10.0, 'EA', 54013.20, 'RBP1', 'SL01');
    insertDelivery.run(2, '2321', '80001471', 'PARTIAL');
    insertDelivery.run(2, '2321', '80001472', 'PARTIAL');

    // SO 2320 (Case 3: Multiple line item partial delivery 80001470, 80001473 - Atharv Pharma)
    insertSO.run(3, '2320', 2, '90000501', 61000.00);
    insertItem.run(3, '2320', '10', '1702', 'pharma product 01', 10.0, 'EA', 1000.00, 'DSA1', 'SL01');
    insertItem.run(3, '2320', '20', '1727', 'pharma product 10', 10.0, 'EA', 10000.00, 'DSA1', 'DSA1');
    insertItem.run(3, '2320', '30', '1728', 'pharma product 09', 10.0, 'EA', 50000.00, 'DSA1', 'SL01');
    insertDelivery.run(3, '2320', '80001470', 'PARTIAL');
    insertDelivery.run(3, '2320', '80001473', 'PARTIAL');

    // SO 2322 (Case 4: Multiple line item complete delivery 80001474 - Atharv Pharma)
    insertSO.run(4, '2322', 2, '90000501', 26000.00);
    insertItem.run(4, '2322', '10', '1702', 'pharma product 01', 5.0, 'EA', 500.00, 'DSA1', 'SL01');
    insertItem.run(4, '2322', '20', '1727', 'pharma product 10', 5.0, 'EA', 500.00, 'DSA1', 'DSA1');
    insertItem.run(4, '2322', '30', '1728', 'pharma product 09', 5.0, 'EA', 25000.00, 'DSA1', 'SL01');
    insertDelivery.run(4, '2322', '80001474', 'COMPLETE');
    console.log('[DB V3] Real SAP Sales Orders and Outbound Deliveries synchronized.');
  } catch (err) {
    console.warn('[DB V3] Sales order seeding check warning:', err);
  }

  // Ensure active demonstration trip exists for driver and open review item exists
  try {
    const activeDriverTrips = (instance.prepare("SELECT COUNT(*) as c FROM transport_assignments WHERE driver_id = 1 AND status IN ('ASSIGNED', 'MINE_TARE_LOGGED', 'MINE_GROSS_LOGGED', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW')").get() as any)?.c || 0;
    if (activeDriverTrips === 0) {
      console.log('[DB V3] Seeding ready-to-test demonstration trip for Driver Rajesh Kumar...');
      // 1. Create or get job config for PO 4500001714 (id 1)
      let jcId = (instance.prepare("SELECT id FROM job_configs WHERE po_id = 1 LIMIT 1").get() as any)?.id;
      if (!jcId) {
        const jcRes = instance.prepare(`
          INSERT INTO job_configs (po_id, transporter_id, availability_window, availability_window_start, availability_window_end, requested_pickup_datetime, expected_delivery_datetime, final_due_datetime, timebound, status)
          VALUES (1, 1, '06:00-18:00', '06:00', '18:00', datetime('now', '-1 day'), datetime('now', '+1 day'), datetime('now', '+2 days'), datetime('now', '+7 days'), 'ASSIGNED')
        `).run();
        jcId = Number(jcRes.lastInsertRowid);
        instance.prepare("INSERT OR REPLACE INTO job_config_pos (job_config_id, po_id, planned_qty, uom) VALUES (?, 1, 34.0, 'TO')").run(jcId);
      }

      // 2. Create transport assignment at DELIVERED state
      const today = new Date().toISOString().slice(0, 10);
      const taRes = instance.prepare(`
        INSERT INTO transport_assignments (job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status)
        VALUES (?, 1, 1, 'Mine Siding', 'DL-850912-GP', '27AABCS0001A1Z1', ?, 'DELIVERED')
      `).run(jcId, today);
      const newTaId = Number(taRes.lastInsertRowid);

      // 3. Seed weight logs
      instance.prepare("INSERT INTO weight_logs (assignment_id, stage, weight_kg, truck_detail) VALUES (?, 'MINE_TARE', 10000, 'Tare Scale 1')").run(newTaId);
      instance.prepare("INSERT INTO weight_logs (assignment_id, stage, weight_kg, truck_detail) VALUES (?, 'MINE_GROSS', 44000, 'Gross Scale 1')").run(newTaId);
      instance.prepare("INSERT INTO weight_logs (assignment_id, stage, weight_kg, truck_detail) VALUES (?, 'DEST_GROSS', 44000, 'Dest Gross Scale')").run(newTaId);
      instance.prepare("INSERT INTO weight_logs (assignment_id, stage, weight_kg, truck_detail) VALUES (?, 'DEST_TARE', 10000, 'Dest Tare Scale')").run(newTaId);

      // 4. Seed OTP
      instance.prepare("INSERT INTO otp_verifications (assignment_id, stage, otp_code, status) VALUES (?, 'PICKUP', '4821', 'VERIFIED')").run(newTaId);
      instance.prepare("INSERT INTO otp_verifications (assignment_id, stage, otp_code, status) VALUES (?, 'DELIVERY', '9142', 'VERIFIED')").run(newTaId);

      // 5. Seed Bilty
      instance.prepare("INSERT INTO bilty_uploads (assignment_id, bilty_no, bilty_date, upload_url) VALUES (?, 'BL-2026-9901', ?, '/uploads/bilty/sample_bilty.pdf')").run(newTaId, today);

      console.log(`[DB V3] Created active test assignment #${newTaId} for Driver Rajesh Kumar.`);
    }

    // Ensure at least 1 open item in review_queue so Company Admin POD verification desk is never blank
    const openReviewCount = (instance.prepare("SELECT COUNT(*) as c FROM review_queue WHERE status = 'OPEN'").get() as any)?.c || 0;
    if (openReviewCount === 0) {
      let candidateAssignment = instance.prepare(`
        SELECT ta.id, jc.po_id, po.sap_po_no, po.rate
        FROM transport_assignments ta
        JOIN job_configs jc ON jc.id = ta.job_config_id
        JOIN purchase_orders po ON (po.id = jc.po_id OR po.id = (SELECT po_id FROM job_config_pos WHERE job_config_id = jc.id LIMIT 1))
        ORDER BY ta.id DESC LIMIT 1
      `).get() as any;

      if (candidateAssignment) {
        const assignId = candidateAssignment.id;
        instance.prepare("UPDATE transport_assignments SET status = 'UNDER_REVIEW' WHERE id = ?").run(assignId);
        instance.prepare(`
          INSERT OR REPLACE INTO pod_documents (
            assignment_id, pod_file_url, scanned_pod_url, ocr_waybill_extracted, ocr_weight_extracted,
            ocr_confidence_pct, match_status, ocr_invoice_no, ocr_vendor_name,
            ocr_po_no, ocr_material, ocr_quantity, ocr_total_amount, ocr_tax_amount,
            ocr_line_items_json, ocr_raw_text, file_hash, ocr_provider,
            ocr_processing_status, ocr_processed_at
          ) VALUES (
            ?, '/test-invoices/invoice_001_full_match.png', '/test-invoices/invoice_001_full_match.png', '4500001714', 34.0,
            98.5, 'MATCH', 'INV-2026-0001', 'Sipho Transport Services',
            '4500001714', 'SL BIT 20%ASH (40006653)', 34.0, 5923.65, 772.65,
            '[{\"itemNumber\":1,\"materialCode\":\"40006653\",\"description\":\"SL BIT 20%ASH (40006653)\",\"quantity\":34,\"uom\":\"TO\",\"unitPrice\":151.5,\"taxRatePct\":15,\"lineTotal\":5151}]',
            'Sample OCR Invoice Text', 'hash_sample_001', 'OPENAI',
            'EXTRACTED', datetime('now')
          )
        `).run(assignId);

        instance.prepare("DELETE FROM review_queue WHERE assignment_id = ?").run(assignId);
        instance.prepare(`
          INSERT INTO review_queue (assignment_id, flag_reason, status, blocks_miro_bool)
          VALUES (?, 'AWAITING_CA_VERIFY', 'OPEN', 1)
        `).run(assignId);
        console.log(`[DB V3] Seeded open review queue item for assignment #${assignId}.`);
      }
    }
  } catch (err) {
    console.warn('[DB V3] Auto-seed active assignment warning:', err);
  }

  return instance;
}

export default getDb;
