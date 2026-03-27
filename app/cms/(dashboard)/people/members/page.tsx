"use client"

import { Suspense, useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { useCmsSession } from "@/components/cms/cms-shell"
import { PageHeader } from "@/components/cms/page-header"
import {
  useReactTable,
  getCoreRowModel,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { createColumns } from "@/components/cms/people/members-columns"
import { MembersToolbar } from "@/components/cms/people/members-toolbar"
import { AddMemberDialog } from "@/components/cms/people/add-member-dialog"
import { CSVImportDialog } from "@/components/cms/people/csv-import-dialog"
import { MemberPreviewPanel } from "@/components/cms/people/member-preview-panel"
import { ArchivedMembersDialog } from "@/components/cms/people/archived-members-dialog"
import { MembersProvider, useMembers } from "@/lib/members-context"
import type { MemberPerson, AddMemberPayload, SortBy } from "@/lib/members-context"
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

// Hoist row model factory outside the component so it is a stable reference
const coreRowModel = getCoreRowModel()

// Map TanStack column IDs to API sort fields
const COLUMN_TO_SORT_BY: Record<string, SortBy> = {
  lastName: "name",
  email: "email",
  membershipStatus: "membershipStatus",
  createdAt: "createdAt",
}
const SORT_BY_TO_COLUMN: Record<SortBy, string> = {
  name: "lastName",
  email: "email",
  membershipStatus: "membershipStatus",
  createdAt: "createdAt",
}

function ServerPagination({
  page,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  totalPages: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  return (
    <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground text-sm">
        {total} member{total !== 1 ? "s" : ""} total
      </div>
      <div className="flex items-center justify-between gap-4 sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="hidden sm:block text-sm font-medium whitespace-nowrap">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger size="sm" className="w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent position="popper">
              {[10, 20, 25, 30, 40, 50].map((ps) => (
                <SelectItem key={ps} value={`${ps}`}>
                  {ps}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm font-medium whitespace-nowrap">
          Page {page} of {totalPages || 1}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

function MembersPageContent() {
  const router = useRouter()
  const { user } = useCmsSession()
  const isWideScreen = useIsWideScreen()
  const {
    members,
    archivedMembers,
    loading,
    reloading,
    pagination,
    search,
    sortBy,
    sortDir,
    membershipFilter,
    deleteMember,
    addMember,
    updateMemberStatus,
    refreshMembers,
    refreshArchived,
    setPage,
    setPageSize,
    setSearch,
    setSort,
    setMembershipFilter,
  } = useMembers()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [archivedDialogOpen, setArchivedDialogOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  // Local search input state (updates immediately, context debounces the API call)
  // Initialize from context's persisted search value so it shows after back-navigation
  const [searchInput, setSearchInput] = useState(search)

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    setSearch(value)
  }, [setSearch])

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
        onClick: () => refreshMembers(),
      },
    })
  }, [members, deleteMember, refreshMembers, selectedMemberId])

  const handleAddMember = useCallback(async (data: AddMemberPayload) => {
    const member = await addMember(data)
    if (member) {
      toast.success("Member added successfully", {
        description: `${member.firstName} ${member.lastName} has been added.`,
      })
    }
  }, [addMember])

  const handleImportComplete = useCallback(() => {
    refreshMembers()
    toast.success("Members imported successfully")
  }, [refreshMembers])

  const columns = useMemo(() => createColumns({ onDelete: handleDelete }), [handleDelete])

  // Derive TanStack sorting state from server-side sort
  const sorting = useMemo<SortingState>(() => [
    { id: SORT_BY_TO_COLUMN[sortBy] ?? "lastName", desc: sortDir === "desc" },
  ], [sortBy, sortDir])

  const handleSortingChange = useCallback((updater: SortingState | ((old: SortingState) => SortingState)) => {
    const newSorting = typeof updater === "function" ? updater(sorting) : updater
    if (newSorting.length > 0) {
      const col = newSorting[0]
      const newSortBy = COLUMN_TO_SORT_BY[col.id]
      if (newSortBy) {
        setSort(newSortBy, col.desc ? "desc" : "asc")
      }
    }
  }, [sorting, setSort])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    roles: false,
  })
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // Server-side pagination: TanStack shows all rows from the current API page
  const table = useReactTable({
    data: members,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: 0, pageSize: pagination.pageSize },
    },
    getRowId: (row) => row.id,
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    manualSorting: true,
    pageCount: pagination.totalPages,
    rowCount: pagination.total,
    autoResetPageIndex: false,
    getCoreRowModel: coreRowModel,
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
    const selectedRows = table.getSelectedRowModel().rows
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
    const selectedRows = table.getSelectedRowModel().rows
    const ids = selectedRows.map((r) => r.original.id)
    if (ids.length === 0) return

    updateMemberStatus(ids, "ARCHIVED")
    table.toggleAllRowsSelected(false)

    toast.success(`${ids.length} ${ids.length === 1 ? "member" : "members"} archived`)
  }, [table, updateMemberStatus])

  const showPreview = isWideScreen && selectedMember !== null

  return (
    <>
      {/* Main content -- table */}
      <div className="space-y-4">
        <PageHeader
          title="Members"
          description="View and manage church member profiles."
          tutorialId="people"
          userId={user.id}
          actions={
            !loading ? (
              <Badge variant="secondary" className="text-xs">
                {pagination.total}
              </Badge>
            ) : undefined
          }
        />

        <MembersToolbar
          table={table}
          globalFilter={searchInput}
          setGlobalFilter={handleSearchChange}
          membershipFilter={membershipFilter}
          onMembershipFilterChange={setMembershipFilter}
          onAddMember={() => setAddDialogOpen(true)}
          onImportCSV={() => setImportDialogOpen(true)}
          onBulkUpdateStatus={handleBulkUpdateStatus}
          onBulkArchive={handleBulkArchive}
          onViewArchived={() => {
            refreshArchived()
            setArchivedDialogOpen(true)
          }}
          archivedCount={archivedMembers.length}
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 && !searchInput && !membershipFilter ? (
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
          <div data-tutorial="ppl-table" className={cn("transition-opacity duration-150", reloading && "opacity-50 pointer-events-none")}>
            <DataTable
              columns={columns}
              table={table}
              onRowClick={handleRowClick}
              activeRowId={showPreview ? selectedMemberId : undefined}
              hidePagination
            />
            <ServerPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      {/* Right: preview panel -- fixed to viewport right edge */}
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

      <ArchivedMembersDialog
        open={archivedDialogOpen}
        onOpenChange={setArchivedDialogOpen}
      />
    </>
  )
}

export default function PeopleMembersPage() {
  return (
    <div className="pt-5">
      <MembersProvider>
        <Suspense>
          <MembersPageContent />
        </Suspense>
      </MembersProvider>
    </div>
  )
}
