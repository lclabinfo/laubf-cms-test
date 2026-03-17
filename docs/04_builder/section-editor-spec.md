# Section Editor Specification

> **Updated**: March 17, 2026
> **Purpose**: Maps what each section editor currently exposes vs. what it SHOULD expose.
> **Status**: Draft for David's review. Mark decisions inline, then implement.

---

## How to Read This Document

For each section:
- **Currently Exposed** = what the editor form shows today (verified against code)
- **Should Be Editable** = recommended fields based on product principles + component capabilities
- **Gap** = what needs to be added, removed, or changed
- **Effort** = estimated implementation time

### Product Principles Applied

1. **Expose what the component renders.** If the component reads `content.description` but the editor doesn't show it, the user can't edit it. Every rendered field must be editable.
2. **Don't expose internal mechanics.** Animation speeds, parallax depths, rotation timings — these are design decisions, not user decisions. Church admins don't want to tune animation easing curves.
3. **Data-driven sections need minimal editing.** CMS content auto-populates. The builder only controls headings, CTAs, and display limits.
4. **Group as Content + Design.** Content fields (text, images, links) are primary. Design fields (layout variant, color override) are secondary — collapse by default.
5. **One-time setup tolerance.** Users write section text once. Forms are acceptable for this. Don't over-optimize text entry.
6. **No hardcoded URLs.** Every URL the component renders must come from editable content, not code.

---

## Shared Display Settings (All Sections)

These are already implemented and apply to every section via the Display tab.

| Setting | Type | Options | Status |
|---|---|---|---|
| Color Scheme | Radio | LIGHT, DARK | Done |
| Vertical Padding | Select | NONE, COMPACT, DEFAULT, SPACIOUS | Done |
| Container Width | Select | NARROW, STANDARD, FULL | Done |
| Animations | Switch | on/off | Done |
| Visible | Switch | on/off | Done |
| Section Label | Text | admin-only label | Done |

**Recommendation**: Color Scheme should eventually become a palette selector (Light, Dark, Brand Primary, Brand Accent, Muted) but binary light/dark is fine for Phase 1. The current implementation is correct for now.

---

## A. Hero Sections (5)

### 1. HERO_BANNER

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Heading Line 1 | Text input | Text input | None |
| Heading Line 2 | Text input | Text input | None |
| Subheading | Textarea | Textarea | None |
| Background Media | Image picker | Image picker + Video URL input | **Add**: Video URL field. Component supports both image and video (`.mp4`/`.webm`). Currently the video is hardcoded to an R2 URL. |
| Primary Button | Label + href + visible | Label + href + visible | None |
| Secondary Button | Label + href + visible | Label + href + visible | None |
| Background Image Alt | Alt text + object position | Alt text + object position | None |

**Hardcoded to fix**: Background video URL (`compressed-hero-vid.webm`) must come from `content.backgroundVideoUrl` instead of being hardcoded in the component.

**Effort**: Small — add one text input for video URL, update component to read from content.

---

### 2. PAGE_HERO

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Heading | Text input | Text input | None |
| Primary Button | Label + href + visible | Label + href + visible | None |
| Secondary Button | Label + href + visible | Label + href + visible | None |
| Floating Images | Not exposed (JSON only) | **Remove from editor** | **Decision**: Floating images are a design element (orbital animation with stagger/rotation). Church admins should not configure this. Seed with sensible defaults. If a church wants different floating images, they can use the JSON tab. |

**Recommendation**: This section is essentially complete. The floating images are decorative and complex — exposing them would overwhelm the user for zero practical benefit. Leave as JSON-only.

**Effort**: None — already correct.

---

### 3. TEXT_IMAGE_HERO

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Heading Line 1 | Text input | Text input | None |
| Heading Accent | Text input | Text input | None |
| Description | Textarea | Textarea | None |
| Text Alignment | Button group (L/C/R) | Button group (L/C/R) | None |
| Hero Image | Image picker + alt + position | Image picker + alt + position | None |

