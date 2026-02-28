"use client"

import { Suspense, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/messages-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { createColumns } from "@/components/cms/messages/columns"
import { Toolbar } from "@/components/cms/messages/toolbar"
import { SeriesTab } from "@/components/cms/messages/series/tab"
import { useMessages } from "@/lib/messages-context"

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
const expandedRowModel = getExpandedRowModel()
const filteredRowModel = getFilteredRowModel()
const paginationRowModel = getPaginationRowModel()
const sortedRowModel = getSortedRowModel()

function MessageExpandedRow({ message }: { message: Message }) {
  const isPublished = message.status === "published"

  function videoBadge() {
    if (message.hasVideo && isPublished) return <Badge variant="success">Live</Badge>
    if (message.hasVideo) return <Badge variant="secondary">Draft</Badge>
    return <Badge variant="outline">Empty</Badge>
  }

  function studyBadge() {
    if (message.hasStudy && isPublished) return <Badge variant="success">Live</Badge>
    if (message.hasStudy) return <Badge variant="secondary">Draft</Badge>
    return <Badge variant="outline">Empty</Badge>
  }

  return (
    <div className="px-4 pb-4 pt-1 pl-12">
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/cms/messages/${message.id}?tab=video`}>
          <div className="border rounded-lg p-3 hover:bg-muted/50 hover:border-foreground/20 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className={cn("size-2 rounded-full", message.hasVideo ? "bg-blue-600" : "bg-muted-foreground/30")} />
                Video
              </div>
              {videoBadge()}
            </div>
            <p className="text-xs text-muted-foreground">
              {message.hasVideo ? `YouTube · ${message.duration || "\u2014"}` : "No video content"}
            </p>
            <p className="text-xs text-blue-600 font-medium mt-1.5">Edit video &rarr;</p>
          </div>
        </Link>

        <Link href={`/cms/messages/${message.id}?tab=study`}>
          <div className="border rounded-lg p-3 hover:bg-muted/50 hover:border-foreground/20 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className={cn("size-2 rounded-full", message.hasStudy ? "bg-purple-600" : "bg-muted-foreground/30")} />
                Bible Study
              </div>
              {studyBadge()}
            </div>
            <p className="text-xs text-muted-foreground">
              {message.hasStudy ? `${message.studySections?.length || 0} section(s)` : "No study material"}
            </p>
            <p className="text-xs text-purple-600 font-medium mt-1.5">Edit study &rarr;</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

function MessagesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") === "series" ? "series" : "all"
  const { messages, series, loading, deleteMessage } = useMessages()

  const handleDelete = useCallback((id: string) => {
    const message = messages.find((m) => m.id === id)
    deleteMessage(id)
    toast.success("Message deleted", {
      description: message ? `"${message.title}" has been deleted.` : undefined,
    })
  }, [messages, deleteMessage])

  const columns = useMemo(() => createColumns({ series, onDelete: handleDelete }), [series, handleDelete])
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const speakers = useMemo(() => {
    const names = new Set(messages.map((m) => m.speaker).filter(Boolean))
    return Array.from(names).sort()
  }, [messages])

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
    getRowCanExpand: () => true,
    getCoreRowModel: coreRowModel,
    getExpandedRowModel: expandedRowModel,
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

      <Tabs defaultValue={defaultTab} key={defaultTab}>
        <TabsList variant="line">
          <TabsTrigger value="all">All Messages</TabsTrigger>
          <TabsTrigger value="series">Series</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Toolbar
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={handleGlobalFilterChange}
            speakers={speakers}
            allSeries={series}
          />
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              table={table}
              onRowClick={(row) => router.push(`/cms/messages/${row.id}`)}
              renderSubComponent={({ row }: { row: Row<Message> }) => (
                <MessageExpandedRow message={row.original} />
              )}
            />
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
    <Suspense>
      <MessagesPageContent />
    </Suspense>
  )
}
