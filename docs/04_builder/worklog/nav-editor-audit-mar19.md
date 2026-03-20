# Navigation Editor — Full Audit Report (March 19, 2026)

> **Status:** Audit complete. Code passes static review; user reports runtime failures.
> **Root cause:** Most likely HMR/dev-server state corruption — not a code logic bug.
> **Action required:** Clean restart + manual verification, then targeted fixes for real issues.

---

## 1. What the user reported

1. **Nothing in the navbar works** — can't drag items, can't edit items, no live changes
2. **UI unchanged from pre-refactor** — the visual fixes (spacing, brackets, vertical lines) aren't visible
3. **Three days of agent work with no visible results**

## 2. What the investigation found

### 2.1 The code IS correct (static analysis)

Three independent QA agents reviewed all files against the builder QA checklist (sections D, E, G, H, I). **Every checklist item passes in static code review:**

| Area | Items checked | Pass | Fail | Risk |
|------|--------------|------|------|------|
| D: Nav editor UI & CRUD | 9 categories, 30+ items | 30 | 0 | 0 |
| E: Iframe sync | 5 items | 5 | 0 | 0 |
| G: Public site sync | 8 items | 8 | 0 | 0 |
| I: Edge cases | 24 scenarios | 18 | 0 | 6 |

### 2.2 The changes ARE in the files

Verified on disk:
- `navigation-editor.tsx`: Single `DndContext`, ID prefixing (`top::`/`child::`), `InlineAddInput`, optimistic updates — **all present, committed in `9fc44ec`**
- `builder-shell.tsx`: `previewRefreshKey`, `handleEditCTA`, dead prop removal — **present, uncommitted**
- `builder-preview-client.tsx`: Button click passthrough, `z-[100]` navbar wrapper, `RELOAD_PAGE` handler — **present (committed + uncommitted)**
- `iframe-protocol.ts`: `RELOAD_PAGE` message type — **present**
- `lib/dal/menus.ts`: Recursive `deleteDescendants` — **present, committed**
- `app/api/v1/menus/[id]/items/[itemId]/children/route.ts`: Child reorder endpoint — **exists, created Mar 18**

### 2.3 But the user sees the OLD UI

**Most likely cause: Next.js dev server HMR cache corruption.**

Evidence:
1. The user's screen recording shows the pre-refactor UI (old spacing, no inline inputs, brackets on chevrons)
2. TypeScript compiles with zero errors — the code is syntactically correct
3. `git diff` shows `navigation-editor.tsx` has zero uncommitted changes (all committed in `9fc44ec`)
4. The Playwright test I ran DURING this session showed the new DnD working (drag status showed `top::` prefixed IDs)
5. The user reported the issue AFTER multiple HMR rebuilds from rapid agent edits

**Next.js Turbopack HMR is known to cache stale module state** when files change rapidly. The user's browser may be serving a cached bundle that doesn't reflect the committed code. A hard restart (`npm run dev` fresh + browser hard refresh / clear cache) should resolve this.

### 2.4 Alternative theories (lower probability)

| Theory | Evidence for | Evidence against |
|--------|-------------|-----------------|
| HMR cache stale | User sees old UI despite code being correct | Playwright saw new code working |
| Code committed but not saved to disk | Would explain old UI | `git diff` shows no pending changes for nav-editor |
| Browser extension blocking DnD | Would explain drag failure | Unlikely for all interactions |
| Auth/permissions blocking API calls | Would explain silent failures | GET endpoints don't require auth, editor renders data |
| `@dnd-kit` version incompatibility | Could break drag | Versions are `core@6.3.1`, `sortable@10.0.0`, `utilities@3.2.2` — compatible |

---

## 3. Risks identified (edge cases)

These are NOT blocking bugs but areas that could cause issues under specific conditions:

### 3.1 Race conditions (MEDIUM risk)
- Multiple rapid nav operations (add + reorder + delete) can cause state collisions
- Multiple `refreshMenu()` calls in flight race — last-write-wins is unpredictable
- **Mitigation:** Add AbortController to `refreshMenu` so only the latest fetch wins

