# Manual Testing Checklist — Groups Refactor

This covers all edge cases and user journeys to verify after the tags/groups/roles rename refactor.

---

## 1. Sidebar Navigation

- [ ] Open the CMS sidebar. Under **People**, confirm you see **Members** and **Groups** (not "Roles" or "Tags").
- [ ] Click **Groups** — confirm it navigates to `/cms/people/groups`.
- [ ] Under **Admin**, confirm you still see **Roles** (this is the permissions system, separate from People groups).
- [ ] Confirm there is NO "Tags" link anywhere in the sidebar.

---

## 2. Groups Page (`/cms/people/groups`)

### Viewing Groups
- [ ] Page loads without errors.
- [ ] Existing groups (Pastor, Bible Study Leader) display correctly with name, member count, color badge, and icon.
- [ ] System groups (Pastor) show a "System" badge and cannot be deleted.
- [ ] Non-system groups (Bible Study Leader) can be deleted.

### Creating a Group
- [ ] Click "Create Group" button — dialog opens.
- [ ] Fill in group name, select a color and icon, click Save.
- [ ] New group appears in the list immediately.
- [ ] Try creating a group with an empty name — should show validation error.
- [ ] Try creating a group with a duplicate name — should show an error.

### Editing a Group
- [ ] Click on a group to open edit dialog.
- [ ] Change the name, color, and icon — save.
- [ ] Confirm changes are reflected in the list.
- [ ] Try editing a system group — confirm the name field is read-only or editing is restricted.

### Deleting a Group
- [ ] Delete a non-system group — confirm it disappears.
- [ ] Confirm the system group (Pastor) does NOT have a delete option.

### Managing Group Members
- [ ] Click into a group to see its members.
- [ ] Add a member to the group — confirm they appear in the member list.
- [ ] Remove a member from the group — confirm they disappear.
- [ ] Verify the member count updates correctly after add/remove.

---

## 3. Members List (`/cms/people/members`)

### Groups Column
- [ ] The table has a **Groups** column (not "Roles" or "Tags").
- [ ] Members with group assignments show group name badges (e.g., "Pastor", "Bible Study Leader").
- [ ] Members with no groups show an empty cell or dash.
- [ ] The column can be sorted/toggled via the Columns dropdown.

### Column Visibility
- [ ] Click the **Columns** button in the toolbar.
- [ ] Confirm there is NO "Roles" or "Tags" option — only "Groups".
- [ ] Toggle the Groups column off and on — confirm it hides/shows correctly.

### Search & Filters
- [ ] Search for a member by name — results appear correctly.
- [ ] Use the status filter — confirm it works independently (no tag/group filter remnants).
- [ ] Confirm there are NO filter options for "Tags" anywhere.

### Bulk Actions
- [ ] Select multiple members via checkboxes.
- [ ] Confirm bulk actions (Set Member, Set Inactive, Archive) still work.
- [ ] Clear selection — confirm it resets.

---

## 4. Member Preview Panel

- [ ] Click on a member row to open the preview panel on the right.
- [ ] Confirm the panel shows the member's **groups** (not "roles" or "tags") as badges under their name.
- [ ] If the member has no groups, confirm there are no empty badge rows or errors.
- [ ] Click the **Groups** tab — confirm it shows the member's group memberships correctly.
- [ ] Confirm there is NO "Tags" tab or section anywhere in the panel.
- [ ] Click "View Full Profile" — confirm it navigates to the member detail page.
- [ ] Close the panel — confirm the X button works.

---

## 5. Member Detail Page (`/cms/people/members/[id]`)

- [ ] Page loads without errors for a member who has groups.
- [ ] Page loads without errors for a member who has NO groups.
- [ ] Confirm there is NO "Tags" section on the profile.
- [ ] Confirm there is NO old "Groups" section (the one with group detail/settings dialogs).
- [ ] The profile shows church info, contact info, household, notes, custom fields — all without errors.
- [ ] Groups are visible somewhere on the profile (via the role assignments section).

---

## 6. Speaker Dropdown (Message Entry)

### Basic Functionality
- [ ] Navigate to create/edit a message (e.g., `/cms/messages/new` or click into an existing message).
- [ ] Click the **Speaker** dropdown/combobox.
- [ ] Confirm it loads a list of members (NOT just a "Speaker" group).
- [ ] Confirm the list is sorted by frequency — the most frequent message speakers appear first.
- [ ] Members who have never given a message appear at the bottom, sorted alphabetically.

