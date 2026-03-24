# Future Editor Component Map — Post-Consolidation Reference

> **Date:** March 18, 2026
> **Purpose:** Maps out the editor component architecture after the 41-to-24 section consolidation described in `section-design-recommendation.md` is implemented. A developer should be able to pick up any of the 24 section types and build its editor from this document alone.
> **Prerequisites:** Read `section-design-recommendation.md`, `section-editor-gap-analysis.md`, and `worklog/editor-component-system-plan.md` first.

---

## Table of Contents

- [A. Editor Specifications Per Section Type (24 types)](#a-editor-specifications-per-section-type)
- [B. Variant Selector Component Spec](#b-variant-selector-component-spec)
- [C. Component Reuse Matrix](#c-component-reuse-matrix)
- [D. Migration Path Per Section Type](#d-migration-path-per-section-type)
- [E. New Components Needed](#e-new-components-needed)

---

## A. Editor Specifications Per Section Type

For each of the 24 proposed section types: shared components used, variant-specific fields, and a form layout diagram.

### Shared Component Reference (from `editor-component-system-plan.md`)

| Component | Tier | Purpose |
|-----------|------|---------|
| `EditorField` | 1 | Universal label + description wrapper |
| `EditorInput` | 1 | Labeled text input |
| `EditorTextarea` | 1 | Labeled textarea |
| `EditorToggle` | 1 | Switch with label and optional description |
| `EditorSelect` | 1 | Dropdown with label |
| `EditorButtonGroup` | 1 | Segmented control |
| `TwoColumnGrid` | 1 | Side-by-side field layout |
| `ArrayField` | 2 | Full array editor with add/remove/reorder |
| `SocialLinksField` | 2 | Platform + URL array |
| `AddressField` | 2 | Multi-line address |
| `ImagePickerField` | Existing | Image URL with media picker |
| `ButtonConfig` | Existing | CTA button (label + href + visible) |
| `DataDrivenBanner` | 3 | Info banner for CMS-populated sections |
| `VariantSelector` | 3 | Visual layout variant toggle (NEW) |
| `EditorSection` | 3 | Collapsible field group (NEW) |
| `DataSourceSelector` | 3 | Data source dropdown (NEW) |

---

### 1. Hero

**DB types written:** `HERO_BANNER`, `PAGE_HERO`, `TEXT_IMAGE_HERO`, `EVENTS_HERO`
**Variants:** Full-width background, Centered, Split, Simple
**Editor file:** `hero-editor.tsx` (refactored)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `VariantSelector` | Layout picker at top of editor |
| `EditorSection` | "Content" and "Background" collapsible groups |
| `EditorInput` | Heading lines, overline, subheading |
| `EditorTextarea` | Description (Split variant) |
| `ButtonConfig` | Primary + secondary buttons |
| `ImagePickerField` | Background image (Full-width), hero image (Split) |

#### Variant Field Visibility

| Field | Full-width | Centered | Split | Simple |
|-------|:---:|:---:|:---:|:---:|
| Heading Line 1 | Y | Y | Y | Y |
| Heading Line 2 | Y | - | - | - |
| Subheading / Description | Y (textarea) | - | Y (textarea) | Y (textarea) |
| Overline | Y | Y | Y | - |
| Primary Button | Y | Y | - | - |
| Secondary Button | Y | Y | - | - |
| Background Image | Y | - | - | - |
| Background Video URL | Y | - | - | - |
| Background Alt + Position | Y | - | - | - |
| Hero Image | - | - | Y | - |
| Hero Image Alt + Position | - | - | Y | - |
| Heading Accent | - | - | Y | - |
| Text Alignment (L/C/R) | - | - | Y | - |

#### Form Layout Diagram

```
+------------------------------------------+
| [VariantSelector]                        |
|  ( Full-width | Centered | Split | Simple )|
+------------------------------------------+
| [EditorSection: "Content"]               |
|   Overline         [EditorInput]    *    |
|   Heading Line 1   [EditorInput]         |
|   Heading Line 2   [EditorInput]    *fw  |
|   Heading Accent   [EditorInput]    *sp  |
|   Description      [EditorTextarea] *    |
|   Text Alignment   [ButtonGroup]    *sp  |
+------------------------------------------+
| [EditorSection: "Buttons"]          *    |
|   [ButtonConfig: Primary]                |
|   [ButtonConfig: Secondary]              |
+------------------------------------------+
| [EditorSection: "Background"]       *fw  |
|   Image            [ImagePickerField]    |
|   Video URL        [EditorInput]         |
|   Alt Text         [EditorInput]         |
|   Object Position  [EditorInput]         |
+------------------------------------------+
| [EditorSection: "Image"]            *sp  |
|   Hero Image       [ImagePickerField]    |
|   Alt Text         [EditorInput]         |
|   Object Position  [EditorInput]         |
+------------------------------------------+

* = shown for subset of variants
*fw = Full-width only
*sp = Split only
```

---

### 2. Ministry Header

**DB type written:** `MINISTRY_HERO`
**Variants:** None (standalone)
**Editor file:** `hero-editor.tsx` (sub-component)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Overline, heading |
| `EditorTextarea` | Heading (multi-line) |
| `EditorButtonGroup` | Heading style (display / sans) |
| `ButtonConfig` | CTA button |
| `ImagePickerField` | Hero image |
| `SocialLinksField` | Social links array (NEW gap fill) |

#### Form Layout Diagram

```
+------------------------------------------+
| [EditorSection: "Content"]               |
|   Overline           [EditorInput]       |
|   Heading            [EditorTextarea]    |
|   Heading Style      [EditorButtonGroup] |
|                      (display | sans)    |
+------------------------------------------+
| [EditorSection: "Button"]                |
|   [ButtonConfig: CTA]                    |
+------------------------------------------+
| [EditorSection: "Image"]                 |
|   Hero Image         [ImagePickerField]  |
|   Alt Text           [EditorInput]       |
|   Object Position    [EditorInput]       |
+------------------------------------------+
| [EditorSection: "Social Links"]          |
|   [SocialLinksField]                     |
+------------------------------------------+
```

---

### 3. Image & Text

**DB type written:** `MEDIA_TEXT`
**Variants:** None
**Editor file:** `content-editor.tsx` (sub-component)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Overline, heading |
| `EditorTextarea` | Body text |
| `ButtonConfig` | CTA button |
| `ArrayField` + `ImagePickerField` | Images array (NEW gap fill) |

#### Form Layout Diagram

```
+------------------------------------------+
| [EditorSection: "Content"]               |
|   Overline         [EditorInput]         |
|   Heading          [EditorInput]         |
|   Body             [EditorTextarea]      |
+------------------------------------------+
| [EditorSection: "Button"]                |
|   [ButtonConfig: CTA]                    |
+------------------------------------------+
| [EditorSection: "Images"]                |
|   [ArrayField of ImagePickerField]       |
|   (add/remove/reorder image items)       |
+------------------------------------------+
```

---

### 4. Quote

**DB type written:** `QUOTE_BANNER`
**Variants:** None
**Editor file:** `content-editor.tsx` (sub-component)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Overline, heading, verse reference |
| `EditorTextarea` | Verse text |

#### Form Layout Diagram

```
+------------------------------------------+
| Overline             [EditorInput]       |
| Heading              [EditorInput]       |
| Verse Text           [EditorTextarea]    |
| Verse Reference      [EditorInput]       |
+------------------------------------------+
```

---

### 5. Call to Action

**DB type written:** `CTA_BANNER`
**Variants:** None
**Editor file:** `content-editor.tsx` (sub-component)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Overline, heading |
| `EditorTextarea` | Body |
| `ImagePickerField` | Background image |
| `ButtonConfig` | Primary + secondary buttons |

#### Form Layout Diagram

```
+------------------------------------------+
| [EditorSection: "Content"]               |
|   Overline         [EditorInput]         |
|   Heading          [EditorInput]         |
|   Body             [EditorTextarea]      |
+------------------------------------------+
| [EditorSection: "Buttons"]               |
|   [ButtonConfig: Primary]                |
|   [ButtonConfig: Secondary]              |
+------------------------------------------+
| [EditorSection: "Background"]            |
|   Image            [ImagePickerField]    |
+------------------------------------------+
```

---

### 6. About

**DB type written:** `ABOUT_DESCRIPTION`
**Variants:** None
**Editor file:** `content-editor.tsx` (sub-component)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `ImagePickerField` | Logo image |
| `EditorInput` | Heading, video URL, video title |
| `EditorTextarea` | Description |

#### Form Layout Diagram

```
+------------------------------------------+
| Logo               [ImagePickerField]    |
| Heading            [EditorInput]         |
| Description        [EditorTextarea]      |
| Video URL          [EditorInput]         |
| Video Title        [EditorInput]         |
+------------------------------------------+
```

---

### 7. Statement

**DB type written:** `STATEMENT`
**Variants:** None
**Editor file:** `content-editor.tsx` (sub-component)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Overline, heading, lead-in text |
| `EditorToggle` | Show cross icon |
| `ArrayField` + `EditorTextarea` | Paragraphs array |

#### Form Layout Diagram

```
+------------------------------------------+
| [EditorSection: "Content"]               |
|   Overline         [EditorInput]         |
|   Heading          [EditorInput]         |
|   Lead-In Text     [EditorInput]         |
|   Show Cross Icon  [EditorToggle]        |
+------------------------------------------+
| [EditorSection: "Paragraphs"]            |
|   [ArrayField of EditorTextarea items]   |
+------------------------------------------+
```

---

### 8. Photo Gallery

**DB type written:** `PHOTO_GALLERY`
**Variants:** None
**Editor file:** `photo-gallery-editor.tsx`

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Heading |
| `ArrayField` | Image items array |
| `ImagePickerField` | Per-image picker |

#### Form Layout Diagram

```
+------------------------------------------+
| Heading            [EditorInput]         |
| [ArrayField: "Images"]                   |
|   Per item:                              |
|     Image          [ImagePickerField]    |
|     Alt Text       [EditorInput]         |
|     Object Position [EditorInput]        |
+------------------------------------------+
```

---

### 9. Card Grid

**DB types written:** `ACTION_CARD_GRID`, `PATHWAY_CARD`
**Variants:** Image cards, Icon cards
**Editor file:** `cards-editor.tsx` (refactored)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `VariantSelector` | Style toggle (Image cards / Icon cards) |
| `EditorInput` | Heading lines, subheading, description |
| `ButtonConfig` | CTA button |
| `ArrayField` | Cards array |
| `ImagePickerField` | Per-card image (Image cards variant) |

#### Variant Field Visibility

| Field | Image cards | Icon cards |
|-------|:---:|:---:|
| Heading Line 1 | Y | Y |
| Heading Line 2 (+ italic) | Y | - |
| Heading Line 3 | Y | - |
| Heading (single) | - | Y |
| Subheading | Y | - |
| Description | - | Y |
| CTA Button | Y | Y |
| **Per-card fields:** | | |
| Card Title | Y | Y |
| Card Description | Y | Y |
| Card Image | Y | - |
| Card Link | Y | - |
| Card Icon Key | - | Y |
| Card Button Label | - | Y |
| Card Button Link | - | Y |

#### Form Layout Diagram

```
+------------------------------------------+
| [VariantSelector]                        |
|  ( Image cards | Icon cards )            |
+------------------------------------------+
| [EditorSection: "Content"]               |
|   Heading          [EditorInput(s)]      |
|   Subheading/Desc  [EditorInput/Textarea]|
+------------------------------------------+
| [EditorSection: "Button"]                |
|   [ButtonConfig: CTA]                    |
+------------------------------------------+
| [EditorSection: "Cards"]                 |
|   [ArrayField]                           |
|   Per card (Image variant):              |
|     Title          [EditorInput]         |
|     Description    [EditorTextarea]      |
|     Image          [ImagePickerField]    |
|     Link           [EditorInput]         |
|   Per card (Icon variant):               |
|     Icon Key       [EditorInput]         |
|     Title          [EditorInput]         |
|     Description    [EditorTextarea]      |
|     Button Label   [EditorInput]         |
|     Button Link    [EditorInput]         |
+------------------------------------------+
```

---

### 10. Feature List

**DB type written:** `FEATURE_BREAKDOWN`
**Variants:** None
**Editor file:** `cards-editor.tsx` (sub-component)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Heading |
| `EditorTextarea` | Description |
| `ArrayField` + `EditorInput` | Acronym lines |
| `ButtonConfig` | CTA button |

#### Form Layout Diagram

```
+------------------------------------------+
| Heading            [EditorInput]         |
| Description        [EditorTextarea]      |
| [ArrayField: "Acronym Lines"]            |
|   Per line:        [EditorInput]         |
| [ButtonConfig: CTA]                      |
+------------------------------------------+
```

---

### 11. Alternating Content

**DB type written:** `PILLARS`
**Variants:** None
**Editor file:** `cards-editor.tsx` (sub-component)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Overline, heading |
| `ArrayField` | Pillar items |
| `EditorInput` + `EditorTextarea` | Per-pillar title, description |
| `ButtonConfig` | Per-pillar button (label + link) |
| `ArrayField` + `ImagePickerField` | Per-pillar image array (NEW gap fill) |

#### Form Layout Diagram

```
+------------------------------------------+
| [EditorSection: "Content"]               |
|   Overline         [EditorInput]         |
|   Heading          [EditorInput]         |
+------------------------------------------+
| [EditorSection: "Pillars"]               |
|   [ArrayField: "Pillar Items"]           |
|   Per pillar:                            |
|     Title          [EditorInput]         |
|     Description    [EditorTextarea]      |
|     Button Label   [EditorInput]         |
|     Button Link    [EditorInput]         |
|     [ArrayField: "Images" (1-3)]         |
|       Per image:   [ImagePickerField]    |
+------------------------------------------+
```

---

### 12. Welcome Banner

**DB type written:** `NEWCOMER`
**Variants:** None
**Editor file:** `cards-editor.tsx` (sub-component)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Heading, button label, button link |
| `EditorTextarea` | Description |
| `ImagePickerField` | Optional image |

#### Form Layout Diagram

```
+------------------------------------------+
| Heading            [EditorInput]         |
| Description        [EditorTextarea]      |
| Button Label       [EditorInput]         |
| Button Link        [EditorInput]         |
| Image              [ImagePickerField]    |
+------------------------------------------+
```

---

### 13. Content Listing

**DB types written:** `ALL_MESSAGES`, `ALL_EVENTS`, `ALL_BIBLE_STUDIES`, `ALL_VIDEOS`
**Variants:** Messages, Events, Bible Studies, Videos (via `DataSourceSelector`)
**Editor file:** NEW `content-listing-editor.tsx` or refactored `data-section-editor.tsx`

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `DataSourceSelector` | Data source dropdown (NEW) |
| `EditorInput` | Section heading |
| `DataDrivenBanner` | Info banner explaining auto-population |

#### Variant Field Visibility

All four data sources share the same editor: just a heading field. The `DataSourceSelector` determines which `SectionType` enum value is written to the DB.

| Field | Messages | Events | Bible Studies | Videos |
|-------|:---:|:---:|:---:|:---:|
| Section Heading | Y | Y | Y | Y |
| Data Source Selector | Y | Y | Y | Y |
| Data-Driven Banner | Y | Y | Y | Y |

#### Form Layout Diagram

```
+------------------------------------------+
| [DataDrivenBanner]                       |
|  "Content auto-populated from CMS."     |
+------------------------------------------+
| [DataSourceSelector]                     |
|  ( Messages | Events | Studies | Videos )|
+------------------------------------------+
| Section Heading    [EditorInput]         |
+------------------------------------------+
```

---

### 14. Featured Content

**DB types written:** `SPOTLIGHT_MEDIA`, `HIGHLIGHT_CARDS`, `MEDIA_GRID`
**Variants:** Spotlight, Highlight cards, Video grid
**Editor file:** Refactored from `content-editor.tsx` + `cards-editor.tsx` + `data-section-editor.tsx`

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `VariantSelector` | Style picker (Spotlight / Highlight cards / Video grid) |
| `EditorInput` | Section heading, CTA label, CTA link |
| `DataDrivenBanner` | Info banner |
| `EditorToggle` | Auto-hide past, include recurring, show past (Highlight cards) |
| `EditorSelect` | Sort order, past events window (Highlight cards) |
| `EditorInput` (number) | Number of events (Highlight cards) |

#### Variant Field Visibility

| Field | Spotlight | Highlight cards | Video grid |
|-------|:---:|:---:|:---:|
| Section Heading | Y | Y | Y |
| Data-Driven Banner | Y | Y | Y |
| CTA Label | - | Y | Y |
| CTA Link | - | Y | Y |
| Number of Events | - | Y | - |
| Sort Order | - | Y | - |
| Auto-Hide Past | - | Y | - |
| Include Recurring | - | Y | - |
| Show Past Events | - | Y | - |
| Past Events Window | - | Y | - |

#### Form Layout Diagram

```
+------------------------------------------+
| [DataDrivenBanner]                       |
|  "Content auto-populated from CMS."     |
+------------------------------------------+
| [VariantSelector]                        |
|  ( Spotlight | Highlight | Video grid )  |
+------------------------------------------+
| [EditorSection: "Content"]               |
|   Section Heading  [EditorInput]         |
+------------------------------------------+
| [EditorSection: "CTA"]            *hc,vg|
|   CTA Label        [EditorInput]         |
|   CTA Link         [EditorInput]         |
+------------------------------------------+
| [EditorSection: "Filters"]          *hc  |
|   Number of Events [EditorInput num]     |
|   Sort Order       [EditorSelect]        |
|   Auto-Hide Past   [EditorToggle]        |
|   Include Recurring [EditorToggle]       |
|   Show Past Events [EditorToggle]        |
|   Past Events Window [EditorSelect]      |
+------------------------------------------+

*hc = Highlight cards only
*vg = Video grid only
*hc,vg = both Highlight cards and Video grid
```

---

### 15. Upcoming Events

**DB type written:** `UPCOMING_EVENTS`
**Variants:** None
**Editor file:** `data-section-editor.tsx` (sub-component)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Overline, section heading |
| `ButtonConfig` | CTA button |
| `DataDrivenBanner` | Info banner |

#### Form Layout Diagram

```
+------------------------------------------+
| [DataDrivenBanner]                       |
| Overline           [EditorInput]         |
| Section Heading    [EditorInput]         |
| [ButtonConfig: CTA]                      |
+------------------------------------------+
```

---

### 16. Event Calendar

**DB type written:** `EVENT_CALENDAR`
**Variants:** None
**Editor file:** `data-section-editor.tsx` (sub-component)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Section heading |
| `DataDrivenBanner` | Info banner |
| `ArrayField` + `ButtonConfig` | CTA buttons array (NEW gap fill, optional) |

#### Form Layout Diagram

```
+------------------------------------------+
| [DataDrivenBanner]                       |
| Section Heading    [EditorInput]         |
| [EditorSection: "CTA Buttons"]           |
|   [ArrayField of ButtonConfig items]     |
+------------------------------------------+
```

---

### 17. Recurring Meetings

**DB types written:** `RECURRING_MEETINGS`, `QUICK_LINKS`
**Variants:** List, Carousel
**Editor file:** Refactored from `data-section-editor.tsx`

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `VariantSelector` | Layout toggle (List / Carousel) |
| `EditorInput` | Section heading, subtitle, view all link |
| `EditorInput` (number) | Max visible (List variant only) |
| `DataDrivenBanner` | Info banner |

#### Variant Field Visibility

| Field | List | Carousel |
|-------|:---:|:---:|
| Section Heading | Y | Y |
| Subtitle | - | Y |
| Max Visible | Y | - |
| View All Link | Y | - |
| Data-Driven Banner | Y | Y |

#### Form Layout Diagram

```
+------------------------------------------+
| [DataDrivenBanner]                       |
+------------------------------------------+
| [VariantSelector]                        |
|  ( List | Carousel )                     |
+------------------------------------------+
| Section Heading    [EditorInput]         |
| Subtitle           [EditorInput]   *car  |
| Max Visible        [EditorInput num] *ls |
| View All Link      [EditorInput]     *ls |
+------------------------------------------+

*ls = List only
*car = Carousel only
```

---

### 18. Team

**DB type written:** `MEET_TEAM`
**Variants:** None
**Editor file:** `ministry-editor.tsx` (sub-component)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Overline, heading |
| `ArrayField` | Team members array |
| `ImagePickerField` | Per-member photo (CHANGED from URL text input — gap fill) |
| `EditorInput` + `EditorTextarea` | Per-member name, role, bio |

#### Form Layout Diagram

```
+------------------------------------------+
| Overline           [EditorInput]         |
| Heading            [EditorInput]         |
| [ArrayField: "Team Members"]             |
|   Per member:                            |
|     Photo          [ImagePickerField]    |
|     Name           [EditorInput]         |
|     Role           [EditorInput]         |
|     Bio            [EditorTextarea]      |
+------------------------------------------+
```

---

### 19. Location

**DB types written:** `LOCATION_DETAIL`, `MINISTRY_SCHEDULE`, `CAMPUS_CARD_GRID`, `RECURRING_SCHEDULE`
**Variants:** Detail, Schedule, Card grid, Weekly schedule
**Editor file:** Refactored, merging `ministry-editor.tsx` + `schedule-editor.tsx`

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `VariantSelector` | Layout toggle (Detail / Schedule / Card grid / Weekly schedule) |
| `EditorSection` | Collapsible groups for Content, Schedule, Location, etc. |
| `EditorInput` | Heading, description, overline, time labels, directions URL, CTA heading |
| `EditorTextarea` | Description |
| `AddressField` | Address lines (Detail, Schedule variants) |
| `ImagePickerField` | Section image |
| `ArrayField` | Schedule entries, campus cards, buttons, meeting items |
| `ButtonConfig` | CTA buttons, per-entry buttons |
| `EditorButtonGroup` | Day toggles (Weekly schedule variant) |

#### Variant Field Visibility

| Field | Detail | Schedule | Card grid | Weekly schedule |
|-------|:---:|:---:|:---:|:---:|
| Overline | Y | - | Y | - |
| Heading | - | Y | Y | Y |
| Description | - | Y | Y | - |
| Subtitle | - | - | - | Y |
| Time Label | Y | - | - | - |
| Time Value | Y | Y | - | - |
| Address Lines | Y | Y | - | - |
| Address Label | Y | - | - | - |
| Directions Label | Y | - | - | - |
| Directions URL | Y | Y | - | - |
| Images Array | Y | - | - | - |
| Section Image | - | Y | - | - |
| Schedule Entries | - | Y | - | - |
| Buttons Array | - | Y | - | - |
| Campus Cards Array | - | - | Y | - |
| CTA Heading | - | - | Y | - |
| CTA Button | - | - | Y | - |
| Meetings Array | - | - | - | Y |

#### Form Layout Diagram

```
+------------------------------------------+
| [VariantSelector]                        |
|  ( Detail | Schedule | Card grid |       |
|    Weekly schedule )                     |
+------------------------------------------+
| [EditorSection: "Content"]               |
|   Overline         [EditorInput]   *d,cg |
|   Heading          [EditorInput]   *s,cg,w|
|   Description      [EditorTextarea]*s,cg |
|   Subtitle         [EditorTextarea] *w   |
+------------------------------------------+
| [EditorSection: "Time & Location"] *d,s  |
|   Time Label       [EditorInput]    *d   |
|   Time Value       [EditorInput]    *d,s |
|   Address Label    [EditorInput]    *d   |
|   [AddressField]                    *d,s |
|   Directions Label [EditorInput]    *d   |
|   Directions URL   [EditorInput]    *d,s |
+------------------------------------------+
| [EditorSection: "Images"]           *d   |
|   [ArrayField of ImagePickerField]       |
+------------------------------------------+
| [EditorSection: "Image"]            *s   |
|   Section Image    [ImagePickerField]    |
+------------------------------------------+
| [EditorSection: "Schedule"]         *s   |
|   [ArrayField: Schedule Entries]         |
|   Per entry:                             |
|     Day            [EditorInput]         |
|     Time           [EditorInput]         |
|     Location       [EditorInput]         |
+------------------------------------------+
| [EditorSection: "Buttons"]          *s   |
|   [ArrayField: Buttons]                  |
|   Per button:                            |
|     Label          [EditorInput]         |
|     Link           [EditorInput]         |
|     Variant        [EditorSelect]        |
+------------------------------------------+
| [EditorSection: "Campuses"]         *cg  |
|   [ArrayField: Campus Cards]             |
|   Per card:                              |
|     Name           [EditorInput]         |
|     Link           [EditorInput]         |
|     Image          [ImagePickerField]    |
+------------------------------------------+
| [EditorSection: "CTA"]             *cg   |
|   CTA Heading      [EditorInput]         |
|   [ButtonConfig: CTA]                    |
+------------------------------------------+
| [EditorSection: "Meetings"]         *w   |
|   [ArrayField: Meeting Items]            |
|   Per meeting:                           |
|     Title          [EditorInput]         |
|     Description    [EditorTextarea]      |
|     Time           [EditorInput]         |
|     Location       [EditorInput]         |
|     Days           [EditorButtonGroup]   |
|                    (7 day toggles)        |
+------------------------------------------+

*d = Detail, *s = Schedule, *cg = Card grid, *w = Weekly schedule
```

---

### 20. Ministry Intro

**DB types written:** `MINISTRY_INTRO`, `DIRECTORY_LIST`
**Variants:** Single, Directory
**Editor file:** `ministry-editor.tsx` (refactored)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `VariantSelector` | Layout toggle (Single / Directory) |
| `EditorInput` | Overline, heading, CTA heading |
| `EditorTextarea` | Description |
| `ImagePickerField` | Side image (Single), background image (Directory) |
| `ArrayField` | Directory items (Directory variant) |
| `ButtonConfig` | CTA button (Directory variant) |

#### Variant Field Visibility

| Field | Single | Directory |
|-------|:---:|:---:|
| Overline | Y | - |
| Heading | Y | Y |
| Description | Y | - |
| Side Image | Y | - |
| Image Alt + Position | Y | - |
| Directory Items Array | - | Y |
| Background Image | - | Y |
| CTA Heading | - | Y |
| CTA Button | - | Y |

#### Form Layout Diagram

```
+------------------------------------------+
| [VariantSelector]                        |
|  ( Single | Directory )                  |
+------------------------------------------+
| [EditorSection: "Content"]               |
|   Overline         [EditorInput]   *sing |
|   Heading          [EditorInput]         |
|   Description      [EditorTextarea]*sing |
+------------------------------------------+
| [EditorSection: "Image"]           *sing |
|   Side Image       [ImagePickerField]    |
|   Alt Text         [EditorInput]         |
|   Object Position  [EditorInput]         |
+------------------------------------------+
| [EditorSection: "Directory Items"]  *dir |
|   [ArrayField]                           |
|   Per item:                              |
|     Label          [EditorInput]         |
|     Link           [EditorInput]         |
|     Description    [EditorTextarea]      |
+------------------------------------------+
| [EditorSection: "Background"]       *dir |
|   Image            [ImagePickerField]    |
|   Alt Text         [EditorInput]         |
+------------------------------------------+
| [EditorSection: "CTA"]             *dir  |
|   CTA Heading      [EditorInput]         |
|   [ButtonConfig: CTA]                    |
+------------------------------------------+

*sing = Single only
*dir = Directory only
```

---

### 21. FAQ

**DB type written:** `FAQ_SECTION`
**Variants:** None
**Editor file:** `faq-editor.tsx`

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Section heading |
| `EditorToggle` | Show question icon |
| `ArrayField` | FAQ items (reorderable) |
| `EditorInput` + `EditorTextarea` | Per-item question + answer |

#### Form Layout Diagram

```
+------------------------------------------+
| Section Heading    [EditorInput]         |
| Show Question Icon [EditorToggle]        |
| [ArrayField: "FAQ Items" reorderable]    |
|   Per item:                              |
|     Question       [EditorInput]         |
|     Answer         [EditorTextarea]      |
+------------------------------------------+
```

---

### 22. Timeline

**DB type written:** `TIMELINE_SECTION`
**Variants:** None
**Editor file:** `timeline-editor.tsx`

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Overline, heading |
| `EditorTextarea` | Description |
| `ArrayField` | Timeline items (reorderable) |
| `EditorInput` + `EditorTextarea` | Per-item time, title, description |

#### Form Layout Diagram

```
+------------------------------------------+
| Overline           [EditorInput]         |
| Heading            [EditorInput]         |
| Description        [EditorTextarea]      |
| [ArrayField: "Timeline Items" reorderable]|
|   Per item:                              |
|     Time           [EditorInput]         |
|     Title          [EditorInput]         |
|     Description    [EditorTextarea]      |
+------------------------------------------+
```

---

### 23. Contact Form

**DB type written:** `FORM_SECTION`
**Variants:** None
**Editor file:** `form-editor.tsx`

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `EditorInput` | Overline, heading, bible teacher label, submit button label, success message |
| `EditorTextarea` | Description |
| `ArrayField` | Interest options, campus options |
| `TwoColumnGrid` | Per-option label + value |

#### Form Layout Diagram

```
+------------------------------------------+
| [EditorSection: "Content"]               |
|   Overline         [EditorInput]         |
|   Heading          [EditorInput]         |
|   Description      [EditorTextarea]      |
+------------------------------------------+
| [EditorSection: "Interest Options"]      |
|   [ArrayField]                           |
|   Per option:                            |
|     [TwoColumnGrid]                      |
|       Label        [EditorInput]         |
|       Value        [EditorInput]         |
+------------------------------------------+
| [EditorSection: "Campus Options"]        |
|   [ArrayField]                           |
|   Per option:                            |
|     [TwoColumnGrid]                      |
|       Label        [EditorInput]         |
|       Value        [EditorInput]         |
+------------------------------------------+
| [EditorSection: "Settings"]              |
|   Bible Teacher Label [EditorInput]      |
|   Submit Button Label [EditorInput]      |
|   Success Message  [EditorInput]         |
+------------------------------------------+
```

---

### 24. Custom Embed

**DB types written:** `CUSTOM_HTML`, `CUSTOM_EMBED`
**Variants:** HTML mode, URL mode (tab toggle)
**Editor file:** `custom-editor.tsx` (refactored)

#### Shared Components Used

| Component | Usage |
|-----------|-------|
| `VariantSelector` | Mode toggle (HTML / URL) — rendered as tab-style |
| `EditorTextarea` | HTML content (HTML mode, monospace) |
| `EditorInput` | Embed URL, title (URL mode) |
| `EditorButtonGroup` | Aspect ratio selector (URL mode) |
| `TwoColumnGrid` | Custom width/height (URL mode, when "custom" aspect selected) |

#### Variant Field Visibility

| Field | HTML mode | URL mode |
|-------|:---:|:---:|
| HTML Content (monospace textarea) | Y | - |
| Embed URL | - | Y |
| Title | - | Y |
| Aspect Ratio | - | Y |
| Custom Width/Height | - | Y (only when "custom" aspect) |

#### Form Layout Diagram

```
+------------------------------------------+
| [VariantSelector: tab style]             |
|  ( HTML | URL )                          |
+------------------------------------------+
| --- HTML mode ---                        |
| HTML Content       [EditorTextarea mono] |
| [Warning banner: "HTML is not sanitized"]|
+------------------------------------------+
| --- URL mode ---                         |
| Embed URL          [EditorInput]         |
| Title              [EditorInput]         |
| Aspect Ratio       [EditorButtonGroup]   |
|   (16:9 | 4:3 | 1:1 | 9:16 | Custom)   |
| [TwoColumnGrid] (if Custom):            |
|   Width            [EditorInput num]     |
|   Height           [EditorInput num]     |
+------------------------------------------+
```

---

## B. Variant Selector Component Spec

### Purpose

The `VariantSelector` enables a single section type in the picker to write different `SectionType` enum values to the database based on the user's layout choice. It is the linchpin of the 41-to-24 consolidation: the picker shows 24 items, but the database still stores all 41 original enum values.

### Component Specification

```typescript
interface VariantOption {
  value: string              // internal key, e.g., "full-width"
  sectionType: SectionType   // DB enum value, e.g., "HERO_BANNER"
  label: string              // user-facing, e.g., "Full-width background"
  description?: string       // one-liner explaining the variant
  thumbnail?: string         // URL to a preview image or icon
}

interface VariantSelectorProps {
  label?: string             // defaults to "Layout"
  value: string              // currently selected variant key
  onChange: (variant: string, sectionType: SectionType) => void
  options: VariantOption[]
  size?: "default" | "compact"  // compact for tabs (Custom Embed), default for cards
}
```

### Visual Rendering

The `VariantSelector` has two visual modes:

**Card mode (default):** Used for Hero, Card Grid, Location, Ministry Intro, Featured Content, Recurring Meetings. Renders as a grid of selectable cards, each showing:
- Thumbnail image or icon (top)
- Label (bold, below thumbnail)
- Description (small text, below label)
- Selected state: highlighted border in primary color

```
+--------+  +--------+  +--------+  +--------+
| [img]  |  | [img]  |  | [img]  |  | [img]  |
| Full-  |  |Centered|  | Split  |  | Simple |
| width  |  |        |  |        |  |        |
| bg img |  | no bg  |  | text + |  | just   |
| + text |  | center |  | image  |  | heading|
+--------+  +--------+  +--------+  +--------+
    ^selected
```

**Tab mode (compact):** Used for Custom Embed (just two options). Renders as a segmented control similar to `EditorButtonGroup`.

```
[ HTML | URL ]
```

### Content Transfer Behavior on Variant Switch

When a user changes the variant, the editor must decide what happens to the existing content. The rules:

1. **Shared fields carry over.** If both variants have a `heading` field, the value is preserved. The user typed it once; they should not have to retype it.

2. **Variant-specific fields reset to defaults.** If the user switches from "Full-width" (which has `backgroundImage`) to "Centered" (which does not), the `backgroundImage` value is dropped. When switching back, it starts from defaults.

3. **The `SectionType` in the database changes.** Switching from "Full-width" to "Split" changes the stored `SectionType` from `HERO_BANNER` to `TEXT_IMAGE_HERO`. This is the whole point.

4. **A confirmation dialog is shown when switching away from a variant with content.** If the user has filled in variant-specific fields (e.g., uploaded a background image in Full-width mode) and switches to a variant that does not use those fields, show a confirmation: "Switching layouts will remove your background image. Continue?" If no variant-specific fields have been filled, switch silently.

#### Implementation Detail

The `onChange` callback receives both the variant key and the new `SectionType`. The parent editor is responsible for:

1. Calling `onChange` on the parent `SectionEditorInline` with the new `sectionType` value (this updates the DB type on save)
2. Mapping shared fields from old content to new content shape
3. Resetting variant-specific fields to the new variant's defaults

Each consolidated section editor defines a `VARIANT_CONFIG` constant:

```typescript
const HERO_VARIANT_CONFIG = {
  'full-width': {
    sectionType: 'HERO_BANNER' as SectionType,
    sharedFields: ['heading.line1', 'subheading', 'primaryButton', 'secondaryButton'],
    defaultContent: { backgroundImage: { src: '', alt: '' }, backgroundVideoUrl: '', overline: '' }
  },
  'centered': {
    sectionType: 'PAGE_HERO' as SectionType,
    sharedFields: ['heading.line1', 'primaryButton', 'secondaryButton'],
    defaultContent: { overline: '' }
  },
  // ...
}
```

### Variant Selector in Section Picker

When adding a new section, the section picker shows the 24 parent types. After the user picks a type that has variants (e.g., "Hero"), the variant selector appears inline in the picker as a sub-step before insertion. The default variant is pre-selected (first in the list). The user can change it or accept the default.

After selection, the section is created with the variant's corresponding `SectionType` enum value and its `defaultContent`.

---

## C. Component Reuse Matrix

Shows which shared component is used by which of the 24 proposed section types. Use this to prioritize: components used by 10+ sections should be built first.

### Tier 1: Foundation Primitives

| Component | 1 Hero | 2 Min Hdr | 3 Img&Txt | 4 Quote | 5 CTA | 6 About | 7 Stmt | 8 Gallery | 9 CardGrid | 10 FeatList | 11 AltCont | 12 Welcome | 13 Listing | 14 FeatCont | 15 Events | 16 EvtCal | 17 RecMtg | 18 Team | 19 Location | 20 MinIntro | 21 FAQ | 22 Timeline | 23 Form | 24 Embed | **Total** |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `EditorInput` | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | **24** |
| `EditorTextarea` | Y | Y | Y | Y | Y | Y | - | - | Y | Y | Y | Y | - | - | - | - | - | Y | Y | Y | Y | Y | Y | Y | **17** |
| `EditorField` | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | **24** |
| `EditorToggle` | - | - | - | - | - | - | Y | - | - | - | - | - | - | Y | - | - | - | - | - | - | Y | - | - | - | **3** |
| `EditorSelect` | - | - | - | - | - | - | - | - | - | - | - | - | - | Y | - | - | - | - | Y | - | - | - | - | - | **2** |
| `EditorButtonGroup` | Y | Y | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | Y | - | - | - | - | Y | **4** |
| `TwoColumnGrid` | Y | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | Y | - | - | - | Y | Y | **4** |

### Tier 2: Array/List Primitives

| Component | 1 Hero | 2 Min Hdr | 3 Img&Txt | 4 Quote | 5 CTA | 6 About | 7 Stmt | 8 Gallery | 9 CardGrid | 10 FeatList | 11 AltCont | 12 Welcome | 13 Listing | 14 FeatCont | 15 Events | 16 EvtCal | 17 RecMtg | 18 Team | 19 Location | 20 MinIntro | 21 FAQ | 22 Timeline | 23 Form | 24 Embed | **Total** |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `ArrayField` | - | - | Y | - | - | - | Y | Y | Y | Y | Y | - | - | - | - | Y | - | Y | Y | Y | Y | Y | Y | - | **12** |
| `SocialLinksField` | - | Y | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | **1** |
| `AddressField` | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | Y | - | - | - | - | - | **1** |

### Tier 3: Semantic Primitives

| Component | 1 Hero | 2 Min Hdr | 3 Img&Txt | 4 Quote | 5 CTA | 6 About | 7 Stmt | 8 Gallery | 9 CardGrid | 10 FeatList | 11 AltCont | 12 Welcome | 13 Listing | 14 FeatCont | 15 Events | 16 EvtCal | 17 RecMtg | 18 Team | 19 Location | 20 MinIntro | 21 FAQ | 22 Timeline | 23 Form | 24 Embed | **Total** |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `VariantSelector` | Y | - | - | - | - | - | - | - | Y | - | - | - | - | Y | - | - | Y | - | Y | Y | - | - | - | Y | **7** |
| `EditorSection` | Y | Y | Y | - | Y | - | Y | - | Y | - | Y | - | - | Y | - | Y | - | - | Y | Y | - | - | Y | - | **12** |
| `DataDrivenBanner` | - | - | - | - | - | - | - | - | - | - | - | - | Y | Y | Y | Y | Y | - | - | - | - | - | - | - | **5** |
| `DataSourceSelector` | - | - | - | - | - | - | - | - | - | - | - | - | Y | - | - | - | - | - | - | - | - | - | - | - | **1** |

### Existing Components

| Component | 1 Hero | 2 Min Hdr | 3 Img&Txt | 4 Quote | 5 CTA | 6 About | 7 Stmt | 8 Gallery | 9 CardGrid | 10 FeatList | 11 AltCont | 12 Welcome | 13 Listing | 14 FeatCont | 15 Events | 16 EvtCal | 17 RecMtg | 18 Team | 19 Location | 20 MinIntro | 21 FAQ | 22 Timeline | 23 Form | 24 Embed | **Total** |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `ImagePickerField` | Y | Y | Y | - | Y | Y | - | Y | Y | - | Y | Y | - | - | - | - | - | Y | Y | Y | - | - | - | - | **11** |
| `ButtonConfig` | Y | Y | Y | - | Y | - | - | - | Y | Y | Y | - | - | - | Y | Y | - | - | Y | Y | - | - | - | - | **10** |

### Priority Summary (by usage count)

| Priority | Component | Used By | Status |
|----------|-----------|---------|--------|
| 1 | `EditorField` | 24 sections | Tier 1 — build first |
| 2 | `EditorInput` | 24 sections | Tier 1 — build first |
| 3 | `EditorTextarea` | 17 sections | Tier 1 — build first |
| 4 | `ArrayField` | 12 sections | Tier 2 — build second |
| 5 | `EditorSection` | 12 sections | Tier 3 — build second/third |
| 6 | `ImagePickerField` | 11 sections | Already exists |
| 7 | `ButtonConfig` | 10 sections | Already exists |
| 8 | `VariantSelector` | 7 sections | Tier 3 — NEW, build for consolidation |
| 9 | `DataDrivenBanner` | 5 sections | Tier 3 — build for consolidation |
| 10 | `EditorButtonGroup` | 4 sections | Tier 1 |
| 11 | `TwoColumnGrid` | 4 sections | Tier 1 |
| 12 | `EditorToggle` | 3 sections | Tier 1 |
| 13 | `EditorSelect` | 2 sections | Tier 1 |
| 14 | `DataSourceSelector` | 1 section | Tier 3 — NEW |
| 15 | `SocialLinksField` | 1 section | Tier 2 |
| 16 | `AddressField` | 1 section | Tier 2 |

---

## D. Migration Path Per Section Type

For each consolidation, what changes in the editor code, the section catalog, the section picker, and what does NOT change.

### General Principles (Apply to All Consolidations)

**What NEVER changes:**
- `SectionType` enum in Prisma schema (all 41 values remain)
- Section component files in `components/website/sections/` (all 41 stay)
- Section registry in `components/website/sections/registry.tsx` (same mapping)
- `resolve-section-data.ts` (same data resolution)
- Existing page data in the database (existing `PageSection` rows keep their `SectionType`)
- Public website rendering (zero changes)

**What ALWAYS changes:**
- `section-catalog.ts` — catalog entries updated (labels, categories, grouping)
- Section picker UI — shows consolidated entries with variant sub-selection
- Editor code — gains variant selector and conditional field visibility

---

### D1. Heroes: 5 types to 2 entries

#### What merges: HERO_BANNER + PAGE_HERO + TEXT_IMAGE_HERO + EVENTS_HERO to "Hero"

**Section catalog changes:**
- Remove individual catalog entries for `HERO_BANNER`, `PAGE_HERO`, `TEXT_IMAGE_HERO`, `EVENTS_HERO`
- Add one `HERO` parent entry with `variants` array:
  ```
  { key: 'full-width', sectionType: 'HERO_BANNER', label: 'Full-width background' }
  { key: 'centered', sectionType: 'PAGE_HERO', label: 'Centered' }
  { key: 'split', sectionType: 'TEXT_IMAGE_HERO', label: 'Split' }
  { key: 'simple', sectionType: 'EVENTS_HERO', label: 'Simple' }
  ```
- Each variant retains its own `defaultContent`

**Section picker changes:**
- One "Hero" entry in the picker instead of four
- After selecting "Hero," a `VariantSelector` appears inline showing four layout cards
- User picks a variant; the section is created with that variant's `SectionType`

**Editor code changes:**
- `hero-editor.tsx`: The four sub-editors (`HeroBannerEditor`, `PageHeroEditor`, `TextImageHeroEditor`, `EventsHeroEditor`) merge into a single `HeroEditor` component
- `HeroEditor` renders a `VariantSelector` at the top
- Based on the current variant (derived from `sectionType` prop), it conditionally shows/hides fields
- All shared field logic (heading, buttons) is written once; variant-specific blocks are wrapped in conditionals
- The `sectionType` prop determines which variant is active; if the user changes the variant, the editor calls `onSectionTypeChange(newSectionType)` to update the DB type

**What does NOT change:**
- `MINISTRY_HERO` stays as its own entry ("Ministry Header")
- The four hero components render exactly as before
- The registry mapping is unchanged

#### What stays: MINISTRY_HERO as "Ministry Header"

**Catalog changes:** Rename label from "Ministry Hero" to "Ministry Header." Move to "Hero" category.
**Editor changes:** Add `SocialLinksField` (gap fill from gap analysis). No structural change.
**Picker changes:** Appears as second entry under "Hero" category.

---

### D2. Content: No consolidation, just rename + recategorize

**MEDIA_TEXT** to "Image & Text": Label change in catalog. Add image array to editor (gap fill).
**QUOTE_BANNER** to "Quote": Label change only.
**CTA_BANNER** to "Call to Action": Label change only.
**ABOUT_DESCRIPTION** to "About": Label change only.
**STATEMENT**: No change.
**PHOTO_GALLERY**: Move from "Layout" category to "Content" category. No editor changes.
**SPOTLIGHT_MEDIA**: Moves to Dynamic Content category as part of "Featured Content" (see D4).

---

### D3. Cards: 6 types to 4 entries

#### What merges: ACTION_CARD_GRID + PATHWAY_CARD to "Card Grid"

**Section catalog changes:**
- Remove individual entries for `ACTION_CARD_GRID`, `PATHWAY_CARD`
- Add one `CARD_GRID` parent entry with variants:
  ```
  { key: 'image-cards', sectionType: 'ACTION_CARD_GRID', label: 'Image cards' }
  { key: 'icon-cards', sectionType: 'PATHWAY_CARD', label: 'Icon cards' }
  ```

**Section picker changes:**
- One "Card Grid" entry in the picker instead of two
- Variant selector shows "Image cards" vs "Icon cards" with preview thumbnails

**Editor code changes:**
- `cards-editor.tsx`: Merge `ActionCardGridEditor` and `PathwayCardEditor` into a single `CardGridEditor`
- Shared heading + CTA fields rendered once
- The cards array `renderItem` callback changes based on variant (image card sub-form vs icon card sub-form)
- Switching variants resets the cards array to default (since the per-card fields are structurally different)

**Edge case:** The per-card fields are structurally different between the two variants (image cards have `image` + `link`; icon cards have `iconKey` + `buttonLabel` + `buttonLink`). When switching variants, the cards array must reset because the item shapes are incompatible. Show confirmation: "Switching styles will reset your cards. Continue?"

#### What stays standalone:
- **FEATURE_BREAKDOWN** to "Feature List": Rename only. Fix hardcoded watermark (code change).
- **PILLARS** to "Alternating Content": Rename. Add nested image arrays per pillar (gap fill).
- **NEWCOMER** to "Welcome Banner": Rename only.

---

### D4. Dynamic Content: 8 types to 5 entries

#### What merges: ALL_MESSAGES + ALL_EVENTS + ALL_BIBLE_STUDIES + ALL_VIDEOS to "Content Listing"

**Section catalog changes:**
- Remove four individual entries
- Add one `CONTENT_LISTING` parent entry with data-source variants:
  ```
  { key: 'messages', sectionType: 'ALL_MESSAGES', label: 'Messages' }
  { key: 'events', sectionType: 'ALL_EVENTS', label: 'Events' }
  { key: 'bible-studies', sectionType: 'ALL_BIBLE_STUDIES', label: 'Bible Studies' }
  { key: 'videos', sectionType: 'ALL_VIDEOS', label: 'Videos' }
  ```

**Section picker changes:**
- One "Content Listing" entry instead of four
- After selection, a `DataSourceSelector` dropdown appears (or inline in the variant step)
- User picks the data source; the section is created with the corresponding `SectionType`

**Editor code changes:**
- `data-section-editor.tsx`: The four identical editors (each just a heading field) collapse into one
- A `DataSourceSelector` dropdown at the top lets the user switch data sources
- Switching data sources changes the `SectionType` and clears the heading to its default

**What does NOT change:**
- The four section components (`all-messages.tsx`, `all-events.tsx`, etc.) remain separate
- `resolve-section-data.ts` still routes by `SectionType` to the correct data source
- The registry still maps each `SectionType` to its component

#### What merges: SPOTLIGHT_MEDIA + HIGHLIGHT_CARDS + MEDIA_GRID to "Featured Content"

**Section catalog changes:**
- Remove three individual entries
- Add one `FEATURED_CONTENT` parent entry with variants:
  ```
  { key: 'spotlight', sectionType: 'SPOTLIGHT_MEDIA', label: 'Spotlight' }
  { key: 'highlight-cards', sectionType: 'HIGHLIGHT_CARDS', label: 'Highlight cards' }
  { key: 'video-grid', sectionType: 'MEDIA_GRID', label: 'Video grid' }
  ```

**Editor code changes:**
- Merge `SpotlightMediaEditor` (from `content-editor.tsx`), `HighlightCardsEditor` (from `cards-editor.tsx`), and `MediaGridEditor` (from `data-section-editor.tsx`) into one `FeaturedContentEditor`
- The Spotlight variant: remove manual sermon fields (per gap analysis), show only heading + `DataDrivenBanner`
- The Highlight cards variant: show heading + CTA + filter controls (already built)
- The Video grid variant: show heading + CTA

**Edge case: HIGHLIGHT_CARDS content mapping.** The Highlight cards variant has filter controls (number of events, sort order, show past, etc.) that don't exist on Spotlight or Video grid. When switching FROM Highlight cards TO another variant, these fields are simply dropped (they're stored in the section content JSON but ignored by the other components). When switching TO Highlight cards, the filter fields get default values. The heading and CTA label/link carry over.

#### What merges: RECURRING_MEETINGS + QUICK_LINKS to "Recurring Meetings"

**Section catalog changes:**
- Remove two individual entries
- Add one parent entry with variants:
  ```
  { key: 'list', sectionType: 'RECURRING_MEETINGS', label: 'List' }
  { key: 'carousel', sectionType: 'QUICK_LINKS', label: 'Carousel' }
  ```

**Editor code changes:**
- Merge the two sub-editors in `data-section-editor.tsx`
- Shared: heading field
- List variant: max visible, view all link
- Carousel variant: subtitle

---

### D5. People & Places: 6 types to 3 entries

#### What merges: LOCATION_DETAIL + MINISTRY_SCHEDULE + CAMPUS_CARD_GRID + RECURRING_SCHEDULE to "Location"

**Section catalog changes:**
- Remove four individual entries
- Add one parent entry with four variants:
  ```
  { key: 'detail', sectionType: 'LOCATION_DETAIL', label: 'Detail' }
  { key: 'schedule', sectionType: 'MINISTRY_SCHEDULE', label: 'Schedule' }
  { key: 'card-grid', sectionType: 'CAMPUS_CARD_GRID', label: 'Card grid' }
  { key: 'weekly', sectionType: 'RECURRING_SCHEDULE', label: 'Weekly schedule' }
  ```

**Editor code changes:**
- This is the most complex consolidation. Merge parts of `ministry-editor.tsx` (LOCATION_DETAIL, MINISTRY_SCHEDULE, CAMPUS_CARD_GRID) and `schedule-editor.tsx` (RECURRING_SCHEDULE) into a single `LocationEditor`
- The variant selector conditionally shows/hides large blocks of the form
- Each variant has mostly unique fields (see the variant field visibility table in Section A.19)
- Gap fills needed: timeValue, address, directions URL, image for MINISTRY_SCHEDULE; ctaHeading + CTA for CAMPUS_CARD_GRID; time label + images for LOCATION_DETAIL

**Edge case:** The four variants have very different content shapes. Switching between them resets almost all fields. The only shared field is heading/overline (and even that varies). Show a clear confirmation when switching.

**What to watch for:** The RECURRING_SCHEDULE variant has a meetings array with 7-day toggle buttons per meeting. This is the most complex array sub-form in the system. It currently lives in `schedule-editor.tsx` and uses a custom day selector component. Make sure the day selector works inside `ArrayField`.

#### What merges: MINISTRY_INTRO + DIRECTORY_LIST to "Ministry Intro"

**Section catalog changes:**
- Remove two individual entries
- Add one parent entry with variants:
  ```
  { key: 'single', sectionType: 'MINISTRY_INTRO', label: 'Single' }
  { key: 'directory', sectionType: 'DIRECTORY_LIST', label: 'Directory' }
  ```

**Editor code changes:**
- Merge two sub-editors in `ministry-editor.tsx`
- Shared: heading
- Single variant: overline, description, side image
- Directory variant: items array, background image, CTA heading, CTA button

---

### D6. Interactive: 3 types to 3 entries (no merge, recategorize)

- **FAQ_SECTION** to "FAQ": Rename. Move to "Utility" category. No editor changes.
- **TIMELINE_SECTION** to "Timeline": Rename. Move to "Utility" category. No editor changes.
- **FORM_SECTION** to "Contact Form": Rename. Move to "Utility" category. No editor changes.

---

### D7. Custom: 2 types to 1 entry

#### What merges: CUSTOM_HTML + CUSTOM_EMBED to "Custom Embed"

**Section catalog changes:**
- Remove two entries
- Add one parent entry with variants:
  ```
  { key: 'html', sectionType: 'CUSTOM_HTML', label: 'HTML' }
  { key: 'url', sectionType: 'CUSTOM_EMBED', label: 'URL' }
  ```

**Editor code changes:**
- `custom-editor.tsx` already has both sub-editors. Add a `VariantSelector` (tab-style) at the top.
- HTML mode: monospace textarea + warning banner
- URL mode: embed URL + title + aspect ratio selector

**Edge case:** Content is completely incompatible between HTML mode (single `html` string) and URL mode (`url` + `title` + `aspectRatio`). Switching modes resets all content. Show confirmation if content is non-empty.

---

## E. New Components Needed

Beyond the components already planned in `worklog/editor-component-system-plan.md`, the consolidation requires these additional components.

### E1. VariantSelector

**Already identified** in Tier 3 of the component plan, but needs expanded specification for the consolidation.

```typescript
interface VariantOption {
  value: string
  sectionType: SectionType
  label: string
  description?: string
  thumbnail?: string         // URL to preview image
}

interface VariantSelectorProps {
  label?: string             // defaults to "Layout"
  value: string              // current variant key
  onChange: (variant: string, sectionType: SectionType) => void
  options: VariantOption[]
  size?: "default" | "compact"
}
```

**Behavior:**
- Card mode (default): 2-4 cards in a grid, each with thumbnail + label + description
- Compact mode: Segmented control (for 2-option cases like Custom Embed)
- Selected card gets `ring-2 ring-primary` border
- Change triggers `onChange` with both the variant key and the target `SectionType`
- Parent editor is responsible for content migration (shared fields carry, variant-specific reset)

**Where used:** Hero (4 variants), Card Grid (2), Featured Content (3), Recurring Meetings (2), Location (4), Ministry Intro (2), Custom Embed (2) = **7 section editors**

---

### E2. EditorSection

**Already identified** in Tier 3 of the component plan. Expanded spec:

```typescript
interface EditorSectionProps {
  title: string
  defaultOpen?: boolean      // defaults to true
  count?: number             // shows badge, e.g., "Images (3)"
  children: React.ReactNode
}
```

**Behavior:**
- Renders a collapsible group with a chevron toggle
- Title in `text-sm font-medium`
- Optional count badge: `text-xs bg-muted px-1.5 py-0.5 rounded`
- Collapsed state hides children with height animation
- Uses Radix `Collapsible` under the hood

**Where used:** Every editor with more than 5 fields benefits from grouping into Content / Buttons / Background / Images / etc. See individual section specs above.

---

### E3. DataSourceSelector

**New component** not in the current plan.

```typescript
interface DataSourceSelectorProps {
  label?: string             // defaults to "Data Source"
  value: string              // current data source key
  onChange: (source: string, sectionType: SectionType) => void
  options: Array<{
    value: string
    sectionType: SectionType
    label: string
    description: string
    icon: React.ReactNode    // lucide icon for the content type
  }>
}
```

**Behavior:**
- Renders as an `EditorSelect` dropdown with icons and descriptions
- Each option shows an icon (MessageSquare for messages, Calendar for events, BookOpen for studies, Video for videos)
- Changing the data source calls `onChange` with the new source key and target `SectionType`
- The parent editor updates the stored `SectionType` accordingly

**Default options for Content Listing:**
```
Messages    (MessageSquare)  "Searchable sermon grid"
Events      (Calendar)       "Event listing with filters"
Bible Studies (BookOpen)     "Bible study grid"
Videos      (Video)          "Video grid with playback"
```

**Where used:** Content Listing (section #13) only. But separating it as a component keeps the editor clean and makes the pattern reusable if future data-driven sections need it.

---

### E4. VariantAwareEditor (Higher-Order Pattern)

Not a component per se, but a **pattern** that each consolidated editor should follow. Document it here so developers implement it consistently.

```typescript
// Pattern for a consolidated editor with variants
function ConsolidatedSectionEditor({
  sectionType,
  content,
  onChange,
  onSectionTypeChange,
}: {
  sectionType: SectionType
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
  onSectionTypeChange: (newType: SectionType) => void
}) {
  // 1. Derive current variant from sectionType
  const currentVariant = VARIANT_CONFIG.find(v => v.sectionType === sectionType)

  // 2. Handle variant change with content migration
  function handleVariantChange(newVariantKey: string, newSectionType: SectionType) {
    const newVariant = VARIANT_CONFIG.find(v => v.key === newVariantKey)
    const migratedContent = migrateContent(content, currentVariant, newVariant)
    onChange(migratedContent)
    onSectionTypeChange(newSectionType)
  }

  // 3. Render variant selector + conditional fields
  return (
    <>
      <VariantSelector value={currentVariant.key} onChange={handleVariantChange} options={...} />
      {/* Shared fields */}
      <EditorInput label="Heading" value={...} onChange={...} />
      {/* Variant-specific fields */}
      {currentVariant.key === 'full-width' && (
        <EditorSection title="Background">
          <ImagePickerField ... />
        </EditorSection>
      )}
    </>
  )
}
```

**Key requirement:** The editor routing system (`section-editors/index.tsx`) must pass `onSectionTypeChange` as a new prop to editors. Currently editors only receive `content` and `onChange`. The `SectionEditorInline` in `builder-right-drawer.tsx` must handle `onSectionTypeChange` by updating the section's `sectionType` in the `sections` array state.

---

### E5. ContentMigrationHelper (Utility)

A utility function (not a component) that handles content transfer when switching variants.

```typescript
interface VariantDef {
  key: string
  sectionType: SectionType
  sharedFields: string[]      // dot-path field names shared across variants
  defaultContent: Record<string, unknown>
}

function migrateContent(
  currentContent: Record<string, unknown>,
  fromVariant: VariantDef,
  toVariant: VariantDef
): Record<string, unknown> {
  // Start with the target variant's default content
  const newContent = { ...toVariant.defaultContent }

  // Copy over shared fields from current content
  for (const fieldPath of toVariant.sharedFields) {
    const value = getNestedValue(currentContent, fieldPath)
    if (value !== undefined) {
      setNestedValue(newContent, fieldPath, value)
    }
  }

  return newContent
}
```

**Where used:** Every consolidated editor calls this when the variant changes. Keeps the content migration logic consistent and testable.

---

### E6. Summary of New vs Existing

| Component | Status | Tier | Blocking |
|-----------|--------|------|----------|
| `EditorField` | Planned (Tier 1) | Foundation | Phase A of component plan |
| `EditorInput` | Planned (Tier 1) | Foundation | Phase A |
| `EditorTextarea` | Planned (Tier 1) | Foundation | Phase A |
| `EditorToggle` | Planned (Tier 1) | Foundation | Phase A |
| `EditorSelect` | Planned (Tier 1) | Foundation | Phase A |
| `EditorButtonGroup` | Planned (Tier 1) | Foundation | Phase A |
| `TwoColumnGrid` | Planned (Tier 1) | Foundation | Phase A |
| `ArrayField` | Planned (Tier 2) | Array | Phase B |
| `SocialLinksField` | Planned (Tier 2) | Array | Phase B |
| `AddressField` | Planned (Tier 2) | Array | Phase B |
| `DataDrivenBanner` | Planned (Tier 3) | Semantic | Phase C |
| `ImagePickerField` | **Exists** | - | Already in `shared.tsx` |
| `ButtonConfig` | **Exists** | - | Already in `shared.tsx` |
| `VariantSelector` | **NEW** (expanded from Tier 3 stub) | Consolidation | Blocks all consolidation |
| `EditorSection` | **NEW** (expanded from Tier 3 stub) | Consolidation | Blocks editor cleanup |
| `DataSourceSelector` | **NEW** | Consolidation | Blocks Content Listing consolidation |
| `ContentMigrationHelper` | **NEW** (utility) | Consolidation | Blocks variant switching |

### Build Order for Consolidation

```
Phase A: Tier 1 primitives (already planned)
Phase B: Tier 2 array primitives (already planned)
Phase C: Tier 3 semantics (already planned, but expand VariantSelector + EditorSection)
Phase D: Consolidation-specific components
  D.1: ContentMigrationHelper utility
  D.2: VariantSelector (full implementation with card + compact modes)
  D.3: DataSourceSelector
  D.4: Update SectionEditorInline to pass onSectionTypeChange prop
  D.5: Update section-editors/index.tsx to support variant-based routing
Phase E: Consolidate editors (one at a time)
  E.1: Custom Embed (simplest — 2 variants, incompatible content = full reset)
  E.2: Content Listing (simplest real — 4 identical editors to 1)
  E.3: Recurring Meetings (2 variants, small editors)
  E.4: Card Grid (2 variants, cards array changes per variant)
  E.5: Ministry Intro (2 variants, moderate complexity)
  E.6: Featured Content (3 variants, filter controls on one variant)
  E.7: Hero (4 variants, most fields, most shared)
  E.8: Location (4 variants, most complex — different content shapes)
Phase F: Update section picker to show 24 entries with variant sub-selection
```

---

## Appendix: Old-to-New Type Mapping Quick Reference

| # | Proposed Name | Category | Old Type(s) | Has Variants | Variant Selector Type |
|---|---|---|---|---|---|
| 1 | Hero | Hero | HERO_BANNER, PAGE_HERO, TEXT_IMAGE_HERO, EVENTS_HERO | Yes (4) | Card |
| 2 | Ministry Header | Hero | MINISTRY_HERO | No | - |
| 3 | Image & Text | Content | MEDIA_TEXT | No | - |
| 4 | Quote | Content | QUOTE_BANNER | No | - |
| 5 | Call to Action | Content | CTA_BANNER | No | - |
| 6 | About | Content | ABOUT_DESCRIPTION | No | - |
| 7 | Statement | Content | STATEMENT | No | - |
| 8 | Photo Gallery | Content | PHOTO_GALLERY | No | - |
| 9 | Card Grid | Cards | ACTION_CARD_GRID, PATHWAY_CARD | Yes (2) | Card |
| 10 | Feature List | Cards | FEATURE_BREAKDOWN | No | - |
| 11 | Alternating Content | Cards | PILLARS | No | - |
| 12 | Welcome Banner | Cards | NEWCOMER | No | - |
| 13 | Content Listing | Dynamic Content | ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS | Yes (4) | DataSourceSelector |
| 14 | Featured Content | Dynamic Content | SPOTLIGHT_MEDIA, HIGHLIGHT_CARDS, MEDIA_GRID | Yes (3) | Card |
| 15 | Upcoming Events | Dynamic Content | UPCOMING_EVENTS | No | - |
| 16 | Event Calendar | Dynamic Content | EVENT_CALENDAR | No | - |
| 17 | Recurring Meetings | Dynamic Content | RECURRING_MEETINGS, QUICK_LINKS | Yes (2) | Card |
| 18 | Team | People & Places | MEET_TEAM | No | - |
| 19 | Location | People & Places | LOCATION_DETAIL, MINISTRY_SCHEDULE, CAMPUS_CARD_GRID, RECURRING_SCHEDULE | Yes (4) | Card |
| 20 | Ministry Intro | People & Places | MINISTRY_INTRO, DIRECTORY_LIST | Yes (2) | Card |
| 21 | FAQ | Utility | FAQ_SECTION | No | - |
| 22 | Timeline | Utility | TIMELINE_SECTION | No | - |
| 23 | Contact Form | Utility | FORM_SECTION | No | - |
| 24 | Custom Embed | Embed | CUSTOM_HTML, CUSTOM_EMBED | Yes (2) | Compact (tab) |
