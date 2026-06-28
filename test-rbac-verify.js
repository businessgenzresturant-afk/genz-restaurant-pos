const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login as STAFF
  console.log('Logging in as staff@genz.com...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'staff@genz.com');
  await page.fill('input[type="password"]', 'Staff@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:3000/dashboard', { timeout: 10000 });
  console.log('Staff logged in.');

  const adminRoutes = ['/settings', '/menu', '/reports'];
  const results = {};

  for (const route of adminRoutes) {
    console.log(`Testing staff access to: ${route}`);
    await page.goto(`http://localhost:3000${route}`);
    // Wait for redirect if any
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    const redirected = !finalUrl.includes(route);
    results[route] = { finalUrl, redirected };
    console.log(`  -> Final URL: ${finalUrl} (redirected=${redirected})`);
  }

  console.log('\n=== RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
  
  const allRedirected = Object.values(results).every((r) => r.redirected);
  console.log(`\nAll admin routes blocked for staff: ${allRedirected ? '✅ PASS' : '❌ FAIL'}`);

  await browser.close();
})();
