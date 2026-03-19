# Undo/Redo & Save Architecture

> How the website builder handles state changes, undo/redo history, and persistence.
> **Last updated:** March 19, 2026

---

## High-Level Summary

**Undo/redo is 100% client-side, in-memory React state. No Redis, no database versioning, no browser storage (localStorage/IndexedDB). Saving is a manual or auto-triggered HTTP POST to the PostgreSQL database via API routes.**

The system has two completely separate concerns:

| Concern | Where it lives | Technology |
|---|---|---|
| **Undo/redo history** | Browser memory (React `useState`) | `useBuilderHistory` hook |
| **Persistent storage** | PostgreSQL via Prisma | REST API (`/api/v1/pages/...`) |

They connect through the **Save** action: when the user clicks Save (or auto-save fires), the current in-memory state is written to the database. The undo/redo stack is never persisted -- it lives only for the duration of the page session.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React)                                                │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  past: T[]        │    │  future: T[]      │                  │
│  │  (max 50 entries) │    │  (cleared on new  │                  │
│  │                   │    │   push)            │                  │
│  └────────┬─────────┘    └─────────┬────────┘                   │
│           │                        │                             │
│           └────────┬───────────────┘                             │
│                    │                                             │
│           ┌────────▼────────┐                                    │
│           │ useBuilderHistory│  ← generic hook, holds snapshots  │
│           └────────┬────────┘                                    │
│                    │                                             │
│           ┌────────▼────────┐                                    │
│           │  BuilderShell    │  ← owns `sections[]` + `pageData` │
│           │  (current state) │                                   │
│           └────────┬────────┘                                    │
│                    │                                             │
│           ┌────────▼────────────────────────┐                    │
│           │  Dirty tracking layer            │                   │
│           │  (dirtySectionIds, pageDirty,    │                   │
│           │   reorderDirty, pristineRef)     │                   │
│           └────────┬────────────────────────┘                    │
│                    │                                             │
│           ┌────────▼────────┐                                    │
│           │  Save action     │  ← manual (Ctrl+S / button)      │
│           │                  │    or auto (30s debounce)         │
│           └────────┬────────┘                                    │
│                    │                                             │
└────────────────────┼────────────────────────────────────────────┘
                     │ HTTP (fetch)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js API Routes                                             │
│  PATCH /api/v1/pages/[slug]              (page metadata)        │
│  PUT   /api/v1/pages/[slug]/sections     (reorder)              │
│  PATCH /api/v1/pages/[slug]/sections/[id] (section content)     │
└────────────────────┬────────────────────────────────────────────┘
                     │ Prisma
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  PostgreSQL                                                     │
│  Tables: Page, PageSection                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Snapshot Shape

```typescript
interface BuilderSnapshot {
  sections: BuilderSection[]  // full section array (id, type, content, display settings)
  pageTitle: string           // page title at that point in time
}
```

Each snapshot is a **full clone** of the state, not a diff. This is simple and fast for the current scale (typical page has 5-15 sections). If pages grow to hundreds of sections, switching to a diff/patch model (e.g., `immer` patches) would reduce memory usage.

---

## Step-by-Step: How It Works

### 1. Page load

When the builder opens, the server component (`app/cms/website/builder/page.tsx`) fetches the page and its sections from the database. This becomes the initial React state:

```
sections = page.sections        // from DB
pageData = page                 // from DB
history = { past: [], future: [] }
isDirty = false
pristineRef = JSON.stringify({ sections, pageTitle })   // baseline for dirty comparison
```

### 2. User makes an edit

There are two snapshot strategies depending on the mutation type:

**Explicit mutations** (add, delete, reorder, title change) push a snapshot immediately:

```
1. pushSnapshot()          // clone current state -> push onto `past[]`
2. mutate state            // setSections(newState) or setPageData(...)
3. mark dirty              // setIsDirty(true) + granular dirty flags
```

**Inline editor changes** (content, display settings) use debounced snapshots:

```
1. Check: has 500ms passed since the last snapshot push?
   - Yes: pushSnapshot(), update lastSnapshotTimeRef
   - No:  skip (batches rapid-fire changes like typing)
2. setSections(newState)   // apply the change
3. mark dirty              // setDirtySectionIds.add(sectionId), setIsDirty(true)
```

