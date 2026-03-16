"use client"

import { useState } from "react"
import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, TriangleAlert, SquarePen, Plus, Archive, ArchiveRestore, BookOpen, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SortableHeader } from "@/components/ui/sortable-header"
import { PublishToggles } from "@/components/cms/messages/publish-toggles"
import { EntryListPanel } from "@/components/cms/messages/entry-list-panel"
import type { Message, Series } from "@/lib/messages-data"

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function MessageActionsCell({
  row,
  onDelete,
  onArchive,
  onUnarchive,
  onPublishToggle,
}: {
  row: { original: Message }
  onDelete?: (id: string) => void
  onArchive?: (id: string) => void
  onUnarchive?: (id: string) => void
  onPublishToggle?: (id: string, videoPublished: boolean, studyPublished: boolean) => void
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const msg = row.original
  const isArchived = !!msg.archivedAt

  // Use the pre-computed content-existence flags
  const hasVideoContent = msg.hasVideoContent
  const hasStudyContent = msg.hasStudyContent
  const [videoPub, setVideoPub] = useState(msg.videoPublished)
  const [studyPub, setStudyPub] = useState(msg.studyPublished)

  function openPublishDialog() {
    setVideoPub(msg.videoPublished)
    setStudyPub(msg.studyPublished)
    setPublishOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/cms/messages/${msg.id}`}>
              <Pencil />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              openPublishDialog()
            }}
          >
            <BookOpen />
            Publish / Unpublish
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isArchived ? (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                onUnarchive?.(msg.id)
              }}
            >
              <ArchiveRestore />
              Unarchive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setArchiveOpen(true)
              }}
            >
              <Archive />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault()
              setDeleteOpen(true)
            }}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This entry and all its contents will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <EntryListPanel messages={[msg]} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => onDelete?.(msg.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive confirmation */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-warning/10">
              <Archive className="text-warning" />
            </AlertDialogMedia>
            <AlertDialogTitle>Archive entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This entry will be archived. All published content will be set to draft and hidden from the public site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <EntryListPanel messages={[msg]} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onArchive?.(msg.id)}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish/Unpublish dialog — reuses same component as editor Save Changes */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isArchived ? "Publish & Unarchive" : "Publish / Unpublish"}</DialogTitle>
            <DialogDescription>
              {isArchived
                ? "This entry is archived. Publishing content will also unarchive it."
                : "Review what will be visible on the public site."}
            </DialogDescription>
          </DialogHeader>
          <PublishToggles
            studyPublished={studyPub}
            videoPublished={videoPub}
            studyContentExists={hasStudyContent}
            videoContentExists={hasVideoContent}
            onStudyChange={setStudyPub}
            onVideoChange={setVideoPub}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              onPublishToggle?.(msg.id, videoPub, studyPub)
              setPublishOpen(false)
            }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface CreateColumnsOptions {
  series: Series[]
  onDelete?: (id: string) => void
  onArchive?: (id: string) => void
  onUnarchive?: (id: string) => void
  onPublishToggle?: (id: string, videoPublished: boolean, studyPublished: boolean) => void
}

export function createColumns(seriesOrOptions: Series[] | CreateColumnsOptions): ColumnDef<Message>[] {
  const options = Array.isArray(seriesOrOptions)
    ? { series: seriesOrOptions }
    : seriesOrOptions
  const { series, onDelete, onArchive, onUnarchive, onPublishToggle } = options

  return [
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
    enableSorting: false,
    enableHiding: false,
    size: 28,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <SortableHeader column={column}>Title</SortableHeader>
    ),
    cell: ({ row }) => {
      const isArchived = !!row.original.archivedAt
      return (
        <div className="flex items-center gap-2 min-w-0">
          <div className={`min-w-0 shrink ${isArchived ? "opacity-60" : ""}`}>
            <div className="font-medium truncate">{row.getValue("title")}</div>
            <div className="text-muted-foreground text-xs truncate min-h-[1lh]">{row.original.passage || "\u00A0"}</div>
          </div>
          {isArchived && (
            <Badge variant="outline" className="shrink-0 text-[10px] h-4 text-muted-foreground">
              <Archive className="size-2.5 mr-0.5" />
              Archived
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "speaker",
    header: ({ column }) => (
      <SortableHeader column={column}>Speaker</SortableHeader>
    ),
    cell: ({ row }) => <span>{row.getValue("speaker")}</span>,
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id))
    },
    size: 100,
  },
  {
    accessorKey: "seriesId",
    header: () => <span className="whitespace-nowrap">Series</span>,
    cell: ({ row }) => {
      const seriesId = row.original.seriesId
      const matched = seriesId ? series.find((s) => s.id === seriesId) : null
      if (!matched) return null
      return (
        <Badge variant="outline" className="text-xs font-normal max-w-full truncate-fade inline-block text-left">
          {matched.name}
        </Badge>
      )
    },
    filterFn: (row, id, value: string[]) => {
      const seriesId = row.getValue(id) as string | null
      if (!seriesId) return false
      return value.includes(seriesId)
    },
    enableSorting: false,
    size: 100,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <SortableHeader column={column}>Message Date</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap">{formatDate(row.getValue("date"))}</span>
    ),
    size: 100,
  },
  {
    id: "study",
    header: () => <span className="whitespace-nowrap">Study</span>,
    cell: ({ row }) => {
      const isLive = row.original.studyPublished
      const hasContent = row.original.hasStudyContent
      return (
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <Badge variant="success">Published</Badge>
          ) : hasContent ? (
            <Badge variant="secondary">Draft</Badge>
          ) : (
            <span className="text-muted-foreground text-xs">&mdash;</span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 hidden xl:inline-flex"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/cms/messages/${row.original.id}?tab=study`} aria-label={hasContent ? "Edit study" : "Add study"}>
              {hasContent ? <SquarePen className="size-3.5" /> : <Plus className="size-3.5" />}
            </Link>
          </Button>
        </div>
      )
    },
    enableSorting: false,
    size: 90,
  },
  {
    id: "video",
    header: () => <span className="whitespace-nowrap">Video</span>,
    cell: ({ row }) => {
      const isLive = row.original.videoPublished
      const hasContent = row.original.hasVideoContent
      return (
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <Badge variant="success">Published</Badge>
          ) : hasContent ? (
            <Badge variant="secondary">Draft</Badge>
          ) : (
            <span className="text-muted-foreground text-xs">&mdash;</span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 hidden xl:inline-flex"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/cms/messages/${row.original.id}?tab=video`} aria-label={hasContent ? "Edit video" : "Add video"}>
              {hasContent ? <SquarePen className="size-3.5" /> : <Plus className="size-3.5" />}
            </Link>
          </Button>
        </div>
      )
    },
    enableSorting: false,
    size: 90,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <MessageActionsCell
          row={row}
          onDelete={onDelete}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onPublishToggle={onPublishToggle}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  ]
}

// Default export for backward compatibility — empty series list
export const columns = createColumns([])
