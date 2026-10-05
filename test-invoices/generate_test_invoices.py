#!/usr/bin/env python3
"""
Generate realistic synthetic PDF invoices for testing the ProdOps Additive Invoice OCR Integration.
Uses PyMuPDF (fitz) to draw production-grade, professional invoice layouts.
"""
import os
import shutil
import fitz # PyMuPDF

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test-invoices')
os.makedirs(OUTPUT_DIR, exist_ok=True)

def draw_invoice(
    filepath,
    invoice_no="INV-2026-0001",
    invoice_date="05-Oct-2026",
    vendor_name="Sipho Transport Services",
    vendor_gstin="27AABCS0001A1Z1",
    customer_name="PODZO Mining – Emoyeni Siding",
    po_no="4500001714",
    delivery_no="WB-998801",
    vehicle_reg="KV44RCGP",
    line_items=None,
    tax_override=None,
    total_override=None,
    is_low_quality=False,
    omit_po=False
):
    if line_items is None:
        line_items = [
            ("40006653", "SL BIT 20%ASH (40006653)", 34.0, 151.50, 5151.00)
        ]

    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4

    # Header branding
    # Blue banner header
    page.draw_rect(fitz.Rect(30, 30, 565, 85), color=(0.1, 0.3, 0.6), fill=(0.93, 0.95, 0.98))
    page.insert_text((45, 60), vendor_name, fontsize=16, fontname="helv", fontfile=None, color=(0.1, 0.25, 0.55))
    page.insert_text((45, 75), f"GSTIN / VAT: {vendor_gstin} | Licensed Bulk Freight Carrier", fontsize=9, color=(0.3, 0.35, 0.4))

    page.insert_text((420, 60), "TAX INVOICE", fontsize=15, fontname="helv", color=(0.1, 0.25, 0.55))
    page.insert_text((420, 75), f"Original for Recipient", fontsize=8, color=(0.4, 0.4, 0.4))

    # Meta Section: Two columns
    # Left column: Billed To
    y = 110
    page.insert_text((45, y), "BILLED TO / DESTINATION:", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((45, y + 15), customer_name, fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((45, y + 28), "Emoyeni Siding, Witbank, ZA", fontsize=8, color=(0.3, 0.3, 0.3))
    page.insert_text((45, y + 41), f"Delivery Ref: {delivery_no}", fontsize=8, color=(0.3, 0.3, 0.3))
    page.insert_text((45, y + 54), f"Truck / Vehicle Reg: {vehicle_reg}", fontsize=8, color=(0.3, 0.3, 0.3))

    # Right column: Invoice Metadata
    page.insert_text((350, y), "INVOICE DETAILS:", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((350, y + 15), f"Invoice Number: {invoice_no}", fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((350, y + 28), f"Invoice Date: {invoice_date}", fontsize=9, color=(0.3, 0.3, 0.3))
    if not omit_po:
        page.insert_text((350, y + 41), f"PO Number: {po_no}", fontsize=10, fontname="helv", color=(0.1, 0.25, 0.55))
        page.insert_text((350, y + 54), "Payment Terms: Immediate upon Delivery POD", fontsize=8, color=(0.3, 0.3, 0.3))
    else:
        page.insert_text((350, y + 41), "Payment Terms: Cash on Delivery", fontsize=8, color=(0.3, 0.3, 0.3))

    # Table Header
    table_top = 190
    page.draw_rect(fitz.Rect(40, table_top, 555, table_top + 22), color=(0.7, 0.75, 0.8), fill=(0.88, 0.92, 0.96))
    page.insert_text((45, table_top + 15), "Item #", fontsize=8, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((85, table_top + 15), "Material Code", fontsize=8, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((170, table_top + 15), "Description", fontsize=8, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((350, table_top + 15), "Quantity (TO)", fontsize=8, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((430, table_top + 15), "Unit Rate (ZAR)", fontsize=8, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((505, table_top + 15), "Total (ZAR)", fontsize=8, fontname="helv", color=(0.1, 0.1, 0.1))

    curr_y = table_top + 22
    subtotal = 0.0

    for idx, (code, desc, qty, rate, line_total) in enumerate(line_items):
        subtotal += line_total
        row_bg = (0.98, 0.98, 0.98) if idx % 2 == 1 else (1.0, 1.0, 1.0)
        page.draw_rect(fitz.Rect(40, curr_y, 555, curr_y + 20), color=(0.85, 0.85, 0.85), fill=row_bg)
        
        page.insert_text((45, curr_y + 14), str(idx + 1), fontsize=8, color=(0.2, 0.2, 0.2))
        page.insert_text((85, curr_y + 14), code or "—", fontsize=8, color=(0.2, 0.2, 0.2))
        page.insert_text((170, curr_y + 14), desc, fontsize=8, color=(0.1, 0.1, 0.1))
        page.insert_text((350, curr_y + 14), f"{qty:.2f}", fontsize=8, color=(0.2, 0.2, 0.2))
        page.insert_text((430, curr_y + 14), f"R {rate:.2f}", fontsize=8, color=(0.2, 0.2, 0.2))
        page.insert_text((505, curr_y + 14), f"R {line_total:.2f}", fontsize=8, fontname="helv", color=(0.1, 0.1, 0.1))
        curr_y += 20

    # Summary Section
    summary_y = curr_y + 20
    tax_amt = tax_override if tax_override is not None else round(subtotal * 0.15, 2)
    grand_total = total_override if total_override is not None else round(subtotal + tax_amt, 2)

    page.draw_rect(fitz.Rect(340, summary_y, 555, summary_y + 70), color=(0.7, 0.75, 0.8), fill=(0.95, 0.97, 0.99))
    page.insert_text((350, summary_y + 18), "Subtotal:", fontsize=9, color=(0.2, 0.2, 0.2))
    page.insert_text((480, summary_y + 18), f"R {subtotal:.2f}", fontsize=9, color=(0.1, 0.1, 0.1))

    page.insert_text((350, summary_y + 36), "VAT (15%):", fontsize=9, color=(0.2, 0.2, 0.2))
    page.insert_text((480, summary_y + 36), f"R {tax_amt:.2f}", fontsize=9, color=(0.1, 0.1, 0.1))

    page.draw_line(fitz.Point(340, summary_y + 44), fitz.Point(555, summary_y + 44), color=(0.6, 0.65, 0.7))
    page.insert_text((350, summary_y + 60), "Total Amount:", fontsize=10, fontname="helv", color=(0.1, 0.25, 0.55))
    page.insert_text((480, summary_y + 60), f"R {grand_total:.2f}", fontsize=11, fontname="helv", color=(0.1, 0.25, 0.55))

    # Stamped signature box
    stamp_y = summary_y + 100
    page.draw_rect(fitz.Rect(45, stamp_y, 200, stamp_y + 60), color=(0.2, 0.5, 0.2), width=1.5)
    page.insert_text((55, stamp_y + 20), "OFFLOAD RECEIVED & WEIGHED", fontsize=8, fontname="helv", color=(0.1, 0.5, 0.1))
    page.insert_text((55, stamp_y + 35), f"Date: {invoice_date}  Scale: OK", fontsize=8, color=(0.1, 0.5, 0.1))
    page.insert_text((55, stamp_y + 50), "Authorized Customer Stamp", fontsize=7, color=(0.1, 0.5, 0.1))

    # Bottom notes
    page.insert_text((45, 780), "Thank you for your business. For billing queries, contact accounts@siphotransport.co.za", fontsize=8, color=(0.5, 0.5, 0.5))

    if is_low_quality:
        # Overlay slight noise / gray lines to simulate poor scan / low resolution
        for i in range(10, 800, 30):
            page.draw_line(fitz.Point(20, i), fitz.Point(580, i + 5), color=(0.85, 0.85, 0.85), width=0.4)

    doc.save(filepath)
    doc.close()
    print(f"Generated: {filepath}")

def main():
    # 1. invoice_001_full_match.pdf
    draw_invoice(
        os.path.join(OUTPUT_DIR, "invoice_001_full_match.pdf"),
        invoice_no="INV-2026-0001",
        po_no="4500001714",
        line_items=[("40006653", "SL BIT 20%ASH (40006653)", 34.0, 151.50, 5151.00)]
    )

    # 2. invoice_002_quantity_mismatch.pdf (Qty 120 vs expected 34)
    draw_invoice(
        os.path.join(OUTPUT_DIR, "invoice_002_quantity_mismatch.pdf"),
        invoice_no="INV-2026-0002",
        po_no="4500001714",
        line_items=[("40006653", "SL BIT 20%ASH (40006653)", 120.0, 151.50, 18180.00)]
    )

    # 3. invoice_003_amount_mismatch.pdf (Total R99,999 vs expected)
    draw_invoice(
        os.path.join(OUTPUT_DIR, "invoice_003_amount_mismatch.pdf"),
        invoice_no="INV-2026-0003",
        po_no="4500001714",
        line_items=[("40006653", "SL BIT 20%ASH (40006653)", 34.0, 151.50, 5151.00)],
        total_override=99999.00
    )

    # 4. invoice_004_vendor_mismatch.pdf (Vendor mismatch)
    draw_invoice(
        os.path.join(OUTPUT_DIR, "invoice_004_vendor_mismatch.pdf"),
        invoice_no="INV-2026-0004",
        vendor_name="Apex Global Logistics Ltd",
        vendor_gstin="99ZZZ9999Z9Z9",
        po_no="4500001714",
        line_items=[("40006653", "SL BIT 20%ASH (40006653)", 34.0, 151.50, 5151.00)]
    )

    # 5. invoice_005_po_mismatch.pdf (Wrong PO number)
    draw_invoice(
        os.path.join(OUTPUT_DIR, "invoice_005_po_mismatch.pdf"),
        invoice_no="INV-2026-0005",
        po_no="4500099999",
        line_items=[("40006653", "SL BIT 20%ASH (40006653)", 34.0, 151.50, 5151.00)]
    )

    # 6. invoice_006_missing_po.pdf (No PO number)
    draw_invoice(
        os.path.join(OUTPUT_DIR, "invoice_006_missing_po.pdf"),
        invoice_no="INV-2026-0006",
        omit_po=True,
        line_items=[("40006653", "SL BIT 20%ASH (40006653)", 34.0, 151.50, 5151.00)]
    )

    # 7. invoice_007_duplicate_invoice.pdf (Duplicate of invoice 001)
    shutil.copyfile(
        os.path.join(OUTPUT_DIR, "invoice_001_full_match.pdf"),
        os.path.join(OUTPUT_DIR, "invoice_007_duplicate_invoice.pdf")
    )
    print("Generated: invoice_007_duplicate_invoice.pdf (Exact duplicate of 001)")

    # 8. invoice_008_low_quality_scan.pdf (Low quality scan)
    draw_invoice(
        os.path.join(OUTPUT_DIR, "invoice_008_low_quality_scan.pdf"),
        invoice_no="INV-2026-0008",
        po_no="4500001714",
        line_items=[("40006653", "SL BIT 20%ASH (40006653)", 34.0, 151.50, 5151.00)],
        is_low_quality=True
    )

    # 9. invoice_009_multiple_line_items.pdf (Multiple line items)
    draw_invoice(
        os.path.join(OUTPUT_DIR, "invoice_009_multiple_line_items.pdf"),
        invoice_no="INV-2026-0009",
        po_no="4500001714",
        line_items=[
            ("40006653", "SL BIT 20%ASH (40006653)", 20.0, 151.50, 3030.00),
            ("40006660", "DEF_ADBLUE_20L (40006660)", 10.0, 280.00, 2800.00),
            ("40006657", "SPARE_PARTS_BOX (40006657)", 4.0, 500.00, 2000.00)
        ]
    )

    # 10. invoice_010_tax_mismatch.pdf (Incorrect tax)
    draw_invoice(
        os.path.join(OUTPUT_DIR, "invoice_010_tax_mismatch.pdf"),
        invoice_no="INV-2026-0010",
        po_no="4500001714",
        line_items=[("40006653", "SL BIT 20%ASH (40006653)", 34.0, 151.50, 5151.00)],
        tax_override=2500.00,
        total_override=7651.00
    )

if __name__ == '__main__':
    main()
