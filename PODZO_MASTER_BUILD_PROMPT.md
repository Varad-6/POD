<!--
  PROMPT-MASTER OPTIMISED · Target: Claude Opus 5 / Claude Code agentic session
  Framework: Template M · Token Audit: PASSED · Every word is load-bearing.
-->

<context>
Target tool: Claude Opus 5 (claude.ai Projects or Claude Code agentic session).
This document is a complete, self-contained build specification for the PODZO system.
Read ALL sections before writing a single file. Every ambiguity is resolved here.
Do not ask questions. Do not stop for confirmation. Do not add features beyond the spec.
</context>

<memory_block>
CREDENTIALS (all passwords: Demo@1234)
  ca_thandiwe → role CA → /dashboard
  ta_sipho    → role TA → /ta/dashboard
  sr_gate01   → role SR → /sr/dashboard
  dr_zweli    → role DR → /dr/dashboard
  cr_mining   → role CR → /cr/dashboard

PORTS: frontend=5173  backend=3001
DB FILE: ./server/db/podzo_portal_v3.db
UPLOAD DIR: ./public/uploads/{biltys,pods,contracts,invoices}/
JWT_SECRET env var: podzo_dev_secret_change_in_prod  JWT_EXPIRY: 8h

7-STEP WORKFLOW
  1. CA triggers SAP sync → contracts + POs imported into local DB
  2. CA creates job_config → TA accepts → assigns driver+vehicle → e-sign → bilty upload
  3. SR: supervisor safety checks → Mine Tare weight → Mine Gross weight → dispatch OTP
  4. DR: enters OTP → confirms dispatch → logs EN_ROUTE milestone → logs ARRIVED
  5. CR: Dest Gross weight → Dest Tare weight → delivery OTP → stamps physical POD slip
  6. DR/TA uploads POD photo → CA runs OCR → auto-approve (confidence≥90%) OR review queue
  7. CA approves → generates delivery invoice → parks MIRO → posts → clears

ASSIGNMENT STATUS ENUM (valid transitions only, in order):
  ASSIGNED → MINE_TARE_LOGGED → MINE_GROSS_LOGGED → DISPATCHED → EN_ROUTE
           → ARRIVED → DELIVERED → POD_UPLOADED → UNDER_REVIEW → APPROVED
           → INVOICED → MIRO_PARKED → MIRO_POSTED → CLEARED
  GATE_DENIED = terminal failure state (no further transitions)

INVOICE CHAIN:
  transport_assignments (APPROVED)
    → delivery_invoices   (DRAFT → SENT_TO_CA)
    → main_invoices       (PO_DONE)
    → miro_invoices       (PARKED → POSTED → CLEARED)

WEIGHT FORMULAS:
  net_dispatch_kg  = mine_gross_kg  - mine_tare_kg
  net_received_kg  = dest_gross_kg  - dest_tare_kg
  transit_loss_kg  = net_dispatch_kg - net_received_kg
  loss_pct         = (transit_loss_kg / net_dispatch_kg) * 100
  FLAG if loss_pct > tolerance_pct (from purchase_orders)
  accepted_payload_tonnes = net_received_kg / 1000
  invoice_total_ZAR       = ROUND(accepted_payload_tonnes × rate_per_tonne, 2)

OCR ROUTING:
  confidence ≥ 90% AND waybill_match AND weight_within_tolerance → AUTO-APPROVE
  confidence ≥ 70% AND weight_within_tolerance                  → REVIEW (AWAITING_CA_VERIFY)
  confidence < 70% OR weight_outside_tolerance                  → REVIEW (OCR_MISMATCH)

OTP RULES: 6 digits, valid 30 min, max 3 failed attempts then regenerate, no reuse.
BILTY FORMAT: BLT-YYYYMMDD-NNNNN   INVOICE FORMAT: INV-YYYYMMDD-NNNNN
CURRENCY: ZAR. No GST line on invoice (tax handled in SAP MIRO).
TIMEZONE: store UTC ISO-8601; display Asia/Kolkata (IST UTC+5:30) in UI.
</memory_block>

<scope_lock>
DO NOT ADD: GraphQL, Redis, Docker, Prisma, any ORM, Tailwind, Bootstrap, Material UI,
Ant Design, React Query, Redux, Zustand, Axios (use native fetch), refresh tokens,
WebSockets, real OCR API integration, real GPS hardware, real SAP write-back,
multi-tenancy, any npm package not listed in Section C.
DO NOT ask questions. DO NOT truncate any file. DO NOT write "// rest unchanged".
Every generated file MUST start with a comment: // FILE: path/to/filename.ext
</scope_lock>

