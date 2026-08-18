import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import Database from 'better-sqlite3';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3001';

async function clickAndVerify(page, selector, verifySelector) {
  for (let i = 0; i < 5; i++) {
    await page.waitForSelector(selector);
    await page.click(selector);
    try {
      await page.waitForSelector(verifySelector, { timeout: 2000 });
      return;
    } catch (err) {
      console.log(`Click on ${selector} did not activate ${verifySelector}. Retrying... (${i + 1}/5)`);
      await page.waitForTimeout(500);
    }
  }
  throw new Error(`Failed to activate ${verifySelector} after clicking ${selector}`);
}

async function main() {
  console.log('=== STARTING FULL PODZO E2E TEST SEQUENCE ===');

  // Create dummy upload files
  writeFileSync('scratch/wb_998807.pdf', 'dummy-pdf-content-for-waybill-validation');
  writeFileSync('scratch/dummy_invoice.pdf', 'dummy-pdf-content-for-tax-invoice');

  // 1. Seed State
  console.log('\n[1] Seeding database to clean v3 state...');
  try {
    execSync('npx tsx server/db/reset_db_v3.ts', { stdio: 'inherit' });
    console.log('Seed database reset successfully.');
  } catch (err) {
    console.error('Failed to reset and seed database:', err);
    process.exit(1);
  }

  const db = new Database('server/db/podzo_portal_v3.db');

  // 2. Launch Browser
  console.log('\n[2] Connecting to Chromium browser via Playwright...');
  const browser = await chromium.launch({ headless: true });
  
  // Set Geolocation permissions and coordinates
  const context = await browser.newContext({
    permissions: ['geolocation'],
    geolocation: { latitude: -25.7670, longitude: 29.4630 }, // near Emoyeni Siding
  });

  const page = await context.newPage();

  // Listen to console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error]: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[Browser Page Error]: ${err.message}`);
  });

  // Verify backend health first
  console.log('Verifying backend port 3001 health...');
  try {
    const res = await page.goto(`${BACKEND_URL}/api/v3/health`);
    if (res.status() !== 200) {
      console.error(`Backend is not running correctly on ${BACKEND_URL}`);
      process.exit(1);
    }
    console.log('Backend is up and running.');
  } catch (err) {
    console.error(`CRITICAL: Backend is down on ${BACKEND_URL}. Failsafe exit.`);
    process.exit(1);
  }

  // Go to Frontend
  console.log('Navigating to frontend...');
  await page.goto(FRONTEND_URL);
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 1: LOGIN CA & DISTRIBUTE PO ---
  console.log('\n[Step 1] Logging in as Company Admin (CA)...');
  await page.fill('input[placeholder="Enter username"]', 'ca_thandiwe');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  console.log('CA Login Success.');

  // Go to Contracts list
  console.log('Navigating to Contracts list...');
  await page.click('a[href="/admin/contracts"]');
  await page.waitForSelector('text=Active S/4HANA Quantity Contracts');

  // Click contract and distribute PO
  console.log('Selecting contract row...');
  await page.click('td:has-text("4600000017")');
  
  console.log('Selecting PO run distribution...');
  await page.waitForSelector('button:has-text("Distribute PO")');
  await page.click('button:has-text("Distribute PO")');
  
  // Fill Job Config details
  console.log('Distributing PO with default parameters...');
  
  const distResponsePromise = page.waitForResponse(r => r.url().includes('/distribute') && r.status() === 201);
  await page.click('button:has-text("Release PO")');
  await distResponsePromise;
  console.log('PO distributed successfully.');

  // Fetch created assignment ID later
  const jobConfig = db.prepare('SELECT id FROM job_configs ORDER BY id DESC LIMIT 1').get();
  const jobConfigId = jobConfig.id;

  // Logout
  console.log('Logging out CA...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 2: LOGIN TA & ASSIGN DRIVER ---
  console.log('\n[Step 2] Logging in as Transporter Admin (TA)...');
  await page.fill('input[placeholder="Enter username"]', 'ta_sipho');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  console.log('TA Login Success.');

  // Navigate to Purchase Orders and select the first pending PO
  console.log('Selecting pending job allocation config...');
  await page.click('a[href="/transporter/purchase-orders"]');
  await page.waitForSelector('text=Purchase Orders');
  
  // Click the first pending PO row (has "Assign Driver" button)
  await page.waitForSelector('span:has-text("Assign Driver")');
  // Click the card row itself (which has the Assign Driver badge)
  await page.click('span:has-text("Assign Driver")');

  // Wait for detail view to open with the driver selection
  await page.waitForSelector('text=Choose Driver');
  
  // Click "Review & Confirm"
  const reviewBtn = page.locator('button:has-text("Review & Confirm")');
  await reviewBtn.waitFor({ state: 'visible' });
  await reviewBtn.click();
  
  // Click "Confirm & Assign Driver" to submit
  await page.waitForSelector('button:has-text("Confirm & Assign Driver")');
  const assignResponsePromise = page.waitForResponse(r => r.url().includes('/assign') && r.status() === 201);
  await page.click('button:has-text("Confirm & Assign Driver")');
  await assignResponsePromise;
  console.log('Driver and vehicle assigned successfully.');

  // Get assignment ID and sap_po_no
  const assignment = db.prepare(`
    SELECT ta.id, po.sap_po_no 
    FROM transport_assignments ta
    JOIN job_configs jc ON jc.id = ta.job_config_id
    JOIN purchase_orders po ON po.id = jc.po_id
    ORDER BY ta.id DESC LIMIT 1
  `).get();
  const assignmentId = assignment.id;
  const sapPoNo = assignment.sap_po_no;
  console.log(`Retrieved assignment ID: ${assignmentId}, PO No: ${sapPoNo}`);

  // Logout
  console.log('Logging out TA...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 3: LOGIN DRIVER (DR) TO GENERATE PICKUP OTP ---
  console.log('\n[Step 3] Logging in as Truck Driver (DR) to generate Pickup OTP...');
  await page.fill('input[placeholder="Enter username"]', 'dr_zweli');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  console.log('DR Login Success.');

  // Generate OTP
  console.log('Generating active Pickup OTP code...');
  await page.waitForSelector('button:has-text("Get Pickup Code (OTP)")');
  const otpResponsePromise = page.waitForResponse(r => r.url().includes('/otp/generate') && r.status() === 200);
  await page.click('button:has-text("Get Pickup Code (OTP)")');
  await otpResponsePromise;
  await page.waitForSelector('text=Your Pickup Code');
  console.log('Pickup OTP code generated.');

  // Fetch the generated OTP from DB
  const otpRow = db.prepare("SELECT otp_code FROM otp_verifications WHERE assignment_id = ? AND stage = 'PICKUP'").get(assignmentId);
  const pickupOtp = otpRow.otp_code;
  console.log(`Retrieved Pickup OTP code from database: ${pickupOtp}`);

  // Logout
  console.log('Logging out DR...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 4: LOGIN SUPERVISOR (SR) TO VERIFY OTP, WEIGH, & UPLOAD BILTY ---
  console.log('\n[Step 4] Logging in as Gate Supervisor (SR)...');
  await page.fill('input[placeholder="Enter username"]', 'sr_gate01');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  console.log('SR Login Success.');

  // Select assigned truck card by PO number
  console.log('Selecting newly assigned vehicle card...');
  await clickAndVerify(page, `text=#${sapPoNo}`, 'text=Step 1: Check Driver Code');
  
  // Verify Pickup OTP and submit gate compliance checklist
  console.log('Verifying Pickup OTP and compliance checklist...');
  await page.fill('input[placeholder="Enter 4-digit code"]', pickupOtp);
  
  const gateCheckResponse = page.waitForResponse(r => r.url().includes('/gate-check') && r.status() === 200);
  await page.click('button:has-text("Verify Driver Code & Save Safety Checklist")');
  await gateCheckResponse;
  console.log('Gate precheck and Pickup OTP verified.');

  // Log Tare weight
  console.log('Selecting the vehicle card for Tare weighing...');
  await clickAndVerify(page, `text=#${sapPoNo}`, 'text=Step 2: Record Truck Weights');

  console.log('Logging Mine Tare Weight...');
  await page.locator('button:has-text("Empty Truck (Tare)")').click();
  await page.fill('input[type="number"]', '15200');
  
  const tareWeightResponse = page.waitForResponse(r => r.url().includes('/weight-log') && r.status() === 200);
  await page.click('button:has-text("Save Truck Weight")');
  await tareWeightResponse;

  console.log('Selecting the vehicle card again for Gross weighing...');
  await clickAndVerify(page, `text=#${sapPoNo}`, 'text=Step 2: Record Truck Weights');

  console.log('Logging Mine Gross Weight...');
  await page.locator('button:has-text("Full Loaded Truck (Gross)")').click();
  await page.fill('input[type="number"]', '49820');
  
  const grossWeightResponse = page.waitForResponse(r => r.url().includes('/weight-log') && r.status() === 200);
  await page.click('button:has-text("Save Truck Weight")');
  await grossWeightResponse;

  // Upload Siding Bilty
  console.log('Selecting the vehicle card for Bilty upload...');
  await clickAndVerify(page, `text=#${sapPoNo}`, 'text=Step 3: Upload Bilty');

  console.log('Submitting Siding Bilty document...');
  const biltyResponse = page.waitForResponse(r => r.url().includes('/bilty-upload') && r.status() === 200);
  await page.click('button:has-text("Upload Bilty & Send Truck on Journey")');
  await biltyResponse;
  console.log('Bilty uploaded and vehicle dispatched siding.');

  // Logout
  console.log('Logging out SR...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 5: LOGIN DRIVER (DR) AGAIN (ARRIVED & GENERATE DELIVERY OTP) ---
  console.log('\n[Step 5] Logging in as Truck Driver (DR) to confirm arrival...');
  await page.fill('input[placeholder="Enter username"]', 'dr_zweli');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  console.log('Triggering Destination Arrival check...');
  await page.waitForSelector('button:has-text("Verify I Have Arrived")');
  const arrivedResponse = page.waitForResponse(r => r.url().includes('/arrived') && r.status() === 200);
  await page.click('button:has-text("Verify I Have Arrived")');
  await arrivedResponse;
  console.log('Arrival check validated.');

  console.log('Generating Delivery OTP code...');
  await page.waitForSelector('button:has-text("Get Delivery Code (OTP)")');
  const deliveryOtpPromise = page.waitForResponse(r => r.url().includes('/otp/generate') && r.status() === 200);
  await page.click('button:has-text("Get Delivery Code (OTP)")');
  await deliveryOtpPromise;
  await page.waitForSelector('text=Secret DELIVERY Code');
  console.log('Delivery OTP code generated.');

  const deliveryOtpRow = db.prepare("SELECT otp_code FROM otp_verifications WHERE assignment_id = ? AND stage = 'DELIVERY'").get(assignmentId);
  const deliveryOtp = deliveryOtpRow.otp_code;
  console.log(`Retrieved Delivery OTP code from database: ${deliveryOtp}`);

  // Logout
  console.log('Logging out DR...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 6: LOGIN SUPERVISOR (SR) AGAIN TO CAPTURE ARRIVAL STAMP (Stage 7) ---
  console.log('\n[Step 6] Logging in as Gate Supervisor (SR) to capture arrival stamp...');
  await page.fill('input[placeholder="Enter username"]', 'sr_gate01');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  console.log('Selecting vehicle card for arrival stamp...');
  await clickAndVerify(page, `text=#${sapPoNo}`, 'text=Step 4: Record Customer Arrival Stamp');

  console.log('Submitting customer arrival stamp...');
  const stampResponse = page.waitForResponse(r => r.url().includes('/stamp') && r.status() === 200);
  await page.click('button:has-text("Record Arrival Stamp & Save Geolocation")');
  await stampResponse;
  console.log('Customer arrival stamp logged.');

  // Logout
  console.log('Logging out SR...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 7: LOGIN CUSTOMER (CR) TO CONFIRM RECEIPT (Stage 8) ---
  console.log('\n[Step 7] Logging in as Customer (CR) to confirm offload...');
  await page.fill('input[placeholder="Enter username"]', 'cr_mining');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  console.log('Selecting incoming consignment card...');
  await clickAndVerify(page, `text=#${sapPoNo}`, 'text=Step 1: Record Unloaded Weights');

  console.log('Submitting offload weights...');
  const captureDeliveryResponse = page.waitForResponse(r => r.url().includes('/capture-delivery') && r.status() === 200);
  await page.click('button:has-text("Save Offload Scale Value")');
  await captureDeliveryResponse;

  console.log('Verifying Delivery OTP...');
  await page.fill('input[placeholder="Enter 4-digit code"]', deliveryOtp);
  
  const otpVerifyResponse = page.waitForResponse(r => r.url().includes('/otp/verify') && r.status() === 200);
  await page.click('button:has-text("Check Secret Code")');
  await otpVerifyResponse;

  console.log('Confirming customer yard stamp...');
  const stampConfirmResponse = page.waitForResponse(r => r.url().includes('/stamp-confirm') && r.status() === 200);
  await page.click('button:has-text("Save Stamp & Finish Truck Unloading")');
  await stampConfirmResponse;
  console.log('Offload closed successfully.');

  // Logout
  console.log('Logging out CR...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 7B: LOGIN DRIVER (DR) TO UPLOAD POD (Stage 10) ---
  console.log('\n[Step 7B] Logging in as Truck Driver (DR) to upload POD...');
  await page.fill('input[placeholder="Enter username"]', 'dr_zweli');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  console.log('Uploading POD waybill slip...');
  await page.waitForSelector('button:has-text("Upload Receipt File")');
  await page.locator('select').first().selectOption('/uploads/pods/pod_sample.png');
  
  const podUploadResponse = page.waitForResponse(r => r.url().includes('/pod-upload') && r.status() === 200);
  await page.click('button:has-text("Upload Receipt File")');
  await podUploadResponse;
  console.log('POD document uploaded.');

  // Logout
  console.log('Logging out DR...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 8: LOGIN CA AGAIN TO MANUALLY VERIFY POD (Stage 11) ---
  console.log('\n[Step 8] Logging in as Company Admin (CA) to verify POD slip...');
  await page.fill('input[placeholder="Enter username"]', 'ca_thandiwe');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  console.log('Navigating to approvals queue...');
  await page.click('a[href="/admin/approvals"]');
  await page.waitForSelector('text=Receipt & Weight Check Queue');

  console.log('Selecting open review queue row...');
  await page.click(`td:has-text("${sapPoNo}")`);

  console.log('Resolving and manual unblocking...');
  await page.fill('textarea[placeholder="Provide explanation or BAPI adjustment notes..."]', 'POD manual verification complete. Weights match tolerances.');
  
  const resolveResponse = page.waitForResponse(r => r.url().includes('/resolve') && r.status() === 200);
  await page.click('button:has-text("Resolve & Unblock MIRO")');
  await resolveResponse;
  console.log('POD verified, unblocked and synced to mirror table.');

  // Logout
  console.log('Logging out CA...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 9: LOGIN TA TO GENERATE DELIVERY INVOICE (Stage 12) ---
  console.log('\n[Step 9] Logging in as Transporter Admin (TA) to create Delivery Invoice...');
  await page.fill('input[placeholder="Enter username"]', 'ta_sipho');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  console.log('Navigating to Carrier Invoices desk...');
  await page.click('a[href="/transporter/invoices"]');
  await page.waitForSelector('text=Transporter Invoices & Payments');

  console.log('Selecting ready run for invoicing...');
  await page.click('button:has-text("Raise Tax Invoice Bill")');

  console.log('Filling tax invoice document parameters...');
  await page.setInputFiles('input[type="file"]', 'scratch/wb_998807.pdf');
  await page.waitForTimeout(1000); // Wait for mock OCR parsing

  const invoiceResponse = page.waitForResponse(r => r.url().includes('/delivery-invoices') && r.status() === 201);
  await page.click('button[type="submit"]');
  await invoiceResponse;
  console.log('Delivery Tax Invoice generated successfully.');

  // Logout
  console.log('Logging out TA...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 10: LOGIN CA AGAIN TO PROCESS PAYMENT (Stage 13) ---
  console.log('\n[Step 10] Logging in as Company Admin (CA) to execute SAP payments...');
  await page.fill('input[placeholder="Enter username"]', 'ca_thandiwe');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  console.log('Navigating to Invoices screen...');
  await page.click('a[href="/admin/invoices"]');
  await page.waitForSelector('text=Invoice & Payment Desk (SAP MIRO)');

  console.log('Parking MIRO invoice in SAP...');
  await page.waitForSelector('button:has-text("Park MIRO in SAP")');
  const parkResponse = page.waitForResponse(r => r.url().includes('/miro') && r.status() === 201);
  await page.click('button:has-text("Park MIRO in SAP")');
  await parkResponse;
  console.log('MIRO Parked successfully.');

  console.log('Posting MIRO BAPI transfer...');
  await page.waitForSelector('button:has-text("Post to SAP")');
  await page.click('button:has-text("Post to SAP")');
  await page.waitForSelector('button:has-text("Confirm BAPI Post")');
  const postMiroResponse = page.waitForResponse(r => r.url().includes('/post') && r.status() === 200);
  await page.click('button:has-text("Confirm BAPI Post")');
  await postMiroResponse;
  console.log('MIRO Posted successfully.');

  console.log('Clearing payment registry...');
  await page.waitForSelector('button:has-text("Log Payment Clear")');
  await page.click('button:has-text("Log Payment Clear")');
  await page.waitForSelector('button:has-text("Log Clearing")');
  const clearResponse = page.waitForResponse(r => r.url().includes('/clear') && r.status() === 200);
  await page.click('button:has-text("Log Clearing")');
  await clearResponse;
  console.log('Invoice Payment Cleared successfully.');

  console.log('\n=== FULL E2E FLOW RUN COMPLETED SUCCESSFULLY WITH ZERO UNCAUGHT ERRORS ===');
  db.close();
  await browser.close();
  console.log('E2E run fully validated!');
}

main().catch(err => {
  console.error('E2E Flow failed with error:', err);
  process.exit(1);
});
