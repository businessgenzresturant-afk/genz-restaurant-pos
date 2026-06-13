# 🚨 LOGIN FIX - URGENT

## Problem: Login Not Working on Production

### Root Cause Analysis:
1. ❌ PgBouncer prepared statement error in seed endpoint
2. ⚠️ Possible `NEXTAUTH_SECRET` or `NEXTAUTH_URL` mismatch in Vercel
3. ⚠️ Database connection issues with pooler

---

## ✅ IMMEDIATE FIX STEPS:

### Step 1: Add Environment Variables in Vercel (CRITICAL!)

Go to: https://vercel.com/dashboard → `genz-restaurant-pos` → Settings → Environment Variables

**Add these 4 variables:**

```
Name: DATABASE_URL
Value: postgresql://postgres.hgnybmsltqpmiaymabvq:tezfa5-Wiqham-civfiv@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
Environment: Production, Preview, Development

Name: DIRECT_URL  
Value: postgresql://postgres.hgnybmsltqpmiaymabvq:tezfa5-Wiqham-civfiv@db.hgnybmsltqpmiaymabvq.supabase.co:5432/postgres
Environment: Production, Preview, Development

Name: NEXTAUTH_URL
Value: https://genz-restaurant-pos.vercel.app
Environment: Production, Preview, Development

Name: NEXTAUTH_SECRET
Value: vW8xK3mN9pQ2rT5yU7zA4bC6dE8fG0hJ2kL4mN6pQ8s
Environment: Production, Preview, Development
```

### Step 2: Redeploy
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait 2-3 minutes

### Step 3: Clear Database and Reseed
Visit these URLs in order:

1. **Check current data:**
   ```
   https://genz-restaurant-pos.vercel.app/api/seed
   ```

2. **If seed shows error, manually clear and reseed via Supabase:**
   - Go to https://supabase.com/dashboard
   - Select project: `hgnybmsltqpmiaymabvq`
   - SQL Editor → Run this:
   
   ```sql
   -- Clear all data
   TRUNCATE "MenuItem", "OrderItem", "Bill", "Order", "Table", "User", "Restaurant" CASCADE;
   
   -- Verify empty
   SELECT COUNT(*) FROM "Restaurant";
   SELECT COUNT(*) FROM "User";
   ```

3. **Then visit seed endpoint again:**
   ```
   https://genz-restaurant-pos.vercel.app/api/seed
   ```

### Step 4: Test Login
1. Go to: https://genz-restaurant-pos.vercel.app/login
2. Email: `admin@genz.com`
3. Password: `admin123`
4. Click Login

---

## 🔍 DEBUGGING COMMANDS:

### Check if users exist:
```sql
SELECT email, role FROM "User";
```

### Check restaurant:
```sql
SELECT * FROM "Restaurant";
```

### Verify password hash:
```sql
SELECT email, LEFT(password, 20) as password_hash FROM "User";
```

---

## Alternative: Direct Database Seed via SQL

If API seed keeps failing, run this directly in Supabase SQL Editor:

```sql
-- 1. Create Restaurant
INSERT INTO "Restaurant" (id, name, address, "createdAt")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'GenZ Restaurant',
  'L-97, Gali No 7, Near Labour Chowk, Mahipalpur, 110037',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Create Admin User (password: admin123)
-- Hash generated with bcrypt cost 10
INSERT INTO "User" (id, email, password, name, role, "restaurantId", "createdAt")
VALUES (
  gen_random_uuid(),
  'admin@genz.com',
  '$2a$10$YgX8PnQVqJF.eJ8rKp3bZ.Qn5kR0xZ8yQ3mN5pR7tU9vW1xY3zA4b',
  'Admin User',
  'ADMIN',
  '00000000-0000-0000-0000-000000000001',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 3. Create Tables
INSERT INTO "Table" (id, number, capacity, status, "restaurantId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), generate_series, 4, 'AVAILABLE', '00000000-0000-0000-0000-000000000001', NOW(), NOW()
FROM generate_series(1, 10)
ON CONFLICT DO NOTHING;

-- 4. Verify
SELECT 'Restaurant:', COUNT(*) FROM "Restaurant"
UNION ALL
SELECT 'Users:', COUNT(*) FROM "User"
UNION ALL
SELECT 'Tables:', COUNT(*) FROM "Table";
```

---

## 🎯 EXPECTED RESULT:

After fixing, you should see:
- ✅ Login page loads
- ✅ Can login with admin@genz.com / admin123
- ✅ Redirects to dashboard
- ✅ Dashboard shows restaurant data

---

## 🚨 IF STILL NOT WORKING:

Check Vercel Runtime Logs:
1. Vercel Dashboard → Deployments
2. Click on latest deployment
3. Click "View Function Logs"
4. Look for NextAuth errors
5. Send me the error message

---

**STATUS: Waiting for environment variables to be set in Vercel**
