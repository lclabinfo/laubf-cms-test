# Website Builder — Roadmap

> **Owner**: David Lim
> **Updated**: March 19, 2026
> **Status**: All 41 section editors complete. Shared component library extracted. Dirty tracking + selective save + concurrent editing (presence, background sync, post-save merge) all implemented. Iframe canvas migration complete. Navigation editor complete. Drag preview fixed. **No remaining P0 blockers.**

---

## Context

The website builder is a **design tool, not a content tool.** Church admins manage sermons, events, bible studies, and announcements through the CMS — that content flows to the website automatically. The builder is only used for:

- Changing how the website looks (colors, fonts, section styling)
- Changing what's on each page (adding/removing/reordering sections)
- One-time setup (writing "About Us" text, configuring the footer, etc.)
- Navigation changes (updating menu links when pages are added)

This means the builder is used **infrequently** — maybe monthly. Every interaction must be self-explanatory without training.

**Editing approach (decided):** Right-panel drawer with form fields + live canvas preview (Shopify-style). The drawer is the correct UI for design-focused, infrequent editing. Inline canvas editing is deferred — high cost, low value given the CMS handles all recurring content. See `mental-model/builder-review.md` for the full analysis.

**Concurrent editing (implemented):** Presence awareness + dirty section tracking + silent last-write-wins + background sync. No merge UI, no conflict modals, no page locking. See `dev-notes/concurrent-editing-strategy.md` for the full design.

---

## What's Working

- Full-screen builder layout with live canvas
- 40/42 section components rendering on public website
- Drag-and-drop section reordering
- Section picker (categorized, searchable, 40+ types)
- Right drawer with 14 type-specific editors + display settings
- **All 41 section editors complete** (13 gaps closed March 18 — verified via Playwright)
- Shared editor component library (`section-editors/shared/`) — 15 reusable primitives, -42% editor code
- Dirty section tracking + selective save (K+2 requests instead of N+2)
- Flat editor registry (1-line to add a new section type)
- Page tree with add/duplicate/delete pages + page settings
- Auto-save (30s), undo/redo (Cmd+Z), unsaved changes warning
- Device preview (desktop/tablet/mobile) via iframe — **responsive breakpoints working correctly**
- 20 API endpoints for all website entities
- Theme manager, site settings, domain manager pages

---

## What's Broken or Incomplete

| Issue | Priority | Status |
|-------|----------|--------|
| ~~**Canvas responsive rendering broken**~~ | ~~**P0 BLOCKER**~~ | **DONE** (Mar 18) — iframe canvas migration complete. Route group isolation, internal scrolling, all device modes working. See `worklog/builder-responsive-rendering-bug.md`. |
| ~~Save sends ALL sections (N+2 requests) — no dirty tracking~~ | ~~P0~~ | **DONE** (Mar 18) — dirty tracking + selective save |
| ~~13 section editors missing fields~~ | ~~P0~~ | **DONE** (Mar 18) — all 41 editors complete |
| ~~4 hardcoded URLs in section components~~ | ~~P0~~ | **DONE** (Mar 18) — all read from content |
| ~~Navigation sidebar is broken — doesn't match the actual public website~~ | ~~P0~~ | **DONE** (Mar 18) — Full NavigationEditor with DnD, inline rename, CTA editing |
| ~~Quick Links mixed into navbar — should be managed separately~~ | ~~P0~~ | **DONE** (Mar 18) — Quick Links are a separate section, not mixed into navbar |
| ~~SPOTLIGHT_MEDIA editor shows manual fields that contradict data-driven pattern~~ | ~~P0~~ | **DONE** (Mar 18) — simplified to info banner |
| ~~Right sidebar not scrollable~~ | ~~P0~~ | **DONE** (pre-Mar 18) — proper flex/overflow pattern in builder-right-drawer.tsx |
| ~~Shared editor primitives duplicated across 5 files~~ | ~~P0~~ | **DONE** (Mar 18) — shared/ library with 15 components |
| ~~No presence awareness for concurrent editors~~ | ~~P1~~ | **DONE** (Mar 19) — Heartbeat presence + banner + background sync + post-save merge |
| ~~Editor routing requires 2-file changes to add a section type~~ | ~~P1~~ | **DONE** (Mar 18) — flat registry, 1-line change |
| All content typed as `Record<string, unknown>` — no compile-time safety | P1 | NOT STARTED |
| Color scheme is binary light/dark — needs to be a palette system | P1 | NOT STARTED |
| ~~Drag preview shows label card instead of section visual~~ | ~~P1~~ | **DONE** (Mar 19) — Full section snapshot thumbnail at 0.25x scale |
| Blue selection border clipped by overflow-hidden | P1 | NOT STARTED |
| Section picker modal wrong positioning (centered instead of near trigger) | P1 | NOT STARTED |
| Design panel is a stub ("coming soon") | P1 | NOT STARTED |
| No page templates for new pages | P1 | NOT STARTED |
| No live theme preview in builder (requires page reload) | P2 | NOT STARTED |

