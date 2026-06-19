# 🚀 Vercel Environment Variables Setup Guide

## Critical: Copy-Paste These Exact Values in Vercel Dashboard

### Step-by-Step Instructions:

1. Go to: https://vercel.com/dashboard
2. Select your project: **pos-six-sooty**
3. Click **Settings** → **Environment Variables**
4. Add each variable below one by one

---

## 📋 Environment Variables to Add:

### 1. DATABASE_URL
**Name:** `DATABASE_URL`  
**Value:** 
```
postgresql://postgres:gen-zresturant@db.slzyuqoafjqhjkvhrhnx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```
**Environment:** ✅ Production (check this)  
**Action:** Click **Save**

---

### 2. DIRECT_URL
**Name:** `DIRECT_URL`  
**Value:** 
```
postgresql://postgres:gen-zresturant@db.slzyuqoafjqhjkvhrhnx.supabase.co:5432/postgres
```
**Environment:** ✅ Production (check this)  
**Action:** Click **Save**

---

### 3. NEXTAUTH_SECRET
**Name:** `NEXTAUTH_SECRET`  
**Value:** 
```
7sl+ZpEQy+8/+/XPFW1ZjV3W4g3MsvVcI5FKgrXwoR0=
```
**Environment:** ✅ Production (check this)  
**Action:** Click **Save**

---

### 4. NEXTAUTH_URL
**Name:** `NEXTAUTH_URL`  
**Value:** 
```
https://pos-six-sooty.vercel.app
```
**Environment:** ✅ Production (check this)  
**Action:** Click **Save**

---

## 🔄 After Adding All Variables:

### Step 1: Verify All Variables Are Added
Go to **Settings** → **Environment Variables** and confirm you see all 4 variables:
- ✅ DATABASE_URL
- ✅ DIRECT_URL
- ✅ NEXTAUTH_SECRET
- ✅ NEXTAUTH_URL

### Step 2: Redeploy
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **⋯** (three dots) menu
4. Click **Redeploy**
5. Confirm **Redeploy**

---

## 🎯 Expected Result:

After redeployment completes (2-3 minutes):
- ✅ Login page should work
- ✅ Database connection should be active
- ✅ Authentication should work properly

---

## 🐛 If Login Still Doesn't Work:

### Check 1: Verify Database is Running
1. Go to Supabase Dashboard: https://app.supabase.com/
2. Check if your database is active
3. Verify the connection string is correct

### Check 2: Check Vercel Build Logs
1. Go to Vercel **Deployments**
2. Click on latest deployment
3. Check **Build Logs** for any errors

### Check 3: Check Browser Console
1. Open the login page: https://pos-six-sooty.vercel.app/login
2. Press F12 (Developer Tools)
3. Go to **Console** tab
4. Check for any JavaScript errors

---

## 📞 Common Issues & Solutions:

### Issue: "Can't reach database server"
**Solution:** 
- Verify Supabase database is running
- Check if password `gen-zresturant` is correct in Supabase

### Issue: "Invalid credentials"
**Solution:** 
- Make sure you have created a user in the database
- Check if the user table exists and has data

### Issue: "NEXTAUTH_SECRET not set"
**Solution:** 
- Verify `NEXTAUTH_SECRET` is added in Vercel Environment Variables
- Redeploy after adding

---

## 🔑 Default Test Credentials (if you have seeded data):

If you've run the database seeder, try these:
- **Email:** `admin@restaurant.com`
- **Password:** `admin123`

OR

- **Email:** `staff@restaurant.com`
- **Password:** `staff123`

---

## ✅ Quick Checklist:

- [ ] All 4 environment variables added in Vercel
- [ ] Vercel project redeployed
- [ ] Supabase database is running
- [ ] Database has users table with at least one user
- [ ] Login page loads without errors
- [ ] Browser console shows no errors

---

**Live URL:** https://pos-six-sooty.vercel.app/login

**Need Help?** Check Vercel deployment logs or Supabase database status first!
