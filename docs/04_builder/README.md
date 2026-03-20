# Website Builder Documentation

> **Last updated**: March 19, 2026

All documentation for the website builder lives in this directory. The builder is a full-screen Shopify-style editor at `app/cms/website/builder/` with a live canvas + right-panel drawer editing.

---

## Start Here

| Document | Purpose |
|---|---|
| **[builder-roadmap.md](builder-roadmap.md)** | What to build next. Weekly targets, phases. Start here. |
| **[dev-guide-day1.md](dev-guide-day1.md)** | Day 1 working reference — key files, task details, patterns, DOs/DON'Ts. Load as Claude Code context. |

---

## Section Catalog (`section-catalog/`)

The section type system — what exists, what's editable, and where it's headed.

| Document | Purpose |
|---|---|
| [section-catalog-reference.md](section-catalog/section-catalog-reference.md) | Raw field inventory for all 41 section types — every field, type, default value, editor mapping. |
| [section-editor-gap-analysis.md](section-catalog/section-editor-gap-analysis.md) | Field-by-field gap analysis: what each editor exposes vs. what it should. |
| [section-design-recommendation.md](section-catalog/section-design-recommendation.md) | Product recommendation: consolidate 41 → 24 types with variants (Shopify-style). |

## Architecture (`architecture/`)

System design, data flow, and technical architecture documentation.

| Document | Purpose |
|---|---|
| [builder-system-architecture.md](architecture/builder-system-architecture.md) | Full system analysis — data flow, state management, section lifecycle, pain points, optimization recs. |
| [builder-rendering.md](architecture/builder-rendering.md) | Builder canvas vs. live website rendering pipeline, known gaps, z-index scheme. |
| [undo-redo-and-save-architecture.md](architecture/undo-redo-and-save-architecture.md) | Undo/redo + save system design. In-memory React state, 50-snapshot cap, auto-save 30s. |
| [concurrent-editing-strategy.md](architecture/concurrent-editing-strategy.md) | How the builder handles multiple users editing simultaneously. Presence + dirty tracking + background sync + last-write-wins. All 3 layers implemented March 19. |
| [dirty-tracking.md](architecture/dirty-tracking.md) | Granular dirty tracking system — which flags exist, what sets/clears them, interaction with background sync. |
| [section-db-audit.md](architecture/section-db-audit.md) | DB connectivity per section — DAL functions, data sources. |
| [README.md](architecture/README.md) | Quick overview of how the builder works — architecture diagram, key files, "when to use each doc." |

## Mental Model (`mental-model/`)

Product design decisions and strategy.

| Document | Purpose |
|---|---|
| [builder-review.md](mental-model/builder-review.md) | Product design critique — editing approach decision (drawer-first), Shopify comparison, section audit. |

## Worklog (`worklog/`)

Investigation notes and bug analysis.

| Document | Purpose |
|---|---|
| [builder-responsive-rendering-bug.md](worklog/builder-responsive-rendering-bug.md) | Canvas responsive rendering bug analysis — viewport media queries vs container width. Iframe migration plan. |

## Backlogs (`backlogs/`)

| Document | Purpose |
|---|---|
| [builder-ux-issues.md](backlogs/builder-ux-issues.md) | UX bugs to fix (drag preview, selection border, picker positioning, etc.) |

## Archive (`old-system/`)

| Document | Purpose |
|---|---|
| [builder-plan.md](old-system/builder-plan.md) | Original 9-phase implementation plan. Architecture still useful, task status outdated. |
| [editor-component-system-plan.md](old-system/editor-component-system-plan.md) | Early editor component system design. Superseded by current implementation. |

---

## Related (Outside This Directory)

| Document | Location |
|---|---|
| Website Builder PRD | `docs/01_prd/02-prd-website-builder.md` |
| Section Component Guide | `docs/03_website-rendering/09-section-component-guide.md` |
| Primary User Profile | `docs/01_prd/00-primary-user-profile.md` |
