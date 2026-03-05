"use client"

import { useState } from "react"
import { Plus, Upload, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { plainTextToTiptapJson, isTiptapContentEmpty, getExtensions } from "@/lib/tiptap"
import type { StudySection } from "@/lib/messages-data"

interface StudyTabProps {
  sections: StudySection[]
  onSectionsChange: (sections: StudySection[]) => void
  /** Bible version selector — lives on the Study tab since it's about study materials */
  bibleVersionSlot?: React.ReactNode
}

export function StudyTab({ sections, onSectionsChange, bibleVersionSlot }: StudyTabProps) {
  const [overwriteConfirmId, setOverwriteConfirmId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "")

  function handleContentChange(id: string, content: string) {
    onSectionsChange(
      sections.map((s) => (s.id === id ? { ...s, content } : s))
    )
  }

  function handleImportClick(sectionId: string) {
    const section = sections.find((s) => s.id === sectionId)
    if (section && !isTiptapContentEmpty(section.content)) {
      setOverwriteConfirmId(sectionId)
    } else {
      handleImportDocx(sectionId)
    }
  }

  async function handleImportDocx(sectionId: string) {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".docx,.doc,.txt"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      if (file.name.endsWith(".txt")) {
        // Plain text — read and convert to TipTap JSON
        const reader = new FileReader()
        reader.onload = () => {
          const text = reader.result as string
          handleContentChange(sectionId, plainTextToTiptapJson(text))
        }
        reader.readAsText(file)
      } else {
        // .docx — use mammoth to convert to HTML, then to TipTap JSON
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mammoth = await import("mammoth") as any
          const JSZip = (await import("jszip")).default
          const { generateJSON } = await import("@tiptap/html")
          const arrayBuffer = await file.arrayBuffer()

          const SERIF_FONTS = ["times new roman", "georgia", "garamond", "palatino", "cambria", "book antiqua", "palatino linotype"]

          // ── 1. Extract per-paragraph data + numbering + style spacing from raw DOCX XML ──
          // mammoth doesn't expose line-height, spacing, or list start numbers, so we read directly.
          interface DocxParaData {
            tag: "p" | "h"  // whether this becomes a <p> or <h1-4>
            lineHeight: number | null  // CSS line-height (w:line / 240)
            spacingBefore: number | null // points (w:before in twips / 20)
            spacingAfter: number | null  // points (w:after in twips / 20)
          }
          const nonListXmlParaData: DocxParaData[] = []
          // Ordered list start numbers: map from sequential <ol> index to start value
          const olStartNumbers: number[] = []
          // Style-level spacing defaults (from styles.xml)
          const styleSpacing = new Map<string, { before: number | null; after: number | null }>()
          try {
            const zip = await JSZip.loadAsync(arrayBuffer)
            const docXml = await zip.file("word/document.xml")?.async("string")

            // Parse styles.xml for heading spacing defaults
            const stylesXml = await zip.file("word/styles.xml")?.async("string")
            if (stylesXml) {
              const styleParser = new DOMParser()
              const stylesDoc = styleParser.parseFromString(stylesXml, "application/xml")
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

            // Parse numbering.xml for ordered list start numbers
            const numberingXml = await zip.file("word/numbering.xml")?.async("string")
            // Map: abstractNumId → start value for ilvl 0
            const abstractNumStarts = new Map<string, number>()
            // Map: numId → abstractNumId
            const numIdToAbstract = new Map<string, string>()
            if (numberingXml) {
              const numParser = new DOMParser()
              const numDoc = numParser.parseFromString(numberingXml, "application/xml")
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
              // Parse num entries (numId → abstractNumId mapping)
              const nums = numDoc.getElementsByTagNameNS(ns, "num")
              for (let i = 0; i < nums.length; i++) {
                const num = nums[i]
                const numId = num.getAttribute("w:numId")
                const abstractRef = num.getElementsByTagNameNS(ns, "abstractNumId")[0]
                const abstractId = abstractRef?.getAttribute("w:val")
                if (numId && abstractId) numIdToAbstract.set(numId, abstractId)
              }
            }

            if (docXml) {
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

          const result = await mammoth.convertToHtml(
            { arrayBuffer },
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
          let dominantFont: string | null = null
          const fontCounts = new Map<string, number>()
          for (const f of allFonts) {
            const key = f.toLowerCase()
            fontCounts.set(key, (fontCounts.get(key) || 0) + 1)
          }
          let maxFontCount = 0
          for (const [font, count] of fontCounts) {
            if (count > maxFontCount) {
              dominantFont = font
              maxFontCount = count
            }
          }
          const isSerifDoc = dominantFont !== null && SERIF_FONTS.includes(dominantFont)

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
          // For serif documents, set font-family on list containers so list markers
          // (numbers/bullets) also render in serif, not just the text spans inside.
          if (isSerifDoc) {
            const serifFont = `"${allFonts.find(f => f.toLowerCase() === dominantFont) || "Times New Roman"}", Georgia, serif`
            html = html.replace(/<ol/g, `<ol style="font-family: ${serifFont}"`)
            html = html.replace(/<ul/g, `<ul style="font-family: ${serifFont}"`)
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

          // ── 6. Convert HTML to TipTap JSON and inject font marks ──
          // Using generateJSON ensures reliable parsing of alignment/spacing.
          // Font is applied programmatically to the JSON tree to avoid CSS parsing issues.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const json = generateJSON(html, getExtensions()) as any

          if (isSerifDoc) {
            // Build font-family value matching the toolbar format
            const fontFamily = `"${allFonts.find(f => f.toLowerCase() === dominantFont) || "Times New Roman"}", Georgia, serif`
            // Walk JSON tree and add textStyle mark with fontFamily to all text nodes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function addFontToTextNodes(node: any): void {
              if (node.type === "text") {
                const marks = node.marks || []
                const existing = marks.find((m: { type: string }) => m.type === "textStyle")
                if (existing) {
                  existing.attrs = { ...existing.attrs, fontFamily }
                } else {
                  marks.push({ type: "textStyle", attrs: { fontFamily } })
                }
                node.marks = marks
              }
              if (node.content) {
                for (const child of node.content) {
                  addFontToTextNodes(child)
                }
              }
            }
            addFontToTextNodes(json)
          }

          handleContentChange(sectionId, JSON.stringify(json))
        } catch (err) {
          console.error("Failed to import DOCX:", err)
        }
      }
    }
    input.click()
  }

  function handleAddQuestionsAndAnswers() {
    onSectionsChange([
      { id: `ss-${Date.now()}-q`, title: "Questions", content: "" },
      { id: `ss-${Date.now()}-a`, title: "Answers", content: "" },
    ])
  }

  if (sections.length === 0) {
    return (
      <div id="field-study-content" className="space-y-6">
        {bibleVersionSlot}
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <FileText className="size-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No Bible Study Material</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">
            Add questions and answers for this message&apos;s bible study.
          </p>
          <Button variant="outline" className="mt-4" onClick={handleAddQuestionsAndAnswers}>
            <Plus className="size-3.5" />
            Add Questions & Answers
          </Button>
        </div>
      </div>
    )
  }

  const defaultTab = sections[0]?.id

  return (
    <div id="field-study-content" className="space-y-4">
      {bibleVersionSlot}
      <Tabs defaultValue={defaultTab} key={defaultTab} value={activeSection} onValueChange={setActiveSection}>
        <div className="flex items-center gap-2">
          <TabsList className="bg-muted p-0.5 rounded-lg h-8">
            {sections.map((section) => (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="rounded-md px-3 text-xs h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleImportClick(activeSection)}
          >
            <Upload className="size-3.5" />
            Import
          </Button>
        </div>

        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id}>
            <RichTextEditor
              content={section.content}
              onContentChange={(json) => handleContentChange(section.id, json)}
              placeholder={`Write ${section.title.toLowerCase()} here...`}
            />
          </TabsContent>
        ))}
      </Tabs>

      <AlertDialog open={!!overwriteConfirmId} onOpenChange={(open) => { if (!open) setOverwriteConfirmId(null) }}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-warning/10">
              <AlertCircle className="text-warning" />
            </AlertDialogMedia>
            <AlertDialogTitle>Replace existing content?</AlertDialogTitle>
            <AlertDialogDescription>
              This section already has content. Importing a file will replace everything currently in the editor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (overwriteConfirmId) handleImportDocx(overwriteConfirmId)
              setOverwriteConfirmId(null)
            }}>
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
