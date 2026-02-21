# 09. Visual Page Builder & Section System

> **Document Version**: 3.0 Enterprise Edition
> **Last Updated**: December 2024
> **Architecture**: Drag-and-Drop Page Composition with Section Variants

---

## Overview

The Visual Page Builder provides church administrators with a powerful, intuitive interface to create and customize website pages without coding knowledge. Built on a modular section-based architecture, it enables rich page composition through drag-and-drop interactions with real-time preview capabilities.

### Key Features

| Feature | Description | Competitive Advantage |
|---------|-------------|----------------------|
| **Drag & Drop** | Intuitive section reordering | Easier than competitors |
| **20+ Section Types** | Comprehensive content blocks | Most in class |
| **Section Variants** | 3-5 visual options per type | Unique flexibility |
| **Real-Time Preview** | Live template rendering | Instant feedback |
| **Undo/Redo History** | Full action history | Error recovery |
| **Responsive Editing** | Desktop/tablet/mobile views | Complete coverage |
| **Template Integration** | Per-template section styles | Brand consistency |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Page Builder Architecture                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │                        Page Builder Canvas                              │    │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │    │
│   │   │  Hero   │ │ About   │ │ Sermons │ │ Events  │ │ Contact │        │    │
│   │   │ Section │ │ Section │ │ Section │ │ Section │ │ Section │        │    │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│                          │                │                                      │
│   ┌─────────────────┐   │                │   ┌──────────────────────┐          │
│   │  Section Panel  │   ▼                │   │   Settings Panel     │          │
│   │  ─────────────  │                    │   │   ──────────────     │          │
│   │  □ Hero         │   Drag & Drop      │   │   Content Config     │          │
│   │  □ About        │   ◄─────────►      │   │   Style Options      │          │
│   │  □ Sermons      │                    │   │   Layout Settings    │          │
│   │  □ Events       │                    │   │   Variant Selector   │          │
│   │  □ Gallery      │                    │   │   Responsive Config  │          │
│   │  □ Contact      │                    │   │   Advanced Options   │          │
│   │  □ Custom       │                    │   └──────────────────────┘          │
│   └─────────────────┘                    │                                      │
│                                          ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │                      Preview / Publish                               │      │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │      │
│   │   │ Desktop  │  │  Tablet  │  │  Mobile  │  │  Publish │           │      │
│   │   └──────────┘  └──────────┘  └──────────┘  └──────────┘           │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Page Model

```prisma
// prisma/schema.prisma

model Page {
  id            String      @id @default(uuid())
  tenantId      String      @map("tenant_id")
  title         String
  slug          String
  description   String?     @db.Text
  status        PageStatus  @default(DRAFT)
  pageType      PageType    @default(CUSTOM)
  isHomepage    Boolean     @default(false) @map("is_homepage")

  // Page Builder Data
  sections      Json        @default("[]")
  sectionOrder  String[]    @default([]) @map("section_order")

  // SEO
  metaTitle     String?     @map("meta_title")
  metaDesc      String?     @map("meta_desc") @db.Text
  ogImage       String?     @map("og_image")

  // Layout Options
  headerStyle   String?     @map("header_style")   // transparent, solid, hidden
  footerStyle   String?     @map("footer_style")   // default, minimal, hidden

  // Publishing
  publishedAt   DateTime?   @map("published_at")
  publishedBy   String?     @map("published_by")

  // Version Control
  version       Int         @default(1)
  draftData     Json?       @map("draft_data")

  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")
  createdBy     String?     @map("created_by")

  // Relations
  tenant        Tenant      @relation(fields: [tenantId], references: [id])
  author        User?       @relation("PageAuthor", fields: [createdBy], references: [id])
  publisher     User?       @relation("PagePublisher", fields: [publishedBy], references: [id])
  revisions     PageRevision[]

  @@unique([tenantId, slug])
  @@index([tenantId, status])
  @@index([tenantId, pageType])
  @@map("pages")
}

model PageRevision {
  id          String    @id @default(uuid())
  pageId      String    @map("page_id")
  version     Int
  title       String
  sections    Json
  sectionOrder String[]  @map("section_order")
  createdAt   DateTime  @default(now()) @map("created_at")
  createdBy   String?   @map("created_by")
  changeNote  String?   @map("change_note")

  page        Page      @relation(fields: [pageId], references: [id], onDelete: Cascade)
  author      User?     @relation(fields: [createdBy], references: [id])

  @@index([pageId, version])
  @@map("page_revisions")
}

model SectionTemplate {
  id          String    @id @default(uuid())
  tenantId    String?   @map("tenant_id")  // null = global template
  name        String
  type        String                        // section type
  config      Json                          // default configuration
  preview     String?                       // preview image URL
  isGlobal    Boolean   @default(false) @map("is_global")
  createdAt   DateTime  @default(now()) @map("created_at")

  tenant      Tenant?   @relation(fields: [tenantId], references: [id])

  @@index([tenantId, type])
  @@map("section_templates")
}

enum PageStatus {
  DRAFT
  PUBLISHED
  SCHEDULED
  ARCHIVED
}

enum PageType {
  HOME
  ABOUT
  CONTACT
  SERMONS
  EVENTS
  MINISTRIES
  GIVING
  CUSTOM
}
```

### Section Data Structure

```typescript
// types/page-builder.ts

interface PageSection {
  id: string
  type: SectionType
  variant: string
  title?: string
  config: SectionConfig
  styles: SectionStyles
  visibility: SectionVisibility
  order: number
}

interface SectionConfig {
  // Content fields vary by section type
  [key: string]: any
}

interface SectionStyles {
  backgroundColor?: string
  backgroundImage?: string
  backgroundOverlay?: number
  textColor?: string
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  containerWidth?: 'full' | 'wide' | 'normal' | 'narrow'
  customCSS?: string
}

interface SectionVisibility {
  desktop: boolean
  tablet: boolean
  mobile: boolean
  showWhen?: VisibilityCondition
}

interface VisibilityCondition {
  field: 'memberStatus' | 'dateRange' | 'custom'
  operator: 'equals' | 'notEquals' | 'contains' | 'between'
  value: any
}

type SectionType =
  | 'hero'
  | 'about'
  | 'sermons'
  | 'events'
  | 'ministries'
  | 'giving'
  | 'gallery'
  | 'team'
  | 'testimonials'
  | 'contact'
  | 'map'
  | 'newsletter'
  | 'text'
  | 'video'
  | 'cta'
  | 'features'
  | 'stats'
  | 'faq'
  | 'timeline'
  | 'tabs'
  | 'accordion'
  | 'cards'
  | 'custom-html'
```

---

## Section Type Catalog

### 1. Hero Section

```typescript
// sections/hero/types.ts

interface HeroSectionConfig {
  variant: 'full-width' | 'split' | 'overlay' | 'video' | 'slider'

  // Content
  headline: string
  subheadline?: string
  bodyText?: string

  // Media
  backgroundImage?: string
  backgroundVideo?: string
  mobileImage?: string

  // Actions
  primaryButton?: ButtonConfig
  secondaryButton?: ButtonConfig

  // Layout
  contentAlignment: 'left' | 'center' | 'right'
  verticalAlignment: 'top' | 'center' | 'bottom'
  minHeight: 'viewport' | 'auto' | string

  // Overlay
  overlayColor?: string
  overlayOpacity?: number

  // Animation
  enableParallax?: boolean
  textAnimation?: 'fade' | 'slide' | 'none'

  // Slider (for slider variant)
  slides?: HeroSlide[]
  autoplay?: boolean
  interval?: number
}

interface HeroSlide {
  id: string
  headline: string
  subheadline?: string
  backgroundImage: string
  button?: ButtonConfig
}

interface ButtonConfig {
  text: string
  link: string
  style: 'primary' | 'secondary' | 'outline' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  icon?: string
  newTab?: boolean
}
```

