const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login');

  console.log('Logging in as staff@genz.com...');
  await page.fill('input[type="email"]', 'staff@genz.com');
  await page.fill('input[type="password"]', 'Staff@123');
  await page.click('button[type="submit"]');

  console.log('Waiting for dashboard...');
  await page.waitForURL('http://localhost:3000/dashboard', { timeout: 10000 });

  // Read header
  const userName = await page.locator('header span.text-xs.font-bold.text-foreground').first().textContent();
  
  // Click dropdown
  await page.click('header button[aria-label="User menu"]');
  await page.waitForSelector('.animate-scale-in');
  
  // Read dropdown
  const dropdownName = await page.locator('.animate-scale-in p.text-xs.font-black').first().textContent();
  const dropdownEmail = await page.locator('.animate-scale-in p.text-\\[10px\\]').first().textContent();
  const dropdownRole = await page.locator('.animate-scale-in p.text-\\[9px\\]').first().textContent();

  console.log({
    headerName: userName,
    dropdownName,
    dropdownEmail,
    dropdownRole
  });

  await browser.close();
})();
