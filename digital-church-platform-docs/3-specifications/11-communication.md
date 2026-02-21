# Communication & Messaging System

> **Document Version**: 3.0 Enterprise Edition
> **Last Updated**: December 2024
> **Architecture**: Multi-tenant SaaS with Multi-Channel Communication

---

## Overview

The Communication & Messaging System provides comprehensive multi-channel communication capabilities for churches, including email campaigns, SMS messaging, push notifications, in-app messaging, and automated workflows. Built on enterprise-grade infrastructure with multi-tenant isolation, deliverability optimization, and detailed analytics.

---

## Competitive Analysis

| Feature | Mailchimp | Twilio | Pushpay | **Digital Church Platform** |
|---------|-----------|--------|---------|----------------------------|
| Email Campaigns | Advanced | Basic | Good | **Advanced + Church Focus** |
| SMS Messaging | Via Integration | Native | Native | **Native + Text-to-Give** |
| Push Notifications | Limited | Via Segment | Good | **Native FCM/APNS** |
| Audience Segmentation | Advanced | Basic | Good | **Advanced + Church Context** |
| Automation Workflows | Advanced | Basic | Limited | **Visual Workflow Builder** |
| Multi-tenant | No | No | Limited | **Full Isolation** |
| Template Library | Generic | None | Church | **50+ Church Templates** |
| Deliverability Tools | Basic | Good | Limited | **Advanced + Monitoring** |
| Pricing | Per contact | Per message | Bundled | **Competitive Tiers** |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Communication Hub Architecture                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │    Email     │   │     SMS      │   │    Push      │   │   In-App     │ │
│  │   Channel    │   │   Channel    │   │   Channel    │   │   Channel    │ │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘ │
│         │                  │                  │                  │          │
│         └──────────────────┼──────────────────┼──────────────────┘          │
│                            │                  │                              │
│                            ▼                  ▼                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    Unified Communication Service                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │  Template   │  │  Audience   │  │  Workflow   │  │  Analytics  │   │ │
│  │  │   Engine    │  │ Segmentation│  │   Engine    │  │   Engine    │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Message Queue (BullMQ)                          │ │
│  │   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐          │ │
│  │   │ Priority │   │ Scheduled│   │  Batch   │   │  Retry   │          │ │
│  │   │  Queue   │   │  Queue   │   │  Queue   │   │  Queue   │          │ │
│  │   └──────────┘   └──────────┘   └──────────┘   └──────────┘          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         ▼                          ▼                          ▼             │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐         │
│  │  SendGrid   │          │   Twilio    │          │  Firebase   │         │
│  │   Resend    │          │             │          │    FCM      │         │
│  └─────────────┘          └─────────────┘          └─────────────┘         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Communication Models

