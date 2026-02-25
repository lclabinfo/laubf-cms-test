# Website Builder Implementation Plan

## Overview

We are building a full-screen website builder that replaces the current basic CMS page editor at `app/cms/(dashboard)/website/pages/[slug]/page.tsx`. The builder is modeled after the Figma prototype at `figma-cms-2:11:26/` and must work with the existing 38 section components (`components/website/sections/`), database schema (Prisma), and LA UBF seed data.

The current editor is a two-column layout (sections list + metadata sidebar) inside the CMS dashboard shell. The new builder will be a full-screen experience that hides the CMS sidebar and renders a live canvas preview of the actual website sections.

## Architecture

The builder lives at `app/cms/website/builder/` (outside the `(dashboard)` route group so it does NOT inherit the `CmsShell` sidebar layout from `app/cms/(dashboard)/layout.tsx`). It still inherits the `CmsThemeProvider` from `app/cms/layout.tsx`.

### Layout Structure

```
+------------------------------------------------------------+
| Top Bar (56px)                                              |
| [<- Back] [Page Title v] [Desktop|Tablet|Mobile] [Save] [Publish] |
+------+------------+---------------------------------------+
| Left | Left       | Canvas (center)                       |
| Bar  | Drawer     |                                       |
| 60px | 320px      |   +-----------------------------+     |
|      | (animated, |   | Section 1 (actual component) |     |
| [+]  | opens on   |   +-----------------------------+     |
| [pg] | tool       |   |        [+ Add Section]       |     |
| [ds] | click)     |   +-----------------------------+     |
| [img]|            |   | Section 2 (actual component) |     |
|      |            |   +-----------------------------+     |
|      |            |                                       |
+------+------------+---------------------------------------+
```

### Key Components

| Component | Location | Description |
|---|---|---|
| Builder layout | `app/cms/website/builder/layout.tsx` | Full-screen layout, no CMS sidebar, includes auth check |
| Builder page | `app/cms/website/builder/page.tsx` | Redirects to homepage or page selector |
| Builder [pageId] | `app/cms/website/builder/[pageId]/page.tsx` | Loads page data by ID, renders builder |
| BuilderShell | `components/cms/website/builder/builder-shell.tsx` | Client component orchestrating all builder UI |
| BuilderTopbar | `components/cms/website/builder/builder-topbar.tsx` | Page title, device toggle, save/publish, back |
| BuilderSidebar | `components/cms/website/builder/builder-sidebar.tsx` | 60px left toolbar with 4 icon buttons |
| BuilderDrawer | `components/cms/website/builder/builder-drawer.tsx` | Animated 320px left drawer |
| BuilderCanvas | `components/cms/website/builder/builder-canvas.tsx` | Central preview canvas rendering sections |
| SortableSection | `components/cms/website/builder/sortable-section.tsx` | Section wrapper with selection/hover/drag/toolbar |
| SectionAddTrigger | `components/cms/website/builder/section-add-trigger.tsx` | Plus button between sections |
| SectionPickerModal | `components/cms/website/builder/section-picker-modal.tsx` | Modal for choosing section type to add |
| SectionEditorModal | `components/cms/website/builder/section-editor-modal.tsx` | Modal for editing section content |
| PageSettingsModal | `components/cms/website/builder/page-settings-modal.tsx` | Modal for editing page title/slug/SEO |
| AddPageModal | `components/cms/website/builder/add-page-modal.tsx` | 3-step wizard for creating new pages |
| PageTree | `components/cms/website/builder/page-tree.tsx` | Hierarchical page list in drawer |
| DesignPanel | `components/cms/website/builder/design-panel.tsx` | Theme/design controls in drawer |
| DevicePreview | `components/cms/website/builder/device-preview.tsx` | Desktop/tablet/mobile toggle |
| section-catalog.ts | `components/cms/website/builder/section-catalog.ts` | Section type definitions, categories, descriptions |

## Existing Infrastructure

### What Already Exists (REUSE)

1. **Section components** -- 38 components in `components/website/sections/`, all registered in `registry.tsx` with `SectionRenderer`
2. **Section picker dialog** -- `components/cms/website/pages/section-picker-dialog.tsx` (categories, labels, type definitions)
3. **Section editor dialog** -- `components/cms/website/pages/section-editor-dialog.tsx` (display settings + raw JSON editor)
4. **API routes** -- Full CRUD at:
   - `GET/POST /api/v1/pages` -- List/create pages
   - `GET/PATCH/DELETE /api/v1/pages/[slug]` -- Single page CRUD
   - `GET/POST /api/v1/pages/[slug]/sections` -- List/create sections, `PUT` for reorder
   - `PATCH/DELETE /api/v1/pages/[slug]/sections/[id]` -- Update/delete section
   - `GET/PATCH /api/v1/theme` -- Theme CRUD
   - `GET/POST /api/v1/menus` -- Menu CRUD
   - `GET/PATCH /api/v1/site-settings` -- Site settings
