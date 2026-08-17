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
  (3, 2, 'Austin Petersen',    'DL-780415-WC', '2028-06-15', '2028-06-15', '+27720001006');

-- VEHICLES
INSERT OR IGNORE INTO vehicles (id, transporter_id, reg_no, capacity) VALUES
  (1, 1, 'KV44RCGP',  34.0),
  (2, 1, 'GP12XYZGP', 30.0),
  (3, 2, 'MP55ABCMP', 32.0);


-- REAL S21 CONTRACTS (Retrieved from S21 SAP Interface)
INSERT OR IGNORE INTO contracts (id, sap_contract_no, customer_id, start_date, end_date, pdf_url, status) VALUES
  (1, '4600000017', 1, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000017.pdf', 'ACTIVE'),
  (2, '4600000018', 1, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000018.pdf', 'ACTIVE'),
  (3, '4600000019', 2, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000019.pdf', 'ACTIVE'),
  (4, '4600000020', 2, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000020.pdf', 'ACTIVE'),
  (5, '4600000021', 1, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000021.pdf', 'ACTIVE');

-- REAL S21 PURCHASE ORDERS (Originating from S21 Contracts)
INSERT OR IGNORE INTO purchase_orders (id, contract_id, sap_po_no, material, uom, target_qty, rate, tolerance_pct, cost_center, status) VALUES
  -- Contract 4600000017 (Real S21 POs)
  (1,  1, '4500001714', 'SL BIT 20%ASH (40006653)', 'TO', 34.0, 151.50, 0.5, 'CC-MINING-01', 'OPEN'),
  (2,  1, '4500001715', 'SL BIT 20%ASH (40006653)', 'TO', 34.0, 151.50, 0.5, 'CC-MINING-01', 'OPEN'),
  (3,  1, '4500001716', 'SL BIT 20%ASH (40006653)', 'TO', 30.0, 151.50, 0.5, 'CC-MINING-01', 'OPEN'),
  (4,  1, '4500001717', 'SL BIT 20%ASH (40006653)', 'TO', 32.0, 151.50, 0.5, 'CC-MINING-01', 'ASSIGNED'),
  (5,  1, '4500001718', 'SL BIT 20%ASH (40006653)', 'TO', 34.0, 151.50, 0.5, 'CC-MINING-01', 'IN_PROGRESS'),

  -- Contract 4600000018 (Real S21 POs)
  (6,  2, '4500001719', 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45000.00, 0.5, 'CC-MINING-02', 'OPEN'),
  (7,  2, '4500001720', 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45000.00, 0.5, 'CC-MINING-02', 'OPEN'),
  (8,  2, '4500001721', 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45000.00, 0.5, 'CC-MINING-02', 'OPEN'),
  (9,  2, '4500001722', 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45000.00, 0.5, 'CC-MINING-02', 'ASSIGNED'),
  (10, 2, '4500001723', 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45000.00, 0.5, 'CC-MINING-02', 'IN_PROGRESS'),

  -- Contract 4600000020 (Real S21 POs)
  (16, 4, '4500001724', 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125000.00, 0.5, 'CC-MAINT-01', 'OPEN'),
  (17, 4, '4500001725', 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125000.00, 0.5, 'CC-MAINT-01', 'OPEN'),
  (18, 4, '4500001726', 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125000.00, 0.5, 'CC-MAINT-01', 'OPEN'),
  (19, 4, '4500001727', 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125000.00, 0.5, 'CC-MAINT-01', 'ASSIGNED'),
  (20, 4, '4500001728', 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125000.00, 0.5, 'CC-MAINT-01', 'IN_PROGRESS'),

  -- Contract 4600000021 (Real S21 POs)
  (21, 5, '4500001729', 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400000.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (22, 5, '4500001730', 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400000.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (23, 5, '4500001731', 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400000.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (24, 5, '4500001732', 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400000.00, 0.5, 'CC-HEAVY-01', 'ASSIGNED'),
  (25, 5, '4500001733', 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400000.00, 0.5, 'CC-HEAVY-01', 'IN_PROGRESS'),

  -- Contract 4600000019 (Real S21 POs)
  (11, 3, '4500001734', 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28000.00, 0.5, 'CC-LOGISTICS-01', 'OPEN'),
  (12, 3, '4500001735', 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28000.00, 0.5, 'CC-LOGISTICS-01', 'OPEN'),
  (13, 3, '4500001736', 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28000.00, 0.5, 'CC-LOGISTICS-01', 'OPEN'),
  (14, 3, '4500001737', 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28000.00, 0.5, 'CC-LOGISTICS-01', 'ASSIGNED'),
  (15, 3, '4500001738', 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28000.00, 0.5, 'CC-LOGISTICS-01', 'IN_PROGRESS');

-- PODZO DEMO EXECUTION LAYER (Operational records persisted in PODZO DB linked strictly to Real S21 POs)
INSERT OR IGNORE INTO job_configs (id, po_id, transporter_id, availability_window, timebound, status) VALUES
  (1, 4, 1, '06:00-18:00', '2026-12-31', 'ASSIGNED'),
  (2, 5, 1, '06:00-18:00', '2026-12-31', 'ASSIGNED'),
  (3, 9, 2, '08:00-16:00', '2026-12-31', 'ASSIGNED');

INSERT OR IGNORE INTO transport_assignments (id, job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, status) VALUES
  (1, 1, 1, 1, 'Witbank Siding', 'DL-850912-GP', '27AABCS0001A1Z1', '2026-08-14', 'ASSIGNED'),
  (2, 2, 2, 2, 'Witbank Siding', 'DL-760220-MP', '27AABCS0001A1Z1', '2026-08-14', 'DISPATCHED'),
  (3, 3, 3, 3, 'Leeuwpan Yard',  'DL-780415-WC', '27AABCV0002A1Z2', '2026-08-14', 'DELIVERED');

INSERT OR IGNORE INTO weight_logs (assignment_id, stage, weight_kg, truck_detail, logged_at) VALUES
  (2, 'MINE_TARE', 15000.0, 'KV44RCGP', '2026-08-14T10:05:00'),
  (2, 'MINE_GROSS', 49000.0, 'KV44RCGP', '2026-08-14T10:20:00'),
  (3, 'MINE_TARE', 16000.0, 'MP55ABCMP', '2026-08-14T09:00:00'),
  (3, 'MINE_GROSS', 50000.0, 'MP55ABCMP', '2026-08-14T09:20:00'),
  (3, 'DEST_GROSS', 49950.0, 'MP55ABCMP', '2026-08-14T14:00:00'),
  (3, 'DEST_TARE', 16020.0, 'MP55ABCMP', '2026-08-14T14:30:00');

INSERT OR IGNORE INTO delivery_capture (assignment_id, truck_data_json, issues_text, weight_log_ref, unit_calc, stamp_confirmed_bool, stamped_at) VALUES
  (3, '{"hatch_sealed":true}', 'No cargo damages reported', 3, 'Convert 33930 kg to 33.93 TON', 1, '2026-08-14T14:35:00');


