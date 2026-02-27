# Member Management Implementation Notes

> Created: 2026-02-27
> Status: Initial implementation complete. QA and integration testing needed.

---

## Table of Contents

1. [Summary](#1-summary)
2. [What Was Built](#2-what-was-built)
3. [Architecture Decisions](#3-architecture-decisions)
4. [Database Schema](#4-database-schema)
5. [DAL Modules](#5-dal-modules)
6. [API Routes](#6-api-routes)
7. [Frontend Pages & Components](#7-frontend-pages--components)
8. [User Flows Implemented](#8-user-flows-implemented)
9. [Known Issues & Limitations](#9-known-issues--limitations)
10. [QA Checklist](#10-qa-checklist)
11. [Next Steps](#11-next-steps)
12. [File Inventory](#12-file-inventory)

---

## 1. Summary

The Member Management module (People section in the CMS sidebar) was implemented in a single session using a coordinated agent team. The module provides a complete member directory, household/family management, group management, roles system, custom fields, notes, tags, communication preferences, and CSV import.

**PRD**: `docs/01_prd/04-prd-member-management.md` (14 sections, comprehensive)

**Scope delivered**:
- 12 new Prisma models + 2 migrations
- 7 DAL modules (people, households, person-groups, custom-fields, person-notes, communication-preferences, person-roles)
- 20 API route files (~40+ handlers)
- 5 CMS pages (members list, member detail, groups list, group detail, directory stub)
- 23 frontend components
- 3 client-side context providers
- Comprehensive seed data (20 people, 3 households, 4 groups, 6 roles, 11 speakers migrated)

---

## 2. What Was Built

### PRD Document
- **File**: `docs/01_prd/04-prd-member-management.md`
- **Sections**: 14 (Overview, Member Profiles, Household, Groups, Roles, Data Table, CSV Import, Field Editor, Archive, Communication Preferences, AI Features, User Journeys, Edge Cases, Success Metrics)
- **Created by**: Pastor persona + product strategist agent informed by competitive research (Planning Center, Breeze, CCB, Tithe.ly, Realm, FellowshipOne)

### Database Layer
- **Models**: Person, Household, HouseholdMember, PersonGroup, PersonGroupMember, CustomFieldDefinition, CustomFieldValue, PersonNote, CommunicationPreference, PersonTag, PersonRoleDefinition, PersonRoleAssignment
- **Enums**: Gender, MaritalStatus, MembershipStatus, HouseholdRole, GroupType, GroupStatus, GroupMemberRole, NoteType, CommunicationChannel, CustomFieldType
- **Migrations**: `20260227224607_add_member_management`, `20260227225413_add_person_roles`

### Frontend
- Members list page with DataTable, search, filters, bulk actions
- Member profile detail page with 12 sub-components (inline editing)
- Groups list page with grid/list views, templates, search
- Group detail page with member management
- Add Member dialog (2-step form)
- CSV Import dialog (4-step wizard)
- Create Group dialog (3 tabs: custom, template, AI generate)
- Add Group Members dialog with search and role selection

---

## 3. Architecture Decisions

### Person vs User Separation
- `User` = platform auth accounts (CMS login, Google SSO)
- `Person` = congregation members (directory entries)
- `Person.userId` is an optional FK to `User` for future self-service portal
- `ChurchMember` = CMS admin access role (OWNER/ADMIN/EDITOR/VIEWER)
- A person can exist without a user account (most congregation members won't have CMS login)

### Roles System (Replaces Standalone Speaker Table)
- `PersonRoleDefinition` = church-level role definitions (Speaker, Pastor, Elder, etc.)
- `PersonRoleAssignment` = join table linking Person to Role with optional title/dates
- **System roles** (`isSystem: true`) cannot be deleted: Speaker, Pastor, Elder, Deacon, Worship Leader
- **Custom roles** can be created by church admins
- The Speaker role connects to the CMS sermon module — `getPeopleByRole(churchId, 'speaker')` replaces querying the standalone Speaker table
- **Migration path**: Person records were created for all 11 existing speakers in seed data with Speaker role assigned. The standalone `Speaker` table is preserved but deprecated.

### Household vs Family
- Used "Household" model (industry standard) — represents people living together, not necessarily biological family
- Supports non-traditional arrangements (roommates, multi-generational homes)
- Each person can belong to multiple households (divorced families, college students)
- One primary contact per household for communications

### Custom Fields
- `CustomFieldDefinition` defines field structure per church (type, options, section, required, permissions)
- `CustomFieldValue` stores per-person values as strings (parsed by type on the frontend)
- Organized into collapsible sections on the profile page
- Supports 9 field types: TEXT, DATE, DROPDOWN, MULTI_SELECT, CHECKBOX, NUMBER, URL, FILE

### Group Hierarchy
- `PersonGroup.parentGroupId` enables subgroups (self-referencing FK)
- 6 group types: SMALL_GROUP, SERVING_TEAM, MINISTRY, CLASS, ADMINISTRATIVE, CUSTOM
- Groups have their own status lifecycle: ACTIVE, INACTIVE, ARCHIVED
- Members have roles within groups: LEADER, CO_LEADER, MEMBER

### Client-Side Data Fetching Pattern
- Members and Groups pages use client-side context providers (`MembersProvider`, `GroupsProvider`) for optimistic updates
- This matches the existing pattern used by messages and events pages
- Context providers fetch from API routes, not directly from DAL (maintains API boundary)

---

## 4. Database Schema

### New Models (12 total)

```
Person (core member record)
├── firstName, lastName, preferredName
├── gender, maritalStatus, dateOfBirth
├── email, phone, mobilePhone, homePhone
├── address, city, state, zipCode, country
├── photoUrl, bio, title
├── membershipStatus (VISITOR/REGULAR_ATTENDEE/MEMBER/INACTIVE/ARCHIVED)
├── membershipDate, baptismDate, salvationDate
├── source, slug
├── userId? (optional link to User for self-service)
├── deletedAt? (soft delete)
├── → HouseholdMember[] (households)
├── → PersonGroupMember[] (groups)
├── → PersonNote[] (notes)
├── → CustomFieldValue[] (custom fields)
├── → CommunicationPreference[] (comm prefs)
├── → PersonTag[] (tags)
└── → PersonRoleAssignment[] (roles)

Household
├── name, address (JSON)
├── primaryContactId → Person
└── → HouseholdMember[]

HouseholdMember (Person ↔ Household join)
├── role: HEAD/SPOUSE/CHILD/OTHER_ADULT/DEPENDENT
└── @@unique([householdId, personId])

PersonGroup
├── name, slug, description, groupType, status
├── parentGroupId? (self-ref for subgroups)
├── meetingSchedule, meetingLocation
├── isOpen, capacity, photoUrl
└── → PersonGroupMember[]

PersonGroupMember (Person ↔ Group join)
├── role: LEADER/CO_LEADER/MEMBER
├── joinedAt, leftAt?
└── @@unique([groupId, personId])

CustomFieldDefinition (church-level field config)
├── name, slug, fieldType, options (JSON)
├── section, isRequired, isVisible, sortOrder
├── permissions (JSON)
└── @@unique([churchId, slug])

CustomFieldValue (per-person field values)
├── value (String)
└── @@unique([personId, fieldDefinitionId])

PersonNote
├── noteType: GENERAL/PASTORAL/COUNSELING/FOLLOW_UP/PRAYER
├── content, isPinned, isPrivate
└── authorId → User

CommunicationPreference
├── channel: EMAIL/SMS/PHONE/MAIL
├── category (String), isOptedIn
└── @@unique([personId, channel, category])

PersonTag
├── tagName (String)
└── @@unique([personId, tagName])

PersonRoleDefinition (church-level role config)
├── name, slug, description
├── isSystem (true = undeletable)
├── color, icon, sortOrder
└── @@unique([churchId, slug])

PersonRoleAssignment (Person ↔ Role join)
├── title?, startDate?, endDate?
└── @@unique([personId, roleId])
```

### Indexes
All tables have `@@index([churchId])`. Additional composite indexes:
- Person: `[churchId, email]`, `[churchId, lastName, firstName]`, `[churchId, membershipStatus]`
- PersonGroup: `[churchId, groupType]`, `[churchId, status]`
- PersonNote: `[personId, noteType]`
- CommunicationPreference: `[personId]`
- PersonRoleAssignment: `[personId]`, `[roleId]`

---

## 5. DAL Modules

| Module | File | Key Functions |
|---|---|---|
| People | `lib/dal/people.ts` | `getPeople()` (search/filter/paginate), `getPersonById()`, `getPersonBySlug()`, `createPerson()`, `updatePerson()`, `deletePerson()`, `importPeople()` |
| Households | `lib/dal/households.ts` | `getHouseholds()`, `getHouseholdById()`, `createHousehold()`, `updateHousehold()`, `deleteHousehold()`, `addHouseholdMember()`, `removeHouseholdMember()` |
| Person Groups | `lib/dal/person-groups.ts` | `getPersonGroups()`, `getPersonGroupById()`, `createPersonGroup()`, `updatePersonGroup()`, `deletePersonGroup()`, `addGroupMember()`, `removeGroupMember()` |
| Custom Fields | `lib/dal/custom-fields.ts` | `getFieldDefinitions()`, `createFieldDefinition()`, `updateFieldDefinition()`, `deleteFieldDefinition()`, `getFieldValues()`, `setFieldValue()`, `deleteFieldValue()` |
| Person Notes | `lib/dal/person-notes.ts` | `getNotes()` (with type filter), `createNote()`, `updateNote()`, `deleteNote()` |
| Comm Prefs | `lib/dal/communication-preferences.ts` | `getPreferences()`, `setPreference()`, `bulkSetPreferences()` |
| Person Roles | `lib/dal/person-roles.ts` | `getRoleDefinitions()`, `createRoleDefinition()`, `updateRoleDefinition()`, `deleteRoleDefinition()`, `assignRole()`, `removeRole()`, `getPersonRoles()`, `getPeopleByRole()` |

All DAL functions follow the established pattern: `churchId` as first parameter, Prisma queries with `deletedAt: null` filter, proper includes for relations.

---

## 6. API Routes

### People Routes (8 files)
| Route | Methods | Purpose |
|---|---|---|
| `/api/v1/people` | GET, POST | List (with filters) / Create person |
| `/api/v1/people/[id]` | GET, PUT, DELETE | Single person CRUD |
| `/api/v1/people/import` | POST | CSV import (multipart form data) |
| `/api/v1/people/[id]/notes` | GET, POST | List / create notes |
| `/api/v1/people/[id]/notes/[noteId]` | PUT, DELETE | Update / delete note |
| `/api/v1/people/[id]/roles` | GET, POST, DELETE | Person role assignments |
| `/api/v1/people/[id]/tags` | GET, POST, DELETE | Person tag management |
| `/api/v1/people/[id]/communication-preferences` | GET, PUT | Comm pref read/update |

### Household Routes (3 files)
| Route | Methods | Purpose |
|---|---|---|
| `/api/v1/households` | GET, POST | List / create household |
| `/api/v1/households/[id]` | GET, PUT, DELETE | Single household CRUD |
| `/api/v1/households/[id]/members` | POST, DELETE | Add / remove members |

### Group Routes (3 files)
| Route | Methods | Purpose |
|---|---|---|
| `/api/v1/person-groups` | GET, POST | List / create group |
| `/api/v1/person-groups/[id]` | GET, PUT, DELETE | Single group CRUD |
| `/api/v1/person-groups/[id]/members` | GET, POST, DELETE | Group member management |

### Role Routes (2 files)
| Route | Methods | Purpose |
|---|---|---|
| `/api/v1/roles` | GET, POST | List / create role definitions |
| `/api/v1/roles/[id]` | PUT, DELETE | Update / delete (system role protection) |

### Custom Field Routes (2 files)
| Route | Methods | Purpose |
|---|---|---|
| `/api/v1/custom-fields` | GET, POST | List / create field definitions |
| `/api/v1/custom-fields/[id]` | PUT, DELETE | Update / delete field definition |

---

## 7. Frontend Pages & Components

### Pages (5 files)

| Page | Route | Type | Description |
|---|---|---|---|
| Members List | `/cms/people/members` | Client | DataTable with search, filters, bulk actions |
| Member Profile | `/cms/people/members/[id]` | Server → Client | Two-column profile with inline editing |
| Groups List | `/cms/people/groups` | Client | Grid/list views with search and filters |
| Group Detail | `/cms/people/groups/[id]` | Client | Group info, members table, subgroups |
| Directory | `/cms/people/directory` | — | Stub (not implemented yet) |

### Components (23 files in `components/cms/people/`)

**Members List Components:**
- `members-columns.tsx` — DataTable column definitions (avatar, name, status badge, etc.)
- `members-toolbar.tsx` — Search, filter pills, bulk actions bar, import/add buttons
- `add-member-dialog.tsx` — 2-step form (basic info → additional info)
- `csv-import-dialog.tsx` — 4-step wizard (upload → mapping → validation → import)

**Member Profile Components:**
- `member-profile.tsx` — Main 2-column layout
- `profile-header.tsx` — Avatar, name, status badge, quick actions
- `profile-personal-info.tsx` — View/edit personal fields
- `profile-contact-info.tsx` — View/edit contact fields
- `profile-church-info.tsx` — View/edit church membership fields
- `profile-household.tsx` — Household members, create/join household
- `profile-groups.tsx` — Group memberships, add to group
- `profile-notes.tsx` — Notes timeline, add/edit/pin/delete
- `profile-communication-prefs.tsx` — Channel x category toggles
- `profile-tags.tsx` — Tag badges, add/remove
- `profile-custom-fields.tsx` — Dynamic field rendering by type
- `profile-activity.tsx` — Created/updated timestamps
- `archive-member-dialog.tsx` — Archive confirmation with reason

**Groups Components:**
- `groups-view.tsx` — Grid/list toggle, search, type/status filters, sort
- `create-group-dialog.tsx` — 3-tab creation (custom, template, AI generate)
- `group-detail.tsx` — Group info cards, members DataTable, subgroups
- `group-settings-dialog.tsx` — Edit group, danger zone (archive/delete)
- `add-group-members-dialog.tsx` — Search people, select, assign roles

**Shared:**
- `types.ts` — Prisma-derived TypeScript types

### Context Providers (3 files in `lib/`)
- `members-context.tsx` — Members CRUD, optimistic updates
- `groups-context.tsx` — Groups CRUD, member management
- `groups-data.ts` — Display maps (type labels, badge variants), group templates

---

## 8. User Flows Implemented

### Primary Flows

| # | Flow | Status | Notes |
|---|---|---|---|
| 1 | Add new member | ✅ Built | 2-step dialog, auto-slug, validation, toast |
| 2 | View/edit member profile | ✅ Built | Inline editing on all profile cards |
| 3 | Import from CSV | ✅ Built | 4-step wizard, column validation, progress |
| 4 | Create a group | ✅ Built | 3 modes: custom, template (8 presets), AI placeholder |
| 5 | Search/filter members | ✅ Built | Real-time search, status filter, column visibility |
| 6 | Archive a member | ✅ Built | Confirmation dialog with reason, undo toast |

### Secondary Flows

| # | Flow | Status | Notes |
|---|---|---|---|
| 7 | Create household + link members | ✅ Built | From profile → create household dialog |
| 8 | Add member to group | ✅ Built | Search people dialog with role selection |
| 9 | Add/manage notes | ✅ Built | Timeline view, type filter tabs, pin/private |
| 10 | Manage communication prefs | ✅ Built | Channel x category toggle grid, optimistic |
| 11 | Tag management | ✅ Built | Inline add/remove on profile |
| 12 | Bulk status update | ✅ Built | Toolbar bulk actions (set member, set inactive, archive) |
| 13 | Group member role changes | ✅ Built | Per-member actions in group detail table |
| 14 | Remove member from group | ✅ Built | Confirmation dialog in group detail |

---

## 9. Known Issues & Limitations

### Not Yet Implemented (Planned in PRD)

| Feature | PRD Priority | Notes |
|---|---|---|
| **Field Editor admin page** | P1 | Custom field definitions exist in DB but no admin UI to manage them. Fields are seeded but not editable by admin. |
| **Roles management UI** | P0 | Role definitions and assignments exist in DB/API but no dedicated admin page. Roles appear on profiles but can't be managed from a standalone screen yet. |
| **AI-powered CSV column mapping** | P2 | CSV import has basic column validation but no AI auto-mapping. |
| **AI natural language search** | P2 | Not implemented. Standard search/filter only. |
| **AI group template generation** | P2 | Create Group has AI tab but uses simple pattern matching, not real AI. |
| **Saved filter presets** | P1 | Filter UI works but presets can't be saved/loaded. |
| **Data export (CSV)** | P1 | Bulk export action exists in toolbar but export endpoint not wired. |
| **Duplicate detection/merge** | P1 | No duplicate detection during manual add or import. |
| **Directory page** | P1 | Still a stub — planned as a simpler, read-only view of people. |
| **Speaker table migration in CMS** | P0 | Person records created for speakers, but the Messages form still queries the old Speaker table. Needs to switch to `getPeopleByRole(churchId, 'speaker')`. |
| **Engagement scoring** | P2 | No engagement signals tracked yet. |
| **Note summarization (AI)** | P2 | Not implemented. |
| **Self-service member portal** | Out of scope | Excluded from MVP per PRD. |
| **Attendance tracking** | Out of scope | Excluded from MVP per PRD. |

### Technical Debt

1. **Speaker table deprecation**: The standalone `Speaker` model is preserved for backward compatibility. The `Messages` CMS form, `BibleStudy` form, and all speaker-related API routes still use the old Speaker table. These need to be migrated to use `Person` + Speaker role. See PRD Section 5.4 for the 6-step migration plan.

2. **Person.address field**: Currently stored as individual fields (city, state, zipCode, country) plus a text address field. Consider migrating to a structured JSON address object for international address support.

3. **Custom field permissions**: The `permissions` JSON field on `CustomFieldDefinition` is defined but not enforced on the frontend. Field-level access control is not implemented.

4. **Photo upload**: Profile header has upload capability in the UI but the actual file upload endpoint (to a storage service) is not implemented. Photos are URL-only (paste a URL).

5. **Optimistic update rollback**: Context providers have optimistic updates but error rollback behavior should be tested thoroughly (especially for bulk actions).

---

## 10. QA Checklist

### Members List Page
- [ ] Page loads and displays seeded members
- [ ] Search filters by name, email, phone in real-time
- [ ] Status filter pills work (All, Visitor, Regular, Member, Inactive)
- [ ] Column visibility toggle hides/shows columns
- [ ] Sorting works on all sortable columns
- [ ] Pagination works (10/25/50 per page)
- [ ] Row click navigates to member profile
- [ ] Row actions dropdown works (View, Add to Group, Archive)
- [ ] Checkbox selection enables bulk actions bar
- [ ] Bulk "Set Member" status works
- [ ] Bulk "Archive" with confirmation works
- [ ] Empty state shows when no members exist
- [ ] Mobile responsive (cards or hidden columns on small screens)

### Add Member Dialog
- [ ] Opens from "Add Member" button
- [ ] Step 1 validates required fields (first name, last name)
- [ ] Step 2 shows additional fields
- [ ] Form submission creates person via API
- [ ] Success toast shows with member name
- [ ] New member appears in table without full page refresh
- [ ] Duplicate email handling (if applicable)

### CSV Import Dialog
- [ ] Opens from "Import" button
- [ ] Drag & drop file upload works
- [ ] "Download Template" button provides CSV template
- [ ] Column validation shows expected vs actual headers
- [ ] Preview table shows first 5 rows
- [ ] Import progress indicator works
- [ ] Success summary shows count
- [ ] Error details are expandable per row
- [ ] Members list refreshes after import

### Member Profile Page
- [ ] Page loads with all profile sections populated
- [ ] Profile header shows correct name, status badge, avatar
- [ ] Personal info card shows fields in view mode
- [ ] Personal info edit mode works (toggle, save, cancel)
- [ ] Contact info shows clickable email/phone links
- [ ] Contact info edit mode works
- [ ] Church info shows membership status/dates
- [ ] Church info edit mode works
- [ ] Household card shows linked family members
- [ ] Household member profile links work
- [ ] "Create Household" from profile works
- [ ] Groups card lists all group memberships
- [ ] "Add to Group" dialog search and select works
- [ ] "Remove from Group" with confirmation works
- [ ] Notes timeline displays correctly (newest first)
- [ ] Note type filter tabs work
- [ ] Add note form works (type, content, pin, private)
- [ ] Edit/delete note actions work (only for author)
- [ ] Pin toggle works
- [ ] Communication preferences toggles save immediately
- [ ] Tags display as badges
- [ ] Add tag works (Enter to submit)
- [ ] Remove tag (X button) works
- [ ] Custom fields render by type correctly
- [ ] Custom fields edit mode works
- [ ] Archive dialog shows warning and confirmation
- [ ] Archive creates toast with undo action
- [ ] Back to Members link works
- [ ] Mobile layout stacks to single column

### Groups List Page
- [ ] Page loads and displays seeded groups
- [ ] Grid view shows cards with name, type, member count, avatar stack
- [ ] List view shows DataTable with all columns
- [ ] Grid/list toggle works
- [ ] Search filters by group name
- [ ] Type filter dropdown works
- [ ] Status filter defaults to Active
- [ ] Sort dropdown works (Name A-Z, Newest, Most Members)
- [ ] Card click navigates to group detail
- [ ] Row actions work (Edit, Archive, Delete)
- [ ] Empty state shows when no groups exist

### Create Group Dialog
- [ ] Custom tab: form submission creates group
- [ ] Template tab: clicking template pre-fills form
- [ ] AI Generate tab: prompt generates form pre-fill
- [ ] Validation requires name and type
- [ ] Success toast and redirect/refresh

### Group Detail Page
- [ ] Header shows group name, type badge, status
- [ ] Info cards show member count, leaders, schedule, location
- [ ] Members DataTable shows all group members
- [ ] Member search within group works
- [ ] "Add Members" dialog searches people, assigns roles
- [ ] Already-in-group members shown as disabled
- [ ] Change member role works (Leader/Co-Leader/Member)
- [ ] Remove member with confirmation works
- [ ] Settings dialog opens and edits work
- [ ] Archive/delete in settings danger zone works
- [ ] Subgroups section shows if child groups exist
- [ ] Back to Groups breadcrumb works

### API Routes
- [ ] GET `/api/v1/people` returns paginated results with filters
- [ ] POST `/api/v1/people` creates person with validation
- [ ] GET `/api/v1/people/[id]` returns full person with relations
- [ ] PUT `/api/v1/people/[id]` updates person
- [ ] DELETE `/api/v1/people/[id]` soft-deletes person
- [ ] POST `/api/v1/people/import` processes CSV correctly
- [ ] All household CRUD routes work
- [ ] All group CRUD routes work
- [ ] All note CRUD routes work
- [ ] Role assignment/removal works
- [ ] System role deletion is blocked
- [ ] Tag add/remove works
- [ ] Communication preference update works
- [ ] Custom field definition CRUD works

---

## 11. Next Steps

### Immediate (Before Launch)

1. **Wire Speaker role to Messages form**: Update the Messages CMS form to use `getPeopleByRole(churchId, 'speaker')` instead of querying the standalone Speaker table. This is the P0 blocker for CMS integration.

2. **Roles management page**: Build a simple admin page at `/cms/settings/roles` (or within People section) to create/edit custom roles and view system roles.

3. **Field Editor page**: Build admin page to manage custom field definitions (add/edit/delete/reorder fields and sections).

4. **Photo upload**: Implement file upload to a storage service (e.g., Cloudflare R2, AWS S3) for profile photos. Currently URL-only.

5. **Data export endpoint**: Wire the bulk export action to actually generate and download a CSV.

6. **Integration test**: Run `npm run build` to verify all pages compile. Run `npx prisma db seed` to verify seed data loads. Manually test all flows end-to-end.

### Short-Term (P1 Features)

7. **Saved filter presets**: Allow admins to save and name filter combinations for quick access.

8. **Duplicate detection**: Implement matching on email, name+DOB, or phone during member creation and CSV import.

9. **Directory page**: Build a simpler, read-only view of the people database (possibly card-based) for quick lookups.

10. **Advanced family member linking**: During "Add Member", allow searching and linking existing members as family in the same flow.

11. **Bulk CSV export with filters**: Export currently filtered member list as CSV.

### Medium-Term (P2 Features)

12. **AI-powered CSV mapping**: Use Claude Haiku to auto-detect column mappings from CSV headers and sample data.

13. **AI natural language search**: "Show me families with children under 12" → structured query.

14. **Engagement scoring**: Track attendance, giving, group participation signals and compute risk scores.

15. **Group finder (public)**: Website section where visitors can browse and request to join open groups.

16. **Custom field permissions**: Enforce field-level visibility based on CMS user role.

---

## 12. File Inventory

### PRD (1 file)
- `docs/01_prd/04-prd-member-management.md`

### Database (2 migrations)
- `prisma/migrations/20260227224607_add_member_management/`
- `prisma/migrations/20260227225413_add_person_roles/`

### Schema
- `prisma/schema.prisma` (12 new models, 10 new enums added)
- `prisma/seed.mts` (seed data for people, households, groups, roles, tags, notes, custom fields, comm prefs)

### DAL Modules (7 files)
- `lib/dal/people.ts`
- `lib/dal/households.ts`
- `lib/dal/person-groups.ts`
- `lib/dal/custom-fields.ts`
- `lib/dal/person-notes.ts`
- `lib/dal/communication-preferences.ts`
- `lib/dal/person-roles.ts`

### API Routes (20 files)
- `app/api/v1/people/route.ts`
- `app/api/v1/people/[id]/route.ts`
- `app/api/v1/people/import/route.ts`
- `app/api/v1/people/[id]/notes/route.ts`
- `app/api/v1/people/[id]/notes/[noteId]/route.ts`
- `app/api/v1/people/[id]/roles/route.ts`
- `app/api/v1/people/[id]/tags/route.ts`
- `app/api/v1/people/[id]/communication-preferences/route.ts`
- `app/api/v1/households/route.ts`
- `app/api/v1/households/[id]/route.ts`
- `app/api/v1/households/[id]/members/route.ts`
- `app/api/v1/person-groups/route.ts`
- `app/api/v1/person-groups/[id]/route.ts`
- `app/api/v1/person-groups/[id]/members/route.ts`
- `app/api/v1/roles/route.ts`
- `app/api/v1/roles/[id]/route.ts`
- `app/api/v1/custom-fields/route.ts`
- `app/api/v1/custom-fields/[id]/route.ts`

### CMS Pages (5 files)
- `app/cms/(dashboard)/people/members/page.tsx`
- `app/cms/(dashboard)/people/members/[id]/page.tsx`
- `app/cms/(dashboard)/people/groups/page.tsx`
- `app/cms/(dashboard)/people/groups/[id]/page.tsx`
- `app/cms/(dashboard)/people/directory/page.tsx` (stub)

### Components (23 files)
- `components/cms/people/types.ts`
- `components/cms/people/members-columns.tsx`
- `components/cms/people/members-toolbar.tsx`
- `components/cms/people/add-member-dialog.tsx`
- `components/cms/people/csv-import-dialog.tsx`
- `components/cms/people/member-profile.tsx`
- `components/cms/people/profile-header.tsx`
- `components/cms/people/profile-personal-info.tsx`
- `components/cms/people/profile-contact-info.tsx`
- `components/cms/people/profile-church-info.tsx`
- `components/cms/people/profile-household.tsx`
- `components/cms/people/profile-groups.tsx`
- `components/cms/people/profile-notes.tsx`
- `components/cms/people/profile-communication-prefs.tsx`
- `components/cms/people/profile-tags.tsx`
- `components/cms/people/profile-custom-fields.tsx`
- `components/cms/people/profile-activity.tsx`
- `components/cms/people/archive-member-dialog.tsx`
- `components/cms/people/groups-view.tsx`
- `components/cms/people/create-group-dialog.tsx`
- `components/cms/people/group-detail.tsx`
- `components/cms/people/group-settings-dialog.tsx`
- `components/cms/people/add-group-members-dialog.tsx`

### Context Providers (3 files)
- `lib/members-context.tsx`
- `lib/groups-context.tsx`
- `lib/groups-data.ts`

**Total: ~70 new files created.**
