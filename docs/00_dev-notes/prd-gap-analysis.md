# PRD Gap Analysis

> **Originally created: 2026-03-11.** Status reflects that date. See checkboxes for current progress.
>
> This document was a point-in-time snapshot when first generated. Many items marked "Not Implemented" on 3/11 have since been completed (especially the Website Builder, bulk actions, and domain routing). Use the checkboxes below to track actual current state.
>
> **Cross-reference with more up-to-date docs:**
> - Builder status: `docs/04_builder/builder-roadmap.md` (updated 3/20)
> - Domain routing: `docs/00_dev-notes/domain-hosting-plan.md` and `docs/04_proxy-routing/proxy-routing-architecture.md`
> - Deployment: `docs/deployment-roadmap.md` (updated 3/11)

---

## Overall Status: ~80% of P0 implemented (revised from ~65% on 3/11)

---

## 1. CMS PRD (`01-prd-cms.md`)

### Implemented (as of 3/11, still accurate)

- [x] Messages table with sort/search/filter (series filter dropdown added post-3/11)
- [x] Message create/edit form (Video + Study tabs)
- [x] Series management (CRUD, reorder, image)
- [x] Bible Study content editor (TipTap) — import .doc/.docx/.txt working
- [x] Bible Study <-> Message auto-sync — syncMessageStudy() on save
- [x] Events list/table with filters
- [x] Event create/edit form (all sections)
- [x] Recurring events (daily/weekly/monthly/yearly/custom)
- [x] Calendar view with event dots
- [x] Card grid view for events
- [x] Media Library (grid, list, folders, upload)
- [x] Video URL handling (YouTube/Vimeo)
- [x] Church Profile (5 sections)
- [x] Form Submissions (table, detail, status)
- [x] Content status workflow (Draft/Published/Archived)

### Not Implemented (tracked with checkboxes)

- [ ] **Announcements module** (entire feature) — P0. DB model exists, NO CMS pages/DAL/API.
- [ ] **Prayer Topics module** (entire feature) — P0. No Prisma model, nothing built.
- [ ] **Ministry detail pages** (multi-tab editor) — P0. Only basic CRUD at `/cms/people/ministries`.
- [ ] Message read-only detail/preview page — P0. Flow is List -> Edit only.
- [ ] Event read-only detail/preview page — P0. No preview before publish.
- [ ] Livestream Link button on messages — P0. Not implemented.
- [ ] Feature Sermon toggle (pin to top) — P0. Not implemented.
- [x] Message filters: Series dropdown — P0. Series filter added to toolbar (post-3/11). Speaker and Bible Book dropdowns still missing.
- [x] Bulk action handlers (messages, events) — P0. **DONE** (post-3/11). API routes exist at `/api/v1/messages/bulk` and `/api/v1/events/bulk`. UI wired in toolbar.
- [ ] Event duplicate handler — P0. Menu option exists, no backend.
- [ ] Mobile card layout for messages — P0. Table only.
- [ ] Per-message analytics — P1.
- [ ] Google Drive import for study materials — P1.
- [x] Email notifications for form submissions — P0. **DONE** (post-3/11). Full pipeline: API persistence, DAL, CMS pages, email notifications.
- [ ] Form submission internal notes UI — P0. Field in DB, not exposed in UI.
- [ ] Form customization (add/remove fields) — P1.

### Implemented but Not in PRD

- [x] Series detail page with drag-to-reorder — `/cms/messages/series/[id]`
- [x] People/Members full CRUD — Members, groups, households, custom fields, notes
- [x] Users/CMS Access management — Invite, role assignment, deactivate/reactivate
- [x] Campuses management — Basic CRUD
- [x] Media folders system — Create/rename/delete/move (instead of tags)
- [x] Event card grid view — Alternative to table
- [x] Event calendar view — Date picker with event dots
- [x] Storage usage display — Sidebar widget
- [x] Account settings page — Name edit, theme, accent color
- [x] CSV member import — 4-step wizard
- [x] Google Albums tab in media — UI present (mock integration)

