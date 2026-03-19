# Concurrent Editing Strategy

> **Date**: March 17, 2026
> **Status**: Decided — implementation planned for Phase 1
> **Summary**: Presence awareness + dirty section tracking + silent last-write-wins. No merge UI, no conflict modals, no locking.

---

## The Problem

The website builder uses a batch-save model: the user makes multiple changes across sections, then clicks Save. If two admins edit the same page simultaneously, whoever saves last can silently overwrite the other's work — because the current save flow sends ALL sections to the API, not just the ones that changed.

```
Page has: [S1, S2, S3, S4, S5]

User A loads page, edits S2
User B loads page, edits S4

User A saves → writes ALL sections: [S1, S2*, S3, S4, S5]
User B saves → writes ALL sections: [S1, S2, S3, S4*, S5]
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
- **Conflict probability**: Very low — but should be handled gracefully when it happens
- **User sophistication**: Church admins do not understand "merge conflicts"

The Shopify model (presence awareness + silent merge) is the sweet spot:
- Prevents most conflicts through social awareness
- Handles the rest silently without user intervention
- No complex merge UI that church admins would struggle with
- Low implementation cost (~6-8 hours total)

---

## The Solution: Three Layers

### Layer 1: Presence Awareness (Prevent the Problem)

When a user opens a page in the builder, they register their presence. Other users opening the same page see a banner:

```
┌───────────────────────────────────────────────────────────────┐
│  👤 David is editing this website                             │
│  Your changes may be lost if you edit the website now.        │
└───────────────────────────────────────────────────────────────┘
```

**The banner must be live** — when David saves and exits the builder, the banner disappears for other users. This is a heartbeat-based presence system:

**How it works:**
1. When a user opens the builder, they start sending a **heartbeat** to the server every 30 seconds (e.g., `POST /api/v1/builder/presence` with `{ pageId, userId }`)
2. The server stores this in a lightweight table or cache: `{ pageId, userId, userName, lastSeen }`
3. When another user opens the same page, they query presence: `GET /api/v1/builder/presence?pageId=xxx`
4. The response includes all active editors whose `lastSeen` is within the last 60 seconds
5. When User A closes the builder (or navigates away), heartbeats stop. After 60 seconds of no heartbeat, they're considered gone.
6. User B polls presence every 30 seconds (piggyback on the heartbeat call). When User A's presence expires, the banner disappears.

**Lifecycle:**
```
User A opens builder → starts heartbeat → presence recorded
User B opens builder → queries presence → sees banner "David is editing"
User A saves & closes → heartbeats stop
~60 seconds later → User A's presence expires
User B's next poll → no active editors → banner hidden
```

**Is this overkill?** No. It's a simple heartbeat pattern (~2-3 hours to implement). The alternative — not knowing if someone else is editing — leads to silent data loss. The heartbeat is a cheap insurance policy.

**UI states for the banner:**
- **Other editors present**: Show warning banner with their name(s)
- **No other editors**: Hide the banner entirely (don't show "You're the only editor" — that's noise)
- **Connection lost** (heartbeat fails): Silently retry. Don't alarm the user.

**Implementation options for storage:**
- **Database table** (`BuilderPresence`): Simple, works with existing Prisma setup. Rows auto-expire via `lastSeen` comparison. No new infrastructure.
- **In-memory store** (Map in API route): Fastest but lost on server restart. Acceptable for presence (non-critical data).
- **Redis**: Ideal for presence (TTL keys), but adds infrastructure dependency we don't need yet.

**Recommended**: Database table for now. It's 1 model, 2 API endpoints, and works reliably.

```prisma
model BuilderPresence {
  id        String   @id @default(uuid())
  pageId    String
  userId    String
  userName  String
  lastSeen  DateTime @updatedAt
  churchId  String

  @@unique([pageId, userId])
  @@index([pageId])
}
```

---

### Layer 2: Dirty Section Tracking + Selective Save (Eliminate Most Conflicts)

**The architectural change that makes concurrent editing safe by default.**

Instead of saving ALL sections on every save, track which sections the user actually modified and only save those.

```
User A loads page, edits S2 → dirtySet = { S2 }
User B loads page, edits S4 → dirtySet = { S4 }

User A saves → PATCHes only S2
User B saves → PATCHes only S4

Result: [S1, S2*, S3, S4*, S5] — both changes preserved, zero conflict
```

**This handles ~90% of concurrent editing scenarios automatically.** Two admins editing different sections on the same page just works — their saves don't interfere because they only write the sections they touched.

**Implementation in BuilderShell:**

```typescript
// New state
const [dirtySectionIds, setDirtySectionIds] = useState<Set<string>>(new Set())

// When a section is edited:
function handleSectionEditorChange(sectionId: string, data: Partial<SectionEditorData>) {
  setDirtySectionIds(prev => new Set(prev).add(sectionId))
  // ... existing section update logic
}

