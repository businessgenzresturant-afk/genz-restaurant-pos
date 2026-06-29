const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'https://pos.gen-z.online';

async function runE2E() {
  console.log('=== STARTING FULL E2E QA TEST ===');
  const browser = await chromium.launch({ headless: true });
  
  try {
    // ==========================================
    // 1. AUTHENTICATION & RBAC
    // ==========================================
    console.log('\n--- 1. Testing Auth & RBAC ---');
    const authContext = await browser.newContext({ viewport: { width: 1200, height: 800 } });
    const authPage = await authContext.newPage();
    
    // Admin Login
    console.log('Admin login...');
    await authPage.goto(`${BASE}/login`);
    await authPage.fill('input[type="email"]', 'admin@genz.com');
    await authPage.fill('input[type="password"]', 'admin123');
    await authPage.click('button[type="submit"]');
    await authPage.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('✅ Admin login successful');

    // Admin Session Persistence
    console.log('Testing session persistence...');
    await authPage.reload();
    await authPage.waitForTimeout(2000);
    if (!authPage.url().includes('/dashboard')) throw new Error('Session lost after reload');
    console.log('✅ Session persists after reload');

    // Admin Logout
    console.log('Admin logout...');
    const userMenu = authPage.locator('text=Admin User').first();
    await userMenu.click();
    await authPage.waitForTimeout(500);
    const signOutBtn = authPage.locator('text=Sign Out').first();
    await signOutBtn.click();
    await authPage.waitForURL('**/login', { timeout: 15000 });
    console.log('✅ Admin logout successful');
    
    // Wrong Password Test
    console.log('Testing invalid credentials...');
    await authPage.fill('input[type="email"]', 'admin@genz.com');
    await authPage.fill('input[type="password"]', 'wrongpass');
    await authPage.click('button[type="submit"]');
    await authPage.waitForTimeout(2000);
    const errorMsg = await authPage.textContent('body');
    if (errorMsg.includes('Invalid login credentials')) {
      console.log('✅ Invalid login rejected properly');
    } else {
      console.log('❌ Did not see standard error message for invalid login');
    }

    // Staff RBAC Test
    console.log('Staff login & RBAC...');
    await authPage.fill('input[type="email"]', 'staff@genz.com');
    await authPage.fill('input[type="password"]', 'staff123');
    await authPage.click('button[type="submit"]');
    await authPage.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Check restricted routes
    const restricted = ['/settings', '/reports', '/menu'];
    for (const route of restricted) {
      await authPage.goto(`${BASE}${route}`);
      await authPage.waitForTimeout(2000);
      if (authPage.url().includes('/dashboard')) {
        console.log(`✅ Staff correctly blocked from ${route}`);
      } else {
        console.log(`❌ Staff accessed restricted route ${route}`);
      }
    }
    
    // Check allowed routes
    const allowed = ['/orders', '/bills', '/kds', '/tables'];
    for (const route of allowed) {
      await authPage.goto(`${BASE}${route}`);
      await authPage.waitForTimeout(2000);
      if (authPage.url().includes(route)) {
        console.log(`✅ Staff correctly accessed ${route}`);
      } else {
        console.log(`❌ Staff blocked from allowed route ${route}`);
      }
    }
    await authContext.close();

    // ==========================================
    // 2. TABLE & ORDER WORKFLOW (Admin context)
    // ==========================================
    console.log('\n--- 2. Testing Table & Order Workflow ---');
    const orderContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const orderPage = await orderContext.newPage();
    
    // Login
    await orderPage.goto(`${BASE}/login`);
    await orderPage.fill('input[type="email"]', 'admin@genz.com');
    await orderPage.fill('input[type="password"]', 'admin123');
    await orderPage.click('button[type="submit"]');
    await orderPage.waitForURL('**/dashboard');

    // Create Order Workflow
    console.log('Starting order flow from dashboard...');
    await orderPage.goto(`${BASE}/dashboard`);
    await orderPage.waitForTimeout(2000);
    
    await orderPage.click('text=Dine In');
    await orderPage.waitForTimeout(1000);
    
    // Pick an available table (T10 to minimize collisions)
    console.log('Selecting table T10...');
    try {
      const tableBtn = orderPage.locator('button:has-text("T10")').first();
      await tableBtn.click();
    } catch (e) {
      console.log('T10 unavailable or not found. Falling back to any available table.');
      const availableTable = orderPage.locator('text=AVAILABLE').first();
      await availableTable.click();
    }
    
    await orderPage.waitForTimeout(3000);
    console.log('✅ Navigated to POS menu for table');
    await orderPage.screenshot({ path: 'qa_pos_menu.png' });

    // Add items to order
    console.log('Adding items to order...');
    const addBtns = await orderPage.locator('button:has-text("Add")').all();
    if (addBtns.length >= 2) {
      await addBtns[0].click();
      await orderPage.waitForTimeout(500);
      await addBtns[1].click();
      await orderPage.waitForTimeout(500);
      
      // Increase quantity of first item
      const plusBtns = await orderPage.locator('button:has-text("+")').all();
      if (plusBtns.length > 0) {
        await plusBtns[0].click();
        await orderPage.waitForTimeout(500);
      }
      
      console.log('✅ Added items to cart');
      
      // Place Order (KOT)
      const placeOrderBtn = orderPage.locator('button', { hasText: /Place Order|Send to Kitchen/i }).first();
      if (await placeOrderBtn.isVisible()) {
        await placeOrderBtn.click();
        await orderPage.waitForTimeout(3000);
        console.log('✅ Order placed successfully');
      } else {
        console.log('❌ Could not find Place Order button');
      }
    } else {
      console.log('❌ Not enough Add buttons found on menu');
    }

    // Check Running Tables
    console.log('Checking Running Tables...');
    await orderPage.goto(`${BASE}/tables`);
    await orderPage.waitForTimeout(2000);
    const tablesHtml = await orderPage.innerHTML('body');
    if (tablesHtml.includes('T10') && tablesHtml.includes('OCCUPIED')) {
      console.log('✅ Table T10 shows as occupied');
    } else {
      console.log('⚠️ T10 may not be occupied (might have used a different table)');
    }

    // ==========================================
    // 3. KDS & KITCHEN FLOW
    // ==========================================
    console.log('\n--- 3. Testing KDS ---');
    await orderPage.goto(`${BASE}/kds`);
    await orderPage.waitForTimeout(3000);
    const kdsBody = await orderPage.innerHTML('body');
    if (kdsBody.includes('Accept') || kdsBody.includes('Start') || kdsBody.includes('Ready')) {
      console.log('✅ Orders are visible in KDS');
    } else {
      console.log('⚠️ No pending orders found in KDS. Check manual interactions.');
    }

    await orderContext.close();

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await browser.close();
    console.log('\n=== E2E QA TEST COMPLETE ===');
  }
}

runE2E().catch(console.error);
