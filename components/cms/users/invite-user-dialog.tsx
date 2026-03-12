"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"

// ── Types ────────────────────────────────────────────────────────────────────

interface RoleOption {
  id: string
  name: string
  slug: string
  description: string | null
  priority: number
  isSystem: boolean
}

interface PersonRecord {
  id: string
  firstName: string
  lastName: string
  preferredName?: string | null
  email?: string | null
}

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function displayName(p: PersonRecord): string {
  return p.preferredName
    ? `${p.preferredName} ${p.lastName}`
    : `${p.firstName} ${p.lastName}`
}

function initials(p: PersonRecord): string {
  const first = (p.preferredName || p.firstName || "").charAt(0)
  const last = (p.lastName || "").charAt(0)
  return `${first}${last}`.toUpperCase()
}

// ── Component ────────────────────────────────────────────────────────────────

export function InviteUserDialog({ open, onOpenChange, onSuccess }: InviteUserDialogProps) {
  // Shared state
  const [activeTab, setActiveTab] = useState<string>("existing")
  const [role, setRole] = useState("EDITOR")
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Existing member tab state
  const [people, setPeople] = useState<PersonRecord[]>([])
  const [memberEmails, setMemberEmails] = useState<Set<string>>(new Set())
  const [peopleLoaded, setPeopleLoaded] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedPerson, setSelectedPerson] = useState<PersonRecord | null>(null)

  // New person tab state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [newEmail, setNewEmail] = useState("")

  // ── Fetch roles on open ────────────────────────────────────────────────────

  useEffect(() => {
    if (open && roles.length === 0) {
      fetch("/api/v1/member-roles")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setRoles(data.data)
        })
        .catch(() => {})
    }
  }, [open, roles.length])

  // ── Fetch people + existing members on open ────────────────────────────────

  useEffect(() => {
    if (!open) return
    let cancelled = false

    Promise.all([
      fetch("/api/v1/people?pageSize=200").then((r) => r.json()),
      fetch("/api/v1/users").then((r) => r.json()),
    ])
      .then(([peopleJson, usersJson]) => {
        if (cancelled) return
        if (peopleJson.success && peopleJson.data) {
          setPeople(peopleJson.data)
        }
        if (usersJson.success && usersJson.data) {
          const emails = new Set<string>(
            usersJson.data
              .map((u: { email?: string }) => u.email?.toLowerCase())
              .filter(Boolean)
          )
          setMemberEmails(emails)
        }
        setPeopleLoaded(true)
      })
      .catch(console.error)

    return () => { cancelled = true }
  }, [open])

  // ── Reset state on close ───────────────────────────────────────────────────

  useEffect(() => {
    if (!open) {
      setActiveTab("existing")
      setRole("EDITOR")
      setSelectedPerson(null)
      setSearch("")
      setFirstName("")
      setLastName("")
      setNewEmail("")
      setPeopleLoaded(false)
    }
  }, [open])

  // ── Reset tab-specific state on tab switch ─────────────────────────────────

  function handleTabChange(value: string) {
    setActiveTab(value)
    // Clear existing member selection
    setSelectedPerson(null)
    setSearch("")
    // Clear new person fields
    setFirstName("")
    setLastName("")
    setNewEmail("")
  }

  // ── Filtered people for dropdown ───────────────────────────────────────────

  const filteredPeople = useMemo(() => {
    return people
      .filter((p) => {
        // Exclude people who are already church members
        if (p.email && memberEmails.has(p.email.toLowerCase())) return false
        return true
      })
      .filter((p) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        const name = displayName(p).toLowerCase()
        return (
          name.includes(q) ||
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          (p.email && p.email.toLowerCase().includes(q))
        )
      })
  }, [people, memberEmails, search])

  // ── Roles ──────────────────────────────────────────────────────────────────

  const assignableRoles = roles
    .filter((r) => r.slug !== "owner")
    .sort((a, b) => a.priority - b.priority)

  const selectedRoleName = useMemo(() => {
    const fromRoles = assignableRoles.find((r) => r.slug.toUpperCase() === role)
    if (fromRoles) return fromRoles.name
    const fallbacks: Record<string, string> = {
      VIEWER: "Viewer",
      EDITOR: "Editor",
      ADMIN: "Admin",
    }
    return fallbacks[role] || role
  }, [role, assignableRoles])

  // ── Submit ─────────────────────────────────────────────────────────────────

  const canSubmit = activeTab === "existing"
    ? !!selectedPerson?.email
    : !!(firstName.trim() && lastName.trim() && newEmail.trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)

    try {
      const payload =
        activeTab === "existing" && selectedPerson
          ? { email: selectedPerson.email, role, personId: selectedPerson.id }
          : { email: newEmail.trim(), firstName: firstName.trim(), lastName: lastName.trim(), role }

      const res = await fetch("/api/v1/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error?.message || "Failed to invite user")
        return
      }

      const invitedEmail = activeTab === "existing" ? selectedPerson?.email : newEmail.trim()
      toast.success(
        data.data.isNewUser
          ? `Invitation sent to ${invitedEmail}`
          : `${invitedEmail} added to this church`
      )
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error("Failed to invite user")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Invite someone to access this church&apos;s CMS. They&apos;ll receive
            an email with a link to set up their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full">
              <TabsTrigger value="existing" className="flex-1">
                Existing Member
              </TabsTrigger>
              <TabsTrigger value="new" className="flex-1">
                New Person
              </TabsTrigger>
            </TabsList>

            {/* ── Existing Member Tab ─────────────────────────────────── */}
            <TabsContent value="existing" className="space-y-3">
              <div className="space-y-2">
                <Label>Select a person</Label>
                <Command shouldFilter={false} className="h-auto rounded-lg border">
                  <CommandInput
                    placeholder="Search by name or email..."
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList className="h-[200px]">
                    {!peopleLoaded ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>No people found.</CommandEmpty>
                        {filteredPeople.length > 0 && (
                          <CommandGroup>
                            {filteredPeople.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={displayName(p)}
                                onSelect={() => {
                                  setSelectedPerson(p)
                                  setSearch("")
                                }}
                              >
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                  {initials(p)}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="truncate text-sm">
                                    {displayName(p)}
                                  </span>
                                  {p.email && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      {p.email}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </>
                    )}
                  </CommandList>
                </Command>
              </div>

              {/* Selected person card */}
              {selectedPerson && (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {initials(selectedPerson)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {displayName(selectedPerson)}
                    </p>
                    {selectedPerson.email ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedPerson.email}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        No email on file — cannot invite
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setSelectedPerson(null)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* ── New Person Tab ───────────────────────────────────────── */}
            <TabsContent value="new" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="invite-first-name">First name</Label>
                  <Input
                    id="invite-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    required={activeTab === "new"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-last-name">Last name</Label>
                  <Input
                    id="invite-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    required={activeTab === "new"}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-new-email">Email</Label>
                <Input
                  id="invite-new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  required={activeTab === "new"}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* ── Role selector (shared) ──────────────────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue placeholder="Select a role">
                  {selectedRoleName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.length > 0
                  ? assignableRoles.map((r) => (
                      <SelectItem
                        key={r.id}
                        value={r.slug.toUpperCase()}
                        textValue={r.name}
                        className="py-2.5"
                      >
                        <div>
                          <p className="font-medium">{r.name}</p>
                          {r.description && (
                            <p className="text-xs text-muted-foreground">
                              {r.description}
                            </p>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  : [
                      { value: "VIEWER", label: "Viewer", desc: "Read-only access" },
                      { value: "EDITOR", label: "Editor", desc: "Create and edit content" },
                      { value: "ADMIN", label: "Admin", desc: "Full content + site management" },
                    ].map((r) => (
                      <SelectItem
                        key={r.value}
                        value={r.value}
                        textValue={r.label}
                        className="py-2.5"
                      >
                        <div>
                          <p className="font-medium">{r.label}</p>
                          <p className="text-xs text-muted-foreground">{r.desc}</p>
                        </div>
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
