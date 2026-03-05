"use client"

import { useState } from "react"
import { ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Series } from "@/lib/messages-data"

interface SeriesSelectProps {
  series: Series[]
  selectedId: string | null
  onChange: (id: string | null) => void
  onCreateSeries?: (name: string) => Series | Promise<Series>
}

export function SeriesSelect({ series, selectedId, onChange, onCreateSeries }: SeriesSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)

  const selected = series.find((s) => s.id === selectedId)

  const filtered = series.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const showCreateOption = search.trim() && !series.some(
    (s) => s.name.toLowerCase() === search.trim().toLowerCase()
  )

  function handleCreateOpen(prefill = "") {
    setOpen(false)
    setNewName(prefill)
    setCreateOpen(true)
  }

  async function handleQuickCreate(name: string) {
    if (!onCreateSeries || !name.trim()) return
    setOpen(false)
    setSearch("")
    try {
      const created = await onCreateSeries(name.trim())
      onChange(created.id)
    } catch (error) {
      console.error("Failed to create series:", error)
    }
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!onCreateSeries || !newName.trim()) return

    setCreating(true)
    try {
      const created = await onCreateSeries(newName.trim())
      onChange(created.id)
    } catch (error) {
      console.error("Failed to create series:", error)
    } finally {
      setCreating(false)
      setCreateOpen(false)
      setNewName("")
    }
  }

  return (
    <>
      <div className="space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between font-normal">
              {selected ? selected.name : "Select series..."}
              <ChevronsUpDown className="size-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search series..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>
                  <div className="py-2 text-center">
                    <p className="text-sm text-muted-foreground">No series found.</p>
                    {onCreateSeries && search.trim() && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleQuickCreate(search.trim())}
                      >
                        <Plus className="size-3.5" />
                        Create &ldquo;{search.trim()}&rdquo;
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__none__"
                    onSelect={() => {
                      onChange(null)
                      setOpen(false)
                      setSearch("")
                    }}
                    data-checked={!selectedId}
                  >
                    <span className="text-muted-foreground">None</span>
                  </CommandItem>
                  {filtered.map((s) => (
                    <CommandItem
                      key={s.id}
                      value={s.name}
                      onSelect={() => {
                        onChange(s.id)
                        setOpen(false)
                        setSearch("")
                      }}
                      data-checked={selectedId === s.id}
                    >
                      {s.name}
                    </CommandItem>
                  ))}
                  {showCreateOption && (
                    <CommandItem
                      value={`create-${search.trim()}`}
                      onSelect={() => handleQuickCreate(search.trim())}
                    >
                      <Plus className="size-3.5" />
                      Create &ldquo;{search.trim()}&rdquo;
                    </CommandItem>
                  )}
                </CommandGroup>
                {onCreateSeries && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem onSelect={() => handleCreateOpen(search)}>
                        <Plus className="size-4" />
                        Create new series...
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Create new series dialog */}
      {onCreateSeries && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Create new series</DialogTitle>
              <DialogDescription>
                Add a new message series. You can assign messages to it later.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="series-name">Series name</Label>
                <Input
                  id="series-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Gospel of John"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !newName.trim()}
                >
                  {creating && <Loader2 className="size-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
