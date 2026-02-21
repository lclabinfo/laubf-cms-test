# 11. Member Management System

## People Database & Congregation Management

---

## 1. Overview

### Purpose
The Member Management System serves as the central hub for tracking and nurturing the church congregation, from first-time visitors to long-standing members. It provides comprehensive tools for managing personal information, family relationships, attendance, pastoral care, and engagement analytics.

### Competitive Analysis

| Feature | Planning Center | Breeze | Church Community Builder | **Digital Church Platform** |
|---------|----------------|--------|--------------------------|----------------------------|
| Member Profiles | Good | Basic | Excellent | **Excellent** |
| Family Management | Good | Basic | Excellent | **Excellent** |
| Custom Fields | Limited | Basic | Advanced | **Unlimited** |
| Visitor Follow-up | Manual | Basic | Good | **Automated Workflows** |
| Attendance Tracking | Good | Basic | Excellent | **Multi-method** |
| Directory | Basic | Good | Good | **Customizable Privacy** |
| Mobile Check-in | Premium | Basic | Premium | **Included** |
| Import/Export | CSV | CSV | CSV/API | **CSV/API/Integration** |
| API Access | Premium | None | Premium | **Included** |

### Key Differentiators

1. **Unified People Database**: Single source of truth for all congregation data
2. **Smart Visitor Workflows**: Automated follow-up sequences and connection paths
3. **Family-Centric Design**: Household management with shared information
4. **Privacy Controls**: Member-controlled visibility in directories
5. **Real-time Analytics**: Engagement scoring and attendance trends
6. **Pastoral Dashboard**: Staff notes, care requests, and follow-up tracking

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Member Management System                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   People     │  │   Family     │  │   Visitor            │  │
│  │   Database   │  │   Management │  │   Pipeline           │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────────────┤  │
│  │ • Profiles   │  │ • Households │  │ • First-time guests  │  │
│  │ • Contact    │  │ • Relations  │  │ • Follow-up workflow │  │
│  │ • Custom     │  │ • Shared     │  │ • Connection steps   │  │
│  │   fields     │  │   address    │  │ • Assimilation track │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Attendance  │  │   Pastoral   │  │   Directory          │  │
│  │  Tracking    │  │   Care       │  │   & Search           │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────────────┤  │
│  │ • Services   │  │ • Staff notes│  │ • Public directory   │  │
│  │ • Events     │  │ • Care req.  │  │ • Privacy controls   │  │
│  │ • Groups     │  │ • Follow-ups │  │ • Advanced search    │  │
│  │ • Check-in   │  │ • Prayer req │  │ • Filters & tags     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Analytics Dashboard                    │    │
│  │  • Engagement scores  • Attendance trends  • Growth      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Core Member Model

```prisma
// =====================================================
// MEMBER MANAGEMENT SCHEMA
// =====================================================

model Member {
  id              String       @id @default(uuid())
  tenantId        String       @map("tenant_id")
  tenant          Tenant       @relation(fields: [tenantId], references: [id])
  userId          String?      @unique @map("user_id")
  user            User?        @relation(fields: [userId], references: [id])

  // Personal Information
  firstName       String       @map("first_name")
  middleName      String?      @map("middle_name")
  lastName        String       @map("last_name")
  preferredName   String?      @map("preferred_name")
  email           String?
  phone           String?
  mobilePhone     String?      @map("mobile_phone")
  workPhone       String?      @map("work_phone")
  dateOfBirth     DateTime?    @map("date_of_birth")
  gender          Gender?
  maritalStatus   MaritalStatus? @map("marital_status")

  // Profile
  photo           String?
  bio             String?      @db.Text
  occupation      String?
  employer        String?

  // Address
  address         String?      @db.Text
  address2        String?
  city            String?
  state           String?
  zipCode         String?      @map("zip_code")
  country         String?      @default("US")
  latitude        Float?
  longitude       Float?

  // Church Status
  status          MemberStatus @default(VISITOR)
  memberSince     DateTime?    @map("member_since")
  memberNumber    String?      @unique @map("member_number")
  baptismDate     DateTime?    @map("baptism_date")
  salvationDate   DateTime?    @map("salvation_date")
  weddingDate     DateTime?    @map("wedding_date")
  joinedHow       JoinedHow?   @map("joined_how")
  previousChurch  String?      @map("previous_church")

  // Family
  familyId        String?      @map("family_id")
  family          Family?      @relation(fields: [familyId], references: [id])
  familyRole      FamilyRole?  @map("family_role")
  familyPosition  Int          @default(0) @map("family_position")

  // Emergency Contact
  emergencyName     String?    @map("emergency_name")
  emergencyPhone    String?    @map("emergency_phone")
  emergencyRelation String?    @map("emergency_relation")

  // Communication Preferences
  emailOptIn      Boolean      @default(true) @map("email_opt_in")
  smsOptIn        Boolean      @default(false) @map("sms_opt_in")
  pushOptIn       Boolean      @default(true) @map("push_opt_in")
  mailOptIn       Boolean      @default(true) @map("mail_opt_in")

  // Directory Settings
  showInDirectory Boolean      @default(true) @map("show_in_directory")
  showEmail       Boolean      @default(false) @map("show_email")
  showPhone       Boolean      @default(false) @map("show_phone")
  showAddress     Boolean      @default(false) @map("show_address")
  showBirthday    Boolean      @default(true) @map("show_birthday")
  showPhoto       Boolean      @default(true) @map("show_photo")

  // Tags & Custom Fields
  tags            String[]     @default([])
  customFields    Json?        @map("custom_fields")

  // Engagement Metrics
  engagementScore Int          @default(0) @map("engagement_score")
  lastEngagement  DateTime?    @map("last_engagement")
  totalGiving     Decimal      @default(0) @map("total_giving") @db.Decimal(10, 2)

  // Source & Tracking
  source          MemberSource?
  sourceDetails   String?      @map("source_details")
  referredBy      String?      @map("referred_by")
  firstVisitDate  DateTime?    @map("first_visit_date")

  // Timestamps
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")
  deletedAt       DateTime?    @map("deleted_at")
  createdBy       String?      @map("created_by")
  updatedBy       String?      @map("updated_by")

  // Relations
  donations            Donation[]
  eventRegistrations   EventRegistration[]
  groupMemberships     GroupMembership[]
  ministryAssignments  MinistryMember[]
  attendances          Attendance[]
  checkins             Checkin[]
  pastoralNotes        PastoralNote[]
  careRequests         CareRequest[]
  followUps            FollowUp[]
  communications       CommunicationRecipient[]
  prayerRequests       PrayerRequest[]
  skills               MemberSkill[]
  relationshipsFrom    MemberRelationship[] @relation("RelationshipFrom")
  relationshipsTo      MemberRelationship[] @relation("RelationshipTo")

  @@unique([tenantId, email])
  @@unique([tenantId, memberNumber])
  @@map("members")
  @@index([tenantId])
  @@index([tenantId, status])
  @@index([lastName, firstName])
  @@index([familyId])
  @@index([engagementScore])
  @@index([tags])
}

enum MemberStatus {
  VISITOR          // First-time or occasional visitor
  REGULAR_ATTENDER // Regular attender, not member
  MEMBER           // Official church member
  ACTIVE           // Active participant
  INACTIVE         // Inactive member
  TRANSFERRED      // Transferred to another church
  DECEASED         // Deceased
  REMOVED          // Removed from rolls
}

enum MaritalStatus {
  SINGLE
  MARRIED
  DIVORCED
  WIDOWED
  SEPARATED
  ENGAGED
}

enum JoinedHow {
  BAPTISM
  TRANSFER
  STATEMENT_OF_FAITH
  REAFFIRMATION
  BORN_INTO
}

enum MemberSource {
  WALK_IN
  WEBSITE
  EVENT
  REFERRAL
  SOCIAL_MEDIA
  OUTREACH
  ONLINE_SERVICE
  OTHER
}

enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}

enum FamilyRole {
  HEAD
  SPOUSE
  CHILD
  PARENT
  GRANDPARENT
  SIBLING
  RELATIVE
  OTHER
}
```

