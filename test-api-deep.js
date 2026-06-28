// Thorough production QA using Playwright browser with wait-for-data
const { chromium } = require('playwright');

const BASE = 'https://pos.gen-z.online';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  
  // Collect console errors
  const consoleErrors = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ page: page.url(), text: msg.text().substring(0, 200) });
    }
  });
  
  page.on('requestfailed', req => {
    networkErrors.push({ url: req.url().substring(0, 100), error: req.failure()?.errorText });
  });
  
  console.log('=== THOROUGH PRODUCTION QA ===');
  console.log('Target:', BASE, '\n');
  
  // ===== 1. ADMIN LOGIN =====
  console.log('[1] Admin Login...');
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@genz.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('   ✅ Admin login successful\n');
  
  // ===== 2. DASHBOARD =====
  console.log('[2] Dashboard...');
  await page.waitForTimeout(3000); // Let dashboard fully load
  const dashText = await page.textContent('body');
  const hasDashContent = dashText.includes('Total Orders') || dashText.includes('Revenue') || dashText.includes('Today') || dashText.includes('Dashboard');
  console.log('   Dashboard has stats:', hasDashContent ? '✅' : '❌');
  await page.screenshot({ path: 'qa_deep_dashboard.png' });
  
  // ===== 3. TABLES =====
  console.log('[3] Tables...');
  await page.goto(`${BASE}/tables`);
  await page.waitForTimeout(3000);
  const tablesText = await page.textContent('body');
  const hasTables = tablesText.includes('Table') || tablesText.includes('T1') || tablesText.includes('T2');
  console.log('   Tables loaded:', hasTables ? '✅' : '❌');
  await page.screenshot({ path: 'qa_deep_tables.png' });
  
  // ===== 4. MENU (admin) =====
  console.log('[4] Menu (admin)...');
  await page.goto(`${BASE}/menu`);
  // Wait for spinner to disappear OR menu items to appear
  try {
    await page.waitForFunction(() => {
      const body = document.body.textContent || '';
      return body.includes('Menu Management') && !body.includes('Loading delicious menu');
    }, { timeout: 15000 });
    const menuText = await page.textContent('body');
    const itemCount = menuText.match(/Showing (\d+)/)?.[1] || '0';
    console.log('   ✅ Menu loaded with', itemCount, 'items');
  } catch {
    const menuText = await page.textContent('body');
    const stillLoading = menuText.includes('Loading delicious menu');
    const hasError = menuText.includes('Error') || menuText.includes('Failed');
    console.log('   ❌ Menu stuck:', stillLoading ? 'STILL LOADING' : hasError ? 'ERROR' : 'UNKNOWN');
  }
  await page.screenshot({ path: 'qa_deep_menu.png' });
  
  // ===== 5. ORDERS =====
  console.log('[5] Orders...');
  await page.goto(`${BASE}/orders`);
  try {
    await page.waitForFunction(() => {
      return (document.body.textContent || '').includes('Order History');
    }, { timeout: 10000 });
    const ordersText = await page.textContent('body');
    const allCount = ordersText.match(/ALL\s*(\d+)/)?.[1] || '?';
    const pendingCount = ordersText.match(/PENDING\s*(\d+)/)?.[1] || '?';
    const completedCount = ordersText.match(/COMPLETED\s*(\d+)/)?.[1] || '?';
    console.log(`   ✅ Orders: ALL=${allCount}, PENDING=${pendingCount}, COMPLETED=${completedCount}`);
  } catch {
    console.log('   ❌ Orders page did not load');
  }
  await page.screenshot({ path: 'qa_deep_orders.png' });
  
  // ===== 6. BILLS =====
  console.log('[6] Bills...');
  await page.goto(`${BASE}/bills`);
  try {
    await page.waitForFunction(() => {
      const body = document.body.textContent || '';
      return !body.includes('Loading...') && body.includes('Bills');
    }, { timeout: 15000 });
    console.log('   ✅ Bills page loaded');
  } catch {
    const billsText = await page.textContent('body');
    const stillLoading = billsText.includes('Loading...');
    console.log('   ❌ Bills stuck:', stillLoading ? 'STILL LOADING' : 'UNKNOWN');
  }
  await page.screenshot({ path: 'qa_deep_bills.png' });
  
  // ===== 7. REPORTS =====
  console.log('[7] Reports...');
  await page.goto(`${BASE}/reports`);
  await page.waitForTimeout(2000);
  const reportsText = await page.textContent('body');
  const hasReports = reportsText.includes('Sales & Reports') || reportsText.includes('Generate Report');
  console.log('   Reports loaded:', hasReports ? '✅' : '❌');
  await page.screenshot({ path: 'qa_deep_reports.png' });
  
  // ===== 8. SETTINGS =====
  console.log('[8] Settings...');
  await page.goto(`${BASE}/settings`);
  await page.waitForTimeout(3000);
  const settingsText = await page.textContent('body');
  const hasSettings = settingsText.includes('Restaurant Information') || settingsText.includes('GenZ Restaurant');
  console.log('   Settings loaded:', hasSettings ? '✅' : '❌');
  await page.screenshot({ path: 'qa_deep_settings.png' });
  
  // ===== 9. KDS =====
  console.log('[9] KDS...');
  await page.goto(`${BASE}/kds`);
  await page.waitForTimeout(2000);
  const kdsText = await page.textContent('body');
  const hasKDS = kdsText.includes('KDS') || kdsText.includes('Kitchen') || kdsText.includes('Click anywhere');
  console.log('   KDS loaded:', hasKDS ? '✅' : '❌');
  await page.screenshot({ path: 'qa_deep_kds.png' });
  
  // ===== 10. TABLE SELECTION → ORDER FLOW =====
  console.log('[10] Full Order Flow...');
  await page.goto(`${BASE}/tables`);
  await page.waitForTimeout(3000);
  // Click first available table
  const tableCards = await page.locator('[class*="table"], [class*="Table"]').all();
  console.log('   Found', tableCards.length, 'table elements');
  // Try clicking a table button
  const tableButton = page.locator('text=Available').first();
  if (await tableButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tableButton.click();
    await page.waitForTimeout(2000);
    console.log('   Clicked available table, URL:', page.url());
    await page.screenshot({ path: 'qa_deep_table_selected.png' });
  } else {
    console.log('   No available table found');
  }
  
  // ===== 11. SESSION PERSISTENCE =====
  console.log('[11] Session Persistence...');
  await page.goto(`${BASE}/dashboard`);
  await page.waitForTimeout(2000);
  const isStillLoggedIn = page.url().includes('/dashboard');
  console.log('   Session persists:', isStillLoggedIn ? '✅' : '❌');
  
  // ===== 12. LOGOUT =====
  console.log('[12] Logout...');
  try {
    // Look for user dropdown
    const userMenu = page.locator('text=Admin User').first();
    if (await userMenu.isVisible({ timeout: 3000 })) {
      await userMenu.click();
      await page.waitForTimeout(500);
      const logoutBtn = page.locator('text=Logout').first();
      if (await logoutBtn.isVisible({ timeout: 2000 })) {
        await logoutBtn.click();
        await page.waitForTimeout(3000);
        console.log('   Logout URL:', page.url());
        const onLogin = page.url().includes('/login') || page.url() === BASE + '/';
        console.log('   Logout successful:', onLogin ? '✅' : '❌');
      } else {
        console.log('   Logout button not found');
      }
    } else {
      console.log('   User menu not found');
    }
  } catch (e) {
    console.log('   Logout test error:', e.message);
  }
  
  // ===== 13. STAFF LOGIN + RBAC =====
  console.log('[13] Staff RBAC...');
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'staff@genz.com');
  await page.fill('input[type="password"]', 'staff123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('   ✅ Staff login successful');
  
  // Test blocked routes
  for (const route of ['/settings', '/reports', '/menu']) {
    await page.goto(`${BASE}${route}`);
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    const blocked = finalUrl.includes('/dashboard');
    console.log(`   ${route}: ${blocked ? '✅ BLOCKED' : '❌ ACCESSIBLE'} (→ ${finalUrl.replace(BASE, '')})`);
  }
  
  // Test accessible routes for staff
  for (const route of ['/orders', '/bills', '/kds', '/tables']) {
    await page.goto(`${BASE}${route}`);
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    const accessible = finalUrl.includes(route);
    console.log(`   ${route}: ${accessible ? '✅ ACCESSIBLE' : '❌ BLOCKED'} (→ ${finalUrl.replace(BASE, '')})`);
  }
  
  // ===== SUMMARY =====
  console.log('\n--- Console Errors ---');
  if (consoleErrors.length === 0) {
    console.log('   None! ✅');
  } else {
    for (const e of consoleErrors.slice(0, 10)) {
      console.log(`   [${e.page.replace(BASE, '')}]: ${e.text.substring(0, 100)}`);
    }
    if (consoleErrors.length > 10) console.log(`   ... and ${consoleErrors.length - 10} more`);
  }
  
  console.log('\n--- Network Errors ---');
  if (networkErrors.length === 0) {
    console.log('   None! ✅');
  } else {
    for (const e of networkErrors.slice(0, 10)) {
      console.log(`   ${e.url}: ${e.error}`);
    }
  }
  
  await browser.close();
  console.log('\n=== QA COMPLETE ===');
}

run().catch(console.error);
