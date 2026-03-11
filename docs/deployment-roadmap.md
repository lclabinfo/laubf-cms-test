# Deployment Roadmap

Generated: 2026-03-07
Last updated: 2026-03-11

This document organizes all remaining work into prioritized categories. Tasks are broken down into actionable sub-tasks and ordered by deployment criticality.

**Priority Key:**
- **P0 (Launch Blocker)** — Must be done before LA UBF goes live
- **P1 (Post-Launch, High)** — Should ship within 2-4 weeks after launch
- **P2 (Post-Launch, Medium)** — Ship when capacity allows
- **P3 (Future / Platform)** — Multi-tenant, billing, scale

---

## Current State Summary

| Area | Status |
|------|--------|
| Contact form / Visit Us (public form, API, CMS viewer, email, batch ops) | **100% complete** |
| CMS core (Messages, Events, Media, People) | ~95% complete |
| Website rendering (42 section types, theme, fonts) | ~98% complete |
| Website builder v1 (pages, sections, menus, domains) | 100% complete |
| Authentication (Google SSO + credentials + password reset + onboarding) | **100% complete** |
| Custom roles & granular permissions (49 permissions, priority hierarchy) | **100% complete** |
| User management (list, invite, roles, deactivate, person linking) | **100% complete** |
| R2 storage (attachments + media) | 100% complete |
| Database (32 models, 22 enums, seed data) | ~98% complete |
| API routes (75+ endpoints) | ~98% complete |
| People management (members, groups, roles, households) | ~95% complete |
| Domain routing (proxy.ts + subdomain support) | ~90% complete |
| Production deployment (VM + PM2 + nginx) | **Ready to deploy** (config, scripts, deploy-data all prepared) |
| Multi-tenant platform | 0% |

---

## P0: Launch Blockers

These must be completed before LA UBF can go live.

---

### 1. Church Profile & Metadata (P0)

The Church model and SiteSettings have correct schemas. Seed data uses real LA UBF values (Downey, CA). The public website reads from these for navbar, footer, OG tags, and contact info.

- [x] **1.1 Audit current seed data** — Seed data reviewed. All values are real LA UBF data (not placeholder).
- [x] **1.2 Update Church record** — Correct values: name "LA UBF", address 11625 Paramount Blvd Downey CA 90241, phone (562) 396-6350, email laubf.downey@gmail.com, timezone America/Los_Angeles.
- [x] **1.3 Update SiteSettings record** — All values correct: siteName, tagline, description, contact info, social URLs (Instagram, Facebook, YouTube, TikTok), 4 service times.
- [x] **1.4 Wire Church profile to website metadata** — `generateMetadata()` added to `app/website/layout.tsx` using SiteSettings for title template, description, OG tags. *(2026-03-10)*
- [x] **1.5 Wire service times** — Service times in SiteSettings JSON, rendered in RECURRING_SCHEDULE section. Footer reads from SiteSettings. *(2026-03-10)*
- [x] **1.6 Update seed script** — `prisma/seed.mts` produces correct LA UBF data out of the box.
- [x] **1.7 Test CMS church profile editor** — `/cms/church-profile` fully functional with bidirectional apiToProfile/profileToApi mapping.

---

### 2. Website Builder Overhaul (P0)

The v1 list-based builder works for CRUD but the editing experience needs fixes. The v2 full-screen canvas builder is not a launch blocker — v1 with fixes is sufficient.

- [x] **2.1 Audit section editability** — Section types are classified: static (editable content) vs dynamic (dataSource auto-populated).
- [x] **2.2 Build structured section editors** — Full builder at `/cms/website/builder/[pageId]` with dedicated editors: HeroEditor, ContentEditor, CardsEditor, FAQEditor, TimelineEditor, FormEditor, FooterEditor, PhotoGalleryEditor, ScheduleEditor, MinistryEditor, CustomEditor. Falls back to JsonEditor for unrecognized types.
- [x] **2.3 Fix dataSource sections** — `DataSectionEditor` shows "Data-Driven Section" banner with description. `section-preview.tsx` shows "Content from [Module]" badge.
- [x] **2.4 Section visibility toggle** — Eye/EyeOff toggle with optimistic update via PATCH API.
- [x] **2.5 Section reordering** — ChevronUp/ChevronDown buttons + drag-and-drop via dnd-kit.
- [x] **2.6 Add/remove sections** — SectionPickerDialog + AlertDialog confirmation for delete.
- [x] **2.7 Preview link** — "View site" button in builder topbar opens public URL in new tab.

---

### 3. Database Cleanup (P0)

Remove deprecated columns and fix schema issues identified during development.

- [x] **3.1 Audit unused columns** — Audited (2026-03-10):
  - `Message.legacyId` — Only used in seed.mts. Conditionally safe to drop (seed still references it).
  - `BibleStudy.legacyId` — Heavily used in seed.mts + migration scripts. **Keep for now.**
  - `Church.settings` JSON — **Actively used** by church profile CMS page + DAL. Must keep.
  - `ContentTag` model — **Safe to drop.** Never queried or written to in any DAL/API.
  - `ApiKey` model — **Safe to drop.** Zero usage anywhere in app code.
- [x] **3.2 Create migration for column drops** — Migration `20260311012320_drop_unused_contenttag_apikey_models` applied. *(2026-03-10)*
- [x] **3.3 Event schema gaps** — All fields exist: `slug`, `directionsUrl`, `shortDescription`, `campus`, `tags`.
- [x] **3.4 Clean up seed data** — ContentTag/ApiKey references removed from seed. *(2026-03-10)*
- [ ] **3.5 Test migration on fresh DB** — `npx prisma migrate reset` → verify clean state → seed → verify CMS works.

---

### 4. Public Website UI Fixes (P0)

Fix rendering issues on the public-facing website before launch.