5. **Database models** -- `Page`, `PageSection`, `Menu`, `MenuItem`, `Theme`, `ThemeCustomization`, `SiteSettings`, `Domain` in `prisma/schema.prisma`
6. **Pages list** -- `app/cms/(dashboard)/website/pages/page.tsx` (DataTable with search, sort, delete)
7. **Page editor** -- `app/cms/(dashboard)/website/pages/[slug]/page.tsx` (full current editor, to be replaced by builder link)
8. **Figma prototype components** -- Reference implementations at `figma-cms-2:11:26/src/app/components/modules/website/`:
   - `pages/Builder.tsx` -- Full builder with DnD, canvas, page tree, section editor
   - `pages/BuilderSidebar.tsx` -- 4-tool sidebar + drawer wrapper
   - `SortableSectionWrapper.tsx` -- Section selection, hover, drag, floating toolbar
   - `SectionPickerModal.tsx` -- Search + sidebar list + preview area
   - `SectionAddTrigger.tsx` -- Animated plus button (motion/react)
   - `AddPageModal.tsx` -- 3-step wizard (type -> template -> configure)
   - `PageSettingsModal.tsx` -- Title, slug, connected ministry
   - `pages/SectionEditor.tsx` -- Per-type rich editors (team, stories, FAQ, meetings, hero, about)

### What Needs to Be Installed

- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` -- Drag and drop (NOT currently in package.json)
- `motion` (framer-motion successor) -- Already used in Figma prototype for SectionAddTrigger animations. Check if already installed; if not, add it.

## Database Schema Reference

### Page Model (key fields)
- `id` (UUID), `churchId`, `slug`, `title`
- `pageType` (STANDARD | LANDING | MINISTRY | CAMPUS | SYSTEM)
- `layout` (DEFAULT | FULL_WIDTH | NARROW)
- `isHomepage`, `isPublished`, `publishedAt`
- `parentId` (self-referential for hierarchy)
- `sortOrder`, `metaTitle`, `metaDescription`, `noIndex`

### PageSection Model (key fields)
- `id` (UUID), `churchId`, `pageId`
- `sectionType` (SectionType enum -- 38 values)
- `label`, `sortOrder`, `visible`
- `colorScheme` (LIGHT | DARK)
- `paddingY` (NONE | COMPACT | DEFAULT | SPACIOUS)
- `containerWidth` (NARROW | STANDARD | FULL)
- `enableAnimations`
- `content` (JSONB -- section-specific data)

### SectionType Enum (38 types, 7 categories)
- **Heroes (5):** HERO_BANNER, PAGE_HERO, TEXT_IMAGE_HERO, EVENTS_HERO, MINISTRY_HERO
- **Content (8):** MEDIA_TEXT, MEDIA_GRID, SPOTLIGHT_MEDIA, PHOTO_GALLERY, QUOTE_BANNER, CTA_BANNER, ABOUT_DESCRIPTION, STATEMENT
- **Cards (6):** ACTION_CARD_GRID, HIGHLIGHT_CARDS, FEATURE_BREAKDOWN, PATHWAY_CARD, PILLARS, NEWCOMER
- **Lists & Data (6):** ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS, UPCOMING_EVENTS, EVENT_CALENDAR, RECURRING_MEETINGS, RECURRING_SCHEDULE
- **Ministry (6):** MINISTRY_INTRO, MINISTRY_SCHEDULE, CAMPUS_CARD_GRID, DIRECTORY_LIST, MEET_TEAM, LOCATION_DETAIL
- **Interactive (3):** FORM_SECTION, FAQ_SECTION, TIMELINE_SECTION
- **Layout (5):** NAVBAR, FOOTER, QUICK_LINKS, CUSTOM_HTML, CUSTOM_EMBED

---

## Phases & Tasks

### Phase 1: Layout & Navigation Shell (P0)

The foundational builder UI -- full-screen layout, toolbar, drawer, top bar, routing.

**Tasks:**

- [~] **1.1** Create builder layout at `app/cms/website/builder/layout.tsx`
  - Full-screen (100vh), no CMS sidebar -- DONE
  - Inherits `CmsThemeProvider` from parent `app/cms/layout.tsx` -- DONE (inherits from `app/cms/layout.tsx`)
  - Auth check: redirect to `/cms/login` if no session -- DONE (uses `auth()` from `lib/auth`)
  - Pass session data to children -- TODO (session not yet passed as props)
  - Toaster component included -- DONE (sonner, bottom-right)

- [~] **1.2** Create builder entry page at `app/cms/website/builder/page.tsx`
  - Fetch all pages via DAL (`getPages`, `getHomepageForAdmin`) -- DONE
  - Redirect to builder for homepage (first page with `isHomepage: true`) -- DONE
  - If no homepage, redirect to first page by sortOrder -- DONE
  - If no pages, show "Create your first page" empty state -- DONE
  - TODO: Empty state needs "Create Page" button with action

- [ ] **1.3** Create builder page route at `app/cms/website/builder/[pageId]/page.tsx`
  - Server component that loads page data by ID
  - Passes page data to `BuilderShell` client component
  - Note: current API uses slug-based routes; may need to add ID-based lookup or use slug

- [ ] **1.4** Create `BuilderSidebar` component (60px left toolbar)
  - 4 icon buttons: Plus (Add Section), FileText (Pages & Menu), Palette (Design), Image (Media)
  - Active state: blue background highlight
  - Toggle behavior: clicking active tool closes drawer
  - Tooltip on hover showing tool name
  - Reference: `figma-cms-2:11:26/src/app/components/modules/website/pages/BuilderSidebar.tsx`

- [ ] **1.5** Create `BuilderDrawer` component
  - 320px wide animated panel, slides in from left
  - Header with title + close button
  - Opens when a sidebar tool is clicked, closes on X or clicking same tool
  - Smooth transition animation (slide + fade)
  - Reference: `BuilderDrawer` in Figma prototype `BuilderSidebar.tsx` lines 95-119

- [ ] **1.6** Create `BuilderTopbar` component (56px top bar)
  - Left: Back arrow button (navigate to `/cms/website/pages`)
  - Center-left: Page title (editable inline or dropdown showing page list)
  - Center: Device preview toggle (Desktop / Tablet / Mobile icons)
  - Right: Save button, Publish/Unpublish button
  - Show unsaved indicator when changes exist

- [ ] **1.7** Create `BuilderShell` client component
  - Orchestrates: topbar, sidebar, drawer, canvas
  - Manages state: `activeTool`, `selectedSectionId`, `deviceMode`, `activePage`, `sections`, `isDirty`
  - Loads page data, provides context to children

- [ ] **1.8** Wire up routing from pages list to builder
  - Update `app/cms/(dashboard)/website/pages/page.tsx`: row click navigates to `/cms/website/builder/{pageId}` instead of `/cms/website/pages/{slug}`
  - Update edit dropdown menu link similarly
  - Keep the old `[slug]/page.tsx` editor route functional as fallback

### Phase 2: Canvas & Section Rendering (P0)

Live preview canvas that renders actual section components with interactive overlays.

**Tasks:**

- [ ] **2.1** Create `BuilderCanvas` component
  - Central area, scrollable, renders all sections in order
  - Background: light gray (`bg-muted/30`) with centered "page" container
  - Uses `SectionRenderer` from `components/website/sections/registry.tsx` for each section
  - Wraps each section in `SortableSection` for interactivity
  - Canvas click (not on section) deselects current section
  - Device-responsive container widths: Desktop (100%), Tablet (768px), Mobile (375px)

- [ ] **2.2** Create `SortableSection` wrapper component
  - Wraps each section with interactive chrome:
    - **Hover state:** Blue dashed border (`border-blue-600/30`)
    - **Selected state:** Solid blue border + shadow (`border-2 border-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]`)
    - **Floating toolbar:** Dark pill positioned top-right (or bottom-right for first section) with:
      - Drag handle (GripVertical icon)
      - Edit button (Edit3 icon)
      - Delete button (Trash2 icon, red)
    - **Plus buttons:** Top and bottom of selected section, centered, for adding sections
  - Click handler: select section (stopPropagation to prevent canvas deselect)
  - Reference: `figma-cms-2:11:26/src/app/components/modules/website/SortableSectionWrapper.tsx`

- [ ] **2.3** Implement section selection
  - Click section to select (blue border + floating toolbar)
  - Click canvas background to deselect
  - Escape key to deselect
  - Only one section selected at a time

- [ ] **2.4** Create `SectionAddTrigger` component
  - Circular blue plus button (28px) positioned at section borders
  - Expands on hover to show "Add Section" text (animated with motion/react or CSS)
  - Click opens `SectionPickerModal`
  - Reference: `figma-cms-2:11:26/src/app/components/modules/website/SectionAddTrigger.tsx`

- [ ] **2.5** Install and configure `@dnd-kit`
  - `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
  - Wrap canvas in `DndContext` + `SortableContext`
  - Implement `useSortable` in `SortableSection`
  - `onDragEnd`: reorder sections array, call `PUT /api/v1/pages/{slug}/sections` with new order

