import { notFound } from 'next/navigation'
import { getChurchId } from '@/lib/api/get-church-id'
import { prisma } from '@/lib/db'
import { MemberProfile } from '@/components/cms/people/member-profile'

async function getPersonProfile(churchId: string, id: string) {
  return prisma.person.findFirst({
    where: { id, churchId, deletedAt: null },
    include: {
      householdMemberships: {
        include: {
          household: {
            include: {
              members: {
                include: { person: true },
                orderBy: { createdAt: 'asc' as const },
              },
            },
          },
        },
      },
      groupMemberships: {
        where: { leftAt: null },
        include: { group: true },
      },
      personTags: { orderBy: { tagName: 'asc' } },
      roleAssignments: { include: { role: true } },
      communicationPreferences: {
        orderBy: [{ channel: 'asc' }, { category: 'asc' }],
      },
      customFieldValues: {
        include: {
          fieldDefinition: true,
        },
        orderBy: { fieldDefinition: { sortOrder: 'asc' } },
      },
      personNotes: {
        include: { author: true },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: 20,
      },
    },
  })
}

type Params = { params: Promise<{ id: string }> }

export default async function MemberProfilePage({ params }: Params) {
  const { id } = await params
  const churchId = await getChurchId()
  const person = await getPersonProfile(churchId, id)

  if (!person) {
    notFound()
  }

  return <MemberProfile person={person} churchId={churchId} />
}
