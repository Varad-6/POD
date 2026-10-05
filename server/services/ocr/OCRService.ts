/**
 * Centralized OCR Service Orchestrator
 * Active Provider: OpenAI API (Vision & Structured Document Understanding)
 * Tesseract is deprecated and removed from active pipeline.
 */
import { existsSync, statSync, readFileSync } from 'fs';
import { createHash } from 'crypto';
import { ExtractedInvoiceData } from './types.js';
import { OpenAIProvider } from './OpenAIProvider.js';

export class OCRService {
  private static openAIProvider = new OpenAIProvider();

  /**
   * Validate file before processing
   */
  static validateFile(filePath: string, mimeType?: string): { valid: boolean; error?: string } {
    if (!existsSync(filePath)) {
      return { valid: false, error: 'File does not exist' };
    }

    const stats = statSync(filePath);
    if (stats.size === 0) {
      return { valid: false, error: 'File is empty (0 bytes)' };
    }

    const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
    if (stats.size > MAX_SIZE_BYTES) {
      return { valid: false, error: `File size (${(stats.size / (1024*1024)).toFixed(1)}MB) exceeds 15MB limit` };
    }

    const allowedMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (mimeType && !allowedMimes.includes(mimeType.toLowerCase())) {
      return { valid: false, error: `Unsupported file type: ${mimeType}. Please upload a PDF, PNG, or JPG.` };
    }

    return { valid: true };
  }

  /**
   * Main entry point to process any invoice file
   * Active Path: OpenAI API
   */
  static async processInvoice(filePath: string, mimeType: string, originalFileName?: string): Promise<ExtractedInvoiceData> {
    const validation = this.validateFile(filePath, mimeType);
    if (!validation.valid) {
      const fileHash = existsSync(filePath) ? createHash('sha256').update(readFileSync(filePath)).digest('hex') : '';
      return {
        invoiceNumber: null,
        invoiceDate: null,
        vendorName: null,
        vendorGstin: null,
        poNumber: null,
        deliveryNumber: null,
        vehicleNumber: null,
        subtotalAmount: null,
        taxAmount: null,
        totalAmount: null,
        currency: 'ZAR',
        lineItems: [],
        ocrProvider: 'OPENAI',
        rawText: '',
        confidence: null as any,
        confidenceFields: {},
        processingStatus: 'FAILED',
        processedAt: new Date().toISOString(),
        processingError: validation.error,
        fileHash,
        originalFileName: originalFileName || filePath.split(/[/\\]/).pop() || 'unknown',
        fileSizeBytes: existsSync(filePath) ? statSync(filePath).size : 0,
        mimeType,
      };
    }

    // Active Demo OCR Provider: OpenAI API (No Tesseract in active path)
    return await this.openAIProvider.extract(filePath, mimeType, originalFileName);
  }
}
