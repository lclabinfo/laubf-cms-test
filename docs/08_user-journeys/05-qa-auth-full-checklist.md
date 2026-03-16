# Auth & Security — Full QA Test Checklist

> Generated 2026-03-13 after merging `feature/auth-flow-improvements` into main.

---

## Part 1: Tests Specific to Auth-Flow-Improvements Merge

### Accept Invite — Password Mode
- [ ] Click invite link → see church name + your email pre-filled
- [ ] Choose "Set up with password" → fill name + password → submit
- [ ] Verify membership activates (can sign in immediately)
- [ ] Verify whitespace-only names are rejected (e.g. `"   "`)
- [ ] Verify password complexity enforced (8+ chars, upper + lower + number)
- [ ] Re-click same invite link → should show "Already accepted, please sign in"
- [ ] Click invite link for revoked membership → should show "invitation revoked"
- [ ] Click expired invite (7d+) → should show "invalid or expired"

### Accept Invite — Google Mode
- [ ] Click invite link → choose "Continue with Google"
- [ ] Sign in with matching Google email → membership activates
- [ ] Sign in with **different** Google email → should get session mismatch error (401)
- [ ] After activation, redirect works to dashboard (not stuck on invite page)
- [ ] React StrictMode double-fire doesn't cause duplicate activation calls

### Password Change (Settings → Security)
- [ ] Existing password user: change password with correct current password → success
- [ ] Existing password user: wrong current password → error
- [ ] Google-only user: set password (no "current password" field shown) → success
- [ ] After password change, **open a second browser/incognito** → existing session should be invalidated (sessionVersion bump)
- [ ] Rate limit: 6th attempt within 1 hour → 429 Too Many Attempts

### Connect Google Button (Removed)
- [ ] Settings → Security → Google section shows "Coming soon" badge (not a Connect button)
- [ ] No way to trigger the session-swap vulnerability

---

## Part 2: All Auth & Security Journeys

### Credentials Sign-In
- [ ] Valid email + password → dashboard
- [ ] Wrong password → error, no email existence leak
- [ ] Unverified email → "Please verify your email" error
- [ ] Non-existent email → same generic error as wrong password
- [ ] 6th failed attempt (same email, 15min) → rate limited
- [ ] PENDING member → redirected to `/cms/onboarding`
- [ ] INACTIVE member → redirected to `/cms/no-access`
- [ ] ACTIVE member → `/cms/dashboard`

### Google OAuth Sign-In
- [ ] New Google user (no account) → User created, no ChurchMember → `/cms/no-access`
- [ ] Existing Google user with ACTIVE membership → dashboard
- [ ] Existing Google user with PENDING membership → onboarding

### Sign Up (Self-Registration)
- [ ] Fill form → verification email sent → toast shown
- [ ] Duplicate email → no error leaked (timing-safe dummy hash)
- [ ] Honeypot field filled → silent rejection
- [ ] Click verification link (30min expiry) → email verified → redirect to login
- [ ] Expired verification link → error message
- [ ] Re-click used verification link (nonce changed) → invalid token

### Forgot / Reset Password
- [ ] Submit email → always shows "check your email" (no email existence leak)
- [ ] Click reset link (1hr expiry) → set new password → success
- [ ] Expired reset link → error
- [ ] Re-click used reset link (password already changed, nonce invalidated) → invalid token
- [ ] Rate limit: 4th forgot-password request in 1hr → 429

### Onboarding Flow
- [ ] PENDING member signs in → redirected to `/cms/onboarding`
- [ ] Fill name (pre-filled for Google users) + optional phone → complete
- [ ] After completion, ChurchMember status = ACTIVE
- [ ] Refresh page → should go to dashboard (not onboarding again)
- [ ] Direct URL to `/cms/onboarding` as ACTIVE member → should redirect to dashboard

### Access Request Flow
- [ ] User with no church membership → `/cms/no-access` → submit request
- [ ] Shows request status (PENDING/APPROVED/DENIED/IGNORED)
- [ ] Admin approves → user gets VIEWER role + PENDING status → next login goes to onboarding
- [ ] Admin denies → user sees "denied" status
- [ ] Admin ignores → user sees "ignored", cannot resubmit
- [ ] Admin restores ignored request → back to PENDING
- [ ] Revoked detection: membership deleted after approval → user sees "revoked" status

### Invitation Flow (Admin Side)
- [ ] Admin invites user@example.com as EDITOR → email sent
- [ ] Can't invite with role >= your own (unless OWNER)
- [ ] Invited user appears in users list as PENDING

### Role Management
- [ ] View roles list (system + custom)
- [ ] Create custom role with specific permissions
- [ ] Can't grant permissions you don't have (unless OWNER)
- [ ] Change user's role → sessionVersion bumped → their JWT refreshes
- [ ] Can't demote/remove the last OWNER
- [ ] Can't remove yourself

### User Deactivation
- [ ] Deactivate user → they see `/cms/no-access` on next request
- [ ] Reactivate user → they can access dashboard again
- [ ] Can't deactivate the last OWNER

### Session Invalidation
- [ ] Admin triggers "invalidate all sessions" → all users' JWTs refresh on next request
- [ ] Password change bumps sessionVersion → all sessions refresh
- [ ] Role change bumps sessionVersion → affected user gets new permissions

### Profile Settings
- [ ] Update first/last name → changes reflected immediately in sidebar
- [ ] Email field is read-only

---

## Reference: Rate Limits

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| `POST /api/v1/auth/signup` | 5 | 15 min | IP |
| `GET /api/v1/auth/verify-email` | 10 | 1 hr | IP |
| `POST /api/v1/auth/forgot-password` | 3 | 1 hr | IP + email |
| `POST /api/v1/auth/reset-password` | 5 | 1 hr | IP |
| `GET /api/v1/auth/accept-invite` | 10 | 1 hr | IP |
| `POST /api/v1/auth/accept-invite` | 5 | 1 hr | IP |
| `POST /api/v1/auth/complete-onboarding` | 10 | 1 hr | userId |
| `POST /api/v1/access-requests` | 3 | 1 hr | userId |
| Credentials login | 5 | 15 min | email |
| `PATCH /api/v1/account/password` | 5 | 1 hr | userId |

## Reference: Token Expiry

| Token Type | Expiry | Replay Prevention |
|------------|--------|-------------------|
| Email verification | 30 min | Nonce from `passwordHash + emailVerified` |
| Password reset | 1 hr | Nonce from `passwordHash + emailVerified` |
| Invitation | 7 days | Membership status check (PENDING guard) |
| Session JWT | 7 days | `sessionVersion` comparison on refresh |

## Known Limitations

- **In-memory rate limiter** — per-process only, needs Upstash Redis for serverless (Vercel)
- **Google Connect** — removed due to session-swap vulnerability (see `google-connect-vulnerability.md`)
- **`edit_own` permissions** — not yet enforced (needs `createdBy` checks in API routes)
- **Legacy `role` enum** — still on ChurchMember, being phased out for `roleId`
