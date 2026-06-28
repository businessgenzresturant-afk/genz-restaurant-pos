const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    console.log('[1] Navigating to live login page...');
    await page.goto('https://pos.gen-z.online/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'live_login.png' });
    console.log('Login page loaded. Screenshot saved.');

    console.log('[2] Logging in as admin...');
    await page.fill('input[type="email"]', 'business.genzresturant@gmail.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.screenshot({ path: 'live_login_filled.png' });
    
    // Click submit button
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForURL('**/dashboard', { timeout: 15000 })
    ]);
    
    console.log('[3] Logged in successfully! Current URL:', page.url());
    await page.screenshot({ path: 'live_dashboard.png' });

    // Read header details
    const headerText = await page.locator('header').textContent();
    console.log('Header text:', headerText.trim().replace(/\s+/g, ' '));

    // Open profile dropdown
    await page.click('header button[aria-label="User menu"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'live_profile_dropdown.png' });
    console.log('Profile dropdown screenshot saved.');

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'live_error.png' });
  } finally {
    await browser.close();
  }
})();
