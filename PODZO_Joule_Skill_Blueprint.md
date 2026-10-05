# PODZO × SAP Joule — Complete Skill Architecture Blueprint
### Senior Systems Engineering & Architecture Document | v1.0.0

---

## 1. Strategic Overview

PODZO's Joule integration transforms Joule from a **generic AI assistant** into a **domain-specific logistics execution copilot** embedded inside SAP Build Work Zone.

Instead of users navigating pages to perform actions, Joule becomes the **universal interface layer** on top of all PODZO operational workflows. Users simply type what they want, and Joule guides them through a structured, API-connected conversation to completion.

> **Guiding Principle**: Joule Skills in PODZO do NOT touch SAP directly. They operate exclusively on PODZO's own REST API backend (`podzone-srv`). SAP integration happens downstream through PODZO's existing S21 adapter layer.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SAP Build Work Zone Shell                       │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                  Joule Floating Copilot UI                  │   │
│   │                (Embedded in Work Zone Header)               │   │
│   └───────────────────────────┬─────────────────────────────────┘   │
│                               │ User Natural Language Prompt        │
│                               ▼                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │               Joule Studio Skill Engine                     │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│   │   │  CA Skills   │  │  TA Skills   │  │  CR Skills   │     │   │
│   │   │  (6 Skills)  │  │  (4 Skills)  │  │  (3 Skills)  │     │   │
│   │   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │   │
│   │          └─────────────────┴──────────────────┘             │   │
│   │              SAP BTP Destination (podzone-api)              │   │
│   └───────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────────┼─────────────────────────────────────┘
                                │ HTTPS REST Calls
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│              PODZO Express Backend (podzone-srv)                    │
│  https://podzone-srv-sleepy-baboon-kp.cfapps.eu30.hana.ondemand.com │
│                                                                     │
│    /api/v3/contracts          /api/v3/review-queue                  │
│    /api/v3/purchase-orders    /api/v3/delivery-invoices             │
│    /api/v3/po/:id/distribute  /api/v3/miro/:id/post                 │
│    /api/v3/assignments        /api/v3/transporters                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Persona Scope

| Persona | Role Code | Joule Skills | Count |
| :--- | :---: | :--- | :---: |
| **Company Admin** | `CA` | Distribute PO, View Contracts, Check Review Queue, Approve/Reject Exception, View Invoices, Post MIRO, Dashboard KPI | **6** |
| **Transporter Admin** | `TA` | View My POs, Assign Driver & Vehicle, Submit Invoice | **4** |
| **Customer Receiver** | `CR` | View Incoming Deliveries, Check Weight Status, POD Delivery Summary | **3** |
| ~~Supervisor~~ | `SR` | Physical gate action — React UI only | ❌ |
| ~~Driver~~ | `DR` | Signature, OTP, POD upload — React UI only | ❌ |

---

## 4. Guard Clause — Global Out-of-Scope Handler

Every skill entry point has a **guard condition**. If intent confidence < 0.75 OR topic is unrelated to logistics/delivery, Joule responds:

```
I am PODZO Copilot — your logistics and proof-of-delivery assistant.

I can help you with:
  • Distributing and managing Purchase Orders to transporters
  • Reviewing and approving flagged delivery exceptions
  • Processing and posting MIRO freight invoices
  • Viewing active contracts and delivery assignments
  • Checking weighbridge data and POD reconciliation status

For anything outside logistics operations, please use the
appropriate SAP tool or speak to your system administrator.

What would you like to do today?
```

> This guard fires on: general knowledge questions, HR queries, weather, off-topic SAP modules, etc.

---

## 5. SKILL BLUEPRINTS — Company Admin (CA)

---

### CA-01: Distribute Purchase Order

**Trigger phrases:**
- "Distribute a PO"
- "Send PO to transporter"
- "Assign purchase order to Sipho Transport"
- "Release PO for delivery"

**Conversation flow:**

