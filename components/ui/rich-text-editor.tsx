"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { useEditor, useEditorState, EditorContent } from "@tiptap/react"
import { getExtensions, plainTextToTiptapJson } from "@/lib/tiptap"
import { ImageUpload, registerImageUploadComponent } from "@/lib/tiptap-image-upload"
import { ImageUploadNodeView } from "@/components/ui/image-upload-node"

// Register the React component for the ImageUpload extension
registerImageUploadComponent(ImageUploadNodeView)
import { cn } from "@/lib/utils"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input" // used by link popover
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Baseline,
  Highlighter,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Unlink,
  ImageIcon,
  Quote,
  Code,
  Minus,
  Undo,
  Redo,
  Table,
  Plus,
  Trash2,
  Rows3,
  Columns3,
  ToggleLeft,
  Type,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Maximize2,
  Minimize2,
  Indent,
  Outdent,
} from "lucide-react"

/** Custom icon: horizontal lines with vertical double-arrow (line/paragraph spacing) */
function LineSpacingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {/* Three horizontal lines */}
      <line x1="6" y1="3" x2="14" y2="3" />
      <line x1="6" y1="8" x2="14" y2="8" />
      <line x1="6" y1="13" x2="14" y2="13" />
      {/* Vertical double-headed arrow */}
      <line x1="3" y1="4" x2="3" y2="12" />
      <polyline points="1.5,6 3,4 4.5,6" />
      <polyline points="1.5,10 3,12 4.5,10" />
    </svg>
  )
}

interface RichTextEditorProps {
  content: string
  onContentChange: (json: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
  maxHeight?: string
}

function parseContent(content: string): object | string {
  if (!content) return { type: "doc", content: [{ type: "paragraph" }] }
  try {
    return JSON.parse(content)
  } catch {
    // Legacy plain text — convert to TipTap doc
    return JSON.parse(plainTextToTiptapJson(content))
  }
}

export function RichTextEditor({
  content,
  onContentChange,
  placeholder = "Start writing...",
  className,
  minHeight = "300px",
  maxHeight = "70vh",
}: RichTextEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Track when content was just set by the editor's own onUpdate callback.
  // This prevents a sync loop: onUpdate → parent state change → sync effect
  // sees a difference (due to appendTransaction normalization) → setContent →
  // appendTransaction → onUpdate → infinite cycle.
  const skipSyncRef = useRef(false)

  const editor = useEditor({
    extensions: [...getExtensions(placeholder), ImageUpload],
    content: parseContent(content),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      skipSyncRef.current = true
      onContentChange(JSON.stringify(editor.getJSON()))
    },
  })

  // Sync external content changes (e.g. DOCX import)
  useEffect(() => {
    if (!editor) return
    // Skip if the content change originated from the editor itself (onUpdate).
    // Only sync external changes (e.g. DOCX import replacing the content).
    if (skipSyncRef.current) {
      skipSyncRef.current = false
      return
    }
    const currentJson = JSON.stringify(editor.getJSON())
    if (content !== currentJson) {
      try {
        const parsed = JSON.parse(content)
        // Only update if it's valid JSON and actually different
        if (JSON.stringify(parsed) !== JSON.stringify(editor.getJSON())) {
          editor.commands.setContent(parsed, { emitUpdate: false })
        }
      } catch {
        // If content is HTML (from DOCX import), set it as HTML
        if (content.includes("<") && content.includes(">")) {
          editor.commands.setContent(content, { emitUpdate: false })
        }
      }
    }
  }, [content, editor])

  // Close fullscreen on Escape key
  useEffect(() => {
    if (!isFullscreen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsFullscreen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen])

  if (!editor) return null

  if (isFullscreen) {
    return (
      <>
        {/* Placeholder to preserve layout space while fullscreen */}
        <div className={cn("rounded-lg border bg-muted/30", className)} style={{ minHeight }} />
        {/* Fullscreen overlay */}
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setIsFullscreen(false)} />
        <div className="fixed inset-4 z-50 flex flex-col rounded-lg border bg-background shadow-2xl overflow-hidden">
          <TooltipProvider delayDuration={300}>
            <EditorToolbar editor={editor} isFullscreen={isFullscreen} onToggleFullscreen={() => setIsFullscreen(false)} />
          </TooltipProvider>
          <Separator />
          <EditorContent
            editor={editor}
            className="tiptap-wrapper flex-1 overflow-y-auto"
          />
        </div>
      </>
    )
  }

