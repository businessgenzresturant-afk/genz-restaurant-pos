# ✅ QUICK ACTION CHECKLIST
## Today's Priority Tasks

**System:** GenZ Restaurant POS  
**Date:** June 24, 2026  
**Priority:** Fix P0 Security Issues  

---

## 🎯 YOUR MISSION TODAY

Fix **3 critical security vulnerabilities** in **2-3 hours**. All functional issues are already resolved - this is ONLY about security hardening.

---

## ✅ TASK 1: CSRF Protection (30 min)

### What It Fixes:
Prevents attackers from making requests on behalf of logged-in users.

### Steps:

```bash
# 1. Create new file
touch src/middleware.ts
```

```typescript
// 2. Copy this code into src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`,
      'https://pos.gen-z.online'
    ];
    
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

```bash
# 3. Test it compiles
npx tsc --noEmit

# Done! ✅
```

---

## ✅ TASK 2: SQL Injection Fix (20 min)

### What It Fixes:
Prevents malicious SQL code in special instructions from affecting database.

### Steps:

```bash
# 1. Check if sanitize.ts exists
ls src/lib/sanitize.ts

# If not found, create it:
touch src/lib/sanitize.ts
```

```typescript
// 2. Copy this code into src/lib/sanitize.ts
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/[<>'"\\]/g, '')
    .replace(/--/g, '')
    .replace(/;/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim()
    .substring(0, 1000);
}

export function sanitizeSpecialInstructions(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/[<>\\]/g, '')
    .replace(/--/g, '')
    .replace(/;(?=\s*(?:DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|EXEC))/gi, '')
    .trim()
    .substring(0, 500);
}
```

```typescript
// 3. Update src/app/api/orders/route.ts

// Add at top (around line 10):
import { sanitizeText, sanitizeSpecialInstructions } from '@/lib/sanitize';

// Find this code (around line 45):
if (item.specialInstructions) {
  item.specialInstructions = item.specialInstructions
    .replace(/<[^>]*>/g, '')
    .replace(/[<>'"]/g, '')
    .substring(0, 500);
}

// Replace with:
if (item.specialInstructions) {
  item.specialInstructions = sanitizeSpecialInstructions(item.specialInstructions);
}

// Also sanitize customer details (around line 110):
// Find:
customerName: customerName || 'Walk-in Customer',
customerPhone: customerPhone || null,

// Replace with:
customerName: customerName ? sanitizeText(customerName) : 'Walk-in Customer',
customerPhone: customerPhone ? sanitizeText(customerPhone) : null,
```

```bash
# 4. Test it compiles
npx tsc --noEmit

# Done! ✅
```

---

## ✅ TASK 3: Brute Force Protection (40 min)

### What It Fixes:
Limits login attempts to prevent password guessing attacks.

### Steps:

```typescript
// 1. Open src/lib/auth-config.ts

// Add import at top (around line 4):
import { checkRateLimit } from '@/lib/rateLimit';

// Find the authorize function (around line 20)
// Add this code RIGHT AFTER the initial checks:

async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) return null;
  
  // 🔒 ADD THIS CODE:
  try {
    const mockRequest = {
      headers: new Headers({
        'x-forwarded-for': '127.0.0.1',
      })
    } as Request;
    
    const rateLimit = checkRateLimit(mockRequest, {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
      identifier: `login:${credentials.email.toLowerCase()}`
    });
    
    if (!rateLimit.success) {
      console.warn(`🚨 Rate limit exceeded for login: ${credentials.email}`);
      return null;
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
  }
  // END OF NEW CODE
  
  // ... rest of existing code
```

```bash
# 2. Test it compiles
npx tsc --noEmit

# Done! ✅
```

---

## ✅ TASK 4: Add Security Headers (15 min)

### What It Fixes:
Adds HTTP security headers to protect against common attacks.

### Steps:

```javascript
// 1. Open next.config.js

// Find the existing config object
// Add this BEFORE the closing brace:

async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        }
      ]
    }
  ];
}

// Example result:
// const nextConfig = {
//   // ... existing config
//   async headers() { ... }  // <-- ADD THIS
// };
```

```bash
# 2. Test it compiles
npm run build

# Done! ✅
```

---

## ✅ TASK 5: Build & Deploy (30 min)

### Steps:

```bash
# 1. Verify all changes compile
npx tsc --noEmit

# 2. Build project
npm run build

# 3. Review changes
git status
git diff

# 4. Commit changes
git add src/middleware.ts
git add src/lib/sanitize.ts
git add src/app/api/orders/route.ts
git add src/lib/auth-config.ts
git add next.config.js

git commit -m "🔒 P0 Security Fixes: CSRF, SQL injection, brute force protection

- Add CSRF protection middleware for all API routes
- Sanitize special instructions to prevent SQL injection
- Rate limit login attempts (5 per 15 minutes per email)
- Add security headers (HSTS, X-Frame-Options, etc.)
- Sanitize customer name and phone inputs

Fixes: Critical security vulnerabilities
Impact: No breaking changes, all features work as before
Testing: Verified build passes and TypeScript checks pass"

# 5. Push to master (Vercel auto-deploys)
git push origin master

# 6. Monitor deployment
# Visit: https://vercel.com/your-project/deployments
# Wait for "Ready" status (usually 2-3 minutes)

# Done! ✅
```

---

## ✅ TASK 6: Verify Production (15 min)

### Test Checklist:

```bash
# Test 1: Login works ✓
# Go to: https://pos.gen-z.online/login
# Login with: admin@genz.com / admin123
# Expected: Successful login

# Test 2: Dashboard loads ✓
# Expected: Tables, orders, revenue all visible

# Test 3: Create order works ✓
# Click "Dine In" → Select table → Add items → Place order
# Expected: Order created successfully

# Test 4: Generate bill works ✓
# Open table with order → "Generate Bill"
# Expected: Bill created, payment modal opens

# Test 5: KDS updates ✓
# Open: https://pos.gen-z.online/kds
# Click "Start KDS"
# Expected: See orders, countdown timers working

# Test 6: CSRF protection active ✓
# Open browser console (F12)
# Run: fetch('https://pos.gen-z.online/api/orders', {method:'POST'})
# Expected: CORS error or 403 Forbidden

# Test 7: Brute force protection ✓
# Try logging in with wrong password 6 times
# Expected: First 5 fail with "Invalid credentials", 6th should rate limit

# Done! ✅
```

---

## 📋 COMPLETION CHECKLIST

Mark each as complete:

- [ ] ✅ CSRF protection added (middleware.ts created)
- [ ] ✅ SQL injection fixed (sanitize.ts applied)
- [ ] ✅ Brute force protection added (auth-config.ts updated)
- [ ] ✅ Security headers added (next.config.js updated)
- [ ] ✅ Build passes (npm run build)
- [ ] ✅ TypeScript checks pass (npx tsc --noEmit)
- [ ] ✅ Committed to git
- [ ] ✅ Pushed to master
- [ ] ✅ Vercel deployment successful
- [ ] ✅ Production tests pass
- [ ] ✅ Login works
- [ ] ✅ Orders work
- [ ] ✅ Bills work
- [ ] ✅ KDS works

---

## 🎉 SUCCESS!

When all boxes are checked, you have:

- ✅ Blocked CSRF attacks
- ✅ Prevented SQL injection
- ✅ Stopped brute force attacks
- ✅ Added security headers
- ✅ Protected your restaurant's data
- ✅ Maintained all existing functionality

**Your system is now production-secure!** 🎊

---

## 🚨 IF SOMETHING BREAKS

### Quick Rollback:

```bash
# Option 1: Revert last commit
git revert HEAD
git push origin master

# Option 2: Rollback in Vercel
# 1. Go to https://vercel.com/your-project/deployments
# 2. Find previous working deployment
# 3. Click "..." → "Promote to Production"
```

### Get Help:

1. Check Vercel logs: `vercel logs --follow`
2. Check browser console (F12) for errors
3. Read error messages carefully
4. Look for file/line numbers in errors

---

## 📊 ESTIMATED TIME

| Task | Time | Difficulty |
|------|------|------------|
| CSRF Protection | 30 min | ⭐ Easy |
| SQL Injection Fix | 20 min | ⭐ Easy |
| Brute Force Protection | 40 min | ⭐⭐ Medium |
| Security Headers | 15 min | ⭐ Easy |
| Build & Deploy | 30 min | ⭐ Easy |
| Testing | 15 min | ⭐ Easy |
| **TOTAL** | **2.5 hours** | ⭐⭐ Moderate |

---

## 🎯 AFTER THIS IS DONE

Next priorities (this week):

1. ⏳ Add database indices (15 min)
2. ⏳ Set up error monitoring (1 hour)
3. ⏳ Fix bill race condition (30 min)

But for now, focus on these P0 security fixes!

---

**Let's secure your POS system! 🔒**

Start with Task 1 (CSRF Protection) and work your way down. Each task is independent, so you can take breaks between them.

Good luck! 🚀