### 3.2 Family & Relationships

```prisma
model Family {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  name            String    // e.g., "Smith Family"

  // Primary Contact Address
  address         String?   @db.Text
  address2        String?
  city            String?
  state           String?
  zipCode         String?   @map("zip_code")
  country         String?   @default("US")

  // Primary Contact Info
  phone           String?
  email           String?

  // Photo
  photo           String?

  // Anniversary
  anniversaryDate DateTime? @map("anniversary_date")

  // Custom Fields
  customFields    Json?     @map("custom_fields")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  // Relations
  members         Member[]

  @@map("families")
  @@index([tenantId])
  @@index([name])
}

// Additional relationships beyond family
model MemberRelationship {
  id              String           @id @default(uuid())
  tenantId        String           @map("tenant_id")

  fromMemberId    String           @map("from_member_id")
  fromMember      Member           @relation("RelationshipFrom", fields: [fromMemberId], references: [id], onDelete: Cascade)

  toMemberId      String           @map("to_member_id")
  toMember        Member           @relation("RelationshipTo", fields: [toMemberId], references: [id], onDelete: Cascade)

  type            RelationshipType
  notes           String?

  createdAt       DateTime         @default(now()) @map("created_at")

  @@unique([fromMemberId, toMemberId, type])
  @@map("member_relationships")
  @@index([tenantId])
}

enum RelationshipType {
  SPOUSE
  PARENT
  CHILD
  SIBLING
  GRANDPARENT
  GRANDCHILD
  MENTOR
  MENTEE
  ACCOUNTABILITY_PARTNER
  SMALL_GROUP_LEADER
  FRIEND
  ROOMMATE
  CAREGIVER
  OTHER
}
```

### 3.3 Attendance Tracking

```prisma
model Attendance {
  id              String           @id @default(uuid())
  tenantId        String           @map("tenant_id")
  memberId        String           @map("member_id")
  member          Member           @relation(fields: [memberId], references: [id], onDelete: Cascade)

  // What they attended
  type            AttendanceType
  eventId         String?          @map("event_id")
  event           Event?           @relation(fields: [eventId], references: [id])
  serviceId       String?          @map("service_id")
  service         Service?         @relation(fields: [serviceId], references: [id])
  groupId         String?          @map("group_id")
  group           Group?           @relation(fields: [groupId], references: [id])

  // When
  date            DateTime         @db.Date
  checkInTime     DateTime?        @map("check_in_time")
  checkOutTime    DateTime?        @map("check_out_time")

  // How recorded
  recordedBy      RecordedBy       @default(MANUAL) @map("recorded_by")
  recordedById    String?          @map("recorded_by_id")

  // Notes
  notes           String?

  // Timestamps
  createdAt       DateTime         @default(now()) @map("created_at")

  @@unique([memberId, type, date, serviceId])
  @@map("attendances")
  @@index([tenantId, date])
  @@index([memberId])
  @@index([type, date])
}

enum AttendanceType {
  SERVICE         // Sunday/Weekend service
  MIDWEEK         // Midweek service
  SMALL_GROUP     // Small group meeting
  EVENT           // Special event
  CLASS           // Class or training
  VOLUNTEER       // Volunteer service
  OTHER
}

enum RecordedBy {
  MANUAL          // Staff entered manually
  CHECKIN_KIOSK   // Self check-in kiosk
  MOBILE_APP      // Mobile app check-in
  QR_CODE         // QR code scan
  IMPORT          // Bulk import
  AUTOMATED       // Automated detection
}

model Service {
  id              String       @id @default(uuid())
  tenantId        String       @map("tenant_id")
  name            String       // e.g., "Sunday 9:00 AM"
  dayOfWeek       Int          @map("day_of_week") // 0=Sunday, 6=Saturday
  startTime       String       @map("start_time") // "09:00"
  endTime         String?      @map("end_time")   // "10:30"
  capacity        Int?
  isActive        Boolean      @default(true) @map("is_active")

  // Timestamps
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")
  deletedAt       DateTime?    @map("deleted_at")

  // Relations
  attendances     Attendance[]
  checkins        Checkin[]

  @@map("services")
  @@index([tenantId])
}
```

### 3.4 Check-in System

```prisma
model Checkin {
  id              String       @id @default(uuid())
  tenantId        String       @map("tenant_id")
  memberId        String       @map("member_id")
  member          Member       @relation(fields: [memberId], references: [id], onDelete: Cascade)

  // Event/Service
  eventId         String?      @map("event_id")
  event           Event?       @relation(fields: [eventId], references: [id])
  serviceId       String?      @map("service_id")
  service         Service?     @relation(fields: [serviceId], references: [id])

  // Check-in Details
  checkinTime     DateTime     @default(now()) @map("checkin_time")
  checkoutTime    DateTime?    @map("checkout_time")

  // Location/Room
  locationId      String?      @map("location_id")
  location        Location?    @relation(fields: [locationId], references: [id])
  roomId          String?      @map("room_id")
  room            Room?        @relation(fields: [roomId], references: [id])

  // Security (for children's check-in)
  securityCode    String?      @map("security_code")
  guardianId      String?      @map("guardian_id")
  guardianName    String?      @map("guardian_name")

  // Labels printed
  labelsPrinted   Int          @default(0) @map("labels_printed")

  // Special needs/allergies noted
  specialNotes    String?      @map("special_notes")

  // Kiosk/Station
  stationId       String?      @map("station_id")

  // Status
  status          CheckinStatus @default(CHECKED_IN)

  // Timestamps
  createdAt       DateTime     @default(now()) @map("created_at")

  @@map("checkins")
  @@index([tenantId, checkinTime])
  @@index([memberId])
  @@index([securityCode])
}

enum CheckinStatus {
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
}

model Location {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  name            String
  description     String?
  address         String?   @db.Text

  // Relations
  rooms           Room[]
  checkins        Checkin[]

  @@map("locations")
  @@index([tenantId])
}

model Room {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  locationId      String    @map("location_id")
  location        Location  @relation(fields: [locationId], references: [id], onDelete: Cascade)

  name            String    // e.g., "Nursery A", "Room 101"
  capacity        Int?
  ageMin          Int?      @map("age_min") // For children's ministry
  ageMax          Int?      @map("age_max")

  // Relations
  checkins        Checkin[]

  @@map("rooms")
  @@index([tenantId])
  @@index([locationId])
}
```

### 3.5 Pastoral Care

