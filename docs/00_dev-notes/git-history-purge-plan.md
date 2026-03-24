# Git History Purge Plan

> Run this when you have a maintenance window. Requires re-clone on all machines afterward.
> Estimated savings: ~784 MB from .git/ (588 MB -> ~80 MB)
>
> Status: READY TO EXECUTE (files already untracked and .gitignored in commit 2fe9053)

---

## Pre-Purge Checklist

- [ ] Notify anyone with a clone (boss, CI/CD) -- their repos become incompatible after this
- [ ] Back up the current repo: `git clone --mirror <url> backup-repo.git`
- [ ] No open PRs that you want to keep (all PR hashes will change)
- [ ] Pick a time when the hosted server can be briefly down for re-clone
- [ ] **Back up server `.env` to your local machine** (see Step 0)
- [ ] **Verify server setup**: SSH in and confirm the actual app path, port, and running process:
  ```bash
  pm2 list                           # check process name, port, cwd
  ls /home/ubfuser/digital_church/   # confirm directory structure
  cat /home/ubfuser/digital_church/laubf_cms/.env | head -5  # sanity check
  ```

---

## Step 0: Back Up Server-Only Files to Local

The server has files that are gitignored and **different from your local copies** (especially `.env`).
Back these up BEFORE doing anything destructive.

```bash
# From your local machine — adjust user@host as needed
SSH_HOST="ubfuser@<your-server-ip>"
SERVER_APP="/home/ubfuser/digital_church/laubf_cms"
LOCAL_BACKUP="$HOME/Desktop/server-backup-pre-purge"

mkdir -p "$LOCAL_BACKUP"

# 1. Back up server .env (CRITICAL — has production DB credentials, auth secrets, API keys)
scp "$SSH_HOST:$SERVER_APP/.env" "$LOCAL_BACKUP/.env.server"

# 2. Back up server public assets (images, videos, fonts, logos)
#    These are gitignored and may have been uploaded on the server.
#    Skip any that don't exist — scp will just error harmlessly.
scp -r "$SSH_HOST:$SERVER_APP/public/images" "$LOCAL_BACKUP/public-images" 2>/dev/null
scp -r "$SSH_HOST:$SERVER_APP/public/videos" "$LOCAL_BACKUP/public-videos" 2>/dev/null
scp -r "$SSH_HOST:$SERVER_APP/public/fonts"  "$LOCAL_BACKUP/public-fonts"  2>/dev/null
scp -r "$SSH_HOST:$SERVER_APP/public/logo"   "$LOCAL_BACKUP/public-logo"   2>/dev/null

# 3. Back up ecosystem.config.js (tracked in git, but verify server copy matches repo)
scp "$SSH_HOST:$SERVER_APP/ecosystem.config.js" "$LOCAL_BACKUP/ecosystem.config.js"

# 4. Verify what you got
ls -la "$LOCAL_BACKUP"
cat "$LOCAL_BACKUP/.env.server" | head -5   # sanity check — should show DATABASE_URL
```

> **Why**: A fresh `git clone` only has tracked files. `.env`, `public/images/`, `public/fonts/`,
> etc. are all gitignored and will be gone after re-clone. The server `.env` has different values
> than your local `.env` (production DATABASE_URL, AUTH_SECRET, API keys, domain config).

---

## Step 1: Run on Your Local PC

```bash
# Install git-filter-repo if not already installed
pip install git-filter-repo
# or: brew install git-filter-repo

cd /Users/davidlim/Desktop/laubf-cms-test

# Purge the 4 largest offenders from ALL history
# This rewrites every commit -- all SHAs change
git filter-repo \
  --path scripts/bible-study-content.json \
  --path 00_old_laubf_db_dump/ \
  --path db-snapshots/ \
  --path figma-cms-2:25:26/ \
  --invert-paths \
  --force

# Verify the size reduction
git count-objects -vH
# Expected: pack size drops from ~538 MB to ~50-80 MB

# Force-push ALL branches and tags to remote
# IMPORTANT: filter-repo strips remotes. Re-add with your PAT-embedded URL.
# Your current remote uses: https://ghp_<TOKEN>@github.com/lclabinfo/laubf-cms-test.git
# Run `git remote -v` in laubf-cms-test-old to retrieve the exact URL if you forget it.
git remote add origin https://ghp_<YOUR_TOKEN>@github.com/lclabinfo/laubf-cms-test.git
git push origin --force --all
git push origin --force --tags
```

