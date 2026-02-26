# Section Catalog Reference

> Generated 2026-02-25. Source of truth: `components/cms/website/builder/section-catalog.ts` and the editor files in `components/cms/website/builder/section-editors/`.

---

## Overview

| Metric | Value |
|---|---|
| **Total section types in catalog** | 41 |
| **Total section types in registry** | 42 (includes `NAVBAR`, handled by layout -- not in builder catalog) |
| **Categories** | 8 |
| **Data-driven sections** | 10 (content populated from CMS database; `isDataDriven: true` in catalog) |
| **Static sections** | 31 (content defined in section JSON) |
| **Sections with structured editors** | 41 (all catalog types have dedicated editors; no type falls through to JSON-only) |
| **Editor files** | 13 (`hero-editor`, `content-editor`, `cards-editor`, `data-section-editor`, `ministry-editor`, `faq-editor`, `timeline-editor`, `form-editor`, `footer-editor`, `photo-gallery-editor`, `schedule-editor`, `custom-editor`, `json-editor` fallback) |
| **Page templates** | 9 (+ Blank Page option) |

---

## Shared Display Settings

Every section exposes the following display settings via `DisplaySettings` (`display-settings.tsx`). These are stored on the `PageSection` database record, not in the `content` JSON.

| Setting | Field | Type | Options | Default |
|---|---|---|---|---|
| **Color Scheme** | `colorScheme` | `string` (radio) | `LIGHT`, `DARK` | `LIGHT` |
| **Vertical Padding** | `paddingY` | `string` (select) | `NONE`, `COMPACT`, `DEFAULT`, `SPACIOUS` | `DEFAULT` |
| **Container Width** | `containerWidth` | `string` (select) | `NARROW`, `STANDARD`, `FULL` | `STANDARD` |
| **Animations** | `enableAnimations` | `boolean` (switch) | on/off | `true` |
| **Visible** | `visible` | `boolean` (switch) | on/off (hidden sections only visible in builder) | `true` |
| **Section Label** | `label` | `string` (input) | Free text, admin-only (not shown on website) | `""` |

---

## Section Types by Category

### Heroes (5 types)

#### HERO_BANNER
- **Label:** Hero Banner
- **Description:** Full-screen banner with heading, subheading, background image or video, and CTA buttons.
- **Icon:** `Image`
- **Data-driven:** No
- **Editor:** `hero-editor.tsx` -> `HeroBannerEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading.line1` | `string` | First line of the heading |
| `heading.line2` | `string` | Second line (accent) |
| `subheading` | `string` (textarea) | Subheading text |
| `backgroundImage.src` | `string` | Background image URL |
| `backgroundImage.alt` | `string` | Alt text for the background image |
| `backgroundImage.objectPosition` | `string` | CSS object-position value (e.g., `center center`) |
| `primaryButton.label` | `string` | Primary button text |
| `primaryButton.href` | `string` | Primary button link URL |
| `primaryButton.visible` | `boolean` | Show/hide primary button |
| `secondaryButton.label` | `string` | Secondary button text |
| `secondaryButton.href` | `string` | Secondary button link URL |
| `secondaryButton.visible` | `boolean` | Show/hide secondary button |

- **Default Content:**
```json
{
  "heading": { "line1": "Welcome", "line2": "to Our Church" },
  "subheading": "A place where faith meets community.",
  "primaryButton": { "label": "Learn More", "href": "/about", "visible": true },
  "secondaryButton": { "label": "Visit Us", "href": "/visit", "visible": true },
  "backgroundImage": { "src": "", "alt": "Hero background" }
}
```

---

#### PAGE_HERO
- **Label:** Page Hero
- **Description:** Centered hero with overline label, heading, CTA buttons, and floating orbit images.
- **Icon:** `Sparkles`
- **Data-driven:** No
- **Editor:** `hero-editor.tsx` -> `PageHeroEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label above heading |
| `heading` | `string` | Main heading text |
| `primaryButton.label` | `string` | Primary button text |
| `primaryButton.href` | `string` | Primary button link URL |
| `primaryButton.visible` | `boolean` | Show/hide primary button |
| `secondaryButton.label` | `string` | Secondary button text |
| `secondaryButton.href` | `string` | Secondary button link URL |
| `secondaryButton.visible` | `boolean` | Show/hide secondary button |
| `floatingImages` | `array` | Floating orbit images (JSON-only; no visual editor yet) |

- **Default Content:**
```json
{
  "overline": "Welcome",
  "heading": "Your Heading Here",
  "primaryButton": { "label": "Get Started", "href": "#", "visible": true },
  "secondaryButton": { "label": "Learn More", "href": "#", "visible": false },
  "floatingImages": []
}
```

---

#### TEXT_IMAGE_HERO
- **Label:** Text & Image Hero
- **Description:** Split layout hero with overline, heading, description text, and a wide image below.
- **Icon:** `SplitSquareHorizontal`
- **Data-driven:** No
- **Editor:** `hero-editor.tsx` -> `TextImageHeroEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label |
| `headingLine1` | `string` | Primary heading line |
| `headingAccent` | `string` | Accent heading line (optional) |
| `description` | `string` (textarea) | Description paragraph |
| `textAlign` | `"left" \| "center" \| "right"` | Text alignment (toggle buttons) |
| `image.src` | `string` | Hero image URL |
| `image.alt` | `string` | Alt text |
| `image.objectPosition` | `string` | CSS object-position |

- **Default Content:**
```json
{
  "overline": "Section Label",
  "headingLine1": "Your Heading",
  "headingAccent": "",
  "description": "Add a description to introduce your page or section.",
  "image": { "src": "", "alt": "Hero image" },
  "textAlign": "left"
}
```

---

