# 19. Live Streaming Integration

## Real-Time Video Broadcasting & Interactive Worship Experience

**Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
**Category**: Technical Infrastructure

---

## Competitive Analysis

| Feature | Tithely | Pushpay | Subsplash | **Digital Church Platform** |
|---------|---------|---------|-----------|----------------------------|
| Built-in Streaming | Basic | None | Advanced | **Mux + AWS IVS** |
| Multi-bitrate | Limited | N/A | Yes | **Adaptive HLS** |
| Live Chat | Basic | N/A | Yes | **Real-time + Moderation** |
| DVR/Rewind | No | N/A | Limited | **Full DVR Support** |
| Auto-Recording | Manual | N/A | Yes | **Automatic VOD** |
| Simulcast | No | N/A | Limited | **Multi-platform** |
| Analytics | Basic | N/A | Good | **Real-time Dashboard** |
| Mobile Streaming | No | N/A | iOS Only | **iOS + Android** |
| Pricing | Add-on | N/A | Premium | **Included (Pro+)** |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Digital Church Live Streaming Platform                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         Stream Sources                                       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │   OBS/RTMP   │  │ Web Browser  │  │ Mobile App   │  │  Hardware    │    │ │
│  │  │   Encoder    │  │   WebRTC     │  │  Camera      │  │  Encoder     │    │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │ │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘ │
│            │                 │                 │                 │               │
│            ▼                 ▼                 ▼                 ▼               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                    Ingest Layer (Multi-Provider)                             │ │
│  │  ┌────────────────────────────┐  ┌────────────────────────────┐            │ │
│  │  │       Mux Live             │  │      AWS IVS               │            │ │
│  │  │  • RTMP/RTMPS Ingest      │  │  • Low-latency Streaming   │            │ │
│  │  │  • SRT Support            │  │  • Auto-scaling            │            │ │
│  │  │  • Adaptive Bitrate       │  │  • Global Edge Locations   │            │ │
│  │  └────────────────────────────┘  └────────────────────────────┘            │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                           │
│            ┌─────────────────────────┼─────────────────────────┐                │
│            ▼                         ▼                         ▼                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐              │
│  │  Transcoding     │  │   Recording      │  │   CDN Edge       │              │
│  │  • Multi-bitrate │  │  • Auto-VOD      │  │  • Global PoPs   │              │
│  │  • HLS/DASH      │  │  • Clips         │  │  • Low Latency   │              │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘              │
│                                      │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                    Playback & Interaction Layer                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │ HLS Player  │  │  Live Chat  │  │  Reactions  │  │   Giving    │        │ │
│  │  │ (Template)  │  │  (Socket.io)│  │  (Real-time)│  │  (Overlay)  │        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Database Schema

### 1.1 Core Live Stream Models

```prisma
// prisma/schema.prisma

model LiveStream {
  id              String           @id @default(uuid())
  tenantId        String           @map("tenant_id")

  // Stream Info
  title           String
  slug            String
  description     String?          @db.Text
  thumbnail       String?

  // Provider Configuration
  provider        StreamProvider   @default(MUX)
  providerStreamId String?         @map("provider_stream_id")
  providerPlaybackId String?       @map("provider_playback_id")

  // RTMP/SRT Credentials
  streamKey       String?          @map("stream_key")
  rtmpUrl         String?          @map("rtmp_url")
  srtUrl          String?          @map("srt_url")

  // Playback URLs
  playbackUrl     String?          @map("playback_url")
  embedUrl        String?          @map("embed_url")

  // Schedule
  scheduledStart  DateTime?        @map("scheduled_start")
  scheduledEnd    DateTime?        @map("scheduled_end")
  actualStart     DateTime?        @map("actual_start")
  actualEnd       DateTime?        @map("actual_end")
  timezone        String           @default("America/Chicago")

  // Status
  status          LiveStreamStatus @default(SCHEDULED)
  isRecurring     Boolean          @default(false) @map("is_recurring")
  recurringRule   String?          @map("recurring_rule") // iCal RRULE format

  // Features
  chatEnabled     Boolean          @default(true) @map("chat_enabled")
  reactionsEnabled Boolean         @default(true) @map("reactions_enabled")
  givingEnabled   Boolean          @default(true) @map("giving_enabled")
  dvr Enabled     Boolean          @default(true) @map("dvr_enabled")
  lowLatency      Boolean          @default(false) @map("low_latency")

  // Recording
  recordingEnabled Boolean         @default(true) @map("recording_enabled")
  recordingAssetId String?         @map("recording_asset_id")
  recordingUrl    String?          @map("recording_url")
  autoPublishVod  Boolean          @default(true) @map("auto_publish_vod")

  // Privacy
  visibility      Visibility       @default(PUBLIC)
  password        String?
  allowedMemberGroups String[]     @map("allowed_member_groups")

  // Analytics
  peakViewers     Int              @default(0) @map("peak_viewers")
  totalViews      Int              @default(0) @map("total_views")
  totalWatchTime  Int              @default(0) @map("total_watch_time") // seconds

  // Metadata
  eventId         String?          @map("event_id")
  sermonId        String?          @map("sermon_id")

  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  createdBy       String?          @map("created_by")

  // Relations
  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  event           Event?           @relation(fields: [eventId], references: [id])
  sermon          Sermon?          @relation(fields: [sermonId], references: [id])
  chatMessages    LiveChatMessage[]
  reactions       LiveReaction[]
  viewers         LiveStreamViewer[]
  simulcasts      Simulcast[]

  @@unique([tenantId, slug])
  @@index([tenantId, status])
  @@index([tenantId, scheduledStart])
  @@map("live_streams")
}

enum StreamProvider {
  MUX
  AWS_IVS
  YOUTUBE
  FACEBOOK
  CUSTOM_RTMP
}

enum LiveStreamStatus {
  SCHEDULED
  STARTING
  LIVE
  ENDING
  ENDED
  CANCELLED
  FAILED
}

model LiveChatMessage {
  id            String       @id @default(uuid())
  streamId      String       @map("stream_id")
  userId        String?      @map("user_id")
  guestName     String?      @map("guest_name")

  message       String       @db.Text
  type          ChatMessageType @default(MESSAGE)

  // Moderation
  isModerated   Boolean      @default(false) @map("is_moderated")
  moderatedBy   String?      @map("moderated_by")
  moderatedAt   DateTime?    @map("moderated_at")

  // Metadata
  isPinned      Boolean      @default(false) @map("is_pinned")
  isHighlighted Boolean      @default(false) @map("is_highlighted")
  replyTo       String?      @map("reply_to")

  createdAt     DateTime     @default(now()) @map("created_at")

  // Relations
  stream        LiveStream   @relation(fields: [streamId], references: [id], onDelete: Cascade)
  user          User?        @relation(fields: [userId], references: [id])

  @@index([streamId, createdAt])
  @@index([streamId, isModerated])
  @@map("live_chat_messages")
}

enum ChatMessageType {
  MESSAGE
  SYSTEM
  PRAYER_REQUEST
  ANNOUNCEMENT
  QUESTION
}

model LiveReaction {
  id          String       @id @default(uuid())
  streamId    String       @map("stream_id")
  userId      String?      @map("user_id")

  type        ReactionType
  timestamp   DateTime     @default(now())

  stream      LiveStream   @relation(fields: [streamId], references: [id], onDelete: Cascade)
  user        User?        @relation(fields: [userId], references: [id])

  @@index([streamId, timestamp])
  @@map("live_reactions")
}

enum ReactionType {
  LIKE
  LOVE
  PRAY
  AMEN
  CLAP
  RAISED_HANDS
}

model LiveStreamViewer {
  id            String       @id @default(uuid())
  streamId      String       @map("stream_id")

  // Viewer Info
  userId        String?      @map("user_id")
  sessionId     String       @map("session_id")
  deviceType    String?      @map("device_type")
  browser       String?
  country       String?
  region        String?
  city          String?

  // Watch Session
  joinedAt      DateTime     @default(now()) @map("joined_at")
  leftAt        DateTime?    @map("left_at")
  watchTime     Int          @default(0) @map("watch_time") // seconds

  // Quality
  avgBitrate    Int?         @map("avg_bitrate")
  bufferCount   Int          @default(0) @map("buffer_count")

  stream        LiveStream   @relation(fields: [streamId], references: [id], onDelete: Cascade)
  user          User?        @relation(fields: [userId], references: [id])

  @@index([streamId, joinedAt])
  @@index([userId])
  @@map("live_stream_viewers")
}

model Simulcast {
  id            String           @id @default(uuid())
  streamId      String           @map("stream_id")

  platform      SimulcastPlatform
  enabled       Boolean          @default(true)

  // Platform Credentials
  rtmpUrl       String?          @map("rtmp_url")
  streamKey     String?          @map("stream_key")

  // Status
  status        SimulcastStatus  @default(PENDING)
  lastError     String?          @map("last_error")

  createdAt     DateTime         @default(now()) @map("created_at")

  stream        LiveStream       @relation(fields: [streamId], references: [id], onDelete: Cascade)

  @@unique([streamId, platform])
  @@map("simulcasts")
}

enum SimulcastPlatform {
  YOUTUBE
  FACEBOOK
  TWITTER
  LINKEDIN
  CUSTOM
}

enum SimulcastStatus {
  PENDING
  CONNECTING
  LIVE
  DISCONNECTED
  FAILED
}

// Stream Settings per Tenant
model StreamSettings {
  id                    String   @id @default(uuid())
  tenantId              String   @unique @map("tenant_id")

  // Provider Config
  defaultProvider       StreamProvider @default(MUX)
  muxTokenId            String?  @map("mux_token_id")
  muxTokenSecret        String?  @map("mux_token_secret")
  awsIvsArn             String?  @map("aws_ivs_arn")

  // Default Settings
  defaultChatEnabled    Boolean  @default(true) @map("default_chat_enabled")
  defaultRecording      Boolean  @default(true) @map("default_recording")
  defaultLowLatency     Boolean  @default(false) @map("default_low_latency")
  defaultDvr            Boolean  @default(true) @map("default_dvr")

  // Chat Moderation
  chatModerationEnabled Boolean  @default(false) @map("chat_moderation_enabled")
  autoModerateLinks     Boolean  @default(true) @map("auto_moderate_links")
  blockedWords          String[] @map("blocked_words")
  slowModeSeconds       Int      @default(0) @map("slow_mode_seconds")

  // Branding
  watermarkUrl          String?  @map("watermark_url")
  watermarkPosition     String   @default("bottom-right") @map("watermark_position")
  preStreamImage        String?  @map("pre_stream_image")
  postStreamImage       String?  @map("post_stream_image")

  // Simulcast Credentials
  youtubeChannelId      String?  @map("youtube_channel_id")
  youtubeRefreshToken   String?  @map("youtube_refresh_token")
  facebookPageId        String?  @map("facebook_page_id")
  facebookAccessToken   String?  @map("facebook_access_token")

  tenant                Tenant   @relation(fields: [tenantId], references: [id])

  @@map("stream_settings")
}
```

