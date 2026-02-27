import type { GroupType, GroupStatus, GroupMemberRole } from "@/lib/generated/prisma/client"

export const groupTypeDisplay: Record<GroupType, string> = {
  SMALL_GROUP: "Small Group",
  SERVING_TEAM: "Serving Team",
  MINISTRY: "Ministry",
  CLASS: "Class",
  ADMINISTRATIVE: "Administrative",
  CUSTOM: "Custom",
}

export const groupTypeBadgeVariant: Record<GroupType, "info" | "success" | "default" | "warning" | "secondary" | "outline"> = {
  SMALL_GROUP: "info",
  SERVING_TEAM: "success",
  MINISTRY: "default",
  CLASS: "warning",
  ADMINISTRATIVE: "secondary",
  CUSTOM: "outline",
}

export const groupStatusDisplay: Record<GroupStatus, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  INACTIVE: { label: "Inactive", variant: "secondary" },
  ARCHIVED: { label: "Archived", variant: "destructive" },
}

export const groupMemberRoleDisplay: Record<GroupMemberRole, string> = {
  LEADER: "Leader",
  CO_LEADER: "Co-Leader",
  MEMBER: "Member",
}

export const groupMemberRoleBadgeVariant: Record<GroupMemberRole, "default" | "secondary" | "outline"> = {
  LEADER: "default",
  CO_LEADER: "secondary",
  MEMBER: "outline",
}

export type GroupTemplate = {
  name: string
  groupType: GroupType
  description: string
  meetingSchedule?: string
  isOpen: boolean
}

export const groupTemplates: GroupTemplate[] = [
  {
    name: "Sunday Bible Study",
    groupType: "SMALL_GROUP",
    description: "Weekly Bible study group meeting on Sundays.",
    meetingSchedule: "Sundays",
    isOpen: true,
  },
  {
    name: "Worship Team",
    groupType: "SERVING_TEAM",
    description: "Worship and praise team serving during Sunday services.",
    isOpen: false,
  },
  {
    name: "Welcome Team",
    groupType: "SERVING_TEAM",
    description: "Greeting and hospitality team for church services.",
    isOpen: true,
  },
  {
    name: "Youth Group",
    groupType: "MINISTRY",
    description: "Ministry for middle and high school students.",
    meetingSchedule: "Fridays",
    isOpen: true,
  },
  {
    name: "Men's Fellowship",
    groupType: "SMALL_GROUP",
    description: "Fellowship and Bible study group for men.",
    isOpen: true,
  },
  {
    name: "Women's Fellowship",
    groupType: "SMALL_GROUP",
    description: "Fellowship and Bible study group for women.",
    isOpen: true,
  },
  {
    name: "Prayer Group",
    groupType: "SMALL_GROUP",
    description: "Dedicated prayer group meeting regularly to intercede.",
    isOpen: true,
  },
  {
    name: "New Members Class",
    groupType: "CLASS",
    description: "Orientation class for new church members.",
    isOpen: true,
  },
]
