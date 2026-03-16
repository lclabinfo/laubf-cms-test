# Authentication & Security Audit Report

**Date:** 2026-03-16
**Scope:** All authentication flows, session management, token system, password handling, rate limiting, email sending
**Status:** Reviewed — action items tracked below

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 0 | -- |
| HIGH | 1 | In-memory rate limiter ineffective on serverless |
| MEDIUM | 2 | Bcrypt 72-byte truncation (FIXED), rate-limit map clearing |
| LOW | 7 | See detailed findings below |
| INFO | 10+ | Positive findings confirming good practices |

---

## Detailed Findings

### HIGH Severity

#### H1: In-Memory Rate Limiter (Serverless Incompatible)
- **File:** `lib/rate-limit.ts`
- **Description:** Rate limiter uses an in-memory `Map`. On serverless platforms (Vercel), each cold-start gets a fresh Map, making rate limiting ineffective.
- **Status:** Known limitation, documented in code comments
- **Action:** Before deploying to production on serverless, replace with Upstash Redis-based rate limiting (`@upstash/ratelimit`)

### MEDIUM Severity

#### M1: Bcrypt 72-Byte Truncation — FIXED
- **Files:** All `MAX_PASSWORD_LENGTH` constants across auth routes
- **Description:** Max password length was 128, but bcrypt silently truncates at 72 bytes. Passwords beyond byte 72 were being ignored.
- **Resolution:** Reduced `MAX_PASSWORD_LENGTH` to 72 across all 4 API routes + auth config. Validation messages updated.

#### M2: Emergency Map Clearing Resets All Rate Limits
- **File:** `lib/rate-limit.ts` lines 30-38
- **Description:** When the map exceeds 10,000 entries, `hits.clear()` is called, resetting ALL rate limits. An attacker who floods with unique keys could trigger a brute-force window.
- **Action:** Implement LRU eviction or migrate to Redis (moot if H1 is resolved)

### LOW Severity

#### L1: Missing JWT Issuer/Audience Claims
- **File:** `lib/auth/tokens.ts`
- **Description:** JWTs don't set `iss`/`aud` claims. The `purpose` field provides functional scoping, but iss/aud adds defense-in-depth.
- **Action:** Consider adding `.setIssuer()` / `.setAudience()` — low priority

#### L2: Missing Rate Limit on link-google-intent — FIXED
- **File:** `app/api/v1/auth/link-google-intent/route.ts`
- **Description:** Endpoint had no rate limiting.
- **Resolution:** Added rate limiting (5/hour per user)

#### L3: Login Timing Leak
- **File:** `lib/auth/config.ts` (authorize function)
- **Description:** "User not found" returns fast (no bcrypt), "wrong password" is slow (bcrypt compare). Timing difference could leak email existence.
- **Action:** Add dummy `bcrypt.compare` when user is not found to normalize timing

#### L4: JWT Contains Full Permissions Array
- **File:** `lib/auth/config.ts`
- **Description:** JWT stores up to 49 permissions + role info. Cookie is httpOnly so not client-accessible, but monitor for 4KB limit.
- **Action:** Monitor cookie size as permissions grow

#### L5: No Special Character Requirement in Passwords
- **Files:** All auth API routes
- **Description:** Policy requires uppercase + lowercase + number but no special characters. NIST SP 800-63B favors length over complexity.
- **Action:** Consider increasing minimum length to 10-12 or adding breached-password check (HaveIBeenPwned k-anonymity API)

#### L6: Dev Mode Logs Full Email Content
- **File:** `lib/email/send-email.ts` lines 17-23
- **Description:** When `SENDGRID_API_KEY` is not set, full email body (including tokens/codes) is logged to console.
- **Action:** Truncate logged body or log only subject/recipient in development

#### L7: Google Link Intent Cookie Not Signed
- **File:** `app/api/v1/auth/link-google-intent/route.ts`
- **Description:** Cookie stores plain user ID. A subdomain cookie injection could set it. Mitigated by the email-match check in signIn callback.
- **Action:** Consider HMAC-signing the cookie value for defense-in-depth

---

## Positive Findings (Confirmed Secure)

| Area | Implementation | Status |
|------|---------------|--------|
| Password hashing | bcrypt with cost factor 12 | Correct |
| Hash storage | `User.passwordHash` in PostgreSQL | Correct (not in .env) |
| Token signing | HS256 JWT via `jose` library with AUTH_SECRET | Correct |
| Token expiry | Verification: 30m, Reset: 15m code + 1h JWT, Invitation: 7d | Appropriate |
| Token replay prevention | Nonce derived from passwordHash + emailVerified + verificationNonce | Well-designed |
| Session cookies | httpOnly, sameSite=lax, secure in prod, __Secure- prefix | Correct |
| Session strategy | JWT with 7-day maxAge | Appropriate |
| Session invalidation | sessionVersion bump on password change forces JWT refresh | Correct |
| Rate limiting coverage | All major auth endpoints rate-limited | Comprehensive |
| Input validation | Email regex, password strength, name length limits, Prisma parameterized queries | Thorough |
| Email sending | SendGrid authenticated REST API (not open relay) | Correct |
| Google OAuth linking | Cookie-based intent + email-match verification prevents session swap | Secure |
| Reset code storage | SHA-256 hashed, timing-safe comparison, 15-min expiry, single-use | Correct |
| User enumeration (login) | authorize returns null for both "not found" and "wrong password" | Correct |
| Honeypot | Signup form includes hidden field, bots get fake success | Effective |
| Bcrypt DoS prevention | Max password length enforced before hashing | Correct |

---

## Architecture Overview

```
User → Next.js Middleware (edge-config.ts: route auth check)
     → Auth.js v5 (JWT strategy, config.ts)
       → Credentials provider (bcrypt verify)
       → Google OAuth provider (email-keyed linking)
     → API Routes (require-auth.ts: permission check)
     → Prisma (parameterized queries, no raw SQL)
```

**Token flow:** JWT signed with AUTH_SECRET, nonce tied to user state (passwordHash + emailVerified), purpose-scoped, time-limited.

**Password reset flow (updated 2026-03-16):**
1. User enters email → API validates existence, generates 6-digit code
2. Code is SHA-256 hashed, stored in `User.resetCodeHash` with 15-min expiry
3. User enters code → API verifies (timing-safe), clears code, issues JWT reset token
4. User sets new password → API verifies JWT, bcrypt hashes, updates DB

---

## Pre-Production Checklist

- [ ] Replace in-memory rate limiter with Upstash Redis (H1)
- [ ] Add dummy bcrypt compare on login for timing normalization (L3)
- [ ] Verify SENDGRID_API_KEY is set in production environment (L6)
- [ ] Monitor JWT cookie size as permissions are added (L4)
- [ ] Consider HMAC-signing the google-link-intent cookie (L7)
- [ ] Evaluate password minimum length increase (L5)
- [ ] Rotate AUTH_SECRET if it was ever in a commit (verify .env is gitignored — confirmed ✓)
