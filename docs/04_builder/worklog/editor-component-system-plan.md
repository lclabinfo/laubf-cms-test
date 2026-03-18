# Editor Component System — Audit & Implementation Plan

> **Date:** March 18, 2026
> **Purpose:** Componentize all repeating UI patterns in section editors for maintainability, consistency, and future-proofing.
> **Input:** Full audit of 14 editor files, shared.tsx, section-design-recommendation.md

---

## 1. Is This Needed? (Sanity Check)

**Yes — critically.** Here's why:

The 14 editor files contain **150+ labeled text inputs**, **40+ labeled textareas**, **35+ two-column grids**, **15+ array item cards**, and **12+ empty states** — all implemented as inline JSX with hardcoded class names. If you want to change the label style, input border radius, or empty state icon across all editors, you'd need to edit 14 files in 200+ places.

This directly contradicts the design system principle: **one change should propagate everywhere.** Right now, editing a label style in `hero-editor.tsx` doesn't affect the identical label in `faq-editor.tsx`. They're copy-pasted, not shared.

The section-design-recommendation.md proposes consolidating 41 section types into 24 with variant toggles. That means editors will gain **layout variant selectors** and **conditional field visibility** — exactly the kind of complexity that demands a shared component library. Building variant-aware editors on top of hardcoded JSX would compound the maintenance problem.

**Bottom line:** This is the right abstraction at the right time. The shared primitives extraction (Task 0a) was step 1 — this is step 2.

---

## 2. What's Currently Shared vs Hardcoded

### Currently in `shared.tsx` (4 components)

| Component | What it does | Used in |
|-----------|-------------|---------|
| `ImagePickerField` | Image preview + MediaPickerDialog trigger | 5 editor files |
| `ButtonConfig` | CTA button editor (label + href + visible toggle) | 2 editor files |
| `CardItemEditor` | Generic card with title, description, optional image/link | 1 editor file |
| `AddCardButton` | Dashed "Add" button with Plus icon | 1 editor file |

### Everything Else Is Hardcoded (20 repeating patterns)

| Pattern | Occurrences | Files | Impact of Extraction |
|---------|------------|-------|---------------------|
| **Labeled text input** | 150+ | All 14 | Highest — eliminates most code |
| **Labeled textarea** | 40+ | 10 files | High |
| **Two-column input grid** | 35+ | 10 files | High |
| **Array item card** (border, header, trash button) | 15+ | 9 files | High |
| **Section header with count + add button** | 15+ | 10 files | Medium-High |
| **Empty state** (dashed border, icon, message) | 12+ | 8 files | Medium |
| **Toggle with label + description** | 20+ | 5 files | Medium |
| **Select with label** | 15+ | 6 files | Medium |
| **Button group / radio toggle** | 6 | 5 files | Medium |
| **Reorderable item** (move up/down buttons) | 4 | 4 files | Medium |
| **Data-driven info banner** | 2 | 2 files | Low (but important for consistency) |
| **Number input with constraints** | 3 | 2 files | Low |
| **Social links editor** | 2 | 2 files (hero, footer) | Low |
| **Address lines editor** | 1 | 1 file | Low |
| **Delete button styling** | 30+ | All files | Low (CSS extraction) |

### Key Inconsistencies Found

1. **Label styling varies:** Some use `text-xs text-muted-foreground`, others use `text-sm font-medium` for the same semantic level
2. **Move up/down uses custom inline SVG** in 4 files instead of lucide-react `ChevronUp`/`ChevronDown`
3. **Toggle patterns differ:** `display-settings.tsx` uses `RadioGroup`, other files use inline `Switch` with inconsistent wrapper styling
4. **Empty state icon/text varies per file** with no shared structure
5. **Array item cards use 3 different border/padding combinations** across files

---

## 3. Proposed Component Library

### Tier 1: Foundation Primitives (extract first — highest ROI)

These are the building blocks every editor uses. Extract them and every editor becomes 40-50% shorter.

