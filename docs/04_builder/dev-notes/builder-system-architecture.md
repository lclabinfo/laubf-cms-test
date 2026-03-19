# Builder System Architecture

> **Generated**: March 17, 2026
> **Purpose**: Deep technical analysis of the website builder's current implementation. Covers data flow, state management, section lifecycle, editor patterns, API integration, and actionable recommendations.

---

## 1. Data Flow Diagram

The builder follows a Server Component -> Client Shell -> Canvas -> Editor -> API -> DB loop:

```
DB (PostgreSQL)
  |
  | Prisma queries via lib/dal/pages.ts
  v
SERVER COMPONENT (app/cms/website/builder/[pageId]/page.tsx)
  |  - getPageById(churchId, pageId) -> page + sections
  |  - getPages(churchId) -> all pages for tree/switcher
  |  - resolveSectionData() for each section (events, messages, etc.)
  |  - getThemeWithCustomization() -> CSS variable tokens
  |  - getMenuByLocation('HEADER') -> navbar menu data
  |  - getSiteSettings() -> logo, site name, CTA config
  |
  | Serializes all data to plain objects (no Date, no Prisma types)
  v
BUILDER SHELL (components/cms/website/builder/builder-shell.tsx)
  |  Client component. Owns ALL builder state via useState.
  |  Receives: page, allPages, churchId, websiteThemeTokens,
  |            websiteCustomCss, navbarData, headerMenuItems
  |
  |--- BuilderTopbar (page title, undo/redo, device toggle, save/publish)
  |--- BuilderSidebar (60px, 4 tool icons)
  |--- BuilderDrawer (320px, animated, shows PageTree/Design/Media)
  |--- BuilderCanvas (center, DnD context)
  |     |--- WebsiteNavbar preview (clickable links -> page navigation)
  |     |--- SortableSection[] (one per section)
  |     |     |--- BuilderSectionRenderer (renders actual website component)
  |     |     |--- Selection chrome (borders, toolbar)
  |     |     |--- SectionAddTrigger (+ buttons)
  |     |--- DragOverlay (scaled-down section clone during drag)
  |
  |--- BuilderRightDrawer (320px, animated, section/navbar editor)
  |     |--- SectionEditorInline (keyed by section.id, remounts on switch)
  |     |     |--- SectionContentEditor (dispatches to type-specific editor)
  |     |     |--- DisplaySettings (shared: color scheme, padding, width, animations, visibility)
  |     |     |--- JsonEditor (toggle, debug-only)
  |     |--- NavbarEditor (when editing navbar)
  |
  |--- SectionPickerModal (add section: search + category + preview)
  |--- PageSettingsModal, AddPageModal
  |--- AlertDialogs (unsaved changes, section delete, page delete)
  |
  v
API (app/api/v1/pages/*)
  |  Save: PATCH /pages/{slug} (metadata)
  |         PUT /pages/{slug}/sections (reorder)
  |         PATCH /pages/{slug}/sections/{id} (content + display settings)
  |  Add:  POST /pages/{slug}/sections
  |  Del:  DELETE /pages/{slug}/sections/{id}
  |
  | Each endpoint calls lib/dal/pages.ts -> Prisma
  | Then revalidatePath('/website/...') for public site cache bust
  v
DB (PostgreSQL) -- cycle complete
```

### Key architectural decisions visible in the code:

1. **Server-side data resolution**: Dynamic section data (events, messages, videos) is resolved once on page load in the server component via `resolveSectionData()`. This data is passed as `resolvedData` on each `BuilderSection`. The canvas does NOT re-fetch when content changes -- it shows stale resolved data until the page is reloaded.

2. **Client-only rendering in canvas**: The builder uses `BuilderSectionRenderer` (file: `builder-section-renderer.tsx`), a separate component map from the website's `registry.tsx`. This is because some website sections are async Server Components (ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES) that cannot render in a client context. The builder imports client-only counterparts (`all-messages-client.tsx`, etc.) for these.

3. **Theme scoping**: Website theme CSS variables are injected only on the canvas container via inline `style` prop (line 169 of `builder-canvas.tsx`), keeping builder chrome (topbar, sidebar, drawers) on the CMS design system.

---

## 2. State Management

All state lives in `BuilderShell` via `useState`. There is no external state library (no Zustand, no Context providers, no Redux).

### State inventory (builder-shell.tsx):

