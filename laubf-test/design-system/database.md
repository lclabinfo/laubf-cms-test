# Multi-Tenant Church CMS Database Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                        │
│   Next.js App  ←→  API Layer  ←→  DB Client (Drizzle/Prisma)    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     PostgreSQL (Primary)                        │
│                                                                 │
│  ┌──────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐ │
│  │ Tenancy  │  │  Content   │  │Page Builder│  │  Site Config │ │
│  │ Layer    │  │Collections │  │  (CMS)     │  │  & Design    │ │
│  └──────────┘  └────────────┘  └────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                       CDN (Images/Media)                        │
│              R2 / CloudFront / Cloudflare Images                │
└─────────────────────────────────────────────────────────────────┘
```

**Key Decisions:**
- **PostgreSQL** with RLS (Row-Level Security) for tenant isolation
- **JSONB** for section content (flexible schemas per section type) + **normalized tables** for queryable collections (events, messages, etc.)
- Every table partitioned by `church_id` (text slug like `'laubf'`) -- not UUIDs for church keys so they're human-readable and URL-friendly
- Images stored as CDN URLs (e.g., `https://cdn.churchplatform.com/laubf/images/hero.jpg`)

---

## 1. Tenancy Layer

```sql
-- ============================================================
-- CHURCHES (tenant root)
-- ============================================================
CREATE TABLE churches (
    id              TEXT PRIMARY KEY,           -- 'laubf', 'chicago-ubf', etc.
    name            TEXT NOT NULL,              -- 'Los Angeles UBF'
    slug            TEXT NOT NULL UNIQUE,       -- URL slug (same as id typically)
    domain          TEXT,                       -- custom domain: 'laubf.org'
    subdomain       TEXT UNIQUE,               -- platform subdomain: 'laubf.churchplatform.com'

    -- Branding
    logo_light_url  TEXT,                       -- CDN: light-mode logo
    logo_dark_url   TEXT,                       -- CDN: dark-mode logo
    favicon_url     TEXT,

    -- Metadata
    timezone        TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    locale          TEXT NOT NULL DEFAULT 'en-US',
    plan_tier       TEXT NOT NULL DEFAULT 'free',  -- 'free', 'pro', 'enterprise'

    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CHURCH MEMBERS / ADMINS (auth & permissions)
-- ============================================================
CREATE TABLE church_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),
    email           TEXT NOT NULL,
    name            TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'editor',  -- 'owner', 'admin', 'editor', 'viewer'
    avatar_url      TEXT,
    auth_provider   TEXT NOT NULL DEFAULT 'email',   -- 'email', 'google', 'apple'
    auth_provider_id TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(church_id, email)
);

CREATE INDEX idx_church_users_church ON church_users(church_id);
```

---

## 2. Site Configuration & Design

