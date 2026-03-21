# Subpage Template Editing — Brainstorm

> **Date:** March 20, 2026
> **Context:** The builder currently has zero support for editing CMS-driven detail pages (message detail, event detail, bible study detail). These are hardcoded React routes with fixed layouts. This doc explores how to introduce template-level customization for these pages.

---

## Current State

### Two completely separate rendering paths

| Path | Examples | Rendering | Editable in builder? |
|---|---|---|---|
| **Builder pages** | Home, About, Events (list), Messages (list) | `Page` + `PageSection[]` via section registry | Yes |
| **Detail pages** | `/messages/[slug]`, `/events/[slug]`, `/bible-study/[slug]` | Hardcoded React components with fixed layouts | No |

Detail pages don't use the `Page`/`PageSection` system at all. They fetch directly from DAL and render their own layouts. There's no template model, no color scheme control, no section composition.

### What admins can't do today

- Change the color scheme of a message detail page
- Rearrange or hide sections on an event detail page
- Add a CTA banner below a bible study
- Preview what a detail page looks like with different styling

---

## Competitive Research Summary

| Platform | Template model | Per-item variants | Navigation to template |
|---|---|---|---|
| **Webflow** | 1 template per collection, conditional visibility | CMS toggle fields show/hide sections | Dedicated "CMS Collection Pages" section in page tree |
| **Squarespace** | Fixed layouts per content type, global style only | None (uniform styling) | Click through collection to item |
| **Wix** | 1 template per collection, Velo for advanced | Code-based only | "Dynamic Pages" section in page tree |
| **Shopify** | Multiple named templates per resource type, assignable per item | Full template assignment | Theme editor dropdown by resource type |
| **WordPress** | Multiple templates, hierarchy auto-selects | Template assignment per post/category | Site Editor > Templates list |
| **Framer** | 1 template per collection, component variants via CMS fields | CMS toggle fields swap component variants | CMS page in regular page tree |

**Key insight:** Every platform shows templates as first-class objects in the page/template tree. The most common pattern is a dedicated "Templates" section.

---

## Proposed Options

### Option A: "Style-Only Templates" (Minimum viable, recommended for MVP)

**Concept:** Detail pages stay as hardcoded React components, but they read a `DetailPageTemplate` record from the database for style overrides (color scheme, font overrides, accent colors). No section composition.

**How it works:**
1. New Prisma model: `DetailPageTemplate` with fields like `contentType` (MESSAGE, EVENT, BIBLE_STUDY), `colorScheme`, `headerStyle` (full-width, compact, minimal), `showRelatedContent`, etc.
2. Detail page components read these settings at render time and apply them
3. In the builder, a new "Templates" section in the page tree shows the 3 detail page types
4. Clicking one opens a simplified editor (no canvas) with style toggles only

**Builder UX:**
```
Page Tree
  |-- Home
  |-- About
  |-- Messages
  |-- Events
  |-- ...
  |
  TEMPLATES
  |-- Message Detail    [style settings only]
  |-- Event Detail      [style settings only]
  +-- Bible Study Detail [style settings only]
```

**Pros:**
- Minimal code change — detail page components stay mostly intact
- No new rendering pipeline needed
- Fast to implement (2-3 days)
- Safe — can't break detail page functionality

