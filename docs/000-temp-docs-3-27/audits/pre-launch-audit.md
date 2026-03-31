# Pre-Launch Audit Checklist

**Date:** 2026-03-25 | **Verified:** 2026-03-27 (automated codebase audit)
**Audited by:** 6 parallel agents covering permissions, website content, responsive design, CMS-website sync, roles/members, and UX/error handling.

> **Verification Summary (2026-03-27):** 147 items checked against actual codebase.
> **Done: 10** | **Not Done: 137** | Biggest gap: 41 unprotected API write routes (P0).
> Note: Edge middleware (`proxy.ts`) blocks unauthenticated access to `/api/v1/*` and `/cms/*`,
> so these routes are only accessible to logged-in users — but any authenticated user (even Viewer)
> can hit unprotected write endpoints.

---

## P0: Fix Before Meeting Today

### 1. SECURITY: Unprotected API write routes (no `requireApiAuth`)

> **Verified 2026-03-27:** All 41 write routes below confirmed unprotected. None have `requireApiAuth` calls.

- [ ] `PATCH /api/v1/church` — Anyone can edit church profile → add `church.profile.edit`
- [ ] `POST /api/v1/people/import` — Anyone can bulk-import people → add `people.create`
- [ ] `POST /api/v1/series` — add `messages.create`
- [ ] `PATCH /api/v1/series/[id]` — add `messages.edit_all`
- [ ] `DELETE /api/v1/series/[id]` — add `messages.delete`
- [ ] `POST /api/v1/campuses` — add `campuses.manage`
- [ ] `PATCH /api/v1/campuses/[slug]` — add `campuses.manage`
- [ ] `DELETE /api/v1/campuses/[slug]` — add `campuses.manage`
- [ ] `POST /api/v1/ministries` — add `ministries.manage`
- [ ] `PATCH /api/v1/ministries/[slug]` — add `ministries.manage`
- [ ] `DELETE /api/v1/ministries/[slug]` — add `ministries.manage`
- [ ] `POST /api/v1/pages` — add `website.pages.create`
- [ ] `POST /api/v1/roles` (PersonRoleDef) — add `people.edit`
- [ ] `PUT /api/v1/roles/[id]` — add `people.edit`
- [ ] `DELETE /api/v1/roles/[id]` — add `people.edit`
- [ ] `POST /api/v1/daily-bread` — add `messages.create`
- [ ] `PATCH /api/v1/daily-bread/[date]` — add `messages.edit_all`
- [ ] `POST /api/v1/custom-fields` — add `people.edit`
- [ ] `PUT /api/v1/custom-fields/[id]` — add `people.edit`
- [ ] `DELETE /api/v1/custom-fields/[id]` — add `people.edit`
- [ ] `POST /api/v1/households` — add `people.edit`
- [ ] `PUT /api/v1/households/[id]` — add `people.edit`
- [ ] `DELETE /api/v1/households/[id]` — add `people.delete`
- [ ] `POST /api/v1/households/[id]/members` — add `people.edit`
- [ ] `DELETE /api/v1/households/[id]/members` — add `people.edit`
- [ ] `POST /api/v1/people/by-role/[slug]` — add `people.edit`
- [ ] `POST /api/v1/people/[id]/roles` — add `people.edit`
- [ ] `DELETE /api/v1/people/[id]/roles` — add `people.edit`
- [ ] `POST /api/v1/people/[id]/notes` — add `people.edit`
- [ ] `PUT /api/v1/people/[id]/notes/[noteId]` — add `people.edit`
- [ ] `DELETE /api/v1/people/[id]/notes/[noteId]` — add `people.edit`
- [ ] `PUT /api/v1/people/[id]/communication-preferences` — add `people.edit`
- [ ] `POST /api/v1/ai/cleanup-captions` — add `messages.edit_own`
- [ ] `POST /api/v1/convert-doc` — add `messages.edit_own`

Sensitive **read** endpoints also exposed without auth:
- [ ] `GET /api/v1/people` — add `people.view`
- [ ] `GET /api/v1/people/[id]` — add `people.view`
- [ ] `GET /api/v1/people/[id]/notes` — add `people.view`
- [ ] `GET /api/v1/people/[id]/communication-preferences` — add `people.view`
- [ ] `GET /api/v1/households` — add `people.view`
- [ ] `GET /api/v1/households/[id]` — add `people.view`
- [ ] `GET /api/v1/events/contact-frequency` — add `events.view`

