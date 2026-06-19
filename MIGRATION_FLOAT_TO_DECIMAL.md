# Float to Decimal Migration Plan

## Issue
Currently using `Float` type for monetary values (price, total, tax, discount, etc.) which can cause rounding errors in financial calculations (e.g., ₹0.01 drift).

## Priority
P2 - Medium (Should be fixed before scaling to high transaction volumes)

## Impact
- Revenue discrepancies in billing
- Incorrect financial reports
- Tax calculation errors
- Customer loyalty points miscalculations

## Migration Steps

### 1. Update Prisma Schema

Change all monetary `Float` fields to `Decimal`:

```prisma
model MenuItem {
  price             Decimal  @db.Decimal(10, 2)  // was Float
  priceHalf         Decimal? @db.Decimal(10, 2)  // was Float?
  // ... other fields
}

model Order {
  totalAmount       Decimal  @default(0) @db.Decimal(10, 2)  // was Float
  // ... other fields
}

model OrderItem {
  price             Decimal  @db.Decimal(10, 2)  // was Float
  // ... other fields
}

model Bill {
  subtotal          Decimal  @db.Decimal(10, 2)  // was Float
  tax               Decimal  @db.Decimal(10, 2)  // was Float
  discount          Decimal  @default(0) @db.Decimal(10, 2)  // was Float
  total             Decimal  @db.Decimal(10, 2)  // was Float
  cashAmount        Decimal  @default(0) @db.Decimal(10, 2)  // was Float
  onlineAmount      Decimal  @default(0) @db.Decimal(10, 2)  // was Float
  // ... other fields
}

model Customer {
  totalSpend        Decimal  @default(0) @db.Decimal(10, 2)  // was Float
  // ... other fields
}
```

### 2. Create Migration

```bash
npx prisma migrate dev --name convert_float_to_decimal
```

### 3. Update TypeScript Code

Import Decimal from Prisma:
```typescript
import { Decimal } from '@prisma/client/runtime/library';
```

Convert calculations:
```typescript
// OLD
const tax = subtotal * taxRate;
const total = subtotal + tax - discount;

// NEW
import { Decimal } from '@prisma/client/runtime/library';

const tax = new Decimal(subtotal).mul(taxRate);
const total = new Decimal(subtotal).add(tax).sub(discount);

// Convert to number for display
const totalNumber = total.toNumber();
```

### 4. Update API Routes

**bills/route.ts:**
```typescript
const subtotal = new Decimal(order.totalAmount);
const taxRate = new Decimal(process.env.TAX_RATE || '0.18');
const tax = subtotal.mul(taxRate);
const total = subtotal.add(tax);
```

**bills/[id]/route.ts:**
```typescript
const baseAmount = new Decimal(existingBill.subtotal).add(existingBill.tax);
const discountAmount = new Decimal(existingBill.subtotal).mul(discountPercent).div(100);
const finalTotal = baseAmount.sub(discountAmount).sub(pointsRedeemed);
```

### 5. Update Frontend

Frontend receives Decimal as string from API, convert when needed:
```typescript
const subtotal = parseFloat(bill.subtotal);
const tax = parseFloat(bill.tax);
const total = parseFloat(bill.total);
```

### 6. Testing Checklist

- [ ] Create order with multiple items
- [ ] Generate bill with GST calculation
- [ ] Apply discount (verify rounding)
- [ ] Redeem loyalty points
- [ ] Split payment (cash + online)
- [ ] Run reports - verify revenue totals
- [ ] Test with edge cases (₹0.01, ₹99.99, large amounts)
- [ ] Verify database values are exact

### 7. Deployment

1. Backup production database
2. Run migration in maintenance window
3. Monitor for errors in first 24 hours
4. Verify reports match pre-migration totals

## Estimated Effort
- Schema changes: 30 minutes
- Code updates: 2 hours
- Testing: 1 hour
- Deployment: 1 hour

**Total: ~4-5 hours**

## Notes
- Prisma Decimal type maps to PostgreSQL NUMERIC/DECIMAL
- Decimal(10, 2) supports up to ₹99,999,999.99
- Always use `.toNumber()` or `.toString()` before JSON serialization
- Consider using a money library (e.g., `dinero.js`) for complex calculations
