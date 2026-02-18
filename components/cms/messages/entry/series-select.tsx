"use client"

import { Check, ChevronsUpDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Series } from "@/lib/messages-data"

interface SeriesSelectProps {
  series: Series[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function SeriesSelect({ series, selectedIds, onChange }: SeriesSelectProps) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  function remove(id: string) {
    onChange(selectedIds.filter((s) => s !== id))
  }

  const selectedSeries = series.filter((s) => selectedIds.includes(s.id))

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            {selectedIds.length === 0
              ? "Select series..."
              : `${selectedIds.length} selected`}
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
          <div className="space-y-1">
            {series.length === 0 && (
              <p className="text-sm text-muted-foreground px-2 py-1">No series available</p>
            )}
            {series.map((s) => {
              const isSelected = selectedIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox checked={isSelected} tabIndex={-1} className="pointer-events-none" />
                  <span className="flex-1 text-left truncate">{s.name}</span>
                  {isSelected && <Check className="size-3.5 text-primary" />}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
      {selectedSeries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedSeries.map((s) => (
            <Badge key={s.id} variant="secondary" className="gap-1">
              {s.name}
              <button
                type="button"
                onClick={() => remove(s.id)}
                className="ml-0.5 rounded-full hover:bg-foreground/10"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