```sql
-- ============================================================
-- SITE SETTINGS (church-wide config: contact, social, SEO)
-- ============================================================
CREATE TABLE site_settings (
    church_id       TEXT PRIMARY KEY REFERENCES churches(id),

    -- Contact
    address_lines   TEXT[] NOT NULL DEFAULT '{}',    -- ['1234 Main St', 'Long Beach, CA 90808']
    phone           TEXT,
    email           TEXT,
    directions_url  TEXT,

    -- Social
    social_links    JSONB NOT NULL DEFAULT '[]',     -- [{platform, href, visible}]

    -- SEO
    site_title      TEXT,                            -- 'LA UBF — University Bible Fellowship'
    site_description TEXT,
    og_image_url    TEXT,

    -- Footer
    footer_description TEXT,
    copyright_text  TEXT,
    footer_columns  JSONB NOT NULL DEFAULT '[]',     -- [{heading, links: [{label, href, external}]}]

    -- Navbar
    navbar_cta      JSONB,                           -- {label, href, visible}
    member_login    JSONB,                           -- {label, href, visible}

    -- Giving
    giving_url      TEXT,
    giving_enabled  BOOLEAN NOT NULL DEFAULT FALSE,

    -- Livestream
    livestream_url  TEXT,

    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DESIGN TOKENS (per-church theme overrides)
-- ============================================================
CREATE TABLE design_tokens (
    church_id       TEXT PRIMARY KEY REFERENCES churches(id),

    -- Color overrides (null = use platform defaults)
    color_black_1   TEXT,   -- '#0D0D0D'
    color_black_2   TEXT,
    color_black_3   TEXT,
    color_white_0   TEXT,
    color_white_1   TEXT,   -- '#FAFAFA'
    color_white_1_5 TEXT,
    color_white_2   TEXT,
    color_white_2_5 TEXT,
    color_white_3   TEXT,
    color_brand_1   TEXT,   -- '#3667B1'
    color_brand_2   TEXT,
    color_accent_green TEXT,
    color_accent_blue  TEXT,
    color_accent_orange TEXT,

    -- Font overrides
    font_sans       TEXT,   -- '"Helvetica Neue", sans-serif'
    font_serif      TEXT,
    font_display    TEXT,
    font_script     TEXT,

    -- Event type colors (JSONB map: type → color)
    event_type_colors JSONB NOT NULL DEFAULT '{"meeting":"#009966","event":"#155DFC","program":"#FF8C00"}',

    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NAVIGATION (menu structure)
-- ============================================================
CREATE TABLE navigation_menus (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),
    location        TEXT NOT NULL DEFAULT 'main',    -- 'main', 'footer', 'mobile'
    items           JSONB NOT NULL DEFAULT '[]',     -- Full nav tree (dropdowns, sections, links)
    -- Mirrors nav-data.ts structure: [{id, label, sections: [{title, items, footerLink}], featuredCard}]

    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(church_id, location)
);
```

---

## 3. Content Collections

