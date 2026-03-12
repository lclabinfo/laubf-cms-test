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
    // Get all people
    const people = await prisma.person.findMany({
      where: { churchId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        preferredName: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    // Get all speakers with their message counts (legacy Speaker table)
    // Messages reference Speaker.name, and Person records match Speaker records by name
    const speakers = await prisma.speaker.findMany({
      where: { churchId, deletedAt: null },
      select: {
        name: true,
        _count: { select: { messages: true } },
      },
    })

    // Build a map of speaker name → message count
    const speakerCounts = new Map<string, number>()
    for (const s of speakers) {
      speakerCounts.set(s.name.toLowerCase(), s._count.messages)
    }

    // Map people to results with message counts
    const results = people.map((p) => {
      const displayName = p.preferredName
        ? `${p.preferredName} ${p.lastName}`
        : `${p.firstName} ${p.lastName}`

      // Match by full name (case-insensitive)
      const messageCount = speakerCounts.get(displayName.toLowerCase()) ?? 0

      return {
        id: p.id,
        name: displayName,
        messageCount,
      }
    })

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
