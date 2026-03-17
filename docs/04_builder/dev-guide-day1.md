# Builder Development Guide -- Day 1

> Concise working reference for Claude Code sessions on builder work.
> Not a design doc -- a practical map of what's where and how to change it.

---

## System Quick Reference

### Core files (read these first)

| File | Role |
|---|---|
| `components/cms/website/builder/builder-shell.tsx` | **Orchestrator.** All state lives here. All handlers. ~1140 lines. |
| `components/cms/website/builder/builder-canvas.tsx` | Canvas with DnD, renders sections, navbar preview |
| `components/cms/website/builder/builder-right-drawer.tsx` | Right panel: wraps `SectionEditorInline` + `NavbarEditor` |
| `components/cms/website/builder/section-editors/index.tsx` | Router: dispatches sectionType to the correct editor component |
| `components/cms/website/builder/section-catalog.ts` | Section type registry: labels, descriptions, icons, defaultContent |
| `components/cms/website/builder/builder-section-renderer.tsx` | Maps SectionType -> client-safe website component for canvas |
| `components/cms/website/builder/use-builder-history.ts` | Undo/redo stack (50 max, structuredClone snapshots) |
| `components/cms/website/builder/types.ts` | `BuilderSection`, `BuilderPage`, `PageSummary`, etc. |

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

### Section editor files (14 total)

| File | Covers |
|---|---|
| `section-editors/hero-editor.tsx` | HERO_BANNER, PAGE_HERO, TEXT_IMAGE_HERO, EVENTS_HERO, MINISTRY_HERO |
| `section-editors/content-editor.tsx` | MEDIA_TEXT, QUOTE_BANNER, CTA_BANNER, ABOUT_DESCRIPTION, STATEMENT, SPOTLIGHT_MEDIA |
| `section-editors/cards-editor.tsx` | ACTION_CARD_GRID, HIGHLIGHT_CARDS, FEATURE_BREAKDOWN, PATHWAY_CARD, PILLARS, NEWCOMER |
| `section-editors/data-section-editor.tsx` | ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS, UPCOMING_EVENTS, EVENT_CALENDAR, RECURRING_MEETINGS, MEDIA_GRID, QUICK_LINKS, DAILY_BREAD_FEATURE |
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

---

## How Section Editors Work

### To add a field to an existing editor:

1. Open the editor file (e.g., `hero-editor.tsx`)
2. Find the sub-editor function for your section type (e.g., `HeroBannerEditor`)
3. Destructure the field from content with a type assertion and fallback:
   ```typescript
   const myField = (content.myField as string) ?? ""
   ```
4. Add the form control (Input, Textarea, Switch, etc.)
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
   - Add the sectionType to the appropriate category array (or create a new conditional block)
   - Add to `hasStructuredEditor()` if applicable
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
  -> Canvas re-renders with new content
  -> isDirty = true (enables Save button, starts auto-save timer)
```

---

## Day 1 Tasks

### Task 1: Fix Hardcoded URLs (4 components)

These are website section components (NOT editor files). Each has a hardcoded URL that must be read from `content` instead.

**1a. HERO_BANNER -- hardcoded video URL**
- File: `components/website/sections/hero-banner.tsx`
- Line 9: `const COMPRESSED_VIDEO = "https://pub-91add7d8455848c9a871477af3249f9e.r2.dev/la-ubf/initial-setup/compressed-hero-vid.webm"`
- Fix: Read from `content.backgroundVideoUrl` with fallback to the current constant. The component already checks if `backgroundImage.src` ends with `.mp4`/`.webm` (line 33). The mobile-specific `COMPRESSED_VIDEO` should come from `content.mobileVideoUrl` or similar.
- Editor change: Add a "Video URL" text input to `HeroBannerEditor` in `hero-editor.tsx` (below the Background Image section).
- Catalog change: Add `backgroundVideoUrl: ""` to `HERO_BANNER` defaultContent in `section-catalog.ts`.
- Verify: Open builder, edit a Hero Banner section, set video URL, save, check canvas + public site.

**1b. STATEMENT -- hardcoded mask image**
- File: `components/website/sections/statement.tsx`
- Search for hardcoded R2 URL or mask/watermark image reference
- Fix: Read from `content.maskImage` with fallback, or remove if purely decorative

**1c. FEATURE_BREAKDOWN -- hardcoded watermark**
- File: `components/website/sections/feature-breakdown.tsx`
- Search for hardcoded URL (R2 CDN or similar)
- Fix: Read from `content.watermarkImage` with fallback, or remove

**1d. FOOTER -- hardcoded logo**
- File: `components/website/sections/footer.tsx`
- Search for hardcoded logo URL
- Fix: Read from `content.logoSrc` or from site settings (logoUrl). The footer editor already has some fields -- may need to add a logo image picker.

### Task 2: Navigation Fix

**What's broken**: The page tree sidebar in the builder does not match the actual public website navigation. Quick Links are mixed in with navbar items.

**Files to investigate**:
- `components/cms/website/builder/page-tree.tsx` -- the page tree component in the left drawer
- `components/cms/website/builder/builder-shell.tsx` lines 599-682 -- navbar click handling, link-to-page resolution
- `components/cms/website/builder/section-editors/navbar-editor.tsx` -- navbar settings (currently local-only, TODO: persist via API)
- `lib/dal/menus.ts` -- menu data access
- `app/api/v1/menus/` -- menu API routes

**What needs to happen**:
- Audit: Open the public website, note the actual nav structure. Open builder, compare with page tree.
- Fix any mismatches between page tree and actual nav menu
- Wire navbar editor changes to the menu API so they persist (currently `NavbarSettings` is local state only -- see builder-shell.tsx line 609-615 `// TODO: persist navbar settings via API`)
- Separate Quick Links management from navigation

