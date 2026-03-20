# Section System Redesign — Product Recommendation

> **Author perspective:** Chief Product Designer, Shopify Online Store
> **Date:** March 17, 2026
> **Audience:** David (founder/engineer), future contributors
> **Input:** Full audit of 41 section types, 14 editor files, 8 categories, and the existing gap analysis

---

## Executive Summary

You built a powerful section system. 41 types, full structured editors, live canvas preview — it works. But it has a classic builder-team problem: **the catalog was designed around components, not around user intent.**

Church admins don't think in `HERO_BANNER` vs `PAGE_HERO` vs `TEXT_IMAGE_HERO` vs `EVENTS_HERO` vs `MINISTRY_HERO`. They think: "I need a big section at the top of my page with a headline and a button."

This recommendation consolidates 41 types into **24 section types** across **6 categories**, without removing any rendering capability. Every current layout is preserved — but exposed as a **variant** within a parent type, not as a separate catalog entry. The result: a section picker that a volunteer church admin can scan in 10 seconds, not 60.

---

## Philosophy

### What Shopify learned (and what applies here)

1. **Fewer types, more variants.** Online Store 2.0 has ~16 section types per theme. Each section has settings that change its layout. Users pick "Image with text" once — not "Image left with text right" vs "Image right with text left" vs "Image top with text bottom."

2. **Name sections by what the user wants, not what the developer built.** "Rich text" not "STATEMENT". "Multicolumn" not "PATHWAY_CARD". "Contact form" not "FORM_SECTION".

3. **Categories map to user goals, not component architecture.** Users think: "I want to show upcoming events" (goal) → finds it in "Dynamic content" (category). They don't think: "I need a DATA_TYPES section routed through data-section-editor.tsx."

4. **Data-driven sections are not a category — they're a trait.** Shopify doesn't separate "manual product grid" from "auto-populated product grid" into different categories. Both live in "Product" sections. The data source is a *setting* on the section, not a reason to create a separate type.

5. **The section picker is the onboarding.** If a new admin opens the section picker and feels overwhelmed, you've already lost. 41 items with developer names is overwhelming. 24 items with plain English names is manageable.

6. **Editors should feel like filling out a card, not configuring software.** Group fields into Content and Style. Lead with what the user types (heading, body, button text). Bury what they set once (image position, aspect ratio).

---

## Current State → Proposed State

### Category Restructure

| Current (8 categories, 41 types) | Proposed (6 categories, 25 types) |
|---|---|
| Heroes (5) | **Hero** (3) |
| Content (8) | **Content** (6) |
| Cards & Grids (6) | **Cards** (4) |
| Lists & Data (8) | **Dynamic Content** (5) |
| Ministry (6) | **People & Places** (3) |
| Interactive (3) | **Interactive** (2) |
| Layout (3) | → merged into Content + Dynamic Content |
| Custom (2) | **Embed** (2) |

---

## Section Consolidations

### A. Heroes: 5 → 3

> **Updated 2026-03-19:** Adopted Webflow model — separate Hero (homepage) from Page Header (inner pages). See `competitor-naming-audit.md` for rationale.

**The problem:** Five hero types that differ only in layout arrangement. A church admin shouldn't need to know the difference between `HERO_BANNER`, `PAGE_HERO`, `TEXT_IMAGE_HERO`, `EVENTS_HERO`, and `MINISTRY_HERO`.

**The solution:** Three non-overlapping types based on *where* they're used, not *how* they look.

#### 1. **Hero** (merges HERO_BANNER, TEXT_IMAGE_HERO)

The dramatic, full-impact section for the **homepage** (or landing pages). Two layout variants with rich sub-options.

| Layout Variant | Maps to Current | Visual |
|---|---|---|
| **Full-width background** | HERO_BANNER | Background media, text overlay |
| **Split** | TEXT_IMAGE_HERO | Text block + media block arranged in one of 4 positions |

**Split sub-layouts** (shown as 2x2 visual thumbnail grid in editor):

