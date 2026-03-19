# Builder Development Guide -- Day 2

> Working reference for the next phase of builder work.
> Day 1 completed: iframe canvas, shared components, dirty tracking, editor gaps, hardcoded URLs, navigation editor.
> Day 2 focus: verification, undo/redo, color system, presence, UX polish.
> **Last updated**: March 18, 2026

---

## What's Done (from Day 1)

Everything from `dev-guide-day1.md` is complete:
- [x] Iframe canvas migration (responsive breakpoints working)
- [x] Shared editor component library (15 primitives, -42% editor code)
- [x] Dirty section tracking + selective save
- [x] Flat editor registry
- [x] All 13 section editor gaps closed
- [x] All 4 hardcoded URLs removed
- [x] Right sidebar scrolling fixed
- [x] Navigation editor (full tree-based DnD, nav item editing, navbar settings persistence)
- [x] Builder directory reorganized (canvas/, layout/, pages/, sections/)

---

## Day 2 Tasks

### Task 1: Undo/Redo Verification

> Priority: P1. Code looks correct but untested after dirty tracking + nav editor changes.

**Files:**
- `components/cms/website/builder/use-builder-history.ts` — 50-snapshot cap, structuredClone
- `components/cms/website/builder/builder-shell.tsx` — keyboard handlers, snapshot push points

**Manual testing checklist:**

- [ ] Open builder → edit a section's heading → Cmd+Z → heading reverts
- [ ] Edit → undo → Cmd+Shift+Z → heading re-applies (redo)
- [ ] Reorder sections via drag → undo → order reverts
- [ ] Add a new section → undo → section removed
- [ ] Delete a section → undo → section restored
- [ ] Change display settings (color scheme, padding) → undo → reverts
- [ ] Change page title → undo → title reverts
- [ ] Make 5+ edits → undo all → redo all → state matches
- [ ] Verify keyboard shortcuts don't fire when typing in an Input/Textarea
- [ ] Navigate to a different page → come back → history is reset (fresh)
- [ ] After undo, verify dirty tracking marks all sections dirty (safe fallback)
- [ ] After undo + save → verify only changed sections are sent to API

**Fix if broken:**
- Snapshot push points are in `builder-shell.tsx` — search for `pushSnapshot()`
- `editingSnapshotPushedRef` prevents duplicate pushes per editor session
- Undo/redo set `dirtySectionIds` to all section IDs (lines ~139-165)

---

### Task 2: Section-by-Section Verification

> Priority: P0. Every section must work end-to-end: editor → canvas → public site.

**Verification protocol per section:**
1. Open builder → click section → editor opens in right drawer
2. Edit each field → verify canvas updates live
3. Save → reload → verify fields persisted
4. Check public website → verify section renders correctly
5. Add a NEW section of this type via picker → verify default content is sensible

**Heroes (5 types):**

- [ ] HERO_BANNER — heading, subheading, buttons, background image, **background video URL** (new)
- [ ] PAGE_HERO — overline, heading, buttons
- [ ] TEXT_IMAGE_HERO — overline, heading, accent, description, image, text alignment
- [ ] EVENTS_HERO — heading, subtitle
- [ ] MINISTRY_HERO — overline, heading, heading style, CTA, hero image, **social links** (new)

**Content (5 types):**

- [ ] MEDIA_TEXT — overline, heading, body, button, **images array** (new)
- [ ] QUOTE_BANNER — overline, heading, verse text, reference
- [ ] CTA_BANNER — overline, heading, body, background image, primary/secondary buttons
- [ ] ABOUT_DESCRIPTION — logo, heading, description, video URL, video title
- [ ] STATEMENT — overline, heading, lead-in, show icon, paragraphs array

**Cards (5 types):**

- [ ] ACTION_CARD_GRID — heading (3 lines), subheading, **CTA visible toggle** (new), cards array
- [ ] FEATURE_BREAKDOWN — heading, description, acronym lines, button
- [ ] PATHWAY_CARD — heading, description, cards array (icon, title, desc, button)
- [ ] PILLARS — overline, heading, items array with **images per item** (new)
- [ ] NEWCOMER — heading, description, button, optional image

**Data-Driven (12 types):**

- [ ] ALL_MESSAGES — heading (content auto-populated)
- [ ] ALL_EVENTS — heading
- [ ] ALL_BIBLE_STUDIES — heading
- [ ] ALL_VIDEOS — heading
- [ ] MEDIA_GRID — heading, CTA label/link
- [ ] SPOTLIGHT_MEDIA — heading only (**info banner** confirms auto-population)
- [ ] HIGHLIGHT_CARDS — heading, subheading, CTA, event count, sort, filters
- [ ] UPCOMING_EVENTS — overline, heading, CTA button
- [ ] EVENT_CALENDAR — heading, **CTA buttons array** (new)
- [ ] RECURRING_MEETINGS — heading, max visible, view all link
- [ ] QUICK_LINKS — heading, subtitle
- [ ] DAILY_BREAD_FEATURE — heading