#### `EditorField` — The Universal Field Wrapper
```typescript
interface EditorFieldProps {
  label: string
  description?: string       // small helper text below field
  labelSize?: "sm" | "xs"    // "sm" = section heading, "xs" = field label (default)
  required?: boolean
  children: React.ReactNode
}
```
Replaces 200+ instances of `<div className="space-y-1.5"><Label>...</Label>{children}</div>`.

#### `EditorInput` — Labeled Text Input
```typescript
interface EditorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  description?: string
  type?: "text" | "number" | "url"
  min?: number
  max?: number
}
```
Replaces 150+ hardcoded `<Label><Input>` pairs.

#### `EditorTextarea` — Labeled Textarea
```typescript
interface EditorTextareaProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number              // maps to min-h
}
```
Replaces 40+ hardcoded textarea patterns.

#### `EditorToggle` — Switch with Label and Optional Description
```typescript
interface EditorToggleProps {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  bordered?: boolean          // wraps in border card (used in data-section-editor)
}
```
Replaces 20+ toggle patterns with 2 visual variants.

#### `EditorSelect` — Dropdown with Label
```typescript
interface EditorSelectProps {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}
```
Replaces 15+ select/dropdown patterns.

#### `EditorButtonGroup` — Segmented Control
```typescript
interface EditorButtonGroupProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}
```
Replaces 6 inline button group implementations (text alignment, heading style, aspect ratio, day selector).

#### `TwoColumnGrid` — Paired Input Layout
```typescript
interface TwoColumnGridProps {
  children: React.ReactNode   // expects 2 children
}
```
Simple wrapper: `<div className="grid grid-cols-2 gap-3">{children}</div>`. Replaces 35+ identical grid wrappers.

---

### Tier 2: Array/List Primitives (extract second — enables future editors)

These handle the "list of items" pattern that appears in ~15 section types.

#### `ArrayField` — Full Array Editor Container
```typescript
interface ArrayFieldProps<T> {
  label: string
  items: T[]
  onChange: (items: T[]) => void
  renderItem: (item: T, index: number, onChange: (item: T) => void) => React.ReactNode
  createItem: () => T          // factory for new items
  addLabel?: string            // "Add Card", "Add Link", etc.
  emptyIcon?: React.ReactNode
  emptyMessage?: string
  reorderable?: boolean        // enables move up/down buttons
  maxItems?: number
}
```
Replaces 15+ custom array implementations. Handles:
- Empty state (dashed border, icon, message)
- Item cards with header (index label) + delete button
- Add button at bottom
- Optional move up/down reordering
- Item count in header

#### `SocialLinksField` — Platform + URL Array
```typescript
interface SocialLinksFieldProps {
  value: Array<{ platform: string; href: string }>
  onChange: (links: Array<{ platform: string; href: string }>) => void
  platforms?: string[]         // defaults to ["instagram", "facebook", "youtube", "twitter", "email", "website"]
}
```
Replaces 2 implementations (hero-editor, footer-editor) with a single consistent component.

#### `AddressField` — Multi-line Address
```typescript
interface AddressFieldProps {
  value: string[]
  onChange: (lines: string[]) => void
  maxLines?: number
}
```
Replaces 1 implementation but will be needed for Location section variants.

---

### Tier 3: Semantic Primitives (extract third — for design recommendation work)

These support the section consolidation plan from section-design-recommendation.md.

#### `DataDrivenBanner` — CMS Content Notice
```typescript
interface DataDrivenBannerProps {
  sectionType: SectionType
  description?: string        // override default message
}
```
Standardizes the blue info banner shown on data-driven sections.

#### `VariantSelector` — Layout Variant Toggle
```typescript
interface VariantSelectorProps {
  label?: string               // defaults to "Layout"
  value: string
  onChange: (variant: string) => void
  options: Array<{
    value: string
    label: string
    description?: string
    preview?: React.ReactNode  // thumbnail preview
  }>
}
```
New component needed for the section consolidation (Hero variants, Location variants, etc.). Renders as a visual card selector or segmented control.

#### `EditorSection` — Collapsible Field Group
```typescript
interface EditorSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}
```
Groups related fields with a collapsible header. Needed for the "Content" vs "Style" progressive disclosure pattern.

---

## 4. Impact Analysis

### Before (current)

