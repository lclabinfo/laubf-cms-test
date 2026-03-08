"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Upload, ImageIcon, Search, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const ACCEPTED_TYPES_STRING = ACCEPTED_TYPES.join(",")
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

interface MediaPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string, alt?: string) => void
  /** Auto-create and filter to this folder (e.g. "Events") */
  folder?: string
}

type UploadStatus = "idle" | "uploading" | "done" | "error"

interface LibraryItem {
  id: string
  url: string
  filename: string
  alt?: string | null
}

function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  folder,
}: MediaPickerDialogProps) {
  const [tab, setTab] = useState<string>("upload")
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [uploadError, setUploadError] = useState<string>("")
  const [uploadedUrl, setUploadedUrl] = useState<string>("")
  const [uploadedFilename, setUploadedFilename] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Library state
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Selection state (shared across tabs)
  const [selectedUrl, setSelectedUrl] = useState<string>("")
  const [selectedAlt, setSelectedAlt] = useState<string>("")

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setTab("upload")
      setUploadStatus("idle")
      setUploadError("")
      setUploadedUrl("")
      setUploadedFilename("")
      setSelectedUrl("")
      setSelectedAlt("")
      setSearchQuery("")
      setIsDragging(false)
    }
  }, [open])

  // Fetch library items when Library tab is shown
  useEffect(() => {
    if (tab === "library" && open) {
      fetchLibrary()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, open])

  async function fetchLibrary() {
    setLibraryLoading(true)
    try {
      let url = "/api/v1/media?type=image"
      if (folder) {
        url += `&folder=${encodeURIComponent(folder)}`
      }
      const res = await fetch(url)
      const json = await res.json()
      if (json.success && json.data?.items) {
        setLibraryItems(
          json.data.items.map((item: Record<string, unknown>) => ({
            id: item.id as string,
            url: item.url as string,
            filename: item.filename as string,
            alt: (item.alt as string | null) ?? null,
          }))
        )
      }
    } catch {
      // Silently fail — grid will be empty
    } finally {
      setLibraryLoading(false)
    }
  }

  const ensureFolder = useCallback(async () => {
    if (!folder) return
    try {
      await fetch("/api/v1/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folder }),
      })
    } catch {
      // Fire-and-forget, 409 is fine
    }
  }, [folder])

  async function uploadFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadStatus("error")
      setUploadError("File type not accepted. Use JPEG, PNG, WebP, or GIF.")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadStatus("error")
      setUploadError("File exceeds 10 MB limit.")
      return
    }

    setUploadStatus("uploading")
    setUploadError("")

    // Ensure folder exists (fire-and-forget)
    ensureFolder()

    try {
      // 1. Get presigned URL
      const urlRes = await fetch("/api/v1/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
          context: "media",
        }),
      })

      const urlJson = await urlRes.json()
      if (!urlJson.success) {
        const msg =
          urlRes.status === 413
            ? "Storage quota exceeded"
            : urlJson.error?.message ?? "Failed to get upload URL"
        setUploadStatus("error")
        setUploadError(msg)
        return
      }

      const { uploadUrl, publicUrl } = urlJson.data

      // 2. PUT to R2
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })

      if (!putRes.ok) {
        setUploadStatus("error")
        setUploadError("Upload to storage failed")
        return
      }

      // 3. Get image dimensions
      const dims = await getImageDimensions(file)

      // 4. Create media record
      const createRes = await fetch("/api/v1/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          url: publicUrl,
          mimeType: file.type,
          fileSize: file.size,
          width: dims.width || undefined,
          height: dims.height || undefined,
          folder: folder ?? "/",
        }),
      })

      const createJson = await createRes.json()
      if (!createJson.success) {
        setUploadStatus("error")
        setUploadError(createJson.error?.message ?? "Failed to create media record")
        return
      }

      // Use the permanent URL from the created media record (not the staging publicUrl)
      const permanentUrl = createJson.data.url ?? publicUrl
      setUploadStatus("done")
      setUploadedUrl(permanentUrl)
      setUploadedFilename(file.name)
      // Auto-select the uploaded image
      setSelectedUrl(permanentUrl)
      setSelectedAlt(file.name)
    } catch {
      setUploadStatus("error")
      setUploadError("Network error")
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  function handleSelectLibraryItem(item: LibraryItem) {
    setSelectedUrl(item.url)
    setSelectedAlt(item.alt ?? item.filename)
  }

  function handleUseImage() {
    if (selectedUrl) {
      onSelect(selectedUrl, selectedAlt || undefined)
      onOpenChange(false)
    }
  }

  // Filter library items by search query
  const filteredItems = searchQuery
    ? libraryItems.filter((item) =>
        item.filename.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : libraryItems

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Image</DialogTitle>
          <DialogDescription>
            Upload a new image or choose from your media library.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="upload">
              <Upload className="size-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="library">
              <ImageIcon className="size-4" />
              Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES_STRING}
              onChange={handleFileChange}
              className="hidden"
              disabled={uploadStatus === "uploading"}
            />

            {uploadStatus === "idle" && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex w-full flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "hover:border-foreground/30"
                }`}
              >
                <Upload className="size-10 text-muted-foreground/50 mb-3" />
                <span className="text-sm font-medium">
                  Drag and drop an image here, or click to browse
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, WebP, or GIF (max 10 MB)
                </span>
              </button>
            )}

            {uploadStatus === "uploading" && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                <Loader2 className="size-10 text-muted-foreground animate-spin mb-3" />
                <span className="text-sm font-medium">Uploading...</span>
              </div>
            )}

            {uploadStatus === "done" && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center gap-3">
                <div className="relative size-32 rounded-lg overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedUrl}
                    alt={uploadedFilename}
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Check className="size-8 text-white" />
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">
                  Upload complete
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-xs">
                  {uploadedFilename}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUploadStatus("idle")
                    setUploadedUrl("")
                    setUploadedFilename("")
                    setSelectedUrl("")
                    setSelectedAlt("")
                    if (inputRef.current) inputRef.current.value = ""
                  }}
                >
                  Upload another
                </Button>
              </div>
            )}

            {uploadStatus === "error" && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/50 py-16 text-center">
                <span className="text-sm font-medium text-destructive mb-1">
                  Upload failed
                </span>
                <span className="text-xs text-muted-foreground mb-4">
                  {uploadError}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadStatus("idle")
                    setUploadError("")
                    if (inputRef.current) inputRef.current.value = ""
                  }}
                >
                  Try again
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="library">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="max-h-[360px] overflow-y-auto rounded-lg border p-2">
                {libraryLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ImageIcon className="size-10 text-muted-foreground/30 mb-2" />
                    <span className="text-sm text-muted-foreground">
                      {searchQuery
                        ? "No images match your search"
                        : "No images in library"}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectLibraryItem(item)}
                        className={`group relative flex flex-col items-center rounded-md overflow-hidden transition-all ${
                          selectedUrl === item.url
                            ? "ring-2 ring-primary ring-offset-1"
                            : "hover:ring-1 hover:ring-muted-foreground/30"
                        }`}
                      >
                        <div className="aspect-square w-full overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={item.alt ?? item.filename}
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        {selectedUrl === item.url && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Check className="size-5 text-white" />
                          </div>
                        )}
                        <span className="w-full truncate px-1 py-0.5 text-[10px] text-muted-foreground text-center">
                          {item.filename}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selectedUrl}
            onClick={handleUseImage}
          >
            Use Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
