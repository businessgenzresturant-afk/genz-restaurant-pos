# Production Testing Guide - Final Verification

**Date:** June 24, 2026  
**URL:** https://pos.gen-z.online  
**Login:** admin@genz.com / admin123

---

## ✅ ALL FIXES DEPLOYED

### 1. Database Connection ✅
- Reduced polling by 67%
- Fixed seed route leak
- Using Transaction Pooler
- Connection limit: 1

### 2. Menu Delete ✅
- Shows error if item used in orders
- Suggests marking unavailable

### 3. Table Transfer ✅
- **NEW:** Bill transfers with order
- All data preserved

### 4. Full Table Bill ✅
- Already working correctly
- Includes all unbilled orders

### 5. KDS Sound ✅
- Logic correct, needs browser test

---

## 🧪 TESTING SEQUENCE

### Test 1: Database Connection (2 min)

**Open in browser:**
```
https://pos.gen-z.online/api/admin/check-users
```

**Expected:**
```json
{
  "success": true,
  "databaseStatus": {
    "users": 4,
    "tables": 10,
    "menuItems": 181,
    "orders": 75+
  }
}
```

**If Shows:** ✅ Database connected!  
**If Error:** ❌ Check Vercel env vars

---

### Test 2: KDS Sound - New Order (3 min)

**Setup:**
1. Open KDS: https://pos.gen-z.online/kds
2. Click: "Start KDS" (important!)
3. Open Console: Press F12
4. Keep tab VISIBLE

**Create Order:**
1. Open Dashboard in new tab
2. Login: admin@genz.com / admin123
3. Select Table 5 → "Add Items"
4. Add: Butter Chicken
5. Click: "Send to Kitchen"

**Check KDS Tab:**
```
Console Should Show:
✅ "🆕 New order detected: [orderId]"
✅ "🔊 Playing new sound"
✅ Toast: "🔔 NEW ORDER RECEIVED"

Should Hear:
✅ Beep sound (new-order.mp3)
```

**If No Sound:**
- Did you click "Start KDS"? 
- Is tab visible?
- Is sound toggle "SOUND ON"?
- Check browser console for errors

---

### Test 3: KDS Sound - Running Table (3 min)

**Setup:** (Use same KDS tab from Test 2)

**Create Running Table:**
1. Dashboard → Table 5 (has order)
2. Click: "Mark as Served"
3. Table 5 → "Add Items" again
4. Add: Naan
5. Click: "Send to Kitchen"

**Check KDS Tab:**
```
Console Should Show:
✅ "🔥 Running table: Order [id] has 1 new items"
✅ "🔊 Playing urgent sound"  
✅ Toast: "🔥 URGENT RUNNING TABLE ADDITION!"

Should Hear:
✅ 3 quick beeps (urgent.mp3 plays 3 times)

KDS Display:
✅ Shows 🔥 URGENT badge on order
```

---

### Test 4: Full Table Bill (5 min)

**Create Multiple Orders:**
```
1. Dashboard → Table 3
2. "Add Items" → Paneer Tikka (₹200)
3. "Send to Kitchen"
4. Wait 2 seconds
5. "Mark as Served"

6. Table 3 → "Add Items" (again)
7. Add: Naan (₹50)
8. "Send to Kitchen"
9. "Mark as Served"

10. Table 3 → "Generate Bill"
```

**Check Bill Modal:**
```
Should Show ALL Items:
✅ 1× Paneer Tikka - ₹200.00
✅ 1× Naan - ₹50.00

Subtotal: ₹250.00
Tax (18%): ₹45.00
Total: ₹295.00
```

**Console Check:**
```
Look for:
[Bill Creation] Table 3: Finding all unbilled orders
[Bill Creation] Found 2 unbilled orders for Table 3
  Order 1: 1 items, Status: SERVED, Amount: ₹200
  Order 2: 1 items, Status: SERVED, Amount: ₹50
[Bill Creation] Creating bill for Table 3
  Total orders: 2
  Subtotal: ₹250
  Total: ₹295
```

---

### Test 5: Table Transfer WITHOUT Bill (3 min)

**Setup:**
```
1. Dashboard → Table 1
2. "Add Items" → Dal Makhani
3. "Send to Kitchen"
4. Do NOT generate bill yet
```

**Transfer:**
```
1. Table 1 drawer → Click "Transfer Table"
2. Select: Table 6
3. Click: "Confirm"
```

**Verify:**
```
✅ Table 1 becomes "Available"
✅ Table 6 becomes "Occupied"
✅ Order appears in Table 6 drawer
✅ Items are same
✅ Amount is same
```

---

### Test 6: Table Transfer WITH Bill (5 min)

**Setup:**
```
1. Dashboard → Table 2
2. "Add Items" → Butter Naan
3. "Send to Kitchen"
4. "Mark as Served"
5. "Generate Bill" (Important!)
6. Note: Bill shows "Table 2"
```

**Transfer:**
```
1. Table 2 drawer → "Transfer Table"
2. Select: Table 7
3. Click: "Confirm"
```

**Verify Bill:**
```
1. Go to: /bills page
2. Find the bill just generated
3. Click: "View & Pay"

Expected:
✅ Bill now shows "Table 7" (not Table 2)
✅ Order items unchanged
✅ Amount unchanged
✅ Status unchanged
```

