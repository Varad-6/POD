// ============================================================
// TRANSPORTER PORTAL — DEMO MOCK DATA
// All data below is sample/fictional, for demo purposes only.
// Currency: ZAR (R)
// ============================================================

export const USERS = [
  { username: "transporter", password: "password123", role: "TRANSPORTER", companyName: "Sipho Transport Services (Pty) Ltd" },
  { username: "transporter2", password: "password123", role: "TRANSPORTER", companyName: "Vaal Logistics CC" },
  { username: "admin", password: "password123", role: "IKWEZI_ADMIN", displayName: "Thandiwe Nkosi — Logistics Admin" },
];

export const PURCHASE_ORDERS = [
  {
    poNumber: "4500012345",
    transporter: "Sipho Transport Services (Pty) Ltd",
    material: "Coal",
    rate: 245.50,
    unit: "Ton",
    estimatedQuantity: 500,
    costCenter: "CC-MINE-01",
    route: "Mine Site A → Loading Terminal 2",
    paymentTerms: "30 days from invoice posting",
    poDate: "2026-07-01",
    status: "PENDING_SIGNATURE",
  },
  {
    poNumber: "4500012346",
    transporter: "Sipho Transport Services (Pty) Ltd",
    material: "Coal",
    rate: 245.50,
    unit: "Ton",
    estimatedQuantity: 300,
    costCenter: "CC-MINE-01",
    route: "Mine Site A → Loading Terminal 2",
    paymentTerms: "30 days from invoice posting",
    poDate: "2026-06-20",
    status: "ACCEPTED_SIGNED",
    signedBy: "S. Khumalo",
    signedDate: "2026-06-21",
  },
  {
    poNumber: "4500012350",
    transporter: "Vaal Logistics CC",
    material: "Iron Ore",
    rate: 310.00,
    unit: "Ton",
    estimatedQuantity: 400,
    costCenter: "CC-MINE-02",
    route: "Mine Site B → Rail Siding 4",
    paymentTerms: "30 days from invoice posting",
    poDate: "2026-06-25",
    status: "ACCEPTED_SIGNED",
    signedBy: "P. van der Merwe",
    signedDate: "2026-06-26",
  },
  {
    poNumber: "4500012361",
    transporter: "Sipho Transport Services (Pty) Ltd",
    material: "Coal",
    rate: 250.00,
    unit: "Ton",
    estimatedQuantity: 200,
    costCenter: "CC-MINE-01",
    route: "Mine Site A → Loading Terminal 2",
    paymentTerms: "30 days from invoice posting",
    poDate: "2026-07-10",
    status: "PENDING_SIGNATURE",
  },
];

export const OFFLOAD_RECORDS = [
  {
    waybillNo: "WB-998821",
    poRef: "4500012346",
    truckNo: "NJD982GP",
    driver: "M. Dlamini",
    sapWeight: 34.82,
    material: "Coal",
    offloadDate: "2026-07-12",
    podStatus: "PENDING_POD",
  },
  {
    waybillNo: "WB-998822",
    poRef: "4500012346",
    truckNo: "HTS445GP",
    driver: "T. Mokoena",
    sapWeight: 29.10,
    material: "Coal",
    offloadDate: "2026-07-12",
    podStatus: "PENDING_POD",
  },
  {
    waybillNo: "WB-998830",
    poRef: "4500012350",
    truckNo: "FBX221MP",
    driver: "K. van Wyk",
    sapWeight: 40.00,
    material: "Iron Ore",
    offloadDate: "2026-07-13",
    podStatus: "SUBMITTED_AWAITING_APPROVAL",
  },
  {
    waybillNo: "WB-998841",
    poRef: "4500012350",
    truckNo: "JCP665MP",
    driver: "R. Naidoo",
    sapWeight: 34.80,
    material: "Iron Ore",
    offloadDate: "2026-07-13",
    podStatus: "APPROVED_MISMATCH_OVERRIDE",
  },
  {
    waybillNo: "WB-998850",
    poRef: "4500012346",
    truckNo: "NJD982GP",
    driver: "M. Dlamini",
    sapWeight: 33.75,
    material: "Coal",
    offloadDate: "2026-07-14",
    podStatus: "APPROVED_INVOICE_PENDING",
  },
];

