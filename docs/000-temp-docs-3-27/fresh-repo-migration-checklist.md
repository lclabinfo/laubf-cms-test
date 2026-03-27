# Fresh Repo Migration Checklist

> **Created**: 2026-03-27
> **Purpose**: Everything that needs attention when duplicating this codebase into a new Git repo with a fresh history.

---

## 1. Files That Auto-Carry (Just Copy)

These files live in the repo directory and will come along with a simple file copy. No changes needed.

| File | Purpose | Tracked in Git? |
|------|---------|-----------------|
| `CLAUDE.md` | Claude Code project instructions | **Yes** (but .gitignored — still tracked from old commit; see note below) |
| `.mcp.json` | MCP server config (shadcn only) | No (.gitignored) |
| `.claude/settings.local.json` | Permission overrides (npm, git, tsc) | No (not in git) |
| `.env.example` | Environment variable template (well-documented) | Yes |
| `ecosystem.config.js` | PM2 production config | Yes |
| `.gitignore` | Exclusion rules | Yes |

### CLAUDE.md tracking issue

`CLAUDE.md` is in `.gitignore` but **still tracked** from a prior commit. In the new repo it won't be tracked (clean .gitignore will prevent it). This is the desired state — keep it local-only.

---

## 2. Files That Do NOT Carry (Manual Migration)

These live in the user-level Claude directory, keyed by the absolute repo path. A new repo at a different path gets a fresh (empty) project directory.

### Memory files (CRITICAL to migrate)

**Source**: `~/.claude/projects/-Users-davidlim-Desktop-laubf-cms-test/memory/`

| File | Type | Why It Matters |
|------|------|----------------|
| `MEMORY.md` | Index | Links to all other memory files |
| `feedback_database_safety.md` | Safety rule | **Seed wiped live data on 2026-03-19** — prevents repeat |
| `reference_server_db.md` | Server reference | DB user, PM2 process name, deploy steps |
| `feedback_no_timezone_dates.md` | Data handling | All dates are church-local PST, no TZ conversion |
| `feedback_hero_video_debug.md` | Debug pattern | Always query DB first, trace full data chain |
| `user_role.md` | User context | David is fullstack dev (Google/Framer background) |
| `project_builder_concurrent_editing.md` | Design decision | Presence + dirty tracking + silent last-write-wins |
| `bible-migration.md` | Migration notes | Legacy MySQL to Prisma pipeline (completed) |

**Migration steps**:
1. Open the new repo in Claude Code (creates the new project directory)
2. Copy all 8 `.md` files from old `memory/` to new `memory/`
3. Memory will auto-load on next conversation

### Session history (DO NOT migrate)

The `~/.claude/projects/...` directory also contains ~1.8 GB of session/conversation `.jsonl` files. These are tied to the old repo path and should NOT be copied. New sessions start fresh.

---

## 3. Environment Variables

`.env.example` is comprehensive. Key items that need values in a new environment:

### Required (app won't start without these)

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Same DB, direct connection (for migrations) |
| `CHURCH_SLUG` | Tenant slug (e.g., `la-ubf`) |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Base URL (e.g., `http://localhost:3000` for dev) |

### Required for user management

| Variable | Notes |
|----------|-------|
| `SENDGRID_API_KEY` | Transactional emails (verify, reset, invite) |
| `EMAIL_FROM` | Verified sender in SendGrid |

### Production-specific

| Variable | Dev Default | Production Value |
|----------|-------------|-----------------|
| `AUTH_URL` | `http://localhost:3000` | `https://admin.{domain}` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `localhost:3000` | `{domain}` (e.g., `lclab.io`) |
| `NEXT_PUBLIC_WEBSITE_URL` | `http://localhost:3000/website` | `https://{slug}.{domain}` |
| `WEBSITE_URL` | `http://localhost:3000/website` | Same as above |
| `CMS_URL` | `http://localhost:3000` | `https://admin.{slug}.{domain}` |
| `DEPLOY_HOST` | (empty) | `user@server-ip` |
| `DEPLOY_APP_DIR` | (empty) | Absolute path on server |
| `DEPLOY_PM2_NAME` | (empty) | PM2 process name |

### Secrets (must be regenerated per environment)

- `AUTH_SECRET` — generate fresh
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth credentials
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — Cloudflare R2 tokens
- `YOUTUBE_API_KEY` — YouTube Data API key
- `SENDGRID_API_KEY` — SendGrid mail API key
- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile secret

---

## 4. Hardcoded Values to Review

### ecosystem.config.js (line 6)

```javascript
cwd: "/home/ubfuser/digital_church/laubf_cms"  // HARDCODED
```

