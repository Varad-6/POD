-- ============================================================
-- IKWEZI TRANSPORTER PORTAL — DATABASE SCHEMA V3
-- SQLite Schema mapping exactly to the User Flow Diagram & Spec
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ── 0. USERS, CUSTOMERS, & SESSIONS ─────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK(role IN ('CA', 'TA', 'DR', 'CR', 'SR')),
  display_name  TEXT NOT NULL,
  email         TEXT UNIQUE,
  phone         TEXT,
  entity_id     INTEGER, -- transporter_id, driver_id, customer_id, etc.
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  sap_customer_no TEXT UNIQUE NOT NULL,
  gps_lat         REAL NOT NULL,
  gps_lng         REAL NOT NULL,
  address         TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transporters (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  gstin           TEXT UNIQUE NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 1. CONTRACTS & PURCHASE ORDERS ──────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sap_contract_no TEXT UNIQUE NOT NULL,
  customer_id     INTEGER NOT NULL REFERENCES customers(id),
  start_date      TEXT NOT NULL,
  end_date        TEXT NOT NULL,
  pdf_url         TEXT,
  status          TEXT NOT NULL CHECK(status IN ('ACTIVE', 'EXPIRED', 'TERMINATED')) DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id     INTEGER NOT NULL REFERENCES contracts(id),
  sap_po_no       TEXT NOT NULL,
  po_item_no      INTEGER NOT NULL DEFAULT 10,
  material        TEXT NOT NULL,
  uom             TEXT NOT NULL,
  target_qty      REAL NOT NULL,
  rate            REAL NOT NULL,
  tolerance_pct   REAL NOT NULL,
  cost_center     TEXT,
  allowed_queue_time_mins INTEGER DEFAULT 60,
  detention_rate_per_hour REAL DEFAULT 150.00,
  status          TEXT NOT NULL CHECK(status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'OPEN',
  UNIQUE(sap_po_no, po_item_no)
);

-- ── 2. JOB CONFIGS & TRANSPORT ASSIGNMENTS ───────────────────
CREATE TABLE IF NOT EXISTS job_configs (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id                       INTEGER NOT NULL REFERENCES purchase_orders(id),
  transporter_id              INTEGER NOT NULL REFERENCES transporters(id),
  availability_window         TEXT NOT NULL, -- legacy string representation
  availability_window_start   TEXT DEFAULT '06:00',
  availability_window_end     TEXT DEFAULT '18:00',
  requested_pickup_datetime  TEXT DEFAULT (datetime('now', '+1 day')),
  expected_delivery_datetime TEXT DEFAULT (datetime('now', '+2 days')),
  final_due_datetime         TEXT DEFAULT (datetime('now', '+3 days')),
  acceptance_window_hours     INTEGER DEFAULT 4,
  tender_response_deadline   TEXT DEFAULT (datetime('now', '+4 hours')),
  timebound                   TEXT NOT NULL, -- expiry date/time
  status                      TEXT NOT NULL CHECK(status IN ('PENDING', 'ASSIGNED', 'EXPIRED')) DEFAULT 'PENDING'
);

-- Junction table linking Job Configurations / Transport Executions to multiple POs
CREATE TABLE IF NOT EXISTS job_config_pos (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  job_config_id     INTEGER NOT NULL REFERENCES job_configs(id) ON DELETE CASCADE,
  po_id             INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  planned_qty       REAL NOT NULL,
  uom               TEXT NOT NULL DEFAULT 'TO',
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(job_config_id, po_id)
);

CREATE INDEX IF NOT EXISTS idx_job_config_pos_job ON job_config_pos(job_config_id);
CREATE INDEX IF NOT EXISTS idx_job_config_pos_po ON job_config_pos(po_id);


CREATE TABLE IF NOT EXISTS drivers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  transporter_id  INTEGER NOT NULL REFERENCES transporters(id),
  name            TEXT NOT NULL,
  license_no      TEXT UNIQUE NOT NULL,
  license_expiry  TEXT NOT NULL,
  prdp_expiry     TEXT NOT NULL,
  phone           TEXT
);

