const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // TEST 1: Admin Login
    console.log('=== TEST 1: Admin Login ===');
    await page.goto('https://pos.gen-z.online/login', { timeout: 30000 });
    await page.fill('input[type="email"]', 'business.genzresturant@gmail.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    
    // Wait for either dashboard OR error
    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('LOGIN: ✅ PASS - Redirected to:', page.url());
    } catch(e) {
      // Maybe already on dashboard or error
      console.log('LOGIN: Current URL:', page.url());
      const bodyText = await page.locator('body').textContent();
      if (bodyText.includes('Invalid') || bodyText.includes('error')) {
        console.log('LOGIN: ❌ FAIL - Error on login');
      }
      await page.screenshot({ path: 'live_login_result.png' });
    }
    
    // Read header
    await page.waitForTimeout(2000);
    const url = page.url();
    if (url.includes('dashboard')) {
      // Read profile
      try {
        const headerBtn = page.locator('header button[aria-label="User menu"]');
        const headerText = await headerBtn.textContent();
        console.log('HEADER: Name shown:', headerText?.trim());
        
        await headerBtn.click();
        await page.waitForTimeout(500);
        
        const dropdown = page.locator('.animate-scale-in');
        const dropdownText = await dropdown.textContent({ timeout: 2000 });
        console.log('DROPDOWN:', dropdownText?.trim().replace(/\s+/g, ' '));
        await page.screenshot({ path: 'live_admin_dropdown.png' });
        
        // Close dropdown
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      } catch(e) {
        console.log('HEADER: Could not read -', e.message);
      }

      // TEST 2: Check dashboard tables
      console.log('\n=== TEST 2: Dashboard Tables ===');
      await page.screenshot({ path: 'live_dashboard.png' });
      const dashText = await page.locator('body').textContent();
      const hasTableSection = dashText.includes('Table') || dashText.includes('T1') || dashText.includes('AVAILABLE');
      console.log('TABLES: Visible on dashboard:', hasTableSection);

      // TEST 3: Navigate to bills page
      console.log('\n=== TEST 3: Bills Page ===');
      await page.goto('https://pos.gen-z.online/bills', { timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'live_bills.png' });
      console.log('BILLS: URL:', page.url());

      // TEST 4: Navigate to KDS
      console.log('\n=== TEST 4: KDS Page ===');
      await page.goto('https://pos.gen-z.online/kds', { timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'live_kds.png' });
      const kdsText = await page.locator('body').textContent();
      console.log('KDS: Page loaded, has content:', kdsText.length > 100);
      
      // TEST 5: Sign out, login as staff, check RBAC
      console.log('\n=== TEST 5: Staff RBAC ===');
      await page.goto('https://pos.gen-z.online/login', { timeout: 15000 });
      // Clear old session by going to signout API
      await page.goto('https://pos.gen-z.online/api/auth/signout', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);
      
      // Go to login page fresh
      await page.goto('https://pos.gen-z.online/login', { timeout: 15000 });
      await page.waitForTimeout(1000);
      await page.fill('input[type="email"]', 'staff@genz.com');
      await page.fill('input[type="password"]', 'Staff@123');
      await page.click('button[type="submit"]');
      
      try {
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        console.log('STAFF LOGIN: ✅ PASS');
        
        // Try settings
        await page.goto('https://pos.gen-z.online/settings', { timeout: 10000 });
        await page.waitForTimeout(3000);
        const settingsUrl = page.url();
        console.log('STAFF -> /settings: Final URL:', settingsUrl);
        console.log('STAFF RBAC SETTINGS:', settingsUrl.includes('dashboard') ? '✅ BLOCKED' : '❌ ACCESSIBLE');
        
        // Try reports
        await page.goto('https://pos.gen-z.online/reports', { timeout: 10000 });
        await page.waitForTimeout(3000);
        const reportsUrl = page.url();
        console.log('STAFF -> /reports: Final URL:', reportsUrl);
        console.log('STAFF RBAC REPORTS:', reportsUrl.includes('dashboard') ? '✅ BLOCKED' : '❌ ACCESSIBLE');
        
        // Try menu
        await page.goto('https://pos.gen-z.online/menu', { timeout: 10000 });
        await page.waitForTimeout(3000);
        const menuUrl = page.url();
        console.log('STAFF -> /menu: Final URL:', menuUrl);
        console.log('STAFF RBAC MENU:', menuUrl.includes('dashboard') ? '✅ BLOCKED' : '❌ ACCESSIBLE');
        
      } catch(e) {
        console.log('STAFF LOGIN: ❌ FAIL or timeout -', e.message);
      }
    }

  } catch (error) {
    console.error('FATAL:', error.message);
    await page.screenshot({ path: 'live_fatal_error.png' });
  } finally {
    await browser.close();
    console.log('\n=== DONE ===');
  }
})();