```prisma
model PastoralNote {
  id              String           @id @default(uuid())
  tenantId        String           @map("tenant_id")
  memberId        String           @map("member_id")
  member          Member           @relation(fields: [memberId], references: [id], onDelete: Cascade)

  // Note Content
  type            PastoralNoteType
  title           String?
  content         String           @db.Text

  // Visibility
  isPrivate       Boolean          @default(true) @map("is_private")
  visibleToRoles  String[]         @default(["ADMIN", "PASTOR"]) @map("visible_to_roles")

  // Author
  authorId        String           @map("author_id")

  // Timestamps
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  deletedAt       DateTime?        @map("deleted_at")

  @@map("pastoral_notes")
  @@index([tenantId, memberId])
  @@index([type])
}

enum PastoralNoteType {
  GENERAL
  COUNSELING
  VISIT
  PHONE_CALL
  PRAYER
  MILESTONE
  CONCERN
  CELEBRATION
  HOSPITAL
  FOLLOW_UP
}

model CareRequest {
  id              String           @id @default(uuid())
  tenantId        String           @map("tenant_id")
  memberId        String?          @map("member_id")
  member          Member?          @relation(fields: [memberId], references: [id])

  // Request Details
  type            CareRequestType
  subject         String
  description     String           @db.Text

  // Requester (may be different from member)
  requesterName   String?          @map("requester_name")
  requesterEmail  String?          @map("requester_email")
  requesterPhone  String?          @map("requester_phone")

  // Assignment
  assignedToId    String?          @map("assigned_to_id")
  assignedAt      DateTime?        @map("assigned_at")

  // Status
  status          CareRequestStatus @default(NEW)
  priority        Priority         @default(NORMAL)

  // Response
  response        String?          @db.Text
  respondedAt     DateTime?        @map("responded_at")

  // Timestamps
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  completedAt     DateTime?        @map("completed_at")

  @@map("care_requests")
  @@index([tenantId, status])
  @@index([assignedToId])
}

enum CareRequestType {
  PRAYER
  COUNSELING
  HOSPITAL_VISIT
  HOME_VISIT
  MEAL_TRAIN
  FINANCIAL_ASSISTANCE
  BENEVOLENCE
  GRIEF_SUPPORT
  MARRIAGE_COUNSELING
  FAMILY_CRISIS
  OTHER
}

enum CareRequestStatus {
  NEW
  ASSIGNED
  IN_PROGRESS
  FOLLOW_UP
  COMPLETED
  CLOSED
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model PrayerRequest {
  id              String           @id @default(uuid())
  tenantId        String           @map("tenant_id")
  memberId        String?          @map("member_id")
  member          Member?          @relation(fields: [memberId], references: [id])

  // Request
  title           String
  content         String           @db.Text
  isAnonymous     Boolean          @default(false) @map("is_anonymous")
  isPublic        Boolean          @default(false) @map("is_public")

  // Status
  status          PrayerRequestStatus @default(ACTIVE)
  prayerCount     Int              @default(0) @map("prayer_count")

  // Response
  answerUpdate    String?          @db.Text @map("answer_update")
  answeredAt      DateTime?        @map("answered_at")

  // Timestamps
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  expiresAt       DateTime?        @map("expires_at")

  @@map("prayer_requests")
  @@index([tenantId, status])
  @@index([memberId])
}

enum PrayerRequestStatus {
  ACTIVE
  ANSWERED
  CLOSED
  EXPIRED
}
```

### 3.6 Visitor Follow-up Pipeline

```prisma
model FollowUp {
  id              String           @id @default(uuid())
  tenantId        String           @map("tenant_id")
  memberId        String           @map("member_id")
  member          Member           @relation(fields: [memberId], references: [id], onDelete: Cascade)

  // Follow-up Details
  type            FollowUpType
  step            Int              @default(1) // Workflow step number

  // Assignment
  assignedToId    String?          @map("assigned_to_id")
  teamId          String?          @map("team_id")

  // Scheduling
  dueDate         DateTime         @map("due_date")
  scheduledFor    DateTime?        @map("scheduled_for")

  // Status
  status          FollowUpStatus   @default(PENDING)

  // Communication
  method          CommunicationMethod?
  notes           String?          @db.Text
  outcome         String?          @db.Text

  // Timestamps
  createdAt       DateTime         @default(now()) @map("created_at")
  completedAt     DateTime?        @map("completed_at")

  @@map("follow_ups")
  @@index([tenantId, status, dueDate])
  @@index([memberId])
  @@index([assignedToId])
}

enum FollowUpType {
  FIRST_TIME_VISITOR
  SECOND_VISIT
  THIRD_VISIT
  NEWCOMER_CLASS
  MEMBERSHIP_INTEREST
  BAPTISM_INTEREST
  GROUP_INTEREST
  VOLUNTEER_INTEREST
  GENERAL
}

enum FollowUpStatus {
  PENDING
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  SKIPPED
  NO_RESPONSE
}

enum CommunicationMethod {
  EMAIL
  PHONE
  TEXT
  IN_PERSON
  VIDEO_CALL
  MAIL
}

model VisitorWorkflow {
  id              String           @id @default(uuid())
  tenantId        String           @map("tenant_id")
  name            String           // e.g., "First Time Visitor"
  description     String?
  isActive        Boolean          @default(true) @map("is_active")

  // Trigger
  triggerType     WorkflowTrigger  @map("trigger_type")
  triggerCondition Json?           @map("trigger_condition")

  // Steps
  steps           Json             // Array of workflow steps

  // Timestamps
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")

  @@map("visitor_workflows")
  @@index([tenantId, isActive])
}

enum WorkflowTrigger {
  FIRST_VISIT
  SECOND_VISIT
  STATUS_CHANGE
  TAG_ADDED
  EVENT_REGISTRATION
  GROUP_JOIN
  MANUAL
}
```

### 3.7 Skills & Interests

```prisma
model MemberSkill {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  memberId        String    @map("member_id")
  member          Member    @relation(fields: [memberId], references: [id], onDelete: Cascade)
  skillId         String    @map("skill_id")
  skill           Skill     @relation(fields: [skillId], references: [id])

  level           SkillLevel @default(BEGINNER)
  yearsExperience Int?       @map("years_experience")
  willingToServe  Boolean    @default(true) @map("willing_to_serve")
  willingToTeach  Boolean    @default(false) @map("willing_to_teach")
  notes           String?

  @@unique([memberId, skillId])
  @@map("member_skills")
  @@index([tenantId])
  @@index([skillId])
}

model Skill {
  id              String        @id @default(uuid())
  tenantId        String        @map("tenant_id")
  name            String
  category        String?       // e.g., "Music", "Technical", "Teaching"
  description     String?

  // Relations
  members         MemberSkill[]

  @@unique([tenantId, name])
  @@map("skills")
  @@index([tenantId, category])
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}
```

---

## 4. Services Layer

### 4.1 Member Service

