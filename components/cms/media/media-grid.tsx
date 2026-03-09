"use client"

import { useState, useCallback } from "react"
import { Play, MoreHorizontal, ImageIcon, Pencil, FolderInput, Trash2, Folder } from "lucide-react"
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
import type { MediaItem, MediaFolder } from "@/lib/media-data"
import { formatDisplay } from "@/lib/media-data"

interface MediaGridProps {
  items: MediaItem[]
  folders?: MediaFolder[]
  folderCounts?: Map<string, number>
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (selected: boolean) => void
  onFolderClick: (folderId: string) => void
  onEdit: (id: string) => void
  onMove: (id: string) => void
  onDelete: (id: string) => void
  /** Drop one or more media items onto a folder */
  onDropOnFolder?: (itemIds: string[], folderId: string) => void
}

export function MediaGrid({
  items,
  folders,
  folderCounts,
  selectedIds,
  onToggleSelect,
  onFolderClick,
  onEdit,
  onMove,
  onDelete,
  onDropOnFolder,
}: MediaGridProps) {
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)

  const hasContent = items.length > 0 || (folders && folders.length > 0)

  const handleDragStart = useCallback(
    (e: React.DragEvent, itemId: string) => {
      // If the dragged item is part of the selection, drag all selected items
      const ids = selectedIds.has(itemId) && selectedIds.size > 1
        ? Array.from(selectedIds)
        : [itemId]
      e.dataTransfer.setData("application/x-media-ids", JSON.stringify(ids))
      e.dataTransfer.effectAllowed = "move"
    },
    [selectedIds]
  )

  const handleFolderDragOver = useCallback(
    (e: React.DragEvent, folderId: string) => {
      if (e.dataTransfer.types.includes("application/x-media-ids")) {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        setDragOverFolderId(folderId)
      }
    },
    []
  )

  const handleFolderDragLeave = useCallback(() => {
    setDragOverFolderId(null)
  }, [])

  const handleFolderDrop = useCallback(
    (e: React.DragEvent, folderId: string) => {
      e.preventDefault()
      setDragOverFolderId(null)
      const raw = e.dataTransfer.getData("application/x-media-ids")
      if (!raw || !onDropOnFolder) return
      try {
        const ids = JSON.parse(raw) as string[]
        if (ids.length > 0) onDropOnFolder(ids, folderId)
      } catch {
        // ignore
      }
    },
    [onDropOnFolder]
  )

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <ImageIcon className="size-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No media found</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
          Upload images and videos, or adjust your filters to see more results.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {/* Folder cards (only in "all" view) */}
      {folders?.map((folder) => {
        const count = folderCounts?.get(folder.id) ?? 0
        const isDragOver = dragOverFolderId === folder.id
        return (
          <button
            key={folder.id}
            onClick={() => onFolderClick(folder.id)}
            onDragOver={(e) => handleFolderDragOver(e, folder.id)}
            onDragLeave={handleFolderDragLeave}
            onDrop={(e) => handleFolderDrop(e, folder.id)}
            className={`group relative aspect-square rounded-lg border bg-muted overflow-hidden transition-all text-left flex flex-col items-center justify-center ${
              isDragOver
                ? "ring-2 ring-primary border-primary bg-primary/10"
                : "hover:border-foreground/20"
            }`}
          >
            <Folder className={`size-8 mb-1 ${isDragOver ? "text-primary" : "text-muted-foreground/60"}`} />
            <span className="text-sm font-medium truncate max-w-[90%]">{folder.name}</span>
            <span className="text-xs text-muted-foreground">
              {count} item{count !== 1 ? "s" : ""}
            </span>
          </button>
        )
      })}

      {/* Media item cards */}
      {items.map((item) => {
        const isSelected = selectedIds.has(item.id)
        const config = formatDisplay[item.format]
        return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onClick={() => onEdit(item.id)}
            className={`group relative aspect-square rounded-lg border overflow-hidden transition-all cursor-pointer ${
              isSelected ? "ring-2 ring-primary border-primary" : "hover:border-foreground/20"
            }`}
          >
            {/* Thumbnail — fills the entire square */}
            <div className="absolute inset-0 bg-muted">
              {item.type === "video" ? (
                /* eslint-disable-next-line jsx-a11y/media-has-caption */
                <video
                  src={`${item.url}#t=0.5`}
                  preload="metadata"
                  muted
                  playsInline
                  className="size-full object-cover"
                  draggable={false}
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.url}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                  draggable={false}
                />
              )}
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center justify-center size-8 rounded-full bg-black/40">
                    <Play className="size-4 text-white fill-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox */}
            <div
              className={`absolute top-2 left-2 z-10 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(item.id)}
                aria-label={`Select ${item.name}`}
                className="bg-background/80 backdrop-blur-sm"
              />
            </div>

            {/* Footer — overlaid at bottom */}
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-10 pb-2 px-2.5 pointer-events-none">
              <div className="flex items-start justify-between gap-1">
                <span className="text-sm font-medium truncate text-white">{item.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-0.5 text-white hover:text-white hover:bg-white/20 pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item.id)}>
                      <Pencil />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMove(item.id)}>
                      <FolderInput />
                      Move to...
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant={config.variant} className="text-[10px] h-4 px-1.5">
                  {config.label}
                </Badge>
                <span className="text-white/70 text-xs">{item.size}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
