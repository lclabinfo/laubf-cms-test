# 06. Core Feature Module Specifications

## Overview

Detailed feature specifications for each solution module. Defines core functionality, data model overview, and UI components for each module.

---

## 1. Website Module (Required)

### Overview

Core module for building and managing the official church website. Based on a template system with per-tenant customization capabilities.

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Template System | Select and customize various church templates | P0 |
| Page Builder | Drag-and-drop page editing | P0 |
| Media Management | Image/video upload and gallery | P0 |
| Menu Management | Navigation menu configuration | P0 |
| SEO Optimization | Metadata, automatic sitemap generation | P1 |
| Multi-language Support | Multi-language content management (i18n) | P1 |
| Blog/News | Church news and blog posting | P1 |
| Sermon Archive | Sermon video/audio archiving | P1 |

### Page Structure

```
Homepage
├── Hero Section (live banner, welcome message)
├── Service Times
├── Latest Sermons
├── Upcoming Events
├── Small Groups Introduction
└── Contact/Location

About
├── Church Introduction
├── Vision/Mission
├── Pastoral Staff
├── Church History
└── Facilities Guide

Sermons
├── Sermon List (by series, by date)
├── Sermon Detail (video, audio, notes)
├── Search and Filters
└── Series Pages

Events
├── Event Calendar
├── Event Details
├── Registration Forms
└── Past Events Archive

Connect
├── Small Groups Guide
├── Ministry Opportunities
├── New Visitor Welcome
└── Contact Form
```

### Template System

| Template Type | Description |
|---------------|-------------|
| Modern | Minimal, full-screen images, modern typography |
| Traditional | Classic layout, warm colors |
| Contemporary | Large church style, video-focused |
| Simple | Simple layout, fast loading |
| Community | Community-focused, social media integration |

---

## 2. Giving Module

### Overview

Online giving and donation system supporting various payment channels and recurring donations.

### Competitive Comparison

| Item | Tithely | Pushpay | **Digital Church** |
|------|---------|---------|-------------------|
| Card Fee | 3.5% + $0.30 | 2.9% + $0.30 | **2.0% + $0.25** |
| ACH Fee | 1.0% + $0.30 | 1.0% | **0.5%** |
| Recurring Giving | Yes | Yes | **Yes + Smart** |
| Text Giving | Yes | Yes | **Yes** |
| Kiosk | Basic | Premium | **Included** |
| Stock/Crypto | Limited | No | **Yes** |

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Online Giving Form | Website giving form | P0 |
| Recurring Giving | Weekly/monthly automatic payments | P0 |
| Multiple Funds | General, building fund, etc. | P0 |
| Payment Processing | Stripe, ACH integration | P0 |
| Giving Receipts | Automatic delivery (email/mail) | P0 |
| Campaigns | Special giving campaign pages | P1 |
| Pledge Management | Giving pledges and tracking | P1 |
| Text Giving | SMS Text-to-Give | P2 |
| Kiosk Mode | On-site giving kiosk | P2 |

### Giving Channels