- [ ] **2.6** Implement drag-and-drop section reordering
  - Drag handle visible on selected section's floating toolbar
  - Dragging section becomes semi-transparent
  - Drop target indicators between sections
  - On drop: optimistic reorder + API call
  - `DragOverlay` for smooth visual feedback during drag

- [ ] **2.7** Implement device preview modes
  - `DevicePreview` toggle component in top bar (Monitor, Tablet, Smartphone icons)
  - Modes: Desktop (max-width: 100%), Tablet (max-width: 768px), Mobile (max-width: 375px)
  - Canvas container adjusts width with transition
  - Scroll position maintained on mode switch

### Phase 3: Section Picker Modal (P0)

Modal for choosing which section type to add to the page.

**Tasks:**

- [ ] **3.1** Create `SectionPickerModal` component
  - Two-panel layout: sidebar list (240px) + preview area (remaining)
  - Header with search input
  - Categories from existing `sectionCategories` in `section-picker-dialog.tsx`:
    - Heroes, Content, Cards & Grids, Lists & Data, Ministry, Interactive, Layout
  - Section items show: icon, label, description
  - Hover on item shows preview in right panel
  - Click on item or preview adds the section
  - Reference: `figma-cms-2:11:26/src/app/components/modules/website/SectionPickerModal.tsx`

- [ ] **3.2** Create `section-catalog.ts` with rich section definitions
  - Extend existing `sectionTypeLabels` and `sectionCategories` from `section-picker-dialog.tsx`
  - Add: description, icon component, preview thumbnail (static JSX), default content template
  - Group by category with display order
  - Example entry:
    ```ts
    { type: 'HERO_BANNER', label: 'Hero Banner', description: 'Large banner with heading, overlay text, and CTA buttons', icon: Layout, category: 'Heroes', defaultContent: { heading: 'Welcome', subheading: '', backgroundImage: '', buttons: [] } }
    ```

- [ ] **3.3** Implement search filtering
  - Filter across section label and description
  - Real-time filtering as user types
  - Show "No results" state

- [ ] **3.4** Implement section preview on hover/select
  - Right panel shows a mini preview of the section type
  - Can be a static mockup (colored blocks mimicking section layout)
  - "Click to add [Section Name]" label below preview
  - Reference previews: Figma prototype `SectionPickerModal.tsx` `SECTION_OPTIONS` array