```sql
-- ============================================================
-- MINISTRIES (young-adult, adult, children, high-school, etc.)
-- ============================================================
CREATE TABLE ministries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),
    slug            TEXT NOT NULL,                    -- 'young-adult', 'adult', 'children'
    name            TEXT NOT NULL,                    -- 'Young Adult', 'Adult'
    description     TEXT,
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(church_id, slug)
);

CREATE INDEX idx_ministries_church ON ministries(church_id);

-- ============================================================
-- CAMPUSES
-- ============================================================
CREATE TABLE campuses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),
    slug            TEXT NOT NULL,                    -- 'csulb', 'ucla', 'usc'
    abbreviation    TEXT NOT NULL,                    -- 'CSULB'
    full_name       TEXT NOT NULL,                    -- 'Cal State Long Beach'

    -- Campus page content
    club_name       TEXT,                             -- 'True Vine Club'
    description     TEXT,

    -- Schedule
    schedule_entries JSONB NOT NULL DEFAULT '[]',     -- [{day, time, location}]

    -- Contact
    email           TEXT,
    social_links    JSONB NOT NULL DEFAULT '[]',      -- [{platform, href}]

    -- Media
    hero_image_url  TEXT,
    hero_image_alt  TEXT,
    hero_image_position TEXT DEFAULT 'center',
    logo_url        TEXT,

    -- Location
    address_lines   TEXT[],
    directions_url  TEXT,
    meeting_url     TEXT,                             -- Zoom/online meeting link

    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(church_id, slug)
);

CREATE INDEX idx_campuses_church ON campuses(church_id);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),
    slug            TEXT NOT NULL,
    title           TEXT NOT NULL,

    -- Classification
    event_type      TEXT NOT NULL DEFAULT 'event',    -- 'meeting', 'event', 'program'
    ministry_id     UUID REFERENCES ministries(id),
    campus_id       UUID REFERENCES campuses(id),     -- NULL = church-wide

    -- Dates
    date_start      DATE NOT NULL,
    date_end        DATE,
    time_display    TEXT NOT NULL,                    -- '7:00 PM - 9:00 PM'

    -- Location
    location        TEXT NOT NULL,

    -- Content
    description     TEXT NOT NULL,                    -- Short description for cards
    body            TEXT,                              -- Rich HTML for detail page

    -- Media
    image_url       TEXT,
    image_alt       TEXT,
    image_position  TEXT DEFAULT 'center',            -- CSS object-position

    -- Flags
    badge           TEXT,                              -- 'UPCOMING', 'FEATURED', 'NEW'
    is_recurring    BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,

    -- Links
    meeting_url     TEXT,                              -- For recurring: Zoom link
    registration_url TEXT,
    external_links  JSONB NOT NULL DEFAULT '[]',       -- [{label, href, external}]

    -- Tags (for filtering and admin)
    tags            TEXT[] NOT NULL DEFAULT '{}',

    -- Status
    status          TEXT NOT NULL DEFAULT 'published', -- 'draft', 'published', 'archived'

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(church_id, slug)
);

CREATE INDEX idx_events_church ON events(church_id);
CREATE INDEX idx_events_church_date ON events(church_id, date_start DESC);
CREATE INDEX idx_events_church_type ON events(church_id, event_type);
CREATE INDEX idx_events_church_ministry ON events(church_id, ministry_id);
CREATE INDEX idx_events_church_featured ON events(church_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_events_church_recurring ON events(church_id, is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX idx_events_church_status ON events(church_id, status);

-- ============================================================
-- MESSAGES (Sermons)
-- ============================================================
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),
    slug            TEXT NOT NULL,
    title           TEXT NOT NULL,

    -- Video
    youtube_id      TEXT,                              -- YouTube video ID
    video_url       TEXT,                              -- Alternative video URL

    -- Metadata
    speaker         TEXT NOT NULL,
    series          TEXT NOT NULL DEFAULT 'Sunday Message',
    passage         TEXT NOT NULL,                     -- 'Acts 2:1-47'
    date_for        DATE NOT NULL,                     -- The date this message was for
    description     TEXT,
    duration        TEXT,                               -- '1:24:33'

    -- Transcripts
    raw_transcript  TEXT,                               -- Prepared/written transcript (HTML)
    live_transcript TEXT,                               -- Auto-generated transcript (HTML)

    -- Relations
    related_study_id UUID,                              -- FK to bible_studies (set after both exist)

    -- Flags
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,

    -- Status
    status          TEXT NOT NULL DEFAULT 'published',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(church_id, slug)
);

CREATE INDEX idx_messages_church ON messages(church_id);
CREATE INDEX idx_messages_church_date ON messages(church_id, date_for DESC);
CREATE INDEX idx_messages_church_series ON messages(church_id, series);
CREATE INDEX idx_messages_church_speaker ON messages(church_id, speaker);

-- ============================================================
-- BIBLE STUDIES
-- ============================================================
CREATE TABLE bible_studies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),
    slug            TEXT NOT NULL,
    title           TEXT NOT NULL,

    -- Bible reference
    book            TEXT NOT NULL,                      -- 'John', 'Romans', 'Genesis'
    passage         TEXT NOT NULL,                      -- 'John 21:1-25'

    -- Dates
    date_posted     DATE NOT NULL,
    date_for        DATE NOT NULL,                     -- Matches the sermon date

    -- Metadata
    series          TEXT NOT NULL DEFAULT 'Sunday Message',
    messenger       TEXT,                               -- Who delivered the related message

    -- Key verse
    key_verse_ref   TEXT,                               -- 'John 21:15'
    key_verse_text  TEXT,

    -- Rich text content (HTML from TinyMCE/editor)
    questions       TEXT,                               -- Study questions
    answers         TEXT,                               -- Study answers/guide
    transcript      TEXT,                               -- Message transcript
    bible_text      TEXT,                               -- Scripture text

    -- Flags
    has_questions   BOOLEAN NOT NULL DEFAULT FALSE,
    has_answers     BOOLEAN NOT NULL DEFAULT FALSE,
    has_transcript  BOOLEAN NOT NULL DEFAULT FALSE,

    -- Relations
    related_message_id UUID,                            -- FK to messages

    -- Status
    status          TEXT NOT NULL DEFAULT 'published',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(church_id, slug)
);

CREATE INDEX idx_bible_studies_church ON bible_studies(church_id);
CREATE INDEX idx_bible_studies_church_date ON bible_studies(church_id, date_for DESC);
CREATE INDEX idx_bible_studies_church_book ON bible_studies(church_id, book);
CREATE INDEX idx_bible_studies_church_series ON bible_studies(church_id, series);

-- ============================================================
-- BIBLE STUDY ATTACHMENTS
-- ============================================================
CREATE TABLE bible_study_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bible_study_id  UUID NOT NULL REFERENCES bible_studies(id) ON DELETE CASCADE,
    church_id       TEXT NOT NULL REFERENCES churches(id),

    name            TEXT NOT NULL,                      -- 'John 21 Study Guide.pdf'
    url             TEXT NOT NULL,                      -- CDN URL
    file_type       TEXT NOT NULL DEFAULT 'pdf',        -- 'pdf', 'docx', 'image', 'other'
    file_size_bytes BIGINT,
    sort_order      INT NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bsa_study ON bible_study_attachments(bible_study_id);
CREATE INDEX idx_bsa_church ON bible_study_attachments(church_id);

-- ============================================================
-- DAILY BREAD (Devotionals)
-- ============================================================
CREATE TABLE daily_breads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),
    slug            TEXT NOT NULL,
    title           TEXT NOT NULL,

    date            DATE NOT NULL,
    passage         TEXT NOT NULL,                      -- 'Psalm 2:1-12'
    key_verse       TEXT,                               -- Verse number: '12'

    body            TEXT NOT NULL,                      -- HTML devotional content
    bible_text      TEXT,                               -- HTML scripture text

    author          TEXT NOT NULL,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    audio_url       TEXT,                               -- CDN URL for audio

    status          TEXT NOT NULL DEFAULT 'published',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(church_id, slug),
    UNIQUE(church_id, date)                             -- One per day per church
);

CREATE INDEX idx_daily_breads_church ON daily_breads(church_id);
CREATE INDEX idx_daily_breads_church_date ON daily_breads(church_id, date DESC);

-- ============================================================
-- VIDEOS (non-sermon media: promos, testimonies, recaps)
-- ============================================================
CREATE TABLE videos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),
    slug            TEXT NOT NULL,
    title           TEXT NOT NULL,

    youtube_id      TEXT,
    video_url       TEXT,

    category        TEXT NOT NULL DEFAULT 'Special Feature',  -- 'Event Recap', 'Worship', 'Testimony', etc.
    date_published  DATE NOT NULL,
    duration        TEXT,                                       -- '3:45'
    description     TEXT,
    is_short        BOOLEAN NOT NULL DEFAULT FALSE,            -- YouTube Short (vertical)
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,

    status          TEXT NOT NULL DEFAULT 'published',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(church_id, slug)
);

CREATE INDEX idx_videos_church ON videos(church_id);
CREATE INDEX idx_videos_church_date ON videos(church_id, date_published DESC);
CREATE INDEX idx_videos_church_category ON videos(church_id, category);

-- ============================================================
-- TEAM MEMBERS (staff, leaders, shepherds)
-- ============================================================
CREATE TABLE team_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),

    name            TEXT NOT NULL,
    role            TEXT NOT NULL,                      -- 'Campus Coordinator', 'Bible Teacher'
    email           TEXT,

    image_url       TEXT,
    image_alt       TEXT,
    image_position  TEXT DEFAULT 'center',

    -- Associations (a member can belong to a ministry and/or campus)
    ministry_id     UUID REFERENCES ministries(id),
    campus_id       UUID REFERENCES campuses(id),

    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_team_members_church ON team_members(church_id);
CREATE INDEX idx_team_members_ministry ON team_members(ministry_id);
CREATE INDEX idx_team_members_campus ON team_members(campus_id);

-- ============================================================
-- FAQS
-- ============================================================
CREATE TABLE faqs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),

    question        TEXT NOT NULL,
    answer          TEXT NOT NULL,                      -- Can be HTML

    -- Context: which page/section does this FAQ belong to?
    context         TEXT NOT NULL DEFAULT 'general',    -- 'general', 'im-new', 'campus:csulb', 'ministry:college'
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_faqs_church ON faqs(church_id);
CREATE INDEX idx_faqs_church_context ON faqs(church_id, context);

-- ============================================================
-- MEDIA LIBRARY (CDN-backed asset registry)
-- ============================================================
CREATE TABLE media (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),

    url             TEXT NOT NULL,                      -- CDN URL
    filename        TEXT NOT NULL,
    alt_text        TEXT,

    mime_type       TEXT NOT NULL,                      -- 'image/jpeg', 'video/mp4', 'application/pdf'
    file_size_bytes BIGINT,
    width           INT,                               -- For images
    height          INT,

    -- Organization
    folder          TEXT DEFAULT '/',                   -- '/images/events/', '/attachments/'
    tags            TEXT[] NOT NULL DEFAULT '{}',

    uploaded_by     UUID REFERENCES church_users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_church ON media(church_id);
CREATE INDEX idx_media_church_folder ON media(church_id, folder);
CREATE INDEX idx_media_church_mime ON media(church_id, mime_type);
```

