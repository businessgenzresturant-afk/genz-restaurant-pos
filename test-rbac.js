/**
 * RBAC Testing Script
 * Tests backend role-based access control implementation
 * 
 * Usage: node test-rbac.js
 * 
 * Prerequisites:
 * 1. App must be running (npm run dev)
 * 2. Admin account: admin@genz.com / admin123
 * 3. Staff account: staff@genz.com / staff123
 */

const BASE_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper to login and get session cookie
async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include'
  });
  
  // NextAuth uses a different callback flow, so let's use signIn directly
  const signInResponse = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      callbackUrl: '/dashboard',
      json: true
    })
  });
  
  const cookies = signInResponse.headers.get('set-cookie');
  return cookies;
}

// Test cases
const tests = [
  {
    name: 'STAFF cannot apply discount',
    role: 'STAFF',
    email: 'staff@genz.com',
    test: async (cookie) => {
      // Assume there's a pending bill in the system
      const billsResponse = await fetch(`${BASE_URL}/api/bills`, {
        headers: { Cookie: cookie }
      });
      const bills = await billsResponse.json();
      
      if (!bills || bills.length === 0) {
        return { skip: true, reason: 'No bills found to test' };
      }
      
      const testBill = bills.find(b => b.status === 'PENDING');
      if (!testBill) {
        return { skip: true, reason: 'No pending bills found' };
      }
      
      const response = await fetch(`${BASE_URL}/api/bills/${testBill.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie
        },
        body: JSON.stringify({
          status: 'PAID',
          paymentMethod: 'CASH',
          discountPercent: 10 // This should be rejected
        })
      });
      
      return {
        pass: response.status === 403,
        expected: 403,
        actual: response.status
      };
    }
  },
  
  {
    name: 'STAFF cannot redeem points',
    role: 'STAFF',
    email: 'staff@genz.com',
    test: async (cookie) => {
      const billsResponse = await fetch(`${BASE_URL}/api/bills`, {
        headers: { Cookie: cookie }
      });
      const bills = await billsResponse.json();
      
      if (!bills || bills.length === 0) {
        return { skip: true, reason: 'No bills found' };
      }
      
      const testBill = bills.find(b => b.status === 'PENDING');
      if (!testBill) {
        return { skip: true, reason: 'No pending bills found' };
      }
      
      const response = await fetch(`${BASE_URL}/api/bills/${testBill.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie
        },
        body: JSON.stringify({
          status: 'PAID',
          paymentMethod: 'CASH',
          customerPhone: '9876543210',
          pointsToRedeem: 50 // This should be rejected
        })
      });
      
      return {
        pass: response.status === 403,
        expected: 403,
        actual: response.status
      };
    }
  },
  
  {
    name: 'STAFF can mark bill as paid (without discount/points)',
    role: 'STAFF',
    email: 'staff@genz.com',
    test: async (cookie) => {
      const billsResponse = await fetch(`${BASE_URL}/api/bills`, {
        headers: { Cookie: cookie }
      });
      const bills = await billsResponse.json();
      
      if (!bills || bills.length === 0) {
        return { skip: true, reason: 'No bills found' };
      }
      
      const testBill = bills.find(b => b.status === 'PENDING');
      if (!testBill) {
        return { skip: true, reason: 'No pending bills found' };
      }
      
      const response = await fetch(`${BASE_URL}/api/bills/${testBill.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie
        },
        body: JSON.stringify({
          status: 'PAID',
          paymentMethod: 'CASH',
          cashAmount: testBill.total
        })
      });
      
      return {
        pass: response.status === 200,
        expected: 200,
        actual: response.status
      };
    }
  },
  
  {
    name: 'STAFF cannot edit menu item details',
    role: 'STAFF',
    email: 'staff@genz.com',
    test: async (cookie) => {
      const menuResponse = await fetch(`${BASE_URL}/api/menu`, {
        headers: { Cookie: cookie }
      });
      const menuItems = await menuResponse.json();
      
      if (!menuItems || menuItems.length === 0) {
        return { skip: true, reason: 'No menu items found' };
      }
      
      const testItem = menuItems[0];
      
      const response = await fetch(`${BASE_URL}/api/menu/${testItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie
        },
        body: JSON.stringify({
          name: 'MODIFIED NAME',
          price: 999.99
        })
      });
      
      return {
        pass: response.status === 403,
        expected: 403,
        actual: response.status
      };
    }
  },
  
  {
    name: 'STAFF can toggle availability',
    role: 'STAFF',
    email: 'staff@genz.com',
    test: async (cookie) => {
      const menuResponse = await fetch(`${BASE_URL}/api/menu`, {
        headers: { Cookie: cookie }
      });
      const menuItems = await menuResponse.json();
      
      if (!menuItems || menuItems.length === 0) {
        return { skip: true, reason: 'No menu items found' };
      }
      
      const testItem = menuItems[0];
      
      const response = await fetch(`${BASE_URL}/api/menu/${testItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie
        },
        body: JSON.stringify({
          available: !testItem.available
        })
      });
      
      return {
        pass: response.status === 200,
        expected: 200,
        actual: response.status
      };
    }
  },
  
  {
    name: 'STAFF can restock inventory (increase only)',
    role: 'STAFF',
    email: 'staff@genz.com',
    test: async (cookie) => {
      const menuResponse = await fetch(`${BASE_URL}/api/menu`, {
        headers: { Cookie: cookie }
      });
      const menuItems = await menuResponse.json();
      
      if (!menuItems || menuItems.length === 0) {
        return { skip: true, reason: 'No menu items found' };
      }
      
      const testItem = menuItems.find(item => item.stockQuantity !== null);
      if (!testItem) {
        return { skip: true, reason: 'No tracked inventory items found' };
      }
      
      const response = await fetch(`${BASE_URL}/api/menu/${testItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie
        },
        body: JSON.stringify({
          stockQuantity: testItem.stockQuantity + 10 // Increase
        })
      });
      
      return {
        pass: response.status === 200,
        expected: 200,
        actual: response.status
      };
    }
  },
  
  {
    name: 'ADMIN can apply discount',
    role: 'ADMIN',
    email: 'admin@genz.com',
    test: async (cookie) => {
      const billsResponse = await fetch(`${BASE_URL}/api/bills`, {
        headers: { Cookie: cookie }
      });
      const bills = await billsResponse.json();
      
      if (!bills || bills.length === 0) {
        return { skip: true, reason: 'No bills found' };
      }
      
      const testBill = bills.find(b => b.status === 'PENDING');
      if (!testBill) {
        return { skip: true, reason: 'No pending bills found' };
      }
      
      const response = await fetch(`${BASE_URL}/api/bills/${testBill.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie
        },
        body: JSON.stringify({
          status: 'PAID',
          paymentMethod: 'CASH',
          discountPercent: 10 // ADMIN should be allowed
        })
      });
      
      return {
        pass: response.status === 200,
        expected: 200,
        actual: response.status
      };
    }
  }
];

// Run all tests
async function runTests() {
  log('\n🧪 RBAC Backend Test Suite\n', 'blue');
  log('=' .repeat(60), 'blue');
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const test of tests) {
    log(`\n📋 Test: ${test.name}`, 'yellow');
    log(`👤 Role: ${test.role}`, 'yellow');
    
    try {
      // Login
      log(`   Logging in as ${test.email}...`);
      const cookie = await login(test.email, test.email === 'staff@genz.com' ? 'staff123' : 'admin123');
      
      if (!cookie) {
        log(`   ❌ FAILED: Could not login`, 'red');
        failed++;
        continue;
      }
      
      // Run test
      log(`   Running test...`);
      const result = await test.test(cookie);
      
      if (result.skip) {
        log(`   ⏭️  SKIPPED: ${result.reason}`, 'yellow');
        skipped++;
      } else if (result.pass) {
        log(`   ✅ PASSED (Expected ${result.expected}, got ${result.actual})`, 'green');
        passed++;
      } else {
        log(`   ❌ FAILED (Expected ${result.expected}, got ${result.actual})`, 'red');
        failed++;
      }
    } catch (error) {
      log(`   ❌ ERROR: ${error.message}`, 'red');
      failed++;
    }
  }
  
  log('\n' + '='.repeat(60), 'blue');
  log(`\n📊 Test Results:`, 'blue');
  log(`   ✅ Passed:  ${passed}`, 'green');
  log(`   ❌ Failed:  ${failed}`, 'red');
  log(`   ⏭️  Skipped: ${skipped}`, 'yellow');
  log(`   📝 Total:   ${tests.length}\n`, 'blue');
  
  if (failed === 0 && passed > 0) {
    log('🎉 All tests passed!', 'green');
  } else if (failed > 0) {
    log('⚠️  Some tests failed. Review the output above.', 'red');
  } else {
    log('⚠️  All tests were skipped. Make sure the app is running and has data.', 'yellow');
  }
}

// Run
runTests().catch(console.error);