```prisma
// schema.prisma - Communication Models

// ============================================
// EMAIL CAMPAIGN MODELS
// ============================================

model EmailCampaign {
  id              String            @id @default(cuid())
  tenantId        String
  tenant          Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name            String
  subject         String
  preheader       String?           // Preview text
  fromName        String
  fromEmail       String
  replyToEmail    String?

  templateId      String?
  template        EmailTemplate?    @relation(fields: [templateId], references: [id])
  content         Json              // MJML or HTML content
  plainText       String?           // Plain text version

  // Audience targeting
  audienceType    AudienceType      @default(ALL_MEMBERS)
  audienceFilter  Json?             // Dynamic filter criteria
  segmentIds      String[]          // Specific segment IDs
  excludeSegments String[]          // Segments to exclude

  // Scheduling
  status          CampaignStatus    @default(DRAFT)
  scheduledAt     DateTime?
  sentAt          DateTime?
  completedAt     DateTime?

  // A/B Testing
  isABTest        Boolean           @default(false)
  abTestConfig    Json?             // { variants: [], testSize: 10, winningMetric: 'open_rate' }

  // Tracking
  enableTracking  Boolean           @default(true)
  trackOpens      Boolean           @default(true)
  trackClicks     Boolean           @default(true)

  // Analytics
  totalRecipients Int               @default(0)
  delivered       Int               @default(0)
  opened          Int               @default(0)
  clicked         Int               @default(0)
  bounced         Int               @default(0)
  unsubscribed    Int               @default(0)
  complained      Int               @default(0)

  sends           EmailSend[]

  createdBy       String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([tenantId, status])
  @@index([tenantId, scheduledAt])
}

enum AudienceType {
  ALL_MEMBERS
  ALL_VISITORS
  SEGMENT
  CUSTOM_FILTER
  MANUAL_LIST
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  PAUSED
  CANCELLED
  FAILED
}

model EmailTemplate {
  id              String            @id @default(cuid())
  tenantId        String
  tenant          Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name            String
  description     String?
  category        TemplateCategory

  // Content
  mjml            String?           // MJML source
  html            String            // Compiled HTML
  thumbnail       String?           // Preview image

  // Template variables
  variables       Json              // [{ name: 'firstName', type: 'string', default: 'Friend' }]

  isSystem        Boolean           @default(false)
  isActive        Boolean           @default(true)

  campaigns       EmailCampaign[]

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([tenantId, name])
}

enum TemplateCategory {
  NEWSLETTER
  ANNOUNCEMENT
  EVENT
  WELCOME
  TRANSACTIONAL
  PRAYER_REQUEST
  GIVING
  FOLLOW_UP
  CUSTOM
}

model EmailSend {
  id              String            @id @default(cuid())
  tenantId        String

  campaignId      String?
  campaign        EmailCampaign?    @relation(fields: [campaignId], references: [id])

  recipientEmail  String
  recipientName   String?
  memberId        String?

  // Message info
  messageId       String?           // Provider message ID
  subject         String

  // Status tracking
  status          EmailStatus       @default(QUEUED)
  queuedAt        DateTime          @default(now())
  sentAt          DateTime?
  deliveredAt     DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?
  bouncedAt       DateTime?
  unsubscribedAt  DateTime?
  complainedAt    DateTime?

  // Engagement
  opens           Int               @default(0)
  clicks          Int               @default(0)
  clickedLinks    Json?             // [{ url: '', clickedAt: '' }]

  // Error handling
  errorCode       String?
  errorMessage    String?
  attempts        Int               @default(0)

  // Metadata
  metadata        Json?

  @@index([tenantId, status])
  @@index([campaignId])
  @@index([recipientEmail])
  @@index([messageId])
}

enum EmailStatus {
  QUEUED
  SENDING
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  SOFT_BOUNCED
  UNSUBSCRIBED
  COMPLAINED
  FAILED
}

// ============================================
// SMS MESSAGING MODELS
// ============================================

model SMSCampaign {
  id              String            @id @default(cuid())
  tenantId        String
  tenant          Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name            String
  message         String            @db.Text
  mediaUrl        String?           // For MMS

  // Sender
  fromNumber      String            // Twilio number

  // Audience
  audienceType    AudienceType      @default(ALL_MEMBERS)
  audienceFilter  Json?
  segmentIds      String[]

  // Scheduling
  status          CampaignStatus    @default(DRAFT)
  scheduledAt     DateTime?
  sentAt          DateTime?
  completedAt     DateTime?

  // Analytics
  totalRecipients Int               @default(0)
  delivered       Int               @default(0)
  failed          Int               @default(0)
  optedOut        Int               @default(0)

  // Cost tracking
  totalSegments   Int               @default(0)
  estimatedCost   Decimal           @db.Decimal(10, 4)
  actualCost      Decimal?          @db.Decimal(10, 4)

  sends           SMSSend[]

  createdBy       String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([tenantId, status])
}

model SMSSend {
  id              String            @id @default(cuid())
  tenantId        String

  campaignId      String?
  campaign        SMSCampaign?      @relation(fields: [campaignId], references: [id])

  toNumber        String
  memberId        String?

  // Message
  message         String            @db.Text
  messageId       String?           // Twilio SID
  segments        Int               @default(1)

  // Status
  status          SMSStatus         @default(QUEUED)
  queuedAt        DateTime          @default(now())
  sentAt          DateTime?
  deliveredAt     DateTime?
  failedAt        DateTime?

  // Error handling
  errorCode       String?
  errorMessage    String?

  // Cost
  price           Decimal?          @db.Decimal(10, 4)

  @@index([tenantId, status])
  @@index([campaignId])
  @@index([toNumber])
  @@index([messageId])
}

enum SMSStatus {
  QUEUED
  SENDING
  SENT
  DELIVERED
  UNDELIVERED
  FAILED
}

// ============================================
// PUSH NOTIFICATION MODELS
// ============================================

model PushCampaign {
  id              String            @id @default(cuid())
  tenantId        String
  tenant          Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name            String
  title           String
  body            String
  imageUrl        String?

  // Action
  actionType      PushActionType    @default(OPEN_APP)
  actionData      Json?             // { url: '', screen: '', params: {} }

  // Audience
  audienceType    AudienceType      @default(ALL_MEMBERS)
  audienceFilter  Json?
  segmentIds      String[]
  platforms       String[]          @default(["ios", "android", "web"])

  // Scheduling
  status          CampaignStatus    @default(DRAFT)
  scheduledAt     DateTime?
  sentAt          DateTime?

  // Analytics
  totalRecipients Int               @default(0)
  delivered       Int               @default(0)
  opened          Int               @default(0)
  dismissed       Int               @default(0)

  // Rich content
  badge           Int?
  sound           String?           @default("default")
  data            Json?             // Custom payload

  sends           PushSend[]

  createdBy       String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([tenantId, status])
}

enum PushActionType {
  OPEN_APP
  OPEN_URL
  OPEN_SCREEN
  DEEP_LINK
}

model PushSend {
  id              String            @id @default(cuid())
  tenantId        String

  campaignId      String?
  campaign        PushCampaign?     @relation(fields: [campaignId], references: [id])

  deviceId        String
  memberId        String?
  platform        String            // ios, android, web

  // Status
  status          PushStatus        @default(QUEUED)
  messageId       String?           // FCM message ID

  sentAt          DateTime?
  deliveredAt     DateTime?
  openedAt        DateTime?

  errorCode       String?
  errorMessage    String?

  @@index([tenantId, status])
  @@index([campaignId])
  @@index([deviceId])
}

enum PushStatus {
  QUEUED
  SENT
  DELIVERED
  OPENED
  DISMISSED
  FAILED
}

// ============================================
// DEVICE & SUBSCRIPTION MODELS
// ============================================

model PushDevice {
  id              String            @id @default(cuid())
  tenantId        String

  memberId        String?
  member          Member?           @relation(fields: [memberId], references: [id])

  // Device info
  deviceToken     String
  platform        String            // ios, android, web
  deviceType      String?           // iPhone, Android, Chrome
  deviceModel     String?
  osVersion       String?
  appVersion      String?

  // Status
  isActive        Boolean           @default(true)
  lastActiveAt    DateTime          @default(now())

  // Preferences
  preferences     Json?             // { events: true, sermons: true, giving: false }

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([tenantId, deviceToken])
  @@index([tenantId, memberId])
  @@index([tenantId, isActive])
}

model CommunicationPreference {
  id              String            @id @default(cuid())
  tenantId        String
  memberId        String
  member          Member            @relation(fields: [memberId], references: [id], onDelete: Cascade)

  // Email preferences
  emailEnabled    Boolean           @default(true)
  emailNewsletter Boolean           @default(true)
  emailEvents     Boolean           @default(true)
  emailSermons    Boolean           @default(true)
  emailGiving     Boolean           @default(true)
  emailPrayer     Boolean           @default(true)

  // SMS preferences
  smsEnabled      Boolean           @default(false)
  smsEvents       Boolean           @default(true)
  smsUrgent       Boolean           @default(true)

  // Push preferences
  pushEnabled     Boolean           @default(true)
  pushEvents      Boolean           @default(true)
  pushSermons     Boolean           @default(true)
  pushPrayer      Boolean           @default(true)

  // Frequency preferences
  digestFrequency DigestFrequency   @default(WEEKLY)
  quietHoursStart String?           // "22:00"
  quietHoursEnd   String?           // "08:00"
  timezone        String            @default("America/Chicago")

  unsubscribedAt  DateTime?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([tenantId, memberId])
}

enum DigestFrequency {
  REALTIME
  DAILY
  WEEKLY
  MONTHLY
  NONE
}

// ============================================
// AUDIENCE SEGMENTATION
// ============================================

model AudienceSegment {
  id              String            @id @default(cuid())
  tenantId        String
  tenant          Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name            String
  description     String?

  // Segment type
  type            SegmentType       @default(DYNAMIC)

  // Dynamic segment criteria
  criteria        Json?             // Complex filter criteria

  // Static segment members
  memberIds       String[]          // For static segments

  // Stats (cached)
  memberCount     Int               @default(0)
  lastCalculated  DateTime?

  isSystem        Boolean           @default(false)
  isActive        Boolean           @default(true)

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([tenantId, name])
  @@index([tenantId, isActive])
}

enum SegmentType {
  STATIC       // Manually selected members
  DYNAMIC      // Criteria-based, auto-updated
  SMART        // AI-suggested
}

// ============================================
// AUTOMATION WORKFLOWS
// ============================================

model CommunicationWorkflow {
  id              String            @id @default(cuid())
  tenantId        String
  tenant          Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name            String
  description     String?

  // Trigger
  triggerType     WorkflowTrigger
  triggerConfig   Json              // Trigger-specific configuration

  // Workflow steps
  steps           Json              // Array of workflow steps

  // Status
  status          WorkflowStatus    @default(DRAFT)

  // Stats
  totalEnrolled   Int               @default(0)
  completed       Int               @default(0)
  active          Int               @default(0)

  executions      WorkflowExecution[]

  createdBy       String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([tenantId, name])
  @@index([tenantId, status])
}

enum WorkflowTrigger {
  // Member triggers
  MEMBER_CREATED
  MEMBER_FIRST_VISIT
  MEMBER_BAPTIZED
  MEMBER_BIRTHDAY
  MEMBER_ANNIVERSARY

  // Event triggers
  EVENT_REGISTERED
  EVENT_ATTENDED
  EVENT_MISSED

  // Giving triggers
  FIRST_DONATION
  RECURRING_STARTED
  RECURRING_CANCELLED
  DONATION_MILESTONE

  // Engagement triggers
  SERMON_WATCHED
  GROUP_JOINED
  INACTIVE_PERIOD

  // Manual triggers
  MANUAL
  SEGMENT_ENTERED
  DATE_BASED
}

enum WorkflowStatus {
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED
}

model WorkflowExecution {
  id              String            @id @default(cuid())
  tenantId        String

  workflowId      String
  workflow        CommunicationWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  memberId        String

  // Current state
  currentStep     Int               @default(0)
  status          ExecutionStatus   @default(IN_PROGRESS)

  // Timing
  enrolledAt      DateTime          @default(now())
  nextStepAt      DateTime?
  completedAt     DateTime?

  // Step history
  stepHistory     Json              // [{ step: 0, action: 'email', status: 'sent', at: '' }]

  // Context data
  contextData     Json?             // Variables collected during workflow

  @@index([tenantId, status])
  @@index([workflowId, memberId])
  @@index([nextStepAt])
}

enum ExecutionStatus {
  IN_PROGRESS
  WAITING
  COMPLETED
  CANCELLED
  FAILED
}

// ============================================
// IN-APP NOTIFICATIONS
// ============================================

model Notification {
  id              String            @id @default(cuid())
  tenantId        String

  userId          String

  // Content
  type            NotificationType
  title           String
  message         String
  imageUrl        String?

  // Action
  actionType      String?           // link, screen, event, sermon
  actionData      Json?

  // Channels delivered
  channels        String[]          // ["in_app", "email", "push"]
  channelsSent    String[]          // Successfully sent

  // Status
  status          NotificationStatus @default(PENDING)
  readAt          DateTime?
  dismissedAt     DateTime?

  // Priority
  priority        NotificationPriority @default(NORMAL)
  expiresAt       DateTime?

  createdAt       DateTime          @default(now())

  @@index([tenantId, userId, status])
  @@index([tenantId, userId, createdAt])
}

enum NotificationType {
  SYSTEM
  ANNOUNCEMENT
  EVENT_REMINDER
  EVENT_UPDATE
  SERMON_NEW
  GROUP_MESSAGE
  PRAYER_REQUEST
  GIVING_RECEIPT
  BIRTHDAY
  FOLLOW_UP
  CUSTOM
}

enum NotificationStatus {
  PENDING
  SENT
  READ
  DISMISSED
  EXPIRED
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

---

## Services Layer

### Email Service

```typescript
// src/services/communication/email.service.ts
import { prisma } from '@/lib/prisma';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import sgMail from '@sendgrid/mail';
import { EmailQueue } from '@/lib/queue/email-queue';
import {
  EmailCampaign,
  EmailTemplate,
  EmailSend,
  CampaignStatus,
  EmailStatus,
} from '@prisma/client';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private tenantId: string;
  private provider: 'sendgrid' | 'resend';
  private resend?: Resend;
  private defaultFrom: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.provider = (process.env.EMAIL_PROVIDER as 'sendgrid' | 'resend') || 'sendgrid';

    if (this.provider === 'sendgrid') {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    } else {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }

    this.defaultFrom = process.env.EMAIL_FROM || 'noreply@digitalchurch.com';
  }

  /**
   * Send a single email
   */
  async send(options: SendEmailOptions): Promise<EmailResult> {
    try {
      const from = options.from || await this.getTenantFromAddress();

      if (this.provider === 'sendgrid') {
        return await this.sendViaSendGrid({ ...options, from });
      } else {
        return await this.sendViaResend({ ...options, from });
      }
    } catch (error) {
      console.error('[EmailService] Send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async sendViaSendGrid(options: SendEmailOptions & { from: string }): Promise<EmailResult> {
    const [response] = await sgMail.send({
      to: options.to,
      from: options.from,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: typeof att.content === 'string'
          ? att.content
          : att.content.toString('base64'),
        type: att.contentType,
        disposition: 'attachment',
      })),
      customArgs: {
        tenantId: this.tenantId,
        ...options.metadata,
      },
    });

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    };
  }

  private async sendViaResend(options: SendEmailOptions & { from: string }): Promise<EmailResult> {
    const { data, error } = await this.resend!.emails.send({
      from: options.from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: typeof att.content === 'string'
          ? Buffer.from(att.content)
          : att.content,
      })),
      tags: options.tags?.map(tag => ({ name: tag, value: 'true' })),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  }

  /**
   * Create and send an email campaign
   */
  async sendCampaign(campaignId: string): Promise<{
    totalRecipients: number;
    queued: number;
    failed: number;
  }> {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId, tenantId: this.tenantId },
      include: { template: true },
    });

    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      throw new Error(`Campaign cannot be sent in ${campaign.status} status`);
    }

    // Update campaign status
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING', sentAt: new Date() },
    });

    try {
      // Get recipients based on audience configuration
      const recipients = await this.getAudienceRecipients(campaign);

      // Update total recipients count
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { totalRecipients: recipients.length },
      });

      // Queue emails for sending
      let queued = 0;
      let failed = 0;

      for (const recipient of recipients) {
        try {
          // Create email send record
          const emailSend = await prisma.emailSend.create({
            data: {
              tenantId: this.tenantId,
              campaignId: campaign.id,
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              memberId: recipient.memberId,
              subject: this.personalizeContent(campaign.subject, recipient),
              status: 'QUEUED',
            },
          });

          // Add to queue
          await EmailQueue.add('send-email', {
            emailSendId: emailSend.id,
            tenantId: this.tenantId,
            to: recipient.email,
            subject: emailSend.subject,
            html: this.personalizeContent(
              campaign.content as string,
              recipient
            ),
            from: `${campaign.fromName} <${campaign.fromEmail}>`,
            replyTo: campaign.replyToEmail || undefined,
            trackOpens: campaign.trackOpens,
            trackClicks: campaign.trackClicks,
          });

          queued++;
        } catch (error) {
          console.error(`Failed to queue email for ${recipient.email}:`, error);
          failed++;
        }
      }

      // Check if campaign should be marked as sent
      if (queued > 0) {
        // Status will be updated to SENT by queue processor when complete
      } else {
        await prisma.emailCampaign.update({
          where: { id: campaignId },
          data: { status: queued > 0 ? 'SENDING' : 'FAILED' },
        });
      }

      return { totalRecipients: recipients.length, queued, failed };
    } catch (error) {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  /**
   * Get recipients based on audience configuration
   */
  private async getAudienceRecipients(campaign: EmailCampaign): Promise<Array<{
    email: string;
    name: string;
    memberId?: string;
    data?: Record<string, unknown>;
  }>> {
    const baseWhere = {
      tenantId: this.tenantId,
      email: { not: null },
    };

    let members: any[];

    switch (campaign.audienceType) {
      case 'ALL_MEMBERS':
        members = await prisma.member.findMany({
          where: {
            ...baseWhere,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });
        break;

      case 'ALL_VISITORS':
        members = await prisma.member.findMany({
          where: {
            ...baseWhere,
            membershipType: 'VISITOR',
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });
        break;

      case 'SEGMENT':
        members = await this.getMembersBySegments(campaign.segmentIds);
        break;

      case 'CUSTOM_FILTER':
        members = await this.getMembersByFilter(campaign.audienceFilter as any);
        break;

      case 'MANUAL_LIST':
        // Manual list stored in audienceFilter
        const emails = (campaign.audienceFilter as any)?.emails || [];
        members = await prisma.member.findMany({
          where: {
            ...baseWhere,
            email: { in: emails },
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });
        break;

      default:
        members = [];
    }

    // Exclude opted-out members
    const optedOut = await prisma.communicationPreference.findMany({
      where: {
        tenantId: this.tenantId,
        emailEnabled: false,
      },
      select: { memberId: true },
    });

    const optedOutIds = new Set(optedOut.map(p => p.memberId));

    // Exclude unsubscribed from previous campaigns
    const unsubscribed = await prisma.emailSend.findMany({
      where: {
        tenantId: this.tenantId,
        unsubscribedAt: { not: null },
      },
      select: { recipientEmail: true },
      distinct: ['recipientEmail'],
    });

    const unsubscribedEmails = new Set(unsubscribed.map(u => u.recipientEmail));

    // Exclude segments if specified
    let excludedMemberIds = new Set<string>();
    if (campaign.excludeSegments.length > 0) {
      const excludedMembers = await this.getMembersBySegments(campaign.excludeSegments);
      excludedMemberIds = new Set(excludedMembers.map(m => m.id));
    }

    return members
      .filter(m =>
        m.email &&
        !optedOutIds.has(m.id) &&
        !unsubscribedEmails.has(m.email) &&
        !excludedMemberIds.has(m.id)
      )
      .map(m => ({
        email: m.email!,
        name: `${m.firstName} ${m.lastName}`.trim() || 'Friend',
        memberId: m.id,
      }));
  }

  /**
   * Personalize content with recipient data
   */
  private personalizeContent(
    content: string,
    recipient: { name: string; email: string; data?: Record<string, unknown> }
  ): string {
    let personalized = content;

    // Basic personalization
    personalized = personalized.replace(/\{\{name\}\}/gi, recipient.name);
    personalized = personalized.replace(/\{\{firstName\}\}/gi, recipient.name.split(' ')[0]);
    personalized = personalized.replace(/\{\{email\}\}/gi, recipient.email);

    // Custom data personalization
    if (recipient.data) {
      for (const [key, value] of Object.entries(recipient.data)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        personalized = personalized.replace(regex, String(value));
      }
    }

    return personalized;
  }

  /**
   * Get tenant-specific from address
   */
  private async getTenantFromAddress(): Promise<string> {
    const settings = await prisma.siteSettings.findFirst({
      where: { tenantId: this.tenantId },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: this.tenantId },
    });

    const fromEmail = settings?.contactEmail || this.defaultFrom;
    const fromName = settings?.churchName || tenant?.name || 'Church';

    return `${fromName} <${fromEmail}>`;
  }

  /**
   * Get members by segment IDs
   */
  private async getMembersBySegments(segmentIds: string[]): Promise<any[]> {
    const segments = await prisma.audienceSegment.findMany({
      where: {
        tenantId: this.tenantId,
        id: { in: segmentIds },
        isActive: true,
      },
    });

    const allMemberIds = new Set<string>();

    for (const segment of segments) {
      if (segment.type === 'STATIC') {
        segment.memberIds.forEach(id => allMemberIds.add(id));
      } else {
        const dynamicMembers = await this.getMembersByFilter(segment.criteria as any);
        dynamicMembers.forEach(m => allMemberIds.add(m.id));
      }
    }

    return prisma.member.findMany({
      where: {
        tenantId: this.tenantId,
        id: { in: Array.from(allMemberIds) },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
  }

  /**
   * Get members by dynamic filter criteria
   */
  private async getMembersByFilter(criteria: any): Promise<any[]> {
    // Build Prisma where clause from criteria
    const where: any = { tenantId: this.tenantId };

    if (criteria.membershipType) {
      where.membershipType = criteria.membershipType;
    }

    if (criteria.status) {
      where.status = criteria.status;
    }

    if (criteria.groups?.length > 0) {
      where.groupMemberships = {
        some: { groupId: { in: criteria.groups } },
      };
    }

    if (criteria.ministries?.length > 0) {
      where.ministryMemberships = {
        some: { ministryId: { in: criteria.ministries } },
      };
    }

    if (criteria.joinedAfter) {
      where.joinDate = { gte: new Date(criteria.joinedAfter) };
    }

    if (criteria.joinedBefore) {
      where.joinDate = { ...where.joinDate, lte: new Date(criteria.joinedBefore) };
    }

    if (criteria.hasGiven !== undefined) {
      if (criteria.hasGiven) {
        where.donations = { some: {} };
      } else {
        where.donations = { none: {} };
      }
    }

    if (criteria.tags?.length > 0) {
      where.tags = { hasSome: criteria.tags };
    }

    return prisma.member.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
  }

  /**
   * Create email template
   */
  async createTemplate(data: {
    name: string;
    description?: string;
    category: string;
    mjml?: string;
    html: string;
    variables?: any[];
  }): Promise<EmailTemplate> {
    return prisma.emailTemplate.create({
      data: {
        tenantId: this.tenantId,
        name: data.name,
        description: data.description,
        category: data.category as any,
        mjml: data.mjml,
        html: data.html,
        variables: data.variables || [],
      },
    });
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<{
    overview: {
      totalRecipients: number;
      delivered: number;
      deliveryRate: number;
      opened: number;
      openRate: number;
      clicked: number;
      clickRate: number;
      bounced: number;
      bounceRate: number;
      unsubscribed: number;
      unsubscribeRate: number;
    };
    timeline: Array<{
      date: string;
      opens: number;
      clicks: number;
    }>;
    topLinks: Array<{
      url: string;
      clicks: number;
    }>;
    deviceBreakdown: Array<{
      device: string;
      opens: number;
      percentage: number;
    }>;
  }> {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId, tenantId: this.tenantId },
    });

    if (!campaign) throw new Error('Campaign not found');

    const total = campaign.totalRecipients || 1;

    // Get click data
    const clicks = await prisma.emailSend.findMany({
      where: { campaignId, clickedLinks: { not: null } },
      select: { clickedLinks: true },
    });

    // Aggregate link clicks
    const linkClicks: Record<string, number> = {};
    for (const send of clicks) {
      const links = send.clickedLinks as Array<{ url: string }>;
      for (const link of links) {
        linkClicks[link.url] = (linkClicks[link.url] || 0) + 1;
      }
    }

    const topLinks = Object.entries(linkClicks)
      .map(([url, clicks]) => ({ url, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    return {
      overview: {
        totalRecipients: campaign.totalRecipients,
        delivered: campaign.delivered,
        deliveryRate: (campaign.delivered / total) * 100,
        opened: campaign.opened,
        openRate: (campaign.opened / campaign.delivered || 1) * 100,
        clicked: campaign.clicked,
        clickRate: (campaign.clicked / campaign.opened || 1) * 100,
        bounced: campaign.bounced,
        bounceRate: (campaign.bounced / total) * 100,
        unsubscribed: campaign.unsubscribed,
        unsubscribeRate: (campaign.unsubscribed / campaign.delivered || 1) * 100,
      },
      timeline: [], // Would aggregate by date
      topLinks,
      deviceBreakdown: [], // Would require user agent parsing
    };
  }
}
```

### SMS Service

```typescript
// src/services/communication/sms.service.ts
import { prisma } from '@/lib/prisma';
import twilio from 'twilio';
import { SMSQueue } from '@/lib/queue/sms-queue';

interface SendSMSOptions {
  to: string;
  message: string;
  mediaUrl?: string;
  statusCallback?: string;
}

export class SMSService {
  private tenantId: string;
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER!;
  }

  /**
   * Send a single SMS
   */
  async send(options: SendSMSOptions): Promise<{
    success: boolean;
    messageId?: string;
    segments?: number;
    error?: string;
  }> {
    try {
      const message = await this.client.messages.create({
        to: options.to,
        from: await this.getTenantFromNumber(),
        body: options.message,
        mediaUrl: options.mediaUrl ? [options.mediaUrl] : undefined,
        statusCallback: options.statusCallback ||
          `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`,
      });

      return {
        success: true,
        messageId: message.sid,
        segments: message.numSegments ? parseInt(message.numSegments) : 1,
      };
    } catch (error) {
      console.error('[SMSService] Send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send an SMS campaign
   */
  async sendCampaign(campaignId: string): Promise<{
    totalRecipients: number;
    queued: number;
    failed: number;
    estimatedCost: number;
  }> {
    const campaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId, tenantId: this.tenantId },
    });

    if (!campaign) throw new Error('Campaign not found');

    await prisma.sMSCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING', sentAt: new Date() },
    });

    try {
      // Get recipients
      const recipients = await this.getRecipients(campaign);

      // Calculate estimated cost
      const segmentsPerMessage = Math.ceil(campaign.message.length / 160);
      const estimatedCost = recipients.length * segmentsPerMessage * 0.0075; // $0.0075 per segment

      await prisma.sMSCampaign.update({
        where: { id: campaignId },
        data: {
          totalRecipients: recipients.length,
          totalSegments: recipients.length * segmentsPerMessage,
          estimatedCost,
        },
      });

      let queued = 0;
      let failed = 0;

      for (const recipient of recipients) {
        try {
          const smsSend = await prisma.sMSSend.create({
            data: {
              tenantId: this.tenantId,
              campaignId: campaign.id,
              toNumber: recipient.phone,
              memberId: recipient.memberId,
              message: this.personalizeMessage(campaign.message, recipient),
              segments: segmentsPerMessage,
              status: 'QUEUED',
            },
          });

          await SMSQueue.add('send-sms', {
            smsSendId: smsSend.id,
            tenantId: this.tenantId,
            to: recipient.phone,
            message: smsSend.message,
            mediaUrl: campaign.mediaUrl || undefined,
          });

          queued++;
        } catch (error) {
          console.error(`Failed to queue SMS for ${recipient.phone}:`, error);
          failed++;
        }
      }

      return {
        totalRecipients: recipients.length,
        queued,
        failed,
        estimatedCost,
      };
    } catch (error) {
      await prisma.sMSCampaign.update({
        where: { id: campaignId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  /**
   * Handle incoming SMS (text-to-give, responses)
   */
  async handleIncoming(data: {
    from: string;
    to: string;
    body: string;
    messageSid: string;
  }): Promise<{
    response?: string;
    action?: string;
  }> {
    const message = data.body.toLowerCase().trim();

    // Text-to-give commands
    if (message.startsWith('give')) {
      const amount = parseFloat(message.replace('give', '').trim());
      if (!isNaN(amount) && amount > 0) {
        return {
          response: `To give $${amount}, click: ${process.env.NEXT_PUBLIC_APP_URL}/give?amount=${amount}&phone=${encodeURIComponent(data.from)}`,
          action: 'TEXT_TO_GIVE',
        };
      }
    }

    // Opt-out handling
    if (['stop', 'unsubscribe', 'cancel', 'end', 'quit'].includes(message)) {
      await this.handleOptOut(data.from);
      return {
        response: 'You have been unsubscribed from SMS messages. Reply START to re-subscribe.',
        action: 'OPT_OUT',
      };
    }

    // Opt-in handling
    if (['start', 'subscribe', 'yes'].includes(message)) {
      await this.handleOptIn(data.from);
      return {
        response: 'You have been subscribed to SMS messages. Reply STOP to unsubscribe.',
        action: 'OPT_IN',
      };
    }

    // Prayer request
    if (message.startsWith('pray')) {
      const prayerRequest = data.body.substring(4).trim();
      if (prayerRequest) {
        await this.createPrayerRequest(data.from, prayerRequest);
        return {
          response: 'Your prayer request has been received. We are praying for you.',
          action: 'PRAYER_REQUEST',
        };
      }
    }

    // Default response
    return {
      response: 'Thank you for your message. For assistance, visit our website or call the church office.',
    };
  }

  private async getTenantFromNumber(): Promise<string> {
    // Could support tenant-specific numbers in the future
    return this.fromNumber;
  }

  private async getRecipients(campaign: any): Promise<Array<{
    phone: string;
    name: string;
    memberId?: string;
  }>> {
    // Similar to email recipients but filter for valid phone numbers
    const members = await prisma.member.findMany({
      where: {
        tenantId: this.tenantId,
        phone: { not: null },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
      },
    });

    // Filter opted-out
    const optedOut = await prisma.communicationPreference.findMany({
      where: {
        tenantId: this.tenantId,
        smsEnabled: false,
      },
      select: { memberId: true },
    });

    const optedOutIds = new Set(optedOut.map(p => p.memberId));

    return members
      .filter(m => m.phone && !optedOutIds.has(m.id))
      .map(m => ({
        phone: this.formatPhoneNumber(m.phone!),
        name: `${m.firstName} ${m.lastName}`.trim(),
        memberId: m.id,
      }));
  }

  private formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    return `+${digits}`;
  }

  private personalizeMessage(message: string, recipient: { name: string }): string {
    return message
      .replace(/\{\{name\}\}/gi, recipient.name)
      .replace(/\{\{firstName\}\}/gi, recipient.name.split(' ')[0]);
  }

  private async handleOptOut(phone: string): Promise<void> {
    const member = await prisma.member.findFirst({
      where: {
        tenantId: this.tenantId,
        phone: { contains: phone.replace(/\D/g, '').slice(-10) },
      },
    });

    if (member) {
      await prisma.communicationPreference.upsert({
        where: {
          tenantId_memberId: {
            tenantId: this.tenantId,
            memberId: member.id,
          },
        },
        update: { smsEnabled: false },
        create: {
          tenantId: this.tenantId,
          memberId: member.id,
          smsEnabled: false,
        },
      });
    }
  }

  private async handleOptIn(phone: string): Promise<void> {
    const member = await prisma.member.findFirst({
      where: {
        tenantId: this.tenantId,
        phone: { contains: phone.replace(/\D/g, '').slice(-10) },
      },
    });

    if (member) {
      await prisma.communicationPreference.upsert({
        where: {
          tenantId_memberId: {
            tenantId: this.tenantId,
            memberId: member.id,
          },
        },
        update: { smsEnabled: true },
        create: {
          tenantId: this.tenantId,
          memberId: member.id,
          smsEnabled: true,
        },
      });
    }
  }

  private async createPrayerRequest(phone: string, request: string): Promise<void> {
    const member = await prisma.member.findFirst({
      where: {
        tenantId: this.tenantId,
        phone: { contains: phone.replace(/\D/g, '').slice(-10) },
      },
    });

    await prisma.prayerRequest.create({
      data: {
        tenantId: this.tenantId,
        memberId: member?.id,
        submitterName: member ? `${member.firstName} ${member.lastName}` : phone,
        submitterEmail: member?.email,
        request,
        source: 'SMS',
        isAnonymous: !member,
      },
    });
  }
}
```

### Push Notification Service

```typescript
// src/services/communication/push.service.ts
import { prisma } from '@/lib/prisma';
import * as admin from 'firebase-admin';
import { PushQueue } from '@/lib/queue/push-queue';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

interface SendPushOptions {
  token: string;
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
}

export class PushNotificationService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Send a single push notification
   */
  async send(options: SendPushOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const message: admin.messaging.Message = {
        token: options.token,
        notification: {
          title: options.title,
          body: options.body,
          imageUrl: options.imageUrl,
        },
        data: {
          tenantId: this.tenantId,
          ...options.data,
        },
        android: {
          priority: 'high',
          notification: {
            sound: options.sound || 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              badge: options.badge,
              sound: options.sound || 'default',
            },
          },
        },
        webpush: {
          notification: {
            badge: '/icons/badge-72x72.png',
            icon: '/icons/icon-192x192.png',
          },
        },
      };

      const response = await admin.messaging().send(message);

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      console.error('[PushService] Send error:', error);

      // Handle invalid tokens
      if (error instanceof Error && error.message.includes('registration-token-not-registered')) {
        await this.deactivateDevice(options.token);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a push campaign
   */
  async sendCampaign(campaignId: string): Promise<{
    totalRecipients: number;
    queued: number;
    failed: number;
  }> {
    const campaign = await prisma.pushCampaign.findUnique({
      where: { id: campaignId, tenantId: this.tenantId },
    });

    if (!campaign) throw new Error('Campaign not found');

    await prisma.pushCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING', sentAt: new Date() },
    });

    try {
      // Get active devices
      const devices = await this.getDevices(campaign);

      await prisma.pushCampaign.update({
        where: { id: campaignId },
        data: { totalRecipients: devices.length },
      });

      let queued = 0;
      let failed = 0;

      for (const device of devices) {
        try {
          const pushSend = await prisma.pushSend.create({
            data: {
              tenantId: this.tenantId,
              campaignId: campaign.id,
              deviceId: device.id,
              memberId: device.memberId,
              platform: device.platform,
              status: 'QUEUED',
            },
          });

          await PushQueue.add('send-push', {
            pushSendId: pushSend.id,
            tenantId: this.tenantId,
            token: device.deviceToken,
            title: campaign.title,
            body: campaign.body,
            imageUrl: campaign.imageUrl || undefined,
            data: {
              actionType: campaign.actionType,
              ...(campaign.actionData as Record<string, string>),
            },
            badge: campaign.badge || undefined,
            sound: campaign.sound || 'default',
          });

          queued++;
        } catch (error) {
          console.error(`Failed to queue push for device ${device.id}:`, error);
          failed++;
        }
      }

      return { totalRecipients: devices.length, queued, failed };
    } catch (error) {
      await prisma.pushCampaign.update({
        where: { id: campaignId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  /**
   * Send notification to topic (broadcast)
   */
  async sendToTopic(topic: string, notification: {
    title: string;
    body: string;
    imageUrl?: string;
    data?: Record<string, string>;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const message: admin.messaging.Message = {
        topic: `${this.tenantId}_${topic}`,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: {
          tenantId: this.tenantId,
          ...notification.data,
        },
      };

      const response = await admin.messaging().send(message);

      return { success: true, messageId: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Register a device for push notifications
   */
  async registerDevice(data: {
    memberId?: string;
    deviceToken: string;
    platform: string;
    deviceType?: string;
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
  }): Promise<void> {
    await prisma.pushDevice.upsert({
      where: {
        tenantId_deviceToken: {
          tenantId: this.tenantId,
          deviceToken: data.deviceToken,
        },
      },
      update: {
        memberId: data.memberId,
        platform: data.platform,
        deviceType: data.deviceType,
        deviceModel: data.deviceModel,
        osVersion: data.osVersion,
        appVersion: data.appVersion,
        isActive: true,
        lastActiveAt: new Date(),
      },
      create: {
        tenantId: this.tenantId,
        memberId: data.memberId,
        deviceToken: data.deviceToken,
        platform: data.platform,
        deviceType: data.deviceType,
        deviceModel: data.deviceModel,
        osVersion: data.osVersion,
        appVersion: data.appVersion,
      },
    });

    // Subscribe to tenant topic
    if (data.memberId) {
      await admin.messaging().subscribeToTopic(
        [data.deviceToken],
        `${this.tenantId}_all`
      );
    }
  }

  /**
   * Deactivate a device (invalid token)
   */
  private async deactivateDevice(token: string): Promise<void> {
    await prisma.pushDevice.updateMany({
      where: {
        tenantId: this.tenantId,
        deviceToken: token,
      },
      data: { isActive: false },
    });
  }

  /**
   * Get devices for campaign
   */
  private async getDevices(campaign: any): Promise<Array<{
    id: string;
    deviceToken: string;
    memberId: string | null;
    platform: string;
  }>> {
    const where: any = {
      tenantId: this.tenantId,
      isActive: true,
    };

    // Filter by platform
    if (campaign.platforms && campaign.platforms.length > 0) {
      where.platform = { in: campaign.platforms };
    }

    // Filter by member preferences
    const devicesWithPreferences = await prisma.pushDevice.findMany({
      where,
      include: {
        member: {
          include: {
            communicationPreferences: true,
          },
        },
      },
    });

    return devicesWithPreferences
      .filter(device => {
        // Check if push is enabled
        const prefs = device.member?.communicationPreferences?.[0];
        return !prefs || prefs.pushEnabled;
      })
      .map(device => ({
        id: device.id,
        deviceToken: device.deviceToken,
        memberId: device.memberId,
        platform: device.platform,
      }));
  }
}
```

### Notification Service (In-App)

```typescript
// src/services/communication/notification.service.ts
import { prisma } from '@/lib/prisma';
import { EmailService } from './email.service';
import { PushNotificationService } from './push.service';
import { Notification, NotificationType, NotificationPriority } from '@prisma/client';

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  imageUrl?: string;
  actionType?: string;
  actionData?: Record<string, unknown>;
  channels?: ('in_app' | 'email' | 'push')[];
  priority?: NotificationPriority;
  expiresAt?: Date;
}

export class NotificationService {
  private tenantId: string;
  private emailService: EmailService;
  private pushService: PushNotificationService;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.emailService = new EmailService(tenantId);
    this.pushService = new PushNotificationService(tenantId);
  }

  /**
   * Create and send a notification
   */
  async create(options: CreateNotificationOptions): Promise<Notification> {
    const channels = options.channels || ['in_app'];
    const channelsSent: string[] = [];

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        tenantId: this.tenantId,
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        imageUrl: options.imageUrl,
        actionType: options.actionType,
        actionData: options.actionData,
        channels,
        priority: options.priority || 'NORMAL',
        expiresAt: options.expiresAt,
        status: 'PENDING',
      },
    });

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: options.userId },
      include: { member: true },
    });

    // Get user preferences
    const preferences = user?.member ? await prisma.communicationPreference.findUnique({
      where: {
        tenantId_memberId: {
          tenantId: this.tenantId,
          memberId: user.member.id,
        },
      },
    }) : null;

    // Send to each channel
    for (const channel of channels) {
      try {
        if (channel === 'in_app') {
          // In-app notifications are just stored - delivered via API/WebSocket
          channelsSent.push('in_app');
        }

        if (channel === 'email' && user?.email) {
          if (!preferences || preferences.emailEnabled) {
            await this.emailService.send({
              to: user.email,
              subject: options.title,
              html: this.buildEmailHtml(options),
            });
            channelsSent.push('email');
          }
        }

        if (channel === 'push' && user?.member) {
          if (!preferences || preferences.pushEnabled) {
            const devices = await prisma.pushDevice.findMany({
              where: {
                tenantId: this.tenantId,
                memberId: user.member.id,
                isActive: true,
              },
            });

            for (const device of devices) {
              await this.pushService.send({
                token: device.deviceToken,
                title: options.title,
                body: options.message,
                imageUrl: options.imageUrl,
                data: {
                  notificationId: notification.id,
                  actionType: options.actionType || '',
                  ...(options.actionData as Record<string, string>),
                },
              });
            }

            if (devices.length > 0) {
              channelsSent.push('push');
            }
          }
        }
      } catch (error) {
        console.error(`Failed to send notification via ${channel}:`, error);
      }
    }

    // Update notification with sent channels
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        channelsSent,
        status: channelsSent.length > 0 ? 'SENT' : 'PENDING',
      },
    });

    return notification;
  }

  /**
   * Send notification to multiple users
   */
  async createBulk(
    userIds: string[],
    options: Omit<CreateNotificationOptions, 'userId'>
  ): Promise<number> {
    let sent = 0;

    for (const userId of userIds) {
      try {
        await this.create({ ...options, userId });
        sent++;
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
      }
    }

    return sent;
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      pageSize?: number;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{
    items: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const { page = 1, pageSize = 20, unreadOnly = false } = options;

    const where: any = {
      tenantId: this.tenantId,
      userId,
      status: { in: ['SENT', 'READ'] },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (unreadOnly) {
      where.readAt = null;
    }

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          ...where,
          readAt: null,
        },
      }),
    ]);

    return { items, total, unreadCount };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        tenantId: this.tenantId,
      },
      data: {
        readAt: new Date(),
        status: 'READ',
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        tenantId: this.tenantId,
        readAt: null,
        status: 'SENT',
      },
      data: {
        readAt: new Date(),
        status: 'READ',
      },
    });

    return result.count;
  }

  /**
   * Dismiss notification
   */
  async dismiss(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        tenantId: this.tenantId,
      },
      data: {
        dismissedAt: new Date(),
        status: 'DISMISSED',
      },
    });
  }

  private buildEmailHtml(options: CreateNotificationOptions): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">${options.title}</h2>
        ${options.imageUrl ? `<img src="${options.imageUrl}" style="max-width: 100%; border-radius: 8px; margin: 16px 0;" />` : ''}
        <p style="color: #4b5563; line-height: 1.6;">${options.message}</p>
        ${options.actionData?.url ? `
          <a href="${options.actionData.url}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            View Details
          </a>
        ` : ''}
      </div>
    `;
  }
}
```