---

## 4. Page Builder (CMS Sections)

```sql
-- ============================================================
-- PAGES (each church has multiple pages)
-- ============================================================
CREATE TABLE pages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),
    slug            TEXT NOT NULL,                      -- 'home', 'about', 'im-new', 'giving'
    title           TEXT NOT NULL,

    -- SEO
    meta_title      TEXT,
    meta_description TEXT,
    og_image_url    TEXT,

    -- Page-level settings
    page_type       TEXT NOT NULL DEFAULT 'custom',     -- 'home', 'about', 'ministry', 'campus', 'events-listing', 'custom'

    -- For ministry/campus pages, link to the entity
    ministry_id     UUID REFERENCES ministries(id),
    campus_id       UUID REFERENCES campuses(id),

    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    published_at    TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(church_id, slug)
);

CREATE INDEX idx_pages_church ON pages(church_id);

-- ============================================================
-- PAGE SECTIONS (ordered sections within a page)
-- This is the core of the Builder/CMS
-- ============================================================
CREATE TABLE page_sections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id         UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    church_id       TEXT NOT NULL REFERENCES churches(id),

    -- Section identity
    section_type    TEXT NOT NULL,                      -- Matches SectionType union:
                                                        -- 'hero-banner', 'media-text', 'highlight-cards',
                                                        -- 'event-calendar', 'quote-banner', 'action-card-grid',
                                                        -- 'directory-list', 'spotlight-media', 'media-grid',
                                                        -- 'cta-banner', 'footer', 'page-hero', 'feature-breakdown',
                                                        -- 'pathway-card', 'timeline', 'location-detail',
                                                        -- 'campus-card-grid', 'form', 'faq', 'text-image-hero',
                                                        -- 'about-description', 'pillars', 'statement',
                                                        -- 'ministry-hero', 'ministry-intro', 'ministry-schedule',
                                                        -- 'meet-team', 'photo-gallery', 'upcoming-events',
                                                        -- 'events-hero', 'quick-links', 'all-events',
                                                        -- 'all-messages', 'all-videos', 'all-bible-studies'

    -- Ordering
    sort_order      INT NOT NULL DEFAULT 0,

    -- Base settings (every section has these)
    visible         BOOLEAN NOT NULL DEFAULT TRUE,
    color_scheme    TEXT NOT NULL DEFAULT 'light',      -- 'light', 'dark'
    padding_y       TEXT DEFAULT 'default',             -- 'compact', 'default', 'spacious'
    container_width TEXT DEFAULT 'standard',            -- 'standard', 'narrow', 'full'
    enable_animations BOOLEAN DEFAULT TRUE,

    -- Section-specific content (JSONB — schema varies by section_type)
    -- This stores the `content` object from each section's props interface
    -- Example for hero-banner:
    --   {"heading":{"line1":"Welcome to","line2":"LA UBF"},
    --    "subheading":"...",
    --    "primaryButton":{"label":"I'm new","href":"/im-new","visible":true},
    --    "backgroundImage":{"src":"https://cdn.../hero.mp4","alt":"..."}}
    content         JSONB NOT NULL DEFAULT '{}',

    -- Section-specific settings beyond base (JSONB)
    -- Example for hero-banner: {"showSubheading": true}
    -- Example for text-image-hero: {"textAlign": "left"}
    settings        JSONB NOT NULL DEFAULT '{}',

    -- Audit
    last_edited_by  UUID REFERENCES church_users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_page_sections_page ON page_sections(page_id, sort_order);
CREATE INDEX idx_page_sections_church ON page_sections(church_id);

-- ============================================================
-- SPIRITUAL DIRECTION (yearly theme — one active per church)
-- ============================================================
CREATE TABLE spiritual_directions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),

    year            INT NOT NULL,
    theme_title     TEXT NOT NULL,                      -- 'Not of the World'
    verse_text      TEXT NOT NULL,
    verse_reference TEXT NOT NULL,                      -- 'John 17:14-16'

    is_active       BOOLEAN NOT NULL DEFAULT FALSE,    -- Only one active per church

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(church_id, year)
);

CREATE INDEX idx_spiritual_dir_church ON spiritual_directions(church_id);
CREATE INDEX idx_spiritual_dir_active ON spiritual_directions(church_id, is_active) WHERE is_active = TRUE;

-- ============================================================
-- FORM SUBMISSIONS (contact forms, interest forms, etc.)
-- ============================================================
CREATE TABLE form_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id       TEXT NOT NULL REFERENCES churches(id),

    form_context    TEXT NOT NULL,                      -- 'im-new', 'campus:csulb', 'contact'
    data            JSONB NOT NULL,                     -- {name, email, interests: [], campus, message}

    status          TEXT NOT NULL DEFAULT 'new',        -- 'new', 'reviewed', 'contacted', 'archived'

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_form_submissions_church ON form_submissions(church_id);
CREATE INDEX idx_form_submissions_church_ctx ON form_submissions(church_id, form_context);
CREATE INDEX idx_form_submissions_status ON form_submissions(church_id, status);
```

