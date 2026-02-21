# 13. Sermons & Media Library

## Sermon Management, Media Storage & Streaming

---

## 1. Overview

### Purpose
The Sermons & Media Library provides churches with comprehensive tools for managing, organizing, and delivering sermon content across multiple platforms. From recording to distribution, the system handles video/audio hosting, sermon series organization, speaker management, and engagement analytics.

### Competitive Analysis

| Feature | Sermon.net | Faithlife | Subsplash | **Digital Church Platform** |
|---------|-----------|-----------|-----------|----------------------------|
| Video Hosting | Basic | Good | Premium | **Mux/S3 Integrated** |
| Audio Podcasting | Manual | Good | Premium | **Auto RSS Feed** |
| Series Management | Basic | Good | Good | **Advanced** |
| Search & Discovery | Basic | Good | Good | **Full-text + AI** |
| Transcript | None | Premium | None | **Auto-generated** |
| Multi-platform | Limited | Good | Excellent | **Web/Mobile/Podcast** |
| Analytics | Basic | Good | Premium | **Comprehensive** |
| Storage | 50GB | Unlimited | Varies | **S3/R2 Unlimited** |
| Live Streaming | None | Premium | Premium | **Integrated** |

### Key Features

1. **Multi-format Support**: Video, audio, notes, outlines, and transcripts
2. **Series Organization**: Group sermons into themed series
3. **Speaker Profiles**: Manage multiple speakers and guest preachers
4. **Auto Podcasting**: RSS feed generation for Apple/Spotify
5. **Transcript Generation**: AI-powered automatic transcription
6. **Engagement Analytics**: View counts, watch time, completion rates
7. **Social Sharing**: Clips, quotes, and social media integration
8. **Multi-platform Delivery**: Web, mobile app, podcast apps

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Sermons & Media Library                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────────┐ │
│  │    Sermon     │  │    Series     │  │      Speaker            │ │
│  │   Management  │  │   Management  │  │      Management         │ │
│  ├───────────────┤  ├───────────────┤  ├─────────────────────────┤ │
│  │ • Create/Edit │  │ • Create/Edit │  │ • Profiles              │ │
│  │ • Video/Audio │  │ • Series Art  │  │ • Social Links          │ │
│  │ • Scripture   │  │ • Order       │  │ • Bio/Photo             │ │
│  │ • Notes/PDF   │  │ • Archive     │  │ • Guest Speakers        │ │
│  │ • Transcripts │  │ • Featured    │  │ • Sermon History        │ │
│  └───────────────┘  └───────────────┘  └─────────────────────────┘ │
│                                                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────────┐ │
│  │    Media      │  │   Podcast     │  │      Analytics          │ │
│  │   Library     │  │   Distribution│  │      & Engagement       │ │
│  ├───────────────┤  ├───────────────┤  ├─────────────────────────┤ │
│  │ • Upload      │  │ • RSS Feed    │  │ • View Counts           │ │
│  │ • Folders     │  │ • Apple       │  │ • Watch Time            │ │
│  │ • Thumbnails  │  │ • Spotify     │  │ • Completion Rate       │ │
│  │ • CDN         │  │ • Google      │  │ • Popular Content       │ │
│  │ • Processing  │  │ • Auto-update │  │ • Device Analytics      │ │
│  └───────────────┘  └───────────────┘  └─────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Video Processing Pipeline                  │    │
│  │  Upload → Transcode → Thumbnail → CDN → Adaptive Streaming   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Core Sermon Model

```prisma
// =====================================================
// SERMONS & MEDIA SCHEMA
// =====================================================

model Sermon {
  id              String        @id @default(uuid())
  tenantId        String        @map("tenant_id")
  tenant          Tenant        @relation(fields: [tenantId], references: [id])

  // Basic Info
  title           String
  slug            String
  description     String?       @db.Text
  excerpt         String?       @db.VarChar(300)

  // Scripture Reference
  scripture       String?       // e.g., "John 3:16-21"
  scriptureBook   String?       @map("scripture_book")
  scriptureChapter Int?         @map("scripture_chapter")
  scriptureVerseStart Int?      @map("scripture_verse_start")
  scriptureVerseEnd Int?        @map("scripture_verse_end")

  // Date & Duration
  date            DateTime      @db.Date
  duration        Int?          // seconds

  // Speaker
  speakerId       String?       @map("speaker_id")
  speaker         Speaker?      @relation(fields: [speakerId], references: [id])
  guestSpeaker    String?       @map("guest_speaker") // For non-registered speakers

  // Media - Video
  videoProvider   VideoProvider? @map("video_provider")
  videoId         String?       @map("video_id") // Mux/YouTube/Vimeo ID
  videoUrl        String?       @map("video_url")
  videoEmbedUrl   String?       @map("video_embed_url")
  videoThumbnail  String?       @map("video_thumbnail")
  videoStatus     MediaStatus?  @map("video_status")
  videoPlaybackId String?       @map("video_playback_id") // Mux playback ID

  // Media - Audio
  audioProvider   AudioProvider? @map("audio_provider")
  audioUrl        String?       @map("audio_url")
  audioFileSize   Int?          @map("audio_file_size")
  audioStatus     MediaStatus?  @map("audio_status")

  // Thumbnail
  thumbnail       String?
  thumbnailAlt    String?       @map("thumbnail_alt")

  // Attachments
  notesUrl        String?       @map("notes_url")
  outlineUrl      String?       @map("outline_url")
  slidesUrl       String?       @map("slides_url")
  discussionGuideUrl String?    @map("discussion_guide_url")
  attachments     Json?         // [{name, url, type, size}]

  // Transcript
  transcript      String?       @db.Text
  transcriptStatus TranscriptStatus? @map("transcript_status")
  transcriptUrl   String?       @map("transcript_url")
  transcriptVtt   String?       @map("transcript_vtt") // VTT caption file

  // Series
  seriesId        String?       @map("series_id")
  series          SermonSeries? @relation(fields: [seriesId], references: [id])
  seriesOrder     Int?          @map("series_order")

  // Categories & Tags
  categories      SermonCategory[]
  tags            String[]      @default([])
  topics          String[]      @default([])

  // Status
  status          SermonStatus  @default(DRAFT)
  visibility      Visibility    @default(PUBLIC)
  isFeatured      Boolean       @default(false) @map("is_featured")
  featuredOrder   Int?          @map("featured_order")

  // Podcast
  includeInPodcast Boolean      @default(true) @map("include_in_podcast")
  podcastPublishedAt DateTime?  @map("podcast_published_at")
  itunesEpisodeType String?     @map("itunes_episode_type") // full, trailer, bonus
  itunesExplicit  Boolean       @default(false) @map("itunes_explicit")

  // SEO
  metaTitle       String?       @map("meta_title")
  metaDescription String?       @map("meta_description")
  ogImage         String?       @map("og_image")

  // Engagement
  viewCount       Int           @default(0) @map("view_count")
  playCount       Int           @default(0) @map("play_count")
  downloadCount   Int           @default(0) @map("download_count")
  shareCount      Int           @default(0) @map("share_count")
  avgWatchTime    Int?          @map("avg_watch_time") // seconds
  completionRate  Float?        @map("completion_rate") // percentage

  // Author (who created the record)
  authorId        String?       @map("author_id")
  author          User?         @relation("SermonAuthor", fields: [authorId], references: [id])

  // Timestamps
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  publishedAt     DateTime?     @map("published_at")
  deletedAt       DateTime?     @map("deleted_at")

  // Relations
  views           SermonView[]
  notes           SermonNote[]
  clips           SermonClip[]
  bookmarks       SermonBookmark[]

  @@unique([tenantId, slug])
  @@map("sermons")
  @@index([tenantId])
  @@index([tenantId, status])
  @@index([date])
  @@index([speakerId])
  @@index([seriesId])
  @@index([tags])
}

enum VideoProvider {
  MUX
  YOUTUBE
  VIMEO
  SELF_HOSTED
  FACEBOOK
  WISTIA
}

enum AudioProvider {
  S3
  CLOUDFLARE_R2
  SELF_HOSTED
  SOUNDCLOUD
}

enum MediaStatus {
  PENDING
  PROCESSING
  READY
  ERROR
}

enum TranscriptStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum SermonStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  ARCHIVED
}

enum Visibility {
  PUBLIC
  MEMBERS_ONLY
  PRIVATE
  UNLISTED
}
```