- [ ] **4.1 Audit all public pages** — Visit every page type and check for:
  - [ ] Homepage (all sections render, no blank sections, correct data)
  - [ ] Messages list page (pagination, filtering, card layout)
  - [ ] Message detail page (video embed, transcript, Bible study tabs)
  - [ ] Events list page (upcoming/past, filtering)
  - [ ] Event detail page (date, location, description, registration link)
  - [ ] Bible study list page (pagination, card layout)
  - [ ] Bible study detail page (questions, answers, transcript, attachments, key verse)
  - [ ] About / Ministry pages (content renders, images load)
  - [ ] Contact page (form submission works → ContactSubmission table, see #10)
- [x] **4.2 Fix empty paragraph rendering** — `tiptapJsonToHtml()` inserts `<br>` into empty `<p>` tags. Fix confirmed.
- [ ] **4.3 Fix font rendering** — Verify serif fonts (Times New Roman) display correctly for pre-2016 Bible studies, and sans-serif (Calibri/Arial) for post-2016.
- [x] **4.4 Mobile responsiveness** — All pages use responsive grid/flex with Tailwind breakpoints (375px/768px/1024px).
- [x] **4.5 Image loading** — All images use Next.js `<Image>`. remotePatterns configured for R2 buckets + YouTube thumbnails.
- [ ] **4.6 Navigation** — Verify header menu links work, footer links work, mobile menu opens/closes, external links open in new tab.
- [x] **4.7 SEO basics** — `generateMetadata()` added to website layout + all detail pages. *(2026-03-10)*
- [x] **4.8 404 page** — Custom `app/website/not-found.tsx` created with styled page. *(2026-03-10)*
- [x] **4.9 Fix ContactSubmission persistence** — Full pipeline: API persistence, DAL, CMS pages, email notifications. See #10. *(2026-03-10)*

---

### 5. Domain Routing & Route Group Restructure (P0)

The public website currently lives at `/website/*` (a regular directory). For launch, it must serve at the root of `laubf.org` and the CMS admin must be at `admin.laubf.org`. This requires converting the directory structure to route groups and adding hostname-based middleware.

**Current state (2026-03-10):** `app/website/` is a regular directory → pages render at `/website/...`. `proxy.ts` exists with subdomain routing logic (rewrites `slug.ROOT_DOMAIN` → `/website/...`). No separate `middleware.ts` — proxy handles both domain routing and auth gating.

**Architecture decision:** Using `proxy.ts` with URL rewriting instead of route group rename. The proxy rewrites subdomain requests to `/website/...` internally, so the `/website/` directory stays as-is. This avoids breaking imports and simplifies the transition.

**Target state:** `laubf.lclab.io/` serves the public site (via proxy rewrite), `admin.laubf.lclab.io/` serves the CMS.

- [x] **5.1 Proxy-based routing** — `proxy.ts` rewrites church subdomain requests to `/website/...` paths internally. No directory rename needed.
- [x] **5.2 Verify CMS routes** — CMS at `/cms/*` works via admin subdomain routing in proxy.
- [x] **5.3 Proxy handles domain routing** — `proxy.ts` inspects hostname, routes to website or CMS, handles auth gating via `NextAuth(edgeAuthConfig)`.
- [x] **5.4 Update env vars** — Production env vars configured on VM. *(2026-03-11)*
- [x] **5.5 Update internal links** — All hardcoded `/website/` hrefs replaced with `resolveHref()` helper. *(2026-03-10)*
- [ ] **5.6 Update seed data** — Verify MenuItem href values work with proxy routing.
- [x] **5.7 Handle localhost development** — Proxy falls back to path-based routing in dev mode.
- [ ] **5.8 Test both domains** — Verify: public site loads at `laubf.lclab.io`, CMS loads at `admin.laubf.lclab.io`, API accessible, auth cookies work across subdomains.

<details>
<summary>AI Prompt: Domain Routing & Route Group Restructure</summary>

```
I need to restructure routing so the public website serves at the root domain (laubf.org)
and the CMS admin serves at admin.laubf.org.

Current state:
- Public website is at app/website/ (regular directory, renders at /website/*)
- CMS is at app/cms/(dashboard)/ (renders at /cms/*)
- No middleware.ts exists
- No multi-domain routing

Changes needed:
1. Rename app/website/ → app/(website)/ so pages render at / instead of /website/
2. Create middleware.ts at project root that:
   - Detects hostname (admin.laubf.org vs laubf.org)
   - On admin.* hostname: only allow /cms/* and /api/* routes
   - On main domain: serve /(website) routes, block /cms/* (redirect to admin subdomain)
   - In dev mode (localhost:3000): use path-based routing (/cms/* = admin, everything else = website)
   - Always pass through: /api/*, /_next/*, /favicon.ico, static assets
3. Update next.config.ts with NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_ADMIN_URL
4. Search and update any hardcoded /website/ prefixes in:
   - MenuItem href values in seed data
   - PageSection content JSON
   - Component links and redirects
   - Auth redirect URLs (NEXTAUTH_URL must work for admin subdomain)
5. Ensure auth cookies have domain=.laubf.org so they work across subdomains

Key files to modify:
- app/website/ → app/(website)/ (rename)
- middleware.ts (create)
- next.config.ts (update)
- prisma/seed.mts (update hrefs)
- lib/auth/config.ts (cookie domain)

Test: localhost:3000/ shows public site, localhost:3000/cms shows admin.
Production: laubf.org shows public site, admin.laubf.org shows admin.
```
</details>

---

### 6. Website Image Pipeline & WebP Serving (P0)

All website images must be served from the media library (R2) and converted to WebP on the fly. Currently some section content references Unsplash placeholder URLs or hardcoded paths. Next.js Image component handles WebP negotiation automatically, but we need to ensure all images go through it.

- [x] **6.1 Audit all image sources** — No raw `<img>` tags found in `components/website/`. All use Next.js `<Image>`.
- [x] **6.2 Replace raw `<img>` with `<Image>`** — Already done. All website components use `<Image>`.
- [x] **6.3 Audit placeholder images** — Main seed (`prisma/seed.mts`) uses R2 + YouTube URLs only. Unsplash only in test seed script (`scripts/seed-test-events.mts`).
- [ ] **6.4 Upload LA UBF images to R2** — Church logo, favicon, OG image, hero banners, ministry photos, speaker headshots, event covers. Use the media library upload flow.
- [ ] **6.5 Update seed data image URLs** — Replace all placeholder/Unsplash URLs in `prisma/seed.mts` with R2 media URLs.
- [ ] **6.6 Configure Next.js image optimization** — In `next.config.ts`, explicitly set output formats:
  ```ts
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [/* R2 buckets, YouTube thumbnails */],
  }
  ```
- [ ] **6.7 Verify WebP serving** — After deployment, use browser DevTools Network tab to confirm images are served as `image/webp` or `image/avif` (check `Content-Type` response header).
- [x] **6.8 Handle user-uploaded images** — Media library uploads to R2; Next.js `<Image>` auto-converts to WebP/AVIF on-the-fly. *(2026-03-09)*
- [ ] **6.9 Image size limits** — Verify large hero images are reasonably sized. Consider adding `sizes` prop to `<Image>` components for responsive srcset (e.g., `sizes="(max-width: 768px) 100vw, 50vw"`).

<details>
<summary>AI Prompt: Website Image Pipeline & WebP</summary>

```
Audit and fix all image handling on the public website so every image is:
1. Served from R2 (no Unsplash placeholders, no hardcoded paths)
2. Rendered through Next.js <Image> component (not raw <img>) for automatic WebP/AVIF
3. Properly sized with responsive srcset

Steps:
1. Search components/website/ for raw <img> tags:
   grep -rn '<img ' components/website/
   Convert each to Next.js <Image> with appropriate fill/width/height props.

2. Search seed data for non-R2 image URLs:
   grep -n 'unsplash\|placeholder\|via.placeholder' prisma/seed.mts
   These need to be replaced with actual R2 media URLs after uploading real images.

3. In next.config.ts, add explicit format preference:
   images: {
     formats: ['image/avif', 'image/webp'],
     remotePatterns: [existing patterns],
   }

4. For each <Image> in hero/banner sections, add sizes prop:
   <Image sizes="100vw" ... />  // full-width heroes
   <Image sizes="(max-width: 768px) 100vw, 50vw" ... />  // split layouts

Key constraint: Users upload in any format (PNG, JPG, etc.) via CMS. The original
is stored as-is in R2. Next.js Image optimization layer converts to WebP/AVIF
at request time based on browser Accept header. No pre-conversion needed.

Files to check:
- components/website/sections/*.tsx (all 40 section components)
- components/website/shared/*.tsx (23 shared components)
- components/website/layout/*.tsx (navbar, footer)
- next.config.ts (image config)
- prisma/seed.mts (placeholder URLs)
```
</details>

---

### 7. Production Deployment (P0)

Get LA UBF live on a real server.

- [x] **7.1 Choose hosting** — **Azure VM with nginx + PM2.** `ecosystem.config.js` configured, `output: 'standalone'` set in next.config.ts. Deploy script exists at `scripts/deploy.sh`.
- [x] **7.2 Set up production database** — PostgreSQL on VM. Migrations applied, seed data deployed. *(2026-03-11)*
- [x] **7.3 Configure R2 for production** — R2 buckets configured with CORS for production domain. *(2026-03-11)*
- [x] **7.4 Environment variables** — `.env` configured on VM with all required vars. *(2026-03-11)*
- [x] **7.5 DNS setup** — DNS records configured for `laubf.lclab.io` and `admin.laubf.lclab.io`. *(2026-03-11)*
- [x] **7.6 SSL certificate** — SSL configured for production domains. *(2026-03-11)*
- [x] **7.7 Build & deploy** — Production build deployed and running via PM2. *(2026-03-11)*
- [ ] **7.8 Smoke test production** — Visit every page, test CMS login, test file upload, test form submission.
- [ ] **7.9 Error tracking** — Set up Sentry (future — not blocking launch).

**VM deployment prompt:** See `docs/00_dev-notes/vm-deployment-prompt.md` for the step-by-step interactive deployment guide.

---

### 8. Auth Hardening (P0)

Current auth works for Google SSO + credentials but is missing critical flows for production.

- [x] **8.1 Password reset flow** — Full end-to-end: forgot-password page → JWT token with nonce → reset-password page. Rate-limited per IP+email.
- [x] **8.2 Secure session config** — Cookies hardened: secure, sameSite:lax, httpOnly, 7-day maxAge. Cookie domain for subdomain sharing configured. *(2026-03-10)*
- [x] **8.3 Rate limiting on auth endpoints** — `lib/rate-limit.ts` applied to forgot-password, reset-password, signup, verify-email, accept-invite. In-memory store (per-process). Credentials login callback not yet rate-limited.
- [x] **8.4 CSRF protection** — NextAuth CSRF token automatic.
- [x] **8.5 Logout** — `signOut({ callbackUrl: "/cms/login" })` in sidebar + no-access page.

---

### 9. Daily Bread Page (P0/P1)

The Daily Bread section component (`DAILY_BREAD_FEATURE`) and DAL (`lib/dal/daily-bread.ts`) are fully implemented. The `DailyBread` model exists in the database. The public page is served via the catch-all route using a seeded page. Data comes from UBF national website (ubf.org/daily-breads), NOT from the old LA UBF database.

**Reference implementation:** `laubf-test/src/components/daily-bread/DailyBreadDetailPage.tsx` — resizable split-pane with scripture sidebar, audio player, and devotional body text.

- [x] **9.1 Public daily bread page** — Served via catch-all `[[...slug]]` route using seeded page with slug `daily-bread` + `DAILY_BREAD_FEATURE` section.
- [x] **9.2 Section component** — `components/website/sections/daily-bread-feature.tsx` is a full implementation with: collapsible scripture, audio player with speed control, key verse, DOMPurify sanitization, theme tokens. Faithful port of laubf-test reference.
- [x] **9.3 Wire the homepage section** — `resolve-section-data.ts` handles `latest-daily-bread` dataSource → calls `getTodaysDailyBread(churchId)`.
- [x] **9.4 Seed daily bread data** — 9 entries in `prisma/seed.mts`. Dates updated to March 2026. *(2026-03-10)*
- [ ] **9.5 CMS daily bread management** — P1. No admin page yet. Content managed via API or seed.
- [x] **9.6 Daily bread data source** — Content comes from UBF national website (ubf.org/daily-breads). No old DB dump data. Future: auto-import from ubf.org or manual CMS entry.
- [x] **9.7 Navigation** — "Daily Bread" link seeded in header menu under Resources group.

<details>
<summary>AI Prompt: Daily Bread Page Implementation</summary>

```
Implement the Daily Bread feature for the public website. The DAL, model, and API
already exist. The homepage section component exists but the dedicated page doesn't.

Reference implementation: laubf-test/src/components/daily-bread/DailyBreadDetailPage.tsx

Steps:
1. Create app/(website)/daily-bread/page.tsx:
   - Server component that calls getTodaysDailyBread(churchId)
   - If no entry for today, show empty state with link to archive
   - Pass data to client component for interactive features

2. Create components/website/daily-bread/daily-bread-detail.tsx:
   Port from laubf-test/src/components/daily-bread/DailyBreadDetailPage.tsx
   Key features:
   - "Daily Bread" badge (purple/brand color) + formatted date
   - Title + passage + author metadata
   - Resizable split-pane: scripture sidebar (45% default) | devotional body
   - Scripture section: collapsible, shows verse numbers, HTML content
   - Audio player (sticky bottom): play/pause, rewind 10s, speed selector, progress bar
   - Mobile: no sidebar, scripture section inline
   - Use theme variables (var(--font-heading), var(--color-primary), etc.)
   - Use DOMPurify for HTML sanitization (matching existing implementation)

3. Data shape (from lib/dal/daily-bread.ts getTodaysDailyBread):
   { id, date, passage, body, bibleText, author, keyVerse, audioUrl, status }

4. Verify DAILY_BREAD_FEATURE section on homepage:
   - Check components/website/sections/daily-bread-feature.tsx
   - Ensure it shows today's entry with "Read more" link to /daily-bread

5. Add seed data in prisma/seed.mts:
   - Create 7 DailyBread entries (today + last 6 days)
   - Use real-looking devotional content
   - Set status: PUBLISHED

Existing files to reference:
- lib/dal/daily-bread.ts (DAL functions)
- lib/website/resolve-section-data.ts (section data resolution)
- components/website/sections/daily-bread-feature.tsx (homepage section)
- laubf-test/src/components/daily-bread/DailyBreadDetailPage.tsx (reference UI)
- laubf-test/src/lib/types/daily-bread.ts (data types)
```
</details>

---

### 10. Visit Us / Contact Form (P0)

Full pipeline implemented: public form → API with rate limiting + honeypot → DB persistence → SendGrid email notification → CMS inbox-style viewer with batch operations, status workflow, activity log, and Sheet preview panel.

**Implementation status (2026-03-10): COMPLETE.**

- [x] **10.1 Fix form submission persistence** — `POST /api/v1/form-submissions` creates DB record with input validation, rate limiting (5/min per IP), honeypot anti-spam. *(2026-03-10)*
- [x] **10.2 Email notification on submission** — SendGrid via `lib/email/notification.ts`. Recipients from DB (`SiteSettings.notificationEmails`) → env var fallback. CMS configurable in website settings. *(2026-03-10)*
- [x] **10.3 CMS form submissions list page** — `/cms/form-submissions` with email-inbox UI: DataTable with row selection, Sheet preview, status badges, search with debounce, filters popover, batch operations (mark read/unread, set status, delete). *(2026-03-10)*
- [x] **10.4 CMS submission detail view** — `/cms/form-submissions/[id]` with 2-column layout, inline status selector, activity timeline with author attribution, notes with Cmd+Enter. *(2026-03-10)*
- [x] **10.5 DAL module** — `lib/dal/form-submissions.ts` with list (paginated + status filter), get, update, batchUpdate, addActivityLog, getUnreadCount. *(2026-03-10)*
- [x] **10.6 API routes** — GET/POST list, GET/PATCH/DELETE `[id]`, POST `/batch`. Permission-gated with `submissions.view`/`submissions.manage`. *(2026-03-10)*
- [x] **10.7 Unread badge in CMS sidebar** — Inbox icon with count badge, permission-gated. *(2026-03-10)*
- [ ] **10.8 Reply-by-email (optional)** — Future. Not blocking launch.

<details>
<summary>AI Prompt: Visit Us / Contact Form Feature</summary>

```
Implement the full Visit Us / Contact Form pipeline: persistence, CMS viewer, email notification.

Current state:
- Form UI: components/website/sections/form-section.tsx (DONE, fully built)
- API route: app/api/v1/form-submissions/route.ts (has TODO, only console.log)
- Schema: ContactSubmission model in prisma/schema.prisma (DONE)
  Fields: id, churchId, formType, name, email, phone, subject, message, fields (JSONB),
  isRead, readAt, assignedTo, notes, createdAt

Step 1: Fix the API route (app/api/v1/form-submissions/route.ts)
- Import prisma from @/lib/db
- Replace console.log with prisma.contactSubmission.create()
- Map: name = `${firstName} ${lastName}`, formType = "visit-us"
- Store interests, campus, bibleTeacher, etc. in fields JSONB
- After DB write, trigger email notification (async, don't block response)

Step 2: Create DAL (lib/dal/form-submissions.ts)
- listSubmissions(churchId, { isRead?, formType?, cursor?, limit? })
- getSubmission(churchId, id)
- markAsRead/markAsUnread
- updateNotes, assignSubmission, deleteSubmission
- getUnreadCount(churchId) for sidebar badge

Step 3: Create API routes for CMS
- GET /api/v1/form-submissions (list, paginated)
- GET /api/v1/form-submissions/[id] (detail)
- PATCH /api/v1/form-submissions/[id] (update read/notes/assignee)
- DELETE /api/v1/form-submissions/[id]

Step 4: Create CMS page
- app/cms/(dashboard)/form-submissions/page.tsx — list view with DataTable
- app/cms/(dashboard)/form-submissions/[id]/page.tsx — detail view
- Add sidebar link with unread count badge

Step 5: Email notification
- Create lib/email/send-notification.ts
- On form submit, send email to NOTIFICATION_EMAIL env var (or SiteSettings.email)
- Template: "New Visit Us Submission from {name}" with all fields
- Include link to CMS detail page
- Use Resend (npm install resend) or Nodemailer as fallback

Key files:
- prisma/schema.prisma (ContactSubmission model — already exists)
- app/api/v1/form-submissions/route.ts (fix TODO)
- lib/dal/form-submissions.ts (create)
- app/cms/(dashboard)/form-submissions/ (create)
- components/cms/form-submissions/ (create list + detail components)
- lib/email/send-notification.ts (create)
```
</details>

---

## P1: Post-Launch High Priority

Ship within 2-4 weeks after launch.

---

### 11. User Management, Roles & Onboarding (P1 → COMPLETE)

Fully implemented with custom roles system (not hardcoded OWNER/ADMIN/EDITOR/VIEWER). 49 granular permissions across 17 groups. Priority-based role hierarchy. Centralized onboarding flow for new members.

- [x] **11.1 User list page** — `/cms/people/users` with DataTable: name, email, role, last login, status, actions. *(2026-03-10)*
- [x] **11.2 Invite user flow** — Invite by email via SendGrid. Creates User + ChurchMember (PENDING). Invitation link with JWT token. Accept-invite page. *(2026-03-10)*
- [x] **11.3 Change user role** — Role dropdown with custom roles (not fixed enum). Priority-based: can only assign roles with lower priority than own. *(2026-03-10)*
- [x] **11.4 Deactivate user** — ChurchMember.status: ACTIVE/INACTIVE/PENDING. Deactivate/reactivate UI actions. *(2026-03-10)*
- [x] **11.5 Connect to Person records** — Link/Unlink person API endpoints. Auto-link on invite by email. *(2026-03-10)*
- [x] **11.6 Role-based UI gating** — Sidebar items gated by `requiredPermission`. Session includes `permissions[]` array from JWT. *(2026-03-10)*
- [x] **11.7 Role-based API gating** — `requireApiAuth('permission.string')` checks JWT-cached permissions. All API routes audited and gated. *(2026-03-10)*
- [x] **11.8 Custom roles CRUD** — `/cms/admin/roles` page + `/api/v1/member-roles/` API. System roles (Owner, Admin, Editor, Viewer) + custom roles. Color + icon per role. *(2026-03-10)*
- [x] **11.9 Centralized onboarding** — `/cms/onboarding` for PENDING members. `POST /api/v1/auth/complete-onboarding` with atomic activation. Dashboard checks memberStatus. WelcomeBanner with localStorage dismissal. *(2026-03-10)*

---

### 12. Login & Sign-Up (P1)

Expand auth beyond admin-only to support member login.

- [ ] **12.1 Public sign-up page** — `/sign-up` page for church members (not CMS admins). Creates User with no ChurchMember role (member-only access).
- [ ] **12.2 Email verification** — Send verification email on sign-up. Block login until verified. Schema has `emailVerified` field.
- [ ] **12.3 Member portal** — `/member` dashboard after login showing: my profile, my groups, prayer requests, giving history (future).
- [x] **12.4 Choose email provider** — **SendGrid** integrated via `lib/email/send-email.ts`. Used for form notifications, user invitations, password reset. *(2026-03-10)*
- [ ] **12.5 2FA (optional)** — Schema has `twoFactorEnabled` and `twoFactorSecret`. Implement TOTP-based 2FA for admin accounts.

---

### 13. Transcript AI Workflow (P1)

Frontend UI is built but backend is stubbed with mocks. Three AI workflows defined in `docs/transcript-ai-flows.md`.

- [ ] **13.1 Configure Azure OpenAI** — Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT in env.
- [ ] **13.2 YouTube caption import** — Wire `GET /api/v1/youtube/captions` to actually call YouTube Data API v3. Requires YOUTUBE_API_KEY.
- [ ] **13.3 AI transcript alignment** — Wire `POST /api/v1/ai/align-transcript` to call Azure OpenAI. Takes raw text + video duration → returns timestamped segments.
- [ ] **13.4 AI caption cleanup** — Wire `POST /api/v1/ai/cleanup-captions` to clean up YouTube auto-captions (punctuation, capitalization, paragraph breaks).
- [x] **13.5 Whisper transcription** — `POST /api/v1/ai/transcribe` calls `generateTranscriptFromAudio()` via Azure OpenAI. Returns 503 if unconfigured.
- [ ] **13.6 Test end-to-end** — Upload a video → generate transcript → align timestamps → save → verify on public site.

---

### 14. Video Clipping (P1)

Not yet designed or implemented. Needed for creating shareable sermon clips.

- [ ] **14.1 Define requirements** — What is a clip? A time range within a sermon video (start/end timestamps) with optional title and description.
- [ ] **14.2 Schema design** — New `VideoClip` model: messageId, title, startTime, endTime, thumbnailUrl, shareUrl, status.
- [ ] **14.3 Clipping UI in CMS** — In the message editor video tab: "Create Clip" button → set start/end time on video player → title → save.
- [ ] **14.4 Clip generation backend** — Options:
  - FFmpeg server-side (extract segment, transcode, upload to R2)
  - Client-side (use YouTube embed with start/end params — no server processing needed for YouTube videos)
  - Third-party API (Mux, Cloudflare Stream)
- [ ] **14.5 Clip sharing** — Public URL `/clips/[id]` that embeds just the clip segment. OG tags for social sharing.
- [ ] **14.6 Clip gallery** — Public page showing all clips, filterable by series/speaker.

---

### 15. Announcements CMS (P1)

Schema and DAL exist but no CMS page.

- [ ] **15.1 Announcements list page** — `/cms/announcements` with data table. Columns: title, date range, priority, status, pinned.
- [ ] **15.2 Create/edit announcement** — Form with: title, body (rich text), start date, end date, priority (LOW/MEDIUM/HIGH/URGENT), pinned toggle, cover image.
- [ ] **15.3 Auto-expiration** — Announcements past their end date auto-archive (cron or on-read filter).
- [ ] **15.4 Wire to website** — ANNOUNCEMENTS_LIST section type should pull from DAL and render active announcements.

---

### 16. CMS Dashboard (P1)

Dashboard is fully implemented with health monitoring and activity feed.

- [x] **16.1 Quick actions widget** — Dashboard exists at `/cms/dashboard`.
- [x] **16.2 Content health widget** — Color-coded cards (green/yellow/red/neutral) for messages, events, pages, media with stale content flags.
- [x] **16.3 Upcoming events widget** — Upcoming events list on dashboard.
- [x] **16.4 Recent activity feed** — Top 10 recent updates across messages/events/pages sorted by updatedAt.
- [x] **16.5 At-a-glance stats** — Count cards with total/published/draft breakdown for messages, events, pages, videos.

---

## P2: Post-Launch Medium Priority

Ship when capacity allows.

---

### 17. Cloudflare CDN Setup (P2)

Configure Cloudflare as CDN and security layer in front of the hosting provider. Full guide in `docs/cloudflare-cdn-setup.md`.

- [ ] **16.1 Add domain to Cloudflare** — Add `laubf.org` to Cloudflare (free plan). Update nameservers at registrar.
- [ ] **16.2 SSL mode** — Set to "Full (Strict)". Install Cloudflare Origin CA certificate on the origin server (Vercel handles this automatically if using Vercel).
- [ ] **16.3 Cache rules** — Configure via Cloudflare dashboard or API:
  - `/_next/static/*` → Cache Everything, Edge TTL 1 year (immutable hashed assets)
  - `*.jpg, *.png, *.webp, *.avif, *.svg, *.woff2` → Cache Everything, Edge TTL 30 days
  - `/api/*` → Bypass Cache (dynamic API responses)
  - `/cms/*` → Bypass Cache (admin pages, authenticated)
  - Everything else (HTML pages) → Standard caching, Edge TTL 1 hour, Browser TTL 0 (revalidate)
- [ ] **16.4 Security settings:**
  - Enable Bot Fight Mode (blocks known bad bots)
  - Add WAF rule: block non-GET requests to `/api/auth/*` from known bot ASNs
  - Enable "Under Attack Mode" toggle (for emergencies only)
  - Enable "Always Use HTTPS" redirect
- [ ] **16.5 Performance settings:**
  - Enable Auto Minify (HTML, CSS, JS)
  - Enable Brotli compression
  - **Disable Rocket Loader** (breaks React/Next.js hydration)
  - Enable Early Hints (103)
  - Enable HTTP/3
- [ ] **16.6 DNS records** — Configure:
  - `@` (root) → hosting provider IP/CNAME (proxied through Cloudflare)
  - `admin` → same origin (proxied)
  - `cdn` → R2 public bucket URL (if using custom CDN domain for media)
- [ ] **16.7 Page rules (if needed):**
  - `laubf.org/cms/*` → Bypass Cache, Security Level High
  - `laubf.org/api/v1/*` → Bypass Cache
- [ ] **16.8 Test cache headers** — Use `curl -I https://laubf.org/` and verify `cf-cache-status: HIT` on static assets, `BYPASS` on API/CMS routes.

<details>
<summary>AI Prompt: Cloudflare CDN Configuration</summary>

```
Configure Cloudflare CDN for laubf.org. The site is a Next.js app with:
- Public website at laubf.org (cacheable HTML + static assets)
- CMS admin at admin.laubf.org (never cache, authenticated)
- API at laubf.org/api/* (never cache, dynamic)
- Static assets at /_next/static/* (immutable, cache forever)
- Images served via Next.js Image optimization (WebP/AVIF, cache at edge)
- Media files on R2 (already have CDN via R2 public access)

Cloudflare free plan is sufficient. Key settings:
1. SSL: Full (Strict)
2. Cache rules:
   - /_next/static/* → 1 year edge TTL
   - Images/fonts → 30 day edge TTL
   - /api/*, /cms/* → Bypass
   - HTML → 1 hour edge, 0 browser (stale-while-revalidate)
3. Security: Bot Fight Mode ON, Rocket Loader OFF
4. Performance: Brotli ON, HTTP/3 ON, Early Hints ON

Next.js config should set Cache-Control headers:
- Static assets: public, max-age=31536000, immutable (Next.js does this by default)
- API responses: no-store or private, no-cache
- HTML pages: public, s-maxage=3600, stale-while-revalidate=86400

Reference: docs/cloudflare-cdn-setup.md for full configuration guide.
```
</details>

---

### 18. Website Builder v2 — Full-Screen Canvas (P2)

The ambitious WYSIWYG builder. Not a launch blocker but significantly improves the editing experience. 48 tasks across 9 phases documented in `docs/00_dev-notes/development-status.md`.

- [ ] **18.1 Builder shell** — Full-screen layout with sidebar (page tree + section list), canvas (iframe or inline render), and floating toolbar.
- [ ] **18.2 Canvas rendering** — Live preview of the page using actual section components.
- [ ] **18.3 Section selection** — Click a section in canvas to select → show floating toolbar (move up/down, edit, duplicate, delete, visibility).
- [ ] **18.4 Drag-and-drop reorder** — Drag sections in sidebar or canvas to reorder.
- [ ] **18.5 Inline text editing** — Click text in canvas to edit directly (contentEditable → sync to TipTap JSON).
- [ ] **18.6 Device preview** — Desktop (100%), tablet (768px), mobile (375px) mode switcher.
- [ ] **18.7 Undo/redo** — In-memory state history (50 snapshots max) per architecture doc.
- [ ] **18.8 Auto-save** — 30-second debounce auto-save with manual Ctrl+S override.

---

### 19. Messages List Enhancements (P2)

Bulk actions UI exists but handlers aren't wired.

- [ ] **19.1 Wire bulk publish** — Select multiple messages → "Publish" → batch update status.
- [ ] **19.2 Wire bulk archive** — Select → "Archive" → batch update.
- [ ] **19.3 Wire bulk delete** — Select → "Delete" → confirmation → batch soft-delete.
- [ ] **19.4 Speaker filter** — Combobox filter in toolbar.
- [ ] **19.5 Series filter** — Combobox filter in toolbar.
- [ ] **19.6 Bible book filter** — Filter messages by book from passage field.
- [ ] **19.7 Mobile card view** — Responsive layout for narrow screens (cards instead of table).

---

### 20. Event Enhancements (P2)

- [ ] **20.1 Event sharing** — Shareable link, Google Calendar add, Apple Calendar add (.ics file).
- [ ] **20.2 Duplicate event** — Wire the existing menu option to actually clone an event.
- [ ] **20.3 Preview before publish** — Side-by-side preview of event detail page.
- [ ] **20.4 Event form field gaps** — Add slug, shortDescription, campus, tags, image alt text, image object position to form.

---

### 21. SEO & Performance (P2)

- [ ] **21.1 Sitemap generation** — Auto-generated `sitemap.xml` from all published pages, messages, events, bible studies.
- [ ] **21.2 Structured data (JSON-LD)** — Church schema, Event schema, VideoObject schema on relevant pages.
- [ ] **21.3 301 redirects** — Admin UI for managing URL redirects (old laubf.org URLs → new paths).

---

### 22. Media Library Enhancements (P2)

- [ ] **22.1 Usage tracking** — "Where is this used?" panel showing which pages/sections/messages reference a media asset.
- [ ] **22.2 Bulk metadata editing** — Select multiple items → edit alt text, tags, folder in batch.
- [ ] **22.3 Image editor** — Basic crop/resize before upload.
- [ ] **22.4 Google Photos sync** — OAuth flow to connect Google Photos account, import albums. UI stub exists but no backend.

---

### 23. Ministry & Campus Pages (P2)

Not yet built. Schema (Ministry, Campus models) exists.

- [ ] **23.1 Ministry list page** — `/cms/ministries` (separate from people/ministries — this is for public-facing ministry pages).
- [ ] **23.2 Ministry detail editor** — Hero image, description (rich text), leadership (linked Person records), events, contact info.
- [ ] **23.3 Campus detail editor** — Similar structure for multi-campus churches.
- [ ] **23.4 Wire to website** — Ministry and campus pages auto-generated from DB, rendered via section types.

---

### 24. Prayer Requests (P2)

Feature flag exists (`SiteSettings.enablePrayerRequests`) but no model or UI.

- [ ] **24.1 Schema** — New `PrayerRequest` model: churchId, authorId (optional), title, body, isAnonymous, status (ACTIVE/ANSWERED/ARCHIVED), prayerCount, createdAt.
- [ ] **24.2 Public submission form** — Accessible from website (if feature enabled). Anonymous or logged-in submission.
- [ ] **24.3 CMS moderation** — `/cms/prayer` page to review, approve, archive prayer requests.
- [ ] **24.4 Public prayer wall** — Website section showing approved requests with "I prayed" button.

---

### 25. Notification System (P2)

- [ ] **25.1 Choose email provider** — Resend recommended. Set up account and API key.
- [ ] **25.2 Transactional emails** — Password reset, email verification, user invitation templates.
- [ ] **25.3 In-app notifications** — Bell icon in CMS header. Notification model (type, message, read, link). Show: stale content flags, new form submissions, user invites.
- [ ] **25.4 Email digests** — Weekly summary of content health, new submissions, upcoming events.

---

### 26. Testing (P2)

Zero tests exist currently.

- [ ] **26.1 Unit tests** — Test critical DAL functions (message CRUD, event filtering, storage quota).
- [ ] **26.2 API integration tests** — Test all 66 API endpoints with proper auth headers.
- [ ] **26.3 E2E tests** — Playwright tests for: login, create message, create event, upload media, edit page.
- [ ] **26.4 CI pipeline** — GitHub Actions: lint → type-check → test → build on every PR.

---

## P3: Future / Platform

Not needed for LA UBF launch. Required for scaling to multiple churches.

---

### 27. Multi-Tenant Middleware (P3)

Currently single-tenant via `CHURCH_SLUG` env var.

- [ ] **27.1 Hostname-based routing** — Middleware detects subdomain or custom domain → resolves to churchId → sets `x-tenant-id` header.
- [ ] **27.2 Custom domain resolution** — Lookup `CustomDomain` table by hostname → resolve to church.
- [ ] **27.3 Redis caching** — Cache domain→church mappings in Upstash Redis (5-min TTL).
- [ ] **27.4 PostgreSQL Row-Level Security** — Enable RLS on all tenant-scoped tables. Set `app.current_church_id` per request.

---

### 28. Billing & Subscriptions (P3)

- [ ] **28.1 Stripe integration** — Connect Stripe account, configure products/prices for Free/Starter/Pro tiers.
- [ ] **28.2 Checkout flow** — Church admin clicks "Upgrade" → Stripe Checkout → webhook updates subscription.
- [ ] **28.3 Feature gating** — `canAccessFeature(church, feature)` function checks plan tier + feature flags.
- [ ] **28.4 Billing page** — `/cms/settings/billing` showing current plan, usage, invoices.
- [ ] **28.5 Superadmin billing dashboard** — Revenue, MRR, churn, plan distribution.

---

### 29. Onboarding Flow (P3)

- [ ] **29.1 Church registration** — Sign up → create church → choose template → configure basics.
- [ ] **29.2 Setup wizard** — Step-by-step: church info → template → logo/colors → modules → invite team.
- [ ] **29.3 Demo content** — Pre-populate sample messages, events, pages so the site isn't empty.

---

### 30. Superadmin Console (P3)

- [ ] **30.1 Church list** — All churches with plan, status, MRR, last login.
- [ ] **30.2 Church detail** — Profile, subscription, usage, members, feature flags, audit log.
- [ ] **30.3 Impersonation** — "Login as church" with signed JWT, yellow banner, full audit logging.
- [ ] **30.4 Support tickets** — In-CMS ticket submission, superadmin queue, conversation threads.

---

### 31. Content Generalization (P3)

Make LA UBF-specific models work for any church.

- [ ] **31.1 Feature flags** — `Church.featureFlags` JSON field controlling which modules are enabled.
- [ ] **31.2 Configurable labels** — "Sermons" vs "Messages" vs "Teachings" — per-church content type labels.
- [ ] **31.3 Dynamic CMS sidebar** — Show/hide menu items based on enabled modules.
- [ ] **31.4 Website templates** — Template selection during onboarding, multiple starter layouts.

---

## Recommended Execution Order

### Phase 1: Pre-Launch Sprint (P0 items)
1. Church Profile & Seed Data (#1)
2. Database Cleanup (#3)
3. Domain Routing & Route Group Restructure (#5)
4. Image Pipeline & WebP (#6)
5. Auth Hardening (#8)
6. Visit Us / Contact Form (#10) — quick win, schema exists
7. Public Website UI Fixes (#4)
8. Website Builder Fixes (#2)
9. Daily Bread Page (#9)
10. Production Deployment (#7)

### Phase 2: Post-Launch Sprint (P1 items)
~~11. User Management & Roles (#11) — DONE (2026-03-10)~~
12. Login & Sign-Up (#12) — public sign-up, email verification, member portal
~~13. CMS Dashboard (#16) — DONE (2026-03-10)~~
14. Announcements CMS (#15)
15. Transcript AI Workflow (#13)
16. Video Clipping (#14)

### Phase 3: Polish (P2 items)
17-26. Cloudflare CDN, builder v2, list enhancements, events, SEO, media, ministries, prayer, notifications, testing — as capacity allows.

### Phase 4: Platform (P3 items)
27-31. Multi-tenant, billing, onboarding, superadmin, content generalization — when ready for church #2.

---

## Dependencies & Blockers

| Task | Blocked By | Notes |
|------|-----------|-------|
| Domain Routing (#5) | None | Should be done early — changes all URL paths |
| Image Pipeline (#6) | R2 media bucket configured | Need actual images uploaded |
| Production Deployment (#7) | #1, #3, #5, #6, #8 | Can't deploy with wrong data/routes |
| Daily Bread (#9) | Route group restructure (#5) | Page path depends on `/(website)` |
| ~~Visit Us Form (#10)~~ | ~~None~~ | **DONE** (2026-03-10) |
| ~~Contact Form Email (#10.2)~~ | ~~Email Provider (#25.1)~~ | **DONE** — SendGrid integrated |
| ~~User Management (#11)~~ | ~~Auth Hardening (#8)~~ | **DONE** (2026-03-10) |
| Login & Sign-Up (#12) | Email Provider (#25.1) | Need transactional email for verification |
| Transcript AI (#13) | Azure OpenAI, YouTube API key | External service config |
| Video Clipping (#14) | Requirements definition | Need to decide approach first |
| Cloudflare CDN (#17) | Production Deployment (#7) | Need live domain to configure |
| Multi-Tenant (#27) | Production Deployment (#7) | Need single-tenant running first |
| Billing (#28) | Multi-Tenant (#27) | Need multi-tenant before billing |

---

## Quick Wins (< 1 day each)

These small tasks can be knocked out quickly between larger work:

- [ ] Wire bulk action handlers on messages list (publish/archive/delete)
- [x] ~~Add "View Page" button in website builder → opens public URL~~ (done in 2.7)
- [ ] Add sitemap.xml generation
- [ ] Set up Sentry error tracking
- [ ] Add `robots.txt` for SEO
- [x] ~~Verify 404 page renders correctly for invalid slugs~~ (done in 4.8)
- [ ] Wire AuditLog writes on CMS create/edit/delete actions
- [ ] Add loading skeletons to CMS pages that flash blank
- [ ] Add `sizes` prop to `<Image>` components for responsive srcset
- [ ] Configure `images.formats: ['image/avif', 'image/webp']` in next.config.ts
