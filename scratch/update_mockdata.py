import json

# Generate 5 Contracts
contracts = [
    {
        "contractNumber": "40000014",
        "qualityType": "SL BIT 20%ASH (Bituminous Bulk Coal)",
        "targetQuantity": 10000,
        "uom": "TON",
        "netValue": 1515000.0,
        "rate": 151.5,
        "validFrom": "2026-07-01",
        "validTo": "2026-12-31",
        "soldToParty": "131 - Company KK limited",
        "currency": "ZAR",
        "fromLocation": "2004 Ikw_Emoyeni Wash Plant",
        "toLocation": "IKW_RICHARDS BAY (RB_Storage Loc)"
    },
    {
        "contractNumber": "40000015",
        "qualityType": "10-SL-ANTH-SPIRAL (Bagged Industrial Fertilizer)",
        "targetQuantity": 15000,
        "uom": "BAG",
        "netValue": 675000.0,
        "rate": 45.0,
        "validFrom": "2026-07-01",
        "validTo": "2026-12-31",
        "soldToParty": "132 - AgriBulk Mining Corp",
        "currency": "ZAR",
        "fromLocation": "3002 BCD_Coal Fields",
        "toLocation": "BCD_RICHARDS BAY Yard"
    },
    {
        "contractNumber": "40000016",
        "qualityType": "BC_FP_RB3 (Fluid Reagents & DEF AdBlue Bottles)",
        "targetQuantity": 25000,
        "uom": "BTL",
        "netValue": 700000.0,
        "rate": 28.0,
        "validFrom": "2026-07-01",
        "validTo": "2026-12-31",
        "soldToParty": "133 - Eskom Utility Power",
        "currency": "ZAR",
        "fromLocation": "Belfast Chemical Pit",
        "toLocation": "Woestalleen Siding"
    },
    {
        "contractNumber": "40000017",
        "qualityType": "6000_NAR_RB1 (Containerized Hardware & Spares Boxes)",
        "targetQuantity": 20000,
        "uom": "BOX",
        "netValue": 2500000.0,
        "rate": 125.0,
        "validFrom": "2026-07-01",
        "validTo": "2026-12-31",
        "soldToParty": "134 - Global Port Terminal",
        "currency": "ZAR",
        "fromLocation": "Ilima Central Warehouse",
        "toLocation": "RICHARDSBAY MPT707 Port Yard"
    },
    {
        "contractNumber": "40000018",
        "qualityType": "ROM_RAW_DUST (Heavy Machined Crusher Plates)",
        "targetQuantity": 12000,
        "uom": "PCS",
        "netValue": 40800000.0,
        "rate": 3400.0,
        "validFrom": "2026-07-01",
        "validTo": "2026-12-31",
        "soldToParty": "135 - Newcastle Steel Complex",
        "currency": "ZAR",
        "fromLocation": "Klipfontein Heavy Pit",
        "toLocation": "Newcastle Works"
    }
]

users = [
  { "username": "company_admin", "password": "password123", "role": "COMPANY_ADMIN", "displayName": "Thandiwe Nkosi (Company Admin)" },
  { "username": "mm_admin", "password": "password123", "role": "MM_ADMIN", "displayName": "Bhekisisa Zondi (MM Purchasing Lead)" },
  { "username": "transporter_admin", "password": "password123", "role": "TRANSPORTER_ADMIN", "companyName": "Sipho Transport Services", "displayName": "Sipho Kumalo (Transporter Admin)" },
  { "username": "driver", "password": "password123", "role": "DRIVER", "companyName": "Sipho Transport Services", "displayName": "Dumisani Dlamini (Driver)" },
  { "username": "customer", "password": "password123", "role": "CUSTOMER", "companyName": "Power Utility (Client)", "displayName": "John Ndlovu (Customer)" },
  { "username": "supervisor", "password": "password123", "role": "SUPERVISOR", "displayName": "Pieter Botha (Weighbridge Supervisor)" }
]

transporters = ["Sipho Transport Services", "VDM Transport", "CBS Logistics", "ONYX Logistics", "MPL Transport"]
uoms = ["TON", "BAG", "BTL", "BOX", "PCS"]
statuses = ["PENDING_ASSIGNMENT", "ACCEPTED_SIGNED", "DRIVER_ASSIGNED", "SUPERVISOR_APPROVED", "EN_ROUTE", "DELIVERED_STAMPED", "POD_SUBMITTED", "POD_APPROVED", "POSTED", "PAID"]

