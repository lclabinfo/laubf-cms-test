# Permissions Audit

**Date:** 2026-03-25
**Source of truth:** `lib/permissions.ts`

---

## All 49 Permissions in the System

### Content (12)
| Permission | Description | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|---|
| `messages.view` | View messages & bible studies | Y | Y | Y | Y |
| `messages.create` | Create messages & bible studies | Y | Y | Y | - |
| `messages.edit_own` | Edit own messages & bible studies | Y | Y | Y | - |
| `messages.edit_all` | Edit all messages & bible studies | Y | Y | - | - |
| `messages.delete` | Delete messages & bible studies | Y | Y | - | - |
| `messages.publish` | Publish / unpublish messages & bible studies | Y | Y | - | - |
| `events.view` | View events | Y | Y | Y | Y |
| `events.create` | Create events | Y | Y | Y | - |
| `events.edit_own` | Edit own events | Y | Y | Y | - |
| `events.edit_all` | Edit all events | Y | Y | - | - |
| `events.delete` | Delete events | Y | Y | - | - |
| `events.publish` | Publish / unpublish events | Y | Y | - | - |

### Media & Storage (7)
| Permission | Description | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|---|
| `media.view` | View media library | Y | Y | Y | Y |
| `media.upload` | Upload files | Y | Y | Y | - |
| `media.edit_own` | Edit own files | Y | Y | Y | - |
| `media.edit_all` | Edit all files | Y | Y | - | - |
| `media.delete` | Delete files | Y | Y | - | - |
| `media.manage_folders` | Manage folders | Y | Y | - | - |
| `storage.view` | View storage usage | Y | Y | Y | Y |

### Submissions (2)
| Permission | Description | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|---|
| `submissions.view` | View form submissions | Y | Y | Y | Y |
| `submissions.manage` | Manage submissions (read, delete) | Y | Y | - | - |

### People (8)
| Permission | Description | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|---|
| `people.view` | View people & members | Y | Y | Y | Y |
| `people.create` | Add people | Y | Y | - | - |
| `people.edit` | Edit people | Y | Y | - | - |
| `people.delete` | Delete people | Y | Y | - | - |
| `groups.view` | View groups | Y | Y | Y | Y |
| `groups.manage` | Manage groups | Y | Y | - | - |
| `ministries.view` | View ministries | Y | Y | Y | Y |
| `ministries.manage` | Manage ministries | Y | Y | - | - |
| `campuses.view` | View campuses | Y | Y | Y | Y |
| `campuses.manage` | Manage campuses | Y | Y | - | - |

### Website (10)
| Permission | Description | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|---|
| `website.pages.view` | View pages | Y | **VIEW ONLY** | Y | - |
| `website.pages.edit` | Edit pages & sections | Y | **MISSING** | - | - |
| `website.pages.create` | Create pages | Y | **MISSING** | - | - |
| `website.pages.delete` | Delete pages | Y | **MISSING** | - | - |
| `website.navigation.view` | View navigation | Y | **VIEW ONLY** | Y | - |
| `website.navigation.edit` | Edit navigation | Y | **MISSING** | - | - |
| `website.theme.view` | View theme | Y | **VIEW ONLY** | Y | - |
| `website.theme.edit` | Edit theme & branding | Y | **MISSING** | - | - |
| `website.settings.view` | View site settings | Y | **VIEW ONLY** | - | - |
| `website.settings.edit` | Edit site settings | Y | **MISSING** | - | - |
| `website.domains.view` | View domains | Y | **VIEW ONLY** | - | - |
| `website.domains.manage` | Manage domains | Y | **MISSING** | - | - |

