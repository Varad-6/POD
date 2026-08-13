-- ============================================================
-- IKWEZI PORTAL — REALISTIC SEED DATA
-- One full pipeline: contract → PO → dispatch in every stage
-- ============================================================

-- USERS (passwords: all = "Demo@1234" → bcrypt placeholder hash)
INSERT OR IGNORE INTO users (username, password_hash, role, display_name, email, phone) VALUES
  ('ca_thandiwe',   '$2b$10$hashedplaceholder1', 'COMPANY_ADMIN',      'Thandiwe Nkosi',      'thandiwe@ikwezi.co.za',     '+27110001001'),
  ('ta_sipho',      '$2b$10$hashedplaceholder2', 'TRANSPORTER_ADMIN',  'Sipho Dlamini (STS)', 'sipho@siphotransport.co.za','+27830001002'),
  ('dr_zweli',      '$2b$10$hashedplaceholder3', 'DRIVER',             'Zwelithini Dlamini',  'zweli@driver.co.za',        '+27720001003'),
  ('cr_mining',     '$2b$10$hashedplaceholder4', 'CUSTOMER',           'Ikwezi Yard Receiver','recv@ikwezi.co.za',         '+27110001004'),
  ('sr_gate01',     '$2b$10$hashedplaceholder5', 'SUPERVISOR',         'Jan Mokoena (Gate 01)','jan@ikwezi.co.za',         '+27110001005'),
  ('ta_vdm',        '$2b$10$hashedplaceholder6', 'TRANSPORTER_ADMIN',  'Austin Venter (VDM)', 'austin@vdm.co.za',          '+27830001006');

-- CUSTOMERS
INSERT OR IGNORE INTO customers (id, name, sap_customer_no, gstin, site_address, contact_name, contact_phone, gps_lat, gps_lng, geofence_radius_m) VALUES
  (1, 'Ikwezi Mining – Emoyeni Siding', 'CUST-0001', '27AABCI0001A1Z2', 'Emoyeni Siding, Mpumalanga, ZA', 'Yard Admin', '+27110001004', -25.7670, 29.4630, 1000),
  (2, 'Ikwezi Mining – Leeuwpan',       'CUST-0002', '27AABCI0002A1Z3', 'Leeuwpan, Witbank, ZA',          'Site Receiver','+27110001009', -26.0145, 29.1785, 800);

-- TRANSPORTERS
INSERT OR IGNORE INTO transporters (id, name, gstin, contact_name, contact_phone, contact_email) VALUES
  (1, 'Sipho Transport Services', '27AABCS0001A1Z1', 'Sipho Dlamini', '+27830001002', 'sipho@siphotransport.co.za'),
  (2, 'VDM Transport',            '27AABCV0002A1Z2', 'Austin Venter',  '+27830001006', 'austin@vdm.co.za'),
  (3, 'CBS Logistics',            '27AABCC0003A1Z3', 'Jan CBS',        '+27830001007', 'jan@cbs.co.za');

-- DRIVERS
INSERT OR IGNORE INTO drivers (id, transporter_id, name, license_no, license_expiry, prdp_no, prdp_expiry, phone) VALUES
  (1, 1, 'Zwelithini Dlamini', 'DL-850912-GP', '2027-12-31', 'PRDP-850912-GP', '2027-12-31', '+27720001003'),
  (2, 1, 'Dumisani Mthembu',   'DL-760220-MP', '2026-08-30', 'PRDP-760220-MP', '2026-08-30', '+27720001008'),
  (3, 2, 'Austin Petersen',    'DL-780415-WC', '2028-06-15', 'PRDP-780415-WC', '2028-06-15', '+27720001006'),
  (4, 3, 'Thabo Sithole',      'DL-900311-LP', '2025-03-11', 'PRDP-900311-LP', '2024-12-31', '+27720001007'); -- EXPIRED for gate-deny demo