---

## 2. Live Streaming Service

### 2.1 Core Stream Service

```typescript
// lib/services/live-stream-service.ts

import { prisma } from '@/lib/prisma';
import { MuxLiveService } from './mux-live-service';
import { AwsIvsService } from './aws-ivs-service';
import { LiveStreamStatus, StreamProvider, Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

export interface CreateStreamInput {
  title: string;
  description?: string;
  scheduledStart: Date;
  scheduledEnd?: Date;
  timezone?: string;
  chatEnabled?: boolean;
  recordingEnabled?: boolean;
  lowLatency?: boolean;
  visibility?: 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE';
  password?: string;
  eventId?: string;
}

export interface StreamCredentials {
  rtmpUrl: string;
  rtmpsUrl: string;
  srtUrl?: string;
  streamKey: string;
  playbackUrl: string;
}

export class LiveStreamService {
  private muxService: MuxLiveService;
  private ivsService: AwsIvsService;

  constructor(private tenantId: string) {
    this.muxService = new MuxLiveService();
    this.ivsService = new AwsIvsService();
  }

  // ============================================================
  // Stream Creation
  // ============================================================

  async createStream(data: CreateStreamInput): Promise<{
    stream: any;
    credentials: StreamCredentials;
  }> {
    // Get tenant settings
    const settings = await this.getSettings();
    const provider = settings?.defaultProvider || StreamProvider.MUX;

    // Generate unique stream key
    const streamKey = `live_${nanoid(24)}`;

    // Create stream with provider
    let providerStream;
    let credentials: StreamCredentials;

    if (provider === StreamProvider.MUX) {
      providerStream = await this.muxService.createLiveStream({
        playbackPolicy: data.visibility === 'PUBLIC' ? 'public' : 'signed',
        lowLatency: data.lowLatency ?? settings?.defaultLowLatency ?? false,
        recordingEnabled: data.recordingEnabled ?? settings?.defaultRecording ?? true,
        reconnectWindow: 60, // seconds
        maxContinuousDuration: 43200, // 12 hours
      });

      credentials = {
        rtmpUrl: `rtmp://global-live.mux.com:5222/app`,
        rtmpsUrl: `rtmps://global-live.mux.com:443/app`,
        srtUrl: providerStream.srtUrl,
        streamKey: providerStream.streamKey,
        playbackUrl: `https://stream.mux.com/${providerStream.playbackId}.m3u8`,
      };
    } else if (provider === StreamProvider.AWS_IVS) {
      providerStream = await this.ivsService.createChannel({
        name: data.title,
        latencyMode: data.lowLatency ? 'LOW' : 'NORMAL',
        type: 'STANDARD',
        recordingEnabled: data.recordingEnabled ?? true,
      });

      credentials = {
        rtmpUrl: providerStream.ingestEndpoint,
        rtmpsUrl: providerStream.ingestEndpoint.replace('rtmp://', 'rtmps://'),
        streamKey: providerStream.streamKey,
        playbackUrl: providerStream.playbackUrl,
      };
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Create database record
    const slug = this.generateSlug(data.title);

    const stream = await prisma.liveStream.create({
      data: {
        tenantId: this.tenantId,
        title: data.title,
        slug,
        description: data.description,
        provider,
        providerStreamId: providerStream.id,
        providerPlaybackId: providerStream.playbackId,
        streamKey: credentials.streamKey,
        rtmpUrl: credentials.rtmpUrl,
        playbackUrl: credentials.playbackUrl,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        timezone: data.timezone || 'America/Chicago',
        chatEnabled: data.chatEnabled ?? settings?.defaultChatEnabled ?? true,
        recordingEnabled: data.recordingEnabled ?? settings?.defaultRecording ?? true,
        lowLatency: data.lowLatency ?? settings?.defaultLowLatency ?? false,
        dvrEnabled: settings?.defaultDvr ?? true,
        visibility: data.visibility || 'PUBLIC',
        password: data.password,
        eventId: data.eventId,
        status: LiveStreamStatus.SCHEDULED,
      },
    });

    return { stream, credentials };
  }

  // ============================================================
  // Stream Lifecycle
  // ============================================================

  async startStream(streamId: string): Promise<void> {
    const stream = await this.getStream(streamId);

    if (stream.status !== LiveStreamStatus.SCHEDULED) {
      throw new Error('Stream is not in scheduled state');
    }

    await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: LiveStreamStatus.STARTING,
        actualStart: new Date(),
      },
    });

    // Start simulcasts if configured
    await this.startSimulcasts(streamId);
  }

  async goLive(streamId: string): Promise<void> {
    await prisma.liveStream.update({
      where: { id: streamId },
      data: { status: LiveStreamStatus.LIVE },
    });

    // Notify connected viewers
    await this.broadcastStreamEvent(streamId, 'stream:live', {
      streamId,
      timestamp: new Date(),
    });
  }

  async endStream(streamId: string): Promise<void> {
    const stream = await this.getStream(streamId);

    await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: LiveStreamStatus.ENDING,
        actualEnd: new Date(),
      },
    });

    // Stop simulcasts
    await this.stopSimulcasts(streamId);

    // Wait for recording if enabled
    if (stream.recordingEnabled) {
      await this.processRecording(streamId);
    }

    await prisma.liveStream.update({
      where: { id: streamId },
      data: { status: LiveStreamStatus.ENDED },
    });

    // Calculate final analytics
    await this.finalizeAnalytics(streamId);
  }

  // ============================================================
  // Stream Retrieval
  // ============================================================

  async getStream(streamId: string) {
    const stream = await prisma.liveStream.findFirst({
      where: {
        id: streamId,
        tenantId: this.tenantId,
      },
      include: {
        event: true,
        sermon: true,
        simulcasts: true,
      },
    });

    if (!stream) {
      throw new Error('Stream not found');
    }

    return stream;
  }

  async getUpcomingStreams(limit = 10) {
    return prisma.liveStream.findMany({
      where: {
        tenantId: this.tenantId,
        status: LiveStreamStatus.SCHEDULED,
        scheduledStart: { gte: new Date() },
      },
      orderBy: { scheduledStart: 'asc' },
      take: limit,
    });
  }

  async getLiveStreams() {
    return prisma.liveStream.findMany({
      where: {
        tenantId: this.tenantId,
        status: LiveStreamStatus.LIVE,
      },
      orderBy: { actualStart: 'desc' },
    });
  }

  async getPastStreams(options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [streams, total] = await Promise.all([
      prisma.liveStream.findMany({
        where: {
          tenantId: this.tenantId,
          status: LiveStreamStatus.ENDED,
        },
        orderBy: { actualEnd: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { viewers: true, chatMessages: true } },
        },
      }),
      prisma.liveStream.count({
        where: {
          tenantId: this.tenantId,
          status: LiveStreamStatus.ENDED,
        },
      }),
    ]);

    return {
      streams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // Recording & VOD
  // ============================================================

  private async processRecording(streamId: string): Promise<void> {
    const stream = await this.getStream(streamId);

    if (stream.provider === StreamProvider.MUX) {
      // Get recording from Mux
      const recording = await this.muxService.getRecording(stream.providerStreamId!);

      if (recording) {
        await prisma.liveStream.update({
          where: { id: streamId },
          data: {
            recordingAssetId: recording.assetId,
            recordingUrl: recording.playbackUrl,
          },
        });

        // Auto-publish as VOD if enabled
        if (stream.autoPublishVod) {
          await this.publishAsVod(streamId);
        }
      }
    } else if (stream.provider === StreamProvider.AWS_IVS) {
      const recording = await this.ivsService.getRecording(stream.providerStreamId!);

      if (recording) {
        await prisma.liveStream.update({
          where: { id: streamId },
          data: {
            recordingUrl: recording.url,
          },
        });
      }
    }
  }

  async publishAsVod(streamId: string): Promise<void> {
    const stream = await this.getStream(streamId);

    if (!stream.recordingUrl) {
      throw new Error('No recording available');
    }

    // Create sermon entry from stream
    if (stream.eventId) {
      await prisma.sermon.create({
        data: {
          tenantId: this.tenantId,
          title: stream.title,
          description: stream.description,
          slug: `${stream.slug}-recording`,
          date: stream.actualStart || stream.scheduledStart,
          videoUrl: stream.recordingUrl,
          videoProvider: stream.provider === StreamProvider.MUX ? 'MUX' : 'UPLOADED',
          videoPlaybackId: stream.providerPlaybackId,
          status: 'PUBLISHED',
          liveStreamId: stream.id,
        },
      });

      // Link sermon to stream
      await prisma.liveStream.update({
        where: { id: streamId },
        data: { sermonId: stream.sermonId },
      });
    }
  }

  // ============================================================
  // Simulcast Management
  // ============================================================

  async addSimulcast(
    streamId: string,
    platform: 'YOUTUBE' | 'FACEBOOK' | 'CUSTOM',
    credentials: { rtmpUrl: string; streamKey: string }
  ) {
    return prisma.simulcast.create({
      data: {
        streamId,
        platform,
        rtmpUrl: credentials.rtmpUrl,
        streamKey: credentials.streamKey,
        enabled: true,
      },
    });
  }

  private async startSimulcasts(streamId: string): Promise<void> {
    const simulcasts = await prisma.simulcast.findMany({
      where: { streamId, enabled: true },
    });

    for (const simulcast of simulcasts) {
      try {
        await this.startSimulcast(simulcast);

        await prisma.simulcast.update({
          where: { id: simulcast.id },
          data: { status: 'LIVE' },
        });
      } catch (error: any) {
        await prisma.simulcast.update({
          where: { id: simulcast.id },
          data: {
            status: 'FAILED',
            lastError: error.message,
          },
        });
      }
    }
  }

  private async startSimulcast(simulcast: any): Promise<void> {
    // Implementation depends on platform
    // This would use FFmpeg or a streaming relay service
    console.log(`Starting simulcast to ${simulcast.platform}`);
  }

  private async stopSimulcasts(streamId: string): Promise<void> {
    await prisma.simulcast.updateMany({
      where: { streamId },
      data: { status: 'DISCONNECTED' },
    });
  }

  // ============================================================
  // Analytics
  // ============================================================

  async trackViewer(
    streamId: string,
    viewerData: {
      userId?: string;
      sessionId: string;
      deviceType?: string;
      browser?: string;
      country?: string;
      region?: string;
      city?: string;
    }
  ) {
    return prisma.liveStreamViewer.create({
      data: {
        streamId,
        ...viewerData,
      },
    });
  }

  async updateViewerWatchTime(
    viewerId: string,
    watchTime: number
  ): Promise<void> {
    await prisma.liveStreamViewer.update({
      where: { id: viewerId },
      data: {
        watchTime,
        leftAt: new Date(),
      },
    });
  }

  async getCurrentViewerCount(streamId: string): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    return prisma.liveStreamViewer.count({
      where: {
        streamId,
        joinedAt: { gte: fiveMinutesAgo },
        leftAt: null,
      },
    });
  }

  async getStreamAnalytics(streamId: string) {
    const stream = await this.getStream(streamId);

    const [viewerStats, chatStats, reactionStats, geoStats] = await Promise.all([
      this.getViewerStats(streamId),
      this.getChatStats(streamId),
      this.getReactionStats(streamId),
      this.getGeoStats(streamId),
    ]);

    return {
      stream: {
        id: stream.id,
        title: stream.title,
        status: stream.status,
        duration: stream.actualEnd && stream.actualStart
          ? Math.floor((stream.actualEnd.getTime() - stream.actualStart.getTime()) / 1000)
          : null,
      },
      viewers: viewerStats,
      chat: chatStats,
      reactions: reactionStats,
      geography: geoStats,
    };
  }

  private async getViewerStats(streamId: string) {
    const viewers = await prisma.liveStreamViewer.findMany({
      where: { streamId },
    });

    return {
      total: viewers.length,
      unique: new Set(viewers.map(v => v.userId || v.sessionId)).size,
      peak: await this.getPeakViewers(streamId),
      avgWatchTime: viewers.length > 0
        ? Math.round(viewers.reduce((sum, v) => sum + v.watchTime, 0) / viewers.length)
        : 0,
      totalWatchTime: viewers.reduce((sum, v) => sum + v.watchTime, 0),
      devices: this.aggregateByField(viewers, 'deviceType'),
      browsers: this.aggregateByField(viewers, 'browser'),
    };
  }

  private async getPeakViewers(streamId: string): Promise<number> {
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
      select: { peakViewers: true },
    });
    return stream?.peakViewers || 0;
  }

  private async getChatStats(streamId: string) {
    const messages = await prisma.liveChatMessage.findMany({
      where: { streamId },
    });

    return {
      total: messages.length,
      moderated: messages.filter(m => m.isModerated).length,
      byType: this.aggregateByField(messages, 'type'),
      participants: new Set(messages.map(m => m.userId || m.guestName)).size,
    };
  }

  private async getReactionStats(streamId: string) {
    const reactions = await prisma.liveReaction.groupBy({
      by: ['type'],
      where: { streamId },
      _count: true,
    });

    return reactions.reduce((acc, r) => {
      acc[r.type] = r._count;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getGeoStats(streamId: string) {
    const viewers = await prisma.liveStreamViewer.findMany({
      where: { streamId },
      select: { country: true, region: true, city: true },
    });

    return {
      countries: this.aggregateByField(viewers, 'country'),
      regions: this.aggregateByField(viewers, 'region'),
      topCities: this.aggregateByField(viewers, 'city')
        .slice(0, 10),
    };
  }

  private aggregateByField<T>(items: T[], field: keyof T) {
    const counts: Record<string, number> = {};

    for (const item of items) {
      const value = String(item[field] || 'Unknown');
      counts[value] = (counts[value] || 0) + 1;
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }

  private async finalizeAnalytics(streamId: string): Promise<void> {
    const [viewerCount, totalWatchTime] = await Promise.all([
      prisma.liveStreamViewer.count({ where: { streamId } }),
      prisma.liveStreamViewer.aggregate({
        where: { streamId },
        _sum: { watchTime: true },
      }),
    ]);

    await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        totalViews: viewerCount,
        totalWatchTime: totalWatchTime._sum.watchTime || 0,
      },
    });
  }

  // ============================================================
  // Settings
  // ============================================================

  async getSettings() {
    return prisma.streamSettings.findUnique({
      where: { tenantId: this.tenantId },
    });
  }

  async updateSettings(data: Partial<{
    defaultProvider: StreamProvider;
    defaultChatEnabled: boolean;
    defaultRecording: boolean;
    defaultLowLatency: boolean;
    chatModerationEnabled: boolean;
    blockedWords: string[];
    slowModeSeconds: number;
    watermarkUrl: string;
    preStreamImage: string;
    postStreamImage: string;
  }>) {
    return prisma.streamSettings.upsert({
      where: { tenantId: this.tenantId },
      update: data,
      create: {
        tenantId: this.tenantId,
        ...data,
      },
    });
  }

  // ============================================================
  // Helpers
  // ============================================================

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`;
  }

  private async broadcastStreamEvent(
    streamId: string,
    event: string,
    data: any
  ): Promise<void> {
    // This would use Socket.io or similar
    // Implementation in real-time service section
  }
}
```

---

## 3. Mux Live Streaming Service

### 3.1 Mux Live Integration

```typescript
// lib/services/mux-live-service.ts

import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export interface CreateLiveStreamOptions {
  playbackPolicy: 'public' | 'signed';
  lowLatency: boolean;
  recordingEnabled: boolean;
  reconnectWindow?: number;
  maxContinuousDuration?: number;
}

export interface MuxLiveStream {
  id: string;
  streamKey: string;
  playbackId: string;
  srtUrl?: string;
  status: string;
}

export class MuxLiveService {
  // ============================================================
  // Live Stream Creation
  // ============================================================

  async createLiveStream(options: CreateLiveStreamOptions): Promise<MuxLiveStream> {
    const liveStream = await mux.video.liveStreams.create({
      playback_policy: [options.playbackPolicy],
      new_asset_settings: {
        playback_policy: [options.playbackPolicy],
        mp4_support: 'capped-1080p',
      },
      reduced_latency: options.lowLatency,
      latency_mode: options.lowLatency ? 'low' : 'standard',
      reconnect_window: options.reconnectWindow || 60,
      max_continuous_duration: options.maxContinuousDuration || 43200,
      ...(options.recordingEnabled && {
        new_asset_settings: {
          playback_policy: [options.playbackPolicy],
        },
      }),
    });

    return {
      id: liveStream.id,
      streamKey: liveStream.stream_key!,
      playbackId: liveStream.playback_ids?.[0]?.id || '',
      srtUrl: this.buildSrtUrl(liveStream.stream_key!),
      status: liveStream.status,
    };
  }

  // ============================================================
  // Stream Management
  // ============================================================

  async getLiveStream(streamId: string) {
    const stream = await mux.video.liveStreams.retrieve(streamId);
    return {
      id: stream.id,
      status: stream.status,
      streamKey: stream.stream_key,
      playbackIds: stream.playback_ids,
      activeAssetId: stream.active_asset_id,
      recentAssetIds: stream.recent_asset_ids,
      maxContinuousDuration: stream.max_continuous_duration,
      reconnectWindow: stream.reconnect_window,
    };
  }

  async resetStreamKey(streamId: string): Promise<string> {
    const stream = await mux.video.liveStreams.resetStreamKey(streamId);
    return stream.stream_key!;
  }

  async disableLiveStream(streamId: string): Promise<void> {
    await mux.video.liveStreams.disable(streamId);
  }

  async enableLiveStream(streamId: string): Promise<void> {
    await mux.video.liveStreams.enable(streamId);
  }

  async deleteLiveStream(streamId: string): Promise<void> {
    await mux.video.liveStreams.delete(streamId);
  }

  // ============================================================
  // Simulcast
  // ============================================================

  async createSimulcastTarget(
    streamId: string,
    target: {
      url: string;
      streamKey: string;
      passthrough?: string;
    }
  ) {
    return mux.video.liveStreams.createSimulcastTarget(streamId, {
      url: target.url,
      stream_key: target.streamKey,
      passthrough: target.passthrough,
    });
  }

  async deleteSimulcastTarget(
    streamId: string,
    targetId: string
  ): Promise<void> {
    await mux.video.liveStreams.deleteSimulcastTarget(streamId, targetId);
  }

  // ============================================================
  // Playback & Tokens
  // ============================================================

  async createPlaybackId(
    streamId: string,
    policy: 'public' | 'signed'
  ): Promise<string> {
    const playbackId = await mux.video.liveStreams.createPlaybackId(streamId, {
      policy,
    });
    return playbackId.id;
  }

  generateSignedPlaybackToken(
    playbackId: string,
    options: {
      expirationTime?: number;
      type?: 'video' | 'thumbnail' | 'gif' | 'storyboard';
    } = {}
  ): string {
    const JWT = require('jsonwebtoken');

    const payload = {
      sub: playbackId,
      aud: options.type || 'video',
      exp: options.expirationTime || Math.floor(Date.now() / 1000) + 7200, // 2 hours
      kid: process.env.MUX_SIGNING_KEY_ID,
    };

    return JWT.sign(payload, Buffer.from(process.env.MUX_SIGNING_PRIVATE_KEY!, 'base64'), {
      algorithm: 'RS256',
    });
  }

  getPlaybackUrl(playbackId: string, signed = false): string {
    if (signed) {
      const token = this.generateSignedPlaybackToken(playbackId);
      return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
    }
    return `https://stream.mux.com/${playbackId}.m3u8`;
  }

  // ============================================================
  // Recording
  // ============================================================

  async getRecording(streamId: string): Promise<{
    assetId: string;
    playbackUrl: string;
    duration: number;
  } | null> {
    const stream = await mux.video.liveStreams.retrieve(streamId);

    if (!stream.recent_asset_ids || stream.recent_asset_ids.length === 0) {
      return null;
    }

    const assetId = stream.recent_asset_ids[0];
    const asset = await mux.video.assets.retrieve(assetId);

    if (asset.status !== 'ready') {
      return null;
    }

    const playbackId = asset.playback_ids?.[0]?.id;

    return {
      assetId,
      playbackUrl: playbackId ? this.getPlaybackUrl(playbackId) : '',
      duration: asset.duration || 0,
    };
  }

  async createClip(
    streamId: string,
    startTime: number,
    endTime: number
  ) {
    const stream = await mux.video.liveStreams.retrieve(streamId);
    const assetId = stream.active_asset_id || stream.recent_asset_ids?.[0];

    if (!assetId) {
      throw new Error('No asset available for clipping');
    }

    return mux.video.assets.create({
      input: [
        {
          url: `mux://assets/${assetId}`,
          start_time: startTime,
          end_time: endTime,
        },
      ],
      playback_policy: ['public'],
    });
  }

  // ============================================================
  // Real-time Data
  // ============================================================

  async getRealtimeViewers(playbackId: string): Promise<number> {
    try {
      const data = await mux.data.realTimeBreakdowns.list({
        dimension: 'playback_id',
        filters: [`playback_id:${playbackId}`],
        timestamp: Math.floor(Date.now() / 1000),
      });

      return data.data?.[0]?.value || 0;
    } catch {
      return 0;
    }
  }

  // ============================================================
  // Helpers
  // ============================================================

  private buildSrtUrl(streamKey: string): string {
    return `srt://global-live.mux.com:5000?streamid=${streamKey}`;
  }
}
```

---

## 4. AWS IVS Service

### 4.1 AWS Interactive Video Service Integration

```typescript
// lib/services/aws-ivs-service.ts

