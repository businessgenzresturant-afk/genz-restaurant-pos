# Production Verification Checklist
**Date:** June 24, 2026  
**URL:** https://pos.gen-z.online

---

## ✅ Quick Health Check

### 1. Login & Authentication
```
[ ] Login with admin@genz.com / admin123
[ ] Dashboard loads successfully
[ ] All 10 tables visible
[ ] Occupied tables show orders
```

### 2. Receipt Format Consistency ⭐ (NEW FIX)
```
Dashboard Receipt:
[ ] Go to Dashboard → Click occupied table
[ ] Click "Generate Bill"
[ ] Verify logo is 120px and clear
[ ] Verify text is readable
[ ] Click print and check output

Bills Page Receipt:
[ ] Go to /bills page
[ ] Click "View & Pay" on any bill
[ ] Verify EXACT same format as dashboard
[ ] Logo should be 120px (same size)
[ ] Fonts should match exactly
[ ] Click print and compare with dashboard print

✅ PASS: Both receipts look identical
❌ FAIL: Receipts have different styling
```

### 3. Full Table Bill ⭐ (CRITICAL FIX)
```
Test Scenario:
[ ] Table 5 → Create Order 1 (2 items) → Send to kitchen
[ ] Wait until order shows in KDS
[ ] Dashboard → Table 5 → "Mark Served"
[ ] Table 5 → "Add Item" → Add 2 more items → Send to kitchen
[ ] Dashboard → Table 5 → "Generate Bill"

Expected Result:
[ ] Bill shows ALL 4 items (2 from Order 1 + 2 from Order 2)
[ ] Total includes both orders
[ ] Bill displays table number correctly

✅ PASS: All items from both orders in bill
❌ FAIL: Only new items showing
```

### 4. Running Table KDS Sound ⚠️ (NEEDS VERIFICATION)
```
Setup:
[ ] Open /kds page in separate window
[ ] Click "Start KDS" to enable audio
[ ] Ensure browser audio permissions granted
[ ] Check console for sound file loading

Test Scenario:
[ ] Table 3 → Create order → Send to kitchen
[ ] KDS should show order with regular sound 🔔
[ ] Dashboard → Table 3 → "Mark Served"
[ ] Table 3 → "Add Item" → Add new item → Send to kitchen
[ ] KDS should show 🔥 URGENT with 3 beeps

Console Logs to Check:
[ ] "🔥 Running table: Order [id] has X new items"
[ ] "🔊 Playing urgent sound"
[ ] "🔔 NEW ORDER RECEIVED" (for first order)
[ ] "🔥 URGENT RUNNING TABLE ADDITION!" (for running order)

✅ PASS: Urgent sound plays for running table
❌ FAIL: No sound or wrong sound type
⚠️  CHECK: Browser console logs for debugging
```

### 5. Bill Generation Flow
```
[ ] Table 2 → Order → Mark Served
[ ] Click "Generate Bill" in drawer
[ ] Drawer closes immediately ✓ (expected)
[ ] Payment modal opens ✓ (expected)
[ ] Toast shows "✅ Bill ready!"
[ ] Select Cash payment
[ ] Click "Mark as Paid"
[ ] Table clears and becomes available

✅ PASS: Smooth transition from drawer to payment modal
❌ FAIL: Drawer stays open or modal doesn't open
```

---

## 🔍 Detailed Verification

### A. Security Verification
```
Registration Test:
[ ] Logout
[ ] Go to /register
[ ] Create new account: test@example.com
[ ] Login with new account
[ ] Check role (should be STAFF, not ADMIN)

Admin Check:
[ ] Login as admin@genz.com
[ ] Go to /admin/seed
[ ] Click "Check Users"
[ ] Verify only 4-5 users exist
[ ] Verify only admin@genz.com is ADMIN

✅ PASS: New registrations are STAFF only
❌ FAIL: New user became ADMIN
```

