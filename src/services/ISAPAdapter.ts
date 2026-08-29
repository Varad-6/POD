// ============================================================
// POD — SAP Adapter Interface
// ISAPAdapter defines the contract between the POD business
// layer and the SAP S/4HANA integration layer.
//
// Current implementation: MockSAPAdapter (see MockSAPAdapter.ts)
// Future implementation: S21SAPAdapter (connects to real S21)
//
// The UI and business services NEVER call SAP directly.
// They always go through this interface.
// ============================================================

import type {
  Contract,
  PurchaseOrder,
  TransportRun,
  Invoice,
  SAPSyncLog,
} from '../types/domain';

export interface ISAPAdapter {
  /**
   * SAP → POD: Fetch all active transport contracts from SAP.
   * SAP source: Outline Agreements / Purchase Contracts (ME33K/ME33L)
   */
  fetchContracts(): Promise<Contract[]>;

  /**
   * SAP → POD: Fetch line items for a specific contract by contract number from SAP.
   * SAP source: Contract Items (ME33K/ME33L)
   */
  fetchContractItems?(contractNumber: string): Promise<import('../types/domain').ContractItem[]>;

  /**
   * SAP → POD: Fetch released transport purchase orders from SAP.
   * SAP source: Purchase Orders (ME23N) with transport service items
   */
  fetchPurchaseOrders(): Promise<PurchaseOrder[]>;

  /**
   * POD → SAP: Submit PO acceptance/acknowledgment with e-signature.
   * SAP target: Custom ABAP RFC / OData endpoint for PO acknowledgment
   */
  acknowledgePO(
    purchaseOrderNo: string,
    acceptedBy: string,
    signatureHash: string,
    timestamp: string
  ): Promise<{ success: boolean; sapDocNo?: string }>;

  /**
   * SAP → POD: Fetch offload/SRN records from SAP.
   * SAP source: Custom ABAP table / Delivery (weighbridge integration)
   */
  fetchTransportRuns(poNumber?: string): Promise<TransportRun[]>;

  /**
   * POD → SAP: Submit verified POD document to SAP ArchiveLink/DMS.
   * SAP target: ArchiveLink via custom RFC
   */
  submitPODDocument(
    waybillNo: string,
    documentType: 'POD' | 'BILTY' | 'WEIGHT_SLIP',
    fileName: string,
    fileDataBase64: string
  ): Promise<{ success: boolean; archiveDocId?: string }>;

  /**
   * POD → SAP: Create/trigger Service Entry Sheet after POD verification.
   * SAP target: Service Entry Sheet (ML81N equivalent custom RFC)
   * NOTE: Only applicable if transport is procured as a service (Service PO).
   */
  createServiceEntrySheet(payload: {
    purchaseOrderNo: string;
    waybillNo: string;
    deliveredQuantityTons: number;
    deliveryDate: string;
    confirmedBy: string;
  }): Promise<{ success: boolean; sesNumber?: string }>;

  /**
   * POD → SAP: Park supplier invoice in SAP MIRO.
   * SAP target: MIRO / Manage Supplier Invoices (custom ABAP RFC)
   */
  parkSupplierInvoice(payload: {
    transporterInvoiceNo: string;
    invoiceDate: string;
    purchaseOrderNo: string;
    waybillReferences: string[];
    totalNetAmountZAR: number;
    taxAmountZAR: number;
    grossAmountZAR: number;
    currency: string;
    sesReference?: string;
  }): Promise<{ success: boolean; sapMIRODocNo?: string }>;

  /**
   * POD → SAP: Post a parked invoice in SAP.
   * SAP target: Post parked invoice (custom ABAP RFC)
   */
  postInvoice(sapMIRODocNo: string): Promise<{
    success: boolean;
    postingDate?: string;
  }>;

  /**
   * SAP → POD: Fetch payment/outstanding sync from SAP FI-AP.
   * SAP source: FI-AP clearing (custom OData)
   */
  fetchPaymentStatus(transporterInvoiceNo: string): Promise<{
    paid: boolean;
    paymentRef?: string;
    clearingDocNo?: string;
    clearingDate?: string;
    paidAmount?: number;
  }>;

  /**
   * SAP → POD: Fetch vendor/transporter master data.
   * SAP source: LFA1 / Business Partner (BUT000)
   */
  fetchVendors(): Promise<
    Array<{
      vendorCode: string;
      vendorName: string;
      email?: string;
      taxRegistrationNo?: string;
    }>
  >;

  /**
   * Diagnostics: Check SAP connectivity.
   * Returns connection health and timestamp.
   */
  ping(): Promise<{
    connected: boolean;
    mode: 'MOCK' | 'LIVE';
    systemId?: string;
    client?: string;
    timestamp: string;
  }>;

  /**
   * Get all sync log entries for monitoring.
   */
  getSyncLog(): Promise<SAPSyncLog[]>;

  /**
   * Get all invoices with their current SAP status.
   */
  fetchInvoices(poNumber?: string): Promise<Invoice[]>;
}