import {
  IvsClient,
  CreateChannelCommand,
  GetChannelCommand,
  DeleteChannelCommand,
  StopStreamCommand,
  GetStreamCommand,
  ListStreamKeysCommand,
  CreateStreamKeyCommand,
  DeleteStreamKeyCommand,
  CreateRecordingConfigurationCommand,
} from '@aws-sdk/client-ivs';

const ivsClient = new IvsClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface CreateChannelOptions {
  name: string;
  latencyMode: 'LOW' | 'NORMAL';
  type: 'BASIC' | 'STANDARD';
  recordingEnabled?: boolean;
}

export interface IvsChannel {
  id: string;
  arn: string;
  streamKey: string;
  ingestEndpoint: string;
  playbackUrl: string;
}

export class AwsIvsService {
  private recordingConfigArn?: string;

  // ============================================================
  // Channel Management
  // ============================================================

  async createChannel(options: CreateChannelOptions): Promise<IvsChannel> {
    // Create recording configuration if needed
    if (options.recordingEnabled && !this.recordingConfigArn) {
      await this.createRecordingConfiguration();
    }

    const command = new CreateChannelCommand({
      name: options.name,
      latencyMode: options.latencyMode,
      type: options.type,
      ...(options.recordingEnabled && this.recordingConfigArn && {
        recordingConfigurationArn: this.recordingConfigArn,
      }),
      tags: {
        platform: 'digital-church',
      },
    });

    const response = await ivsClient.send(command);
    const channel = response.channel!;
    const streamKey = response.streamKey!;

    return {
      id: channel.arn!.split('/').pop()!,
      arn: channel.arn!,
      streamKey: streamKey.value!,
      ingestEndpoint: `rtmps://${channel.ingestEndpoint}/app`,
      playbackUrl: channel.playbackUrl!,
    };
  }

