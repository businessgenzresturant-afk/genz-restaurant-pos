const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Try seeded admin
  console.log('Trying admin@genz.com / admin123...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'admin@genz.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  const url1 = page.url();
  console.log('Result URL:', url1);
  
  if (url1.includes('dashboard')) {
    // Check tables
    await page.goto('http://localhost:3000/tables');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tables_seeded.png' });
    console.log('Tables page screenshot saved');
    
    const bodyText = await page.locator('body').textContent();
    console.log('Has tables:', !bodyText.includes('No tables found'));
  }

  await browser.close();
})();
