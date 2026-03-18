# Builder Development Guide -- Day 1

> Concise working reference for Claude Code sessions on builder work.
> Not a design doc -- a practical map of what's where and how to change it.
> **Last updated**: March 18, 2026

---

## Progress Tracker

> What's been done, what's left. Updated after each work session.

### Completed (March 18)

| Task | Commit | What Was Done |
|---|---|---|
| **Task 0.5a** — Shared editor primitives | `79b7182` | Extracted `shared/` directory with 15 reusable components across 5 modules: field-primitives (7), array-fields (3), media-fields (2), card-fields (3), banners (1). All 14 editors refactored. **-42% editor code.** |
| **Task 0.5c** — Dirty section tracking | `801291a` | `dirtySectionIds`, `reorderDirty`, `pageDirty` granular flags. `handleSave()` only PATCHes dirty sections (K+2 instead of N+2). Early return when nothing dirty. `isSaving` race guard. Undo/redo marks all dirty (safe fallback). Delete removes from dirty set. Page nav resets all flags. |
| **Task 0.5d** — Flat editor registry | `79b7182` | Replaced category-array + switch routing with flat `Record<SectionType, EditorComponent>`. Adding a new section editor is now a 1-line change. |
| **Task 1** — Fix hardcoded URLs (4 components) | `4b11296` | HERO_BANNER video → `content.backgroundVideo.src` (with backward-compat fallback). STATEMENT mask → `content.maskImageUrl` (with default constant fallback). FEATURE_BREAKDOWN watermark → `content.watermarkUrl` (hidden when empty). FOOTER logo → `content.logoUrl` (site settings fallback). |
| **Task 4** — Section editor gap fixes (13 sections) | `4b11296` | All 13 gaps closed: HERO_BANNER (video URL fields), MINISTRY_HERO (social links array), MEDIA_TEXT (images array), SPOTLIGHT_MEDIA (simplified to info banner), ACTION_CARD_GRID (CTA visible toggle), PILLARS (image array per item), MINISTRY_SCHEDULE (timeValue, address, directions, image), CAMPUS_CARD_GRID (ctaHeading + CTA), MEET_TEAM (ImagePickerField), LOCATION_DETAIL (images array), EVENT_CALENDAR (CTA buttons), FOOTER (logo picker + social dropdown). |
| **SPOTLIGHT_MEDIA routing fix** | `a3f38da` | Moved back to flat registry (was misrouted to DataSectionEditor which had no case for it). |
| **Dead code cleanup** | `9aa8f58` | Removed 5 dead aggregate router functions, duplicate HighlightCardsEditor, duplicate DATA_SOURCE_LABELS. Consistency pass on all editors (`labelSize="sm"`, EditorButtonGroup uses shadcn Button, GripVertical conditional). |
| **Playwright verification** | — | All public website pages verified rendering correctly. Zero console errors. All 4 hardcoded URL removals confirmed working (hero video, statement mask, feature breakdown watermark, footer logo). |
| **Task 0** — Iframe canvas migration | `087da4c`, `b24501e` | **COMPLETE.** Sections render in an iframe for correct responsive breakpoints. Route group `(editor)/` isolates builder chrome from preview. Protocol: 14 message types, type-safe postMessage. Iframe scrolls internally (industry standard). Device modes (desktop/tablet/mobile) work correctly. Code review: 3 bugs fixed (security null-ref, layout isolation, resolvedData preservation), 6 improvements (NavbarData dedup, RAF throttle, loading timeout, toolbar fallback, skip-ref round-trips, dead field removal). See `worklog/builder-responsive-rendering-bug.md` and `worklog/iframe-layout-isolation-fix.md`. |
| **Task 0.5b** — Right sidebar scrolling | *(prior commits)* | `builder-right-drawer.tsx` — proper flexbox pattern: `h-full flex flex-col overflow-hidden` + `flex-1 min-h-0` on ScrollArea. |

### Not Started

| Task | Priority | Notes |
|---|---|---|
| **Task 2** — Navigation fix | P0 | Page tree doesn't match public website nav. Quick Links mixed in. Navbar editor changes don't persist. |
| **Task 3** — Undo/redo verification | P1 | Needs manual testing. Code looks correct but untested after dirty tracking changes. |
| TypeScript content interfaces | P1 | All editors still use `Record<string, unknown>` + manual casts. |

