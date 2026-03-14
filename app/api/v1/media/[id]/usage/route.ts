import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { prisma } from '@/lib/db'

// ---------------------------------------------------------------------------
// GET /api/v1/media/[id]/usage — Find where a media asset is used
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireApiAuth('media.view')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { id } = await params

    // Get the media asset URL
    const asset = await prisma.mediaAsset.findFirst({
      where: { id, churchId },
      select: { url: true },
    })

    if (!asset) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Media asset not found' } },
        { status: 404 },
      )
    }

    const url = asset.url
    type Usage = { type: string; id: string; title: string; url: string; detail?: string }
    const usages: Usage[] = []

    // Run all queries in parallel for performance
    const [
      eventCoverResults,
      eventDescResults,
      seriesResults,
      messageThumbnailResults,
      messageStudyResults,
      messageTranscriptResults,
      churchResults,
      siteSettingsResults,
      sectionRows,
      pageOgResults,
      speakerResults,
      personResults,
      ministryResults,
      campusResults,
    ] = await Promise.all([
      // 1. Event.coverImage
      prisma.event.findMany({
        where: { churchId, coverImage: url, deletedAt: null },
        select: { id: true, title: true },
        take: 20,
      }),

      // 2. Event.description (text contains URL)
      prisma.event.findMany({
        where: { churchId, description: { contains: url }, deletedAt: null },
        select: { id: true, title: true },
        take: 20,
      }),

      // 3. Series.imageUrl
      prisma.series.findMany({
        where: { churchId, imageUrl: url, deletedAt: null },
        select: { id: true, name: true },
        take: 20,
      }),

      // 4. Message.thumbnailUrl
      prisma.message.findMany({
        where: { churchId, thumbnailUrl: url, deletedAt: null },
        select: { id: true, title: true },
        take: 20,
      }),

      // 5. Message.studySections (JSONB contains URL) — use raw query
      prisma.$queryRaw<Array<{ id: string; title: string }>>`
        SELECT "id", "title"
        FROM "Message"
        WHERE "churchId" = ${churchId}
          AND "deletedAt" IS NULL
          AND "studySections" IS NOT NULL
          AND "studySections"::text LIKE ${'%' + url + '%'}
        LIMIT 20
      `,

      // 6. Message.rawTranscript (text contains URL)
      prisma.message.findMany({
        where: { churchId, rawTranscript: { contains: url }, deletedAt: null },
        select: { id: true, title: true },
        take: 20,
      }),

      // 7. Church.logoUrl
      prisma.church.findMany({
        where: { id: churchId, logoUrl: url },
        select: { id: true, name: true },
        take: 1,
      }),

      // 8. SiteSettings logoUrl, logoDarkUrl, faviconUrl, ogImageUrl
      prisma.siteSettings.findMany({
        where: {
          churchId,
          OR: [
            { logoUrl: url },
            { logoDarkUrl: url },
            { faviconUrl: url },
            { ogImageUrl: url },
          ],
        },
        select: { id: true, logoUrl: true, logoDarkUrl: true, faviconUrl: true, ogImageUrl: true },
        take: 1,
      }),

      // 9. PageSection.content (JSONB contains URL)
      prisma.$queryRaw<
        Array<{
          id: string
          label: string | null
          sectionType: string
          pageId: string
          pageTitle: string
          pageSlug: string
        }>
      >`
        SELECT
          ps."id",
          ps."label",
          ps."sectionType",
          p."id"    AS "pageId",
          p."title" AS "pageTitle",
          p."slug"  AS "pageSlug"
        FROM "PageSection" ps
        JOIN "Page" p ON p."id" = ps."pageId"
        WHERE p."churchId" = ${churchId}
          AND ps."content" IS NOT NULL
          AND ps."content"::text LIKE ${'%' + url + '%'}
        LIMIT 20
      `,

      // 10. Page.ogImageUrl
      prisma.page.findMany({
        where: { churchId, ogImageUrl: url },
        select: { id: true, title: true },
        take: 20,
      }),

      // 11. Speaker.photoUrl
      prisma.speaker.findMany({
        where: { churchId, photoUrl: url, deletedAt: null },
        select: { id: true, name: true },
        take: 20,
      }),

      // 12. Person.photoUrl
      prisma.person.findMany({
        where: { churchId, photoUrl: url, deletedAt: null },
        select: { id: true, firstName: true, lastName: true },
        take: 20,
      }),

      // 13. Ministry.imageUrl
      prisma.ministry.findMany({
        where: { churchId, imageUrl: url, deletedAt: null },
        select: { id: true, name: true },
        take: 20,
      }),

      // 14. Campus.imageUrl
      prisma.campus.findMany({
        where: { churchId, imageUrl: url, deletedAt: null },
        select: { id: true, name: true },
        take: 20,
      }),
    ])

    // Map results to usages

    // Deduplicate event IDs across coverImage and description queries
    const eventCoverIds = new Set(eventCoverResults.map((e) => e.id))

    for (const e of eventCoverResults) {
      usages.push({
        type: 'event',
        id: e.id,
        title: e.title,
        url: `/cms/events/${e.id}`,
        detail: 'Cover Image',
      })
    }

    for (const e of eventDescResults) {
      if (!eventCoverIds.has(e.id)) {
        usages.push({
          type: 'event',
          id: e.id,
          title: e.title,
          url: `/cms/events/${e.id}`,
          detail: 'Description',
        })
      }
    }

    for (const s of seriesResults) {
      usages.push({
        type: 'series',
        id: s.id,
        title: s.name,
        url: `/cms/messages/series/${s.id}`,
        detail: 'Series Image',
      })
    }

    // Deduplicate message IDs across thumbnail, studySections, transcript
    const messageSeen = new Set<string>()

    for (const m of messageThumbnailResults) {
      messageSeen.add(m.id)
      usages.push({
        type: 'message',
        id: m.id,
        title: m.title,
        url: `/cms/messages/${m.id}`,
        detail: 'Thumbnail',
      })
    }

    for (const m of messageStudyResults) {
      if (!messageSeen.has(m.id)) {
        messageSeen.add(m.id)
        usages.push({
          type: 'message',
          id: m.id,
          title: m.title,
          url: `/cms/messages/${m.id}`,
          detail: 'Study Content',
        })
      }
    }

    for (const m of messageTranscriptResults) {
      if (!messageSeen.has(m.id)) {
        messageSeen.add(m.id)
        usages.push({
          type: 'message',
          id: m.id,
          title: m.title,
          url: `/cms/messages/${m.id}`,
          detail: 'Transcript',
        })
      }
    }

    for (const c of churchResults) {
      usages.push({
        type: 'church',
        id: c.id,
        title: 'Church Logo',
        url: '/cms/settings',
      })
    }

    for (const ss of siteSettingsResults) {
      const fields: string[] = []
      if (ss.logoUrl === url) fields.push('Logo')
      if (ss.logoDarkUrl === url) fields.push('Dark Logo')
      if (ss.faviconUrl === url) fields.push('Favicon')
      if (ss.ogImageUrl === url) fields.push('Social Image')
      usages.push({
        type: 'site-settings',
        id: ss.id,
        title: `Site Settings: ${fields.join(', ')}`,
        url: '/cms/website/settings',
      })
    }

    for (const s of sectionRows) {
      usages.push({
        type: 'page-section',
        id: s.id,
        title: s.pageTitle,
        url: `/cms/website/builder/${s.pageId}`,
        detail: s.label || s.sectionType?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
      })
    }

    for (const p of pageOgResults) {
      usages.push({
        type: 'page',
        id: p.id,
        title: p.title,
        url: `/cms/website/builder/${p.id}`,
        detail: 'Social Image',
      })
    }

    for (const s of speakerResults) {
      usages.push({
        type: 'speaker',
        id: s.id,
        title: s.name,
        url: `/cms/messages?speaker=${s.id}`,
        detail: 'Speaker Photo',
      })
    }

    for (const p of personResults) {
      usages.push({
        type: 'person',
        id: p.id,
        title: `${p.firstName} ${p.lastName}`,
        url: `/cms/people/${p.id}`,
        detail: 'Profile Photo',
      })
    }

    for (const m of ministryResults) {
      usages.push({
        type: 'ministry',
        id: m.id,
        title: m.name,
        url: `/cms/ministries/${m.id}`,
        detail: 'Ministry Image',
      })
    }

    for (const c of campusResults) {
      usages.push({
        type: 'campus',
        id: c.id,
        title: c.name,
        url: `/cms/settings/campuses`,
        detail: 'Campus Image',
      })
    }

    return NextResponse.json({ success: true, data: usages })
  } catch (error) {
    console.error('GET /api/v1/media/[id]/usage error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get media usage' } },
      { status: 500 },
    )
  }
}