- [ ] **3.5** Wire "add section" flow
  - User clicks section type in picker
  - Close modal
  - Call `POST /api/v1/pages/{slug}/sections` with:
    - `sectionType`: selected type
    - `sortOrder`: position (after selected section or at end)
    - `content`: default content from catalog
  - Add new section to canvas at correct position
  - Auto-select the new section

### Phase 4: Pages & Menu Drawer (P0)

Left drawer showing page tree and navigation structure.

**Tasks:**

- [ ] **4.1** Create `PageTree` component for page list in drawer
  - Hierarchical list using `parentId` relationships
  - Each item shows: page title, status badge (Published/Draft), type icon
  - Active page highlighted
  - Indentation for child pages
  - Click page to load it in the canvas

- [ ] **4.2** Show page status badges
  - Published: green badge
  - Draft: gray badge
  - Homepage: star icon
  - Page type: small secondary badge (Standard, Landing, Ministry, etc.)

- [ ] **4.3** Click page to switch canvas
  - Navigate to `/cms/website/builder/{pageId}`
  - Or: update state + fetch new page data without full navigation (SPA behavior)
  - Warn if unsaved changes on current page

- [ ] **4.4** Context menu on pages
  - Right-click or "..." menu on each page item
  - Options: Edit Settings, Duplicate, Delete
  - Delete shows confirmation dialog
  - Duplicate calls POST to create copy

- [ ] **4.5** Create `AddPageModal` (3-step wizard)
  - Step 1: Choose type (Blank Page vs Use Template)
  - Step 2: Template gallery (if template selected) -- sidebar list + preview
    - Template categories: "All", "Data-Driven" (CMS), "Standard"
    - Templates: Ministry Hub, Bible Study, About Us, Events, Giving, Contact
    - CMS templates show "data source required" overlay on preview
  - Step 3: Configure -- page name, slug, ministry connection (for CMS templates)
  - On create: `POST /api/v1/pages` then navigate to builder
  - Reference: `figma-cms-2:11:26/src/app/components/modules/website/AddPageModal.tsx`

- [ ] **4.6** Create `PageSettingsModal`
  - Title, slug, page type, layout, homepage toggle
  - SEO section: meta title, meta description, OG image, canonical URL, no-index
  - Connected ministry selector (for MINISTRY page type)
  - Delete page button (with confirmation)
  - Reference: `figma-cms-2:11:26/src/app/components/modules/website/PageSettingsModal.tsx`

- [ ] **4.7** Page reordering in tree
  - Drag-and-drop or up/down buttons to change `sortOrder`
  - API call to update sort orders

### Phase 5: Section Editors (P0)

Per-section-type editing forms (replacing the current raw JSON editor).

**Tasks:**

- [ ] **5.1** Create `SectionEditorModal` base component
  - Opens when user clicks Edit on a section's floating toolbar
  - Full-width modal or slide-over panel
  - Header shows section type label + data source indicator
  - Footer with Cancel + Save buttons
  - Dispatches to type-specific editor based on `sectionType`

- [ ] **5.2** Create section-type editor components organized by category
  - Each editor receives `content` JSON and emits updated content
  - Editors provide structured forms instead of raw JSON

  **Heroes (5 types):**
  - Common fields: heading, subheading, description, background image URL, overlay opacity
  - CTA buttons array: [{label, url, variant}]
  - HERO_BANNER: full-bleed background image
  - PAGE_HERO: overline label, heading, body text
  - TEXT_IMAGE_HERO: split layout, image URL + text side
  - EVENTS_HERO: heading + auto-populated event data
  - MINISTRY_HERO: ministry name, subtitle, description, banner image

  **Content (8 types):**
  - MEDIA_TEXT: heading, body text, image URL, media position (left/right), CTA
  - MEDIA_GRID: heading, grid items array [{imageUrl, caption}]
  - SPOTLIGHT_MEDIA: featured media URL, title, description
  - PHOTO_GALLERY: gallery items array [{imageUrl, alt, caption}]
  - QUOTE_BANNER: quote text, attribution, background
  - CTA_BANNER: heading, body, button label, button URL, background
  - ABOUT_DESCRIPTION: heading, body paragraphs, image
  - STATEMENT: overline, heading, body text

  **Cards (6 types):**
  - Common: heading, optional subheading, cards array [{title, description, imageUrl, linkUrl}]
  - ACTION_CARD_GRID: cards with action labels
  - HIGHLIGHT_CARDS: featured content cards
  - FEATURE_BREAKDOWN: feature items with icons
  - PATHWAY_CARD: step-based cards
  - PILLARS: value/pillar cards
  - NEWCOMER: welcome items for newcomers

  **Data-driven (8 types) -- mostly read-only, configure data source:**
  - ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS: heading, filters, pagination config
  - UPCOMING_EVENTS: heading, max items count
  - EVENT_CALENDAR: heading, view mode (month/week)
  - RECURRING_MEETINGS: heading, meeting items display
  - RECURRING_SCHEDULE: heading, schedule layout

  **Ministry (6 types):**
  - MINISTRY_INTRO: ministry selector, description override
  - MINISTRY_SCHEDULE: schedule items array
  - CAMPUS_CARD_GRID: campus cards array
  - DIRECTORY_LIST: directory configuration
  - MEET_TEAM: team members array [{name, role, imageUrl, bio}]
  - LOCATION_DETAIL: address, map embed, service times

  **Interactive (3 types):**
  - FAQ_SECTION: FAQ items array [{question, answer}]
  - FORM_SECTION: form fields array [{type, label, required, placeholder}]
  - TIMELINE_SECTION: timeline items array [{year, title, description}]

  **Layout (5 types):**
  - CUSTOM_HTML: code editor with HTML content
  - CUSTOM_EMBED: embed URL/code
  - QUICK_LINKS: link items array
  - NAVBAR: navigation config (usually auto from Menu)
  - FOOTER: footer config (usually auto from SiteSettings)

