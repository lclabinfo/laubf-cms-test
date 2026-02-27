"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { GroupType, GroupStatus, GroupMemberRole } from "@/lib/generated/prisma/client"

export type GroupMember = {
  id: string
  personId: string
  role: GroupMemberRole
  joinedAt: string
  person: {
    id: string
    firstName: string
    lastName: string
    preferredName: string | null
    email: string | null
    phone: string | null
    photoUrl: string | null
  }
}

export type GroupData = {
  id: string
  name: string
  slug: string
  description: string | null
  groupType: GroupType
  status: GroupStatus
  meetingSchedule: string | null
  meetingLocation: string | null
  isOpen: boolean
  capacity: number | null
  photoUrl: string | null
  parentGroupId: string | null
  createdAt: string
  updatedAt: string
  members: GroupMember[]
  children: { id: string; name: string; slug: string; status: GroupStatus; groupType: GroupType }[]
  parent: { id: string; name: string; slug: string } | null
}

interface GroupsContextValue {
  groups: GroupData[]
  loading: boolean
  error: string | null
  refresh: () => void
  createGroup: (data: CreateGroupPayload) => Promise<GroupData | null>
  updateGroup: (id: string, data: Partial<CreateGroupPayload>) => Promise<GroupData | null>
  deleteGroup: (id: string) => Promise<boolean>
  archiveGroup: (id: string) => Promise<boolean>
  addMember: (groupId: string, personId: string, role?: GroupMemberRole) => Promise<boolean>
  removeMember: (groupId: string, personId: string) => Promise<boolean>
}

export type CreateGroupPayload = {
  name: string
  slug: string
  description?: string
  groupType: GroupType
  meetingSchedule?: string
  meetingLocation?: string
  isOpen?: boolean
  capacity?: number | null
  parentGroupId?: string | null
  status?: GroupStatus
}

const GroupsContext = createContext<GroupsContextValue | null>(null)

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiToGroup(g: any): GroupData {
  return {
    id: g.id,
    name: g.name,
    slug: g.slug,
    description: g.description ?? null,
    groupType: g.groupType,
    status: g.status,
    meetingSchedule: g.meetingSchedule ?? null,
    meetingLocation: g.meetingLocation ?? null,
    isOpen: g.isOpen ?? true,
    capacity: g.capacity ?? null,
    photoUrl: g.photoUrl ?? null,
    parentGroupId: g.parentGroupId ?? null,
    createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: g.updatedAt ? new Date(g.updatedAt).toISOString() : new Date().toISOString(),
    members: (g.members ?? [])
      .filter((m: { leftAt: string | null }) => !m.leftAt)
      .map((m: { id: string; personId: string; role: GroupMemberRole; joinedAt: string; person: GroupMember["person"] }) => ({
        id: m.id,
        personId: m.personId ?? m.person?.id,
        role: m.role,
        joinedAt: m.joinedAt ? new Date(m.joinedAt).toISOString() : new Date().toISOString(),
        person: m.person,
      })),
    children: (g.children ?? []).map((c: { id: string; name: string; slug: string; status: GroupStatus; groupType: GroupType }) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      status: c.status,
      groupType: c.groupType,
    })),
    parent: g.parent ? { id: g.parent.id, name: g.parent.name, slug: g.parent.slug } : null,
  }
}

export function GroupsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<GroupData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/v1/person-groups?pageSize=100&status=")
      if (!res.ok) throw new Error("Failed to fetch groups")
      const json = await res.json()
      if (json.success) {
        setGroups(json.data.map(apiToGroup))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const createGroup = useCallback(async (data: CreateGroupPayload): Promise<GroupData | null> => {
    try {
      const payload = {
        ...data,
        slug: data.slug || slugify(data.name),
      }
      const res = await fetch("/api/v1/person-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to create group")
      const json = await res.json()
      if (json.success) {
        const group = apiToGroup(json.data)
        setGroups((prev) => [...prev, group])
        return group
      }
      return null
    } catch {
      return null
    }
  }, [])

  const updateGroup = useCallback(async (id: string, data: Partial<CreateGroupPayload>): Promise<GroupData | null> => {
    try {
      const res = await fetch(`/api/v1/person-groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update group")
      const json = await res.json()
      if (json.success) {
        const group = apiToGroup(json.data)
        setGroups((prev) => prev.map((g) => (g.id === id ? group : g)))
        return group
      }
      return null
    } catch {
      return null
    }
  }, [])

  const deleteGroup = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/v1/person-groups/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete group")
      setGroups((prev) => prev.filter((g) => g.id !== id))
      return true
    } catch {
      return false
    }
  }, [])

  const archiveGroup = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/v1/person-groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      })
      if (!res.ok) throw new Error("Failed to archive group")
      const json = await res.json()
      if (json.success) {
        const group = apiToGroup(json.data)
        setGroups((prev) => prev.map((g) => (g.id === id ? group : g)))
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  const addMember = useCallback(async (groupId: string, personId: string, role: GroupMemberRole = "MEMBER"): Promise<boolean> => {
    try {
      const res = await fetch(`/api/v1/person-groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId, role }),
      })
      if (!res.ok) throw new Error("Failed to add member")
      // Refresh groups to get updated member list
      await fetchGroups()
      return true
    } catch {
      return false
    }
  }, [fetchGroups])

  const removeMember = useCallback(async (groupId: string, personId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/v1/person-groups/${groupId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId }),
      })
      if (!res.ok) throw new Error("Failed to remove member")
      await fetchGroups()
      return true
    } catch {
      return false
    }
  }, [fetchGroups])

  return (
    <GroupsContext.Provider
      value={{
        groups,
        loading,
        error,
        refresh: fetchGroups,
        createGroup,
        updateGroup,
        deleteGroup,
        archiveGroup,
        addMember,
        removeMember,
      }}
    >
      {children}
    </GroupsContext.Provider>
  )
}

export function useGroups() {
  const ctx = useContext(GroupsContext)
  if (!ctx) throw new Error("useGroups must be used within GroupsProvider")
  return ctx
}
