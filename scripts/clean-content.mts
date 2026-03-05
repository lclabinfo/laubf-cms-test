/**
 * Clean redundant titles and passage references from the beginning of
 * bible study content (questions, answers, transcript).
 *
 * Works in two passes on the already-partially-cleaned JSON:
 *   Pass 1 (already done): Centered title + biblegateway passage
 *   Pass 2 (this run): Non-centered title paragraphs + plain passage text
 *
 * Rules for title detection (strict):
 *   - First <p> text closely matches the DB title (similarity check)
 *   - Text is short (<100 chars) and doesn't start with content markers
 *     like "Key Verse", "V1", "1.", "Summary", "Theme", "Read v."
 *
 * Rules for passage detection:
 *   - Contains a biblegateway link with short text (<80 chars)
 *   - OR text matches known passage patterns (Book Chapter:Verse-Verse)
 *   - Does NOT start with "Key Verse"
 */

import { readFileSync, writeFileSync } from "fs"

// ── Load content JSON ──
const contentMap: Record<string, { questions?: string; answers?: string; transcript?: string }> =
  JSON.parse(readFileSync("scripts/bible-study-content.json", "utf-8"))

// ── Load title/passage mapping from SQL dump ──
function parseSqlValue(s: string, pos: number): [any, number] {
  if (pos >= s.length) return [null, pos]
  if (s.slice(pos, pos + 4) === "NULL") return [null, pos + 4]
  if (s[pos] === "'") {
    pos++
    const result: string[] = []
    while (pos < s.length) {
      if (s[pos] === "\\" && pos + 1 < s.length) { result.push(s[pos + 1]); pos += 2 }
      else if (s[pos] === "'") { pos++; break }
      else { result.push(s[pos]); pos++ }
    }
    return [result.join(""), pos]
  }
  if (s[pos] === "-" || (s[pos] >= "0" && s[pos] <= "9")) {
    let end = pos
    while (end < s.length && (s[end] >= "0" && s[end] <= "9" || s[end] === "-" || s[end] === ".")) end++
    return [parseInt(s.slice(pos, end)) || 0, end]
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

function loadMaterialMap(): Map<number, { title: string; passage: string }> {
  const content = readFileSync("00_old_laubf_db_dump/laubf_laubfmaterial.sql", "utf-8")
  const insertMatch = content.match(/INSERT INTO `laubfmaterial` VALUES\s*/)
  if (!insertMatch) throw new Error("Could not find INSERT statement")
  let pos = insertMatch.index! + insertMatch[0].length
  const map = new Map<number, { title: string; passage: string }>()
  while (pos < content.length) {
    while (pos < content.length && " ,\n\r\t".includes(content[pos])) pos++
    if (pos >= content.length || content[pos] === ";") break
    if (content[pos] === "(") {
      const [values, next] = parseRow(content, pos)
      pos = next
      if (values && values.length >= 22) {
        map.set(values[0], { title: values[2] || "", passage: values[5] || "" })
      }
    } else break
  }
  return map
}

// ── HTML helpers ──

function splitIntoParagraphs(html: string): string[] {
  const parts: string[] = []
  const regex = /<(p|ol|ul|h[1-6]|div|table|blockquote)[\s>][\s\S]*?<\/\1>/gi
  let match
  let lastIndex = 0
  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      const between = html.slice(lastIndex, match.index).trim()
      if (between) parts.push(between)
    }
    parts.push(match[0])
    lastIndex = regex.lastIndex
  }
  if (lastIndex < html.length) {
    const trailing = html.slice(lastIndex).trim()
    if (trailing) parts.push(trailing)
  }
  return parts
}

