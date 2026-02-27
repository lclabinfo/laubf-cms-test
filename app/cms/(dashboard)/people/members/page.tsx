"use client"

import { Suspense, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Users } from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { createColumns } from "@/components/cms/people/members-columns"
import { MembersToolbar } from "@/components/cms/people/members-toolbar"
import { AddMemberDialog } from "@/components/cms/people/add-member-dialog"
import { CSVImportDialog } from "@/components/cms/people/csv-import-dialog"
import { MembersProvider, useMembers } from "@/lib/members-context"
import type { MemberPerson, AddMemberPayload } from "@/lib/members-context"
import type { MembershipStatus } from "@/lib/generated/prisma/client"

function globalFilterFn(
  row: { original: MemberPerson },
  _columnId: string,
  filterValue: string
) {
  const search = filterValue.toLowerCase()
  const { firstName, lastName, preferredName, email, phone } = row.original
  return (
    firstName.toLowerCase().includes(search) ||
    lastName.toLowerCase().includes(search) ||
    (preferredName?.toLowerCase().includes(search) ?? false) ||
    (email?.toLowerCase().includes(search) ?? false) ||
    (phone?.toLowerCase().includes(search) ?? false)
  )
}

// Hoist row model factories outside the component so they are stable references
const coreRowModel = getCoreRowModel()
const filteredRowModel = getFilteredRowModel()
const paginationRowModel = getPaginationRowModel()
const sortedRowModel = getSortedRowModel()

function MembersPageContent() {
  const router = useRouter()
  const { members, loading, deleteMember, addMember, updateMemberStatus, refresh } = useMembers()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const handleDelete = useCallback((id: string) => {
    const member = members.find((m) => m.id === id)
    deleteMember(id)
    toast.success("Member archived", {
      description: member ? `${member.firstName} ${member.lastName} has been archived.` : undefined,
      action: {
        label: "Undo",
        onClick: () => refresh(),
      },
    })
  }, [members, deleteMember, refresh])

  const handleAddMember = useCallback(async (data: AddMemberPayload) => {
    const member = await addMember(data)
    if (member) {
      toast.success("Member added successfully", {
        description: `${member.firstName} ${member.lastName} has been added.`,
      })
    }
  }, [addMember])

  const handleImportComplete = useCallback(() => {
    refresh()
    toast.success("Members imported successfully")
  }, [refresh])

  const columns = useMemo(() => createColumns({ onDelete: handleDelete }), [handleDelete])

  const [sorting, setSorting] = useState<SortingState>([
    { id: "lastName", desc: false },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    roles: false,
  })
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })

  const resetPageIndex = useCallback(() => {
    setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }))
  }, [])

  const handleColumnFiltersChange = useCallback(
    (updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
      setColumnFilters(updater)
      resetPageIndex()
    },
    [resetPageIndex]
  )

  const handleGlobalFilterChange = useCallback(
    (value: string) => {
      setGlobalFilter(value)
      resetPageIndex()
    },
    [resetPageIndex]
  )

  const table = useReactTable({
    data: members,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: handleGlobalFilterChange,
    onPaginationChange: setPagination,
    globalFilterFn,
    autoResetPageIndex: false,
    getCoreRowModel: coreRowModel,
    getFilteredRowModel: filteredRowModel,
    getPaginationRowModel: paginationRowModel,
    getSortedRowModel: sortedRowModel,
  })

  const handleBulkUpdateStatus = useCallback((status: MembershipStatus) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const ids = selectedRows.map((r) => r.original.id)
    if (ids.length === 0) return

    updateMemberStatus(ids, status)
    table.toggleAllRowsSelected(false)

    const statusLabel = status === "MEMBER" ? "Member" : status === "INACTIVE" ? "Inactive" : status
    toast.success(`Status updated for ${ids.length} ${ids.length === 1 ? "member" : "members"}`, {
      description: `Set to ${statusLabel}.`,
    })
  }, [table, updateMemberStatus])

  const handleBulkArchive = useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const ids = selectedRows.map((r) => r.original.id)
    if (ids.length === 0) return

    updateMemberStatus(ids, "ARCHIVED")
    table.toggleAllRowsSelected(false)

    toast.success(`${ids.length} ${ids.length === 1 ? "member" : "members"} archived`)
  }, [table, updateMemberStatus])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Members</h1>
            {!loading && (
              <Badge variant="secondary" className="text-xs">
                {members.length}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            View and manage church member profiles.
          </p>
        </div>
      </div>

      <MembersToolbar
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={handleGlobalFilterChange}
        onAddMember={() => setAddDialogOpen(true)}
        onImportCSV={() => setImportDialogOpen(true)}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onBulkArchive={handleBulkArchive}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="size-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-sm font-medium">No members yet</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">
            Add your first member to get started, or import members from a CSV file.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setImportDialogOpen(true)}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Import CSV
            </button>
            <span className="text-muted-foreground text-sm">or</span>
            <button
              onClick={() => setAddDialogOpen(true)}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Add Member
            </button>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          table={table}
          onRowClick={(row) => router.push(`/cms/people/members/${row.id}`)}
        />
      )}

      <AddMemberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddMember}
      />

      <CSVImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}

export default function PeopleMembersPage() {
  return (
    <MembersProvider>
      <Suspense>
        <MembersPageContent />
      </Suspense>
    </MembersProvider>
  )
}