### 3.2 Series & Categories

```prisma
model SermonSeries {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")

  // Basic Info
  title           String
  slug            String
  description     String?   @db.Text
  subtitle        String?

  // Media
  thumbnail       String?
  bannerImage     String?   @map("banner_image")
  trailerVideoUrl String?   @map("trailer_video_url")

  // Dates
  startDate       DateTime? @map("start_date")
  endDate         DateTime? @map("end_date")

  // Display
  isActive        Boolean   @default(true) @map("is_active")
  isFeatured      Boolean   @default(false) @map("is_featured")
  displayOrder    Int       @default(0) @map("display_order")

  // Styling
  primaryColor    String?   @map("primary_color")
  secondaryColor  String?   @map("secondary_color")

  // SEO
  metaTitle       String?   @map("meta_title")
  metaDescription String?   @map("meta_description")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  // Relations
  sermons         Sermon[]

  @@unique([tenantId, slug])
  @@map("sermon_series")
  @@index([tenantId])
  @@index([isActive])
}

model SermonCategory {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  parentId        String?   @map("parent_id")
  parent          SermonCategory? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        SermonCategory[] @relation("CategoryHierarchy")

  name            String
  slug            String
  description     String?
  icon            String?
  color           String?
  sortOrder       Int       @default(0) @map("sort_order")
  isActive        Boolean   @default(true) @map("is_active")

  // Relations
  sermons         Sermon[]

  @@unique([tenantId, slug])
  @@map("sermon_categories")
  @@index([tenantId])
  @@index([parentId])
}

model SermonTopic {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  name            String
  slug            String
  description     String?
  sermonCount     Int       @default(0) @map("sermon_count")

  @@unique([tenantId, slug])
  @@map("sermon_topics")
  @@index([tenantId])
}
```

### 3.3 Speaker Management

```prisma
model Speaker {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")

  // Identity
  firstName       String    @map("first_name")
  lastName        String    @map("last_name")
  displayName     String?   @map("display_name")
  slug            String

  // Profile
  title           String?   // e.g., "Senior Pastor", "Teaching Pastor"
  bio             String?   @db.Text
  shortBio        String?   @map("short_bio") @db.VarChar(300)
  photo           String?

  // Contact
  email           String?
  phone           String?

  // Social Links
  website         String?
  twitter         String?
  instagram       String?
  facebook        String?
  linkedin        String?
  youtube         String?

  // Status
  type            SpeakerType @default(STAFF)
  isActive        Boolean   @default(true) @map("is_active")
  isFeatured      Boolean   @default(false) @map("is_featured")
  displayOrder    Int       @default(0) @map("display_order")

  // Link to church member (if applicable)
  memberId        String?   @unique @map("member_id")

  // Stats
  sermonCount     Int       @default(0) @map("sermon_count")
  totalViews      Int       @default(0) @map("total_views")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  // Relations
  sermons         Sermon[]

  @@unique([tenantId, slug])
  @@map("speakers")
  @@index([tenantId])
  @@index([type])
}

enum SpeakerType {
  STAFF       // Regular church staff
  GUEST       // Guest speaker
  ELDER       // Church elder
  DEACON      // Deacon
  INTERN      // Ministry intern
  EMERITUS    // Retired pastor
}
```

### 3.4 Media Library

```prisma
model Media {
  id              String      @id @default(uuid())
  tenantId        String      @map("tenant_id")
  tenant          Tenant      @relation(fields: [tenantId], references: [id])

  // File Info
  filename        String
  originalName    String      @map("original_name")
  mimeType        String      @map("mime_type")
  size            Int         // bytes

  // URLs
  url             String
  thumbnailUrl    String?     @map("thumbnail_url")
  cdnUrl          String?     @map("cdn_url")

  // Dimensions (images/videos)
  width           Int?
  height          Int?

  // Duration (audio/video)
  duration        Int?        // seconds

  // Processing
  status          MediaStatus @default(PENDING)
  processingError String?     @map("processing_error")

  // Metadata
  alt             String?
  caption         String?
  description     String?

  // Organization
  folderId        String?     @map("folder_id")
  folder          MediaFolder? @relation(fields: [folderId], references: [id])
  tags            String[]    @default([])

  // Usage Tracking
  usageCount      Int         @default(0) @map("usage_count")

  // Upload Info
  uploadedBy      String?     @map("uploaded_by")

  // Timestamps
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")
  deletedAt       DateTime?   @map("deleted_at")

  @@map("media")
  @@index([tenantId])
  @@index([folderId])
  @@index([mimeType])
  @@index([tags])
}

model MediaFolder {
  id              String        @id @default(uuid())
  tenantId        String        @map("tenant_id")
  parentId        String?       @map("parent_id")
  parent          MediaFolder?  @relation("FolderHierarchy", fields: [parentId], references: [id])
  children        MediaFolder[] @relation("FolderHierarchy")

  name            String
  slug            String
  description     String?

  // Stats
  fileCount       Int           @default(0) @map("file_count")
  totalSize       BigInt        @default(0) @map("total_size") // bytes

  // Timestamps
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  // Relations
  media           Media[]

  @@unique([tenantId, parentId, slug])
  @@map("media_folders")
  @@index([tenantId])
  @@index([parentId])
}
```

