# Undo/Redo & Save Architecture

> How the website builder handles state changes, undo/redo history, and persistence.

---

## High-Level Summary

**Undo/redo is 100% client-side, in-memory React state. No Redis, no database versioning, no browser storage (localStorage/IndexedDB). Saving is a manual or auto-triggered HTTP POST to the PostgreSQL database via API routes.**

The system has two completely separate concerns:

| Concern | Where it lives | Technology |
|---|---|---|
| **Undo/redo history** | Browser memory (React `useState`) | `useBuilderHistory` hook |
| **Persistent storage** | PostgreSQL via Prisma | REST API (`/api/v1/pages/...`) |

They connect through the **Save** action: when the user clicks Save (or auto-save fires), the current in-memory state is written to the database. The undo/redo stack is never persisted — it lives only for the duration of the page session.

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

## Step-by-Step: How It Works

### 1. Page load

When the builder opens, the server component (`app/cms/website/builder/page.tsx`) fetches the page and its sections from the database. This becomes the initial React state:

```
sections = page.sections   // from DB
pageData = page            // from DB
history = { past: [], future: [] }   // empty
isDirty = false
```

### 2. User makes an edit

Every mutation (add section, delete section, reorder, edit content, change title) follows the same pattern:

```
1. pushSnapshot()          // clone current state → push onto `past[]`
2. setSections(newState)   // update local React state
3. setIsDirty(true)        // mark as needing save
```

The `pushSnapshot()` call stores a deep clone (`structuredClone`) of `{ sections, pageTitle }` onto the `past` stack.

### 3. Undo (Ctrl+Z or button)

```
1. Pop last entry from `past[]`
2. Push current state onto `future[]` (so redo works)
3. Restore the popped snapshot → setSections(), setPageData()
4. Mark isDirty = true
```

### 4. Redo (Ctrl+Shift+Z or button)

```
1. Pop last entry from `future[]`
2. Push current state onto `past[]`
3. Restore the popped snapshot
4. Mark isDirty = true
```

### 5. New edit after undo (fork)

When the user undoes, then makes a new edit, `future[]` is **cleared** — the "forked" timeline is discarded. This is standard undo/redo behavior (same as text editors, Photoshop, etc.).

### 6. Save (manual or auto)

Triggered by:
- **Ctrl+S / Save button** — immediate
- **Auto-save** — 30 seconds after the last change (debounced)

The save process:

```
1. PATCH /api/v1/pages/[slug]                → save page title, isPublished
2. PUT   /api/v1/pages/[slug]/sections       → reorder (send section ID array)
3. PATCH /api/v1/pages/[slug]/sections/[id]  → save each section's content,
                                                colorScheme, paddingY, etc.
   (all sections saved in parallel via Promise.all)
4. Set isDirty = false
5. router.refresh() to revalidate server data
```

The undo/redo stack is **not cleared** on save. The user can still undo after saving.

### 7. Page navigation (switching pages in builder)

```
1. If isDirty → show "Unsaved changes" confirmation dialog
2. On confirm → discard changes, navigate
3. On new page load → history.reset() clears both past[] and future[]
```

### 8. Tab close / browser navigation

The `beforeunload` event fires a browser-native "Are you sure?" dialog if `isDirty === true`.

---

## Key Design Decisions

### Why in-memory React state (not localStorage/IndexedDB)?

- **Simplicity.** The builder operates on a single page at a time. State size is small (section metadata + content JSON, typically < 100KB for 50 snapshots).
- **No stale data.** localStorage would require cache invalidation logic for when the DB changes from another tab or user.
- **Acceptable trade-off.** If the tab crashes, the user loses unsaved changes — but auto-save at 30s limits the blast radius.

### Why not Redis?

Redis would be needed if:
- Multiple users could edit the same page simultaneously (collaborative editing)
- The undo history needed to survive across sessions or devices
- The snapshot stack was too large for browser memory

**None of these apply today.** The CMS is single-user-per-page. There is no collaborative editing. The 50-snapshot cap keeps memory bounded. Redis would add infrastructure complexity for no current benefit.

### Why not database versioning (page_versions table)?

Database versioning (storing each save as a version row) is a different feature — **revision history** ("restore to last Tuesday"), not undo/redo. These are complementary:

| Feature | Granularity | Storage | Use case |
|---|---|---|---|
| Undo/redo | Every keystroke/action | In-memory | "Oops, undo that" |
| Revision history | Each save | Database | "Restore last week's version" |

The current system only has undo/redo. Revision history could be added later as a separate concern.

---

## Scalability Analysis

### What scales fine as-is

| Aspect | Why it's fine |
|---|---|
| Single user editing one page | 50 snapshots * ~2KB each ≈ 100KB memory |
| Auto-save at 30s | One API call per 30s is negligible load |
| Multiple pages in sidebar | Only the active page has an undo stack |
| Keyboard shortcuts | Event listeners are lightweight |

### When you'd need to evolve

| Scenario | Solution | Needs Redis? |
|---|---|---|
| **Collaborative editing** (2+ users on same page) | Operational transforms (OT) or CRDTs | Yes, or a WebSocket server |
| **Revision history** ("restore to v3") | `PageVersion` table, store snapshots on each save | No, just PostgreSQL |
| **Offline editing** | Service worker + IndexedDB for pending changes | No |
| **Very large pages** (500+ sections) | Diff-based history instead of full snapshots | No |
| **Cross-device resume** ("continue on phone") | Persist draft state to DB or Redis | Possibly |

**Bottom line: Redis is not needed for the current or near-term product scope.** The first scalability upgrade would likely be a `PageVersion` table for revision history — which is pure PostgreSQL, no Redis required.

---

## Code Reference

| File | Role |
|---|---|
| `components/cms/website/builder/use-builder-history.ts` | Generic undo/redo hook (50 snapshot cap, `structuredClone`) |
| `components/cms/website/builder/builder-shell.tsx:84-110` | Undo/redo integration (snapshot push, restore, keyboard shortcuts) |
| `components/cms/website/builder/builder-shell.tsx:162-222` | Save logic (PATCH page + PUT reorder + PATCH each section) |
| `components/cms/website/builder/builder-shell.tsx:232-252` | Auto-save timer (30s debounce) |
| `components/cms/website/builder/builder-shell.tsx:255-292` | Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+S, Escape) |
| `components/cms/website/builder/builder-topbar.tsx:130-166` | Undo/redo buttons in the UI |

---

## Snapshot Shape

```typescript
interface BuilderSnapshot {
  sections: BuilderSection[]  // full section array (id, type, content, display settings)
  pageTitle: string           // page title at that point in time
}
```

Each snapshot is a **full clone** of the state, not a diff. This is simple and fast for the current scale (typical page has 5–15 sections). If pages grow to hundreds of sections, switching to a diff/patch model (e.g., `immer` patches) would reduce memory usage.
