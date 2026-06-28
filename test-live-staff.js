const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    console.log('=== TESTING staff@genz.com / staff123 on live site ===');
    await page.goto('https://pos.gen-z.online/login', { timeout: 30000 });
    await page.fill('input[type="email"]', 'staff@genz.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('Staff Login: ✅ PASS - Redirected to:', page.url());
      await page.screenshot({ path: 'live_staff_success.png' });
      
      // Click profile dropdown
      const headerBtn = page.locator('header button[aria-label="User menu"]');
      const headerText = await headerBtn.textContent();
      console.log('HEADER: Name shown:', headerText?.trim());
      
      await headerBtn.click();
      await page.waitForTimeout(1000);
      
      const dropdown = page.locator('.animate-scale-in');
      const dropdownText = await dropdown.textContent({ timeout: 5000 });
      console.log('DROPDOWN TEXT:\n', dropdownText?.trim());
      await page.screenshot({ path: 'live_staff_dropdown.png' });
    } catch(e) {
      console.log('Staff Login: ❌ FAIL - Current URL:', page.url(), e.message);
      await page.screenshot({ path: 'live_staff_fail.png' });
    }

  } catch (error) {
    console.error('FATAL:', error.message);
  } finally {
    await browser.close();
    console.log('=== DONE ===');
  }
})();