---

## 5. Row-Level Security (Tenant Isolation)

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_breads ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Policy pattern (repeat for each table):
-- The app sets `current_setting('app.church_id')` on each connection
CREATE POLICY tenant_isolation ON events
    USING (church_id = current_setting('app.church_id')::TEXT);

-- Public read access (for website visitors, no auth needed)
CREATE POLICY public_read ON events
    FOR SELECT USING (status = 'published');
```

---

## 6. Scaling Strategy

### Indexing Strategy
```
Every table: PRIMARY on (id), INDEX on (church_id)
Events:      COMPOSITE on (church_id, date_start DESC) — primary query pattern
Messages:    COMPOSITE on (church_id, date_for DESC)
Bible Studies: COMPOSITE on (church_id, date_for DESC), (church_id, book)
Daily Breads:  COMPOSITE on (church_id, date DESC)
Videos:      COMPOSITE on (church_id, date_published DESC)
Page Sections: COMPOSITE on (page_id, sort_order) — the builder query
```

### Partitioning Plan (at 10k+ churches)
```sql
-- When scaling beyond 5k churches, partition large tables by church_id hash
-- Events, messages, bible_studies, page_sections are the highest-volume tables

-- Example: partition events by church_id hash (16 partitions)
CREATE TABLE events_partitioned (LIKE events INCLUDING ALL)
    PARTITION BY HASH (church_id);

