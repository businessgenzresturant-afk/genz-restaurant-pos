const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Logging in as staff@genz.com...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'staff@genz.com');
  await page.fill('input[type="password"]', 'Staff@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:3000/dashboard', { timeout: 10000 });

  const testRoutes = [
    '/settings',
    '/menu',
    '/reports',
    '/admin/seed'
  ];

  const results = {};

  for (const route of testRoutes) {
    console.log(`Testing route: ${route}`);
    const response = await page.goto(`http://localhost:3000${route}`);
    await page.waitForTimeout(1000); // Wait for potential client-side redirects
    results[route] = {
      status: response.status(),
      finalUrl: page.url()
    };
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
