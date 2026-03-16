# Authentication Edge Cases & User Journey Map

**Last updated:** 2026-03-16
**Status:** Living document — update as new flows are added or edge cases are discovered

---

## Identity Model

**Core principle: Email is the identity anchor.** A user account is defined by its email address. All authentication methods (credentials, Google OAuth) must resolve to the same email. Cross-email account linking is not supported.

**Auth methods per account:**
- Credentials only (email + password)
- Google only (Google OAuth)
- Both (credentials + Google linked to same email)

---

## 1. Signup Flows

### 1.1 Native Signup (New User)
```
User → /cms/signup → enters name, email, password
  → POST /api/v1/auth/signup
    → email not in DB → create User (emailVerified=false) → send verification email
    → user clicks email link → emailVerified=true
    → user signs in with credentials
```
**Result:** Native-only account created. No church membership yet (unless invited).

### 1.2 Google Signup (New User)
```
User → /cms/signup → clicks "Sign up with Google"
  → Google OAuth → signIn callback
    → email not in DB → create User + Account (emailVerified=true)
    → redirect to /cms/dashboard (or /cms/no-access if no church membership)
```
**Result:** Google-only account created. Automatically verified.

### 1.3 Native Signup — Email Already Exists (Native Account)
```
User → /cms/signup → enters email that has native account
  → POST /api/v1/auth/signup
    → existing user found with passwordHash
    → return error: EMAIL_EXISTS
    → UI shows: "Account already exists" + Sign in / Forgot password links
```
**Result:** Blocked. User directed to sign in.

### 1.4 Native Signup — Email Already Exists (Google-Only Account)
```
User → /cms/signup → enters email that has Google-only account
  → POST /api/v1/auth/signup
    → existing user found with Google account, no passwordHash
    → return error: GOOGLE_ACCOUNT
    → UI shows: "This email is linked to a Google account" + Google sign-in button
```
**Result:** Blocked. User directed to use Google.

### 1.5 Native Signup — Unverified Account Exists
```
User → /cms/signup → enters email for unverified native account
  → POST /api/v1/auth/signup
    → existing unverified user found
    → generate new verification nonce, resend verification email
    → return error: UNVERIFIED
    → UI shows: "Pending account exists, verification email resent"
```
**Result:** Blocked. Verification email resent.

---

## 2. Login Flows

### 2.1 Credentials Login — Valid
```
User → /cms/login → enters email + password
  → signIn("credentials") → authorize()
    → user found, password matches, emailVerified=true
    → JWT issued with church membership + permissions
```
**Result:** Signed in.

### 2.2 Credentials Login — Wrong Password
```
User → /cms/login → enters email + wrong password
  → authorize() → bcrypt.compare fails → return null
  → UI shows: "Invalid email or password"
```
**Result:** Blocked. Generic error (no enumeration).

### 2.3 Credentials Login — User Has Google-Only Account
```
User → /cms/login → enters email (Google-only, no passwordHash)
  → authorize() → user.passwordHash is null → return null
  → UI shows: "Invalid email or password"
  → useEffect calls POST /api/v1/auth/check-auth-method
  → API returns { method: 'google' }
  → UI shows: "This account uses Google sign-in" + Google button
```
**Result:** Blocked with helpful guidance to use Google sign-in.

### 2.4 Credentials Login — Unverified Email
```
User → /cms/login → enters email (unverified account)
  → authorize() → !user.emailVerified → return null
  → UI shows: "Invalid email or password"
```
**Result:** Blocked. User must verify email first.

### 2.5 Google Login — Existing Native Account (Same Email)
```
User → /cms/login → clicks "Sign in with Google" → authenticates as same email
  → signIn callback → existingUser found by email
    → no Google Account linked yet → CREATE Account record → link to existing user
    → user.id = existingUser.id
  → JWT issued
```
**Result:** Google auto-linked to existing native account. User can now use either method. **Toast shown after login: "Google sign-in linked to your account."**

### 2.6 Google Login — No Account Exists
```
User → /cms/login → clicks "Sign in with Google" → email not in system
  → signIn callback → no existingUser
    → CREATE new User + Account (emailVerified=true)
    → redirect to /cms/no-access (no church membership)
```
**Result:** New account created via Google. No church access until invited/approved.

### 2.7 Google Login — Different Email Than Native Account
```
User has native account as alice@. Clicks "Sign in with Google" as bob@.
  → signIn callback → looks up bob@ → not found
    → CREATE new User for bob@ (separate from alice@ account)
```
**Result:** Second account created. **This is expected OAuth behavior** — the system has no way to know alice@ and bob@ are the same person. Each email is a separate identity.

