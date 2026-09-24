import os
import sys
import base64
from pathlib import Path
from playwright.sync_api import sync_playwright
import fitz # PyMuPDF
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

BASE_DIR = Path("C:/projects/POD")
HTML_FILE = BASE_DIR / "scripts/overview_template.html"
PDF_FILE = BASE_DIR / "PODZO_Solution_Overview_v1.0.pdf"
DOCX_FILE = BASE_DIR / "PODZO_Solution_Overview_v1.0.docx"
LOGO_FILE = BASE_DIR / "public/branding/podzo-logo-compact.png"

def generate_pdf():
    print("Generating PDF via Playwright Chromium...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(HTML_FILE.as_uri(), wait_until="networkidle")
        page.pdf(
            path=str(PDF_FILE),
            format="A4",
            print_background=True,
            prefer_css_page_size=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
        )
        browser.close()
    
    # Check page count
    doc = fitz.open(PDF_FILE)
    page_count = len(doc)
    doc.close()
    print(f"Generated PDF: {PDF_FILE} | Page count: {page_count}")
    return page_count

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_border(cell, **kwargs):
    """
    kwargs: top, bottom, left, right
    values: dict(sz=12, val='single', color='0A6ED1')
    """
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right'):
        edge_data = kwargs.get(edge)
        if edge_data:
            tag = 'w:{}'.format(edge)
            element = OxmlElement(tag)
            element.set(qn('w:val'), edge_data.get('val', 'single'))
            element.set(qn('w:sz'), str(edge_data.get('sz', 4)))
            element.set(qn('w:space'), '0')
            element.set(qn('w:color'), edge_data.get('color', 'D9E1E8'))
            tcBorders.append(element)
    tcPr.append(tcBorders)

def generate_docx():
    print("Generating DOCX via python-docx...")
    doc = Document()
    
    # Page setup - A4, 0.5 in margins
    for section in doc.sections:
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)
        section.top_margin = Inches(0.45)
        section.bottom_margin = Inches(0.4)
        section.left_margin = Inches(0.55)
        section.right_margin = Inches(0.55)
    
    # Styles
    COLOR_SAP_BLUE = RGBColor(10, 110, 209)      # #0A6ED1
    COLOR_DARK_BLUE = RGBColor(15, 39, 68)       # #0F2744
    COLOR_NAVY = RGBColor(8, 84, 160)            # #0854A0
    COLOR_TEXT_BODY = RGBColor(29, 45, 62)       # #1D2D3E
    COLOR_TEXT_MUTED = RGBColor(91, 115, 139)    # #5B738B
    COLOR_SUCCESS = RGBColor(16, 126, 62)        # #107E3E
    
    # Set default font
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Segoe UI'
    normal_style.font.size = Pt(8.5)
    normal_style.font.color.rgb = COLOR_TEXT_BODY
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(2)
    normal_style.paragraph_format.space_before = Pt(0)

    # ─────────────────────────────────────────────────────────────
    # PAGE 1
    # ─────────────────────────────────────────────────────────────
    
    # Header Table: Logo/Title on left, Metadata on right
    header_table = doc.add_table(rows=1, cols=2)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_table.autofit = False
    header_table.columns[0].width = Inches(5.3)
    header_table.columns[1].width = Inches(1.87)
    
    cell_l = header_table.cell(0, 0)
    cell_r = header_table.cell(0, 1)
    
    p_title = cell_l.paragraphs[0]
    p_title.paragraph_format.space_after = Pt(1)
    r_main = p_title.add_run("PODZO — Solution Overview\n")
    r_main.font.size = Pt(15.5)
    r_main.font.bold = True
    r_main.font.color.rgb = COLOR_DARK_BLUE
    
    r_sub = p_title.add_run("SAP-Connected Delivery & Transport Management Platform")
    r_sub.font.size = Pt(9.5)
    r_sub.font.bold = True
    r_sub.font.color.rgb = COLOR_SAP_BLUE
    
    p_meta = cell_r.paragraphs[0]
    p_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_meta.paragraph_format.space_after = Pt(0)
    r_badge = p_meta.add_run("CLIENT SOLUTION OVERVIEW\n")
    r_badge.font.size = Pt(8)
    r_badge.font.bold = True
    r_badge.font.color.rgb = COLOR_NAVY
    
    r_meta_sub = p_meta.add_run("Version 1.0 • September 2026")
    r_meta_sub.font.size = Pt(7.5)
    r_meta_sub.font.color.rgb = COLOR_TEXT_MUTED

    # Top border line
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(3)
    p_div.paragraph_format.space_after = Pt(4)
    run_div = p_div.add_run("―" * 58)
    run_div.font.color.rgb = COLOR_SAP_BLUE
    run_div.font.size = Pt(8)

    # Executive Summary Callout Box
    lead_tbl = doc.add_table(rows=1, cols=1)
    lead_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    lead_tbl.columns[0].width = Inches(7.17)
    c_lead = lead_tbl.cell(0, 0)
    set_cell_background(c_lead, "F8FAFC")
    set_cell_border(c_lead, left={'sz': 20, 'val': 'single', 'color': '0A6ED1'},
                           top={'sz': 4, 'val': 'single', 'color': 'E2E8F0'},
                           bottom={'sz': 4, 'val': 'single', 'color': 'E2E8F0'},
                           right={'sz': 4, 'val': 'single', 'color': 'E2E8F0'})
    set_cell_margins(c_lead, top=80, bottom=80, left=120, right=120)
    p_lead = c_lead.paragraphs[0]
    p_lead.paragraph_format.space_after = Pt(0)
    r_lead_b = p_lead.add_run("Executive Summary: ")
    r_lead_b.font.bold = True
    r_lead_b.font.size = Pt(8.5)
    r_lead_b.font.color.rgb = COLOR_DARK_BLUE
    r_lead_t = p_lead.add_run("PODZO provides a centralized operational interface for managing SAP-connected contracts and purchase orders, transport allocation, delivery execution, and proof-of-delivery (POD) processes.")
    r_lead_t.font.size = Pt(8.5)
    r_lead_t.font.color.rgb = COLOR_TEXT_BODY

    # Section 1: At a Glance
    p_s1 = doc.add_paragraph()
    p_s1.paragraph_format.space_before = Pt(7)
    p_s1.paragraph_format.space_after = Pt(2)
    r_s1_t = p_s1.add_run("SECTION 1 — PODZO AT A GLANCE")
    r_s1_t.font.bold = True
    r_s1_t.font.size = Pt(9)
    r_s1_t.font.color.rgb = COLOR_NAVY

    glance_tbl = doc.add_table(rows=1, cols=1)
    glance_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    glance_tbl.columns[0].width = Inches(7.17)
    c_g = glance_tbl.cell(0, 0)
    set_cell_background(c_g, "FFFFFF")
    set_cell_border(c_g, top={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                         bottom={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                         left={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                         right={'sz': 4, 'val': 'single', 'color': 'D9E1E8'})
    set_cell_margins(c_g, top=80, bottom=80, left=120, right=120)
    p_g = c_g.paragraphs[0]
    p_g.paragraph_format.space_after = Pt(0)
    r_g = p_g.add_run("PODZO is an enterprise operational execution platform designed to bridge SAP S/21 with day-to-day transport logistics and bulk haulage fulfillment. Used by industrial shippers, commercial hauliers, siding supervisors, drivers, and receiving customers, PODZO manages the physical realization of transport purchase orders. By retrieving active contracts and released POs directly from SAP S/21, PODZO governs vehicle allocation, 4-point weighbridge validation, digital journey tracking, and OCR-assisted POD verification—delivering end-to-end operational visibility while preserving SAP as the single authoritative financial core.")
    r_g.font.size = Pt(8.2)

    # Section 2: Key Capabilities (6 cards in 3x2 grid)
    p_s2 = doc.add_paragraph()
    p_s2.paragraph_format.space_before = Pt(7)
    p_s2.paragraph_format.space_after = Pt(2)
    r_s2_t = p_s2.add_run("SECTION 2 — KEY CAPABILITIES")
    r_s2_t.font.bold = True
    r_s2_t.font.size = Pt(9)
    r_s2_t.font.color.rgb = COLOR_NAVY

    caps = [
        ("SAP S/21 Synchronization", "Direct ingestion of active outline agreements (ME33K) and transport purchase orders (ME23N) with quantities, rates, and validity periods."),
        ("Transport Allocation & E-Sign", "Timebound PO allocation to certified transporters with mandatory digital signature acknowledgment and electronic bilty/waybill reference."),
        ("4-Point Weighbridge Control", "Capture dispatch tare/gross (loading siding) and destination tare/gross (receiving yard) to guarantee net payload and capture transit loss."),
        ("Driver Mobile Execution", "Mobile-first driver web console for route navigation, arrival timestamp logging, gate check-in, and instant physical POD slip photo upload."),
        ("OCR POD Verification Desk", "Automated document data extraction matching waybill numbers, truck registrations, and delivered weights against SAP records with confidence scoring."),
        ("Invoicing & SAP MIRO Posting", "Consolidation of verified delivered tonnage into freight invoices, staging audit-ready data for SAP MIRO supplier invoice parking and clearing.")
    ]

    cap_tbl = doc.add_table(rows=2, cols=3)
    cap_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col in cap_tbl.columns:
        col.width = Inches(2.35)
    
    idx = 0
    for r in range(2):
        for c in range(3):
            cell = cap_tbl.cell(r, c)
            set_cell_background(cell, "FFFFFF")
            set_cell_border(cell, top={'sz': 16, 'val': 'single', 'color': '0A6ED1'},
                                 bottom={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                                 left={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                                 right={'sz': 4, 'val': 'single', 'color': 'D9E1E8'})
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            title, desc = caps[idx]
            r_t = p.add_run(f"◆ {title}\n")
            r_t.font.bold = True
            r_t.font.size = Pt(7.8)
            r_t.font.color.rgb = COLOR_DARK_BLUE
            r_d = p.add_run(desc)
            r_d.font.size = Pt(7.0)
            r_d.font.color.rgb = RGBColor(72, 101, 129)
            idx += 1

    # Section 3: Role-Based Operations (5 roles)
    p_s3 = doc.add_paragraph()
    p_s3.paragraph_format.space_before = Pt(7)
    p_s3.paragraph_format.space_after = Pt(2)
    r_s3_t = p_s3.add_run("SECTION 3 — ROLE-BASED OPERATIONS")
    r_s3_t.font.bold = True
    r_s3_t.font.size = Pt(9)
    r_s3_t.font.color.rgb = COLOR_NAVY

    roles = [
        ("CA", "Company Admin", "Manages contracts, PO allocations, variance review queues, and final MIRO invoice approvals."),
        ("TA", "Transporter Admin", "Accepts allocated POs via digital signature, schedules fleet/drivers, and submits freight invoices."),
        ("SR", "Supervisor", "Conducts siding pre-dispatch inspections, logs weighbridge weights, and authorizes gate release."),
        ("DR", "Driver", "Executes assignments via mobile web, verifies loading, and uploads stamped physical POD slips."),
        ("CR", "Customer", "Captures receiving weighbridge readings, records transit deviations, and confirms delivery acceptance.")
    ]

    roles_tbl = doc.add_table(rows=1, cols=5)
    roles_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col in roles_tbl.columns:
        col.width = Inches(1.41)
    for c, (code, name, desc) in enumerate(roles):
        cell = roles_tbl.cell(0, c)
        set_cell_background(cell, "F8FAFC")
        set_cell_border(cell, top={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                             bottom={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                             left={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                             right={'sz': 4, 'val': 'single', 'color': 'D9E1E8'})
        set_cell_margins(cell, top=60, bottom=60, left=60, right=60)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        r_c = p.add_run(f"[{code}] {name}\n")
        r_c.font.bold = True
        r_c.font.size = Pt(7.4)
        r_c.font.color.rgb = COLOR_SAP_BLUE
        r_d = p.add_run(desc)
        r_d.font.size = Pt(6.6)
        r_d.font.color.rgb = RGBColor(72, 101, 129)

    # Section 4: End-to-End Workflow
    p_s4 = doc.add_paragraph()
    p_s4.paragraph_format.space_before = Pt(7)
    p_s4.paragraph_format.space_after = Pt(2)
    r_s4_t = p_s4.add_run("SECTION 4 — END-TO-END OPERATIONAL WORKFLOW")
    r_s4_t.font.bold = True
    r_s4_t.font.size = Pt(9)
    r_s4_t.font.color.rgb = COLOR_NAVY

    wf_steps = [
        ("Step 1", "SAP S/21 Sync", "Contracts & POs", "EAF3FC"),
        ("Step 2", "PO E-Acceptance", "Transporter (TA)", "FFFFFF"),
        ("Step 3", "Siding Dispatch", "Supervisor (SR)", "FFFFFF"),
        ("Step 4", "Transit Execution", "Driver (DR)", "FFFFFF"),
        ("Step 5", "Yard Receiving", "Customer (CR)", "FFFFFF"),
        ("Step 6", "OCR POD Review", "Company Admin (CA)", "FFFFFF"),
        ("Step 7", "SAP MIRO Clear", "Park & Post Invoice", "EAF3FC"),
    ]

    wf_tbl = doc.add_table(rows=1, cols=7)
    wf_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col in wf_tbl.columns:
        col.width = Inches(1.01)
    for c, (s_num, s_title, s_actor, bg_hex) in enumerate(wf_steps):
        cell = wf_tbl.cell(0, c)
        set_cell_background(cell, bg_hex)
        set_cell_border(cell, top={'sz': 4, 'val': 'single', 'color': '0A6ED1' if bg_hex != 'FFFFFF' else 'CBD5E1'},
                             bottom={'sz': 4, 'val': 'single', 'color': '0A6ED1' if bg_hex != 'FFFFFF' else 'CBD5E1'},
                             left={'sz': 4, 'val': 'single', 'color': '0A6ED1' if bg_hex != 'FFFFFF' else 'CBD5E1'},
                             right={'sz': 4, 'val': 'single', 'color': '0A6ED1' if bg_hex != 'FFFFFF' else 'CBD5E1'})
        set_cell_margins(cell, top=50, bottom=50, left=40, right=40)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        r_num = p.add_run(f"{s_num}\n")
        r_num.font.bold = True
        r_num.font.size = Pt(6.5)
        r_num.font.color.rgb = COLOR_SAP_BLUE
        r_tit = p.add_run(f"{s_title}\n")
        r_tit.font.bold = True
        r_tit.font.size = Pt(7.0)
        r_tit.font.color.rgb = COLOR_DARK_BLUE
        r_act = p.add_run(s_actor)
        r_act.font.size = Pt(6.2)
        r_act.font.color.rgb = COLOR_TEXT_MUTED

    # Page 1 Footer Note
    p_f1 = doc.add_paragraph()
    p_f1.paragraph_format.space_before = Pt(8)
    p_f1.paragraph_format.space_after = Pt(0)
    r_f1 = p_f1.add_run("PODZO — SAP-Connected Delivery & Transport Management Platform  |  Page 1 of 2")
    r_f1.font.size = Pt(7.2)
    r_f1.font.color.rgb = COLOR_TEXT_MUTED

    # ─────────────────────────────────────────────────────────────
    # PAGE 2 BREAK
    # ─────────────────────────────────────────────────────────────
    doc.add_page_break()

    # Page 2 Header Table
    h2_table = doc.add_table(rows=1, cols=2)
    h2_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    h2_table.columns[0].width = Inches(5.3)
    h2_table.columns[1].width = Inches(1.87)
    
    c2_l = h2_table.cell(0, 0)
    c2_r = h2_table.cell(0, 1)
    
    p2_t = c2_l.paragraphs[0]
    p2_t.paragraph_format.space_after = Pt(1)
    r2_m = p2_t.add_run("PODZO — Integration & Technical Architecture\n")
    r2_m.font.size = Pt(11)
    r2_m.font.bold = True
    r2_m.font.color.rgb = COLOR_DARK_BLUE
    r2_s = p2_t.add_run("SAP S/21 Integration, Architectural Blueprint & Enterprise Value")
    r2_s.font.size = Pt(8)
    r2_s.font.bold = True
    r2_s.font.color.rgb = COLOR_SAP_BLUE
    
    p2_meta = c2_r.paragraphs[0]
    p2_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p2_meta.paragraph_format.space_after = Pt(0)
    r2_b = p2_meta.add_run("ENTERPRISE BLUEPRINT\n")
    r2_b.font.size = Pt(8)
    r2_b.font.bold = True
    r2_b.font.color.rgb = COLOR_NAVY
    r2_sub = p2_meta.add_run("Page 2 of 2")
    r2_sub.font.size = Pt(7.5)
    r2_sub.font.color.rgb = COLOR_TEXT_MUTED

    # Divider line
    p2_div = doc.add_paragraph()
    p2_div.paragraph_format.space_before = Pt(2)
    p2_div.paragraph_format.space_after = Pt(4)
    run2_div = p2_div.add_run("―" * 58)
    run2_div.font.color.rgb = COLOR_SAP_BLUE
    run2_div.font.size = Pt(8)

    # Section 5: SAP S/21 Integration
    p_s5 = doc.add_paragraph()
    p_s5.paragraph_format.space_before = Pt(4)
    p_s5.paragraph_format.space_after = Pt(2)
    r_s5_t = p_s5.add_run("SECTION 5 — SAP S/21 INTEGRATION")
    r_s5_t.font.bold = True
    r_s5_t.font.size = Pt(9)
    r_s5_t.font.color.rgb = COLOR_NAVY

    integ_tbl = doc.add_table(rows=4, cols=3)
    integ_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    integ_tbl.columns[0].width = Inches(1.8)
    integ_tbl.columns[1].width = Inches(3.2)
    integ_tbl.columns[2].width = Inches(2.17)

    headers = ["Integration Dimension", "Data Scope & Functional Mapping", "Data Governance & Storage Boundary"]
    for c, h in enumerate(headers):
        cell = integ_tbl.cell(0, c)
        set_cell_background(cell, "0854A0")
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(7.3)
        r.font.color.rgb = RGBColor(255, 255, 255)

    rows_data = [
        ("Inbound from SAP S/21\n[OData / REST APIs]",
         "Outline Contracts (ME33K), Transport POs (ME23N), Line Items, Target Tonnage, Unit Rates, Cost Centers, Delivery Sites, Vendor Master (LFA1).",
         "Retrieved from SAP. Master records remain governed exclusively in SAP S/21; cached for operational display."),
        ("Operational Processing\n[PODZO Core Layer]",
         "Digital PO acceptance signature hashes, carrier waybills (bilties), 4-point weighbridge tickets, OTP verifications, driver stamps, uploaded POD scans.",
         "Stored in PODZO. Field execution logs and audit telemetry are persisted locally in PODZO's transactional database."),
        ("Outbound to SAP S/21\n[ABAP RFC / MIRO API]",
         "Verified delivered quantities, Service Entry Sheet (SES / ML81N) triggers, MIRO supplier invoice parking/posting, ArchiveLink POD attachments.",
         "Posted to SAP. Final financial and compliance artifacts are transmitted back to SAP for settlement.")
    ]

    for r_idx, (d1, d2, d3) in enumerate(rows_data, start=1):
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate([d1, d2, d3]):
            cell = integ_tbl.cell(r_idx, c_idx)
            set_cell_background(cell, bg)
            set_cell_border(cell, bottom={'sz': 4, 'val': 'single', 'color': 'E2E8F0'})
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(val)
            r.font.size = Pt(7.0)
            r.font.color.rgb = COLOR_TEXT_BODY

    # Section 6: High-Level Solution Architecture
    p_s6 = doc.add_paragraph()
    p_s6.paragraph_format.space_before = Pt(6)
    p_s6.paragraph_format.space_after = Pt(2)
    r_s6_t = p_s6.add_run("SECTION 6 — HIGH-LEVEL SOLUTION ARCHITECTURE")
    r_s6_t.font.bold = True
    r_s6_t.font.size = Pt(9)
    r_s6_t.font.color.rgb = COLOR_NAVY

    arch_tbl = doc.add_table(rows=3, cols=1)
    arch_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    arch_tbl.columns[0].width = Inches(7.17)

    layers = [
        ("1. Enterprise ERP Layer (SAP S/21 System of Record)",
         "SAP ECC / S/4HANA Core  •  Contracts (ME33K)  •  Purchase Orders (ME23N)  •  Service Entry Sheets (ML81N)  •  Supplier Invoicing (MIRO)  •  ArchiveLink / DMS"),
        ("2. PODZO Operational Core Platform (Execution & Verification Layer)",
         "S21 REST/OData Client  •  4-Point Weighbridge Engine  •  OCR Document Matching Desk  •  Variance Checking  •  Review Queue  •  Secure Storage  •  Audit Logs"),
        ("3. Role-Tailored Operational Consoles (SAP Fiori-Inspired UX)",
         "Company Admin Control Tower  •  Transporter POs & Fleet Portal  •  Supervisor Siding Console  •  Driver Mobile Web App  •  Customer Receiving Yard")
    ]

    for i, (l_title, l_desc) in enumerate(layers):
        cell = arch_tbl.cell(i, 0)
        set_cell_background(cell, "F8FAFC" if i != 1 else "FFFFFF")
        set_cell_border(cell, top={'sz': 4, 'val': 'single', 'color': '0A6ED1' if i == 1 else 'CBD5E1'},
                             bottom={'sz': 4, 'val': 'single', 'color': '0A6ED1' if i == 1 else 'CBD5E1'},
                             left={'sz': 4, 'val': 'single', 'color': '0A6ED1' if i == 1 else 'CBD5E1'},
                             right={'sz': 4, 'val': 'single', 'color': '0A6ED1' if i == 1 else 'CBD5E1'})
        set_cell_margins(cell, top=50, bottom=50, left=100, right=100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r1 = p.add_run(f"{l_title}\n")
        r1.font.bold = True
        r1.font.size = Pt(7.6)
        r1.font.color.rgb = COLOR_DARK_BLUE
        r2 = p.add_run(l_desc)
        r2.font.size = Pt(6.8)
        r2.font.color.rgb = RGBColor(72, 101, 129)

    # Section 7: Technology Overview
    p_s7 = doc.add_paragraph()
    p_s7.paragraph_format.space_before = Pt(6)
    p_s7.paragraph_format.space_after = Pt(2)
    r_s7_t = p_s7.add_run("SECTION 7 — TECHNOLOGY OVERVIEW")
    r_s7_t.font.bold = True
    r_s7_t.font.size = Pt(9)
    r_s7_t.font.color.rgb = COLOR_NAVY

    tech_items = [
        ("Frontend", "React 19 • Vite", "TypeScript, React Router 7"),
        ("Backend Services", "Node.js • Express 5", "RESTful API Architecture"),
        ("SAP Integration", "S21 OData / REST", "OData, RFC Proxy, Sync Logs"),
        ("Data Store", "SQLite (WAL Mode)", "Full Transactional Durability"),
        ("Design System", "SAP Fiori Inspired", "Responsive Desktop & Mobile")
    ]

    tech_tbl = doc.add_table(rows=1, cols=5)
    tech_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col in tech_tbl.columns:
        col.width = Inches(1.41)
    for c, (cat, val, sub) in enumerate(tech_items):
        cell = tech_tbl.cell(0, c)
        set_cell_background(cell, "FFFFFF")
        set_cell_border(cell, top={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                             bottom={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                             left={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                             right={'sz': 4, 'val': 'single', 'color': 'D9E1E8'})
        set_cell_margins(cell, top=50, bottom=50, left=60, right=60)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r_c = p.add_run(f"{cat.upper()}\n")
        r_c.font.bold = True
        r_c.font.size = Pt(6.3)
        r_c.font.color.rgb = COLOR_SAP_BLUE
        r_v = p.add_run(f"{val}\n")
        r_v.font.bold = True
        r_v.font.size = Pt(7.0)
        r_v.font.color.rgb = COLOR_DARK_BLUE
        r_s = p.add_run(sub)
        r_s.font.size = Pt(6.2)
        r_s.font.color.rgb = COLOR_TEXT_MUTED

    # Section 8: Business Value (4 cards)
    p_s8 = doc.add_paragraph()
    p_s8.paragraph_format.space_before = Pt(6)
    p_s8.paragraph_format.space_after = Pt(2)
    r_s8_t = p_s8.add_run("SECTION 8 — BUSINESS VALUE")
    r_s8_t.font.bold = True
    r_s8_t.font.size = Pt(9)
    r_s8_t.font.color.rgb = COLOR_NAVY

    values = [
        ("Unified Operational Truth", "Bridges SAP S/21 with field transporters and receiving yards without requiring third-party hauliers to hold full enterprise SAP user licenses."),
        ("Dispute-Free Weight Verification", "Mandatory 4-point weighbridge logging captures tare and gross weights at both origin and destination, eliminating payload discrepancies and transit loss disputes."),
        ("Compressed Invoicing Cycles", "Immediate digital POD capture paired with OCR verification replaces multi-week physical paper transit, collapsing billing and MIRO clearing to hours."),
        ("Complete Audit Governance", "Every vehicle dispatch, weighbridge entry, tolerance override, and MIRO posting is immutably timestamped with user credentials and audit logs.")
    ]

    val_tbl = doc.add_table(rows=2, cols=2)
    val_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col in val_tbl.columns:
        col.width = Inches(3.55)
    v_idx = 0
    for r in range(2):
        for c in range(2):
            cell = val_tbl.cell(r, c)
            set_cell_background(cell, "FFFFFF")
            set_cell_border(cell, left={'sz': 16, 'val': 'single', 'color': '107E3E'},
                                 top={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                                 bottom={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                                 right={'sz': 4, 'val': 'single', 'color': 'D9E1E8'})
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            v_t, v_d = values[v_idx]
            r_vt = p.add_run(f"{v_t}\n")
            r_vt.font.bold = True
            r_vt.font.size = Pt(7.5)
            r_vt.font.color.rgb = COLOR_DARK_BLUE
            r_vd = p.add_run(v_d)
            r_vd.font.size = Pt(6.8)
            r_vd.font.color.rgb = RGBColor(72, 101, 129)
            v_idx += 1

    # Section 9: Current Solution Position
    appr_tbl = doc.add_table(rows=1, cols=1)
    appr_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    appr_tbl.columns[0].width = Inches(7.17)
    c_ap = appr_tbl.cell(0, 0)
    set_cell_background(c_ap, "EAF3FC")
    set_cell_border(c_ap, top={'sz': 4, 'val': 'single', 'color': 'B8D8F8'},
                          bottom={'sz': 4, 'val': 'single', 'color': 'B8D8F8'},
                          left={'sz': 4, 'val': 'single', 'color': 'B8D8F8'},
                          right={'sz': 4, 'val': 'single', 'color': 'B8D8F8'})
    set_cell_margins(c_ap, top=60, bottom=60, left=100, right=100)
    p_ap = c_ap.paragraphs[0]
    p_ap.paragraph_format.space_after = Pt(0)
    r_apt = p_ap.add_run("SOLUTION APPROACH & POSITIONING\n")
    r_apt.font.bold = True
    r_apt.font.size = Pt(7.3)
    r_apt.font.color.rgb = COLOR_NAVY
    r_apd = p_ap.add_run("PODZO provides a purpose-built operational execution and verification layer around SAP-connected contract and purchase order workflows. It enables business users, logistics providers, and drivers to collaborate through a modern, role-based interface while preserving strict alignment, security, and traceability with SAP S/21 business data.")
    r_apd.font.size = Pt(7.0)
    r_apd.font.color.rgb = COLOR_DARK_BLUE

    # Page 2 Footer Note
    p_f2 = doc.add_paragraph()
    p_f2.paragraph_format.space_before = Pt(6)
    p_f2.paragraph_format.space_after = Pt(0)
    r_f2 = p_f2.add_run("PODZO — Solution Overview v1.0  •  Confidential Client Document  |  Page 2 of 2")
    r_f2.font.size = Pt(7.2)
    r_f2.font.color.rgb = COLOR_TEXT_MUTED

    doc.save(str(DOCX_FILE))
    print(f"Generated DOCX: {DOCX_FILE}")

if __name__ == "__main__":
    pdf_pages = generate_pdf()
    generate_docx()
    print(f"Done! PDF Pages: {pdf_pages}")
