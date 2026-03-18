"use client"

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  EditorInput,
  EditorTextarea,
  TwoColumnGrid,
  ArrayField,
} from "./shared"

interface ScheduleEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

const DAY_OPTIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function ScheduleEditor({ content, onChange }: ScheduleEditorProps) {
  const heading = (content.heading as string) ?? ""
  const subtitle = (content.subtitle as string) ?? ""
  const meetings = (content.meetings as {
    title: string
    description: string
    time: string
    days: string[]
    location: string
  }[]) ?? []

  return (
    <div className="space-y-6">
      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(val) => onChange({ ...content, heading: val })}
        placeholder="Weekly Schedule"
      />

      <EditorTextarea
        label="Subtitle"
        labelSize="sm"
        value={subtitle}
        onChange={(val) => onChange({ ...content, subtitle: val })}
        placeholder="Join us throughout the week."
        className="min-h-[60px]"
      />

      <Separator />

      <ArrayField
        label="Meetings"
        items={meetings}
        onItemsChange={(updated) =>
          onChange({ ...content, meetings: updated })
        }
        createItem={() => ({
          title: "",
          description: "",
          time: "",
          days: [] as string[],
          location: "",
        })}
        addLabel="Add Meeting"
        emptyMessage='No meetings added yet. Click "Add Meeting" to start.'
        renderItem={(meeting, _i, updateItem) => (
          <>
            <EditorInput
              label="Title"
              value={meeting.title}
              onChange={(val) => updateItem({ ...meeting, title: val })}
              placeholder="Sunday Worship"
              labelSize="xs"
            />

            <EditorTextarea
              label="Description"
              value={meeting.description}
              onChange={(val) => updateItem({ ...meeting, description: val })}
              placeholder="Join us for worship and fellowship."
              labelSize="xs"
              className="min-h-[60px]"
            />

            <TwoColumnGrid>
              <EditorInput
                label="Time"
                value={meeting.time}
                onChange={(val) => updateItem({ ...meeting, time: val })}
                placeholder="10:00 AM"
                labelSize="xs"
              />
              <EditorInput
                label="Location"
                value={meeting.location}
                onChange={(val) => updateItem({ ...meeting, location: val })}
                placeholder="Main Campus"
                labelSize="xs"
              />
            </TwoColumnGrid>

            {/* Day selector - multi-select toggle, not single-select */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Days</Label>
              <div className="flex flex-wrap gap-1.5">
                {DAY_OPTIONS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const days = meeting.days.includes(day)
                        ? meeting.days.filter((d) => d !== day)
                        : [...meeting.days, day]
                      updateItem({ ...meeting, days })
                    }}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                      meeting.days.includes(day)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      />
    </div>
  )
}