  return (
    <div
      className={cn("flex flex-col rounded-lg border bg-background overflow-hidden", className)}
      style={{ minHeight, maxHeight }}
    >
      <TooltipProvider delayDuration={300}>
        <EditorToolbar editor={editor} isFullscreen={isFullscreen} onToggleFullscreen={() => setIsFullscreen(true)} />
      </TooltipProvider>
      <Separator />
      <EditorContent
        editor={editor}
        className="tiptap-wrapper flex-1 overflow-y-auto"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

function ToolbarTooltip({
  label,
  shortcut,
  children,
}: {
  label: string
  shortcut?: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-1.5">
        <span>{label}</span>
        {shortcut && (
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

function TableSizePicker({
  onSelect,
}: {
  onSelect: (rows: number, cols: number) => void
}) {
  const [hoverRow, setHoverRow] = useState(0)
  const [hoverCol, setHoverCol] = useState(0)
  const maxRows = 6
  const maxCols = 6

  return (
    <div className="p-2">
      <p className="text-xs text-muted-foreground mb-1.5">
        {hoverRow > 0 && hoverCol > 0
          ? `${hoverRow} × ${hoverCol}`
          : "Select size"}
      </p>
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}
        onMouseLeave={() => {
          setHoverRow(0)
          setHoverCol(0)
        }}
      >
        {Array.from({ length: maxRows * maxCols }, (_, i) => {
          const row = Math.floor(i / maxCols) + 1
          const col = (i % maxCols) + 1
          const isHighlighted = row <= hoverRow && col <= hoverCol
          return (
            <button
              key={i}
              type="button"
              className={cn(
                "size-5 rounded-sm border",
                isHighlighted
                  ? "border-primary bg-primary/20"
                  : "border-border bg-background hover:border-muted-foreground"
              )}
              onMouseEnter={() => {
                setHoverRow(row)
                setHoverCol(col)
              }}
              onClick={() => onSelect(row, col)}
            />
          )
        })}
      </div>
    </div>
  )
}

// Color swatch grid used by both text color and highlight popovers
const TEXT_COLORS = [
  "#000000", "#374151", "#6b7280", "#9ca3af",
  "#dc2626", "#ea580c", "#d97706", "#ca8a04",
  "#16a34a", "#0891b2", "#2563eb", "#4f46e5",
  "#7c3aed", "#db2777", "#9333ea", "#e11d48",
]

const HIGHLIGHT_COLORS = [
  "#fef08a", "#fde68a", "#bbf7d0", "#bfdbfe",
  "#e9d5ff", "#fecdd3", "#fed7aa", "#99f6e4",
  "#fca5a5", "#a5b4fc", "#f9a8d4", "#d9f99d",
]

function ColorSwatchGrid({
  colors,
  activeColor,
  onSelect,
  onReset,
  resetLabel = "Reset",
  columns = 4,
}: {
  colors: string[]
  activeColor: string | undefined
  onSelect: (color: string) => void
  onReset: () => void
  resetLabel?: string
  columns?: number
}) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              "size-7 rounded-md border transition-all hover:scale-110",
              activeColor === color
                ? "border-foreground ring-1 ring-foreground/20"
                : "border-border"
            )}
            style={{ backgroundColor: color }}
            onClick={() => onSelect(color)}
          />
        ))}
      </div>
      <button
        type="button"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
        onClick={onReset}
      >
        <span className="size-4 rounded border border-border bg-background" />
        {resetLabel}
      </button>
    </div>
  )
}

// Block type items for the heading dropdown
const BLOCK_TYPES = [
  { label: "Paragraph", icon: Pilcrow, action: "paragraph" as const },
  { label: "Heading 1", icon: Heading1, action: "heading" as const, level: 1 as const },
  { label: "Heading 2", icon: Heading2, action: "heading" as const, level: 2 as const },
  { label: "Heading 3", icon: Heading3, action: "heading" as const, level: 3 as const },
  { label: "Heading 4", icon: Heading4, action: "heading" as const, level: 4 as const },
]

