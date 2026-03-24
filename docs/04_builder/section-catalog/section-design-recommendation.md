# Section System Redesign — Product Recommendation

> **Author perspective:** Chief Product Designer, Shopify Online Store
> **Date:** March 17, 2026
> **Updated:** March 20, 2026 — Added Editor Paradigm section, verified all Content/Layout panel descriptions against actual code
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

3. **Categories map to user goals, not component architecture.** Users think: "I want to show upcoming events" (goal) -> finds it in "Dynamic content" (category). They don't think: "I need a DATA_TYPES section routed through data-section-editor.tsx."

4. **Data-driven sections are not a category — they're a trait.** Shopify doesn't separate "manual product grid" from "auto-populated product grid" into different categories. Both live in "Product" sections. The data source is a *setting* on the section, not a reason to create a separate type.

5. **The section picker is the onboarding.** If a new admin opens the section picker and feels overwhelmed, you've already lost. 41 items with developer names is overwhelming. 24 items with plain English names is manageable.

6. **Editors should feel like filling out a card, not configuring software.** Group fields into Content and Style. Lead with what the user types (heading, body, button text). Bury what they set once (image position, aspect ratio).

---

## Editor Paradigm (NEW — March 2026)

The right drawer uses an **accordion-based panel system** with four fixed panels. Each section editor is split across these panels, separating *what you say* from *how it looks* from *how it behaves*.

### The Four Panels

| Panel | Purpose | Who provides it | Opens by default |
|---|---|---|---|
| **Content** | Text, media, buttons, items — *what the section says* | Per-section editor component (e.g. `HeroBannerEditor`) | Yes |
| **Layout** | Arrangement, alignment, overlay — *how the section is arranged* | Per-section layout editor (e.g. `HeroBannerLayoutEditor`), optional | No |
| **Style** | Color scheme, padding, container width — *how the section looks* | Drawer-level (universal for all sections) | No |
| **Advanced** | Animations, visibility, admin label, JSON, delete — *section meta* | Drawer-level (universal for all sections) | No |

### How it works architecturally

```
builder-right-drawer.tsx
  +-- SectionEditorInline (accordion controller)
       |-- Content panel  --> SectionContentEditor --> SECTION_EDITORS[type]
       |-- Layout panel   --> SectionLayoutEditor  --> LAYOUT_EDITORS[type] (if exists)
       |-- Style panel    --> ColorSchemePicker + paddingY + containerWidth (universal)
       +-- Advanced panel --> animations + visibility + label + JSON + delete (universal)
```

**Two registries** in `section-editors/index.tsx`:
- `SECTION_EDITORS` — maps each `SectionType` to its **Content** editor (required for non-data sections)
- `LAYOUT_EDITORS` — maps section types that have layout-specific fields to a **Layout** editor (optional; panel hidden if no entry)

Currently only **3 section types** have layout editors registered:
- `HERO_BANNER` -> `HeroBannerLayoutEditor`
- `TEXT_IMAGE_HERO` -> `TextImageHeroLayoutEditor`
- `MINISTRY_HERO` -> `MinistryHeroLayoutEditor`

Data-driven sections route through `DataSectionEditor` (which wraps `DataDrivenBanner` + type-specific sub-editor + footer note) instead of the `SECTION_EDITORS` registry.

### Shared Component Library

All editors import from `section-editors/shared/`:

| Module | Components |
|---|---|
| `field-primitives` | `EditorField`, `EditorInput`, `EditorTextarea`, `EditorButtonGroup`, `EditorSelect`, `EditorToggle`, `TwoColumnGrid` |
| `media-fields` | `ImagePickerField`, `ImageListField`, `VideoPickerField`, `ButtonConfig` |
| `array-fields` | `ArrayField` (generic reorderable list), `AddressField` (string array) |
| `card-fields` | `CardItemEditor`, `AddCardButton`, `GenericCard` type, `SocialLinksField` |
| `banners` | `DataDrivenBanner`, `DATA_SOURCE_LABELS` |
| `editor-section` | `EditorSection` — collapsible sub-group within a panel |

### Design Rules for Section Editors

1. **Content editors are flat by default.** Fields flow top-to-bottom with `<Separator />` between logical groups. No nested accordions in Content unless the section has 8+ fields.
2. **Use `EditorSection` for sub-groups** only when a Content panel has distinct collapsible sections (e.g., "Buttons" group, "Media" group within a complex editor).
3. **Layout editors own all spatial/arrangement controls.** If a field controls *where* things go (not *what* they say), it belongs in Layout.
4. **Style and Advanced are universal.** Individual editors never render color scheme, padding, container width, animations, visibility, or delete. The drawer handles these.
5. **Separators (`<Separator />`) divide logical groups** within a panel. Use them between: text fields and media fields, media fields and button fields, etc.
6. **Label sizes:** Use `labelSize="sm"` for top-level field labels in Content. Sub-fields (e.g., "Line 1" under "Heading") use the default `"xs"`.

---

## Current State -> Proposed State

### Category Restructure

| Current (8 categories, 41 types) | Proposed (6 categories, 25 types) |
|---|---|
| Heroes (5) | **Hero** (3) |
| Content (8) | **Content** (6) |
| Cards & Grids (6) | **Cards** (4) |
| Lists & Data (8) | **Dynamic Content** (5) |
| Ministry (6) | **People & Places** (3) |
| Interactive (3) | **Interactive** (2) |
| Layout (3) | -> merged into Content + Dynamic Content |
| Custom (2) | **Embed** (2) |

---

## Section Consolidations — Actual Editor State

> Each section below documents the **actual fields in the current code** (verified March 20, 2026), then notes what the consolidation would change.

### A. Heroes: 5 -> 3

#### 1. **Hero** (merges HERO_BANNER, TEXT_IMAGE_HERO)

##### HERO_BANNER — Current Content Panel
- Overline (`EditorInput`)
- Heading — Line 1 + Line 2 (accent) sub-fields (`EditorField` > 2x `EditorInput`)
- Subheading (`EditorTextarea`, 4 rows)
- `<Separator />`
- Media Type toggle: Image / Video (`EditorButtonGroup`)
- **Image fields** (conditional on mediaType + layout):
  - `contained` layout: single `ImagePickerField` (Featured Image)
  - `fullwidth` / `split` layout: `ImageListField` (Background/Split Images, max 10)
- **Video fields** (conditional on mediaType = video):
  - Desktop Video (`VideoPickerField`, 1920x1080+)
  - Mobile Video optional (`VideoPickerField`, 720x1280 portrait)
  - Poster / Fallback Image (`ImagePickerField`)
- `<Separator />`
- Buttons — Primary + Secondary via `ButtonConfig`

##### HERO_BANNER — Current Layout Panel (`HeroBannerLayoutEditor`)
- Layout toggle: Full Width / Split / Contained (`EditorButtonGroup`)
- Arrangement picker (Split/Contained only) — 2x2 visual thumbnail grid (`LayoutArrangementPicker`: text-left, image-left, text-top, image-top)
- Horizontal Position (Full-width only) — Left / Center / Right (`EditorButtonGroup`)
- Vertical Position (Full-width only) — Top / Middle / Bottom (`EditorButtonGroup`)
- Text Alignment (Split/Contained only) — Left / Center / Right (`EditorButtonGroup`)
- `<Separator />` (Full-width only)
- Overlay type (Full-width only) — Gradient / Solid / None (`EditorButtonGroup`)
- Overlay Opacity (`Slider`, 0-100%, step 5, shown when overlay != none)

