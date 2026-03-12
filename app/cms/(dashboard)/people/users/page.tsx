"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table"
import { UserPlusIcon, SearchIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { createUsersColumns, type UserRow, type RoleOption } from "@/components/cms/users/users-columns"
import { InviteUserDialog } from "@/components/cms/users/invite-user-dialog"
import { AccessRequestsPanel } from "@/components/cms/users/access-requests-panel"
import { useCmsSession } from "@/components/cms/cms-shell"
import { RoleGuard } from "@/components/cms/role-guard"

function UsersPageContent() {
  const session = useCmsSession()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [roles, setRoles] = useState<RoleOption[]>([])

  // Hide secondary columns on narrow screens
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 900px)")
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setColumnVisibility((prev) => ({
        ...prev,
        linkedPersonName: !e.matches,
        joinedAt: !e.matches,
      }))
    }
    update(mql)
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/users")
      if (res.status === 401) {
        // Session expired or invalid — force re-login
        window.location.href = "/cms/login"
        return
      }
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error?.message || "Failed to load users")
        return
      }
      if (data.success) {
        setUsers(data.data)
      }
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/member-roles")
      const data = await res.json()
      if (data.success) {
        setRoles(data.data)
      }
    } catch {
      // Silently fail — hardcoded fallback will be used
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [fetchUsers, fetchRoles])

  const handleRoleChange = useCallback(
    async (memberId: string, newRole: string) => {
      try {
        const res = await fetch(`/api/v1/users/${memberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error?.message || "Failed to update role")
          return
        }
        toast.success("Role updated")
        fetchUsers()
      } catch {
        toast.error("Failed to update role")
      }
    },
    [fetchUsers],
  )

  const handleRemove = useCallback(
    async (memberId: string) => {
      try {
        const res = await fetch(`/api/v1/users/${memberId}`, {
          method: "DELETE",
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error?.message || "Failed to remove user")
          return
        }
        toast.success("User removed")
        fetchUsers()
      } catch {
        toast.error("Failed to remove user")
      }
    },
    [fetchUsers],
  )

  const handleDeactivate = useCallback(
    async (memberId: string) => {
      try {
        const res = await fetch(`/api/v1/users/${memberId}/deactivate`, {
          method: "POST",
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error?.message || "Failed to deactivate user")
          return
        }
        toast.success("User deactivated")
        fetchUsers()
      } catch {
        toast.error("Failed to deactivate user")
      }
    },
    [fetchUsers],
  )

  const handleReactivate = useCallback(
    async (memberId: string) => {
      try {
        const res = await fetch(`/api/v1/users/${memberId}/reactivate`, {
          method: "POST",
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error?.message || "Failed to reactivate user")
          return
        }
        toast.success("User reactivated")
        fetchUsers()
      } catch {
        toast.error("Failed to reactivate user")
      }
    },
    [fetchUsers],
  )

  const handleLinkPerson = useCallback(
    async (memberId: string, personId: string) => {
      try {
        const res = await fetch(`/api/v1/users/${memberId}/link-person`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error?.message || "Failed to link member")
          return
        }
        toast.success("Member linked successfully")
        fetchUsers()
      } catch {
        toast.error("Failed to link member")
      }
    },
    [fetchUsers],
  )

  const handleUnlinkPerson = useCallback(
    async (memberId: string) => {
      try {
        const res = await fetch(`/api/v1/users/${memberId}/link-person`, {
          method: "DELETE",
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error?.message || "Failed to unlink member")
          return
        }
        toast.success("Member unlinked")
        fetchUsers()
      } catch {
        toast.error("Failed to unlink member")
      }
    },
    [fetchUsers],
  )

  const currentUser = useMemo(
    () => ({ id: session.user.id, role: session.role }),
    [session.user.id, session.role],
  )

  const columns = useMemo(
    () =>
      createUsersColumns({
        currentUser,
        roles,
        onRoleChange: handleRoleChange,
        onRemove: handleRemove,
        onDeactivate: handleDeactivate,
        onReactivate: handleReactivate,
        onLinkPerson: handleLinkPerson,
        onUnlinkPerson: handleUnlinkPerson,
      }),
    [currentUser, roles, handleRoleChange, handleRemove, handleDeactivate, handleReactivate, handleLinkPerson, handleUnlinkPerson],
  )

  const filteredUsers = useMemo(() => {
    let result = users
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter)
    }
    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter)
    }
    return result
  }, [users, roleFilter, statusFilter])

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: { sorting, columnFilters, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _id, filterValue) => {
      const search = filterValue.toLowerCase()
      const u = row.original
      return (
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      )
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">
            Manage who can access the CMS and their permissions.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="shrink-0">
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.length > 0
              ? roles
                  .sort((a, b) => b.priority - a.priority)
                  .map((r) => (
                    <SelectItem key={r.id} value={r.slug.toUpperCase()}>
                      {r.name}
                    </SelectItem>
                  ))
              : ["OWNER", "ADMIN", "EDITOR", "VIEWER"].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {session.permissions.includes("users.approve_requests") && (
        <AccessRequestsPanel onApproved={fetchUsers} />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable columns={columns} table={table} />
      )}

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={fetchUsers}
      />
    </div>
  )
}

export default function UsersPage() {
  return (
    <RoleGuard requiredPermission="users.view">
      <div className="pt-5">
        <Suspense>
          <UsersPageContent />
        </Suspense>
      </div>
    </RoleGuard>
  )
}