**Console Check:**
```
Look for:
✅ Bill [id] transferred to Table 7
✅ Order [id] transferred: Table 2 → Table 7
✅ Table 2 marked as AVAILABLE
```

---

### Test 7: Menu Item Delete (2 min)

**Try Deleting Used Item:**
```
1. Dashboard → Menu page
2. Find: "Paneer Tikka" (used in previous tests)
3. Click: Delete icon
4. Confirm deletion
```

**Expected Result:**
```
❌ Error toast appears:
"Cannot delete menu item that has been ordered"
"This item is used in X order(s). You can mark it as unavailable instead."
```

**Try Deleting Unused Item:**
```
1. Menu → Find item never ordered
2. Click: Delete
3. Confirm

Expected:
✅ "Menu item deleted successfully!"
✅ Item removed from list
```

---

## 📊 SUCCESS CRITERIA

All must pass:

### Database:
- [x] `/api/admin/check-users` returns JSON
- [x] No "max clients" errors
- [x] Dashboard loads all tables
- [x] Orders can be created

### KDS Sound:
- [ ] "Start KDS" button clicked
- [ ] New order plays beep sound
- [ ] Running table plays 3 urgent beeps
- [ ] Console shows sound logs
- [ ] Toast notifications appear

### Full Table Bill:
- [ ] Multiple orders on same table
- [ ] Bill includes ALL items
- [ ] Total = sum of all orders + tax
- [ ] Console logs show all orders

### Table Transfer:
- [ ] Order moves to new table
- [ ] Bill moves with order
- [ ] Old table becomes available
- [ ] New table becomes occupied
- [ ] No data loss

### Menu Delete:
- [ ] Used items show error
- [ ] Unused items can delete
- [ ] Error message clear

---

## 🚨 Common Issues & Solutions

### Issue: KDS Sound Not Playing

**Check:**
1. Did you click "Start KDS"? (Required!)
2. Is KDS tab visible? (Background tabs don't poll)
3. Is sound toggle "SOUND ON"?
4. Check browser console for errors

**Test Sound Files:**
```javascript
// Open browser console on KDS page
const audio = new Audio('/sounds/new-order.mp3');
audio.play();

const urgent = new Audio('/sounds/urgent.mp3');
urgent.play();
```

**If Still No Sound:**
- Browser may block autoplay
- Check browser audio permissions
- Try different browser (Chrome recommended)

---

### Issue: Bill Not Including Old Orders

**Check:**
1. Are old orders marked "SERVED"? (Not PENDING)
2. Did you already generate bill for them?
3. Check console logs for "Found X unbilled orders"

**Debug:**
```
Dashboard → Table → Check order status
Should be: SERVED (green)
Not: PENDING (yellow) or COMPLETED (blue)
```

---

### Issue: Table Transfer Not Working

**Check:**
1. Is order in PENDING, PREPARING, or READY status?
2. Is target table different from current?
3. Check console for error messages

**Debug:**
```
Browser Console → Network tab
Look for: POST /api/orders/[id]/transfer
Status should be: 200 OK
Response: {"success": true, "oldTable": 2, "newTable": 7}
```

---

### Issue: Menu Delete Still Failing

**Check:**
1. Has item been ordered before?
2. Are there existing OrderItems?
3. Error message shows?

**Workaround:**
Instead of deleting, mark as unavailable:
```
Menu → Edit item → Toggle "Available" to OFF
```

---

## 🎯 Quick Health Check (30 seconds)

```bash
# Test 1: Database
curl https://pos.gen-z.online/api/admin/check-users
Expected: {"success":true,...}

# Test 2: Login
Open: https://pos.gen-z.online/login
Login: admin@genz.com / admin123
Expected: Dashboard loads ✅

# Test 3: Tables
Dashboard should show: 10 tables
Expected: All visible ✅

# Test 4: Create Order
Table 8 → Add Items → Chai → Send
Expected: Order created ✅

# Test 5: KDS
Open: https://pos.gen-z.online/kds
Expected: Chai order visible ✅
```

If all 5 pass: **System is working!** ✅

---

## 📝 Report Template

After testing, report results:

```
✅ Database Connection: Working / Not Working
✅ KDS Sound (New Order): Working / Not Working  
✅ KDS Sound (Running Table): Working / Not Working
✅ Full Table Bill: Working / Not Working
✅ Table Transfer (No Bill): Working / Not Working
✅ Table Transfer (With Bill): Working / Not Working
✅ Menu Delete: Working / Not Working

Notes:
- [Any issues found]
- [Browser used]
- [Console errors (if any)]
```

---

## 🔧 Emergency Rollback

If something breaks:

```bash
# Vercel Dashboard
1. Go to: Deployments
2. Find: Previous working deployment
3. Click: "..." → "Promote to Production"
4. Wait: 2 minutes
5. Test: System should work again
```

---

**Testing Started:** [Fill date/time]  
**Testing Completed:** [Fill date/time]  
**All Tests Passed:** YES / NO  
**Issues Found:** [List]  
**Status:** READY FOR PRODUCTION / NEEDS FIXES
