const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    console.log('=== TESTING admin@genz.com / admin123 on live site ===');
    await page.goto('https://pos.gen-z.online/login', { timeout: 30000 });
    await page.fill('input[type="email"]', 'admin@genz.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('Admin Login: ✅ PASS - Redirected to:', page.url());
      await page.screenshot({ path: 'live_admin_success.png' });
    } catch(e) {
      console.log('Admin Login: ❌ FAIL - Current URL:', page.url());
      await page.screenshot({ path: 'live_admin_fail.png' });
    }

  } catch (error) {
    console.error('FATAL:', error.message);
  } finally {
    await browser.close();
    console.log('=== DONE ===');
  }
})();
