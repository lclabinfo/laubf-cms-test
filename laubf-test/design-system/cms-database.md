# CMS & Website Builder — Database Schema

> Canonical schema reference for the multi-tenant website builder platform. Industry-agnostic — works for churches, restaurants, portfolios, agencies, or any website.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                        │
│   Next.js App  ←→  API Layer  ←→  DB Client (Drizzle/Prisma)   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     PostgreSQL (Primary)                        │
│                                                                 │
│  ┌──────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐│
│  │ Tenancy  │  │   Theme    │  │Page Builder │  │   Content    ││
│  │ (3)      │  │  System(4) │  │  (3)        │  │  Types (12)  ││
│  └──────────┘  └────────────┘  └────────────┘  └──────────────┘│
│                     ┌────────────┐                              │
│                     │ Site Config│                              │
│                     │    (2)     │                              │
│                     └────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

**Key Decisions:**
- **PostgreSQL** with RLS for tenant isolation
- **UUID primary keys** everywhere (except site_settings which uses site_id as PK)
- **JSONB** for section content (flexible per section type) + **dedicated tables** for universal content types + **generic collections** for site-specific custom types
- All tenant-scoped tables keyed by `site_id` (UUID FK → sites)
- Images/media stored as CDN URLs — `media` table is a registry, not binary storage

---

## Table Overview (24 tables, 5 domains)

| Domain | Tables | Purpose |
|--------|--------|---------|
| **Tenancy** (3) | `organizations`, `sites`, `site_users` | Multi-tenant foundation |
| **Theme System** (4) | `color_palettes`, `color_palette_tokens`, `font_configurations`, `semantic_color_mappings` | Design tokens as rows, not hardcoded columns |
| **Site Config** (2) | `site_settings`, `navigation_menus` | Global config and nav structures |
| **Page Builder** (3) | `pages`, `page_sections`, `section_templates` | Visual page composition engine |
| **Known Content** (6) | `events`, `team_members`, `posts`, `media_items`, `faqs`, `testimonials` | Universal content types with typed columns |
| **Custom Content & Assets** (6) | `collections`, `collection_fields`, `collection_items`, `media`, `forms`, `form_submissions` | Generic system for site-specific types + asset registry |

---

## 1. Tenancy

```sql
-- ============================================================
-- ORGANIZATIONS (tenant root / billing entity)
-- ============================================================
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,                -- "Los Angeles UBF", "Joe's Bistro"
    slug            TEXT NOT NULL UNIQUE,          -- "laubf", "joes-bistro"
    plan_tier       TEXT NOT NULL DEFAULT 'free',  -- "free", "pro", "enterprise"
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SITES (a website belonging to an org — one org can have many)
-- ============================================================
CREATE TABLE sites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL,                  -- UNIQUE per org
    custom_domain   TEXT,                           -- "laubf.org"
    subdomain       TEXT UNIQUE,                    -- "laubf.builder.com"
    logo_url        TEXT,
    logo_dark_url   TEXT,                           -- variant for dark backgrounds
    favicon_url     TEXT,
    timezone        TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    locale          TEXT NOT NULL DEFAULT 'en-US',
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(org_id, slug)
);

CREATE INDEX idx_sites_org ON sites(org_id);

-- ============================================================
-- SITE USERS (role-based access per site)
-- ============================================================
CREATE TABLE site_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    email           TEXT NOT NULL,
    name            TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'editor',  -- "owner", "admin", "editor", "viewer"
    avatar_url      TEXT,
    auth_provider   TEXT NOT NULL DEFAULT 'email',   -- "email", "google", "apple"
    auth_provider_id TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(site_id, email)
);

CREATE INDEX idx_site_users_site ON site_users(site_id);
```

---

## 2. Theme System

### Color Palette System

**Design:** Palettes as rows with semantic roles — not color-specific column names like `color_black_1`.

Sections reference palettes by slug (`color_palette: "light"`). At render time, palette tokens become CSS custom properties (`--color-bg`, `--color-text-primary`, etc.).

