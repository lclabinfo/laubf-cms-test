"use client"

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react"
import { useSessionState } from "@/lib/hooks/use-session-state"
import type { MembershipStatus, Gender, MaritalStatus } from "@/lib/generated/prisma/client"
import { toast } from "sonner"

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
  groups: { id: string; name: string }[]
}

interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type SortBy = "name" | "email" | "createdAt" | "membershipStatus"
export type SortDir = "asc" | "desc"

interface MembersContextValue {
  members: MemberPerson[]
  loading: boolean
  reloading: boolean
  error: string | null
  pagination: PaginationInfo
  search: string
  sortBy: SortBy
  sortDir: SortDir
  membershipFilter: string
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearch: (search: string) => void
  setSortBy: (field: SortBy) => void
  setSortDir: (dir: SortDir) => void
  setSort: (sortBy: SortBy, sortDir: SortDir) => void
  setMembershipFilter: (status: string) => void
  refreshMembers: () => void
  addMember: (data: AddMemberPayload) => Promise<MemberPerson | null>
  updateMemberStatus: (ids: string[], status: MembershipStatus) => Promise<void>
  deleteMember: (id: string) => void
  restoreMember: (id: string) => Promise<void>
  permanentDeleteMember: (id: string) => Promise<void>
  // Archived members dialog support (separate from main paginated list)
  archivedMembers: MemberPerson[]
  loadingArchived: boolean
  refreshArchived: () => void
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
    groups: (p.roleAssignments ?? []).map((ra: { role: { id: string; name: string } }) => ({
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

const DEFAULT_PAGE_SIZE = 50

export function MembersProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<MemberPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)
  const hasLoadedRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
  })
  const [search, setSearchState] = useSessionState("cms:members:search", "")
  const [sortBy, setSortByState] = useSessionState<SortBy>("cms:members:sortBy", "name")
  const [sortDir, setSortDirState] = useSessionState<SortDir>("cms:members:sortDir", "asc")
  const [membershipFilter, setMembershipFilterState] = useSessionState("cms:members:membershipFilter", "")

  // Archived members (separate list for the archived dialog, not part of main pagination)
  const [archivedMembers, setArchivedMembers] = useState<MemberPerson[]>([])
  const [loadingArchived, setLoadingArchived] = useState(false)

  // Debounce timer for search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  // Track current fetch to avoid stale responses
  const fetchIdRef = useRef(0)

