# 🍽️ Gen-Z Restaurant POS System

Modern, feature-rich Point of Sale system built for restaurants with Next.js 14, Prisma, PostgreSQL (Supabase), and NextAuth.

## ✅ Production Status

**Live URL:** https://pos.gen-z.online  
**Status:** 🟢 Fully Operational  
**Last Updated:** June 21, 2026

---

## 🚀 Quick Start

### Production Login

**URL:** https://pos.gen-z.online/login

**Admin Credentials:**
- Email: `admin@genz.com`
- Password: `admin123`

**Staff Credentials:**
- Email: `staff@genz.com`
- Password: `staff123`

---

## 📋 Features

### ✅ Fully Implemented & Working

- **Order Management**
  - Dine-in, Takeaway, Parcel, Delivery orders
  - Table assignment & management
  - Order status tracking (Pending → Preparing → Ready → Served)
  - Real-time kitchen display system (KDS)
  - Order modification & cancellation

- **Menu Management**
  - 179 menu items across multiple categories
  - Half/Full portion options
  - Dietary type (Veg/Non-Veg)
  - Price management
  - Stock availability tracking

- **Table Management**
  - 10 tables with capacity tracking
  - Real-time status (Available/Occupied/Reserved)
  - Visual table layout
  - Guest count tracking

- **Billing & Payments**
  - GST calculation (18%)
  - Multiple payment methods (Cash, Online)
  - Split payment support
  - Bill generation & printing
  - Customer loyalty points system

- **Kitchen Display System (KDS)**
  - Real-time order queue
  - Priority-based display (oldest first)
  - Status updates with visual feedback
  - Sound notifications for new orders
  - Timer for order preparation

- **Reports & Analytics**
  - Daily sales report
  - Revenue tracking
  - Top-selling items
  - Order history
  - Customer analytics

- **User Management**
  - Role-based access (Admin/Staff)
  - Secure authentication (NextAuth + bcrypt)
  - Session management
  - Profile management

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **UI Components:** Radix UI, Lucide Icons
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (Supabase)
- **Authentication:** NextAuth.js (JWT)
- **Deployment:** Vercel
- **Version Control:** Git + GitHub

---

## 📦 Installation (Development)

### Prerequisites
- Node.js 22.x
- PostgreSQL database (or Supabase account)
- Git

### Setup Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/businessgenzresturant-afk/genz-restaurant-pos.git
   cd genz-restaurant-pos
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   
   Create `.env` file:
   ```env
   # Database
   DATABASE_URL="postgresql://postgres:password@localhost:5432/restaurant_pos"
   DIRECT_URL="postgresql://postgres:password@localhost:5432/restaurant_pos"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"  # For local dev, use https://pos.gen-z.online in production
   ```

4. **Setup Database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed database (creates admin/staff users + sample data)
   npx prisma db seed
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
   ```
   http://localhost:3000
   ```

---

## 🗄️ Database Schema

### Models
- **Restaurant** - Restaurant details
- **Table** - Physical tables with status
- **MenuItem** - Menu items with pricing
- **Order** - Customer orders
- **OrderItem** - Individual items in order
- **Bill** - Final billing with payments
- **Customer** - Customer profiles & loyalty
- **User** - System users (admin/staff)
- **PointTransaction** - Loyalty points history

### Seeded Data (Development)
- 2 users (admin + staff)
- 1 restaurant
- 10 tables
- 179 menu items (full restaurant menu)

---

## 🚀 Deployment (Production)

### Vercel Deployment

1. **Connect GitHub Repository**
   - Import project in Vercel
   - Connect to GitHub repo

2. **Configure Environment Variables**
   
   Add in Vercel Project Settings:
   ```env
   DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres
   DIRECT_URL=postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres
   NEXTAUTH_SECRET=[GENERATE-NEW-SECRET]
   NEXTAUTH_URL=https://pos.gen-z.online
   ```

   **CRITICAL:** Use port **5432** (not 6543) to avoid pgBouncer issues

3. **Deploy**
   - Push to master branch
   - Vercel auto-deploys
   - Verify at `/test-data` endpoint

### Database Setup (Supabase)

1. Create Supabase project
2. Get connection string from Settings → Database
3. Use **Direct Connection** (port 5432)
4. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

## 🧪 Testing

### API Health Check
```
https://pos.gen-z.online/api/debug/db-status
```

### Session Check
```
https://pos.gen-z.online/api/debug/session
```

### Full Diagnostic
```
https://pos.gen-z.online/test-data
```

---

## 📁 Project Structure

```
genz-restaurant-pos/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login/register)
│   │   ├── (pos)/             # POS pages (dashboard, orders, etc)
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── forms/             # Form components
│   │   ├── kds/               # Kitchen Display System
│   │   └── ui/                # UI primitives
│   ├── lib/                   # Utilities & configurations
│   │   ├── auth-config.ts     # NextAuth config
│   │   ├── prisma.ts          # Prisma client
│   │   └── validations.ts     # Zod schemas
│   └── middleware.ts          # Auth middleware
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── public/                    # Static assets
└── package.json
```

---

## 🔒 Security

### Implemented
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ JWT sessions (30-day expiry)
- ✅ HTTPS (Vercel)
- ✅ Environment variable encryption (Vercel)
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ CSRF protection (NextAuth)
- ✅ Role-based access control

### Recommendations
- Change default passwords immediately
- Rotate `NEXTAUTH_SECRET` every 90 days
- Enable IP whitelist on Supabase (optional)
- Enable 2FA on GitHub/Vercel accounts
- Regular security audits

---

## 📖 Documentation

- **`PRODUCTION_SETUP_FINAL.md`** - Complete production setup guide
- **`VERCEL_FIX_SUMMARY.md`** - Deployment troubleshooting
- **`PASSWORD_FIX_COMPLETE.md`** - Password reset guide
- **`IMPLEMENTATION_SUMMARY.md`** - Feature implementation summary
- **`COMPREHENSIVE_RESTAURANT_POS_AUDIT_REPORT.md`** - Full system audit

---

## 🐛 Known Issues & Solutions

### Issue: Database connection errors (500)
**Solution:** Ensure `DATABASE_URL` uses port **5432** (not 6543)

### Issue: Login requires multiple attempts
**Solution:** Clear browser cookies or use incognito mode

### Issue: Data not showing on dashboard
**Solution:** Check `/test-data` endpoint, verify all APIs return 200

---

## 🤝 Contributing

This is a private production system. For changes:
1. Create feature branch
2. Test locally
3. Push to GitHub
4. Vercel auto-deploys
5. Verify on production

---

## 📝 License

Private & Proprietary - All rights reserved

---

## 👨‍💻 Developed By

**RAGSPRO**  
Website: https://ragspro.com

---

## 📞 Support

For issues or questions:
1. Check documentation files
2. Review `/test-data` endpoint
3. Check Vercel deployment logs
4. Verify environment variables

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** June 20, 2026

🎉 **Fully operational and error-free!**
