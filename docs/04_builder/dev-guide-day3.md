# Builder Development Guide — Day 3 (Monday, March 23)

> Days 1-2 completed: iframe canvas, shared editors, dirty tracking, nav editor (flat tree DnD + reparenting), presence system, color schemes (Light/Dark/Brand/Muted), ALL_MESSAGES CMS editor, hero editor expansion, builder feedback system.
> Day 3 focus: theme token migration, CMS-driven editors, QA verification, UX polish.
> **Last updated**: March 23, 2026

---

## Task Overview — MVP Finish Line

Complete these to ship the website builder MVP today:

| # | Task | Priority | Est. |
|---|------|----------|------|
| 1 | Fix hydration error on Messages page | P0 | 15m |
| 2 | Theme token migration (10 sections) | P0 | 2h |
| 3 | CMS-driven layout editors (3 content types) | P1 | 1.5h |
| 4 | Builder + public site parity check | P0 | 30m |
| 5 | Section-by-section QA (41 sections) | P0 | 2h |
| 6 | Navigation editor QA | P1 | 30m |
| 7 | Color scheme QA (all homepage sections) | P1 | 30m |
| 8 | Page tree DnD wiring | P2 | 1h |
| 9 | Builder polish leftovers | P2 | 1h |

---

## Task 1: Fix Hydration Error on Messages Page

> P0. Blocks QA on the public site.

- [ ] Check if `message-card.tsx` has `"use client"` — if not, add it
- [ ] If still broken, check `formatDate()` for locale mismatch (server renders en-US, client renders browser locale)
- [ ] Test: hard refresh `/messages` on public site, zero console errors

**Files:** `components/website/shared/message-card.tsx`

---

## Task 2: Theme Token Migration (10 Sections)

> P0. These sections have hardcoded colors (`text-black`, `bg-white`, etc.) that break Dark/Brand/Muted color schemes.

**Pattern for each section:**
1. Import `useSectionTheme` from `../shared/theme-tokens`
2. Call `const t = useSectionTheme()` at the top of the component
3. Replace hardcoded colors with token references:
   - `text-black-1` / `text-black` / `text-gray-900` → `t.textPrimary`
   - `text-gray-600` / `text-gray-500` → `t.textSecondary`
   - `bg-white` / `bg-white-0` → `t.surfaceBg` or `t.surfaceBgSubtle`
   - `border-gray-200` → `t.border`
   - `bg-gray-100` → `t.surfaceBgSubtle`
4. Verify Light mode looks identical to before
5. Switch to Dark/Brand/Muted in builder Style panel and confirm readability

**Sections by effort (do high-impact first):**

| Section | Hardcoded instances | Priority |
|---------|-------------------|----------|
| `all-bible-studies-client.tsx` | 15 | HIGH |
| `quick-links.tsx` | 8 | MEDIUM |
| `recurring-meetings.tsx` | 5 | MEDIUM |
| `daily-bread-feature.tsx` | 5 | MEDIUM |
| `footer.tsx` | 4 | VERIFY ONLY (intentionally dark) |
| `form-section.tsx` | 3 | LOW |
| `statement.tsx` | 1 | LOW |
| `all-events-client.tsx` | 1 | LOW |
| `all-videos.tsx` | 1 | LOW |
| `directory-list.tsx` | 2 | LOW |

**Already migrated (reference implementations):**
- `all-messages-client.tsx` — full migration done Mar 20
- `message-card.tsx` — migrated Mar 20
- `action-card-grid.tsx`, `cta-banner.tsx`, `quote-banner.tsx`, `event-calendar.tsx` — migrated Mar 20

---

## Task 3: CMS-Driven Layout Editors (3 Content Types)

> P1. ALL_MESSAGES has a layout editor. These 3 data-driven sections need the same treatment.

Apply the ALL_MESSAGES pattern to:

- [ ] **ALL_EVENTS** — layout editor with: columns, card gap, card element toggles (date, location, category), items per page
- [ ] **ALL_BIBLE_STUDIES** — layout editor with: columns, card gap, card element toggles (date, author, series), items per page
- [ ] **ALL_VIDEOS** — layout editor with: columns, card gap, items per page

