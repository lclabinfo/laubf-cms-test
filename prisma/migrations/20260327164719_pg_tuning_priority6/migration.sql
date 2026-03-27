-- =============================================================================
-- Priority 6: PostgreSQL Tuning (Memory Audit)
-- =============================================================================

-- 6d: Drop redundant indexes
-- Church.slug: @unique already creates an index
DROP INDEX "Church_slug_idx";
-- Session.token: @unique already creates an index
DROP INDEX "Session_token_idx";
-- Event: low-cardinality boolean indexes (isPinned, isFeatured, isRecurring)
DROP INDEX "Event_churchId_isFeatured_idx";
DROP INDEX "Event_churchId_isPinned_idx";
DROP INDEX "Event_churchId_isRecurring_idx";
-- Event: [churchId, campusId] rarely filtered alone
DROP INDEX "Event_churchId_campusId_idx";
-- Event: [churchId, status] covered by [churchId, status, dateStart]
DROP INDEX "Event_churchId_status_idx";
-- Page: boolean indexes on small table (<100 rows)
DROP INDEX "Page_churchId_isHomepage_idx";
DROP INDEX "Page_churchId_isPublished_idx";

-- 6a: Partial indexes on deletedAt IS NULL
-- Almost every query filters deletedAt: null. Partial indexes only index live
-- rows — smaller indexes, faster lookups, no code change needed.
CREATE INDEX "idx_message_active" ON "Message" ("churchId", "dateFor" DESC)
  WHERE "deletedAt" IS NULL;
CREATE INDEX "idx_event_active" ON "Event" ("churchId", "dateStart" DESC)
  WHERE "deletedAt" IS NULL;

-- 6b: LZ4 compression for TOAST columns
-- Decompresses 3-5x faster than default pglz. Only affects newly written data.
-- Message columns
ALTER TABLE "Message" ALTER COLUMN "rawTranscript" SET COMPRESSION lz4;
ALTER TABLE "Message" ALTER COLUMN "liveTranscript" SET COMPRESSION lz4;
ALTER TABLE "Message" ALTER COLUMN "studySections" SET COMPRESSION lz4;
-- Event columns
ALTER TABLE "Event" ALTER COLUMN "description" SET COMPRESSION lz4;
ALTER TABLE "Event" ALTER COLUMN "locationInstructions" SET COMPRESSION lz4;
ALTER TABLE "Event" ALTER COLUMN "welcomeMessage" SET COMPRESSION lz4;

-- 6c: Keep PageSection.content inline (no TOAST)
-- PageSection.content is usually small (<2 KB) but read on every page load.
-- STORAGE MAIN avoids TOAST table lookups for small values.
ALTER TABLE "PageSection" ALTER COLUMN "content" SET STORAGE MAIN;