### Administration (10)
| Permission | Description | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|---|
| `users.view` | View team members | Y | Y | - | - |
| `users.invite` | Invite new members | Y | Y | - | - |
| `users.edit_roles` | Change member roles | Y | Y | - | - |
| `users.remove` | Remove members | Y | **MISSING** | - | - |
| `users.deactivate` | Deactivate / reactivate members | Y | Y | - | - |
| `users.approve_requests` | Approve / deny access requests | Y | **MISSING** | - | - |
| `roles.view` | View roles | Y | Y | - | - |
| `roles.manage` | Manage roles & permissions | Y | **MISSING** | - | - |
| `church.profile.view` | View church profile | Y | Y | Y | Y |
| `church.profile.edit` | Edit church profile | Y | Y | - | - |

---

## Admin Role — 10 Missing Permissions

The Admin role in `lib/permissions.ts` (lines 174-195) is missing these permissions:

| # | Permission | Impact |
|---|---|---|
| 1 | `website.pages.edit` | Can't edit any page content or sections |
| 2 | `website.pages.create` | Can't create new pages |
| 3 | `website.pages.delete` | Can't delete pages |
| 4 | `website.navigation.edit` | Can't edit menus, quick links, or navigation items |
| 5 | `website.theme.edit` | Can't change theme, colors, fonts, branding |
| 6 | `website.settings.edit` | Can't change site settings |
| 7 | `website.domains.manage` | Can't manage custom domains |
| 8 | `users.remove` | Can't remove team members |
| 9 | `users.approve_requests` | Can't approve/deny access requests |
| 10 | `roles.manage` | Can't create/edit/delete roles or change permissions |

### What This Means for Admins Right Now

- **Quick Links:** Requires `website.navigation.edit` — Admin CANNOT edit quick links
- **Page Builder:** Requires `website.pages.edit` — Admin CANNOT edit pages
- **Navigation menus:** Requires `website.navigation.edit` — Admin CANNOT edit menus
- **Theme/branding:** Requires `website.theme.edit` — Admin CANNOT change theme
- **Site settings:** Requires `website.settings.edit` — Admin CANNOT edit settings
- **Domains:** Requires `website.domains.manage` — Admin CANNOT manage domains
- **Access requests:** Requires `users.approve_requests` — Admin CANNOT approve new members
- **Remove users:** Requires `users.remove` — Admin CANNOT remove team members
- **Manage roles:** Requires `roles.manage` — Admin CANNOT create or edit roles

---

## Owner-Only Permissions (Per David's Requirements)

These should stay Owner-only and NOT be given to Admin:

| Permission | Reason |
|---|---|
| `website.pages.edit` | Website builder is Owner-only |
| `website.pages.create` | Website builder is Owner-only |
| `website.pages.delete` | Website builder is Owner-only |
| `website.theme.edit` | Website builder is Owner-only |
| `website.settings.edit` | Website builder is Owner-only |
| `website.domains.manage` | Website builder is Owner-only |
| Builder feedback | Uses `requireApiAuth()` with no specific permission — any authenticated user can access |

---

## Recommended Admin Permissions to ADD

Based on "admins should have everything except website builder and feedback":

