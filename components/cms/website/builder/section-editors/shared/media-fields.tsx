"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { ImageIcon, X, Plus, Video, GripVertical } from "lucide-react"
import { MediaPickerDialog } from "@/components/cms/media/media-picker-dialog"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

// --- Helpers ---

/** Extract a human-readable filename from a URL */
function filenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url, "https://x").pathname
    const name = pathname.split("/").pop() || url
    // Strip UUID prefix pattern (e.g. "a1b2c3d4-...-filename.jpg" → "filename.jpg")
    return name.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "")
  } catch {
    return url.split("/").pop() || url
  }
}

// --- ImagePickerField ---

export interface ImagePickerFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
}

export function ImagePickerField({
  label,
  value,
  onChange,
}: ImagePickerFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {value ? (
        <div className="relative group rounded-md border overflow-hidden h-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                onClick={() => setPickerOpen(true)}
              >
                Replace
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                onClick={() => onChange("")}
              >
                <X className="size-3" />
              </Button>
            </div>
            <span className="text-[10px] text-white/80 truncate max-w-[90%] px-1">
              {filenameFromUrl(value)}
            </span>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground font-normal"
          onClick={() => setPickerOpen(true)}
        >
          <ImageIcon className="size-3.5" />
          Choose image...
        </Button>
      )}
      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder="Website"
        onSelect={(url) => onChange(url)}
      />
    </div>
  )
}

// --- ImageListField ---

export interface ImageListFieldProps {
  label: string
  images: Array<{ src: string; alt: string }>
  onChange: (images: Array<{ src: string; alt: string }>) => void
  maxImages?: number
}

/** Sortable wrapper for a single image row */
function SortableImageRow({
  id,
  img,
  onRemove,
}: {
  id: string
  img: { src: string; alt: string }
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group flex items-center gap-2 rounded-md border overflow-hidden",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary/30",
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 pl-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="size-4" />
      </div>

      {/* Thumbnail */}
      <div className="h-16 w-20 flex-shrink-0 rounded overflow-hidden bg-muted">
        {/\.(mp4|webm|mov|ogg)(\?|$)/i.test(img.src) ? (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <Video className="size-5" />
          </div>
        ) : img.src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={img.src}
            alt={img.alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <ImageIcon className="size-5" />
          </div>
        )}
      </div>

      {/* Alt text (truncated) */}
      <span className="flex-1 truncate text-xs text-muted-foreground px-1">
        {img.alt || "No alt text"}
      </span>

      {/* Remove button */}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-6 w-6 mr-1 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}

export function ImageListField({
  label,
  images,
  onChange,
  maxImages = 10,
}: ImageListFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const handleAdd = useCallback(
    (url: string, alt?: string) => {
      if (images.length >= maxImages) return
      onChange([...images, { src: url, alt: alt ?? "" }])
    },
    [images, maxImages, onChange],
  )

  const handleRemove = useCallback(
    (index: number) => {
      onChange(images.filter((_, i) => i !== index))
    },
    [images, onChange],
  )

  // Generate stable IDs for each image based on src + index
  const imageIds = images.map((img, i) => `${img.src}-${i}`)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = imageIds.indexOf(active.id as string)
      const newIndex = imageIds.indexOf(over.id as string)
      onChange(arrayMove(images, oldIndex, newIndex))
    }
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>

      {images.length === 0 ? (
        /* Empty state */
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 py-6 text-sm text-muted-foreground hover:border-muted-foreground/40 transition-colors"
        >
          <Plus className="size-4" />
          Add Image
        </button>
      ) : (
        <div className="space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={imageIds}
              strategy={verticalListSortingStrategy}
            >
              {images.map((img, index) => (
                <SortableImageRow
                  key={imageIds[index]}
                  id={imageIds[index]}
                  img={img}
                  onRemove={() => handleRemove(index)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Add more button */}
          {images.length < maxImages && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="size-3" />
              Add Image
            </Button>
          )}
        </div>
      )}

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder="Website"
        onSelect={(url, alt) => handleAdd(url, alt)}
      />
    </div>
  )
}

// --- VideoPickerField ---

export interface VideoPickerFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  description?: string
  posterImage?: string
  onPosterChange?: (url: string) => void
}

