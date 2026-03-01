"use client"

import { Plus, Upload, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { plainTextToTiptapJson } from "@/lib/tiptap"
import type { StudySection } from "@/lib/messages-data"

interface StudyTabProps {
  sections: StudySection[]
  onSectionsChange: (sections: StudySection[]) => void
}

export function StudyTab({ sections, onSectionsChange }: StudyTabProps) {
  function handleContentChange(id: string, content: string) {
    onSectionsChange(
      sections.map((s) => (s.id === id ? { ...s, content } : s))
    )
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
          const mammoth = await import("mammoth")
          const arrayBuffer = await file.arrayBuffer()
          const result = await mammoth.convertToHtml({ arrayBuffer })
          // Pass HTML string — the editor will parse it via setContent
          handleContentChange(sectionId, result.value)
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
    )
  }

  const defaultTab = sections[0]?.id

  return (
    <div className="space-y-4">
      <Tabs defaultValue={defaultTab} key={defaultTab}>
        <TabsList variant="line">
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="space-y-4">
            {/* Section header with title + import action */}
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium flex-1">{section.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleImportDocx(section.id)}
              >
                <Upload className="size-3.5" />
                Import
              </Button>
            </div>

            {/* Rich text editor */}
            <RichTextEditor
              content={section.content}
              onContentChange={(json) => handleContentChange(section.id, json)}
              placeholder={`Write ${section.title.toLowerCase()} here...`}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
