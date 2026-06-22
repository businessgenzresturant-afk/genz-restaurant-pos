# 🚀 Production Deployment Checklist - GenZ Restaurant POS
**Target: 1000+ Orders/Day | Zero Downtime | 10/10 Quality**

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Security (CRITICAL - P0)

- [x] Remove all .env files from git repository
- [x] Update .gitignore to exclude all environment files
- [x] Remove hardcoded fallback secrets from code
- [x] Verify env.ts throws error if secrets missing in production
- [ ] **TODO:** Rotate database password in Supabase Dashboard
- [ ] **TODO:** Generate new NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] **TODO:** Set all secrets in Vercel Dashboard Environment Variables:
  - DATABASE_URL (pooled connection - port 6543)
  - DIRECT_URL (direct connection - port 5432)
  - NEXTAUTH_SECRET (minimum 32 characters)
  - NEXTAUTH_URL (https://pos.gen-z.online)
  - TAX_RATE (0.18 for 18% GST)

### 2. Dependencies (CRITICAL - P0)

- [x] Updated package.json to latest secure versions:
  - Next.js: 15.0.3 (from 14.2.24) ✅
  - React: 19.0.0 (from 18.2.0) ✅
  - eslint-config-next: 15.0.3 ✅
- [ ] **TODO:** Run `npm install` to update dependencies
- [ ] **TODO:** Run `npm audit` to verify no critical vulnerabilities
- [ ] **TODO:** Test build locally: `npm run build`
- [ ] **TODO:** Test production server locally: `npm run start`

### 3. Database Optimization (P0)

- [x] Added composite indexes for high-volume queries:
  - Order: [status, createdAt], [customerPhone], [createdAt]
  - OrderItem: [status], [orderId, status]
  - Bill: [status, createdAt], [paidAt]
- [ ] **TODO:** Apply schema changes: `npx prisma db push`
- [ ] **TODO:** Verify indexes created: Check Supabase dashboard
- [ ] **TODO:** Set up database connection pooling (already configured via DATABASE_URL)

### 4. Performance Optimization (P0)

- [x] Created enhanced API client with:
  - Automatic retries (3 attempts with exponential backoff)
  - Request deduplication
  - Client-side rate limiting (50 req/min)
  - 30-second timeout
- [x] Created client-side cache layer:
  - Menu: 5 min TTL
  - Tables: 10 sec TTL
  - Orders: 5 sec TTL
- [x] Created utility functions:
  - formatShortId() for UUID display
  - formatCurrency() for Indian Rupees
  - debounce() and throttle() for performance
- [ ] **TODO:** Implement cache in all data-fetching components
- [ ] **TODO:** Replace raw fetch() calls with apiClient

### 5. Code Quality (P1)

- [x] Created centralized utility library (src/lib/utils.ts)
- [x] Created API client library (src/lib/api-client.ts)
- [x] Created cache library (src/lib/cache.ts)
- [ ] **TODO:** Refactor bills/page.tsx (863 lines → components)
- [ ] **TODO:** Update all UUID displays to use formatShortId()
- [ ] **TODO:** Consolidate duplicate payment modals

---

## 🔧 DEPLOYMENT STEPS

### Step 1: Update Local Environment (5 minutes)

```bash
# 1. Install updated dependencies
npm install

# 2. Verify no vulnerabilities
npm audit

# 3. Apply database schema changes
npx prisma db push

# 4. Test build locally
npm run build

# 5. Test production server locally
npm run start

# 6. Verify application works on http://localhost:3000
```

### Step 2: Update Vercel Environment Variables (10 minutes)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. **Delete old variables if they exist:**
   - Remove any existing DATABASE_URL, NEXTAUTH_SECRET

3. **Add new variables for Production environment:**

```
DATABASE_URL=postgresql://postgres.<your-ref>:<NEW_PASSWORD>@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres

DIRECT_URL=postgresql://postgres.<your-ref>:<NEW_PASSWORD>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres

NEXTAUTH_SECRET=<OUTPUT_OF: openssl rand -base64 32>

NEXTAUTH_URL=https://pos.gen-z.online

TAX_RATE=0.18
```

4. **IMPORTANT:** Set all variables for "Production" environment only
   - Do NOT expose in git
   - Do NOT share publicly

### Step 3: Rotate Supabase Database Password (5 minutes)

1. Go to Supabase Dashboard → Your Project → Settings → Database
2. Click "Reset Database Password"
3. Generate strong password (Save securely!)
4. Update DATABASE_URL and DIRECT_URL in Vercel with new password
5. Test connection from Vercel deployment

### Step 4: Deploy to Vercel (10 minutes)

```bash
# 1. Commit all changes (secrets are now excluded)
git add .
git commit -m "Production-ready: Security fixes, performance optimization, dependency updates"

# 2. Push to main branch (triggers Vercel deployment)
git push origin main

# 3. Monitor deployment in Vercel Dashboard
# Check build logs for any errors

# 4. Once deployed, verify:
# - https://pos.gen-z.online loads correctly
# - Login works with existing credentials
# - Dashboard displays orders, tables, menu
# - Can create new order
# - Can generate bill and print
# - KDS displays orders in real-time
```

### Step 5: Post-Deployment Verification (15 minutes)

**Test Critical Flows:**

1. **Authentication:**
   - [ ] Login with admin@genz.com / admin123
   - [ ] Login with staff@genz.com / staff123
   - [ ] Verify session persists after page refresh
   - [ ] Logout works correctly

2. **Order Flow:**
   - [ ] Create new DINE_IN order
   - [ ] Add multiple menu items
   - [ ] Verify order appears in KDS
   - [ ] Update order status (PREPARING → READY → SERVED)
   - [ ] Verify table status updates

3. **Billing Flow:**
   - [ ] Generate bill from order
   - [ ] Apply discount (verify RBAC: 15% staff, 30% admin)
   - [ ] Add customer phone (loyalty lookup)
   - [ ] Toggle GST on/off
   - [ ] Complete payment (Cash/Online/Split)
   - [ ] Print receipt (verify UUID shows as short ID)
   - [ ] Verify points earned for customer

4. **Performance Test:**
   - [ ] Dashboard loads in <2 seconds
   - [ ] Menu loads in <1 second
   - [ ] Order creation completes in <500ms
   - [ ] Bill generation completes in <1 second
   - [ ] No lag or glitches in UI

5. **KDS Performance:**
   - [ ] Real-time updates appear within 5 seconds
   - [ ] Sound notifications work (after user interaction)
   - [ ] Can handle 20+ pending orders without lag
   - [ ] Status updates reflect immediately

---

## 📊 MONITORING & MAINTENANCE

### Set Up Monitoring (P1 - Do This Week)

1. **Vercel Analytics:**
   ```bash
   # Already included in Vercel deployment
   # Check Dashboard → Analytics
   ```

2. **Error Tracking (Sentry recommended):**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

3. **Uptime Monitoring:**
   - Use UptimeRobot (free) or Vercel Monitoring
   - Set up alerts for downtime

4. **Database Monitoring:**
   - Supabase Dashboard → Database → Logs
   - Monitor connection pool usage
   - Set alerts for high usage (>80% connections)

### Performance Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Page Load Time | <2s | TBD | 🟡 |
| API Response Time | <200ms | TBD | 🟡 |
| Order Creation | <500ms | TBD | 🟡 |
| Bill Generation | <1s | TBD | 🟡 |
| Database Queries | <100ms | TBD | 🟡 |
| Orders/Day Capacity | 1000+ | TBD | 🎯 |

### Daily Health Checks

**Morning Checklist (5 minutes):**
- [ ] Check Vercel deployment status
- [ ] Verify application is accessible
- [ ] Check Supabase database connections
- [ ] Review error logs (if any)
- [ ] Test one complete order flow

**Weekly Checklist (15 minutes):**
- [ ] Review analytics (page views, users, errors)
- [ ] Check database size and growth
- [ ] Review top-selling items
- [ ] Verify backups are working (Supabase automatic)
- [ ] Update dependencies if security patches available

---

## 🚨 INCIDENT RESPONSE

### If Site is Down:

1. **Check Vercel Status:**
   - Go to Vercel Dashboard
   - Check latest deployment logs
   - Look for build errors

2. **Check Database:**
   - Go to Supabase Dashboard
   - Verify database is running
   - Check connection pool usage

3. **Rollback if Needed:**
   ```bash
   # In Vercel Dashboard:
   # Deployments → Previous Deployment → "Redeploy"
   ```

4. **Emergency Contacts:**
   - Vercel Support: https://vercel.com/support
   - Supabase Support: https://supabase.com/dashboard/support

### If Performance is Slow:

1. **Check Database Connections:**
   - Supabase → Database → Connection pooling
   - If >80% used, increase pool size

2. **Check API Rate Limits:**
   - Review server logs for rate limit errors
   - Temporarily increase limits if needed

3. **Clear Vercel Cache:**
   ```bash
   vercel --prod --force
   ```

4. **Database Query Optimization:**
   - Supabase → Database → Query Logs
   - Identify slow queries
   - Add indexes if needed

---

## 🎯 CAPACITY PLANNING

### Current Setup Capacity:

- **Supabase Free Tier:**
  - 500MB database storage
  - 2GB bandwidth
  - Unlimited API requests
  - Connection pooling: 15 connections

- **Vercel Hobby Tier:**
  - 100GB bandwidth
  - 6000 build minutes/month
  - Unlimited deployments

### Estimated Usage for 1000 Orders/Day:

- **Database:**
  - ~50MB/month (10KB per order × 1000 orders × 30 days)
  - Safe for first 6+ months ✅

- **Bandwidth:**
  - ~3GB/month (100KB per page × 1000 users/day × 30 days)
  - Safe for current tier ✅

- **API Requests:**
  - ~50,000 requests/day (50 requests per order × 1000 orders)
  - Well within limits ✅

### When to Upgrade:

**Supabase Pro ($25/month) - Upgrade when:**
- Database > 400MB (80% of 500MB limit)
- Need more than 15 concurrent connections
- Need better performance (dedicated resources)

**Vercel Pro ($20/month) - Upgrade when:**
- Need team collaboration
- Need staging environments
- Need analytics beyond basic
- Need priority support

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] All P0 security issues fixed
- [ ] Dependencies updated to secure versions
- [ ] Database indexes applied
- [ ] Vercel environment variables set correctly
- [ ] Application deployed and accessible
- [ ] All critical flows tested and working
- [ ] Monitoring set up (Vercel Analytics minimum)
- [ ] Team notified of new deployment
- [ ] Documentation updated

---

## 📞 SUPPORT

**For Issues:**
1. Check this deployment guide first
2. Review error logs in Vercel Dashboard
3. Check Supabase logs for database errors
4. Contact development team

**Emergency Rollback:**
```bash
# Vercel Dashboard → Deployments → Select Previous → Redeploy
```

---

**Last Updated:** June 22, 2026  
**Next Review:** After P0 fixes deployed  
**Status:** 🟡 Ready for deployment after environment variable setup
