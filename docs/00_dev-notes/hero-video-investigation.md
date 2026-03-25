# Hero Mobile Video Investigation & Resolution

> Mobile video works on localhost but not on hosted server.
> 7-agent investigation conducted 2026-03-24. Resolved 2026-03-25.

---

## Resolution (2026-03-25)

**Status: FIXED** across 4 commits.

### The actual root cause (4 bugs forming a chain)

The 7-agent investigation on 2026-03-24 correctly identified the data format mismatch but missed the **full chain of failures** that made the mobile video unreachable:

**Bug 1: Legacy seed stores video in `backgroundImage.src`, not `backgroundVideo`**

`prisma/seed.mts` (and `reset-website-seed.mts`) created the hero section as:
```json
{ "backgroundImage": { "src": "compressed-hero-vid.mp4" } }
```
No `backgroundVideo` field existed in the DB at all. No `mediaType` field either.

**Bug 2: Editor shows a display-only fallback that never gets saved**

`hero-editor.tsx:272` — The desktop video picker displayed:
```tsx
value={bgVideo.src || (isVideoSrc(bgImage.src) ? bgImage.src : "")}
```
Since `backgroundVideo` didn't exist, `bgVideo = { src: "", mobileSrc: "" }`. The UI fell back to showing `backgroundImage.src`, so the user saw the video and thought it was configured. But `backgroundVideo.src` remained `""` in the data.

**Bug 3: Saving mobile video didn't auto-migrate the desktop video**

`hero-editor.tsx:287-290` — When picking a mobile video:
```tsx
onChange({ ...content, backgroundVideo: { ...bgVideo, mobileSrc: v } })
```
This wrote `backgroundVideo: { src: "", mobileSrc: "phone_dimension.webm" }`. The desktop URL from `backgroundImage.src` was never migrated to `backgroundVideo.src`.

**Bug 4 (THE KILLER): Renderer ignores `mobileSrc` when `backgroundVideo.src` is falsy**

`hero-banner.tsx:568`:
```tsx
if (content.backgroundVideo?.src) {  // "" is FALSY → entire block skipped!
  return <HeroVideo
    desktopSrc={content.backgroundVideo.src}
    mobileSrc={content.backgroundVideo.mobileSrc || content.backgroundVideo.src}
  />
}
```
Since `backgroundVideo.src` was `""`, this block was skipped entirely. It fell through to the legacy path which used `backgroundImage.src` for BOTH desktop AND mobile — `mobileSrc` was never read.

### The full chain

1. User switches to Video mode → editor shows `hero-vid.mp4` from `backgroundImage` (display fallback)
2. User picks mobile video → saved as `backgroundVideo: { src: "", mobileSrc: "phone.webm" }`
3. Renderer checks `backgroundVideo.src` → empty string → skips the whole video block
4. Falls back to `backgroundImage.src` (the old hero-vid.mp4) for both desktop AND mobile
5. `mobileSrc` exists in the database but is never read by the renderer

### Why it worked locally but not on server

On local dev, the builder preview uses React state (which has the correct video). The public website reads from the DB. When the user saved through the builder, it wrote the broken format to the DB. Locally, the user was seeing the builder preview (correct). On the server, the public website read the DB (broken).

### Fixes applied

| File | Fix |
|------|-----|
| `hero-editor.tsx` | Resolve `bgVideo.src` from `backgroundImage` on load, so spreads preserve the desktop video. Set `mediaType: "video"` on mobile video save. Clear legacy `backgroundImage` video on save. |
| `hero-banner.tsx` | Infer `mediaType="video"` when `backgroundImage` has a video URL. Resolve `desktopVideoSrc` from `backgroundImage` fallback in fullwidth layout. |
| `apply-hero-mobile-video.mts` | Normalize both legacy and current formats: always set `backgroundVideo.src` + `mobileSrc` + `mediaType`. |
| `reset-website-seed.mts` | Uses `backgroundVideo` format with `mediaType: 'video'`. |
| `prisma/seed.mts` | Same fix as reset-website-seed. |

### Deploy steps after fix

```bash
git pull
npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp .env .next/standalone/.env
pm2 restart laubf_cms
```

