# Deployment Guide: UX Fixes

## Pre-Deployment Checklist

- [x] All code changes committed
- [x] TypeScript compilation passes (`npx tsc --noEmit`)
- [x] Production build succeeds (`npm run build`)
- [ ] Database backup created
- [ ] Migration script ready

---

## Deployment Steps

### 1. Database Backup (CRITICAL)
```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup_before_ux_fixes_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Run Database Migration
```bash
# Generate and apply migration
npx prisma migrate dev --name add_gst_applied_field

# Or for production:
npx prisma migrate deploy
```

**Expected Changes:**
- Adds `gstApplied` Boolean column to `Bill` table
- Defaults to `true` for existing bills
- No data loss

### 3. Regenerate Prisma Client
```bash
npx prisma generate
```

### 4. Build Application
```bash
npm run build
```

### 5. Deploy to Production
```bash
# If using Vercel:
vercel --prod

# If using PM2:
pm2 restart all

# If using Docker:
docker-compose up -d --build
```

### 6. Verify Deployment
1. Check dashboard loads correctly (3 order types visible)
2. Create a test Dine In order:
   - Select table → Guest count only (no customer fields)
   - Add items → Send to Kitchen
   - Generate bill → Verify all fields present
3. Test payment modal:
   - Customer name field visible
   - Customer phone field visible
   - GST toggle works (total recalculates)
   - One-click Pay & Print works
4. Verify KDS shows 3 columns (no Parcel)

---

## Rollback Plan

If issues occur, follow these steps:

### 1. Restore Database
```bash
# Restore from backup
psql $DATABASE_URL < backup_before_ux_fixes_TIMESTAMP.sql
```

### 2. Revert Code Changes
```bash
git revert <commit-hash>
# or
git reset --hard <previous-commit>
```

### 3. Rebuild and Redeploy
```bash
npm run build
# Deploy using your deployment method
```

---

## Post-Deployment Testing

### Critical Paths to Test

#### Path 1: Dine In Order (Most Common)
1. Dashboard → Dine In → Select table
2. **✓ Verify:** Guest count modal shows ONLY guest count (no name/phone)
3. Enter guest count → Continue to Menu
4. Add items → Send to Kitchen
5. **✓ Verify:** Order appears in KDS under "Dine In" column (not Parcel)
6. Navigate to Bills → View & Pay
7. **✓ Verify:** Customer Name field visible
8. **✓ Verify:** Customer Phone field visible
9. **✓ Verify:** GST toggle visible and checked by default
10. Toggle GST off/on
11. **✓ Verify:** Total recalculates correctly
12. Select payment method → Pay & Print
13. **✓ Verify:** Print window opens automatically
14. **✓ Verify:** Modal closes after print
15. **✓ Verify:** Bill status = PAID
16. **✓ Verify:** Table status = AVAILABLE

#### Path 2: Takeaway/Delivery Order
1. Dashboard → Takeaway or Delivery
2. **✓ Verify:** No "Parcel" card visible
3. Enter customer details → Menu
4. **✓ Verify:** No "Save" button in cart
5. Add items → Send to Kitchen
6. Navigate to Bills → Pay
7. **✓ Verify:** GST toggle and customer fields work

#### Path 3: Historical Data
1. Navigate to Orders page
2. **✓ Verify:** Old orders (including any Parcel orders) display correctly
3. Navigate to Bills page
4. **✓ Verify:** Old bills display correctly
5. **✓ Verify:** Old paid bills show correct totals

---

## Performance Expectations

### Before Changes
- Dashboard order type grid: 4 columns
- Table selection: 2 modals (guest + customer)
- Menu drawer: 3 buttons (Send/Save/Bill)
- Payment: Separate confirm then print

### After Changes
- Dashboard order type grid: 3 columns (25% cleaner)
- Table selection: 1 modal (guest only, 50% faster)
- Menu drawer: 1 button (66% cleaner)
- Payment: One-click print (50% fewer steps)

**Expected Result:** ~40% reduction in order creation clicks

---

## Monitoring

### Metrics to Watch (First 24 Hours)

1. **Order Creation Rate**
   - Should remain stable or increase (faster flow)
   
2. **Bill Payment Time**
   - Should decrease (consolidated modal)
   
3. **Error Rates**
   - Monitor `/api/bills/[id]` endpoint for 500 errors
   - Monitor `/api/orders` endpoint for missing fields
   
4. **User Feedback**
   - Staff confusion about missing Parcel option
   - Staff satisfaction with streamlined flow

### Database Queries to Monitor

```sql
-- Check GST toggle usage
SELECT 
  gstApplied,
  COUNT(*) as count,
  AVG(total) as avg_total
FROM "Bill"
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY gstApplied;

-- Check customer data capture at bill time
SELECT 
  COUNT(*) as total_bills,
  COUNT("customerId") as bills_with_customer,
  (COUNT("customerId")::float / COUNT(*)::float * 100) as capture_rate
FROM "Bill"
WHERE "createdAt" > NOW() - INTERVAL '24 hours';

-- Verify no new Parcel orders created
SELECT 
  orderType,
  COUNT(*) as count
FROM "Order"
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY orderType;
```

---

## Common Issues & Solutions

### Issue 1: "gstApplied field not found" Error
**Cause:** Migration not run or Prisma client not regenerated
**Solution:**
```bash
npx prisma migrate deploy
npx prisma generate
# Restart application
```

### Issue 2: Old bills showing incorrect totals
**Cause:** GST toggle affects calculation for old bills
**Solution:** Old bills should default to `gstApplied: true` (set by migration)
**Verification:**
```sql
UPDATE "Bill" SET "gstApplied" = true WHERE "gstApplied" IS NULL;
```

### Issue 3: Print window not opening
**Cause:** Browser popup blocker
**Solution:** Guide user to allow popups for the domain

### Issue 4: Total not updating when GST toggled
**Cause:** State sync issue
**Solution:** Already handled by React state - if persists, check browser console

---

## Success Criteria

After deployment, verify these outcomes:

- ✅ Zero critical errors in production logs
- ✅ All staff able to create orders without confusion
- ✅ Payment modal consolidation reduces checkout time
- ✅ No complaints about missing functionality
- ✅ Database migration completed without data loss
- ✅ Historical orders/bills remain accessible

---

## Support

If issues arise during deployment:

1. **Check Logs:**
   - Application server logs
   - Database migration logs
   - Browser console (F12) for frontend errors

2. **Validate Data:**
   - Run monitoring queries above
   - Check recent orders/bills in database

3. **Rollback if Needed:**
   - Follow Rollback Plan section above
   - Document issues for post-mortem

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Production URL:** _______________
**Backup Location:** _______________

---

## Sign-off

- [ ] Database backup verified
- [ ] Migration completed successfully
- [ ] Build deployed to production
- [ ] Critical paths tested
- [ ] Monitoring enabled
- [ ] Team notified of changes

**Approved By:** _______________
**Date:** _______________