pos = []
offloads = []
invoices = []

po_id = 41000001
wb_id = 998801

for c_idx, c in enumerate(contracts):
    c_num = c["contractNumber"]
    uom = c["uom"]
    rate = c["rate"]
    
    for po_idx in range(10):
        po_str = f"PO-{po_id}"
        wb_str = f"WB-{wb_id}"
        trans = transporters[(po_idx + c_idx) % len(transporters)]
        status = statuses[po_idx]
        
        # Quantity based on UOM
        if uom == "TON":
            qty = 1000 + (po_idx * 100)
        elif uom == "BAG":
            qty = 500 + (po_idx * 100)
        elif uom == "BTL":
            qty = 2500 + (po_idx * 250)
        elif uom == "BOX":
            qty = 400 + (po_idx * 50)
        else: # PCS
            qty = 50 + (po_idx * 10)
            
        po_entry = {
            "purchaseOrderNo": po_str,
            "contractRef": c_num,
            "transporter": trans if status != "PENDING_ASSIGNMENT" else "",
            "productDescription": c["qualityType"],
            "rate": rate,
            "unit": uom,
            "targetQuantity": qty,
            "costCenter": f"CC-MINE-0{c_idx + 1}",
            "fromLocation": c["fromLocation"],
            "toLocation": c["toLocation"],
            "paymentTerms": "30 days from invoice posting",
            "poDate": f"2026-07-0{min(9, po_idx + 1)}",
            "status": status,
            "signedBy": "S. KUMALO" if status != "PENDING_ASSIGNMENT" and status != "PENDING_SIGNATURE" else None,
            "signedDate": f"2026-07-0{min(9, po_idx + 1)}" if status != "PENDING_ASSIGNMENT" and status != "PENDING_SIGNATURE" else None,
            "biltyNo": f"BLT-{770100 + po_id - 41000000}",
            "biltyDate": f"2026-07-0{min(9, po_idx + 1)}",
            "consignorName": c["fromLocation"],
            "consigneeName": c["toLocation"],
            "declaredValue": qty * rate
        }
        pos.append(po_entry)
        
        # Dispatch & Arrival Weights (in kg for mass or count for units)
        disp_tare = 21000 + (po_idx * 100)
        disp_gross = disp_tare + int(qty * (1000 if uom == "TON" else 50 if uom == "BAG" else 20))
        disp_net = disp_gross - disp_tare
        
        # Scenarios
        dam_units = 15 if po_idx == 2 else 0
        dam_wt = 750 if po_idx == 2 else 0
        dam_reason = "Torn packaging spillage" if po_idx == 2 else "None"
        exc_reason = "MOISTURE_EVAPORATION" if po_idx == 4 else "NONE"
        
        arr_gross = disp_gross - (1800 if po_idx == 3 else 500 if po_idx == 4 else 0)
        arr_tare = disp_tare
        arr_net = arr_gross - arr_tare
        acc_net = max(0, arr_net - dam_wt)
        
        pod_st = "APPROVED" if status in ["POD_APPROVED", "POSTED", "PAID"] else "SUBMITTED_AWAITING_APPROVAL" if status == "POD_SUBMITTED" else "DELIVERED_STAMPED" if status == "DELIVERED_STAMPED" else "EN_ROUTE" if status == "EN_ROUTE" else "SUPERVISOR_APPROVED" if status == "SUPERVISOR_APPROVED" else "DRIVER_ASSIGNED"
        
        offload_entry = {
            "waybillNo": wb_str,
            "poRef": po_str,
            "loadingWaySlipNo": f"EL-{100400 + po_id - 41000000}",
            "horseRegNo": f"KPJ{600 + po_idx}MP",
            "trailer1RegNo": f"JYJ{300 + po_idx}MP",
            "trailer2RegNo": f"JYJ{301 + po_idx}MP",
            "driverName": "ZWELITHINI DLAMINI" if po_idx % 2 == 0 else "SANELE KHUMALO",
            "driverIdNo": "8509125679082",
            "driverLicenseNo": "DL-850912-EC",
            "licenseExpiryDate": "2026-01-10" if po_idx == 6 else "2028-04-20",
            "isLicenseValid": False if po_idx == 6 else True,
            "biltyNo": f"BLT-{770100 + po_id - 41000000}",
            "biltyDate": f"2026-07-0{min(9, po_idx + 1)}",
            "consignorName": c["fromLocation"],
            "consigneeName": c["toLocation"],
            "declaredValue": qty * rate,
            "dispatchTareWeightKg": disp_tare,
            "dispatchGrossWeightKg": disp_gross,
            "dispatchNetWeightKg": disp_net,
            "arrivalGrossWeightKg": arr_gross,
            "arrivalTareWeightKg": arr_tare,
            "arrivalNetWeightKg": arr_net,
            "tareWeightKg": disp_tare,
            "grossWeightKg": disp_gross,
            "netWeightKg": disp_net,
            "totalUnits": qty,
            "damagedUnits": dam_units,
            "damagedWeightKg": dam_wt,
            "damageReason": dam_reason,
            "acceptedNetWeightKg": acc_net,
            "weightExceptionReason": exc_reason,
            "loadingKm": 466628,
            "offloadingKm": 466961,
            "operatorName": "Tsebe Herman",
            "site": c["fromLocation"],
            "productDescription": c["qualityType"],
            "offloadDate": "2026-07-11",
            "podStatus": pod_st,
            "uploadedFileName": f"/demo-files/{wb_str}.jpg"
        }
        offloads.append(offload_entry)
        
        if status in ["POSTED", "PAID"]:
            inv_entry = {
                "invoiceNo": f"INV-2026-{1000 + po_id - 41000000}",
                "waybillNo": wb_str,
                "quantity": qty if uom == "TON" else qty / 20.0,
                "rate": rate,
                "amount": round(qty * rate, 2),
                "status": "PAID" if status == "PAID" else "POSTED",
                "postingDate": "2026-07-15",
                "paymentRef": f"PAY-SAP-{9000 + po_id - 41000000}" if status == "PAID" else None,
                "fileName": f"tax-invoice-{1000 + po_id - 41000000}.pdf"
            }
            invoices.append(inv_entry)
            
        po_id += 1
        wb_id += 1

