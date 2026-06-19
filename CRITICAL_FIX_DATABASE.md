# 🚨 CRITICAL DATABASE FIX REQUIRED

## Problem Identified

**Error:** `prepared statement "s8" already exists`  
**Root Cause:** Prisma + Supabase pgBouncer conflict in transaction pooling mode

## Current (WRONG) Configuration

```
DATABASE_URL="postgresql://postgres.slzyuqoafjqhjkvhrhnx:gen-zresturant@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
```

This uses **pgBouncer pooler** which causes prepared statement conflicts.

## CORRECT Configuration (FIX NOW)

Go to Vercel Dashboard → Project Settings → Environment Variables → Production

### Delete These:
- `DATABASE_URL` (current broken one)
- `DIRECT_URL` (if exists)

### Add These NEW Values:

#### Option A: Use Direct Connection (RECOMMENDED for Prisma)
```
DATABASE_URL=postgresql://postgres.slzyuqoafjqhjkvhrhnx:gen-zresturant@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres

DIRECT_URL=postgresql://postgres.slzyuqoafjqhjkvhrhnx:gen-zresturant@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

**Note:** Use port **5432** (direct), NOT 6543 (pooler)

#### Option B: Use Pooler with Correct Parameters
```
DATABASE_URL=postgresql://postgres.slzyuqoafjqhjkvhrhnx:gen-zresturant@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=0

DIRECT_URL=postgresql://postgres.slzyuqoafjqhjkvhrhnx:gen-zresturant@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

**I RECOMMEND OPTION A** - Use direct connection port 5432.

### Also Fix NEXTAUTH_URL:

Current (WRONG):
```
NEXTAUTH_URL=https://pos-six-sooty.vercel.app
```

Correct:
```
NEXTAUTH_URL=https://genz-restaurant-pos.vercel.app
```

## Steps to Fix (IN VERCEL DASHBOARD)

1. Go to: https://vercel.com/dashboard
2. Select your project: `genz-restaurant-pos`
3. Go to: Settings → Environment Variables
4. Find **Production** environment
5. Click on `DATABASE_URL` → Remove
6. Click on `DIRECT_URL` → Remove  
7. Click on `NEXTAUTH_URL` → Edit → Change to `https://genz-restaurant-pos.vercel.app`
8. Click "Add New" → Add:
   ```
   Name: DATABASE_URL
   Value: postgresql://postgres.slzyuqoafjqhjkvhrhnx:gen-zresturant@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
   Environment: Production
   ```
9. Click "Add New" → Add:
   ```
   Name: DIRECT_URL
   Value: postgresql://postgres.slzyuqoafjqhjkvhrhnx:gen-zresturant@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
   Environment: Production
   ```
10. Click "Redeploy" button to trigger new deployment with correct env vars

## After Redeployment (2-3 mins)

1. Clear browser cookies/use incognito
2. Go to: https://genz-restaurant-pos.vercel.app/login
3. Login: admin@genz.com / admin123
4. Dashboard should show: **0/10 Tables** (working!)

## Why This Fixes It

- Port **5432** = Direct Postgres connection (no pooler)
- No prepared statement conflicts
- Prisma works properly
- All APIs will return 200 instead of 500

---

**DO THIS FIX IN VERCEL DASHBOARD NOW!**
Then redeploy and test.
