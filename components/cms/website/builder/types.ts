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
