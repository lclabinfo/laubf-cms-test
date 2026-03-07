"use client"

import { useState, useRef } from "react"
import { Plus, Upload, FileText, AlertCircle, Paperclip, Loader2 } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { plainTextToTiptapJson, isTiptapContentEmpty, getExtensions } from "@/lib/tiptap"
import { convertDocxToHtml } from "@/lib/docx-import"
import type { StudySection, Attachment } from "@/lib/messages-data"

interface StudyTabProps {
  sections: StudySection[]
  onSectionsChange: (sections: StudySection[]) => void
  /** Called when a file import should also be added to the attachment list */
  onAttachmentAdd?: (attachment: Attachment) => void
  /** Existing attachments — shown in the import picker for re-importing */
  attachments?: Attachment[]
  /** Bible version selector — lives on the Study tab since it's about study materials */
  bibleVersionSlot?: React.ReactNode
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Walk a TipTap JSON tree and add textStyle mark with fontFamily to all text nodes.
 * Used for both .doc and .docx imports when a serif font is detected.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addFontToTextNodes(node: any, fontFamily: string): void {
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
      addFontToTextNodes(child, fontFamily)
    }
  }
}

export function StudyTab({ sections, onSectionsChange, onAttachmentAdd, attachments = [], bibleVersionSlot }: StudyTabProps) {
  const [overwriteConfirmId, setOverwriteConfirmId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "")
  const [importPickerOpen, setImportPickerOpen] = useState(false)
  const [importingFromAttachment, setImportingFromAttachment] = useState(false)

  // Filter attachments to only show importable document types
  const docAttachments = attachments.filter((a) =>
    /\.(docx?|txt)$/i.test(a.name) && a.url
  )

  function handleContentChange(id: string, content: string) {
    onSectionsChange(
      sections.map((s) => (s.id === id ? { ...s, content } : s))
    )
  }

  function handleImportClick(sectionId: string) {
    // If there are existing doc attachments, show the picker dialog
    if (docAttachments.length > 0) {
      setImportPickerOpen(true)
      return
    }
    // No existing attachments — go straight to file picker
    const section = sections.find((s) => s.id === sectionId)
    if (section && !isTiptapContentEmpty(section.content)) {
      setOverwriteConfirmId(sectionId)
    } else {
      handleImportDocx(sectionId)
    }
  }

  function handleImportNewFile() {
    setImportPickerOpen(false)
    const section = sections.find((s) => s.id === activeSection)
    if (section && !isTiptapContentEmpty(section.content)) {
      setOverwriteConfirmId(activeSection)
    } else {
      handleImportDocx(activeSection)
    }
  }

  async function handleImportFromAttachment(attachment: Attachment) {
    if (!attachment.url) return
    setImportingFromAttachment(true)

    try {
      const res = await fetch(attachment.url)
      if (!res.ok) throw new Error(`Failed to fetch attachment: ${res.status}`)
      const blob = await res.blob()

      const sectionId = activeSection
      const section = sections.find((s) => s.id === sectionId)
      const hasContent = section && !isTiptapContentEmpty(section.content)

      // Parse the file content
      const content = await parseDocumentBlob(blob, attachment.name)
      if (!content) {
        console.error("Failed to parse attachment content")
        return
      }

      if (hasContent) {
        // Store parsed content and show overwrite confirmation
        pendingImportContentRef.current = content
        setImportPickerOpen(false)
        setOverwriteConfirmId(sectionId)
      } else {
        handleContentChange(sectionId, content)
        setImportPickerOpen(false)
      }
    } catch (err) {
      console.error("Failed to import from attachment:", err)
    } finally {
      setImportingFromAttachment(false)
    }
  }

  /** Parse a document blob (.doc/.docx/.txt) into TipTap JSON string */
  async function parseDocumentBlob(blob: Blob, filename: string): Promise<string | null> {
    try {
      if (filename.endsWith(".txt")) {
        const text = await blob.text()
        return plainTextToTiptapJson(text)
      } else if (filename.toLowerCase().endsWith(".doc") && !filename.toLowerCase().endsWith(".docx")) {
        // .doc — use server-side conversion
        const formData = new FormData()
        formData.append("file", blob, filename)
        const res = await fetch("/api/v1/convert-doc", { method: "POST", body: formData })
        if (!res.ok) throw new Error(`Conversion failed: ${res.status}`)
        const { data } = await res.json()
        const { html, isSerifDoc, serifFontFamily } = data
        const { generateJSON } = await import("@tiptap/html")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = generateJSON(html, getExtensions()) as any
        if (isSerifDoc && serifFontFamily) addFontToTextNodes(json, serifFontFamily)
        return JSON.stringify(json)
      } else {
        // .docx
        const arrayBuffer = await blob.arrayBuffer()
        const { html, isSerifDoc, serifFontFamily } = await convertDocxToHtml(arrayBuffer, filename)
        const { generateJSON } = await import("@tiptap/html")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = generateJSON(html, getExtensions()) as any
        if (isSerifDoc && serifFontFamily) addFontToTextNodes(json, serifFontFamily)
        return JSON.stringify(json)
      }
    } catch (err) {
      console.error("Failed to parse document:", err)
      return null
    }
  }

  // Ref to hold pre-parsed content when importing from attachment + overwrite confirmation
  const pendingImportContentRef = useRef<string | null>(null)

  async function handleImportDocx(sectionId: string) {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".docx,.doc,.txt"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Add imported file to attachment list (upload to R2 first)
      if (onAttachmentAdd && !file.name.endsWith(".txt")) {
        const ext = file.name.split(".").pop()?.toLowerCase() || ""
        const type = ext === "docx" ? "DOCX" : ext === "doc" ? "DOC" : "OTHER"
        try {
          const res = await fetch("/api/v1/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type || "application/octet-stream",
              fileSize: file.size,
              context: "bible-study",
            }),
          })
          if (!res.ok) throw new Error(`Failed to get upload URL: ${res.status}`)
          const json = await res.json()
          const { uploadUrl, key, publicUrl } = json.data

          const putRes = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type || "application/octet-stream" },
          })
          if (!putRes.ok) throw new Error(`R2 upload failed: ${putRes.status}`)

          onAttachmentAdd({
            id: crypto.randomUUID(),
            name: file.name,
            size: formatBytes(file.size),
            type,
            url: publicUrl,
            r2Key: key,
            fileSize: file.size,
          })
        } catch (err) {
          console.error(`Failed to upload ${file.name} to R2:`, err)
        }
      }

      if (file.name.endsWith(".txt")) {
        // Plain text — read and convert to TipTap JSON
        const reader = new FileReader()
        reader.onload = () => {
          const text = reader.result as string
          handleContentChange(sectionId, plainTextToTiptapJson(text))
        }
        reader.readAsText(file)
      } else if (file.name.toLowerCase().endsWith(".doc") && !file.name.toLowerCase().endsWith(".docx")) {
        // .doc (Word 97-2003 binary) — use server-side conversion API
        try {
          const formData = new FormData()
          formData.append("file", file)

          const res = await fetch("/api/v1/convert-doc", {
            method: "POST",
            body: formData,
          })

          if (!res.ok) {
            const errJson = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
            throw new Error(errJson.error || `Conversion failed: ${res.status}`)
          }

          const { data } = await res.json()
          const { html, isSerifDoc, serifFontFamily } = data

          const { generateJSON } = await import("@tiptap/html")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const json = generateJSON(html, getExtensions()) as any

          if (isSerifDoc && serifFontFamily) {
            addFontToTextNodes(json, serifFontFamily)
          }

          handleContentChange(sectionId, JSON.stringify(json))
        } catch (err) {
          console.error("Failed to import .doc file:", err)
        }
      } else {
        // .docx — use client-side mammoth service to convert to HTML, then to TipTap JSON
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
            addFontToTextNodes(json, serifFontFamily)
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
    const questionsId = `ss-${Date.now()}-q`
    onSectionsChange([
      { id: questionsId, title: "Questions", content: "" },
      { id: `ss-${Date.now()}-a`, title: "Answers", content: "" },
    ])
    setActiveSection(questionsId)
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

      <AlertDialog open={!!overwriteConfirmId} onOpenChange={(open) => {
        if (!open) {
          setOverwriteConfirmId(null)
          pendingImportContentRef.current = null
        }
      }}>
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
              if (overwriteConfirmId) {
                if (pendingImportContentRef.current) {
                  // Content already parsed (from attachment import)
                  handleContentChange(overwriteConfirmId, pendingImportContentRef.current)
                  pendingImportContentRef.current = null
                } else {
                  // Need to pick a file
                  handleImportDocx(overwriteConfirmId)
                }
              }
              setOverwriteConfirmId(null)
            }}>
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import picker — choose between uploading new file or using existing attachment */}
      <Dialog open={importPickerOpen} onOpenChange={setImportPickerOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Import into {sections.find((s) => s.id === activeSection)?.title ?? "section"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={handleImportNewFile}
            >
              <Upload className="size-4 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Upload new file</p>
                <p className="text-xs text-muted-foreground">.docx, .doc, or .txt from your computer</p>
              </div>
            </Button>

            {docAttachments.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or use existing attachment</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {docAttachments.map((att) => (
                    <Button
                      key={att.id}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-auto py-2.5 px-3"
                      disabled={importingFromAttachment}
                      onClick={() => handleImportFromAttachment(att)}
                    >
                      <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{att.name}</p>
                        <p className="text-xs text-muted-foreground">{att.size}</p>
                      </div>
                      {importingFromAttachment && (
                        <Loader2 className="size-3.5 animate-spin shrink-0" />
                      )}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
