# Git History Purge Plan

> Run this when you have a maintenance window. Requires re-clone on all machines afterward.
> Estimated savings: ~784 MB from .git/ (588 MB → ~80 MB)
>
> Status: READY TO EXECUTE (files already untracked and .gitignored in commit 2fe9053)

---

## Pre-Purge Checklist

- [ ] Notify anyone with a clone (boss, CI/CD) — their repos become incompatible after this
- [ ] Back up the current repo: `git clone --mirror <url> backup-repo.git`
- [ ] No open PRs that you want to keep (all PR hashes will change)
- [ ] Pick a time when the hosted server can be briefly down for re-clone

---

## Step 1: Run on Your Local PC

```bash
# Install git-filter-repo if not already installed
pip install git-filter-repo
# or: brew install git-filter-repo

cd /Users/davidlim/Desktop/laubf-cms-test

# Purge the 4 largest offenders from ALL history
# This rewrites every commit — all SHAs change
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
git remote add origin <your-repo-url>   # filter-repo removes remotes
git push origin --force --all
git push origin --force --tags
```

Note: `git filter-repo` removes the `origin` remote as a safety measure. You need to re-add it.

---

## Step 2: Re-Clone on Hosting Server

```bash
# On the hosting server
cd /home/ubfuser/digital_church

# Stop the running process
pm2 stop laubf_cms

# Backup old repo (optional, can delete later)
mv laubf_cms laubf_cms_old

# Fresh clone (will be ~80 MB instead of 1 GB)
git clone <repo-url> laubf_cms
cd laubf_cms

# Install dependencies and build
npm install
npm run build

# Copy static files for standalone server
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# Restart
pm2 start ecosystem.config.js
pm2 save

# Verify it's running
curl http://localhost:3012
```

---

## Step 3: Re-Clone on Your Local PC

```bash
cd ~/Desktop
mv laubf-cms-test laubf-cms-test-old

git clone <repo-url> laubf-cms-test
cd laubf-cms-test
npm install

# Copy back local-only files from the old repo
cp -r ../laubf-cms-test-old/00_old_laubf_db_dump ./
cp -r ../laubf-cms-test-old/db-snapshots ./
cp ../laubf-cms-test-old/scripts/bible-study-content.json ./scripts/
# These are .gitignored so they won't be tracked

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
```

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
- [ ] Run `git filter-repo` (this plan)
- [ ] Force-push
- [ ] Re-clone on all machines