---

## 2. Website Builder PRD (`02-prd-website-builder.md`)

### Implemented (as of 3/11, still accurate)

- [x] Page management (CRUD, publish/unpublish)
- [x] Section-based block editor — 42 section types
- [x] Section display settings — Color scheme (4 palettes: Light/Dark/Brand/Muted), padding, width, animations, visibility
- [x] Navigation editor (menus, items, nesting) — Full tree-based DnD, inline rename, CTA editing
- [x] Theme customization (colors, fonts, CSS) — 5 colors, font pairings, custom CSS
- [x] Site settings (branding, contact, social, SEO)
- [x] Homepage management — Seeded with 10 sections
- [x] Per-page SEO fields — Meta title/desc, OG image, canonical, noIndex
- [x] Custom URL slugs
- [x] Feature toggles — 6 toggles in site settings
- [x] Navbar CTA button config
- [x] Maintenance mode
- [x] Font pairing presets (6 curated)

### Previously listed as "Not Implemented" (updated status)

- [x] **Full-screen WYSIWYG builder canvas** — P0. **DONE** (3/18). Iframe-based canvas with correct responsive breakpoints. Builder at `app/cms/website/builder/`.
- [x] Builder drag-and-drop section reordering — P0. **DONE** (3/18). @dnd-kit wired with drag preview.
- [x] Builder section hover/selected state — P0. **DONE** (3/18). Inset box-shadow borders via SortableSection.
- [x] Builder floating toolbar (drag, edit, delete) — P0. **DONE** (3/18). Integrated into section overlay.
- [x] Builder plus buttons between sections — P0. **DONE** (3/18). Section picker triggers.
- [x] Builder section editor modals — P0. **DONE** (3/18). Right-panel drawer with 41 type-specific editors.
- [x] Builder page tree sidebar — P0. **DONE** (3/18). Pages & Navigation merged into unified sidebar.
- [x] Builder device preview modes — P0. **DONE** (3/18). Desktop/tablet/mobile via iframe sizing.
- [ ] Template gallery/chooser — P0. No template selection during onboarding. NOT STARTED.
- [ ] Template switching after launch — P1. NOT STARTED.
- [ ] Light/dark mode toggle for themes — P1. NOT STARTED (but 4-palette color scheme system is done).
- [ ] Custom theme preset creation — P1. NOT STARTED.
- [ ] Share preview links — P1. NOT STARTED.
- [ ] Schedule publication for future date — P1. NOT STARTED.
- [ ] Version history — P2. NOT STARTED.
- [ ] SSL auto-provisioning (Caddy TLS) — P0 (Phase F). NOT STARTED. Currently using certbot.
- [ ] Sitemap auto-generation — P0. NOT STARTED.
- [ ] JSON-LD structured data — P1. NOT STARTED.
- [ ] 301 redirects — P1. NOT STARTED.
- [ ] SEO audit score — P2. NOT STARTED.
- [ ] Page duplication — P1. NOT STARTED.
- [ ] Save layout as reusable template — P2. NOT STARTED.
- [ ] Multiple header/footer layout variants — P1. NOT STARTED.

---

## 3. System PRD (`03-prd-system.md`)

### Implemented (as of 3/11, still accurate)

- [x] Roles & Permissions (49 granular perms) — 6 groups, priority-based hierarchy
- [x] 4 default roles (Owner/Admin/Editor/Viewer)
- [x] Custom role CRUD
- [x] User invite via email
- [x] Google OAuth + Credentials login
- [x] Onboarding flow for new members
- [x] Password reset flow
- [x] JWT-based permission caching — Refreshed every 5 min
- [x] Rate limiting on auth endpoints
- [x] Dashboard quick actions — 4 cards
- [x] Dashboard content count widgets — 3 stat cards
- [x] Upcoming events widget — Next 5 events
- [x] Recent activity widget — Last 10 items
- [x] AuditLog table — Exists in schema, API logs actions
- [x] Church.plan field — Defaults to STARTER