```
color_palettes (per site)
├── id, site_id, name ("light"), slug ("light"), is_default
│
└── color_palette_tokens (per palette)
    ├── role: "bg"              → value: "#FAFAFA"
    ├── role: "surface"         → value: "#F2F2F2"
    ├── role: "text-primary"    → value: "#0D0D0D"
    ├── role: "text-secondary"  → value: "#313131"
    ├── role: "text-muted"      → value: "#676767"
    ├── role: "border"          → value: "#E8E8E8"
    ├── role: "btn-primary-bg"  → value: "#0D0D0D"
    ├── role: "btn-primary-text"→ value: "#FAFAFA"
    ├── role: "accent-1"        → value: "#3667B1"  (brand blue)
    ├── role: "accent-2"        → value: "#009966"  (green)
    └── role: "accent-3"        → value: "#155DFC"  (blue)
```

```sql
-- ============================================================
-- COLOR PALETTES (named color schemes per site)
-- ============================================================
CREATE TABLE color_palettes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    name            TEXT NOT NULL,                   -- "Light", "Dark", "Brand"
    slug            TEXT NOT NULL,                   -- "light", "dark", "brand"
    label           TEXT NOT NULL,                   -- human-readable display name
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(site_id, slug)
);

CREATE INDEX idx_color_palettes_site ON color_palettes(site_id);

-- ============================================================
-- COLOR PALETTE TOKENS (semantic role → hex value per palette)
-- ============================================================
CREATE TABLE color_palette_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    palette_id      UUID NOT NULL REFERENCES color_palettes(id) ON DELETE CASCADE,
    role            TEXT NOT NULL,                   -- "bg", "surface", "text-primary", "accent-1", etc.
    value           TEXT NOT NULL,                   -- "#0D0D0D" or "rgba(...)"
    description     TEXT,                            -- "Page background color"

    UNIQUE(palette_id, role)
);

CREATE INDEX idx_color_palette_tokens_palette ON color_palette_tokens(palette_id);
```

### Font System

**Design:** Role-based font definitions instead of category-specific columns like `font_sans`, `font_serif`.

At render time → `--font-heading`, `--font-body`, `--font-accent`, etc. CSS custom properties.

```
font_configurations (per site)
├── role: "heading"  → family: '"Helvetica Neue", sans-serif', weight: 500, letter_spacing: "-0.03em"
├── role: "body"     → family: '"Helvetica Neue", sans-serif', weight: 400, letter_spacing: "-0.02em"
├── role: "accent"   → family: '"DM Serif Text", serif', weight: 400, style: "italic"
├── role: "display"  → family: '"DM Serif Display", serif', weight: 400, style: "italic"
└── role: "ui"       → family: '"Helvetica Neue", sans-serif', weight: 500
```

```sql
-- ============================================================
-- FONT CONFIGURATIONS (role-based font definitions)
-- ============================================================
CREATE TABLE font_configurations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    role            TEXT NOT NULL,                   -- "heading", "body", "accent", "display", "ui"
    family          TEXT NOT NULL,                   -- '"Helvetica Neue", sans-serif'
    fallback_stack  TEXT NOT NULL DEFAULT 'sans-serif',
    weight_default  INT NOT NULL DEFAULT 400,
    weight_bold     INT NOT NULL DEFAULT 700,
    style           TEXT NOT NULL DEFAULT 'normal',  -- "normal", "italic"
    size_scale      JSONB,                           -- {"base":"1rem","md":"1.125rem","lg":"1.25rem"}
    letter_spacing  TEXT NOT NULL DEFAULT '0',
    line_height     TEXT NOT NULL DEFAULT '1.5',
    text_transform  TEXT,                            -- "uppercase", null
    font_file_url   TEXT,                            -- CDN URL for custom .woff2
    font_file_format TEXT,                           -- "woff2", "truetype"
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(site_id, role)
);

CREATE INDEX idx_font_configurations_site ON font_configurations(site_id);
```

### Semantic Color Mappings

**Design:** Site-level mappings from domain concepts (event types, categories, tags) to palette accent roles. Defined once, inherited by all sections automatically.

