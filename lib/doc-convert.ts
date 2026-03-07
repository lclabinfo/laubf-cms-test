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
 * Looks for font-family declarations in inline styles and <style> blocks.
 */
function detectFontFromHtml(html: string): {
  dominantFont: string | null
  isSerifDoc: boolean
  serifFontFamily: string | null
} {
  const fontCounts = new Map<string, number>()

  // Match font-family declarations in inline styles and style blocks
  const fontFamilyRegex = /font-family\s*:\s*([^;}"]+)/gi
  let match: RegExpExecArray | null
  while ((match = fontFamilyRegex.exec(html)) !== null) {
    // Parse out individual font names from the font-family value
    const value = match[1].trim()
    const fonts = value.split(",").map(f =>
      f.trim().replace(/^['"]|['"]$/g, "").toLowerCase()
    )
    for (const font of fonts) {
      if (font && !font.includes("serif") && !font.includes("sans") && !font.includes("monospace")) {
        fontCounts.set(font, (fontCounts.get(font) || 0) + 1)
      }
    }
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
    // Capitalize for CSS value
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

  // Extract HTML body content if wrapped in full document
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const bodyHtml = bodyMatch ? bodyMatch[1].trim() : html

  // Detect dominant font
  const { dominantFont, isSerifDoc, serifFontFamily } = detectFontFromHtml(html)

  return {
    html: bodyHtml,
    isSerifDoc,
    dominantFont,
    serifFontFamily,
  }
}
