"use client"

import { useEffect, useCallback, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
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
import { Input } from "@/components/ui/input"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
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
} from "lucide-react"

interface RichTextEditorProps {
  content: string
  onContentChange: (json: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
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
    <div className={cn("rounded-lg border bg-background", className)}>
      <TooltipProvider delayDuration={300}>
        <EditorToolbar editor={editor} />
      </TooltipProvider>
      <Separator />
      <EditorContent
        editor={editor}
        className="tiptap-wrapper"
        style={{ minHeight }}
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

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [linkUrl, setLinkUrl] = useState("")
  const [linkOpen, setLinkOpen] = useState(false)

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

  const addImage = useCallback(() => {
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

      {/* Headings */}
      <ToolbarTooltip label="Heading 1" shortcut="⌘⌥1">
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip label="Heading 2" shortcut="⌘⌥2">
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="size-4" />
        </Toggle>
      </ToolbarTooltip>
      <ToolbarTooltip label="Heading 3" shortcut="⌘⌥3">
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="size-4" />
        </Toggle>
      </ToolbarTooltip>

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

      {/* Image */}
      <ToolbarTooltip label="Insert Image">
        <Button variant="ghost" size="icon-sm" onClick={addImage}>
          <ImageIcon className="size-4" />
        </Button>
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
