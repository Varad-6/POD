# POD — Forensic Analysis Report
**Date**: 2026-08-12  
**Analyst**: Antigravity CLI — Lead Enterprise Architect  
**Branch**: `ali` (commit `ea55628`)  
**Status**: Pre-transformation baseline

---

## 1. ENVIRONMENT DISCOVERY

```
Frontend:        React 19 + Vite 8 + TypeScript 6
Backend:         NONE (no backend/ directory exists in current commit)
Database:        NONE (no real DB — localStorage only)
ORM:             NONE
Authentication:  Fake (username match in USERS array, no password check in code)
Authorization:   Client-side role check only (DemoContext currentUser.role)
API:             NONE (no REST API — all state is in-memory + localStorage)
Deployment:      SAP BTP Static Site (documented in sap_btp_static_deploy_guide.md)
Testing:         playwright installed as dependency but NO tests written
Containerization: NONE
Linting:         oxlint configured
Build:           BROKEN — TS compile error in DriverDashboard.tsx:100
```

---

## 2. REPOSITORY STRUCTURE

```
POD/
├── src/
│   ├── App.tsx                    — Root router + demo bar + route definitions
│   ├── main.tsx                   — React 19 entry point
│   ├── index.css                  — Global CSS + table/form/button utilities
│   ├── App.css                    — Minimal overrides (near-empty)
│   ├── components/
│   │   ├── Card.tsx               — Simple white card wrapper
│   │   ├── EmptyState.tsx         — Empty state display
│   │   ├── FileUploadBox.tsx      — Drag-and-drop file uploader
│   │   ├── LoadingSpinner.tsx     — Spinner animation
│   │   ├── Modal.tsx              — Generic modal
│   │   ├── Sidebar.tsx            — Role-aware nav sidebar
│   │   ├── StatusBadge.tsx        — Color-coded status pill
│   │   ├── Toast.tsx              — Toast notifications
│   │   └── TopBar.tsx             — Top header bar with notifications
│   ├── context/
│   │   └── DemoContext.tsx        — ALL state (auth + PO + offload + invoice + notifications)
│   ├── data/
│   │   └── mockData.ts            — ALL hardcoded mock business data
│   ├── styles/
│   │   └── theme.css              — CSS custom properties / design tokens
│   ├── utils/
│   │   └── format.ts              — Date formatting helper
│   └── views/
│       ├── Login.tsx              — 5-persona quick-login screen
│       ├── AdminDashboard.tsx     — CA: dashboard summary
│       ├── AdminContracts.tsx     — CA: contracts + POs management
│       ├── AdminApprovals.tsx     — CA: POD verification queue + OCR review
│       ├── AdminInvoices.tsx      — CA: invoice posting + payment
│       ├── TransporterDashboard.tsx — TA: summary dashboard
│       ├── TransporterPOs.tsx     — TA: PO list + driver assignment
│       ├── TransporterPODs.tsx    — TA: POD upload + OCR display
│       ├── TransporterInvoices.tsx — TA: invoice submission
│       ├── DriverDashboard.tsx    — DR: active run management (mobile intent)
│       ├── SupervisorDashboard.tsx — SR: weighbridge gate approval
│       └── CustomerDashboard.tsx  — CR: delivery verification + weight logging
├── db/
│   └── mockData.js                — Redundant copy of data/mockData.ts (JavaScript)
├── mock-data/
│   ├── contracts-index.json       — 4 contracts (same as mockData.ts)
│   ├── pos-index.json             — 18 POs (same as mockData.ts)
│   ├── pods-index.json            — 18 offload records (same as mockData.ts)
│   └── invoices-index.json        — 18 invoices (same as mockData.ts)
├── docs/                          — (this directory — newly created)
├── public/                        — Static assets
├── index.html                     — Vite entry HTML
├── package.json                   — Dependencies
├── vite.config.ts                 — Minimal Vite config
├── tsconfig*.json                 — TypeScript configs
├── README.md                      — Demo walkthrough guide
├── SOP.md                         — Standard Operating Procedure
├── CHANGELOG.md                   — Feature history
├── logins.md                      — Extended login credentials
├── production_pitch_deck.html     — HTML pitch deck (52KB)
├── sap_btp_static_deploy_guide.md — BTP static site deployment
└── Transporter-Portal-Demo-Scope.md — Demo scope document
```

---

## 3. ARCHITECTURE ASSESSMENT

### Current Architecture
```
Browser
  └── React SPA (Vite)
       └── DemoContext (localStorage)
            └── mockData.ts (hardcoded arrays)
```

**There is no backend.** The README describes a Node.js + Excel backend that does NOT exist in the current repository. The application is a pure React SPA with all state stored in `DemoContext` and persisted to `localStorage`.