### 3.5 Engagement & Analytics

```prisma
model SermonView {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  sermonId        String    @map("sermon_id")
  sermon          Sermon    @relation(fields: [sermonId], references: [id], onDelete: Cascade)

  // Viewer
  memberId        String?   @map("member_id")
  sessionId       String?   @map("session_id")
  ipAddress       String?   @map("ip_address")

  // Watch Data
  watchedSeconds  Int       @default(0) @map("watched_seconds")
  percentWatched  Float     @default(0) @map("percent_watched")
  completed       Boolean   @default(false)

  // Device Info
  device          String?   // mobile, tablet, desktop
  browser         String?
  os              String?

  // Referrer
  referrer        String?
  source          String?   // direct, social, email, search

  // Timestamps
  startedAt       DateTime  @default(now()) @map("started_at")
  lastActivity    DateTime  @default(now()) @map("last_activity")
  completedAt     DateTime? @map("completed_at")

  @@map("sermon_views")
  @@index([tenantId, sermonId])
  @@index([memberId])
  @@index([startedAt])
}

model SermonNote {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  sermonId        String    @map("sermon_id")
  sermon          Sermon    @relation(fields: [sermonId], references: [id], onDelete: Cascade)
  memberId        String    @map("member_id")

  // Note Content
  content         String    @db.Text
  timestamp       Int?      // seconds into sermon

  // Visibility
  isPublic        Boolean   @default(false) @map("is_public")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@map("sermon_notes")
  @@index([tenantId, sermonId])
  @@index([memberId])
}

model SermonBookmark {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  sermonId        String    @map("sermon_id")
  sermon          Sermon    @relation(fields: [sermonId], references: [id], onDelete: Cascade)
  memberId        String    @map("member_id")

  // Bookmark
  timestamp       Int?      // seconds into sermon
  label           String?

  createdAt       DateTime  @default(now()) @map("created_at")

  @@unique([sermonId, memberId, timestamp])
  @@map("sermon_bookmarks")
  @@index([memberId])
}

model SermonClip {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  sermonId        String    @map("sermon_id")
  sermon          Sermon    @relation(fields: [sermonId], references: [id], onDelete: Cascade)

  // Clip Info
  title           String
  description     String?
  startTime       Int       @map("start_time") // seconds
  endTime         Int       @map("end_time")   // seconds

  // Generated Media
  videoUrl        String?   @map("video_url")
  thumbnailUrl    String?   @map("thumbnail_url")
  status          MediaStatus @default(PENDING)

  // Social
  shareCount      Int       @default(0) @map("share_count")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")

  @@map("sermon_clips")
  @@index([tenantId, sermonId])
}
```

### 3.6 Podcast Configuration

```prisma
model PodcastSettings {
  id              String    @id @default(uuid())
  tenantId        String    @unique @map("tenant_id")

  // Podcast Info
  title           String
  subtitle        String?
  description     String    @db.Text
  author          String
  email           String
  copyright       String?

  // Artwork
  artwork         String    // 3000x3000 required
  category        String    // iTunes category
  subcategory     String?

  // Settings
  isExplicit      Boolean   @default(false) @map("is_explicit")
  language        String    @default("en-us")

  // iTunes
  itunesId        String?   @map("itunes_id")
  itunesUrl       String?   @map("itunes_url")

  // Spotify
  spotifyId       String?   @map("spotify_id")
  spotifyUrl      String?   @map("spotify_url")

  // Google Podcasts
  googlePodcastsUrl String? @map("google_podcasts_url")

  // Custom Feeds
  feedUrl         String?   @map("feed_url")
  customDomain    String?   @map("custom_domain")

  // Analytics
  downloadCount   Int       @default(0) @map("download_count")
  subscriberCount Int       @default(0) @map("subscriber_count")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@map("podcast_settings")
}
```

---

## 4. Services Layer

### 4.1 Sermon Service