```typescript
// lib/services/member-service.ts
import { prisma } from '@/lib/prisma';
import { Member, MemberStatus, Prisma } from '@prisma/client';

export interface MemberFilters {
  search?: string;
  status?: MemberStatus | MemberStatus[];
  tags?: string[];
  familyId?: string;
  groupId?: string;
  ministryId?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  ageMin?: number;
  ageMax?: number;
  memberSinceStart?: Date;
  memberSinceEnd?: Date;
  engagementScoreMin?: number;
  engagementScoreMax?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class MemberService {
  constructor(private tenantId: string) {}

  async findMany(
    filters: MemberFilters = {},
    pagination: PaginationOptions = {}
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'lastName',
      sortOrder = 'asc',
    } = pagination;

    const where = this.buildWhereClause(filters);

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: {
          family: {
            select: { id: true, name: true },
          },
          groupMemberships: {
            where: { deletedAt: null },
            include: {
              group: { select: { id: true, name: true } },
            },
          },
          ministryAssignments: {
            where: { deletedAt: null },
            include: {
              ministry: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member.count({ where }),
    ]);

    return {
      data: members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private buildWhereClause(filters: MemberFilters): Prisma.MemberWhereInput {
    const where: Prisma.MemberWhereInput = {
      tenantId: this.tenantId,
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { mobilePhone: { contains: filters.search } },
      ];
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasEvery: filters.tags };
    }

    if (filters.familyId) {
      where.familyId = filters.familyId;
    }

    if (filters.groupId) {
      where.groupMemberships = {
        some: { groupId: filters.groupId, deletedAt: null },
      };
    }

    if (filters.ministryId) {
      where.ministryAssignments = {
        some: { ministryId: filters.ministryId, deletedAt: null },
      };
    }

    if (filters.hasEmail !== undefined) {
      where.email = filters.hasEmail ? { not: null } : null;
    }

    if (filters.hasPhone !== undefined) {
      where.OR = filters.hasPhone
        ? [
            { phone: { not: null } },
            { mobilePhone: { not: null } },
          ]
        : [
            { phone: null, mobilePhone: null },
          ];
    }

    if (filters.ageMin || filters.ageMax) {
      const now = new Date();
      if (filters.ageMax) {
        const minBirthDate = new Date(
          now.getFullYear() - filters.ageMax - 1,
          now.getMonth(),
          now.getDate()
        );
        where.dateOfBirth = {
          ...((where.dateOfBirth as any) || {}),
          gte: minBirthDate,
        };
      }
      if (filters.ageMin) {
        const maxBirthDate = new Date(
          now.getFullYear() - filters.ageMin,
          now.getMonth(),
          now.getDate()
        );
        where.dateOfBirth = {
          ...((where.dateOfBirth as any) || {}),
          lte: maxBirthDate,
        };
      }
    }

    if (filters.engagementScoreMin !== undefined) {
      where.engagementScore = {
        ...((where.engagementScore as any) || {}),
        gte: filters.engagementScoreMin,
      };
    }

    if (filters.engagementScoreMax !== undefined) {
      where.engagementScore = {
        ...((where.engagementScore as any) || {}),
        lte: filters.engagementScoreMax,
      };
    }

    return where;
  }

  async findById(id: string) {
    return prisma.member.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            lastLoginAt: true,
          },
        },
        family: {
          include: {
            members: {
              where: { deletedAt: null, id: { not: id } },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                familyRole: true,
                photo: true,
              },
            },
          },
        },
        groupMemberships: {
          where: { deletedAt: null },
          include: {
            group: { select: { id: true, name: true, type: true } },
          },
        },
        ministryAssignments: {
          where: { deletedAt: null },
          include: {
            ministry: { select: { id: true, name: true } },
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 20,
        },
        donations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        pastoralNotes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async create(data: Prisma.MemberCreateInput) {
    // Generate member number if not provided
    if (!data.memberNumber && data.status === 'MEMBER') {
      data.memberNumber = await this.generateMemberNumber();
    }

    const member = await prisma.member.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });

    // Trigger first-time visitor workflow if applicable
    if (data.status === 'VISITOR') {
      await this.triggerVisitorWorkflow(member.id);
    }

    return member;
  }

  async update(id: string, data: Prisma.MemberUpdateInput) {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Member not found');

    const updated = await prisma.member.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Handle status change workflows
    if (data.status && data.status !== existing.status) {
      await this.handleStatusChange(id, existing.status, data.status as MemberStatus);
    }

    return updated;
  }

  async delete(id: string) {
    return prisma.member.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async merge(primaryId: string, secondaryId: string) {
    const [primary, secondary] = await Promise.all([
      this.findById(primaryId),
      this.findById(secondaryId),
    ]);

    if (!primary || !secondary) {
      throw new Error('Member not found');
    }

    // Transfer relationships to primary
    await prisma.$transaction([
      // Transfer donations
      prisma.donation.updateMany({
        where: { memberId: secondaryId },
        data: { memberId: primaryId },
      }),
      // Transfer attendances
      prisma.attendance.updateMany({
        where: { memberId: secondaryId },
        data: { memberId: primaryId },
      }),
      // Transfer group memberships (skip duplicates)
      prisma.groupMembership.updateMany({
        where: {
          memberId: secondaryId,
          NOT: {
            groupId: {
              in: await prisma.groupMembership
                .findMany({
                  where: { memberId: primaryId },
                  select: { groupId: true },
                })
                .then(gm => gm.map(g => g.groupId)),
            },
          },
        },
        data: { memberId: primaryId },
      }),
      // Soft delete secondary
      prisma.member.update({
        where: { id: secondaryId },
        data: {
          deletedAt: new Date(),
          customFields: {
            ...(secondary.customFields as object || {}),
            mergedInto: primaryId,
            mergedAt: new Date().toISOString(),
          },
        },
      }),
    ]);

    return this.findById(primaryId);
  }

  async updateEngagementScore(memberId: string) {
    const [attendances, donations, groupMemberships] = await Promise.all([
      prisma.attendance.count({
        where: {
          memberId,
          date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.donation.count({
        where: {
          memberId,
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
          status: 'COMPLETED',
        },
      }),
      prisma.groupMembership.count({
        where: { memberId, deletedAt: null },
      }),
    ]);

    // Simple engagement score calculation
    const score = Math.min(
      100,
      attendances * 5 + donations * 10 + groupMemberships * 15
    );

    await prisma.member.update({
      where: { id: memberId },
      data: {
        engagementScore: score,
        lastEngagement: new Date(),
      },
    });

    return score;
  }

  private async generateMemberNumber(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const lastMember = await prisma.member.findFirst({
      where: {
        tenantId: this.tenantId,
        memberNumber: { startsWith: year },
      },
      orderBy: { memberNumber: 'desc' },
    });

    if (lastMember?.memberNumber) {
      const lastNum = parseInt(lastMember.memberNumber.slice(2));
      return `${year}${String(lastNum + 1).padStart(4, '0')}`;
    }

    return `${year}0001`;
  }

  private async triggerVisitorWorkflow(memberId: string) {
    const workflow = await prisma.visitorWorkflow.findFirst({
      where: {
        tenantId: this.tenantId,
        triggerType: 'FIRST_VISIT',
        isActive: true,
      },
    });

    if (workflow) {
      // Create follow-up tasks based on workflow steps
      const steps = workflow.steps as any[];
      for (const step of steps) {
        await prisma.followUp.create({
          data: {
            tenantId: this.tenantId,
            memberId,
            type: 'FIRST_TIME_VISITOR',
            step: step.order,
            dueDate: new Date(Date.now() + step.delayDays * 24 * 60 * 60 * 1000),
            notes: step.description,
          },
        });
      }
    }
  }

  private async handleStatusChange(
    memberId: string,
    oldStatus: MemberStatus,
    newStatus: MemberStatus
  ) {
    // Log status change
    await prisma.pastoralNote.create({
      data: {
        tenantId: this.tenantId,
        memberId,
        type: 'MILESTONE',
        title: 'Status Change',
        content: `Status changed from ${oldStatus} to ${newStatus}`,
        authorId: 'system',
        isPrivate: false,
      },
    });

    // Trigger appropriate workflows
    if (newStatus === 'MEMBER' && oldStatus !== 'MEMBER') {
      // Generate member number if not already assigned
      const member = await prisma.member.findUnique({
        where: { id: memberId },
      });
      if (!member?.memberNumber) {
        const memberNumber = await this.generateMemberNumber();
        await prisma.member.update({
          where: { id: memberId },
          data: {
            memberNumber,
            memberSince: new Date(),
          },
        });
      }
    }
  }
}
```

