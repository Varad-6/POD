/**
 * OpenAI Document & Invoice OCR Provider
 * Server-side visual document understanding using OpenAI Vision & Structured Outputs
 */
import { existsSync, readFileSync, statSync } from 'fs';
import { basename, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { spawn } from 'child_process';
import { inflateSync } from 'zlib';
import { ExtractedInvoiceData, IOCRProvider, InvoiceLineItem } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getApiKey(): string | null {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
    return process.env.OPENAI_API_KEY.trim();
  }
  // Fallback: check local .env file
  const envPath = join(__dirname, '../../../.env');
  if (existsSync(envPath)) {
    try {
      const content = readFileSync(envPath, 'utf8');
      const match = content.match(/^OPENAI_API_KEY=(.*)$/m);
      if (match && match[1]?.trim()) {
        const key = match[1].trim();
        process.env.OPENAI_API_KEY = key;
        return key;
      }
    } catch (_) {}
  }
  return null;
}

function parseCleanNumber(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function extractTextFromPdfBuffer(buffer: Buffer): string {
  try {
    const raw = buffer.toString('binary');
    const texts: string[] = [];
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match;
    while ((match = streamRegex.exec(raw)) !== null) {
      const streamData = Buffer.from(match[1], 'binary');
      let decompressed = '';
      try {
        decompressed = inflateSync(streamData).toString('utf-8');
      } catch {
        try {
          decompressed = streamData.toString('utf-8');
        } catch {}
      }
      
      if (decompressed) {
        const tjRegex = /\((.*?)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
          texts.push(tjMatch[1]);
        }
        
        const arrayTjRegex = /\[(.*?)\]\s*TJ/g;
        let arrayMatch;
        while ((arrayMatch = arrayTjRegex.exec(decompressed)) !== null) {
          const innerMatches = arrayMatch[1].match(/\((.*?)\)/g);
          if (innerMatches) {
            texts.push(innerMatches.map(m => m.slice(1, -1)).join(' '));
          }
        }
      }
    }
    return texts.join(' ').replace(/\\([()\\])/g, '$1').trim();
  } catch {
    return '';
  }
}

export class OpenAIProvider implements IOCRProvider {
  name = 'OPENAI';
  private pdfHelperPath = join(__dirname, 'pdf_to_images.py');

  async isAvailable(): Promise<boolean> {
    const key = getApiKey();
    return !!key && key.length > 10;
  }

  /**
   * Convert PDF into images & text via Python helper
   */
  private renderPdf(pdfPath: string): Promise<{ images: string[]; text: string }> {
    return new Promise((resolve) => {
      const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
      const py = spawn(pythonExe, [this.pdfHelperPath, pdfPath]);

      let stdout = '';
      py.stdout.on('data', chunk => { stdout += chunk.toString(); });
      py.stderr.on('data', () => {});

      py.on('close', (code) => {
        if (code !== 0 || !stdout.trim()) {
          return resolve({ images: [], text: '' });
        }
        try {
          const parsed = JSON.parse(stdout);
          resolve({ images: parsed.images || [], text: parsed.text || '' });
        } catch {
          resolve({ images: [], text: '' });
        }
      });

      py.on('error', () => {
        resolve({ images: [], text: '' });
      });
    });
  }

  async extract(filePath: string, mimeType: string, originalFileName?: string): Promise<ExtractedInvoiceData> {
    const fileStats = existsSync(filePath) ? statSync(filePath) : { size: 0 };
    const fileBuffer = existsSync(filePath) ? readFileSync(filePath) : Buffer.from('');
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');
    const fileName = originalFileName || basename(filePath);
    const nowIso = new Date().toISOString();

    const emptyResult: ExtractedInvoiceData = {
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
      confidence: 0,
      confidenceFields: {},
      processingStatus: 'FAILED',
      processedAt: nowIso,
      fileHash,
      originalFileName: fileName,
      fileSizeBytes: fileStats.size,
      mimeType,
      processingError: null,
    };

    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        ...emptyResult,
        processingError: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in the server environment.'
      };
    }

    const isPdf = mimeType.toLowerCase().includes('pdf') || filePath.toLowerCase().endsWith('.pdf');
    let imagesBase64: string[] = [];
    let extractedText = '';

    if (isPdf) {
      const rendered = await this.renderPdf(filePath);
      imagesBase64 = rendered.images || [];
      extractedText = rendered.text || '';
      
      if (!extractedText && imagesBase64.length === 0) {
        extractedText = extractTextFromPdfBuffer(fileBuffer);
      }
    } else {
      imagesBase64 = [fileBuffer.toString('base64')];
    }

    if (imagesBase64.length === 0 && !extractedText) {
      return {
        ...emptyResult,
        processingError: 'Unable to scan this invoice document. Please ensure the file is a readable PDF or image.'
      };
    }

    // Build OpenAI Vision prompt
    const systemPrompt = `You are an invoice document extraction engine.
Extract structured invoice information from the provided document.
Do not infer or invent values.
If a value is not present or cannot be reliably read, return null.
Extract every invoice line item.
Return ONLY valid JSON matching this schema:
{
  "invoiceNumber": string or null,
  "invoiceDate": string or null,
  "vendorName": string or null,
  "vendorGstin": string or null,
  "poNumber": string or null,
  "deliveryNumber": string or null,
  "vehicleNumber": string or null,
  "subtotalAmount": number or null,
  "taxAmount": number or null,
  "totalAmount": number or null,
  "currency": string,
  "lineItems": [
    {
      "itemNumber": integer,
      "materialCode": string or null,
      "description": string,
      "quantity": number,
      "uom": string,
      "unitPrice": number,
      "taxRatePct": number or null,
      "taxAmount": number or null,
      "lineTotal": number
    }
  ]
}
All numeric amount and quantity fields must be clean numbers without currency symbols (e.g. 5151.00, not "R 5151.00").
If line items cannot be determined, return an empty array [].`;

    const userContent: any[] = [
      {
        type: 'text',
        text: 'Extract all structured invoice fields, line items, and financial totals from this invoice document.'
      }
    ];

    if (extractedText) {
      userContent.push({
        type: 'text',
        text: `Document Content:\n${extractedText.slice(0, 4000)}`
      });
    }

    for (const b64 of imagesBase64) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${b64}`,
          detail: 'high'
        }
      });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errJson: any = await response.json().catch(() => null);
        console.error('[OpenAIProvider] API request failed with status:', response.status, errJson?.error?.message);
        return {
          ...emptyResult,
          processingError: `OpenAI API request failed (${response.status}): ${errJson?.error?.message || 'Unknown error'}`
        };
      }

      const resData: any = await response.json();
      const rawContent = resData.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);

      // Clean & normalize line items
      const lineItems: InvoiceLineItem[] = Array.isArray(parsed.lineItems)
        ? parsed.lineItems.map((li: any, idx: number) => ({
            itemNumber: li.itemNumber || idx + 1,
            materialCode: li.materialCode || null,
            description: li.description || '',
            quantity: parseCleanNumber(li.quantity) || 0,
            uom: li.uom || 'TO',
            unitPrice: parseCleanNumber(li.unitPrice) || 0,
            taxRatePct: parseCleanNumber(li.taxRatePct),
            taxAmount: parseCleanNumber(li.taxAmount),
            lineTotal: parseCleanNumber(li.lineTotal) || 0,
          }))
        : [];

      const subtotal = parseCleanNumber(parsed.subtotalAmount);
      const taxAmt = parseCleanNumber(parsed.taxAmount);
      const totalAmt = parseCleanNumber(parsed.totalAmount);
      const poNo = parsed.poNumber ? String(parsed.poNumber).trim() : null;
      const invNo = parsed.invoiceNumber ? String(parsed.invoiceNumber).trim() : null;

      const hasKeyData = !!(invNo || poNo || lineItems.length > 0 || totalAmt !== null);
      const status = hasKeyData ? 'EXTRACTED' : 'REVIEW_REQUIRED';

      return {
        invoiceNumber: invNo,
        invoiceDate: parsed.invoiceDate ? String(parsed.invoiceDate).trim() : null,
        vendorName: parsed.vendorName ? String(parsed.vendorName).trim() : null,
        vendorGstin: parsed.vendorGstin ? String(parsed.vendorGstin).trim() : null,
        poNumber: poNo,
        deliveryNumber: parsed.deliveryNumber ? String(parsed.deliveryNumber).trim() : null,
        vehicleNumber: parsed.vehicleNumber ? String(parsed.vehicleNumber).trim() : null,
        subtotalAmount: subtotal,
        taxAmount: taxAmt,
        totalAmount: totalAmt,
        currency: parsed.currency || 'ZAR',
        lineItems,
        ocrProvider: 'OPENAI',
        rawText: extractedText || JSON.stringify(parsed, null, 2),
        confidence: null as any,
        confidenceFields: {},
        processingStatus: status,
        processedAt: new Date().toISOString(),
        fileHash,
        originalFileName: fileName,
        fileSizeBytes: fileStats.size,
        mimeType,
        processingError: null
      };
    } catch (err: any) {
      console.error('[OpenAIProvider] Extraction error:', err?.message || err);
      return {
        ...emptyResult,
        processingError: 'Unable to scan this invoice. Please verify the document and try again.'
      };
    }
  }
}
