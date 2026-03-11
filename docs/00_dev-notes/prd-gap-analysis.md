# PRD Gap Analysis

> Generated 2026-03-11 — Cross-reference of all 4 PRDs against actual codebase implementation.

---

## Overall Status: ~65% of P0 implemented

---

## 1. CMS PRD (`01-prd-cms.md`)

### Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Messages table with sort/search/filter | Done | Speaker/Series/Book filter dropdowns missing |
| Message create/edit form (Video + Study tabs) | Done | |
| Series management (CRUD, reorder, image) | Done | Series detail page not in PRD but built |
| Bible Study content editor (TipTap) | Done | Import .doc/.docx/.txt working |
| Bible Study ↔ Message auto-sync | Done | syncMessageStudy() on save |
| Events list/table with filters | Done | |
| Event create/edit form (all sections) | Done | |
| Recurring events (daily/weekly/monthly/yearly/custom) | Done | |
| Calendar view with event dots | Done | |
| Card grid view for events | Done | |
| Media Library (grid, list, folders, upload) | Done | |
| Video URL handling (YouTube/Vimeo) | Done | |
| Church Profile (5 sections) | Done | |
| Form Submissions (table, detail, status) | Done | |
| Content status workflow (Draft/Published/Archived) | Done | |

### Not Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| **Announcements module** (entire feature) | P0 | DB model exists, NO CMS pages/DAL/API |
| **Prayer Topics module** (entire feature) | P0 | No Prisma model, nothing built |
| **Ministry detail pages** (multi-tab editor) | P0 | Only basic CRUD at `/cms/people/ministries` |
| Message read-only detail/preview page | P0 | Flow is List → Edit only |
| Event read-only detail/preview page | P0 | No preview before publish |
| Livestream Link button on messages | P0 | Not implemented |
| Feature Sermon toggle (pin to top) | P0 | Not implemented |
| Message filters: Speaker, Series, Bible Book dropdowns | P0 | Search works but no dropdown filters |
| Bulk action handlers (messages, events) | P0 | UI present, handlers not wired |
| Event duplicate handler | P0 | Menu option exists, no backend |
| Mobile card layout for messages | P0 | Table only |
| Per-message analytics | P1 | |
| Google Drive import for study materials | P1 | |
| Email notifications for form submissions | P0 | Forms accepted, no admin notification |
| Form submission internal notes UI | P0 | Field in DB, not exposed in UI |
| Form customization (add/remove fields) | P1 | |

### Implemented but Not in PRD

| Feature | Notes |
|---------|-------|
| Series detail page with drag-to-reorder | `/cms/messages/series/[id]` |
| People/Members full CRUD | Members, groups, households, custom fields, notes |
| Users/CMS Access management | Invite, role assignment, deactivate/reactivate |
| Campuses management | Basic CRUD |
| Media folders system | Create/rename/delete/move (instead of tags) |
| Event card grid view | Alternative to table |
| Event calendar view | Date picker with event dots |
| Storage usage display | Sidebar widget |
| Account settings page | Name edit, theme, accent color |
| CSV member import | 4-step wizard |
| Google Albums tab in media | UI present (mock integration) |

---

## 2. Website Builder PRD (`02-prd-website-builder.md`)

### Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Page management (CRUD, publish/unpublish) | Done | |
| Section-based block editor (v1 list editor) | Done | 42 section types |
| Section display settings | Done | Color scheme, padding, width, animations, visibility |
| Navigation editor (menus, items, nesting) | Done | Header/Footer/Mobile/Sidebar tabs |
| Theme customization (colors, fonts, CSS) | Done | 5 colors, font pairings, custom CSS |
| Site settings (branding, contact, social, SEO) | Done | |
| Homepage management | Done | Seeded with 10 sections |
| Per-page SEO fields | Done | Meta title/desc, OG image, canonical, noIndex |
| Custom URL slugs | Done | |
| Feature toggles | Done | 6 toggles in site settings |
| Navbar CTA button config | Done | |
| Maintenance mode | Done | |
| Font pairing presets (6 curated) | Done | |

### Not Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| **Full-screen WYSIWYG builder canvas** | P0 | Entry scaffolded, UI components NOT built |
| Builder drag-and-drop section reordering | P0 | @dnd-kit installed, not wired |
| Builder section hover/selected state | P0 | |
| Builder floating toolbar (drag, edit, delete) | P0 | |
| Builder plus buttons between sections | P0 | |
| Builder section editor modals | P0 | Exist in v1 editor, not in builder |
| Builder page tree sidebar | P0 | |
| Builder device preview modes | P0 | |
| Template gallery/chooser | P0 | No template selection during onboarding |
| Template switching after launch | P1 | |
| Light/dark mode toggle for themes | P1 | |
| Custom theme preset creation | P1 | |
| Share preview links | P1 | |
| Schedule publication for future date | P1 | |
| Version history | P2 | |
| SSL auto-provisioning (Caddy TLS) | P0 | Phase F |
| Sitemap auto-generation | P0 | |
| JSON-LD structured data | P1 | |
| 301 redirects | P1 | |
| SEO audit score | P2 | |
| Page duplication | P1 | Menu exists, not wired |
| Save layout as reusable template | P2 | |
| Multiple header/footer layout variants | P1 | |

