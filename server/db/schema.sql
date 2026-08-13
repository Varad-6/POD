-- ============================================================
-- POD Platform Database Schema (SQLite for SAP BTP / Enterprise)
-- ============================================================

CREATE TABLE IF NOT EXISTS contracts (
  contract_number TEXT PRIMARY KEY,
  quality_type TEXT NOT NULL,
  target_quantity REAL NOT NULL,
  uom TEXT DEFAULT 'TON',
  net_value REAL NOT NULL,
  rate REAL NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  sold_to_party TEXT NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  sap_sync_status TEXT DEFAULT 'SYNCED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  purchase_order_no TEXT PRIMARY KEY,
  contract_ref TEXT,
  transporter TEXT NOT NULL,
  product_description TEXT NOT NULL,
  rate REAL NOT NULL,
  unit TEXT DEFAULT 'TON',
  target_quantity REAL NOT NULL,
  cost_center TEXT,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  payment_terms TEXT DEFAULT 'Net 30 Days',
  po_date TEXT NOT NULL,
  status TEXT NOT NULL,
  signed_by TEXT,
  signed_date TEXT,
  bilty_no TEXT,
  bilty_date TEXT,
  consignor_name TEXT,
  consignee_name TEXT,
  declared_value REAL,
  sap_sync_status TEXT DEFAULT 'SYNCED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_ref) REFERENCES contracts (contract_number)
);

CREATE TABLE IF NOT EXISTS transport_runs (
  waybill_no TEXT PRIMARY KEY,
  po_ref TEXT NOT NULL,
  loading_wayslip_no TEXT NOT NULL,
  horse_reg_no TEXT NOT NULL,
  trailer1_reg_no TEXT,
  trailer2_reg_no TEXT,
  driver_name TEXT NOT NULL,
  driver_id_no TEXT NOT NULL,
  driver_license_no TEXT,
  license_expiry_date TEXT,
  is_license_valid INTEGER DEFAULT 1,
  bilty_no TEXT,
  bilty_date TEXT,
  consignor_name TEXT,
  consignee_name TEXT,
  declared_value REAL,
  dispatch_tare_kg REAL NOT NULL,
  dispatch_gross_kg REAL NOT NULL,
  dispatch_net_kg REAL NOT NULL,
  arrival_gross_kg REAL NOT NULL,
  arrival_tare_kg REAL NOT NULL,
  arrival_net_kg REAL NOT NULL,
  total_units INTEGER DEFAULT 0,
  damaged_units INTEGER DEFAULT 0,
  damaged_weight_kg REAL DEFAULT 0,
  damage_reason TEXT,
  accepted_net_kg REAL NOT NULL,
  weight_exception_reason TEXT DEFAULT 'NONE',
  exception_notes TEXT,
  loading_km REAL,
  offloading_km REAL,
  operator_name TEXT,
  site TEXT NOT NULL,
  product_description TEXT NOT NULL,
  offload_date TEXT NOT NULL,
  pod_status TEXT NOT NULL,
  pre_dispatch TEXT DEFAULT 'PASSED',
  customer_check TEXT DEFAULT 'STAMPED_CONFIRMED',
  uploaded_file_name TEXT,
  rejection_reason TEXT,
  sap_ses_number TEXT,
  sap_miro_doc_no TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_ref) REFERENCES purchase_orders (purchase_order_no)
);

CREATE TABLE IF NOT EXISTS invoices (
  invoice_no TEXT PRIMARY KEY,
  waybill_no TEXT NOT NULL,
  quantity REAL NOT NULL,
  rate REAL NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL,
  posting_date TEXT,
  payment_ref TEXT,
  file_name TEXT,
  sap_doc_no TEXT,
  sap_clearing_doc_no TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (waybill_no) REFERENCES transport_runs (waybill_no)
);

CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  company_name TEXT,
  display_name TEXT,
  driver_license_no TEXT,
  license_expiry_date TEXT,
  prdp_permit_no TEXT,
  is_license_valid INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  actor TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details_json TEXT
);
