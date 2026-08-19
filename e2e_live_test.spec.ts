import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('PODZO End-to-End Live Persona Walkthrough', () => {
  
  test.beforeAll(async () => {
    try {
      execSync('npx tsx server/db/reset_db_v3.ts');
      console.log('✓ Database reset successfully before E2E run');
    } catch (err) {
      console.error('Failed to reset database:', err);
    }
  });

  test('Complete 5-Persona Live Workflow', async ({ page, context }) => {
    // Grant geolocation permissions to avoid prompts during driver/supervisor flows
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: -25.7670, longitude: 29.4630 });

    await page.setViewportSize({ width: 1280, height: 800 });

    page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[Browser Error] ${err.stack || err.message}`));

    console.log('--- STEP 1: COMPANY ADMIN (CA) FLOW ---');
    // Login as CA
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    await page.fill('input[placeholder="Enter username"]', 'ca_thandiwe');
    await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // Verify Admin Dashboard loads
    await expect(page.locator('h2:has-text("Fleet Logistics Command Desk")')).toBeVisible();
    console.log('✔ CA Login & Command Desk verified');

    // Navigate to Contracts & PO Release
    await page.click('text=Contracts & PO Release');
    await page.waitForTimeout(1500);

    // Click on Contract 4600000017
    await page.locator('td:has-text("4600000017")').click();
    await page.waitForTimeout(1000);

    // Click Distribute PO on PO 4500001715
    const poCard = page.locator('div').filter({ hasText: 'PO #4500001715' }).locator('button:has-text("Distribute PO")').first();
    if (await poCard.isVisible()) {
      await poCard.click();
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Release PO")');
      await page.waitForTimeout(1500);
      console.log('✔ CA Released/Distributed PO 4500001715');
    }

    // Check POD Verification Desk loads
    await page.click('text=POD Verification Desk');
    await page.waitForTimeout(1000);
    await expect(page.locator('h1:has-text("Receipt & Weight Check Queue")')).toBeVisible();
    console.log('✔ POD Verification Desk verified');

    // Check SAP MIRO Invoices loads
    await page.click('text=SAP MIRO Invoices');
    await page.waitForTimeout(1000);
    await expect(page.locator('h1:has-text("Invoice & Payment Desk (SAP MIRO)")')).toBeVisible();
    console.log('✔ SAP MIRO Invoices Console verified');

    // Logout CA
    await page.click('button:has-text("Sign Out")');
    await page.click('button:has-text("Sign Out Now")');
    await page.waitForTimeout(1000);

    console.log('--- STEP 2: TRANSPORTER ADMIN (TA) FLOW ---');
    // Login as TA
    await page.fill('input[placeholder="Enter username"]', 'ta_sipho');
    await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // Verify TA Dashboard loads
    await expect(page.locator('h1:has-text("Welcome, Sipho")')).toBeVisible();
    console.log('✔ TA Login & Carrier Control Console verified');

    // Go to Purchase Orders Queue
    await page.click('text=Purchase Orders Queue');
    await page.waitForTimeout(1500);

    // If PO 4500001715 is in list, assign driver & vehicle
    const poItem = page.locator('div').filter({ hasText: '#4500001715' }).first();
    if (await poItem.isVisible()) {
      await poItem.click();
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Review & Confirm")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Confirm & Assign Driver")');
      await page.waitForTimeout(1500);
      await expect(page.locator('h2:has-text("Driver Successfully Assigned!")')).toBeVisible();
      console.log('✔ TA Assigned Driver & Vehicle successfully');
    }

    // Logout TA
    await page.click('button:has-text("Sign Out")');
    await page.click('button:has-text("Sign Out Now")');
    await page.waitForTimeout(1000);

    console.log('--- STEP 3: DRIVER (DR) FLOW ---');
    // Login as DR
    await page.fill('input[placeholder="Enter username"]', 'dr_zweli');
    await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // Verify Driver Dashboard loads
    await expect(page.locator('div:has-text("Zwelithini")').first()).toBeVisible();
    console.log('✔ Driver Login & Haulage Console verified');

    // Logout DR
    await page.click('button:has-text("Sign Out")');
    await page.click('button:has-text("Sign Out Now")');
    await page.waitForTimeout(1000);

    console.log('--- STEP 4: GATE SUPERVISOR (SR) FLOW ---');
    // Login as SR
    await page.fill('input[placeholder="Enter username"]', 'sr_gate01');
    await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // Verify Gate Supervisor loads
    await expect(page.locator('h1:has-text("Gate & Weighbridge")')).toBeVisible();
    console.log('✔ Gate Supervisor Console verified');

    // Logout SR
    await page.click('button:has-text("Sign Out")');
    await page.click('button:has-text("Sign Out Now")');
    await page.waitForTimeout(1000);

    console.log('--- STEP 5: CUSTOMER / YARD (CR) FLOW ---');
    // Login as CR
    await page.fill('input[placeholder="Enter username"]', 'cr_mining');
    await page.fill('input[placeholder="Enter password"]', 'Demo@1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // Verify Yard console loads
    await expect(page.locator('h1:has-text("Unloading Yard")')).toBeVisible();
    console.log('✔ Yard Console verified');

    // Logout CR
    await page.click('button:has-text("Sign Out")');
    await page.click('button:has-text("Sign Out Now")');
    await page.waitForTimeout(1000);

    console.log('🎉 ALL PERSONA UI PAGES VISITED & VERIFIED LIVE!');
  });
});
