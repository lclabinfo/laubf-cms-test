"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  /** ISO date string (YYYY-MM-DD) or undefined */
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  /** Optional minimum date (ISO string) */
  min?: string
  className?: string
  id?: string
  /** Disable the trigger button */
  disabled?: boolean
}

/**
 * A date picker built on shadcn Calendar + Popover.
 * Accepts and returns ISO date strings (YYYY-MM-DD).
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  min,
  className,
  id,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selected = value ? new Date(value + "T00:00:00") : undefined
  const minDate = min ? new Date(min + "T00:00:00") : undefined

  function handleSelect(day: Date | undefined) {
    if (!day) return
    const iso = format(day, "yyyy-MM-dd")
    onChange(iso)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          {selected ? format(selected, "MMM d, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          disabled={minDate ? { before: minDate } : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}
