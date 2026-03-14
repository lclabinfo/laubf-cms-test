"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Download,
  ExternalLink,
  Globe,
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
  Trash2,
  AlertCircle,
  Mic,
  BookOpen,
  Church,
  Settings,
  User,
  Users,
  Building2,
  FileImage,
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
} from "@/components/ui/dialog"
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
import type { MediaItem, MediaFolder } from "@/lib/media-data"
import { formatDisplay, mediaTypeDisplay } from "@/lib/media-data"

interface MediaPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MediaItem | null
  folders: MediaFolder[]
  onUpdate: (id: string, updates: Partial<Pick<MediaItem, "name" | "altText" | "folderId">>) => void
  onDelete?: (id: string) => void
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
  onDelete,
}: MediaPreviewDialogProps) {
  if (!item) return null

  return (
    <MediaPreviewDialogInner
      key={item.id}
      open={open}
      onOpenChange={onOpenChange}
      item={item}
      folders={folders}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  )
}

function MediaPreviewDialogInner({
  open,
  onOpenChange,
  item,
  folders,
  onUpdate,
  onDelete,
}: MediaPreviewDialogProps & { item: MediaItem }) {
  const [name, setName] = useState(item.name)
  const [altText, setAltText] = useState(item.altText ?? "")
  const [folderId, setFolderId] = useState<string | null>(item.folderId)
  const [discardOpen, setDiscardOpen] = useState(false)

  const hasChanges =
    name !== item.name ||
    altText !== (item.altText ?? "") ||
    folderId !== item.folderId

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && hasChanges) {
      setDiscardOpen(true)
      return
    }
    onOpenChange(newOpen)
  }, [hasChanges, onOpenChange])

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden p-0">
          <PreviewContent
            item={item}
            folders={folders}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onClose={() => handleOpenChange(false)}
            name={name}
            setName={setName}
            altText={altText}
            setAltText={setAltText}
            folderId={folderId}
            setFolderId={setFolderId}
            hasChanges={hasChanges}
          />
        </DialogContent>
      </Dialog>

      {/* Unsaved changes confirmation */}
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <AlertCircle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to this media item. Are you sure you want to close? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setDiscardOpen(false)
                onOpenChange(false)
              }}
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface UsageEntry {
  type: string
  id: string
  title: string
  url: string
  detail?: string
  // Legacy fields (kept for backwards compatibility)
  slug?: string
  pageId?: string
  sectionLabel?: string | null
  sectionType?: string
}

function PreviewContent({
  item,
  folders,
  onUpdate,
  onDelete,
  onClose,
  name,
  setName,
  altText,
  setAltText,
  folderId,
  setFolderId,
  hasChanges,
}: {
  item: MediaItem
  folders: MediaFolder[]
  onUpdate: MediaPreviewDialogProps["onUpdate"]
  onDelete?: (id: string) => void
  onClose: () => void
  name: string
  setName: (v: string) => void
  altText: string
  setAltText: (v: string) => void
  folderId: string | null
  setFolderId: (v: string | null) => void
  hasChanges: boolean
}) {
  const [folderOpen, setFolderOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [usages, setUsages] = useState<UsageEntry[]>([])
  const [usagesLoading, setUsagesLoading] = useState(false)
  const [usagesModalOpen, setUsagesModalOpen] = useState(false)

  // Fetch usage tracking (events that reference this image URL)
  useEffect(() => {
    if (!item.url) return
    setUsagesLoading(true)
    fetch(`/api/v1/media/${item.id}/usage`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setUsages(json.data)
        }
      })
      .catch(() => {})
      .finally(() => setUsagesLoading(false))
  }, [item.id, item.url])

  const isImage = item.type === "image"
  const isVideo = item.type === "video"
  const formatConfig = formatDisplay[item.format]
  const embedUrl = isVideo && item.videoUrl ? getVideoEmbedUrl(item.videoUrl) : null
  const extension = getFileExtension(item.name)

  const folderName = useMemo(() => {
    if (!folderId) return "None"
    return folders.find((f) => f.id === folderId)?.name ?? "None"
  }, [folderId, folders])

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/v1/media/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: name,
          alt: altText || null,
          folder: folderId || '/',
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || 'Failed to save')
      onUpdate(item.id, { name, altText: altText || undefined, folderId })
      onClose()
    } catch (err) {
      console.error('Failed to save media:', err)
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
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
    <>
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
                  <div className="aspect-video relative bg-black rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                      src={item.url}
                      className="size-full object-contain"
                      controls
                      preload="metadata"
                    />
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
                      variant={formatConfig.variant}
                      className="text-[10px] px-1.5 py-0"
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

              {/* Used in */}
              <Separator />
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Used in{usages.length > 0 ? ` (${usages.length})` : ""}
                  </span>
                  {usages.length >= 3 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => setUsagesModalOpen(true)}
                    >
                      View all
                    </Button>
                  )}
                </div>
                {usagesLoading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : usages.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Not used anywhere</p>
                ) : (
                  <div className="relative rounded-md border bg-muted/30">
                    <div className="max-h-[140px] overflow-y-auto p-1.5 space-y-1">
                      {usages.map((u) => (
                        <UsageItem key={u.id} usage={u} />
                      ))}
                    </div>
                    {usages.length >= 3 && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b-md bg-gradient-to-t from-muted/60 to-transparent" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-5 py-4">
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
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  onDelete(item.id)
                  onClose()
                }}
              >
                <Trash2 className="size-3.5 mr-1.5" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saveError && (
              <p className="text-sm text-destructive mr-2">{saveError}</p>
            )}
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || !name.trim() || saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* View All Usages modal */}
      <Dialog open={usagesModalOpen} onOpenChange={setUsagesModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Used in ({usages.length})</DialogTitle>
            <DialogDescription>
              All places where this media is referenced.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-1">
            {usages.map((u) => (
              <UsageItem key={u.id} usage={u} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

const usageTypeConfig: Record<string, { icon: React.ElementType; label: string }> = {
  event: { icon: Calendar, label: "Event" },
  series: { icon: BookOpen, label: "Series" },
  message: { icon: Mic, label: "Message" },
  church: { icon: Church, label: "Church" },
  "site-settings": { icon: Settings, label: "Site Settings" },
  "page-section": { icon: Globe, label: "Website" },
  page: { icon: FileImage, label: "Page" },
  speaker: { icon: User, label: "Speaker" },
  person: { icon: Users, label: "Person" },
  ministry: { icon: Building2, label: "Ministry" },
  campus: { icon: Building2, label: "Campus" },
}

function UsageItem({ usage: u }: { usage: UsageEntry }) {
  const config = usageTypeConfig[u.type] ?? { icon: FileImage, label: u.type }
  const Icon = config.icon
  // Use the url field from the API (new format), fall back to legacy link construction
  const href = u.url
    || (u.type === "event" ? `/cms/events/${u.id}` : "")
    || (u.type === "page-section" && u.pageId ? `/cms/website/builder/${u.pageId}` : "")

  const isWebsite = u.type === "page-section" || u.type === "page"

  return (
    <Link
      href={href || "#"}
      className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm hover:bg-accent transition-colors group"
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isWebsite && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight font-normal shrink-0">Website</Badge>
          )}
          <span className="font-medium truncate leading-tight">{u.title}</span>
        </div>
        <span className="text-[10px] text-muted-foreground leading-tight">
          {u.detail || config.label}
        </span>
      </div>
      <ExternalLink className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
    </Link>
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