| State Variable | Type | Purpose |
|---|---|---|
| `activeTool` | `BuilderTool` (add/pages/design/media/null) | Which sidebar tool is active (controls left drawer) |
| `selectedSectionId` | `string \| null` | Currently selected section in canvas |
| `deviceMode` | `DeviceMode` (desktop/tablet/mobile) | Canvas width mode |
| `sections` | `BuilderSection[]` | The ordered section list (source of truth for canvas) |
| `pageData` | `BuilderPage` | Current page metadata (title, slug, published, etc.) |
| `isDirty` | `boolean` | Any unsaved changes exist |
| `isSaving` | `boolean` | Save HTTP request in flight |
| `saveState` | `"idle" \| "saving" \| "saved"` | Visual state for save button |
| `pages` | `PageSummary[]` | All pages for tree/switcher |
| `pendingNavigationId` | `string \| null` | Page ID waiting for discard confirmation |
| `discardDialogOpen` | `boolean` | Unsaved changes dialog open |
| `pendingDeleteSectionId` | `string \| null` | Section awaiting delete confirmation |
| `deleteDialogOpen` | `boolean` | Section delete dialog open |
| `pendingDeletePageId` | `string \| null` | Page awaiting delete confirmation |
| `deletePageDialogOpen` | `boolean` | Page delete dialog open |
| `pickerOpen` | `boolean` | Section picker modal open |
| `pickerInsertIndex` | `number` | Where to insert new section |
| `pickerMode` | `PickerMode` (sidebar/popover/dialog) | Picker positioning mode |
| `pickerTriggerRect` | `DOMRect \| null` | Trigger position for popover mode |
| `editingSectionId` | `string \| null` | Which section's editor is open (right drawer) |
| `editingNavbar` | `boolean` | Navbar editor open |
| `navbarSettings` | `NavbarSettings` | Navbar configuration (local only, TODO: persist) |
| `pageSettingsOpen` | `boolean` | Page settings modal open |
| `pageSettingsTarget` | `PageSettingsData \| null` | Target page for settings modal |
| `addPageOpen` | `boolean` | Add page modal open |

### State flow patterns:

- **Props down, callbacks up**: BuilderShell passes state slices and handler callbacks to children. No Context providers.
- **Derived state**: `editingSection` (line 530-545) is computed inline from `sections` + `editingSectionId` on every render. Not memoized.
- **History**: Separate `useBuilderHistory<BuilderSnapshot>` hook manages undo/redo stacks. Snapshot = `{ sections, pageTitle }`.

### Re-render triggers:

The entire BuilderShell re-renders on any state change. Since ALL state lives here, this means every keystroke in the editor triggers a re-render of the full component tree. In practice this is acceptable because:
- React's reconciliation handles this efficiently
- The canvas sections are keyed by `section.id` and their content is passed as props
- The right drawer's `SectionEditorInline` is keyed by `section.id` so it remounts when switching sections (line 243 of `builder-right-drawer.tsx`)

### Undo/Redo (use-builder-history.ts):

- Generic stack-based hook: `past: T[]`, `future: T[]`
- Max 50 snapshots (`MAX_HISTORY = 50`)
- Uses `structuredClone()` for deep copies
- Snapshot pushed BEFORE mutation (caller responsibility via `pushSnapshot()`)
- `editingSnapshotPushedRef` prevents pushing multiple snapshots for the same editing session (one push per editor open, not per keystroke)
- Keyboard: Cmd+Z / Cmd+Shift+Z, blocked when focus is in input/textarea/contenteditable
- History resets when navigating to a different page

---

## 3. Section Lifecycle

### 3.1 Section Creation

1. User clicks `SectionAddTrigger` (+ button) on canvas or sidebar "Add Section" tool
2. `openSectionPicker(afterIndex)` or `openSectionPickerWithRect(afterIndex, rect)` called
3. `SectionPickerModal` opens in sidebar/popover/dialog mode
4. User selects a section type -> `handlePickerSelect(sectionType, defaultContent)` called
5. **API call**: `POST /api/v1/pages/{slug}/sections` with:
   - `sectionType`, `sortOrder`, `content` (from `section-catalog.ts` defaultContent), `visible: true`, `colorScheme: "LIGHT"`, `paddingY: "DEFAULT"`, `containerWidth: "STANDARD"`, `enableAnimations: true`
6. Server creates `PageSection` record via `createPageSection()` in DAL
7. Response returns the new section with server-generated `id`
8. Client: `pushSnapshot()` (for undo), splice new section into `sections` array, re-index sortOrders, set `isDirty: true`, auto-select and auto-open editor for new section