CREATE TABLE events_p0 PARTITION OF events_partitioned FOR VALUES WITH (MODULUS 16, REMAINDER 0);
CREATE TABLE events_p1 PARTITION OF events_partitioned FOR VALUES WITH (MODULUS 16, REMAINDER 1);
-- ... through p15
```

### Caching Strategy
```
Layer 1: CDN edge cache for all images/media (R2/CloudFront)
Layer 2: Redis/Valkey for hot data:
  - Page section configs (key: "page:{church_id}:{page_slug}")
  - Site settings (key: "settings:{church_id}")
  - Design tokens (key: "tokens:{church_id}")
  - Navigation (key: "nav:{church_id}")
  TTL: 5 minutes, invalidated on CMS save
Layer 3: PostgreSQL connection pooling (PgBouncer/Supavisor)
```

### Volume Estimates at 10k Churches
```
churches:           10,000 rows
events:             ~500k rows (50 events/church avg)
messages:           ~2.5M rows (5 years × 52 weeks × ~1 per week)
bible_studies:      ~2.5M rows (mirrors messages)
daily_breads:       ~3.6M rows (1/day × 365 × years)
videos:             ~200k rows (20 videos/church)
page_sections:      ~1M rows (10 pages × 10 sections × 10k churches)
media:              ~5M rows (500 assets/church)
```

---

## 7. Entity Relationship Summary

```
churches (1)
  ├── site_settings (1:1)
  ├── design_tokens (1:1)
  ├── navigation_menus (1:N)
  ├── church_users (1:N)
  ├── ministries (1:N)
  │     └── team_members (1:N)
  ├── campuses (1:N)
  │     └── team_members (1:N)
  ├── events (1:N) → ministry, campus
  ├── messages (1:N) → related bible_study
  ├── bible_studies (1:N) → related message
  │     └── bible_study_attachments (1:N)
  ├── daily_breads (1:N)
  ├── videos (1:N)
  ├── spiritual_directions (1:N, 1 active)
  ├── faqs (1:N)
  ├── media (1:N)
  ├── form_submissions (1:N)
  └── pages (1:N)
        └── page_sections (1:N, ordered)
              └── content (JSONB) → references events, messages,
                  videos, campuses, media by ID/URL
