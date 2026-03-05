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
import { convertDocxToHtml } from "@/lib/docx-import"
import type { StudySection, Attachment } from "@/lib/messages-data"

interface StudyTabProps {
  sections: StudySection[]
  onSectionsChange: (sections: StudySection[]) => void
  /** Called when a file import should also be added to the attachment list */
  onAttachmentAdd?: (attachment: Attachment) => void
  /** Bible version selector — lives on the Study tab since it's about study materials */
  bibleVersionSlot?: React.ReactNode
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function StudyTab({ sections, onSectionsChange, onAttachmentAdd, bibleVersionSlot }: StudyTabProps) {
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

      // Add imported file to attachment list
      if (onAttachmentAdd && !file.name.endsWith(".txt")) {
        const ext = file.name.split(".").pop()?.toLowerCase() || ""
        const type = ext === "docx" ? "DOCX" : ext === "doc" ? "DOC" : "OTHER"
        onAttachmentAdd({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          size: formatBytes(file.size),
          type,
        })
      }

      if (file.name.endsWith(".txt")) {
        // Plain text — read and convert to TipTap JSON
        const reader = new FileReader()
        reader.onload = () => {
          const text = reader.result as string
          handleContentChange(sectionId, plainTextToTiptapJson(text))
        }
        reader.readAsText(file)
      } else {
        // .docx — use service to convert to HTML, then to TipTap JSON
        try {
          const { generateJSON } = await import("@tiptap/html")
          const arrayBuffer = await file.arrayBuffer()

          const { html, isSerifDoc, serifFontFamily } = await convertDocxToHtml(arrayBuffer, file.name)

          // Convert HTML to TipTap JSON and inject font marks
          // Using generateJSON ensures reliable parsing of alignment/spacing.
          // Font is applied programmatically to the JSON tree to avoid CSS parsing issues.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const json = generateJSON(html, getExtensions()) as any

          if (isSerifDoc && serifFontFamily) {
            // Walk JSON tree and add textStyle mark with fontFamily to all text nodes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function addFontToTextNodes(node: any): void {
              if (node.type === "text") {
                const marks = node.marks || []
                const existing = marks.find((m: { type: string }) => m.type === "textStyle")
                if (existing) {
                  existing.attrs = { ...existing.attrs, fontFamily: serifFontFamily }
                } else {
                  marks.push({ type: "textStyle", attrs: { fontFamily: serifFontFamily } })
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
