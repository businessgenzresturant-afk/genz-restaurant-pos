# Dashboard Data Not Showing - Troubleshooting Guide

## Problem
Login works successfully but dashboard shows no data (empty cards, no tables, no menu items).

## Database Verification ✅
Database has all required data:
- ✅ 179 menu items  
- ✅ 10 tables  
- ✅ 2 users (admin & staff)  
- ✅ Both users have restaurantId: `00000000-0000-0000-0000-000000000001`
- ✅ All tables & menu items belong to that restaurantId

## Possible Causes

### 1. Session/Authentication Issue
The APIs require authentication. If the session cookie isn't being sent properly, all API calls will return `{"error": "Unauthorized"}`.

### 2. Browser Console Errors
Check for JavaScript errors preventing data fetch.

### 3. API Response Issues
The dashboard fetches from these endpoints:
- `/api/tables` - Should return array of tables
- `/api/menu` - Should return array of menu items  
- `/api/orders` - Should return array of orders
- `/api/reports` - Should return daily sales data

## Debugging Steps

### Step 1: Check Browser Console
1. Open https://pos-six-sooty.vercel.app/dashboard
2. Press `F12` or `Cmd+Option+I` (Mac) to open DevTools
3. Go to **Console** tab
4. Look for any RED error messages
5. Share screenshot or copy the errors

### Step 2: Check Network Tab
1. In DevTools, go to **Network** tab
2. Refresh the page
3. Look for these API calls:
   - `/api/tables`
   - `/api/menu`
   - `/api/orders`
   - `/api/reports`
4. Click on each one and check:
   - **Status Code**: Should be `200`, not `401` or `500`
   - **Response**: Should show JSON data, not `{"error": "Unauthorized"}`
5. Share screenshots

### Step 3: Test Session Debug Endpoint
After the new deployment completes, go to:
```
https://pos-six-sooty.vercel.app/api/debug/session
```

You should see something like:
```json
{
  "hasSession": true,
  "user": {
    "email": "admin@genz.com",
    "name": "Admin User",
    "role": "ADMIN",
    "restaurantId": "00000000-0000-0000-0000-000000000001",
    "id": "..."
  },
  "env": {
    "hasNextAuthUrl": true,
    "hasNextAuthSecret": true,
    "nextAuthUrl": "https://pos-six-sooty.vercel.app",
    "nodeEnv": "production"
  }
}
```

**If `hasSession` is `false`**, the login didn't work properly.

### Step 4: Try Direct API Call
While logged in on the dashboard, open a new tab and go to:
```
https://pos-six-sooty.vercel.app/api/tables
```

You should see JSON data like:
```json
[
  {
    "id": "...",
    "number": 1,
    "capacity": 2,
    "status": "AVAILABLE",
    "restaurantId": "00000000-0000-0000-0000-000000000001"
  },
  ...
]
```

**If you see `{"error": "Unauthorized"}`**, then session cookies aren't working.

## Quick Fixes to Try

### Fix 1: Clear Browser Cache
1. Go to Settings → Privacy → Clear Browsing Data
2. Select "Cookies" and "Cached images"
3. Clear and reload

### Fix 2: Try Incognito/Private Mode
Open https://pos-six-sooty.vercel.app/login in incognito mode and login again.

### Fix 3: Hard Reload
Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows) to force reload without cache.

### Fix 4: Check if Logged In
Look at the top right corner of dashboard - does it show your name/email? If not, you might not be logged in properly.

## Report Back
Please provide:
1. ✅ Screenshot of browser console (F12 → Console tab)
2. ✅ Screenshot of network tab showing API calls
3. ✅ Result from `/api/debug/session` endpoint
4. ✅ Result from `/api/tables` endpoint (in separate tab while logged in)
5. ✅ Does the top navigation show your user name/email?

## Expected Behavior
When working correctly:
- Dashboard shows 4 summary cards (Tables, Kitchen Queue, Revenue, etc.)
- All cards show numbers (not loading spinner forever)
- Clicking "View All Tables" shows 10 tables
- Clicking "New Order" opens table selection with 10 tables
- Network tab shows all 4 API calls returning 200 status with data

---

**Current Status:** Investigating - need console logs/network data to diagnose further.
