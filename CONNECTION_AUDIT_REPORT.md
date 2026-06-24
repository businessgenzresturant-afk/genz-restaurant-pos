# Database Connection Audit Report

**Date:** June 24, 2026  
**Status:** 🔴 CRITICAL ISSUES FOUND  
**Error:** `EMAXCONNSESSION - max clients reached (pool_size: 15)`

---

## 🔍 AUDIT FINDINGS

### ✅ GOOD: Singleton Pattern (Mostly Working)

**File:** `src/lib/prisma.ts`

```typescript
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({...});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Status:** ✅ Correct implementation

**Usage:** 32+ API routes correctly import from `@/lib/prisma`

---

## 🚨 CRITICAL ISSUES FOUND

### Issue #1: Seed Route Creates Separate Client 🔴

**File:** `src/app/api/seed/route.ts` (Line 15)

```typescript
// ❌ WRONG - Creates NEW PrismaClient
const prisma = new PrismaClient();
```

**Impact:**
- Each seed request = new connection
- Connection never pooled/reused
- NOT disconnected in all code paths

**Fix Required:** Import singleton from `@/lib/prisma`

---

### Issue #2: Aggressive Polling Frequencies 🔴

#### KDS Display (Most Critical)

**File:** `src/components/kds/KDSDisplay.tsx` (Line 339)

```typescript
setInterval(() => {
  if (document.visibilityState === 'visible') {
    fetchOrders();
  }
}, 3000); // ❌ Every 3 seconds!
```

**Calculation:**
- 1 KDS instance = 20 requests/minute
- 3 concurrent KDS screens = 60 requests/minute
- Each request holds connection for ~100-500ms
- Peak: 3-5 concurrent connections from KDS alone

**Recommended:** Increase to 10 seconds minimum

---

#### Dashboard (High Impact)

**File:** `src/components/dashboard/dashboard.tsx` (Line 173)

```typescript
const interval = setInterval(fetchData, 5000); // ❌ Every 5 seconds
```

**What fetchData does:**
```typescript
fetch('/api/tables')           // Connection 1
fetch('/api/orders?status=..') // Connection 2  
fetch('/api/orders?status=..'  // Connection 3
```

**Impact:**
- 3 parallel requests every 5 seconds
- 36 requests/minute = 12 connections/minute
- 2 staff dashboards open = 72 requests/minute

**Recommended:** Increase to 15 seconds minimum

---

#### KOT Page (Medium Impact)

**File:** `src/app/(pos)/kot/page.tsx` (Line 49)

```typescript
const intervalId = setInterval(fetchKOTOrders, 5000); // ❌ Every 5 seconds
```

**Impact:**
- 12 requests/minute
- Usually 1 instance only
- Lower priority

**Recommended:** Increase to 10 seconds minimum

---

### Issue #3: No Connection Limit in DATABASE_URL 🟡

**Current (from error):**
```
Session mode - pool_size: 15
```

**Problem:**
- Neon free tier: 15 max connections
- No `connection_limit` parameter in URL
- Prisma can create up to 15 connections per instance

**Required Fix:**
Add to DATABASE_URL:
```
?connection_limit=1
```

---

## 📊 CONNECTION MATH

### Current State (BROKEN)

**Polling:**
- 3 KDS screens × 20 req/min = 60 req/min
- 2 Dashboards × 36 req/min = 72 req/min
- 1 KOT × 12 req/min = 12 req/min
- **Total: 144 requests/minute**

**Connection Duration:**
- Average query: 100-300ms
- Peak concurrent: **8-12 connections**

**Additional:**
- User page loads: 2-3 connections
- Background processes: 1-2 connections
- Seed route (if called): 1 leaked connection
- **Peak Total: 12-17 connections** ❌ Exceeds 15 limit!

---

### After Fix (TARGET)

**Polling (Reduced):**
- 3 KDS screens × 6 req/min = 18 req/min
- 2 Dashboards × 12 req/min = 24 req/min  
- 1 KOT × 6 req/min = 6 req/min
- **Total: 48 requests/minute** (67% reduction!)

**Connection Duration:** Same (100-300ms)
**Peak concurrent: 3-5 connections** ✅

**Additional:**
- User loads: 2-3 connections
- Background: 1-2 connections
- **Peak Total: 6-10 connections** ✅ Under 15 limit!

---

## 🔧 REQUIRED FIXES

### Fix #1: Seed Route Connection Leak

**File:** `src/app/api/seed/route.ts`

**Before:**
```typescript
import { PrismaClient } from '@prisma/client';
...
const prisma = new PrismaClient(); // ❌
```

**After:**
```typescript
import { prisma } from '@/lib/prisma'; // ✅
// Remove: const prisma = new PrismaClient();
// Remove: await prisma.$disconnect();
```

**Priority:** 🔴 CRITICAL  
**Effort:** 2 minutes  
**Impact:** Fixes connection leak

---

### Fix #2: Reduce KDS Polling

**File:** `src/components/kds/KDSDisplay.tsx` (Line 339)

**Before:**
```typescript
}, 3000); // 3 seconds
```

**After:**
```typescript
}, 10000); // 10 seconds
```

**Priority:** 🔴 CRITICAL  
**Effort:** 30 seconds  
**Impact:** 67% reduction in KDS requests

---

### Fix #3: Reduce Dashboard Polling

**File:** `src/components/dashboard/dashboard.tsx` (Line 173)

**Before:**
```typescript
const interval = setInterval(fetchData, 5000);
```

**After:**
```typescript
const interval = setInterval(fetchData, 15000); // 15 seconds
```

**Priority:** 🔴 CRITICAL  
**Effort:** 30 seconds  
**Impact:** 67% reduction in dashboard requests

---

### Fix #4: Reduce KOT Polling

**File:** `src/app/(pos)/kot/page.tsx` (Line 49)

**Before:**
```typescript
const intervalId = setInterval(fetchKOTOrders, 5000);
```

**After:**
```typescript
const intervalId = setInterval(fetchKOTOrders, 10000); // 10 seconds
```

**Priority:** 🟡 HIGH  
**Effort:** 30 seconds  
**Impact:** 50% reduction in KOT requests

---

### Fix #5: Add Connection Limit (ENVIRONMENT VAR)

**Location:** Vercel Environment Variables

**Add to DATABASE_URL:**
```
&connection_limit=1
```

**Full Example:**
```
postgresql://user:pass@ep-xxx-pooler.region.neon.tech:6543/neondb?sslmode=require&connection_limit=1
```

**Priority:** 🔴 CRITICAL  
**Effort:** 2 minutes  
**Impact:** Prevents connection pool exhaustion per instance

---

## 📋 IMPLEMENTATION CHECKLIST

Code Changes:
- [ ] Fix seed route to use singleton
- [ ] Increase KDS polling: 3s → 10s
- [ ] Increase Dashboard polling: 5s → 15s
- [ ] Increase KOT polling: 5s → 10s
- [ ] Test build passes
- [ ] Commit and push

Environment Changes:
- [ ] Add `connection_limit=1` to DATABASE_URL in Vercel
- [ ] Ensure pooled connection (port 6543 or pgbouncer=true)
- [ ] Redeploy Vercel

Verification:
- [ ] Test `/api/admin/check-users` - returns JSON
- [ ] Monitor Neon connections - should be < 10
- [ ] No EMAXCONNSESSION errors in logs
- [ ] Dashboard still updates (just slower)
- [ ] KDS still shows orders (just slower)

---

## ⏱️ ESTIMATED IMPACT

**Request Reduction:**
- Before: 144 requests/minute
- After: 48 requests/minute
- **Reduction: 67%**

**Connection Usage:**
- Before: Peak 12-17 connections (exceeds limit)
- After: Peak 6-10 connections (safe)
- **Reduction: 42%**

**User Experience:**
- Dashboard: 15s refresh (was 5s) - Acceptable
- KDS: 10s refresh (was 3s) - Acceptable for kitchen
- KOT: 10s refresh (was 5s) - Acceptable

---

## 🎯 WHY THIS WORKS

1. **Fewer Requests:** 67% reduction in database queries
2. **Spread Load:** Requests more spread out over time
3. **Connection Reuse:** Singleton pattern working correctly
4. **Connection Limit:** Each instance limited to 1 connection
5. **Pooled Connection:** Neon pooler handles bursts better

---

## 📊 OTHER FILES CHECKED (ALL GOOD)

**Scripts (Not in Production):**
- ✅ `scripts/generate-kds-token.ts` - Creates own client (OK for script)
- ✅ `scripts/seed-production-tables.ts` - Creates own client (OK)
- ✅ `scripts/check-users.ts` - Creates own client (OK)
- ✅ `scripts/create-production-admin.ts` - Creates own client (OK)
- ✅ `prisma/seed.ts` - Creates own client (OK for seed)

**Test Files (Not in Production):**
- ✅ `test-tables-api.ts` - OK
- ✅ `test-takeaway-flow.ts` - OK
- ✅ `setup_virtual_tables.ts` - OK

**API Routes (All Using Singleton):**
- ✅ `/api/admin/check-users` - Uses `@/lib/prisma`
- ✅ `/api/tables` - Uses `@/lib/prisma`
- ✅ `/api/orders` - Uses `@/lib/prisma`
- ✅ `/api/bills` - Uses `@/lib/prisma`
- ✅ `/api/menu` - Uses `@/lib/prisma`
- ✅ `/api/settings/kds-token` - Uses `@/lib/prisma`
- ✅ All 32+ routes checked - ALL GOOD

**Auth Configuration:**
- ✅ `src/lib/auth-config.ts` - Uses `@/lib/prisma`

---

## 🚫 FALSE POSITIVES

These are NOT issues:

1. **Scripts creating PrismaClient** - Scripts run once, not in production
2. **Test files creating PrismaClient** - Tests don't run in production
3. **Seed files creating PrismaClient** - Except `/api/seed` route!

---

## ✅ VERIFICATION COMMANDS

After deploying fixes:

```bash
# Check current connections in Neon
# Should show < 10 active connections

