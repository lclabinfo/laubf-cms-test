# Website Builder — Roadmap & Active Checklist

> **Owner**: David Lim
> **Last updated**: March 13, 2026
> **Status**: Phase C v2 builder shell is ~70% complete. Core editing UX needs redesign.
> **Velocity baseline**: ~9 commits/day, full CRUD features in 2-4 days, complex features in 5-9 days

---

## How to Read This Document

This is your **active checklist**. Each section is ordered by priority (what makes the builder work first, what makes the product successful second). Time estimates are calibrated to your development speed with Claude Code based on 289 commits across 22 active days.

**Legend:**
- ✅ Done — working in production
- 🚧 Partially done — exists but needs work
- ❌ Not started
- 🧠 Needs design decision — blocked on brainstorming/alignment

---

## Table of Contents

1. [Where We Are Now](#1-where-we-are-now)
2. [The Core Problem: Editing UX](#2-the-core-problem-editing-ux)
3. [Priority 1: Make the Builder Run](#3-priority-1-make-the-builder-run)
4. [Priority 2: Make the Builder Useful](#4-priority-2-make-the-builder-useful)
5. [Priority 3: Make the Product Successful](#5-priority-3-make-the-product-successful)
6. [Time Estimates Summary](#6-time-estimates-summary)
7. [User Journeys to Test](#7-user-journeys-to-test)

---

## 1. Where We Are Now

### What's Built (and working)

The builder at `/cms/website/builder/` is surprisingly complete:

| Component | Status | Notes |
|-----------|--------|-------|
| Full-screen layout shell | ✅ | Auth check, no CMS sidebar, Toaster |
| Top bar (save, publish, undo/redo, device toggle) | ✅ | Functional with keyboard shortcuts |
| Left sidebar (4 tools) | ✅ | Add Section, Pages, Design (stub), Media (stub) |
| Animated left drawer | ✅ | Pages + navbar links working |
| Live canvas with actual sections | ✅ | Renders real section components via registry |
| Drag-and-drop section reordering | ✅ | @dnd-kit with optimistic updates |
| Section picker (40+ types, categorized, searchable) | ✅ | Two modes: sidebar + popover |
| Right drawer section editor | ✅ | 14+ type-specific editors + display settings |
| Page tree in drawer | ✅ | All pages, status badges, actions |
| Add/duplicate/delete pages | ✅ | With confirmation dialogs |
| Page settings modal | ✅ | Title, slug, type, layout, homepage, SEO |
| Navbar preview (clickable links) | ✅ | Navigate to pages from canvas navbar |
| Auto-save (30s debounce) | ✅ | With unsaved changes warning |
| Undo/redo history | ✅ | Cmd+Z / Cmd+Shift+Z |
| Device preview (desktop/tablet/mobile) | ✅ | Width constraints on canvas |
| Section visibility toggle | ✅ | Hidden sections shown with reduced opacity |
| Theme manager page | ✅ | Colors, fonts, pairings, custom CSS |
| Navigation editor page | ✅ | Menu CRUD with hierarchy |
| Site settings page | ✅ | 11 setting cards, all persist |
| Domain manager page | ✅ | Subdomain display, custom coming soon |
| 20 API endpoints | ✅ | Full CRUD for all website entities |
| 40/42 section components | ✅ | Public website renders correctly |

### What's Broken or Missing

| Issue | Impact | Status |
|-------|--------|--------|
| **Section editors don't map to actual section configs** | HIGH | 🚧 Editors exist but many sections' content JSON doesn't match what the editor produces |
| **Editing UX is a right drawer — feels cramped** | HIGH | 🧠 Needs redesign (see Section 2) |
| **Design panel is a stub** | MEDIUM | ❌ Button exists, drawer says "coming soon" |
| **Media panel is a stub** | LOW | ❌ Button exists, drawer says "coming soon" |
| **Navbar editor changes don't persist** | MEDIUM | 🚧 Editable in drawer, but no API save wired |
| **No template system** | HIGH | ❌ No way to start from pre-made page templates |
| **No live theme preview in builder** | MEDIUM | ❌ Theme changes require page reload |
| **System pages (MINISTRY/CAMPUS) locked** | ✅ | Working as designed — cannot add custom sections |
| **Status docs are outdated** | LOW | Plan says 0/48 done but most are done |

---

## 2. The Core Problem: Editing UX

### Current State
Right now, clicking a section opens a 320px right drawer with form fields. This works but has problems:

- **320px is cramped** for sections with rich content (image uploads, card arrays, CTA buttons)
- **No visual connection** between what you're editing and what changes on canvas
- **Context switching** — you edit in the drawer, then look left at the canvas to see the result
- **Can't see the full section** while editing because the drawer covers part of the canvas

### 🧠 Brainstorm: Eventbrite-Style Editor

You mentioned wanting something like the Eventbrite editor. Here's what that model looks like and how it maps to our system:

**Eventbrite Model:**
- Click a section on the canvas → an **inline editing panel** appears directly on/near the section
- The section itself becomes semi-editable (text fields become live-editable, images get upload overlays)
- A **floating toolbar** appears above/below the section with formatting options
- Settings (color, spacing, etc.) live in a compact popover, not a full drawer

**Options for Our Builder:**

#### Option A: Wider Right Panel (Quick Win)
- Expand right drawer from 320px to 480-520px on larger screens
- Keep the current form-based approach
- **Effort**: 0.5 days | **Impact**: Incremental improvement

#### Option B: Full-Width Modal Editor (Medium Effort)
- Click "Edit" on a section → opens a **modal/dialog** that's ~80% viewport width
- Left side: live preview of the section (rendered with current content)
- Right side: structured form fields
- Changes update preview in real-time
- **Effort**: 2-3 days | **Impact**: Significant UX improvement

#### Option C: Inline Canvas Editing (High Effort — Eventbrite Style)
- Click a section → it enters "edit mode" directly on canvas
- Text becomes contenteditable
- Images show upload/replace overlay
- A compact floating panel appears for non-visual settings
- **Effort**: 7-10 days | **Impact**: Best UX, but complex to build and maintain
- **Risk**: Every section type needs custom inline editing logic

#### Option D: Hybrid — Panel + Canvas Highlight (Recommended)
- Keep right panel but make it wider (480px)
- When editing, the **canvas scrolls to and highlights** the section being edited
- Changes reflect on canvas **in real-time** as you type (no save needed to preview)
- Panel shows structured form with live-updating preview embedded at top
- Similar to Shopify's section editor
- **Effort**: 3-4 days | **Impact**: Great UX, maintainable

**Recommendation**: Start with **Option D** (hybrid). It gives the best balance of UX quality and development speed. The real-time preview feedback is the key differentiator — the user always sees what their changes look like without context-switching.

---

## 3. Priority 1: Make the Builder Run

These tasks are **required** before the builder can be used by a real church admin. Ordered by dependency chain.

### 3.1 Fix Section Editor ↔ Content Mapping
> **Est: 3-4 days** | **Priority: P0** | **Status: 🚧**

The section editors produce content JSON, but many don't match what the actual section components expect. This is the #1 blocker.

- [ ] Audit all 14 structured editors against their section component props
  - [ ] HeroEditor (5 hero types) — verify heading/subheading/buttons/image fields match
  - [ ] ContentEditor (6 types) — verify media position, CTA, body text fields
  - [ ] CardsEditor (6 types) — verify card array structure, image fields, links
  - [ ] DataSectionEditor (10 data types) — verify dataSource config, count, filters
  - [ ] MinistryEditor (6 types) — verify schedule, campus, team fields
  - [ ] FAQEditor — verify question/answer array structure
  - [ ] TimelineEditor — verify date/title/description structure
  - [ ] FormEditor — verify field types, submit config
  - [ ] FooterEditor — verify social links, contact info mapping
  - [ ] PhotoGalleryEditor — verify image array, layout options
  - [ ] ScheduleEditor — verify day/time/label structure
  - [ ] CustomEditor — verify HTML/embed content passthrough
  - [ ] NavbarEditor — verify logo, CTA, menu config
- [ ] Fix mismatches (update editor output OR update component expectations)
- [ ] Verify each fix renders correctly on public website via `tiptapJsonToHtml` / `contentToHtml`
- [ ] Add JSON fallback for any section type without a dedicated editor

### 3.2 Wire Navbar Editor Save
> **Est: 0.5 days** | **Priority: P0** | **Status: 🚧**

The navbar editor in the right drawer lets you modify navbar settings but doesn't save to API.

- [ ] Connect navbar editor to `PATCH /api/v1/site-settings` (for logo, CTA button)
- [ ] Connect navbar editor to menu items API (for link reordering)
- [ ] Show save status / toast on save

### 3.3 Implement Editing UX Redesign
> **Est: 3-4 days** | **Priority: P0** | **Status: 🧠**

Based on the brainstorming in Section 2 (pending your decision on which option).

- [ ] **Decision**: Choose editing approach (Option A/B/C/D)
- [ ] Implement chosen approach
- [ ] Real-time preview updates as user types
- [ ] Canvas auto-scroll to edited section
- [ ] Section highlight while editing

### 3.4 Test All Section Types End-to-End
> **Est: 2-3 days** | **Priority: P0** | **Status: ❌**

For each of the 40 real section types:

- [ ] Add section via picker in builder
- [ ] Edit section via editor (fill in all fields)
- [ ] Verify section renders correctly on canvas
- [ ] Verify section renders correctly on public website
- [ ] Verify display settings (color scheme, padding, width) work
- [ ] Verify section visibility toggle works

### 3.5 Build Section Default Content Templates
> **Est: 1-2 days** | **Priority: P0** | **Status: 🚧**

When adding a section, it should come pre-filled with sensible defaults so the admin sees what it looks like immediately, not a blank box.

- [ ] Define default content JSON for all 40 section types
- [ ] Include placeholder text, sample images, dummy cards
- [ ] Store in section-catalog.ts (already exists, needs enrichment)
- [ ] Verify defaults render a visually complete section on canvas

---

## 4. Priority 2: Make the Builder Useful

These make the builder **practical for weekly use** by a church admin (per the user profile).

### 4.1 Design Panel (In-Builder Theme Controls)
> **Est: 2-3 days** | **Priority: P1** | **Status: ❌**

The Design sidebar button is a stub. This should be a lightweight version of the standalone theme page.

- [ ] Typography section: heading font + body font dropdowns with Google Fonts
- [ ] Colors section: primary + secondary color pickers with preset palettes
- [ ] Spacing section: base font size, border radius
- [ ] Live preview: changes update CSS variables on canvas instantly (no save required)
- [ ] Save button persists to `PATCH /api/v1/theme`
- [ ] Link to "Advanced Theme Settings" (full theme page)

### 4.2 Page Templates
> **Est: 3-4 days** | **Priority: P1** | **Status: ❌**

New churches need starter pages. When creating a page, the admin should choose from templates.

- [ ] Define 6-8 page templates:
  - Home (hero + highlights + media + CTA)
  - About Us (hero + about description + meet team + statement)
  - Events (events hero + upcoming events + event calendar)
  - Messages/Sermons (spotlight media + all messages)
  - Bible Studies (page hero + all bible studies)
  - I'm New (hero + newcomer cards + FAQ + form)
  - Contact (page hero + form + location detail)
  - Giving (hero + CTA + FAQ)
- [ ] Store templates as JSON (section type + default content arrays)
- [ ] Add template selection step in "Add Page" modal
- [ ] On selection: create page + bulk-create all template sections via API
- [ ] Template preview (static image or mini rendered preview)

### 4.3 CMS Content ↔ Builder Connection
> **Est: 2-3 days** | **Priority: P1** | **Status: 🚧**

Dynamic sections (ALL_MESSAGES, ALL_EVENTS, etc.) pull data from CMS content. The builder needs to make this connection clear and configurable.

- [ ] Data-driven section editors show "This section auto-populates from [Content Type]" label
- [ ] Add filter options where applicable (e.g., "Show only featured events", "Limit to 6 messages")
- [ ] Show preview count of items that would display
- [ ] "Manage [Content Type]" link opens the relevant CMS page in new tab
- [ ] Verify that content changes in CMS (new message, new event) reflect on website without builder interaction

### 4.4 Image Upload in Section Editors
> **Est: 1-2 days** | **Priority: P1** | **Status: 🚧**

Many sections need images (heroes, cards, galleries). Editors currently accept URL strings but don't have image upload.

- [ ] Add image upload button/dropzone to image URL fields
- [ ] Reuse existing R2 staging upload infrastructure from TipTap editor
- [ ] Show image preview after upload
- [ ] Support both URL paste and file upload

### 4.5 Theme Presets & Font Pairings
> **Est: 1-2 days** | **Priority: P1** | **Status: 🚧**

The standalone theme page has font pairings (6 curated options). The design panel should surface these too.

- [ ] 6-8 color presets (e.g., "Ocean Blue", "Warm Earth", "Modern Minimal")
- [ ] One-click apply: sets primary + secondary + background + text colors
- [ ] 6-8 font pairings (already exist on theme page — reuse)
- [ ] Show active preset/pairing indicator

---

## 5. Priority 3: Make the Product Successful

These differentiate us and make the product delightful for the target user.

### 5.1 Onboarding Flow with Template Selection
> **Est: 3-5 days** | **Priority: P1** | **Status: ❌**

First-time experience. When a new church signs up, they should:

- [ ] See a template gallery (3-5 complete site templates, not just page templates)
- [ ] Each template has a live preview / screenshot
- [ ] Select a template → system creates all pages + sections + default content + menu items
- [ ] Admin lands in the builder with a fully populated site ready to customize
- [ ] "Quick Start" guide: overlay or checklist pointing to key areas to customize

### 5.2 Different Site Templates
> **Est: 5-7 days** | **Priority: P2** | **Status: ❌**

Multiple complete site designs, not just page templates. Each template is a combination of:
- Pre-built pages with sections
- Color/font theme preset
- Navbar/footer layout variant
- Default content appropriate to church type

- [ ] Design Template 1: "Modern Church" — clean, minimal, contemporary
- [ ] Design Template 2: "Traditional" — classic serif fonts, warm tones
- [ ] Design Template 3: "Campus Ministry" — bold, youthful, bright
- [ ] Template data structure: JSON file with pages[], sections[], theme{}, menus[]
- [ ] "Preview Template" renders full site with sample data
- [ ] "Apply Template" creates all entities via API (transactional)

### 5.3 Header/Footer Layout Variants
> **Est: 2-3 days** | **Priority: P2** | **Status: ❌**

Currently one navbar and one footer design. Churches want variety.

- [ ] 2-3 navbar variants (centered logo, left logo + right menu, minimal)
- [ ] 2-3 footer variants (multi-column, minimal, centered)
- [ ] Selection in site settings or design panel
- [ ] Store variant choice in `ThemeCustomization.navbarStyle` / `footerStyle`

### 5.4 Custom Domain Setup
> **Est: 3-5 days** | **Priority: P2** | **Status: ❌**

The domain manager page shows "Coming Soon". Full implementation requires:

- [ ] Domain input with DNS instruction display
- [ ] CNAME/TXT record verification flow
- [ ] SSL certificate provisioning (Let's Encrypt via Caddy or similar)
- [ ] Domain status polling (pending → verified → active)
- [ ] Middleware for hostname → church routing

### 5.5 Multi-Tenant Middleware
> **Est: 3-5 days** | **Priority: P2** | **Status: ❌**

Required when Church #2 comes online. Not needed for LA UBF single-tenant launch.

- [ ] `middleware.ts`: hostname → `x-tenant-id` header injection
- [ ] Subdomain routing: `{slug}.lclab.io` → church lookup
- [ ] Custom domain routing: `mytruth.org` → church lookup via `CustomDomain` table
- [ ] Fallback for unknown hosts

---

## 6. Time Estimates Summary

Based on your velocity: ~9 commits/day, features in 2-4 days, complex features in 5-9 days. Budget 1.5x for polish and edge cases.

### Path to MVP Launch (LA UBF single-tenant)

| Task | Est. Days | Cumulative | Depends On |
|------|-----------|------------|------------|
| 3.1 Fix editor ↔ content mapping | 3-4 | 3-4 | — |
| 3.2 Wire navbar save | 0.5 | 4-5 | — |
| 3.3 Editing UX redesign | 3-4 | 7-9 | Decision needed |
| 3.4 Test all section types E2E | 2-3 | 9-12 | 3.1 |
| 3.5 Section default content | 1-2 | 10-14 | 3.1 |
| **Subtotal: Builder Runs** | **10-14 days** | | |

### Path to Product-Ready

| Task | Est. Days | Depends On |
|------|-----------|------------|
| 4.1 Design panel | 2-3 | Builder runs |
| 4.2 Page templates | 3-4 | Builder runs |
| 4.3 CMS ↔ Builder connection | 2-3 | 3.1 |
| 4.4 Image upload in editors | 1-2 | 3.1 |
| 4.5 Theme presets | 1-2 | 4.1 |
| **Subtotal: Builder Useful** | **9-14 days** | |

### Path to Scalable Product

| Task | Est. Days | Depends On |
|------|-----------|------------|
| 5.1 Onboarding flow | 3-5 | 4.2 |
| 5.2 Site templates | 5-7 | 4.2, 4.5 |
| 5.3 Header/footer variants | 2-3 | — |
| 5.4 Custom domains | 3-5 | 5.5 |
| 5.5 Multi-tenant middleware | 3-5 | — |
| **Subtotal: Product Successful** | **16-25 days** | |

### Total Estimated Timeline

| Milestone | Days | Calendar (at 5 active days/week) |
|-----------|------|----------------------------------|
| Builder MVP (runs) | 10-14 | ~2-3 weeks |
| Product-ready | +9-14 | ~2-3 more weeks |
| Multi-tenant ready | +16-25 | ~3-5 more weeks |
| **Total to full product** | **35-53 days** | **~7-11 weeks** |

---

## 7. User Journeys to Test

These are the critical paths a church admin walks through. Every one must work flawlessly.

### Journey 1: "I just signed up, I want to see my website"
- [ ] New admin logs in → sees builder with template selection
- [ ] Picks a template → site is created with pages, sections, theme
- [ ] Clicks "View Site" → sees a real, populated website
- [ ] **Success criteria**: Under 5 minutes from signup to live preview

### Journey 2: "I need to post this week's sermon"
- [ ] Admin goes to Messages CMS → creates message entry → saves
- [ ] Goes to website → Sermons page automatically shows new message
- [ ] No builder interaction needed
- [ ] **Success criteria**: Content changes auto-propagate to website

### Journey 3: "I want to update the homepage hero"
- [ ] Admin opens builder → homepage loads in canvas
- [ ] Clicks hero section → editor opens
- [ ] Changes heading text, uploads new background image
- [ ] Sees changes on canvas in real-time
- [ ] Clicks Save → changes persist
- [ ] Views public website → hero is updated
- [ ] **Success criteria**: Edit → see → save in under 2 minutes

### Journey 4: "I want to add a new page for our retreat"
- [ ] Admin opens builder → clicks "Add Page" in page tree
- [ ] Enters title "Spring Retreat 2026" → picks Events template
- [ ] Builder creates page with hero + event details + registration form
- [ ] Admin edits sections (changes dates, adds image, updates form)
- [ ] Publishes page → adds link to navbar
- [ ] **Success criteria**: New page live in under 10 minutes

### Journey 5: "I want to change the site colors/fonts"
- [ ] Admin opens builder → clicks Design in sidebar
- [ ] Sees current colors and fonts
- [ ] Picks a color preset → canvas updates immediately
- [ ] Picks a font pairing → canvas updates immediately
- [ ] Saves → views public website → theme is updated
- [ ] **Success criteria**: Theme change in under 2 minutes

### Journey 6: "I want to rearrange sections on a page"
- [ ] Admin opens builder → selects a page
- [ ] Drags a section from position 3 to position 1
- [ ] Order updates on canvas immediately
- [ ] Auto-save persists the change
- [ ] **Success criteria**: Drag-and-drop works smoothly, order persists

### Journey 7: "I accidentally deleted something"
- [ ] Admin deletes a section → toast shows with "Undo"
- [ ] Admin presses Cmd+Z → section is restored
- [ ] OR: Admin can undo multiple steps
- [ ] **Success criteria**: Mistakes are recoverable

### Journey 8: "A new admin takes over"
- [ ] New admin logs in → builder loads with existing site
- [ ] Can navigate pages, edit sections, change theme without training
- [ ] Section editors have clear labels and placeholder text
- [ ] **Success criteria**: Self-service, no training manual needed

---

## Appendix: Architecture Quick Reference

### API Endpoints (all working)

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/v1/pages` | GET, POST | List/create pages |
| `/api/v1/pages/[slug]` | GET, PATCH, DELETE | Page CRUD |
| `/api/v1/pages/[slug]/sections` | POST, PUT | Add section, reorder |
| `/api/v1/pages/[slug]/sections/[id]` | PATCH, DELETE | Edit/delete section |
| `/api/v1/menus` | GET | List menus |
| `/api/v1/menus/[id]/items` | GET, POST, PUT | Menu item CRUD + reorder |
| `/api/v1/menus/[id]/items/[id]` | PATCH, DELETE | Edit/delete item |
| `/api/v1/theme` | GET, PATCH | Theme customization |
| `/api/v1/site-settings` | GET, PATCH | Site settings |
| `/api/v1/domains` | GET, POST | Domain management |
| `/api/v1/domains/[id]` | DELETE | Remove domain |

### Key Files

| File | Purpose |
|------|---------|
| `components/cms/website/builder/builder-shell.tsx` | Main orchestrator (state, save, undo) |
| `components/cms/website/builder/builder-canvas.tsx` | WYSIWYG preview canvas |
| `components/cms/website/builder/builder-right-drawer.tsx` | Section editor panel |
| `components/cms/website/builder/section-editors/index.tsx` | Editor router by type |
| `components/cms/website/builder/section-picker-modal.tsx` | Add section modal |
| `components/website/sections/registry.tsx` | Section type → component map |
| `lib/website/resolve-section-data.ts` | Dynamic data resolution |
| `lib/dal/pages.ts` | Page + section database queries |
| `lib/dal/theme.ts` | Theme database queries |

### Section Types (42 total, 40 real)

**Heroes (5):** HERO_BANNER, PAGE_HERO, TEXT_IMAGE_HERO, EVENTS_HERO, MINISTRY_HERO
**Content (8):** MEDIA_TEXT, MEDIA_GRID, SPOTLIGHT_MEDIA, PHOTO_GALLERY, QUOTE_BANNER, CTA_BANNER, ABOUT_DESCRIPTION, STATEMENT
**Cards (6):** ACTION_CARD_GRID, HIGHLIGHT_CARDS, FEATURE_BREAKDOWN, PATHWAY_CARD, PILLARS, NEWCOMER
**Data (8):** ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS, UPCOMING_EVENTS, EVENT_CALENDAR, RECURRING_MEETINGS, RECURRING_SCHEDULE
**Ministry (6):** MINISTRY_INTRO, MINISTRY_SCHEDULE, CAMPUS_CARD_GRID, DIRECTORY_LIST, MEET_TEAM, LOCATION_DETAIL
**Interactive (4):** FORM_SECTION, FAQ_SECTION, TIMELINE_SECTION, DAILY_BREAD_FEATURE
**Layout (5):** NAVBAR, FOOTER, QUICK_LINKS, CUSTOM_HTML, CUSTOM_EMBED
