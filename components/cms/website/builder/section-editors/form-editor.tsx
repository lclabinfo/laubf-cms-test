"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, GripVertical } from "lucide-react"

interface FormEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

export function FormEditor({ content, onChange }: FormEditorProps) {
  const overline = (content.overline as string) ?? ""
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const interestOptions = (content.interestOptions as {
    label: string
    value: string
  }[]) ?? []
  const campusOptions = (content.campusOptions as {
    label: string
    value: string
  }[]) ?? []
  const bibleTeacherLabel = (content.bibleTeacherLabel as string) ?? ""
  const submitLabel = (content.submitLabel as string) ?? "Submit"
  const successMessage = (content.successMessage as string) ?? ""

  function updateInterestOption(
    index: number,
    field: "label" | "value",
    value: string,
  ) {
    const updated = [...interestOptions]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, interestOptions: updated })
  }

  function removeInterestOption(index: number) {
    onChange({
      ...content,
      interestOptions: interestOptions.filter((_, i) => i !== index),
    })
  }

  function addInterestOption() {
    onChange({
      ...content,
      interestOptions: [
        ...interestOptions,
        { label: "", value: "" },
      ],
    })
  }

  function updateCampusOption(
    index: number,
    field: "label" | "value",
    value: string,
  ) {
    const updated = [...campusOptions]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, campusOptions: updated })
  }

  function removeCampusOption(index: number) {
    onChange({
      ...content,
      campusOptions: campusOptions.filter((_, i) => i !== index),
    })
  }

  function addCampusOption() {
    onChange({
      ...content,
      campusOptions: [
        ...campusOptions,
        { label: "", value: "" },
      ],
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) => onChange({ ...content, overline: e.target.value })}
          placeholder="Get In Touch"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Contact Us"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          value={description}
          onChange={(e) =>
            onChange({ ...content, description: e.target.value })
          }
          placeholder="Fill out the form below and we will get back to you."
          className="min-h-[80px]"
        />
      </div>

      <Separator />

      {/* Interest Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">
              Interest Options ({interestOptions.length})
            </Label>
            <p className="text-xs text-muted-foreground">
              Checkbox options visitors can select to indicate their interests
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addInterestOption}>
            <Plus className="size-3.5 mr-1.5" />
            Add
          </Button>
        </div>

        {interestOptions.map((option, i) => (
          <div
            key={i}
            className="flex items-end gap-2"
          >
            <div className="flex items-center gap-2 self-center text-muted-foreground">
              <GripVertical className="size-4" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Label</Label>
              <Input
                value={option.label}
                onChange={(e) =>
                  updateInterestOption(i, "label", e.target.value)
                }
                placeholder="Visiting"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Value</Label>
              <Input
                value={option.value}
                onChange={(e) =>
                  updateInterestOption(i, "value", e.target.value)
                }
                placeholder="visiting"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => removeInterestOption(i)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}

        {interestOptions.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-4 text-center text-sm text-muted-foreground">
            No interest options yet.
          </div>
        )}
      </div>

      <Separator />

      {/* Campus Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">
              Campus Options ({campusOptions.length})
            </Label>
            <p className="text-xs text-muted-foreground">
              Dropdown options for selecting a campus location
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addCampusOption}>
            <Plus className="size-3.5 mr-1.5" />
            Add
          </Button>
        </div>

        {campusOptions.map((option, i) => (
          <div
            key={i}
            className="flex items-end gap-2"
          >
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Label</Label>
              <Input
                value={option.label}
                onChange={(e) =>
                  updateCampusOption(i, "label", e.target.value)
                }
                placeholder="Main Campus"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Value</Label>
              <Input
                value={option.value}
                onChange={(e) =>
                  updateCampusOption(i, "value", e.target.value)
                }
                placeholder="main-campus"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => removeCampusOption(i)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}

        {campusOptions.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-4 text-center text-sm text-muted-foreground">
            No campus options yet.
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Bible Teacher Checkbox Label
        </Label>
        <Input
          value={bibleTeacherLabel}
          onChange={(e) =>
            onChange({ ...content, bibleTeacherLabel: e.target.value })
          }
          placeholder="I am interested in becoming a Bible teacher."
        />
        <p className="text-xs text-muted-foreground">
          Optional checkbox at the bottom of the form. Leave empty to hide.
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Submit Button Label</Label>
          <Input
            value={submitLabel}
            onChange={(e) =>
              onChange({ ...content, submitLabel: e.target.value })
            }
            placeholder="Submit"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Success Message</Label>
          <Input
            value={successMessage}
            onChange={(e) =>
              onChange({ ...content, successMessage: e.target.value })
            }
            placeholder="Thank you! We received your message."
          />
        </div>
      </div>
    </div>
  )
}
