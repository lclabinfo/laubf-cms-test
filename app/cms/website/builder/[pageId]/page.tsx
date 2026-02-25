import { notFound } from "next/navigation"
import { getChurchId } from "@/lib/api/get-church-id"
import { getPageById, getPages } from "@/lib/dal/pages"
import { BuilderShell } from "@/components/cms/website/builder/builder-shell"

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
    sections: page.sections.map((s) => ({
      id: s.id,
      sectionType: s.sectionType,
      label: s.label,
      sortOrder: s.sortOrder,
      visible: s.visible,
      colorScheme: s.colorScheme,
      paddingY: s.paddingY,
      containerWidth: s.containerWidth,
      enableAnimations: s.enableAnimations,
      content: s.content as Record<string, unknown>,
    })),
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
    <BuilderShell
      page={serializedPage}
      allPages={serializedPages}
      churchId={churchId}
    />
  )
}
