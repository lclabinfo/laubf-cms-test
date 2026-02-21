# Groups & Ministries Management

> **Document Version**: 3.0 Enterprise Edition
> **Last Updated**: December 2024
> **Architecture**: Multi-tenant SaaS with Hierarchical Group Structure

---

## Overview

The Groups & Ministries Management system enables churches to organize their congregation into small groups, ministry teams, classes, and service teams. It provides tools for group leaders, facilitates communication, tracks attendance, manages resources, and fosters community connection through shared experiences and spiritual growth.

---

## Competitive Analysis

| Feature | Planning Center Groups | Church Community Builder | Realm | **Digital Church Platform** |
|---------|----------------------|-------------------------|-------|----------------------------|
| Small Groups | Good | Excellent | Good | **Excellent + AI Matching** |
| Ministry Teams | Good | Excellent | Good | **Comprehensive** |
| Group Finder | Basic | Good | Basic | **Advanced + Map View** |
| Leader Tools | Good | Excellent | Good | **Leader Dashboard** |
| Communication | Basic | Good | Good | **Integrated Multi-Channel** |
| Attendance Tracking | Basic | Good | Basic | **Detailed Analytics** |
| Curriculum/Resources | None | Limited | None | **Full Resource Library** |
| Mobile Experience | App | App | App | **Native + Responsive** |
| Pricing | $14+/mo | $25+/mo | $20+/mo | **Included in Platform** |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Groups & Ministries Architecture                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        Ministry Department                            │   │
│  │     (Worship, Children, Youth, Outreach, Missions, etc.)             │   │
│  └───────────────────────────────┬──────────────────────────────────────┘   │
│                                  │                                           │
│         ┌────────────────────────┼────────────────────────┐                 │
│         │                        │                        │                 │
│         ▼                        ▼                        ▼                 │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │   Service   │         │   Classes   │         │   Teams     │           │
│  │   Teams     │         │   (Studies) │         │             │           │
│  └──────┬──────┘         └──────┬──────┘         └──────┬──────┘           │
│         │                       │                       │                   │
│         │                       │                       │                   │
│         ▼                       ▼                       ▼                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Small Groups                                 │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│  │  │  Bible    │  │   Life    │  │  Support  │  │  Interest │        │   │
│  │  │  Study    │  │   Stage   │  │  Groups   │  │  Groups   │        │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Member Assignment & Matching                       │   │
│  │   • Interest-based matching      • Geographic proximity              │   │
│  │   • Life stage alignment         • Schedule compatibility            │   │
│  │   • Spiritual growth tracking    • Leader recommendations            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Ministry & Group Models