  const fetchMembers = useCallback(async (params: {
    page: number
    pageSize: number
    search?: string
    membershipStatus?: string
    sortBy?: string
    sortDir?: string
  }) => {
    const fetchId = ++fetchIdRef.current
    try {
      // First load: show skeleton. Subsequent loads: keep stale data visible with reloading flag.
      if (!hasLoadedRef.current) {
        setLoading(true)
      } else {
        setReloading(true)
      }
      setError(null)

      const qs = new URLSearchParams()
      qs.set("page", String(params.page))
      qs.set("pageSize", String(params.pageSize))
      if (params.search) qs.set("search", params.search)
      if (params.membershipStatus) qs.set("membershipStatus", params.membershipStatus)
      if (params.sortBy) qs.set("sortBy", params.sortBy)
      if (params.sortDir) qs.set("sortDir", params.sortDir)

      const res = await fetch(`/api/v1/people?${qs.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch members")

      const json = await res.json()
      if (fetchId !== fetchIdRef.current) return // stale

      setMembers((json.data ?? []).map(apiPersonToMember))
      setPagination(json.pagination ?? {
        total: 0,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: 0,
      })
      hasLoadedRef.current = true
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return
      console.error("MembersProvider fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to load members")
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false)
        setReloading(false)
      }
    }
  }, [])

  // Fetch members when page/filters/sort change
  useEffect(() => {
    fetchMembers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search,
      membershipStatus: membershipFilter,
      sortBy,
      sortDir,
    })
  }, [fetchMembers, pagination.page, pagination.pageSize, search, membershipFilter, sortBy, sortDir])

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, page: 1, pageSize }))
  }, [])

  const setSearch = useCallback((value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setSearchState(value)
      setPagination((prev) => ({ ...prev, page: 1 }))
    }, 300)
  }, [setSearchState])

  const setSortBy = useCallback((field: SortBy) => {
    setSortByState(field)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [setSortByState])

  const setSortDir = useCallback((dir: SortDir) => {
    setSortDirState(dir)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [setSortDirState])

  const setSort = useCallback((newSortBy: SortBy, newSortDir: SortDir) => {
    setSortByState(newSortBy)
    setSortDirState(newSortDir)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [setSortByState, setSortDirState])

  const setMembershipFilter = useCallback((status: string) => {
    setMembershipFilterState(status)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [setMembershipFilterState])

  const refreshMembers = useCallback(() => {
    fetchMembers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search,
      membershipStatus: membershipFilter,
      sortBy,
      sortDir,
    })
  }, [fetchMembers, pagination.page, pagination.pageSize, search, membershipFilter, sortBy, sortDir])

  // ---- Archived members (for dialog) ----

  const fetchArchived = useCallback(async () => {
    try {
      setLoadingArchived(true)
      const res = await fetch("/api/v1/people?pageSize=100&membershipStatus=ARCHIVED")
      if (!res.ok) throw new Error("Failed to fetch archived members")
      const json = await res.json()
      setArchivedMembers((json.data ?? []).map(apiPersonToMember))
    } catch (err) {
      console.error("MembersProvider fetch archived error:", err)
    } finally {
      setLoadingArchived(false)
    }
  }, [])

  const refreshArchived = useCallback(() => {
    fetchArchived()
  }, [fetchArchived])

  // ---- CRUD operations ----

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
        // Refetch current page so new member appears in the correct sorted position
        fetchMembers({
          page: pagination.page,
          pageSize: pagination.pageSize,
          search,
          membershipStatus: membershipFilter,
          sortBy,
          sortDir,
        })
        return member
      }
      return null
    } catch (err) {
      console.error("addMember error:", err)
      throw err
    }
  }, [fetchMembers, pagination.page, pagination.pageSize, search, membershipFilter, sortBy, sortDir])

  const updateMemberStatus = useCallback(async (ids: string[], status: MembershipStatus) => {
    // Execute all API calls
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/v1/people/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ membershipStatus: status }),
        }).then((res) => {
          if (!res.ok) throw new Error(`Failed to update ${id}`)
          return id
        })
      )
    )

    // Check for failures
    const failed = results.filter((r) => r.status === "rejected")
    if (failed.length > 0) {
      toast.error(`Failed to update ${failed.length} member${failed.length === 1 ? "" : "s"}`)
    }

    // Refetch to reflect the new state from the server
    fetchMembers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search,
      membershipStatus: membershipFilter,
      sortBy,
      sortDir,
    })
  }, [fetchMembers, pagination.page, pagination.pageSize, search, membershipFilter, sortBy, sortDir])

  const deleteMember = useCallback((id: string) => {
    fetch(`/api/v1/people/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to delete member (${res.status})`)
        // Refetch current page after deletion
        fetchMembers({
          page: pagination.page,
          pageSize: pagination.pageSize,
          search,
          membershipStatus: membershipFilter,
          sortBy,
          sortDir,
        })
      })
      .catch((err) => {
        console.error("deleteMember error:", err)
        toast.error("Failed to archive member")
      })
  }, [fetchMembers, pagination.page, pagination.pageSize, search, membershipFilter, sortBy, sortDir])

  const permanentDeleteMember = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/v1/people/${id}?permanent=true`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to permanently delete member")
      // Remove from local archived list immediately
      setArchivedMembers((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      console.error("permanentDeleteMember error:", err)
      toast.error("Failed to permanently delete member")
    }
  }, [])

  const restoreMember = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/v1/people/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipStatus: "MEMBER" }),
      })
      if (!res.ok) throw new Error("Failed to restore member")

      // Remove from local archived list immediately
      setArchivedMembers((prev) => prev.filter((m) => m.id !== id))
      // Refetch main list so restored member appears
      fetchMembers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search,
        membershipStatus: membershipFilter,
        sortBy,
        sortDir,
      })
    } catch (err) {
      console.error("restoreMember error:", err)
      toast.error("Failed to restore member")
    }
  }, [fetchMembers, pagination.page, pagination.pageSize, search, membershipFilter, sortBy, sortDir])

  const value = useMemo(
    () => ({
      members,
      loading,
      reloading,
      error,
      pagination,
      search,
      sortBy,
      sortDir,
      membershipFilter,
      setPage,
      setPageSize,
      setSearch,
      setSortBy,
      setSortDir,
      setSort,
      setMembershipFilter,
      refreshMembers,
      addMember,
      updateMemberStatus,
      deleteMember,
      permanentDeleteMember,
      restoreMember,
      archivedMembers,
      loadingArchived,
      refreshArchived,
    }),
    [members, loading, reloading, error, pagination, search, sortBy, sortDir, membershipFilter, setPage, setPageSize, setSearch, setSortBy, setSortDir, setSort, setMembershipFilter, refreshMembers, addMember, updateMemberStatus, deleteMember, permanentDeleteMember, restoreMember, archivedMembers, loadingArchived, refreshArchived]
  )

  return <MembersContext value={value}>{children}</MembersContext>
}

export function useMembers() {
  const ctx = useContext(MembersContext)
  if (!ctx) throw new Error("useMembers must be used within MembersProvider")
  return ctx
}