**Important**: Section creation is NOT optimistic -- it waits for the API response to get the real `id` before updating state. This means there's a brief delay between clicking and seeing the section.

### 3.2 Section Editing

1. User clicks Edit button on floating toolbar or double-clicks section -> `handleEditSection(sectionId)`
2. `editingSectionId` set, `editingNavbar` cleared
3. `BuilderRightDrawer` opens (320px, animated slide-in)
4. `SectionEditorInline` mounts (keyed by `section.id` -- remounts on section switch)
5. Editor dispatches to type-specific editor via `SectionContentEditor` (index.tsx router)
6. Any field change -> `handleContentChange(newContent)` -> `onChange({ content: newContent })` -> `handleSectionEditorChange(data)` in BuilderShell
7. BuilderShell updates `sections` array immutably, sets `isDirty: true`
8. Canvas re-renders with new content immediately (optimistic)
9. First change pushes undo snapshot via `editingSnapshotPushedRef` mechanism

### 3.3 Section Save

Save is a **batch operation** triggered by Save button (or Cmd+S or auto-save timer):

1. `handleSave()` called — guards: early return if nothing dirty, skip if `isSaving`
2. Selective API calls based on dirty flags:
   a. `PATCH /api/v1/pages/{slug}` -- page metadata (only if `pageDirty`)
   b. `PUT /api/v1/pages/{slug}/sections` -- reorder (only if `reorderDirty`). DAL reconciles stale IDs.
   c. `PATCH /api/v1/pages/{slug}/sections/{id}` -- only for sections in `dirtySectionIds` (not all N)
3. Dirty section PATCHes run via `Promise.all` (parallel)
4. If any section returns 404 (deleted by another user), removes from local state + warning toast
5. On success: clear all dirty flags, fetch fresh page data from API, merge server state (keeps local for just-saved sections, takes server for everything else), reset undo history, `router.refresh()`
6. Auto-save: 30-second debounced timer (`AUTO_SAVE_DELAY_MS = 30_000`) resets on each state change

**Performance**: Dirty tracking reduces save from N+2 to K+2 requests where K = changed sections (typically 1-3). See `dirty-tracking.md`.

### 3.4 Section Deletion

1. User clicks Delete on floating toolbar -> `handleDeleteSection(sectionId)` opens confirmation dialog
2. User confirms -> `confirmDeleteSection()`
3. **API call**: `DELETE /api/v1/pages/{slug}/sections/{id}`
4. `pushSnapshot()`, filter section from `sections` array, clear selection/editor if needed, `isDirty: true`

### 3.5 Section Reorder

1. User drags section via GripVertical handle on floating toolbar
2. `@dnd-kit` `DndContext` handles drag events
3. `onDragEnd` -> `arrayMove()` reorders, re-indexes sortOrders
4. `pushSnapshot()`, `onReorderSections(reordered)` updates state, `isDirty: true`
5. Actual API save happens on next manual/auto save

### 3.6 Section Rendering in Canvas

`BuilderSectionRenderer` (builder-section-renderer.tsx) maps `SectionType` to client-safe component:
- 37 standard types mapped directly to their website section components
- 3 special async types (ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES) use client counterparts with pre-resolved data
- Fallback: dashed border placeholder with type code name
- Color scheme, padding, container width converted from DB enums (UPPERCASE) to component format (lowercase)
- `enableAnimations` forced to `false` in builder canvas
- HERO_BANNER gets special `!mt-0` override to neutralize negative margin

---

## 4. Editor Pattern

### 4.1 Editor Routing (section-editors/index.tsx)

The `SectionContentEditor` function is a category-based router:

```
SectionType -> Category array lookup -> Category editor component
```

