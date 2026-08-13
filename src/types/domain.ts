// ============================================================
// POD — Type Definitions
// Core domain types for the POD Transport Execution Platform
// These types are shared across UI, services, and adapters.
// ============================================================

// ──────────────────────────────────────────────
// USERS & AUTHENTICATION
// ──────────────────────────────────────────────

export type UserRole =
  | 'COMPANY_ADMIN'
  | 'IKWEZI_ADMIN'
  | 'TRANSPORTER_ADMIN'
  | 'TRANSPORTER'
  | 'DRIVER'
  | 'CUSTOMER'
  | 'SUPERVISOR';

export interface User {
  username: string;
  role: UserRole;
  companyName?: string;
  displayName?: string;
}

// ──────────────────────────────────────────────
// SAP MASTER DATA (synced FROM SAP S/4HANA)
// ──────────────────────────────────────────────

export interface Contract {
  contractNumber: string;          // SAP Outline Agreement / Contract number
  qualityType: string;             // Material / Quality type description
  targetQuantity: number;          // Total contract quantity
  uom: string;                     // Unit of measure (TON)
  netValue: number;                // Total contract value
  rate: number;                    // Rate per unit (ZAR / TON)
  validFrom: string;               // ISO date
  validTo: string;                 // ISO date
  soldToParty: string;             // SAP Customer / Sold-To party
  currency: string;                // ZAR
  fromLocation: string;            // Loading site
  toLocation: string;              // Delivery destination
  sapSyncStatus?: SAPSyncStatus;
}

export interface PurchaseOrder {
  purchaseOrderNo: string;         // SAP PO number
  contractRef: string;             // Parent contract number
  transporter: string;             // Assigned transporter company name
  productDescription: string;      // Material / Quality description
  rate: number;                    // Rate per ton (ZAR)
  unit: string;                    // UOM (TON)
  targetQuantity: number;          // Quantity on this PO
  costCenter: string;              // SAP cost center
  fromLocation: string;            // Pickup site
  toLocation: string;              // Delivery site
  paymentTerms: string;            // e.g. "30 days from invoice posting"
  poDate: string;                  // ISO date
  status: TransportRunStatus;      // Unified status (see state machine)
  signedBy?: string;               // Transporter signature name
  signedDate?: string;             // ISO date
  biltyNo?: string;                // Carrier bilty/waybill reference
  biltyDate?: string;              // ISO date
  consignorName?: string;
  consigneeName?: string;
  declaredValue?: number;
  sapSyncStatus?: SAPSyncStatus;
}

// ──────────────────────────────────────────────
// TRANSPORT RUN STATE MACHINE
// ──────────────────────────────────────────────

/**
 * Unified status for a transport execution run.
 * Replaces the duplicate PO.status + OffloadRecord.podStatus overlap.
 *
 * State Machine:
 * PENDING_ASSIGNMENT
 *   → ASSIGNED (CA assigns TA/transporter)
 *     → DRIVER_ASSIGNED (TA assigns driver + vehicle)
 *       → DRIVER_ARRIVED (DR confirms arrival at siding)
 *         → SUPERVISOR_APPROVED (SR approves dispatch weights)
 *           → EN_ROUTE (DR departs siding)
 *             → DELIVERED_STAMPED (CR confirms delivery)
 *               → POD_UPLOADED (DR uploads POD document)
 *                 → SUBMITTED_AWAITING_APPROVAL (in CA queue)
 *                   → APPROVED (CA approves clean match)
 *                   → APPROVED_MISMATCH_OVERRIDE (CA overrides mismatch)
 *                   → REJECTED (CA rejects — back to POD_UPLOADED)
 *                 (after APPROVED / APPROVED_MISMATCH_OVERRIDE)
 *                 → INVOICE_PENDING (TA can now submit invoice)
 *                   → INVOICE_SUBMITTED (TA submits)
 *                     → INVOICE_PARKED (SAP MIRO parked)
 *                       → INVOICE_POSTED (SAP MIRO posted)
 *                         → PAID (FI-AP cleared)
 *         → SUPERVISOR_REJECTED → DRIVER_ARRIVED (correction)
 *             → DELIVERED_FAILED (CR rejects delivery)
 */
export type TransportRunStatus =
  | 'PENDING_ASSIGNMENT'
  | 'PENDING_SIGNATURE'
  | 'ACCEPTED_SIGNED'
  | 'ASSIGNED'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVED'
  | 'SUPERVISOR_APPROVED'
  | 'SUPERVISOR_REJECTED'
  | 'EN_ROUTE'
  | 'DELIVERED_STAMPED'
  | 'DELIVERED_FAILED'
  | 'POD_UPLOADED'
  | 'SUBMITTED_AWAITING_APPROVAL'
  | 'LOW_CONFIDENCE'
  | 'APPROVED'
  | 'APPROVED_MISMATCH_OVERRIDE'
  | 'APPROVED_INVOICE_PENDING'
  | 'REJECTED'
  | 'INVOICE_PENDING'
  | 'INVOICE_SUBMITTED'
  | 'INVOICE_PARKED'
  | 'INVOICE_POSTED'
  | 'PAID'
  | 'POD_SUBMITTED'
  | 'POD_APPROVED';

// ──────────────────────────────────────────────
// TRANSPORT RUN (core execution document)
// Replaces: OffloadRecord (which had inconsistencies)
// ──────────────────────────────────────────────

