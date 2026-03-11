"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Search,
  Inbox,
  MailOpen,
  Mail,
  Trash2,
  Phone,
  User,
  Clock,
  MessageSquare,
  SlidersHorizontal,
  X,
  ChevronRight,
  Circle,
  MoreHorizontal,
  Loader2,
  Send,
} from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  type ColumnDef,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActivityLogEntry = {
  userId: string
  userName: string
  action: string
  content?: string
  createdAt: string
}

type Submission = {
  id: string
  name: string
  email: string
  phone: string | null
  formType: string
  subject: string | null
  message: string | null
  fields: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  status: string
  notes: string | null
  activityLog: ActivityLogEntry[] | null
  createdAt: string
}

type Pagination = {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "success" | "outline"> = {
  new: "default",
  reviewed: "secondary",
  contacted: "success",
  archived: "outline",
}

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "contacted", label: "Contacted" },
  { value: "archived", label: "Archived" },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function formatFieldValue(value: unknown): string {
  if (value == null) return "-"
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return String(value)
}

// ---------------------------------------------------------------------------
// Hoisted row model factories (stable references)
// ---------------------------------------------------------------------------

const coreRowModel = getCoreRowModel()
const paginationRowModel = getPaginationRowModel()

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function FormSubmissionsPage() {
  const router = useRouter()

  // Data
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Filters
  const [search, setSearch] = useState("")
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Pagination
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  })
  const [pageIndex, setPageIndex] = useState(0)

  // Selection
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // Sheet
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetLoading, setSheetLoading] = useState(false)

  // Notes
  const [noteText, setNoteText] = useState("")
  const [addingNote, setAddingNote] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string[] | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Debounce
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const fetchSubmissions = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set("page", String(page))
        params.set("pageSize", String(PAGE_SIZE))
        if (search) params.set("search", search)
        if (readFilter === "unread") params.set("isRead", "false")
        if (readFilter === "read") params.set("isRead", "true")
        if (statusFilter !== "all") params.set("status", statusFilter)

        const res = await fetch(`/api/v1/form-submissions?${params}`)
        const json = await res.json()
        if (json.success) {
          setSubmissions(json.data)
          setPagination(json.pagination)
        }
      } catch (err) {
        console.error("Failed to fetch submissions:", err)
        toast.error("Failed to load submissions")
      } finally {
        setLoading(false)
      }
    },
    [search, readFilter, statusFilter],
  )

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/form-submissions?countOnly=true")
      const json = await res.json()
      if (json.success) {
        setUnreadCount(json.data.unreadCount)
      }
    } catch {
      // silent
    }
  }, [])

  const refreshData = useCallback(() => {
    fetchSubmissions(pageIndex + 1)
    fetchUnreadCount()
  }, [fetchSubmissions, fetchUnreadCount, pageIndex])

  useEffect(() => {
    fetchSubmissions(pageIndex + 1)
  }, [fetchSubmissions, pageIndex])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // -----------------------------------------------------------------------
  // Sheet actions
  // -----------------------------------------------------------------------

  const openSheet = useCallback(
    async (submission: Submission) => {
      setSelectedSubmission(submission)
      setSheetOpen(true)
      setNoteText("")

      // Auto-mark as read
      if (!submission.isRead) {
        try {
          await fetch(`/api/v1/form-submissions/${submission.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: true }),
          })
          // Optimistic update in list
          setSubmissions((prev) =>
            prev.map((s) =>
              s.id === submission.id
                ? { ...s, isRead: true, readAt: new Date().toISOString() }
                : s,
            ),
          )
          fetchUnreadCount()
        } catch {
          // silent — not critical
        }
      }

      // Fetch full details (may have activity log etc.)
      setSheetLoading(true)
      try {
        const res = await fetch(`/api/v1/form-submissions/${submission.id}`)
        const json = await res.json()
        if (json.success) {
          setSelectedSubmission({
            ...json.data,
            isRead: true,
            readAt: json.data.readAt ?? new Date().toISOString(),
          })
        }
      } catch {
        // show what we have
      } finally {
        setSheetLoading(false)
      }
    },
    [fetchUnreadCount],
  )

  const handleSheetStatusChange = useCallback(
    async (newStatus: string) => {
      if (!selectedSubmission) return
      try {
        const res = await fetch(
          `/api/v1/form-submissions/${selectedSubmission.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          },
        )
        const json = await res.json()
        if (json.success) {
          setSelectedSubmission((prev) =>
            prev ? { ...prev, status: newStatus } : prev,
          )
          setSubmissions((prev) =>
            prev.map((s) =>
              s.id === selectedSubmission.id ? { ...s, status: newStatus } : s,
            ),
          )
          toast.success(`Status updated to ${capitalize(newStatus)}`)
        }
      } catch {
        toast.error("Failed to update status")
      }
    },
    [selectedSubmission],
  )

  const handleSheetToggleRead = useCallback(async () => {
    if (!selectedSubmission) return
    const newIsRead = !selectedSubmission.isRead
    try {
      await fetch(`/api/v1/form-submissions/${selectedSubmission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: newIsRead }),
      })
      setSelectedSubmission((prev) =>
        prev
          ? {
              ...prev,
              isRead: newIsRead,
              readAt: newIsRead ? new Date().toISOString() : null,
            }
          : prev,
      )
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubmission.id
            ? { ...s, isRead: newIsRead, readAt: newIsRead ? new Date().toISOString() : null }
            : s,
        ),
      )
      fetchUnreadCount()
      toast.success(newIsRead ? "Marked as read" : "Marked as unread")
    } catch {
      toast.error("Failed to update")
    }
  }, [selectedSubmission, fetchUnreadCount])

  const handleAddNote = useCallback(async () => {
    if (!selectedSubmission || !noteText.trim()) return
    setAddingNote(true)
    try {
      await fetch(`/api/v1/form-submissions/${selectedSubmission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText.trim() }),
      })
      // Refetch to get updated activity log
      const res = await fetch(
        `/api/v1/form-submissions/${selectedSubmission.id}`,
      )
      const json = await res.json()
      if (json.success) {
        setSelectedSubmission(json.data)
      }
      setNoteText("")
      toast.success("Note added")
    } catch {
      toast.error("Failed to add note")
    } finally {
      setAddingNote(false)
    }
  }, [selectedSubmission, noteText])

  // -----------------------------------------------------------------------
  // Bulk actions
  // -----------------------------------------------------------------------

  const getSelectedIds = useCallback(() => {
    return Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((idx) => submissions[Number(idx)]?.id)
      .filter(Boolean) as string[]
  }, [rowSelection, submissions])

  const handleBatchAction = useCallback(
    async (
      action: "markRead" | "markUnread" | "setStatus" | "delete",
      status?: string,
    ) => {
      const ids = getSelectedIds()
      if (ids.length === 0) return

      try {
        const res = await fetch("/api/v1/form-submissions/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action, status }),
        })
        const json = await res.json()
        if (json.success) {
          const labels: Record<string, string> = {
            markRead: "Marked as read",
            markUnread: "Marked as unread",
            setStatus: `Status set to ${capitalize(status ?? "")}`,
            delete: "Deleted",
          }
          toast.success(`${labels[action]} (${ids.length})`)
          setRowSelection({})
          refreshData()
        } else {
          toast.error("Batch action failed")
        }
      } catch {
        toast.error("Batch action failed")
      }
    },
    [getSelectedIds, refreshData],
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      if (deleteTarget.length === 1) {
        // Single delete via DELETE endpoint
        await fetch(`/api/v1/form-submissions/${deleteTarget[0]}`, {
          method: "DELETE",
        })
        toast.success("Submission deleted")
        if (selectedSubmission?.id === deleteTarget[0]) {
          setSheetOpen(false)
          setSelectedSubmission(null)
        }
      } else {
        // Batch delete
        await fetch("/api/v1/form-submissions/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: deleteTarget, action: "delete" }),
        })
        toast.success(`Deleted ${deleteTarget.length} submissions`)
      }
      setRowSelection({})
      setDeleteTarget(null)
      refreshData()
    } catch {
      toast.error("Failed to delete")
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, selectedSubmission, refreshData])

  // -----------------------------------------------------------------------
  // Table columns
  // -----------------------------------------------------------------------

  const columns: ColumnDef<Submission>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 36,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "readDot",
      header: "",
      size: 28,
      cell: ({ row }) =>
        !row.original.isRead ? (
          <div className="flex items-center justify-center">
            <Circle className="size-2.5 fill-primary text-primary" />
          </div>
        ) : null,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span
          className={cn(
            "text-sm truncate block max-w-[180px]",
            !row.original.isRead && "font-semibold text-foreground",
          )}
        >
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
          {row.original.email}
        </span>
      ),
    },
    {
      id: "statusBadge",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "new"
        return (
          <Badge variant={STATUS_BADGE_VARIANT[status] ?? "default"}>
            {capitalize(status)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatRelativeDate(row.original.createdAt)}
        </span>
      ),
    },
  ]

  // -----------------------------------------------------------------------
  // Table instance
  // -----------------------------------------------------------------------

  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  const table = useReactTable({
    data: submissions,
    columns,
    state: { rowSelection, pagination: { pageIndex, pageSize: PAGE_SIZE } },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize: PAGE_SIZE })
          : updater
      setPageIndex(next.pageIndex)
    },
    pageCount: pagination.totalPages,
    manualPagination: true,
    enableRowSelection: true,
    getCoreRowModel: coreRowModel,
    getPaginationRowModel: paginationRowModel,
  })

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const activityLog = (selectedSubmission?.activityLog ?? []) as ActivityLogEntry[]

  return (
    <>
      <div className="pt-5 space-y-4">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">
            Form Submissions
          </h1>
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="h-5 px-1.5 text-[11px] font-semibold"
            >
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          View and manage form submissions from your website visitors.
        </p>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              defaultValue={search}
              onChange={(e) => {
                const value = e.target.value
                if (searchTimerRef.current)
                  clearTimeout(searchTimerRef.current)
                searchTimerRef.current = setTimeout(() => {
                  setSearch(value)
                  setPageIndex(0)
                }, 300)
              }}
              className="pl-9"
            />
          </div>

          {/* Filters popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <SlidersHorizontal className="size-4" />
                Filters
                {(readFilter !== "all" || statusFilter !== "all") && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-[10px]"
                  >
                    {[readFilter !== "all" ? 1 : 0, statusFilter !== "all" ? 1 : 0].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-3">
              {/* Read status filter */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Read status
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(["all", "unread", "read"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setReadFilter(opt)
                        setPageIndex(0)
                      }}
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border",
                        readFilter === opt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent text-foreground border-border hover:bg-muted",
                      )}
                    >
                      {capitalize(opt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status filter */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Form status
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "all", label: "All" },
                    ...STATUS_OPTIONS,
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setStatusFilter(opt.value)
                        setPageIndex(0)
                      }}
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border",
                        statusFilter === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent text-foreground border-border hover:bg-muted",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear filters */}
              {(readFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setReadFilter("all")
                    setStatusFilter("all")
                    setPageIndex(0)
                  }}
                >
                  <X className="size-3 mr-1" />
                  Clear all filters
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bulk actions bar (when rows selected) */}
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {selectedCount} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction("markRead")}
              >
                <MailOpen className="size-3.5 mr-1.5" />
                Mark Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction("markUnread")}
              >
                <Mail className="size-3.5 mr-1.5" />
                Mark Unread
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="size-3.5 mr-1.5" />
                    Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {STATUS_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() =>
                        handleBatchAction("setStatus", opt.value)
                      }
                    >
                      <Badge
                        variant={STATUS_BADGE_VARIANT[opt.value]}
                        className="mr-2"
                      >
                        {opt.label}
                      </Badge>
                      Set to {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(getSelectedIds())}
              >
                <Trash2 className="size-3.5 mr-1.5" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRowSelection({})}
              >
                Clear
              </Button>
            </div>
          ) : null}
        </div>

        {/* Table / Empty state */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Inbox className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">No submissions yet</h3>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-sm">
              When visitors submit a form on your website, their submissions
              will appear here.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            table={table}
            onRowClick={(row) => openSheet(row)}
          />
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Preview Sheet                                                      */}
      {/* ----------------------------------------------------------------- */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          {selectedSubmission && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <SheetHeader className="border-b pb-4">
                <div className="flex items-start gap-2 pr-8">
                  <SheetTitle className="text-lg leading-tight">
                    {selectedSubmission.name}
                  </SheetTitle>
                  <Badge
                    variant={
                      STATUS_BADGE_VARIANT[selectedSubmission.status] ??
                      "default"
                    }
                    className="shrink-0 mt-0.5"
                  >
                    {capitalize(selectedSubmission.status || "new")}
                  </Badge>
                </div>
                <SheetDescription className="flex items-center gap-1.5 text-xs mt-1">
                  <Clock className="size-3" />
                  {formatRelativeDate(selectedSubmission.createdAt)}
                  {" \u00b7 "}
                  {new Date(selectedSubmission.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )}
                </SheetDescription>
              </SheetHeader>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Contact info */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contact Information
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="size-3.5 text-muted-foreground shrink-0" />
                      <span>{selectedSubmission.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="size-3.5 text-muted-foreground shrink-0" />
                      <a
                        href={`mailto:${selectedSubmission.email}`}
                        className="text-primary hover:underline"
                      >
                        {selectedSubmission.email}
                      </a>
                    </div>
                    {selectedSubmission.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="size-3.5 text-muted-foreground shrink-0" />
                        <a
                          href={`tel:${selectedSubmission.phone}`}
                          className="text-primary hover:underline"
                        >
                          {selectedSubmission.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message (if any) */}
                {selectedSubmission.message && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Message
                    </h4>
                    <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/50 p-3">
                      {selectedSubmission.message}
                    </p>
                  </div>
                )}

                {/* Form fields */}
                {selectedSubmission.fields &&
                  Object.keys(selectedSubmission.fields).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Form Details
                      </h4>
                      <div className="rounded-lg border divide-y">
                        {Object.entries(selectedSubmission.fields).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex items-start gap-3 px-3 py-2.5"
                            >
                              <span className="text-xs font-medium text-muted-foreground min-w-[100px] pt-0.5">
                                {formatFieldLabel(key)}
                              </span>
                              <span className="text-sm flex-1">
                                {formatFieldValue(value)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Status selector */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </h4>
                  <Select
                    value={selectedSubmission.status || "new"}
                    onValueChange={handleSheetStatusChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={STATUS_BADGE_VARIANT[opt.value]}
                              className="text-[10px] h-4 px-1.5"
                            >
                              {opt.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Activity log / Notes */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Activity & Notes
                  </h4>

                  {sheetLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : activityLog.length > 0 ? (
                    <div className="space-y-3">
                      {activityLog.map((entry, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="mt-1 shrink-0">
                            <div className="size-6 rounded-full bg-muted flex items-center justify-center">
                              {entry.action === "note_added" ? (
                                <MessageSquare className="size-3 text-muted-foreground" />
                              ) : (
                                <Circle className="size-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-medium">
                                {entry.userName}
                              </span>
                              <span className="text-muted-foreground">
                                {formatRelativeDate(entry.createdAt)}
                              </span>
                            </div>
                            {entry.content && (
                              <p className="text-sm mt-0.5 text-foreground">
                                {entry.content}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No activity yet.
                    </p>
                  )}

                  {/* Add note input */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="min-h-[60px] flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          handleAddNote()
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="shrink-0 self-end"
                      disabled={!noteText.trim() || addingNote}
                      onClick={handleAddNote}
                    >
                      {addingNote ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="border-t p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleSheetToggleRead}
                  >
                    {selectedSubmission.isRead ? (
                      <>
                        <Mail className="size-3.5 mr-1.5" />
                        Mark Unread
                      </>
                    ) : (
                      <>
                        <MailOpen className="size-3.5 mr-1.5" />
                        Mark Read
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setDeleteTarget([selectedSubmission.id])
                    }}
                  >
                    <Trash2 className="size-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => {
                    setSheetOpen(false)
                    router.push(
                      `/cms/form-submissions/${selectedSubmission.id}`,
                    )
                  }}
                >
                  View Full Details
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ----------------------------------------------------------------- */}
      {/* Delete Confirmation Dialog                                         */}
      {/* ----------------------------------------------------------------- */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete submission{deleteTarget && deleteTarget.length > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget.length > 1
                ? `This will permanently delete ${deleteTarget.length} submissions. This action cannot be undone.`
                : "This will permanently delete this submission. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : (
                <Trash2 className="size-4 mr-1.5" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
