# 12. Events & Calendar System

## Event Management, Registration & Check-in

---

## 1. Overview

### Purpose
The Events & Calendar System provides churches with comprehensive tools for creating, managing, and promoting events. From weekly services to special conferences, the system handles registration, capacity management, payments, check-in, and follow-up communications.

### Competitive Analysis

| Feature | Planning Center | Breeze | Realm | **Digital Church Platform** |
|---------|----------------|--------|-------|----------------------------|
| Event Creation | Good | Basic | Good | **Excellent** |
| Recurring Events | Good | Limited | Good | **Advanced RRULE** |
| Online Registration | Premium | Basic | Premium | **Included** |
| Payment Processing | Limited | None | Premium | **Stripe Integrated** |
| Check-in | Separate App | None | Premium | **Fully Integrated** |
| Capacity Management | Basic | Manual | Good | **Real-time** |
| Calendar Sync | iCal Export | None | iCal | **iCal/Google/Outlook** |
| Child Check-in | Separate App | None | Premium | **Included** |
| QR Codes | None | None | Basic | **Dynamic QR** |
| Waitlist | None | None | Basic | **Automated** |

### Key Features

1. **Visual Calendar**: Multiple views (month, week, day, list) with drag-and-drop
2. **Smart Registration**: Online signup with capacity management and waitlists
3. **Recurring Events**: Full RRULE support for complex repeat patterns
4. **Integrated Payments**: Event fees processed through Stripe
5. **Check-in System**: QR codes, kiosk mode, and child safety
6. **Calendar Sync**: Export to Google Calendar, iCal, Outlook
7. **Volunteer Management**: Assign and schedule volunteers per event

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Events & Calendar System                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────────┐ │
│  │    Event      │  │  Calendar     │  │     Registration        │ │
│  │   Management  │  │   Views       │  │     System              │ │
│  ├───────────────┤  ├───────────────┤  ├─────────────────────────┤ │
│  │ • Create/Edit │  │ • Month View  │  │ • Online Registration   │ │
│  │ • Categories  │  │ • Week View   │  │ • Capacity Management   │ │
│  │ • Recurrence  │  │ • Day View    │  │ • Waitlist Handling     │ │
│  │ • Status      │  │ • List View   │  │ • Payment Processing    │ │
│  │ • Media       │  │ • Mini Cal    │  │ • Guest Registration    │ │
│  └───────────────┘  └───────────────┘  └─────────────────────────┘ │
│                                                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────────┐ │
│  │   Check-in    │  │  Calendar     │  │     Communications      │ │
│  │   System      │  │   Sync        │  │     & Reminders         │ │
│  ├───────────────┤  ├───────────────┤  ├─────────────────────────┤ │
│  │ • QR Code     │  │ • iCal Export │  │ • Email Reminders       │ │
│  │ • Kiosk Mode  │  │ • Google Sync │  │ • SMS Notifications     │ │
│  │ • Child Safety│  │ • Outlook     │  │ • Push Notifications    │ │
│  │ • Labels      │  │ • Subscriptions│ │ • Post-event Follow-up  │ │
│  └───────────────┘  └───────────────┘  └─────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Volunteer Scheduling                       │    │
│  │  • Role assignment  • Availability tracking  • Confirmations │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Core Event Model

```prisma
// =====================================================
// EVENTS & CALENDAR SCHEMA
// =====================================================

model Event {
  id              String          @id @default(uuid())
  tenantId        String          @map("tenant_id")
  tenant          Tenant          @relation(fields: [tenantId], references: [id])

  // Basic Info
  title           String
  slug            String
  description     String?         @db.Text
  shortDescription String?        @map("short_description") @db.VarChar(300)
  excerpt         String?         @db.VarChar(160) // For meta description

  // Dates & Times
  startDate       DateTime        @map("start_date")
  endDate         DateTime        @map("end_date")
  allDay          Boolean         @default(false) @map("all_day")
  timezone        String          @default("America/Chicago")

  // Recurrence (RFC 5545 RRULE format)
  isRecurring     Boolean         @default(false) @map("is_recurring")
  recurrenceRule  String?         @map("recurrence_rule") // "FREQ=WEEKLY;BYDAY=SU;COUNT=52"
  recurrenceEnd   DateTime?       @map("recurrence_end")
  parentEventId   String?         @map("parent_event_id")
  parentEvent     Event?          @relation("EventRecurrence", fields: [parentEventId], references: [id])
  childEvents     Event[]         @relation("EventRecurrence")
  recurrenceExceptions Json?      @map("recurrence_exceptions") // Excluded dates

  // Location
  locationType    LocationType    @default(IN_PERSON) @map("location_type")
  locationName    String?         @map("location_name")
  address         String?         @db.Text
  city            String?
  state           String?
  zipCode         String?         @map("zip_code")
  country         String?         @default("US")
  onlineUrl       String?         @map("online_url")
  onlinePlatform  String?         @map("online_platform") // "zoom", "youtube", etc.
  meetingId       String?         @map("meeting_id")
  meetingPassword String?         @map("meeting_password")
  coordinates     Json?           // { lat: number, lng: number }
  roomId          String?         @map("room_id")
  room            Room?           @relation(fields: [roomId], references: [id])

  // Media
  featuredImage   String?         @map("featured_image")
  images          String[]        @default([])
  videoUrl        String?         @map("video_url")

  // Registration Settings
  registrationEnabled Boolean     @default(false) @map("registration_enabled")
  registrationRequired Boolean    @default(false) @map("registration_required")
  maxCapacity     Int?            @map("max_capacity")
  currentCount    Int             @default(0) @map("current_count")
  waitlistEnabled Boolean         @default(false) @map("waitlist_enabled")
  waitlistCount   Int             @default(0) @map("waitlist_count")
  registrationStartDate DateTime? @map("registration_start_date")
  registrationDeadline DateTime?  @map("registration_deadline")
  allowGuestRegistration Boolean  @default(true) @map("allow_guest_registration")
  maxGuestsPerRegistration Int    @default(5) @map("max_guests_per_registration")
  requireApproval Boolean         @default(false) @map("require_approval")

  // Payment Settings
  isFree          Boolean         @default(true) @map("is_free")
  price           Decimal?        @db.Decimal(10, 2)
  earlyBirdPrice  Decimal?        @map("early_bird_price") @db.Decimal(10, 2)
  earlyBirdDeadline DateTime?     @map("early_bird_deadline")
  childPrice      Decimal?        @map("child_price") @db.Decimal(10, 2)
  familyPrice     Decimal?        @map("family_price") @db.Decimal(10, 2)
  allowPartialPayment Boolean     @default(false) @map("allow_partial_payment")
  minimumDeposit  Decimal?        @map("minimum_deposit") @db.Decimal(10, 2)

  // Check-in Settings
  checkinEnabled  Boolean         @default(false) @map("checkin_enabled")
  checkinStartBefore Int          @default(30) @map("checkin_start_before") // minutes
  checkinEndAfter Int             @default(60) @map("checkin_end_after") // minutes
  securityCodeRequired Boolean    @default(false) @map("security_code_required")
  printLabels     Boolean         @default(false) @map("print_labels")

  // Organization
  ministryId      String?         @map("ministry_id")
  ministry        Ministry?       @relation(fields: [ministryId], references: [id])
  categoryId      String?         @map("category_id")
  category        EventCategory?  @relation(fields: [categoryId], references: [id])
  tags            String[]        @default([])

  // Visibility & Status
  status          EventStatus     @default(DRAFT)
  visibility      EventVisibility @default(PUBLIC)
  isFeatured      Boolean         @default(false) @map("is_featured")
  isSticky        Boolean         @default(false) @map("is_sticky")
  showOnHomepage  Boolean         @default(true) @map("show_on_homepage")

  // Notifications
  reminderEnabled Boolean         @default(true) @map("reminder_enabled")
  reminderTiming  Int[]           @default([24, 1]) @map("reminder_timing") // hours before
  notifyOnRegistration Boolean    @default(true) @map("notify_on_registration")

  // Contact
  contactName     String?         @map("contact_name")
  contactEmail    String?         @map("contact_email")
  contactPhone    String?         @map("contact_phone")

  // Custom Fields for Registration
  customFields    Json?           @map("custom_fields")
  // [{ id, label, type, required, options }]

  // SEO
  metaTitle       String?         @map("meta_title")
  metaDescription String?         @map("meta_description")

  // Author
  creatorId       String?         @map("creator_id")
  creator         User?           @relation("EventCreator", fields: [creatorId], references: [id])

  // Timestamps
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")
  publishedAt     DateTime?       @map("published_at")
  deletedAt       DateTime?       @map("deleted_at")

  // Relations
  registrations   EventRegistration[]
  checkins        Checkin[]
  attendances     Attendance[]
  volunteers      EventVolunteer[]
  resources       EventResource[]
  reminders       EventReminder[]

  @@unique([tenantId, slug])
  @@map("events")
  @@index([tenantId])
  @@index([tenantId, status])
  @@index([startDate])
  @@index([categoryId])
  @@index([ministryId])
}

enum LocationType {
  IN_PERSON
  ONLINE
  HYBRID
}

enum EventStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  CANCELLED
  COMPLETED
  POSTPONED
}

enum EventVisibility {
  PUBLIC
  MEMBERS_ONLY
  PRIVATE
  UNLISTED
}
```

