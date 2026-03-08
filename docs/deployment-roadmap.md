# Deployment Roadmap

Generated: 2026-03-07
Last updated: 2026-03-07

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
| Contact form / Visit Us (public form, API, CMS viewer) | ~30% complete (form UI done, API TODO) |
| CMS core (Messages, Events, Media, People) | ~85% complete |
| Website rendering (42 section types, theme, fonts) | ~95% complete |
| Website builder v1 (pages, sections, menus, domains) | 100% complete |
| Authentication (Google SSO + credentials) | ~80% complete |
| R2 storage (attachments + media) | 100% complete |
| Database (32 models, 22 enums, seed data) | ~90% complete |
| API routes (66 endpoints) | ~95% complete |
| People management (members, groups, roles, households) | ~90% complete |
| Production deployment | 0% |
| Multi-tenant platform | 0% |

---

## P0: Launch Blockers

These must be completed before LA UBF can go live.

---

### 1. Church Profile & Metadata (P0)

The Church model and SiteSettings have correct schemas but the seed data has placeholder values. The public website reads from these for navbar, footer, OG tags, and contact info.

- [ ] **1.1 Audit current seed data** — Review `prisma/seed.mts` for Church and SiteSettings fields. Document which values are wrong/placeholder.
- [ ] **1.2 Update Church record** — Correct: name ("Los Angeles UBF"), address (actual street address), city/state/zip, phone, email, timezone ("America/Los_Angeles"), logoUrl, faviconUrl, accentColor.
- [ ] **1.3 Update SiteSettings record** — Correct: siteName, tagline, description, logo, favicon, ogImage, email, phone, address, all social URLs (Facebook, Instagram, YouTube, etc.), service times JSON.
- [ ] **1.4 Wire Church profile to website metadata** — Verify `generateMetadata()` in `app/website/layout.tsx` and the catch-all page use SiteSettings for OG tags, site title, description.
- [ ] **1.5 Wire service times** — Ensure ServiceTimesSection or footer renders actual service times from SiteSettings (not hardcoded).
- [ ] **1.6 Update seed script** — Make `prisma/seed.mts` produce correct LA UBF data so server deploy + seed works out of the box.
- [ ] **1.7 Test CMS church profile editor** — Verify `/cms/church-profile` saves and the public website reflects changes immediately (no cache stale).

---

### 2. Website Builder Overhaul (P0)

The v1 list-based builder works for CRUD but the editing experience needs fixes. The v2 full-screen canvas builder is not a launch blocker — v1 with fixes is sufficient.

- [ ] **2.1 Audit section editability** — For each of the 42 section types, determine which fields in `PageSection.content` JSON are editable vs auto-populated from dataSource. Document in a table.
- [ ] **2.2 Build structured section editors** — Replace the raw JSON editor with type-specific forms for the most common section types:
  - [ ] HERO_BANNER (heading, subheading, CTA text/url, background image)
  - [ ] TEXT_BLOCK / RICH_TEXT (TipTap rich text editor)
  - [ ] TEXT_IMAGE_SPLIT (text + image URL + layout direction)
  - [ ] CALL_TO_ACTION (heading, body, button text/url)
  - [ ] IMAGE_GALLERY (image URLs array)
  - [ ] CONTACT_INFO (address, phone, email, map embed)
  - [ ] SERVICE_TIMES (pull from SiteSettings or allow override)
  - [ ] CUSTOM_HTML (code editor textarea)
- [ ] **2.3 Fix dataSource sections** — Sections like LATEST_SERMONS, UPCOMING_EVENTS, ANNOUNCEMENTS_LIST should be read-only in the builder (no content to edit — they pull from DB). Show a clear "This section auto-populates from [Messages/Events/etc.]" message instead of a blank editor.
- [ ] **2.4 Section visibility toggle** — Verify the `visible` toggle on each section works and immediately hides/shows on the public site.
- [ ] **2.5 Section reordering** — Verify drag-to-reorder persists correctly (sortOrder field).
- [ ] **2.6 Add/remove sections** — Verify section picker → add → renders correctly, and delete removes cleanly.
- [ ] **2.7 Preview link** — Add a "View Page" button that opens the public website URL for the page being edited.

