import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';

function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        resolve();
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Timeout waiting for server'));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

async function main() {
  const outputDir = path.resolve('public/screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const PORT = 4200;
  console.log(`Starting preview server on port ${PORT}...`);
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    stdio: 'ignore',
    shell: true,
  });

  try {
    const baseUrl = `http://localhost:${PORT}`;
    console.log(`Waiting for ${baseUrl} ...`);
    await waitForServer(baseUrl);
    console.log('Server ready!');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    const resetAndGotoLogin = async () => {
      await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
    };

    // 1. Login Screen
    console.log('1. Capturing Login Screen...');
    await resetAndGotoLogin();
    await page.screenshot({ path: path.join(outputDir, '01_login.png') });

    // 2. Transporter Dashboard
    console.log('2. Capturing Transporter Dashboard...');
    await resetAndGotoLogin();
    await page.click('text="Transporter Admin"');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outputDir, '02_transporter_dashboard.png') });

    // 3. PO Accept / E-Sign Canvas
    console.log('3. Capturing PO Accept & E-Sign...');
    await page.goto(`${baseUrl}/transporter/purchase-orders`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outputDir, '03_po_accept_esign.png') });

    // 4. POD Upload & OCR Match View
    console.log('4. Capturing POD Upload & OCR Match...');
    await page.goto(`${baseUrl}/transporter/pods`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outputDir, '04_pod_upload_ocr.png') });

    // 5. Transporter Invoices View
    console.log('5. Capturing Transporter Invoices...');
    await page.goto(`${baseUrl}/transporter/invoices`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outputDir, '05_transporter_invoices.png') });

    // 6. Admin Dashboard
    console.log('6. Capturing Admin Dashboard...');
    await resetAndGotoLogin();
    await page.click('text="Company Admin"');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outputDir, '06_admin_dashboard.png') });

    // 7. Admin Approvals Screen
    console.log('7. Capturing Admin Approvals...');
    await page.goto(`${baseUrl}/admin/approvals`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outputDir, '07_admin_approvals.png') });

    // 8. Admin Invoices & MIRO Clearance
    console.log('8. Capturing Admin Invoices & MIRO Clearance...');
    await page.goto(`${baseUrl}/admin/invoices`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outputDir, '08_admin_invoices.png') });

    // 9. Weighbridge Supervisor
    console.log('9. Capturing Weighbridge Supervisor...');
    await resetAndGotoLogin();
    await page.click('text="Weighbridge Supervisor"');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outputDir, '09_weighbridge_entry.png') });

    await browser.close();
    console.log('SUCCESS: All 9 screenshots captured!');
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