### 2. Sermons Section

```typescript
// sections/sermons/types.ts

interface SermonsSectionConfig {
  variant: 'grid' | 'list' | 'carousel' | 'featured'

  // Content
  title?: string
  subtitle?: string

  // Display Options
  itemCount: number
  showFilters: boolean
  filterOptions: ('speaker' | 'series' | 'date')[]

  // Card Options
  showThumbnail: boolean
  showSpeaker: boolean
  showDate: boolean
  showDuration: boolean
  showScripture: boolean
  showPlayButton: boolean

  // Data Source
  source: 'latest' | 'series' | 'speaker' | 'featured' | 'manual'
  seriesId?: string
  speakerId?: string
  manualIds?: string[]

  // Actions
  showViewAll: boolean
  viewAllLink?: string
  viewAllText?: string

  // Layout (for grid)
  columns: 2 | 3 | 4
  gap: 'sm' | 'md' | 'lg'
}
```

### 3. Events Section

```typescript
// sections/events/types.ts

interface EventsSectionConfig {
  variant: 'calendar' | 'list' | 'cards' | 'timeline' | 'upcoming'

  // Content
  title?: string
  subtitle?: string

  // Display Options
  itemCount: number
  showPastEvents: boolean
  showFilters: boolean

  // Card Options
  showImage: boolean
  showTime: boolean
  showLocation: boolean
  showDescription: boolean
  showRegistration: boolean
  dateFormat: 'short' | 'long' | 'relative'

  // Data Source
  source: 'upcoming' | 'ministry' | 'featured' | 'manual'
  ministryId?: string
  manualIds?: string[]

  // Calendar Options (for calendar variant)
  defaultView: 'month' | 'week' | 'day'
  highlightToday: boolean

  // Actions
  showViewAll: boolean
  viewAllLink?: string
}
```

### 4. Giving Section

```typescript
// sections/giving/types.ts

interface GivingSectionConfig {
  variant: 'simple' | 'with-options' | 'campaign' | 'impact'

  // Content
  title?: string
  subtitle?: string
  bodyText?: string

  // Giving Options
  showPresetAmounts: boolean
  presetAmounts: number[]
  allowCustomAmount: boolean
  defaultAmount?: number

  // Fund Options
  showFundSelector: boolean
  funds?: GivingFund[]
  defaultFundId?: string

  // Recurring Options
  showRecurring: boolean
  recurringOptions: ('weekly' | 'monthly' | 'quarterly' | 'yearly')[]

  // Display
  showSecurityBadge: boolean
  showTaxInfo: boolean
  testimonial?: GivingTestimonial

  // Campaign (for campaign variant)
  campaign?: {
    id: string
    name: string
    goal: number
    raised: number
    endDate?: Date
    showProgress: boolean
  }

  // Impact (for impact variant)
  impactStats?: {
    icon: string
    amount: string
    label: string
  }[]
}

interface GivingFund {
  id: string
  name: string
  description?: string
}

interface GivingTestimonial {
  quote: string
  author: string
  image?: string
}
```

### 5. Contact Section

```typescript
// sections/contact/types.ts

interface ContactSectionConfig {
  variant: 'form-only' | 'with-info' | 'split' | 'full-width'

  // Content
  title?: string
  subtitle?: string

  // Contact Info
  showAddress: boolean
  showPhone: boolean
  showEmail: boolean
  showHours: boolean

  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
  phone?: string
  email?: string
  officeHours?: string

  // Form Fields
  formFields: ContactFormField[]
  submitButtonText: string
  successMessage: string

  // Map
  showMap: boolean
  mapPosition: 'left' | 'right' | 'bottom'
  mapStyle: 'default' | 'minimal' | 'dark'

  // Social Links
  showSocialLinks: boolean
  socialLinks?: {
    platform: string
    url: string
  }[]
}

interface ContactFormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]  // for select type
}
```

### 6. Gallery Section

```typescript
// sections/gallery/types.ts

interface GallerySectionConfig {
  variant: 'grid' | 'masonry' | 'carousel' | 'lightbox'

  // Content
  title?: string
  subtitle?: string

  // Images
  images: GalleryImage[]

  // Layout
  columns: 2 | 3 | 4 | 5
  gap: 'none' | 'sm' | 'md' | 'lg'
  aspectRatio: 'square' | '4:3' | '16:9' | 'auto'

  // Display
  showCaptions: boolean
  enableLightbox: boolean
  showNavigation: boolean

  // Carousel Options
  autoplay?: boolean
  interval?: number
  slidesPerView?: number
}

interface GalleryImage {
  id: string
  url: string
  thumbnail?: string
  caption?: string
  alt?: string
}
```

### 7. Team/Staff Section

```typescript
// sections/team/types.ts

interface TeamSectionConfig {
  variant: 'grid' | 'carousel' | 'list' | 'featured'

  // Content
  title?: string
  subtitle?: string

  // Team Members
  members: TeamMember[]

  // Display Options
  showPhoto: boolean
  showRole: boolean
  showBio: boolean
  showContact: boolean
  showSocial: boolean

  // Layout
  columns: 2 | 3 | 4
  photoShape: 'square' | 'circle' | 'rounded'

  // Card Style
  cardStyle: 'minimal' | 'bordered' | 'elevated'
  hoverEffect: 'none' | 'zoom' | 'overlay'
}

interface TeamMember {
  id: string
  name: string
  role: string
  photo?: string
  bio?: string
  email?: string
  phone?: string
  socialLinks?: {
    platform: string
    url: string
  }[]
}
```

### 8. Testimonials Section

```typescript
// sections/testimonials/types.ts

interface TestimonialsSectionConfig {
  variant: 'slider' | 'grid' | 'cards' | 'quotes'

  // Content
  title?: string
  subtitle?: string

  // Testimonials
  testimonials: Testimonial[]

  // Display
  showPhoto: boolean
  showName: boolean
  showRole: boolean
  showRating: boolean

  // Slider Options
  autoplay?: boolean
  interval?: number

  // Layout
  columns?: 1 | 2 | 3
  quoteStyle: 'minimal' | 'bordered' | 'highlighted'
}

interface Testimonial {
  id: string
  quote: string
  author: string
  role?: string
  photo?: string
  rating?: number
}
```

### 9. CTA (Call to Action) Section

```typescript
// sections/cta/types.ts

interface CTASectionConfig {
  variant: 'simple' | 'with-image' | 'split' | 'banner'

  // Content
  headline: string
  subheadline?: string
  bodyText?: string

  // Buttons
  primaryButton: ButtonConfig
  secondaryButton?: ButtonConfig

  // Media
  backgroundImage?: string
  sideImage?: string

  // Layout
  alignment: 'left' | 'center' | 'right'

  // Style
  style: 'default' | 'gradient' | 'image' | 'color'
  backgroundColor?: string
}
```

### 10. Features Section

```typescript
// sections/features/types.ts

interface FeaturesSectionConfig {
  variant: 'grid' | 'list' | 'alternating' | 'icon-grid'

  // Content
  title?: string
  subtitle?: string

  // Features
  features: Feature[]

  // Layout
  columns: 2 | 3 | 4

  // Display
  showIcon: boolean
  iconStyle: 'filled' | 'outline' | 'circle'
  showImage: boolean
  showLearnMore: boolean
}

interface Feature {
  id: string
  icon?: string
  image?: string
  title: string
  description: string
  link?: string
}
```

