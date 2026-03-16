# QA: Auth Flow Improvements

## Summary of Changes

### What was implemented

**6 files changed across 3 features:**

#### Feature 1: Accept-Invite Fix + Google Path
The accept-invite flow was broken: when an invited user signed in via Google first (which auto-creates a User with name via the Auth.js signIn callback), the old idempotency check (`passwordHash && firstName`) would pass and show "already accepted" — even though the membership was still PENDING and the user never actually completed the invite flow.

**Changes:**
- **`lib/dal/users.ts`** — Added `getUserAuthMethods(userId)` helper that queries the User's `passwordHash` and `Account` table to return `{ hasPassword, hasGoogle, googleEmail }`. Used by both the accept-invite GET and account GET endpoints.
- **`app/api/v1/auth/accept-invite/route.ts`** — Three changes:
  1. **New GET handler** — Validates the invitation token and returns user/membership state (`memberStatus`, `userEmail`, `churchName`, `hasGoogle`, `hasPassword`) so the frontend can decide what UI to show. Rate limited (10/hr per IP).
  2. **Fixed POST idempotency** — Changed from checking `user.passwordHash && user.firstName` to checking `membership.status !== 'PENDING'`. This is the correct guard because the goal is to activate a PENDING membership, not to check if the user has a password.
  3. **Added `mode` parameter to POST** — `"password"` (default, existing flow: name + password required) and `"google"` (validates `auth()` session user matches token target, activates without password).
- **`app/cms/accept-invite/page.tsx`** — Complete redesign:
  - On mount, calls GET to fetch invite state (shows loading spinner)
  - If already accepted (`memberStatus !== 'PENDING'`), shows "Already Accepted" with sign-in link
  - If PENDING, shows choice screen: "Continue with Google" button, separator, "Set up with password" button
  - Google path: redirects to Google OAuth with `callbackUrl` back to accept-invite with `?afterGoogle=true`, then auto-calls POST with `mode: "google"`
  - Password path: shows name + password form (same as before)
  - Includes StrictMode double-fire guard via `useRef`

#### Feature 2: Account Security Settings Card
- **`app/cms/(dashboard)/settings/page.tsx`** — Added a Security card between Account and Appearance:
  - **Connected accounts**: Shows Google connection status (email badge if connected, "Connect" button if not). Connect button triggers Google OAuth with callback to `?googleLinked=true`.
  - **Password section**: Shows "Set password" (for Google-only users, no current password required) or "Change password" (for users with existing password, requires current password).
  - Profile state was lifted from AccountCard to SettingsPage so both AccountCard and SecurityCard share the same data and refresh mechanism.

#### Feature 3: Password Management API
- **`app/api/v1/account/password/route.ts`** (NEW) — PATCH endpoint:
  - Requires authentication via `requireApiAuth()`
  - If user has `passwordHash`: requires + bcrypt-verifies `currentPassword`
  - If user has no `passwordHash` (Google-only): skips current password check
  - Validates new password: 8-128 chars, uppercase, lowercase, number
  - Hashes with bcrypt (12 rounds), updates DB
  - Rate limited: 5 attempts/hour per user
- **`app/api/v1/account/route.ts`** — Extended GET response to include `hasPassword`, `hasGoogle`, `googleEmail` fields (via `getUserAuthMethods`).

---

## QA Test Plan

### Prerequisites
- A church set up with at least one OWNER user
- Access to Google OAuth (for Google-path tests)
- Access to the CMS admin to send invitations

---

### A. Accept-Invite: Password Path (Happy Path)

| # | Step | Expected |
|---|------|----------|
| A1 | As admin, invite a new email (never used before) | Invitation sent, user created with PENDING status |
| A2 | Open the invite link in an incognito/logged-out browser | See loading spinner, then choice screen with church name and email displayed |
| A3 | Click "Set up with password" | See name + password form |
| A4 | Fill in first name, last name, valid password, confirm password | Fields accept input |
| A5 | Click "Set Up Account" | See "Welcome! Your account is ready. Sign in to get started." |
| A6 | Click "Sign In", log in with email + password | Lands on dashboard (may go through onboarding if PENDING flow applies) |

### B. Accept-Invite: Google Path (Happy Path)

