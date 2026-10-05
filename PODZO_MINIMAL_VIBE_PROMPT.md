# BULK LOGISTICS & POD-TO-PAYMENT PORTAL — MASTER BUILD PROMPT

> **Instructions for AI Builder:**
> Build a fully functional, working web application for bulk material logistics and POD (Proof of Delivery) tracking.
> Focus on getting the **end-to-end workflow working cleanly**.
> Do not ask questions. Build everything in one go.
> Tech stack: **React + TypeScript frontend, Express + Node.js backend, SQLite database.**

---

## 1. PROJECT OVERVIEW & GOAL

Build a web portal for a bulk freight logistics operation (moving coal/minerals from mines to customers via trucks).

**The Problem Solved:** Paper delivery slips cause payment delays and unrecorded transit losses (stolen or short-loaded materials).
**The Solution:** A digital workflow tracking every truck trip from mine dispatch gate to customer receiving yard, auto-reconciling weights, verifying delivery proofs, and processing freight invoices.

---

## 2. THE 7-STEP WORKFLOW

```
1. CONTRACT & PO SETUP
   Admin creates Contracts with Customers → Purchase Orders (POs) specifying target tonnage, rate per tonne, and loss tolerance %.

2. JOB ASSIGNMENT
   Admin assigns a PO to a Transporter → Transporter accepts, assigns Driver & Vehicle, inputs E-signature and Waybill/Bilty document.

3. MINE DISPATCH (Supervisor)
   Mine Supervisor checks truck → records Mine Tare (empty weight) → truck loads → records Mine Gross (loaded weight) → generates Departure OTP.

4. TRANSIT (Driver Mobile)
   Driver enters Departure OTP → sets status to EN_ROUTE → sets status to ARRIVED at customer.

5. CUSTOMER RECEIVING (Customer Gate)
   Customer Gate records Dest Gross (arrived loaded) → truck offloads → records Dest Tare (empty weight) → system checks weight loss vs tolerance → Customer generates Delivery OTP.

6. POD UPLOAD & REVIEW
   Driver uploads stamped Proof of Delivery (POD) slip → System simulates OCR confidence check → Auto-approves or flags for Admin Review Queue.

7. INVOICING & PAYMENT
   Admin generates freight invoice based on actual net delivered weight × rate → advances invoice status: PARKED → POSTED → CLEARED.
```

---

## 3. THE 5 USER ROLES

1. **CA — Company Admin:** Full system management, contracts, POs, review queue, invoicing, main dashboard.
2. **TA — Transporter Admin:** Accepts jobs, assigns drivers and trucks, uploads waybills, views invoice status.
3. **SR — Supervisor (Mine Siding Gate):** Safety checks, records Mine Tare & Gross weights, generates departure OTPs.
4. **DR — Driver (Mobile View):** Views current trip, enters departure OTP, updates transit milestones, uploads POD photo.
5. **CR — Customer Gate Operator:** Records Dest Gross & Tare weights, confirms delivery, generates delivery OTP.

---

## 4. DATA MODEL (ENTITIES)

- **Users:** username, password (bcrypt), role (CA/TA/SR/DR/CR), display_name
- **Customers:** name, code, location
- **Transporters:** name, tax_id
- **Drivers:** name, license_no, phone, transporter_id
- **Vehicles:** reg_no, capacity_tonnes, transporter_id
- **Contracts:** contract_no, customer_id, start_date, end_date, status (ACTIVE/EXPIRED)
- **Purchase Orders:** po_no, contract_id, material, target_qty, rate_per_tonne, tolerance_pct, status (OPEN/COMPLETED)
- **Job Configs:** po_id, transporter_id, scheduled_date, status
- **Transport Assignments (Trips):** job_id, driver_id, vehicle_id, scheduled_date, status:
  `ASSIGNED` → `MINE_TARE_LOGGED` → `MINE_GROSS_LOGGED` → `DISPATCHED` → `EN_ROUTE` → `ARRIVED` → `DELIVERED` → `POD_UPLOADED` → `UNDER_REVIEW` → `APPROVED` → `INVOICED` → `MIRO_PARKED` → `MIRO_POSTED` → `CLEARED`
- **Weight Logs:** assignment_id, stage (`MINE_TARE`, `MINE_GROSS`, `DEST_GROSS`, `DEST_TARE`), weight_kg, logged_at
- **Weight Reconciliations:** assignment_id, net_dispatch_kg, net_received_kg, loss_kg, loss_pct, pass_bool
- **Bilty Uploads:** assignment_id, waybill_no, file_url
- **POD Documents:** assignment_id, file_url, confidence_score, match_status
- **Review Queue:** assignment_id, reason (`TOLERANCE_EXCEEDED`, `OCR_MISMATCH`, `AWAITING_VERIFY`), status (`OPEN`, `RESOLVED`), notes
- **Invoices:** assignment_id, delivered_tonnes, rate, total_amount, status (`DRAFT`, `PARKED`, `POSTED`, `CLEARED`)

