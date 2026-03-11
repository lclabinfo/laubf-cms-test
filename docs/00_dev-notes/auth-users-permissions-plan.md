# Authentication, User Management & Permissions — Implementation Plan

Generated: 2026-03-09
Last audited: 2026-03-09
Status: **Phase 1-4 IMPLEMENTED — Custom Roles System Added 2026-03-10**

---

## Remaining Work

Items that still need implementation or attention:

- [ ] **Upstash Redis rate limiter** — Current in-memory rate limiter works for single-instance/development but is per-process. Before deploying to Vercel/serverless, swap `lib/rate-limit.ts` to use `@upstash/ratelimit` with sliding window. Requires: Upstash account, `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env vars. See §2.3 for details.
- [ ] **Google reCAPTCHA v3** — Invisible challenge for signup/forgot-password. Requires: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` + `RECAPTCHA_SECRET_KEY` env vars. See §3 for details.
- [ ] **`lastLogin` tracking** — Needs dedicated `lastLogin DateTime?` field on User model
- [ ] **Zod validation** — Replace manual validation with Zod schemas
- [ ] **Drop legacy `role` enum** — After confirming all code uses `roleId`/permissions, remove `ChurchMember.role` column and `MemberRole` enum (Phase 3 cleanup)
- [ ] **Content ownership enforcement** — EDITOR-level permissions (`edit_own`) need `createdBy` checks in API routes to enforce "own content only"

---

## Verification Checklist

### Authentication Pages (Playwright-verified 2026-03-09)

- [x] **Sign-up page** loads at `/cms/signup` with all fields (First Name, Last Name, Email, Password, Confirm Password, Google button)
- [x] **Sign-up validation** — empty fields prevented by HTML5 required, weak password shows error, mismatched passwords show error
- [x] **Sign-up submission** — valid data shows "Check Your Email" success message
- [x] **Login page** has "Forgot password?" link and "Don't have an account? Sign up" link
- [x] **Forgot password page** loads, accepts email, shows "If an account exists..." message
- [x] **Reset password page** (no token) shows "Invalid Link" with "Request New Link" button
- [x] **Accept invite page** (no token) shows "Invalid Invitation" message
- [x] **No-access page** shows clear messaging about admin needing to invite the user
- [x] **Login with credentials** — `info@lclab.io` / `admin123` works, redirects to dashboard
- [x] **Verify-email page** — client page exists for verification flow landing

### User Management CMS (Playwright-verified 2026-03-09)

- [x] **Users page** loads at `/cms/people/users` with data table (Name, Role, Status, Linked Member, Joined columns)
- [x] **Invite User button** opens dialog with Email and Role fields
- [x] **Sidebar** shows "Users" under People group (visible to OWNER/ADMIN, hidden from EDITOR/VIEWER)
- [x] **Role filtering** — sidebar items have `minRole` property, correctly filtered by role level

### API Routes (Code-reviewed 2026-03-09)

- [x] `POST /api/v1/auth/signup` — Rate limited (5/15min), validates input (name length, email format, password 8-128 chars with complexity), honeypot check, timing-normalization for existing emails, cleans up user on email send failure
- [x] `GET /api/v1/auth/verify-email` — Rate limited (10/hr), validates token + nonce, idempotent (already-verified returns success), try/catch around DB ops
- [x] `POST /api/v1/auth/forgot-password` — Rate limited (3/hr per IP+email), nonce in token, truncated email key to prevent memory bloat, never reveals email existence
- [x] `POST /api/v1/auth/reset-password` — Rate limited (5/hr), validates token + nonce (prevents replay after password change), max password length (128)
- [x] `POST /api/v1/auth/accept-invite` — Rate limited (5/hr), validates ChurchMember still exists (revoked invites rejected), checks if already accepted, max password/name length
- [x] `GET /api/v1/users` — ADMIN+ auth, lists church users with linked Person info
- [x] `POST /api/v1/users/invite` — ADMIN+ auth, enforces role hierarchy, only forwards known error messages
- [x] `PATCH /api/v1/users/[id]` — ADMIN+ auth, enforces promote/demote rules, protects last OWNER, blocks self-modification
- [x] `DELETE /api/v1/users/[id]` — OWNER auth, protects last OWNER, blocks self-removal

### Security (Code-reviewed 2026-03-09)