**For each:**
1. Create `all-[type]-layout-editor.tsx` in `section-editors/`
2. Register in `LAYOUT_EDITORS` in `section-editors/index.tsx`
3. Wire editor controls to `content` JSON fields
4. Verify `resolve-section-data.ts` reads the layout fields and passes them through
5. Verify the public site component respects the layout fields

**Reference:** `section-editors/all-messages-layout-editor.tsx` (the pattern to copy)

---

## Task 4: Builder / Public Site Parity Check

> P0. The builder canvas and public site must show the same content.

- [ ] Open builder → Messages page section → confirm only messages with video thumbnails appear (no book icon placeholders)
- [ ] Compare with public website `/messages` — same messages, same order
- [ ] Open builder → Events page → compare with `/events`
- [ ] Open builder → Bible Studies page → compare with `/bible-study`
- [ ] Test: change card spacing in a Layout panel, save, verify on public site

---

## Task 5: Section-by-Section QA (41 Sections)

> P0. Every section must work: editor opens → fields save → canvas updates → public site renders.

**Verification protocol per section:**
1. Open builder → click section → editor opens in right drawer
2. Edit a field → verify canvas updates live
3. Save → reload → verify field persisted
4. Check public website → verify section renders correctly
5. Add a NEW section of this type via picker → verify default content is sensible

### Heroes (5)
- [ ] HERO_BANNER — heading, subheading, buttons, bg image, bg video, overlay, carousel speed
- [ ] PAGE_HERO — overline, heading, buttons
- [ ] TEXT_IMAGE_HERO — heading, accent, description, image, text alignment
- [ ] EVENTS_HERO — heading, subtitle
- [ ] MINISTRY_HERO — heading, heading style, CTA, hero image, social links

### Content (5)
- [ ] MEDIA_TEXT — heading, body, button, images array
- [ ] QUOTE_BANNER — heading, verse text, reference
- [ ] CTA_BANNER — heading, body, bg image, primary/secondary buttons
- [ ] ABOUT_DESCRIPTION — logo, heading, description, video URL
- [ ] STATEMENT — heading, lead-in, show icon, paragraphs array

### Cards (5)
- [ ] ACTION_CARD_GRID — heading, subheading, CTA visible toggle, cards array
- [ ] FEATURE_BREAKDOWN — heading, description, acronym lines, button
- [ ] PATHWAY_CARD — heading, description, cards array
- [ ] PILLARS — heading, items array with images
- [ ] NEWCOMER — heading, description, button, image

### Data-Driven (12)
- [ ] ALL_MESSAGES — heading, layout controls (columns, card spacing, toggles)
- [ ] ALL_EVENTS — heading (+ layout editor if Task 3 done)
- [ ] ALL_BIBLE_STUDIES — heading (+ layout editor if Task 3 done)
- [ ] ALL_VIDEOS — heading (+ layout editor if Task 3 done)
- [ ] MEDIA_GRID — heading, CTA
- [ ] SPOTLIGHT_MEDIA — heading only
- [ ] HIGHLIGHT_CARDS — heading, subheading, CTA, event count, sort, filters
- [ ] UPCOMING_EVENTS — heading, CTA, max events, recurring, past window
- [ ] EVENT_CALENDAR — heading, CTA buttons array
- [ ] RECURRING_MEETINGS — heading, max visible, view all link
- [ ] QUICK_LINKS — heading, subtitle
- [ ] DAILY_BREAD_FEATURE — heading

### Ministry (6)
- [ ] MINISTRY_INTRO — heading, description, side image
- [ ] MINISTRY_SCHEDULE — heading, schedule entries, buttons, time, address, image
- [ ] CAMPUS_CARD_GRID — heading, description, campuses, CTA
- [ ] MEET_TEAM — heading, members array with photos
- [ ] LOCATION_DETAIL — time, address, directions, images array
- [ ] DIRECTORY_LIST — heading, items, bg image, CTA

### Interactive (3)
- [ ] FAQ_SECTION — heading, show icon, items array (Q + A)
- [ ] TIMELINE_SECTION — heading, description, items array
- [ ] FORM_SECTION — heading, description, interest/campus options

### Schedule + Gallery (2)
- [ ] RECURRING_SCHEDULE — heading, subtitle, meetings array
- [ ] PHOTO_GALLERY — heading, images array (add/remove/reorder)

### Custom (2)
- [ ] CUSTOM_HTML — HTML textarea
- [ ] CUSTOM_EMBED — embed URL, title, aspect ratio