This means rapid typing creates ~1 snapshot per 500ms, while discrete property changes (padding toggle, color scheme dropdown) each get their own undo entry because they're separated by > 500ms of user interaction time.

### 3. Undo (Cmd+Z / Ctrl+Z or button)

```
1. Pop last entry from `past[]`
2. Push current state onto `future[]` (so redo works)
3. Restore the popped snapshot -> setSections(), setPageData()
4. Compare restored state to pristineRef:
   - If equal: clear all dirty flags (isDirty=false, dirtySectionIds=empty, etc.)
   - If different: mark all sections dirty (safe fallback)
5. Reset lastSnapshotTimeRef = 0 (so next edit gets its own snapshot)
```

### 4. Redo (Cmd+Shift+Z / Ctrl+Shift+Z or button)

Same logic as undo, but pops from `future[]` and pushes onto `past[]`. Same pristine comparison.

### 5. New edit after undo (fork)

When the user undoes, then makes a new edit, `future[]` is **cleared** -- the "forked" timeline is discarded. This is standard undo/redo behavior (same as text editors, Photoshop, etc.).

### 6. Save (manual or auto)

Triggered by:
- **Cmd+S / Save button** -- immediate
- **Auto-save** -- 30 seconds after the last change (debounced)

The save process uses selective save (see `dirty-tracking.md`):

```
1. Early return if nothing is dirty
2. PATCH /api/v1/pages/[slug]                -> save page title (if pageDirty)
3. PUT   /api/v1/pages/[slug]/sections       -> reorder (if reorderDirty)
4. PATCH /api/v1/pages/[slug]/sections/[id]  -> only dirty sections (Promise.all)
5. Clear all dirty flags, isDirty = false
6. router.refresh() to revalidate server data
```

The undo/redo stack is **not cleared** on save. The user can still undo after saving.

### 7. Page navigation (switching pages in builder)

```
1. If isDirty -> show "Unsaved changes" confirmation dialog
2. On confirm -> discard changes, navigate
3. On new page load -> history.reset(), pristineRef updated, all dirty flags cleared
```

### 8. Tab close / browser navigation

The `beforeunload` event fires a browser-native "Are you sure?" dialog if `isDirty === true`.

---

## Keyboard Shortcuts

The keyboard handler (builder-shell.tsx) listens on `window` for `keydown`:

| Shortcut | Action | Guard |
|---|---|---|
| `Cmd/Ctrl+Z` | Undo | Deferred to native undo only for text-like inputs (text, email, url, search, tel, password, number), textareas, and contentEditable elements. For all other focused elements (selects, switches, buttons, etc.), the builder undo fires. |
| `Cmd/Ctrl+Shift+Z` | Redo | Same guard as undo |
| `Cmd/Ctrl+S` | Save | Always fires (preventDefault) |
| `Escape` | Close editor/selection | Cascading: nav item -> nav settings -> navbar -> section editor -> section selection -> active tool |

### Iframe keyboard forwarding

The canvas renders inside an `<iframe>` for correct CSS media query behavior. When the user clicks inside the iframe, **focus moves to the iframe's window** and keyboard events fire inside the iframe's document, not the parent's. The parent `window.addEventListener("keydown")` never sees them.

To solve this, the iframe preview client (`builder-preview-client.tsx`) has its own `keydown` listener that intercepts Cmd+Z, Cmd+Shift+Z, and Cmd+S, calls `preventDefault()`, and forwards them to the parent via the existing `postToParent()` postMessage bridge as a `KEYBOARD_SHORTCUT` message. The parent's `BuilderCanvas` component receives these messages and calls the appropriate handler (`onUndo`, `onRedo`, `onSave`).

This is the same pattern used by Webflow, Framer, and Wix for iframe-based builders.

### Why the guard exists

When typing in a text input, Cmd+Z should do native browser undo (undo the last keystroke). For non-text elements like dropdowns, toggles, and the canvas, there's no native undo to preserve, so the builder's undo fires instead.