- [x] **Token replay prevention** — Nonce derived from `passwordHash + emailVerified` embedded in tokens; changes when state changes, invalidating old tokens
- [x] **Password hashing** — bcryptjs cost 12, max length 128 enforced before hashing (prevents bcrypt CPU DoS)
- [x] **Email verification gates login** — Credentials provider checks `emailVerified` before allowing sign-in
- [x] **Google OAuth race condition** — User creation wrapped in try/catch handling P2002 unique constraint
- [x] **Rate limiting** — All auth endpoints rate-limited; Map has 10k max size with emergency cleanup
- [x] **Signup orphan prevention** — If email send fails, created user is deleted
- [x] **Timing side-channel mitigation** — Dummy bcrypt hash on existing-email signup path
- [x] **Email template XSS prevention** — All dynamic values HTML-escaped
- [x] **Error message sanitization** — Invite endpoint only forwards allowlisted error messages
- [x] **Input length limits** — Names (100), email (254), password (128) all capped

### Edge Config (Code-reviewed 2026-03-09)

- [x] **Public CMS pages allowed** — `/cms/login`, `/cms/signup`, `/cms/no-access`, `/cms/verify-email`, `/cms/forgot-password`, `/cms/reset-password`, `/cms/accept-invite`
- [x] **Public API routes allowed** — `/api/v1/bible`, `/api/v1/auth/*`
- [x] **All other CMS/API routes require JWT**

### Environment Variables (Verified 2026-03-09)

- [x] **`.env`** updated with `SENDGRID_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`
- [x] **`.env.example`** updated with documentation for all new variables
- [x] **Google OAuth** — `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env.example` with setup instructions; will work once real values are provided

---

## Architecture Overview

This document covers three interconnected workstreams:
1. **Sign-Up & Authentication** — Enable new account creation, Google SSO, email verification
2. **Security & Bot Prevention** — Secure credential storage, rate limiting, anti-bot measures
3. **User Management CMS** — Admin UI for managing users, roles, permissions

---

## 1. Sign-Up & Authentication Flow

### 1.1 Sign-Up Page (`/cms/signup`) [IMPLEMENTED]

**Fields:** First Name, Last Name, Email, Password (8-128 chars, uppercase+lowercase+number), Confirm Password, Google SSO button.

**Flow:**
1. User fills form → `POST /api/v1/auth/signup`
2. Server validates input, checks email uniqueness
3. Creates `User` record with hashed password, `emailVerified: false`
4. Sends verification email via SendGrid with a signed token (JWT, 24h expiry, nonce for replay prevention)
5. Returns success → shows "Check your email" message
6. If email already exists and unverified → resends verification email
7. If email already exists and verified → returns generic message (no enumeration)
8. If email send fails → deletes created user, returns error
9. User clicks verification link → `GET /api/v1/auth/verify-email?token=...`
10. Server validates token + nonce, sets `emailVerified: true`
11. Redirect to login page with success message

**Important:** Creating a User does NOT create a ChurchMember. The user cannot access any CMS content until an OWNER/ADMIN invites them to a church.

### 1.2 Google SSO Sign-Up [IMPLEMENTED]

Works out of the box — when a new Google user signs in, a User + Account record is created (`emailVerified: true`). They still need a ChurchMember to access CMS → redirected to `/cms/no-access` with clear messaging.

Race condition handled: if two simultaneous Google sign-ins for same new user, P2002 unique constraint is caught and the existing user is re-fetched.

### 1.3 Password Reset Flow [IMPLEMENTED]

1. User clicks "Forgot password?" on login page → `/cms/forgot-password`
2. Enters email → `POST /api/v1/auth/forgot-password`
3. Server generates signed token (JWT, 1h expiry, nonce tied to current password hash)
4. User clicks link → `/cms/reset-password?token=...`
5. Enters new password → `POST /api/v1/auth/reset-password`
6. Server validates token + nonce (if password already changed, token is invalid)
7. Updates `passwordHash`, redirect to login with success

### 1.4 Invitation Flow [IMPLEMENTED]

1. Admin invites user via `/cms/people/users` → Invite dialog
2. `POST /api/v1/users/invite` creates User (no password) + ChurchMember
3. Sends invitation email with link to `/cms/accept-invite?token=...`
4. New user sets name + password → `POST /api/v1/auth/accept-invite`
5. Server validates token, verifies ChurchMember still exists (revoked invites rejected), checks not already accepted
6. Updates user with name, password hash, `emailVerified: true`