- [ ] **5.3** Section display settings panel
  - Appears as a tab or collapsible section in the editor modal
  - Fields: colorScheme (Light/Dark), paddingY (None/Compact/Default/Spacious), containerWidth (Narrow/Standard/Full), enableAnimations toggle, visible toggle
  - Reuse controls from existing `section-editor-dialog.tsx`

- [ ] **5.4** Save section updates
  - On save: `PATCH /api/v1/pages/{slug}/sections/{id}` with updated `content` + display settings
  - Optimistic update in canvas
  - Toast notification on success
  - Close modal and refresh section in canvas

### Phase 6: Design Panel (P1)

Left drawer with theme customization controls.

**Tasks:**

- [ ] **6.1** Create `DesignPanel` component in drawer
  - Typography section:
    - Font pairing selector (heading font + body font)
    - Base font size slider (14-20px)
    - Google Fonts integration (fetch available fonts)
  - Colors section:
    - Primary brand color picker with predefined swatches
    - Background tone (warm/cool/neutral)
    - Accent color
  - Spacing section:
    - Scale selector: Compact / Comfortable / Spacious
    - Corner radius slider (0-16px)
  - Live preview of changes on canvas

- [ ] **6.2** Wire to ThemeCustomization API
  - Read current theme: `GET /api/v1/theme`
  - Update theme: `PATCH /api/v1/theme`
  - Map design panel values to `ThemeCustomization` fields

- [ ] **6.3** Live preview updates
  - Changes in design panel instantly update CSS variables on canvas
  - No page reload needed
  - Save button persists to database

### Phase 7: Data Backup & Seed (P0)

Ensure LA UBF data can be backed up and restored for development and testing.

**Tasks:**

- [ ] **7.1** Create data export script
  - Export all LA UBF data from database to JSON at `prisma/backups/laubf-seed-data.json`
  - Include: pages, page sections, menus, menu items, theme, theme customization, site settings
  - Include: messages, events, bible studies, speakers, series, ministries, campuses
  - Preserve UUIDs and relationships

- [ ] **7.2** Create data restore script
  - Read from `prisma/backups/laubf-seed-data.json`
  - Upsert all records (idempotent)
  - Handle foreign key ordering (create parents before children)
  - Can be run as `npx tsx prisma/restore.ts`

- [ ] **7.3** Update `prisma/seed.mts`
  - Add export option: `npx prisma db seed -- --export` writes current data to backup
  - Add restore option: `npx prisma db seed -- --restore` loads from backup
  - Keep existing seed logic as default behavior

### Phase 8: CMS Admin Integration (P1)

Connect the builder to existing CMS navigation and replace old editor.

**Tasks:**

- [ ] **8.1** Update CMS sidebar navigation
  - Website > Pages: links to pages list (existing)
  - Website > Pages: row click opens builder instead of old editor
  - Add "Edit in Builder" quick action in sidebar

- [ ] **8.2** Update pages list to open builder
  - `app/cms/(dashboard)/website/pages/page.tsx`: change `onRowClick` to navigate to builder
  - Update dropdown menu "Edit" link to builder URL
  - Add "Open in Builder" button in page list toolbar

- [ ] **8.3** Deprecate old page editor
  - Add banner to `app/cms/(dashboard)/website/pages/[slug]/page.tsx`:
    "This editor has been replaced. Open in Builder >>"
  - Keep the route functional for backward compatibility
  - Remove from navigation

- [ ] **8.4** Prevent feature duplication
  - Navigation page (`/cms/website/navigation`): keep as standalone, add "Open in Builder" link
  - Theme page (`/cms/website/theme`): keep as standalone, add "Open in Builder" link
  - Settings page (`/cms/website/settings`): keep as standalone
  - Domains page (`/cms/website/domains`): keep as standalone

- [ ] **8.5** Add cross-links between builder and standalone pages
  - Builder design panel: "Advanced Theme Settings >>" link to theme page
  - Builder pages drawer: "Edit Navigation >>" link to navigation page

### Phase 9: Polish & Edge Cases (P1)

Refinements and quality-of-life improvements.

**Tasks:**

- [ ] **9.1** Unsaved changes warning
  - Track dirty state (any changes since last save)
  - `beforeunload` event listener to warn on browser close/navigate
  - Warn when switching pages in builder with unsaved changes
  - Show dot/indicator on Save button when dirty

- [ ] **9.2** Toast notifications
  - Success: "Section added", "Page saved", "Section deleted"
  - Error: "Failed to save", "Network error"
  - Use shadcn/ui `sonner` toast component (if installed) or `toast` from `@/components/ui/sonner`

- [ ] **9.3** Loading states and error handling
  - Skeleton loading for canvas while page data loads
  - Skeleton loading for drawer content
  - Error boundary around canvas
  - Retry button on API failures
  - Disabled Save button during save operation (with loading spinner)