function EditorToolbar({ editor, isFullscreen, onToggleFullscreen }: { editor: ReturnType<typeof useEditor>; isFullscreen?: boolean; onToggleFullscreen?: () => void }) {
  // Subscribe to editor state changes so toolbar active states update on selection change
  useEditorState({
    editor,
    selector: ({ editor: e }) => e?.state.selection,
  })
  const [linkUrl, setLinkUrl] = useState("")
  const [linkOpen, setLinkOpen] = useState(false)
  const [tableOpen, setTableOpen] = useState(false)

  const setLink = useCallback(() => {
    if (!editor || !linkUrl) return
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    setLinkUrl("")
    setLinkOpen(false)
  }, [editor, linkUrl])

  const removeLink = useCallback(() => {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
  }, [editor])

  if (!editor) return null

  // Determine current block type label + icon for the dropdown trigger
  const currentBlock = BLOCK_TYPES.find((bt) =>
    bt.action === "heading"
      ? editor.isActive("heading", { level: bt.level })
      : editor.isActive("paragraph")
  ) ?? BLOCK_TYPES[0]
  const CurrentBlockIcon = currentBlock.icon

  return (
    <div className="flex flex-wrap items-center gap-y-1 gap-x-0.5 p-1.5">
      {/* ── 1. History ── */}
      <div className="flex items-center gap-0.5 shrink-0">
        <ToolbarTooltip label="Undo" shortcut="⌘Z">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="size-4" />
          </Button>
        </ToolbarTooltip>
        <ToolbarTooltip label="Redo" shortcut="⌘⇧Z">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="size-4" />
          </Button>
        </ToolbarTooltip>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* ── 2. Text style ── */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Select
          value={
            editor.isActive("textStyle", { fontFamily: /serif/i })
              ? "serif"
              : "sans"
          }
          onValueChange={(value) => {
            if (value === "serif") {
              editor
                .chain()
                .focus()
                .setFontFamily('"Times New Roman", Georgia, serif')
                .run()
            } else {
              editor.chain().focus().unsetFontFamily().run()
            }
          }}
        >
          <ToolbarTooltip label="Font Family">
            <SelectTrigger className="h-7 w-[82px] text-xs gap-1 px-2 border-0 bg-transparent hover:bg-muted focus:ring-0 focus:ring-offset-0">
              <Type className="size-3.5 shrink-0 opacity-60" />
              <SelectValue />
            </SelectTrigger>
          </ToolbarTooltip>
          <SelectContent>
            <SelectItem value="sans">Sans</SelectItem>
            <SelectItem value="serif">Serif</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <ToolbarTooltip label="Block Type">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2">
                <CurrentBlockIcon className="size-4" />
                <span className="max-w-[60px] truncate">{currentBlock.label}</span>
                <ChevronDown className="size-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
          </ToolbarTooltip>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            {BLOCK_TYPES.map((bt) => {
              const Icon = bt.icon
              const isActive =
                bt.action === "heading"
                  ? editor.isActive("heading", { level: bt.level })
                  : editor.isActive("paragraph")
              return (
                <DropdownMenuItem
                  key={bt.label}
                  className={cn("gap-2", isActive && "bg-accent")}
                  onClick={() => {
                    if (bt.action === "heading") {
                      editor.chain().focus().toggleHeading({ level: bt.level! }).run()
                    } else {
                      editor.chain().focus().setParagraph().run()
                    }
                  }}
                >
                  <Icon className="size-4 opacity-60" />
                  {bt.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* ── 3. Inline formatting ── */}
      <div className="flex items-center gap-0.5 shrink-0">
        <ToolbarTooltip label="Bold" shortcut="⌘B">
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" />
          </Toggle>
        </ToolbarTooltip>
        <ToolbarTooltip label="Italic" shortcut="⌘I">
          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" />
          </Toggle>
        </ToolbarTooltip>
        <ToolbarTooltip label="Underline" shortcut="⌘U">
          <Toggle
            size="sm"
            pressed={editor.isActive("underline")}
            onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          >
            <Underline className="size-4" />
          </Toggle>
        </ToolbarTooltip>
        <ToolbarTooltip label="Strikethrough" shortcut="⌘⇧S">
          <Toggle
            size="sm"
            pressed={editor.isActive("strike")}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="size-4" />
          </Toggle>
        </ToolbarTooltip>

        <Popover>
          <ToolbarTooltip label="Text Color">
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="relative">
                <Baseline className="size-4" />
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full"
                  style={{ backgroundColor: editor.getAttributes("textStyle").color || "currentColor" }}
                />
              </Button>
            </PopoverTrigger>
          </ToolbarTooltip>
          <PopoverContent className="w-auto p-0" align="start">
            <ColorSwatchGrid
              colors={TEXT_COLORS}
              activeColor={editor.getAttributes("textStyle").color}
              onSelect={(color) => editor.chain().focus().setColor(color).run()}
              onReset={() => editor.chain().focus().unsetColor().run()}
              resetLabel="Default"
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <ToolbarTooltip label="Highlight">
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="relative">
                <Highlighter className="size-4" />
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full"
                  style={{ backgroundColor: editor.getAttributes("highlight").color || "transparent" }}
                />
              </Button>
            </PopoverTrigger>
          </ToolbarTooltip>
          <PopoverContent className="w-auto p-0" align="start">
            <ColorSwatchGrid
              colors={HIGHLIGHT_COLORS}
              activeColor={editor.getAttributes("highlight").color}
              onSelect={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
              onReset={() => editor.chain().focus().unsetHighlight().run()}
              resetLabel="No highlight"
            />
          </PopoverContent>
        </Popover>

        <Popover open={linkOpen} onOpenChange={setLinkOpen}>
          <ToolbarTooltip label="Insert Link" shortcut="⌘K">
            <PopoverTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("link")}
                onPressedChange={() => {
                  if (editor.isActive("link")) {
                    removeLink()
                  } else {
                    setLinkUrl(
                      editor.getAttributes("link").href ?? ""
                    )
                    setLinkOpen(true)
                  }
                }}
              >
                <Link className="size-4" />
              </Toggle>
            </PopoverTrigger>
          </ToolbarTooltip>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="flex items-center gap-2">
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    setLink()
                  }
                }}
              />
              <Button size="sm" onClick={setLink}>
                Apply
              </Button>
            </div>
            {editor.isActive("link") && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-destructive"
                onClick={() => {
                  removeLink()
                  setLinkOpen(false)
                }}
              >
                <Unlink className="size-3.5 mr-1" />
                Remove link
              </Button>
            )}
          </PopoverContent>
        </Popover>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* ── 4. Alignment + Spacing ── */}
      <div className="flex items-center gap-0.5 shrink-0">
        <ToolbarTooltip label="Align Left" shortcut="⌘⇧L">
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "left" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("left").run()
            }
          >
            <AlignLeft className="size-4" />
          </Toggle>
        </ToolbarTooltip>
        <ToolbarTooltip label="Align Center" shortcut="⌘⇧E">
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "center" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("center").run()
            }
          >
            <AlignCenter className="size-4" />
          </Toggle>
        </ToolbarTooltip>
        <ToolbarTooltip label="Align Right" shortcut="⌘⇧R">
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "right" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("right").run()
            }
          >
            <AlignRight className="size-4" />
          </Toggle>
        </ToolbarTooltip>
        <ToolbarTooltip label="Justify" shortcut="⌘⇧J">
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "justify" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("justify").run()
            }
          >
            <AlignJustify className="size-4" />
          </Toggle>
        </ToolbarTooltip>
        <LineSpacingPopover editor={editor} />
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* ── 5. Lists + Blockquote ── */}
      <div className="flex items-center gap-0.5 shrink-0">
        <ToolbarTooltip label="Bullet List" shortcut="⌘⇧8">
          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
          >
            <List className="size-4" />
          </Toggle>
        </ToolbarTooltip>
        <ToolbarTooltip label="Ordered List" shortcut="⌘⇧7">
          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
          >
            <ListOrdered className="size-4" />
          </Toggle>
        </ToolbarTooltip>
        <ToolbarTooltip label="Indent (Nest)" shortcut="Tab">
          <Toggle
            size="sm"
            pressed={false}
            disabled={!editor.isActive("listItem")}
            onPressedChange={() =>
              editor.chain().focus().sinkListItem("listItem").run()
            }
          >
            <Indent className="size-4" />
          </Toggle>
        </ToolbarTooltip>
        <ToolbarTooltip label="Outdent (Lift)" shortcut="⇧Tab">
          <Toggle
            size="sm"
            pressed={false}
            disabled={!editor.isActive("listItem")}
            onPressedChange={() =>
              editor.chain().focus().liftListItem("listItem").run()
            }
          >
            <Outdent className="size-4" />
          </Toggle>
        </ToolbarTooltip>
        <ToolbarTooltip label="Blockquote" shortcut="⌘⇧B">
          <Toggle
            size="sm"
            pressed={editor.isActive("blockquote")}
            onPressedChange={() =>
              editor.chain().focus().toggleBlockquote().run()
            }
          >
            <Quote className="size-4" />
          </Toggle>
        </ToolbarTooltip>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* ── 6. Insert: Image, Table, HR ── */}
      <div className="flex items-center gap-0.5 shrink-0">
        <ToolbarTooltip label="Insert Image">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ;(editor as any).chain().focus().setImageUpload().run()
            }}
          >
            <ImageIcon className="size-4" />
          </Button>
        </ToolbarTooltip>

        <Popover open={tableOpen} onOpenChange={setTableOpen}>
          <ToolbarTooltip label="Insert Table">
            <PopoverTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("table")}
                onPressedChange={() => setTableOpen(true)}
              >
                <Table className="size-4" />
              </Toggle>
            </PopoverTrigger>
          </ToolbarTooltip>
          <PopoverContent className="w-auto p-0" align="start">
            <TableSizePicker
              onSelect={(rows, cols) => {
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows, cols, withHeaderRow: true })
                  .run()
                setTableOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>

        <ToolbarTooltip label="Horizontal Rule">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="size-4" />
          </Button>
        </ToolbarTooltip>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* ── 7. Source HTML ── */}
      <div className="flex items-center shrink-0">
        <SourceHtmlButton editor={editor} />
      </div>

      {/* ── 8. Fullscreen toggle (pushed to right edge) ── */}
      {onToggleFullscreen && (
        <div className="flex items-center shrink-0 ml-auto">
          <ToolbarTooltip label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} shortcut="Esc">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
          </ToolbarTooltip>
        </div>
      )}

      {/* ── Table editing controls (shown only when inside a table) ── */}
      {editor.isActive("table") && (
        <div className="flex items-center gap-0.5 shrink-0 basis-full pt-1 border-t mt-1">
          <ToolbarTooltip label="Add Row Above">
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().addRowBefore().run()}>
              <div className="relative"><Rows3 className="size-4" /><Plus className="size-2 absolute -top-0.5 -right-0.5" /></div>
            </Button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Add Row Below">
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().addRowAfter().run()}>
              <div className="relative"><Rows3 className="size-4" /><Plus className="size-2 absolute -bottom-0.5 -right-0.5" /></div>
            </Button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Add Column Before">
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().addColumnBefore().run()}>
              <div className="relative"><Columns3 className="size-4" /><Plus className="size-2 absolute -top-0.5 -left-0.5" /></div>
            </Button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Add Column After">
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <div className="relative"><Columns3 className="size-4" /><Plus className="size-2 absolute -top-0.5 -right-0.5" /></div>
            </Button>
          </ToolbarTooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <ToolbarTooltip label="Delete Row">
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().deleteRow().run()}>
              <div className="relative"><Rows3 className="size-4" /><Trash2 className="size-2 absolute -bottom-0.5 -right-0.5 text-destructive" /></div>
            </Button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Delete Column">
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().deleteColumn().run()}>
              <div className="relative"><Columns3 className="size-4" /><Trash2 className="size-2 absolute -bottom-0.5 -right-0.5 text-destructive" /></div>
            </Button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Toggle Header Row">
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
              <ToggleLeft className="size-4" />
            </Button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Delete Table">
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().deleteTable().run()}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </ToolbarTooltip>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Source HTML Editor
// ---------------------------------------------------------------------------

