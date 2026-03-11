/*
  Warnings:

  - You are about to drop the `ApiKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_churchId_fkey";

-- DropForeignKey
ALTER TABLE "ContentTag" DROP CONSTRAINT "ContentTag_tagId_fkey";

-- DropTable
DROP TABLE "ApiKey";

-- DropTable
DROP TABLE "ContentTag";