### In Progress (Another Agent Team)

| Task | Priority | Notes |
|---|---|---|
| **Task 0** — Iframe canvas migration (rendering bug fix) | **P0** | Being worked on by another agent team. Implementation exists but may have rendering issues being debugged. |

---

## System Quick Reference

### Core files (read these first)

| File | Role |
|---|---|
| `components/cms/website/builder/builder-shell.tsx` | **Orchestrator.** All state lives here. All handlers. Includes dirty tracking. |
| `components/cms/website/builder/builder-canvas.tsx` | Canvas with DnD, renders sections, navbar preview |
| `components/cms/website/builder/builder-right-drawer.tsx` | Right panel: wraps `SectionEditorInline` + `NavbarEditor` |
| `components/cms/website/builder/section-editors/index.tsx` | Flat registry: dispatches sectionType to the correct editor component |
| `components/cms/website/builder/section-catalog.ts` | Section type registry: labels, descriptions, icons, defaultContent |
| `components/cms/website/builder/builder-section-renderer.tsx` | Maps SectionType -> client-safe website component for canvas |
| `components/cms/website/builder/use-builder-history.ts` | Undo/redo stack (50 max, structuredClone snapshots) |
| `components/cms/website/builder/types.ts` | `BuilderSection`, `BuilderPage`, `PageSummary`, etc. |

### Shared editor component library

| Module | Components | Purpose |
|---|---|---|
| `shared/field-primitives.tsx` | EditorField, EditorInput, EditorTextarea, EditorToggle, EditorSelect, EditorButtonGroup, TwoColumnGrid | Base form field wrappers |
| `shared/array-fields.tsx` | ArrayField\<T\>, SocialLinksField, AddressField | Reorderable array editors |
| `shared/media-fields.tsx` | ImagePickerField, ButtonConfig | Image picker with MediaPickerDialog, button label+href+visible |
| `shared/card-fields.tsx` | CardItemEditor, AddCardButton, GenericCard | Card array patterns |
| `shared/banners.tsx` | DataDrivenBanner | Blue info banner for data-driven sections |

### Server component (data loading)

| File | Role |
|---|---|
| `app/cms/website/builder/[pageId]/page.tsx` | Loads page, sections, theme, navbar, resolves dynamic data, passes to BuilderShell |
| `lib/dal/pages.ts` | Prisma queries: getPageById, createPageSection, updatePageSection, etc. |
| `lib/website/resolve-section-data.ts` | Resolves dataSource fields (events, messages, videos) for dynamic sections |

### API routes

| Endpoint | File |
|---|---|
| `GET/POST /api/v1/pages` | `app/api/v1/pages/route.ts` |
| `GET/PATCH/DELETE /api/v1/pages/[slug]` | `app/api/v1/pages/[slug]/route.ts` |
| `POST/PUT /api/v1/pages/[slug]/sections` | `app/api/v1/pages/[slug]/sections/route.ts` |
| `PATCH/DELETE /api/v1/pages/[slug]/sections/[id]` | `app/api/v1/pages/[slug]/sections/[id]/route.ts` |

### Section editor files (14 editors + shared library)

| File | Covers |
|---|---|
| `section-editors/hero-editor.tsx` | HERO_BANNER, PAGE_HERO, TEXT_IMAGE_HERO, EVENTS_HERO, MINISTRY_HERO |
| `section-editors/content-editor.tsx` | MEDIA_TEXT, QUOTE_BANNER, CTA_BANNER, ABOUT_DESCRIPTION, STATEMENT |
| `section-editors/cards-editor.tsx` | ACTION_CARD_GRID, FEATURE_BREAKDOWN, PATHWAY_CARD, PILLARS, NEWCOMER |
| `section-editors/data-section-editor.tsx` | ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS, UPCOMING_EVENTS, EVENT_CALENDAR, RECURRING_MEETINGS, MEDIA_GRID, QUICK_LINKS, DAILY_BREAD_FEATURE, HIGHLIGHT_CARDS, SPOTLIGHT_MEDIA |
| `section-editors/ministry-editor.tsx` | MINISTRY_INTRO, MINISTRY_SCHEDULE, CAMPUS_CARD_GRID, MEET_TEAM, LOCATION_DETAIL, DIRECTORY_LIST |
| `section-editors/faq-editor.tsx` | FAQ_SECTION |
| `section-editors/timeline-editor.tsx` | TIMELINE_SECTION |
| `section-editors/form-editor.tsx` | FORM_SECTION |
| `section-editors/footer-editor.tsx` | FOOTER |
| `section-editors/photo-gallery-editor.tsx` | PHOTO_GALLERY |
| `section-editors/schedule-editor.tsx` | RECURRING_SCHEDULE |
| `section-editors/custom-editor.tsx` | CUSTOM_HTML, CUSTOM_EMBED |
| `section-editors/display-settings.tsx` | Shared: colorScheme, paddingY, containerWidth, animations, visibility, label |
| `section-editors/json-editor.tsx` | Raw JSON fallback + debug toggle |
| `section-editors/shared/` | 15 reusable components across 5 modules (see table above) |