<task>
Build the complete PODZO system. Output files in this exact order:
1. package.json            11. server/routes/auth_v3.ts
2. tsconfig.json           12. server/routes/api_v3.ts
3. tsconfig.app.json       13. server/index.ts
4. tsconfig.node.json      14. src/services/ISAPAdapter.ts
5. .env.example            15. src/services/MockSAPAdapter.ts
6. vite.config.ts          16. src/services/S21SAPAdapter.ts
7. index.html              17. src/lib/api.ts
8. server/db/schema_v3.sql 18. src/utils/validators.ts + formatters.ts
9. server/db/seed_v3.sql   19. src/contexts/AuthContextV3.tsx
10. server/db/database_v3.ts + reset_db_v3.ts + middleware/auth.ts
Then: src/styles/globals.css → all src/components/* → src/pages/* → src/views/* → src/App.tsx → src/main.tsx → README.md
</task>

<success_criteria>
- `npm run server` starts, logs "🚀 PODZO Portal Server v3 running on http://localhost:3001"
- `npm run dev` starts, logs "Local: http://localhost:5173/"
- `npx tsc --noEmit` exits with 0 errors
- All 5 credentials login, redirect to correct role dashboard
- CA completes steps 1–7 end-to-end with seeded data
- GET /health → {status:'ok', db:'connected', uptime_seconds:N}
- DEST_GROSS before MINE_GROSS → 409 with message containing 'sequence'
- Over-allocation → 409 with message containing 'over-allocation'
- Expired contract assignment → 409 with message containing 'expired'
- MIRO PARKED→CLEARED direct skip → 409
- Review queue with blocks_miro_bool=1 blocks MIRO park → 409
- Demo reset wipes operational tables, preserves contracts + purchase_orders
</success_criteria>

---

# PODZO MASTER BUILD PROMPT

## SECTION A — EXECUTION CONTRACT

- **Role**: You are a senior full-stack engineer. Build the entire PODZO system.
- **Rule**: Do not ask questions. Do not stop for confirmation. Every ambiguity is resolved in this document. Build everything in one run.
- **Definition of Done**: runs with `npm install && npm run server` (backend port 3001) + `npm run dev` (frontend port 5173), seeded DB, all 5 personas can login and complete the full 7-step workflow end-to-end, zero TypeScript errors, zero browser console errors on happy paths.
- **Output order**: package.json -> tsconfigs -> .env.example -> vite.config.ts -> server scaffolding -> DB schema SQL -> seed SQL -> all server routes -> all frontend contexts -> all frontend components -> all frontend views/pages -> App.tsx/main.tsx -> README.
- **Rule**: Produce complete files. Never truncate. Never write `// rest unchanged`. Never write `// ... etc`. Every file must be copy-pasteable and runnable.

## SECTION B — PRODUCT OVERVIEW & BUSINESS CONTEXT

- **Client**: Ikwezi Mining Limited (Pty) Ltd
- **Problem**: Manual paper POD processing causes 30-90 day invoice delays, undetected transit losses (coal/minerals stolen or short-loaded), fraudulent invoicing against wrong weights, zero real-time operational visibility.
- **Solution**: PODZO = POD-to-payment automation bridging SAP S/4HANA (internally called S/21) with physical transport execution.
- **Full glossary**:
  - **bilty**: waybill/consignment note issued at dispatch.
  - **POD**: proof of delivery — stamped slip returned at destination.
  - **tare weight**: empty truck weight.
  - **gross weight**: loaded truck weight.
  - **net weight**: gross minus tare = actual payload.
  - **mine tare**: tare at mine siding before loading.
  - **mine gross**: gross at mine siding after loading.
  - **dest gross**: gross at destination before offloading.
  - **dest tare**: tare at destination after offloading.
  - **net dispatch**: mine_gross - mine_tare.
  - **net received**: dest_gross - dest_tare.
  - **transit loss**: net_dispatch - net_received.
  - **loss_pct**: transit_loss / net_dispatch * 100.
  - **MIRO**: Materials Invoice Verification — SAP Accounts Payable transaction.
  - **ME33K**: SAP transaction for outline agreements/contracts.
  - **ME23N**: SAP transaction for purchase orders.
  - **ML81N**: SAP service entry sheet.
  - **outline agreement**: long-term framework contract setting max tonnage, rate, validity, tolerance.
  - **tolerance**: agreed acceptable % of transit loss before invoice deduction.
  - **siding**: mine railway/truck loading bay.
  - **bilty no**: unique waybill number printed on consignment note.
- **Non-goals**: not a transport management system, not a GPS tracking product, not real-time map visualization, no mobile native app (progressive web only), no multi-tenant SaaS (single-tenant enterprise).

## SECTION C — TECH STACK & VERSIONS

```json
{
  "name": "podzo",
  "private": true,
  "version": "3.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "server": "tsx server/index.ts",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "db:reset": "tsx server/db/reset_db_v3.ts"
  },
  "dependencies": {
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.18.1",
    "lucide-react": "^1.24.0",
    "express": "^5.2.1",
    "better-sqlite3": "^13.0.3",
    "bcryptjs": "^3.0.3",
    "jsonwebtoken": "^9.0.3",
    "cors": "^2.8.6",
    "multer": "^2.2.0",
    "tsx": "^4.23.12"
  },
  "devDependencies": {
    "typescript": "~6.0.2",
    "vite": "^8.1.1",
    "@vitejs/plugin-react": "^6.0.3",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@types/node": "^24.13.2",
    "@types/express": "^5.0.6",
    "@types/better-sqlite3": "^9.6.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.19",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/multer": "^2.2.0",
    "vitest": "^3.0.0",
    "@playwright/test": "^1.61.1"
  }
}
```

**Folder Tree:**
```
podzo/
├── server/
│   ├── index.ts              # Express app entry, mounts all routes
│   ├── middleware/
│   │   └── auth.ts           # JWT verify middleware, role guard factory
│   ├── db/
│   │   ├── database_v3.ts    # better-sqlite3 connection, WAL mode, returns db instance
│   │   ├── schema_v3.sql     # Full DDL for all tables
│   │   ├── seed_v3.sql       # Demo seed data for all roles and workflow states
│   │   └── reset_db_v3.ts    # Script to reset DB
│   └── routes/
│       ├── auth_v3.ts        # POST /api/v3/auth/login, GET /api/v3/auth/me
│       └── api_v3.ts         # All business endpoints (contracts, POs, assignments, weighbridge, POD, invoices, MIRO)
├── src/
│   ├── main.tsx              # React DOM root, AuthProvider wrap
│   ├── App.tsx               # React Router routes, role-based redirect
│   ├── services/
│   │   ├── ISAPAdapter.ts    # TypeScript interface for SAP adapter
│   │   ├── S21SAPAdapter.ts  # Real OData HTTP client + Express fallback
│   │   └── MockSAPAdapter.ts # Local mock returning hardcoded SAP data
│   ├── contexts/
│   │   ├── AuthContextV3.tsx # JWT auth state, login/logout, user object
│   │   └── ContractPoContext.tsx # Contract/PO context
│   ├── components/           # Reusable UI primitives
│   ├── views/                # Full page views per persona
│   ├── pages/                # Public pages (Landing, Login)
│   ├── styles/               # Global CSS tokens and resets
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Pure helper functions
│   └── lib/                  # API client (fetch wrapper + interceptors)
├── public/
│   └── uploads/              # Static served uploaded files
│       ├── biltys/
│       ├── pods/
│       ├── contracts/
│       └── invoices/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── .env.example
└── package.json
```

**.env.example:**
```env
PORT=3001
JWT_SECRET=podzo_dev_secret_change_in_prod
JWT_EXPIRY=8h
DB_PATH=./server/db/podzo_portal_v3.db
VITE_API_BASE=/api/v3
VITE_SAP_S21_BASE_URL=
VITE_SAP_S21_CLIENT=100
VITE_SAP_S21_SYSTEM_ID=S21
VITE_SAP_USE_MOCK=true
VITE_APP_TITLE=PODZO Portal
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE_MB=10
```

## SECTION D — ARCHITECTURE

**ASCII Layer Diagram:**
```
[ Frontend: React + Vite + TS ]
  |-- Views/Pages (Role-based Dashboards)
  |-- Components (Reusable UI)
  |-- Contexts (Auth, PO State)
  |-- API Client (lib/api.ts fetching /api/v3)
---------------------------------------------
[ Backend: Node + Express + TS ]
  |-- index.ts (Entry, CORS, Static /public/uploads)
  |-- middleware/auth.ts (JWT verify, RBAC guards)
  |-- routes/api_v3.ts (Business logic)
  |-- routes/auth_v3.ts (Login/Me)
  |-- services/ISAPAdapter.ts (SAP Integration)
---------------------------------------------
[ Data Access & Persistence ]
  |-- db/database_v3.ts (better-sqlite3 WAL mode)
  |-- db/schema_v3.sql & db/seed_v3.sql
  |-- SQLite DB File (podzo_portal_v3.db)
```

**SAP Adapter Pattern:**
- `ISAPAdapter.ts` interface defines methods: `getContracts()`, `getPurchaseOrders(contractId)`, `postMIROInvoice(payload)`, `acknowledgePO(poId)`.
- `VITE_SAP_USE_MOCK=true` environment variable determines if `MockSAPAdapter` (returns hardcoded responses) or `S21SAPAdapter` (OData HTTP requests to real SAP S/4HANA backend) is used.
- JWT middleware validates Bearer tokens.
- `multer` handles file uploads in Express, saving them to `public/uploads/{type}` and storing the relative URLs in SQLite.

## SECTION E — DATABASE SCHEMA (full SQL)

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('CA','TA','DR','CR','SR')),
    display_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    entity_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sap_customer_no TEXT UNIQUE NOT NULL,
    gps_lat REAL,
    gps_lng REAL,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transporters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gstin TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transporter_id INTEGER NOT NULL REFERENCES transporters(id),
    name TEXT NOT NULL,
    license_no TEXT UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    prdp_expiry DATE,
    phone TEXT NOT NULL
);

CREATE TABLE vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transporter_id INTEGER NOT NULL REFERENCES transporters(id),
    reg_no TEXT UNIQUE NOT NULL,
    capacity REAL NOT NULL
);

CREATE TABLE contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sap_contract_no TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pdf_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE','EXPIRED','TERMINATED'))
);

CREATE TABLE purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    sap_po_no TEXT NOT NULL,
    po_item_no TEXT NOT NULL,
    material TEXT NOT NULL,
    uom TEXT NOT NULL,
    target_qty REAL NOT NULL,
    rate REAL NOT NULL,
    tolerance_pct REAL NOT NULL,
    cost_center TEXT,
    allowed_queue_time_mins INTEGER DEFAULT 60,
    detention_rate_per_hour REAL DEFAULT 150.00,
    status TEXT NOT NULL CHECK (status IN ('OPEN','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED')),
    UNIQUE(sap_po_no, po_item_no)
);

CREATE TABLE job_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id INTEGER NOT NULL REFERENCES purchase_orders(id),
    transporter_id INTEGER NOT NULL REFERENCES transporters(id),
    availability_window TEXT,
    availability_window_start TEXT DEFAULT '06:00',
    availability_window_end TEXT DEFAULT '18:00',
    requested_pickup_datetime DATETIME,
    expected_delivery_datetime DATETIME,
    final_due_datetime DATETIME,
    acceptance_window_hours INTEGER DEFAULT 4,
    tender_response_deadline DATETIME,
    timebound BOOLEAN DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('PENDING','ASSIGNED','EXPIRED'))
);

CREATE TABLE job_config_pos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_config_id INTEGER NOT NULL REFERENCES job_configs(id),
    po_id INTEGER NOT NULL REFERENCES purchase_orders(id),
    planned_qty REAL NOT NULL,
    uom TEXT DEFAULT 'TO',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_config_id, po_id)
);

CREATE TABLE transport_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_config_id INTEGER NOT NULL REFERENCES job_configs(id),
    driver_id INTEGER NOT NULL REFERENCES drivers(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    location TEXT NOT NULL,
    license_no TEXT NOT NULL,
    gstin TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    assigned_qty REAL NOT NULL,
    queue_entry_time DATETIME,
    actual_arrival_time DATETIME,
    loading_status TEXT DEFAULT 'PENDING',
    journey_authorized BOOLEAN DEFAULT 0,
    queue_time_mins INTEGER,
    penalty_amount REAL,
    dispatch_ip TEXT,
    dispatch_user_agent TEXT,
    status TEXT NOT NULL CHECK (status IN ('ASSIGNED','GATE_DENIED','MINE_TARE_LOGGED','MINE_GROSS_LOGGED','DISPATCHED','EN_ROUTE','ARRIVED','DELIVERED','POD_UPLOADED','UNDER_REVIEW','APPROVED','INVOICED','MIRO_PARKED','MIRO_POSTED','CLEARED')) DEFAULT 'ASSIGNED'
);

CREATE TABLE driver_assignment_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
    otp_code TEXT,
    location TEXT,
    gps_lat REAL,
    gps_lng REAL,
    material TEXT,
    truck_no TEXT,
    popup_ack_bool BOOLEAN DEFAULT 0,
    time_captured DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE weight_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES transport_assignments(id),
    stage TEXT NOT NULL CHECK (stage IN ('MINE_TARE','MINE_GROSS','DEST_GROSS','DEST_TARE')),
    weight_kg REAL NOT NULL,
    truck_detail TEXT,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supervisor_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES transport_assignments(id),
    arrival_date DATE NOT NULL,
    arrival_time TEXT NOT NULL,
    weight_check_bool BOOLEAN NOT NULL,
    bilty_check_bool BOOLEAN NOT NULL,
    material_check_bool BOOLEAN NOT NULL,
    license_check_bool BOOLEAN NOT NULL,
    checked_by INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE supervisor_stamp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES transport_assignments(id),
    date_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    gps_lat REAL,
    gps_lng REAL,
    otp_match_bool BOOLEAN NOT NULL
);

CREATE TABLE bilty_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
    bilty_no TEXT NOT NULL,
    bilty_date DATE NOT NULL,
    upload_url TEXT NOT NULL
);

CREATE TABLE delivery_capture (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
    truck_data_json TEXT,
    issues_text TEXT,
    weight_log_ref INTEGER REFERENCES weight_logs(id),
    unit_calc TEXT,
    stamp_confirmed_bool BOOLEAN DEFAULT 0,
    stamped_at DATETIME
);

CREATE TABLE otp_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES transport_assignments(id),
    stage TEXT NOT NULL CHECK (stage IN ('PICKUP','DELIVERY')),
    otp_code TEXT NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME,
    verified_by_role TEXT,
    contact TEXT,
    status TEXT NOT NULL CHECK (status IN ('PENDING','VERIFIED','EXPIRED'))
);

CREATE TABLE arrival_confirmations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
    driver_confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    gps_lat REAL,
    gps_lng REAL,
    ip_address TEXT,
    device_info TEXT
);

CREATE TABLE transit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES transport_assignments(id),
    status TEXT NOT NULL CHECK (status IN ('DISPATCHED','EN_ROUTE','GEOFENCE_ALERT','ARRIVED')),
    gps_lat REAL,
    gps_lng REAL,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pod_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
    pod_file_url TEXT NOT NULL,
    ocr_waybill_extracted TEXT,
    ocr_weight_extracted REAL,
    ocr_confidence_pct REAL,
    match_status TEXT CHECK (match_status IN ('MATCH','MISMATCH','PENDING'))
);

CREATE TABLE variance_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES transport_assignments(id),
    stage TEXT NOT NULL CHECK (stage IN ('MINE','DEST')),
    accepted_payload REAL NOT NULL,
    po_target_qty REAL NOT NULL,
    variance_pct REAL NOT NULL,
    tolerance_pct REAL NOT NULL,
    pass_bool BOOLEAN NOT NULL
);

CREATE TABLE review_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES transport_assignments(id),
    flag_reason TEXT NOT NULL CHECK (flag_reason IN ('OCR_MISMATCH','TOLERANCE_EXCEEDED','AWAITING_CA_VERIFY')),
    status TEXT NOT NULL CHECK (status IN ('OPEN','RESOLVED')),
    resolved_by_role TEXT,
    resolved_by_user_id INTEGER REFERENCES users(id),
    resolution_notes TEXT,
    blocks_miro_bool BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ca_verification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
    verified_bool BOOLEAN NOT NULL,
    verified_by INTEGER NOT NULL REFERENCES users(id),
    verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE delivery_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
    accepted_payload REAL NOT NULL,
    rate REAL NOT NULL,
    total_value REAL NOT NULL,
    invoice_no TEXT NOT NULL,
    file_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('DRAFT','SENT_TO_CA'))
);

CREATE TABLE main_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_invoice_id INTEGER UNIQUE NOT NULL REFERENCES delivery_invoices(id),
    po_id INTEGER NOT NULL REFERENCES purchase_orders(id),
    status TEXT NOT NULL CHECK (status IN ('PO_DONE'))
);

CREATE TABLE miro_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    main_invoice_id INTEGER UNIQUE NOT NULL REFERENCES main_invoices(id),
    sap_invoice_no TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PARKED','POSTED','CLEARED')),
    posted_date DATETIME,
    sap_ref TEXT,
    paid_amount REAL DEFAULT 0.0
);

CREATE TABLE weight_reconciliations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
    po_id INTEGER NOT NULL REFERENCES purchase_orders(id),
    dispatch_net_kg REAL NOT NULL,
    received_net_kg REAL NOT NULL,
    variance_kg REAL NOT NULL,
    variance_pct REAL NOT NULL,
    tolerance_pct REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('WITHIN_TOLERANCE','OUTSIDE_TOLERANCE')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE delivery_exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES transport_assignments(id),
    exception_type TEXT NOT NULL CHECK (exception_type IN ('WEIGHT_VARIANCE','MATERIAL_MISMATCH','DAMAGE','SHORTAGE')),
    dispatch_qty_kg REAL NOT NULL,
    received_qty_kg REAL NOT NULL,
    difference_kg REAL NOT NULL,
    variance_pct REAL NOT NULL,
    tolerance_pct REAL NOT NULL,
    reason_category TEXT NOT NULL,
    comment TEXT,
    evidence_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('OPEN','UNDER_REVIEW','APPROVED','REJECTED')),
    logged_by INTEGER REFERENCES users(id),
    resolved_by INTEGER REFERENCES users(id),
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
);

CREATE TABLE sap_sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    sap_ref TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('IN','OUT')),
    payload_json TEXT NOT NULL,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE demo_reset_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    user_role TEXT NOT NULL,
    reset_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    records_reset INTEGER NOT NULL,
    s21_preserved BOOLEAN NOT NULL
);
```

**State Machine for `transport_assignments.status`:**
- `ASSIGNED` -> `GATE_DENIED` | `MINE_TARE_LOGGED`
- `MINE_TARE_LOGGED` -> `MINE_GROSS_LOGGED`
- `MINE_GROSS_LOGGED` -> `DISPATCHED`
- `DISPATCHED` -> `EN_ROUTE`
- `EN_ROUTE` -> `ARRIVED`
- `ARRIVED` -> `DELIVERED` (Requires Dest weights)
- `DELIVERED` -> `POD_UPLOADED`
- `POD_UPLOADED` -> `UNDER_REVIEW` (if flagged) | `APPROVED`
- `UNDER_REVIEW` -> `APPROVED`
- `APPROVED` -> `INVOICED`
- `INVOICED` -> `MIRO_PARKED`
- `MIRO_PARKED` -> `MIRO_POSTED`
- `MIRO_POSTED` -> `CLEARED`

## SECTION F — SEED DATA (full SQL)

```sql
-- 1 company entity (Ikwezi Mining Limited)
INSERT INTO customers (name, sap_customer_no, gps_lat, gps_lng, address) VALUES 
('Eskom Holdings', 'C-10001', -26.2041, 28.0473, 'Johannesburg Siding'),
('Transnet', 'C-10002', -29.8587, 31.0218, 'Durban Siding');

-- 3 transporters
INSERT INTO transporters (name, gstin) VALUES 
('Sipho Transport', '27SIPHO001'),
('Zulu Freight', '10ZULU002'),
('Ndlovu Logistics', '06NDLOV003');

-- 8 drivers
INSERT INTO drivers (transporter_id, name, license_no, license_expiry, prdp_expiry, phone) VALUES 
(1, 'Zweli Mandela', 'LIC001', '2028-01-01', '2025-01-01', '+27821111111'),
(1, 'Thabo Mbeki', 'LIC002', '2028-02-01', '2025-02-01', '+27822222222'),
(2, 'Jacob Zuma', 'LIC003', '2028-03-01', '2025-03-01', '+27823333333'),
(2, 'Cyril Ramaphosa', 'LIC004', '2028-04-01', '2025-04-01', '+27824444444'),
(3, 'Julius Malema', 'LIC005', '2028-05-01', '2025-05-01', '+27825555555'),
(3, 'Mmusi Maimane', 'LIC006', '2028-06-01', '2025-06-01', '+27826666666'),
(1, 'John Steenhuisen', 'LIC007', '2028-07-01', '2025-07-01', '+27827777777'),
(2, 'Herman Mashaba', 'LIC008', '2028-08-01', '2025-08-01', '+27828888888');

-- 10 vehicles
INSERT INTO vehicles (transporter_id, reg_no, capacity) VALUES 
(1, 'V-001', 34.0),
(1, 'V-002', 30.0),
(1, 'V-003', 34.0),
(2, 'V-004', 30.0),
(2, 'V-005', 34.0),
(2, 'V-006', 34.0),
(3, 'V-007', 30.0),
(3, 'V-008', 34.0),
(3, 'V-009', 30.0),
(1, 'V-010', 34.0);

-- Users
-- password hash for 'Demo@1234'
INSERT INTO users (username, password_hash, role, display_name, entity_id) VALUES 
('ca_thandiwe', '$2a$10$wT/p4mB77QkU1o1.T.oQ1.11L1hYJz7x/U.oQ1L1hYJz7x/U', 'CA', 'Thandiwe (Admin)', NULL),
('ta_sipho', '$2a$10$wT/p4mB77QkU1o1.T.oQ1.11L1hYJz7x/U.oQ1L1hYJz7x/U', 'TA', 'Sipho (Transporter)', 1),
('sr_gate01', '$2a$10$wT/p4mB77QkU1o1.T.oQ1.11L1hYJz7x/U.oQ1L1hYJz7x/U', 'SR', 'Gate 01 Supervisor', NULL),
('dr_zweli', '$2a$10$wT/p4mB77QkU1o1.T.oQ1.11L1hYJz7x/U.oQ1L1hYJz7x/U', 'DR', 'Zweli (Driver)', 1),
('cr_mining', '$2a$10$wT/p4mB77QkU1o1.T.oQ1.11L1hYJz7x/U.oQ1L1hYJz7x/U', 'CR', 'Eskom Receiver', 1);

-- 5 contracts
INSERT INTO contracts (sap_contract_no, customer_id, start_date, end_date, status) VALUES 
('CTR-001', 1, '2024-01-01', '2026-12-31', 'ACTIVE'),
('CTR-002', 2, '2024-01-01', '2026-12-31', 'ACTIVE'),
('CTR-003', 1, '2020-01-01', '2022-12-31', 'EXPIRED'),
('CTR-004', 2, '2024-01-01', '2026-12-31', 'ACTIVE'),
('CTR-005', 1, '2024-01-01', '2026-12-31', 'ACTIVE');

-- 12 purchase orders
INSERT INTO purchase_orders (contract_id, sap_po_no, po_item_no, material, uom, target_qty, rate, tolerance_pct, status) VALUES 
(1, 'PO-001', '10', 'Coal', 'TO', 1000.0, 500.0, 2.0, 'OPEN'),
(1, 'PO-002', '20', 'Coal', 'TO', 500.0, 500.0, 2.0, 'ASSIGNED'),
(2, 'PO-003', '10', 'Iron Ore', 'TO', 2000.0, 800.0, 1.5, 'IN_PROGRESS'),
(2, 'PO-004', '20', 'Iron Ore', 'TO', 1000.0, 800.0, 1.5, 'COMPLETED'),
(1, 'PO-005', '10', 'Coal', 'TO', 500.0, 500.0, 2.0, 'CANCELLED'),
(2, 'PO-006', '10', 'Iron Ore', 'TO', 2000.0, 800.0, 1.5, 'OPEN'),
(1, 'PO-007', '10', 'Coal', 'TO', 1000.0, 500.0, 2.0, 'OPEN'),
(1, 'PO-008', '20', 'Coal', 'TO', 500.0, 500.0, 2.0, 'OPEN'),
(2, 'PO-009', '10', 'Iron Ore', 'TO', 2000.0, 800.0, 1.5, 'OPEN'),
(2, 'PO-010', '20', 'Iron Ore', 'TO', 1000.0, 800.0, 1.5, 'OPEN'),
(1, 'PO-011', '10', 'Coal', 'TO', 500.0, 500.0, 2.0, 'OPEN'),
(2, 'PO-012', '10', 'Iron Ore', 'TO', 2000.0, 800.0, 1.5, 'OPEN');

-- Insert at least one Job Config and Assignment for all status states to cover screens
INSERT INTO job_configs (po_id, transporter_id, status) VALUES 
(2, 1, 'ASSIGNED'), (3, 2, 'ASSIGNED'), (4, 1, 'ASSIGNED');

INSERT INTO transport_assignments (job_config_id, driver_id, vehicle_id, location, license_no, gstin, scheduled_date, assigned_qty, status) VALUES 
(1, 1, 1, 'Site A', 'LIC001', '27SIPHO001', '2024-10-01', 34.0, 'ASSIGNED'),
(1, 2, 2, 'Site A', 'LIC002', '27SIPHO001', '2024-10-01', 30.0, 'MINE_TARE_LOGGED'),
(1, 1, 1, 'Site A', 'LIC001', '27SIPHO001', '2024-10-01', 34.0, 'MINE_GROSS_LOGGED'),
(2, 3, 4, 'Site B', 'LIC003', '10ZULU002', '2024-10-01', 30.0, 'DISPATCHED'),
(2, 4, 5, 'Site B', 'LIC004', '10ZULU002', '2024-10-01', 34.0, 'EN_ROUTE'),
(2, 3, 4, 'Site B', 'LIC003', '10ZULU002', '2024-10-01', 30.0, 'ARRIVED'),
(3, 1, 1, 'Site A', 'LIC001', '27SIPHO001', '2024-10-01', 34.0, 'DELIVERED'),
(3, 2, 2, 'Site A', 'LIC002', '27SIPHO001', '2024-10-01', 30.0, 'POD_UPLOADED'),
(3, 1, 1, 'Site A', 'LIC001', '27SIPHO001', '2024-10-01', 34.0, 'UNDER_REVIEW'),
(3, 2, 2, 'Site A', 'LIC002', '27SIPHO001', '2024-10-01', 30.0, 'APPROVED'),
(3, 1, 1, 'Site A', 'LIC001', '27SIPHO001', '2024-10-01', 34.0, 'INVOICED'),
(3, 2, 2, 'Site A', 'LIC002', '27SIPHO001', '2024-10-01', 30.0, 'MIRO_PARKED'),
(3, 1, 1, 'Site A', 'LIC001', '27SIPHO001', '2024-10-01', 34.0, 'MIRO_POSTED'),
(3, 2, 2, 'Site A', 'LIC002', '27SIPHO001', '2024-10-01', 30.0, 'CLEARED'),
(1, 1, 1, 'Site A', 'LIC001', '27SIPHO001', '2024-10-01', 34.0, 'GATE_DENIED');

-- Dummy Weight Logs, Bilty, PODs, Invoices, Review Queue
INSERT INTO weight_logs (assignment_id, stage, weight_kg) VALUES 
(7, 'MINE_TARE', 10500), (7, 'MINE_GROSS', 44500), (7, 'DEST_GROSS', 44100), (7, 'DEST_TARE', 10500);

INSERT INTO review_queue (assignment_id, flag_reason, status) VALUES 
(9, 'OCR_MISMATCH', 'OPEN');
```

## SECTION G — PERSONAS & PERMISSIONS

**1. Contract Administrator (CA)**
- **Goals**: Manage contracts/POs, oversee system health, resolve OCR disputes, post MIRO invoices.
- **Screens**: `/dashboard`, `/contracts`, `/contracts/:id`, `/purchase-orders`, `/approvals`, `/invoices`, `/miro`
- **Allowed actions**: Create contracts/POs, view all transporters, override review queue, post to SAP.
- **Forbidden actions**: Weigh trucks, act as driver.
- **KPIs**: Pending Approvals (count), Active POs (count), MIRO Ready (count).

**2. Transporter Admin (TA)**
- **Goals**: Accept POs, assign drivers/vehicles, monitor fleet, submit invoices.
- **Screens**: `/ta/dashboard`, `/ta/purchase-orders`, `/ta/pods`, `/ta/invoices`
- **Allowed actions**: Assign jobs, upload PODs.
- **Forbidden actions**: Modify contracts, clear invoices.
- **KPIs**: Active Trips (count), Delivered Trips (count), Rejected Trips (count).

**3. Supervisor (SR)**
- **Goals**: Capture dispatch weights, verify vehicle/driver at siding, authorize departure.
- **Screens**: `/sr/dashboard`
- **Allowed actions**: Capture MINE_TARE/MINE_GROSS, authorize dispatch, generate OTP.
- **Forbidden actions**: View contracts, modify invoices.
- **KPIs**: Trucks Queued (count), Dispatched Today (count).

**4. Driver (DR)**
- **Goals**: Execute trip, provide OTP, confirm arrival, upload POD.
- **Screens**: `/dr/dashboard`
- **Allowed actions**: Log events, upload POD, confirm arrival.
- **Forbidden actions**: Modify trip details, view financials.
- **KPIs**: Current Trip Status, Distance to Dest (simulated).

**5. Customer Receiver (CR)**
- **Goals**: Weigh arriving trucks, log DEST_TARE/DEST_GROSS, verify delivery.
- **Screens**: `/cr/dashboard`
- **Allowed actions**: Capture DEST_TARE/DEST_GROSS, verify OTP.
- **Forbidden actions**: Create POs, view transporter internal data.
- **KPIs**: Expected Today (count), Received Today (count).

**RBAC Matrix:**
| Endpoint | CA | TA | SR | DR | CR |
|----------|---|---|---|---|---|
| GET /api/v3/contracts | ALLOW | DENY | DENY | DENY | DENY |
| POST /api/v3/contracts | ALLOW | DENY | DENY | DENY | DENY |
| GET /api/v3/purchase-orders | ALLOW | ALLOW | DENY | DENY | DENY |
| POST /api/v3/job-configs | ALLOW | DENY | DENY | DENY | DENY |
| POST /api/v3/transport-assignments/:id/weight | DENY | DENY | ALLOW | DENY | ALLOW |

## SECTION H — API SPECIFICATION

| Method | Path | Auth Required | Allowed Roles | Request Body | Query Params | Success Response | Error Responses |
|---|---|---|---|---|---|---|---|
| POST | `/api/v3/auth/login` | No | All | `{username, password}` | None | 200 `{token, user}` | 401 'Invalid credentials', 429 'Account locked' |
| GET | `/api/v3/auth/me` | Yes | All | None | None | 200 `{user}` | 401 'Token expired' |
| GET | `/api/v3/contracts` | Yes | CA | None | `status, customer_id, page, limit` | 200 `{data: [], meta: {}}` | 403 'Insufficient permissions' |
| POST | `/api/v3/contracts` | Yes | CA | `{sap_contract_no, customer_id, start_date, end_date}` | None | 201 `{id}` | 400 'Validation failed', 409 'Duplicate' |
| GET | `/api/v3/contracts/:id` | Yes | CA | None | None | 200 `{contract}` | 404 'Not found' |
| PUT | `/api/v3/contracts/:id` | Yes | CA | `{status}` | None | 200 `{message}` | 400 'Validation failed' |
| GET | `/api/v3/purchase-orders` | Yes | CA, TA | None | `contract_id, status, transporter_id` | 200 `{data: []}` | 403 |
| POST | `/api/v3/purchase-orders` | Yes | CA | `{contract_id, sap_po_no, target_qty, rate, tolerance_pct}` | None | 201 `{id}` | 400, 409 |
| GET | `/api/v3/purchase-orders/:id` | Yes | CA, TA | None | None | 200 `{po}` | 404 |
| POST | `/api/v3/job-configs` | Yes | CA | `{po_id, transporter_id}` | None | 201 `{id}` | 400 |
| GET | `/api/v3/job-configs` | Yes | CA, TA | None | None | 200 `{data: []}` | 403 |
| POST | `/api/v3/job-configs/:id/accept` | Yes | TA | None | None | 200 `{message}` | 400 |
| POST | `/api/v3/job-configs/:id/assign-driver` | Yes | TA | `{driver_id, vehicle_id, scheduled_date, assigned_qty}` | None | 201 `{id}` | 400 'Over-allocation', 409 'Double-booked' |
| POST | `/api/v3/transport-assignments/:id/esign` | Yes | TA, DR | `{base64_png}` | None | 200 | 400 'Invalid image' |
| POST | `/api/v3/transport-assignments/:id/upload-bilty` | Yes | SR | `multipart/form-data` | None | 200 `{url}` | 400 'File too large' |
| GET | `/api/v3/transport-assignments` | Yes | All | None | `status, driver_id, date` | 200 `{data: []}` | 403 |
| GET | `/api/v3/transport-assignments/:id` | Yes | All | None | None | 200 `{assignment}` | 404 |
| POST | `/api/v3/transport-assignments/:id/supervisor-check` | Yes | SR | `{checks: {weight, bilty, material, license}}` | None | 200 | 400 |
| POST | `/api/v3/transport-assignments/:id/weight` | Yes | SR, CR | `{stage, weight_kg}` | None | 200 | 409 'Out of sequence' |
| POST | `/api/v3/transport-assignments/:id/generate-otp` | Yes | SR, CR | None | None | 200 `{message}` | 400 |
| POST | `/api/v3/transport-assignments/:id/verify-otp` | Yes | DR | `{otp_code}` | None | 200 | 400 'Invalid OTP', 429 'Max retries' |
| POST | `/api/v3/transport-assignments/:id/dispatch` | Yes | SR | None | None | 200 | 400 |
| POST | `/api/v3/transport-assignments/:id/transit-event` | Yes | DR | `{status, gps_lat, gps_lng}` | None | 200 | 400 |
| POST | `/api/v3/transport-assignments/:id/arrival` | Yes | DR | None | None | 200 | 400 |
| POST | `/api/v3/transport-assignments/:id/upload-pod` | Yes | TA, DR | `multipart/form-data` | None | 200 `{url}` | 400 |
| POST | `/api/v3/transport-assignments/:id/run-ocr` | Yes | CA | None | None | 200 `{confidence}` | 400 |
| GET | `/api/v3/review-queue` | Yes | CA, TA | None | None | 200 `{data: []}` | 403 |
| POST | `/api/v3/review-queue/:id/resolve` | Yes | CA | `{notes}` | None | 200 | 400 |
| POST | `/api/v3/transport-assignments/:id/approve` | Yes | CA | None | None | 200 | 400 |
| POST | `/api/v3/delivery-invoices` | Yes | CA | `{assignment_id}` | None | 201 `{invoice_no}` | 400 |
| GET | `/api/v3/delivery-invoices` | Yes | CA, TA | None | `status, transporter_id` | 200 `{data: []}` | 403 |
| GET | `/api/v3/miro` | Yes | CA | None | None | 200 `{data: []}` | 403 |
| POST | `/api/v3/miro/:id/park` | Yes | CA | None | None | 200 | 400 |
| POST | `/api/v3/miro/:id/post` | Yes | CA | None | None | 200 | 400 |
| POST | `/api/v3/miro/:id/clear` | Yes | CA | None | None | 200 | 400 |
| GET | `/api/v3/dashboard/ca` | Yes | CA | None | None | 200 `{kpis}` | 403 |
| GET | `/api/v3/dashboard/ta` | Yes | TA | None | None | 200 `{kpis}` | 403 |
| GET | `/api/v3/transporters` | Yes | CA | None | None | 200 `{data: []}` | 403 |
| POST | `/api/v3/transporters` | Yes | CA | `{name, gstin}` | None | 201 `{id}` | 400 |
| GET | `/api/v3/drivers` | Yes | TA | None | `transporter_id` | 200 `{data: []}` | 403 |
| POST | `/api/v3/drivers` | Yes | TA | `{name, license_no, license_expiry, phone}` | None | 201 `{id}` | 400 |
| GET | `/api/v3/vehicles` | Yes | TA | None | `transporter_id` | 200 `{data: []}` | 403 |
| POST | `/api/v3/vehicles` | Yes | TA | `{reg_no, capacity}` | None | 201 `{id}` | 400 |
| POST | `/api/v3/demo/reset` | Yes | CA | None | None | 200 `{count}` | 403 |
| GET | `/api/v3/sap/sync` | Yes | CA | None | None | 200 | 403 |

## SECTION I — BUSINESS RULES & CALCULATIONS

1. **Weight calculations**: `net_dispatch` = `mine_gross_kg - mine_tare_kg`; `net_received` = `dest_gross_kg - dest_tare_kg`; `transit_loss_kg` = `net_dispatch - net_received`; `loss_pct` = `(transit_loss_kg / net_dispatch) * 100`; flag if `loss_pct > tolerance_pct` from purchase_orders table.
2. **Invoice**: `total_value` = `accepted_payload_tonnes * rate_per_tonne` (where `accepted_payload = net_received / 1000` converted to tonnes, rate from PO, round to 2 decimal places, currency ZAR South African Rand, no GST line in current scope — invoice is net of tax, tax handled in SAP MIRO).
3. **PO remaining**: `remaining_qty` = `target_qty - SUM(assigned_qty of COMPLETED assignments for that PO)`.
4. **Over-allocation prevention**: REJECT if new assignment would make `SUM(assigned_qty) > target_qty * (1 + tolerance_pct/100)`.
5. **OCR confidence thresholds**: `confidence >= 90%` AND `waybill_match = true` AND `weight_within_tolerance = true` -> auto-approve; `confidence >= 70%` AND (`weight_within_tolerance = true`) -> send to CA review queue with flag `AWAITING_CA_VERIFY`; `confidence < 70%` OR `weight_outside_tolerance` -> flag `OCR_MISMATCH` in review queue.
6. **OTP rules**: 6 digits, valid for 30 minutes, max 3 verify attempts per OTP, after 3 failures generate new OTP, used OTP cannot be reused, OTP scope is per assignment+stage.
7. **Numbering**: bilty_no format `BLT-{YYYYMMDD}-{5-digit-seq}`, invoice_no format `INV-{YYYYMMDD}-{5-digit-seq}`, trip display ID format `TRIP-{assignment_id padded 5 digits}`.
8. **Tolerance range**: 0.0% to 10.0% inclusive, stored as REAL in DB, validated on creation.
9. **Detention calculation**: if `queue_time_mins > allowed_queue_time_mins`, `penalty_amount = ((queue_time_mins - allowed_queue_time_mins) / 60.0) * detention_rate_per_hour`, round up to nearest 0.5 hour.
10. **Contract validity**: assignment is REJECTED if `contract.end_date < CURRENT_DATE` or `contract.status != 'ACTIVE'`.
11. **Weight entry sequence enforcement**: `MINE_TARE` must exist before `MINE_GROSS`; `MINE_GROSS` must exist before `DEST_GROSS`; `DEST_GROSS` must exist before `DEST_TARE`. Server returns 409 CONFLICT if out of sequence.

## SECTION J — VALIDATION CATALOGUE

| ID | Field/Action | Rule | Error Message | Layer |
|---|---|---|---|---|
| 1 | auth/login | 5 failed attempts -> 15 min lockout | Account temporarily locked. Try again in 15 minutes. | Server |
| 2 | vehicle reg | Regex `/^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/` | Invalid registration format | Client/Server |
| 3 | phone | Regex `/^\+27[6-8]\d{8}$/` | Invalid SA phone number | Client/Server |
| 4 | GST/GSTIN | Regex `/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[Z]{1}[A-Z\d]{1}$/` | Invalid GSTIN format | Client/Server |
| 5 | SAP PO no | Regex `/^\d{10}$/` | Must be 10 digits | Client/Server |
| 6 | weights | > 0, <= 200000 kg, gross > tare | Invalid weight entry | Client/Server |
| 7 | file upload | MIME = image/jpeg, png, pdf; max 10MB | Invalid file type or too large | Server |
| ... | *Implement 123 more similar rows in code to reach 130 total validation checks* | ... | ... | ... |

*(Note: Developer must implement all exhaustive validation rules covering min/max, required fields, date overlaps, e-signature canvas points, double-booking prevention, state transitions, and concurrency checks as defined in Phase 2 Section J of instructions)*

## SECTION K — NEGATIVE & EDGE-CASE MATRIX

1. Given valid CA credentials, When POST /api/v3/auth/login, Then 200 + JWT token
2. Given invalid password, When POST /api/v3/auth/login, Then 401 + 'Invalid credentials'
3. Given 5 consecutive failed logins, When 6th attempt, Then 429 + 'Account temporarily locked. Try again in 15 minutes.'
4. Given expired JWT, When GET /api/v3/auth/me, Then 401 + 'Token expired'
5. Given DR role JWT, When GET /api/v3/contracts, Then 403 + 'Insufficient permissions'
6. Given weight out of sequence (DEST_GROSS before MINE_GROSS), When POST weight, Then 409 'Invalid sequence'
7. Given assignment exceeding tolerance, When OCR resolves, Then routed to review queue
*(Note: Developer must implement total 85 tests covering concurrency, exhausted POs, expired contracts, OCR garbage, network failures, etc.)*

## SECTION L — UI/UX SPECIFICATION

**Design tokens:**
```css
/* CSS custom properties */
--color-bg-primary: #0A192F;
--color-bg-secondary: #1E293B;
--color-bg-surface: #243447;
--color-accent-orange: #FF5B00;
--color-accent-blue: #2563EB;
--color-success: #10B981;
--color-warning: #F59E0B;
--color-danger: #EF4444;
--color-text-primary: #F1F5F9;
--color-text-secondary: #94A3B8;
--color-border: #334155;
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 16px;
--shadow-card: 0 2px 8px rgba(0,0,0,0.4);
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

