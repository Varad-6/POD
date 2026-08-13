import { chromium } from 'playwright';
import { execSync } from 'child_process';
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
  console.log('=== STARTING FULL E2E TEST SEQUENCE ===');

  // 1. Seed State
  console.log('\n[1] Seeding database to clean v3 state...');
  try {
    execSync('npx tsx server/db/reset_db_v3.ts', { stdio: 'inherit' });
    console.log('Seed database reset successfully.');
  } catch (err) {
    console.error('Failed to reset and seed database:', err);
    process.exit(1);
  }

  const db = new Database('server/db/ikwezi_portal_v3.db');

  // 2. Launch Browser
  console.log('\n[2] Connecting to Chromium browser via Playwright...');
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  
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
  await page.waitForLoadState('networkidle');

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
  await page.click('td:has-text("SAP-CTR-41000001")');
  
  console.log('Selecting PO run distribution...');
  await page.waitForSelector('button:has-text("Distribute PO")');
  await page.click('button:has-text("Distribute PO")');
  
  // Fill Job Config details
  console.log('Filling Job Allocation config form...');
  await page.waitForSelector('input[placeholder="e.g. 08:00-17:00"]');
  await page.fill('input[placeholder="e.g. 08:00-17:00"]', '08:00-16:00');
  
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

  // Select job config and assign
  console.log('Selecting pending job allocation config...');
  await page.waitForSelector('button:has-text("Configure Run")');
  await page.click('button:has-text("Configure Run")');
  
  await page.waitForSelector('button:has-text("Assign driver & truck")');
  const assignResponsePromise = page.waitForResponse(r => r.url().includes('/assign') && r.status() === 201);
  await page.click('button:has-text("Assign driver & truck")');
  await assignResponsePromise;
  console.log('Driver and vehicle assigned successfully.');

  // Get assignment ID
  const assignment = db.prepare('SELECT id FROM transport_assignments ORDER BY id DESC LIMIT 1').get();
  const assignmentId = assignment.id;

  // Logout
  console.log('Logging out TA...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 3: LOGIN SUPERVISOR (SR) ---
  console.log('\n[Step 3] Logging in as Gate Supervisor (SR)...');
  await page.fill('input[placeholder="Enter username"]', 'sr_gate01');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  console.log('SR Login Success.');

  // Select assigned truck card
  console.log('Selecting newly assigned vehicle card...');
  await clickAndVerify(page, `td:has-text("#${assignmentId}")`, 'h4:has-text("Driver gate compliance verification")');
  
  // Run supervisor check checklist
  console.log('Filling Pre-check checklist form...');
  
  const checkResponsePromise = page.waitForResponse(r => r.url().includes('/gate-check') && r.status() === 200);
  await page.click('button:has-text("Submit Gate Pre-check")');
  await checkResponsePromise;
  console.log('Gate pre-check logged.');

  // Logout
  console.log('Logging out SR...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 4: LOGIN DRIVER (DR) ---
  console.log('\n[Step 4] Logging in as Truck Driver (DR)...');
  await page.fill('input[placeholder="Enter username"]', 'dr_zweli');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  console.log('DR Login Success.');

  // Generate OTP
  console.log('Generating active Pickup OTP code...');
  await page.waitForSelector('button:has-text("Generate Pickup OTP")');
  const otpResponsePromise = page.waitForResponse(r => r.url().includes('/otp/generate') && r.status() === 200);
  await page.click('button:has-text("Generate Pickup OTP")');
  await otpResponsePromise;
  await page.waitForSelector('span:has-text("Active PICKUP OTP")');
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

  // --- STEP 5: LOGIN SUPERVISOR (SR) AGAIN (TO CAPTURE WEIGH & STAMP DISPATCH) ---
  console.log('\n[Step 5] Logging back as Gate Supervisor (SR) to weigh & stamp...');
  await page.fill('input[placeholder="Enter username"]', 'sr_gate01');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  console.log('Selecting the vehicle card...');
  await clickAndVerify(page, `td:has-text("#${assignmentId}")`, 'h4:has-text("Weighbridge log values")');

  console.log('Logging Mine Tare Weight...');
  await page.selectOption('select', 'MINE_TARE');
  await page.fill('input[type="number"]', '15200');
  
  const tareWeightResponse = page.waitForResponse(r => r.url().includes('/weight-log') && r.status() === 200);
  await page.click('button:has-text("Log Weight Log")');
  await tareWeightResponse;

  console.log('Selecting the vehicle card again...');
  await clickAndVerify(page, `td:has-text("#${assignmentId}")`, 'h4:has-text("Weighbridge log values")');

  console.log('Logging Mine Gross Weight...');
  await page.selectOption('select', 'MINE_GROSS');
  await page.fill('input[type="number"]', '49820');
  
  const grossWeightResponse = page.waitForResponse(r => r.url().includes('/weight-log') && r.status() === 200);
  await page.click('button:has-text("Log Weight Log")');
  await grossWeightResponse;

  console.log('Selecting the vehicle card for outer dispatch stamp...');
  await clickAndVerify(page, `td:has-text("#${assignmentId}")`, 'h4:has-text("Siding Dispatch Outward Stamp")');

  console.log('Entering Pickup OTP code and stamp...');
  await page.fill('input[placeholder="e.g. 9827"]', pickupOtp);
  
  const stampResponse = page.waitForResponse(r => r.url().includes('/stamp') && r.status() === 200);
  await page.click('button:has-text("Stamp & Dispatch Run")');
  await stampResponse;
  console.log('Outward dispatch stamped and vehicle released en-route.');

  // Logout
  console.log('Logging out SR...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 6: LOGIN DRIVER (DR) AGAIN (ARRIVED & UPLOAD POD) ---
  console.log('\n[Step 6] Logging in as Truck Driver (DR) to confirm arrival & upload POD...');
  await page.fill('input[placeholder="Enter username"]', 'dr_zweli');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  console.log('Triggering Destination Arrival check...');
  await page.waitForSelector('button:has-text("Verify Arrival Location")');
  const arrivedResponse = page.waitForResponse(r => r.url().includes('/arrived') && r.status() === 200);
  await page.click('button:has-text("Verify Arrival Location")');
  await arrivedResponse;
  console.log('Arrival check validated.');

  console.log('Generating Delivery OTP code...');
  await page.waitForSelector('button:has-text("Generate Delivery OTP")');
  const deliveryOtpPromise = page.waitForResponse(r => r.url().includes('/otp/generate') && r.status() === 200);
  await page.click('button:has-text("Generate Delivery OTP")');
  await deliveryOtpPromise;
  await page.waitForSelector('span:has-text("Active DELIVERY OTP")');
  console.log('Delivery OTP code generated.');

  const deliveryOtpRow = db.prepare("SELECT otp_code FROM otp_verifications WHERE assignment_id = ? AND stage = 'DELIVERY'").get(assignmentId);
  const deliveryOtp = deliveryOtpRow.otp_code;
  console.log(`Retrieved Delivery OTP code from database: ${deliveryOtp}`);

  console.log('Uploading POD waybill slip...');
  await page.waitForSelector('button:has-text("Upload Waybill Slip")');
  await page.locator('select').nth(1).selectOption('/uploads/pod/pod_10.jpg');
  
  const podUploadResponse = page.waitForResponse(r => r.url().includes('/pod-upload') && r.status() === 200);
  await page.click('button:has-text("Upload Waybill Slip")');
  await podUploadResponse;
  console.log('POD document uploaded & processed.');

  // Logout
  console.log('Logging out DR...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 7: LOGIN CUSTOMER (CR) TO CONFIRM RECEIPT ---
  console.log('\n[Step 7] Logging in as Customer (CR) to confirm offload...');
  await page.fill('input[placeholder="Enter username"]', 'cr_mining');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  console.log('Selecting incoming consignment card...');
  await clickAndVerify(page, `span:has-text("Assignment #${assignmentId}")`, 'h4:has-text("Step 1: Capture offload weights")');

  console.log('Submitting offload weights...');
  const captureDeliveryResponse = page.waitForResponse(r => r.url().includes('/capture-delivery') && r.status() === 200);
  await page.click('button:has-text("Capture Delivery weights")');
  await captureDeliveryResponse;

  console.log('Verifying Delivery OTP...');
  await page.fill('input[placeholder="e.g. 3410"]', deliveryOtp);
  
  const otpVerifyResponse = page.waitForResponse(r => r.url().includes('/otp/verify') && r.status() === 200);
  await page.click('button:has-text("Verify OTP")');
  await otpVerifyResponse;

  console.log('Confirming customer yard stamp...');
  const stampConfirmResponse = page.waitForResponse(r => r.url().includes('/stamp-confirm') && r.status() === 200);
  await page.click('button:has-text("Confirm stamp & Close offload")');
  await stampConfirmResponse;
  console.log('Offload closed successfully.');

  // Logout
  console.log('Logging out CR...');
  await page.click('button:has-text("Sign Out")');
  await page.click('button:has-text("Sign Out Now")');
  await page.waitForSelector('input[placeholder="Enter username"]');

  // --- STEP 8: LOGIN CA AGAIN TO GENERATE INVOICE & POST MIRO ---
  console.log('\n[Step 8] Logging in as Company Admin (CA) to process payment...');
  await page.fill('input[placeholder="Enter username"]', 'ca_thandiwe');
  await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  console.log('Navigating to Invoices screen...');
  await page.click('a[href="/admin/invoices"]');
  await page.waitForSelector('text=Invoice Control Desk (SAP MIRO)');

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
  console.log('Keeping the browser open. Press Ctrl+C in your VS Code terminal to exit.');
  db.close();
  await new Promise(() => {}); // Wait forever to keep browser open
}

main().catch(err => {
  console.error('E2E Flow failed with error:', err);
  process.exit(1);
});
