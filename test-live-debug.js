const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  
  // Collect network responses for auth
  const authResponses = [];
  page.on('response', response => {
    if (response.url().includes('auth') || response.url().includes('csrf')) {
      authResponses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  try {
    await page.goto('https://pos.gen-z.online/login', { timeout: 30000 });
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="email"]', 'business.genzresturant@gmail.com');
    await page.fill('input[type="password"]', 'Admin@123');
    
    // Click and wait
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    console.log('Final URL:', page.url());
    console.log('\n--- Auth Network Responses ---');
    authResponses.forEach(r => console.log(`${r.status} ${r.url}`));
    console.log('\n--- Console Logs ---');
    consoleLogs.forEach(l => console.log(l));
    
    // Check for any error toast/message
    const bodyText = await page.locator('body').textContent();
    if (bodyText.includes('Invalid') || bodyText.includes('Error') || bodyText.includes('error') || bodyText.includes('CSRF')) {
      console.log('\n--- Error Text Found ---');
      // Extract around the error
      const idx = bodyText.toLowerCase().indexOf('error');
      if (idx >= 0) console.log(bodyText.substring(Math.max(0, idx - 50), idx + 100));
      const idx2 = bodyText.toLowerCase().indexOf('invalid');
      if (idx2 >= 0) console.log(bodyText.substring(Math.max(0, idx2 - 50), idx2 + 100));
    }
    
    await page.screenshot({ path: 'live_debug.png' });
    
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