```prisma
// schema.prisma - Groups & Ministries Models

// ============================================
// MINISTRY DEPARTMENT
// ============================================

model Ministry {
  id              String            @id @default(cuid())
  tenantId        String
  tenant          Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Basic Info
  name            String
  slug            String
  description     String?           @db.Text
  mission         String?           @db.Text
  vision          String?           @db.Text

  // Media
  imageUrl        String?
  bannerUrl       String?
  color           String?           // Brand color

  // Contact
  contactEmail    String?
  contactPhone    String?
  meetingLocation String?

  // Settings
  isActive        Boolean           @default(true)
  isPublic        Boolean           @default(true)
  allowSignup     Boolean           @default(true)
  requireApproval Boolean           @default(false)
  sortOrder       Int               @default(0)

  // Hierarchy
  parentId        String?
  parent          Ministry?         @relation("MinistryHierarchy", fields: [parentId], references: [id])
  children        Ministry[]        @relation("MinistryHierarchy")

  // Relations
  members         MinistryMember[]
  groups          Group[]
  events          Event[]
  resources       MinistryResource[]
  announcements   MinistryAnnouncement[]
  positions       MinistryPosition[]

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId, isActive])
}

model MinistryMember {
  id              String            @id @default(cuid())
  tenantId        String

  ministryId      String
  ministry        Ministry          @relation(fields: [ministryId], references: [id], onDelete: Cascade)

  memberId        String
  member          Member            @relation(fields: [memberId], references: [id], onDelete: Cascade)

  // Role & Position
  role            MinistryRole      @default(MEMBER)
  positionId      String?
  position        MinistryPosition? @relation(fields: [positionId], references: [id])
  title           String?           // Custom title

  // Status
  status          MembershipStatus  @default(ACTIVE)
  joinedAt        DateTime          @default(now())
  approvedAt      DateTime?
  approvedBy      String?
  leftAt          DateTime?
  leftReason      String?

  // Background check (for children's/youth ministry)
  backgroundCheckStatus BackgroundCheckStatus?
  backgroundCheckDate   DateTime?
  backgroundCheckExpiry DateTime?

  // Training
  trainings       MinistryTraining[]

  // Availability
  availability    Json?             // { days: ['sunday', 'wednesday'], times: ['morning', 'evening'] }

  // Notes
  notes           String?           @db.Text

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([ministryId, memberId])
  @@index([tenantId, status])
}

enum MinistryRole {
  DIRECTOR        // Overall ministry leader
  COORDINATOR     // Area coordinator
  LEADER          // Team/group leader
  VOLUNTEER       // Active volunteer
  MEMBER          // General member
}

enum MembershipStatus {
  PENDING         // Awaiting approval
  ACTIVE          // Currently active
  ON_LEAVE        // Temporary leave
  INACTIVE        // No longer active
  REMOVED         // Removed from ministry
}

enum BackgroundCheckStatus {
  NOT_REQUIRED
  PENDING
  IN_PROGRESS
  APPROVED
  EXPIRED
  REJECTED
}

model MinistryPosition {
  id              String            @id @default(cuid())
  tenantId        String

  ministryId      String
  ministry        Ministry          @relation(fields: [ministryId], references: [id], onDelete: Cascade)

  title           String
  description     String?           @db.Text
  responsibilities String?          @db.Text

  // Requirements
  requiresBackgroundCheck Boolean   @default(false)
  requiresTraining        Boolean   @default(false)
  requiredTrainings       String[]  // Training IDs
  minimumAge              Int?

  // Capacity
  maxPositions    Int?              // Max people in this position
  currentCount    Int               @default(0)

  isActive        Boolean           @default(true)
  sortOrder       Int               @default(0)

  members         MinistryMember[]

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([ministryId, title])
}

model MinistryTraining {
  id              String            @id @default(cuid())
  tenantId        String

  memberId        String
  ministryMemberId String
  ministryMember  MinistryMember    @relation(fields: [ministryMemberId], references: [id], onDelete: Cascade)

  trainingType    String
  trainingName    String
  completedAt     DateTime
  expiresAt       DateTime?
  certificateUrl  String?
  notes           String?

  createdAt       DateTime          @default(now())

  @@index([ministryMemberId])
}

model MinistryResource {
  id              String            @id @default(cuid())
  tenantId        String

  ministryId      String
  ministry        Ministry          @relation(fields: [ministryId], references: [id], onDelete: Cascade)

  title           String
  description     String?           @db.Text
  type            ResourceType
  url             String?
  fileUrl         String?
  fileSize        Int?
  mimeType        String?

  // Access control
  accessLevel     ResourceAccess    @default(MEMBERS)
  roles           MinistryRole[]    // Roles that can access

  isActive        Boolean           @default(true)
  sortOrder       Int               @default(0)

  downloadCount   Int               @default(0)

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([ministryId, type])
}

enum ResourceType {
  DOCUMENT
  VIDEO
  AUDIO
  LINK
  CURRICULUM
  TRAINING
  FORM
}

enum ResourceAccess {
  PUBLIC          // Anyone can access
  MEMBERS         // Ministry members only
  LEADERS         // Leaders and above
  DIRECTORS       // Directors only
}

model MinistryAnnouncement {
  id              String            @id @default(cuid())
  tenantId        String

  ministryId      String
  ministry        Ministry          @relation(fields: [ministryId], references: [id], onDelete: Cascade)

  title           String
  content         String            @db.Text
  priority        AnnouncementPriority @default(NORMAL)

  // Scheduling
  publishAt       DateTime          @default(now())
  expiresAt       DateTime?
  isPinned        Boolean           @default(false)

  // Targeting
  targetRoles     MinistryRole[]    // Empty = all members

  createdBy       String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([ministryId, publishAt])
}

enum AnnouncementPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

// ============================================
// SMALL GROUPS
// ============================================

model Group {
  id              String            @id @default(cuid())
  tenantId        String
  tenant          Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Basic Info
  name            String
  slug            String
  description     String?           @db.Text
  imageUrl        String?

  // Classification
  type            GroupType         @default(SMALL_GROUP)
  category        String?           // Custom category
  tags            String[]

  // Parent ministry (optional)
  ministryId      String?
  ministry        Ministry?         @relation(fields: [ministryId], references: [id])

  // Meeting Details
  meetingDay      String?           // Monday, Tuesday, etc.
  meetingTime     String?           // "7:00 PM"
  meetingFrequency String?          // Weekly, Bi-weekly, Monthly
  meetingDuration Int?              // Minutes

  // Location
  locationType    LocationType      @default(IN_PERSON)
  address         String?
  city            String?
  state           String?
  zipCode         String?
  latitude        Float?
  longitude       Float?
  virtualLink     String?           // Zoom/Meet link

  // Demographics
  targetAudience  String?           // Men, Women, Young Adults, etc.
  ageMin          Int?
  ageMax          Int?
  lifeStage       String?           // Singles, Married, Parents, etc.
  language        String?           @default("en")

  // Capacity
  maxMembers      Int?
  currentMembers  Int               @default(0)
  isOpen          Boolean           @default(true)  // Accepting new members
  requiresApproval Boolean          @default(false)

  // Visibility
  isPublic        Boolean           @default(true)  // Visible in group finder
  isActive        Boolean           @default(true)
  isFeatured      Boolean           @default(false)

  // Curriculum
  currentStudyId  String?
  currentStudy    GroupStudy?       @relation(fields: [currentStudyId], references: [id])

  // Child care
  childcareProvided Boolean         @default(false)
  childcareAges   String?

  // Communication
  enableChat      Boolean           @default(true)
  enablePrayerWall Boolean          @default(true)

  // Relations
  members         GroupMembership[]
  meetings        GroupMeeting[]
  prayerRequests  GroupPrayer[]
  messages        GroupMessage[]
  resources       GroupResource[]

  // Semester/Session based
  semesterId      String?
  semester        GroupSemester?    @relation(fields: [semesterId], references: [id])
  startDate       DateTime?
  endDate         DateTime?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId, isActive, isPublic])
  @@index([tenantId, type])
  @@index([tenantId, city])
}

enum GroupType {
  SMALL_GROUP     // Bible study, life group
  SUNDAY_SCHOOL   // Age-graded classes
  SUPPORT_GROUP   // Recovery, grief, etc.
  INTEREST_GROUP  // Sports, hobbies
  SERVICE_TEAM    // Serving teams
  CONNECT_GROUP   // Newcomer groups
  DISCIPLESHIP    // 1-on-1 or small discipleship
  PRAYER_GROUP    // Prayer focused
  MENS_GROUP      // Men's ministry
  WOMENS_GROUP    // Women's ministry
  YOUTH_GROUP     // Student ministry
  KIDS_GROUP      // Children's ministry
  OTHER
}

enum LocationType {
  IN_PERSON
  ONLINE
  HYBRID
}

model GroupMembership {
  id              String            @id @default(cuid())
  tenantId        String

  groupId         String
  group           Group             @relation(fields: [groupId], references: [id], onDelete: Cascade)

  memberId        String
  member          Member            @relation(fields: [memberId], references: [id], onDelete: Cascade)

  // Role
  role            GroupRole         @default(MEMBER)

  // Status
  status          MembershipStatus  @default(ACTIVE)
  joinedAt        DateTime          @default(now())
  approvedAt      DateTime?
  approvedBy      String?
  leftAt          DateTime?
  leftReason      String?

  // Preferences
  receiveEmails   Boolean           @default(true)
  receiveSMS      Boolean           @default(false)
  receivePush     Boolean           @default(true)

  // Notes
  notes           String?           @db.Text

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([groupId, memberId])
  @@index([tenantId, status])
}

enum GroupRole {
  LEADER          // Primary leader
  CO_LEADER       // Assistant leader
  HOST            // Hosts meetings
  APPRENTICE      // Leader in training
  MEMBER          // Regular member
}

model GroupMeeting {
  id              String            @id @default(cuid())
  tenantId        String

  groupId         String
  group           Group             @relation(fields: [groupId], references: [id], onDelete: Cascade)

  // Meeting Details
  title           String?
  description     String?           @db.Text
  date            DateTime
  startTime       String?
  endTime         String?

  // Location (can override group default)
  locationType    LocationType?
  location        String?
  virtualLink     String?

  // Study/Curriculum
  studyId         String?
  lessonNumber    Int?
  lessonTitle     String?
  lessonNotes     String?           @db.Text

  // Attendance
  attendance      GroupAttendance[]
  attendeeCount   Int               @default(0)
  visitorCount    Int               @default(0)

  // Meeting notes
  notes           String?           @db.Text
  prayerRequests  String?           @db.Text
  nextSteps       String?           @db.Text

  // Status
  status          MeetingStatus     @default(SCHEDULED)
  cancelledReason String?

  createdBy       String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([groupId, date])
}

enum MeetingStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model GroupAttendance {
  id              String            @id @default(cuid())
  tenantId        String

  meetingId       String
  meeting         GroupMeeting      @relation(fields: [meetingId], references: [id], onDelete: Cascade)

  memberId        String?           // Null for visitors
  memberName      String?           // For visitors

  // Attendance status
  status          AttendanceStatus  @default(PRESENT)

  // Notes
  notes           String?

  checkedInAt     DateTime          @default(now())
  checkedInBy     String?

  @@unique([meetingId, memberId])
  @@index([tenantId, meetingId])
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  EXCUSED
  LATE
}

model GroupPrayer {
  id              String            @id @default(cuid())
  tenantId        String

  groupId         String
  group           Group             @relation(fields: [groupId], references: [id], onDelete: Cascade)

  memberId        String?
  memberName      String?           // For anonymous

  // Request
  request         String            @db.Text
  isAnonymous     Boolean           @default(false)
  isPrivate       Boolean           @default(false) // Only leaders can see
  category        String?           // Health, Family, Work, etc.

  // Status
  status          PrayerStatus      @default(ACTIVE)
  answeredAt      DateTime?
  answerNote      String?           @db.Text

  // Engagement
  prayerCount     Int               @default(0)
  prayers         GroupPrayerPrayed[]

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([groupId, status])
}

enum PrayerStatus {
  ACTIVE
  ANSWERED
  CLOSED
}

model GroupPrayerPrayed {
  id              String            @id @default(cuid())

  prayerRequestId String
  prayerRequest   GroupPrayer       @relation(fields: [prayerRequestId], references: [id], onDelete: Cascade)

  memberId        String

  prayedAt        DateTime          @default(now())
  note            String?

  @@unique([prayerRequestId, memberId])
}

model GroupMessage {
  id              String            @id @default(cuid())
  tenantId        String

  groupId         String
  group           Group             @relation(fields: [groupId], references: [id], onDelete: Cascade)

  senderId        String
  senderName      String

  // Message content
  content         String            @db.Text
  attachments     Json?             // [{ type: 'image', url: '', name: '' }]

  // Reply to
  parentId        String?
  parent          GroupMessage?     @relation("MessageReplies", fields: [parentId], references: [id])
  replies         GroupMessage[]    @relation("MessageReplies")

  // Engagement
  reactions       Json?             // { '👍': ['memberId1'], '❤️': ['memberId2'] }

  // Status
  isEdited        Boolean           @default(false)
  editedAt        DateTime?
  isDeleted       Boolean           @default(false)
  deletedAt       DateTime?

  // Read tracking
  readBy          String[]          // Member IDs who have read

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([groupId, createdAt])
}

model GroupResource {
  id              String            @id @default(cuid())
  tenantId        String

  groupId         String
  group           Group             @relation(fields: [groupId], references: [id], onDelete: Cascade)

  title           String
  description     String?
  type            ResourceType
  url             String?
  fileUrl         String?
  fileSize        Int?

  uploadedBy      String
  downloadCount   Int               @default(0)

  createdAt       DateTime          @default(now())

  @@index([groupId])
}

// ============================================
// CURRICULUM & STUDIES
// ============================================

model GroupStudy {
  id              String            @id @default(cuid())
  tenantId        String
  tenant          Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Study Info
  title           String
  slug            String
  description     String?           @db.Text
  author          String?
  publisher       String?
  imageUrl        String?

  // Content
  totalLessons    Int               @default(0)
  estimatedWeeks  Int?
  lessons         StudyLesson[]

  // Classification
  category        String?           // Book of Bible, Topic, Series
  tags            String[]
  difficulty      StudyDifficulty   @default(BEGINNER)
  targetAudience  String?

  // Media
  hasVideo        Boolean           @default(false)
  hasWorkbook     Boolean           @default(false)
  workbookUrl     String?
  videoPlaylistUrl String?

  // Status
  isActive        Boolean           @default(true)
  isPublic        Boolean           @default(true) // Available to all groups
  isFeatured      Boolean           @default(false)

  // Usage
  activeGroups    Group[]
  completedCount  Int               @default(0)

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId, isActive])
}

enum StudyDifficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

model StudyLesson {
  id              String            @id @default(cuid())
  tenantId        String

  studyId         String
  study           GroupStudy        @relation(fields: [studyId], references: [id], onDelete: Cascade)

  // Lesson Info
  lessonNumber    Int
  title           String
  description     String?           @db.Text
  scriptureRef    String?           // "John 3:1-21"

  // Content
  content         String?           @db.Text  // Main content/notes
  discussionQuestions Json?         // Array of questions
  applicationPoints   Json?         // Takeaways

  // Media
  videoUrl        String?
  audioUrl        String?
  handoutUrl      String?

  // Duration
  estimatedMinutes Int?

  sortOrder       Int               @default(0)

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([studyId, lessonNumber])
  @@index([studyId])
}

// ============================================
// GROUP FINDER & MATCHING
// ============================================

model GroupFinderSettings {
  id              String            @id @default(cuid())
  tenantId        String            @unique

  // Display settings
  showMap         Boolean           @default(true)
  showFilters     Boolean           @default(true)
  defaultView     String            @default("list") // list, map, grid

  // Available filters
  filterByType    Boolean           @default(true)
  filterByDay     Boolean           @default(true)
  filterByLocation Boolean          @default(true)
  filterByAudience Boolean          @default(true)
  filterByChildcare Boolean         @default(true)

  // Matching
  enableMatching  Boolean           @default(false)
  matchingCriteria Json?            // Criteria weights

  // Signup settings
  requireLogin    Boolean           @default(false)
  collectInfo     Json?             // Additional fields to collect

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

model GroupInterest {
  id              String            @id @default(cuid())
  tenantId        String

  groupId         String
  memberId        String?

  // Contact info (for non-members)
  firstName       String
  lastName        String
  email           String
  phone           String?

  // Additional info
  message         String?           @db.Text
  howHeard        String?

  // Status
  status          InterestStatus    @default(PENDING)
  respondedAt     DateTime?
  respondedBy     String?
  responseNote    String?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([tenantId, status])
  @@index([groupId])
}

enum InterestStatus {
  PENDING
  CONTACTED
  JOINED
  DECLINED
  NO_RESPONSE
}

// ============================================
// SEMESTERS & SESSIONS
// ============================================

model GroupSemester {
  id              String            @id @default(cuid())
  tenantId        String
  tenant          Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name            String            // "Fall 2024", "Spring Groups"
  description     String?

  startDate       DateTime
  endDate         DateTime

  // Registration
  registrationStart DateTime?
  registrationEnd   DateTime?
  isRegistrationOpen Boolean        @default(false)

  isActive        Boolean           @default(true)
  isCurrent       Boolean           @default(false)

  groups          Group[]

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([tenantId, isCurrent])
}

// ============================================
// VOLUNTEER SCHEDULING
// ============================================

model VolunteerSchedule {
  id              String            @id @default(cuid())
  tenantId        String

  ministryId      String
  positionId      String?

  memberId        String
  member          Member            @relation(fields: [memberId], references: [id])

  // Schedule
  date            DateTime
  startTime       String?
  endTime         String?
  eventId         String?           // Link to event if applicable

  // Status
  status          ScheduleStatus    @default(SCHEDULED)
  confirmedAt     DateTime?
  declinedReason  String?

  // Swap/Coverage
  needsCoverage   Boolean           @default(false)
  coveringMemberId String?
  coveringMember  Member?           @relation("CoveringVolunteer", fields: [coveringMemberId], references: [id])

  // Notes
  notes           String?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([tenantId, date])
  @@index([memberId, date])
  @@index([ministryId, date])
}

enum ScheduleStatus {
  SCHEDULED
  CONFIRMED
  DECLINED
  NO_SHOW
  COMPLETED
  SWAPPED
}

model VolunteerAvailability {
  id              String            @id @default(cuid())
  tenantId        String

  memberId        String
  member          Member            @relation(fields: [memberId], references: [id], onDelete: Cascade)

  ministryId      String?           // Specific to ministry or general

  // Recurring availability
  dayOfWeek       Int?              // 0-6 (Sunday-Saturday)
  startTime       String?
  endTime         String?

  // Date range availability
  startDate       DateTime?
  endDate         DateTime?

  // Blackout dates
  blackoutDates   DateTime[]

  // Preferences
  maxPerMonth     Int?              // Maximum times per month
  preferredPositions String[]       // Position IDs

  notes           String?

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([memberId])
  @@index([ministryId])
}
```

