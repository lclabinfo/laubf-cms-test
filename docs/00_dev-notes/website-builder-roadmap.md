# Website Builder — Roadmap

> **Owner**: David Lim
> **Updated**: March 16, 2026
> **Status**: Builder shell ~70% complete. Section editors + navigation are the main gaps.

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
- Page tree with add/duplicate/delete pages + page settings
- Auto-save (30s), undo/redo (Cmd+Z), unsaved changes warning
- Device preview (desktop/tablet/mobile)
- 20 API endpoints for all website entities
- Theme manager, site settings, domain manager pages

---

## What's Broken or Incomplete

| Issue | Priority |
|-------|----------|
| Many section editors don't expose all the fields the section actually supports | P0 |
| Navigation sidebar is broken — doesn't match the actual public website | P0 |
| Quick Links mixed into navbar — should be managed separately | P0 |
| Color scheme is binary light/dark — needs to be a palette system | P1 |
| Undo/redo needs cleanup (history cap, consistent snapshot capture) | P1 |
| Design panel is a stub ("coming soon") | P1 |
| No page templates for new pages | P1 |
| Hardcoded LA UBF URLs in several sections (hero video, logos) | P1 |
| No live theme preview in builder (requires page reload) | P2 |

---

## Phase 1: Make Every Section Editable (This Week)

> **Target: March 18–21 (Tue–Fri)**
> Every section's editor must expose all its fields, save correctly, and render on the public site.

### Day 1 — Tuesday: Navigation, Undo/Redo, Color System, Simple Sections

**Navigation fix**
- [ ] Audit nav sidebar against the actual public website — fix broken links, wrong hierarchy, missing items
- [ ] Wire navbar editor changes to API so they persist
- [ ] Separate Quick Links from navigation — Quick Links (bottom-right FAB on the website) gets its own management, independent of the nav menu

**Undo/redo cleanup**
- [ ] Verify undo/redo works reliably within a session (open → edit → save)
- [ ] Cap history at ~50 snapshots to prevent memory bloat
- [ ] Ensure all edit types are captured (content, reorder, add/remove, display settings)

**Color palette system**
- [ ] Replace binary light/dark toggle with named color palettes per section
- [ ] Palettes = named sets of color variations (Light, Dark, Brand Primary, Brand Accent, Muted, etc.)
- [ ] Backward-compatible with existing light/dark sections

**Verify simple sections** (10 sections that should already work)
- [ ] EVENTS_HERO, QUOTE_BANNER, CTA_BANNER, NEWCOMER, MINISTRY_INTRO, SPOTLIGHT_MEDIA, HIGHLIGHT_CARDS, QUICK_LINKS, CUSTOM_HTML, CUSTOM_EMBED
- [ ] For each: open editor → check fields save → check canvas → check public site

**Complete hero section editors** (5 sections)
- [ ] HERO_BANNER — make background video/image configurable (currently hardcoded URL)
- [ ] PAGE_HERO — add floating images, overline text
- [ ] TEXT_IMAGE_HERO — add accent heading, text alignment, description, image
- [ ] MINISTRY_HERO — add social links, heading style, hero image

**End of day: ~17 sections done. Navigation working. Undo/redo solid. Palettes in place.**

---

### Day 2 — Wednesday: Content + Card Sections

**Content sections** (5 sections)
- [ ] MEDIA_TEXT — image gallery editing (add/remove/reorder), body text, overline
- [ ] ABOUT_DESCRIPTION — logo, video URL, description
- [ ] STATEMENT — paragraph list editing, lead-in text, icon toggle
- [ ] Remove hardcoded LA UBF URLs from FEATURE_BREAKDOWN (watermark) and STATEMENT (mask image)
- [ ] SPOTLIGHT_MEDIA — verify CMS data connection, heading field

**Card layout sections** (5 sections)
- [ ] ACTION_CARD_GRID — editable cards (image + title + link), multi-line heading
- [ ] FEATURE_BREAKDOWN — acronym lines, description, button, configurable watermark
- [ ] PATHWAY_CARD — editable cards (icon + title + description + button)
- [ ] PILLARS — editable pillar items (title + description + images + button) — most complex
- [ ] NEWCOMER — verify all fields work

**End of day: ~27 sections done.**

---

### Day 3 — Thursday: Ministry + Interactive + Footer + CMS Sections

**Ministry sections** (5 sections)
- [ ] MINISTRY_SCHEDULE — schedule entries, time/location, directions, buttons, images
- [ ] CAMPUS_CARD_GRID — decorative images, manual campus list, CTA
- [ ] DIRECTORY_LIST — directory items, side image, CTA
- [ ] MEET_TEAM — team member list (name, role, bio, photo)
- [ ] LOCATION_DETAIL — time, address, directions, images

**Interactive + layout sections** (4 sections)
- [ ] FAQ_SECTION — FAQ items (question + answer pairs)
- [ ] FORM_SECTION — dropdown options, labels, success message
- [ ] TIMELINE_SECTION — timeline items, image/video
- [ ] FOOTER — social links, nav columns, contact info, logo (remove hardcoded logo)

**CMS-connected sections polish** (11 sections)
- [ ] Add "Content managed in CMS" labels to all data-driven sections
- [ ] Verify builder-side config fields work (headings, CTAs, display settings)
- [ ] EVENT_CALENDAR — make CTA buttons configurable
- [ ] RECURRING_MEETINGS — add "max items shown" setting

**End of day: All section editors complete.**

---

### Day 4 — Friday: Testing & Theme Compliance

**End-to-end testing**
- [ ] Every section type: edit → save → verify on public website
- [ ] Add new section of each type → verify sensible default content appears
- [ ] Delete, reorder, visibility toggle all work
- [ ] Undo/redo works across edit types
- [ ] Navigation changes reflect on public site

**Theme & palette compliance**
- [ ] All sections respond to palette changes (not just old light/dark)
- [ ] All sections use theme fonts — no hardcoded font families
- [ ] Fix sections using hardcoded colors instead of theme tokens
- [ ] Global theme changes flow through to every section

**Edge cases**
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
