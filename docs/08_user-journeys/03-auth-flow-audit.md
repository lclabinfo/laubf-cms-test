# Authentication Flow Audit & Edge Case Analysis

> Generated 2026-03-12. Covers current implementation state after session-staleness fixes.

---

## 1. Authentication Methods

### A. Google OAuth Login/Signup (SSO)

```
User clicks "Sign in with Google"
  → Google OAuth consent screen
  → Callback to /api/auth/callback/google
  → signIn callback runs:
      1. If email NOT in User table → CREATE User (name from Google profile,
         emailVerified=true, no password) + CREATE Account (provider=google)
      2. If email EXISTS but no Google Account linked → CREATE Account record only
      3. If email EXISTS and Google Account linked → no-op
  → jwt callback runs:
      - Loads ChurchMember for this userId
      - If found: populates churchId, role, permissions, memberStatus
      - If not found: session has NO churchId → dashboard redirects to /cms/no-access
  → User lands on /cms/dashboard (or /cms/onboarding if PENDING, /cms/no-access if no membership)
```

**Key behavior:** Google users NEVER set a password. They always authenticate via Google. Their `passwordHash` is null. `emailVerified` is set to `true` automatically.

### B. Credentials Signup (Email + Password)

```
User fills signup form → POST /api/v1/auth/signup
  1. Validate: firstName, lastName, email, password (8+ chars, upper+lower+number)
  2. If email exists AND unverified → resend verification email, return "Check email"
  3. If email exists AND verified → return "Check email" (doesn't leak existence)
  4. CREATE User (passwordHash=bcrypt, emailVerified=false)
  5. Send verification email with JWT token (24h expiry)
  6. Return "Check your email"

User clicks verification link → GET /api/v1/auth/verify-email?token=...
  1. Verify JWT token (purpose=email-verification)
  2. Validate nonce (prevents replay after password change)
  3. Set User.emailVerified = true
  4. Redirect to /cms/login?verified=true

User logs in → Credentials provider
  1. Rate limit: 5 attempts per email per 15 min
  2. Find User by email
  3. Block if !passwordHash or !emailVerified
  4. bcrypt.compare password
  5. Return user object → JWT/session flow same as Google
```

**Key behavior:** Signup does NOT create a ChurchMember. The user has a verified account but NO church access. They need to be invited by an admin, or the system needs a self-join mechanism.

### C. Invitation Flow

```
Admin invites user@example.com → POST /api/v1/users/invite
  1. Check email not already a member
  2. Find or CREATE placeholder User (empty name, no password, emailVerified=false)
  3. CREATE ChurchMember (status=PENDING, role assigned by admin)
  4. Auto-link to Person record by email (best-effort)
  5. Send invitation email with JWT token (7d expiry)

Invitee clicks link → /cms/accept-invite?token=...
  1. Frontend: shows form for firstName, lastName, password
  2. POST /api/v1/auth/accept-invite
     - Verify token (purpose=invitation)
     - Check ChurchMember still exists (not revoked)
     - Update User: firstName, lastName, passwordHash, emailVerified=true
     - Update ChurchMember: status=ACTIVE
  3. Redirect to /cms/login
```

---

## 2. Session Architecture

- **Strategy:** JWT (not database sessions)
- **Token lifetime:** 7 days
- **Storage:** httpOnly cookie (`authjs.session-token`)
- **Refresh:**
  - PENDING members: re-checked on every request (lightweight query)
  - sessionVersion bump: triggers immediate full refresh
  - Periodic: full refresh every 5 minutes
  - If membership deleted during refresh: clears all church context from JWT
- **Session callback:** Refreshes user name/avatar from DB on every session read; if User deleted from DB, clears session

---

## 3. Edge Cases & Issues

### CRITICAL — Self-signup users have no church access

| Scenario | Current Behavior | Problem |
|----------|-----------------|---------|
| User signs up via email | User created, no ChurchMember | User verifies email, logs in, redirected to `/cms/no-access` forever |
| User signs up via Google | User created, no ChurchMember | Same — redirected to `/cms/no-access` |

**Impact:** A user who self-signs up cannot do anything until an admin invites them (which creates a ChurchMember). But the admin would need to know they signed up. There's no pending-approval queue.

### CRITICAL — Google signup + existing credentials account collision

| Scenario | Current Behavior | Problem |
|----------|-----------------|---------|
| User signs up with email (credentials) | User created with passwordHash | Works |
| Same user later clicks "Sign in with Google" | signIn callback finds existing User, links Google Account | **Works correctly** — merges accounts |
| User signs up with Google first | User created, no passwordHash | Works |
| Same user later tries credentials signup | Signup API finds existing user, checks `emailVerified` | **If verified (Google sets this), returns "Check email" — confusing because no verification email is needed** |
| Same user tries credentials login | Credentials provider checks `passwordHash` — it's null | **Returns null (silent failure) — user sees "Invalid email or password"** |

**Impact:** A Google-first user who tries to log in with credentials gets a confusing "invalid password" error. There's no way for them to set a password on their Google-created account.

### HIGH — Stale session after membership revocation

| Scenario | Current Behavior (after fix) | |
|----------|------------------------------|---|
| Admin revokes user's access | ChurchMember deleted | JWT refresh (within 5 min) clears churchId → user redirected to `/cms/no-access` |
| Admin deactivates user | ChurchMember.status = INACTIVE | JWT refresh updates memberStatus → dashboard redirects to `/cms/no-access` |
| Admin changes user's role | ChurchMember.role updated | JWT refresh picks up new role + permissions |
| Admin bumps sessionVersion | Immediate refresh triggered | All active sessions refresh on next request |

