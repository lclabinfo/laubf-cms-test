# Website Builder — Implementation Status

> **Last updated**: February 24, 2026
> **Master plan**: `docs/00_dev-notes/website-builder-plan.md`
> **PRD**: `docs/01_prd/02-prd-website-builder.md`

---

## Overview

The full-screen website builder replaces the v1 list-based page editor at `/cms/website/pages/[slug]`. It lives at `app/cms/website/builder/` outside the `(dashboard)` route group so it does not inherit the CMS sidebar layout.

**Total tasks**: 48 across 9 phases
**Completed**: 0 (2 partially started)
**Dependencies installed**: @dnd-kit/core ^6.3.1, motion ^12.34.3, sonner ^2.0.7

---

## Phase Summary

| Phase | Name | Priority | Status | Tasks Done | Total | Agent |
|---|---|---|---|---|---|---|
| 1 | Layout & Navigation Shell | P0 | In Progress | 0 | 8 | -- |
| 2 | Canvas & Section Rendering | P0 | Not Started | 0 | 7 | -- |
| 3 | Section Picker Modal | P0 | Not Started | 0 | 5 | -- |
| 4 | Pages & Menu Drawer | P0 | Not Started | 0 | 7 | -- |
| 5 | Section Editors | P0 | Not Started | 0 | 4 | -- |
| 6 | Design Panel | P1 | Not Started | 0 | 3 | -- |
| 7 | Data Backup & Seed | P0 | Not Started | 0 | 3 | -- |
| 8 | CMS Admin Integration | P1 | Not Started | 0 | 5 | -- |
| 9 | Polish & Edge Cases | P1 | Not Started | 0 | 6 | -- |
| | **TOTAL** | | | **0** | **48** | |

---

## Phase 1: Layout & Navigation Shell (P0)

| Task | Description | Status | Notes |
|---|---|---|---|
| 1.1 | Builder layout (`app/cms/website/builder/layout.tsx`) | Partial | File exists. Full-screen 100vh, auth check via `auth()`, Toaster. No CMS sidebar. |
| 1.2 | Builder entry page (`app/cms/website/builder/page.tsx`) | Partial | File exists. Fetches pages, redirects to homepage or first page by sortOrder. Empty state for no pages. |
| 1.3 | Builder [pageId] page (`app/cms/website/builder/[pageId]/page.tsx`) | Not Started | Server component to load page data by ID, render BuilderShell. |
| 1.4 | BuilderSidebar (60px left toolbar) | Not Started | 4 icon buttons: Plus, Pages, Design, Media. Toggle drawer open/close. |
| 1.5 | BuilderDrawer (320px animated panel) | Not Started | Slides in from left. Header + close button. Renders tool-specific content. |
| 1.6 | BuilderTopbar (56px top bar) | Not Started | Back button, page title, device toggle, save/publish buttons. |
| 1.7 | BuilderShell (client orchestrator) | Not Started | Manages activeTool, selectedSectionId, deviceMode, sections, isDirty state. |
| 1.8 | Wire routing from pages list to builder | Not Started | Update page row click and edit dropdown to navigate to builder URL. |

**Blockers**: None. Can proceed immediately.

---

## Phase 2: Canvas & Section Rendering (P0)

| Task | Description | Status | Notes |
|---|---|---|---|
| 2.1 | BuilderCanvas component | Not Started | Central scrollable area. Uses SectionRenderer from registry.tsx. Device-responsive width. |
| 2.2 | SortableSection wrapper | Not Started | Hover/selected states, floating toolbar (drag, edit, delete), plus buttons. |
| 2.3 | Section selection behavior | Not Started | Click to select, canvas click to deselect, Escape to deselect. |
| 2.4 | SectionAddTrigger | Not Started | Circular blue plus button, expands on hover. Opens SectionPickerModal. |
| 2.5 | Install/configure @dnd-kit | Not Started | Already installed (^6.3.1). Wrap canvas in DndContext + SortableContext. |
| 2.6 | Drag-and-drop section reordering | Not Started | DragOverlay, optimistic reorder, PUT to API. |
| 2.7 | Device preview modes | Not Started | Desktop/Tablet/Mobile toggle in topbar. Canvas width transitions. |

