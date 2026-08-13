# POD — SAP Validation Matrix
**Date**: 2026-08-12  
**Method**: Evidence from SOP.md, mockData.ts, industry knowledge, SAP S/4HANA documentation patterns  
**Rule**: UNVERIFIED = no authoritative evidence found

---

## 1. COMPANY CONTEXT

The client is **Ikwezi Mining Limited** (coal mining, South Africa).  
The SAP system is **S/4HANA On-Premise** (confirmed: SOP.md line 6).  
The business is **coal transport procurement** — trucks carry coal from mine sidings to customer sites (Richards Bay, Eskom Holdings, etc.).  
Currency: **ZAR**. UOM: **TON**.

---

## 2. SAP VALIDATION TABLE

| POD Concept | SAP Equivalent | S/4HANA Module | Standard? | Notes / Decision |
|-------------|---------------|---------------|-----------|-----------------|
| Purchase Contract | Scheduling Agreement or Outline Agreement | MM-PUR | Standard | Likely ME31L (Scheduling Agreement) or ME31K (Contract). Contract numbers 400000xx match SAP document numbering. KEEP as SAP concept. |
| Purchase Order | Purchase Order (MM-PUR) | MM-PUR | Standard | PO numbers 410000xx match SAP doc numbering. Likely a Service PO (account assignment category K or C). |
| Contract → PO | Release Order from Outline Agreement | MM-PUR | Standard | Standard SAP flow: Contract → Release PO → GR or SES |
| Transporter as Vendor | Business Partner / Vendor (LFA1/BUT000) | MM, FI-AP | Standard | Transporters should be SAP Vendors with transport service items |
| PO Acceptance / E-Sign | PO Acknowledgment | MM-PUR | Standard (custom workflow) | SAP has vendor PO acknowledgment. E-sign is a custom extension. |
| Waybill (Bilty) | NOT an SAP standard object | N/A | Non-Standard | Waybill/Bilty is a carrier document. SAP does not have a native Waybill object in standard MM. In SAP TM it exists as Freight Order. In standard S/4HANA MM, Waybill is an attachment/reference. KEEP as POD-native object. |
| Weighbridge (pre-dispatch) | NOT a standard SAP object | EWM (extended) | Non-Standard | Weighbridge is external/physical. Weight can be captured in SAP via Goods Issue (for material flow) or as custom data on Delivery. In this context, weight is captured in POD and referenced to PO. KEEP as POD-native. |
| Goods Receipt (GR) | Goods Receipt (MIGO / MIGO_GR) | MM-IM | Standard | If PO is material-based, GR posts delivery. However, coal transport is a SERVICE — so GR may not apply directly. |
| Service Entry Sheet (SES) | Service Entry Sheet (ML81N / MIGO) | MM-SRV | Standard | For service POs, SES is the delivery confirmation. This is the most likely downstream POD trigger. The "delivery invoice" in POD likely corresponds to creating/confirming a SES. |
| Proof of Delivery (POD) | Proof of Delivery in SD / Delivery in MM | SD-SHP | Partial | SAP has POD in SD for sales deliveries (VL02N → POD). For procurement/transport, POD is typically an attachment to SES or GR. POD as a business object is more relevant in logistics contexts. POD here is a CUSTOM document in the portal that triggers SES. |
| OCR Validation | NOT a standard SAP object | SAP BTP DIE | Non-Standard | SAP BTP Document Information Extraction (DIE) is available for OCR. In this project, OCR is a custom POD service. KEEP as POD-native with SAP BTP integration option. |
| Invoice (Transporter submits) | Supplier Invoice (LIV) | MM-LIV | Standard | Transporter's invoice is a Supplier Invoice. The equivalent transaction is MIRO (now: Manage Supplier Invoices in S/4HANA). |
| MIRO / Invoice Parking | Manage Supplier Invoices - Park | MM-LIV | Standard | "Parked Invoice" is a real SAP concept — invoice saved but not posted. Reference document is the PO + SES. KEEP — correctly identified. |
| Invoice Posting | Post Supplier Invoice | MM-LIV | Standard | Invoice posting creates FI document. Payment follows through FI-AP. |
| Payment (FI-AP) | Outgoing Payment (F110 / F-53) | FI-AP | Standard | SAP payment run clears open items. Payment reference (clearing doc) is synced back to portal. |
| SRN / Offload Record | NOT a standard SAP term | Custom | Non-Standard | "SRN" appears in SOP.md Interface 3. This is likely a custom field or custom table in SAP. In standard SAP, offload confirmation could map to SES or custom delivery note. UNVERIFIED. |
| GPS/OTP | NOT an SAP concept | N/A | Non-Standard | GPS and OTP are operational execution/security tools. Not SAP business objects. KEEP as POD-native execution controls. |
| Driver Assignment | NOT an SAP standard object | SAP TM (if used) | Non-Standard in MM | In SAP TM, driver assignment exists on Freight Order. In standard S/4HANA MM without TM, driver is a custom field. KEEP as POD-native. |
| Vehicle Assignment | NOT an SAP standard in MM | SAP TM (if used) | Non-Standard in MM | Same as driver — SAP TM has vehicle resources. Without TM, vehicle is POD-native. |
| Notification to Transporter | Workflow / Email notification | SAP WS | Standard (via workflow) | Can be SAP workflow or external email. Currently simulated in POD. KEEP as POD-native for demo. |
| Document Storage (POD file) | ArchiveLink / DMS (CV01N) | BC-SRV-GBT | Standard | SAP ArchiveLink stores documents attached to business objects. SOP.md correctly identifies this. |