**Status**: Complete. All fields the component renders are exposed.

**Effort**: None.

---

### 4. EVENTS_HERO

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Heading | Text input | Text input | None |
| Subtitle | Textarea | Textarea | None |

**Status**: Complete. This is a minimal section by design.

**Effort**: None.

---

### 5. MINISTRY_HERO

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Heading | Textarea (multi-line) | Textarea (multi-line) | None |
| Heading Style | Button group (display/sans) | Button group (display/sans) | None |
| CTA Button | Label + href + visible | Label + href + visible | None |
| Hero Image | Image picker + alt + position | Image picker + alt + position | None |
| Social Links | Not exposed (JSON only) | Array editor: platform dropdown + URL | **Add**: Social links editor. Component renders these prominently (email, Instagram, Facebook, website icons). Used on all campus pages. Church admins need to set their ministry's social links. |

**Gap**: Social links are the only missing piece. The component renders them with icon mapping, so the editor needs a simple array with platform dropdown (email, instagram, facebook, youtube, website) + URL text input.

**Effort**: Medium — build a small social links array editor.

---

## B. Content Sections (6)

### 6. MEDIA_TEXT

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Heading | Text input | Text input | None |
| Body | Textarea | Textarea | None |
| CTA Button | Label + href + visible | Label + href + visible | None |
| Images | Not exposed (JSON only) | Image array editor (add/remove/reorder) | **Add**: The component renders a rotating image wheel (desktop) or carousel (mobile) from `content.images[]`. This is core visual content — the user must be able to set which images appear. |
| Rotation Speed | Not exposed | **Do NOT expose** | Internal design parameter. Default (3s) is fine. |

**Gap**: Image array editor is the main missing piece. Should support add/remove/reorder with image picker per item.

**Effort**: Medium — uses the reusable image array editor pattern.

---

### 7. QUOTE_BANNER

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Heading | Text input | Text input | None |
| Verse Text | Textarea | Textarea | None |
| Verse Reference | Text input | Text input | None |

**Status**: Complete.

**Effort**: None.

---

### 8. CTA_BANNER

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Heading | Text input | Text input | None |
| Body | Textarea | Textarea | None |
| Background Image | Image picker | Image picker | None |
| Primary Button | Label + href + visible | Label + href + visible | None |
| Secondary Button | Label + href + visible | Label + href + visible | None |

**Status**: Complete.

**Effort**: None.

---

### 9. ABOUT_DESCRIPTION

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Logo Image | Image picker | Image picker | None |
| Heading | Text input | Text input | None |
| Description | Textarea | Textarea | None |
| Video URL | Text input | Text input | None |
| Video Title | Text input | Text input | None |

**Status**: Complete.

**Effort**: None.

---

### 10. STATEMENT

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Heading | Text input | Text input | None |
| Lead-In Text | Text input | Text input | None |
| Show Cross Icon | Toggle switch | Toggle switch | None |
| Paragraphs | Array editor (add/remove with textarea) | Array editor (add/remove with textarea) | None |

**Status**: Complete. The paragraph array editor is already built.

**Hardcoded to fix**: The component uses a `cross.png` mask image URL. This should come from content or be removed. However, this is purely decorative and doesn't need editor exposure — just make the URL configurable in the component code (read from content with fallback to default).

**Effort**: Tiny — just update component to read mask image from content with fallback.

---

### 11. SPOTLIGHT_MEDIA (Hybrid: CMS + Builder)

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Section Heading | Text input | Text input | None |
| Featured Sermon fields | Title, speaker, date, series, slug, thumbnail, video URL | **Remove most** — show info banner instead | **Change**: This section's data comes from `dataSource: 'latest-message'` (auto-populated from CMS). The editor should NOT show editable sermon fields — it should show a read-only info banner: "Content auto-populated from latest published message." The heading is the only builder-editable field. |

