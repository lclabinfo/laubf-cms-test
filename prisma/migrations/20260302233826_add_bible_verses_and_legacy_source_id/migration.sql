-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttachmentType" ADD VALUE 'DOC';
ALTER TYPE "AttachmentType" ADD VALUE 'RTF';

-- AlterTable
ALTER TABLE "BibleStudyAttachment" ADD COLUMN     "legacySourceId" INTEGER;

-- CreateTable
CREATE TABLE "bible_verses" (
    "id" SERIAL NOT NULL,
    "book" "BibleBook" NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "version" VARCHAR(10) NOT NULL,

    CONSTRAINT "bible_verses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bible_verses_book_chapter_verse_version_idx" ON "bible_verses"("book", "chapter", "verse", "version");

-- CreateIndex
CREATE INDEX "bible_verses_version_book_chapter_idx" ON "bible_verses"("version", "book", "chapter");

-- CreateIndex
CREATE UNIQUE INDEX "bible_verses_version_book_chapter_verse_key" ON "bible_verses"("version", "book", "chapter", "verse");
