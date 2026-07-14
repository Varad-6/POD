# Changelog

All notable changes to the Transporter Proof-of-Delivery (POD) Attachment & Invoice Automation Portal will be documented in this file.

## [2026-07-14] Support 5 Portal Logins and Persona-Based Quick Access
- **Problem**: The portal only supported a simple toggle between two pre-loaded transporter/admin accounts, whereas the senior's notes require 5 distinct stakeholder roles (Company Admin, Transporter Admin, Driver, Customer, and Weighbridge Supervisor).
- **Changed**:
  - Registered 5 distinct users in `mockData.ts` with custom display titles and company affiliations.
  - Refactored `DemoContext.tsx` to handle authentication roles natively without hardcoded fallbacks.
  - Redesigned `Login.tsx` to display a beautiful quick-access list of the 5 personas, enabling one-click logins.
  - Configured `App.tsx`, `Sidebar.tsx`, and `TopBar.tsx` role routing paths and navigation layout templates.
- **Tests added**: Verified project build successfully.
- **SAP/interface impact**: No.
- **Known risk/follow-up**: None.

## [2026-07-14] Add Automated Invoice OCR Number Extraction & Auto-fill
- **Problem**: Transporters had to type invoice numbers manually, which detracted from demonstrating AI OCR automation features.
- **Changed**:
  - Implemented simulated OCR extraction inside `TransporterInvoices.tsx`. When a file is uploaded, a loader appears for 800ms and the `invoiceNumber` is auto-filled.
  - Reset the invoice number to empty if the uploaded file is cleared.
- **Tests added**: Verified successful project compilation and run.
- **SAP/interface impact**: No.
- **Known risk/follow-up**: None.

## [2026-07-14] Refactor POD Badge Status Mapping & Dynamic Invoice Creation
- **Problem**: The status badge displayed "APPROVED INVOICE PENDING" which was visually cluttered compared to a simple "Approved" statement. Additionally, stale state closures could affect dynamic invoice card creations.
- **Changed**:
  - Mapped `APPROVED_INVOICE_PENDING` to a clean `"Approved"` string in `StatusBadge.tsx`.
  - Refactored `approvePOD` inside `DemoContext.tsx` to execute calculations within functional state updates, safeguarding data consistency.
- **Tests added**: Verified project build successfully.
- **SAP/interface impact**: No.
- **Known risk/follow-up**: None.

## [2026-07-14] Remove Pre-seeded invoice for WB-998821
- **Problem**: WB-998821's invoice was pre-seeded as PARKED in mockData.ts, which bypassed the transporter's "Create Invoice" view during the demo flow.
- **Changed**: Removed the pre-seeded invoice entry for WB-998821 in `mockData.ts`, enabling it to be created dynamically when approved and raised by the transporter.
- **Tests added**: Verified successful project compilation.
- **SAP/interface impact**: No.
- **Known risk/follow-up**: None.

## [2026-07-14] Layout Overlap Fix, Mismatch OCR Sync & Notification Tray
- **Problem**: Transporter waybill cards suffered title overlaps; mismatch OCR mock data displayed incorrect happy-match values in Admin queue due to missing filename tracing; lack of a manual review tab in Admin view; and lack of notifications to tell the transporter when to upload their tax bill.
- **Changed**:
  - Saved `uploadedFileName` on `OffloadRecord` to dynamically load correct OCR comparisons by filename rather than waybill number.
  - Built a persistent notifications system in `DemoContext.tsx`. Added unread counts, mark-as-read click actions, and a notification bell dropdown in `TopBar.tsx`.
  - Added "Awaiting Approval" vs. "Flagged for Review" tabs in `AdminApprovals.tsx` and a "Send for Review" action in the modal.
  - Cleaned up waybill and PO card headers to use flexbox spacing instead of absolute positioning.
  - Added a detailed guide callout box in `TransporterInvoices.tsx` to help upload `tax-bill-sample.pdf`.