### 2. PERMISSIONS: Admin role missing permissions

**File:** `lib/permissions.ts:174-195`

- [x] Add `users.remove` to Admin role — **Verified 2026-03-27:** confirmed at `lib/permissions.ts:192`
- [x] Add `users.approve_requests` to Admin role — **Verified:** confirmed at `lib/permissions.ts:193`
- [x] Add `roles.manage` to Admin role — **Verified:** confirmed at `lib/permissions.ts:194`
- [x] Add `website.navigation.edit` to Admin role — **Verified:** confirmed at `lib/permissions.ts:188`
- [ ] Update Admin role record in **database** to match code — **Verified 2026-03-27:** seed uses `upsert` but unclear if seed was re-run after permission code changes. DB record may be stale.

### 3. QUICK LINKS BUG

**Root cause:** Quick links editor saves via menu item endpoints requiring `website.navigation.edit`. Admin only had `website.navigation.view`.

- [x] Add `website.navigation.edit` to Admin role in code — **Verified 2026-03-27**
- [x] Fix error handling — parse API 403 response and show "Permission denied" toast — **Verified:** `quick-links-editor.tsx:298,341`
- [x] Fix error handling in delete catch block — **Verified:** `quick-links-editor.tsx:366,378`
- [x] Fix error handling in reorder catch block — **Verified:** `quick-links-editor.tsx:414,421`
- [ ] Update Admin role record in database — **Not verified as applied**

### 4. ROLES: Permission changes don't propagate immediately

> **Verified 2026-03-27:** All 3 items confirmed NOT DONE.

- [ ] Add `sessionVersion` increment to `updateRole()` in `lib/dal/roles.ts:58-74` — simple `prisma.role.update` with no sessionVersion bump
- [ ] Add `sessionVersion` increment to `deleteRole()` in `lib/dal/roles.ts:77-92` — no sessionVersion bump
- [ ] Add `sessionVersion` increment to `reactivateUser()` in `lib/dal/users.ts:314-318` — no bump (compare: `deactivateUser` at line 298 DOES have the bump)

### 5. SECURITY: DELETE user lacks hierarchy check

- [x] Add role level check to DELETE handler — **Verified 2026-03-27:** hierarchy check at `app/api/v1/users/[id]/route.ts:117-124`, checks `actorLevel < ROLE_LEVEL.OWNER && targetLevel >= actorLevel`, plus last-owner protection at lines 127-135.

---

## P1: Fix Before Launch

### 6. CMS Error Handling: Systemic problem

**The pattern:** API returns `{ code: "FORBIDDEN", message: "Insufficient permissions" }` but client catches show generic "Failed to [action]". Zero places check for HTTP 403.

> **Verified 2026-03-27:** All items confirmed NOT DONE.

Create shared utility:
- [ ] Create `handleApiError()` in `lib/api/handle-error.ts` (403 → "Permission denied, contact admin/owner"; 401 → "Session expired"; else → fallback + API message)

14 operations silently fail (console.error only, no toast):
- [ ] `website/pages/[slug]/page.tsx:179` — Save page
- [ ] `website/pages/[slug]/page.tsx:208` — Toggle publish
- [ ] `website/pages/[slug]/page.tsx:233` — Add section
- [ ] `website/pages/[slug]/page.tsx:254` — Update section
- [ ] `website/pages/[slug]/page.tsx:273` — Delete section
- [ ] `website/pages/[slug]/page.tsx:301` — Toggle visibility
- [ ] `website/pages/[slug]/page.tsx:331` — Reorder sections
- [ ] `website/pages/page.tsx:122` — Fetch pages list
- [ ] `website/pages/page.tsx:142` — Delete page
- [ ] `website/navigation/page.tsx:161` — Fetch menus
- [ ] `website/navigation/page.tsx:214` — Delete menu item
- [ ] `website/navigation/page.tsx:261` — Save menu item
- [ ] `website/navigation/page.tsx:279` — Toggle visibility
- [ ] `website/navigation/page.tsx:311` — Reorder items