---

## Services Layer

### Ministry Service

```typescript
// src/services/groups/ministry.service.ts
import { prisma } from '@/lib/prisma';
import {
  Ministry,
  MinistryMember,
  MinistryRole,
  MembershipStatus,
} from '@prisma/client';

interface CreateMinistryInput {
  name: string;
  slug?: string;
  description?: string;
  mission?: string;
  vision?: string;
  imageUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  parentId?: string;
  isPublic?: boolean;
  allowSignup?: boolean;
  requireApproval?: boolean;
}

interface MinistryFilters {
  isActive?: boolean;
  isPublic?: boolean;
  parentId?: string | null;
  search?: string;
}

export class MinistryService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Create a new ministry
   */
  async create(data: CreateMinistryInput): Promise<Ministry> {
    const slug = data.slug || this.generateSlug(data.name);

    return prisma.ministry.create({
      data: {
        tenantId: this.tenantId,
        name: data.name,
        slug,
        description: data.description,
        mission: data.mission,
        vision: data.vision,
        imageUrl: data.imageUrl,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        parentId: data.parentId,
        isPublic: data.isPublic ?? true,
        allowSignup: data.allowSignup ?? true,
        requireApproval: data.requireApproval ?? false,
      },
    });
  }

  /**
   * Get all ministries
   */
  async findMany(filters: MinistryFilters = {}): Promise<Ministry[]> {
    const where: any = { tenantId: this.tenantId };

    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;
    if (filters.parentId !== undefined) where.parentId = filters.parentId;

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.ministry.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { members: true, groups: true, events: true } },
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Get ministry by ID with full details
   */
  async findById(ministryId: string): Promise<Ministry | null> {
    return prisma.ministry.findFirst({
      where: { id: ministryId, tenantId: this.tenantId },
      include: {
        members: {
          where: { status: 'ACTIVE' },
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                imageUrl: true,
              },
            },
            position: true,
          },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
        groups: {
          where: { isActive: true },
          select: { id: true, name: true, type: true, currentMembers: true },
        },
        positions: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        resources: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        announcements: {
          where: {
            publishAt: { lte: new Date() },
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          orderBy: [{ isPinned: 'desc' }, { publishAt: 'desc' }],
          take: 10,
        },
      },
    });
  }

  /**
   * Add member to ministry
   */
  async addMember(
    ministryId: string,
    memberId: string,
    options: {
      role?: MinistryRole;
      positionId?: string;
      title?: string;
      approvedBy?: string;
    } = {}
  ): Promise<MinistryMember> {
    const ministry = await prisma.ministry.findFirst({
      where: { id: ministryId, tenantId: this.tenantId },
    });

    if (!ministry) throw new Error('Ministry not found');

    const status = ministry.requireApproval ? 'PENDING' : 'ACTIVE';

    return prisma.ministryMember.create({
      data: {
        tenantId: this.tenantId,
        ministryId,
        memberId,
        role: options.role || 'MEMBER',
        positionId: options.positionId,
        title: options.title,
        status,
        approvedAt: status === 'ACTIVE' ? new Date() : null,
        approvedBy: status === 'ACTIVE' ? options.approvedBy : null,
      },
    });
  }

  /**
   * Update member role or position
   */
  async updateMember(
    ministryMemberId: string,
    data: {
      role?: MinistryRole;
      positionId?: string;
      title?: string;
      status?: MembershipStatus;
    }
  ): Promise<MinistryMember> {
    return prisma.ministryMember.update({
      where: { id: ministryMemberId },
      data: {
        ...data,
        ...(data.status === 'ACTIVE' && { approvedAt: new Date() }),
        ...(data.status === 'INACTIVE' && { leftAt: new Date() }),
      },
    });
  }

  /**
   * Remove member from ministry
   */
  async removeMember(
    ministryId: string,
    memberId: string,
    reason?: string
  ): Promise<void> {
    await prisma.ministryMember.updateMany({
      where: {
        ministryId,
        memberId,
        status: 'ACTIVE',
      },
      data: {
        status: 'INACTIVE',
        leftAt: new Date(),
        leftReason: reason,
      },
    });
  }

  /**
   * Get ministry leaders
   */
  async getLeaders(ministryId: string): Promise<MinistryMember[]> {
    return prisma.ministryMember.findMany({
      where: {
        ministryId,
        status: 'ACTIVE',
        role: { in: ['DIRECTOR', 'COORDINATOR', 'LEADER'] },
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            imageUrl: true,
          },
        },
        position: true,
      },
      orderBy: { role: 'asc' },
    });
  }

  /**
   * Get ministry statistics
   */
  async getStats(ministryId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    pendingMembers: number;
    totalGroups: number;
    upcomingEvents: number;
    membersByRole: Record<string, number>;
  }> {
    const [members, groups, events] = await Promise.all([
      prisma.ministryMember.groupBy({
        by: ['status', 'role'],
        where: { ministryId },
        _count: true,
      }),
      prisma.group.count({
        where: { ministryId, isActive: true },
      }),
      prisma.event.count({
        where: {
          ministryId,
          startDate: { gte: new Date() },
          status: 'PUBLISHED',
        },
      }),
    ]);

    const memberStats = members.reduce(
      (acc, m) => {
        if (m.status === 'ACTIVE') {
          acc.activeMembers += m._count;
          acc.membersByRole[m.role] = (acc.membersByRole[m.role] || 0) + m._count;
        } else if (m.status === 'PENDING') {
          acc.pendingMembers += m._count;
        }
        acc.totalMembers += m._count;
        return acc;
      },
      {
        totalMembers: 0,
        activeMembers: 0,
        pendingMembers: 0,
        membersByRole: {} as Record<string, number>,
      }
    );

    return {
      ...memberStats,
      totalGroups: groups,
      upcomingEvents: events,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
```

