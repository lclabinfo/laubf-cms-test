-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "PersonRoleDefinition" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonRoleDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonRoleAssignment" (
    "id" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "title" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonRoleDefinition_churchId_idx" ON "PersonRoleDefinition"("churchId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonRoleDefinition_churchId_slug_key" ON "PersonRoleDefinition"("churchId", "slug");

-- CreateIndex
CREATE INDEX "PersonRoleAssignment_personId_idx" ON "PersonRoleAssignment"("personId");

-- CreateIndex
CREATE INDEX "PersonRoleAssignment_roleId_idx" ON "PersonRoleAssignment"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonRoleAssignment_personId_roleId_key" ON "PersonRoleAssignment"("personId", "roleId");

-- AddForeignKey
ALTER TABLE "PersonRoleDefinition" ADD CONSTRAINT "PersonRoleDefinition_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRoleAssignment" ADD CONSTRAINT "PersonRoleAssignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonRoleAssignment" ADD CONSTRAINT "PersonRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "PersonRoleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