```
semantic_color_mappings (per site)
├── context: "event_type", key: "meeting"  → palette_role: "accent-2"
├── context: "event_type", key: "event"    → palette_role: "accent-3"
├── context: "event_type", key: "program"  → palette_role: "accent-1"
├── context: "post_category", key: "news"  → palette_role: "accent-1"
└── context: "tag", key: "featured"        → palette_role: "accent-3"
```

```sql
-- ============================================================
-- SEMANTIC COLOR MAPPINGS (domain concept → accent role)
-- ============================================================
CREATE TABLE semantic_color_mappings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    context         TEXT NOT NULL,                   -- "event_type", "post_category", "tag", "status"
    key             TEXT NOT NULL,                   -- "meeting", "news", "featured"
    palette_role    TEXT NOT NULL,                   -- "accent-1", "accent-2", "accent-3" (refs token role)
    label           TEXT,                            -- optional display label
    sort_order      INT NOT NULL DEFAULT 0,

    UNIQUE(site_id, context, key)
);

CREATE INDEX idx_semantic_color_mappings_site ON semantic_color_mappings(site_id);
```

---

## 3. Site Config

```sql
-- ============================================================
-- SITE SETTINGS (global config: contact, social, SEO, integrations)
-- ============================================================
CREATE TABLE site_settings (
    site_id         UUID PRIMARY KEY REFERENCES sites(id),
    contact         JSONB NOT NULL DEFAULT '{}',     -- {address, phone, email, directions_url}
    social_links    JSONB NOT NULL DEFAULT '[]',     -- [{platform, url, visible}]
    seo             JSONB NOT NULL DEFAULT '{}',     -- {title, description, og_image_url}
    integrations    JSONB NOT NULL DEFAULT '{}',     -- {google_analytics_id, giving_url, ...}
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NAVIGATION MENUS (menu structures keyed by location)
-- ============================================================
CREATE TABLE navigation_menus (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    location        TEXT NOT NULL DEFAULT 'main',    -- "main", "footer", "mobile"
    items           JSONB NOT NULL DEFAULT '[]',     -- [{id, label, href, children: [...]}]
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(site_id, location)
);

CREATE INDEX idx_navigation_menus_site ON navigation_menus(site_id);
```

---

## 4. Page Builder

```sql
-- ============================================================
-- PAGES (pages within a site)
-- ============================================================
CREATE TABLE pages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    slug            TEXT NOT NULL,                    -- "home", "about", "menu", "contact"
    title           TEXT NOT NULL,
    meta_title      TEXT,
    meta_description TEXT,
    og_image_url    TEXT,
    page_type       TEXT NOT NULL DEFAULT 'custom',   -- "home", "listing", "detail", "custom"
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(site_id, slug)
);

CREATE INDEX idx_pages_site ON pages(site_id);

-- ============================================================
-- PAGE SECTIONS (ordered sections within a page — core of the builder)
-- ============================================================
CREATE TABLE page_sections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id         UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    site_id         UUID NOT NULL REFERENCES sites(id),
    section_type    TEXT NOT NULL,                    -- "hero-banner", "media-text", "event-calendar",
                                                      -- "highlight-cards", "quote-banner", "cta-banner",
                                                      -- "directory-list", "spotlight-media", "media-grid",
                                                      -- "feature-breakdown", "timeline", "form", "faq",
                                                      -- "meet-team", "photo-gallery", etc. (35+ types)
    sort_order      INT NOT NULL DEFAULT 0,

    -- Base settings (matches BaseSectionSettings interface)
    visible         BOOLEAN NOT NULL DEFAULT TRUE,
    color_palette   TEXT NOT NULL DEFAULT 'light',    -- references color_palettes.slug
    padding_y       TEXT NOT NULL DEFAULT 'default',  -- "compact", "default", "spacious"
    container_width TEXT NOT NULL DEFAULT 'standard',  -- "standard", "narrow", "full"
    enable_animations BOOLEAN NOT NULL DEFAULT TRUE,

    -- Section-specific content (JSONB — schema varies by section_type)
    content         JSONB NOT NULL DEFAULT '{}',

    -- Section-specific settings beyond base (JSONB)
    settings        JSONB NOT NULL DEFAULT '{}',

    -- Content binding (NULL = inline content only; see "Section ↔ Data Binding")
    data_source     JSONB,

    -- Audit
    last_edited_by  UUID REFERENCES site_users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_page_sections_page ON page_sections(page_id, sort_order);
CREATE INDEX idx_page_sections_site ON page_sections(site_id);

-- ============================================================
-- SECTION TEMPLATES (reusable section presets)
-- ============================================================
CREATE TABLE section_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID REFERENCES sites(id),        -- NULL = platform-wide template
    name            TEXT NOT NULL,
    section_type    TEXT NOT NULL,
    thumbnail_url   TEXT,
    content         JSONB NOT NULL DEFAULT '{}',
    settings        JSONB NOT NULL DEFAULT '{}',
    color_palette   TEXT NOT NULL DEFAULT 'light',
    padding_y       TEXT NOT NULL DEFAULT 'default',
    container_width TEXT NOT NULL DEFAULT 'standard',
    is_public       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_section_templates_site ON section_templates(site_id);
CREATE INDEX idx_section_templates_type ON section_templates(section_type);
```

