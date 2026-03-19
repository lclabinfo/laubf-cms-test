# Concurrent Editing Strategy

> **Date**: March 17, 2026
> **Status**: IMPLEMENTED (all 3 layers complete as of March 19, 2026)
> **Summary**: Presence awareness + dirty section tracking + silent last-write-wins. No merge UI, no conflict modals, no locking.

---

## The Problem

The website builder uses a batch-save model: the user makes multiple changes across sections, then clicks Save. If two admins edit the same page simultaneously, whoever saves last can silently overwrite the other's work -- because the current save flow sends ALL sections to the API, not just the ones that changed.

```
Page has: [S1, S2, S3, S4, S5]

User A loads page, edits S2
User B loads page, edits S4

User A saves -> writes ALL sections: [S1, S2*, S3, S4, S5]
User B saves -> writes ALL sections: [S1, S2, S3, S4*, S5]
                                          ^^
                            User A's S2 change is silently lost
```

---

## How Other Builders Handle This

| Product | Approach | Tradeoff |
|---------|----------|----------|
| **Squarespace** | Last-write-wins, no warning | Simple but data loss possible |
| **Shopify theme editor** | Presence banner: "Another staff member is viewing this" + last-write-wins | Socially prevents most conflicts |
| **Webflow** | Page-level lock: "Being edited by Sarah" (read-only for others) | Safe but blocks legitimate parallel work |
| **WordPress Gutenberg** | Post-level lock with takeover option | Safe but heavy-handed |
| **Framer / Figma** | Real-time CRDT collaboration with live cursors | Perfect UX but extreme engineering cost |

### Why We Chose the Shopify Model

Our product context:
- **Target user**: Small church with 1-3 admins
- **Builder usage**: Infrequent (monthly design changes)
- **Conflict probability**: Very low -- but should be handled gracefully when it happens
- **User sophistication**: Church admins do not understand "merge conflicts"

The Shopify model (presence awareness + silent merge) is the sweet spot:
- Prevents most conflicts through social awareness
- Handles the rest silently without user intervention
- No complex merge UI that church admins would struggle with
- Low implementation cost (~6-8 hours total)

---

## The Solution: Three Layers

### Layer 1: Presence Awareness (Prevent the Problem) -- IMPLEMENTED 2026-03-18

When a user opens a page in the builder, they register their presence. Other users opening the same page see a banner:

```
+-----------------------------------------------------------------+
|  ! David is also editing this page -- your changes may           |
|    overwrite theirs if you save now.                             |
+-----------------------------------------------------------------+
```

**How it works:**
1. When a user opens the builder, they start sending a **heartbeat** to the server every 30 seconds (`POST /api/v1/builder/presence` with `{ pageId }`)
2. The server stores this in `BuilderPresence` table: `{ pageId, userId, userName, lastSeen, churchId }`
3. Each heartbeat response includes other active editors (piggybacked on the POST response)
4. The response includes all active editors whose `lastSeen` is within the last 60 seconds
5. When User A closes the builder, a `DELETE` cleanup request is sent with `keepalive: true`
6. If the DELETE fails (e.g., tab killed), heartbeats stop and after 60 seconds, presence auto-expires via stale record cleanup

**Lifecycle:**
```
User A opens builder -> starts heartbeat -> presence recorded
User B opens builder -> heartbeat response shows A -> banner appears
User A closes builder -> DELETE sent (cleanup) -> heartbeats stop
User B's next heartbeat -> no other editors -> banner hidden
```

**UI states for the banner:**
- **Other editors present**: Amber warning banner below topbar with editor name(s)
- **No other editors**: Banner hidden entirely
- **Connection lost** (heartbeat fails): Silently retry next interval

**Tab visibility optimization:** Heartbeats pause when the tab is hidden and resume immediately when visible again.

---

### Layer 2: Dirty Section Tracking + Selective Save (Eliminate Most Conflicts) -- IMPLEMENTED 2026-03-18

**The architectural change that makes concurrent editing safe by default.**

Instead of saving ALL sections on every save, track which sections the user actually modified and only save those.

```
User A loads page, edits S2 -> dirtySet = { S2 }
User B loads page, edits S4 -> dirtySet = { S4 }

User A saves -> PATCHes only S2
User B saves -> PATCHes only S4

Result: [S1, S2*, S3, S4*, S5] -- both changes preserved, zero conflict
```