### 1.5 Token Design [IMPLEMENTED]

**Format:** JWT signed with `AUTH_SECRET`, purpose-scoped, with replay-prevention nonce.

```json
{
  "sub": "<userId>",
  "purpose": "email-verification" | "password-reset" | "invitation",
  "email": "<email>",
  "nonce": "<sha256(passwordHash:emailVerified)[:16]>",
  "iat": "<timestamp>",
  "exp": "<timestamp>"
}
```

**Replay prevention:** The nonce is derived from the user's current `passwordHash` + `emailVerified` state. When either changes (password reset, email verified), the nonce changes, invalidating all previously issued tokens for that purpose.

---

## 2. Security Architecture

### 2.1 Password Storage [VERIFIED SECURE]

- **bcryptjs** with cost factor 12 (industry standard)
- Max password length enforced at 128 chars (prevents bcrypt CPU DoS via oversized input)
- Passwords never stored in plaintext
- `bcrypt.compare()` for timing-safe verification

### 2.2 Session Security [IMPLEMENTED]

- [x] JWT signed with AUTH_SECRET
- [x] httpOnly cookies (Auth.js default)
- [x] Unverified emails blocked from credentials login
- [x] `secure: true` cookie in production
- [x] `sameSite: 'lax'` cookie config
- [x] 7-day maxAge on session cookie

### 2.3 Rate Limiting [IMPLEMENTED]

In-memory sliding window rate limiter with 10k max map size and emergency cleanup.

| Endpoint | Limit | Window | Key |
|---|---|---|---|
| `POST /api/v1/auth/signup` | 5 req | 15 min | IP |
| `GET /api/v1/auth/verify-email` | 10 req | 1 hour | IP |
| `POST /api/v1/auth/forgot-password` | 3 req | 1 hour | IP + email[:64] |
| `POST /api/v1/auth/reset-password` | 5 req | 1 hour | IP |
| `POST /api/v1/auth/accept-invite` | 5 req | 1 hour | IP |
| `POST /api/auth/callback/credentials` | 5 req | 15 min | email |

**Known limitation:** In-memory rate limiter is per-process. Will not work on Vercel/serverless. Swap to Upstash `@upstash/ratelimit` before deploying to multi-instance.