---

## 5. Known Content Types (Dedicated Tables)

These 6 tables cover universal content types (~80% of needs across industries). Proper typed columns, foreign keys, and indexes. Section components query them directly with efficient SQL.

| Table | Why dedicated |
|-------|---------------|
| `events` | Dates need range queries, recurrence, timezone math. Every site has events. |
| `team_members` | Name, role, email, bio, image — universal structure. Used by "Meet the Team" sections. |
| `posts` | Title, author, body, publish date, category — standard blog/article/message structure. |
| `media_items` | Curated video/audio/gallery entries (YouTube embeds, podcast episodes). Different from raw `media` assets. |
| `faqs` | Simple Q&A pairs with category grouping. |
| `testimonials` | Quote, attribution, optional image. Used across industries. |

```sql
-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL,
    description     TEXT,
    event_type      TEXT,                            -- "meeting", "event", "program", "conference", etc.
    date_start      TIMESTAMPTZ NOT NULL,
    date_end        TIMESTAMPTZ,
    is_all_day      BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence      JSONB,                           -- {freq: "weekly", interval: 1, until: "2025-12-31"}
    location        TEXT,
    location_url    TEXT,                             -- Google Maps link
    image_url       TEXT,
    image_alt       TEXT,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    status          TEXT NOT NULL DEFAULT 'draft',    -- "draft", "published", "archived"
    published_at    TIMESTAMPTZ,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(site_id, slug)
);

CREATE INDEX idx_events_site_status_date ON events(site_id, status, date_start);
CREATE INDEX idx_events_site_type ON events(site_id, event_type);

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
CREATE TABLE team_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL,
    role            TEXT,                             -- "Pastor", "Campus Leader", "Chef", etc.
    group_name      TEXT,                             -- "Leadership", "Staff", "UCLA" — for grouping
    bio             TEXT,
    email           TEXT,
    phone           TEXT,
    image_url       TEXT,
    image_alt       TEXT,
    social_links    JSONB NOT NULL DEFAULT '[]',      -- [{platform, url}]
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    status          TEXT NOT NULL DEFAULT 'published',
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(site_id, slug)
);

CREATE INDEX idx_team_members_site_status ON team_members(site_id, status, sort_order);
CREATE INDEX idx_team_members_site_group ON team_members(site_id, group_name);

-- ============================================================
-- POSTS (blog posts, articles, sermons, messages — any long-form)
-- ============================================================
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL,
    subtitle        TEXT,
    body            TEXT,                             -- richtext / markdown
    excerpt         TEXT,                             -- auto-generated or manual summary
    category        TEXT,                             -- "blog", "sermon", "news", "announcement"
    tags            TEXT[] NOT NULL DEFAULT '{}',
    author_id       UUID REFERENCES team_members(id), -- optional link to team member
    author_name     TEXT,                             -- fallback if not linked
    image_url       TEXT,
    image_alt       TEXT,
    video_url       TEXT,                             -- optional embedded video
    date_published  TIMESTAMPTZ,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    status          TEXT NOT NULL DEFAULT 'draft',
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(site_id, slug)
);

CREATE INDEX idx_posts_site_status_date ON posts(site_id, status, date_published DESC);
CREATE INDEX idx_posts_site_category ON posts(site_id, category);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- ============================================================
-- MEDIA ITEMS (curated video/audio/gallery entries — not raw assets)
-- ============================================================
CREATE TABLE media_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL,
    description     TEXT,
    media_type      TEXT NOT NULL,                    -- "video", "audio", "gallery"
    embed_url       TEXT,                             -- YouTube/Vimeo/Spotify embed URL
    source_url      TEXT,                             -- direct file URL (for self-hosted)
    thumbnail_url   TEXT,
    thumbnail_alt   TEXT,
    duration_seconds INT,
    category        TEXT,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    date_published  TIMESTAMPTZ,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    status          TEXT NOT NULL DEFAULT 'draft',
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(site_id, slug)
);

CREATE INDEX idx_media_items_site_status_type ON media_items(site_id, status, media_type);
CREATE INDEX idx_media_items_site_date ON media_items(site_id, date_published DESC);

-- ============================================================
-- FAQS
-- ============================================================
CREATE TABLE faqs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    question        TEXT NOT NULL,
    answer          TEXT NOT NULL,                    -- richtext / markdown
    category        TEXT,                             -- "General", "Pricing", "Campus Life"
    sort_order      INT NOT NULL DEFAULT 0,
    is_published    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_faqs_site_category ON faqs(site_id, category, sort_order);

-- ============================================================
-- TESTIMONIALS
-- ============================================================
CREATE TABLE testimonials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    quote           TEXT NOT NULL,
    author_name     TEXT NOT NULL,
    author_role     TEXT,                             -- "Student", "Customer", "Member"
    author_image_url TEXT,
    rating          INT,                              -- optional 1-5 star rating
    category        TEXT,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order      INT NOT NULL DEFAULT 0,
    is_published    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_testimonials_site ON testimonials(site_id, is_published, sort_order);
```

