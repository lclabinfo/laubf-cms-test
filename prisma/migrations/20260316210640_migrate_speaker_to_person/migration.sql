-- DropForeignKey
ALTER TABLE "BibleStudy" DROP CONSTRAINT "BibleStudy_speakerId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_speakerId_fkey";

-- Data migration: remap speakerId from Speaker.id to matching Person.id (by name)
-- For each Speaker, find the Person with matching name (firstName + lastName or preferredName + lastName)
UPDATE "Message" m
SET "speakerId" = p.id
FROM "Speaker" s, "Person" p
WHERE m."speakerId" = s.id
  AND p."churchId" = s."churchId"
  AND p."deletedAt" IS NULL
  AND (
    TRIM(CONCAT(p."firstName", ' ', p."lastName")) = s.name
    OR TRIM(CONCAT(p."preferredName", ' ', p."lastName")) = s.name
  );

UPDATE "BibleStudy" bs
SET "speakerId" = p.id
FROM "Speaker" s, "Person" p
WHERE bs."speakerId" = s.id
  AND p."churchId" = s."churchId"
  AND p."deletedAt" IS NULL
  AND (
    TRIM(CONCAT(p."firstName", ' ', p."lastName")) = s.name
    OR TRIM(CONCAT(p."preferredName", ' ', p."lastName")) = s.name
  );

-- Null out any speakerIds that couldn't be matched (orphaned references)
UPDATE "Message" SET "speakerId" = NULL
WHERE "speakerId" IS NOT NULL
  AND "speakerId" NOT IN (SELECT id FROM "Person");

UPDATE "BibleStudy" SET "speakerId" = NULL
WHERE "speakerId" IS NOT NULL
  AND "speakerId" NOT IN (SELECT id FROM "Person");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibleStudy" ADD CONSTRAINT "BibleStudy_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
