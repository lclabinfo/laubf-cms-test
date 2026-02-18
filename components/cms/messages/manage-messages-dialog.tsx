"use client"

import { useState, useEffect, useMemo } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Message, Series } from "@/lib/messages-data"

interface ManageMessagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  series: Series | null
  messages: Message[]
  onSave: (selectedMessageIds: string[]) => void
}

export function ManageMessagesDialog({
  open,
  onOpenChange,
  series,
  messages,
  onSave,
}: ManageMessagesDialogProps) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open && series) {
      setSearch("")
      setSelected(
        new Set(
          messages
            .filter((m) => m.seriesIds.includes(series.id))
            .map((m) => m.id)
        )
      )
    }
  }, [open, series, messages])

  const filtered = useMemo(() => {
    if (!search) return messages
    const q = search.toLowerCase()
    return messages.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.passage.toLowerCase().includes(q)
    )
  }, [messages, search])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSave() {
    onSave(Array.from(selected))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Messages</DialogTitle>
          <DialogDescription>
            Select messages to include in &ldquo;{series?.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-4 px-4 min-h-0 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No messages found.
            </p>
          ) : (
            filtered.map((m) => (
              <label
                key={m.id}
                className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(m.id)}
                  onCheckedChange={() => toggle(m.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug truncate">{m.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {m.passage} &middot; {m.date}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save ({selected.size} selected)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