**Blockers**: Depends on Phase 1 (BuilderShell provides state context).

---

## Phase 3: Section Picker Modal (P0)

| Task | Description | Status | Notes |
|---|---|---|---|
| 3.1 | SectionPickerModal component | Not Started | Two-panel: sidebar list + preview area. Header with search. |
| 3.2 | section-catalog.ts | Not Started | Rich section definitions extending existing sectionTypeLabels/sectionCategories. |
| 3.3 | Search filtering | Not Started | Filter by label and description. Real-time. |
| 3.4 | Section preview on hover/select | Not Started | Right panel shows mini preview of section type. |
| 3.5 | Wire "add section" flow | Not Started | POST to API, add to canvas, auto-select new section. |

**Blockers**: Depends on Phase 2 (canvas must exist to receive new sections).
**Notes**: Can reuse category definitions from existing `section-picker-dialog.tsx`.

---

## Phase 4: Pages & Menu Drawer (P0)

| Task | Description | Status | Notes |
|---|---|---|---|
| 4.1 | PageTree component | Not Started | Hierarchical list using parentId. Status badges. Active page highlight. |
| 4.2 | Page status badges | Not Started | Published (green), Draft (gray), Homepage (star), Type (secondary badge). |
| 4.3 | Click page to switch canvas | Not Started | Navigate to `/cms/website/builder/{pageId}` or SPA state update. Warn on unsaved. |
| 4.4 | Context menu on pages | Not Started | Right-click/three-dot: Edit Settings, Duplicate, Delete. |
| 4.5 | AddPageModal (3-step wizard) | Not Started | Step 1: type. Step 2: template gallery. Step 3: configure (name, slug, ministry). |
| 4.6 | PageSettingsModal | Not Started | Title, slug, type, layout, homepage, SEO, connected ministry, delete. |
| 4.7 | Page reordering in tree | Not Started | Drag-and-drop or up/down buttons for sortOrder. |

**Blockers**: Depends on Phase 1 (drawer infrastructure).

---

## Phase 5: Section Editors (P0)

| Task | Description | Status | Notes |
|---|---|---|---|
| 5.1 | SectionEditorModal base component | Not Started | Opens from floating toolbar Edit button. Dispatches to type-specific editor. |
| 5.2 | Type-specific editor components | Not Started | 42 section types across 7 categories. Start with top 10 most-used. |
| 5.3 | Section display settings panel | Not Started | Tab/collapsible: colorScheme, paddingY, containerWidth, enableAnimations, visible. |
| 5.4 | Save section updates | Not Started | PATCH to API, optimistic canvas update, toast notification. |

**Blockers**: Depends on Phase 2 (section selection + floating toolbar).
**Notes**: v1 section-editor-dialog.tsx has display settings + JSON editor that can be reused/extended. Priority order for type-specific editors: HERO_BANNER, MEDIA_TEXT, CTA_BANNER, FAQ_SECTION, MEET_TEAM, HIGHLIGHT_CARDS, SPOTLIGHT_MEDIA, ALL_MESSAGES, ALL_EVENTS, PAGE_HERO.

---

## Phase 6: Design Panel (P1)

| Task | Description | Status | Notes |
|---|---|---|---|
| 6.1 | DesignPanel component | Not Started | Typography, colors, spacing controls in drawer. |
| 6.2 | Wire to ThemeCustomization API | Not Started | GET/PATCH `/api/v1/theme`. Map panel values to ThemeCustomization fields. |
| 6.3 | Live preview updates | Not Started | Changes instantly update CSS variables on canvas. |

**Blockers**: Depends on Phase 1 (drawer infrastructure).
**Notes**: v1 theme customizer at `/cms/website/theme` already implements color pickers, font selector, custom CSS. Design panel is a lighter in-builder version.