### 4.2 Family Service

```typescript
// lib/services/family-service.ts
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class FamilyService {
  constructor(private tenantId: string) {}

  async findMany(options: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { search, page = 1, limit = 20 } = options;

    const where: Prisma.FamilyWhereInput = {
      tenantId: this.tenantId,
      deletedAt: null,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [families, total] = await Promise.all([
      prisma.family.findMany({
        where,
        include: {
          members: {
            where: { deletedAt: null },
            orderBy: [
              { familyPosition: 'asc' },
              { dateOfBirth: 'asc' },
            ],
            select: {
              id: true,
              firstName: true,
              lastName: true,
              familyRole: true,
              dateOfBirth: true,
              photo: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.family.count({ where }),
    ]);

    return {
      data: families,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.family.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        deletedAt: null,
      },
      include: {
        members: {
          where: { deletedAt: null },
          orderBy: [
            { familyPosition: 'asc' },
            { dateOfBirth: 'asc' },
          ],
        },
      },
    });
  }

  async create(data: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    memberIds?: string[];
  }) {
    const { memberIds, ...familyData } = data;

    const family = await prisma.family.create({
      data: {
        tenantId: this.tenantId,
        ...familyData,
      },
    });

    // Link existing members to family
    if (memberIds && memberIds.length > 0) {
      await prisma.member.updateMany({
        where: {
          id: { in: memberIds },
          tenantId: this.tenantId,
        },
        data: { familyId: family.id },
      });
    }

    return this.findById(family.id);
  }

  async update(id: string, data: Prisma.FamilyUpdateInput) {
    await prisma.family.update({
      where: { id },
      data,
    });

    return this.findById(id);
  }

  async addMember(familyId: string, memberId: string, role?: string) {
    await prisma.member.update({
      where: { id: memberId },
      data: {
        familyId,
        familyRole: role as any,
      },
    });

    return this.findById(familyId);
  }

  async removeMember(memberId: string) {
    await prisma.member.update({
      where: { id: memberId },
      data: {
        familyId: null,
        familyRole: null,
      },
    });
  }

  async syncFamilyAddress(familyId: string) {
    const family = await this.findById(familyId);
    if (!family) return;

    // Update all family members with family address
    await prisma.member.updateMany({
      where: {
        familyId,
        tenantId: this.tenantId,
        deletedAt: null,
      },
      data: {
        address: family.address,
        city: family.city,
        state: family.state,
        zipCode: family.zipCode,
        country: family.country,
      },
    });
  }

  async delete(id: string) {
    // Remove family association from members first
    await prisma.member.updateMany({
      where: { familyId: id },
      data: { familyId: null, familyRole: null },
    });

    return prisma.family.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

### 4.3 Attendance Service

```typescript
// lib/services/attendance-service.ts
import { prisma } from '@/lib/prisma';
import { AttendanceType, RecordedBy, Prisma } from '@prisma/client';

export class AttendanceService {
  constructor(private tenantId: string) {}

  async recordAttendance(data: {
    memberId: string;
    type: AttendanceType;
    date: Date;
    eventId?: string;
    serviceId?: string;
    groupId?: string;
    recordedBy?: RecordedBy;
    notes?: string;
  }) {
    const attendance = await prisma.attendance.upsert({
      where: {
        memberId_type_date_serviceId: {
          memberId: data.memberId,
          type: data.type,
          date: data.date,
          serviceId: data.serviceId || '',
        },
      },
      create: {
        tenantId: this.tenantId,
        ...data,
        checkInTime: new Date(),
      },
      update: {
        notes: data.notes,
      },
    });

    // Update member's last engagement
    await prisma.member.update({
      where: { id: data.memberId },
      data: { lastEngagement: new Date() },
    });

    return attendance;
  }

  async recordBulkAttendance(data: {
    memberIds: string[];
    type: AttendanceType;
    date: Date;
    eventId?: string;
    serviceId?: string;
    groupId?: string;
  }) {
    const records = data.memberIds.map(memberId => ({
      tenantId: this.tenantId,
      memberId,
      type: data.type,
      date: data.date,
      eventId: data.eventId,
      serviceId: data.serviceId,
      groupId: data.groupId,
      checkInTime: new Date(),
      recordedBy: 'MANUAL' as RecordedBy,
    }));

    await prisma.attendance.createMany({
      data: records,
      skipDuplicates: true,
    });

    // Update last engagement for all members
    await prisma.member.updateMany({
      where: { id: { in: data.memberIds } },
      data: { lastEngagement: new Date() },
    });

    return records.length;
  }

  async getAttendanceByDate(date: Date, type?: AttendanceType) {
    const where: Prisma.AttendanceWhereInput = {
      tenantId: this.tenantId,
      date,
    };

    if (type) {
      where.type = type;
    }

    return prisma.attendance.findMany({
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
        service: {
          select: { id: true, name: true },
        },
        event: {
          select: { id: true, title: true },
        },
      },
      orderBy: { checkInTime: 'asc' },
    });
  }

  async getMemberAttendanceHistory(
    memberId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      type?: AttendanceType;
      limit?: number;
    } = {}
  ) {
    const { startDate, endDate, type, limit = 50 } = options;

    const where: Prisma.AttendanceWhereInput = {
      tenantId: this.tenantId,
      memberId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    if (type) {
      where.type = type;
    }

    return prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        service: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
        group: { select: { id: true, name: true } },
      },
    });
  }

  async getAttendanceStats(options: {
    startDate: Date;
    endDate: Date;
    type?: AttendanceType;
  }) {
    const { startDate, endDate, type } = options;

    const where: Prisma.AttendanceWhereInput = {
      tenantId: this.tenantId,
      date: { gte: startDate, lte: endDate },
    };

    if (type) {
      where.type = type;
    }

    const [totalAttendances, uniqueMembers, byType, byWeek] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.groupBy({
        by: ['memberId'],
        where,
        _count: { memberId: true },
      }).then(result => result.length),
      prisma.attendance.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
      }),
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('week', date) as week,
          COUNT(*) as count,
          COUNT(DISTINCT member_id) as unique_members
        FROM attendances
        WHERE tenant_id = ${this.tenantId}
          AND date >= ${startDate}
          AND date <= ${endDate}
        GROUP BY DATE_TRUNC('week', date)
        ORDER BY week DESC
      `,
    ]);

    return {
      totalAttendances,
      uniqueMembers,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
      byWeek,
      averagePerWeek: Math.round(totalAttendances /
        Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)))
      ),
    };
  }

  async getFirstTimeVisitors(startDate: Date, endDate: Date) {
    // Find members whose first attendance falls within the date range
    return prisma.$queryRaw`
      SELECT m.*, MIN(a.date) as first_visit
      FROM members m
      JOIN attendances a ON m.id = a.member_id
      WHERE m.tenant_id = ${this.tenantId}
        AND m.deleted_at IS NULL
      GROUP BY m.id
      HAVING MIN(a.date) >= ${startDate} AND MIN(a.date) <= ${endDate}
      ORDER BY first_visit DESC
    `;
  }
}
```

