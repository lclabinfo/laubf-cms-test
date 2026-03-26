/**
 * Server-only TipTap utilities for HTML generation.
 *
 * This module provides the same `contentToHtml` and `tiptapJsonToHtml` functions
 * as `lib/tiptap.ts` but is intended for use in server components and pages
 * (e.g., `app/website/` routes). By importing from here instead of `lib/tiptap`,
 * server bundles avoid pulling in the full TipTap editor runtime (ProseMirror
 * plugins, input rules, commands, Placeholder extension, etc.), saving ~15-30 MB.
 *
 * Uses `@tiptap/html` (generateHTML) with a minimal extension set that includes
 * all node/mark types and attributes needed for faithful HTML rendering but none
 * of the editor-only ProseMirror plugins or interactive behaviors.
 */

import { generateHTML } from "@tiptap/html"
import type { JSONContent, Extensions } from "@tiptap/core"
import { Extension, mergeAttributes, Node } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Superscript from "@tiptap/extension-superscript"
import Subscript from "@tiptap/extension-subscript"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import FontFamily from "@tiptap/extension-font-family"
import Highlight from "@tiptap/extension-highlight"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableCell } from "@tiptap/extension-table-cell"
import OrderedList from "@tiptap/extension-ordered-list"
import BulletList from "@tiptap/extension-bullet-list"
import Youtube from "@tiptap/extension-youtube"

/* ── Lightweight attribute-only extensions (mirrors lib/tiptap.ts) ── */

/** Indent support: parses margin-left from HTML and renders it back. */
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
              const indentPx = (attributes.indent as number) * 40
              const styles = [`margin-left: ${indentPx}px`]
              if (attributes.hangingIndent) {
                styles.push(`text-indent: -${indentPx}px`)
                styles.push("white-space: pre-wrap")
                styles.push(`tab-size: ${indentPx}px`)
              }
              return { style: styles.join("; ") }
            },
          },
          hangingIndent: {
            default: false,
            parseHTML: (element) => {
              const ti = element.style.textIndent
              if (ti) {
                const px = parseFloat(ti)
                if (px < 0) return true
              }
              return false
            },
            renderHTML: () => ({}),
          },
        },
      },
    ]
  },
})

/** Line-height and paragraph spacing (before/after). */
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
              if (val === 0) return "0"
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

/** fontFamily attribute for list nodes (parses from HTML style). */
const listFontFamilyAttribute = {
  default: null,
  parseHTML: (element: HTMLElement) => element.style.fontFamily || null,
  renderHTML: (attributes: Record<string, unknown>) => {
    if (!attributes.fontFamily) return {}
    return { style: `font-family: ${attributes.fontFamily}` }
  },
}

/** Extract Vimeo video ID from URL */
function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match?.[1] ?? null
}

/** Convert a Vimeo URL to its embed URL */
function getVimeoEmbedUrl(url: string): string {
  const id = getVimeoId(url)
  if (id) return `https://player.vimeo.com/video/${id}`
  return url
}

/** Vimeo embed node (render-only, no commands). */
const VimeoEmbed = Node.create({
  name: "vimeo",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: 640 },
      height: { default: 360 },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-vimeo-video] iframe", getAttrs: (el: HTMLElement) => ({ src: el.getAttribute("src") }) }]
  },

  renderHTML({ HTMLAttributes }) {
    const embedUrl = getVimeoEmbedUrl(HTMLAttributes.src as string)
    return [
      "div",
      { "data-vimeo-video": "", class: "video-embed" },
      [
        "iframe",
        mergeAttributes({
          src: embedUrl,
          width: HTMLAttributes.width,
          height: HTMLAttributes.height,
          frameborder: "0",
          allow: "autoplay; fullscreen; picture-in-picture",
          allowfullscreen: "true",
        }),
      ],
    ]
  },
})

/* ── Parse-only extension set (no ProseMirror plugins, no commands) ── */

const ParseOrderedList = OrderedList.extend({
  addAttributes() {
    return { ...this.parent?.(), fontFamily: listFontFamilyAttribute }
  },
})

const ParseBulletList = BulletList.extend({
  addAttributes() {
    return { ...this.parent?.(), fontFamily: listFontFamilyAttribute }
  },
})

function getServerParseExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      orderedList: false,
      bulletList: false,
      link: false,
      underline: false,
    }),
    ParseOrderedList,
    ParseBulletList,
    Underline,
    Superscript,
    Subscript,
    Indent,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
    }),
    Image.configure({ inline: false, allowBase64: false }),
    Youtube.configure({
      controls: true,
      nocookie: true,
      HTMLAttributes: { class: "video-embed" },
    }),
    VimeoEmbed,
    Table.configure({ resizable: true, HTMLAttributes: { class: "tiptap-table" } }),
    TableRow,
    TableHeader,
    TableCell,
    TextStyle,
    FontFamily,
    Color,
    Highlight.configure({ multicolor: true }),
    LineSpacing,
  ]
}

// Cache the extensions array — it's the same every call
let _cachedExtensions: Extensions | null = null
function getCachedParseExtensions(): Extensions {
  if (!_cachedExtensions) _cachedExtensions = getServerParseExtensions()
  return _cachedExtensions
}

/* ── Public API ── */

/**
 * Convert TipTap JSON (stringified) to HTML for frontend rendering.
 */
export function tiptapJsonToHtml(jsonString: string): string {
  try {
    const json = JSON.parse(jsonString) as JSONContent
    let html = generateHTML(json, getCachedParseExtensions())
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
