"use client"

import { useCallback, useRef, useState } from "react"
import { NodeViewWrapper } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Upload, FileImage, Loader2 } from "lucide-react"
import { uploadImageToStaging } from "@/lib/upload-media"
import type { StagingImageEntry } from "@/lib/upload-media"

/**
 * React NodeView for the imageUpload TipTap node.
 * Renders a dotted dropzone that accepts click-to-upload and drag-and-drop.
 * After file selection, uploads to R2 and replaces itself with a standard
 * Image node pointing to the R2 public URL.
 */
export function ImageUploadNodeView({ editor, getPos, deleteNode }: NodeViewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Image exceeds 10 MB limit")
        return
      }

      setIsUploading(true)
      setError(null)

      try {
        const result = await uploadImageToStaging(file)
        const pos = getPos()
        if (pos == null) return

        // Notify parent about new staging image via editor storage callback
        const storage = editor.storage as unknown as Record<string, Record<string, unknown>>
        const onStaging = storage.imagePasteHandler?.onStagingImageCreated as
          | ((entry: StagingImageEntry) => void)
          | undefined
        onStaging?.({
          stagingUrl: result.stagingUrl,
          filename: result.filename,
          mimeType: result.mimeType,
          fileSize: result.fileSize,
          width: result.width,
          height: result.height,
        })

        // Delete the upload node and insert an image in its place
        // Use the staging URL — it's publicly accessible via R2.
        // Promotion to permanent happens when the parent form saves.
        editor
          .chain()
          .focus()
          .deleteRange({ from: pos, to: pos + 1 })
          .setImage({ src: result.stagingUrl })
          .run()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed")
        setIsUploading(false)
      }
    },
    [editor, getPos]
  )

  const handleClick = useCallback(() => {
    if (!isUploading) inputRef.current?.click()
  }, [isUploading])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault()
        deleteNode()
      }
    },
    [deleteNode]
  )

  return (
    <NodeViewWrapper data-type="image-upload">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
          px-6 py-10 transition-colors select-none
          ${isUploading ? "cursor-wait border-blue-300 bg-blue-50/50" : "cursor-pointer"}
          ${!isUploading && isDragging ? "border-blue-500 bg-blue-50" : ""}
          ${!isUploading && !isDragging ? "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100" : ""}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-600">Uploading image…</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <FileImage className="size-10 text-gray-400" />
                <div className="absolute -bottom-1 -right-1 rounded-full bg-blue-500 p-1">
                  <Upload className="size-3 text-white" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-700">
                <span className="font-medium text-blue-600 underline underline-offset-2">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WebP · Max 10 MB</p>
            </div>
          </>
        )}
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
    </NodeViewWrapper>
  )
}
