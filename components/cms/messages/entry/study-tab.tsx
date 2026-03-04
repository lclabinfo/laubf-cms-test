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
import { plainTextToTiptapJson, isTiptapContentEmpty } from "@/lib/tiptap"
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
        // .docx — use mammoth to convert to HTML, then pass to editor
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mammoth = await import("mammoth") as any
          const arrayBuffer = await file.arrayBuffer()

          // Transform paragraphs to preserve empty lines and detect indentation.
          // mammoth drops empty paragraphs and strips w:ind — we fix both here.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const transformParagraph = mammoth.transforms.paragraph(function (paragraph: any) {
            // 1. Preserve empty/whitespace-only paragraphs (blank lines in the document).
            //    mammoth drops paragraphs with no text content — inject a non-breaking space
            //    so they survive HTML generation. We normalize these in post-processing.
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

            // 2. Detect paragraph-level indentation (w:ind).
            //    Skip list items (they have their own indentation via numbering).
            const indentStart = parseInt(paragraph.indent?.start || "0", 10)
            if (indentStart > 0 && !paragraph.numbering && !paragraph.styleName?.startsWith("Heading")) {
              const level = Math.round(indentStart / 720) // 720 twips = 0.5 inch
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
                // Map common Word heading styles to HTML headings
                "p[style-name='Heading 1'] => h1:fresh",
                "p[style-name='Heading 2'] => h2:fresh",
                "p[style-name='Heading 3'] => h3:fresh",
                "p[style-name='Heading 4'] => h4:fresh",
                // Map indent levels to classes (max 4 levels)
                "p[style-name='indent-1'] => p.indent-1:fresh",
                "p[style-name='indent-2'] => p.indent-2:fresh",
                "p[style-name='indent-3'] => p.indent-3:fresh",
                "p[style-name='indent-4'] => p.indent-4:fresh",
              ],
            },
          )

          // Post-process HTML
          let html: string = result.value
          // Normalize whitespace-only paragraphs to empty <p></p> for Tiptap blank lines.
          // Matches <p> containing only whitespace and/or empty inline formatting tags.
          html = html.replace(/<p>(.*?)<\/p>/g, (match, inner) => {
            const text = inner.replace(/<[^>]+>/g, "").trim()
            if (!text || text === "\u00A0") return "<p></p>"
            return match
          })
          // Convert indent classes to inline margin-left (Tiptap Indent extension parses this)
          html = html.replace(/<p class="indent-(\d+)">/g, (_, level) =>
            `<p style="margin-left: ${parseInt(level) * 40}px">`)
          // Convert tab characters to em-spaces (HTML collapses \t to single space)
          html = html.replace(/\t/g, "\u2003\u2003")
          // Preserve consecutive spaces (Word often uses multiple spaces for alignment)
          html = html.replace(/ {2,}/g, (match) => "\u00A0".repeat(match.length - 1) + " ")

          handleContentChange(sectionId, html)
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
