-- ============================================================
-- PODZO TRANSPORTER PORTAL — SEED DATA V3
-- ============================================================

-- USERS (Demo password is "Demo@1234")
-- We will write actual password hash for Demo@1234: "$2b$10$tMh4zN1W.g2H/C6nQ7i/2e3U7d.F8k.kR0v2z9eY9iY9yY9yY9yY9" 
-- Note: DB initializer will override this with proper bcrypt hashes on boot anyway.
INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, email, phone, entity_id) VALUES
  (1, 'ca_thandiwe',   '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'CA', 'Thandiwe Nkosi',      'thandiwe@podzo.co.za',     '+27110001001', NULL),
  (2, 'ta_sipho',      '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'TA', 'Sipho Dlamini (STS)', 'sipho@siphotransport.co.za','+27830001002', 1),
  (3, 'dr_rajesh',     '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'DR', 'Rajesh Kumar',       'rajesh@driver.in',         '+27720001003', 1),
  (4, 'cr_mining',     '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'CR', 'Yard Receiver',       'recv@podzo.co.za',         '+27110001004', 1),
  (5, 'sr_gate01',     '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'SR', 'Jan Mokoena',         'jan@podzo.co.za',          '+27110001005', NULL),
  (6, 'dr_amit',       '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'DR', 'Amit Sharma',        'amit@driver.in',           '+27720001008', 2),
  (7, 'dr_sunil',      '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'DR', 'Sunil Kumar',        'sunil@driver.in',          '+27720001006', 3),
  (8, 'dr_vikram',     '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'DR', 'Vikram Singh',       'vikram@driver.in',         '+27720001007', 4),
  (9, 'dr_suresh',     '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'DR', 'Suresh Kumar',       'suresh@driver.in',         '+27720001010', 5),
  (10, 'dr_anil',      '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'DR', 'Anil Kumar',          'anil@driver.in',           '+27720001011', 6),
  (11, 'dr_ramesh',    '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'DR', 'Ramesh Lal',          'ramesh@driver.in',         '+27720001012', 7),
  (12, 'dr_vijay',     '$2y$10$yFwzU1gXp5P3XFw49NqSGOu14lB2W.33VzS6sIe87747e90197V5.', 'DR', 'Vijay Singh',         'vijay@driver.in',          '+27720001013', 8);

-- CUSTOMERS (Mining Yards)
INSERT OR IGNORE INTO customers (id, name, sap_customer_no, gps_lat, gps_lng, address) VALUES
  (1, 'PODZO Mining – Emoyeni Siding', 'SAP-CUST-1001', -25.7670, 29.4630, 'Emoyeni Siding, Witbank, ZA'),
  (2, 'PODZO Mining – Leeuwpan Yard',  'SAP-CUST-1002', -26.0145, 29.1785, 'Leeuwpan Yard, Witbank, ZA');

-- TRANSPORTERS
INSERT OR IGNORE INTO transporters (id, name, gstin) VALUES
  (1, 'Sipho Transport Services', '27AABCS0001A1Z1'),
  (2, 'VDM Transport',            '27AABCV0002A1Z2');

-- DRIVERS
INSERT OR IGNORE INTO drivers (id, transporter_id, name, license_no, license_expiry, prdp_expiry, phone) VALUES
  (1, 1, 'Rajesh Kumar',    'DL-850912-GP', '2027-12-31', '2027-12-31', '+27720001003'),
  (2, 1, 'Amit Sharma',     'DL-760220-MP', '2027-08-30', '2027-08-30', '+27720001008'),
  (3, 2, 'Sunil Kumar',     'DL-780415-WC', '2028-06-15', '2028-06-15', '+27720001006'),
  (4, 1, 'Vikram Singh',    'DL-900311-LP', '2024-12-31', '2024-12-31', '+27720001007'), -- EXPIRED
  (5, 1, 'Suresh Kumar',    'DL-811105-GP', '2028-11-05', '2028-11-05', '+27720001010'),
  (6, 1, 'Anil Kumar',      'DL-830409-MP', '2027-04-09', '2027-04-09', '+27720001011'),
  (7, 2, 'Ramesh Lal',      'DL-791012-WC', '2029-10-12', '2029-10-12', '+27720001012'),
  (8, 2, 'Vijay Singh',     'DL-820516-GP', '2028-05-16', '2028-05-16', '+27720001013');

-- VEHICLES
INSERT OR IGNORE INTO vehicles (id, transporter_id, reg_no, capacity) VALUES
  (1, 1, 'KV44RCGP',  70.0),
  (2, 1, 'GP12XYZGP', 70.0),
  (3, 2, 'MP55ABCMP', 100.0),
  (4, 1, 'LP33DEFGP', 70.0),
  (5, 1, 'STS990GP',  70.0),
  (6, 1, 'STS777GP',  100.0),
  (7, 2, 'VDM101MP',  70.0),
  (8, 2, 'VDM202MP',  100.0);

-- CONTRACTS (5 Actual SAP S21 Contracts from Screenshots)
INSERT OR IGNORE INTO contracts (id, sap_contract_no, customer_id, start_date, end_date, pdf_url, status) VALUES
  (1, '4600000017', 1, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000017.pdf', 'ACTIVE'),
  (2, '4600000018', 1, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000018.pdf', 'ACTIVE'),
  (3, '4600000019', 2, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000019.pdf', 'ACTIVE'),
  (4, '4600000020', 2, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000020.pdf', 'ACTIVE'),
  (5, '4600000021', 1, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000021.pdf', 'ACTIVE'),
  (6, '4600000026', 1, '2026-08-12', '2027-08-12', '/uploads/contracts/ctr_4600000026.pdf', 'ACTIVE');

-- PURCHASE ORDERS (Exact SAP PO Numbers from Contract Data.xlsx sheet - ALL OPEN INITIAL STATE)
INSERT OR IGNORE INTO purchase_orders (id, contract_id, sap_po_no, po_item_no, material, uom, target_qty, rate, tolerance_pct, cost_center, status) VALUES
  -- Contract 4600000017 (Supplier: ABC Enterprises 1402 | Material: 40006653 SL BIT 20%ASH | Rate: 151.50)
  (1,  1, '4500001714', 10, 'SL BIT 20%ASH (40006653)', 'TO', 34.0, 151.50, 0.5, 'CC-MINING-01', 'OPEN'),
  (2,  1, '4500001715', 10, 'SL BIT 20%ASH (40006653)', 'TO', 34.0, 151.50, 0.5, 'CC-MINING-01', 'OPEN'),
  (3,  1, '4500001716', 10, 'SL BIT 20%ASH (40006653)', 'TO', 30.0, 151.50, 0.5, 'CC-MINING-01', 'OPEN'),
  (4,  1, '4500001717', 10, 'SL BIT 20%ASH (40006653)', 'TO', 32.0, 151.50, 0.5, 'CC-MINING-01', 'OPEN'),
  (5,  1, '4500001718', 10, 'SL BIT 20%ASH (40006653)', 'TO', 34.0, 151.50, 0.5, 'CC-MINING-01', 'OPEN'),
  (26, 6, '4500001804', 10, 'SPARE_PARTS_BOX (40006657)', 'EA', 100.0, 200001.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (27, 6, '4500001804', 20, 'CRUSHER_JAW_PLATE (40006658)', 'PC', 100.0, 200001.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (28, 6, '4500001804', 30, 'DEF_ADBLUE_20L (40006660)', 'BT', 100.0, 200001.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (29, 6, '4500001804', 40, 'Shaft (200119)', 'EA', 100.0, 50001.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (30, 6, '4500001804', 50, 'Body (200117)', 'EA', 100.0, 50001.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (31, 6, '4500001804', 60, 'Wheels (200116)', 'EA', 100.0, 50001.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (32, 6, '4500001804', 70, 'STEEL PLATE (200100)', 'EA', 100.0, 50001.00, 0.5, 'CC-HEAVY-01', 'OPEN'),

  -- Contract 4600000018 (Supplier: ABC Enterprises 1402 | Material: 40006654 FERT_50KG_BAG | Rate: 45000.00)
  (6,  2, '4500001719', 10, 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45000.00, 0.5, 'CC-MINING-02', 'OPEN'),
  (7,  2, '4500001720', 10, 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45000.00, 0.5, 'CC-MINING-02', 'OPEN'),
  (8,  2, '4500001721', 10, 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45000.00, 0.5, 'CC-MINING-02', 'OPEN'),
  (9,  2, '4500001722', 10, 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45000.00, 0.5, 'CC-MINING-02', 'OPEN'),
  (10, 2, '4500001723', 10, 'FERT_50KG_BAG (40006654)', 'BAG', 15.0, 45000.00, 0.5, 'CC-MINING-02', 'OPEN'),

  -- Contract 4600000020 (Supplier: ABC Enterprises 1402 | Material: 40006657 SPARE_PARTS_BOX | Rate: 125000.00)
  (16, 4, '4500001724', 10, 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125000.00, 0.5, 'CC-MAINT-01', 'OPEN'),
  (17, 4, '4500001725', 10, 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125000.00, 0.5, 'CC-MAINT-01', 'OPEN'),
  (18, 4, '4500001726', 10, 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125000.00, 0.5, 'CC-MAINT-01', 'OPEN'),
  (19, 4, '4500001727', 10, 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125000.00, 0.5, 'CC-MAINT-01', 'OPEN'),
  (20, 4, '4500001728', 10, 'SPARE_PARTS_BOX (40006657)', 'EA', 20.0, 125000.00, 0.5, 'CC-MAINT-01', 'OPEN'),

  -- Contract 4600000021 (Supplier: Gajanan Enterprises 1403 | Material: 40006658 CRUSHER_JAW_PLATE | Rate: 3400000.00)
  (21, 5, '4500001729', 10, 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400000.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (22, 5, '4500001730', 10, 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400000.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (23, 5, '4500001731', 10, 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400000.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (24, 5, '4500001732', 10, 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400000.00, 0.5, 'CC-HEAVY-01', 'OPEN'),
  (25, 5, '4500001733', 10, 'CRUSHER_JAW_PLATE (40006658)', 'PC', 12.0, 3400000.00, 0.5, 'CC-HEAVY-01', 'OPEN'),

  -- Contract 4600000019 (Supplier: ABC Enterprises 1402 | Material: 40006660 DEF_ADBLUE_20L | Rate: 28000.00)
  (11, 3, '4500001734', 10, 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28000.00, 0.5, 'CC-LOGISTICS-01', 'OPEN'),
  (12, 3, '4500001735', 10, 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28000.00, 0.5, 'CC-LOGISTICS-01', 'OPEN'),
  (13, 3, '4500001736', 10, 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28000.00, 0.5, 'CC-LOGISTICS-01', 'OPEN'),
  (14, 3, '4500001737', 10, 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28000.00, 0.5, 'CC-LOGISTICS-01', 'OPEN'),
  (15, 3, '4500001738', 10, 'DEF_ADBLUE_20L (40006660)', 'BT', 25.0, 28000.00, 0.5, 'CC-LOGISTICS-01', 'OPEN');
