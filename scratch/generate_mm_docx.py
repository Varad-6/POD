import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CCCCCC", sz="4", val="single"):
    tblPr = table._element.xpath('w:tblPr')
    if tblPr:
        borders = parse_xml(f'''
            <w:tblBorders {nsdecls("w")}>
                <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:left w:val="none"/>
                <w:right w:val="none"/>
            </w:tblBorders>
        ''')
        tblPr[0].append(borders)

def build_docx():
    output_path = r"C:\Users\Varad\Downloads\SAP_MM_Team_Contracts_and_POs_Specification.docx"
    doc = docx.Document()
    
    # Page Setup - Normal Margins (1 inch)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Styling Palette
    COLOR_PRIMARY = RGBColor(11, 25, 44)     # Deep Navy (#0B192C)
    COLOR_ACCENT = RGBColor(30, 62, 98)      # Royal Slate (#1E3E62)
    COLOR_ORANGE = RGBColor(241, 90, 36)     # Ikwezi Orange (#F15A24)
    COLOR_DARK = RGBColor(30, 41, 59)        # Slate Dark (#1E293B)
    COLOR_MUTED = RGBColor(100, 116, 139)    # Muted Grey (#64748B)

    HEX_PRIMARY = "0B192C"
    HEX_LIGHT_BG = "F8FAFC"
    HEX_ZEBRA = "F1F5F9"
    HEX_BORDER = "CBD5E1"
    HEX_ORANGE_BG = "FFEDD5"

    # Set Default Normal Font
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = COLOR_DARK

    # Document Header Title Block
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = p_title.add_run("SAP S/4HANA MATERIALS MANAGEMENT (MM)")
    run_title.font.size = Pt(24)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_sub.add_run("Master Contracts & Purchase Orders Data Dictionary & Operational Specification\n")
    run_sub.font.size = Pt(14)
    run_sub.font.bold = True
    run_sub.font.color.rgb = COLOR_ORANGE

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_meta = p_meta.add_run("Document Version: v2.5 | Target Client: Ikwezi Mining Limited | Environment: SAP S/4HANA (On-Premise) + Transporter Portal\nPrepared by: Senior Enterprise SAP MM & Supply Chain Architect (20+ Years SAP Experience)\nDate: August 2026")
    run_meta.font.size = Pt(9.5)
    run_meta.font.italic = True
    run_meta.font.color.rgb = COLOR_MUTED

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Helper function for Headings
    def add_heading_1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return h

    def add_heading_2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = COLOR_ACCENT
        return h

    def add_heading_3(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(2)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.font.size = Pt(11.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_ORANGE
        return h

    # Section 1: Executive Summary
    add_heading_1("1. Executive Summary & Integration Principles")
    p = doc.add_paragraph()
    p.add_run("This technical specification document establishes the official data structure, field dictionaries, and operational test scenarios for the Materials Management (MM) module of ").font.color.rgb = COLOR_DARK
    r_bold = p.add_run("Ikwezi Mining Limited")
    r_bold.font.bold = True
    p.add_run(". It acts as the authoritative reference for MM Purchasing Officers, SAP Basis/ABAP developers, and the Transporter Portal delivery team.\n\n"
              "To maintain SAP 'Clean Core' principles, all custom transport management logic operates side-by-side on the React Transporter Portal, while standard SAP MM core tables (")
    p.add_run("EKKO, EKPO, EKKN, KONV, MSEG, RBKP, RSEG").font.bold = True
    p.add_run(") remain standard and are integrated via 7 secure custom OData/REST endpoints exposed through SAP Gateway HTTPS.")

    # Callout Box
    table_callout = doc.add_table(rows=1, cols=1)
    table_callout.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table_callout.cell(0, 0)
    set_cell_background(cell, HEX_ORANGE_BG)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    p_c = cell.paragraphs[0]
    p_c.paragraph_format.space_after = Pt(0)
    r_c_title = p_c.add_run("📌 MM PURCHASING TEAM CORE DIRECTIVE:\n")
    r_c_title.font.bold = True
    r_c_title.font.size = Pt(10.5)
    r_c_title.font.color.rgb = RGBColor(194, 65, 12)
    r_c_body = p_c.add_run(
        "1. Every Purchase Order (PO) created in SAP (ME21N) MUST map to a valid released SAP Quantity Contract (ME31K).\n"
        "2. The MM team must populate both Mass Units (TON/KG) and Unit-Based UOMs (BAG, BTL, BOX, DRUM, PAL, PCS, SET) to support multi-product logistics.\n"
        "3. Every PO must contain default weight tolerance limits (±0.5% standard) and specify 4-Point Weighbridge requirements."
    )
    r_c_body.font.size = Pt(10)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Section 2: Data Dictionary - Contracts
    add_heading_1("2. SAP Contract Data Dictionary (EKKO & EKPO Tables)")
    doc.add_paragraph("The table below details every field required when creating SAP Quantity Contracts (Transaction ME31K / BAPI_CONTRACT_CREATEFROMDATA):")

    headers_contract = ["Field Technical Name", "SAP Table", "Data Type", "Length", "Mandatory", "Description & Portal Mapping"]
    rows_contract = [
        ["EBELN", "EKKO", "CHAR", "10", "Yes (Auto)", "Contract Document Number (e.g., 40000014)"],
        ["BSART", "EKKO", "CHAR", "4", "Yes", "Document Type (MK = Quantity Contract, WK = Value Contract)"],
        ["EKORG", "EKKO", "CHAR", "4", "Yes", "Purchasing Organization (e.g., 1000 - Ikwezi Mining)"],
        ["EKGRP", "EKKO", "CHAR", "3", "Yes", "Purchasing Group (e.g., M01 - Bulk Coal, M02 - Freight)"],
        ["LIFNR", "EKKO", "CHAR", "10", "Yes", "Vendor / Sold-to Party Code (e.g., VND_131 - Company KK Ltd)"],
        ["KDATB", "EKKO", "DATS", "8", "Yes", "Contract Validity Start Date (YYYYMMDD)"],
        ["KDATE", "EKKO", "DATS", "8", "Yes", "Contract Validity End Date (YYYYMMDD)"],
        ["WAERS", "EKKO", "CUKY", "5", "Yes", "Currency Key (ZAR - South African Rand)"],
        ["EBELP", "EKPO", "NUMC", "5", "Yes", "Line Item Number (e.g., 00010)"],
        ["MATNR", "EKPO", "CHAR", "18", "Yes", "Material Master Number (e.g., MAT-COAL-01)"],
        ["TXZ01", "EKPO", "CHAR", "40", "Yes", "Product Short Text / Quality Description (e.g., SL BIT 20%ASH)"],
        ["KTMNG", "EKPO", "QUAN", "13,3", "Yes", "Target Quantity (e.g., 10,000 TON / 5,000 BAGS)"],
        ["MEINS", "EKPO", "UNIT", "3", "Yes", "Base Unit of Measure (TON, BAG, BTL, BOX, DRUM, PAL, PCS, SET)"],
        ["NETPR", "EKPO", "CURR", "11,2", "Yes", "Net Rate per UOM in ZAR (e.g., R151.50/TON)"],
        ["PEINH", "EKPO", "DEC", "5", "Yes", "Price Unit (Default: 1)"],
        ["WERKS", "EKPO", "CHAR", "4", "Yes", "Plant / Loading Site (e.g., 2004 - Emoyeni Washplant)"],
        ["LGORT", "EKPO", "CHAR", "4", "Yes", "Storage Location (e.g., RB01 - Richards Bay Storage)"]
    ]

    t_contract = doc.add_table(rows=len(rows_contract) + 1, cols=6)
    t_contract.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_contract)

    for i, h in enumerate(headers_contract):
        c = t_contract.cell(0, i)
        set_cell_background(c, HEX_PRIMARY)
        set_cell_margins(c, 100, 100, 120, 120)
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    for r_idx, row_data in enumerate(rows_contract):
        bg = HEX_ZEBRA if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            c = t_contract.cell(r_idx + 1, c_idx)
            set_cell_background(c, bg)
            set_cell_margins(c, 80, 80, 100, 100)
            p = c.paragraphs[0]
            if c_idx in [2, 3, 4]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(val)
            r.font.size = Pt(9)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 3: Data Dictionary - Purchase Orders
    add_heading_1("3. SAP Purchase Order Data Dictionary (ME21N Equivalent)")
    doc.add_paragraph("The table below details all mandatory fields required when MM Purchasing Officers release Purchase Orders against master contracts:")

    headers_po = ["Field Technical Name", "SAP Table", "Data Type", "Length", "Mandatory", "Description & Business Logic"]
    rows_po = [
        ["EBELN", "EKKO", "CHAR", "10", "Yes (Auto)", "Purchase Order Number (e.g., PO-41000001)"],
        ["KONNR", "EKKO", "CHAR", "10", "Yes", "Reference Contract Number (e.g., 40000014)"],
        ["LIFNR", "EKKO", "CHAR", "10", "Yes", "Transporter Carrier Code (e.g., Sipho Transport Services)"],
        ["BEDAT", "EKKO", "DATS", "8", "Yes", "PO Creation Date"],
        ["ZTERM", "EKKO", "CHAR", "4", "Yes", "Payment Terms Key (e.g., Z030 - 30 Days Net from Invoice)"],
        ["KOSTL", "EKKN", "CHAR", "10", "Yes", "Cost Center Allocation (e.g., CC-MINE-01, CC-LOG-02)"],
        ["MENGE", "EKPO", "QUAN", "13,3", "Yes", "Target Order Quantity in UOM"],
        ["MEINS", "EKPO", "UNIT", "3", "Yes", "UOM (TON, BAG, BTL, BOX, DRUM, PAL, PCS, SET)"],
        ["NETWR", "EKPO", "CURR", "13,2", "Yes", "Total Net Line Order Value (MENGE × NETPR)"],
        ["UEBTK", "EKPO", "CHAR", "1", "No", "Unlimited Over-delivery Allowed (Indicator X/Blank)"],
        ["UEBTO", "EKPO", "DEC", "3,1", "Yes", "Over-delivery Tolerance Percentage (e.g., 5.0%)"],
        ["UNTTO", "EKPO", "DEC", "3,1", "Yes", "Under-delivery Tolerance Percentage (e.g., 5.0%)"],
        ["ZBILTY", "CUSTOM", "CHAR", "16", "Yes", "Generated Bilty / Lorry Receipt Number (e.g., BLT-770101)"],
        ["ZDRV_LIC", "CUSTOM", "CHAR", "16", "Yes", "Driver Heavy Vehicle License Number (e.g., DL-850912-EC)"],
        ["ZLIC_EXP", "CUSTOM", "DATS", "8", "Yes", "Driver License Expiration Date (YYYYMMDD)"]
    ]

    t_po = doc.add_table(rows=len(rows_po) + 1, cols=6)
    t_po.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_po)

    for i, h in enumerate(headers_po):
        c = t_po.cell(0, i)
        set_cell_background(c, HEX_PRIMARY)
        set_cell_margins(c, 100, 100, 120, 120)
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    for r_idx, row_data in enumerate(rows_po):
        bg = HEX_ZEBRA if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            c = t_po.cell(r_idx + 1, c_idx)
            set_cell_background(c, bg)
            set_cell_margins(c, 80, 80, 100, 100)
            p = c.paragraphs[0]
            if c_idx in [2, 3, 4]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(val)
            r.font.size = Pt(9)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 4: Deep-Dive 5 Contracts Specification
    add_heading_1("4. Deep-Dive Specification of the 5 Master Contracts")
    doc.add_paragraph("The MM purchasing team must maintain 5 diverse master contracts in SAP, spanning bulk weight, bagged goods, packaged liquids, hardware, and heavy machinery:")

    contracts_detail = [
        {
            "num": "40000014",
            "name": "Export Bituminous Bulk Coal Contract",
            "prod": "SL BIT 20%ASH (Bituminous Lump Coal)",
            "uom": "TON (Metric Tons)",
            "qty": "10,000 TON",
            "rate": "R151.50 / TON",
            "val": "R1,515,000.00",
            "route": "2004 Ikw_Emoyeni Wash Plant → IKW_RICHARDS BAY (RB_Storage Loc)",
            "terms": "30 Days Net from SAP MIRO Invoice Parking",
            "desc": "Primary bulk coal export contract. Tested via 4-Point Weighbridge (Mine Tare/Gross + Customer Gross/Tare)."
        },
        {
            "num": "40000015",
            "name": "Bagged Industrial Fertilizer & Cement Contract",
            "prod": "FERT_50KG_BAG (50kg Heavy-Duty Woven Bags)",
            "uom": "BAG (50kg Bags) & PAL (Pallets)",
            "qty": "15,000 BAGS (Equivalent 750 Tons)",
            "rate": "R45.00 / BAG",
            "val": "R675,000.00",
            "route": "3002 BCD_Coal Fields → BCD_RICHARDS BAY Yard",
            "terms": "15 Days Early Clearance Terms",
            "desc": "Bagged unitized cargo contract. Tests piece/unit counts, torn packaging spillage, and damaged bag weight deductions."
        },
        {
            "num": "40000016",
            "name": "Packaged Chemical Reagents & Fluid Drums Contract",
            "prod": "DEF_ADBLUE_20L (20L Bottles) & SOLVENT_200L (200L Drums)",
            "uom": "BTL (Bottles) & DRUM (200L Steel Drums)",
            "qty": "25,000 BOTTLES / DRUMS",
            "rate": "R28.00 / BTL (R1,200.00 / DRUM)",
            "val": "R1,850,000.00",
            "route": "Belfast Chemical Pit → Woestalleen Storage Siding",
            "terms": "45 Days Corporate Eskom Contract Terms",
            "desc": "Fluid & chemical packaging contract. Tests liquid leakage, missing container count, and chemical contamination."
        },
        {
            "num": "40000017",
            "name": "Containerized Equipment Spare Parts & Hardware Contract",
            "prod": "SPARE_PARTS_BOX (Master Cartons & Spare Parts Boxes)",
            "uom": "BOX (Corrugated Boxes) & CTN (Cartons)",
            "qty": "20,000 BOXES",
            "rate": "R125.00 / BOX",
            "val": "R2,500,000.00",
            "route": "Ilima Central Warehouse → RICHARDSBAY MPT707 Port Yard",
            "terms": "30 Days Letter of Credit (LC)",
            "desc": "Hardware & spares contract. Tests barcode/OCR box matching, missing carton counts, and container seal verifications."
        },
        {
            "num": "40000018",
            "name": "Heavy Mining Machinery & Structural Steel Components Contract",
            "prod": "CRUSHER_JAW_PLATE (Machined Crusher Plates & Cylinders)",
            "uom": "PCS (Individual Pieces) & SET (Equipment Sets)",
            "qty": "12,000 PIECES",
            "rate": "R3,400.00 / PCS",
            "val": "R40,800,000.00",
            "route": "Klipfontein Heavy Pit → Newcastle Industrial Complex",
            "terms": "Cash On Delivery (COD) / 7 Days Clearance",
            "desc": "Heavy capital equipment contract. Tests high-value single piece verification, serial number matching, and physical defect reports."
        }
    ]

    for c in contracts_detail:
        add_heading_2(f"Contract {c['num']}: {c['name']}")
        p = doc.add_paragraph()
        p.add_run(f"• Material / Product: ").font.bold = True
        p.add_run(f"{c['prod']}\n")
        p.add_run(f"• Unit of Measure (UOM): ").font.bold = True
        p.add_run(f"{c['uom']}\n")
        p.add_run(f"• Target Contract Quantity: ").font.bold = True
        p.add_run(f"{c['qty']} | Rate: {c['rate']} | Net Value: {c['val']}\n")
        p.add_run(f"• Route Corridor: ").font.bold = True
        p.add_run(f"{c['route']}\n")
        p.add_run(f"• Payment Terms: ").font.bold = True
        p.add_run(f"{c['terms']}\n")
        p.add_run(f"• Purpose & Testing Scope: ").font.bold = True
        p.add_run(f"{c['desc']}")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 5: Exhaustive 50 POs Operational Scenario Matrix
    add_heading_1("5. Comprehensive Specification of All 50 Initial Purchase Orders")
    doc.add_paragraph("To ensure complete end-to-end testing of every supply chain scenario, the 50 initial Purchase Orders (10 per contract) are structured across 10 operational test cases:")

    # Table of 10 Scenario Rules
    add_heading_2("The 10 Operational Supply Chain Test Scenarios")
    scenarios_summary = [
        ["1. Perfect Match", "100% quantity delivered, 0 damage, 0 loss. Auto-approved instantly."],
        ["2. Short Loading", "Ordered quantity exceeds loaded quantity. Invoice adjusted to actual delivered weight."],
        ["3. Damaged Cargo", "Damaged units/bags recorded at customer yard. Damaged weight deducted from net payable payload."],
        ["4. Transit Spillage", "Cargo lost in transit (e.g. 1.80 Tons missing). Flagged for spillage deduction."],
        ["5. Moisture Loss", "Dry en-route shrinkage (e.g. 0.50 Tons water evaporation). 1-Click Operational Exception Override applied."],
        ["6. Over-Delivery", "Truck loaded +5.0% over PO quantity within contract upper tolerance limit."],
        ["7. Expired Driver License", "Driver license or PrDP permit expired. Flagged at weighbridge gate check-in."],
        ["8. Low OCR Scan", "Blurry/low-resolution POD scan. Flagged for manual admin audit."],
        ["9. Quality Rejection", "Customer rejects shipment due to high ash/contamination. Status set to DELIVERED_FAILED."],
        ["10. Bilty Mismatch", "Lorry Receipt (Bilty) number or declared value differs from SAP record. Flagged in verification queue."]
    ]

    t_scen = doc.add_table(rows=len(scenarios_summary) + 1, cols=2)
    t_scen.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_scen)

    t_scen.cell(0, 0).paragraphs[0].add_run("Scenario Name").font.bold = True
    t_scen.cell(0, 1).paragraphs[0].add_run("Operational Business Condition & Portal Behavior").font.bold = True
    set_cell_background(t_scen.cell(0, 0), HEX_PRIMARY)
    set_cell_background(t_scen.cell(0, 1), HEX_PRIMARY)
    t_scen.cell(0, 0).paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    t_scen.cell(0, 1).paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)

    for idx, (s_name, s_desc) in enumerate(scenarios_summary):
        c0 = t_scen.cell(idx + 1, 0)
        c1 = t_scen.cell(idx + 1, 1)
        set_cell_background(c0, HEX_ZEBRA if idx % 2 == 1 else "FFFFFF")
        set_cell_background(c1, HEX_ZEBRA if idx % 2 == 1 else "FFFFFF")
        r0 = c0.paragraphs[0].add_run(s_name)
        r0.font.bold = True
        r0.font.size = Pt(9)
        r1 = c1.paragraphs[0].add_run(s_desc)
        r1.font.size = Pt(9)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Master Table of 50 POs
    add_heading_2("Master Initial PO Dataset (50 POs across 5 Contracts)")
    doc.add_paragraph("Below is the complete 50 PO master matrix pre-populated in the initial server mock dataset:")

    headers_50pos = ["PO Number", "Contract", "UOM", "Target Qty", "Rate (ZAR)", "Transporter Carrier", "PO Status", "Operational Test Scenario"]
    
    transporters = ["Sipho Transport Services", "VDM Transport", "CBS Logistics", "ONYX Logistics", "MPL Transport"]
    uoms = ["TON", "BAG", "BTL", "BOX", "PCS"]
    statuses = ["PENDING_ASSIGNMENT", "ACCEPTED_SIGNED", "DRIVER_ASSIGNED", "SUPERVISOR_APPROVED", "EN_ROUTE", "DELIVERED_STAMPED", "POD_SUBMITTED", "POD_APPROVED", "POSTED", "PAID"]
    scenarios_list = [
        "1. Perfect Match",
        "2. Short Loading (-8%)",
        "3. Damaged Goods (15 Units)",
        "4. Transit Spillage (-1.8T)",
        "5. Moisture Shrinkage (-0.5T)",
        "6. Over-Delivery (+4.5%)",
        "7. Expired Driver License Alert",
        "8. Blurry OCR Scan Review",
        "9. Customer Quality Rejection",
        "10. Bilty Document Mismatch"
    ]

    rows_50pos = []
    po_counter = 41000001
    
    for c_idx in range(5):
        contract_num = str(40000014 + c_idx)
        uom_curr = uoms[c_idx]
        
        for po_idx in range(10):
            po_num_str = f"PO-{po_counter}"
            trans_curr = transporters[(po_idx + c_idx) % len(transporters)]
            stat_curr = statuses[po_idx]
            scen_curr = scenarios_list[po_idx]
            
            if uom_curr == "TON":
                qty_val = 1000 + (po_idx * 100)
                rate_val = 151.50
            elif uom_curr == "BAG":
                qty_val = 500 + (po_idx * 150)
                rate_val = 45.00
            elif uom_curr == "BTL":
                qty_val = 2500 + (po_idx * 500)
                rate_val = 28.00
            elif uom_curr == "BOX":
                qty_val = 450 + (po_idx * 100)
                rate_val = 125.00
            else: # PCS
                qty_val = 75 + (po_idx * 15)
                rate_val = 3400.00
                
            rows_50pos.append([
                po_num_str,
                contract_num,
                uom_curr,
                f"{qty_val:,}",
                f"R{rate_val:,.2f}",
                trans_curr,
                stat_curr,
                scen_curr
            ])
            po_counter += 1

    t_50 = doc.add_table(rows=len(rows_50pos) + 1, cols=8)
    t_50.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_50)

    for i, h in enumerate(headers_50pos):
        c = t_50.cell(0, i)
        set_cell_background(c, HEX_PRIMARY)
        set_cell_margins(c, 80, 80, 100, 100)
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    for r_idx, row_data in enumerate(rows_50pos):
        bg = HEX_ZEBRA if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            c = t_50.cell(r_idx + 1, c_idx)
            set_cell_background(c, bg)
            set_cell_margins(c, 60, 60, 80, 80)
            p = c.paragraphs[0]
            if c_idx in [0, 1, 2, 6]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            elif c_idx in [3, 4]:
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            r = p.add_run(val)
            r.font.size = Pt(8)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 6: MM Team Actionable Checklist & SAP T-Codes
    add_heading_1("6. MM Team Standard Operating Procedures & SAP Transaction Guide")
    doc.add_paragraph("The MM Purchasing Officers can reference the following SAP T-Codes and operational checklist when creating, maintaining, and releasing contracts and POs:")

    tcodes = [
        ["ME31K", "Create Outline Agreement / Contract", "Create master contract specifying target quantity, rates, plant, and UOM."],
        ["ME32K", "Change Contract", "Update contract validity dates, pricing condition rates, or quantity limits."],
        ["ME33K", "Display Contract", "Review total target contract volume vs. cumulative call-off PO quantities."],
        ["ME21N", "Create Purchase Order", "Release PO referencing contract (KONNR). Assign transporter carrier (LIFNR) & cost center."],
        ["ME22N", "Change Purchase Order", "Adjust PO delivery schedules, over-delivery tolerances, or line item details."],
        ["MIGO", "Goods Receipt / Weighbridge Log", "Record pre-dispatch siding weights & customer offload weights against waybill."],
        ["MIRO", "Park / Post Vendor Freight Invoice", "Verify auto-calculated freight charges based on net accepted cargo weight."]
    ]

    t_code_table = doc.add_table(rows=len(tcodes) + 1, cols=3)
    t_code_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_code_table)

    t_code_table.cell(0, 0).paragraphs[0].add_run("SAP T-Code").font.bold = True
    t_code_table.cell(0, 1).paragraphs[0].add_run("Transaction Description").font.bold = True
    t_code_table.cell(0, 2).paragraphs[0].add_run("MM Team Operational Function").font.bold = True

    for i in range(3):
        set_cell_background(t_code_table.cell(0, i), HEX_PRIMARY)
        t_code_table.cell(0, i).paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)

    for idx, (tc, desc, fn) in enumerate(tcodes):
        c0 = t_code_table.cell(idx + 1, 0)
        c1 = t_code_table.cell(idx + 1, 1)
        c2 = t_code_table.cell(idx + 1, 2)
        bg = HEX_ZEBRA if idx % 2 == 1 else "FFFFFF"
        set_cell_background(c0, bg)
        set_cell_background(c1, bg)
        set_cell_background(c2, bg)
        
        r0 = c0.paragraphs[0].add_run(tc)
        r0.font.bold = True
        r0.font.size = Pt(9)
        c0.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        r1 = c1.paragraphs[0].add_run(desc)
        r1.font.size = Pt(9)
        
        r2 = c2.paragraphs[0].add_run(fn)
        r2.font.size = Pt(9)

    doc.save(output_path)
    print(f"Successfully generated DOCX at: {output_path}")

if __name__ == "__main__":
    build_docx()
