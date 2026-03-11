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
import OrderedList from "@tiptap/extension-ordered-list"
import BulletList from "@tiptap/extension-bullet-list"
import { generateHTML } from "@tiptap/html"
import ListItem from "@tiptap/extension-list-item"
import { Extension, wrappingInputRule } from "@tiptap/core"
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state"
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
              const indentPx = (attributes.indent as number) * 40
              const styles = [`margin-left: ${indentPx}px`]
              if (attributes.hangingIndent) {
                // Hanging indent: pull first line back so numbers sit at the left edge.
                // white-space: pre-wrap + tab-size ensures tab characters advance to
                // the indent position, aligning first-line text with continuation lines
                // (replicating Word's fixed-position tab stops).
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
 * Helper: extract fontFamily from the editor's current textStyle marks.
 * Checks multiple sources: storedMarks (pending marks for next input),
 * selection marks ($from.marks()), and getAttributes (text at cursor).
 */
function getEditorFontFamily(editor: any): string | null {
  try {
    // 1. Check storedMarks (set by setFontFamily before typing)
    const storedMarks = editor.state.storedMarks
    if (storedMarks) {
      const ts = storedMarks.find((m: any) => m.type.name === "textStyle")
      if (ts?.attrs?.fontFamily) return ts.attrs.fontFamily
    }

    // 2. Check marks at the current cursor position
    const { $from } = editor.state.selection
    const cursorMarks = $from.marks()
    if (cursorMarks.length) {
      const ts = cursorMarks.find((m: any) => m.type.name === "textStyle")
      if (ts?.attrs?.fontFamily) return ts.attrs.fontFamily
    }

    // 3. Fallback: getAttributes (works when cursor is inside marked text)
    const attrs = editor.getAttributes("textStyle")
    return attrs?.fontFamily || null
  } catch {
    return null
  }
}

/**
 * Shared fontFamily attribute definition for list nodes.
 * Parses font-family from <ol>/<ul> style (set by doc-convert.ts for imports)
 * and renders it back so list markers inherit the font via CSS inheritance.
 */
const listFontFamilyAttribute = {
  default: null,
  parseHTML: (element: HTMLElement) => element.style.fontFamily || null,
  renderHTML: (attributes: Record<string, any>) => {
    if (!attributes.fontFamily) return {}
    return { style: `font-family: ${attributes.fontFamily}` }
  },
}

// Regex patterns (same as TipTap uses internally)
const orderedListInputRegex = /^(\d+)\.\s$/
const bulletListInputRegex = /^\s*([-+*])\s$/

/**
 * Extended OrderedList with fontFamily attribute, custom input rule, and
 * command override. When the user types "1. " or clicks the ordered list
 * button with a serif font active, the fontFamily is set on the <ol> node
 * so list markers render in the correct font.
 *
 * Three mechanisms ensure font propagation:
 *   1. Input rule: passes fontFamily from editor's textStyle to the list node
 *   2. Toggle command: reads fontFamily from textStyle and applies to list node
 *   3. ListFontPropagation plugin: syncs font from text content to list node
 */
const StyledOrderedList = OrderedList.extend({
  addOptions() {
    return {
      ...(this.parent?.() ?? {}),
      keepMarks: true,
      keepAttributes: true,
    } as any
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      fontFamily: listFontFamilyAttribute,
    }
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: orderedListInputRegex,
        type: this.type,
        keepMarks: true,
        keepAttributes: true,
        getAttributes: (match) => ({
          start: +match[1],
          fontFamily: getEditorFontFamily(this.editor),
        }),
        joinPredicate: (match, node) =>
          node.childCount + node.attrs.start === +match[1],
        editor: this.editor,
      }),
    ]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      toggleOrderedList:
        () =>
        ({ chain }) => {
          const fontFamily = getEditorFontFamily(this.editor)
          return chain()
            .toggleList(this.name, this.options.itemTypeName, true)
            .updateAttributes("listItem", this.editor.getAttributes("textStyle"))
            .command(({ tr, state }) => {
              // Find the orderedList node at the current selection and set fontFamily
              const { $from } = state.selection
              for (let depth = $from.depth; depth > 0; depth--) {
                const node = $from.node(depth)
                if (node.type.name === "orderedList") {
                  const pos = $from.before(depth)
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    fontFamily,
                  })
                  return true
                }
              }
              return true
            })
            .run()
        },
    }
  },
})