**Recommendation**: The current editor shows manual sermon entry fields (title, speaker, date, etc.) which contradicts the data-driven pattern. When `dataSource` is set, the sermon data comes from the DAL — manual fields are ignored. Remove the manual fields and show an info label explaining the auto-population. Keep only the section heading.

**Effort**: Small — remove fields, add info banner. Simplifies the editor.

---

## C. Card & Grid Sections (6)

### 12. ACTION_CARD_GRID

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Heading (3 lines) | Line1, Line2 (with italic flag), Line3 | Line1, Line2 (with italic flag), Line3 | None |
| Subheading | Text input | Text input | None |
| CTA Button | Label + href | Label + href + visible toggle | **Add**: visible toggle for consistency with other sections |
| Cards Array | Title, description, image, link per card | Title, description, image, link per card | None |

**Status**: Mostly complete. The cards array editor with image pickers is already built.

**Effort**: Tiny — add visible toggle to CTA button.

---

### 13. HIGHLIGHT_CARDS (Hybrid: CMS + Builder)

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Heading | Text input | Text input | None |
| Subheading | Text input | Text input | None |
| CTA Label | Text input | Text input | None |
| CTA Link | Text input | Text input | None |
| Number of Events | Number input (1-6) | Number input (1-6) | None |
| Sort Order | Select (asc/desc) | Select (asc/desc) | None |
| Auto-Hide Past Featured | Toggle | Toggle | None |
| Include Recurring | Toggle | Toggle | None |
| Show Past Events | Toggle | Toggle | None |
| Past Events Window | Select (7/14/30/60/90/all) | Select (7/14/30/60/90/all) | None |

**Status**: Complete. The data-section-editor already has comprehensive filter controls.

**Effort**: None.

---

### 14. FEATURE_BREAKDOWN

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Heading | Text input | Text input | None |
| Description | Textarea | Textarea | None |
| Acronym Lines | Array editor (text per line) | Array editor (text per line) | None |
| CTA Button | Label + href + visible | Label + href + visible | None |
| Watermark Image | Not exposed | **Do NOT expose** | The R2 CDN logo watermark is decorative. Remove the hardcoded URL from the component and either (a) read from `content.watermarkUrl` with a sensible default, or (b) remove the watermark entirely for non-LA-UBF churches. Don't add it to the editor — it's a design detail. |

**Hardcoded to fix**: Remove hardcoded R2 logo URL from component. Read from content with fallback or remove.

**Effort**: Tiny — code change only, no editor change.

---

### 15. PATHWAY_CARD

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Heading | Text input | Text input | None |
| Description | Textarea | Textarea | None |
| Cards Array | Icon key, title, description, button label, button link per card | Icon key, title, description, button label, button link per card | None |
| Button Variant | Not exposed | **Do NOT expose** | Internal styling detail. Defaults to "secondary" which is correct. |

**Status**: Complete. The card array editor is already built.

**Effort**: None.

---

### 16. PILLARS

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Heading | Text input | Text input | None |
| Pillar Items | Title, description, button label, button link per pillar | Title, description, button label, button link, **images** per pillar | **Add**: Image array per pillar item. The component renders 1-3 images per pillar (alternating left-right layout). Currently images are JSON-only. Users need to set the images that represent each pillar. |

**Gap**: Each pillar item needs an image array editor (1-3 images with image picker). This is the most complex editor in the system — nested arrays with images.

**Effort**: Medium-High — nested image arrays within pillar items.

---

### 17. NEWCOMER

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Heading | Text input | Text input | None |
| Description | Textarea | Textarea | None |
| Button Label | Text input | Text input | None |
| Button Link | Text input | Text input | None |
| Image | Image picker (optional) | Image picker (optional) | None |

**Status**: Complete.

**Effort**: None.

---

## D. Ministry Sections (6)

### 18. MINISTRY_INTRO

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Heading | Text input | Text input | None |
| Description | Textarea | Textarea | None |
| Side Image | Image picker (optional) + alt + position | Image picker (optional) + alt + position | None |

**Status**: Complete.

**Effort**: None.

