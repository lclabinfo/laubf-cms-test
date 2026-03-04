"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronsUpDown, UserPlus, Plus, Loader2, X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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

interface PersonOption {
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

// ── Single-select mode ──────────────────────────────────────────────────────

export interface PeopleSelectSingleProps {
  mode: "single"
  /** Role slug to filter people by (e.g. "speaker"). Fetches from /api/v1/people/by-role/[roleSlug] */
  roleSlug: string
  /** Display label for the role, used in dialogs (e.g. "speaker") */
  roleLabel?: string
  value: string
  onChange: (name: string, id?: string) => void
  placeholder?: string
}

// ── Multi-select mode ───────────────────────────────────────────────────────

export interface PeopleSelectMultiProps {
  mode: "multi"
  /** Role slug to filter people by. If omitted, shows all people. */
  roleSlug?: string
  /** Display label for the role, used in dialogs (e.g. "contact") */
  roleLabel?: string
  values: string[]
  onChange: (names: string[]) => void
  placeholder?: string
  /** If true, don't show "add new person" actions */
  noCreate?: boolean
}

export type PeopleSelectProps = PeopleSelectSingleProps | PeopleSelectMultiProps

export function PeopleSelect(props: PeopleSelectProps) {
  const roleSlug = props.roleSlug
  const roleLabel = props.roleLabel ?? "person"

  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<PersonOption[]>([])
  const [search, setSearch] = useState("")

  // "Add from members" dialog state
  const [browseOpen, setBrowseOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [memberSearch, setMemberSearch] = useState("")

  // "Create new person" dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [creating, setCreating] = useState(false)

  const refreshOptions = useCallback(() => {
    if (!roleSlug) return
    fetch(`/api/v1/people/by-role/${roleSlug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setOptions(
            json.data.map((p: { id: string; name: string }) => ({
              id: p.id,
              name: p.name,
            }))
          )
        }
      })
      .catch(console.error)
  }, [roleSlug])

  useEffect(() => {
    refreshOptions()
  }, [refreshOptions])

  // Current selected value(s) for display
  const currentValue = props.mode === "single" ? props.value : ""
  const currentValues = props.mode === "multi" ? props.values : []

  const filtered = options.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const showCustomOption =
    props.mode === "single" &&
    search.trim() &&
    !options.some((s) => s.name.toLowerCase() === search.trim().toLowerCase())

  const noCreate = props.mode === "multi" && props.noCreate

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
    if (!roleSlug) {
      // No role — just use the name directly
      const displayName = member.preferredName
        ? `${member.preferredName} ${member.lastName}`
        : `${member.firstName} ${member.lastName}`
      if (props.mode === "multi") {
        if (!currentValues.includes(displayName)) {
          props.onChange([...currentValues, displayName])
        }
      }
      setBrowseOpen(false)
      return
    }

    try {
      const res = await fetch(`/api/v1/people/by-role/${roleSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: member.id }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        if (props.mode === "single") {
          props.onChange(json.data.name, json.data.id)
        } else {
          if (!currentValues.includes(json.data.name)) {
            props.onChange([...currentValues, json.data.name])
          }
        }
        refreshOptions()
      }
    } catch (error) {
      console.error("Failed to add member:", error)
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
    if (!newFirstName.trim() || !newLastName.trim() || !roleSlug) return

    setCreating(true)
    try {
      const res = await fetch(`/api/v1/people/by-role/${roleSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
        }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        if (props.mode === "single") {
          props.onChange(json.data.name, json.data.id)
        } else {
          if (!currentValues.includes(json.data.name)) {
            props.onChange([...currentValues, json.data.name])
          }
        }
        refreshOptions()
      }
    } catch (error) {
      console.error("Failed to create person:", error)
    } finally {
      setCreating(false)
      setCreateOpen(false)
    }
  }

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

  // ── Render: multi-select pill display + popover ─────────────────────────

  if (props.mode === "multi") {
    return (
      <>
        {/* Pills */}
        {currentValues.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {currentValues.map((name) => (
              <Badge key={name} variant="secondary" className="gap-1 pr-1">
                {name}
                <button
                  type="button"
                  onClick={() => props.onChange(currentValues.filter((n) => n !== name))}
                  className="rounded-full hover:bg-foreground/10 p-0.5"
                  aria-label={`Remove ${name}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between font-normal">
              {props.placeholder ?? `Add ${roleLabel}...`}
              <ChevronsUpDown className="size-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={`Search ${roleLabel}s...`}
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>No {roleLabel}s found.</CommandEmpty>
                {filtered.length > 0 && (
                  <CommandGroup>
                    {filtered
                      .filter((opt) => !currentValues.includes(opt.name))
                      .map((opt) => (
                        <CommandItem
                          key={opt.id}
                          value={opt.name}
                          onSelect={() => {
                            props.onChange([...currentValues, opt.name])
                            setOpen(false)
                            setSearch("")
                          }}
                        >
                          {opt.name}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
                {!noCreate && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem onSelect={handleBrowseOpen}>
                        <UserPlus className="size-4" />
                        Add from members...
                      </CommandItem>
                      {roleSlug && (
                        <CommandItem onSelect={handleCreateOpen}>
                          <Plus className="size-4" />
                          Create new {roleLabel}...
                        </CommandItem>
                      )}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <BrowseMembersDialog
          open={browseOpen}
          onOpenChange={setBrowseOpen}
          loading={membersLoading}
          members={filteredMembers}
          memberSearch={memberSearch}
          onMemberSearchChange={setMemberSearch}
          onSelect={handleSelectMember}
          roleLabel={roleLabel}
        />

        {roleSlug && (
          <CreatePersonDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            roleLabel={roleLabel}
            newFirstName={newFirstName}
            setNewFirstName={setNewFirstName}
            newLastName={newLastName}
            setNewLastName={setNewLastName}
            creating={creating}
            onSubmit={handleCreateSubmit}
            onSwitchToBrowse={() => {
              setCreateOpen(false)
              handleBrowseOpen()
            }}
          />
        )}
      </>
    )
  }

  // ── Render: single-select ───────────────────────────────────────────────

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            {currentValue || (props.placeholder ?? `Select ${roleLabel}...`)}
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search ${roleLabel}s...`}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No {roleLabel}s found.</CommandEmpty>
              <CommandGroup>
                {filtered.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.name}
                    onSelect={() => {
                      props.onChange(opt.name, opt.id)
                      setOpen(false)
                      setSearch("")
                    }}
                    data-checked={currentValue === opt.name}
                  >
                    {opt.name}
                  </CommandItem>
                ))}
                {showCustomOption && (
                  <CommandItem
                    value={`custom-${search.trim()}`}
                    onSelect={() => {
                      props.onChange(search.trim())
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
                {roleSlug && (
                  <CommandItem onSelect={handleCreateOpen}>
                    <Plus className="size-4" />
                    Create new {roleLabel}...
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <BrowseMembersDialog
        open={browseOpen}
        onOpenChange={setBrowseOpen}
        loading={membersLoading}
        members={filteredMembers}
        memberSearch={memberSearch}
        onMemberSearchChange={setMemberSearch}
        onSelect={handleSelectMember}
        roleLabel={roleLabel}
      />

      {roleSlug && (
        <CreatePersonDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          roleLabel={roleLabel}
          newFirstName={newFirstName}
          setNewFirstName={setNewFirstName}
          newLastName={newLastName}
          setNewLastName={setNewLastName}
          creating={creating}
          onSubmit={handleCreateSubmit}
          onSwitchToBrowse={() => {
            setCreateOpen(false)
            handleBrowseOpen()
          }}
        />
      )}
    </>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────

interface BrowseMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  members: Member[]
  memberSearch: string
  onMemberSearchChange: (value: string) => void
  onSelect: (member: Member) => void
  roleLabel: string
}

function BrowseMembersDialog({
  open,
  onOpenChange,
  loading,
  members,
  memberSearch,
  onMemberSearchChange,
  onSelect,
  roleLabel,
}: BrowseMembersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add from members</DialogTitle>
          <DialogDescription>
            Select a church member to add as a {roleLabel}.
          </DialogDescription>
        </DialogHeader>
        <Command className="border rounded-md" shouldFilter={false}>
          <CommandInput
            placeholder="Search members..."
            value={memberSearch}
            onValueChange={onMemberSearchChange}
          />
          <CommandList className="max-h-64">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>No members found.</CommandEmpty>
                <CommandGroup>
                  {members.map((member) => {
                    const displayName = member.preferredName
                      ? `${member.preferredName} ${member.lastName}`
                      : `${member.firstName} ${member.lastName}`
                    return (
                      <CommandItem
                        key={member.id}
                        value={member.id}
                        onSelect={() => onSelect(member)}
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
  )
}

interface CreatePersonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roleLabel: string
  newFirstName: string
  setNewFirstName: (v: string) => void
  newLastName: string
  setNewLastName: (v: string) => void
  creating: boolean
  onSubmit: (e: React.FormEvent) => void
  onSwitchToBrowse: () => void
}

function CreatePersonDialog({
  open,
  onOpenChange,
  roleLabel,
  newFirstName,
  setNewFirstName,
  newLastName,
  setNewLastName,
  creating,
  onSubmit,
  onSwitchToBrowse,
}: CreatePersonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create new {roleLabel}</DialogTitle>
          <DialogDescription>
            This will create a new member entry in your directory and assign them as a {roleLabel}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-2.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
          <Info className="size-4 mt-0.5 shrink-0" />
          <p>
            If this person is already a member, you can{" "}
            <button
              type="button"
              className="underline underline-offset-2 font-medium hover:text-blue-900 dark:hover:text-blue-100"
              onClick={onSwitchToBrowse}
            >
              search existing members
            </button>{" "}
            instead to avoid duplicates.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
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
              onClick={() => onOpenChange(false)}
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
  )
}
