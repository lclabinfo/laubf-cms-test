import { prisma } from '@/lib/db/client'
import { type Speaker } from '@/lib/generated/prisma/client'

export type SpeakerRecord = Speaker

export async function getSpeakers(churchId: string): Promise<SpeakerRecord[]> {
  return prisma.speaker.findMany({
    where: { churchId, deletedAt: null, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getSpeakerBySlug(
  churchId: string,
  slug: string,
): Promise<SpeakerRecord | null> {
  return prisma.speaker.findUnique({
    where: { churchId_slug: { churchId, slug } },
  })
}