| Arrangement | Description |
|---|---|
| Text Left / Image Right | Classic side-by-side, text leads |
| Image Left / Text Right | Image leads, text follows |
| Text Top / Image Bottom | Stacked, text above |
| Image Top / Text Bottom | Stacked, image above |

Editor fields (all variants):
- Heading (text)
- Subheading / description (textarea)
- Primary button (label + link + visible)
- Secondary button (label + link + visible)

**Layout controls:**
- **Full-width text position** — two independent toggles:
  - Horizontal: Left / Center / Right
  - Vertical: Top / Middle / Bottom
- **Split arrangement** — 2x2 visual thumbnail picker (see table above)
- **Split text alignment** — Left / Center / Right toggle (within the text block)

**Media type** (applies to both variants):
- **Image** — single image via media library picker. If 2+ images added, automatically becomes a carousel (no separate "carousel" option needed — inferred from count, like Squarespace).
- **Video** — URL input OR media library video picker. Shows thumbnail preview in editor.
- Media library integration is required for both — no raw URL-only inputs for images.
- Editor must show a live preview of the selected media (currently broken — fix required).

**Color scheme** (section-level, applies to all sections):
- Uses the existing `PageSection.colorScheme` field
- Presets exposed in every section editor:
  - Default (current dark overlay style)
  - Light (white/light bg, dark text)
  - Dark (dark bg, light text)
  - Brand (primary color bg, contrast text)
- Presets auto-apply to all text, buttons, and overlays within the section. Not hero-specific — this is a platform-level feature for all section types.

Variant-specific fields (shown/hidden based on Layout selection):
- **Full-width**: Background media picker (image/video), overline
- **Split**: Media picker (image/video), overline, heading accent line

#### 2. **Page Header** (merges PAGE_HERO, EVENTS_HERO)

The utilitarian top section for **inner pages** (About, Events, Messages, etc.). Orients the visitor — "where am I?" — without the dramatic visual treatment of the Hero.

| Layout Variant | Maps to Current | Visual |
|---|---|---|
| **Centered** | PAGE_HERO | Centered heading + overline + buttons |
| **Simple** | EVENTS_HERO | Just heading + subtitle, minimal |

Editor fields:
- Overline (text, optional)
- Heading (text)
- Subheading / description (textarea)
- Primary button (label + link + visible)
- Secondary button (label + link + visible)

This is the most commonly used top-of-page section. Most inner pages will use it.

#### 3. **Ministry Header** (keeps MINISTRY_HERO as-is)

Specialized header for **ministry hub pages** only. Stays separate because it has genuinely different content: social links, heading style toggle (display/sans), and ministry-specific fields that don't apply elsewhere.

- Add the social links array editor (currently JSON-only — per gap analysis)

---

### B. Content: 8 → 6

#### 3. **Image & Text** (keeps MEDIA_TEXT)
- Rename from "Media & Text" → "Image & Text" (clearer)
- Add the image array editor (currently JSON-only)
- No other changes — already complete

#### 4. **Quote** (keeps QUOTE_BANNER)
- Rename from "Quote Banner" → "Quote"
- Already complete

#### 5. **Call to Action** (keeps CTA_BANNER)
- Already complete, name is fine

#### 6. **About** (keeps ABOUT_DESCRIPTION)
- Rename from "About Description" → "About"
- Already complete

#### 7. **Statement** (keeps STATEMENT)
- Already complete
- Fix hardcoded mask image URL (code-only)

#### 8. **Photo Gallery** (keeps PHOTO_GALLERY — move from Layout into Content)
- Already complete, just recategorize

**What about SPOTLIGHT_MEDIA?** → Move to Dynamic Content (see below). It's data-driven, not static content.

---

### C. Cards: 6 → 4

#### 9. **Card Grid** (merges ACTION_CARD_GRID + PATHWAY_CARD)

Both are "grid of cards with heading." The difference is visual treatment:

| Style Variant | Maps to Current | Visual |
|---|---|---|
| **Image cards** | ACTION_CARD_GRID | Cards with cover images, 2×2 grid |
| **Icon cards** | PATHWAY_CARD | Cards with icon, vertical stack |

