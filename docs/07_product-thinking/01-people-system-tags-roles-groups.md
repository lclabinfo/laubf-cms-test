# People System: Tags, Roles & Groups

> Brainstormed 2026-03-12. Evaluates whether Tags, Roles, and Groups each justify their existence for the church admin persona.

---

## The Core Question

For Pastor William — a person whose primary job is ministry, not data management — every feature needs to pass a simple test: **does this save me time or help me do ministry better?** If it just creates more data to maintain, it's a net negative.

Each system must either:
- **(a)** Make the website better automatically, or
- **(b)** Save time on a weekly task

If it does neither, it shouldn't be in the sidebar.

---

## Current State (as of 2026-03-12)

| System | Model | Records | CMS Page | Website Usage |
|---|---|---|---|---|
| Roles | `PersonRoleDefinition` + `PersonRoleAssignment` | 3 roles, 27 assignments | `/cms/people/roles` (just added to sidebar) | None yet |
| Tags | `PersonTag` | 27 tags across 19 people (4 distinct: shepherd, bible-teacher, leader, campus-minister) | Inline on person edit | None |
| Groups | `PersonGroup` + `PersonGroupMember` | 0 (deleted from DB + seed) | `/cms/people/groups` (in sidebar) | None |

### How Each System Works

**Roles (PersonRoleDefinition):**
- Structured positions with slug, color, icon, `isSystem` flag
- 3 current roles: Speaker (19 people), Pastor (3 people), Bible Study Leader (5 people)
- Used as filter presets — e.g., `SpeakerSelect` calls `/api/v1/people/by-role/speaker`
- Has a management page with full CRUD

**Tags (PersonTag):**
- Freeform string labels attached to a Person
- Created inline when editing a person profile
- No management page, no filter UI in Members list yet
- Current tags overlap significantly with Roles (shepherd ≈ Pastor, bible-teacher ≈ Bible Study Leader)

**Groups (PersonGroup):**
- Named groups with a photo, description, and member list
- Previously had 2 groups (Sunday Bible Study, Worship Team) — deleted because no feature consumes them
- Schema still exists in Prisma, UI page still in sidebar

---

## Analysis

### Roles → Keep. Reframe as "Positions."

**What it does:** Organizational hierarchy labels that double as filter presets for dropdowns.

**Challenge:** The speakers dropdown could just show all members ranked by message count. Roles feel like overhead for a small church.

**Why it earns its place:** Roles aren't primarily for filtering — they're for **the website**. From the visitor's perspective:

- "Meet Our Pastors" section on the About page → needs to know who's a pastor
- "Our Leadership" page → needs to pull people by position
- Staff directory widget → roles determine who shows up and in what order

This is a **set-and-forget** content type (per PRD). The pastor sets roles once when someone joins leadership, and the website automatically reflects it everywhere. No manual page edits needed.

**Concrete value:**
1. Website sections auto-populate from roles (speakers page, leadership page, staff cards)
2. Dropdowns pre-filter by role (already working for speakers)
3. Permissions could inherit from roles (e.g., "Bible Study Leader" role auto-grants `studies.edit`)

**Rename consideration:** "Positions" maps better to church mental models. Church admins think "Pastor William is in the Pastor *position*" not "Pastor William has the Pastor *role*." It also avoids confusion with Admin Roles (the CMS permission system at `/cms/admin/roles`).

**Effort to maintain:** Very low — only changes when leadership changes.

#### Open Question: Ministry Leadership & Positions

There's a tension between managing leadership at the **ministry level** vs. the **person level**. Currently the `Ministry` model has zero connection to people — no leader field, no members. But each ministry's website page has a `MEET_TEAM` section with **hardcoded JSON** listing team members (names, roles, bios, photos). This data is completely disconnected from the Person table.

The intuitive UX would be: **set leaders within each ministry's edit page**. The pastor thinks "I'm editing the Young Adult Ministry, let me set who leads it" — not "Let me go to the Positions page and assign someone a 'YAM Leader' position."

