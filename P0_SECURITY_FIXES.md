# 🔴 P0 CRITICAL SECURITY FIXES
## Implementation Guide - URGENT

**Target:** Fix all P0 security vulnerabilities TODAY  
**Estimated Time:** 2-3 hours  
**Risk Level:** Low (non-breaking changes)

---

## FIX 1: CSRF Protection (30 minutes)

### Step 1: Create Middleware

```bash
# Create new file
touch src/middleware.ts
```

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only check CSRF for state-changing methods
  if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const referer = request.headers.get('referer');
    
    // Allow requests from same origin
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`,
      process.env.NEXT_PUBLIC_APP_URL,
      'https://pos.gen-z.online'
    ].filter(Boolean);
    
    // Check origin header (modern browsers)
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed || ''))) {
      console.warn(`🚨 CSRF blocked: origin=${origin}, host=${host}`);
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }
    
    // Check referer header (fallback for older browsers)
    if (!origin && referer && !allowedOrigins.some(allowed => referer.startsWith(allowed || ''))) {
      console.warn(`🚨 CSRF blocked: referer=${referer}, host=${host}`);
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*', // Apply to all API routes
};
```

### Step 2: Test CSRF Protection

```bash
# Test 1: Valid same-origin request (should work)
curl -X POST https://pos.gen-z.online/api/orders \
  -H "Origin: https://pos.gen-z.online" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"tableId":"...","items":[...]}'

# Test 2: Cross-origin request (should be blocked)
curl -X POST https://pos.gen-z.online/api/orders \
  -H "Origin: https://evil-site.com" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"tableId":"...","items":[...]}'
# Expected: 403 CSRF validation failed
```

### Step 3: Deploy

```bash
git add src/middleware.ts
git commit -m "🔒 Add CSRF protection to all API routes"
git push origin master
```

---

## FIX 2: SQL Injection Sanitization (20 minutes)

### Step 1: Verify Sanitize Function Exists

```bash
cat src/lib/sanitize.ts
```

If file doesn't exist, create it:

```typescript
// src/lib/sanitize.ts
/**
 * Sanitize user input to prevent SQL injection and XSS
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/[<>'"\\]/g, '')   // Remove SQL/HTML dangerous chars
    .replace(/--/g, '')          // Remove SQL comments
    .replace(/;/g, '')           // Remove statement terminators
    .replace(/\/\*/g, '')        // Remove /* comment start
    .replace(/\*\//g, '')        // Remove */ comment end
    .replace(/xp_/gi, '')        // Remove SQL Server extended procs
    .replace(/sp_/gi, '')        // Remove SQL Server stored procs
    .replace(/0x/gi, '')         // Remove hex literals
    .trim()
    .substring(0, 1000);         // Limit length
}

/**
 * Sanitize special instructions (more lenient - allows commas, periods)
 */
export function sanitizeSpecialInstructions(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/[<>\\]/g, '')      // Remove HTML/path traversal
    .replace(/--/g, '')          // Remove SQL comments
    .replace(/;(?=\s*(?:DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|EXEC))/gi, '') // Remove dangerous SQL
    .replace(/\/\*/g, '')        // Remove comment blocks
    .replace(/\*\//g, '')
    .trim()
    .substring(0, 500);          // Limit to 500 chars
}
```

### Step 2: Apply to Order Creation

```typescript
// src/app/api/orders/route.ts

// REPLACE THIS:
if (item.specialInstructions) {
  item.specialInstructions = item.specialInstructions
    .replace(/<[^>]*>/g, '') 
    .replace(/[<>'"]/g, '')
    .substring(0, 500);
}

// WITH THIS:
import { sanitizeSpecialInstructions } from '@/lib/sanitize';

if (item.specialInstructions) {
  item.specialInstructions = sanitizeSpecialInstructions(item.specialInstructions);
}
```

### Step 3: Apply to Customer Details

