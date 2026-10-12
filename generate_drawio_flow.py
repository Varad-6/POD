import os
import xml.etree.ElementTree as ET
from xml.dom import minidom

def generate_drawio():
    target_path = r"C:\Users\Varad\Downloads\PODZO_End_to_End_Process_Flow.drawio"
    
    # Root XML structure for draw.io
    mxfile = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-10-08T17:58:00.000Z',
        'agent': 'PODZO Senior Process Architecture Engine',
        'version': '24.7.17',
        'type': 'device'
    })
    
    diagram = ET.SubElement(mxfile, 'diagram', {
        'id': 'PODZO_O2C_Process_Architecture',
        'name': 'PODZO End-to-End Logistics & SAP Settlement Architecture'
    })
    
    mxGraphModel = ET.SubElement(diagram, 'mxGraphModel', {
        'dx': '2000',
        'dy': '3500',
        'grid': '1',
        'gridSize': '10',
        'guides': '1',
        'tooltips': '1',
        'connect': '1',
        'arrows': '1',
        'fold': '1',
        'page': '0',
        'pageScale': '1',
        'pageWidth': '1800',
        'pageHeight': '3200',
        'math': '0',
        'shadow': '0'
    })
    
    root = ET.SubElement(mxGraphModel, 'root')
    
    # Required base cells
    ET.SubElement(root, 'mxCell', {'id': '0'})
    ET.SubElement(root, 'mxCell', {'id': '1', 'parent': '0'})
    
    # Helper to add styling
    def add_node(node_id, label, x, y, w, h, style):
        cell = ET.SubElement(root, 'mxCell', {
            'id': node_id,
            'value': label,
            'style': style,
            'vertex': '1',
            'parent': '1'
        })
        ET.SubElement(cell, 'mxGeometry', {
            'x': str(x),
            'y': str(y),
            'width': str(w),
            'height': str(h),
            'as': 'geometry'
        })
        return cell

    def add_edge(edge_id, source, target, label='', style='', waypoints=None):
        edge = ET.SubElement(root, 'mxCell', {
            'id': edge_id,
            'value': label,
            'style': style,
            'edge': '1',
            'source': source,
            'target': target,
            'parent': '1'
        })
        geom = ET.SubElement(edge, 'mxGeometry', {'relative': '1', 'as': 'geometry'})
        if waypoints:
            pts = ET.SubElement(geom, 'Array', {'as': 'points'})
            for wx, wy in waypoints:
                ET.SubElement(pts, 'mxPoint', {'x': str(wx), 'y': str(wy)})
        return edge

    # ═════════════════════════════════════════════════════════════════════
    # COLOR PALETTES & STYLES (Enterprise SAP Fiori & Architecture Standards)
    # ═════════════════════════════════════════════════════════════════════
    STYLE_TITLE = "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;rounded=0;fontSize=20;fontStyle=1;fontColor=#0B3954;fontFamily=Helvetica;"
    STYLE_SUBTITLE = "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;rounded=0;fontSize=11;fontStyle=0;fontColor=#0854A0;fontFamily=Helvetica;"
    
    STYLE_LANE_HEADER = "swimlane;html=1;childLayout=stackLayout;resizeParent=1;resizeParentMax=0;startSize=30;horizontal=1;horizontalFlip=0;fillColor=#0854A0;strokeColor=#0854A0;fontColor=#FFFFFF;fontStyle=1;fontSize=12;rounded=1;shadow=1;"
    
    STYLE_START_END = "rounded=1;whiteSpace=wrap;html=1;arcSize=50;fillColor=#D4EDDA;strokeColor=#28A745;strokeWidth=2;fontColor=#155724;fontStyle=1;fontSize=12;align=center;shadow=1;"
    STYLE_PROCESS_BLUE = "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#EBF3FB;strokeColor=#0854A0;strokeWidth=1.5;fontColor=#0B3954;fontSize=11;fontStyle=1;align=center;spacing=6;shadow=1;"
    STYLE_PROCESS_PURPLE = "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#F3E8FD;strokeColor=#7C3AED;strokeWidth=1.5;fontColor=#4C1D95;fontSize=11;fontStyle=1;align=center;spacing=6;shadow=1;"
    STYLE_PROCESS_AMBER = "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#FEF3C7;strokeColor=#D97706;strokeWidth=1.5;fontColor=#92400E;fontSize=11;fontStyle=1;align=center;spacing=6;shadow=1;"
    STYLE_PROCESS_CYAN = "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#E0F2FE;strokeColor=#0284C7;strokeWidth=1.5;fontColor=#0369A1;fontSize=11;fontStyle=1;align=center;spacing=6;shadow=1;"
    STYLE_PROCESS_GREEN = "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#E6F4EA;strokeColor=#137333;strokeWidth=1.5;fontColor=#0D652D;fontSize=11;fontStyle=1;align=center;spacing=6;shadow=1;"
    
    STYLE_DECISION = "rhombus;whiteSpace=wrap;html=1;fillColor=#FFF8E1;strokeColor=#F59E0B;strokeWidth=2;fontColor=#B45309;fontSize=10.5;fontStyle=1;align=center;shadow=1;"
    STYLE_EXCEPTION_RED = "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#FDE8E8;strokeColor=#E02424;strokeWidth=1.5;fontColor=#9B1C1C;fontSize=10.5;fontStyle=1;align=center;spacing=6;shadow=1;"
    STYLE_BLOCK_GRAY = "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#F3F4F6;strokeColor=#9CA3AF;strokeWidth=1.5;fontColor=#374151;fontSize=10;fontStyle=1;align=center;spacing=4;shadow=1;"
    
    STYLE_EDGE_YES = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#16A34A;strokeWidth=2;fontColor=#16A34A;fontStyle=1;fontSize=10;labelBackgroundColor=#FFFFFF;"
    STYLE_EDGE_NO = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#DC2626;strokeWidth=2;fontColor=#DC2626;fontStyle=1;fontSize=10;labelBackgroundColor=#FFFFFF;"
    STYLE_EDGE_NEUTRAL = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#0854A0;strokeWidth=1.5;fontColor=#0854A0;fontSize=10;labelBackgroundColor=#FFFFFF;"
    STYLE_EDGE_LOOP = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#E66C37;strokeWidth=1.5;strokeFactor=2;dashed=1;fontColor=#E66C37;fontStyle=1;fontSize=9.5;labelBackgroundColor=#FFFFFF;"

    # ═════════════════════════════════════════════════════════════════════
    # BANNER & METADATA HEADERS
    # ═════════════════════════════════════════════════════════════════════
    add_node('hdr_box', '', 100, 30, 1600, 70, "rounded=1;fillColor=#F0F6FC;strokeColor=#0854A0;strokeWidth=2;shadow=1;")
    add_node('title', 'PODZO — Enterprise Logistics & Autonomous SAP S/4HANA Settlement Architecture', 120, 40, 1560, 28, STYLE_TITLE)
    add_node('subtitle', 'Comprehensive End-to-End Process Flow • Strict Decision Logic • Exception & Rejection Resolution Loops (IF YES / IF NO) • SAP O2C (VA03 / VL03N / MIRO)', 120, 68, 1560, 20, STYLE_SUBTITLE)

    # ═════════════════════════════════════════════════════════════════════
    # SWIMLANE STAGES (VERTICAL WORKFLOW)
    # ═════════════════════════════════════════════════════════════════════
    # Column X Coordinates:
    # Col 1 (Phase Badge / State Pills): X = 120
    # Col 2 (Happy Path Actions & Decisions): X = 500 (Width 360, Center = 680)
    # Col 3 (Exceptions, Rejections & Recovery Loops): X = 980 (Width 320)
    # Col 4 (SAP S/4HANA & Ledger State Synchronization): X = 1380 (Width 280)

    # START NODE
    add_node('node_start', '🚀 START: SAP S/4HANA Order Creation<br/>(Sales Order VA01 / VA03 Generated)', 540, 120, 280, 50, STYLE_START_END)
    
    # ─────────────────────────────────────────────────────────────────
    # STAGE 1: SAP SALES ORDER & OUTBOUND DELIVERY INGESTION (CA)
    # ─────────────────────────────────────────────────────────────────
    add_node('pill_s1', 'STAGE 1<br/><b>SAP S/4HANA INGESTION</b><br/>Role: Company Admin<br/>Status: <code>OPEN</code>', 120, 290, 320, 65, STYLE_PROCESS_BLUE)
    add_node('p1_sync', '1.1 Company Admin Syncs Live Sales Orders<br/>OData v4 fetch from S/4HANA (VA03 & VL03N Deliveries)<br/><code>GET /api/v3/sales-orders</code>', 520, 210, 320, 60, STYLE_PROCESS_BLUE)
    add_node('d1_valid', 'Are Outbound Deliveries (VL03N)<br/>& Materials Valid in S/4HANA?', 550, 300, 260, 80, STYLE_DECISION)
    add_node('e1_err', '🔴 S/4HANA OData Sync Failure<br/>• Error logged in <code>sap_sync_log</code><br/>• Order held in ERP backlog<br/>• Alert displayed on CA Control Tower', 980, 310, 300, 60, STYLE_EXCEPTION_RED)
    add_node('sap_s1', '<b>SAP S/4HANA CORE</b><br/>• Sales Orders: #2318, #2320, #2322<br/>• Deliveries: VL03N #80001474<br/>• Master Yard & Customer Quota', 1380, 290, 280, 65, STYLE_BLOCK_GRAY)

    # ─────────────────────────────────────────────────────────────────
    # STAGE 2: CARRIER ALLOCATION & CAPACITY CHECK (CA -> TA)
    # ─────────────────────────────────────────────────────────────────
    add_node('pill_s2', 'STAGE 2<br/><b>ORDER DISTRIBUTION</b><br/>Role: CA → Transporter<br/>Status: <code>DISTRIBUTED</code>', 120, 480, 320, 65, STYLE_PROCESS_BLUE)
    add_node('p2_select', '1.2 CA Selects SO & Certified Transporter<br/>Inspects line items & delivery batches in CA Console', 520, 410, 320, 55, STYLE_PROCESS_BLUE)
    add_node('d2_trans', 'Is Transporter Certified<br/>& Quota Available?', 560, 490, 240, 75, STYLE_DECISION)
    add_node('e2_trans_block', '🔴 Transporter Quota Exhausted<br/>• Distribution blocked with error modal<br/>• CA must re-select certified transporter<br/>• Order remains in OPEN state', 980, 500, 300, 55, STYLE_EXCEPTION_RED)
    add_node('p2_dist', '2.1 Commit Distribution via Joule / API<br/><code>POST /api/v3/sales-orders/distribute</code><br/>Portal Status: <b>DISTRIBUTED</b> • Transporter Notified', 520, 590, 320, 60, STYLE_PROCESS_BLUE)

    # ─────────────────────────────────────────────────────────────────
    # STAGE 3: FLEET TRUCK & DRIVER CREW ASSIGNMENT (TA)
    # ─────────────────────────────────────────────────────────────────
    add_node('pill_s3', 'STAGE 3<br/><b>FLEET CREW ASSIGNMENT</b><br/>Role: Transporter Admin<br/>Status: <code>IN_PROGRESS</code>', 120, 760, 320, 65, STYLE_PROCESS_PURPLE)
    add_node('p3_ta_open', '3.1 Transporter Opens Carrier Console<br/>Reviews assigned order (e.g. SO #2322, 15 Boxes)', 520, 680, 320, 55, STYLE_PROCESS_PURPLE)
    add_node('p3_assign_crew', '3.2 Transporter Assigns Truck & Driver<br/>Slots Driver (Rajesh Kumar) & Vehicle (MH12AB1234)<br/>Applies <b>1 Box = 1 Ton Standard Payload</b>', 520, 760, 320, 60, STYLE_PROCESS_PURPLE)
    add_node('d3_capacity', 'Does Vehicle Payload Match<br/>SO Boxes (15 Boxes = 15.0 TO)<br/>& Driver Unassigned?', 550, 850, 260, 85, STYLE_DECISION)
    add_node('e3_overload', '🔴 Capacity Mismatch / Driver Busy<br/>• Truck max tare/gross exceeded OR<br/>• Driver currently engaged on active trip<br/>• TA must select capable fleet vehicle', 980, 860, 300, 65, STYLE_EXCEPTION_RED)
    add_node('p3_commit_assign', '3.3 Trip Assignment Created<br/><code>POST /api/v3/joule/assign-driver</code><br/>Status: <b>ASSIGNED / IN_PROGRESS</b> (Trip #25)<br/>Generates Siding Entry OTP & SMS to Driver', 520, 960, 320, 65, STYLE_PROCESS_PURPLE)

    # ─────────────────────────────────────────────────────────────────
    # STAGE 4: SIDING GATE CHECK & DIGITAL BILTY DISPATCH (SUPERVISOR)
    # ─────────────────────────────────────────────────────────────────
    add_node('pill_s4', 'STAGE 4<br/><b>SIDING GATE & DISPATCH</b><br/>Role: Siding Supervisor<br/>Status: <code>DISPATCHED</code>', 120, 1220, 320, 65, STYLE_PROCESS_AMBER)
    add_node('p4_gate_arr', '4.1 Driver Arrives at Mine Siding Gate 01<br/>Presents OTP & Commercial Driver License', 520, 1055, 320, 55, STYLE_PROCESS_AMBER)
    add_node('d4_otp', 'Does Driver Pass Security,<br/>Fitness & OTP Check?', 560, 1135, 240, 75, STYLE_DECISION)
    add_node('e4_gate_deny', '🔴 Gate Entry Denied (GATE_DENIED)<br/>• Invalid OTP or vehicle safety fault<br/>• Truck turned away at perimeter gate<br/>• TA notified to re-issue credentials', 980, 1145, 300, 55, STYLE_EXCEPTION_RED)
    add_node('p4_tare', '4.2 Tare Weighing at Weighbridge Scale 01<br/>Empty truck scale weight logged (<code>MINE_TARE_LOGGED</code>)', 520, 1235, 320, 55, STYLE_PROCESS_AMBER)
    add_node('p4_loading', '4.3 Warehouse Cargo Loading Bay<br/>Load 15 Boxes (Pharma Product 01, 10, 09)', 520, 1315, 320, 55, STYLE_PROCESS_AMBER)
    add_node('d5_items', 'Do Physical Items Match<br/>SAP SO Line Items?', 560, 1395, 240, 75, STYLE_DECISION)
    add_node('e5_staging_exc', '🔴 Staging Cargo Exception<br/>• Batch discrepancy / damaged box<br/>• Status: STAGING_EXCEPTION<br/>• Bay supervisor re-picks correct items', 980, 1405, 300, 55, STYLE_EXCEPTION_RED)
    add_node('p4_bilty', '4.4 Digital Bilty (LR) Generation & Upload<br/>Supervisor attaches Bilty <code>BLT-2322-25</code><br/>Cryptographic hash generated with SO specs', 520, 1495, 320, 60, STYLE_PROCESS_AMBER)
    add_node('d6_bilty', 'Is Bilty Attached &<br/>Consignment Validated?', 560, 1580, 240, 75, STYLE_DECISION)
    add_node('e6_bilty_lock', '🔴 Dispatch Step 4 Locked<br/>• Bilty upload is mandatory<br/>• Trip departure blocked at gate', 980, 1590, 300, 55, STYLE_EXCEPTION_RED)
    add_node('p4_gross', '4.5 Weigh Loaded Truck (Weighbridge Scale 02)<br/>Gross weight logged (<code>MINE_GROSS_LOGGED</code>)<br/>Net Payload = Gross - Tare (15.00 Tons)', 520, 1680, 320, 60, STYLE_PROCESS_AMBER)
    add_node('d7_weight_tol', 'Is Net Payload within<br/>Tolerance of SO Target (±0.5%)?', 560, 1765, 240, 80, STYLE_DECISION)
    add_node('e7_weight_exc', '🔴 Net Weight Tolerance Exceeded<br/>• Overloaded or underloaded truck<br/>• Diverted to loading bay to adjust cargo', 980, 1775, 300, 60, STYLE_EXCEPTION_RED)
    add_node('p4_dispatch', '4.6 Authorize Siding Departure & Dispatch<br/><code>POST /assignments/25/supervisor-release</code><br/>Status: <b>DISPATCHED / IN_TRANSIT</b> • Gate Barrier Opened', 520, 1870, 320, 60, STYLE_PROCESS_AMBER)

    # ─────────────────────────────────────────────────────────────────
    # STAGE 5: GPS TRANSIT & CLIENT YARD ARRIVAL (DRIVER MOBILE)
    # ─────────────────────────────────────────────────────────────────
    add_node('pill_s5', 'STAGE 5<br/><b>GPS TRANSIT & ARRIVAL</b><br/>Role: Driver Mobile App<br/>Status: <code>IN_TRANSIT / ARRIVED</code>', 120, 2030, 320, 65, STYLE_PROCESS_CYAN)
    add_node('p5_start_gps', '5.1 Driver Activates Journey in Mobile App<br/>Clicks "🚀 Start Journey & Activate GPS Transit"<br/>Status: <b>EN_ROUTE</b> • Live GPS Ping Streamed', 520, 1960, 320, 60, STYLE_PROCESS_CYAN)
    add_node('p5_transit_geo', '5.2 En-Route Highway Transit Tracking<br/>Truck reaches Client Destination Yard Perimeter', 520, 2045, 320, 55, STYLE_PROCESS_CYAN)
    add_node('d8_geofence', 'Is Truck Inside Yard<br/>Geofence (<500 meters)?', 560, 2125, 240, 75, STYLE_DECISION)
    add_node('e8_outside_geo', '🔴 Arrival Button Locked<br/>• Telemetry shows truck outside yard geofence<br/>• Driver must reach perimeter or get CA override', 980, 2135, 300, 55, STYLE_EXCEPTION_RED)
    add_node('p5_arrived', '5.3 Driver Confirms Arrival at Customer Yard<br/>Status: <b>ARRIVED</b> • Unlocks Step 4 Mobile POD Upload', 520, 2225, 320, 55, STYLE_PROCESS_CYAN)

    # ─────────────────────────────────────────────────────────────────
    # STAGE 6: OFFLOADING, STAMPED POD & VISION AI OCR (AI ENGINE)
    # ─────────────────────────────────────────────────────────────────
    add_node('pill_s6', 'STAGE 6<br/><b>AI OCR RECONCILIATION</b><br/>Role: Driver / Receiver / Vision AI<br/>Status: <code>POD_VERIFICATION</code>', 120, 2420, 320, 65, STYLE_PROCESS_BLUE)
    add_node('p6_dest_weigh', '6.1 Customer Yard Offloading & Weighing<br/>Dest Gross & Tare logged • Net Delivered Tonnage recorded', 520, 2305, 320, 55, STYLE_PROCESS_BLUE)
    add_node('p6_stamp_upload', '6.2 Physical Tax Invoice & Delivery Receipt Stamped<br/>Customer receiver stamps receipt • Driver uploads photo/PDF', 520, 2385, 320, 60, STYLE_PROCESS_BLUE)
    add_node('p6_ocr_run', '6.3 Vision AI Automated 3-Way Match OCR<br/>Extracts Receipt #, Receiver Stamp, Net Weight, Items<br/>Reconciles: SAP SO #2322 vs Stamped Paper vs Scale Net', 520, 2470, 320, 65, STYLE_PROCESS_BLUE)
    add_node('d9_ocr_match', 'Clean 3-Way Match?<br/>(Zero Variance &<br/>Confidence > 95%)', 560, 2560, 240, 80, STYLE_DECISION)
    add_node('e9_review_q', '🔴 Discrepancy Enters CA Review Queue<br/>• Reason: OCR_MISMATCH / TOLERANCE_EXCEEDED<br/>• Status: UNDER_REVIEW • blocks_miro_bool = 1<br/>• Alert routed to CA Audit Queue', 980, 2570, 300, 65, STYLE_EXCEPTION_RED)

    # ─────────────────────────────────────────────────────────────────
    # STAGE 7: CA POD VERIFICATION & EXCEPTION AUDIT DESK (CA)
    # ─────────────────────────────────────────────────────────────────
    add_node('pill_s7', 'STAGE 7<br/><b>CA POD VERIFICATION</b><br/>Role: Company Admin<br/>Status: <code>APPROVED</code>', 120, 2730, 320, 65, STYLE_PROCESS_GREEN)
    add_node('p7_ca_desk', '7.1 CA Audit Desk Inspection (/admin/approvals)<br/>CA compares physical scanned bill, scale logs & driver notes', 520, 2670, 320, 55, STYLE_PROCESS_GREEN)
    add_node('d10_ca_dec', 'CA Verification Decision<br/>(Approve with Notes vs<br/>Reject Fraud/Loss)?', 560, 2750, 240, 80, STYLE_DECISION)
    add_node('e10_reject', '🔴 POD Audit Rejected (REJECTED)<br/>• Audit notes recorded (e.g. invalid yard stamp)<br/>• MIRO lock remains blocked<br/>• Transporter notified to upload authentic receipt', 980, 2760, 300, 65, STYLE_EXCEPTION_RED)
    add_node('p7_approve', '7.2 CA Approves POD / Resolves Exception<br/><code>POST /api/v3/joule/approve-review</code><br/>Status: <b>APPROVED</b> • S/4HANA Mirror Synced<br/>SAP MIRO Invoicing Lock Released!', 520, 2855, 320, 65, STYLE_PROCESS_GREEN)

    # ─────────────────────────────────────────────────────────────────
    # STAGE 8: FREIGHT INVOICING & CLOSED-LOOP S/4HANA MIRO SETTLEMENT
    # ─────────────────────────────────────────────────────────────────
    add_node('pill_s8', 'STAGE 8<br/><b>CLOSED-LOOP S/4HANA MIRO</b><br/>Role: Transporter / CA / Joule AI<br/>Status: <code>COMPLETED / PAID</code>', 120, 3020, 320, 65, STYLE_PROCESS_GREEN)
    add_node('p8_gen_inv', '8.1 Transporter Submits Freight Tax Invoice<br/>LIV invoice generated against verified delivered payload', 520, 2945, 320, 55, STYLE_PROCESS_GREEN)
    add_node('p8_post_miro', '8.2 Joule AI / CA Posts S/4HANA MIRO Invoice<br/><code>POST /api/v3/joule/post-miro</code><br/>Triggers BAPI / RFC Supplier Ledger Posting', 520, 3025, 320, 60, STYLE_PROCESS_GREEN)
    add_node('d11_bapi', 'Does S/4HANA BAPI Return<br/>Clean Financial Reference<br/>(No Fiscal/Tax Lock)?', 560, 3110, 240, 80, STYLE_DECISION)
    add_node('e11_bapi_err', '🔴 SAP ERP BAPI Posting Failure<br/>• RFC communication error or posting block<br/>• Logged in <code>sap_sync_log</code> with payload<br/>• Trip parked for ERP accountant reconciliation', 980, 3120, 300, 65, STYLE_EXCEPTION_RED)
    add_node('p8_settled', '8.3 Financial Settlement Completed<br/>• S/4HANA FI Reference: <code>MIRO-SAP-20261008-01</code><br/>• AP Cleared • Payment Status: <b>PAID</b><br/>• Sales Order Stage: <b>COMPLETED</b>', 520, 3215, 320, 65, STYLE_PROCESS_GREEN)

    # END NODE
    add_node('node_end', '🏁 END: Closed-Loop SAP S/4HANA Logistics Settlement Complete<br/>(100% Audit Readiness • Zero Invoicing Discrepancy • DSO Reduced by 90%)', 460, 3305, 440, 50, STYLE_START_END)

    # ═════════════════════════════════════════════════════════════════════
    # CONNECTORS & FLOW EDGES (WITH STRICT YES / NO LABELS & RECOVERY LOOPS)
    # ═════════════════════════════════════════════════════════════════════
    # Start -> 1.1
    add_edge('e_s_1', 'node_start', 'p1_sync', '', STYLE_EDGE_NEUTRAL)
    # 1.1 -> D1
    add_edge('e_1_d1', 'p1_sync', 'd1_valid', '', STYLE_EDGE_NEUTRAL)
    # D1 -> YES (p2_select)
    add_edge('e_d1_yes', 'd1_valid', 'p2_select', 'YES: OData Sync OK', STYLE_EDGE_YES)
    # D1 -> NO (e1_err)
    add_edge('e_d1_no', 'd1_valid', 'e1_err', 'NO: Sync Error', STYLE_EDGE_NO)
    
    # p2_select -> D2
    add_edge('e_p2_d2', 'p2_select', 'd2_trans', '', STYLE_EDGE_NEUTRAL)
    # D2 -> YES (p2_dist)
    add_edge('e_d2_yes', 'd2_trans', 'p2_dist', 'YES: Certified', STYLE_EDGE_YES)
    # D2 -> NO (e2_trans_block)
    add_edge('e_d2_no', 'd2_trans', 'e2_trans_block', 'NO: Quota Full', STYLE_EDGE_NO)
    # Recovery loop from e2 back to p2_select
    add_edge('e_e2_loop', 'e2_trans_block', 'p2_select', 'Re-select Transporter', STYLE_EDGE_LOOP, [(1290, 527), (1290, 437)])

    # p2_dist -> 3.1
    add_edge('e_dist_31', 'p2_dist', 'p3_ta_open', '', STYLE_EDGE_NEUTRAL)
    # 3.1 -> 3.2
    add_edge('e_31_32', 'p3_ta_open', 'p3_assign_crew', '', STYLE_EDGE_NEUTRAL)
    # 3.2 -> D3
    add_edge('e_32_d3', 'p3_assign_crew', 'd3_capacity', '', STYLE_EDGE_NEUTRAL)
    # D3 -> YES (p3_commit_assign)
    add_edge('e_d3_yes', 'd3_capacity', 'p3_commit_assign', 'YES: Capacity OK', STYLE_EDGE_YES)
    # D3 -> NO (e3_overload)
    add_edge('e_d3_no', 'd3_capacity', 'e3_overload', 'NO: Over Capacity / Busy', STYLE_EDGE_NO)
    # Recovery loop from e3 back to p3_assign_crew
    add_edge('e_e3_loop', 'e3_overload', 'p3_assign_crew', 'Re-Slot Vehicle', STYLE_EDGE_LOOP, [(1290, 892), (1290, 790)])

    # p3_commit -> 4.1
    add_edge('e_assign_41', 'p3_commit_assign', 'p4_gate_arr', '', STYLE_EDGE_NEUTRAL)
    # 4.1 -> D4
    add_edge('e_41_d4', 'p4_gate_arr', 'd4_otp', '', STYLE_EDGE_NEUTRAL)
    # D4 -> YES (p4_tare)
    add_edge('e_d4_yes', 'd4_otp', 'p4_tare', 'YES: OTP & Safety Pass', STYLE_EDGE_YES)
    # D4 -> NO (e4_gate_deny)
    add_edge('e_d4_no', 'd4_otp', 'e4_gate_deny', 'NO: Invalid OTP', STYLE_EDGE_NO)
    # Recovery loop from e4 back to p4_gate_arr
    add_edge('e_e4_loop', 'e4_gate_deny', 'p4_gate_arr', 'Re-verify Driver', STYLE_EDGE_LOOP, [(1290, 1172), (1290, 1082)])

    # p4_tare -> 4.3 (loading)
    add_edge('e_42_43', 'p4_tare', 'p4_loading', '', STYLE_EDGE_NEUTRAL)
    # 4.3 -> D5
    add_edge('e_43_d5', 'p4_loading', 'd5_items', '', STYLE_EDGE_NEUTRAL)
    # D5 -> YES (p4_bilty)
    add_edge('e_d5_yes', 'd5_items', 'p4_bilty', 'YES: Cargo Matches SO', STYLE_EDGE_YES)
    # D5 -> NO (e5_staging_exc)
    add_edge('e_d5_no', 'd5_items', 'e5_staging_exc', 'NO: Cargo Mismatch', STYLE_EDGE_NO)
    # Recovery loop from e5 back to p4_loading
    add_edge('e_e5_loop', 'e5_staging_exc', 'p4_loading', 'Re-Pick Correct Cargo', STYLE_EDGE_LOOP, [(1290, 1432), (1290, 1342)])

    # p4_bilty -> D6
    add_edge('e_bilty_d6', 'p4_bilty', 'd6_bilty', '', STYLE_EDGE_NEUTRAL)
    # D6 -> YES (p4_gross)
    add_edge('e_d6_yes', 'd6_bilty', 'p4_gross', 'YES: Bilty Verified', STYLE_EDGE_YES)
    # D6 -> NO (e6_bilty_lock)
    add_edge('e_d6_no', 'd6_bilty', 'e6_bilty_lock', 'NO: Bilty Missing', STYLE_EDGE_NO)
    # Recovery loop from e6 back to p4_bilty
    add_edge('e_e6_loop', 'e6_bilty_lock', 'p4_bilty', 'Upload Digital Bilty', STYLE_EDGE_LOOP, [(1290, 1617), (1290, 1525)])

    # p4_gross -> D7
    add_edge('e_gross_d7', 'p4_gross', 'd7_weight_tol', '', STYLE_EDGE_NEUTRAL)
    # D7 -> YES (p4_dispatch)
    add_edge('e_d7_yes', 'd7_weight_tol', 'p4_dispatch', 'YES: Weight within Tol', STYLE_EDGE_YES)
    # D7 -> NO (e7_weight_exc)
    add_edge('e_d7_no', 'd7_weight_tol', 'e7_weight_exc', 'NO: Scale Tolerance Exceeded', STYLE_EDGE_NO)
    # Recovery loop from e7 back to p4_loading
    add_edge('e_e7_loop', 'e7_weight_exc', 'p4_loading', 'Adjust Truck Load', STYLE_EDGE_LOOP, [(1310, 1805), (1310, 1342)])

    # p4_dispatch -> 5.1
    add_edge('e_disp_51', 'p4_dispatch', 'p5_start_gps', '', STYLE_EDGE_NEUTRAL)
    # 5.1 -> 5.2
    add_edge('e_51_52', 'p5_start_gps', 'p5_transit_geo', '', STYLE_EDGE_NEUTRAL)
    # 5.2 -> D8
    add_edge('e_52_d8', 'p5_transit_geo', 'd8_geofence', '', STYLE_EDGE_NEUTRAL)
    # D8 -> YES (p5_arrived)
    add_edge('e_d8_yes', 'd8_geofence', 'p5_arrived', 'YES: Inside Geofence', STYLE_EDGE_YES)
    # D8 -> NO (e8_outside_geo)
    add_edge('e_d8_no', 'd8_geofence', 'e8_outside_geo', 'NO: Outside Yard', STYLE_EDGE_NO)
    # Recovery loop from e8 back to p5_transit_geo
    add_edge('e_e8_loop', 'e8_outside_geo', 'p5_transit_geo', 'Driver Navigates into Yard', STYLE_EDGE_LOOP, [(1290, 2162), (1290, 2072)])

    # p5_arrived -> 6.1
    add_edge('e_arr_61', 'p5_arrived', 'p6_dest_weigh', '', STYLE_EDGE_NEUTRAL)
    # 6.1 -> 6.2
    add_edge('e_61_62', 'p6_dest_weigh', 'p6_stamp_upload', '', STYLE_EDGE_NEUTRAL)
    # 6.2 -> 6.3
    add_edge('e_62_63', 'p6_stamp_upload', 'p6_ocr_run', '', STYLE_EDGE_NEUTRAL)
    # 6.3 -> D9
    add_edge('e_63_d9', 'p6_ocr_run', 'd9_ocr_match', '', STYLE_EDGE_NEUTRAL)
    # D9 -> YES (p7_ca_desk or auto)
    add_edge('e_d9_yes', 'd9_ocr_match', 'p7_ca_desk', 'YES: Clean 3-Way Match', STYLE_EDGE_YES)
    # D9 -> NO (e9_review_q)
    add_edge('e_d9_no', 'd9_ocr_match', 'e9_review_q', 'NO: Discrepancy Flagged', STYLE_EDGE_NO)
    # Edge from e9 into CA review desk
    add_edge('e_e9_to_ca', 'e9_review_q', 'p7_ca_desk', 'Route to Audit Desk', STYLE_EDGE_NEUTRAL, [(1130, 2697)])

    # p7_ca_desk -> D10
    add_edge('e_71_d10', 'p7_ca_desk', 'd10_ca_dec', '', STYLE_EDGE_NEUTRAL)
    # D10 -> APPROVE (p7_approve)
    add_edge('e_d10_app', 'd10_ca_dec', 'p7_approve', 'APPROVE: Override / Verified', STYLE_EDGE_YES)
    # D10 -> REJECT (e10_reject)
    add_edge('e_d10_rej', 'd10_ca_dec', 'e10_reject', 'REJECT: Fraud / Severe Loss', STYLE_EDGE_NO)
    # Recovery loop from e10 back to p6_stamp_upload
    add_edge('e_e10_loop', 'e10_reject', 'p6_stamp_upload', 'Upload Legitimate Receipt', STYLE_EDGE_LOOP, [(1310, 2792), (1310, 2415)])

    # p7_approve -> 8.1
    add_edge('e_72_81', 'p7_approve', 'p8_gen_inv', '', STYLE_EDGE_NEUTRAL)
    # 8.1 -> 8.2
    add_edge('e_81_82', 'p8_gen_inv', 'p8_post_miro', '', STYLE_EDGE_NEUTRAL)
    # 8.2 -> D11
    add_edge('e_82_d11', 'p8_post_miro', 'd11_bapi', '', STYLE_EDGE_NEUTRAL)
    # D11 -> YES (p8_settled)
    add_edge('e_d11_yes', 'd11_bapi', 'p8_settled', 'YES: S/4HANA FI Ref Generated', STYLE_EDGE_YES)
    # D11 -> NO (e11_bapi_err)
    add_edge('e_d11_no', 'd11_bapi', 'e11_bapi_err', 'NO: BAPI / RFC Error', STYLE_EDGE_NO)
    # Recovery loop from e11 back to p8_post_miro
    add_edge('e_e11_loop', 'e11_bapi_err', 'p8_post_miro', 'Retry MIRO Post with Ref', STYLE_EDGE_LOOP, [(1290, 3152), (1290, 3055)])

    # 8.3 -> END
    add_edge('e_settled_end', 'p8_settled', 'node_end', '', STYLE_EDGE_YES)

    # ═════════════════════════════════════════════════════════════════════
    # EXPORT XML TO PRETTY FORMAT & SAVE
    # ═════════════════════════════════════════════════════════════════════
    xml_str = ET.tostring(mxfile, encoding='utf-8')
    pretty_xml = minidom.parseString(xml_str).toprettyxml(indent="  ")
    
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(pretty_xml)
        
    print(f"Successfully generated Draw.io Process Architecture File at:\n{target_path}")

if __name__ == '__main__':
    generate_drawio()
