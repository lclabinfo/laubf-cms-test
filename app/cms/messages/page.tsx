"use client"

import { useState, useMemo, useCallback } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { columns } from "@/components/cms/messages/columns"
import { Toolbar } from "@/components/cms/messages/toolbar"
import { messages, series } from "@/lib/messages-data"

function globalFilterFn(
  row: { original: { title: string; speaker: string; passage: string } },
  _columnId: string,
  filterValue: string
) {
  const search = filterValue.toLowerCase()
  const { title, speaker, passage } = row.original
  return (
    title.toLowerCase().includes(search) ||
    speaker.toLowerCase().includes(search) ||
    passage.toLowerCase().includes(search)
  )
}

// Hoist row model factories outside the component so they are stable references
// and don't trigger state updates during React's render phase.
const coreRowModel = getCoreRowModel()
const filteredRowModel = getFilteredRowModel()
const paginationRowModel = getPaginationRowModel()
const sortedRowModel = getSortedRowModel()

export default function MessagesPage() {
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
    data: messages,
    columns,
    state: {
      sorting,
      columnFilters,
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

  const seriesWithCount = useMemo(
    () =>
      series.map((s) => ({
        ...s,
        count: messages.filter((m) => m.seriesIds.includes(s.id)).length,
      })),
    []
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Messages</h1>
        <p className="text-muted-foreground text-sm">
          Manage sermons, Bible studies, and other messages.
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList variant="line">
          <TabsTrigger value="all">All Messages</TabsTrigger>
          <TabsTrigger value="series">Series</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Toolbar
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={handleGlobalFilterChange}
          />
          <DataTable columns={columns} table={table} />
        </TabsContent>

        <TabsContent value="series">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {seriesWithCount.map((s) => (
              <div
                key={s.id}
                className="group rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="aspect-video rounded-md bg-muted mb-3 flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Cover Image</span>
                </div>
                <h3 className="font-medium">{s.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {s.count} {s.count === 1 ? "message" : "messages"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
