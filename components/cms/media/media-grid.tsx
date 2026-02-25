"use client"

import { Play, MoreHorizontal, ImageIcon, Pencil, FolderInput, Trash2, Folder } from "lucide-react"
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
}: MediaGridProps) {
  const hasContent = items.length > 0 || (folders && folders.length > 0)

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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {/* Folder cards (only in "all" view) */}
      {folders?.map((folder) => {
        const count = folderCounts?.get(folder.id) ?? 0
        return (
          <button
            key={folder.id}
            onClick={() => onFolderClick(folder.id)}
            className="group relative rounded-lg border overflow-hidden transition-all hover:border-foreground/20 text-left"
          >
            <div className="aspect-video flex flex-col items-center justify-center bg-muted/50">
              <Folder className="size-10 text-muted-foreground/60 mb-1" />
              <span className="text-sm font-medium truncate max-w-[90%]">{folder.name}</span>
              <span className="text-xs text-muted-foreground">
                {count} item{count !== 1 ? "s" : ""}
              </span>
            </div>
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
            className={`group relative rounded-lg border overflow-hidden transition-all ${
              isSelected ? "ring-2 ring-primary border-primary" : "hover:border-foreground/20"
            }`}
          >
            {/* Thumbnail — click to preview */}
            <div
              role="button"
              tabIndex={0}
              className="aspect-video relative bg-muted w-full cursor-pointer"
              onClick={() => onEdit(item.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEdit(item.id) } }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.name}
                className="size-full object-cover"
              />

              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center justify-center size-8 rounded-full bg-black/40">
                    <Play className="size-4 text-white fill-white" />
                  </div>
                </div>
              )}

              {/* Checkbox */}
              <div
                className={`absolute top-2 left-2 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(item.id)}
                  aria-label={`Select ${item.name}`}
                  className="bg-background/80 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-2.5 space-y-1.5">
              <div className="flex items-start justify-between gap-1">
                <span className="text-sm font-medium truncate">{item.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-0.5"
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
                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-muted-foreground text-xs">{item.size}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