Other error handling fixes:
- [ ] `media/page.tsx:346` — `json.error` is an object (`{code, message}`), displays as `[object Object]`. Should be `json.error?.message`. Same issue at line 395. (Lines 411, 484, 503, 527 correctly use `json.error?.message`.)

### 7. CMS Pages: Missing `RoleGuard` (accessible by direct URL)

> **Verified 2026-03-27:** All 10 pages confirmed missing `RoleGuard`. Only `people/users`, `website/settings`, `website/domains`, and `admin/roles` pages have it.

- [ ] `/cms/church-profile` → `church.profile.view`
- [ ] `/cms/people/members` → `people.view`
- [ ] `/cms/people/groups` → `groups.view`
- [ ] `/cms/people/ministries` → `ministries.view`
- [ ] `/cms/people/campuses` → `campuses.view`
- [ ] `/cms/events` → `events.view`
- [ ] `/cms/messages` → `messages.view`
- [ ] `/cms/media` → `media.view`
- [ ] `/cms/form-submissions` → `submissions.view`
- [ ] `/cms/storage` → `storage.view`

### 8. WEBSITE: Campus links have `/website/` prefix

- [x] Fix `resolve-section-data.ts:322` — **Verified 2026-03-27:** Now reads `href: '/ministries/campus/${c.slug}'` (no `/website/` prefix). Fixed in earlier commit.

### 9. WEBSITE: QUICK_LINKS section gets no meeting data

> **Verified 2026-03-27:** NOT DONE. `QUICK_LINKS` is not in `DEFAULT_DATA_SOURCES` map at `resolve-section-data.ts:21-33`.

- [ ] Add `QUICK_LINKS` entry to `DEFAULT_DATA_SOURCES` in `resolve-section-data.ts`

### 10. WEBSITE: Ministries POST has no revalidation

> **Verified 2026-03-27:** NOT DONE. POST handler at `app/api/v1/ministries/route.ts:20-42` has no `revalidatePath` call. (PATCH and DELETE DO have it.)

- [ ] Add `revalidatePath('/website', 'layout')` to POST handler in `app/api/v1/ministries/route.ts:20-42`

### 11. RESPONSIVE: Daily Bread locks body scroll

> **Verified 2026-03-27:** NOT DONE. `daily-bread-feature.tsx:298-306` locks body scroll unconditionally via `document.body.style.overflow = "hidden"` whenever `entry` is truthy (on mount), not only when a full-screen modal is open.

- [ ] Fix `daily-bread-feature.tsx:297` — only lock scroll when full-screen reader/audio modal is open, not on mount

### 12. RESPONSIVE: Video play button invisible on touch

> **Verified 2026-03-27:** NOT DONE. `video-card.tsx:51` still uses `opacity-0 group-hover:opacity-100` with no touch/mobile visibility.

- [ ] Fix `video-card.tsx:51-52` — change to `opacity-100 lg:opacity-0 lg:group-hover:opacity-100`

### 13. ROLES: Dual role system partially integrated

> **Verified 2026-03-27:** All 4 items confirmed NOT DONE.

- [ ] CMS users page uses 4 legacy enum roles for filtering — `users/page.tsx:332-340` maps custom roles but sets filter value to `r.slug.toUpperCase()` while filtering by `u.role` (legacy enum). Custom roles won't match.
- [ ] `PATCH /api/v1/users/[id]` only updates legacy `role` enum, never `roleId`
- [ ] Unify `ROLE_LEVEL` (hardcoded 0-3) vs `Role.priority` (0-1000) hierarchy checks
- [ ] Extract `ROLE_LEVEL` to `lib/permissions.ts` (currently duplicated in 5 files: `users/[id]/route.ts`, `users/invite/route.ts`, `users/[id]/reactivate/route.ts`, `users/[id]/deactivate/route.ts`, `users-columns.tsx`)

### 14. HERO BANNER: Dead fields and missing poster rendering

> **Verified 2026-03-27:** All 4 items confirmed NOT DONE.

**Background:** The hero banner content JSON has legacy/dead fields from the original seed format. The editor has a "Poster / Fallback Image" picker that saves to `posterImage` but the renderer never uses it.