##### TEXT_IMAGE_HERO — Current Content Panel
- Overline (`EditorInput`)
- Heading — Line 1 + Accent Line (optional) sub-fields (`EditorField` > 2x `EditorInput`)
- Description (`EditorTextarea`, 5 rows)
- `<Separator />`
- Image (`ImagePickerField`) + Alt Text (`EditorInput`)

##### TEXT_IMAGE_HERO — Current Layout Panel (`TextImageHeroLayoutEditor`)
- Text Alignment: Left / Center / Right (`EditorButtonGroup`)

**Consolidation note:** These two would merge under a single "Hero" type. The layout toggle (Full Width / Split / Contained) already exists in HERO_BANNER's layout editor. TEXT_IMAGE_HERO maps to the "Split" variant. Its overline/heading/description/image fields would become the content shown when layout = split.

---

#### 2. **Page Header** (merges PAGE_HERO, EVENTS_HERO)

##### PAGE_HERO — Current Content Panel
- Overline (`EditorInput`)
- Heading (`EditorInput`)
- `<Separator />`
- Buttons — Primary + Secondary via `ButtonConfig`
- Note: "Floating images are configured in the JSON content."

##### PAGE_HERO — No Layout Panel

##### EVENTS_HERO — Current Content Panel
- Heading (`EditorInput`)
- Subtitle (`EditorTextarea`, 4 rows)

##### EVENTS_HERO — No Layout Panel

**Consolidation note:** These would merge under "Page Header". PAGE_HERO is the "Centered" variant (overline + heading + buttons). EVENTS_HERO is the "Simple" variant (heading + subtitle only, no overline, no buttons). A layout toggle would switch between them.

---

#### 3. **Ministry Header** (keeps MINISTRY_HERO)

##### MINISTRY_HERO — Current Content Panel
- Overline (`EditorInput`)
- Heading (`EditorTextarea`, 4 rows — supports newlines)
- `<Separator />`
- CTA Button via `ButtonConfig`
- `<Separator />`
- Image (`ImagePickerField`) + Alt Text (`EditorInput`)
- Note: "Social links are configured in the JSON content."

##### MINISTRY_HERO — Current Layout Panel (`MinistryHeroLayoutEditor`)
- Heading Style: Display / Sans (`EditorButtonGroup`)

---

### B. Content: 8 -> 6

#### 4. **Image & Text** (keeps MEDIA_TEXT)

##### MEDIA_TEXT — Current Content Panel
- Overline (`EditorInput`)
- Heading (`EditorInput`)
- Body (`EditorTextarea`, 6 rows)
- `<Separator />`
- CTA Button via `ButtonConfig`
- Note: "Rotating images are configured in the JSON content."

##### MEDIA_TEXT — No Layout Panel

**Gap:** No image array editor yet (still JSON-only). No layout editor for image position or text alignment.

---

#### 5. **Quote** (keeps QUOTE_BANNER)

##### QUOTE_BANNER — Current Content Panel
- Overline (`EditorInput`)
- Heading (`EditorInput`)
- `<Separator />`
- Quote / Verse group (`EditorField`):
  - Text (`EditorTextarea`, 6 rows)
  - Reference (`EditorInput`, e.g. "John 15:5")

##### QUOTE_BANNER — No Layout Panel

---

#### 6. **Call to Action** (keeps CTA_BANNER)

##### CTA_BANNER — Current Content Panel
- Overline (`EditorInput`)
- Heading (`EditorInput`)
- Body (`EditorTextarea`, 5 rows)
- `<Separator />`
- Background Image optional (`ImagePickerField`)
- `<Separator />`
- Buttons group (`EditorField`):
  - Primary Button via `ButtonConfig`
  - Secondary Button via `ButtonConfig`

##### CTA_BANNER — No Layout Panel

---

#### 7. **About** (keeps ABOUT_DESCRIPTION)

##### ABOUT_DESCRIPTION — Current Content Panel
- Logo Image (`ImagePickerField`)
- Heading (`EditorInput`)
- Description (`EditorTextarea`, 8 rows)
- `<Separator />`
- Video group (`EditorField`):
  - Embed URL (`EditorInput`)
  - Video Title (`EditorInput`)

##### ABOUT_DESCRIPTION — No Layout Panel

---

#### 8. **Statement** (keeps STATEMENT)

##### STATEMENT — Current Content Panel
- Overline (`EditorInput`)
- Heading (`EditorInput`)
- Lead-In Text (`EditorInput` — sticky left column)
- Show Cross Icon (`EditorToggle`)
- `<Separator />`
- Paragraphs — array with add/remove (inline `Textarea` per paragraph, delete button)

##### STATEMENT — No Layout Panel

**Gap:** Background mask image is still hardcoded (no editor field for it).

---

#### 9. **Photo Gallery** (keeps PHOTO_GALLERY)

##### PHOTO_GALLERY — Current Content Panel
- Heading (`EditorInput`)
- `<Separator />`
- Images via `ArrayField` (reorderable):
  - Per image: `ImagePickerField` + Alt Text + Object Position (`TwoColumnGrid`)

##### PHOTO_GALLERY — No Layout Panel

---

### C. Cards: 6 -> 4

#### 10. **Card Grid** (merges ACTION_CARD_GRID + PATHWAY_CARD)

##### ACTION_CARD_GRID — Current Content Panel
- Heading — 3 lines: Line 1, Line 2 (italic), Line 3 (`EditorField` > 3x `EditorInput`)
- Subheading (`EditorInput`)
- CTA Button (label + href, `TwoColumnGrid`, only shown if ctaButton exists in content)
- `<Separator />`
- Cards via `CardItemEditor` (showImage, showLink):
  - Per card: title, description, image, link
  - Add via `AddCardButton`

##### ACTION_CARD_GRID — No Layout Panel

##### PATHWAY_CARD — Current Content Panel
- Heading (`EditorInput`)
- Description (`EditorTextarea`, 4 rows)
- `<Separator />`
- Pathway Cards — manual card array:
  - Per card: Icon Key + Title (`TwoColumnGrid`), Description (`EditorTextarea`), Button Label + Button Link (`TwoColumnGrid`)
  - Add via `AddCardButton`

##### PATHWAY_CARD — No Layout Panel

**Consolidation note:** These would merge under "Card Grid" with a style toggle (Image Cards / Icon Cards). The card sub-form swaps based on style. Neither currently has a layout editor — one would be added for the style toggle + column count.

---

#### 11. **Feature List** (keeps FEATURE_BREAKDOWN)

##### FEATURE_BREAKDOWN — Current Content Panel
- Heading (`EditorInput`)
- Description (`EditorTextarea`, 5 rows)
- `<Separator />`
- Acronym Lines via `AddressField` (string array — first letter of each line is highlighted)
- `<Separator />`
- CTA Button (toggle + label + href in bordered card):
  - Visible toggle (`EditorToggle`)
  - Button Text + Button Link (`TwoColumnGrid`, shown when visible)

##### FEATURE_BREAKDOWN — No Layout Panel

**Gap:** Watermark image is still hardcoded (no editor field).

---

#### 12. **Alternating Content** (keeps PILLARS)