This is the production server absolute path. For the new repo, either:
- Update to the new server path, OR
- Parameterize: `cwd: process.env.APP_DIR || "/home/ubfuser/digital_church/laubf_cms"`

### next.config.ts — R2 bucket hostnames

The `images.remotePatterns` array includes specific R2 public bucket hostnames:
- `pub-59a92027daa648c8a02f226cb5873645.r2.dev` (attachments)
- `pub-91add7d8455848c9a871477af3249f9e.r2.dev` (media)

These are tied to the current Cloudflare account. New R2 buckets = new hostnames.

### scripts/deploy/nginx/laubf.conf

Contains hardcoded domain names:
- `laubf.lclab.io` — website domain
- `admin.laubf.lclab.io` — CMS admin domain

Update for new deployment domain.

---

## 5. Directories to Exclude from Fresh Repo

The current `.gitignore` already handles most of these. Verify they're all excluded in the new repo:

| Directory | Size | .gitignore Status | Notes |
|-----------|------|-------------------|-------|
| `laubf-test/` | 1.2 GB | Excluded (line 65) | Retired app, migration source only |
| `00_old_laubf_db_dump/` | 246 MB | Excluded (line 62) | Legacy MySQL dumps |
| `figma-cms-2*` | 68 MB | Excluded (line 66, glob) | Figma prototype export |
| `db-snapshots/` | 30 MB | Excluded (line 69) | PostgreSQL dump snapshots |
| `public/images/` | 307 MB | Excluded (line 55) | Media assets (served from filesystem) |
| `public/videos/` | 20 MB | Excluded (line 56) | Video files |
| `public/fonts/` | 6.4 MB | Excluded (line 57) | Font files |
| `lib/generated/prisma/` | varies | Excluded (line 49) | Prisma generated client |
| `node_modules/` | 1 GB | Excluded (line 4) | npm dependencies |
| `.next/` | varies | Excluded (line 18) | Next.js build output |

### Directories to physically exclude (don't copy to new repo)

When doing the file copy, skip these entirely — they're large, gitignored, and not needed in a fresh repo:

```bash
# These should NOT be copied to the new repo directory
laubf-test/           # 1.2 GB — retired app
00_old_laubf_db_dump/ # 246 MB — legacy MySQL dumps
figma-cms-2*/         # 68 MB — Figma export
db-snapshots/         # 30 MB — PostgreSQL dumps
node_modules/         # 1 GB — npm dependencies
.next/                # Build output
public/images/        # 307 MB — media files
public/videos/        # 20 MB — video files
public/fonts/         # 6.4 MB — font files
```

---

## 6. Claude Code Plugin/MCP Inventory

### Project-level MCP (.mcp.json)

| Server | Command | Purpose |
|--------|---------|---------|
| `shadcn` | `npx shadcn@latest mcp` | Search/add shadcn/ui components |

### Global plugins (~/.claude/settings.json)

These apply automatically to any repo — no migration needed:

| Plugin | Purpose |
|--------|---------|
| `chrome-devtools-mcp` | Browser DevTools automation |
| `frontend-design` | UI/design generation |
| `code-review` | PR code review |
| `context7` | Library documentation lookup |
| `github` | GitHub integration |

### Global settings

| Setting | Value |
|---------|-------|
| `effortLevel` | `high` |
| `voiceEnabled` | `true` |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | `1` (env var) |

---

## 7. Quick Migration Script

```bash
# Source and destination
SRC="/Users/davidlim/Desktop/laubf-cms-test"
DST="/path/to/new-repo"

# Copy codebase (excluding large/temp directories)
rsync -av --progress "$SRC/" "$DST/" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='laubf-test' \
  --exclude='00_old_laubf_db_dump' \
  --exclude='figma-cms-2*' \
  --exclude='db-snapshots' \
  --exclude='public/images' \
  --exclude='public/videos' \
  --exclude='public/fonts' \
  --exclude='.git'

# Initialize fresh git repo
cd "$DST"
git init
git add .
git commit -m "Initial commit — LA UBF Church CMS"

# Copy memory files (after opening in Claude Code once to create project dir)
# The project dir path will be based on the new repo path
# e.g., ~/.claude/projects/-path-to-new-repo/memory/
```

---

## 8. Post-Migration Verification

After setting up the new repo:

- [ ] `cp .env.example .env` and fill in values
- [ ] `npm install`
- [ ] `npx prisma generate` (regenerates Prisma client)
- [ ] `npm run build` — verify clean build
- [ ] `npm run dev` — verify dev server starts
- [ ] Check CMS login works
- [ ] Check website renders (`/website` route)
- [ ] Memory files loaded in Claude Code (start a conversation, ask it to recall something)
