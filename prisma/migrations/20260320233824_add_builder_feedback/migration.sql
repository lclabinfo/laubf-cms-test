-- CreateTable
CREATE TABLE "BuilderFeedback" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'bug',
    "severity" TEXT,
    "snapshot" JSONB NOT NULL,
    "actionHistory" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'new',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuilderFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuilderFeedback_churchId_status_idx" ON "BuilderFeedback"("churchId", "status");

-- CreateIndex
CREATE INDEX "BuilderFeedback_churchId_type_idx" ON "BuilderFeedback"("churchId", "type");

-- CreateIndex
CREATE INDEX "BuilderFeedback_churchId_createdAt_idx" ON "BuilderFeedback"("churchId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "BuilderFeedback" ADD CONSTRAINT "BuilderFeedback_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
