import { notFound } from "next/navigation"
import { getChurchId } from "@/lib/api/get-church-id"
import { getPageById } from "@/lib/dal/pages"
import { resolveSectionData } from "@/lib/website/resolve-section-data"
import { buildNavbarProps, buildFooterProps, buildThemeTokens } from "@/lib/website/build-layout-props"
import { FontLoader } from "@/components/website/font-loader"
import { BuilderPreviewClient } from "@/components/cms/website/builder/canvas/builder-preview-client"
import type { SectionType } from "@/lib/db/types"
import type { NavbarData } from "@/components/cms/website/builder/types"

interface PreviewPageProps {
  params: Promise<{ pageId: string }>
}

export default async function BuilderPreviewPage({ params }: PreviewPageProps) {
  const { pageId } = await params
  const churchId = await getChurchId()

  const page = await getPageById(churchId, pageId)
  if (!page) {
    notFound()
  }

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

  // Fetch navbar, footer, and theme data in parallel using shared builders
  const [navbarResult, themeResult] = await Promise.all([
    buildNavbarProps(churchId),
    buildThemeTokens(churchId),
  ])

  const { navbarProps, siteSettings } = navbarResult
  const { websiteThemeTokens, websiteCustomCss } = themeResult

  // Fetch footer data (reuse siteSettings from navbar call)
  const footerResult = await buildFooterProps(churchId, siteSettings)

  // Serialize navbar data for client component
  const navbarData: NavbarData = {
    menu: navbarProps.menu ? JSON.parse(JSON.stringify(navbarProps.menu)) : null,
    logoUrl: navbarProps.logoUrl,
    logoDarkUrl: navbarProps.logoDarkUrl,
    logoAlt: navbarProps.logoAlt,
    siteName: navbarProps.siteName,
    ctaLabel: navbarProps.ctaLabel,
    ctaHref: navbarProps.ctaHref,
    ctaVisible: navbarProps.ctaVisible,
    memberLoginLabel: navbarProps.memberLoginLabel,
    memberLoginHref: navbarProps.memberLoginHref,
    memberLoginVisible: navbarProps.memberLoginVisible,
    scrollBehavior: navbarProps.scrollBehavior,
    solidColor: navbarProps.solidColor,
    sticky: navbarProps.sticky,
  }

  // Serialize footer data for client component (crosses server→client boundary)
  const footerMenu = footerResult.menu ? JSON.parse(JSON.stringify(footerResult.menu)) : null
  const footerSiteSettings = JSON.parse(JSON.stringify(footerResult.siteSettings))

  return (
    <>
      <FontLoader churchId={churchId} />

      {/* Reset iframe body styles */}
      <style dangerouslySetInnerHTML={{ __html: "body { margin: 0; overflow-x: hidden; }" }} />

      {/* Custom CSS from ThemeCustomization */}
      {websiteCustomCss && (
        <style dangerouslySetInnerHTML={{ __html: websiteCustomCss }} />
      )}

      {/* Website-scoped container with theme tokens */}
      <div
        data-website=""
        style={websiteThemeTokens as React.CSSProperties}
      >
        <BuilderPreviewClient
          initialSections={resolvedSections}
          initialSelectedSectionId={null}
          churchId={churchId}
          pageSlug={page.slug}
          navbarData={navbarData}
          footerMenu={footerMenu}
          footerSiteSettings={footerSiteSettings}
        />
      </div>
    </>
  )
}