CREATE TABLE IF NOT EXISTS vehicles (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  transporter_id  INTEGER NOT NULL REFERENCES transporters(id),
  reg_no          TEXT UNIQUE NOT NULL,
  capacity        REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS transport_assignments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  job_config_id INTEGER NOT NULL REFERENCES job_configs(id),
  driver_id     INTEGER NOT NULL REFERENCES drivers(id),
  vehicle_id    INTEGER NOT NULL REFERENCES vehicles(id),
  location      TEXT,
  license_no    TEXT NOT NULL,
  gstin         TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  assigned_qty REAL,
  queue_entry_time TEXT,
  actual_arrival_time TEXT,
  loading_status TEXT DEFAULT 'PENDING',
  journey_authorized INTEGER DEFAULT 0,
  queue_time_mins INTEGER,
  penalty_amount REAL,
  dispatch_ip TEXT,
  dispatch_user_agent TEXT,
  status        TEXT NOT NULL CHECK(status IN (
    'ASSIGNED', 'GATE_DENIED', 'MINE_TARE_LOGGED', 'MINE_GROSS_LOGGED', 
    'DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'POD_UPLOADED', 
    'UNDER_REVIEW', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'
  )) DEFAULT 'ASSIGNED'
);

-- ── 3. EXECUTION DATA & LOGS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_assignment_data (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id   INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
  otp_code        TEXT NOT NULL,
  location        TEXT,
  gps_lat         REAL,
  gps_lng         REAL,
  material        TEXT NOT NULL,
  truck_no        TEXT NOT NULL,
  popup_ack_bool  INTEGER NOT NULL CHECK(popup_ack_bool IN (0, 1)) DEFAULT 0,
  time_captured   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id   INTEGER NOT NULL REFERENCES transport_assignments(id),
  stage           TEXT NOT NULL CHECK(stage IN ('MINE_TARE', 'MINE_GROSS', 'DEST_GROSS', 'DEST_TARE')),
  weight_kg       REAL NOT NULL,
  truck_detail    TEXT,
  logged_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS supervisor_checks (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id       INTEGER NOT NULL REFERENCES transport_assignments(id),
  arrival_date        TEXT NOT NULL,
  arrival_time        TEXT NOT NULL,
  weight_check_bool   INTEGER NOT NULL CHECK(weight_check_bool IN (0, 1)),
  bilty_check_bool    INTEGER NOT NULL CHECK(bilty_check_bool IN (0, 1)),
  material_check_bool INTEGER NOT NULL CHECK(material_check_bool IN (0, 1)),
  license_check_bool  INTEGER NOT NULL CHECK(license_check_bool IN (0, 1)),
  checked_by          INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS supervisor_stamp (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id   INTEGER NOT NULL REFERENCES transport_assignments(id),
  date_timestamp  TEXT NOT NULL DEFAULT (datetime('now')),
  ip_address      TEXT NOT NULL,
  gps_lat         REAL NOT NULL,
  gps_lng         REAL NOT NULL,
  otp_match_bool  INTEGER NOT NULL CHECK(otp_match_bool IN (0, 1))
);

CREATE TABLE IF NOT EXISTS bilty_uploads (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id   INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
  bilty_no        TEXT NOT NULL,
  bilty_date      TEXT NOT NULL,
  upload_url      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS delivery_capture (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id       INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
  truck_data_json     TEXT NOT NULL, -- JSON blob of truck variables
  issues_text         TEXT,
  weight_log_ref      INTEGER REFERENCES weight_logs(id),
  unit_calc           TEXT,          -- Unit conversion/calculation details
  stamp_confirmed_bool INTEGER NOT NULL CHECK(stamp_confirmed_bool IN (0, 1)) DEFAULT 0,
  stamped_at          TEXT
);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id       INTEGER NOT NULL REFERENCES transport_assignments(id),
  stage               TEXT NOT NULL CHECK(stage IN ('PICKUP', 'DELIVERY')),
  otp_code            TEXT NOT NULL,
  generated_at        TEXT NOT NULL DEFAULT (datetime('now')),
  verified_at         TEXT,
  verified_by_role    TEXT CHECK(verified_by_role IN ('CA', 'TA', 'DR', 'CR', 'SR')),
  contact             TEXT,
  status              TEXT NOT NULL CHECK(status IN ('PENDING', 'VERIFIED', 'EXPIRED')) DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS arrival_confirmations (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id       INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
  driver_confirmed_at TEXT NOT NULL DEFAULT (datetime('now')),
  gps_lat             REAL NOT NULL,
  gps_lng             REAL NOT NULL,
  ip_address          TEXT NOT NULL,
  device_info         TEXT
);

CREATE TABLE IF NOT EXISTS transit_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id   INTEGER NOT NULL REFERENCES transport_assignments(id),
  status          TEXT NOT NULL CHECK(status IN ('DISPATCHED', 'EN_ROUTE', 'GEOFENCE_ALERT', 'ARRIVED')),
  gps_lat         REAL NOT NULL,
  gps_lng         REAL NOT NULL,
  logged_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pod_documents (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id          INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
  pod_file_url           TEXT NOT NULL,
  ocr_waybill_extracted  TEXT,
  ocr_weight_extracted   REAL,
  ocr_confidence_pct     REAL,
  match_status           TEXT NOT NULL CHECK(match_status IN ('MATCH', 'MISMATCH', 'PENDING')) DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS variance_checks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id   INTEGER NOT NULL REFERENCES transport_assignments(id),
  stage           TEXT NOT NULL CHECK(stage IN ('MINE', 'DEST')),
  accepted_payload REAL NOT NULL,
  po_target_qty   REAL NOT NULL,
  variance_pct    REAL NOT NULL,
  tolerance_pct   REAL NOT NULL,
  pass_bool       INTEGER NOT NULL CHECK(pass_bool IN (0, 1))
);

CREATE TABLE IF NOT EXISTS review_queue (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id       INTEGER NOT NULL REFERENCES transport_assignments(id),
  flag_reason         TEXT NOT NULL CHECK(flag_reason IN ('OCR_MISMATCH', 'TOLERANCE_EXCEEDED', 'AWAITING_CA_VERIFY')),
  status              TEXT NOT NULL CHECK(status IN ('OPEN', 'RESOLVED')) DEFAULT 'OPEN',
  resolved_by_role    TEXT CHECK(resolved_by_role IN ('CA', 'TA', 'SR')),
  resolved_by_user_id INTEGER REFERENCES users(id),
  resolution_notes    TEXT,
  blocks_miro_bool    INTEGER NOT NULL CHECK(blocks_miro_bool IN (0, 1)) DEFAULT 1,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ca_verification (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id   INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
  verified_bool   INTEGER NOT NULL CHECK(verified_bool IN (0, 1)),
  verified_by     INTEGER NOT NULL REFERENCES users(id),
  verified_at     TEXT NOT NULL DEFAULT (datetime('now')),
  notes           TEXT
);

CREATE TABLE IF NOT EXISTS sap_s4_mirror (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id   INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
  waybill_no      TEXT UNIQUE NOT NULL,
  delivered_qty   REAL NOT NULL,
  rate            REAL NOT NULL,
  total_value     REAL NOT NULL,
  verified_at     TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 4. INVOICING & SAP INTEGRATION ───────────────────────────
CREATE TABLE IF NOT EXISTS delivery_invoices (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id       INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
  accepted_payload    REAL NOT NULL,
  rate                REAL NOT NULL,
  total_value         REAL NOT NULL,
  invoice_no          TEXT,
  file_url            TEXT,
  status              TEXT NOT NULL CHECK(status IN ('DRAFT', 'SENT_TO_CA')) DEFAULT 'DRAFT'
);

CREATE TABLE IF NOT EXISTS main_invoices (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_invoice_id INTEGER UNIQUE NOT NULL REFERENCES delivery_invoices(id),
  po_id               INTEGER NOT NULL REFERENCES purchase_orders(id),
  status              TEXT NOT NULL CHECK(status IN ('PO_DONE')) DEFAULT 'PO_DONE'
);

CREATE TABLE IF NOT EXISTS miro_invoices (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  main_invoice_id INTEGER UNIQUE NOT NULL REFERENCES main_invoices(id),
  sap_invoice_no  TEXT UNIQUE,
  status          TEXT NOT NULL CHECK(status IN ('PARKED', 'POSTED', 'CLEARED')) DEFAULT 'PARKED',
  posted_date     TEXT,
  sap_ref         TEXT,
  paid_amount     REAL DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS sap_sync_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type   TEXT NOT NULL,
  sap_ref       TEXT,
  direction     TEXT NOT NULL CHECK(direction IN ('IN', 'OUT')),
  payload_json  TEXT NOT NULL,
  synced_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── WEIGHT RECONCILIATION & TOLERANCE ────────────────────────
CREATE TABLE IF NOT EXISTS weight_reconciliations (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id       INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
  po_id               INTEGER NOT NULL REFERENCES purchase_orders(id),
  dispatch_net_kg     REAL NOT NULL,
  received_net_kg     REAL NOT NULL,
  variance_kg         REAL NOT NULL,
  variance_pct        REAL NOT NULL,
  tolerance_pct       REAL NOT NULL,
  status              TEXT NOT NULL CHECK(status IN ('WITHIN_TOLERANCE', 'OUTSIDE_TOLERANCE')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── DELIVERY & WEIGHT EXCEPTIONS ─────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_exceptions (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id       INTEGER NOT NULL REFERENCES transport_assignments(id),
  exception_type      TEXT NOT NULL CHECK(exception_type IN ('WEIGHT_VARIANCE', 'MATERIAL_MISMATCH', 'DAMAGE', 'SHORTAGE')),
  dispatch_qty_kg     REAL NOT NULL,
  received_qty_kg     REAL NOT NULL,
  difference_kg       REAL NOT NULL,
  variance_pct        REAL NOT NULL,
  tolerance_pct       REAL NOT NULL,
  reason_category     TEXT NOT NULL,
  comment             TEXT,
  evidence_url        TEXT,
  status              TEXT NOT NULL CHECK(status IN ('OPEN', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')) DEFAULT 'OPEN',
  logged_by           INTEGER NOT NULL REFERENCES users(id),
  resolved_by         INTEGER REFERENCES users(id),
  resolution_notes    TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at         TEXT
);

-- ── DEMO RESET AUDIT LOG ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS demo_reset_audit (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER REFERENCES users(id),
  user_role       TEXT NOT NULL,
  reset_timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  records_reset   INTEGER NOT NULL,
  s21_preserved   INTEGER NOT NULL
);

-- ── INDEXES FOR PERFORMANCE & INTEGRITY ─────────────────────
CREATE INDEX IF NOT EXISTS idx_assignments_job_config ON transport_assignments(job_config_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON transport_assignments(status);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_assignment ON otp_verifications(assignment_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_assignment ON weight_logs(assignment_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_assignment ON review_queue(assignment_id);
CREATE INDEX IF NOT EXISTS idx_transit_events_assignment ON transit_events(assignment_id);
CREATE INDEX IF NOT EXISTS idx_weight_reconciliations_assignment ON weight_reconciliations(assignment_id);
CREATE INDEX IF NOT EXISTS idx_delivery_exceptions_assignment ON delivery_exceptions(assignment_id);
