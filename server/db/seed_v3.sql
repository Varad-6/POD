-- ============================================================
-- IKWEZI TRANSPORTER PORTAL — SEED DATA V3
-- ============================================================

-- USERS (Demo password is "Demo@1234")
-- We will write actual password hash for Demo@1234: "$2b$10$tMh4zN1W.g2H/C6nQ7i/2e3U7d.F8k.kR0v2z9eY9iY9yY9yY9yY9" 
-- Note: DB initializer will override this with proper bcrypt hashes on boot anyway.
INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, email, phone, entity_id) VALUES
  (1, 'ca_thandiwe',   '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'CA', 'Thandiwe Nkosi',      'thandiwe@ikwezi.co.za',     '+27110001001', NULL),
  (2, 'ta_sipho',      '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'TA', 'Sipho Dlamini (STS)', 'sipho@siphotransport.co.za','+27830001002', 1),
  (3, 'dr_zweli',      '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'DR', 'Zwelithini Dlamini',  'zweli@driver.co.za',        '+27720001003', 1),
  (4, 'cr_mining',     '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'CR', 'Yard Receiver',       'recv@ikwezi.co.za',         '+27110001004', 1),
  (5, 'sr_gate01',     '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'SR', 'Jan Mokoena',         'jan@ikwezi.co.za',          '+27110001005', NULL);

-- CUSTOMERS (Mining Yards)
INSERT OR IGNORE INTO customers (id, name, sap_customer_no, gps_lat, gps_lng, address) VALUES
  (1, 'Ikwezi Mining – Emoyeni Siding', 'SAP-CUST-1001', -25.7670, 29.4630, 'Emoyeni Siding, Witbank, ZA'),
  (2, 'Ikwezi Mining – Leeuwpan Yard',  'SAP-CUST-1002', -26.0145, 29.1785, 'Leeuwpan Yard, Witbank, ZA');

-- TRANSPORTERS
INSERT OR IGNORE INTO transporters (id, name, gstin) VALUES
  (1, 'Sipho Transport Services', '27AABCS0001A1Z1'),
  (2, 'VDM Transport',            '27AABCV0002A1Z2');

-- DRIVERS
INSERT OR IGNORE INTO drivers (id, transporter_id, name, license_no, license_expiry, prdp_expiry, phone) VALUES
  (1, 1, 'Zwelithini Dlamini', 'DL-850912-GP', '2027-12-31', '2027-12-31', '+27720001003'),
  (2, 1, 'Dumisani Mthembu',   'DL-760220-MP', '2026-08-30', '2026-08-30', '+27720001008'),
  (3, 2, 'Austin Petersen',    'DL-780415-WC', '2028-06-15', '2028-06-15', '+27720001006'),
  (4, 1, 'Thabo Sithole',      'DL-900311-LP', '2024-12-31', '2024-12-31', '+27720001007'); -- EXPIRED

-- VEHICLES
INSERT OR IGNORE INTO vehicles (id, transporter_id, reg_no, capacity) VALUES
  (1, 1, 'KV44RCGP',  34.0),
  (2, 1, 'GP12XYZGP', 30.0),
  (3, 2, 'MP55ABCMP', 32.0),
  (4, 1, 'LP33DEFGP', 28.0);

-- CONTRACTS (5 Actual SAP S21 Contracts from Screenshots)
INSERT OR IGNORE INTO contracts (id, sap_contract_no, customer_id, start_date, end_date, pdf_url, status) VALUES
  (1, '4600000017', 1, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000017.pdf', 'ACTIVE'),
  (2, '4600000018', 1, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000018.pdf', 'ACTIVE'),
  (3, '4600000019', 2, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000019.pdf', 'ACTIVE'),
  (4, '4600000020', 2, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000020.pdf', 'ACTIVE'),
  (5, '4600000021', 1, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000021.pdf', 'ACTIVE');

-- PURCHASE ORDERS (Actual SAP Material Items linked to Contracts)
INSERT OR IGNORE INTO purchase_orders (id, contract_id, sap_po_no, material, uom, target_qty, rate, tolerance_pct, cost_center, status) VALUES
  -- Contract 4600000017 (Supplier: ABC Enterprises | Material: 40006653 SL BIT 20ASH)
  (1,  1, 'PO-4500012350', 'SL BIT 20ASH (40006653)', 'TO', 34.0, 151.50, 0.5, 'CC-MINING-01', 'OPEN'),
  (2,  1, 'PO-4500012351', 'SL BIT 20ASH (40006653)', 'TO', 34.0, 151.50, 0.5, 'CC-MINING-01', 'OPEN'),
  (3,  1, 'PO-4500012352', 'SL BIT 20ASH (40006653)', 'TO', 30.0, 151.50, 0.5, 'CC-MINING-01', 'OPEN'),
  (4,  1, 'PO-4500012353', 'SL BIT 20ASH (40006653)', 'TO', 32.0, 151.50, 0.5, 'CC-MINING-01', 'ASSIGNED'),
  (5,  1, 'PO-4500012354', 'SL BIT 20ASH (40006653)', 'TO', 34.0, 151.50, 0.5, 'CC-MINING-01', 'IN_PROGRESS'),

  -- Contract 4600000018 (Supplier: ABC Enterprises | Material: 40006654 FERT_50KG_BAG)
  (6,  2, 'PO-4500012355', 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45.00, 0.5, 'CC-MINING-02', 'OPEN'),
  (7,  2, 'PO-4500012356', 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45.00, 0.5, 'CC-MINING-02', 'OPEN'),
  (8,  2, 'PO-4500012357', 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45.00, 0.5, 'CC-MINING-02', 'OPEN'),
  (9,  2, 'PO-4500012358', 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45.00, 0.5, 'CC-MINING-02', 'ASSIGNED'),
  (10, 2, 'PO-4500012359', 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45.00, 0.5, 'CC-MINING-02', 'IN_PROGRESS'),

  -- Contract 4600000019 (Supplier: ABC Enterprises | Material: 40006660 DEF_ADBLUE_20L)
  (11, 3, 'PO-4500012360', 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28.00, 0.5, 'CC-LOGISTICS-01', 'OPEN'),
  (12, 3, 'PO-4500012361', 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28.00, 0.5, 'CC-LOGISTICS-01', 'OPEN'),
  (13, 3, 'PO-4500012362', 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28.00, 0.5, 'CC-LOGISTICS-01', 'OPEN'),
  (14, 3, 'PO-4500012363', 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28.00, 0.5, 'CC-LOGISTICS-01', 'ASSIGNED'),
  (15, 3, 'PO-4500012364', 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28.00, 0.5, 'CC-LOGISTICS-01', 'IN_PROGRESS'),

  -- Contract 4600000020 (Supplier: ABC Enterprises | Material: 40006657 SPARE_PARTS_BOX)
  (16, 4, 'PO-4500012365', 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125.00, 0.5, 'CC-MAINT-01', 'OPEN'),
  (17, 4, 'PO-4500012366', 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125.00, 0.5, 'CC-MAINT-01', 'OPEN'),
  (18, 4, 'PO-4500012367', 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125.00, 0.5, 'CC-MAINT-01', 'OPEN'),
  (19, 4, 'PO-4500012368', 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125.00, 0.5, 'CC-MAINT-01', 'ASSIGNED'),
  (20, 4, 'PO-4500012369', 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125.00, 0.5, 'CC-MAINT-01', 'IN_PROGRESS'),

  -- Contract 4600000021 (Supplier: Gajanan Enterprises | Material: 40006658 CRUSHER_JAW_PLATE)
  (21, 5, 'PO-4500012370', 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (22, 5, 'PO-4500012371', 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (23, 5, 'PO-4500012372', 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (24, 5, 'PO-4500012373', 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400.00, 0.5, 'CC-HEAVY-01', 'ASSIGNED'),
  (25, 5, 'PO-4500012374', 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400.00, 0.5, 'CC-HEAVY-01', 'IN_PROGRESS');

-- JOB CONFIGS (TA assigned or pending)
INSERT OR IGNORE INTO job_configs (id, po_id, transporter_id, availability_window, timebound, status) VALUES
  (1, 1, 1, '06:00-18:00', '2026-12-31', 'ASSIGNED'),
  (2, 1, 1, '06:00-18:00', '2026-12-31', 'ASSIGNED'),
  (3, 1, 1, '08:00-16:00', '2026-12-31', 'ASSIGNED'),
  (4, 1, 1, '08:00-16:00', '2026-12-31', 'ASSIGNED'),
  (5, 1, 1, '08:00-16:00', '2026-12-31', 'ASSIGNED'),
  (6, 1, 1, '08:00-16:00', '2026-12-31', 'ASSIGNED'),
  (7, 1, 1, '08:00-16:00', '2026-12-31', 'ASSIGNED'),
  (8, 2, 2, '08:00-16:00', '2026-12-31', 'ASSIGNED'),
  (9, 2, 1, '06:00-18:00', '2026-12-31', 'PENDING'); -- Sitting at pending config config stage

-- TRANSPORT ASSIGNMENTS (One sitting at EACH stage of the pipeline)
-- Stage 1: ASSIGNED
INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (1, 1, 1, 1, 'Witbank Siding', 'DL-850912-GP', '27AABCS0001A1Z1', '2026-08-14', 'ASSIGNED');

-- Stage 2: GATE_DENIED
INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (2, 2, 4, 4, 'Witbank Siding', 'DL-900311-LP', '27AABCS0001A1Z1', '2026-08-14', 'GATE_DENIED');
INSERT OR IGNORE INTO supervisor_checks (assignment_id, arrival_date, arrival_time, weight_check_bool, bilty_check_bool, material_check_bool, license_check_bool, checked_by) VALUES
  (2, '2026-08-13', '10:00', 1, 1, 1, 0, 5); -- License check fail

-- Stage 3: MINE_TARE_LOGGED
INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (3, 3, 2, 2, 'Witbank Siding', 'DL-760220-MP', '27AABCS0001A1Z1', '2026-08-14', 'MINE_TARE_LOGGED');
INSERT OR IGNORE INTO weight_logs (assignment_id, stage, weight_kg, truck_detail, logged_at) VALUES
  (3, 'MINE_TARE', 15200.0, 'STS Horsemotor + Horse trailer', '2026-08-13T10:05:00');

-- Stage 4: MINE_GROSS_LOGGED
INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (4, 4, 1, 1, 'Witbank Siding', 'DL-850912-GP', '27AABCS0001A1Z1', '2026-08-14', 'MINE_GROSS_LOGGED');
INSERT OR IGNORE INTO weight_logs (assignment_id, stage, weight_kg, truck_detail, logged_at) VALUES
  (4, 'MINE_TARE', 15000.0, 'KV44RCGP', '2026-08-13T10:05:00'),
  (4, 'MINE_GROSS', 49200.0, 'KV44RCGP', '2026-08-13T10:20:00'); -- Net mine = 34200 kg

-- Stage 5: DISPATCHED
INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (5, 5, 1, 1, 'Witbank Siding', 'DL-850912-GP', '27AABCS0001A1Z1', '2026-08-14', 'DISPATCHED');
INSERT OR IGNORE INTO driver_assignment_data (assignment_id, otp_code, location, gps_lat, gps_lng, material, truck_no, popup_ack_bool) VALUES
  (5, '9827', 'Kriel Mine Siding', -26.0100, 29.1500, 'SL BIT 20%ASH', 'KV44RCGP', 1);
INSERT OR IGNORE INTO otp_verifications (assignment_id, stage, otp_code, verified_by_role, status, verified_at) VALUES
  (5, 'PICKUP', '9827', 'SR', 'VERIFIED', '2026-08-13T10:35:00');
INSERT OR IGNORE INTO supervisor_stamp (assignment_id, date_timestamp, ip_address, gps_lat, gps_lng, otp_match_bool) VALUES
  (5, '2026-08-13T10:35:00', '196.30.2.10', -26.0100, 29.1500, 1);
INSERT OR IGNORE INTO weight_logs (assignment_id, stage, weight_kg, truck_detail, logged_at) VALUES
  (5, 'MINE_TARE', 15000.0, 'KV44RCGP', '2026-08-13T10:05:00'),
  (5, 'MINE_GROSS', 49000.0, 'KV44RCGP', '2026-08-13T10:20:00');

-- Stage 6: EN_ROUTE
INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (6, 6, 1, 1, 'Witbank Siding', 'DL-850912-GP', '27AABCS0001A1Z1', '2026-08-14', 'EN_ROUTE');
INSERT OR IGNORE INTO weight_logs (assignment_id, stage, weight_kg, truck_detail, logged_at) VALUES
  (6, 'MINE_TARE', 15000.0, 'KV44RCGP', '2026-08-13T10:05:00'),
  (6, 'MINE_GROSS', 49000.0, 'KV44RCGP', '2026-08-13T10:20:00');
INSERT OR IGNORE INTO transit_events (assignment_id, status, gps_lat, gps_lng, logged_at) VALUES
  (6, 'DISPATCHED', -26.0100, 29.1500, '2026-08-13T10:35:00'),
  (6, 'EN_ROUTE', -25.8500, 29.3000, '2026-08-13T11:00:00');

-- Stage 7: ARRIVED
INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (7, 7, 1, 1, 'Witbank Siding', 'DL-850912-GP', '27AABCS0001A1Z1', '2026-08-14', 'ARRIVED');
INSERT OR IGNORE INTO weight_logs (assignment_id, stage, weight_kg, truck_detail, logged_at) VALUES
  (7, 'MINE_TARE', 15000.0, 'KV44RCGP', '2026-08-13T10:05:00'),
  (7, 'MINE_GROSS', 49000.0, 'KV44RCGP', '2026-08-13T10:20:00');
INSERT OR IGNORE INTO arrival_confirmations (assignment_id, driver_confirmed_at, gps_lat, gps_lng, ip_address, device_info) VALUES
  (7, '2026-08-13T12:00:00', -25.7669, 29.4628, '196.30.2.11', 'Mozilla/5.0 Android');

-- Stage 8: DELIVERED
INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (8, 8, 3, 3, 'Leeuwpan Yard', 'DL-780415-WC', '27AABCV0002A1Z2', '2026-08-14', 'DELIVERED');
INSERT OR IGNORE INTO weight_logs (id, assignment_id, stage, weight_kg, truck_detail, logged_at) VALUES
  (10, 8, 'MINE_TARE', 16000.0, 'MP55ABCMP', '2026-08-13T09:00:00'),
  (11, 8, 'MINE_GROSS', 50000.0, 'MP55ABCMP', '2026-08-13T09:20:00'),
  (12, 8, 'DEST_GROSS', 49950.0, 'MP55ABCMP', '2026-08-13T14:00:00'),
  (13, 8, 'DEST_TARE', 16020.0, 'MP55ABCMP', '2026-08-13T14:30:00'); -- Dest net = 33930 kg
INSERT OR IGNORE INTO delivery_capture (assignment_id, truck_data_json, issues_text, weight_log_ref, unit_calc, stamp_confirmed_bool, stamped_at) VALUES
  (8, '{"hatch_sealed":true,"temperature":"ambient"}', 'No cargo damages reported', 13, 'Convert 33930 kg to 33.93 TON', 1, '2026-08-13T14:35:00');
INSERT OR IGNORE INTO otp_verifications (assignment_id, stage, otp_code, verified_by_role, status, verified_at) VALUES
  (8, 'DELIVERY', '3410', 'CR', 'VERIFIED', '2026-08-13T14:35:00');

-- Stage 9: UNDER_REVIEW (Flagged POD mismatch)
INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (9, 1, 1, 1, 'Witbank Siding', 'DL-850912-GP', '27AABCS0001A1Z1', '2026-08-14', 'UNDER_REVIEW');
INSERT OR IGNORE INTO weight_logs (assignment_id, stage, weight_kg, truck_detail, logged_at) VALUES
  (9, 'MINE_TARE', 15000.0, 'KV44RCGP', '2026-08-13T08:00:00'),
  (9, 'MINE_GROSS', 49000.0, 'KV44RCGP', '2026-08-13T08:20:00'),
  (9, 'DEST_GROSS', 49000.0, 'KV44RCGP', '2026-08-13T13:00:00'),
  (9, 'DEST_TARE', 15000.0, 'KV44RCGP', '2026-08-13T13:30:00');
INSERT OR IGNORE INTO pod_documents (id, assignment_id, pod_file_url, ocr_waybill_extracted, ocr_weight_extracted, ocr_confidence_pct, match_status) VALUES
  (1, 9, '/uploads/pod/pod_9.jpg', 'WB-887711', 30.5, 62.5, 'PENDING'); -- Mismatch vs weighbridge net 34.0 tonnes & confidence low
INSERT OR IGNORE INTO review_queue (id, assignment_id, flag_reason, status, blocks_miro_bool) VALUES
  (1, 9, 'OCR_MISMATCH', 'OPEN', 1);

-- Stage 10: APPROVED
INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (10, 1, 1, 1, 'Witbank Siding', 'DL-850912-GP', '27AABCS0001A1Z1', '2026-08-14', 'APPROVED');
INSERT OR IGNORE INTO weight_logs (assignment_id, stage, weight_kg, truck_detail, logged_at) VALUES
  (10, 'MINE_TARE', 15000.0, 'KV44RCGP', '2026-08-13T08:00:00'),
  (10, 'MINE_GROSS', 49000.0, 'KV44RCGP', '2026-08-13T08:20:00'),
  (10, 'DEST_GROSS', 49000.0, 'KV44RCGP', '2026-08-13T13:00:00'),
  (10, 'DEST_TARE', 15000.0, 'KV44RCGP', '2026-08-13T13:30:00');
INSERT OR IGNORE INTO pod_documents (id, assignment_id, pod_file_url, ocr_waybill_extracted, ocr_weight_extracted, ocr_confidence_pct, match_status) VALUES
  (2, 10, '/uploads/pod/pod_10.jpg', 'WB-4500012350', 34.0, 95.0, 'MATCH');
INSERT OR IGNORE INTO ca_verification (assignment_id, verified_bool, verified_by, notes) VALUES
  (10, 1, 1, 'All checks matched cleanly');
INSERT OR IGNORE INTO delivery_invoices (id, assignment_id, accepted_payload, rate, total_value, status) VALUES
  (1, 10, 34000.0, 245.50, 8347.00, 'SENT_TO_CA');
INSERT OR IGNORE INTO main_invoices (id, delivery_invoice_id, po_id, status) VALUES
  (1, 1, 1, 'PO_DONE');

-- Stage 11: MIRO_PARKED
INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (11, 1, 1, 1, 'Witbank Siding', 'DL-850912-GP', '27AABCS0001A1Z1', '2026-08-14', 'MIRO_PARKED');
INSERT OR IGNORE INTO weight_logs (assignment_id, stage, weight_kg, truck_detail, logged_at) VALUES
  (11, 'MINE_TARE', 15000.0, 'KV44RCGP', '2026-08-13T08:00:00'),
  (11, 'MINE_GROSS', 49000.0, 'KV44RCGP', '2026-08-13T08:20:00'),
  (11, 'DEST_GROSS', 49000.0, 'KV44RCGP', '2026-08-13T13:00:00'),
  (11, 'DEST_TARE', 15000.0, 'KV44RCGP', '2026-08-13T13:30:00');
INSERT OR IGNORE INTO delivery_invoices (id, assignment_id, accepted_payload, rate, total_value, status) VALUES
  (2, 11, 34000.0, 245.50, 8347.00, 'SENT_TO_CA');
INSERT OR IGNORE INTO main_invoices (id, delivery_invoice_id, po_id, status) VALUES
  (2, 2, 1, 'PO_DONE');
INSERT OR IGNORE INTO miro_invoices (id, main_invoice_id, sap_invoice_no, status, sap_ref) VALUES
  (1, 2, 'MIRO-SAP-0099', 'PARKED', 'BAPI-REF-0099');

-- Stage 12: MIRO_POSTED
INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (12, 1, 1, 1, 'Witbank Siding', 'DL-850912-GP', '27AABCS0001A1Z1', '2026-08-14', 'MIRO_POSTED');
INSERT OR IGNORE INTO delivery_invoices (id, assignment_id, accepted_payload, rate, total_value, status) VALUES
  (3, 12, 34000.0, 245.50, 8347.00, 'SENT_TO_CA');
INSERT OR IGNORE INTO main_invoices (id, delivery_invoice_id, po_id, status) VALUES
  (3, 3, 1, 'PO_DONE');
INSERT OR IGNORE INTO miro_invoices (id, main_invoice_id, sap_invoice_no, status, posted_date, sap_ref) VALUES
  (2, 3, 'MIRO-SAP-0100', 'POSTED', '2026-08-13T16:00:00', 'BAPI-REF-0100');
INSERT OR IGNORE INTO sap_sync_log (entity_type, sap_ref, direction, payload_json) VALUES
  ('INVOICE', 'MIRO-SAP-0100', 'OUT', '{"invoice_no":"MIRO-SAP-0100","status":"POSTED"}');

-- Stage 13: CLEARED
INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (13, 1, 1, 1, 'Witbank Siding', 'DL-850912-GP', '27AABCS0001A1Z1', '2026-08-14', 'CLEARED');
INSERT OR IGNORE INTO delivery_invoices (id, assignment_id, accepted_payload, rate, total_value, status) VALUES
  (4, 13, 34000.0, 245.50, 8347.00, 'SENT_TO_CA');
INSERT OR IGNORE INTO main_invoices (id, delivery_invoice_id, po_id, status) VALUES
  (4, 4, 1, 'PO_DONE');
INSERT OR IGNORE INTO miro_invoices (id, main_invoice_id, sap_invoice_no, status, posted_date, sap_ref) VALUES
  (3, 4, 'MIRO-SAP-0101', 'CLEARED', '2026-08-13T16:00:00', 'BAPI-REF-0101');
INSERT OR IGNORE INTO sap_sync_log (entity_type, sap_ref, direction, payload_json) VALUES
  ('INVOICE', 'MIRO-SAP-0101', 'OUT', '{"invoice_no":"MIRO-SAP-0101","status":"CLEARED"}');
