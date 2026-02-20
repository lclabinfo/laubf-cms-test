# Events Data Gap Analysis: Website vs CMS

> **Date:** 2026-02-20
> **Purpose:** Identify all missing fields, mismatches, and issues between the live website's `Event` type and the CMS `ChurchEvent` type before designing the database schema.

---

## 1. Field-by-Field Comparison

### Website `Event` Interface (laubf-test)

| # | Field | Type | Required | CMS Equivalent | Status |
|---|-------|------|----------|---------------|--------|
| 1 | `slug` | `string` | Yes | *None* | **MISSING** |
| 2 | `title` | `string` | Yes | `title` | OK |
| 3 | `type` | `EventType` | Yes | `type` | OK |
| 4 | `dateStart` | `string (ISO)` | Yes | `date` | OK (rename only) |
| 5 | `dateEnd` | `string (ISO)` | No | `endDate` | OK (rename only) |
| 6 | `time` | `string` | Yes | `startTime` + `endTime` | OK (computed) |
| 7 | `location` | `string` | Yes | `location` | PARTIAL (see below) |
| 8 | `description` | `string` | Yes | *None* | **MISSING** (short desc) |
| 9 | `body` | `string (HTML)` | Yes | `description` | OK (rename: CMS `description` = website `body`) |
| 10 | `image.src` | `string` | Yes | `coverImage` | OK |
| 11 | `image.alt` | `string` | Yes | *None* | **MISSING** |
| 12 | `image.objectPosition` | `string` | No | *None* | **MISSING** |
| 13 | `badge` | `string` | No | *N/A - computed* | OK (dynamically computed on website) |
| 14 | `tags` | `string[]` | Yes | *None* | **MISSING** |
| 15 | `ministry` | `MinistryTag` | Yes | `ministry` | **MISMATCH** (different taxonomy) |
| 16 | `campus` | `CampusTag` | No | *None* | **MISSING** |
| 17 | `isRecurring` | `boolean` | Yes | *Derived from recurrence != "none"* | OK (computed) |
| 18 | `meetingUrl` | `string` | No | *None* (online location conflated) | **MISSING** |
| 19 | `registrationUrl` | `string` | No | *None* | **MISSING** |
| 20 | `links` | `{ label, href, external? }[]` | No | *None* | **MISSING** |
| 21 | `isFeatured` | `boolean` | No | `isPinned` | OK (semantic match) |
| 22 | `recurrenceType` | `"daily" \| "weekly" \| "biweekly" \| "monthly"` | No | `recurrence` | PARTIAL (CMS adds "yearly", "weekday", "custom") |
| 23 | `recurrenceDays` | `DayOfWeek[]` | No | `customRecurrence.days` | **MISSING** at top level |
| 24 | `recurrenceStart` | `string (ISO)` | No | *None* | **MISSING** |
| 25 | `recurrenceEnd` | `string (ISO)` | No | `customRecurrence.endDate` | **MISSING** at top level |
| 26 | `recurrenceSchedule` | `string` | No | *None* | **MISSING** (computed label) |

### CMS-only fields (not in the website type):

| Field | Type | Purpose | Recommendation |
|-------|------|---------|---------------|
| `welcomeMessage` | `string` | First-time visitor greeting | Keep as CMS-only; could be rendered on the detail page in the future |
| `locationType` | `"in-person" \| "online"` | Determines location input UX | Keep for CMS UX; derive from `meetingUrl` presence for website |

---

## 2. Missing Fields Detail

### 2.1 `slug` (URL Identifier)
The website uses slugs like `/events/friday-night-bible-study` for event detail pages. The CMS uses auto-generated IDs (`e1`, `e${Date.now()}`). The CMS needs a slug field that auto-generates from the title but can be manually edited.

**CMS Change:** Add `slug` field (auto-generated from title, editable).

### 2.2 `description` (Short Description) vs `body` (Rich Text)
The website has TWO content fields:
- `description` — a plain-text short summary shown on cards and list items (1-2 sentences)
- `body` — rich HTML content for the event detail page

The CMS only has `description` which maps to the website's `body`. There's no field for the short summary that appears on cards.

**CMS Change:** Add `shortDescription` (plain text, ~200 char limit) separate from the rich text `description`.

