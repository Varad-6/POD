import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# Color Constants - Premium Dark Corporate Palette
BG_DARK = RGBColor(11, 17, 32)         # #0B1120 - Dark Navy Base
BG_CARD = RGBColor(21, 31, 50)         # #151F32 - Slate Card Background
BG_CARD_ALT = RGBColor(15, 23, 42)     # #0F172A - Deeper Card Accent
BORDER_COLOR = RGBColor(38, 51, 77)    # #26334D - Crisp Border Line
CYAN_ACCENT = RGBColor(56, 189, 248)   # #38BDF8 - Bright Cyan Highlight
BLUE_ACCENT = RGBColor(2, 132, 199)    # #0284C7 - Primary Blue
WHITE_TEXT = RGBColor(248, 250, 252)   # #F8FAFC - Crisp Header Text
MUTED_TEXT = RGBColor(148, 163, 184)   # #94A3B8 - Secondary Muted Text
SUCCESS_GREEN = RGBColor(16, 185, 129) # #10B981 - Green Badge/State
WARNING_AMBER = RGBColor(245, 158, 11) # #F59E0B - Amber Exception State
DANGER_RED = RGBColor(239, 68, 68)     # #EF4444 - Red Problem State

def set_slide_background(slide):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = BG_DARK

def add_header(slide, title_text, subtitle_text, slide_num, total_slides=21):
    # Slide Number Badge
    badge_box = slide.shapes.add_textbox(Inches(10.5), Inches(0.35), Inches(2.2), Inches(0.4))
    tf_b = badge_box.text_frame
    tf_b.word_wrap = True
    p_b = tf_b.paragraphs[0]
    p_b.text = f"SLIDE {slide_num:02d} / {total_slides}"
    p_b.font.size = Pt(11)
    p_b.font.bold = True
    p_b.font.color.rgb = CYAN_ACCENT
    p_b.alignment = PP_ALIGN.RIGHT

    # Title & Subtitle Box
    title_box = slide.shapes.add_textbox(Inches(0.6), Inches(0.3), Inches(9.8), Inches(1.0))
    tf_t = title_box.text_frame
    tf_t.word_wrap = True
    
    p_t = tf_t.paragraphs[0]
    p_t.text = title_text
    p_t.font.size = Pt(24)
    p_t.font.bold = True
    p_t.font.color.rgb = WHITE_TEXT

    if subtitle_text:
        p_s = tf_t.add_paragraph()
        p_s.text = subtitle_text
        p_s.font.size = Pt(13)
        p_s.font.color.rgb = MUTED_TEXT

    # Divider Line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(1.35), Inches(12.13), Inches(0.02))
    line.fill.solid()
    line.fill.fore_color.rgb = BORDER_COLOR
    line.line.fill.background()

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    screenshots_dir = os.path.abspath('public/screenshots')
    total_slides = 21

    # ==========================================
    # SLIDE 1: Title Slide
    # ==========================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1)

    t_box = slide1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.333), Inches(3.8))
    tf1 = t_box.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "CLIENT PRESENTATION | PRODUCTION ROLLOUT OVERVIEW"
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = CYAN_ACCENT
    p0.alignment = PP_ALIGN.CENTER

    p1 = tf1.add_paragraph()
    p1.text = "Ikwezi Transporter Portal"
    p1.font.size = Pt(46)
    p1.font.bold = True
    p1.font.color.rgb = WHITE_TEXT
    p1.alignment = PP_ALIGN.CENTER

    p2 = tf1.add_paragraph()
    p2.text = "Proof-of-Delivery (POD) Automation & SAP S/4HANA Integration Blueprint"
    p2.font.size = Pt(19)
    p2.font.color.rgb = MUTED_TEXT
    p2.alignment = PP_ALIGN.CENTER

    # Hero Card Box
    card_title = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(5.3), Inches(10.333), Inches(1.2))
    card_title.fill.solid()
    card_title.fill.fore_color.rgb = BG_CARD
    card_title.line.color.rgb = CYAN_ACCENT
    
    tf_c = card_title.text_frame
    tf_c.word_wrap = True
    pc = tf_c.paragraphs[0]
    pc.text = "Prepared For: Ikwezi Mining Limited   |   Delivered By: Abhiyanta India Solutions Pvt. Ltd.\nDeployment Environment: SAP BTP Cloud Foundry (Production Prototype Live)"
    pc.font.size = Pt(13)
    pc.font.color.rgb = WHITE_TEXT
    pc.alignment = PP_ALIGN.CENTER

    # ==========================================
    # SLIDE 2: Executive Summary
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide2)
    add_header(slide2, "Executive Summary", "Project core mission, architectural solution, and current deployment status", 2, total_slides)

    cards_data = [
        ("The Core Problem", "Paper Bottleneck", "Manual PO, weighbridge slip, and invoice reconciliation creates 30+ day payment delays, lost physical tickets, and unverified weight-mismatch disputes.", DANGER_RED),
        ("The Digital Solution", "Automated Portal", "End-to-end Transporter Portal connecting drivers, weighbridges, and mine admins with SAP S/4HANA via 7 secure REST/OData interfaces.", BLUE_ACCENT),
        ("Current Status", "Live Demonstration", "Production-ready React SPA prototype successfully compiled and running live on SAP BTP Cloud Foundry with full 14-step operational workflow.", SUCCESS_GREEN)
    ]

    for i, (badge, title, desc, color) in enumerate(cards_data):
        left = Inches(0.6 + i * 4.1)
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.6), Inches(3.9), Inches(3.2))
        card.fill.solid()
        card.fill.fore_color.rgb = BG_CARD
        card.line.color.rgb = color
        card.line.width = Pt(2)

        tf = card.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.TOP
        
        p = tf.paragraphs[0]
        p.text = badge.upper()
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = color

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(18)
        p_t.font.bold = True
        p_t.font.color.rgb = WHITE_TEXT

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(12.5)
        p_d.font.color.rgb = MUTED_TEXT

    # Stats Banner Callout
    stat_card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(5.1), Inches(12.13), Inches(1.8))
    stat_card.fill.solid()
    stat_card.fill.fore_color.rgb = BG_CARD
    stat_card.line.color.rgb = BORDER_COLOR

    stats = [
        ("7", "SAP OData Interfaces"),
        ("±0.5%", "Weight Tolerance Gate"),
        ("85%", "OCR Confidence Gate"),
        ("100%", "Digital Audit Trail")
    ]
    for i, (num, lbl) in enumerate(stats):
        box = slide2.shapes.add_textbox(Inches(0.8 + i * 3.0), Inches(5.3), Inches(2.8), Inches(1.4))
        tf = box.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = num
        p1.font.size = Pt(30)
        p1.font.bold = True
        p1.font.color.rgb = CYAN_ACCENT
        p1.alignment = PP_ALIGN.CENTER
        
        p2 = tf.add_paragraph()
        p2.text = lbl
        p2.font.size = Pt(12)
        p2.font.color.rgb = MUTED_TEXT
        p2.alignment = PP_ALIGN.CENTER

    # ==========================================
    # SLIDE 3: The Problem
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide3)
    add_header(slide3, "The Operational Challenge", "Friction points in current manual transport & invoice reconciliation workflows", 3, total_slides)

    prob_cards = [
        ("01. Manual Reconciliation", "Paper PO & Waybill Matching", "Transporters submit paper Proof-of-Delivery slips manually. Accounts teams manually cross-check line items against SAP purchase orders, creating extreme processing backlogs."),
        ("02. Audit Gaps", "Missing Digital Audit Trail", "Without immutable digital timestamps or driver e-signatures at point of order acceptance and receipt, disputes over dispatch authorization and delivery timelines cannot be resolved."),
        ("03. Weight Disputes", "Mine vs Customer Mismatches", "Weight discrepancies between the mine weighbridge exit log and customer destination receiving tickets trigger protracted disputes, blocking invoice parking in SAP MIRO."),
        ("04. Vendor Cash Flow", "Delayed Transporter Payments", "Processing delays extend payment cycles to 30–60 days, straining transporter working capital, damaging vendor relations, and risking freight operational continuity.")
    ]

    for i, (badge, title, desc) in enumerate(prob_cards):
        row = i // 2
        col = i % 2
        left = Inches(0.6 + col * 6.2)
        top = Inches(1.6 + row * 2.7)

        card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(5.9), Inches(2.4))
        card.fill.solid()
        card.fill.fore_color.rgb = BG_CARD
        card.line.color.rgb = BORDER_COLOR

        tf = card.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = badge.upper()
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = CYAN_ACCENT

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(17)
        p_t.font.bold = True
        p_t.font.color.rgb = WHITE_TEXT

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(12.5)
        p_d.font.color.rgb = MUTED_TEXT

    # ==========================================
    # SLIDE 4: The Solution
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide4)
    add_header(slide4, "The Solution Overview", "Unified side-by-side Transporter Portal integrating operational logistics with SAP core", 4, total_slides)

    main_sol = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.6), Inches(12.13), Inches(2.6))
    main_sol.fill.solid()
    main_sol.fill.fore_color.rgb = BG_CARD
    main_sol.line.color.rgb = CYAN_ACCENT

    tf_ms = main_sol.text_frame
    tf_ms.word_wrap = True
    p = tf_ms.paragraphs[0]
    p.text = "Digitized End-to-End Freight Lifecycle"
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = CYAN_ACCENT

    p_d = tf_ms.add_paragraph()
    p_d.text = "The Ikwezi Transporter Portal establishes a seamless digital bridge between field transport execution and SAP S/4HANA ERP core. Transporters digitally review and accept Purchase Orders via interactive canvas e-signatures; dual weighbridge checkpoints (pre-dispatch empty/loaded and customer receiving) record verified payload weights; drivers upload scanned POD slips directly from mobile devices; an integrated OCR engine validates document metadata against SAP records within strict tolerance thresholds (+/-0.5% / 0.1 Ton); and approved deliveries automatically generate freight invoices posted directly as parked MIRO invoices in SAP."
    p_d.font.size = Pt(13)
    p_d.font.color.rgb = WHITE_TEXT

    steps = [
        ("1. E-Sign PO", "Digital acceptance & immutable audit hash"),
        ("2. Weighbridge", "Dual empty & loaded verification checks"),
        ("3. OCR POD Match", "Automated tolerance & confidence validation"),
        ("4. SAP MIRO Park", "Auto-calculated freight & ERP posting")
    ]

    for i, (title, desc) in enumerate(steps):
        left = Inches(0.6 + i * 3.1)
        card = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(4.5), Inches(2.9), Inches(2.3))
        card.fill.solid()
        card.fill.fore_color.rgb = BG_CARD
        card.line.color.rgb = BORDER_COLOR

        tf = card.text_frame
        tf.word_wrap = True
        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(15)
        p_t.font.bold = True
        p_t.font.color.rgb = CYAN_ACCENT

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11.5)
        p_d.font.color.rgb = MUTED_TEXT

    # ==========================================
    # SLIDE 5: Process Flow Diagram
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide5)
    add_header(slide5, "Process Flow Diagram", "Sequence diagram mapping the 6 operational actors across the delivery lifecycle", 5, total_slides)

    actors = [
        ("1. Company Admin", "Uploads signed contract -> Syncs to SAP S/4HANA -> Allocates Purchase Orders to Transporter Admin"),
        ("2. Transporter Admin", "Reviews incoming PO rate agreements -> Assigns transport runs and vehicles to specific Drivers"),
        ("3. Driver", "Accepts assigned PO with digital signature canvas -> Navigates delivery run to customer site"),
        ("4. Weighbridge Supervisor", "Logs empty tare & loaded gross weighbridge checks -> Validates payload weight against PO limits"),
        ("5. Customer (Receiving)", "Performs on-site weight verification -> Issues physical stamp on POD slip -> Driver uploads scanned POD"),
        ("6. SAP S/4HANA Core", "OCR matches waybill text -> Admin approves -> System auto-posts parked MIRO invoice & archives POD")
    ]

    for i, (actor, action) in enumerate(actors):
        top = Inches(1.6 + i * 0.9)
        card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), top, Inches(12.13), Inches(0.78))
        card.fill.solid()
        if i == 5:
            card.fill.fore_color.rgb = RGBColor(14, 50, 80)
            card.line.color.rgb = CYAN_ACCENT
        else:
            card.fill.fore_color.rgb = BG_CARD
            card.line.color.rgb = BORDER_COLOR

        tf = card.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"{actor}:  "
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = CYAN_ACCENT if i != 5 else WHITE_TEXT

        p_act = p.add_run()
        p_act.text = action
        p_act.font.size = Pt(12)
        p_act.font.bold = False
        p_act.font.color.rgb = WHITE_TEXT

    # ==========================================
    # SLIDE 6: Roles & Personas
    # ==========================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide6)
    add_header(slide6, "Roles & Personas", "5 distinct portal login personas with clear operational responsibilities", 6, total_slides)

    roles = [
        ("Ikwezi Mining", "Company Admin", "Uploads contracts, distributes PO allocations, reviews OCR discrepancy overrides, and grants final invoice clearance."),
        ("Logistics Vendor", "Transporter Admin", "Accepts transport POs, assigns dispatches to drivers, tracks live trip statuses, and submits freight billing invoices."),
        ("Transport Ops", "Driver", "E-signs PO task acceptances, hands over physical waybills, and scans/uploads stamped POD slips via mobile interface."),
        ("Mine Operations", "Weighbridge Supervisor", "Executes empty/loaded weighments before dispatch, logs weighbridge tickets, and enforces payload tolerance rules."),
        ("Client Site", "Customer (Client)", "Performs destination weight checks upon delivery, applies official receiving stamp, and files receiving reports.")
    ]

    for i, (entity, name, desc) in enumerate(roles):
        left = Inches(0.6 + i * 2.45)
        card = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.6), Inches(2.3), Inches(5.3))
        card.fill.solid()
        card.fill.fore_color.rgb = BG_CARD
        card.line.color.rgb = BORDER_COLOR

        tf = card.text_frame
        tf.word_wrap = True

        p_e = tf.paragraphs[0]
        p_e.text = entity.upper()
        p_e.font.size = Pt(9)
        p_e.font.bold = True
        p_e.font.color.rgb = CYAN_ACCENT

        p_n = tf.add_paragraph()
        p_n.text = name
        p_n.font.size = Pt(15)
        p_n.font.bold = True
        p_n.font.color.rgb = WHITE_TEXT

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11.5)
        p_d.font.color.rgb = MUTED_TEXT

    # ==========================================
    # SLIDE 7: Tech Stack
    # ==========================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide7)
    add_header(slide7, "Technology Stack", "Enterprise production architecture components and integration layers", 7, total_slides)

    stack = [
        ("Frontend Framework", "React 19 & TypeScript", "Built with React 19.2, Vite 8 build engine, React Router v7, Lucide icons, and modern CSS Grid design tokens for clean UI execution."),
        ("Backend & Microservices", "Node.js / SAP CAP", "Target Node.js / Express microservices or SAP BTP Cloud Application Programming (CAP) model executing custom ABAP OData endpoints."),
        ("Cloud Hosting", "SAP BTP Cloud Foundry", "Deployed via SAP BTP staticfile buildpack with Nginx web server, SSL edge termination, and seamless enterprise domain mapping."),
        ("SAP Gateway Layer", "7 REST / OData Interfaces", "Exposes 7 standard OData v2/v4 endpoints for real-time bi-directional synchronization with SAP S/4HANA core ERP tables."),
        ("OCR Intelligence Engine", "SAP BTP DIX Service", "Document Information Extraction engine with automated text parsing, +/-0.5% / 0.1T weight matching, and 85% confidence score validation."),
        ("Enterprise Database", "SAP S/4HANA DB (HANA)", "Native SAP HANA database backend utilizing standard vendor master tables (LFA1, EKKO, EKPO, RBKP, RSEG).")
    ]

    for i, (layer, tech, desc) in enumerate(stack):
        row = i // 3
        col = i % 3
        left = Inches(0.6 + col * 4.1)
        top = Inches(1.6 + row * 2.7)

        card = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(3.9), Inches(2.4))
        card.fill.solid()
        card.fill.fore_color.rgb = BG_CARD
        card.line.color.rgb = BORDER_COLOR

        tf = card.text_frame
        tf.word_wrap = True

        p_l = tf.paragraphs[0]
        p_l.text = layer.upper()
        p_l.font.size = Pt(9)
        p_l.font.bold = True
        p_l.font.color.rgb = CYAN_ACCENT

        p_t = tf.add_paragraph()
        p_t.text = tech
        p_t.font.size = Pt(15)
        p_t.font.bold = True
        p_t.font.color.rgb = WHITE_TEXT

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11.5)
        p_d.font.color.rgb = MUTED_TEXT

    # ==========================================
    # SLIDE 8: SAP Integration Architecture
    # ==========================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide8)
    add_header(slide8, "SAP Integration Architecture", "The 7 OData & REST interfaces connecting the portal to SAP S/4HANA", 8, total_slides)

    interfaces = [
        ("1. PO Sync", "SAP -> Portal | OData GET", "Triggered when transport Purchase Orders are released in SAP."),
        ("2. PO Acceptance & E-Sign", "Portal -> SAP | REST POST", "Triggered when Driver/Transporter signs acceptance on canvas."),
        ("3. Offload / SRN Sync", "SAP -> Portal | OData GET", "Triggered daily on scheduled batch extraction of weighbridge logs."),
        ("4. POD Attachment Sync", "Portal -> SAP | REST POST", "Triggered upon Admin approval of verified scanned POD document."),
        ("5. Invoice Park (MIRO)", "Portal -> SAP | REST POST", "Triggered when transporter submits auto-calculated freight invoice."),
        ("6. Payment & Ledger Sync", "SAP -> Portal | OData GET", "Triggered when Accounts clearing updates occur in SAP FI-AP."),
        ("7. Master Data Sync", "SAP -> Portal | OData GET", "Triggered on incremental updates to Vendor (LFA1) tables.")
    ]

    for i, (name, proto, trig) in enumerate(interfaces):
        row = i // 4 if i < 4 else 1
        col = i % 4 if i < 4 else i - 4
        left = Inches(0.6 + col * 3.1) if i < 4 else Inches(0.6 + col * 4.1)
        width = Inches(2.9) if i < 4 else Inches(3.9)
        top = Inches(1.6 + row * 2.7)

        card = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, Inches(2.4))
        card.fill.solid()
        card.fill.fore_color.rgb = BG_CARD
        card.line.color.rgb = BORDER_COLOR

        tf = card.text_frame
        tf.word_wrap = True

        p_n = tf.paragraphs[0]
        p_n.text = name
        p_n.font.size = Pt(14)
        p_n.font.bold = True
        p_n.font.color.rgb = WHITE_TEXT

        p_p = tf.add_paragraph()
        p_p.text = proto
        p_p.font.size = Pt(10)
        p_p.font.bold = True
        p_p.font.color.rgb = CYAN_ACCENT

        p_tr = tf.add_paragraph()
        p_tr.text = trig
        p_tr.font.size = Pt(11.5)
        p_tr.font.color.rgb = MUTED_TEXT

    # ==========================================
    # SLIDE 9: OCR Validation Logic
    # ==========================================
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide9)
    add_header(slide9, "OCR Validation & Verification Logic", "Automated tolerance gates, confidence scoring, and fraud interception", 9, total_slides)

    ocr_rules = [
        ("Rule 01. Weight Tolerance Gate", "+/-0.5% or 0.1 Ton Threshold", "Extracted offload weight from scanned POD slip must match SAP weighbridge log within +/-0.5% or 0.1 Ton (whichever is lower). Discrepancies exceeding threshold automatically flag the trip and generate a debit note draft.", CYAN_ACCENT),
        ("Rule 02. Confidence Score Intercept", "85% Text Extraction Gate", "If character recognition confidence score for key fields (Waybill #, Truck Registration #, Net Weight) falls below 85% (e.g. blurry/damaged slip), automatic pass is blocked and document routes to Admin for manual review.", WARNING_AMBER),
        ("Rule 03. Fraud & Typo Interception", "Automated String Matching", "Exact case-insensitive cross-checks verify truck registration text against authorized dispatch master records, intercepting altered documents, duplicate uploads, and typographical entry errors prior to SAP posting.", SUCCESS_GREEN)
    ]

    for i, (badge, title, desc, color) in enumerate(ocr_rules):
        left = Inches(0.6 + i * 4.1)
        card = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.6), Inches(3.9), Inches(5.3))
        card.fill.solid()
        card.fill.fore_color.rgb = BG_CARD
        card.line.color.rgb = color
        card.line.width = Pt(2)

        tf = card.text_frame
        tf.word_wrap = True

        p_b = tf.paragraphs[0]
        p_b.text = badge.upper()
        p_b.font.size = Pt(10)
        p_b.font.bold = True
        p_b.font.color.rgb = color

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(16)
        p_t.font.bold = True
        p_t.font.color.rgb = WHITE_TEXT

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = MUTED_TEXT

    # ==========================================
    # SLIDES 10 to 17: FEATURED LARGE SCREENSHOT SLIDES!
    # ==========================================
    featured_screenshots = [
        ("01_login.png", "Multi-Persona Login Screen", "5 Role Quick-Access", 
         "Features 5 pre-configured login profiles (Company Admin, Transporter Admin, Driver, Weighbridge Supervisor, Customer) allowing immediate workflow testing without database setup.",
         "SLIDE 10: Multi-Persona Login Portal"),

        ("02_transporter_dashboard.png", "Transporter Operations Dashboard", "Real-Time Freight Fleet KPI View",
         "Provides transport vendors with clear visibility into active PO allocations, deliveries awaiting paperwork, submitted POD status, and total pending billing ledgers.",
         "SLIDE 11: Transporter Operations Dashboard"),

        ("03_po_accept_esign.png", "PO Acceptance & E-Signature Canvas", "Digital Contract Signature",
         "Transporters review contract rates, trip metrics, and draw their digital signature directly on the interactive HTML5 canvas, generating a secure hash for SAP PO sync.",
         "SLIDE 12: PO Acceptance & E-Signature Canvas"),

        ("09_weighbridge_entry.png", "Weighbridge Tare & Gross Verification", "Pre-Dispatch Payload Check",
         "Weighbridge Supervisors record empty truck tare weight and loaded gross weight before mine gate release, enforcing strict payload tolerances against SAP PO limits.",
         "SLIDE 13: Weighbridge Supervisor Entry Screen"),

        ("04_pod_upload_ocr.png", "Scanned POD & OCR Validation View", "Automated Side-by-Side Match",
         "Driver uploads stamped destination POD ticket. Built-in OCR parser extracts Waybill #, Truck #, and Weight, displaying side-by-side green/red matching indicators.",
         "SLIDE 14: POD Upload & Side-by-Side OCR Match"),

        ("07_admin_approvals.png", "Mine Admin POD Approval Queue", "Discrepancy Control Center",
         "Ikwezi Mine Admins inspect pending POD verification queues, review OCR confidence scores, and grant visual overrides or trigger formal rejections back to transporters.",
         "SLIDE 15: Mine Admin Verification Queue"),

        ("05_transporter_invoices.png", "Transporter Freight Invoices & Ledger", "Auto-Calculated Billing",
         "Automatically calculates freight billing (Tons x Rate/Ton), generates tax invoice drafts, attaches PDF invoices, and tracks payment statuses from Parked to Paid.",
         "SLIDE 16: Transporter Freight Invoices & Ledger"),

        ("08_admin_invoices.png", "Mine Admin Invoice Control & SAP MIRO", "Automated SAP Freight Posting",
         "Mine Admins review auto-calculated invoices, verify receiving weights against customer stamps, and trigger SAP REST RFCs to create parked MIRO invoices in SAP S/4HANA.",
         "SLIDE 17: Mine Admin Invoice Control & SAP MIRO")
    ]

    for idx, (img_filename, title_text, badge_text, desc_text, slide_title) in enumerate(featured_screenshots):
        slide_num = 10 + idx
        slide = prs.slides.add_slide(blank_layout)
        set_slide_background(slide)
        add_header(slide, slide_title, "High-resolution screenshot rendered directly from live application", slide_num, total_slides)

        # Left: Large Screenshot Image (Width: 8.7 inches, Height: 5.3 inches)
        left_img = Inches(0.6)
        top_img = Inches(1.55)
        width_img = Inches(8.7)
        height_img = Inches(5.3)

        frame = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_img, top_img, width_img, height_img)
        frame.fill.solid()
        frame.fill.fore_color.rgb = BG_CARD_ALT
        frame.line.color.rgb = BORDER_COLOR

        img_path = os.path.join(screenshots_dir, img_filename)
        if os.path.exists(img_path):
            slide.shapes.add_picture(img_path, left_img + Inches(0.08), top_img + Inches(0.08), width_img - Inches(0.16), height_img - Inches(0.16))
        else:
            ph = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_img + Inches(0.1), top_img + Inches(0.1), width_img - Inches(0.2), height_img - Inches(0.2))
            ph.fill.solid()
            ph.fill.fore_color.rgb = BG_DARK
            tf_ph = ph.text_frame
            p_ph = tf_ph.paragraphs[0]
            p_ph.text = f"[FEATURED SCREENSHOT: {img_filename}]"
            p_ph.font.size = Pt(14)
            p_ph.font.color.rgb = MUTED_TEXT
            p_ph.alignment = PP_ALIGN.CENTER

        # Right Side: Feature Commentary Panel (Width: 3.2 inches)
        left_panel = Inches(9.5)
        top_panel = Inches(1.55)
        width_panel = Inches(3.2)
        height_panel = Inches(5.3)

        panel = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_panel, top_panel, width_panel, height_panel)
        panel.fill.solid()
        panel.fill.fore_color.rgb = BG_CARD
        panel.line.color.rgb = CYAN_ACCENT
        panel.line.width = Pt(1.5)

        tf_p = panel.text_frame
        tf_p.word_wrap = True

        p_b = tf_p.paragraphs[0]
        p_b.text = badge_text.upper()
        p_b.font.size = Pt(10)
        p_b.font.bold = True
        p_b.font.color.rgb = CYAN_ACCENT

        p_t = tf_p.add_paragraph()
        p_t.text = title_text
        p_t.font.size = Pt(17)
        p_t.font.bold = True
        p_t.font.color.rgb = WHITE_TEXT

        p_d = tf_p.add_paragraph()
        p_d.text = desc_text
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = MUTED_TEXT

    # ==========================================
    # SLIDE 18: Exception Handling
    # ==========================================
    slide18 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide18)
    add_header(slide18, "Exception Handling Framework", "Automated resolution protocols for edge cases and system discrepancies", 18, total_slides)

    exceptions = [
        ("Exception 01", "OCR Data Discrepancy", "Scanned POD weight differs from SAP weighbridge record. System flags entry with Discrepancy badge and routes to Admin for visual inspection, manual entry override, or formal rejection back to transporter.", WARNING_AMBER),
        ("Exception 02", "SAP Gateway Timeout", "S/4HANA server downtime blocks immediate MIRO posting. System saves payload locally in Pending Sync status and executes 5 automatic retries (30-min intervals) before triggering IT alert.", DANGER_RED),
        ("Exception 03", "Weight Tolerance Breach", "Transit material loss exceeds +/-0.5% weight tolerance limit. Portal automatically generates a debit note draft matching net difference for Accounts team review prior to clearing invoice payment.", BLUE_ACCENT)
    ]

    for i, (badge, title, desc, color) in enumerate(exceptions):
        left = Inches(0.6 + i * 4.1)
        card = slide18.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.6), Inches(3.9), Inches(5.3))
        card.fill.solid()
        card.fill.fore_color.rgb = BG_CARD
        card.line.color.rgb = color
        card.line.width = Pt(2)

        tf = card.text_frame
        tf.word_wrap = True

        p_b = tf.paragraphs[0]
        p_b.text = badge.upper()
        p_b.font.size = Pt(10)
        p_b.font.bold = True
        p_b.font.color.rgb = color

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(16)
        p_t.font.bold = True
        p_t.font.color.rgb = WHITE_TEXT

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = MUTED_TEXT

    # ==========================================
    # SLIDE 19: Current Status / What's Live
    # ==========================================
    slide19 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide19)
    add_header(slide19, "Current Status — Production Prototype", "Distinguishing live deployed functionality from target SAP integration layers", 19, total_slides)

    card_live = slide19.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.6), Inches(5.9), Inches(5.3))
    card_live.fill.solid()
    card_live.fill.fore_color.rgb = BG_CARD
    card_live.line.color.rgb = SUCCESS_GREEN

    tf_l = card_live.text_frame
    tf_l.word_wrap = True
    p = tf_l.paragraphs[0]
    p.text = "LIVE CAPABILITIES TODAY"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = SUCCESS_GREEN

    live_items = [
        "Deployed live on SAP BTP Cloud Foundry via Nginx static buildpack.",
        "Complete 5-persona role switching (Company Admin, Transporter Admin, Driver, Supervisor, Customer).",
        "Interactive signature drawing canvas for PO acceptance.",
        "Side-by-side OCR matching interface with color-coded green/red validation states.",
        "Auto-calculation of freight billing totals (Tons x Rate/Ton)."
    ]
    for item in live_items:
        p_i = tf_l.add_paragraph()
        p_i.text = f"[+] {item}"
        p_i.font.size = Pt(12.5)
        p_i.font.color.rgb = WHITE_TEXT

    card_target = slide19.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.6), Inches(5.9), Inches(5.3))
    card_target.fill.solid()
    card_target.fill.fore_color.rgb = BG_CARD
    card_target.line.color.rgb = CYAN_ACCENT

    tf_t = card_target.text_frame
    tf_t.word_wrap = True
    p = tf_t.paragraphs[0]
    p.text = "TARGET SAP INTEGRATION LAYER"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = CYAN_ACCENT

    target_items = [
        "Replacing local Excel mock database with live PostgreSQL / SAP HANA database.",
        "Connecting the 7 REST/OData API payload endpoints (SOP v1.0 schema) to SAP Gateway sandbox.",
        "Activating live SAP BTP Document Information Extraction API for real-time PDF scanning.",
        "Enabling OAuth2 / SAP Identity Authentication Service (IAS) SSO login."
    ]
    for item in target_items:
        p_i = tf_t.add_paragraph()
        p_i.text = f"[>] {item}"
        p_i.font.size = Pt(12.5)
        p_i.font.color.rgb = WHITE_TEXT

    # ==========================================
    # SLIDE 20: Roadmap / Next Steps
    # ==========================================
    slide20 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide20)
    add_header(slide20, "Implementation Roadmap", "Phased execution plan for full SAP S/4HANA production rollout", 20, total_slides)

    phases = [
        ("Phase 1 (Months 1–2)", "Database & Auth Core", "Migrate mock state to enterprise PostgreSQL/HANA database; implement SAP IAS (Identity Authentication Service) for secure OAuth2 single sign-on across all 5 user roles."),
        ("Phase 2 (Months 3–4)", "Live SAP OData Sync", "Connect the 7 REST/OData interface endpoints to SAP S/4HANA Gateway sandbox; activate real-time MIRO invoice posting RFCs and SAP ArchiveLink document storage."),
        ("Phase 3 (Months 5–6)", "Mobile OCR & GPS", "Deploy native PWA mobile scanning app with camera OCR capability for drivers on site; integrate real-time GPS telemetry feed for live transit monitoring and automated gate check-ins.")
    ]

    for i, (badge, title, desc) in enumerate(phases):
        left = Inches(0.6 + i * 4.1)
        card = slide20.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.6), Inches(3.9), Inches(5.3))
        card.fill.solid()
        card.fill.fore_color.rgb = BG_CARD
        card.line.color.rgb = BORDER_COLOR

        tf = card.text_frame
        tf.word_wrap = True

        p_b = tf.paragraphs[0]
        p_b.text = badge.upper()
        p_b.font.size = Pt(10)
        p_b.font.bold = True
        p_b.font.color.rgb = CYAN_ACCENT

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(16)
        p_t.font.bold = True
        p_t.font.color.rgb = WHITE_TEXT

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = MUTED_TEXT

    # ==========================================
    # SLIDE 21: Closing / Contact
    # ==========================================
    slide21 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide21)

    t_box21 = slide21.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.333), Inches(3.5))
    tf21 = t_box21.text_frame
    tf21.word_wrap = True

    p0 = tf21.paragraphs[0]
    p0.text = "THANK YOU"
    p0.font.size = Pt(14)
    p0.font.bold = True
    p0.font.color.rgb = CYAN_ACCENT
    p0.alignment = PP_ALIGN.CENTER

    p1 = tf21.add_paragraph()
    p1.text = "Empowering Ikwezi Mining's Freight Logistics"
    p1.font.size = Pt(38)
    p1.font.bold = True
    p1.font.color.rgb = WHITE_TEXT
    p1.alignment = PP_ALIGN.CENTER

    p2 = tf21.add_paragraph()
    p2.text = "Transforming manual paper reconciliation into an automated, auditable, and seamless SAP-integrated transporter platform."
    p2.font.size = Pt(16)
    p2.font.color.rgb = MUTED_TEXT
    p2.alignment = PP_ALIGN.CENTER

    c_card = slide21.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(3.5), Inches(4.8), Inches(6.333), Inches(1.9))
    c_card.fill.solid()
    c_card.fill.fore_color.rgb = BG_CARD
    c_card.line.color.rgb = CYAN_ACCENT

    tf_c = c_card.text_frame
    tf_c.word_wrap = True

    pc1 = tf_c.paragraphs[0]
    pc1.text = "Abhiyanta India Solutions Pvt. Ltd."
    pc1.font.size = Pt(17)
    pc1.font.bold = True
    pc1.font.color.rgb = WHITE_TEXT
    pc1.alignment = PP_ALIGN.CENTER

    pc2 = tf_c.add_paragraph()
    pc2.text = "Engineering & Delivery Project Team"
    pc2.font.size = Pt(13)
    pc2.font.color.rgb = MUTED_TEXT
    pc2.alignment = PP_ALIGN.CENTER

    pc3 = tf_c.add_paragraph()
    pc3.text = "contact@abhiyanta.in   |   www.abhiyanta.in"
    pc3.font.size = Pt(13)
    pc3.font.bold = True
    pc3.font.color.rgb = CYAN_ACCENT
    pc3.alignment = PP_ALIGN.CENTER

    # Save to Downloads directory (Try primary file name, fallback to v2 if locked)
    downloads_path = os.path.expanduser('~/Downloads')
    primary_filename = os.path.join(downloads_path, 'Ikwezi_Transporter_Portal_Production_Deck.pptx')
    fallback_filename = os.path.join(downloads_path, 'Ikwezi_Transporter_Portal_Refined_Deck.pptx')
    
    saved_file = primary_filename
    try:
        prs.save(primary_filename)
        print(f"SUCCESS: Saved refined 21-slide presentation to {primary_filename}")
    except PermissionError:
        prs.save(fallback_filename)
        saved_file = fallback_filename
        print(f"SUCCESS: Saved refined 21-slide presentation to {fallback_filename} (primary file was open in PowerPoint)")

if __name__ == '__main__':
    create_presentation()