```
hero-editor.tsx:        672 lines
content-editor.tsx:     692 lines
cards-editor.tsx:       959 lines
ministry-editor.tsx:   1120 lines
Total across 14 files: ~5273 lines
```

### After (estimated)

With Tier 1 + Tier 2 extraction, each editor shrinks by ~40-50%:

```
hero-editor.tsx:        ~400 lines (-40%)
content-editor.tsx:     ~400 lines (-42%)
cards-editor.tsx:       ~550 lines (-43%)
ministry-editor.tsx:    ~650 lines (-42%)
Total across 14 files: ~3100 lines (-41%)
shared.tsx:             ~400 lines (from ~230 currently)
```

### Maintenance wins

| Scenario | Before | After |
|----------|--------|-------|
| Change label styling | Edit 14 files, 200+ places | Edit `EditorField`, done |
| Change empty state design | Edit 8 files, 12 places | Edit `ArrayField`, done |
| Change toggle card border | Edit 5 files, 20 places | Edit `EditorToggle`, done |
| Add new section editor | Copy-paste ~100 lines of boilerplate | Compose from 5-8 shared components |
| Implement variant selectors (section consolidation) | Build from scratch per editor | Use `VariantSelector` + `EditorSection` |

---

## 5. Implementation Order

### Phase A: Tier 1 Primitives (~4 hours)
Extract the 7 foundation components. Update all 14 editor files to use them. This is the highest-ROI work — eliminates the most duplication.

### Phase B: Tier 2 Array Primitives (~3 hours)
Extract `ArrayField`, `SocialLinksField`, `AddressField`. Update the ~9 editors that have array patterns.

### Phase C: Tier 3 Semantic Primitives (~2 hours)
Extract `DataDrivenBanner`, `VariantSelector`, `EditorSection`. These are needed for the section consolidation work but can be built ahead of time.

**Total: ~9 hours across 3 phases.**

---

## 6. Agent Team Deployment Plan

### Agent 1: `tier1-foundation` — Foundation Primitives
**Task:** Create `EditorField`, `EditorInput`, `EditorTextarea`, `EditorToggle`, `EditorSelect`, `EditorButtonGroup`, `TwoColumnGrid` in `shared.tsx`.
**Context needed:**
- Current `shared.tsx` (to extend, not replace)
- `display-settings.tsx` (for toggle and select patterns)
- `hero-editor.tsx` (for button group and labeled input patterns)
- `content-editor.tsx` (for textarea patterns)
**Output:** Extended `shared.tsx` with 7 new exported components.

### Agent 2: `tier1-migrate-hero-content` — Migrate Hero + Content Editors
**Task:** Refactor `hero-editor.tsx` and `content-editor.tsx` to use Tier 1 components from shared.tsx.
**Context needed:**
- New `shared.tsx` (from Agent 1)
- Current `hero-editor.tsx` and `content-editor.tsx`
- `builder-right-drawer.tsx` (to verify import compatibility)
**Output:** Slimmed-down hero-editor and content-editor using shared components.

### Agent 3: `tier1-migrate-cards-ministry` — Migrate Cards + Ministry Editors
**Task:** Refactor `cards-editor.tsx` and `ministry-editor.tsx` to use Tier 1 components.
**Context needed:** Same as Agent 2 but for cards and ministry files.
**Output:** Slimmed-down cards-editor and ministry-editor.

### Agent 4: `tier1-migrate-remaining` — Migrate All Other Editors
**Task:** Refactor `faq-editor.tsx`, `timeline-editor.tsx`, `form-editor.tsx`, `footer-editor.tsx`, `photo-gallery-editor.tsx`, `schedule-editor.tsx`, `custom-editor.tsx`, `data-section-editor.tsx`, `display-settings.tsx` to use Tier 1 components.
**Context needed:** New `shared.tsx`, all remaining editor files.
**Output:** All remaining editors using shared components.

