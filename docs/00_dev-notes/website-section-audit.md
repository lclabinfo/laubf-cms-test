# Website Section Database Connectivity Audit

**Date:** 2026-02-25
**Scope:** Full audit of all 42 section types, 26 pages, layout components

## Architecture Summary

The data flow from DB to website works as follows:

```
Page Route (app/website/[[...slug]]/page.tsx)
  → getPageBySlug() / getHomepage() — fetches Page + PageSections from DB
  → resolveSectionData() — for each section, resolves dataSource to real DB data
  → SectionRenderer — spreads resolvedData as props to section component
  → Section Component — renders with DB data
```

**Key files:**
- `app/website/[[...slug]]/page.tsx` — catch-all page route
- `lib/website/resolve-section-data.ts` — data source resolver (11 data sources)
- `components/website/sections/registry.tsx` — maps 42 section types to components

## Data Sources (resolve-section-data.ts)

| dataSource | DAL Function | Used By |
|---|---|---|
| `latest-message` | `getLatestMessage(churchId)` | SPOTLIGHT_MEDIA |
| `featured-events` | `getFeaturedEvents(churchId, count)` | HIGHLIGHT_CARDS |
| `upcoming-events` | `getUpcomingEvents(churchId, 10)` | UPCOMING_EVENTS, EVENT_CALENDAR, RECURRING_MEETINGS |
| `ministry-events` | `getUpcomingEvents(churchId, 6)` | UPCOMING_EVENTS (ministry pages) |
| `latest-videos` | `getVideos(churchId, { pageSize: count })` | MEDIA_GRID |
| `all-messages` | `getMessages(churchId, { pageSize: 200 })` | ALL_MESSAGES |
| `all-events` | `getEvents(churchId, { pageSize: 200 })` | ALL_EVENTS |
| `all-bible-studies` | `getBibleStudies(churchId, { pageSize: 200 })` | ALL_BIBLE_STUDIES |
| `all-videos` | `getVideos(churchId, { pageSize: 200 })` | ALL_VIDEOS |
| `all-campuses` | `getCampuses(churchId)` | CAMPUS_CARD_GRID |
| `latest-daily-bread` | `getTodaysDailyBread(churchId)` | DAILY_BREAD_FEATURE |

## Section Connectivity Status

### Dynamic Sections (DB-Connected)

| Section Type | Component | Data Source | Status |
|---|---|---|---|
| ALL_MESSAGES | all-messages.tsx (RSC) | Direct fetch via `getMessages()` | WORKING |
| ALL_EVENTS | all-events.tsx (RSC) | Direct fetch via `getEvents()` | WORKING |
| ALL_BIBLE_STUDIES | all-bible-studies.tsx (RSC) | `all-bible-studies` or direct fetch | WORKING |
| ALL_VIDEOS | all-videos.tsx (RSC) | `all-videos` or direct fetch | WORKING |
| SPOTLIGHT_MEDIA | spotlight-media.tsx | `latest-message` via content.sermon | WORKING |
| HIGHLIGHT_CARDS | highlight-cards.tsx | `featured-events` via content.featuredEvents | WORKING |
| UPCOMING_EVENTS | upcoming-events.tsx | `upcoming-events` via events prop | WORKING |
| EVENT_CALENDAR | event-calendar.tsx | `upcoming-events` via events prop | WORKING |
| RECURRING_MEETINGS | recurring-meetings.tsx | `upcoming-events` via events prop | WORKING |
| MEDIA_GRID | media-grid.tsx | `latest-videos` via content.videos | WORKING (modal broken) |
| DAILY_BREAD_FEATURE | daily-bread-feature.tsx | `latest-daily-bread` via content | WORKING |
| CAMPUS_CARD_GRID | campus-card-grid.tsx | `all-campuses` via campuses prop | WORKING |

### Static Sections (Content from PageSection.content JSON)

All static sections are **WORKING** — they read from the `content` JSON stored in the DB via the page builder.

| Section Type | Component | Notes |
|---|---|---|
| HERO_BANNER | hero-banner.tsx | Video/image hero |
| PAGE_HERO | page-hero.tsx | Floating images hero |
| TEXT_IMAGE_HERO | text-image-hero.tsx | Text + image split |
| EVENTS_HERO | events-hero.tsx | Events page header |
| MINISTRY_HERO | ministry-hero.tsx | Ministry page header |
| MEDIA_TEXT | media-text.tsx | Image carousel + text |
| CTA_BANNER | cta-banner.tsx | Call-to-action with buttons |
| QUOTE_BANNER | quote-banner.tsx | Inspirational quote |
| ACTION_CARD_GRID | action-card-grid.tsx | 2x2 card grid |
| ABOUT_DESCRIPTION | about-description.tsx | About page content |
| STATEMENT | statement.tsx | Beliefs/statement |
| PILLARS | pillars.tsx | Ministry pillars |
| NEWCOMER | newcomer.tsx | Welcome section |
| MINISTRY_INTRO | ministry-intro.tsx | Ministry description |
| MINISTRY_SCHEDULE | ministry-schedule.tsx | Schedule display |
| MEET_TEAM | meet-team.tsx | Team members |
| DIRECTORY_LIST | directory-list.tsx | Campus directory |
| FEATURE_BREAKDOWN | feature-breakdown.tsx | Feature cards |
| PATHWAY_CARD | pathway-card.tsx | Pathway steps |
| LOCATION_DETAIL | location-detail.tsx | Location info |
| TIMELINE_SECTION | timeline-section.tsx | Timeline display |
| PHOTO_GALLERY | photo-gallery.tsx | Auto-scroll gallery |
| FAQ_SECTION | faq-section.tsx | Accordion FAQ |
| FORM_SECTION | form-section.tsx | Contact form (no backend) |
| FOOTER | footer.tsx | Page footer |
| QUICK_LINKS | quick-links.tsx | Quick links FAB |
| CUSTOM_HTML | custom-html.tsx | Raw HTML embed |
| CUSTOM_EMBED | custom-embed.tsx | Iframe embed |
| RECURRING_SCHEDULE | recurring-schedule.tsx | Schedule grid |