---

## Page Builder Components

### Main Page Builder Component

```typescript
// components/admin/page-builder/PageBuilder.tsx

'use client'

import { useState, useCallback, useEffect } from 'react'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { usePageBuilder } from '@/hooks/usePageBuilder'
import { useTemplate } from '@/contexts/TemplateContext'
import { useToast } from '@/components/ui/use-toast'
import { PageBuilderToolbar } from './PageBuilderToolbar'
import { SectionPanel } from './SectionPanel'
import { BuilderCanvas } from './BuilderCanvas'
import { SettingsPanel } from './SettingsPanel'
import { PreviewModal } from './PreviewModal'
import { PublishDialog } from './PublishDialog'
import { RevisionHistory } from './RevisionHistory'
import type { Page, PageSection } from '@/types/page-builder'

interface PageBuilderProps {
  page: Page
  onSave: (data: Partial<Page>) => Promise<void>
}

export function PageBuilder({ page, onSave }: PageBuilderProps) {
  const { templateId, config: templateConfig } = useTemplate()
  const { toast } = useToast()

  // Page builder state
  const {
    sections,
    setSections,
    selectedSection,
    setSelectedSection,
    history,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePageBuilder(page.sections)

  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showSectionPanel, setShowSectionPanel] = useState(true)
  const [showSettingsPanel, setShowSettingsPanel] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Track changes
  useEffect(() => {
    const currentSections = JSON.stringify(sections)
    const originalSections = JSON.stringify(page.sections)
    setHasChanges(currentSections !== originalSections)
  }, [sections, page.sections])

  // Auto-save
  useEffect(() => {
    if (!hasChanges) return

    const timer = setTimeout(async () => {
      await handleSave(true) // Save as draft
    }, 30000) // Auto-save every 30 seconds

    return () => clearTimeout(timer)
  }, [sections, hasChanges])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z' && !e.shiftKey && canUndo) {
          e.preventDefault()
          undo()
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          if (canRedo) {
            e.preventDefault()
            redo()
          }
        }
        if (e.key === 's') {
          e.preventDefault()
          handleSave()
        }
      }
      if (e.key === 'Delete' && selectedSection) {
        handleDeleteSection(selectedSection)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo, selectedSection])

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id)
      const newIndex = sections.findIndex(s => s.id === over.id)

      setSections(arrayMove(sections, oldIndex, newIndex).map((s, i) => ({
        ...s,
        order: i,
      })))
    }
  }

  // Add section
  const handleAddSection = (type: string, variant: string) => {
    const newSection: PageSection = {
      id: crypto.randomUUID(),
      type: type as any,
      variant,
      config: getDefaultConfig(type, variant, templateConfig),
      styles: getDefaultStyles(type),
      visibility: { desktop: true, tablet: true, mobile: true },
      order: sections.length,
    }

    setSections([...sections, newSection])
    setSelectedSection(newSection.id)

    toast({
      title: 'Section added',
      description: `${type} section has been added to the page.`,
    })
  }

  // Update section
  const handleUpdateSection = (sectionId: string, updates: Partial<PageSection>) => {
    setSections(sections.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    ))
  }

  // Delete section
  const handleDeleteSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId))
    if (selectedSection === sectionId) {
      setSelectedSection(null)
    }

    toast({
      title: 'Section removed',
      description: 'The section has been removed from the page.',
    })
  }

  // Duplicate section
  const handleDuplicateSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    const newSection: PageSection = {
      ...section,
      id: crypto.randomUUID(),
      order: section.order + 1,
    }

    const index = sections.findIndex(s => s.id === sectionId)
    const newSections = [...sections]
    newSections.splice(index + 1, 0, newSection)

    setSections(newSections.map((s, i) => ({ ...s, order: i })))
    setSelectedSection(newSection.id)

    toast({
      title: 'Section duplicated',
      description: 'A copy of the section has been created.',
    })
  }

  // Save page
  const handleSave = async (asDraft = false) => {
    setIsSaving(true)

    try {
      await onSave({
        sections: sections,
        sectionOrder: sections.map(s => s.id),
        ...(asDraft ? { draftData: { sections } } : {}),
      })

      toast({
        title: asDraft ? 'Draft saved' : 'Page saved',
        description: asDraft
          ? 'Your changes have been saved as a draft.'
          : 'Your changes have been published.',
      })

      setHasChanges(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save the page. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <PageBuilderToolbar
        page={page}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onToggleSectionPanel={() => setShowSectionPanel(!showSectionPanel)}
        onToggleSettingsPanel={() => setShowSettingsPanel(!showSettingsPanel)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSave={() => handleSave()}
        onPreview={() => setShowPreview(true)}
        onPublish={() => setShowPublish(true)}
        onHistory={() => setShowHistory(true)}
        isSaving={isSaving}
        hasChanges={hasChanges}
      />

      {/* Main Builder Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Section Panel */}
        {showSectionPanel && (
          <SectionPanel
            templateId={templateId}
            onAddSection={handleAddSection}
          />
        )}

        {/* Canvas */}
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <BuilderCanvas
              sections={sections}
              selectedSection={selectedSection}
              onSelectSection={setSelectedSection}
              onDeleteSection={handleDeleteSection}
              onDuplicateSection={handleDuplicateSection}
              viewMode={viewMode}
              templateId={templateId}
            />
          </SortableContext>
        </DndContext>

        {/* Settings Panel */}
        {showSettingsPanel && selectedSection && (
          <SettingsPanel
            section={sections.find(s => s.id === selectedSection)!}
            onUpdate={(updates) => handleUpdateSection(selectedSection, updates)}
            onClose={() => setSelectedSection(null)}
            templateConfig={templateConfig}
          />
        )}
      </div>

      {/* Modals */}
      <PreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        sections={sections}
        templateId={templateId}
      />

      <PublishDialog
        open={showPublish}
        onClose={() => setShowPublish(false)}
        page={page}
        sections={sections}
        onPublish={async () => {
          await handleSave(false)
          setShowPublish(false)
        }}
      />

      <RevisionHistory
        open={showHistory}
        onClose={() => setShowHistory(false)}
        pageId={page.id}
        onRestore={(revision) => {
          setSections(revision.sections)
          setShowHistory(false)
        }}
      />
    </div>
  )
}

// Helper functions
function getDefaultConfig(
  type: string,
  variant: string,
  templateConfig: any
): any {
  const defaults: Record<string, any> = {
    hero: {
      variant,
      headline: 'Welcome to Our Church',
      subheadline: 'Join us for worship every Sunday',
      primaryButton: {
        text: 'Join Us',
        link: '/visit',
        style: 'primary',
        size: 'lg',
      },
      contentAlignment: 'center',
      verticalAlignment: 'center',
      minHeight: 'viewport',
    },
    sermons: {
      variant,
      title: 'Recent Sermons',
      subtitle: 'Watch and listen to our latest messages',
      itemCount: variant === 'featured' ? 1 : 6,
      showFilters: variant === 'grid',
      filterOptions: ['speaker', 'series'],
      showThumbnail: true,
      showSpeaker: true,
      showDate: true,
      showPlayButton: true,
      source: variant === 'featured' ? 'featured' : 'latest',
      showViewAll: true,
      viewAllText: 'View All Sermons',
      viewAllLink: '/sermons',
      columns: variant === 'grid' ? 3 : 2,
    },
    events: {
      variant,
      title: 'Upcoming Events',
      subtitle: 'Join us for these upcoming events',
      itemCount: variant === 'calendar' ? 30 : 4,
      showPastEvents: false,
      showFilters: variant === 'calendar',
      showImage: variant === 'cards',
      showTime: true,
      showLocation: true,
      showDescription: variant !== 'upcoming',
      showRegistration: true,
      source: 'upcoming',
      showViewAll: true,
    },
    giving: {
      variant,
      title: 'Give Online',
      subtitle: 'Support our church and its ministries',
      showPresetAmounts: true,
      presetAmounts: [25, 50, 100, 250, 500],
      allowCustomAmount: true,
      showRecurring: true,
      recurringOptions: ['weekly', 'monthly'],
      showSecurityBadge: true,
      showTaxInfo: true,
    },
    contact: {
      variant,
      title: 'Contact Us',
      subtitle: "We'd love to hear from you",
      showAddress: true,
      showPhone: true,
      showEmail: true,
      showHours: true,
      formFields: [
        { id: '1', type: 'text', label: 'Name', required: true },
        { id: '2', type: 'email', label: 'Email', required: true },
        { id: '3', type: 'textarea', label: 'Message', required: true },
      ],
      submitButtonText: 'Send Message',
      successMessage: 'Thank you for your message!',
      showMap: variant !== 'form-only',
    },
    gallery: {
      variant,
      title: 'Photo Gallery',
      images: [],
      columns: variant === 'masonry' ? 3 : 4,
      gap: 'md',
      aspectRatio: variant === 'masonry' ? 'auto' : 'square',
      showCaptions: true,
      enableLightbox: true,
    },
    team: {
      variant,
      title: 'Our Team',
      subtitle: 'Meet our church leadership',
      members: [],
      showPhoto: true,
      showRole: true,
      showBio: variant !== 'grid' || true,
      columns: 3,
      photoShape: 'circle',
      cardStyle: 'minimal',
    },
    testimonials: {
      variant,
      title: 'What People Say',
      testimonials: [],
      showPhoto: true,
      showName: true,
      showRole: true,
      autoplay: variant === 'slider',
      interval: 5000,
      quoteStyle: 'highlighted',
    },
    cta: {
      variant,
      headline: 'Join Our Community',
      subheadline: 'Become part of our church family',
      primaryButton: {
        text: 'Get Connected',
        link: '/connect',
        style: 'primary',
        size: 'lg',
      },
      alignment: 'center',
      style: 'gradient',
    },
    features: {
      variant,
      title: 'Why Join Us',
      features: [],
      columns: 3,
      showIcon: true,
      iconStyle: 'circle',
    },
    text: {
      variant: 'default',
      content: '',
      alignment: 'left',
    },
    video: {
      variant: 'embed',
      title: '',
      videoUrl: '',
      autoplay: false,
      showControls: true,
    },
  }

  return defaults[type] || {}
}

function getDefaultStyles(type: string): any {
  const defaults: Record<string, any> = {
    hero: {
      paddingTop: 'none',
      paddingBottom: 'none',
      containerWidth: 'full',
    },
    cta: {
      paddingTop: 'lg',
      paddingBottom: 'lg',
      containerWidth: 'normal',
    },
    default: {
      paddingTop: 'lg',
      paddingBottom: 'lg',
      containerWidth: 'normal',
    },
  }

  return defaults[type] || defaults.default
}
```

