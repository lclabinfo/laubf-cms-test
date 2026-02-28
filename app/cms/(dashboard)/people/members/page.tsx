"use client"

import { Suspense, useState, useCallback, useMemo, useEffect } from "react"
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
import { MemberPreviewPanel } from "@/components/cms/people/member-preview-panel"
import { MembersProvider, useMembers } from "@/lib/members-context"
import type { MemberPerson, AddMemberPayload } from "@/lib/members-context"
import type { MembershipStatus } from "@/lib/generated/prisma/client"
import { cn } from "@/lib/utils"

/** Minimum viewport width (px) to enable the split-panel preview. Below this, row clicks navigate directly. */
const SPLIT_PANEL_MIN_WIDTH = 1280

function useIsWideScreen() {
  const [isWide, setIsWide] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${SPLIT_PANEL_MIN_WIDTH}px)`)
    setIsWide(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsWide(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  return isWide
}

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
  const isWideScreen = useIsWideScreen()
  const { members, loading, deleteMember, addMember, updateMemberStatus, refresh } = useMembers()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  // Resolve the selected member from the current members list
  const selectedMember = useMemo(
    () => (selectedMemberId ? members.find((m) => m.id === selectedMemberId) ?? null : null),
    [selectedMemberId, members]
  )

  // Close preview panel when screen shrinks below threshold
  useEffect(() => {
    if (!isWideScreen) setSelectedMemberId(null)
  }, [isWideScreen])

  const handleDelete = useCallback((id: string) => {
    const member = members.find((m) => m.id === id)
    deleteMember(id)
    if (selectedMemberId === id) setSelectedMemberId(null)
    toast.success("Member archived", {
      description: member ? `${member.firstName} ${member.lastName} has been archived.` : undefined,
      action: {
        label: "Undo",
        onClick: () => refresh(),
      },
    })
  }, [members, deleteMember, refresh, selectedMemberId])

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

  const handleRowClick = useCallback(
    (row: MemberPerson) => {
      if (isWideScreen) {
        // Toggle: click same row again to deselect
        setSelectedMemberId((prev) => (prev === row.id ? null : row.id))
      } else {
        router.push(`/cms/people/members/${row.id}`)
      }
    },
    [isWideScreen, router]
  )

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

  const showPreview = isWideScreen && selectedMember !== null

  return (
    <>
      {/* Main content — table */}
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
            onRowClick={handleRowClick}
            activeRowId={showPreview ? selectedMemberId : undefined}
          />
        )}
      </div>

      {/* Right: preview panel — fixed to viewport right edge */}
      {isWideScreen && (
        <div
          className={cn(
            "fixed top-0 right-0 h-screen z-30 bg-background shadow-lg",
            "transition-transform duration-300 ease-in-out",
            "w-[400px]",
            showPreview ? "translate-x-0" : "translate-x-full"
          )}
        >
          {selectedMember && (
            <MemberPreviewPanel
              member={selectedMember}
              onClose={() => setSelectedMemberId(null)}
              onArchive={handleDelete}
            />
          )}
        </div>
      )}

      {/* Backdrop overlay when panel is open */}
      {showPreview && (
        <div
          className="fixed inset-0 z-20 bg-black/20 transition-opacity duration-300"
          onClick={() => setSelectedMemberId(null)}
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
    </>
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