---

## Phase 7: Data Backup & Seed (P0)

| Task | Description | Status | Notes |
|---|---|---|---|
| 7.1 | Data export script | Not Started | Export LA UBF data to `prisma/backups/laubf-seed-data.json`. All content types. |
| 7.2 | Data restore script | Not Started | Read from backup JSON. Upsert with FK ordering. `npx tsx prisma/restore.ts`. |
| 7.3 | Update `prisma/seed.mts` | Not Started | Add `--export` and `--restore` CLI flags. |

**Blockers**: None. Can proceed independently.

---

## Phase 8: CMS Admin Integration (P1)

| Task | Description | Status | Notes |
|---|---|---|---|
| 8.1 | Update CMS sidebar navigation | Not Started | Row click on pages opens builder instead of old editor. |
| 8.2 | Update pages list to open builder | Not Started | Change onRowClick and dropdown Edit link to builder URL. |
| 8.3 | Deprecate old page editor | Not Started | Add banner to old editor: "Open in Builder >>". Keep functional as fallback. |
| 8.4 | Prevent feature duplication | Not Started | Keep standalone nav/theme/settings pages. Add "Open in Builder" cross-links. |
| 8.5 | Cross-links between builder and standalone pages | Not Started | Builder design panel -> theme page. Builder pages drawer -> navigation page. |

**Blockers**: Depends on Phases 1-5 (builder must be functional before integration).

---

## Phase 9: Polish & Edge Cases (P1)

| Task | Description | Status | Notes |
|---|---|---|---|
| 9.1 | Unsaved changes warning | Not Started | Track dirty state, beforeunload, warn on page switch. |
| 9.2 | Toast notifications | Not Started | Success/error toasts. sonner is installed (^2.0.7). |
| 9.3 | Loading states and error handling | Not Started | Skeleton loading, error boundaries, retry buttons, disabled save during operation. |
| 9.4 | Keyboard shortcuts | Not Started | Escape, Delete, Cmd+S, Cmd+Z. |
| 9.5 | Section visibility toggle in canvas | Not Started | Hidden sections shown with reduced opacity + badge. |
| 9.6 | Undo/redo (P2) | Not Started | Action history stack. Undo/redo buttons + keyboard shortcuts. |

**Blockers**: Depends on Phases 1-5 (builder must be functional).

---

## Known Issues & Challenges

| Issue | Impact | Notes |
|---|---|---|
| Page ID vs slug API mismatch | Medium | Builder routes use `[pageId]` (UUID) but existing API uses slug-based routes. Builder must resolve pageId to slug for API calls, or add ID-based API endpoints. |
| Auth dependency | Low | Builder layout uses `auth()` from `lib/auth`. Auth is implemented but may need session data passed to builder components. |
| RSC in canvas | Medium | Section components are React Server Components. Rendering them inside a client-side interactive canvas may require wrapping in Suspense boundaries or using a hybrid approach. |
| Section editor complexity | High | 42 section types need type-specific editor forms. Phased approach: start with top 10, use JSON fallback for the rest. |
| Template protection | Low | Template-governed pages (MINISTRY, CAMPUS, SYSTEM types) need section structure enforcement in the builder. Not yet designed. |

---

## Dependency Map

```
Phase 1 (Shell)
  ├── Phase 2 (Canvas) ──── Phase 3 (Section Picker)
  │                    └─── Phase 5 (Section Editors)
  │
  ├── Phase 4 (Pages Drawer)
  │
  └── Phase 6 (Design Panel)

Phase 7 (Data Backup) ─── independent

Phase 8 (CMS Integration) ─── depends on Phases 1-5
Phase 9 (Polish) ─── depends on Phases 1-5
```

Phases 1 and 7 can run in parallel. Within Phase 1, tasks 1.1-1.7 are sequential (each builds on the previous). Phase 1.8 (routing wiring) can be done any time after Phase 1 core is working.