---

## 5. API Endpoints

### 5.1 Members API

```typescript
// app/api/admin/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MemberService } from '@/lib/services/member-service';
import { memberSchema } from '@/lib/validations/member';

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
      tags: searchParams.getAll('tags') || undefined,
      familyId: searchParams.get('familyId') || undefined,
      groupId: searchParams.get('groupId') || undefined,
      ministryId: searchParams.get('ministryId') || undefined,
    };

    const pagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'lastName',
      sortOrder: (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc',
    };

    const service = new MemberService(session.user.tenantId);
    const result = await service.findMany(filters, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
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
    const validatedData = memberSchema.parse(body);

    const service = new MemberService(session.user.tenantId);
    const member = await service.create({
      ...validatedData,
      tenant: { connect: { id: session.user.tenantId } },
      createdBy: session.user.id,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error('Error creating member:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}
```

### 5.2 Individual Member API

```typescript
// app/api/admin/members/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MemberService } from '@/lib/services/member-service';
import { memberSchema } from '@/lib/validations/member';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new MemberService(session.user.tenantId);
    const member = await service.findById(params.id);

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = memberSchema.partial().parse(body);

    const service = new MemberService(session.user.tenantId);
    const member = await service.update(params.id, {
      ...validatedData,
      updatedBy: session.user.id,
    });

    return NextResponse.json(member);
  } catch (error: any) {
    console.error('Error updating member:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new MemberService(session.user.tenantId);
    await service.delete(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    );
  }
}
```

### 5.3 Attendance API

```typescript
// app/api/admin/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AttendanceService } from '@/lib/services/attendance-service';
import { z } from 'zod';

const attendanceSchema = z.object({
  memberId: z.string().uuid(),
  type: z.enum(['SERVICE', 'MIDWEEK', 'SMALL_GROUP', 'EVENT', 'CLASS', 'VOLUNTEER', 'OTHER']),
  date: z.string().transform(s => new Date(s)),
  eventId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const bulkAttendanceSchema = z.object({
  memberIds: z.array(z.string().uuid()),
  type: z.enum(['SERVICE', 'MIDWEEK', 'SMALL_GROUP', 'EVENT', 'CLASS', 'VOLUNTEER', 'OTHER']),
  date: z.string().transform(s => new Date(s)),
  eventId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const service = new AttendanceService(session.user.tenantId);

    // Check if bulk or single
    if (body.memberIds && Array.isArray(body.memberIds)) {
      const validatedData = bulkAttendanceSchema.parse(body);
      const count = await service.recordBulkAttendance(validatedData);
      return NextResponse.json({ success: true, count });
    } else {
      const validatedData = attendanceSchema.parse(body);
      const attendance = await service.recordAttendance(validatedData);
      return NextResponse.json(attendance, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error recording attendance:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const type = searchParams.get('type') as any;

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const service = new AttendanceService(session.user.tenantId);
    const attendances = await service.getAttendanceByDate(
      new Date(dateParam),
      type
    );

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}
```

### 5.4 Import/Export API

```typescript
// app/api/admin/members/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';

const FIELD_MAPPING: Record<string, string> = {
  'first name': 'firstName',
  'last name': 'lastName',
  'email': 'email',
  'phone': 'phone',
  'mobile': 'mobilePhone',
  'address': 'address',
  'city': 'city',
  'state': 'state',
  'zip': 'zipCode',
  'zip code': 'zipCode',
  'postal code': 'zipCode',
  'birthday': 'dateOfBirth',
  'date of birth': 'dateOfBirth',
  'gender': 'gender',
  'member since': 'memberSince',
  'status': 'status',
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = {
      total: records.length,
      created: 0,
      updated: 0,
      errors: [] as { row: number; error: string }[],
    };

    for (let i = 0; i < records.length; i++) {
      try {
        const row = records[i];
        const memberData: any = {
          tenantId: session.user.tenantId,
        };

        // Map CSV columns to member fields
        for (const [csvKey, value] of Object.entries(row)) {
          const normalizedKey = csvKey.toLowerCase().trim();
          const fieldName = FIELD_MAPPING[normalizedKey];

          if (fieldName && value) {
            if (fieldName === 'dateOfBirth' || fieldName === 'memberSince') {
              memberData[fieldName] = new Date(value as string);
            } else if (fieldName === 'gender') {
              memberData[fieldName] = (value as string).toUpperCase();
            } else if (fieldName === 'status') {
              memberData[fieldName] = (value as string).toUpperCase().replace(' ', '_');
            } else {
              memberData[fieldName] = value;
            }
          }
        }

        // Require at least first name and last name
        if (!memberData.firstName || !memberData.lastName) {
          results.errors.push({
            row: i + 2, // +2 for header row and 0-index
            error: 'Missing required fields: firstName, lastName',
          });
          continue;
        }

        // Check for existing member by email
        if (memberData.email) {
          const existing = await prisma.member.findFirst({
            where: {
              tenantId: session.user.tenantId,
              email: memberData.email,
              deletedAt: null,
            },
          });

          if (existing) {
            await prisma.member.update({
              where: { id: existing.id },
              data: memberData,
            });
            results.updated++;
          } else {
            await prisma.member.create({ data: memberData });
            results.created++;
          }
        } else {
          await prisma.member.create({ data: memberData });
          results.created++;
        }
      } catch (error: any) {
        results.errors.push({
          row: i + 2,
          error: error.message,
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error importing members:', error);
    return NextResponse.json(
      { error: 'Failed to import members' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/admin/members/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stringify } from 'csv-stringify/sync';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const fields = searchParams.getAll('fields');

    const members = await prisma.member.findMany({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
      include: {
        family: { select: { name: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    // Default fields to export
    const exportFields = fields.length > 0 ? fields : [
      'firstName',
      'lastName',
      'email',
      'phone',
      'mobilePhone',
      'address',
      'city',
      'state',
      'zipCode',
      'dateOfBirth',
      'gender',
      'status',
      'memberSince',
    ];

    const data = members.map(member => {
      const row: Record<string, any> = {};
      for (const field of exportFields) {
        if (field === 'familyName') {
          row[field] = member.family?.name || '';
        } else {
          row[field] = (member as any)[field] ?? '';
        }
      }
      return row;
    });

    if (format === 'json') {
      return NextResponse.json(data);
    }

    // CSV format
    const csv = stringify(data, {
      header: true,
      columns: exportFields,
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="members-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting members:', error);
    return NextResponse.json(
      { error: 'Failed to export members' },
      { status: 500 }
    );
  }
}
```

---

## 6. Admin Components

### 6.1 Member List Page

