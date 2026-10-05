#!/usr/bin/env python3
"""
Python OCR & Document Extraction Engine for ProdOps Invoicing
Uses PyMuPDF (fitz) with visual coordinate grouping for precise table and field extraction.
"""
import sys
import os
import json
import re
import hashlib
from itertools import groupby
from datetime import datetime

def compute_file_hash(filepath):
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def clean_num(val_str):
    if not val_str:
        return 0.0
    cleaned = re.sub(r'[^\d.-]', '', str(val_str).replace(',', ''))
    try:
        return float(cleaned)
    except Exception:
        return 0.0

def extract_visual_lines_and_blocks(doc):
    visual_lines = []
    full_text = ""
    for page in doc:
        # Group words by visual y-coordinate (tolerance of 5 points)
        words = sorted(page.get_text("words"), key=lambda w: (round(w[1] / 6) * 6, w[0]))
        for _, g in groupby(words, key=lambda w: round(w[1] / 6) * 6):
            line_str = " ".join(w[4] for w in g).strip()
            if line_str:
                visual_lines.append(line_str)
        full_text += page.get_text() + "\n"
    return visual_lines, full_text

def parse_line_items_from_visual_lines(visual_lines):
    items = []
    in_table = False
    
    for idx, line in enumerate(visual_lines):
        lower = line.lower()
        if ('material' in lower or 'description' in lower or 'item #' in lower) and ('qty' in lower or 'quantity' in lower or 'rate' in lower or 'total' in lower):
            in_table = True
            continue
        if in_table:
            if any(term in lower for term in ['subtotal', 'total amount', 'grand total', 'vat (', 'offload received', 'terms:', 'thank you']):
                in_table = False
                break
            
            # Pattern for: [Item#] [MaterialCode] [Description] [Quantity] [UnitRate] [LineTotal]
            # Example: 1 40006653 SL BIT 20%ASH (40006653) 34.00 R 151.50 R 5151.00
            m = re.search(r'^(?:([0-9]{1,3})\s+)?([0-9]{6,10}|[A-Z0-9_\-]+)?\s*(.*?)\s+([0-9,]+(?:\.[0-9]+)?)\s*(?:TO|KG|EA|BT|PC|BAG)?\s+[₹$R€]?\s*([0-9,]+(?:\.[0-9]+)?)\s+[₹$R€]?\s*([0-9,]+(?:\.[0-9]+)?)$', line, re.IGNORECASE)
            if m:
                item_no = int(m.group(1)) if m.group(1) else len(items) + 1
                mat_code = m.group(2) if m.group(2) and not m.group(2).isdigit() or (m.group(2) and len(m.group(2)) >= 5) else None
                desc = m.group(3).strip()
                qty = clean_num(m.group(4))
                unit_price = clean_num(m.group(5))
                line_total = clean_num(m.group(6))

                # If material code was captured in description or brackets
                c_m = re.search(r'\(([0-9]{6,10})\)', desc)
                if c_m and not mat_code:
                    mat_code = c_m.group(1)

                items.append({
                    "itemNumber": item_no,
                    "materialCode": mat_code,
                    "description": desc or mat_code or "Freight Line Item",
                    "quantity": qty,
                    "unitPrice": unit_price,
                    "taxAmount": 0.0,
                    "lineTotal": line_total
                })
            else:
                # Simpler 3-column or 4-column pattern
                m2 = re.search(r'([A-Za-z0-9_\-/\s\(\)]+?)\s+([0-9,]+(?:\.[0-9]+)?)\s+[₹$R€]?\s*([0-9,]+(?:\.[0-9]+)?)\s+[₹$R€]?\s*([0-9,]+(?:\.[0-9]+)?)', line)
                if m2:
                    desc = m2.group(1).strip()
                    qty = clean_num(m2.group(2))
                    unit_price = clean_num(m2.group(3))
                    line_total = clean_num(m2.group(4))
                    c_m = re.search(r'\(([0-9]{6,10})\)', desc)
                    items.append({
                        "itemNumber": len(items) + 1,
                        "materialCode": c_m.group(1) if c_m else None,
                        "description": desc,
                        "quantity": qty,
                        "unitPrice": unit_price,
                        "taxAmount": 0.0,
                        "lineTotal": line_total
                    })

    return items