// OCR simulation results — paired against each uploaded slip
export const OCR_RESULTS = {
  "WB-998821": {
    fileName: "delivery-slip-match.jpg",
    confidence: 0.97,
    extracted: { waybillNo: "WB-998821", truckNo: "NJD982GP", weight: 34.82 },
    sapRecord: { waybillNo: "WB-998821", truckNo: "NJD982GP", weight: 34.82 },
    matchResult: "MATCH",
  },
  "WB-998841": {
    fileName: "delivery-slip-mismatch.jpg",
    confidence: 0.94,
    extracted: { waybillNo: "WB-998841", truckNo: "JCP665MP", weight: 32.50 },
    sapRecord: { waybillNo: "WB-998841", truckNo: "JCP665MP", weight: 34.80 },
    matchResult: "MISMATCH",
    mismatchField: "weight",
  },
  "WB-998850": {
    fileName: "delivery-slip-blurry.jpg",
    confidence: 0.62,
    extracted: { waybillNo: "WB-9988??", truckNo: "N**982GP", weight: 33.75 },
    sapRecord: { waybillNo: "WB-998850", truckNo: "NJD982GP", weight: 33.75 },
    matchResult: "LOW_CONFIDENCE",
  },
};

export const ADMIN_APPROVAL_QUEUE = [
  {
    waybillNo: "WB-998830",
    transporter: "Vaal Logistics CC",
    submittedOn: "2026-07-13",
    matchStatus: "MATCH",
    actionsAvailable: ["APPROVE"],
  },
  {
    waybillNo: "WB-998841",
    transporter: "Vaal Logistics CC",
    submittedOn: "2026-07-13",
    matchStatus: "MISMATCH",
    actionsAvailable: ["OVERRIDE_APPROVE", "REJECT"],
  },
  {
    waybillNo: "WB-998850",
    transporter: "Sipho Transport Services (Pty) Ltd",
    submittedOn: "2026-07-14",
    matchStatus: "LOW_CONFIDENCE",
    actionsAvailable: ["MANUAL_REVIEW"],
  },
];

export const REJECTION_REASONS = [
  "Illegible scan",
  "Weight discrepancy",
  "Wrong truck/waybill",
  "Duplicate submission",
  "Other (comment)",
];

export const INVOICES = [
  {
    invoiceNo: "INV-2026-0088",
    waybillNo: "WB-998790",
    amount: 5890.20,
    status: "PAID",
    postingDate: "2026-06-01",
    paymentRef: "PMT-87950",
  },
  {
    invoiceNo: "INV-2026-0089",
    waybillNo: "WB-998795",
    amount: 9102.75,
    status: "PAID",
    postingDate: "2026-06-15",
    paymentRef: "PMT-88070",
  },
  {
    invoiceNo: "INV-2026-0090",
    waybillNo: "WB-998800",
    amount: 7365.00,
    status: "PAID",
    postingDate: "2026-07-05",
    paymentRef: "PMT-88213",
  },
  {
    invoiceNo: "INV-2026-0091",
    waybillNo: "WB-998810",
    amount: 6973.70,
    status: "POSTED",
    postingDate: "2026-07-10",
    paymentRef: null,
  },
  {
    invoiceNo: "INV-2026-0092",
    waybillNo: "WB-998821",
    quantity: 34.82,
    rate: 245.50,
    amount: 8548.31,
    status: "PARKED",
    postingDate: null,
    paymentRef: null,
    fileName: "tax-invoice-sample.pdf",
  },
  {
    invoiceNo: null,
    waybillNo: "WB-998830",
    quantity: 40.00,
    rate: 310.00,
    amount: 12400.00,
    status: "AWAITING_INVOICE_SUBMISSION",
    postingDate: null,
    paymentRef: null,
  },
];

export const DASHBOARD_SUMMARY = {
  transporter: {
    pendingPOs: 2,
    activeOffloads: 2,
    invoices: { parked: 1, posted: 1, paid: 3 },
  },
};

export const SAMPLE_FILES = {
  matchSlip: "/demo-files/delivery-slip-match.jpg",
  mismatchSlip: "/demo-files/delivery-slip-mismatch.jpg",
  blurrySlip: "/demo-files/delivery-slip-blurry.jpg",
  taxInvoice: "/demo-files/tax-invoice-sample.pdf",
};
