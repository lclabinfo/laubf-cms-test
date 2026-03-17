# Website Builder — Roadmap

> **Owner**: David Lim
> **Updated**: March 17, 2026
> **Status**: Builder shell ~85% complete. 28/41 section editors are already correct. 13 need changes. Navigation + hardcoded URLs are the other main gaps.

---

## Context

The website builder is a **design tool, not a content tool.** Church admins manage sermons, events, bible studies, and announcements through the CMS — that content flows to the website automatically. The builder is only used for:

- Changing how the website looks (colors, fonts, section styling)
- Changing what's on each page (adding/removing/reordering sections)
- One-time setup (writing "About Us" text, configuring the footer, etc.)
- Navigation changes (updating menu links when pages are added)

This means the builder is used **infrequently** — maybe monthly. Every interaction must be self-explanatory without training.

**Editing approach (decided):** Right-panel drawer with form fields + live canvas preview (Shopify-style). The drawer is the correct UI for design-focused, infrequent editing. Inline canvas editing is deferred — high cost, low value given the CMS handles all recurring content. See `website-builder-review.md` for the full analysis.

---

## What's Working

- Full-screen builder layout with live canvas
- 40/42 section components rendering on public website
- Drag-and-drop section reordering
- Section picker (categorized, searchable, 40+ types)
- Right drawer with 14+ type-specific editors + display settings
- **28/41 section editors fully correct** (verified March 17 — see `section-editor-spec.md`)
- Page tree with add/duplicate/delete pages + page settings
- Auto-save (30s), undo/redo (Cmd+Z), unsaved changes warning
- Device preview (desktop/tablet/mobile)
- 20 API endpoints for all website entities
- Theme manager, site settings, domain manager pages

---

## What's Broken or Incomplete

| Issue | Priority |
|-------|----------|
| 13 section editors missing fields that the component renders (see `section-editor-spec.md`) | P0 |
| 4 hardcoded URLs in section components (hero video, mask image, watermark, footer logo) | P0 |
| Navigation sidebar is broken — doesn't match the actual public website | P0 |
| Quick Links mixed into navbar — should be managed separately | P0 |
| SPOTLIGHT_MEDIA editor shows manual fields that contradict data-driven pattern | P0 |
| Color scheme is binary light/dark — needs to be a palette system | P1 |
| Undo/redo needs cleanup (history cap, consistent snapshot capture) | P1 |
| Design panel is a stub ("coming soon") | P1 |
| No page templates for new pages | P1 |
| No live theme preview in builder (requires page reload) | P2 |

---

## Phase 1: Make Every Section Editable (This Week)

> **Target: March 18–21 (Tue–Fri)**
> Every section's editor must expose all its rendered fields, save correctly, and render on the public site.
> **Key input**: `section-editor-spec.md` — reviewed and annotated by David before implementation.

### Day 1 — Tuesday: Section Editor Audit Review + Navigation + Infrastructure

**Section editor audit & review**
- [ ] David reviews `section-editor-spec.md` — confirm/reject each "Should Be Editable" recommendation
- [ ] Mark any fields David wants to add/remove/change from the spec
- [ ] Finalize the list of 13 sections that need editor changes

**Navigation fix**
- [ ] Audit nav sidebar against the actual public website — fix broken links, wrong hierarchy, missing items
- [ ] Wire navbar editor changes to API so they persist
- [ ] Separate Quick Links from navigation — Quick Links (bottom-right FAB on the website) gets its own management, independent of the nav menu

**Undo/redo cleanup**
- [ ] Verify undo/redo works reliably within a session (open → edit → save)
- [ ] Cap history at ~50 snapshots to prevent memory bloat
- [ ] Ensure all edit types are captured (content, reorder, add/remove, display settings)

**Fix hardcoded URLs** (4 components, code-only changes)
- [ ] HERO_BANNER — read video URL from `content.backgroundVideoUrl` instead of hardcoded R2 URL
- [ ] STATEMENT — read mask image from content with fallback
- [ ] FEATURE_BREAKDOWN — read watermark from content with fallback, or remove
- [ ] FOOTER — read logo from content or site settings

**End of day: Navigation working. Undo/redo solid. Hardcoded URLs fixed. Editor spec finalized.**

---

### Day 2 — Wednesday: Section Editor Fixes (13 sections)

**Hero + Content editors** (4 sections need changes)
- [ ] HERO_BANNER — add video URL field to editor
- [ ] MINISTRY_HERO — add social links array editor (platform dropdown + URL)
- [ ] MEDIA_TEXT — add images array editor (add/remove/reorder with image picker)
- [ ] SPOTLIGHT_MEDIA — remove manual sermon fields, add "Content auto-populated from CMS" info banner

**Card + Ministry editors** (5 sections need changes)
- [ ] PILLARS — add image array per pillar item (1-3 images each, nested)
- [ ] MINISTRY_SCHEDULE — add timeValue, address lines, directions URL, section image
- [ ] CAMPUS_CARD_GRID — add ctaHeading + CTA button fields
- [ ] MEET_TEAM — swap photo URL text input for image picker
- [ ] LOCATION_DETAIL — add time label + images array editor

**Layout + Data editors** (4 sections need changes)
- [ ] FOOTER — add logo image picker, improve social links to use platform dropdown
- [ ] ACTION_CARD_GRID — add visible toggle to CTA button (minor)
- [ ] EVENT_CALENDAR — add CTA buttons array (optional, defer if time-constrained)
- [ ] Add "Content managed in CMS" info banners to all data-driven section editors

**End of day: All 41 section editors complete and correct.**

---

### Day 3 — Thursday: Verification + Color System

**Section-by-section verification** (all 41 sections)
- [ ] For each section type: open editor → verify all fields save → check canvas renders → check public site
- [ ] Verify new sections added via section picker get sensible default content
- [ ] Test delete, reorder, visibility toggle
- [ ] Test undo/redo across edit types
- [ ] Navigation changes reflect on public site

**Color palette system**
- [ ] Replace binary light/dark toggle with named color palettes per section
- [ ] Palettes = named sets of color variations (Light, Dark, Brand Primary, Brand Accent, Muted, etc.)
- [ ] Backward-compatible with existing light/dark sections

**End of day: All sections verified working. Color palette in place.**

---

### Day 4 — Friday: Theme Compliance + Polish

**Theme & palette compliance**
- [ ] All sections respond to palette changes (not just old light/dark)
- [ ] All sections use theme fonts — no hardcoded font families
- [ ] Fix sections using hardcoded colors instead of theme tokens
- [ ] Global theme changes flow through to every section

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
| AI website generation | Requires Phase 1 + Phase 2 complete first. Target: after Phase 2. |
| Section merging/consolidation | All 40 types are actively used. Low ROI. |
| New section types | 40 is comprehensive for MVP |

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

---

## Quick Reference

**40 section types across 7 categories:**
- Heroes (5) · Content (8) · Cards (6) · Data-driven (8) · Ministry (6) · Interactive (4) · Layout (5)

**Section edit sources:**
- 27 builder-only (content in JSONB)
- 5 CMS-only (auto-populated from database)
- 8 hybrid (CMS data + builder config)

**All API endpoints are built and working** (20 endpoints across pages, sections, menus, theme, settings, domains).

**Detailed section-by-section audit:** See `website-builder-review.md` Part 3.

**Editor gap analysis (current vs should-be):** See `section-editor-spec.md`.