### Agent 5: `tier2-array-primitives` — Array & List Components
**Task:** Create `ArrayField`, `SocialLinksField`, `AddressField` in shared.tsx. Then refactor all editors that have array patterns to use them.
**Context needed:**
- `shared.tsx` (post-Tier 1)
- All editor files with array patterns (content-editor, cards-editor, faq-editor, timeline-editor, form-editor, footer-editor, photo-gallery-editor, schedule-editor, data-section-editor, hero-editor)
**Output:** 3 new shared components + all array editors migrated.
**Depends on:** Agents 2, 3, 4 completing first.

### Agent 6: `cross-audit` — Verification & Consistency Check
**Task:** After all agents complete, verify:
- Zero TypeScript errors
- All 41 section types still render correctly in the registry
- No duplicate component definitions remain in any editor file
- Every shared component has consistent props and styling
- `display-settings.tsx` uses the same `EditorToggle`/`EditorSelect` as the editors
**Depends on:** All other agents completing.

### Execution Strategy

```
Phase A (parallel):
  Agent 1: builds shared components          ─┐
                                               ├─ ~2 hours
Phase A (parallel, after Agent 1):            ─┘
  Agent 2: migrates hero + content           ─┐
  Agent 3: migrates cards + ministry          ├─ ~2 hours
  Agent 4: migrates remaining editors        ─┘

Phase B (sequential, after 2-4):
  Agent 5: array primitives + migration      ── ~3 hours

Phase C (after all):
  Agent 6: cross-audit                       ── ~1 hour
```

**Note:** Agent 1 MUST complete before Agents 2-4 can start (they need the shared components). Agents 2, 3, 4 can run in parallel since they touch different files. Agent 5 runs after 2-4 because it needs the Tier 1 migration done first. Agent 6 runs last.

---

## 7. What This Does NOT Cover

| Item | Why excluded |
|------|-------------|
| Section consolidation (41→24) | Separate effort per `section-design-recommendation.md`. This work makes that easier but doesn't do it. |
| Variant selector UI | Listed in Tier 3 but implementation depends on consolidation decisions. |
| Drag-and-drop reordering in arrays | Current move up/down buttons work. DnD is a future enhancement. |
| Rich text editor in section fields | Not needed — section text is plain strings, not TipTap content. |
| Content type validation (Zod schemas) | Separate concern — shared components don't add validation. |
| Iframe canvas migration | Separate architectural change (see `worklog/builder-responsive-rendering-bug.md`). |

---

## 8. Implementation Results (March 18, 2026)

### Execution Summary

All 7 agents deployed and completed successfully. Total execution time: ~25 minutes wall clock (agents ran in parallel where possible).

| Agent | Task | Status | Key Output |
|-------|------|--------|------------|
| **1: tier1-foundation** | Build shared component library | DONE | Created `shared/` directory with 6 files |
| **2: migrate-hero-content** | Refactor hero + content editors | DONE | 14 EditorInput, 7 EditorTextarea, 2 EditorButtonGroup replacements |
| **3: migrate-cards-ministry** | Refactor cards + ministry editors | DONE | cards-editor -49%, ministry-editor -48% reduction |
| **4: migrate-remaining** | Refactor 8 remaining editors + display-settings | DONE | All 9 files migrated |
| **5** | *(merged into Agent 4)* | N/A | Array primitives used directly |
| **6: cross-audit** | Fix TS errors + verify | DONE | Fixed export issues, prop mismatches, ArrayField API migrations |
| **7: docs-future-system** | Future component map documentation | DONE | `section-catalog/future-editor-component-map.md` |

### File Organization (Final)