---

## Workflow Engine

```typescript
// src/services/communication/workflow.service.ts
import { prisma } from '@/lib/prisma';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { SMSService } from './sms.service';
import { WorkflowQueue } from '@/lib/queue/workflow-queue';
import {
  CommunicationWorkflow,
  WorkflowExecution,
  WorkflowTrigger,
  ExecutionStatus,
} from '@prisma/client';

interface WorkflowStep {
  type: 'wait' | 'email' | 'sms' | 'push' | 'notification' | 'condition' | 'update_member';
  config: Record<string, any>;
}

export class WorkflowService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Create a workflow
   */
  async create(data: {
    name: string;
    description?: string;
    triggerType: WorkflowTrigger;
    triggerConfig: Record<string, any>;
    steps: WorkflowStep[];
  }): Promise<CommunicationWorkflow> {
    return prisma.communicationWorkflow.create({
      data: {
        tenantId: this.tenantId,
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig,
        steps: data.steps,
        status: 'DRAFT',
        createdBy: 'system', // Should be actual user
      },
    });
  }

  /**
   * Activate a workflow
   */
  async activate(workflowId: string): Promise<void> {
    await prisma.communicationWorkflow.update({
      where: { id: workflowId, tenantId: this.tenantId },
      data: { status: 'ACTIVE' },
    });
  }

  /**
   * Trigger a workflow for a member
   */
  async trigger(
    trigger: WorkflowTrigger,
    memberId: string,
    contextData?: Record<string, any>
  ): Promise<number> {
    // Find active workflows with this trigger
    const workflows = await prisma.communicationWorkflow.findMany({
      where: {
        tenantId: this.tenantId,
        triggerType: trigger,
        status: 'ACTIVE',
      },
    });

    let enrolled = 0;

    for (const workflow of workflows) {
      // Check if member already enrolled
      const existing = await prisma.workflowExecution.findFirst({
        where: {
          workflowId: workflow.id,
          memberId,
          status: { in: ['IN_PROGRESS', 'WAITING'] },
        },
      });

      if (existing) continue;

      // Check trigger conditions
      if (!this.checkTriggerConditions(workflow, contextData)) {
        continue;
      }

      // Create execution
      const execution = await prisma.workflowExecution.create({
        data: {
          tenantId: this.tenantId,
          workflowId: workflow.id,
          memberId,
          currentStep: 0,
          status: 'IN_PROGRESS',
          contextData: contextData || {},
          stepHistory: [],
        },
      });

      // Queue first step
      await WorkflowQueue.add('process-step', {
        executionId: execution.id,
        tenantId: this.tenantId,
      });

      // Update workflow stats
      await prisma.communicationWorkflow.update({
        where: { id: workflow.id },
        data: {
          totalEnrolled: { increment: 1 },
          active: { increment: 1 },
        },
      });

      enrolled++;
    }

    return enrolled;
  }

  /**
   * Process a workflow step
   */
  async processStep(executionId: string): Promise<void> {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: { workflow: true },
    });

    if (!execution || execution.status === 'COMPLETED' || execution.status === 'CANCELLED') {
      return;
    }

    const steps = execution.workflow.steps as WorkflowStep[];
    const currentStep = steps[execution.currentStep];

    if (!currentStep) {
      // Workflow complete
      await this.completeExecution(execution);
      return;
    }

    try {
      const result = await this.executeStep(execution, currentStep);

      // Update step history
      const stepHistory = execution.stepHistory as any[];
      stepHistory.push({
        step: execution.currentStep,
        type: currentStep.type,
        status: result.success ? 'completed' : 'failed',
        result: result.data,
        at: new Date().toISOString(),
      });

      if (result.waitUntil) {
        // Step requires waiting
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            status: 'WAITING',
            nextStepAt: result.waitUntil,
            stepHistory,
          },
        });

        // Schedule next step
        await WorkflowQueue.add('process-step', {
          executionId,
          tenantId: this.tenantId,
        }, {
          delay: result.waitUntil.getTime() - Date.now(),
        });
      } else if (result.skipToStep !== undefined) {
        // Conditional jump
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            currentStep: result.skipToStep,
            stepHistory,
            contextData: { ...execution.contextData as any, ...result.data },
          },
        });

        // Process next step immediately
        await WorkflowQueue.add('process-step', {
          executionId,
          tenantId: this.tenantId,
        });
      } else {
        // Move to next step
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            currentStep: execution.currentStep + 1,
            status: 'IN_PROGRESS',
            stepHistory,
            contextData: { ...execution.contextData as any, ...result.data },
          },
        });

        // Process next step
        await WorkflowQueue.add('process-step', {
          executionId,
          tenantId: this.tenantId,
        });
      }
    } catch (error) {
      console.error(`Workflow step failed:`, error);

      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: { status: 'FAILED' },
      });
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    execution: WorkflowExecution & { workflow: CommunicationWorkflow },
    step: WorkflowStep
  ): Promise<{
    success: boolean;
    data?: Record<string, any>;
    waitUntil?: Date;
    skipToStep?: number;
  }> {
    const member = await prisma.member.findUnique({
      where: { id: execution.memberId },
      include: { user: true },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    const context = execution.contextData as Record<string, any>;

    switch (step.type) {
      case 'wait':
        const waitDuration = this.parseWaitDuration(step.config.duration);
        return {
          success: true,
          waitUntil: new Date(Date.now() + waitDuration),
        };

      case 'email':
        const emailService = new EmailService(this.tenantId);
        if (member.email) {
          await emailService.send({
            to: member.email,
            subject: this.interpolate(step.config.subject, { member, context }),
            html: this.interpolate(step.config.html, { member, context }),
          });
        }
        return { success: true };

      case 'sms':
        const smsService = new SMSService(this.tenantId);
        if (member.phone) {
          await smsService.send({
            to: member.phone,
            message: this.interpolate(step.config.message, { member, context }),
          });
        }
        return { success: true };

      case 'push':
        const notificationService = new NotificationService(this.tenantId);
        if (member.userId) {
          await notificationService.create({
            userId: member.userId,
            type: 'CUSTOM',
            title: this.interpolate(step.config.title, { member, context }),
            message: this.interpolate(step.config.body, { member, context }),
            channels: ['push'],
          });
        }
        return { success: true };

      case 'notification':
        const notifService = new NotificationService(this.tenantId);
        if (member.userId) {
          await notifService.create({
            userId: member.userId,
            type: step.config.notificationType || 'CUSTOM',
            title: this.interpolate(step.config.title, { member, context }),
            message: this.interpolate(step.config.message, { member, context }),
            channels: step.config.channels || ['in_app'],
          });
        }
        return { success: true };

      case 'condition':
        const conditionMet = this.evaluateCondition(step.config.condition, { member, context });
        return {
          success: true,
          skipToStep: conditionMet ? step.config.trueStep : step.config.falseStep,
        };

      case 'update_member':
        await prisma.member.update({
          where: { id: member.id },
          data: step.config.updates,
        });
        return { success: true };

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private parseWaitDuration(duration: string): number {
    const match = duration.match(/^(\d+)(m|h|d|w)$/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      'm': 60 * 1000,           // minutes
      'h': 60 * 60 * 1000,      // hours
      'd': 24 * 60 * 60 * 1000, // days
      'w': 7 * 24 * 60 * 60 * 1000, // weeks
    };

    return value * (multipliers[unit] || 0);
  }

  private interpolate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const keys = path.trim().split('.');
      let value: any = data;

      for (const key of keys) {
        value = value?.[key];
      }

      return value !== undefined ? String(value) : match;
    });
  }

  private evaluateCondition(condition: any, data: Record<string, any>): boolean {
    // Simple condition evaluation
    const { field, operator, value } = condition;
    const actualValue = this.getNestedValue(data, field);

    switch (operator) {
      case 'equals': return actualValue === value;
      case 'not_equals': return actualValue !== value;
      case 'contains': return String(actualValue).includes(value);
      case 'greater_than': return Number(actualValue) > Number(value);
      case 'less_than': return Number(actualValue) < Number(value);
      case 'is_empty': return !actualValue;
      case 'is_not_empty': return !!actualValue;
      default: return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private checkTriggerConditions(workflow: CommunicationWorkflow, contextData?: Record<string, any>): boolean {
    const config = workflow.triggerConfig as Record<string, any>;

    if (!config.conditions || config.conditions.length === 0) {
      return true;
    }

    return config.conditions.every((condition: any) =>
      this.evaluateCondition(condition, { context: contextData || {} })
    );
  }

  private async completeExecution(execution: WorkflowExecution): Promise<void> {
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    await prisma.communicationWorkflow.update({
      where: { id: execution.workflowId },
      data: {
        completed: { increment: 1 },
        active: { decrement: 1 },
      },
    });
  }
}
```

