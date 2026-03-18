"use client"

import { Separator } from "@/components/ui/separator"
import {
  EditorInput,
  EditorTextarea,
  TwoColumnGrid,
  ArrayField,
} from "./shared"

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

  return (
    <div className="space-y-6">
      <EditorInput
        label="Overline"
        value={overline}
        onChange={(val) => onChange({ ...content, overline: val })}
        placeholder="Get In Touch"
      />

      <EditorInput
        label="Heading"
        value={heading}
        onChange={(val) => onChange({ ...content, heading: val })}
        placeholder="Contact Us"
      />

      <EditorTextarea
        label="Description"
        value={description}
        onChange={(val) => onChange({ ...content, description: val })}
        placeholder="Fill out the form below and we will get back to you."
        className="min-h-[80px]"
      />

      <Separator />

      {/* Interest Options */}
      <ArrayField
        label="Interest Options"
        items={interestOptions}
        onItemsChange={(updated) =>
          onChange({ ...content, interestOptions: updated })
        }
        createItem={() => ({ label: "", value: "" })}
        addLabel="Add"
        emptyMessage="No interest options added yet."
        emptyDescription="Checkbox options visitors can select to indicate their interests"
        renderItem={(option, _i, updateItem) => (
          <TwoColumnGrid>
            <EditorInput
              label="Label"
              value={option.label}
              onChange={(val) => updateItem({ ...option, label: val })}
              placeholder="Visiting"
            />
            <EditorInput
              label="Value"
              value={option.value}
              onChange={(val) => updateItem({ ...option, value: val })}
              placeholder="visiting"
            />
          </TwoColumnGrid>
        )}
      />

      <Separator />

      {/* Campus Options */}
      <ArrayField
        label="Campus Options"
        items={campusOptions}
        onItemsChange={(updated) =>
          onChange({ ...content, campusOptions: updated })
        }
        createItem={() => ({ label: "", value: "" })}
        addLabel="Add"
        emptyMessage="No campus options added yet."
        emptyDescription="Dropdown options for selecting a campus location"
        renderItem={(option, _i, updateItem) => (
          <TwoColumnGrid>
            <EditorInput
              label="Label"
              value={option.label}
              onChange={(val) => updateItem({ ...option, label: val })}
              placeholder="Main Campus"
            />
            <EditorInput
              label="Value"
              value={option.value}
              onChange={(val) => updateItem({ ...option, value: val })}
              placeholder="main-campus"
            />
          </TwoColumnGrid>
        )}
      />

      <Separator />

      <EditorInput
        label="Bible Teacher Checkbox Label"
        value={bibleTeacherLabel}
        onChange={(val) => onChange({ ...content, bibleTeacherLabel: val })}
        placeholder="I am interested in becoming a Bible teacher."
        description="Optional checkbox at the bottom of the form. Leave empty to hide."
      />

      <Separator />

      <TwoColumnGrid>
        <EditorInput
          label="Submit Button Label"
          value={submitLabel}
          onChange={(val) => onChange({ ...content, submitLabel: val })}
          placeholder="Submit"
        />
        <EditorInput
          label="Success Message"
          value={successMessage}
          onChange={(val) => onChange({ ...content, successMessage: val })}
          placeholder="Thank you! We received your message."
        />
      </TwoColumnGrid>
    </div>
  )
}
