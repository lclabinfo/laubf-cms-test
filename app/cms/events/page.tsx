"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
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
import { CalendarDays } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/components/cms/events/columns"
import { Toolbar } from "@/components/cms/events/toolbar"
import { useEvents } from "@/lib/events-context"

function globalFilterFn(
  row: { original: { title: string; location: string; ministry: string } },
  _columnId: string,
  filterValue: string
) {
  const search = filterValue.toLowerCase()
  const { title, location, ministry } = row.original
  return (
    title.toLowerCase().includes(search) ||
    location.toLowerCase().includes(search) ||
    ministry.toLowerCase().includes(search)
  )
}

// Hoist row model factories outside the component so they are stable references
// and don't trigger state updates during React's render phase.
const coreRowModel = getCoreRowModel()
const filteredRowModel = getFilteredRowModel()
const paginationRowModel = getPaginationRowModel()
const sortedRowModel = getSortedRowModel()

const columnVisibility: VisibilityState = { type: false }

export default function EventsPage() {
  const router = useRouter()
  const { events, loading } = useEvents()
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // Reset page index when filters change (replaces TanStack's autoResetPageIndex
  // which uses microtasks that fire before mount in React 19 strict mode)
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
    data: events,
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Events</h1>
        <p className="text-muted-foreground text-sm">
          Create and manage church events, meetings, and programs.
        </p>
      </div>

      <Tabs defaultValue="list">
        <TabsList variant="line">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Toolbar
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={handleGlobalFilterChange}
          />
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              table={table}
              onRowClick={(row) => router.push(`/cms/events/${row.id}`)}
            />
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarDays className="size-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Calendar View</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                A full calendar view of your events is coming soon. Use the list view above to manage events in the meantime.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