### Group Service

```typescript
// src/services/groups/group.service.ts
import { prisma } from '@/lib/prisma';
import {
  Group,
  GroupMembership,
  GroupMeeting,
  GroupType,
  GroupRole,
  LocationType,
} from '@prisma/client';

interface CreateGroupInput {
  name: string;
  slug?: string;
  description?: string;
  type: GroupType;
  ministryId?: string;
  meetingDay?: string;
  meetingTime?: string;
  meetingFrequency?: string;
  locationType?: LocationType;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  virtualLink?: string;
  maxMembers?: number;
  targetAudience?: string;
  ageMin?: number;
  ageMax?: number;
  childcareProvided?: boolean;
  isPublic?: boolean;
  requiresApproval?: boolean;
  leaderId: string; // Required - primary leader
}

interface GroupFilters {
  type?: GroupType;
  ministryId?: string;
  isActive?: boolean;
  isPublic?: boolean;
  isOpen?: boolean;
  city?: string;
  meetingDay?: string;
  hasChildcare?: boolean;
  search?: string;
  nearLocation?: { lat: number; lng: number; radiusMiles: number };
}

export class GroupService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Create a new group
   */
  async create(data: CreateGroupInput): Promise<Group> {
    const slug = data.slug || this.generateSlug(data.name);

    // Create group and add leader in transaction
    return prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          tenantId: this.tenantId,
          name: data.name,
          slug,
          description: data.description,
          type: data.type,
          ministryId: data.ministryId,
          meetingDay: data.meetingDay,
          meetingTime: data.meetingTime,
          meetingFrequency: data.meetingFrequency,
          locationType: data.locationType || 'IN_PERSON',
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          virtualLink: data.virtualLink,
          maxMembers: data.maxMembers,
          targetAudience: data.targetAudience,
          ageMin: data.ageMin,
          ageMax: data.ageMax,
          childcareProvided: data.childcareProvided,
          isPublic: data.isPublic ?? true,
          requiresApproval: data.requiresApproval ?? false,
          currentMembers: 1,
        },
      });

      // Add leader
      await tx.groupMembership.create({
        data: {
          tenantId: this.tenantId,
          groupId: group.id,
          memberId: data.leaderId,
          role: 'LEADER',
          status: 'ACTIVE',
          approvedAt: new Date(),
        },
      });

      // Geocode address if provided
      if (data.address && data.city) {
        const coords = await this.geocodeAddress(
          `${data.address}, ${data.city}, ${data.state} ${data.zipCode}`
        );
        if (coords) {
          await tx.group.update({
            where: { id: group.id },
            data: { latitude: coords.lat, longitude: coords.lng },
          });
        }
      }

      return group;
    });
  }

  /**
   * Find groups with filters
   */
  async findMany(
    filters: GroupFilters = {},
    pagination: { page?: number; pageSize?: number } = {}
  ): Promise<{ items: Group[]; total: number }> {
    const { page = 1, pageSize = 20 } = pagination;
    const where: any = { tenantId: this.tenantId };

    if (filters.type) where.type = filters.type;
    if (filters.ministryId) where.ministryId = filters.ministryId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;
    if (filters.isOpen !== undefined) where.isOpen = filters.isOpen;
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.meetingDay) where.meetingDay = filters.meetingDay;
    if (filters.hasChildcare) where.childcareProvided = true;

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { targetAudience: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Location-based filtering
    let orderBy: any = [{ isFeatured: 'desc' }, { name: 'asc' }];

    const [items, total] = await Promise.all([
      prisma.group.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          ministry: { select: { id: true, name: true } },
          _count: { select: { members: { where: { status: 'ACTIVE' } } } },
          members: {
            where: { role: 'LEADER', status: 'ACTIVE' },
            include: {
              member: {
                select: { id: true, firstName: true, lastName: true, imageUrl: true },
              },
            },
            take: 2,
          },
        },
      }),
      prisma.group.count({ where }),
    ]);

    // Post-filter by distance if nearLocation specified
    let filteredItems = items;
    if (filters.nearLocation) {
      const { lat, lng, radiusMiles } = filters.nearLocation;
      filteredItems = items
        .filter((group) => {
          if (!group.latitude || !group.longitude) return false;
          const distance = this.calculateDistance(
            lat, lng,
            group.latitude, group.longitude
          );
          return distance <= radiusMiles;
        })
        .sort((a, b) => {
          const distA = this.calculateDistance(lat, lng, a.latitude!, a.longitude!);
          const distB = this.calculateDistance(lat, lng, b.latitude!, b.longitude!);
          return distA - distB;
        });
    }

    return { items: filteredItems, total };
  }

  /**
   * Get group by ID with full details
   */
  async findById(groupId: string): Promise<Group | null> {
    return prisma.group.findFirst({
      where: { id: groupId, tenantId: this.tenantId },
      include: {
        ministry: { select: { id: true, name: true, slug: true } },
        currentStudy: true,
        members: {
          where: { status: 'ACTIVE' },
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                imageUrl: true,
              },
            },
          },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
        meetings: {
          orderBy: { date: 'desc' },
          take: 10,
          include: {
            _count: { select: { attendance: true } },
          },
        },
        prayerRequests: {
          where: { status: 'ACTIVE', isPrivate: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        resources: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  /**
   * Join a group
   */
  async joinGroup(
    groupId: string,
    memberId: string,
    options: { message?: string } = {}
  ): Promise<GroupMembership> {
    const group = await prisma.group.findFirst({
      where: { id: groupId, tenantId: this.tenantId },
    });

    if (!group) throw new Error('Group not found');
    if (!group.isActive) throw new Error('Group is not active');
    if (!group.isOpen) throw new Error('Group is not accepting new members');
    if (group.maxMembers && group.currentMembers >= group.maxMembers) {
      throw new Error('Group is full');
    }

    // Check if already a member
    const existing = await prisma.groupMembership.findUnique({
      where: { groupId_memberId: { groupId, memberId } },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') throw new Error('Already a member');
      // Reactivate if previously left
      return prisma.groupMembership.update({
        where: { id: existing.id },
        data: {
          status: group.requiresApproval ? 'PENDING' : 'ACTIVE',
          leftAt: null,
          leftReason: null,
        },
      });
    }

    const membership = await prisma.groupMembership.create({
      data: {
        tenantId: this.tenantId,
        groupId,
        memberId,
        role: 'MEMBER',
        status: group.requiresApproval ? 'PENDING' : 'ACTIVE',
        approvedAt: group.requiresApproval ? null : new Date(),
        notes: options.message,
      },
    });

    // Update member count if approved
    if (!group.requiresApproval) {
      await prisma.group.update({
        where: { id: groupId },
        data: { currentMembers: { increment: 1 } },
      });
    }

    return membership;
  }

  /**
   * Leave a group
   */
  async leaveGroup(groupId: string, memberId: string, reason?: string): Promise<void> {
    const membership = await prisma.groupMembership.findUnique({
      where: { groupId_memberId: { groupId, memberId } },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new Error('Not a member of this group');
    }

    if (membership.role === 'LEADER') {
      // Check if there are other leaders
      const otherLeaders = await prisma.groupMembership.count({
        where: {
          groupId,
          role: { in: ['LEADER', 'CO_LEADER'] },
          status: 'ACTIVE',
          memberId: { not: memberId },
        },
      });

      if (otherLeaders === 0) {
        throw new Error('Cannot leave - you are the only leader. Assign another leader first.');
      }
    }

    await prisma.$transaction([
      prisma.groupMembership.update({
        where: { id: membership.id },
        data: {
          status: 'INACTIVE',
          leftAt: new Date(),
          leftReason: reason,
        },
      }),
      prisma.group.update({
        where: { id: groupId },
        data: { currentMembers: { decrement: 1 } },
      }),
    ]);
  }

  /**
   * Record a meeting
   */
  async createMeeting(
    groupId: string,
    data: {
      date: Date;
      title?: string;
      description?: string;
      lessonNumber?: number;
      lessonTitle?: string;
      notes?: string;
      createdBy: string;
    }
  ): Promise<GroupMeeting> {
    return prisma.groupMeeting.create({
      data: {
        tenantId: this.tenantId,
        groupId,
        ...data,
        status: 'SCHEDULED',
      },
    });
  }

  /**
   * Record attendance for a meeting
   */
  async recordAttendance(
    meetingId: string,
    attendees: Array<{ memberId?: string; memberName?: string; status: string }>
  ): Promise<void> {
    const meeting = await prisma.groupMeeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) throw new Error('Meeting not found');

    await prisma.$transaction(async (tx) => {
      // Clear existing attendance
      await tx.groupAttendance.deleteMany({ where: { meetingId } });

      // Add new attendance records
      await tx.groupAttendance.createMany({
        data: attendees.map((a) => ({
          tenantId: this.tenantId,
          meetingId,
          memberId: a.memberId,
          memberName: a.memberName,
          status: a.status as any,
        })),
      });

      // Update meeting stats
      const presentCount = attendees.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      const visitorCount = attendees.filter((a) => !a.memberId).length;

      await tx.groupMeeting.update({
        where: { id: meetingId },
        data: {
          attendeeCount: presentCount,
          visitorCount,
          status: 'COMPLETED',
        },
      });
    });
  }

  /**
   * Get group statistics
   */
  async getStats(groupId: string): Promise<{
    totalMembers: number;
    averageAttendance: number;
    meetingsThisMonth: number;
    activePrayerRequests: number;
    attendanceTrend: Array<{ date: string; count: number }>;
  }> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));

    const [members, meetings, prayerRequests, recentMeetings] = await Promise.all([
      prisma.groupMembership.count({
        where: { groupId, status: 'ACTIVE' },
      }),
      prisma.groupMeeting.count({
        where: { groupId, date: { gte: monthStart } },
      }),
      prisma.groupPrayer.count({
        where: { groupId, status: 'ACTIVE' },
      }),
      prisma.groupMeeting.findMany({
        where: {
          groupId,
          date: { gte: threeMonthsAgo },
          status: 'COMPLETED',
        },
        select: { date: true, attendeeCount: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    const totalAttendance = recentMeetings.reduce((sum, m) => sum + m.attendeeCount, 0);
    const averageAttendance = recentMeetings.length > 0
      ? Math.round(totalAttendance / recentMeetings.length)
      : 0;

    return {
      totalMembers: members,
      averageAttendance,
      meetingsThisMonth: meetings,
      activePrayerRequests: prayerRequests,
      attendanceTrend: recentMeetings.map((m) => ({
        date: m.date.toISOString().split('T')[0],
        count: m.attendeeCount,
      })),
    };
  }

  /**
   * AI-powered group matching
   */
  async findMatchingGroups(
    memberId: string,
    preferences: {
      types?: GroupType[];
      days?: string[];
      locationType?: LocationType;
      maxDistanceMiles?: number;
      hasChildcare?: boolean;
    }
  ): Promise<Array<Group & { matchScore: number; matchReasons: string[] }>> {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        family: true,
        groupMemberships: { select: { groupId: true } },
      },
    });

    if (!member) throw new Error('Member not found');

    // Get available groups
    const groups = await prisma.group.findMany({
      where: {
        tenantId: this.tenantId,
        isActive: true,
        isPublic: true,
        isOpen: true,
        id: { notIn: member.groupMemberships.map((m) => m.groupId) },
        ...(preferences.types && { type: { in: preferences.types } }),
        ...(preferences.days && { meetingDay: { in: preferences.days } }),
        ...(preferences.locationType && { locationType: preferences.locationType }),
        ...(preferences.hasChildcare && { childcareProvided: true }),
      },
      include: {
        _count: { select: { members: { where: { status: 'ACTIVE' } } } },
      },
    });

    // Score and rank groups
    const scoredGroups = groups.map((group) => {
      let score = 50; // Base score
      const reasons: string[] = [];

      // Life stage match
      if (group.lifeStage && member.maritalStatus) {
        const lifeStageMatch = this.checkLifeStageMatch(
          member.maritalStatus,
          member.family?.children?.length || 0,
          group.lifeStage
        );
        if (lifeStageMatch) {
          score += 20;
          reasons.push('Matches your life stage');
        }
      }

      // Age match
      if (member.birthDate && (group.ageMin || group.ageMax)) {
        const age = this.calculateAge(member.birthDate);
        if ((!group.ageMin || age >= group.ageMin) &&
            (!group.ageMax || age <= group.ageMax)) {
          score += 15;
          reasons.push('Age-appropriate');
        }
      }

      // Location match
      if (group.city && member.city) {
        if (group.city.toLowerCase() === member.city.toLowerCase()) {
          score += 15;
          reasons.push('In your city');
        }
      }

      // Capacity - prefer groups with room
      if (group.maxMembers) {
        const fillRate = group.currentMembers / group.maxMembers;
        if (fillRate < 0.7) {
          score += 10;
          reasons.push('Has availability');
        } else if (fillRate > 0.9) {
          score -= 10;
        }
      }

      // Childcare for families with children
      if (member.family?.children?.length && group.childcareProvided) {
        score += 15;
        reasons.push('Childcare provided');
      }

      return { ...group, matchScore: score, matchReasons: reasons };
    });

    // Sort by score and return top matches
    return scoredGroups
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results?.[0]?.geometry?.location) {
        return data.results[0].geometry.location;
      }
      return null;
    } catch {
      return null;
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private checkLifeStageMatch(
    maritalStatus: string,
    childrenCount: number,
    groupLifeStage: string
  ): boolean {
    const lowerStage = groupLifeStage.toLowerCase();

    if (lowerStage.includes('single') && maritalStatus === 'SINGLE') return true;
    if (lowerStage.includes('married') && maritalStatus === 'MARRIED') return true;
    if (lowerStage.includes('parent') && childrenCount > 0) return true;
    if (lowerStage.includes('young adult')) return true; // Generally open

    return false;
  }
}
```

