/**
 * Migrate Bible study content from DOCX/DOC files.
 *
 * Uses:
 * - convertDocxToHtml() for .docx files (mammoth pipeline with full formatting)
 * - convertDocToHtml() for .doc files (textutil/libreoffice with font + indent preservation)
 *
 * Outputs: scripts/bible-study-content.json
 *   mapping legacyId -> { questions?, answers?, transcript? } as HTML
 */

import { readFileSync, writeFileSync, existsSync } from "fs"
import { resolve } from "path"

// Provide DOMParser for Node.js (the docx-import service needs it for XML parsing)
import { DOMParser } from "@xmldom/xmldom"
;(globalThis as any).DOMParser = DOMParser

const docxImport = await import("../lib/docx-import.ts")
const convertDocxToHtml = docxImport.convertDocxToHtml

const docImport = await import("../lib/doc-convert.ts")
const convertDocToHtml = docImport.convertDocToHtml

// ── Parse the laubfmaterial SQL dump to get doctype→filename mapping ──

interface MaterialRow {
  no: number
  title: string
  mtype: string
  mdate: string
  passage: string
  bname: string
  doctype1: string | null
  doctype2: string | null
  doctype3: string | null
  doctype4: string | null
  filename1: string | null
  filename2: string | null
  filename3: string | null
  filename4: string | null
  msgurl: string | null
}

function parseSqlValue(s: string, pos: number): [any, number] {
  if (pos >= s.length) return [null, pos]
  if (s.slice(pos, pos + 4) === "NULL") return [null, pos + 4]
  if (s[pos] === "'") {
    pos++
    const result: string[] = []
    while (pos < s.length) {
      if (s[pos] === "\\" && pos + 1 < s.length) {
        result.push(s[pos + 1])
        pos += 2
      } else if (s[pos] === "'") {
        pos++
        break
      } else {
        result.push(s[pos])
        pos++
      }
    }
    return [result.join(""), pos]
  }
  if (s[pos] === "-" || (s[pos] >= "0" && s[pos] <= "9")) {
    let end = pos
    while (end < s.length && (s[end] >= "0" && s[end] <= "9" || s[end] === "-" || s[end] === ".")) end++
    const val = s.slice(pos, end)
    return [parseInt(val) || 0, end]
  }
  return [null, pos + 1]
}

function parseRow(s: string, pos: number): [any[] | null, number] {
  if (pos >= s.length || s[pos] !== "(") return [null, pos]
  pos++
  const values: any[] = []
  while (pos < s.length) {
    while (pos < s.length && s[pos] === " ") pos++
    if (pos < s.length && s[pos] === ")") { pos++; return [values, pos] }
    const [val, next] = parseSqlValue(s, pos)
    values.push(val)
    pos = next
    while (pos < s.length && s[pos] === " ") pos++
    if (pos < s.length && s[pos] === ",") pos++
  }
  return [values, pos]
}

function parseMaterialRows(): MaterialRow[] {
  const content = readFileSync("00_old_laubf_db_dump/laubf_laubfmaterial.sql", "utf-8")
  const insertMatch = content.match(/INSERT INTO `laubfmaterial` VALUES\s*/)
  if (!insertMatch) throw new Error("Could not find INSERT statement")

  let pos = insertMatch.index! + insertMatch[0].length
  const rows: MaterialRow[] = []

  while (pos < content.length) {
    while (pos < content.length && " ,\n\r\t".includes(content[pos])) pos++
    if (pos >= content.length || content[pos] === ";") break
    if (content[pos] === "(") {
      const [values, next] = parseRow(content, pos)
      pos = next
      if (values && values.length >= 22) {
        rows.push({
          no: values[0],
          title: values[2] || "",
          mtype: values[3] || "",
          mdate: values[4] || "",
          passage: values[5] || "",
          bname: values[6] || "",
          doctype1: values[9], doctype2: values[10], doctype3: values[11], doctype4: values[12],
          filename1: values[13], filename2: values[14], filename3: values[15], filename4: values[16],
          msgurl: values[21],
        })
      }
    } else break
  }

  return rows
}

// ── Convert a single file using the mammoth pipeline ──