---

### 19. MINISTRY_SCHEDULE

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Heading | Text input | Text input | None |
| Description | Textarea | Textarea | None |
| Schedule Entries | Array: day, time, location per entry | Array: day, time, location per entry | None |
| Buttons | Array: label, link, variant per button | Array: label, link, variant per button | None |
| Heading Style | Not exposed | **Do NOT expose** | Design detail — component uses heading font by default. |
| Schedule Label | Not exposed | **Do NOT expose** | Rarely used, defaults to "Schedule" which is correct. |
| Time Value | Not exposed | Text input | **Add**: The component renders `timeValue` (e.g., "Sundays at 11:00 AM") as a prominent display. Seeded in campus pages. Users need to set this. |
| Address | Not exposed | Array editor (address lines) | **Add**: Component renders address lines. Used in campus detail pages. |
| Directions URL | Not exposed | Text input | **Add**: Component renders a directions link/button. |
| Image | Not exposed | Image picker | **Add**: Component renders a section image. |
| Logo | Not exposed | **Do NOT expose** | Optional branding element, rarely used. JSON-only is fine. |

**Gap**: 4 fields need to be added: timeValue, address lines, directions URL, and section image. These are all used in the seeded campus pages.

**Effort**: Medium — several simple fields to add.

---

### 20. CAMPUS_CARD_GRID

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Heading | Text input | Text input | None |
| Description | Textarea | Textarea | None |
| Campuses Array | Name, link, image per campus | Name, link, image per campus | None |
| CTA Heading | Not exposed | Text input | **Add**: Component renders `ctaHeading` above the CTA button. |
| CTA Button | Not exposed | Label + href | **Add**: Component renders a CTA button at the bottom. |
| Show CTA Icon | Not exposed | **Do NOT expose** | Minor styling toggle. |
| Decorative Images | Not exposed | **Do NOT expose** | Complex decorative element with absolute positioning and rotation. These are design details — not user-configurable. JSON-only. |

**Gap**: Add ctaHeading and CTA button fields.

**Effort**: Small — two simple fields.

---

### 21. DIRECTORY_LIST

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Heading | Text input | Text input | None |
| Directory Items | Array: label, link, description per item | Array: label, link, description per item | None |
| Background Image | Image picker + alt | Image picker + alt | None |
| CTA Heading | Text input | Text input | None |
| CTA Button | Label + link | Label + link | None |

**Status**: Complete.

**Effort**: None.

---

### 22. MEET_TEAM

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Heading | Text input | Text input | None |
| Team Members | Array: name, role, bio, photo URL per member | Array: name, role, bio, **image picker** per member | **Change**: Photo should use image picker instead of raw URL text input. |

**Gap**: Replace photo URL text input with image picker for each team member.

**Effort**: Small — swap text input for image picker component.

---

### 23. LOCATION_DETAIL

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Time Label | Not exposed | Text input | **Add**: Component renders this (e.g., "Service Time"). |
| Time Value | Text input (service time label + value) | Text input (label + value) | None |
| Address Label | Text input | Text input | None |
| Address Lines | Array editor | Array editor | None |
| Directions Label | Text input | Text input | None |
| Directions URL | Text input | Text input | None |
| Images | Not exposed | Image array editor | **Add**: Component renders location images. User needs to set the church building photos. |

**Gap**: Add time label and images array.

**Effort**: Small-Medium — add time label field + image array editor.

---

## E. Interactive Sections (3)

### 24. FAQ_SECTION

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Section Heading | Text input | Text input | None |
| Show Question Icon | Toggle | Toggle | None |
| FAQ Items | Array: question + answer (textarea) with reorder | Array: question + answer (textarea) with reorder | None |

**Status**: Complete. Component also supports `answerHtml` for rich HTML answers, but the plain text `answer` field is sufficient for the editor. Rich HTML is a power-user feature accessible via JSON tab.

**Effort**: None.

---