```
User  → "Distribute PO"

Joule → [GET /api/v3/contracts]
        "I found 5 active SAP contracts. Which contract?"
        [Quick-select: #4600000017 | #4600000018 | ...]

User  → "4600000018"

Joule → [GET /api/v3/purchase-orders?contract_id={id}]
        "Open POs under contract #4600000018:"
        ┌─────────────────────────────────────┐
        │ PO #       │ Material      │ Qty     │
        │ 4600000018 │ Washed Coal A │ 34 TON  │
        └─────────────────────────────────────┘
        "Which PO to distribute?"

User  → "Item 10"

Joule → [GET /api/v3/transporters]
        "Choose a transporter:"
        [Sipho Transport | CBS Logistics | MPL Hauling]

User  → "Sipho Transport"

Joule → "Please provide scheduling details:"
        1. Pickup window start? (e.g. 06:00)
        2. Pickup window end? (e.g. 18:00)
        3. Requested pickup date/time? (e.g. 2026-10-08T08:00)
        4. Expected delivery date/time?

User  → [answers each]

Joule → "Confirm distribution?"
        ┌────────────────────────────────────────┐
        │ Contract:    #4600000018               │
        │ PO:          Item 10 (34 TON)          │
        │ Transporter: Sipho Transport Services  │
        │ Pickup:      08 Oct 2026, 08:00        │
        │ Delivery:    08 Oct 2026, 16:00        │
        └────────────────────────────────────────┘
        (Yes / No)

User  → "Yes"

Joule → [POST /api/v3/po/{id}/distribute]
        "✅ PO #4600000018 distributed to Sipho Transport.
         Job Config ID: #47. Transporter can now assign a driver."
```

---

### CA-02: Review Queue — View, Approve & Reject

**Trigger phrases:**
- "Show exceptions"
- "What's in the review queue?"
- "Any flagged deliveries?"
- "Approve exception 32"

**Conversation flow:**

```
User  → "Show review queue"

Joule → [GET /api/v3/review-queue?status=OPEN]
        "3 open exceptions requiring your action:"
        ┌──────────────────────────────────────────────────┐
        │ ID │ Assignment │ Driver  │ Flag              │   │
        │ 12 │ #32        │ Zweli M │ TOLERANCE_EXCEEDED│   │
        │ 11 │ #29        │ Austin  │ OCR_MISMATCH      │   │
        └──────────────────────────────────────────────────┘
        "Say 'Approve #12' or 'Reject #11' with your notes."

User  → "Approve #12"
Joule → "Approval notes for exception #12?"
User  → "Variance within acceptable site conditions"
Joule → [PATCH /api/v3/review-queue/12/resolve]
        body: { action: "APPROVE", resolution_notes: "..." }
        "✅ Exception #12 approved. MIRO block lifted for Assignment #32."
```

---

### CA-03: View Active Contracts

**Trigger phrases:** "Show contracts", "List agreements", "Contracts with Eskom"

```
Joule → [GET /api/v3/contracts]
        Shows: Contract No | Customer | Valid Until | Open POs
        "Say 'Show POs for #4600000017' to drill into any contract."
```

---

### CA-04: View & Post MIRO Invoices

**Trigger phrases:** "Show invoices", "Post MIRO", "Invoice status"

```
Joule → [GET /api/v3/delivery-invoices?status=LEDGER]
        Table: Invoice | PO | Amount | Status

User  → "Post invoice INV-2026-0013"
Joule → "Post MIRO invoice INV-2026-0013 for R 5,123.73? (Yes / No)"
User  → "Yes"
Joule → [POST /api/v3/miro/{id}/post]
        "✅ MIRO posted. SAP Reference: {sap_ref}"
```

---

### CA-05: Dashboard KPI Summary

**Trigger phrases:** "Give me a summary", "How many deliveries today?", "Ops status"

```
Joule → [GET /api/v3/assignments] + [GET /api/v3/review-queue]
        "📊 PODZO Summary:
         • Active Assignments:          12
         • ⚠️  Pending Review Queue:     3 (action required)
         • Invoices Awaiting Posting:    5
         • Active SAP Contracts:         8
         • Cleared Deliveries Today:     4"
```

---

## 6. SKILL BLUEPRINTS — Transporter Admin (TA)

---

### TA-01: View My Purchase Orders

**Trigger phrases:** "Show my POs", "What POs do I have?", "New jobs from Ikwezi?"

