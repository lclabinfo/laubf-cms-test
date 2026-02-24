import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getChurchId } from '@/lib/tenant/context'
import { getPageBySlug, getHomepage } from '@/lib/dal/pages'
import { SectionRenderer } from '@/components/website/sections/registry'

interface PageProps {
  params: Promise<{ slug?: string[] }>
}

async function resolvePage(params: Promise<{ slug?: string[] }>) {
  const churchId = await getChurchId()
  const slugParts = (await params).slug ?? []
  const slug = slugParts.join('/') || null

  const page = slug
    ? await getPageBySlug(churchId, slug)
    : await getHomepage(churchId)

  return { churchId, page }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page } = await resolvePage(params)
  if (!page) return {}

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      images: page.ogImageUrl ? [page.ogImageUrl] : undefined,
    },
    robots: page.noIndex ? { index: false } : undefined,
  }
}

export default async function WebsitePage({ params }: PageProps) {
  const { churchId, page } = await resolvePage(params)

  if (!page) notFound()

  return (
    <>
      {page.sections
        .filter((section) => section.visible)
        .map((section) => (
          <SectionRenderer
            key={section.id}
            type={section.sectionType}
            content={section.content as Record<string, unknown>}
            colorScheme={section.colorScheme}
            paddingY={section.paddingY}
            containerWidth={section.containerWidth}
            enableAnimations={section.enableAnimations}
            churchId={churchId}
          />
        ))}
    </>
  )
}