---

## 6. Custom Content & Assets

### Generic Collections (Tier 2)

For anything site-specific that doesn't fit the 6 dedicated tables. A restaurant might create "Menu Items". A church might create "Daily Breads" or "Spiritual Directions".

```
collections (custom type definitions)
├── name: "Daily Breads", slug: "daily-breads"
│   └── collection_fields (schema definition)
│       ├── title (text, required)
│       ├── scripture_ref (text)
│       ├── body (richtext)
│       └── date (date, sortable)
│
└── collection_items (data rows)
    ├── slug: "john-3-16-reflection"
    │   data: {"title": "...", "scripture_ref": "John 3:16", ...}
    └── ...
```

```sql
-- ============================================================
-- COLLECTIONS (custom content type definitions)
-- ============================================================
CREATE TABLE collections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    name            TEXT NOT NULL,                    -- "Daily Breads", "Menu Items", "Recipes"
    slug            TEXT NOT NULL,
    description     TEXT,
    has_detail_page BOOLEAN NOT NULL DEFAULT TRUE,
    slug_field      TEXT NOT NULL DEFAULT 'title',   -- which field generates the item slug
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(site_id, slug)
);

CREATE INDEX idx_collections_site ON collections(site_id);

-- ============================================================
-- COLLECTION FIELDS (schema for each custom collection)
-- ============================================================
CREATE TABLE collection_fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id   UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,                    -- "title", "scripture_ref", "body"
    label           TEXT NOT NULL,                    -- "Title", "Scripture Reference"
    field_type      TEXT NOT NULL,                    -- text/textarea/richtext/number/date/datetime/
                                                      -- boolean/select/multi-select/image/gallery/
                                                      -- url/email/color/json/reference
    is_required     BOOLEAN NOT NULL DEFAULT FALSE,
    is_unique       BOOLEAN NOT NULL DEFAULT FALSE,
    default_value   TEXT,
    validation      JSONB,                            -- {min_length, max_length, pattern}
    options         JSONB,                            -- for select/multi-select: [{label, value}]
    is_title_field  BOOLEAN NOT NULL DEFAULT FALSE,
    is_filterable   BOOLEAN NOT NULL DEFAULT FALSE,
    is_sortable     BOOLEAN NOT NULL DEFAULT FALSE,
    show_in_list    BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 0,
    group_name      TEXT,                             -- editor UI grouping: "Content", "Media", "Settings"
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collection_fields_collection ON collection_fields(collection_id, sort_order);

-- ============================================================
-- COLLECTION ITEMS (data rows for custom collections)
-- ============================================================
CREATE TABLE collection_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id   UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    site_id         UUID NOT NULL REFERENCES sites(id),
    slug            TEXT NOT NULL,
    data            JSONB NOT NULL DEFAULT '{}',      -- field values keyed by field name
    status          TEXT NOT NULL DEFAULT 'draft',    -- "draft", "published", "archived"
    published_at    TIMESTAMPTZ,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(collection_id, slug)
);

CREATE INDEX idx_collection_items_collection_status ON collection_items(collection_id, status);
CREATE INDEX idx_collection_items_data ON collection_items USING GIN(data jsonb_path_ops);
```

