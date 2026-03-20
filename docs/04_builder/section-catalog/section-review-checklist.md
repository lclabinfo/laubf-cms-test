# Section Review Checklist

> **Purpose:** Product design review of the 41-to-24 consolidation proposed in `section-design-recommendation.md`.
> **How to use:** For each proposed type, mark your decision. Add notes for anything you want to change.
> **Date started:** 2026-03-19

## Decision Key

- `[x]` = Approved as proposed
- `[-]` = Rejected / Remove from builder
- `[?]` = Need to see it rendered before deciding
- `[~]` = Approved with modifications (add notes)

---

## Hero (5 current -> 2 proposed)

### 1. Hero (merges HERO_BANNER, PAGE_HERO, TEXT_IMAGE_HERO, EVENTS_HERO)
- [ ] Approve consolidation into 1 type with 4 layout variants?
- Variants: Full-width background | Centered | Split | Simple
- [ ] Full-width background (HERO_BANNER) — keep this variant?
- [ ] Centered (PAGE_HERO) — keep this variant?
- [ ] Split (TEXT_IMAGE_HERO) — keep this variant?
- [ ] Simple (EVENTS_HERO) — keep this variant?
- Notes:

### 2. Ministry Header (keeps MINISTRY_HERO as standalone)
- [ ] Approve keeping separate from Hero?
- [ ] Should it only appear in picker for ministry-type pages?
- Notes:

---

## Content (8 current -> 6 proposed)

### 3. Image & Text (renamed from MEDIA_TEXT)
- [ ] Approve rename + keep as-is?
- Notes:

### 4. Quote (renamed from QUOTE_BANNER)
- [ ] Approve rename + keep as-is?
- Notes:

### 5. Call to Action (keeps CTA_BANNER)
- [ ] Approve keep as-is?
- Notes:

### 6. About (renamed from ABOUT_DESCRIPTION)
- [ ] Approve rename + keep as-is?
- Notes:

### 7. Statement (keeps STATEMENT)
- [ ] Approve keep as-is?
- Notes:

### 8. Photo Gallery (keeps PHOTO_GALLERY, moved from Layout to Content)
- [ ] Approve recategorize to Content?
- Notes:

---

## Cards (6 current -> 4 proposed)

### 9. Card Grid (merges ACTION_CARD_GRID + PATHWAY_CARD)
- [ ] Approve consolidation into 1 type with 2 style variants?
- Variants: Image cards | Icon cards
- [ ] Image cards (ACTION_CARD_GRID) — keep this variant?
- [ ] Icon cards (PATHWAY_CARD) — keep this variant?
- Notes:

### 10. Feature List (renamed from FEATURE_BREAKDOWN)
- [ ] Approve rename + keep as-is?
- Notes:

### 11. Alternating Content (renamed from PILLARS)
- [ ] Approve rename?
- Notes:

### 12. Welcome Banner (renamed from NEWCOMER)
- [ ] Approve rename + keep as-is?
- Notes:

---

## Dynamic Content (8 current -> 5 proposed)

### 13. Content Listing (merges ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS)
- [ ] Approve consolidation into 1 type with data source dropdown?
- Data sources: Messages | Events | Bible Studies | Videos
- [ ] Comfortable with data source dropdown changing the rendered component?
- Notes:

### 14. Featured Content (merges SPOTLIGHT_MEDIA, HIGHLIGHT_CARDS, MEDIA_GRID)
- [ ] Approve consolidation into 1 type with 3 style variants?
- Variants: Spotlight | Highlight cards | Video grid
- Notes:

### 15. Upcoming Events (keeps UPCOMING_EVENTS)
- [ ] Approve keep as-is?
- Notes:

### 16. Event Calendar (keeps EVENT_CALENDAR)
- [ ] Approve keep as-is?
- Notes:

### 17. Recurring Meetings (merges RECURRING_MEETINGS + QUICK_LINKS)
- [ ] Approve consolidation into 1 type with 2 layout variants?
- Variants: List | Carousel
- Notes:

---

## People & Places (6 current -> 3 proposed)

### 18. Team (renamed from MEET_TEAM)
- [ ] Approve rename + keep as-is?
- Notes:

### 19. Location (merges LOCATION_DETAIL, MINISTRY_SCHEDULE, CAMPUS_CARD_GRID, RECURRING_SCHEDULE)
- [ ] Approve consolidation into 1 type with variants?
- Variants: Detail | Schedule | Card grid | Weekly schedule
- [ ] Should RECURRING_SCHEDULE stay standalone instead?
- Notes:

### 20. Ministry Intro (merges MINISTRY_INTRO + DIRECTORY_LIST)
- [ ] Approve consolidation into 1 type with 2 variants?
- Variants: Single | Directory
- Notes:

---

## Utility (3 proposed)

### 21. FAQ (renamed from FAQ_SECTION)
- [ ] Approve rename + keep as-is?
- Notes:

### 22. Timeline (renamed from TIMELINE_SECTION)
- [ ] Approve rename + keep as-is?
- Notes:

### 23. Contact Form (renamed from FORM_SECTION, moved from Interactive)
- [ ] Approve rename + recategorize?
- Notes:

---

## Embed (2 current -> 1 proposed)

### 24. Custom Embed (merges CUSTOM_HTML + CUSTOM_EMBED)
- [ ] Approve consolidation into 1 type with mode toggle?
- Modes: HTML | URL (iframe)
- Notes:

---

## Excluded from Picker

| Type | Proposed Disposition | Agree? |
|---|---|---|
| FOOTER | Site settings only, not per-page | [ ] |
| NAVBAR | Layout-handled, already excluded | [ ] |
| DAILY_BREAD_FEATURE | Hidden until component exists | [ ] |

---

## Global Questions

- [ ] Should the variant selector use visual thumbnails or just text labels?
- [ ] Should any sections be gated to specific page types (e.g., Ministry Header only on ministry pages)?
- [ ] Any sections you want to ADD that don't exist yet?
- Notes:

---

## Summary (fill after review)

| Decision | Count |
|---|---|
| Approved as-is | |
| Approved with mods | |
| Rejected / Remove | |
| Need to see first | |
| **Total** | **/24** |






===================================================

My Notes:
1. Hero:
Can I ask you to do quick research on the namings of this? Because the hero section is usually just on the home page, it feels like. What do they call hero sections for other pages? Like, what? Do you just call them a heading banner? Right now it feels a little confusing that we are merging all of the page heroes, like events here or whatnot. I understand why we're consolidating them, but then if we don't consolidate the ministry here, it feels a little weird in that sense. I want you to find a better way to consolidate this, or at least try to come up with a bunch of different options and have me pick. One of the things I'm thinking about is just having one hero for the homepage, just one hero section, and then having different page headers. Right now, the events/messages/all of those things have the same exact design, I'm pretty sure. One's with the actual CMS library things. That can be one, and then maybe the ministry hero. I don't know how to deal with this exactly. I think the ministry hero should be a separate thing for sure; it's a specialized header, but then it does feel weird that it's a hero quote-unquote. I want you to research all of the different website builders that are currently existing and just audit and report to me with a table of competitor research for the terms.And in addition to not just the hero, I want you to do this audit in general according to the @section-design-recommendation.md   Go through all of the terms that we are suggesting for the @section-design-recommendation.md    and do full research on all of them for all of the website builders. Some popular website builders like Squarespace, Shopify, and Framer are the top three priorities, and review Wix workflow (I mean a web flow) and just verify the namings for these, because I think the standardization is going to be a really important factor here.But do make sure also that ministry-specific things aren't going to be ministry, but it looks like some of the Christian church-specific sections are not actually Christian-specific. Yes, there are things like that that are more specific, but it mainly feels like it's not really that specific right now. Yeah, I don't know. I'll just review that as well.Do note that, in all of this, your primary user persona is like the user profile file that we have. It's small pastors and smaller churches.