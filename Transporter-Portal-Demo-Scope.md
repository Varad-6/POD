# Transporter Portal — Demo Scope
### Working Prototype Walkthrough

Prepared by: Abhiyanta India Solutions Pvt. Ltd.

---

## 1. Purpose of the Demo

To demonstrate the core workflow concept of the Transporter Portal in a working, click-through prototype — proving the logic and user experience before full-scale build and SAP integration begins.

This is a **concept demo**, not the production system. Scope will continue to evolve as we discuss further with the team.

---

## 2. Approach

- The demo uses **mock/sample data** in place of a live SAP connection.
- The demo uses **real OCR** to genuinely demonstrate document scanning and data extraction.
- No production-grade security, database, or SAP integration is included at this stage.

---

## 3. Personas / Logins in the Demo

| Persona | Access | Status / Scope |
|---|---|---|
| **Company Admin** | Uploads contracts, syncs to SAP, distributes POs, reviews and clears invoices | Core Scope |
| **Transporter Admin** | Checks incoming POs, assigns delivery tasks to Drivers | Core Scope |
| **Driver (Transporter)** | Accepts PO signature, performs delivery, uploads stamped POD slip | Core Scope |
| **Supervisor / Site Manager** | Checks empty/loaded truck weights, verifies against PO before dispatch | Stretch / Optional Scope |
| **Customer** | Performs on-site weight check, stamps POD or logs report, uploads invoice copy | Stretch / Optional Scope |

*(Accountant/SAP posting and gate logs are simulated only in the demo workspace.)*

---

## 4. Screens Included in the Demo

1. **Login** — Multi-Persona Select Portal (Company Admin, Transporter Admin, Driver, Customer, Weighbridge Supervisor)
2. **Dashboard Views** — Distinct dashboard panels reflecting PO and shipment statuses
3. **Accept & E-Sign** — Driver accept signature canvas on the transport PO task
4. **Pre-Dispatch Weighbridge Matching (New)** — Supervisor empty/loaded truck weight logging and PO check
5. **POD Upload** — Scan and upload of customer-stamped delivery slip
6. **OCR Extraction & Match Check** — Simulated live extraction and side-by-side comparison of waybill vs SAP
7. **Customer On-Site Verification (New)** — Customer gate check and stamp/report issuance
8. **Admin Approval & Flagging Screen** — Review modal with "Approve", "Reject", and "Send for Review" tab transitions
9. **Invoice Calculation & Clearance** — Auto-calculated freight rates and parked invoice clearing

---

## 5. Explicitly Not Included in This Demo

- Live SAP S/4HANA OData database sync
- Production-grade user authentication and access controls
- Real payment gateway transactions
- Native mobile scanner camera integration for drivers
- Real-time GPS location tracking for trips

---

## 6. Next Steps

- **Process Scope Finalization**: Discuss and confirm whether the Supervisor (Pre-dispatch Weighbridge check) and Customer-side gate logs should be fully interactive features in the final build or remain simulated on the Portal.
- **Master Contract Mapping**: Verify standard SAP API structures for contract weight agreements to align weight and kilometer variables.
