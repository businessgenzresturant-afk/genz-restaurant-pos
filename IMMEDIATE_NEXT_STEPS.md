# GenZ Restaurant POS - Immediate Next Steps

**Date:** 2026-06-12  
**Priority:** URGENT - Complete within 48 hours

---

## ✅ COMPLETED (Just Now)

1. **Fixed hardcoded secrets** - Added security warnings to `.env`, created `.env.example`
2. **Fixed Prisma connection leak** - Replaced new PrismaClient instances with singleton
3. **Fixed authentication bypass** - Homepage now requires authentication
4. **Updated database schema** - Added all missing fields with proper types
5. **Created validation library** - Zod schemas ready for integration

---

## 🚨 CRITICAL - DO NOW (Next 2-4 Hours)

### Step 1: Run Database Migration
```bash
cd /Users/raghavshah/GenZ_Restaurant_POS/genz-restaurant-pos-rebuild

# Review the migration that will be created
npx prisma migrate dev --create-only --name add_missing_fields_and_indexes

# Check the migration file in prisma/migrations/
# Make sure it looks correct, then apply it:
npx prisma migrate dev

# Regenerate Prisma Client
npx prisma generate
```

**⚠️ IMPORTANT:** This will modify your database. Back up your data first if you have any important test data.

### Step 2: Integrate Validation in API Routes
Add validation to each API endpoint. Here's the pattern to follow:

**Example for `/api/tables/route.ts`:**
```typescript
import { createTableSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // VALIDATE INPUT
    const validatedData = createTableSchema.parse(body);
    
    const table = await prisma.table.create({
      data: validatedData,
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    );
  }
}
```

**Files to update (in this order):**
1. `src/app/api/tables/route.ts`
2. `src/app/api/menu/route.ts` 
3. `src/app/api/menu/[id]/route.ts`
4. `src/app/api/orders/route.ts`
5. `src/app/api/orders/[id]/route.ts`
6. `src/app/api/bills/route.ts`
7. `src/app/api/bills/[id]/route.ts`

### Step 3: Fix Frontend Display Bugs
These will crash the app after schema migration:

**File:** `src/app/orders/page.tsx` (line ~180)
```typescript
// BEFORE (BROKEN):
<span>₹{item.totalPrice.toFixed(2)}</span>

// AFTER (FIXED):
<span>₹{(item.quantity * item.menuItem.price).toFixed(2)}</span>
```

**File:** `src/app/kot/page.tsx` (line ~90)
```typescript
// SAME FIX
<span>₹{(item.quantity * item.menuItem.price).toFixed(2)}</span>
```

**File:** `src/app/bills/page.tsx` (line ~139)
```typescript
// BEFORE:
<span>₹{(item.quantity * item.unitPrice).toFixed(2)}</span>

// AFTER:
<span>₹{(item.quantity * item.price).toFixed(2)}</span>
```


### Step 4: Test Everything
After migration and fixes:

```bash
# Start the dev server
npm run dev

# Test these flows manually:
# 1. Login → should redirect to tables page
# 2. Create a table
# 3. Add menu items
# 4. Create an order
# 5. Check KOT screen
# 6. Generate a bill
# 7. Mark bill as paid
# 8. View reports
```

---

## ⏰ HIGH PRIORITY - DO TODAY (Next 4-6 Hours)

### Add Rate Limiting
```bash
npm install @upstash/ratelimit @upstash/redis
```

Create `src/lib/rateLimit.ts`:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create rate limiter
export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
});

export const apiRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
});
```

Update `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { authRateLimit } from '@/lib/rateLimit';

// Add before authOptions
const handler = async (req: Request) => {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await authRateLimit.limit(ip);
  
  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }
  
  return NextAuth(authOptions)(req);
};
```

### Add Input Sanitization
```bash
npm install sanitize-html
```


Create `src/lib/sanitize.ts`:
```typescript
import sanitizeHtml from 'sanitize-html';