  async getChannel(channelArn: string) {
    const command = new GetChannelCommand({ arn: channelArn });
    const response = await ivsClient.send(command);
    return response.channel;
  }

  async deleteChannel(channelArn: string): Promise<void> {
    const command = new DeleteChannelCommand({ arn: channelArn });
    await ivsClient.send(command);
  }

  // ============================================================
  // Stream Control
  // ============================================================

  async getStreamStatus(channelArn: string) {
    try {
      const command = new GetStreamCommand({ channelArn });
      const response = await ivsClient.send(command);
      return {
        state: response.stream?.state,
        health: response.stream?.health,
        viewerCount: response.stream?.viewerCount,
        startTime: response.stream?.startTime,
      };
    } catch (error: any) {
      if (error.name === 'ChannelNotBroadcasting') {
        return { state: 'OFFLINE', health: null, viewerCount: 0 };
      }
      throw error;
    }
  }

  async stopStream(channelArn: string): Promise<void> {
    const command = new StopStreamCommand({ channelArn });
    await ivsClient.send(command);
  }

  // ============================================================
  // Stream Keys
  // ============================================================

  async listStreamKeys(channelArn: string) {
    const command = new ListStreamKeysCommand({ channelArn });
    const response = await ivsClient.send(command);
    return response.streamKeys || [];
  }

  async createStreamKey(channelArn: string): Promise<string> {
    const command = new CreateStreamKeyCommand({ channelArn });
    const response = await ivsClient.send(command);
    return response.streamKey?.value || '';
  }

  async deleteStreamKey(streamKeyArn: string): Promise<void> {
    const command = new DeleteStreamKeyCommand({ arn: streamKeyArn });
    await ivsClient.send(command);
  }

  async resetStreamKey(channelArn: string): Promise<string> {
    // Delete existing keys
    const existingKeys = await this.listStreamKeys(channelArn);
    for (const key of existingKeys) {
      await this.deleteStreamKey(key.arn!);
    }

    // Create new key
    return this.createStreamKey(channelArn);
  }

  // ============================================================
  // Recording
  // ============================================================