- **Tests added**: Verified successful compilation and runtime flow behavior.
- **SAP/interface impact**: No.
- **Known risk/follow-up**: None.

## [2026-07-14] Adjust Sidebar and TopBar to Prevent Demo Bar Overlap
- **Problem**: The top of the sidebar and the "IKWEZI PORTAL" title were cut off by the Demo Control Bar overlay.
- **Changed**:
  - Shifted Sidebar container down by 38px (`top: 'var(--demo-bar-height)'`) and constrained height to `calc(100vh - 38px)`.
  - Shifted TopBar sticky point down by 38px (`top: 'var(--demo-bar-height)'`).
  - Added `--demo-bar-height` variable in `theme.css`.
- **Tests added**: Verified visual layout rendering and successful project build.
- **SAP/interface impact**: No.
- **Known risk/follow-up**: None.

## [2026-07-14] Build Transporter Portal Frontend (Vite/React + TS + CSS)
- **Problem**: Need a fully working, client-facing prototype demo containing all required screens, status behaviors, signature canvas, OCR matching displays, and invoice clearance logs.
- **Changed**: 
  - Scaffolded React, TypeScript, and Vite framework settings.
  - Built out custom CSS theme (`src/styles/theme.css`, `src/index.css`).
  - Implemented core components: `Sidebar`, `TopBar`, `StatusBadge`, `Card`, `Modal`, `FileUploadBox`, `EmptyState`, `LoadingSpinner`, `Toast`.
  - Built all transporter screens: `Dashboard`, `POs` (with interactive canvas drawing), `PODs` (with mock OCR comparisons), `Invoices` (with automatic totals).
  - Built all admin screens: `Dashboard`, `Approvals` (with side-by-side match checks and reject reasons), `Invoices` (with MIRO payment clearing).
  - Integrated `DemoContext.tsx` for client-side state handling and route navigation in `App.tsx`.
- **Tests added**: Verified compiler output via `npm run build` (succeeded with zero errors).
- **SAP/interface impact**: No.
- **Known risk/follow-up**: None.

## [2026-07-14] Add mockData.js
- **Problem**: Need mock data structure for the frontend views to simulate POs, offloads, and OCR verification.
- **Changed**: Copied `mockData.js` to the `db/` folder to serve as the local baseline data store.
- **Tests added**: None.
- **SAP/interface impact**: No.
- **Known risk/follow-up**: None.

## [2026-07-14] Update Demo Flow Walkthrough
- **Problem**: The README.md contained a generic 9-step flow instead of the client-approved 14-step walkthrough and document assets.
- **Changed**: Updated README.md to list the precise 14-step walkthrough, static accounts (`transporter` / `admin`), and the 4 specific upload document files (`delivery-slip-match.jpg`, `delivery-slip-mismatch.jpg`, `delivery-slip-blurry.jpg`, `tax-bill-sample.pdf`).
- **Tests added**: Verified documentation layout in README.md.
- **SAP/interface impact**: No.
- **Known risk/follow-up**: None.

## [2026-07-13] Empty Main Branch Creation
- **Problem**: Need to set up a clean, empty `main` branch as the repository baseline.
- **Changed**: Created an orphan `main` branch, removed all files from its tracking index, committed an empty commit, and pushed it to remote.
- **Tests added**: Verified remote branch push.
- **SAP/interface impact**: No.
- **Known risk/follow-up**: None.

## [2026-07-13] Git Initialization & Remote Push
- **Problem**: Workspace C:\Users\Varad\Desktop\POD was not initialized as a Git repository.
- **Changed**: 
  - Initialized local Git repository.
  - Added project documentation (`README.md`, `SOP.md`).
  - Added workspace-specific developer rules (`.agents/rules/transporter-portal-senior-dev-prompt.md`).
  - Set remote origin to `https://github.com/Varad-6/POD`.
  - Created and pushed initial commit to `varadv13-july` branch.
- **Tests added**: Verified Git remote push.
- **SAP/interface impact**: No.
- **Known risk/follow-up**: None.