#### EVENTS_HERO
- **Label:** Events Hero
- **Description:** Simple hero with heading and subtitle, designed for event listing pages.
- **Icon:** `Calendar`
- **Data-driven:** No
- **Editor:** `hero-editor.tsx` -> `EventsHeroEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Heading text |
| `subtitle` | `string` (textarea) | Subtitle text |

- **Default Content:**
```json
{
  "heading": "Events",
  "subtitle": "Find out what's happening in our community."
}
```

---

#### MINISTRY_HERO
- **Label:** Ministry Hero
- **Description:** Centered hero with overline, heading, CTA button, social links, and optional banner image.
- **Icon:** `Heart`
- **Data-driven:** No
- **Editor:** `hero-editor.tsx` -> `MinistryHeroEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label (ministry name) |
| `heading` | `string` (textarea) | Main heading (supports newlines) |
| `headingStyle` | `"display" \| "sans"` | Heading font style (toggle buttons) |
| `ctaButton.label` | `string` | CTA button text |
| `ctaButton.href` | `string` | CTA button link URL |
| `ctaButton.visible` | `boolean` | Show/hide CTA button |
| `heroImage.src` | `string` | Banner image URL |
| `heroImage.alt` | `string` | Alt text |
| `heroImage.objectPosition` | `string` | CSS object-position |
| `socialLinks` | `array` | Social links (JSON-only; no visual editor yet) |

- **Default Content:**
```json
{
  "overline": "Ministry Name",
  "heading": "Welcome to Our Ministry",
  "headingStyle": "display",
  "ctaButton": { "label": "Join Us", "href": "#", "visible": true },
  "socialLinks": [],
  "heroImage": { "src": "", "alt": "Ministry banner" }
}
```

---

### Content (8 types)

#### MEDIA_TEXT
- **Label:** Media & Text
- **Description:** Two-column layout with rotating image carousel and text content with overline, heading, body, and CTA.
- **Icon:** `Columns2`
- **Data-driven:** No
- **Editor:** `content-editor.tsx` -> `MediaTextEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label |
| `heading` | `string` | Section heading |
| `body` | `string` (textarea) | Body text |
| `button.label` | `string` | CTA button text |
| `button.href` | `string` | CTA button link |
| `button.visible` | `boolean` | Show/hide button |
| `images` | `array` | Rotating images (JSON-only; no visual editor yet) |

- **Default Content:**
```json
{
  "overline": "Section Label",
  "heading": "Your Heading Here",
  "body": "Add descriptive text about your content here.",
  "button": { "label": "Learn More", "href": "#", "visible": true },
  "images": []
}
```

---

#### MEDIA_GRID
- **Label:** Media Grid
- **Description:** Grid of video thumbnails with heading and optional CTA link. Supports video modal playback.
- **Icon:** `Grid3x3`
- **Data-driven:** Yes (Videos from CMS Media module)
- **Editor:** `data-section-editor.tsx` -> `SimpleDataEditor` (heading + CTA label/href)
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `ctaLabel` | `string` | CTA link label (optional) |
| `ctaHref` | `string` | CTA link URL (optional) |
| `dataSource` | `string` | Data source identifier |
| `count` | `number` | Number of videos to display |
| `videos` | `array` | Pre-populated video data (from CMS) |

- **Default Content:**
```json
{
  "heading": "Latest Videos",
  "ctaLabel": "View All",
  "ctaHref": "/videos",
  "dataSource": "latest-videos",
  "count": 3,
  "videos": []
}
```

---

#### SPOTLIGHT_MEDIA
- **Label:** Spotlight Media
- **Description:** Featured spotlight for a single sermon or media item with large video thumbnail.
- **Icon:** `PlayCircle`
- **Data-driven:** Yes (Latest sermon from CMS Messages module)
- **Editor:** `content-editor.tsx` -> `SpotlightMediaEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `sectionHeading` | `string` | Section heading (e.g., "Latest Message") |
| `dataSource` | `string` | Data source identifier |
| `sermon.title` | `string` | Sermon title |
| `sermon.speaker` | `string` | Speaker name |
| `sermon.date` | `string` | Date string |
| `sermon.series` | `string` | Series name |
| `sermon.slug` | `string` | Sermon URL slug |
| `sermon.thumbnailUrl` | `string \| null` | Thumbnail image URL |
| `sermon.videoUrl` | `string` | Video URL |

- **Default Content:**
```json
{
  "sectionHeading": "Latest Message",
  "dataSource": "latest-message",
  "sermon": {
    "title": "Message Title",
    "speaker": "Speaker Name",
    "date": "January 1, 2026",
    "series": "Series Name",
    "thumbnailUrl": null,
    "videoUrl": ""
  }
}
```

---

#### PHOTO_GALLERY
- **Label:** Photo Gallery
- **Description:** Infinite horizontal scrolling photo carousel with heading. Auto-scrolls and pauses on hover.
- **Icon:** `GalleryHorizontalEnd`
- **Data-driven:** No
- **Editor:** `photo-gallery-editor.tsx` -> `PhotoGalleryEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Gallery heading |
| `images` | `array` of `{ src, alt, objectPosition? }` | Gallery images (add/remove/reorder with move up/down) |

Each image item:

| Sub-field | Type | Description |
|---|---|---|
| `src` | `string` | Image URL |
| `alt` | `string` | Alt text |
| `objectPosition` | `string` (optional) | CSS object-position |

- **Default Content:**
```json
{
  "heading": "Gallery",
  "images": []
}
```

---

#### QUOTE_BANNER
- **Label:** Quote Banner
- **Description:** Dark-themed banner with overline, script heading, verse text, and reference attribution.
- **Icon:** `Quote`
- **Data-driven:** No
- **Editor:** `content-editor.tsx` -> `QuoteBannerEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label |
| `heading` | `string` | Section heading |
| `verse.text` | `string` (textarea) | Quote or verse text |
| `verse.reference` | `string` | Attribution/reference (e.g., "John 15:5") |

- **Default Content:**
```json
{
  "overline": "Scripture",
  "heading": "Verse of the Week",
  "verse": {
    "text": "Add your quote or verse text here.",
    "reference": "Book Chapter:Verse"
  }
}
```

---

