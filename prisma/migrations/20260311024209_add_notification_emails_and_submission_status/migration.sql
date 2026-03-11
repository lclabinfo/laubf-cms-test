-- AlterTable
ALTER TABLE "ContactSubmission" ADD COLUMN     "activityLog" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'new';

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "notificationEmails" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "ContactSubmission_churchId_status_idx" ON "ContactSubmission"("churchId", "status");
