import { NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'

/**
 * GET /api/v1/speakers/frequent
 *
 * Returns all members (Person records) sorted by how frequently they appear
 * as messengers in messages. Members with the most messages appear first,
 * followed by all remaining members alphabetically.
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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch members' } },
      { status: 500 },
    )
  }
}

const getCachedFrequentSpeakers = unstable_cache(
  async (churchId: string) => {
    // Query Person records directly with message counts.
    // Message.speakerId now references Person.id.
    const people = await prisma.person.findMany({
      where: { churchId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        preferredName: true,
        _count: { select: { messages: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    const results = people.map((p) => ({
      id: p.id,
      name: p.preferredName
        ? `${p.preferredName} ${p.lastName}`
        : `${p.firstName} ${p.lastName}`,
      messageCount: p._count.messages,
    }))

    // Sort: most frequent messengers first, then alphabetically
    results.sort((a, b) => {
      if (a.messageCount !== b.messageCount) return b.messageCount - a.messageCount
      return a.name.localeCompare(b.name)
    })

    return results
  },
  ['frequent-speakers'],
  { revalidate: 300 },
)