#### CTA_BANNER
- **Label:** Call to Action
- **Description:** Dark full-width banner with overline, heading, body text, and primary/secondary CTA buttons.
- **Icon:** `Megaphone`
- **Data-driven:** No
- **Editor:** `content-editor.tsx` -> `CTABannerEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label |
| `heading` | `string` | Heading text |
| `body` | `string` (textarea) | Body/description text |
| `backgroundImage` | `{ src, alt } \| null` | Optional background image URL |
| `primaryButton.label` | `string` | Primary button text |
| `primaryButton.href` | `string` | Primary button link |
| `primaryButton.visible` | `boolean` | Show/hide primary button |
| `secondaryButton.label` | `string` | Secondary button text |
| `secondaryButton.href` | `string` | Secondary button link |
| `secondaryButton.visible` | `boolean` | Show/hide secondary button |

- **Default Content:**
```json
{
  "overline": "Get Involved",
  "heading": "Ready to Take the Next Step?",
  "body": "Join us and become part of our growing community.",
  "primaryButton": { "label": "Get Started", "href": "#", "visible": true },
  "secondaryButton": { "label": "Learn More", "href": "#", "visible": false },
  "backgroundImage": null
}
```

---

#### ABOUT_DESCRIPTION
- **Label:** About Description
- **Description:** Centered layout with logo, heading, description text, and optional video embed.
- **Icon:** `Info`
- **Data-driven:** No
- **Editor:** `content-editor.tsx` -> `AboutDescriptionEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `logoSrc` | `string` | Logo image URL |
| `heading` | `string` | Heading text |
| `description` | `string` (textarea) | Description text |
| `videoUrl` | `string` | YouTube/embed URL (optional) |
| `videoTitle` | `string` | Accessibility title for embed |

- **Default Content:**
```json
{
  "logoSrc": "",
  "heading": "About Us",
  "description": "Add a description about your organization here.",
  "videoUrl": "",
  "videoTitle": ""
}
```

---

#### STATEMENT
- **Label:** Statement
- **Description:** Two-column scroll-tracked layout with a sticky lead-in and paragraphs that highlight on scroll.
- **Icon:** `AlignLeft`
- **Data-driven:** No
- **Editor:** `content-editor.tsx` -> `StatementEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label |
| `heading` | `string` | Section heading |
| `leadIn` | `string` | Sticky left-column text |
| `showIcon` | `boolean` (switch) | Display cross icon |
| `paragraphs` | `array` of `{ text, isBold? }` | Paragraph items (add/remove) |

Each paragraph item:

| Sub-field | Type | Description |
|---|---|---|
| `text` | `string` (textarea) | Paragraph text |
| `isBold` | `boolean` (optional) | Bold formatting |

- **Default Content:**
```json
{
  "overline": "Our Mission",
  "heading": "What We Believe",
  "leadIn": "Our Vision",
  "showIcon": false,
  "paragraphs": [
    { "text": "Add your first statement or value here.", "isBold": false },
    { "text": "Add your second statement or value here.", "isBold": false }
  ]
}
```

---

### Cards & Grids (6 types)

#### ACTION_CARD_GRID
- **Label:** Action Card Grid
- **Description:** Left-aligned heading with a 2x2 grid of image cards, each with title, description, and link.
- **Icon:** `LayoutGrid`
- **Data-driven:** No
- **Editor:** `cards-editor.tsx` -> `ActionCardGridEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading.line1` | `string` | Heading line 1 |
| `heading.line2` | `string` | Heading line 2 (italic) |
| `heading.line3` | `string` | Heading line 3 |
| `subheading` | `string` | Subheading text |
| `ctaButton.label` | `string` | CTA button label |
| `ctaButton.href` | `string` | CTA button link |
| `cards` | `array` of card items | Card list (add/remove) |

Each card item:

| Sub-field | Type | Description |
|---|---|---|
| `id` | `string` | Unique card identifier |
| `title` | `string` | Card title |
| `description` | `string` (textarea) | Card description |
| `imageUrl` | `string` | Card image URL |
| `href` | `string` | Card link URL |

- **Default Content:**
```json
{
  "heading": { "line1": "Get", "line2": "Involved", "line3": "Today" },
  "subheading": "Explore the ways you can connect and grow.",
  "ctaButton": { "label": "See All", "href": "#" },
  "cards": []
}
```

---

#### HIGHLIGHT_CARDS
- **Label:** Highlight Cards
- **Description:** Featured event cards in a 1 large + 2 small stacked layout with heading and CTA.
- **Icon:** `Star`
- **Data-driven:** Yes (Featured events from CMS Events module)
- **Editor:** `cards-editor.tsx` -> `HighlightCardsEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `subheading` | `string` | Subheading text |
| `ctaLabel` | `string` | CTA link label |
| `ctaHref` | `string` | CTA link URL |
| `dataSource` | `string` | Data source identifier |
| `featuredEvents` | `array` | Featured events (populated from CMS; JSON-only for manual override) |

- **Default Content:**
```json
{
  "heading": "Upcoming Highlights",
  "subheading": "",
  "ctaLabel": "View All Events",
  "ctaHref": "/events",
  "dataSource": "featured-events",
  "featuredEvents": []
}
```

---

#### FEATURE_BREAKDOWN
- **Label:** Feature Breakdown
- **Description:** Acronym-style breakdown with large first-letter highlights, description text, and CTA button.
- **Icon:** `ListOrdered`
- **Data-driven:** No
- **Editor:** `cards-editor.tsx` -> `FeatureBreakdownEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `description` | `string` (textarea) | Description text |
| `acronymLines` | `array` of `string` | Acronym lines (add/remove; first letter of each line is highlighted) |
| `button.label` | `string` | CTA button text |
| `button.href` | `string` | CTA button link |
| `button.visible` | `boolean` | Show/hide button |

- **Default Content:**
```json
{
  "heading": "What We Stand For",
  "acronymLines": ["Faith", "Unity", "Love"],
  "description": "Describe your organization's core values or features here.",
  "button": { "label": "Learn More", "href": "#", "visible": true }
}
```

---

#### PATHWAY_CARD
- **Label:** Pathway Cards
- **Description:** Centered heading with icon-based pathway cards, each with title, description, and CTA button.
- **Icon:** `Signpost`
- **Data-driven:** No
- **Editor:** `cards-editor.tsx` -> `PathwayCardEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `description` | `string` (textarea) | Section description |
| `cards` | `array` of pathway card items | Pathway card list (add/remove) |