### MEDIUM — Duplicate User records

| Scenario | Current Behavior | Risk |
|----------|-----------------|------|
| Race condition on Google signup | Caught by P2002 unique constraint handler | Low — handled correctly |
| Same email invited twice | `inviteUser` checks for existing ChurchMember | Low — returns error |
| User created by invite + separate credentials signup | Both check `User.findUnique(email)` | **No duplicate — `email` is unique. But invite creates placeholder User, and signup finds it and tries to resend verification.** |

### MEDIUM — Password reset for Google-only users

| Scenario | Current Behavior | Problem |
|----------|-----------------|---------|
| Google-only user requests password reset | `forgot-password` always returns success | Token is created, email sent |
| User clicks reset link | Sets new passwordHash on User | **Now they have BOTH Google and credentials auth** — this is actually fine |

### LOW — Onboarding for self-signup users

| Scenario | Current Behavior | Problem |
|----------|-----------------|---------|
| Self-signup user (no invite) logs in | No ChurchMember exists → no churchId | Redirected to `/cms/no-access`, never sees onboarding |
| Invited user via Google (PENDING) | ChurchMember exists with PENDING | Redirected to onboarding → completes → ACTIVE |
| Invited user via credentials (PENDING) | accept-invite sets ACTIVE directly | Never sees onboarding (status already ACTIVE) |

**Note:** Onboarding only triggers for `memberStatus === 'PENDING'`, which only happens for invite-created memberships where the user logged in via Google (not through accept-invite flow).

---

## 4. Proposed Fixes

### P0: Handle Google-first user attempting credentials login

**Problem:** User signs up with Google, later tries credentials login, sees "Invalid email or password" because no passwordHash exists.

**Proposed fix — Option A (Recommended):** Detect in the credentials authorize function and return a specific error:

```ts
// In credentials authorize:
if (user && !user.passwordHash) {
  // User exists but has no password (Google-only account)
  throw new GoogleOnlyAccountError()
}
```

Frontend shows: "This account uses Google Sign-In. Please use the Google button to log in."

**Proposed fix — Option B:** On the signup page, when user enters an email that already exists (verified), detect it client-side and show: "An account with this email already exists. [Sign in instead](/cms/login)". However, this leaks email existence — acceptable for a church CMS but not ideal.

**Recommendation:** Option A. Simple, secure, clear UX.

### P0: Handle credentials-first user attempting Google login on signup page

**Problem:** User already has a credentials account, clicks "Sign up with Google" on the signup page. The signIn callback links the Google Account to the existing User. This actually works correctly — but the user might be confused because they expected to create a new account.

**Current behavior is fine.** The Google button label says "Sign up with Google" on signup and "Sign in with Google" on login, which could confuse users, but the underlying behavior correctly merges.

### P1: Self-signup users need a path to church access

**Options:**

**A. Auto-join single-tenant (Recommended for MVP):** Since this is a single-tenant app with `CHURCH_SLUG` env var, auto-create a ChurchMember with PENDING status when a new user signs up:

```ts
// In signup API, after creating User:
const church = await prisma.church.findFirst({ where: { slug: process.env.CHURCH_SLUG } })
if (church) {
  await prisma.churchMember.create({
    data: { churchId: church.id, userId: user.id, role: 'VIEWER', status: 'PENDING' }
  })
}
```

This sends them to onboarding after login, and an admin can see PENDING members and activate/promote them.

**B. Approval queue:** Same as A, but add a "Pending Members" section to the Users page where admins can approve/reject.

**C. Invite-only (current):** Keep current behavior. Self-signup creates an account but no church access. Only admin invites grant access. The `/cms/no-access` page should explain: "You need to be invited by an administrator."

**Recommendation:** Option A for MVP — auto-join as PENDING VIEWER.

### P1: Improve `/cms/no-access` page

Currently this page exists but may not explain why the user has no access. Add:
- "You don't have access to this church's CMS."
- "If you were invited, check your email for an invitation link."
- "Contact your church administrator for access."
- Sign-out button

### P2: Add "Set password" flow for Google-only users

Allow Google-only users to optionally set a password from Settings, so they can also log in with credentials. This is a nice-to-have — most SaaS products don't require it.

---

## 5. Current Flow Summary Diagram

```
                    ┌─────────────┐
                    │   Visitor    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
        Google OAuth              Credentials Signup
              │                         │
              ▼                         ▼
        User created              User created
        (verified=true)           (verified=false)
        (no password)             (has password)
              │                         │
              │                    Email verify
              │                         │
              ▼                         ▼
        ┌──────────────────────────────────┐
        │        Has ChurchMember?         │
        └───────┬──────────────┬───────────┘
                │              │
            No  │          Yes │
                ▼              ▼
         /cms/no-access   ┌─────────────────┐
                          │ memberStatus?    │
                          └──┬────┬────┬────┘
                    PENDING  │    │    │ INACTIVE
                             │    │    │
                             ▼    │    ▼
                       Onboarding │  /cms/no-access
                             │    │
                             │    │ ACTIVE
                             ▼    ▼
                         /cms/dashboard
```

---

## 6. What's NOT Covered (Future Phases)

- Multi-tenant: user belongs to multiple churches (ChurchMember per church)
- Email change flow
- Two-factor authentication (fields exist in schema but not implemented)
- Account deletion (GDPR)
- Session listing / "sign out all devices"
- OAuth providers beyond Google (Apple, Microsoft)
- Magic link / passwordless login
