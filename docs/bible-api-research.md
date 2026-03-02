# Bible Text API Research

**Date:** 2026-03-02
**Goal:** Find APIs that can serve ESV and NIV text inline on the public site's Bible study pages.
**Current state:** Using bible-api.com which only supports KJV, ASV, WEB, YLT. The version dropdown silently maps ESV→KJV, creating a misleading 1:1 mismatch.

---

## Recommendation

**Use the ESV API (api.esv.org) for ESV + keep bible-api.com for KJV/ASV/WEB/YLT.** For NIV, pursue API.Bible approval — but in the near term, link out to BibleGateway for NIV and other unsupported versions.

This gives you honest 1:1 version matching for the 5 most important translations (ESV, KJV, ASV, WEB, YLT), with a clear path to add NIV when API.Bible access is approved.

| Version | Source | Status |
|---------|--------|--------|
| **ESV** | api.esv.org | Free API key signup, non-commercial church use |
| **KJV** | bible-api.com | Already working |
| **ASV** | bible-api.com | Already working |
| **WEB** | bible-api.com | Already working |
| **YLT** | bible-api.com | Already working |
| **NIV** | API.Bible | Requires signup + Biblica approval for NIV access |
| **Others** | BibleGateway link | External "Read on BibleGateway" link (current pattern) |

### Why ESV API is the clear first step
- ESV is the project default (`isDefault: true` in `bible-versions.ts`)
- Official Crossway API — properly licensed, no legal gray area
- Free for church/ministry use (5,000 queries/day)
- Returns clean HTML via `/v3/passage/html/` — drops directly into the existing `dangerouslySetInnerHTML` rendering
- API key signup takes ~minutes, approval is straightforward for church projects

### Why not Bolls.life (the "easy" option)
Bolls.life serves ESV/NIV with no auth and no rate limits, but has **no visible licensing from Crossway or Biblica**. Using it to display copyrighted text puts copyright liability on us. Not worth the risk.

---

## Full Research

### 1. ESV API (api.esv.org) — Crossway

| | |
|---|---|
| **URL** | https://api.esv.org |
| **Docs** | https://api.esv.org/docs/ |
| **Translations** | ESV only |
| **Auth** | API key via `Authorization: Token YOUR_KEY` header. Sign up at Crossway, create an "API Application," wait for approval. |
| **Rate limits** | 5,000/day, 1,000/hour, 60/minute. Max 500 verses per query. |
| **Pricing** | Free for non-commercial (church, ministry, personal). Commercial requires Crossway license. |
| **Response** | JSON. Endpoints: `/v3/passage/text/` (plain), `/v3/passage/html/` (formatted HTML), `/v3/passage/audio/`, `/v3/passage/search/` |
| **Attribution** | Required: "Scripture quotations are from the ESV® Bible, © 2001 by Crossway." Up to 500 verses without formal permission. Must not exceed 50% of any book or 25% of total work. |
| **Reliability** | Official, actively maintained, widely used. |

### 2. API.Bible (American Bible Society) — Path to NIV

| | |
|---|---|
| **URL** | https://scripture.api.bible |
| **Docs** | https://docs.api.bible |
| **Translations** | ~1,500 versions in 1,000+ languages. NIV listed but requires Biblica approval on your API key. ESV availability uncertain. |
| **Auth** | API key in `api-key` header. Sign up at scripture.api.bible/signup. |
| **Rate limits** | 5,000/day. Max 500 consecutive verses. |
| **Pricing** | Free for non-commercial. Commercial requires contacting support. |
| **Response** | JSON. Structured endpoints for Bibles, Books, Chapters, Verses, Passages. |
| **Attribution** | FUMS (Fair Use Management System) is mandatory — must include tracking JS (`fumsV3.min.js`) or manual GET callback. Reports usage to copyright holders. Full copyright notice required. |
| **Reliability** | Professional, backed by American Bible Society. |
| **NIV access** | Not automatic. Must request it; Biblica reviews and approves. |

### 3. bible-api.com (Current)