```
┌────────────────────────────────────────────────────────────┐
│                    Giving Channels                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Website  │  │ Mobile   │  │ Text     │  │ Kiosk    │   │
│  │   Form   │  │   App    │  │ to Give  │  │  Mode    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │          │
│       └─────────────┴──────┬──────┴─────────────┘          │
│                            │                                │
│                            ▼                                │
│                 ┌──────────────────┐                       │
│                 │ Payment Gateway  │                       │
│                 │ • Stripe         │                       │
│                 │ • ACH Direct     │                       │
│                 │ • Apple/Google   │                       │
│                 └──────────────────┘                       │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Data Model Overview

| Entity | Description |
|--------|-------------|
| Donation | Individual giving transaction |
| Donor | Donor profile (Member connection) |
| GivingFund | Giving funds (general, building, etc.) |
| GivingCampaign | Special giving campaigns |
| RecurringDonation | Recurring giving settings |
| Pledge | Giving pledges |

### Admin Dashboard

```
Giving Dashboard
├── Giving Overview (today, this week, this month, annual)
├── Giving Trend Charts
├── Fund-by-Fund Status
├── Recurring Giving Status
├── Recent Donations List
└── Campaign Progress
```

---

## 3. Members Module

### Overview

Member management system providing integrated church member information, family relationships, attendance, and pastoral care management.

### Competitive Comparison

| Item | Planning Center | Breeze | **Digital Church** |
|------|-----------------|--------|-------------------|
| Member Profiles | Good | Basic | **Excellent** |
| Family Management | Good | Basic | **Excellent** |
| Custom Fields | Limited | Basic | **Unlimited** |
| Visitor Follow-up | Manual | Basic | **Automated** |
| Attendance Tracking | Good | Basic | **Multi-method** |
| Member Directory | Basic | Good | **Privacy Control** |

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Member Profiles | Contact info, photos, detailed information | P0 |
| Family Management | Family groups and relationship settings | P0 |
| Member Search | Advanced search and filters | P0 |
| Tags/Classification | Member classification tag system | P0 |
| Visitor Management | New visitor registration and follow-up | P1 |
| Attendance Tracking | Worship/event attendance records | P1 |
| Member Directory | Online member directory (privacy controls) | P1 |
| Pastoral Notes | Visit/counseling records (staff only) | P2 |
| Prayer Requests | Prayer request intake and management | P2 |

### Member Status Flow

```
Visitor → Regular Attender → Member → Active
                                  ↓
                              Inactive → Transferred/Removed