```typescript
// app/admin/members/page.tsx
import { Suspense } from 'react';
import { getServerTenant } from '@/lib/tenant/server-context';
import { MemberService } from '@/lib/services/member-service';
import { Button } from '@/components/ui/button';
import { MemberTable } from '@/components/admin/members/MemberTable';
import { MemberFilters } from '@/components/admin/members/MemberFilters';
import { MemberImportDialog } from '@/components/admin/members/MemberImportDialog';
import { AddMemberDialog } from '@/components/admin/members/AddMemberDialog';
import { UserPlus, Upload, Download } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    tags?: string | string[];
  };
}

export default async function MembersPage({ searchParams }: PageProps) {
  const tenant = await getServerTenant();
  if (!tenant) return null;

  const service = new MemberService(tenant.id);
  const filters = {
    search: searchParams.search,
    status: searchParams.status as any,
    tags: Array.isArray(searchParams.tags)
      ? searchParams.tags
      : searchParams.tags
      ? [searchParams.tags]
      : undefined,
  };

  const { data: members, pagination } = await service.findMany(filters, {
    page: parseInt(searchParams.page || '1'),
    limit: 20,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">People</h1>
          <p className="text-gray-500">
            {pagination.total} people in your database
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MemberImportDialog>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </MemberImportDialog>

          <Link href="/api/admin/members/export?format=csv">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </Link>

          <AddMemberDialog>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </AddMemberDialog>
        </div>
      </div>

      {/* Filters */}
      <MemberFilters currentFilters={searchParams} />

      {/* Table */}
      <Suspense fallback={<div>Loading...</div>}>
        <MemberTable
          members={members}
          pagination={pagination}
        />
      </Suspense>
    </div>
  );
}
```

### 6.2 Member Profile Page

