"use client"

import { useState, useCallback } from "react"
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
import { columns } from "@/components/cms/messages/columns"
import { Toolbar } from "@/components/cms/messages/toolbar"
import { SeriesTab } from "@/components/cms/messages/series-tab"
import { messages } from "@/lib/messages-data"

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
          <SeriesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
