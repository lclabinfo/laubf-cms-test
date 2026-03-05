/**
 * DOCX-to-HTML conversion service.
 *
 * Converts .docx files to formatted HTML preserving:
 * - Line height and paragraph spacing (before/after)
 * - Text alignment (center, right, justify)
 * - Font detection (serif vs sans-serif dominant font)
 * - Ordered list start numbers
 * - Paragraph indentation
 * - Empty paragraph preservation
 * - Tab and consecutive-space handling
 *
 * Works in both browser (ArrayBuffer from FileReader) and Node.js (Buffer from fs.readFile).
 * XML-based spacing extraction requires DOMParser — available natively in browsers.
 * For Node.js, install `@xmldom/xmldom` and assign to globalThis.DOMParser, or
 * spacing data will be gracefully skipped.
 */

// ── Types ──

interface DocxParaData {
  tag: "p" | "h"       // whether this becomes a <p> or <h1-4>
  lineHeight: number | null   // CSS line-height (w:line / 240)
  spacingBefore: number | null // points (w:before in twips / 20)
  spacingAfter: number | null  // points (w:after in twips / 20)
}

export interface DocxConversionResult {
  /** Formatted HTML with inline styles for spacing, alignment, and fonts */
  html: string
  /** Whether the document's dominant font is a serif font */
  isSerifDoc: boolean
  /** The dominant font name (lowercase), or null if no fonts detected */
  dominantFont: string | null
  /** CSS font-family value for serif documents (e.g. '"Times New Roman", Georgia, serif') */
  serifFontFamily: string | null
}

const SERIF_FONTS = [
  "times new roman", "georgia", "garamond", "palatino",
  "cambria", "book antiqua", "palatino linotype",
]

// ── Main export ──

/**
 * Convert a DOCX file to formatted HTML.
 * Preserves line height, paragraph spacing, alignment, fonts, list numbering.
 *
 * @param buffer - ArrayBuffer (browser) or Buffer (Node.js) of the .docx file
 * @param _filename - Optional filename (reserved for future format detection)
 * @returns Conversion result with HTML and font metadata
 */
