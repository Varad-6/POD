import { test, expect } from '@playwright/test';

// Helper to switch personas securely via logout/login
async function loginAs(page: any, username: string) {
  // Try to logout if already signed in
  const signOutBtn = page.locator('text=Sign Out');
  if (await signOutBtn.isVisible()) {
    await signOutBtn.click();
    await page.click('button:has-text("Sign Out Now")');
    await page.waitForTimeout(1000);
  }
  // Navigate and authenticate
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="text"]', username);
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
}

test.describe('PODZO End-to-End Live Persona Walkthrough', () => {
  
  test('Complete 5-Persona Live Workflow', async ({ page }) => {
    // Increase test timeout for full 5-role walkthrough
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1280, height: 800 });

    console.log('--- STEP 1: COMPANY ADMIN (CA) FLOW ---');
    await loginAs(page, 'ca_thandiwe');
    
    // Verify Admin Dashboard loads
    await expect(page.locator('h2:has-text("Fleet Logistics Command Desk")')).toBeVisible();
    console.log('✔ CA Login & Command Desk verified');

    // Navigate to Contracts & PO Release
    await page.click('text=Contracts & PO Release');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toContainText('Contracts & PO Release Console');
    console.log('✔ Navigated to Contracts Releasing');

    // Click on Contract Master row to inspect details
    const contractRow = page.locator('tr:has-text("Eskom / Client")').first();
    if (await contractRow.count() > 0) {
      await contractRow.click();
      await page.waitForTimeout(1000);
      console.log('✔ Selected Contract Details');
    }

    console.log('--- STEP 2: TRANSPORTER ADMIN (TA) FLOW ---');
    await loginAs(page, 'ta_sipho');

    // Navigate to POs Queue
    await page.click('text=Purchase Orders Queue');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toContainText('Purchase Orders');
    console.log('✔ TA Purchase Orders Queue loaded');

    // Navigate to POD Uploads
    await page.click('text=Waybill POD Uploads');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toContainText('Delivery Receipts (POD) Upload Desk');
    console.log('✔ TA POD Upload Desk loaded');

    console.log('--- STEP 3: TRUCK DRIVER (DR) FLOW ---');
    await loginAs(page, 'dr_rajesh');
    
    // Verify Driver Dashboard loads
    await expect(page.locator('body')).toContainText('Driver Haulage Console');
    console.log('✔ Driver Dashboard verified');

    console.log('--- STEP 4: WEIGHBRIDGE SUPERVISOR (SR) FLOW ---');
    await loginAs(page, 'sr_gate01');

    // Verify Supervisor Dashboard loads
    await expect(page.locator('body')).toContainText('Gate & Weighbridge');
    console.log('✔ Supervisor Siding Queue loaded');

    console.log('--- STEP 5: YARD RECEIVER (CR) FLOW ---');
    await loginAs(page, 'cr_mining');

    // Verify Customer Dashboard loads
    await expect(page.locator('body')).toContainText('Yard Receiving');
    console.log('✔ Customer Yard Incoming Queue loaded');

    console.log('--- STEP 6: MIRO INVOICE CONSOLE (CA) ---');
    await page.waitForTimeout(1000);
    await loginAs(page, 'ca_thandiwe');

    // Navigate to MIRO Invoice console
    await page.click('text=SAP MIRO Invoices');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toContainText('Invoice & Payment Desk');
    console.log('✔ Visited SAP MIRO Invoice Console');

    console.log('🎉 ALL PERSONA UI PAGES VISITED & VERIFIED LIVE!');
  });
});
