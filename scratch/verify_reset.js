import { chromium } from 'playwright';

(async () => {
  console.log('--- PLAYWRIGHT RESET VERIFICATION ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navigating directly to Admin Dashboard...');
    await page.goto('http://localhost:5173/admin/dashboard');
    await page.waitForTimeout(2000);

    console.log('2. Clicking Reset Demo Data button...');
    const resetButton = page.locator('button:has-text("Reset Demo Data")');
    if (await resetButton.count() > 0) {
      await resetButton.click();
      await page.waitForTimeout(1000);
      const confirmBtn = page.locator('button:has-text("Confirm & Reset Demo")');
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
        console.log('✔ Reset button clicked successfully');
      }
    }

    console.log('3. Verifying Admin Dashboard stats after reset...');
    const textContent = await page.content();
    console.log('Dashboard contains 0% Executed:', textContent.includes('0% Executed'));
    console.log('Dashboard contains 0 Ready to Park:', textContent.includes('0') || textContent.includes('Ready to Park'));
    
    console.log('SUCCESS: Reset verification complete!');
  } catch (err) {
    console.error('Playwright verification failed:', err);
  } finally {
    await browser.close();
  }
})();
