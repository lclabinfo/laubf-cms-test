# Hero Mobile Video Investigation

> Mobile video works on localhost but not on hosted server.
> 7-agent investigation conducted 2026-03-24.

---

## Root Cause Found

The **seeded homepage hero section** (`prisma/seed.mts`) was created with only
`backgroundImage` — no `backgroundVideo` field at all. When you open this section
in the editor:

1. `content.backgroundVideo` is `undefined`
2. Editor falls back to `{ src: "", mobileSrc: "" }`
3. You set the desktop video → saves `backgroundVideo: { src: "desktop-url", mobileSrc: "" }`
4. You set the mobile video → spreads `{ ...bgVideo, mobileSrc: "mobile-url" }`

This works correctly IF both steps run in order. But the critical question is
**which database** the content was saved to.

Local dev and the hosted server use separate `.env` files pointing to potentially
different PostgreSQL instances. If you uploaded the mobile video through the
**local builder** (localhost:3000), that content only exists in your local database.
The server's database still has the old hero content without the mobile video.

---

## How to Verify

On the server:

```bash
cd /home/ubfuser/digital_church/laubf_cms
npx prisma db execute --stdin <<< "SELECT content->'backgroundVideo' FROM \"PageSection\" WHERE \"sectionType\" = 'HERO_BANNER' LIMIT 1;"
```

- Returns `null` → mobile video was never saved to the server's database
- Returns `{"src": "...", "mobileSrc": ""}` → saved but mobileSrc is empty
- Returns `{"src": "...", "mobileSrc": "..."}` → data exists, issue is elsewhere

---

## 7-Agent Investigation Results

### Agent 1: Data Flow Trace

**Task:** Trace the complete path from database to rendered video element.

**Findings:**
- `getPageBySlug()` returns `content` as Prisma JSONB — no `select` clause, all
  nested fields preserved
- `resolveSectionData()` returns HERO_BANNER content **unchanged** (no dataSource)
- `SectionRenderer` passes content directly to `HeroBannerSection` as a prop
- Hero component reads `content.backgroundVideo.mobileSrc` via optional chaining
- `HeroVideo` useEffect sets `video.src` based on `window.innerWidth >= 640`
- Builder save sends `content: s.content` via `JSON.stringify()` — nested objects preserved
- API validation checks depth/size only — does NOT strip or modify fields
- Prisma `update()` does a full JSON replace (not merge) — builder sends complete object

**Verdict:** No data loss anywhere in the pipeline. Content JSON passes through
untouched from DB → page → component.

### Agent 2: Database Configuration

**Task:** Determine if local and server share the same PostgreSQL instance.

**Findings:**
- Both use `process.env.DATABASE_URL` — no environment branching in code
- `.env` exists locally, `.env.production` may exist on server (deploy script copies it)
- No `.env.production` is checked into git
- `prisma.config.ts` reads from single `DATABASE_URL` variable
- Deploy script (`scripts/deploy.sh`) uploads `.env.production` as `.env` if it exists
- No PgBouncer or Supavisor configured

**Verdict:** Local and server use separate `.env` files. If `DATABASE_URL` differs,
they have separate databases. **This is the most likely explanation.**

### Agent 3: RSC Conversion Impact

**Task:** Check if the 22-section RSC conversion broke the hero banner.

**Findings:**
- `hero-banner.tsx` still has `"use client"` at line 1 — NOT converted
- `registry.tsx` has no `"use client"` — it's a Server Component importing Client Components
  (this is valid per Next.js rules)
- Props from Server → Client boundary serialize automatically for plain JSON objects
- `SectionThemeContext` works correctly across boundary (primitive string values)
- All import paths verified correct after theme-tokens split
- No missing exports or renamed files

**Verdict:** RSC conversion did NOT break hero banner rendering.

### Agent 4: Standalone Server Differences

**Task:** Check if `.next/standalone/server.js` behaves differently than `next start`.

**Findings:**
- `serverExternalPackages` only affects AWS SDK — not related to rendering
- `optimizePackageImports` for motion doesn't affect hero-banner (it doesn't import motion)
- `.env` file is present in standalone directory
- No environment variable mismatch detected
- `output: 'standalone'` doesn't change rendering behavior — same React code runs
- `serverSourceMaps: false` only affects error stack traces, not rendering