---

## 3. Invitation Flows

### 3.1 Invite — Accept via Password
```
Admin → Invite User dialog → enters email + role
  → POST /api/v1/users/invite → create User (placeholder) + ChurchMember (PENDING)
  → send invitation email (7-day token)

User → clicks link → /cms/accept-invite?token=...
  → GET validates token → shows accept UI
  → user clicks "Set up with password" → enters name + password
  → POST /api/v1/auth/accept-invite (mode=password)
    → set passwordHash, emailVerified=true, status=ACTIVE
```
**Result:** Native account activated with church membership.

### 3.2 Invite — Accept via Google (Same Email)
```
User → clicks link → /cms/accept-invite?token=...
  → clicks "Continue with Google" → Google OAuth
  → signIn callback: Google email matches invitation email
    → existingUser found (the placeholder) → link Google Account
    → redirect back to accept-invite?afterGoogle=true
  → POST /api/v1/auth/accept-invite (mode=google)
    → session.user.id matches token.sub → status=ACTIVE
```
**Result:** Google account linked, membership activated.

### 3.3 Invite — Accept via Google (DIFFERENT Email) — BLOCKED
```
User → clicks link → /cms/accept-invite?token=...
  → clicks "Continue with Google" → authenticates as different email
  → signIn callback: invite-email-guard cookie exists
    → Google email does NOT match invited email
    → return false (block sign-in)
  → user sees error, redirected back to accept-invite page
  → UI shows: "Please sign in with {invited email}"
```
**Result:** Blocked with clear guidance. No stale accounts created.

### 3.4 Invite — Resend
```
Admin → Users table → PENDING user → "Resend invite" action
  → POST /api/v1/users/{id}/resend-invite
    → verify status=PENDING → generate new 7-day token → send email
    → update invitedAt timestamp
```
**Result:** New invitation email sent. Previous tokens still valid until they expire.

### 3.5 Invite — Token Expired
```
User → clicks expired invite link (>7 days old)
  → GET /api/v1/auth/accept-invite → token verification fails
  → UI shows: "This invitation has expired. Please ask the admin to resend."
```
**Result:** Blocked. Admin must resend.

---

## 4. Password Reset Flows

### 4.1 Forgot Password — Valid Email (Native Account)
```
User → /cms/forgot-password → enters email
  → POST /api/v1/auth/forgot-password
    → user found with passwordHash → generate 6-digit code
    → SHA-256 hash stored in resetCodeHash, 15-min expiry
    → send code via email
  → UI transitions to OTP input (3+3 digit groups)
  → user enters code → POST /api/v1/auth/verify-reset-code
    → timing-safe comparison → code valid → clear from DB (single-use)
    → return JWT reset token
  → UI transitions to new password form
  → user enters password → POST /api/v1/auth/reset-password
    → verify JWT → bcrypt hash → update passwordHash
```
**Result:** Password reset. All existing sessions invalidated via sessionVersion bump.

### 4.2 Forgot Password — Email Not Found
```
User → /cms/forgot-password → enters email not in system
  → POST /api/v1/auth/forgot-password
    → user not found → return error: NOT_FOUND
    → UI shows: "No account found" + "Create an account" link
```
**Result:** Blocked with guidance.

### 4.3 Forgot Password — Google-Only Account
```
User → /cms/forgot-password → enters email (Google-only)
  → POST /api/v1/auth/forgot-password
    → user found but no passwordHash, has Google
    → return error: GOOGLE_ACCOUNT
    → UI shows: "This email uses Google sign-in" + Google button
```
**Result:** Blocked with guidance to use Google.

### 4.4 Forgot Password — Code Expired
```
User enters code after 15 minutes
  → POST /api/v1/auth/verify-reset-code
    → code expired → clear from DB → return error: CODE_EXPIRED
    → UI shows: "Code expired. Request a new one."
```
**Result:** Blocked. User can request new code.

### 4.5 Forgot Password — Wrong Code
```
User enters incorrect code
  → POST /api/v1/auth/verify-reset-code
    → timing-safe comparison fails → return error: INVALID_CODE
    → rate limited: 10 attempts per 15 min per IP
```
**Result:** Blocked. Rate limiting prevents brute force (6-digit = 1M combinations, 10 attempts = negligible chance).

---

## 5. Account Settings Flows

