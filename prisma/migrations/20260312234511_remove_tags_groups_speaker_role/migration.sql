/*
  Warnings:

  - You are about to drop the `PersonGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PersonGroupMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PersonTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PersonGroup" DROP CONSTRAINT "PersonGroup_churchId_fkey";

-- DropForeignKey
ALTER TABLE "PersonGroup" DROP CONSTRAINT "PersonGroup_parentGroupId_fkey";

-- DropForeignKey
ALTER TABLE "PersonGroupMember" DROP CONSTRAINT "PersonGroupMember_groupId_fkey";

-- DropForeignKey
ALTER TABLE "PersonGroupMember" DROP CONSTRAINT "PersonGroupMember_personId_fkey";

-- DropForeignKey
ALTER TABLE "PersonTag" DROP CONSTRAINT "PersonTag_personId_fkey";

-- DropTable
DROP TABLE "PersonGroup";

-- DropTable
DROP TABLE "PersonGroupMember";

-- DropTable
DROP TABLE "PersonTag";

-- DropEnum
DROP TYPE "GroupMemberRole";

-- DropEnum
DROP TYPE "GroupStatus";

-- DropEnum
DROP TYPE "GroupType";
