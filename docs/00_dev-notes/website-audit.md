# Website Full Audit — 2026-03-11

Comprehensive audit of all pages under `/website` for LA UBF, covering layout/padding, content accuracy, images/duplicates, and responsive/mobile design.

---

## 1. Layout & Padding Issues

### 1a. All Events / All Messages / All Bible Studies — Missing `pt-0` Override
**Severity: HIGH**

The reference implementation (`laubf-test`) uses `className="pt-0 py-30"` on the SectionContainer for these full-page listing sections. The root project likely uses default padding, causing extra top space above the filter toolbar.

**Files:**
- `components/website/sections/all-events.tsx` (delegates to client)
- `components/website/sections/all-messages.tsx` (delegates to client)
- `components/website/sections/all-bible-studies.tsx` (delegates to client)

**Fix:** Add `className="pt-0 py-30"` or equivalent to the SectionContainer in each client component.

### 1b. All Videos — Different Padding Approach
**Severity: LOW**

Root uses `paddingY="none" + pb-24 lg:pb-30`, reference uses default paddingY + `pt-0 py-30`. Both produce bottom-only padding but via different mechanisms. Functionally equivalent.

### 1c. Hero Banner — Feature Parity Gap
**Severity: LOW**

- Root accepts `.webm` videos + has fallback gradient (improvement over reference)
- Reference has `showSubheading` toggle that root lacks
- No visual difference currently since seed data doesn't use the toggle

---

## 2. Responsive / Mobile Issues

### 2a. Highlight Cards — Dynamic Item Count (Featured Events)
**Severity: HIGH**

Grid uses `lg:grid-cols-2` (1 large + 2 stacked small). With only 1 event, should display full-width single card instead of the 2-column layout. With 2 events, layout is awkward.

**File:** `components/website/sections/highlight-cards.tsx` (line 68)
**Fix:** Add conditional grid classes based on item count: 1 item = full width, 2 items = `grid-cols-2`, 3+ = current layout.

### 2b. Media Grid — Items Not Centered for Small Counts
**Severity: MEDIUM**

Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` left-aligns items. With 1-2 videos on desktop, empty grid slots leave awkward whitespace.

**File:** `components/website/sections/media-grid.tsx` (line 61)
**Fix:** Use flexbox with centering or CSS Grid `auto-fit` for small counts.

### 2c. Pathway Card — Single/Double Items Not Centered
**Severity: MEDIUM**

Grid `grid-cols-1 md:grid-cols-3`. With 1-2 cards on desktop, items left-align in a 3-col grid.

**File:** `components/website/sections/pathway-card.tsx` (line 60)
**Fix:** Center items when count < 3.

### 2d. Text Image Hero — Fixed Wide Aspect Ratio on Mobile
**Severity: MEDIUM**

`aspect-[16/7]` creates a very wide/short image on mobile (375px wide = ~168px tall). Looks squished.

**File:** `components/website/sections/text-image-hero.tsx` (line 50)
**Fix:** `aspect-[4/3] md:aspect-[16/7]` for taller mobile image.

### 2e. Photo Gallery — No Mobile Scroll Hint
**Severity: LOW**

Horizontal carousel with `w-[300px]` fixed-width items. No visual indicator that content is scrollable on mobile.

**File:** `components/website/sections/photo-gallery.tsx` (line 55)
**Fix:** Add fade gradient edges or reduce to `w-[280px]`.

### 2f. Feature Breakdown — Hardcoded 80% Width on Mobile
**Severity: LOW**

`w-[80%] sm:w-full` restricts mobile width unnecessarily.

**File:** `components/website/sections/feature-breakdown.tsx` (line 42)
**Fix:** `w-full px-4 sm:px-0`.

### 2g. Event Card — Min Height Too Tall on Mobile
**Severity: LOW**

`min-h-[280px]` on small event cards may be too tall for mobile content.

**File:** `components/website/shared/event-card.tsx` (line 34)
**Fix:** `min-h-[240px] sm:min-h-[280px]`.

### 2h. Pillars — Column Split Only at `lg`
**Severity: LOW**

Alternating layout uses `lg:flex-row` but could benefit from `md:flex-row` for better tablet experience.

**File:** `components/website/sections/pillars.tsx` (line 93)

### 2i. Campus Card Grid — Flex Wrap Not Constrained
**Severity: LOW**

`flex flex-wrap justify-center` with many campus cards creates very long vertical scroll on mobile.

**File:** `components/website/sections/campus-card-grid.tsx` (line 116)

---

## 3. Content Accuracy Issues

### 3a. "Coming soon." Placeholder Descriptions — 10 Campus Pages
**Severity: HIGH**

All campus ministry pages except LBCC have `description: 'Coming soon.'` instead of real descriptions.

**Pages affected:** CSULB, CSUF, UCLA, USC, CSUDH, CCC, Mt. SAC, Golden West, Cypress, Cal Poly Pomona

**File:** `prisma/seed.mts` — MINISTRY_INTRO sections for each campus page

### 3b. "Leader name" & "Bio here" Placeholders — 27+ Instances
**Severity: HIGH**

- **16 instances of "Leader name"** on College, Adults, High School, and Children ministry pages
- **28 instances of "Bio here"** across ALL ministry + campus pages
- Campus pages have real leader names but still "Bio here" for bios

**File:** `prisma/seed.mts` — MEET_TEAM sections

### 3c. Giving Page — Intentionally Incomplete
**Severity: LOW**

Page shows "This page is coming soon." — acceptable as a planned feature.

### 3d. All Other Content — Accurate
- Homepage: Complete and accurate (2026 spiritual direction theme, real campus list, etc.)
- About page: Real statement of faith, 3 pillars, mission/vision
- I'm New page: Correct address, service times, FAQs
- Ministry descriptions: Authentic LA UBF content
- All database-driven sections (messages, events, videos, bible studies) working correctly

---

## 4. Image Issues

### 4a. Placeholder Team Photos — 3 Images Reused 31+ Times
**Severity: HIGH**

| Image | Uses | Context |
|---|---|---|
| `DSC05222.jpg` | 15 | Team carousels across all 15 ministry pages |
| `DSC05299.jpg` | 9 | Team carousels, discipleship sections |
| `DSC01195.jpg` | 7 | Team carousels, fellowship sections |

Same photos labeled as different people across different ministry/campus pages.

### 4b. Duplicate Images Across Pages
**Severity: MEDIUM**

Several images used on 4+ pages (intentional reuse for shared sections like campus grid CTA, newcomer CTA):

| Image | Uses | Context |
|---|---|---|
| `images-ministries-join-campus-ministry-section-compressed-1.jpg` | 4 | Campus grid decorative |
| `images-ministries-join-campus-ministry-section-compressed-2.jpg` | 4 | Campus grid decorative |
| `images-home-compressed-sunday-worship.jpg` | 4 | Homepage, About, Giving, Ministries |
| `compressed-3.png` | 4 | Campus grid decorative |

### 4c. Generic Alt Text
**Severity: MEDIUM**

- 36+ instances of "Leader name" alt text
- "YAM moment 1-10" in Young Adult carousel (generic numbering)
- "Youth ministry moment 1-5" (generic)
- "Fellowship" (too vague)

### 4d. URL Encoding Inconsistencies
**Severity: LOW**

Some filenames use `%20` for spaces: `compressed-bible%20study.jpg`, `images-who%20we%20are-compressed-header.jpg`, `compressed-child%20care.jpg`. Functional but inconsistent with hyphenated naming elsewhere.

### 4e. Image Stats
- **69 unique images** across all seeded pages
- **280+ total image references**
- **1 video file** (hero-vid.mp4 with .webm variant)
- **CDN:** `https://pub-91add7d8455848c9a871477af3249f9e.r2.dev/la-ubf/initial-setup`