**Migration path:** Install `@upstash/ratelimit` and `@upstash/redis`. Replace the `rateLimit()` function body with:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create limiters per endpoint (same limits as current implementation)
const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(maxAttempts, windowMs + "ms"),
});
```
The function signature and return behavior should remain the same — only the storage backend changes.

### 2.4 Input Validation [IMPLEMENTED]

Manual validation (not Zod) enforcing:
- Email: format regex, max 254 chars, trimmed + lowercased
- Password: min 8, max 128, requires uppercase + lowercase + digit
- Names: max 100 chars, trimmed
- Honeypot: hidden `website` field (server-side check; frontend includes value in JSON body)

### 2.5 CSRF Protection [VERIFIED]

Auth.js v5 built-in double-submit cookie pattern. No additional work needed.

---

## 3. Bot Prevention Strategy [TIER 1 IMPLEMENTED]

**Tier 1 (implemented):** Email verification, rate limiting, password strength, honeypot (partial)
**Tier 2 (planned):** Google reCAPTCHA v3 — invisible challenge. Add `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` to `.env`. Integration: load reCAPTCHA script on signup/forgot-password pages, call `grecaptcha.execute()` on form submit, send token to API, verify via Google's `siteverify` endpoint (score threshold 0.5). Free for up to 1M assessments/month.
**Tier 3 (if needed):** reCAPTCHA v2 checkbox fallback (if v3 scores are unreliable), account lockout

---

## 4. Role & Permission System [IMPLEMENTED — CUSTOM ROLES]

### 4.1 Architecture

The permission system uses **granular permission strings** stored on a `Role` model, with permissions cached in the JWT for zero-query runtime checks.

**Key files:**
- `lib/permissions.ts` — Permission taxonomy (49 permissions), groups, default role definitions, helper functions
- `lib/dal/roles.ts` — Roles CRUD DAL
- `lib/api/require-auth.ts` — `requireApiAuth(permission)` checks permissions from JWT
- `prisma/schema.prisma` — `Role` model with `String[]` permissions column

### 4.2 Role Model

Each church has its own set of roles. Roles have:
- **name/slug** — Display name and URL-safe identifier (unique per church)
- **priority** — Integer for hierarchy (higher = more authority). Used for "who can manage whom"
- **isSystem** — `true` for Owner and Viewer (cannot be deleted)
- **permissions** — Array of permission strings (e.g., `["messages.create", "events.view"]`)

### 4.3 Default Roles

| Role | Priority | System? | Description |
|---|---|---|---|
| Owner | 1000 | Yes | All permissions. Cannot be deleted. |
| Admin | 500 | No | Full content + site management. Editable/deletable. |
| Editor | 200 | No | Create/edit own content. Editable/deletable. |
| Viewer | 0 | Yes | Read-only. Cannot be deleted. |

Churches can create custom roles (e.g., "Ministry Leader", "Content Reviewer") with any combination of permissions and priority 1-999.

### 4.4 Permission Taxonomy (49 permissions)

| Group | Permissions |
|---|---|
| Bible Studies | `messages.view`, `.create`, `.edit_own`, `.edit_all`, `.delete`, `.publish` |
| Events | `events.view`, `.create`, `.edit_own`, `.edit_all`, `.delete`, `.publish` |
| Media | `media.view`, `.upload`, `.edit_own`, `.edit_all`, `.delete`, `.manage_folders` |
| Submissions | `submissions.view`, `.manage` |
| Storage | `storage.view` |
| People | `people.view`, `.create`, `.edit`, `.delete` |
| Groups | `groups.view`, `.manage` |
| Ministries | `ministries.view`, `.manage` |
| Campuses | `campuses.view`, `.manage` |
| Website Pages | `website.pages.view`, `.edit`, `.create`, `.delete` |
| Navigation | `website.navigation.view`, `.edit` |
| Theme | `website.theme.view`, `.edit` |
| Site Settings | `website.settings.view`, `.edit` |
| Domains | `website.domains.view`, `.manage` |
| Users | `users.view`, `.invite`, `.edit_roles`, `.remove`, `.deactivate` |
| Roles | `roles.view`, `.manage` |
| Church Profile | `church.profile.view`, `.edit` |

### 4.5 Hierarchy Rules

- **Priority-based**: A user can only create/edit/assign roles with priority lower than their own
- **Permission escalation prevention**: Cannot assign permissions you don't have yourself (except Owner who has all)
- **System role protection**: Owner and Viewer roles cannot be deleted; Owner permissions cannot be modified
- **Self-modification prevention**: Cannot change your own role or remove yourself

### 4.6 Auth Flow

1. User logs in → JWT callback fetches `ChurchMember` with `customRole` relation
2. Role's `permissions[]`, `priority`, and `name` are stored in the JWT
3. `requireApiAuth('permission.string')` checks the JWT's permissions array — no DB query needed
4. Sidebar and RoleGuard use `session.permissions` for visibility/access control
5. If role is updated, user must re-login for changes to take effect

### 4.7 API Routes

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/api/v1/roles` | `roles.view` | List church roles with member counts |
| POST | `/api/v1/roles` | `roles.manage` | Create custom role |
| GET | `/api/v1/roles/[id]` | `roles.view` | Get role details |
| PATCH | `/api/v1/roles/[id]` | `roles.manage` | Update role |
| DELETE | `/api/v1/roles/[id]` | `roles.manage` | Delete role (with fallback reassignment) |
| GET | `/api/v1/permissions` | `roles.view` | Get permission taxonomy for UI |

### 4.8 Sidebar Permission-Based Visibility [IMPLEMENTED]

Nav items use `requiredPermission` instead of `minRole`:
- Users → `users.view`
- Roles → `roles.view`
- Builder → `website.pages.edit`
- Domains → `website.domains.manage`
- Settings → `website.settings.edit`

### 4.9 Migration Path (from enum to custom roles)

**Phase 1 (done):** Added `Role` model + `roleId` column (nullable) alongside existing `role` enum.
**Phase 2 (done):** Data migration — created default roles for all churches, assigned `roleId` to all members.
**Phase 3 (pending):** Drop `role` enum column after confirming all code uses permissions.

---

## 5. Person ↔ User Linking [IMPLEMENTED]

### 5.1 Design [DOCUMENTED]