**Proposed flow:**
1. Ministry edit page gets a "Leadership" section with a people picker
2. Assigning someone as a ministry leader **auto-creates** a scoped position (e.g., "Young Adult Ministry > Leader")
3. These ministry-scoped positions appear in the Positions page for cross-cutting visibility
4. The `MEET_TEAM` website section dynamically pulls from this data instead of hardcoded JSON

This means Positions serve **dual entry points**: direct assignment on the Positions page (for church-wide roles like Pastor, Speaker) and inline assignment on the Ministry edit page (for ministry-scoped leadership). Both write to the same underlying `PersonRoleAssignment` model.

**Why this matters:** 14+ ministry pages currently have hardcoded team member JSON in `PageSection.content`. Converting these to dynamic data eliminates a whole category of stale content — when leadership changes, the pastor updates the ministry page once and the website reflects it everywhere. This directly serves PRD user story #1: *"keep the website content accurate and up-to-date with minimal effort."*

---

### Tags → Keep, but make invisible until needed.

**What it does:** Freeform labels on people.

**Challenge:** Currently overlaps with roles and provides zero functional value. They're decorative metadata.

**Why it earns its place (if done right):** Tags shine when they're **incidental, not curated**. The value isn't in browsing a tag management page — it's in quick ad-hoc grouping:

- "Show me everyone tagged 'retreat-2026'" when planning the retreat committee
- "Who's tagged 'new-member'?" for follow-up
- "Tag these 5 people as 'potluck-volunteers'" for a one-time event

Tags = **lightweight, temporary, ad-hoc grouping** that doesn't warrant creating a formal role or group.

**Design principles:**
- No dedicated "Tags Management" page. Tags are created inline when editing a person.
- Tags appear as filter chips in the Members list view.
- Auto-suggest existing tags to prevent duplicates.
- No tag management overhead — unused tags fade naturally.
- **Tags should cost zero effort to create and near-zero effort to maintain.**

**Current cleanup needed:**
- Delete `shepherd` → covered by Pastor role
- Delete `leader` → too vague, meaningless
- Delete `campus-minister` → should be a Position/Role if it matters
- Evaluate `bible-teacher` → overlaps with Bible Study Leader role; only keep if it means something distinct

**Recommendation:** Start with zero tags and let them grow organically from real usage.

**Effort to maintain:** Near zero (created inline, no management page).

---

### Groups → Defer. Remove from sidebar.

**What it would do:** Organize people into named groups (Sunday Bible Study, Worship Team, Small Group A).

**Challenge:** No current CMS or website feature consumes group data. The pastor would maintain it, but nothing uses it. Pure overhead.

