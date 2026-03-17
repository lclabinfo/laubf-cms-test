# Website Builder Documentation

> **Last updated**: March 17, 2026

All documentation for the website builder lives in this directory. The builder is a full-screen Shopify-style editor at `app/cms/website/builder/` with a live canvas + right-panel drawer editing.

---

## Document Index

| Document | Purpose | Status |
|---|---|---|
| **[builder-roadmap.md](builder-roadmap.md)** | Forward-looking plan: what to build next, weekly targets, phases | **Active** — updated March 17. Start here. |
| **[section-editor-spec.md](section-editor-spec.md)** | Field-by-field gap analysis: what each editor exposes vs. what it should expose | **Active** — 28/41 complete, 13 need changes. David reviews before implementing. |
| **[builder-review.md](builder-review.md)** | Product design critique: editing approach decision (drawer-first), section audit, effort estimates | **Reference** — core decisions still valid. Editing approach is settled. |
| **[builder-plan.md](builder-plan.md)** | Original implementation architecture: component hierarchy, state management, API integration, 9-phase task breakdown | **Reference** — architecture is accurate. Phase status is outdated (builder is ~85% built, not 0/48). Use roadmap for current status. |
| **[section-catalog-reference.md](section-catalog-reference.md)** | Raw field inventory: every content field for all 41 section types, default values, editor file mappings | **Reference** — field definitions are accurate. For gap analysis, use section-editor-spec.md instead. |
| **[section-db-audit.md](section-db-audit.md)** | Database connectivity audit: how each section gets its data (DAL functions, data sources, static JSONB) | **Reference** — data flow architecture is still accurate. |
| **[builder-rendering.md](builder-rendering.md)** | Rendering pipeline: how builder canvas renders sections vs. live website, known gaps (responsive preview), z-index architecture | **Reference** — accurate and detailed. |
| **[undo-redo-and-save-architecture.md](undo-redo-and-save-architecture.md)** | Undo/redo + save system: in-memory React state, 50-snapshot cap, auto-save at 30s, no Redis needed | **Reference** — accurate and implemented. |
| **[admin-implementation.md](admin-implementation.md)** | Historical tracker for v1 CMS admin pages (pages manager, theme, navigation, domains, settings) — all marked COMPLETE | **Historical** — all v1 work is done. Kept for reference on what API routes/DAL functions exist. |
| **[builder-ux-issues.md](builder-ux-issues.md)** | 8 specific UX issues (drag preview, selection border, picker positioning, scrollable sidebar, etc.) | **Active** — these bugs need fixing. |

## Related Documents (Not in This Directory)

| Document | Location | Why It's Separate |
|---|---|---|
| Website Builder PRD | `docs/01_prd/02-prd-website-builder.md` | PRD — lives with other PRDs |
| Section Component Guide | `docs/03_website-rendering/09-section-component-guide.md` | About rendering/migration, not builder-specific |
| Primary User Profile | `docs/01_prd/00-primary-user-profile.md` | User persona — referenced by builder docs |
| Messages Editor Refactor | `docs/00_dev-notes/messages-editor-refactor.md` | CMS messages editor, not website builder |