Each pathway card item:

| Sub-field | Type | Description |
|---|---|---|
| `icon` | `string` | Icon key (e.g., `book-open`) |
| `title` | `string` | Card title |
| `description` | `string` (textarea) | Card description |
| `buttonLabel` | `string` | Button text |
| `buttonHref` | `string` | Button link |
| `buttonVariant` | `string` | Button style variant (`primary` / `secondary`) |

- **Default Content:**
```json
{
  "heading": "Your Next Step",
  "description": "Choose a pathway that fits where you are.",
  "cards": [
    {
      "icon": "book-open",
      "title": "Bible Study",
      "description": "Explore the Word of God together.",
      "buttonLabel": "Join a Study",
      "buttonHref": "/bible-study",
      "buttonVariant": "primary"
    }
  ]
}
```

---

#### PILLARS
- **Label:** Pillars
- **Description:** Alternating image-and-text layout showcasing core pillars or values with optional CTAs.
- **Icon:** `Columns3`
- **Data-driven:** No
- **Editor:** `cards-editor.tsx` -> `PillarsEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label |
| `heading` | `string` | Section heading |
| `items` | `array` of pillar items | Pillar list (add/remove) |

Each pillar item:

| Sub-field | Type | Description |
|---|---|---|
| `title` | `string` | Pillar title |
| `description` | `string` (textarea) | Pillar description |
| `images` | `array` | Images for this pillar (JSON-only; no visual editor) |
| `button.label` | `string` | Button label |
| `button.href` | `string` | Button link |

- **Default Content:**
```json
{
  "overline": "Our Pillars",
  "heading": "What Drives Us",
  "items": [
    {
      "title": "First Pillar",
      "description": "Describe this pillar or value.",
      "images": [],
      "button": { "label": "Learn More", "href": "#" }
    }
  ]
}
```

---

#### NEWCOMER
- **Label:** Newcomer Welcome
- **Description:** Centered welcome section with icon, heading, description, CTA button, and optional image.
- **Icon:** `UserPlus`
- **Data-driven:** No
- **Editor:** `cards-editor.tsx` -> `NewcomerEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Heading text |
| `description` | `string` (textarea) | Description text |
| `buttonLabel` | `string` | Button text |
| `buttonHref` | `string` | Button link |
| `image` | `{ src, alt, objectPosition? } \| null` | Optional image (set to null/empty to remove) |

- **Default Content:**
```json
{
  "heading": "New Here?",
  "description": "We would love to meet you! Here is how to get started.",
  "buttonLabel": "Plan Your Visit",
  "buttonHref": "/visit",
  "image": null
}
```

---

### Lists & Data (8 types)

All data-driven sections display a blue "Data-Driven Section" info banner in the editor, explaining the CMS data source. The primary content is populated automatically from the CMS database.

#### ALL_MESSAGES
- **Label:** All Messages
- **Description:** Searchable, sortable grid of all sermon messages with speaker, series, and date.
- **Icon:** `MessageSquare`
- **Data-driven:** Yes (Messages from CMS Messages module)
- **Editor:** `data-section-editor.tsx` -> `SimpleDataEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `ctaLabel` | `string` | CTA link label (optional) |
| `ctaHref` | `string` | CTA link URL (optional) |
| `dataSource` | `string` | Data source identifier (`all-messages`) |

- **Default Content:**
```json
{
  "heading": "Messages",
  "dataSource": "all-messages"
}
```

---

#### ALL_EVENTS
- **Label:** All Events
- **Description:** Full listing of all events with search, filters by type, and pagination.
- **Icon:** `CalendarDays`
- **Data-driven:** Yes (Events from CMS Events module)
- **Editor:** `data-section-editor.tsx` -> `SimpleDataEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `ctaLabel` | `string` | CTA link label (optional) |
| `ctaHref` | `string` | CTA link URL (optional) |
| `dataSource` | `string` | Data source identifier (`all-events`) |

- **Default Content:**
```json
{
  "heading": "Events",
  "dataSource": "all-events"
}
```

---

#### ALL_BIBLE_STUDIES
- **Label:** Bible Studies
- **Description:** Searchable grid of Bible study materials with passage, series, and resource indicators.
- **Icon:** `BookOpen`
- **Data-driven:** Yes (Bible studies from CMS Bible Studies module)
- **Editor:** `data-section-editor.tsx` -> `SimpleDataEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `ctaLabel` | `string` | CTA link label (optional) |
| `ctaHref` | `string` | CTA link URL (optional) |
| `dataSource` | `string` | Data source identifier (`all-bible-studies`) |

- **Default Content:**
```json
{
  "heading": "Bible Studies",
  "dataSource": "all-bible-studies"
}
```

---

#### ALL_VIDEOS
- **Label:** All Videos
- **Description:** Searchable video grid with category filter, sort options, and modal playback.
- **Icon:** `Video`
- **Data-driven:** Yes (Videos from CMS Media module)
- **Editor:** `data-section-editor.tsx` -> `SimpleDataEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `ctaLabel` | `string` | CTA link label (optional) |
| `ctaHref` | `string` | CTA link URL (optional) |
| `dataSource` | `string` | Data source identifier (`all-videos`) |

- **Default Content:**
```json
{
  "heading": "Videos",
  "dataSource": "all-videos"
}
```

---

