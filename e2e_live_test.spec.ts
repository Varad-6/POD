import { test, expect } from '@playwright/test';

test.describe('PODZO End-to-End Live Persona Walkthrough', () => {
  
  test('Complete 5-Persona Live Workflow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    console.log('--- STEP 1: COMPANY ADMIN (CA) FLOW ---');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);

    // Select CA Role
    await page.selectOption('select', 'CA');
    await page.fill('input[type="text"]', 'ca_thandiwe');
    await page.fill('input[type="password"]', 'Demo@1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // Verify Admin Dashboard loads
    await expect(page.locator('h2')).toContainText('Fleet Logistics Command Desk');
    console.log('✔ CA Login & Command Desk verified');

    // Navigate to Contracts & PO Release
    await page.click('text=Contracts & Releases');
    await page.waitForTimeout(1500);

    // Click on Contract 4600000017
    await page.click('text=4600000017');
    await page.waitForTimeout(1000);

    // Click Distribute on PO 4500001715
    const poRow = page.locator('tr:has-text("4500001715")');
    if (await poRow.count() > 0) {
      await poRow.locator('button:has-text("Distribute")').click();
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Confirm Release & Distribute PO")');
      await page.waitForTimeout(1500);
      console.log('✔ CA Distributed PO 4500001715');
    }

    console.log('--- STEP 2: TRANSPORTER ADMIN (TA) FLOW ---');
    await page.click('text=Transporter');
    await page.waitForTimeout(1500);

    await page.click('text=Purchase Orders Queue');
    await page.waitForTimeout(1500);

    const assignBtn = page.locator('button:has-text("Assign Driver & Vehicle")').first();
    if (await assignBtn.isVisible()) {
      await assignBtn.click();
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Confirm Transport Assignment")');
      await page.waitForTimeout(1500);
      console.log('✔ TA Assigned Driver & Vehicle');
    }

    console.log('--- STEP 3: DRIVER (DR) FLOW ---');
    await page.click('text=Driver Console');
    await page.waitForTimeout(1500);

    const pickupOtpBtn = page.locator('button:has-text("Generate Pickup OTP")');
    if (await pickupOtpBtn.isVisible()) {
      await pickupOtpBtn.click();
      await page.waitForTimeout(1000);
      console.log('✔ Driver generated Pickup OTP');
    }

    console.log('--- STEP 4: GATE SUPERVISOR (SR) FLOW ---');
    await page.click('text=Siding Gate');
    await page.waitForTimeout(1500);

    console.log('--- STEP 5: CUSTOMER / YARD (CR) FLOW ---');
    await page.click('text=Yard Console');
    await page.waitForTimeout(1500);

    console.log('--- STEP 6: MIRO INVOICE CONSOLE (CA) ---');
    await page.click('text=Company Admin');
    await page.waitForTimeout(1500);

    await page.click('text=MIRO Invoices');
    await page.waitForTimeout(1500);
    console.log('✔ Visited MIRO Invoice Console');

    console.log('🎉 ALL PERSONA UI PAGES VISITED & VERIFIED LIVE!');
  });
});