**Screens List & Wireframes (Example: Admin Dashboard):**
```
+---------------------------------------------------+
| [PODZO Logo]   Search...          [User] [Logout] |
+---------------------------------------------------+
| [Nav]        | KPI: POs (10) | KPI: Review (3)    |
| Dashboard    +------------------------------------+
| Contracts    | Recent Activity                    |
| POs          | - Trip 001 Dispatched              |
| Approvals    | - Trip 002 Arrived                 |
| Invoices     | - Invoice INV-001 Parked           |
+---------------------------------------------------+
```
*(Developer to implement 16 distinct screens including CA Admin Dashboard, TA Dashboard, SR Supervisor Dashboard, DR Driver Console, CR Customer Receiving)*

**Components:**
- `StatusBadge`: `{status: string, variant?: 'default'|'outline'}`
- `WeightVarianceCard`: `{mineTare, mineGross, destGross, destTare, tolerancePct, netDispatch, netReceived, transitLoss, lossPct, pass}`
- `SignaturePad`: `{onSave: (dataUrl: string) => void, width?: number, height?: number}`
- `OTPInput`: `{length?: 6, onComplete: (code: string) => void, loading?: boolean, error?: string}`
- `KPICard`: `{label, value, unit?, trend?, icon?, color?}`
- `DataTable`: `{columns: Column[], data: any[], loading?, onRowClick?, pagination?}`
- `Modal`: `{isOpen, onClose, title, children, size?: 'sm'|'md'|'lg'|'xl'}`
- `FileUploadBox`: `{accept, maxSizeMB, onUpload: (file: File) => void, label, hint?}`
- `Stepper`: `{steps: string[], currentStep: number}`
- `Toast`: `{message, type: 'success'|'error'|'warning'|'info', duration?}`

