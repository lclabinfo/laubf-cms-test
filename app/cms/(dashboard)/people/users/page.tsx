"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnFiltersState,
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
import { createUsersColumns, type UserRow } from "@/components/cms/users/users-columns"
import { InviteUserDialog } from "@/components/cms/users/invite-user-dialog"

function UsersPageContent() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string>("all")

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/users")
      const data = await res.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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

  const columns = useMemo(
    () => createUsersColumns({ onRoleChange: handleRoleChange, onRemove: handleRemove }),
    [handleRoleChange, handleRemove],
  )

  const filteredUsers = useMemo(() => {
    if (roleFilter === "all") return users
    return users.filter((u) => u.role === roleFilter)
  }, [users, roleFilter])

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">
            Manage who can access the CMS and their permissions.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
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
            <SelectItem value="OWNER">Owner</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="EDITOR">Editor</SelectItem>
            <SelectItem value="VIEWER">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
    <div className="pt-5">
      <Suspense>
        <UsersPageContent />
      </Suspense>
    </div>
  )
}
