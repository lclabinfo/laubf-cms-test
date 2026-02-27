import { prisma } from '@/lib/db'
import { type CommunicationChannel } from '@/lib/generated/prisma/client'

export async function getCommunicationPreferences(personId: string) {
  return prisma.communicationPreference.findMany({
    where: { personId },
    orderBy: [{ channel: 'asc' }, { category: 'asc' }],
  })
}

export async function setCommunicationPreference(
  personId: string,
  channel: CommunicationChannel,
  category: string,
  isOptedIn: boolean,
) {
  return prisma.communicationPreference.upsert({
    where: {
      personId_channel_category: { personId, channel, category },
    },
    update: { isOptedIn },
    create: { personId, channel, category, isOptedIn },
  })
}

export async function setBulkCommunicationPreferences(
  personId: string,
  preferences: {
    channel: CommunicationChannel
    category: string
    isOptedIn: boolean
  }[],
) {
  const operations = preferences.map((pref) =>
    prisma.communicationPreference.upsert({
      where: {
        personId_channel_category: {
          personId,
          channel: pref.channel,
          category: pref.category,
        },
      },
      update: { isOptedIn: pref.isOptedIn },
      create: {
        personId,
        channel: pref.channel,
        category: pref.category,
        isOptedIn: pref.isOptedIn,
      },
    }),
  )

  return prisma.$transaction(operations)
}