##### PILLARS — Current Content Panel
- Overline (`EditorInput`)
- Heading (`EditorInput`)
- `<Separator />`
- Pillar Items — manual array:
  - Per item: Title (`EditorInput`), Description (`EditorTextarea`), Button Label + Button Link (`TwoColumnGrid`, if button exists)
  - Note: "Images for this pillar are configured in the JSON content."
  - Add via `AddCardButton`

##### PILLARS — No Layout Panel

**Gap:** Per-pillar image array is still JSON-only.

---

#### 13. **Welcome Banner** (keeps NEWCOMER)

##### NEWCOMER — Current Content Panel
- Heading (`EditorInput`)
- Description (`EditorTextarea`, 5 rows)
- Button Label + Button Link (`TwoColumnGrid`, direct fields, not `ButtonConfig`)
- `<Separator />`
- Image optional (`ImagePickerField`)

##### NEWCOMER — No Layout Panel

---

### D. Dynamic Content: 8 -> 5

All data-driven sections use `DataSectionEditor` wrapper which renders: `DataDrivenBanner` (shows data source info) + type-specific sub-editor + footer note ("data is managed through CMS content modules").

#### 14. **Content Listing** (merges ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS)

##### ALL_MESSAGES / ALL_EVENTS / ALL_BIBLE_STUDIES / ALL_VIDEOS — Current Content Panel (via `SimpleDataEditor`)
- `DataDrivenBanner`
- Section Heading (`EditorInput`)
- CTA Label + CTA Link (`TwoColumnGrid`, optional)
- Footer note

##### No Layout Panel

**Consolidation note:** These four would merge into one "Content Listing" type with a data source dropdown. Currently they're four separate entries in `DATA_SECTION_TYPES` that all route to `SimpleDataEditor` with different CTA placeholder URLs.

---

#### 15. **Featured Content** (merges SPOTLIGHT_MEDIA, HIGHLIGHT_CARDS, MEDIA_GRID)

##### SPOTLIGHT_MEDIA — Current Content Panel (via `SECTION_EDITORS`, NOT `DataSectionEditor`)
- Section Heading (`EditorInput`)
- `<Separator />`
- Featured Sermon group (`EditorField`):
  - Title, Speaker + Date (`TwoColumnGrid`), Series + Slug (`TwoColumnGrid`)
  - Thumbnail (`ImagePickerField`)
  - Video URL (`EditorInput`)

**Note:** SPOTLIGHT_MEDIA is currently in the `SECTION_EDITORS` registry (content-editor.tsx), NOT in `DATA_SECTION_TYPES`. It has manual sermon fields, not auto-populated data.

##### HIGHLIGHT_CARDS — Current Content Panel (via `DataSectionEditor`)
- `DataDrivenBanner`
- Section Heading (`EditorInput`)
- Subheading (`EditorInput`)
- `<Separator />`
- CTA Label + CTA Link (`TwoColumnGrid`)
- `<Separator />`
- Number of Events (`EditorInput`, number, 1-6)
- Sort Order (`EditorSelect`: "Upcoming first" / "Most recent first")
- `<Separator />`
- Auto-Hide Past Featured (`EditorToggle`, bordered)
- Include Recurring Meetings (`EditorToggle`, bordered)
- Show Past Events (`EditorToggle`, bordered)
- Past Events Window (`EditorSelect`: 7/14/30/60/90 days or all, shown when showPastEvents = true)
- Footer note

##### MEDIA_GRID — Current Content Panel (via `SimpleDataEditor`)
- `DataDrivenBanner`
- Section Heading (`EditorInput`)
- CTA Label + CTA Link (`TwoColumnGrid`, optional)
- Footer note

##### No Layout Panel for any of these

**Consolidation note:** These three have very different editor complexity. HIGHLIGHT_CARDS is the most detailed (filtering, sorting, past events). A style toggle would need to show/hide significant field sets.

---

#### 16. **Upcoming Events** (keeps UPCOMING_EVENTS)

##### UPCOMING_EVENTS — Current Content Panel (via `DataSectionEditor`)
- `DataDrivenBanner`
- Overline (`EditorInput`)
- Section Heading (`EditorInput`)
- `<Separator />`
- CTA Button: Button Label + Button Link (`TwoColumnGrid`)
- Footer note

##### No Layout Panel

---

#### 17. **Event Calendar** (keeps EVENT_CALENDAR)

##### EVENT_CALENDAR — Current Content Panel (via `DataSectionEditor`)
- `DataDrivenBanner`
- Section Heading (`EditorInput`)
- Note: "CTA buttons for the calendar header are configured in the JSON content."
- Footer note

##### No Layout Panel

**Gap:** CTA buttons array is still JSON-only.

---

#### 18. **Recurring Meetings** (merges RECURRING_MEETINGS + QUICK_LINKS)

##### RECURRING_MEETINGS — Current Content Panel (via `DataSectionEditor`)
- `DataDrivenBanner`
- Section Heading (`EditorInput`)
- Max Visible Items (`EditorInput`, number 1-20) + View All Link (`EditorInput`) in `TwoColumnGrid`
- Footer note

##### QUICK_LINKS — Current Content Panel (via `DataSectionEditor`)
- `DataDrivenBanner`
- Section Heading (`EditorInput`)
- Subtitle (`EditorInput`)
- Footer note

##### No Layout Panel for either

**Consolidation note:** These would merge with a layout toggle (List / Carousel). Field sets differ: RECURRING_MEETINGS has maxVisible + viewAllHref; QUICK_LINKS has subtitle instead.

---

### E. People & Places: 6 -> 3

#### 19. **Team** (keeps MEET_TEAM)

##### MEET_TEAM — Current Content Panel
- Overline (`EditorInput`)
- Heading (`EditorInput`)
- `<Separator />`
- Team Members via `ArrayField` (reorderable):
  - Per member: Name + Role (`TwoColumnGrid`), Bio (`EditorTextarea`), Photo URL (`EditorInput` — plain text, NOT `ImagePickerField`)

##### No Layout Panel

**Gap:** Photo is a plain text URL input, not `ImagePickerField`. Should be swapped.

---

#### 20. **Location** (merges LOCATION_DETAIL + MINISTRY_SCHEDULE + CAMPUS_CARD_GRID)

##### LOCATION_DETAIL — Current Content Panel
- Overline (`EditorInput`)
- `<Separator />`
- Service Time: Label + Value (`TwoColumnGrid`)
- `<Separator />`
- Address: Address Label (`EditorInput`), Address Lines (`AddressField` — string array)
- `<Separator />`
- Directions Link: Label + URL (`TwoColumnGrid`)
- Note: "Location images are configured in the JSON content."

##### LOCATION_DETAIL — No Layout Panel

**Gap:** Location images are still JSON-only.

##### MINISTRY_SCHEDULE — Current Content Panel
- Heading (`EditorInput`)
- Description (`EditorTextarea`, 4 rows)
- `<Separator />`
- Schedule Entries — manual array with add/remove:
  - Per entry: Day + Time + Location (3-column grid)
  - `GripVertical` icon (visual only, no drag implemented)
- `<Separator />`
- Buttons — manual array with add/remove:
  - Per button: Label + Link + Variant toggle (primary/secondary)

##### MINISTRY_SCHEDULE — No Layout Panel

##### CAMPUS_CARD_GRID — Current Content Panel
- Overline (`EditorInput`)
- Heading (`EditorInput`)
- Description (`EditorTextarea`, 4 rows)
- `<Separator />`
- Campuses — manual array with add/remove:
  - Per campus: Name + Link (`TwoColumnGrid`), Image optional (`ImagePickerField`)
  - `GripVertical` icon (visual only)