- [ ] Wire up `posterImage.src` as the `poster` attribute on `<video>` in `HeroVideo` component (`hero-banner.tsx:683-746`) — no `poster` attribute currently rendered
- [ ] Evaluate removing `backgroundImage` from video-mode hero sections — currently a legacy sync field that caused a 6-hour debug session (see `docs/00_dev-notes/hero-video-investigation.md`)
- [ ] If keeping `backgroundImage`, use it as the poster/fallback image instead of a separate `posterImage` field (consolidate)
- [ ] Clean up any remaining hero sections in DB where `backgroundImage.src` still contains a `.mp4`/`.webm` URL (legacy format — video should only be in `backgroundVideo`)

**Context:** The legacy seed stored the desktop video URL in `backgroundImage.src` instead of `backgroundVideo.src`. This caused a chain of 4 bugs where the editor displayed a fallback value that was never persisted on save, and the renderer skipped `mobileSrc` entirely. Fixed 2026-03-25 but `backgroundImage` remains as dead weight in video-mode sections.

---

## P2: Fix Soon After Launch

### 14. Website content issues

> **Verified 2026-03-27:** All items confirmed NOT DONE.

- [ ] Replace placeholder team data ("Leader name" / "Bio here") in 4 ministry pages — still at `seed.mts:2174-2176, 2258-2260, 2357-2359, 2453-2455`
- [ ] Verify 3 events with `location: "TBD"` are intentional — still at `seed.mts:391-393`
- [ ] Confirm "Giving" page "COMING SOON" is intentional for launch — still at `seed.mts:3549`
- [ ] Generalize hardcoded LA UBF subheading regex — still at `hero-banner.tsx:631-648`
- [ ] Address hardcoded R2 CDN URL for cross mask image — still at `statement.tsx:9-10`
- [x] Remove hardcoded test credentials fallbacks in seed — fallbacks removed, env vars now required
- [ ] Fix error page to use website design system instead of CMS Button — `error.tsx:4,25-28`
- [ ] Fix inconsistent `resolveHref` usage on error vs not-found pages — `error.tsx:27` uses `<a href="/">` while `not-found.tsx` uses `resolveHref('/')`
- [ ] Clean up MeetTeam placeholder sentinel checks — `meet-team.tsx:38,85` still has `"Leader name"` and `"Bio here"` sentinel checks

### 15. Responsive design issues

> **Verified 2026-03-27:** All items confirmed NOT DONE.

- [ ] Fix 540px sticky column overflow at lg breakpoint — `directory-list.tsx:186` has `w-[540px]` fixed width
- [ ] Add overflow protection for user HTML — `custom-html.tsx:24` has no `overflow-hidden`
- [ ] Fix 600px rotating wheel clipping on tablets — `media-text.tsx:120` has `w-[600px]` fixed width
- [ ] Replace `text-black-1` with theme token in statement section — `statement.tsx:72`
- [ ] Add mobile alternative for hidden footer nav columns — `website-footer.tsx:116` uses `hidden sm:flex`, no mobile alternative
- [ ] Add iOS safe area padding for audio player — no `safe-area` references in `daily-bread-feature.tsx`
- [ ] Fix invalid Tailwind class `duration-3000` — `recurring-meetings.tsx:66` (valid max is `duration-1000`; needs custom config)
- [ ] Replace fragile calc-based widths with CSS grid — `media-grid.tsx:92`, `pathway-card.tsx:69`
- [ ] Fix 926px spotlight element horizontal scroll risk — `quote-banner.tsx:59` has `w-[926px]`
- [ ] Fix orbit images with fixed pixel sizes overflowing on mobile — `page-hero.tsx:87-111`
- [ ] Add touch alternative for hover-only arrow button — `event-card.tsx:104` has `hidden lg:block`
- [ ] Add touch alternatives for hover-only visual effects — `image-card.tsx:41`, `event-card.tsx:43,68`, `message-card.tsx:59,71,74,87`, `directory-list.tsx:123,237,240`
- [ ] Replace `<a>` with Next.js `<Link>` for client-side navigation — `event-card.tsx:30`, `event-list-item.tsx:53`
- [ ] Fix FAB overlap with daily bread audio player — `quick-links-fab.tsx:143` positions at `bottom-6 right-4`
- [ ] Fix dropdown panel `w-max` exceeding viewport — `dropdown-menu.tsx:269`

### 16. Data sync gaps

> **Verified 2026-03-27:** All items confirmed NOT DONE.