```

### Member Profile Structure

| Section | Fields |
|---------|--------|
| Basic Info | Name, birthdate, gender, contact info |
| Address | Residence, mailing address |
| Family Info | Family members, relationships, roles |
| Church Status | Member status, join date, baptism date, wedding date |
| Groups | Affiliated small groups, ministry involvement |
| Giving | Giving history summary (Giving integration) |
| Attendance | Attendance history and statistics |
| Custom Fields | Church-specific additional fields |

### Data Model Overview

| Entity | Description |
|--------|-------------|
| Member | Member profile |
| Family | Family group |
| MemberRelationship | Member-to-member relationships |
| Attendance | Attendance records |
| PastoralNote | Pastoral notes (staff only) |
| CareRequest | Visit/prayer requests |

---

## 4. Events Module

### Overview

Integrated system for church event creation, promotion, registration, and attendance management.

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Event Creation | Event information registration | P0 |
| Event Calendar | Monthly/weekly calendar views | P0 |
| Online Registration | Event attendance registration forms | P0 |
| Registration Management | Attendee list and management | P0 |
| Tickets/Paid Events | Paid event payments | P1 |
| Waitlist | Waitlist management for capacity overflow | P1 |
| Recurring Events | Regular event settings | P1 |
| Event Reminders | Email/push reminders | P1 |
| Check-in | Event day check-in | P2 |

### Event Types

| Type | Description |
|------|-------------|
| Worship Service | Sunday/Wednesday services |
| Special Event | Special events, seminars |
| Class | Educational courses, Bible study |
| Social | Fellowship, outings |
| Volunteer | Service activities |
| External | External events |

### Registration Form Structure

```
Registration Form
├── Personal Information (name, contact)
├── Custom Questions (allergies, transportation, etc.)
├── Companion Information (family/children)
├── Ticket Selection (paid events)
├── Payment (Giving integration)
└── Confirmation and Email Delivery
```

---

## 5. Groups Module

### Overview

Small group and ministry group management system. Supports group creation, member management, and communication.

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Group Creation | Create small groups/ministry teams | P0 |
| Group Search | Group directory and search | P0 |
| Member Management | Add/remove group members | P0 |
| Group Join Requests | Online group join requests | P1 |
| Group Communication | Group email/messaging | P1 |
| Attendance Tracking | Small group attendance records | P1 |
| Leader Tools | Leader-only dashboard | P2 |
| Group Schedule | Group-specific meeting schedules | P2 |

### Group Types

| Type | Description |
|------|-------------|
| Small Group | Small groups (cells, life groups, zones) |
| Ministry Team | Service ministry teams |
| Class | Educational groups |
| Age Group | Age-based groups (young adults, adults) |
| Interest | Interest-based groups |

### Group Roles

| Role | Permissions |
|------|-------------|
| Leader | Member management, attendance records, communication |
| Co-Leader | Attendance records, limited member management |
| Member | View group info, confirm attendance |

---

## 6. Mobile App Module

### Overview

iOS/Android native church app providing mobile interface for activated modules.

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Home Dashboard | Customized church home screen | P0 |
| Sermon Streaming | Live/VOD sermon viewing | P0 |
| Mobile Giving | In-app giving (Giving integration) | P0 |
| Push Notifications | Customized notification delivery | P0 |
| Events | Event viewing and registration (Events integration) | P1 |
| Groups | Small group info and communication (Groups integration) | P1 |
| Member Directory | Mobile member search (Members integration) | P1 |
| Prayer Requests | Prayer request intake/sharing | P1 |
| Check-in | Mobile attendance check-in | P2 |

### App Feature Mapping by Module

| Active Module | App Features |
|---------------|--------------|
| Website | Home, sermons, church info |
| Giving | Mobile giving, giving history |
| Members | Member directory, my profile |
| Events | Event list, registration |
| Groups | My groups, group messages |
| Streaming | Live streaming |
| Check-in | Mobile check-in |

### App Customization

| Item | Customization Options |
|------|----------------------|
| Branding | Logo, colors, app icon |
| Tab Configuration | Bottom tab menu order/visibility |
| Home Screen | Widget configuration and order |
| Push Settings | Per-notification-type settings |

---

## 7. Streaming Module

### Overview

Provides live worship streaming and VOD services.

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Live Streaming | RTMP/HLS live broadcast | P0 |
| Streaming Page | Church-customized live page | P0 |
| Live Chat | Viewer chat/comments | P1 |
| VOD Archive | Automatic recording storage | P1 |
| Scheduled Broadcast | Scheduled live settings | P1 |
| Multi-Platform | YouTube/Facebook simultaneous broadcast | P2 |
| Viewer Analytics | Viewer count, watch time analysis | P2 |

### Streaming Workflow

```
OBS/Encoder → RTMP Ingest → Transcoding → CDN → Viewer
                               ↓
                          DVR/Archive
```

### Platform Integration

| Platform | Integration Method |
|----------|-------------------|
| YouTube Live | RTMP simultaneous broadcast |
| Facebook Live | RTMP simultaneous broadcast |
| Vimeo | Embed integration |
| Custom RTMP | Direct configuration |

---

## 8. Check-in Module

### Overview

Child check-in and security system supporting parent/guardian verification and notifications.

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Self Check-in | Kiosk self check-in | P0 |
| Name Tag Printing | Automatic name tag printing | P0 |
| Guardian Matching | Security code matching system | P0 |
| SMS Notifications | Parent notification delivery | P0 |
| Family Check-in | Batch family check-in | P1 |
| Allergy/Medical Info | Medical info display on name tags | P1 |
| Attendance Reports | Child attendance statistics | P1 |
| Mobile Check-in | App pre-check-in | P2 |

### Check-in Flow

```
1. Search by phone number/member at kiosk
2. Select children and confirm class
3. Generate security code
4. Print name tags (child + guardian)
5. Verify security code at child pickup
6. Complete check-out
```

### Name Tag Layout

| Information | Location |
|-------------|----------|
| Child Name | Top center (large font) |
| Security Code | Top right |
| Class/Room Number | Center |
| Allergy Info | Bottom (red highlight) |
| Guardian Phone | Back side |

---

## 9. AI Shorts Creator Module

### Overview

Automatically generates SNS short-form videos from sermon recordings using AI.

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Auto Highlight Detection | AI identifies key moments | P0 |
| Clip Generation | Automatic 15-60 second clip creation | P0 |
| Caption Generation | Multi-language automatic caption generation | P0 |
| Template Application | Apply branding templates | P1 |
| Platform Optimization | TikTok/Reels/Shorts aspect ratios | P1 |
| Batch Generation | Multiple clip batch creation | P1 |
| Direct SNS Posting | Platform-integrated posting | P2 |

### AI Processing Pipeline

```
Input Video → Transcription → AI Analysis → Clip Selection
                                    ↓
              Rendering ← Template ← Subtitle Generation
                 ↓
          Multi-Format Export (9:16, 1:1, 16:9)
