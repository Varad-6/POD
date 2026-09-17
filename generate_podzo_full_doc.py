import os
import sys
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def generate_podzo_full_document(target_files):
    doc = docx.Document()
    
    # Page setup - matching reference doc margins
    sec = doc.sections[0]
    sec.top_margin = Pt(46.8)
    sec.bottom_margin = Pt(46.8)
    sec.left_margin = Pt(51.85)
    sec.right_margin = Pt(51.85)
    
    # Styles
    styles = doc.styles
    normal_style = styles['Normal']
    normal_font = normal_style.font
    normal_font.name = 'Aptos'
    normal_font.size = Pt(10)
    normal_font.color.rgb = RGBColor(0x26, 0x26, 0x26)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(3)
    normal_style.paragraph_format.space_before = Pt(0)
    
    h1_style = styles['Heading 1']
    h1_font = h1_style.font
    h1_font.name = 'Aptos Display'
    h1_font.size = Pt(14)
    h1_font.bold = True
    h1_font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
    h1_style.paragraph_format.space_before = Pt(14)
    h1_style.paragraph_format.space_after = Pt(4)
    h1_style.paragraph_format.keep_with_next = True
    
    h2_style = styles['Heading 2']
    h2_font = h2_style.font
    h2_font.name = 'Aptos Display'
    h2_font.size = Pt(12.5)
    h2_font.bold = True
    h2_font.color.rgb = RGBColor(0x33, 0x33, 0x33)
    h2_style.paragraph_format.space_before = Pt(10)
    h2_style.paragraph_format.space_after = Pt(3)
    h2_style.paragraph_format.keep_with_next = True

    h3_style = styles['Heading 3']
    h3_font = h3_style.font
    h3_font.name = 'Aptos'
    h3_font.size = Pt(11)
    h3_font.bold = True
    h3_font.color.rgb = RGBColor(0x4F, 0x81, 0xBD)
    h3_style.paragraph_format.space_before = Pt(8)
    h3_style.paragraph_format.space_after = Pt(2)
    h3_style.paragraph_format.keep_with_next = True

    # XML Helper Functions
    def set_cell_shading(cell, color_hex):
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shd)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
            node = OxmlElement(m)
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    def set_table_borders(table, color="D1D5DB"):
        tblPr = table._tbl.tblPr
        tblBorders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'  <w:top w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
            f'  <w:left w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
            f'  <w:bottom w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
            f'  <w:right w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
            f'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
            f'  <w:insideV w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(tblBorders)

    def add_callout(text, prefix="Important: ", border_color="1F4E79", bg_color="F2F5F9"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        cell = tbl.cell(0, 0)
        cell.width = Inches(7.1)
        set_cell_shading(cell, bg_color)
        set_cell_margins(cell, top=110, bottom=110, left=160, right=160)
        
        tcPr = cell._tc.get_or_add_tcPr()
        tcBorders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
            f'  <w:top w:val="none"/>'
            f'  <w:bottom w:val="none"/>'
            f'  <w:right w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(tcBorders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        run_pfx = p.add_run(prefix)
        run_pfx.bold = True
        run_pfx.font.name = 'Aptos'
        run_pfx.font.size = Pt(9.5)
        run_pfx.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
        
        run_txt = p.add_run(text)
        run_txt.font.name = 'Aptos'
        run_txt.font.size = Pt(9.5)
        run_txt.font.color.rgb = RGBColor(0x26, 0x26, 0x26)
        doc.add_paragraph()

    def add_code_block(code_text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        cell = tbl.cell(0, 0)
        cell.width = Inches(7.1)
        set_cell_shading(cell, "F8F9FA")
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        
        tcPr = cell._tc.get_or_add_tcPr()
        tcBorders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'  <w:left w:val="single" w:sz="12" w:space="0" w:color="CBD5E1"/>'
            f'  <w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'  <w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'  <w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(tcBorders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(code_text)
        run.font.name = 'Consolas'
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        doc.add_paragraph()

    def format_table(col_widths, headers, rows_data):
        tbl = doc.add_table(rows=1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl, "CBD5E1")
        
        hdr_cells = tbl.rows[0].cells
        for i, title in enumerate(headers):
            hdr_cells[i].text = title
            hdr_cells[i].width = col_widths[i]
            set_cell_shading(hdr_cells[i], "1F4E79")
            set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
            p = hdr_cells[i].paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            if p.runs:
                p.runs[0].font.name = 'Aptos'
                p.runs[0].font.size = Pt(9.5)
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            
        for r_idx, row_values in enumerate(rows_data):
            row = tbl.add_row()
            bg_color = "F9FAFB" if (r_idx % 2 == 1) else "FFFFFF"
            for c_idx, val in enumerate(row_values):
                cell = row.cells[c_idx]
                cell.text = str(val)
                cell.width = col_widths[c_idx]
                set_cell_shading(cell, bg_color)
                set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(1.5)
                p.paragraph_format.space_after = Pt(1.5)
                p.paragraph_format.line_spacing = 1.1
                if p.runs:
                    p.runs[0].font.name = 'Aptos'
                    p.runs[0].font.size = Pt(9)
                    p.runs[0].font.color.rgb = RGBColor(0x26, 0x26, 0x26)
        doc.add_paragraph()

    # ══════════════════════════════════════════════════════════════════
    # COVER / HEADER
    # ══════════════════════════════════════════════════════════════════
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(10)
    p_title.paragraph_format.space_after = Pt(2)
    r = p_title.add_run("PODZO — Transporter Portal")
    r.font.name = 'Aptos Display'
    r.font.size = Pt(26)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x17, 0x36, 0x5D)

    p_doc = doc.add_paragraph()
    p_doc.paragraph_format.space_before = Pt(0)
    p_doc.paragraph_format.space_after = Pt(6)
    r = p_doc.add_run("Product Documentation")
    r.font.name = 'Aptos Display'
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(12)
    r = p_sub.add_run('"Real-Time Bulk Transport Execution, Quad-Gate Weighbridge Reconciliation, OCR-Assisted POD Validation, and SAP S/4HANA Clean Core Integration"')
    r.font.name = 'Aptos'
    r.font.size = Pt(11)
    r.font.italic = True
    r.font.color.rgb = RGBColor(0x59, 0x59, 0x59)

    meta_items = [
        ("Prepared by:", "Ali · Abhiyanta India Solutions Pvt. Ltd."),
        ("Target Client / Industry:", "Ikwezi Mining Limited / Industrial Bulk Minerals & Logistics"),
        ("Platform:", "Node.js Express v3 REST Backend, Vite React 19 Frontend & SAP Business Technology Platform (BTP)"),
        ("Target System:", "SAP S/4HANA (On-Premise / S21 Gateway / Cloud BTP Destination)"),
        ("Date:", "September 2026"),
        ("Document Version:", "v3.0.0 (Full Integration & Product Blueprint)")
    ]
    for label, val in meta_items:
        p_m = doc.add_paragraph()
        p_m.paragraph_format.space_before = Pt(0)
        p_m.paragraph_format.space_after = Pt(2)
        r_lbl = p_m.add_run(f"{label} ")
        r_lbl.font.bold = True
        r_lbl.font.size = Pt(9.5)
        r_lbl.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
        r_val = p_m.add_run(val)
        r_val.font.size = Pt(9.5)

    doc.add_paragraph() # Spacing

    # ══════════════════════════════════════════════════════════════════
    # 1. OVERVIEW
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("1. Overview", level=1)
    doc.add_paragraph(
        "PODZO is an enterprise-grade, cloud-native logistics execution and Proof-of-Delivery (POD) verification platform designed "
        "specifically for industrial bulk haulage, mining transport logistics (such as coal, aggregates, and heavy mineral ores), "
        "and multi-carrier fleet operations. The solution acts as a specialized side-by-side extension operating in concert with "
        "SAP S/4HANA (including SAP S21 and S/4HANA Public/Private Cloud), serving as the authoritative operational execution ledger "
        "while keeping SAP as the undisputed financial and contractual System of Record (SoR)."
    )
    doc.add_paragraph(
        "In traditional bulk haulage operations, severe financial leakage, operational friction, and invoice processing delays "
        "(often taking 30 to 90 days from dispatch to payment settlement) plague supply chain stakeholders. These inefficiencies "
        "stem from paper-based delivery receipts, unverified weight variances between mine siding dispatch and customer receiving gates, "
        "manual data entry mistakes, and delayed supplier invoice submissions in SAP MIRO. PODZO directly resolves these systemic "
        "challenges by digitizing the end-to-end transport lifecycle—from SAP Purchase Order (PO) distribution, driver digital e-signing, "
        "quad-gate weighbridge logging (two gates at the mine, two gates at destination), and automated Optical Character Recognition (OCR) "
        "paperwork verification, to rule-based invoice generation and automated SAP MIRO parking."
    )
    doc.add_paragraph(
        "The current production objective is to ensure seamless alignment with Clean Core architectural principles: business master data "
        "(Outline Agreements, Purchase Orders, Rate Conditions, and Vendor details) originates authoritatively from SAP, while operational "
        "activities (driver dispatch, vehicle pairing, weighbridge tare/gross recording, OCR discrepancy audits, and freight invoice calculations) "
        "occur within PODZO. Validated, audited deliverables and MIRO invoices are subsequently posted back to SAP through certified OData/BAPI interfaces."
    )

    doc.add_heading("1.1 Key Highlights", level=2)
    highlights = [
        ("Clean Core Architecture: ", "Custom logistics and document processing logic is maintained strictly outside the SAP S/4HANA core, communicating exclusively through released OData services, standard BAPIs, and SAP BTP integration boundaries."),
        ("Real SAP Master Data: ", "Outline Agreements (Contracts via ME33K) and Transport Purchase Orders (via ME23N) are retrieved directly from the connected SAP S/4HANA ERP instance, ensuring unified financial master data."),
        ("Bi-Directional Synchronization: ", "Application-originated execution milestones (driver PO acceptance, weighbridge certificates, verified POD attachments) flow toward SAP; SAP contract rate updates and PO allocations are synchronized back to the portal."),
        ("Quad-Gate Weighbridge Reconciliation: ", "A rigorous four-point weighbridge audit measures empty tare and loaded gross weights at both the mine siding gate and customer receiving plant, calculating exact net delivered payloads and identifying transit loss or pilferage."),
        ("OCR Verification Gate: ", "Uploaded delivery slips and weighbridge waybills undergo automated Optical Character Recognition to extract waybill numbers, stamped weights, vehicle registrations, and issuing dates, matching them against digital ledger entries."),
        ("Automated Review Queue & Exception Management: ", "Discrepancies exceeding defined tolerance thresholds (e.g., > 0.5% weight variance) or low OCR confidence (< 80%) are automatically intercepted into a review queue, preventing erroneous or fraudulent invoice parking."),
        ("Formula-Driven Freight Billing & MIRO Automation: ", "Calculates payable freight amounts based strictly on verified delivered net payloads and contractual SAP PO rates, generating delivery invoices and initiating automated MIRO parking in SAP."),
        ("Multi-Persona Role-Based Access Control: ", "Strict separation of duties across 5 operational personas (Company Admin, Transporter Admin, Driver, Siding Supervisor, Customer Receiver) secured by JWT authentication and granular route guards."),
        ("Audit-Friendly Operations & Transactional Reset: ", "Maintains an immutable historical record of weight logs, OTP validations, and supervisor timestamps, supported by a deterministic demo reset facility that preserves SAP master data while wiping runtime demo transients.")
    ]
    for pfx, body in highlights:
        p = doc.add_paragraph()
        r_b = p.add_run(pfx)
        r_b.bold = True
        r_b.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
        p.add_run(body)

    # ══════════════════════════════════════════════════════════════════
    # 2. FUNCTIONAL MODULES
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("2. Functional Modules", level=1)
    doc.add_paragraph(
        "The PODZO solution is partitioned into modular, cohesive functional blocks aligned with the end-to-end transport and "
        "delivery lifecycle, bridging physical shop-floor logistics with enterprise ERP accounting."
    )

    modules = [
        ("2.1 Multi-Persona Executive Dashboards",
         "Provides tailored operational workspaces for all supply chain stakeholders. The Company Admin (Mine Manager) monitors global fleet tonnage, contract fulfillment rates, and pending exception queues. The Transporter Admin oversees assigned Purchase Orders, scheduled runs, and driver allocations. The Driver mobile console presents active trip assignments, GPS turn-by-turn checkpoints, and quick-action POD uploaders. Siding Supervisors and Customer Receivers access dedicated gate controllers for weighbridge calibration, credential inspections, and digital stamping."),
        ("2.2 Contract & Purchase Order Management",
         "Maintains synchronized visibility of SAP Outline Agreements and Transport Purchase Orders. Displays critical commercial terms including valid validity periods, target quantities (in Metric Tons), agreed freight rates per ton, material classifications (e.g., RB1 Washed Coal), cost center assignments, and contractual weight variance tolerance thresholds (typically 0.50%). Supports automated PO distribution to approved logistics vendors."),
        ("2.3 Job Configuration & Fleet Dispatch",
         "Enables transporter dispatchers to configure specific transport jobs against active PO line items. Facilitates precise pairing of licensed drivers, certified multi-axle mechanical vehicles, scheduled pickup dates, and Goods and Services Tax / Tax Identification numbers (GSTIN/VAT). Initiates pre-dispatch validation checks to ensure driver compliance prior to terminal gate access."),
        ("2.4 Quad-Gate Weighbridge Reconciliation",
         "The physical core of the fraud-prevention architecture. Enforces four distinct weighbridge weight capture stages across two physical locations: Gate 1 (Mine Tare - Empty Truck), Gate 2 (Mine Gross - Loaded Truck with Bilty issuance), Gate 3 (Destination Gross - Loaded Truck arrival), and Gate 4 (Destination Tare - Offloaded Truck departure). The engine calculates net mine dispatched weight, net delivered weight, absolute variance in kilograms, and percentage variance."),
        ("2.5 POD Document Upload & OCR Verification",
         "Enables drivers or transporter staff to upload digital images or PDF scans of physical delivery notes, customer-stamped POD slips, and weighbridge printouts. The integrated OCR engine automatically extracts Waybill numbers, net weights, and truck registration details, computing a statistical confidence score and matching extracted readings against system weighbridge logs."),
        ("2.6 Review Queue & Exception Management",
         "Acts as the operational firewall for the financial ledger. Any shipment exhibiting an OCR mismatch, low extraction confidence (< 80%), or a weight variance exceeding the contractual tolerance threshold is automatically intercepted into the Review Queue. Company Admins audit side-by-side document comparisons and weighbridge telemetry, recording resolution notes to either approve an override or reject and return the shipment."),
        ("2.7 Automated Freight Invoicing & SAP MIRO Parking",
         "Transforms verified delivery data into payable commercial invoices. Multiplies the accepted net delivered tonnage by the contractual SAP PO unit rate to compute total freight billings. Automatically generates delivery invoices, links them to consolidated main invoices, and executes automated MIRO parking in SAP S/4HANA, transitioning invoices through PARKED, POSTED, and CLEARED accounting states."),
        ("2.8 Integration & Synchronization Layer",
         "Provides continuous communication between the React presentation client, the Express Node.js application layer, and backend SAP S/4HANA gateways. Implements the TypeScript ISAPAdapter interface with real S21 OData communication, intelligent local database fallback, and connection diagnostics.")
    ]
    for mod_title, mod_desc in modules:
        doc.add_heading(mod_title, level=2)
        doc.add_paragraph(mod_desc)

    # ══════════════════════════════════════════════════════════════════
    # 3. OPERATIONAL DATA FLOW & STATE MACHINE
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("3. Operational Data Flow & State Machine", level=1)
    doc.add_paragraph(
        "A transport assignment within PODZO progresses through a strictly controlled 15-stage lifecycle state machine. "
        "Transitions are driven by physical events, weighbridge sensor inputs, cryptographic OTP tokens, and authorized user approvals. "
        "The system strictly forbids arbitrary status jumping or manual database tampering."
    )

    doc.add_heading("3.1 Business Operation Principle", level=2)
    add_callout(
        "A transport assignment status transition represents a legally and operationally binding real-world event. "
        "Transitions from MINE_GROSS_LOGGED to DISPATCHED require supervisor authorization and digital Bilty issuance. "
        "Transitions to APPROVED require either zero-variance OCR confirmation or formal Company Admin exception resolution. "
        "No invoice can be parked in SAP MIRO while a blocking exception remains open in the Review Queue.",
        prefix="Operational Principle: "
    )

    doc.add_paragraph(
        "The 15 operational states governing a transport assignment are:\n"
        "ASSIGNED ➔ GATE_DENIED (Terminal Exception) | MINE_TARE_LOGGED ➔ MINE_GROSS_LOGGED ➔ DISPATCHED ➔ "
        "EN_ROUTE ➔ ARRIVED ➔ DELIVERED ➔ POD_UPLOADED ➔ UNDER_REVIEW (Discrepancy / Exception) ➔ "
        "APPROVED ➔ INVOICED ➔ MIRO_PARKED ➔ MIRO_POSTED ➔ CLEARED."
    )

    # Table 1: Operational Flow & System Actions
    doc.add_paragraph("Table 1 summarizes the operational phases, actors, and system actions across the lifecycle:")
    headers_t1 = ["Phase / Step", "Primary Actor", "System Action & Validation Rules"]
    col_w_t1 = [Inches(1.8), Inches(1.5), Inches(3.8)]
    data_t1 = [
        ["1. Contract & PO Sync", "SAP S/4HANA / CA", "Sync active Outline Agreements (ME33K) and Transport POs (ME23N) into PODZO via OData GET. Preserved in database."],
        ["2. Job Configuration", "Transporter Admin", "TA selects open PO line item, configures job tonnage, and assigns specific Driver and Vehicle with license/GSTIN."],
        ["3. E-Sign & Acceptance", "Driver", "Driver inspects rate and route details, signing on the HTML5 signature canvas to formally accept consignment responsibility."],
        ["4. Mine Tare Check", "Siding Supervisor", "Empty truck arrives at Mine Siding Gate 1. Supervisor logs MINE_TARE weight (kg). Status: MINE_TARE_LOGGED."],
        ["5. Mine Gross & Bilty", "Siding Supervisor", "Loaded truck passes Mine Siding Gate 2. MINE_GROSS recorded. System calculates Net Mine Payload and generates digital Bilty (Waybill)."],
        ["6. Transit & Tracking", "Driver / GPS", "Consignment departs siding. Status: DISPATCHED ➔ EN_ROUTE. Driver logs pickup OTP; system computes transit distance & ETA."],
        ["7. Site Arrival", "Customer Receiver", "Truck reaches customer receiving facility. Geofence arrival logged; delivery OTP verified. Status: ARRIVED."],
        ["8. Dest Gross Check", "Customer Receiver", "Loaded truck weighed at Customer Gate 3. DEST_GROSS recorded. Status advances toward offloading."],
        ["9. Offload & Dest Tare", "Customer Receiver", "Truck empties consignment and is re-weighed at Customer Gate 4 (DEST_TARE). Status: DELIVERED. Customer issues physical stamped slip."],
        ["10. POD Upload & OCR", "Driver / TA", "Scanned delivery slip/waybill uploaded. OCR engine extracts Waybill No, Net Weight, and Truck Reg. Status: POD_UPLOADED."],
        ["11. Dual Reconciliation", "System Engine", "Calculates net delivered weight and percentage variance. Evaluates OCR match and tolerance limit (<= 0.50%). Auto-approves or flags."],
        ["12. Review Resolution", "Company Admin", "If flagged (OCR mismatch or tolerance breach), shipment routes to Review Queue (blocks MIRO). CA reviews side-by-side audit and approves/rejects."],
        ["13. Freight Invoicing", "Transporter Admin / CA", "System calculates freight billing (Delivered Tons x PO Rate). Generates delivery invoice in status SENT_TO_CA."],
        ["14. SAP MIRO Parking", "Company Admin", "CA executes invoice approval. System initiates automated MIRO parking in SAP S/4HANA. Status: MIRO_PARKED ➔ POSTED ➔ CLEARED."]
    ]
    format_table(col_w_t1, headers_t1, data_t1)

    # ══════════════════════════════════════════════════════════════════
    # 4. USER PERSONAS & ROLE-BASED ACCESS CONTROL (RBAC)
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("4. User Personas & Access Control", level=1)
    doc.add_paragraph(
        "To guarantee operational security, audit integrity, and regulatory compliance, PODZO enforces strict Role-Based Access Control (RBAC). "
        "User permissions are governed at both the frontend routing level and backend Express API gateway middleware. Hiding UI elements "
        "alone is considered insufficient; every mutating API endpoint validates JSON Web Tokens (JWT) and checks role privileges."
    )

    doc.add_heading("4.1 Separation of Duties", level=2)
    sod_points = [
        ("Transporter Admins and Drivers ", "cannot approve Review Queue exceptions, alter weighbridge logs, or execute SAP MIRO invoice parking."),
        ("Weighbridge Supervisors ", "are strictly confined to siding check-ins and Gate 1 / Gate 2 tare and gross logging. They cannot alter freight rates or reassign transport POs."),
        ("Customer Receivers ", "manage Gate 3 / Gate 4 weighment and delivery OTP confirmation, but cannot modify mine siding weights or approve billing overrides."),
        ("Company Admins ", "possess overarching governance privileges including Review Queue resolution, contract imports, invoice approval, and system demo reset execution.")
    ]
    for pfx, body in sod_points:
        p = doc.add_paragraph()
        r = p.add_run(f"• {pfx}")
        r.bold = True
        p.add_run(body)

    # Table 2: Personas & RBAC Matrix
    doc.add_paragraph("Table 2 outlines the persona matrix, operational scope, and system boundaries:")
    headers_t2 = ["Role Code", "Persona Name", "Primary Responsibilities", "System Privileges", "Operational Restrictions"]
    col_w_t2 = [Inches(0.8), Inches(1.4), Inches(1.8), Inches(1.6), Inches(1.5)]
    data_t2 = [
        ["CA", "Company Admin (Mine Logistics)", "Contract management, PO distribution, review queue audit, invoice posting, demo resets.", "Read/Write all contracts, POs, Review Queue, Invoices, Reset.", "Cannot forge driver physical signatures or bypass dual weighbridge logs."],
        ["TA", "Transporter Admin (Carrier)", "PO acceptance, fleet scheduling, driver/vehicle pairing, delivery tracking, billing.", "Create jobs, assign runs, upload PODs, view carrier invoices.", "Cannot modify contractual rates, resolve review queue, or post MIRO."],
        ["DR", "Truck Driver", "Trip execution, digital PO acceptance, pickup OTP, transit logging, POD scanning.", "Sign acceptance canvas, confirm checkpoints, upload POD slips.", "No administrative visibility; strictly restricted to assigned active run."],
        ["SR", "Siding Supervisor", "Mine siding tare & gross weight recording, driver credential check, Bilty issue.", "Log Gate 1 (Tare) and Gate 2 (Gross), approve dispatch.", "Cannot alter customer destination weights, view rates, or approve invoices."],
        ["CR", "Customer Receiver", "Receiving tare & gross logging, delivery OTP validation, stamped POD issuing.", "Log Gate 3 (Gross) and Gate 4 (Tare), issue delivery confirmation.", "Cannot alter mine siding weights, change freight PO terms, or access MIRO."]
    ]
    format_table(col_w_t2, headers_t2, data_t2)

    # Table 2B: Demo Accounts & Credentials
    doc.add_paragraph("Table 3 lists pre-configured demonstration accounts and credentials provisioned in seed_v3.sql:")
    headers_t2b = ["Role", "Username", "Password", "Representative Entity", "Associated Scope"]
    col_w_t2b = [Inches(0.8), Inches(1.4), Inches(1.3), Inches(1.8), Inches(1.8)]
    data_t2b = [
        ["CA", "ca_thandiwe", "Demo@1234", "Ikwezi Mining Logistics", "Mine Siding Operations & Commercial Finance"],
        ["TA", "ta_sipho", "Demo@1234", "Sipho Transport Services", "Primary Fleet Logistics Vendor (Transporter #1)"],
        ["DR", "dr_zweli", "Demo@1234", "Sipho Transport Logistics", "Active Assigned Driver (Volvo Heavy Hauler)"],
        ["SR", "sr_gate01", "Demo@1234", "Klipbank Weighbridge Gate 01", "Mine Outload Weighbridge Checkpoint"],
        ["CR", "cr_mining", "Demo@1234", "Eskom Majuba Power Station", "Destination Coal Intake Terminal"]
    ]
    format_table(col_w_t2b, headers_t2b, data_t2b)

    # ══════════════════════════════════════════════════════════════════
    # 5. INTEGRATION INTERFACES & PAYLOAD SCHEMA
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("5. Integration Interfaces & Payload Schema", level=1)
    doc.add_paragraph(
        "All business data exchanges between the React client, Express API gateway, and SAP S/4HANA are governed by strict "
        "JSON payload schemas and REST/OData interface contracts. Real-world parameters and ERP data types are honored."
    )

    doc.add_heading("5.1 Authoritative Read Interfaces (SAP S/4HANA OData)", level=2)
    doc.add_paragraph("Example response from SAP OData Contract Service (/ZPOD_CONTRACTS_SRV/ContractSet):")
    add_code_block(
        '{\n'
        '  "d": {\n'
        '    "results": [\n'
        '      {\n'
        '        "ContractNumber": "4600001001",\n'
        '        "CustomerName": "Eskom Majuba Power Station",\n'
        '        "QualityType": "RB1 Washed Coal 0-40mm",\n'
        '        "TargetQuantity": "250000.00",\n'
        '        "Uom": "TO",\n'
        '        "Rate": "145.50",\n'
        '        "NetValue": "36375000.00",\n'
        '        "ValidFrom": "2026-01-01T00:00:00",\n'
        '        "ValidTo": "2026-12-31T23:59:59",\n'
        '        "Status": "ACTIVE"\n'
        '      }\n'
        '    ]\n'
        '  }\n'
        '}'
    )

    doc.add_paragraph("Example response from SAP OData Purchase Order Service (/ZPOD_PURCHASE_ORDERS_SRV/PurchaseOrderSet):")
    add_code_block(
        '{\n'
        '  "d": {\n'
        '    "results": [\n'
        '      {\n'
        '        "PurchaseOrderNo": "4500019201",\n'
        '        "ContractRef": "4600001001",\n'
        '        "Material": "COAL-RB1-EXP",\n'
        '        "TargetQuantity": "5000.00",\n'
        '        "Uom": "TO",\n'
        '        "Rate": "145.50",\n'
        '        "TolerancePercentage": "0.50",\n'
        '        "CostCenter": "CC-LOG-04",\n'
        '        "Status": "OPEN"\n'
        '      }\n'
        '    ]\n'
        '  }\n'
        '}'
    )

    doc.add_heading("5.2 Execution Payloads (PODZO V3 REST APIs)", level=2)
    doc.add_paragraph("Weighbridge Checkpoint Submission Payload (POST /api/v3/weighbridge/log):")
    add_code_block(
        '{\n'
        '  "assignmentId": 12,\n'
        '  "stage": "MINE_GROSS",\n'
        '  "weightKg": 48250.00,\n'
        '  "scaleId": "WB-MINE-NORTH-02",\n'
        '  "operatorNotes": "Driver present, seal #SL-88491 intact"\n'
        '}'
    )

    doc.add_paragraph("POD Upload & OCR Verification Result Payload (POST /api/v3/pod/upload):")
    add_code_block(
        '{\n'
        '  "assignmentId": 12,\n'
        '  "podFileUrl": "/uploads/pod_doc_12_wb998821.jpg",\n'
        '  "ocrExtracted": {\n'
        '    "waybillNo": "WB-998821",\n'
        '    "netDeliveredWeightTons": 34.82,\n'
        '    "truckReg": "JV-88-GP",\n'
        '    "deliveryDate": "2026-08-22",\n'
        '    "confidencePercentage": 98.4,\n'
        '    "matchStatus": "MATCH"\n'
        '  },\n'
        '  "systemReconciliation": {\n'
        '    "netMineWeightTons": 34.85,\n'
        '    "netDeliveredWeightTons": 34.82,\n'
        '    "varianceKg": 30.00,\n'
        '    "variancePct": 0.086,\n'
        '    "toleranceThresholdPct": 0.50,\n'
        '    "withinTolerance": true,\n'
        '    "action": "AUTO_APPROVED"\n'
        '  }\n'
        '}'
    )

    # ══════════════════════════════════════════════════════════════════
    # 6. REAL-TIME & EVENT-DRIVEN SYNCHRONIZATION
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("6. Real-Time & Event-Driven Synchronization", level=1)
    doc.add_paragraph(
        "The target architecture establishes bi-directional data flow between the React presentation client, the Node.js backend, "
        "and SAP S/4HANA. Operational status updates, weighbridge records, and OCR verifications are propagated in real time."
    )

    doc.add_heading("6.1 Bi-Directional Architecture", level=2)
    doc.add_paragraph(
        "• SAP ➔ PODZO (Master Ingestion): Master Outline Agreements and Purchase Orders are synchronized via OData HTTP clients "
        "(implemented in S21SAPAdapter.ts). In production BTP deployments, SAP Event Mesh (sap/s4/beh/purchaseorder/v1/Created) "
        "notifies PODZO instantly when new transport POs are released in SAP.\n"
        "• PODZO ➔ SAP (Execution Confirmation): Once POD verification and Company Admin approvals are finalized, PODZO invokes "
        "BAPI_INCOMINGINVOICE_CREATE or the OData Supplier Invoice API to park the MIRO invoice against the purchase order, "
        "subsequently updating payment clearance states upon SAP financial clearing runs."
    )

    doc.add_heading("6.2 Synchronization & Data Integrity Rules", level=2)
    sync_rules = [
        "1. No Unverified Local Status Faking: A transport assignment cannot be marked as MIRO_PARKED without an authoritative SAP document confirmation number.",
        "2. Idempotent Weighbridge Logging: Weighbridge events are write-once, append-only records with unique composite indexes preventing duplicate stage logs.",
        "3. Offline Resilience & Adapter Fallback: If network interruption severs connection to the live SAP S/4HANA Gateway, S21SAPAdapter falls back gracefully to local database snapshots, allowing continuous siding dispatch without operational downtime.",
        "4. Strict Review Queue Blocking: Any active item in the Review Queue sets blocks_miro_bool = 1, programmatically prohibiting invoice creation until formally resolved."
    ]
    for r in sync_rules:
        doc.add_paragraph(r)

    # ══════════════════════════════════════════════════════════════════
    # 7. QUAD-GATE WEIGHBRIDGE RECONCILIATION & TOLERANCE ENGINE
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("7. Quad-Gate Weighbridge Reconciliation", level=1)
    doc.add_paragraph(
        "Bulk commodity transport is inherently prone to material loss, moisture evaporation, weighbridge calibration drift, "
        "and potential cargo theft. PODZO's Quad-Gate Reconciliation Engine replaces standard single-receipt recording with a mathematically "
        "rigorous four-point verification protocol."
    )

    doc.add_heading("7.1 Mathematical Formulations", level=2)
    doc.add_paragraph("The reconciliation engine computes net payloads and relative variances according to standard industrial formulas:")
    
    math_p1 = doc.add_paragraph()
    math_p1.paragraph_format.left_indent = Inches(0.4)
    r = math_p1.add_run("Net Mine Dispatched Payload (kg):   ")
    r.bold = True
    math_p1.add_run("W_mine_net = W_mine_gross - W_mine_tare")
    
    math_p2 = doc.add_paragraph()
    math_p2.paragraph_format.left_indent = Inches(0.4)
    r = math_p2.add_run("Net Customer Delivered Payload (kg): ")
    r.bold = True
    math_p2.add_run("W_dest_net = W_dest_gross - W_dest_tare")

    math_p3 = doc.add_paragraph()
    math_p3.paragraph_format.left_indent = Inches(0.4)
    r = math_p3.add_run("Absolute Variance (kg):              ")
    r.bold = True
    math_p3.add_run("ΔW = |W_mine_net - W_dest_net|")

    math_p4 = doc.add_paragraph()
    math_p4.paragraph_format.left_indent = Inches(0.4)
    r = math_p4.add_run("Percentage Variance (%):             ")
    r.bold = True
    math_p4.add_run("Variance_Pct = (ΔW / W_mine_net) * 100")

    doc.add_paragraph(
        "Tolerance Condition: If Variance_Pct <= Tolerance_Pct (e.g., 0.50%), the shipment is classified as WITHIN_TOLERANCE. "
        "If Variance_Pct > Tolerance_Pct, the shipment is immediately classified as OUTSIDE_TOLERANCE and intercepted into the Review Queue "
        "with flag_reason = 'TOLERANCE_EXCEEDED'."
    )

    # Table 4: Quad-Gate Checkpoints
    doc.add_paragraph("Table 4 details the four physical weighbridge checkpoints and execution mechanics:")
    headers_t4 = ["Stage Code", "Gate Location", "Physical Operation", "System Verification & Output", "Tolerance Role"]
    col_w_t4 = [Inches(1.2), Inches(1.3), Inches(1.8), Inches(1.6), Inches(1.2)]
    data_t4 = [
        ["MINE_TARE", "Mine Siding Gate 1", "Empty truck drives onto inbound weighbridge.", "Captures base vehicle weight. Validates driver license & vehicle registration.", "Baseline Tare (Zero commodity)"],
        ["MINE_GROSS", "Mine Siding Gate 2", "Loaded truck drives onto outbound weighbridge.", "Calculates W_mine_net. Validates against legal gross axle limits. Issues Bilty slip.", "Authoritative Dispatch Net"],
        ["DEST_GROSS", "Customer Gate 3", "Loaded truck arrives at customer intake hopper.", "Verifies intact security seals & delivery OTP. Captures arriving gross weight.", "Arrival Gross Check"],
        ["DEST_TARE", "Customer Gate 4", "Empty truck re-weighed after hopper tipping.", "Calculates W_dest_net. Reconciles variance against W_mine_net. Issues stamped POD.", "Authoritative Delivered Net"]
    ]
    format_table(col_w_t4, headers_t4, data_t4)

    # ══════════════════════════════════════════════════════════════════
    # 8. OCR ENGINE & DOCUMENT VERIFICATION ARCHITECTURE
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("8. OCR Engine & Document Verification", level=1)
    doc.add_paragraph(
        "The Optical Character Recognition (OCR) subsystem automates the validation of paper delivery paperwork, stamping confirmations, "
        "and physical waybills. The pipeline extracts text, isolates critical data fields, and benchmarks them against the digital weighbridge ledger."
    )

    doc.add_heading("8.1 Extraction Pipeline & Field Verification", level=2)
    doc.add_paragraph(
        "The automated ingestion engine parses four mandatory business entities from uploaded documents:\n"
        "1. Waybill / Bilty Reference Number: Cross-referenced against transport_assignments.bilty_number.\n"
        "2. Net Stamped Weight: Compared against weight_logs calculated delivered net weight.\n"
        "3. Truck Registration Number: Validated against vehicles.plate_number.\n"
        "4. Delivery Timestamp & Stamp Quality: Checked for customer receiver digital or physical ink seal."
    )

    doc.add_heading("8.2 Automated Decision Matrix", level=2)
    doc.add_paragraph(
        "• Match Scenario (Green): Extracted waybill matches assignment; weight matches weighbridge within 0.10%; confidence >= 85%. ➔ AUTO-APPROVED.\n"
        "• Mismatch Scenario (Red): Extracted weight or waybill differs from digital record (e.g., ticket shows 31.50 tons vs system 34.82 tons). ➔ FLAGGED (OCR_MISMATCH).\n"
        "• Blurry / Degraded Document (Amber): Extraction confidence < 80% or ticket illegible due to poor camera capture. ➔ FLAGGED (AWAITING_CA_VERIFY)."
    )

    # Table 5: Test Asset & Demonstration Matrix
    doc.add_paragraph("Table 5 outlines test asset behaviors embedded in the prototype verification engine:")
    headers_t5 = ["Document File Name", "Demonstrated Scenario", "Extracted Waybill", "Extracted Weight", "Confidence", "Reconciliation Outcome"]
    col_w_t5 = [Inches(1.8), Inches(1.5), Inches(1.1), Inches(1.0), Inches(0.8), Inches(0.9)]
    data_t5 = [
        ["delivery-slip-match.jpg", "Clean Match (Perfect)", "WB-998821", "34.82 TO", "98.4%", "Auto-Approved"],
        ["delivery-slip-mismatch.jpg", "Weight Discrepancy", "WB-998821", "31.50 TO", "95.1%", "Flagged (Review Queue)"],
        ["delivery-slip-blurry.jpg", "Low Quality / Illegible", "UNKNOWN", "0.00 TO", "42.0%", "Flagged (Review Queue)"],
        ["tax-bill-sample.pdf", "Transporter Freight Invoice", "INV-2026-091", "R 5,066.31", "99.0%", "Processed to MIRO"]
    ]
    format_table(col_w_t5, headers_t5, data_t5)

    # ══════════════════════════════════════════════════════════════════
    # 9. SAP API & EVENT INTEGRATION ROADMAP
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("9. SAP API & Event Integration Roadmap", level=1)
    doc.add_paragraph(
        "PODZO is architected to interface seamlessly with standard SAP S/4HANA (On-Premise, S21, and Private/Public Cloud) "
        "via certified integration surfaces without requiring any modifications to the SAP core."
    )

    # Table 6: SAP Interfaces
    doc.add_paragraph("Table 6 details the planned SAP S/4HANA integration interfaces and standard ERP object mappings:")
    headers_t6 = ["Capability", "SAP Interface / BAPI", "ERP Object", "Direction", "Verification & Scope"]
    col_w_t6 = [Inches(1.4), Inches(1.8), Inches(1.1), Inches(0.9), Inches(1.9)]
    data_t6 = [
        ["Outline Agreements", "ZPOD_CONTRACTS_SRV / ContractSet", "EKKO / EKPO", "SAP ➔ PODZO", "Read active long-term bulk haulage contracts (ME33K)."],
        ["Transport POs", "ZPOD_PURCHASE_ORDERS_SRV / PurchaseOrderSet", "EKKO / EKPO", "SAP ➔ PODZO", "Read released transport freight purchase orders (ME23N)."],
        ["PO Acknowledgment", "ZPOD_PO_ACK_SRV / AcknowledgePOSet", "EKES / EKET", "PODZO ➔ SAP", "Post driver/carrier e-sign acceptance confirmation."],
        ["Goods Movement", "API_MATERIAL_DOCUMENT_SRV", "MSEG / MKPF", "PODZO ➔ SAP", "Post 101 Goods Receipt upon customer weighbridge confirmation."],
        ["MIRO Parking", "BAPI_INCOMINGINVOICE_CREATE / API_SUPPLIERINVOICE", "RBKP / RSEG", "PODZO ➔ SAP", "Create parked vendor invoice against PO lines and verified weight."],
        ["Payment Clearing", "API_OPERATIONAL_SUPPLIER_INVOICE", "BSIP / BSIK", "SAP ➔ PODZO", "Query payment clearing date and financial disbursement status."]
    ]
    format_table(col_w_t6, headers_t6, data_t6)

    # ══════════════════════════════════════════════════════════════════
    # 10. TECHNICAL ARCHITECTURE & DATABASE SPECIFICATION
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("10. Technical Architecture", level=1)
    doc.add_paragraph(
        "The PODZO platform utilizes a high-performance, modern technology stack combining Node.js, Express v5, SQLite v3 "
        "(via better-sqlite3), React 19, TypeScript, and Vite. The architecture emphasizes modularity, sub-second API latency, "
        "and offline demonstration portability."
    )

    doc.add_heading("10.1 System Topology", level=2)
    doc.add_paragraph(
        "• Presentation Layer (React 19 + TypeScript + Vite 8): Fully responsive single-page application incorporating Lucide icons, "
        "custom dark industrial styling, HTML5 canvas signature capture, and role-based route switching.\n"
        "• Integration & Business Logic Layer (Node.js Express 5.2.1): RESTful micro-router architecture mounted under /api/v3, "
        "handling JWT authentication, quad-gate calculation algorithms, OCR analysis, and adapter-based SAP communications.\n"
        "• Persistence Layer (SQLite 3 via better-sqlite3 13.0.3): Single-file, relational database engine (podzo_portal_v3.db) "
        "delivering ACID compliance, foreign key constraint enforcement, and zero-latency operational state queries."
    )

    doc.add_heading("10.2 Relational Database Schema Specification (V3)", level=2)
    doc.add_paragraph("Table 7 specifies the relational tables defining the V3 operational schema (server/db/schema_v3.sql):")
    headers_t7 = ["Table Name", "Primary Purpose", "Key Columns & Foreign Keys", "Storage Category"]
    col_w_t7 = [Inches(1.5), Inches(2.0), Inches(2.3), Inches(1.3)]
    data_t7 = [
        ["users", "System credentials and RBAC identities", "id, username, password_hash, role (CA, TA, DR, CR, SR), display_name", "Core Identity"],
        ["contracts", "SAP Outline Agreement master data", "id, sap_contract_no, customer_id, start_date, end_date, pdf_url, status", "Real SAP Data (Preserved)"],
        ["purchase_orders", "SAP Freight Purchase Orders", "id, contract_id, sap_po_no, material, target_qty, rate, tolerance_pct", "Real SAP Data (Preserved)"],
        ["job_configs", "Carrier job batch configurations", "id, po_id, transporter_id, target_tons, rate_per_ton, status", "Operational Execution"],
        ["transport_assignments", "Individual truck dispatch runs", "id, job_config_id, driver_id, vehicle_id, license_no, scheduled_date, status", "Operational Execution"],
        ["weight_logs", "Quad-gate weighbridge telemetry", "id, assignment_id, stage (MINE_TARE, MINE_GROSS, DEST_GROSS, DEST_TARE), weight_kg", "Operational Execution"],
        ["bilty_uploads", "Digital waybill document records", "id, assignment_id, bilty_no, file_url, tare_weight, gross_weight, uploaded_at", "Operational Execution"],
        ["pod_documents", "Customer-stamped POD slip & OCR", "id, assignment_id, pod_file_url, ocr_waybill, ocr_weight, ocr_confidence, match_status", "Operational Execution"],
        ["review_queue", "Discrepancy and exception queue", "id, assignment_id, flag_reason, status, resolved_by_user_id, blocks_miro_bool", "Operational Execution"],
        ["delivery_invoices", "Calculated freight delivery bills", "id, assignment_id, invoice_no, accepted_payload_tons, po_rate, total_amount", "Operational Execution"],
        ["miro_invoices", "SAP MIRO parking references", "id, delivery_invoice_id, sap_invoice_no, status (PARKED, POSTED, CLEARED)", "Financial Staging"]
    ]
    format_table(col_w_t7, headers_t7, data_t7)

    # ══════════════════════════════════════════════════════════════════
    # 11. SECURITY, AUTHORIZATION & CLEAN CORE
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("11. Security, Authorization & Clean Core", level=1)
    doc.add_paragraph(
        "PODZO adheres strictly to SAP Clean Core guidelines, zero-trust network principles, and modern web application security standards."
    )

    doc.add_heading("11.1 Security Boundary", level=2)
    doc.add_paragraph(
        "1. Token-Based Authentication: User login requests (/api/v3/auth/login) yield cryptographically signed JSON Web Tokens (JWT) "
        "containing user identity and role codes. Passwords are encrypted using bcryptjs with a work factor of 10.\n"
        "2. Zero Secrets in Client: SAP ERP master credentials, client IDs, and secret keys reside exclusively within backend environment "
        "configurations (.env) or SAP BTP Destination Service. Browser JavaScript bundles contain zero secrets.\n"
        "3. Route Middleware Enforcement: Every administrative and mutating endpoint is guarded by requireAuth and requireRole middleware, "
        "ensuring unauthorized role escalation is rejected at the HTTP gateway layer with 401 Unauthorized or 403 Forbidden."
    )

    # ══════════════════════════════════════════════════════════════════
    # 12. ERROR HANDLING & CONSISTENCY
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("12. Error Handling & Consistency", level=1)
    doc.add_paragraph(
        "Robust error normalization and resilient transaction handling ensure data integrity across unstable network environments."
    )

    # Table 8: Error Handling Matrix
    doc.add_paragraph("Table 8 specifies system responses to typical edge cases, communication failures, and operational exceptions:")
    headers_t8 = ["Condition / Error Code", "System Behavior & Operational Response", "Consistency Safeguard"]
    col_w_t8 = [Inches(1.8), Inches(3.2), Inches(2.1)]
    data_t8 = [
        ["400 Bad Request / Validation", "Rejects malformed weighbridge weights or negative quantities. Returns descriptive JSON error payload.", "Prevents invalid data entry."],
        ["401 / 403 Authentication Error", "Halts transaction immediately. Clears invalid browser session and redirects user to multi-persona login portal.", "Enforces zero unauthorized access."],
        ["Tolerance Exceeded (>0.5%)", "Weight discrepancy triggers automatic Review Queue flag. Blocks MIRO parking. Alerts Company Admin.", "Guarantees zero payment leakage."],
        ["OCR Low Confidence (<80%)", "Degraded image flagged for manual visual verification. Admin inspects uploaded document side-by-side.", "Prevents incorrect automated reading."],
        ["SAP Gateway Timeout / Down", "S21SAPAdapter falls back gracefully to local SQLite cache. Dispatches and weighments proceed uninterrupted.", "Ensures operational business continuity."],
        ["Demo Reset Invoked", "Wipes execution records inside SQLite transaction while strictly preserving contracts & POs. Restores clean state.", "Enforces deterministic demo testing."]
    ]
    format_table(col_w_t8, headers_t8, data_t8)

    # ══════════════════════════════════════════════════════════════════
    # 13. TESTING & ACCEPTANCE VERIFICATION
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("13. Testing & Acceptance Verification", level=1)
    doc.add_paragraph(
        "The PODZO codebase is validated through an extensive suite of automated and manual testing methodologies, "
        "including Playwright end-to-end integration tests (e2e_live_test.spec.ts) and automated audit runner scripts (audit_runner.js)."
    )

    doc.add_heading("13.1 Primary Walkthrough Scenarios", level=2)
    scenarios = [
        ("Scenario A — Clean Match Workflow (Happy Path): ", "Transporter accepts PO ➔ Driver draws e-signature ➔ Empty truck weighed at Mine Gate 1 ➔ Loaded truck weighed at Mine Gate 2 ➔ Transit logged ➔ Truck offloaded at Customer Gate 3/4 ➔ delivery-slip-match.jpg uploaded ➔ OCR confirms 34.82 tons (98.4% confidence) ➔ Variance 0.086% (within 0.5% tolerance) ➔ Auto-Approved ➔ Delivery invoice generated ➔ SAP MIRO invoice parked."),
        ("Scenario B — Weight Discrepancy & Review Queue Override: ", "Driver uploads delivery-slip-mismatch.jpg displaying 31.50 tons against recorded 34.82 tons. System flags OCR_MISMATCH, sets blocks_miro_bool = 1. Company Admin logs in, reviews side-by-side discrepancy modal, appends audit justification notes, and executes manual override, unblocking MIRO parking."),
        ("Scenario C — Blurry Document & Resolution: ", "Driver uploads delivery-slip-blurry.jpg. OCR confidence drops to 42%. System intercepts shipment into Review Queue with flag_reason = 'AWAITING_CA_VERIFY'. Admin inspects physical ticket image and verifies delivery manually.")
    ]
    for pfx, body in scenarios:
        p = doc.add_paragraph()
        r = p.add_run(pfx)
        r.bold = True
        p.add_run(body)

    # ══════════════════════════════════════════════════════════════════
    # 14. REQUIRED SAP BTP SERVICES — TECHNICAL BLUEPRINT
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("14. Required SAP BTP Services", level=1)
    doc.add_paragraph(
        "For enterprise enterprise deployment in a corporate SAP landscape, PODZO maps directly to the following SAP Business Technology Platform services:"
    )

    # Table 9: SAP BTP Services
    headers_t9 = ["#", "Service / Capability", "Technical Plan", "Target Architecture Purpose"]
    col_w_t9 = [Inches(0.5), Inches(2.2), Inches(1.8), Inches(2.6)]
    data_t9 = [
        ["1", "Authorization & Trust (XSUAA)", "application", "OAuth 2.0 corporate single sign-on, identity propagation, and role mappings."],
        ["2", "Destination Service", "lite / standard", "Secure credential storage and mutual TLS connectivity to SAP S/4HANA OData services."],
        ["3", "Cloud Foundry Runtime", "standard", "Managed container execution platform for the Node.js Express backend service."],
        ["4", "HTML5 Application Repository", "app-host", "Optimized static content delivery network hosting the compiled React Vite frontend."],
        ["5", "SAP Event Mesh", "default", "Event-driven pub/sub broker routing SAP purchase order creation events to PODZO in real time."],
        ["6", "SAP Build Work Zone", "standard", "Unified enterprise launchpad integrating the Transporter Portal into corporate Fiori portals."]
    ]
    format_table(col_w_t9, headers_t9, data_t9)

    # ══════════════════════════════════════════════════════════════════
    # 15. DEPLOYMENT & RUNTIME FLOW
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("15. Deployment & Runtime Flow", level=1)
    doc.add_paragraph(
        "The solution is configured for dual-mode deployment: lightweight standalone execution for on-premise demonstration, "
        "and Cloud Foundry Multi-Target Application (MTA) deployment for enterprise SAP BTP environments."
    )

    doc.add_heading("15.1 Cloud Foundry Manifest (manifest.yml)", level=2)
    doc.add_paragraph("Configuration for deploying PODZO backend services to SAP BTP Cloud Foundry:")
    add_code_block(
        'applications:\n'
        '  - name: podzo-portal-backend\n'
        '    memory: 512M\n'
        '    buildpacks:\n'
        '      - nodejs_buildpack\n'
        '    command: npm run server\n'
        '    env:\n'
        '      PORT: 8080\n'
        '      NODE_ENV: production\n'
        '      SAP_S21_BASE_URL: ((destinations.S21_GATEWAY.url))\n'
        '    services:\n'
        '      - podzo-xsuaa\n'
        '      - podzo-destination'
    )

    doc.add_heading("15.2 Local Standalone Execution", level=2)
    doc.add_paragraph("To run the complete full-stack environment locally:")
    doc.add_paragraph("1. Start Backend API Server (Express + SQLite):  npm run server  (Port 3001)")
    doc.add_paragraph("2. Start Frontend Dev Server (Vite + React):       npm run dev     (Port 5173)")
    doc.add_paragraph("3. Access Application via Web Browser:            http://localhost:5173/")

    # ══════════════════════════════════════════════════════════════════
    # 16. IMPLEMENTATION PHASES & ROADMAP
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("16. Implementation Phases", level=1)
    doc.add_paragraph(
        "The project follows a structured four-phase transition from initial prototype to certified enterprise production."
    )

    # Table 10: Roadmap
    headers_t10 = ["Phase", "Milestone Focus", "Key Deliverables", "Status"]
    col_w_t10 = [Inches(1.2), Inches(1.8), Inches(2.9), Inches(1.2)]
    data_t10 = [
        ["Phase 1", "Prototype & UX Design", "React click-through prototype, mock Excel database, initial CSS styling.", "Completed"],
        ["Phase 2", "V3 Engine & Full-Stack", "SQLite V3 database, 5-persona RBAC, Quad-Gate weighbridge, simulated OCR, Review Queue.", "Current Active"],
        ["Phase 3", "SAP OData & Cloud AI", "Live S/4HANA OData integration, AWS Textract / Google Doc AI OCR engine, SMS OTP gateway.", "Next Horizon"],
        ["Phase 4", "BTP Production Hardening", "BTP MTA deployment, XSUAA single sign-on, automated MIRO BAPI posting, load testing.", "Final Target"]
    ]
    format_table(col_w_t10, headers_t10, data_t10)

    # ══════════════════════════════════════════════════════════════════
    # 17. ASSUMPTIONS, DEPENDENCIES & RISKS
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("17. Assumptions, Dependencies & Risks", level=1)
    doc.add_paragraph(
        "The following operational assumptions, technical dependencies, and risk mitigation strategies govern the solution architecture:"
    )

    # Table 11: Risks
    headers_t11 = ["Identified Risk", "Impact Area", "Proactive Mitigation Strategy"]
    col_w_t11 = [Inches(1.8), Inches(1.5), Inches(3.8)]
    data_t11 = [
        ["Degraded Camera / Blurry PODs", "OCR Extraction", "Low-confidence extraction (<80%) automatically routes document to Review Queue for human audit."],
        ["Weighbridge Calibration Drift", "Dual Reconciliation", "Contractual tolerance limits (0.50%) accommodate natural moisture evaporation while flagging gross anomalies."],
        ["Unstable Mine Siding Internet", "Dispatch Operations", "Offline adapter fallback allows local weighbridge logging with deferred cloud synchronization."],
        ["Unauthorized Invoice Modification", "Financial Accounting", "Strict RBAC ensures only Company Admin can approve Review Queue overrides and post MIRO in SAP."]
    ]
    format_table(col_w_t11, headers_t11, data_t11)

    # ══════════════════════════════════════════════════════════════════
    # 18. FINAL ACCEPTANCE CRITERIA
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("18. Final Acceptance Criteria", level=1)
    doc.add_paragraph("The PODZO solution is certified production-ready upon satisfying the following verifiable criteria:")
    
    acceptance_criteria = [
        "1. Master Outline Agreements and Transport POs are ingested from SAP S/4HANA without requiring manual re-entry.",
        "2. All five user personas (CA, TA, DR, SR, CR) operate within cryptographically enforced role boundaries.",
        "3. Quad-Gate weighbridge telemetry accurately captures tare and gross weights at both mine siding and customer sites.",
        "4. Net payload variances exceeding contractual tolerance (0.50%) are reliably intercepted and block SAP MIRO parking.",
        "5. Uploaded POD documents undergo automated OCR processing, extracting Waybill and weight values with confidence scoring.",
        "6. Company Admins can inspect side-by-side audit comparisons and append resolution notes to resolve Review Queue items.",
        "7. Freight delivery invoices are calculated strictly as Accepted Delivered Tons x PO Freight Rate.",
        "8. Approved invoices successfully initiate automated MIRO parking in SAP S/4HANA.",
        "9. Transactional demo resets restore a pristine operational state while preserving SAP master contracts and POs.",
        "10. Zero SAP ERP credentials or sensitive secrets are exposed to the client-side web application."
    ]
    for ac in acceptance_criteria:
        doc.add_paragraph(ac)

    # ══════════════════════════════════════════════════════════════════
    # APPENDICES
    # ══════════════════════════════════════════════════════════════════
    doc.add_heading("Appendix A — Core Operational Workflow Summary", level=1)
    doc.add_paragraph(
        "SAP Contract / PO Ingestion ➔ Transporter PO Acceptance ➔ Driver Digital E-Signing ➔ "
        "Mine Tare Check (Gate 1) ➔ Mine Gross Check (Gate 2) ➔ Bilty Issuance ➔ In-Transit Tracking ➔ "
        "Customer Site Arrival ➔ Customer Gross Check (Gate 3) ➔ Offloading ➔ Customer Tare Check (Gate 4) ➔ "
        "Physical Stamped POD Issued ➔ Driver POD Upload ➔ OCR Extraction & Dual-Weight Reconciliation ➔ "
        "[Auto-Approved OR Flagged to Review Queue] ➔ Company Admin Exception Resolution ➔ "
        "Freight Delivery Invoice Calculation ➔ SAP MIRO Parking (PARKED ➔ POSTED ➔ CLEARED)."
    )

    doc.add_heading("Appendix B — Quad-Gate Weight Flow Summary", level=1)
    doc.add_paragraph(
        "Mine Siding (Outbound Siding):\n"
        "  • Gate 1: MINE_TARE (Empty Vehicle Tare Weight)\n"
        "  • Gate 2: MINE_GROSS (Loaded Vehicle Gross Weight)\n"
        "  • Dispatched Payload = MINE_GROSS - MINE_TARE\n\n"
        "Customer Receiving Facility (Inbound Terminal):\n"
        "  • Gate 3: DEST_GROSS (Arriving Loaded Vehicle Gross Weight)\n"
        "  • Gate 4: DEST_TARE (Departing Empty Vehicle Tare Weight)\n"
        "  • Delivered Payload = DEST_GROSS - DEST_TARE\n\n"
        "Reconciliation Metric: Variance % = (|Dispatched Payload - Delivered Payload| / Dispatched Payload) * 100\n"
        "Condition: Variance % <= Tolerance % (Default: 0.50%)."
    )

    doc.add_heading("Appendix C — OCR & Review Queue Resolution Sequence", level=1)
    doc.add_paragraph(
        "1. Upload POD Document (PDF/JPG/PNG) via Driver or Transporter portal.\n"
        "2. OCR Engine parses document text and identifies Waybill No, Net Weight, and Truck Reg.\n"
        "3. System executes two-tier validation: (a) OCR confidence score >= 80%, (b) Extracted weight vs weighbridge within tolerance.\n"
        "4. IF validation fails: System registers an entry in review_queue with blocks_miro_bool = 1. Assignment status sets to UNDER_REVIEW.\n"
        "5. Company Admin accesses Approvals queue, views side-by-side modal, verifies document against physical slip, inputs resolution notes, and clicks Approve.\n"
        "6. System updates review_queue.status = 'RESOLVED', unblocks MIRO, and transitions assignment status to APPROVED."
    )

    doc.add_heading("Appendix D — Document Basis, Scope & References", level=1)
    doc.add_paragraph(
        "This product documentation represents the single source of truth for the PODZO Transporter Portal. "
        "It consolidates and formalizes specifications derived directly from the audited codebase:\n"
        "• Repository Source Code: Varad-6/POD (C:\\projects\\POD)\n"
        "• Relational Database Schema: server/db/schema_v3.sql, server/db/database_v3.ts\n"
        "• REST Routing & Controllers: server/routes/api_v3.ts, server/routes/auth_v3.ts, server/index.ts\n"
        "• SAP Integration Interfaces: src/services/ISAPAdapter.ts, src/services/S21SAPAdapter.ts, src/services/MockSAPAdapter.ts\n"
        "• UI Modules & State: src/views/, src/components/, src/context/\n"
        "• Deployment Blueprints: manifest.yml, mta.yaml, sap_btp_static_deploy_guide.md\n"
        "• Standard Operating Procedures: SOP.md, PODZO_PROJECT_KNOWLEDGE.md\n\n"
        "All interfaces, endpoints, database entities, and workflows documented herein represent the verified operational capabilities of PODZO v3.0.0."
    )

    # Save to all target paths
    for pth in target_files:
        os.makedirs(os.path.dirname(pth), exist_ok=True)
        doc.save(pth)
        print(f"Document successfully generated and saved to: {pth}")

if __name__ == '__main__':
    targets = [
        r"C:\projects\POD\PODZO_FULL_Product_Documentation.docx",
        r"C:\Users\ali\Downloads\PODZO_FULL_Product_Documentation.docx"
    ]
    generate_podzo_full_document(targets)
