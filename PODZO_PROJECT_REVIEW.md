# PODZO — Comprehensive Project & Architecture Review Report

---

## 1. Executive Summary

### 1.1 Product Purpose & Domain Overview
**PODZO** is an enterprise logistics execution, Proof-of-Delivery (POD) verification, and automated freight billing platform. Engineered for industrial bulk haulage (e.g., coal, minerals, aggregates, and heavy raw materials), PODZO acts as an operational execution layer operating between enterprise ERP systems (**SAP S4/HANA and SAP S21**) and physical transport operations on the ground.

### 1.2 Core Business Problems Solved
1. **Manual Paper POD Delays**: Traditional delivery slips take 30 to 90 days to collect, verify, and settle manually. PODZO automates verification within minutes of delivery.
2. **Cargo Theft & Weight Discrepancies**: Unmonitored weight loss between siding dispatch weighbridges and customer destination weighbridges leads to undetected losses. PODZO enforces **quad-gate weighbridge reconciliation** across every run.
3. **Billing Fraud & Miscalculations**: Freight invoices raised against incorrect weights or non-contractual rates are eliminated through automated tolerance matching and rate-binding algorithms.
4. **Data Silos Across Stakeholders**: Mine managers, transport contractors, truck drivers, gate supervisors, and customer receiving stations operate on a single shared execution ledger.

---

## 2. Technology Stack & System Architecture

| Architecture Layer | Technology Selection | Core Responsibilities |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript + Vite 8 | Responsive SPA supporting 5 distinct operational persona views |
| **UI Design & Theme** | Custom CSS Theme (`theme.css`) + Lucide React | Industrial Modern design palette (`#0A192F` Navy, `#FF5B00` Accent) |
| **State & Routing** | React Router DOM 7 + React Context API | Persona route authorization, JWT context (`AuthContextV3`), contract scoping |
| **Backend Server** | Node.js + Express 5.2.1 + `tsx` | RESTful API endpoints (`/api/v3`), JWT auth, file upload middleware |
| **Database Storage** | SQLite + `better-sqlite3` 13.0.3 | High-performance relational database (`podzo_portal_v3.db`) |
| **SAP ERP Integration** | TypeScript Adapter Pattern (`ISAPAdapter`) | Dual-mode: OData HTTP integration with fallback to local database endpoints |
| **Cloud Deployment** | SAP BTP / Cloud Foundry (`mta.yaml`, `manifest.yml`) | Multi-Target Application descriptor for enterprise cloud hosting |

---

## 3. Persona Matrix & Role-Based Access Control (RBAC)

PODZO organizes system access into **5 operational personas**, each tailored to a specific operational role:

### 3.1 Role Responsibilities & Component Mapping

- **Company Admin (`CA`) — Mine / Logistics Manager**
  - **Responsibilities**: Contract management, PO distribution, audit/review queue resolution, invoice approval, SAP MIRO invoice posting, and system demo reset.
  - **Key Pages**: `AdminDashboard.tsx`, `AdminContracts.tsx`, `AdminApprovals.tsx`, `AdminInvoices.tsx`.
  - **Demo Accounts**: `ca_thandiwe`, `company_admin`.

- **Transporter Admin (`TA`) — Transport Vendor Supervisor**
  - **Responsibilities**: Review PO allocations, job configuration, driver/vehicle pairing, waybill POD management, and freight invoice submission.
  - **Key Pages**: `TransporterDashboard.tsx`, `TransporterPOs.tsx`, `TransporterPODs.tsx`, `TransporterInvoices.tsx`.
  - **Demo Accounts**: `ta_sipho`, `transporter_admin`, `transporter_cbs`.

- **Driver (`DR`) — Truck Driver**
  - **Responsibilities**: Mobile interface for digital signature on job acceptance, pickup OTP verification, transit milestone logging, and POD slip photo upload.
  - **Key Pages**: `DriverDashboard.tsx`.
  - **Demo Accounts**: `dr_zweli`, `driver`.

- **Weighbridge Supervisor (`SR`) — Mine Siding Gate Operator**
  - **Responsibilities**: Pre-dispatch check-in, driver credential validation, Gate 1 empty truck tare weight & Gate 2 loaded truck gross weight recording, supervisor stamp issuance.
  - **Key Pages**: `SupervisorDashboard.tsx`.
  - **Demo Accounts**: `sr_gate01`, `supervisor`.

- **Customer Receiver (`CR`) — Destination Receiving Site Manager**
  - **Responsibilities**: Destination arrival geofence check, Gate 3 loaded gross weight & Gate 4 offloaded tare weight recording, destination OTP verification, customer stamp issuance.
  - **Key Pages**: `CustomerDashboard.tsx`.
  - **Demo Accounts**: `cr_mining`, `customer`.

---

## 4. Operational Workflow & Quad-Gate Weight Reconciliation

### 4.1 End-to-End Operational Lifecycle

