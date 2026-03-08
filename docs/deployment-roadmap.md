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
  - [ ] Contact page (form submission works → ContactSubmission table)
- [ ] **4.2 Fix empty paragraph rendering** — Verify the `<p><br></p>` fix in `tiptapJsonToHtml()` works across all content areas.
- [ ] **4.3 Fix font rendering** — Verify serif fonts (Times New Roman) display correctly for pre-2016 Bible studies, and sans-serif (Calibri/Arial) for post-2016.
- [ ] **4.4 Mobile responsiveness** — Test all pages at 375px, 768px, 1024px widths.
- [ ] **4.5 Image loading** — Verify all images load from R2 URLs (no broken images, correct `next.config.ts` remotePatterns).
- [ ] **4.6 Navigation** — Verify header menu links work, footer links work, mobile menu opens/closes, external links open in new tab.
- [ ] **4.7 SEO basics** — Verify `<title>`, `<meta description>`, OG tags render on every page type. Check with `curl -s URL | grep '<meta'`.
- [ ] **4.8 404 page** — Verify invalid slugs return a proper 404 page, not an error.
- [ ] **4.9 Fix ContactSubmission persistence** — There's a TODO in the form submission route — ensure it actually writes to the database.

---

### 5. Production Deployment (P0)

Get LA UBF live on a real server.

- [ ] **5.1 Choose hosting** — Decision: Vercel (recommended per docs) or Azure VM with Caddy.
  - Vercel: simpler, native Next.js support, auto-SSL, ~$20/mo
  - Azure VM: more control, existing infrastructure, requires manual setup
- [ ] **5.2 Set up production database** — Neon (recommended) or continue PostgreSQL 18 on VM.
  - [ ] Create production database
  - [ ] Run `prisma migrate deploy`
  - [ ] Run `npx prisma db seed`
  - [ ] Verify data integrity
- [ ] **5.3 Configure R2 for production** — Verify R2 buckets, CORS rules, lifecycle rules, and public URLs are correct for production domain (not localhost).
- [ ] **5.4 Environment variables** — Set all env vars in production:
  - DATABASE_URL, DIRECT_URL
  - AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, NEXTAUTH_URL
  - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_*_BUCKET_NAME, R2_*_PUBLIC_URL
  - CHURCH_SLUG=la-ubf
- [ ] **5.5 DNS setup** — Point laubf.org (or chosen domain) to hosting provider.
- [ ] **5.6 SSL certificate** — Auto-provisioned by Vercel, or configure Caddy/Let's Encrypt on VM.
- [ ] **5.7 Build & deploy** — `npx prisma generate && next build` → deploy.
- [ ] **5.8 Smoke test production** — Visit every page, test CMS login, test file upload, test form submission.
- [ ] **5.9 Error tracking** — Set up Sentry (free tier: 5K errors/mo). Add `@sentry/nextjs` to project.

---

### 6. Auth Hardening (P0)

Current auth works for Google SSO + credentials but is missing critical flows for production.

- [ ] **6.1 Password reset flow** — Implement forgot password → email token → reset password page.
- [ ] **6.2 Secure session config** — Verify cookies are httpOnly, secure, sameSite=lax in production.
- [ ] **6.3 Rate limiting on login** — Prevent brute force on `/api/auth/callback/credentials`. Use simple in-memory counter or Upstash rate limiter.
- [ ] **6.4 CSRF protection** — Verify NextAuth CSRF token is working (should be automatic).
- [ ] **6.5 Logout** — Verify signOut() clears session and redirects to login page.

---

## P1: Post-Launch High Priority

Ship within 2-4 weeks after launch.

---

### 7. User Management & Roles (P1)

The ChurchMember model exists with OWNER/ADMIN/EDITOR/VIEWER roles, but there's no admin UI for managing users.

