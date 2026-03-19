# Dirty Tracking System

> How the website builder tracks which parts of the page have changed and need saving.
> **Last updated:** March 19, 2026

---

## Overview

The builder uses **granular dirty tracking** to determine what to save. Instead of saving all sections on every save, only the changed parts are sent to the API. This is:

1. **More efficient** -- typical save sends 1-3 section PATCHes instead of 10-15
2. **Safer for concurrent editing** -- two users editing different sections on the same page won't overwrite each other's work
3. **Required for correct undo behavior** -- knowing what's dirty lets undo-to-initial-state clear the "unsaved changes" warning

---

## Dirty Flags

Four independent flags in `BuilderShell`:

| Flag | Type | What it tracks | Triggers save of |
|---|---|---|---|
| `dirtySectionIds` | `Set<string>` | Which sections have been modified (by ID) | `PATCH /api/v1/pages/{slug}/sections/{id}` for each dirty section |
| `reorderDirty` | `boolean` | Whether section order has changed | `PUT /api/v1/pages/{slug}/sections` (reorder) |
| `pageDirty` | `boolean` | Whether page-level metadata has changed (title) | `PATCH /api/v1/pages/{slug}` |
| `isDirty` | `boolean` | Master flag -- `true` if any of the above are set | Controls "Unsaved changes" dialog, `beforeunload`, auto-save timer |

### Relationship

`isDirty` is a superset flag. It's set to `true` whenever any granular flag changes. The save handler checks the granular flags to decide which API calls to make, but uses `isDirty` as the overall gate.

---

## What Sets Each Flag

### `dirtySectionIds`

| Action | How it's set |
|---|---|
| Content edit (text, images, toggles, arrays) | `dirtySectionIds.add(sectionId)` via `handleSectionEditorChange` |
| Display settings change (colorScheme, paddingY, containerWidth, enableAnimations, visible, label) | Same as content -- routed through `handleSectionEditorChange` |
| Undo/redo to non-pristine state | `new Set(snapshot.sections.map(s => s.id))` -- marks ALL sections dirty (safe fallback) |
| Section delete | `dirtySectionIds.delete(sectionId)` -- removed from set since the DELETE API call is immediate |

### `reorderDirty`

| Action | How it's set |
|---|---|
| Drag-and-drop reorder | `setReorderDirty(true)` in `handleReorderSections` |
| Section added (changes sort order of subsequent sections) | `setReorderDirty(true)` in `handlePickerSelect` |
| Section deleted (changes sort order of subsequent sections) | `setReorderDirty(true)` in `confirmDeleteSection` |
| Undo/redo to non-pristine state | `setReorderDirty(true)` (safe fallback) |

### `pageDirty`

| Action | How it's set |
|---|---|
| Page title change | `setPageDirty(true)` in `handleTitleChange` |
| Undo/redo to non-pristine state | `setPageDirty(true)` (safe fallback) |

### `isDirty`

Set to `true` any time one of the granular flags is set. Set to `false` only by:
- Save completion
- Undo/redo restoring to the pristine (DB-loaded) state
- Page navigation reset (new page loaded)

---

## What Clears Each Flag

### On save

All flags are cleared after a successful save:

```typescript
setDirtySectionIds(new Set())
setReorderDirty(false)
setPageDirty(false)
setIsDirty(false)
```

### On undo/redo to pristine state

When undo or redo restores the state to exactly what was loaded from the DB (compared via `JSON.stringify` against `pristineRef`), all flags are cleared.

### On page navigation

When the user navigates to a different page (new `page` prop), all flags are reset in the page-reset `useEffect`.

---

## Pristine State Detection

A `pristineRef` (React ref) stores the serialized initial state:

```typescript
const pristineRef = useRef<string>(
  JSON.stringify({ sections: page.sections, pageTitle: page.title })
)
```

Updated when:
- Component mounts (from `page` prop)
- `page` prop changes (navigating to a different page in the builder)

**Not updated on save.** After save, the user may continue to undo past the save point. If we updated pristineRef on save, undoing to the save point would clear dirty flags even though the user has older history entries they might want.

### Comparison logic

After undo/redo, the restored snapshot is serialized and compared:

```typescript
const snapshotStr = JSON.stringify({
  sections: snapshot.sections,
  pageTitle: snapshot.pageTitle,
})
if (snapshotStr === pristineRef.current) {
  // Restored to DB state -- clear all dirty flags
} else {
  // Still differs from DB -- mark all sections dirty (safe fallback)
}
```

The "mark all dirty" fallback on non-pristine undo is intentionally conservative. After undo, we can't cheaply determine which specific sections differ from the DB state without per-section comparison. Marking all dirty means save may send a few extra PATCHes, but the data is always correct.

---

## Save Flow with Dirty Tracking

```
handleSave():
  1. Guard: if (!pageDirty && !reorderDirty && dirtySectionIds.size === 0)
     -> early return, clear isDirty
  2. Guard: if (isSaving) -> return (prevents double-save)

  3. If pageDirty:
     PATCH /api/v1/pages/{slug} with { title }

  4. If reorderDirty:
     PUT /api/v1/pages/{slug}/sections with { sectionIds: [...] }

  5. If dirtySectionIds.size > 0:
     Filter sections to only dirty ones
     PATCH each dirty section with { content, colorScheme, paddingY,
       containerWidth, enableAnimations, visible, label }
     via Promise.all (parallel)

  6. On success: clear all dirty flags, router.refresh()
  7. On failure: toast error, keep dirty flags (user can retry)
```

---

## Interaction with Undo/Redo

| Scenario | Dirty behavior |
|---|---|
| Edit, then undo | If undo restores pristine: dirty cleared. Otherwise: all sections marked dirty. |
| Edit, save, then undo past save point | `isDirty=true`, all sections dirty. Pristine is the original DB load, not the save point. |
| Edit section A, undo, edit section B | Section B is dirty. Section A's changes are gone (undone). |
| Redo after undo | Same pristine comparison as undo. |

### Why mark ALL sections dirty on non-pristine undo?

The undo stack stores full snapshots, not diffs. After undo, we know the state differs from DB, but not which sections specifically changed. Options:

1. **Per-section diff against DB state** -- correct but requires storing the DB state per-section and comparing. Adds complexity.
2. **Track dirty set through undo** -- would require the undo stack to also store the dirty set at each point. Adds to snapshot size.
3. **Mark all dirty** (current approach) -- conservative but correct. May send a few extra PATCHes on save, but the data integrity is guaranteed.

Option 3 was chosen for simplicity. The extra PATCHes are minimal (typically 5-15 sections, each < 2KB) and don't affect UX.

---

## Interaction with Auto-Save

The auto-save timer (30s debounce) checks `isDirty` and triggers `handleSave()`. The save handler then uses the granular flags to decide what to send.

The timer resets on every state change (`sections`, `pageData.title`). This means if the user keeps editing, auto-save doesn't fire until they've paused for 30 seconds.

---

## Code Reference

| File | Lines | What |
|---|---|---|
| `builder-shell.tsx:94-96` | Dirty flag declarations | `dirtySectionIds`, `reorderDirty`, `pageDirty` |
| `builder-shell.tsx:89` | Master dirty flag | `isDirty` |
| `builder-shell.tsx:156-160` | Pristine ref | `pristineRef` initialization |
| `builder-shell.tsx:167-215` | Undo/redo pristine comparison | Clears or sets dirty flags based on comparison |
| `builder-shell.tsx:226-242` | Page reset effect | Clears all flags, updates pristineRef |
| `builder-shell.tsx:280-370` | Save handler | Reads granular flags, sends selective API calls |
| `builder-shell.tsx:651-692` | Section editor change handler | Sets `dirtySectionIds` and `isDirty` |
| `builder-shell.tsx:601-605` | Section reorder handler | Sets `reorderDirty` |
| `builder-shell.tsx:556-587` | Section delete handler | Removes from `dirtySectionIds`, sets `reorderDirty` |
| `builder-shell.tsx:736-741` | Title change handler | Sets `pageDirty` |

---

## Related Documents

| Document | Purpose |
|---|---|
| `docs/04_builder/dev-notes/undo-redo-and-save-architecture.md` | Full undo/redo system architecture |
| `docs/04_builder/mental-model/concurrent-editing-strategy.md` | Why dirty tracking matters for concurrent editing |
