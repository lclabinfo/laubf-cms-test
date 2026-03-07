-- DropIndex
DROP INDEX "MediaAsset_churchId_createdAt_idx";

-- DropIndex
DROP INDEX "MediaAsset_churchId_folder_idx";

-- DropIndex
DROP INDEX "MediaAsset_churchId_mimeType_idx";

-- CreateTable
CREATE TABLE "MediaFolder" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaFolder_churchId_idx" ON "MediaFolder"("churchId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaFolder_churchId_name_key" ON "MediaFolder"("churchId", "name");

-- CreateIndex
CREATE INDEX "MediaAsset_churchId_deletedAt_folder_idx" ON "MediaAsset"("churchId", "deletedAt", "folder");

-- CreateIndex
CREATE INDEX "MediaAsset_churchId_deletedAt_mimeType_idx" ON "MediaAsset"("churchId", "deletedAt", "mimeType");

-- CreateIndex
CREATE INDEX "MediaAsset_churchId_deletedAt_createdAt_idx" ON "MediaAsset"("churchId", "deletedAt", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "MediaFolder" ADD CONSTRAINT "MediaFolder_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