Note: the iframe forwarding does NOT apply the text-input guard -- it forwards all Cmd+Z events unconditionally. This is correct because the iframe canvas has no text inputs; all editing happens in the parent frame's right drawer.

---

## Snapshot Push Points

All places where `pushSnapshot()` is called:

| Caller | When | Debounced? |
|---|---|---|
| `handleSectionEditorChange` | Any content or display settings change from the right drawer | Yes (500ms) |
| `handleReorderSections` | Drag-and-drop reorder in sidebar or canvas | No (immediate) |
| `confirmDeleteSection` | Before removing a section | No (immediate) |
| `handlePickerSelect` | After adding a new section via picker | No (immediate) |
| `handleTitleChange` | Page title edit in topbar | No (immediate) |

---

## Pristine State Comparison

A `pristineRef` stores `JSON.stringify({ sections, pageTitle })` of the DB-loaded state. It's updated:
- On initial render (from `page` prop)
- When the `page` prop changes (navigating to a different page)

After undo/redo, the restored snapshot is serialized and compared to `pristineRef.current`. If they match, the user has undone back to the exact DB state, so all dirty flags are cleared. This prevents false "unsaved changes" warnings.

---

## The Controlled Component Pattern

Both the canvas (iframe) and the editor drawer read from the same source: `BuilderShell.sections`. Neither maintains its own copy.

```
BuilderShell.sections --> Canvas (iframe)          <- reads via postMessage
                      └-> SectionEditorInline      <- reads from props (no local state)
```

`SectionEditorInline` derives `content` and `displaySettings` from the `section` prop on every render. The `onChange` callback sends changes directly to the parent. This ensures undo/redo propagates instantly to both the canvas and the editor drawer.

---

## Code Reference

| File | Role |
|---|---|
| `builder/use-builder-history.ts` | Generic undo/redo hook (50 snapshot cap, `structuredClone`) |
| `builder/builder-shell.tsx:154-165` | History hook + pristineRef initialization |
| `builder/builder-shell.tsx:162-165` | `pushSnapshot()` |
| `builder/builder-shell.tsx:167-215` | `handleUndo` / `handleRedo` with pristine comparison |
| `builder/builder-shell.tsx:280-370` | Save logic with selective dirty save |
| `builder/builder-shell.tsx:383-404` | Auto-save timer (30s debounce) |
| `builder/builder-shell.tsx:406-455` | Keyboard shortcuts (Cmd+Z, Cmd+Shift+Z, Cmd+S, Escape) |
| `builder/builder-shell.tsx:645-692` | `handleSectionEditorChange` with debounced snapshots |
| `builder/layout/builder-right-drawer.tsx:81-203` | `SectionEditorInline` (controlled, no local state) |
| `builder/layout/builder-topbar.tsx` | Undo/redo buttons in the UI |
| `builder/canvas/builder-preview-client.tsx` | Iframe keydown listener, forwards shortcuts via postMessage |
| `builder/canvas/builder-canvas.tsx` | Receives `KEYBOARD_SHORTCUT` messages, calls onUndo/onRedo/onSave |
| `builder/canvas/iframe-protocol.ts` | `KEYBOARD_SHORTCUT` message type definition |

---

## Key Design Decisions

### Why in-memory React state (not localStorage/IndexedDB)?

- **Simplicity.** The builder operates on a single page at a time. State size is small (section metadata + content JSON, typically < 100KB for 50 snapshots).
- **No stale data.** localStorage would require cache invalidation logic for when the DB changes from another tab or user.
- **Acceptable trade-off.** If the tab crashes, the user loses unsaved changes -- but auto-save at 30s limits the blast radius.

### Why debounced snapshots instead of one-per-session?

The original design pushed one snapshot when the editor opened, then batched all changes until the editor closed. This meant changing text then changing padding resulted in a single undo step that reverted both. Users expect each "type" of change to be independently undoable.

The 500ms debounce balances two needs:
- **Typing**: Rapid keystrokes (~50-200ms apart) are batched into ~1 snapshot per 500ms, keeping the history manageable
- **Discrete changes**: Toggling padding, changing color scheme, etc. are separated by > 500ms of user interaction time, so each gets its own undo entry