```
Joule → [GET /api/v3/purchase-orders]
        Filtered to TA's transporter entity.
        Table: PO Number | Material | Qty | Status
        "Say 'Assign driver to PO 4600000018' to configure a run."
```

---

### TA-02: Assign Driver & Vehicle

**Trigger phrases:** "Assign driver to PO", "Schedule Zweli for tomorrow", "Configure job"

```
User  → "Assign driver to PO 4600000018"

Joule → [GET /api/v3/transporters/my/drivers]
        "Choose driver:"  [Zweli M | Austin B | Lucky S | Jan V]

User  → "Zweli Mokoena"

Joule → [GET /api/v3/transporters/my/vehicles]
        "Choose vehicle:" [TRK-001 Volvo FH16 | TRK-002 Scania R500]

User  → "TRK-001"
Joule → "Scheduled date? (e.g. 2026-10-08)"
User  → "2026-10-08"
Joule → "Confirm?"
        ┌───────────────────────────────────┐
        │ PO:      #4600000018             │
        │ Driver:  Zweli Mokoena           │
        │ Vehicle: TRK-001 (Volvo FH16)   │
        │ Date:    8 October 2026          │
        └───────────────────────────────────┘
User  → "Yes"
Joule → [POST /api/v3/assignments]
        "✅ Zweli assigned to PO #4600000018 on 8 Oct. Assignment ID: #47"
```

---

### TA-03: Submit Freight Invoice

**Trigger phrases:** "Submit invoice", "Generate invoice for assignment 32", "Send invoice to CA"

```
Joule → [GET /api/v3/delivery-invoices?status=AWAITING_INVOICE_SUBMISSION]
        "Assignment #32 eligible for invoicing:"
        • Delivered: 33.82 TON | Rate: R 151.50/TON | Total: R 5,123.73
        "Please provide your Invoice Number:"

User  → "INV-2026-0015"
Joule → [POST /api/v3/delivery-invoices]
        "✅ Invoice INV-2026-0015 submitted to CA for MIRO processing."
```

---

## 7. SKILL BLUEPRINTS — Customer Receiver (CR)

---

### CR-01: View Incoming Deliveries

**Trigger phrases:** "What deliveries are coming to me?", "Show incoming trucks", "Any deliveries today?"

```
Joule → [GET /api/v3/assignments?status=EN_ROUTE]
        Table: Assignment | Driver | Vehicle | Material | ETA
        "2 trucks en route to your site today."
```

---

### CR-02: Check Delivery Weight Status

**Trigger phrases:** "Dispatched weight for assignment 32", "Weight variance check", "Show weighbridge data"

```
Joule → [GET /api/v3/assignments/{id}]
        "Weight Reconciliation — Assignment #32:"

        Mine Siding:
        • Mine Tare (Empty):    12,450 kg
        • Mine Gross (Loaded):  47,230 kg
        • NET DISPATCHED:       34,780 kg (34.78 TON)

        Destination (Your Site):
        • Dest Gross (Loaded):  46,950 kg
        • Dest Tare (Empty):    12,490 kg
        • NET RECEIVED:         34,460 kg (34.46 TON)

        Variance: 320 kg (0.92%) ⚠️ Outside 0.5% tolerance
        Status: UNDER REVIEW — awaiting Company Admin resolution.
```

---

### CR-03: View Completed Delivery POD Summary

**Trigger phrases:** "Show completed deliveries", "POD status this month", "What was delivered?"

```
Joule → [GET /api/v3/assignments?status=CLEARED]
        Table: Assignment | PO | Delivered | Invoice | Status
        "Total received October 2026: 68.72 TON | Value: R 10,421.18"
```

---

## 8. Action Project Map for SAP Build

Create these Action Projects in **SAP Build > Actions**, all pointing to destination `podzone-api`:

| Action Project Name | Method | Endpoint |
| :--- | :---: | :--- |
| `podzone-get-contracts` | GET | `/api/v3/contracts` |
| `podzone-get-purchase-orders` | GET | `/api/v3/purchase-orders` |
| `podzone-get-single-po` | GET | `/api/v3/purchase-orders/:id` |
| `podzone-get-transporters` | GET | `/api/v3/transporters` |
| `podzone-distribute-po` | POST | `/api/v3/po/:id/distribute` |
| `podzone-get-review-queue` | GET | `/api/v3/review-queue` |
| `podzone-resolve-review-queue` | PATCH | `/api/v3/review-queue/:id/resolve` |
| `podzone-get-invoices` | GET | `/api/v3/delivery-invoices` |
| `podzone-post-miro` | POST | `/api/v3/miro/:id/post` |
| `podzone-get-assignments` | GET | `/api/v3/assignments` |
| `podzone-create-assignment` | POST | `/api/v3/assignments` |
| `podzone-get-drivers` | GET | `/api/v3/transporters/my/drivers` |
| `podzone-get-vehicles` | GET | `/api/v3/transporters/my/vehicles` |
| `podzone-submit-invoice` | POST | `/api/v3/delivery-invoices` |

---

## 9. BTP Destination Setup (podzone-api)

In **BTP Cockpit > sap-btp-ais > Connectivity > Destinations**:

| Property | Value |
| :--- | :--- |
| Name | `podzone-api` |
| Type | `HTTP` |
| URL | `https://podzone-srv-sleepy-baboon-kp.cfapps.eu30.hana.ondemand.com` |
| Proxy Type | `Internet` |
| Authentication | `NoAuthentication` |
| `sap.processautomation.enabled` | `true` |
| `HTML5.DynamicDestination` | `true` |

**Auth for API calls:** Add a fixed `Authorization: Bearer <token>` header per persona.
Get the token by calling `POST /api/v3/auth/login` with demo credentials.

---

## 10. Implementation Roadmap (6-Day Build Plan)

```
Day 1 — BTP Infrastructure
  ✅ Create BTP Destination: podzone-api
  ✅ Create + test Action Project: podzone-get-contracts
  ✅ Verify API call works in SAP Build Action tester

Day 2 — CA Read Skills
  ✅ CA-03: View Contracts
  ✅ CA-05: Dashboard KPI Summary
  ✅ CA-02: View Review Queue (read-only)

Day 3 — CA Action Skills
  ✅ CA-01: Distribute PO (multi-step with confirmation)
  ✅ CA-02: Add Approve/Reject step
  ✅ CA-04: View + Post MIRO Invoice

Day 4 — Transporter Admin Skills
  ✅ TA-01: View My POs
  ✅ TA-02: Assign Driver & Vehicle
  ✅ TA-03: Submit Freight Invoice

Day 5 — Customer Receiver Skills
  ✅ CR-01: Incoming Deliveries
  ✅ CR-02: Weight Status
  ✅ CR-03: Completed Delivery Summary

Day 6 — Quality & Publishing
  ✅ Guard clauses on all 13 skills
  ✅ 5+ trigger phrases per skill
  ✅ End-to-end Joule Preview testing
  ✅ Publish to SAP Build Work Zone
```

---

## 11. Recognized Intents (for Joule Training)

```yaml
in_scope_intents:
  - distribute_po
  - view_contracts
  - view_purchase_orders
  - check_review_queue
  - approve_exception
  - reject_exception
  - view_invoices
  - post_miro
  - view_assignments
  - assign_driver_to_job
  - submit_invoice
  - view_incoming_deliveries
  - check_weight_variance
  - view_pod_summary
  - dashboard_kpi_summary
```

---

## 12. Skill Quality Standards (Non-Negotiable)

| Standard | Requirement |
| :--- | :--- |
| **Guard Clause** | Every skill has out-of-scope guard at entry point |
| **Confirmation Step** | All POST/PATCH actions require "Yes / No" confirmation |
| **Error Handling** | API errors show friendly message, never raw JSON |
| **Empty State** | Empty API results explained meaningfully |
| **Intent Phrases** | Minimum 5 trigger phrases per skill |
| **Response Format** | Tables for lists, bullets for summaries — never raw JSON |
| **Persona Guard** | CA skills not triggerable by TA or CR users |

---

*PODZO Joule Skill Blueprint v1.0.0 | Authored October 2026*
*Backend: podzone-srv (Express 5) | Runtime: SAP Joule Studio + SAP Build Work Zone*
