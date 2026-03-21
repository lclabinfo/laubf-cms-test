# Builder Architecture — Quick Overview

> Read this first. It explains how the builder system works at a high level and when to dive into each detailed doc.

---

## The Builder in 60 Seconds

The website builder is a full-screen editor at `/cms/website/builder/`. Here's how the pieces fit together:

```
                    ┌─────────────────────────────────┐
                    │     PostgreSQL (source of truth) │
                    │  Tables: Page, PageSection, Menu │
                    │  Content: JSONB per section      │
                    └──────────┬──────────┬────────────┘
                               │          ▲
                          READ │          │ WRITE
                     (Prisma)  │          │ (REST API)
                               ▼          │
┌──────────────────────────────────────────┴────────────────┐
│  Server Component                                         │
│  app/cms/website/builder/[pageId]/page.tsx                │
│                                                           │
│  Fetches: page, sections, theme, menus, site settings     │
│  Resolves: dynamic section data (events, messages, etc.)  │
│  Passes everything as props to the client shell           │
└──────────────────────┬───────────────────────────────────┘
                       │ props (serialized plain objects)
                       ▼
┌──────────────────────────────────────────────────────────┐
│  BuilderShell (client component — the brain)             │
│  components/cms/website/builder/builder-shell.tsx        │
│                                                          │
│  Owns ALL state via useState (sections, selection,       │
│  undo/redo, dirty flag, device mode, active tool)        │
│                                                          │
│  ┌─────────┐ ┌──────────┐ ┌───────┐ ┌──────────────┐   │
│  │ Topbar  │ │ Sidebar  │ │Canvas │ │ Right Drawer │   │
│  │ (save,  │ │ (4 tool  │ │(live  │ │ (section     │   │
│  │  undo,  │ │  icons)  │ │preview│ │  editor +    │   │
│  │  device)│ │          │ │+ DnD) │ │  display     │   │
│  └─────────┘ └──────────┘ └───────┘ │  settings)   │   │
│                                      └──────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**The loop**: DB → Server Component → Shell → Canvas renders sections → User edits in right drawer → Shell updates state → Canvas re-renders instantly → Save writes back to DB via API.

---

## The Three Systems You Need to Understand

### 1. Section Rendering (how sections show up on the canvas)

Each of the 41 section types has two sides:
- **Website component** (`components/website/sections/*.tsx`) — the actual React component that renders on the public site AND in the builder canvas
- **Builder renderer** (`builder-section-renderer.tsx`) — a client-safe wrapper that maps section types to components. Some sections (ALL_MESSAGES, ALL_EVENTS) are server components on the public site, so the builder uses their client counterparts instead.

The canvas wraps each section in `SortableSection` which adds selection borders, a floating toolbar (edit/delete/drag), and "+" buttons between sections.

**Deep dive**: [builder-rendering.md](builder-rendering.md) — rendering pipeline, live site vs builder comparison, responsive preview limitations, z-index scheme.

### 2. Section Editing (how sections get modified)

When you click "edit" on a section:
1. The right drawer opens with the section editor
2. `SectionContentEditor` (`section-editors/index.tsx`) routes to the correct editor by section type
3. The editor renders form fields for that section's content
4. Every field change calls `onContentChange()` which updates BuilderShell state immediately (canvas updates live)
5. Saving writes all sections to the API in parallel

There are **14 editor files** handling 41 section types. Editors are grouped by category (hero-editor handles 5 hero types, cards-editor handles 6 card types, etc.). Each editor is a switch statement that renders different fields per type.

**Deep dive**: [builder-system-architecture.md](builder-system-architecture.md) — full data flow, state inventory, editor pattern details, pain points, optimization recommendations.

### 3. Persistence (how changes are saved and undone)

Two completely separate systems:
- **Undo/redo**: In-memory React state. 50-snapshot cap. `useBuilderHistory` hook stores full clones of `{ sections, pageTitle }`. Cleared when switching pages.
- **Save**: Manual (Cmd+S / button) or auto (30s debounce). Sends N+2 API requests in parallel: 1 PATCH for page metadata + 1 PUT for section order + 1 PATCH per section for content. Then `router.refresh()` to bust cache.

**Deep dive**: [undo-redo-and-save-architecture.md](undo-redo-and-save-architecture.md) — architecture diagram, step-by-step flows, design decisions, scalability analysis.

---

## Section Data: Static vs Dynamic

Not all sections store their content the same way:

| Type | Count | Where content lives | Builder editor |
|---|---|---|---|
| **Static** | 31 | `PageSection.content` JSONB — all text, images, links | Full form editor (text inputs, image pickers, array editors) |
| **Data-driven** | 10 | CMS database (messages, events, etc.) — auto-populated | Minimal: just heading, CTA, display settings |

The 11 data sources that feed dynamic sections are defined in `lib/website/resolve-section-data.ts`.

**Deep dive**: [section-db-audit.md](section-db-audit.md) — every section's data source, DAL function, connectivity status.

---

## The 41 Section Types at a Glance

All 41 types are organized into 8 categories. Each has: a catalog entry (icon, description, default content), an editor, and a website component.

| Category | Count | Editor File | Examples |
|---|---|---|---|
| Heroes | 5 | `hero-editor.tsx` | HERO_BANNER, PAGE_HERO, MINISTRY_HERO |
| Content | 6 | `content-editor.tsx` | MEDIA_TEXT, QUOTE_BANNER, CTA_BANNER |
| Cards | 6 | `cards-editor.tsx` | ACTION_CARD_GRID, PILLARS, PATHWAY_CARD |
| Data-driven | 10+ | `data-section-editor.tsx` | ALL_MESSAGES, UPCOMING_EVENTS, HIGHLIGHT_CARDS |
| Ministry | 6 | `ministry-editor.tsx` | MINISTRY_SCHEDULE, MEET_TEAM, CAMPUS_CARD_GRID |
| Interactive | 3 | `faq-editor.tsx`, `timeline-editor.tsx`, `form-editor.tsx` | FAQ_SECTION, FORM_SECTION |
| Layout | 3 | `footer-editor.tsx`, `custom-editor.tsx` | FOOTER, CUSTOM_HTML, CUSTOM_EMBED |
| Other | 2 | `schedule-editor.tsx`, `photo-gallery-editor.tsx` | RECURRING_SCHEDULE, PHOTO_GALLERY |

**Deep dive**: [section-catalog-reference.md](../section-catalog/section-catalog-reference.md) — every field, type, default value, and editor mapping for all 41 sections.

---

## When to Use Each Document

| I want to... | Read this |
|---|---|
| Understand how the whole builder works end-to-end | This README (you're here) |
| Add a field to an existing section editor | [builder-system-architecture.md](builder-system-architecture.md) Section 4 (Editor Pattern) |
| Know what fields a specific section has | [section-catalog-reference.md](../section-catalog/section-catalog-reference.md) |
| Debug why a section looks different in builder vs live site | [builder-rendering.md](builder-rendering.md) |
| Understand how undo/redo or save works | [undo-redo-and-save-architecture.md](undo-redo-and-save-architecture.md) |
| Know where a section's data comes from (DB vs JSONB) | [section-db-audit.md](section-db-audit.md) |
| Understand the navigation editor DnD system | [navigation-editor-architecture.md](navigation-editor-architecture.md) (flat tree pattern, API endpoints, data flow) |
| See the navigation editor requirements/spec | [navigation-editor-spec.md](navigation-editor-spec.md) (item types, structural rules, data model) |
| Work on Day 1 tasks from the roadmap | [../dev-guide-day1.md](../dev-guide-day1.md) (lives one level up) |

---

## Key Files Quick Reference

| File | What it does |
|---|---|
| `builder-shell.tsx` | The brain. Owns all state, orchestrates all UI. |
| `builder-canvas.tsx` | Renders sections with DnD, device preview, theme scoping. |
| `builder-section-renderer.tsx` | Maps section types to client-safe components. |
| `section-editors/index.tsx` | Routes section types to the correct editor form. |
| `section-editors/display-settings.tsx` | Shared display controls (color, padding, width, animations, visibility). |
| `section-catalog.ts` | Defines all 41 types: labels, icons, categories, default content. |
| `use-builder-history.ts` | Generic undo/redo hook (50-snapshot cap). |
| `lib/dal/pages.ts` | All page/section CRUD operations (Prisma). |
| `lib/website/resolve-section-data.ts` | Resolves dynamic data sources for 11 section types. |
| `components/website/sections/registry.tsx` | Maps SectionType enum to React components (public site). |
| `navigation/navigation-editor.tsx` | Navigation tree editor with flat-tree DnD, CRUD, inline add. |
| `navigation/tree-utils.ts` | Pure functions: flattenTree, getProjection, removeItem, insertItem. |
| `navigation/sortable-tree-item.tsx` | Unified tree item component + DragOverlay snapshot. |
| `navigation-item-editor.tsx` | Right-drawer form for editing individual nav item properties. |