export async function convertDocxToHtml(
  buffer: ArrayBuffer | Buffer,
  _filename?: string,
): Promise<DocxConversionResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth = await import("mammoth") as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const JSZip = (await import("jszip") as any).default

  // Ensure we have an ArrayBuffer (mammoth expects ArrayBuffer)
  let arrayBuffer: ArrayBuffer
  if (buffer instanceof ArrayBuffer) {
    arrayBuffer = buffer
  } else {
    // Node.js Buffer — extract the underlying ArrayBuffer region
    const buf = buffer as Buffer
    arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  }

  // ── 1. Extract per-paragraph data + numbering + style spacing from raw DOCX XML ──
  // mammoth doesn't expose line-height, spacing, or list start numbers, so we read directly.
  const nonListXmlParaData: DocxParaData[] = []
  // Ordered list start numbers: map from sequential <ol> index to start value
  const olStartNumbers: number[] = []
  // Style-level spacing defaults (from styles.xml)
  const styleSpacing = new Map<string, { before: number | null; after: number | null }>()

  try {
    const zip = await JSZip.loadAsync(arrayBuffer)
    const docXml = await zip.file("word/document.xml")?.async("string")

    // Only attempt XML parsing if DOMParser is available
    if (typeof DOMParser !== "undefined") {
      // Parse styles.xml for heading spacing defaults
      const stylesXml = await zip.file("word/styles.xml")?.async("string")
      if (stylesXml) {
        parseStylesXml(stylesXml, styleSpacing)
      }

      // Parse numbering.xml for ordered list start numbers
      const numberingXml = await zip.file("word/numbering.xml")?.async("string")
      const { abstractNumStarts, numIdToAbstract } = parseNumberingXml(numberingXml)

      // Parse document.xml for per-paragraph spacing and list tracking
      if (docXml) {
        parseDocumentXml(
          docXml, styleSpacing, numIdToAbstract, abstractNumStarts,
          nonListXmlParaData, olStartNumbers,
        )
      }
    }
  } catch {
    // XML parsing failed — continue without spacing data
  }

  // ── 2. Collect alignment + font from mammoth transform ──
  const allFonts: string[] = []
  const paragraphAlignments: (string | null)[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformParagraph = mammoth.transforms.paragraph(function (paragraph: any) {
    const isListItem = !!paragraph.numbering

    // Collect alignment only for non-list paragraphs (maps 1:1 with HTML <p>/<h>)
    if (!isListItem) {
      const align = paragraph.alignment
      if (align && align !== "left") {
        paragraphAlignments.push(align === "both" ? "justify" : align)
      } else {
        paragraphAlignments.push(null)
      }
    }

    // Collect ALL fonts for dominant detection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function findFont(children: any[]) {
      for (const c of children) {
        if (c.font) allFonts.push(c.font)
        if (c.children) findFont(c.children)
      }
    }
    findFont(paragraph.children)

    // Preserve empty/whitespace-only paragraphs
    let hasText = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function checkText(children: any[]) {
      for (const c of children) {
        if (c.type === "text" && c.value && c.value.trim()) { hasText = true; return }
        if (c.children) checkText(c.children)
      }
    }
    checkText(paragraph.children)
    if (!hasText) {
      return {
        ...paragraph,
        children: [{
          type: "run", children: [{ type: "text", value: "\u00A0" }],
          styleName: null, styleId: null,
          isBold: false, isItalic: false, isUnderline: false,
          isStrikethrough: false, isAllCaps: false, isSmallCaps: false,
          verticalAlignment: "baseline", font: null, fontSize: null,
        }],
      }
    }

    // Detect paragraph-level indentation
    const indentStart = parseInt(paragraph.indent?.start || "0", 10)
    if (indentStart > 0 && !paragraph.numbering && !paragraph.styleName?.startsWith("Heading")) {
      const level = Math.round(indentStart / 720)
      if (level > 0) {
        return {
          ...paragraph,
          styleName: paragraph.styleName || `indent-${level}`,
        }
      }
    }
    return paragraph
  })

  // mammoth expects { arrayBuffer } in browser, { buffer } in Node.js
  const isNode = typeof process !== "undefined" && process.versions?.node
  const mammothInput = isNode
    ? { buffer: Buffer.from(arrayBuffer) }
    : { arrayBuffer }

  const result = await mammoth.convertToHtml(
    mammothInput,
    {
      transformDocument: transformParagraph,
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='indent-1'] => p.indent-1:fresh",
        "p[style-name='indent-2'] => p.indent-2:fresh",
        "p[style-name='indent-3'] => p.indent-3:fresh",
        "p[style-name='indent-4'] => p.indent-4:fresh",
      ],
    },
  )

  // ── 3. Determine dominant font ──
  const { dominantFont, isSerifDoc } = detectDominantFont(allFonts)

  // ── 4. Post-process HTML ──
  let html: string = result.value

  // Normalize whitespace-only paragraphs
  html = html.replace(/<p>(.*?)<\/p>/g, (match, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").trim()
    if (!text || text === "\u00A0") return "<p></p>"
    return match
  })

  // Convert indent classes to inline margin-left
  html = html.replace(/<p class="indent-(\d+)">/g, (_, level) =>
    `<p style="margin-left: ${parseInt(level) * 40}px">`)

  // Convert tab characters to em-spaces
  html = html.replace(/\t/g, "\u2003\u2003")

  // Preserve consecutive spaces
  html = html.replace(/ {2,}/g, (match) => "\u00A0".repeat(match.length - 1) + " ")

  // Apply ordered list start numbers from DOCX numbering.xml
  {
    let olIdx = 0
    html = html.replace(/<ol>/g, () => {
      const start = olStartNumbers[olIdx++] ?? 1
      return start !== 1 ? `<ol start="${start}">` : "<ol>"
    })
  }

  // Build serif font-family value
  let serifFontFamily: string | null = null
  if (isSerifDoc) {
    serifFontFamily = `"${allFonts.find(f => f.toLowerCase() === dominantFont) || "Times New Roman"}", Georgia, serif`
    // For serif documents, set font-family on list containers so list markers
    // (numbers/bullets) also render in serif, not just the text spans inside.
    html = html.replace(/<ol/g, `<ol style="font-family: ${serifFontFamily}"`)
    html = html.replace(/<ul/g, `<ul style="font-family: ${serifFontFamily}"`)
  }

  // ── 5. Apply alignment and per-paragraph spacing ──
  // nonListXmlParaData and paragraphAlignments both map 1:1 with HTML <p>/<h> tags.
  let htmlPIdx = 0

  html = html.replace(/<(p|h[1-4])([^>]*?)>([\s\S]*?)<\/\1>/g, (_match, tag: string, attrs: string, inner: string) => {
    const align = paragraphAlignments[htmlPIdx]

    // Build inline styles
    const styles: string[] = []
    if (align) styles.push(`text-align: ${align}`)

    // Per-paragraph spacing from XML (already filtered to non-list only).
    if (htmlPIdx < nonListXmlParaData.length) {
      const data = nonListXmlParaData[htmlPIdx]
      if (data.lineHeight !== null) {
        const lh = Math.round(data.lineHeight * 100) / 100
        styles.push(`line-height: ${lh}`)
      }
      // For <p> tags: always emit margin to override CSS > * + * gap.
      // For headings: only set margin if DOCX specifies spacing (from paragraph or style).
      const isHeading = data.tag === "h"
      if (data.spacingBefore !== null && data.spacingBefore > 0) {
        const rem = Math.round((data.spacingBefore * 1.333 / 16) * 100) / 100
        styles.push(`margin-top: ${rem}rem`)
      } else if (!isHeading) {
        styles.push(`margin-top: 0rem`)
      }
      if (data.spacingAfter !== null && data.spacingAfter > 0) {
        const rem = Math.round((data.spacingAfter * 1.333 / 16) * 100) / 100
        styles.push(`margin-bottom: ${rem}rem`)
      } else if (!isHeading) {
        styles.push(`margin-bottom: 0rem`)
      }
    }
    htmlPIdx++

    let openTag: string
    if (styles.length > 0) {
      const styleStr = styles.join("; ")
      if (attrs.includes('style="')) {
        openTag = `<${tag}${attrs.replace('style="', `style="${styleStr}; `)}>`
      } else {
        openTag = `<${tag}${attrs} style="${styleStr}">`
      }
    } else {
      openTag = `<${tag}${attrs}>`
    }

    return `${openTag}${inner}</${tag}>`
  })

  return {
    html,
    isSerifDoc,
    dominantFont,
    serifFontFamily,
  }
}