- [ ] **7.1 User list page** — `/cms/settings/users` showing all ChurchMember records for the church. Columns: name, email, role, last login, status.
- [ ] **7.2 Invite user flow** — Button to invite by email. Creates User + ChurchMember record. Sends invitation email (or shows a link to share).
- [ ] **7.3 Change user role** — Dropdown to change ADMIN/EDITOR/VIEWER. Only OWNER can promote to ADMIN.
- [ ] **7.4 Deactivate user** — Soft-disable a user's access without deleting their account.
- [ ] **7.5 Connect to Person records** — Link ChurchMember (auth user) to Person (member directory) so logged-in members see their profile.
- [ ] **7.6 Role-based UI gating** — Hide CMS sidebar items based on role:
  - VIEWER: read-only access to all content
  - EDITOR: can edit content but not settings/users
  - ADMIN: full access except ownership transfer
  - OWNER: full access including billing and ownership
- [ ] **7.7 Role-based API gating** — `requireApiAuth()` already accepts roles. Audit all API routes to ensure correct role requirements.

---

### 8. Login & Sign-Up (P1)

Expand auth beyond admin-only to support member login.

- [ ] **8.1 Public sign-up page** — `/sign-up` page for church members (not CMS admins). Creates User with no ChurchMember role (member-only access).
- [ ] **8.2 Email verification** — Send verification email on sign-up. Block login until verified. Schema has `emailVerified` field.
- [ ] **8.3 Member portal** — `/member` dashboard after login showing: my profile, my groups, prayer requests, giving history (future).
- [ ] **8.4 Choose email provider** — Resend (recommended in docs), SendGrid, or AWS SES for transactional emails (verification, password reset, invitations).
- [ ] **8.5 2FA (optional)** — Schema has `twoFactorEnabled` and `twoFactorSecret`. Implement TOTP-based 2FA for admin accounts.

---

### 9. Transcript AI Workflow (P1)

Frontend UI is built but backend is stubbed with mocks. Three AI workflows defined in `docs/transcript-ai-flows.md`.

- [ ] **9.1 Configure Azure OpenAI** — Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT in env.
- [ ] **9.2 YouTube caption import** — Wire `GET /api/v1/youtube/captions` to actually call YouTube Data API v3. Requires YOUTUBE_API_KEY.
- [ ] **9.3 AI transcript alignment** — Wire `POST /api/v1/ai/align-transcript` to call Azure OpenAI. Takes raw text + video duration → returns timestamped segments.
- [ ] **9.4 AI caption cleanup** — Wire `POST /api/v1/ai/cleanup-captions` to clean up YouTube auto-captions (punctuation, capitalization, paragraph breaks).
- [ ] **9.5 Whisper transcription** — Wire `POST /api/v1/ai/transcribe` to generate transcript from audio/video file. Options: OpenAI Whisper API, AssemblyAI, or self-hosted Whisper.
- [ ] **9.6 Test end-to-end** — Upload a video → generate transcript → align timestamps → save → verify on public site.

---

### 10. Video Clipping (P1)

Not yet designed or implemented. Needed for creating shareable sermon clips.

- [ ] **10.1 Define requirements** — What is a clip? A time range within a sermon video (start/end timestamps) with optional title and description.
- [ ] **10.2 Schema design** — New `VideoClip` model: messageId, title, startTime, endTime, thumbnailUrl, shareUrl, status.
- [ ] **10.3 Clipping UI in CMS** — In the message editor video tab: "Create Clip" button → set start/end time on video player → title → save.
- [ ] **10.4 Clip generation backend** — Options:
  - FFmpeg server-side (extract segment, transcode, upload to R2)
  - Client-side (use YouTube embed with start/end params — no server processing needed for YouTube videos)
  - Third-party API (Mux, Cloudflare Stream)
- [ ] **10.5 Clip sharing** — Public URL `/clips/[id]` that embeds just the clip segment. OG tags for social sharing.
- [ ] **10.6 Clip gallery** — Public page showing all clips, filterable by series/speaker.

---

### 11. Announcements CMS (P1)

Schema and DAL exist but no CMS page.