export type WeightExceptionReason =
  | 'NONE'
  | 'MOISTURE_EVAPORATION'
  | 'RAIN_ABSORPTION'
  | 'SCALE_CALIBRATION_OFFSET'
  | 'UNLOAD_SPILLAGE';

export interface TransportRun {
  // Identity
  waybillNo: string;                // POD-generated unique ID
  poRef: string;                    // Parent PO number
  loadingWaySlipNo: string;         // Loading slip / EL number

  // Vehicle
  horseRegNo: string;               // Truck/horse registration
  trailer1RegNo: string;
  trailer2RegNo: string;

  // Driver
  driverName: string;
  driverIdNo: string;
  driverLicenseNo?: string;
  licenseExpiryDate?: string;
  isLicenseValid?: boolean;

  // Carrier document (Bilty)
  biltyNo?: string;
  biltyDate?: string;
  consignorName?: string;
  consigneeName?: string;
  declaredValue?: number;

  // 4-Point Weighbridge (dispatch side — Supervisor logs)
  dispatchTareWeightKg: number;
  dispatchGrossWeightKg: number;
  dispatchNetWeightKg: number;

  // 4-Point Weighbridge (arrival side — Customer logs)
  arrivalGrossWeightKg: number;
  arrivalTareWeightKg: number;
  arrivalNetWeightKg: number;

  // Damage tracking
  totalUnits?: number;
  damagedUnits?: number;
  damagedWeightKg?: number;
  damageReason?: string;
  acceptedNetWeightKg?: number;     // arrivalNetWeightKg - damagedWeightKg

  // Weight exceptions
  weightExceptionReason?: WeightExceptionReason;
  exceptionNotes?: string;

  // Journey
  loadingKm: number;
  offloadingKm: number;
  operatorName: string;
  site: string;
  productDescription: string;
  offloadDate: string;

  // Status (unified — replaces old podStatus)
  podStatus: TransportRunStatus;

  // Pre-dispatch gate status
  preDispatch: 'PENDING' | 'PASSED' | 'FAILED';

  // Customer check status
  customerCheck: 'PENDING' | 'STAMPED_CONFIRMED' | 'REPORTED_DEVIATION';

  // Document
  uploadedFileName?: string;
  rejectionReason?: string;

  // SAP reference (populated when integrated)
  sapSESNumber?: string;            // Service Entry Sheet number
  sapMIRODocNo?: string;            // MIRO document number
}

// Keep OffloadRecord as alias for backward compatibility during refactor
export type OffloadRecord = TransportRun;

// ──────────────────────────────────────────────
// OCR
// ──────────────────────────────────────────────

export type OCRMatchResult =
  | 'MATCH'
  | 'PARTIAL_MATCH'
  | 'MISMATCH'
  | 'MISSING_DATA'
  | 'LOW_CONFIDENCE'
  | 'MANUAL_REVIEW'
  | 'REJECTED';

export interface OCRResult {
  fileName: string;
  confidence: number;               // 0.0 – 1.0
  extracted: {
    waybillNo?: string;
    horseRegNo?: string;
    weight?: number;
    [key: string]: unknown;
  };
  sapRecord: {
    waybillNo?: string;
    horseRegNo?: string;
    weight?: number;
    [key: string]: unknown;
  };
  matchResult: OCRMatchResult;
  mismatchField?: string;
}

// ──────────────────────────────────────────────
// INVOICE
// ──────────────────────────────────────────────

export type InvoiceStatus =
  | 'AWAITING_INVOICE_SUBMISSION'
  | 'PARKED'
  | 'POSTED'
  | 'PAID';

export interface Invoice {
  invoiceNo: string | null;
  waybillNo: string;
  quantity: number;                 // Delivered tons (acceptedNetWeightKg / 1000)
  rate: number;                     // ZAR per ton (from PO)
  amount: number;                   // quantity × rate
  status: InvoiceStatus;
  postingDate: string | null;
  paymentRef: string | null;
  fileName?: string;
  // SAP reference
  sapDocNo?: string;                // MIRO document number
  sapClearingDocNo?: string;        // FI payment clearing document
}

// ──────────────────────────────────────────────
// SAP SYNC
// ──────────────────────────────────────────────

export type SAPSyncStatus = 'SYNCED' | 'PENDING' | 'FAILED' | 'MOCK';

export interface SAPSyncLog {
  id: string;
  timestamp: string;
  direction: 'SAP_TO_POD' | 'POD_TO_SAP';
  entity: string;
  entityId: string;
  status: SAPSyncStatus;
  message?: string;
  retryCount?: number;
}

// ──────────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────────

export interface AppNotification {
  id: string;
  text: string;
  read: boolean;
  link: string;
  timestamp: string;
}

// Backward compat alias
export type DemoNotification = AppNotification;

// ──────────────────────────────────────────────
// AUDIT
// ──────────────────────────────────────────────

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;                    // username
  actorRole: UserRole;
  action: string;                   // e.g. 'APPROVE_POD'
  entityType: string;               // e.g. 'TransportRun'
  entityId: string;                 // waybillNo or poNo
  details?: Record<string, unknown>;
}

// ──────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

// ──────────────────────────────────────────────
// ADMIN APPROVAL QUEUE
// ──────────────────────────────────────────────

export interface ApprovalQueueItem {
  waybillNo: string;
  transporter: string;
  submittedOn: string;
  matchStatus: OCRMatchResult;
  actionsAvailable: string[];
}
