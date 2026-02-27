"use client"

import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react"
import type { MembershipStatus, Gender, MaritalStatus } from "@/lib/generated/prisma/client"

export type MemberPerson = {
  id: string
  slug: string
  firstName: string
  lastName: string
  preferredName: string | null
  gender: Gender | null
  maritalStatus: MaritalStatus | null
  dateOfBirth: string | null
  email: string | null
  phone: string | null
  mobilePhone: string | null
  photoUrl: string | null
  membershipStatus: MembershipStatus
  membershipDate: string | null
  createdAt: string
  households: { id: string; name: string; role: string }[]
  groups: { id: string; name: string; role: string }[]
  tags: string[]
  roles: { id: string; name: string }[]
}

interface MembersContextValue {
  members: MemberPerson[]
  loading: boolean
  error: string | null
  addMember: (data: AddMemberPayload) => Promise<MemberPerson | null>
  updateMemberStatus: (ids: string[], status: MembershipStatus) => void
  deleteMember: (id: string) => void
  refresh: () => void
}

export type AddMemberPayload = {
  firstName: string
  lastName: string
  preferredName?: string
  email?: string
  phone?: string
  gender?: Gender
  dateOfBirth?: string
  membershipStatus?: MembershipStatus
  maritalStatus?: MaritalStatus
  address?: string
  city?: string
  state?: string
  zipCode?: string
}

const MembersContext = createContext<MembersContextValue | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiPersonToMember(p: any): MemberPerson {
  return {
    id: p.id,
    slug: p.slug ?? "",
    firstName: p.firstName,
    lastName: p.lastName,
    preferredName: p.preferredName ?? null,
    gender: p.gender ?? null,
    maritalStatus: p.maritalStatus ?? null,
    dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : null,
    email: p.email ?? null,
    phone: p.phone ?? p.mobilePhone ?? null,
    mobilePhone: p.mobilePhone ?? null,
    photoUrl: p.photoUrl ?? null,
    membershipStatus: p.membershipStatus ?? "VISITOR",
    membershipDate: p.membershipDate ? new Date(p.membershipDate).toISOString().slice(0, 10) : null,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    households: (p.householdMemberships ?? []).map((hm: { household: { id: string; name: string }; role: string }) => ({
      id: hm.household.id,
      name: hm.household.name,
      role: hm.role,
    })),
    groups: (p.groupMemberships ?? []).map((gm: { group: { id: string; name: string }; role: string }) => ({
      id: gm.group.id,
      name: gm.group.name,
      role: gm.role,
    })),
    tags: (p.personTags ?? []).map((t: { tagName: string }) => t.tagName),
    roles: (p.roleAssignments ?? []).map((ra: { role: { id: string; name: string } }) => ({
      id: ra.role.id,
      name: ra.role.name,
    })),
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function MembersProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<MemberPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/v1/people?pageSize=100")
      if (!res.ok) throw new Error("Failed to fetch members")

      const json = await res.json()
      setMembers((json.data ?? []).map(apiPersonToMember))
    } catch (err) {
      console.error("MembersProvider fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to load members")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchData().then(() => {
      if (cancelled) return
    })
    return () => { cancelled = true }
  }, [fetchData])

  const addMember = useCallback(async (data: AddMemberPayload): Promise<MemberPerson | null> => {
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        slug: slugify(`${data.firstName}-${data.lastName}`),
        preferredName: data.preferredName || null,
        email: data.email || null,
        phone: data.phone || null,
        gender: data.gender || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth + "T00:00:00").toISOString() : null,
        membershipStatus: data.membershipStatus || "VISITOR",
        maritalStatus: data.maritalStatus || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
      }

      const res = await fetch("/api/v1/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.error?.message ?? `Failed to create member (${res.status})`)
      }

      const json = await res.json()
      if (json.success && json.data) {
        const member = apiPersonToMember(json.data)
        setMembers((prev) => [member, ...prev])
        return member
      }
      return null
    } catch (err) {
      console.error("addMember error:", err)
      throw err
    }
  }, [])

  const updateMemberStatus = useCallback((ids: string[], status: MembershipStatus) => {
    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => (ids.includes(m.id) ? { ...m, membershipStatus: status } : m))
    )

    // Fire API calls
    for (const id of ids) {
      fetch(`/api/v1/people/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipStatus: status }),
      }).catch((err) => {
        console.error("updateMemberStatus error:", err)
      })
    }
  }, [])

  const deleteMember = useCallback((id: string) => {
    let deleted: MemberPerson | undefined
    setMembers((prev) => {
      deleted = prev.find((m) => m.id === id)
      return prev.filter((m) => m.id !== id)
    })

    fetch(`/api/v1/people/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to delete member (${res.status})`)
      })
      .catch((err) => {
        console.error("deleteMember error:", err)
        if (deleted) {
          setMembers((prev) => [deleted!, ...prev])
        }
      })
  }, [])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  const value = useMemo(
    () => ({ members, loading, error, addMember, updateMemberStatus, deleteMember, refresh }),
    [members, loading, error, addMember, updateMemberStatus, deleteMember, refresh]
  )

  return <MembersContext value={value}>{children}</MembersContext>
}

export function useMembers() {
  const ctx = useContext(MembersContext)
  if (!ctx) throw new Error("useMembers must be used within MembersProvider")
  return ctx
}