Also run the deploy script to fix existing DB data:
```bash
npx tsx scripts/deploy-data/apply-hero-mobile-video.mts
```

### Also fixed: legacy `mobileVideo` field

A separate legacy issue — the old seed wrote a `mobileVideo: { src: "..." }` field which the deploy script was writing to instead of `backgroundVideo.mobileSrc`. All references to `mobileVideo` have been removed from the codebase. The deploy script strips this field from the DB.

---

## Debugging timeline

### 2026-03-24: Initial investigation (4+ hours)

- User reported mobile video not updating on server despite saving in CMS builder
- 7 parallel agents investigated data flow, DB config, RSC conversion, standalone server, hydration, save vs render, and build verification
- Investigation correctly identified separate databases and missing `backgroundVideo` field but didn't trace the full 4-bug chain
- `??` vs `||` fix applied (commit `9a15204`) — real but not the root cause

### 2026-03-25: Resolution (2+ hours)

- Created `apply-hero-mobile-video.mts` deploy script — initially wrote to wrong field (`mobileVideo` instead of `backgroundVideo.mobileSrc`)
- Removed all legacy `mobileVideo` references from codebase
- Discovered `backgroundVideo.src` was empty via DB query — the actual killer bug
- Fixed editor to resolve and migrate legacy `backgroundImage` video URLs
- Fixed renderer to handle legacy format with video in `backgroundImage`
- Fixed seed scripts to use correct format

### Lessons learned

1. **Display-only fallbacks in editors are dangerous.** If the UI shows a value from a fallback source, the user assumes it's configured. When they save, the fallback source isn't included. The editor should resolve/migrate legacy data on load, not just display it.
2. **Falsy checks on strings skip empty strings.** `if (obj?.src)` skips `""`. The renderer should have checked for the presence of the key, or the editor should never have written `src: ""`.
3. **Deploy scripts must handle all data formats.** The initial script assumed `backgroundVideo` existed as a top-level key. It didn't, so the `WHERE content ? 'backgroundVideo'` condition matched nothing.
4. **Always query the actual DB** when debugging data issues. Hours were spent debugging code paths when a single SQL query would have shown `backgroundVideo.src` was empty.

---

## Previous investigation details (2026-03-24)

### 7-Agent Investigation Results

*(Preserved for reference — findings were correct but incomplete)*

### Agent 1: Data Flow Trace

**Findings:**
- `getPageBySlug()` returns `content` as Prisma JSONB — no `select` clause, all nested fields preserved
- `resolveSectionData()` returns HERO_BANNER content **unchanged** (no dataSource)
- `SectionRenderer` passes content directly to `HeroBannerSection` as a prop
- Hero component reads `content.backgroundVideo.mobileSrc` via optional chaining
- `HeroVideo` useEffect sets `video.src` based on `window.innerWidth >= 640`
- Builder save sends `content: s.content` via `JSON.stringify()` — nested objects preserved
- API validation checks depth/size only — does NOT strip or modify fields
- Prisma `update()` does a full JSON replace (not merge) — builder sends complete object

**Verdict:** No data loss anywhere in the pipeline. Content JSON passes through untouched from DB → page → component.

### Agent 2: Database Configuration

**Findings:**
- Both use `process.env.DATABASE_URL` — no environment branching in code
- `.env` exists locally, `.env.production` may exist on server
- No PgBouncer or Supavisor configured

**Verdict:** Local and server use separate `.env` files with separate databases.

### Agent 3: RSC Conversion Impact

**Verdict:** RSC conversion did NOT break hero banner rendering. `hero-banner.tsx` still has `"use client"`.

### Agent 4: Standalone Server Differences

**Verdict:** No rendering differences between standalone and normal mode.

### Agent 5: HeroVideo Hydration & Mobile Playback

**9 potential issues identified** — real mobile UX issues but don't explain local-vs-server difference. Should be addressed separately.

### Agent 6: Builder Save vs Public Render

**Key finding:** Builder preview reads from local React state (shows video), public website reads from database (may have different content). This was the closest to the actual root cause.

### Agent 7: Import & Build Verification

**Verdict:** All imports correct, build is clean, data handling is sound.

---

*Investigation: 2026-03-24, 7 parallel agents*
*Resolution: 2026-03-25, 4 commits*
