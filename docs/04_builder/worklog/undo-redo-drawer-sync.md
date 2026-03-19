# Undo/Redo Editor Drawer Sync — Analysis & Implementation Plan

> **Date:** March 18, 2026
> **Status:** Proposed — awaiting approval
> **Bug:** Cmd+Z undoes on canvas but not in the right-side editor drawer

---

## 1. The Bug

When a user edits a section field (e.g., heading text) and presses Cmd+Z:
- The **canvas** (iframe) correctly shows the previous content
- The **right drawer** editor fields still show the new (post-edit) content

The data layer undo works correctly — save after undo sends the right data to the API. The bug is purely visual: the editor form doesn't reflect the undo'd state.

---

## 2. Root Cause: Stale Local State in SectionEditorInline

**File:** `components/cms/website/builder/layout/builder-right-drawer.tsx`

`SectionEditorInline` initializes local state from props at mount time:

```typescript
function SectionEditorInline({ section, onChange, onDelete }) {
  const [content, setContent] = useState(() => section.content ?? {})         // ← read ONCE
  const [displaySettings, setDisplaySettings] = useState(() => ({
    colorScheme: section.colorScheme,  // ← read ONCE
    paddingY: section.paddingY,
    // ...
  }))
}
```

The component is keyed by `section.id`:
```tsx
<SectionEditorInline key={section.id} section={section} ... />
```

**On undo:**
1. BuilderShell replaces the entire `sections` array with the snapshot
2. `editingSection` is re-derived from the new array (correct data)
3. `editingSection` prop is passed to `SectionEditorInline`
4. But the key (`section.id`) hasn't changed — the component does NOT remount
5. The local `content` and `displaySettings` states remain stale
6. The editor renders with the old (pre-undo) values

**Why the canvas works:** The iframe receives `UPDATE_SECTIONS` via postMessage and replaces its state wholesale — no local state caching.

---

## 3. The Deeper Issue: Dual Source of Truth

The bug reveals a structural problem: **content has two owners.**

```
BuilderShell.sections ──→ Canvas (iframe)     ← reads from parent ✓
                      └──→ SectionEditorInline ← copies into local state ✗
                             └── local content state (diverges on undo)
```

The editor drawer and canvas should both read from the same data. Right now, the canvas does (via postMessage from parent state), but the editor drawer copies data into local state at mount time and diverges.

---

## 4. Industry Research: How Other Builders Handle This

### Webstudio (open-source, Immer-based)

> "Webstudio built Immerhin — a library on top of Immer.js and Nanostores that uses JSON patches to provide undo-redo and a transactions interface."

