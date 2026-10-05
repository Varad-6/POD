# PODZO — COMPLETE PROJECT BUILD PROMPT

> **Instructions for the AI reading this:**
> You are about to build a real, working web application called **PODZO** from scratch.
> This is a vibe-coding session — build the entire app in one go.
> Do not ask questions. Every decision you need is answered in this document.
> Build it working first, beautiful second. The flow must work end-to-end.
> Use: **React + TypeScript frontend, Express + Node.js backend, SQLite database.**

---

## WHAT IS PODZO?

PODZO is a **logistics operations web portal** for a mining company called **Ikwezi Mining Limited**.

They transport bulk materials (coal, minerals) from mine sites to customers like power stations and factories using trucks. Right now everything is done on paper — delivery slips, manual weighing, paper invoices. This causes delays of 30–90 days and nobody catches when materials go missing in transit.

PODZO replaces all of that with a digital system where:
- Every truck trip is tracked from mine gate to customer gate
- Weights are recorded digitally at 4 checkpoints (going out empty, going out loaded, arriving loaded, leaving empty)
- Delivery proof (a photo of a stamped slip) is uploaded and reviewed
- Invoices are automatically generated based on actual delivered weight
- Everything connects back to SAP (the company's accounting system) for final payment

---

## THE BUSINESS FLOW — 7 STEPS

This is the heart of the application. Every feature exists to support this flow:

```
STEP 1: SETUP
  Company Admin creates Contracts with Customers
  → Under each Contract, creates Purchase Orders (POs)
  → Each PO says: "deliver X tonnes of coal to Customer Y at R Z per tonne"
  → A PO has a tolerance % (how much weight loss is acceptable in transit)

STEP 2: ASSIGNING THE JOB
  Company Admin creates a "Job" linking a PO to a Transporter company
  → Transporter Admin sees the job, accepts it
  → Transporter assigns a Driver and a specific Truck to the job
  → Driver signs digitally (e-signature on screen)
  → A "Bilty" (delivery waybill document) is uploaded — this is the trip's ID document

STEP 3: LEAVING THE MINE (Supervisor does this)
  Weighbridge Supervisor at the mine gate:
  → Does a safety check (driver license OK? truck OK? documents OK?)
  → Records the EMPTY truck weight = "Mine Tare Weight"
  → Truck gets loaded with coal
  → Records the LOADED truck weight = "Mine Gross Weight"
  → Net material dispatched = Mine Gross - Mine Tare
  → Gives the driver a 6-digit OTP code to prove the driver was authorized to leave
  → Driver enters the OTP on their phone to confirm departure

STEP 4: TRANSIT (Driver does this from their phone/mobile browser)
  Driver:
  → Confirms they have left the mine (enters OTP)
  → Logs "I am on the way" (EN_ROUTE)
  → Logs "I have arrived at the destination" (ARRIVED)

STEP 5: ARRIVING AT CUSTOMER (Customer Gate Operator does this)
  At the customer's receiving yard:
  → Records the LOADED truck weight = "Destination Gross Weight"
  → Truck offloads the coal
  → Records the EMPTY truck weight = "Destination Tare Weight"
  → Net material received = Dest Gross - Dest Tare
  → System auto-calculates: did weight match? Is loss within tolerance?
  → Customer stamps the physical delivery slip (POD = Proof of Delivery)
  → Generates a final OTP to confirm delivery

STEP 6: POD UPLOAD & VERIFICATION (Driver or Transporter uploads)
  → Driver uploads a photo of the stamped delivery slip (the POD document)
  → Company Admin reviews it:
    - Does the waybill number on the slip match the trip?
    - Does the weight written on the slip match what was recorded?
    - System gives a "confidence score" for the match
    - If everything matches: AUTO-APPROVE
    - If something looks off: goes into a REVIEW QUEUE for manual check
    - Admin can resolve review items with notes

STEP 7: INVOICE & PAYMENT (Company Admin does this)
  → Once delivery is approved, system generates a freight invoice
  → Invoice = (actual tonnes delivered) × (agreed rate per tonne)
  → Invoice goes through 3 stages: PARKED → POSTED → CLEARED
  → These stages mirror what happens in SAP (the accounting system)
  → When CLEARED, the transporter gets paid
```

---

## THE 5 USER ROLES

There are exactly 5 types of users. Each one sees a completely different part of the app. Role is set when the user is created and never changes.

### Role 1: CA — Company Admin (Ikwezi Mining staff)
**They manage everything.** They are the boss of the system.

What they can do:
- Create and manage Contracts with Customers
- Create Purchase Orders under contracts
- Create Jobs and assign to Transporters
- See ALL trips from all transporters
- Review the POD verification queue
- Approve or reject deliveries
- Generate freight invoices
- Push invoices through PARKED → POSTED → CLEARED in SAP
- Reset demo data
- See a main dashboard with KPIs

**Their main screens:**
- Dashboard (KPIs: active trips, pending reviews, total invoiced this month, overdue approvals)
- Contracts list and detail
- Purchase Orders management
- Review Queue (pending POD approvals)
- Invoice Management
- SAP MIRO (invoice posting status)

---

### Role 2: TA — Transporter Admin (Logistics company staff)
**They manage their company's drivers and trucks.**

What they can do:
- See only jobs assigned to their transporter company
- Accept or decline job assignments
- Assign a specific driver and truck to each job
- Upload the bilty (waybill) document
- Track all their active trips
- See their own invoices and payment status

**Their main screens:**
- Dashboard (their trips: pending, active, delivered, invoiced)
- Purchase Orders / Jobs (accept, assign drivers)
- Active Trips tracking
- POD documents list
- Their invoices

---

### Role 3: SR — Supervisor (Mine Siding Gate Operator)
**They control the mine exit gate.**

What they can do:
- See trucks that are expected at the gate today
- Do the safety checklist for each truck
- Enter the Mine Tare Weight (empty truck)
- Enter the Mine Gross Weight (loaded truck)
- Generate the departure OTP for the driver
- Authorize the truck to leave

**Their main screen:**
- Single dashboard showing today's expected trucks, with action buttons for each step

---

### Role 4: DR — Driver (Truck Driver)
**They use this on their phone while driving.**

What they can do:
- See their current trip details
- Enter the OTP they received from the supervisor to confirm departure
- Log that they are en route
- Log that they have arrived at the destination
- Upload a photo of the stamped delivery slip (POD)

**Their main screen:**
- Mobile-optimized single page showing their current trip status and the next action they need to take (big buttons, simple)

---

### Role 5: CR — Customer Gate Operator (Customer's receiving yard staff)
**They manage the receiving end.**

What they can do:
- See deliveries expected at their site
- Enter Destination Gross Weight (truck arrives loaded)
- Enter Destination Tare Weight (truck leaves empty)
- Confirm the delivery
- Generate the final delivery OTP

**Their main screen:**
- Single dashboard showing incoming deliveries with weight entry forms

---

## DATA MODEL — WHAT TO STORE (plain English, no SQL needed)

Build the database based on these entities and their relationships. You decide the exact table structures, column names, and data types — just make sure all the relationships and rules below work.

### Entities:

**Users**
- username, password (bcrypt hashed), role (CA/TA/SR/DR/CR), display name, email, phone
- A user belongs to either a transporter company (for TA/DR roles) or a customer (for CR role)

**Customers** (the companies that receive the coal)
- Company name, SAP customer number, location (address, GPS coordinates)

**Transporters** (the trucking companies)
- Company name, GSTIN (tax number)

**Drivers** (belong to a Transporter)
- Name, license number, license expiry date, PRDP (professional driving permit) expiry, phone
- Must belong to a Transporter

**Vehicles/Trucks** (belong to a Transporter)
- Registration number, capacity in tonnes
- Must belong to a Transporter

**Contracts** (between Ikwezi Mining and a Customer)
- SAP contract number, which customer, start date, end date, status (ACTIVE/EXPIRED/TERMINATED)
- A contract can have many Purchase Orders

**Purchase Orders** (under a Contract)
- SAP PO number, which contract, material type (e.g. "Steam Coal"), unit (tonnes), target quantity, rate per tonne (in ZAR), tolerance percentage (0-10%)
- Status: OPEN / ASSIGNED / IN_PROGRESS / COMPLETED / CANCELLED

**Jobs / Job Configurations** (created by CA, links a PO to a Transporter)
- Which PO, which transporter, pickup date/time window, deadline
- Status: PENDING / ASSIGNED / EXPIRED

**Trip / Transport Assignment** (the actual truck trip — one per job, after TA assigns driver+truck)
- Which job, which driver, which vehicle
- Licence number, scheduled date, assigned quantity (tonnes)
- Status: ASSIGNED → MINE_TARE_LOGGED → MINE_GROSS_LOGGED → DISPATCHED → EN_ROUTE → ARRIVED → DELIVERED → POD_UPLOADED → UNDER_REVIEW → APPROVED → INVOICED → MIRO_PARKED → MIRO_POSTED → CLEARED
- Also: GATE_DENIED (if turned away at the gate)

**Weight Records** (4 per trip)
- Which trip, which stage (MINE_TARE / MINE_GROSS / DEST_GROSS / DEST_TARE), weight in kg, timestamp

**Weight Reconciliation** (auto-calculated after all 4 weights are recorded)
- Net dispatched (kg), net received (kg), loss (kg), loss percentage, whether within tolerance
- Status: WITHIN_TOLERANCE / OUTSIDE_TOLERANCE

**Supervisor Safety Check** (done at mine gate)
- Which trip, was weight document checked, was bilty checked, was material checked, was license checked, who checked it, date+time

**Bilty Upload** (the waybill document)
- Which trip, bilty number, bilty date, uploaded file URL

**OTP Verifications** (2 per trip: departure OTP and delivery OTP)
- Which trip, stage (PICKUP/DELIVERY), 6-digit code, when generated, when verified, who verified
- Status: PENDING / VERIFIED / EXPIRED

**Transit Events** (logged by driver during the trip)
- Which trip, event type (DISPATCHED/EN_ROUTE/ARRIVED), GPS lat/lng, timestamp

**POD Document** (proof of delivery — the stamped slip photo)
- Which trip, file URL, extracted waybill number (from OCR simulation), extracted weight, confidence score (0-100), match status (MATCH/MISMATCH/PENDING)

**Review Queue** (items that need CA attention)
- Which trip, reason (OCR_MISMATCH / TOLERANCE_EXCEEDED / AWAITING_CA_VERIFY), status (OPEN/RESOLVED), resolution notes
- Whether this blocks invoice generation

**Delivery Invoice** (freight invoice)
- Which trip, payload delivered (tonnes), rate per tonne, total value (ZAR), invoice number, status

**MIRO Invoice** (SAP payment record)
- Which delivery invoice, SAP invoice number, status (PARKED/POSTED/CLEARED), dates

**SAP Sync Log** (audit trail for SAP communication)
- Entity type, reference, direction (IN/OUT), what was sent/received, timestamp

---

## WEIGHT CALCULATION RULES (the system must enforce these)

```
net_dispatched = Mine Gross Weight - Mine Tare Weight
net_received   = Dest Gross Weight - Dest Tare Weight
transit_loss   = net_dispatched - net_received
loss_percent   = (transit_loss / net_dispatched) × 100

If loss_percent > tolerance_percent from the PO:
  → Flag as OUTSIDE_TOLERANCE
  → Create a Review Queue item with reason = TOLERANCE_EXCEEDED

Invoice amount = ROUND(net_received_in_tonnes × rate_per_tonne, 2) in ZAR

Weight stages MUST happen in order:
  1. MINE_TARE (truck must be ASSIGNED)
  2. MINE_GROSS (MINE_TARE must already be recorded)
  3. DEST_GROSS (driver must have confirmed ARRIVED)
  4. DEST_TARE (DEST_GROSS must already be recorded)

Gross weight MUST always be greater than Tare weight.
Any attempt to record a stage out of order → reject with clear error message.
```

---

## OCR SIMULATION (no real OCR needed — simulate it)

When a POD image is uploaded and the CA clicks "Run Verification":

Simulate the OCR process:
1. Generate a confidence score — use a random number between 55 and 99
2. If confidence >= 90: pretend the waybill number and weight were correctly extracted and match → set match_status = MATCH → auto-approve the delivery
3. If confidence >= 70 but < 90: partially extracted → set match_status = PENDING → create Review Queue item with reason = AWAITING_CA_VERIFY
4. If confidence < 70: extraction failed or mismatch → set match_status = MISMATCH → create Review Queue item with reason = OCR_MISMATCH

Return the confidence score and result to the UI so the CA can see what happened.

---

## SAP INTEGRATION (simplified)

The app has a simplified SAP integration:

**SAP Sync (importing data):**
- There is a button "Sync from SAP" on the Contracts screen
- When clicked, it calls a backend endpoint which EITHER:
  - Calls the real SAP OData API at the URL configured in `.env` (VITE_SAP_S21_BASE_URL)
  - OR if that env var is empty or SAP is unreachable, returns mock/demo data (a few hardcoded contracts and POs)
- The fetched contracts and POs are saved to the local database

**SAP MIRO (invoice posting):**
- When CA clicks PARK / POST / CLEAR on an invoice:
  - Update the local database status
  - Attempt to call SAP (if configured)
  - If SAP call fails or isn't configured, that's fine — just update local DB and log it
  - Never block the user because SAP is down

**Environment variable to control:**
```
VITE_SAP_USE_MOCK=true    # true = always use mock data, false = try real SAP first
VITE_SAP_S21_BASE_URL=    # leave empty for demo mode
```

---

## OTP RULES

- OTP is a random 6-digit number (000000 to 999999, zero-padded)
- Valid for 30 minutes from generation
- If wrong code entered: allow max 3 attempts, then auto-generate a new OTP
- Once verified, cannot be reused
- There are 2 OTPs per trip: one for departure (Supervisor generates, Driver enters) and one for delivery confirmation (Customer generates, Driver confirms)

---

## TECH STACK — BUILD WITH THIS EXACTLY

**Frontend:**
- React 19 with TypeScript
- React Router v7 for routing
- Vite as the build tool
- Lucide React for icons
- No CSS framework — write your own CSS with custom properties (variables)
- Runs on port 5173

**Backend:**
- Express.js v5 with TypeScript
- better-sqlite3 for the database (SQLite, WAL mode enabled)
- JWT (jsonwebtoken) for authentication — tokens expire in 8 hours
- bcryptjs for password hashing (cost factor 10)
- multer for file uploads
- cors middleware
- tsx to run TypeScript directly
- Runs on port 3001

**Project structure:**
```
podzo/
├── server/
│   ├── index.ts          (Express entry point)
│   ├── middleware/
│   │   └── auth.ts       (JWT verification + role checking)
│   ├── db/
│   │   ├── database.ts   (SQLite connection setup, WAL mode, init schema)
│   │   ├── schema.ts     (runs CREATE TABLE statements on startup)
│   │   └── seed.ts       (inserts demo data if DB is empty)
│   └── routes/
│       ├── auth.ts       (login/me endpoints)
│       └── api.ts        (all business endpoints)
├── src/
│   ├── main.tsx          (React entry)
│   ├── App.tsx           (Router + auth guard)
│   ├── lib/
│   │   └── api.ts        (fetch wrapper for all API calls)
│   ├── context/
│   │   └── AuthContext.tsx (user + token state, login/logout)
│   ├── components/       (reusable UI components)
│   ├── views/            (one file per role dashboard)
│   └── styles/
│       └── globals.css   (CSS custom properties + base styles)
├── public/
│   └── uploads/          (uploaded files stored here)
├── .env.example
├── package.json
└── vite.config.ts        (proxies /api/* to localhost:3001)
```

**package.json scripts:**
```json
{
  "dev": "vite",
  "server": "tsx server/index.ts",
  "build": "tsc -b && vite build",
  "test": "vitest run"
}
```

**vite.config.ts must proxy:**
- `/api` → `http://localhost:3001`

**.env.example:**
```
PORT=3001
JWT_SECRET=podzo_dev_secret_change_this
JWT_EXPIRY=8h
VITE_SAP_USE_MOCK=true
VITE_SAP_S21_BASE_URL=
VITE_APP_TITLE=PODZO Portal
```

---

## DESIGN & UI STYLE

The app has a dark industrial theme. Think enterprise ops software, not a startup landing page.

**Color palette (use CSS variables):**
```css
:root {
  --bg-primary: #0A192F;
  --bg-secondary: #1E293B;
  --bg-surface: #243447;
  --accent-orange: #FF5B00;
  --accent-blue: #2563EB;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --border: #334155;
  --radius: 8px;
  --shadow: 0 2px 8px rgba(0,0,0,0.4);
}
```

**Layout:**
- Logged-in layout: fixed sidebar on the left (220px wide) + top bar + main content area
- Driver view: NO sidebar — mobile-first layout with large tap targets, bottom navigation
- Top bar shows: app logo (PODZO), current user name + role badge, logout button
- Sidebar shows navigation links relevant to the current role only

**Status badges:** Every status value gets a colour-coded pill badge:
- ASSIGNED, OPEN, PENDING → gray
- DISPATCHED, EN_ROUTE → blue
- ARRIVED, DELIVERED → teal
- APPROVED, WITHIN_TOLERANCE, VERIFIED → green
- UNDER_REVIEW, AWAITING_CA_VERIFY → amber
- MIRO_PARKED → purple
- MIRO_POSTED → indigo
- MIRO_CLEARED, CLEARED, COMPLETED → dark green
- REJECTED, GATE_DENIED, MISMATCH, OUTSIDE_TOLERANCE → red
- EXPIRED → gray-red

**Reusable components to build:**
- `StatusBadge` — colour pill per status string
- `DataTable` — columns config + data array, empty state handling
- `Modal` — overlay dialog
- `Button` — variants: primary (orange), secondary (blue outline), danger (red), ghost
- `Card` — surface container with border and shadow
- `KPICard` — big number + icon + label
- `LoadingSpinner` — centered spinner
- `Toast` — auto-dismissing notification (4 seconds)
- `FileUploadBox` — drag-and-drop upload with type/size validation
- `SignaturePad` — HTML5 canvas, Clear + Save buttons
- `WeightCard` — shows all 4 weights + net dispatch + net received + loss % + pass/fail badge

---

## SCREENS TO BUILD — DETAILED

### PUBLIC SCREENS

**Landing Page `/`**
- Hero with PODZO name, tagline "Let's make delivery simple."
- Brief description (2-3 lines)
- "Login" button → /login

**Login Page `/login`**
- Username + password fields
- Login button
- Error message if wrong credentials
- After login redirect by role: CA→/dashboard, TA→/ta/dashboard, SR→/sr/dashboard, DR→/dr/dashboard, CR→/cr/dashboard
- 5 "Quick Login" demo buttons (one per role) — pre-fill and auto-submit for easy demo

---

### CA SCREENS

**Dashboard `/dashboard`**
- 4 KPI cards: Active Trips, Pending Reviews, Invoiced This Month, Trips Completed Today
- Table of last 10 trips: Trip ID, Driver, Truck, Status, Net Received, Action

**Contracts `/contracts`**
- Table: SAP Contract No, Customer, Start Date, End Date, Status, PO Count
- Filter by status
- "Create Contract" → modal form
- "Sync from SAP" button → imports contracts from SAP (or mock)
- Click row → Contract Detail

**Contract Detail `/contracts/:id`**
- Contract info header
- PO table: PO No, Material, Target Qty, Rate, Tolerance %, Status, Remaining Qty
- "Create PO" button → modal
- "Create Job" next to each OPEN PO → job creation modal (pick transporter, set dates)

**Review Queue `/approvals`**
- Table: Trip ID, Driver, Reason, Status, Created Date
- Filter by reason + status
- "View Details" → show weights, POD image, OCR result
- "Run OCR" button → triggers simulation, shows confidence score
- "Resolve" → modal with notes + approve/reject

**Invoice Management `/invoices`**
- Table: Invoice No, Trip ID, Transporter, Tonnes, Rate, Total ZAR, Status
- "Generate Invoice" for APPROVED trips without invoice
- View MIRO status

**MIRO Posting `/miro`**
- Table: Invoice, MIRO Status, Amount
- "Post to SAP" (PARKED → POSTED)
- "Mark Cleared" (POSTED → CLEARED)

---

### TA SCREENS

**Dashboard `/ta/dashboard`**
- KPIs: Pending Jobs, Active Trips, Delivered, Invoiced
- Recent trips table

**Jobs `/ta/purchase-orders`**
- Table of assigned jobs: PO No, Material, Qty, Customer, Deadline, Status
- PENDING: "Accept" + "Decline"
- ASSIGNED: "Assign Driver & Truck" modal → driver dropdown + vehicle dropdown + date + qty → then e-signature pad → then bilty upload

**POD Tracking `/ta/pods`**
- Trips needing POD upload (DELIVERED status)
- "Upload POD" file upload modal

**Invoices `/ta/invoices`**
- View-only invoice list with MIRO payment status

---

### SR SCREEN

**Supervisor Dashboard `/sr/dashboard`**
- Table of expected trucks (ASSIGNED or MINE_TARE_LOGGED status)
- Per-trip action accordion:
  - Step 1: Safety Check (4 checkboxes) → "Save"
  - Step 2: Mine Tare Weight input → "Record"
  - Step 3: Mine Gross Weight input → "Record" + show net dispatch
  - Step 4: "Generate OTP & Authorize Departure" → show 6-digit OTP large on screen

---

### DR SCREEN (MOBILE FIRST)

**Driver Dashboard `/dr/dashboard`**
- No sidebar, mobile layout
- Shows current trip status (large heading)
- ONE primary action button per state:
  - DISPATCHED → OTP entry (6 digit inputs) + Confirm
  - EN_ROUTE → "Log Arrival at Destination"
  - ARRIVED → "Waiting for customer weighing..." (no action)
  - DELIVERED → "Upload POD" file picker
  - POD_UPLOADED → "Submitted — awaiting approval"
  - APPROVED → "Delivery complete!"
  - CLEARED → "Payment cleared. Trip done."
- Trip details below: ID, material, customer, tonnage
- Bottom nav: Trip | History | Profile

---

### CR SCREEN

**Customer Dashboard `/cr/dashboard`**
- Table of incoming deliveries for this customer
- For ARRIVED trips: action panel
  - Dest Gross input → "Record"
  - Dest Tare input → "Record"
  - Show: Net Received, Loss %, Pass/Fail badge
  - "Confirm Delivery & Generate OTP" → show 6-digit OTP

---

## DEMO SEED DATA

Auto-load when database is empty on first startup.

**Users (all passwords: `Demo@1234`):**
| Username | Role | Name |
|----------|------|------|
| ca_thandiwe | CA | Thandiwe Dlamini |
| ta_sipho | TA | Sipho Mkhize |
| sr_gate01 | SR | Gate Officer 1 |
| dr_zweli | DR | Zweli Nkosi |
| cr_mining | CR | Eskom Receiving |

**Master data:**
- 2 customers: Eskom Holdings (Johannesburg), Transnet Freight Rail (Durban)
- 2 transporters: Sipho Transport Services, Zulu Freight Solutions
- 2 drivers under Sipho Transport (including dr_zweli)
- 2 vehicles under Sipho Transport: CA 01 GP (34T), CA 02 GP (30T)
- 3 contracts: 2 ACTIVE, 1 EXPIRED
- 3 purchase orders under active contracts

**Pre-seeded trips — one trip in each status so every screen has data:**
ASSIGNED, MINE_TARE_LOGGED, MINE_GROSS_LOGGED, DISPATCHED, EN_ROUTE, ARRIVED, DELIVERED, POD_UPLOADED, UNDER_REVIEW, APPROVED, INVOICED, MIRO_PARKED, MIRO_POSTED, CLEARED

Also seed:
- 1 trip with weight loss > tolerance (review queue item blocking invoice)
- 1 delivery invoice + 1 MIRO invoice at PARKED

---

## VALIDATION RULES

Enforce on both frontend (form) and backend (API).

### Auth
- Username: required, 2–50 chars
- Password: required, min 6 chars
- After 5 wrong attempts: 15-minute lockout message

### Contracts & POs
- SAP number: required, exactly 10 digits
- Start date: required, valid date
- End date: required, after start date
- Rate: > 0
- Target quantity: > 0
- Tolerance: 0 to 10 (percent)
- Cannot create job on EXPIRED or TERMINATED contract
- Cannot over-assign beyond PO target × (1 + tolerance/100)

### Assignments
- Driver must belong to the transporter
- Vehicle must belong to the transporter
- Vehicle capacity ≥ assigned quantity
- Driver license must not be expired
- No double-booking driver or vehicle on same date

### Weights
- Must be > 0 and ≤ 200,000 kg
- Must be a number
- Gross > Tare at same gate
- Sequence: MINE_TARE → MINE_GROSS → DEST_GROSS → DEST_TARE (enforce strictly)
- Cannot re-record an already-saved stage

### Files
- Types: JPEG, PNG, PDF only
- Max 10 MB
- Not empty

### OTP
- Exactly 6 digits
- Within 30 minutes
- Max 3 wrong attempts → regenerate
- Cannot reuse a verified OTP

### Status
- Transitions are one-way and sequential only
- Any skip or backward move → error message

### E-signature
- Canvas must not be empty when saved

---

## API DESIGN

You design the exact routes and response shapes. These are the capabilities required:

**Authentication:** login, get current user
**Contracts:** list, create, get detail, SAP sync trigger
**Purchase Orders:** list, create, get detail
**Jobs:** CA creates, TA lists pending, TA accepts, TA assigns driver+vehicle, e-sign submission, bilty upload
**Weighbridge:** record weight at any stage (MINE_TARE/MINE_GROSS/DEST_GROSS/DEST_TARE), get weight summary for trip
**OTP:** generate (departure or delivery), verify
**Driver:** confirm departure OTP, log transit event (EN_ROUTE/ARRIVED), upload POD
**Review Queue:** list, trigger OCR simulation, resolve with notes
**Invoices:** generate for approved trip, list, park/post/clear MIRO
**Dashboards:** CA KPIs, TA KPIs
**Transporters/Drivers/Vehicles:** list, create (TA only)
**Demo:** reset operational data (CA only — keeps contracts + POs)
**Health:** GET /health → `{ status: "ok" }`

---

## SECURITY

1. JWT required on all routes except login — checked via `Authorization: Bearer <token>` header
2. Role check on every protected endpoint — wrong role → 403
3. Passwords bcrypt-hashed, cost 10
4. Parameterized queries — no SQL string concatenation
5. File MIME type + size checked server-side
6. All string inputs trimmed
7. CORS: allow localhost:5173 only

---

## ERROR HANDLING

**Backend:** always return `{ "message": "..." }` JSON — never HTML error pages.

**HTTP codes:**
- 200 success, 201 created, 400 bad request, 401 unauthenticated, 403 unauthorized, 404 not found, 409 conflict, 413 too large, 500 server error

**Frontend:**
- All API calls in try/catch
- Errors shown as Toast notifications
- Loading spinners during async calls
- Empty states with friendly message + icon when lists are empty

---

## TESTING

### Unit Tests (Vitest — `src/tests/unit/`)

**weight.test.ts:**
- net_dispatch = mine_gross - mine_tare ✓
- net_received = dest_gross - dest_tare ✓
- transit_loss = net_dispatch - net_received ✓
- loss_pct = (loss / dispatch) × 100, 2dp ✓
- loss exactly at tolerance → WITHIN_TOLERANCE ✓
- loss 0.01% over tolerance → OUTSIDE_TOLERANCE ✓
- zero net_dispatch → does not divide by zero (returns 0%) ✓
- invoice_total = ROUND(tonnes × rate, 2) ✓
- negative loss (received > dispatched) → 0% ✓

**otp.test.ts:**
- Generated OTP is exactly 6 digits ✓
- OTP is numeric ✓
- Within 30 min → valid ✓
- Over 30 min → expired ✓
- Verified OTP cannot be used again ✓
- 3 failed attempts → isMaxAttempts = true ✓

**validators.test.ts:**
- Weight 0 → invalid ✓
- Weight -100 → invalid ✓
- Weight 200001 → invalid ✓
- Weight 44500 → valid ✓
- Tolerance 0 → valid ✓
- Tolerance 10 → valid ✓
- Tolerance 10.01 → invalid ✓
- Gross > Tare → valid ✓
- Gross = Tare → invalid ✓
- Gross < Tare → invalid ✓
- "4500001234" (10 digits) → valid SAP number ✓
- "450000123" (9 digits) → invalid SAP number ✓

**ocr.test.ts:**
- Confidence 95 → AUTO_APPROVE ✓
- Confidence 90 → AUTO_APPROVE (boundary) ✓
- Confidence 89 → REVIEW_AWAITING_CA ✓
- Confidence 70 → REVIEW_AWAITING_CA (boundary) ✓
- Confidence 69 → OCR_MISMATCH ✓

### API Tests (Vitest + Supertest — `src/tests/api/`)

**auth.test.ts:**
- Correct credentials → 200 + token ✓
- Wrong password → 401 ✓
- Valid token → GET /me returns user ✓
- No token → 401 ✓
- DR token on CA endpoint → 403 ✓

**weights.test.ts:**
- MINE_TARE on ASSIGNED trip → 200, status = MINE_TARE_LOGGED ✓
- MINE_TARE again same trip → 409 ✓
- MINE_GROSS before MINE_TARE → 409 ✓
- MINE_GROSS after MINE_TARE → 200 ✓
- Gross < Tare → 400 ✓
- Weight = 0 → 400 ✓
- DEST_GROSS before arrival → 409 ✓

**trips.test.ts:**
- Create job as CA → 201 ✓
- TA accepts → 200 ✓
- TA assigns driver from wrong transporter → 403 ✓
- Full trip ASSIGNED → CLEARED: each step → 200 + correct status ✓
- Skip a step → 409 ✓

**invoices.test.ts:**
- Generate invoice for APPROVED → 201 ✓
- Generate for non-APPROVED → 409 ✓
- Generate twice → 409 ✓
- Park → 200, PARKED ✓
- Post (from PARKED) → 200, POSTED ✓
- Clear (from POSTED) → 200, CLEARED ✓
- Clear (from PARKED, skip POST) → 409 ✓

### E2E Test (Playwright — `src/tests/e2e/happy_path.spec.ts`)

1. Open http://localhost:5173
2. Click Quick Login as ca_thandiwe → verify dashboard loads with KPI cards
3. Navigate to Contracts → verify table shows contracts
4. Logout
5. Click Quick Login as ta_sipho → verify TA dashboard loads
6. Logout
7. Click Quick Login as dr_zweli → verify driver dashboard shows trip or "no active trip"

---

## RUNNING THE APP

```bash
npm install
npm run server    # Terminal 1 — backend on port 3001
npm run dev       # Terminal 2 — frontend on port 5173
```

Open http://localhost:5173

---

## DEFINITION OF DONE

- [ ] `npm install` succeeds
- [ ] `npm run server` starts on port 3001
- [ ] `npm run dev` opens app on port 5173
- [ ] All 5 Quick Login buttons work
- [ ] Each role sees only their screens
- [ ] Full 7-step flow works with seeded data
- [ ] Weight sequence enforcement works
- [ ] OTP flow works
- [ ] Invoice calculation correct: tonnes × rate rounded to 2dp
- [ ] File upload works (bilty + POD)
- [ ] Status badges colour-coded
- [ ] Toast notifications on success + error
- [ ] All screens have loading + empty states
- [ ] Unit tests pass (`npm test`)
- [ ] GET /health → `{ status: "ok" }`
- [ ] No TypeScript errors
- [ ] No uncaught console errors on happy paths

---

## FINAL OUTPUT FORMAT

```
BUILD COMPLETE
==============
npm run server  →  http://localhost:3001
npm run dev     →  http://localhost:5173

Demo Credentials (password: Demo@1234)
---------------------------------------
ca_thandiwe  | CA - Company Admin     | /dashboard
ta_sipho     | TA - Transporter Admin | /ta/dashboard
sr_gate01    | SR - Supervisor        | /sr/dashboard
dr_zweli     | DR - Driver            | /dr/dashboard
cr_mining    | CR - Customer Gate     | /cr/dashboard

Tests: npm test
Health: GET http://localhost:3001/health
```
