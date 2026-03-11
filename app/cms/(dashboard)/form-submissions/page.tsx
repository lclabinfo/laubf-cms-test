"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Inbox, Search, MailOpen } from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  type ColumnDef,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Submission = {
  id: string
  name: string
  email: string
  phone: string | null
  formType: string
  fields: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  notes: string | null
  createdAt: string
}

type Pagination = {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getInterestsSummary(fields: Record<string, unknown> | null): string {
  if (!fields) return ""
  const interests = fields.interests
  if (!Array.isArray(interests) || interests.length === 0) return ""
  return interests.slice(0, 3).join(", ") + (interests.length > 3 ? ` +${interests.length - 3}` : "")
}

const columns: ColumnDef<Submission>[] = [
  {
    id: "status",
    header: "",
    size: 40,
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <div
          className={cn(
            "size-2 rounded-full",
            row.original.isRead ? "bg-muted-foreground/30" : "bg-primary"
          )}
        />
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className={cn("text-sm", !row.original.isRead && "font-semibold")}>
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    id: "interests",
    header: "Interests",
    cell: ({ row }) => {
      const summary = getInterestsSummary(row.original.fields)
      return summary ? (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{summary}</span>
      ) : (
        <span className="text-sm text-muted-foreground/50">—</span>
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

// Hoist row model factories outside the component
const coreRowModel = getCoreRowModel()
const paginationRowModel = getPaginationRowModel()

export default function FormSubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [search, setSearch] = useState("")
  const [readFilter, setReadFilter] = useState<string>("all")
  const [pagination, setPagination] = useState<Pagination>({
    total: 0, page: 1, pageSize: 20, totalPages: 0,
  })
  const [pageIndex, setPageIndex] = useState(0)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSubmissions = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("pageSize", "20")
      if (search) params.set("search", search)
      if (readFilter === "unread") params.set("isRead", "false")
      if (readFilter === "read") params.set("isRead", "true")

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
  }, [search, readFilter])

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

  useEffect(() => {
    fetchSubmissions(pageIndex + 1)
  }, [fetchSubmissions, pageIndex])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  const handleMarkSelectedAsRead = useCallback(async () => {
    const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k])
    if (selectedIds.length === 0) return

    const selectedSubmissions = selectedIds
      .map((idx) => submissions[Number(idx)])
      .filter((s) => s && !s.isRead)

    if (selectedSubmissions.length === 0) {
      toast.info("All selected submissions are already read")
      return
    }

    try {
      await Promise.all(
        selectedSubmissions.map((s) =>
          fetch(`/api/v1/form-submissions/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: true }),
          })
        )
      )
      toast.success(`Marked ${selectedSubmissions.length} as read`)
      setRowSelection({})
      fetchSubmissions(pageIndex + 1)
      fetchUnreadCount()
    } catch {
      toast.error("Failed to mark as read")
    }
  }, [rowSelection, submissions, fetchSubmissions, fetchUnreadCount, pageIndex])

  const table = useReactTable({
    data: submissions,
    columns,
    state: { rowSelection, pagination: { pageIndex, pageSize: 20 } },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function"
        ? updater({ pageIndex, pageSize: 20 })
        : updater
      setPageIndex(next.pageIndex)
    },
    pageCount: pagination.totalPages,
    manualPagination: true,
    enableRowSelection: true,
    getCoreRowModel: coreRowModel,
    getPaginationRowModel: paginationRowModel,
  })

  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  return (
    <div className="pt-5 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Form Submissions</h1>
        {unreadCount > 0 && (
          <Badge variant="default" className="h-5 px-1.5 text-[11px] font-semibold">
            {unreadCount}
          </Badge>
        )}
      </div>
      <p className="text-muted-foreground text-sm">
        View and manage form submissions from your website visitors.
      </p>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            defaultValue={search}
            onChange={(e) => {
              const value = e.target.value
              if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
              searchTimerRef.current = setTimeout(() => {
                setSearch(value)
                setPageIndex(0)
              }, 300)
            }}
            className="pl-9"
          />
        </div>
        <Select value={readFilter} onValueChange={(v) => { setReadFilter(v); setPageIndex(0) }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
        {selectedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkSelectedAsRead}
          >
            <MailOpen className="size-4 mr-1.5" />
            Mark as Read ({selectedCount})
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="size-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-medium">No submissions yet</h3>
          <p className="text-muted-foreground text-xs mt-1 max-w-xs">
            When visitors submit a form on your website, their submissions will appear here.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          table={table}
          onRowClick={(row) => router.push(`/cms/form-submissions/${row.id}`)}
        />
      )}
    </div>
  )
}