---

## API Endpoints

### Group API Routes

```typescript
// src/app/api/[tenantSlug]/groups/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { GroupService } from '@/services/groups/group.service';
import { z } from 'zod';

const groupFiltersSchema = z.object({
  type: z.string().optional(),
  ministryId: z.string().optional(),
  city: z.string().optional(),
  meetingDay: z.string().optional(),
  hasChildcare: z.coerce.boolean().optional(),
  search: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().default(25),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(20),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const filters = groupFiltersSchema.parse(Object.fromEntries(searchParams));

    const groupService = new GroupService(tenant.id);

    const nearLocation = filters.lat && filters.lng
      ? { lat: filters.lat, lng: filters.lng, radiusMiles: filters.radius }
      : undefined;

    const result = await groupService.findMany(
      {
        type: filters.type as any,
        ministryId: filters.ministryId,
        city: filters.city,
        meetingDay: filters.meetingDay,
        hasChildcare: filters.hasChildcare,
        search: filters.search,
        isActive: true,
        isPublic: true,
        nearLocation,
      },
      { page: filters.page, pageSize: filters.pageSize }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get groups error:', error);
    return NextResponse.json(
      { error: 'Failed to get groups' },
      { status: 500 }
    );
  }
}

// src/app/api/[tenantSlug]/groups/[groupId]/join/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; groupId: string } }
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

    // Get member ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { member: true },
    });

    if (!user?.member) {
      return NextResponse.json({ error: 'Member profile not found' }, { status: 400 });
    }

    const body = await request.json();
    const groupService = new GroupService(tenant.id);

    const membership = await groupService.joinGroup(
      params.groupId,
      user.member.id,
      { message: body.message }
    );

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error('Join group error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to join group' },
      { status: 400 }
    );
  }
}

// src/app/api/[tenantSlug]/groups/matching/route.ts
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { member: true },
    });

    if (!user?.member) {
      return NextResponse.json({ error: 'Member profile not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);

    const groupService = new GroupService(tenant.id);
    const matches = await groupService.findMatchingGroups(user.member.id, {
      types: searchParams.get('types')?.split(',') as any[],
      days: searchParams.get('days')?.split(','),
      locationType: searchParams.get('locationType') as any,
      hasChildcare: searchParams.get('hasChildcare') === 'true',
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Group matching error:', error);
    return NextResponse.json(
      { error: 'Failed to find matching groups' },
      { status: 500 }
    );
  }
}
```

