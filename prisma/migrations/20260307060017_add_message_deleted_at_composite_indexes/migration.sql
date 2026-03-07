-- DropIndex
DROP INDEX "Message_churchId_dateFor_idx";

-- CreateIndex
CREATE INDEX "Message_churchId_deletedAt_dateFor_idx" ON "Message"("churchId", "deletedAt", "dateFor" DESC);

-- CreateIndex
CREATE INDEX "Message_churchId_deletedAt_title_idx" ON "Message"("churchId", "deletedAt", "title");