```
section-editors/
  shared/                          ← NEW directory (replaces old shared.tsx)
    field-primitives.tsx           ← EditorField, EditorInput, EditorTextarea,
                                     EditorToggle, EditorSelect, EditorButtonGroup,
                                     TwoColumnGrid
    array-fields.tsx               ← ArrayField<T>, SocialLinksField, AddressField
    media-fields.tsx               ← ImagePickerField, ButtonConfig
    card-fields.tsx                ← CardItemEditor, AddCardButton, GenericCard
    banners.tsx                    ← DataDrivenBanner
    index.ts                       ← barrel re-export
  hero-editor.tsx                  ← 5 exported sub-editors, uses shared components
  content-editor.tsx               ← 6 exported sub-editors
  cards-editor.tsx                 ← 6 exported sub-editors
  ministry-editor.tsx              ← 6 exported sub-editors
  data-section-editor.tsx          ← 10+ data-driven sub-editors
  faq-editor.tsx                   ← standalone, uses ArrayField
  timeline-editor.tsx              ← standalone, uses ArrayField
  form-editor.tsx                  ← standalone, uses ArrayField
  footer-editor.tsx                ← standalone, uses SocialLinksField + AddressField + ArrayField
  photo-gallery-editor.tsx         ← standalone, uses ArrayField
  schedule-editor.tsx              ← standalone, uses ArrayField
  custom-editor.tsx                ← 2 exported sub-editors, uses EditorButtonGroup
  display-settings.tsx             ← uses EditorToggle, EditorSelect, EditorInput
  index.tsx                        ← flat registry (SectionType → EditorComponent)
```

### Net Code Impact

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total lines across 14 editors | ~5,273 | ~3,037 | **-2,236 lines (-42%)** |
| Shared component lines | 223 (1 file) | ~400 (6 files) | +177 lines (reusable) |
| Duplicate `ImagePickerField` definitions | 5 | 0 | Eliminated |
| Duplicate `ButtonConfig` definitions | 2 | 0 | Eliminated |
| Inline labeled input patterns | 150+ | 0 | All use `EditorInput` |
| Inline textarea patterns | 40+ | 0 | All use `EditorTextarea` |
| Inline toggle patterns | 20+ | 0 | All use `EditorToggle` |
| Inline array editors | 15+ | 0 | All use `ArrayField` |

### Components Created (15 total)

**Tier 1 — Field Primitives (7):**
- `EditorField` — universal labeled field wrapper
- `EditorInput` — labeled text/number/url input
- `EditorTextarea` — labeled textarea with className/spellCheck support
- `EditorToggle` — switch with label, optional description, optional bordered card
- `EditorSelect` — labeled dropdown with className support
- `EditorButtonGroup` — segmented control (text alignment, aspect ratio, day selector)
- `TwoColumnGrid` — 2-column layout wrapper

**Tier 2 — Array Primitives (3):**
- `ArrayField<T>` — generic array editor (header+count, item cards, delete, reorder, add, empty state)
- `SocialLinksField` — platform dropdown + URL pairs
- `AddressField` — multi-line text input array

**Existing (migrated from old shared.tsx to shared/media-fields.tsx and shared/card-fields.tsx):**
- `ImagePickerField` — image preview + MediaPickerDialog
- `ButtonConfig` — CTA button editor (label + href + visible toggle)
- `CardItemEditor` — generic card item with grip handle
- `AddCardButton` — dashed "Add" button

**New (Tier 3 starter):**
- `DataDrivenBanner` — blue info banner for CMS-connected sections

### Issues Found & Fixed During Cross-Audit

| Issue | Fix |
|-------|-----|
| Sub-editors not exported in hero/content/cards/ministry/custom editors | Added `export` to all 30 sub-editor functions |
| `EditorTextarea` missing `className` and `spellCheck` props | Added to interface and implementation |
| `EditorSelect` missing `className` prop | Added to interface and implementation |
| `DataDrivenBanner` required `sectionType` but some callers only passed `description` | Made `sectionType` optional |
| Agent 4 used children-based `ArrayField` API but Agent 1 built renderItem-based API | Migrated all ArrayField call sites to `renderItem`/`createItem`/`onItemsChange` |
| `SocialLinksField` prop mismatch (`links`/`url` vs `value`/`href`) | Fixed footer-editor call site |
| `AddressField` prop mismatch (`lines` vs `value`) | Fixed footer-editor call site |
| Number values passed as `value` to `EditorInput` (expects string) | Wrapped with `String()` |
| HIGHLIGHT_CARDS and SPOTLIGHT_MEDIA routed to wrong editors | Moved from flat registry to DATA_SECTION_TYPES set |

### Documentation Created

- `docs/04_builder/section-catalog/future-editor-component-map.md` — maps all 24 proposed consolidated section types to their shared components, variant selector spec, component reuse matrix, migration paths, and new components needed for the consolidation