---

### 3. Database Cleanup (P0)

Remove deprecated columns and fix schema issues identified during development.

- [ ] **3.1 Audit unused columns** — Check for:
  - `Message.legacyId`, `BibleStudy.legacyId` — migration artifacts, safe to drop if no code references them
  - `Church.settings` JSON field — determine if anything reads it vs using SiteSettings
  - `ContentTag` model — tag system never wired, decide: keep for future or drop
  - `ApiKey` model — not implemented, decide: keep for future or drop
- [ ] **3.2 Create migration for column drops** — `npx prisma migrate dev --name cleanup-deprecated-columns`
- [ ] **3.3 Event schema gaps** — From Feb 2026 analysis:
  - [ ] Add `directionsUrl` field to Event (or verify it exists)
  - [ ] Add `monthlyRecurrenceType` enum if not present
  - [ ] Verify slug, shortDescription, campus, tags fields exist on Event
- [ ] **3.4 Clean up seed data** — Remove any seed entries that create orphaned records or reference deleted columns.
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
- [ ] **4.2 Fix empty paragraph rendering** — Verify the `<p><br></p>` fix in `tiptapJsonToHtml()` works across all content areas.
- [ ] **4.3 Fix font rendering** — Verify serif fonts (Times New Roman) display correctly for pre-2016 Bible studies, and sans-serif (Calibri/Arial) for post-2016.
- [ ] **4.4 Mobile responsiveness** — Test all pages at 375px, 768px, 1024px widths.
- [ ] **4.5 Image loading** — Verify all images load from R2 URLs (no broken images, correct `next.config.ts` remotePatterns).
- [ ] **4.6 Navigation** — Verify header menu links work, footer links work, mobile menu opens/closes, external links open in new tab.
- [ ] **4.7 SEO basics** — Verify `<title>`, `<meta description>`, OG tags render on every page type. Check with `curl -s URL | grep '<meta'`.
- [ ] **4.8 404 page** — Verify invalid slugs return a proper 404 page, not an error.
- [ ] **4.9 Fix ContactSubmission persistence** — See dedicated section #10 (Visit Us / Contact Form) for full scope.

---

### 5. Domain Routing & Route Group Restructure (P0)

The public website currently lives at `/website/*` (a regular directory). For launch, it must serve at the root of `laubf.org` and the CMS admin must be at `admin.laubf.org`. This requires converting the directory structure to route groups and adding hostname-based middleware.

**Current state:** `app/website/` is a regular directory → pages render at `/website/...`. No `middleware.ts` exists.

**Target state:** `laubf.org/` serves the public site, `admin.laubf.org/` serves the CMS.

- [ ] **5.1 Convert `app/website/` to route group `app/(website)/`** — Rename the directory so its routes render at `/` instead of `/website/`. All internal files stay the same. Update any imports that reference `app/website/`.
- [ ] **5.2 Verify CMS routes** — `app/cms/` already uses `(dashboard)` route group internally. Ensure `/cms/*` routes still work after the website route group change.
- [ ] **5.3 Create `middleware.ts`** — Root middleware that inspects `request.headers.get('host')`:
  - `admin.laubf.org` (or `localhost:3000/cms`) → allow through to `/cms/*` routes
  - `laubf.org` (or `localhost:3000`) → allow through to `/(website)` routes
  - Block public access to `/cms/*` on the main domain (redirect to `admin.laubf.org`)
  - Pass through `/api/*` routes on both domains