### 3.2 Event Categories & Tags

```prisma
model EventCategory {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  name            String
  slug            String
  description     String?
  color           String    @default("#3B82F6") // Tailwind blue-500
  icon            String?   // Lucide icon name
  isActive        Boolean   @default(true) @map("is_active")
  displayOrder    Int       @default(0) @map("display_order")

  // Relations
  events          Event[]

  @@unique([tenantId, slug])
  @@map("event_categories")
  @@index([tenantId, isActive])
}
```

### 3.3 Registration System

```prisma
model EventRegistration {
  id              String              @id @default(uuid())
  tenantId        String              @map("tenant_id")
  eventId         String              @map("event_id")
  event           Event               @relation(fields: [eventId], references: [id], onDelete: Cascade)

  // Registrant
  memberId        String?             @map("member_id")
  member          Member?             @relation(fields: [memberId], references: [id])

  // Guest Info (if not member)
  guestFirstName  String?             @map("guest_first_name")
  guestLastName   String?             @map("guest_last_name")
  guestEmail      String?             @map("guest_email")
  guestPhone      String?             @map("guest_phone")

  // Registration Details
  registrationType RegistrationType   @default(INDIVIDUAL) @map("registration_type")
  numAdults       Int                 @default(1) @map("num_adults")
  numChildren     Int                 @default(0) @map("num_children")
  totalGuests     Int                 @default(1) @map("total_guests")
  guestDetails    Json?               @map("guest_details")
  // [{ name, age, allergies, specialNeeds }]

  // Custom Field Responses
  customResponses Json?               @map("custom_responses")

  // Payment
  subtotal        Decimal?            @db.Decimal(10, 2)
  discount        Decimal?            @db.Decimal(10, 2)
  total           Decimal?            @db.Decimal(10, 2)
  amountPaid      Decimal             @default(0) @map("amount_paid") @db.Decimal(10, 2)
  paymentStatus   PaymentStatus       @default(NOT_REQUIRED) @map("payment_status")
  stripePaymentIntentId String?       @map("stripe_payment_intent_id")
  couponCode      String?             @map("coupon_code")

  // Status
  status          RegistrationStatus  @default(PENDING)
  source          RegistrationSource  @default(WEBSITE)
  notes           String?             @db.Text
  internalNotes   String?             @map("internal_notes") @db.Text

  // Check-in
  checkedIn       Boolean             @default(false) @map("checked_in")
  checkedInAt     DateTime?           @map("checked_in_at")
  checkedInBy     String?             @map("checked_in_by")
  checkoutTime    DateTime?           @map("checkout_time")

  // QR Code
  qrCode          String?             @unique @map("qr_code")
  confirmationCode String?            @unique @map("confirmation_code")

  // Waitlist
  isWaitlisted    Boolean             @default(false) @map("is_waitlisted")
  waitlistPosition Int?               @map("waitlist_position")
  waitlistNotified DateTime?          @map("waitlist_notified")

  // Communication
  confirmationSent Boolean            @default(false) @map("confirmation_sent")
  reminderSent    Boolean             @default(false) @map("reminder_sent")

  // Cancellation
  cancelledAt     DateTime?           @map("cancelled_at")
  cancelledBy     String?             @map("cancelled_by")
  cancellationReason String?          @map("cancellation_reason")
  refundAmount    Decimal?            @map("refund_amount") @db.Decimal(10, 2)

  // Timestamps
  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")

  @@map("event_registrations")
  @@index([tenantId])
  @@index([eventId])
  @@index([memberId])
  @@index([status])
  @@index([confirmationCode])
}

enum RegistrationType {
  INDIVIDUAL
  COUPLE
  FAMILY
  GROUP
}

enum RegistrationStatus {
  PENDING           // Awaiting approval/payment
  CONFIRMED         // Approved and confirmed
  WAITLISTED        // On waitlist
  CANCELLED         // Cancelled by user
  DECLINED          // Declined by admin
  NO_SHOW           // Did not attend
  ATTENDED          // Attended the event
}

enum RegistrationSource {
  WEBSITE
  MOBILE_APP
  ADMIN
  KIOSK
  IMPORT
}

enum PaymentStatus {
  NOT_REQUIRED
  PENDING
  PARTIAL
  PAID
  REFUNDED
  FAILED
}
```

### 3.4 Check-in System

