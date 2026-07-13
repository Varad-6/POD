# Standard Operating Procedure (SOP)
## Transporter Portal — Proof-of-Delivery & Invoice Automation Project

*   **Document Owner**: Abhiyanta India Solutions Pvt. Ltd. (Delivery Team)
*   **Target Client**: Ikwezi Mining Limited
*   **System Environment**: SAP S/4HANA (On-Premise) + React Transporter Portal
*   **Version**: v1.0 (Production Blueprint Design)

---

## 1. Document Control

| Version | Date | Author | Status |
| :--- | :--- | :--- | :--- |
| v1.0 | 13-Jul-2026 | Abhiyanta | Production Blueprint Release |

---

## 2. Purpose & Objectives

This document establishes the Standard Operating Procedure (SOP) for the automated transporter freight management cycle. It covers the systems, roles, interface standards, and exceptions for the side-by-side Transporter Portal integrating with SAP S/4HANA (On-Premise).

The primary objectives are:
1.  **Standardization**: Build a unified portal where transporters review and digitally sign purchase orders (POs) and upload delivery paperwork.
2.  **Clean Core Integration**: Keep standard SAP core objects untouched by executing all custom logic through custom ABAP REST/OData Gateway endpoints.
3.  **OCR Verification**: Intercept fraud and typographical errors by running uploaded POD and transporter invoice documents through an Optical Character Recognition (OCR) validation gate.
4.  **Operational Efficiency**: Automate supplier invoice parking (MIRO) based on verified weights and PO condition rates, reducing manual checking by Ikwezi Accounts.

---

## 3. Roles & Responsibilities

### A. Transporter
*   Reviews active transport POs on the portal.
*   Signs PO acceptances with a digital signature (Aadhaar or certificate-based).
*   Monitors weighbridge offload records awaiting documentation.
*   Uploads scanned PDFs of signed Proof-of-Delivery (POD) slips.
*   Raises tax invoices on the portal, providing metadata (number, date) and uploading scans.
*   Monitors live status updates and outstanding ledgers.

### B. Ikwezi Portal Admin
*   Reviews POD uploads flagged by the system (e.g. low OCR confidence score or weight mismatch).
*   Manually overrides validation errors after physically inspecting scanned documents.
*   Grants the final "Approved" status to waybills, unlocking them for transporter invoicing.

### C. Ikwezi Creditor Clerk / Accountant
*   Logs in directly to SAP S/4HANA GUI.
*   Reviews "Parked" invoice entries in standard transaction `MIRO`.
*   Verifies matches with standard PO and Service Entry Sheet (SES) records, then posts the invoice for payment execution.

### D. Ikwezi BASIS & IT SAP Team
*   Maintains connectivity via the SAP Web Dispatcher / DMZ.
*   Manages OAuth 2.0/token authentications and TLS network security.
*   Maintains the SAP Gateway Hub and standard OData/ICF services.

---

## 4. Standard Process Flow (Production Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor T as Transporter
    participant P as Portal Engine
    participant S as SAP S/4HANA
    actor A as Ikwezi Admin
    actor C as Creditor Clerk

    S->>P: 1. PO Sync OData Service (Status: Released)
    T->>P: 2. Reviews & Signs PO (E-signature capture)
    P->>S: 3. PO Acceptance e-Sign metadata writeback
    Note over S: Delivery takes place;<br/>Weighbridge logs offload weight
    S->>P: 4. Daily Offload Log Sync (Waybill, SRN, Truck, Weight)
    T->>P: 5. Uploads scanned POD PDF
    Note over P: OCR Engine extracts:<br/>Waybill, Truck No, Weight
    alt OCR Validation Match (Tolerance ±0.5%)
        P->>P: Auto-Flagged: Matched
    else OCR Validation Mismatch
        P->>P: Auto-Flagged: Discrepancy (Requires Admin)
        A->>P: Reviews scan, applies manual override
    end
    A->>P: 6. Grants Final POD Approval
    P->>S: 7. Syncs POD scan binary to SAP SRN via GOS/ArchiveLink
    T->>P: 8. Enters invoice metadata & uploads invoice scan
    Note over P: System auto-calculates total:<br/>Offload Weight * PO Rate
    P->>S: 9. Calls BAPI_INCOMINGINVOICE_CREATE (Parks MIRO)
    C->>S: 10. Reviews parked MIRO invoice & Posts in SAP
    S->>P: 11. Payment Clearing sync (Updates Ledger to Paid)