function SourceHtmlButton({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const [open, setOpen] = useState(false)
  const [html, setHtml] = useState("")
  function handleOpen() {
    // Pretty-print the HTML for readability
    const raw = editor.getHTML()
    setHtml(formatHtml(raw))
    setOpen(true)
  }

  function handleApply() {
    editor.commands.setContent(html, { emitUpdate: true })
    setOpen(false)
  }

  return (
    <>
      <ToolbarTooltip label="Edit Source HTML">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleOpen}
        >
          <Code className="size-4" />
        </Button>
      </ToolbarTooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Source HTML</DialogTitle>
            <DialogDescription>
              View and edit the raw HTML. Changes will be applied to the editor when you click Apply.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              spellCheck={false}
              className="w-full h-[60vh] resize-none rounded-md border bg-muted/50 p-3 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Naive HTML formatter — adds newlines and indentation for readability */
function formatHtml(html: string): string {
  // Insert newlines before opening block-level tags and after closing ones
  const blockTags = /(<\/?(?:div|p|h[1-6]|ul|ol|li|blockquote|table|thead|tbody|tr|th|td|hr|br|pre|figure|figcaption|img)[^>]*>)/gi
  let formatted = html.replace(blockTags, "\n$1")

  // Clean up multiple blank lines
  formatted = formatted.replace(/\n{3,}/g, "\n\n")

  // Simple indentation
  const lines = formatted.split("\n")
  let indent = 0
  const result: string[] = []
  const openTag = /^<(?!\/|br|hr|img)[a-z][^>]*>$/i
  const closeTag = /^<\/[a-z][^>]*>$/i

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    if (closeTag.test(line)) indent = Math.max(0, indent - 1)
    result.push("  ".repeat(indent) + line)
    if (openTag.test(line) && !line.includes("</")) indent++
  }

  return result.join("\n").trim()
}

// ---------------------------------------------------------------------------
// Line & Paragraph Spacing Popover (Google Docs style)
// ---------------------------------------------------------------------------

const LINE_HEIGHT_OPTIONS = [
  { label: "Single", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.35", value: "1.35" },
  { label: "1.5", value: "1.5" },
  { label: "Double", value: "2" },
]

const PARAGRAPH_SPACING_OPTIONS = [
  { label: "None", value: "0" },
  { label: "Small", value: "0.5" },
  { label: "Medium", value: "1" },
  { label: "Large", value: "1.5" },
]

function LineSpacingPopover({
  editor,
}: {
  editor: ReturnType<typeof useEditor>
}) {
  const [customLineHeight, setCustomLineHeight] = useState("")

  if (!editor) return null

  // Read current node's attributes
  const { $from } = editor.state.selection
  const node = $from.parent
  const currentLineHeight = (node.attrs.lineHeight as string) || null
  const currentSpacingBefore = (node.attrs.spacingBefore as string) || null
  const currentSpacingAfter = (node.attrs.spacingAfter as string) || null

  // Derive displayed custom input value from current state
  const displayLineHeight = customLineHeight || currentLineHeight || "1.5"

  function setNodeSpacing(attr: string, value: string | null) {
    const { $from } = editor!.state.selection
    const depth = Math.max(1, $from.depth)
    const pos = $from.before(depth)
    const resolved = editor!.state.doc.resolve(pos)
    const node = resolved.nodeAfter ?? $from.parent
    editor!.view.dispatch(
      editor!.state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        [attr]: value,
      })
    )
  }

  return (
    <Popover>
      <ToolbarTooltip label="Line & Paragraph Spacing">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <LineSpacingIcon className="size-4" />
          </Button>
        </PopoverTrigger>
      </ToolbarTooltip>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 space-y-3">
          {/* Line height */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Line height</p>
            <div className="grid grid-cols-5 gap-1">
              {LINE_HEIGHT_OPTIONS.map((opt) => {
                const isActive = !customLineHeight && (
                  currentLineHeight === opt.value ||
                  (!currentLineHeight && opt.value === "1.5") // 1.5 ≈ editor default 1.6
                )
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      "rounded-md px-2 py-1 text-xs transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                    onClick={() => {
                      setCustomLineHeight("")
                      setNodeSpacing("lineHeight", opt.value === "1.5" ? null : opt.value)
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <label className="text-xs text-muted-foreground shrink-0">Custom</label>
              <Input
                type="number"
                step={0.05}
                min={0.5}
                max={4}
                value={displayLineHeight}
                onChange={(e) => {
                  const val = e.target.value
                  setCustomLineHeight(val)
                  const num = parseFloat(val)
                  if (!isNaN(num) && num >= 0.5 && num <= 4) {
                    setNodeSpacing("lineHeight", val === "1.5" ? null : val)
                  }
                }}
                className="h-7 text-xs w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <Separator />

          {/* Space before paragraph */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Space before</p>
            <div className="grid grid-cols-4 gap-1">
              {PARAGRAPH_SPACING_OPTIONS.map((opt) => {
                const isActive = currentSpacingBefore === opt.value ||
                  (!currentSpacingBefore && opt.value === "0")
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      "rounded-md px-2 py-1 text-xs transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                    onClick={() => setNodeSpacing("spacingBefore", opt.value === "0" ? null : opt.value)}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Space after paragraph */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Space after</p>
            <div className="grid grid-cols-4 gap-1">
              {PARAGRAPH_SPACING_OPTIONS.map((opt) => {
                const isActive = currentSpacingAfter === opt.value ||
                  (!currentSpacingAfter && opt.value === "0")
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      "rounded-md px-2 py-1 text-xs transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                    onClick={() => setNodeSpacing("spacingAfter", opt.value === "0" ? null : opt.value)}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
