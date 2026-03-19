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
- After save + background refetch (updated to match new server state)

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
     - 404 responses: section deleted by another user -> remove from local state, warn via toast
     - Other failures: toast error, keep dirty flags

  6. On success: clear all dirty flags, post-save refetch + merge, reset history
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

## Interaction with Background Sync

The background sync system (`use-background-sync.ts`) polls the server every 15 seconds to pick up other users' changes. Dirty tracking and background sync coexist through careful gating:

### When sync is suppressed

Background sync **skips polling** when any of these are true:
- `isDirty === true` -- the user has unsaved local changes; overwriting them would lose work
- `isSaving === true` -- a save is in progress
- Within 5 seconds after a save completes (`POST_SAVE_PAUSE_MS`) -- avoids racing with the post-save refetch
- Tab is hidden (`document.visibilityState === "hidden"`)

This means sync only runs when the user is **idle** (no unsaved changes, no active save). An idle user sees other users' changes appear within ~15 seconds.

### Post-save merge vs. background sync

Both mechanisms fetch fresh page data from the server, but they serve different purposes:

| Mechanism | When it runs | Merge logic |
|---|---|---|
| **Post-save refetch** (in `handleSave`) | Immediately after a successful save | Keeps local versions for just-saved sections; uses server versions for everything else. Preserves local-only sections added during the save window. |
| **Background sync** (in `useBackgroundSync`) | Every 15s when idle | Full replacement -- overwrites all local state with server data. Safe because `isDirty` gating ensures no unsaved changes exist. |

### State reset after sync

When background sync applies fresh data, it:
1. Replaces all sections with server versions
2. Updates the page title
3. Updates `pristineRef` to match the new server state
4. Resets the undo history (stale snapshots would reference obsolete state)

This ensures that after a sync, the user starts from a clean slate matching the DB.

### Content hashing

Background sync uses a JSON hash of `{ sections, title }` to detect changes. If the server data matches the last-fetched hash, `onSync` is not called. This prevents unnecessary re-renders when no one else has made changes.

---

## Code Reference

| File | Lines | What |
|---|---|---|
| `builder-shell.tsx:97-99` | Dirty flag declarations | `dirtySectionIds`, `reorderDirty`, `pageDirty` |
| `builder-shell.tsx:92` | Master dirty flag | `isDirty` |
| `builder-shell.tsx:162-164` | Pristine ref | `pristineRef` initialization |
| `builder-shell.tsx:171-219` | Undo/redo pristine comparison | Clears or sets dirty flags based on comparison |
| `builder-shell.tsx:230-246` | Page reset effect | Clears all flags, updates pristineRef |
| `builder-shell.tsx:286-480` | Save handler | Reads granular flags, sends selective API calls, post-save merge |
| `builder-shell.tsx:808+` | Section editor change handler | Sets `dirtySectionIds` and `isDirty` |
| `builder-shell.tsx:758-762` | Section reorder handler | Sets `reorderDirty` |
| `builder-shell.tsx:714-750` | Section delete handler | Removes from `dirtySectionIds`, sets `reorderDirty` |
| `builder-shell.tsx:902-907` | Title change handler | Sets `pageDirty` |
| `use-background-sync.ts` | Full file | Background polling with isDirty/isSaving gating |

---

## Related Documents

| Document | Purpose |
|---|---|
| `docs/04_builder/dev-notes/undo-redo-and-save-architecture.md` | Full undo/redo system architecture |
| `docs/04_builder/dev-notes/concurrent-editing-strategy.md` | Why dirty tracking matters for concurrent editing |