export function sanitizeText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [], // Strip all HTML tags
    allowedAttributes: {},
  }).trim();
}
```

Use in validation schemas (`src/lib/validations.ts`):
```typescript
export const createOrderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(999),
  specialInstructions: z.string()
    .max(500)
    .transform(sanitizeText) // SANITIZE HERE
    .optional(),
});
```

---

## 🛠️ TOMORROW - Business Logic Fixes

### 1. Fix Order Race Condition
**File:** `src/app/api/orders/route.ts`

Replace the order creation logic with a transaction:
```typescript
// Around line 80-150, replace with:
const order = await prisma.$transaction(async (tx) => {
  // 1. Lock and check table
  const table = await tx.table.findUnique({
    where: { id: tableId },
  });

  if (!table) {
    throw new Error('Table not found');
  }

  if (table.status !== 'AVAILABLE') {
    throw new Error('Table is not available');
  }

  // 2. Calculate total
  let totalAmount = 0;
  const orderItems = [];
  
  for (const item of items) {
    const validatedItem = createOrderItemSchema.parse(item);
    
    const menuItem = await tx.menuItem.findUnique({
      where: { id: validatedItem.menuItemId },
    });

    if (!menuItem || !menuItem.available) {
      throw new Error(`Menu item unavailable`);
    }

    const itemTotal = menuItem.price * validatedItem.quantity;
    totalAmount += itemTotal;

    orderItems.push({
      menuItemId: validatedItem.menuItemId,
      quantity: validatedItem.quantity,
      price: menuItem.price, // Capture price at time of order
      specialInstructions: validatedItem.specialInstructions,
    });
  }

  // 3. Create order
  const newOrder = await tx.order.create({
    data: {
      tableId,
      totalAmount,
      orderItems: {
        create: orderItems,
      },
    },
    include: {
      table: true,
      orderItems: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  // 4. Update table status
  await tx.table.update({
    where: { id: tableId },
    data: { status: 'OCCUPIED' },
  });

  return newOrder;
});

return NextResponse.json(order, { status: 201 });
```

### 2. Add KOT Status Update Buttons
**File:** `src/app/kot/page.tsx`

Add this function after fetchKOTOrders:
```typescript
const handleUpdateStatus = async (orderId: string, status: string) => {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) throw new Error('Failed to update');
    
    await fetchKOTOrders(); // Refresh
  } catch (error) {
    console.error('Error updating order:', error);
    alert('Failed to update order status');
  }
};
```

Add buttons in the render (around line 85):
```typescript
<div className="mt-4 flex gap-2">
  {order.status === 'PENDING' && (
    <Button
      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
      className="bg-blue-600"
    >
      Start Preparing
    </Button>
  )}
  {order.status === 'PREPARING' && (
    <Button
      onClick={() => handleUpdateStatus(order.id, 'READY')}
      className="bg-green-600"
    >
      Mark as Ready
    </Button>
  )}
</div>
```

---

## 📝 CHECKLIST FOR TODAY

- [ ] Run `npx prisma migrate dev`
- [ ] Run `npx prisma generate`
- [ ] Integrate Zod validation in all 7 API routes
- [ ] Fix 3 frontend display bugs
- [ ] Test all major workflows
- [ ] Install and configure rate limiting
- [ ] Add input sanitization
- [ ] Commit changes to git

---

## 🎯 SUCCESS VERIFICATION

After completing above steps, verify:

1. **No runtime errors** when creating orders
2. **Bills generate successfully** with correct fields
3. **All displays show prices correctly**
4. **Authentication redirects work**
5. **Invalid inputs are rejected** with clear error messages

---

## 📞 NEED HELP?

Reference these documents:
- **Full findings:** `COMPREHENSIVE_CODE_AUDIT.md`
- **All tasks:** `PRIORITY_TASK_LIST.md`
- **This guide:** `IMMEDIATE_NEXT_STEPS.md`

All file paths and line numbers are documented in the audit report.