```

### Detailed Execution Steps:
1.  **PO Sync**: Transport PO is approved in SAP, triggering an OData service to expose PO conditions and rate agreements to the Portal.
2.  **PO E-Signature**: The Transporter reviews terms and registers a signature on the Portal. The signature metadata (User, timestamp, IP address) writes back directly to a custom Z-table in SAP.
3.  **Offload Synchronization**: Daily offload batch runs in SAP, copying weighbridge waybills, truck IDs, and registered weights to the Portal.
4.  **POD Submission & OCR**: Transporter uploads the signed POD PDF. The OCR service parses the document to match values (Truck Number, Waybill ID, Offload Weight) with the pre-synced SAP records.
5.  **Admin Verification Gate**: Deliveries with validation issues are queued. The Ikwezi Admin must review and resolve discrepancies. Once approved, the document is attached to standard SAP business object records (SRN/weighbridge logs) via DMS or Generic Object Services (GOS).
6.  **Invoice Parking (MIRO)**: The portal multiplies the verified offload weight by the PO rate condition. The transporter uploads their physical invoice and enters the date and number. The Portal backend submits this to SAP, creating a standard Parked Invoice (`MIRO`).
7.  **Payment Clearing**: Following payment release by the finance team in SAP, clearing documents sync back to the Portal, updating outstanding transporter ledgers.

---

## 5. Integration Interfaces & Payload Schema

The system uses 7 secure REST/OData interfaces exposed by SAP Gateway over HTTPS:

### Interface 1: PO Sync (SAP $\rightarrow$ Portal)
*   **Protocol**: OData (GET)
*   **Trigger**: Released Transport Purchase Orders.
*   **Core Fields**:
    ```json
    {
      "PO_Number": "4500012345",
      "Transporter_ID": "VND_88902",
      "Item_Code": "TRANS_COAL_01",
      "Rate_Per_Ton": 245.50,
      "Currency": "ZAR",
      "UOM": "TON",
      "Agreement_Valid_From": "2026-07-01",
      "Agreement_Valid_To": "2026-12-31"
    }
    ```

### Interface 2: PO Acceptance & E-Sign (Portal $\rightarrow$ SAP)
*   **Protocol**: REST (POST)
*   **Trigger**: User signs acceptance on the drawing canvas.
*   **Core Fields**:
    ```json
    {
      "PO_Number": "4500012345",
      "Accepted_By": "transporter_user_01",
      "Timestamp": "2026-07-13T17:15:30Z",
      "IP_Address": "197.89.2.45",
      "Signature_Blob_Hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
    ```

### Interface 3: Offload / SRN Sync (SAP $\rightarrow$ Portal)
*   **Protocol**: OData (GET/Batch Extractor)
*   **Trigger**: Daily scheduler processing weighbridge logs.
*   **Core Fields**:
    ```json
    {
      "Waybill_Number": "WB-998821",
      "SRN_Number": "100029384",
      "PO_Number": "4500012345",
      "Truck_Number": "NJD982GP",
      "SAP_Weight_Tons": 34.82,
      "Offload_Date": "2026-07-12"
    }
    ```

### Interface 4: POD Attachment Sync (Portal $\rightarrow$ SAP)
*   **Protocol**: REST (POST Multipart)
*   **Trigger**: Final approval by Portal Admin.
*   **Core Fields**:
    ```json
    {
      "Waybill_Number": "WB-998821",
      "Document_Type": "POD",
      "File_Name": "POD_WB-998821.pdf",
      "Binary_Data": "[BASE64_STREAM]"
    }
    ```

### Interface 5: Invoice Park - MIRO (Portal $\rightarrow$ SAP)
*   **Protocol**: REST (POST)
*   **Trigger**: Transporter submits calculated invoice.
*   **Core Fields**:
    ```json
    {
      "Transporter_Invoice_No": "INV-2026-0092",
      "Invoice_Date": "2026-07-13",
      "PO_Number": "4500012345",
      "Waybill_References": ["WB-998821"],
      "Total_Net_Amount": 8548.31,
      "Tax_Amount": 1282.25,
      "Gross_Amount": 9830.56,
      "Currency": "ZAR"
    }
    ```

### Interface 6: Payment & Outstanding Sync (SAP $\rightarrow$ Portal)
*   **Protocol**: OData (GET)
*   **Trigger**: Accounts clearing updates in SAP FI-AP.
*   **Core Fields**:
    ```json
    {
      "Transporter_Invoice_No": "INV-2026-0092",
      "SAP_Document_No": "5105600291",
      "Clearing_Doc_No": "1000049281",
      "Clearing_Date": "2026-07-28",
      "Payment_Status": "PAID",
      "Paid_Amount": 9830.56
    }
    ```

### Interface 7: Master Data Sync (SAP $\rightarrow$ Portal)
*   **Protocol**: OData (GET/Incremental)
*   **Trigger**: Updates to Vendor tables (`LFA1` / Business Partner definitions).
*   **Core Fields**:
    ```json
    {
      "Vendor_Code": "VND_88902",
      "Vendor_Name": "Zarbon Freight Logistics Ltd",
      "Email": "freight@zarbonlogistics.co.za",
      "Tax_Registration_No": "4001928345"
    }
    ```

---

## 6. OCR Validation & Document Storage Architecture

### A. OCR Validation Rules
Upon document upload, the portal runs the document through the designated OCR API (e.g. SAP BTP Document Information Extraction or a local OCR service).
*   **Target Fields**: Waybill Number, Offload Weight, Truck Registration.
*   **Matching Thresholds**:
    *   *Weight Match*: Discrepancies between OCR read weight and SAP weighbridge weight must be within **$\pm$ 0.5%** or **0.1 Tons** (whichever is lower).
    *   *Text Match*: Exact case-insensitive string match is required for Truck Registration.
    *   *Confidence Gate*: If the OCR library reports a character extraction confidence score below **85%**, the transaction is routed to manual Admin verification.

### B. Document Storage
*   No document binaries are stored permanently on the Portal servers to comply with security requirements.
*   Successfully validated documents are pushed immediately to SAP S/4HANA via ArchiveLink or DMS interface and archived in the ERP database.
*   Files are deleted from temporary portal staging directories within 24 hours of successful archiving.

---

## 7. Exception Handling & Troubleshooting

### Exception 1: OCR Read Discrepancy
*   **Scenario**: The scanned POD weight shows 32.5 Tons, but the weighbridge record in SAP shows 34.8 Tons.
*   **System Action**: The Portal flags the delivery with a `Discrepancy` tag and blocks the invoicing function.
*   **Resolution Step**: The Portal Admin must inspect the scanned POD document. If it is a typographical error from the OCR engine, the Admin enters a manual override. If it is a genuine weighbridge dispute, the Admin rejects the POD and notifies the Transporter to upload a corrected ticket.

### Exception 2: SAP Gateway API Timeout
*   **Scenario**: The Portal attempts to post a Parked Invoice (MIRO), but the S/4HANA server is down or times out.
*   **System Action**: The Portal saves the invoice locally with a `Pending Sync` status.
*   **Resolution Step**: The backend task processor attempts retries every 30 minutes (up to a maximum of 5 retries). If failures persist, the system triggers an alert to the Ikwezi IT integration team and logs the transaction in the integration dead-letter queue.

### Exception 3: Weight Tolerance Limit Violations
*   **Scenario**: A weighbridge discrepancy exceeds the $\pm$ 0.5% weight tolerance limit due to material loss during transit.
*   **System Action**: Portal automatically triggers a debit note draft request matching the difference.
*   **Resolution Step**: The Accounts team reviews the debit note draft in SAP before clearing the final invoice payment.