Note: `git filter-repo` removes the `origin` remote as a safety measure. You need to re-add it
with the PAT-embedded URL, otherwise push will fail with auth errors.

---

## Step 2: Re-Clone on Hosting Server

```bash
# SSH into the hosting server
ssh ubfuser@<your-server-ip>

# ------- Stop the app -------
pm2 stop laubf_cms

# ------- Preserve old repo -------
cd /home/ubfuser/digital_church
mv laubf_cms laubf_cms_old

# ------- Fresh clone -------
# Use the PAT-embedded URL (same as your local remote)
git clone https://ghp_<YOUR_TOKEN>@github.com/lclabinfo/laubf-cms-test.git laubf_cms
cd laubf_cms

# ------- Restore server-only files -------

# A. Restore .env (CRITICAL — without this the app won't start)
cp ../laubf_cms_old/.env .env

# B. Restore CLAUDE.md (gitignored — not critical for app, but preserves project instructions)
[ -f ../laubf_cms_old/CLAUDE.md ] && cp ../laubf_cms_old/CLAUDE.md CLAUDE.md

# C. Restore public assets (images, videos, fonts, logos)
#    Currently empty on server as of 2026-03-24, but included for safety.
#    Only copy dirs that exist in the old repo.
[ -d ../laubf_cms_old/public/images ] && cp -r ../laubf_cms_old/public/images public/images
[ -d ../laubf_cms_old/public/videos ] && cp -r ../laubf_cms_old/public/videos public/videos
[ -d ../laubf_cms_old/public/fonts ]  && cp -r ../laubf_cms_old/public/fonts  public/fonts
[ -d ../laubf_cms_old/public/logo ]   && cp -r ../laubf_cms_old/public/logo   public/logo

# ------- Install & Build -------
npm install
npx prisma generate          # REQUIRED — generated client is gitignored
npm run build

# Copy static files for standalone server
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# Copy .env into standalone dir (Next.js standalone reads .env from its own dir)
cp .env .next/standalone/.env

# ------- Restart -------
pm2 start ecosystem.config.js
pm2 save

# ------- Verify -------
curl http://localhost:3012    # should return HTML
pm2 logs laubf_cms --lines 20  # check for startup errors
```

### What could go wrong here (and how to recover)

| Symptom | Cause | Fix |
|---------|-------|-----|
| App won't start / "DATABASE_URL not found" | `.env` wasn't copied | `cp ../laubf_cms_old/.env .env && cp .env .next/standalone/.env` |
| Prisma error / "Cannot find module" | Missing `prisma generate` | `npx prisma generate && npm run build` |
| Images/fonts 404 on the website | Public assets not copied | Copy from `laubf_cms_old/public/` (see step B above) |
| pm2 starts but wrong port | ecosystem.config.js mismatch | Verify `ecosystem.config.js` has `PORT: 3012` and correct `cwd` |
| Site unreachable from browser | nginx still works -- app issue | Check `pm2 logs`, verify `curl localhost:3012` |

> **nginx and SSL are NOT affected.** nginx config lives at `/etc/nginx/sites-available/laubf`
> and proxies to `127.0.0.1:3012` (or 3000). Certbot SSL certs are at `/etc/letsencrypt/`.
> None of these are inside the repo directory, so the re-clone doesn't touch them.

---

## Step 3: Re-Clone on Your Local PC