#### UPCOMING_EVENTS
- **Label:** Upcoming Events
- **Description:** Grid of upcoming events with overline heading, event cards, and CTA button.
- **Icon:** `CalendarCheck`
- **Data-driven:** Yes (Upcoming events from CMS Events module)
- **Editor:** `data-section-editor.tsx` -> `UpcomingEventsEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label |
| `heading` | `string` | Section heading |
| `ctaButton.label` | `string` | CTA button label |
| `ctaButton.href` | `string` | CTA button link |
| `dataSource` | `string` | Data source identifier (`upcoming-events`) |

- **Default Content:**
```json
{
  "overline": "What's Coming Up",
  "heading": "Upcoming Events",
  "ctaButton": { "label": "View All Events", "href": "/events" },
  "dataSource": "upcoming-events"
}
```

---

#### EVENT_CALENDAR
- **Label:** Event Calendar
- **Description:** Interactive calendar with list/month view toggle, type filters, and month navigation.
- **Icon:** `CalendarRange`
- **Data-driven:** Yes (Events from CMS Events module in calendar format)
- **Editor:** `data-section-editor.tsx` -> `EventCalendarEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `ctaButtons` | `array` | CTA buttons for calendar header (JSON-only) |
| `dataSource` | `string` | Data source identifier (`upcoming-events`) |

- **Default Content:**
```json
{
  "heading": "Schedule",
  "ctaButtons": [],
  "dataSource": "upcoming-events"
}
```

---

#### RECURRING_MEETINGS
- **Label:** Recurring Meetings
- **Description:** Styled list of recurring meetings with type pills, schedule, time, and join buttons.
- **Icon:** `Repeat`
- **Data-driven:** Yes (Upcoming events from CMS Events module)
- **Editor:** `data-section-editor.tsx` -> `RecurringMeetingsEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `maxVisible` | `number` (input, 1-20) | Max items to show before "View All" |
| `viewAllHref` | `string` | "View All" link URL |
| `dataSource` | `string` | Data source identifier (`upcoming-events`) |

- **Default Content:**
```json
{
  "heading": "Weekly Meetings",
  "maxVisible": 4,
  "viewAllHref": "/events",
  "dataSource": "upcoming-events"
}
```

---

#### RECURRING_SCHEDULE
- **Label:** Recurring Schedule
- **Description:** Card grid of weekly meetings showing day-of-week pills, time badges, and locations.
- **Icon:** `Clock`
- **Data-driven:** No (static content defined in section JSON)
- **Editor:** `schedule-editor.tsx` -> `ScheduleEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `subtitle` | `string` (textarea) | Subtitle text |
| `meetings` | `array` of meeting items | Meeting card list (add/remove) |

Each meeting item:

| Sub-field | Type | Description |
|---|---|---|
| `title` | `string` | Meeting title |
| `description` | `string` (textarea) | Meeting description |
| `time` | `string` | Time (e.g., "10:00 AM") |
| `days` | `array` of `string` | Day-of-week toggles (`Sun`, `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`) |
| `location` | `string` | Location name |

- **Default Content:**
```json
{
  "heading": "Weekly Schedule",
  "subtitle": "Join us throughout the week.",
  "meetings": [
    {
      "title": "Sunday Worship",
      "description": "Join us for worship and fellowship.",
      "time": "10:00 AM",
      "days": ["Sun"],
      "location": "Main Campus"
    }
  ]
}
```

---

### Ministry (6 types)

#### MINISTRY_INTRO
- **Label:** Ministry Intro
- **Description:** Ministry introduction with overline, heading, description, and optional side image.
- **Icon:** `BookHeart`
- **Data-driven:** No
- **Editor:** `ministry-editor.tsx` -> `MinistryIntroEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label |
| `heading` | `string` | Heading text |
| `description` | `string` (textarea) | Description text |
| `image` | `{ src, alt, objectPosition? } \| null` | Optional side image |

- **Default Content:**
```json
{
  "overline": "About This Ministry",
  "heading": "Ministry Name",
  "description": "Describe this ministry, its mission, and how people can get involved.",
  "image": null
}
```

---

#### MINISTRY_SCHEDULE
- **Label:** Ministry Schedule
- **Description:** Two-column layout with ministry details, schedule entries or image, and CTA buttons.
- **Icon:** `CalendarClock`
- **Data-driven:** No
- **Editor:** `ministry-editor.tsx` -> `MinistryScheduleEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Heading text |
| `description` | `string` (textarea) | Description text |
| `scheduleEntries` | `array` of schedule entry items | Schedule entry list (add/remove) |
| `buttons` | `array` of button items | CTA button list (add/remove) |

Each schedule entry:

| Sub-field | Type | Description |
|---|---|---|
| `day` | `string` | Day of week |
| `time` | `string` | Time |
| `location` | `string` | Location |

Each button:

| Sub-field | Type | Description |
|---|---|---|
| `label` | `string` | Button text |
| `href` | `string` | Button link |
| `variant` | `string` | `primary` or `secondary` (toggle buttons) |

- **Default Content:**
```json
{
  "heading": "Meeting Times",
  "description": "Join us at our regular meeting times.",
  "scheduleEntries": [
    { "day": "Sunday", "time": "10:00 AM", "location": "Main Building" }
  ],
  "buttons": [
    { "label": "Get Directions", "href": "#", "variant": "secondary" }
  ]
}
```

---

#### CAMPUS_CARD_GRID
- **Label:** Campus Cards
- **Description:** Grid of campus cards with decorative photos, heading, and optional bottom CTA.
- **Icon:** `Building2`
- **Data-driven:** No
- **Editor:** `ministry-editor.tsx` -> `CampusCardGridEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label |
| `heading` | `string` | Section heading |
| `description` | `string` (textarea) | Description text |
| `campuses` | `array` of campus items | Campus card list (add/remove) |
| `decorativeImages` | `array` | Decorative images (JSON-only) |

Each campus item:

| Sub-field | Type | Description |
|---|---|---|
| `name` | `string` | Campus name |
| `href` | `string` | Campus page link |
| `image` | `string` (optional) | Campus image URL |

- **Default Content:**
```json
{
  "overline": "Our Locations",
  "heading": "Find a Campus",
  "description": "We have multiple locations to serve you.",
  "campuses": [],
  "decorativeImages": []
}
```

---

#### DIRECTORY_LIST
- **Label:** Directory List
- **Description:** Parallax directory of linked items (e.g., campuses) with hover effects and CTA section.
- **Icon:** `List`
- **Data-driven:** No
- **Editor:** `ministry-editor.tsx` -> `DirectoryListEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `items` | `array` of directory items | Directory item list (add/remove) |
| `image.src` | `string` | Background image URL |
| `image.alt` | `string` | Background image alt text |
| `ctaHeading` | `string` | Bottom CTA heading text |
| `ctaButton.label` | `string` | CTA button label |
| `ctaButton.href` | `string` | CTA button link |