- Note: "Decorative images are configured in the JSON content."

##### CAMPUS_CARD_GRID — No Layout Panel

**Consolidation note:** These three would merge under "Location" with a layout toggle (Detail / Schedule / Card Grid). All three answer "where and when can people find us?" but have very different field sets.

---

#### 21. **Ministry Intro** (merges MINISTRY_INTRO + DIRECTORY_LIST)

##### MINISTRY_INTRO — Current Content Panel
- Overline (`EditorInput`)
- Heading (`EditorInput`)
- Description (`EditorTextarea`, 6 rows)
- `<Separator />`
- Side Image: `ImagePickerField` + Alt Text + Object Position (`TwoColumnGrid`, shown when image exists)

##### MINISTRY_INTRO — No Layout Panel

##### DIRECTORY_LIST — Current Content Panel
- Heading (`EditorInput`)
- `<Separator />`
- Directory Items — manual array with add/remove:
  - Per item: Label + Link (`TwoColumnGrid`), Description optional (`EditorInput`)
  - `GripVertical` icon (visual only)
- `<Separator />`
- Background Image: `ImagePickerField` + Alt Text (`EditorInput`)
- `<Separator />`
- Bottom CTA: CTA Heading (`EditorInput`), Button Label + Button Link (`TwoColumnGrid`)

##### DIRECTORY_LIST — No Layout Panel

---

### F. Interactive & Utility

#### 22. **FAQ** (keeps FAQ_SECTION)

##### FAQ_SECTION — Current Content Panel
- Section Heading (`EditorInput`)
- Show Question Mark Icon (`EditorToggle`)
- `<Separator />`
- Questions via `ArrayField` (reorderable):
  - Per item: Question (`EditorInput`), Answer (`EditorTextarea`)

##### No Layout Panel

---

#### 23. **Timeline** (keeps TIMELINE_SECTION)

##### TIMELINE_SECTION — Current Content Panel
- Overline (`EditorInput`)
- Heading (`EditorInput`)
- Description (`EditorTextarea`)
- `<Separator />`
- Timeline Items via `ArrayField` (reorderable):
  - Per item: Time + Title (grid: 120px + 1fr), Description (`EditorTextarea`)

##### No Layout Panel

---

#### 24. **Contact Form** (keeps FORM_SECTION)

##### FORM_SECTION — Current Content Panel
- Overline (`EditorInput`)
- Heading (`EditorInput`)
- Description (`EditorTextarea`)
- `<Separator />`
- Interest Options via `ArrayField`: per option Label + Value (`TwoColumnGrid`)
- `<Separator />`
- Campus Options via `ArrayField`: per option Label + Value (`TwoColumnGrid`)
- `<Separator />`
- Bible Teacher Checkbox Label (`EditorInput`, optional — leave empty to hide)
- `<Separator />`
- Submit Button Label + Success Message (`TwoColumnGrid`)

##### No Layout Panel

---

### G. Embed

#### 25. **Custom Embed** (merges CUSTOM_HTML + CUSTOM_EMBED)

##### CUSTOM_HTML — Current Content Panel
- Warning banner (amber, "Custom HTML — be careful with custom HTML")
- HTML Content (`EditorTextarea`, monospace, 300px min-height, spellCheck off)

##### CUSTOM_EMBED — Current Content Panel
- Embed URL (`EditorInput`, with description)
- Title (`EditorInput`, accessibility title for iframe)
- `<Separator />`
- Aspect Ratio presets: 16/9, 4/3, 1/1, 9/16 (`EditorButtonGroup`)
- Custom Ratio (`EditorInput`, freeform override)

##### No Layout Panel for either

**Consolidation note:** These would merge with a mode toggle (HTML / URL). Currently separate section types and separate editor functions.

---

### Other Sections (not in picker consolidation)

#### FOOTER — Current Content Panel (`FooterEditor`)
- Description (`EditorTextarea`)
- `<Separator />`
- Social Links via `SocialLinksField`
- `<Separator />`
- Link Columns via `ArrayField`: per column heading + nested links (label + URL, manual add/remove)
- `<Separator />`
- Contact Information: Address via `AddressField`, Phone + Email (`TwoColumnGrid`)

#### RECURRING_SCHEDULE — Current Content Panel (`ScheduleEditor`)
- Heading (`EditorInput`)
- Subtitle (`EditorTextarea`)
- `<Separator />`
- Meetings via `ArrayField`: per meeting Title, Description (`EditorTextarea`), Time + Location (`TwoColumnGrid`), Days (multi-select toggle buttons: Sun-Sat)

#### DAILY_BREAD_FEATURE — Current Content Panel (via `DataSectionEditor`)
- `DataDrivenBanner`
- Section Heading (`EditorInput`)
- Footer note

---

## Proposed Section Picker

What the admin sees when they click "Add Section":

```
Hero (3)
  |-- Hero                    -> full-width, split, or contained (homepage/landing)
  |-- Page Header             -> centered or simple (inner pages)
  +-- Ministry Header         -> ministry pages only

Content (6)
  |-- Image & Text            -> rotating image carousel + text
  |-- Quote                   -> dark banner with verse/quote
  |-- Call to Action          -> CTA banner with buttons
  |-- About                   -> logo, heading, description, video
  |-- Statement               -> scroll-tracked paragraphs
  +-- Photo Gallery           -> infinite horizontal carousel

Cards (4)
  |-- Card Grid               -> image cards or icon cards
  |-- Feature List            -> acronym-style breakdown
  |-- Alternating Content     -> zigzag image + text blocks
  +-- Welcome Banner          -> centered welcome with CTA

Dynamic Content (5)
  |-- Content Listing         -> messages, events, studies, videos
  |-- Featured Content        -> spotlight, highlights, video grid
  |-- Upcoming Events         -> event cards with CTA
  |-- Event Calendar          -> interactive calendar view
  +-- Recurring Meetings      -> list or carousel of meetings

People & Places (3)
  |-- Team                    -> member cards with photo, role, bio
  |-- Location                -> address, schedule, campus cards
  +-- Ministry Intro          -> single intro or directory list

Utility (3)
  |-- FAQ                     -> accordion Q&A
  |-- Timeline                -> vertical timeline steps
  +-- Contact Form            -> form with interests, campus, etc.

Embed (1)
  +-- Custom Embed            -> HTML or iframe URL
```

**Total: 25 types.** Down from 41. Every current rendering is preserved as a variant.

---

## Implementation Strategy

### What changes and what doesn't

| Layer | Changes? | Details |
|---|---|---|
| **Database** | No | `SectionType` enum keeps all 41 values. No migration needed. |
| **Section components** | No | All 41 components stay as-is. They render the same way. |
| **Section registry** | No | Same mapping from type -> component. |
| **Section catalog** | Yes | Catalog entries consolidate. New parent types with variant settings. |
| **Section editors** | Yes | Editors gain a layout/variant toggle that shows/hides fields. Consolidated editors export Content + Layout functions. |
| **Section picker UI** | Yes | Shows 24 items instead of 41. Picking a type + variant writes the correct `SectionType` to the DB. |
| **resolve-section-data** | No | Data sources unchanged. |
| **Right drawer** | Already done | Accordion panel system (Content/Layout/Style/Advanced) is implemented. |
| **Shared components** | Already done | `section-editors/shared/` library with field primitives, media fields, card fields, array fields, banners. |