### 5.1 Change Password (Has Existing Password)
```
User → /cms/settings → Security card
  → enters current password + new password + confirm
  → PATCH /api/v1/account/password
    → verify current password via bcrypt
    → hash new password → update
    → bump sessionVersion (invalidates other sessions)
```
**Result:** Password changed. Other sessions forced to refresh.

### 5.2 Set Password (Google-Only, No Password Yet)
```
User → /cms/settings → Security card (shows "Set password")
  → enters new password + confirm (no "current password" field)
  → PATCH /api/v1/account/password
    → no currentPassword required (hasPassword=false)
    → hash new password → update
```
**Result:** User now has both Google + credentials.

### 5.3 Connect Google (Same Email)
```
User → /cms/settings → Security card → "Connect" button
  → POST /api/v1/auth/link-google-intent (sets httpOnly cookie)
  → signIn("google") → Google OAuth
  → signIn callback: link-intent cookie found
    → Google email matches user's CMS email → link Account
    → redirect to /cms/settings?googleLinked=true
  → toast: "Google account connected"
```
**Result:** Google linked. User can now use either method.

### 5.4 Connect Google (Different Email) — BLOCKED
```
User → /cms/settings → "Connect" button → authenticates as different email
  → signIn callback: link-intent cookie found
    → Google email does NOT match CMS email → return false
    → redirect to /cms/settings?error=AccessDenied
  → toast: "Could not connect — Google email must match your account email"
```
**Result:** Blocked. No session swap.

---

## 6. Onboarding Flow

### 6.1 New Member Onboarding
```
User signs in → dashboard layout checks memberStatus
  → status=PENDING → redirect to /cms/onboarding
  → user enters first name, last name, phone
  → POST /api/v1/auth/complete-onboarding
    → atomic: update user info + set status=ACTIVE (only if currently PENDING)
  → redirect to /cms/dashboard
  → WelcomeBanner shown (dismissible via localStorage)
```
**Result:** Member activated.

---

## 7. Edge Case Matrix

| # | Starting State | User Action | Expected Result | Security |
|---|----------------|-------------|-----------------|----------|
| 1 | No account | Native signup | Account created (unverified) | Safe |
| 2 | No account | Google signup | Account created (verified) | Safe |
| 3 | Native account | Native signup same email | Blocked: EMAIL_EXISTS | Safe |
| 4 | Google-only | Native signup same email | Blocked: GOOGLE_ACCOUNT | Safe |
| 5 | Unverified native | Native signup same email | Resend verification | Safe |
| 6 | Native account | Google login same email | Auto-link + toast | Safe |
| 7 | Native account | Google login diff email | New separate account | Expected |
| 8 | Google-only | Credentials login | Blocked: hint to use Google | Safe |
| 9 | Invited as A | Google accept as A | Accepted | Safe |
| 10 | Invited as A | Google accept as B | Blocked: email mismatch | Safe |
| 11 | Native + Google | Forgot password | OTP code sent | Safe |
| 12 | Google-only | Forgot password | Blocked: use Google | Safe |
| 13 | No account | Forgot password | Blocked: NOT_FOUND | Safe |
| 14 | Any | Settings: connect Google same email | Linked | Safe |
| 15 | Any | Settings: connect Google diff email | Blocked | Safe |
| 16 | PENDING member | Admin resends invite | New token sent | Safe |
| 17 | ACTIVE member | Admin resends invite | Blocked: not PENDING | Safe |

---

## 8. Rate Limiting Summary

| Endpoint | Limit | Key |
|----------|-------|-----|
| Credentials login | 5 / 15 min | email |
| Signup | 5 / 15 min | IP |
| Forgot password | 3 / 1 hr | IP + email |
| Verify reset code | 10 / 15 min | IP |
| Reset password | 5 / 1 hr | IP |
| Accept invite (GET) | 10 / 1 hr | IP |
| Accept invite (POST) | 5 / 1 hr | IP |
| Change password | 5 / 1 hr | userId |
| Google link intent | 5 / 1 hr | userId |
| Resend invite | 5 / 1 hr | userId |
| Resend verification | 1 / 1 min | email |

---

## 9. Token Expiry Summary

| Token Type | Expiry | Storage |
|------------|--------|---------|
| Email verification | 30 min | JWT (stateless) |
| Password reset code | 15 min | DB (resetCodeHash) |
| Password reset JWT | 1 hr | JWT (stateless) |
| Invitation | 7 days | JWT (stateless) |
| Google link intent cookie | 5 min | httpOnly cookie |
| Session JWT | 7 days | httpOnly cookie |
| Invite email guard cookie | 5 min | httpOnly cookie |
