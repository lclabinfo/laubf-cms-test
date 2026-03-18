# CMS Website Components

Components for the website builder and website page management in the CMS admin.

## Directory Structure

```
components/cms/website/
  pages/                     ← Legacy page management (pre-builder)
  builder/                   ← Full-screen website builder
    builder-shell.tsx          Orchestrator — all state, handlers, layout composition
    section-catalog.ts         Section type registry (labels, icons, defaultContent)
    types.ts                   Shared TypeScript types (BuilderSection, DeviceMode, etc.)
    use-builder-history.ts     Undo/redo hook (50-snapshot cap)

    canvas/                  ← Iframe rendering pipeline
      builder-canvas.tsx       Iframe host — device sizing, postMessage bridge
      builder-preview-client.tsx  Client component INSIDE the iframe — DnD, section rendering
      builder-section-renderer.tsx  SectionType → website component map (client-safe)
      sortable-section.tsx     Selection chrome, drag handles, floating toolbar per section
      iframe-protocol.ts       Type-safe postMessage types + send/listen helpers

    layout/                  ← Builder chrome (everything around the canvas)
      builder-topbar.tsx       Top bar — save, undo/redo, device toggle, publish
      builder-sidebar.tsx      Left 60px icon toolbar
      builder-drawer.tsx       Left 320px panel wrapper (pages/design/media)
      builder-right-drawer.tsx Right 320px panel (section editor + display settings)
      builder-empty-state.tsx  No-page state / template picker for first page

    pages/                   ← Page management
      page-tree.tsx            Page list sidebar with hierarchy
      page-settings-modal.tsx  Page metadata editor (title, slug, SEO)
      add-page-modal.tsx       New page wizard with template selection

    sections/                ← Section picker + add flow
      section-picker-modal.tsx  Categorized, searchable section browser
      section-preview.tsx       Section thumbnail previews for the picker
      section-editor-modal.tsx  Editor modal wrapper (used outside the builder)
      section-add-trigger.tsx   "+" button rendered between sections
      add-section-drawer.tsx    Section add panel in the left drawer

    section-editors/         ← Editor forms (one per section category)
      index.tsx                Flat registry — maps SectionType → editor component
      display-settings.tsx     Shared display controls (color, padding, width, etc.)
      json-editor.tsx          Raw JSON fallback editor
      hero-editor.tsx          5 hero section sub-editors
      content-editor.tsx       5 content section sub-editors
      cards-editor.tsx         5 card section sub-editors
      data-section-editor.tsx  12 data-driven section sub-editors
      ministry-editor.tsx      6 ministry section sub-editors
      faq-editor.tsx           FAQ accordion editor
      timeline-editor.tsx      Timeline steps editor
      form-editor.tsx          Contact form editor
      footer-editor.tsx        Footer editor
      photo-gallery-editor.tsx Photo gallery image array editor
      schedule-editor.tsx      Recurring schedule editor
      custom-editor.tsx        Custom HTML + embed editor
      navbar-editor.tsx        Navbar settings editor
      shared/                  15 reusable editor primitives (field-primitives,
                               array-fields, media-fields, card-fields, banners)
```

## Where to Put New Files

| I'm adding... | Put it in |
|---|---|
| A new section editor | `builder/section-editors/` — add export + registry entry in `index.tsx` |
| A reusable editor component (field, array, picker) | `builder/section-editors/shared/` |
| A new section type | `builder/section-catalog.ts` (definition) + `section-editors/` (editor) + `components/website/sections/` (component) |
| Something that renders inside the iframe | `builder/canvas/` |
| Builder chrome (toolbar, panel, drawer) | `builder/layout/` |
| Page CRUD UI (modals, tree, settings) | `builder/pages/` |
| Section browsing / picking / adding UI | `builder/sections/` |
| A new postMessage type | `builder/canvas/iframe-protocol.ts` |
| A shared type used across builder folders | `builder/types.ts` |
| A new hook used by builder-shell | `builder/` (root, alongside `use-builder-history.ts`) |

## Import Conventions

- Files in subdirectories use `../types`, `../section-catalog` to reach root builder files.
- Files in subdirectories use `../section-editors` to reach the editor registry.
- `builder-shell.tsx` imports from all subdirectories (`./layout/`, `./canvas/`, `./pages/`, `./sections/`).
- External files (app routes, other CMS components) use `@/components/cms/website/builder/` with the full subpath.
- Section editors import shared primitives from `./shared/` (barrel export via `shared/index.ts`).

## Related Directories

| Directory | What it contains |
|---|---|
| `components/website/sections/` | Public website section components (what renders on the live site + in the builder iframe) |
| `components/website/layout/` | Website navbar, footer, menus, icon map |
| `components/website/shared/` | Shared website components (theme tokens, animate-on-scroll, cards, etc.) |
| `app/cms/website/builder/` | App routes for the builder (entry page, [pageId] page, preview route) |
| `docs/04_builder/` | Builder documentation (roadmap, architecture, section catalog, dev guide) |
