const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login as admin@genz.com (seeded)
  console.log('[1] Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'admin@genz.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:3000/dashboard', { timeout: 10000 });
  console.log('[1] Done');

  // Go to dashboard / POS
  console.log('[2] Navigating to POS...');
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'step_dashboard.png' });

  // Find a table - click Table 1
  console.log('[3] Clicking Table 1...');
  const tableCard = page.locator('text=T1').first();
  const t1Visible = await tableCard.isVisible().catch(() => false);
  if (!t1Visible) {
    console.log('[3] T1 not visible on dashboard, checking tables page...');
    await page.goto('http://localhost:3000/tables');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step_tables.png' });
    console.log('Tables page URL:', page.url());
  } else {
    await tableCard.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'step_after_t1_click.png' });
    console.log('[3] Clicked T1, URL now:', page.url());
  }

  await browser.close();
})();