```typescript
// lib/services/sermon-service.ts
import { prisma } from '@/lib/prisma';
import { Sermon, SermonStatus, Prisma } from '@prisma/client';
import { generateSlug } from '@/lib/utils';
import { MuxService } from './mux-service';
import { TranscriptService } from './transcript-service';

export interface SermonFilters {
  search?: string;
  status?: SermonStatus | SermonStatus[];
  seriesId?: string;
  speakerId?: string;
  categoryId?: string;
  tags?: string[];
  topics?: string[];
  startDate?: Date;
  endDate?: Date;
  isFeatured?: boolean;
}

export interface SermonCreateInput {
  title: string;
  description?: string;
  scripture?: string;
  date: Date;
  speakerId?: string;
  guestSpeaker?: string;
  seriesId?: string;
  seriesOrder?: number;
  categoryIds?: string[];
  tags?: string[];
  topics?: string[];
  visibility?: string;
  includeInPodcast?: boolean;
  videoFile?: File;
  audioFile?: File;
}

export class SermonService {
  constructor(private tenantId: string) {}

  private muxService = new MuxService();
  private transcriptService = new TranscriptService();

  async findMany(
    filters: SermonFilters = {},
    pagination: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}
  ) {
    const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc' } = pagination;
    const where = this.buildWhereClause(filters);

    const [sermons, total] = await Promise.all([
      prisma.sermon.findMany({
        where,
        include: {
          speaker: { select: { id: true, displayName: true, firstName: true, lastName: true, photo: true } },
          series: { select: { id: true, title: true, slug: true, thumbnail: true } },
          categories: { select: { id: true, name: true, slug: true } },
          _count: { select: { views: true, notes: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sermon.count({ where }),
    ]);

    return {
      data: sermons,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private buildWhereClause(filters: SermonFilters): Prisma.SermonWhereInput {
    const where: Prisma.SermonWhereInput = {
      tenantId: this.tenantId,
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { scripture: { contains: filters.search, mode: 'insensitive' } },
        { transcript: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status) ? { in: filters.status } : filters.status;
    }

    if (filters.seriesId) where.seriesId = filters.seriesId;
    if (filters.speakerId) where.speakerId = filters.speakerId;

    if (filters.categoryId) {
      where.categories = { some: { id: filters.categoryId } };
    }

    if (filters.tags?.length) where.tags = { hasEvery: filters.tags };
    if (filters.topics?.length) where.topics = { hasSome: filters.topics };

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;

    return where;
  }

  async findById(id: string) {
    return prisma.sermon.findFirst({
      where: { id, tenantId: this.tenantId, deletedAt: null },
      include: {
        speaker: true,
        series: { include: { sermons: { where: { status: 'PUBLISHED', deletedAt: null }, orderBy: { seriesOrder: 'asc' }, take: 20 } } },
        categories: true,
        clips: { where: { status: 'READY' } },
        _count: { select: { views: true, notes: true, bookmarks: true } },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.sermon.findFirst({
      where: { slug, tenantId: this.tenantId, status: 'PUBLISHED', deletedAt: null },
      include: {
        speaker: { select: { id: true, displayName: true, firstName: true, lastName: true, photo: true, title: true, bio: true } },
        series: true,
        categories: true,
      },
    });
  }

  async create(data: SermonCreateInput, authorId: string) {
    // Generate slug
    const baseSlug = generateSlug(data.title);
    let slug = baseSlug;
    let counter = 1;
    while (await this.slugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Upload video if provided
    let videoData = {};
    if (data.videoFile) {
      const upload = await this.muxService.uploadVideo(data.videoFile);
      videoData = {
        videoProvider: 'MUX',
        videoId: upload.assetId,
        videoPlaybackId: upload.playbackId,
        videoStatus: 'PROCESSING',
      };
    }

    // Upload audio if provided
    let audioData = {};
    if (data.audioFile) {
      const audioUrl = await this.uploadAudio(data.audioFile);
      audioData = {
        audioProvider: 'S3',
        audioUrl,
        audioFileSize: data.audioFile.size,
        audioStatus: 'READY',
      };
    }

    const sermon = await prisma.sermon.create({
      data: {
        tenantId: this.tenantId,
        title: data.title,
        slug,
        description: data.description,
        scripture: data.scripture,
        date: data.date,
        speakerId: data.speakerId,
        guestSpeaker: data.guestSpeaker,
        seriesId: data.seriesId,
        seriesOrder: data.seriesOrder,
        tags: data.tags || [],
        topics: data.topics || [],
        visibility: (data.visibility || 'PUBLIC') as any,
        includeInPodcast: data.includeInPodcast ?? true,
        authorId,
        categories: data.categoryIds?.length ? { connect: data.categoryIds.map(id => ({ id })) } : undefined,
        ...videoData,
        ...audioData,
      },
    });

    // Update speaker sermon count
    if (data.speakerId) {
      await prisma.speaker.update({
        where: { id: data.speakerId },
        data: { sermonCount: { increment: 1 } },
      });
    }

    return sermon;
  }

  async update(id: string, data: Partial<SermonCreateInput>) {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Sermon not found');

    // Update slug if title changed
    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      const baseSlug = generateSlug(data.title);
      slug = baseSlug;
      let counter = 1;
      while (await this.slugExists(slug, id)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    return prisma.sermon.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title, slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.scripture !== undefined && { scripture: data.scripture }),
        ...(data.date && { date: data.date }),
        ...(data.speakerId !== undefined && { speakerId: data.speakerId }),
        ...(data.guestSpeaker !== undefined && { guestSpeaker: data.guestSpeaker }),
        ...(data.seriesId !== undefined && { seriesId: data.seriesId }),
        ...(data.seriesOrder !== undefined && { seriesOrder: data.seriesOrder }),
        ...(data.tags && { tags: data.tags }),
        ...(data.topics && { topics: data.topics }),
        ...(data.visibility && { visibility: data.visibility as any }),
        ...(data.includeInPodcast !== undefined && { includeInPodcast: data.includeInPodcast }),
        ...(data.categoryIds && { categories: { set: data.categoryIds.map(id => ({ id })) } }),
        updatedAt: new Date(),
      },
    });
  }

  async publish(id: string) {
    const sermon = await this.findById(id);
    if (!sermon) throw new Error('Sermon not found');

    // Validate required fields for publishing
    if (!sermon.videoUrl && !sermon.audioUrl) {
      throw new Error('Sermon must have video or audio to publish');
    }

    return prisma.sermon.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        podcastPublishedAt: sermon.includeInPodcast ? new Date() : null,
      },
    });
  }

  async archive(id: string) {
    return prisma.sermon.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async delete(id: string) {
    const sermon = await this.findById(id);
    if (!sermon) throw new Error('Sermon not found');

    // Soft delete
    await prisma.sermon.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Update speaker count
    if (sermon.speakerId) {
      await prisma.speaker.update({
        where: { id: sermon.speakerId },
        data: { sermonCount: { decrement: 1 } },
      });
    }
  }

  async recordView(sermonId: string, data: {
    memberId?: string;
    sessionId?: string;
    watchedSeconds: number;
    percentWatched: number;
    device?: string;
    browser?: string;
    referrer?: string;
  }) {
    // Find or create view record
    const existingView = await prisma.sermonView.findFirst({
      where: {
        sermonId,
        OR: [
          { memberId: data.memberId },
          { sessionId: data.sessionId },
        ],
        startedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }, // Last 30 minutes
      },
    });

    if (existingView) {
      // Update existing view
      return prisma.sermonView.update({
        where: { id: existingView.id },
        data: {
          watchedSeconds: Math.max(existingView.watchedSeconds, data.watchedSeconds),
          percentWatched: Math.max(existingView.percentWatched, data.percentWatched),
          completed: data.percentWatched >= 90,
          completedAt: data.percentWatched >= 90 ? new Date() : null,
          lastActivity: new Date(),
        },
      });
    }

    // Create new view
    const view = await prisma.sermonView.create({
      data: {
        tenantId: this.tenantId,
        sermonId,
        memberId: data.memberId,
        sessionId: data.sessionId,
        watchedSeconds: data.watchedSeconds,
        percentWatched: data.percentWatched,
        device: data.device,
        browser: data.browser,
        referrer: data.referrer,
        completed: data.percentWatched >= 90,
      },
    });

    // Update sermon view count
    await prisma.sermon.update({
      where: { id: sermonId },
      data: { viewCount: { increment: 1 } },
    });

    return view;
  }

  async generateTranscript(id: string) {
    const sermon = await this.findById(id);
    if (!sermon) throw new Error('Sermon not found');
    if (!sermon.audioUrl && !sermon.videoUrl) {
      throw new Error('Sermon must have audio or video for transcription');
    }

    // Update status
    await prisma.sermon.update({
      where: { id },
      data: { transcriptStatus: 'PROCESSING' },
    });

    try {
      const mediaUrl = sermon.audioUrl || sermon.videoUrl!;
      const result = await this.transcriptService.transcribe(mediaUrl);

      await prisma.sermon.update({
        where: { id },
        data: {
          transcript: result.text,
          transcriptVtt: result.vttUrl,
          transcriptStatus: 'COMPLETED',
          duration: result.duration,
        },
      });

      return result;
    } catch (error) {
      await prisma.sermon.update({
        where: { id },
        data: { transcriptStatus: 'FAILED' },
      });
      throw error;
    }
  }

  async getLatest(limit: number = 10) {
    return prisma.sermon.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        speaker: { select: { id: true, displayName: true, firstName: true, lastName: true, photo: true } },
        series: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async getFeatured(limit: number = 5) {
    return prisma.sermon.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'PUBLISHED',
        isFeatured: true,
        deletedAt: null,
      },
      include: {
        speaker: { select: { id: true, displayName: true, firstName: true, lastName: true, photo: true } },
        series: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { featuredOrder: 'asc' },
      take: limit,
    });
  }

  private async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.sermon.findFirst({
      where: {
        tenantId: this.tenantId,
        slug,
        id: excludeId ? { not: excludeId } : undefined,
        deletedAt: null,
      },
    });
    return !!existing;
  }

  private async uploadAudio(file: File): Promise<string> {
    // Implementation using S3 or R2
    // This would upload to your cloud storage and return the URL
    return '';
  }
}
```

