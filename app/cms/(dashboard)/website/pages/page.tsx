"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  Search,
  Plus,
  Star,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  FileText,
} from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

interface PageRecord {
  id: string
  slug: string
  title: string
  pageType: string
  layout: string
  isHomepage: boolean
  isPublished: boolean
  publishedAt: string | null
  sortOrder: number
  updatedAt: string
  createdAt: string
}

const pageTypeLabels: Record<string, string> = {
  STANDARD: "Standard",
  LANDING: "Landing",
  MINISTRY: "Ministry",
  CAMPUS: "Campus",
  SYSTEM: "System",
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const coreRowModel = getCoreRowModel()
const filteredRowModel = getFilteredRowModel()
const paginationRowModel = getPaginationRowModel()
const sortedRowModel = getSortedRowModel()

function globalFilterFn(
  row: { original: PageRecord },
  _columnId: string,
  filterValue: string
) {
  const search = filterValue.toLowerCase()
  const { title, slug } = row.original
  return (
    title.toLowerCase().includes(search) ||
    slug.toLowerCase().includes(search)
  )
}

export default function WebsitePagesPage() {
  const router = useRouter()
  const [pages, setPages] = useState<PageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([
    { id: "sortOrder", desc: false },
  ])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const [deleteTarget, setDeleteTarget] = useState<PageRecord | null>(null)

  const fetchPages = useCallback(() => {
    setLoading(true)
    fetch("/api/v1/pages")
      .then((r) => r.json())
      .then((json) => setPages(json.data ?? []))
      .catch((err) => console.error("Failed to fetch pages:", err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  function handleDelete(page: PageRecord) {
    setDeleteTarget(page)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    fetch(`/api/v1/pages/${deleteTarget.slug}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setPages((prev) => prev.filter((p) => p.id !== deleteTarget.id))
        } else {
          console.error("Failed to delete page:", json.error)
        }
      })
      .catch((err) => console.error("Failed to delete page:", err))
      .finally(() => setDeleteTarget(null))
  }

  const columns = useMemo<ColumnDef<PageRecord>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {row.original.isHomepage && (
                <Star className="size-3.5 shrink-0 text-warning fill-warning" />
              )}
              <span className="font-medium truncate">{row.getValue("title")}</span>
            </div>
            <Badge variant="secondary" className="mt-0.5 text-[10px] h-4">
              {pageTypeLabels[row.original.pageType] ?? row.original.pageType}
            </Badge>
          </div>
        ),
        size: 260,
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground font-mono">
            /{row.getValue("slug")}
          </span>
        ),
        size: 180,
      },
      {
        accessorKey: "isPublished",
        header: "Status",
        cell: ({ row }) => {
          const isPublished = row.getValue("isPublished") as boolean
          return (
            <Badge variant={isPublished ? "success" : "secondary"}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
          )
        },
        size: 110,
      },
      {
        accessorKey: "isHomepage",
        header: "Homepage",
        cell: ({ row }) => {
          const isHomepage = row.getValue("isHomepage") as boolean
          return isHomepage ? (
            <Star className="size-4 text-warning fill-warning" />
          ) : null
        },
        size: 90,
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last Modified
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.getValue("updatedAt"))}
          </span>
        ),
        size: 140,
      },
      {
        accessorKey: "sortOrder",
        header: "Order",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("sortOrder")}
          </span>
        ),
        size: 70,
        enableHiding: true,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/cms/website/pages/${row.original.slug}`}>
                  <Pencil />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => handleDelete(row.original)}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      },
    ],
    []
  )

  const table = useReactTable({
    data: pages,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
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
        <h1 className="text-xl font-semibold tracking-tight">Pages</h1>
        <p className="text-muted-foreground text-sm">
          Manage your website pages and content.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
        <div className="relative w-full sm:w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex-1" />

        <Button asChild>
          <Link href="/cms/website/pages/new">
            <Plus />
            <span className="hidden sm:inline">New Page</span>
          </Link>
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : pages.length === 0 && !globalFilter ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="size-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-medium">No pages yet</h3>
          <p className="text-muted-foreground text-xs mt-1 max-w-xs">
            Create your first page to start building your website.
          </p>
          <Button asChild className="mt-4">
            <Link href="/cms/website/pages/new">
              <Plus />
              New Page
            </Link>
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          table={table}
          onRowClick={(row) => router.push(`/cms/website/pages/${row.slug}`)}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action
              cannot be undone. All sections on this page will also be deleted.
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
