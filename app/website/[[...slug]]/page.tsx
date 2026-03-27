import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getChurchId } from '@/lib/tenant/context'
import { getPageBySlug, getHomepage } from '@/lib/dal/pages'
import { getSiteSettings } from '@/lib/dal/site-settings'
import { SectionRenderer } from '@/components/website/sections/registry'
import { resolveSectionData } from '@/lib/website/resolve-section-data'
import type { SectionType } from '@/lib/db/types'

export const revalidate = 60

interface PageProps {
  params: Promise<{ slug?: string[] }>
}

async function resolvePage(params: Promise<{ slug?: string[] }>) {
  const churchId = await getChurchId()
  const slugParts = (await params).slug ?? []
  const slug = slugParts.join('/') || null
  const isHomepage = slugParts.length === 0

  const page = slug
    ? await getPageBySlug(churchId, slug)
    : await getHomepage(churchId)

  return { churchId, page, isHomepage }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page, isHomepage } = await resolvePage(params)
  if (!page) return {}

  const churchId = await getChurchId()
  const siteSettings = await getSiteSettings(churchId)

  // Homepage uses the layout's default title (site name only)
  const title = isHomepage ? undefined : (page.metaTitle || page.title)

  const siteName = siteSettings?.siteName ?? 'Church'

  // For OG title: homepage uses full name + tagline; other pages use "Page | Site"
  const ogTitle = isHomepage
    ? (siteSettings?.tagline
      ? `${siteName} (${siteSettings.tagline})`
      : siteName)
    : `${title || page.title} | ${siteName}`

  // Use page-level OG image, fall back to site-level default
  const ogImage = page.ogImageUrl || siteSettings?.ogImageUrl || undefined

  return {
    // When title is undefined (homepage), the layout default is used
    ...(title ? { title } : {}),
    description: page.metaDescription || undefined,
    openGraph: {
      title: ogTitle,
      description: page.metaDescription || siteSettings?.description || undefined,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: page.noIndex ? { index: false } : undefined,
  }
}

export default async function WebsitePage({ params }: PageProps) {
  const { churchId, page } = await resolvePage(params)

  if (!page) notFound()

  const visibleSections = page.sections.filter((section) => section.visible)

  // Resolve dataSource references in parallel
  const resolvedSections = await Promise.all(
    visibleSections.map(async (section) => {
      const { content, resolvedData } = await resolveSectionData(
        churchId,
        section.sectionType as SectionType,
        section.content as Record<string, unknown>,
      )
      return { section, content, resolvedData }
    }),
  )

  return (
    <>
      {resolvedSections.map(({ section, content, resolvedData }) => (
        <SectionRenderer
          key={section.id}
          type={section.sectionType}
          content={content}
          colorScheme={section.colorScheme}
          paddingY={section.paddingY}
          containerWidth={section.containerWidth}
          enableAnimations={section.enableAnimations}
          churchId={churchId}
          resolvedData={resolvedData}
        />
      ))}
    </>
  )
}