### The key architectural insight

**The `SectionType` enum doesn't change.** The database still stores `HERO_BANNER`, `PAGE_HERO`, etc. The consolidation is purely in the builder UX — the picker and editor present variants, but write the original enum value to the DB.

This means:
- Zero migration risk
- Existing pages render identically
- The public website rendering pipeline is untouched
- Rollback is trivial (just revert the picker/editor changes)

### Adding a new section editor (current pattern)

1. Create the Content editor component (e.g. `MyNewEditor`) — receives `content` + `onChange`
2. Optionally create a Layout editor component (e.g. `MyNewLayoutEditor`) — same signature
3. Register in `section-editors/index.tsx`:
   - Add to `SECTION_EDITORS` map (required)
   - Add to `LAYOUT_EDITORS` map (only if layout editor exists)
4. Done. The drawer auto-discovers the panels.

### Migration path

**Phase 1 — Rename + Recategorize (1-2 days)**
- Update `section-catalog.ts` labels and category groupings
- No editor changes, no consolidation
- Immediate UX improvement: clearer names, fewer categories

**Phase 2 — Close the Gaps (3-5 days)**
- Implement the 13 editor gaps from the gap analysis
- Fix hardcoded URLs (statement mask, feature breakdown watermark)
- This is independent of consolidation — do it regardless

**Phase 3 — Consolidate Pickers (3-5 days)**
- Merge the simple cases first: ALL_* -> Content Listing, CUSTOM_HTML + CUSTOM_EMBED -> Custom Embed
- Add variant toggles to Hero (3 layouts)
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

6. **Don't put Style/Advanced fields in per-section editors.** Color scheme, padding, container width, animations, visibility, and delete are handled universally by the drawer. Individual editors only own Content and Layout.

---

## Decisions for David

Before implementation, these need your call:

1. **RECURRING_SCHEDULE** — Fold into Location, or keep standalone? It's visually distinct enough that merging might feel forced.

2. **FOOTER** — Keep in the section picker (so pages can have custom footers), or fully remove from the picker and handle via site settings only?

3. **Content Listing consolidation** — Are you comfortable with a data source dropdown that dynamically changes the rendered component? This is the biggest architectural change (one picker entry -> four different components via data source).

4. **Phase 1 timing** — The rename + recategorize is zero-risk. Can we ship it this week independent of everything else?

5. **Ministry Header** — Should this only appear in the picker when editing a ministry-type page? Shopify does this with "template-specific sections." Would reduce picker noise for non-ministry pages.

---

## Appendix: Full Mapping Table

| # | Proposed Name | Current Type(s) | Category | Variant | Data-Driven | Has Layout Editor (today) |
|---|---|---|---|---|---|---|
| 1 | Hero | HERO_BANNER | Hero | Full-width / Contained | No | **Yes** |
| 1 | Hero | TEXT_IMAGE_HERO | Hero | Split | No | **Yes** |
| 2 | Page Header | PAGE_HERO | Hero | Centered | No | No |
| 2 | Page Header | EVENTS_HERO | Hero | Simple | No | No |
| 3 | Ministry Header | MINISTRY_HERO | Hero | -- | No | **Yes** |
| 4 | Image & Text | MEDIA_TEXT | Content | -- | No | No |
| 5 | Quote | QUOTE_BANNER | Content | -- | No | No |
| 6 | Call to Action | CTA_BANNER | Content | -- | No | No |
| 7 | About | ABOUT_DESCRIPTION | Content | -- | No | No |
| 8 | Statement | STATEMENT | Content | -- | No | No |
| 9 | Photo Gallery | PHOTO_GALLERY | Content | -- | No | No |
| 10 | Card Grid | ACTION_CARD_GRID | Cards | Image cards | No | No |
| 10 | Card Grid | PATHWAY_CARD | Cards | Icon cards | No | No |
| 11 | Feature List | FEATURE_BREAKDOWN | Cards | -- | No | No |
| 12 | Alternating Content | PILLARS | Cards | -- | No | No |
| 13 | Welcome Banner | NEWCOMER | Cards | -- | No | No |
| 14 | Content Listing | ALL_MESSAGES | Dynamic Content | Messages | Yes | No |
| 14 | Content Listing | ALL_EVENTS | Dynamic Content | Events | Yes | No |
| 14 | Content Listing | ALL_BIBLE_STUDIES | Dynamic Content | Bible Studies | Yes | No |
| 14 | Content Listing | ALL_VIDEOS | Dynamic Content | Videos | Yes | No |
| 15 | Featured Content | SPOTLIGHT_MEDIA | Dynamic Content | Spotlight | **No*** | No |
| 15 | Featured Content | HIGHLIGHT_CARDS | Dynamic Content | Highlight cards | Yes | No |
| 15 | Featured Content | MEDIA_GRID | Dynamic Content | Video grid | Yes | No |
| 16 | Upcoming Events | UPCOMING_EVENTS | Dynamic Content | -- | Yes | No |
| 17 | Event Calendar | EVENT_CALENDAR | Dynamic Content | -- | Yes | No |
| 18 | Recurring Meetings | RECURRING_MEETINGS | Dynamic Content | List | Yes | No |
| 18 | Recurring Meetings | QUICK_LINKS | Dynamic Content | Carousel | Yes | No |
| 19 | Team | MEET_TEAM | People & Places | -- | No | No |
| 20 | Location | LOCATION_DETAIL | People & Places | Detail | No | No |
| 20 | Location | MINISTRY_SCHEDULE | People & Places | Schedule | No | No |
| 20 | Location | CAMPUS_CARD_GRID | People & Places | Card grid | No | No |
| 20 | Location | RECURRING_SCHEDULE | People & Places | Weekly schedule | No | No |
| 21 | Ministry Intro | MINISTRY_INTRO | People & Places | Single | No | No |
| 21 | Ministry Intro | DIRECTORY_LIST | People & Places | Directory | No | No |
| 22 | FAQ | FAQ_SECTION | Utility | -- | No | No |
| 23 | Timeline | TIMELINE_SECTION | Utility | -- | No | No |
| 24 | Contact Form | FORM_SECTION | Utility | -- | No | No |
| 25 | Custom Embed | CUSTOM_HTML | Embed | HTML mode | No | No |
| 25 | Custom Embed | CUSTOM_EMBED | Embed | URL mode | No | No |
| -- | *(site settings)* | FOOTER | -- | -- | No | No |
| -- | *(layout)* | NAVBAR | -- | -- | -- | -- |
| -- | *(hidden)* | DAILY_BREAD_FEATURE | -- | -- | Yes | No |

\* SPOTLIGHT_MEDIA is currently registered in `SECTION_EDITORS` (not `DATA_SECTION_TYPES`) and has manual sermon fields. It would need to be refactored to be truly data-driven.

---

## CMS-Driven Section Editor Specification

> **Added:** March 20, 2026
> **Context:** The builder currently treats CMS-driven sections as second-class citizens. The `SimpleDataEditor` only exposes heading + CTA fields. There is no way to control layout properties like column count, card style, image ratio, or gap — the exact properties that Shopify exposes on every dynamic section. This spec defines how CMS-driven sections should work in the builder, starting with the Messages page as the first implementation.

### The Shopify Pattern (What We're Adopting)