const StyledBulletList = BulletList.extend({
  addOptions() {
    return {
      ...(this.parent?.() ?? {}),
      keepMarks: true,
      keepAttributes: true,
    } as any
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      fontFamily: listFontFamilyAttribute,
    }
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: bulletListInputRegex,
        type: this.type,
        keepMarks: true,
        keepAttributes: true,
        getAttributes: () => ({
          fontFamily: getEditorFontFamily(this.editor),
        }),
        editor: this.editor,
      }),
    ]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      toggleBulletList:
        () =>
        ({ chain }) => {
          const fontFamily = getEditorFontFamily(this.editor)
          return chain()
            .toggleList(this.name, this.options.itemTypeName, true)
            .updateAttributes("listItem", this.editor.getAttributes("textStyle"))
            .command(({ tr, state }) => {
              const { $from } = state.selection
              for (let depth = $from.depth; depth > 0; depth--) {
                const node = $from.node(depth)
                if (node.type.name === "bulletList") {
                  const pos = $from.before(depth)
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    fontFamily,
                  })
                  return true
                }
              }
              return true
            })
            .run()
        },
    }
  },
})

/**
 * ProseMirror plugin that propagates font-family from list item text to the
 * parent list node. Serves as a safety net for cases not covered by the
 * input rules and commands above (e.g., pasting content, changing font on
 * existing list text, programmatic insertions).
 */
const listFontPluginKey = new PluginKey("listFontPropagation")

const ListFontPropagation = Extension.create({
  name: "listFontPropagation",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: listFontPluginKey,
        appendTransaction(transactions, oldState, newState) {
          const { doc, tr, selection, storedMarks } = newState
          let modified = false

          doc.forEach((node, offset) => {
            if (node.type.name !== "orderedList" && node.type.name !== "bulletList") return

            // Collect all fontFamily values from text nodes in this list
            let font: string | null | undefined = undefined // undefined = not yet seen
            let consistent = true
            let hasText = false

            node.descendants((child) => {
              if (!consistent) return false
              if (child.isText) {
                hasText = true
                const textStyleMark = child.marks.find(m => m.type.name === "textStyle")
                const childFont = textStyleMark?.attrs?.fontFamily || null
                if (font === undefined) {
                  font = childFont
                } else if (font !== childFont) {
                  consistent = false
                }
              }
              return true
            })

            // If list has no text content (empty items), check multiple sources
            // for the font to apply. wrappingInputRule's keepMarks sets storedMarks
            // via ensureMarks on the wrapping transaction, but a subsequent
            // chain().updateAttributes().run() transaction may clear them from
            // newState. We check: 1) newState.storedMarks, 2) individual transaction
            // storedMarks, 3) old state marks (from text that was deleted by the
            // input rule), 4) current selection marks.
            const listEnd = offset + node.nodeSize
            if (!hasText && selection.$from.pos >= offset && selection.$from.pos <= listEnd) {
              let resolvedFont: string | null = null

              // Source 1: newState.storedMarks
              if (storedMarks) {
                const ts = storedMarks.find((m: any) => m.type.name === "textStyle")
                if (ts?.attrs?.fontFamily) resolvedFont = ts.attrs.fontFamily
              }

              // Source 2: individual transactions' storedMarks
              // (catches marks set by wrappingInputRule's ensureMarks that were
              // overwritten by a subsequent chain() transaction)
              if (!resolvedFont) {
                for (const txn of transactions) {
                  if (txn.storedMarks) {
                    const ts = (txn.storedMarks as any[]).find((m: any) => m.type.name === "textStyle")
                    if (ts?.attrs?.fontFamily) {
                      resolvedFont = ts.attrs.fontFamily
                      break
                    }
                  }
                }
              }

              // Source 3: old state marks (text "1. " existed with textStyle marks
              // before the input rule deleted it and wrapped the paragraph)
              if (!resolvedFont) {
                const oldMarks = oldState.storedMarks || oldState.selection.$from.marks()
                if (oldMarks) {
                  const ts = oldMarks.find((m: any) => m.type.name === "textStyle")
                  if (ts?.attrs?.fontFamily) resolvedFont = ts.attrs.fontFamily
                }
              }

              // Source 4: current selection marks
              if (!resolvedFont) {
                const curMarks = selection.$from.marks()
                if (curMarks.length) {
                  const ts = curMarks.find((m: any) => m.type.name === "textStyle")
                  if (ts?.attrs?.fontFamily) resolvedFont = ts.attrs.fontFamily
                }
              }

              // If no font found from any source, preserve the existing fontFamily
              // on the node. This prevents appendTransaction from clearing a fontFamily
              // that was just set in a previous round (appendTransaction re-runs after
              // each modification, and mark sources are ephemeral).
              font = resolvedFont ?? node.attrs.fontFamily ?? null
              consistent = true
            }

            if (!consistent) {
              // Mixed fonts — clear list fontFamily
              if (node.attrs.fontFamily !== null) {
                tr.setNodeMarkup(offset, undefined, { ...node.attrs, fontFamily: null })
                modified = true
              }
            } else if (font !== undefined && font !== node.attrs.fontFamily) {
              tr.setNodeMarkup(offset, undefined, { ...node.attrs, fontFamily: font })
              modified = true
            }
          })

          return modified ? tr : null
        },
      }),
    ]
  },
})

