-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "costAmount" TEXT,
ADD COLUMN     "costType" TEXT DEFAULT 'FREE',
ADD COLUMN     "maxParticipants" INTEGER,
ADD COLUMN     "registrationDeadline" TIMESTAMP(3),
ADD COLUMN     "registrationRequired" BOOLEAN NOT NULL DEFAULT false;