---

## Phase 1: Make Every Section Editable (This Week)

> **Target: March 18–24 (Tue–Mon, ~5 working days)**
> **Updated March 18**: Added iframe canvas migration as Day 1 blocker. Shifted all other work by 1 day.
> Every section's editor must expose all its rendered fields, save correctly, and render on the public site.
> **Key input**: `section-catalog/section-editor-gap-analysis.md` — reviewed and annotated by David before implementation.

### Day 1 — Tuesday: Iframe Canvas Migration (CRITICAL BLOCKER)

> **Why this is first:** The canvas renders sections using real website components, but CSS media queries respond to viewport width (1440px+), not the canvas container (~640px after sidebars). Every responsive breakpoint fires incorrectly. Mobile/tablet previews are completely broken. No visual verification of sections is reliable until this is fixed. See `worklog/builder-responsive-rendering-bug.md` for full analysis.

**Iframe canvas migration** (renders sections in an iframe for correct responsive behavior) — **DONE**
- [x] Create lightweight preview route: `app/cms/website/builder/preview/[pageId]/page.tsx` (119 lines)
- [x] Create `builder-preview-client.tsx` (382 lines) — client component inside iframe, listens for `postMessage`
- [x] Define bidirectional postMessage protocol in `iframe-protocol.ts` (176 lines, type-safe)
- [x] Replace inline section rendering in `builder-canvas.tsx` with `<iframe>` sized to `deviceWidths[deviceMode]`
- [x] Implement selection + interaction overlay via SortableSection (inset box-shadow borders)
- [x] Migrate navbar preview into iframe, intercept clicks via postMessage
- [x] Adapt DnD to work with overlay handles (pointer-events disabled during drag)
- [ ] Verify: desktop, tablet (768px), mobile (375px) all show correct responsive layouts — *being refined by another agent team*

**Infrastructure refactors** (do after iframe, before editor work) — **ALL DONE**
- [x] Extract shared editor primitives to `section-editors/shared/` (15 components across 5 modules — `79b7182`)
- [x] Fix right sidebar scrolling (proper flexbox: `h-full flex flex-col overflow-hidden` + `flex-1 min-h-0`)
- [x] Dirty section tracking + selective save (`801291a`)
- [x] Refactor editor routing to flat registry (`79b7182`)

**Section editor audit & review**
- [ ] David reviews `section-catalog/section-editor-gap-analysis.md` — confirm/reject each "Should Be Editable" recommendation
- [ ] Mark any fields David wants to add/remove/change from the spec
- [ ] Finalize the list of 13 sections that need editor changes

**End of day: Canvas renders sections in iframe with correct responsive behavior. Infrastructure refactors done. Editor spec finalized.**

---

### Day 2 — Wednesday: Save Architecture + Navigation + Hardcoded URLs

