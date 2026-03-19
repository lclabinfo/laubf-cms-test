import { notFound } from "next/navigation"
import { getChurchId } from "@/lib/api/get-church-id"
import { getPageById, getPages } from "@/lib/dal/pages"
import { resolveSectionData } from "@/lib/website/resolve-section-data"
import { buildNavbarProps, buildThemeTokens } from "@/lib/website/build-layout-props"
import { FontLoader } from "@/components/website/font-loader"
import { BuilderShell } from "@/components/cms/website/builder/builder-shell"
import type { SectionType } from "@/lib/db/types"
import type { NavTreeMenuItem } from "@/components/cms/website/builder/types"

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

  // Fetch navbar + theme data via shared layout builders
  const [{ navbarProps, headerMenu, siteSettings }, { websiteThemeTokens, websiteCustomCss }] =
    await Promise.all([
      buildNavbarProps(churchId),
      buildThemeTokens(churchId),
    ])

  // Serialize navbar data for client components (deep-clone menu to cross server→client boundary)
  const navbarData = {
    ...navbarProps,
    menu: headerMenu ? JSON.parse(JSON.stringify(headerMenu)) : null,
  }

  // Derive navbar settings from siteSettings (avoids redundant DB call)
  const navbarSettings = {
    scrollBehavior: siteSettings?.navScrollBehavior ?? 'transparent-to-solid',
    solidColor: siteSettings?.navSolidColor ?? 'white',
    sticky: siteSettings?.navSticky ?? true,
    ctaLabel: siteSettings?.navCtaLabel ?? '',
    ctaHref: siteSettings?.navCtaHref ?? '',
    ctaVisible: siteSettings?.navCtaVisible ?? false,
  }

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

  // Serialize header menu items for the nav-driven page tree
  type RawMenuItem = {
    id: string
    label: string
    href: string | null
    isExternal: boolean
    groupLabel: string | null
    sortOrder: number
    children?: RawMenuItem[]
  }
  function serializeMenuItems(items: RawMenuItem[]): NavTreeMenuItem[] {
    return items.map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      isExternal: item.isExternal,
      groupLabel: item.groupLabel,
      sortOrder: item.sortOrder,
      children: serializeMenuItems(item.children ?? []),
    }))
  }
  const headerMenuItems: NavTreeMenuItem[] = headerMenu?.items
    ? serializeMenuItems(headerMenu.items as RawMenuItem[])
    : []

  // Serialize full menu items for NavigationEditor (includes all fields)
  const headerMenuItemsFull = headerMenu?.items
    ? JSON.parse(JSON.stringify(headerMenu.items))
    : []

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
        headerMenuItems={headerMenuItems}
        headerMenuId={headerMenu?.id ?? null}
        headerMenuItemsFull={headerMenuItemsFull}
        navbarSettings={navbarSettings}
      />
    </>
  )
}
