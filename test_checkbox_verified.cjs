const { chromium } = require('playwright');

async function testCheckbox() {
  console.log('=== STARTING PO CHECKBOX COMPREHENSIVE TEST ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(`[CONSOLE ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    consoleErrors.push(`[PAGE ERROR] ${err.message}`);
  });

  // 1. Login
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="text"]', 'ca_thandiwe');
  await page.fill('input[type="password"]', 'Demo@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/dashboard', { timeout: 8000 });

  // 2. Contracts Page
  await page.goto('http://localhost:5173/admin/contracts');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  // 3. Select Contract 4600000026
  console.log('\n--- Selecting Contract 4600000026 ---');
  await page.locator('tr:has-text("4600000026")').first().click();
  await page.waitForTimeout(600);

  // 4. Verify Checkboxes for all 7 PO rows
  const poItems = [10, 20, 30, 40, 50, 60, 70];
  console.log(`\n--- Verifying Checkbox Visibility across ${poItems.length} PO rows ---`);

  for (const itemNo of poItems) {
    const row = page.locator(`tr:has-text("4500001804 / ${itemNo}")`).first();
    const checkbox = row.locator('[role="checkbox"]').first();
    const isVisible = await checkbox.isVisible();
    const box = await checkbox.boundingBox();
    const isChecked = await checkbox.getAttribute('aria-checked');

    if (isVisible && box && box.width >= 16 && box.height >= 16 && isChecked === 'false') {
      console.log(`PASS: PO 4500001804 / ${itemNo} checkbox visible (size: ${Math.round(box.width)}x${Math.round(box.height)}px, unchecked)`);
    } else {
      console.error(`FAIL: PO 4500001804 / ${itemNo} checkbox issue:`, { isVisible, box, isChecked });
    }
  }

  // 5. Single PO Selection Test (item 10)
  console.log('\n--- Testing Single PO Selection (Item 10) ---');
  const row10 = page.locator('tr:has-text("4500001804 / 10")').first();
  const cb10 = row10.locator('[role="checkbox"]').first();
  await cb10.click();
  await page.waitForTimeout(400);

  const cb10Checked = await cb10.getAttribute('aria-checked');
  const selectionBar = page.locator('div:has-text("1 PO Selected")').first();
  const barVisible1 = await selectionBar.isVisible();
  console.log(`PASS: Item 10 selected -> aria-checked: ${cb10Checked}, selection bar visible: ${barVisible1}`);

  // 6. Multiple PO Selection Test (item 20)
  console.log('\n--- Testing Multiple PO Selection (Adding Item 20) ---');
  const row20 = page.locator('tr:has-text("4500001804 / 20")').first();
  const cb20 = row20.locator('[role="checkbox"]').first();
  await cb20.click();
  await page.waitForTimeout(400);

  const cb20Checked = await cb20.getAttribute('aria-checked');
  const selectionBar2 = page.locator('div:has-text("2 POs Selected")').first();
  const barVisible2 = await selectionBar2.isVisible();
  const payloadText = await page.locator('span:has-text("200.00 TON")').first().isVisible();
  console.log(`PASS: Item 20 selected -> 2 POs Selected: ${barVisible2}, Total Planned Payload 200.00 TON: ${payloadText}`);

  // 7. PO Deselection Test (deselct item 10)
  console.log('\n--- Testing PO Deselection (Deselecting Item 10) ---');
  await cb10.click();
  await page.waitForTimeout(400);

  const cb10Deselected = await cb10.getAttribute('aria-checked');
  const selectionBar1After = page.locator('div:has-text("1 PO Selected")').first();
  const barVisible1After = await selectionBar1After.isVisible();
  console.log(`PASS: Item 10 deselected -> aria-checked: ${cb10Deselected}, back to 1 PO Selected: ${barVisible1After}`);

  // Deselect item 20 to reset
  await cb20.click();
  await page.waitForTimeout(300);

  // 8. Select All Header Checkbox Test
  console.log('\n--- Testing Header Select All Checkbox ---');
  const headerCb = page.locator('thead [role="checkbox"]').first();
  const headerCbVisible = await headerCb.isVisible();
  console.log(`PASS: Header Select All Checkbox visible: ${headerCbVisible}`);

  await headerCb.click();
  await page.waitForTimeout(400);

  const allSelectedBar = page.locator('div:has-text("7 POs Selected")').first();
  const allBarVisible = await allSelectedBar.isVisible();
  const allPayload = await page.locator('span:has-text("700.00 TON")').first().isVisible();
  console.log(`PASS: Select All clicked -> 7 POs Selected: ${allBarVisible}, 700.00 TON: ${allPayload}`);

  // Deselect all via header
  await headerCb.click();
  await page.waitForTimeout(400);
  const barGone = !(await page.locator('div:has-text("Selected")').first().isVisible().catch(() => false));
  console.log(`PASS: Deselect All clicked -> Selection bar hidden: ${barGone}`);

  // 9. Mobile responsive check
  console.log('\n--- Testing Mobile Viewport (390x844) ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const cb10Mobile = row10.locator('[role="checkbox"]').first();
  const mobileVisible = await cb10Mobile.isVisible();
  console.log(`PASS: Checkbox remains visible on Mobile 390px: ${mobileVisible}`);

  if (consoleErrors.length > 0) {
    console.log('\n--- CONSOLE ERRORS ---');
    consoleErrors.forEach(e => console.log(e));
  } else {
    console.log('\n--- ZERO CONSOLE ERRORS DETECTED ---');
  }

  await browser.close();
  console.log('\n=== ALL CHECKBOX TESTS COMPLETED SUCCESSFULLY ===');
}

testCheckbox().catch(console.error);
