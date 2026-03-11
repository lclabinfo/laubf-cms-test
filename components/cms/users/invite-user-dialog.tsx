"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2Icon } from "lucide-react"
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
import { toast } from "sonner"

interface RoleOption {
  id: string
  name: string
  slug: string
  description: string | null
  priority: number
  isSystem: boolean
}

interface PersonSuggestion {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InviteUserDialog({ open, onOpenChange, onSuccess }: InviteUserDialogProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("EDITOR")
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<RoleOption[]>([])

  // People search state
  const [suggestions, setSuggestions] = useState<PersonSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && roles.length === 0) {
      fetch("/api/v1/member-roles")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setRoles(data.data)
          }
        })
        .catch(() => {
          // Silently fail — the hardcoded fallback will be used
        })
    }
  }, [open, roles.length])

  // Debounced search for people as user types in the email field
  useEffect(() => {
    if (email.length < 2) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/people/search?q=${encodeURIComponent(email)}`)
        const data = await res.json()
        if (data.success && data.data.length > 0) {
          setSuggestions(data.data)
          setShowSuggestions(true)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [email])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Filter to roles assignable for invite (exclude Owner — typically can't invite as Owner)
  const assignableRoles = roles
    .filter((r) => r.slug !== "owner")
    .sort((a, b) => a.priority - b.priority)

  // Derive the selected role object for display in the trigger
  const selectedRole = useMemo(() => {
    const fromRoles = assignableRoles.find((r) => r.slug.toUpperCase() === role)
    if (fromRoles) return { name: fromRoles.name, description: fromRoles.description }
    // Fallback labels
    const fallbacks: Record<string, { name: string; description: string }> = {
      VIEWER: { name: "Viewer", description: "Read-only access" },
      EDITOR: { name: "Editor", description: "Create and edit content" },
      ADMIN: { name: "Admin", description: "Full content + site management" },
    }
    return fallbacks[role] || null
  }, [role, assignableRoles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/v1/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error?.message || "Failed to invite user")
        return
      }

      toast.success(
        data.data.isNewUser
          ? `Invitation sent to ${email}`
          : `${email} added to this church`,
      )
      setEmail("")
      setRole("EDITOR")
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error("Failed to invite user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Invite someone to access this church&apos;s CMS. They&apos;ll receive
            an email with a link to set up their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <div className="relative" ref={suggestionsRef}>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true)
                }}
                required
                placeholder="Search members or type an email"
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-[160px] overflow-y-auto">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between items-center"
                      onClick={() => {
                        setEmail(p.email)
                        setShowSuggestions(false)
                      }}
                    >
                      <div>
                        <p className="font-medium">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="invite-role" className="w-full text-left h-auto py-2.5">
                <SelectValue placeholder="Select a role">
                  {selectedRole && (
                    <div>
                      <p className="font-medium">{selectedRole.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
                    </div>
                  )}
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
                  : /* Fallback if roles haven't loaded yet */
                    [
                      { value: "VIEWER", label: "Viewer", desc: "Read-only access" },
                      { value: "EDITOR", label: "Editor", desc: "Create and edit content" },
                      { value: "ADMIN", label: "Admin", desc: "Full content + site management" },
                    ].map((r) => (
                      <SelectItem key={r.value} value={r.value} textValue={r.label} className="py-2.5">
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
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
