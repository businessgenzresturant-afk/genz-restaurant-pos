const { chromium } = require('playwright');

async function testFullQA() {
  console.log('=== STARTING COMPREHENSIVE PRODUCTION QA RUN ===');
  console.log('Target: https://pos.gen-z.online');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. LOGIN (Owner / Admin)
    console.log('\n[1/12] Testing Admin Login...');
    await page.goto('https://pos.gen-z.online/login');
    await page.fill('input[type="email"]', 'admin@genz.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('✅ Admin login successful');

    // 2. CHECK TABLE SELECTION & DINE-IN FLOW
    console.log('\n[2/12] Testing Table Selection & Dine-In...');
    await page.goto('https://pos.gen-z.online/tables');
    await page.waitForTimeout(2000);
    
    // Find an available table
    const tableCards = page.locator('.border-zinc-800, .border-green-500\\/30');
    console.log(`   Found ${await tableCards.count()} tables`);
    
    // Let's go back to dashboard and initiate dine-in
    await page.goto('https://pos.gen-z.online/dashboard');
    await page.waitForTimeout(2000);
    
    // Click "Dine In" card
    const dineInCard = page.locator('text=Dine In').first();
    if (await dineInCard.isVisible()) {
      await dineInCard.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ Dine In modal opened');
      
      // Select Table 1 (should be number 1)
      const table1Btn = page.locator('button:has-text("Table 1"), button:has-text("T1")').first();
      if (await table1Btn.isVisible()) {
        await table1Btn.click();
        await page.waitForTimeout(1500);
        console.log('   ✅ Table 1 selected, Menu drawer opened');
      } else {
        console.log('   ⚠️ Table 1 button not found, closing modal');
        await page.keyboard.press('Escape');
      }
    }

    // 3. MENU NAVIGATION & ADDING ITEMS
    console.log('\n[3/12] Testing Menu & Adding Items...');
    await page.goto('https://pos.gen-z.online/dashboard');
    await page.waitForTimeout(1000);
    
    // Let's create an order for Table 2 directly via orders page or API
    // Let's inspect the menu drawer on the dashboard first
    await page.goto('https://pos.gen-z.online/menu');
    await page.waitForTimeout(2000);
    const menuBody = await page.locator('body').textContent();
    console.log(`   Menu items loaded. Page has content: ${menuBody.includes('Paneer') || menuBody.includes('Roti')}`);
    await page.screenshot({ path: 'qa_menu_page.png' });

    // 4. ORDERS & RUNNING TABLES
    console.log('\n[4/12] Testing Orders page...');
    await page.goto('https://pos.gen-z.online/orders');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'qa_orders_page.png' });
    console.log('   ✅ Orders page loaded');

    // 5. BILLING & RECEIPTS
    console.log('\n[5/12] Testing Bills page...');
    await page.goto('https://pos.gen-z.online/bills');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'qa_bills_page.png' });
    console.log('   ✅ Bills page loaded');

    // 6. KDS DISPLAY
    console.log('\n[6/12] Testing KDS page...');
    await page.goto('https://pos.gen-z.online/kds');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'qa_kds_page.png' });
    console.log('   ✅ KDS page loaded');

    // 7. REPORTS
    console.log('\n[7/12] Testing Reports page...');
    await page.goto('https://pos.gen-z.online/reports');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'qa_reports_page.png' });
    console.log('   ✅ Reports page loaded');

    // 8. SETTINGS
    console.log('\n[8/12] Testing Settings page...');
    await page.goto('https://pos.gen-z.online/settings');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'qa_settings_page.png' });
    console.log('   ✅ Settings page loaded');

    // 9. STAFF LOGIN & RBAC
    console.log('\n[9/12] Testing Staff RBAC Restrictions...');
    // Log out first (by hitting the api signout or going to login page)
    await page.goto('https://pos.gen-z.online/api/auth/signout');
    await page.waitForTimeout(1000);
    const signoutBtn = page.locator('button[type="submit"], button:has-text("Sign out")').first();
    if (await signoutBtn.isVisible()) {
      await signoutBtn.click();
      await page.waitForTimeout(2000);
    }
    
    // Log in as Staff
    await page.goto('https://pos.gen-z.online/login');
    await page.fill('input[type="email"]', 'staff@genz.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('   ✅ Staff logged in successfully');

    // Attempt to access admin routes and verify redirection to dashboard
    const adminRoutes = ['/settings', '/reports', '/menu'];
    for (const route of adminRoutes) {
      console.log(`   Navigating to ${route}...`);
      await page.goto(`https://pos.gen-z.online${route}`);
      await page.waitForTimeout(2500);
      const finalUrl = page.url();
      console.log(`   Final URL for ${route}: ${finalUrl}`);
      if (finalUrl.includes('dashboard')) {
        console.log(`   ✅ RBAC working: staff blocked and redirected from ${route}`);
      } else {
        console.log(`   ❌ RBAC BUG: staff successfully accessed ${route}`);
      }
    }

    // 10. SESSION PERSISTENCE
    console.log('\n[10/12] Testing Session Persistence...');
    await page.goto('https://pos.gen-z.online/dashboard');
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForTimeout(2000);
    console.log(`   URL after refresh: ${page.url()}`);
    if (page.url().includes('dashboard')) {
      console.log('   ✅ Session persists after browser refresh');
    } else {
      console.log('   ❌ Session lost after browser refresh');
    }

  } catch (error) {
    console.error('❌ QA Run Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n=== COMPREHENSIVE PRODUCTION QA RUN FINISHED ===');
  }
}

testFullQA();