### 4.2 Mux Video Service

```typescript
// lib/services/mux-service.ts
import Mux from '@mux/mux-node';

const { Video } = new Mux(
  process.env.MUX_TOKEN_ID!,
  process.env.MUX_TOKEN_SECRET!
);

export interface MuxUploadResult {
  assetId: string;
  playbackId: string;
  uploadId: string;
  url: string;
}

export class MuxService {
  async createUploadUrl(): Promise<{ url: string; id: string }> {
    const upload = await Video.Uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'baseline',
        mp4_support: 'capped-1080p',
      },
      cors_origin: process.env.NEXT_PUBLIC_APP_URL,
    });

    return {
      url: upload.url,
      id: upload.id,
    };
  }

  async getUploadStatus(uploadId: string) {
    const upload = await Video.Uploads.get(uploadId);
    return {
      status: upload.status,
      assetId: upload.asset_id,
    };
  }

  async getAsset(assetId: string) {
    const asset = await Video.Assets.get(assetId);
    return {
      id: asset.id,
      status: asset.status,
      duration: asset.duration,
      playbackIds: asset.playback_ids,
      tracks: asset.tracks,
      aspectRatio: asset.aspect_ratio,
    };
  }

  async createPlaybackRestriction(refererDomains: string[]) {
    return Video.PlaybackRestrictions.create({
      referrer: {
        allowed_domains: refererDomains,
        allow_no_referrer: true,
      },
    });
  }

  getPlaybackUrl(playbackId: string): string {
    return `https://stream.mux.com/${playbackId}.m3u8`;
  }

  getThumbnailUrl(playbackId: string, options?: {
    width?: number;
    height?: number;
    time?: number;
    fit_mode?: 'preserve' | 'stretch' | 'crop' | 'smartcrop' | 'pad';
  }): string {
    const params = new URLSearchParams();
    if (options?.width) params.set('width', String(options.width));
    if (options?.height) params.set('height', String(options.height));
    if (options?.time) params.set('time', String(options.time));
    if (options?.fit_mode) params.set('fit_mode', options.fit_mode);

    const queryString = params.toString();
    return `https://image.mux.com/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`;
  }

  getAnimatedGifUrl(playbackId: string, options?: {
    start?: number;
    end?: number;
    width?: number;
    fps?: number;
  }): string {
    const params = new URLSearchParams();
    if (options?.start) params.set('start', String(options.start));
    if (options?.end) params.set('end', String(options.end));
    if (options?.width) params.set('width', String(options.width));
    if (options?.fps) params.set('fps', String(options.fps));

    const queryString = params.toString();
    return `https://image.mux.com/${playbackId}/animated.gif${queryString ? `?${queryString}` : ''}`;
  }

  async deleteAsset(assetId: string) {
    await Video.Assets.del(assetId);
  }

  async createClip(assetId: string, startTime: number, endTime: number) {
    const asset = await Video.Assets.create({
      input: [
        {
          url: `mux://assets/${assetId}`,
          start_time: startTime,
          end_time: endTime,
        },
      ],
      playback_policy: ['public'],
    });

    return asset;
  }
}
```

### 4.3 Podcast RSS Service

```typescript
// lib/services/podcast-service.ts
import { prisma } from '@/lib/prisma';
import RSS from 'rss';
import { format } from 'date-fns';

export class PodcastService {
  constructor(private tenantId: string) {}

