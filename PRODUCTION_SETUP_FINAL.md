# ✅ Production Setup - FINAL & WORKING

**Status:** ✅ FULLY OPERATIONAL  
**Date:** June 20, 2026  
**Project:** Gen-Z Restaurant POS

---

## 🎯 Production URLs

**Primary URL (USE THIS):**
```
https://genz-restaurant-pos.vercel.app
```

**Admin Dashboard:**
```
https://genz-restaurant-pos.vercel.app/dashboard
```

**Login Page:**
```
https://genz-restaurant-pos.vercel.app/login
```

---

## 🔐 Credentials

### Admin Account
- **Email:** `admin@genz.com`
- **Password:** `admin123`
- **Role:** ADMIN (full access)

### Staff Account
- **Email:** `staff@genz.com`
- **Password:** `staff123`
- **Role:** STAFF (limited access)

---

## 🗄️ Database Configuration (CRITICAL - DO NOT CHANGE)

### Supabase PostgreSQL

**Region:** AWS Asia Pacific (ap-northeast-1)  
**Project ID:** slzyuqoafjqhjkvhrhnx

### ✅ WORKING Configuration

**DATABASE_URL (Production):**
```
postgresql://postgres.slzyuqoafjqhjkvhrhnx:gen-zresturant@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

**DIRECT_URL (Production):**
```
postgresql://postgres.slzyuqoafjqhjkvhrhnx:gen-zresturant@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

**Key Points:**
- ✅ Port: **5432** (Direct connection - NO pooler issues)
- ✅ Host: `aws-1-ap-northeast-1.pooler.supabase.com`
- ✅ Database: `postgres`
- ✅ User: `postgres.slzyuqoafjqhjkvhrhnx`
- ✅ Password: `gen-zresturant`

### ❌ DO NOT USE (Causes Errors)

**WRONG Port 6543:**
```
❌ postgresql://...@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres
```

**Why:** Port 6543 uses pgBouncer pooling which causes:
- Prepared statement conflicts
- "prepared statement already exists" errors
- 500 Internal Server errors on all APIs

**ALWAYS USE PORT 5432 for Prisma + Supabase**

---

## 🔑 Environment Variables (Vercel Production)

### Required Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | See above | Port 5432 ONLY |
| `DIRECT_URL` | See above | Port 5432 ONLY |
| `NEXTAUTH_SECRET` | `7sl+ZpEQy+8/+/XPFW1ZjV3W4g3MsvVcI5FKgrXwoR0=` | Keep secret |
| `NEXTAUTH_URL` | `https://genz-restaurant-pos.vercel.app` | Must match domain |

### Optional Variables (Auto-set by Vercel)
- `VERCEL`, `VERCEL_ENV`, `VERCEL_URL` (managed by Vercel)
- `NX_DAEMON`, `TURBO_*` (build optimization)

---

## 📊 Database Schema

**Current Data:**
- ✅ 2 Users (admin + staff)
- ✅ 10 Tables (numbered 1-10)
- ✅ 179 Menu Items (full restaurant menu)
- ✅ 0 Orders (fresh system)
- ✅ 1 Restaurant (GenZ Restaurant)

**Database Health Check:**
```
https://genz-restaurant-pos.vercel.app/api/debug/db-status
```

Expected response:
```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "userCount": 2,
    "users": [...]
  }
}
```

---

## 🧪 Testing & Verification

### 1. Session Test
```
https://genz-restaurant-pos.vercel.app/api/debug/session
```

Expected:
```json
{
  "hasSession": true,
  "user": {
    "email": "admin@genz.com",
    "role": "ADMIN",
    "restaurantId": "00000000-0000-0000-0000-000000000001"
  }
}
```

### 2. API Endpoints Test
```
https://genz-restaurant-pos.vercel.app/test-data
```

All endpoints should return **status: 200**:
- ✅ Session API
- ✅ Tables API (10 tables)
- ✅ Menu API (179 items)
- ✅ Orders API (empty array)
- ✅ DB Status API

### 3. Dashboard Test
```
https://genz-restaurant-pos.vercel.app/dashboard
```

Expected display:
- **Tables:** 0/10 (0 occupied, 10 total)
- **Kitchen Queue:** 0
- **Today's Revenue:** ₹0
- **Dine In:** 0
- **Takeaway:** 0
- **Parcel:** 0
- **Delivery:** 0

---

## 🚀 Deployment