- [ ] **5.4 Update `next.config.ts`** — Add rewrites or redirects if needed for the domain split. Configure `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_ADMIN_URL` env vars.
- [ ] **5.5 Update internal links** — Search codebase for any hardcoded `/website/` prefixes in links, redirects, or `href` values. Update to `/`.
- [ ] **5.6 Update seed data** — Any PageSection content or MenuItem `href` values that reference `/website/...` must be updated to `/...`.
- [ ] **5.7 Handle localhost development** — Middleware must work in dev mode where both sites run on `localhost:3000`. Options:
  - Path-based fallback: `/cms/*` for admin, everything else for website
  - Or use `admin.localhost:3000` with hosts file entry
- [ ] **5.8 Test both domains** — Verify: public site loads at root, CMS loads at admin subdomain, API routes accessible from both, auth cookies work across subdomains.

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

- [ ] **6.1 Audit all image sources** — Search `components/website/` for `<img` tags (raw HTML) and `<Image` (Next.js). Identify any raw `<img>` tags that bypass Next.js optimization.
  - Known: `components/website/sections/all-messages-client.tsx` uses raw `<img>`
- [ ] **6.2 Replace raw `<img>` with `<Image>`** — Convert all raw `<img>` tags in website components to Next.js `<Image>`. This automatically serves WebP/AVIF to supporting browsers.
- [ ] **6.3 Audit placeholder images** — Search seed data and PageSection content for Unsplash URLs or non-R2 image sources. Replace with actual LA UBF images uploaded to R2.
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
- [ ] **6.8 Handle user-uploaded images** — When users upload PNG/JPG via CMS media library, the original format is stored in R2. Next.js `<Image>` automatically converts on-the-fly when serving. No server-side pre-conversion needed.
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

- [ ] **7.1 Choose hosting** — Decision: Vercel (recommended per docs) or Azure VM with Caddy.
  - Vercel: simpler, native Next.js support, auto-SSL, ~$20/mo
  - Azure VM: more control, existing infrastructure, requires manual setup
- [ ] **7.2 Set up production database** — Neon (recommended) or continue PostgreSQL 18 on VM.
  - [ ] Create production database
  - [ ] Run `prisma migrate deploy`
  - [ ] Run `npx prisma db seed`
  - [ ] Verify data integrity
- [ ] **7.3 Configure R2 for production** — Verify R2 buckets, CORS rules, lifecycle rules, and public URLs are correct for production domain (not localhost).
- [ ] **7.4 Environment variables** — Set all env vars in production:
  - DATABASE_URL, DIRECT_URL
  - AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, NEXTAUTH_URL
  - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_*_BUCKET_NAME, R2_*_PUBLIC_URL
  - CHURCH_SLUG=la-ubf
  - NEXT_PUBLIC_SITE_URL=https://laubf.org
  - NEXT_PUBLIC_ADMIN_URL=https://admin.laubf.org
- [ ] **7.5 DNS setup** — Configure:
  - `laubf.org` → hosting provider (A record or CNAME)
  - `admin.laubf.org` → same hosting provider (CNAME)
  - Cloudflare proxy if using CDN layer
- [ ] **7.6 SSL certificate** — Auto-provisioned by Vercel, or configure Caddy/Let's Encrypt on VM. Must cover both `laubf.org` and `admin.laubf.org`.
- [ ] **7.7 Build & deploy** — `npx prisma generate && next build` → deploy.
- [ ] **7.8 Smoke test production** — Visit every page, test CMS login, test file upload, test form submission.
- [ ] **7.9 Error tracking** — Set up Sentry (free tier: 5K errors/mo). Add `@sentry/nextjs` to project.

---

### 8. Auth Hardening (P0)

Current auth works for Google SSO + credentials but is missing critical flows for production.

