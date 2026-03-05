"use client"

import { useCallback, useRef, useState } from "react"
import { NodeViewWrapper } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Upload, FileImage } from "lucide-react"

/**
 * React NodeView for the imageUpload TipTap node.
 * Renders a dotted dropzone that accepts click-to-upload and drag-and-drop.
 * After file selection, replaces itself with a standard Image node.
 */
export function ImageUploadNodeView({ editor, getPos, deleteNode }: NodeViewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return
      const reader = new FileReader()
      reader.onload = () => {
        const pos = getPos()
        if (pos == null) return
        // Delete the upload node and insert an image in its place
        editor
          .chain()
          .focus()
          .deleteRange({ from: pos, to: pos + 1 })
          .setImage({ src: reader.result as string })
          .run()
      }
      reader.readAsDataURL(file)
    },
    [editor, getPos]
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

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
          px-6 py-10 cursor-pointer transition-colors select-none
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"}
        `}
      >
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
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WebP</p>
        </div>
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
