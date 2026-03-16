import { NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'

/**
 * GET /api/v1/speakers/frequent
 *
 * Returns all members sorted by how frequently they appear as speakers
 * in messages. Members with the most messages appear first, followed by
 * all remaining members alphabetically.
 *
 * Results are cached for 5 minutes to avoid repeated DB queries.
 */
export async function GET() {
  try {
    const churchId = await getChurchId()

    const data = await getCachedFrequentSpeakers(churchId)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/speakers/frequent error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch speakers' } },
      { status: 500 },
    )
  }
}

const getCachedFrequentSpeakers = unstable_cache(
  async (churchId: string) => {
    // Message.speakerId references the Speaker table, so we must return Speaker IDs.
    // Fetch all speakers with their message counts.
    const speakers = await prisma.speaker.findMany({
      where: { churchId, deletedAt: null },
      select: {
        id: true,
        name: true,
        _count: { select: { messages: true } },
      },
      orderBy: [{ name: 'asc' }],
    })

    const results = speakers.map((s) => ({
      id: s.id,
      name: s.name,
      messageCount: s._count.messages,
    }))

    // Sort: most frequent speakers first, then alphabetically
    results.sort((a, b) => {
      if (a.messageCount !== b.messageCount) return b.messageCount - a.messageCount
      return a.name.localeCompare(b.name)
    })

    return results
  },
  ['frequent-speakers'],
  { revalidate: 300 }, // Cache for 5 minutes
)