---

## 5. Priority Fix Matrix

| # | Issue | Severity | Category | Effort | Status |
|---|---|---|---|---|---|
| 1 | Highlight cards grid doesn't adapt to 1-2 items | HIGH | Responsive | Small | FIXED |
| 2 | All Events/Messages/BibleStudies padding top | HIGH | Layout | Small | NO CHANGE NEEDED (already uses `paddingY="none"`) |
| 3 | "Coming soon." on 10 campus pages | HIGH | Content | Medium | FIXED (generic intro text in seed) |
| 4 | "Leader name" / "Bio here" placeholders | HIGH | Content | Medium | MITIGATED (meet-team hides if all placeholders; "Bio here" suppressed) |
| 5 | 3 placeholder team photos reused 31+ times | HIGH | Images | Medium | DEFERRED (needs real photos from leadership) |
| 6 | Media grid / pathway card not centering few items | MEDIUM | Responsive | Small | FIXED |
| 7 | Text image hero aspect ratio on mobile | MEDIUM | Responsive | Small | FIXED |
| 8 | Generic alt text (36+ instances) | MEDIUM | Images | Small | PARTIALLY FIXED (12 "Leader name" → "Team member" in seed) |
| 9 | Duplicate decorative images across pages | MEDIUM | Images | Low | NO CHANGE NEEDED (intentional reuse) |
| 10 | Photo gallery no scroll hint | LOW | Responsive | Small | FIXED (smaller items on mobile) |
| 11 | Feature breakdown 80% width | LOW | Responsive | Small | FIXED |
| 12 | Event card min-height on mobile | LOW | Responsive | Small | FIXED |
| 13 | Pillars tablet breakpoint | LOW | Responsive | Small | DEFERRED |
| 14 | URL encoding inconsistencies | LOW | Images | Low | DEFERRED |
| 15 | Giving page placeholder | LOW | Content | Deferred | DEFERRED |

---

## Fix Details (2026-03-11)

**#1 — highlight-cards.tsx:** Conditional rendering: 1 item = full-width large card, 2 items = equal 2-col grid, 3+ = original 1-large + 2-small layout.

**#2 — No change needed:** All three sections already use `paddingY="none"` which is equivalent to the reference's `pt-0 py-30`.

**#3 — seed.mts:** Replaced 10 "Coming soon." campus descriptions with: "Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ."

**#4 — meet-team.tsx:** Section returns `null` if all members have name "Leader name". Bio text hidden if value is "Bio here".

**#6 — media-grid.tsx + pathway-card.tsx:** Switched to flexbox with `justify-center` when fewer than 3 items.

**#7 — text-image-hero.tsx:** `aspect-[16/7]` → `aspect-[4/3] md:aspect-[16/7]` for taller mobile image.

**#8 — seed.mts:** Changed 12 instances of `alt: 'Leader name'` → `alt: 'Team member'` in ministry page team sections.

**#10 — photo-gallery.tsx:** Item width `w-[300px]` → `w-[280px] sm:w-[300px]` for better mobile fit.

**#11 — feature-breakdown.tsx:** Removed `w-[80%] sm:w-full`, replaced with `w-full`.

**#12 — event-card.tsx:** Small variant `min-h-[280px]` → `min-h-[240px] sm:min-h-[280px]`.

---

## Notes

- Content issues (#5) require real photos from LA UBF leadership — cannot be auto-fixed
- All database-driven sections (messages, events, videos, bible studies, daily bread) are correctly connected and rendering from the DB
- Layout/footer/navbar are correctly reading from SiteSettings
- Theme system (colors, fonts) working correctly via ThemeProvider