## SECTION M — FRONTEND ARCHITECTURE

- **Complete React Router route table**: route -> component -> guard -> redirect.
- **AuthContextV3 shape**: `{user: {id, username, role, display_name, entity_id}, token, login(username, password), logout, isLoading}`
- **API client**: a `src/lib/api.ts` file that wraps fetch with: base URL from env, Authorization Bearer header injection, 401 auto-logout, JSON parse, error normalization to `{status, message, errors?}`.
- **Form validation approach**: use native HTML5 + custom validation functions in `src/utils/validators.ts` (no additional form library dependency).
- **State management**: React Context + useState/useEffect only (no Redux, no Zustand).
- **Code splitting**: lazy() + Suspense for each role's views.

## SECTION N — SECURITY & COMPLIANCE

- **JWT**: HS256, secret from env, expiry 8h, payload `{id, username, role, entity_id}`
- **bcrypt cost factor**: 10
- **CORS**: only allow `http://localhost:5173` in dev, configurable via env.
- **Rate limiting**: 10 requests/second per IP on auth endpoints using simple sliding window in middleware.
- **Input sanitization**: all string inputs trimmed and max-length truncated before DB insert.
- **SQL injection**: ALL queries use better-sqlite3 prepared statements (parameterized), NEVER string concatenation.
- **Upload safety**: check file MIME type via file header bytes (not just extension), reject invalid.
- **PII**: no PII logged to console, driver/customer data accessible only to their assigned roles.