---

## Admin Components

### Ministry Management

```tsx
// src/components/admin/groups/MinistryManager.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Calendar,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { MinistryForm } from './MinistryForm';
import { toast } from 'sonner';

interface MinistryManagerProps {
  tenantSlug: string;
}

export function MinistryManager({ tenantSlug }: MinistryManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: ministries, isLoading } = useQuery({
    queryKey: ['ministries', tenantSlug],
    queryFn: async () => {
      const response = await fetch(`/api/admin/${tenantSlug}/ministries`);
      if (!response.ok) throw new Error('Failed to fetch ministries');
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ministryId: string) => {
      const response = await fetch(
        `/api/admin/${tenantSlug}/ministries/${ministryId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to delete ministry');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries', tenantSlug] });
      toast.success('Ministry deleted');
    },
    onError: () => {
      toast.error('Failed to delete ministry');
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ministries</h2>
          <p className="text-muted-foreground">
            Manage your church's ministry departments
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Ministry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ministries?.map((ministry: any) => (
          <Card key={ministry.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {ministry.imageUrl ? (
                    <img
                      src={ministry.imageUrl}
                      alt={ministry.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: ministry.color || '#3b82f6' }}
                    >
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{ministry.name}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {ministry.description}
                    </CardDescription>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingMinistry(ministry);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Members
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        if (confirm('Delete this ministry?')) {
                          deleteMutation.mutate(ministry.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{ministry._count?.members || 0} Members</span>
                </div>
                <div className="flex items-center gap-1">
                  <FolderOpen className="h-4 w-4" />
                  <span>{ministry._count?.groups || 0} Groups</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{ministry._count?.events || 0} Events</span>
                </div>
              </div>

              {ministry.members?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Leaders</p>
                  <div className="flex -space-x-2">
                    {ministry.members.slice(0, 5).map((mm: any) => (
                      <Avatar
                        key={mm.id}
                        className="h-8 w-8 border-2 border-background"
                      >
                        <AvatarImage src={mm.member.imageUrl} />
                        <AvatarFallback>
                          {mm.member.firstName[0]}
                          {mm.member.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {ministry._count?.members > 5 && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                        +{ministry._count.members - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Badge variant={ministry.isActive ? 'default' : 'secondary'}>
                  {ministry.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {ministry.isPublic && (
                  <Badge variant="outline">Public</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ministry Form Dialog */}
      <MinistryForm
        tenantSlug={tenantSlug}
        ministry={editingMinistry}
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingMinistry(null);
        }}
      />
    </div>
  );
}
```

### Group Finder (Public)

```tsx
// src/components/public/groups/GroupFinder.tsx
'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Clock,
  Video,
  Baby,
  Grid,
  List,
  Map,
  ChevronRight,
} from 'lucide-react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

interface GroupFinderProps {
  tenantSlug: string;
}

const GROUP_TYPES = [
  { value: 'SMALL_GROUP', label: 'Small Groups' },
  { value: 'SUNDAY_SCHOOL', label: 'Sunday School' },
  { value: 'SUPPORT_GROUP', label: 'Support Groups' },
  { value: 'INTEREST_GROUP', label: 'Interest Groups' },
  { value: 'MENS_GROUP', label: "Men's Groups" },
  { value: 'WOMENS_GROUP', label: "Women's Groups" },
  { value: 'YOUTH_GROUP', label: 'Youth Groups' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function GroupFinder({ tenantSlug }: GroupFinderProps) {
  const [view, setView] = useState<'grid' | 'list' | 'map'>('grid');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('');
  const [day, setDay] = useState<string>('');
  const [city, setCity] = useState('');
  const [hasChildcare, setHasChildcare] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['groups', tenantSlug, debouncedSearch, type, day, city, hasChildcare],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (type) params.set('type', type);
      if (day) params.set('meetingDay', day);
      if (city) params.set('city', city);
      if (hasChildcare) params.set('hasChildcare', 'true');

      const response = await fetch(`/api/${tenantSlug}/groups?${params}`);
      if (!response.ok) throw new Error('Failed to fetch groups');
      return response.json();
    },
  });

  const groups = data?.items || [];

  const groupsWithCoords = useMemo(
    () => groups.filter((g: any) => g.latitude && g.longitude),
    [groups]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">Find Your Community</h1>
        <p className="text-muted-foreground mt-2">
          Join a group to grow in faith, build meaningful relationships,
          and serve together.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Group Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {GROUP_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={day} onValueChange={setDay}>
              <SelectTrigger>
                <SelectValue placeholder="Meeting Day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Day</SelectItem>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="childcare"
                  checked={hasChildcare}
                  onCheckedChange={(checked) => setHasChildcare(!!checked)}
                />
                <Label htmlFor="childcare" className="text-sm">
                  <Baby className="h-4 w-4 inline mr-1" />
                  Childcare
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle & Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {groups.length} group{groups.length !== 1 ? 's' : ''} found
        </p>

        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="grid">
              <Grid className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="map" disabled={!isLoaded}>
              <Map className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No groups found</h3>
            <p className="text-muted-foreground mt-1">
              Try adjusting your filters or search terms
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grid View */}
          {view === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group: any) => (
                <GroupCard key={group.id} group={group} tenantSlug={tenantSlug} />
              ))}
            </div>
          )}

          {/* List View */}
          {view === 'list' && (
            <div className="space-y-4">
              {groups.map((group: any) => (
                <GroupListItem key={group.id} group={group} tenantSlug={tenantSlug} />
              ))}
            </div>
          )}

          {/* Map View */}
          {view === 'map' && isLoaded && (
            <Card className="overflow-hidden">
              <div className="h-[600px]">
                <GoogleMap
                  zoom={10}
                  center={
                    groupsWithCoords[0]
                      ? { lat: groupsWithCoords[0].latitude, lng: groupsWithCoords[0].longitude }
                      : { lat: 41.8781, lng: -87.6298 } // Default to Chicago
                  }
                  mapContainerClassName="w-full h-full"
                >
                  {groupsWithCoords.map((group: any) => (
                    <Marker
                      key={group.id}
                      position={{ lat: group.latitude, lng: group.longitude }}
                      title={group.name}
                    />
                  ))}
                </GoogleMap>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function GroupCard({ group, tenantSlug }: { group: any; tenantSlug: string }) {
  const leader = group.members?.find((m: any) => m.role === 'LEADER');

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1">{group.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {group.description}
            </CardDescription>
          </div>
          <Badge variant="outline">{group.type.replace('_', ' ')}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow space-y-3">
        {/* Meeting Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {group.meetingDay}s at {group.meetingTime}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {group.locationType === 'ONLINE' ? (
            <>
              <Video className="h-4 w-4" />
              <span>Online</span>
            </>
          ) : group.locationType === 'HYBRID' ? (
            <>
              <Video className="h-4 w-4" />
              <span>Hybrid - {group.city}</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" />
              <span>{group.city || 'Location TBD'}</span>
            </>
          )}
        </div>

        {/* Capacity */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {group._count?.members || 0}
            {group.maxMembers ? ` / ${group.maxMembers}` : ''} members
          </span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {group.childcareProvided && (
            <Badge variant="secondary">
              <Baby className="h-3 w-3 mr-1" />
              Childcare
            </Badge>
          )}
          {group.targetAudience && (
            <Badge variant="secondary">{group.targetAudience}</Badge>
          )}
          {!group.isOpen && (
            <Badge variant="destructive">Closed</Badge>
          )}
        </div>

        {/* Leader */}
        {leader && (
          <div className="flex items-center gap-2 pt-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={leader.member.imageUrl} />
              <AvatarFallback>
                {leader.member.firstName[0]}
                {leader.member.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">
                {leader.member.firstName} {leader.member.lastName}
              </p>
              <p className="text-muted-foreground">Group Leader</p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button className="w-full" asChild>
          <a href={`/${tenantSlug}/groups/${group.slug}`}>
            View Group
            <ChevronRight className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

function GroupListItem({ group, tenantSlug }: { group: any; tenantSlug: string }) {
  const leader = group.members?.find((m: any) => m.role === 'LEADER');

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-grow">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">{group.name}</h3>
              <Badge variant="outline">{group.type.replace('_', ' ')}</Badge>
            </div>

            <p className="text-muted-foreground mt-1 line-clamp-2">
              {group.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {group.meetingDay}s at {group.meetingTime}
              </span>

              <span className="flex items-center gap-1">
                {group.locationType === 'ONLINE' ? (
                  <>
                    <Video className="h-4 w-4" />
                    Online
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    {group.city}
                  </>
                )}
              </span>

              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {group._count?.members} members
              </span>

              {group.childcareProvided && (
                <span className="flex items-center gap-1">
                  <Baby className="h-4 w-4" />
                  Childcare
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 ml-6">
            {leader && (
              <div className="text-right">
                <Avatar className="h-10 w-10 ml-auto">
                  <AvatarImage src={leader.member.imageUrl} />
                  <AvatarFallback>
                    {leader.member.firstName[0]}
                    {leader.member.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium mt-1">
                  {leader.member.firstName}
                </p>
              </div>
            )}

            <Button asChild>
              <a href={`/${tenantSlug}/groups/${group.slug}`}>
                View
                <ChevronRight className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Best Practices

### Group Health Metrics

```typescript
// Group health scoring algorithm
const groupHealthFactors = {
  attendance: {
    weight: 0.25,
    thresholds: {
      excellent: 0.8,  // 80%+ average attendance
      good: 0.6,
      needsAttention: 0.4,
    },
  },
  engagement: {
    weight: 0.20,
    factors: ['messageActivity', 'prayerRequests', 'resourceAccess'],
  },
  growth: {
    weight: 0.15,
    thresholds: {
      growing: 0.1,    // 10%+ growth per quarter
      stable: 0,
      declining: -0.1,
    },
  },
  leaderEngagement: {
    weight: 0.20,
    factors: ['meetingConsistency', 'communicationFrequency', 'reportSubmission'],
  },
  memberRetention: {
    weight: 0.20,
    thresholds: {
      excellent: 0.9,  // 90%+ retention
      good: 0.75,
      needsAttention: 0.5,
    },
  },
};
```

### Volunteer Scheduling Best Practices

```typescript
// Scheduling configuration
const schedulingConfig = {
  // Advance notice
  minimumAdvanceNotice: 7,      // Days before service
  reminderSchedule: [7, 3, 1],  // Days before to send reminders

  // Rotation
  enableAutoRotation: true,
  maxConsecutiveWeeks: 3,
  minimumRestWeeks: 1,

  // Conflict handling
  allowSwaps: true,
  requireApproval: false,       // For swaps
  notifyLeadersOnConflict: true,

  // Blackout handling
  respectBlackoutDates: true,
  allowOverride: false,
};
```

---

## Related Documentation

- [11-member-management.md](./11-member-management.md) - Member profiles and assignments
- [12-events-calendar.md](./12-events-calendar.md) - Group events and meetings
- [14-communication.md](./14-communication.md) - Group messaging and notifications
- [17-authentication.md](./17-authentication.md) - Group leader permissions

---

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
**Maintained By**: Digital Church Platform Team