---

## How Section Editors Work

### To add a field to an existing editor:

1. Open the editor file (e.g., `hero-editor.tsx`)
2. Find the sub-editor function for your section type (e.g., `HeroBannerEditor`)
3. Destructure the field from content with a type assertion and fallback:
   ```typescript
   const myField = (content.myField as string) ?? ""
   ```
4. Add the form control using shared primitives:
   ```typescript
   <EditorInput label="My Field" value={myField} onChange={(v) => onChange({ ...content, myField: v })} />
   ```
5. On change, spread the full content and override:
   ```typescript
   onChange({ ...content, myField: e.target.value })
   ```
6. If the field needs a default value for new sections, add it to `section-catalog.ts` in the `defaultContent` for that type.

### To add a new section editor:

1. Create editor file in `section-editors/` (follow existing patterns)
2. Export a component matching `SectionEditorProps`: `{ sectionType, content, onChange }`
3. In `section-editors/index.tsx`:
   - Import the new editor
   - Add a single entry to the flat `EDITOR_REGISTRY` map
4. Add defaultContent in `section-catalog.ts`
5. Add preview thumbnail in `section-picker-modal.tsx` CATEGORY_PREVIEWS

### Data flow for editor changes:

```
Editor field onChange
  -> Editor's onChange(fullContentObject)
  -> SectionEditorInline.handleContentChange(newContent)
  -> setContent(newContent)  [local state]
  -> onChange({ content: newContent })  [prop callback]
  -> BuilderShell.handleSectionEditorChange(data)
  -> setSections(prev => prev.map(...))  [immutable update]
  -> setDirtySectionIds(prev => new Set(prev).add(sectionId))  [dirty tracking]
  -> Canvas re-renders with new content
  -> isDirty = true (enables Save button, starts auto-save timer)
```

---

## Remaining Tasks

### Task 2: Navigation Fix

**What's broken**: The page tree sidebar in the builder does not match the actual public website navigation. Quick Links are mixed in with navbar items.

**Files to investigate**:
- `components/cms/website/builder/page-tree.tsx` -- the page tree component in the left drawer
- `components/cms/website/builder/builder-shell.tsx` -- navbar click handling, link-to-page resolution
- `components/cms/website/builder/section-editors/navbar-editor.tsx` -- navbar settings (currently local-only, TODO: persist via API)
- `lib/dal/menus.ts` -- menu data access
- `app/api/v1/menus/` -- menu API routes

**What needs to happen**:
- Audit: Open the public website, note the actual nav structure. Open builder, compare with page tree.
- Fix any mismatches between page tree and actual nav menu
- Wire navbar editor changes to the menu API so they persist (currently `NavbarSettings` is local state only)
- Separate Quick Links management from navigation

---

### Task 3: Undo/Redo Verification

**What to check**:
- File: `components/cms/website/builder/use-builder-history.ts`
- Current cap: `MAX_HISTORY = 50`
- Open builder -> make edits (content, reorder, add/remove sections, display settings) -> Cmd+Z should undo each -> Cmd+Shift+Z should redo
- Verify all edit types push snapshots
- Verify dirty tracking interacts correctly with undo/redo (currently: undo/redo marks all sections dirty as a safe fallback)
- Keyboard shortcuts skip when focus is in input/textarea/contenteditable
- History resets on page navigation

---

## Patterns & Conventions

### DOs

