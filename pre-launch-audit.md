# Pre-Launch Audit Report

**Date:** 2026-03-25
**Audited by:** 6 parallel agents covering permissions, website content, responsive design, CMS-website sync, roles/members, and UX/error handling.

---

## Table of Contents

- [P0: Fix Before Meeting Today](#p0-fix-before-meeting-today)
  - [1. SECURITY: 30+ API write routes have zero authentication](#1-security-30-api-write-routes-have-zero-authentication)
  - [2. PERMISSIONS: Admin role missing 4 permissions](#2-permissions-admin-role-missing-4-permissions)
  - [3. QUICK LINKS BUG: Root cause confirmed](#3-quick-links-bug-root-cause-confirmed)
  - [4. ROLES: Permission changes don't propagate immediately](#4-roles-permission-changes-dont-propagate-immediately)
  - [5. SECURITY: DELETE user lacks hierarchy check](#5-security-delete-user-lacks-hierarchy-check)
- [P1: Fix Before Launch](#p1-fix-before-launch)
  - [6. CMS Error Handling: Systemic problem](#6-cms-error-handling-systemic-problem)
  - [7. CMS Pages: 10 pages accessible without permission gates](#7-cms-pages-10-pages-accessible-without-permission-gates)
  - [8. WEBSITE: Campus links have /website/ prefix](#8-website-campus-links-have-website-prefix)
  - [9. WEBSITE: QUICK_LINKS section gets no meeting data](#9-website-quick_links-section-gets-no-meeting-data)
  - [10. WEBSITE: Ministries POST has no revalidation](#10-website-ministries-post-has-no-revalidation)
  - [11. RESPONSIVE: Daily Bread locks body scroll](#11-responsive-daily-bread-locks-body-scroll)
  - [12. RESPONSIVE: Video play button invisible on touch](#12-responsive-video-play-button-invisible-on-touch)
  - [13. ROLES: Dual role system partially integrated](#13-roles-dual-role-system-partially-integrated)
- [P2: Fix Soon After Launch](#p2-fix-soon-after-launch)
  - [14. Website content issues](#14-website-content-issues)
  - [15. Responsive design issues](#15-responsive-design-issues)
  - [16. Data sync gaps](#16-data-sync-gaps)
  - [17. Code quality](#17-code-quality)
- [Full API Route Permission Table](#full-api-route-permission-table)
- [Recommended Fix Order](#recommended-fix-order)

---

## P0: Fix Before Meeting Today

### 1. SECURITY: 30+ API write routes have zero authentication

Anyone who can reach the API can create, edit, or delete data on these routes. No `requireApiAuth()` call at all.

| Route | Methods | Risk | Recommended Permission |
|---|---|---|---|
| `/api/v1/church` | PATCH | **CRITICAL** — Anyone can edit church profile | `church.profile.edit` |
| `/api/v1/people/import` | POST | **CRITICAL** — Anyone can bulk-import people | `people.create` |
| `/api/v1/series` | POST | **HIGH** — Anyone can create series | `messages.create` |
| `/api/v1/series/[id]` | PATCH, DELETE | **HIGH** — Anyone can edit/delete series | `messages.edit_all` / `messages.delete` |
| `/api/v1/campuses` | POST | **HIGH** — Anyone can create campuses | `campuses.manage` |
| `/api/v1/campuses/[slug]` | PATCH, DELETE | **HIGH** — Anyone can edit/delete campuses | `campuses.manage` |
| `/api/v1/ministries` | POST | **HIGH** — Anyone can create ministries | `ministries.manage` |
| `/api/v1/ministries/[slug]` | PATCH, DELETE | **HIGH** — Anyone can edit/delete ministries | `ministries.manage` |
| `/api/v1/pages` | POST | **HIGH** — Anyone can create pages | `website.pages.create` |
| `/api/v1/roles` (PersonRoleDef) | POST | **HIGH** — Anyone can create person role definitions | `people.edit` |
| `/api/v1/roles/[id]` | PUT, DELETE | **HIGH** — Anyone can edit/delete person role definitions | `people.edit` |
| `/api/v1/daily-bread` | POST | **HIGH** — Anyone can create daily bread entries | `messages.create` |
| `/api/v1/daily-bread/[date]` | PATCH | **HIGH** — Anyone can edit daily bread entries | `messages.edit_all` |
| `/api/v1/custom-fields` | POST | **HIGH** — Anyone can create custom fields | `people.edit` |
| `/api/v1/custom-fields/[id]` | PUT, DELETE | **HIGH** — Anyone can edit/delete custom fields | `people.edit` |
| `/api/v1/households` | POST | **HIGH** — Anyone can create households | `people.edit` |
| `/api/v1/households/[id]` | PUT, DELETE | **HIGH** — Anyone can edit/delete households | `people.edit` / `people.delete` |
| `/api/v1/households/[id]/members` | POST, DELETE | **HIGH** — Anyone can add/remove household members | `people.edit` |
| `/api/v1/people/by-role/[slug]` | POST | **HIGH** — Anyone can assign person roles + create people | `people.edit` |
| `/api/v1/people/[id]/roles` | POST, DELETE | **HIGH** — Anyone can assign/remove person roles | `people.edit` |
| `/api/v1/people/[id]/notes` | POST | **HIGH** — Anyone can create notes on people | `people.edit` |
| `/api/v1/people/[id]/notes/[noteId]` | PUT, DELETE | **HIGH** — Anyone can edit/delete notes | `people.edit` |
| `/api/v1/people/[id]/communication-preferences` | PUT | **HIGH** — Anyone can edit comm prefs | `people.edit` |
| `/api/v1/ai/cleanup-captions` | POST | **HIGH** — Anyone can call paid Azure AI | `messages.edit_own` |
| `/api/v1/convert-doc` | POST | **MEDIUM** — Resource consumption risk | `messages.edit_own` |

Additionally, these **read** endpoints expose potentially sensitive data without auth:

| Route | Concern |
|---|---|
| `GET /api/v1/people` | Full people list without auth |
| `GET /api/v1/people/[id]` | Person details without auth |
| `GET /api/v1/people/[id]/notes` | Private notes without auth |
| `GET /api/v1/people/[id]/communication-preferences` | Comm preferences without auth |
| `GET /api/v1/households` | Household data without auth |
| `GET /api/v1/households/[id]` | Household details without auth |
| `GET /api/v1/events/contact-frequency` | Contact data without auth |

**Fix:** Add `requireApiAuth('<permission>')` to the top of every write handler. For sensitive reads, add at minimum `requireApiAuth('people.view')`.

---

### 2. PERMISSIONS: Admin role missing 4 permissions

**File:** `lib/permissions.ts:174-195`

The Admin role is missing these non-website permissions:

| Missing Permission | Impact |
|---|---|
| `users.remove` | Admin can't remove team members |
| `users.approve_requests` | Admin can't approve/deny access requests |
| `roles.manage` | Admin can't create/edit custom roles |
| `website.navigation.edit` | Admin can't edit Quick Links (root cause of boss's bug) |

**Fix:** Add these 4 permissions to the `DEFAULT_ROLES.ADMIN.permissions` array. After changing the code, the actual role record in the database also needs to be updated (the seed won't auto-fix it since `isSystem: false`).

---

### 3. QUICK LINKS BUG: Root cause confirmed

**What happened:** Admin tried to edit quick links, got ambiguous error "Failed to update quick link."

**Root cause chain:**
1. Quick links editor (`components/cms/church-profile/quick-links-editor.tsx`) saves via menu item endpoints
2. Menu item endpoints (`app/api/v1/menus/[id]/items/route.ts:34`) require `website.navigation.edit`
3. Admin only has `website.navigation.view` — API returns 403 `"Insufficient permissions"`
4. Catch blocks in quick-links-editor (lines 329-334, 353-359, 383-387) discard the API error and show generic "Failed to update quick link"
5. No client-side permission check — Edit/Add/Delete buttons are always visible regardless of permissions

**Fix:**
1. Add `website.navigation.edit` to Admin role (quick links are church operations, not website design)
2. Use `handleApiError()` in catch blocks to show permission-specific messages
3. Hide edit buttons when user lacks the permission

---

### 4. ROLES: Permission changes don't propagate immediately

**Files affected:**

| Function | File | Issue |
|---|---|---|
| `updateRole()` | `lib/dal/roles.ts:58-74` | Doesn't bump `sessionVersion` — users keep stale permissions for up to 5 min |
| `deleteRole()` | `lib/dal/roles.ts:77-92` | Same issue — deleted role's users keep old permissions |
| `reactivateUser()` | `lib/dal/users.ts:314-318` | Reactivated users stay blocked for up to 5 min (JWT still shows INACTIVE) |

By contrast, `updateUserRole()`, `removeChurchUser()`, and `deactivateUser()` all correctly bump `sessionVersion`.

**Fix:** Add `sessionVersion` increment to all three functions:
```typescript
// Example for updateRole
export async function updateRole(churchId, roleId, data) {
  return prisma.$transaction([
    prisma.role.update({ where: { id: roleId, churchId }, data }),
    prisma.church.update({ where: { id: churchId }, data: { sessionVersion: { increment: 1 } } }),
  ])
}
```

---

### 5. SECURITY: DELETE user lacks hierarchy check

**File:** `app/api/v1/users/[id]/route.ts:92-129`

The DELETE handler checks `users.remove` permission and prevents self-removal and last-owner removal, but does **not** enforce that you cannot remove a user with a role at or above your own. The PATCH, deactivate, and reactivate handlers all have this check — DELETE doesn't.

An Admin with `users.remove` could remove another Admin or even an Owner (except the last one).

**Fix:** Add the same role level check that exists in the PATCH handler:
```typescript
if (actorLevel < ROLE_LEVEL.OWNER && targetLevel >= actorLevel) {
  return NextResponse.json(
    { success: false, error: { code: 'FORBIDDEN', message: 'Cannot remove a user with a role equal to or above your own.' } },
    { status: 403 }
  )
}
```

---

## P1: Fix Before Launch

### 6. CMS Error Handling: Systemic problem

**The pattern:** API routes return structured errors `{ code: "FORBIDDEN", message: "Insufficient permissions" }`, but client code everywhere does:
```typescript
catch (err) { toast.error("Failed to [action]") }  // API message thrown away
```

**Zero places** in the entire CMS check for HTTP 403 status.

**14 operations** silently fail (console.error only, no user-facing toast):

| File | Operations |
|---|---|
| `app/cms/(dashboard)/website/pages/[slug]/page.tsx` | Save page (179), toggle publish (208), add section (233), update section (254), delete section (273), toggle visibility (301), reorder sections (331) |
| `app/cms/(dashboard)/website/pages/page.tsx` | Fetch pages (122), delete page (142) |
| `app/cms/(dashboard)/website/navigation/page.tsx` | Fetch menus (161), delete menu item (214), save menu item (261), toggle visibility (279), reorder items (311) |

**Components with good error handling** (for reference):
- `people/users/page.tsx` — `toast.error(data.error?.message || "Failed to update role")`
- `people/campuses/page.tsx` — `toast.error(json.error?.message ?? "Failed to update campus")`
- `admin/roles/page.tsx` — `toast.error(result.error?.message || "Failed to delete role")`

**Fix:** Create a shared `handleApiError()` utility:
```typescript
// lib/api/handle-error.ts
async function handleApiError(res: Response, fallbackMessage: string) {
  const json = await res.json().catch(() => null)
  if (res.status === 403) {
    toast.error("Permission denied", {
      description: json?.error?.message || "You don't have permission. Please contact your admin or owner."
    })
  } else if (res.status === 401) {
    toast.error("Session expired", { description: "Please log in again." })
  } else {
    toast.error(fallbackMessage, {
      description: json?.error?.message || undefined
    })
  }
}
```

Also fix `media/page.tsx:346` — `json.error` is an object `{ code, message }`, not a string; should be `json.error?.message`.

---

### 7. CMS Pages: 10 pages accessible without permission gates

The sidebar correctly hides items when users lack permissions, but users can navigate directly to these URLs and see confusing "Failed to load" errors instead of "You don't have permission."

| Page | Should Require |
|---|---|
| `/cms/church-profile` | `church.profile.view` |
| `/cms/people/members` | `people.view` |
| `/cms/people/groups` | `groups.view` |
| `/cms/people/ministries` | `ministries.view` |
| `/cms/people/campuses` | `campuses.view` |
| `/cms/events` | `events.view` |
| `/cms/messages` | `messages.view` |
| `/cms/media` | `media.view` |
| `/cms/form-submissions` | `submissions.view` |
| `/cms/storage` | `storage.view` |

**Fix:** Add `RoleGuard` wrapper to each page.

---

### 8. WEBSITE: Campus links have /website/ prefix

**File:** `lib/website/resolve-section-data.ts:322`

The `all-campuses` dataSource generates:
```typescript
href: `/website/ministries/campus/${c.slug}`
```

The `/website` prefix is an internal routing prefix that should never appear in user-facing links. Components then call `resolveHref()` on this, which could double-prefix it.

**Fix:** Change to `href: \`/ministries/campus/${c.slug}\``

---

### 9. WEBSITE: QUICK_LINKS section gets no meeting data

**File:** `lib/website/resolve-section-data.ts`

The `QUICK_LINKS` section component expects a `meetings` prop containing recurring event data, but there is no `dataSource` entry for `QUICK_LINKS` in `resolve-section-data.ts` and no entry in `DEFAULT_DATA_SOURCES`. The component always receives `meetings = []`.

**Fix:** Add a `QUICK_LINKS` entry to `DEFAULT_DATA_SOURCES` pointing to a recurring-events data source.

---

### 10. WEBSITE: Ministries POST has no revalidation

**File:** `app/api/v1/ministries/route.ts:20-42`

Creating a new ministry via `POST /api/v1/ministries` does not call `revalidatePath`. PATCH and DELETE do. The website won't reflect new ministries until next full render.

**Fix:** Add `revalidatePath('/website', 'layout')` to the POST handler.

---

### 11. RESPONSIVE: Daily Bread locks body scroll

**File:** `components/website/sections/daily-bread-feature.tsx:297`

```typescript
document.body.style.overflow = "hidden"
```

This locks body scroll on mount and only restores on unmount. If the component is on a page with other sections below, users cannot scroll past it on mobile. The `100dvh` container prevents natural scrolling.

**Fix:** Only lock scroll when the full-screen reader/audio modal is open, not on mount.

---

### 12. RESPONSIVE: Video play button invisible on touch

**File:** `components/website/sections/video-card.tsx:51-52`

```typescript
className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
```

The play button overlay is invisible until hover. On touch devices there is no hover state, so users see no play indicator before tapping.

**Fix:** Show the play button by default on mobile: `opacity-100 lg:opacity-0 lg:group-hover:opacity-100`

---

### 13. ROLES: Dual role system partially integrated

**Problem:** The system has two role mechanisms:
1. **Legacy `MemberRole` enum** on `ChurchMember.role` (OWNER, ADMIN, EDITOR, VIEWER)
2. **Custom `Role` model** via `ChurchMember.roleId` with granular permissions

Issues:
- CMS users page (`components/cms/users/users-columns.tsx:70`) only shows the 4 legacy enum roles — can't assign custom roles
- `PATCH /api/v1/users/[id]` only updates the legacy enum, never `roleId`
- User management routes use hardcoded `ROLE_LEVEL` (0-3), role management uses `Role.priority` (0-1000) — inconsistent hierarchy checks
- `ROLE_LEVEL` constant duplicated across 5 files

**Fix:** Either add custom role assignment to the users page, or document that custom roles are only assignable during invite. Extract `ROLE_LEVEL` to `lib/permissions.ts`.

---

## P2: Fix Soon After Launch

### 14. Website content issues

| Issue | File | Severity |
|---|---|---|
| Placeholder team data ("Leader name" / "Bio here") in 4 ministry pages | `prisma/seed.mts:2172-2174, 2256-2258, 2355-2357, 2451-2453` | High |
| 3 events with `location: "TBD"` | `prisma/seed.mts:391-393` | Medium (verify if intentional) |
| "Giving" page shows "COMING SOON" | `prisma/seed.mts:3547-3559` | Medium (confirm for launch) |
| Hardcoded LA UBF subheading regex | `components/website/sections/hero-banner.tsx:631-648` | Medium |
| Hardcoded R2 CDN URL for cross mask image | `components/website/sections/statement.tsx:9-10` | Low |
| Test credentials hardcoded in seed as fallbacks | `prisma/seed.mts:3759-3760` | Medium |
| Error page uses CMS `Button` instead of website design system | `app/website/error.tsx:25-28` | Low |
| Inconsistent `resolveHref` usage on error vs not-found pages | `app/website/error.tsx:27` vs `app/website/not-found.tsx:28` | Low |
| MeetTeam placeholder sentinel checks in component logic | `components/website/sections/meet-team.tsx:38, 85` | Low |

---

### 15. Responsive design issues

| Issue | File | Severity |
|---|---|---|
| Fixed 540px sticky column overflows at lg breakpoint | `components/website/sections/directory-list.tsx:186` | Critical |
| User HTML has no overflow protection | `components/website/sections/custom-html.tsx:24` | Critical |
| 600px rotating wheel with negative positioning clips on tablets | `components/website/sections/media-text.tsx:120-123` | Critical |
| `text-black-1` instead of theme token (invisible in dark mode) | `components/website/sections/statement.tsx:72` | Medium |
| Footer nav columns hidden on mobile with no alternative | `components/website/sections/footer.tsx:78` | Medium |
| iOS safe area overlap on audio player | `components/website/sections/daily-bread-feature.tsx:137` | Medium |
| Invalid Tailwind class `duration-3000` | `components/website/sections/recurring-meetings.tsx:66` | Medium |
| Fragile calc-based widths instead of CSS grid | `components/website/sections/media-grid.tsx:92`, `pathway-card.tsx:69` | Medium |
| Fixed 926px spotlight element could cause horizontal scroll | `components/website/sections/quote-banner.tsx:59` | Medium |
| Orbit images with fixed pixel sizes overflow on mobile | `components/website/sections/page-hero.tsx:87-111` | Medium |
| Play button hidden on mobile (hover-only) | `components/website/shared/video-card.tsx:51-52` | Medium |
| Arrow button hidden on mobile (no click affordance) | `components/website/shared/event-card.tsx:104` | Low |
| Multiple hover-only visual effects with no touch alternatives | `image-card.tsx:40`, `event-card.tsx:43`, `message-card.tsx:59`, `directory-list.tsx:237` | Low |
| Event card uses `<a>` instead of Next.js `<Link>` (full page reload) | `components/website/shared/event-card.tsx:32`, `event-list-item.tsx:53` | Low |
| FAB position may overlap with daily bread audio player | `components/website/layout/quick-links-fab.tsx:120-121` | Low |
| Dropdown panel `w-max` could exceed viewport | `components/website/layout/dropdown-menu.tsx:265-268` | Low |

---

### 16. Data sync gaps

| Issue | File | Severity |
|---|---|---|
| People/Staff have no dynamic website pipeline (MEET_TEAM is static JSON only) | `resolve-section-data.ts` — no people dataSource | Medium |
| MeetTeam section accepts but never renders member images | `components/website/sections/meet-team.tsx:60-68` | Low |
| Event `imagePosition` not passed to list sections | `resolve-section-data.ts` — all event mappings | Low |
| Event `badge` field not passed to highlight cards | `resolve-section-data.ts:113-125` | Low |
| Event `shortDescription` not passed to list/card views | `resolve-section-data.ts` | Low |
| `revalidateTag('members')` has no cache tag consumer on the website | People API routes | Low |
| No route-level caching (all pages dynamically rendered every request) | All website pages | Info (Phase D-F) |

---

### 17. Code quality

| Issue | File | Severity |
|---|---|---|
| `ROLE_LEVEL` constant duplicated in 5 files | `users/[id]/route.ts`, `deactivate/route.ts`, `reactivate/route.ts`, `invite/route.ts`, `users-columns.tsx` | Low |
| Access request approval always assigns VIEWER (no role selection) | `lib/dal/access-requests.ts:134` | Low |
| `media/page.tsx:346` — `json.error` is an object, not a string | `app/cms/(dashboard)/media/page.tsx:346` | Low |
| Role filter on users page won't work with custom roles | `app/cms/(dashboard)/people/users/page.tsx:332` | Low |
| Native `<select>` in form-section instead of shadcn Select | `components/website/sections/form-section.tsx:245-256` | Low |
| `!important` padding overrides in highlight-cards | `components/website/sections/highlight-cards.tsx:55` | Low |

---

## Full API Route Permission Table

### Routes Admin IS correctly blocked from (intentional — website builder is WIP)

| Route | Permission Required | Status |
|---|---|---|
| `PATCH /api/v1/pages/[slug]` | `website.pages.edit` | Intentional |
| `DELETE /api/v1/pages/[slug]` | `website.pages.delete` | Intentional |
| `POST/PUT /api/v1/pages/[slug]/sections` | `website.pages.edit` | Intentional |
| `PATCH/DELETE /api/v1/pages/[slug]/sections/[id]` | `website.pages.edit` | Intentional |
| `GET /api/v1/pages/homepage-section` | `website.pages.edit` | Intentional |
| `PATCH /api/v1/site-settings` | `website.settings.edit` | Intentional |
| `PATCH /api/v1/site-settings/navbar` | `website.settings.edit` | Intentional |
| `PATCH /api/v1/theme` | `website.theme.edit` | Intentional |
| `POST /api/v1/domains` | `website.domains.manage` | Intentional |
| `DELETE /api/v1/domains/[id]` | `website.domains.manage` | Intentional |
| `GET/POST/DELETE /api/v1/builder/presence` | `website.pages.edit` | Intentional |

### Routes Admin IS incorrectly blocked from

| Route | Permission Required | Fix |
|---|---|---|
| `DELETE /api/v1/users/[id]` | `users.remove` | Add to Admin role |
| `GET /api/v1/access-requests` | `users.approve_requests` | Add to Admin role |
| `POST /api/v1/access-requests/[id]/approve` | `users.approve_requests` | Add to Admin role |
| `POST /api/v1/access-requests/[id]/deny` | `users.approve_requests` | Add to Admin role |
| `POST /api/v1/access-requests/[id]/ignore` | `users.approve_requests` | Add to Admin role |
| `POST /api/v1/access-requests/[id]/restore` | `users.approve_requests` | Add to Admin role |
| `POST /api/v1/member-roles` | `roles.manage` | Add to Admin role |
| `PATCH/DELETE /api/v1/member-roles/[id]` | `roles.manage` | Add to Admin role |
| Menu item endpoints (used by Quick Links) | `website.navigation.edit` | Add to Admin role |

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

If time is limited, prioritize in this order:

| # | Fix | Effort | Impact |
|---|---|---|---|
| 1 | Add 4 missing permissions to Admin role in `lib/permissions.ts` | 2 min | Unblocks Admin from quick links, access requests, role management, user removal |
| 2 | Update Admin role record in database to match | 2 min | Makes permission change take effect |
| 3 | Add `sessionVersion` bumps to `updateRole`, `deleteRole`, `reactivateUser` | 15 min | Ensures permission/role changes propagate immediately |
| 4 | Add `requireApiAuth()` to critical unprotected routes (church, people/import, series, campuses, ministries) | 30 min | Closes biggest security holes |
| 5 | Fix campus href — remove `/website/` prefix in `resolve-section-data.ts:322` | 1 min | Fixes broken campus links on website |
| 6 | Add hierarchy check to DELETE user endpoint | 5 min | Prevents Admin from removing other Admins/Owners |
| 7 | Create shared `handleApiError()` utility and apply to quick-links-editor | 20 min | Fixes the boss's UX issue with meaningful error messages |
| 8 | Add `requireApiAuth()` to remaining unprotected routes | 45 min | Closes all security holes |
| 9 | Add toasts to 14 silent-failure operations | 30 min | Users get feedback on all actions |
| 10 | Add `RoleGuard` to 10 unprotected CMS pages | 30 min | Direct URL access shows proper "no permission" state |

---

## Rich Text Editor — Image Support (added 2026-03-25)

### P0: DOCX Image Import Broken
- **Status:** Not working — all images silently dropped during import
- **Root cause:** mammoth.js converts embedded DOCX images to base64 `<img>` tags, but TipTap Image extension has `allowBase64: false` — images discarded during `generateJSON()`
- **Fix:** Add `convertImage` handler to mammoth config in `lib/docx-import.ts` (line 253) that uploads extracted images to R2 staging (same flow as ImagePasteHandler paste/drop), then injects R2 URLs into HTML before TipTap parsing
- **Files:** `lib/docx-import.ts`, `lib/tiptap.ts` (line 772)
- **Test case:** "A Wise and Discerning Heart" study — has embedded image in Introduction section

### P1: Image Display Options (Alignment, Float, Resize)
- **Status:** Not implemented
- **Current state:** TipTap Image node is block-only, full width, no alignment. Only `src`, `alt`, `title` attributes
- **What's needed:**
  - Width/height attributes on Image node (for resizing)
  - Alignment: left, center, right, full-width
  - Float support: left-float and right-float with text wrapping
  - Resize handles in the editor UI
  - CSS for floated images in website content render
  - Toolbar buttons or bubble menu for image alignment
- **Reference:** Original DOCX documents use left-floated images with text wrap (see "Wise and Discerning Heart" study Introduction section)
- **Files:** `lib/tiptap.ts` (Image.configure, lines 770-773), `components/ui/rich-text-editor.tsx`

### P2: Image Rendering on Website
- **Status:** Partial — images render but without alignment/float CSS
- **Fix:** Add content-area CSS for image alignment attributes so images render with correct layout on the public website
- **Files:** Website content CSS, study-detail-view.tsx, transcript-panel.tsx

## Attachment Data Cleanup (added 2026-03-25)

### P1: Run Message.attachments Migration
- **Status:** Script ready at `scripts/migrate-attachments-to-relation.mts`
- **Steps:** `npx tsx scripts/migrate-attachments-to-relation.mts` (dry-run), then `--execute`
- **What it does:** Audits Message.attachments JSON, backfills missing data to BibleStudyAttachment, clears the JSON column
- **After:** Remove `attachments Json? @db.JsonB` from Message model in a future Prisma migration

### P2: Backfill Content-Disposition on Existing R2 Files
- **Status:** Not started
- **What:** New uploads get correct Content-Disposition during promotion. Existing R2 files don't have it
- **Fix:** One-time script to copy-to-self all existing R2 objects with Content-Disposition header
