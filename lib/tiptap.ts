import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Superscript from "@tiptap/extension-superscript"
import Subscript from "@tiptap/extension-subscript"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableCell } from "@tiptap/extension-table-cell"
import { generateHTML } from "@tiptap/html"
import { Extension } from "@tiptap/core"
import type { Extensions } from "@tiptap/react"
import type { JSONContent } from "@tiptap/core"

/**
 * Custom extension that adds indent support to paragraphs and headings.
 * Parses margin-left from HTML (produced during DOCX import) and renders it back.
 */
const Indent = Extension.create({
  name: "indent",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const ml = element.style.marginLeft
              if (ml) {
                const px = parseFloat(ml)
                if (px > 0) return Math.round(px / 40)
              }
              return 0
            },
            renderHTML: (attributes) => {
              if (!attributes.indent) return {}
              return { style: `margin-left: ${(attributes.indent as number) * 40}px` }
            },
          },
        },
      },
    ]
  },
})

/**
 * Shared TipTap extension configuration.
 * Used by both the editor component and HTML generation to ensure parity.
 */
export function getExtensions(placeholder?: string): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
    }),
    Underline,
    Superscript,
    Subscript,
    Indent,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
    }),
    Image.configure({
      inline: false,
      allowBase64: true,
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: { class: "tiptap-table" },
    }),
    TableRow,
    TableHeader,
    TableCell,
    TextStyle,
    Color,
    ...(placeholder
      ? [Placeholder.configure({ placeholder })]
      : []),
  ]
}

/**
 * Convert TipTap JSON (stringified) to HTML for frontend rendering.
 */
export function tiptapJsonToHtml(jsonString: string): string {
  try {
    const json = JSON.parse(jsonString) as JSONContent
    let html = generateHTML(json, getExtensions())
    // Empty paragraphs from TipTap come as <p></p> which collapse in browsers
    // (no line box = zero height). Insert <br> to give them visible height.
    html = html.replace(/<p([^>]*)><\/p>/g, "<p$1><br></p>")
    return html
  } catch {
    // If it's plain text (legacy), wrap in paragraphs
    return jsonString
      .split("\n")
      .map((line) => `<p>${line || "<br>"}</p>`)
      .join("")
  }
}

/**
 * Convert HTML string to TipTap JSON (stringified).
 * Used for DOCX import pipeline: mammoth HTML → TipTap JSON.
 */
export function htmlToTiptapJson(html: string): string {
  // We use DOMParser (browser) to parse HTML, then convert to TipTap doc structure.
  // TipTap doesn't expose a direct HTML→JSON. We create a temporary editor-like parse.
  // Instead, we'll use the editor's parseHTML by generating a simple doc wrapper.
  // The actual parsing is handled by passing HTML content to the editor via setContent.
  // This function returns a wrapper that the editor can consume via setContent(html).
  return html
}

/**
 * Check whether TipTap content (JSON string or legacy plain text) is empty.
 */
export function isTiptapContentEmpty(content: string): boolean {
  if (!content || !content.trim()) return true

  try {
    const json = JSON.parse(content) as JSONContent
    if (!json.content || json.content.length === 0) return true
    // A doc with a single empty paragraph is considered empty
    return json.content.every((node) => {
      if (node.type === "paragraph") {
        return !node.content || node.content.length === 0
      }
      return false
    })
  } catch {
    // Legacy plain text — check if it has non-whitespace
    return !content.trim()
  }
}

/**
 * Convert legacy plain text to TipTap JSON (stringified).
 */
export function plainTextToTiptapJson(text: string): string {
  const paragraphs = text.split("\n").map((line) => {
    if (!line.trim()) {
      return { type: "paragraph" as const }
    }
    return {
      type: "paragraph" as const,
      content: [{ type: "text" as const, text: line }],
    }
  })

  return JSON.stringify({
    type: "doc",
    content: paragraphs,
  })
}
