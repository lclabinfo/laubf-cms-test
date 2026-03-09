-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "navCtaHref" TEXT,
ADD COLUMN     "navCtaLabel" TEXT,
ADD COLUMN     "navCtaVisible" BOOLEAN NOT NULL DEFAULT false;
