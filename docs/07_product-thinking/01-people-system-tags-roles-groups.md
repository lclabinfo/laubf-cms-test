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

**Effort to maintain:** High (maintain members, no payoff) → not worth it today.

---

## Summary Matrix

| System | Keep? | Why | Maintenance cost | Value |
|---|---|---|---|---|
| **Roles/Positions** | Yes | Powers website sections + dropdowns. Set-and-forget. | Very low | High |
| **Tags** | Yes, invisible | Ad-hoc filtering in Members list. Zero-overhead creation. | Near zero | Medium |
| **Groups** | Defer UI | No consumer feature exists yet. Pure overhead. | High | Zero (until communication/group pages exist) |

---

## Action Items

- [ ] Clean up redundant tags (shepherd, leader, campus-minister) from DB + seed
- [ ] Remove Groups link from CMS sidebar (keep schema)
- [ ] Consider renaming "Roles" to "Positions" in UI to avoid confusion with Admin Roles
- [ ] Build website section types that consume Roles data (leadership page, staff cards)
- [ ] Add tag filter chips to Members list view
- [ ] Re-evaluate Groups when communication or group website sections are planned
