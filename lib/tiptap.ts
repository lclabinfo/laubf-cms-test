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
import FontFamily from "@tiptap/extension-font-family"
import Highlight from "@tiptap/extension-highlight"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableCell } from "@tiptap/extension-table-cell"
import { generateHTML } from "@tiptap/html"
import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
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
              const styles = [`margin-left: ${(attributes.indent as number) * 40}px`]
              // Hanging indent: pull first line back so numbers align with left edge
              if (attributes.hangingIndent) {
                styles.push(`text-indent: -${(attributes.indent as number) * 40}px`)
              }
              return { style: styles.join("; ") }
            },
          },
          hangingIndent: {
            default: false,
            parseHTML: (element) => {
              // Detect hanging indent: negative text-indent with positive margin-left
              const ti = element.style.textIndent
              if (ti) {
                const px = parseFloat(ti)
                if (px < 0) return true
              }
              return false
            },
            renderHTML: () => {
              // Rendering handled by indent attribute above
              return {}
            },
          },
        },
      },
    ]
  },
})

/**
 * Custom extension: per-paragraph line-height and paragraph spacing (before/after).
 * Similar to Google Docs' "Line & paragraph spacing" controls.
 *
 * lineHeight: CSS line-height value (e.g. "1", "1.15", "1.5", "2"). Default uses editor CSS.
 * spacingBefore: margin-top in rem (e.g. "0", "0.5", "1"). Null = editor default.
 * spacingAfter: margin-bottom in rem (e.g. "0", "0.5", "1"). Null = editor default.
 *
 * Parses from inline styles for DOCX import round-trip.
 */
const LineSpacing = Extension.create({
  name: "lineSpacing",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => {
              const lh = element.style.lineHeight
              if (!lh) return null
              const val = parseFloat(lh)
              if (isNaN(val)) return null
              // Round to 2 decimal places for clean storage
              return String(Math.round(val * 100) / 100)
            },
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {}
              return { style: `line-height: ${attributes.lineHeight}` }
            },
          },
          spacingBefore: {
            default: null,
            parseHTML: (element) => {
              const mt = element.style.marginTop
              if (!mt) return null
              const val = parseFloat(mt)
              if (isNaN(val)) return null
              // "0" is valid — used by DOCX import to override CSS > * + * gap
              if (val === 0) return "0"
              // Convert px to rem (assume 16px base)
              if (mt.endsWith("px")) return String(Math.round((val / 16) * 100) / 100)
              if (mt.endsWith("rem")) return String(val)
              if (mt.endsWith("pt")) return String(Math.round((val / 12) * 100) / 100)
              return null
            },
            renderHTML: (attributes) => {
              if (attributes.spacingBefore == null) return {}
              return { style: `margin-top: ${attributes.spacingBefore}rem` }
            },
          },
          spacingAfter: {
            default: null,
            parseHTML: (element) => {
              const mb = element.style.marginBottom
              if (!mb) return null
              const val = parseFloat(mb)
              if (isNaN(val)) return null
              if (val === 0) return "0"
              if (mb.endsWith("px")) return String(Math.round((val / 16) * 100) / 100)
              if (mb.endsWith("rem")) return String(val)
              if (mb.endsWith("pt")) return String(Math.round((val / 12) * 100) / 100)
              return null
            },
            renderHTML: (attributes) => {
              if (attributes.spacingAfter == null) return {}
              return { style: `margin-bottom: ${attributes.spacingAfter}rem` }
            },
          },
        },
      },
    ]
  },
})

/**
 * ProseMirror plugin that automatically continues ordered list numbering
 * across non-list content (paragraphs, headings, etc.).
 *
 * When the document contains consecutive ordered lists separated by other
 * block content, this plugin sets the `start` attribute on each subsequent
 * list so numbering continues from where the previous list left off.
 *
 * Example: ol(3 items) → p("V5-14") → ol(start=4, 3 items) → p("V15") → ol(start=7)
 */
const listContinuationPluginKey = new PluginKey("listContinuation")

const ListContinuation = Extension.create({
  name: "listContinuation",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: listContinuationPluginKey,
        appendTransaction(_transactions, _oldState, newState) {
          const { doc, tr } = newState
          let modified = false

          // Track the running count for consecutive ordered list sequences.
          // A "sequence" is a series of orderedList nodes that may be
          // separated by non-list block content (paragraphs, headings, etc.)
          // but NOT by bulletLists or other list types.
          //
          // We reset when we encounter a bulletList — that breaks the
          // ordered list continuation context.
          let runningCount = 0
          let inSequence = false

          doc.forEach((node, offset) => {
            if (node.type.name === "orderedList") {
              if (inSequence && runningCount > 0) {
                const expectedStart = runningCount + 1
                if (node.attrs.start !== expectedStart) {
                  tr.setNodeMarkup(offset, undefined, {
                    ...node.attrs,
                    start: expectedStart,
                  })
                  modified = true
                }
                runningCount += node.childCount
              } else {
                // First ordered list in a new sequence
                inSequence = true
                // Respect existing start attr for the first list
                runningCount = (node.attrs.start || 1) - 1 + node.childCount
              }
            } else if (node.type.name === "bulletList") {
              // Bullet list breaks the ordered list continuation
              inSequence = false
              runningCount = 0
            }
            // Other block types (paragraph, heading, blockquote, etc.)
            // do NOT break the sequence — they're the "gaps" between
            // ordered lists that we want to bridge.
          })

          return modified ? tr : null
        },
      }),
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
    FontFamily,
    Color,
    Highlight.configure({ multicolor: true }),
    LineSpacing,
    ListContinuation,
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
 * Ensure content is HTML, converting from TipTap JSON if needed.
 * Safe to call on content that may be TipTap JSON, raw HTML, or plain text.
 * Used by public website pages that render via dangerouslySetInnerHTML.
 */
export function contentToHtml(content: string | null | undefined): string {
  if (!content) return ""
  const trimmed = content.trim()
  if (!trimmed) return ""
  // TipTap JSON starts with { — convert to HTML
  if (trimmed.startsWith("{")) return tiptapJsonToHtml(content)
  // Already HTML or plain text — return as-is
  return content
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
 * Post-process TipTap JSON to fix ordered list continuation.
 *
 * When importing HTML, each `<ol>` becomes a separate `orderedList` node
 * with `start: 1`. This function walks the top-level content and sets the
 * `start` attribute on subsequent ordered lists so numbering continues
 * from the previous list.
 *
 * This mirrors the logic of the `ListContinuation` ProseMirror plugin
 * but works on static JSON (for import pipelines, seed data, etc.).
 */
export function fixOrderedListContinuation(json: JSONContent): JSONContent {
  if (!json.content) return json

  const fixedContent = [...json.content]
  let runningCount = 0
  let inSequence = false

  for (let i = 0; i < fixedContent.length; i++) {
    const node = fixedContent[i]
    if (node.type === "orderedList") {
      const itemCount = node.content?.length ?? 0
      if (inSequence && runningCount > 0) {
        const expectedStart = runningCount + 1
        fixedContent[i] = {
          ...node,
          attrs: { ...(node.attrs || {}), start: expectedStart },
        }
        runningCount += itemCount
      } else {
        inSequence = true
        const start = node.attrs?.start ?? 1
        runningCount = start - 1 + itemCount
      }
    } else if (node.type === "bulletList") {
      inSequence = false
      runningCount = 0
    }
    // Other node types (paragraph, heading, etc.) don't break the sequence
  }

  return { ...json, content: fixedContent }
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