```typescript
// src/app/api/orders/route.ts

// Add at top:
import { sanitizeText, sanitizeSpecialInstructions } from '@/lib/sanitize';

// Sanitize customer inputs
const sanitizedCustomerName = customerName ? sanitizeText(customerName) : 'Walk-in Customer';
const sanitizedCustomerPhone = customerPhone ? sanitizeText(customerPhone) : null;

// Use in order creation:
const newOrder = await tx.order.create({
  data: {
    // ...
    customerName: sanitizedCustomerName,
    customerPhone: sanitizedCustomerPhone,
    // ...
  }
});
```

### Step 4: Test SQL Injection Protection

```bash
# Test malicious input
curl -X POST https://pos.gen-z.online/api/orders \
  -H "Origin: https://pos.gen-z.online" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "tableId": "some-uuid",
    "items": [{
      "menuItemId": "some-uuid",
      "quantity": 1,
      "specialInstructions": "'; DROP TABLE orders; --"
    }]
  }'

# Check database - orders table should still exist!
```

---

## FIX 3: Brute Force Protection (40 minutes)

### Step 1: Update Auth Config

```typescript
// src/lib/auth-config.ts

import { checkRateLimit, RateLimitPresets } from '@/lib/rateLimit';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // 🔒 BRUTE FORCE PROTECTION: Rate limit per email
        try {
          // Create a mock request object for rate limiting
          const mockRequest = {
            headers: new Headers({
              'x-forwarded-for': '127.0.0.1', // Will be replaced by actual IP in production
            })
          } as Request;
          
          const rateLimit = checkRateLimit(mockRequest, {
            maxRequests: 5,        // 5 attempts
            windowMs: 15 * 60 * 1000, // per 15 minutes
            identifier: `login:${credentials.email.toLowerCase()}`
          });
          
          if (!rateLimit.success) {
            console.warn(`🚨 Rate limit exceeded for login: ${credentials.email}`);
            console.warn(`   Retry after: ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)}s`);
            return null; // Deny login
          }
        } catch (error) {
          console.error('Rate limit check error:', error);
          // Continue with auth if rate limit fails (fail open for availability)
        }
        
        try {
          const user = await prisma.user.findUnique({ 
            where: { email: credentials.email.toLowerCase() } 
          });

          if (!user) {
            console.warn(`Login attempt for non-existent user: ${credentials.email}`);
            return null;
          }

          const isValid = await compare(credentials.password, user.password);
          if (!isValid) {
            console.warn(`Invalid password for user: ${credentials.email}`);
            return null;
          }

          console.log(`✅ Successful login: ${credentials.email}`);
          return { 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            role: user.role, 
            restaurantId: user.restaurantId 
          } as ExtendedUser;
        } catch (error: any) { 
          console.error("Auth error:", error?.message || error);
          console.error("Auth error stack:", error?.stack);
          return null; 
        }
      }
    })
  ],
  // ... rest of config
};
```

### Step 2: Add IP-Based Rate Limiting (Optional - Enhanced Protection)

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { NextResponse } from 'next/server';
import { checkRateLimit, RateLimitPresets } from '@/lib/rateLimit';

// Wrap NextAuth handler with rate limiting
export async function POST(request: Request, context: any) {
  // Rate limit by IP address (global limit)
  const rateLimit = checkRateLimit(request, {
    maxRequests: 20,        // 20 login attempts
    windowMs: 15 * 60 * 1000 // per 15 minutes per IP
  });
  
  if (!rateLimit.success) {
    console.warn(`🚨 IP rate limit exceeded for /api/auth`);
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString()
        }
      }
    );
  }
  
  // Continue to NextAuth
  return handler(request, context);
}

// Import the actual NextAuth handler
import { handlers } from '@/lib/auth-config';
const { GET: getHandler, POST: handler } = handlers;

export { getHandler as GET };
```

### Step 3: Test Brute Force Protection

```bash
# Test 1: Rapid failed login attempts (should block after 5)
for i in {1..10}; do
  echo "Attempt $i"
  curl -X POST https://pos.gen-z.online/api/auth/callback/credentials \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@genz.com",
      "password": "wrongpassword"
    }'
  sleep 1