# Test API
curl https://pos.gen-z.online/api/admin/check-users
# Should return JSON, not error

# Monitor logs
# In Vercel → Functions → Check for errors
# Should see NO "EMAXCONNSESSION" errors

# Test dashboard
# Open dashboard, wait 15 seconds
# Should auto-refresh after 15s (not 5s)
```

---

## 📈 MONITORING PLAN

1. **Neon Dashboard:**
   - Check "Active Connections" graph
   - Should stay under 10
   - Set alert at threshold: 12

2. **Vercel Logs:**
   - Monitor for EMAXCONNSESSION errors
   - Should be ZERO after fixes

3. **User Feedback:**
   - Dashboard refresh acceptable at 15s?
   - KDS updates acceptable at 10s?
   - Adjust if complaints

---

## 🎓 ROOT CAUSE SUMMARY

1. ❌ **Seed route leaked connection** (not using singleton)
2. ❌ **Too frequent polling** (3-5 seconds)
3. ❌ **Multiple screens polling** (KDS + Dashboard + KOT)
4. ❌ **No connection limit** in DATABASE_URL
5. ❌ **Session mode instead of pooled** (wrong Neon endpoint)

**Combined Effect:** 144 requests/minute → 12-17 peak connections → Exceeds 15 limit → CRASH

---

**Audit Completed:** June 24, 2026  
**Issues Found:** 5 critical  
**Fixes Required:** 5 (4 code + 1 env var)  
**Estimated Fix Time:** 10 minutes  
**Priority:** 🔴 IMMEDIATE
