# Website Builder Documentation

> **Last updated**: March 18, 2026

All documentation for the website builder lives in this directory. The builder is a full-screen Shopify-style editor at `app/cms/website/builder/` with a live canvas + right-panel drawer editing.

---

## Active Documents (Root)

| Document | Purpose |
|---|---|
| **[builder-roadmap.md](builder-roadmap.md)** | What to build next. Weekly targets, phases. Start here. |
| **[section-editor-spec.md](section-editor-spec.md)** | Field-by-field gap analysis: what each editor exposes vs. what it should. David reviews before implementing. |

## Dev Notes (`dev-notes/`)

Technical references for implementation.

| Document | Purpose |
|---|---|
| [dev-guide-day1.md](dev-notes/dev-guide-day1.md) | Day 1 working reference — key files, task details, patterns, DOs/DON'Ts. Load as Claude Code context. |
| [builder-system-architecture.md](dev-notes/builder-system-architecture.md) | Full system analysis — data flow, state management, section lifecycle, pain points, optimization recs. |
| [builder-rendering.md](dev-notes/builder-rendering.md) | Builder canvas vs. live website rendering pipeline, known gaps, z-index scheme. |
| [undo-redo-and-save-architecture.md](dev-notes/undo-redo-and-save-architecture.md) | Undo/redo + save system design. In-memory React state, 50-snapshot cap, auto-save 30s. |
| [section-catalog-reference.md](dev-notes/section-catalog-reference.md) | Raw field inventory for all 41 section types + default values. |
| [section-db-audit.md](dev-notes/section-db-audit.md) | DB connectivity per section — DAL functions, data sources. |

## Mental Model (`mental-model/`)

| Document | Purpose |
|---|---|
| [builder-review.md](mental-model/builder-review.md) | Product design critique — editing approach decision (drawer-first), Shopify comparison, section audit. |

## Backlogs (`backlogs/`)

| Document | Purpose |
|---|---|
| [builder-ux-issues.md](backlogs/builder-ux-issues.md) | 8 UX bugs to fix (drag preview, selection border, picker positioning, etc.) |

## Soon to Archive (`soon-to-archive/`)

| Document | Purpose |
|---|---|
| [builder-plan.md](soon-to-archive/builder-plan.md) | Original 9-phase implementation plan. Architecture still useful, task status outdated. |

## Related (Outside This Directory)

| Document | Location |
|---|---|
| Website Builder PRD | `docs/01_prd/02-prd-website-builder.md` |
| Section Component Guide | `docs/03_website-rendering/09-section-component-guide.md` |
| Primary User Profile | `docs/01_prd/00-primary-user-profile.md` |