```prisma
model Checkin {
  id              String        @id @default(uuid())
  tenantId        String        @map("tenant_id")
  eventId         String?       @map("event_id")
  event           Event?        @relation(fields: [eventId], references: [id])
  serviceId       String?       @map("service_id")
  service         Service?      @relation(fields: [serviceId], references: [id])

  // Person
  memberId        String?       @map("member_id")
  member          Member?       @relation(fields: [memberId], references: [id])
  registrationId  String?       @map("registration_id")
  guestName       String?       @map("guest_name")

  // Check-in Details
  checkinTime     DateTime      @default(now()) @map("checkin_time")
  checkoutTime    DateTime?     @map("checkout_time")
  status          CheckinStatus @default(CHECKED_IN)

  // Location
  locationId      String?       @map("location_id")
  location        Location?     @relation(fields: [locationId], references: [id])
  roomId          String?       @map("room_id")
  room            Room?         @relation(fields: [roomId], references: [id])

  // Child Safety
  securityCode    String?       @map("security_code")
  guardianId      String?       @map("guardian_id")
  guardianName    String?       @map("guardian_name")
  guardianPhone   String?       @map("guardian_phone")
  specialNeeds    String?       @map("special_needs") @db.Text
  allergies       String?       @db.Text
  authorizedPickups String[]    @map("authorized_pickups") @default([])

  // Label Printing
  labelsPrinted   Int           @default(0) @map("labels_printed")
  labelTemplate   String?       @map("label_template")

  // Method
  checkinMethod   CheckinMethod @default(MANUAL) @map("checkin_method")
  checkinStation  String?       @map("checkin_station")
  checkedInBy     String?       @map("checked_in_by")

  // Notes
  notes           String?

  // Timestamps
  createdAt       DateTime      @default(now()) @map("created_at")

  @@map("checkins")
  @@index([tenantId, checkinTime])
  @@index([eventId])
  @@index([memberId])
  @@index([securityCode])
}

enum CheckinStatus {
  CHECKED_IN
  CHECKED_OUT
  TRANSFERRED    // Moved to different room
  EMERGENCY      // Emergency pickup
  CANCELLED
}

enum CheckinMethod {
  MANUAL         // Staff checked in
  QR_CODE        // Scanned QR code
  KIOSK          // Self check-in kiosk
  MOBILE_APP     // Mobile app check-in
  PRE_CHECKIN    // Pre-checked in online
}
```

### 3.5 Volunteer Scheduling

```prisma
model EventVolunteer {
  id              String              @id @default(uuid())
  tenantId        String              @map("tenant_id")
  eventId         String              @map("event_id")
  event           Event               @relation(fields: [eventId], references: [id], onDelete: Cascade)
  memberId        String              @map("member_id")
  member          Member              @relation(fields: [memberId], references: [id])

  // Role
  roleId          String?             @map("role_id")
  role            VolunteerRole?      @relation(fields: [roleId], references: [id])
  customRole      String?             @map("custom_role")

  // Schedule
  startTime       DateTime?           @map("start_time")
  endTime         DateTime?           @map("end_time")

  // Status
  status          VolunteerStatus     @default(INVITED)
  confirmedAt     DateTime?           @map("confirmed_at")
  declinedAt      DateTime?           @map("declined_at")
  declineReason   String?             @map("decline_reason")

  // Check-in
  checkedIn       Boolean             @default(false) @map("checked_in")
  checkedInAt     DateTime?           @map("checked_in_at")
  checkedOutAt    DateTime?           @map("checked_out_at")
  hoursWorked     Decimal?            @map("hours_worked") @db.Decimal(5, 2)

  // Notes
  notes           String?

  // Timestamps
  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")

  @@unique([eventId, memberId, roleId])
  @@map("event_volunteers")
  @@index([tenantId])
  @@index([eventId])
  @@index([memberId])
}

model VolunteerRole {
  id              String            @id @default(uuid())
  tenantId        String            @map("tenant_id")
  name            String
  description     String?
  ministryId      String?           @map("ministry_id")
  ministry        Ministry?         @relation(fields: [ministryId], references: [id])
  minVolunteers   Int               @default(1) @map("min_volunteers")
  maxVolunteers   Int?              @map("max_volunteers")
  isActive        Boolean           @default(true) @map("is_active")

  // Relations
  volunteers      EventVolunteer[]

  @@unique([tenantId, name])
  @@map("volunteer_roles")
  @@index([tenantId])
}

enum VolunteerStatus {
  INVITED
  CONFIRMED
  DECLINED
  TENTATIVE
  CANCELLED
}
```

### 3.6 Event Resources & Reminders

```prisma
model EventResource {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  eventId         String    @map("event_id")
  event           Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)

  // Resource Details
  name            String
  type            ResourceType
  quantity        Int       @default(1)
  notes           String?

  // Booking
  startTime       DateTime? @map("start_time")
  endTime         DateTime? @map("end_time")
  confirmed       Boolean   @default(false)
  confirmedBy     String?   @map("confirmed_by")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")

  @@map("event_resources")
  @@index([eventId])
}

enum ResourceType {
  ROOM
  EQUIPMENT
  VEHICLE
  CATERING
  STAFF
  OTHER
}

model EventReminder {
  id              String        @id @default(uuid())
  tenantId        String        @map("tenant_id")
  eventId         String        @map("event_id")
  event           Event         @relation(fields: [eventId], references: [id], onDelete: Cascade)

  // Reminder Settings
  type            ReminderType
  timingHours     Int           @map("timing_hours") // hours before event
  channel         ReminderChannel

  // Status
  scheduledFor    DateTime      @map("scheduled_for")
  sentAt          DateTime?     @map("sent_at")
  status          ReminderStatus @default(PENDING)
  recipientCount  Int           @default(0) @map("recipient_count")

  // Template
  templateId      String?       @map("template_id")
  customMessage   String?       @map("custom_message") @db.Text

  @@map("event_reminders")
  @@index([tenantId])
  @@index([scheduledFor, status])
}

enum ReminderType {
  REGISTRATION_CONFIRMATION
  PRE_EVENT_REMINDER
  DAY_OF_REMINDER
  POST_EVENT_FOLLOWUP
  WAITLIST_NOTIFICATION
  VOLUNTEER_REMINDER
}

enum ReminderChannel {
  EMAIL
  SMS
  PUSH
  ALL
}

enum ReminderStatus {
  PENDING
  SCHEDULED
  SENT
  FAILED
  CANCELLED
}
```

---

## 4. Services Layer

### 4.1 Event Service

