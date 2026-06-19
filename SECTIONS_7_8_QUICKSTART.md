# Sections 7 & 8 Quick Start Guide

## 🚀 What's New

Two powerful features have been added to your POS system:

### 1. **Item Cancellation** (Section 7)
Cancel individual items from active orders with full audit trail and automatic refund calculation.

### 2. **KDS Sound Alerts** (Section 8)
Repeating audio notifications for new orders and urgent running table additions.

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Verify Database
The schema already includes the necessary fields. Just regenerate the Prisma Client:

```bash
cd /Users/raghavshah/GenZ_Restaurant_POS
npx prisma generate
```

✅ Done! No migration needed - schema was already correct.

### Step 2: Add Sound Files (Optional but Recommended)

The system works without sounds, but for the full experience:

1. **Download sounds** from free libraries:
   - https://freesound.org/ (search for "notification" or "beep")
   - https://mixkit.co/free-sound-effects/ 
   - https://www.zapsplat.com/

2. **Replace placeholder files**:
   ```bash
   # Replace these files with your downloaded sounds
   # Files are located in:
   /Users/raghavshah/GenZ_Restaurant_POS/public/sounds/
   
   # Replace:
   - new-order.mp3     (standard notification, ~1 second)
   - urgent.mp3        (urgent alert, quick beep, ~0.5 seconds)
   ```

3. **Recommended sound characteristics**:
   - Format: MP3
   - Size: < 100KB each
   - Duration: 0.5-2 seconds
   - Volume: Medium (users can adjust device volume)

### Step 3: Test the Features

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test Item Cancellation**:
   - Go to `/orders`
   - Create an order with 3+ items
   - Click "View All Items" on the active order
   - Click "Cancel" next to an item
   - Verify the item shows as cancelled with strikethrough
   - Check that the total is recalculated

3. **Test KDS Sounds**:
   - Open `/kds` in a browser tab
   - In another tab, go to `/orders`
   - Create a new order
   - Listen for the notification sound in KDS
   - Click "Acknowledge" button to stop repeats
   - Try the sound toggle (mute/unmute)

---

## 📖 User Guide

### For Waiters/Order Takers:

**Cancelling Items from an Order**:
1. Go to Orders page
2. Find the active order in the "Active Orders" section
3. Click "View All Items →" link
4. In the modal, click "Cancel" next to the item you want to remove
5. Confirm the cancellation
6. The order total updates automatically
7. Kitchen will see the cancelled item on KDS

**What happens when you cancel**:
- ✅ Item marked as CANCELLED (not deleted)
- ✅ Order total recalculated
- ✅ Stock restored to inventory
- ✅ Audit trail maintained
- ✅ Kitchen notified via KDS

**Restrictions**:
- ❌ Cannot cancel items from COMPLETED orders
- ❌ Cannot cancel items after bill is generated
- ✅ Can cancel from PENDING or PREPARING orders

### For Kitchen Staff (KDS):

**Visual Indicators**:
- 🟢 **NEW badge + green pulse**: Just added (< 5 seconds ago)
- ❌ **Red strikethrough**: Item cancelled by waiter
- 🔥 **URGENT + red background**: Running table addition (items added > 1 min after order)

**Sound Alerts**:
- 🔔 **Standard beep**: New order received
  - Repeats every 30 seconds
  - Up to 4 times (2 minutes total)
  
- 🚨 **Triple beep (urgent)**: Running table addition
  - 3 quick beeps in succession
  - Repeats every 30 seconds
  - Up to 4 times (2 minutes total)

**Sound Controls**:
- 🔊/🔇 **Sound Toggle**: Top right corner - click to mute/unmute
- 🔔 **Acknowledge Button**: Click to stop all pending sound repeats
  - Shows count of pending notifications
  - Pulsing amber button
  - Only visible when sounds are queued

**Best Practices**:
1. Keep sound enabled during service hours
2. Acknowledge sounds once you've seen the order
3. Watch for NEW badges on running tables
4. Cancelled items will fade out - no need to prepare them

---

## 🔧 Configuration Options

### Sound Repeat Settings

Edit `/src/app/(pos)/kds/page.tsx` to customize:

```typescript
// Line ~165 - Repeat interval (default: 30 seconds)
}, 30000); // Change to 20000 for 20 seconds, etc.

// Line ~157 - Max repeats (default: 4 times = 2 minutes)
if (existing.repeatCount >= 3) { // Change to 5 for 3 minutes, etc.
```

### Urgent Item Threshold