  async createRecordingConfiguration(): Promise<string> {
    const command = new CreateRecordingConfigurationCommand({
      name: 'digital-church-recording',
      destinationConfiguration: {
        s3: {
          bucketName: process.env.AWS_S3_RECORDING_BUCKET!,
        },
      },
      thumbnailConfiguration: {
        recordingMode: 'INTERVAL',
        targetIntervalSeconds: 60,
      },
    });

    const response = await ivsClient.send(command);
    this.recordingConfigArn = response.recordingConfiguration?.arn;
    return this.recordingConfigArn!;
  }

  async getRecording(channelId: string): Promise<{ url: string } | null> {
    // Recordings are stored in S3 with a predictable path
    const bucket = process.env.AWS_S3_RECORDING_BUCKET;
    const prefix = `ivs/v1/${process.env.AWS_ACCOUNT_ID}/${channelId}`;

    // This would list S3 objects and return the latest recording URL
    // Implementation depends on S3 SDK
    return null;
  }

  // ============================================================
  // Real-time Metrics
  // ============================================================

  async getRealtimeViewers(channelArn: string): Promise<number> {
    const status = await this.getStreamStatus(channelArn);
    return status.viewerCount || 0;
  }
}
```

---

## 5. Real-Time Communication (Socket.io)

### 5.1 WebSocket Server Setup

```typescript
// lib/socket/socket-server.ts

import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);
const pubClient = new Redis(process.env.REDIS_URL!);
const subClient = pubClient.duplicate();

export class LiveStreamSocketServer {
  private io: SocketIOServer;

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      adapter: require('@socket.io/redis-adapter').createAdapter(pubClient, subClient),
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  // ============================================================
  // Middleware
  // ============================================================

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;