**Ministry (6 types):**

- [ ] MINISTRY_INTRO — overline, heading, description, side image
- [ ] MINISTRY_SCHEDULE — heading, description, schedule entries, buttons, **timeValue, address, directionsUrl, image** (new)
- [ ] CAMPUS_CARD_GRID — overline, heading, description, campuses, **ctaHeading + CTA button** (new)
- [ ] MEET_TEAM — overline, heading, members array (**ImagePickerField** for photos, new)
- [ ] LOCATION_DETAIL — overline, time label, time value, address, directions, **images array** (new)
- [ ] DIRECTORY_LIST — heading, items, background image, CTA

**Interactive (3 types):**

- [ ] FAQ_SECTION — heading, show icon, items array (question + answer)
- [ ] TIMELINE_SECTION — overline, heading, description, items array (time + title + desc)
- [ ] FORM_SECTION — overline, heading, description, interest options, campus options, etc.

**Schedule + Gallery (2 types):**

- [ ] RECURRING_SCHEDULE — heading, subtitle, meetings array (title, desc, time, days, location)
- [ ] PHOTO_GALLERY — heading, images array (add/remove/reorder)

**Custom (2 types):**

- [ ] CUSTOM_HTML — HTML textarea
- [ ] CUSTOM_EMBED — embed URL, title, aspect ratio

**Footer:**

- [ ] FOOTER — description, **logo picker** (new), **social links dropdown** (new), link columns, contact info

**Cross-cutting checks:**

- [ ] Add a new section via picker → verify defaultContent renders correctly in canvas
- [ ] Delete a section → verify it's removed from canvas and API
- [ ] Reorder sections via drag → verify new order persists after save
- [ ] Toggle visibility off → verify section is hidden on public site but visible (dimmed) in builder
- [ ] Change color scheme (LIGHT → DARK) → verify canvas updates

---

### Task 3: Navigation Verification

> Navigation editor was completed on Day 1. Verify it works end-to-end.

- [ ] Open builder → click Navigation in sidebar → tree renders with all menu items
- [ ] Click a menu item → NavItemEditor opens in right drawer with correct fields
- [ ] Edit a menu item label → save → verify public website navbar updates
- [ ] Add a new menu item → verify it appears in the tree and on public site
- [ ] Delete a menu item → confirm dialog → verify removal on public site
- [ ] Reorder items via drag → verify new order on public site
- [ ] Edit navbar settings (scroll behavior, solid color, sticky) → verify on public site
- [ ] Click a navbar link in the canvas → verify it navigates to that page in the builder

---

### Task 4: Color Palette System

> Priority: P1. Replace binary light/dark toggle with named palettes.

**Current state:** `DisplaySettings` has a Radio toggle: LIGHT / DARK. The `SectionWrapper` applies `.dark` class or not.

**Target:** Named color palettes that map to CSS variable sets.

- [ ] Define palette options: Light, Dark, Brand Primary, Brand Accent, Muted (start with 5)
- [ ] Each palette = a set of CSS custom property overrides (background, foreground, accent, etc.)
- [ ] Update `DisplaySettings` radio to show palette names instead of LIGHT/DARK
- [ ] Update `SectionWrapper` to apply the palette class instead of just `.dark`
- [ ] Ensure backward compatibility: existing `LIGHT` maps to Light palette, `DARK` maps to Dark palette
- [ ] Verify all 41 sections look correct with each palette

**Files to modify:**
- `components/cms/website/builder/section-editors/display-settings.tsx` — replace radio options
- `components/website/sections/section-wrapper.tsx` — apply palette class
- `app/globals.css` or theme CSS — define palette variable sets

---

### Task 5: Presence Awareness System

> Priority: P1. Show when other admins are editing. See `mental-model/concurrent-editing-strategy.md`.

**Database:**

- [ ] Add `BuilderPresence` model to `prisma/schema.prisma`:
  ```prisma
  model BuilderPresence {
    id        String   @id @default(cuid())
    pageId    String
    userId    String
    userName  String
    lastSeen  DateTime @default(now())
    churchId  String
    church    Church   @relation(fields: [churchId], references: [id])
    @@unique([pageId, userId])
    @@index([pageId, lastSeen])
  }
  ```
- [ ] Run `npx prisma migrate dev --name add-builder-presence`

**API:**

- [ ] Create `POST /api/v1/builder/presence` — upsert presence record (heartbeat)
- [ ] Create `GET /api/v1/builder/presence?pageId=xxx` — return active editors (lastSeen < 60s ago)
- [ ] Add auth check to both endpoints

**Client (builder-shell.tsx):**

- [ ] Add heartbeat interval (30s) — POST to presence API on mount + interval
- [ ] Add presence polling (30s) — GET active editors, store in state
- [ ] Show banner when other editors detected: "David is also editing this page."
- [ ] Hide banner when no other editors (poll returns empty)
- [ ] Clear presence on `beforeunload` (best-effort DELETE or let it expire)
- [ ] Stop heartbeat + polling on unmount