### Placeholder Sections

| Section Type | Reason |
|---|---|
| NAVBAR | Handled by layout, not rendered as section |
| DAILY_BREAD_FEATURE | Fully implemented (was listed as placeholder, now real) |

## Issues Found & Fixed

### CRITICAL: Cache Revalidation Paths (FIXED 2026-02-25)

**Problem:** All 15 content API routes called `revalidatePath('/(website)', 'layout')` but the website directory is `app/website/` (not a route group). The path `/(website)` never matched — cache was never invalidated after CMS updates.

**Fix:** Changed all 15 files to `revalidatePath('/website', 'layout')`.

**Files fixed:** bible-studies, messages, events, videos, daily-bread, site-settings, theme, church, menus (both route files), pages (4 route files).

### MEDIUM: Missing /website/messages/ Routes

**Problem:** ALL_MESSAGES and SPOTLIGHT_MEDIA link to `/messages/{slug}` but no message detail page route exists.

**Impact:** Users can click on a message card but get a 404.

**Comparison:** Bible studies have `/website/bible-study/[slug]/page.tsx` and events have `/website/events/[slug]/page.tsx`, but messages has no equivalent.

**Status:** Needs implementation.

### LOW: MEDIA_GRID Video Modal

**Problem:** The `videos` prop (for modal interaction) is never populated because `latest-videos` data source returns videos inside `content.videos`, not as a separate `resolvedData` key.

**Impact:** Video thumbnails display correctly but clicking doesn't open a modal.

### CRITICAL: Message → BibleStudy Sync (FIXED 2026-02-25)

**Problem:** CMS Messages editor manages both video and bible study content via tabs, but the website's `/bible-study` page reads from the separate `BibleStudy` table. Creating or updating a message with study content in the CMS never wrote to the `BibleStudy` table — so new studies never appeared on the website.

**Root cause:** The `Message` and `BibleStudy` Prisma models are separate tables. The CMS writes to `Message.studySections` (JSON field), but the website reads from `BibleStudy.questions`, `BibleStudy.answers`, etc. The `Message.relatedStudyId` FK exists but was only populated during seeding — the API never created this link.

**Fix:** Created `lib/dal/sync-message-study.ts` with:
- `syncMessageStudy()` — auto-creates/updates a `BibleStudy` record when a Message with `hasStudy=true` is saved
- `unlinkMessageStudy()` — soft-deletes the linked `BibleStudy` when study content is removed or the message is deleted
- `parseBookFromPassage()` — extracts `BibleBook` enum from passage strings like "John 3:16"

**API routes updated:** `POST /api/v1/messages` and `PATCH /api/v1/messages/[slug]` now call `syncMessageStudy()` after saving. `DELETE /api/v1/messages/[slug]` calls `unlinkMessageStudy()`.

**Data mapping (Message → BibleStudy):**
| Message field | BibleStudy field |
|---|---|
| `title` | `title` |
| `slug` | `slug` (with uniqueness check) |
| `passage` | `passage` + `book` (parsed from passage) |
| `speakerId` | `speakerId` |
| `seriesId` (via MessageSeries) | `seriesId` (direct FK) |
| `dateFor` | `dateFor` + `datePosted` |
| `status` | `status` |
| `publishedAt` | `publishedAt` |
| `studySections[title~"Questions"]` | `questions` + `hasQuestions` |
| `studySections[title~"Answers"]` | `answers` + `hasAnswers` |
| `studySections[title~"Transcript"]` | `transcript` + `hasTranscript` |

### LOW: FORM_SECTION No Backend

**Problem:** Form collects data client-side but `handleSubmit` only sets local state — no API call.

**Impact:** Contact/signup forms don't actually submit.

## Layout Components

All layout components are **FULLY DB-CONNECTED**:

| Component | Data Source | Status |
|---|---|---|
| WebsiteNavbar | `getMenuByLocation('HEADER')` + SiteSettings | WORKING |
| WebsiteFooter | `getMenuByLocation('FOOTER')` + SiteSettings | WORKING |
| ThemeProvider | `getThemeWithCustomization(churchId)` | WORKING |
| FontLoader | `getThemeWithCustomization(churchId)` | WORKING |
| QuickLinksFAB | Extracted from header menu children | WORKING |

## Pages (26 Total)

| Page | Slug | Sections | All Connected |
|---|---|---|---|
| Home | (empty) | 10 | Yes |
| About | about | 5 | Yes (static) |
| Messages | messages | 2 | Yes |
| Events | events | 2 | Yes |
| Bible Study | bible-study | 2 | Yes |
| Videos | videos | 2 | Yes |
| Daily Bread | daily-bread | 1 | Yes |
| I'm New | im-new | 8 | Yes (static) |
| Giving | giving | 2 | Yes (static) |
| Ministries | ministries | 5 | Yes |
| College Ministry | ministries/college | 8 | Yes |
| Adults Ministry | ministries/adults | 6 | Yes |
| High School | ministries/high-school | 7 | Yes |
| Children | ministries/children | 7 | Yes |
| 11 Campus Pages | ministries/campus/* | 6 each | Yes (static) |
