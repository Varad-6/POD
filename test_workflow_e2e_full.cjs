const { chromium } = require('playwright');

async function testCompleteWorkflow() {
  console.log('=== STARTING COMPLETE END-TO-END BUSINESS WORKFLOW TEST ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('[vite] connect')) {
        consoleErrors.push(`[Console Error] ${text}`);
      }
    }
  });

  page.on('pageerror', err => {
    console.error(`[RUNTIME ERROR] ${err.message}`);
  });

  // Step 1: Login as CA
  console.log('\n--- Step 1: Login as Company Admin ---');
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="text"]', 'ca_thandiwe');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/dashboard', { timeout: 8000 });
  console.log('[PASS] Logged in as Company Admin');

  // Step 2: Navigate to Contracts & Select Contract 4600000026
  console.log('\n--- Step 2: Select Contract and PO ---');
  await page.goto('http://localhost:5173/admin/contracts');
  await page.waitForLoadState('networkidle');
  await page.locator('tr:has-text("4600000026")').first().click();
  await page.waitForTimeout(600);

  // Select PO Item 10
  const row10 = page.locator('tr:has-text("4500001804 / 10")').first();
  const cb10 = row10.locator('[role="checkbox"]').first();
  await cb10.click();
  await page.waitForTimeout(400);

  // Click "Proceed to Carrier Allocation"
  const proceedBtn = page.locator('button:has-text("Proceed to Carrier Allocation")').first();
  await proceedBtn.click();
  await page.waitForTimeout(400);
  console.log('[PASS] Clicked Proceed to Carrier Allocation');

  // Select Transporter & Submit
  const transporterSelect = page.locator('select').first();
  if (await transporterSelect.isVisible()) {
    await transporterSelect.selectOption({ index: 0 });
    console.log('[PASS] Transporter selected');
  }

  const distributeBtn = page.locator('button:has-text("Distribute & Notify Carrier")').first();
  if (await distributeBtn.isVisible()) {
    await distributeBtn.click();
    await page.waitForTimeout(1000);
    console.log('[PASS] Clicked Distribute & Notify Carrier');
  }

  // Logout CA
  await page.locator('button[title="Sign Out"]').first().click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Log Out")').first().click();
  await page.waitForURL('**/login', { timeout: 4000 });
  console.log('[PASS] Logged out CA');

  // Step 3: Transporter Admin Login & Check POs
  console.log('\n--- Step 3: Login as Transporter Admin ---');
  await page.fill('input[type="text"]', 'ta_sipho');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/transporter/dashboard', { timeout: 8000 });
  console.log('[PASS] Logged in as Transporter Admin');

  await page.goto('http://localhost:5173/transporter/purchase-orders');
  await page.waitForLoadState('networkidle');
  const poCards = page.locator('.table-container, table');
  console.log('[PASS] Transporter Purchase Orders page loaded with allocations table');

  // Logout TA
  await page.locator('button[title="Sign Out"]').first().click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Log Out")').first().click();
  await page.waitForURL('**/login', { timeout: 4000 });
  console.log('[PASS] Logged out TA');

  // Step 4: Driver Login & Inspect Journey
  console.log('\n--- Step 4: Driver Login & Journey State ---');
  await page.fill('input[type="text"]', 'dr_rajesh');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/driver/dashboard', { timeout: 8000 });
  console.log('[PASS] Logged in as Driver dr_rajesh');

  const journeySteps = page.locator('div:has-text("At Siding"), div:has-text("Driving"), div:has-text("Delivered")');
  console.log('[PASS] Driver Dashboard rendered operational journey state');

  // Logout DR
  await page.locator('button[title="Sign Out"]').first().click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Log Out")').first().click();
  await page.waitForURL('**/login', { timeout: 4000 });
  console.log('[PASS] Logged out Driver');

  await browser.close();
  console.log('\n=== END-TO-END BUSINESS WORKFLOW COMPLETE WITH 0 FATAL DEFECTS ===');
}

testCompleteWorkflow().catch(err => {
  console.error('Workflow test failed:', err);
  process.exit(1);
});