  async generateRSSFeed(): Promise<string> {
    // Get podcast settings
    const settings = await prisma.podcastSettings.findUnique({
      where: { tenantId: this.tenantId },
    });

    if (!settings) {
      throw new Error('Podcast settings not configured');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: this.tenantId },
    });

    // Get published sermons for podcast
    const sermons = await prisma.sermon.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'PUBLISHED',
        includeInPodcast: true,
        audioUrl: { not: null },
        deletedAt: null,
      },
      include: {
        speaker: { select: { displayName: true, firstName: true, lastName: true } },
        series: { select: { title: true } },
      },
      orderBy: { date: 'desc' },
      take: 200, // iTunes recommends max 200 episodes
    });

    const siteUrl = `https://${tenant?.subdomain}.digitalchurch.com`;

    // Create RSS feed
    const feed = new RSS({
      title: settings.title,
      description: settings.description,
      feed_url: `${siteUrl}/api/podcast/feed.xml`,
      site_url: siteUrl,
      image_url: settings.artwork,
      language: settings.language,
      copyright: settings.copyright || `Copyright ${new Date().getFullYear()} ${tenant?.name}`,
      pubDate: sermons[0]?.date || new Date(),
      ttl: 60,
      custom_namespaces: {
        itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
        googleplay: 'http://www.google.com/schemas/play-podcasts/1.0',
        content: 'http://purl.org/rss/1.0/modules/content/',
      },
      custom_elements: [
        { 'itunes:author': settings.author },
        { 'itunes:summary': settings.description },
        { 'itunes:subtitle': settings.subtitle || '' },
        { 'itunes:owner': [
          { 'itunes:name': settings.author },
          { 'itunes:email': settings.email },
        ]},
        { 'itunes:explicit': settings.isExplicit ? 'yes' : 'no' },
        { 'itunes:category': { _attr: { text: settings.category } } },
        { 'itunes:image': { _attr: { href: settings.artwork } } },
        { 'googleplay:author': settings.author },
        { 'googleplay:email': settings.email },
        { 'googleplay:image': { _attr: { href: settings.artwork } } },
        { 'googleplay:category': { _attr: { text: settings.category } } },
        { 'googleplay:explicit': settings.isExplicit ? 'yes' : 'no' },
      ],
    });

    // Add episodes
    for (const sermon of sermons) {
      const speakerName = sermon.speaker
        ? sermon.speaker.displayName || `${sermon.speaker.firstName} ${sermon.speaker.lastName}`
        : sermon.guestSpeaker || settings.author;

      const episodeUrl = `${siteUrl}/sermons/${sermon.slug}`;

      feed.item({
        title: sermon.title,
        description: sermon.description || sermon.excerpt || '',
        url: episodeUrl,
        guid: sermon.id,
        date: sermon.date,
        enclosure: {
          url: sermon.audioUrl!,
          size: sermon.audioFileSize || 0,
          type: 'audio/mpeg',
        },
        custom_elements: [
          { 'itunes:author': speakerName },
          { 'itunes:subtitle': sermon.excerpt || sermon.scripture || '' },
          { 'itunes:summary': sermon.description || '' },
          { 'itunes:duration': this.formatDuration(sermon.duration || 0) },
          { 'itunes:explicit': sermon.itunesExplicit ? 'yes' : 'no' },
          { 'itunes:episodeType': sermon.itunesEpisodeType || 'full' },
          ...(sermon.thumbnail ? [{ 'itunes:image': { _attr: { href: sermon.thumbnail } } }] : []),
          ...(sermon.series ? [{ 'itunes:season': sermon.series.title }] : []),
          { 'content:encoded': sermon.description || '' },
        ],
      });
    }

    return feed.xml({ indent: true });
  }

  async updatePodcastSettings(data: {
    title?: string;
    subtitle?: string;
    description?: string;
    author?: string;
    email?: string;
    copyright?: string;
    artwork?: string;
    category?: string;
    subcategory?: string;
    isExplicit?: boolean;
    language?: string;
  }) {
    return prisma.podcastSettings.upsert({
      where: { tenantId: this.tenantId },
      update: data,
      create: {
        tenantId: this.tenantId,
        title: data.title || 'Church Podcast',
        description: data.description || '',
        author: data.author || '',
        email: data.email || '',
        artwork: data.artwork || '',
        category: data.category || 'Religion & Spirituality',
        ...data,
      },
    });
  }

  async getStats() {
    const settings = await prisma.podcastSettings.findUnique({
      where: { tenantId: this.tenantId },
    });

    const episodeCount = await prisma.sermon.count({
      where: {
        tenantId: this.tenantId,
        status: 'PUBLISHED',
        includeInPodcast: true,
        audioUrl: { not: null },
        deletedAt: null,
      },
    });

    const totalDownloads = await prisma.sermon.aggregate({
      where: {
        tenantId: this.tenantId,
        includeInPodcast: true,
        deletedAt: null,
      },
      _sum: { downloadCount: true },
    });

    return {
      episodeCount,
      totalDownloads: totalDownloads._sum.downloadCount || 0,
      subscriberCount: settings?.subscriberCount || 0,
      itunesUrl: settings?.itunesUrl,
      spotifyUrl: settings?.spotifyUrl,
    };
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }
}
```

---

## 5. API Endpoints

### 5.1 Sermons API

```typescript
// app/api/admin/sermons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SermonService } from '@/lib/services/sermon-service';
import { sermonSchema } from '@/lib/validations/sermon';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as any || undefined,
      seriesId: searchParams.get('seriesId') || undefined,
      speakerId: searchParams.get('speakerId') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined,
    };

    const pagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'date',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    const service = new SermonService(session.user.tenantId);
    const result = await service.findMany(filters, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching sermons:', error);
    return NextResponse.json({ error: 'Failed to fetch sermons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      scripture: formData.get('scripture') as string,
      date: new Date(formData.get('date') as string),
      speakerId: formData.get('speakerId') as string || undefined,
      guestSpeaker: formData.get('guestSpeaker') as string || undefined,
      seriesId: formData.get('seriesId') as string || undefined,
      seriesOrder: formData.get('seriesOrder') ? parseInt(formData.get('seriesOrder') as string) : undefined,
      categoryIds: formData.getAll('categoryIds') as string[],
      tags: JSON.parse(formData.get('tags') as string || '[]'),
      topics: JSON.parse(formData.get('topics') as string || '[]'),
      visibility: formData.get('visibility') as string || 'PUBLIC',
      includeInPodcast: formData.get('includeInPodcast') === 'true',
      videoFile: formData.get('video') as File | null || undefined,
      audioFile: formData.get('audio') as File | null || undefined,
    };

    const validatedData = sermonSchema.parse(data);
    const service = new SermonService(session.user.tenantId);
    const sermon = await service.create(validatedData, session.user.id);

    return NextResponse.json(sermon, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sermon:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create sermon' }, { status: 500 });
  }
}
```

### 5.2 Video Upload API

```typescript
// app/api/admin/sermons/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MuxService } from '@/lib/services/mux-service';

const muxService = new MuxService();

// Create upload URL
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, id } = await muxService.createUploadUrl();

    return NextResponse.json({ url, uploadId: id });
  } catch (error) {
    console.error('Error creating upload URL:', error);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }
}

