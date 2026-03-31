# Seed vs Current DB — Differences

Generated 2026-03-12. Compares `prisma/seed.mts` expected data against live DB state.

## Record Count Comparison

| Model | Seed Expected | DB Actual | Match? | Notes |
|---|---|---|---|---|
| Church | 1 | 1 | YES | |
| Speaker | 21 | 21 | YES | |
| Series | 5 | 5 | YES | |
| Ministry | 5 | 5 | YES | |
| Campus | 12 | 12 | YES | |
| BibleStudy | 1,180 | 1,180 | YES | |
| BibleStudyAttachment | ~2,731 | 2,731 | YES | |
| Message | ~1,196 | 1,196 | YES | 260 video + study-only messages |
| MessageSeries | ~1,171 | 1,171 | YES | |
| Event | 10 | 10 | YES | |
| Video | 6 | 6 | YES | |
| DailyBread | 8 | 8 | YES | |
| Theme | 1 | 1 | YES | |
| ThemeCustomization | 1 | 1 | YES | |
| SiteSettings | 1 | 1 | YES | |
| Menu | 2 | 2 | YES | |
| MenuItem | 45 | 45 | YES | 12 footer + 33 header |
| Page | 25 | 25 | YES | 14 content + 11 campus detail |
| PageSection | 132 | 132 | YES | Verified per-page counts match seed |
| Person | 19 | 19 | YES | |
| PersonGroup | 2 | 2 | YES | |
| PersonGroupMember | 12 | 12 | YES | |
| CustomFieldDefinition | 5 | 5 | YES | |
| CustomFieldValue | 2 | 2 | YES | |
| PersonTag | ~27 | 27 | YES | 4 distinct tags across 19 people |
| CommunicationPreference | 5 | 5 | YES | |
| PersonRoleDefinition | 3 | 3 | YES | |
| PersonRoleAssignment | 27 | 27 | YES | |
| User | 1 (seed) | 5 | **DIFF** | 4 extra users created via CMS/auth |
| ChurchMember | 1 (seed) | 1 | YES | Only 1 member despite 5 users |
| Role | 4 | 4 | YES | Owner, Admin, Editor, Viewer |
| PersonNote | 5 | 5 | YES | |
| MediaAsset | 103 | 103 | YES | 93 general + 6 event templates + 4 event covers |
| MediaFolder | 2 | 2 | YES | |
| bible_verses | ~342K | 342,069 | YES | Full ESV Bible |
| Announcement | 0 | 0 | YES | Not seeded |
| PrayerRequest | 0 | 0 | YES | Not seeded |
| ContactSubmission | 0 | 0 | YES | Not seeded |

## Detailed Differences

### 1. Church — Settings JSON Drift

The Church record's `settings` JSON has been modified via CMS:

**Seed:** No `savedAddresses`, `worshipServices`, `emails`, `phones`, or `extraSocialLinks` in settings (these are set via the church profile page).

**DB now has:**
```json
{
  "emails": [{"label": "General", "value": "laubf.downey@gmail.com"}],
  "phones": [{"label": "Main", "value": "(562) 396-6350"}],
  "description": "LA UBF (Los Angeles University Bible Fellowship)...",
  "savedAddresses": [{"id": "...", "label": "LA UBF Main Center", "isPrimary": true, "address": "11625 Paramount Blvd", "city": "Downey", "state": "CA", "zip": "90241"}],
  "worshipServices": [{"day": "Sunday", "startTime": "11:00", "endTime": "12:30", "description": "Sunday Worship Service"}],
  "extraSocialLinks": [{"url": "https://www.tiktok.com/@la.ubf", "platform": "tiktok"}]
}
```

**What changed:** `savedAddresses`, `worshipServices`, `emails`, `phones`, `extraSocialLinks` were all added via the Church Profile CMS page. The seed sets the top-level Church fields (email, phone, address, socialUrls) but the settings JSON sub-objects are populated by the CMS UI.

### 2. Users — 4 Extra Users

**Seed:** 1 user (Admin User / set via AUTH_TEST_EMAIL env var)

**DB has 5 users:**
| firstName | lastName | email |
|---|---|---|
| Admin | User | (from AUTH_TEST_EMAIL env var) |
| David | Lim | david.lim@berkeley.edu |
| David | Lim | davidlim010@gmail.com |
| David | Lim | limad27@gmail.com |
| John | Kwon | astrialimit@gmail.com |

**Source:** The 4 extra users were created via Google OAuth login or credential signup. Only the seed user (Admin User) has a ChurchMember record.

### 3. MediaAsset — RESOLVED

**Previously:** 4 event cover images were uploaded via CMS but not in the seed.

**Fix:** Added 4 event cover images to `prisma/seed.mts` as MediaAsset entries in the "Events" folder, and added `coverImage` to Spring Bible Conference event. Seed now creates 103 assets (93 general + 6 event templates + 4 event covers).

### 4. MenuItem — No Differences

**Seed:** 45 items (12 footer + 33 header). **DB:** 45 items. Exact match after careful recount.

### 5. PageSection — No Differences

**Seed:** 132 sections across 25 pages. **DB:** 132 sections. Exact match after careful recount.

### 6. ThemeCustomization — Font Fields Null

**Seed sets:** Custom fonts (Helvetica Neue, strude, DM Serif Display)

**DB shows:**
```json
{
  "headingFont": null,
  "bodyFont": null,
  "primaryColor": "#0D0D0D",
  "secondaryColor": "#3667B1",
  "backgroundColor": "#FAFAFA",
  "textColor": "#0D0D0D",
  "headingColor": "#0D0D0D",
  "baseFontSize": 16,
  "borderRadius": "0.5rem",
  "customCss": null
}
```

**What changed:** `headingFont` and `bodyFont` are `null` in the DB, despite the seed setting custom font values. These were likely cleared via the Theme Manager CMS page. The colors and other settings match the seed.

### 7. Event — No Data Differences

All 10 events match exactly:
- 4 recurring: Daily Bread & Prayer, Evening Prayer, Men's Bible Study, Sunday Livestream
- 6 one-time: Spring Bible Academy, Spring Bible Conference, World Mission Congress, NA Young Adult Conference, JBF/HBF Conference, Summer Bible Conference

### 8. Pages — No Structural Differences

All 25 pages present with correct slugs, publish status, and sort orders. Section counts per page match seed expectations.

## Summary

The DB is very close to seed state. Only 3 remaining differences, all from normal CMS usage:

1. **Church settings JSON** — enriched via Church Profile page (emails, phones, worship services, addresses, social links)
2. **4 extra Users** — created via OAuth login (being addressed separately)
3. **ThemeCustomization fonts cleared** — edited via Theme Manager (to be fixed later)

All other models (MediaAssets, MenuItems, PageSections, Events, Messages, Bible Studies, Speakers, Pages, etc.) match seed expectations exactly.
