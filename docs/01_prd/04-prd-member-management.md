# PRD: Member Management (People Module)

> Living document. Update as features are implemented or requirements evolve.
> See also: [Primary User Profile](./00-primary-user-profile.md) | [CMS PRD](./01-prd-cms.md) | [System PRD](./03-prd-system.md)

---

## Table of Contents

1. [Overview & Scope](#1-overview--scope)
2. [Member Profiles](#2-member-profiles)
3. [Family / Household Management](#3-family--household-management)
4. [Groups Management](#4-groups-management)
5. [Roles](#5-roles)
6. [Data Table & Search / Filter](#6-data-table--search--filter)
7. [CSV Import](#7-csv-import)
8. [Field Editor (Custom Fields)](#8-field-editor-custom-fields)
9. [Archive & Data Management](#9-archive--data-management)
10. [Communication Preferences](#10-communication-preferences)
11. [AI-Powered Features](#11-ai-powered-features)
12. [Core User Journeys](#12-core-user-journeys)
13. [Side Flows & Edge Cases](#13-side-flows--edge-cases)
14. [Success Metrics](#14-success-metrics)

---

## 1. Overview & Scope

The Member Management module (surfaced as "People" in the CMS sidebar) is the church's central directory of all people connected to the congregation. It replaces spreadsheets, paper sign-in sheets, and fragmented contact lists with a single, searchable, relationship-aware database.

Church admins think of people in ministry terms: "Who is in the youth group?", "Which family just started attending?", "Who signed up for the men's retreat?" This module must mirror that mental model -- people, families, groups -- not database tables or CRM concepts.

### Relationship to Other CMS Modules

| Module | Relationship |
|---|---|
| **Events** | Members can be linked as event contacts. Attendance tracking feeds engagement signals. |
| **Messages** | People with the "Speaker" role appear in the CMS sermon/message speaker dropdown. Replaces the standalone Speaker table. |
| **Ministries** | Ministry leaders and members are drawn from the people directory. |
| **Giving** | Giving history appears as a read-only summary on member profiles (data owned by the Giving module). |
| **Announcements** | Communication preferences determine who receives announcement emails. |
| **Groups** | Groups are a first-class entity within Member Management -- not a separate module. |

### What Is NOT in Scope for MVP

- **Check-in / attendance kiosk system** -- No physical check-in hardware integration. Attendance is tracked manually or via event sign-in.
- **Member portal / self-service** -- No member-facing login or profile editing. Admin-only for MVP.
- **Volunteer scheduling** -- No shift scheduling, availability tracking, or auto-assignment. Groups track who serves where, but scheduling is manual.
- **Giving processing** -- Giving data is read-only on profiles. Donation processing lives in the Giving module.
- **Mass communication / email blasts** -- Communication preferences are tracked, but bulk email sending is handled by the Announcements module or a future Communications module.
- **Background checks** -- No integration with background check services for volunteer screening.
- **Mobile app** -- No native app for member directory browsing.

### Priority Legend

- **[P0]** -- MVP. Critical for launch.
- **[P1]** -- Important for a delightful experience.
- **[P2]** -- Nice-to-have / future enhancement.

### Implementation Status Legend

- :white_check_mark: -- Implemented.
- :warning: -- Partially implemented (see notes).
- :x: -- Not yet implemented.

---

## 2. Member Profiles

> A member profile is the single source of truth for a person's relationship to the church. It should feel like a contact card that a pastor would mentally construct -- name, family, groups, how to reach them, where they are in their church journey.

### 2.1 Core Identity Fields

| Feature | Priority | Status | Details |
|---|---|---|---|
| First name | P0 | :x: | Required. |
| Last name | P0 | :x: | Required. |
| Preferred name / nickname | P1 | :x: | Optional. Displayed instead of first name when set (e.g., "Bobby" instead of "Robert"). |
| Gender | P0 | :x: | Dropdown: Male, Female, Prefer not to say. |
| Date of birth | P0 | :x: | Date picker. Used for birthday lists and age-based filtering. Age auto-calculated. |
| Marital status | P1 | :x: | Dropdown: Single, Married, Widowed, Divorced, Separated, Other. |
| Photo / avatar | P1 | :x: | Upload or camera capture. Falls back to initials avatar (first + last initial, colored by name hash). |
| Membership status | P0 | :x: | See section 2.2. |

### 2.2 Membership Status

Every member has a status that reflects their relationship to the church. Status drives filtering, reporting, and engagement tracking.

| Status | Description | Visible in Directory | Included in Counts |
|---|---|---|---|
| **Visitor** | First-time or occasional guest. Default for new entries. | Yes | No |
| **Regular Attendee** | Attends consistently but has not formally joined. | Yes | Yes |
| **Member** | Formally recognized member of the church. | Yes | Yes |
| **Inactive** | Has not attended or engaged in a configurable period (default: 90 days). | Yes (dimmed) | No |
| **Archived** | Soft-deleted. Moved away, requested removal, or deceased. Not visible in normal views. | No | No |

| Feature | Priority | Status | Details |
|---|---|---|---|
| Status assignment on profile | P0 | :x: | Dropdown selector on profile and in create form. |
| Status badge in list view | P0 | :x: | Color-coded badge: Visitor (blue), Regular (green), Member (purple), Inactive (amber), Archived (gray). |
| Bulk status update | P1 | :x: | Select multiple members and change status in one action. |
| Auto-transition to Inactive | P2 | :x: | System detects no attendance/giving/group activity for X days and suggests Inactive status. Admin confirms. |

### 2.3 Contact Information

| Feature | Priority | Status | Details |
|---|---|---|---|
| Email address (primary) | P0 | :x: | Required for communication. Validated format. |
| Email address (additional) | P1 | :x: | Optional secondary emails with labels (e.g., "Work", "Personal"). |
| Mobile phone | P0 | :x: | Primary phone. Formatted display. |
| Home phone | P1 | :x: | Optional with label. |
| Work phone | P2 | :x: | Optional with label. |
| Mailing address | P1 | :x: | Street, City, State, ZIP, Country. Can inherit from household. |
| Address override flag | P1 | :x: | When part of a household, member can have their own address instead of the shared household address. |

### 2.4 Church Metadata

| Feature | Priority | Status | Details |
|---|---|---|---|
| Date added / created | P0 | :x: | Auto-set on creation. Read-only. |
| Date modified | P0 | :x: | Auto-updated on any profile change. Read-only. |
| Date of first visit | P1 | :x: | Optional. Manually entered or auto-detected from first event attendance. |
| Membership date | P1 | :x: | Date they formally became a member. |
| Baptism date | P2 | :x: | Optional milestone date. |
| How they heard about us | P2 | :x: | Dropdown + freetext: Friend, Website, Social Media, Walk-in, Other. |
| Campus | P1 | :x: | Which campus this member is primarily associated with (for multi-campus churches). |

### 2.5 Profile Sections

The member profile page is organized into collapsible card sections:

| Section | Priority | Status | Details |
|---|---|---|---|
| **Overview card** | P0 | :x: | Photo, name, status badge, contact summary (email, phone), quick action buttons (Edit, Email, Add to Group). |
| **Contact details** | P0 | :x: | All emails, phones, address. Editable inline or via edit mode. |
| **Family** | P0 | :x: | Household name, family role, linked family members with photo/name/role. "View Family" and "Add Family Member" actions. |
| **Groups** | P0 | :x: | List of groups the member belongs to, with their role in each group. "Add to Group" action. |
| **Roles** | P0 | :x: | Assigned roles (e.g., Speaker, Elder, Worship Leader). System + custom roles. "Add Role" action. See section 5. |
| **Notes** | P0 | :x: | Timestamped, author-attributed notes. Supports rich text. Most recent first. "Add Note" button. |
| **Giving summary** | P1 | :x: | Read-only. Total this year, total last year, last gift date. Link to full giving history in Giving module. |
| **Custom fields** | P1 | :x: | Church-defined fields organized into sections. See section 8. |
| **Communication preferences** | P1 | :x: | Opt-in/opt-out toggles per channel and category. See section 10. |
| **Tags** | P1 | :x: | Lightweight labels for ad-hoc categorization (e.g., "Newcomer 2026", "VBS Volunteer", "Prayer Team"). |
| **Activity timeline** | P2 | :x: | Chronological feed of profile changes, group joins, event attendance, notes added. |

### 2.6 Notes

| Feature | Priority | Status | Details |
|---|---|---|---|
| Add note to a member profile | P0 | :x: | Textarea with optional rich text (bold, italic, lists). |
| Note timestamp | P0 | :x: | Auto-set to creation time. Displayed as relative time ("2 days ago") with full date on hover. |
| Note author | P0 | :x: | Auto-set to the logged-in admin. Displayed with author name and avatar. |
| Edit own notes | P0 | :x: | Authors can edit their own notes. Shows "edited" indicator. |
| Delete own notes | P0 | :x: | Authors can delete their own notes with confirmation. |
| Pin note | P1 | :x: | Pinned notes stay at the top of the list regardless of date. |
| Note categories | P2 | :x: | Optional label per note: General, Pastoral, Follow-up, Prayer. |
| Note privacy | P2 | :x: | Notes can be marked "Private" (visible only to the author and Super Admins). |

### 2.7 Tags

| Feature | Priority | Status | Details |
|---|---|---|---|
| Add tags to a member | P1 | :x: | Tag input with autocomplete from existing tags. |
| Create new tags inline | P1 | :x: | Type a new tag name and press Enter to create and apply. |
| Remove tags | P1 | :x: | Click X on tag to remove from member. Tag itself is not deleted. |
| Filter by tags | P1 | :x: | Tags appear as filter options in the member list. |
| Tag management page | P2 | :x: | Dedicated page to view all tags, rename, merge, delete unused. |
| Tag colors | P2 | :x: | Optional color per tag for visual differentiation. |

---

## 3. Family / Household Management

> Church admins think in families, not individuals. When a family of four starts attending, the admin wants to enter them as a unit -- not create four separate profiles and manually link them. Household management must be frictionless and forgiving.

### 3.1 Household Structure

| Feature | Priority | Status | Details |
|---|---|---|---|
| Create household | P0 | :x: | A household has a name (typically family last name, e.g., "The Kim Family") and a shared address. |
| Household roles | P0 | :x: | Each member in a household has a role: **Head**, **Spouse**, **Child**, **Other Adult**, **Other**. |
| Link existing members to household | P0 | :x: | Search for existing members and add them to a household with a role. |
| Shared address | P0 | :x: | Household has one address shared by all members. Individual members can override with a personal address. |
| Family view on profile | P0 | :x: | Member profile shows a "Family" card listing all household members with photo thumbnails, names, and roles. Clicking a family member navigates to their profile. |
| Create new member with household | P0 | :x: | When adding a new member, option to "Add to existing household" (search) or "Create new household" in the same flow. |
| Add family member from profile | P1 | :x: | From a member's profile, click "Add Family Member" to create a new person pre-linked to the same household. |
| Remove member from household | P1 | :x: | Removes the link only. The member profile is preserved. |
| Household primary contact | P1 | :x: | The Head or Spouse designated as the primary contact for communications. |
| Multiple households | P2 | :x: | A member can belong to more than one household (e.g., college student linked to both campus housing and family home). Rare edge case. |

### 3.2 Adding a New Family (Combined Flow)

The most common journey is a pastor adding a new family after their first visit. The flow must support entering 2-5 people in under 3 minutes.

| Feature | Priority | Status | Details |
|---|---|---|---|
| "Add Family" button on members list | P0 | :x: | Opens a multi-step form optimized for entering a family unit. |
| Step 1: Household info | P0 | :x: | Family name, shared address (optional). |
| Step 2: Add family members | P0 | :x: | Repeatable row: First name, Last name, Role (Head/Spouse/Child/Other), Email, Phone. Minimum 1 member. "Add another member" button. |
| Step 3: Review & save | P0 | :x: | Summary of all members to be created. Save creates the household and all member profiles in one transaction. |
| Duplicate detection during entry | P1 | :x: | As the admin types a name or email, system checks for existing members and offers to link instead of creating a duplicate. |
| Skip household for individuals | P0 | :x: | "Add Member" (singular) button for adding a person without a household. Household can be assigned later. |

---

## 4. Groups Management

> Groups are how churches organize people for ministry. Small groups, serving teams, classes, administrative committees -- they all follow the same pattern: a named collection of people with optional roles and metadata. The Groups UI must be discoverable from both the People sidebar and from individual member profiles.

### 4.1 Group List View

| Feature | Priority | Status | Details |
|---|---|---|---|
| Centralized group list page | P0 | :x: | Accessible from People > Groups in the CMS sidebar. Shows all groups across all types. |
| Grid view | P0 | :x: | Card layout showing group name, type badge, member count, leader name/photo, and description snippet. Responsive 1-4 columns. |
| List view | P1 | :x: | Table layout with sortable columns: Name, Type, Members, Leader, Created, Status. |
| View toggle (grid/list) | P1 | :x: | Toggle button to switch between grid and list views. Preference persisted. |
| Search groups | P0 | :x: | Real-time search across group name and description. |
| Filter by type | P0 | :x: | Filter badges or dropdown: All, Small Group, Serving Team, Ministry, Class, Administrative. |
| Filter by status | P1 | :x: | Active, Archived. |
| Sort options | P1 | :x: | Name A-Z/Z-A, Most/Fewest members, Newest/Oldest. |
| Empty state | P0 | :x: | "No groups yet" with illustration and "Create your first group" CTA. |

### 4.2 Group Types

| Type | Description | Example |
|---|---|---|
| **Small Group** | Regular fellowship gathering, typically weekly. | Friday Night Bible Study, Tuesday Women's Group |
| **Serving Team** | People who serve in a specific ministry area. | Worship Team, AV Team, Greeters |
| **Ministry** | People associated with a ministry program. | Youth Ministry, Children's Ministry |
| **Class** | Time-bound educational group. | New Member Class, Baptism Prep |
| **Administrative** | Church operations and leadership. | Elder Board, Finance Committee |

| Feature | Priority | Status | Details |
|---|---|---|---|
| Predefined group types | P0 | :x: | The five types above are system-defined. Each has a distinct icon and color. |
| Custom group types | P2 | :x: | Admin can create additional group types with custom name, icon, and color. |

### 4.3 Creating a Group

| Feature | Priority | Status | Details |
|---|---|---|---|
| Create group dialog | P0 | :x: | Modal form: Name (required), Type (required dropdown), Description (optional textarea), Leader (optional member search). |
| Group from template | P1 | :x: | Pre-configured group templates with suggested structure. E.g., "Small Group" template pre-fills weekly meeting fields, "Serving Team" template includes role slots (Leader, Co-leader, Member). |
| AI-generated group structure | P2 | :x: | Text prompt input: "Create a group for a 6-week marriage workshop" generates a group with name, description, type (Class), suggested meeting schedule, and session topics. |
| Duplicate group | P1 | :x: | Copy a group's structure (name, type, description, roles) without members. Useful for creating a new semester's groups. |

### 4.4 Group Detail Page

| Feature | Priority | Status | Details |
|---|---|---|---|
| Group header | P0 | :x: | Group name (editable), type badge, status badge, member count, description. |
| Member list | P0 | :x: | Table of group members: Photo, Name, Role (Leader/Co-leader/Member), Email, Phone, Date Joined. |
| Add members | P0 | :x: | Search for existing church members and add them to the group. Multi-select supported. |
| Remove members | P0 | :x: | Remove with confirmation. Member profile is not affected. |
| Assign group roles | P0 | :x: | Per-member role: Leader, Co-leader, Member. At least one Leader required. |
| Group meeting info | P1 | :x: | Meeting day, time, location, frequency. Displayed on group card and detail page. |
| Group communication | P2 | :x: | "Email Group" button that opens a compose form pre-addressed to all group members. |
| Group notes | P1 | :x: | Timestamped notes visible to group leaders and admins. |
| Archive group | P1 | :x: | Soft-archive. Group hidden from active views but data preserved. Members are not removed from the group. |

### 4.5 Subgroups

| Feature | Priority | Status | Details |
|---|---|---|---|
| Create subgroup within a group | P2 | :x: | A group can contain child groups (e.g., "Worship Team" > "Vocals", "Instruments", "Tech"). |
| Subgroup members inherit parent membership | P2 | :x: | Adding someone to a subgroup auto-adds them to the parent group if not already a member. |
| Subgroup display | P2 | :x: | Parent group detail page shows subgroups as collapsible sections or nested cards. |

### 4.6 Group Templates

| Feature | Priority | Status | Details |
|---|---|---|---|
| System-provided templates | P1 | :x: | Templates for common group types: "Weekly Small Group", "Sunday Serving Team", "New Member Class", "Bible Study Series". |
| Template includes | P1 | :x: | Pre-filled: type, description scaffold, suggested roles, meeting frequency. |
| Save custom template | P2 | :x: | Admin can save any group's structure as a reusable template. |

---

## 5. Roles

> Roles define a person's function within the church -- Speaker, Elder, Worship Leader, etc. Unlike groups (which are collections of people), roles are identity labels that connect a person to other CMS features. A person with the "Speaker" role appears in the sermon speaker dropdown. A person with the "Elder" role can be surfaced on the leadership page. Roles are the bridge between the People module and the rest of the CMS.
>
> **Key architectural decision:** The current standalone `Speaker` model is being replaced. Speakers are people in the congregation directory who happen to have a "Speaker" role. This eliminates duplicate data (name, photo, bio stored in both Speaker and a future Person table) and establishes a single source of truth.

### 5.1 Role System

| Feature | Priority | Status | Details |
|---|---|---|---|
| Assign roles to a person | P0 | :x: | A person can have zero or more roles. Roles are assigned from the profile page. |
| System default roles | P0 | :x: | Pre-created roles that cannot be deleted (see table below). |
| Custom roles | P0 | :x: | Church admin can create additional roles (e.g., "Parking Team Lead", "Nursery Volunteer", "Finance Committee"). |
| Role metadata | P0 | :x: | Each role has: name, slug (auto-generated), description (optional), `isSystem` (boolean -- true for defaults, undeletable), color (optional), icon (optional). |
| Role management page | P0 | :x: | Accessible from People > Settings > Roles (or "Manage Roles" button). Lists all system and custom roles with member counts. |
| Remove role from person | P0 | :x: | Removes the role assignment. Does not delete the role itself. |
| Delete custom role | P1 | :x: | Custom roles can be deleted. Confirmation dialog warns: "This role is assigned to X members. Removing it will unassign all of them." System roles cannot be deleted. |
| Edit role details | P1 | :x: | Change name, description, color, icon for any role (including system roles -- but slug and `isSystem` flag cannot be changed). |
| Role badge on profile | P0 | :x: | Roles displayed as colored badges on the member profile overview card and in list view. |

### 5.2 System Default Roles

These roles are pre-created for every church and cannot be deleted. They can be renamed or have their description/color edited.

| Role | Slug | Description | CMS Integration |
|---|---|---|---|
| **Speaker** | `speaker` | People who deliver sermons or messages. | Appears in CMS Messages "Speaker" dropdown. Replaces standalone `Speaker` table. |
| **Pastor** | `pastor` | Church pastoral leadership. | Can be surfaced on About/Leadership page. |
| **Elder** | `elder` | Church governance and oversight. | Can be surfaced on About/Leadership page. |
| **Deacon** | `deacon` | Church service and care ministry. | Can be surfaced on About/Leadership page. |
| **Worship Leader** | `worship-leader` | Music and worship ministry leaders. | Can be linked to worship-related events and groups. |

### 5.3 Speaker Role -- CMS Integration

> This is the most critical role integration. The Speaker role replaces the current standalone `Speaker` model, unifying people data into a single source of truth.

| Feature | Priority | Status | Details |
|---|---|---|---|
| Speaker dropdown queries People | P0 | :x: | The CMS message form's "Speaker" field queries `Person` records where role = "Speaker" instead of the standalone `Speaker` table. Dropdown shows: name, photo thumbnail, title (from Person profile). |
| Speaker profile fields | P0 | :x: | The `Speaker` model's fields migrate into the `Person` model: `title` (role-specific title, e.g., "Senior Pastor"), `bio` (already on Person), `photoUrl` (already on Person), `slug` (already on Person). |
| Speaker page on public website | P1 | :x: | The public website's speaker/preacher pages read from People with Speaker role instead of the Speaker table. |
| Quick-assign Speaker role | P1 | :x: | When creating a new message, if the admin types a speaker name that doesn't match any Person with Speaker role, prompt: "No speaker named [X] found. Would you like to create a new member with the Speaker role?" |

### 5.4 Speaker Migration Path

> The migration from the standalone `Speaker` table to `Person` + `PersonRole` must preserve all existing data and relationships.

| Step | Description | Priority | Status |
|---|---|---|---|
| 1. Create Person records | For each existing `Speaker`, create a `Person` record with matching name, slug, title, bio, photoUrl, email. | P0 | :x: |
| 2. Assign Speaker role | For each migrated Person, create a `PersonRole` record with role = "Speaker". | P0 | :x: |
| 3. Update Message references | Update `Message.speakerId` foreign key to point to the new `Person` record (or add a new FK `Message.personId` and deprecate `speakerId`). | P0 | :x: |
| 4. Update BibleStudy references | Same FK migration for `BibleStudy.speakerId`. | P0 | :x: |
| 5. Update CMS forms | Message editor and Bible study editor speaker dropdowns query People with Speaker role. | P0 | :x: |
| 6. Deprecate Speaker table | Mark `Speaker` model as deprecated. Remove after all references are migrated and verified. | P1 | :x: |

### 5.5 User Journeys for Roles

#### Journey: Assigning a Role to a Person

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | Member profile page | Admin views the Roles card. Currently shows "No roles assigned." Admin clicks "Add Role". | Role picker popover opens showing all available roles (system + custom), with search. |
| 2 | Role picker | Admin types "speak" and selects "Speaker". | Role is assigned. Toast: "Speaker role assigned to [Name]." |
| 3 | Member profile | Roles card now shows "Speaker" badge. Overview card also shows the role badge. | Person now appears in CMS message speaker dropdown. |

#### Journey: Creating a Custom Role

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | People > Settings > Roles | Admin clicks "Create Role". | Create role dialog opens. |
| 2 | Create role dialog | Admin enters: Name ("Sunday School Teacher"), Description ("Teaches children's Sunday School classes"), Color (orange). | Real-time preview of the role badge. |
| 3 | Create role dialog | Admin clicks "Create". | Toast: "Role created." Role appears in the role list and is immediately available for assignment. |

#### Journey: Viewing People by Role

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | Members list page | Admin clicks the "Filter" button. | Filter panel opens. |
| 2 | Filter panel | Admin selects Role filter: "Speaker". | Table filters to show only members with the Speaker role. Active filter count shows "1". |
| 3 | Members list | Admin sees all speakers with their profiles. | Can then bulk-select for group assignment, export, etc. |

#### Journey: CMS Speaker Integration

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | CMS > Messages > New Message | Admin opens a new message form. Clicks the "Speaker" dropdown. | Dropdown shows all People with role = "Speaker", displaying photo, name, and title. |
| 2 | Speaker dropdown | Admin selects "Pastor David Kim". | Speaker field populated. Photo thumbnail shown. |
| 3 | Speaker dropdown (no match) | Admin types a name not in the Speaker role list. | Below the search results: "No speaker found. Create new member with Speaker role?" link. Clicking opens the Add Member form with Speaker role pre-assigned. |

---

## 6. Data Table & Search / Filter

> The member list is the workhorse of the People module. It must handle a church of 50 members just as well as one of 5,000. Pastors should be able to find any person in seconds, not minutes.

### 6.1 Member Data Table

| Feature | Priority | Status | Details |
|---|---|---|---|
| Default columns | P0 | :x: | Name (photo + full name), Email, Phone, Status, Household, Groups (badge list), Tags. |
| Column visibility toggle | P0 | :x: | Popover to show/hide columns. User preference persisted. |
| Column sorting | P0 | :x: | Click column header to sort asc/desc. Visual indicator on active sort column. |
| Default sort | P0 | :x: | Last name A-Z. |
| Pagination | P0 | :x: | 25 rows per page default. Options: 10, 25, 50, 100. |
| Row click | P0 | :x: | Clicking a row navigates to the member profile detail page. |
| Row hover | P0 | :x: | Subtle highlight. Three-dot menu appears on hover with quick actions: Edit, Add to Group, Archive. |
| Checkbox selection | P0 | :x: | Per-row checkboxes for bulk actions. "Select all" checkbox in header. |
| Responsive mobile view | P1 | :x: | Card-based layout on narrow viewports showing photo, name, status, and contact info. |

### 6.2 Search

| Feature | Priority | Status | Details |
|---|---|---|---|
| Real-time search bar | P0 | :x: | Searches across first name, last name, preferred name, email, and phone number simultaneously. Debounced (300ms). |
| Search result highlighting | P1 | :x: | Matched text highlighted in results. |
| Recent searches | P2 | :x: | Dropdown showing last 5 searches. |

### 6.3 Filters

| Feature | Priority | Status | Details |
|---|---|---|---|
| Filter panel | P0 | :x: | Popover-based filter panel (consistent with Messages and Events filter UX). |
| Status filter | P0 | :x: | Multi-select badges: Visitor, Regular Attendee, Member, Inactive. (Archived excluded from default view.) |
| Group filter | P0 | :x: | Searchable dropdown. Filter to members in a specific group. |
| Role filter | P0 | :x: | Multi-select from system + custom roles. E.g., "Show all Speakers", "Show all Elders". |
| Household filter | P1 | :x: | Filter to members in a specific household, or "No household" for unlinked members. |
| Tag filter | P1 | :x: | Multi-select from existing tags. |
| Gender filter | P1 | :x: | Multi-select: Male, Female, Prefer not to say. |
| Age range filter | P1 | :x: | Min/max age sliders or inputs. Calculated from date of birth. |
| Date range filter | P1 | :x: | Filter by date added, membership date, or last activity date. |
| Campus filter | P1 | :x: | For multi-campus churches. Dropdown of campuses. |
| Custom field filters | P2 | :x: | Filter by any custom field value (dropdown fields only). |
| Active filter count | P0 | :x: | Badge showing number of active filters on the filter button. |
| Reset all filters | P0 | :x: | "Clear filters" button to reset all filters and search. |
| Saved filter presets | P2 | :x: | Save a combination of filters as a named preset (e.g., "Active Youth Members", "Newcomers This Month"). |

### 6.4 Bulk Actions

| Feature | Priority | Status | Details |
|---|---|---|---|
| Bulk action bar | P0 | :x: | Appears when 1+ rows are selected. Shows count ("3 selected") and action buttons. |
| Add to group | P0 | :x: | Opens group picker. Selected members are added to the chosen group. |
| Update status | P0 | :x: | Dropdown to change status for all selected members. Confirmation required. |
| Add tags | P1 | :x: | Tag input to add tags to all selected members. |
| Remove tags | P1 | :x: | Tag selector to remove specific tags from all selected members. |
| Export selection | P1 | :x: | Export selected members as CSV. |
| Archive | P1 | :x: | Archive all selected members. Confirmation dialog with count. |
| Send email | P2 | :x: | Opens compose form addressed to all selected members. |
| Delete permanently | P2 | :x: | Hard delete with double confirmation. Only available to Super Admins. |

---

## 7. CSV Import

> CSV import is how most churches will initially populate their member database. They are migrating from spreadsheets, Planning Center, Breeze, or Church Community Builder. The import must handle messy real-world data gracefully, with clear feedback and zero data loss.

### 7.1 Import Flow

| Feature | Priority | Status | Details |
|---|---|---|---|
| Import entry point | P0 | :x: | "Import" button on the members list page. Opens a multi-step import wizard. |
| Download template | P0 | :x: | Download a CSV template with all standard field headers (First Name, Last Name, Email, Phone, Status, Household, etc.). Includes 2-3 example rows. |
| Upload CSV | P0 | :x: | Drag-and-drop or file picker. Accepts .csv and .xlsx files. Max 10,000 rows. |
| File validation | P0 | :x: | Immediate feedback: file type check, row count, detected columns. Error if file is empty or unreadable. |

### 7.2 Column Mapping

| Feature | Priority | Status | Details |
|---|---|---|---|
| Auto-detect columns | P0 | :x: | System reads CSV headers and auto-maps to member fields based on common naming patterns (e.g., "First Name", "fname", "First", "Given Name" all map to First Name). |
| Manual column mapping | P0 | :x: | Dropdown per CSV column to select the target member field. "Skip this column" option. |
| AI-powered column mapping | P1 | :x: | Uses a small LLM to analyze headers + sample data and suggest mappings for ambiguous columns. E.g., "Cell" maps to Mobile Phone, "DOB" maps to Date of Birth. |
| Mapping preview | P0 | :x: | Shows first 5 rows of data with the mapped fields for visual confirmation. |
| Save mapping template | P2 | :x: | Save column mapping for reuse with future imports from the same source. |

### 7.3 Data Validation & Preview

| Feature | Priority | Status | Details |
|---|---|---|---|
| Row-by-row validation | P0 | :x: | Each row validated: required fields present, email format, phone format, date format, status values match allowed values. |
| Error summary | P0 | :x: | "X rows ready, Y rows have warnings, Z rows have errors." Expandable list of issues by row. |
| Warning vs. Error | P0 | :x: | Errors block import (e.g., missing first name). Warnings allow import with flag (e.g., unrecognized status value defaults to "Visitor"). |
| Preview table | P0 | :x: | Scrollable table showing all mapped data with color-coded rows (green = valid, yellow = warning, red = error). |
| Edit in preview | P1 | :x: | Click a cell in the preview table to fix data before importing. |
| Skip invalid rows | P0 | :x: | Option to import only valid rows and skip errored rows. Skipped rows downloadable as a separate CSV. |

### 7.4 Duplicate Detection

| Feature | Priority | Status | Details |
|---|---|---|---|
| Duplicate detection | P0 | :x: | Before import, system checks for existing members matching by: exact email, or (first name + last name + DOB), or phone number. |
| Duplicate resolution UI | P0 | :x: | For each potential duplicate: Show existing record side-by-side with import row. Options: "Skip (keep existing)", "Update existing with new data", "Create as new person". |
| Bulk duplicate resolution | P1 | :x: | "Skip all duplicates" and "Update all duplicates" batch actions. |

### 7.5 Family Linking During Import

| Feature | Priority | Status | Details |
|---|---|---|---|
| Household column | P1 | :x: | CSV can include a "Household" or "Family Name" column. Members with the same household value are grouped into a family. |
| Family role column | P1 | :x: | CSV can include a "Family Role" column (Head, Spouse, Child, Other). |
| Auto-create households | P1 | :x: | During import, system creates households and links members based on the Household column. |
| Shared address inference | P2 | :x: | If multiple members in the same household have the same address, system sets it as the household address. |

### 7.6 Import Execution

| Feature | Priority | Status | Details |
|---|---|---|---|
| Progress indicator | P0 | :x: | Progress bar showing rows processed / total. Estimated time remaining for large imports. |
| Import summary | P0 | :x: | After completion: "X members created, Y members updated, Z rows skipped." With breakdown of households and groups created. |
| Undo import | P1 | :x: | Within 24 hours, admin can undo an entire import (deletes all records created by that import). |
| Import history | P1 | :x: | Log of past imports: date, file name, row count, created/updated/skipped counts, imported by. |

---

## 8. Field Editor (Custom Fields)

> Every church has unique data needs. One church tracks spiritual gifts, another tracks T-shirt sizes for retreats, another tracks skills for serving teams. Custom fields let each church extend member profiles without code changes.

### 8.1 Field Types

| Field Type | Description | Priority | Status |
|---|---|---|---|
| Text (single-line) | Short text input (max 255 chars). | P1 | :x: |
| Text (multi-line) | Textarea for longer content. | P1 | :x: |
| Date | Date picker. | P1 | :x: |
| Dropdown (single-select) | Admin-defined options list. | P1 | :x: |
| Dropdown (multi-select) | Admin-defined options list, multiple selections. | P1 | :x: |
| Checkbox | Boolean toggle. | P1 | :x: |
| Number | Numeric input with optional min/max. | P2 | :x: |
| URL | Text input with URL validation. | P2 | :x: |
| File | File upload (PDF, image, document). | P2 | :x: |

### 8.2 Field Configuration

| Feature | Priority | Status | Details |
|---|---|---|---|
| Field editor page | P1 | :x: | Dedicated settings page: People > Settings > Custom Fields. |
| Create custom field | P1 | :x: | Form: Field name, field type, options (for dropdowns), required/optional toggle, description/help text. |
| Edit custom field | P1 | :x: | Change name, description, options. Changing type is restricted if data exists. |
| Delete custom field | P1 | :x: | Confirmation dialog warning that all data for this field will be lost. |
| Field ordering | P1 | :x: | Drag to reorder fields within a section. |
| Field sections | P1 | :x: | Group custom fields into collapsible sections (e.g., "Spiritual Info", "Emergency Contact", "Volunteer Details"). |
| Create/rename/delete sections | P1 | :x: | Sections are containers for organizational purposes only. |
| Required vs. optional | P1 | :x: | Toggle per field. Required fields show on the create member form. |
| Field-level permissions | P2 | :x: | Control which roles can view and edit each custom field. E.g., "Salary" visible only to Super Admins. |
| Default fields vs. custom | P0 | :x: | System-defined fields (name, email, phone, status, DOB, gender) cannot be deleted or have their type changed. They can be shown/hidden. |

---

## 9. Archive & Data Management

> Churches need to handle member departures gracefully. People move, become inactive, or request data removal. The system must support these transitions without losing historical data or breaking relationships.

### 9.1 Archive

| Feature | Priority | Status | Details |
|---|---|---|---|
| Archive a member | P0 | :x: | Soft delete. Profile hidden from normal views. Data fully preserved. |
| Archive from profile | P0 | :x: | "Archive" button in profile actions menu. Confirmation dialog: "Archiving [Name] will hide them from the member directory and active group lists. Their data is preserved and can be restored." |
| Bulk archive | P1 | :x: | Select multiple members in list view and archive. Confirmation with count. |
| View archived members | P0 | :x: | "Archived" tab or filter on members list. Shows all archived members in a separate view. |
| Restore from archive | P0 | :x: | "Restore" button on archived member profile. Restores to their previous status (or Inactive if previously Active/Member). |
| Bulk restore | P1 | :x: | Select multiple archived members and restore. |
| Archive reason | P1 | :x: | Optional dropdown when archiving: Moved away, Requested removal, Deceased, No longer attending, Other. |

### 9.2 Data Export

| Feature | Priority | Status | Details |
|---|---|---|---|
| Export all members | P0 | :x: | "Export" button on members list. Downloads CSV of all visible members (respects current filters). |
| Export columns | P0 | :x: | Export includes all visible columns plus an option to "Export all fields". |
| Export groups | P1 | :x: | Export group membership data as CSV. |
| Export households | P1 | :x: | Export household data with member links as CSV. |

### 9.3 Data Deletion (GDPR / Privacy)

| Feature | Priority | Status | Details |
|---|---|---|---|
| Permanent delete request | P2 | :x: | Admin can initiate a permanent deletion request for a member. 30-day grace period before irreversible deletion. |
| Deletion scope | P2 | :x: | Removes: profile data, notes, custom field values, group memberships, communication preferences. Preserves: anonymized giving records (legal requirement), group membership counts (aggregate only). |
| Deletion audit trail | P2 | :x: | Log entry: "Member data permanently deleted by [Admin] on [Date]. Reason: [Reason]." No PII in the log. |
| Data portability | P2 | :x: | Admin can export a single member's complete data as JSON/CSV upon request ("right to data portability"). |

---

## 10. Communication Preferences

> Members have the right to control how the church contacts them. This is not just a nice-to-have -- it is increasingly a legal requirement (CAN-SPAM, GDPR, TCPA). The system must track preferences clearly and respect them across all communication channels.

### 10.1 Channel Preferences

| Feature | Priority | Status | Details |
|---|---|---|---|
| Email opt-in/opt-out | P0 | :x: | Toggle on member profile. Default: opted in (for existing members). New members default based on church setting. |
| SMS opt-in/opt-out | P1 | :x: | Toggle on member profile. Default: opted out. Requires explicit consent. |
| Phone call opt-in/opt-out | P2 | :x: | Toggle on member profile. |
| Physical mail opt-in/opt-out | P2 | :x: | Toggle on member profile. |

### 10.2 Category Preferences

| Feature | Priority | Status | Details |
|---|---|---|---|
| Category-based preferences | P1 | :x: | Members can opt in/out of specific communication categories: General (church-wide), Events, Groups (their groups only), Newsletter, Prayer. |
| Default categories | P1 | :x: | Church configures which categories exist and their default opt-in state. |
| Custom categories | P2 | :x: | Admin can create additional categories (e.g., "Youth Updates", "Building Fund"). |

### 10.3 Compliance

| Feature | Priority | Status | Details |
|---|---|---|---|
| Unsubscribe record | P1 | :x: | When a member opts out, system records: timestamp, channel, method (admin change, member self-service, or email unsubscribe link). |
| Audit trail | P1 | :x: | Full history of preference changes for compliance review. |
| Bulk respect preferences | P0 | :x: | When sending emails via the Announcements module, opted-out members are automatically excluded. No admin override. |
| Self-service management (future) | P2 | :x: | Member portal where individuals can manage their own communication preferences. |

---

## 11. AI-Powered Features

> AI features should feel like a helpful assistant, not a black box. They must be transparent in what they do, optional to use, and cost-efficient for small churches that may be on a free or low-cost plan.

### 11.1 Natural Language People Search

| Feature | Priority | Status | Details |
|---|---|---|---|
| Search bar AI mode | P2 | :x: | Typing a natural language query in the search bar (e.g., "Show me families with children under 12") is parsed into a structured filter set and applied to the data table. |
| Query-to-filter translation | P2 | :x: | LLM receives the query plus the schema of available fields/filters and returns a structured filter object. Displayed to the user as applied filters so they can verify and adjust. |
| Example queries | P2 | :x: | Placeholder text rotates through examples: "Try: 'Members who joined this year'", "'Families in the Youth Ministry group'", "'People without an email address'". |
| Token-efficient approach | P2 | :x: | Uses a small/fast model (Claude Haiku). System prompt includes only the field schema, not actual data. Estimated cost: <$0.001 per query. |

### 11.2 Smart CSV Column Mapping

| Feature | Priority | Status | Details |
|---|---|---|---|
| AI column mapper | P1 | :x: | During CSV import, LLM analyzes column headers and first 3 data rows to suggest field mappings. |
| Confidence display | P1 | :x: | Each mapping shows a confidence indicator (High/Medium/Low). Low-confidence mappings are highlighted for manual review. |
| Token-efficient approach | P1 | :x: | Single LLM call with headers + 3 sample rows + target field list. Estimated cost: <$0.001 per import. |

### 11.3 Engagement Insights

| Feature | Priority | Status | Details |
|---|---|---|---|
| "At risk" member detection | P2 | :x: | System analyzes attendance frequency, giving patterns, and group participation to identify members trending toward disengagement. |
| Dashboard widget | P2 | :x: | "Members at Risk" card on CMS dashboard showing count and names of members with declining engagement. |
| Risk factors | P2 | :x: | Transparent reasoning: "Attended 3x/month in Sept, 1x in Oct, 0x in Nov. No giving since Oct. Left Youth Group." |
| Suggested actions | P2 | :x: | "Consider reaching out" with a one-click "Add Note" or "Send Email" action. |
| Token-efficient approach | P2 | :x: | Rules-based engine for detection (no LLM needed). LLM only used for natural language summary of risk factors. Batch-processed weekly. |

### 11.4 Group Template Generation

| Feature | Priority | Status | Details |
|---|---|---|---|
| Text prompt to group | P2 | :x: | Admin enters a prompt: "Create a group for a 6-week marriage workshop meeting Tuesday nights." LLM generates: group name, type (Class), description, meeting schedule, suggested session topics. |
| Review before creation | P2 | :x: | Generated structure shown as an editable preview. Admin can modify any field before saving. |
| Token-efficient approach | P2 | :x: | Single LLM call with prompt + group type schema. Estimated cost: <$0.002 per generation. |

### 11.5 Note Summarization

| Feature | Priority | Status | Details |
|---|---|---|---|
| Summarize pastoral notes | P2 | :x: | Button on member profile: "Summarize Notes." LLM reads all notes for a member and produces a 2-3 sentence summary of key themes, recent concerns, and follow-up items. |
| Privacy safeguard | P2 | :x: | Summary is generated on-demand, never stored. Notes remain the source of truth. |
| Token-efficient approach | P2 | :x: | Uses Claude Haiku. Notes are sent as-is (no retrieval needed). For members with many notes, only the last 20 are included. Estimated cost: <$0.005 per summarization. |

---

## 12. Core User Journeys

### Primary Journeys

#### Journey 1: Adding a New Member (with Optional Family Linking)

**Trigger:** A new family visited on Sunday. The pastor wants to add them to the system after the service.

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | Members list page | Admin clicks "Add Member" button (or "Add Family" for a family). | Modal or new page opens with the add member form. |
| 2 | Add Member form | Admin enters First Name, Last Name (required). Optionally fills Email, Phone, Gender, DOB, Status. | Real-time validation. Status defaults to "Visitor". |
| 3 | Household section of form | Admin can: (a) skip household, (b) search for an existing household, or (c) type a new household name to create one. | If creating new: household created with shared address fields. Member auto-assigned as Head. |
| 4 | Household section | If household selected/created, admin can optionally add more family members inline (First Name, Last Name, Role). | Each additional member row is validated independently. |
| 5 | Form footer | Admin clicks "Save". | Toast: "Member created successfully." If household was created: "Household '[Name]' created with [N] members." Redirects to the new member's profile page. |
| 6 | Member profile | Admin reviews the profile. Can add notes, tags, or assign to groups. | Profile displays all entered data. Family card shows linked members. |

**Error states:**
- Missing required field: Field highlighted red with inline error message. Save button disabled.
- Duplicate detected (email match): Warning banner: "A member with this email already exists: [Name]. Would you like to view their profile instead?" Options: "View Existing" / "Create Anyway".

---

#### Journey 2: Viewing / Editing a Member Profile

**Trigger:** Pastor needs to update a member's phone number or check what groups they belong to.

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | Members list page | Admin types member name in search bar. | Results filter in real-time. Matching members highlighted. |
| 2 | Search results | Admin clicks on the member row. | Navigates to member profile detail page. |
| 3 | Member profile | Admin views the overview card with contact info, family, groups, notes. | All sections are collapsed by default except Overview and Contact. |
| 4 | Contact section | Admin clicks "Edit" icon on the Contact card (or clicks the field directly in edit mode). | Fields become editable. |
| 5 | Contact section | Admin updates phone number. | Real-time validation on phone format. |
| 6 | Profile page | Admin clicks "Save Changes" button. | Toast: "Profile updated." Modified date updates. |

---

#### Journey 3: Importing Members from CSV

**Trigger:** Church is migrating from a spreadsheet. Pastor has a CSV export from their previous system.

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | Members list page | Admin clicks "Import" button. | Import wizard opens (Step 1: Upload). |
| 2 | Step 1: Upload | Admin drags a CSV file into the drop zone (or clicks to browse). | File is parsed. System shows: "File: members.csv, 142 rows detected, 12 columns found." |
| 3 | Step 2: Map Columns | System shows a table: CSV column header, Sample data (first row), Target field (auto-mapped dropdown). | Auto-mapping applies. Confident mappings show green check. Uncertain mappings show yellow warning. Unmapped columns show "Skip". |
| 4 | Step 2: Map Columns | Admin reviews and adjusts any incorrect mappings. Selects "Family Name" CSV column and maps it to "Household". | Mapping updates in real-time. Preview table below shows mapped data. |
| 5 | Step 3: Review | System shows validation summary: "128 rows valid, 9 rows with warnings (missing email), 5 rows with errors (missing first name)." | Expandable error/warning list with row numbers and specific issues. |
| 6 | Step 3: Review | Admin fixes errors by clicking on rows to edit inline, or chooses "Skip rows with errors". | Error count updates. |
| 7 | Step 3: Review | Duplicate detection: "3 potential duplicates found." Admin clicks to review. | Side-by-side comparison: existing vs. import row. Options per duplicate: Skip / Update / Create New. |
| 8 | Step 4: Import | Admin clicks "Import [X] Members". | Progress bar: "Importing... 42/128". Estimated time remaining. |
| 9 | Step 4: Complete | Import finishes. | Summary: "128 members created, 3 duplicates skipped, 5 errors skipped, 12 households created." Download link for skipped rows CSV. |
| 10 | Members list page | Admin returns to the member list. | New members appear in the list. |

---

#### Journey 4: Creating and Managing a Group

**Trigger:** Pastor wants to create a new Friday Night Bible Study group and add members.

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | Groups list page | Admin clicks "New Group" button. | Create group dialog opens. |
| 2 | Create dialog | Admin enters: Name ("Friday Night Bible Study"), Type (Small Group), Description. | Fields validate in real-time. |
| 3 | Create dialog | Admin clicks "Create Group". | Toast: "Group created." Navigates to group detail page. |
| 4 | Group detail page | Admin clicks "Add Members" button. | Member search popover opens. |
| 5 | Member search | Admin types a name. Matching members appear as a checklist. Admin checks 5 members. | Selected members highlighted with checkmarks. |
| 6 | Member search | Admin clicks "Add 5 Members". | Toast: "5 members added to Friday Night Bible Study." Member list on group page updates. |
| 7 | Group detail page | Admin clicks the role dropdown next to a member and selects "Leader". | Role badge updates. |

---

#### Journey 5: Searching for and Filtering Members

**Trigger:** Pastor wants to find all female members aged 18-30 for a women's retreat invitation.

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | Members list page | Admin clicks the "Filter" button. | Filter panel opens as a popover. |
| 2 | Filter panel | Admin selects Gender: "Female". | Filter applied. Table updates. Active filter count shows "1". |
| 3 | Filter panel | Admin sets Age range: 18-30. | Filter applied. Table updates. Active filter count shows "2". |
| 4 | Filter panel | Admin selects Status: "Member", "Regular Attendee". | Filter applied. Active filter count shows "3". |
| 5 | Members list | Table shows 23 matching members. | Results sorted by last name. |
| 6 | Members list | Admin clicks "Select All" checkbox. | All 23 members selected. Bulk action bar appears. |
| 7 | Bulk action bar | Admin clicks "Add to Group" and selects "Women's Retreat 2026". | Toast: "23 members added to Women's Retreat 2026." |
| 8 | Filter panel | Admin clicks "Clear Filters". | All filters reset. Full member list restored. |

---

#### Journey 6: Archiving a Member

**Trigger:** A family has moved to another city. Pastor wants to archive their profiles.

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | Member profile page | Admin navigates to the member's profile. | Profile loads. |
| 2 | Profile actions | Admin clicks the three-dot menu and selects "Archive". | Confirmation dialog: "Archive [Name]? They will be hidden from the member directory and active group lists. Their data is preserved and can be restored at any time." Optional: Reason dropdown (Moved away, etc.). |
| 3 | Confirmation dialog | Admin selects "Moved away" and clicks "Archive". | Toast: "Member archived." Redirects to members list. |
| 4 | Members list | Member no longer appears in default view. | If admin wants to see archived members, they switch to the "Archived" tab or apply the Archived filter. |

---

### Secondary Journeys

#### Journey 7: Creating a Household and Linking Existing Members

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | Member profile | Admin views a member who has no household. Clicks "Create Household" in the Family section. | Create household form opens. Pre-filled with the member's last name as household name and their address as household address. |
| 2 | Create household form | Admin confirms household name and address. Current member auto-assigned as Head. | Household created. |
| 3 | Create household form | Admin clicks "Add Family Member" and searches for the spouse (already in the system). | Search results appear. Admin clicks the spouse's name. |
| 4 | Create household form | Admin assigns role "Spouse" and clicks "Save". | Both members now show the household on their profiles. |

#### Journey 8: Setting Up Custom Fields

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | People > Settings > Custom Fields | Admin navigates to the custom fields editor. | Page shows default fields (read-only) and any existing custom fields. |
| 2 | Custom fields page | Admin clicks "Add Section" and names it "Volunteer Info". | New collapsible section created. |
| 3 | Custom fields page | Admin clicks "Add Field" within the section. Enters: Name ("Spiritual Gifts"), Type (Multi-select dropdown), Options ("Teaching, Leadership, Service, Mercy, Giving, Encouragement"). | Field created and appears in the section. |
| 4 | Member profile | Admin opens any member profile. "Volunteer Info" section appears with the "Spiritual Gifts" dropdown. | Admin can now select values for this field per member. |

#### Journey 9: Bulk Updating Member Statuses

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | Members list | Admin filters to Status: "Visitor", Date Added: "More than 6 months ago". | Table shows members who have been visitors for over 6 months. |
| 2 | Members list | Admin selects all matching members (15). | Bulk action bar appears: "15 selected". |
| 3 | Bulk action bar | Admin clicks "Update Status" and selects "Regular Attendee". | Confirmation dialog: "Update status for 15 members to 'Regular Attendee'?" |
| 4 | Confirmation dialog | Admin clicks "Update". | Toast: "15 members updated to Regular Attendee." Table refreshes with updated status badges. |

#### Journey 10: Viewing a Member's Family Connections

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | Member profile | Admin views the Family card. Shows: "The Park Family" with 4 members listed (photo, name, role). | All family members are clickable links. |
| 2 | Family card | Admin clicks on a child's name. | Navigates to the child's profile. That profile also shows the same Family card. |

#### Journey 11: Adding a Member to Multiple Groups

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | Member profile | Admin views the Groups card. Member is currently in 1 group. Admin clicks "Add to Group". | Group search popover opens. |
| 2 | Group search | Admin types "worship". "Worship Team" appears. Admin checks it. Types "prayer". "Prayer Group" appears. Admin checks it. | Two groups selected. |
| 3 | Group search | Admin clicks "Add to 2 Groups". | Toast: "Added to Worship Team and Prayer Group." Groups card now shows 3 groups. |

#### Journey 12: Exporting Filtered Member Data

| Step | Screen / Element | Action | System Response |
|---|---|---|---|
| 1 | Members list | Admin applies filters (e.g., Group: "Men's Ministry", Status: "Member"). | Table shows filtered results. |
| 2 | Members list | Admin clicks "Export" button. | Export options: "Export visible columns" or "Export all fields". Format: CSV. |
| 3 | Export | Admin selects "Export all fields" and clicks "Download". | CSV file downloads: `members-export-2026-02-27.csv`. Contains all filtered members with all fields including custom fields. |

---

## 13. Side Flows & Edge Cases

### 13.1 Deleting a Member Who Is a Group Leader

**Scenario:** Admin tries to archive a member who is the sole leader of a group.

**Behavior:**
- Warning dialog: "This member is the leader of [Group Name]. Archiving them will leave the group without a leader. Would you like to assign a new leader first?"
- Options: "Assign New Leader" (opens group member role editor), "Archive Anyway" (archives member, group flag shows "No Leader" warning on group detail and list).
- The group is NOT deleted. The member's group membership remains in the archived state for historical records.

### 13.2 CSV Import with Duplicates

**Scenario:** CSV contains 3 rows with the same email as existing members.

**Behavior:**
- Step 3 (Review) highlights duplicates with a yellow badge: "3 potential duplicates found."
- Each duplicate shows a side-by-side comparison: existing data vs. import data.
- Per-duplicate resolution: Skip (keep existing) | Update (overwrite existing with import data, only non-empty fields) | Create New (creates a separate profile).
- Batch options: "Skip All Duplicates" | "Update All Duplicates".
- If "Create New" is chosen for an email duplicate, the system warns: "This will create a second profile with the same email address. This may cause communication issues."

### 13.3 Archived Members in Group Lists

**Scenario:** A member who belongs to 3 groups is archived.

**Behavior:**
- The member is hidden from active group member lists by default.
- On the group detail page, a subtle note appears: "1 archived member" (clickable to expand and show the archived member dimmed/grayed out).
- Group member counts reflect only active members. "Worship Team: 8 members" does not count archived members.
- If the archived member is restored, they re-appear in all their groups automatically.

### 13.4 Family Connections When One Member Is Archived

**Scenario:** The spouse in a 4-person household is archived.

**Behavior:**
- The household still exists with 3 active members and 1 archived member.
- On active family members' profiles, the Family card shows: "3 members" (active). A subtle note: "1 archived member" (expandable).
- The archived member's profile (viewable from Archived tab) still shows the family connection.
- If the Head of household is archived: System prompts to assign a new Head from the remaining members.
- Archiving ALL members in a household does not delete the household. It remains recoverable.

### 13.5 Member Belonging to Multiple Households

**Scenario:** A college student is linked to both their parents' household and a campus housing group.

**Behavior:**
- P2 feature. For MVP, a member can only belong to one household.
- If implemented: Profile shows both households in the Family section with labels (e.g., "Family Home", "Campus Housing"). Each household has its own address and members.
- During CSV import, if a member appears with two different household values, the system flags it as a warning: "Member appears in multiple households."

### 13.6 Merging Duplicate Members

**Scenario:** Admin discovers two profiles for the same person (e.g., one from CSV import, one manually created).

**Behavior:**
- P1 feature. Admin can select two members and choose "Merge Profiles".
- Merge wizard shows a side-by-side comparison of all fields.
- For each field, admin picks which value to keep (or enters a new value).
- Merge combines: notes (all preserved), group memberships (union), tags (union), custom fields (admin picks), giving history (combined).
- The "losing" profile is hard-deleted after merge. An audit log entry records the merge.

### 13.7 Group Leader Leaves Group

**Scenario:** The only leader of a group is removed from the group.

**Behavior:**
- Warning: "Removing [Name] will leave this group without a leader. Would you like to assign a new leader?"
- Options: "Assign Leader" (opens role picker for remaining members) | "Remove Anyway" (group flagged with "No Leader" warning).

### 13.8 Empty Household

**Scenario:** All members are removed from a household (individually, not by archiving).

**Behavior:**
- Household becomes empty. It is not auto-deleted.
- Appears in a "Households > Empty" filter for cleanup.
- Admin can delete empty households manually or ignore them.

### 13.9 Archiving a Member with System Roles

**Scenario:** Admin archives a member who has the "Speaker" role and is assigned as the speaker on 5 published messages.

**Behavior:**
- Warning dialog: "This member has the Speaker role and is assigned to 5 published messages. Archiving them will NOT remove them from existing messages (historical records are preserved), but they will no longer appear in the Speaker dropdown for new messages."
- Options: "Archive" (proceeds, speaker dropdown excludes archived people) | "Cancel".
- Existing messages retain the speaker assignment (the person's name still appears on published sermons).
- If the member is restored, they re-appear in the Speaker dropdown automatically.

### 13.10 Deleting a System Role

**Scenario:** Admin tries to delete the "Speaker" system role.

**Behavior:**
- System roles cannot be deleted. The "Delete" button is either hidden or disabled with tooltip: "System roles cannot be deleted."
- System roles can be renamed and have their description/color edited, but the slug and `isSystem` flag cannot be changed.

---

## 14. Success Metrics

### 14.1 Efficiency Metrics

| Metric | Target | How to Measure |
|---|---|---|
| Time to add a new member | < 60 seconds | Average duration from clicking "Add Member" to profile creation (analytics event). |
| Time to add a new family (4 members) | < 3 minutes | Average duration of the "Add Family" flow from start to save. |
| Time to find a specific member | < 10 seconds | Average time from search input to row click (search analytics). |
| CSV import completion rate | > 90% | % of started imports that reach the "Import Complete" step without abandonment. |

### 14.2 Adoption Metrics

| Metric | Target | How to Measure |
|---|---|---|
| Member profiles created (first 30 days) | > 50% of congregation size | Count of active profiles vs. church size (from onboarding). |
| Groups created (first 30 days) | >= 3 | Count of groups created by each church. |
| Weekly active usage of People module | > 2 sessions/week | Unique admin visits to /cms/people/* per week. |
| CSV import usage (first 30 days) | > 50% of churches | % of churches that complete at least one import. |

### 14.3 Data Quality Metrics

| Metric | Target | How to Measure |
|---|---|---|
| Email coverage | > 80% of active members | % of non-archived members with a valid email. |
| Household linkage | > 60% of members | % of members assigned to a household. |
| Profile completeness | > 70% of fields filled | Average % of core fields (name, email, phone, status, DOB) populated per member. |
| Duplicate rate | < 2% | Duplicate detection hits during CSV import and manual creation. |

### 14.4 Engagement Metrics (Post-MVP)

| Metric | Target | How to Measure |
|---|---|---|
| Notes created per member/month | > 0.5 | Average notes added across all profiles per month. |
| Group assignment coverage | > 60% | % of active members in at least one group. |
| Filter usage | > 5 filter queries/week | Weekly count of filter applications. |

---

## CMS Navigation Placement

The People module is accessed from the CMS sidebar under the **People** group:

| Group | Menu Items |
|---|---|
| **People** | Members, Groups, Directory |

- **Members** -- Main member list, profiles, import, custom fields.
- **Groups** -- Group list, group details, templates.
- **Directory** -- Public-facing member directory configuration (P2, opt-in). Not in MVP scope.

---

## Database Considerations

This PRD anticipates the following new Prisma models (to be designed during implementation):

| Model | Purpose |
|---|---|
| `Person` | Core member profile (separate from `User` which is for CMS admin auth). Includes fields migrated from `Speaker`: title, bio, photoUrl, slug. |
| `Household` | Family/household container with shared address. |
| `HouseholdMember` | Join table: Person <-> Household with role. |
| `Group` | Church group (small group, serving team, etc.). |
| `GroupMember` | Join table: Person <-> Group with role and dates. |
| `Role` | Church-level role definition. Has `isSystem` flag (true for Speaker, Pastor, Elder, Deacon, Worship Leader -- undeletable). Custom roles created by admin. |
| `PersonRole` | Join table: Person <-> Role. A person can have multiple roles. |
| `PersonNote` | Timestamped notes on a person profile. |
| `PersonTag` | Join table: Person <-> Tag (reuses existing `Tag` model). |
| `CustomFieldDefinition` | Church-level custom field schema. |
| `CustomFieldValue` | Per-person custom field values. |
| `CommunicationPreference` | Per-person channel and category opt-in/out. |
| `ImportLog` | Record of CSV imports for undo and audit. |

All models follow the multi-tenant pattern: `churchId` as first param in all DAL functions, foreign key on all models.

> **Note:** The existing `ChurchMember` model is for CMS admin users (User <-> Church join table with admin roles). The new `Person` model represents people in the church directory -- a fundamentally different concept. A future enhancement may link a `Person` to a `User` for member portal access.

### Speaker Table Migration

> **Critical:** The existing `Speaker` model will be deprecated in favor of `Person` + `PersonRole(role=Speaker)`. This migration:
> - Creates a `Person` record for each existing `Speaker` (preserving name, slug, title, bio, photoUrl, email).
> - Assigns the "Speaker" `PersonRole` to each migrated Person.
> - Updates `Message.speakerId` and `BibleStudy.speakerId` foreign keys to reference `Person` instead of `Speaker`.
> - The `Speaker` table is retained temporarily for backward compatibility, then dropped after verification.
> - See section 5.4 for the detailed migration path.
