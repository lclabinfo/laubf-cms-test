import { notFound } from "next/navigation"
import { getChurchId } from "@/lib/api/get-church-id"
import { getPageById, getPages } from "@/lib/dal/pages"
import { resolveSectionData } from "@/lib/website/resolve-section-data"
import { getThemeWithCustomization } from "@/lib/dal/theme"
import { getMenuByLocation } from "@/lib/dal/menus"
import { getSiteSettings } from "@/lib/dal/site-settings"
import { FontLoader } from "@/components/website/font-loader"
import { BuilderShell } from "@/components/cms/website/builder/builder-shell"
import type { SectionType } from "@/lib/db/types"

interface BuilderPageProps {
  params: Promise<{ pageId: string }>
}

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { pageId } = await params
  const churchId = await getChurchId()

  const page = await getPageById(churchId, pageId)
  if (!page) {
    notFound()
  }

  // Get all pages for the page switcher in topbar
  const allPages = await getPages(churchId)

  // Resolve dynamic data for all sections in parallel
  const resolvedSections = await Promise.all(
    page.sections.map(async (s) => {
      const rawContent = s.content as Record<string, unknown>
      const { content, resolvedData } = await resolveSectionData(
        churchId,
        s.sectionType as SectionType,
        rawContent,
      )
      return {
        id: s.id,
        sectionType: s.sectionType,
        label: s.label,
        sortOrder: s.sortOrder,
        visible: s.visible,
        colorScheme: s.colorScheme,
        paddingY: s.paddingY,
        containerWidth: s.containerWidth,
        enableAnimations: s.enableAnimations,
        content,
        resolvedData,
      }
    }),
  )

  // Fetch navbar data for canvas preview
  const [siteSettings, headerMenu, themeData] = await Promise.all([
    getSiteSettings(churchId),
    getMenuByLocation(churchId, 'HEADER'),
    getThemeWithCustomization(churchId),
  ])

  // Serialize navbar data for client components
  const navbarData = {
    menu: headerMenu ? JSON.parse(JSON.stringify(headerMenu)) : null,
    logoUrl: siteSettings?.logoUrl ?? null,
    logoAlt: siteSettings?.logoAlt ?? null,
    siteName: siteSettings?.siteName ?? 'Church',
    ctaLabel: "I\u2019m new",
    ctaHref: "/website/im-new",
    ctaVisible: true,
    memberLoginVisible: siteSettings?.enableMemberLogin ?? false,
  }

  // Build website theme tokens for canvas-scoped injection (not wrapping the whole builder)
  const defaultTokens = (themeData?.theme?.defaultTokens ?? {}) as Record<string, string>
  const websiteThemeTokens: Record<string, string> = {
    '--ws-color-primary': themeData?.primaryColor || defaultTokens['--color-primary'] || '#1a1a2e',
    '--ws-color-secondary': themeData?.secondaryColor || defaultTokens['--color-secondary'] || '#16213e',
    '--ws-color-background': themeData?.backgroundColor || defaultTokens['--color-background'] || '#ffffff',
    '--ws-color-text': themeData?.textColor || defaultTokens['--color-text'] || '#1a1a1a',
    '--ws-color-heading': themeData?.headingColor || defaultTokens['--color-heading'] || '#0a0a0a',
    '--ws-font-size-base': `${themeData?.baseFontSize || 16}px`,
    '--ws-border-radius': themeData?.borderRadius || defaultTokens['--border-radius'] || '0.5rem',
  }
  if (themeData?.bodyFont) {
    websiteThemeTokens['--ws-font-body'] = `"${themeData.bodyFont}", ui-sans-serif, system-ui, sans-serif`
  }
  if (themeData?.headingFont) {
    websiteThemeTokens['--ws-font-heading'] = `"${themeData.headingFont}", ui-serif, Georgia, serif`
  }

  // Extract custom CSS for canvas-scoped injection (mirrors ThemeProvider behavior)
  const websiteCustomCss = themeData?.customCss || ''

  // Serialize page data for the client component
  const serializedPage = {
    id: page.id,
    slug: page.slug,
    title: page.title,
    pageType: page.pageType,
    layout: page.layout,
    isHomepage: page.isHomepage,
    isPublished: page.isPublished,
    publishedAt: page.publishedAt?.toISOString() ?? null,
    sortOrder: page.sortOrder,
    parentId: page.parentId,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    sections: resolvedSections,
  }

  const serializedPages = allPages.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    pageType: p.pageType,
    isHomepage: p.isHomepage,
    isPublished: p.isPublished,
    sortOrder: p.sortOrder,
    parentId: p.parentId,
  }))

  return (
    <>
      <FontLoader churchId={churchId} />
      <BuilderShell
        page={serializedPage}
        allPages={serializedPages}
        churchId={churchId}
        websiteThemeTokens={websiteThemeTokens}
        websiteCustomCss={websiteCustomCss}
        navbarData={navbarData}
      />
    </>
  )
}
