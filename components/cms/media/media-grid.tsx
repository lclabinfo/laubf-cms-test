"use client"

import { Table as TanstackTable } from "@tanstack/react-table"
import { Play, MoreHorizontal, Image, ChevronLeft, ChevronRight, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react"
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
import type { MediaItem } from "@/lib/media-data"
import { formatDisplay } from "@/lib/media-data"

interface MediaGridProps {
  table: TanstackTable<MediaItem>
}

export function MediaGrid({ table }: MediaGridProps) {
  const rows = table.getRowModel().rows

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Image className="size-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No media found</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
          Upload images and videos, or adjust your filters to see more results.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {rows.map((row) => {
          const item = row.original
          const isSelected = row.getIsSelected()
          const config = formatDisplay[item.format]

          return (
            <div
              key={row.id}
              className={`group relative rounded-lg border overflow-hidden transition-all ${
                isSelected ? "ring-2 ring-primary border-primary" : "hover:border-foreground/20"
              } ${item.isArchived ? "opacity-60" : ""}`}
            >
              {/* Thumbnail */}
              <div className="aspect-video relative bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.name}
                  className="size-full object-cover"
                />

                {/* Video play overlay */}
                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center justify-center size-8 rounded-full bg-black/40">
                      <Play className="size-4 text-white fill-white" />
                    </div>
                  </div>
                )}

                {/* Checkbox */}
                <div className={`absolute top-2 left-2 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label={`Select ${item.name}`}
                    className="bg-background/80 backdrop-blur-sm"
                  />
                </div>

                {/* Archived badge */}
                {item.isArchived && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      Archived
                    </Badge>
                  </div>
                )}
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
                      <DropdownMenuItem>
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        {item.isArchived ? <ArchiveRestore /> : <Archive />}
                        {item.isArchived ? "Unarchive" : "Archive"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive">
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

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <span>{table.getFilteredSelectedRowModel().rows.length} selected &middot; </span>
          )}
          {table.getFilteredRowModel().rows.length} item{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Previous page</span>
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Next page</span>
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