**Verdict:** No rendering differences between standalone and normal mode.

### Agent 5: HeroVideo Hydration & Mobile Playback

**Task:** Audit the HeroVideo component for client-side issues on real phones.

**Findings (9 potential issues identified):**

| Issue | Severity | Description |
|-------|----------|-------------|
| No src on server render | MEDIUM | Video element renders empty, useEffect sets src after hydration |
| iOS autoplay rejection | HIGH | Low Power Mode or slow networks can prevent playback silently |
| `play().catch(() => {})` swallows errors | HIGH | No fallback UI when video fails to play |
| `preload="auto"` on mobile | MEDIUM | May download large file before playing on slow networks |
| `window.innerWidth` vs `matchMedia` disagreement | MEDIUM | Safari URL bar can cause different readings |
| IntersectionObserver timing | MEDIUM | Video might not play if initially off-screen |
| matchMedia change events unreliable | LOW | Older mobile browsers may not fire on orientation change |
| No fallback for empty src | MEDIUM | Component renders blank video if both sources are empty |
| Breakpoint was 1024, now 640 | INFO | Changed per David's request — tablets now get desktop video |

**Verdict:** These are real mobile issues but don't explain the local-vs-server
difference. They should be addressed separately for mobile UX quality.

### Agent 6: Builder Save vs Public Render

**Task:** Check if the builder shows cached state that wasn't actually persisted.

**Findings:**
- Builder editor shows **local React state** (thumbnails, field values)
- Builder does NOT re-fetch from API after save to confirm persistence
- The seeded HERO_BANNER (`prisma/seed.mts`) has NO `backgroundVideo` field — only
  `backgroundImage`
- When editor loads this section: `content.backgroundVideo` is `undefined`
- Editor fallback: `bgVideo = { src: "", mobileSrc: "" }`
- When you update mobileSrc: `{ ...bgVideo, mobileSrc: v }` → produces
  `{ src: "", mobileSrc: "mobile-url" }` IF desktop video wasn't set first
- The builder preview reads from **local state** (shows video), but the public
  website reads from **database** (may have different content)

**Verdict:** If you uploaded the mobile video on local, it only exists in the
local database. The server's database still has the seeded content without
`backgroundVideo`.

### Agent 7: Import & Build Verification

**Task:** Verify imports, build output, and Prisma JSON behavior.

**Findings:**
- All hero-banner imports resolve correctly:
  - `@/components/website/shared/theme-context` → exists
  - `@/components/website/shared/theme-tokens` → exists (.ts file)
- No stale `theme-tokens.tsx` file exists
- Build cache is fresh (Mar 24)
- Section catalog default content includes `backgroundVideo: { src: "", mobileSrc: "" }`
- Prisma does full JSON replace (not deep merge) on `content` field — correct
  since builder sends complete object
- No Prisma middleware processes content before writes
- API validation is permissive — checks structure, doesn't strip fields

**Verdict:** All imports correct, build is clean, data handling is sound.

---

## Code Fix Applied (Separate from Root Cause)

Changed `??` to `||` for mobileSrc fallback in `hero-banner.tsx` (commit `9a15204`).

`??` (nullish coalescing) only triggers on `null`/`undefined`, NOT on empty string `""`.
The default content template has `mobileSrc: ""`, so `??` would pass through the empty
string instead of falling through to the desktop video fallback. `||` correctly falls
through on any falsy value including `""`.

Fixed in all 4 HeroVideo call sites (fullwidth, split, contained, legacy fallback).

---

## Action Items

- [ ] **Verify databases** — compare `DATABASE_URL` in local `.env` vs server `.env`
- [ ] **Query server DB** — check if `backgroundVideo.mobileSrc` exists in the hero section
- [ ] **Upload mobile video on server** — if databases differ, upload through admin.laubf.lclab.io
- [ ] **Address HeroVideo mobile issues** — add fallback UI for failed autoplay, consider poster image
- [ ] **Add logging to HeroVideo** — log which video source is selected and whether play() succeeds

---

*Investigation: 2026-03-24, 7 parallel agents*
*Agents: data-flow-trace, db-config-check, rsc-impact-check, standalone-diff-check, hydration-audit, save-vs-render-check, import-build-verify*