-- VEHICLES
INSERT OR IGNORE INTO vehicles (id, transporter_id, reg_no, trailer1_reg, trailer2_reg, capacity_tonnes) VALUES
  (1, 1, 'KV44RCGP',  'LD09RPGP',  'LD10RPGP',  34.0),
  (2, 1, 'GP12XYZGP', 'LD11RPGP',  NULL,          30.0),
  (3, 2, 'MP55ABCMP', 'LD22XYGP',  'LD23XYGP',  32.0),
  (4, 3, 'LP33DEFGP', 'LD55ZZGP',  NULL,          28.0);

-- CONTRACTS
INSERT OR IGNORE INTO contracts (id, sap_contract_no, customer_id, start_date, end_date, material, uom, terms, status) VALUES
  (1, 'SAP-CTR-41000001', 1, '2026-01-01', '2026-12-31', 'SL BIT 20%ASH', 'TON', 'Net 30 days, Payment by EFT', 'ACTIVE'),
  (2, 'SAP-CTR-41000002', 2, '2026-03-01', '2026-12-31', 'EXPORT COAL RB1','TON', 'Net 45 days, Payment by EFT', 'ACTIVE'),
  (3, 'SAP-CTR-41000003', 1, '2025-01-01', '2025-12-31', 'WASHED DUFF',    'TON', 'Net 30 days',                 'EXPIRED');

-- PURCHASE ORDERS
INSERT OR IGNORE INTO purchase_orders (id, contract_id, sap_po_no, material, uom, target_qty, rate, tolerance_pct, cost_center, from_location, to_location, status) VALUES
  (1, 1, 'PO-4500012350', 'SL BIT 20%ASH',  'TON', 30.0, 245.50, 0.5, 'CC-MINING-01', 'Kriel Mine, Mpumalanga',    'Emoyeni Siding',  'OPEN'),
  (2, 1, 'PO-4500012351', 'SL BIT 20%ASH',  'TON', 34.0, 245.50, 0.5, 'CC-MINING-01', 'Kriel Mine, Mpumalanga',    'Emoyeni Siding',  'OPEN'),
  (3, 2, 'PO-4500012352', 'EXPORT COAL RB1','TON', 28.0, 310.00, 1.0, 'CC-EXPORT-01', 'Koornfontein Mine',         'Leeuwpan',        'OPEN'),
  (4, 1, 'PO-4500012353', 'SL BIT 20%ASH',  'TON', 32.0, 245.50, 0.5, 'CC-MINING-01', 'Kriel Mine, Mpumalanga',    'Emoyeni Siding',  'IN_PROGRESS'),
  (5, 1, 'PO-4500012354', 'SL BIT 20%ASH',  'TON', 30.0, 245.50, 0.5, 'CC-MINING-01', 'Kriel Mine, Mpumalanga',    'Emoyeni Siding',  'COMPLETED');

-- DISPATCH ASSIGNMENTS — one per pipeline stage for demo walkthrough
-- Stage 1: PENDING_TA (waiting for TA to fill driver/truck)
INSERT OR IGNORE INTO dispatch_assignments (id, po_id, transporter_id, status, created_at) VALUES
  (1, 1, 1, 'PENDING_TA', '2026-08-10T08:00:00');

-- Stage 2: ASSIGNED (TA confirmed)
INSERT OR IGNORE INTO dispatch_assignments (id, po_id, transporter_id, driver_id, vehicle_id, scheduled_date, status, availability_window, created_at) VALUES
  (2, 2, 1, 1, 1, '2026-08-11', 'ASSIGNED', '{"start":"06:00","end":"16:00"}', '2026-08-10T09:00:00');

-- Stage 3: MINE_WEIGHED (gate passed + weighed at dispatch)
INSERT OR IGNORE INTO dispatch_assignments (id, po_id, transporter_id, driver_id, vehicle_id, scheduled_date, sr_arrival_date, status, created_at) VALUES
  (3, 3, 2, 3, 3, '2026-08-11', '2026-08-11T06:30:00', 'MINE_WEIGHED', '2026-08-10T10:00:00');

