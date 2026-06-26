# 🧪 Comprehensive Test Scenarios - ALL Possible Cases

## ✅ VERIFIED FIXES (Already Handled)

### 1. Cancel Items + Bill Generation ✅
**Scenario**: Cancel kuch items, phir bill generate
- Table 1: Add 3 items (Coke ₹40, Papad ₹40, Ghaach ₹60)
- Cancel "Ghaach"
- Mark as served
- Generate bill
- ✅ **FIXED**: Bill shows ₹80 (only active items)
- ✅ **FIXED**: Cancelled items excluded from calculation
- ✅ **CODE**: Line 217-221 in bills/route.ts filters `status === 'ACTIVE'`

### 2. Cancel ALL Items ✅
**Scenario**: Sabhi items cancel kar do
- Table 1: Add 3 items
- Cancel all 3 items
- Try to generate bill
- ✅ **FIXED**: Error - "Cannot generate bill: All items cancelled"
- ✅ **FIXED**: Table auto-clears (no active items)
- ✅ **CODE**: Line 230-238 checks subtotal ≤ 0
- ✅ **CODE**: Line 117-131 in items/[itemId]/route.ts auto-clears table

### 3. Already Billed Order ✅
**Scenario**: Dubara bill generate karne ki koshish
- Table 1: Generate bill
- Try to generate bill again
- ✅ **FIXED**: Error - "Order already has bill"
- ✅ **CODE**: Line 173-180 checks `order.bill !== null`

### 4. Running Table - Add Items After Served ✅
**Scenario**: Served order pe nayi items add karo
- Table 1: Order A,B,C → Mark as SERVED
- Table 1: Add items D,E
- ✅ **FIXED**: Appends to same order (not new order)
- ✅ **CODE**: Line 252-255 checks status `notIn: ['COMPLETED']`

### 5. Multiple Orders Same Table ✅
**Scenario**: Ek table pe multiple orders
- Table 1: Order 1 (2 items)
- Table 1: Order 2 (3 items) [before billing order 1]
- Generate bill
- ✅ **FIXED**: Bill includes ALL unbilled orders (5 items total)
- ✅ **CODE**: Line 189-207 filters by tableId with active items

---

## 🔍 ADDITIONAL SCENARIOS TO CHECK

### Category A: Order Status Transitions

#### A1. Mark as Served → Add More Items → Bill
**Flow**:
1. Table 2: Add Paneer (₹200)
2. Mark as SERVED
3. Table 2: Add Naan (₹50)
4. Generate Bill
**Expected**: Bill = ₹250 + tax
**Potential Issue**: ❓ Does table stay RUNNING? Does order status reset to PENDING?
**CHECK NEEDED**: Line 295 in orders/[id]/route.ts sets table to RUNNING

---

#### A2. Mark as Ready → Bill (without marking served)
**Flow**:
1. Table 3: Add items
2. Kitchen marks as READY
3. Try to generate bill (without marking SERVED)
**Expected**: Auto-mark as SERVED, then bill
**VERIFIED**: ✅ Line 170-174 in bills/route.ts auto-marks READY → SERVED

---

#### A3. Cancel Item → Still in Kitchen (PREPARING)
**Flow**:
1. Table 4: Add items → Send to kitchen (PREPARING)
2. Cancel 1 item before it's READY
**Expected**: Item cancelled, amount reduced
**Potential Issue**: ❓ Kitchen still sees cancelled item?
**CHECK**: Does KDS filter out CANCELLED items?

---

### Category B: Payment & Bill Status

#### B1. Generate Bill → Customer Leaves Without Paying
**Flow**:
1. Generate bill
2. Don't complete payment
3. Try to clear table
**Expected**: Error - "Unpaid bill exists"
**VERIFIED**: ✅ Line 39-49 in tables/[id]/clear/route.ts checks unpaid bills

---

#### B2. Partial Cancel After Bill Generated
**Flow**:
1. Table 5: Add 3 items
2. Generate bill (status = PENDING)
3. Customer says "remove 1 item"
4. Try to cancel item
**Expected**: Error - "Cannot cancel items from paid orders"
**CHECK**: Line 81-87 in items/[itemId]/route.ts checks status = 'PAID'
**ISSUE**: ❓ What if bill status is 'PENDING' not 'PAID'?

---

#### B3. Multiple Bills Same Table (Edge Case)
**Flow**:
1. Table 6: Order 1 → Bill 1 → Pay
2. Table 6: Order 2 → Bill 2 → Pay
**Expected**: Both bills should work independently
**Potential Issue**: ❓ Does table clear properly between bills?

---

### Category C: Concurrent Operations (Race Conditions)

#### C1. Two Waiters Add Items Simultaneously
**Flow**:
- Waiter A: Table 7 → Add item X (11:00:00)
- Waiter B: Table 7 → Add item Y (11:00:01)
**Expected**: Both items in same order, no data loss
**VERIFIED**: ✅ Optimistic locking with version check (Line 291-299 in orders/route.ts)

---

#### C2. Generate Bill While Kitchen Updates Status
**Flow**:
- Waiter: Generate bill (11:00:00)
- Kitchen: Mark as READY (11:00:01)
**Expected**: Bill generation should succeed
**Potential Issue**: ❓ Transaction conflict?

---

#### C3. Cancel Item While Adding New Item
**Flow**:
- Waiter A: Cancel item X (11:00:00)
- Waiter B: Add item Z (11:00:01)
**Expected**: Cancel succeeds, new item added
**CHECK**: Transaction isolation

