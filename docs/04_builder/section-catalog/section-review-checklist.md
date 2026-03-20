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
The hero should have left align, center align, right align, and it should also have variants on where the text is, rather than just left, right, center. The text can be in the middle, or it can be different things, so maybe just have different variants for the position of the hero. I don't know how you would do this. Maybe you can create nine different versions and just show them in a grid preview, like more dialogue, but it does sound a little excessive. I don't know how to handle this. Something that's missing from the hero editor right now is the ability to do video versus carousel versus just one image. Carousel and image should be consolidated together so that if you just have one image, it just automatically shows that, but then it should also show if there are more than one image. Let's say, first of all, there should be a list dropdown showing all of those, and it should show; it is going to display as a card, for example. Make sure that the feature actually works as well, so the hero image is not just something that is on the builder, but it actually has that variant, if that makes sense. Other things are good, and we can also test it on the hero section first. Something that I want to put is a color palette, right? We have a couple of colors that we're using, and I want you to have color variants ready so that, let's say, if there is one variant, that is the current version, but there is another variant where the text is actually black and the background is white, something like that. There should be default color palettes that apply to all of the elements within this section automatically. Other things that you're forgetting are:
- Full width and split. I don't know if I understand that correctly.
- Right now it's a video URL, but technically we do have the video in the media library.
- Make sure that, when picking from video or images, the preview should actually show on the editor. Right now it's broken.
- You should be able to select from the media library.  I'm forgetting a couple of things, but essentially there should be different designs available for the hero than the current one.