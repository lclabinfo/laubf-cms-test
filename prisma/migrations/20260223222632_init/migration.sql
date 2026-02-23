-- CreateEnum
CREATE TYPE "ChurchStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "SubStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID');

-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "SslStatus" AS ENUM ('PENDING', 'ACTIVE', 'ERROR');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MEETING', 'EVENT', 'PROGRAM');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('IN_PERSON', 'ONLINE');

-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'WEEKDAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RecurrenceEndType" AS ENUM ('NEVER', 'ON_DATE', 'AFTER');

-- CreateEnum
CREATE TYPE "BibleBook" AS ENUM ('GENESIS', 'EXODUS', 'LEVITICUS', 'NUMBERS', 'DEUTERONOMY', 'JOSHUA', 'JUDGES', 'RUTH', 'FIRST_SAMUEL', 'SECOND_SAMUEL', 'FIRST_KINGS', 'SECOND_KINGS', 'FIRST_CHRONICLES', 'SECOND_CHRONICLES', 'EZRA', 'NEHEMIAH', 'ESTHER', 'JOB', 'PSALMS', 'PROVERBS', 'ECCLESIASTES', 'SONG_OF_SOLOMON', 'ISAIAH', 'JEREMIAH', 'LAMENTATIONS', 'EZEKIEL', 'DANIEL', 'HOSEA', 'JOEL', 'AMOS', 'OBADIAH', 'JONAH', 'MICAH', 'NAHUM', 'HABAKKUK', 'ZEPHANIAH', 'HAGGAI', 'ZECHARIAH', 'MALACHI', 'MATTHEW', 'MARK', 'LUKE', 'JOHN', 'ACTS', 'ROMANS', 'FIRST_CORINTHIANS', 'SECOND_CORINTHIANS', 'GALATIANS', 'EPHESIANS', 'PHILIPPIANS', 'COLOSSIANS', 'FIRST_THESSALONIANS', 'SECOND_THESSALONIANS', 'FIRST_TIMOTHY', 'SECOND_TIMOTHY', 'TITUS', 'PHILEMON', 'HEBREWS', 'JAMES', 'FIRST_PETER', 'SECOND_PETER', 'FIRST_JOHN', 'SECOND_JOHN', 'THIRD_JOHN', 'JUDE', 'REVELATION');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('PDF', 'DOCX', 'IMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "VideoCategory" AS ENUM ('EVENT_RECAP', 'WORSHIP', 'TESTIMONY', 'SPECIAL_FEATURE', 'DAILY_BREAD', 'PROMO', 'OTHER');

-- CreateEnum
CREATE TYPE "AnnouncePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('STANDARD', 'LANDING', 'MINISTRY', 'CAMPUS', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PageLayout" AS ENUM ('DEFAULT', 'FULL_WIDTH', 'NARROW');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('HERO_BANNER', 'PAGE_HERO', 'TEXT_IMAGE_HERO', 'EVENTS_HERO', 'MINISTRY_HERO', 'MEDIA_TEXT', 'MEDIA_GRID', 'SPOTLIGHT_MEDIA', 'PHOTO_GALLERY', 'QUOTE_BANNER', 'CTA_BANNER', 'ABOUT_DESCRIPTION', 'STATEMENT', 'ACTION_CARD_GRID', 'HIGHLIGHT_CARDS', 'FEATURE_BREAKDOWN', 'PATHWAY_CARD', 'PILLARS', 'NEWCOMER', 'ALL_MESSAGES', 'ALL_EVENTS', 'ALL_BIBLE_STUDIES', 'ALL_VIDEOS', 'UPCOMING_EVENTS', 'EVENT_CALENDAR', 'RECURRING_MEETINGS', 'RECURRING_SCHEDULE', 'MINISTRY_INTRO', 'MINISTRY_SCHEDULE', 'CAMPUS_CARD_GRID', 'DIRECTORY_LIST', 'MEET_TEAM', 'LOCATION_DETAIL', 'FORM_SECTION', 'FAQ_SECTION', 'TIMELINE_SECTION', 'NAVBAR', 'FOOTER', 'QUICK_LINKS', 'DAILY_BREAD_FEATURE', 'CUSTOM_HTML', 'CUSTOM_EMBED');

-- CreateEnum
CREATE TYPE "ColorScheme" AS ENUM ('LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "PaddingSize" AS ENUM ('NONE', 'COMPACT', 'DEFAULT', 'SPACIOUS');

-- CreateEnum
CREATE TYPE "ContainerWidth" AS ENUM ('NARROW', 'STANDARD', 'FULL');

-- CreateEnum
CREATE TYPE "MenuLocation" AS ENUM ('HEADER', 'FOOTER', 'MOBILE', 'SIDEBAR');

-- CreateTable
CREATE TABLE "Church" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "customDomain" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "accentColor" TEXT DEFAULT '#000000',
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "websiteUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "twitterUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "ChurchStatus" NOT NULL DEFAULT 'ACTIVE',
    "plan" "PlanTier" NOT NULL DEFAULT 'STARTER',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Church_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChurchMember" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'EDITOR',
    "invitedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChurchMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "plan" "PlanTier" NOT NULL,
    "status" "SubStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDomain" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "status" "DomainStatus" NOT NULL DEFAULT 'PENDING',
    "verificationToken" TEXT,
    "sslStatus" "SslStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "permissions" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Speaker" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "photoUrl" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Speaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ministry" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Ministry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campus" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentTag" (
    "id" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,

    CONSTRAINT "ContentTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passage" TEXT,
    "speakerId" UUID,
    "dateFor" DATE NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT,
    "videoDescription" TEXT,
    "youtubeId" TEXT,
    "thumbnailUrl" TEXT,
    "duration" TEXT,
    "audioUrl" TEXT,
    "rawTranscript" TEXT,
    "liveTranscript" TEXT,
    "transcriptSegments" JSONB,
    "studySections" JSONB,
    "attachments" JSONB,
    "hasVideo" BOOLEAN NOT NULL DEFAULT false,
    "hasStudy" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "relatedStudyId" UUID,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedAt" TIMESTAMP(3),
    "searchVector" tsvector,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageSeries" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "seriesId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MessageSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "dateStart" DATE NOT NULL,
    "dateEnd" DATE,
    "startTime" TEXT,
    "endTime" TEXT,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "locationType" "LocationType" NOT NULL DEFAULT 'IN_PERSON',
    "location" TEXT,
    "address" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "meetingUrl" TEXT,
    "shortDescription" TEXT,
    "description" TEXT,
    "welcomeMessage" TEXT,
    "coverImage" TEXT,
    "imageAlt" TEXT,
    "imagePosition" TEXT,
    "contacts" TEXT[],
    "ministryId" UUID,
    "campusId" UUID,
    "badge" TEXT,
    "registrationUrl" TEXT,
    "capacity" INTEGER,
    "registrationCount" INTEGER NOT NULL DEFAULT 0,
    "links" JSONB,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" "Recurrence" NOT NULL DEFAULT 'NONE',
    "recurrenceDays" TEXT[],
    "recurrenceEndType" "RecurrenceEndType" NOT NULL DEFAULT 'NEVER',
    "recurrenceEndDate" DATE,
    "recurrenceEndAfter" INTEGER,
    "customRecurrence" JSONB,
    "recurrenceSchedule" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLink" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "external" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibleStudy" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "book" "BibleBook" NOT NULL,
    "passage" TEXT NOT NULL,
    "datePosted" DATE NOT NULL,
    "dateFor" DATE NOT NULL,
    "seriesId" UUID,
    "speakerId" UUID,
    "questions" TEXT,
    "answers" TEXT,
    "transcript" TEXT,
    "bibleText" TEXT,
    "keyVerseRef" TEXT,
    "keyVerseText" TEXT,
    "hasQuestions" BOOLEAN NOT NULL DEFAULT false,
    "hasAnswers" BOOLEAN NOT NULL DEFAULT false,
    "hasTranscript" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BibleStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibleStudyAttachment" (
    "id" UUID NOT NULL,
    "bibleStudyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "fileSize" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BibleStudyAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "category" "VideoCategory" NOT NULL,
    "datePublished" DATE NOT NULL,
    "duration" TEXT,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "isShort" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyBread" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "passage" TEXT NOT NULL,
    "keyVerse" TEXT,
    "body" TEXT NOT NULL,
    "bibleText" TEXT,
    "author" TEXT NOT NULL,
    "audioUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DailyBread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "folder" TEXT NOT NULL DEFAULT '/',
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "priority" "AnnouncePriority" NOT NULL DEFAULT 'NORMAL',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "formType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT,
    "fields" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "assignedTo" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" UUID,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "siteName" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "logoAlt" TEXT,
    "faviconUrl" TEXT,
    "ogImageUrl" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactAddress" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "twitterUrl" TEXT,
    "tiktokUrl" TEXT,
    "spotifyUrl" TEXT,
    "podcastUrl" TEXT,
    "serviceTimes" JSONB,
    "googleAnalyticsId" TEXT,
    "metaPixelId" TEXT,
    "enableBlog" BOOLEAN NOT NULL DEFAULT false,
    "enableGiving" BOOLEAN NOT NULL DEFAULT false,
    "enableMemberLogin" BOOLEAN NOT NULL DEFAULT false,
    "enablePrayerRequests" BOOLEAN NOT NULL DEFAULT false,
    "enableAnnouncements" BOOLEAN NOT NULL DEFAULT false,
    "enableSearch" BOOLEAN NOT NULL DEFAULT true,
    "customHeadHtml" TEXT,
    "customBodyHtml" TEXT,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImageUrl" TEXT,
    "canonicalUrl" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "pageType" "PageType" NOT NULL DEFAULT 'STANDARD',
    "layout" "PageLayout" NOT NULL DEFAULT 'DEFAULT',
    "isHomepage" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSection" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "sectionType" "SectionType" NOT NULL,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "colorScheme" "ColorScheme" NOT NULL DEFAULT 'LIGHT',
    "paddingY" "PaddingSize" NOT NULL DEFAULT 'DEFAULT',
    "containerWidth" "ContainerWidth" NOT NULL DEFAULT 'STANDARD',
    "enableAnimations" BOOLEAN NOT NULL DEFAULT true,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "PageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "location" "MenuLocation" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" UUID NOT NULL,
    "menuId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT,
    "description" TEXT,
    "iconName" TEXT,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "parentId" UUID,
    "groupLabel" TEXT,
    "featuredImage" TEXT,
    "featuredTitle" TEXT,
    "featuredDescription" TEXT,
    "featuredHref" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "previewUrl" TEXT,
    "category" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultTokens" JSONB NOT NULL,
    "defaultPages" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeCustomization" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "backgroundColor" TEXT,
    "textColor" TEXT,
    "headingColor" TEXT,
    "headingFont" TEXT,
    "bodyFont" TEXT,
    "baseFontSize" INTEGER,
    "borderRadius" TEXT,
    "navbarStyle" JSONB,
    "footerStyle" JSONB,
    "buttonStyle" JSONB,
    "cardStyle" JSONB,
    "customCss" TEXT,
    "tokenOverrides" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeCustomization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Church_slug_key" ON "Church"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Church_customDomain_key" ON "Church"("customDomain");

-- CreateIndex
CREATE INDEX "Church_slug_idx" ON "Church"("slug");

-- CreateIndex
CREATE INDEX "Church_status_idx" ON "Church"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "ChurchMember_churchId_idx" ON "ChurchMember"("churchId");

-- CreateIndex
CREATE INDEX "ChurchMember_userId_idx" ON "ChurchMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChurchMember_churchId_userId_key" ON "ChurchMember"("churchId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_churchId_key" ON "Subscription"("churchId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_churchId_idx" ON "Subscription"("churchId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CustomDomain_domain_key" ON "CustomDomain"("domain");

-- CreateIndex
CREATE INDEX "CustomDomain_churchId_idx" ON "CustomDomain"("churchId");

-- CreateIndex
CREATE INDEX "CustomDomain_domain_idx" ON "CustomDomain"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_churchId_idx" ON "ApiKey"("churchId");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "Speaker_churchId_isActive_idx" ON "Speaker"("churchId", "isActive");

-- CreateIndex
CREATE INDEX "Speaker_churchId_name_idx" ON "Speaker"("churchId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Speaker_churchId_slug_key" ON "Speaker"("churchId", "slug");

-- CreateIndex
CREATE INDEX "Series_churchId_isActive_idx" ON "Series"("churchId", "isActive");

-- CreateIndex
CREATE INDEX "Series_churchId_name_idx" ON "Series"("churchId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Series_churchId_slug_key" ON "Series"("churchId", "slug");

-- CreateIndex
CREATE INDEX "Ministry_churchId_isActive_idx" ON "Ministry"("churchId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Ministry_churchId_slug_key" ON "Ministry"("churchId", "slug");

-- CreateIndex
CREATE INDEX "Campus_churchId_isActive_idx" ON "Campus"("churchId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Campus_churchId_slug_key" ON "Campus"("churchId", "slug");

-- CreateIndex
CREATE INDEX "Tag_churchId_idx" ON "Tag"("churchId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_churchId_slug_key" ON "Tag"("churchId", "slug");

-- CreateIndex
CREATE INDEX "ContentTag_entityType_entityId_idx" ON "ContentTag"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ContentTag_tagId_idx" ON "ContentTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentTag_tagId_entityType_entityId_key" ON "ContentTag"("tagId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_relatedStudyId_key" ON "Message"("relatedStudyId");

-- CreateIndex
CREATE INDEX "Message_churchId_dateFor_idx" ON "Message"("churchId", "dateFor" DESC);

-- CreateIndex
CREATE INDEX "Message_churchId_speakerId_idx" ON "Message"("churchId", "speakerId");

-- CreateIndex
CREATE INDEX "Message_churchId_status_idx" ON "Message"("churchId", "status");

-- CreateIndex
CREATE INDEX "Message_churchId_status_dateFor_idx" ON "Message"("churchId", "status", "dateFor" DESC);

-- CreateIndex
CREATE INDEX "Message_churchId_hasVideo_idx" ON "Message"("churchId", "hasVideo");

-- CreateIndex
CREATE UNIQUE INDEX "Message_churchId_slug_key" ON "Message"("churchId", "slug");

-- CreateIndex
CREATE INDEX "MessageSeries_seriesId_idx" ON "MessageSeries"("seriesId");

-- CreateIndex
CREATE INDEX "MessageSeries_messageId_idx" ON "MessageSeries"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageSeries_messageId_seriesId_key" ON "MessageSeries"("messageId", "seriesId");

-- CreateIndex
CREATE INDEX "Event_churchId_dateStart_idx" ON "Event"("churchId", "dateStart");

-- CreateIndex
CREATE INDEX "Event_churchId_type_idx" ON "Event"("churchId", "type");

-- CreateIndex
CREATE INDEX "Event_churchId_ministryId_idx" ON "Event"("churchId", "ministryId");

-- CreateIndex
CREATE INDEX "Event_churchId_campusId_idx" ON "Event"("churchId", "campusId");

-- CreateIndex
CREATE INDEX "Event_churchId_status_idx" ON "Event"("churchId", "status");

-- CreateIndex
CREATE INDEX "Event_churchId_isFeatured_idx" ON "Event"("churchId", "isFeatured");

-- CreateIndex
CREATE INDEX "Event_churchId_isPinned_idx" ON "Event"("churchId", "isPinned");

-- CreateIndex
CREATE INDEX "Event_churchId_isRecurring_idx" ON "Event"("churchId", "isRecurring");

-- CreateIndex
CREATE INDEX "Event_churchId_status_dateStart_idx" ON "Event"("churchId", "status", "dateStart");

-- CreateIndex
CREATE INDEX "Event_churchId_type_status_dateStart_idx" ON "Event"("churchId", "type", "status", "dateStart");

-- CreateIndex
CREATE UNIQUE INDEX "Event_churchId_slug_key" ON "Event"("churchId", "slug");

-- CreateIndex
CREATE INDEX "EventLink_eventId_idx" ON "EventLink"("eventId");

-- CreateIndex
CREATE INDEX "BibleStudy_churchId_dateFor_idx" ON "BibleStudy"("churchId", "dateFor" DESC);

-- CreateIndex
CREATE INDEX "BibleStudy_churchId_book_idx" ON "BibleStudy"("churchId", "book");

-- CreateIndex
CREATE INDEX "BibleStudy_churchId_seriesId_idx" ON "BibleStudy"("churchId", "seriesId");

-- CreateIndex
CREATE INDEX "BibleStudy_churchId_speakerId_idx" ON "BibleStudy"("churchId", "speakerId");

-- CreateIndex
CREATE INDEX "BibleStudy_churchId_status_idx" ON "BibleStudy"("churchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BibleStudy_churchId_slug_key" ON "BibleStudy"("churchId", "slug");

-- CreateIndex
CREATE INDEX "BibleStudyAttachment_bibleStudyId_idx" ON "BibleStudyAttachment"("bibleStudyId");

-- CreateIndex
CREATE INDEX "Video_churchId_datePublished_idx" ON "Video"("churchId", "datePublished" DESC);

-- CreateIndex
CREATE INDEX "Video_churchId_category_idx" ON "Video"("churchId", "category");

-- CreateIndex
CREATE INDEX "Video_churchId_status_idx" ON "Video"("churchId", "status");

-- CreateIndex
CREATE INDEX "Video_churchId_isShort_idx" ON "Video"("churchId", "isShort");

-- CreateIndex
CREATE UNIQUE INDEX "Video_churchId_slug_key" ON "Video"("churchId", "slug");

-- CreateIndex
CREATE INDEX "DailyBread_churchId_date_idx" ON "DailyBread"("churchId", "date" DESC);

-- CreateIndex
CREATE INDEX "DailyBread_churchId_status_idx" ON "DailyBread"("churchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBread_churchId_slug_key" ON "DailyBread"("churchId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBread_churchId_date_key" ON "DailyBread"("churchId", "date");

-- CreateIndex
CREATE INDEX "MediaAsset_churchId_folder_idx" ON "MediaAsset"("churchId", "folder");

-- CreateIndex
CREATE INDEX "MediaAsset_churchId_mimeType_idx" ON "MediaAsset"("churchId", "mimeType");

-- CreateIndex
CREATE INDEX "MediaAsset_churchId_createdAt_idx" ON "MediaAsset"("churchId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Announcement_churchId_status_startDate_idx" ON "Announcement"("churchId", "status", "startDate");

-- CreateIndex
CREATE INDEX "ContactSubmission_churchId_isRead_idx" ON "ContactSubmission"("churchId", "isRead");

-- CreateIndex
CREATE INDEX "ContactSubmission_churchId_formType_idx" ON "ContactSubmission"("churchId", "formType");

-- CreateIndex
CREATE INDEX "ContactSubmission_churchId_createdAt_idx" ON "ContactSubmission"("churchId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_churchId_createdAt_idx" ON "AuditLog"("churchId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_churchId_entity_entityId_idx" ON "AuditLog"("churchId", "entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_churchId_userId_idx" ON "AuditLog"("churchId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_churchId_key" ON "SiteSettings"("churchId");

-- CreateIndex
CREATE INDEX "SiteSettings_churchId_idx" ON "SiteSettings"("churchId");

-- CreateIndex
CREATE INDEX "Page_churchId_isPublished_idx" ON "Page"("churchId", "isPublished");

-- CreateIndex
CREATE INDEX "Page_churchId_pageType_idx" ON "Page"("churchId", "pageType");

-- CreateIndex
CREATE INDEX "Page_churchId_parentId_idx" ON "Page"("churchId", "parentId");

-- CreateIndex
CREATE INDEX "Page_churchId_isHomepage_idx" ON "Page"("churchId", "isHomepage");

-- CreateIndex
CREATE UNIQUE INDEX "Page_churchId_slug_key" ON "Page"("churchId", "slug");

-- CreateIndex
CREATE INDEX "PageSection_pageId_sortOrder_idx" ON "PageSection"("pageId", "sortOrder");

-- CreateIndex
CREATE INDEX "PageSection_churchId_sectionType_idx" ON "PageSection"("churchId", "sectionType");

-- CreateIndex
CREATE INDEX "Menu_churchId_location_idx" ON "Menu"("churchId", "location");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_churchId_slug_key" ON "Menu"("churchId", "slug");

-- CreateIndex
CREATE INDEX "MenuItem_menuId_parentId_sortOrder_idx" ON "MenuItem"("menuId", "parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "MenuItem_menuId_sortOrder_idx" ON "MenuItem"("menuId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_slug_key" ON "Theme"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeCustomization_churchId_key" ON "ThemeCustomization"("churchId");

-- CreateIndex
CREATE INDEX "ThemeCustomization_churchId_idx" ON "ThemeCustomization"("churchId");

-- CreateIndex
CREATE INDEX "ThemeCustomization_themeId_idx" ON "ThemeCustomization"("themeId");

-- AddForeignKey
ALTER TABLE "ChurchMember" ADD CONSTRAINT "ChurchMember_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchMember" ADD CONSTRAINT "ChurchMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDomain" ADD CONSTRAINT "CustomDomain_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Speaker" ADD CONSTRAINT "Speaker_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ministry" ADD CONSTRAINT "Ministry_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTag" ADD CONSTRAINT "ContentTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Speaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_relatedStudyId_fkey" FOREIGN KEY ("relatedStudyId") REFERENCES "BibleStudy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageSeries" ADD CONSTRAINT "MessageSeries_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageSeries" ADD CONSTRAINT "MessageSeries_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLink" ADD CONSTRAINT "EventLink_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibleStudy" ADD CONSTRAINT "BibleStudy_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibleStudy" ADD CONSTRAINT "BibleStudy_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibleStudy" ADD CONSTRAINT "BibleStudy_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Speaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibleStudyAttachment" ADD CONSTRAINT "BibleStudyAttachment_bibleStudyId_fkey" FOREIGN KEY ("bibleStudyId") REFERENCES "BibleStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyBread" ADD CONSTRAINT "DailyBread_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactSubmission" ADD CONSTRAINT "ContactSubmission_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageSection" ADD CONSTRAINT "PageSection_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageSection" ADD CONSTRAINT "PageSection_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeCustomization" ADD CONSTRAINT "ThemeCustomization_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeCustomization" ADD CONSTRAINT "ThemeCustomization_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