- [ ] **8.1 Password reset flow** — Implement forgot password → email token → reset password page.
- [ ] **8.2 Secure session config** — Verify cookies are httpOnly, secure, sameSite=lax in production. Cookie domain must be `.laubf.org` to work across `laubf.org` and `admin.laubf.org`.
- [ ] **8.3 Rate limiting on login** — Prevent brute force on `/api/auth/callback/credentials`. Use simple in-memory counter or Upstash rate limiter.
- [ ] **8.4 CSRF protection** — Verify NextAuth CSRF token is working (should be automatic).
- [ ] **8.5 Logout** — Verify signOut() clears session and redirects to login page.

---

### 9. Daily Bread Page (P0/P1)

The Daily Bread section component (`DAILY_BREAD_FEATURE`) and DAL (`lib/dal/daily-bread.ts`) are fully implemented. The `DailyBread` model exists in the database. What's missing: a dedicated `/daily-bread` page on the public site (not just the homepage section), CMS management UI, and seed data.

**Reference implementation:** `laubf-test/src/components/daily-bread/DailyBreadDetailPage.tsx` — resizable split-pane with scripture sidebar, audio player, and devotional body text.

- [ ] **9.1 Create public daily bread page** — `app/(website)/daily-bread/page.tsx` that fetches today's daily bread via `getTodaysDailyBread(churchId)` and renders the detail view.
- [ ] **9.2 Port the detail view component** — Create `components/website/daily-bread/daily-bread-detail.tsx` based on `laubf-test/src/components/daily-bread/DailyBreadDetailPage.tsx`. Key features to preserve:
  - Resizable split-pane layout (scripture left, devotional right) on desktop
  - Collapsible scripture text section
  - Audio player with playback speed (1x, 1.25x, 1.5x, 2x), rewind 10s, progress bar
  - Mobile: scripture section inline (no sidebar)
  - "Daily Bread" badge with date, title, passage, author
  - Link to external UBF daily bread archive
