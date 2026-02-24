"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MoreHorizontal,
  Search,
  Plus,
  Pencil,
  Copy,
  Eye,
  Trash2,
  Globe,
  FileText,
} from "lucide-react"

interface PageRecord {
  id: string
  title: string
  slug: string
  pageType: string
  layout: string
  isHomepage: boolean
  isPublished: boolean
  publishedAt: string | null
  parentId: string | null
  sortOrder: number
  updatedAt: string
  children?: PageRecord[]
}

export default function PagesManagerPage() {
  const [pages, setPages] = useState<PageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPage, setNewPage] = useState({
    title: "",
    slug: "",
    pageType: "STANDARD",
    parentId: "",
  })

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/pages?includeChildren=true")
      if (res.ok) {
        const data = await res.json()
        setPages(data)
      }
    } catch (error) {
      console.error("Failed to fetch pages:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/v1/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPage.title,
          slug: newPage.slug || newPage.title.toLowerCase().replace(/\s+/g, "-"),
          pageType: newPage.pageType,
          parentId: newPage.parentId || null,
        }),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        setNewPage({ title: "", slug: "", pageType: "STANDARD", parentId: "" })
        fetchPages()
      }
    } catch (error) {
      console.error("Failed to create page:", error)
    }
  }

  const handleTogglePublish = async (page: PageRecord) => {
    try {
      await fetch(`/api/v1/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !page.isPublished }),
      })
      fetchPages()
    } catch (error) {
      console.error("Failed to toggle publish:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return
    try {
      await fetch(`/api/v1/pages/${id}`, { method: "DELETE" })
      fetchPages()
    } catch (error) {
      console.error("Failed to delete page:", error)
    }
  }

  const handleDuplicate = async (page: PageRecord) => {
    try {
      await fetch("/api/v1/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${page.title} (Copy)`,
          slug: `${page.slug}-copy`,
          pageType: page.pageType,
          parentId: page.parentId,
        }),
      })
      fetchPages()
    } catch (error) {
      console.error("Failed to duplicate page:", error)
    }
  }

  // Flatten pages for display with hierarchy indication
  const flatPages: (PageRecord & { depth: number })[] = []
  const flattenPages = (list: PageRecord[], depth = 0) => {
    for (const p of list) {
      flatPages.push({ ...p, depth })
      if (p.children && p.children.length > 0) {
        flattenPages(p.children, depth + 1)
      }
    }
  }

  // Top-level pages (no parent)
  const topLevel = pages.filter((p) => !p.parentId)
  flattenPages(topLevel)

  const filteredPages = flatPages.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const pageTypeLabels: Record<string, string> = {
    STANDARD: "Standard",
    LANDING: "Landing",
    MINISTRY: "Ministry",
    CAMPUS: "Campus",
    SYSTEM: "System",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
          <p className="text-sm text-neutral-500">
            Manage your website pages and content structure.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Page
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search pages..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Page</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                  Loading pages...
                </TableCell>
              </TableRow>
            ) : filteredPages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                  {searchTerm ? "No pages match your search." : "No pages yet. Create your first page."}
                </TableCell>
              </TableRow>
            ) : (
              filteredPages.map((page) => (
                <TableRow
                  key={page.id}
                  className="cursor-pointer hover:bg-neutral-50"
                >
                  <TableCell>
                    <Link
                      href={`/cms/website/pages/${page.id}`}
                      className="flex items-center gap-2"
                    >
                      <div style={{ paddingLeft: `${page.depth * 24}px` }} className="flex items-center gap-2">
                        {page.isHomepage ? (
                          <Globe className="h-4 w-4 text-neutral-400 shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-neutral-400 shrink-0" />
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {page.title}
                            {page.isHomepage && (
                              <Badge variant="outline" className="ml-2 text-[10px] font-normal">
                                Homepage
                              </Badge>
                            )}
                          </span>
                          <span className="text-xs text-neutral-400">/{page.slug}</span>
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={page.isPublished ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {page.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {pageTypeLabels[page.pageType] || page.pageType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-500">
                    {formatDate(page.updatedAt)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/cms/website/pages/${page.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Page
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/${page.slug}`} target="_blank">
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(page)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePublish(page)}>
                          <Globe className="mr-2 h-4 w-4" />
                          {page.isPublished ? "Unpublish" : "Publish"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(page.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Page Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Add a new page to your website. You can customize its content after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                placeholder="About Us"
                value={newPage.title}
                onChange={(e) =>
                  setNewPage({
                    ...newPage,
                    title: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                placeholder="about-us"
                value={newPage.slug}
                onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Page Type</Label>
              <Select
                value={newPage.pageType}
                onValueChange={(v) => setNewPage({ ...newPage, pageType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="LANDING">Landing Page</SelectItem>
                  <SelectItem value="MINISTRY">Ministry</SelectItem>
                  <SelectItem value="CAMPUS">Campus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {topLevel.length > 0 && (
              <div className="space-y-2">
                <Label>Parent Page (optional)</Label>
                <Select
                  value={newPage.parentId}
                  onValueChange={(v) => setNewPage({ ...newPage, parentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (top level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (top level)</SelectItem>
                    {topLevel.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newPage.title}>
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