| # | Step | Expected |
|---|------|----------|
| B1 | As admin, invite a new email that matches a Google account | Invitation sent |
| B2 | Open invite link in incognito browser | See choice screen |
| B3 | Click "Continue with Google" | Redirects to Google OAuth |
| B4 | Complete Google sign-in | Redirects back to accept-invite page with `?afterGoogle=true` |
| B5 | Observe auto-activation | See "Activating your account..." spinner, then "Welcome!" success screen |
| B6 | Click "Sign In" | Can sign in (via Google or credentials if password was set) |

### C. Accept-Invite: Idempotency (The Original Bug Fix)

| # | Step | Expected |
|---|------|----------|
| C1 | As admin, invite user@example.com | PENDING membership created |
| C2 | User signs in via Google at `/cms/login` BEFORE clicking invite link | Google auto-creates User with name, links Account — but membership stays PENDING, user sees no-access or onboarding |
| C3 | User then clicks the invite link | **Should see choice screen** (not "already accepted") because membership is still PENDING |
| C4 | User clicks "Continue with Google" | Since already signed in with Google, OAuth auto-completes, returns to accept-invite, POST activates membership |
| C5 | User is now ACTIVE | Can access dashboard |

### D. Accept-Invite: Already Accepted

| # | Step | Expected |
|---|------|----------|
| D1 | Complete any accept-invite flow (A or B above) | Membership is now ACTIVE |
| D2 | Click the same invite link again | See "Already Accepted — This invitation has already been accepted. Sign in to continue." with Sign In button |

### E. Accept-Invite: Revoked Invitation

| # | Step | Expected |
|---|------|----------|
| E1 | As admin, invite a user | Invitation sent |
| E2 | As admin, remove that user from the team before they accept | ChurchMember deleted |
| E3 | User clicks invite link | See "Invalid Invitation" with message "This invitation has been revoked." |

### F. Accept-Invite: Expired Token

| # | Step | Expected |
|---|------|----------|
| F1 | Use an invite link with a token older than 7 days | See "Invalid Invitation" with message "Invalid or expired invitation. Please ask the admin for a new one." |

### G. Accept-Invite: No Token

| # | Step | Expected |
|---|------|----------|
| G1 | Navigate to `/cms/accept-invite` with no `?token=` parameter | See "Invalid Invitation — This invitation link is invalid or has expired." |

### H. Accept-Invite: Google OAuth Cancelled

| # | Step | Expected |
|---|------|----------|
| H1 | Open invite link, click "Continue with Google" | Redirects to Google |
| H2 | Cancel/close the Google OAuth popup or deny access | Returns to accept-invite with `?afterGoogle=true` but no session |
| H3 | Auto-activation fires | POST returns 401, page shows "Please sign in with Google first, then accept the invitation." with "Go to Sign In" button |

### I. Accept-Invite: Password Validation

| # | Step | Expected |
|---|------|----------|
| I1 | On password form, enter password < 8 chars | Submit blocked or API returns validation error |
| I2 | Enter password with no uppercase | API returns "Password must be 8-128 characters with uppercase, lowercase, and a number." |
| I3 | Enter password with no number | Same validation error |
| I4 | Enter mismatched password and confirm password | Client-side error "Passwords do not match." |
| I5 | Leave name fields empty | Form requires them (HTML `required`) |

### J. Accept-Invite: Back Navigation

| # | Step | Expected |
|---|------|----------|
| J1 | On choice screen, click "Set up with password" | See password form |
| J2 | Click "Back to options" | Returns to choice screen (Google + password buttons) |

---

### K. Settings: Security Card — Google Connection

| # | Step | Expected |
|---|------|----------|
| K1 | Sign in as a password-only user (no Google linked) | Go to Settings |
| K2 | Security card shows Google section | Shows "Not connected" with "Connect" button |
| K3 | Click "Connect" | Redirects to Google OAuth |
| K4 | Complete Google sign-in (same email) | Returns to `/cms/settings?googleLinked=true`, toast "Google account connected successfully", badge changes to "Connected" with email |
| K5 | Refresh the page | Google still shows "Connected" (persisted in DB) |

### L. Settings: Security Card — Google Already Connected

| # | Step | Expected |
|---|------|----------|
| L1 | Sign in as a Google user | Go to Settings |
| L2 | Security card Google section | Shows email and "Connected" badge, no connect button |