Shopify's Dawn theme demonstrates the gold standard for CMS-driven section editing. Their "Featured collection" section is the closest analogue to our Messages listing. Key patterns:

**1. Clear data source indicator**
- The section editor shows which collection/blog is connected at the top
- The collection picker is the *first* setting — "which data do you want to show?"
- Everything below it controls *how* that data is displayed

**2. Layout/display controls are the main editor surface**
Even though content comes from the CMS, the merchant controls:

| Setting | Type | Purpose |
|---|---|---|
| Products to show | Range (2-25) | How many items to display |
| Columns (desktop) | Range (1-6) | Grid column count on desktop |
| Columns (mobile) | Select (1-2) | Grid column count on mobile |
| Image ratio | Select (adapt/portrait/square) | Card image aspect ratio |
| Image shape | Select (8 options) | Card image mask shape |
| Show secondary image | Toggle | Hover image on cards |
| Show vendor/rating | Toggles | Card metadata visibility |
| Quick add | Select (none/standard/bulk) | Add-to-cart behavior |
| Color scheme | Color scheme picker | Section color palette |
| Heading size | Select (5 sizes) | Section heading scale |
| View all style | Select (link/outline/solid) | CTA button style |
| Padding top/bottom | Range (0-100px) | Section spacing |

**3. "Manage in [source]" link**
- The editor includes a link that opens the CMS content area (e.g., "Manage products" opens the Products admin)
- This makes it obvious that content changes happen elsewhere

**4. No content fields for the dynamic items**
- You cannot edit individual product titles, images, or prices from the section editor
- The section editor is purely about *presentation* — layout, filtering, and style

### What This Means for Our Builder

Currently our CMS-driven sections (ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS, etc.) use `SimpleDataEditor` which only exposes:
- Section heading (text)
- CTA label + link (text)

This is drastically insufficient. Each CMS-driven section needs a **rich layout editor** that controls how CMS content is presented. The content itself stays in the CMS.

---

### CMS-Driven Section: Messages Listing (ALL_MESSAGES)

**Data source:** `all-messages` via `getMessages()` from `lib/dal/messages.ts`
**Content comes from:** CMS Messages module (sermons with title, speaker, series, passage, thumbnail, video)
**What the section renders:** Searchable, filterable grid of message cards with tabs (All Messages / Series)

#### Proposed Editor Fields

**Content Panel (top — minimal)**

| Field | Type | Default | Notes |
|---|---|---|---|
| Data source indicator | `DataDrivenBanner` | — | "Content auto-populates from **Messages** in the CMS" |
| Section Heading | `EditorInput` | "Messages" | |
| Section Description | `EditorTextarea` | empty | Optional subheading below title |
| Show Search Bar | `EditorToggle` | true | Toggle the search input |
| Show Tabs | `EditorToggle` | true | Toggle "All Messages" / "Series" tabs |
| Show Filters | `EditorToggle` | true | Toggle speaker/series filter dropdowns |
| "Manage in CMS" link | Link button | — | Opens `/cms/messages` in new tab |

**Layout Panel**

| Field | Type | Default | Notes |
|---|---|---|---|
| Columns (desktop) | `EditorButtonGroup` | 3 | Options: 2 / 3 / 4 |
| Columns (tablet) | `EditorButtonGroup` | 2 | Options: 1 / 2 / 3 |
| Columns (mobile) | `EditorButtonGroup` | 1 | Options: 1 / 2 |
| Card Gap | `EditorSelect` | "default" | Options: tight (12px) / default (24px) / spacious (32px) |
| Image Ratio | `EditorSelect` | "video" | Options: video (16:9) / landscape (3:2) / square (1:1) |
| Items Per Page | `EditorInput` (number) | 12 | Range: 6-24 |
| Card Style | `EditorButtonGroup` | "standard" | Options: standard / compact / minimal |
| Show Speaker | `EditorToggle` | true | Show speaker name on card |
| Show Series | `EditorToggle` | true | Show series badge on card |
| Show Date | `EditorToggle` | true | Show date on card |
| Show Duration | `EditorToggle` | false | Show video duration badge |
| Show Passage | `EditorToggle` | false | Show Bible passage on card |

**Style Panel** (universal — already exists)
- Color scheme, padding, container width, animations

#### Content JSON Shape (new)

```json
{
  "heading": "Messages",
  "description": "",
  "dataSource": "all-messages",
  "showSearch": true,
  "showTabs": true,
  "showFilters": true,
  "columns": { "desktop": 3, "tablet": 2, "mobile": 1 },
  "cardGap": "default",
  "imageRatio": "video",
  "itemsPerPage": 12,
  "cardStyle": "standard",
  "showSpeaker": true,
  "showSeries": true,
  "showDate": true,
  "showDuration": false,
  "showPassage": false,
  "ctaLabel": "",
  "ctaHref": ""
}
```

---

### CMS-Driven Section: All Events (ALL_EVENTS)

**Data source:** `all-events` via `getEvents()` from `lib/dal/events.ts`

#### Proposed Editor Fields — Layout Panel

| Field | Type | Default | Notes |
|---|---|---|---|
| Columns (desktop) | `EditorButtonGroup` | 3 | Options: 2 / 3 / 4 |
| Card Gap | `EditorSelect` | "default" | tight / default / spacious |
| Image Ratio | `EditorSelect` | "landscape" | landscape (3:2) / square (1:1) / portrait (2:3) |
| Items Per Page | `EditorInput` (number) | 12 | Range: 6-24 |
| Card Style | `EditorButtonGroup` | "standard" | standard / compact / minimal |
| Show Event Type Badge | `EditorToggle` | true | |
| Show Location | `EditorToggle` | true | |
| Show Time | `EditorToggle` | true | |
| Default View | `EditorButtonGroup` | "grid" | grid / list |
| Show Past Events | `EditorToggle` | false | |
| Past Events Window | `EditorSelect` | 30 | 7/14/30/60/90 days (shown when showPastEvents) |

---

### CMS-Driven Section: All Bible Studies (ALL_BIBLE_STUDIES)

**Data source:** `all-bible-studies` via `getBibleStudies()` from `lib/dal/bible-studies.ts`

#### Proposed Editor Fields — Layout Panel

| Field | Type | Default | Notes |
|---|---|---|---|
| Columns (desktop) | `EditorButtonGroup` | 3 | Options: 2 / 3 / 4 |
| Card Gap | `EditorSelect` | "default" | tight / default / spacious |
| Image Ratio | `EditorSelect` | "landscape" | landscape / square |
| Items Per Page | `EditorInput` (number) | 12 | Range: 6-24 |
| Show Author | `EditorToggle` | true | |
| Show Passage | `EditorToggle` | true | |
| Show Date | `EditorToggle` | true | |
| Show Category | `EditorToggle` | false | |

---

### CMS-Driven Section: All Videos (ALL_VIDEOS)

**Data source:** `all-videos` via `getVideos()` from `lib/dal/videos.ts`

#### Proposed Editor Fields — Layout Panel

| Field | Type | Default | Notes |
|---|---|---|---|
| Columns (desktop) | `EditorButtonGroup` | 3 | Options: 2 / 3 / 4 |
| Card Gap | `EditorSelect` | "default" | tight / default / spacious |
| Image Ratio | `EditorSelect` | "video" | video (16:9) / landscape (3:2) |
| Items Per Page | `EditorInput` (number) | 12 | Range: 6-24 |
| Show Duration | `EditorToggle` | true | |
| Show Speaker | `EditorToggle` | true | |
| Show Date | `EditorToggle` | true | |