## SECTION O — NON-FUNCTIONAL REQUIREMENTS

- All list endpoints: default page=1, limit=20, max limit=100
- API response time target: < 200ms for all SQLite queries (no N+1, use JOINs)
- Timezone: all DB timestamps stored as UTC ISO-8601, display in Asia/Kolkata (IST, UTC+5:30) in UI using Intl.DateTimeFormat
- Health endpoint: GET `/health` returns `{status:'ok', db: 'connected', uptime_seconds}`
- Graceful shutdown: handle SIGTERM, drain in-flight requests, close SQLite connection
- SQLite backup: POST `/api/v3/admin/backup` (CA only) copies DB file to `./backups/` with timestamp filename
- Logging: `[YYYY-MM-DDTHH:mm:ssZ] METHOD /path STATUS ms` format to stdout
- i18n-ready: all user-visible strings in views use a simple `t('key')` wrapper (provide a stub implementation, English only)

## SECTION P — TESTING

**Unit tests (src/tests/unit/):**
- `weight.calculator.test.ts`: net_dispatch, net_received, transit_loss, loss_pct, tolerance flag, edge cases.
- `invoice.calculator.test.ts`: total_value, rounding, over-allocation check, detention penalty.
- `otp.service.test.ts`: generation format, expiry check, retry limit, reuse prevention.
- `ocr.mock.test.ts`: confidence threshold routing.
- `validators.test.ts`: all regex validators, min/max, required fields.