---

## 3. PROCUREMENT MODEL DETERMINATION

**DECISION: TRANSPORT IS A SERVICE PROCUREMENT**

Evidence:
1. PO line items describe transport rates per TON (unit price × quantity of tons transported)
2. No material goods transfer occurs at PO level — the coal is the client's goods being moved
3. Rate per ton × delivered quantity = invoice value (service quantity model)
4. The "delivery" here is transport SERVICE delivery, not material goods receipt
5. SES is the appropriate downstream document — driver delivers service, SES confirms it

**Correct SAP Flow (Service PO):**
```
Purchase Contract (Outline Agreement)
  ↓
Release Order (Service PO with service items)
  ↓
Service performed (Transport + Delivery)
  ↓
Service Entry Sheet (SES) — confirms tons delivered
  ↓
SES Approval
  ↓
Supplier Invoice (MIRO) referencing PO + SES
  ↓
Invoice Verification
  ↓
Payment (FI-AP)
```

---

## 4. CRITICAL PO RULE VALIDATION

The current POD implementation creates a NEW Invoice record per Waybill after POD approval.  
**Assessment**: This is architecturally correct for the service procurement model:
- Each truck run = one delivery trip = one unit of service
- Multiple waybills can reference the same PO
- Invoice is raised by the transporter AFTER POD verification
- Invoice references the PO (and implicitly the SES)

**What is INCORRECT**: The current system creates the invoice from `netWeightKg` (legacy field).  
**Correct calculation**: Should use `acceptedNetWeightKg` (after damage deduction).

---

## 5. BILTY (LORRY RECEIPT) DETERMINATION

**STATUS: POD-NATIVE CARRIER DOCUMENT**

A Bilty (also known as Lorry Receipt or LR) is:
- A carrier-issued consignment note in South African road freight
- NOT an SAP standard business object
- The equivalent of a Bill of Lading for road transport
- Used to track: consignor → consignee, declared goods, weight, vehicle details

**Decision**: Bilty is a POD-native operational document.  
- Bilty number = carrier reference number issued when load is assigned to truck
- Should be stored on OffloadRecord (KEEP current approach)
- Should NOT be mapped to any SAP document type
- May be attached to SES as a supporting document

---

## 6. WHAT DOES NOT BELONG IN POD (SAP Owns)

| Belongs to SAP | Notes |
|---------------|-------|
| Contract master data | Sync FROM SAP to POD |
| PO master data | Sync FROM SAP to POD |
| Vendor (Transporter) master | Sync FROM SAP to POD |
| Service Entry Sheet | Created/approved in SAP (POD triggers creation) |
| Supplier Invoice (MIRO) | Posted in SAP (POD sends data) |
| FI Payment Clearing | Sync FROM SAP to POD |
| Material/Product catalog | Not relevant — quality type from contract |

---

## 7. WHAT BELONGS IN POD (Not SAP Owned)

| Belongs to POD | Notes |
|---------------|-------|
| Driver assignment | Operational assignment |
| Vehicle assignment | Operational assignment |
| Supervisor weighbridge approval | Pre-dispatch gate |
| Bilty / Waybill document | Carrier document |
| GPS/OTP/Location | Execution controls |
| OCR processing | Document intelligence |
| POD document capture | Evidence collection |
| Customer delivery confirmation | Delivery acceptance |
| Exception management | Operational alerts |
| Notification system | Stakeholder communication |
| Audit trail | Event log |
| SAP sync status | Integration monitoring |

---

## 8. INTERFACE VALIDATION

| Interface | Direction | Status | Notes |
|-----------|-----------|--------|-------|
| Contract Sync | SAP → POD | VALID | Pull contracts from SAP on demand or schedule |
| PO Sync | SAP → POD | VALID | Pull released transport POs |
| Vendor Sync | SAP → POD | VALID | Pull transporter vendor master |
| PO Acknowledgment | POD → SAP | VALID | Transporter e-sign confirmation |
| SES Creation | POD → SAP | VALID | After POD verified, trigger SES |
| POD Attachment | POD → SAP | VALID | Attach verified POD to SES via ArchiveLink |
| MIRO (Invoice Park) | POD → SAP | VALID | Transporter invoice triggers MIRO parking |
| Payment Sync | SAP → POD | VALID | FI-AP clears and syncs payment status |

---

## 9. UNVERIFIED ITEMS

| Item | Why Unverified | Risk | Action Required |
|------|---------------|------|----------------|
| Exact SAP contract type (Contract vs Scheduling Agreement) | Cannot determine without S21 access | MEDIUM | Confirm with client SAP team |
| SRN (Stock Receiving Note) number in Interface 3 | Custom SAP table — not standard | LOW | Confirm with ABAP team |
| Whether SAP TM is deployed alongside S/4HANA | No evidence either way | MEDIUM | Confirm with client |
| Weight tolerance in SAP SES | May need custom validation | LOW | Confirm with client |
| ArchiveLink configuration | Depends on SAP setup | LOW | Confirm with BASIS team |
| MIRO automatic vs manual posting | Business process decision | MEDIUM | Confirm with client finance team |
