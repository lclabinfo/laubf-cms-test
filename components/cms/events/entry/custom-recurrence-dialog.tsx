"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Toggle } from "@/components/ui/toggle"
import {
  allDays,
  dayLabels,
  type CustomRecurrence,
  type DayOfWeek,
  type RecurrenceEndType,
} from "@/lib/events-data"

interface CustomRecurrenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValue?: CustomRecurrence
  onSubmit: (value: CustomRecurrence) => void
}

export function CustomRecurrenceDialog({
  open,
  onOpenChange,
  initialValue,
  onSubmit,
}: CustomRecurrenceDialogProps) {
  if (!open) return null
  return (
    <CustomRecurrenceDialogInner
      onOpenChange={onOpenChange}
      initialValue={initialValue}
      onSubmit={onSubmit}
    />
  )
}

function CustomRecurrenceDialogInner({
  onOpenChange,
  initialValue,
  onSubmit,
}: Omit<CustomRecurrenceDialogProps, "open">) {
  const [interval, setInterval] = useState(initialValue?.interval ?? 1)
  const [days, setDays] = useState<DayOfWeek[]>(initialValue?.days ?? ["sun"])
  const [endType, setEndType] = useState<RecurrenceEndType>(initialValue?.endType ?? "never")
  const [endDate, setEndDate] = useState(initialValue?.endDate ?? "")
  const [endAfter, setEndAfter] = useState(initialValue?.endAfter ?? 10)

  function toggleDay(day: DayOfWeek) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  function handleSubmit() {
    onSubmit({
      interval: Math.max(1, interval),
      days: days.length > 0 ? days : ["sun"],
      endType,
      endDate: endType === "on-date" ? endDate : undefined,
      endAfter: endType === "after" ? endAfter : undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Custom Recurrence</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Interval */}
          <div className="space-y-2">
            <Label>Repeat every</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={52}
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">week(s)</span>
            </div>
          </div>

          {/* Days of week */}
          <div className="space-y-2">
            <Label>On these days</Label>
            <div className="flex gap-1">
              {allDays.map((day) => (
                <Toggle
                  key={day}
                  size="sm"
                  pressed={days.includes(day)}
                  onPressedChange={() => toggleDay(day)}
                  className="size-9 rounded-full p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  aria-label={dayLabels[day].full}
                >
                  {dayLabels[day].short}
                </Toggle>
              ))}
            </div>
          </div>

          {/* End condition */}
          <div className="space-y-3">
            <Label>Ends</Label>
            <RadioGroup
              value={endType}
              onValueChange={(v) => setEndType(v as RecurrenceEndType)}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="never" id="end-never" />
                <Label htmlFor="end-never" className="font-normal">Never</Label>
              </div>

              <div className="flex items-center gap-2">
                <RadioGroupItem value="on-date" id="end-date" />
                <Label htmlFor="end-date" className="font-normal">On</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={endType !== "on-date"}
                  className="w-auto"
                />
              </div>

              <div className="flex items-center gap-2">
                <RadioGroupItem value="after" id="end-after" />
                <Label htmlFor="end-after" className="font-normal">After</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={endAfter}
                  onChange={(e) => setEndAfter(Number(e.target.value))}
                  disabled={endType !== "after"}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">occurrences</span>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