// Check upload status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uploadId = request.nextUrl.searchParams.get('uploadId');
    if (!uploadId) {
      return NextResponse.json({ error: 'Upload ID required' }, { status: 400 });
    }

    const status = await muxService.getUploadStatus(uploadId);

    // If ready, get asset details
    if (status.status === 'asset_created' && status.assetId) {
      const asset = await muxService.getAsset(status.assetId);
      return NextResponse.json({
        ...status,
        asset,
        playbackUrl: asset.playbackIds?.[0]?.id
          ? muxService.getPlaybackUrl(asset.playbackIds[0].id)
          : null,
        thumbnailUrl: asset.playbackIds?.[0]?.id
          ? muxService.getThumbnailUrl(asset.playbackIds[0].id)
          : null,
      });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking upload status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
```

### 5.3 Podcast Feed API

```typescript
// app/api/podcast/feed.xml/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerTenant } from '@/lib/tenant/server-context';
import { PodcastService } from '@/lib/services/podcast-service';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getServerTenant();
    if (!tenant) {
      return new NextResponse('Tenant not found', { status: 404 });
    }

    const service = new PodcastService(tenant.id);
    const feed = await service.generateRSSFeed();

    return new NextResponse(feed, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: any) {
    console.error('Error generating podcast feed:', error);

    if (error.message === 'Podcast settings not configured') {
      return new NextResponse('Podcast not configured', { status: 404 });
    }

    return new NextResponse('Failed to generate feed', { status: 500 });
  }
}
```

### 5.4 View Tracking API

```typescript
// app/api/sermons/[id]/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServerTenant } from '@/lib/tenant/server-context';
import { SermonService } from '@/lib/services/sermon-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getServerTenant();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const body = await request.json();

    // Get session ID from cookie or generate
    const sessionId = request.cookies.get('session_id')?.value ||
      `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const service = new SermonService(tenant.id);
    const view = await service.recordView(params.id, {
      memberId: session?.user?.memberId,
      sessionId,
      watchedSeconds: body.watchedSeconds || 0,
      percentWatched: body.percentWatched || 0,
      device: body.device,
      browser: body.browser,
      referrer: body.referrer,
    });

    const response = NextResponse.json(view);

    // Set session cookie if new
    if (!request.cookies.get('session_id')) {
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    return response;
  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}
```

---

## 6. Video Player Component

```typescript
// components/sermons/SermonPlayer.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Settings,
  Download,
  Share,
  Bookmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SermonPlayerProps {
  sermon: {
    id: string;
    title: string;
    videoPlaybackId?: string;
    audioUrl?: string;
    thumbnail?: string;
    duration?: number;
    transcriptVtt?: string;
  };
  onProgress?: (data: { watchedSeconds: number; percentWatched: number }) => void;
  autoPlay?: boolean;
}

export function SermonPlayer({ sermon, onProgress, autoPlay = false }: SermonPlayerProps) {
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(sermon.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showCaptions, setShowCaptions] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Report progress every 30 seconds
    progressIntervalRef.current = setInterval(() => {
      if (isPlaying && duration > 0) {
        onProgress?.({
          watchedSeconds: Math.floor(currentTime),
          percentWatched: (currentTime / duration) * 100,
        });
      }
    }, 30000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, onProgress]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    setCurrentTime(time);
    if (playerRef.current) {
      playerRef.current.currentTime = time;
    }
  };

  const handleSkip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(newTime);
    if (playerRef.current) {
      playerRef.current.currentTime = newTime;
    }
  };

  if (sermon.videoPlaybackId) {
    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <MuxPlayer
          ref={playerRef}
          playbackId={sermon.videoPlaybackId}
          metadata={{
            video_id: sermon.id,
            video_title: sermon.title,
          }}
          streamType="on-demand"
          autoPlay={autoPlay}
          poster={sermon.thumbnail}
          primaryColor="#ffffff"
          secondaryColor="#000000"
          accentColor="#3B82F6"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e: any) => setCurrentTime(e.target.currentTime)}
          onLoadedMetadata={(e: any) => setDuration(e.target.duration)}
          className="w-full h-full"
        >
          {sermon.transcriptVtt && (
            <track
              kind="captions"
              src={sermon.transcriptVtt}
              srcLang="en"
              label="English"
              default={showCaptions}
            />
          )}
        </MuxPlayer>
      </div>
    );
  }

  // Audio player fallback
  if (sermon.audioUrl) {
    return (
      <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg p-8">
        <div className="flex flex-col items-center text-white">
          {/* Album art */}
          {sermon.thumbnail ? (
            <img
              src={sermon.thumbnail}
              alt={sermon.title}
              className="w-64 h-64 rounded-lg shadow-2xl mb-8"
            />
          ) : (
            <div className="w-64 h-64 rounded-lg bg-white/10 flex items-center justify-center mb-8">
              <Volume2 className="w-24 h-24 text-white/50" />
            </div>
          )}

          {/* Title */}
          <h2 className="text-xl font-semibold mb-6 text-center">{sermon.title}</h2>

          {/* Progress bar */}
          <div className="w-full max-w-md mb-4">
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-sm text-white/70 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSkip(-15)}
              className="text-white hover:bg-white/20"
            >
              <SkipBack className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white hover:bg-white/20 w-16 h-16 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSkip(30)}
              className="text-white hover:bg-white/20"
            >
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>

          {/* Hidden audio element */}
          <audio
            ref={playerRef}
            src={sermon.audioUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 rounded-lg p-8 text-center">
      <p className="text-gray-500">No media available for this sermon.</p>
    </div>
  );
}
```

---

## 7. Public Sermon Page

