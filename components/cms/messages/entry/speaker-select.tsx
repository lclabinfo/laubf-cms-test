"use client"

import { useState, useEffect, useCallback } from "react"
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

interface MemberOption {
  id: string
  name: string
  messageCount: number
}

interface SpeakerSelectProps {
  value: string
  onChange: (name: string, id?: string) => void
}

export function SpeakerSelect({ value, onChange }: SpeakerSelectProps) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<MemberOption[]>([])
  const [search, setSearch] = useState("")

  const [createOpen, setCreateOpen] = useState(false)
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [creating, setCreating] = useState(false)

  const refreshOptions = useCallback(() => {
    fetch("/api/v1/speakers/frequent")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setOptions(json.data)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    refreshOptions()
  }, [refreshOptions])

  const filtered = options.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateOpen = () => {
    setOpen(false)
    setCreateOpen(true)
    setNewFirstName("")
    setNewLastName("")
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFirstName.trim() || !newLastName.trim()) return

    setCreating(true)
    try {
      const baseSlug = `${newFirstName}-${newLastName}`.toLowerCase().replace(/[^a-z0-9-]/g, "-")
      const res = await fetch("/api/v1/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          slug: baseSlug,
          membershipStatus: "VISITOR",
        }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        const name = json.data.preferredName
          ? `${json.data.preferredName} ${json.data.lastName}`
          : `${json.data.firstName} ${json.data.lastName}`
        onChange(name, json.data.id)
        refreshOptions()
      }
    } catch (error) {
      console.error("Failed to create member:", error)
    } finally {
      setCreating(false)
      setCreateOpen(false)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            {value || "Select messenger..."}
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search members..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No members found.</CommandEmpty>
              <CommandGroup>
                {filtered.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.name}
                    onSelect={() => {
                      onChange(opt.name, opt.id)
                      setOpen(false)
                      setSearch("")
                    }}
                    data-checked={value === opt.name}
                  >
                    <span className="flex-1">{opt.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {filtered.length === 0 && search.trim() && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem onSelect={handleCreateOpen}>
                      <Plus className="size-4" />
                      Create new member...
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create new member</DialogTitle>
            <DialogDescription>
              This will add a new member to your directory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="person-first-name">First name</Label>
              <Input
                id="person-first-name"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                placeholder="First name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-last-name">Last name</Label>
              <Input
                id="person-last-name"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                placeholder="Last name"
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
                disabled={creating || !newFirstName.trim() || !newLastName.trim()}
              >
                {creating && <Loader2 className="size-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
