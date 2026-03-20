# Future Section Consolidation Guide

> **Date:** 2026-03-19
> **Status:** Research complete. Not scheduled for implementation.
> **Purpose:** When we're ready to reduce the section picker from 41 types to fewer, this doc evaluates each proposed merge on actual field overlap, visual similarity, and editor complexity — not just naming.
> **Prerequisite:** All sections should be individually reviewed and working before any consolidation.

---

## Evaluation Criteria

Every proposed consolidation is evaluated on 4 dimensions:

1. **Field overlap** — What % of content fields are shared between the types being merged? High overlap = good candidate.
2. **Visual similarity** — Would a user look at both variants and say "those are the same kind of section"?
3. **Editor complexity** — How much conditional show/hide logic would the merged editor need? More conditions = worse UX.
4. **User confusion** — Does having both types in the picker confuse the user, or are they clearly different?

**Consolidation threshold:** Merge only when field overlap is >60%, visuals are recognizably similar, and the merged editor stays simpler than having two separate entries in the picker.

---

## Tier 1: Strong Candidates (merge when ready)

### Content Listing — merge ALL_MESSAGES + ALL_EVENTS + ALL_BIBLE_STUDIES + ALL_VIDEOS

**Field comparison:**

| Field | ALL_MESSAGES | ALL_EVENTS | ALL_BIBLE_STUDIES | ALL_VIDEOS |
|---|---|---|---|---|
| `heading` | Y | Y | Y | Y |
| `ctaLabel` | Y | Y | Y | Y |
| `ctaHref` | Y | Y | Y | Y |
| `dataSource` | `all-messages` | `all-events` | `all-bible-studies` | `all-videos` |

**Field overlap: 100%.** All four types have identical editor fields. The only difference is the `dataSource` string value, which determines which CMS data populates the section.

**Visual similarity:** All render as searchable/filterable grids. The grid card design differs (sermon card vs event card vs study card vs video card), but that's handled by the rendering component, not the editor.

**Editor complexity:** Zero additional complexity. Replace the four types with one, add a "Content Type" dropdown (Messages / Events / Bible Studies / Videos) that sets the `dataSource` value.

**User confusion:** High — a pastor adding a content section currently has to know the difference between ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, and ALL_VIDEOS. They'd rather pick "Content Listing" and choose the data source.

**Where to see them:** Messages `/messages` (s2), Events `/events` (s2), Bible Study `/bible-study` (s2), Videos `/videos` (s2)

**Verdict: MERGE.** The strongest consolidation candidate. Saves 3 picker slots with zero editor complexity cost.

**Implementation:** The DB still writes `ALL_MESSAGES`, `ALL_EVENTS`, etc. The picker shows one "Content Listing" entry. After selection, a data source dropdown writes the correct `SectionType` to the DB.

---

### Custom Embed — merge CUSTOM_HTML + CUSTOM_EMBED

**Field comparison:**

| Field | CUSTOM_HTML | CUSTOM_EMBED |
|---|---|---|
| `html` (textarea) | Y | — |
| `embedUrl` | — | Y |
| `title` | — | Y |
| `aspectRatio` | — | Y |

**Field overlap: 0% shared fields.** But they serve the identical user intent: "I want to embed something custom."

**Visual similarity:** Both render external/custom content in the page. One is raw HTML, the other is an iframe.

**Editor complexity:** Low. Tab toggle or radio: "HTML" shows the HTML textarea, "URL" shows the embed URL + aspect ratio fields. Mutually exclusive — no conditional field logic.

**User confusion:** Moderate — a pastor who wants to embed a YouTube video shouldn't need to decide between "Custom HTML" and "Custom Embed."

**Where to see them:** Neither is seeded on any page.

**Verdict: MERGE.** Despite 0% field overlap, the merge is clean because the fields are mutually exclusive (tab/radio toggle). One picker slot instead of two.

---

### Recurring Meetings — merge RECURRING_MEETINGS + QUICK_LINKS

**Field comparison:**

| Field | RECURRING_MEETINGS | QUICK_LINKS |
|---|---|---|
| `heading` | Y | Y |
| `subtitle` | — | Y |
| `maxVisible` | Y (1-20) | — |
| `viewAllHref` | Y | — |
| `dataSource` | `upcoming-events` | (implicit, same source) |

**Field overlap: ~40% shared, but same data source.** Both pull from the same CMS data (recurring events). The difference is layout: vertical list vs horizontal carousel.

**Visual similarity:** Low visually — one is a list, one is a carousel. But they answer the same user question: "Show our recurring meetings."

**Editor complexity:** Low. Layout toggle (List / Carousel). List shows `maxVisible` + `viewAllHref`. Carousel shows `subtitle`. Clean conditional.

**User confusion:** High — a pastor wouldn't know why "Recurring Meetings" and "Quick Links" are different sections when they show the same data.

**Where to see them:** Neither is seeded on any page currently.