---

### CMS-Driven Section: Featured Content (SPOTLIGHT_MEDIA, HIGHLIGHT_CARDS, MEDIA_GRID)

These sections show a curated/filtered subset of CMS content. They already have more editor fields than the "All" listings. The additions needed:

#### SPOTLIGHT_MEDIA — Add Layout Panel

| Field | Type | Default | Notes |
|---|---|---|---|
| Layout Style | `EditorButtonGroup` | "featured" | featured (large single) / split (side-by-side) |
| Show Series Badge | `EditorToggle` | true | |
| Show Speaker | `EditorToggle` | true | |
| Show Date | `EditorToggle` | true | |
| Auto-Update | `EditorToggle` | true | Always show latest sermon vs manually pinned |

#### HIGHLIGHT_CARDS — Add Layout Fields (already has content fields)

| Field | Type | Default | Notes |
|---|---|---|---|
| Columns (desktop) | `EditorButtonGroup` | 3 | 2 / 3 / 4 |
| Card Gap | `EditorSelect` | "default" | tight / default / spacious |
| Image Ratio | `EditorSelect` | "landscape" | landscape / square / portrait |
| Card Style | `EditorButtonGroup` | "standard" | standard / overlay / minimal |

#### MEDIA_GRID — Add Layout Panel

| Field | Type | Default | Notes |
|---|---|---|---|
| Columns (desktop) | `EditorButtonGroup` | 3 | 2 / 3 / 4 |
| Card Gap | `EditorSelect` | "default" | tight / default / spacious |
| Max Items | `EditorInput` (number) | 6 | Range: 3-12 |
| Show Title | `EditorToggle` | true | |
| Show Duration | `EditorToggle` | true | |

---

### CMS-Driven Section: Upcoming Events (UPCOMING_EVENTS)

#### Add Layout Panel

| Field | Type | Default | Notes |
|---|---|---|---|
| Max Events | `EditorInput` (number) | 3 | Range: 1-8 |
| Layout Style | `EditorButtonGroup` | "cards" | cards / list / timeline |
| Show Event Image | `EditorToggle` | true | |
| Show Location | `EditorToggle` | true | |
| Show Registration Link | `EditorToggle` | true | |

---

### CMS-Driven Section: Event Calendar (EVENT_CALENDAR)

#### Add Layout Panel

| Field | Type | Default | Notes |
|---|---|---|---|
| Default View | `EditorButtonGroup` | "month" | month / week / list |
| Show Category Filters | `EditorToggle` | true | |
| Show Mini Calendar | `EditorToggle` | true | Sidebar mini calendar |
| Highlight Featured | `EditorToggle` | true | Visual emphasis on featured events |

---

### CMS-Driven Section: Recurring Meetings (RECURRING_MEETINGS)

#### Add Layout Panel

| Field | Type | Default | Notes |
|---|---|---|---|
| Layout Style | `EditorButtonGroup` | "list" | list / carousel / cards |
| Columns (desktop) | `EditorButtonGroup` | 3 | 2 / 3 / 4 (shown for cards layout) |
| Show Image | `EditorToggle` | true | |
| Show Day/Time | `EditorToggle` | true | |
| Show Location | `EditorToggle` | true | |

---

### Canvas Overlay for CMS-Driven Sections

When a CMS-driven section is displayed in the builder canvas, it needs a visual indicator that distinguishes it from static sections. This is a critical UX requirement.

