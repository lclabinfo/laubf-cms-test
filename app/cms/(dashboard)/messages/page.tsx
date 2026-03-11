"use client"

import { Suspense, useState, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useCmsSession } from "@/components/cms/cms-shell"
import { PageHeader } from "@/components/cms/page-header"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import type { SortBy } from "@/lib/messages-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { createColumns } from "@/components/cms/messages/columns"
import { Toolbar } from "@/components/cms/messages/toolbar"
import { SeriesTab } from "@/components/cms/messages/series/tab"
import { useMessages } from "@/lib/messages-context"

// Hoist row model factories outside the component so they are stable references
const coreRowModel = getCoreRowModel()

// Map TanStack column IDs to API sort fields
const COLUMN_TO_SORT_BY: Record<string, SortBy> = {
  date: "dateFor",
  title: "title",
  speaker: "speaker",
}
const SORT_BY_TO_COLUMN: Record<SortBy, string> = {
  dateFor: "date",
  title: "title",
  speaker: "speaker",
}

function MessagesTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-x-auto">
        <Table className="min-w-[750px] table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 28 }}>
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead style={{ width: 100 }}><Skeleton className="h-4 w-14" /></TableHead>
              <TableHead style={{ width: 100 }}><Skeleton className="h-4 w-12" /></TableHead>
              <TableHead style={{ width: 100 }}><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead style={{ width: 90 }}><Skeleton className="h-4 w-10" /></TableHead>
              <TableHead style={{ width: 90 }}><Skeleton className="h-4 w-10" /></TableHead>
              <TableHead style={{ width: 50 }} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-[70%]" />
                    <Skeleton className="h-3 w-[40%]" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
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
        {total} message{total !== 1 ? "s" : ""} total
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

function MessagesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useCmsSession()
  const defaultTab = searchParams.get("tab") === "series" ? "series" : "all"
  const {
    messages,
    series,
    loading,
    reloading,
    pagination,
    search,
    dateFrom,
    dateTo,
    seriesFilter,
    sortBy,
    sortDir,
    deleteMessage,
    setPage,
    setPageSize,
    setSearch,
    setDateFrom,
    setDateTo,
    setSeriesFilter,
    setSort,
  } = useMessages()

  // Local search input state (updates immediately, context debounces the API call)
  // Initialize from context's persisted search value so it shows after back-navigation
  const [searchInput, setSearchInput] = useState(search)

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    setSearch(value)
  }, [setSearch])

  const handleDelete = useCallback((id: string) => {
    const message = messages.find((m) => m.id === id)
    deleteMessage(id)
    toast.success("Message deleted", {
      description: message ? `"${message.title}" has been deleted.` : undefined,
    })
  }, [messages, deleteMessage])

  const columns = useMemo(() => createColumns({ series, onDelete: handleDelete }), [series, handleDelete])

  // Derive TanStack sorting state from server-side sort
  const sorting = useMemo<SortingState>(() => [
    { id: SORT_BY_TO_COLUMN[sortBy] ?? "date", desc: sortDir === "desc" },
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

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ status: false, publishedAt: false, speaker: false })
  const [rowSelection, setRowSelection] = useState({})

  const speakers = useMemo(() => {
    const names = new Set(messages.map((m) => m.speaker).filter(Boolean))
    return Array.from(names).sort()
  }, [messages])

  // Server-side pagination: TanStack shows all rows from the current API page
  const table = useReactTable({
    data: messages,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: 0, pageSize: pagination.pageSize },
    },
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    pageCount: pagination.totalPages,
    autoResetPageIndex: false,
    getCoreRowModel: coreRowModel,
    manualSorting: true,
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bible Studies"
        description="Manage sermons, Bible studies, and other messages."
        tutorialId="messages"
        userId={user.id}
      />

      <Tabs defaultValue={defaultTab} key={defaultTab}>
        <TabsList variant="line">
          <TabsTrigger value="all">All Entries</TabsTrigger>
          <TabsTrigger value="series" data-tutorial="msg-series-tab">Series</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Toolbar
            table={table}
            globalFilter={searchInput}
            setGlobalFilter={handleSearchChange}
            speakers={speakers}
            allSeries={series}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            seriesFilter={seriesFilter}
            onSeriesFilterChange={setSeriesFilter}
          />
          {loading ? (
            <MessagesTableSkeleton />
          ) : (
            <div data-tutorial="msg-table" className={cn("transition-opacity duration-150", reloading && "opacity-50 pointer-events-none")}>
              <DataTable
                columns={columns}
                table={table}
                fixedLayout
                hidePagination
                onRowClick={(row) => router.push(`/cms/messages/${row.id}`)}
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
        </TabsContent>

        <TabsContent value="series">
          <SeriesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <div className="pt-5">
      <Suspense>
        <MessagesPageContent />
      </Suspense>
    </div>
  )
}