```
[ SAP S21 ERP ] ──► Contract & PO Import
      │
      ▼
[ Transporter Admin ] ──► PO Allocation & Driver/Vehicle Pairing
      │
      ▼
[ Driver Canvas ] ──► Digital Signature & PO Acceptance
      │
      ▼
[ Mine Siding Gate ] ──► Gate 1 (Mine Tare) & Gate 2 (Mine Gross) Weighments
      │
      ▼
[ Delivery Transit ] ──► Geofence Arrival & OTP Verification
      │
      ▼
[ Customer Site Gate ] ──► Gate 3 (Dest Gross) & Gate 4 (Dest Tare) Weighments
      │
      ▼
[ POD Upload ] ──► Scanned Document Upload & OCR Reconciliation
      │
      ▼
[ Exception Audit ] ──► Company Admin Review Queue Approval (if flagged)
      │
      ▼
[ SAP Invoicing ] ──► Parked -> Posted -> Cleared MIRO Invoice
```

### 4.2 Quad-Gate Weight Reconciliation Formulas

The system records weights across **4 distinct checkpoints**:

- **Net Mine Payload** = Gate 2 (Mine Gross) - Gate 1 (Mine Tare)
- **Net Delivered Payload** = Gate 3 (Dest Gross) - Gate 4 (Dest Tare)
- **Weight Variance (kg)** = |Net Mine Payload - Net Delivered Payload|
- **Variance (%)** = (Weight Variance / Net Mine Payload) * 100

### 4.3 Automated Review Queue & Exception Handling
If **Variance (%)** exceeds the contract tolerance threshold (e.g. **0.5%**), or if the scanned POD document produces an OCR weight mismatch or low confidence score (< 80%), the system automatically:
1. Flags the consignment in the `review_queue`.
2. Sets `blocks_miro_bool = 1`, which strictly prevents invoice creation in SAP.
3. Routes the entry to the Company Admin for side-by-side audit and manual override/approval.

---

## 5. Database Schema Architecture (SQLite V3)

The project utilizes SQLite (`podzo_portal_v3.db`) with `better-sqlite3`. Main tables include:

- `users`: User profiles, hashed passwords, roles (`CA`, `TA`, `DR`, `CR`, `SR`).
- `contracts`: Master SAP contract numbers, material specs, target values, and validity periods.
- `purchase_orders`: Master SAP PO items, rates, target quantities, and percentage tolerances.
- `transport_assignments`: Core operational tracking state machine (`ASSIGNED`, `MINE_TARE_LOGGED`, `MINE_GROSS_LOGGED`, `DISPATCHED`, `DELIVERED`, `POD_UPLOADED`, `APPROVED`, `MIRO_POSTED`).
- `weight_logs`: Quad-gate weighbridge logs (`MINE_TARE`, `MINE_GROSS`, `DEST_GROSS`, `DEST_TARE`).
- `pod_documents`: Scanned POD slip URLs, OCR extracted values, confidence scores, and match indicators.
- `review_queue`: Exception audit records with resolution notes and blocking flags.
- `delivery_invoices` & `miro_invoices`: Calculated freight amounts, SAP document IDs, and clearing states.

---

## 6. Implementation Status & System Audit Matrix

| Feature Module | Status | Technical Implementation Details |
| :--- | :---: | :--- |
| **V3 Full-Stack Engine** | **COMPLETED** | Fully operational Node.js/Express 5 server + SQLite DB + React 19 SPA |
| **5-Persona RBAC & Auth** | **COMPLETED** | JWT bearer tokens, bcrypt password hashing, role-restricted routes |
| **Quad-Gate Weighment** | **COMPLETED** | Full logging across all 4 gate checkpoints with automated weight math |
| **Tolerance Reconciliation** | **COMPLETED** | Automated percentage variance calculation against PO thresholds |
| **Review Queue Blocking** | **COMPLETED** | Strict transactional blocking of MIRO invoice creation on open exceptions |
| **E-Signature Capture** | **COMPLETED** | HTML5 canvas signature pad component (`SignaturePad.tsx`) |
| **System Demo Reset** | **COMPLETED** | `POST /api/v3/demo/reset` clears transactional runs while preserving SAP data |
| **OCR Document Engine** | **SIMULATED** | Prototype filename pattern matching engine (`OCRSim`) |
| **SAP Live Write-Back** | **SIMULATED** | Live OData GET fetching enabled with local Express fallback; posting is mock state |
| **GPS Geofencing** | **SIMULATED** | Haversine formula backend calculation with mock frontend geolocation |

---

## 7. Operational Recommendations & Roadmap

1. **Production OCR Integration**: Replace static pattern-matching `OCRSim` with AWS Textract or Google Document AI for live field extraction from scanned POD PDFs.
2. **Live SAP Write-Back**: Connect `S21SAPAdapter.ts` to SAP Gateway RFC/OData POST endpoints for live MIRO document creation in SAP production environments.
3. **IoT Weighbridge Connectivity**: Integrate serial/MQTT connectors for direct weight reading from physical weighbridge indicator hardware.
4. **Cloud Storage Provider**: Transition uploaded file storage from local `/uploads` directory to AWS S3 or SAP BTP Document Management Service.

---
*Report Generated by Antigravity AI | Project Source: PODZO (Varad-6/POD)*
