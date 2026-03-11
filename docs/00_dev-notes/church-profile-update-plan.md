# Church Profile Update Plan

> Created: 2026-03-11
> Status: COMPLETE

## Overview

Fix incorrect church profile data in seed & DB, remove fake events, and ensure website sections are properly connected to church profile data from the database.

---

## Task 1: Fix Church Record in Seed — DONE

**File:** `prisma/seed.mts`

| Field | Old (WRONG) | New (Correct) |
|---|---|---|
| email | `info@laubf.org` | `laubf.downey@gmail.com` |
| phone | *(null)* | `(562) 396-6350` |
| address | `1020 S. Anaheim Blvd` | `11625 Paramount Blvd` |
| city | `Anaheim` | `Downey` |
| zipCode | `92805` | `90241` |
| facebookUrl | *(null)* | `https://facebook.com/losangelesubf` |
| instagramUrl | *(null)* | `https://instagram.com/la.ubf` |
| youtubeUrl | `https://www.youtube.com/@LAUBF` | `https://www.youtube.com/channel/UC1SRAeGrnVlvoEEMZ-htVlA` |

- [x] Update seed Church record
- [x] Sync with live DB

---

## Task 2: Fix SiteSettings in Seed — DONE

**File:** `prisma/seed.mts`

| Field | Old | New |
|---|---|---|
| contactAddress | `11625 Paramount Boulevard, Downey, CA` | `11625 Paramount Blvd, Downey, CA 90241` |
| youtubeUrl | `https://youtube.com/@laubf` | `https://www.youtube.com/channel/UC1SRAeGrnVlvoEEMZ-htVlA` |
| tiktokUrl | *(null)* | `https://www.tiktok.com/@la.ubf` |

- [x] Update seed SiteSettings record
- [x] Sync with live DB

---

## Task 3: Remove Fake Events from Seed — DONE

**Kept (4 recurring meetings matching Quick Links):**
1. `daily-bread-meeting` — Mon-Fri @ 6 AM (Zoom with password)
2. `evening-prayer-meeting` — Every Day @ 7:30 PM (Google Meet)
3. `mens-bible-study` — Sat @ 8 AM
4. `sunday-livestream` — Sun @ 11 AM (YouTube)

**Deleted (7 fake/outdated events):**
- `friday-night-bible-study`, `new-year-prayer-meeting-2026`, `csulb-welcome-week-spring-2026`, `easter-celebration-2026`, `winter-bible-academy-2026`, `ya-discipleship-program-spring-2026`, `vacation-bible-school-2026`

- [x] Trim EVENTS array to 4 recurring meetings only
- [x] Delete 7 fake events from live DB

---

## Task 4: Fix Footer YouTube Link in Seed — DONE

| Link | Old | New |
|---|---|---|
| LA UBF YouTube | `UCj419CtzNGrJ-1vtT2-DCQw` | `UC1SRAeGrnVlvoEEMZ-htVlA` |

- [x] Update footer menu YouTube URL in seed
- [x] Sync with live DB

---

## Task 5: Update Live DB to Match Seed — DONE

Script: `scripts/update-church-profile.mts`

- [x] Update Church record fields
- [x] Update SiteSettings record fields
- [x] Delete 7 non-recurring events
- [x] Update Daily Bread meeting URL (added password param)
- [x] Update footer menu YouTube URL
- [x] Update 2 PageSection content blocks (MINISTRY_SCHEDULE, LOCATION_DETAIL) — address standardized

---

## Task 6: Ensure Website Sections Are CMS-Connected — VERIFIED

### Already Connected (no work needed)
- **WebsiteNavbar** — reads from SiteSettings (logo, siteName, CTA)
- **WebsiteFooter** — reads from SiteSettings (contact, social links including TikTok, tagline)
- **MobileMenu** — reads from SiteSettings (logo, siteName, CTA)
- **ThemeProvider** — reads from ThemeCustomization
- **FontLoader** — reads from ThemeCustomization
- **Data sections** (ALL_MESSAGES, ALL_EVENTS, RECURRING_MEETINGS, etc.) — read from DAL

### Verified Connections
- [x] **FOOTER layout** (`website-footer.tsx`) — reads all social links (instagram, facebook, youtube, twitter, tiktok) + contact info from SiteSettings. No FOOTER section component seeded — footer is rendered by layout.
- [x] **LOCATION_DETAIL** section — address updated in PageSection content to `11625 Paramount Blvd, Downey, CA 90241`
- [x] **MINISTRY_SCHEDULE** section — address updated in PageSection content
- [x] **ABOUT_DESCRIPTION** section — uses content JSON (appropriate for per-section customization)
- [x] **RECURRING_MEETINGS** section — pulls from events DB via `resolve-section-data.ts` (now only 4 real recurring meetings)

### Architecture Notes
- Layout components (navbar, footer, mobile menu) read from **SiteSettings** — fully DB-connected
- Section components read from **PageSection.content** JSON or **resolve-section-data.ts** — content-driven by design
- This is correct architecture: layout = global church branding, sections = per-page content

---

## Correct Church Profile Data (Source of Truth)

### Identity
- **Name:** LA UBF
- **Full Name:** Los Angeles University Bible Fellowship
- **Tagline:** Los Angeles University Bible Fellowship
- **Description:** LA UBF (Los Angeles University Bible Fellowship) is a Bible-centered community raising lifelong disciples on college campuses and beyond.

### Contact
- **Email:** laubf.downey@gmail.com
- **Phone:** (562) 396-6350
- **Address:** 11625 Paramount Blvd, Downey, CA 90241

### Social Media
- **Instagram:** https://instagram.com/la.ubf
- **Facebook:** https://facebook.com/losangelesubf
- **YouTube:** https://www.youtube.com/channel/UC1SRAeGrnVlvoEEMZ-htVlA
- **TikTok:** https://www.tiktok.com/@la.ubf
- **Website:** https://laubf.org

### Service Times (Quick Links)
1. Daily Bread & Prayer — Mon-Fri @ 6 AM (Zoom)
2. Evening Prayer — Every Day @ 7:30 PM (Google Meet)
3. Men's Bible Study — Sat @ 8 AM (Zoom)
4. Sunday Livestream — Sun @ 11 AM (YouTube)

### Statement of Faith
1. Trinity: one God in three Persons (Father, Son, Holy Spirit)
2. Creation & Sovereignty: God created all things, is Sovereign Ruler
3. Biblical Authority: Bible is inspired, truth, final authority
4. Human Sinfulness: under bondage and power of sin since Adam's fall
5. Salvation Through Christ: Jesus Christ is the only way of salvation

### Core Values (3 Pillars)
1. Bible Study — personal knowledge of God through mentoring/small group
2. Discipleship — walking alongside to develop mature faith
3. Fellowship — community through worship, activities, retreats

### Campus Ministries
LBCC, CSULB, CSUF, UCLA, USC, CSUDH, CCC, Mt. SAC, Golden West, Cypress, Cal Poly Pomona
