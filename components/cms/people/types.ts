import type { Prisma } from '@/lib/generated/prisma/client'

export type PersonDetail = Prisma.PersonGetPayload<{
  include: {
    householdMemberships: { include: { household: { include: { members: { include: { person: true } } } } } }
    groupMemberships: { include: { group: true } }
    personTags: true
    roleAssignments: { include: { role: true } }
    communicationPreferences: true
    customFieldValues: { include: { fieldDefinition: true } }
    personNotes: { include: { author: true } }
  }
}>

export type HouseholdWithMembers = Prisma.HouseholdGetPayload<{
  include: {
    members: { include: { person: true } }
  }
}>

export type PersonGroupMembership = PersonDetail['groupMemberships'][number]
export type PersonTag = PersonDetail['personTags'][number]
export type CommunicationPreference = PersonDetail['communicationPreferences'][number]
export type CustomFieldValue = PersonDetail['customFieldValues'][number]
export type PersonNote = PersonDetail['personNotes'][number]
