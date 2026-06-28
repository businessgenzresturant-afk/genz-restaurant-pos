const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login as Admin
  console.log('Logging in as Admin...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'business.genzresturant@gmail.com');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:3000/dashboard', { timeout: 10000 });
  console.log('Admin logged in.');

  // Go to tables
  await page.goto('http://localhost:3000/tables');
  await page.waitForTimeout(2000);
  
  // Count total available tables
  const tableTitles = await page.locator('[data-table-id], [class*="table"]').count();
  console.log(`Found ${tableTitles} table elements`);
  
  // Find an AVAILABLE table and click it
  const tableText = await page.locator('text=AVAILABLE').first().isVisible().catch(() => false);
  console.log(`AVAILABLE table visible: ${tableText}`);
  
  // Check table status labels
  const statuses = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const statusTexts = [];
    elements.forEach(el => {
      const text = el.textContent?.trim();
      if (['AVAILABLE', 'OCCUPIED', 'RUNNING', 'BILLING'].includes(text || '')) {
        statusTexts.push(text);
      }
    });
    return [...new Set(statusTexts)];
  });
  console.log('Table statuses found:', statuses);
  
  // Take screenshot of tables page
  await page.screenshot({ path: 'tables_state.png' });
  console.log('Screenshot saved as tables_state.png');

  await browser.close();
})();