```typescript
// lib/services/event-service.ts
import { prisma } from '@/lib/prisma';
import { Event, EventStatus, Prisma } from '@prisma/client';
import { RRule, RRuleSet } from 'rrule';
import { generateSlug } from '@/lib/utils';

export interface EventFilters {
  search?: string;
  status?: EventStatus | EventStatus[];
  categoryId?: string;
  ministryId?: string;
  startDate?: Date;
  endDate?: Date;
  locationType?: string;
  isFeatured?: boolean;
  visibility?: string;
  tags?: string[];
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class EventService {
  constructor(private tenantId: string) {}

  async findMany(
    filters: EventFilters = {},
    pagination: PaginationOptions = {}
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'startDate',
      sortOrder = 'asc',
    } = pagination;

    const where = this.buildWhereClause(filters);

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, color: true } },
          ministry: { select: { id: true, name: true } },
          creator: { select: { id: true, firstName: true, lastName: true } },
          _count: {
            select: {
              registrations: { where: { status: 'CONFIRMED' } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private buildWhereClause(filters: EventFilters): Prisma.EventWhereInput {
    const where: Prisma.EventWhereInput = {
      tenantId: this.tenantId,
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { locationName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.ministryId) {
      where.ministryId = filters.ministryId;
    }

    if (filters.startDate || filters.endDate) {
      where.startDate = {};
      if (filters.startDate) where.startDate.gte = filters.startDate;
      if (filters.endDate) where.startDate.lte = filters.endDate;
    }

    if (filters.locationType) {
      where.locationType = filters.locationType as any;
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters.visibility) {
      where.visibility = filters.visibility as any;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    return where;
  }

  async findById(id: string) {
    return prisma.event.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        deletedAt: null,
      },
      include: {
        category: true,
        ministry: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, image: true },
        },
        room: true,
        registrations: {
          where: { status: { in: ['CONFIRMED', 'PENDING'] } },
          include: {
            member: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        volunteers: {
          include: {
            member: {
              select: { id: true, firstName: true, lastName: true, photo: true },
            },
            role: true,
          },
        },
        _count: {
          select: {
            registrations: { where: { status: 'CONFIRMED' } },
            checkins: { where: { status: 'CHECKED_IN' } },
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.event.findFirst({
      where: {
        slug,
        tenantId: this.tenantId,
        deletedAt: null,
        status: 'PUBLISHED',
      },
      include: {
        category: true,
        ministry: { select: { id: true, name: true } },
      },
    });
  }

  async create(data: Omit<Prisma.EventCreateInput, 'tenant'>) {
    // Generate slug from title
    const baseSlug = generateSlug(data.title);
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    while (await this.slugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const event = await prisma.event.create({
      data: {
        ...data,
        slug,
        tenant: { connect: { id: this.tenantId } },
        qrCode: this.generateQRCode(),
      },
    });

    // If recurring, generate child events
    if (data.isRecurring && data.recurrenceRule) {
      await this.generateRecurringInstances(event);
    }

    return event;
  }

  async update(id: string, data: Prisma.EventUpdateInput) {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Event not found');

    // Update slug if title changed
    if (data.title && data.title !== existing.title) {
      const baseSlug = generateSlug(data.title as string);
      let slug = baseSlug;
      let counter = 1;

      while (await this.slugExists(slug, id)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      data.slug = slug;
    }

    return prisma.event.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async publish(id: string) {
    return prisma.event.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  async cancel(id: string, reason?: string) {
    const event = await this.findById(id);
    if (!event) throw new Error('Event not found');

    // Cancel all registrations
    await prisma.eventRegistration.updateMany({
      where: { eventId: id, status: { in: ['CONFIRMED', 'PENDING'] } },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Event cancelled',
      },
    });

    // TODO: Send cancellation notifications

    return prisma.event.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    return prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(id: string, newStartDate: Date) {
    const original = await this.findById(id);
    if (!original) throw new Error('Event not found');

    const duration = original.endDate.getTime() - original.startDate.getTime();
    const newEndDate = new Date(newStartDate.getTime() + duration);

    const { id: _, slug: __, ...eventData } = original;

    return this.create({
      ...eventData,
      title: `${original.title} (Copy)`,
      startDate: newStartDate,
      endDate: newEndDate,
      status: 'DRAFT',
      publishedAt: null,
      currentCount: 0,
      waitlistCount: 0,
    });
  }

  async getUpcoming(limit: number = 10) {
    return prisma.event.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'PUBLISHED',
        startDate: { gte: new Date() },
        deletedAt: null,
      },
      include: {
        category: { select: { name: true, color: true } },
      },
      orderBy: { startDate: 'asc' },
      take: limit,
    });
  }

  async getCalendarEvents(startDate: Date, endDate: Date) {
    const events = await prisma.event.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'PUBLISHED',
        deletedAt: null,
        OR: [
          // Regular events within range
          {
            startDate: { gte: startDate, lte: endDate },
          },
          // Events that span the range
          {
            startDate: { lte: startDate },
            endDate: { gte: endDate },
          },
          // Events that end within range
          {
            endDate: { gte: startDate, lte: endDate },
          },
        ],
      },
      include: {
        category: { select: { name: true, color: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    // Expand recurring events
    const expandedEvents: any[] = [];

    for (const event of events) {
      if (event.isRecurring && event.recurrenceRule) {
        const instances = this.expandRecurringEvent(event, startDate, endDate);
        expandedEvents.push(...instances);
      } else {
        expandedEvents.push(event);
      }
    }

    return expandedEvents;
  }

  private expandRecurringEvent(
    event: Event & { recurrenceRule: string },
    rangeStart: Date,
    rangeEnd: Date
  ) {
    const rule = RRule.fromString(event.recurrenceRule);
    const ruleSet = new RRuleSet();
    ruleSet.rrule(rule);

    // Add exception dates
    const exceptions = event.recurrenceExceptions as Date[] || [];
    exceptions.forEach(date => ruleSet.exdate(new Date(date)));

    const occurrences = ruleSet.between(rangeStart, rangeEnd, true);
    const duration = event.endDate.getTime() - event.startDate.getTime();

    return occurrences.map(date => ({
      ...event,
      id: `${event.id}_${date.toISOString()}`,
      parentId: event.id,
      startDate: date,
      endDate: new Date(date.getTime() + duration),
      isRecurrenceInstance: true,
    }));
  }

  private async generateRecurringInstances(event: Event) {
    if (!event.recurrenceRule) return;

    const rule = RRule.fromString(event.recurrenceRule);
    const ruleSet = new RRuleSet();
    ruleSet.rrule(rule);

    // Generate instances for the next year
    const endRange = event.recurrenceEnd || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const occurrences = ruleSet.between(event.startDate, endRange, true);
    const duration = event.endDate.getTime() - event.startDate.getTime();

    // Skip the first occurrence (parent event)
    const instances = occurrences.slice(1);

    for (const date of instances) {
      await prisma.event.create({
        data: {
          tenantId: this.tenantId,
          title: event.title,
          slug: `${event.slug}-${date.toISOString().split('T')[0]}`,
          description: event.description,
          startDate: date,
          endDate: new Date(date.getTime() + duration),
          allDay: event.allDay,
          timezone: event.timezone,
          locationType: event.locationType,
          locationName: event.locationName,
          address: event.address,
          onlineUrl: event.onlineUrl,
          featuredImage: event.featuredImage,
          registrationEnabled: event.registrationEnabled,
          maxCapacity: event.maxCapacity,
          categoryId: event.categoryId,
          ministryId: event.ministryId,
          visibility: event.visibility,
          status: event.status,
          parentEventId: event.id,
        },
      });
    }
  }

  private async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.event.findFirst({
      where: {
        tenantId: this.tenantId,
        slug,
        id: excludeId ? { not: excludeId } : undefined,
        deletedAt: null,
      },
    });
    return !!existing;
  }

  private generateQRCode(): string {
    return `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
}
```

### 4.2 Registration Service

```typescript
// lib/services/registration-service.ts
import { prisma } from '@/lib/prisma';
import { RegistrationStatus, PaymentStatus, Prisma } from '@prisma/client';
import { Stripe } from 'stripe';
import { nanoid } from 'nanoid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export interface RegistrationData {
  eventId: string;
  memberId?: string;
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  guestPhone?: string;
  numAdults: number;
  numChildren: number;
  guestDetails?: { name: string; age?: number; allergies?: string }[];
  customResponses?: Record<string, any>;
  notes?: string;
}

export class RegistrationService {
  constructor(private tenantId: string) {}

  async register(data: RegistrationData) {
    const event = await prisma.event.findFirst({
      where: {
        id: data.eventId,
        tenantId: this.tenantId,
        deletedAt: null,
      },
    });

    if (!event) throw new Error('Event not found');
    if (event.status !== 'PUBLISHED') throw new Error('Event is not open for registration');

    // Check registration deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new Error('Registration deadline has passed');
    }

    // Check capacity
    const totalGuests = data.numAdults + data.numChildren;

    if (event.maxCapacity) {
      const availableSpots = event.maxCapacity - event.currentCount;

      if (totalGuests > availableSpots) {
        if (event.waitlistEnabled) {
          return this.addToWaitlist(data, event);
        }
        throw new Error('Event is at full capacity');
      }
    }