---

## API Endpoints

### Email Campaign API

```typescript
// src/app/api/admin/[tenantSlug]/communication/email/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/communication/email.service';
import { z } from 'zod';

const createCampaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  preheader: z.string().optional(),
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  replyToEmail: z.string().email().optional(),
  templateId: z.string().optional(),
  content: z.any(),
  audienceType: z.enum(['ALL_MEMBERS', 'ALL_VISITORS', 'SEGMENT', 'CUSTOM_FILTER', 'MANUAL_LIST']),
  audienceFilter: z.any().optional(),
  segmentIds: z.array(z.string()).optional(),
  excludeSegments: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
  isABTest: z.boolean().optional(),
  abTestConfig: z.any().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: any = { tenantId: tenant.id };
    if (status) {
      where.status = status;
    }

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          template: { select: { name: true } },
        },
      }),
      prisma.emailCampaign.count({ where }),
    ]);

    return NextResponse.json({
      items: campaigns,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return NextResponse.json(
      { error: 'Failed to get campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const data = createCampaignSchema.parse(body);

    const campaign = await prisma.emailCampaign.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        subject: data.subject,
        preheader: data.preheader,
        fromName: data.fromName,
        fromEmail: data.fromEmail,
        replyToEmail: data.replyToEmail,
        templateId: data.templateId,
        content: data.content,
        audienceType: data.audienceType,
        audienceFilter: data.audienceFilter,
        segmentIds: data.segmentIds || [],
        excludeSegments: data.excludeSegments || [],
        status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        isABTest: data.isABTest || false,
        abTestConfig: data.abTestConfig,
        createdBy: session.user?.id || 'unknown',
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create campaign error:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

// src/app/api/admin/[tenantSlug]/communication/email/campaigns/[campaignId]/send/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; campaignId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const emailService = new EmailService(tenant.id);
    const result = await emailService.sendCampaign(params.campaignId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Send campaign error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send campaign' },
      { status: 500 }
    );
  }
}
```