### Task 3: Undo/Redo Verification

**What to check**:
- File: `components/cms/website/builder/use-builder-history.ts`
- Current cap: `MAX_HISTORY = 50` (line 3) -- already set
- Open builder -> make edits (content, reorder, add/remove sections, display settings) -> Cmd+Z should undo each -> Cmd+Shift+Z should redo
- Verify all edit types push snapshots:
  - Content edit: snapshot pushed once per editor open (line 561-563 of builder-shell.tsx, `editingSnapshotPushedRef`)
  - Reorder: pushed in `handleReorderSections` (line 506-510)
  - Add section: pushed in `handlePickerSelect` (line 441)
  - Delete section: pushed in `confirmDeleteSection` (line 483)
  - Title change: pushed in `handleTitleChange` (line 621-625)
- Keyboard shortcuts skip when focus is in input/textarea/contenteditable (line 351-358)
- History resets on page navigation (line 173)

### Task 4: Section Editor Spec Review

**File**: `docs/04_builder/section-editor-spec.md`

This doc maps every section's editor fields (current vs should-be). David needs to review and annotate decisions for the 13 sections that need changes. The doc is organized by section category with tables showing:
- Currently Exposed fields
- Should Be Editable fields
- Gap description
- Effort estimate

After David marks decisions, implementation follows the patterns described above in "How Section Editors Work."

---

## Patterns & Conventions

### DOs

- **DO** spread content immutably on every change: `onChange({ ...content, field: newValue })`
- **DO** provide fallback defaults when destructuring content: `(content.heading as string) ?? ""`
- **DO** add new fields to `defaultContent` in `section-catalog.ts` when adding editor fields
- **DO** use `MediaPickerDialog` for image fields (not raw URL text inputs)
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

### Naming conventions

- Editor files: `{category}-editor.tsx` (e.g., `hero-editor.tsx`)
- Sub-editors inside: `{SectionType}Editor` (e.g., `HeroBannerEditor`, `PageHeroEditor`)
- Content types use PascalCase: `HeroBannerContent`, `FAQContent`
- Section types use SCREAMING_SNAKE: `HERO_BANNER`, `FAQ_SECTION`
- Builder state types in `types.ts`: `BuilderSection`, `BuilderPage`, `PageSummary`

### File organization

```
components/cms/website/builder/
  builder-shell.tsx          <- orchestrator (state + handlers)
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
    index.tsx                <- router (sectionType -> editor)
    display-settings.tsx     <- shared display controls
    json-editor.tsx          <- raw JSON fallback
    hero-editor.tsx          <- 5 hero sub-editors
    content-editor.tsx       <- 6 content sub-editors
    cards-editor.tsx         <- 6 card sub-editors
    data-section-editor.tsx  <- 10 data-driven sub-editors
    ministry-editor.tsx      <- 6 ministry sub-editors
    faq-editor.tsx           <- FAQ
    timeline-editor.tsx      <- Timeline
    form-editor.tsx          <- Form
    footer-editor.tsx        <- Footer
    photo-gallery-editor.tsx <- Photo Gallery
    schedule-editor.tsx      <- Recurring Schedule
    custom-editor.tsx        <- Custom HTML + Embed
    navbar-editor.tsx        <- Navbar settings
```