### Architecture Problems
- No backend API layer whatsoever
- No database — localStorage is the "database"
- No authentication — login only checks username string match in USERS array
- No password verification in code (accepts any string that matches username)
- No RBAC enforcement — any user can call any action from browser console
- No integration adapter interface — SAP coupling will require frontend rewrite
- No SAP adapter pattern — no MockSAPAdapter, no ISAPAdapter interface
- State management is one monolithic 737-line context file
- All business data is hardcoded in mockData.ts (1127 lines)
- Data exists in 3 redundant locations (mockData.ts, db/mockData.js, mock-data/*.json)

---

## 4. CURRENT BUSINESS FUNCTIONALITY (ACTUAL)

### What POD ACTUALLY does today:

| # | Capability | Persona | Works? | Notes |
|---|-----------|---------|--------|-------|
| 1 | Login (username match) | ALL | ✓ | No password check |
| 2 | Role-based routing | ALL | ✓ | Works correctly |
| 3 | View Contracts | CA | ✓ | From hardcoded array |
| 4 | View POs | CA, TA | ✓ | From hardcoded array |
| 5 | Assign PO to Transporter | CA | ✓ | Updates in-memory state |
| 6 | Assign Driver + Vehicle to PO | TA | ✓ | Creates OffloadRecord |
| 7 | Driver confirms arrival | DR | ✓ | Demo simulation buttons |
| 8 | Supervisor logs dispatch weights | SR | ✓ | 4-point weighbridge |
| 9 | Driver departs siding | DR | ✓ | Status → EN_ROUTE |
| 10 | Customer logs arrival weights | CR | ✓ | Damage tracking |
| 11 | Driver uploads POD document | DR | ✓ | Simulated OCR |
| 12 | Admin reviews POD + OCR match | CA | ✓ | 3 waybills in queue |
| 13 | Admin approves/rejects POD | CA | ✓ | Creates invoice record |
| 14 | Transporter submits invoice | TA | ✓ | Number + file upload |
| 15 | Admin posts invoice (MIRO sim) | CA | ✓ | Status → POSTED |
| 16 | Admin marks invoice PAID | CA | ✓ | Status → PAID |
| 17 | Notifications (bell) | TA | ✓ | On POD approval/rejection |
| 18 | Demo role switcher | ALL | ✓ | Top bar dropdown |
| 19 | Demo state reset | ALL | ✓ | Restores to mockData defaults |

---

## 5. DATA MODEL ANALYSIS

### Current Entities
- **User** — username, role, companyName, displayName (no ID, no password hash)
- **Contract** — contractNumber, qualityType, targetQty, rate, validity, locations
- **PurchaseOrder** — poNo, contractRef, transporter, product, rate, qty, status
- **OffloadRecord** — waybillNo, poRef, vehicle, driver, bilty, 4-point weights, damage, OCR, podStatus
- **Invoice** — invoiceNo, waybillNo, quantity, rate, amount, status
- **OCRResult** — waybillNo, confidence, extracted, sapRecord, matchResult (only 3 records)
- **DemoNotification** — id, text, read, link, timestamp

### Data Model Problems
- No entity IDs (using business keys as PKs — fragile)
- PurchaseOrder.status and OffloadRecord.podStatus are duplicate overlapping state machines
- OffloadRecord has deprecated legacy weight fields (tareWeightKg, grossWeightKg, netWeightKg) plus newer 4-point fields — inconsistent
- No vehicle/truck master data entity (reg numbers scattered across OffloadRecord)
- No driver master data entity (driver info duplicated across User + OffloadRecord)
- No audit trail entity
- No exception entity
- Invoice calculation based on legacy netWeightKg (not the correct 4-point measurement)
- INVOICES pre-seeded with 18 records — most in AWAITING_INVOICE_SUBMISSION without a corresponding approved POD

---

## 6. SAP ANALYSIS

### What the project CLAIMS about SAP

From SOP.md and README.md:
- Target: SAP S/4HANA (On-Premise) — confirmed in SOP.md line 6
- Integration via custom ABAP REST/OData Gateway endpoints
- 7 documented interfaces (PO Sync, E-Sign, SRN Sync, POD Attachment, MIRO, Payment Sync, Master Data)
- References: LFA1 (vendor), MIRO (invoice verification), ArchiveLink/DMS (document storage)
- Business: **Coal transport** from mine siding to Richards Bay / customer sites

### What this means for SAP validation

| Claim | Status | Notes |
|-------|--------|-------|
| S/4HANA On-Premise | CONFIRMED | SOP.md explicitly states S/4HANA On-Premise |
| Purchase Contract (source) | PLAUSIBLE | SAP Scheduling Agreement or Purchase Contract likely |
| Purchase Order | PLAUSIBLE | PO with service item or material item |
| Transport via PO | UNVERIFIED | Could be SAP TM, embedded TM, or procurement model |
| MIRO for freight invoice | PLAUSIBLE | Standard supplier invoice verification |
| OData Gateway | PLAUSIBLE | Standard S/4HANA integration approach |
| ArchiveLink for POD | PLAUSIBLE | Standard SAP document management |
| Waybill (Bilty) as SAP object | UNVERIFIED | Likely carrier document, not SAP standard |

---

## 7. PROBLEMS IDENTIFIED

### Critical (Blocking)
1. **TS Compile Error**: `DriverDashboard.tsx:100` calls `customerLogWeights` with 4 args, function expects 8
2. **No backend**: README describes backend that doesn't exist
3. **No real authentication**: Password never validated
4. **No API layer**: Cannot swap MockSAP for real S21 without frontend rewrite
5. **Monolithic context**: All business logic in one 737-line file — unmaintainable

### Architectural
6. **No SAP adapter interface**: No `ISAPAdapter`, no `MockSAPAdapter`, no `S21Adapter` stub
7. **No integration layer**: UI directly coupled to mock data arrays
8. **Duplicate data**: Same data in 3 locations (mockData.ts, db/, mock-data/)
9. **No state machine**: Status transitions not formally defined or enforced
10. **No audit logging**: No record of who did what when

### Data Model
11. **Duplicate status tracking**: PO.status and OffloadRecord.podStatus overlap and conflict
12. **Deprecated weight fields**: Legacy fields not cleaned up
13. **No master data**: Vehicles, drivers treated as strings not entities
14. **Pre-seeded invoice conflicts**: INVOICES array has records for non-approved PODs

### UI/UX
15. **Demo bar always visible**: Pollutes every screen including login
16. **No mobile-first design**: Driver dashboard is desktop-sized form in a mobile persona
17. **Hardcoded driver name check**: `DriverDashboard.tsx:64` checks for "dumisani dlamini" literally
18. **Generic page titles**: "Portal Dashboard" instead of role-specific labels
19. **Sidebar generic title**: "Logistics Portal" not "POD" or "Ikwezi POD"
20. **Login page**: Quick-click cards instead of proper enterprise login flow

### Business Logic
21. **Invoice calc uses wrong weight**: Uses legacy `netWeightKg` not the accepted 4-point `acceptedNetWeightKg`
22. **OCR only on 3 waybills**: 18 waybills exist but OCR data only for WB-998807/808/809
23. **Bilty number auto-generated**: `BLT-${random}` — should be a real carrier document reference
24. **No OTP/GPS**: Referenced in product description but not implemented
25. **MIRO simulation incomplete**: "posting" just changes invoice status — no SAP document number generated

---

## 8. CURRENT PERSONAS vs REQUIRED

| Persona | Code Name | Current Routes | Navigation Items | Status |
|---------|-----------|---------------|-----------------|--------|
| Company Admin | COMPANY_ADMIN/IKWEZI_ADMIN | /admin/* | Dashboard, Contracts & POs, POD Approvals, Invoices | INCOMPLETE |
| Transporter Admin | TRANSPORTER_ADMIN/TRANSPORTER | /transporter/* | Dashboard, Purchase Orders, Proof of Delivery, Invoices | INCOMPLETE |
| Driver | DRIVER | /driver/dashboard | Driver Console (1 page) | VERY INCOMPLETE |
| Supervisor | SUPERVISOR | /supervisor/dashboard | Weighbridge Gate (1 page) | INCOMPLETE |
| Customer | CUSTOMER | /customer/dashboard | Receiving Yard (1 page) | INCOMPLETE |

---

## 9. TECHNICAL DEBT SUMMARY

| Category | Count | Severity |
|----------|-------|---------|
| Compile Errors | 1 | CRITICAL |
| Missing Backend | 1 | HIGH |
| No SAP Adapter Interface | 1 | HIGH |
| Hardcoded Business Data | 5 locations | HIGH |
| Missing Functionality | 8+ areas | MEDIUM |
| Data Model Inconsistency | 4 areas | MEDIUM |
| UI/UX Issues | 10+ areas | MEDIUM |
| Dead/Redundant Code | 3 data files | LOW |

---

## 10. WHAT BELONGS WHERE

| Item | Belongs To | Notes |
|------|-----------|-------|
| Contracts (Purchase Contracts) | SAP S/4HANA | Source of truth — synced to POD |
| Purchase Orders | SAP S/4HANA | Generated from contracts — synced to POD |
| Vendor/Transporter Master | SAP S/4HANA | LFA1 / Business Partner |
| Waybill/Bilty | POD / Carrier | Not a native SAP object |
| Weighbridge Records | POD + External Weighbridge | Operational data |
| OCR Extraction | POD | External AI/OCR service |
| POD Document | POD → SAP ArchiveLink | Stored in SAP after verification |
| Invoice Verification (MIRO) | SAP S/4HANA | Triggered by POD after verification |
| GPS/OTP | POD | Execution/security evidence |
| Driver Assignment | POD | Operational assignment |
| Vehicle Assignment | POD | Operational assignment |
| Supervisor Approval | POD | Pre-dispatch gate |
| Customer Confirmation | POD | Customer delivery record |
| Audit Log | POD | Event sourcing / trail |
