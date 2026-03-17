import { NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'

/**
 * GET /api/v1/speakers/frequent
 *
 * Returns all members (Person records) sorted by how frequently they appear
 * as messengers in messages. Cached indefinitely, invalidated via
 * revalidateTag('members', { expire: 0 }) when members are created/updated.
 */
export async function GET() {
  try {
    const churchId = await getChurchId()
    const data = await getFrequentSpeakers(churchId)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/speakers/frequent error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch members' } },
      { status: 500 },
    )
  }
}

const getFrequentSpeakers = unstable_cache(
  async (churchId: string) => {
    const people = await prisma.person.findMany({
      where: { churchId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        preferredName: true,
        _count: { select: { messages: { where: { deletedAt: null } } } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    const results = people.map((p) => ({
      id: p.id,
      name: p.preferredName
        ? `${p.preferredName} ${p.lastName}`
        : `${p.firstName} ${p.lastName}`,
      firstName: p.firstName,
      lastName: p.lastName,
      preferredName: p.preferredName,
      messageCount: p._count.messages,
    }))

    results.sort((a, b) => {
      if (a.messageCount !== b.messageCount) return b.messageCount - a.messageCount
      return a.name.localeCompare(b.name)
    })

    return results
  },
  ['frequent-speakers'],
  { tags: ['members'] },
)