| Category | Types | Editor File | Pattern |
|---|---|---|---|
| Heroes (5) | HERO_BANNER, PAGE_HERO, TEXT_IMAGE_HERO, EVENTS_HERO, MINISTRY_HERO | `hero-editor.tsx` | Switch on sectionType, each has own sub-component |
| Content (6) | MEDIA_TEXT, QUOTE_BANNER, CTA_BANNER, ABOUT_DESCRIPTION, STATEMENT, SPOTLIGHT_MEDIA | `content-editor.tsx` | Switch on sectionType |
| Cards (6) | ACTION_CARD_GRID, HIGHLIGHT_CARDS, FEATURE_BREAKDOWN, PATHWAY_CARD, PILLARS, NEWCOMER | `cards-editor.tsx` | Switch on sectionType |
| Data (10) | ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS, UPCOMING_EVENTS, EVENT_CALENDAR, RECURRING_MEETINGS, MEDIA_GRID, QUICK_LINKS, DAILY_BREAD_FEATURE | `data-section-editor.tsx` | Conditional renders per type |
| Ministry (6) | MINISTRY_INTRO, MINISTRY_SCHEDULE, CAMPUS_CARD_GRID, MEET_TEAM, LOCATION_DETAIL, DIRECTORY_LIST | `ministry-editor.tsx` | Switch on sectionType |
| FAQ | FAQ_SECTION | `faq-editor.tsx` | Standalone |
| Timeline | TIMELINE_SECTION | `timeline-editor.tsx` | Standalone |
| Form | FORM_SECTION | `form-editor.tsx` | Standalone |
| Footer | FOOTER | `footer-editor.tsx` | Standalone |
| Photo Gallery | PHOTO_GALLERY | `photo-gallery-editor.tsx` | Standalone |
| Schedule | RECURRING_SCHEDULE | `schedule-editor.tsx` | Standalone |
| Custom (2) | CUSTOM_HTML, CUSTOM_EMBED | `custom-editor.tsx` | Switch on sectionType |
| Fallback | Any unmapped | `json-editor.tsx` | Raw JSON textarea |

Total: **14 editor files** covering all 41 section types.

### 4.2 Editor data flow

```
BuilderRightDrawer
  |-- SectionEditorInline (keyed by section.id, owns local content + displaySettings state)
  |     |
  |     |-- SectionContentEditor (dispatches to type-specific editor)
  |     |     |-- e.g., HeroBannerEditor
  |     |     |     reads: content (Record<string, unknown>)
  |     |     |     emits: onChange(newContent) -- full content object replacement
  |     |     |
  |     |-- DisplaySettings
  |     |     reads: DisplaySettingsData (colorScheme, paddingY, containerWidth, etc.)
  |     |     emits: onChange(newSettings) -- full settings replacement
  |     |
  |     emits to parent: onChange({ content?, colorScheme?, paddingY?, ... })
  |                       (Partial<SectionEditorData>)
  |
  parent = BuilderShell.handleSectionEditorChange(data)
    -> updates sections[] immutably
    -> sets isDirty = true
```

### 4.3 Common subcomponents (duplicated across editors)

These helper components are **copy-pasted** across multiple editor files rather than shared:

| Component | Appears In | Purpose |
|---|---|---|
| `ButtonConfig` | hero-editor.tsx, content-editor.tsx | label + href + visible toggle |
| `ImagePickerField` | hero-editor.tsx, content-editor.tsx, cards-editor.tsx | Image URL with media picker dialog, preview, replace/remove |
| `CardItemEditor` | cards-editor.tsx | Generic card with title, description, image, link |
| `AddCardButton` | cards-editor.tsx | Dashed border "Add" button for arrays |

### 4.4 Editor conventions

- Every editor receives `content: Record<string, unknown>` and `onChange: (content: Record<string, unknown>) => void`
- Content is destructured with type assertions and fallback defaults at the top of each editor function
- Changes emit the FULL content object (spread old + override changed field)
- No partial/incremental updates -- every field change replaces the entire content object
- No debouncing in editors -- every keystroke propagates up
- No validation -- editors trust that the content structure matches what the component expects

---

## 5. API Integration

### 5.1 Endpoint map

| Operation | Method | URL | Auth | Handler |
|---|---|---|---|---|
| List pages | GET | /api/v1/pages | None | getPages(churchId) |
| Create page | POST | /api/v1/pages | None | createPage(churchId, body) |
| Get page | GET | /api/v1/pages/[slug] | None | getPageBySlugOrId(churchId, slug) |
| Update page | PATCH | /api/v1/pages/[slug] | website.pages.edit | updatePage(churchId, id, body) |
| Delete page | DELETE | /api/v1/pages/[slug] | website.pages.delete | deletePage(churchId, id) |
| Create section | POST | /api/v1/pages/[slug]/sections | website.pages.edit | createPageSection(churchId, pageId, body) |
| Reorder sections | PUT | /api/v1/pages/[slug]/sections | website.pages.edit | reorderPageSections(churchId, pageId, ids) |
| Update section | PATCH | /api/v1/pages/[slug]/sections/[id] | website.pages.edit | updatePageSection(churchId, id, body) |
| Delete section | DELETE | /api/v1/pages/[slug]/sections/[id] | website.pages.edit | deletePageSection(churchId, id) |

