-- ============================================================
-- IKWEZI TRANSPORTER PORTAL — COMPLETE DATABASE SCHEMA
-- SQLite Migrations (run in order)
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ── 1. USERS & AUTH ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role        TEXT NOT NULL CHECK(role IN ('COMPANY_ADMIN','TRANSPORTER_ADMIN','DRIVER','CUSTOMER','SUPERVISOR')),
  display_name TEXT NOT NULL,
  email       TEXT UNIQUE,
  phone       TEXT,
  entity_id   INTEGER,   -- FK to transporter_id / customer_id depending on role
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,  -- UUID token
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL,
  is_revoked  INTEGER NOT NULL DEFAULT 0
);

-- ── 2. AUDIT LOG (immutable) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type   TEXT NOT NULL,        -- 'dispatch', 'pod_document', 'miro_invoice', etc.
  entity_id     INTEGER NOT NULL,
  action        TEXT NOT NULL,        -- 'STATUS_CHANGE', 'RECORD_CREATED', 'REVIEW_RESOLVED', etc.
  from_status   TEXT,
  to_status     TEXT,
  performed_by_user_id INTEGER REFERENCES users(id),
  performed_by_role    TEXT,
  metadata_json TEXT,                 -- JSON blob for extra context
  ip_address    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 3. CUSTOMERS (Ikwezi Mining sites) ──────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  sap_customer_no TEXT UNIQUE,
  gstin           TEXT,
  site_address    TEXT,
  contact_name    TEXT,
  contact_phone   TEXT,
  contact_email   TEXT,
  gps_lat         REAL,    -- for geofence calculations
  gps_lng         REAL,
  geofence_radius_m INTEGER DEFAULT 500,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 4. TRANSPORTERS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transporters (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  gstin           TEXT UNIQUE NOT NULL,
  contact_name    TEXT,
  contact_phone   TEXT,
  contact_email   TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 5. DRIVERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  transporter_id  INTEGER NOT NULL REFERENCES transporters(id),
  name            TEXT NOT NULL,
  license_no      TEXT UNIQUE NOT NULL,
  license_expiry  TEXT NOT NULL,       -- ISO date string
  prdp_no         TEXT UNIQUE NOT NULL,
  prdp_expiry     TEXT NOT NULL,       -- ISO date string
  phone           TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 6. VEHICLES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  transporter_id  INTEGER NOT NULL REFERENCES transporters(id),
  reg_no          TEXT UNIQUE NOT NULL,   -- Horse plate
  trailer1_reg    TEXT,
  trailer2_reg    TEXT,
  capacity_tonnes REAL,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 7. CONTRACTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sap_contract_no TEXT UNIQUE NOT NULL,
  customer_id     INTEGER NOT NULL REFERENCES customers(id),
  start_date      TEXT NOT NULL,
  end_date        TEXT NOT NULL,
  material        TEXT NOT NULL,
  uom             TEXT NOT NULL DEFAULT 'TON',
  terms           TEXT,
  pdf_url         TEXT,
  status          TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','EXPIRED','TERMINATED')),
  synced_from_sap INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 8. PURCHASE ORDERS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id     INTEGER NOT NULL REFERENCES contracts(id),
  sap_po_no       TEXT UNIQUE NOT NULL,
  material        TEXT NOT NULL,
  uom             TEXT NOT NULL DEFAULT 'TON',
  target_qty      REAL NOT NULL,
  rate            REAL NOT NULL,
  tolerance_pct   REAL NOT NULL DEFAULT 0.5,
  cost_center     TEXT,
  from_location   TEXT NOT NULL,
  to_location     TEXT NOT NULL,
  payment_terms   TEXT DEFAULT 'Net 30',
  status          TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 9. DISPATCH ASSIGNMENTS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS dispatch_assignments (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id                 INTEGER NOT NULL REFERENCES purchase_orders(id),
  transporter_id        INTEGER REFERENCES transporters(id),
  driver_id             INTEGER REFERENCES drivers(id),
  vehicle_id            INTEGER REFERENCES vehicles(id),
  scheduled_date        TEXT,
  availability_window   TEXT,           -- JSON: {start, end}
  assigned_by_user_id   INTEGER REFERENCES users(id),
  assigned_at           TEXT,
  status                TEXT NOT NULL DEFAULT 'PENDING_TA' CHECK(status IN (
    'PENDING_TA',          -- CA created, waiting TA to fill details
    'ASSIGNED',            -- TA confirmed driver + truck
    'GATE_DENIED',         -- SR blocked at gate check
    'MINE_WEIGHED',        -- SR logged dispatch tare+gross
    'DISPATCH_HELD',       -- weight outside tolerance, held
    'DISPATCHED',          -- departed mine site
    'EN_ROUTE',            -- transit
    'GEOFENCE_ALERT',      -- within customer geofence
    'ARRIVED',             -- driver confirmed arrival
    'DEST_WEIGHED',        -- customer logged arrival tare+gross
    'DELIVERED_STAMPED',   -- delivery metadata captured
    'POD_SUBMITTED',       -- driver uploaded POD scan
    'POD_REVIEW',          -- review queue open
    'APPROVED',            -- POD approved, ready to invoice
    'INVOICED',            -- freight invoice submitted
    'MIRO_PARKED',         -- MIRO invoice created
    'MIRO_POSTED',         -- MIRO posted to SAP
    'CLEARED',             -- payment cleared
    'CANCELLED'
  )),
  sr_arrival_date       TEXT,           -- Supervisor assigns arrival date/time
  cancellation_reason   TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 10. BILTY RECORDS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS bilty_records (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id       INTEGER UNIQUE NOT NULL REFERENCES dispatch_assignments(id),
  bilty_no          TEXT,
  bilty_date        TEXT,
  lr_no             TEXT,
  lr_date           TEXT,
  consignor_gstin   TEXT,
  consignee_gstin   TEXT,
  upload_url        TEXT,
  verified_by_sr    INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 11. GATE CHECKS (Supervisor) ────────────────────────────
CREATE TABLE IF NOT EXISTS gate_checks (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id       INTEGER NOT NULL REFERENCES dispatch_assignments(id),
  license_valid     INTEGER NOT NULL CHECK(license_valid IN (0,1)),
  prdp_valid        INTEGER NOT NULL CHECK(prdp_valid IN (0,1)),
  bilty_valid       INTEGER NOT NULL CHECK(bilty_valid IN (0,1)) DEFAULT 0,
  material_match    INTEGER NOT NULL CHECK(material_match IN (0,1)) DEFAULT 0,
  checked_at        TEXT NOT NULL DEFAULT (datetime('now')),
  checked_by_user_id INTEGER REFERENCES users(id),
  result            TEXT NOT NULL CHECK(result IN ('PASS','FAIL')),
  reason            TEXT   -- if FAIL
);

-- ── 12. WEIGHBRIDGE LOGS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS weighbridge_logs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id       INTEGER NOT NULL REFERENCES dispatch_assignments(id),
  checkpoint        TEXT NOT NULL CHECK(checkpoint IN ('MINE_TARE','MINE_GROSS','DEST_GROSS','DEST_TARE')),
  weight_kg         REAL NOT NULL,
  recorded_by_role  TEXT NOT NULL,
  recorded_by_user_id INTEGER REFERENCES users(id),
  timestamp         TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Derived net weight views
CREATE VIEW IF NOT EXISTS v_dispatch_mine_net AS
  SELECT 
    dispatch_id,
    MAX(CASE WHEN checkpoint='MINE_GROSS' THEN weight_kg END) AS mine_gross_kg,
    MAX(CASE WHEN checkpoint='MINE_TARE'  THEN weight_kg END) AS mine_tare_kg,
    MAX(CASE WHEN checkpoint='MINE_GROSS' THEN weight_kg END) -
    MAX(CASE WHEN checkpoint='MINE_TARE'  THEN weight_kg END) AS mine_net_kg
  FROM weighbridge_logs
  GROUP BY dispatch_id;

CREATE VIEW IF NOT EXISTS v_dispatch_dest_net AS
  SELECT 
    dispatch_id,
    MAX(CASE WHEN checkpoint='DEST_GROSS' THEN weight_kg END) AS dest_gross_kg,
    MAX(CASE WHEN checkpoint='DEST_TARE'  THEN weight_kg END) AS dest_tare_kg,
    MAX(CASE WHEN checkpoint='DEST_GROSS' THEN weight_kg END) -
    MAX(CASE WHEN checkpoint='DEST_TARE'  THEN weight_kg END) AS dest_net_kg
  FROM weighbridge_logs
  GROUP BY dispatch_id;

-- ── 13. TRANSIT EVENTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS transit_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id     INTEGER NOT NULL REFERENCES dispatch_assignments(id),
  status          TEXT NOT NULL CHECK(status IN ('DISPATCHED','EN_ROUTE','GEOFENCE_ALERT','ARRIVED')),
  gps_lat         REAL,
  gps_lng         REAL,
  gps_accuracy_m  REAL,
  created_by_role TEXT,
  timestamp       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 14. ARRIVAL CONFIRMATIONS ───────────────────────────────
-- Server-side captured: IP always from req headers, GPS from device with consent
CREATE TABLE IF NOT EXISTS arrival_confirmations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id     INTEGER UNIQUE NOT NULL REFERENCES dispatch_assignments(id),
  driver_id       INTEGER NOT NULL REFERENCES drivers(id),
  gps_lat         REAL,
  gps_lng         REAL,
  gps_accuracy_m  REAL,
  ip_address      TEXT NOT NULL,   -- ALWAYS captured server-side from req.ip/x-forwarded-for
  device_info     TEXT,            -- User-Agent
  driver_confirmed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 15. DELIVERY METADATA ───────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_metadata (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id         INTEGER UNIQUE NOT NULL REFERENCES dispatch_assignments(id),
  iso_timestamp_utc   TEXT NOT NULL,
  client_ip           TEXT NOT NULL,   -- server-side captured
  gps_lat             REAL,
  gps_lng             REAL,
  gps_accuracy_m      REAL,
  esignature_base64   TEXT,
  offload_photo_url   TEXT,
  status              TEXT NOT NULL DEFAULT 'DELIVERED_STAMPED' CHECK(status IN ('DELIVERED_STAMPED','VOIDED'))
);

-- ── 16. DAMAGED CARGO ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS damaged_cargo (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id     INTEGER NOT NULL REFERENCES dispatch_assignments(id),
  damaged_units   INTEGER NOT NULL DEFAULT 0,
  weight_loss_kg  REAL NOT NULL DEFAULT 0,
  reason          TEXT NOT NULL CHECK(reason IN ('SPILLAGE','CONTAMINATION','TRANSIT_DAMAGE','OTHER')),
  logged_by_user_id INTEGER REFERENCES users(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 17. POD DOCUMENTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS pod_documents (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id             INTEGER NOT NULL REFERENCES dispatch_assignments(id),
  scanned_pod_url         TEXT NOT NULL,
  ocr_extracted_waybill   TEXT,
  ocr_extracted_weight    REAL,
  ocr_confidence_pct      REAL,
  match_status            TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK(match_status IN ('MATCH','MISMATCH','PENDING_REVIEW')),
  uploaded_by_user_id     INTEGER REFERENCES users(id),
  created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 18. REVIEW QUEUE ────────────────────────────────────────
-- blocks_miro_bool enforced at API level — POST /miro returns 403 if OPEN queue row exists
CREATE TABLE IF NOT EXISTS review_queue (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  pod_id              INTEGER NOT NULL REFERENCES pod_documents(id),
  dispatch_id         INTEGER NOT NULL REFERENCES dispatch_assignments(id),
  flag_reason         TEXT NOT NULL,  -- e.g. 'OCR_MISMATCH', 'LOW_CONFIDENCE', 'PAYLOAD_VARIANCE'
  resolved_by_role    TEXT CHECK(resolved_by_role IN ('COMPANY_ADMIN','SUPERVISOR', NULL)),
  resolved_by_user_id INTEGER REFERENCES users(id),
  resolution_notes    TEXT,
  override_reason     TEXT CHECK(override_reason IN ('MOISTURE_EVAPORATION','SCALE_OFFSET_HOPPER_SPILLAGE','OTHER', NULL)),
  status              TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','RESOLVED')),
  blocks_miro_bool    INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at         TEXT
);

-- ── 19. FREIGHT INVOICES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS freight_invoices (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id         INTEGER UNIQUE NOT NULL REFERENCES dispatch_assignments(id),
  accepted_payload_kg REAL NOT NULL,
  rate_per_uom        REAL NOT NULL,
  total_value         REAL NOT NULL,   -- accepted_payload × rate
  tax_invoice_no      TEXT,
  tax_invoice_pdf_url TEXT,
  submitted_by_user_id INTEGER REFERENCES users(id),
  reviewed_by_user_id  INTEGER REFERENCES users(id),
  status              TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED')),
  rejection_reason    TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 20. MIRO INVOICES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS miro_invoices (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  freight_invoice_id  INTEGER UNIQUE NOT NULL REFERENCES freight_invoices(id),
  dispatch_id         INTEGER NOT NULL REFERENCES dispatch_assignments(id),
  sap_invoice_no      TEXT,
  waybill_no          TEXT,
  status              TEXT NOT NULL DEFAULT 'PARKED' CHECK(status IN ('PARKED','POSTED','CLEARED')),
  posted_date         TEXT,
  cleared_date        TEXT,
  sap_bapi_ref        TEXT,          -- Simulated BAPI call reference
  posted_by_user_id   INTEGER REFERENCES users(id),
  cleared_by_user_id  INTEGER REFERENCES users(id),
  payment_ref         TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 21. SAP SYNC LOG ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sap_sync_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type     TEXT NOT NULL,    -- 'CONTRACT','PO','INVOICE','PAYMENT'
  entity_id       INTEGER,
  sap_ref         TEXT,
  direction       TEXT NOT NULL CHECK(direction IN ('IN','OUT')),
  payload_json    TEXT NOT NULL,
  synced_at       TEXT NOT NULL DEFAULT (datetime('now')),
  status          TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','SUCCESS','ERROR')),
  error_message   TEXT
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_dispatch_po ON dispatch_assignments(po_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_status ON dispatch_assignments(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_driver ON dispatch_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_transporter ON dispatch_assignments(transporter_id);
CREATE INDEX IF NOT EXISTS idx_weighbridge_dispatch ON weighbridge_logs(dispatch_id);
CREATE INDEX IF NOT EXISTS idx_transit_dispatch ON transit_events(dispatch_id);
CREATE INDEX IF NOT EXISTS idx_pod_dispatch ON pod_documents(dispatch_id);
CREATE INDEX IF NOT EXISTS idx_review_dispatch ON review_queue(dispatch_id);
CREATE INDEX IF NOT EXISTS idx_review_status ON review_queue(status);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_po_contract ON purchase_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_miro_status ON miro_invoices(status);
CREATE INDEX IF NOT EXISTS idx_freight_status ON freight_invoices(status);