**Verdict: MERGE.** Same data, same intent, clean layout toggle.

---

## Tier 2: Reasonable Candidates (merge with caution)

### Featured Content — merge SPOTLIGHT_MEDIA + HIGHLIGHT_CARDS + MEDIA_GRID

**Field comparison:**

| Field | SPOTLIGHT_MEDIA | HIGHLIGHT_CARDS | MEDIA_GRID |
|---|---|---|---|
| `heading` / `sectionHeading` | Y | Y | Y |
| `ctaLabel` / `ctaHref` | — | Y | Y |
| `dataSource` | `latest-message` | `featured-events` | `latest-videos` |
| `subheading` | — | Y | — |
| `sermon.*` (6 fields) | Y | — | — |
| `featuredEvents` (array) | — | Y | — |
| `videos` (array) | — | — | Y |
| `count` | — | — | Y |

**Field overlap: ~20% (only heading).** Each type has substantially different content fields because they display different CMS data in different layouts.

**Visual similarity:** Low.
- SPOTLIGHT_MEDIA = single large featured sermon card. **Home** `/` (s8), **Messages** `/messages` (s1)
- HIGHLIGHT_CARDS = 1 large + 2 small event cards. **Home** `/` (s3)
- MEDIA_GRID = grid of video thumbnails. **Home** `/` (s9)

**Editor complexity:** High. The merged editor would need 3 variant-specific field sets with almost no overlap. Essentially 3 editors behind a toggle.

**User confusion:** Low — these look quite different and serve different purposes. A pastor probably wouldn't confuse them.

**Verdict: DEFER / RECONSIDER.** The field overlap is too low and the visual treatments are too different. Merging these would create a complex editor with 3 nearly-independent field sets behind a toggle. The picker clarity gain (3 → 1) doesn't justify the editor complexity cost. Consider keeping them separate but renaming them to be clearer:
- SPOTLIGHT_MEDIA → "Featured Message"
- HIGHLIGHT_CARDS → "Featured Events"
- MEDIA_GRID → "Video Grid"

---

### Location — merge LOCATION_DETAIL + MINISTRY_SCHEDULE + CAMPUS_CARD_GRID (+RECURRING_SCHEDULE?)

**Field comparison:**

| Field | LOCATION_DETAIL | MINISTRY_SCHEDULE | CAMPUS_CARD_GRID | RECURRING_SCHEDULE |
|---|---|---|---|---|
| `heading` | — | Y | Y | Y |
| `overline` | Y | — | Y | — |
| `description` | — | Y | Y | — |
| `subtitle` | — | — | — | Y |
| `timeLabel` + `timeValue` | Y | — | — | — |
| `locationLabel` | Y | — | — | — |
| `address` (array) | Y | — | — | — |
| `directionsUrl` + `directionsLabel` | Y | — | — | — |
| `images` (array) | Y | — | — | — |
| `scheduleEntries` (array: day/time/location) | — | Y | — | — |
| `buttons` (array: label/href/variant) | — | Y | — | — |
| `campuses` (array: name/href/image) | — | — | Y | — |
| `decorativeImages` | — | — | Y | — |
| `meetings` (array: title/desc/time/days/location) | — | — | — | Y |

**Field overlap: ~10%.** Almost no shared fields beyond heading/description. Each type has a completely unique field set.

**Visual similarity:** Low.
- LOCATION_DETAIL = two-column address + service time + directions. **I'm New** `/im-new` (s5)
- MINISTRY_SCHEDULE = two-column schedule entries + CTA buttons. **Children** `/ministries/children` (s3)
- CAMPUS_CARD_GRID = grid of campus photo cards. **Ministries** `/ministries` (s3), **I'm New** `/im-new` (s6)
- RECURRING_SCHEDULE = card grid with day pills + time badges. Not seeded.

**Editor complexity:** Very high. Four completely different field sets behind a variant toggle. Essentially 4 independent editors.

**User confusion:** Low — these are visually distinct and serve different needs. A pastor looking for "show our address" vs "show campus cards" wouldn't confuse them.

**Verdict: DO NOT MERGE.** The original recommendation was based on shared *intent* ("where/when can people find us?") but the fields and visuals are too different. Merging would create a confusing editor. Keep all 4 separate. Consider renaming for clarity:
- LOCATION_DETAIL → "Location" (already proposed)
- MINISTRY_SCHEDULE → "Schedule" (clearer than "Ministry Schedule")
- CAMPUS_CARD_GRID → "Campus Cards" (already clear)
- RECURRING_SCHEDULE → "Weekly Schedule"

---

### Ministry Intro — merge MINISTRY_INTRO + DIRECTORY_LIST

**Field comparison:**

