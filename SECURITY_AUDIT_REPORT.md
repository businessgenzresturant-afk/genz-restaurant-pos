# 🔒 GenZ Restaurant POS - Security Audit Report

**Audit Date:** 2026-06-21  
**Auditor:** Claude Code (automated + manual review)  
**Project:** GenZ Restaurant POS  
**Tech Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL (Supabase), NextAuth v4

---

## ⚠️ Executive Summary

| Category | Status | Critical Issues | High Issues | Medium Issues |
|----------|--------|----------------|-------------|---------------|
| Secrets Management | 🔴 CRITICAL | 2 | 1 | - |
| Authentication/Auth | 🟢 GOOD | - | - | 1 |
| Input Validation | 🟢 GOOD | - | - | 1 |
| SQL Injection | 🟢 GOOD | - | - | - |
| Dependencies | 🔴 CRITICAL | 20+ | 3 | 2 |

**Overall Security Score: 5.5/10** — Immediate action required on secrets and dependencies.

---

## 1. 🔴 CRITICAL: Secrets Management

### Issue 1.1: Database Password Exposed in `.env.production` (Git-Committed)

**Severity:** CRITICAL  
**Location:** `.env.production` (lines 5-6)

```
DATABASE_URL="postgresql://postgres.slzyuqoafjqhjkvhrhnx:gen-zresturant@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.slzyuqoafjqhjkvhrhnx:gen-zresturant@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

**Problem:** Production database credentials are committed to git and visible in the repository.

**Impact:**
- Anyone with repo access can read production database
- Credentials may be scraped from git history
- Direct data breach risk

**Action Required:**
1. **IMMEDIATE:** Rotate database password in Supabase Dashboard
2. Remove `.env.production` from git: `git rm --cached .env.production`
3. Add `.env.production` to `.gitignore`
4. Set `DATABASE_URL` and `DIRECT_URL` in Vercel Dashboard only
5. Run: `git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env.production" --prune-empty --tag-name-filter cat -- --all`

---

### Issue 1.2: NEXTAUTH_SECRET Committed to Git

**Severity:** CRITICAL  
**Location:** `.env.production` (line 7)

```
NEXTAUTH_SECRET="7sl+ZpEQy+8/+/XPFW1ZjV3W4g3MsvVcI5FKgrXwoR0="
```

**Problem:** Session secret is committed and visible in git history.

**Impact:**
- Attackers can forge session tokens
- Session hijacking possible
- Authentication bypass risk

**Action Required:**
1. **IMMEDIATE:** Generate new secret: `openssl rand -base64 32`
2. Update in Vercel Dashboard → Settings → Environment Variables
3. Remove from `.env.production` file
4. Clean git history (same as 1.1)

---

### Issue 1.3: Fallback Secret in Code

**Severity:** HIGH  
**Location:** `src/lib/env.ts` (line 11)

```typescript
NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET_FALLBACK || 'min-32-char-secret-for-build-only',
```

**Problem:** Hardcoded fallback secret in source code.

**Action Required:** Remove fallback, fail safely if secret is missing.

---

## 2. ✅ Authentication & Authorization

### ✅ What's Working Well

| Component | Status | Notes |
|-----------|--------|-------|
| NextAuth Strategy | ✅ Good | JWT-based, httpOnly cookies |
| Cookie Security | ✅ Good | `httpOnly: true`, `secure: true` (prod), `sameSite: "lax"` |
| Role-Based Access | ✅ Good | Middleware checks for ADMIN routes |
| Session Validation | ✅ Good | `checkAuth()` in API routes |

### Issue 2.1: CSRF Protection Gap

**Severity:** MEDIUM  
**Location:** `src/lib/api-auth.ts`

Code comment acknowledges CSRF not implemented:
```typescript
// CSRF protection: Not implemented as this is an internal, same-origin tool
```

**Assessment:** Acceptable for internal POS system, but should be revisited if API ever becomes public.

---

## 3. ✅ Input Validation

### What's Working Well

| Component | Status | Notes |
|-----------|--------|-------|
| Zod Schemas | ✅ Good | All inputs validated in `src/lib/validations.ts` |
| Text Sanitization | ✅ Good | `sanitizeText()` in `src/lib/sanitize.ts` |
| XSS Prevention | ✅ Good | HTML tag removal, character escaping |

