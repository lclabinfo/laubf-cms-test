# Google OAuth: Test → Production Guide

How to move your Google OAuth setup from test mode (1 user) to production (unlimited users) for the Digital Church CMS.

---

## TL;DR

For basic "Sign in with Google" (email + profile scopes), you **do NOT need Google verification**. You can launch immediately. The whole process takes ~30 minutes.

---

## Step 1: Create a Production Google Cloud Project

Best practice: keep **separate projects** for dev and production so test activity doesn't pollute production data.

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown → **New Project**
3. Name it something like `Digital Church CMS - Production`
4. Select your billing account (if applicable)

> **Why separate projects?** Prevents mixing test/prod user data, cleaner credential management, and avoids accidentally registering localhost URIs in production.

---

## Step 2: Configure the OAuth Consent Screen

In your **production** project:

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** user type (unless you're restricting to a Google Workspace org)
3. Fill in:

| Field | Value |
|-------|-------|
| App name | `Digital Church CMS` (or your brand) |
| User support email | Your admin email |
| App logo | Optional (320×320 PNG/JPG) — only shows after brand verification |
| App domain | Your production domain (e.g., `lclab.io`) |
| Privacy policy URL | `https://yourdomain.com/privacy` |
| Terms of service URL | `https://yourdomain.com/terms` |
| Authorized domains | `lclab.io` (and any other domains you use) |
| Developer contact email | Your email |

4. Under **Scopes**, add:
   - `email` — `https://www.googleapis.com/auth/userinfo.email`
   - `profile` — `https://www.googleapis.com/auth/userinfo.profile`
   - `openid`

   These are **non-sensitive** scopes → no verification required.

5. Under **Audience** tab, click **Publish App** to switch from "Testing" to "In production"

> **Important:** You need a privacy policy URL before publishing. It can be a simple page — just needs to be publicly accessible.

---

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `Digital Church CMS`
5. **Authorized JavaScript origins:**
   ```
   https://admin.laubf.lclab.io
   ```
   (Add any other production domains where the CMS runs)

6. **Authorized redirect URIs:**
   ```
   https://admin.laubf.lclab.io/api/auth/callback/google
   ```

   > **Critical:** This must be an **exact match** — case-sensitive, no trailing slash, correct protocol.

7. Click **Create** and copy:
   - **Client ID** → `AUTH_GOOGLE_ID`
   - **Client Secret** → `AUTH_GOOGLE_SECRET`

---

## Step 4: Set Production Environment Variables

In your production environment (Vercel, Railway, etc.), set:

```bash
# Auth.js v5 core
AUTH_SECRET=<generate with: openssl rand -base64 32>
AUTH_TRUST_HOST=true

# Google OAuth (production credentials)
AUTH_GOOGLE_ID=<your-production-client-id>.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=<your-production-client-secret>

# SendGrid (for invitation emails)
SENDGRID_API_KEY=<your-sendgrid-key>
EMAIL_FROM=noreply@lclab.io
```

### Variable notes:

| Variable | Notes |
|----------|-------|
| `AUTH_SECRET` | Must be different from dev. Generate a new one. |
| `AUTH_TRUST_HOST` | Set to `true` — required when behind Vercel/proxy |
| `AUTH_URL` | Not needed on Vercel (auto-detected from request headers). Only set if behind a custom proxy. |
| `AUTH_GOOGLE_ID` / `SECRET` | Use production project credentials, NOT your dev ones |

### What about `AUTH_URL`?

Auth.js v5 auto-detects the URL from request headers in most hosting environments. You generally **don't need to set it** on Vercel. Only set it if:
- You're behind a custom reverse proxy
- Auth callbacks are redirecting to the wrong domain
- You're using a non-standard base path

---

## Step 5: Keep Your Dev Setup Separate

Your existing dev setup stays as-is in `.env`:

```bash
AUTH_GOOGLE_ID=<your-test-project-client-id>
AUTH_GOOGLE_SECRET=<your-test-project-secret>
```

With localhost redirect URI registered in your **dev** Google Cloud project:
```
http://localhost:3000/api/auth/callback/google
```

---

## Step 6: Deploy & Test

1. Deploy to production
2. Visit your CMS login page
3. Click "Sign in with Google"
4. Verify you see the Google consent screen (it will show your domain, not branded app name until you verify)
5. Complete sign-in
6. Check that the user appears in your Users admin page

### Testing checklist:
- [ ] Google sign-in works on production domain
- [ ] New user gets PENDING status and sees onboarding
- [ ] Invited user (via email) can sign in with Google and onboarding activates them
- [ ] Credentials login still works alongside Google
- [ ] Session persists across page navigations

---

## Step 7: Optional — Brand Verification

After launch, you can optionally submit for **brand verification** so users see your app name and logo on the consent screen instead of just your domain.

1. Go to **OAuth consent screen → Audience**
2. Click **Prepare for Verification**
3. Submit your app info
4. Takes **2-3 business days**

This is **cosmetic only** — your app works fine without it. Users can still sign in; they just see `lclab.io` instead of `Digital Church CMS` on the consent screen.

---

## Quick Reference: Test vs Production Mode

| | Test Mode | Production Mode |
|---|---|---|
| User limit | 100 test users (manually added) | Unlimited |
| Warning screen | "This app hasn't been verified" | No warning |
| Session expiry | 7 days after consent | No forced expiry |
| Pre-registration | Users must be added manually | Anyone with Google account |
| Brand display | Domain only | Domain only (or branded after verification) |

---

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
→ The redirect URI in your Google Cloud Console doesn't exactly match what Auth.js sends. Check:
- Protocol (`https://` not `http://`)
- Domain (exact match, no trailing slash)
- Path (`/api/auth/callback/google`)

### "Access blocked: This app's request is invalid"
→ Your OAuth consent screen is still in "Testing" mode and the user isn't in the test user list. Publish the app to production.

### Sign-in works but session is lost on redirect
→ Check that `AUTH_TRUST_HOST=true` is set in production. Behind a proxy, Auth.js can't verify the host without this.

### User signs in but gets "no access" page
→ The user doesn't have a `ChurchMember` record. They need to be invited first via the admin Users page, then sign in with Google.

---

## Your Current Auth Config

Your app already handles all the Auth.js v5 production requirements:

- **Cookie security**: `lib/auth/edge-config.ts` — `__Secure-` prefix and `httpOnly: true` in production
- **Session strategy**: JWT (no database sessions needed)
- **Provider config**: `lib/auth/config.ts` — reads from `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` env vars
- **Callback URL**: Auto-configured by Auth.js at `/api/auth/callback/google`

No code changes are needed — just the Google Cloud Console setup and env vars described above.

---

## Multi-Tenant Considerations (Future)

When you add more churches, each church will use the **same** Google OAuth credentials. Google OAuth identifies users by email — your app's `signIn` callback in `lib/auth/config.ts` handles the User → ChurchMember mapping. No per-church OAuth configuration needed.

The only change for multi-tenant: ensure all admin subdomains (`admin.{slug}.lclab.io`) are registered as authorized redirect URIs, or use a wildcard approach with middleware.