---

## 5. KEY BUSINESS RULES & FORMULAS

- **Net Dispatch** = Mine Gross - Mine Tare
- **Net Received** = Dest Gross - Dest Tare
- **Transit Loss** = Net Dispatch - Net Received
- **Loss %** = (Transit Loss / Net Dispatch) × 100
- **Tolerance Check:** If Loss % > PO Tolerance %, flag as `TOLERANCE_EXCEEDED` and place in Review Queue.
- **Invoice Calculation:** Total Amount = (Net Received Tonnes) × Rate per Tonne (rounded to 2 decimals).
- **Weight Sequence Enforcement:** Must record in order: `MINE_TARE` → `MINE_GROSS` → `DEST_GROSS` → `DEST_TARE`. Reject out-of-order entries.
- **Gross > Tare:** Gross weight must always exceed Tare weight at the same location.
- **OTP Logic:** 6-digit random code, valid 30 mins, max 3 retries.
- **OCR Simulation:** Generate random score (55-99%). Score ≥ 90% → Auto-Approve; Score < 90% → Send to Review Queue.

---

## 6. SCREEN SPECIFICATION (MINIMAL)

### Public Screens
- **`/` (Landing Page):** Simple title, brief description, "Go to Login" button.
- **`/login` (Login Page):** Username/password form + **5 Quick Demo Login buttons** (one for each role: `ca_admin`, `ta_admin`, `sr_gate`, `dr_driver`, `cr_gate` — password `Demo@1234`).

### CA — Company Admin Screens
- **`/dashboard`:** KPI summary cards (Active Trips, Pending Reviews, Total Invoiced) + recent trips table.
- **`/contracts`:** List of contracts & POs + "Create Contract/PO" modals.
- **`/approvals`:** Review Queue list + modal to inspect POD/weights and click "Resolve / Approve".
- **`/invoices`:** Invoices list + buttons to advance status (`PARKED` → `POSTED` → `CLEARED`).

### TA — Transporter Admin Screens
- **`/ta/dashboard`:** Pending jobs list + active trips status.
- **`/ta/purchase-orders`:** Job acceptance screen + modal to assign Driver, Vehicle, signature, waybill.
- **`/ta/pods`:** Upload POD page for completed deliveries.

### SR — Supervisor Screen
- **`/sr/dashboard`:** Mine gate queue table → Action panel for expected trip: (1) Safety Checkboxes → (2) Enter Mine Tare → (3) Enter Mine Gross → (4) Click "Generate OTP & Authorize Dispatch".

### DR — Driver Screen (Mobile Layout)
- **`/dr/dashboard`:** Single-column mobile view showing current trip status + **ONE big action button** based on state (Enter Departure OTP → Log En Route → Log Arrived → Upload POD photo).

### CR — Customer Gate Screen
- **`/cr/dashboard`:** Incoming trucks list → Action panel: (1) Enter Dest Gross → (2) Enter Dest Tare → (3) View Loss % Pass/Fail → (4) Click "Confirm Delivery & Generate Delivery OTP".

---

## 7. DEMO SEED DATA

Pre-populate on first run:
- **5 Users** (password `Demo@1234` for all):
  - `ca_admin` (CA)
  - `ta_admin` (TA)
  - `sr_gate` (SR)
  - `dr_driver` (DR)
  - `cr_gate` (CR)
- **1 Customer**, **1 Transporter**, **2 Drivers**, **2 Vehicles**
- **2 Contracts** & **3 Purchase Orders**
- **Trips pre-seeded in multiple workflow states** (`ASSIGNED`, `DISPATCHED`, `DELIVERED`, `UNDER_REVIEW`, `APPROVED`, `CLEARED`) so every screen displays data immediately.

---

## 8. DESIGN & TECH STACK

- **Frontend:** React 19 + TypeScript + React Router v7 + Lucide Icons + Vite (port 5173).
- **Backend:** Express 5 + SQLite (`better-sqlite3`, WAL mode) + JWT Auth + Multer file uploads (port 3001).
- **Styling:** Industrial dark theme (`#0A192F` background, `#1E293B` cards, `#FF5B00` primary orange accent, `#10B981` success green, `#EF4444` danger red).
- **Status Badges:** Color-coded status pills on all tables.

---

## 9. DEFINITION OF DONE

1. `npm install && npm run server` starts API on port 3001.
2. `npm run dev` starts UI on port 5173.
3. Quick Login buttons work for all 5 roles.
4. Complete 7-step flow runs end-to-end without crashing.
5. Weight calculation and sequence validation work correctly.
6. Zero TypeScript build errors.
