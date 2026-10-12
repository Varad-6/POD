import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)

def create_one_pager():
    target_path = r"C:\Users\Varad\Downloads\PODZO_Joule_Integration_One_Pager.pdf"
    
    # 24 pt (~0.33 in) margins for crisp, balanced 1-page fit
    margin = 24
    doc = SimpleDocTemplate(
        target_path,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=20,
        bottomMargin=18
    )

    # Color Palette matching enterprise reference document
    NAVY = colors.HexColor("#0B3954")
    SAP_BLUE = colors.HexColor("#0854A0")
    LIGHT_BLUE = colors.HexColor("#F0F6FC")
    BORDER_BLUE = colors.HexColor("#C2D9ED")
    ORANGE = colors.HexColor("#E66C37")
    DARK_GRAY = colors.HexColor("#2C3E50")
    MID_GRAY = colors.HexColor("#555555")
    LIGHT_GRAY = colors.HexColor("#F8F9FA")
    GREEN_ACCENT = colors.HexColor("#0F8548")
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=14.5,
        leading=16.5,
        textColor=NAVY
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        fontName='Helvetica',
        fontSize=8.2,
        leading=10.0,
        textColor=SAP_BLUE
    )
    doc_type_style = ParagraphStyle(
        'DocType',
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=9.2,
        textColor=NAVY,
        alignment=2
    )
    doc_meta_style = ParagraphStyle(
        'DocMeta',
        fontName='Helvetica',
        fontSize=6.8,
        leading=8.2,
        textColor=MID_GRAY,
        alignment=2
    )
    sec_title_style = ParagraphStyle(
        'SecTitle',
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=9.2,
        textColor=NAVY
    )
    exec_summary_style = ParagraphStyle(
        'ExecSummary',
        fontName='Helvetica',
        fontSize=7.0,
        leading=9.0,
        textColor=DARK_GRAY
    )
    body_style = ParagraphStyle(
        'BodyDark',
        fontName='Helvetica',
        fontSize=6.6,
        leading=8.3,
        textColor=DARK_GRAY
    )
    table_header = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=6.6,
        leading=8.2,
        textColor=colors.white
    )
    table_cell = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=6.3,
        leading=7.8,
        textColor=DARK_GRAY
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=6.3,
        leading=7.8,
        textColor=NAVY
    )
    code_style = ParagraphStyle(
        'CodeStyle',
        fontName='Courier-Bold',
        fontSize=6.0,
        leading=7.5,
        textColor=SAP_BLUE
    )
    badge_style = ParagraphStyle(
        'BadgeStyle',
        fontName='Helvetica-Bold',
        fontSize=6.2,
        leading=7.6,
        textColor=SAP_BLUE
    )
    footer_style = ParagraphStyle(
        'FooterStyle',
        fontName='Helvetica',
        fontSize=6.3,
        leading=7.3,
        textColor=MID_GRAY
    )
    footer_right = ParagraphStyle(
        'FooterRight',
        fontName='Helvetica',
        fontSize=6.3,
        leading=7.3,
        textColor=MID_GRAY,
        alignment=2
    )

    story = []
    
    # ─── HEADER ROW ──────────────────────────────────────────
    header_left = [
        Paragraph("<b><font color='#0854A0'>PODZO</font> &nbsp; PODZO — SAP Joule AI Integration</b>", title_style),
        Spacer(1, 1),
        Paragraph("Autonomous Natural Language POST / Action Orchestration for SAP S/4HANA Logistics", subtitle_style)
    ]
    header_right = [
        Paragraph("EXECUTIVE ARCHITECTURE BRIEF", doc_type_style),
        Paragraph("Version 1.0 • October 2026 • SAP BTP", doc_meta_style)
    ]
    
    header_table = Table([[header_left, header_right]], colWidths=[415, 149])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=SAP_BLUE, spaceBefore=2, spaceAfter=3))
    
    # ─── EXECUTIVE SUMMARY CALLOUT ───────────────────────────
    summary_text = Paragraph(
        "<b>Executive Summary:</b> PODZO introduces groundbreaking <b>bi-directional transactional (POST / Action) capability</b> to SAP Joule. "
        "While 95%+ of global Joule implementations remain restricted to read-only analytical queries, PODZO empowers Joule to execute closed-loop enterprise actions—"
        "autonomously parsing natural-language prompts to allocate Purchase Orders, assign drivers and fleet, resolve OCR verification exceptions, "
        "and post supplier invoices directly into <b>SAP S/4HANA MIRO</b> financial ledgers with full audit governance on SAP BTP Cloud Foundry.",
        exec_summary_style
    )
    summary_table = Table([[summary_text]], colWidths=[564])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BLUE),
        ('BOX', (0,0), (-1,-1), 0.75, BORDER_BLUE),
        ('LINEBEFORE', (0,0), (0,0), 3.0, SAP_BLUE),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 3.5))
    
    # Helper for Section Title
    def make_section_title(num, title):
        t = Table([
            [Paragraph(f"SECTION {num} — {title.upper()}", sec_title_style)]
        ], colWidths=[564])
        t.setStyle(TableStyle([
            ('LINEBEFORE', (0,0), (0,0), 3, ORANGE),
            ('LEFTPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 1),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ]))
        return t

    # ─── SECTION 1: THE ENTERPRISE BREAKTHROUGH ──────────────
    story.append(make_section_title(1, "The Enterprise Breakthrough: Beyond Read-Only AI"))
    
    p_text = Paragraph(
        "<b>The Industry Dilemma:</b> Over 95% of Joule enterprise implementations today are passive—confined to analytical lookups and HR Q&A. Real-world logistics fulfillment demands active, multi-role transaction execution that traditional assistants cannot govern without fragile, point-to-point hardcoding.<br/>"
        "<b>The PODZO Breakthrough:</b> PODZO establishes a resilient <b>Action Engine</b> on SAP BTP Cloud Foundry. Joule accepts unstructured conversational prompts, performs real-time entity resolution (mapping transporter names, license plates, and PO numbers to internal UUIDs), and executes authenticated multi-role POST mutations with zero manual screen navigation.",
        body_style
    )
    
    # 3 Distinct Stat Cards
    stat_box1 = [
        Paragraph("<b>95%+</b>", ParagraphStyle('St1', fontName='Helvetica-Bold', fontSize=10, leading=11, textColor=ORANGE, alignment=1)),
        Paragraph("Market Joule: Read-Only", ParagraphStyle('St1b', fontName='Helvetica', fontSize=5.8, leading=7.0, textColor=DARK_GRAY, alignment=1))
    ]
    stat_box2 = [
        Paragraph("<b>Top 1%</b>", ParagraphStyle('St2', fontName='Helvetica-Bold', fontSize=10, leading=11, textColor=GREEN_ACCENT, alignment=1)),
        Paragraph("PODZO: Multi-Role POST", ParagraphStyle('St2b', fontName='Helvetica-Bold', fontSize=5.8, leading=7.0, textColor=NAVY, alignment=1))
    ]
    stat_box3 = [
        Paragraph("<b>100%</b>", ParagraphStyle('St3', fontName='Helvetica-Bold', fontSize=10, leading=11, textColor=SAP_BLUE, alignment=1)),
        Paragraph("Logistics Flow Coverage", ParagraphStyle('St3b', fontName='Helvetica', fontSize=5.8, leading=7.0, textColor=DARK_GRAY, alignment=1))
    ]
    
    stat_col = Table([
        [stat_box1],
        [stat_box2],
        [stat_box3]
    ], colWidths=[150])
    stat_col.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_GRAY),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_BLUE),
        ('INNERGRID', (0,0), (-1,-1), 0.4, BORDER_BLUE),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.5),
    ]))
    
    s1_table = Table([[p_text, stat_col]], colWidths=[406, 158])
    s1_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(s1_table)
    story.append(Spacer(1, 3))
    
    # ─── SECTION 2: JOULE TRANSACTIONAL ACTION MATRIX ────────
    story.append(make_section_title(2, "Joule Transactional POST Action Matrix (100% Flow Coverage)"))
    
    action_data = [
        [
            Paragraph("<b>Logistics Phase</b>", table_header),
            Paragraph("<b>Joule Action Endpoint (POST)</b>", table_header),
            Paragraph("<b>Natural Language Conversational Prompt</b>", table_header),
            Paragraph("<b>Target Execution & SAP Impact</b>", table_header)
        ],
        [
            Paragraph("<b>1. Planning</b><br/>Allocation", table_cell_bold),
            Paragraph("<code>POST /api/v3/joule/distribute-po</code>", code_style),
            Paragraph("<i>\"Distribute purchase order 4500001714 to Sipho Transport Services\"</i>", table_cell),
            Paragraph("Creates Job Config #, sets quota windows, locks haulier rate, updates PO to ASSIGNED.", table_cell)
        ],
        [
            Paragraph("<b>2. Dispatch</b><br/>Execution", table_cell_bold),
            Paragraph("<code>POST /api/v3/joule/assign-driver</code>", code_style),
            Paragraph("<i>\"Assign driver Rajesh Kumar with vehicle KV44RCGP to PO 4500001714\"</i>", table_cell),
            Paragraph("Validates driver license & tare capacity, generates Assignment #, readies Weighbridge scale.", table_cell)
        ],
        [
            Paragraph("<b>3. Audit Desk</b><br/>Verification", table_cell_bold),
            Paragraph("<code>POST /api/v3/joule/approve-review</code>", code_style),
            Paragraph("<i>\"Approve review queue exception for assignment 1 - weights verified\"</i>", table_cell),
            Paragraph("Clears OCR variance flags, logs supervisor notes, releases SAP MIRO lock, readies invoice.", table_cell)
        ],
        [
            Paragraph("<b>4. Finance</b><br/>Settlement", table_cell_bold),
            Paragraph("<code>POST /api/v3/joule/post-miro</code>", code_style),
            Paragraph("<i>\"Post parked MIRO invoice to SAP Financial Ledger\"</i>", table_cell),
            Paragraph("Executes BAPI/RFC ledger posting, generates SAP FI Reference, readies AP bank payment.", table_cell)
        ]
    ]
    
    action_table = Table(action_data, colWidths=[66, 144, 177, 177])
    action_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SAP_BLUE),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_BLUE),
        ('INNERGRID', (0,0), (-1,-1), 0.4, BORDER_BLUE),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_GRAY]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(action_table)
    story.append(Spacer(1, 3))
    
    # ─── SECTION 3: SYSTEM ARCHITECTURE & INTEGRATION ────────
    story.append(make_section_title(3, "Agentic Architecture & SAP BTP Co-Pilot Integration"))
    
    arch_box1 = [
        Paragraph("<b>1. SAP Build Work Zone & Joule Studio</b>", badge_style),
        Paragraph("• Natural language intent classification<br/>• OpenAPI 3.0 Action Project catalog<br/>• Standard BTP Destination token exchange", body_style)
    ]
    arch_box2 = [
        Paragraph("<b>2. PODZO BTP Runtime & Action Engine</b>", badge_style),
        Paragraph("• Dual-Role RBAC Context (CA / TA adaptation)<br/>• Fuzzy Name & PO Resolver Engine<br/>• SQLite WAL / HANA Cloud + Sync Logging", body_style)
    ]
    arch_box3 = [
        Paragraph("<b>3. SAP S/4HANA System of Record</b>", badge_style),
        Paragraph("• Real-time PO (ME23N) & Contract (ME33K) sync<br/>• Automated SES (ML81N) generation<br/>• MIRO Supplier Invoice Parking & Ledger Posting", body_style)
    ]
    
    arch_table = Table([[arch_box1, arch_box2, arch_box3]], colWidths=[186, 192, 186])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BLUE),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_BLUE),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_BLUE),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 3))
    
    # ─── SECTION 4: 6-STEP AUTONOMOUS EXECUTION WORKFLOW ──────
    story.append(make_section_title(4, "End-to-End Autonomous Execution Sequence"))
    
    step_headers = [
        [
            Paragraph("<b>STEP 1</b><br/>User Prompt", table_cell_bold),
            Paragraph("<b>STEP 2</b><br/>Action Trigger", table_cell_bold),
            Paragraph("<b>STEP 3</b><br/>Entity Resolution", table_cell_bold),
            Paragraph("<b>STEP 4</b><br/>BTP State Write", table_cell_bold),
            Paragraph("<b>STEP 5</b><br/>S/4HANA Sync", table_cell_bold),
            Paragraph("<b>STEP 6</b><br/>Joule Feedback", table_cell_bold),
        ],
        [
            Paragraph("User speaks/types natural intent in Work Zone", table_cell),
            Paragraph("Joule Studio calls target BTP POST endpoint", table_cell),
            Paragraph("Fuzzy resolver maps haulier, driver, PO to UUIDs", table_cell),
            Paragraph("Executes POST mutation, updating job configs/runs", table_cell),
            Paragraph("Triggers S/4HANA mirror sync & audit log", table_cell),
            Paragraph("Returns structured card with SAP Ref # & status", table_cell),
        ]
    ]
    step_table = Table(step_headers, colWidths=[94, 94, 94, 94, 94, 94])
    step_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), LIGHT_GRAY),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_BLUE),
        ('INNERGRID', (0,0), (-1,-1), 0.4, BORDER_BLUE),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 1.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.5),
        ('LEFTPADDING', (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(step_table)
    story.append(Spacer(1, 3))
    
    # ─── SECTION 5: ENTERPRISE VALUE & ROI IMPACT ────────────
    story.append(make_section_title(5, "Enterprise Value & Strategic Competitive Edge"))
    
    val1 = [
        Paragraph("<b>Zero-Touch Execution</b>", badge_style),
        Paragraph("Eliminates navigation across 15+ complex SAP screens (ME23N, VLPOD, MIRO, MIGO), condensing multi-department logistics workflows into rapid conversational actions.", body_style)
    ]
    val2 = [
        Paragraph("<b>Complete Audit Compliance</b>", badge_style),
        Paragraph("Every Joule POST mutation is immutably logged with bearer token credentials, timestamp, payload JSON, and S/4HANA reference keys in <code>sap_sync_log</code>.", body_style)
    ]
    val3 = [
        Paragraph("<b>Dispute-Free Invoicing</b>", badge_style),
        Paragraph("Joule seamlessly connects 4-point weighbridge validation with OCR-assisted POD approval, preventing billing leakage before MIRO financial ledger posting.", body_style)
    ]
    val4 = [
        Paragraph("<b>Zero Extra Haulier Licenses</b>", badge_style),
        Paragraph("External hauliers and dispatchers participate directly via Joule-powered Work Zone interfaces without requiring expensive full-use SAP enterprise licenses.", body_style)
    ]
    
    val_table = Table([
        [val1, val2],
        [val3, val4]
    ], colWidths=[280, 280])
    val_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_GRAY),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_BLUE),
        ('INNERGRID', (0,0), (-1,-1), 0.4, BORDER_BLUE),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(val_table)
    story.append(Spacer(1, 3.5))
    
    # ─── FOOTER ROW ──────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.75, color=BORDER_BLUE, spaceBefore=1, spaceAfter=2))
    footer_table = Table([
        [
            Paragraph("<b>PODZO</b> • SAP Joule Autonomous Action Architecture Brief • Confidential", footer_style),
            Paragraph("Page 1 of 1", footer_right)
        ]
    ], colWidths=[454, 110])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(footer_table)
    
    # Build Document
    doc.build(story)
    print(f"Successfully generated 1-page document at: {target_path}")

if __name__ == "__main__":
    create_one_pager()