```typescript
// app/admin/members/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getServerTenant } from '@/lib/tenant/server-context';
import { MemberService } from '@/lib/services/member-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MemberHeader } from '@/components/admin/members/MemberHeader';
import { MemberProfileTab } from '@/components/admin/members/MemberProfileTab';
import { MemberFamilyTab } from '@/components/admin/members/MemberFamilyTab';
import { MemberAttendanceTab } from '@/components/admin/members/MemberAttendanceTab';
import { MemberGivingTab } from '@/components/admin/members/MemberGivingTab';
import { MemberGroupsTab } from '@/components/admin/members/MemberGroupsTab';
import { MemberNotesTab } from '@/components/admin/members/MemberNotesTab';

interface PageProps {
  params: { id: string };
}

export default async function MemberProfilePage({ params }: PageProps) {
  const tenant = await getServerTenant();
  if (!tenant) return null;

  const service = new MemberService(tenant.id);
  const member = await service.findById(params.id);

  if (!member) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <MemberHeader member={member} />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="giving">Giving</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <MemberProfileTab member={member} />
        </TabsContent>

        <TabsContent value="family" className="mt-6">
          <MemberFamilyTab member={member} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <MemberAttendanceTab
            memberId={member.id}
            attendances={member.attendances}
          />
        </TabsContent>

        <TabsContent value="giving" className="mt-6">
          <MemberGivingTab
            memberId={member.id}
            donations={member.donations}
            totalGiving={member.totalGiving}
          />
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <MemberGroupsTab
            memberId={member.id}
            groupMemberships={member.groupMemberships}
            ministryAssignments={member.ministryAssignments}
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <MemberNotesTab
            memberId={member.id}
            notes={member.pastoralNotes}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 6.3 Member Form Component

```typescript
// components/admin/members/MemberForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';
import { DatePicker } from '@/components/ui/date-picker';
import { TagInput } from '@/components/ui/tag-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  preferredName: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  workPhone: z.string().optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'ENGAGED']).optional(),
  photo: z.string().optional(),
  bio: z.string().optional(),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  address: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default('US'),
  status: z.enum(['VISITOR', 'REGULAR_ATTENDER', 'MEMBER', 'ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DECEASED', 'REMOVED']),
  memberSince: z.date().optional(),
  baptismDate: z.date().optional(),
  salvationDate: z.date().optional(),
  weddingDate: z.date().optional(),
  joinedHow: z.enum(['BAPTISM', 'TRANSFER', 'STATEMENT_OF_FAITH', 'REAFFIRMATION', 'BORN_INTO']).optional(),
  previousChurch: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  emailOptIn: z.boolean().default(true),
  smsOptIn: z.boolean().default(false),
  pushOptIn: z.boolean().default(true),
  mailOptIn: z.boolean().default(true),
  showInDirectory: z.boolean().default(true),
  showEmail: z.boolean().default(false),
  showPhone: z.boolean().default(false),
  showAddress: z.boolean().default(false),
  showBirthday: z.boolean().default(true),
  showPhoto: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  member?: Partial<MemberFormData>;
  onSubmit: (data: MemberFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function MemberForm({
  member,
  onSubmit,
  onCancel,
  isSubmitting,
}: MemberFormProps) {
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      status: 'VISITOR',
      country: 'US',
      emailOptIn: true,
      smsOptIn: false,
      pushOptIn: true,
      mailOptIn: true,
      showInDirectory: true,
      showEmail: false,
      showPhone: false,
      showAddress: false,
      showBirthday: true,
      showPhoto: true,
      tags: [],
      ...member,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="church">Church Info</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          {/* Personal Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          className="w-32 h-32 rounded-full"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nickname" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onSelect={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                          <SelectItem value="PREFER_NOT_TO_SAY">
                            Prefer not to say
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SINGLE">Single</SelectItem>
                          <SelectItem value="MARRIED">Married</SelectItem>
                          <SelectItem value="ENGAGED">Engaged</SelectItem>
                          <SelectItem value="DIVORCED">Divorced</SelectItem>
                          <SelectItem value="WIDOWED">Widowed</SelectItem>
                          <SelectItem value="SEPARATED">Separated</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <TagInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Add tags..."
                        />
                      </FormControl>
                      <FormDescription>
                        Use tags to organize and filter members
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobilePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Apt, Suite, Unit, etc." />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem className="col-span-2 md:col-span-1">
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
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Church Info Tab */}
          <TabsContent value="church" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Membership Status</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
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
                          <SelectItem value="VISITOR">Visitor</SelectItem>
                          <SelectItem value="REGULAR_ATTENDER">Regular Attender</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                          <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                          <SelectItem value="DECEASED">Deceased</SelectItem>
                          <SelectItem value="REMOVED">Removed</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="memberSince"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member Since</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onSelect={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="joinedHow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How They Joined</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BAPTISM">Baptism</SelectItem>
                          <SelectItem value="TRANSFER">Transfer</SelectItem>
                          <SelectItem value="STATEMENT_OF_FAITH">Statement of Faith</SelectItem>
                          <SelectItem value="REAFFIRMATION">Reaffirmation</SelectItem>
                          <SelectItem value="BORN_INTO">Born Into</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="previousChurch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Church</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spiritual Milestones</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="salvationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salvation Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onSelect={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baptismDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Baptism Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onSelect={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weddingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wedding Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onSelect={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emergency Tab */}
          <TabsContent value="emergency" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyName"
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
                  name="emergencyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyRelation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Spouse, Parent" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Communication Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="emailOptIn"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Email Communications</FormLabel>
                        <FormDescription>
                          Receive church emails and newsletters
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
                  name="smsOptIn"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>SMS/Text Messages</FormLabel>
                        <FormDescription>
                          Receive text message notifications
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
                  name="pushOptIn"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Push Notifications</FormLabel>
                        <FormDescription>
                          Receive app push notifications
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
                  name="mailOptIn"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Physical Mail</FormLabel>
                        <FormDescription>
                          Receive physical mail communications
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
                <CardTitle>Directory Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="showInDirectory"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Show in Church Directory</FormLabel>
                        <FormDescription>
                          Allow other members to see your profile
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

                {form.watch('showInDirectory') && (
                  <>
                    <FormField
                      control={form.control}
                      name="showPhoto"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between pl-4">
                          <FormLabel>Show Photo</FormLabel>
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
                      name="showEmail"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between pl-4">
                          <FormLabel>Show Email</FormLabel>
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
                      name="showPhone"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between pl-4">
                          <FormLabel>Show Phone</FormLabel>
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
                      name="showAddress"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between pl-4">
                          <FormLabel>Show Address</FormLabel>
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
                      name="showBirthday"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between pl-4">
                          <FormLabel>Show Birthday</FormLabel>
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
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 7. Directory Component (Public)

```typescript
// app/(tenant)/directory/page.tsx
import { getServerTenant } from '@/lib/tenant/server-context';
import { prisma } from '@/lib/prisma';
import { DirectoryGrid } from '@/components/public/DirectoryGrid';
import { DirectorySearch } from '@/components/public/DirectorySearch';

interface PageProps {
  searchParams: {
    search?: string;
    letter?: string;
    page?: string;
  };
}

export default async function DirectoryPage({ searchParams }: PageProps) {
  const tenant = await getServerTenant();
  if (!tenant) return null;

  const page = parseInt(searchParams.page || '1');
  const limit = 24;

  const where: any = {
    tenantId: tenant.id,
    deletedAt: null,
    showInDirectory: true,
    status: { in: ['MEMBER', 'ACTIVE'] },
  };

  if (searchParams.search) {
    where.OR = [
      { firstName: { contains: searchParams.search, mode: 'insensitive' } },
      { lastName: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  if (searchParams.letter) {
    where.lastName = { startsWith: searchParams.letter, mode: 'insensitive' };
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photo: true,
        showPhoto: true,
        email: true,
        showEmail: true,
        phone: true,
        mobilePhone: true,
        showPhone: true,
        address: true,
        city: true,
        state: true,
        showAddress: true,
        dateOfBirth: true,
        showBirthday: true,
        family: {
          select: {
            id: true,
            name: true,
            members: {
              where: {
                showInDirectory: true,
                deletedAt: null,
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                familyRole: true,
              },
            },
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.member.count({ where }),
  ]);

  // Process privacy settings
  const processedMembers = members.map(member => ({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    photo: member.showPhoto ? member.photo : null,
    email: member.showEmail ? member.email : null,
    phone: member.showPhone ? (member.mobilePhone || member.phone) : null,
    address: member.showAddress
      ? [member.address, member.city, member.state].filter(Boolean).join(', ')
      : null,
    birthday: member.showBirthday && member.dateOfBirth
      ? new Date(member.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
      : null,
    family: member.family,
  }));

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Church Directory
        </h1>
        <p className="text-gray-600">
          Connect with other members of our church family
        </p>
      </div>

      <DirectorySearch
        alphabet={alphabet}
        currentLetter={searchParams.letter}
        currentSearch={searchParams.search}
      />

      <DirectoryGrid
        members={processedMembers}
        total={total}
        page={page}
        limit={limit}
      />
    </div>
  );
}
```

---

## 8. Analytics Dashboard

```typescript
// components/admin/members/MemberAnalytics.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { Users, UserPlus, UserCheck, TrendingUp } from 'lucide-react';

interface MemberAnalyticsProps {
  stats: {
    total: number;
    active: number;
    newThisMonth: number;
    growthRate: number;
    byStatus: { status: string; count: number }[];
    byAge: { range: string; count: number }[];
    growthTrend: { month: string; count: number }[];
    engagementDistribution: { level: string; count: number }[];
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function MemberAnalytics({ stats }: MemberAnalyticsProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total People</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Members</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <UserPlus className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">New This Month</p>
                <p className="text-2xl font-bold">{stats.newThisMonth}</p>
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
                <p className="text-sm text-gray-500">Growth Rate</p>
                <p className="text-2xl font-bold">
                  {stats.growthRate > 0 ? '+' : ''}{stats.growthRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.growthTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0088FE"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {stats.byStatus.map((_, index) => (
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

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byAge}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.engagementDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="level" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884D8" />
              </BarChart>
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

### Data Privacy
1. **GDPR Compliance**: Implement data export and deletion requests
2. **Privacy Controls**: Allow members to control their visibility in directory
3. **Access Levels**: Restrict sensitive fields (notes, giving) to authorized roles
4. **Audit Logging**: Track all changes to member records

### Data Quality
1. **Duplicate Detection**: Check for potential duplicates on entry
2. **Validation**: Enforce email format, phone number patterns
3. **Standardization**: Normalize addresses, phone formats
4. **Regular Cleanup**: Scheduled jobs to identify stale records

### Performance
1. **Indexing**: Proper indexes on search and filter fields
2. **Pagination**: Always paginate large result sets
3. **Caching**: Cache frequently accessed aggregate data
4. **Lazy Loading**: Load related data only when needed

### Integration
1. **CSV Import/Export**: Standard format for data portability
2. **API Access**: RESTful endpoints for third-party integration
3. **Webhooks**: Notify external systems of member changes
4. **Planning Center Sync**: Import from existing church management systems

---

## 10. Validation Schema

```typescript
// lib/validations/member.ts
import { z } from 'zod';

export const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100),
  preferredName: z.string().max(100).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  mobilePhone: z.string().max(20).optional(),
  workPhone: z.string().max(20).optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'ENGAGED']).optional(),
  photo: z.string().url().optional(),
  bio: z.string().max(1000).optional(),
  occupation: z.string().max(200).optional(),
  employer: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  address2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(100).default('US'),
  status: z.enum([
    'VISITOR',
    'REGULAR_ATTENDER',
    'MEMBER',
    'ACTIVE',
    'INACTIVE',
    'TRANSFERRED',
    'DECEASED',
    'REMOVED',
  ]).default('VISITOR'),
  memberSince: z.coerce.date().optional(),
  baptismDate: z.coerce.date().optional(),
  salvationDate: z.coerce.date().optional(),
  weddingDate: z.coerce.date().optional(),
  joinedHow: z.enum(['BAPTISM', 'TRANSFER', 'STATEMENT_OF_FAITH', 'REAFFIRMATION', 'BORN_INTO']).optional(),
  previousChurch: z.string().max(200).optional(),
  familyId: z.string().uuid().optional(),
  familyRole: z.enum(['HEAD', 'SPOUSE', 'CHILD', 'PARENT', 'GRANDPARENT', 'SIBLING', 'RELATIVE', 'OTHER']).optional(),
  emergencyName: z.string().max(200).optional(),
  emergencyPhone: z.string().max(20).optional(),
  emergencyRelation: z.string().max(100).optional(),
  emailOptIn: z.boolean().default(true),
  smsOptIn: z.boolean().default(false),
  pushOptIn: z.boolean().default(true),
  mailOptIn: z.boolean().default(true),
  showInDirectory: z.boolean().default(true),
  showEmail: z.boolean().default(false),
  showPhone: z.boolean().default(false),
  showAddress: z.boolean().default(false),
  showBirthday: z.boolean().default(true),
  showPhoto: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  source: z.enum(['WALK_IN', 'WEBSITE', 'EVENT', 'REFERRAL', 'SOCIAL_MEDIA', 'OUTREACH', 'ONLINE_SERVICE', 'OTHER']).optional(),
  sourceDetails: z.string().max(500).optional(),
  referredBy: z.string().uuid().optional(),
});

export type MemberInput = z.infer<typeof memberSchema>;
```

---

**Document Version**: 1.0
**Last Updated**: December 2024
**Maintained By**: Digital Church Platform Team
