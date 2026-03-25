# Pre-Launch Audit Checklist

**Date:** 2026-03-25
**Audited by:** 6 parallel agents covering permissions, website content, responsive design, CMS-website sync, roles/members, and UX/error handling.

---

## P0: Fix Before Meeting Today

### 1. SECURITY: Unprotected API write routes (no `requireApiAuth`)

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

- [x] Add `users.remove` to Admin role
- [x] Add `users.approve_requests` to Admin role
- [x] Add `roles.manage` to Admin role
- [x] Add `website.navigation.edit` to Admin role (fixes Quick Links bug)
- [ ] Update Admin role record in **database** to match code (seed won't auto-fix since `isSystem: false`)

### 3. QUICK LINKS BUG

**Root cause:** Quick links editor saves via menu item endpoints requiring `website.navigation.edit`. Admin only had `website.navigation.view`.

- [x] Add `website.navigation.edit` to Admin role in code
- [x] Fix error handling — parse API 403 response and show "Permission denied" toast
- [x] Fix error handling in delete catch block
- [x] Fix error handling in reorder catch block
- [ ] Update Admin role record in database

### 4. ROLES: Permission changes don't propagate immediately

- [ ] Add `sessionVersion` increment to `updateRole()` in `lib/dal/roles.ts:58-74`
- [ ] Add `sessionVersion` increment to `deleteRole()` in `lib/dal/roles.ts:77-92`
- [ ] Add `sessionVersion` increment to `reactivateUser()` in `lib/dal/users.ts:314-318`

### 5. SECURITY: DELETE user lacks hierarchy check

- [x] Add role level check to DELETE handler in `app/api/v1/users/[id]/route.ts:92-129` (match PATCH/deactivate/reactivate pattern)

---

## P1: Fix Before Launch

### 6. CMS Error Handling: Systemic problem

**The pattern:** API returns `{ code: "FORBIDDEN", message: "Insufficient permissions" }` but client catches show generic "Failed to [action]". Zero places check for HTTP 403.

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
- [ ] `media/page.tsx:346` — `json.error` is an object, should be `json.error?.message`

### 7. CMS Pages: Missing `RoleGuard` (accessible by direct URL)

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

- [ ] Fix `resolve-section-data.ts:322` — change `href: '/website/ministries/campus/${c.slug}'` to `href: '/ministries/campus/${c.slug}'`

### 9. WEBSITE: QUICK_LINKS section gets no meeting data

- [ ] Add `QUICK_LINKS` entry to `DEFAULT_DATA_SOURCES` in `resolve-section-data.ts`

### 10. WEBSITE: Ministries POST has no revalidation

- [ ] Add `revalidatePath('/website', 'layout')` to POST handler in `app/api/v1/ministries/route.ts:20-42`

### 11. RESPONSIVE: Daily Bread locks body scroll

- [ ] Fix `daily-bread-feature.tsx:297` — only lock scroll when full-screen reader/audio modal is open, not on mount

### 12. RESPONSIVE: Video play button invisible on touch

- [ ] Fix `video-card.tsx:51-52` — change to `opacity-100 lg:opacity-0 lg:group-hover:opacity-100`

### 13. ROLES: Dual role system partially integrated

- [ ] CMS users page only shows 4 legacy enum roles — add custom role assignment or document limitation
- [ ] `PATCH /api/v1/users/[id]` only updates legacy enum, never `roleId`
- [ ] Unify `ROLE_LEVEL` (hardcoded 0-3) vs `Role.priority` (0-1000) hierarchy checks
- [ ] Extract `ROLE_LEVEL` to `lib/permissions.ts` (currently duplicated in 5 files)

---

## P2: Fix Soon After Launch

### 14. Website content issues

- [ ] Replace placeholder team data ("Leader name" / "Bio here") in 4 ministry pages (`seed.mts:2172-2174, 2256-2258, 2355-2357, 2451-2453`)
- [ ] Verify 3 events with `location: "TBD"` are intentional (`seed.mts:391-393`)
- [ ] Confirm "Giving" page "COMING SOON" is intentional for launch (`seed.mts:3547-3559`)
- [ ] Generalize hardcoded LA UBF subheading regex (`hero-banner.tsx:631-648`)
- [ ] Address hardcoded R2 CDN URL for cross mask image (`statement.tsx:9-10`)
- [ ] Remove hardcoded test credentials fallbacks in seed (`seed.mts:3759-3760`)
- [ ] Fix error page to use website design system instead of CMS Button (`error.tsx:25-28`)
- [ ] Fix inconsistent `resolveHref` usage on error vs not-found pages (`error.tsx:27`)
- [ ] Clean up MeetTeam placeholder sentinel checks (`meet-team.tsx:38, 85`)

### 15. Responsive design issues

- [ ] Fix 540px sticky column overflow at lg breakpoint (`directory-list.tsx:186`)
- [ ] Add overflow protection for user HTML (`custom-html.tsx:24`)
- [ ] Fix 600px rotating wheel clipping on tablets (`media-text.tsx:120-123`)
- [ ] Replace `text-black-1` with theme token in statement section (`statement.tsx:72`)
- [ ] Add mobile alternative for hidden footer nav columns (`footer.tsx:78`)
- [ ] Add iOS safe area padding for audio player (`daily-bread-feature.tsx:137`)
- [ ] Fix invalid Tailwind class `duration-3000` (`recurring-meetings.tsx:66`)
- [ ] Replace fragile calc-based widths with CSS grid (`media-grid.tsx:92`, `pathway-card.tsx:69`)
- [ ] Fix 926px spotlight element horizontal scroll risk (`quote-banner.tsx:59`)
- [ ] Fix orbit images with fixed pixel sizes overflowing on mobile (`page-hero.tsx:87-111`)
- [ ] Add touch alternative for hover-only arrow button (`event-card.tsx:104`)
- [ ] Add touch alternatives for hover-only visual effects (`image-card.tsx:40`, `event-card.tsx:43`, `message-card.tsx:59`, `directory-list.tsx:237`)
- [ ] Replace `<a>` with Next.js `<Link>` for client-side navigation (`event-card.tsx:32`, `event-list-item.tsx:53`)
- [ ] Fix FAB overlap with daily bread audio player (`quick-links-fab.tsx:120-121`)
- [ ] Fix dropdown panel `w-max` exceeding viewport (`dropdown-menu.tsx:265-268`)

### 16. Data sync gaps

- [ ] Add dynamic people/staff data pipeline for MEET_TEAM sections (currently static JSON only)
- [ ] Render member images in MeetTeam section (`meet-team.tsx:60-68` — accepts but ignores `image`)
- [ ] Pass event `imagePosition` to list sections in `resolve-section-data.ts`
- [ ] Pass event `badge` field to highlight cards (`resolve-section-data.ts:113-125`)
- [ ] Pass event `shortDescription` to list/card views in `resolve-section-data.ts`
- [ ] Fix `revalidateTag('members')` — no cache tag consumer exists on website
- [ ] Implement route-level caching (Phase D-F — all pages currently dynamically rendered)

### 17. Code quality

- [ ] Extract `ROLE_LEVEL` constant to `lib/permissions.ts` (duplicated in 5 files)
- [ ] Add role selection during access request approval (`access-requests.ts:134` — always assigns VIEWER)
- [ ] Fix `media/page.tsx:346` — `json.error` is an object, use `json.error?.message`
- [ ] Fix role filter on users page to work with custom roles (`users/page.tsx:332`)
- [ ] Replace native `<select>` with shadcn Select in form-section (`form-section.tsx:245-256`)
- [ ] Remove `!important` padding overrides in highlight-cards (`highlight-cards.tsx:55`)

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

| # | Fix | Effort | Impact |
|---|---|---|---|
| 1 | ~~Add 4 missing permissions to Admin role in `lib/permissions.ts`~~ | ~~2 min~~ | ~~Done~~ |
| 2 | Update Admin role record in database to match | 2 min | Makes permission change take effect |
| 3 | Add `sessionVersion` bumps to `updateRole`, `deleteRole`, `reactivateUser` | 15 min | Ensures permission/role changes propagate immediately |
| 4 | Add `requireApiAuth()` to critical unprotected routes (church, people/import, series, campuses, ministries) | 30 min | Closes biggest security holes |
| 5 | Fix campus href — remove `/website/` prefix in `resolve-section-data.ts:322` | 1 min | Fixes broken campus links on website |
| 6 | Add hierarchy check to DELETE user endpoint | 5 min | Prevents Admin from removing other Admins/Owners |
| 7 | ~~Fix quick-links-editor error handling~~ | ~~20 min~~ | ~~Done~~ |
| 8 | Add `requireApiAuth()` to remaining unprotected routes | 45 min | Closes all security holes |
| 9 | Add toasts to 14 silent-failure operations | 30 min | Users get feedback on all actions |
| 10 | Add `RoleGuard` to 10 unprotected CMS pages | 30 min | Direct URL access shows proper "no permission" state |

---

## Rich Text Editor — Image Support (added 2026-03-25)

### P0: DOCX Image Import Broken
- [ ] Add `convertImage` handler to mammoth config in `lib/docx-import.ts` (line 253) — uploads extracted images to R2 staging, injects R2 URLs into HTML before TipTap parsing
- **Root cause:** mammoth.js converts embedded DOCX images to base64 `<img>` tags, but TipTap Image extension has `allowBase64: false` — images discarded during `generateJSON()`
- **Files:** `lib/docx-import.ts`, `lib/tiptap.ts` (line 772)
- **Test case:** "A Wise and Discerning Heart" study — has embedded image in Introduction section

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
- [ ] Run `npx tsx scripts/migrate-attachments-to-relation.mts` (dry-run first, then `--execute`)
- **What it does:** Audits Message.attachments JSON, backfills missing data to BibleStudyAttachment, clears the JSON column
- **After:** Remove `attachments Json? @db.JsonB` from Message model in a future Prisma migration

### P2: Backfill Content-Disposition on Existing R2 Files
- [ ] Write and run one-time script to copy-to-self all existing R2 objects with Content-Disposition header
- **Status:** Not started. New uploads get correct Content-Disposition during promotion. Existing R2 files don't have it.
