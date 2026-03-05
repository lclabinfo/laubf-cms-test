"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  X,
  ChevronsUpDown,
  Plus,
  Loader2,
  AlertTriangle,
  Pencil,
  Phone,
  Mail,
  Info,
  Star,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
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
import { cn } from "@/lib/utils"
import type { EventContact } from "@/lib/events-data"

// ── Types ────────────────────────────────────────────────────────────────────

interface PersonRecord {
  id: string
  firstName: string
  lastName: string
  preferredName?: string | null
  email?: string | null
  phone?: string | null
  mobilePhone?: string | null
  homePhone?: string | null
  photoUrl?: string | null
}

interface EventContactListProps {
  values: EventContact[]
  onChange: (contacts: EventContact[]) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function displayName(p: PersonRecord): string {
  return p.preferredName
    ? `${p.preferredName} ${p.lastName}`
    : `${p.firstName} ${p.lastName}`
}

function bestPhone(p: PersonRecord): string | null {
  return p.mobilePhone || p.phone || p.homePhone || null
}

/** Format digits as (XXX) XXX-XXXX */
function formatUSPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

/** Strip formatting to get raw digits for storage */
function stripPhone(formatted: string): string {
  return formatted.replace(/\D/g, "")
}

function slugify(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

// ── Main Component ───────────────────────────────────────────────────────────

export function EventContactList({ values, onChange }: EventContactListProps) {
  const [people, setPeople] = useState<PersonRecord[]>([])
  const [frequency, setFrequency] = useState<Record<string, number>>({})
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)
  const [fetched, setFetched] = useState(false)

  // Fetch people and frequency on mount and when fetchKey changes
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch("/api/v1/people?pageSize=200").then((r) => r.json()),
      fetch("/api/v1/events/contact-frequency").then((r) => r.json()),
    ])
      .then(([peopleJson, freqJson]) => {
        if (cancelled) return
        if (peopleJson.success && peopleJson.data) {
          setPeople(peopleJson.data)
        }
        if (freqJson.success && freqJson.data) {
          setFrequency(freqJson.data)
        }
        setFetched(true)
      })
      .catch(console.error)
    return () => { cancelled = true }
  }, [fetchKey])

  const loading = !fetched

  const refetchData = useCallback(() => {
    setFetchKey((k) => k + 1)
  }, [])

  // Match name -> person record
  const personByName = new Map<string, PersonRecord>()
  for (const p of people) {
    personByName.set(displayName(p), p)
  }

  const selectedNames = new Set(values.map((c) => c.name))

  // Dropdown options: sorted by frequency, filtered by search, exclude already selected
  const dropdownOptions = people
    .map((p) => {
      const name = displayName(p)
      return { person: p, name, freq: frequency[name] ?? 0 }
    })
    .filter((o) => !selectedNames.has(o.name))
    .filter((o) =>
      search.trim()
        ? o.name.toLowerCase().includes(search.toLowerCase()) ||
          o.person.firstName.toLowerCase().includes(search.toLowerCase()) ||
          o.person.lastName.toLowerCase().includes(search.toLowerCase()) ||
          (o.person.email && o.person.email.toLowerCase().includes(search.toLowerCase()))
        : true
    )
    .sort((a, b) => b.freq - a.freq)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // DnD uses name as id
  const sortableIds = values.map((c) => c.name)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortableIds.indexOf(active.id as string)
    const newIndex = sortableIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    onChange(arrayMove(values, oldIndex, newIndex))
  }

  function handleAdd(name: string) {
    if (!selectedNames.has(name)) {
      onChange([...values, { name }])
    }
    setDropdownOpen(false)
    setSearch("")
  }

  function handleRemove(name: string) {
    onChange(values.filter((c) => c.name !== name))
  }

  function handleLabelChange(name: string, label: string) {
    onChange(
      values.map((c) =>
        c.name === name ? { ...c, label: label || undefined } : c
      )
    )
  }

  function handleToggleMain(name: string) {
    onChange(
      values.map((c) =>
        c.name === name ? { ...c, isMain: !c.isMain || undefined } : c
      )
    )
  }

  return (
    <div className="space-y-2">
      {/* Contact rows with drag reorder */}
      {values.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {values.map((contact) => (
                <SortableContactRow
                  key={contact.name}
                  contact={contact}
                  person={personByName.get(contact.name) ?? null}
                  onRemove={() => handleRemove(contact.name)}
                  onEditContact={() => setEditingContact(contact.name)}
                  onLabelChange={(label) => handleLabelChange(contact.name, label)}
                  onToggleMain={() => handleToggleMain(contact.name)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add contact dropdown */}
      <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            Add a contact...
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search people..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No people found.</CommandEmpty>
                  {dropdownOptions.length > 0 && (
                    <CommandGroup>
                      {dropdownOptions.map((opt) => (
                        <CommandItem
                          key={opt.person.id}
                          value={opt.name}
                          onSelect={() => handleAdd(opt.name)}
                        >
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="truncate">{opt.name}</span>
                            {(opt.person.email || bestPhone(opt.person)) && (
                              <span className="text-xs text-muted-foreground truncate">
                                {[opt.person.email, bestPhone(opt.person)]
                                  .filter(Boolean)
                                  .join(" \u00B7 ")}
                              </span>
                            )}
                          </div>
                          {opt.freq > 0 && (
                            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 ml-2">
                              {opt.freq}x
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setDropdownOpen(false)
                    setCreateOpen(true)
                  }}
                >
                  <Plus className="size-4" />
                  Create new member...
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create new member dialog */}
      <CreateMemberDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(name) => {
          handleAdd(name)
          refetchData()
        }}
      />

      {/* Quick-edit contact info dialog */}
      {editingContact && (
        <QuickEditContactDialog
          open={!!editingContact}
          onOpenChange={(open) => {
            if (!open) setEditingContact(null)
          }}
          person={personByName.get(editingContact) ?? null}
          contactName={editingContact}
          onSaved={() => {
            setEditingContact(null)
            refetchData()
          }}
        />
      )}
    </div>
  )
}

// ── Sortable Contact Row ─────────────────────────────────────────────────────

interface SortableContactRowProps {
  contact: EventContact
  person: PersonRecord | null
  onRemove: () => void
  onEditContact: () => void
  onLabelChange: (label: string) => void
  onToggleMain: () => void
}

function SortableContactRow({
  contact,
  person,
  onRemove,
  onEditContact,
  onLabelChange,
  onToggleMain,
}: SortableContactRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.name })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  const hasContactInfo = person
    ? !!(person.email || bestPhone(person))
    : false

  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(contact.label ?? "")
  const labelInputRef = useRef<HTMLInputElement>(null)

  function handleLabelClick() {
    setLabelDraft(contact.label ?? "")
    setEditingLabel(true)
    setTimeout(() => labelInputRef.current?.focus(), 0)
  }

  function commitLabel() {
    setEditingLabel(false)
    onLabelChange(labelDraft.trim())
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card px-3 py-2.5",
        isDragging && "opacity-50 shadow-lg z-50",
      )}
    >
      {/* Row 1: Drag handle + Name + Star + Delete */}
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
        >
          <GripVertical className="size-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{contact.name}</p>

          {/* Label (inline below name) */}
          {editingLabel ? (
            <input
              ref={labelInputRef}
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value.slice(0, 20))}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitLabel()
                if (e.key === "Escape") { setEditingLabel(false); setLabelDraft(contact.label ?? "") }
              }}
              maxLength={20}
              className="mt-0.5 h-6 w-full max-w-48 rounded-md border bg-transparent px-2 text-xs outline-none focus:border-ring"
              placeholder="e.g. YAM Leader, Coordinator"
            />
          ) : contact.label ? (
            <button
              type="button"
              onClick={handleLabelClick}
              className="mt-0.5 flex items-center gap-1 h-5 rounded bg-secondary px-1.5 text-xs text-secondary-foreground hover:bg-secondary/80 transition-colors"
              title="Click to edit label"
            >
              {contact.label}
              <Pencil className="size-2.5 opacity-40" />
            </button>
          ) : null}

          {/* Contact info preview (tight below name/label) */}
          {person && hasContactInfo && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {[person.email, bestPhone(person)].filter(Boolean).join(" \u00B7 ")}
            </p>
          )}

          {person && !hasContactInfo && (
            <button
              type="button"
              onClick={onEditContact}
              className="flex items-center gap-1 mt-0.5 text-xs text-amber-600 dark:text-amber-400 hover:underline"
            >
              <AlertTriangle className="size-3 shrink-0" />
              No contact info — click to add
            </button>
          )}

          {!person && (
            <p className="text-xs text-muted-foreground italic mt-0.5">
              Not found in directory
            </p>
          )}
        </div>

        {/* Star toggle for main contact */}
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "size-8 shrink-0 transition-colors",
                  contact.isMain
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-muted-foreground/40 hover:text-amber-500",
                )}
                onClick={onToggleMain}
                aria-label={contact.isMain ? "Remove as main contact" : "Set as main contact"}
              >
                <Star className={cn("size-4", contact.isMain ? "fill-amber-500" : "")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {contact.isMain ? "Main contact (click to remove)" : "Set as main contact"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label={`Remove ${contact.name}`}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── Create Member Dialog ─────────────────────────────────────────────────────

interface CreateMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (name: string) => void
}

function CreateMemberDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateMemberDialogProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [creating, setCreating] = useState(false)

  function handleClose(open: boolean) {
    if (!open) {
      setFirstName("")
      setLastName("")
    }
    onOpenChange(open)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return

    setCreating(true)
    try {
      const slug = slugify(firstName.trim(), lastName.trim())
      const res = await fetch("/api/v1/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          slug,
        }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        const person = json.data as PersonRecord
        const name = displayName(person)
        toast.success(`Created ${name}`)
        onCreated(name)
        handleClose(false)
      } else {
        toast.error(json.error?.message ?? "Failed to create member")
      }
    } catch (error) {
      console.error("Failed to create person:", error)
      toast.error("Failed to create member")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create new member</DialogTitle>
          <DialogDescription>
            Add a new person to the church directory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-first-name">First name</Label>
            <Input
              id="contact-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-last-name">Last name</Label>
            <Input
              id="contact-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !firstName.trim() || !lastName.trim()}
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

// ── Quick-Edit Contact Info Dialog ───────────────────────────────────────────

interface QuickEditContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  person: PersonRecord | null
  contactName: string
  onSaved: () => void
}

function QuickEditContactDialog({
  open,
  onOpenChange,
  person,
  contactName,
  onSaved,
}: QuickEditContactDialogProps) {
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)

  // Initialize fields when person changes
  useEffect(() => {
    if (person) {
      setEmail(person.email ?? "")
      setPhone(formatUSPhone(bestPhone(person) ?? ""))
    }
  }, [person])

  if (!person) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit contact info</DialogTitle>
            <DialogDescription>
              &quot;{contactName}&quot; was not found in the church directory.
              You may need to create them first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!person) return

    setSaving(true)
    try {
      const body: Record<string, string> = {}
      if (email.trim()) body.email = email.trim()
      const rawPhone = stripPhone(phone)
      if (rawPhone) body.phone = rawPhone

      const res = await fetch(`/api/v1/people/${person.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Updated contact info for ${contactName}`)
        onSaved()
      } else {
        toast.error(json.error?.message ?? "Failed to update")
      }
    } catch (error) {
      console.error("Failed to update person:", error)
      toast.error("Failed to update contact info")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit contact info</DialogTitle>
          <DialogDescription>
            Add email or phone for {contactName} so visitors can reach them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-edit-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="quick-edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="pl-9"
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-edit-phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="quick-edit-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => {
                  const formatted = formatUSPhone(e.target.value)
                  setPhone(formatted)
                }}
                placeholder="(555) 123-4567"
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
            <Info className="size-3.5 mt-0.5 shrink-0" />
            <p>
              This will update the person&apos;s record in the church directory.
            </p>
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
              disabled={saving || (!email.trim() && !phone.trim())}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
