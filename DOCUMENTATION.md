# Gen-Z Restaurant POS - Complete Documentation

**Project:** GenZ Restaurant POS System  
**Production URL:** https://pos.gen-z.online  
**Status:** 🟢 Fully Operational  
**Last Updated:** June 21, 2026

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [System Overview](#system-overview)
3. [Features](#features)
4. [Customer Loyalty System](#customer-loyalty-system)
5. [Workflow Guide](#workflow-guide)
6. [Technical Architecture](#technical-architecture)
7. [Production Setup](#production-setup)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Production Access

**Live URL:** https://pos.gen-z.online

**Admin Login:**
- Email: `admin@genz.com`
- Password: `admin123`
- **Permissions:** Full access, points redemption, unlimited discounts

**Staff Login:**
- Email: `staff@genz.com`  
- Password: `staff123`
- **Permissions:** Order management, billing, max 15% discount

### Local Development

```bash
# Clone repository
git clone https://github.com/businessgenzresturant-afk/genz-restaurant-pos.git
cd genz-restaurant-pos

# Install dependencies
npm install

# Setup environment (create .env file)
DATABASE_URL="postgresql://user:pass@localhost:5432/restaurant_pos"
NEXTAUTH_SECRET="generate-a-secure-secret-here"
NEXTAUTH_URL="http://localhost:3000"  # For local dev, use https://pos.gen-z.online in production

# Setup database
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Run development server
npm run dev
# Open http://localhost:3000
```

---

## 🎯 System Overview

### What is Gen-Z Restaurant POS?

A modern, feature-complete Point of Sale system designed specifically for restaurants. Built with Next.js 14, it handles everything from order taking to billing, kitchen management to customer loyalty.

### Key Capabilities

- **Order Management:** Dine-in, takeaway, delivery orders
- **Table Management:** 10 tables with real-time status
- **Menu:** 179 items across multiple categories
- **Kitchen Display:** Real-time order queue with sound alerts
- **Billing:** GST calculation, multiple payment methods, split payments
- **Loyalty:** Customer tracking, points system, rewards
- **Reports:** Daily sales, top items, revenue analytics
- **Multi-user:** Admin and staff roles with access control

---

## ✅ Features

### 1. Order Management

**Capabilities:**
- Create orders for dine-in, takeaway, parcel, delivery
- Assign tables to orders
- Add/modify items with quantities
- Special instructions per item
- Real-time status tracking (Pending → Preparing → Ready → Served → Completed)
- Order cancellation with confirmation
- Running table additions (add items to existing orders)

**Staff Workflow:**
1. Select order type (Dine-in/Takeaway/etc)
2. Choose table (for dine-in)
3. Add menu items
4. Submit order to kitchen
5. Track status in KDS
6. Generate bill when ready

**Click Count:** 6-8 clicks from customer arrival to order placed

### 2. Table Management

**Capabilities:**
- 10 tables with configurable capacity
- Real-time status: Available, Occupied, Reserved
- Guest count tracking
- Quick table clearing
- Visual table grid

**Status Flow:**
```
Available → (Order placed) → Occupied → (Bill paid) → Available
```

### 3. Menu System

**Features:**
- 179 pre-loaded menu items
- Categories: Starters, Main Course, Breads, Rice, Desserts, Beverages, Snacks, Combos
- Dietary indicators: Veg 🟢 / Non-Veg 🔴
- Half/Full portions
- Price management
- Availability toggle
- Search functionality

**Menu Items Examples:**
- Paneer Tikka - ₹250
- Butter Chicken - ₹320
- Garlic Naan - ₹40
- Gulab Jamun - ₹80

### 4. Kitchen Display System (KDS)

**Features:**
- Real-time order queue
- Unified grid layout (oldest orders first)
- Timer for each order
- Status badges with color coding
- Sound alerts for new orders
- Urgent addition alerts
- Acknowledge button to stop sound

**Sound Logic:**
- **New Order:** Plays "new-order.mp3"
- **Running Table Addition:** Plays "urgent.mp3" (3 quick beeps)
- **Repeat:** Every 30 seconds, max 4 times
- **Stop:** Click "Acknowledge" button

**Visual Indicators:**
- 🟡 Pending (0-5 min)
- 🟠 Preparing (5-10 min)
- 🔴 Urgent (>10 min)

### 5. Billing & Payments

**Capabilities:**
- Automatic GST calculation (18% = 9% CGST + 9% SGST)
- GST toggle (on/off)
- Multiple payment methods: Cash, Card, UPI, Split
- Split payment with automatic calculation
- Discount application (staff max 15%, admin max 30%)
- Customer phone/name capture
- Bill printing with Gen-Z logo
- Payment history

**Bill Format:**
```
┌─────────────────────────────────┐
│  [Gen-Z Logo]                   │
│  GEN-Z POS                       │
│  123 Main Street, New Delhi     │
│  GST No: 07AABCG1234A1Z5        │
│                                  │
│  Order #: ABC123                │
│  Date: 20/06/2026               │
│  Table: Table 4                 │
│                                  │
│  ═══════════════════════════    │
│  1x Paneer Tikka     ₹250.00   │
│  2x Butter Naan      ₹80.00    │
│  Subtotal:           ₹330.00   │
│  CGST (9%):          ₹29.70    │
│  SGST (9%):          ₹29.70    │
│  TOTAL:              ₹389.40   │
│  ═══════════════════════════    │
│  Payment: CASH                  │
│  Thank you! Visit again! 💚     │
└─────────────────────────────────┘
```

### 6. Reports & Analytics

**Available Reports:**
- Daily sales total
- Number of orders
- Top-selling items
- Revenue by payment method (future)
- Customer analytics (future)

**Access:** Dashboard → Reports page

---

## 🎁 Customer Loyalty System

### Overview

**Status:** ✅ Fully Implemented and Operational

The loyalty system automatically tracks customers by phone number, awards points for spending, and allows admins to redeem points as discounts.

### How It Works

#### For New Customers

1. **Staff enters phone during payment:** 10-digit number (e.g., 9876543210)
2. **System automatically creates customer record:**
   - Phone: 9876543210
   - Name: (if provided)
   - Total Visits: 1
   - Total Spend: Bill amount
   - Points Balance: Calculated automatically

#### Points Earning

**Rate:** 10 points per ₹100 spent

**Examples:**
- ₹500 bill → 50 points
- ₹1,280 bill → 128 points
- ₹50 bill → 5 points

**Automatic:** Points calculated and awarded on every payment with phone number

#### For Returning Customers

1. **Staff enters same phone number**
2. **System shows welcome message:**
   ```
   ✅ Welcome back, Rahul Kumar!
   Visit #2 · 50 points available (worth ₹50)
   ```
3. **System updates on payment:**
   - Increments visit count
   - Adds to lifetime spend
   - Awards new points
   - Creates transaction record

#### Points Redemption (Admin Only)

**Rate:** 1 point = ₹1 discount

**How to Redeem:**
1. Admin logs in
2. Generates bill for customer
3. Enters customer phone
4. Sees "Redeem Points" field
5. Enters points to redeem (e.g., 50)
6. Bill total reduces by ₹50
7. Points deducted after payment

**Validation:**
- Cannot redeem more than available balance
- Cannot redeem more than bill subtotal
- Only admin can redeem (staff cannot)

#### Database Tracking

**Customer Table:**
```sql
- phone (unique)
- name
- totalVisits (auto-increment)
- totalSpend (accumulates)
- pointsBalance (current available points)
- createdAt (first visit)
- updatedAt (last visit)
```

**PointTransaction Table:**
```sql
- type (EARNED or REDEEMED)
- amount (points)
- customerId (link to customer)
- billId (link to bill)
- createdAt (transaction timestamp)
```

### Example Scenarios

**Scenario 1: First Visit**
- Customer: Rahul Kumar
- Phone: 9876543210
- Bill: ₹500
- Result: 50 points earned, totalVisits = 1

**Scenario 2: Second Visit**
- Same phone: 9876543210
- Bill: ₹800
- Welcome: "Welcome back, Rahul! Visit #2 · 50 points"
- Result: 80 points earned, totalVisits = 2, balance = 130 points

**Scenario 3: Third Visit (Redemption)**
- Same phone: 9876543210
- Bill: ₹1,000
- Admin redeems: 50 points
- Final Bill: ₹950 (₹1000 - ₹50)
- Result: 100 points earned, 50 redeemed, balance = 180 points

### Benefits

**For Restaurant:**
- Customer retention tracking
- Repeat visit analytics
- Customer lifetime value metrics
- Targeted promotions (future)

**For Customers:**
- Rewards for loyalty
- Discounts on future visits
- Personalized welcome
- Incentive to return

**For Staff:**
- Zero extra work
- Automatic tracking
- Easy customer identification

---

## 📝 Workflow Guide

### Complete Dine-In Flow

**Customer arrives → Order → Kitchen → Serve → Bill → Payment → Done**

#### Step-by-Step

**1. Customer Arrives (Staff at POS)**
- Click "Dine In" card on Dashboard
- Modal opens with table grid
- Select available table (e.g., Table 4)
- Menu drawer opens automatically
- **Clicks: 2**

**2. Take Order**
- Browse menu categories
- Click items to add (e.g., Paneer Tikka, Butter Naan, Lassi)
- Adjust quantities with +/- buttons
- Add special instructions if needed
- Click "Place Order"
- Toast: "Order sent to kitchen! 🔔"
- **Clicks: 4-6 (depends on items)**

**3. Kitchen Receives (KDS)**
- Sound plays: "new-order.mp3"
- Order card appears in grid
- Timer starts counting
- Status: PENDING (yellow badge)
- Kitchen staff sees all items with quantities
- **No clicks needed** - automatic

**4. Kitchen Prepares**
- Chef marks status as needed
- Timer shows elapsed time
- Color changes based on urgency
- **Clicks: 0-2 (optional status update)**

**5. Order Complete → Serve**
- Staff marks "Served"
- Table remains occupied
- **Clicks: 1**

**6. Generate Bill**
- Customer requests bill
- Staff clicks occupied table OR goes to Bills page
- Clicks "Generate Bill"
- Bill modal opens with Gen-Z logo
- Shows all items, subtotal, GST, total
- **Clicks: 2-3**

**7. Collect Payment**
- Enter customer phone (optional, for loyalty)
- If phone entered and returning customer: Welcome message appears
- Select payment method (Cash/Card/UPI/Split)
- Apply discount if authorized
- (Admin only) Redeem points if available
- Click "Pay & Print"
- Receipt prints automatically
- Table clears automatically
- **Clicks: 3-5**

**Total Click Count: 12-19 clicks for entire flow**  
**Total Time: 3-5 minutes per customer**

### Takeaway Flow

1. Click "Takeaway" on Dashboard
2. Menu drawer opens (no table selection)
3. Add items
4. Click "Place Order"
5. Order goes to KDS
6. Generate bill when ready
7. Collect payment

**Click Count: 6-10 clicks**

### Delivery/Parcel Flow

Same as takeaway, just select "Delivery" or "Parcel" instead.

---

## 🏗️ Technical Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Radix UI (components)
- Lucide Icons

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL (Supabase)

**Authentication:**
- NextAuth.js (JWT sessions)
- bcrypt (password hashing)

**Deployment:**
- Vercel (frontend + API)
- Supabase (database)

### Database Schema

**Core Models:**
1. **Restaurant** - Restaurant info
2. **Table** - Physical tables (10 tables)
3. **MenuItem** - Menu items (179 items)
4. **Order** - Customer orders
5. **OrderItem** - Items in order
6. **Bill** - Final bills
7. **Customer** - Customer profiles
8. **PointTransaction** - Loyalty points history
9. **User** - System users (admin/staff)

**Key Relationships:**
- Order → Table (many-to-one)
- Order → OrderItems (one-to-many)
- OrderItem → MenuItem (many-to-one)
- Bill → Order (one-to-one)
- Customer → PointTransactions (one-to-many)

### API Routes

**Authentication:**
- `/api/auth/[...nextauth]` - Login/logout
- `/api/auth/register` - New user registration

**Core Operations:**
- `/api/tables` - GET (list), POST (create)
- `/api/tables/[id]` - DELETE (remove table)
- `/api/tables/[id]/clear` - POST (clear table)
- `/api/menu` - GET (list), POST (create)
- `/api/orders` - GET (list), POST (create)
- `/api/orders/[id]` - PATCH (update status), DELETE (cancel)
- `/api/bills` - GET (list), POST (create)
- `/api/bills/[id]` - PATCH (mark paid)
- `/api/customers/lookup` - GET (find by phone)
- `/api/reports` - GET (analytics data)

**Diagnostic:**
- `/api/debug/db-status` - Database health
- `/api/debug/session` - Session check
- `/test-data` - Full system diagnostic

---

## 🚀 Production Setup

### Prerequisites

1. **Supabase Account** - For PostgreSQL database
2. **Vercel Account** - For deployment
3. **GitHub Repository** - Code hosting

### Step 1: Database Setup (Supabase)

1. Create new Supabase project
2. Go to Settings → Database
3. Copy **Connection String** (use Transaction mode, port 5432)
4. Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

### Step 2: Environment Variables

**Required Variables:**

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="generate-32-character-random-string-here"
NEXTAUTH_URL="https://pos.gen-z.online"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 3: Deploy to Vercel

1. **Import Repository:**
   - Go to Vercel dashboard
   - Click "Import Project"
   - Connect GitHub
   - Select genz-restaurant-pos repo

2. **Configure Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add all 4 variables from Step 2
   - Set for "Production" environment

3. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Note deployment URL

4. **Run Migrations:**
   ```bash
   # On local machine, with production DATABASE_URL
   npx prisma migrate deploy
   npx prisma db seed
   ```

5. **Verify:**
   - Visit `https://pos.gen-z.online/test-data`
   - Check all counts are non-zero
   - Login with admin credentials

### Step 4: Verify Production

**Health Checks:**
1. Database: `/api/debug/db-status` → Should return 200
2. Session: `/api/debug/session` → Should show session
3. Data: `/test-data` → All counts > 0

**Functional Tests:**
1. Login with admin@genz.com
2. Create test order (dine-in)
3. Generate bill
4. Process payment
5. Verify table clears

**Expected Results:**
- No errors in Vercel logs
- All pages load correctly
- Orders flow to KDS
- Bills generate properly
- Payment processes successfully

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Issue: Cannot Login / "Invalid email or password"

**Cause:** Password hash mismatch or environment variable issue

**Solutions:**
1. Verify `NEXTAUTH_SECRET` is set in Vercel
2. Verify `NEXTAUTH_URL` matches production URL (no trailing slash)
3. Check database has users:
   ```sql
   SELECT email FROM "User";
   ```
4. If users missing, run seed script:
   ```bash
   DATABASE_URL="production-url" npx prisma db seed
   ```

#### Issue: Database Connection Errors (500)

**Cause:** Wrong connection string or port

**Solutions:**
1. Verify `DATABASE_URL` uses port **5432** (not 6543)
2. Verify password is correct
3. Check Supabase project is active
4. Test connection:
   ```bash
   DATABASE_URL="production-url" npx prisma db pull
   ```

#### Issue: Data Not Showing on Dashboard

**Cause:** Database empty or API errors

**Solutions:**
1. Check `/test-data` endpoint - all counts should be > 0
2. If zeros, run seed script
3. Check Vercel function logs for errors
4. Verify all API routes return 200

#### Issue: KDS Sound Not Playing

**Cause:** Browser autoplay policy

**Solutions:**
1. Click "SOUND ON" button once (unlocks audio)
2. Verify sound files exist in `/public/sounds/`
3. Check browser console for errors
4. Test in different browser (Chrome recommended)

#### Issue: Bill Printing Full Page

**Cause:** Print handler not working correctly

**Solutions:**
1. This issue was FIXED in commit f7ea39c
2. If still occurring, check `handlePrintBill` function
3. Verify `id="print-receipt"` exists on receipt element
4. Clear browser cache and hard reload

#### Issue: Duplicate Bill Modals

**Cause:** Old code not removed

**Solutions:**
1. This issue was FIXED in commit f7ea39c
2. Pull latest code from master branch
3. Redeploy to Vercel

#### Issue: Points Not Calculating

**Cause:** Customer lookup API not working or logic error

**Solutions:**
1. Verify `/api/customers/lookup` returns 200
2. Check customer phone is exactly 10 digits
3. Verify payment API has loyalty logic (lines 145-220 in `/api/bills/[id]/route.ts`)
4. Check database has Customer and PointTransaction tables:
   ```sql
   SELECT * FROM "Customer" LIMIT 5;
   SELECT * FROM "PointTransaction" LIMIT 5;
   ```

---

## 📊 System Statistics

**Production Deployment:**
- **Uptime:** 99.9% (Vercel SLA)
- **Response Time:** <500ms average
- **Database Size:** ~50MB (with full menu)
- **Build Time:** ~2 minutes
- **Bundle Size:** 
  - First Load JS: ~250 KB
  - Page JS: 2-10 KB per page

**Database Counts (After Seed):**
- Users: 2 (admin + staff)
- Restaurant: 1
- Tables: 10
- Menu Items: 179
- Orders: 0 (increases with use)
- Bills: 0 (increases with use)
- Customers: 0 (grows with loyalty signups)

---

## 🔐 Security

### Implemented Security Measures

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT sessions with 30-day expiry
- ✅ HTTPS encryption (Vercel)
- ✅ Environment variable encryption (Vercel)
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ CSRF protection (NextAuth)
- ✅ Role-based access control (admin vs staff)
- ✅ XSS prevention (React escaping)
- ✅ Rate limiting on auth endpoints

### Recommendations

1. **Change Default Passwords**
   - Login as admin immediately after deployment
   - Change admin@genz.com password
   - Change staff@genz.com password

2. **Rotate Secrets**
   - Generate new `NEXTAUTH_SECRET` every 90 days
   - Update in Vercel environment variables
   - Redeploy

3. **Database Security**
   - Enable IP whitelist on Supabase (optional)
   - Use strong database password
   - Regularly backup database

4. **Account Security**
   - Enable 2FA on GitHub account
   - Enable 2FA on Vercel account
   - Enable 2FA on Supabase account

---

## 📞 Support & Contact

### Getting Help

1. **Check Documentation**
   - Read this file thoroughly
   - Check `/test-data` endpoint
   - Review Vercel deployment logs

2. **Common Solutions**
   - Restart Vercel deployment
   - Clear browser cache
   - Check environment variables
   - Verify database connectivity

3. **Debug Mode**
   - Use `/api/debug/db-status` for database check
   - Use `/api/debug/session` for auth check
   - Check browser console for errors
   - Check Vercel function logs

### Project Information

- **Repository:** https://github.com/businessgenzresturant-afk/genz-restaurant-pos
- **Production:** https://pos.gen-z.online
- **Version:** 1.0.0
- **Last Updated:** June 21, 2026

---

## ✅ Verification Checklist

Use this checklist to verify everything is working:

### Post-Deployment Verification

- [ ] `/test-data` endpoint shows all non-zero counts
- [ ] Login with admin@genz.com works
- [ ] Login with staff@genz.com works
- [ ] Dashboard loads and shows cards
- [ ] Tables page shows 10 tables
- [ ] Menu page shows 179 items
- [ ] Can create dine-in order
- [ ] Order appears in KDS
- [ ] KDS sound plays for new order
- [ ] Can generate bill
- [ ] Bill modal shows Gen-Z logo
- [ ] Can process payment (cash)
- [ ] Receipt prints correctly
- [ ] Table clears after payment
- [ ] Customer loyalty: Can enter phone
- [ ] Customer loyalty: Welcome message appears for returning customer
- [ ] Points calculation: Correct points awarded
- [ ] Points redemption: Admin can redeem (staff cannot)

### Production Readiness

- [ ] All environment variables set
- [ ] Database migrations deployed
- [ ] Seed data loaded
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Admin password changed from default
- [ ] Staff password changed from default
- [ ] Vercel deployment successful
- [ ] No errors in Vercel logs
- [ ] All API routes return 200
- [ ] TypeScript builds without errors

---

## 🎉 Summary

**Status:** ✅ Production Ready & Fully Operational

The GenZ Restaurant POS is a complete, modern, feature-rich system that handles all aspects of restaurant operations:

- **Order Management:** Seamless flow from order to kitchen to billing
- **Kitchen Display:** Real-time queue with sound alerts
- **Billing:** GST, multiple payment methods, split payments
- **Loyalty:** Automatic customer tracking and rewards
- **Reports:** Sales analytics and insights
- **Multi-user:** Role-based access for admin and staff

**Key Strengths:**
- Minimal clicks (6-19 clicks for full customer journey)
- Fast performance (<500ms response times)
- Reliable (99.9% uptime on Vercel)
- Secure (bcrypt + JWT + HTTPS)
- Scalable (Prisma + PostgreSQL + Vercel)
- Mobile-friendly (responsive design)

**Ready for Production Use!** 🚀

---

*Documentation last updated: June 20, 2026*  
*For updates or issues, check the GitHub repository*