### Issue 3.1: Inconsistent Sanitization

**Severity:** MEDIUM  
**Location:** `src/app/api/orders/route.ts` (lines 114-119)

Manual sanitization instead of using shared `sanitizeText()`:
```typescript
item.specialInstructions = item.specialInstructions
  .replace(/<[^>]*>/g, '')
  .replace(/[<>'"]/g, '')
  .substring(0, 500);
```

**Recommendation:** Use `sanitizeText()` for consistency.

---

## 4. ✅ SQL Injection Prevention

### Status: SECURE ✅

**Reason:** All database queries use Prisma ORM which implements parameterized queries by default.

**Example from codebase:**
```typescript
// SAFE - Prisma automatically parameterizes
const bills = await prisma.bill.findMany({
  where: { status: statusParam }
});
```

No raw SQL concatenation detected in the codebase.

---

## 5. 🔴 CRITICAL: Dependency Vulnerabilities

### npm audit Summary

```
Severity     Count
─────────────────
CRITICAL     20+
HIGH         3
MEDIUM       2
```

### Critical Vulnerabilities

| Package | Severity | Issue | Fix |
|---------|----------|-------|-----|
| next 0.9.9 - 16.3.0 | CRITICAL | SSRF in Server Actions | Upgrade to 15.x |
| next 0.9.9 - 16.3.0 | CRITICAL | DoS in Image Optimization | Upgrade to 15.x |
| next 0.9.9 - 16.3.0 | CRITICAL | Authorization Bypass | Upgrade to 15.x |
| next 0.9.9 - 16.3.0 | CRITICAL | HTTP Request Smuggling | Upgrade to 15.x |
| glob 10.2.0 - 10.4.5 | HIGH | Command Injection | Update eslint-config-next |
| minimatch 9.0.0 - 9.0.6 | HIGH | ReDoS | Update @typescript-eslint |

### Action Required

```bash
# Upgrade Next.js (breaking changes likely)
npm install next@latest

# Fix eslint-config-next (breaks glob vulnerability)
npm install eslint-config-next@latest --save-dev

# Fix TypeScript ESLint (breaks minimatch vulnerability)
npm install @typescript-eslint/parser@latest @typescript-eslint/typescript-estree@latest --save-dev
```

---

## 6. ✅ Other Security Checks

| Check | Status | Notes |
|-------|--------|-------|
| Rate Limiting | ✅ Good | `src/lib/rateLimit.ts` implemented |
| Auth on API Routes | ✅ Good | `checkAuth()` on all protected routes |
| Restaurant Isolation | ✅ Good | Multi-tenant validation in place |
| Error Messages | ✅ Good | Generic errors, details logged only |
| Git Ignore | ✅ Good | `.env` patterns configured |

---

## 7. 🔧 Recommended Actions (Priority Order)

### Immediate (Do Today)

1. **Rotate database password** in Supabase Dashboard
2. **Generate new NEXTAUTH_SECRET**: `openssl rand -base64 32`
3. **Remove `.env.production` from git**:
   ```bash
   git rm --cached .env.production
   git add .gitignore
   git commit -m "security: remove .env.production from version control"
   ```
4. **Set env vars in Vercel Dashboard** (not in files)

### This Week

5. **Remove hardcoded fallback** from `src/lib/env.ts`
6. **Update Next.js** to latest version
7. **Fix eslint-config-next** and TypeScript ESLint packages
8. **Clean git history** to remove exposed credentials

### This Month

9. **Sanitize git history** to remove `.env.production` permanently:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.production" \
     --prune-empty --tag-name-filter cat -- --all
   git push --force --all
   ```
10. **Enable Dependabot** on GitHub for auto-updates
11. **Consider CSRF tokens** if API becomes public-facing

---

## 8. 📋 Pre-Deployment Checklist

Before next production deployment, verify:

- [ ] Database password rotated
- [ ] NEXTAUTH_SECRET regenerated
- [ ] `.env.production` removed from git
- [ ] All env vars set in Vercel Dashboard only
- [ ] Next.js upgraded to latest
- [ ] npm audit shows 0 critical vulnerabilities
- [ ] Git history cleaned of exposed secrets

---

**Next:** Start with immediate actions — rotate credentials NOW before addressing anything else.