---

### Category D: Stock Management

#### D1. Order Item with 0 Stock
**Flow**:
1. Coke stock = 0
2. Try to order Coke
**Expected**: Error or warning
**CHECK**: ❓ No validation found in orders/route.ts

---

#### D2. Cancel Item → Stock Restore?
**Flow**:
1. Order Coke (stock: 10 → 9)
2. Cancel Coke
**Expected**: Stock should restore (9 → 10)
**CHECK**: ❌ NOT IMPLEMENTED in items/[itemId]/route.ts

---

### Category E: Table Management

#### E1. Transfer Table with Unpaid Bill
**Flow**:
1. Table 8: Order → Generate bill
2. Transfer to Table 9
**Expected**: Error - cannot transfer with unpaid bill
**CHECK**: ❓ No validation in transfer endpoint

---

#### E2. Clear Table with SERVED Order (No Bill)
**Flow**:
1. Table 10: Order → Mark as SERVED
2. Try to force clear table (without generating bill)
**Expected**: Error - "Active orders found"
**VERIFIED**: ✅ Line 57-65 in tables/[id]/clear/route.ts checks active orders

---

### Category F: Special Cases

#### F1. Half-Price Items in Bill
**Flow**:
1. Order "Paneer HALF" (₹100 instead of ₹180)
2. Generate bill
**Expected**: Bill shows ₹100
**VERIFIED**: ✅ Line 218 in bills/route.ts uses `item.price * item.quantity`

---

#### F2. Special Instructions Too Long
**Flow**:
1. Add item with 5000 character special instruction
**Expected**: Error or truncated
**VERIFIED**: ✅ Sanitized in orders/route.ts Line 120

---

#### F3. Takeaway/Delivery Orders (No Table)
**Flow**:
1. Create TAKEAWAY order (no tableId)
2. Generate bill
**Expected**: Bill works without table
**VERIFIED**: ✅ Line 199-207 handles `!order.tableId`

---

## 🐛 IDENTIFIED ISSUES TO FIX

### ISSUE 1: Stock Not Restored on Cancel ❌
**Location**: `src/app/api/orders/[id]/items/[itemId]/route.ts`
**Problem**: When item cancelled, stock not restored
**Fix Needed**:
```typescript
// Line 96 - After cancelling item
const menuItem = await tx.menuItem.findUnique({
  where: { id: orderItem.menuItemId }
});

if (menuItem && menuItem.stockQuantity !== null) {
  await tx.menuItem.update({
    where: { id: orderItem.menuItemId },
    data: {
      stockQuantity: { increment: orderItem.quantity },
      available: true
    }
  });
}
```

---

### ISSUE 2: Cancel Item from PENDING Bill ❌
**Location**: `src/app/api/orders/[id]/items/[itemId]/route.ts` Line 81-87
**Problem**: Can cancel items even after bill generated (status PENDING)
**Current Code**:
```typescript
const bill = await prisma.bill.findFirst({
  where: { orderId: id, status: 'PAID' }  // Only checks PAID
});
```
**Fix Needed**:
```typescript
const bill = await prisma.bill.findFirst({
  where: { orderId: id }  // Check ANY bill, not just PAID
});

if (bill) {
  return NextResponse.json(
    { error: 'Cannot cancel items after bill generated' },
    { status: 400 }
  );
}
```

---

### ISSUE 3: No Stock Validation on Order ❌
**Location**: `src/app/api/orders/route.ts`
**Problem**: Can order items with 0 or negative stock
**Fix Needed**: Add validation before creating order

---

### ISSUE 4: Transfer Table with Unpaid Bill ❌
**Location**: `src/app/api/orders/[id]/transfer/route.ts`
**Problem**: Can transfer table even if bill is unpaid
**Fix Needed**: Check for unpaid bills before transfer

---

## 📝 Testing Checklist

### Priority 0 (Blocker) - Test Immediately
- [ ] Cancel items + Generate bill
- [ ] Cancel ALL items
- [ ] Already billed order error
- [ ] Running table (add after served)
- [ ] Multiple orders same table

### Priority 1 (Critical)
- [ ] Mark as served functionality
- [ ] Bill generation with cancelled items
- [ ] Table clear with unpaid bill (should fail)
- [ ] Concurrent operations (2 waiters)

### Priority 2 (Important)
- [ ] Stock restore on cancel
- [ ] Cancel item after bill generated
- [ ] Transfer table with unpaid bill
- [ ] Half-price items in bill

### Priority 3 (Nice to Have)
- [ ] Takeaway orders
- [ ] Special instructions validation
- [ ] Stock validation on order
- [ ] Multiple bills same table

---

## 🚀 Quick Test Commands

```bash
# Test bill generation
curl -X POST http://localhost:3000/api/bills \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORDER_ID"}'

# Test cancel item
curl -X PATCH http://localhost:3000/api/orders/ORDER_ID/items/ITEM_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "CANCELLED", "cancelReason": "Test"}'

# Test mark as served
curl -X PATCH http://localhost:3000/api/orders/ORDER_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "SERVED"}'
```

---

## 🎯 Success Criteria

**All scenarios must pass without errors:**
- ✅ No data loss
- ✅ No race conditions
- ✅ Correct amount calculations
- ✅ Proper error messages
- ✅ Table status correct
- ✅ Stock management correct
- ✅ Bill status accurate
