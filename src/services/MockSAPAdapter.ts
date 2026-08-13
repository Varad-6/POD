// ============================================================
// POD — Mock SAP Adapter
// Implements ISAPAdapter using in-memory mock data.
// Simulates realistic SAP behavior including delays and errors.
//
// To connect to real S21:
//   Replace this with S21SAPAdapter implementing the same ISAPAdapter.
//   No changes to UI or business services needed.
//
// MOCK SAP MODE: All data originates from mockData.ts
// ============================================================

import type { ISAPAdapter } from './ISAPAdapter';
import type {
  Contract,
  PurchaseOrder,
  TransportRun,
  Invoice,
  SAPSyncLog,
} from '../types/domain';
import {
  CONTRACTS,
  PURCHASE_ORDERS,
  OFFLOAD_RECORDS,
  INVOICES,
} from '../data/mockData';

// Simulated SAP network delay (ms)
const SAP_DELAY = () => new Promise((r) => setTimeout(r, 200 + Math.random() * 400));

// Internal sync log store
const syncLog: SAPSyncLog[] = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    direction: 'SAP_TO_POD',
    entity: 'Contract',
    entityId: '40000014',
    status: 'MOCK',
    message: 'Mock adapter — contract data loaded from mockData.ts',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 3500000).toISOString(),
    direction: 'SAP_TO_POD',
    entity: 'PurchaseOrder',
    entityId: 'BATCH',
    status: 'MOCK',
    message: `Mock adapter — ${PURCHASE_ORDERS.length} POs loaded from mockData.ts`,
  },
];

// Module-level state (shared between adapter instances)
let _purchaseOrders: PurchaseOrder[] = [...(PURCHASE_ORDERS as PurchaseOrder[])];
let _transportRuns: TransportRun[] = [...(OFFLOAD_RECORDS as TransportRun[])];
let _invoices: Invoice[] = [...(INVOICES as Invoice[])];