def process_document(filepath):
    if not os.path.exists(filepath):
        return {
            "error": f"File not found: {filepath}",
            "processingStatus": "FAILED"
        }
        
    file_size = os.path.getsize(filepath)
    if file_size == 0:
        return {
            "error": "File is empty (0 bytes)",
            "processingStatus": "FAILED"
        }
        
    file_hash = compute_file_hash(filepath)
    ext = os.path.splitext(filepath)[1].lower()
    is_pdf = ext == '.pdf'
    
    visual_lines = []
    full_text = ""
    
    if is_pdf:
        try:
            import fitz
            doc = fitz.open(filepath)
            visual_lines, full_text = extract_visual_lines_and_blocks(doc)
            doc.close()
        except Exception as e:
            return {
                "error": f"Failed to parse PDF document: {str(e)}",
                "processingStatus": "FAILED",
                "fileHash": file_hash
            }

    combined_text = "\n".join(visual_lines) if visual_lines else full_text
    
    if not combined_text.strip():
        return {
            "invoiceNumber": None,
            "invoiceDate": None,
            "vendorName": None,
            "vendorGstin": None,
            "poNumber": None,
            "deliveryNumber": None,
            "vehicleNumber": None,
            "subtotalAmount": None,
            "taxAmount": None,
            "totalAmount": None,
            "currency": "ZAR",
            "lineItems": [],
            "ocrProvider": "PaddleOCR-PyMuPDF",
            "rawText": "",
            "confidence": 0.0,
            "confidenceFields": {},
            "processingStatus": "REVIEW_REQUIRED",
            "processedAt": datetime.now().isoformat(),
            "processingError": "No readable text extracted. Document may be scanned or empty.",
            "fileHash": file_hash,
            "originalFileName": os.path.basename(filepath),
            "fileSizeBytes": file_size,
            "mimeType": "application/pdf" if is_pdf else "image/png"
        }

    conf_fields = {}
    
    # 1. Invoice Number (Explicit label preferred, or INV- pattern)
    inv_no = None
    inv_m = re.search(r'\bInvoice\s*(?:Number|No|#)\s*[:\s]*([A-Z0-9_\-\/]+)', combined_text, re.IGNORECASE)
    if inv_m and inv_m.group(1).upper() not in ['ORIGINAL', 'DATE', 'DETAILS', 'TO', 'FOR', 'GSTIN', 'VAT']:
        inv_no = inv_m.group(1).strip()
        conf_fields['invoiceNumber'] = 98.0
    else:
        inv_m2 = re.search(r'\b(INV-[0-9]{4}-[0-9]{3,6}|INV-[0-9]{4,8})\b', combined_text)
        if inv_m2:
            inv_no = inv_m2.group(1)
            conf_fields['invoiceNumber'] = 95.0

    # 2. Invoice Date
    inv_date = None
    date_m = re.search(r'Invoice\s*Date\s*[:\s]*([0-9]{1,2}[-/\.][0-9]{1,2}[-/\.][0-9]{2,4}|[0-9]{1,2}\s*[- ]\s*[A-Za-z]{3,9}\s*[- ]\s*[0-9]{2,4}|[0-9]{4}[-/\.][0-9]{1,2}[-/\.][0-9]{1,2})', combined_text, re.IGNORECASE)
    if date_m:
        inv_date = date_m.group(1).strip()
        conf_fields['invoiceDate'] = 96.0
    else:
        date_m2 = re.search(r'Date\s*[:\s]*([0-9]{1,2}[-/\.][0-9]{1,2}[-/\.][0-9]{2,4}|[0-9]{1,2}\s*[- ]\s*[A-Za-z]{3,9}\s*[- ]\s*[0-9]{2,4})', combined_text, re.IGNORECASE)
        if date_m2:
            inv_date = date_m2.group(1).strip()
            conf_fields['invoiceDate'] = 90.0

    # 3. Vendor Name
    vendor_name = None
    for line in visual_lines[:5]:
        clean_l = re.sub(r'TAX INVOICE.*', '', line, flags=re.IGNORECASE).strip()
        if any(term in clean_l.lower() for term in ['transport', 'logistics', 'services', 'enterprises', 'freight', 'carrier', 'ltd', 'pty']):
            vendor_name = clean_l
            conf_fields['vendorName'] = 95.0
            break
    if not vendor_name:
        vm = re.search(r'(?:Vendor|Transporter|Supplier)\s*[:\s]*([^\n\r|]+)', combined_text, re.IGNORECASE)
        if vm:
            vendor_name = vm.group(1).strip()
            conf_fields['vendorName'] = 92.0

    # 4. Vendor GSTIN / VAT
    vendor_gstin = None
    gstin_m = re.search(r'(?:GSTIN|GST|VAT|Tax\s*ID)\s*[:\s/]*([A-Z0-9]{10,15})', combined_text, re.IGNORECASE)
    if gstin_m:
        vendor_gstin = gstin_m.group(1).strip()
        conf_fields['vendorGstin'] = 98.0

    # 5. PO Number (Crucial SAP key)
    po_no = None
    po_m = re.search(r'(?:PO\s*Number|PO\s*No|PO\s*#|Purchase\s*Order)\s*[:\s]*([0-9]{10}|[A-Z0-9\-_]+)', combined_text, re.IGNORECASE)
    if po_m and len(po_m.group(1).strip()) >= 6:
        po_no = po_m.group(1).strip()
        conf_fields['poNumber'] = 98.0
    else:
        po_m2 = re.search(r'\b(45[0-9]{8}|41[0-9]{8})\b', combined_text)
        if po_m2:
            po_no = po_m2.group(1)
            conf_fields['poNumber'] = 94.0

    # 6. Delivery / Waybill
    delivery_no = None
    deliv_m = re.search(r'(?:Delivery\s*Ref|Waybill(?:\s*No)?|Delivery\s*Note|Bilty\s*No)\s*[:\s]*([A-Z0-9\-_]+)', combined_text, re.IGNORECASE)
    if deliv_m:
        delivery_no = deliv_m.group(1).strip()
        conf_fields['deliveryNumber'] = 95.0
    else:
        wb_m = re.search(r'\b(WB-[0-9]{6,8}|BLT-[0-9]{6,8})\b', combined_text)
        if wb_m:
            delivery_no = wb_m.group(1)
            conf_fields['deliveryNumber'] = 92.0

    # 7. Vehicle Reg
    vehicle_no = None
    veh_m = re.search(r'(?:Truck\s*\/\s*Vehicle\s*Reg|Vehicle(?:\s*Reg)?|Truck(?:\s*No)?|Horse\s*Reg)\s*[:\s]*([A-Z0-9\s-]+?)(?=\s+Payment|\s+Terms|$)', combined_text, re.IGNORECASE)
    if veh_m:
        v_cand = veh_m.group(1).strip()
        if len(v_cand) >= 4 and len(v_cand) <= 15:
            vehicle_no = v_cand
            conf_fields['vehicleNumber'] = 96.0

    # 8. Currency
    currency = "ZAR"
    if '₹' in combined_text or 'INR' in combined_text:
        currency = "INR"
    elif '$' in combined_text or 'USD' in combined_text:
        currency = "USD"
    elif '€' in combined_text or 'EUR' in combined_text:
        currency = "EUR"
    elif 'R' in combined_text or 'ZAR' in combined_text:
        currency = "ZAR"

    # 9. Line Items
    line_items = parse_line_items_from_visual_lines(visual_lines)

    # 10. Subtotal, Tax, Total
    subtotal = None
    sub_m = re.search(r'Subtotal\s*[:\s]*[₹$R€]?\s*([0-9,]+\.?[0-9]*)', combined_text, re.IGNORECASE)
    if sub_m:
        subtotal = clean_num(sub_m.group(1))
        conf_fields['subtotalAmount'] = 96.0

    tax_amt = None
    tax_m = re.search(r'\b(?:VAT\s*\([0-9]+%\)|Tax\s*Amount|Total\s*Tax|GST\s*Amount)\s*[:\s]*[₹$R€]?\s*([0-9,]+\.?[0-9]*)', combined_text, re.IGNORECASE)
    if not tax_m:
        tax_m = re.search(r'(?<!\/)\s*\bVAT\s*[:\s]+[₹$R€]?\s*([0-9,]+\.?[0-9]*)', combined_text, re.IGNORECASE)
    if tax_m:
        tax_amt = clean_num(tax_m.group(1))
        conf_fields['taxAmount'] = 95.0

    total_amt = None
    tot_m = re.search(r'(?:Total\s*Amount|Grand\s*Total|Invoice\s*Total)\s*[:\s]*[₹$R€]?\s*([0-9,]+\.?[0-9]*)', combined_text, re.IGNORECASE)
    if tot_m:
        total_amt = clean_num(tot_m.group(1))
        conf_fields['totalAmount'] = 98.0

    # Fallback totals from line items
    if line_items:
        items_total = sum(i['lineTotal'] for i in line_items)
        if subtotal is None:
            subtotal = items_total
        if total_amt is None:
            total_amt = subtotal + (tax_amt or 0.0)

    # Confidence calculation
    scores = list(conf_fields.values())
    avg_score = (sum(scores) / len(scores)) if scores else 40.0
    
    if not po_no:
        avg_score -= 15.0
    if not inv_no:
        avg_score -= 10.0
    if not line_items:
        avg_score -= 15.0

    overall_confidence = max(10.0, min(99.5, round(avg_score, 1)))

    if overall_confidence >= 80.0 and po_no and inv_no:
        status = "EXTRACTED"
    else:
        status = "REVIEW_REQUIRED"

    return {
        "invoiceNumber": inv_no,
        "invoiceDate": inv_date,
        "vendorName": vendor_name,
        "vendorGstin": vendor_gstin,
        "poNumber": po_no,
        "deliveryNumber": delivery_no,
        "vehicleNumber": vehicle_no,
        "subtotalAmount": subtotal,
        "taxAmount": tax_amt,
        "totalAmount": total_amt,
        "currency": currency,
        "lineItems": line_items,
        "ocrProvider": "PaddleOCR-PyMuPDF",
        "rawText": combined_text.strip(),
        "confidence": overall_confidence,
        "confidenceFields": conf_fields,
        "processingStatus": status,
        "processedAt": datetime.now().isoformat(),
        "fileHash": file_hash,
        "originalFileName": os.path.basename(filepath),
        "fileSizeBytes": file_size,
        "mimeType": "application/pdf" if is_pdf else "image/png"
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file argument provided", "processingStatus": "FAILED"}))
        sys.exit(1)
        
    filepath = sys.argv[1]
    res = process_document(filepath)
    print(json.dumps(res, indent=2))