**Save architecture upgrade** (dirty tracking + selective save) — **ALL DONE** (`801291a`)
- [x] Add `dirtySectionIds: Set<string>` state to BuilderShell
- [x] Mark sections dirty on content edit, display settings change, and new section add
- [x] Modify `handleSave()` to only PATCH sections in the dirty set (not all N)
- [x] Add separate `reorderDirty` flag for section reorder
- [x] Clear dirty set after successful save
- [x] Verify `router.refresh()` still reloads fresh data after selective save

**Navigation fix** — **ALL DONE** (`1a91e8a`, `4178ebf`)
- [x] Full tree-based NavigationEditor inside builder (1084-line component with DnD reordering)
- [x] NavItemEditor forms for all item types (page, external link, featured, top-level, settings)
- [x] Schema: `scheduleMeta` on MenuItem, navbar settings on SiteSettings (additive migration)
- [x] API: child reorder endpoint, navbar settings GET/PATCH, field allowlist on PATCH
- [x] Navbar settings persisted to DB (scroll behavior, solid color, sticky)
- [x] Public site: scheduleMeta in dropdown/mobile/FAB, navbar settings wired from DB
- [x] Security audit: item ownership verification, field allowlist, state conflict fixes

**Undo/redo verification** — **DONE** (`68fa985`)
- [x] Verify undo/redo works reliably within a session (open → edit → save)
- [x] Ensure all edit types are captured (content, reorder, add/remove, display settings)
- [x] Verify dirty tracking interacts correctly with undo/redo (undone sections stay dirty)
- [x] Fix: `SectionEditorInline` converted to controlled component (no local state) — drawer now syncs with canvas on undo/redo
- [x] Fix: `editingSnapshotPushedRef` reset after undo/redo so next edit pushes new snapshot
- [x] Audit: 6 scenarios verified (edit+undo, undo+edit+undo, display settings, DnD reorder, rapid typing, race conditions)

**Fix hardcoded URLs** (4 components, code-only changes) — **ALL DONE** (`4b11296`)
- [x] HERO_BANNER — reads from `content.backgroundVideo.src` with backward-compat fallback
- [x] STATEMENT — reads from `content.maskImageUrl` with fallback to default constant
- [x] FEATURE_BREAKDOWN — reads from `content.watermarkUrl`, hidden when empty
- [x] FOOTER — reads from `content.logoUrl` with site settings fallback

**End of day: Save architecture upgraded. Navigation complete. Hardcoded URLs fixed.** (All done Mar 18.)

---

### Day 3 — Thursday: Section Editor Fixes (13 sections) — **ALL DONE** (Mar 18)

> Completed ahead of schedule on Day 1. All 13 section editor gaps closed in `4b11296`, then refactored into shared components in `79b7182`. Verified via Playwright on public website.

**Hero + Content editors** (4 sections) — **DONE**
- [x] HERO_BANNER — background video URL fields (desktop + mobile)
- [x] MINISTRY_HERO — social links array editor (platform Select dropdown + URL)
- [x] MEDIA_TEXT — images array editor (add/remove/reorder with ImagePickerField)
- [x] SPOTLIGHT_MEDIA — simplified to info banner + heading only (`a3f38da` fixed routing)

**Card + Ministry editors** (5 sections) — **DONE**
- [x] PILLARS — image array per pillar item (max 3 images each)
- [x] MINISTRY_SCHEDULE — timeValue, address lines, directionsUrl, image
- [x] CAMPUS_CARD_GRID — ctaHeading + CTA button fields
- [x] MEET_TEAM — photo URL replaced with ImagePickerField
- [x] LOCATION_DETAIL — images array editor

**Layout + Data editors** (4 sections) — **DONE**
- [x] FOOTER — logo ImagePickerField, social links platform dropdown
- [x] ACTION_CARD_GRID — CTA visible toggle (Switch)
- [x] EVENT_CALENDAR — CTA buttons array editor
- [x] `DataDrivenBanner` component added to all data-driven section editors

