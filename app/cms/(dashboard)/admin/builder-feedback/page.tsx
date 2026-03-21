"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import {
  Bug,
  Lightbulb,
  MessageCircle,
  Search,
  Loader2,
  Monitor,
  Clock,
  User,
  FileText,
  Trash2,
  Globe,
  MapPin,
  SlidersHorizontal,
  X,
} from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DataTable } from "@/components/ui/data-table"
import { SortableHeader } from "@/components/ui/sortable-header"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Snapshot = {
  source?: string
  pageId?: string
  pageSlug?: string
  pageTitle?: string
  cmsPage?: string
  editingSectionId?: string
  editingSectionType?: string
  deviceMode?: string
  activeTool?: string
  rightDrawerOpen?: boolean
  viewportWidth?: number
  viewportHeight?: number
  browserInfo?: string
  url?: string
  churchName?: string
  churchSlug?: string
  timestamp?: string
}

type Feedback = {
  id: string
  userId: string
  userName: string
  title: string
  description: string
  type: string
  snapshot: Snapshot
  actionHistory: Array<{ action: string; detail?: string; timestamp: string }> | null
  isRead: boolean
  readAt: string | null
  status: string
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<string, typeof Bug> = {
  bug: Bug,
  feature: Lightbulb,
  feedback: MessageCircle,
}

const TYPE_LABELS: Record<string, string> = {
  bug: "Bug",
  feature: "Feature",
  feedback: "Feedback",
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_progress: "In Progress",
  resolved: "Resolved",
  wont_fix: "Won't Fix",
  closed: "Closed",
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  wont_fix: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
}

// ---------------------------------------------------------------------------
// Global filter — searches across all visible columns
// ---------------------------------------------------------------------------

function globalFilterFn(
  row: { original: Feedback },
  _columnId: string,
  filterValue: string,
) {
  const search = filterValue.toLowerCase().trim()
  if (!search) return true

  const { title, description, userName, type, status, snapshot } = row.original
  const source = snapshot.source === "builder" ? "builder" : "cms"
  const typeLbl = TYPE_LABELS[type] ?? type
  const statusLbl = STATUS_LABELS[status] ?? status

  const searchable = [
    title,
    description,
    userName,
    type,
    typeLbl,
    status,
    statusLbl,
    source,
    snapshot.pageTitle,
    snapshot.cmsPage,
    snapshot.churchName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  // Multi-word: all words must match somewhere
  const words = search.split(/\s+/).filter(Boolean)
  return words.every((word) => searchable.includes(word))
}

// Hoist row model factories
const coreRowModel = getCoreRowModel()
const filteredRowModel = getFilteredRowModel()
const paginationRowModel = getPaginationRowModel()
const sortedRowModel = getSortedRowModel()

// ---------------------------------------------------------------------------
// Delete cell (needs local state for the confirmation dialog)
// ---------------------------------------------------------------------------

function DeleteCell({ id, onDelete }: { id: string; onDelete: (id: string) => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={(e) => {
        e.stopPropagation()
        onDelete(id)
      }}
    >
      <Trash2 className="size-3.5" />
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function createColumns(onDelete: (id: string) => void): ColumnDef<Feedback>[] {
  return [
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
      sortingFn: "datetime",
      size: 100,
    },
    {
      accessorKey: "title",
      header: ({ column }) => <SortableHeader column={column}>Title</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-0">
          {!row.original.isRead && <span className="size-2 rounded-full bg-blue-500 shrink-0" />}
          <span className={cn("truncate", !row.original.isRead && "font-semibold")}>
            {row.original.title}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => <SortableHeader column={column}>Type</SortableHeader>,
      cell: ({ row }) => {
        const TypeIcon = TYPE_ICONS[row.original.type] ?? MessageCircle
        return (
          <div className="flex items-center gap-1.5">
            <TypeIcon className="size-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">{TYPE_LABELS[row.original.type] ?? row.original.type}</span>
          </div>
        )
      },
      filterFn: (row, _id, value: string[]) => value.includes(row.original.type),
      size: 100,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
      cell: ({ row }) => (
        <Badge variant="secondary" className={cn("text-[10px]", STATUS_COLORS[row.original.status])}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
      filterFn: (row, _id, value: string[]) => value.includes(row.original.status),
      size: 110,
    },
    {
      id: "source",
      accessorFn: (row) => (row.snapshot.source === "builder" ? "Builder" : "CMS"),
      header: ({ column }) => <SortableHeader column={column}>Source</SortableHeader>,
      filterFn: (row, _id, value: string[]) => {
        const src = row.original.snapshot.source === "builder" ? "Builder" : "CMS"
        return value.includes(src)
      },
      size: 90,
    },
    {
      accessorKey: "userName",
      header: ({ column }) => <SortableHeader column={column}>By</SortableHeader>,
      size: 120,
    },
    {
      id: "actions",
      cell: ({ row }) => <DeleteCell id={row.original.id} onDelete={onDelete} />,
      enableSorting: false,
      size: 44,
    },
  ]
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function BuilderFeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ total: 0, unread: 0 })

  // Detail dialog
  const [selected, setSelected] = useState<Feedback | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [detailStatus, setDetailStatus] = useState("")
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Table state
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, countRes] = await Promise.all([
        fetch("/api/v1/builder-feedback?pageSize=500"),
        fetch("/api/v1/builder-feedback?countOnly=true"),
      ])

      if (listRes.ok) {
        const json = await listRes.json()
        setItems(json.data ?? [])
      }
      if (countRes.ok) {
        const json = await countRes.json()
        setCounts(json.data)
      }
    } catch {
      toast.error("Failed to load feedback")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = useCallback((id: string) => {
    setDeleteTarget(id)
  }, [])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/v1/builder-feedback/${deleteTarget}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget))
      setCounts((prev) => ({ ...prev, total: prev.total - 1 }))
      if (selected?.id === deleteTarget) {
        setDetailOpen(false)
        setSelected(null)
      }
      toast.success("Deleted")
    } catch {
      toast.error("Failed to delete")
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns = useMemo(() => createColumns(handleDelete), [handleDelete])

  const resetPageIndex = useCallback(() => {
    setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }))
  }, [])

  const handleGlobalFilterChange = useCallback(
    (value: string) => {
      setGlobalFilter(value)
      resetPageIndex()
    },
    [resetPageIndex],
  )

  const handleColumnFiltersChange = useCallback(
    (updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
      setColumnFilters(updater)
      resetPageIndex()
    },
    [resetPageIndex],
  )

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, columnFilters, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: handleColumnFiltersChange,
    onGlobalFilterChange: handleGlobalFilterChange,
    onPaginationChange: setPagination,
    globalFilterFn,
    autoResetPageIndex: false,
    getCoreRowModel: coreRowModel,
    getFilteredRowModel: filteredRowModel,
    getPaginationRowModel: paginationRowModel,
    getSortedRowModel: sortedRowModel,
  })

  // Filter helpers
  const typeFilter = (table.getColumn("type")?.getFilterValue() as string[]) ?? []
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string[]) ?? []
  const sourceFilter = (table.getColumn("source")?.getFilterValue() as string[]) ?? []

  function toggleFilter(columnId: string, value: string) {
    const col = table.getColumn(columnId)
    if (!col) return
    const current = (col.getFilterValue() as string[]) ?? []
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    col.setFilterValue(next.length ? next : undefined)
    resetPageIndex()
  }

  function clearAllFilters() {
    table.getColumn("type")?.setFilterValue(undefined)
    table.getColumn("status")?.setFilterValue(undefined)
    table.getColumn("source")?.setFilterValue(undefined)
    resetPageIndex()
  }

  const activeFilterCount = typeFilter.length + statusFilter.length + sourceFilter.length

  const openDetail = (item: Feedback) => {
    setSelected(item)
    setAdminNotes(item.adminNotes ?? "")
    setDetailStatus(item.status)
    setDetailOpen(true)

    if (!item.isRead) {
      fetch(`/api/v1/builder-feedback/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      }).then(() => {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isRead: true, readAt: new Date().toISOString() } : i)),
        )
        setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }))
      })
    }
  }

  const handleSaveDetail = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/builder-feedback/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: detailStatus, adminNotes }),
      })
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      setItems((prev) => prev.map((i) => (i.id === selected.id ? data : i)))
      setSelected(data)
      toast.success("Updated")
    } catch {
      toast.error("Failed to update")
    } finally {
      setSaving(false)
    }
  }

  const getSourceLabel = (snap: Snapshot) => {
    if (snap.source === "builder") return snap.pageTitle ? `Builder: ${snap.pageTitle}` : "Builder"
    if (snap.source === "cms") return snap.cmsPage ?? "CMS"
    return snap.url ?? "Unknown"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
          {counts.unread > 0 && (
            <Badge variant="default" className="h-6 px-2 text-xs">
              {counts.unread} unread
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {counts.total} total report{counts.total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => handleGlobalFilterChange(e.target.value)}
            className="pl-8"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="default">
              <SlidersHorizontal />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="xs" onClick={clearAllFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              {/* Type filter */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</span>
                <div className="flex flex-wrap gap-1.5">
                  {(["bug", "feature", "feedback"] as const).map((t) => (
                    <Badge
                      key={t}
                      variant={typeFilter.includes(t) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleFilter("type", t)}
                    >
                      {TYPE_LABELS[t]}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Status filter */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
                <div className="flex flex-wrap gap-1.5">
                  {(["new", "in_progress", "resolved", "wont_fix", "closed"] as const).map((s) => (
                    <Badge
                      key={s}
                      variant={statusFilter.includes(s) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleFilter("status", s)}
                    >
                      {STATUS_LABELS[s]}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Source filter */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</span>
                <div className="flex flex-wrap gap-1.5">
                  {["Builder", "CMS"].map((s) => (
                    <Badge
                      key={s}
                      variant={sourceFilter.includes(s) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleFilter("source", s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active filter badges */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {typeFilter.map((t) => (
              <Badge key={`type-${t}`} variant="secondary" className="gap-1">
                {TYPE_LABELS[t] ?? t}
                <button onClick={() => toggleFilter("type", t)} className="ml-0.5 rounded-full hover:bg-foreground/10">
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {statusFilter.map((s) => (
              <Badge key={`status-${s}`} variant="secondary" className="gap-1">
                {STATUS_LABELS[s] ?? s}
                <button onClick={() => toggleFilter("status", s)} className="ml-0.5 rounded-full hover:bg-foreground/10">
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {sourceFilter.map((s) => (
              <Badge key={`source-${s}`} variant="secondary" className="gap-1">
                {s}
                <button onClick={() => toggleFilter("source", s)} className="ml-0.5 rounded-full hover:bg-foreground/10">
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        table={table}
        onRowClick={openDetail}
        fixedLayout
      />

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto overflow-x-hidden">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => { const Icon = TYPE_ICONS[selected.type] ?? MessageCircle; return <Icon className="size-4 text-muted-foreground shrink-0" /> })()}
                  <Badge variant="secondary" className="text-[10px]">
                    {TYPE_LABELS[selected.type] ?? selected.type}
                  </Badge>
                  <Badge variant="secondary" className={cn("text-[10px]", STATUS_COLORS[selected.status])}>
                    {STATUS_LABELS[selected.status] ?? selected.status}
                  </Badge>
                </div>
                <DialogTitle className="text-lg break-words pr-6">{selected.title}</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-5 pt-2 min-w-0">
                {/* Description */}
                <div className="min-w-0">
                  <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm whitespace-pre-wrap mt-1 break-words">{selected.description}</p>
                </div>

                {/* Context */}
                <div className="min-w-0">
                  <Label className="text-xs font-medium text-muted-foreground">Context</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs">
                    <ContextRow icon={FileText} label="Location" value={getSourceLabel(selected.snapshot)} />
                    <ContextRow icon={User} label="Submitted by" value={selected.userName} />
                    <ContextRow icon={Clock} label="Date" value={new Date(selected.createdAt).toLocaleString()} />
                    {selected.snapshot.deviceMode && (
                      <ContextRow icon={Monitor} label="Device" value={selected.snapshot.deviceMode} />
                    )}
                    {selected.snapshot.churchName && (
                      <ContextRow icon={Globe} label="Church" value={selected.snapshot.churchName} />
                    )}
                    {selected.snapshot.cmsPage && (
                      <ContextRow icon={MapPin} label="CMS Page" value={selected.snapshot.cmsPage} />
                    )}
                  </div>

                  {selected.snapshot.editingSectionType && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Editing section: <span className="font-medium">{selected.snapshot.editingSectionType}</span>
                    </p>
                  )}
                  {selected.snapshot.browserInfo && (
                    <p className="text-[11px] text-muted-foreground mt-1 break-all">
                      Browser: {selected.snapshot.browserInfo}
                    </p>
                  )}
                  {selected.snapshot.url && (
                    <p className="text-[11px] text-muted-foreground mt-1 break-all">
                      URL: {selected.snapshot.url}
                    </p>
                  )}
                  {selected.snapshot.viewportWidth && selected.snapshot.viewportHeight && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Viewport: {selected.snapshot.viewportWidth} x {selected.snapshot.viewportHeight}
                    </p>
                  )}
                </div>

                {/* Action History */}
                {selected.actionHistory && selected.actionHistory.length > 0 && (
                  <div className="min-w-0">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Recent Actions ({selected.actionHistory.length})
                    </Label>
                    <div className="mt-1.5 max-h-48 overflow-y-auto rounded border bg-muted/30 p-2 space-y-1">
                      {selected.actionHistory.map((entry, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-muted-foreground font-mono text-[10px] shrink-0 pt-0.5">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="font-medium shrink-0">{entry.action}</span>
                          {entry.detail && <span className="text-muted-foreground break-all">{entry.detail}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin controls */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                    <Select value={detailStatus} onValueChange={setDetailStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="wont_fix">Won&apos;t Fix</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Admin Notes</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal notes..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDetailOpen(false)
                        setDeleteTarget(selected.id)
                      }}
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveDetail}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ContextRow({ icon: Icon, label, value }: { icon: typeof Bug; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded bg-muted/50 min-w-0">
      <Icon className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0">
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium break-words">{value}</span>
      </div>
    </div>
  )
}