- [ ] **9.4** Keyboard shortcuts
  - `Escape`: deselect section / close drawer / close modal
  - `Delete` / `Backspace`: delete selected section (with confirmation)
  - `Cmd/Ctrl+S`: save page
  - `Cmd/Ctrl+Z`: undo (Phase 9.6)

- [ ] **9.5** Section visibility toggle in canvas
  - Hidden sections shown with reduced opacity + "Hidden" badge in canvas
  - Toggle visibility from floating toolbar (eye/eye-off icon)
  - Hidden sections excluded from published view but visible in builder

- [ ] **9.6** Undo/redo (P2)
  - Track action history (section add, delete, reorder, edit)
  - Undo/redo buttons in top bar
  - Keyboard shortcuts: Cmd+Z / Cmd+Shift+Z

---

## File Structure (New Files)

```
app/cms/website/builder/
  layout.tsx                    -- Full-screen builder layout (no CMS sidebar)
  page.tsx                      -- Entry: redirect to homepage builder
  [pageId]/
    page.tsx                    -- Builder for specific page (server component, data loading)

components/cms/website/builder/
  builder-shell.tsx             -- Client orchestrator component
  builder-sidebar.tsx           -- Left 60px icon toolbar
  builder-drawer.tsx            -- Animated left drawer (320px)
  builder-canvas.tsx            -- Central preview canvas
  builder-topbar.tsx            -- Top bar (title, device toggle, save/publish, back)
  sortable-section.tsx          -- Section wrapper with selection/hover/drag/floating toolbar
  section-add-trigger.tsx       -- Plus buttons between sections
  section-picker-modal.tsx      -- Modal for adding sections (search + category + preview)
  section-editor-modal.tsx      -- Modal for editing section content (type-specific forms)
  page-settings-modal.tsx       -- Modal for page title/slug/SEO settings
  add-page-modal.tsx            -- 3-step wizard for new pages
  page-tree.tsx                 -- Hierarchical page list for drawer
  design-panel.tsx              -- Theme/design controls for drawer
  device-preview.tsx            -- Desktop/tablet/mobile toggle
  section-catalog.ts            -- Section type definitions, categories, descriptions, defaults
  use-builder-state.ts          -- Custom hook for builder state management
  types.ts                      -- Shared TypeScript types for builder

prisma/backups/
  laubf-seed-data.json          -- LA UBF data backup
prisma/restore.ts               -- Restore script
```

## Key Design Decisions

1. **Reuse existing section components.** The canvas renders actual `SectionRenderer` from `components/website/sections/registry.tsx`, wrapped in builder-specific chrome (selection borders, floating toolbars). This ensures WYSIWYG fidelity.

2. **Outside `(dashboard)` route group.** The builder route at `app/cms/website/builder/` deliberately lives outside `app/cms/(dashboard)/` so it does NOT inherit the `CmsShell` sidebar layout. It still inherits `CmsThemeProvider` from `app/cms/layout.tsx`.

3. **API-first, no new endpoints (initially).** All changes go through existing `/api/v1/pages/*` routes. These already support all needed CRUD operations. New endpoints only if required for builder-specific features (e.g., page duplication, template instantiation).

4. **No new database models.** Everything fits in existing `Page`, `PageSection`, `Menu`, `Theme`, `ThemeCustomization`, `SiteSettings` models. Builder state is purely client-side.

5. **Progressive enhancement.** Start with Phases 1-3 (layout + canvas + section picker) for a minimal functional builder. Add section editors (Phase 5) and design panel (Phase 6) incrementally. Each phase is independently deployable.

6. **Page ID-based routing for builder.** The builder uses `/cms/website/builder/[pageId]` (UUID) rather than slug, because slugs can change. The existing API routes use slugs, so the builder will need to resolve pageId to slug for API calls (or we add ID-based API endpoints).

7. **Section editing in modals.** Per the Figma prototype, section editing happens in modal/overlay forms, not inline. This keeps the canvas clean and allows complex editors (arrays of items, image pickers, etc.) without cluttering the preview.

8. **Figma prototype as UX reference only.** We follow the Figma prototype's UX patterns (layout, flows, interactions) but implement using shadcn/ui components and the project's design system. No visual styling is copied from the prototype.

## Dependencies

| Package | Purpose | Status |
|---|---|---|
| `@dnd-kit/core` | Drag and drop framework | INSTALLED (^6.3.1) |
| `@dnd-kit/sortable` | Sortable list utilities | INSTALLED |
| `@dnd-kit/utilities` | CSS transform helpers | INSTALLED |
| `motion` | Animations (SectionAddTrigger) | INSTALLED (^12.34.3) |
| shadcn/ui Dialog | Section picker, editors, page settings | INSTALLED |
| shadcn/ui Sheet | Drawer alternative | INSTALLED |
| shadcn/ui Tooltip | Sidebar tool tooltips | INSTALLED |
| shadcn/ui Tabs | Editor panel tabs | INSTALLED |
| shadcn/ui ScrollArea | Scrollable panels | INSTALLED |
| shadcn/ui RadioGroup | AddPageModal selections | INSTALLED |
| `sonner` | Toast notifications | INSTALLED (^2.0.7) |

## Figma Prototype File Index

Key files in `figma-cms-2:11:26/src/app/components/modules/website/` to reference during implementation:

| File | Purpose | Key Patterns |
|---|---|---|
| `pages/Builder.tsx` | Full builder implementation | DnD setup, canvas rendering, page tree, section editor dispatch, state management |
| `pages/BuilderSidebar.tsx` | Sidebar + drawer | 4-tool layout, active state, drawer wrapper |
| `SortableSectionWrapper.tsx` | Section chrome | Selection borders, floating toolbar, add triggers, drag handle |
| `SectionPickerModal.tsx` | Section picker | Search, sidebar list, hover preview, popover positioning |
| `SectionAddTrigger.tsx` | Plus button | Motion animation, expand on hover |
| `AddPageModal.tsx` | New page wizard | 3-step flow, template gallery, CMS data connection |
| `PageSettingsModal.tsx` | Page settings | Title, slug, ministry connection |
| `pages/SectionEditor.tsx` | Section editors | Per-type forms (team, stories, FAQ, meetings, hero, about) |
| `pages/WebsiteNavbar.tsx` | Page type/nav bar | Page tree data structure, navigation types |
| `pages/templates/*.tsx` | Page templates | Template section compositions |

---

## Status Tracking

Update this section as work progresses. Mark tasks with:
- `[ ]` Not started
- `[x]` Complete
- `[~]` In progress
- `[!]` Blocked

### Phase Status Summary

| Phase | Status | Completed | Total | Notes |
|---|---|---|---|---|
| Phase 1: Layout & Navigation Shell | In progress | 0 | 8 | Tasks 1.1 and 1.2 partially done (files exist) |
| Phase 2: Canvas & Section Rendering | Not started | 0 | 7 | @dnd-kit installed |
| Phase 3: Section Picker Modal | Not started | 0 | 5 | Can reuse section-picker-dialog.tsx categories |
| Phase 4: Pages & Menu Drawer | Not started | 0 | 7 | |
| Phase 5: Section Editors | Not started | 0 | 4 | Can reuse section-editor-dialog.tsx |
| Phase 6: Design Panel | Not started | 0 | 3 | |
| Phase 7: Data Backup & Seed | Not started | 0 | 3 | Independent of other phases |
| Phase 8: CMS Admin Integration | Not started | 0 | 5 | |
| Phase 9: Polish & Edge Cases | Not started | 0 | 6 | |
| **Total** | | **0** | **48** | |

**Detailed task tracker**: See `docs/00_dev-notes/website-builder-status.md`

---

## Builder Architecture

### Component Hierarchy

```
app/cms/website/builder/layout.tsx (Server Component)
  └── Auth check (redirect to /cms/login if no session)
  └── Full-screen container (h-screen, w-screen, overflow-hidden)
  └── Toaster (sonner, bottom-right)
  └── [children]

app/cms/website/builder/page.tsx (Server Component)
  └── Fetch pages via DAL
  └── Redirect to /cms/website/builder/[pageId] (homepage first, then first by sortOrder)
  └── Empty state if no pages

app/cms/website/builder/[pageId]/page.tsx (Server Component)
  └── Load page + sections by ID via DAL
  └── Load all pages list (for page tree)
  └── Load theme data (for canvas rendering)
  └── Pass initial data to BuilderShell

components/cms/website/builder/
  builder-shell.tsx (Client Component — root orchestrator)
  ├── builder-topbar.tsx
  │   ├── Back button → /cms/website/pages
  │   ├── Page title (editable/dropdown)
  │   ├── device-preview.tsx (Desktop | Tablet | Mobile toggle)
  │   └── Save / Publish buttons
  │
  ├── builder-sidebar.tsx (60px left toolbar)
  │   ├── Add Section button (Plus icon)
  │   ├── Pages & Menu button (FileText icon)
  │   ├── Design button (Palette icon)
  │   └── Media button (Image icon)
  │
  ├── builder-drawer.tsx (320px animated panel)
  │   ├── [tool=pages] → page-tree.tsx
  │   ├── [tool=design] → design-panel.tsx
  │   └── [tool=media] → media browser (future)
  │
  └── builder-canvas.tsx (central preview area)
      └── DndContext + SortableContext (@dnd-kit)
          └── For each section:
              └── sortable-section.tsx
                  ├── SectionRenderer (from registry.tsx — actual component)
                  ├── Selection chrome (hover/selected borders)
                  ├── Floating toolbar (drag, edit, delete)
                  └── section-add-trigger.tsx (plus buttons)
      └── [modals, opened on demand]:
          ├── section-picker-modal.tsx (add section)
          ├── section-editor-modal.tsx (edit section content)
          ├── page-settings-modal.tsx (edit page metadata)
          └── add-page-modal.tsx (create new page)
```

### State Management Flow

The builder uses React state in `BuilderShell` (no external state library). State flows down via props and context.

```
BuilderShell state:
  ├── activePage: Page            — Current page being edited
  ├── sections: PageSection[]     — Ordered sections on current page
  ├── allPages: Page[]            — All pages (for page tree)
  ├── selectedSectionId: string?  — Currently selected section
  ├── activeTool: string?         — Active sidebar tool (pages/design/media/null)
  ├── deviceMode: string          — desktop/tablet/mobile
  ├── isDirty: boolean            — Unsaved changes exist
  ├── isSaving: boolean           — Save in progress
  └── theme: ThemeCustomization   — Current theme (for design panel)

State mutations:
  ├── selectSection(id)           — Click on section in canvas
  ├── deselectSection()           — Click canvas bg or press Escape
  ├── setActiveTool(tool)         — Click sidebar icon (toggles drawer)
  ├── setDeviceMode(mode)         — Click device toggle in topbar
  ├── addSection(type, position)  — From section picker modal
  ├── updateSection(id, data)     — From section editor modal
  ├── deleteSection(id)           — From floating toolbar
  ├── reorderSections(newOrder)   — From drag-and-drop
  ├── switchPage(pageId)          — From page tree
  ├── savePage()                  — From topbar Save button or Cmd+S
  └── publishPage()               — From topbar Publish button
```