**Add TypeScript content interfaces** (incremental, per section as we touch it)
- [ ] Add typed interfaces for each section we fix (replaces `Record<string, unknown>` + manual casts)
- [ ] Share types between editors and section components where possible

**End of day: All 41 section editors complete and correct.** ✅

---

### Day 4 — Friday: Verification + Color System

**Section-by-section verification** (all 41 sections)
- [ ] For each section type: open editor → verify all fields save → check canvas renders → check public site
- [ ] Verify new sections added via section picker get sensible default content
- [ ] Test delete, reorder, visibility toggle
- [ ] Test undo/redo across edit types
- [ ] Navigation changes reflect on public site
- [ ] Test concurrent editing: open builder in two tabs, edit different sections, save both — verify both changes preserved

**Color palette system**
- [ ] Replace binary light/dark toggle with named color palettes per section
- [ ] Palettes = named sets of color variations (Light, Dark, Brand Primary, Brand Accent, Muted, etc.)
- [ ] Backward-compatible with existing light/dark sections

**End of day: All sections verified working. Color palette in place.**

---

### Day 5 — Monday (Week 2): Presence System + Theme Compliance + UX Polish

**Presence awareness system** (concurrent editing — see `dev-notes/concurrent-editing-strategy.md`) — **ALL DONE** (Mar 19)
- [x] Create `BuilderPresence` model in Prisma schema (pageId, userId, userName, lastSeen, churchId)
- [x] Create heartbeat API: `POST /api/v1/builder/presence` (upsert + returns other editors)
- [x] Create presence query API: `GET /api/v1/builder/presence?pageId=xxx` (active editors with lastSeen < 60s)
- [x] Create cleanup API: `DELETE /api/v1/builder/presence` (explicit presence removal)
- [x] Add heartbeat interval (30s) via `usePresenceHeartbeat` hook — start on mount, stop on unmount
- [x] Show amber warning banner when other editors present: "X is also editing this page — your changes may overwrite theirs if you save now."
- [x] Hide banner when no other editors (heartbeat expired)
- [x] Clean up: DELETE with `keepalive: true` on unmount + 60s stale expiry as fallback
- [x] Background sync: `useBackgroundSync` polls every 15s when idle, merges server state
- [x] Post-save refetch: fetches fresh page data after save, merges with local state
- [x] Resilient reorder: DAL reconciles stale section IDs (handles concurrent add/delete)
- [x] QA audit: 11 bugs found and fixed across 6 parallel agents

**Theme & palette compliance**
- [ ] All sections respond to palette changes (not just old light/dark)
- [ ] All sections use theme fonts — no hardcoded font families
- [ ] Fix sections using hardcoded colors instead of theme tokens
- [ ] Global theme changes flow through to every section

**UX bug fixes** (from `backlogs/builder-ux-issues.md`)
- [ ] Issue 2: Fix blue selection border clipping — switch from `outline` to `inset box-shadow`
- [ ] Issue 1: Fix drag preview — show semi-transparent section visual instead of label card
- [ ] Issue 3: Fix section picker positioning — sidebar mode + popover mode instead of centered modal
- [ ] Issue 4: Soften modal borders from black to subtle gray

**Edge cases & polish**
- [ ] Empty state handling (section with no content yet)
- [ ] Long text overflow (headings wrapping, descriptions too long)
- [ ] Image aspect ratio edge cases
- [ ] Mobile preview accuracy

---

## Phase 2: Make the Builder Useful (~2 weeks after Phase 1)

### Design Panel
- [ ] In-builder theme controls: fonts, colors, spacing
- [ ] Color presets (6-8 curated palettes, one-click apply)
- [ ] Font pairings (reuse existing 6 from theme page)
- [ ] Live preview — changes update canvas instantly without saving