async function convertFile(filepath: string): Promise<string | null> {
  const ext = filepath.split(".").pop()?.toLowerCase()
  if (!ext || !["doc", "docx"].includes(ext)) return null

  try {
    if (ext === "docx") {
      const buffer = readFileSync(filepath)
      const result = await convertDocxToHtml(buffer, filepath)
      return result.html || null
    } else {
      // .doc files: use server-side conversion pipeline (textutil html / libreoffice / word-extractor)
      const buffer = readFileSync(filepath)
      const result = await convertDocToHtml(buffer, filepath)
      return result.html || null
    }
  } catch (err) {
    console.error(`  Error converting ${filepath}: ${(err as Error).message}`)
    return null
  }
}

// ── Main ──

async function main() {
  console.log("Parsing SQL dump...")
  const allRows = parseMaterialRows()
  console.log(`Total entries: ${allRows.length}`)

  const sundayRows = allRows.filter(r => r.mtype === "Sunday")
  console.log(`Sunday entries: ${sundayRows.length}`)

  const contentMap: Record<string, { questions?: string; answers?: string; transcript?: string }> = {}
  let questionsCount = 0
  let answersCount = 0
  let transcriptCount = 0
  let docxConverted = 0
  let docFallback = 0
  let errors = 0

  for (let i = 0; i < sundayRows.length; i++) {
    const row = sundayRows[i]
    if (i % 100 === 0) {
      console.log(`Processing ${i}/${sundayRows.length}... (${row.title.slice(0, 50)})`)
    }

    let questions: string | null = null
    let answers: string | null = null
    let transcript: string | null = null

    // Process all 4 attachment slots
    const doctypes = [row.doctype1, row.doctype2, row.doctype3, row.doctype4]
    const filenames = [row.filename1, row.filename2, row.filename3, row.filename4]

    for (let slot = 0; slot < 4; slot++) {
      const doctype = (doctypes[slot] || "").trim()
      const filename = (filenames[slot] || "").trim()
      if (!filename) continue

      const filepath = resolve("legacy-files", filename)
      if (!existsSync(filepath)) {
        errors++
        continue
      }

      const ext = filename.split(".").pop()?.toLowerCase()
      const html = await convertFile(filepath)
      if (!html) {
        errors++
        continue
      }

      if (ext === "docx") docxConverted++
      else docFallback++

      if (doctype === "Question" || doctype === "Inductive") {
        if (!questions) questions = html
      } else if (doctype === "Note") {
        if (!answers) answers = html
      } else if (doctype === "Message") {
        if (!transcript) transcript = html
      }
    }

    // Also check msgurl for transcript
    if (!transcript && row.msgurl?.trim()) {
      const msgFilename = row.msgurl.trim().split("/").pop()
      if (msgFilename) {
        const msgPath = resolve("legacy-files", msgFilename)
        if (existsSync(msgPath)) {
          const html = await convertFile(msgPath)
          if (html) {
            transcript = html
            docFallback++
          }
        }
      }
    }

    if (questions || answers || transcript) {
      const entry: Record<string, string> = {}
      if (questions) { entry.questions = questions; questionsCount++ }
      if (answers) { entry.answers = answers; answersCount++ }
      if (transcript) { entry.transcript = transcript; transcriptCount++ }
      contentMap[String(row.no)] = entry
    }
  }

  console.log("\n=== Migration Summary ===")
  console.log(`Entries with content: ${Object.keys(contentMap).length}`)
  console.log(`Questions: ${questionsCount}`)
  console.log(`Answers: ${answersCount}`)
  console.log(`Transcripts: ${transcriptCount}`)
  console.log(`DOCX files (mammoth): ${docxConverted}`)
  console.log(`DOC files (textutil fallback): ${docFallback}`)
  console.log(`Errors: ${errors}`)

  // Clean null bytes and control characters
  let cleaned = 0
  for (const id of Object.keys(contentMap)) {
    for (const key of Object.keys(contentMap[id])) {
      const text = (contentMap[id] as any)[key]
      const clean = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "")
      if (clean !== text) {
        ;(contentMap[id] as any)[key] = clean
        cleaned++
      }
    }
  }
  if (cleaned) console.log(`Cleaned ${cleaned} entries with control characters`)

  writeFileSync("scripts/bible-study-content.json", JSON.stringify(contentMap), "utf-8")
  const sizeMB = (readFileSync("scripts/bible-study-content.json").length / (1024 * 1024)).toFixed(1)
  console.log(`\nOutput: scripts/bible-study-content.json (${sizeMB} MB)`)
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