// ── Helper: Parse styles.xml for heading spacing defaults ──

function parseStylesXml(
  stylesXml: string,
  styleSpacing: Map<string, { before: number | null; after: number | null }>,
): void {
  const parser = new DOMParser()
  const stylesDoc = parser.parseFromString(stylesXml, "application/xml")
  const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  const styles = stylesDoc.getElementsByTagNameNS(ns, "style")
  for (let i = 0; i < styles.length; i++) {
    const style = styles[i]
    const styleId = style.getAttribute("w:styleId")
    const type = style.getAttribute("w:type")
    if (type === "paragraph" && styleId) {
      const pPr = style.getElementsByTagNameNS(ns, "pPr")[0]
      const spacing = pPr?.getElementsByTagNameNS(ns, "spacing")[0]
      if (spacing) {
        const before = spacing.getAttribute("w:before")
        const after = spacing.getAttribute("w:after")
        styleSpacing.set(styleId, {
          before: before ? parseFloat(before) / 20 : null,
          after: after ? parseFloat(after) / 20 : null,
        })
      }
    }
  }
}

// ── Helper: Parse numbering.xml for ordered list start numbers ──

function parseNumberingXml(numberingXml: string | undefined | null): {
  abstractNumStarts: Map<string, number>
  numIdToAbstract: Map<string, string>
} {
  const abstractNumStarts = new Map<string, number>()
  const numIdToAbstract = new Map<string, string>()

  if (!numberingXml) return { abstractNumStarts, numIdToAbstract }

  const parser = new DOMParser()
  const numDoc = parser.parseFromString(numberingXml, "application/xml")
  const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

  // Parse abstractNum entries
  const abstractNums = numDoc.getElementsByTagNameNS(ns, "abstractNum")
  for (let i = 0; i < abstractNums.length; i++) {
    const abstractNum = abstractNums[i]
    const abstractNumId = abstractNum.getAttribute("w:abstractNumId")
    if (!abstractNumId) continue
    const lvls = abstractNum.getElementsByTagNameNS(ns, "lvl")
    for (let j = 0; j < lvls.length; j++) {
      if (lvls[j].getAttribute("w:ilvl") === "0") {
        const startEl = lvls[j].getElementsByTagNameNS(ns, "start")[0]
        const startVal = startEl?.getAttribute("w:val")
        if (startVal) abstractNumStarts.set(abstractNumId, parseInt(startVal, 10))
        break
      }
    }
  }

  // Parse num entries (numId -> abstractNumId mapping)
  const nums = numDoc.getElementsByTagNameNS(ns, "num")
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i]
    const numId = num.getAttribute("w:numId")
    const abstractRef = num.getElementsByTagNameNS(ns, "abstractNumId")[0]
    const abstractId = abstractRef?.getAttribute("w:val")
    if (numId && abstractId) numIdToAbstract.set(numId, abstractId)
  }

  return { abstractNumStarts, numIdToAbstract }
}

