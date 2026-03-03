"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronsUpDown, UserPlus, Plus, Loader2, Search, Info } from "lucide-react"
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

interface Speaker {
  id: string
  name: string
}

interface Member {
  id: string
  firstName: string
  lastName: string
  preferredName?: string | null
  email?: string | null
}

interface SpeakerSelectProps {
  value: string
  onChange: (name: string, id?: string) => void
}

export function SpeakerSelect({ value, onChange }: SpeakerSelectProps) {
  const [open, setOpen] = useState(false)
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [search, setSearch] = useState("")

  // "Add from members" dialog state
  const [browseOpen, setBrowseOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [memberSearch, setMemberSearch] = useState("")

  // "Create new speaker" dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [creating, setCreating] = useState(false)

  const refreshSpeakers = useCallback(() => {
    fetch("/api/v1/people/by-role/speaker")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setSpeakers(
            json.data.map((p: { id: string; name: string }) => ({
              id: p.id,
              name: p.name,
            }))
          )
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    refreshSpeakers()
  }, [refreshSpeakers])

  const filtered = speakers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const showCustomOption = search.trim() && !speakers.some(
    (s) => s.name.toLowerCase() === search.trim().toLowerCase()
  )

  // Load members when browse dialog opens
  const handleBrowseOpen = () => {
    setOpen(false)
    setBrowseOpen(true)
    setMemberSearch("")
    setMembersLoading(true)
    fetch("/api/v1/people?pageSize=200")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setMembers(
            json.data.map((p: Member) => ({
              id: p.id,
              firstName: p.firstName,
              lastName: p.lastName,
              preferredName: p.preferredName,
              email: p.email,
            }))
          )
        }
      })
      .catch(console.error)
      .finally(() => setMembersLoading(false))
  }

  const handleSelectMember = async (member: Member) => {
    try {
      const res = await fetch("/api/v1/people/by-role/speaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: member.id }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        onChange(json.data.name, json.data.id)
        refreshSpeakers()
      }
    } catch (error) {
      console.error("Failed to add member as speaker:", error)
    }
    setBrowseOpen(false)
  }

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
      const res = await fetch("/api/v1/people/by-role/speaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
        }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        onChange(json.data.name, json.data.id)
        refreshSpeakers()
      }
    } catch (error) {
      console.error("Failed to create speaker:", error)
    } finally {
      setCreating(false)
      setCreateOpen(false)
    }
  }

  // Filter members client-side
  const filteredMembers = members.filter((m) => {
    if (!memberSearch.trim()) return true
    const q = memberSearch.toLowerCase()
    const displayName = m.preferredName
      ? `${m.preferredName} ${m.lastName}`
      : `${m.firstName} ${m.lastName}`
    return (
      displayName.toLowerCase().includes(q) ||
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q))
    )
  })

  return (
    <>
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
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={handleBrowseOpen}>
                  <UserPlus className="size-4" />
                  Add from members...
                </CommandItem>
                <CommandItem onSelect={handleCreateOpen}>
                  <Plus className="size-4" />
                  Create new speaker...
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Add from members dialog */}
      <Dialog open={browseOpen} onOpenChange={setBrowseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add from members</DialogTitle>
            <DialogDescription>
              Select a church member to add as a speaker.
            </DialogDescription>
          </DialogHeader>
          <Command className="border rounded-md" shouldFilter={false}>
            <CommandInput
              placeholder="Search members..."
              value={memberSearch}
              onValueChange={setMemberSearch}
            />
            <CommandList className="max-h-64">
              {membersLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No members found.</CommandEmpty>
                  <CommandGroup>
                    {filteredMembers.map((member) => {
                      const displayName = member.preferredName
                        ? `${member.preferredName} ${member.lastName}`
                        : `${member.firstName} ${member.lastName}`
                      return (
                        <CommandItem
                          key={member.id}
                          value={member.id}
                          onSelect={() => handleSelectMember(member)}
                        >
                          <div className="flex flex-col">
                            <span>{displayName}</span>
                            {member.email && (
                              <span className="text-xs text-muted-foreground">
                                {member.email}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* Create new speaker dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create new speaker</DialogTitle>
            <DialogDescription>
              This will create a new member entry in your directory and assign them as a speaker.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
            <Info className="size-4 mt-0.5 shrink-0" />
            <p>
              If this person is already a member, you can{" "}
              <button
                type="button"
                className="underline underline-offset-2 font-medium hover:text-blue-900 dark:hover:text-blue-100"
                onClick={() => {
                  setCreateOpen(false)
                  handleBrowseOpen()
                }}
              >
                search existing members
              </button>{" "}
              instead to avoid duplicates.
            </p>
          </div>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="speaker-first-name">First name</Label>
              <Input
                id="speaker-first-name"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                placeholder="First name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="speaker-last-name">Last name</Label>
              <Input
                id="speaker-last-name"
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