    // Check for duplicate registration
    if (data.memberId) {
      const existing = await prisma.eventRegistration.findFirst({
        where: {
          eventId: data.eventId,
          memberId: data.memberId,
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
      });

      if (existing) {
        throw new Error('You are already registered for this event');
      }
    }

    // Calculate pricing
    const pricing = this.calculatePricing(event, data);

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        tenantId: this.tenantId,
        eventId: data.eventId,
        memberId: data.memberId,
        guestFirstName: data.guestFirstName,
        guestLastName: data.guestLastName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        numAdults: data.numAdults,
        numChildren: data.numChildren,
        totalGuests,
        guestDetails: data.guestDetails,
        customResponses: data.customResponses,
        notes: data.notes,
        subtotal: pricing.subtotal,
        total: pricing.total,
        paymentStatus: event.isFree ? 'NOT_REQUIRED' : 'PENDING',
        status: event.requireApproval ? 'PENDING' : (event.isFree ? 'CONFIRMED' : 'PENDING'),
        confirmationCode: this.generateConfirmationCode(),
        qrCode: this.generateQRCode(),
        source: 'WEBSITE',
      },
    });

    // Update event count
    await prisma.event.update({
      where: { id: event.id },
      data: { currentCount: { increment: totalGuests } },
    });

    // Send confirmation email
    if (registration.status === 'CONFIRMED') {
      await this.sendConfirmationEmail(registration.id);
    }

    return registration;
  }

  private async addToWaitlist(data: RegistrationData, event: any) {
    const waitlistPosition = event.waitlistCount + 1;
    const totalGuests = data.numAdults + data.numChildren;

    const registration = await prisma.eventRegistration.create({
      data: {
        tenantId: this.tenantId,
        eventId: data.eventId,
        memberId: data.memberId,
        guestFirstName: data.guestFirstName,
        guestLastName: data.guestLastName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        numAdults: data.numAdults,
        numChildren: data.numChildren,
        totalGuests,
        guestDetails: data.guestDetails,
        customResponses: data.customResponses,
        notes: data.notes,
        status: 'WAITLISTED',
        isWaitlisted: true,
        waitlistPosition,
        confirmationCode: this.generateConfirmationCode(),
        qrCode: this.generateQRCode(),
        source: 'WEBSITE',
      },
    });

    // Update waitlist count
    await prisma.event.update({
      where: { id: event.id },
      data: { waitlistCount: { increment: 1 } },
    });

    // Send waitlist notification
    await this.sendWaitlistEmail(registration.id);

    return registration;
  }

  async processPayment(registrationId: string, paymentMethodId: string) {
    const registration = await prisma.eventRegistration.findFirst({
      where: { id: registrationId },
      include: {
        event: { include: { tenant: true } },
        member: true,
      },
    });

    if (!registration) throw new Error('Registration not found');
    if (registration.paymentStatus === 'PAID') {
      throw new Error('Registration is already paid');
    }

    const tenant = registration.event.tenant;
    const stripeAccountId = tenant.settings?.stripeAccountId;

    if (!stripeAccountId) {
      throw new Error('Payment processing not configured');
    }

    const amount = Math.round(Number(registration.total) * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        application_fee_amount: Math.round(amount * 0.02 + 25), // 2% + $0.25
        metadata: {
          registrationId,
          eventId: registration.eventId,
          tenantId: this.tenantId,
        },
      },
      { stripeAccount: stripeAccountId }
    );

    // Update registration
    await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: 'PAID',
        amountPaid: registration.total,
        stripePaymentIntentId: paymentIntent.id,
        status: 'CONFIRMED',
      },
    });

    // Send confirmation
    await this.sendConfirmationEmail(registrationId);

    return paymentIntent;
  }

  async cancel(registrationId: string, reason?: string, refund: boolean = false) {
    const registration = await prisma.eventRegistration.findFirst({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) throw new Error('Registration not found');

    // Process refund if applicable
    let refundAmount = 0;
    if (refund && registration.paymentStatus === 'PAID' && registration.stripePaymentIntentId) {
      const refundResult = await this.processRefund(registration);
      refundAmount = Number(refundResult.amount) / 100;
    }

    // Update registration
    await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
        refundAmount: refund ? refundAmount : null,
        paymentStatus: refund ? 'REFUNDED' : registration.paymentStatus,
      },
    });

    // Update event count
    await prisma.event.update({
      where: { id: registration.eventId },
      data: {
        currentCount: { decrement: registration.totalGuests },
      },
    });

    // Check waitlist and promote if applicable
    await this.promoteFromWaitlist(registration.eventId);

    // Send cancellation email
    await this.sendCancellationEmail(registrationId);

    return registration;
  }

  async checkIn(registrationId: string, staffId?: string) {
    const registration = await prisma.eventRegistration.findFirst({
      where: { id: registrationId },
    });

    if (!registration) throw new Error('Registration not found');
    if (registration.checkedIn) throw new Error('Already checked in');

    await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
        checkedInBy: staffId,
        status: 'ATTENDED',
      },
    });

    // Create checkin record
    await prisma.checkin.create({
      data: {
        tenantId: this.tenantId,
        eventId: registration.eventId,
        memberId: registration.memberId,
        registrationId: registration.id,
        guestName: registration.guestFirstName
          ? `${registration.guestFirstName} ${registration.guestLastName}`
          : undefined,
        checkinMethod: staffId ? 'MANUAL' : 'QR_CODE',
        checkedInBy: staffId,
      },
    });

    return registration;
  }

  async findByConfirmationCode(code: string) {
    return prisma.eventRegistration.findFirst({
      where: {
        confirmationCode: code,
        tenantId: this.tenantId,
      },
      include: {
        event: true,
        member: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findByQRCode(qrCode: string) {
    return prisma.eventRegistration.findFirst({
      where: {
        qrCode,
        tenantId: this.tenantId,
      },
      include: {
        event: true,
        member: true,
      },
    });
  }

  private calculatePricing(event: any, data: RegistrationData) {
    let subtotal = 0;

    if (!event.isFree && event.price) {
      // Check early bird
      const isEarlyBird = event.earlyBirdPrice &&
        event.earlyBirdDeadline &&
        new Date() < event.earlyBirdDeadline;

      const adultPrice = isEarlyBird ? event.earlyBirdPrice : event.price;
      const childPrice = event.childPrice || adultPrice;

      subtotal = (Number(adultPrice) * data.numAdults) +
                 (Number(childPrice) * data.numChildren);
    }

    return {
      subtotal,
      discount: 0,
      total: subtotal,
    };
  }

  private async promoteFromWaitlist(eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || !event.waitlistEnabled) return;

    const availableSpots = event.maxCapacity
      ? event.maxCapacity - event.currentCount
      : 0;

    if (availableSpots <= 0) return;

    // Get next in waitlist
    const nextInLine = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        status: 'WAITLISTED',
      },
      orderBy: { waitlistPosition: 'asc' },
    });

    if (nextInLine && nextInLine.totalGuests <= availableSpots) {
      await prisma.eventRegistration.update({
        where: { id: nextInLine.id },
        data: {
          status: event.isFree ? 'CONFIRMED' : 'PENDING',
          isWaitlisted: false,
          waitlistNotified: new Date(),
        },
      });

      await prisma.event.update({
        where: { id: eventId },
        data: {
          currentCount: { increment: nextInLine.totalGuests },
          waitlistCount: { decrement: 1 },
        },
      });

      // Reorder remaining waitlist
      await prisma.eventRegistration.updateMany({
        where: {
          eventId,
          status: 'WAITLISTED',
          waitlistPosition: { gt: nextInLine.waitlistPosition },
        },
        data: { waitlistPosition: { decrement: 1 } },
      });

      // Notify them
      await this.sendWaitlistPromotionEmail(nextInLine.id);
    }
  }

  private async processRefund(registration: any) {
    const stripeAccountId = registration.event.tenant.settings?.stripeAccountId;

    return stripe.refunds.create(
      { payment_intent: registration.stripePaymentIntentId },
      { stripeAccount: stripeAccountId }
    );
  }

  private generateConfirmationCode(): string {
    return `REG-${nanoid(8).toUpperCase()}`;
  }

  private generateQRCode(): string {
    return `QR-${nanoid(12).toUpperCase()}`;
  }

  private async sendConfirmationEmail(registrationId: string) {
    // Implementation - trigger email service
    console.log('Send confirmation email for:', registrationId);
  }

  private async sendWaitlistEmail(registrationId: string) {
    console.log('Send waitlist notification for:', registrationId);
  }

  private async sendWaitlistPromotionEmail(registrationId: string) {
    console.log('Send waitlist promotion notification for:', registrationId);
  }

  private async sendCancellationEmail(registrationId: string) {
    console.log('Send cancellation email for:', registrationId);
  }
}
```

### 4.3 Check-in Service

```typescript
// lib/services/checkin-service.ts
import { prisma } from '@/lib/prisma';
import { CheckinMethod, CheckinStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

export interface CheckinData {
  eventId?: string;
  serviceId?: string;
  memberId?: string;
  registrationId?: string;
  guestName?: string;
  locationId?: string;
  roomId?: string;
  guardianId?: string;
  guardianName?: string;
  guardianPhone?: string;
  specialNeeds?: string;
  allergies?: string;
  authorizedPickups?: string[];
  method?: CheckinMethod;
  stationId?: string;
  staffId?: string;
}

export class CheckinService {
  constructor(private tenantId: string) {}

  async checkIn(data: CheckinData) {
    // Generate security code for children's check-in
    let securityCode: string | undefined;
    if (data.guardianId || data.guardianName) {
      securityCode = this.generateSecurityCode();
    }

    const checkin = await prisma.checkin.create({
      data: {
        tenantId: this.tenantId,
        eventId: data.eventId,
        serviceId: data.serviceId,
        memberId: data.memberId,
        registrationId: data.registrationId,
        guestName: data.guestName,
        locationId: data.locationId,
        roomId: data.roomId,
        guardianId: data.guardianId,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        specialNeeds: data.specialNeeds,
        allergies: data.allergies,
        authorizedPickups: data.authorizedPickups || [],
        securityCode,
        checkinMethod: data.method || 'MANUAL',
        checkinStation: data.stationId,
        checkedInBy: data.staffId,
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
            dateOfBirth: true,
          },
        },
        room: true,
        location: true,
      },
    });

    // Update member's last engagement
    if (data.memberId) {
      await prisma.member.update({
        where: { id: data.memberId },
        data: { lastEngagement: new Date() },
      });
    }

    // Record attendance
    if (data.memberId && (data.eventId || data.serviceId)) {
      await prisma.attendance.create({
        data: {
          tenantId: this.tenantId,
          memberId: data.memberId,
          eventId: data.eventId,
          serviceId: data.serviceId,
          type: data.serviceId ? 'SERVICE' : 'EVENT',
          date: new Date(),
          checkInTime: new Date(),
          recordedBy: 'CHECKIN_KIOSK',
        },
      });
    }

    return checkin;
  }

  async checkOut(checkinId: string, staffId?: string) {
    const checkin = await prisma.checkin.findFirst({
      where: { id: checkinId, tenantId: this.tenantId },
    });

    if (!checkin) throw new Error('Check-in not found');
    if (checkin.status === 'CHECKED_OUT') {
      throw new Error('Already checked out');
    }

    // Verify security code for children
    // This would typically be handled separately with user input

    return prisma.checkin.update({
      where: { id: checkinId },
      data: {
        status: 'CHECKED_OUT',
        checkoutTime: new Date(),
      },
    });
  }

  async verifySecurityCode(checkinId: string, code: string) {
    const checkin = await prisma.checkin.findFirst({
      where: {
        id: checkinId,
        tenantId: this.tenantId,
        securityCode: code,
      },
    });

    if (!checkin) {
      throw new Error('Invalid security code');
    }

    return checkin;
  }

  async searchBySecurityCode(code: string) {
    return prisma.checkin.findMany({
      where: {
        tenantId: this.tenantId,
        securityCode: code,
        status: 'CHECKED_IN',
        checkinTime: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
        room: true,
        event: { select: { id: true, title: true } },
        service: { select: { id: true, name: true } },
      },
    });
  }

  async getActiveCheckins(eventId?: string, serviceId?: string) {
    const where: any = {
      tenantId: this.tenantId,
      status: 'CHECKED_IN',
    };

    if (eventId) where.eventId = eventId;
    if (serviceId) where.serviceId = serviceId;

    return prisma.checkin.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
        room: true,
      },
      orderBy: { checkinTime: 'desc' },
    });
  }

  async getStats(eventId?: string, serviceId?: string, date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const where: any = {
      tenantId: this.tenantId,
      checkinTime: { gte: startOfDay, lte: endOfDay },
    };

    if (eventId) where.eventId = eventId;
    if (serviceId) where.serviceId = serviceId;

    const [total, checkedIn, checkedOut, byRoom, byHour] = await Promise.all([
      prisma.checkin.count({ where }),
      prisma.checkin.count({ where: { ...where, status: 'CHECKED_IN' } }),
      prisma.checkin.count({ where: { ...where, status: 'CHECKED_OUT' } }),
      prisma.checkin.groupBy({
        by: ['roomId'],
        where,
        _count: { id: true },
      }),
      prisma.$queryRaw`
        SELECT
          EXTRACT(HOUR FROM checkin_time) as hour,
          COUNT(*) as count
        FROM checkins
        WHERE tenant_id = ${this.tenantId}
          AND checkin_time >= ${startOfDay}
          AND checkin_time <= ${endOfDay}
        GROUP BY EXTRACT(HOUR FROM checkin_time)
        ORDER BY hour
      `,
    ]);

    return {
      total,
      checkedIn,
      checkedOut,
      byRoom,
      byHour,
    };
  }

  async printLabel(checkinId: string) {
    const checkin = await prisma.checkin.findFirst({
      where: { id: checkinId, tenantId: this.tenantId },
      include: {
        member: true,
        room: true,
        event: true,
        service: true,
      },
    });

    if (!checkin) throw new Error('Check-in not found');

    // Generate label data
    const labelData = {
      name: checkin.member
        ? `${checkin.member.firstName} ${checkin.member.lastName}`
        : checkin.guestName,
      room: checkin.room?.name || 'Main Hall',
      time: checkin.checkinTime.toLocaleTimeString(),
      securityCode: checkin.securityCode,
      allergies: checkin.allergies,
      specialNeeds: checkin.specialNeeds,
    };

    // Update labels printed count
    await prisma.checkin.update({
      where: { id: checkinId },
      data: { labelsPrinted: { increment: 1 } },
    });

    return labelData;
  }

  private generateSecurityCode(): string {
    // Generate a memorable 4-character code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
```

---

## 5. API Endpoints

### 5.1 Events API

```typescript
// app/api/admin/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EventService } from '@/lib/services/event-service';
import { eventSchema } from '@/lib/validations/event';

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
      categoryId: searchParams.get('categoryId') || undefined,
      ministryId: searchParams.get('ministryId') || undefined,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined,
    };

    const pagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'startDate',
      sortOrder: (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc',
    };

    const service = new EventService(session.user.tenantId);
    const result = await service.findMany(filters, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = eventSchema.parse(body);

    const service = new EventService(session.user.tenantId);
    const event = await service.create({
      ...validatedData,
      creator: { connect: { id: session.user.id } },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
```

### 5.2 Registration API

```typescript
// app/api/events/[id]/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerTenant } from '@/lib/tenant/server-context';
import { RegistrationService } from '@/lib/services/registration-service';
import { registrationSchema } from '@/lib/validations/registration';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getServerTenant();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = registrationSchema.parse({
      ...body,
      eventId: params.id,
    });

    const service = new RegistrationService(tenant.id);
    const registration = await service.register(validatedData);

    return NextResponse.json(registration, { status: 201 });
  } catch (error: any) {
    console.error('Error registering:', error);

    if (error.message === 'Event is at full capacity') {
      return NextResponse.json(
        { error: error.message, code: 'FULL_CAPACITY' },
        { status: 409 }
      );
    }

    if (error.message === 'Registration deadline has passed') {
      return NextResponse.json(
        { error: error.message, code: 'DEADLINE_PASSED' },
        { status: 400 }
      );
    }

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    );
  }
}
```

### 5.3 Calendar Export API

```typescript
// app/api/events/calendar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerTenant } from '@/lib/tenant/server-context';
import { EventService } from '@/lib/services/event-service';
import ical, { ICalCalendarMethod } from 'ical-generator';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getServerTenant();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'ical';

    // Get next 6 months of events
    const startDate = new Date();
    const endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    const service = new EventService(tenant.id);
    const events = await service.getCalendarEvents(startDate, endDate);

    if (format === 'json') {
      return NextResponse.json(events);
    }

    // Generate iCal
    const calendar = ical({
      name: `${tenant.name} Events`,
      timezone: tenant.timezone || 'America/Chicago',
      method: ICalCalendarMethod.PUBLISH,
    });

    for (const event of events) {
      calendar.createEvent({
        id: event.id,
        start: event.startDate,
        end: event.endDate,
        summary: event.title,
        description: event.shortDescription || event.description,
        location: event.locationName || event.address,
        url: `https://${tenant.subdomain}.digitalchurch.com/events/${event.slug}`,
        allDay: event.allDay,
      });
    }

    return new NextResponse(calendar.toString(), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${tenant.subdomain}-events.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating calendar:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar' },
      { status: 500 }
    );
  }
}
```

### 5.4 Check-in API

```typescript
// app/api/admin/checkin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CheckinService } from '@/lib/services/checkin-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const service = new CheckinService(session.user.tenantId);

    const checkin = await service.checkIn({
      ...body,
      staffId: session.user.id,
    });

    return NextResponse.json(checkin, { status: 201 });
  } catch (error: any) {
    console.error('Error checking in:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check in' },
      { status: 500 }
    );
  }
}

