# Scripts Directory

> **Last updated**: 2026-03-27
> **Total**: 12 files (down from 58 — deleted 46 one-time migrations, seeds, fixes, legacy data, and deprecated tools)

---

## Directory Structure

```
scripts/
├── deploy/                          # Deployment & infrastructure
│   ├── deploy.sh                    # Main deploy script (reads DEPLOY_* from .env)
│   └── nginx/
│       └── laubf.conf               # nginx reverse-proxy config
│
├── maintenance/                     # Reusable utilities for ongoing operations
│   ├── r2-cleanup.mts               # Scans 18+ models, deletes orphaned R2 files
│   ├── invalidate-sessions.mts      # Bumps sessionVersion → forces JWT refresh
│   ├── website-snapshot.mts         # Export/restore website builder data (JSON)
│   ├── migrate-section-content.mts  # Updates PageSection JSONB to current builder format
│   ├── upload-default-event-templates.mts  # Uploads default SVG templates to R2
│   ├── migrate-attachments-to-relation.mts # [PRE-LAUNCH] JSON → relation table
│   └── backfill-content-disposition.mts    # [PRE-LAUNCH] Fix R2 download headers
│
└── diagnostics/                     # Read-only health checks
    ├── verify-db-state.mts          # Message integrity (video flags, orphaned content)
    ├── audit-published-messages.mts # Which messages have/lack videos
    └── audit-video-import.mts       # Video import integrity check
```

---

## Quick Reference

### Deploy to production
```bash
npm run deploy
# or: ./scripts/deploy/deploy.sh ubfuser@20.171.37.81
```
Reads `DEPLOY_HOST`, `DEPLOY_APP_DIR`, `DEPLOY_PM2_NAME` from `.env`.

### Pre-launch tasks (run once before production)
```bash
npx tsx scripts/maintenance/migrate-attachments-to-relation.mts --dry-run
npx tsx scripts/maintenance/migrate-attachments-to-relation.mts --execute

npx tsx scripts/maintenance/backfill-content-disposition.mts --dry-run
npx tsx scripts/maintenance/backfill-content-disposition.mts --execute
```

### R2 orphan cleanup
```bash
npm run cleanup-orphans
```

### Invalidate all sessions
```bash
npx tsx scripts/maintenance/invalidate-sessions.mts
```

### Website backup/restore
```bash
npx tsx scripts/maintenance/website-snapshot.mts export
npx tsx scripts/maintenance/website-snapshot.mts restore
```

### Database health checks
```bash
npx tsx scripts/diagnostics/verify-db-state.mts
npx tsx scripts/diagnostics/audit-published-messages.mts
npx tsx scripts/diagnostics/audit-video-import.mts
```
