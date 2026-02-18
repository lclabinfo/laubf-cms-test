"use client"

import { useState, useMemo } from "react"
import {
  Download,
  ExternalLink,
  ImageIcon,
  Video,
  Calendar,
  HardDrive,
  FileType,
  Tag,
  Folder,
  FolderX,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { MediaItem, MediaFolder } from "@/lib/media-data"
import { formatDisplay, mediaTypeDisplay } from "@/lib/media-data"

interface MediaPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MediaItem | null
  folders: MediaFolder[]
  onUpdate: (id: string, updates: Partial<Pick<MediaItem, "name" | "altText" | "folderId">>) => void
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function getVideoEmbedUrl(videoUrl: string): string | null {
  // YouTube
  const ytMatch = videoUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  // Vimeo
  const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  return null
}

function getFileExtension(name: string): string {
  const parts = name.split(".")
  if (parts.length > 1) return parts.pop()!.toUpperCase()
  return "-"
}

export function MediaPreviewDialog({
  open,
  onOpenChange,
  item,
  folders,
  onUpdate,
}: MediaPreviewDialogProps) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <PreviewContent
          key={item.id}
          item={item}
          folders={folders}
          onUpdate={onUpdate}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function PreviewContent({
  item,
  folders,
  onUpdate,
  onClose,
}: {
  item: MediaItem
  folders: MediaFolder[]
  onUpdate: MediaPreviewDialogProps["onUpdate"]
  onClose: () => void
}) {
  const [name, setName] = useState(item.name)
  const [altText, setAltText] = useState(item.altText ?? "")
  const [folderId, setFolderId] = useState<string | null>(item.folderId)
  const [folderOpen, setFolderOpen] = useState(false)

  const isImage = item.type === "image"
  const isVideo = item.type === "video"
  const formatConfig = formatDisplay[item.format]
  const embedUrl = isVideo && item.videoUrl ? getVideoEmbedUrl(item.videoUrl) : null
  const extension = getFileExtension(item.name)

  const folderName = useMemo(() => {
    if (!folderId) return "None"
    return folders.find((f) => f.id === folderId)?.name ?? "None"
  }, [folderId, folders])

  const hasChanges =
    name !== item.name ||
    altText !== (item.altText ?? "") ||
    folderId !== item.folderId

  function handleSave() {
    onUpdate(item.id, { name, altText: altText || undefined, folderId })
    onClose()
  }

  function handleDownload() {
    if (!item.url) return
    const a = document.createElement("a")
    a.href = item.url
    a.download = item.name
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="px-5 pt-5 pb-0">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{item.name}</DialogTitle>
          <DialogDescription>
            {isImage ? "Image" : "Video"} preview and metadata
          </DialogDescription>
        </DialogHeader>
      </div>

      {/* Body — two-column on desktop, stacked on mobile */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Preview area */}
          <div className="sm:w-[55%] shrink-0">
            <div className="rounded-lg border overflow-hidden bg-muted">
              {isImage && item.url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.url}
                  alt={altText || item.name}
                  className="w-full h-auto object-contain max-h-[400px]"
                />
              ) : isVideo && embedUrl ? (
                <div className="aspect-video">
                  <iframe
                    src={embedUrl}
                    title={item.name}
                    className="size-full"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : isVideo && item.url ? (
                <div className="aspect-video relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.name}
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center justify-center size-12 rounded-full bg-black/50">
                      <Video className="size-6 text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center">
                  {isImage ? (
                    <ImageIcon className="size-16 text-muted-foreground/40" />
                  ) : (
                    <Video className="size-16 text-muted-foreground/40" />
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Metadata panel */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Editable fields */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="media-name">Name</Label>
                <Input
                  id="media-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9"
                />
              </div>

              {isImage && (
                <div className="space-y-1.5">
                  <Label htmlFor="media-alt">Alt Text</Label>
                  <Input
                    id="media-alt"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe the image for accessibility"
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">
                    Improves accessibility and SEO.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Folder</Label>
                <Popover open={folderOpen} onOpenChange={setFolderOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={folderOpen}
                      className="w-full justify-between h-9 font-normal"
                    >
                      <span className="flex items-center gap-2 truncate">
                        {folderId ? (
                          <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <FolderX className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                        {folderName}
                      </span>
                      <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search folders..." />
                      <CommandList>
                        <CommandEmpty>No folder found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="none"
                            onSelect={() => {
                              setFolderId(null)
                              setFolderOpen(false)
                            }}
                          >
                            <FolderX className="size-3.5 text-muted-foreground" />
                            None
                            {folderId === null && (
                              <Check className="ml-auto size-3.5" />
                            )}
                          </CommandItem>
                          {folders.map((folder) => (
                            <CommandItem
                              key={folder.id}
                              value={folder.name}
                              onSelect={() => {
                                setFolderId(folder.id)
                                setFolderOpen(false)
                              }}
                            >
                              <Folder className="size-3.5 text-muted-foreground" />
                              {folder.name}
                              {folderId === folder.id && (
                                <Check className="ml-auto size-3.5" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Separator />

            {/* Read-only metadata */}
            <div className="space-y-2.5">
              <MetadataRow
                icon={<Tag className="size-3.5" />}
                label="Type"
                value={mediaTypeDisplay[item.type]}
              />
              <MetadataRow
                icon={<FileType className="size-3.5" />}
                label="Format"
                value={
                  <Badge
                    variant="secondary"
                    className={cn("text-[10px] px-1.5 py-0", formatConfig.color)}
                  >
                    {formatConfig.label}
                  </Badge>
                }
              />
              {extension !== "-" && (
                <MetadataRow
                  icon={<FileType className="size-3.5" />}
                  label="Extension"
                  value={`.${extension.toLowerCase()}`}
                />
              )}
              <MetadataRow
                icon={<HardDrive className="size-3.5" />}
                label="Size"
                value={item.size}
              />
              <MetadataRow
                icon={<Calendar className="size-3.5" />}
                label="Date Added"
                value={formatDate(item.dateAdded)}
              />
              {isVideo && item.videoUrl && (
                <MetadataRow
                  icon={<ExternalLink className="size-3.5" />}
                  label="Source"
                  value={
                    <a
                      href={item.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 truncate block max-w-[200px]"
                    >
                      {item.videoUrl}
                    </a>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <DialogFooter className="mx-0 mb-0 rounded-b-xl px-5 py-4 sm:justify-between">
        <div className="flex gap-2">
          {isImage && item.url && (
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="size-3.5 mr-1.5" />
              Download
            </Button>
          )}
          {isVideo && item.videoUrl && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={item.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5 mr-1.5" />
                Visit Original
              </a>
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || !name.trim()}>
            Save Changes
          </Button>
        </div>
      </DialogFooter>
    </div>
  )
}

function MetadataRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  )
}