content = f"""// ============================================================
// TRANSPORTER PORTAL — DEMO MOCK DATA
// Master initial dataset pre-loaded with 5 Contracts & 50 POs
// Unit of Measures: TON, BAG, BTL, BOX, DRUM, PCS, PAL
// ============================================================

export const USERS = {json.dumps(users, indent=2)};

export const CONTRACTS = {json.dumps(contracts, indent=2)};

export const PURCHASE_ORDERS = {json.dumps(pos, indent=2)};

export const OFFLOAD_RECORDS = {json.dumps(offloads, indent=2)};

export const INVOICES = {json.dumps(invoices, indent=2)};

export const OCR_RESULTS = {{
  "WB-998801": {{
    "fileName": "WB-998801.jpg",
    "confidence": 0.98,
    "extracted": {{ "waybillNo": "WB-998801", "truckNo": "KPJ600MP", "weight": 34.15 }},
    "sapRecord": {{ "waybillNo": "WB-998801", "truckNo": "KPJ600MP", "weight": 34.15 }},
    "matchResult": "MATCH"
  }},
  "WB-998808": {{
    "fileName": "WB-998808.jpg",
    "confidence": 0.92,
    "extracted": {{ "waybillNo": "WB-998808", "truckNo": "KPJ607MP", "weight": 32.20 }},
    "sapRecord": {{ "waybillNo": "WB-998808", "truckNo": "KPJ607MP", "weight": 34.00 }},
    "matchResult": "MISMATCH"
  }},
  "WB-998809": {{
    "fileName": "WB-998809.jpg",
    "confidence": 0.62,
    "extracted": {{ "waybillNo": "WB-998809", "truckNo": "KPJ608MP", "weight": 35.00 }},
    "sapRecord": {{ "waybillNo": "WB-998809", "truckNo": "KPJ608MP", "weight": 35.00 }},
    "matchResult": "LOW_CONFIDENCE"
  }}
}};

export const REJECTION_REASONS = [
  "Illegible Stamp / Signature",
  "Incorrect Net Weight on Slip",
  "Waybill Number Mismatch",
  "Missing Site Manager Stamp",
  "Damaged Slip Document",
  "Other (comment)"
];
"""

with open(r"C:\Users\Varad\Desktop\POD\src\data\mockData.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully updated src/data/mockData.ts with 5 Contracts & 50 POs across all UOMs!")
