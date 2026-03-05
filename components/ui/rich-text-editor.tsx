"use client"

import { useEffect, useCallback, useState } from "react"
import { useEditor, useEditorState, EditorContent } from "@tiptap/react"
import { getExtensions, plainTextToTiptapJson } from "@/lib/tiptap"
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
  WrapText,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
} from "lucide-react"

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
  const editor = useEditor({
    extensions: getExtensions(placeholder),
    content: parseContent(content),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onContentChange(JSON.stringify(editor.getJSON()))
    },
  })

  // Sync external content changes (e.g. DOCX import)
  useEffect(() => {
    if (!editor) return
    const currentJson = JSON.stringify(editor.getJSON())
    if (content !== currentJson) {
      try {
        const parsed = JSON.parse(content)
        // Only update if it's valid JSON and actually different
        if (JSON.stringify(parsed) !== JSON.stringify(editor.getJSON())) {
          editor.commands.setContent(parsed)
        }
      } catch {
        // If content is HTML (from DOCX import), set it as HTML
        if (content.includes("<") && content.includes(">")) {
          editor.commands.setContent(content)
        }
      }
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div
      className={cn("flex flex-col rounded-lg border bg-background overflow-hidden", className)}
      style={{ minHeight, maxHeight }}
    >
      <TooltipProvider delayDuration={300}>
        <EditorToolbar editor={editor} />
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

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
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

  const addImageFromFile = useCallback(() => {
    if (!editor) return
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        editor
          .chain()
          .focus()
          .setImage({ src: reader.result as string })
          .run()
      }
      reader.readAsDataURL(file)
    }
    input.click()
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
    <div className="flex flex-wrap items-center gap-0.5 p-1.5">
      {/* Undo / Redo */}
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

      {/* Block type dropdown */}
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

      {/* Inline formatting */}
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

      {/* Text color */}
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

      {/* Highlight */}
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

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment */}
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

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Font family */}
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

      {/* Spacing (line-height) — applies to all paragraphs/headings in the doc */}
      <Select
        value={(() => {
          // Read from first paragraph/heading in doc to determine current setting
          let found: string | null = null
          editor.state.doc.descendants((node) => {
            if (found !== null) return false
            if (node.type.name === "paragraph" || node.type.name === "heading") {
              found = (node.attrs.spacing as string) || "normal"
              return false
            }
          })
          return found || "normal"
        })()}
        onValueChange={(value) => {
          const spacing = value === "normal" ? null : value
          // Apply to every paragraph and heading in the document
          const { tr } = editor.state
          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === "paragraph" || node.type.name === "heading") {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, spacing })
            }
          })
          editor.view.dispatch(tr)
        }}
      >
        <ToolbarTooltip label="Spacing">
          <SelectTrigger className="h-7 w-[6.5rem] text-xs gap-1 px-2 border-0 bg-transparent hover:bg-muted focus:ring-0 focus:ring-offset-0">
            <WrapText className="size-3.5 shrink-0 opacity-60" />
            <SelectValue />
          </SelectTrigger>
        </ToolbarTooltip>
        <SelectContent>
          <SelectItem value="tight">Tight</SelectItem>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="relaxed">Relaxed</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
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

      {/* Blockquote */}
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

      {/* Code block */}
      <ToolbarTooltip label="Code Block" shortcut="⌘⌥C">
        <Toggle
          size="sm"
          pressed={editor.isActive("codeBlock")}
          onPressedChange={() =>
            editor.chain().focus().toggleCodeBlock().run()
          }
        >
          <Code className="size-4" />
        </Toggle>
      </ToolbarTooltip>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Link */}
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

      {/* Image — direct file upload on click */}
      <ToolbarTooltip label="Insert Image">
        <Button variant="ghost" size="icon-sm" onClick={addImageFromFile}>
          <ImageIcon className="size-4" />
        </Button>
      </ToolbarTooltip>

      {/* Table */}
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

      {editor.isActive("table") && (
        <>
          <ToolbarTooltip label="Add Row Above">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                editor.chain().focus().addRowBefore().run()
              }
            >
              <div className="relative">
                <Rows3 className="size-4" />
                <Plus className="size-2 absolute -top-0.5 -right-0.5" />
              </div>
            </Button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Add Row Below">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                editor.chain().focus().addRowAfter().run()
              }
            >
              <div className="relative">
                <Rows3 className="size-4" />
                <Plus className="size-2 absolute -bottom-0.5 -right-0.5" />
              </div>
            </Button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Add Column Before">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                editor.chain().focus().addColumnBefore().run()
              }
            >
              <div className="relative">
                <Columns3 className="size-4" />
                <Plus className="size-2 absolute -top-0.5 -left-0.5" />
              </div>
            </Button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Add Column After">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                editor.chain().focus().addColumnAfter().run()
              }
            >
              <div className="relative">
                <Columns3 className="size-4" />
                <Plus className="size-2 absolute -top-0.5 -right-0.5" />
              </div>
            </Button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Delete Row">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                editor.chain().focus().deleteRow().run()
              }
            >
              <div className="relative">
                <Rows3 className="size-4" />
                <Trash2 className="size-2 absolute -bottom-0.5 -right-0.5 text-destructive" />
              </div>
            </Button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Delete Column">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                editor.chain().focus().deleteColumn().run()
              }
            >
              <div className="relative">
                <Columns3 className="size-4" />
                <Trash2 className="size-2 absolute -bottom-0.5 -right-0.5 text-destructive" />
              </div>
            </Button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Toggle Header Row">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                editor.chain().focus().toggleHeaderRow().run()
              }
            >
              <ToggleLeft className="size-4" />
            </Button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Delete Table">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                editor.chain().focus().deleteTable().run()
              }
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </ToolbarTooltip>
        </>
      )}

      {/* Horizontal rule */}
      <ToolbarTooltip label="Horizontal Rule">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-4" />
        </Button>
      </ToolbarTooltip>
    </div>
  )
}
