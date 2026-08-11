import { chromium } from 'playwright';

async function runTest() {
  console.log("Launching Chromium browser in headed mode...");
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1200 // 1.2 second delay — easy to follow visually
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Open local portal
  const localUrl = "http://localhost:5173";
  console.log(`Navigating to portal URL: ${localUrl}`);
  try {
    await page.goto(localUrl);
  } catch (err) {
    console.error(`Could not connect to ${localUrl}. Please make sure your local Vite dev server is running (npm run dev).`);
    await browser.close();
    return;
  }

  // 2. Log in initially (if at login screen)
  if (page.url().includes("/login")) {
    console.log("At login screen. Logging in as Company Admin...");
    await page.click('text="Thandiwe Nkosi (Ikwezi)"');
    await page.waitForTimeout(1000);
  }

  // ==========================================
  // STEP A: ADMIN - PO DISTRIBUTION
  // ==========================================
  console.log("STEP A: Distributing PO to Transporter Admin...");
  // Go to Contracts & POs
  await page.click('text="Contracts & POs"');
  await page.waitForTimeout(1000);

  // Click Distribute PO on PO-41000001
  await page.click('text="Distribute PO"');
  await page.waitForTimeout(1000);

  // Select Transporter: Sipho Transport Services (second select on page)
  await page.locator('select').nth(1).selectOption('Sipho Transport Services');
  await page.click('text="Release PO Run"');
  await page.waitForSelector('text="Release PO Run"', { state: 'detached' });
  console.log("PO released to Sipho Transport Services successfully.");
  await page.waitForTimeout(1000);

  // ==========================================
  // STEP B: TRANSPORTER ADMIN - SIGN & ASSIGN
  // ==========================================
  console.log("STEP B: Transporter Admin e-signing the PO...");
  // Switch role to Transporter Admin
  await page.selectOption('div:has-text("ACTIVE ROLE:") > select', 'transporter_admin');
  await page.waitForTimeout(1000);

  // Go to Purchase Orders tab
  await page.click('text="Purchase Orders"');
  await page.waitForTimeout(1000);

  // Click Review & Sign on PO-41000001
  await page.click('text="Review & Sign"');
  await page.waitForTimeout(1000);

  // Enter driver name to e-sign (Verification Gate)
  await page.fill('input[placeholder="Enter assigned driver name to sign..."]', 'Zwelithini Dlamini');
  await page.waitForTimeout(1000);
  await page.click('text="Accept & Sign PO"');
  await page.waitForSelector('text="Accept & Sign PO"', { state: 'detached' });
  console.log("PO signed by Transporter Admin.");
  await page.waitForTimeout(1000);

  // Assign Driver & Truck
  await page.click('text="Assign Driver & Truck"');
  await page.waitForTimeout(1000);
  // Select Dumisani Dlamini from options
  await page.locator('select').nth(1).selectOption('Dumisani Dlamini');
  await page.waitForTimeout(1000);
  await page.click('text="Confirm Assignment"');
  await page.waitForSelector('text="Confirm Assignment"', { state: 'detached' });
  console.log("Driver and vehicle registrations assigned.");
  await page.waitForTimeout(1000);

  // ==========================================
  // STEP C: DRIVER - CONFIRM ARRIVAL
  // ==========================================
  console.log("STEP C: Driver confirming arrival at Mine Siding...");
  // Switch to Driver
  await page.selectOption('div:has-text("ACTIVE ROLE:") > select', 'driver');
  await page.waitForTimeout(1000);

  // Click Siding Arrival e-sign trigger button
  await page.click('text="Confirm Siding Arrival (E-Sign)"');
  await page.waitForTimeout(1000);

  // Sign driver name inside e-sign modal
  await page.fill('input[placeholder="Dumisani Dlamini"]', 'Dumisani Dlamini');
  await page.waitForTimeout(1000);
  await page.click('text="Sign Arrival & Confirm"');
  await page.waitForSelector('text="Sign Arrival & Confirm"', { state: 'detached' });
  console.log("Driver arrival e-signed and confirmed at yard gate.");
  await page.waitForTimeout(1000);

  // ==========================================
  // STEP D: SUPERVISOR - LOG WEIGHTS & CLEARANCE
  // ==========================================
  console.log("STEP D: Weighbridge Supervisor logging pre-dispatch weights...");
  // Switch to Supervisor
  await page.selectOption('div:has-text("ACTIVE ROLE:") > select', 'supervisor');
  await page.waitForTimeout(1000);

  // Click Log Weights
  await page.click('text="Log Weights"');
  await page.waitForTimeout(1000);

  // Enter Tare and Gross weights
  await page.fill('input[placeholder="e.g. 22840"]', '22840');
  await page.fill('input[placeholder="e.g. 71660"]', '71660');
  await page.waitForTimeout(1000);
  await page.click('text="Approve Pre-Dispatch"');
  await page.waitForSelector('text="Approve Pre-Dispatch"', { state: 'detached' });
  console.log("Weights logged. Gate clearance granted.");
  await page.waitForTimeout(1000);

  // ==========================================
  // STEP E: DRIVER - DEPART YARD
  // ==========================================
  console.log("STEP E: Driver departing Siding Siding...");
  // Switch to Driver
  await page.selectOption('div:has-text("ACTIVE ROLE:") > select', 'driver');
  await page.waitForTimeout(1000);

  // Click Start Journey (Depart Siding)
  await page.click('text="Start Journey (Depart Siding)"');
  console.log("Truck departed siding. Cargo en route to Eskom.");
  await page.waitForTimeout(1000);

  // ==========================================
  // STEP F: CUSTOMER - OFFLOAD CHECKS & DIGITAL STAMP
  // ==========================================
  console.log("STEP F: Customer offloading and stamping POD note...");
  // Switch to Customer
  await page.selectOption('div:has-text("ACTIVE ROLE:") > select', 'customer');
  await page.waitForTimeout(1000);

  // Click Check Weights
  await page.click('text="Check Weights"');
  await page.waitForTimeout(1000);

  // Enter Arrival Weights
  await page.fill('input[placeholder="e.g. 71600"]', '71600');
  await page.fill('input[placeholder="e.g. 22800"]', '22800');
  await page.waitForTimeout(1000);
  await page.click('text="Approve & Apply Stamp"');
  await page.waitForSelector('text="Approve & Apply Stamp"', { state: 'detached' });
  console.log("Customer approved offload. Verified Gate Stamp applied.");
  await page.waitForTimeout(1000);

  // ==========================================
  // STEP G: DRIVER - UPLOAD STAMPED POD
  // ==========================================
  console.log("STEP G: Driver uploading stamped weighbridge slip...");
  // Switch to Driver
  await page.selectOption('div:has-text("ACTIVE ROLE:") > select', 'driver');
  await page.waitForTimeout(1000);

  // Click Upload Customer Stamped POD Note button
  await page.click('text="Upload Customer Stamped POD Note"');
  await page.waitForTimeout(1000);

  // Set the file input files directly to trigger OCR scanning simulation
  await page.setInputFiles('input[type="file"]', 'public/demo-files/WB-998807.jpg');
  await page.waitForTimeout(1500);

  // Click Submit for Verification
  await page.click('text="Submit for Verification"');
  console.log("File uploaded. Awaiting mock OCR process completion...");
  
  // Wait for processing spinner and click Confirm
  await page.waitForSelector('text="Confirm & Submit to Admin"', { timeout: 15000 });
  await page.click('text="Confirm & Submit to Admin"');
  await page.waitForSelector('text="Confirm & Submit to Admin"', { state: 'detached' });
  console.log("Stamped POD uploaded successfully by Driver.");
  await page.waitForTimeout(1000);

  // ==========================================
  // STEP H: ADMIN - POD RECONCILIATION
  // ==========================================
  console.log("STEP H: Admin performing manual POD matching check...");
  // Switch to Admin
  await page.selectOption('div:has-text("ACTIVE ROLE:") > select', 'company_admin');
  await page.waitForTimeout(1000);

  // Go to POD Approvals
  await page.click('text="POD Approvals"');
  await page.waitForTimeout(1000);

  // Click Review Delivery Note button to verify
  await page.click('text="Review Delivery Note"');
  await page.waitForTimeout(1500); // Allow modal visual scan render

  // Click Approve button (Verify)
  await page.click('button:has-text("Approve")');
  await page.waitForSelector('button:has-text("Approve")', { state: 'detached' });
  console.log("POD verification completed and approved.");
  await page.waitForTimeout(1000);

  // ==========================================
  // STEP I: CUSTOMER - TAX INVOICING
  // ==========================================
  console.log("STEP I: Customer generating billing invoice...");
  // Switch to Customer
  await page.selectOption('div:has-text("ACTIVE ROLE:") > select', 'customer');
  await page.waitForTimeout(2000); // Wait 2s for complete transition
  console.log(`Debug Step I - URL: ${page.url()}, Title: ${await page.title()}`);

  // Go to Site Billing tab
  await page.click('button:has-text("Billing")');
  await page.waitForTimeout(1000);

  // Click Generate Invoice
  await page.click('text="Generate Invoice"');
  await page.waitForTimeout(1000);

  // Enter Invoice Number
  await page.fill('input[placeholder="e.g. TAX-2026-9021"]', 'INV-DEMO-99');
  await page.waitForTimeout(1000);
  await page.click('text="Generate & Submit Invoice"');
  await page.waitForSelector('text="Generate & Submit Invoice"', { state: 'detached' });
  console.log("Tax invoice submitted to Admin.");
  await page.waitForTimeout(1000);

  // ==========================================
  // STEP J: ADMIN - SAP BILLING RELEASE (PAID)
  // ==========================================
  console.log("STEP J: Admin releasing invoice in MIRO and dispatching payment...");
  // Switch to Admin
  await page.selectOption('div:has-text("ACTIVE ROLE:") > select', 'company_admin');
  await page.waitForTimeout(1000);

  // Go to Invoices
  await page.click('text="Invoices"');
  await page.waitForTimeout(1000);

  // Click Post Invoice (MIRO)
  await page.click('text="Post Invoice (MIRO)"');
  await page.waitForTimeout(1000);
  await page.click('text="Confirm & Post"');
  await page.waitForSelector('text="Confirm & Post"', { state: 'detached' });
  await page.waitForTimeout(1000);

  // Click Mark as Paid on the posted invoice
  await page.click('text="Mark as Paid"');
  await page.waitForTimeout(1000);

  // Enter payment reference
  await page.fill('input[placeholder="e.g. PMT-88214"]', 'PMT-OK-1122');
  await page.waitForTimeout(1000);
  await page.click('text="Confirm Payment"');
  await page.waitForSelector('text="Confirm Payment"', { state: 'detached' });
  
  console.log("\n==================================================");
  console.log("SUCCESS: End-to-end flow completed successfully!");
  console.log("Browser is kept open for your manual inspection.");
  console.log("==================================================\n");
}

runTest();