### M. Settings: Set Password (Google-Only User)

| # | Step | Expected |
|---|------|----------|
| M1 | Sign in with Google (no password set) | Go to Settings > Security |
| M2 | Password section shows "Set password" heading | No "current password" field visible |
| M3 | Shows helper text "Add a password so you can also sign in with email and password." | Informational text present |
| M4 | Enter valid new password + confirm | Fields accept input |
| M5 | Click "Set password" | Toast "Password set", form clears |
| M6 | Sign out, sign back in with email + new password | Login succeeds |
| M7 | Return to Settings > Security | Now shows "Change password" with current password field |

### N. Settings: Change Password (Password User)

| # | Step | Expected |
|---|------|----------|
| N1 | Sign in with email + password | Go to Settings > Security |
| N2 | Password section shows "Change password" | Current password field visible |
| N3 | Enter wrong current password + valid new password | Error toast "Current password is incorrect." |
| N4 | Enter correct current password + valid new password + confirm | Toast "Password changed", form clears |
| N5 | Sign out, sign back in with old password | Login fails |
| N6 | Sign in with new password | Login succeeds |

### O. Settings: Password Validation

| # | Step | Expected |
|---|------|----------|
| O1 | Enter new password < 8 chars and submit | API error "Password must be 8-128 characters with uppercase, lowercase, and a number." |
| O2 | Enter new password with no uppercase | Same error |
| O3 | Enter new password with no number | Same error |
| O4 | Enter mismatched new + confirm passwords | Toast "Passwords do not match." (client-side) |
| O5 | Submit button disabled when new password or confirm is empty | Button stays disabled |

### P. Settings: Password Rate Limiting

| # | Step | Expected |
|---|------|----------|
| P1 | Submit change password form 5 times rapidly (wrong current password) | First 5 attempts return "Current password is incorrect." |
| P2 | 6th attempt | Returns "Too many attempts. Please try again later." (429) |

### Q. Settings: Connect Google with Different Email

| # | Step | Expected |
|---|------|----------|
| Q1 | Signed in as user@example.com, click "Connect Google" | Redirects to Google OAuth |
| Q2 | Sign in with a different Google email (other@gmail.com) | Auth.js signIn callback: creates/finds User for other@gmail.com, links Google Account to THAT user — but redirect returns to settings for user@example.com |
| Q3 | Check settings | The original user@example.com account may NOT show Google as connected (the Google account was linked to the other user). This is an Auth.js limitation — the connect flow uses the same `signIn()` which operates on the Google email, not the current user. **Known limitation.** |

### R. Accept-Invite: Rate Limiting

| # | Step | Expected |
|---|------|----------|
| R1 | Call GET `/api/v1/auth/accept-invite?token=...` 10 times rapidly | First 10 succeed |
| R2 | 11th call | Returns 429 "Too many attempts" |
| R3 | Call POST 5 times rapidly | First 5 succeed (or return validation errors) |
| R4 | 6th POST | Returns 429 |

---

## Edge Cases & Known Limitations

1. **Q3 above: Connecting Google with a mismatched email.** The `signIn("google")` flow in Auth.js always operates on the Google account's email. If a user clicks "Connect Google" but signs into a different Google account, the OAuth account gets linked to whatever User matches that email — not necessarily the currently logged-in CMS user. This is a fundamental Auth.js limitation. A proper fix would require a custom OAuth callback that checks `session.user.id` matches before linking. Low priority since most users will use the same email.

2. **Invite token consumed by GET.** The GET handler validates the token but does not consume it. The token can be validated indefinitely until it expires (7 days) or the membership status changes. This is by design — the token is only "consumed" when the POST activates the membership.

3. **Multiple churches.** If a user has memberships in multiple churches, the accept-invite flow only looks up the membership matching the token's `churchId`. The `findFirst` with the churchId spread ensures correctness.

4. **Password-only user accepting invite via Google.** If a user already has a password (from a previous invite to another church) and now accepts a new invite via Google, the Google path just activates the membership — it doesn't touch the password. The user retains both auth methods.

5. **Session refresh after accept-invite.** After accepting an invite (either path), the user is told to sign in. The JWT callback's PENDING-status refresh loop will pick up the ACTIVE status on next sign-in. No manual session invalidation is needed.