**Hover state on CMS-driven sections in canvas:**
- A subtle banner appears at the top of the section: `"Content from Messages"` (or Events, Bible Studies, etc.) with a small database icon
- The banner uses the `muted` color scheme (low contrast, doesn't compete with section content)
- Clicking the banner opens the right drawer to the section's editor
- The banner includes a small "Manage in CMS" link icon that opens the relevant CMS page

**Selection state:**
- Same blue selection border as static sections
- The drawer opens with the `DataDrivenBanner` prominently at the top of the Content panel
- Below the banner: "Content is managed in the CMS. Use the controls below to customize how it's displayed."
- "Open in CMS" button (opens `/cms/messages`, `/cms/events`, etc.)

**Why this matters:**
A church admin clicking on the Messages section in the builder should immediately understand:
1. The message cards they see come from the CMS (they can't edit individual messages here)
2. They CAN change how those messages are displayed (columns, gap, card style, etc.)
3. They can jump to the CMS to add/edit actual message content

---

### Implementation Priority

| Priority | Section | Complexity | Notes |
|---|---|---|---|
| **P0** | ALL_MESSAGES | Medium | Start here — most requested, clearest pattern |
| **P0** | Canvas CMS overlay | Medium | Visual indicator needed for all CMS sections |
| **P1** | ALL_EVENTS | Low | Same pattern as ALL_MESSAGES |
| **P1** | ALL_BIBLE_STUDIES | Low | Same pattern as ALL_MESSAGES |
| **P1** | ALL_VIDEOS | Low | Same pattern as ALL_MESSAGES |
| **P1** | HIGHLIGHT_CARDS | Low | Already has rich editor, just add layout fields |
| **P1** | UPCOMING_EVENTS | Low | Add layout panel |
| **P2** | SPOTLIGHT_MEDIA | Medium | Refactor from manual fields to data-driven |
| **P2** | MEDIA_GRID | Low | Add layout panel |
| **P2** | EVENT_CALENDAR | Medium | Calendar layout options are complex |
| **P2** | RECURRING_MEETINGS | Low | Add layout panel |

---

### Team Deployment Plan (10 Developers)

> **Goal:** Ship CMS-driven section editing for all dynamic content sections, starting with Messages.
> **Timeline:** 2 weeks (10 working days)
> **Team:** 10 developers organized into 5 workstreams

#### Roles

| # | Role | Focus | Skills |
|---|---|---|---|
| 1 | **Tech Lead** | Architecture, code review, integration | Full-stack, builder internals |
| 2 | **Design Engineer** | Design tokens, component styling, canvas overlays | CSS, Tailwind, shadcn/ui, design system |
| 3 | **Editor Developer A** | Messages + Bible Studies editors | React, form components |
| 4 | **Editor Developer B** | Events + Videos editors | React, form components |
| 5 | **Editor Developer C** | Featured Content editors (SPOTLIGHT, HIGHLIGHT, MEDIA_GRID) | React, form components |
| 6 | **Section Renderer A** | Update ALL_MESSAGES + ALL_BIBLE_STUDIES components to read layout config | RSC, Tailwind grid |
| 7 | **Section Renderer B** | Update ALL_EVENTS + ALL_VIDEOS + UPCOMING_EVENTS components | RSC, Tailwind grid |
| 8 | **Canvas/Builder Engineer** | CMS overlay system, iframe postMessage protocol, "Manage in CMS" links | Builder shell, iframe protocol |
| 9 | **API/DAL Engineer** | Extend DAL functions with layout-driven params (pagination, sort), API updates | Prisma, Next.js API routes |
| 10 | **QA/Integration Engineer** | End-to-end testing, visual regression, cross-device verification | Playwright, manual QA |

#### Week 1: Foundation + Messages (Days 1-5)

**Day 1 — Architecture & Shared Components**

| Dev | Task |
|---|---|
| Tech Lead (#1) | Define `CmsLayoutConfig` TypeScript interface shared between editors and renderers. Write the `CmsLayoutEditor` base component that all CMS section layout panels extend. |
| Design Engineer (#2) | Design the canvas CMS overlay: badge position, colors (using design tokens), hover/active states, "Manage in CMS" icon. Create Figma mockup + CSS implementation using existing `muted` color scheme variables. |
| Editor Dev A (#3) | Build `MessagesLayoutEditor` — columns, card gap, image ratio, items per page, card style, visibility toggles. Import from `section-editors/shared/`. |
| Canvas Engineer (#8) | Extend iframe postMessage protocol (`iframe-protocol.ts`) with `CMS_SECTION_HOVER` and `CMS_SECTION_BADGE` message types. Add overlay rendering in `builder-preview-client.tsx`. |
| API/DAL Engineer (#9) | Extend `getMessages()` in `lib/dal/messages.ts` to accept `limit`, `offset`, `sortBy`, `sortDir` from section content JSON. Add `getMessageCount()` for pagination. |

**Day 2 — Messages Editor + Renderer**

| Dev | Task |
|---|---|
| Tech Lead (#1) | Code review Day 1 work. Define content JSON schema validation for ALL_MESSAGES. |
| Design Engineer (#2) | Implement canvas overlay component. Style the `DataDrivenBanner` redesign with "Open in CMS" button using `Button` from `components/ui/button.tsx`. |
| Editor Dev A (#3) | Complete MessagesLayoutEditor. Wire into `LAYOUT_EDITORS` registry. Test with builder. |
| Editor Dev B (#4) | Build `EventsLayoutEditor` — columns, gap, image ratio, card style, past events controls. |
| Section Renderer A (#6) | Update `AllMessagesSection` + `AllMessagesClient` to read `columns`, `cardGap`, `imageRatio`, `cardStyle`, `itemsPerPage` from content JSON. Apply via Tailwind classes. |
| Canvas Engineer (#8) | Complete CMS overlay badge rendering. Test hover/click states in canvas iframe. |
| API/DAL Engineer (#9) | Extend `resolve-section-data.ts` to pass layout config (limit, columns) from content JSON to DAL functions. |
| QA Engineer (#10) | Set up Playwright test scaffold for CMS section editing: open builder -> click CMS section -> verify editor fields -> change columns -> verify canvas update. |

**Day 3 — Messages Polish + Events Start**

| Dev | Task |
|---|---|
| Tech Lead (#1) | Integration testing: Messages editor -> save -> public site renders with new layout config. Fix content JSON migration (old sections without layout fields get defaults). |
| Design Engineer (#2) | Card style variants: design 3 message card styles (standard/compact/minimal) using existing card components. Ensure all variants use theme tokens. |
| Editor Dev A (#3) | Build `BibleStudiesLayoutEditor` (similar to Messages). |
| Editor Dev B (#4) | Complete EventsLayoutEditor. Wire into registry. |
| Editor Dev C (#5) | Build layout fields for `HighlightCardsEditor` (add columns, gap, image ratio, card style to existing editor). |
| Section Renderer A (#6) | Implement card style variants in AllMessagesClient. Test responsive column breakpoints. |
| Section Renderer B (#7) | Update `AllEventsSection` to read layout config from content JSON. |
| API/DAL Engineer (#9) | Extend `getEvents()` with layout-driven params. Add `getEventCount()`. |
| QA Engineer (#10) | Messages end-to-end test: change columns to 4, save, verify public site shows 4 columns. |

**Day 4 — Events + Bible Studies + Videos**

| Dev | Task |
|---|---|
| Editor Dev A (#3) | Complete BibleStudiesLayoutEditor. |
| Editor Dev B (#4) | Build `VideosLayoutEditor`. |
| Editor Dev C (#5) | Build layout panel for `UpcomingEventsEditor`. Add layout fields to `MediaGridEditor`. |
| Section Renderer A (#6) | Update `AllBibleStudiesSection` to read layout config. |
| Section Renderer B (#7) | Update `AllVideosSection` + `UpcomingEventsSection` to read layout config. |
| Design Engineer (#2) | Event card style variants. Ensure consistent card component library across all CMS sections. |
| Canvas Engineer (#8) | "Manage in CMS" deep links: map section types to CMS URLs (`ALL_MESSAGES` -> `/cms/messages`, `ALL_EVENTS` -> `/cms/events`, etc.). Add to overlay and drawer. |
| QA Engineer (#10) | Events + Bible Studies editor tests. Cross-device canvas rendering (desktop/tablet/mobile column counts). |

**Day 5 — Integration + Bug Fixes**

| Dev | Task |
|---|---|
| All | Integration day. All editors wired, all renderers reading config, canvas overlay working for all CMS sections. |
| Tech Lead (#1) | Final review of all layout editors. Verify backward compatibility (old content JSON without layout fields works with sensible defaults). |
| Design Engineer (#2) | Visual polish: ensure all card variants, gap sizes, and image ratios look correct across all CMS sections. Fix any design token inconsistencies. |
| QA Engineer (#10) | Full regression: test all 11 CMS-driven section types in builder. Test save/load cycle. Test public site rendering. |

#### Week 2: Featured Content + Polish + Ship (Days 6-10)

**Day 6-7 — Featured Content Sections**

| Dev | Task |
|---|---|
| Editor Dev C (#5) | Refactor `SpotlightMediaEditor` from manual fields to data-driven + layout controls. |
| Section Renderer A (#6) | Update `SpotlightMediaSection` to support layout variants (featured/split). |
| Editor Dev B (#4) | Add layout panel to `EventCalendarEditor` (default view, filters, mini calendar). |
| Section Renderer B (#7) | Update `EventCalendarSection` to read layout config. |
| Editor Dev A (#3) | Add layout panel to `RecurringMeetingsEditor` (layout style, columns, visibility toggles). |

**Day 8-9 — Canvas Polish + Card Component Library**

| Dev | Task |
|---|---|
| Design Engineer (#2) | Audit all card components across all CMS sections. Extract shared `ContentCard` component with configurable: image ratio, metadata slots, style variant. |
| Canvas Engineer (#8) | Polish canvas overlay: animations, z-index edge cases, interaction with drag-and-drop, responsive behavior. |
| Tech Lead (#1) | Content type safety: add TypeScript interfaces for all CMS section content JSON shapes. Replace `Record<string, unknown>`. |
| QA Engineer (#10) | Full suite: all 11 CMS sections, all editors, all card styles, all column counts, all devices. |

**Day 10 — Ship**

| Dev | Task |
|---|---|
| All | Final integration, bug fixes, documentation update. |
| Tech Lead (#1) | Update this doc with "DONE" status. Update builder roadmap. |
| QA Engineer (#10) | Sign-off checklist for all CMS-driven sections. |

#### Success Criteria

- [ ] All 11 CMS-driven sections have rich layout editors (not just heading + CTA)
- [ ] Column count (desktop/tablet/mobile) is configurable on all grid sections
- [ ] Card gap / spacing is configurable
- [ ] Image ratio is configurable
- [ ] Card style variants exist (minimum 2 per section type)
- [ ] Canvas shows CMS indicator overlay on hover for all data-driven sections
- [ ] "Manage in CMS" link works from both canvas overlay and editor drawer
- [ ] All layout changes save correctly and render on public site
- [ ] Old content JSON (without layout fields) falls back to sensible defaults
- [ ] No breaking changes to existing public website rendering
