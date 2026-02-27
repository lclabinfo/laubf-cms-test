import type { SectionType, ColorScheme, PaddingSize, ContainerWidth, PageType, PageLayout } from "@/lib/db/types"

export type BuilderTool = "add" | "pages" | "design" | "media" | null

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
// Nav-driven page tree types
// ---------------------------------------------------------------------------

/** Serialized menu item passed from the server component. */
export interface NavTreeMenuItem {
  id: string
  label: string
  href: string | null
  isExternal: boolean
  groupLabel: string | null
  sortOrder: number
  children: NavTreeMenuItem[]
}

export type NavTreeNodeKind = "page" | "folder" | "link"

/** A node in the navigation-driven page tree. */
export interface NavTreeNode {
  id: string
  label: string
  kind: NavTreeNodeKind
  pageId: string | null
  pageType: PageType | null
  isHomepage: boolean
  isPublished: boolean
  href: string | null
  isExternal: boolean
  groupLabel: string | null
  children: NavTreeNode[]
}