```typescript
// app/(tenant)/sermons/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getServerTenant } from '@/lib/tenant/server-context';
import { SermonService } from '@/lib/services/sermon-service';
import { SermonPlayer } from '@/components/sermons/SermonPlayer';
import { SermonDetails } from '@/components/sermons/SermonDetails';
import { SermonNotes } from '@/components/sermons/SermonNotes';
import { RelatedSermons } from '@/components/sermons/RelatedSermons';
import { SeriesNavigation } from '@/components/sermons/SeriesNavigation';
import { ShareButtons } from '@/components/ui/share-buttons';
import { format } from 'date-fns';
import { Calendar, User, Book, Clock, Download, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const tenant = await getServerTenant();
  if (!tenant) return {};

  const service = new SermonService(tenant.id);
  const sermon = await service.findBySlug(params.slug);

  if (!sermon) return {};

  return {
    title: `${sermon.title} | ${tenant.name}`,
    description: sermon.excerpt || sermon.description?.slice(0, 160),
    openGraph: {
      title: sermon.title,
      description: sermon.excerpt || sermon.description?.slice(0, 160),
      images: sermon.thumbnail ? [sermon.thumbnail] : [],
      type: 'article',
    },
  };
}

export default async function SermonPage({ params }: PageProps) {
  const tenant = await getServerTenant();
  if (!tenant) return null;

  const service = new SermonService(tenant.id);
  const sermon = await service.findBySlug(params.slug);

  if (!sermon) {
    notFound();
  }

  const speakerName = sermon.speaker
    ? sermon.speaker.displayName || `${sermon.speaker.firstName} ${sermon.speaker.lastName}`
    : sermon.guestSpeaker || 'Guest Speaker';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Player */}
            <SermonPlayer sermon={sermon} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Meta */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {sermon.title}
                </h1>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(sermon.date), 'MMMM d, yyyy')}
                  </div>

                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {speakerName}
                  </div>

                  {sermon.scripture && (
                    <div className="flex items-center">
                      <Book className="h-4 w-4 mr-2" />
                      {sermon.scripture}
                    </div>
                  )}

                  {sermon.duration && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {Math.floor(sermon.duration / 60)} min
                    </div>
                  )}
                </div>

                {/* Series Badge */}
                {sermon.series && (
                  <div className="mb-4">
                    <a
                      href={`/sermons/series/${sermon.series.slug}`}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
                    >
                      Part of: {sermon.series.title}
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {sermon.audioUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={sermon.audioUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download Audio
                      </a>
                    </Button>
                  )}

                  {sermon.notesUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={sermon.notesUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download Notes
                      </a>
                    </Button>
                  )}

                  <Button variant="outline" size="sm">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save
                  </Button>

                  <ShareButtons
                    url={`/sermons/${sermon.slug}`}
                    title={sermon.title}
                    description={sermon.excerpt}
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow-sm">
                <Tabs defaultValue="description">
                  <TabsList className="border-b w-full justify-start rounded-none px-4">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    {sermon.transcript && (
                      <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    )}
                    <TabsTrigger value="notes">My Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="p-6">
                    {sermon.description ? (
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: sermon.description }}
                      />
                    ) : (
                      <p className="text-gray-500">No description available.</p>
                    )}
                  </TabsContent>

                  {sermon.transcript && (
                    <TabsContent value="transcript" className="p-6">
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-wrap">{sermon.transcript}</p>
                      </div>
                    </TabsContent>
                  )}

                  <TabsContent value="notes" className="p-6">
                    <SermonNotes sermonId={sermon.id} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Speaker Card */}
              {sermon.speaker && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Speaker</h3>
                  <a
                    href={`/speakers/${sermon.speaker.slug}`}
                    className="flex items-center gap-4 group"
                  >
                    {sermon.speaker.photo ? (
                      <img
                        src={sermon.speaker.photo}
                        alt={speakerName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {speakerName}
                      </p>
                      {sermon.speaker.title && (
                        <p className="text-sm text-gray-500">
                          {sermon.speaker.title}
                        </p>
                      )}
                    </div>
                  </a>
                </div>
              )}

              {/* Series Navigation */}
              {sermon.series && (
                <SeriesNavigation
                  series={sermon.series}
                  currentSermonId={sermon.id}
                />
              )}

              {/* Related Sermons */}
              <RelatedSermons
                currentSermonId={sermon.id}
                speakerId={sermon.speakerId}
                seriesId={sermon.seriesId}
                categoryIds={sermon.categories.map(c => c.id)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 8. Analytics Dashboard

```typescript
// components/admin/sermons/SermonAnalytics.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Play, Eye, Clock, Download, TrendingUp, Users } from 'lucide-react';

interface SermonAnalyticsProps {
  stats: {
    totalSermons: number;
    totalViews: number;
    totalPlayTime: number; // seconds
    avgCompletionRate: number;
    viewsByPeriod: { date: string; views: number }[];
    topSermons: { id: string; title: string; views: number }[];
    viewsByDevice: { device: string; count: number }[];
    viewsBySource: { source: string; count: number }[];
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function SermonAnalytics({ stats }: SermonAnalyticsProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours.toLocaleString()}h ${minutes}m`;
    }
    return `${minutes.toLocaleString()}m`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Play className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Sermons</p>
                <p className="text-2xl font-bold">{stats.totalSermons}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Views</p>
                <p className="text-2xl font-bold">
                  {stats.totalViews.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Watch Time</p>
                <p className="text-2xl font-bold">
                  {formatDuration(stats.totalPlayTime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. Completion</p>
                <p className="text-2xl font-bold">
                  {Math.round(stats.avgCompletionRate)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.viewsByPeriod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#0088FE"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Sermons */}
        <Card>
          <CardHeader>
            <CardTitle>Most Viewed Sermons</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topSermons} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="title"
                  type="category"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="views" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views by Device */}
        <Card>
          <CardHeader>
            <CardTitle>Views by Device</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.viewsByDevice}
                  dataKey="count"
                  nameKey="device"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {stats.viewsByDevice.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.viewsBySource}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {stats.viewsBySource.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 9. Best Practices

### Video Processing
1. **Adaptive Streaming**: Use HLS for cross-device compatibility
2. **Multiple Qualities**: Provide 360p, 720p, 1080p options
3. **Thumbnail Generation**: Auto-generate thumbnails at key points
4. **Processing Queue**: Handle video uploads asynchronously

### Audio Optimization
1. **Format**: Use MP3 for maximum compatibility
2. **Bitrate**: 128kbps for podcast, 256kbps for high quality
3. **Normalization**: Consistent audio levels across sermons
4. **ID3 Tags**: Include metadata for podcast apps

### Search & Discovery
1. **Full-text Search**: Index title, description, transcript
2. **Topics & Tags**: Consistent taxonomy for browsing
3. **Scripture Index**: Allow search by Bible reference
4. **Related Content**: ML-based recommendations

### Analytics
1. **View Tracking**: Record plays, progress, completion
2. **Engagement**: Track notes, bookmarks, shares
3. **Device Analytics**: Mobile vs desktop breakdown
4. **Performance**: Monitor playback quality

---

**Document Version**: 1.0
**Last Updated**: December 2024
**Maintained By**: Digital Church Platform Team