export function VideoPickerField({
  label,
  value,
  onChange,
  description,
  posterImage,
  onPosterChange,
}: VideoPickerFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [posterPickerOpen, setPosterPickerOpen] = useState(false)

  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {description && (
          <p className="text-[11px] text-muted-foreground/70 mt-0.5 text-balance">{description}</p>
        )}
      </div>

      {value ? (
        <div className="space-y-2">
          {/* Video preview */}
          <div className="relative group rounded-md border overflow-hidden">
            <video
              src={value}
              poster={posterImage || undefined}
              muted
              preload="metadata"
              className="h-32 w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  onClick={() => setPickerOpen(true)}
                >
                  Replace
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  onClick={() => onChange("")}
                >
                  <X className="size-3" />
                </Button>
              </div>
              <span className="text-[10px] text-white/80 truncate max-w-[90%] px-1">
                {filenameFromUrl(value)}
              </span>
            </div>
          </div>

          {/* Poster image picker */}
          {onPosterChange && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Poster / Fallback Image
              </Label>
              <p className="text-[11px] text-muted-foreground/70">
                Displays while loading or on playback failure
              </p>
              {posterImage ? (
                <div className="relative group rounded-md border overflow-hidden h-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={posterImage}
                    alt=""
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 text-xs"
                        onClick={() => setPosterPickerOpen(true)}
                      >
                        Replace
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 text-xs"
                        onClick={() => onPosterChange("")}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                    <span className="text-[10px] text-white/80 truncate max-w-[90%] px-1">
                      {filenameFromUrl(posterImage)}
                    </span>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground font-normal text-xs"
                  onClick={() => setPosterPickerOpen(true)}
                >
                  <ImageIcon className="size-3" />
                  Choose poster image...
                </Button>
              )}
              <MediaPickerDialog
                open={posterPickerOpen}
                onOpenChange={setPosterPickerOpen}
                folder="Website"
                onSelect={(url) => onPosterChange(url)}
              />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 py-6 text-sm text-muted-foreground hover:border-muted-foreground/40 transition-colors"
        >
          <Video className="size-4" />
          Add Video
        </button>
      )}

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder="Website"
        mediaType="video"
        onSelect={(url) => onChange(url)}
      />
    </div>
  )
}

// --- LinkInput ---

interface PageSummary {
  id: string
  slug: string
  title: string
  pageType: string
  isHomepage: boolean
  isPublished: boolean
  sortOrder: number
  parentId: string | null
}

/** Cached pages promise — fetched once per session on first `/` keystroke */
let pagesCache: Promise<PageSummary[]> | null = null

function fetchPages(): Promise<PageSummary[]> {
  if (!pagesCache) {
    pagesCache = fetch("/api/v1/pages")
      .then((res) => res.json())
      .then((json) => {
        const pages = (json.data ?? []) as PageSummary[]
        return pages.filter((p) => p.isPublished)
      })
      .catch(() => {
        pagesCache = null
        return [] as PageSummary[]
      })
  }
  return pagesCache
}

export interface LinkInputProps {
  label?: string
  value: string
  onChange: (url: string) => void
  placeholder?: string
  labelSize?: "sm" | "xs"
}

