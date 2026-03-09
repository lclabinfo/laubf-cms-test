"use client"

import { Cloud, ExternalLink, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { GoogleAlbum } from "@/lib/media-data"

interface GoogleAlbumsTableProps {
  albums: GoogleAlbum[]
  onDelete: (id: string) => void
}

export function GoogleAlbumsTable({ albums, onDelete }: GoogleAlbumsTableProps) {
  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Cloud className="size-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No Google Albums connected</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
          Connect a Google Photos album to display your photos in the media library.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Cover</TableHead>
            <TableHead>Album Name</TableHead>
            <TableHead className="w-20">Photos</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {albums.map((album) => (
            <TableRow key={album.id}>
              <TableCell>
                <div className="size-12 rounded overflow-hidden bg-muted shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={album.coverUrl}
                    alt={album.name}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover"
                  />
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">{album.name}</span>
              </TableCell>
              <TableCell>{album.photoCount}</TableCell>
              <TableCell>
                <Badge variant={album.status === "Connected" ? "default" : "secondary"}>
                  {album.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a href={album.externalUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" />
                      View
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(album.id)}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Delete album</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