- `Person.userId` field exists (optional)
- DAL functions `linkUserToPerson()` and `unlinkUserFromPerson()` exist
- Users page shows `linkedPersonName` column
- [x] **Auto-link on invite** — inviteUser() matches Person by email and links automatically
- [x] **API route for manual link/unlink** — POST/DELETE /api/v1/users/[id]/link-person
- [x] **UI buttons for link/unlink** — user row actions dropdown

---

## 6. Environment Variables [IMPLEMENTED]

```env
# New — added to .env and .env.example:
SENDGRID_API_KEY=           # SendGrid API key for transactional emails
EMAIL_FROM=noreply@laubf.org # From address (must be verified in SendGrid)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=  # Google reCAPTCHA v3 (optional, Tier 2)
RECAPTCHA_SECRET_KEY=            # Google reCAPTCHA v3 (optional, Tier 2)
UPSTASH_REDIS_REST_URL=          # Upstash Redis (required for serverless rate limiting)
UPSTASH_REDIS_REST_TOKEN=        # Upstash Redis (required for serverless rate limiting)

# Existing — already in .env.example:
AUTH_SECRET=...              # JWT signing secret
AUTH_URL=...                 # OAuth callback URL
AUTH_GOOGLE_ID=...           # Google OAuth Client ID
AUTH_GOOGLE_SECRET=...       # Google OAuth Client Secret
```

---

## 7. File Inventory

### New Files Created

| File | Purpose |
|---|---|
| `lib/rate-limit.ts` | In-memory sliding window rate limiter |
| `lib/auth/tokens.ts` | JWT token creation/verification with replay prevention |
| `lib/email/send-email.ts` | SendGrid integration (fallback to console.log) |
| `lib/email/templates.ts` | HTML email templates (verification, reset, invite) |
| `lib/dal/users.ts` | User management DAL (list, invite, update role, remove, link) |
| `app/api/v1/auth/signup/route.ts` | Sign-up API |
| `app/api/v1/auth/verify-email/route.ts` | Email verification API |
| `app/api/v1/auth/forgot-password/route.ts` | Forgot password API |
| `app/api/v1/auth/reset-password/route.ts` | Reset password API |
| `app/api/v1/auth/accept-invite/route.ts` | Accept invitation API |
| `app/api/v1/users/route.ts` | List church users API |
| `app/api/v1/users/invite/route.ts` | Invite user API |
| `app/api/v1/users/[id]/route.ts` | Update/remove user API |
| `app/cms/signup/page.tsx` | Sign-up page |
| `app/cms/verify-email/page.tsx` | Email verification page |
| `app/cms/forgot-password/page.tsx` | Forgot password page |
| `app/cms/reset-password/page.tsx` | Reset password page |
| `app/cms/accept-invite/page.tsx` | Accept invitation page |
| `app/cms/(dashboard)/people/users/page.tsx` | CMS Users management page |
| `components/cms/users/users-columns.tsx` | Users table column definitions |
| `components/cms/users/invite-user-dialog.tsx` | Invite user dialog |
| `lib/permissions.ts` | Permission taxonomy, groups, default roles, helper functions |
| `lib/dal/roles.ts` | Roles CRUD DAL |
| `app/api/v1/roles/route.ts` | List/create roles API |
| `app/api/v1/roles/[id]/route.ts` | Get/update/delete role API |
| `app/api/v1/permissions/route.ts` | Permission taxonomy API |
| `prisma/migrate-roles.mts` | Data migration: enum → custom roles |
| `components/cms/roles/role-editor-dialog.tsx` | Role create/edit dialog with permission picker |
| `components/cms/roles/delete-role-dialog.tsx` | Delete role with fallback reassignment |

### Modified Files

| File | Changes |
|---|---|
| `lib/auth/config.ts` | Added `emailVerified` check in credentials, Google OAuth race condition handling, max password length; JWT/session callbacks include permissions from Role |
| `lib/auth/edge-config.ts` | Added public CMS pages and `/api/v1/auth/*` to allowlist |
| `lib/api/require-auth.ts` | Refactored from role-level to permission-based checks |
| `components/cms/app-sidebar.tsx` | Added Users nav item; switched from `minRole` to `requiredPermission` |
| `components/cms/role-guard.tsx` | Switched from role-level to permission-based |
| `app/cms/login/page.tsx` | Added sign-up link, forgot-password link, verified success message |
| `app/cms/no-access/page.tsx` | Improved messaging about admin invitation |
| `.env` | Added SendGrid + reCAPTCHA vars |
| `.env.example` | Added SendGrid + reCAPTCHA documentation |