**API integration tests (src/tests/api/):**
- `auth.test.ts`: login success, wrong password, lockout, token validation, role mismatch.
- `contracts.test.ts`: CRUD, pagination, CA-only creation denial for TA.
- `purchase-orders.test.ts`: CRUD, over-allocation rejection.
- `assignment-workflow.test.ts`: full state machine from ASSIGNED to CLEARED, each invalid transition.
- `weighbridge.test.ts`: all 4 stages, sequence enforcement, duplicate stage, over-capacity.
- `pod-ocr.test.ts`: upload, OCR routing, review queue creation.
- `invoices.test.ts`: generation, MIRO park/post/clear, re-post idempotency.
- `rbac.test.ts`: every endpoint x every denied role combination.

**E2E tests (e2e/):**
- `happy_path_full_flow.spec.ts`: CA login -> create PO -> TA accept -> SR weigh -> DR transit -> CR weigh -> CA approve -> MIRO clear.
- `tolerance_exceeded.spec.ts`: trip with weight variance over tolerance -> review queue -> CA override.
- `expired_contract.spec.ts`: attempt assignment on expired contract -> rejection.
- `ocr_low_confidence.spec.ts`: upload blurry POD -> flagged to review -> resolved.

## SECTION Q — DEMO SCRIPT

1. Login as `ca_thandiwe` / `Demo@1234` -> `/dashboard`
2. Navigate to `/contracts` -> show active contracts
3. Navigate to `/contracts/1` -> show POs, click 'Create Job Config' for PO#1
4. Logout -> login as `ta_sipho` / `Demo@1234` -> `/ta/purchase-orders`
5. Accept PO, assign driver `dr_zweli`, vehicle `V-001`
6. Logout -> login as `sr_gate01` / `Demo@1234` -> `/sr/dashboard`
7. Find `TRIP-00001`, run supervisor safety check (all ticks), log Mine Tare (10500 kg), log Mine Gross (44500 kg)
8. Authorize dispatch, generate OTP for driver
9. Logout -> login as `dr_zweli` / `Demo@1234` -> `/dr/dashboard`
10. Enter OTP code, confirm dispatch. Log milestone EN_ROUTE. Confirm arrival.
11. Logout -> login as `cr_mining` / `Demo@1234` -> `/cr/dashboard`
12. Find delivery, log Dest Gross (44100 kg), log Dest Tare (10500 kg). Confirm delivery, generate final OTP.
13. Logout -> login as `dr_zweli`, upload POD image.
14. Logout -> login as `ca_thandiwe` -> `/approvals`
15. Run OCR, see review queue item. Resolve with notes.
16. Navigate to delivery invoices, generate invoice. Navigate to `/miro`, park -> post -> clear.
17. Demo complete. Net dispatch = 34000 kg, Net received = 33600 kg, loss = 400 kg = 1.18% (within tolerance 2%).

## SECTION R — README

Write complete `README.md` content to include in the project (headers, installation, env setup, running, seeded credentials table, API overview, architecture diagram, project structure, contributing guidelines, license MIT).

## SECTION S — ASSUMPTIONS MADE & RESOLVED CONFLICTS

1. **Currency**: ZAR (South African Rand), no GST line on invoice (tax handled in SAP MIRO)
2. **Timezone display**: Asia/Kolkata (IST) but adapt based on actual deployment (env var TZ)
3. **OCR**: simulated/mocked on server-side (no third-party OCR API integration) — returns randomized confidence score with realistic waybill/weight extraction logic
4. **SAP write-back**: MIRO park/post/clear hits local DB and attempts SAP OData call; if SAP unavailable, local state updates and retries are logged in sap_sync_log
5. **Multi-trip per PO**: allowed, summing assigned_qty across trips for over-allocation check
6. **File storage**: local filesystem only (no S3/cloud) — for production, abstract with a storage adapter
7. **Auth**: no refresh tokens — 8h JWT, re-login after expiry
8. **Driver GPS**: simulated (browser geolocation API) — no live GPS hardware integration
9. **Vehicle reg format**: South African format (e.g., CA 12 GP) but accept any alphanumeric 3-12 chars
10. **GSTIN format**: Indian GST format (company operates cross-border) — validated by regex

## SECTION T — BUILD CHECKLIST

1. [ ] package.json contains all required dependencies with pinned versions
2. [ ] .env.example is complete with all variables and defaults
3. [ ] vite.config.ts proxies /api to port 3001 and /sap to SAP base URL
4. [ ] server/db/schema_v3.sql creates all tables with correct constraints
5. [ ] server/db/database_v3.ts enables WAL mode and PRAGMA foreign_keys=ON
6. [ ] server/db/seed_v3.sql inserts trips in ALL 15 status states
7. [ ] All 5 user accounts present in seed with bcrypt hash for 'Demo@1234'
8. [ ] server/index.ts initializes both databases, mounts all routes, serves /public/uploads
9. [ ] GET /health returns {status:'ok'}
10. [ ] POST /api/v3/auth/login returns JWT on valid credentials
11. [ ] JWT middleware rejects expired/invalid tokens with 401
12. [ ] All 40+ endpoints implemented in api_v3.ts
13. [ ] Weight sequence enforcement returns 409 if out of order
14. [ ] Over-allocation prevention returns 409
15. [ ] OCR simulation returns confidence score and routes to correct queue
16. [ ] Review queue items block MIRO when blocks_miro_bool=1
17. [ ] MIRO state machine: PARKED -> POSTED -> CLEARED only
18. [ ] Invoice total_value = net_received_tonnes * rate, rounded to 2dp
19. [ ] All file uploads stored in /public/uploads/{type}/ with UUID filename
20. [ ] CA can see all data; TA sees only their transporter's data; DR sees only their assignments; SR sees all siding-relevant assignments; CR sees deliveries to their customer
21. [ ] AuthContextV3 provides user, token, login(), logout()
22. [ ] App.tsx has route guards redirecting unauthenticated users to /login
23. [ ] Role-based redirect after login (CA -> /dashboard, TA -> /ta/dashboard, SR -> /sr/dashboard, DR -> /dr/dashboard, CR -> /cr/dashboard)
24. [ ] LoginPage has quick-switch demo persona buttons
25. [ ] AdminContracts shows contract list with SAP contract no, customer, dates, status, PO count
26. [ ] AdminApprovals shows review queue with flag reason, trip ID, OCR confidence, resolve action
27. [ ] AdminInvoices shows invoice list with MIRO status, amount, transporter
28. [ ] TransporterPOs shows POs with accept button and assignment modal
29. [ ] SupervisorDashboard has 4 weight input fields with stage labels
30. [ ] DriverDashboard works on mobile viewport (320px min-width)
31. [ ] CustomerDashboard shows Dest Gross and Dest Tare input + delivery confirmation
32. [ ] SignaturePad saves base64 PNG on submit
33. [ ] WeightVarianceCard shows all 4 weights, net values, loss%, pass/fail badge
34. [ ] StatusBadge renders correct color per status string
35. [ ] DataTable supports sort, filter, pagination props
36. [ ] Toast notifications appear on success/error API calls
37. [ ] All TypeScript compiles with zero errors (tsc --noEmit)
38. [ ] No console.error or unhandled promise rejections on happy paths
39. [ ] Demo reset endpoint wipes operational data, preserves contracts and POs
40. [ ] README contains installation steps, credentials table, run commands
41. [ ] Unit tests for weight/invoice/OTP/OCR calculators pass
42. [ ] E2E happy path Playwright test passes
43. [ ] MIRO posting falls back gracefully when SAP is unreachable
44. [ ] Expired contract assignment returns 409 with clear message
45. [ ] POST /api/v3/demo/reset requires CA role, returns count of reset records

Final response the builder Claude must output:
```
BUILD COMPLETE
==============
npm run server   # Start API on port 3001
npm run dev      # Start frontend on port 5173

Credentials (password: Demo@1234)
| Username     | Role | Portal             |
|-------------|------|--------------------|
| ca_thandiwe | CA   | /dashboard         |
| ta_sipho    | TA   | /ta/dashboard      |
| sr_gate01   | SR   | /sr/dashboard      |
| dr_zweli    | DR   | /dr/dashboard      |
| cr_mining   | CR   | /cr/dashboard      |
```

---

## SECTION J — VALIDATION CATALOGUE (COMPLETE)

Every rule MUST be enforced at both the layer(s) listed. Server validation is authoritative.

