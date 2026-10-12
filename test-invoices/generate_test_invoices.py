#!/usr/bin/env python3
"""
Enterprise S/4HANA Order-to-Cash (O2C) Test Invoice Generator
Generates high-resolution PNG invoices for both MATCH and MISMATCH scenarios across:
  - 1 Box = 1 Ton Standard Payload (15.0 Tons / 15 Boxes)
  - Sales Order reference (SO #2322) & Outbound Delivery (VL03N #80001474)
  - Certified Transporter: Sipho Transport Services
  - Customer Yard: Company Atharv Pharma abc (Pune Siding Yard)
  - Mandatory Official Customer Yard Verification Stamp:
      "OFFLOAD RECEIVED & WEIGHED • CUSTOMER RECEIVING YARD STAMP"
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test-invoices')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Also sync directly to public/uploads/invoices so web client can display or preview them
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'uploads', 'invoices')
os.makedirs(PUBLIC_DIR, exist_ok=True)

def get_fonts():
    try:
        font_title = ImageFont.truetype("arialbd.ttf", 36)
        font_h1 = ImageFont.truetype("arialbd.ttf", 26)
        font_h2 = ImageFont.truetype("arialbd.ttf", 20)
        font_body = ImageFont.truetype("arial.ttf", 18)
        font_body_bold = ImageFont.truetype("arialbd.ttf", 18)
        font_small = ImageFont.truetype("arial.ttf", 15)
        font_stamp = ImageFont.truetype("arialbd.ttf", 22)
        font_stamp_sub = ImageFont.truetype("arialbd.ttf", 15)
    except Exception:
        font_title = font_h1 = font_h2 = font_body = font_body_bold = font_small = font_stamp = font_stamp_sub = ImageFont.load_default()
    return {
        "title": font_title,
        "h1": font_h1,
        "h2": font_h2,
        "body": font_body,
        "body_bold": font_body_bold,
        "small": font_small,
        "stamp": font_stamp,
        "stamp_sub": font_stamp_sub
    }

def draw_stamp(draw, x, y, width=420, height=140, stamp_type="VERIFIED", date_str="09-Oct-2026"):
    """
    Renders an authentic, realistic customer yard receiving stamp.
    """
    if stamp_type == "VERIFIED":
        color = (16, 140, 60) # Deep Green
        fill_bg = (240, 253, 244)
        title_text = "OFFLOAD RECEIVED & WEIGHED"
        sub_text = "CUSTOMER YARD GATE 01 • STAMPED"
        meta_text = f"DATE: {date_str} | WEIGHBRIDGE: OK (15.00 TONS)"
        auth_text = "AUTHORIZED RECEIVER SIGNATURE & SEAL"
    else:
        color = (220, 38, 38) # Crimson Red
        fill_bg = (254, 242, 242)
        title_text = "REJECTED / VARIANCE FLAGGED"
        sub_text = "CUSTOMER YARD GATE 01 • DISCREPANCY"
        meta_text = f"DATE: {date_str} | WEIGHBRIDGE: MISMATCH"
        auth_text = "INSPECTION OFFICER OVERRIDE REQUIRED"

    # Draw rounded rectangle stamp border
    draw.rounded_rectangle([x, y, x + width, y + height], radius=12, outline=color, width=3, fill=fill_bg)
    draw.rounded_rectangle([x + 6, y + 6, x + width - 6, y + height - 6], radius=8, outline=color, width=1)

    fonts = get_fonts()
    # Centered texts
    draw.text((x + 24, y + 16), title_text, fill=color, font=fonts["stamp"])
    draw.text((x + 24, y + 48), sub_text, fill=color, font=fonts["stamp_sub"])
    draw.text((x + 24, y + 74), meta_text, fill=(50, 50, 50), font=fonts["small"])
    draw.text((x + 24, y + 102), f"SEAL NO: YD-REC-{date_str.replace('-', '')}-04 | {auth_text}", fill=color, font=fonts["small"])

def generate_invoice_image(
    filename,
    invoice_no="INV-2026-0001",
    invoice_date="09-Oct-2026",
    vendor_name="Sipho Transport Services",
    vendor_gstin="27AABCS0001A1Z1",
    customer_name="Company Atharv Pharma abc",
    customer_siding="6, Pune Siding Yard, Maharashtra 987789",
    so_no="2322",
    delivery_no="80001474",
    vehicle_reg="MH12AB1234",
    driver_name="Rajesh Kumar",
    line_items=None,
    has_stamp=True,
    stamp_type="VERIFIED",
    rate_per_ton=151.50,
    override_subtotal=None,
    override_tax=None,
    override_total=None,
    is_low_quality=False,
    watermark_note=None
):
    fonts = get_fonts()
    # Dimensions: 1240 x 1754 (High Resolution A4 Canvas @ 150 DPI)
    img = Image.new("RGB", (1240, 1754), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # 1. Header Banner
    draw.rectangle([50, 40, 1190, 160], fill=(8, 84, 160)) # Enterprise SAP Fiori Blue
    draw.text((80, 60), vendor_name.upper(), fill=(255, 255, 255), font=fonts["title"])
    draw.text((80, 112), f"Certified Carrier • GSTIN/VAT: {vendor_gstin} • Fleet Dispatch Siding Gate 01", fill=(210, 230, 255), font=fonts["small"])

    # Document Title Box (Right)
    draw.text((820, 60), "TAX INVOICE & POD", fill=(255, 255, 255), font=fonts["h1"])
    draw.text((820, 102), "ORIGINAL FOR RECIPIENT", fill=(210, 230, 255), font=fonts["small"])
    draw.text((820, 126), f"Invoice Ref: {invoice_no}", fill=(255, 255, 255), font=fonts["body_bold"])

    # 2. Metadata Columns (BILLED TO vs SHIPMENT DETAILS)
    # Left Box: Billed To
    draw.rounded_rectangle([50, 185, 600, 370], radius=8, outline=(226, 232, 240), fill=(248, 250, 252), width=2)
    draw.text((70, 200), "BILLED TO & DESTINATION YARD:", fill=(8, 84, 160), font=fonts["body_bold"])
    draw.text((70, 235), customer_name, fill=(15, 23, 42), font=fonts["h2"])
    draw.text((70, 270), f"Yard Location: {customer_siding}", fill=(71, 85, 105), font=fonts["small"])
    draw.text((70, 298), f"Ship-To Siding Contact: Station Superintendent (Gate 01)", fill=(71, 85, 105), font=fonts["small"])
    draw.text((70, 326), "Payment Term: Closed-Loop SAP MIRO Freight Settlement", fill=(100, 116, 139), font=fonts["small"])

    # Right Box: S/4HANA Order & Transit Details
    draw.rounded_rectangle([640, 185, 1190, 370], radius=8, outline=(226, 232, 240), fill=(248, 250, 252), width=2)
    draw.text((660, 200), "SAP S/4HANA LOGISTICS DISPATCH:", fill=(8, 84, 160), font=fonts["body_bold"])
    
    so_text = f"Sales Order (VA03): #{so_no}" if so_no else "Sales Order: [NOT SPECIFIED / MISSING]"
    draw.text((660, 235), so_text, fill=(15, 23, 42), font=fonts["h2"])
    draw.text((660, 270), f"Outbound Delivery (VL03N): #{delivery_no}", fill=(71, 85, 105), font=fonts["small"])
    draw.text((660, 298), f"Assigned Driver: {driver_name} | Truck: {vehicle_reg}", fill=(71, 85, 105), font=fonts["small"])
    draw.text((660, 326), f"Invoice Date: {invoice_date} | Currency: ZAR", fill=(100, 116, 139), font=fonts["small"])

    # 3. Payload Standard Rule Banner
    draw.rectangle([50, 395, 1190, 440], fill=(238, 242, 255))
    draw.text((70, 408), "STANDARD LOGISTICS PAYLOAD RULE: 1 BOX = 1 TON (1,000 KG) • WEIGHBRIDGE CALIBRATED", fill=(67, 56, 202), font=fonts["body_bold"])

    # 4. Table Header
    tbl_top = 460
    draw.rectangle([50, tbl_top, 1190, tbl_top + 45], fill=(241, 245, 249))
    draw.rectangle([50, tbl_top, 1190, tbl_top + 45], outline=(203, 213, 225), width=1)
    
    draw.text((70, tbl_top + 12), "Item #", fill=(51, 65, 85), font=fonts["body_bold"])
    draw.text((160, tbl_top + 12), "Material Code", fill=(51, 65, 85), font=fonts["body_bold"])
    draw.text((320, tbl_top + 12), "Cargo Description", fill=(51, 65, 85), font=fonts["body_bold"])
    draw.text((640, tbl_top + 12), "Qty (Boxes / Tons)", fill=(51, 65, 85), font=fonts["body_bold"])
    draw.text((860, tbl_top + 12), "Rate (ZAR)", fill=(51, 65, 85), font=fonts["body_bold"])
    draw.text((1030, tbl_top + 12), "Total (ZAR)", fill=(51, 65, 85), font=fonts["body_bold"])

    if line_items is None:
        # Default: 15 Boxes / 15.0 Tons for SO #2322
        line_items = [
            ("10", "1702", "pharma product 01", 5.0, rate_per_ton, 5.0 * rate_per_ton),
            ("20", "1727", "pharma product 10", 5.0, rate_per_ton, 5.0 * rate_per_ton),
            ("30", "1728", "pharma product 09", 5.0, rate_per_ton, 5.0 * rate_per_ton)
        ]

    curr_y = tbl_top + 45
    computed_subtotal = 0.0

    for idx, item in enumerate(line_items):
        item_no, code, desc, qty, rate, line_tot = item
        computed_subtotal += line_tot
        row_bg = (255, 255, 255) if idx % 2 == 0 else (248, 250, 252)
        draw.rectangle([50, curr_y, 1190, curr_y + 45], fill=row_bg, outline=(226, 232, 240), width=1)

        draw.text((70, curr_y + 12), str(item_no), fill=(15, 23, 42), font=fonts["body"])
        draw.text((160, curr_y + 12), code or "—", fill=(15, 23, 42), font=fonts["body"])
        draw.text((320, curr_y + 12), desc, fill=(15, 23, 42), font=fonts["body_bold"])
        draw.text((640, curr_y + 12), f"{qty:.2f} Boxes ({qty:.2f} TO)", fill=(15, 23, 42), font=fonts["body"])
        draw.text((860, curr_y + 12), f"R {rate:.2f}", fill=(71, 85, 105), font=fonts["body"])
        draw.text((1030, curr_y + 12), f"R {line_tot:,.2f}", fill=(15, 23, 42), font=fonts["body_bold"])
        curr_y += 45

    # 5. Financial Summary Box
    summary_y = curr_y + 35
    subtotal = override_subtotal if override_subtotal is not None else computed_subtotal
    tax_amt = override_tax if override_tax is not None else round(subtotal * 0.15, 2)
    grand_total = override_total if override_total is not None else round(subtotal + tax_amt, 2)

    draw.rounded_rectangle([720, summary_y, 1190, summary_y + 180], radius=8, outline=(203, 213, 225), fill=(248, 250, 252), width=2)
    draw.text((750, summary_y + 20), "Subtotal Amount:", fill=(71, 85, 105), font=fonts["body"])
    draw.text((1000, summary_y + 20), f"R {subtotal:,.2f}", fill=(15, 23, 42), font=fonts["body_bold"])

    draw.text((750, summary_y + 60), "VAT Standard (15%):", fill=(71, 85, 105), font=fonts["body"])
    draw.text((1000, summary_y + 60), f"R {tax_amt:,.2f}", fill=(15, 23, 42), font=fonts["body_bold"])

    draw.line([740, summary_y + 105, 1170, summary_y + 105], fill=(203, 213, 225), width=2)

    draw.text((750, summary_y + 125), "Grand Total (ZAR):", fill=(8, 84, 160), font=fonts["h2"])
    draw.text((1000, summary_y + 125), f"R {grand_total:,.2f}", fill=(8, 84, 160), font=fonts["h1"])

    # 6. Official Stamp Section (Left of financial summary)
    if has_stamp:
        draw_stamp(draw, 80, summary_y + 10, width=580, height=150, stamp_type=stamp_type, date_str=invoice_date)
    else:
        # Stamp Box Empty (Unstamped Warning)
        draw.rounded_rectangle([80, summary_y + 10, 660, summary_y + 160], radius=8, outline=(239, 68, 68), width=2, fill=(254, 242, 242))
        draw.text((110, summary_y + 40), "⚠️ UNSTAMPED DOCUMENT", fill=(220, 38, 38), font=fonts["stamp"])
        draw.text((110, summary_y + 75), "NO CUSTOMER RECEIVER STAMP AFFIXED", fill=(185, 28, 28), font=fonts["body_bold"])
        draw.text((110, summary_y + 105), "Customer Yard Gate 01 Verification Required. Settlement Blocked.", fill=(127, 29, 29), font=fonts["small"])

    # 7. Quality Simulation / Noise for Blurry Scan
    if is_low_quality:
        # Degrade image to simulate poor phone camera photo / low resolution scan
        img = img.resize((480, 680), resample=Image.Resampling.BILINEAR)
        img = img.resize((1240, 1754), resample=Image.Resampling.NEAREST)
        draw = ImageDraw.Draw(img)
        # Add gray scan stripes
        for line_y in range(50, 1700, 40):
            draw.line([30, line_y, 1210, line_y + 10], fill=(220, 220, 220), width=2)

    # 8. Footer Legal Note
    draw.line([50, 1650, 1190, 1650], fill=(226, 232, 240), width=2)
    footer_text = f"PODZO S/4HANA Logistics Cloud • Cryptographic Hash Verification • Generated for Trip SO #{so_no or '2322'}"
    draw.text((80, 1675), footer_text, fill=(148, 163, 184), font=fonts["small"])

    # Save to test-invoices and public/uploads/invoices
    filepath_test = os.path.join(OUTPUT_DIR, filename)
    filepath_public = os.path.join(PUBLIC_DIR, filename)
    
    img.save(filepath_test, "PNG", quality=95)
    img.save(filepath_public, "PNG", quality=95)
    print(f"Generated High-Res PNG: {filepath_test}")

def main():
    print("Generating complete suite of Enterprise S/4HANA Order-to-Cash Invoices in PNG format...\n")

    # ═════════════════════════════════════════════════════════════════
    # SCENARIO 1: CLEAN FULL MATCH (STAMPED)
    # ═════════════════════════════════════════════════════════════════
    # 1A. MATCH: Clean 100% Match with Official Customer Stamp (SO #2322, 15 Boxes = 15.0 Tons)
    generate_invoice_image(
        filename="invoice_001_full_match.png",
        invoice_no="INV-2026-0001",
        so_no="2322",
        delivery_no="80001474",
        line_items=[
            ("10", "1702", "pharma product 01", 5.0, 151.50, 757.50),
            ("20", "1727", "pharma product 10", 5.0, 151.50, 757.50),
            ("30", "1728", "pharma product 09", 5.0, 151.50, 757.50),
        ],
        has_stamp=True,
        stamp_type="VERIFIED"
    )

    # 1B. MISMATCH: Unstamped Document (Same data as 001, but MISSING STAMP)
    # "if stamp then only matched okay" -> this will fail Check 0 (STAMP_MISSING)
    generate_invoice_image(
        filename="invoice_002_unstamped_mismatch.png",
        invoice_no="INV-2026-0002",
        so_no="2322",
        delivery_no="80001474",
        line_items=[
            ("10", "1702", "pharma product 01", 5.0, 151.50, 757.50),
            ("20", "1727", "pharma product 10", 5.0, 151.50, 757.50),
            ("30", "1728", "pharma product 09", 5.0, 151.50, 757.50),
        ],
        has_stamp=False # NO STAMP!
    )

    # ═════════════════════════════════════════════════════════════════
    # SCENARIO 2: QUANTITY / PAYLOAD (BOXES & TONS)
    # ═════════════════════════════════════════════════════════════════
    # 2A. MATCH: Clean 30.0 Tons (SO #2320, 30 Boxes = 30.0 Tons)
    generate_invoice_image(
        filename="invoice_003_qty_match_30tons.png",
        invoice_no="INV-2026-0003",
        so_no="2320",
        delivery_no="80001473",
        line_items=[
            ("10", "1702", "pharma product 01", 10.0, 151.50, 1515.00),
            ("20", "1727", "pharma product 10", 10.0, 151.50, 1515.00),
            ("30", "1728", "pharma product 09", 10.0, 151.50, 1515.00),
        ],
        has_stamp=True,
        stamp_type="VERIFIED"
    )

    # 2B. MISMATCH: Quantity Exceeds Tolerance (Invoice shows 35.0 Tons vs SO 15.0 Tons)
    generate_invoice_image(
        filename="invoice_004_qty_mismatch_overload.png",
        invoice_no="INV-2026-0004",
        so_no="2322",
        delivery_no="80001474",
        line_items=[
            ("10", "1702", "pharma product 01", 15.0, 151.50, 2272.50),
            ("20", "1727", "pharma product 10", 10.0, 151.50, 1515.00),
            ("30", "1728", "pharma product 09", 10.0, 151.50, 1515.00),
        ],
        has_stamp=True,
        stamp_type="REJECTED"
    )

    # ═════════════════════════════════════════════════════════════════
    # SCENARIO 3: SALES ORDER & DELIVERY REFERENCE
    # ═════════════════════════════════════════════════════════════════
    # 3A. MATCH: Clean Single Item SO #2318 (Brake Pad, 1 Box = 1 Ton)
    generate_invoice_image(
        filename="invoice_005_so_match_2318.png",
        invoice_no="INV-2026-0005",
        customer_name="Company KK limited",
        customer_siding="05, Wakad Siding, Pune 411057",
        so_no="2318",
        delivery_no="80001469",
        line_items=[
            ("10", "33", "Brake Pad", 1.0, 151.50, 151.50)
        ],
        has_stamp=True,
        stamp_type="VERIFIED"
    )

    # 3B. MISMATCH: Wrong Sales Order Reference (e.g. SO #9999 instead of #2322)
    generate_invoice_image(
        filename="invoice_006_so_mismatch_wrong_order.png",
        invoice_no="INV-2026-0006",
        so_no="9999",
        delivery_no="80009999",
        line_items=[
            ("10", "1702", "pharma product 01", 5.0, 151.50, 757.50),
            ("20", "1727", "pharma product 10", 5.0, 151.50, 757.50),
            ("30", "1728", "pharma product 09", 5.0, 151.50, 757.50),
        ],
        has_stamp=True,
        stamp_type="REJECTED"
    )

    # ═════════════════════════════════════════════════════════════════
    # SCENARIO 4: CARRIER / VENDOR IDENTIFIER
    # ═════════════════════════════════════════════════════════════════
    # 4A. MATCH: Certified Carrier "Sipho Transport Services"
    generate_invoice_image(
        filename="invoice_007_carrier_match_sipho.png",
        invoice_no="INV-2026-0007",
        vendor_name="Sipho Transport Services",
        so_no="2322",
        delivery_no="80001474",
        line_items=[
            ("10", "1702", "pharma product 01", 5.0, 151.50, 757.50),
            ("20", "1727", "pharma product 10", 5.0, 151.50, 757.50),
            ("30", "1728", "pharma product 09", 5.0, 151.50, 757.50),
        ],
        has_stamp=True,
        stamp_type="VERIFIED"
    )

    # 4B. MISMATCH: Uncertified Third-Party Vendor (e.g. Apex Global Logistics)
    generate_invoice_image(
        filename="invoice_008_carrier_mismatch_uncertified.png",
        invoice_no="INV-2026-0008",
        vendor_name="Apex Global Logistics International",
        vendor_gstin="99ZZZ9999Z9Z9",
        so_no="2322",
        delivery_no="80001474",
        line_items=[
            ("10", "1702", "pharma product 01", 5.0, 151.50, 757.50),
            ("20", "1727", "pharma product 10", 5.0, 151.50, 757.50),
            ("30", "1728", "pharma product 09", 5.0, 151.50, 757.50),
        ],
        has_stamp=True,
        stamp_type="REJECTED"
    )

    # ═════════════════════════════════════════════════════════════════
    # SCENARIO 5: FINANCIAL & VAT CALCULATION
    # ════════════════════════════════════════════════════════════════
    # 5A. MATCH: DP WORLD Multi-Material Clean Rate (SO #2321, 30.0 Tons)
    generate_invoice_image(
        filename="invoice_009_multi_item_match_dpworld.png",
        invoice_no="INV-2026-0009",
        customer_name="DP WORLD PVT LTD",
        customer_siding="123, Shivajinagar Siding, Pune 414305",
        so_no="2321",
        delivery_no="80001471",
        line_items=[
            ("100", "99", "chair 01", 10.0, 151.50, 1515.00),
            ("200", "33", "Drilling machine spare part", 10.0, 151.50, 1515.00),
            ("300", "41", "Battery1", 10.0, 151.50, 1515.00),
        ],
        has_stamp=True,
        stamp_type="VERIFIED"
    )

    # 5B. MISMATCH: Financial Rate & Total Inflation (R 99,999 vs expected R 2,613.38)
    generate_invoice_image(
        filename="invoice_010_financial_mismatch_inflated.png",
        invoice_no="INV-2026-0010",
        so_no="2322",
        delivery_no="80001474",
        line_items=[
            ("10", "1702", "pharma product 01", 5.0, 151.50, 757.50),
            ("20", "1727", "pharma product 10", 5.0, 151.50, 757.50),
            ("30", "1728", "pharma product 09", 5.0, 151.50, 757.50),
        ],
        override_total=99999.00,
        override_tax=13043.35,
        has_stamp=True,
        stamp_type="REJECTED"
    )

    # ═════════════════════════════════════════════════════════════════
    # SCENARIO 6: SCAN QUALITY (BLURRY / LOW CONFIDENCE)
    # ═════════════════════════════════════════════════════════════════
    # 6A. MISMATCH: Blurry Low-Resolution Scan with artifacts
    generate_invoice_image(
        filename="invoice_011_blurry_low_quality.png",
        invoice_no="INV-2026-0011",
        so_no="2322",
        delivery_no="80001474",
        line_items=[
            ("10", "1702", "pharma product 01", 5.0, 151.50, 757.50),
            ("20", "1727", "pharma product 10", 5.0, 151.50, 757.50),
            ("30", "1728", "pharma product 09", 5.0, 151.50, 757.50),
        ],
        has_stamp=True,
        stamp_type="VERIFIED",
        is_low_quality=True
    )

    print("\n All 11 High-Resolution PNG Invoices Generated Successfully!")

if __name__ == '__main__':
    main()