---

## 3. System PRD (`03-prd-system.md`)

### Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Roles & Permissions (49 granular perms) | Done | 6 groups, priority-based hierarchy |
| 4 default roles (Owner/Admin/Editor/Viewer) | Done | |
| Custom role CRUD | Done | |
| User invite via email | Done | |
| Google OAuth + Credentials login | Done | |
| Onboarding flow for new members | Done | |
| Password reset flow | Done | |
| JWT-based permission caching | Done | Refreshed every 5 min |
| Rate limiting on auth endpoints | Done | |
| Dashboard quick actions | Done | 4 cards |
| Dashboard content count widgets | Done | 3 stat cards |
| Upcoming events widget | Done | Next 5 events |
| Recent activity widget | Done | Last 10 items |
| AuditLog table | Done | Exists in schema, API logs actions |
| Church.plan field | Done | Defaults to STARTER |

### Not Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| **Content staleness detection/alerts** | P0 | Dashboard shows counts but no health metrics |
| **Automated content lifecycle** (auto-archive) | P0 | No expiration enforcement |
| **In-app notification center** | P0 | Errors via toast only |
| **Activity log viewer page** | P0 | AuditLog exists, no UI |
| **Analytics integration** (GA/Cloudflare) | P0 | Fields exist, no data connection |
| **Subscription/billing system** | P0 | Plan field exists, no Stripe/UI |
| **Module enable/disable enforcement** | P0 | Toggles exist, not enforced |
| **Guided onboarding wizard** (new church) | P0 | Auth onboarding exists, no setup wizard |
| Publishing safeguards (diff, approval) | P1 | |
| Email digests (daily/weekly) | P1 | |
| Content analytics (view counts) | P1 | |
| Audience insights | P1 | |
| Monthly auto-reports | P1 | |
| Command palette (Cmd+K) | P1 | |
| Ministry-level permissions | P1 | |
| Real-time notifications | P2 | |
| Analytics export | P2 | |

---

## 4. Features with UI but Non-Functional Handlers

These have UI elements rendered but backend/handlers not connected:

| Feature | Location | Status |
|---------|----------|--------|
| Message bulk Publish/Draft/Archive/Delete | Messages table toolbar | Buttons show, click does nothing |
| Event bulk Publish/Draft/Archive/Delete | Events table toolbar | Buttons show, click does nothing |
| Event duplicate | Event row actions menu | Menu option, no backend |
| Google Photos integration | Media Library Google Albums tab | UI present, no OAuth/sync |
| AI transcript features | Message Video tab | All use mock data |
| Storage quota calculation | Media sidebar | Static/mock display |
| Media usage tracking | Preview dialog | No query implementation |
| Page duplication | Pages list | Menu exists, not wired |

---

## 5. Data Model Gaps

| Field | Table | Status |
|-------|-------|--------|
| Event.directionsUrl | Event | CMS form exists, Prisma migration pending |
| Event.monthlyRecurrenceType | Event | CMS form supports, migration pending |
| Event.slug | Event | Website uses slugs, CMS uses IDs |
| Event.shortDescription | Event | Separate from body description |
| Event.campus | Event | Website filters by campus |
| Event.tags | Event | Website uses hashtags |
| Event.image.alt | Event | Alt text not stored |
| Announcement admin UI | Announcement | Model exists, no CMS integration |
| Prayer model | - | No Prisma model at all |

---

## 6. Critical Path (Recommended Priority)

### Immediate
1. Wire message/event bulk action handlers
2. Implement event/message read-only preview pages
3. Add speaker/series/book filter dropdowns to messages
4. Add form submission email notifications

### Short-term (1-2 sprints)
1. Build Announcements module (CMS pages, DAL, API)
2. Build ministry detail pages (multi-tab editor)
3. Finish Website Builder canvas UI (drag-drop, editors, toolbar)
4. Implement content staleness detection
5. Migrate Event schema (add missing fields)

### Medium-term (Phases D-F)
1. Prayer Topics module
2. Multi-tenant middleware (default subdomains)
3. Analytics integration
4. Subscription/billing (Stripe)
5. Email notification system
6. Activity log viewer UI
