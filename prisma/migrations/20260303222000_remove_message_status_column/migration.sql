-- DropIndex
DROP INDEX "Message_churchId_status_dateFor_idx";

-- DropIndex
DROP INDEX "Message_churchId_status_idx";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "status";

-- CreateIndex
CREATE INDEX "Message_churchId_hasStudy_idx" ON "Message"("churchId", "hasStudy");