function textContent(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function isEmptyParagraph(html: string): boolean {
  return textContent(html).length === 0
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[''""]/g, "'").replace(/[^\w\s']/g, " ").replace(/\s+/g, " ").trim()
}

// Content markers — if first paragraph starts with these, it's real content, not a title
const CONTENT_MARKERS = /^(key\s*verse|v\d|v\.\d|\d+[\.\)]\s|summary|theme|introduction|read\s|look\s|in\s+today|background|context|opening|overview|review|prayer|prologue|part\s|section\s|chapter\s)/i

function isTitleMatch(text: string, title: string): boolean {
  if (!text || text.length === 0) return false
  if (text.length > 120) return false  // titles are short
  if (CONTENT_MARKERS.test(text)) return false  // starts with content marker

  const normText = normalize(text)
  const normTitle = normalize(title)

  if (normText.length === 0 || normTitle.length === 0) return false

  // Exact match
  if (normText === normTitle) return true

  // One contains the other (but text must be short enough to be a title)
  if (normText.length <= normTitle.length + 20) {
    if (normTitle.includes(normText) || normText.includes(normTitle)) return true
  }

  // Levenshtein-like similarity for close matches
  // (handles minor differences like "The Lord's Inheritance" vs "The Lords Inheritance")
  if (normText.length > 3 && normTitle.length > 3) {
    const shorter = normText.length < normTitle.length ? normText : normTitle
    const longer = normText.length < normTitle.length ? normTitle : normText
    if (shorter.length / longer.length > 0.7) {
      // Check word overlap
      const textWords = new Set(normText.split(" "))
      const titleWords = normTitle.split(" ")
      const overlap = titleWords.filter(w => textWords.has(w)).length
      if (overlap / titleWords.length >= 0.8) return true
    }
  }

  return false
}

function isPassageRef(html: string, text: string, passage: string): boolean {
  if (text.length > 80) return false
  if (CONTENT_MARKERS.test(text)) return false

  // Biblegateway link
  if (/biblegateway\.com/i.test(html)) return true

  // Plain passage text match
  if (passage) {
    const normText = normalize(text)
    const normPassage = normalize(passage)
    if (normText === normPassage) return true
    if (normPassage.startsWith(normText) || normText.startsWith(normPassage)) return true
  }

  // Looks like a bible reference: "Book Chapter:Verse-Verse" or just "Book Chapter"
  if (/^(\d\s+)?[a-z]+\s+\d+[:\-\d\s,]*$/i.test(text.trim()) && text.length < 50) return true

  return false
}

// ── Clean content for a single field ──
function cleanContent(html: string, title: string, passage: string): string {
  const parts = splitIntoParagraphs(html)
  if (parts.length === 0) return html

  let i = 0

  // Step 1: Check if first paragraph is a title (centered or not)
  if (i < parts.length) {
    const firstText = textContent(parts[i])
    if (isTitleMatch(firstText, title)) {
      i++ // skip title
      // Skip following empty paragraphs
      while (i < parts.length && isEmptyParagraph(parts[i])) i++
    }
  }

  // Step 2: Check if next paragraph is a passage reference
  if (i < parts.length) {
    const pText = textContent(parts[i])
    if (isPassageRef(parts[i], pText, passage)) {
      i++ // skip passage
      // Skip following empty paragraphs
      while (i < parts.length && isEmptyParagraph(parts[i])) i++
    }
  }

  if (i === 0) return html
  return parts.slice(i).join("")
}

// ── Main ──
console.log("Loading material map from SQL dump...")
const materialMap = loadMaterialMap()
console.log(`Loaded ${materialMap.size} rows`)

let cleanedQ = 0, cleanedA = 0, cleanedT = 0
let unchangedQ = 0, unchangedA = 0

for (const [legacyId, entry] of Object.entries(contentMap)) {
  const id = parseInt(legacyId)
  const material = materialMap.get(id)
  if (!material) continue

  if (entry.questions) {
    const cleaned = cleanContent(entry.questions, material.title, material.passage)
    if (cleaned !== entry.questions) { entry.questions = cleaned; cleanedQ++ }
    else unchangedQ++
  }
  if (entry.answers) {
    const cleaned = cleanContent(entry.answers, material.title, material.passage)
    if (cleaned !== entry.answers) { entry.answers = cleaned; cleanedA++ }
    else unchangedA++
  }
  if (entry.transcript) {
    const cleaned = cleanContent(entry.transcript, material.title, material.passage)
    if (cleaned !== entry.transcript) { entry.transcript = cleaned; cleanedT++ }
  }
}

console.log("\n=== Pass 2 Cleaning Summary ===")
console.log(`Questions cleaned: ${cleanedQ} (unchanged: ${unchangedQ})`)
console.log(`Answers cleaned: ${cleanedA} (unchanged: ${unchangedA})`)
console.log(`Transcripts cleaned: ${cleanedT}`)

writeFileSync("scripts/bible-study-content.json", JSON.stringify(contentMap), "utf-8")
const sizeMB = (readFileSync("scripts/bible-study-content.json").length / (1024 * 1024)).toFixed(1)
console.log(`\nOutput: scripts/bible-study-content.json (${sizeMB} MB)`)

// Show samples
console.log("\n=== Sample cleaned entries ===")
const sampleIds = ["7745", "7748", "7637", "7668", "9317", "9308"]
for (const sid of sampleIds) {
  const material = materialMap.get(parseInt(sid))
  if (contentMap[sid]?.questions) {
    console.log(`\n--- legacyId ${sid} "${material?.title}" questions (first 400 chars) ---`)
    console.log(contentMap[sid].questions!.substring(0, 400))
  }
}