### Builder Canvas Component

```typescript
// components/admin/page-builder/BuilderCanvas.tsx

'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { GripVertical, Trash2, Copy, Settings, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionRenderer } from './SectionRenderer'
import type { PageSection } from '@/types/page-builder'

interface BuilderCanvasProps {
  sections: PageSection[]
  selectedSection: string | null
  onSelectSection: (id: string | null) => void
  onDeleteSection: (id: string) => void
  onDuplicateSection: (id: string) => void
  viewMode: 'desktop' | 'tablet' | 'mobile'
  templateId: string
}

export function BuilderCanvas({
  sections,
  selectedSection,
  onSelectSection,
  onDeleteSection,
  onDuplicateSection,
  viewMode,
  templateId,
}: BuilderCanvasProps) {
  const canvasWidth = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-200 p-6">
      <div
        className="mx-auto bg-white shadow-lg transition-all duration-300"
        style={{ width: canvasWidth[viewMode], minHeight: '100%' }}
      >
        {sections.length === 0 ? (
          <EmptyCanvas />
        ) : (
          sections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              isSelected={selectedSection === section.id}
              onSelect={() => onSelectSection(section.id)}
              onDelete={() => onDeleteSection(section.id)}
              onDuplicate={() => onDuplicateSection(section.id)}
              viewMode={viewMode}
              templateId={templateId}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface SortableSectionProps {
  section: PageSection
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  viewMode: 'desktop' | 'tablet' | 'mobile'
  templateId: string
}

function SortableSection({
  section,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  viewMode,
  templateId,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isHidden = !section.visibility[viewMode]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isSelected && 'ring-2 ring-blue-500',
        isDragging && 'z-50',
        isHidden && 'opacity-50'
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Section Controls */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-12 -ml-12 flex flex-col items-center justify-start pt-4 gap-2',
          'opacity-0 group-hover:opacity-100 transition-opacity'
        )}
      >
        {/* Drag Handle */}
        <button
          className="p-2 bg-gray-900 text-white rounded cursor-grab hover:bg-gray-700"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Visibility Toggle */}
        <button
          className="p-2 bg-gray-900 text-white rounded hover:bg-gray-700"
          onClick={(e) => {
            e.stopPropagation()
            // Toggle visibility handled in settings panel
          }}
        >
          {isHidden ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Section Actions */}
      <div
        className={cn(
          'absolute right-2 top-2 flex gap-1',
          'opacity-0 group-hover:opacity-100 transition-opacity z-10'
        )}
      >
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate()
          }}
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          <Settings className="w-4 h-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Section Type Label */}
      <div
        className={cn(
          'absolute left-2 top-2 px-2 py-1 text-xs font-medium rounded',
          'bg-gray-900 text-white',
          'opacity-0 group-hover:opacity-100 transition-opacity'
        )}
      >
        {section.type} • {section.variant}
      </div>

      {/* Section Content */}
      <SectionRenderer
        section={section}
        templateId={templateId}
        isEditing={true}
      />
    </div>
  )
}

function EmptyCanvas() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
      <div className="text-6xl mb-4">📄</div>
      <h3 className="text-lg font-medium mb-2">No sections yet</h3>
      <p className="text-sm">
        Drag sections from the left panel to start building your page
      </p>
    </div>
  )
}
```

### Section Panel Component

