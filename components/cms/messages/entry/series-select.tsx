"use client"

import { useState } from "react"
import { ChevronsUpDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import type { Series } from "@/lib/messages-data"

interface SeriesSelectProps {
  series: Series[]
  selectedId: string | null
  onChange: (id: string | null) => void
}

export function SeriesSelect({ series, selectedId, onChange }: SeriesSelectProps) {
  const [open, setOpen] = useState(false)

  const selected = series.find((s) => s.id === selectedId)

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            {selected ? selected.name : "Select series..."}
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search series..." />
            <CommandList>
              <CommandEmpty>No series found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                  data-checked={!selectedId}
                >
                  <span className="text-muted-foreground">None</span>
                </CommandItem>
                {series.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.name}
                    onSelect={() => {
                      onChange(s.id)
                      setOpen(false)
                    }}
                    data-checked={selectedId === s.id}
                  >
                    {s.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected && (
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="gap-1">
            {selected.name}
            <button
              type="button"
              onClick={() => onChange(null)}
              className="ml-0.5 rounded-full hover:bg-foreground/10"
            >
              <X className="size-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  )
}