### Notifications API

```typescript
// src/app/api/[tenantSlug]/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/services/communication/notification.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const notificationService = new NotificationService(tenant.id);
    const result = await notificationService.getUserNotifications(
      session.user.id,
      { page, pageSize, unreadOnly }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

// Mark as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    const notificationService = new NotificationService(tenant.id);

    if (markAllRead) {
      const count = await notificationService.markAllAsRead(session.user.id);
      return NextResponse.json({ markedRead: count });
    } else if (notificationId) {
      await notificationService.markAsRead(notificationId, session.user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Mark notification error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
```

---

## Admin Components

### Campaign Builder

```tsx
// src/components/admin/communication/CampaignBuilder.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EmailEditor } from './EmailEditor';
import { AudienceSelector } from './AudienceSelector';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Send,
  Save,
  Eye,
  Users,
  Mail,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  subject: z.string().min(1, 'Subject line is required'),
  preheader: z.string().optional(),
  fromName: z.string().min(1, 'From name is required'),
  fromEmail: z.string().email('Valid email required'),
  replyToEmail: z.string().email().optional().or(z.literal('')),
  audienceType: z.enum(['ALL_MEMBERS', 'ALL_VISITORS', 'SEGMENT', 'CUSTOM_FILTER']),
  segmentIds: z.array(z.string()).optional(),
  scheduledAt: z.date().optional(),
  trackOpens: z.boolean(),
  trackClicks: z.boolean(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignBuilderProps {
  tenantSlug: string;
  campaign?: any; // Existing campaign for editing
  templates: any[];
  segments: any[];
  defaultFromEmail: string;
  defaultFromName: string;
}

export function CampaignBuilder({
  tenantSlug,
  campaign,
  templates,
  segments,
  defaultFromEmail,
  defaultFromName,
}: CampaignBuilderProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [emailContent, setEmailContent] = useState(campaign?.content || '');
  const [isSending, setIsSending] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: campaign?.name || '',
      subject: campaign?.subject || '',
      preheader: campaign?.preheader || '',
      fromName: campaign?.fromName || defaultFromName,
      fromEmail: campaign?.fromEmail || defaultFromEmail,
      replyToEmail: campaign?.replyToEmail || '',
      audienceType: campaign?.audienceType || 'ALL_MEMBERS',
      segmentIds: campaign?.segmentIds || [],
      trackOpens: campaign?.trackOpens ?? true,
      trackClicks: campaign?.trackClicks ?? true,
    },
  });

  const onSave = async (data: CampaignFormData, status: 'DRAFT' | 'SCHEDULED') => {
    try {
      const response = await fetch(
        `/api/admin/${tenantSlug}/communication/email/campaigns${campaign ? `/${campaign.id}` : ''}`,
        {
          method: campaign ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            content: emailContent,
            status,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to save campaign');

      toast.success(status === 'SCHEDULED' ? 'Campaign scheduled' : 'Campaign saved');
    } catch (error) {
      toast.error('Failed to save campaign');
    }
  };

  const onSendNow = async () => {
    const data = form.getValues();

    if (!data.name || !data.subject || !emailContent) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSending(true);

    try {
      // First save the campaign
      const saveResponse = await fetch(
        `/api/admin/${tenantSlug}/communication/email/campaigns${campaign ? `/${campaign.id}` : ''}`,
        {
          method: campaign ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            content: emailContent,
          }),
        }
      );

      if (!saveResponse.ok) throw new Error('Failed to save campaign');

      const savedCampaign = await saveResponse.json();

      // Then send it
      const sendResponse = await fetch(
        `/api/admin/${tenantSlug}/communication/email/campaigns/${savedCampaign.id}/send`,
        { method: 'POST' }
      );

      if (!sendResponse.ok) throw new Error('Failed to send campaign');

      const result = await sendResponse.json();

      toast.success(`Campaign sent to ${result.queued} recipients`);
    } catch (error) {
      toast.error('Failed to send campaign');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {campaign ? 'Edit Campaign' : 'Create Campaign'}
          </h1>
          <p className="text-muted-foreground">
            Build and send email campaigns to your congregation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => onSave(form.getValues(), 'DRAFT')}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={onSendNow} disabled={isSending}>
            <Send className="h-4 w-4 mr-2" />
            {isSending ? 'Sending...' : 'Send Now'}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">
              <Mail className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="audience">
              <Users className="h-4 w-4 mr-2" />
              Audience
              {recipientCount !== null && (
                <Badge variant="secondary" className="ml-2">
                  {recipientCount.toLocaleString()}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">
              Settings
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Weekly Newsletter - January" {...field} />
                      </FormControl>
                      <FormDescription>
                        Internal name for this campaign
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Line</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="This Week at {{churchName}}"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use {'{{firstName}}'} for personalization
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preheader"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preview Text (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="A brief preview of your email content..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Shows after the subject line in inbox
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>
                  Design your email using the visual editor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmailEditor
                  value={emailContent}
                  onChange={setEmailContent}
                  templates={templates}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audience">
            <Card>
              <CardHeader>
                <CardTitle>Select Audience</CardTitle>
                <CardDescription>
                  Choose who will receive this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AudienceSelector
                  tenantSlug={tenantSlug}
                  value={{
                    type: form.watch('audienceType'),
                    segmentIds: form.watch('segmentIds'),
                  }}
                  onChange={(audience) => {
                    form.setValue('audienceType', audience.type);
                    form.setValue('segmentIds', audience.segmentIds);
                  }}
                  segments={segments}
                  onRecipientCountChange={setRecipientCount}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Tracking & Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="replyToEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reply-To Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="pastor@church.org" {...field} />
                      </FormControl>
                      <FormDescription>
                        Replies will go to this address instead of From email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="trackOpens"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Track Opens</FormLabel>
                          <FormDescription>
                            Track when recipients open this email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trackClicks"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Track Clicks</FormLabel>
                          <FormDescription>
                            Track when recipients click links in this email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Campaign</CardTitle>
                <CardDescription>
                  Choose when to send this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Send Date & Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-[280px] justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, 'PPP p')
                              ) : (
                                <span>Send immediately</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Leave empty to send immediately when you click "Send Now"
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('scheduledAt') && (
                  <div className="mt-6">
                    <Button
                      onClick={() => onSave(form.getValues(), 'SCHEDULED')}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule Campaign
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Form>
    </div>
  );
}
```