export const MockSAPAdapter: ISAPAdapter = {
  async fetchContracts(): Promise<Contract[]> {
    await SAP_DELAY();
    return CONTRACTS as Contract[];
  },

  async fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
    await SAP_DELAY();
    return [..._purchaseOrders];
  },

  async acknowledgePO(purchaseOrderNo, acceptedBy, _signatureHash, timestamp) {
    await SAP_DELAY();
    // Update internal state
    _purchaseOrders = _purchaseOrders.map((po) =>
      po.purchaseOrderNo === purchaseOrderNo
        ? {
            ...po,
            status: 'ACCEPTED_SIGNED' as const,
            signedBy: acceptedBy,
            signedDate: timestamp,
          }
        : po
    );
    syncLog.push({
      id: `log-ack-${Date.now()}`,
      timestamp: new Date().toISOString(),
      direction: 'POD_TO_SAP',
      entity: 'POAcknowledgment',
      entityId: purchaseOrderNo,
      status: 'MOCK',
      message: `Mock: PO ${purchaseOrderNo} acknowledged by ${acceptedBy}`,
    });
    return { success: true, sapDocNo: `ACK-${Math.floor(Math.random() * 999999)}` };
  },

  async fetchTransportRuns(poNumber?: string): Promise<TransportRun[]> {
    await SAP_DELAY();
    if (poNumber) {
      return _transportRuns.filter((r) => r.poRef === poNumber);
    }
    return [..._transportRuns];
  },

  async submitPODDocument(_waybillNo, _documentType, fileName, _fileDataBase64) {
    await SAP_DELAY();
    return {
      success: true,
      archiveDocId: `ARCH-${fileName.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`,
    };
  },

  async createServiceEntrySheet(payload) {
    await SAP_DELAY();
    const sesNumber = `SES-${Math.floor(1000000 + Math.random() * 9000000)}`;
    syncLog.push({
      id: `log-ses-${Date.now()}`,
      timestamp: new Date().toISOString(),
      direction: 'POD_TO_SAP',
      entity: 'ServiceEntrySheet',
      entityId: sesNumber,
      status: 'MOCK',
      message: `Mock: SES ${sesNumber} created for PO ${payload.purchaseOrderNo} (${payload.deliveredQuantityTons.toFixed(3)} TON)`,
    });
    return { success: true, sesNumber };
  },

  async parkSupplierInvoice(payload) {
    await SAP_DELAY();
    const sapMIRODocNo = `5${Math.floor(100000000 + Math.random() * 900000000)}`;
    // Update invoice state
    _invoices = _invoices.map((inv) =>
      payload.waybillReferences.includes(inv.waybillNo)
        ? { ...inv, status: 'PARKED' as const, sapDocNo: sapMIRODocNo }
        : inv
    );
    syncLog.push({
      id: `log-miro-${Date.now()}`,
      timestamp: new Date().toISOString(),
      direction: 'POD_TO_SAP',
      entity: 'SupplierInvoice',
      entityId: payload.transporterInvoiceNo,
      status: 'MOCK',
      message: `Mock MIRO parked — SAP Doc ${sapMIRODocNo} | Amount: ZAR ${payload.grossAmountZAR.toFixed(2)}`,
    });
    return { success: true, sapMIRODocNo };
  },

  async postInvoice(sapMIRODocNo) {
    await SAP_DELAY();
    const postingDate = new Date().toISOString().split('T')[0];
    _invoices = _invoices.map((inv) =>
      inv.sapDocNo === sapMIRODocNo
        ? { ...inv, status: 'POSTED' as const, postingDate }
        : inv
    );
    syncLog.push({
      id: `log-post-${Date.now()}`,
      timestamp: new Date().toISOString(),
      direction: 'POD_TO_SAP',
      entity: 'InvoicePost',
      entityId: sapMIRODocNo,
      status: 'MOCK',
      message: `Mock invoice posted — SAP Doc ${sapMIRODocNo}`,
    });
    return { success: true, postingDate };
  },

  async fetchPaymentStatus(transporterInvoiceNo) {
    await SAP_DELAY();
    const inv = _invoices.find((i) => i.invoiceNo === transporterInvoiceNo);
    if (inv?.status === 'PAID') {
      return {
        paid: true,
        paymentRef: inv.paymentRef ?? undefined,
        clearingDocNo: `CLR-${Math.floor(100000 + Math.random() * 900000)}`,
        clearingDate: new Date().toISOString().split('T')[0],
        paidAmount: inv.amount,
      };
    }
    return { paid: false };
  },

  async fetchVendors() {
    await SAP_DELAY();
    // Derive unique transporters from POs
    const transporterNames = [
      ...new Set(
        _purchaseOrders
          .map((po) => po.transporter)
          .filter(Boolean)
      ),
    ];
    return transporterNames.map((name, i) => ({
      vendorCode: `VND-${String(i + 1).padStart(5, '0')}`,
      vendorName: name,
    }));
  },

  async ping() {
    await SAP_DELAY();
    return {
      connected: true,
      mode: 'MOCK',
      systemId: 'S21-MOCK',
      client: '100',
      timestamp: new Date().toISOString(),
    };
  },

  async getSyncLog() {
    return [...syncLog].reverse();
  },

  async fetchInvoices(poNumber?: string) {
    await SAP_DELAY();
    if (poNumber) {
      const runs = _transportRuns.filter((r) => r.poRef === poNumber);
      const waybillNos = new Set(runs.map((r) => r.waybillNo));
      return _invoices.filter((inv) => waybillNos.has(inv.waybillNo));
    }
    return [..._invoices];
  },
};

/**
 * Internal state mutators — used by AppService to update mock state.
 * These are the equivalent of SAP write operations in mock mode.
 */
export const _mockStore = {
  getPurchaseOrders: () => _purchaseOrders,
  getTransportRuns: () => _transportRuns,
  getInvoices: () => _invoices,

  setPurchaseOrders: (pos: PurchaseOrder[]) => {
    _purchaseOrders = pos;
  },
  setTransportRuns: (runs: TransportRun[]) => {
    _transportRuns = runs;
  },
  setInvoices: (invs: Invoice[]) => {
    _invoices = invs;
  },

  reset: () => {
    _purchaseOrders = [...(PURCHASE_ORDERS as PurchaseOrder[])];
    _transportRuns = [...(OFFLOAD_RECORDS as TransportRun[])];
    _invoices = [...(INVOICES as Invoice[])];
    syncLog.length = 0;
  },
};