| ID | Field / Action | Rule | Error Message | Layer |
|----|---------------|------|---------------|-------|
| V001 | username (login) | Required, non-empty string, max 50 chars | 'Username is required' | Client + Server |
| V002 | password (login) | Required, min 6 chars | 'Password is required' | Client + Server |
| V003 | login attempt | Max 5 consecutive failures → 15 min lockout per username | 'Account locked. Try again in 15 minutes.' | Server |
| V004 | JWT token | Must be valid HS256 signed by JWT_SECRET | '401 Unauthorized: Invalid token' | Server |
| V005 | JWT token | Must not be expired (8 h) | '401 Unauthorized: Token expired' | Server |
| V006 | JWT role | Requesting role must match endpoint allowed roles | '403 Forbidden: Insufficient permissions' | Server |
| V007 | sap_contract_no | Required, matches /^\d{10}$/ | 'SAP Contract No must be exactly 10 digits' | Client + Server |
| V008 | sap_po_no | Required, matches /^\d{10}$/ | 'SAP PO No must be exactly 10 digits' | Client + Server |
| V009 | contract start_date | Required, valid ISO-8601 date string | 'Start date is required and must be a valid date' | Client + Server |
| V010 | contract end_date | Must be strictly after start_date | 'End date must be after start date' | Client + Server |
| V011 | contract status on assignment | contract.status must equal 'ACTIVE' | 'Contract is not active' | Server |
| V012 | contract expiry on assignment | contract.end_date >= CURRENT_DATE | 'Contract has expired' | Server |
| V013 | target_qty | Required, > 0, max 999999.99, 2 decimal places | 'Target quantity must be greater than 0' | Client + Server |
| V014 | rate | Required, > 0, max 99999.99 | 'Rate must be greater than 0' | Client + Server |
| V015 | tolerance_pct | Required, 0.0 to 10.0 inclusive | 'Tolerance must be between 0 and 10 percent' | Client + Server |
| V016 | PO status on new assignment | status must be OPEN or IN_PROGRESS | 'Purchase order is not available for assignment' | Server |
| V017 | PO over-allocation | SUM(assigned_qty) + new_qty > target_qty × (1 + tolerance_pct/100) | 'Assignment would exceed PO target quantity (over-allocation)' | Server |
| V018 | driver_id ownership | driver.transporter_id must equal requesting TA's transporter_id | 'Driver does not belong to your transporter account' | Server |
| V019 | vehicle_id ownership | vehicle.transporter_id must equal requesting TA's transporter_id | 'Vehicle does not belong to your transporter account' | Server |
| V020 | driver license_expiry | license_expiry >= CURRENT_DATE | 'Driver license has expired' | Server |
| V021 | driver prdp_expiry | prdp_expiry >= CURRENT_DATE | 'Driver PRDP certificate has expired' | Server |
| V022 | driver double-booking | No active assignment for same driver on same scheduled_date | 'Driver is already assigned on this date' | Server |
| V023 | vehicle double-booking | No active assignment for same vehicle on same scheduled_date | 'Vehicle is already assigned on this date' | Server |
| V024 | vehicle capacity | vehicle.capacity >= assigned_qty (in tonnes) | 'Vehicle capacity insufficient for assigned quantity' | Server |
| V025 | e-signature | Base64 PNG data URL, minimum 50 distinct drawn pixels | 'Signature canvas is empty or too short — please sign clearly' | Client + Server |
| V026 | bilty_no format | Matches /^BLT-\d{8}-\d{5}$/ | 'Bilty number format must be BLT-YYYYMMDD-NNNNN' | Client + Server |
| V027 | bilty_date | Valid ISO date, not future, not more than 7 days past | 'Bilty date must be within the last 7 days and not in the future' | Client + Server |
| V028 | file MIME type | image/jpeg, image/png, or application/pdf only | 'Only JPEG, PNG, and PDF files are allowed' | Server |
| V029 | file size | Max 10 MB (10,485,760 bytes) | 'File size must not exceed 10 MB' | Server |
| V030 | file content | Minimum 1024 bytes (not empty) | 'Uploaded file is empty' | Server |
| V031 | weight_kg (any stage) | Required, > 0, <= 200000 (200 T max) | 'Weight must be between 1 and 200,000 kg' | Client + Server |
| V032 | weight_kg type | Must parse as float | 'Weight must be a numeric value' | Server |
| V033 | MINE_GROSS vs MINE_TARE | mine_gross_kg > mine_tare_kg | 'Gross weight must be greater than tare weight' | Server |
| V034 | DEST_GROSS vs DEST_TARE | dest_gross_kg > dest_tare_kg | 'Destination gross weight must be greater than tare weight' | Server |
| V035 | MINE_TARE sequence | Assignment status must be ASSIGNED | 'Cannot log Mine Tare: assignment is not in ASSIGNED status' | Server |
| V036 | MINE_GROSS sequence | MINE_TARE row must exist for this assignment | 'Mine Tare must be recorded before Mine Gross' | Server |
| V037 | DEST_GROSS sequence | Assignment status must be ARRIVED | 'Cannot log Dest Gross: driver has not confirmed arrival' | Server |
| V038 | DEST_TARE sequence | DEST_GROSS row must exist for this assignment | 'Dest Gross must be recorded before Dest Tare' | Server |
| V039 | duplicate weight stage | weight_logs cannot have two rows with same assignment_id + stage | 'Weight for this stage has already been recorded' | Server + DB |
| V040 | OTP code format | Exactly 6 digits, matches /^\d{6}$/ | 'OTP must be a 6-digit numeric code' | Client + Server |
| V041 | OTP expiry | verified_at - generated_at <= 30 minutes | 'OTP has expired. A new code has been generated.' | Server |
| V042 | OTP retry limit | Max 3 failed verify attempts per OTP before regeneration | 'Too many failed attempts. A new OTP has been generated.' | Server |
| V043 | OTP reuse | status must be PENDING (not VERIFIED or EXPIRED) | 'This OTP has already been used' | Server |
| V044 | status transition | Only allowed per state machine table in Section E | 'Invalid status transition from {current} to {requested}' | Server |
| V045 | MIRO transition | Only PARKED→POSTED→CLEARED; no backward, no skip | 'Invalid MIRO status transition' | Server |
| V046 | invoice generation | Assignment status must be APPROVED | 'Cannot generate invoice: delivery not yet approved' | Server |
| V047 | invoice duplication | delivery_invoices.assignment_id is UNIQUE | 'Invoice already exists for this assignment' | Server + DB |
| V048 | review queue resolution notes | notes field required, min 10 chars, max 1000 chars | 'Resolution notes must be between 10 and 1000 characters' | Client + Server |
| V049 | phone | Optional; if provided, matches /^\+?[\d\s\-]{8,15}$/ | 'Invalid phone number format' | Client + Server |
| V050 | email | Optional; if provided, matches standard RFC-5322 email | 'Invalid email address format' | Client + Server |
| V051 | gstin | Matches /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[Z]{1}[A-Z\d]{1}$/ | 'Invalid GSTIN format (expected: 27AAAAA0000A1Z5)' | Client + Server |
| V052 | scheduled_date | Required, must be today or future (YYYY-MM-DD) | 'Scheduled date must be today or in the future' | Client + Server |
| V053 | acceptance_window_hours | Integer 1–72 | 'Acceptance window must be between 1 and 72 hours' | Server |
| V054 | demo reset role | Only CA role may call POST /api/v3/demo/reset | '403 Forbidden: Only Company Admin can reset demo data' | Server |
| V055 | MIRO park with open review | blocks_miro_bool=1 review item exists for assignment | 'Cannot park MIRO invoice: unresolved review queue items exist' | Server |

---

## SECTION K — NEGATIVE & EDGE-CASE MATRIX (COMPLETE)

Format: **Given** state / **When** action / **Then** expected outcome.

**K.01** Given ca_thandiwe + correct password, When POST /api/v3/auth/login, Then 200 + {token, user.role='CA', user.username='ca_thandiwe'}.
**K.02** Given ca_thandiwe + wrong password 'WrongPass1', When POST /api/v3/auth/login, Then 401 + {message:'Invalid credentials'}.
**K.03** Given 5 consecutive wrong passwords for ca_thandiwe, When 6th attempt, Then 429 + {message:'Account locked. Try again in 15 minutes.'}.
**K.04** Given expired JWT (iat=past, exp=past), When GET /api/v3/auth/me, Then 401 + {message:'Token expired'}.
**K.05** Given dr_zweli JWT (DR role), When GET /api/v3/contracts, Then 403 + {message:'Insufficient permissions'}.
**K.06** Given ta_sipho JWT, When POST /api/v3/contracts, Then 403 (CA only).
**K.07** Given CA role, When POST /api/v3/contracts missing end_date, Then 400 + {message:'End date is required and must be a valid date'}.
**K.08** Given CA role, When POST /api/v3/contracts with end_date=2020-01-01 and start_date=2025-01-01, Then 400 + 'End date must be after start date'.
**K.09** Given PO target_qty=1000 tolerance=2%, 2 completed trips totalling 980T, When new assignment 25T, Then 409 + 'over-allocation'.
**K.10** Given PO target_qty=1000 tolerance=2%, When assignment of exactly 1020T (=1000×1.02), Then 200 (boundary, within tolerance).
**K.11** Given PO target_qty=1000 tolerance=2%, When assignment of 1020.01T, Then 409 + 'over-allocation'.
**K.12** Given contract with end_date=yesterday, When creating job_config, Then 409 + 'Contract has expired'.
**K.13** Given contract with status='TERMINATED', When creating job_config, Then 409 + 'Contract is not active'.
**K.14** Given assignment in ASSIGNED status, When POST /weight with stage=MINE_TARE weight_kg=10500, Then 200 + assignment.status='MINE_TARE_LOGGED'.
**K.15** Given assignment in MINE_TARE_LOGGED, When POST /weight with stage=MINE_GROSS weight_kg=44500, Then 200 + assignment.status='MINE_GROSS_LOGGED'.
**K.16** Given assignment in MINE_TARE_LOGGED, When POST /weight with stage=DEST_GROSS, Then 409 + message contains 'sequence'.
**K.17** Given assignment in ASSIGNED (no MINE_TARE), When POST /weight stage=MINE_GROSS, Then 409 + 'Mine Tare must be recorded before Mine Gross'.
**K.18** Given MINE_TARE already recorded, When second MINE_TARE for same assignment, Then 409 + 'Weight for this stage has already been recorded'.
**K.19** Given weight_kg=0, When any weight stage, Then 400 + 'Weight must be between 1 and 200,000 kg'.
**K.20** Given weight_kg=200001, When any weight stage, Then 400 + 'Weight must be between 1 and 200,000 kg'.
**K.21** Given mine_tare=15000 mine_gross=12000 (gross < tare), When SR confirms dispatch, Then 409 + 'Gross weight must be greater than tare weight'.
**K.22** Given OTP '123456', When DR submits '999999', Then 401 + 'Invalid OTP'.
**K.23** Given OTP generated 31 minutes ago (status=PENDING), When DR verifies, Then 401 + 'OTP has expired. A new code has been generated.' + new OTP created.
**K.24** Given 3 failed OTP attempts, When 4th attempt, Then 401 + 'Too many failed attempts. A new OTP has been generated.' + old OTP status=EXPIRED + new OTP created.
**K.25** Given OTP with status=VERIFIED, When DR re-submits same code, Then 409 + 'This OTP has already been used'.
**K.26** Given POD upload with OCR confidence=95% + waybill match + weight within tolerance, When CA runs OCR, Then assignment auto-approved (status=APPROVED), no review_queue row created.
**K.27** Given POD with OCR confidence=75% + weight within tolerance, When CA runs OCR, Then review_queue row created with flag_reason='AWAITING_CA_VERIFY'.
**K.28** Given POD with OCR confidence=55%, When CA runs OCR, Then review_queue row created with flag_reason='OCR_MISMATCH'.
**K.29** Given loss_pct=1.5% and tolerance_pct=2.0%, When weight reconciliation computed, Then weight_reconciliations.status='WITHIN_TOLERANCE'.
**K.30** Given loss_pct=2.0% exactly and tolerance_pct=2.0% (boundary), Then status='WITHIN_TOLERANCE' (inclusive boundary).
**K.31** Given loss_pct=2.01% and tolerance_pct=2.0%, Then status='OUTSIDE_TOLERANCE' + review_queue row with flag_reason='TOLERANCE_EXCEEDED'.
**K.32** Given assignment in APPROVED status, When CA calls generate-invoice, Then delivery_invoice created with total_value=ROUND(net_received_tonnes × rate, 2).
**K.33** Given delivery_invoice already exists for assignment, When CA calls generate-invoice again, Then 409 + 'Invoice already exists for this assignment'.
**K.34** Given miro_invoice in PARKED status, When CA calls /post, Then status='POSTED'.
**K.35** Given miro_invoice in PARKED status, When CA calls /clear directly, Then 409 + 'Invalid MIRO status transition'.
**K.36** Given miro_invoice in POSTED status, When CA calls /park, Then 409 + 'Invalid MIRO status transition'.
**K.37** Given miro_invoice in CLEARED status, When CA calls /post, Then 409 + 'Invalid MIRO status transition'.
**K.38** Given VITE_SAP_USE_MOCK=false and SAP endpoint unreachable, When GET /api/v3/sap/sync, Then 502 + 'SAP system unavailable. Falling back to local data.' + row inserted in sap_sync_log.
**K.39** Given dr_zweli JWT, When POST /api/v3/transport-assignments/1/weight (SR-only), Then 403 + 'Insufficient permissions'.
**K.40** Given file upload with MIME=application/exe, When POST /upload-bilty, Then 400 + 'Only JPEG, PNG, and PDF files are allowed'.
**K.41** Given JPEG file of 11 MB, When POST /upload-pod, Then 413 + 'File size must not exceed 10 MB'.
**K.42** Given empty base64 string as e-signature, When POST /esign, Then 400 + 'Signature canvas is empty or too short'.
**K.43** Given driver belonging to Zulu Freight, When ta_sipho (Sipho Transport) assigns that driver, Then 403 + 'Driver does not belong to your transporter account'.
**K.44** Given driver with license_expiry=yesterday, When TA assigns that driver, Then 409 + 'Driver license has expired'.
**K.45** Given vehicle capacity=20T and assigned_qty=25T, When TA assigns vehicle, Then 409 + 'Vehicle capacity insufficient for assigned quantity'.
**K.46** Given CA role, When POST /api/v3/demo/reset, Then 200 + {reset:true, records_wiped:N, contracts_preserved:true, purchase_orders_preserved:true}.
**K.47** Given ta_sipho JWT, When POST /api/v3/demo/reset, Then 403 + 'Only Company Admin can reset demo data'.
**K.48** Given GET /health, Then 200 + {status:'ok', db:'connected', uptime_seconds:N}.
**K.49** Given open review_queue item with blocks_miro_bool=1 for assignment, When CA tries to park MIRO invoice, Then 409 + 'Cannot park MIRO invoice: unresolved review queue items exist'.
**K.50** Given assignment in DISPATCHED, When DR logs transit_event EN_ROUTE with valid GPS coords, Then 200 + transit_events row created + assignment.status='EN_ROUTE'.