---

## Best Practices

### Deliverability Optimization

```typescript
// Deliverability best practices configuration
const deliverabilityConfig = {
  // Email authentication
  authentication: {
    spf: 'v=spf1 include:sendgrid.net include:_spf.google.com ~all',
    dkim: 'Enabled via email provider',
    dmarc: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@church.com',
  },

  // Sending practices
  sending: {
    warmupPeriod: '2-4 weeks for new domains',
    startVolume: 50,
    increaseRate: '50% per week',
    maxPerHour: 1000,
    batchSize: 50,
    delayBetweenBatches: 5000, // ms
  },

  // List hygiene
  listHygiene: {
    bounceThreshold: 5, // Remove after 5 bounces
    inactiveThreshold: 180, // Days before marking inactive
    reengagementPeriod: 90, // Days before reengagement campaign
  },

  // Content guidelines
  content: {
    maxSubjectLength: 50,
    avoidSpamWords: ['free', 'guarantee', 'act now', 'urgent', 'winner'],
    textToHtmlRatio: 0.3,
    includeUnsubscribe: true,
    includePhysicalAddress: true,
  },
};
```

### Rate Limiting

```typescript
// src/lib/rate-limit/communication.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export async function checkRateLimit(
  tenantId: string,
  channel: 'email' | 'sms' | 'push',
  identifier: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const limits = {
    email: { limit: 1000, window: 3600 },    // 1000/hour
    sms: { limit: 100, window: 3600 },       // 100/hour
    push: { limit: 10000, window: 3600 },    // 10000/hour
  };

  const { limit, window } = limits[channel];
  const key = `ratelimit:${tenantId}:${channel}:${identifier}`;

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window);
  }

  const ttl = await redis.ttl(key);
  const resetAt = new Date(Date.now() + ttl * 1000);

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetAt,
  };
}
```