```typescript
// components/admin/page-builder/SectionPanel.tsx

'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface SectionPanelProps {
  templateId: string
  onAddSection: (type: string, variant: string) => void
}

const SECTION_CATEGORIES = [
  {
    id: 'content',
    label: 'Content',
    sections: [
      {
        type: 'hero',
        label: 'Hero',
        description: 'Large banner with headline and call-to-action',
        icon: '🎯',
        variants: [
          { id: 'full-width', label: 'Full Width', preview: '/previews/hero-full.png' },
          { id: 'split', label: 'Split', preview: '/previews/hero-split.png' },
          { id: 'overlay', label: 'Overlay', preview: '/previews/hero-overlay.png' },
          { id: 'video', label: 'Video', preview: '/previews/hero-video.png' },
          { id: 'slider', label: 'Slider', preview: '/previews/hero-slider.png' },
        ],
      },
      {
        type: 'text',
        label: 'Text Block',
        description: 'Rich text content area',
        icon: '📝',
        variants: [
          { id: 'default', label: 'Default', preview: '/previews/text-default.png' },
          { id: 'two-column', label: 'Two Column', preview: '/previews/text-two-col.png' },
          { id: 'with-sidebar', label: 'With Sidebar', preview: '/previews/text-sidebar.png' },
        ],
      },
      {
        type: 'video',
        label: 'Video',
        description: 'Embedded video player',
        icon: '🎬',
        variants: [
          { id: 'embed', label: 'Embedded', preview: '/previews/video-embed.png' },
          { id: 'background', label: 'Background', preview: '/previews/video-bg.png' },
          { id: 'lightbox', label: 'Lightbox', preview: '/previews/video-lightbox.png' },
        ],
      },
    ],
  },
  {
    id: 'church',
    label: 'Church',
    sections: [
      {
        type: 'sermons',
        label: 'Sermons',
        description: 'Display sermon content',
        icon: '🎤',
        variants: [
          { id: 'grid', label: 'Grid', preview: '/previews/sermons-grid.png' },
          { id: 'list', label: 'List', preview: '/previews/sermons-list.png' },
          { id: 'carousel', label: 'Carousel', preview: '/previews/sermons-carousel.png' },
          { id: 'featured', label: 'Featured', preview: '/previews/sermons-featured.png' },
        ],
      },
      {
        type: 'events',
        label: 'Events',
        description: 'Upcoming events display',
        icon: '📅',
        variants: [
          { id: 'calendar', label: 'Calendar', preview: '/previews/events-calendar.png' },
          { id: 'list', label: 'List', preview: '/previews/events-list.png' },
          { id: 'cards', label: 'Cards', preview: '/previews/events-cards.png' },
          { id: 'timeline', label: 'Timeline', preview: '/previews/events-timeline.png' },
          { id: 'upcoming', label: 'Upcoming', preview: '/previews/events-upcoming.png' },
        ],
      },
      {
        type: 'ministries',
        label: 'Ministries',
        description: 'Ministry showcase',
        icon: '⛪',
        variants: [
          { id: 'grid', label: 'Grid', preview: '/previews/ministries-grid.png' },
          { id: 'list', label: 'List', preview: '/previews/ministries-list.png' },
          { id: 'featured', label: 'Featured', preview: '/previews/ministries-featured.png' },
        ],
      },
      {
        type: 'giving',
        label: 'Giving',
        description: 'Online donation section',
        icon: '💝',
        variants: [
          { id: 'simple', label: 'Simple', preview: '/previews/giving-simple.png' },
          { id: 'with-options', label: 'With Options', preview: '/previews/giving-options.png' },
          { id: 'campaign', label: 'Campaign', preview: '/previews/giving-campaign.png' },
          { id: 'impact', label: 'Impact', preview: '/previews/giving-impact.png' },
        ],
      },
    ],
  },
  {
    id: 'people',
    label: 'People',
    sections: [
      {
        type: 'team',
        label: 'Team/Staff',
        description: 'Display team members',
        icon: '👥',
        variants: [
          { id: 'grid', label: 'Grid', preview: '/previews/team-grid.png' },
          { id: 'carousel', label: 'Carousel', preview: '/previews/team-carousel.png' },
          { id: 'list', label: 'List', preview: '/previews/team-list.png' },
          { id: 'featured', label: 'Featured', preview: '/previews/team-featured.png' },
        ],
      },
      {
        type: 'testimonials',
        label: 'Testimonials',
        description: 'Member testimonials',
        icon: '💬',
        variants: [
          { id: 'slider', label: 'Slider', preview: '/previews/testimonials-slider.png' },
          { id: 'grid', label: 'Grid', preview: '/previews/testimonials-grid.png' },
          { id: 'cards', label: 'Cards', preview: '/previews/testimonials-cards.png' },
          { id: 'quotes', label: 'Quotes', preview: '/previews/testimonials-quotes.png' },
        ],
      },
    ],
  },
  {
    id: 'media',
    label: 'Media',
    sections: [
      {
        type: 'gallery',
        label: 'Gallery',
        description: 'Photo gallery',
        icon: '🖼️',
        variants: [
          { id: 'grid', label: 'Grid', preview: '/previews/gallery-grid.png' },
          { id: 'masonry', label: 'Masonry', preview: '/previews/gallery-masonry.png' },
          { id: 'carousel', label: 'Carousel', preview: '/previews/gallery-carousel.png' },
          { id: 'lightbox', label: 'Lightbox', preview: '/previews/gallery-lightbox.png' },
        ],
      },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    sections: [
      {
        type: 'contact',
        label: 'Contact',
        description: 'Contact form and info',
        icon: '📧',
        variants: [
          { id: 'form-only', label: 'Form Only', preview: '/previews/contact-form.png' },
          { id: 'with-info', label: 'With Info', preview: '/previews/contact-info.png' },
          { id: 'split', label: 'Split', preview: '/previews/contact-split.png' },
          { id: 'full-width', label: 'Full Width', preview: '/previews/contact-full.png' },
        ],
      },
      {
        type: 'cta',
        label: 'Call to Action',
        description: 'Action prompt section',
        icon: '🎯',
        variants: [
          { id: 'simple', label: 'Simple', preview: '/previews/cta-simple.png' },
          { id: 'with-image', label: 'With Image', preview: '/previews/cta-image.png' },
          { id: 'split', label: 'Split', preview: '/previews/cta-split.png' },
          { id: 'banner', label: 'Banner', preview: '/previews/cta-banner.png' },
        ],
      },
      {
        type: 'newsletter',
        label: 'Newsletter',
        description: 'Email signup form',
        icon: '📰',
        variants: [
          { id: 'inline', label: 'Inline', preview: '/previews/newsletter-inline.png' },
          { id: 'card', label: 'Card', preview: '/previews/newsletter-card.png' },
          { id: 'full-width', label: 'Full Width', preview: '/previews/newsletter-full.png' },
        ],
      },
    ],
  },
  {
    id: 'layout',
    label: 'Layout',
    sections: [
      {
        type: 'features',
        label: 'Features',
        description: 'Feature highlights',
        icon: '✨',
        variants: [
          { id: 'grid', label: 'Grid', preview: '/previews/features-grid.png' },
          { id: 'list', label: 'List', preview: '/previews/features-list.png' },
          { id: 'alternating', label: 'Alternating', preview: '/previews/features-alt.png' },
          { id: 'icon-grid', label: 'Icon Grid', preview: '/previews/features-icons.png' },
        ],
      },
      {
        type: 'stats',
        label: 'Statistics',
        description: 'Number highlights',
        icon: '📊',
        variants: [
          { id: 'inline', label: 'Inline', preview: '/previews/stats-inline.png' },
          { id: 'cards', label: 'Cards', preview: '/previews/stats-cards.png' },
          { id: 'animated', label: 'Animated', preview: '/previews/stats-animated.png' },
        ],
      },
      {
        type: 'faq',
        label: 'FAQ',
        description: 'Frequently asked questions',
        icon: '❓',
        variants: [
          { id: 'accordion', label: 'Accordion', preview: '/previews/faq-accordion.png' },
          { id: 'two-column', label: 'Two Column', preview: '/previews/faq-two-col.png' },
          { id: 'cards', label: 'Cards', preview: '/previews/faq-cards.png' },
        ],
      },
      {
        type: 'tabs',
        label: 'Tabs',
        description: 'Tabbed content',
        icon: '📑',
        variants: [
          { id: 'horizontal', label: 'Horizontal', preview: '/previews/tabs-horizontal.png' },
          { id: 'vertical', label: 'Vertical', preview: '/previews/tabs-vertical.png' },
          { id: 'pills', label: 'Pills', preview: '/previews/tabs-pills.png' },
        ],
      },
      {
        type: 'cards',
        label: 'Cards',
        description: 'Custom card grid',
        icon: '🃏',
        variants: [
          { id: 'grid', label: 'Grid', preview: '/previews/cards-grid.png' },
          { id: 'carousel', label: 'Carousel', preview: '/previews/cards-carousel.png' },
          { id: 'masonry', label: 'Masonry', preview: '/previews/cards-masonry.png' },
        ],
      },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    sections: [
      {
        type: 'map',
        label: 'Map',
        description: 'Location map',
        icon: '🗺️',
        variants: [
          { id: 'default', label: 'Default', preview: '/previews/map-default.png' },
          { id: 'full-width', label: 'Full Width', preview: '/previews/map-full.png' },
          { id: 'with-info', label: 'With Info', preview: '/previews/map-info.png' },
        ],
      },
      {
        type: 'timeline',
        label: 'Timeline',
        description: 'Chronological timeline',
        icon: '📆',
        variants: [
          { id: 'vertical', label: 'Vertical', preview: '/previews/timeline-vertical.png' },
          { id: 'horizontal', label: 'Horizontal', preview: '/previews/timeline-horizontal.png' },
          { id: 'alternating', label: 'Alternating', preview: '/previews/timeline-alt.png' },
        ],
      },
      {
        type: 'custom-html',
        label: 'Custom HTML',
        description: 'Custom HTML/embed code',
        icon: '💻',
        variants: [
          { id: 'default', label: 'Default', preview: '/previews/html-default.png' },
        ],
      },
    ],
  },
]

export function SectionPanel({ templateId, onAddSection }: SectionPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  const filteredCategories = SECTION_CATEGORIES.map(category => ({
    ...category,
    sections: category.sections.filter(section =>
      section.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.sections.length > 0)

  return (
    <div className="w-72 border-r bg-white flex flex-col">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Sections List */}
      <ScrollArea className="flex-1">
        {selectedSection ? (
          <VariantSelector
            section={SECTION_CATEGORIES
              .flatMap(c => c.sections)
              .find(s => s.type === selectedSection)!}
            onSelect={(variant) => {
              onAddSection(selectedSection, variant)
              setSelectedSection(null)
            }}
            onBack={() => setSelectedSection(null)}
          />
        ) : (
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="w-full justify-start px-4 pt-4 flex-wrap h-auto gap-1">
              {filteredCategories.map(category => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="text-xs"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {filteredCategories.map(category => (
              <TabsContent key={category.id} value={category.id} className="p-4">
                <div className="space-y-2">
                  {category.sections.map(section => (
                    <button
                      key={section.type}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border hover:border-blue-500',
                        'hover:bg-blue-50 transition-colors'
                      )}
                      onClick={() => setSelectedSection(section.type)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{section.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{section.label}</div>
                          <div className="text-xs text-gray-500">{section.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </ScrollArea>
    </div>
  )
}

interface VariantSelectorProps {
  section: {
    type: string
    label: string
    variants: { id: string; label: string; preview: string }[]
  }
  onSelect: (variant: string) => void
  onBack: () => void
}

function VariantSelector({ section, onSelect, onBack }: VariantSelectorProps) {
  return (
    <div className="p-4">
      <button
        className="flex items-center gap-2 text-sm text-gray-500 mb-4 hover:text-gray-700"
        onClick={onBack}
      >
        ← Back to sections
      </button>

      <h3 className="font-medium mb-4">{section.label} Variants</h3>

      <div className="space-y-3">
        {section.variants.map(variant => (
          <button
            key={variant.id}
            className="w-full text-left rounded-lg border hover:border-blue-500 overflow-hidden transition-colors"
            onClick={() => onSelect(variant.id)}
          >
            <div className="aspect-video bg-gray-100 relative">
              <img
                src={variant.preview}
                alt={variant.label}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/previews/placeholder.png'
                }}
              />
            </div>
            <div className="p-2 text-sm font-medium">{variant.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

### Settings Panel Component

```typescript
// components/admin/page-builder/SettingsPanel.tsx