### Footer
- [ ] FOOTER — description, logo picker, social links, link columns, contact info

### Cross-cutting
- [ ] Add a section via picker → default content renders in canvas
- [ ] Delete a section → removed from canvas and API
- [ ] Reorder sections via drag → new order persists after save
- [ ] Toggle visibility off → hidden on public site, dimmed in builder
- [ ] Switch color scheme (Light → Dark → Brand → Muted) → canvas updates

---

## Task 6: Navigation Editor QA

> P1. Nav editor was rewritten with flat tree DnD. Verify it all works.

- [ ] Open builder → click Navigation in sidebar → tree renders
- [ ] Drag item from one dropdown into another → reparents correctly
- [ ] Drag item across depth levels → groupLabel updates
- [ ] Three-dot menu → Add Item, Add Section work
- [ ] Section header → Rename, Remove Grouping work
- [ ] Edit a menu item label → save → public site navbar updates
- [ ] Add a new menu item → appears in tree and on public site
- [ ] Delete a menu item → confirm → removed from public site
- [ ] Edit navbar settings (scroll behavior, solid color, sticky) → verify on public site

---

## Task 7: Color Scheme QA

> P1. All 5 schemes must work on every homepage section.

For each homepage section (HERO_BANNER, MEDIA_TEXT, HIGHLIGHT_CARDS, EVENT_CALENDAR, QUOTE_BANNER, ACTION_CARD_GRID, DIRECTORY_LIST, SPOTLIGHT_MEDIA, MEDIA_GRID, CTA_BANNER):

- [ ] Light — text readable, backgrounds correct
- [ ] Dark — text inverts to light, backgrounds dark
- [ ] Brand — primary color applied, text contrast OK
- [ ] Muted — subtle background shift, text still legible

After theme token migration (Task 2), re-test the 10 migrated sections too.

---

## Task 8: Page Tree DnD Wiring (P2)

> Currently grip handles in the page tree are visual-only. Wire them up.

- [ ] Add @dnd-kit sortable to `page-tree.tsx`
- [ ] On drop: PATCH page `sortOrder` (and `parentId` if nesting changes)
- [ ] Verify sidebar order matches public site navigation order
- [ ] Horizontal drag = nest/unnest (same pattern as nav editor)

**Reference:** Navigation editor's flat tree DnD (`navigation/tree-utils.ts`, `sortable-tree-item.tsx`)

---

## Task 9: Builder Polish Leftovers

> P2. Do these if time permits after QA passes.

- [ ] Unlock column controls in ALL_MESSAGES once MessageCard is responsive at 2-col and 4-col
- [ ] Verify `itemsPerPage` controls load-more pagination end-to-end
- [ ] Verify card element toggles (showDate, showSpeaker) hide/show on public site
- [ ] Section drawer syncs with canvas clicks (click A → drawer shows A, click B → drawer switches to B)

---

## Key Files Reference

| Area | Files |
|------|-------|
| **Section editors** | `components/cms/website/builder/section-editors/index.tsx` (registry) |
| **Layout editors** | `section-editors/all-messages-layout-editor.tsx` (reference for Task 3) |
| **Theme tokens** | `components/website/shared/theme-tokens.tsx` |
| **Section wrapper** | `components/website/sections/section-wrapper.tsx` |
| **Data resolver** | `lib/website/resolve-section-data.ts` |
| **Nav editor** | `builder/navigation/navigation-editor.tsx`, `tree-utils.ts`, `sortable-tree-item.tsx` |
| **Page tree** | `builder/pages/page-tree.tsx` |
| **Builder shell** | `builder/builder-shell.tsx` |
| **Section components** | `components/website/sections/*.tsx` (40 files) |

---

## Priority Order (if time-constrained)

1. **Task 1** — Hydration fix (15m, unblocks everything)
2. **Task 2** — Theme tokens (2h, biggest quality impact)
3. **Task 4** — Parity check (30m, catches data bugs)
4. **Task 5** — Section QA (2h, catches regressions)
5. **Task 7** — Color scheme QA (30m, validates Task 2)
6. **Task 3** — CMS editors (1.5h, new feature)
7. **Task 6** — Nav QA (30m, validates Friday's work)
8. **Task 9** — Polish (1h, nice-to-have)
9. **Task 8** — Page DnD (1h, nice-to-have)