- [ ] **9.3 Wire the homepage section** — Verify the `DAILY_BREAD_FEATURE` section type on the homepage calls `getTodaysDailyBread()` via `resolve-section-data.ts` and renders a summary card linking to `/daily-bread`.
- [ ] **9.4 Seed daily bread data** — Add sample DailyBread entries to `prisma/seed.mts` (at least today's date + a few past entries) so the page has content on first deploy.
- [ ] **9.5 CMS daily bread management** — `/cms/daily-bread` page for CRUD. Alternatively, integrate into existing messages workflow or add a simple form:
  - Date picker (one entry per day, unique constraint)
  - Passage input (e.g., "Psalm 2:1-12")
  - Key verse input
  - Body (rich text editor)
  - Bible text (auto-populated from BibleVerse DB, or manual paste)
  - Author
  - Audio URL (optional)
  - Status (DRAFT/PUBLISHED)
- [ ] **9.6 Daily bread data source** — Determine where daily bread content comes from:
  - Option A: Manual entry via CMS (full control, more work for admin)
  - Option B: Import from ubf.org API/RSS (if available — automate daily)
  - Option C: Hybrid — auto-import with manual override
- [ ] **9.7 Add to navigation** — Add "Daily Bread" link to header menu under a "Resources" dropdown (matches laubf-test nav structure).

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

The public website has a "Visit Us" form section (`FormSection` component) that collects visitor info (name, email, phone, interests, campus, comments, bible teacher request). The form UI is fully built and submits to `POST /api/v1/form-submissions`, but **the API route only logs to console — it doesn't persist to the database**. The `ContactSubmission` model exists in the Prisma schema with all needed fields (`formType`, `name`, `email`, `phone`, `fields` JSONB, `isRead`, `assignedTo`, `notes`). No CMS page exists to view submissions.

**What exists:**
- `components/website/sections/form-section.tsx` — Full form UI (name, email, phone, interests, campus, comments, bible teacher checkbox)
- `app/api/v1/form-submissions/route.ts` — API route (has TODO, only `console.log`s)
- `prisma/schema.prisma` — `ContactSubmission` model with indexes on `churchId+isRead`, `churchId+formType`, `churchId+createdAt`
- Section is already wired in the website builder section catalog

**What's missing:**

- [ ] **10.1 Fix form submission persistence** — Update `POST /api/v1/form-submissions` to write to `ContactSubmission` table via Prisma:
  - Map form fields: `name` = `${firstName} ${lastName}`, `email`, `phone`, `formType` = `"visit-us"`
  - Store extra fields (`interests`, `otherInterest`, `campus`, `otherCampus`, `comments`, `bibleTeacher`) in the `fields` JSONB column
  - Return the created submission ID in the response
- [ ] **10.2 Email notification on submission** — When a form is submitted, send an email to the church's contact email (from `SiteSettings.email` or a configurable recipient):
  - Use email provider (Resend recommended — see #24.1) or fall back to a simple SMTP/Nodemailer setup
  - Email template: "New Visit Us Form Submission" with all submitted fields formatted in a readable layout
  - Include a direct link to the CMS submission detail page (e.g., `admin.laubf.org/cms/form-submissions/[id]`)
  - Consider a simple env var `NOTIFICATION_EMAIL` for MVP (no email provider dependency)
- [ ] **10.3 CMS form submissions list page** — `/cms/form-submissions` (or `/cms/submissions`):
  - Data table with columns: Name, Email, Date, Read/Unread status, Interests summary
  - Filter by: read/unread, date range, form type
  - Sort by: date (default newest first), name
  - Bulk mark as read/unread
  - Add to CMS sidebar under a "Forms" or "Submissions" menu item
- [ ] **10.4 CMS submission detail view** — Click a submission row to see full details:
  - All submitted fields displayed in a clean layout
  - Mark as read/unread toggle
  - Internal notes field (staff can add notes about follow-up)
  - Assign to a team member (dropdown of ChurchMember records)
  - Delete submission
- [ ] **10.5 DAL module** — Create `lib/dal/form-submissions.ts`:
  - `listSubmissions(churchId, filters)` — Cursor-paginated list with read/unread/formType/date filters
  - `getSubmission(churchId, id)` — Single submission with all fields
  - `markAsRead(churchId, id)` / `markAsUnread(churchId, id)`
  - `updateNotes(churchId, id, notes)`
  - `assignSubmission(churchId, id, assignedTo)`
  - `deleteSubmission(churchId, id)` — Hard delete
  - `getUnreadCount(churchId)` — For sidebar badge
- [ ] **10.6 API routes** — `app/api/v1/form-submissions/`:
  - `GET /` — List submissions (paginated, filtered)
  - `GET /[id]` — Single submission
  - `PATCH /[id]` — Update read status, notes, assignment
  - `DELETE /[id]` — Delete submission
  - `POST /[id]/mark-read` — Quick mark as read
- [ ] **10.7 Unread badge in CMS sidebar** — Show count of unread submissions next to "Submissions" menu item (red badge, like email inbox).
- [ ] **10.8 Reply-by-email (optional)** — Add a "Reply" button in the CMS detail view that opens a compose dialog and sends an email response to the submitter from the church's email address. This requires an email provider with sending capability.

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

### 11. User Management & Roles (P1)

The ChurchMember model exists with OWNER/ADMIN/EDITOR/VIEWER roles, but there's no admin UI for managing users.

- [ ] **11.1 User list page** — `/cms/settings/users` showing all ChurchMember records for the church. Columns: name, email, role, last login, status.
- [ ] **11.2 Invite user flow** — Button to invite by email. Creates User + ChurchMember record. Sends invitation email (or shows a link to share).
- [ ] **11.3 Change user role** — Dropdown to change ADMIN/EDITOR/VIEWER. Only OWNER can promote to ADMIN.
- [ ] **11.4 Deactivate user** — Soft-disable a user's access without deleting their account.
- [ ] **11.5 Connect to Person records** — Link ChurchMember (auth user) to Person (member directory) so logged-in members see their profile.
- [ ] **11.6 Role-based UI gating** — Hide CMS sidebar items based on role:
  - VIEWER: read-only access to all content
  - EDITOR: can edit content but not settings/users
  - ADMIN: full access except ownership transfer
  - OWNER: full access including billing and ownership
- [ ] **11.7 Role-based API gating** — `requireApiAuth()` already accepts roles. Audit all API routes to ensure correct role requirements.

---

### 12. Login & Sign-Up (P1)

Expand auth beyond admin-only to support member login.

- [ ] **12.1 Public sign-up page** — `/sign-up` page for church members (not CMS admins). Creates User with no ChurchMember role (member-only access).
- [ ] **12.2 Email verification** — Send verification email on sign-up. Block login until verified. Schema has `emailVerified` field.
- [ ] **12.3 Member portal** — `/member` dashboard after login showing: my profile, my groups, prayer requests, giving history (future).
- [ ] **12.4 Choose email provider** — Resend (recommended in docs), SendGrid, or AWS SES for transactional emails (verification, password reset, invitations).
- [ ] **12.5 2FA (optional)** — Schema has `twoFactorEnabled` and `twoFactorSecret`. Implement TOTP-based 2FA for admin accounts.

---

### 13. Transcript AI Workflow (P1)

Frontend UI is built but backend is stubbed with mocks. Three AI workflows defined in `docs/transcript-ai-flows.md`.

- [ ] **13.1 Configure Azure OpenAI** — Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT in env.
- [ ] **13.2 YouTube caption import** — Wire `GET /api/v1/youtube/captions` to actually call YouTube Data API v3. Requires YOUTUBE_API_KEY.
- [ ] **13.3 AI transcript alignment** — Wire `POST /api/v1/ai/align-transcript` to call Azure OpenAI. Takes raw text + video duration → returns timestamped segments.
- [ ] **13.4 AI caption cleanup** — Wire `POST /api/v1/ai/cleanup-captions` to clean up YouTube auto-captions (punctuation, capitalization, paragraph breaks).
- [ ] **13.5 Whisper transcription** — Wire `POST /api/v1/ai/transcribe` to generate transcript from audio/video file. Options: OpenAI Whisper API, AssemblyAI, or self-hosted Whisper.
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

Currently a health monitoring page exists but is limited.

- [ ] **16.1 Quick actions widget** — "New Message", "New Event", "Upload Media", "Edit Pages" buttons.
- [ ] **16.2 Content health widget** — Color-coded cards (Green/Yellow/Red) for messages, events, pages, media. Flag stale content (>30 days since last update).
- [ ] **16.3 Upcoming events widget** — Next 5 events with date, time, type badge.
- [ ] **16.4 Recent activity feed** — Last 10 actions from AuditLog table (create, edit, publish, delete).
- [ ] **16.5 At-a-glance stats** — Total counts for messages, events, pages, media with published/draft breakdown.

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
11. User Management & Roles (#11)
12. Login & Sign-Up (#12)
13. Announcements CMS (#15)
14. CMS Dashboard (#16)
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
| Visit Us Form (#10) | None | Schema exists, quick to wire up |
| Contact Form Email (#10.2) | Email Provider (#25.1) | Need email sending capability |
| User Management (#11) | Auth Hardening (#8) | Need solid auth before adding users |
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
- [ ] Add "View Page" button in website builder → opens public URL
- [ ] Add sitemap.xml generation
- [ ] Set up Sentry error tracking
- [ ] Add `robots.txt` for SEO
- [ ] Verify 404 page renders correctly for invalid slugs
- [ ] Wire AuditLog writes on CMS create/edit/delete actions
- [ ] Add loading skeletons to CMS pages that flash blank
- [ ] Add `sizes` prop to `<Image>` components for responsive srcset
- [ ] Configure `images.formats: ['image/avif', 'image/webp']` in next.config.ts
