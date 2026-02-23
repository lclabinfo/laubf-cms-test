import { prisma } from '@/lib/db'
import { Prisma, type Speaker } from '@/lib/generated/prisma/client'

type SpeakerRecord = Speaker

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

export async function createSpeaker(
  churchId: string,
  data: Omit<Prisma.SpeakerUncheckedCreateInput, 'churchId'>,
) {
  return prisma.speaker.create({
    data: { ...data, churchId },
  })
}

export async function updateSpeaker(
  churchId: string,
  id: string,
  data: Prisma.SpeakerUncheckedUpdateInput,
) {
  return prisma.speaker.update({
    where: { id, churchId },
    data,
  })
}

export async function deleteSpeaker(churchId: string, id: string) {
  return prisma.speaker.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}
