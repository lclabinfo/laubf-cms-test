"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, GripVertical } from "lucide-react"

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

  function updateMeeting(index: number, field: string, value: unknown) {
    const updated = [...meetings]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, meetings: updated })
  }

  function removeMeeting(index: number) {
    onChange({
      ...content,
      meetings: meetings.filter((_, i) => i !== index),
    })
  }

  function addMeeting() {
    onChange({
      ...content,
      meetings: [
        ...meetings,
        {
          title: "",
          description: "",
          time: "",
          days: [],
          location: "",
        },
      ],
    })
  }

  function toggleDay(meetingIndex: number, day: string) {
    const meeting = meetings[meetingIndex]
    const days = meeting.days.includes(day)
      ? meeting.days.filter((d) => d !== day)
      : [...meeting.days, day]
    updateMeeting(meetingIndex, "days", days)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Weekly Schedule"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Subtitle</Label>
        <Textarea
          value={subtitle}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          placeholder="Join us throughout the week."
          className="min-h-[60px]"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Meetings ({meetings.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addMeeting}>
            <Plus className="size-3.5 mr-1.5" />
            Add Meeting
          </Button>
        </div>

        {meetings.map((meeting, i) => (
          <div
            key={i}
            className="rounded-lg border p-4 space-y-3 relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical className="size-4" />
                <span className="text-xs font-medium">Meeting {i + 1}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => removeMeeting(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input
                value={meeting.title}
                onChange={(e) => updateMeeting(i, "title", e.target.value)}
                placeholder="Sunday Worship"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Description
              </Label>
              <Textarea
                value={meeting.description}
                onChange={(e) =>
                  updateMeeting(i, "description", e.target.value)
                }
                placeholder="Join us for worship and fellowship."
                className="min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Time</Label>
                <Input
                  value={meeting.time}
                  onChange={(e) => updateMeeting(i, "time", e.target.value)}
                  placeholder="10:00 AM"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Location
                </Label>
                <Input
                  value={meeting.location}
                  onChange={(e) =>
                    updateMeeting(i, "location", e.target.value)
                  }
                  placeholder="Main Campus"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Days</Label>
              <div className="flex flex-wrap gap-1.5">
                {DAY_OPTIONS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(i, day)}
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
          </div>
        ))}

        {meetings.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
            No meetings added yet. Click &quot;Add Meeting&quot; to start.
          </div>
        )}
      </div>
    </div>
  )
}
