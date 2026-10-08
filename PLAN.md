# PODZO — Full Overhaul Plan
**Mode: PLAN ONLY — No code is written or changed until the user replies "approved".**

---

## Table of Contents

1. [Audit Findings & Gap List](#1-audit-findings--gap-list)
2. [Architecture — Touched & New Modules](#2-architecture--touched--new-modules)
3. [Data Model Changes & Migrations](#3-data-model-changes--migrations)
4. [Status / State Machine](#4-status--state-machine)
5. [API Changes (New, Changed, Removed)](#5-api-changes-new-changed-removed)
6. [Screens Per Persona](#6-screens-per-persona)
7. [SAP Integration Design](#7-sap-integration-design)
8. [Business Rules & Validations](#8-business-rules--validations)
9. [Notifications](#9-notifications)
10. [Removal List — Transporter Payments](#10-removal-list--transporter-payments)
11. [Test Plan](#11-test-plan)
12. [Phased Build Order & Acceptance Criteria](#12-phased-build-order--acceptance-criteria)
13. [Risks](#13-risks)
14. [Open Questions](#14-open-questions)

---

## 1. Audit Findings & Gap List

### 1.1 Current Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + React Router 7, Tailwind CSS |
| Backend | Node.js 22 + Express 5, TypeScript (ESM), `better-sqlite3` (WAL mode) |
| Database | SQLite — `server/db/pod_v3.db`, schema in `schema_v3.sql` |
| Auth | JWT (8 h expiry), `bcryptjs` hashing, middleware in `auth_v3.ts` |
| OCR | `OCRService.ts` (OpenAI + Tesseract providers) |
| File upload | `multer` (15 MB limit, PDF/PNG/JPG) |
| SAP integration | `POST /api/v3/sync/s21` — **push-based, ingest Contracts & POs** |
| Deployment | SAP BTP Cloud Foundry (eu30), frontend + backend as separate CF apps |
| Joule | SAP Joule Studio, `podzo_capability` **removed** from `sap_digital_assistant` |

### 1.2 Current Roles

| Code | Name | Default Route |
|---|---|---|
| `CA` | Company Admin | `/admin/dashboard` |
| `TA` | Transporter Admin | `/transporter/dashboard` |
| `DR` | Driver | `/driver/dashboard` |
| `CR` | Customer Receiver | `/customer/dashboard` |
| `SR` | Supervisor / Scale Reader | `/supervisor/dashboard` |

**Missing role: `SA` (Staging Area)** — does not exist anywhere in the codebase.

### 1.3 Current Flow (as built)

```
CA syncs Contracts/POs (push) → CA distributes PO to TA (dropdown selection, qty splitting allowed)
→ TA assigns Driver + Truck → Driver accepts → Supervisor: gate-check, MINE_TARE, MINE_GROSS, RELEASE
→ Driver transits → Customer (CR): OTP, DEST_GROSS, unload, DEST_TARE, stamp-confirm
→ TA creates delivery invoice (DRAFT → SENT_TO_CA)
→ CA verifies POD (approve/reject) → CA parks MIRO → CA posts MIRO → CA clears payment (FULL/PARTIAL)
→ Customer sees cleared status
```

**No Staging Area step. No live SAP Sales Order fetch. Distribution uses quantity-split dropdown.**

### 1.4 Gap List

| # | Gap | Severity |
|---|---|---|
| G-01 | No Sales Orders entity — current model is Contracts + POs | Critical |
| G-02 | SAP fetch is **push-only** (sync/s21); no live read from SAP S/4HANA | Critical |
| G-03 | No `SA` (Staging Area) role, no staging validation loop | Critical |
| G-04 | Distribution UI: dropdown + qty-split — must be checkbox list, no splitting | High |
| G-05 | No "Post Invoice" tab or PARKED-status flow (current has MIRO Park which implies SAP write) | High |
| G-06 | Customer payment currently triggered by CA; must be driven by customer | High |
| G-07 | CA sees payment before customer pays — must be reversed | High |
| G-08 | TA creates delivery invoice — must be removed (CA owns invoicing now) | High |
| G-09 | Waybill issued after Supervisor RELEASE — should be after Staging match | Medium |
| G-10 | Image capture at loading exists in Supervisor flow — must be removed | Medium |
| G-11 | All TA payment functionality (TransporterInvoices.tsx, /delivery-invoices POST for TA, /miro for TA) — must be cleanly removed | High |
| G-12 | Staging exception must loop: Staging → Supervisor re-fix → re-release → Staging re-check | High |
| G-13 | No "Post Invoice" tab in CA — invoicing currently under `/admin/invoices` in mixed state | Medium |
| G-14 | `job_configs` table / distribute flow tightly coupled to PO IDs — needs refactor to Sales Orders | High |
| G-15 | `contracts` and `purchase_orders` tables remain as primary entities — must be replaced / supplemented by `sales_orders` + `sales_order_items` | Critical |
| G-16 | OCR POD review queue exists but approval does not trigger "Post Invoice" tab automatically | Medium |
| G-17 | Partial payment currently done by CA through `/miro/:id/clear` with payment_type — must be done by customer | High |

---

## 2. Architecture — Touched & New Modules

### 2.1 Backend

```
server/
├── db/
│   ├── schema_v3.sql          ← MODIFY (add SA role, sales_orders, staging tables, payment_events)
│   ├── seed_v3.sql            ← MODIFY (add SA user, replace contract/PO seed with SO seed)
│   └── database_v3.ts        ← no change (getDb() unchanged)
├── middleware/
│   └── auth_v3.ts             ← MODIFY (add 'SA' to role enum)
├── routes/
│   ├── api_v3.ts              ← HEAVY MODIFY (all route changes below)
│   └── auth_v3.ts             ← no change
├── services/
│   ├── ocr/                   ← no change
│   └── sap/                   ← NEW folder
│       ├── SAPClient.ts       ← NEW (OData v2 HTTP client, reads env vars)
│       ├── SalesOrderAdapter.ts ← NEW (fetch + map A_SalesOrder, A_SalesOrderItem)
│       └── SAPCache.ts        ← NEW (in-memory TTL cache, fallback on timeout)
```

### 2.2 Frontend

```
src/
├── contexts/
│   └── AuthContextV3.tsx      ← MODIFY (add SA role routing)
├── views/
│   ├── AdminDashboard.tsx     ← MODIFY (swap contracts/POs for SOs)
│   ├── AdminContracts.tsx     ← REPURPOSE → AdminSalesOrders.tsx (renamed + rebuilt)
│   ├── AdminApprovals.tsx     ← MODIFY (add Post Invoice trigger)
│   ├── AdminInvoices.tsx      ← MODIFY (add "Post Invoice" tab; remove MIRO post/clear for TA; keep PARKED/CLEARED tabs for CA)
│   ├── TransporterDashboard.tsx ← MODIFY (remove invoice nav card)
│   ├── TransporterPOs.tsx     ← MODIFY (remove PO term, show SOs assigned by CA)
│   ├── TransporterInvoices.tsx ← REMOVE ENTIRELY
│   ├── TransporterPODs.tsx    ← no change
│   ├── SupervisorDashboard.tsx ← MODIFY (remove image capture at load; add waybill issue only after staging match)
│   ├── CustomerDashboard.tsx  ← MODIFY (add payment button FULL/PARTIAL; hide before PARKED status)
│   └── StagingDashboard.tsx   ← NEW
├── App.tsx                    ← MODIFY (add SA route, remove /transporter/invoices route)
├── components/
│   └── Sidebar.tsx            ← MODIFY (remove "Invoices" from TA sidebar; add SA sidebar)
└── lib/
    └── api_v3.ts              ← MODIFY (add SO types, staging API calls, remove TA invoice calls)
```

---

## 3. Data Model Changes & Migrations

### 3.1 New Tables

#### `sales_orders`
```sql
CREATE TABLE IF NOT EXISTS sales_orders (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  sap_so_no         TEXT UNIQUE NOT NULL,          -- e.g. "2318"
  customer_id       INTEGER NOT NULL REFERENCES customers(id),
  sap_customer_no   TEXT NOT NULL,
  created_date      TEXT NOT NULL,                 -- SAP CreationDate
  delivery_date     TEXT,                          -- RequestedDeliveryDate
  overall_status    TEXT NOT NULL DEFAULT 'OPEN',  -- SAP OverallSDProcessStatus
  portal_status     TEXT NOT NULL CHECK(portal_status IN (
    'OPEN','DISTRIBUTED','IN_PROGRESS','DELIVERED','INVOICED','PAID'
  )) DEFAULT 'OPEN',
  fetched_at        TEXT NOT NULL DEFAULT (datetime('now')),
  raw_json          TEXT                           -- full SAP JSON cached
);
```

#### `sales_order_items`
```sql
CREATE TABLE IF NOT EXISTS sales_order_items (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  so_id             INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  sap_so_no         TEXT NOT NULL,
  item_no           TEXT NOT NULL,                 -- e.g. "10", "20"
  material          TEXT NOT NULL,
  material_desc     TEXT,
  order_qty         REAL NOT NULL,
  uom               TEXT NOT NULL,
  net_price         REAL,
  plant             TEXT,
  storage_location  TEXT,
  delivered_qty     REAL DEFAULT 0,
  portal_item_status TEXT NOT NULL CHECK(portal_item_status IN (
    'OPEN','ASSIGNED','IN_PROGRESS','DELIVERED','CLOSED'
  )) DEFAULT 'OPEN',
  UNIQUE(sap_so_no, item_no)
);
```

#### `so_distributions`
Replaces `job_configs`. Whole SO → one transporter, no quantity split.
```sql
CREATE TABLE IF NOT EXISTS so_distributions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  so_id             INTEGER NOT NULL REFERENCES sales_orders(id),
  transporter_id    INTEGER NOT NULL REFERENCES transporters(id),
  distributed_by    INTEGER NOT NULL REFERENCES users(id),  -- CA user
  distributed_at    TEXT NOT NULL DEFAULT (datetime('now')),
  status            TEXT NOT NULL CHECK(status IN ('PENDING','ASSIGNED','COMPLETED')) DEFAULT 'PENDING'
);
```

#### `staging_checks`
```sql
CREATE TABLE IF NOT EXISTS staging_checks (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id     INTEGER NOT NULL REFERENCES transport_assignments(id),
  checked_by        INTEGER NOT NULL REFERENCES users(id),  -- SA user
  checked_at        TEXT NOT NULL DEFAULT (datetime('now')),
  result            TEXT NOT NULL CHECK(result IN ('MATCH','MISMATCH')),
  mismatch_notes    TEXT,
  waybill_no        TEXT,    -- only set on MATCH
  waybill_issued_at TEXT
);
```

#### `invoice_events`
Replaces `miro_invoices` / `main_invoices` / `delivery_invoices` for the new flow.
```sql
CREATE TABLE IF NOT EXISTS invoice_events (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id     INTEGER UNIQUE NOT NULL REFERENCES transport_assignments(id),
  invoice_no        TEXT,                          -- PODZO-generated, e.g. PODZO-INV-20261008-001
  total_value       REAL NOT NULL,
  accepted_payload  REAL NOT NULL,
  rate              REAL NOT NULL,
  status            TEXT NOT NULL CHECK(status IN (
    'DRAFT','PARKED','PAID_PARTIAL','PAID_FULL'
  )) DEFAULT 'DRAFT',
  posted_by         INTEGER REFERENCES users(id),  -- CA who clicked "Post Invoice"
  posted_at         TEXT,
  customer_notified_at TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### `payment_events`
Tracks each customer payment installment.
```sql
CREATE TABLE IF NOT EXISTS payment_events (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id        INTEGER NOT NULL REFERENCES invoice_events(id),
  payment_type      TEXT NOT NULL CHECK(payment_type IN ('FULL','PARTIAL')),
  amount_paid       REAL NOT NULL,
  balance_before    REAL NOT NULL,
  balance_after     REAL NOT NULL,
  paid_by           INTEGER NOT NULL REFERENCES users(id),  -- CR user
  paid_at           TEXT NOT NULL DEFAULT (datetime('now')),
  ref_no            TEXT
);
```

### 3.2 Modified Tables

#### `users` — add role `SA`
```sql
-- Change CHECK constraint:
role TEXT NOT NULL CHECK(role IN ('CA', 'TA', 'DR', 'CR', 'SR', 'SA'))
```

#### `transport_assignments` — add new statuses
```sql
-- Add to status CHECK:
'STAGING_EXCEPTION', 'STAGING_CLEARED', 'WAYBILL_ISSUED'
-- Remove: 'MIRO_PARKED', 'MIRO_POSTED'   (keep 'INVOICED', 'CLEARED' for continuity)
```
New full status set:
```
ASSIGNED → GATE_DENIED
ASSIGNED → MINE_TARE_LOGGED → MINE_GROSS_LOGGED → DISPATCHED → EN_ROUTE → ARRIVED
→ DELIVERED → POD_UPLOADED → UNDER_REVIEW → APPROVED
→ INVOICED (PARKED) → CLEARED (PAID_FULL)
```
Plus Supervisor sub-flow internally:
```
MINE_GROSS_LOGGED → (Supervisor RELEASE) → STAGING_EXCEPTION loop → STAGING_CLEARED → WAYBILL_ISSUED → DISPATCHED
```

#### `transport_assignments` — link to SO
```sql
ALTER TABLE transport_assignments ADD COLUMN so_distribution_id INTEGER REFERENCES so_distributions(id);
ALTER TABLE transport_assignments ADD COLUMN so_id INTEGER REFERENCES sales_orders(id);
```

### 3.3 Deprecated / To-Remove Tables (after migration)
These tables become **dead weight** once the new flow is live. They are kept initially for migration safety then dropped in Phase 5:

- `contracts` (replaced by `sales_orders`)
- `purchase_orders` (replaced by `sales_order_items`)
- `job_configs` (replaced by `so_distributions`)
- `job_config_pos` (replaced by `so_distributions`)
- `miro_invoices` (replaced by `invoice_events`)
- `main_invoices` (replaced by `invoice_events`)
- `delivery_invoices` (replaced by `invoice_events`)

### 3.4 Migration Strategy

Since this is SQLite in a live CF deployment, migrations are **additive first**:
1. `ALTER TABLE` for new columns on existing tables (SQLite supports ADD COLUMN).
2. New tables created with `CREATE TABLE IF NOT EXISTS`.
3. Role CHECK constraint: SQLite cannot ALTER CHECK constraints — requires a table rebuild (`CREATE TABLE new → INSERT SELECT → DROP old → RENAME`).
4. Old tables kept during phases 1–4; phase 5 drops them.
5. A migration runner in `database_v3.ts` checks a `schema_version` table and applies migrations in order.

---

## 4. Status / State Machine

### 4.1 Trip / Assignment State Machine

```
[ASSIGNED]
    │  Supervisor gate check pass
    ▼
[MINE_TARE_LOGGED]
    │  Supervisor logs MINE_GROSS
    ▼
[MINE_GROSS_LOGGED]
    │  Supervisor checks loaded items vs SO items, clicks RELEASE
    ▼
[STAGING_EXCEPTION] ◄──── Staging Area: MISMATCH
    │  Supervisor fixes, re-releases
    │
    │  Staging Area: MATCH
    ▼
[STAGING_CLEARED]
    │  Waybill auto-issued
    ▼
[WAYBILL_ISSUED → DISPATCHED]
    │
    ▼
[EN_ROUTE → ARRIVED]
    │  OTP verified at customer
    ▼
[DEST_GROSS_LOGGED → DELIVERED → DEST_TARE_LOGGED]
    │  Variance check
    │  Within tolerance ──────────────────────────────────────┐
    │  Outside tolerance → Review Queue (blocks invoicing)    │
    ▼                                                         │
[POD_UPLOADED]                                                │
    │  OCR confidence ≥ threshold                            │
    │  Low confidence → Review Queue                          │
    ▼                                                         │
[UNDER_REVIEW]   CA approves ──────────────────────────────── ▼
[APPROVED]
    │  CA clicks "Post Invoice"
    ▼
[INVOICED]   (invoice_events.status = 'PARKED')
    │  Customer pays (FULL or PARTIAL x N)
    ▼
[CLEARED]    (invoice_events.status = 'PAID_FULL', payment_events balance_after = 0)
```

### 4.2 POD State Machine

```
PENDING → LOW_CONFIDENCE (→ Review Queue) → RESOLVED
PENDING → MATCH (→ CA Approval queue)
PENDING → MISMATCH (→ Review Queue)
```

### 4.3 Invoice State Machine

```
DRAFT → (CA clicks Post Invoice) → PARKED
PARKED → (customer pays PARTIAL) → PAID_PARTIAL
PAID_PARTIAL → (customer pays remaining) → PAID_FULL
PARKED → (customer pays FULL at once) → PAID_FULL
```

### 4.4 Payment Visibility Rule
- CA sees payment record **only after** `payment_events` row is created by the customer.
- `GET /api/v3/invoices/posted` for CA returns `invoice_events` joined with `payment_events` (could be empty array if no payments yet).

### 4.5 Staging Exception Loop

```
Supervisor RELEASE
    ↓
Staging check → MISMATCH
    ↓
`staging_checks` row inserted (result = 'MISMATCH')
assignment.status = 'STAGING_EXCEPTION'
Supervisor notified (UI badge / toast)
    ↓
Supervisor fixes items, clicks Re-Release
assignment.status = 'MINE_GROSS_LOGGED' (reset for re-check)
    ↓
Staging re-checks → MATCH
    ↓
`staging_checks` row inserted (result = 'MATCH', waybill_no generated)
assignment.status = 'STAGING_CLEARED' → 'WAYBILL_ISSUED'
```

---

## 5. API Changes (New, Changed, Removed)

### 5.1 New Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/v3/sales-orders` | CA | List all SOs fetched from SAP (cached) |
| `POST` | `/api/v3/sales-orders/refresh` | CA | Trigger fresh fetch from SAP OData |
| `GET` | `/api/v3/sales-orders/:id` | CA, TA | SO detail with line items |
| `POST` | `/api/v3/sales-orders/distribute` | CA | Distribute selected SOs (whole orders) to a transporter |
| `GET` | `/api/v3/so-distributions` | CA, TA | List distributions with status |
| `POST` | `/api/v3/assignments/:id/supervisor-release` | SR | Supervisor releases load to Staging |
| `POST` | `/api/v3/assignments/:id/staging-check` | SA | Staging Area validates line items |
| `POST` | `/api/v3/assignments/:id/staging-release` | SA | Staging clears trip (after MATCH) |
| `GET` | `/api/v3/staging/queue` | SA | SA inbox: all MINE_GROSS_LOGGED / STAGING_EXCEPTION assignments |
| `POST` | `/api/v3/invoices/post` | CA | Post Invoice → creates invoice_events row (PARKED) |
| `GET` | `/api/v3/invoices/posted` | CA | CA Post Invoice tab: list PARKED / PAID_PARTIAL / PAID_FULL |
| `GET` | `/api/v3/invoices/my` | CR | Customer: list their invoices (PARKED and above) |
| `POST` | `/api/v3/invoices/:id/pay` | CR | Customer makes payment (FULL or PARTIAL) |
| `GET` | `/api/v3/invoices/:id/payments` | CA | CA views payment history (only after ≥1 payment_event) |

### 5.2 Changed Endpoints

| Path | Change |
|---|---|
| `POST /api/v3/po/distribute` | **Replaced** by `POST /sales-orders/distribute`. Old endpoint removed. |
| `GET /api/v3/contracts` | **Repurposed** → returns `sales_orders` (or remove; CA uses `/sales-orders`) |
| `GET /api/v3/purchase-orders` | **Repurposed** → returns `sales_order_items` (or remove) |
| `POST /api/v3/sync/s21` | **Removed** (replaced by live SAP fetch) |
| `GET /api/v3/assignments` | **Modified** — add join to `so_id`, `so_distribution_id` |
| `GET /api/v3/job-configs` | **Remove** (TA now sees assigned SOs via `/so-distributions`) |
| `POST /api/v3/job-configs/:id/assign` | **Remove** (TA assigns driver via a new TA endpoint against SO distribution) |
| `POST /api/v3/assignments/:id/authorize-journey` | **Remove** (replaced by Staging release) |

### 5.3 Removed Endpoints (TA Payment)

| Path | Reason |
|---|---|
| `POST /api/v3/delivery-invoices` | TA created delivery invoices — removed |
| `GET /api/v3/delivery-invoices` for `TA` role | TA invoice view — removed |
| `POST /api/v3/miro` for `TA` | TA could park MIRO — removed |
| `POST /api/v3/miro/:id/post` for `TA` | TA could post MIRO — removed |
| `GET /api/v3/miro` for `TA` | TA MIRO list — removed |

> All remaining MIRO routes (`POST /miro`, `POST /miro/:id/clear`, etc.) are also **removed** because the new flow uses `invoice_events` with status `PARKED` (front-end only, no SAP write). These are replaced by the new `/invoices/post` and `/invoices/:id/pay` routes.

### 5.4 New SAP-Facing Endpoints (internal service layer, not REST public)

```
SAPClient.ts
  - getSalesOrders(filters)        → calls API_SALES_ORDER_SRV A_SalesOrder
  - getSalesOrderItems(soNo)       → calls A_SalesOrderItem
  - uses BTP Destination Service or env vars for auth
```

---

## 6. Screens Per Persona

### 6.1 Company Admin (CA) — `/admin/*`

| Screen | Path | Status |
|---|---|---|
| Dashboard (KPIs) | `/admin/dashboard` | Modify: swap PO/Contract KPIs for SO KPIs |
| **Sales Orders** (live SAP) | `/admin/sales-orders` | **NEW** — table + Refresh from SAP button |
| **Distribute** | `/admin/sales-orders` (modal/slide-out) | **NEW** — checkbox table, select-all, pick transporter, submit whole SO |
| POD Approvals / Review Queue | `/admin/approvals` | Modify: approval triggers "move to Post Invoice tab" automatically |
| **Post Invoice tab** | `/admin/invoices` (new tab) | **NEW** tab: list of APPROVED trips ready to post |
| Invoices — PARKED tab | `/admin/invoices` | Modify: show PARKED invoices, view payment history (only after customer pays) |
| Invoices — PAID tab | `/admin/invoices` | Keep: PAID_FULL invoices |
| ~~Contracts~~ | `/admin/contracts` | **REMOVE** route; replace with `/admin/sales-orders` |

**Distribution UI rules (enforce in code + UX):**
- Plain `<table>` with a `<input type="checkbox">` per row + a "Select All" header checkbox.
- No dropdowns, no quantity input, no partial allocation.
- A single transporter picker (dropdown OK here — picking who gets the batch).
- Submit: all checked SOs go to chosen transporter as whole orders.
- Disabled for SOs already distributed (status `DISTRIBUTED`).

### 6.2 Transporter Admin (TA) — `/transporter/*`

| Screen | Path | Status |
|---|---|---|
| Dashboard | `/transporter/dashboard` | Modify: remove Invoice nav card |
| **Assigned Sales Orders** | `/transporter/sales-orders` | **NEW** (replaces `/transporter/purchase-orders`) — shows SOs distributed to this TA |
| Assign Driver & Truck | `/transporter/sales-orders` (inline) | Modify: assign to a distributed SO, not to a PO/job-config |
| PODs | `/transporter/pods` | Keep as-is |
| ~~Invoices~~ | `/transporter/invoices` | **REMOVE** entirely |

### 6.3 Driver (DR) — `/driver/*`

| Screen | Path | Status |
|---|---|---|
| Driver App | `/driver/dashboard` | Keep; minor: driver sees SO no instead of PO no |

### 6.4 Supervisor (SR) — `/supervisor/*`

| Screen | Path | Status |
|---|---|---|
| Pre-Dispatch Console | `/supervisor/dashboard` | Modify as below |

**Supervisor flow changes:**
- Gate check → MINE_TARE → load → **check loaded line items vs SO line items** (table comparison) → MINE_GROSS.
- **Remove image capture** at loading step.
- New **"Release to Staging"** button (replaces "Authorize Journey").
- If Staging sends back `STAGING_EXCEPTION`, Supervisor sees a banner/badge: "Staging exception – fix and re-release."
- After Staging MATCH: assignment moves forward automatically; Supervisor has no further action.

### 6.5 Staging Area (SA) — `/staging/*` (NEW)

| Screen | Path | Status |
|---|---|---|
| Staging Dashboard | `/staging/dashboard` | **NEW** |

**Staging dashboard features:**
- Login: username/password with role `SA`.
- Queue: all trips in `MINE_GROSS_LOGGED` or `STAGING_EXCEPTION` state.
- Each row: SO number, driver, truck, list of loaded items.
- Action: compare loaded items vs SO line items; click **MATCH** or **MISMATCH**.
- On MISMATCH: enter mismatch notes; exception sent to Supervisor.
- On MATCH: waybill auto-generated; driver cleared.
- No image upload, no weight entry — pure line-item reconciliation.

### 6.6 Customer (CR) — `/customer/*`

| Screen | Path | Status |
|---|---|---|
| Yard Receiving | `/customer/dashboard` | Modify: add payment panel |

**Customer payment panel:**
- Visible only when `invoice_events.status = 'PARKED'` (i.e., CA has posted the invoice).
- Shows invoice total, balance due.
- Buttons: **Pay Full** | **Pay Partial** (enter amount / %).
- Each payment creates a `payment_events` row.
- Once `balance_after = 0`: invoice moves to `PAID_FULL`; balance panel disappears.
- **No payment UI before PARKED status** — cannot pay if CA hasn't posted yet.

---

## 7. SAP Integration Design

### 7.1 Service & Entity Choice

| SAP OData Service | Entity | Usage |
|---|---|---|
| `API_SALES_ORDER_SRV` (OData v2) | `A_SalesOrder` | Fetch open sales order headers |
| `API_SALES_ORDER_SRV` | `A_SalesOrderItem` | Fetch line items per SO |

**Endpoint pattern (SAP S/4HANA Cloud / BTP):**
```
GET /sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder
    ?$filter=OverallSDProcessStatus eq 'A' or OverallSDProcessStatus eq 'B'
    &$expand=to_Item
    &$format=json
    &sap-client=<client>
```

> Note: exact host, client number, and credentials are pending (see Open Questions).

### 7.2 Field Mapping

| SAP Field (`A_SalesOrder`) | PODZO Column (`sales_orders`) |
|---|---|
| `SalesOrder` | `sap_so_no` |
| `SoldToParty` | `sap_customer_no` |
| `CreationDate` | `created_date` |
| `RequestedDeliveryDate` | `delivery_date` |
| `OverallSDProcessStatus` | `overall_status` |
| *(full JSON)* | `raw_json` |

| SAP Field (`A_SalesOrderItem`) | PODZO Column (`sales_order_items`) |
|---|---|
| `SalesOrderItem` | `item_no` |
| `Material` | `material` |
| `SalesOrderItemText` | `material_desc` |
| `RequestedQuantity` | `order_qty` |
| `RequestedQuantityUnit` | `uom` |
| `NetAmount` | `net_price` |
| `Plant` | `plant` |
| `StorageLocation` | `storage_location` |

### 7.3 Open Orders Filter

Fetch only SOs where `OverallSDProcessStatus` is:
- `'A'` = Open (not yet started)
- `'B'` = In progress

Exclude `'C'` (completed) and `'D'` (rejected).

### 7.4 Pagination & Delta / Refresh Strategy

- **Page size**: `$top=200&$skip=N` until all pages fetched.
- **Scheduled refresh**: every 15 minutes (Node `setInterval` or BTP Job Scheduler if available).
- **Manual refresh**: CA clicks "Refresh from SAP" button → `POST /api/v3/sales-orders/refresh` → triggers immediate fetch.
- **Delta**: store `fetched_at` per SO. On each refresh, upsert by `sap_so_no` (`ON CONFLICT DO UPDATE`). New SOs appear automatically.

### 7.5 Auth & Connectivity

| Option | When to use |
|---|---|
| **BTP Destination Service** (preferred) | SAP BTP-hosted backend — destination named `SAP_S4H_PROD` configured in BTP cockpit |
| **Direct env vars** (`SAP_HOST`, `SAP_CLIENT`, `SAP_USER`, `SAP_PASS`) | Fallback for local dev / CF without Destination |

`SAPClient.ts` checks for `VCAP_SERVICES` (CF bound destination) first; falls back to env vars.

**Never commit credentials.** All secrets via CF env vars or BTP Destination configuration.

### 7.6 Error Handling & Timeouts

- HTTP timeout: 10 s per request.
- On timeout / 5xx: serve **cached data** from `sales_orders` table (last successful fetch).
- Banner shown to CA: "Showing data as of `<fetched_at>`. SAP is temporarily unreachable."
- On 401/403 from SAP: log error, surface to CA as "SAP authentication error — contact admin."
- All SAP calls logged to `sap_sync_log` (direction = `IN`).

### 7.7 SAP Status vs Portal Status

| SAP `OverallSDProcessStatus` | Displayed in PODZO |
|---|---|
| A — Open | 🟢 Open |
| B — In Progress | 🟡 In Progress |
| C — Completed | ✅ Completed |
| D — Rejected | 🔴 Rejected |

Portal's own `portal_status` (tracks what PODZO has done with the SO) is shown alongside SAP status as a separate badge.

### 7.8 No Writes to SAP

This phase is **read-only**. No BAPI calls, no OData PATCH/POST to SAP. The `sap_sync_log` direction will only ever be `IN` in this phase.

### 7.9 Test SOs from POC_Test_Case.docx

| SO No | Description | Deliveries |
|---|---|---|
| 2318 | Single line item, complete delivery | 80001469 |
| 2320 | Multiple line items, partial delivery | 80001470, 80001473 |
| 2321 | Multiple materials, partial delivery | 80001471, 80001472 |
| 2322 | Multiple line items, complete delivery | 80001474 |

These are used in Phase 1 testing against live SAP.

---

## 8. Business Rules & Validations

### 8.1 Distribution Rules
- A Sales Order can only be distributed to **one transporter** at a time.
- The entire SO goes to one transporter — **no quantity splitting**.
- An SO with `portal_status = 'DISTRIBUTED'` is disabled (greyed out) in the distribution checkbox list.
- A CA must select ≥ 1 SO and exactly 1 transporter before submitting.

### 8.2 Supervisor / Line Item Check
- At MINE_GROSS stage, Supervisor sees a comparison table:
  - Left: SO line items (material, qty, UOM) from `sales_order_items`.
  - Right: what is physically loaded (entered by Supervisor).
- Supervisor must confirm all items before hitting "Release to Staging."

### 8.3 Staging Validation
- Staging Area compares released load vs SO line items (same comparison, independent eyes).
- MATCH: all items match within ±0% (exact match — no tolerance at staging, tolerance only at destination).
- MISMATCH: any discrepancy triggers `STAGING_EXCEPTION`.
- There is **no limit** on the number of exception→re-release loops.

### 8.4 Tolerance Check at Destination
- Net delivered = DEST_GROSS − DEST_TARE.
- Variance % = |net_delivered − so_item.order_qty| / so_item.order_qty × 100.
- If variance % > `tolerance_pct` (default 0.5%): exception → Review Queue → **blocks Post Invoice**.
- If variance % ≤ tolerance: trip continues to POD upload.

### 8.5 OCR Threshold
- OCR confidence < 70%: `match_status = 'LOW_CONFIDENCE'` → Review Queue → **blocks Post Invoice**.
- OCR confidence ≥ 70%: `match_status = 'MATCH'` or `'MISMATCH'`.
- MISMATCH regardless of confidence → Review Queue.

### 8.6 Post Invoice Block
CA cannot post invoice if:
- Any `review_queue` item for that assignment has `status = 'OPEN'`.
- `ca_verification.verified_bool = 0` or no CA verification row exists.

### 8.7 Partial Payment Limits
- Each `payment_events.amount_paid` must be > 0 and ≤ `balance_before`.
- Sum of all payments cannot exceed `invoice_events.total_value`.
- Once `balance_after = 0`, no further payments accepted (idempotent guard).

### 8.8 Invoice Numbering
Since nothing is posted to SAP in this phase, PODZO generates its own invoice numbers:
```
PODZO-INV-YYYYMMDD-<zero-padded sequence>
Example: PODZO-INV-20261008-001
```
Sequence is per-day, from a counter table or via SQLite `MAX(id)` logic.

### 8.9 Waybill Generation
- Waybill number generated by PODZO (not SAP) at the moment Staging clears the trip.
- Format: `WB-<SO_NO>-<assignment_id>-<YYYYMMDD>`
- Stored in `staging_checks.waybill_no`.

---

## 9. Notifications

| Trigger | Recipient | Channel |
|---|---|---|
| SO distributed to TA | TA (in-app badge) | Sidebar badge on "Assigned SOs" nav item |
| TA assigns driver | DR (in-app on next login / refresh) | Driver dashboard: "New trip assigned" |
| Supervisor releases to Staging | SA (in-app badge) | Staging dashboard queue count increments |
| Staging MISMATCH | SR (in-app banner) | Supervisor dashboard: "Staging exception on Trip #X" |
| Staging MATCH | SR (in-app toast) | "Trip #X cleared by Staging — waybill issued" |
| Variance exception | CA (Review Queue badge) | Admin review queue count badge |
| OCR low confidence | CA (Review Queue badge) | Admin review queue count badge |
| CA approves POD | CA sees "Move to Post Invoice" | Auto-moved to Post Invoice tab |
| CA posts invoice | CR (in-app badge) | Customer dashboard: "Invoice ready — pay now" |
| Customer pays (FULL or PARTIAL) | CA (in-app, next refresh) | Invoices tab: payment record visible |

> **All notifications are in-app only** (badge/toast/banner via polling or page refresh). No SMS/email in this phase unless specified. Flag as Open Question.

---

## 10. Removal List — Transporter Payments

The following must be **completely removed** with no dead code left:

### 10.1 Backend (`server/routes/api_v3.ts`)

| Route | Action |
|---|---|
| `POST /delivery-invoices` (TA role) | Remove handler; CA-only creation will use new `/invoices/post` |
| `GET /delivery-invoices` — TA access | Remove TA from `requireRole` (CA-only or remove entirely) |
| `POST /miro` (TA role allowed) | Remove TA from role list; then deprecate whole route (replaced by `/invoices/post`) |
| `router.all(['/miro/:id/post', '/miro/post'])` | Remove entirely |
| `POST /miro/:id/clear` | Remove entirely (payment now done by CR via `/invoices/:id/pay`) |
| `GET /miro` — TA access | Remove entirely (new CA-only invoice endpoints replace this) |
| `GET /job-configs` | Remove (replaced by `/so-distributions`) |
| `POST /job-configs/:id/assign` | Remove (replaced by new TA SO assignment endpoint) |
| `POST /assignments/:id/authorize-journey` | Remove (replaced by Staging release) |
| `POST /sync/s21` | Remove (replaced by live SAP fetch) |
| `function syncS21ContractsAndPOs` | Remove entire function |

### 10.2 Frontend

| File | Action |
|---|---|
| `src/views/TransporterInvoices.tsx` | **Delete file entirely** |
| `src/App.tsx` — `/transporter/invoices` route | Remove route |
| `src/components/Sidebar.tsx` — TA "Invoices" nav item | Remove nav item |
| `src/views/TransporterDashboard.tsx` — Invoice NavCard | Remove NavCard |
| `src/views/AdminInvoices.tsx` — Park MIRO button, Post MIRO button, MIRO POST/CLEAR calls for TA | Remove TA payment controls; keep CA "Post Invoice" and payment visibility |
| `src/lib/api_v3.ts` — `invoicesApi.parkMiro`, `invoicesApi.postMiro`, `invoicesApi.clearMiro` | Remove TA-facing invoice API calls; keep new `invoicesApi.postInvoice`, `invoicesApi.pay` |
| `src/contexts/ContractPoContext.tsx` | Remove or repurpose (was for Contract/PO selection) |
| `src/components/branding/ContractPoSelector.tsx` | Remove |
| `src/components/ConsolidatedContractPoForm.tsx` | Remove |

### 10.3 Database

| Table | Action |
|---|---|
| `delivery_invoices` | Drop in Phase 5 (after migration) |
| `main_invoices` | Drop in Phase 5 |
| `miro_invoices` | Drop in Phase 5 |
| `contracts` | Drop in Phase 5 |
| `purchase_orders` | Drop in Phase 5 |
| `job_configs` | Drop in Phase 5 |
| `job_config_pos` | Drop in Phase 5 |

### 10.4 Seed Data

- Remove all contract/PO seed rows from `seed_v3.sql`.
- Add SA user seed row:
  ```sql
  (13, 'sa_staging01', '<hash>', 'SA', 'Staging Controller', 'staging@podzo.co.za', '+27110001013', NULL)
  ```
- Add demo SO rows (from POC test data: SO 2318, 2320, 2321, 2322) for local dev.

---

## 11. Test Plan

### 11.1 Unit Tests (Backend)

| Test | Covers |
|---|---|
| `SAPClient.getSalesOrders` — mock HTTP 200 | Field mapping, pagination |
| `SAPClient.getSalesOrders` — mock HTTP 500 | Cache fallback, error log |
| `syncSalesOrders` — upsert idempotency | Duplicate fetch doesn't duplicate rows |
| `POST /api/v3/invoices/post` — open review queue | Returns 409 (blocked) |
| `POST /api/v3/invoices/:id/pay` — overpayment | Returns 400 |
| `POST /api/v3/invoices/:id/pay` — balance = 0 after | Status → PAID_FULL |
| `POST /api/v3/staging-check` — MISMATCH | Assignment status → STAGING_EXCEPTION |
| `POST /api/v3/staging-check` — MATCH | Waybill generated, status → STAGING_CLEARED |

### 11.2 Integration Tests (Using SAP POC Test SOs)

| Test Case | SO | Scenario | Expected |
|---|---|---|---|
| TC-01 | 2318 | Single line item, complete delivery | Full flow end-to-end, invoice PAID_FULL |
| TC-02 | 2321 | Multiple material, partial delivery | Staging validates 2 deliveries; partial SO delivered |
| TC-03 | 2320 | Multiple line items, partial delivery | Supervisor checks all items; staging loops once |
| TC-04 | 2322 | Multiple line items, complete delivery | Full flow, multiple line item comparison |

### 11.3 UI / E2E Tests

| Persona | Test |
|---|---|
| CA | Select 2 SOs via checkbox, distribute to TA — verify SO status = DISTRIBUTED |
| CA | Try distributing already-distributed SO — checkbox disabled |
| TA | See assigned SOs, assign driver+truck |
| SR | Gate check, MINE_TARE, MINE_GROSS, compare items, Release |
| SA | Login as `sa_staging01`, see queue, trigger MISMATCH, verify SR notified |
| SA | After SR re-release, approve MATCH, verify waybill issued |
| DR | Accept trip, transit, OTP at destination |
| CR | DEST_GROSS, unload, DEST_TARE, stamp, POD upload |
| CA | Review queue: approve POD → trip auto-moves to Post Invoice tab |
| CA | Click "Post Invoice" → invoice status PARKED |
| CR | Login, see invoice, pay PARTIAL (50%), verify balance |
| CR | Pay remaining 50%, verify PAID_FULL |
| CA | Verify payment visible only after CR pays |
| CA | Verify no invoice posting when review queue has OPEN item |

### 11.4 Regression Tests

- All existing Supervisor weight-log flow (MINE_TARE, MINE_GROSS, DEST_GROSS, DEST_TARE) unchanged.
- OTP generation and verification unchanged.
- OCR POD upload and review queue unchanged.
- JWT auth unchanged (new SA role added).
- Demo reset preserves SO data (like it preserved contract data).

---

## 12. Phased Build Order & Acceptance Criteria

### Phase 1 — SAP Sales Order Fetch (Foundation)
**Goal:** Live SOs appear in PODZO from SAP S/4HANA.

Tasks:
1. Create `SAPClient.ts` + `SalesOrderAdapter.ts` (env var auth + BTP Destination).
2. Add `sales_orders` + `sales_order_items` tables to schema (additive migration).
3. `POST /api/v3/sales-orders/refresh` — trigger fetch, upsert.
4. `GET /api/v3/sales-orders` — list cached SOs.
5. Frontend: new `AdminSalesOrders.tsx` page with table + Refresh button.
6. Add route `/admin/sales-orders` in `App.tsx`.

**Acceptance Criteria:**
- [ ] Clicking "Refresh from SAP" fetches SO 2318, 2320, 2321, 2322 from live SAP.
- [ ] SOs appear in the table with correct line items.
- [ ] On SAP timeout, cached data shown with "last synced" timestamp.
- [ ] Scheduled auto-refresh fires every 15 minutes.
- [ ] `sap_sync_log` records each fetch (direction = IN).

---

### Phase 2 — Distribution Overhaul (CA → TA)
**Goal:** CA distributes whole SOs via checkbox table.

Tasks:
1. Add `so_distributions` table.
2. `POST /api/v3/sales-orders/distribute` endpoint.
3. `GET /api/v3/so-distributions` for TA.
4. Frontend: `AdminSalesOrders.tsx` — checkbox + select-all + transporter picker + Distribute button.
5. TA view: `TransporterSalesOrders.tsx` (replaces `TransporterPOs.tsx`).
6. Remove old distribute (`/po/distribute`) route.
7. Update `transport_assignments` to link `so_distribution_id`, `so_id`.

**Acceptance Criteria:**
- [ ] CA can select multiple SOs via checkboxes (select-all works).
- [ ] No dropdown for quantity, no splitting.
- [ ] Already-distributed SOs have disabled checkboxes.
- [ ] TA dashboard shows distributed SOs with "Assign Driver" action.
- [ ] Old `/po/distribute` route returns 404.

---

### Phase 3 — Staging Area Role
**Goal:** SA role exists, staging validation loop works.

Tasks:
1. Add `SA` role to users table CHECK constraint (table rebuild migration).
2. Add `staging_checks` table.
3. Add new statuses to `transport_assignments`.
4. Endpoints: `GET /staging/queue`, `POST /assignments/:id/staging-check`, `POST /assignments/:id/staging-release`.
5. Remove `POST /assignments/:id/authorize-journey` (replaced by staging release).
6. Remove image capture from Supervisor loading step.
7. Frontend: `StagingDashboard.tsx` (new), `App.tsx` SA route, `Sidebar.tsx` SA nav.
8. Supervisor: "Release to Staging" replaces "Authorize Journey"; staging exception banner.
9. Waybill generation on MATCH.

**Acceptance Criteria:**
- [ ] `sa_staging01` can log in and see assigned trips.
- [ ] SA submits MISMATCH → Supervisor sees exception badge.
- [ ] Supervisor re-releases → SA queue updates.
- [ ] SA submits MATCH → waybill number generated, trip dispatched.
- [ ] No image capture UI present in Supervisor loading step.

---

### Phase 4 — Post Invoice + Customer Payment
**Goal:** CA posts invoice (front-end only); customer pays FULL or PARTIAL.

Tasks:
1. Add `invoice_events` + `payment_events` tables.
2. Endpoint: `POST /invoices/post` (CA, blocks if review queue OPEN).
3. Endpoint: `GET /invoices/posted` (CA — includes payment history).
4. Endpoint: `GET /invoices/my` (CR).
5. Endpoint: `POST /invoices/:id/pay` (CR — FULL or PARTIAL, idempotent guard).
6. Frontend: CA `AdminInvoices.tsx` — add "Post Invoice" tab; PARKED tab shows payment history after customer pays.
7. Frontend: `CustomerDashboard.tsx` — payment panel (only visible when PARKED).
8. Remove `TransporterInvoices.tsx`, TA invoice nav item, TA miro routes.

**Acceptance Criteria:**
- [ ] CA sees "Post Invoice" tab with APPROVED trips ready.
- [ ] CA posts invoice → `invoice_events` row created (PARKED).
- [ ] Customer sees "Pay Now" panel with invoice total.
- [ ] Customer pays PARTIAL → balance shown correctly.
- [ ] Customer pays remaining → status PAID_FULL.
- [ ] CA payment history only visible after customer has made at least one payment.
- [ ] Post Invoice blocked when review queue has OPEN item (409 returned).
- [ ] `/transporter/invoices` route returns 404.
- [ ] No TA payment UI in sidebar or dashboard.

---

### Phase 5 — Cleanup & Stabilise
**Goal:** Remove all deprecated tables and dead code; full regression pass.

Tasks:
1. Drop deprecated tables: `contracts`, `purchase_orders`, `job_configs`, `job_config_pos`, `miro_invoices`, `main_invoices`, `delivery_invoices`.
2. Remove all remaining references to these tables in `api_v3.ts`.
3. Remove `ConsolidatedContractPoForm.tsx`, `ContractPoSelector.tsx`, `ContractPoContext.tsx`.
4. Remove `syncS21ContractsAndPOs` function and `POST /sync/s21` route.
5. Update `demo/reset` to wipe new tables (not old ones).
6. Update seed data (remove contract/PO rows, add SO rows).
7. Full regression test run.
8. Deploy to CF.

**Acceptance Criteria:**
- [ ] No references to `contracts`, `purchase_orders`, `job_configs`, `miro_invoices` in any live route.
- [ ] Demo reset works cleanly.
- [ ] All POC test cases (TC-01 to TC-04) pass end-to-end.
- [ ] Zero TypeScript compiler errors.
- [ ] CF deployment succeeds.

---

## 13. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | SAP S/4HANA OData endpoint URL / client / credentials not available before Phase 1 starts | High | Phase 1 blocker | Use mock SAP adapter (`MockSAPAdapter.ts`) for dev; switch to live on credential receipt |
| R-02 | SAP `API_SALES_ORDER_SRV` not activated on the S/4HANA tenant | Medium | Phase 1 blocker | Verify with SAP BASIS team; alternative: activate via SE80/SOAMANAGER |
| R-03 | SQLite `ALTER TABLE` cannot change CHECK constraints → role table rebuild needed | Medium | Migration risk | Use migration script with RENAME/COPY/DROP pattern; test in local before CF deploy |
| R-04 | Existing `transport_assignments` rows with old statuses (`MIRO_PARKED`, `MIRO_POSTED`) break after status CHECK change | High | Data corruption | Migration: update all `MIRO_PARKED` → `INVOICED`, `MIRO_POSTED` → `INVOICED` before changing constraint |
| R-05 | Staging loop could create infinite STAGING_EXCEPTION cycles | Low | UX issue | No hard limit (per spec), but add a "stuck trip" alert after 3+ exceptions |
| R-06 | Customer payment endpoint (`/invoices/:id/pay`) accessible before PARKED | Low | Business rule violation | Backend guard: check `invoice_events.status = 'PARKED'` before accepting payment |
| R-07 | BTP Destination Service not bound to CF app | Medium | Phase 1 SAP auth fail | Fallback to env vars (`SAP_HOST` etc.) always available |
| R-08 | Removing TA invoice routes breaks existing Joule agent workflows | Low | Joule regression | Joule capability already removed from `sap_digital_assistant`; no active Joule calls depend on TA invoice routes |

---

## 14. Open Questions

> Answers needed before the corresponding phase starts. Flag any that are blockers.

| # | Question | Needed For | Owner |
|---|---|---|---|
| OQ-01 | **SAP S/4HANA host URL, client number, and credentials** (basic auth / OAuth / X-CSRF) — never to be committed | Phase 1 | Varad / Rahul |
| OQ-02 | **BTP Destination name** for SAP S/4HANA connection (if using BTP Destination Service) | Phase 1 | Varad |
| OQ-03 | **`API_SALES_ORDER_SRV` activated?** Which SAP system (DEV, QA, PROD)? | Phase 1 | SAP BASIS |
| OQ-04 | **Invoice numbering**: confirm that PODZO-generated invoice numbers (`PODZO-INV-YYYYMMDD-NNN`) are acceptable. Are they ever shared with SAP in a future phase? | Phase 4 | Business / Varad |
| OQ-05 | **Notifications**: in-app only, or should email/SMS also be sent (e.g., customer payment due, staging exception)? If yes, which provider (SendGrid, Twilio, SAP BTP Alert Notification)? | Phase 4 | Varad |
| OQ-06 | **Waybill format / sequence**: confirm `WB-<SO_NO>-<assignment_id>-<YYYYMMDD>` is acceptable, or should it follow a specific numbering series? | Phase 3 | Business |
| OQ-07 | **Tolerance per SO item**: is the default 0.5% acceptable for all materials, or should it be configurable per SO item (from SAP)? | Phase 4 | Business |
| OQ-08 | **Staging role access**: should `SA` be able to see weight logs (MINE_TARE / MINE_GROSS) or only line item comparison? | Phase 3 | Business |
| OQ-09 | **Multiple trips per SO**: is it expected that one SO may generate multiple trips (e.g., partial delivery across multiple vehicles)? If yes, `so_distributions` needs to allow multiple assignments per SO. | Phase 2 | Business |
| OQ-10 | **Existing live data**: are there any active `transport_assignments` rows in the CF production DB that must not be disrupted during Phase 1–3 migrations? | Phase 1 | Varad |
| OQ-11 | **Demo reset**: should demo reset clear `sales_orders` (like it currently preserves contracts), or always re-fetch from SAP? | Phase 5 | Varad |
| OQ-12 | **Customer user creation**: currently `CR` users are manually seeded. Will customers self-register or will CA create them? | Phase 4 | Business |

---

*Plan authored: 2026-10-08. Awaiting user approval before any code is written or changed.*