### Not Implemented (tracked with checkboxes)

- [ ] **Content staleness detection/alerts** — P0. Dashboard shows counts but no health metrics.
- [ ] **Automated content lifecycle** (auto-archive) — P0. No expiration enforcement.
- [ ] **In-app notification center** — P0. Errors via toast only.
- [ ] **Activity log viewer page** — P0. AuditLog exists, no UI.
- [ ] **Analytics integration** (GA/Cloudflare) — P0. Fields exist, no data connection.
- [ ] **Subscription/billing system** — P0. Plan field exists, no Stripe/UI.
- [ ] **Module enable/disable enforcement** — P0. Toggles exist, not enforced.
- [ ] **Guided onboarding wizard** (new church) — P0. Auth onboarding exists, no setup wizard.
- [ ] Publishing safeguards (diff, approval) — P1.
- [ ] Email digests (daily/weekly) — P1.
- [ ] Content analytics (view counts) — P1.
- [ ] Audience insights — P1.
- [ ] Monthly auto-reports — P1.
- [ ] Command palette (Cmd+K) — P1.
- [ ] Ministry-level permissions — P1.
- [ ] Real-time notifications — P2.
- [ ] Analytics export — P2.

---

## 4. Features with UI but Non-Functional Handlers

These had UI elements rendered but backend/handlers not connected as of 3/11.

- [x] Message bulk Publish/Draft/Archive/Delete — Messages table toolbar. **DONE**: API at `/api/v1/messages/bulk`, UI wired.
- [x] Event bulk Publish/Draft/Archive/Delete — Events table toolbar. **DONE**: API at `/api/v1/events/bulk`, UI wired.
- [ ] Event duplicate — Event row actions menu. Menu option, no backend.
- [ ] Google Photos integration — Media Library Google Albums tab. UI present, no OAuth/sync.
- [ ] AI transcript features — Message Video tab. All use mock data.
- [ ] Storage quota calculation — Media sidebar. Static/mock display.
- [ ] Media usage tracking — Preview dialog. No query implementation.
- [ ] Page duplication — Pages list. Menu exists, not wired.

---

## 5. Data Model Gaps

- [x] Event.directionsUrl — Event. **DONE**: Migration applied (see deployment-roadmap.md section 3.3).
- [x] Event.slug — Event. **DONE**: Field exists and is used by website and CMS.
- [x] Event.shortDescription — Event. **DONE**: Field exists.
- [x] Event.campus — Event. **DONE**: Field exists.
- [x] Event.tags — Event. **DONE**: Field exists.
- [ ] Event.image.alt — Event. Alt text not stored.
- [ ] Announcement admin UI — Announcement. Model exists, no CMS integration.
- [ ] Prayer model — No Prisma model at all.

---

## 6. Critical Path (Recommended Priority)

### Immediate (updated from 3/11)
1. ~~Wire message/event bulk action handlers~~ **DONE**
2. Implement event/message read-only preview pages
3. ~~Add series filter dropdown to messages~~ **DONE** (speaker + book still needed)
4. ~~Add form submission email notifications~~ **DONE**

### Short-term (1-2 sprints)
1. Build Announcements module (CMS pages, DAL, API)
2. Build ministry detail pages (multi-tab editor)
3. ~~Finish Website Builder canvas UI (drag-drop, editors, toolbar)~~ **DONE** (3/18)
4. Implement content staleness detection
5. ~~Migrate Event schema (add missing fields)~~ **DONE**

### Medium-term (Phases D-F)
1. Prayer Topics module
2. Multi-tenant middleware (default subdomains)
3. Analytics integration
4. Subscription/billing (Stripe)
5. Email notification system
6. Activity log viewer UI