### Assets & Forms

```sql
-- ============================================================
-- MEDIA (CDN-backed asset registry — raw files, not curated entries)
-- ============================================================
CREATE TABLE media (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    url             TEXT NOT NULL,                    -- CDN URL
    filename        TEXT NOT NULL,
    alt_text        TEXT,
    mime_type       TEXT NOT NULL,                    -- "image/jpeg", "video/mp4", "application/pdf"
    file_size_bytes BIGINT,
    width           INT,                              -- for images
    height          INT,
    folder          TEXT NOT NULL DEFAULT '/',        -- "/images/events/", "/attachments/"
    tags            TEXT[] NOT NULL DEFAULT '{}',
    uploaded_by     UUID REFERENCES site_users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_site ON media(site_id);
CREATE INDEX idx_media_site_folder ON media(site_id, folder);

-- ============================================================
-- FORMS (form definitions with field schemas)
-- ============================================================
CREATE TABLE forms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL,
    fields          JSONB NOT NULL DEFAULT '[]',      -- [{name, label, type, required, options}]
    submit_label    TEXT NOT NULL DEFAULT 'Submit',
    success_message TEXT NOT NULL DEFAULT 'Thank you!',
    notification_emails TEXT[],
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(site_id, slug)
);

CREATE INDEX idx_forms_site ON forms(site_id);

-- ============================================================
-- FORM SUBMISSIONS (submitted form data)
-- ============================================================
CREATE TABLE form_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id         UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    site_id         UUID NOT NULL REFERENCES sites(id),
    data            JSONB NOT NULL,                   -- field values
    status          TEXT NOT NULL DEFAULT 'new',      -- "new", "reviewed", "contacted", "archived"
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_site_status ON form_submissions(site_id, status);
```

---

## 7. Section ↔ Data Binding

Sections reference content via `data_source` JSONB on `page_sections`. Works for both dedicated tables and custom collections.

### Dedicated table — auto mode (e.g., upcoming events)
```json
{
  "source_type": "events",
  "mode": "auto",
  "filters": {"status": "published", "is_featured": true},
  "sort": {"field": "date_start", "direction": "asc"},
  "limit": 6
}
```