// QR Code scan endpoint
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { qrCode, action } = body;

    const service = new CheckinService(session.user.tenantId);

    if (action === 'lookup') {
      // Find registration by QR code
      const registration = await prisma.eventRegistration.findFirst({
        where: {
          qrCode,
          tenantId: session.user.tenantId,
        },
        include: {
          event: true,
          member: true,
        },
      });

      if (!registration) {
        return NextResponse.json(
          { error: 'Invalid QR code' },
          { status: 404 }
        );
      }

      return NextResponse.json(registration);
    }

    if (action === 'checkin') {
      const registration = await prisma.eventRegistration.findFirst({
        where: { qrCode, tenantId: session.user.tenantId },
      });

      if (!registration) {
        return NextResponse.json(
          { error: 'Invalid QR code' },
          { status: 404 }
        );
      }

      const checkin = await service.checkIn({
        eventId: registration.eventId,
        memberId: registration.memberId || undefined,
        registrationId: registration.id,
        guestName: registration.guestFirstName
          ? `${registration.guestFirstName} ${registration.guestLastName}`
          : undefined,
        method: 'QR_CODE',
        staffId: session.user.id,
      });

      return NextResponse.json(checkin);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error processing QR code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process QR code' },
      { status: 500 }
    );
  }
}
```

---

## 6. Admin Components

### 6.1 Event Form Component

```typescript
// components/admin/events/EventForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, Video, Globe, Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { TimePicker } from '@/components/ui/time-picker';
import { RecurrenceBuilder } from './RecurrenceBuilder';
import { CustomFieldsBuilder } from './CustomFieldsBuilder';
import { cn } from '@/lib/utils';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  startDate: z.date(),
  startTime: z.string().optional(),
  endDate: z.date(),
  endTime: z.string().optional(),
  allDay: z.boolean().default(false),
  timezone: z.string().default('America/Chicago'),
  locationType: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']),
  locationName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  onlineUrl: z.string().url().optional().or(z.literal('')),
  onlinePlatform: z.string().optional(),
  featuredImage: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  recurrenceEnd: z.date().optional(),
  registrationEnabled: z.boolean().default(false),
  maxCapacity: z.number().positive().optional(),
  waitlistEnabled: z.boolean().default(false),
  registrationDeadline: z.date().optional(),
  isFree: z.boolean().default(true),
  price: z.number().positive().optional(),
  earlyBirdPrice: z.number().positive().optional(),
  earlyBirdDeadline: z.date().optional(),
  checkinEnabled: z.boolean().default(false),
  categoryId: z.string().optional(),
  ministryId: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'MEMBERS_ONLY', 'PRIVATE', 'UNLISTED']).default('PUBLIC'),
  isFeatured: z.boolean().default(false),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  customFields: z.array(z.any()).optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: Partial<EventFormData>;
  categories: { id: string; name: string }[];
  ministries: { id: string; name: string }[];
  onSubmit: (data: EventFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EventForm({
  event,
  categories,
  ministries,
  onSubmit,
  isSubmitting,
}: EventFormProps) {
  const [activeTab, setActiveTab] = useState('basic');

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      locationType: 'IN_PERSON',
      visibility: 'PUBLIC',
      isFree: true,
      allDay: false,
      isRecurring: false,
      registrationEnabled: false,
      waitlistEnabled: false,
      checkinEnabled: false,
      isFeatured: false,
      timezone: 'America/Chicago',
      ...event,
    },
  });

  const watchLocationType = form.watch('locationType');
  const watchAllDay = form.watch('allDay');
  const watchIsFree = form.watch('isFree');
  const watchIsRecurring = form.watch('isRecurring');
  const watchRegistrationEnabled = form.watch('registrationEnabled');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="datetime">Date & Time</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter event title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Brief description for listings"
                          rows={2}
                        />
                      </FormControl>
                      <FormDescription>
                        Max 300 characters. Used in event listings.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Description</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Enter full event description..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featuredImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Featured Image</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          aspectRatio={16 / 9}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ministryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ministry</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ministry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ministries.map(min => (
                              <SelectItem key={min.id} value={min.id}>
                                {min.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Date & Time Tab */}
          <TabsContent value="datetime" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="allDay"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>All Day Event</FormLabel>
                        <FormDescription>
                          Event spans the entire day
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!watchAllDay && (
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <TimePicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!watchAllDay && (
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <TimePicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Recurring Event</FormLabel>
                        <FormDescription>
                          Event repeats on a schedule
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

                {watchIsRecurring && (
                  <RecurrenceBuilder
                    value={form.watch('recurrenceRule')}
                    endDate={form.watch('recurrenceEnd')}
                    onChange={(rule, end) => {
                      form.setValue('recurrenceRule', rule);
                      form.setValue('recurrenceEnd', end);
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="locationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="IN_PERSON">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              In Person
                            </div>
                          </SelectItem>
                          <SelectItem value="ONLINE">
                            <div className="flex items-center">
                              <Video className="h-4 w-4 mr-2" />
                              Online
                            </div>
                          </SelectItem>
                          <SelectItem value="HYBRID">
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              Hybrid
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {(watchLocationType === 'IN_PERSON' || watchLocationType === 'HYBRID') && (
                  <>
                    <FormField
                      control={form.control}
                      name="locationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Main Sanctuary" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {(watchLocationType === 'ONLINE' || watchLocationType === 'HYBRID') && (
                  <>
                    <FormField
                      control={form.control}
                      name="onlinePlatform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Online Platform</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="zoom">Zoom</SelectItem>
                              <SelectItem value="youtube">YouTube Live</SelectItem>
                              <SelectItem value="facebook">Facebook Live</SelectItem>
                              <SelectItem value="teams">Microsoft Teams</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="onlineUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Online URL</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" placeholder="https://..." />
                          </FormControl>
                          <FormDescription>
                            Link will be shared with registered attendees
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registration Tab */}
          <TabsContent value="registration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registration Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="registrationEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Enable Registration</FormLabel>
                        <FormDescription>
                          Allow people to register online
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

                {watchRegistrationEnabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="maxCapacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Capacity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormDescription>
                              Leave empty for unlimited
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="registrationDeadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration Deadline</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP')
                                    ) : (
                                      <span>No deadline</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="waitlistEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Enable Waitlist</FormLabel>
                            <FormDescription>
                              Accept registrations after capacity is reached
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
                      name="isFree"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Free Event</FormLabel>
                            <FormDescription>
                              No registration fee required
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

                    {!watchIsFree && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Registration Fee</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="earlyBirdPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Early Bird Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="checkinEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Enable Check-in</FormLabel>
                            <FormDescription>
                              Track attendance with QR codes
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
                  </>
                )}
              </CardContent>
            </Card>

            {watchRegistrationEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Registration Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="customFields"
                    render={({ field }) => (
                      <CustomFieldsBuilder
                        value={field.value || []}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visibility & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PUBLIC">Public</SelectItem>
                          <SelectItem value="MEMBERS_ONLY">Members Only</SelectItem>
                          <SelectItem value="PRIVATE">Private</SelectItem>
                          <SelectItem value="UNLISTED">Unlisted</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Featured Event</FormLabel>
                        <FormDescription>
                          Highlight on homepage and in listings
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Save as Draft
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {event ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 7. Public Event Page

```typescript
// app/(tenant)/events/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getServerTenant } from '@/lib/tenant/server-context';
import { EventService } from '@/lib/services/event-service';
import { EventHeader } from '@/components/public/events/EventHeader';
import { EventDetails } from '@/components/public/events/EventDetails';
import { EventRegistrationForm } from '@/components/public/events/EventRegistrationForm';
import { EventLocation } from '@/components/public/events/EventLocation';
import { RelatedEvents } from '@/components/public/events/RelatedEvents';

interface PageProps {
  params: { slug: string };
}

export default async function EventPage({ params }: PageProps) {
  const tenant = await getServerTenant();
  if (!tenant) return null;

  const service = new EventService(tenant.id);
  const event = await service.findBySlug(params.slug);

  if (!event) {
    notFound();
  }

  const spotsRemaining = event.maxCapacity
    ? event.maxCapacity - event.currentCount
    : null;

  const registrationOpen = event.registrationEnabled &&
    event.status === 'PUBLISHED' &&
    (!event.registrationDeadline || new Date() < event.registrationDeadline) &&
    (spotsRemaining === null || spotsRemaining > 0 || event.waitlistEnabled);

  return (
    <div className="min-h-screen">
      <EventHeader event={event} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <EventDetails event={event} />

            {event.locationType !== 'ONLINE' && (
              <EventLocation event={event} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              {event.registrationEnabled ? (
                <>
                  {/* Status Badge */}
                  {spotsRemaining !== null && (
                    <div className="mb-4">
                      {spotsRemaining > 0 ? (
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-green-600">
                            {spotsRemaining}
                          </span>{' '}
                          spots remaining
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-orange-600">
                          {event.waitlistEnabled
                            ? 'Event full - Join waitlist'
                            : 'Event full'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pricing */}
                  {!event.isFree && event.price && (
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-gray-900">
                        ${Number(event.price).toFixed(2)}
                      </p>
                      {event.earlyBirdPrice &&
                        event.earlyBirdDeadline &&
                        new Date() < event.earlyBirdDeadline && (
                          <p className="text-sm text-green-600">
                            Early bird: ${Number(event.earlyBirdPrice).toFixed(2)}
                          </p>
                        )}
                    </div>
                  )}

                  {registrationOpen ? (
                    <EventRegistrationForm
                      event={event}
                      isWaitlist={spotsRemaining !== null && spotsRemaining <= 0}
                    />
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      Registration is closed
                    </p>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No registration required
                </p>
              )}

              {/* Add to Calendar */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Add to calendar</p>
                <div className="flex gap-2">
                  <a
                    href={`/api/events/${event.id}/calendar?format=ical`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    iCal
                  </a>
                  <span className="text-gray-400">|</span>
                  <a
                    href={`/api/events/${event.id}/calendar?format=google`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Google
                  </a>
                  <span className="text-gray-400">|</span>
                  <a
                    href={`/api/events/${event.id}/calendar?format=outlook`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Outlook
                  </a>
                </div>
              </div>

              {/* Contact */}
              {event.contactEmail && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">Questions?</p>
                  <a
                    href={`mailto:${event.contactEmail}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Contact the organizer
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Events */}
        <RelatedEvents
          currentEventId={event.id}
          categoryId={event.categoryId}
          ministryId={event.ministryId}
        />
      </div>
    </div>
  );
}
```

---

## 8. Best Practices

### Event Management
1. **Slug Generation**: Auto-generate URL-friendly slugs from titles
2. **Status Workflow**: DRAFT → SCHEDULED → PUBLISHED → COMPLETED
3. **Recurring Events**: Use RRULE for flexible repeat patterns
4. **Capacity Planning**: Real-time tracking with waitlist support

### Registration
1. **Guest Support**: Allow non-members to register
2. **Custom Fields**: Collect event-specific information
3. **Payment Security**: PCI-compliant Stripe integration
4. **Confirmation Codes**: Unique codes for easy lookup

### Check-in
1. **QR Codes**: Generate unique codes per registration
2. **Child Safety**: Security codes and authorized pickups
3. **Offline Mode**: Queue check-ins when offline
4. **Label Printing**: Name tags and security labels

### Performance
1. **Caching**: Cache event data with short TTL
2. **Pagination**: Paginate event lists and attendee lists
3. **Lazy Loading**: Load registration form on demand
4. **Image Optimization**: Responsive images for event cards

---

**Document Version**: 1.0
**Last Updated**: December 2024
**Maintained By**: Digital Church Platform Team