| Field | MINISTRY_INTRO | DIRECTORY_LIST |
|---|---|---|
| `heading` | Y | Y |
| `overline` | Y | — |
| `description` | Y | — |
| `image` (single) | Y | — |
| `items` (array: label/href/description) | — | Y |
| `image.src` + `image.alt` (background) | — | Y |
| `ctaHeading` | — | Y |
| `ctaButton` (label/href) | — | Y |

**Field overlap: ~15% (heading only).** Very different content structures.

**Visual similarity:** Low.
- MINISTRY_INTRO = heading + description + side image, simple intro block. **College** `/ministries/college` (s2)
- DIRECTORY_LIST = parallax background, linked item list with hover effects, bottom CTA. **Home** `/` (s7)

**Editor complexity:** Moderate. Two mostly-independent field sets.

**User confusion:** Low — these look and behave very differently.

**Verdict: DO NOT MERGE.** Low field overlap, visually distinct, low user confusion as separate items. Keep separate.

---

## Tier 3: Previously Proposed, Now Rejected

### Card Grid — merge ACTION_CARD_GRID + PATHWAY_CARD

**Field comparison:**

| Field | ACTION_CARD_GRID | PATHWAY_CARD |
|---|---|---|
| Section `heading` | Y (3-line: line1/line2/line3) | Y (single string) |
| Section `description` | — (`subheading`) | Y |
| Section CTA | Y (`ctaButton.label/href`) | — |
| **Card: title** | Y | Y |
| **Card: description** | Y | Y |
| Card: `imageUrl` | Y | — |
| Card: `href` (link) | Y | — |
| Card: `icon` | — | Y |
| Card: `buttonLabel` | — | Y |
| Card: `buttonHref` | — | Y |
| Card: `buttonVariant` | — | Y |

**Field overlap: ~30%.** The section-level fields differ (3-line heading vs single heading, different CTA patterns). The card-level fields share title + description but diverge on the primary content (image vs icon) and interaction (link vs button).

**Visual similarity:** Low.
- ACTION_CARD_GRID = 2x2 grid with cover photos. **Home** `/` (s6)
- PATHWAY_CARD = vertical stack with icons + buttons. **I'm New** `/im-new` (s3)

**Editor complexity:** High. The heading structures are incompatible (3-line vs single), and the card sub-forms would need conditional fields (image picker vs icon picker, link vs button). The merged editor would be *more* confusing than two separate entries.

**User confusion:** Low — a pastor adding image cards vs icon cards is making a clear visual choice.

**Verdict: DO NOT MERGE.** Different heading structure, different card fields, different visual output. Keeping separate is clearer. (Raised by David during review — confirmed by field analysis.)

---

### Upcoming Events + Event Calendar

Already noted as "do not merge" in the cross-reference. Different UI, different purpose.
- UPCOMING_EVENTS = event card grid with CTA. **College** `/ministries/college` (s7)
- EVENT_CALENDAR = interactive calendar with month/list toggle. **Home** `/` (s4)

**Verdict: DO NOT MERGE.** Visually and functionally distinct.

---

## Summary

| Proposed Consolidation | Types Merged | Field Overlap | Verdict | Picker Slots Saved |
|---|---|---|---|---|
| Content Listing | ALL_MESSAGES + ALL_EVENTS + ALL_BIBLE_STUDIES + ALL_VIDEOS | 100% | **MERGE** | 3 |
| Custom Embed | CUSTOM_HTML + CUSTOM_EMBED | 0% but mutually exclusive | **MERGE** | 1 |
| Recurring Meetings | RECURRING_MEETINGS + QUICK_LINKS | 40% + same data | **MERGE** | 1 |
| Featured Content | SPOTLIGHT_MEDIA + HIGHLIGHT_CARDS + MEDIA_GRID | 20% | **DEFER** — rename instead | 0 |
| Location | LOCATION_DETAIL + MINISTRY_SCHEDULE + CAMPUS_CARD_GRID + RECURRING_SCHEDULE | 10% | **DO NOT MERGE** — rename instead | 0 |
| Ministry Intro | MINISTRY_INTRO + DIRECTORY_LIST | 15% | **DO NOT MERGE** | 0 |
| Card Grid | ACTION_CARD_GRID + PATHWAY_CARD | 30% | **DO NOT MERGE** | 0 |
| Events sections | UPCOMING_EVENTS + EVENT_CALENDAR | Different UI entirely | **DO NOT MERGE** | 0 |

**Net result if all Tier 1 merges are done:** 41 types → 36 in the picker (saves 5 slots). Combined with the Hero/Page Header split (already decided) and renames, the picker would show ~36 well-named types instead of 41 confusingly-named ones.

This is a smaller reduction than the original 41 → 24 proposal, but it's **honest** — the remaining types are genuinely different sections that would create worse editors if merged.

---

## When to Revisit

Revisit this doc when:
- All section editors are reviewed and working
- The rename/recategorize pass (Phase 1) is complete
- You have real user feedback from pastors using the builder
- If pastors report confusion about which section to pick, that's the signal to merge