— [Webstudio Architecture](https://webstudio.is/blog/webstudios-architecture-an-overview), [Immerhin on GitHub](https://github.com/webstudio-is/immerhin)

**Pattern:** Both the builder panel and the canvas consume the **same Nanostore atoms**. Undo replays inverse patches on the store, and all consumers re-render. No local state copies. Single source of truth.

### Shopify Theme Editor

> "You can undo or redo unsaved customizations. After you save, you can no longer redo or undo."

— [Shopify Theme Editor Features](https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/features-overview)

**Pattern:** Session-level state. The settings panel reads directly from the session state — no local copies. Undo replaces the session state and all UI reflects it.

### General React Pattern: Controlled Components

> "A single state tree makes it easier to debug applications and to easily implement features like undo/redo."

— [Frontend Masters: State Management at Scale](https://frontendmasters.com/courses/react-nextjs-state/undo-redo-events/)

**The universally recommended pattern:** Editors should be **controlled components** — they read from props and call `onChange`. The parent owns the state. No local state in editors. When the parent's state changes (via undo or any other mechanism), all consumers re-render with the new data.

### Command Pattern (for future consideration)

> "The Command Pattern treats actions as objects that can be stored and replayed. An alternative to snapshot-based undo."

— [Phil Giese: Undo-Redo Architecture](https://www.philgiese.com/post/undo-redo-architecture)

**Our current approach (full snapshots via `structuredClone`) works for our scale (~50 history entries, sections are small JSON objects). The command pattern is more memory-efficient but adds complexity. Not needed now.**

---

## 5. Proposed Fix: Make SectionEditorInline Controlled

### The Principle

**Single source of truth.** Both the canvas and the editor drawer read from the same data: `BuilderShell.sections`. Neither has its own copy.

```
BuilderShell.sections ──→ Canvas (iframe)     ← reads from parent ✓
                      └──→ SectionEditorInline ← reads from props (no local state) ✓
```

### The Change

Remove local `content` and `displaySettings` state from `SectionEditorInline`. Instead, derive them from the `section` prop on every render. The `onChange` callback sends changes directly to the parent.

**Before (broken):**
```typescript
function SectionEditorInline({ section, onChange }) {
  const [content, setContent] = useState(() => section.content ?? {})

  const handleContentChange = (newContent) => {
    setContent(newContent)              // ← local state update
    onChange({ content: newContent })    // ← parent update
  }
  // Editor reads from `content` (local state)
}
```

**After (fixed):**
```typescript
function SectionEditorInline({ section, onChange }) {
  const content = section.content ?? {}

  const handleContentChange = (newContent) => {
    onChange({ content: newContent })    // ← parent update only
  }
  // Editor reads from `section.content` (parent state via prop)
}
```

### Why This Works

1. User edits heading → `onChange({ content: { heading: "Hello" } })` → parent updates `sections`
2. Parent re-renders → `editingSection` re-derived → new prop to `SectionEditorInline`
3. `section.content.heading` is now "Hello" → editor shows "Hello"
4. User presses Cmd+Z → parent replaces `sections` with snapshot
5. Parent re-renders → `editingSection` re-derived with "Welcome"
6. `section.content.heading` is now "Welcome" → editor shows "Welcome"
7. Canvas also receives UPDATE_SECTIONS → both UI elements are in sync

### Performance Consideration

The local state existed to provide immediate feedback without waiting for the parent re-render cycle. In practice:
- React batches state updates — `onChange` triggers a single re-render
- The parent's `setSections` → re-derive `editingSection` → re-render drawer is fast (~1-2ms)
- The individual editors (hero-editor, etc.) are already stateless — they don't have this problem
- Typing latency will not be perceptible

### What About Display Settings?

Same treatment. `displaySettings` is currently local state initialized from `section` props. Make it derived:

```typescript
const displaySettings = {
  colorScheme: section.colorScheme,
  paddingY: section.paddingY,
  containerWidth: section.containerWidth,
  enableAnimations: section.enableAnimations,
  visible: section.visible,
  label: section.label,
}
```

---

## 6. Additional Fixes (found during audit)

### 6a. editingSnapshotPushedRef reset on undo

The `editingSnapshotPushedRef` prevents pushing multiple snapshots per editing session. But after undo, the user may continue editing — and the ref is still `true`, so no new snapshot is pushed for the next edit. This means the user can't undo the post-undo edit.

**Fix:** Reset `editingSnapshotPushedRef` after undo/redo:
```typescript
const handleUndo = useCallback(() => {
  const snapshot = history.undo(...)
  if (snapshot) {
    setSections(snapshot.sections)
    editingSnapshotPushedRef.current = false  // ← ADD THIS
    // ...
  }
}, [...])
```

### 6b. Key change for remount safety

Remove the `key={section.id}` on `SectionEditorInline`. Since the component is now controlled (no local state), it doesn't need key-based remounting. The `key` was a workaround for the stale state problem — with controlled components, it's unnecessary.

However, the `key` is still useful for forcing editor remount when switching between sections (different section ID). Keep it but don't rely on it for state sync.

---

## 7. Files Changed

| File | Change | Risk |
|------|--------|------|
| `layout/builder-right-drawer.tsx` | Remove local `content` + `displaySettings` state from `SectionEditorInline`. Derive from `section` prop. | **Medium** — core change, needs testing |
| `builder-shell.tsx` | Reset `editingSnapshotPushedRef` on undo/redo | **Low** — 2 lines |

**Only 2 files. No changes to:**
- `use-builder-history.ts` — the hook is sound
- Any editor components — they're already stateless
- `iframe-protocol.ts` or canvas files — they already work correctly
- Section components — no changes

---

## 8. Agent Team Composition

This is a focused, surgical change (2 files, ~50 lines). One agent handles the core refactor, one verifies comprehensively.

### Agent 1: "State Architect"
**Task:** Refactor `SectionEditorInline` to be fully controlled.
- Remove local `content` and `displaySettings` state
- Derive values from `section` prop
- Adjust `handleContentChange` and `handleDisplayChange` to call `onChange` directly
- Reset `editingSnapshotPushedRef` in undo/redo handlers
- Ensure display settings editor receives derived values

**Context needed:** `builder-right-drawer.tsx`, `builder-shell.tsx`, `section-editors/display-settings.tsx`

### Agent 2: "Verification Engineer"
**Task:** Verify undo/redo works correctly across all edit types after refactor.
- Content edits (text fields, toggles, arrays)
- Display settings (colorScheme, paddingY, containerWidth)
- Section reorder (drag-and-drop)
- Section add / delete
- Page title changes
- Verify: drawer updates instantly on Cmd+Z
- Verify: canvas updates on Cmd+Z (still works)
- Verify: save after undo sends correct data
- Verify: typing performance is not degraded (no perceptible lag)
- Verify: keyboard shortcuts still blocked in input fields

**Execution:** Agent 1 first, Agent 2 after merge.

---

## 9. What This Does NOT Change

| Item | Why excluded |
|------|-------------|
| `use-builder-history.ts` | The hook is architecturally sound — snapshot-based undo with 50-entry cap |
| Command pattern migration | Full snapshots work at our scale. Command pattern adds complexity for marginal gain. |
| Immer.js / JSON patches | Great for Webstudio's scale (real-time collab + plugins). Overkill for our use case. |
| Editor components | Already stateless — they receive `content` + `onChange` props |
| Canvas / iframe | Already works correctly via postMessage |

---

## 10. Future Considerations

If the builder grows in complexity (real-time collaboration, plugin system, much larger state), consider migrating to:

1. **Immer patches** for undo/redo (like Webstudio's Immerhin) — stores diffs instead of full snapshots
2. **Nanostores or Zustand** for shared state — both canvas and drawer subscribe to the same store
3. **Command pattern** for granular undo — "change heading" command vs. full snapshot

For now, the controlled component pattern with full snapshots is the right level of abstraction. It's simple, correct, and matches the builder's scale (1-3 admins editing monthly).