### 5.2 Slug vs ID routing

The builder routes by page ID (`/cms/website/builder/[pageId]`) but API routes use slug (`/api/v1/pages/[slug]`). Resolution:

- `pagePathId(page)` helper (line 57 of builder-shell.tsx) returns `page.slug || page.id`
- This handles the homepage case where slug is empty string
- API's `getPageBySlugOrId()` (pages.ts line 120) tries UUID first if the value looks like a UUID, then falls back to slug

### 5.3 Save flow detail

The save function (`handleSave` in builder-shell.tsx) makes **K+2 requests** where K = dirty sections:

1. `PATCH /pages/{slug}` -- page title (only if `pageDirty`)
2. `PUT /pages/{slug}/sections` -- section ID array for reorder (only if `reorderDirty`). DAL reconciles stale IDs from concurrent users.
3. `PATCH /pages/{slug}/sections/{id}` x K -- only dirty sections, all in `Promise.all`. 404s handled gracefully (section deleted by another user).

Each section PATCH sends: `content`, `colorScheme`, `paddingY`, `containerWidth`, `enableAnimations`, `visible`, `label`.

After save: fetch fresh page data from API, merge server state (keeps local for just-saved sections, takes server for others), reset undo history, then `router.refresh()`. See `dirty-tracking.md` for the full save flow.

### 5.4 Cache invalidation

API routes call `revalidatePath('/website/...')` after mutations, busting Next.js cache for the public website. The builder's `router.refresh()` also refreshes its own server component data.

---

## 6. Current Pain Points & Optimization Opportunities

### 6.1 Duplicated helper components

`ButtonConfig` and `ImagePickerField` are copy-pasted across hero-editor.tsx, content-editor.tsx, and cards-editor.tsx. Each copy is nearly identical (same props, same MediaPickerDialog integration, same layout). These should be extracted to shared files.

**Files affected**: `hero-editor.tsx` (lines 22-116), `content-editor.tsx` (lines 16-118), `cards-editor.tsx` (lines 22-67)

### 6.2 ~~N+2 save requests~~ → IMPLEMENTED: Dirty section tracking + selective save

~~Every save sends ALL sections, not just changed ones.~~

**Implemented (March 18-19):** Dirty tracking via `dirtySectionIds: Set<string>`, `reorderDirty`, `pageDirty` in BuilderShell. Only dirty sections are PATCHed on save (K+2 requests instead of N+2). Post-save refetch merges other users' changes. Background sync (15s) keeps idle users up to date. See `docs/04_builder/dev-notes/concurrent-editing-strategy.md` and `docs/04_builder/dev-notes/dirty-tracking.md`.

### 6.3 No content validation

Editors emit `Record<string, unknown>` with no schema validation. If an editor has a bug and emits malformed content, it's saved to the DB and may break the public website. A Zod schema per section type would catch this.

### 6.4 Full content replacement on every keystroke

Each field change in an editor spreads the entire content object and propagates up through `handleContentChange -> onChange -> handleSectionEditorChange -> setSections`. This works but creates unnecessary object allocations. A path-based update (e.g., `updateContent('heading.line1', value)`) would be more efficient for deeply nested content.

### 6.5 ~~SectionEditorInline local state sync~~ — FIXED March 18

~~`SectionEditorInline` had local state that didn't sync with external changes (undo).~~ **Fixed**: `SectionEditorInline` is now a fully controlled component — it reads `content` and display settings directly from the `section` prop passed by BuilderShell. No local state. Undo/redo, background sync, and post-save merge all reflect immediately in the editor.

### 6.6 Resolved data staleness

Dynamic sections (events, messages) get their data resolved once on page load by the server component. If the user edits content fields that affect data resolution (e.g., changing `count` on HIGHLIGHT_CARDS from 3 to 6), the canvas won't show the updated data until the page is saved and reloaded. There's no mechanism to re-resolve data without a full page navigation.

### 6.7 ~~Category-based editor routing adds indirection~~ — FIXED March 18

~~Required 2-file changes to add a section type.~~ **Fixed**: Flat registry in `section-editors/index.tsx` — one entry per type. Adding a new section editor is a 1-line change.

### 6.8 No TypeScript content typing