- [ ] **11.1 Announcements list page** — `/cms/announcements` with data table. Columns: title, date range, priority, status, pinned.
- [ ] **11.2 Create/edit announcement** — Form with: title, body (rich text), start date, end date, priority (LOW/MEDIUM/HIGH/URGENT), pinned toggle, cover image.
- [ ] **11.3 Auto-expiration** — Announcements past their end date auto-archive (cron or on-read filter).
- [ ] **11.4 Wire to website** — ANNOUNCEMENTS_LIST section type should pull from DAL and render active announcements.

---

### 12. CMS Dashboard (P1)

Currently a health monitoring page exists but is limited.

- [ ] **12.1 Quick actions widget** — "New Message", "New Event", "Upload Media", "Edit Pages" buttons.
- [ ] **12.2 Content health widget** — Color-coded cards (Green/Yellow/Red) for messages, events, pages, media. Flag stale content (>30 days since last update).
- [ ] **12.3 Upcoming events widget** — Next 5 events with date, time, type badge.
- [ ] **12.4 Recent activity feed** — Last 10 actions from AuditLog table (create, edit, publish, delete).
- [ ] **12.5 At-a-glance stats** — Total counts for messages, events, pages, media with published/draft breakdown.

---

## P2: Post-Launch Medium Priority

Ship when capacity allows.

---

### 13. Website Builder v2 — Full-Screen Canvas (P2)

The ambitious WYSIWYG builder. Not a launch blocker but significantly improves the editing experience. 48 tasks across 9 phases documented in `docs/00_dev-notes/development-status.md`.

- [ ] **13.1 Builder shell** — Full-screen layout with sidebar (page tree + section list), canvas (iframe or inline render), and floating toolbar.
- [ ] **13.2 Canvas rendering** — Live preview of the page using actual section components.
- [ ] **13.3 Section selection** — Click a section in canvas to select → show floating toolbar (move up/down, edit, duplicate, delete, visibility).
- [ ] **13.4 Drag-and-drop reorder** — Drag sections in sidebar or canvas to reorder.
- [ ] **13.5 Inline text editing** — Click text in canvas to edit directly (contentEditable → sync to TipTap JSON).
- [ ] **13.6 Device preview** — Desktop (100%), tablet (768px), mobile (375px) mode switcher.
- [ ] **13.7 Undo/redo** — In-memory state history (50 snapshots max) per architecture doc.
- [ ] **13.8 Auto-save** — 30-second debounce auto-save with manual Ctrl+S override.

---

### 14. Messages List Enhancements (P2)

Bulk actions UI exists but handlers aren't wired.

- [ ] **14.1 Wire bulk publish** — Select multiple messages → "Publish" → batch update status.
- [ ] **14.2 Wire bulk archive** — Select → "Archive" → batch update.
- [ ] **14.3 Wire bulk delete** — Select → "Delete" → confirmation → batch soft-delete.
- [ ] **14.4 Speaker filter** — Combobox filter in toolbar.
- [ ] **14.5 Series filter** — Combobox filter in toolbar.
- [ ] **14.6 Bible book filter** — Filter messages by book from passage field.
- [ ] **14.7 Mobile card view** — Responsive layout for narrow screens (cards instead of table).

---

### 15. Event Enhancements (P2)

- [ ] **15.1 Event sharing** — Shareable link, Google Calendar add, Apple Calendar add (.ics file).
- [ ] **15.2 Duplicate event** — Wire the existing menu option to actually clone an event.
- [ ] **15.3 Preview before publish** — Side-by-side preview of event detail page.
- [ ] **15.4 Event form field gaps** — Add slug, shortDescription, campus, tags, image alt text, image object position to form.

---

### 16. SEO & Performance (P2)