-- Stage 4: EN_ROUTE
INSERT OR IGNORE INTO dispatch_assignments (id, po_id, transporter_id, driver_id, vehicle_id, scheduled_date, status, created_at) VALUES
  (4, 4, 1, 1, 1, '2026-08-12', 'EN_ROUTE', '2026-08-11T11:00:00');

-- Stage 5: DELIVERED_STAMPED + POD submitted = APPROVED (end of line)
INSERT OR IGNORE INTO dispatch_assignments (id, po_id, transporter_id, driver_id, vehicle_id, scheduled_date, status, created_at) VALUES
  (5, 5, 1, 1, 1, '2026-08-05', 'APPROVED', '2026-08-04T08:00:00');

-- GATE CHECK for dispatch 3 (PASS)
INSERT OR IGNORE INTO gate_checks (id, dispatch_id, license_valid, prdp_valid, bilty_valid, material_match, result, checked_at) VALUES
  (1, 3, 1, 1, 1, 1, 'PASS', '2026-08-11T06:35:00');

-- GATE CHECK for dispatch 2 (PASS)
INSERT OR IGNORE INTO gate_checks (id, dispatch_id, license_valid, prdp_valid, bilty_valid, material_match, result, checked_at) VALUES
  (2, 2, 1, 1, 1, 1, 'PASS', '2026-08-11T07:00:00');

-- WEIGHBRIDGE LOGS for dispatch 3 (mine-side tare + gross)
INSERT OR IGNORE INTO weighbridge_logs (id, dispatch_id, checkpoint, weight_kg, recorded_by_role, timestamp) VALUES
  (1, 3, 'MINE_TARE',  21100.0, 'SUPERVISOR', '2026-08-11T07:10:00'),
  (2, 3, 'MINE_GROSS', 55350.0, 'SUPERVISOR', '2026-08-11T07:25:00');  -- Net: 34250 kg = 34.25 TON

-- WEIGHBRIDGE LOGS for dispatch 4 (mine-side only, dispatched)
INSERT OR IGNORE INTO weighbridge_logs (id, dispatch_id, checkpoint, weight_kg, recorded_by_role, timestamp) VALUES
  (3, 4, 'MINE_TARE',  21050.0, 'SUPERVISOR', '2026-08-12T06:50:00'),
  (4, 4, 'MINE_GROSS', 54850.0, 'SUPERVISOR', '2026-08-12T07:05:00');  -- Net: 33800 kg = 33.80 TON

-- WEIGHBRIDGE LOGS for dispatch 5 (full 4-point)
INSERT OR IGNORE INTO weighbridge_logs (id, dispatch_id, checkpoint, weight_kg, recorded_by_role, timestamp) VALUES
  (5, 5, 'MINE_TARE',  21000.0, 'SUPERVISOR', '2026-08-05T07:00:00'),
  (6, 5, 'MINE_GROSS', 55200.0, 'SUPERVISOR', '2026-08-05T07:15:00'),  -- Dispatch Net: 34200 kg
  (7, 5, 'DEST_GROSS', 55050.0, 'CUSTOMER',   '2026-08-05T14:30:00'),
  (8, 5, 'DEST_TARE',  21000.0, 'CUSTOMER',   '2026-08-05T14:45:00'); -- Arrival Net: 34050 kg (variance 150kg = 0.44%)

-- TRANSIT EVENTS for dispatch 4 (EN_ROUTE)
INSERT OR IGNORE INTO transit_events (id, dispatch_id, status, gps_lat, gps_lng, created_by_role, timestamp) VALUES
  (1, 4, 'DISPATCHED',  -25.1740, 29.0321, 'SUPERVISOR', '2026-08-12T07:30:00'),
  (2, 4, 'EN_ROUTE',    -25.4200, 29.1500, 'DRIVER',     '2026-08-12T09:15:00'),
  (3, 4, 'EN_ROUTE',    -25.6100, 29.3200, 'DRIVER',     '2026-08-12T11:00:00');

