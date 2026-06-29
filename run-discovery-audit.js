const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'https://pos.gen-z.online';

const routes = [
  '/dashboard',
  '/tables',
  '/orders',
  '/bills',
  '/menu',
  '/kds',
  '/reports',
  '/settings'
];

async function runAudit() {
  console.log('=== STARTING DISCOVERY AUDIT ===');
  const browser = await chromium.launch({ headless: true });
  
  const results = {
    admin: { errors: [], network: [], warnings: [], console: [] },
    staff: { errors: [], network: [], warnings: [], console: [] }
  };

  async function auditRole(role, email, password) {
    console.log(`\n--- Auditing Role: ${role.toUpperCase()} ---`);
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();
    
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      // Filter out expected framework noise
      if (text.includes('Download the React DevTools') || text.includes('HMR')) return;
      
      const entry = { page: page.url().replace(BASE, ''), text };
      
      if (type === 'error') {
        if (text.includes('Hydration') || text.includes('Minified React error')) {
          results[role].errors.push({ type: 'Hydration/React', ...entry });
        } else {
          results[role].errors.push({ type: 'Console Error', ...entry });
        }
      } else if (type === 'warning') {
        results[role].warnings.push({ type: 'Warning', ...entry });
      } else {
        results[role].console.push({ type: 'Log', ...entry });
      }
    });
    
    page.on('requestfailed', req => {
      const url = req.url();
      if (!url.includes('_next/static') && !url.includes('favicon.ico')) { 
        results[role].network.push({ 
          url: url.replace(BASE, ''), 
          error: req.failure()?.errorText
        });
      }
    });

    page.on('response', response => {
      if (response.status() >= 400) {
         results[role].network.push({ 
          url: response.url().replace(BASE, ''), 
          error: `HTTP ${response.status()}`,
          status: response.status()
        });
      }
    });

    console.log(`[${role}] Logging in...`);
    await page.goto(`${BASE}/login`);
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log(`[${role}] Logged in successfully.`);

    for (const route of routes) {
      console.log(`[${role}] Visiting ${route}...`);
      await page.goto(`${BASE}${route}`);
      await page.waitForTimeout(3000); // Allow time for hydration and data fetching
      
      // Basic interaction to trigger hidden issues
      try {
        if (route === '/dashboard') {
          // Try opening some modals
          const dineIn = page.locator('text=Dine In').first();
          if (await dineIn.isVisible()) await dineIn.click();
          await page.waitForTimeout(500);
          await page.keyboard.press('Escape');
        } else if (route === '/menu') {
          const addBtn = page.locator('text=Add New Item').first();
          if (await addBtn.isVisible()) await addBtn.click();
          await page.waitForTimeout(500);
          await page.keyboard.press('Escape');
        }
      } catch (e) {
        // Ignore interaction errors during automated sweep
      }
    }
    
    await context.close();
  }

  await auditRole('admin', 'admin@genz.com', 'admin123');
  await auditRole('staff', 'staff@genz.com', 'staff123');
  
  await browser.close();
  
  fs.writeFileSync('discovery_results.json', JSON.stringify(results, null, 2));
  console.log('\n=== DISCOVERY AUDIT COMPLETE ===');
  console.log('Results saved to discovery_results.json');
}

runAudit().catch(console.error);