**This handles ~90% of concurrent editing scenarios automatically.** Two admins editing different sections on the same page just works -- their saves don't interfere because they only write the sections they touched.

**What triggers dirty:**
- Content edit -> add section ID to dirty set
- Display settings change -> add section ID to dirty set
- Section added -> reorder dirty (section itself is created immediately via POST)
- Section deleted -> DELETE call happens immediately; section removed from dirty set
- Section reorder -> separate `reorderDirty` boolean flag
- Page title change -> separate `pageDirty` boolean flag

**Performance win**: a page with 15 sections where the user edited 2 goes from 17 HTTP requests (1 page + 1 reorder + 15 sections) down to 4 (1 page + 1 reorder + 2 sections).

See `docs/04_builder/dev-notes/dirty-tracking.md` for full dirty tracking documentation.

---

### Layer 3: Silent Last-Write-Wins for True Conflicts -- IMPLEMENTED 2026-03-18

For the rare case where both users edit the **same section** (e.g., both edit the Hero Banner heading), the system uses **silent last-write-wins**. Whoever saves last, their version of that section is what persists.

**No conflict UI. No diff view. No merge dialog.**

Why this is acceptable:
1. **The user was warned** -- Layer 1's presence banner told them someone else was editing
2. **They chose to proceed** -- editing despite the warning is an implicit acceptance of the risk
3. **These are design changes** -- heading text, padding settings, image URLs. Not financial data, not medical records. The "losing" user can re-edit in 30 seconds.
4. **After save, the user sees fresh state** -- post-save refetch reloads from DB, so they immediately see the current truth. If their heading was overwritten, they'll notice and can re-edit.
5. **Conflict modals are worse UX than data loss** -- a church admin shown a modal with "Your version: 'Welcome Home' / Their version: 'Join Us' / [Keep mine] [Use theirs] [View diff]" will be confused and anxious. Just letting the last save win is less stressful.