**Test:**

- [ ] Open builder in two browser tabs (different users if possible)
- [ ] Tab A shows "User B is editing" banner
- [ ] Close Tab B → banner disappears within 60s
- [ ] Both tabs edit different sections → save both → changes preserved

---

### Task 6: UX Bug Fixes

> From `backlogs/builder-ux-issues.md`. These are polish items.

**Issue 2: Selection border clipping**

- [ ] Replace `outline` with `inset box-shadow` in `canvas/sortable-section.tsx`
  - Selected: `shadow-[inset_0_0_0_2px_rgb(37,99,235),0_0_0_4px_rgba(37,99,235,0.1)]`
  - Hover: `shadow-[inset_0_0_0_2px_rgba(37,99,235,0.3)]`
- [ ] Apply same pattern to navbar selection in `canvas/builder-preview-client.tsx`
- [ ] Verify: select a section → all 4 sides of border visible regardless of overflow

**Issue 1: Drag preview**

- [ ] In `canvas/builder-preview-client.tsx` `DragOverlay`, render the actual section content instead of a label card
- [ ] Apply `opacity-70`, `scale(0.5)`, `max-height: 300px`, `overflow-hidden`, `pointer-events-none`
- [ ] The source section should show `opacity-50` while dragging
- [ ] Verify: drag a tall section → preview is compact and centered on cursor

**Issue 3: Section picker positioning**

- [ ] Convert section picker from centered Dialog to positioned panel
- [ ] Sidebar "+" trigger → `sidebar` mode: `position: fixed; left: 70px; top: 20px`
- [ ] Between-section "+" trigger → `popover` mode: positioned near trigger rect
- [ ] No background blur — transparent click-outside-to-close
- [ ] Verify: both trigger modes position correctly

**Issue 4: Modal borders**

- [ ] Soften borders in `sections/section-picker-modal.tsx` and `sections/section-preview.tsx`
- [ ] Replace any `border-black` or `border-foreground` with `border-slate-200`
- [ ] Verify: picker looks clean in light mode

---

### Task 7: Edge Cases & Polish

> Lower priority. Do after Tasks 1-6.

- [ ] Empty state: add a new section → verify the editor shows sensible defaults, not blank fields
- [ ] Long text overflow: enter a very long heading → verify it wraps in canvas, doesn't break layout
- [ ] Image aspect ratio: upload a square image to a section expecting 16:9 → verify no distortion
- [ ] Mobile preview: switch to mobile (375px) → verify sections look correct in iframe
- [ ] Tablet preview: switch to tablet (768px) → verify responsive breakpoints fire correctly
- [ ] Concurrent save: open 2 tabs, edit different sections, save both → both changes preserved
- [ ] Auto-save: edit a field → wait 30s → verify auto-save fires → check save indicator

---

## Key Files Reference (Updated for New Directory Structure)

| Area | Files |
|---|---|
| **Orchestrator** | `builder/builder-shell.tsx` |
| **Canvas** | `builder/canvas/builder-canvas.tsx`, `builder/canvas/builder-preview-client.tsx`, `builder/canvas/sortable-section.tsx`, `builder/canvas/iframe-protocol.ts` |
| **Layout** | `builder/layout/builder-topbar.tsx`, `builder/layout/builder-sidebar.tsx`, `builder/layout/builder-drawer.tsx`, `builder/layout/builder-right-drawer.tsx` |
| **Pages** | `builder/pages/page-tree.tsx`, `builder/pages/page-settings-modal.tsx`, `builder/pages/add-page-modal.tsx` |
| **Sections** | `builder/sections/section-picker-modal.tsx`, `builder/sections/section-preview.tsx`, `builder/sections/section-add-trigger.tsx` |
| **Navigation** | `builder/navigation/navigation-editor.tsx`, `builder/navigation-item-editor.tsx` |
| **Editors** | `builder/section-editors/index.tsx` (flat registry), `builder/section-editors/shared/` (15 primitives) |
| **Display** | `builder/section-editors/display-settings.tsx` — color scheme, padding, width, animations, visibility |
| **Section rendering** | `components/website/sections/*.tsx` (public site + iframe) |
| **Section wrapper** | `components/website/sections/section-wrapper.tsx` — applies display settings, color scheme |
| **Undo/redo** | `builder/use-builder-history.ts` |
| **Types** | `builder/types.ts` |
| **Presence (new)** | `prisma/schema.prisma`, `app/api/v1/builder/presence/route.ts` (to create) |

---

## Priority Order

If time is limited, do tasks in this order:

1. **Task 2** — Section verification (P0, catches any regressions from Day 1 work)
2. **Task 1** — Undo/redo verification (P1, quick manual test)
3. **Task 3** — Navigation verification (P1, quick manual test)
4. **Task 6** — UX bug fixes (P1, visual polish)
5. **Task 4** — Color palette (P1, new feature)
6. **Task 5** — Presence system (P1, new feature, most complex)
7. **Task 7** — Edge cases (P2, only if time)