- **DO** spread content immutably on every change: `onChange({ ...content, field: newValue })`
- **DO** provide fallback defaults when destructuring content: `(content.heading as string) ?? ""`
- **DO** add new fields to `defaultContent` in `section-catalog.ts` when adding editor fields
- **DO** use `ImagePickerField` from `shared/media-fields` for image fields
- **DO** use shared primitives from `shared/` (EditorInput, EditorTextarea, EditorToggle, ArrayField, etc.)
- **DO** use shadcn/ui components (Input, Textarea, Label, Switch, Select, Separator, Button) -- never raw HTML inputs
- **DO** key `SectionEditorInline` by `section.id` to remount on section switch
- **DO** call `pushSnapshot()` before mutating state for undo support
- **DO** test in builder canvas AND on public website after changes

### DON'Ts

- **DON'T** modify `builder-section-renderer.tsx` unless adding a new section type -- it's a stable mapping layer
- **DON'T** add state to editor components that should be in BuilderShell -- editors are stateless forms that emit via onChange
- **DON'T** call API endpoints directly from editors -- all API calls go through BuilderShell handlers
- **DON'T** use `useEffect` in editors to sync content -- the key-based remount pattern handles this
- **DON'T** add debouncing to onChange without measuring -- the current instant-update gives good canvas feedback
- **DON'T** hardcode URLs in section components -- every URL must come from `content` or site settings
- **DON'T** duplicate shared components -- import from `section-editors/shared/`

### Naming conventions

- Editor files: `{category}-editor.tsx` (e.g., `hero-editor.tsx`)
- Sub-editors inside: `{SectionType}Editor` (e.g., `HeroBannerEditor`, `PageHeroEditor`)
- Content types use PascalCase: `HeroBannerContent`, `FAQContent`
- Section types use SCREAMING_SNAKE: `HERO_BANNER`, `FAQ_SECTION`
- Builder state types in `types.ts`: `BuilderSection`, `BuilderPage`, `PageSummary`
- Shared components use PascalCase: `EditorField`, `ArrayField`, `ImagePickerField`

### File organization

```
components/cms/website/builder/
  builder-shell.tsx          <- orchestrator (state + handlers + dirty tracking)
  builder-canvas.tsx         <- DnD + section rendering
  builder-topbar.tsx         <- top bar UI
  builder-sidebar.tsx        <- left 60px toolbar
  builder-drawer.tsx         <- left 320px panel (pages/design/media)
  builder-right-drawer.tsx   <- right 320px panel (section/navbar editor)
  builder-section-renderer.tsx <- SectionType -> website component map
  sortable-section.tsx       <- selection chrome + drag + toolbar
  section-add-trigger.tsx    <- "+" button
  section-picker-modal.tsx   <- add section modal
  section-catalog.ts         <- section definitions, categories, defaults
  types.ts                   <- shared TS types
  use-builder-history.ts     <- undo/redo hook
  page-tree.tsx              <- page list in drawer
  page-settings-modal.tsx    <- page metadata editor
  add-page-modal.tsx         <- new page wizard
  section-editors/
    index.tsx                <- flat registry (SectionType -> EditorComponent)
    display-settings.tsx     <- shared display controls
    json-editor.tsx          <- raw JSON fallback + debug toggle
    hero-editor.tsx          <- 5 hero sub-editors
    content-editor.tsx       <- 5 content sub-editors
    cards-editor.tsx         <- 5 card sub-editors
    data-section-editor.tsx  <- 12 data-driven sub-editors
    ministry-editor.tsx      <- 6 ministry sub-editors
    faq-editor.tsx           <- FAQ
    timeline-editor.tsx      <- Timeline
    form-editor.tsx          <- Form
    footer-editor.tsx        <- Footer
    photo-gallery-editor.tsx <- Photo Gallery
    schedule-editor.tsx      <- Recurring Schedule
    custom-editor.tsx        <- Custom HTML + Embed
    navbar-editor.tsx        <- Navbar settings
    shared/                  <- 15 reusable editor components
      field-primitives.tsx   <- EditorField, EditorInput, EditorTextarea, etc.
      array-fields.tsx       <- ArrayField<T>, SocialLinksField, AddressField
      media-fields.tsx       <- ImagePickerField, ButtonConfig
      card-fields.tsx        <- CardItemEditor, AddCardButton, GenericCard
      banners.tsx            <- DataDrivenBanner
```