**Cons:**
- No section composition (can't add/remove/reorder sections)
- Limited customization (just color scheme + a few toggles)
- Doesn't scale to more content types without more code

---

### Option B: "Hybrid Templates" (Section header/footer, fixed content core)

**Concept:** Detail pages get optional "before" and "after" section zones that use the PageSection system, while the core content area stays hardcoded. Think of it as a sandwich: customizable bread, fixed filling.

**How it works:**
1. Each detail page type has a `Page` record with `pageType: TEMPLATE`
2. The Page has sections, but the detail page component renders them in zones:
   - **Header zone** (sections before the content) — e.g., a hero banner
   - **Core zone** (hardcoded, not in PageSection) — the actual message/event/study content
   - **Footer zone** (sections after the content) — e.g., CTA, related content
3. In the builder, clicking the template shows the canvas with the zones clearly marked
4. The core zone shows a "Content Area" placeholder that can't be edited

**Builder UX:**
```
Canvas preview:
  [Hero Section]           <-- editable, from PageSection
  [--- Content Area ---]   <-- locked placeholder, renders detail page
  [CTA Banner]             <-- editable, from PageSection
  [Related Content]        <-- editable, from PageSection
```

**Pros:**
- Section composition for header/footer zones
- Core content stays safe (can't break it)
- Uses existing PageSection infrastructure
- Natural extension of the builder mental model

**Cons:**
- Need to implement zone rendering in each detail page component
- "Content Area" placeholder in the canvas is a new UX concept
- Medium effort (5-8 days)
- Still can't rearrange the core content

---

### Option C: "Full Template Composition" (Shopify/Webflow model)

**Concept:** Detail pages become fully section-composed templates. The core content (message player, event details, study tabs) becomes a special "Content" section type that auto-binds to CMS data. Everything else is regular sections.

**How it works:**
1. New section types: `MESSAGE_CONTENT`, `EVENT_CONTENT`, `BIBLE_STUDY_CONTENT`
2. These sections are "data-bound" — they render the detail page content from the current item
3. A detail page template is a regular `Page` with these content sections plus any other sections
4. Template is locked by default (content section can't be removed) but other sections can be added around it
5. In the builder, the template renders with sample data (latest message, next event, etc.)

**Builder UX:**
```
Canvas preview (Message Template):
  [Page Header]              <-- editable section
  [Message Content]          <-- locked, data-bound, shows real preview
  [Related Messages]         <-- editable section
  [CTA Banner]               <-- editable section
```

**Pros:**
- Full compositional power — same as any other page
- Consistent mental model (everything is sections)
- Can preview with real data (Shopify/Webflow-style item switcher)
- Scales to new content types by adding new content section types

**Cons:**
- Largest effort (2-3 weeks)
- Need to refactor detail page components into section components
- Need "locked section" enforcement in the builder
- Need data resolution for content sections (similar to existing `resolveSectionData`)
- Need sample data selection UI in the builder

---

### Option D: "Variant Presets" (Framer model)

**Concept:** Detail pages have a small number of pre-designed layout variants (e.g., "Classic," "Minimal," "Full-width") that are hardcoded but selectable per content type. Color scheme is customizable.

**How it works:**
1. Each detail page component supports 2-3 layout variants via a prop
2. A settings record stores the selected variant + color scheme per content type
3. In the builder, a template settings panel lets admins choose variant + colors
4. No section composition — just pick from pre-built options

**Builder UX:**
```
Template Settings (Message Detail):
  Layout: [Classic] [Minimal] [Cinematic]
  Color Scheme: [Light] [Dark] [Brand] [Muted]
  Show Related Content: [on/off]
  Show Study Guide: [on/off]
```

**Pros:**
- Very simple for admins (just pick a preset)
- No section composition complexity
- Design quality stays high (each variant is hand-crafted)
- Quick to implement per content type (3-5 days total)

**Cons:**
- Limited to pre-designed variants (not truly customizable)
- Adding new variants requires developer work
- Doesn't scale as well as section-based approaches

---

## Recommendation

### For MVP: Option A (Style-Only) or Option D (Variant Presets)

Both are implementable in days, not weeks. Option D gives slightly more visual impact (layout variants) while Option A is simpler to maintain.

### For V2: Option B (Hybrid Templates)

This is the sweet spot of power vs complexity. It gives admins meaningful customization (add sections above/below content) without the risk of breaking the core content rendering.

### For V3 (if needed): Option C (Full Composition)

Only pursue this if churches consistently ask for full control over detail page layouts. The Shopify model is powerful but complex — most church admins won't need it.

---

## Decisions for David

1. **Which option for MVP?** A (style-only), D (variant presets), or skip for now?
2. **Which content types first?** All three (message, event, bible study) or start with one?
3. **Where in the page tree?** Dedicated "Templates" section, or mixed in with regular pages?
4. **Preview with real data?** Should the builder show an actual message/event when editing the template, or just a placeholder?

---

## Appendix: Content Type Detail Page Inventory

| Content Type | Route | Current Layout | Color Scheme Support | Key Sections |
|---|---|---|---|---|
| Message | `/messages/[slug]` | 2-col: video + sidebar | None (hardcoded dark) | Video player, series badge, speaker, transcript, study guide link, attachments |
| Event | `/events/[slug]` | 2-col: article + sidebar | None (hardcoded) | Cover image, description, details card (date/time/location), registration, calendar, links |
| Bible Study | `/bible-study/[slug]` | Tabbed content viewer | None (hardcoded) | Tab bar (Bible/Questions/Answers/Message), TipTap content, attachments |