Edit `/src/app/(pos)/kds/page.tsx` to customize:

```typescript
// Line ~194 - Time threshold for "urgent" (default: 60 seconds)
return new Date(i.createdAt).getTime() - orderTime > 60000;
// Change 60000 to 120000 for 2 minutes, 30000 for 30 seconds, etc.
```

### New Item Highlight Duration

Edit `/src/app/(pos)/kds/page.tsx` to customize:

```typescript
// Line ~260 - Highlight duration (default: 5 seconds)
return (nowTime - itemTime) < 5000;
// Change 5000 to 3000 for 3 seconds, 10000 for 10 seconds, etc.
```

---

## 🐛 Troubleshooting

### Issue: Sounds not playing

**Possible Causes**:
1. Browser autoplay policy blocking
   - **Solution**: Click anywhere on the KDS page first (user interaction required)
   
2. Sound files missing or corrupt
   - **Solution**: Check `/public/sounds/` directory has valid MP3 files
   
3. Device volume muted
   - **Solution**: Check system volume and browser tab volume

4. Sound toggle is OFF
   - **Solution**: Click the sound toggle button in KDS header

**Test Command**:
```bash
# Check if sound files exist and are valid
ls -lh /Users/raghavshah/GenZ_Restaurant_POS/public/sounds/
file /Users/raghavshah/GenZ_Restaurant_POS/public/sounds/*.mp3
```

### Issue: Cancelled items still in order total

**Possible Cause**: API not recalculating correctly

**Solution**: Check browser console for errors. The API should return updated order.

**Manual Fix** (if needed):
```bash
# Connect to database and manually recalculate
npx prisma studio
# Navigate to Order, recalculate totalAmount by summing active items only
```

### Issue: KDS not showing cancelled items

**Possible Cause**: Polling not picking up changes

**Solution**: 
- Refresh the KDS page
- Check that the order is in PENDING or PREPARING status
- Verify the API is returning the cancelled item with status='CANCELLED'

---

## 📊 API Endpoints Reference

### Cancel Order Item
```
PATCH /api/orders/[orderId]/items
Body: {
  "itemId": "uuid-of-item",
  "status": "CANCELLED"
}
```

**Response**: Updated order with recalculated total

**Side Effects**:
- Item status changed to CANCELLED
- Order total recalculated (excludes cancelled items)
- Stock restored for the cancelled item
- Item remains in database for audit

---

## 🎯 Testing Scenarios

### Scenario 1: Cancel Single Item
1. Create order: Burger + Fries + Coke
2. Total should be sum of all three
3. Cancel Fries
4. Total should update to Burger + Coke only
5. KDS should show Fries with strikethrough
6. Database should keep the cancelled item

### Scenario 2: Sound Repeat Flow
1. Open KDS page
2. Create new order from another tab
3. Sound should play immediately
4. Wait 30 seconds - sound should play again
5. Wait 30 more seconds - sound should play again
6. Click "Acknowledge" - sound should stop
7. Sound should not play again for that order

### Scenario 3: Running Table Urgent Sound
1. Create order at Table 5
2. Wait 2 minutes
3. Add more items to Table 5 order
4. KDS should play 3 quick beeps (urgent sound)
5. Order card should show URGENT badge and red background
6. Sound should repeat every 30 seconds until acknowledged

### Scenario 4: Multiple Simultaneous Orders
1. Create 3 orders within 10 seconds
2. KDS should receive 3 sound notifications
3. Acknowledge button should show "(3)"
4. Click Acknowledge - all sounds stop
5. No further repeats should occur

---

## 🎉 Success Criteria

You'll know everything is working when:

✅ **Item Cancellation**:
- Can cancel items from active orders
- Totals update immediately
- Cancelled items show with strikethrough
- Stock is restored
- Kitchen sees the changes on KDS

✅ **Sound System**:
- Sounds play when new orders arrive
- Sounds repeat every 30 seconds
- Acknowledge button stops the repeats
- Urgent sound plays for running tables
- Sound toggle works (mute/unmute)

---

## 📞 Need Help?

Check these files for implementation details:
- `SECTIONS_7_8_IMPLEMENTATION.md` - Complete technical documentation
- `IMPLEMENTATION_SUMMARY.md` - Overview of all 10 sections

Common issues usually involve:
1. Sound files not added or incorrect format
2. Browser autoplay restrictions (need user interaction first)
3. Forgot to regenerate Prisma Client after schema changes

For any issues, check the browser console (F12) for error messages.

---

**Happy Restaurant Managing! 🍽️**
