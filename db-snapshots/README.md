# Database Snapshots

## 2026-03-05-merge-duplicates.dump

Full database snapshot after merging duplicate video+study messages. Includes:
- ~1,196 messages (duplicates merged, videoTitle set for alternate titles)
- 1,180 bible studies (all PUBLISHED) with questions/answers/transcripts as cleaned HTML
- 2,731 bible study attachments with slug-based URLs
- All other seeded data (series, speakers, pages, theme, etc.)

### Restore

```bash
# Strip query params from DATABASE_URL and restore
DB_URL=$(echo "$DATABASE_URL" | sed 's/\?.*//')
pg_restore --no-owner --no-privileges --clean --if-exists -d "$DB_URL" db-snapshots/2026-03-05-merge-duplicates.dump
```

### Replicate from scratch

```bash
npx prisma migrate deploy        # Apply all migrations
npx prisma db seed               # Seed all data (reads scripts/bible-study-content.json)
```

The seed is fully idempotent and produces the same result as this dump.

## 2026-03-05-bible-study-migration.dump

Previous snapshot before duplicate merge. Kept for reference.
