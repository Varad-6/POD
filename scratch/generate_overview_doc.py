import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_styled_document(output_path: str):
    doc = Document()

    # Page Margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Palette Colors
    NAVY_HEX = "0A192F"
    SLATE_HEX = "1E293B"
    PRIMARY_ORANGE_HEX = "FF5B00"
    BLUE_HEX = "2563EB"
    LIGHT_BG_HEX = "F1F5F9"
    BORDER_HEX = "CBD5E1"
    TEXT_MUTED_HEX = "64748B"
    GREEN_HEX = "10B981"
    RED_HEX = "EF4444"

    COLOR_NAVY = RGBColor(0x0A, 0x19, 0x2F)
    COLOR_ORANGE = RGBColor(0xFF, 0x5B, 0x00)
    COLOR_BLUE = RGBColor(0x25, 0x63, 0xEB)
    COLOR_SLATE = RGBColor(0x1E, 0x29, 0x3B)
    COLOR_MUTED = RGBColor(0x64, 0x74, 0x8B)

    # Base Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Segoe UI'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = COLOR_SLATE

    # Helper Functions
    def set_cell_bg(cell, hex_color: str):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="{hex_color}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_table_borders(table, color=BORDER_HEX, sz="4", val="single"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideV w:val="none"/>'
            f'<w:left w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def add_heading_1(text: str):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Segoe UI'
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = COLOR_NAVY
        return p

    def add_heading_2(text: str):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Segoe UI'
        run.font.size = Pt(12.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_BLUE
        return p

    def add_heading_3(text: str):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Segoe UI'
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = COLOR_SLATE
        return p

    def add_callout(title: str, text: str, border_color_hex=PRIMARY_ORANGE_HEX, bg_color_hex=LIGHT_BG_HEX):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.9)
        set_cell_bg(cell, bg_color_hex)
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)

        # left border only
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color_hex}"/>'
            f'<w:top w:val="none"/>'
            f'<w:bottom w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)

        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        run_t = p.add_run(f"📌 {title}\n")
        run_t.bold = True
        run_t.font.size = Pt(10)
        run_t.font.color.rgb = COLOR_NAVY

        run_body = p.add_run(text)
        run_body.font.size = Pt(9.5)
        run_body.font.color.rgb = COLOR_SLATE

        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # ─── TITLE / HEADER ────────────────────────────────────────────────────────
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    t_run = title_p.add_run("PODZO — Enterprise Logistics & Automated POD Platform")
    t_run.font.name = 'Segoe UI'
    t_run.font.size = Pt(22)
    t_run.font.bold = True
    t_run.font.color.rgb = COLOR_NAVY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(12)
    sub_run = sub_p.add_run("Complete Architectural Overview, End-to-End Data Flows ('From Where to What'), and Exhaustive Scenario Breakdown")
    sub_run.font.size = Pt(11)
    sub_run.font.color.rgb = COLOR_MUTED

    # Document Control Box
    doc_tbl = doc.add_table(rows=6, cols=2)
    doc_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    doc_tbl.autofit = False
    col_widths = [Inches(2.2), Inches(4.7)]
    set_table_borders(doc_tbl)

    meta_rows = [
        ("Project Name", "PODZO (Proof-of-Delivery & Invoice Automation System)"),
        ("Tagline & Mission", "Let's make delivery simple. (Zero-leakage bulk haulage)"),
        ("System Architecture", "React 19 Frontend + Express 5 Node.js Backend + SQLite V3 DB + SAP S21/S4 Connector + Joule AI"),
        ("Primary Personas", "Company Admin (CA), Transporter Admin (TA), Driver (DR), Weighbridge Supervisor (SR), Customer (CR)"),
        ("Repository Location", "Varad-6/POD (C:\\Users\\Varad\\Documents\\GitHub\\POD)"),
        ("Document Generated", "October 2026 | Comprehensive Technical & Operational Guide")
    ]

    for i, (k, v) in enumerate(meta_rows):
        row = doc_tbl.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width, c1.width = col_widths[0], col_widths[1]
        set_cell_bg(c0, LIGHT_BG_HEX)
        set_cell_bg(c1, "FFFFFF")
        set_cell_margins(c0, 80, 80, 100, 100)
        set_cell_margins(c1, 80, 80, 100, 100)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(k)
        r0.bold = True
        r0.font.size = Pt(9)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(v)
        r1.font.size = Pt(9)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ─── SECTION 1: EXECUTIVE OVERVIEW ────────────────────────────────────────
    add_heading_1("1. Executive Overview & Core Problem Addressed")
    
    p = doc.add_paragraph(
        "PODZO is an intelligent, AI-assisted logistics execution, weighbridge reconciliation, and automated Proof-of-Delivery (POD) platform. "
        "Engineered specifically for heavy industrial bulk haulage, mining transport (such as coal, aggregates, and mineral ores), and multi-enterprise carrier networks, "
        "PODZO serves as the critical real-time execution bridge between enterprise SAP ERP systems (SAP S/4HANA / SAP S21) and physical logistics operations on the ground."
    )
    p.paragraph_format.space_after = Pt(6)

    add_callout(
        "The Multimillion-Dollar Industrial Logistics Challenge",
        "1. Paper POD Latency: Transporters wait 30–90 days for physical stamped delivery slips to travel back from remote sidings, freezing carrier cashflow.\n"
        "2. Weight Theft & Evaporation: Coal and ore can be siphoned or diluted in transit without instant dual-weighbridge automated variance detection.\n"
        "3. Manual Invoice Mismatch: Accounts payable teams spend hundreds of hours reconciling nominal PO weights against actual delivered weighment bills.\n"
        "4. Stakeholder Silos: Mine managers, transporters, drivers, gate supervisors, and power plant receivers operate with zero shared real-time ledger."
    )

    # ─── SECTION 2: SYSTEM ARCHITECTURE & TECH STACK ───────────────────────────
    add_heading_1("2. Full-Stack System Architecture & Technology Stack")
    
    p = doc.add_paragraph(
        "PODZO is engineered with modern web standards, resilient integration adapters, role-based workflows, and enterprise conversational AI hooks:"
    )

    arch_tbl = doc.add_table(rows=6, cols=3)
    arch_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    arch_tbl.autofit = False
    set_table_borders(arch_tbl)
    
    widths = [Inches(1.5), Inches(2.2), Inches(3.2)]
    headers = ["Layer", "Technology", "Key Capabilities & Responsibilities"]
    
    for j, h in enumerate(headers):
        c = arch_tbl.rows[0].cells[j]
        c.width = widths[j]
        set_cell_bg(c, NAVY_HEX)
        set_cell_margins(c, 100, 100, 100, 100)
        p = c.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    layers_data = [
        ("Frontend UI", "React 19 + TypeScript + Vite + React Router 7", "Responsive 5-persona dashboards, dark industrial theme, interactive HTML5 signature pad, real-time variance gauges, dynamic POD document viewer."),
        ("Backend API", "Node.js Express 5.2.1 REST API (/api/v3)", "JWT token auth, role middleware, multer file uploads, Haversine geo-distance calculator, automated review queue engine, rate-multiplication invoicing."),
        ("Database Engine", "SQLite (better-sqlite3 13.0.3)", "ACID-compliant relational database (`podzo_portal_v3.db`) with relational integrity across 14 tables, demo reset transaction isolation, and audit logs."),
        ("ERP Integration", "SAP S21 / S4 OData Adapter (ISAPAdapter)", "Dual-mode adapter (S21SAPAdapter + MockSAPAdapter) pulling ME33K Contracts & ME23N POs with zero-failure local database fallback."),
        ("AI / Copilot", "SAP Joule Digital Assistant + OCR Sim", "DAS YAML skill definitions for conversational PO queries, driver assignment, MIRO posting, and intelligent document OCR matching.")
    ]

    for i, row_data in enumerate(layers_data, start=1):
        row = arch_tbl.rows[i]
        for j, text in enumerate(row_data):
            c = row.cells[j]
            c.width = widths[j]
            set_cell_bg(c, LIGHT_BG_HEX if j == 0 else "FFFFFF")
            set_cell_margins(c, 80, 80, 100, 100)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(text)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ─── SECTION 3: FROM WHERE WHAT IS GOING (DATA FLOW) ──────────────────────
    add_heading_1("3. 'From Where to What' — Complete End-to-End Execution Flow")
    
    p = doc.add_paragraph(
        "To understand how data and physical commodities traverse the system, the execution lifecycle is structured into 9 precise stages across enterprise ERP, mine gates, transit, customer gates, and financial posting:"
    )

    flow_tbl = doc.add_table(rows=10, cols=5)
    flow_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    flow_tbl.autofit = False
    set_table_borders(flow_tbl)
    
    f_widths = [Inches(0.6), Inches(1.2), Inches(1.3), Inches(2.2), Inches(1.6)]
    f_headers = ["Step", "Origin / Actor", "Destination", "Data & Payload Transferred", "System Action & Outcome"]

    for j, h in enumerate(f_headers):
        c = flow_tbl.rows[0].cells[j]
        c.width = f_widths[j]
        set_cell_bg(c, NAVY_HEX)
        set_cell_margins(c, 100, 100, 80, 80)
        p = c.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    flow_steps = [
        ("1", "SAP ERP (S21 / S4)", "PODZO Database", "Outline Agreements (ME33K), Transport POs (ME23N), target tonnage, rates, tolerance %", "S21SAPAdapter pulls OData into `contracts` and `purchase_orders` tables."),
        ("2", "Company Admin (CA)", "Transporter Admin (TA)", "PO line allocation, carrier selection, target quantity split", "PO assigned to selected carrier; status moves from OPEN to ASSIGNED."),
        ("3", "Transporter Admin (TA)", "Driver Mobile (DR)", "Job configuration, truck reg plate, trailer ID, driver pairing, scheduled run", "Created in `transport_assignments`; mobile dispatch notification triggered."),
        ("4", "Driver (DR)", "Mine Gate Siding", "Digital signature on touch canvas, driver license, vehicle credentials", "Driver accepts job; assignment status updated to READY_FOR_DISPATCH."),
        ("5", "Weighbridge Supervisor", "Mine Siding Gate 1 & 2", "Gate 1: MINE_TARE (empty truck kg), Gate 2: MINE_GROSS (loaded truck kg)", "Net Mine Payload calculated; digital Consignment Note (Bilty) issued."),
        ("6", "Driver & GPS Service", "Customer Gate (CR)", "Transit start timestamp, GPS telemetry, destination arrival OTP token", "Truck arrives at destination; customer receiver confirms gate entry."),
        ("7", "Customer Receiver (CR)", "Customer Gate 3 & 4", "Gate 3: DEST_GROSS (loaded kg), Gate 4: DEST_TARE (offloaded kg)", "Net Delivered Payload calculated; Dual-weight variance formula executed."),
        ("8", "Driver / Transporter", "PODZO OCR Engine", "Scanned / photographed physical delivery slip with customer ink stamp", "OCR extracts Waybill #, Weight, Stamp confidence; Match Rule Engine runs."),
        ("9", "Company Admin (CA)", "SAP Financials (MIRO)", "Audited invoice line items, delivered tons * rate, MIRO document payload", "MIRO invoice transitions from PARKED -> POSTED -> CLEARED in SAP.")
    ]

    for i, step_data in enumerate(flow_steps, start=1):
        row = flow_tbl.rows[i]
        for j, text in enumerate(step_data):
            c = row.cells[j]
            c.width = f_widths[j]
            set_cell_bg(c, LIGHT_BG_HEX if j == 0 else "FFFFFF")
            set_cell_margins(c, 70, 70, 80, 80)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(text)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ─── SECTION 4: DEEP DIVE INTO RECONCILIATION & RULES ─────────────────────
    add_heading_1("4. Core Mathematical & Verification Subsystems")

    add_heading_2("4.1 Quad-Gate Dual Weighbridge Reconciliation Engine")
    p = doc.add_paragraph(
        "PODZO captures 4 precise weighbridge events per trip cycle. Net delivered weight is reconciled against net dispatch weight as follows:"
    )
    p.paragraph_format.space_after = Pt(4)

    add_callout(
        "Mathematical Formulas for Weight Reconciliation",
        "1. Net Mine Payload (Tons) = [ MINE_GROSS (kg) - MINE_TARE (kg) ] / 1,000\n"
        "2. Net Delivered Payload (Tons) = [ DEST_GROSS (kg) - DEST_TARE (kg) ] / 1,000\n"
        "3. Absolute Weight Variance (kg) = | Net Mine Payload (kg) - Net Delivered Payload (kg) |\n"
        "4. Variance Percentage (%) = [ Absolute Variance (kg) / Net Mine Payload (kg) ] * 100\n"
        "5. Automated Tolerance Rule:\n"
        "   - IF Variance (%) <= purchase_orders.tolerance_pct (e.g. 0.5%) -> WITHIN_TOLERANCE (Auto-Approved)\n"
        "   - IF Variance (%) > purchase_orders.tolerance_pct -> OUTSIDE_TOLERANCE (Blocked in Review Queue)"
    )

    add_heading_2("4.2 Three-Way Matching & Review Queue Gatekeeper")
    p = doc.add_paragraph(
        "Before any freight invoice can be parked in SAP MIRO, PODZO executes a 3-way reconciliation audit:\n"
        "• 1. SAP Transport PO Rate & Tolerance Limit (Contract Master)\n"
        "• 2. Weighbridge Siding & Plant Net Weights (Quad-Gate Telemetry)\n"
        "• 3. Scanned Physical Delivery POD Document (OCR Extracted Waybill & Weight)\n\n"
        "Any failure in any check immediately generates a blocking record in `review_queue` (`blocks_miro_bool = 1`). "
        "The system strictly prohibits invoice generation and MIRO posting until a Company Admin manually reviews and resolves the exception in `AdminApprovals.tsx`."
    )

    # ─── SECTION 5: DETAILED SCENARIO-BY-SCENARIO BREAKDOWN ───────────────────
    add_heading_1("5. Scenario-Wise Detailed Analysis (8 Operational Scenarios)")
    
    scenarios = [
        {
            "num": "Scenario 1",
            "title": "Standard Happy Path (Clean Run, Full OCR Match & Auto-Clearance)",
            "actors": "Company Admin (CA), Transporter Admin (TA), Driver dr_zweli, Gate Supervisor sr_gate01, Customer Receiver cr_mining",
            "trigger": "Company Admin allocates 35 Tons of Coal from Contract 4600000017 (PO 4500001801) to Sipho Transport Services.",
            "workflow": [
                "1. Transporter Admin configures job and assigns Driver Zweli Mthethwa with Truck HINO-700 (Reg: JS-99-TR-GP).",
                "2. Driver signs digital acceptance on touch canvas; status changes to ASSIGNED.",
                "3. Truck arrives at Mine Siding Gate 1: Supervisor logs MINE_TARE = 15,200 kg.",
                "4. Loading completes; Truck re-weighed at Mine Siding Gate 2: Supervisor logs MINE_GROSS = 50,020 kg (Net Mine Payload = 34,820 kg).",
                "5. Waybill WB-998801 issued; Driver enters transit with OTP security verification.",
                "6. Truck arrives at Eskom Power Station: Customer Receiver logs DEST_GROSS = 49,960 kg.",
                "7. Coal offloaded into bunker; Customer Receiver logs DEST_TARE = 15,210 kg (Net Delivered Payload = 34,750 kg).",
                "8. Variance Calculation: |34,820 - 34,750| = 70 kg (0.20%), which is strictly <= 0.5% PO tolerance.",
                "9. Physical POD slip uploaded (invoice_001_full_match.pdf); OCR extracts Waybill WB-998801 with 98% confidence (MATCH).",
                "10. Auto-Approval: System marks assignment as APPROVED, calculates Invoice = 34.75 T * R 450.00/T = R 15,637.50.",
                "11. MIRO invoice transitions from PARKED to POSTED to CLEARED without manual admin intervention."
            ],
            "outcome": "✅ Zero delay, 100% automated straight-through processing. Cashflow cycle compressed from 45 days to 4 hours."
        },
        {
            "num": "Scenario 2",
            "title": "Weight Discrepancy & Tolerance Breach (In-Transit Loss / Pilferage)",
            "actors": "Transporter Admin, Driver dr_jan, Customer Receiver, Company Admin Thandiwe",
            "trigger": "A 35-ton coal dispatch suffers moisture loss or cargo pilferage during a 300km haulage run.",
            "workflow": [
                "1. Mine Dispatch Net Weight recorded as 34,850 kg at Mine Siding Gate 2.",
                "2. At Customer Receiving Site, DEST_GROSS = 46,700 kg and DEST_TARE = 15,200 kg.",
                "3. Net Delivered Payload = 31,500 kg. Weight loss = 3,350 kg (9.61% variance).",
                "4. System Tolerance Engine detects 9.61% > 0.5% maximum allowable PO tolerance.",
                "5. Automated review queue exception created: `flag_reason = 'TOLERANCE_EXCEEDED'`, `blocks_miro_bool = 1`.",
                "6. Transporter attempt to generate invoice is immediately BLOCKED by backend middleware.",
                "7. Company Admin navigates to `AdminApprovals.tsx`, inspects side-by-side weighbridge telemetry.",
                "8. Admin initiates carrier inquiry. If legitimate wash-plant loss is proven, Admin executes manual override approval with deduction penalty; otherwise, payment is rejected."
            ],
            "outcome": "⚠️ Prevents financial leakage. Enterprise is protected from paying for 3.35 tons of missing cargo."
        },
        {
            "num": "Scenario 3",
            "title": "OCR Document Mismatch & Illegible / Blurry Scanned POD",
            "actors": "Driver dr_lucky, OCR Simulator Engine, Company Admin Thandiwe",
            "trigger": "Driver captures a blurry, poorly lit smartphone photograph of a crumpled paper POD slip in the rain.",
            "workflow": [
                "1. Driver uploads image `delivery-slip-blurry.jpg` or `invoice_008_low_quality_scan.pdf` via `/api/v3/pod/upload`.",
                "2. OCR Engine attempts text extraction: extracted waybill is 'UNKNOWN' or confidence score falls to 42%.",
                "3. Threshold Rule: OCR confidence 42% is below the mandatory 80% threshold.",
                "4. Match status is flagged as `MISMATCH` / `LOW_CONFIDENCE` in `pod_documents` table.",
                "5. Exception routed to Review Queue: `flag_reason = 'OCR_MISMATCH'`, locking assignment status to `UNDER_REVIEW`.",
                "6. Company Admin opens Review Queue modal, views high-resolution uploaded image side-by-side with digital weighbridge record.",
                "7. Admin manually verifies customer stamp, manually inputs correct waybill number, and approves document."
            ],
            "outcome": "🔍 Combines AI speed with human-in-the-loop safety. Ensures unreadable documents never trigger false invoice payments."
        },
        {
            "num": "Scenario 4",
            "title": "Gate Security Rejection & Driver Credential Failure",
            "actors": "Driver dr_austin, Weighbridge Supervisor sr_gate01",
            "trigger": "Driver arrives at mine gate with an expired professional driving permit (PrDP) or incorrect vehicle registration.",
            "workflow": [
                "1. Truck pulls onto Mine Gate 1 weighbridge platform.",
                "2. Supervisor opens `SupervisorDashboard.tsx` and scans vehicle license disc and driver ID.",
                "3. System checks driver profile in SQLite database: license expiry date is passed.",
                "4. Supervisor clicks 'Gate Denied' button and enters reason: 'EXPIRED_PRDP_LICENSE'.",
                "5. Assignment status instantly updates to `GATE_DENIED`; weight recording is blocked.",
                "6. Transporter Admin receives immediate alert in `TransporterDashboard.tsx` to reassign load to a compliant backup driver."
            ],
            "outcome": "🛑 Ensures complete mine site compliance, safety governance, and zero unauthorized vehicle dispatch."
        },
        {
            "num": "Scenario 5",
            "title": "Multi-Carrier PO Splitting & Fleet Batch Assignment",
            "actors": "Company Admin, Transporter Admins (Sipho Transport, CBS Logistics, MPL Haulage)",
            "trigger": "High-volume contract with 10,000 Tons monthly commitment requires distribution across 3 transport vendors.",
            "workflow": [
                "1. Company Admin selects Contract 4600000018 in `AdminContracts.tsx`.",
                "2. Admin splits PO 4500001802 into 3 allocations: Sipho (4,000 T), CBS (3,500 T), MPL (2,500 T).",
                "3. Each Transporter Admin logs in and sees their respective allocated quota in `TransporterPOs.tsx`.",
                "4. Sipho Transport configures 10 individual truck runs (34 T each) in batch mode.",
                "5. Assignments are linked to parent `job_configs` and tracked independently through the quad-gate weighbridge lifecycle."
            ],
            "outcome": "📊 Enterprise scalability: handles complex industrial multi-carrier haulage schedules seamlessly."
        },
        {
            "num": "Scenario 6",
            "title": "SAP S21 Live OData Synchronization & Resilient Offline Fallback",
            "actors": "Integration Service (`S21SAPAdapter`), SAP S/4HANA Gateway, SQLite Database",
            "trigger": "PODZO initiates startup synchronization against SAP S21 ERP gateway endpoints.",
            "workflow": [
                "1. `S21SAPAdapter.fetchContracts()` issues OData HTTP GET to `/ZPOD_CONTRACTS_SRV/ContractSet`.",
                "2. `S21SAPAdapter.fetchPurchaseOrders()` queries `/ZPOD_PURCHASE_ORDERS_SRV/PurchaseOrderSet`.",
                "3. If SAP gateway responds (HTTP 200), SAP structures (`EBELN`, `NETWR`, `MENGE`) are mapped to internal domain entities.",
                "4. If SAP gateway is offline, unreachable, or proxy returns 500/timeout, adapter triggers graceful fallback:",
                "5. Adapter routes query to local Express endpoints (`/api/v3/contracts` & `/api/v3/purchase-orders`).",
                "6. Frontend UI renders operational contracts and POs with zero UI crashes or blank screens."
            ],
            "outcome": "🛡️ 100% demo and operational resilience. The portal never breaks even during enterprise ERP maintenance windows."
        },
        {
            "num": "Scenario 7",
            "title": "SAP Joule Natural Language Copilot AI Interaction",
            "actors": "Company Admin / Transporter via SAP Joule Digital Assistant (`joule/` capability)",
            "trigger": "User interacts with Joule AI Copilot using natural language text prompts.",
            "workflow": [
                "1. Company Admin prompts: 'Show me all open exception approvals for Ikwezi Mining.'",
                "2. Joule executes intent `ca_review_queue.yaml`, calls function `get_review_queue.yaml`, and returns structured table of blocked PODs.",
                "3. Admin prompts: 'Approve exception on assignment #42 with note: Weight loss verified due to rain evaporation.'",
                "4. Joule triggers function `resolve_review_queue.yaml`, sets status to RESOLVED, and unblocks MIRO posting.",
                "5. Transporter prompts: 'What is my pending payout for PO 4500001801?'",
                "6. Joule runs `get_invoices.yaml` and calculates approved delivered tonnage * freight rate in real time."
            ],
            "outcome": "🤖 Next-generation AI conversational logistics. Eliminates complex menu navigation for executive decision-makers."
        },
        {
            "num": "Scenario 8",
            "title": "Demonstration Reset & Clean State Replay (`POST /api/v3/demo/reset`)",
            "actors": "Demo Presenter / Company Admin Thandiwe",
            "trigger": "Presenter completes an end-to-end customer demo and needs to reset the environment for the next presentation.",
            "workflow": [
                "1. Presenter clicks 'Reset Demo State' in Admin Dashboard or issues `POST /api/v3/demo/reset`.",
                "2. Backend opens an isolated SQLite transaction and disables foreign keys temporarily (`PRAGMA foreign_keys = OFF`).",
                "3. Operational execution tables are truncated: `weight_logs`, `transport_assignments`, `pod_documents`, `review_queue`, `delivery_invoices`, `miro_invoices`.",
                "4. Real SAP S21 Master Data is preserved: `contracts` and `purchase_orders` remain 100% intact.",
                "5. All PO statuses reset to `'OPEN'`, demo reset audit record logged, foreign keys re-enabled.",
                "6. Presenter refreshes UI to a pristine, clean demonstration state in under 500 milliseconds."
            ],
            "outcome": "🔄 Frictionless demo repeatability without data corruption or manual database re-seeding."
        }
    ]

    for sc in scenarios:
        add_heading_2(f"5.{sc['num'].split()[1]}: {sc['title']}")
        
        # Scenario metadata box
        tbl = doc.add_table(rows=3, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        set_table_borders(tbl)
        
        s_widths = [Inches(1.5), Inches(5.4)]
        s_meta = [
            ("Primary Actors", sc["actors"]),
            ("Trigger Condition", sc["trigger"]),
            ("Operational Outcome", sc["outcome"])
        ]
        
        for idx, (k, v) in enumerate(s_meta):
            row = tbl.rows[idx]
            c0, c1 = row.cells[0], row.cells[1]
            c0.width, c1.width = s_widths[0], s_widths[1]
            set_cell_bg(c0, LIGHT_BG_HEX)
            set_cell_bg(c1, "FFFFFF")
            set_cell_margins(c0, 60, 60, 80, 80)
            set_cell_margins(c1, 60, 60, 80, 80)
            
            p0 = c0.paragraphs[0]
            p0.paragraph_format.space_after = Pt(0)
            r0 = p0.add_run(k)
            r0.bold = True
            r0.font.size = Pt(8.5)
            
            p1 = c1.paragraphs[0]
            p1.paragraph_format.space_after = Pt(0)
            r1 = p1.add_run(v)
            r1.font.size = Pt(8.5)
            if k == "Operational Outcome":
                r1.bold = True

        p_wf_label = doc.add_paragraph()
        p_wf_label.paragraph_format.space_before = Pt(4)
        p_wf_label.paragraph_format.space_after = Pt(2)
        r_wf = p_wf_label.add_run("Step-by-Step Execution Trace:")
        r_wf.bold = True
        r_wf.font.size = Pt(9.5)
        r_wf.font.color.rgb = COLOR_NAVY

        for step in sc["workflow"]:
            p_step = doc.add_paragraph()
            p_step.paragraph_format.left_indent = Inches(0.2)
            p_step.paragraph_format.space_before = Pt(0)
            p_step.paragraph_format.space_after = Pt(2)
            r_step = p_step.add_run(step)
            r_step.font.size = Pt(8.8)

        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # ─── SECTION 6: COMPLETE DATABASE SCHEMA REFERENCE ────────────────────────
    add_heading_1("6. Database Schema Reference (SQLite V3)")
    
    p = doc.add_paragraph(
        "The PODZO V3 architecture stores all operational execution entities in SQLite (`podzo_portal_v3.db`). "
        "The relational schema enforces strict foreign key constraints and domain-specific state transitions:"
    )

    schema_tbl = doc.add_table(rows=9, cols=3)
    schema_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    schema_tbl.autofit = False
    set_table_borders(schema_tbl)

    sc_widths = [Inches(1.8), Inches(2.3), Inches(2.8)]
    sc_headers = ["Table Name", "Key Columns & Types", "Business Purpose & Relationships"]

    for j, h in enumerate(sc_headers):
        c = schema_tbl.rows[0].cells[j]
        c.width = sc_widths[j]
        set_cell_bg(c, NAVY_HEX)
        set_cell_margins(c, 100, 100, 80, 80)
        p = c.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    schema_rows = [
        ("contracts", "id, sap_contract_no, customer_id, start_date, end_date, status", "Preserved SAP master outline agreements and customer purchase agreements."),
        ("purchase_orders", "id, contract_id, sap_po_no, material, target_qty, rate, tolerance_pct", "Preserved SAP transport PO line items with contractual freight rates and tolerance %."),
        ("transport_assignments", "id, job_config_id, driver_id, vehicle_id, scheduled_date, status", "Operational execution entity tracking truck trip from ASSIGNED to CLEARED."),
        ("weight_logs", "id, assignment_id, stage, weight_kg, logged_at", "Quad-gate weighbridge logs: MINE_TARE, MINE_GROSS, DEST_GROSS, DEST_TARE."),
        ("pod_documents", "id, assignment_id, pod_file_url, ocr_waybill, ocr_weight, match_status", "Scanned delivery slips with extracted OCR fields, match flags, and confidence scores."),
        ("review_queue", "id, assignment_id, flag_reason, status, resolved_by_user_id, blocks_miro_bool", "Gatekeeper table intercepting weight tolerance breaches and OCR mismatches."),
        ("delivery_invoices", "id, assignment_id, invoice_no, total_amount, status", "Freight invoices calculated automatically from Net Delivered Tons * PO Rate."),
        ("miro_invoices", "id, delivery_invoice_id, sap_doc_no, miro_status (PARKED/POSTED/CLEARED)", "SAP invoice parking and automated payment clearing ledger.")
    ]

    for i, s_data in enumerate(schema_rows, start=1):
        row = schema_tbl.rows[i]
        for j, text in enumerate(s_data):
            c = row.cells[j]
            c.width = sc_widths[j]
            set_cell_bg(c, LIGHT_BG_HEX if j == 0 else "FFFFFF")
            set_cell_margins(c, 70, 70, 80, 80)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(text)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ─── SECTION 7: API ENDPOINT DIRECTORY ───────────────────────────────────
    add_heading_1("7. REST API Endpoint Directory (/api/v3)")

    api_tbl = doc.add_table(rows=11, cols=4)
    api_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    api_tbl.autofit = False
    set_table_borders(api_tbl)

    a_widths = [Inches(0.9), Inches(2.2), Inches(0.9), Inches(2.9)]
    a_headers = ["Method", "Endpoint Route", "Auth / Role", "Description & Payload"]

    for j, h in enumerate(a_headers):
        c = api_tbl.rows[0].cells[j]
        c.width = a_widths[j]
        set_cell_bg(c, NAVY_HEX)
        set_cell_margins(c, 100, 100, 80, 80)
        p = c.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    api_rows = [
        ("POST", "/api/v3/auth/login", "Public", "Authenticates user, returns JWT token and user profile with role."),
        ("GET", "/api/v3/contracts", "JWT (All)", "Fetches active customer contracts from SAP / SQLite cache."),
        ("GET", "/api/v3/purchase-orders", "JWT (All)", "Fetches transport POs with target quantities, rates, and tolerance %."),
        ("POST", "/api/v3/assignments", "JWT (TA)", "Creates job configuration and assigns specific driver and vehicle."),
        ("POST", "/api/v3/weighbridge/log", "JWT (SR, CR)", "Records weighbridge weight for stage (MINE_TARE/GROSS, DEST_GROSS/TARE)."),
        ("POST", "/api/v3/pod/upload", "JWT (DR, TA)", "Uploads scanned POD file (multipart/form-data) and runs OCR match."),
        ("GET", "/api/v3/review-queue", "JWT (CA, SR)", "Lists open blocking review queue exceptions requiring audit."),
        ("POST", "/api/v3/review-queue/:id/resolve", "JWT (CA)", "Approves or overrides review queue exception, unblocking MIRO."),
        ("POST", "/api/v3/invoices/generate", "JWT (TA, CA)", "Calculates and generates freight invoice for delivered payload."),
        ("POST", "/api/v3/demo/reset", "JWT (CA)", "Executes transactional demo reset, clearing operational logs while keeping S21 master data.")
    ]

    for i, a_data in enumerate(api_rows, start=1):
        row = api_tbl.rows[i]
        for j, text in enumerate(a_data):
            c = row.cells[j]
            c.width = a_widths[j]
            set_cell_bg(c, LIGHT_BG_HEX if j == 0 else "FFFFFF")
            set_cell_margins(c, 60, 60, 80, 80)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(text)
            r.font.size = Pt(8.5)
            if j == 0:
                r.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # ─── CONCLUSION / SIGN OFF ────────────────────────────────────────────────
    add_heading_1("8. Summary & Business Impact")
    p_sum = doc.add_paragraph(
        "By uniting SAP S/4HANA financial master data, quad-gate physical weighbridge telemetry, driver mobile e-signatures, "
        "and automated OCR document verification, PODZO transforms industrial logistics from a 90-day paper chase into a zero-leakage, "
        "real-time automated execution pipeline. Carrier settlement is accelerated by 90%, cargo pilferage is instantly intercepted at destination gates, "
        "and corporate finance teams enjoy 100% audit-proof 3-way matching before a single cent is disbursed."
    )
    p_sum.paragraph_format.space_after = Pt(12)

    # Save to path
    doc.save(output_path)
    print(f"[SUCCESS] Document successfully generated at: {output_path}")

if __name__ == "__main__":
    out_dir = r"C:\Users\Varad\Downloads"
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "PODZO_Project_Overview_and_Scenarios_Detail.docx")
    create_styled_document(out_file)