      if (token) {
        try {
          const payload = await verifyToken(token);
          socket.data.user = payload;
          socket.data.authenticated = true;
        } catch {
          socket.data.authenticated = false;
        }
      } else {
        socket.data.authenticated = false;
        socket.data.guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      next();
    });

    // Rate limiting middleware
    this.io.use(async (socket, next) => {
      const clientId = socket.data.user?.id || socket.data.guestId;
      const key = `socket:ratelimit:${clientId}`;

      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, 60);
      }

      if (current > 100) { // 100 events per minute
        return next(new Error('Rate limit exceeded'));
      }

      next();
    });
  }

  // ============================================================
  // Event Handlers
  // ============================================================

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join stream room
      socket.on('stream:join', async (data: { streamId: string }) => {
        await this.handleJoinStream(socket, data.streamId);
      });

      // Leave stream room
      socket.on('stream:leave', async (data: { streamId: string }) => {
        await this.handleLeaveStream(socket, data.streamId);
      });

      // Chat message
      socket.on('chat:message', async (data: {
        streamId: string;
        message: string;
        type?: string;
      }) => {
        await this.handleChatMessage(socket, data);
      });

      // Reaction
      socket.on('stream:reaction', async (data: {
        streamId: string;
        type: string;
      }) => {
        await this.handleReaction(socket, data);
      });

      // Typing indicator
      socket.on('chat:typing', (data: { streamId: string }) => {
        socket.to(`stream:${data.streamId}`).emit('chat:typing', {
          userId: socket.data.user?.id,
          name: socket.data.user?.name || 'Guest',
        });
      });

      // Disconnect
      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  // ============================================================
  // Stream Events
  // ============================================================

  private async handleJoinStream(socket: any, streamId: string) {
    const roomName = `stream:${streamId}`;

    // Join Socket.io room
    socket.join(roomName);
    socket.data.currentStream = streamId;

    // Track viewer
    const viewerData = {
      streamId,
      userId: socket.data.user?.id,
      sessionId: socket.id,
      deviceType: socket.handshake.headers['user-agent'],
    };

    const viewer = await prisma.liveStreamViewer.create({
      data: viewerData,
    });
    socket.data.viewerId = viewer.id;

    // Update viewer count
    const viewerCount = await this.getViewerCount(streamId);
    await this.updatePeakViewers(streamId, viewerCount);

    // Broadcast updated count
    this.io.to(roomName).emit('stream:viewers', { count: viewerCount });

    // Send recent chat history
    const recentMessages = await prisma.liveChatMessage.findMany({
      where: { streamId, isModerated: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    socket.emit('chat:history', recentMessages.reverse());
  }

  private async handleLeaveStream(socket: any, streamId: string) {
    const roomName = `stream:${streamId}`;

    // Leave Socket.io room
    socket.leave(roomName);

    // Update viewer record
    if (socket.data.viewerId) {
      const viewer = await prisma.liveStreamViewer.findUnique({
        where: { id: socket.data.viewerId },
      });

      if (viewer) {
        const watchTime = Math.floor(
          (Date.now() - viewer.joinedAt.getTime()) / 1000
        );

        await prisma.liveStreamViewer.update({
          where: { id: socket.data.viewerId },
          data: {
            leftAt: new Date(),
            watchTime,
          },
        });
      }
    }

    // Update viewer count
    const viewerCount = await this.getViewerCount(streamId);
    this.io.to(roomName).emit('stream:viewers', { count: viewerCount });
  }

  private async handleDisconnect(socket: any) {
    if (socket.data.currentStream) {
      await this.handleLeaveStream(socket, socket.data.currentStream);
    }
  }

  // ============================================================
  // Chat Events
  // ============================================================

  private async handleChatMessage(
    socket: any,
    data: { streamId: string; message: string; type?: string }
  ) {
    const { streamId, message, type = 'MESSAGE' } = data;

    // Validate stream exists and chat is enabled
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
      select: { chatEnabled: true, tenantId: true },
    });

    if (!stream || !stream.chatEnabled) {
      socket.emit('chat:error', { message: 'Chat is disabled' });
      return;
    }

    // Check moderation settings
    const settings = await prisma.streamSettings.findUnique({
      where: { tenantId: stream.tenantId },
    });

    // Check slow mode
    if (settings?.slowModeSeconds && settings.slowModeSeconds > 0) {
      const lastMessageKey = `chat:slowmode:${socket.id}`;
      const lastMessage = await redis.get(lastMessageKey);

      if (lastMessage) {
        socket.emit('chat:error', {
          message: `Please wait ${settings.slowModeSeconds} seconds between messages`,
        });
        return;
      }

      await redis.setex(lastMessageKey, settings.slowModeSeconds, '1');
    }

    // Check blocked words
    let isModerated = false;
    if (settings?.blockedWords && settings.blockedWords.length > 0) {
      const lowerMessage = message.toLowerCase();
      isModerated = settings.blockedWords.some(word =>
        lowerMessage.includes(word.toLowerCase())
      );
    }

    // Check for links if auto-moderation is enabled
    if (settings?.autoModerateLinks) {
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      if (urlRegex.test(message)) {
        isModerated = true;
      }
    }

    // Save message
    const chatMessage = await prisma.liveChatMessage.create({
      data: {
        streamId,
        userId: socket.data.user?.id,
        guestName: socket.data.authenticated ? null : 'Guest',
        message,
        type: type as any,
        isModerated,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // Broadcast to room (if not moderated)
    if (!isModerated) {
      this.io.to(`stream:${streamId}`).emit('chat:message', {
        id: chatMessage.id,
        message: chatMessage.message,
        type: chatMessage.type,
        user: chatMessage.user || { name: chatMessage.guestName },
        createdAt: chatMessage.createdAt,
        isPinned: chatMessage.isPinned,
        isHighlighted: chatMessage.isHighlighted,
      });
    } else {
      // Notify sender that message is pending moderation
      socket.emit('chat:moderated', {
        messageId: chatMessage.id,
        message: 'Your message is pending moderation',
      });
    }
  }

  // ============================================================
  // Reactions
  // ============================================================

  private async handleReaction(
    socket: any,
    data: { streamId: string; type: string }
  ) {
    const { streamId, type } = data;

    // Rate limit reactions
    const reactionKey = `reaction:${socket.id}:${streamId}`;
    const reactionCount = await redis.incr(reactionKey);

    if (reactionCount === 1) {
      await redis.expire(reactionKey, 5); // Reset every 5 seconds
    }

    if (reactionCount > 10) { // Max 10 reactions per 5 seconds
      return;
    }

    // Save reaction
    await prisma.liveReaction.create({
      data: {
        streamId,
        userId: socket.data.user?.id,
        type: type as any,
      },
    });

    // Broadcast reaction (batched for performance)
    const batchKey = `reaction:batch:${streamId}`;
    await redis.hincrby(batchKey, type, 1);

    // Only broadcast every 500ms
    const shouldBroadcast = await redis.set(
      `reaction:broadcast:${streamId}`,
      '1',
      'EX', 1,
      'NX'
    );

    if (shouldBroadcast) {
      setTimeout(async () => {
        const batch = await redis.hgetall(batchKey);
        await redis.del(batchKey);

        if (Object.keys(batch).length > 0) {
          this.io.to(`stream:${streamId}`).emit('stream:reactions', batch);
        }
      }, 500);
    }
  }

  // ============================================================
  // Admin Functions
  // ============================================================

  async moderateMessage(messageId: string, moderatorId: string) {
    const message = await prisma.liveChatMessage.update({
      where: { id: messageId },
      data: {
        isModerated: true,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
      },
    });

    this.io.to(`stream:${message.streamId}`).emit('chat:removed', {
      messageId,
    });

    return message;
  }

  async pinMessage(messageId: string) {
    const message = await prisma.liveChatMessage.update({
      where: { id: messageId },
      data: { isPinned: true },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    this.io.to(`stream:${message.streamId}`).emit('chat:pinned', {
      id: message.id,
      message: message.message,
      user: message.user,
    });

    return message;
  }

  async broadcastAnnouncement(streamId: string, announcement: string) {
    this.io.to(`stream:${streamId}`).emit('stream:announcement', {
      message: announcement,
      timestamp: new Date(),
    });
  }

  // ============================================================
  // Helpers
  // ============================================================

  private async getViewerCount(streamId: string): Promise<number> {
    const room = this.io.sockets.adapter.rooms.get(`stream:${streamId}`);
    return room ? room.size : 0;
  }

  private async updatePeakViewers(
    streamId: string,
    currentCount: number
  ): Promise<void> {
    await prisma.liveStream.updateMany({
      where: {
        id: streamId,
        peakViewers: { lt: currentCount },
      },
      data: { peakViewers: currentCount },
    });
  }
}
```

---

## 6. Template-Aware Live Player Component

### 6.1 React Live Player

```tsx
// components/live/LiveStreamPlayer.tsx

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { io, Socket } from 'socket.io-client';
import { useTemplate } from '@/contexts/TemplateContext';
import { cn } from '@/lib/utils';
import { LiveChat } from './LiveChat';
import { LiveReactions } from './LiveReactions';
import { LiveGiving } from './LiveGiving';
import { ViewerCount } from './ViewerCount';

interface LiveStreamPlayerProps {
  streamId: string;
  playbackUrl: string;
  title: string;
  chatEnabled?: boolean;
  reactionsEnabled?: boolean;
  givingEnabled?: boolean;
  lowLatency?: boolean;
  dvrEnabled?: boolean;
  onViewerJoin?: () => void;
  onViewerLeave?: () => void;
}

export function LiveStreamPlayer({
  streamId,
  playbackUrl,
  title,
  chatEnabled = true,
  reactionsEnabled = true,
  givingEnabled = true,
  lowLatency = false,
  dvrEnabled = true,
  onViewerJoin,
  onViewerLeave,
}: LiveStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState<'auto' | number>('auto');
  const [availableQualities, setAvailableQualities] = useState<number[]>([]);

  const { config: templateConfig } = useTemplate();
  const playerConfig = templateConfig.media?.videoPlayer || {};

  // ============================================================
  // HLS Setup
  // ============================================================

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: lowLatency,
        liveSyncDurationCount: lowLatency ? 2 : 3,
        liveMaxLatencyDurationCount: lowLatency ? 5 : 10,
        liveDurationInfinity: true,
        enableWorker: true,
        backBufferLength: dvrEnabled ? 300 : 30, // 5 min DVR if enabled
      });

      hls.loadSource(playbackUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map(level => level.height);
        setAvailableQualities(levels);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (quality !== 'auto') {
          setQuality(hls.levels[data.level].height);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = playbackUrl;
      video.play().catch(() => {});
    }
  }, [playbackUrl, lowLatency, dvrEnabled]);

  // ============================================================
  // Socket Connection
  // ============================================================

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: {
        token: localStorage.getItem('authToken'),
      },
    });

    socket.on('connect', () => {
      socket.emit('stream:join', { streamId });
      onViewerJoin?.();
    });

    socket.on('stream:viewers', ({ count }) => {
      setViewerCount(count);
    });

    socket.on('stream:ended', () => {
      setIsLive(false);
    });

    socketRef.current = socket;

    return () => {
      socket.emit('stream:leave', { streamId });
      socket.disconnect();
      onViewerLeave?.();
    };
  }, [streamId, onViewerJoin, onViewerLeave]);

  // ============================================================
  // Video Event Handlers
  // ============================================================

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);

      // Check if we're live (within 10 seconds of live edge)
      if (video.duration && video.duration - video.currentTime < 10) {
        setIsLive(true);
      } else {
        setIsLive(false);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  // ============================================================
  // Controls
  // ============================================================

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (value: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = value;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const seekToLive = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    video.currentTime = video.duration;
    setIsLive(true);
  };

  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value;
    setCurrentTime(value);
  };

  const toggleFullscreen = async () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      await container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const changeQuality = (level: 'auto' | number) => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (level === 'auto') {
      hls.currentLevel = -1;
    } else {
      const levelIndex = hls.levels.findIndex(l => l.height === level);
      if (levelIndex !== -1) {
        hls.currentLevel = levelIndex;
      }
    }
    setQuality(level);
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className={cn(
      "relative w-full bg-black rounded-lg overflow-hidden",
      playerConfig.style === 'modern' && "shadow-2xl",
      isFullscreen && "fixed inset-0 z-50 rounded-none"
    )}>
      {/* Video Player */}
      <div
        className="relative aspect-video"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          autoPlay
        />

        {/* Buffering Indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Live Badge */}
        {isLive && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}

        {/* Viewer Count */}
        <ViewerCount count={viewerCount} className="absolute top-4 right-4" />

        {/* Controls Overlay */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}>
          {/* Progress Bar (DVR) */}
          {dvrEnabled && duration > 0 && (
            <div className="mb-4">
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${playerConfig.primaryColor || '#ef4444'} ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%)`,
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button onClick={togglePlay} className="text-white hover:text-gray-200">
                {isPlaying ? (
                  <PauseIcon className="w-8 h-8" />
                ) : (
                  <PlayIcon className="w-8 h-8" />
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-white hover:text-gray-200">
                  {isMuted || volume === 0 ? (
                    <VolumeOffIcon className="w-6 h-6" />
                  ) : (
                    <VolumeUpIcon className="w-6 h-6" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                />
              </div>

              {/* Go Live Button */}
              {dvrEnabled && !isLive && (
                <button
                  onClick={seekToLive}
                  className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700"
                >
                  Go Live
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Quality Selector */}
              <select
                value={quality}
                onChange={(e) => changeQuality(e.target.value === 'auto' ? 'auto' : Number(e.target.value))}
                className="bg-transparent text-white text-sm border border-white/30 rounded px-2 py-1"
              >
                <option value="auto">Auto</option>
                {availableQualities.map((q) => (
                  <option key={q} value={q}>{q}p</option>
                ))}
              </select>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="text-white hover:text-gray-200">
                {isFullscreen ? (
                  <ExitFullscreenIcon className="w-6 h-6" />
                ) : (
                  <FullscreenIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Features */}
      <div className={cn(
        "flex flex-col lg:flex-row",
        isFullscreen && "hidden"
      )}>
        {/* Chat Panel */}
        {chatEnabled && socketRef.current && (
          <LiveChat
            streamId={streamId}
            socket={socketRef.current}
            className="flex-1 h-96 lg:h-auto lg:min-h-[400px]"
          />
        )}

        {/* Side Panel */}
        <div className="w-full lg:w-80 border-l border-gray-200 dark:border-gray-700">
          {/* Reactions */}
          {reactionsEnabled && socketRef.current && (
            <LiveReactions
              streamId={streamId}
              socket={socketRef.current}
            />
          )}

          {/* Giving Overlay */}
          {givingEnabled && (
            <LiveGiving streamId={streamId} />
          )}
        </div>
      </div>
    </div>
  );
}

// Icon components (simplified)
const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const VolumeUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const VolumeOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

const FullscreenIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);

const ExitFullscreenIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
);
```

---

## 7. Live Chat Component

### 7.1 Chat UI

```tsx
// components/live/LiveChat.tsx

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  message: string;
  type: 'MESSAGE' | 'SYSTEM' | 'PRAYER_REQUEST' | 'ANNOUNCEMENT';
  user: {
    id?: string;
    name: string;
    image?: string;
  };
  createdAt: string;
  isPinned?: boolean;
  isHighlighted?: boolean;
}

interface LiveChatProps {
  streamId: string;
  socket: Socket;
  className?: string;
}

export function LiveChat({ streamId, socket, className }: LiveChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Socket event handlers
  useEffect(() => {
    socket.on('chat:history', (history: ChatMessage[]) => {
      setMessages(history);
      const pinned = history.find(m => m.isPinned);
      if (pinned) setPinnedMessage(pinned);
    });

    socket.on('chat:message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('chat:pinned', (message: ChatMessage) => {
      setPinnedMessage(message);
    });

    socket.on('chat:removed', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    socket.on('chat:typing', ({ name }) => {
      setIsTyping(prev => [...new Set([...prev, name])]);
      setTimeout(() => {
        setIsTyping(prev => prev.filter(n => n !== name));
      }, 3000);
    });

    socket.on('chat:error', ({ message }) => {
      // Show error toast
      console.error('Chat error:', message);
    });

    return () => {
      socket.off('chat:history');
      socket.off('chat:message');
      socket.off('chat:pinned');
      socket.off('chat:removed');
      socket.off('chat:typing');
      socket.off('chat:error');
    };
  }, [socket]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    socket.emit('chat:message', {
      streamId,
      message: inputValue.trim(),
    });
    setInputValue('');
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    socket.emit('chat:typing', { streamId });
  };

  return (
    <div className={cn("flex flex-col bg-white dark:bg-gray-900", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Live Chat</h3>
        <span className="text-sm text-gray-500">{messages.length} messages</span>
      </div>

      {/* Pinned Message */}
      {pinnedMessage && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <PinIcon className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {pinnedMessage.user.name}:
              </span>
              <span className="text-sm text-yellow-700 dark:text-yellow-300 ml-1">
                {pinnedMessage.message}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-start gap-2",
              msg.type === 'SYSTEM' && "justify-center",
              msg.type === 'ANNOUNCEMENT' && "bg-blue-50 dark:bg-blue-900/20 p-2 rounded",
              msg.isHighlighted && "bg-purple-50 dark:bg-purple-900/20 p-2 rounded"
            )}
          >
            {msg.type !== 'SYSTEM' && (
              <>
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {msg.user.image ? (
                    <img src={msg.user.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {msg.user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {msg.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm text-gray-700 dark:text-gray-300 break-words",
                    msg.type === 'PRAYER_REQUEST' && "italic"
                  )}>
                    {msg.type === 'PRAYER_REQUEST' && '🙏 '}
                    {msg.message}
                  </p>
                </div>
              </>
            )}
            {msg.type === 'SYSTEM' && (
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                {msg.message}
              </span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {isTyping.length > 0 && (
        <div className="px-4 py-1 text-xs text-gray-500">
          {isTyping.length === 1
            ? `${isTyping[0]} is typing...`
            : `${isTyping.length} people are typing...`}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            onInput={handleTyping}
            placeholder={session ? "Say something..." : "Sign in to chat"}
            disabled={!session}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending || !session}
            className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

const PinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);
```

---

## 8. API Endpoints

### 8.1 Stream Management API

```typescript
// app/api/admin/streams/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LiveStreamService } from '@/lib/services/live-stream-service';
import { z } from 'zod';

const createStreamSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime().optional(),
  timezone: z.string().optional(),
  chatEnabled: z.boolean().optional(),
  recordingEnabled: z.boolean().optional(),
  lowLatency: z.boolean().optional(),
  visibility: z.enum(['PUBLIC', 'MEMBERS_ONLY', 'PRIVATE']).optional(),
  password: z.string().optional(),
  eventId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const service = new LiveStreamService(session.user.tenantId);

    let streams;
    if (status === 'live') {
      streams = await service.getLiveStreams();
    } else if (status === 'upcoming') {
      streams = await service.getUpcomingStreams();
    } else if (status === 'past') {
      const page = parseInt(searchParams.get('page') || '1');
      const result = await service.getPastStreams({ page });
      return NextResponse.json(result);
    } else {
      // Return all
      const [live, upcoming] = await Promise.all([
        service.getLiveStreams(),
        service.getUpcomingStreams(5),
      ]);
      return NextResponse.json({ live, upcoming });
    }

    return NextResponse.json({ streams });
  } catch (error: any) {
    console.error('Error fetching streams:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check feature access
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      include: { plan: true },
    });

    if (!tenant?.plan?.liveStreaming) {
      return NextResponse.json(
        { error: 'Live streaming is not available on your plan' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createStreamSchema.parse(body);

    const service = new LiveStreamService(session.user.tenantId);
    const result = await service.createStream({
      ...validated,
      scheduledStart: new Date(validated.scheduledStart),
      scheduledEnd: validated.scheduledEnd ? new Date(validated.scheduledEnd) : undefined,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating stream:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 8.2 Stream Control API

```typescript
// app/api/admin/streams/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LiveStreamService } from '@/lib/services/live-stream-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new LiveStreamService(session.user.tenantId);
    const stream = await service.getStream(params.id);

    return NextResponse.json(stream);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const service = new LiveStreamService(session.user.tenantId);

    switch (action) {
      case 'start':
        await service.startStream(params.id);
        break;
      case 'go-live':
        await service.goLive(params.id);
        break;
      case 'end':
        await service.endStream(params.id);
        break;
      case 'publish-vod':
        await service.publishAsVod(params.id);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const stream = await service.getStream(params.id);
    return NextResponse.json(stream);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 8.3 Webhook Handlers

```typescript
// app/api/webhooks/mux/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { LiveStreamStatus } from '@prisma/client';

const MUX_WEBHOOK_SECRET = process.env.MUX_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('mux-signature');

    // Verify signature
    if (!verifyMuxSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const { type, data } = event;

    console.log(`Mux webhook: ${type}`, data.id);

    switch (type) {
      case 'video.live_stream.active':
        await handleStreamActive(data);
        break;

      case 'video.live_stream.idle':
        await handleStreamIdle(data);
        break;

      case 'video.live_stream.connected':
        await handleStreamConnected(data);
        break;

      case 'video.live_stream.disconnected':
        await handleStreamDisconnected(data);
        break;

      case 'video.live_stream.recording':
        await handleStreamRecording(data);
        break;

      case 'video.asset.ready':
        await handleAssetReady(data);
        break;

      case 'video.asset.errored':
        await handleAssetError(data);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Mux webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

function verifyMuxSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;

  const [timestamp, v1Signature] = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key === 't' ? 0 : 1] = value;
    return acc;
  }, ['', '']);

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', MUX_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(v1Signature),
    Buffer.from(expectedSignature)
  );
}

async function handleStreamActive(data: any) {
  await prisma.liveStream.updateMany({
    where: { providerStreamId: data.id },
    data: {
      status: LiveStreamStatus.LIVE,
      actualStart: new Date(),
    },
  });
}

async function handleStreamIdle(data: any) {
  await prisma.liveStream.updateMany({
    where: { providerStreamId: data.id },
    data: { status: LiveStreamStatus.ENDED },
  });
}

async function handleStreamConnected(data: any) {
  await prisma.liveStream.updateMany({
    where: { providerStreamId: data.id },
    data: { status: LiveStreamStatus.STARTING },
  });
}

async function handleStreamDisconnected(data: any) {
  await prisma.liveStream.updateMany({
    where: { providerStreamId: data.id },
    data: { status: LiveStreamStatus.ENDING },
  });
}

async function handleStreamRecording(data: any) {
  console.log('Stream recording started:', data.id);
}

async function handleAssetReady(data: any) {
  // Find stream by recent recording
  const stream = await prisma.liveStream.findFirst({
    where: {
      providerStreamId: data.live_stream_id,
      recordingEnabled: true,
    },
  });

  if (stream) {
    const playbackId = data.playback_ids?.[0]?.id;

    await prisma.liveStream.update({
      where: { id: stream.id },
      data: {
        recordingAssetId: data.id,
        recordingUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
      },
    });
  }
}

async function handleAssetError(data: any) {
  console.error('Mux asset error:', data.id, data.errors);
}
```

---

## 9. Scheduling & Recurring Streams

### 9.1 Stream Scheduler Service

```typescript
// lib/services/stream-scheduler.ts

import { prisma } from '@/lib/prisma';
import { LiveStreamService } from './live-stream-service';
import { RRule } from 'rrule';
import { addMinutes, startOfDay, endOfDay } from 'date-fns';

export class StreamScheduler {
  // ============================================================
  // Recurring Stream Management
  // ============================================================

  async createRecurringStream(
    tenantId: string,
    data: {
      title: string;
      description?: string;
      startTime: string; // HH:mm format
      duration: number; // minutes
      timezone: string;
      rrule: string; // iCal RRULE
      chatEnabled?: boolean;
      recordingEnabled?: boolean;
    }
  ) {
    const service = new LiveStreamService(tenantId);

    // Parse RRULE
    const rule = RRule.fromString(data.rrule);

    // Get next occurrences (next 4 weeks)
    const now = new Date();
    const futureDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
    const occurrences = rule.between(now, futureDate);

    // Create streams for each occurrence
    const streams = [];
    for (const date of occurrences) {
      const [hours, minutes] = data.startTime.split(':').map(Number);
      const scheduledStart = new Date(date);
      scheduledStart.setHours(hours, minutes, 0, 0);

      const scheduledEnd = addMinutes(scheduledStart, data.duration);

      const { stream } = await service.createStream({
        title: data.title,
        description: data.description,
        scheduledStart,
        scheduledEnd,
        timezone: data.timezone,
        chatEnabled: data.chatEnabled,
        recordingEnabled: data.recordingEnabled,
      });

      // Mark as recurring
      await prisma.liveStream.update({
        where: { id: stream.id },
        data: {
          isRecurring: true,
          recurringRule: data.rrule,
        },
      });

      streams.push(stream);
    }

    return streams;
  }

  // ============================================================
  // Auto-Start Scheduled Streams
  // ============================================================

  async processScheduledStreams() {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Find streams starting within 5 minutes
    const upcomingStreams = await prisma.liveStream.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledStart: {
          gte: now,
          lte: fiveMinutesFromNow,
        },
      },
      include: {
        tenant: true,
      },
    });

    for (const stream of upcomingStreams) {
      // Send notification to admin
      await this.notifyStreamStarting(stream);
    }

    // Find streams that should have started but haven't
    const overdueStreams = await prisma.liveStream.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledStart: {
          lt: now,
        },
      },
    });

    // Mark overdue streams (older than 30 minutes) as missed
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    for (const stream of overdueStreams) {
      if (stream.scheduledStart < thirtyMinutesAgo) {
        await prisma.liveStream.update({
          where: { id: stream.id },
          data: { status: 'CANCELLED' },
        });
      }
    }
  }

  private async notifyStreamStarting(stream: any) {
    // Send push notification to admins
    // Implementation depends on notification service
    console.log(`Stream "${stream.title}" starting soon`);
  }

  // ============================================================
  // Calendar Integration
  // ============================================================

  async getStreamCalendar(tenantId: string, start: Date, end: Date) {
    const streams = await prisma.liveStream.findMany({
      where: {
        tenantId,
        scheduledStart: { gte: start },
        OR: [
          { scheduledEnd: { lte: end } },
          { scheduledEnd: null },
        ],
      },
      orderBy: { scheduledStart: 'asc' },
    });

    return streams.map(stream => ({
      id: stream.id,
      title: stream.title,
      start: stream.scheduledStart,
      end: stream.scheduledEnd || addMinutes(stream.scheduledStart, 90),
      status: stream.status,
      isRecurring: stream.isRecurring,
      color: this.getStatusColor(stream.status),
    }));
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'LIVE': return '#ef4444';
      case 'SCHEDULED': return '#3b82f6';
      case 'ENDED': return '#6b7280';
      case 'CANCELLED': return '#9ca3af';
      default: return '#3b82f6';
    }
  }
}
```

---

## 10. Performance & Analytics Dashboard

### 10.1 Analytics Service

```typescript
// lib/services/stream-analytics-service.ts

import { prisma } from '@/lib/prisma';
import { startOfDay, startOfWeek, startOfMonth, subDays } from 'date-fns';

export class StreamAnalyticsService {
  constructor(private tenantId: string) {}

  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const [
      totalStreams,
      totalViewers,
      totalWatchTime,
      avgViewers,
      recentStreams,
    ] = await Promise.all([
      // Total streams in last 30 days
      prisma.liveStream.count({
        where: {
          tenantId: this.tenantId,
          status: 'ENDED',
          actualEnd: { gte: thirtyDaysAgo },
        },
      }),

      // Total unique viewers
      prisma.liveStreamViewer.groupBy({
        by: ['userId'],
        where: {
          stream: {
            tenantId: this.tenantId,
            actualEnd: { gte: thirtyDaysAgo },
          },
        },
      }).then(r => r.length),

      // Total watch time (hours)
      prisma.liveStreamViewer.aggregate({
        where: {
          stream: {
            tenantId: this.tenantId,
            actualEnd: { gte: thirtyDaysAgo },
          },
        },
        _sum: { watchTime: true },
      }).then(r => Math.round((r._sum.watchTime || 0) / 3600)),

      // Average concurrent viewers
      prisma.liveStream.aggregate({
        where: {
          tenantId: this.tenantId,
          status: 'ENDED',
          actualEnd: { gte: thirtyDaysAgo },
        },
        _avg: { peakViewers: true },
      }).then(r => Math.round(r._avg.peakViewers || 0)),

      // Recent streams with stats
      prisma.liveStream.findMany({
        where: {
          tenantId: this.tenantId,
          status: 'ENDED',
        },
        orderBy: { actualEnd: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          actualStart: true,
          actualEnd: true,
          peakViewers: true,
          totalViews: true,
          totalWatchTime: true,
        },
      }),
    ]);

    return {
      summary: {
        totalStreams,
        totalViewers,
        totalWatchTime,
        avgViewers,
      },
      recentStreams: recentStreams.map(s => ({
        ...s,
        duration: s.actualEnd && s.actualStart
          ? Math.round((s.actualEnd.getTime() - s.actualStart.getTime()) / 60000)
          : 0,
        avgWatchTime: s.totalViews > 0
          ? Math.round(s.totalWatchTime / s.totalViews / 60)
          : 0,
      })),
    };
  }

  async getViewerTrends(days = 30) {
    const startDate = subDays(new Date(), days);

    const streams = await prisma.liveStream.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'ENDED',
        actualStart: { gte: startDate },
      },
      select: {
        actualStart: true,
        peakViewers: true,
        totalViews: true,
      },
      orderBy: { actualStart: 'asc' },
    });

    // Group by day
    const dailyData: Record<string, { viewers: number; streams: number }> = {};

    for (const stream of streams) {
      if (!stream.actualStart) continue;
      const day = startOfDay(stream.actualStart).toISOString();

      if (!dailyData[day]) {
        dailyData[day] = { viewers: 0, streams: 0 };
      }

      dailyData[day].viewers += stream.totalViews;
      dailyData[day].streams += 1;
    }

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data,
      avgViewers: Math.round(data.viewers / data.streams),
    }));
  }

  async getEngagementMetrics(streamId: string) {
    const [chatActivity, reactionCounts, viewerRetention] = await Promise.all([
      // Chat activity over time
      prisma.liveChatMessage.groupBy({
        by: ['createdAt'],
        where: { streamId },
        _count: true,
      }),

      // Reaction breakdown
      prisma.liveReaction.groupBy({
        by: ['type'],
        where: { streamId },
        _count: true,
      }),

      // Viewer retention (watch time distribution)
      prisma.liveStreamViewer.findMany({
        where: { streamId },
        select: { watchTime: true },
      }),
    ]);

    // Calculate retention buckets
    const retentionBuckets = {
      '<1min': 0,
      '1-5min': 0,
      '5-15min': 0,
      '15-30min': 0,
      '30-60min': 0,
      '>60min': 0,
    };

    for (const viewer of viewerRetention) {
      const minutes = viewer.watchTime / 60;
      if (minutes < 1) retentionBuckets['<1min']++;
      else if (minutes < 5) retentionBuckets['1-5min']++;
      else if (minutes < 15) retentionBuckets['5-15min']++;
      else if (minutes < 30) retentionBuckets['15-30min']++;
      else if (minutes < 60) retentionBuckets['30-60min']++;
      else retentionBuckets['>60min']++;
    }

    return {
      chatActivity: chatActivity.length,
      reactions: reactionCounts.reduce((acc, r) => {
        acc[r.type] = r._count;
        return acc;
      }, {} as Record<string, number>),
      retention: retentionBuckets,
      totalEngagements: chatActivity.length + reactionCounts.reduce((sum, r) => sum + r._count, 0),
    };
  }
}
```

---

## 11. Environment Configuration

```bash
# .env.local

# Mux Configuration
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_WEBHOOK_SECRET=your_mux_webhook_secret
MUX_SIGNING_KEY_ID=your_signing_key_id
MUX_SIGNING_PRIVATE_KEY=your_base64_encoded_private_key

# AWS IVS Configuration (Alternative)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_RECORDING_BUCKET=your-recording-bucket
AWS_ACCOUNT_ID=your_account_id

# Socket.io
NEXT_PUBLIC_SOCKET_URL=wss://socket.yourplatform.com

# Redis (for Socket.io adapter)
REDIS_URL=redis://localhost:6379
```

---

## 12. Best Practices & Optimization

### 12.1 Performance Recommendations

```yaml
Streaming Quality:
  Recommended Bitrates:
    - 1080p: 4500-6000 kbps
    - 720p: 2500-4000 kbps
    - 480p: 1000-2000 kbps
    - 360p: 600-1000 kbps

  Encoding Settings:
    Codec: H.264 (AVC)
    Profile: High
    Keyframe Interval: 2 seconds
    Audio: AAC, 128-192 kbps

Network Requirements:
  Minimum Upload Speed: 1.5x target bitrate
  Recommended: 2x target bitrate
  Latency: <100ms to ingest server

Viewer Experience:
  Buffer Size: 2-3 segments (6-9 seconds)
  Low Latency: 1-2 segments (3-6 seconds)
  Adaptive Bitrate: Enable for all streams
```

### 12.2 Security Checklist

```yaml
Stream Security:
  - ✅ Rotate stream keys after each broadcast
  - ✅ Use signed playback URLs for private content
  - ✅ Implement webhook signature verification
  - ✅ Enable RTMPS for encrypted ingest
  - ✅ Set domain restrictions on playback

Chat Moderation:
  - ✅ Enable auto-moderation for links
  - ✅ Configure blocked word list
  - ✅ Implement rate limiting
  - ✅ Allow manual moderation tools
  - ✅ Log all moderation actions

Access Control:
  - ✅ Verify tenant ownership on all operations
  - ✅ Check plan features before enabling streaming
  - ✅ Implement viewer authentication for private streams
  - ✅ Audit stream access logs
```

---

## Summary

This Live Streaming module provides:

1. **Multi-Provider Support**: Mux (primary) and AWS IVS integration
2. **Low-Latency Options**: Sub-5-second latency for interactive broadcasts
3. **DVR Functionality**: Rewind and replay during live streams
4. **Automatic Recording**: VOD creation from live broadcasts
5. **Real-Time Chat**: Socket.io powered with moderation
6. **Reactions & Engagement**: Interactive viewer participation
7. **Simulcast**: Multi-platform streaming to YouTube, Facebook
8. **Comprehensive Analytics**: Viewer metrics and engagement tracking
9. **Recurring Schedules**: Weekly service automation
10. **Template-Aware Player**: Branded playback experience

The system is designed to handle thousands of concurrent viewers with automatic scaling through CDN edge delivery.