'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { ColorPicker } from '@/components/ui/color-picker'
import { MediaPicker } from '@/components/media/MediaPicker'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import type { PageSection } from '@/types/page-builder'

// Import section-specific settings components
import { HeroSettings } from './settings/HeroSettings'
import { SermonsSettings } from './settings/SermonsSettings'
import { EventsSettings } from './settings/EventsSettings'
import { GivingSettings } from './settings/GivingSettings'
import { ContactSettings } from './settings/ContactSettings'
import { GallerySettings } from './settings/GallerySettings'
import { TeamSettings } from './settings/TeamSettings'
import { TestimonialsSettings } from './settings/TestimonialsSettings'
import { CTASettings } from './settings/CTASettings'
import { FeaturesSettings } from './settings/FeaturesSettings'
import { TextSettings } from './settings/TextSettings'
import { VideoSettings } from './settings/VideoSettings'

interface SettingsPanelProps {
  section: PageSection
  onUpdate: (updates: Partial<PageSection>) => void
  onClose: () => void
  templateConfig: any
}

const SECTION_SETTINGS_MAP: Record<string, React.ComponentType<any>> = {
  hero: HeroSettings,
  sermons: SermonsSettings,
  events: EventsSettings,
  giving: GivingSettings,
  contact: ContactSettings,
  gallery: GallerySettings,
  team: TeamSettings,
  testimonials: TestimonialsSettings,
  cta: CTASettings,
  features: FeaturesSettings,
  text: TextSettings,
  video: VideoSettings,
}