| # | Permission | Why |
|---|---|---|
| 1 | `website.navigation.edit` | Admins need to edit quick links, menus |
| 2 | `users.remove` | Admins need to remove team members |
| 3 | `users.approve_requests` | Admins need to approve/deny access requests |
| 4 | `roles.manage` | Admins need to manage roles (with hierarchy protection — can't edit roles at or above their priority) |

**NOT adding** (Owner-only per David's requirements):
- `website.pages.edit/create/delete` — website builder
- `website.theme.edit` — website builder
- `website.settings.edit` — website builder
- `website.domains.manage` — website builder

---

## Unprotected Write Routes (No Auth Check)

These API routes accept POST/PATCH/PUT/DELETE but have NO `requireApiAuth()` call:

| Route | Method | Should Require |
|---|---|---|
| `videos/[slug]` | PATCH, DELETE | `messages.edit_own`, `messages.delete` |
| `videos/route` | POST | `messages.create` |
| `daily-bread/route` | POST | `messages.create` or dedicated permission |
| `daily-bread/[date]` | PATCH | `messages.edit_own` |
| `ministries/[slug]` | PATCH, DELETE | `ministries.manage` |
| `ministries/route` | POST | `ministries.manage` |
| `series/route` | POST | `messages.create` |
| `series/[id]` | PATCH, DELETE | `messages.edit_own`, `messages.delete` |
| `campuses/route` | POST | `campuses.manage` |
| `campuses/[slug]` | PATCH, DELETE | `campuses.manage` |
| `church/route` | PATCH | `church.profile.edit` |
| `people/import` | POST | `people.create` |
| `people/[id]` | PUT, PATCH, DELETE | `people.edit`, `people.delete` |
| `people/route` | POST | `people.create` |
| `people/[id]/notes` | POST | `people.edit` |
| `people/[id]/notes/[noteId]` | PUT, DELETE | `people.edit` |
| `people/[id]/roles` | POST, DELETE | `people.edit` |
| `people/[id]/communication-preferences` | PUT | `people.edit` |
| `people/by-role/[slug]` | POST | `people.edit` |
| `roles/route` | POST | `roles.manage` |
| `roles/[id]` | PUT, DELETE | `roles.manage` |
| `custom-fields/route` | POST | `people.edit` |
| `custom-fields/[id]` | PUT, DELETE | `people.edit` |
| `households/route` | POST | `people.edit` |
| `households/[id]` | PUT, DELETE | `people.edit` |
| `households/[id]/members` | POST, DELETE | `people.edit` |
| `form-submissions/route` | POST | `submissions.manage` (or public) |
| `form-submissions/[id]` | PATCH, DELETE | `submissions.manage` |
| `form-submissions/batch` | POST | `submissions.manage` |
| `pages/route` | POST | `website.pages.create` |
| `pages/[slug]/sections/route` | POST, PUT | `website.pages.edit` |
| `pages/[slug]/sections/[id]` | PATCH, DELETE | `website.pages.edit` |
| `convert-doc` | POST | `messages.edit_own` |
| `builder/presence` | POST, DELETE | (any authenticated) |
| `ai/align-transcript` | POST | `messages.edit_own` |
| `ai/cleanup-captions` | POST | `messages.edit_own` |
| `pages/homepage-section` | (has auth) | Already protected |

---

## Deployment Plan

### Step 1: Update `lib/permissions.ts` (code change)
Add 4 permissions to Admin role's `permissions` array:
```
'website.navigation.edit',
'users.remove',
'users.approve_requests',
'roles.manage',
```

### Step 2: Update Admin role in the database
The seed file creates roles, but the database Admin role won't automatically get new permissions. Options:
- **Option A:** Run a SQL update on the server:
  ```sql
  UPDATE "Role"
  SET permissions = permissions || '["website.navigation.edit","users.remove","users.approve_requests","roles.manage"]'::jsonb
  WHERE slug = 'admin';
  ```
- **Option B:** Write a migration script (like the attachment one) that reads `DEFAULT_ROLES.ADMIN.permissions` from code and syncs to DB.
- **Option C:** Use the CMS Roles UI to manually add the 4 permissions (if Admin can't manage roles yet, Owner must do it).

### Step 3: Invalidate JWT sessions
After updating the DB, existing JWT tokens still have the old permissions cached. Either:
- Wait for tokens to expire naturally
- Or call `POST /api/v1/auth/invalidate-sessions` to force re-login

### Step 4: Add `requireApiAuth()` to unprotected routes
This is the bigger task (30+ routes). Prioritize:
1. `church/route` PATCH — can edit church profile without auth
2. `people/*` routes — can add/edit/delete people without auth
3. `campuses/*`, `ministries/*` — can manage without auth
4. `series/*`, `videos/*` — can manage without auth
5. Remaining routes

### Step 5: Deploy to server
```bash
git pull
npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp .env .next/standalone/.env
pm2 restart laubf_cms
```