### API Integration Points

All builder operations use existing API routes. No new endpoints needed for core functionality.

```
READ (page load):
  GET /api/v1/pages                    → All pages (for page tree)
  GET /api/v1/pages/[slug]             → Page + sections (for canvas)
  GET /api/v1/theme                    → Theme customization (for design panel)
  GET /api/v1/menus                    → Menus (for navigation in drawer)

WRITE (user actions):
  PATCH /api/v1/pages/[slug]           → Save page metadata
  POST /api/v1/pages/[slug]/sections   → Add section
  PATCH /api/v1/pages/[slug]/sections/[id] → Update section content/settings
  DELETE /api/v1/pages/[slug]/sections/[id] → Remove section
  PUT /api/v1/pages/[slug]/sections    → Reorder sections (bulk sortOrder)
  POST /api/v1/pages                   → Create new page
  DELETE /api/v1/pages/[slug]          → Delete page
  PATCH /api/v1/theme                  → Update theme customization

NOTE: Builder routes use [pageId] (UUID) but API uses [slug].
Resolution: BuilderShell stores the page slug alongside the ID and uses
slug for all API calls. Alternatively, add ID-based API endpoints later.
```

### Data Flow: DB to Canvas to Section Components

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. SERVER COMPONENT (app/cms/website/builder/[pageId]/page.tsx)     │
│    ├── DAL: getPageById(churchId, pageId) → page + sections        │
│    ├── DAL: getPages(churchId) → all pages (for tree)              │
│    └── DAL: getThemeWithCustomization(churchId) → theme             │
│    Pass all data as props to BuilderShell                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ initialPage, initialSections, allPages, theme
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. BUILDER SHELL (client component)                                 │
│    ├── Hydrates state from server-provided initial data             │
│    ├── Manages all builder state (sections, selection, tool, etc.)  │
│    └── Provides state + handlers to child components via props      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ sections[], selectedSectionId, handlers
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. BUILDER CANVAS                                                   │
│    ├── DndContext wraps all sections for drag-and-drop              │
│    ├── Maps sections array to SortableSection components            │
│    └── Device mode sets canvas container max-width                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ For each section:
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. SORTABLE SECTION (per section)                                   │
│    ├── useSortable() hook from @dnd-kit (drag handle, transforms)  │
│    ├── Selection chrome (borders, shadows)                          │
│    ├── Floating toolbar (edit, delete, drag)                        │
│    ├── SectionAddTrigger (plus buttons above/below)                 │
│    └── Renders the ACTUAL section component:                        │
│        └── SectionRenderer(type, content, colorScheme, ...)         │
│            └── Registry lookup → e.g., HeroBannerSection            │
│                └── Renders with real content from PageSection.content│
└─────────────────────────────────────────────────────────────────────┘

EDIT FLOW:
  User clicks Edit on floating toolbar
    → SectionEditorModal opens with section.content
    → User modifies fields in type-specific form
    → User clicks Save
    → PATCH /api/v1/pages/{slug}/sections/{id}
    → Optimistic update: sections state updated immediately
    → Canvas re-renders with new content
    → Toast: "Section saved"

ADD FLOW:
  User clicks SectionAddTrigger (+ button)
    → SectionPickerModal opens
    → User selects section type (e.g., FAQ_SECTION)
    → POST /api/v1/pages/{slug}/sections with default content
    → New section added to sections state at correct position
    → Canvas re-renders, new section auto-selected
    → Toast: "Section added"

REORDER FLOW:
  User drags section via drag handle
    → DragOverlay shows semi-transparent section
    → On drop: sections array reordered optimistically
    → PUT /api/v1/pages/{slug}/sections with new sortOrder values
    → Toast: "Sections reordered"
```

### Server vs. Client Component Boundary

The builder has a clear boundary between server and client components:

| Layer | Type | Why |
|---|---|---|
| `builder/layout.tsx` | Server | Auth check, no client interactivity needed |
| `builder/page.tsx` | Server | Redirect logic only |
| `builder/[pageId]/page.tsx` | Server | Data fetching via DAL |
| `builder-shell.tsx` | Client | All interactive state (selection, drag, modals) |
| `builder-topbar.tsx` | Client | Button clicks, device toggle |
| `builder-sidebar.tsx` | Client | Tool selection, drawer toggle |
| `builder-drawer.tsx` | Client | Animated panel, tool-specific content |
| `builder-canvas.tsx` | Client | DnD context, scroll, section interaction |
| `sortable-section.tsx` | Client | Hover/select/drag events |
| Section components (registry) | Server* | Actual section rendering |

*Section components in the registry are React Server Components. Rendering them inside the client-side canvas requires one of:
1. **Pre-rendering on the server** and passing HTML (complex, deferred).
2. **Converting to client components** for the builder canvas context (simpler, used in v1).
3. **Using an iframe** that loads the public website route (highest fidelity, more complex).

The recommended approach for MVP is option 2: render section components as client components within the builder canvas, accepting that dynamic sections (ALL_MESSAGES, ALL_EVENTS) will need mock/cached data in the builder preview rather than live database queries.