```

---

## 8. Design Rationale

| Decision | Rationale |
|----------|-----------|
| **`church_id` as TEXT slug** | Human-readable (`'laubf'`), URL-friendly, natural partition key. No UUID-to-slug mapping needed. |
| **Normalized content tables** (events, messages, etc.) | These are queried with filters, sorting, date ranges, full-text search. JSONB would make this painful. |
| **JSONB for page section `content`** | Each of your 30+ section types has a different content shape. Normalizing 30+ content tables would be over-engineering. The content is read as a blob and rendered. |
| **Separate `content` + `settings` JSONB columns** | Content is what pastors edit (text, images). Settings are presentation (spacing, layout). Clean separation for the CMS editor UI. |
| **RLS over schema-per-tenant** | PostgreSQL RLS scales better than 10k schemas. Single connection pool. Standard queries. |
| **`status` field on content** | Supports draft/published workflow without a separate drafts table. |
| **CDN URLs stored directly** | No binary storage in DB. Media table is a registry/index. Actual files on R2/CloudFront. |
| **`sort_order` INT** | Simple, efficient ordering for page sections, team members, campuses. Reorder = update sort_order. |
| **Cross-references via UUID** | messages ↔ bible_studies, events → ministries/campuses. Enables the "Related Study" and filtering patterns already in the codebase. |

This design directly maps to every mock data file, every section type, every page, and every design token in the current codebase — while being ready for 10k+ churches from day one.