// On save — only PATCH dirty sections:
async function handleSave() {
  const dirtyIds = Array.from(dirtySectionIds)
  const dirtySections = sections.filter(s => dirtyIds.includes(s.id))

  // 1. PATCH page metadata (if title/publish changed)
  // 2. PUT reorder (if order changed — tracked by separate dirty flag)
  // 3. PATCH only dirty sections (not all N)
  await Promise.all(
    dirtySections.map(section =>
      fetch(`/api/v1/pages/${slug}/sections/${section.id}`, { method: 'PATCH', ... })
    )
  )

  setDirtySectionIds(new Set()) // clear after save
}
```

**What triggers dirty:**
- Content edit → add section ID to dirty set
- Display settings change → add section ID to dirty set
- Section added → new section is auto-dirty (needs initial save)
- Section deleted → DELETE call happens immediately (no dirty tracking needed)
- Section reorder → separate `reorderDirty` boolean flag (reorder is a page-level operation)

**This is also a performance win**: a page with 15 sections where the user edited 2 goes from 17 HTTP requests (1 page + 1 reorder + 15 sections) down to 4 (1 page + 1 reorder + 2 sections).

---

### Layer 3: Silent Last-Write-Wins for True Conflicts

For the rare case where both users edit the **same section** (e.g., both edit the Hero Banner heading), the system uses **silent last-write-wins**. Whoever saves last, their version of that section is what persists.

**No conflict UI. No diff view. No merge dialog.**

Why this is acceptable:
1. **The user was warned** — Layer 1's presence banner told them someone else was editing
2. **They chose to proceed** — editing despite the warning is an implicit acceptance of the risk
3. **These are design changes** — heading text, padding settings, image URLs. Not financial data, not medical records. The "losing" user can re-edit in 30 seconds.
4. **After save, the user sees fresh state** — `router.refresh()` reloads from DB, so they immediately see the current truth. If their heading was overwritten, they'll notice and can re-edit.
5. **Conflict modals are worse UX than data loss** — a church admin shown a modal with "Your version: 'Welcome Home' / Their version: 'Join Us' / [Keep mine] [Use theirs] [View diff]" will be confused and anxious. Just letting the last save win is less stressful.

**Post-save freshness**: After every save, `router.refresh()` triggers a server component re-render with fresh DB data. This means:
- Sections the user didn't edit are updated to their latest DB state (picks up other users' changes)
- Sections the user edited show their saved version
- The state is always consistent with the DB after save

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User A adds a new section, User B saves | No conflict — new section has a new ID that User B never touched |
| User A deletes S3, User B edits S3 | User B's PATCH returns 404. Show toast: "A section you edited was deleted by another user." Remove it from local state. |
| User A reorders, User B reorders | Reorder is a page-level PUT (section ID array). Last-write-wins on order. Both users see the final order after `router.refresh()`. |
| Both users edit page title | Last-write-wins on page metadata PATCH. |
| User A edits S2, User B edits S2 display settings | Same section ID → last-write-wins. Even though they edited "different things" (content vs display), the PATCH sends both. Acceptable tradeoff vs field-level merge complexity. |
| User B's presence heartbeat fails (network issue) | Presence expires after 60s. If User B comes back, heartbeat resumes and presence reappears. No data loss — just a brief gap in presence display. |
| Three users editing simultaneously | Banner shows all names: "David and Sarah are editing this website." Same logic, just multiple presence records. |

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

## Implementation Plan

| Component | Effort | Phase |
|-----------|--------|-------|
| **Dirty section tracking** (`Set<string>` in BuilderShell) | 1-2h | Phase 1, Day 1 |
| **Selective save** (only PATCH dirty sections) | 1-2h | Phase 1, Day 1 |
| **Presence API** (heartbeat endpoint + DB model) | 2-3h | Phase 1, Day 1 or Day 4 |
| **Presence banner UI** (topbar or canvas banner) | 1h | With presence API |
| **Post-save fresh reload** | Already done | `router.refresh()` exists |
| **Total** | ~6-8h | |

The dirty tracking + selective save should happen first (Day 1) because they're also a performance optimization (R4 from `builder-system-architecture.md`). Presence can follow on Day 4 or early Phase 2.

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-17 | Chose Shopify-style presence + silent merge over Webflow-style locking | Locking blocks legitimate parallel work; presence is socially effective without being restrictive |
| 2026-03-17 | Rejected per-section conflict modals | Church admins don't understand merge; JSONB content isn't meaningfully diffable; multiple conflict dialogs in a single save is terrible UX |
| 2026-03-17 | Chose dirty section tracking over page-level optimistic locking | Dirty tracking eliminates ~90% of conflicts structurally (non-overlapping edits auto-merge); page-level locking would still require conflict resolution for the same cases |
| 2026-03-17 | Chose DB table for presence over Redis | No new infrastructure; presence data is non-critical and can tolerate slight staleness; heartbeat + polling every 30s is sufficient |