**Post-save freshness**: After every save, the builder does a silent background refetch of the full page. The merge logic:
- Sections the user just saved -> keep local version (authoritative)
- All other sections -> use server version (picks up other users' changes)
- Page title -> use server version unless user just saved it
- Pristine ref and undo history are reset to match the new server state

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User A adds a new section, User B saves | No conflict -- new section has a new ID that User B never touched. Reorder DAL appends unknown sections. |
| User A deletes S3, User B edits S3 | User B's PATCH returns 404. Toast warns "section was deleted by another user." Section removed from local state. |
| User A reorders, User B reorders | Reorder DAL reconciles: keeps valid client IDs, appends DB-only sections. Last-write-wins on ordering. |
| Both users edit page title | Last-write-wins on page metadata PATCH. |
| User A edits S2, User B edits S2 display settings | Same section ID -> last-write-wins. PATCH sends all fields. |
| Presence heartbeat fails (network issue) | Presence expires after 60s. Heartbeat resumes when network returns. |
| Three users editing simultaneously | Banner shows all names. Same logic, just multiple presence records. |
| Simultaneous saves + refetch | Post-save refetch has merge logic to preserve just-saved sections. Background sync pauses for 5s after save to avoid racing. |

---

## What We Explicitly Do NOT Build

| Feature | Why Not |
|---------|---------|
| **Per-section conflict modals** | Church admins don't understand merge. Showing 3 conflict dialogs after editing 8 sections is terrible UX. |
| **Diff view on JSONB content** | JSONB contains nested objects, image URLs, arrays of cards. A text diff is meaningless to the user. |
| **Page-level locking** | Blocks legitimate parallel work. Two admins should be able to edit different sections on the same page. |
| **Real-time collaboration (live cursors, CRDTs)** | Extreme engineering cost (WebSockets, operational transforms) for a product used by 1-3 admins monthly. Not justified. |
| **Field-level merge** | Would require per-field dirty tracking within each section's JSONB content. Massive complexity for minimal benefit. Section-level granularity is sufficient. |
| **Optimistic locking with reload/force-save dialogs** | "Reload" loses the user's work. "Force save" overwrites the other user's work. Both are destructive. Silent section-level merge is better. |

---

## Implementation Notes

### What was built vs. what was planned

The implementation closely follows the original plan with a few additions:

1. **Presence API** (`app/api/v1/builder/presence/route.ts`): POST (heartbeat + upsert + stale cleanup + return other editors), GET (query-only), DELETE (explicit cleanup on unmount). Uses a Prisma transaction for atomicity.

2. **Presence hook** (`use-presence-heartbeat.ts`): 30s heartbeat interval. Pauses when tab is hidden, resumes on visibility change. Sends DELETE with `keepalive: true` on cleanup. Other editors list is piggybacked on the POST response (no separate GET needed during normal operation).

3. **Background sync** (`use-background-sync.ts`): 15s polling interval to pick up other users' changes when the current user is idle (!isDirty && !isSaving). Pauses for 5s after a save completes (avoids racing with post-save refetch). Uses content hashing to avoid unnecessary re-renders. Pauses when tab is hidden.

4. **Post-save merge logic** (in `handleSave`): After saving, refetches the full page and merges: keeps local versions for just-saved sections, uses server versions for everything else. This picks up other users' changes without overwriting what was just saved.

5. **Reorder DAL reconciliation** (`reorderPageSections` in `lib/dal/pages.ts`): Server-side reconciliation that handles stale client data. Filters out deleted section IDs, appends sections the client didn't know about.

6. **404 handling for deleted sections**: PATCH API returns 404 (via Prisma P2025) when a section was deleted by another user. Client detects 404, removes the section from local state, and shows a warning toast. DELETE API treats double-delete as idempotent success.

### Key files

| File | Role |
|------|------|
| `components/cms/website/builder/builder-shell.tsx` | Save handler, dirty tracking, post-save merge, presence banner |
| `components/cms/website/builder/use-background-sync.ts` | Background polling for idle users |
| `components/cms/website/builder/use-presence-heartbeat.ts` | Presence heartbeat + cleanup |
| `app/api/v1/builder/presence/route.ts` | Presence API (POST/GET/DELETE) |
| `lib/dal/pages.ts` | `reorderPageSections` with stale-client reconciliation |
| `app/api/v1/pages/[slug]/sections/[id]/route.ts` | Section PATCH (404 for deleted) + DELETE (idempotent) |

---

## QA Checklist

These scenarios should be tested end-to-end with two browser sessions on the same page.

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 1 | **Happy path: different sections** | A edits S2, B edits S4, both save | Both S2 and S4 changes preserved in DB | Untested |
| 2 | **Same section conflict** | A edits S2 heading, B edits S2 heading, both save | Last saver wins. First saver sees overwrite after background sync or page reload. | Untested |
| 3 | **Add + edit** | A adds S6, B edits S2, B saves | S6 persists (created via POST). B's save only touches S2. B's post-save refetch picks up S6. | Untested |
| 4 | **Delete + edit** | A deletes S3, B edits S3, B saves | B's PATCH for S3 returns 404. Toast: "section was deleted by another user." S3 removed from B's local state. Other sections save normally. | Untested |
| 5 | **Simultaneous saves** | A and B both click Save within 1-2 seconds | Both saves complete. Post-save refetch picks up the other's changes. No data loss for non-overlapping edits. | Untested |
| 6 | **Tab close** | A opens builder, closes tab | A's presence DELETE fires (keepalive). Within 60s, A's presence expires. B's next heartbeat shows no other editors. | Untested |
| 7 | **Network interruption** | Disconnect network for 90s, reconnect | Heartbeats fail silently. Presence expires for others. On reconnect, heartbeat resumes, presence reappears, background sync picks up changes. | Untested |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-17 | Chose Shopify-style presence + silent merge over Webflow-style locking | Locking blocks legitimate parallel work; presence is socially effective without being restrictive |
| 2026-03-17 | Rejected per-section conflict modals | Church admins don't understand merge; JSONB content isn't meaningfully diffable; multiple conflict dialogs in a single save is terrible UX |
| 2026-03-17 | Chose dirty section tracking over page-level optimistic locking | Dirty tracking eliminates ~90% of conflicts structurally (non-overlapping edits auto-merge); page-level locking would still require conflict resolution for the same cases |
| 2026-03-17 | Chose DB table for presence over Redis | No new infrastructure; presence data is non-critical and can tolerate slight staleness; heartbeat + polling every 30s is sufficient |
| 2026-03-18 | All 3 layers implemented | Dirty tracking, presence heartbeat, background sync, post-save merge, reorder reconciliation |
| 2026-03-19 | Added 404 handling for delete+edit conflict | PATCH API returns 404 for deleted sections; client removes them from local state with warning toast |