```

### Generation Options

| Option | Values |
|--------|--------|
| Clip Length | 15 sec, 30 sec, 60 sec |
| Aspect Ratio | 9:16 (TikTok), 1:1 (Instagram), 16:9 (YouTube) |
| Caption Style | Bottom, center, animated |
| Template | Basic, minimal, vibrant, custom |

---

## 10. AI Social Studio Module

### Overview

AI automatically generates social media posts based on church content.

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Sermon Quote Cards | Sermon key phrase graphics | P0 |
| Event Promotional Materials | Auto-generate flyers from events | P0 |
| Bible Verse Cards | Daily verse graphics | P0 |
| Template Library | Various design templates | P1 |
| Scheduled Posting | Scheduled post functionality | P1 |
| Caption Generation | AI caption/hashtag generation | P1 |
| Platform Integration | Direct Instagram/Facebook posting | P2 |

### Content Types

| Type | Source | Output |
|------|--------|--------|
| Quote Card | Sermon text | Quote graphic |
| Event Flyer | Events module data | Event poster |
| Bible Verse | Bible verse input | Verse card |
| Announcement | Announcement input | Social graphic |
| Story Card | Various content | Instagram Story format |

### Template Styles

| Style | Features |
|-------|----------|
| Modern | Minimal, sans-serif, gradients |
| Classic | Traditional, serif fonts, warm colors |
| Bold | Strong colors, large typography |
| Minimal | Simple, white space |
| Custom | Church branding customization |

---

## Module Integration Scenarios

### Scenario 1: Sunday Service

```
1. [Streaming] Live service broadcast
2. [Check-in] Child check-in
3. [Members] Service attendance record
4. [Giving] Service giving
5. [AI Shorts] Sermon highlight generation
6. [AI Social] Sermon quote card generation
```

### Scenario 2: Special Event

```
1. [Events] Event creation and promotion
2. [AI Social] Auto-generate event promotional materials
3. [Mobile App] Push notification delivery
4. [Events] Online registration intake
5. [Giving] Paid event payment
6. [Members] Attendee attendance record
```

### Scenario 3: New Visitor Connection

```
1. [Website] New visitor information input
2. [Members] Visitor profile creation
3. [Events] New visitor welcome event registration
4. [Groups] Small group recommendation/join
5. [Mobile App] App download guidance
6. [Giving] First-time giving guidance
```

---

## Implementation Priority Summary

### Phase 1 (MVP)

| Module | Core Features |
|--------|---------------|
| Website | Templates, page builder, media |
| Giving | Online giving, recurring giving, receipts |
| Members | Profiles, search, family management |
| Events | Event creation, registration, calendar |

### Phase 2 (Growth)

| Module | Core Features |
|--------|---------------|
| Groups | Group management, membership, communication |
| Mobile App | Basic app, giving, push notifications |
| Streaming | Live streaming, VOD |

### Phase 3 (Premium)

| Module | Core Features |
|--------|---------------|
| Check-in | Self check-in, name tags, SMS |
| AI Shorts | Auto clip generation, captions |
| AI Social | Auto content generation |

---

**Document Version**: 3.0 Enterprise Edition
**Related Documents**:
- [02-functional-requirements.md](./02-functional-requirements.md) - Functional requirements
- [05-modular-solutions.md](./05-modular-solutions.md) - Module pricing and dependencies