Shared fields: heading, description, CTA, cards array.
- Image card: title, description, image, link per card
- Icon card: icon key, title, description, button label/link per card

The editor swaps the card sub-form based on style.

#### 10. **Feature Breakdown** (keeps FEATURE_BREAKDOWN)
- Unique acronym-style layout, not mergeable
- Fix hardcoded watermark URL (code-only)
- Rename in picker to: **"Feature List"**

#### 11. **Alternating Content** (keeps PILLARS)
- Rename from "Pillars" → "Alternating Content" (describes the layout, not the content)
- Add image array per pillar item (currently JSON-only — highest-effort gap item)

#### 12. **Welcome Banner** (keeps NEWCOMER)
- Rename from "Newcomer Welcome" → "Welcome Banner"
- Already complete

**What about HIGHLIGHT_CARDS?** → Move to Dynamic Content (see below). It's data-driven.

---

### D. Dynamic Content: 8 → 5

All data-driven sections. The key insight: users don't need to pick between "All Messages," "All Events," "All Bible Studies," and "All Videos" as four separate section types. They're the same pattern with a different data source.

#### 13. **Content Listing** (merges ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS)

One section type with a **Data Source** dropdown:

| Data Source | Maps to Current | Renders |
|---|---|---|
| Messages | ALL_MESSAGES | Searchable sermon grid |
| Events | ALL_EVENTS | Event listing with filters |
| Bible Studies | ALL_BIBLE_STUDIES | Bible study grid |
| Videos | ALL_VIDEOS | Video grid with modal playback |

Editor: heading + data source dropdown. That's it. The component renders the correct grid/filter UI based on the data source.

This is the single highest-impact consolidation. Four nearly-identical editor experiences become one.

#### 14. **Featured Content** (merges SPOTLIGHT_MEDIA, HIGHLIGHT_CARDS, MEDIA_GRID)

These are all "show a small selection of CMS content prominently":

| Style Variant | Maps to Current | Visual |
|---|---|---|
| **Spotlight** | SPOTLIGHT_MEDIA | Single featured item (large) |
| **Highlight cards** | HIGHLIGHT_CARDS | 1 large + 2 small cards |
| **Video grid** | MEDIA_GRID | Grid of video thumbnails |

