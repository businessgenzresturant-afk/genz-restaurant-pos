const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'https://pos.gen-z.online';

// This script does deep testing: billing, KDS interactions, API health
async function deepTest() {
  console.log('=== DEEP PRODUCTION TEST ===\n');
  const browser = await chromium.launch({ headless: true });
  const results = { bugs: [], passes: [] };

  function pass(label) { results.passes.push(label); console.log(`✅ ${label}`); }
  function fail(label, detail) { results.bugs.push({ label, detail }); console.log(`❌ ${label}: ${detail}`); }
  function warn(label) { console.log(`⚠️  ${label}`); }

  // Login as admin
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  const apiErrors = [];
  page.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('_next')) {
      apiErrors.push({ url: res.url().replace(BASE, ''), status: res.status() });
    }
  });

  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@genz.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  pass('Admin Login');

  // ======================================================
  // TEST: API Health Check (direct API calls via browser)
  // ======================================================
  console.log('\n--- API Health Check ---');
  const apis = [
    '/api/tables', '/api/orders', '/api/menu', '/api/bills',
    '/api/reports', '/api/settings'
  ];
  for (const api of apis) {
    const res = await page.evaluate(async (url) => {
      const r = await fetch(url);
      return { status: r.status, ok: r.ok };
    }, api);
    if (res.ok) {
      pass(`API ${api} → ${res.status}`);
    } else {
      fail(`API ${api}`, `HTTP ${res.status}`);
    }
  }

  // ======================================================
  // TEST: Reports API returns correct data structure
  // ======================================================
  console.log('\n--- Reports Data Structure ---');
  const reportsData = await page.evaluate(async () => {
    const r = await fetch('/api/reports');
    return r.json();
  });
  const hasReportFields = 'dailySalesTotal' in reportsData || 'totalOrders' in reportsData || 'totalRevenue' in reportsData;
  if (hasReportFields) {
    pass(`Reports API returns valid data: ${JSON.stringify(Object.keys(reportsData))}`);
  } else {
    fail('Reports API', `Missing expected fields. Got: ${JSON.stringify(Object.keys(reportsData || {}))}`);
  }

  // ======================================================
  // TEST: Settings API
  // ======================================================
  console.log('\n--- Settings Data ---');
  const settingsData = await page.evaluate(async () => {
    const r = await fetch('/api/settings');
    return r.ok ? r.json() : null;
  });
  if (settingsData && (settingsData.restaurantName || settingsData.restaurant_name || settingsData.name)) {
    pass(`Settings loaded: "${settingsData.restaurantName || settingsData.restaurant_name || settingsData.name}"`);
  } else {
    warn(`Settings returned: ${JSON.stringify(Object.keys(settingsData || {}))}`);
  }

  // ======================================================
  // TEST: Bills Page Stability
  // ======================================================
  console.log('\n--- Bills Page ---');
  await page.goto(`${BASE}/bills`);
  await page.waitForTimeout(5000);
  const billsLoaded = !page.url().includes('/login');
  if (billsLoaded) {
    const billsContent = await page.textContent('body');
    if (billsContent.includes('Bills') || billsContent.includes('Invoice')) {
      pass('Bills page loaded correctly');
    } else {
      fail('Bills page', 'Page loaded but no bills content found');
    }
    // Check for error state
    if (billsContent.includes('Failed to load') || billsContent.includes('Error')) {
      fail('Bills page', 'Error state visible to user');
    } else {
      pass('Bills page: No error state shown');
    }
  } else {
    fail('Bills page', 'Redirected to login — session issue');
  }
  await page.screenshot({ path: 'qa_bills_deep.png' });

  // ======================================================
  // TEST: KDS with Interaction
  // ======================================================
  console.log('\n--- KDS Page (with interaction) ---');
  await page.goto(`${BASE}/kds`);
  await page.waitForTimeout(2000);

  // KDS needs a click to start
  const kdsBody = await page.textContent('body');
  if (kdsBody.includes('Click') || kdsBody.includes('Tap')) {
    await page.click('body');
    await page.waitForTimeout(4000);
  }

  await page.screenshot({ path: 'qa_kds_interacted.png' });
  const kdsAfterClick = await page.textContent('body');
  if (kdsAfterClick.includes('Accept') || kdsAfterClick.includes('Preparing') || kdsAfterClick.includes('Kitchen')) {
    pass('KDS shows order cards after interaction');
  } else if (kdsAfterClick.includes('No Orders') || kdsAfterClick.includes('no pending')) {
    pass('KDS is interactive but no pending orders at this moment (expected)');
  } else {
    warn('KDS state ambiguous — check screenshot qa_kds_interacted.png');
  }

  // ======================================================
  // TEST: Table Status via API
  // ======================================================
  console.log('\n--- Table State via API ---');
  const tableData = await page.evaluate(async () => {
    const r = await fetch('/api/tables');
    return r.json();
  });
  if (Array.isArray(tableData)) {
    const occupied = tableData.filter(t => t.status === 'OCCUPIED');
    const available = tableData.filter(t => t.status === 'AVAILABLE');
    pass(`Tables API: ${tableData.length} total, ${occupied.length} occupied, ${available.length} available`);
    
    // Check T10 from previous test
    const t10 = tableData.find(t => t.number === 10);
    if (t10) {
      pass(`Table T10 status: ${t10.status}`);
    }
  } else {
    fail('Tables API', 'Did not return array');
  }

  // ======================================================
  // TEST: Orders API
  // ======================================================
  console.log('\n--- Orders via API ---');
  const ordersData = await page.evaluate(async () => {
    const r = await fetch('/api/orders');
    return r.json();
  });
  if (Array.isArray(ordersData)) {
    const pending = ordersData.filter(o => o.status === 'PENDING');
    const preparing = ordersData.filter(o => o.status === 'PREPARING');
    const completed = ordersData.filter(o => o.status === 'COMPLETED');
    pass(`Orders API: total=${ordersData.length}, pending=${pending.length}, preparing=${preparing.length}, completed=${completed.length}`);
  } else {
    fail('Orders API', 'Did not return array');
  }

  // ======================================================
  // TEST: Menu API
  // ======================================================
  console.log('\n--- Menu via API ---');
  const menuData = await page.evaluate(async () => {
    const r = await fetch('/api/menu');
    return r.json();
  });
  if (Array.isArray(menuData)) {
    pass(`Menu API: ${menuData.length} items`);
    // Check for required fields
    if (menuData.length > 0) {
      const item = menuData[0];
      const hasFields = item.name && typeof item.price !== 'undefined';
      if (hasFields) {
        pass(`Menu item structure valid: name="${item.name}", price=${item.price}`);
      } else {
        fail('Menu item structure', `Missing fields: ${JSON.stringify(Object.keys(item))}`);
      }
    }
  } else {
    fail('Menu API', 'Did not return array');
  }

  // ======================================================
  // TEST: KDS Orders API
  // ======================================================
  console.log('\n--- KDS Orders API ---');
  const kdsOrders = await page.evaluate(async () => {
    const r = await fetch('/api/kds-orders?restaurantId=00000000-0000-0000-0000-000000000001&status=PENDING,PREPARING');
    return { status: r.status, data: await r.json() };
  });
  if (kdsOrders.status === 200) {
    pass(`KDS Orders API: ${JSON.stringify(Array.isArray(kdsOrders.data) ? kdsOrders.data.length : kdsOrders.data)} orders`);
  } else {
    fail('KDS Orders API', `HTTP ${kdsOrders.status}`);
  }

  // ======================================================
  // TEST: Bills API structure
  // ======================================================
  console.log('\n--- Bills API ---');
  const billsApiData = await page.evaluate(async () => {
    const r = await fetch('/api/bills');
    return { status: r.status, body: await r.json() };
  });
  if (billsApiData.status === 200) {
    const bills = billsApiData.body.data ?? billsApiData.body;
    pass(`Bills API: ${Array.isArray(bills) ? bills.length : '?'} bills`);
  } else {
    fail('Bills API', `HTTP ${billsApiData.status}`);
  }

  // ======================================================
  // TEST: Settings Page UI
  // ======================================================
  console.log('\n--- Settings Page UI ---');
  await page.goto(`${BASE}/settings`);
  await page.waitForTimeout(4000);
  const settingsPage = await page.textContent('body');
  if (settingsPage.includes('Restaurant Information')) {
    pass('Settings page: Restaurant Information section visible');
  } else {
    fail('Settings page', 'Restaurant Information section not found');
  }
  if (settingsPage.includes('Tax') || settingsPage.includes('GST')) {
    pass('Settings page: Tax/GST section visible');
  } else {
    warn('Settings page: Tax/GST section not found');
  }
  await page.screenshot({ path: 'qa_settings_deep.png' });

  // ======================================================
  // TEST: Reports Page and Data
  // ======================================================
  console.log('\n--- Reports Page ---');
  await page.goto(`${BASE}/reports`);
  await page.waitForTimeout(3000);
  const reportsPage = await page.textContent('body');
  if (reportsPage.includes('Sales') || reportsPage.includes('Report')) {
    pass('Reports page: Content loaded');
    // Try generating a report
    try {
      await page.click('text=Generate Report');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'qa_reports_deep.png' });
      pass('Reports: Generate Report clicked successfully');
    } catch (e) {
      warn(`Reports: Could not click Generate Report: ${e.message.substring(0, 60)}`);
    }
  } else {
    fail('Reports page', 'No recognizable content');
  }

  // ======================================================
  // TEST: Orders Page
  // ======================================================
  console.log('\n--- Orders Page ---');
  await page.goto(`${BASE}/orders`);
  await page.waitForTimeout(4000);
  const ordersPage = await page.textContent('body');
  const hasOrderContent = ordersPage.includes('Order') || ordersPage.includes('History');
  if (hasOrderContent) {
    pass('Orders page: Content loaded');
  } else {
    fail('Orders page', 'No order content found');
  }
  await page.screenshot({ path: 'qa_orders_deep.png' });

  // ======================================================
  // SUMMARY
  // ======================================================
  await ctx.close();
  await browser.close();

  console.log('\n\n==============================');
  console.log(`PASS: ${results.passes.length}`);
  console.log(`FAIL: ${results.bugs.length}`);
  console.log('==============================');
  if (results.bugs.length > 0) {
    console.log('\nBUGS FOUND:');
    results.bugs.forEach((b, i) => console.log(`  ${i+1}. [${b.label}] ${b.detail}`));
  }

  // API errors caught via response listener
  const realApiErrors = apiErrors.filter(e => !e.url.includes('?_rsc='));
  if (realApiErrors.length > 0) {
    console.log('\nAPI ERRORS (response listener):');
    realApiErrors.forEach(e => console.log(`  [${e.status}] ${e.url}`));
  } else {
    console.log('\n✅ Zero API 4xx/5xx errors via response listener');
  }

  fs.writeFileSync('deep_test_results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to deep_test_results.json');
}

deepTest().catch(console.error);