// ── Helper: Parse document.xml for paragraph spacing and list tracking ──

function parseDocumentXml(
  docXml: string,
  styleSpacing: Map<string, { before: number | null; after: number | null }>,
  numIdToAbstract: Map<string, string>,
  abstractNumStarts: Map<string, number>,
  nonListXmlParaData: DocxParaData[],
  olStartNumbers: number[],
): void {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(docXml, "application/xml")
  const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  const paragraphs = xmlDoc.getElementsByTagNameNS(ns, "p")

  // Track which numIds we've seen to build ordered list start numbers
  // Mammoth creates a new <ol> when a different numId is encountered
  let lastNumId: string | null = null

  for (let i = 0; i < paragraphs.length; i++) {
    const pPr = paragraphs[i].getElementsByTagNameNS(ns, "pPr")[0]
    const numPr = pPr?.getElementsByTagNameNS(ns, "numPr")[0]
    if (numPr) {
      // This is a list paragraph — track for start number
      const numIdEl = numPr.getElementsByTagNameNS(ns, "numId")[0]
      const numId = numIdEl?.getAttribute("w:val")
      const ilvlEl = numPr.getElementsByTagNameNS(ns, "ilvl")[0]
      const ilvl = ilvlEl?.getAttribute("w:val") || "0"
      // Each distinct numId at ilvl 0 produces a new <ol> in mammoth
      if (numId && ilvl === "0" && numId !== lastNumId) {
        const abstractId = numIdToAbstract.get(numId)
        const startNum = abstractId ? abstractNumStarts.get(abstractId) : undefined
        olStartNumbers.push(startNum ?? 1)
      }
      lastNumId = numId
      continue
    }
    lastNumId = null

    // Non-list paragraph — collect spacing data
    const pStyle = pPr?.getElementsByTagNameNS(ns, "pStyle")[0]
    const styleId = pStyle?.getAttribute("w:val")
    const isHeading = styleId?.startsWith("Heading")

    const spacing = pPr?.getElementsByTagNameNS(ns, "spacing")[0]
    const wLine = spacing?.getAttribute("w:line")
    const wBefore = spacing?.getAttribute("w:before")
    const wAfter = spacing?.getAttribute("w:after")

    // For headings without explicit spacing, use style defaults
    let spacingBefore = wBefore ? parseFloat(wBefore) / 20 : null
    let spacingAfter = wAfter ? parseFloat(wAfter) / 20 : null
    if (isHeading && styleId) {
      const styleDef = styleSpacing.get(styleId)
      if (styleDef) {
        if (spacingBefore === null) spacingBefore = styleDef.before
        if (spacingAfter === null) spacingAfter = styleDef.after
      }
    }

    nonListXmlParaData.push({
      tag: isHeading ? "h" : "p",
      lineHeight: wLine ? parseFloat(wLine) / 240 : null,
      spacingBefore,
      spacingAfter,
    })
  }
}

// ── Helper: Detect dominant font from collected font names ──

function detectDominantFont(allFonts: string[]): {
  dominantFont: string | null
  isSerifDoc: boolean
} {
  let dominantFont: string | null = null
  const fontCounts = new Map<string, number>()
  for (const f of allFonts) {
    const key = f.toLowerCase()
    fontCounts.set(key, (fontCounts.get(key) || 0) + 1)
  }
  let maxFontCount = 0
  for (const [font, count] of Array.from(fontCounts.entries())) {
    if (count > maxFontCount) {
      dominantFont = font
      maxFontCount = count
    }
  }
  const isSerifDoc = dominantFont !== null && SERIF_FONTS.includes(dominantFont)
  return { dominantFont, isSerifDoc }
}