Editor: heading, CTA label/link, style variant, data source. The SPOTLIGHT_MEDIA editor should be simplified (remove manual sermon fields per gap analysis — it's data-driven).

#### 15. **Upcoming Events** (keeps UPCOMING_EVENTS)
- Distinct enough to stay (overline + heading + event cards + CTA)
- Already complete

#### 16. **Event Calendar** (keeps EVENT_CALENDAR)
- Interactive calendar with list/month toggle — very distinct
- Add CTA buttons array (optional, per gap analysis)

#### 17. **Recurring Meetings** (merges RECURRING_MEETINGS + QUICK_LINKS)

Both show recurring meeting data from the same source (`upcoming-events`). QUICK_LINKS is a horizontal scroll variant of the same data.

| Layout Variant | Maps to Current | Visual |
|---|---|---|
| **List** | RECURRING_MEETINGS | Vertical list with join buttons |
| **Carousel** | QUICK_LINKS | Horizontal scrolling cards |

Editor: heading, subtitle, max visible (list only), view all link. Layout toggle.

**What about DAILY_BREAD_FEATURE?** → Keep it as a hidden/internal type. It's a placeholder with no component. Don't show it in the picker until the component exists.

**What about RECURRING_SCHEDULE?** → Move to People & Places (see below). It's a static schedule, not dynamic data.

---

### E. People & Places: 6 → 3

Ministry sections share a pattern: they describe a specific group or location. But there are too many for what they do.

#### 18. **Team** (keeps MEET_TEAM)
- Rename from "Meet the Team" → "Team"
- Swap photo URL text input for image picker (per gap analysis)

#### 19. **Location** (merges LOCATION_DETAIL + MINISTRY_SCHEDULE + CAMPUS_CARD_GRID)

All three describe a physical place with schedule information:

| Layout Variant | Maps to Current | Visual |
|---|---|---|
| **Detail** | LOCATION_DETAIL | Two-column: service time, address, directions, image |
| **Schedule** | MINISTRY_SCHEDULE | Two-column: heading, schedule entries, buttons, image |
| **Card grid** | CAMPUS_CARD_GRID | Grid of campus cards with photos |

Shared fields: heading, description.
- Detail variant: overline, time label/value, address lines, directions link, images
- Schedule variant: schedule entries array, buttons array, image
- Card grid variant: campus cards array, overline

This consolidation works because all three answer the same user question: "Where and when can people find us?"

Add the missing fields from the gap analysis (timeValue, address, directions URL, image for MINISTRY_SCHEDULE; ctaHeading + CTA button for CAMPUS_CARD_GRID; time label + images for LOCATION_DETAIL).

#### 20. **Ministry Intro** (merges MINISTRY_INTRO + DIRECTORY_LIST)

Both introduce a ministry or group of ministries:

| Layout Variant | Maps to Current | Visual |
|---|---|---|
| **Single** | MINISTRY_INTRO | Heading, description, side image |
| **Directory** | DIRECTORY_LIST | List of linked items with parallax background |

Editor: heading, description. Single variant adds overline + image. Directory variant adds items array, background image, CTA.

**What about RECURRING_SCHEDULE?** → Fold into Location (Schedule variant). The content is similar: heading, subtitle, meetings array with day/time/location. The only difference is RECURRING_SCHEDULE is static (content JSON) while MINISTRY_SCHEDULE reads schedule entries. Since Location already has a Schedule variant, RECURRING_SCHEDULE can be a sub-variant that uses static meeting cards instead of a two-column layout. Alternatively, keep it as a standalone if the visual treatment is too different — **this is the one consolidation I'd deprioritize.**

---

### F. Interactive: 3 → 2

#### 21. **FAQ** (keeps FAQ_SECTION)
- Already complete
- Rename in picker to just: **"FAQ"**

#### 22. **Timeline** (keeps TIMELINE_SECTION)
- Already complete
- Rename in picker to just: **"Timeline"**

**What about FORM_SECTION?** → See below.

---

### G. Standalone Types (not in a group)

#### 23. **Contact Form** (keeps FORM_SECTION)
- Already complete
- Move out of "Interactive" — it's a standalone utility section
- Category: appears at the top level or in a "Forms" category
- Rename to: **"Contact Form"**

#### 24. **Custom Embed** (merges CUSTOM_HTML + CUSTOM_EMBED)

Both are "inject external content":

| Mode | Maps to Current | Input |
|---|---|---|
| **HTML** | CUSTOM_HTML | Raw HTML textarea |
| **URL** | CUSTOM_EMBED | iframe URL + aspect ratio |

Tab toggle between HTML and URL mode. One section type, two input modes.

---

### Sections Not in the Picker

| Current Type | Disposition |
|---|---|
| FOOTER | Handled by site-level Footer settings, not added per-page |
| NAVBAR | Already excluded (handled by layout) |
| DAILY_BREAD_FEATURE | Placeholder — hide until component exists |

---

## Proposed Section Picker

What the admin sees when they click "Add Section":

```
Hero (3)
  ├── Hero                    → full-width or split (homepage/landing)
  ├── Page Header             → centered or simple (inner pages)
  └── Ministry Header         → ministry pages only

Content (6)
  ├── Image & Text            → rotating image carousel + text
  ├── Quote                   → dark banner with verse/quote
  ├── Call to Action           → CTA banner with buttons
  ├── About                   → logo, heading, description, video
  ├── Statement               → scroll-tracked paragraphs
  └── Photo Gallery            → infinite horizontal carousel

Cards (4)
  ├── Card Grid               → image cards or icon cards
  ├── Feature List             → acronym-style breakdown
  ├── Alternating Content      → zigzag image + text blocks
  └── Welcome Banner           → centered welcome with CTA

Dynamic Content (5)
  ├── Content Listing          → messages, events, studies, videos
  ├── Featured Content         → spotlight, highlights, video grid
  ├── Upcoming Events          → event cards with CTA
  ├── Event Calendar           → interactive calendar view
  └── Recurring Meetings       → list or carousel of meetings

People & Places (3)
  ├── Team                     → member cards with photo, role, bio
  ├── Location                 → address, schedule, campus cards
  └── Ministry Intro           → single intro or directory list

Utility (3)
  ├── FAQ                      → accordion Q&A
  ├── Timeline                 → vertical timeline steps
  └── Contact Form             → form with interests, campus, etc.

Embed (1)
  └── Custom Embed             → HTML or iframe URL
```

**Total: 25 types.** Down from 41. Every current rendering is preserved as a variant.

---

## Implementation Strategy

### What changes and what doesn't

| Layer | Changes? | Details |
|---|---|---|
| **Database** | No | `SectionType` enum keeps all 41 values. No migration needed. |
| **Section components** | No | All 41 components stay as-is. They render the same way. |
| **Section registry** | No | Same mapping from type → component. |
| **Section catalog** | Yes | Catalog entries consolidate. New parent types with variant settings. |
| **Section editors** | Yes | Editors gain a layout/variant toggle that shows/hides fields. |
| **Section picker UI** | Yes | Shows 24 items instead of 41. Picking a type + variant writes the correct `SectionType` to the DB. |
| **resolve-section-data** | No | Data sources unchanged. |

### The key architectural insight

**The `SectionType` enum doesn't change.** The database still stores `HERO_BANNER`, `PAGE_HERO`, etc. The consolidation is purely in the builder UX — the picker and editor present variants, but write the original enum value to the DB.

This means:
- Zero migration risk
- Existing pages render identically
- The public website rendering pipeline is untouched
- Rollback is trivial (just revert the picker/editor changes)

### Migration path

**Phase 1 — Rename + Recategorize (1-2 days)**
- Update `section-catalog.ts` labels and category groupings
- No editor changes, no consolidation
- Immediate UX improvement: clearer names, fewer categories

**Phase 2 — Close the Gaps (3-5 days)**
- Implement the 13 editor gaps from the gap analysis
- Fix 4 hardcoded URLs
- This is independent of consolidation — do it regardless

**Phase 3 — Consolidate Pickers (3-5 days)**
- Merge the simple cases first: ALL_* → Content Listing, CUSTOM_HTML + CUSTOM_EMBED → Custom Embed
- Add variant toggles to Hero (4 layouts)
- Update section picker to show parent types with variant selection

**Phase 4 — Consolidate Editors (5-8 days)**
- Merge editor forms for consolidated types
- Add show/hide logic for variant-specific fields
- Test that each variant writes the correct SectionType and content shape

---

## What NOT to Do

1. **Don't rename the SectionType enum values.** `HERO_BANNER` stays `HERO_BANNER` in the database. The user-facing label changes, not the internal identifier.

2. **Don't merge section components.** Each component file stays separate. The rendering layer doesn't change at all.

3. **Don't build a generic "block editor."** The structured section approach is correct for your users. Church admins need guardrails, not a blank canvas. Notion-style block editing would be a regression.

4. **Don't over-consolidate.** If two sections look visually similar but serve different user intents (FAQ vs Timeline), keep them separate. Consolidation should reduce *confusion*, not *capability*.

5. **Don't do this all at once.** Phase 1 (rename + recategorize) gives you 60% of the UX benefit with 10% of the effort. Ship it, then iterate.

---

## Decisions for David

Before implementation, these need your call:

1. **RECURRING_SCHEDULE** — Fold into Location, or keep standalone? It's visually distinct enough that merging might feel forced.

2. **FOOTER** — Keep in the section picker (so pages can have custom footers), or fully remove from the picker and handle via site settings only?

3. **Content Listing consolidation** — Are you comfortable with a data source dropdown that dynamically changes the rendered component? This is the biggest architectural change (one picker entry → four different components via data source).

4. **Phase 1 timing** — The rename + recategorize is zero-risk. Can we ship it this week independent of everything else?

5. **Ministry Header** — Should this only appear in the picker when editing a ministry-type page? Shopify does this with "template-specific sections." Would reduce picker noise for non-ministry pages.

---

## Appendix: Full Mapping Table

| # | Proposed Name | Current Type(s) | Category | Variant | Data-Driven |
|---|---|---|---|---|---|
| 1 | Hero | HERO_BANNER | Hero | Full-width background | No |
| 1 | Hero | TEXT_IMAGE_HERO | Hero | Split | No |
| 2 | Page Header | PAGE_HERO | Hero | Centered | No |
| 2 | Page Header | EVENTS_HERO | Hero | Simple | No |
| 3 | Ministry Header | MINISTRY_HERO | Hero | — | No |
| 4 | Image & Text | MEDIA_TEXT | Content | — | No |
| 5 | Quote | QUOTE_BANNER | Content | — | No |
| 6 | Call to Action | CTA_BANNER | Content | — | No |
| 7 | About | ABOUT_DESCRIPTION | Content | — | No |
| 8 | Statement | STATEMENT | Content | — | No |
| 9 | Photo Gallery | PHOTO_GALLERY | Content | — | No |
| 10 | Card Grid | ACTION_CARD_GRID | Cards | Image cards | No |
| 10 | Card Grid | PATHWAY_CARD | Cards | Icon cards | No |
| 11 | Feature List | FEATURE_BREAKDOWN | Cards | — | No |
| 12 | Alternating Content | PILLARS | Cards | — | No |
| 13 | Welcome Banner | NEWCOMER | Cards | — | No |
| 14 | Content Listing | ALL_MESSAGES | Dynamic Content | Messages | Yes |
| 14 | Content Listing | ALL_EVENTS | Dynamic Content | Events | Yes |
| 14 | Content Listing | ALL_BIBLE_STUDIES | Dynamic Content | Bible Studies | Yes |
| 14 | Content Listing | ALL_VIDEOS | Dynamic Content | Videos | Yes |
| 15 | Featured Content | SPOTLIGHT_MEDIA | Dynamic Content | Spotlight | Yes |
| 15 | Featured Content | HIGHLIGHT_CARDS | Dynamic Content | Highlight cards | Yes |
| 15 | Featured Content | MEDIA_GRID | Dynamic Content | Video grid | Yes |
| 16 | Upcoming Events | UPCOMING_EVENTS | Dynamic Content | — | Yes |
| 17 | Event Calendar | EVENT_CALENDAR | Dynamic Content | — | Yes |
| 18 | Recurring Meetings | RECURRING_MEETINGS | Dynamic Content | List | Yes |
| 18 | Recurring Meetings | QUICK_LINKS | Dynamic Content | Carousel | Yes |
| 19 | Team | MEET_TEAM | People & Places | — | No |
| 20 | Location | LOCATION_DETAIL | People & Places | Detail | No |
| 20 | Location | MINISTRY_SCHEDULE | People & Places | Schedule | No |
| 20 | Location | CAMPUS_CARD_GRID | People & Places | Card grid | No |
| 20 | Location | RECURRING_SCHEDULE | People & Places | Weekly schedule | No |
| 21 | Ministry Intro | MINISTRY_INTRO | People & Places | Single | No |
| 21 | Ministry Intro | DIRECTORY_LIST | People & Places | Directory | No |
| 22 | FAQ | FAQ_SECTION | Utility | — | No |
| 23 | Timeline | TIMELINE_SECTION | Utility | — | No |
| 24 | Contact Form | FORM_SECTION | Utility | — | No |
| 25 | Custom Embed | CUSTOM_HTML | Embed | HTML mode | No |
| 25 | Custom Embed | CUSTOM_EMBED | Embed | URL mode | No |
| — | *(site settings)* | FOOTER | — | — | No |
| — | *(layout)* | NAVBAR | — | — | — |
| — | *(hidden)* | DAILY_BREAD_FEATURE | — | — | Yes |
