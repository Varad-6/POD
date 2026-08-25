import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/varad/.gemini/antigravity-cli/brain/095e7b24-e6eb-4026-a498-6b3843a3ba2f';
const SCREENSHOTS_DIR = path.join(ARTIFACT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const ROLES = [
  {
    name: 'ca',
    user: 'ca_thandiwe',
    pages: [
      { name: 'dashboard', url: 'http://localhost:5173/admin/dashboard' },
      { name: 'contracts', url: 'http://localhost:5173/admin/contracts' },
      { name: 'approvals', url: 'http://localhost:5173/admin/approvals' },
      { name: 'invoices', url: 'http://localhost:5173/admin/invoices' }
    ]
  },
  {
    name: 'ta',
    user: 'ta_sipho',
    pages: [
      { name: 'dashboard', url: 'http://localhost:5173/transporter/dashboard' },
      { name: 'pos', url: 'http://localhost:5173/transporter/pos' },
      { name: 'pods', url: 'http://localhost:5173/transporter/pods' },
      { name: 'invoices', url: 'http://localhost:5173/transporter/invoices' }
    ]
  },
  {
    name: 'dr',
    user: 'dr_zweli',
    pages: [
      { name: 'dashboard', url: 'http://localhost:5173/driver/dashboard' }
    ]
  },
  {
    name: 'sr',
    user: 'sr_gate01',
    pages: [
      { name: 'dashboard', url: 'http://localhost:5173/supervisor/dashboard' }
    ]
  },
  {
    name: 'cr',
    user: 'cr_mining',
    pages: [
      { name: 'dashboard', url: 'http://localhost:5173/customer/dashboard' }
    ]
  }
];

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
];

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  console.log('--- STARTING MULTI-PERSONA DEEP QA AUDIT (LANDING / LOGIN SPLIT) ---');
  
  const report = {
    consoleErrors: [],
    failedRequests: [],
    screenshotPaths: [],
    passedChecklist: true
  };

  // 1. Audit Landing Page & Navigation to Login Page
  console.log('\n🌐 Auditing Screen A (Landing Page) & Screen B (Login Selection) navigation...');
  const initContext = await browser.newContext();
  const initPage = await initContext.newPage();

  try {
    // Visit Landing
    await initPage.goto('http://localhost:5173/');
    await initPage.waitForTimeout(1500);
    
    // Screenshot Landing Page
    for (const vp of VIEWPORTS) {
      await initPage.setViewportSize({ width: vp.width, height: vp.height });
      await initPage.waitForTimeout(500);
      const filepath = path.join(SCREENSHOTS_DIR, `landing_page_${vp.name}.png`);
      await initPage.screenshot({ path: filepath, fullPage: true });
      report.screenshotPaths.push(filepath);
    }

    // Click "Get started"
    console.log('   鼠标 Click "Get started" button on Landing page...');
    await initPage.click('button:has-text("Get started")');
    await initPage.waitForTimeout(1500);

    // Verify we are at /login
    const currentUrl = initPage.url();
    console.log(`   📍 Navigated URL: ${currentUrl}`);

    // Screenshot Login Selection Page
    for (const vp of VIEWPORTS) {
      await initPage.setViewportSize({ width: vp.width, height: vp.height });
      await initPage.waitForTimeout(500);
      const filepath = path.join(SCREENSHOTS_DIR, `login_selection_${vp.name}.png`);
      await initPage.screenshot({ path: filepath, fullPage: true });
      report.screenshotPaths.push(filepath);
    }

    // Test back navigation
    console.log('   鼠标 Click "Back to Podzo" button to return to Landing...');
    await initPage.click('button:has-text("Back to Podzo")');
    await initPage.waitForTimeout(1000);

  } catch (err) {
    console.error('❌ Landing/Login flow validation failed:', err);
    report.passedChecklist = false;
  } finally {
    await initContext.close();
  }

  // 2. Audit Role-Based logins & Dashboards
  for (const role of ROLES) {
    console.log(`\n🔑 Authenticating as: ${role.user} (${role.name.toUpperCase()}) via direct click...`);
    
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        console.error(`🚨 [Console Error] [${role.user}] ${text}`);
        report.consoleErrors.push({ role: role.user, error: text });
      }
    });

    page.on('response', response => {
      const status = response.status();
      if (status >= 400) {
        const url = response.url();
        console.error(`🚨 [Failed Network Request] [${role.user}] ${status} on ${url}`);
        report.failedRequests.push({ role: role.user, status, url });
      }
    });

    try {
      await page.goto('http://localhost:5173/login');
      await page.waitForTimeout(1000);
      
      // Click direct demo row button
      console.log(`   鼠标 Clicking demo selector button for ${role.user}...`);
      await page.click(`button.lp-demo-btn:has-text("${role.user}")`);
      await page.waitForTimeout(2000); // Allow direct login & redirect
      
      console.log(`   📍 Logged in successfully. Current URL: ${page.url()}`);

      // Visit each page in role list
      for (const p of role.pages) {
        console.log(`   📍 Visiting page: ${p.name} (${p.url})`);
        await page.goto(p.url);
        await page.waitForTimeout(1500);
        
        // Take screenshots for all viewports
        for (const vp of VIEWPORTS) {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.waitForTimeout(500);
          
          const filename = `${role.name}_${p.name}_${vp.name}.png`;
          const filepath = path.join(SCREENSHOTS_DIR, filename);
          await page.screenshot({ path: filepath, fullPage: true });
          report.screenshotPaths.push(filepath);
        }
      }

      // Test Sign Out redirection
      console.log('   鼠标 Testing logout redirection...');
      const signOutBtn = page.locator('text=Sign Out');
      if (await signOutBtn.isVisible()) {
        await signOutBtn.click();
        await page.click('button:has-text("Sign Out Now")');
        await page.waitForTimeout(2000);
        console.log(`   📍 Redirection verified. Signed out to URL: ${page.url()}`);
        if (!page.url().includes('/login')) {
          throw new Error(`Logout redirected to wrong URL: ${page.url()}`);
        }
      }

    } catch (err) {
      console.error(`❌ Audit failed for role ${role.user}:`, err);
      report.passedChecklist = false;
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('\n--- AUDIT RUN COMPLETED ---');
  console.log(`Generated ${report.screenshotPaths.length} screenshots.`);
  console.log(`Found ${report.consoleErrors.length} console errors.`);
  console.log(`Found ${report.failedRequests.length} failed network requests.`);

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'audit_report.json'),
    JSON.stringify(report, null, 2)
  );
  console.log(`Saved audit report to ${path.join(ARTIFACT_DIR, 'audit_report.json')}`);
}

runAudit();