export function SettingsPanel({
  section,
  onUpdate,
  onClose,
  templateConfig,
}: SettingsPanelProps) {
  const SectionSettings = SECTION_SETTINGS_MAP[section.type]

  const updateConfig = (updates: any) => {
    onUpdate({
      config: { ...section.config, ...updates },
    })
  }

  const updateStyles = (updates: any) => {
    onUpdate({
      styles: { ...section.styles, ...updates },
    })
  }

  const updateVisibility = (updates: any) => {
    onUpdate({
      visibility: { ...section.visibility, ...updates },
    })
  }

  return (
    <div className="w-80 border-l bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Section Settings</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="content" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-4 pt-2">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Content Settings */}
          <TabsContent value="content" className="p-4 space-y-6 m-0">
            {/* Variant Selector */}
            <div className="space-y-2">
              <Label>Variant</Label>
              <Select
                value={section.variant}
                onValueChange={(value) => onUpdate({ variant: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getVariantsForType(section.type).map(variant => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section-specific settings */}
            {SectionSettings && (
              <SectionSettings
                config={section.config}
                onUpdate={updateConfig}
                templateConfig={templateConfig}
              />
            )}
          </TabsContent>

          {/* Style Settings */}
          <TabsContent value="style" className="p-4 space-y-6 m-0">
            {/* Background Color */}
            <div className="space-y-2">
              <Label>Background Color</Label>
              <ColorPicker
                value={section.styles.backgroundColor || ''}
                onChange={(color) => updateStyles({ backgroundColor: color })}
              />
            </div>

            {/* Background Image */}
            <div className="space-y-2">
              <Label>Background Image</Label>
              <MediaPicker
                value={section.styles.backgroundImage}
                onChange={(url) => updateStyles({ backgroundImage: url })}
                accept="image/*"
              />
            </div>

            {/* Background Overlay */}
            {section.styles.backgroundImage && (
              <div className="space-y-2">
                <Label>Overlay Opacity</Label>
                <Slider
                  value={[section.styles.backgroundOverlay || 0]}
                  onValueChange={([value]) => updateStyles({ backgroundOverlay: value })}
                  min={0}
                  max={100}
                  step={5}
                />
                <span className="text-xs text-gray-500">
                  {section.styles.backgroundOverlay || 0}%
                </span>
              </div>
            )}

            {/* Text Color */}
            <div className="space-y-2">
              <Label>Text Color</Label>
              <ColorPicker
                value={section.styles.textColor || ''}
                onChange={(color) => updateStyles({ textColor: color })}
              />
            </div>

            {/* Padding */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Padding Top</Label>
                <Select
                  value={section.styles.paddingTop || 'lg'}
                  onValueChange={(value) => updateStyles({ paddingTop: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Padding Bottom</Label>
                <Select
                  value={section.styles.paddingBottom || 'lg'}
                  onValueChange={(value) => updateStyles({ paddingBottom: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Container Width */}
            <div className="space-y-2">
              <Label>Container Width</Label>
              <Select
                value={section.styles.containerWidth || 'normal'}
                onValueChange={(value) => updateStyles({ containerWidth: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="narrow">Narrow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="p-4 space-y-6 m-0">
            {/* Visibility */}
            <div className="space-y-4">
              <Label>Visibility</Label>

              <div className="flex items-center justify-between">
                <span className="text-sm">Desktop</span>
                <Switch
                  checked={section.visibility.desktop}
                  onCheckedChange={(checked) => updateVisibility({ desktop: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Tablet</span>
                <Switch
                  checked={section.visibility.tablet}
                  onCheckedChange={(checked) => updateVisibility({ tablet: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Mobile</span>
                <Switch
                  checked={section.visibility.mobile}
                  onCheckedChange={(checked) => updateVisibility({ mobile: checked })}
                />
              </div>
            </div>

            {/* Custom CSS */}
            <div className="space-y-2">
              <Label>Custom CSS</Label>
              <textarea
                className="w-full h-32 p-2 text-sm font-mono border rounded-md"
                placeholder=".section { /* custom styles */ }"
                value={section.styles.customCSS || ''}
                onChange={(e) => updateStyles({ customCSS: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Add custom CSS for this section
              </p>
            </div>

            {/* Section ID */}
            <div className="space-y-2">
              <Label>Section ID</Label>
              <Input
                value={section.id}
                disabled
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Use for anchor links: #{section.id}
              </p>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

function getVariantsForType(type: string) {
  const section = SECTION_CATEGORIES
    .flatMap(c => c.sections)
    .find(s => s.type === type)

  return section?.variants || [{ id: 'default', label: 'Default' }]
}
```

---

## Page Builder API Endpoints

### Page Management API

```typescript
// app/api/admin/pages/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { checkPermission } from '@/lib/middleware/permission'
import { generateSlug } from '@/lib/utils/slug'

// GET /api/admin/pages - List pages
export async function GET(request: NextRequest) {
  const { authorized, session, response } = await checkPermission([
    'CONTENT_MANAGER', 'ADMIN', 'SUPERUSER'
  ])
  if (!authorized) return response

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status')
  const type = searchParams.get('type')

  const tenantId = session.user.tenantId

  const where: any = { tenantId }
  if (status) where.status = status
  if (type) where.pageType = type

  const [pages, total] = await Promise.all([
    prisma.page.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        pageType: true,
        isHomepage: true,
        publishedAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.page.count({ where }),
  ])

  return NextResponse.json({
    pages,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

// POST /api/admin/pages - Create page
export async function POST(request: NextRequest) {
  const { authorized, session, response } = await checkPermission([
    'CONTENT_MANAGER', 'ADMIN', 'SUPERUSER'
  ])
  if (!authorized) return response

  const body = await request.json()
  const tenantId = session.user.tenantId

  const slug = body.slug || generateSlug(body.title)

  // Check for duplicate slug
  const existing = await prisma.page.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'A page with this slug already exists' },
      { status: 400 }
    )
  }

  // If setting as homepage, unset current homepage
  if (body.isHomepage) {
    await prisma.page.updateMany({
      where: { tenantId, isHomepage: true },
      data: { isHomepage: false },
    })
  }

  const page = await prisma.page.create({
    data: {
      tenantId,
      title: body.title,
      slug,
      description: body.description,
      pageType: body.pageType || 'CUSTOM',
      isHomepage: body.isHomepage || false,
      sections: body.sections || [],
      sectionOrder: body.sectionOrder || [],
      metaTitle: body.metaTitle,
      metaDesc: body.metaDesc,
      headerStyle: body.headerStyle,
      footerStyle: body.footerStyle,
      status: 'DRAFT',
      createdBy: session.user.id,
    },
  })

  return NextResponse.json(page, { status: 201 })
}
```

### Page Detail API

```typescript
// app/api/admin/pages/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { checkPermission } from '@/lib/middleware/permission'

// GET /api/admin/pages/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { authorized, session, response } = await checkPermission([
    'CONTENT_MANAGER', 'ADMIN', 'SUPERUSER'
  ])
  if (!authorized) return response

  const page = await prisma.page.findFirst({
    where: {
      id: params.id,
      tenantId: session.user.tenantId,
    },
    include: {
      author: { select: { id: true, name: true } },
      publisher: { select: { id: true, name: true } },
    },
  })

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  return NextResponse.json(page)
}

// PUT /api/admin/pages/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { authorized, session, response } = await checkPermission([
    'CONTENT_MANAGER', 'ADMIN', 'SUPERUSER'
  ])
  if (!authorized) return response

  const body = await request.json()
  const tenantId = session.user.tenantId

  const existing = await prisma.page.findFirst({
    where: { id: params.id, tenantId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  // Check slug uniqueness if changed
  if (body.slug && body.slug !== existing.slug) {
    const slugExists = await prisma.page.findFirst({
      where: { tenantId, slug: body.slug, id: { not: params.id } },
    })

    if (slugExists) {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 400 }
      )
    }
  }

  // Handle homepage change
  if (body.isHomepage && !existing.isHomepage) {
    await prisma.page.updateMany({
      where: { tenantId, isHomepage: true },
      data: { isHomepage: false },
    })
  }

  // Create revision before updating
  await prisma.pageRevision.create({
    data: {
      pageId: params.id,
      version: existing.version,
      title: existing.title,
      sections: existing.sections as any,
      sectionOrder: existing.sectionOrder,
      createdBy: session.user.id,
      changeNote: body.changeNote || 'Auto-saved revision',
    },
  })

  const page = await prisma.page.update({
    where: { id: params.id },
    data: {
      title: body.title,
      slug: body.slug,
      description: body.description,
      pageType: body.pageType,
      isHomepage: body.isHomepage,
      sections: body.sections,
      sectionOrder: body.sectionOrder,
      metaTitle: body.metaTitle,
      metaDesc: body.metaDesc,
      ogImage: body.ogImage,
      headerStyle: body.headerStyle,
      footerStyle: body.footerStyle,
      draftData: body.draftData,
      version: { increment: 1 },
    },
  })

  return NextResponse.json(page)
}

// DELETE /api/admin/pages/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { authorized, session, response } = await checkPermission([
    'ADMIN', 'SUPERUSER'
  ])
  if (!authorized) return response

  const page = await prisma.page.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
  })

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  if (page.isHomepage) {
    return NextResponse.json(
      { error: 'Cannot delete the homepage' },
      { status: 400 }
    )
  }

  await prisma.page.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
```

### Page Publish API

```typescript
// app/api/admin/pages/[id]/publish/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { checkPermission } from '@/lib/middleware/permission'

// POST /api/admin/pages/[id]/publish
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { authorized, session, response } = await checkPermission([
    'CONTENT_MANAGER', 'ADMIN', 'SUPERUSER'
  ])
  if (!authorized) return response

  const page = await prisma.page.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
  })

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  // Validate sections
  const sections = page.sections as any[]
  if (!sections || sections.length === 0) {
    return NextResponse.json(
      { error: 'Cannot publish a page with no sections' },
      { status: 400 }
    )
  }

  const updated = await prisma.page.update({
    where: { id: params.id },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedBy: session.user.id,
      draftData: null, // Clear draft data on publish
    },
  })

  return NextResponse.json(updated)
}

// POST /api/admin/pages/[id]/unpublish
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { authorized, session, response } = await checkPermission([
    'CONTENT_MANAGER', 'ADMIN', 'SUPERUSER'
  ])
  if (!authorized) return response

  const page = await prisma.page.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
  })

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  if (page.isHomepage) {
    return NextResponse.json(
      { error: 'Cannot unpublish the homepage' },
      { status: 400 }
    )
  }

  const updated = await prisma.page.update({
    where: { id: params.id },
    data: { status: 'DRAFT' },
  })

  return NextResponse.json(updated)
}
```

---

## Section Renderer System

```typescript
// components/sections/SectionRenderer.tsx

import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import type { PageSection } from '@/types/page-builder'

interface SectionRendererProps {
  section: PageSection
  templateId: string
  isEditing?: boolean
}

// Dynamic imports for each section type
const sectionComponents: Record<string, React.ComponentType<any>> = {
  hero: dynamic(() => import('./HeroSection')),
  sermons: dynamic(() => import('./SermonsSection')),
  events: dynamic(() => import('./EventsSection')),
  ministries: dynamic(() => import('./MinistriesSection')),
  giving: dynamic(() => import('./GivingSection')),
  contact: dynamic(() => import('./ContactSection')),
  gallery: dynamic(() => import('./GallerySection')),
  team: dynamic(() => import('./TeamSection')),
  testimonials: dynamic(() => import('./TestimonialsSection')),
  cta: dynamic(() => import('./CTASection')),
  features: dynamic(() => import('./FeaturesSection')),
  stats: dynamic(() => import('./StatsSection')),
  faq: dynamic(() => import('./FAQSection')),
  tabs: dynamic(() => import('./TabsSection')),
  text: dynamic(() => import('./TextSection')),
  video: dynamic(() => import('./VideoSection')),
  newsletter: dynamic(() => import('./NewsletterSection')),
  map: dynamic(() => import('./MapSection')),
  timeline: dynamic(() => import('./TimelineSection')),
  cards: dynamic(() => import('./CardsSection')),
  'custom-html': dynamic(() => import('./CustomHTMLSection')),
}

export function SectionRenderer({
  section,
  templateId,
  isEditing = false,
}: SectionRendererProps) {
  const SectionComponent = sectionComponents[section.type]

  if (!SectionComponent) {
    return (
      <div className="p-8 text-center text-gray-500">
        Unknown section type: {section.type}
      </div>
    )
  }

  const paddingClasses = {
    none: 'py-0',
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16 md:py-20',
    xl: 'py-20 md:py-28',
  }

  const containerClasses = {
    full: 'w-full',
    wide: 'max-w-7xl mx-auto px-4',
    normal: 'max-w-6xl mx-auto px-4',
    narrow: 'max-w-4xl mx-auto px-4',
  }

  const sectionStyle: React.CSSProperties = {
    backgroundColor: section.styles.backgroundColor,
    color: section.styles.textColor,
    ...(section.styles.backgroundImage && {
      backgroundImage: `url(${section.styles.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
  }

  return (
    <section
      id={section.id}
      className={cn(
        paddingClasses[section.styles.paddingTop || 'lg'],
        paddingClasses[section.styles.paddingBottom || 'lg'],
        'relative'
      )}
      style={sectionStyle}
    >
      {/* Background Overlay */}
      {section.styles.backgroundImage && section.styles.backgroundOverlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: section.styles.backgroundOverlay / 100 }}
        />
      )}

      {/* Container */}
      <div
        className={cn(
          'relative z-10',
          containerClasses[section.styles.containerWidth || 'normal']
        )}
      >
        <SectionComponent
          config={section.config}
          variant={section.variant}
          templateId={templateId}
          isEditing={isEditing}
        />
      </div>

      {/* Custom CSS */}
      {section.styles.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: section.styles.customCSS }} />
      )}
    </section>
  )
}
```

---

## Public Page Rendering

```typescript
// app/[slug]/page.tsx

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { getTenantFromDomain } from '@/lib/tenant/getTenant'
import { getTemplateConfig } from '@/lib/template/getTemplateConfig'
import { SectionRenderer } from '@/components/sections/SectionRenderer'
import { PublicLayout } from '@/components/layout/PublicLayout'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tenant = await getTenantFromDomain()
  if (!tenant) return {}

  const page = await prisma.page.findFirst({
    where: {
      tenantId: tenant.id,
      slug: params.slug,
      status: 'PUBLISHED',
    },
  })

  if (!page) return {}

  return {
    title: page.metaTitle || page.title,
    description: page.metaDesc || page.description,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDesc || page.description,
      images: page.ogImage ? [page.ogImage] : undefined,
    },
  }
}

export default async function DynamicPage({ params }: PageProps) {
  const tenant = await getTenantFromDomain()
  if (!tenant) notFound()

  const page = await prisma.page.findFirst({
    where: {
      tenantId: tenant.id,
      slug: params.slug,
      status: 'PUBLISHED',
    },
  })

  if (!page) notFound()

  const templateConfig = await getTemplateConfig(tenant.id)
  const sections = page.sections as any[]

  return (
    <PublicLayout
      tenant={tenant}
      headerStyle={page.headerStyle}
      footerStyle={page.footerStyle}
    >
      {sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          templateId={tenant.templateId}
        />
      ))}
    </PublicLayout>
  )
}
```

---

## Best Practices & Guidelines

### For Church Administrators

1. **Start with Hero**: Every page should begin with a hero section
2. **Keep It Simple**: Avoid too many sections on a single page
3. **Mobile First**: Always preview on mobile before publishing
4. **Consistent Branding**: Use template colors for consistency
5. **Clear CTAs**: Every page should have a clear call-to-action
6. **Save Often**: Use auto-save but also manually save important changes

### For Developers

1. **Section Independence**: Each section should be self-contained
2. **Template Awareness**: Respect template CSS variables
3. **Performance**: Lazy load heavy components
4. **Accessibility**: Ensure all sections meet WCAG standards
5. **Responsive Design**: Test all variants at all breakpoints
6. **Error Handling**: Graceful fallbacks for missing data

### Section Development Checklist

- [ ] Create section type definition
- [ ] Implement all variants (3-5 per type)
- [ ] Add default configuration
- [ ] Create settings component
- [ ] Add preview images
- [ ] Implement responsive styles
- [ ] Test with multiple templates
- [ ] Document usage and options

---

## Summary

The Visual Page Builder provides:

| Feature | Implementation | Status |
|---------|----------------|--------|
| Drag & Drop | @dnd-kit | Complete |
| 20+ Section Types | Modular components | Complete |
| 3-5 Variants per Type | Dynamic imports | Complete |
| Real-Time Preview | Iframe rendering | Complete |
| Undo/Redo | Custom hook | Complete |
| Version History | Database revisions | Complete |
| Responsive Editing | Viewport switching | Complete |
| Template Integration | CSS variables | Complete |
| Auto-Save | 30-second interval | Complete |
| Keyboard Shortcuts | Native events | Complete |

**Section Categories**: Content (3), Church (4), People (2), Media (1), Engagement (3), Layout (5), Advanced (3) = **21 total section types**

**Total Variants**: ~75 unique section variants across all types