| | |
|---|---|
| **URL** | https://bible-api.com |
| **Translations** | KJV, ASV, WEB, YLT, Darby, BBE, DRA, OEB variants, WEBBE + non-English. **No ESV. No NIV.** |
| **Auth** | None. |
| **Rate limits** | 15 req / 30 seconds. |
| **Pricing** | Free. |
| **Response** | JSON with verses array. |
| **Reliability** | Open source (Tim Morgan). Simple, stable for what it supports. |

### 4. BibleGateway — No API
| | |
|---|---|
| **Translations** | 200+ including ESV, NIV, NKJV, NLT, NASB — everything. |
| **API** | **None.** No official API exists. |
| **Scrapers** | Several unofficial Node/Python scrapers exist. All fragile, likely ToS-violating. |
| **Recommendation** | Keep using BibleGateway as an external link (`getBibleGatewayUrl()`). Do not scrape. |

### 5. Bolls.life Bible API — Avoid

| | |
|---|---|
| **URL** | https://bolls.life/api/ |
| **Translations** | 100+ including ESV, NIV, NASB, NLT, NKJV. |
| **Auth** | None. No limits. |
| **Legal risk** | **No visible licensing from Crossway (ESV) or Biblica (NIV).** Serves copyrighted text freely. Copyright liability falls on the displayer (us), not the API. |
| **Recommendation** | **Do not use for copyrighted translations.** |

### 6. GetBible API

| | |
|---|---|
| **URL** | https://query.getbible.net/v2/ |
| **Translations** | 100+ via Crosswire/SWORD modules. ESV may be available. NIV unlikely. |
| **Auth** | None. |
| **Legal risk** | Same concern as Bolls.life for copyrighted versions. |
| **Recommendation** | Not recommended as primary source for ESV/NIV. |

### 7. Bible Brain (Digital Bible Platform)

| | |
|---|---|
| **URL** | https://www.faithcomesbyhearing.com/bible-brain |
| **Translations** | Text in 1,700+ languages. ESV text may be available. NIV uncertain. |
| **Auth** | API key required. Sign up at 4.dbt.io/api_key/request. |
| **Focus** | Audio Bibles primarily. Text is secondary. |
| **Recommendation** | Overkill for text-only. Better options exist (ESV API, API.Bible). |

### 8. bible.helloao.org

| | |
|---|---|
| **Translations** | 1,000+ but only public domain / freely licensed. BSB featured. **No ESV. No NIV.** |
| **Recommendation** | Cannot help with ESV/NIV. |

---

## Copyright Requirements

### ESV (Crossway)
- Up to 500 verses without formal permission
- Must not exceed 50% of any book or 25% of total work
- Full copyright notice required
- Non-commercial church/ministry use is covered
- **api.esv.org is the only authorized API source**

### NIV (Biblica / Zondervan)
- Up to 500 verses without express written permission
- Must not exceed a complete book or 25% of total work
- Full copyright notice: "Scripture quotations taken from The Holy Bible, New International Version® NIV® Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™"
- For church use, "(NIV)" at end of each quote suffices
- **API.Bible with Biblica approval is the legitimate path**

---

## Implementation Plan (after approval)

1. **Phase 1 (immediate):** Integrate ESV API
   - Sign up at api.esv.org, get API key
   - Add `ESV_API_KEY` env var
   - Create `lib/esv-api.ts` with `fetchEsvText(passage)` function
   - Update `/api/v1/bible` route to dispatch ESV requests to api.esv.org
   - Add ESV copyright attribution to the study detail view

2. **Phase 2 (when approved):** Integrate API.Bible for NIV
   - Sign up at scripture.api.bible, request NIV access
   - Add `API_BIBLE_KEY` env var
   - Create `lib/api-bible.ts` with FUMS tracking
   - Update `/api/v1/bible` route to dispatch NIV requests to API.Bible
   - Add NIV copyright attribution

3. **Phase 3:** Update version dropdown
   - Show all API-available versions (ESV, KJV, ASV, WEB, YLT + NIV when ready)
   - "More versions on BibleGateway" link for everything else
   - Honest 1:1 matching — what you select is what you get
