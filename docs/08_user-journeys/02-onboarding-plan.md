# Onboarding Plan

Centralized onboarding flow for all new church members, regardless of authentication method (Google OAuth or invite link with credentials).

## Design Principles

- **Single onboarding path**: Every new member passes through `/cms/onboarding` after first login.
- **Status-based routing**: The dashboard layout reads `memberStatus` from the JWT and redirects accordingly.
- **Auth-method agnostic**: Google OAuth and credentials users converge on the same onboarding screen.

## Member Status Routing

The CMS dashboard layout (`app/cms/(dashboard)/layout.tsx`) checks `session.memberStatus` on every request:

| Status     | Behavior                                      |
|------------|-----------------------------------------------|
| `PENDING`  | Redirect to `/cms/onboarding`                 |
| `ACTIVE`   | Allow access to dashboard                     |
| `INACTIVE` | Redirect to `/cms/no-access` (static page)    |

New members start as `PENDING` (set when the `ChurchMember` record is created during invite).

## Auth Configuration Changes

### JWT Callback

`memberStatus` is set on initial sign-in from the ChurchMember record. For PENDING members, the JWT callback re-checks status on every request (lightweight single-field query) so that onboarding completion takes effect immediately without re-sign-in:

```ts
// Re-check status for PENDING members
if (token.memberStatus === 'PENDING' && token.userId && token.churchId) {
  const current = await prisma.churchMember.findFirst({
    where: { userId: token.userId, churchId: token.churchId },
    select: { status: true },
  })
  if (current) token.memberStatus = current.status
}
```

### Session Callback

Exposes `memberStatus` on the session object, defaulting to `'ACTIVE'`:

```ts
extSession.memberStatus = (token.memberStatus as string) ?? 'ACTIVE'
```

### Edge/Middleware Config

`/cms/onboarding` is in the `publicCmsPages` allowlist so PENDING users can reach it (they must still be authenticated — the middleware checks for a valid JWT).

## Onboarding Flow

### Route: `/cms/onboarding`

A single-screen form (server component wrapper + client form):

- **Server component** (`page.tsx`): Calls `auth()`, redirects non-PENDING users to `/cms`, splits session name into first/last, passes props to form.
- **Client form** (`onboarding-form.tsx`): Displays a centered Card with:
  - Church icon + "Welcome to [Church Name]" title
  - Role badge: "Invited as [Role Name]" (hidden if no custom role name)
  - First name + last name fields (pre-filled from OAuth/invite, editable, 2-col grid)
  - Phone field (optional)
  - Read-only email display
  - "Complete Setup" button → POST `/api/v1/auth/complete-onboarding`
  - On success: brief success state, then redirect to `/cms` with `router.refresh()`

### API: `POST /api/v1/auth/complete-onboarding`

1. Validate authenticated user with a church membership.
2. Atomically activate membership (`updateMany` with `status: 'PENDING'` condition — prevents race conditions).
3. Update `User` record with verified name fields.
4. Sync linked `Person` record (if exists, not soft-deleted) with name + phone.
5. Return `{ success: true, data: { status: 'ACTIVE' } }`.

Idempotent: if already ACTIVE, returns success without modifying anything.

## Interaction with Accept-Invite Flow

| Auth Method           | Accept-Invite Page     | Onboarding Page |
|-----------------------|------------------------|-----------------|
| **Google OAuth**      | Skipped entirely       | Yes             |
| **Credentials invite**| Set name + password    | Yes (after sign-in) |

Sequence for credentials users: accept-invite → sign in → onboarding → dashboard.
Sequence for Google OAuth users: Google sign-in → onboarding → dashboard.

## Post-Onboarding Welcome

A dismissible `WelcomeBanner` component (`components/cms/welcome-banner.tsx`) shows on the dashboard after first login. Uses `localStorage` key `cms-welcome-dismissed-{userId}` to track dismissal. Displays:
- Personalized greeting with church name and first name
- Role-based description of capabilities
- Quick links grid (messages, events, pages, people)

## Data Model

No schema changes needed — uses existing fields:

- **`ChurchMember.status`**: String field (`PENDING`, `ACTIVE`, `INACTIVE`)
- **`User.firstName`, `User.lastName`**: Updated during onboarding
- **`Person.firstName`, `Person.lastName`, `Person.phone`**: Synced if linked

## Future Features (Not In Scope)

- **Multi-step wizard**: Profile photo upload, bio, ministry preferences
- **Church-specific welcome message**: Customizable welcome text per church
- **Onboarding analytics**: Completion rates, step drop-off, time-to-complete
- **Terms of service acceptance**: ToS/privacy policy agreement with audit trail
- **Two-factor authentication setup**: Optional 2FA enrollment