/**
 * Custom ListItem that fixes Enter key behavior for empty spacer paragraphs.
 *
 * The DOCX import pipeline inserts empty <p> nodes inside <li> elements to
 * preserve visual spacing between list items (matching the original Word doc).
 * TipTap's default `splitListItem` command has a bug with these: pressing Enter
 * on an empty paragraph that is NOT the last child of a listItem triggers
 * Branch B (split) instead of Branch A (lift), creating a malformed "2. a."
 * pattern instead of exiting the list.
 *
 * This extension intercepts Enter and:
 *   - If cursor is in an empty paragraph inside a listItem AND it's not the
 *     last child → insert a new paragraph below (within the same listItem)
 *     instead of splitting the listItem. This preserves the spacer.
 *   - If cursor is in an empty paragraph that IS the last child → standard
 *     splitListItem (exit list) behavior.
 *   - Otherwise → fall through to default splitListItem
 *
 * Backspace is also handled: if cursor is at start of an empty paragraph
 * inside a listItem (not the first child), delete that spacer paragraph.
 */
const SpacerAwareListItem = ListItem.extend({
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state, view } = this.editor
        const { selection } = state
        const { $from } = selection

        // Check: are we inside a listItem?
        let listItemDepth = -1
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === "listItem") {
            listItemDepth = d
            break
          }
        }
        if (listItemDepth === -1) return false

        const paragraph = $from.parent
        const listItem = $from.node(listItemDepth)
        const indexInListItem = $from.index(listItemDepth)

        // Only handle empty paragraphs
        if (paragraph.type.name !== "paragraph" || paragraph.content.size !== 0) {
          return this.editor.commands.splitListItem(this.name)
        }

        const isLastChild = indexInListItem === listItem.childCount - 1

        if (!isLastChild) {
          // Empty spacer paragraph that is NOT last child → insert a new
          // paragraph below it (within the same listItem) so the spacer is
          // preserved and the user gets a new line to type on.
          const tr = state.tr
          const afterPos = $from.after($from.depth) // position after current empty paragraph
          const newParagraph = state.schema.nodes.paragraph.create()
          tr.insert(afterPos, newParagraph)
          // Place cursor inside the new paragraph
          tr.setSelection(TextSelection.near(tr.doc.resolve(afterPos + 1)))
          view.dispatch(tr)
          return true
        }

        // Empty paragraph IS the last child → default behavior (lift out of list)
        return this.editor.commands.splitListItem(this.name)
      },

      Backspace: () => {
        const { state, view } = this.editor
        const { selection } = state
        const { $from } = selection

        // Only handle if cursor is at the very start of the textblock
        if ($from.parentOffset !== 0) return false

        // Check: are we inside a listItem?
        let listItemDepth = -1
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === "listItem") {
            listItemDepth = d
            break
          }
        }
        if (listItemDepth === -1) return false

        const paragraph = $from.parent
        const indexInListItem = $from.index(listItemDepth)

        // Only handle empty paragraphs that aren't the first child
        if (paragraph.type.name !== "paragraph" || paragraph.content.size !== 0) return false
        if (indexInListItem === 0) return false

        // Delete the empty spacer paragraph
        const tr = state.tr
        const paragraphStart = $from.before($from.depth)
        const paragraphEnd = $from.after($from.depth)
        tr.delete(paragraphStart, paragraphEnd)
        view.dispatch(tr)
        return true
      },
    }
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
      orderedList: false,
      bulletList: false,
      listItem: false,
      // StarterKit v3.20+ includes Link and Underline — disable them here
      // since we configure them separately below with custom options.
      link: false,
      underline: false,
    }),
    SpacerAwareListItem,
    StyledOrderedList,
    StyledBulletList,
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
    ListFontPropagation,
    ...(placeholder
      ? [Placeholder.configure({ placeholder })]
      : []),
  ]
}

/**
 * Schema-only extension list for static HTML ↔ JSON conversion (generateJSON / generateHTML).
 * Includes all node types, mark types, and attributes (including fontFamily on list nodes)
 * but excludes ProseMirror runtime plugins (ListContinuation, ListFontPropagation),
 * input rules, and commands that require an active editor instance.
 *
 * Used by: migration scripts, seed generation, server-side rendering.
 * For editor use, call getExtensions() instead.
 */
export function getParseExtensions(): Extensions {
  // Lightweight list extensions with fontFamily attribute but no plugins/commands
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
    Image.configure({ inline: false, allowBase64: true }),
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

/**
 * Convert TipTap JSON (stringified) to HTML for frontend rendering.
 */
export function tiptapJsonToHtml(jsonString: string): string {
  try {
    const json = JSON.parse(jsonString) as JSONContent
    let html = generateHTML(json, getParseExtensions())
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