### 25. FORM_SECTION

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Heading | Text input | Text input | None |
| Description | Textarea | Textarea | None |
| Interest Options | Array: label + value per option | Array: label + value per option | None |
| Campus Options | Array: label + value per option | Array: label + value per option | None |
| Bible Teacher Label | Text input | Text input | None |
| Submit Button Label | Text input | Text input | None |
| Success Message | Text input | Text input | None |

**Status**: Complete.

**Effort**: None.

---

### 26. TIMELINE_SECTION

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Heading | Text input | Text input | None |
| Description | Textarea | Textarea | None |
| Timeline Items | Array: time, title, description with reorder | Array: time, title, description with reorder | None |

**Status**: Complete. Component also supports an optional image/video but the timeline items are the core content.

**Effort**: None.

---

## F. Data-Driven Sections (10)

These sections auto-populate from CMS data. The builder only controls headings, CTAs, and display parameters.

### 27. ALL_MESSAGES

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Section Heading | Text input | Text input | None |

**Status**: Complete. Content comes from CMS messages.

---

### 28. ALL_EVENTS

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Section Heading | Text input | Text input | None |

**Status**: Complete. Content comes from CMS events.

---

### 29. ALL_BIBLE_STUDIES

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Section Heading | Text input | Text input | None |

**Status**: Complete. Content comes from CMS bible studies.

---

### 30. ALL_VIDEOS

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Section Heading | Text input | Text input | None |

**Status**: Complete. Content comes from CMS videos.

---

### 31. MEDIA_GRID (Hybrid)

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Section Heading | Text input | Text input | None |
| CTA Label | Text input | Text input | None |
| CTA Link | Text input | Text input | None |

**Status**: Complete.

---

### 32. UPCOMING_EVENTS (Hybrid)

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Overline | Text input | Text input | None |
| Section Heading | Text input | Text input | None |
| CTA Button | Label + href | Label + href | None |

**Status**: Complete. The `ministrySlug` filter is set during section creation (tied to page context), not user-editable.

---

### 33. EVENT_CALENDAR (Hybrid)

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Section Heading | Text input | Text input | None |
| CTA Buttons | Not exposed | **Consider**: Array editor for CTA buttons | **Optional**: Component renders `ctaButtons[]` (e.g., "View All Events", "Submit Event Request"). These are useful for churches to customize. Low priority but straightforward. |
| Filters | Not exposed | **Do NOT expose** | Generated server-side from event data. Not user-configurable. |

**Effort**: Small if adding CTA buttons, none if deferred.

---

### 34. RECURRING_MEETINGS (Hybrid)

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Section Heading | Text input | Text input | None |
| Max Visible | Number input (1-20) | Number input (1-20) | None |
| View All Link | Text input | Text input | None |

**Status**: Complete.

---

### 35. QUICK_LINKS (Hybrid)

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Section Heading | Text input | Text input | None |
| Subtitle | Text input | Text input | None |

**Status**: Complete.

---

### 36. DAILY_BREAD_FEATURE

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Section Heading | Text input | Text input | None |

**Status**: Complete. Fully data-driven.

---

## G. Schedule & Navigation (3)

### 37. RECURRING_SCHEDULE

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Heading | Text input | Text input | None |
| Subtitle | Textarea | Textarea | None |
| Meetings Array | Title, description, time, location, days (7-day selector) per meeting | Title, description, time, location, days (7-day selector) per meeting | None |

**Status**: Complete. The day selector with 7 toggle buttons is already built.

**Effort**: None.

---

### 38. PHOTO_GALLERY

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Heading | Text input | Text input | None |
| Images | Array: image picker + alt + object position with reorder | Array: image picker + alt + object position with reorder | None |

**Status**: Complete.

**Effort**: None.

---