### Message Count Display
- [ ] Confirm each person in the dropdown shows their message count (e.g., "William Larsen (45 messages)").
- [ ] Members with 0 messages should show "0 messages" or similar.

### Selecting a Speaker
- [ ] Select an existing member as speaker — confirm it saves correctly.
- [ ] The selected speaker should display their name in the field.

### Custom/New Speaker
- [ ] Type a name that doesn't match any existing member.
- [ ] Confirm you can either use the typed name directly OR create a new member.
- [ ] If "Create new member" option exists, click it — confirm a dialog opens to add the person.
- [ ] After creating, confirm the new person is selected as the speaker.

### Editing an Existing Message
- [ ] Open an existing message that already has a speaker assigned.
- [ ] Confirm the current speaker is pre-selected in the dropdown.
- [ ] Change the speaker to someone else — save — confirm it persists.

### Performance
- [ ] The speaker dropdown should load quickly (cached for 5 minutes).
- [ ] Open the dropdown multiple times — should not re-fetch on every open.

---

## 7. API Endpoints

### Verify Working Endpoints
- [ ] `GET /api/v1/roles` — returns PersonRoleDefinitions (Pastor, Bible Study Leader, etc.).
- [ ] `POST /api/v1/roles` — can create a new group definition.
- [ ] `PUT /api/v1/roles/[id]` — can update a group.
- [ ] `DELETE /api/v1/roles/[id]` — can delete a non-system group.
- [ ] `GET /api/v1/people/[id]/roles` — returns a member's group assignments.
- [ ] `POST /api/v1/people/[id]/roles` — can assign a member to a group.
- [ ] `DELETE /api/v1/people/[id]/roles` — can remove a member from a group.
- [ ] `GET /api/v1/speakers/frequent` — returns members sorted by message frequency.
- [ ] `GET /api/v1/people` — returns members with groups (no tags, no old group data).

### Verify Deleted Endpoints Return 404
- [ ] `GET /api/v1/people/[id]/tags` — should return 404.
- [ ] `POST /api/v1/people/[id]/tags` — should return 404.
- [ ] `GET /api/v1/person-groups` — should return 404.
- [ ] `POST /api/v1/person-groups` — should return 404.
- [ ] `GET /api/v1/person-groups/[id]` — should return 404.

---

## 8. Admin Roles (Permissions) — Unchanged

These should be completely unaffected by the refactor. Verify nothing broke:

- [ ] Navigate to `/cms/settings` or wherever admin Roles are managed.
- [ ] Confirm roles (Owner, Admin, Editor, Viewer) still display correctly.
- [ ] Confirm role permissions can still be edited.
- [ ] Confirm assigning a user to a role still works.
- [ ] The word "Roles" here is correct — this is the permissions system, NOT the People groups.

---

## 9. Seed Data Verification

After running `npx prisma db seed`:

- [ ] **Pastor** group exists with 3 members (William Larsen, John Kwon, David Park).
- [ ] **Bible Study Leader** group exists with 5 members.
- [ ] There are NO tag records in the database.
- [ ] There is NO "Speaker" group.
- [ ] The `PersonTag` table does not exist in the database.
- [ ] The `PersonGroup` table does not exist in the database.
- [ ] The `PersonGroupMember` table does not exist in the database.

---

## 10. Edge Cases

- [ ] A member with multiple groups — verify all groups display as badges (both in list and preview panel).
- [ ] A member with 0 groups — verify no errors, just empty/dash display.
- [ ] Deleting a group that has members — verify members are unassigned cleanly (no orphan records).
- [ ] The speaker dropdown with 0 messages in the database — verify it still shows all members alphabetically.
- [ ] Navigate directly to `/cms/people/roles` — should 404 (this URL no longer exists).
- [ ] Navigate directly to `/cms/people/groups/[id]` — should 404 (old group detail page was deleted).
- [ ] Browser back/forward through groups page — no stale state or errors.
- [ ] Refresh the groups page — data reloads correctly.

---

## 11. Console Errors

For each page visited above:

- [ ] Open browser DevTools Console tab.
- [ ] Confirm there are NO red errors related to missing components, failed API calls, or undefined properties.
- [ ] Specifically watch for:
  - `Cannot read properties of undefined (reading 'role')` — would indicate old `.role` access on groups.
  - `Failed to fetch` to `/api/v1/person-groups` or `/api/v1/people/[id]/tags` — would indicate stale API calls.
  - `Module not found` for any deleted component files.
