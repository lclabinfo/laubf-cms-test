"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Search, Loader2, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGroups, type GroupData } from "@/lib/groups-context"
import type { GroupMemberRole } from "@/lib/generated/prisma/client"

type PersonResult = {
  id: string
  firstName: string
  lastName: string
  preferredName: string | null
  email: string | null
  photoUrl: string | null
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function displayName(p: PersonResult) {
  return p.preferredName ? `${p.preferredName} ${p.lastName}` : `${p.firstName} ${p.lastName}`
}

interface AddGroupMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: GroupData
}

type SelectedPerson = {
  person: PersonResult
  role: GroupMemberRole
}

export function AddGroupMembersDialog({ open, onOpenChange, group }: AddGroupMembersDialogProps) {
  const { addMember } = useGroups()
  const [search, setSearch] = useState("")
  const [people, setPeople] = useState<PersonResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Map<string, SelectedPerson>>(new Map())
  const [submitting, setSubmitting] = useState(false)

  const existingMemberIds = new Set(group.members.map((m) => m.personId))

  const searchPeople = useCallback(async (query: string) => {
    try {
      setSearching(true)
      const params = new URLSearchParams({ pageSize: "50" })
      if (query) params.set("search", query)
      const res = await fetch(`/api/v1/people?${params}`)
      if (!res.ok) throw new Error("Failed to search people")
      const json = await res.json()
      if (json.success) {
        setPeople(
          json.data.map((p: PersonResult) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            preferredName: p.preferredName ?? null,
            email: p.email ?? null,
            photoUrl: p.photoUrl ?? null,
          }))
        )
      }
    } catch {
      // silently fail
    } finally {
      setSearching(false)
    }
  }, [])

  // Initial load and search debounce
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => searchPeople(search), 300)
    return () => clearTimeout(timer)
  }, [search, open, searchPeople])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearch("")
      setSelected(new Map())
      setPeople([])
    }
  }, [open])

  const togglePerson = (person: PersonResult) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(person.id)) {
        next.delete(person.id)
      } else {
        next.set(person.id, { person, role: "MEMBER" })
      }
      return next
    })
  }

  const setPersonRole = (personId: string, role: GroupMemberRole) => {
    setSelected((prev) => {
      const next = new Map(prev)
      const existing = next.get(personId)
      if (existing) {
        next.set(personId, { ...existing, role })
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (selected.size === 0) return
    setSubmitting(true)
    try {
      let successCount = 0
      for (const [, { person, role }] of selected) {
        const ok = await addMember(group.id, person.id, role)
        if (ok) successCount++
      }
      if (successCount > 0) {
        toast.success(`${successCount} ${successCount === 1 ? "member" : "members"} added to ${group.name}`)
      }
      if (successCount < selected.size) {
        toast.error(`Failed to add ${selected.size - successCount} member(s)`)
      }
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
          <DialogDescription>
            Search for people to add to &ldquo;{group.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Selected badges */}
        {selected.size > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Array.from(selected.values()).map(({ person }) => (
              <Badge
                key={person.id}
                variant="secondary"
                className="gap-1 cursor-pointer"
                onClick={() => togglePerson(person)}
              >
                {displayName(person)}
                <span className="ml-0.5">&times;</span>
              </Badge>
            ))}
          </div>
        )}

        {/* Results */}
        <ScrollArea className="h-[280px] -mx-4 px-4">
          {searching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : people.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {search ? "No people found" : "Start typing to search"}
            </div>
          ) : (
            <div className="space-y-1">
              {people.map((person) => {
                const isExisting = existingMemberIds.has(person.id)
                const isSelected = selected.has(person.id)
                const selectedEntry = selected.get(person.id)

                return (
                  <div
                    key={person.id}
                    className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
                      isExisting
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:bg-muted"
                    }`}
                    onClick={() => {
                      if (!isExisting) togglePerson(person)
                    }}
                  >
                    <Checkbox
                      checked={isSelected || isExisting}
                      disabled={isExisting}
                      onCheckedChange={() => {
                        if (!isExisting) togglePerson(person)
                      }}
                      aria-label={`Select ${displayName(person)}`}
                    />
                    <Avatar size="sm">
                      {person.photoUrl && <AvatarImage src={person.photoUrl} alt={displayName(person)} />}
                      <AvatarFallback>
                        {getInitials(person.firstName, person.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{displayName(person)}</div>
                      {person.email && (
                        <div className="text-xs text-muted-foreground truncate">{person.email}</div>
                      )}
                    </div>
                    {isExisting ? (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        <Check className="size-3 mr-0.5" />
                        Member
                      </Badge>
                    ) : isSelected ? (
                      <Select
                        value={selectedEntry?.role ?? "MEMBER"}
                        onValueChange={(v) => setPersonRole(person.id, v as GroupMemberRole)}
                      >
                        <SelectTrigger
                          className="h-6 text-xs w-[90px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="CO_LEADER">Co-Leader</SelectItem>
                          <SelectItem value="LEADER">Leader</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || selected.size === 0}>
            {submitting
              ? "Adding..."
              : `Add ${selected.size} ${selected.size === 1 ? "Member" : "Members"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