-- ARRIVAL CONFIRMATION for dispatch 5
INSERT OR IGNORE INTO arrival_confirmations (id, dispatch_id, driver_id, gps_lat, gps_lng, gps_accuracy_m, ip_address, device_info, driver_confirmed_at) VALUES
  (1, 5, 1, -25.7668, 29.4625, 8.5, '196.30.1.100', 'Mozilla/5.0 Android', '2026-08-05T14:00:00');

-- DELIVERY METADATA for dispatch 5
INSERT OR IGNORE INTO delivery_metadata (id, dispatch_id, iso_timestamp_utc, client_ip, gps_lat, gps_lng, gps_accuracy_m, status) VALUES
  (1, 5, '2026-08-05T09:15:00Z', '196.30.1.100', -25.7668, 29.4625, 8.5, 'DELIVERED_STAMPED');

-- BILTY RECORDS
INSERT OR IGNORE INTO bilty_records (id, dispatch_id, bilty_no, bilty_date, lr_no, consignor_gstin, consignee_gstin, verified_by_sr) VALUES
  (1, 3, 'BLT-770101', '2026-08-11', 'LR-880101', '27AABCK0001A1Z2', '27AABCI0001A1Z2', 1),
  (2, 4, 'BLT-770102', '2026-08-12', 'LR-880102', '27AABCK0001A1Z2', '27AABCI0001A1Z2', 1),
  (3, 5, 'BLT-770099', '2026-08-05', 'LR-880099', '27AABCK0001A1Z2', '27AABCI0001A1Z2', 1);

-- POD DOCUMENT for dispatch 5 (matched)
INSERT OR IGNORE INTO pod_documents (id, dispatch_id, scanned_pod_url, ocr_extracted_waybill, ocr_extracted_weight, ocr_confidence_pct, match_status, created_at) VALUES
  (1, 5, '/uploads/pod/pod-dispatch-5.jpg', 'WB-998800', 34.05, 94.0, 'MATCH', '2026-08-05T15:00:00');

-- FREIGHT INVOICE for dispatch 5 (APPROVED)
INSERT OR IGNORE INTO freight_invoices (id, dispatch_id, accepted_payload_kg, rate_per_uom, total_value, tax_invoice_no, status, created_at) VALUES
  (1, 5, 34050.0, 245.50, 8358.275, 'INV-2026-0091', 'APPROVED', '2026-08-06T09:00:00');
-- total_value = (34050 / 1000) TON * 245.50 = 8358.275

-- MIRO INVOICE for dispatch 5 (PARKED)
INSERT OR IGNORE INTO miro_invoices (id, freight_invoice_id, dispatch_id, waybill_no, status, created_at) VALUES
  (1, 1, 5, 'WB-998800', 'PARKED', '2026-08-06T10:00:00');

-- SAP SYNC LOG entries
INSERT OR IGNORE INTO sap_sync_log (entity_type, sap_ref, direction, payload_json, status) VALUES
  ('CONTRACT', 'SAP-CTR-41000001', 'IN', '{"sap_contract_no":"SAP-CTR-41000001","status":"ACTIVE"}', 'SUCCESS'),
  ('CONTRACT', 'SAP-CTR-41000002', 'IN', '{"sap_contract_no":"SAP-CTR-41000002","status":"ACTIVE"}', 'SUCCESS'),
  ('PO',       'PO-4500012350',    'IN', '{"sap_po_no":"PO-4500012350","target_qty":30}',             'SUCCESS'),
  ('PO',       'PO-4500012351',    'IN', '{"sap_po_no":"PO-4500012351","target_qty":34}',             'SUCCESS'),
  ('INVOICE',  'INV-2026-0091',    'OUT','{"invoice_no":"INV-2026-0091","total":8358.275}',           'SUCCESS');

-- Update user entity_id links
UPDATE users SET entity_id = 1 WHERE username = 'ta_sipho';    -- transporter_id=1
UPDATE users SET entity_id = 2 WHERE username = 'ta_vdm';      -- transporter_id=2
UPDATE users SET entity_id = 1 WHERE username = 'dr_zweli';    -- driver_id=1
UPDATE users SET entity_id = 1 WHERE username = 'cr_mining';   -- customer_id=1