---

## Audit Log

### 2026-03-09 — Security Audit

30 issues identified (3 CRITICAL, 7 HIGH, 10 MEDIUM, 10 LOW).

**CRITICAL — All Fixed:**
1. Token replay → Added nonce-based replay prevention
2. Signup orphan users → Clean up user if email send fails; allow re-sending for unverified
3. Accept-invite no ChurchMember check → Now verifies membership exists and invite not already accepted

**HIGH — All Fixed:**
4. Rate limiter memory → Added 10k max map size with emergency cleanup
5. No max password length → Added 128-char limit before bcrypt hashing
6. Missing try/catch in signup → Full error handling with P2002 race condition
7. Timing side-channel in signup → Dummy bcrypt hash for existing-email path
8. Google OAuth race condition → P2002 catch with re-fetch
9. Invite exposes internal errors → Allowlisted error messages only

**MEDIUM — Status:**
- emailVerified check on login: **Fixed**
- Verify-email idempotency: **Fixed**
- Name length limits: **Fixed** (100 chars)
- Email template XSS: **Fixed** (HTML escaping)
- Rate limit key sanitization: **Fixed** (email truncated to 64 chars)
- Missing Zod validation: **Deferred** (manual validation is functional)
- Missing deactivation endpoints: **Fixed** (soft-delete with ChurchMember.status field)
- Person-User auto-link: **Fixed** (inviteUser matches Person by email)
- Link/Unlink API: **Fixed** (POST/DELETE /api/v1/users/[id]/link-person)
- JWT callback missing churchId refresh: **Noted** (edge case, user re-login resolves)

**LOW — Status:**
- Honeypot not in JSON body: **Fixed** (frontend now includes `website` value in JSON body)
- lastLogin approximated: **Known** (needs dedicated DB field)
- Status filter missing: **Fixed** (Active/Inactive/Pending filter on Users page)
- Invite dialog OWNER option: **By design** (excluded to prevent accidental OWNER creation)
- Role dropdown shown to all: **Fixed** (disabled for users the actor can't modify)

### 2026-03-10 — Implementation Audit

Cross-checked plan against codebase. Findings:
- Honeypot field was already wired (doc was outdated)
- Login rate limiting added (credentials authorize callback)
- Session cookie hardening added (secure, sameSite, httpOnly, 7d maxAge)
- Role dropdown UX still missing (server enforces, UI doesn't reflect)
- Link/Unlink API + UI still missing (DAL exists)
- Deactivation/reactivation design decision pending (hard-delete vs soft-delete)
- Users nav moved to own top-level "Admin" sidebar group

### 2026-03-10 — Full Implementation Sprint

Implemented all P1 items from audit:
- Soft-delete: ChurchMember.status field (ACTIVE/INACTIVE/PENDING), deactivate/reactivate API endpoints + UI
- Person-User auto-link on invite (match by email)
- Link/Unlink API route (POST/DELETE /api/v1/users/[id]/link-person)
- Link/Unlink UI buttons in user row actions
- Role dropdown disabled for users the actor can't modify
- Status filter added to Users page (Active/Inactive/Pending)
- Bot prevention plan updated: Cloudflare Turnstile → Google reCAPTCHA v3
- Rate limiter migration path documented (in-memory → Upstash Redis)

Remaining: Upstash Redis migration, reCAPTCHA integration, lastLogin field, Zod validation

### 2026-03-10 — Custom Roles & Permissions System

Replaced hardcoded 4-role enum with custom roles & granular permissions:
- Created `Role` model with 49 granular permission strings across 17 groups
- 4 default roles (Owner, Admin, Editor, Viewer) seeded per church
- `requireApiAuth()` refactored from role names to permission strings
- All ~30 API routes migrated to permission-based auth
- Roles CRUD API (GET/POST/PATCH/DELETE /api/v1/roles)
- Permissions metadata API (GET /api/v1/permissions)
- Roles management UI with permission picker
- Sidebar and RoleGuard use `session.permissions` instead of role levels
- JWT includes permissions array for zero-query runtime checks
- Data migration script for existing churches (prisma/migrate-roles.mts)
