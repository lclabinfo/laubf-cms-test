-- CreateTable
CREATE TABLE "BuilderPresence" (
    "id" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userName" TEXT NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "churchId" UUID NOT NULL,

    CONSTRAINT "BuilderPresence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuilderPresence_pageId_idx" ON "BuilderPresence"("pageId");

-- CreateIndex
CREATE INDEX "BuilderPresence_churchId_idx" ON "BuilderPresence"("churchId");

-- CreateIndex
CREATE UNIQUE INDEX "BuilderPresence_pageId_userId_key" ON "BuilderPresence"("pageId", "userId");

-- AddForeignKey
ALTER TABLE "BuilderPresence" ADD CONSTRAINT "BuilderPresence_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
