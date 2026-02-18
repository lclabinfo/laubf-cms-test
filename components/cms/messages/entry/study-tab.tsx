"use client"

import { Plus, Trash2, Pencil, Upload, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { plainTextToTiptapJson } from "@/lib/tiptap"
import type { StudySection } from "@/lib/messages-data"

interface StudyTabProps {
  sections: StudySection[]
  onSectionsChange: (sections: StudySection[]) => void
}

export function StudyTab({ sections, onSectionsChange }: StudyTabProps) {
  function handleAddSection() {
    const newSection: StudySection = {
      id: `ss-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      content: "",
    }
    onSectionsChange([...sections, newSection])
  }

  function handleDeleteSection(id: string) {
    onSectionsChange(sections.filter((s) => s.id !== id))
  }

  function handleTitleChange(id: string, title: string) {
    onSectionsChange(
      sections.map((s) => (s.id === id ? { ...s, title } : s))
    )
  }

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

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <FileText className="size-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No Bible Study Material</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
          Add study sections like Questions, Answers, or Discussion Notes for this message.
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => {
            onSectionsChange([
              { id: `ss-${Date.now()}-q`, title: "Questions", content: "" },
              { id: `ss-${Date.now()}-a`, title: "Answers", content: "" },
            ])
          }}>
            <Plus className="size-3.5" />
            Add Questions & Answers
          </Button>
          <Button variant="ghost" onClick={handleAddSection}>
            <Plus className="size-3.5" />
            Add Custom Section
          </Button>
        </div>
      </div>
    )
  }

  const defaultTab = sections[0]?.id

  return (
    <div className="space-y-4">
      <Tabs defaultValue={defaultTab} key={defaultTab}>
        <div className="flex items-center justify-between gap-2">
          <TabsList variant="line">
            {sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id}>
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button variant="ghost" size="sm" onClick={handleAddSection}>
            <Plus className="size-3.5" />
            Add Section
          </Button>
        </div>

        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="space-y-4">
            {/* Section header with title edit + actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Pencil className="size-3.5 text-muted-foreground" />
                <Input
                  value={section.title}
                  onChange={(e) => handleTitleChange(section.id, e.target.value)}
                  className="h-8 text-sm font-medium max-w-[200px]"
                  placeholder="Section title"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleImportDocx(section.id)}
                >
                  <Upload className="size-3.5" />
                  Import
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDeleteSection(section.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Rich text editor */}
            <RichTextEditor
              content={section.content}
              onContentChange={(json) => handleContentChange(section.id, json)}
              placeholder="Write study content here..."
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