**Future use cases (all require features that don't exist yet):**
1. **Group-specific communication** — "Email everyone in the Worship Team" (requires messaging/email feature)
2. **Group pages on the website** — "Small Groups" page auto-populating each group with members, meeting times, leader (requires website section type)
3. **Attendance/check-in** — "Mark who showed up to Wednesday Bible Study" (requires check-in feature)
4. **Group-based permissions** — "Worship Team members can edit the worship schedule" (requires granular permission mapping)

None of these features exist. Building Groups without a consumer is exactly the kind of complexity-for-complexity's-sake that the PRD warns against: *"the platform can grow with us without forcing complexity upfront."*

**Recommendation:** Keep the `PersonGroup` model in Prisma (costs nothing), but **remove Groups from the CMS sidebar** until a consuming feature is built. When email/communication or group website sections ship, Groups earns its sidebar spot back.

**Note:** Much of what Groups would do can also be achieved with Positions/Roles. A "Worship Team" group is functionally similar to a "Worship Team Member" position — both associate a set of people with a label. The difference is that groups imply **ongoing interaction** (meetings, attendance, communication) while positions imply **identity/hierarchy**. Until a feature requires the interaction layer, positions cover the organizational need.

**Effort to maintain:** High (maintain members, no payoff) → not worth it today.

---

## Summary Matrix

| System | Keep? | Why | Maintenance cost | Value |
|---|---|---|---|---|
| **Roles/Positions** | Yes | Powers website sections + dropdowns. Set-and-forget. | Very low | High |
| **Tags** | Yes, invisible | Ad-hoc filtering in Members list. Zero-overhead creation. | Near zero | Medium |
| **Groups** | Defer UI | No consumer feature exists yet. Pure overhead. | High | Zero (until communication/group pages exist) |

---

## Naming: "Roles" vs "Positions" vs Something Else

> Added 2026-03-12. Thinking through what to call this system as its scope expands.

The original proposal was to rename "Roles" → "Positions" to avoid confusion with Admin Roles (the CMS permission system). But as the system absorbs more responsibility (ministry leadership, general organizational structure, website auto-population), "Positions" starts to feel too formal and narrow.

**The problem with "Positions":** It implies a fixed organizational chart. Works for "Pastor" and "Director of Children's Ministry" — feels odd for "Speaker" (which is really just "person who has given a message") or "Retreat Volunteer" (temporary). If the system absorbs what Groups and Tags would do, it needs a name that covers both permanent hierarchy and flexible categorization.

**Options considered:**

| Name | Pros | Cons |
|---|---|---|
| **Positions** | Clear org-chart mental model, avoids "role" confusion | Too rigid for ad-hoc assignments (speaker, volunteer) |
| **Roles** | Already in codebase, familiar concept | Conflicts with Admin Roles in CMS |
| **Titles** | Church-friendly language | Implies personal titles, not group membership |
| **Labels** | Flexible, low-commitment | Too generic, sounds like tags |
| **Roles** (keep, disambiguate) | No rename work, familiar | Requires clear UI separation from Admin Roles |

**Decision: TBD** — leaning toward keeping "Roles" in the People section and relying on UI context to disambiguate (People > Roles vs Admin > Roles). The word "role" is the most natural fit for the full range of use cases.

### Concrete Examples: Where People Appear on the Website Today

Auditing the current website reveals these people-display contexts, which inform what roles/positions would look like in practice:

| Website Context | What's Displayed | Current Data Source | Ideal Data Source |
|---|---|---|---|
| **MEET_TEAM sections** (14+ ministry pages) | Name, role title, bio, photo | Hardcoded JSON in `PageSection.content` | Dynamic from Person + ministry-scoped role |
| **Message cards** (messages list, homepage spotlight) | Speaker name | `Message → Speaker.name` (legacy Speaker table) | `Message → Person.name` via Speaker role |
| **Message detail page** | "Message by [speaker]" | `Message.speaker.name` | Person with Speaker role |
| **Bible study detail** | Messenger name | `BibleStudy.speaker.name` | Person with Speaker role |
| **Speaker filter dropdown** (messages page) | All unique speaker names | Extracted from Message records | People with Speaker role |

**Example positions/roles that would serve real website needs:**

| Role | Type | People | Website usage |
|---|---|---|---|
| **Pastor** | Church-wide, permanent | 3 | About page leadership section, staff cards |
| **Speaker** | Church-wide, functional | 19 | Message attribution, speaker filter, speaker profiles |
| **Bible Study Leader** | Church-wide, functional | 5 | Bible study attribution, leader directory |
| **Campus Minister** | Church-wide, permanent | 2 | Campus pages, staff directory |
| **YAM Leader** | Ministry-scoped | ~3 | Young Adult Ministry MEET_TEAM section |
| **Children's Ministry Leader** | Ministry-scoped | ~2 | Children's Ministry MEET_TEAM section |
| **Worship Team Leader** | Ministry-scoped | ~1 | Worship page MEET_TEAM section |

The church-wide roles are managed on the Roles/Positions page. The ministry-scoped roles are managed inline on each ministry's edit page. Both write to `PersonRoleAssignment` and both auto-populate website sections.

---

## Action Items

### Immediate
- [ ] Clean up redundant tags (shepherd, leader, campus-minister) from DB + seed
- [ ] Remove Groups link from CMS sidebar (keep schema)
- [ ] Decide on naming: keep "Roles" or rename to "Positions"

### Near-term
- [ ] Add "Leadership" people-picker to Ministry edit page → auto-creates ministry-scoped roles
- [ ] Convert hardcoded MEET_TEAM JSON sections to dynamic Person data via roles
- [ ] Add tag filter chips to Members list view
- [ ] Migrate legacy `Speaker` table references to Person + Speaker role (messages, bible studies)

### Future
- [ ] Build website section types that consume Roles data (leadership page, staff cards, speaker profiles)
- [ ] Re-evaluate Groups when communication or group website sections are planned
- [ ] Consider role-based CMS permission inheritance (e.g., Bible Study Leader → `studies.edit`)

---

## Final Recommendation: People System Architecture

> Synthesized 2026-03-12. High-level plan for how the people system should work across CMS and website.

### Design Philosophy

- **One person, one record.** Every real human in the church is a single `Person` entry. Everything else — what they do, where they serve, how they're categorized — attaches to that record.
- **Roles are the connective tissue between people and the website.** A role answers the question: "What does this person do in the church?" The website uses that answer to automatically show the right people in the right places.
- **Tags are scratch paper.** Lightweight, disposable, zero-ceremony labels for internal CMS filtering. Never shown on the public website.
- **Groups are deferred.** The schema exists, but the UI stays hidden until a feature (communication, attendance, small group pages) needs it.

### The Roles System (single unified concept)

- A **role** is a named label (Pastor, Speaker, Bible Study Leader, YAM Leader) that can be assigned to any person
- Roles come in two scopes:
  - **Church-wide** — applies globally (Pastor, Speaker, Campus Minister). Managed on the People > Roles page.
  - **Ministry-scoped** — applies within a specific ministry (YAM Leader, Children's Ministry Director). Created and managed inline on the ministry edit page.
- Both scopes write to the same data model (`PersonRoleDefinition` + `PersonRoleAssignment`) and appear together on the Roles overview page for cross-cutting visibility
- A person can hold multiple roles simultaneously (e.g., Pastor + Speaker + Adult Ministry Leader)
- Roles are **set-and-forget** — the pastor updates them when leadership changes, not weekly

### How Roles Power the Website (automatically)

- **Ministry pages**: The `MEET_TEAM` section pulls people dynamically by ministry-scoped roles instead of hardcoded JSON. When a ministry leader changes, the pastor updates the role assignment once → the website updates everywhere.
- **Messages & Bible Studies**: Speaker attribution reads from people with the Speaker role, replacing the legacy `Speaker` table. The speaker dropdown pre-filters by this role but allows selecting any member.
- **Leadership / About pages**: Sections like "Meet Our Pastors" or "Our Staff" query people by church-wide roles. Adding a new pastor to the role automatically adds them to these pages.
- **Campus pages**: Campus Minister role populates campus-specific staff sections.

### How Tags Work (minimal, internal-only)

- Created inline on the person edit form — type a tag name, press enter
- Auto-suggests existing tags to avoid duplicates
- Filterable in the Members list view via filter chips
- No dedicated management page — tags exist only as long as they're attached to people
- Never surfaced on the public website
- Use cases: `new-member`, `retreat-2026-attendee`, `potluck-volunteer`, `needs-follow-up`

### How Groups Work (deferred)

- Schema stays in Prisma, UI hidden from sidebar
- Groups become relevant when any of these ship: email/SMS communication, attendance tracking, small group website pages
- Until then, roles cover the organizational need (a "Worship Team" role is sufficient without the interaction layer that groups would add)

### CMS Entry Points

- **People > Members** — the person directory. View all people, filter by role or tag, edit individual profiles.
- **People > Roles** — manage church-wide role definitions + see all role assignments across the church (including ministry-scoped ones). This is the cross-cutting overview.
- **People > Ministries > [edit]** — inline leadership picker. Assign people to ministry-scoped roles directly from the ministry context, which is where the pastor naturally thinks about leadership.
- **Tags** — no dedicated page. Created and managed inline on person profiles, consumed via filters on the Members list.

### What This Eliminates

- **Hardcoded team member JSON** in 14+ `PageSection.content` entries → replaced by dynamic role queries
- **Legacy `Speaker` table** → replaced by Person records with the Speaker role (migration path)
- **Redundant tags** that duplicate roles (shepherd, leader, campus-minister) → cleaned up
- **Groups UI overhead** with no consuming feature → hidden until needed
- **Stale website content** when leadership changes → automatic updates via role-driven sections
