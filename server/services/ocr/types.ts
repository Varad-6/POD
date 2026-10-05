/**
 * Structured OCR Invoice Integration Types
 */

export interface InvoiceLineItem {
  itemNumber?: number;
  materialCode: string | null;
  description: string;
  quantity: number;
  uom?: string;
  unitPrice: number;
  taxRatePct?: number;
  taxAmount?: number;
  lineTotal: number;
}

export interface ExtractedInvoiceData {
  // Header
  invoiceNumber: string | null;
  invoiceDate: string | null;
  vendorName: string | null;
  vendorGstin: string | null;
  poNumber: string | null;
  deliveryNumber: string | null;
  vehicleNumber: string | null;
  
  // Amounts & Totals
  subtotalAmount: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  currency: string;
  
  // Line items
  lineItems: InvoiceLineItem[];
  
  // OCR Engine Metadata
  ocrProvider: string;
  rawText: string;
  confidence: number; // 0 - 100
  confidenceFields: Record<string, number>;
  processingStatus: 'UPLOADED' | 'PROCESSING' | 'EXTRACTED' | 'REVIEW_REQUIRED' | 'FAILED';
  processedAt: string;
  processingError?: string | null;
  
  // File verification metadata
  fileHash: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface IOCRProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  extract(filePath: string, mimeType: string, originalFileName?: string): Promise<ExtractedInvoiceData>;
}