### B. Database Verification
```
[ ] Go to https://pos.gen-z.online/api/admin/check-users
[ ] Expected JSON response:
    {
      "success": true,
      "databaseStatus": {
        "users": 4-5,
        "tables": 10,
        "menuItems": 181,
        "orders": 75+
      }
    }

✅ PASS: Database shows data
❌ FAIL: Empty database or error
```

### C. Session Validation
```
If Dashboard Shows "No Tables":
[ ] Go to https://pos.gen-z.online/api/debug/session
[ ] Check if restaurantId exists in session
[ ] If missing: Logout → Login again
[ ] Dashboard should now load tables

✅ PASS: Tables load after re-login
❌ FAIL: Still no tables after re-login
```

---

## 🎯 Critical Paths (Must Work)

### Path 1: New Order → Bill → Payment
```
1. [ ] Select available table
2. [ ] Create order (add 2-3 items)
3. [ ] Send to kitchen
4. [ ] KDS shows order ✓
5. [ ] Mark as "Served"
6. [ ] Generate bill
7. [ ] Verify bill total correct
8. [ ] Mark as paid (Cash)
9. [ ] Table becomes available
10. [ ] Bill appears in /bills page
```

### Path 2: Running Table Flow
```
1. [ ] Table 4 → Order (Paneer Tikka)
2. [ ] Send to kitchen
3. [ ] KDS shows order
4. [ ] Mark as "Served"
5. [ ] Table 4 → "Add Item" (Naan)
6. [ ] Send to kitchen
7. [ ] KDS shows 🔥 URGENT
8. [ ] KDS plays 3 beeps ⚠️
9. [ ] Mark as "Served"
10. [ ] Generate bill
11. [ ] Bill shows BOTH items ✓
12. [ ] Total = Paneer + Naan
```

### Path 3: Takeaway/Delivery
```
1. [ ] Dashboard → "Takeaway" tab
2. [ ] Create order
3. [ ] Customer name: "John"
4. [ ] Add items
5. [ ] Send to kitchen
6. [ ] KDS shows order with 🛍️ icon
7. [ ] Mark as "Served"
8. [ ] Generate bill
9. [ ] Pay & print receipt
10. [ ] Receipt shows "Takeaway" type
```

---

## 🐛 Known Issues to Watch

1. **KDS Sound Not Playing**
   - Check browser console for errors
   - Verify audio permissions granted
   - Test in Chrome (Safari may block autoplay)
   - Look for console log: "🔊 Playing urgent sound"

2. **Items Disappearing**
   - If old items missing from bill, check:
   - Are orders marked as SERVED? ✓
   - Does bill show all unbilled orders? ✓
   - Check console for bill creation logs

3. **Drawer Closes Before Bill**
   - This is EXPECTED behavior ✓
   - Drawer should close → Payment modal opens
   - If modal doesn't open, that's the bug

---

## 📸 Screenshots to Take

For documentation, capture:
```
[ ] Dashboard with all tables
[ ] Receipt from dashboard (printed format)
[ ] Receipt from bills page (printed format)
[ ] KDS display with urgent order (🔥 indicator)
[ ] Full table bill showing multiple orders
[ ] Payment modal
[ ] Bills page list view
```

---

## 🚨 Stop and Report If:

- ❌ New registration creates ADMIN user
- ❌ Bill missing items from previous orders
- ❌ Dashboard shows "No Tables" after re-login
- ❌ Receipt format different between pages
- ❌ Bill generation crashes
- ❌ Payment modal doesn't open
- ❌ Table doesn't clear after payment

---

## ✅ Success Criteria

All of these must pass:
- [x] Build completes successfully
- [ ] All 10 tables visible on dashboard
- [ ] Full table bill includes all orders
- [ ] Receipt format consistent (dashboard & bills page)
- [ ] Payment flow works smoothly
- [ ] KDS shows orders in real-time
- [ ] Running table detection works (with/without sound)
- [ ] New registrations create STAFF only

---

**Last Updated:** June 24, 2026  
**Fixes Deployed:** Task 8 (Receipt Consistency) ✅  
**Next Deploy:** Test → Deploy → Verify
