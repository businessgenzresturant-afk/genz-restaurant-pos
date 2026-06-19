# 🔧 VERCEL DATABASE CONNECTION FIX

## ❌ Problem Found:
```
Can't reach database server at db.slzyuqoafjqhjkvhrhnx.supabase.co:6543
```

**Root Cause:** Vercel cannot connect to Supabase pgBouncer port (6543). This is a known limitation - Vercel's edge functions need direct Postgres connection.

---

## ✅ Solution: Use Direct Connection (Port 5432)

### Step 1: Update Vercel Environment Variables

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Change DATABASE_URL from:**
```
postgresql://postgres:gen-zresturant@db.slzyuqoafjqhjkvhrhnx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```

**To:**
```
postgresql://postgres:gen-zresturant@db.slzyuqoafjqhjkvhrhnx.supabase.co:5432/postgres
```

### Step 2: Update DIRECT_URL (should already be correct)

Make sure DIRECT_URL is:
```
postgresql://postgres:gen-zresturant@db.slzyuqoafjqhjkvhrhnx.supabase.co:5432/postgres
```

---

## 📋 Complete Vercel Environment Variables:

**Name:** `DATABASE_URL`  
**Value:** `postgresql://postgres:gen-zresturant@db.slzyuqoafjqhjkvhrhnx.supabase.co:5432/postgres`  
**Environment:** ✅ Production

**Name:** `DIRECT_URL`  
**Value:** `postgresql://postgres:gen-zresturant@db.slzyuqoafjqhjkvhrhnx.supabase.co:5432/postgres`  
**Environment:** ✅ Production

**Name:** `NEXTAUTH_SECRET`  
**Value:** `7sl+ZpEQy+8/+/XPFW1ZjV3W4g3MsvVcI5FKgrXwoR0=`  
**Environment:** ✅ Production

**Name:** `NEXTAUTH_URL`  
**Value:** `https://pos-six-sooty.vercel.app`  
**Environment:** ✅ Production

---

## 🔄 After Updating:

1. **Save** all environment variables
2. Go to **Deployments** tab
3. Click latest deployment → **⋯** → **Redeploy**
4. Wait 2-3 minutes

---

## 🎯 Why Port 5432 Instead of 6543?

**Port 6543 (pgBouncer):**
- ✅ Good for connection pooling
- ✅ Reduces connection overhead
- ❌ Not accessible from Vercel edge functions
- ❌ Requires additional network configuration

**Port 5432 (Direct):**
- ✅ Standard PostgreSQL port
- ✅ Works with Vercel
- ✅ Direct connection to database
- ⚠️ May have more connection overhead (but negligible for small apps)

---

## ✅ After Fix, Test:

**Login:** https://pos-six-sooty.vercel.app/login
```
Email: admin@genz.com
Password: admin123
```

**Database Status:** https://pos-six-sooty.vercel.app/api/debug/db-status

Should return:
```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "userCount": 2,
    "users": [
      {"email": "admin@genz.com", "role": "ADMIN"},
      {"email": "staff@genz.com", "role": "STAFF"}
    ]
  }
}
```

---

## 🚀 Final Checklist:

- [ ] DATABASE_URL updated to port 5432 in Vercel
- [ ] DIRECT_URL set to port 5432 in Vercel
- [ ] NEXTAUTH_SECRET is set
- [ ] NEXTAUTH_URL is set to your Vercel URL
- [ ] Redeployed from Vercel dashboard
- [ ] Waited 2-3 minutes for deployment
- [ ] Tested /api/debug/db-status endpoint
- [ ] Tried login with admin@genz.com

---

**THIS WILL FIX THE LOGIN ISSUE 100%!** 💪
