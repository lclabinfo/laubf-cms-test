/**
 * .doc (Word 97-2003 binary OLE format) to HTML conversion service.
 *
 * mammoth.js only handles .docx (XML-based). This module provides server-side
 * conversion for legacy .doc files using a cascading fallback strategy:
 *
 *   1. textutil -convert html  (macOS built-in, highest quality)
 *   2. libreoffice --headless --convert-to html  (cross-platform)
 *   3. word-extractor (pure JS fallback, plain text only)
 *
 * Returns the same DocxConversionResult interface as docx-import.ts for
 * unified downstream handling.
 *
 * Test file: /Users/davidlim/Desktop/laubf-cms-test/Ex19a2007Q.doc
 */

import { promises as fs } from "fs"
import { tmpdir } from "os"
import { join, basename } from "path"
import { execFile } from "child_process"
import { promisify } from "util"
import type { DocxConversionResult } from "@/lib/docx-import"

const execFileAsync = promisify(execFile)

const SERIF_FONTS = [
  "times new roman", "georgia", "garamond", "palatino",
  "cambria", "book antiqua", "palatino linotype",
]

// ── Temp file helpers ──

function tempPath(ext: string): string {
  const id = `doc-convert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return join(tmpdir(), `${id}.${ext}`)
}

async function cleanupFiles(...paths: string[]): Promise<void> {
  for (const p of paths) {
    try { await fs.unlink(p) } catch { /* ignore */ }
  }
}

// ── Tool detection ──

async function commandExists(cmd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("which", [cmd])
    return stdout.trim() || null
  } catch {
    return null
  }
}

// ── Strategy 1: textutil (macOS) ──

async function convertWithTextutil(inputPath: string): Promise<string | null> {
  const textutilPath = await commandExists("textutil")
  if (!textutilPath) return null

  const outputPath = inputPath.replace(/\.doc$/, ".html")
  try {
    await execFileAsync("textutil", ["-convert", "html", "-output", outputPath, inputPath], {
      timeout: 30_000,
    })
    const html = await fs.readFile(outputPath, "utf-8")
    await cleanupFiles(outputPath)
    return html
  } catch (err) {
    await cleanupFiles(outputPath)
    console.warn("textutil conversion failed:", err)
    return null
  }
}

// ── Strategy 2: LibreOffice headless ──

async function convertWithLibreOffice(inputPath: string): Promise<string | null> {
  // Try both common names
  const loPath = (await commandExists("libreoffice")) || (await commandExists("soffice"))
  if (!loPath) return null

  const outDir = tmpdir()
  try {
    await execFileAsync(loPath, [
      "--headless",
      "--convert-to", "html",
      "--outdir", outDir,
      inputPath,
    ], { timeout: 60_000 })

    // LibreOffice names the output based on the input filename
    const inputBase = basename(inputPath, ".doc")
    const outputPath = join(outDir, `${inputBase}.html`)
    const html = await fs.readFile(outputPath, "utf-8")
    await cleanupFiles(outputPath)
    return html
  } catch (err) {
    console.warn("LibreOffice conversion failed:", err)
    return null
  }
}

// ── Strategy 3: word-extractor (pure JS fallback) ──

async function convertWithWordExtractor(buffer: Buffer): Promise<string | null> {
  try {
    const WordExtractorModule = await import("word-extractor")
    const WordExtractor = WordExtractorModule.default
    const extractor = new WordExtractor()
    const doc = await extractor.extract(buffer)

    const body: string = doc.getBody()
    if (!body || !body.trim()) return null

    // Convert plain text to HTML paragraphs
    const paragraphs = body.split(/\r?\n/)
    const htmlParagraphs = paragraphs.map((line: string) => {
      const trimmed = line.trim()
      if (!trimmed) return "<p></p>"
      // Escape HTML entities
      const escaped = trimmed
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
      return `<p>${escaped}</p>`
    })

    return htmlParagraphs.join("\n")
  } catch (err) {
    console.warn("word-extractor conversion failed:", err)
    return null
  }
}

// ── Font detection from HTML output ──

/**
 * Attempts to detect the dominant font from HTML output.
 * Looks for font-family declarations AND shorthand font: declarations
 * in inline styles and <style> blocks.
 *
 * textutil (macOS) uses shorthand: `font: 12.0px 'Times New Roman'`
 * LibreOffice uses longhand: `font-family: 'Times New Roman'`
 */
function detectFontFromHtml(html: string): {
  dominantFont: string | null
  isSerifDoc: boolean
  serifFontFamily: string | null
} {
  const fontCounts = new Map<string, number>()

  function addFont(name: string) {
    const key = name.trim().replace(/^['"]|['"]$/g, "").toLowerCase()
    if (key && !key.includes("serif") && !key.includes("sans") && !key.includes("monospace")) {
      fontCounts.set(key, (fontCounts.get(key) || 0) + 1)
    }
  }

  // Match font-family: declarations (longhand)
  const fontFamilyRegex = /font-family\s*:\s*([^;}"]+)/gi
  let match: RegExpExecArray | null
  while ((match = fontFamilyRegex.exec(html)) !== null) {
    const fonts = match[1].split(",")
    for (const f of fonts) addFont(f)
  }

  // Match shorthand font: declarations (e.g., "font: 12.0px 'Times New Roman'")
  // The shorthand format is: font: [style] [variant] [weight] size[/line-height] family
  // textutil outputs: font: 12.0px 'Times New Roman'
  const shorthandFontRegex = /(?:^|[{;\s])font\s*:\s*(?:(?:italic|oblique|normal|bold|bolder|lighter|\d+)\s+)*[\d.]+(?:px|pt|em|rem|%)(?:\s*\/\s*[\d.]+(?:px|pt|em|rem|%))?\s+([^;}"]+)/gi
  while ((match = shorthandFontRegex.exec(html)) !== null) {
    const fonts = match[1].split(",")
    for (const f of fonts) addFont(f)
  }

  let dominantFont: string | null = null
  let maxCount = 0
  for (const [font, count] of fontCounts.entries()) {
    if (count > maxCount) {
      dominantFont = font
      maxCount = count
    }
  }

  const isSerifDoc = dominantFont !== null && SERIF_FONTS.includes(dominantFont)

  let serifFontFamily: string | null = null
  if (isSerifDoc) {
    const originalCase = dominantFont!.replace(/\b\w/g, c => c.toUpperCase())
    serifFontFamily = `"${originalCase}", Georgia, serif`
  }

  return { dominantFont, isSerifDoc, serifFontFamily }
}

// ── Main export ──

/**
 * Convert a .doc (Word 97-2003) file to HTML.
 *
 * Tries conversion tools in order:
 *   1. textutil (macOS built-in)
 *   2. LibreOffice headless
 *   3. word-extractor (pure JS, plain text only)
 *
 * @param buffer - Buffer containing the .doc file bytes
 * @param filename - Optional filename for logging
 * @returns Conversion result with HTML and font metadata
 */
export async function convertDocToHtml(
  buffer: Buffer,
  filename?: string,
): Promise<DocxConversionResult> {
  const label = filename || "unknown.doc"

  // Write buffer to temp file for tool-based converters
  const tempInput = tempPath("doc")
  await fs.writeFile(tempInput, buffer)

  let html: string | null = null
  let conversionMethod = ""

  try {
    // Strategy 1: textutil (macOS)
    html = await convertWithTextutil(tempInput)
    if (html) {
      conversionMethod = "textutil"
    }

    // Strategy 2: LibreOffice
    if (!html) {
      html = await convertWithLibreOffice(tempInput)
      if (html) {
        conversionMethod = "libreoffice"
      }
    }

    // Strategy 3: word-extractor (pure JS fallback)
    if (!html) {
      html = await convertWithWordExtractor(buffer)
      if (html) {
        conversionMethod = "word-extractor"
      }
    }
  } finally {
    await cleanupFiles(tempInput)
  }

  if (!html) {
    throw new Error(
      `Failed to convert .doc file "${label}": no conversion tool available. ` +
      `Install LibreOffice for server-side .doc conversion, or use macOS with textutil.`
    )
  }

  console.log(`[doc-convert] Converted "${label}" using ${conversionMethod}`)

  // Detect dominant font from FULL html (including <style> block) before stripping
  const { dominantFont, isSerifDoc, serifFontFamily } = detectFontFromHtml(html)

  // Extract HTML body content if wrapped in full document
  let bodyHtml: string
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    bodyHtml = bodyMatch[1].trim()

    // Inline CSS class styles from <style> block into elements.
    // textutil generates class-based styles (e.g., p.p1 { font: 12px 'Times New Roman' })
    // that are lost when we strip the <style> block. Inline them so the HTML is self-contained.
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
    if (styleMatch) {
      const styleBlock = styleMatch[1]
      // Parse CSS rules: "p.p1 { ... }" or ".p1 { ... }"
      const ruleRegex = /(?:p\.)?(\w+)\s*\{([^}]+)\}/g
      let ruleMatch: RegExpExecArray | null
      const classStyles = new Map<string, string>()
      while ((ruleMatch = ruleRegex.exec(styleBlock)) !== null) {
        classStyles.set(ruleMatch[1], ruleMatch[2].trim())
      }

      // Replace class references with inline styles
      for (const [cls, styles] of classStyles) {
        // Match elements with class="cls" and add inline style
        const classRegex = new RegExp(`(<\\w+)\\s+class="${cls}"`, "g")
        bodyHtml = bodyHtml.replace(classRegex, `$1 style="${styles}"`)
      }
    }
  } else {
    bodyHtml = html
  }

  return {
    html: bodyHtml,
    isSerifDoc,
    dominantFont,
    serifFontFamily,
  }
}