```bash
cd ~/Desktop
mv laubf-cms-test laubf-cms-test-old

git clone https://ghp_<YOUR_TOKEN>@github.com/lclabinfo/laubf-cms-test.git laubf-cms-test
cd laubf-cms-test
npm install
npx prisma generate   # REQUIRED — generated client is gitignored

# Copy back local-only files (.gitignored)
cp -r ../laubf-cms-test-old/00_old_laubf_db_dump ./
cp -r ../laubf-cms-test-old/db-snapshots ./
cp ../laubf-cms-test-old/scripts/bible-study-content.json ./scripts/
cp ../laubf-cms-test-old/.env .env
cp ../laubf-cms-test-old/CLAUDE.md CLAUDE.md

# Restore local public assets
[ -d ../laubf-cms-test-old/public/images ] && cp -r ../laubf-cms-test-old/public/images public/images
[ -d ../laubf-cms-test-old/public/videos ] && cp -r ../laubf-cms-test-old/public/videos public/videos
[ -d ../laubf-cms-test-old/public/fonts ]  && cp -r ../laubf-cms-test-old/public/fonts  public/fonts
[ -d ../laubf-cms-test-old/public/logo ]   && cp -r ../laubf-cms-test-old/public/logo   public/logo

# Verify everything works
npm run dev
```

---

## Step 4: Cleanup

```bash
# Once you've confirmed everything works:
rm -rf ~/Desktop/laubf-cms-test-old
# On server:
rm -rf /home/ubfuser/digital_church/laubf_cms_old
# Local server backup (optional — keep until you're 100% confident):
# rm -rf ~/Desktop/server-backup-pre-purge
```

---

## Side Effects & What's NOT Affected

| Component | Affected? | Notes |
|-----------|-----------|-------|
| **nginx config** | No | Lives at `/etc/nginx/sites-available/`, outside the repo |
| **SSL certs (certbot)** | No | Lives at `/etc/letsencrypt/`, outside the repo |
| **Certbot renewal cron** | No | Runs independently (`/usr/bin/certbot renew`), outside the repo |
| **pm2 daemon** | No | Global process manager, not inside the repo |
| **pm2 process config** | Briefly | Process stops during re-clone, restarts with same `ecosystem.config.js` |
| **PostgreSQL database** | No | Separate service, not inside the repo |
| **Node.js / npm** | No | System-level install, not inside the repo |
| **`.env` (server)** | YES | Must be manually copied from old dir to new clone |
| **`CLAUDE.md`** | YES | Gitignored — copy from old dir (not critical for app) |
| **`public/` assets** | YES | Images, fonts, videos, logos are gitignored — currently empty on server |
| **Git remote URL (PAT)** | YES | `filter-repo` strips remotes — must re-add with PAT-embedded URL |
| **Prisma generated client** | YES | Must run `npx prisma generate` after fresh clone |
| **`node_modules/`** | YES | Must run `npm install` after fresh clone |
| **`.next/` build** | YES | Must run `npm run build` after fresh clone |

---

## What Gets Purged

| Path | Versions in History | Size Reclaimed |
|------|-------------------|----------------|
| `scripts/bible-study-content.json` | 6 versions | ~438 MB |
| `db-snapshots/*.dump` | 5 files | ~159 MB |
| `00_old_laubf_db_dump/*.sql` | 124 files | ~112 MB |
| `figma-cms-2:25:26/` assets | ~241 objects | ~75 MB |
| **Total** | | **~784 MB** |

## What's Already Done (don't repeat)

- [x] Files added to `.gitignore` (commit 2fe9053)
- [x] Files untracked with `git rm --cached` (commit 2fe9053)
- [x] Verified no production code imports these files
- [ ] Back up server `.env` + public assets to local (Step 0)
- [ ] Run `git filter-repo` (Step 1)
- [ ] Force-push (Step 1)
- [ ] Re-clone on server + restore files (Step 2)
- [ ] Re-clone on local + restore files (Step 3)
- [ ] Delete old directories (Step 4)

---

## Port / Path Discrepancy (verify before running)

There's a mismatch between config files in the repo:

| File | Path | Port |
|------|------|------|
| `ecosystem.config.js` | `/home/ubfuser/digital_church/laubf_cms` | 3012 |
| `scripts/deploy.sh` | `/home/${user}/laubf-cms` | 3000 |
| `scripts/nginx/laubf.conf` | -- | proxies to 3000 |

This plan assumes `ecosystem.config.js` is correct (port 3012, path `/home/ubfuser/digital_church/laubf_cms`). **Before running Step 2, SSH in and verify with `pm2 list`** to confirm the actual process name, port, and cwd. If nginx is actually proxying to 3012 (certbot may have modified the config on the server), you're fine. If it's proxying to 3000, update accordingly.