### Why not Redis?

Redis would be needed for real-time collaboration (OT/CRDTs + WebSockets). Not needed for our use case (1-3 admins editing monthly). See Scalability Analysis below.

### Why not database versioning (page_versions table)?

Database versioning is **revision history** ("restore to last Tuesday"), not undo/redo. These are complementary and could coexist. The current system only has undo/redo. Revision history could be added later.

---

## Scalability Analysis

### What scales fine as-is

| Aspect | Why it's fine |
|---|---|
| Single user editing one page | 50 snapshots * ~2KB each = 100KB memory |
| Auto-save at 30s | One API call per 30s is negligible load |
| Multiple pages in sidebar | Only the active page has an undo stack |
| Debounced snapshots | 500ms threshold keeps history entries manageable |

### When you'd need to evolve

| Scenario | Solution | Needs Redis? | Status |
|---|---|---|---|
| **Concurrent editing** (2+ users on same page) | Presence awareness + dirty section tracking + silent last-write-wins | No | Dirty tracking DONE, presence NOT STARTED |
| **Real-time collaboration** (live cursors, co-editing) | Operational transforms (OT) or CRDTs + WebSockets | Yes | Deferred |
| **Revision history** ("restore to v3") | `PageVersion` table, store snapshots on each save | No, just PostgreSQL | Deferred |
| **Offline editing** | Service worker + IndexedDB for pending changes | No | Deferred |
| **Very large pages** (500+ sections) | Diff-based history instead of full snapshots | No | Deferred |

---

## Bugs Fixed (March 19, 2026)

### 1. Undo to initial state falsely triggered dirty tracking

**Problem:** Undoing all the way back to the DB-loaded state still showed "unsaved changes" because `handleUndo` unconditionally set `isDirty=true` and marked all sections dirty.

**Fix:** Added `pristineRef` to store the serialized initial state. After undo/redo, compare the restored snapshot to pristine. If equal, clear all dirty flags.

### 2. Undo only worked for text content, not display settings

**Problem:** `editingSnapshotPushedRef` (boolean) pushed one snapshot per editing session. If the user changed text then changed padding, only the pre-text state was captured. Undoing reverted both changes in one step.

**Fix:** Replaced the boolean flag with `lastSnapshotTimeRef` (timestamp). Snapshots are pushed before each change if >= 500ms have elapsed. Rapid typing batches; discrete property changes each get their own undo entry.

### 3. Cmd+Z / Ctrl+Z keyboard shortcuts not working

**Problem:** The keyboard handler returned early for ALL focused `HTMLInputElement` types. Since the user is almost always focused on an input in the editor drawer, the builder undo never fired.

**Fix:** Narrowed the guard to only defer to native browser undo for text-like inputs (`text`, `email`, `url`, `search`, `tel`, `password`, `number`), `HTMLTextAreaElement`, and `contentEditable` elements. For all other elements (selects, switches, buttons, etc.), the builder's undo fires.

---

### 4. Keyboard shortcuts not working when iframe canvas is focused

**Problem:** After clicking inside the iframe canvas (website preview), keyboard focus moves to the iframe's window. The parent's `window.addEventListener("keydown")` never receives the event, so Cmd+Z/Shift+Z/S do nothing.

**Fix:** Added a `keydown` listener inside the iframe (`builder-preview-client.tsx`) that intercepts builder shortcuts and forwards them to the parent via `postToParent({ type: "KEYBOARD_SHORTCUT", shortcut })`. The parent's `BuilderCanvas` receives the message and calls the appropriate handler. Added `KEYBOARD_SHORTCUT` to `IframeToParentMessage` in `iframe-protocol.ts`.

---

## Related Documents

| Document | Purpose |
|---|---|
| `docs/04_builder/dev-notes/dirty-tracking.md` | Dirty tracking system in detail |
| `docs/04_builder/mental-model/concurrent-editing-strategy.md` | Presence + dirty tracking + last-write-wins design |
| `docs/04_builder/worklog/undo-redo-drawer-sync.md` | Controlled component refactor (March 18 fix) |
