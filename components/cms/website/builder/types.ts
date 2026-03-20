import type { SectionType, ColorScheme, PaddingSize, ContainerWidth, PageType, PageLayout } from "@/lib/db/types"

export type BuilderTool = "add" | "navigation" | "design" | "media" | null

export type DeviceMode = "desktop" | "tablet" | "mobile"

export interface BuilderSection {
  id: string
  sectionType: SectionType
  label: string | null
  sortOrder: number
  visible: boolean
  colorScheme: ColorScheme
  paddingY: PaddingSize
  containerWidth: ContainerWidth
  enableAnimations: boolean
  content: Record<string, unknown>
  /** Server-resolved data for dynamic sections (events, messages, etc.) */
  resolvedData?: Record<string, unknown>
}

export interface BuilderPage {
  id: string
  slug: string
  title: string
  pageType: PageType
  layout: PageLayout
  isHomepage: boolean
  isPublished: boolean
  publishedAt: string | null
  sortOrder: number
  parentId: string | null
  metaTitle: string | null
  metaDescription: string | null
  sections: BuilderSection[]
}

export interface PageSummary {
  id: string
  slug: string
  title: string
  pageType: PageType
  isHomepage: boolean
  isPublished: boolean
  sortOrder: number
  parentId: string | null
}

// ---------------------------------------------------------------------------
// Navbar data (shared between builder shell, iframe protocol, preview route)
// ---------------------------------------------------------------------------

export interface NavbarData {
  menu: unknown
  logoUrl: string | null
  logoDarkUrl: string | null
  logoAlt: string | null
  siteName: string
  ctaLabel: string | null
  ctaHref: string | null
  ctaVisible: boolean
  memberLoginLabel: string
  memberLoginHref: string
  memberLoginVisible: boolean
  scrollBehavior: string
  solidColor: string
  sticky: boolean
}