Each directory item:

| Sub-field | Type | Description |
|---|---|---|
| `label` | `string` | Item label/name |
| `href` | `string` | Item link |
| `description` | `string` (optional) | Short description |

- **Default Content:**
```json
{
  "heading": "Our Directory",
  "items": [],
  "image": { "src": "", "alt": "Directory image" },
  "ctaHeading": "Want to learn more?",
  "ctaButton": { "label": "Contact Us", "href": "/contact" }
}
```

---

#### MEET_TEAM
- **Label:** Meet the Team
- **Description:** Team member cards with photo placeholder, name (first + last initial), role, and bio.
- **Icon:** `UsersRound`
- **Data-driven:** No
- **Editor:** `ministry-editor.tsx` -> `MeetTeamEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label |
| `heading` | `string` | Section heading |
| `members` | `array` of member items | Team member list (add/remove/reorder with move up/down) |

Each member item:

| Sub-field | Type | Description |
|---|---|---|
| `name` | `string` | Full name |
| `role` | `string` | Role/title |
| `bio` | `string` (textarea) | Bio text |
| `image` | `string \| null` | Photo URL (optional) |

- **Default Content:**
```json
{
  "overline": "Our Team",
  "heading": "Meet the Team",
  "members": [
    {
      "name": "John Doe",
      "role": "Pastor",
      "bio": "",
      "image": null
    }
  ]
}
```

---

#### LOCATION_DETAIL
- **Label:** Location Detail
- **Description:** Two-column layout with service time, address, directions CTA, and location image.
- **Icon:** `MapPin`
- **Data-driven:** No
- **Editor:** `ministry-editor.tsx` -> `LocationDetailEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label |
| `timeLabel` | `string` | Service time label (e.g., "Service Time") |
| `timeValue` | `string` | Service time value (e.g., "Sunday 10:00 AM") |
| `locationLabel` | `string` | Address section label (e.g., "Address") |
| `address` | `array` of `string` | Address lines (add/remove) |
| `directionsUrl` | `string` | Directions link URL (e.g., Google Maps) |
| `directionsLabel` | `string` | Directions link text |
| `images` | `array` | Location images (JSON-only) |

- **Default Content:**
```json
{
  "overline": "Visit Us",
  "timeLabel": "Service Time",
  "timeValue": "Sunday 10:00 AM",
  "locationLabel": "Address",
  "address": ["123 Main Street", "City, State 12345"],
  "directionsUrl": "#",
  "directionsLabel": "Get Directions",
  "images": []
}
```

---

### Interactive (3 types)

#### FORM_SECTION
- **Label:** Contact Form
- **Description:** Contact form with name, email, phone, interest checkboxes, campus selector, and comments.
- **Icon:** `FileEdit`
- **Data-driven:** No
- **Editor:** `form-editor.tsx` -> `FormEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label |
| `heading` | `string` | Form heading |
| `description` | `string` (textarea) | Description text |
| `interestOptions` | `array` of `{ label, value }` | Checkbox interest options (add/remove) |
| `campusOptions` | `array` of `{ label, value }` | Campus dropdown options (add/remove) |
| `bibleTeacherLabel` | `string` | Bible teacher checkbox label (leave empty to hide) |
| `submitLabel` | `string` | Submit button text |
| `successMessage` | `string` | Success message after submission |

Each interest/campus option:

| Sub-field | Type | Description |
|---|---|---|
| `label` | `string` | Display label |
| `value` | `string` | Form value |

- **Default Content:**
```json
{
  "overline": "Get In Touch",
  "heading": "Contact Us",
  "description": "Fill out the form below and we will get back to you.",
  "interestOptions": [
    { "label": "Visiting", "value": "visiting" },
    { "label": "Bible Study", "value": "bible-study" },
    { "label": "Other", "value": "other" }
  ],
  "campusOptions": [],
  "bibleTeacherLabel": "I am interested in becoming a Bible teacher.",
  "submitLabel": "Submit",
  "successMessage": "Thank you! We received your message."
}
```

---

#### FAQ_SECTION
- **Label:** FAQ
- **Description:** Accordion-style FAQ section with expandable question/answer pairs and optional icon.
- **Icon:** `HelpCircle`
- **Data-driven:** No
- **Editor:** `faq-editor.tsx` -> `FAQEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `showIcon` | `boolean` (switch) | Show circular question mark icon above heading |
| `items` | `array` of FAQ items | Question/answer pairs (add/remove/reorder with move up/down) |

Each FAQ item:

| Sub-field | Type | Description |
|---|---|---|
| `question` | `string` | Question text |
| `answer` | `string` (textarea) | Answer text |

- **Default Content:**
```json
{
  "heading": "Frequently Asked Questions",
  "showIcon": true,
  "items": [
    {
      "question": "What time are your services?",
      "answer": "Our main service is every Sunday at 10:00 AM."
    },
    {
      "question": "Where are you located?",
      "answer": "We are located at 123 Main Street, City, State 12345."
    }
  ]
}
```

---

