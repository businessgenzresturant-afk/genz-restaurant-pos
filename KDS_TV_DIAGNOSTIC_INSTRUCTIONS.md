# KDS TV Loading Issue - Diagnostic Instructions

## Problem
Sony Android TV shows infinite "Loading Kitchen Display..." spinner that never resolves.

## What Changed (Diagnostic Build)

### 1. Server-Side Logging
**File**: `src/app/kds-display/[token]/page.tsx`

Every request now logs to Vercel:
```
[KDS] 🔍 Request received - Token: xyz123, Time: 2026-06-26T...
[KDS] Restaurant lookup result: ✅ Found: Gen-Z Restaurant (ID: abc)
```

**Purpose**: Verify if TV request reaches the server at all.

### 2. Visible Diagnostic Steps
**File**: `src/components/kds/KDSDisplayWrapper.tsx`

The loading screen now shows VISIBLE progress:

```
Kitchen Display Loading...

🔍 Diagnostic Information:
  Step 1: Component rendered ✅
  Step 2: useEffect fired ✅  
  Step 3: Mounted state set ✅
  Status: Ready to load KDS ✅

Restaurant ID: abc-123-def
Auto-start: Yes
Time: 11:45:30 AM
```

**Purpose**: See exactly which step the TV gets stuck on WITHOUT needing dev tools.

### 3. Fallback Timeout
After 5 seconds, if useEffect doesn't fire, it forces the mount anyway with a warning.

---

## Testing Steps

### Step 1: Reload TV and Observe Screen
1. Open the KDS display URL on the Sony TV
2. **Look at the screen carefully**
3. **Which steps show ✅ checkmarks?**
   - Step 1 only? → Component renders but JS not executing
   - Step 1 + 2? → JS works but state update fails
   - All 3 steps? → Should load KDS (if not, different issue)
   - None? → HTML not reaching TV at all

### Step 2: Check Vercel Logs (Simultaneously)
While the TV is loading:

1. Go to Vercel Dashboard → Your Project → Logs
2. Filter to show ONLY function logs (not build logs)
3. Look for: `[KDS] 🔍 Request received`
4. **Did the log appear?**
   - ✅ YES → Request reached server, issue is client-side
   - ❌ NO → Network/DNS problem, TV can't reach pos.gen-z.online

### Step 3: Report Back
Tell me EXACTLY what you see:

**Format**:
```
TV Screen shows:
  Step 1: [✅ or ⏳]
  Step 2: [✅ or ⏳]
  Step 3: [✅ or ⏳]
  Status: [text shown]

Vercel logs:
  [✅ Request appeared] or [❌ No request found]
```

---

## Root Cause Hypothesis

**Most likely**: Old Android TV WebView doesn't execute `useEffect` with empty dependency array `[]`.

This is a known issue with:
- Android WebView < v51 (Chrome equivalent)
- React 18 concurrent rendering
- Strict Mode in production builds

**Evidence needed**: Which step shows the last ✅ before it freezes.

---

## Possible Outcomes

### Outcome A: Step 1 only (No useEffect)
**Diagnosis**: TV browser doesn't support React hooks properly  
**Fix**: Remove useEffect, use direct rendering or setTimeout fallback

### Outcome B: Step 2 only (useEffect fires, state doesn't update)
**Diagnosis**: setState not triggering re-render on this browser  
**Fix**: Use different state management (ref-based or force update)

### Outcome C: All steps pass, still loading
**Diagnosis**: KDSDisplay component itself has an issue  
**Fix**: Add diagnostics to KDSDisplay.tsx (next iteration)

### Outcome D: No request in Vercel logs
**Diagnosis**: Network/DNS issue, not code issue  
**Fix**: Check TV's internet connection, DNS settings, try https://example.com

---

## If Fallback Kicks In
If you see "⚠️ FALLBACK: Forcing mount after timeout" in the debug log:
- Good news: Fallback worked, KDS should load after 5s
- Bad news: Original useEffect doesn't fire on this TV
- Solution: We'll remove useEffect entirely and use the fallback approach

---

## Next Steps After Diagnosis

Once you report what you see:

1. **If server logs appear**: We know it's a client-side hydration issue
2. **If specific step fails**: We fix THAT step's code only
3. **If all steps pass**: We move diagnostics deeper into KDSDisplay component

**No more blind rewrites** - we fix the EXACT failure point.

---

## Notes
- This is a diagnostic build, not a fix
- The visible steps will be removed once we identify the issue
- Server logs will help rule out network problems
- 5-second fallback prevents indefinite hanging

**Expected**: You should see progress to at least Step 2 within 1 second of page load.