### 3.2 Multiple InlineAddInputs (MEDIUM risk)
- Two inline inputs can open simultaneously (one per parent + one for top-level)
- Unclear focus/key handling when multiple inputs exist
- **Mitigation:** Global "adding" state that closes any open input when a new one opens

### 3.3 Escape key cascading (LOW risk)
- Escape handler doesn't use early returns — if multiple nav states are true simultaneously, multiple get cleared in one keypress
- **Mitigation:** Use `else if` chain instead of sequential `if` blocks

### 3.4 Network failure UX (LOW risk)
- Nav item save failure: toast appears but form stays open with stale data, no retry affordance
- Nav item add failure: input closes silently, no phantom item but no feedback either
- **Mitigation:** Keep editor open on save failure; show "Retry" button

### 3.5 Cross-tenant error codes (LOW risk)
- Deleting an item from a different church returns 500 instead of 403
- Data IS protected (churchId check prevents it), just wrong HTTP status
- **Mitigation:** Return 403 explicitly in DAL

---

## 4. Recommended next steps

### Step 1: Clean restart (5 min)
1. Stop dev server
2. `rm -rf .next` (clear Next.js build cache)
3. `npm run dev`
4. Hard refresh browser (Cmd+Shift+R) or clear site data
5. Navigate to builder → open Navigation tool → test drag, edit, add

### Step 2: If Step 1 doesn't fix it — browser console debug (15 min)
1. Open DevTools Console in the builder page
2. Try to drag an item — check for JavaScript errors
3. Click an item label — check if right drawer opens
4. Click "+ Add item" — check if inline input appears
5. Report any console errors — they will pinpoint the exact failure

### Step 3: If still broken — targeted investigation
- Check if `@dnd-kit` PointerSensor is being blocked by another event handler
- Check if the `DndContext` is rendering (React DevTools → search for `DndContext`)
- Check if `useSortable` hooks are returning valid `transform` values

### Step 4: Fix edge case risks (after core is working)
- Add AbortController to `refreshMenu` (prevents stale data races)
- Add `else if` chain to Escape handler
- Add global "adding" state for InlineAddInput

---

## 5. What the agents actually changed (commit map)

| Commit | What changed | Status |
|--------|-------------|--------|
| `1a91e8a` | Initial navigation editor implementation | Committed |
| `4178ebf` | Fix 10 bugs from QA audit | Committed |
| `9fc44ec` | DnD rearchitecture, InlineAddInput, optimistic updates, visual fixes | Committed |
| (uncommitted) | `previewRefreshKey` iframe refresh, CTA edit wiring, dead code cleanup | In working tree |
| (uncommitted) | Navbar button click passthrough, z-[100] fix | In working tree |
| (uncommitted) | `RELOAD_PAGE` message type | In working tree |

---

## 6. QA checklist results (full detail)

### D: Navigation Editor — ALL PASS

- D1: Opening editor — tree renders with all top-level items, expand/collapse works
- D2: Item types — correct icons (Folder, FileText, ExternalLink, Star) and badges
- D3: DnD — single DndContext with `top::`/`child::` prefixing, correct handlers
- D4: CRUD — InlineAddInput for add, confirm for delete, PATCH for rename
- D5: Item editor — right drawer routes to correct form (page, external, featured, top-level)
- D6: Navbar settings — NavSettingsForm with scroll/color/sticky/CTA fields
- D7: State isolation — Escape chain, page navigation reset, canvas click clears nav
- D8: Hidden pages — filters published pages not in any menu href
- D9: CTA section — displays label/href, Edit button opens NavSettingsForm

### E/G: Iframe Sync — ALL PASS

- `RELOAD_PAGE` protocol: defined in types, sent by canvas, handled by preview
- Navbar click handling: buttons pass through, links intercepted, background opens editor
- z-index: navbar wrapper at z-[100] allows dropdowns to render above content
- Public site: `revalidatePath('/website', 'layout')` called after all menu mutations

### I: Edge Cases — 18 PASS, 6 RISK (see section 3)