### 39. FOOTER

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Description | Textarea | Textarea | None |
| Social Links | Array: platform + URL | Array: platform dropdown + URL | **Improve**: Platform should be a dropdown (instagram, facebook, youtube, twitter, email) instead of free text. Same pattern as MINISTRY_HERO social links. |
| Link Columns | Nested: column heading + links (label + URL) per column | Nested: column heading + links (label + URL) per column | None |
| Contact Address | Array: address lines | Array: address lines | None |
| Contact Phone | Text input | Text input | None |
| Contact Email | Text input | Text input | None |
| Logo | Not exposed | Image picker | **Add**: Component renders a logo. Currently may use hardcoded default. Should be editable or read from site settings. |

**Gap**: Add logo image picker, improve social links to use dropdown.

**Effort**: Small.

---

## H. Custom Sections (2)

### 40. CUSTOM_HTML

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| HTML Content | Textarea (monospace) | Textarea (monospace) | None |

**Status**: Complete. Warning banner about HTML is shown.

---

### 41. CUSTOM_EMBED

| Field | Currently Exposed | Should Be Editable | Gap |
|---|---|---|---|
| Embed URL | Text input | Text input | None |
| Title | Text input | Text input | None |
| Aspect Ratio | Button group (16:9, 4:3, 1:1, 9:16) + custom | Button group (16:9, 4:3, 1:1, 9:16) + custom | None |

**Status**: Complete.

---

## Summary: What Needs Work

### Sections That Need Editor Changes

| # | Section | What's Missing | Effort |
|---|---|---|---|
| 1 | HERO_BANNER | Video URL field + fix hardcoded video | Small |
| 5 | MINISTRY_HERO | Social links array editor | Medium |
| 6 | MEDIA_TEXT | Images array editor | Medium |
| 10 | STATEMENT | Fix hardcoded mask image URL (code only) | Tiny |
| 11 | SPOTLIGHT_MEDIA | Remove manual sermon fields, add info banner | Small |
| 14 | FEATURE_BREAKDOWN | Fix hardcoded watermark URL (code only) | Tiny |
| 16 | PILLARS | Image array per pillar item | Medium-High |
| 19 | MINISTRY_SCHEDULE | Add timeValue, address, directions, image | Medium |
| 20 | CAMPUS_CARD_GRID | Add ctaHeading + CTA button fields | Small |
| 22 | MEET_TEAM | Swap photo URL for image picker | Small |
| 23 | LOCATION_DETAIL | Add time label + images array | Small-Medium |
| 33 | EVENT_CALENDAR | Add CTA buttons array (optional) | Small |
| 39 | FOOTER | Add logo picker, improve social dropdown | Small |

### Sections That Are Complete (No Changes Needed): 28

PAGE_HERO, TEXT_IMAGE_HERO, EVENTS_HERO, QUOTE_BANNER, CTA_BANNER, ABOUT_DESCRIPTION, ACTION_CARD_GRID, HIGHLIGHT_CARDS, PATHWAY_CARD, NEWCOMER, MINISTRY_INTRO, DIRECTORY_LIST, FAQ_SECTION, FORM_SECTION, TIMELINE_SECTION, ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS, MEDIA_GRID, UPCOMING_EVENTS, RECURRING_MEETINGS, QUICK_LINKS, DAILY_BREAD_FEATURE, RECURRING_SCHEDULE, PHOTO_GALLERY, CUSTOM_HTML, CUSTOM_EMBED

### Hardcoded URLs to Fix (Code Changes Only)

| Component | What's Hardcoded | Fix |
|---|---|---|
| HERO_BANNER | R2 video URL | Read from `content.backgroundVideoUrl` |
| STATEMENT | `cross.png` mask URL | Read from content with fallback |
| FEATURE_BREAKDOWN | R2 logo watermark | Read from content with fallback or remove |
| FOOTER | Default logo URL | Read from content or site settings |

### Total Effort Estimate

- **13 sections need editor changes** (ranging from Tiny to Medium-High)
- **28 sections are complete** (no editor changes needed)
- **4 hardcoded URL fixes** (code-only, no editor work)
- Estimated total: ~15-20 hours of editor work
- This is significantly less than the original 47-hour estimate because many editors were already built correctly.
