-- AlterTable: make description required (fill NULLs first), drop severity
UPDATE "BuilderFeedback" SET "description" = '' WHERE "description" IS NULL;
ALTER TABLE "BuilderFeedback" ALTER COLUMN "description" SET NOT NULL;
ALTER TABLE "BuilderFeedback" DROP COLUMN "severity";