done

# Expected: First 5 attempts return 401, attempts 6-10 return 429 (Too Many Requests)

# Test 2: Wait 15 minutes, try again (should work)
sleep 900
curl -X POST https://pos.gen-z.online/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@genz.com",
    "password": "admin123"
  }'
# Expected: Successful login
```

---

## FIX 4: Add Security Headers (15 minutes)

### Step 1: Update Next.js Config

```typescript
// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  
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
            value: 'max-age=63072000; includeSubDomains; preload'
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
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

---

## DEPLOYMENT CHECKLIST

```bash
# 1. Run TypeScript check
npx tsc --noEmit

# 2. Run build
npm run build

# 3. Test locally
npm run start

# 4. Commit changes
git add .
git commit -m "🔒 P0 Security Fixes: CSRF protection, SQL injection prevention, brute force protection"

# 5. Push to master (Vercel auto-deploys)
git push origin master

# 6. Monitor Vercel deployment
# Visit: https://vercel.com/your-project/deployments

# 7. Test in production
# - Test CSRF protection
# - Test SQL injection attempts
# - Test brute force protection
# - Verify all existing functionality works
```

---

## VERIFICATION TESTS

### Test 1: CSRF Protection
```bash
# Should FAIL (blocked by CSRF)
curl -X POST https://pos.gen-z.online/api/orders \
  -H "Origin: https://evil-site.com" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Expected: 403 Forbidden
```

### Test 2: SQL Injection
```bash
# Should be SANITIZED (malicious SQL removed)
curl -X POST https://pos.gen-z.online/api/orders \
  -H "Origin: https://pos.gen-z.online" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "tableId": "valid-uuid",
    "items": [{
      "menuItemId": "valid-uuid",
      "quantity": 1,
      "specialInstructions": "Extra spicy'; DROP TABLE orders; --"
    }]
  }'

# Check database - orders table should exist!
# Check order - special instructions should be sanitized
```

### Test 3: Brute Force
```bash
# Rapid login attempts
for i in {1..6}; do
  echo "Login attempt $i"
  curl -X POST https://pos.gen-z.online/api/auth/callback/credentials \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@genz.com","password":"wrong"}'
done

# Expected: First 5 fail with 401, 6th fails with 429
```

---

## ROLLBACK PLAN

If any issues occur:

```bash
# Option 1: Revert commit
git revert HEAD
git push origin master

# Option 2: Rollback in Vercel dashboard
# 1. Go to Vercel dashboard
# 2. Click "Deployments"
# 3. Find previous working deployment
# 4. Click "..." → "Promote to Production"
```

---

## POST-DEPLOYMENT MONITORING

### Check Logs (First 24 Hours)

```bash
# Vercel logs
vercel logs --follow

# Look for:
# 🚨 CSRF blocked - Should see some attempts (bots/scanners)
# ✅ Successful logins - Should work normally
# 🚨 Rate limit exceeded - Should block brute force attempts
```

### Alert Triggers

Set up alerts for:
- Spike in 403 errors (CSRF attacks)
- Spike in 429 errors (brute force attempts)
- Spike in 500 errors (something broken)

---

## SUCCESS CRITERIA

✅ All P0 fixes deployed  
✅ Zero false positives (legitimate requests work)  
✅ CSRF attacks blocked  
✅ SQL injection attempts sanitized  
✅ Brute force attempts rate limited  
✅ No production errors  
✅ All tests passing  

---

**Estimated Total Time:** 2-3 hours  
**Risk Level:** LOW (fail-safe defaults, graceful degradation)  
**Impact:** HIGH (blocks critical vulnerabilities)

**Next Steps After P0:**
1. ⏳ Add database indices (P1)
2. ⏳ Set up error monitoring (P1)
3. ⏳ Implement audit logging (P2)