### Page Templates
- [ ] 6-8 starter templates (Home, About, Events, Messages, Bible Studies, I'm New, Contact, Giving)
- [ ] Template selection when creating a new page
- [ ] Creates page + all sections with default content in one click

### CMS ↔ Builder Connection
- [ ] Data-driven sections clearly labeled "auto-populates from [Content Type]"
- [ ] Filter/limit options where applicable (featured events, message count)
- [ ] "Manage in CMS" link opens the relevant content page
- [ ] Verify CMS changes auto-propagate to website without builder interaction

### Image Upload in Editors
- [ ] Image upload via media picker in all image fields (not just URL paste)
- [ ] Reuse existing R2 upload infrastructure
- [ ] Preview after upload

---

## Phase 3: Make the Product Launch-Ready (~3-4 weeks after Phase 2)

### Onboarding & Site Templates
- [ ] First-time template gallery (3-5 complete site designs)
- [ ] One-click site creation: pages + sections + theme + menus
- [ ] Quick Start guide / checklist overlay

### Header/Footer Variants
- [ ] 2-3 navbar styles (centered logo, left logo + right menu, minimal)
- [ ] 2-3 footer styles (multi-column, minimal, centered)

### Custom Domains
- [ ] Domain input + DNS instruction display
- [ ] CNAME/TXT verification flow
- [ ] SSL provisioning

### Multi-Tenant
- [ ] Hostname → tenant routing middleware
- [ ] Subdomain + custom domain support
- [ ] Not needed for LA UBF single-tenant launch

---

## What's Deferred

| Item | Reason |
|------|--------|
| Inline canvas editing (click text to edit directly) | High cost, low value — builder is used infrequently and CMS handles recurring content |
| Full version control (cross-session history, revert to published) | Session undo/redo is sufficient for now |
| Real-time collaboration (live cursors, CRDTs) | Extreme engineering cost for 1-3 admin teams editing monthly. Presence + dirty tracking is sufficient. |
| AI website generation | Requires Phase 1 + Phase 2 complete first. Target: after Phase 2. |
| Section merging/consolidation | All 40 types are actively used. Low ROI. |
| New section types | 40 is comprehensive for MVP |
| Per-section conflict modals / merge UI | Church admins don't understand merge. Silent last-write-wins with presence awareness is better UX. See `dev-notes/concurrent-editing-strategy.md`. |

---

## User Journeys (Must All Work)

**"I just signed up"** → Pick template → site is created → live website in <5 minutes

**"I need to post this week's sermon"** → CMS Messages → create entry → website updates automatically (no builder needed)

**"I want to update the homepage hero"** → Open builder → click section → edit in drawer → see canvas update → save → done in <2 minutes

**"I want to add a page for our retreat"** → Add Page → pick template → edit sections → publish → add to nav → done in <10 minutes

**"I want to change site colors/fonts"** → Design panel → pick preset → canvas updates instantly → save

**"I want to rearrange sections"** → Drag and drop → auto-saves

**"I accidentally broke something"** → Cmd+Z to undo → or discard unsaved changes

**"A new admin takes over"** → Builder is self-explanatory → no training needed

**"Two admins edit the website at the same time"** → Both see presence banner → edit different sections → both save → changes merged silently → no conflict

---

## Quick Reference

**40 section types across 7 categories:**
- Heroes (5) · Content (8) · Cards (6) · Data-driven (8) · Ministry (6) · Interactive (4) · Layout (5)

**Section edit sources:**
- 27 builder-only (content in JSONB)
- 5 CMS-only (auto-populated from database)
- 8 hybrid (CMS data + builder config)

**All API endpoints are built and working** (20 endpoints across pages, sections, menus, theme, settings, domains).

**Detailed section-by-section audit:** See `mental-model/builder-review.md` Part 3.

**Editor gap analysis (current vs should-be):** See `section-catalog/section-editor-gap-analysis.md`.

**Concurrent editing design:** See `dev-notes/concurrent-editing-strategy.md`.

**Save & undo/redo architecture:** See `dev-notes/undo-redo-and-save-architecture.md`.

**System architecture & recommendations:** See `dev-notes/builder-system-architecture.md`.
