"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { columns } from "@/components/cms/messages/columns"
import {
  DataTable,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@/components/cms/messages/data-table"
import type { ColumnFiltersState, SortingState } from "@/components/cms/messages/data-table"
import { Toolbar } from "@/components/cms/messages/toolbar"
import { messages, series } from "@/lib/messages-data"
import { Badge } from "@/components/ui/badge"

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

export default function MessagesPage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  const table = useReactTable({
    data: messages,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
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
            setGlobalFilter={setGlobalFilter}
          />
          <DataTable columns={columns} data={messages} table={table} />
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