#### TIMELINE_SECTION
- **Label:** Timeline
- **Description:** Vertical timeline with image or video on the left and chronological items on the right.
- **Icon:** `GitBranchPlus`
- **Data-driven:** No
- **Editor:** `timeline-editor.tsx` -> `TimelineEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `overline` | `string` | Overline label |
| `heading` | `string` | Section heading |
| `description` | `string` (textarea) | Description text |
| `items` | `array` of timeline items | Timeline steps (add/remove/reorder with move up/down) |

Each timeline item:

| Sub-field | Type | Description |
|---|---|---|
| `time` | `string` | Time label (e.g., "10:00 AM") |
| `title` | `string` | Step title |
| `description` | `string` (textarea) | Step description |

- **Default Content:**
```json
{
  "overline": "Sunday Service",
  "heading": "What to Expect",
  "description": "Here is how our typical Sunday unfolds.",
  "items": [
    {
      "time": "10:00 AM",
      "title": "Welcome & Worship",
      "description": "We begin with a time of singing and prayer."
    },
    {
      "time": "10:30 AM",
      "title": "Message",
      "description": "A sermon based on a passage from the Bible."
    }
  ]
}
```

---

### Layout (3 types)

#### FOOTER
- **Label:** Footer
- **Description:** Site footer with brand column, navigation links, social icons, and contact information.
- **Icon:** `PanelBottom`
- **Data-driven:** No
- **Editor:** `footer-editor.tsx` -> `FooterEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `description` | `string` (textarea) | Organization description |
| `socialLinks` | `array` of social link items | Social media links (add/remove) |
| `columns` | `array` of link column items | Navigation link columns (add/remove) |
| `contactInfo.address` | `array` of `string` | Address lines (add/remove) |
| `contactInfo.phone` | `string` | Phone number |
| `contactInfo.email` | `string` | Email address |

Each social link:

| Sub-field | Type | Description |
|---|---|---|
| `platform` | `string` | Platform name (e.g., `instagram`, `youtube`) |
| `url` | `string` | Profile URL |

Each link column:

| Sub-field | Type | Description |
|---|---|---|
| `heading` | `string` | Column heading |
| `links` | `array` of `{ label, href }` | Column links (add/remove per column) |

- **Default Content:**
```json
{
  "description": "A brief description of your church or organization.",
  "socialLinks": [],
  "columns": [
    {
      "heading": "About",
      "links": [
        { "label": "Our Story", "href": "/about" },
        { "label": "Contact", "href": "/contact" }
      ]
    }
  ],
  "contactInfo": {
    "address": ["123 Main Street", "City, State 12345"],
    "phone": "(555) 123-4567",
    "email": "info@example.com"
  }
}
```

---

#### QUICK_LINKS
- **Label:** Quick Links
- **Description:** Horizontal scrolling carousel of meeting cards with type pills, schedules, and join buttons.
- **Icon:** `Link`
- **Data-driven:** Yes (Quick links populated from recurring meetings)
- **Editor:** `data-section-editor.tsx` -> `QuickLinksEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `subtitle` | `string` | Subtitle text |

- **Default Content:**
```json
{
  "heading": "Quick Links",
  "subtitle": "Access your most important links at a glance."
}
```

---

#### DAILY_BREAD_FEATURE
- **Label:** Daily Bread
- **Description:** Daily devotional feature section (coming soon).
- **Icon:** `Wheat`
- **Data-driven:** Yes (Daily devotional content)
- **Editor:** `data-section-editor.tsx` -> `DailyBreadEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `dataSource` | `string` | Data source identifier (`latest-daily-bread`) |

- **Default Content:**
```json
{
  "heading": "Daily Bread",
  "dataSource": "latest-daily-bread"
}
```

**Note:** This section type is a placeholder -- no source component exists yet in `components/website/sections/`.

---

### Custom (2 types)