- [ ] Add dynamic people/staff data pipeline for MEET_TEAM sections (currently static JSON only)
- [ ] Render member images in MeetTeam section — `meet-team.tsx:60-70` always shows placeholder SVG, never uses `member.image`
- [ ] Pass event `imagePosition` to list sections in `resolve-section-data.ts` — not passed
- [ ] Pass event `badge` field to highlight cards in `resolve-section-data.ts` — not passed
- [ ] Pass event `shortDescription` to list/card views in `resolve-section-data.ts` — not passed
- [ ] Fix `revalidateTag('members')` — called in 3 API routes but no cache consumer on website routes
- [ ] Implement route-level caching (Phase D-F — all pages currently dynamically rendered)

### 17. Code quality

> **Verified 2026-03-27:** All items confirmed NOT DONE.

- [ ] Extract `ROLE_LEVEL` constant to `lib/permissions.ts` (duplicated in 5 files)
- [ ] Add role selection during access request approval — `access-requests.ts:134` always assigns VIEWER
- [ ] Fix `media/page.tsx:346` — `json.error` is an object, use `json.error?.message`
- [ ] Fix role filter on users page to work with custom roles — `users/page.tsx:268,332` filters by legacy enum
- [ ] Replace native `<select>` with shadcn Select in form-section — `form-section.tsx:245`
- [ ] Remove `!important` padding overrides in highlight-cards — still at `highlight-cards.tsx:54` (`!pt-24 lg:!pt-25 lg:!pb-10`)

---

## Full API Permission Reference

### Routes Admin IS correctly blocked from (intentional — website builder WIP)

- `PATCH /api/v1/pages/[slug]` → `website.pages.edit`
- `DELETE /api/v1/pages/[slug]` → `website.pages.delete`
- `POST/PUT /api/v1/pages/[slug]/sections` → `website.pages.edit`
- `PATCH/DELETE /api/v1/pages/[slug]/sections/[id]` → `website.pages.edit`
- `GET /api/v1/pages/homepage-section` → `website.pages.edit`
- `PATCH /api/v1/site-settings` → `website.settings.edit`
- `PATCH /api/v1/site-settings/navbar` → `website.settings.edit`
- `PATCH /api/v1/theme` → `website.theme.edit`
- `POST /api/v1/domains` → `website.domains.manage`
- `DELETE /api/v1/domains/[id]` → `website.domains.manage`
- `GET/POST/DELETE /api/v1/builder/presence` → `website.pages.edit`

### What works well

