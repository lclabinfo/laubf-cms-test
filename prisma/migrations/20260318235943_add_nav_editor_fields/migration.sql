-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "scheduleMeta" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "navScrollBehavior" TEXT DEFAULT 'transparent-to-solid',
ADD COLUMN     "navSolidColor" TEXT DEFAULT 'white',
ADD COLUMN     "navSticky" BOOLEAN NOT NULL DEFAULT true;