---

## Webhook Handlers

### SendGrid Webhook

```typescript
// src/app/api/webhooks/sendgrid/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

interface SendGridEvent {
  email: string;
  timestamp: number;
  event: 'delivered' | 'bounce' | 'open' | 'click' | 'dropped' | 'deferred' | 'unsubscribe' | 'spamreport';
  sg_message_id: string;
  reason?: string;
  url?: string;
  useragent?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('X-Twilio-Email-Event-Webhook-Signature');
    const timestamp = request.headers.get('X-Twilio-Email-Event-Webhook-Timestamp');
    const body = await request.text();

    if (process.env.SENDGRID_WEBHOOK_KEY) {
      const payload = timestamp + body;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.SENDGRID_WEBHOOK_KEY)
        .update(payload)
        .digest('base64');

      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const events: SendGridEvent[] = JSON.parse(body);

    for (const event of events) {
      await processEvent(event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SendGrid Webhook] Error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function processEvent(event: SendGridEvent): Promise<void> {
  const messageId = event.sg_message_id?.split('.')[0];
  if (!messageId) return;

  const statusMap: Record<string, any> = {
    delivered: { status: 'DELIVERED', deliveredAt: new Date(event.timestamp * 1000) },
    bounce: { status: 'BOUNCED', bouncedAt: new Date(event.timestamp * 1000), errorMessage: event.reason },
    open: { status: 'OPENED', openedAt: new Date(event.timestamp * 1000), opens: { increment: 1 } },
    click: { clickedAt: new Date(event.timestamp * 1000), clicks: { increment: 1 } },
    dropped: { status: 'FAILED', errorMessage: event.reason },
    unsubscribe: { unsubscribedAt: new Date(event.timestamp * 1000) },
    spamreport: { complainedAt: new Date(event.timestamp * 1000) },
  };

  const updateData = statusMap[event.event];
  if (!updateData) return;

  // Update email send record
  await prisma.emailSend.updateMany({
    where: { messageId },
    data: updateData,
  });

  // Update campaign stats
  const emailSend = await prisma.emailSend.findFirst({
    where: { messageId },
    select: { campaignId: true },
  });

  if (emailSend?.campaignId) {
    const statField = {
      delivered: 'delivered',
      bounce: 'bounced',
      open: 'opened',
      click: 'clicked',
      unsubscribe: 'unsubscribed',
      spamreport: 'complained',
    }[event.event];

    if (statField) {
      await prisma.emailCampaign.update({
        where: { id: emailSend.campaignId },
        data: { [statField]: { increment: 1 } },
      });
    }
  }

  // Handle unsubscribe
  if (event.event === 'unsubscribe') {
    await handleUnsubscribe(event.email);
  }
}

async function handleUnsubscribe(email: string): Promise<void> {
  const member = await prisma.member.findFirst({
    where: { email },
  });

  if (member) {
    await prisma.communicationPreference.upsert({
      where: {
        tenantId_memberId: {
          tenantId: member.tenantId,
          memberId: member.id,
        },
      },
      update: { emailEnabled: false },
      create: {
        tenantId: member.tenantId,
        memberId: member.id,
        emailEnabled: false,
      },
    });
  }
}
```

---

## Related Documentation

- [11-member-management.md](./11-member-management.md) - Member data for segmentation
- [12-events-calendar.md](./12-events-calendar.md) - Event-triggered communications
- [15-groups-ministries.md](./15-groups-ministries.md) - Group messaging
- [16-mobile-apps.md](./16-mobile-apps.md) - Push notification integration
- [17-authentication.md](./17-authentication.md) - User preferences and security

---

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
**Maintained By**: Digital Church Platform Team