- `sessionVersion` JWT refresh pattern (when used correctly)
- Privilege escalation prevention in role CRUD
- System role protection (Owner/Viewer can't be deleted or modified)
- Self-modification guards (can't change own role, deactivate self, remove self)
- Last-owner protection (can't demote or remove last owner)
- 5-minute fallback permission refresh
- 30-second check for no-church users on `/cms/no-access`
- Membership deletion detection (JWT callback clears church context)

---

## Recommended Fix Order

| # | Fix | Effort | Impact | Status |
|---|---|---|---|---|
| 1 | ~~Add 4 missing permissions to Admin role in code~~ | ~~2 min~~ | ~~Done~~ | **DONE** |
| 2 | Update Admin role record in database to match | 2 min | Makes permission change take effect | NOT DONE |
| 3 | Add `sessionVersion` bumps to `updateRole`, `deleteRole`, `reactivateUser` | 15 min | Ensures permission/role changes propagate immediately | NOT DONE |
| 4 | Add `requireApiAuth()` to critical unprotected routes (church, people/import, series, campuses, ministries) | 30 min | Closes biggest security holes | NOT DONE |
| 5 | ~~Fix campus href — remove `/website/` prefix~~ | ~~1 min~~ | ~~Done~~ | **DONE** |
| 6 | ~~Add hierarchy check to DELETE user endpoint~~ | ~~5 min~~ | ~~Done~~ | **DONE** |
| 7 | ~~Fix quick-links-editor error handling~~ | ~~20 min~~ | ~~Done~~ | **DONE** |
| 8 | Add `requireApiAuth()` to remaining unprotected routes | 45 min | Closes all security holes | NOT DONE |
| 9 | Add toasts to 14 silent-failure operations | 30 min | Users get feedback on all actions | NOT DONE |
| 10 | Add `RoleGuard` to 10 unprotected CMS pages | 30 min | Direct URL access shows proper "no permission" state | NOT DONE |

---

## Videos CMS — Missing Feature (added 2026-03-25)

### P1: Videos Management Page

> **Verified 2026-03-27:** No `/cms/videos` page exists. DAL and API routes exist but no CMS UI.

The CMS has no dedicated page to manage videos. The current state:
- Videos are visible on the website (`/website/videos`) and render correctly
- The CMS media library handles images/files but not video content entries
- There is no way to create, edit, delete, or archive a Video record from the CMS
- Video records exist in the DB (from seed/migration) but can only be managed via direct DB access

What's needed:
- [ ] Create `/cms/videos` page (or integrate into existing `/cms/messages` as a tab) with CRUD for Video records
- [ ] List view showing all videos with title, thumbnail, YouTube URL, publish status, date
- [ ] Create/edit form: title, slug, description, YouTube video ID, thumbnail, speaker, series, publish status, date
- [ ] Delete/archive functionality
- [ ] Bulk actions (publish, unpublish, delete)
- [ ] Add sidebar navigation item for Videos under Contents

**Files involved:**
- `lib/dal/videos.ts` — DAL already exists with full CRUD
- `app/api/v1/videos/route.ts` — API routes already exist (GET, POST)
- `app/api/v1/videos/[slug]/route.ts` — API routes already exist (GET, PATCH, DELETE)
- Missing: CMS page, form component, table/list component

---

## Rich Text Editor — Image Support (added 2026-03-25)

### P0: DOCX Image Import Broken

> **Verified 2026-03-27:** NOT DONE. `lib/docx-import.ts:253-264` has no `convertImage` option. `lib/tiptap.ts:772` has `allowBase64: false`.

- [ ] Add `convertImage` handler to mammoth config in `lib/docx-import.ts` (line 253) — uploads extracted images to R2 staging, injects R2 URLs into HTML before TipTap parsing
- **Root cause:** mammoth.js converts embedded DOCX images to base64 `<img>` tags, but TipTap Image extension has `allowBase64: false` — images discarded during `generateJSON()`
- **Files:** `lib/docx-import.ts`, `lib/tiptap.ts` (line 772)
- **Test case:** "A Wise and Discerning Heart" study — has embedded image in Introduction section
- **CMS link:** `/cms/messages/d136bf80-94d0-4167-ac82-c73ee6ea4b90?tab=study`

### P1: Image Display Options (Alignment, Float, Resize)
- [ ] Add width/height attributes on Image node (for resizing)
- [ ] Add alignment: left, center, right, full-width
- [ ] Add float support: left-float and right-float with text wrapping
- [ ] Add resize handles in the editor UI
- [ ] Add CSS for floated images in website content render
- [ ] Add toolbar buttons or bubble menu for image alignment
- **Reference:** Original DOCX documents use left-floated images with text wrap (see "Wise and Discerning Heart" study Introduction section)
- **Files:** `lib/tiptap.ts` (Image.configure, lines 770-773), `components/ui/rich-text-editor.tsx`

### P2: Image Rendering on Website
- [ ] Add content-area CSS for image alignment attributes so images render with correct layout on the public website
- **Files:** Website content CSS, study-detail-view.tsx, transcript-panel.tsx

## Attachment Data Cleanup (added 2026-03-25)

### P1: Run Message.attachments Migration

> **Verified 2026-03-27:** NOT DONE. Script exists but has not been executed.

- [ ] Run `npx tsx scripts/migrate-attachments-to-relation.mts` (dry-run first, then `--execute`)
- **What it does:** Audits Message.attachments JSON, backfills missing data to BibleStudyAttachment, clears the JSON column
- **After:** Remove `attachments Json? @db.JsonB` from Message model in a future Prisma migration

### P2: Backfill Content-Disposition on Existing R2 Files

> **Verified 2026-03-27:** DONE. Script `scripts/backfill-content-disposition.mts` was created and executed (commit `32653dd`, 2026-03-26). Uses `CopyObject` for zero-transfer metadata updates.

- [x] Write and run one-time script to copy-to-self all existing R2 objects with Content-Disposition header — **DONE** (commit `32653dd`)