- [ ] **16.1 Sitemap generation** — Auto-generated `sitemap.xml` from all published pages, messages, events, bible studies.
- [ ] **16.2 Structured data (JSON-LD)** — Church schema, Event schema, VideoObject schema on relevant pages.
- [ ] **16.3 301 redirects** — Admin UI for managing URL redirects (old laubf.org URLs → new paths).
- [ ] **16.4 Image optimization** — Verify Next.js `<Image>` component is used everywhere (not raw `<img>`) for automatic WebP/AVIF conversion and lazy loading.
- [ ] **16.5 Cloudflare CDN** — Configure cache rules per `docs/cloudflare-cdn-setup.md` (static assets 1yr, images 30d, API bypass, HTML 1hr).

---

### 17. Media Library Enhancements (P2)

- [ ] **17.1 Usage tracking** — "Where is this used?" panel showing which pages/sections/messages reference a media asset.
- [ ] **17.2 Bulk metadata editing** — Select multiple items → edit alt text, tags, folder in batch.
- [ ] **17.3 Image editor** — Basic crop/resize before upload.
- [ ] **17.4 Google Photos sync** — OAuth flow to connect Google Photos account, import albums. UI stub exists but no backend.

---

### 18. Ministry & Campus Pages (P2)

Not yet built. Schema (Ministry, Campus models) exists.

- [ ] **18.1 Ministry list page** — `/cms/ministries` (separate from people/ministries — this is for public-facing ministry pages).
- [ ] **18.2 Ministry detail editor** — Hero image, description (rich text), leadership (linked Person records), events, contact info.
- [ ] **18.3 Campus detail editor** — Similar structure for multi-campus churches.
- [ ] **18.4 Wire to website** — Ministry and campus pages auto-generated from DB, rendered via section types.

---

### 19. Prayer Requests (P2)

Feature flag exists (`SiteSettings.enablePrayerRequests`) but no model or UI.

- [ ] **19.1 Schema** — New `PrayerRequest` model: churchId, authorId (optional), title, body, isAnonymous, status (ACTIVE/ANSWERED/ARCHIVED), prayerCount, createdAt.
- [ ] **19.2 Public submission form** — Accessible from website (if feature enabled). Anonymous or logged-in submission.
- [ ] **19.3 CMS moderation** — `/cms/prayer` page to review, approve, archive prayer requests.
- [ ] **19.4 Public prayer wall** — Website section showing approved requests with "I prayed" button.

---

### 20. Notification System (P2)

- [ ] **20.1 Choose email provider** — Resend recommended. Set up account and API key.
- [ ] **20.2 Transactional emails** — Password reset, email verification, user invitation templates.
- [ ] **20.3 In-app notifications** — Bell icon in CMS header. Notification model (type, message, read, link). Show: stale content flags, new form submissions, user invites.
- [ ] **20.4 Email digests** — Weekly summary of content health, new submissions, upcoming events.

---

### 21. Testing (P2)

Zero tests exist currently.

- [ ] **21.1 Unit tests** — Test critical DAL functions (message CRUD, event filtering, storage quota).
- [ ] **21.2 API integration tests** — Test all 66 API endpoints with proper auth headers.
- [ ] **21.3 E2E tests** — Playwright tests for: login, create message, create event, upload media, edit page.
- [ ] **21.4 CI pipeline** — GitHub Actions: lint → type-check → test → build on every PR.

---

## P3: Future / Platform

Not needed for LA UBF launch. Required for scaling to multiple churches.

---

### 22. Multi-Tenant Middleware (P3)

Currently single-tenant via `CHURCH_SLUG` env var.

- [ ] **22.1 Hostname-based routing** — Middleware detects subdomain or custom domain → resolves to churchId → sets `x-tenant-id` header.
- [ ] **22.2 Custom domain resolution** — Lookup `CustomDomain` table by hostname → resolve to church.
- [ ] **22.3 Redis caching** — Cache domain→church mappings in Upstash Redis (5-min TTL).
- [ ] **22.4 PostgreSQL Row-Level Security** — Enable RLS on all tenant-scoped tables. Set `app.current_church_id` per request.

---

### 23. Billing & Subscriptions (P3)