### 2.3 `campus` (Campus Association)
The website supports filtering events by campus (CSULB, UCLA, USC, etc.). The CMS has no campus concept.

**CMS Change:** Add `campus` select field with options matching the website's `CampusTag` type.

### 2.4 `tags` (Admin Metadata Tags)
The website uses tags like `#YAM`, `#BIBLE STUDY`, `#OPEN EVENT` for filtering and display. The CMS has no tag system.

**CMS Change:** Add `tags` field with tag input UI (similar to contacts).

### 2.5 `meetingUrl` (Online Meeting Link)
The website has BOTH:
- `location` — always a display string ("LA UBF Main Center / YouTube Live")
- `meetingUrl` — a separate clickable URL for joining online (Zoom, YouTube, Google Meet)

The CMS conflates these: if `locationType` is "online", the `location` field IS the meeting URL. This means online events lose their display-friendly location name.

**CMS Change:** Add `meetingUrl` field that's always visible (not just for online events). An event can be in-person but still have a Zoom link.

### 2.6 `registrationUrl` (External Registration)
The website shows a "Register Now" button when `registrationUrl` is present. CMS has no equivalent.

**CMS Change:** Add `registrationUrl` text input.

### 2.7 `links` (Important External Links)
The website's detail page shows an "Important Links" section with custom labeled links. CMS has no equivalent.

**CMS Change:** Add dynamic `links` array management (label + URL + external toggle).

### 2.8 `image.alt` and `image.objectPosition`
The website uses structured image data `{ src, alt, objectPosition }`. CMS only stores a URL string.

**CMS Change:** Add `imageAlt` text input and `imageObjectPosition` selector to the cover image section.

---

## 3. Ministry Taxonomy Mismatch

This is the most critical mismatch. The two systems use completely different ministry categories:

| Website (`MinistryTag`) | Website Label | CMS Equivalent |
|------------------------|---------------|----------------|
| `"young-adult"` | Young Adult | "Youth"? (loose) |
| `"adult"` | Adult | "Men"/"Women"? (no direct match) |
| `"children"` | Children | "Children"/"Kids" |
| `"high-school"` | Middle & High School | *None* |
| `"church-wide"` | Church-wide | *None* |

CMS currently has 12 free-text ministries: Worship, Youth, Kids, Outreach, Leadership, Education, Prayer, Women, Men, Children, Membership, Missions.

**Decision:** The CMS ministry options must match the website's `MinistryTag` values since these are the values that will be stored in the database and consumed by the website. The CMS should use the 5 typed ministry values from the website.

**CMS Change:** Replace the free-text ministries array with the typed `MinistryTag` values.

---

## 4. Recurrence Model Gaps

### Current CMS Recurrence Options:
- `"none"` | `"daily"` | `"weekly"` | `"monthly"` | `"yearly"` | `"weekday"` | `"custom"`

### What the Website Needs:
- `recurrenceType`: `"daily"` | `"weekly"` | `"biweekly"` | `"monthly"`
- `recurrenceDays`: Which days of the week (e.g., `["MON", "TUE", "WED", "THU", "FRI"]`)
- `recurrenceStart`: When the recurrence window begins
- `recurrenceEnd`: When the recurrence window ends (null = indefinite)

### Specific Scenarios:

#### Daily Bread (M-F every morning, indefinite)
- **CMS today:** `recurrence: "weekday"` — works, but no structured day data
- **DB needs:** `recurrenceType: "weekly"`, `recurrenceDays: ["MON","TUE","WED","THU","FRI"]`, `recurrenceEnd: null`
- **CMS fix:** When "Weekday" is selected, auto-populate `recurrenceDays` with MON-FRI

#### Evening Prayer Meeting (every day, with end date)
- **CMS today:** `recurrence: "daily"` — works, but no end date field
- **DB needs:** `recurrenceType: "daily"`, `recurrenceDays: ["MON"..."SUN"]`, `recurrenceEnd: "2026-03-08"`
- **CMS fix:** Add "Recurrence End Date" field visible for ALL recurrence types (not just custom)

