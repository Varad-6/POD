/**
 * Centralized OCR Service Orchestrator
 * Integrates Python PyMuPDF/PaddleOCR layout engine & Tesseract image fallback
 */
import { spawn } from 'child_process';
import { existsSync, statSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { ExtractedInvoiceData, IOCRProvider } from './types.js';
import { TesseractProvider } from './TesseractProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class OCRService {
  private static tesseractProvider = new TesseractProvider();
  private static pythonScriptPath = join(__dirname, 'python_ocr_engine.py');

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
        ocrProvider: 'None',
        rawText: '',
        confidence: 0,
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

    const isPdf = mimeType.toLowerCase().includes('pdf') || filePath.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      try {
        const pythonResult = await this.runPythonEngine(filePath);
        if (pythonResult && !pythonResult.error) {
          if (originalFileName) pythonResult.originalFileName = originalFileName;
          return pythonResult;
        }
        console.warn('[OCRService] Python engine warning:', pythonResult?.error);
      } catch (err: any) {
        console.error('[OCRService] Python OCR failed, attempting fallback:', err?.message || err);
      }
    }

    // Raster image or fallback
    return await this.tesseractProvider.extract(filePath, mimeType, originalFileName);
  }

  /**
   * Spawn isolated Python process for high-fidelity PyMuPDF/PaddleOCR layout extraction
   */
  private static runPythonEngine(filePath: string): Promise<ExtractedInvoiceData> {
    return new Promise((resolve, reject) => {
      const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
      const pyProcess = spawn(pythonExe, [this.pythonScriptPath, filePath]);

      let stdout = '';
      let stderr = '';

      pyProcess.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      pyProcess.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      pyProcess.on('close', (code) => {
        if (code !== 0 && !stdout.trim()) {
          return reject(new Error(`Python OCR exited with code ${code}: ${stderr}`));
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch (parseErr) {
          reject(new Error(`Failed to parse Python OCR output: ${stdout.slice(0, 200)}`));
        }
      });

      pyProcess.on('error', (err) => {
        reject(err);
      });
    });
  }
}