### Dedicated table — manual mode (e.g., hand-picked team members)
```json
{
  "source_type": "team_members",
  "mode": "manual",
  "item_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

### Custom collection — auto mode
```json
{
  "source_type": "collection",
  "collection_id": "uuid",
  "mode": "auto",
  "filters": {"status": "published"},
  "sort": {"field": "date", "direction": "desc"},
  "limit": 10
}
```

### Inline (no data source)
`data_source` is NULL, all content lives directly in `content` JSONB. Used by hero banners, text blocks, CTAs, and other static sections.

**`source_type` values:** `"events"`, `"team_members"`, `"posts"`, `"media_items"`, `"faqs"`, `"testimonials"`, or `"collection"` (which additionally needs `collection_id`).

---

## 8. Entity Relationships

```
organizations (1)
  └── sites (1:N)
        ├── site_users (1:N)
        ├── site_settings (1:1)
        ├── navigation_menus (1:N by location)
        │
        ├── color_palettes (1:N)
        │     └── color_palette_tokens (1:N)
        ├── semantic_color_mappings (1:N)  ← site-level accent assignments
        ├── font_configurations (1:N by role)
        │
        ├── media (1:N)                    ← raw asset registry
        ├── forms (1:N)
        │     └── form_submissions (1:N)
        │
        │  ── Dedicated content types ──
        ├── events (1:N)
        ├── team_members (1:N)
        ├── posts (1:N)
        │     └── posts.author_id → team_members (optional)
        ├── media_items (1:N)              ← curated video/audio/gallery entries
        ├── faqs (1:N)
        ├── testimonials (1:N)
        │
        │  ── Custom content types ──
        ├── collections (1:N)
        │     ├── collection_fields (1:N ordered)
        │     └── collection_items (1:N)
        │
        │  ── Page builder ──
        ├── pages (1:N)
        │     └── page_sections (1:N ordered)
        │           └── data_source → events / team_members / posts / ... / collection_items
        └── section_templates (1:N)
```

---

## 9. Row-Level Security (Tenant Isolation)

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_palette_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE font_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_color_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Policy pattern (repeat for each site-scoped table):
-- The app sets current_setting('app.site_id') on each connection
CREATE POLICY tenant_isolation ON events
    USING (site_id = current_setting('app.site_id')::UUID);

-- Public read access (for website visitors, no auth needed)
CREATE POLICY public_read ON events
    FOR SELECT USING (status = 'published');

-- For token tables (scoped via palette, not directly by site_id):
CREATE POLICY tenant_isolation ON color_palette_tokens
    USING (palette_id IN (
        SELECT id FROM color_palettes
        WHERE site_id = current_setting('app.site_id')::UUID
    ));

-- For collection_fields (scoped via collection):
CREATE POLICY tenant_isolation ON collection_fields
    USING (collection_id IN (
        SELECT id FROM collections
        WHERE site_id = current_setting('app.site_id')::UUID
    ));
```

---

## 10. Design Rationale

| Decision | Rationale |
|----------|-----------|
| **`organizations` → `sites` two-level tenancy** | Supports agencies/multi-site orgs (one billing entity, multiple websites). Replaces church-only `churches` table. |
| **UUID primary keys** | Standard, no collision risk across tenants. Slug fields remain for URL-friendly access. |
| **Semantic color roles as rows** | `color_palette_tokens` with role/value rows replace hardcoded `color_black_1` columns. Works for any brand palette without schema changes. |
| **Role-based font configs** | `font_configurations` with heading/body/accent/display/ui roles replace `font_sans`/`font_serif` columns. Any font family works in any role. |
| **6 dedicated + generic collections** | Dedicated tables (events, posts, team_members, media_items, faqs, testimonials) cover ~80% of needs with typed columns and efficient queries. Generic collections handle the remaining ~20% (Daily Breads, Menu Items, Recipes) with JSONB flexibility. |
| **`data_source` JSONB on sections** | Single field binds sections to any content table via `source_type`. Supports auto (filtered queries) and manual (hand-picked IDs) modes. |
| **`semantic_color_mappings` at site level** | Event type pills, category badges, tag colors defined once — all sections inherit automatically. No per-section color config duplication. |
| **JSONB for section `content` + `settings`** | 35+ section types each have different shapes. Content is what editors write; settings are presentation. Clean separation for CMS editor UI. |
| **RLS over schema-per-tenant** | Scales better than thousands of schemas. Single connection pool. Standard queries. |
| **CDN URLs stored directly** | No binary storage in DB. `media` table is a registry/index. Actual files on R2/CloudFront. |