#### Sunday Livestream (every Sunday, indefinite)
- **CMS today:** `recurrence: "weekly"` — works, but doesn't specify WHICH day
- **DB needs:** `recurrenceType: "weekly"`, `recurrenceDays: ["SUN"]`, `recurrenceEnd: null`
- **CMS fix:** When "Weekly" is selected, show day-of-week picker

#### Men's Bible Study (every Saturday, indefinite)
- Same pattern as Sunday Livestream but for Saturday

### Recurrence Changes Required:

1. **Show day-of-week picker** when recurrence is `"weekly"`, `"biweekly"`, or `"weekday"` (not just "custom")
2. **Add recurrence end date** visible for ALL recurring types (daily, weekly, etc.)
3. **Add recurrence end type** (never, on date) for all types
4. **Auto-compute `recurrenceSchedule`** label from the structured fields

---

## 5. Website Issues / Inconsistencies

### 5.1 Mock Data `isRecurring` Flags Are Wrong
Several events tagged `#RECURRING` in their tags have `isRecurring: false`:
- Friday Night Bible Study (`isRecurring: false` but has `#RECURRING` tag)
- CSULB Campus Bible Study (`isRecurring: false` but has `#RECURRING` tag)
- Children's Sunday School (`isRecurring: false` but has `#RECURRING` tag)
- Saturday Morning Prayer Meeting (`isRecurring: false` but has `#RECURRING` tag)
- Adult Bible Study: Book of Romans (`isRecurring: false` but has `#RECURRING` tag)

These should be `isRecurring: true` with proper recurrence fields.

### 5.2 `time` Field is Unstructured
The website stores time as a formatted string (`"7:00 PM - 9:00 PM"`) rather than structured start/end times. The CMS correctly uses separate `startTime`/`endTime` fields. The display string should be computed from the structured fields when rendering.

### 5.3 Location for Hybrid Events
Events like "Sunday Livestream" have `location: "LA UBF Main Center / YouTube Live"` — combining both the physical and online locations into one string. The CMS should allow both a physical location AND a meeting URL, with the website computing the display string.

---

## 6. Summary of CMS Changes Required

### New Fields to Add:
1. `slug` — Auto-generated from title, editable
2. `shortDescription` — Plain text (max ~200 chars) for cards
3. `campus` — `CampusTag` selector (optional)
4. `tags` — String array with tag input UI
5. `meetingUrl` — Online meeting link (always available)
6. `registrationUrl` — External registration URL
7. `links` — Array of `{ label, href, external? }`
8. `imageAlt` — Alt text for the cover image
9. `imageObjectPosition` — CSS object-position value

### Fields to Modify:
10. `ministry` — Change from free-text to typed `MinistryTag` values
11. `recurrence` — Add day-of-week picker for weekly/biweekly types
12. `recurrence` — Add end date option for ALL recurrence types (not just custom)

### Computed Fields (no form needed):
13. `isRecurring` — Derived from `recurrence !== "none"`
14. `recurrenceSchedule` — Computed display label
15. `time` display string — Computed from `startTime` + `endTime`
16. `badge` — Computed dynamically from dates

---

## 7. Recommended Form Layout

### Main Content Area:
1. **Title** (existing)
2. **Slug** (new — auto-generated, editable)
3. **Short Description** (new — plain text textarea, ~200 chars)
4. **Date & Time** (existing section)
   - Start Date, Start Time, End Time, End Date
   - Recurrence selector
   - **Day-of-week picker** (new — when weekly/biweekly selected)
   - **Recurrence end date** (new — when any recurrence selected)
5. **Location** (existing section)
   - Location type toggle (in-person / online)
   - Location/Address input
   - **Meeting URL** (new — always visible)
6. **Content** (existing section, renamed)
   - Description (rich text — maps to website `body`)
   - Welcome Message (existing)
7. **Links** (new section)
   - **Registration URL** (new)
   - **Important Links** (new — dynamic label+URL list)

### Sidebar:
1. **Organization** (existing)
   - Status (existing)
   - Event Type (existing)
   - Ministry (updated taxonomy)
   - **Campus** (new)
   - Points of Contact (existing)
   - **Tags** (new)
2. **Cover Image** (existing, enhanced)
   - Image preview (existing)
   - Upload/Generate/Library (existing)
   - **Alt Text** (new)