All content is `Record<string, unknown>`. Each editor manually casts fields with `as` assertions and provides fallback defaults. There's no compile-time guarantee that an editor matches its section component's expected content shape. Content type interfaces exist in the section components (e.g., `HeroBannerContent` in hero-banner.tsx) but are not shared with the editors.

---

## 7. Recommendations

### R0: Iframe canvas migration — IMPLEMENTED March 18

**Status: COMPLETE.**

Canvas now renders sections in an `<iframe>` sized to the target device width. Media queries respond to iframe viewport, not parent viewport. Route group `(editor)/` isolates builder chrome from preview. Iframe scrolls internally (industry standard pattern). Type-safe postMessage protocol with 14 message types.

See `docs/04_builder/worklog/builder-responsive-rendering-bug.md` and `docs/04_builder/worklog/iframe-layout-isolation-fix.md`.

### R1: Extract shared editor primitives (High priority, low effort)

Create `components/cms/website/builder/section-editors/shared.tsx`:

```typescript
// Move from hero-editor.tsx, content-editor.tsx, cards-editor.tsx:
export function ButtonConfig({ ... }) { ... }
export function ImagePickerField({ ... }) { ... }
export function CardItemEditor({ ... }) { ... }
export function AddCardButton({ ... }) { ... }
```

This eliminates ~300 lines of duplication across 3 files and ensures bug fixes propagate.

### R2: Create content type definitions (High priority, medium effort)

Create `components/cms/website/builder/section-content-types.ts` with TypeScript interfaces for each section's content shape. Share between editors and section components. Example:

```typescript
export interface HeroBannerContent {
  heading: { line1: string; line2: string }
  subheading?: string
  primaryButton?: { label: string; href: string; visible: boolean }
  secondaryButton?: { label: string; href: string; visible: boolean }
  backgroundImage: { src: string; alt: string; objectPosition?: string }
  backgroundVideoUrl?: string
}
```

This would replace `Record<string, unknown>` + manual casting in editors with proper types.

### R3: Flat editor registry (Medium priority, medium effort)

Replace the category-based routing in `index.tsx` with a flat map:

```typescript
const SECTION_EDITORS: Partial<Record<SectionType, React.ComponentType<EditorProps>>> = {
  HERO_BANNER: HeroBannerEditor,
  PAGE_HERO: PageHeroEditor,
  // ... one entry per type
}
```

This makes adding a new section editor a 1-line change (add to the map) instead of modifying two files.

### R4: Track dirty sections for optimized save — IMPLEMENTED March 18

**Status: COMPLETE.** `dirtySectionIds: Set<string>`, `reorderDirty`, `pageDirty` flags in BuilderShell. Save only PATCHes dirty sections. Post-save refetch merges other users' changes. Background sync (15s) keeps idle users up to date. See `docs/04_builder/dev-notes/dirty-tracking.md`.

### R7: Presence awareness for concurrent editing — IMPLEMENTED March 19

**Status: COMPLETE.** `BuilderPresence` Prisma model + heartbeat API (`/api/v1/builder/presence`). `usePresenceHeartbeat` hook (30s). Amber warning banner: "X is also editing this page — your changes may overwrite theirs if you save now." `useBackgroundSync` hook (15s polling). Post-save refetch + merge. Resilient reorder DAL. 11 bugs found and fixed via QA audit. See `docs/04_builder/dev-notes/concurrent-editing-strategy.md`.

### R5: Consider debouncing editor changes (Low priority, low effort)

Add a 150ms debounce in `SectionEditorInline.handleContentChange` before propagating to BuilderShell. This reduces re-renders during typing without noticeable lag.

### R6: Checklist for adding a new section type

Currently requires changes in 5+ files. Document the exact checklist:

1. Add enum value to `SectionType` in Prisma schema
2. Add entry to `SECTION_CATALOG` in `section-catalog.ts` (label, description, icon, category, defaultContent)
3. Add preview thumbnail to `CATEGORY_PREVIEWS` in `section-picker-modal.tsx`
4. Create section component in `components/website/sections/`
5. Register in `components/website/sections/registry.tsx`
6. Register in `components/cms/website/builder/builder-section-renderer.tsx`
7. Create editor component in `section-editors/`
8. Register in `section-editors/index.tsx` (add to type array + add to `hasStructuredEditor`)

This is unavoidable complexity for a system with 40+ types, but documenting it clearly prevents mistakes.
