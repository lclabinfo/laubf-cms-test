"use client"

import { useState, useEffect } from "react"
import { ChevronsUpDown } from "lucide-react"
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

interface Speaker {
  id: string
  name: string
}

interface SpeakerSelectProps {
  value: string
  onChange: (name: string, id?: string) => void
}

export function SpeakerSelect({ value, onChange }: SpeakerSelectProps) {
  const [open, setOpen] = useState(false)
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/v1/speakers")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setSpeakers(json.data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
        }
      })
      .catch(console.error)
  }, [])

  const filtered = speakers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const showCustomOption = search.trim() && !speakers.some(
    (s) => s.name.toLowerCase() === search.trim().toLowerCase()
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal">
          {value || "Select speaker..."}
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search speakers..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No speakers found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((speaker) => (
                <CommandItem
                  key={speaker.id}
                  value={speaker.name}
                  onSelect={() => {
                    onChange(speaker.name, speaker.id)
                    setOpen(false)
                    setSearch("")
                  }}
                  data-checked={value === speaker.name}
                >
                  {speaker.name}
                </CommandItem>
              ))}
              {showCustomOption && (
                <CommandItem
                  value={`custom-${search.trim()}`}
                  onSelect={() => {
                    onChange(search.trim())
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  Use &ldquo;{search.trim()}&rdquo;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