### GitHub Repository
```
https://github.com/businessgenzresturant-afk/genz-restaurant-pos
```

**Branch:** `master`  
**Auto-deploy:** ✅ Enabled (push to master triggers Vercel deployment)

### Vercel Project
- **Account:** businessgenzresturant-afk
- **Project:** genz-restaurant-pos
- **Framework:** Next.js 14 (App Router)
- **Node Version:** 22.x
- **Build Command:** `prisma generate && next build`

### Deployment Process
1. Push to master branch
2. Vercel auto-builds (1-2 minutes)
3. Test at `/test-data` endpoint
4. Verify dashboard loads

---

## 🛠️ Troubleshooting

### Issue: Login not working

**Solution:**
1. Clear browser cookies completely
2. Use Incognito mode
3. Try login 2-3 times (session cookie takes time)
4. Check `/api/debug/session` shows `hasSession: true`

### Issue: Data not showing (0/0 tables)

**Solution:**
1. Check `/test-data` - all APIs should return 200
2. Verify `DATABASE_URL` uses port **5432** (not 6543)
3. Check console for `[Dashboard]` logs
4. Redeploy if needed

### Issue: 500 Internal Server Error

**Likely Cause:** Database connection issue

**Solution:**
1. Verify `DATABASE_URL` in Vercel env vars
2. Must use port **5432**
3. Test: `curl https://genz-restaurant-pos.vercel.app/api/debug/db-status`
4. Should return `"status":"ok"`

### Issue: "prepared statement already exists"

**Cause:** Using port 6543 (pgBouncer)

**Solution:**
- Change `DATABASE_URL` to port **5432**
- Redeploy
- This is the PRIMARY fix for all 500 errors

---

## 📝 Maintenance

### Regular Checks (Weekly)
- [ ] Test login flow
- [ ] Verify dashboard loads data
- [ ] Check `/api/debug/db-status`
- [ ] Test creating new order
- [ ] Verify kitchen display works

### Database Backup
Supabase automatically backs up database daily.

**Manual backup command:**
```bash
pg_dump "postgresql://postgres.slzyuqoafjqhjkvhrhnx:gen-zresturant@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" > backup_$(date +%Y%m%d).sql
```

### Update Passwords (Security)
To change admin password:
```bash
# Generate new hash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('NEW_PASSWORD', 10, (e,h) => console.log(h));"

# Update in database
psql "..." -c "UPDATE \"User\" SET password = 'NEW_HASH' WHERE email = 'admin@genz.com';"
```

---

## 🔒 Security Notes

### Current Security Status
- ✅ Passwords: bcrypt hashed (10 rounds)
- ✅ Session: JWT with 30-day expiry
- ✅ HTTPS: Enabled on Vercel
- ✅ Environment variables: Encrypted in Vercel
- ✅ Database: SSL connection

### Recommendations
1. ⚠️ Change default passwords after first use
2. ⚠️ Add IP whitelist to Supabase (if needed)
3. ⚠️ Enable 2FA on GitHub/Vercel accounts
4. ⚠️ Rotate `NEXTAUTH_SECRET` every 90 days
5. ⚠️ Monitor Vercel logs for suspicious activity

---

## ✅ Final Checklist

- [x] Database connected (port 5432)
- [x] All APIs working (200 status)
- [x] Login functional
- [x] Dashboard loads data
- [x] Environment variables correct
- [x] NEXTAUTH_URL matches domain
- [x] Session persists on refresh
- [x] No console errors
- [x] Mobile responsive
- [x] All features accessible

---

## 📞 Support

### If Issues Persist

1. Check `/test-data` endpoint
2. Check browser console (F12)
3. Check Vercel deployment logs
4. Verify env vars in Vercel dashboard
5. Test database connection directly:
   ```bash
   psql "postgresql://postgres.slzyuqoafjqhjkvhrhnx:gen-zresturant@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" -c "SELECT 1;"
   ```

### Documentation Files
- `PRODUCTION_SETUP_FINAL.md` (this file)
- `CRITICAL_FIX_DATABASE.md` (database fix details)
- `VERCEL_FIX_SUMMARY.md` (deployment fixes)
- `PASSWORD_FIX_COMPLETE.md` (password reset guide)

---

**Last Updated:** June 20, 2026  
**Status:** ✅ PRODUCTION READY  
**Version:** 1.0.0  
**Deployment:** https://genz-restaurant-pos.vercel.app

🎉 **System is fully operational and error-free!**