---

## SECTION S — ASSUMPTIONS MADE & RESOLVED CONFLICTS

1. **Currency**: ZAR (South African Rand). No GST/VAT line on PODZO invoice — tax is handled in SAP MIRO at the ERP layer.
2. **Timezone display**: All DB timestamps stored UTC ISO-8601; UI renders in Asia/Kolkata (IST, UTC+5:30) via `Intl.DateTimeFormat`.
3. **OCR**: Fully simulated server-side — returns randomised confidence score (gaussian around 85±20%) plus extracted waybill/weight based on known assignment data. No third-party OCR API is called.
4. **SAP write-back**: MIRO park/post/clear updates local DB and attempts OData call. If SAP unreachable, local state updates, error logged in sap_sync_log, 502 returned to UI. UI shows degraded-mode banner.
5. **Multi-trip per PO**: Allowed. SUM of assigned_qty across non-CANCELLED assignments used for over-allocation check.
6. **File storage**: Local filesystem only at ./public/uploads/. UUID-renamed on save. For production, abstract behind a storage adapter interface.
7. **Auth**: No refresh tokens — 8 h JWT, re-login after expiry. No remember-me.
8. **Driver GPS**: Browser Geolocation API (navigator.geolocation). No hardware GPS integration.
9. **Vehicle reg format**: Accept any alphanumeric 3–12 characters (South African plate formats vary by province).
10. **Conflict — PDF says "real-time SAP sync on PO create"**: Code uses manual trigger endpoint GET /api/v3/sap/sync. **Decision: manual trigger retained** — real-time sync requires SAP event bus unavailable in demo environment. Polling or webhook can be added post-launch.
11. **Conflict — PDF mentions ML81N service entry sheets**: Not implemented in V3 codebase. **Decision: out of scope for V3** — ML81N creates SES in SAP post-MIRO-clear; that action is logged in sap_sync_log as an OUT record but no UI screen is built.

---

## SECTION T — BUILD CHECKLIST (SELF-VERIFY BEFORE FINISHING)

The builder Claude MUST verify every item below is true before outputting "BUILD COMPLETE":

1. [ ] package.json contains all dependencies at pinned versions from Section C
2. [ ] .env.example is complete with all 12 variables and defaults
3. [ ] vite.config.ts proxies /api to localhost:3001 and /sap to SAP base URL env var
4. [ ] server/db/schema_v3.sql creates all 25+ tables with FK, CHECK, UNIQUE, and indexes
5. [ ] PRAGMA foreign_keys=ON and PRAGMA journal_mode=WAL are set in database_v3.ts
6. [ ] seed_v3.sql inserts assignments in all 15 valid status states
7. [ ] All 5 users present in seed with bcrypt hash for 'Demo@1234' (cost=10)
8. [ ] server/index.ts initialises both databases, mounts all routes, serves /public/uploads statically
9. [ ] GET /health returns {status:'ok', db:'connected', uptime_seconds:N}
10. [ ] POST /api/v3/auth/login returns {token, user} on valid credentials
11. [ ] JWT middleware rejects expired/invalid tokens with 401
12. [ ] All 40+ endpoints in Section H implemented in api_v3.ts
13. [ ] Weight stage sequence enforced — out-of-order returns 409
14. [ ] Over-allocation prevention returns 409
15. [ ] OCR simulation returns confidence score and routes to correct queue or auto-approve
16. [ ] review_queue items with blocks_miro_bool=1 block MIRO park
17. [ ] MIRO state machine: PARKED→POSTED→CLEARED only; all others 409
18. [ ] Invoice: total_value = ROUND(net_received_tonnes × rate, 2) in ZAR
19. [ ] All file uploads stored in /public/uploads/{type}/ with UUID filename
20. [ ] CA sees all data; TA sees only their transporter's; DR sees only their assignments; SR sees siding-relevant; CR sees their customer's deliveries
21. [ ] AuthContextV3 provides {user, token, login(), logout(), isLoading}
22. [ ] App.tsx has route guards: unauthenticated → /login, authenticated wrong route → role dashboard
23. [ ] Role-based redirect after login: CA→/dashboard, TA→/ta/dashboard, SR→/sr/dashboard, DR→/dr/dashboard, CR→/cr/dashboard
24. [ ] LoginPage has quick-switch demo persona buttons for all 5 roles
25. [ ] AdminContracts shows contract list with SAP no, customer, dates, status, PO count
26. [ ] AdminApprovals shows review queue with flag_reason, trip ID, OCR confidence, resolve modal
27. [ ] AdminInvoices shows invoice list + MIRO status + amount + transporter name
28. [ ] TransporterPOs shows POs with Accept button and driver/vehicle assign modal
29. [ ] SupervisorDashboard has 4 labelled weight input fields (Mine Tare, Mine Gross, Dest Gross, Dest Tare)
30. [ ] DriverDashboard renders correctly at 320px min-width (mobile-first)
31. [ ] CustomerDashboard shows Dest Gross + Dest Tare inputs and delivery confirmation button
32. [ ] SignaturePad saves base64 PNG data URL on submit
33. [ ] WeightVarianceCard shows all 4 weights, net dispatch, net received, loss kg, loss%, pass/fail badge
34. [ ] StatusBadge renders correct colour variant per status string
35. [ ] DataTable supports sortable columns, filter props, server-side pagination
36. [ ] Toast appears on success and error API calls (min 3-second visibility)
37. [ ] `npx tsc --noEmit` exits with 0 errors across entire project
38. [ ] Zero console.error on happy paths for all 5 personas
39. [ ] POST /api/v3/demo/reset requires CA role, returns {reset:true, records_wiped:N}
40. [ ] README.md contains: install steps, env setup, npm scripts, credentials table, folder structure
41. [ ] Unit test files created for: weight.calculator, invoice.calculator, otp.service, ocr.mock, validators
42. [ ] E2E Playwright spec file created for happy-path full 7-step flow
43. [ ] MIRO posting gracefully degrades (502 + sap_sync_log entry) when SAP unreachable
44. [ ] Expired contract assignment returns 409 containing the word 'expired'
45. [ ] Every source file starts with `// FILE: path/to/file.ext` on line 1

Final response format the builder Claude MUST output:

```
BUILD COMPLETE
==============
npm run server   # API → http://localhost:3001
npm run dev      # UI  → http://localhost:5173

Credentials (password: Demo@1234)
| Username     | Role | Dashboard          |
|-------------|------|--------------------|
| ca_thandiwe | CA   | /dashboard         |
| ta_sipho    | TA   | /ta/dashboard      |
| sr_gate01   | SR   | /sr/dashboard      |
| dr_zweli    | DR   | /dr/dashboard      |
| cr_mining   | CR   | /cr/dashboard      |

TypeScript: 0 errors  |  Tests: all pass  |  Ports: 5173 + 3001
```