- [ ] **23.1 Stripe integration** — Connect Stripe account, configure products/prices for Free/Starter/Pro tiers.
- [ ] **23.2 Checkout flow** — Church admin clicks "Upgrade" → Stripe Checkout → webhook updates subscription.
- [ ] **23.3 Feature gating** — `canAccessFeature(church, feature)` function checks plan tier + feature flags.
- [ ] **23.4 Billing page** — `/cms/settings/billing` showing current plan, usage, invoices.
- [ ] **23.5 Superadmin billing dashboard** — Revenue, MRR, churn, plan distribution.

---

### 24. Onboarding Flow (P3)

- [ ] **24.1 Church registration** — Sign up → create church → choose template → configure basics.
- [ ] **24.2 Setup wizard** — Step-by-step: church info → template → logo/colors → modules → invite team.
- [ ] **24.3 Demo content** — Pre-populate sample messages, events, pages so the site isn't empty.

---

### 25. Superadmin Console (P3)

- [ ] **25.1 Church list** — All churches with plan, status, MRR, last login.
- [ ] **25.2 Church detail** — Profile, subscription, usage, members, feature flags, audit log.
- [ ] **25.3 Impersonation** — "Login as church" with signed JWT, yellow banner, full audit logging.
- [ ] **25.4 Support tickets** — In-CMS ticket submission, superadmin queue, conversation threads.

---

### 26. Content Generalization (P3)

Make LA UBF-specific models work for any church.

- [ ] **26.1 Feature flags** — `Church.featureFlags` JSON field controlling which modules are enabled.
- [ ] **26.2 Configurable labels** — "Sermons" vs "Messages" vs "Teachings" — per-church content type labels.
- [ ] **26.3 Dynamic CMS sidebar** — Show/hide menu items based on enabled modules.
- [ ] **26.4 Website templates** — Template selection during onboarding, multiple starter layouts.

---

## Recommended Execution Order

### Phase 1: Pre-Launch Sprint (P0 items)
1. Church Profile & Seed Data (#1)
2. Database Cleanup (#3)
3. Auth Hardening (#6)
4. Public Website UI Fixes (#4)
5. Website Builder Fixes (#2)
6. Production Deployment (#5)

### Phase 2: Post-Launch Sprint (P1 items)
7. User Management & Roles (#7)
8. Login & Sign-Up (#8)
9. Announcements CMS (#11)
10. CMS Dashboard (#12)
11. Transcript AI Workflow (#9)
12. Video Clipping (#10)

### Phase 3: Polish (P2 items)
13-21. As capacity allows, in parallel tracks.

### Phase 4: Platform (P3 items)
22-26. When ready to onboard church #2.

---

## Dependencies & Blockers

| Task | Blocked By | Notes |
|------|-----------|-------|
| Production Deployment (#5) | Church Profile (#1), DB Cleanup (#3), Auth (#6) | Can't deploy with wrong data |
| User Management (#7) | Auth Hardening (#6) | Need solid auth before adding users |
| Login & Sign-Up (#8) | Email Provider (#20.1) | Need transactional email for verification |
| Transcript AI (#9) | Azure OpenAI credentials, YouTube API key | External service config |
| Video Clipping (#10) | Requirements definition | Need to decide approach first |
| Multi-Tenant (#22) | Production Deployment (#5) | Need single-tenant running first |
| Billing (#23) | Multi-Tenant (#22), Onboarding (#24) | Need multi-tenant before billing |

---

## Quick Wins (< 1 day each)

These small tasks can be knocked out quickly between larger work:

- [ ] Wire bulk action handlers on messages list (publish/archive/delete)
- [ ] Add "View Page" button in website builder → opens public URL
- [ ] Fix ContactSubmission persistence (TODO in code)
- [ ] Add sitemap.xml generation
- [ ] Set up Sentry error tracking
- [ ] Add `robots.txt` for SEO
- [ ] Verify 404 page renders correctly for invalid slugs
- [ ] Wire AuditLog writes on CMS create/edit/delete actions
- [ ] Add loading skeletons to CMS pages that flash blank