#### CUSTOM_HTML
- **Label:** Custom HTML
- **Description:** Embed raw HTML content directly into the page. Use for custom widgets or integrations.
- **Icon:** `Code`
- **Data-driven:** No
- **Editor:** `custom-editor.tsx` -> `CustomHtmlEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `html` | `string` (textarea, monospace) | Raw HTML content (rendered without sanitization -- warning displayed in editor) |

- **Default Content:**
```json
{
  "html": "<div style=\"padding: 2rem; text-align: center;\"><p>Your custom HTML content goes here.</p></div>"
}
```

---

#### CUSTOM_EMBED
- **Label:** Custom Embed
- **Description:** Embed external content via URL (YouTube, Google Maps, forms, etc.) in a responsive iframe.
- **Icon:** `ExternalLink`
- **Data-driven:** No
- **Editor:** `custom-editor.tsx` -> `CustomEmbedEditor`
- **Content Fields:**

| Field | Type | Description |
|---|---|---|
| `embedUrl` | `string` | Embed-friendly URL for iframe src |
| `title` | `string` | Accessibility title for the iframe element |
| `aspectRatio` | `string` | Aspect ratio (preset buttons: `16/9`, `4/3`, `1/1`, `9/16`; also accepts free-text input) |

- **Default Content:**
```json
{
  "embedUrl": "",
  "title": "Embedded Content",
  "aspectRatio": "16/9"
}
```

---

## Page Templates

Templates are defined in `builder-empty-state.tsx`. Each template creates a new page with pre-populated sections.

| # | Template ID | Title | Page Type | Sections | Count |
|---|---|---|---|---|---|
| 1 | `home` | Home | `LANDING` | `HERO_BANNER`, `MEDIA_TEXT`, `HIGHLIGHT_CARDS`, `SPOTLIGHT_MEDIA`, `ACTION_CARD_GRID`, `PHOTO_GALLERY`, `CTA_BANNER` | 7 |
| 2 | `about` | About Us | `STANDARD` | `PAGE_HERO`, `ABOUT_DESCRIPTION`, `PILLARS`, `MEET_TEAM`, `TIMELINE_SECTION`, `CTA_BANNER` | 6 |
| 3 | `events` | Events | `STANDARD` | `EVENTS_HERO`, `UPCOMING_EVENTS`, `EVENT_CALENDAR`, `CTA_BANNER` | 4 |
| 4 | `messages` | Messages | `STANDARD` | `PAGE_HERO`, `SPOTLIGHT_MEDIA`, `ALL_MESSAGES` | 3 |
| 5 | `bible-study` | Bible Study | `STANDARD` | `PAGE_HERO`, `ALL_BIBLE_STUDIES`, `QUOTE_BANNER`, `CTA_BANNER` | 4 |
| 6 | `ministry-hub` | Ministry Hub | `MINISTRY` | `MINISTRY_HERO`, `MINISTRY_INTRO`, `MEET_TEAM`, `MINISTRY_SCHEDULE`, `RECURRING_MEETINGS`, `LOCATION_DETAIL` | 6 |
| 7 | `giving` | Giving | `STANDARD` | `PAGE_HERO`, `STATEMENT`, `FAQ_SECTION`, `CTA_BANNER` | 4 |
| 8 | `contact` | Contact | `STANDARD` | `PAGE_HERO`, `LOCATION_DETAIL`, `FORM_SECTION` | 3 |
| 9 | `im-new` | I'm New | `STANDARD` | `TEXT_IMAGE_HERO`, `NEWCOMER`, `FEATURE_BREAKDOWN`, `FAQ_SECTION`, `LOCATION_DETAIL`, `CTA_BANNER` | 6 |
| -- | `blank` | Blank Page | `STANDARD` | _(none)_ | 0 |

---

## Editor Coverage

This table shows which editor file handles which section types and how routing works in `index.tsx`.

| Editor File | Section Types Handled | Routing Logic |
|---|---|---|
| `hero-editor.tsx` | `HERO_BANNER`, `PAGE_HERO`, `TEXT_IMAGE_HERO`, `EVENTS_HERO`, `MINISTRY_HERO` | `HERO_TYPES` array check |
| `content-editor.tsx` | `MEDIA_TEXT`, `QUOTE_BANNER`, `CTA_BANNER`, `ABOUT_DESCRIPTION`, `STATEMENT`, `SPOTLIGHT_MEDIA` | `CONTENT_TYPES` array check |
| `cards-editor.tsx` | `ACTION_CARD_GRID`, `HIGHLIGHT_CARDS`, `FEATURE_BREAKDOWN`, `PATHWAY_CARD`, `PILLARS`, `NEWCOMER` | `CARDS_TYPES` array check |
| `data-section-editor.tsx` | `ALL_MESSAGES`, `ALL_EVENTS`, `ALL_BIBLE_STUDIES`, `ALL_VIDEOS`, `UPCOMING_EVENTS`, `EVENT_CALENDAR`, `RECURRING_MEETINGS`, `MEDIA_GRID`, `QUICK_LINKS`, `DAILY_BREAD_FEATURE` | `DATA_TYPES` array check |
| `ministry-editor.tsx` | `MINISTRY_INTRO`, `MINISTRY_SCHEDULE`, `CAMPUS_CARD_GRID`, `MEET_TEAM`, `LOCATION_DETAIL`, `DIRECTORY_LIST` | `MINISTRY_TYPES` array check |
| `faq-editor.tsx` | `FAQ_SECTION` | Exact type match |
| `timeline-editor.tsx` | `TIMELINE_SECTION` | Exact type match |
| `form-editor.tsx` | `FORM_SECTION` | Exact type match |
| `footer-editor.tsx` | `FOOTER` | Exact type match |
| `photo-gallery-editor.tsx` | `PHOTO_GALLERY` | Exact type match |
| `schedule-editor.tsx` | `RECURRING_SCHEDULE` | Exact type match |
| `custom-editor.tsx` | `CUSTOM_HTML`, `CUSTOM_EMBED` | `CUSTOM_TYPES` array check |
| `json-editor.tsx` | _(fallback for any type not matched above)_ | Final fallback |

**Note:** The `hasStructuredEditor()` function in `index.tsx` returns `true` for all 41 catalog section types, meaning no type falls through to the JSON-only fallback under normal operation. The JSON editor exists as a safety net for future section types that have not yet been assigned a dedicated editor.

---

## Category Summary

| Category | ID | Icon | Section Count | Data-Driven Count |
|---|---|---|---|---|
| Heroes | `heroes` | `PanelTop` | 5 | 0 |
| Content | `content` | `Type` | 8 | 2 (`MEDIA_GRID`, `SPOTLIGHT_MEDIA`) |
| Cards & Grids | `cards` | `LayoutGrid` | 6 | 1 (`HIGHLIGHT_CARDS`) |
| Lists & Data | `data` | `Database` | 8 | 7 (all except `RECURRING_SCHEDULE`) |
| Ministry | `ministry` | `Users` | 6 | 0 |
| Interactive | `interactive` | `MousePointerClick` | 3 | 0 |
| Layout | `layout` | `PanelBottom` | 3 | 2 (`QUICK_LINKS`, `DAILY_BREAD_FEATURE`) |
| Custom | `custom` | `Code` | 2 | 0 |
| **Total** | | | **41** | **12** |

**Note on data-driven count discrepancy:** The catalog marks 10 types with `isDataDriven: true`. However, `SPOTLIGHT_MEDIA` and `HIGHLIGHT_CARDS` also have `dataSource` fields and are listed in `DATA_SOURCE_LABELS` within the `data-section-editor.tsx`. They are routed to their own dedicated editors (`content-editor` and `cards-editor` respectively) rather than through `DataSectionEditor`, because they have richer structured editing beyond just heading/CTA. The category summary above counts 12 types that reference `dataSource` in their content.

---

## JSON-Only Fields

Some fields within structured editors are noted as "JSON-only" (configured by editing the raw JSON, not via the visual editor). These are candidates for future dedicated editors:

| Section Type | JSON-Only Field | Description |
|---|---|---|
| `PAGE_HERO` | `floatingImages` | Floating orbit image configuration |
| `MINISTRY_HERO` | `socialLinks` | Social media link list |
| `MEDIA_TEXT` | `images` | Rotating image carousel images |
| `HIGHLIGHT_CARDS` | `featuredEvents` | Featured event card data |
| `PILLARS` | `items[].images` | Per-pillar image arrays |
| `CAMPUS_CARD_GRID` | `decorativeImages` | Decorative background images |
| `LOCATION_DETAIL` | `images` | Location images |
| `EVENT_CALENDAR` | `ctaButtons` | Calendar header CTA buttons |