export function LinkInput({
  label,
  value,
  onChange,
  placeholder = "/page or https://...",
  labelSize = "xs",
}: LinkInputProps) {
  const [pages, setPages] = useState<PageSummary[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const isExternal = value.startsWith("http://") || value.startsWith("https://")

  // Filter pages based on current input (match slug or title)
  const filtered = pages.filter((p) => {
    if (!value.startsWith("/")) return false
    const query = value.slice(1).toLowerCase()
    const slug = p.isHomepage ? "" : p.slug
    return (
      slug.toLowerCase().includes(query) ||
      p.title.toLowerCase().includes(query)
    )
  })

  // Show dropdown when typing `/` and not an external URL
  const shouldShowDropdown = showDropdown && !isExternal && value.startsWith("/") && filtered.length > 0

  // Fetch pages on first `/` keystroke
  function handleChange(newValue: string) {
    onChange(newValue)
    if (newValue.startsWith("/") && !isExternal) {
      fetchPages().then((result) => {
        setPages(result)
        setShowDropdown(true)
        setActiveIndex(0)
      })
    } else {
      setShowDropdown(false)
    }
  }

  function selectPage(page: PageSummary) {
    const slug = page.isHomepage ? "/" : `/${page.slug}`
    onChange(slug)
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!shouldShowDropdown) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % filtered.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      selectPage(filtered[activeIndex])
    } else if (e.key === "Escape") {
      e.preventDefault()
      setShowDropdown(false)
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (shouldShowDropdown && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" })
      }
    }
  }, [activeIndex, shouldShowDropdown])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const input = (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (value.startsWith("/") && !isExternal && pages.length > 0) {
            setShowDropdown(true)
            setActiveIndex(0)
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />

      {shouldShowDropdown && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover rounded-md shadow-md border ring-1 ring-foreground/10 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-100">
          <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b">
            Pages
          </div>
          <div ref={listRef} className="max-h-56 overflow-y-auto">
            {filtered.map((page, index) => {
              const isActive = index === activeIndex
              const displaySlug = page.isHomepage ? "/" : `/${page.slug}`
              return (
                <button
                  key={page.id}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectPage(page)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-popover-foreground hover:bg-accent"
                  )}
                  type="button"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{page.title}</span>
                    <span className="text-[11px] text-muted-foreground">{displaySlug}</span>
                  </div>
                  <kbd
                    className={cn(
                      "text-[10px] border rounded px-1.5 py-0.5 bg-background transition-opacity",
                      isActive
                        ? "text-muted-foreground opacity-100"
                        : "opacity-0"
                    )}
                  >
                    Enter
                  </kbd>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  if (!label) return input

  return (
    <div className="space-y-1.5">
      <Label
        className={
          labelSize === "sm"
            ? "text-sm font-medium"
            : "text-xs text-muted-foreground"
        }
      >
        {label}
      </Label>
      {input}
    </div>
  )
}

// --- ButtonConfig ---

export interface ButtonConfigProps {
  id: string
  label: string
  buttonData: { label: string; href: string; visible: boolean; openInNewTab?: boolean }
  onChange: (data: { label: string; href: string; visible: boolean; openInNewTab?: boolean }) => void
}

export function ButtonConfig({
  id,
  label,
  buttonData,
  onChange,
}: ButtonConfigProps) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Switch
          id={`${id}-visible`}
          checked={buttonData.visible}
          onCheckedChange={(v) => onChange({ ...buttonData, visible: v })}
        />
      </div>
      {buttonData.visible && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Button Text
            </Label>
            <Input
              value={buttonData.label}
              onChange={(e) =>
                onChange({ ...buttonData, label: e.target.value })
              }
              placeholder="Learn More"
            />
          </div>
          <LinkInput
            label="Link URL"
            value={buttonData.href}
            onChange={(url) =>
              onChange({ ...buttonData, href: url })
            }
            placeholder="/about or https://..."
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${id}-new-tab`}
              checked={buttonData.openInNewTab ?? false}
              onCheckedChange={(checked) =>
                onChange({ ...buttonData, openInNewTab: checked === true })
              }
            />
            <Label
              htmlFor={`${id}-new-tab`}
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Open in new tab
            </Label>
          </div>
        </div>
      )}
    </div>
  )
}
