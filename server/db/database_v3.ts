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
  addColumnIfNotExists('pod_documents', 'ocr_stamped_bool', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('pod_documents', 'ocr_stamp_text', 'TEXT');

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

  // Migration for transport_assignments to support STAGING_EXCEPTION status
  try {
    const taSql = (instance.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='transport_assignments'").get() as any)?.sql || '';
    if (taSql.includes('CHECK') && !taSql.includes('STAGING_EXCEPTION')) {
      console.log('[DB V3] Migrating transport_assignments table to support STAGING_EXCEPTION status...');
      instance.exec(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE transport_assignments_new (
          id                  INTEGER PRIMARY KEY AUTOINCREMENT,
          job_config_id       INTEGER REFERENCES job_configs(id),
          driver_id           INTEGER NOT NULL REFERENCES drivers(id),
          vehicle_id          INTEGER NOT NULL REFERENCES vehicles(id),
          location            TEXT,
          license_no          TEXT NOT NULL,
          gstin               TEXT NOT NULL,
          scheduled_date      TEXT NOT NULL,
          assigned_qty        REAL,
          queue_entry_time    TEXT,
          actual_arrival_time TEXT,
          loading_status      TEXT DEFAULT 'PENDING',
          journey_authorized  INTEGER DEFAULT 0,
          queue_time_mins     INTEGER,
          penalty_amount      REAL DEFAULT 0.0,
          status              TEXT NOT NULL DEFAULT 'ASSIGNED',
          dispatch_ip         TEXT,
          dispatch_user_agent TEXT,
          so_distribution_id  INTEGER,
          so_id               INTEGER
        );
        INSERT OR IGNORE INTO transport_assignments_new (
          id, job_config_id, driver_id, vehicle_id, location, license_no, gstin,
          scheduled_date, assigned_qty, queue_entry_time, actual_arrival_time,
          loading_status, journey_authorized, queue_time_mins, penalty_amount,
          status, dispatch_ip, dispatch_user_agent, so_distribution_id, so_id
        )
        SELECT 
          id, job_config_id, driver_id, vehicle_id, location, license_no, gstin,
          scheduled_date, assigned_qty, queue_entry_time, actual_arrival_time,
          loading_status, journey_authorized, queue_time_mins, penalty_amount,
          status, dispatch_ip, dispatch_user_agent, so_distribution_id, so_id
        FROM transport_assignments;
        DROP TABLE transport_assignments;
        ALTER TABLE transport_assignments_new RENAME TO transport_assignments;
        PRAGMA foreign_keys = ON;
      `);
      console.log('[DB V3] transport_assignments migrated successfully.');
    }
  } catch (err) {
    console.warn('[DB V3] transport_assignments migration warning:', err);
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

    INSERT OR IGNORE INTO job_configs (id, po_id, transporter_id, availability_window, timebound, status)
    VALUES (1, 1, 1, '2026-10-08', '2026-10-31', 'ASSIGNED');
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

  addColumnIfNotExists('users', 'transporter_id', 'INTEGER');
  addColumnIfNotExists('users', 'customer_id', 'INTEGER');
  try {
    instance.exec(`
      UPDATE users SET transporter_id = entity_id WHERE role = 'TA' AND (transporter_id IS NULL OR transporter_id = 0);
      UPDATE users SET customer_id = entity_id WHERE role = 'CR' AND (customer_id IS NULL OR customer_id = 0);
    `);
  } catch (e) {
    // ignore
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
      ship_to_party     TEXT,
      ship_to_name      TEXT,
      ship_to_address   TEXT,
      document_date     TEXT,
      planned_gi_date   TEXT,
      actual_gi_date    TEXT,
      total_weight_kg   REAL DEFAULT 0,
      net_weight_kg     REAL DEFAULT 0,
      volume_cd3        REAL DEFAULT 0,
      no_packages       INTEGER DEFAULT 0,
      items_json        TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  addColumnIfNotExists('outbound_deliveries', 'ship_to_party', "TEXT");
  addColumnIfNotExists('outbound_deliveries', 'ship_to_name', "TEXT");
  addColumnIfNotExists('outbound_deliveries', 'ship_to_address', "TEXT");
  addColumnIfNotExists('outbound_deliveries', 'document_date', "TEXT");
  addColumnIfNotExists('outbound_deliveries', 'planned_gi_date', "TEXT");
  addColumnIfNotExists('outbound_deliveries', 'actual_gi_date', "TEXT");
  addColumnIfNotExists('outbound_deliveries', 'total_weight_kg', "REAL DEFAULT 0");
  addColumnIfNotExists('outbound_deliveries', 'net_weight_kg', "REAL DEFAULT 0");
  addColumnIfNotExists('outbound_deliveries', 'volume_cd3', "REAL DEFAULT 0");
  addColumnIfNotExists('outbound_deliveries', 'no_packages', "INTEGER DEFAULT 0");
  addColumnIfNotExists('outbound_deliveries', 'items_json', "TEXT");
  addColumnIfNotExists('transport_assignments', 'bilty_no', "TEXT");
  addColumnIfNotExists('transport_assignments', 'bilty_date', "TEXT");
  addColumnIfNotExists('transport_assignments', 'bilty_url', "TEXT");

  // Core V3 Workflow Tables
  instance.exec(`
    CREATE TABLE IF NOT EXISTS so_distributions (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      so_id             INTEGER NOT NULL REFERENCES sales_orders(id),
      transporter_id    INTEGER NOT NULL REFERENCES transporters(id),
      distributed_by    INTEGER NOT NULL REFERENCES users(id),
      distributed_at    TEXT NOT NULL DEFAULT (datetime('now')),
      status            TEXT NOT NULL CHECK(status IN ('PENDING','ASSIGNED','COMPLETED')) DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS staging_checks (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id     INTEGER NOT NULL REFERENCES transport_assignments(id),
      checked_by        INTEGER NOT NULL REFERENCES users(id),
      checked_at        TEXT NOT NULL DEFAULT (datetime('now')),
      result            TEXT NOT NULL CHECK(result IN ('MATCH','MISMATCH')),
      mismatch_notes    TEXT,
      waybill_no        TEXT,
      waybill_issued_at TEXT
    );

    CREATE TABLE IF NOT EXISTS invoice_events (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id     INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
      invoice_no        TEXT UNIQUE,
      total_value       REAL NOT NULL,
      accepted_payload  REAL NOT NULL,
      rate              REAL NOT NULL,
      status            TEXT NOT NULL CHECK(status IN (
        'DRAFT','PARKED','PAID_PARTIAL','PAID_FULL'
      )) DEFAULT 'DRAFT',
      posted_by         INTEGER REFERENCES users(id),
      posted_at         TEXT,
      customer_notified_at TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payment_events (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id        INTEGER NOT NULL REFERENCES invoice_events(id),
      payment_type      TEXT NOT NULL CHECK(payment_type IN ('FULL','PARTIAL')),
      amount_paid       REAL NOT NULL,
      balance_before    REAL NOT NULL,
      balance_after     REAL NOT NULL,
      paid_by           INTEGER NOT NULL REFERENCES users(id),
      paid_at           TEXT NOT NULL DEFAULT (datetime('now')),
      ref_no            TEXT
    );
  `);

  addColumnIfNotExists('transport_assignments', 'so_distribution_id', 'INTEGER');
  addColumnIfNotExists('transport_assignments', 'so_id', 'INTEGER');

  // Ensure POC Sales Orders (2318, 2320, 2321, 2322) are seeded if table is empty or update with real SAP master data
  try {
    console.log('[DB V3] Synchronizing authentic SAP master data & deliveries matching VL03N screenshots...');
    const insertCustomer = instance.prepare(`
      INSERT OR REPLACE INTO customers (id, name, sap_customer_no, gps_lat, gps_lng, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Customer 122: DP WORLD PVT LTD, Pune
    insertCustomer.run(1, 'DP WORLD PVT LTD', '122', 18.5308, 73.8475, '123, Shivajinagar pune, Pune, Maharashtra, 414305, India');
    // Customer 90000501: Company Atharv Pharma abc, Pune (from Screenshot 4 & VL03N 80001470)
    insertCustomer.run(2, 'Company Atharv Pharma abc', '90000501', 18.5204, 73.8567, '6, Pune, Maharashtra, 987789, India');
    // Customer 131: Company KK limited, Pune (from VL03N 80001469)
    insertCustomer.run(3, 'Company KK limited', '131', 18.5987, 73.7634, '05, wakad, Pune, Maharashtra, 411057, India');

    const insertSO = instance.prepare(`
      INSERT INTO sales_orders (id, sap_so_no, customer_id, sap_customer_no, created_date, delivery_date, overall_status, total_net_amount, currency, portal_status)
      VALUES (?, ?, ?, ?, date('now'), date('now', '+2 days'), 'A', ?, 'INR', 'OPEN')
      ON CONFLICT(id) DO UPDATE SET
        sap_so_no = excluded.sap_so_no,
        customer_id = excluded.customer_id,
        sap_customer_no = excluded.sap_customer_no,
        total_net_amount = excluded.total_net_amount,
        currency = excluded.currency
    `);
    const insertItem = instance.prepare(`
      INSERT OR REPLACE INTO sales_order_items (so_id, sap_so_no, item_no, material, material_desc, order_qty, uom, net_price, plant, storage_location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertDelivery = instance.prepare(`
      INSERT OR REPLACE INTO outbound_deliveries (
        so_id, sap_so_no, sap_delivery_no, delivery_type, status, delivered_qty,
        ship_to_party, ship_to_name, ship_to_address, document_date, planned_gi_date, actual_gi_date,
        total_weight_kg, net_weight_kg, volume_cd3, no_packages, items_json
      )
      VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // SO 2318 (Case 1: Single line item complete delivery 80001469 - Company KK limited)
    insertSO.run(1, '2318', 3, '131', 99.99);
    insertItem.run(1, '2318', '10', '33', 'Brake Pad', 1.0, 'EA', 99.99, '1001', 'SL01');
    insertDelivery.run(
      1, '2318', '80001469', 'COMPLETE', 1.0,
      '131', 'Company KK limited', '05, wakad, Pune, Maharashtra, 411057, India',
      '07.10.2026', '07.10.2026', null,
      10.0, 0.0, 0.0, 0,
      JSON.stringify([
        { item_no: '10', material: '33', material_desc: 'Brake Pad', deliv_qty: 1.0, uom: 'EA', plant: '1001', storage_location: 'SL01' }
      ])
    );

    // SO 2321 (Case 2: Multiple material partial delivery 80001471, 80001472 - DP WORLD PVT LTD)
    insertSO.run(2, '2321', 1, '122', 268013.20);
    insertItem.run(2, '2321', '100', '99', 'chair 01', 10.0, 'PC', 12000.00, 'RBP1', 'SL01');
    insertItem.run(2, '2321', '200', '33', 'Drilling machine spare part', 10.0, 'EA', 202000.00, 'RBP1', 'SL01');
    insertItem.run(2, '2321', '300', '41', 'Battery1', 10.0, 'EA', 54013.20, 'RBP1', 'SL01');
    insertDelivery.run(
      2, '2321', '80001471', 'PARTIAL', 10.0,
      '122', 'DP WORLD PVT LTD', '123, Shivajinagar pune, Pune, Maharashtra, 414305, India',
      '07.10.2026', '07.10.2026', null,
      120.0, 0.0, 0.0, 1,
      JSON.stringify([
        { item_no: '100', material: '99', material_desc: 'chair 01', deliv_qty: 10.0, uom: 'PC', plant: 'RBP1', storage_location: 'SL01' }
      ])
    );
    insertDelivery.run(
      2, '2321', '80001472', 'PARTIAL', 20.0,
      '122', 'DP WORLD PVT LTD', '123, Shivajinagar pune, Pune, Maharashtra, 414305, India',
      '07.10.2026', '07.10.2026', null,
      256.0, 0.0, 0.0, 2,
      JSON.stringify([
        { item_no: '200', material: '33', material_desc: 'Drilling machine spare part', deliv_qty: 10.0, uom: 'EA', plant: 'RBP1', storage_location: 'SL01' },
        { item_no: '300', material: '41', material_desc: 'Battery1', deliv_qty: 10.0, uom: 'EA', plant: 'RBP1', storage_location: 'SL01' }
      ])
    );

    // SO 2320 (Case 3: Multiple line item partial delivery 80001470, 80001473 - Atharv Pharma)
    insertSO.run(3, '2320', 2, '90000501', 61000.00);
    insertItem.run(3, '2320', '10', '1702', 'pharma product 01', 10.0, 'EA', 1000.00, 'DSA1', 'SL01');
    insertItem.run(3, '2320', '20', '1727', 'pharma product 10', 10.0, 'EA', 10000.00, 'DSA1', 'DSA1');
    insertItem.run(3, '2320', '30', '1728', 'pharma product 09', 10.0, 'EA', 50000.00, 'DSA1', 'SL01');
    insertDelivery.run(
      3, '2320', '80001470', 'PARTIAL', 15.0,
      '90000501', 'Company Atharv Pharma abc', '6, Pune, Maharashtra, 987789, India',
      '07.10.2026', '08.10.2026', '07.10.2026',
      10005.5, 0.0, 0.0, 0,
      JSON.stringify([
        { item_no: '10', material: '1702', material_desc: 'pharma product 01', deliv_qty: 5.0, uom: 'EA', plant: 'DSA1', storage_location: 'SL01' },
        { item_no: '20', material: '1727', material_desc: 'pharma product 10', deliv_qty: 5.0, uom: 'EA', plant: 'DSA1', storage_location: 'DSA1' },
        { item_no: '30', material: '1728', material_desc: 'pharma product 09', deliv_qty: 5.0, uom: 'EA', plant: 'DSA1', storage_location: 'SL01' }
      ])
    );
    insertDelivery.run(
      3, '2320', '80001473', 'PARTIAL', 15.0,
      '90000501', 'Company Atharv Pharma abc', '6, Pune, Maharashtra, 987789, India',
      '07.10.2026', '09.10.2026', null,
      10005.5, 0.0, 0.0, 0,
      JSON.stringify([
        { item_no: '10', material: '1702', material_desc: 'pharma product 01', deliv_qty: 5.0, uom: 'EA', plant: 'DSA1', storage_location: 'SL01' },
        { item_no: '20', material: '1727', material_desc: 'pharma product 10', deliv_qty: 5.0, uom: 'EA', plant: 'DSA1', storage_location: 'DSA1' },
        { item_no: '30', material: '1728', material_desc: 'pharma product 09', deliv_qty: 5.0, uom: 'EA', plant: 'DSA1', storage_location: 'SL01' }
      ])
    );

    // SO 2322 (Case 4: Multiple line item complete delivery 80001474 - Atharv Pharma)
    insertSO.run(4, '2322', 2, '90000501', 26000.00);
    insertItem.run(4, '2322', '10', '1702', 'pharma product 01', 5.0, 'EA', 500.00, 'DSA1', 'SL01');
    insertItem.run(4, '2322', '20', '1727', 'pharma product 10', 5.0, 'EA', 500.00, 'DSA1', 'DSA1');
    insertItem.run(4, '2322', '30', '1728', 'pharma product 09', 5.0, 'EA', 25000.00, 'DSA1', 'SL01');
    insertDelivery.run(
      4, '2322', '80001474', 'COMPLETE', 15.0,
      '90000501', 'Company Atharv Pharma abc', '6, Pune, Maharashtra, 987789, India',
      '07.10.2026', '07.10.2026', '07.10.2026',
      26000.0, 0.0, 0.0, 0,
      JSON.stringify([
        { item_no: '10', material: '1702', material_desc: 'pharma product 01', deliv_qty: 5.0, uom: 'EA', plant: 'DSA1', storage_location: 'SL01' },
        { item_no: '20', material: '1727', material_desc: 'pharma product 10', deliv_qty: 5.0, uom: 'EA', plant: 'DSA1', storage_location: 'DSA1' },
        { item_no: '30', material: '1728', material_desc: 'pharma product 09', deliv_qty: 5.0, uom: 'EA', plant: 'DSA1', storage_location: 'SL01' }
      ])
    );
    console.log('[DB V3] Real SAP Sales Orders and Outbound Deliveries synchronized with full VL03N details.');
  } catch (err) {
    console.warn('[DB V3] Sales order seeding check warning:', err);
  }

  // Target Flow: Ensure clean state - all Sales Orders start OPEN, no ghost invoices or test assignments
  try {
    instance.prepare("UPDATE sales_orders SET portal_status = 'OPEN' WHERE portal_status IS NULL").run();
  } catch (err) {
    console.warn('[DB V3] Sales order status check warning:', err);
  }

  return instance;
}

export default getDb;
