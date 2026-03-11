"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Sun, Moon, Monitor, Check, Palette, User, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useCmsTheme } from "@/components/cms/theme-provider"

type ThemeOption = {
  value: "light" | "dark" | "system"
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const themeOptions: ThemeOption[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
]

type AccentOption = {
  value: "neutral" | "blue" | "green" | "violet" | "orange"
  label: string
  /** The swatch color shown in the UI */
  swatch: string
}

const accentOptions: AccentOption[] = [
  { value: "neutral", label: "Neutral", swatch: "bg-[oklch(0.45_0_0)]" },
  { value: "blue", label: "Blue", swatch: "bg-[oklch(0.55_0.2_255)]" },
  { value: "green", label: "Green", swatch: "bg-[oklch(0.55_0.17_155)]" },
  { value: "violet", label: "Violet", swatch: "bg-[oklch(0.55_0.2_295)]" },
  { value: "orange", label: "Orange", swatch: "bg-[oklch(0.65_0.2_50)]" },
]

const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
}

type ProfileData = {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  role: string
  roleName: string | null
  churchName: string
  linkedPersonId: string | null
}

function AccountCard() {
  const { data: session, update: updateSession } = useSession()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetch("/api/v1/account")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setProfile(res.data)
          setFirstName(res.data.firstName)
          setLastName(res.data.lastName)
        }
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!profile) return
    setDirty(firstName !== profile.firstName || lastName !== profile.lastName)
  }, [firstName, lastName, profile])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/v1/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update")
      }
      setProfile((prev) => prev ? { ...prev, firstName: firstName.trim(), lastName: lastName.trim() } : prev)
      setDirty(false)
      toast.success(
        json.data.linkedPersonSynced
          ? "Profile updated (people directory synced)"
          : "Profile updated"
      )
      // Refresh the session so sidebar name updates
      await updateSession()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Unable to load profile.</p>
        </CardContent>
      </Card>
    )
  }

  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() || "?"
  const displayRole = profile.roleName || roleLabels[profile.role] || profile.role

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="size-4" />
          Account
        </CardTitle>
        <CardDescription>
          Your personal profile and role at {profile.churchName}.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Avatar + role info */}
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="Avatar" />}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{profile.firstName} {profile.lastName}</span>
              <Badge variant="secondary">{displayRole}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
            {profile.linkedPersonId && (
              <p className="text-muted-foreground text-xs">
                Linked to people directory — changes sync automatically
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Editable fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={profile.email}
            disabled
            className="text-muted-foreground"
          />
          <p className="text-muted-foreground text-xs">
            Email cannot be changed from here. Contact an administrator.
          </p>
        </div>

        {dirty && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFirstName(profile.firstName)
                setLastName(profile.lastName)
                setDirty(false)
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              Save changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const { theme, accent, setTheme, setAccent } = useCmsTheme()

  return (
    <div className="pt-5 mx-auto w-full max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account and customize your CMS experience.
        </p>
      </div>

      {/* Account card */}
      <AccountCard />

      {/* Appearance card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-4" />
            Appearance
          </CardTitle>
          <CardDescription>
            Choose your preferred theme and accent color for the CMS interface.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Theme selector */}
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((opt) => {
                const active = theme === opt.value
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-5" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Accent color selector */}
          <div className="space-y-3">
            <Label>Accent Color</Label>
            <p className="text-muted-foreground text-xs">
              This changes the primary color used across buttons, links, and
              highlights.
            </p>
            <div className="flex flex-wrap gap-3">
              {accentOptions.map((opt) => {
                const active = accent === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAccent(opt.value)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        "relative flex size-9 items-center justify-center rounded-full transition-shadow",
                        opt.swatch,
                        active && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      )}
                    >
                      {active && (
                        <Check className="size-4 text-white" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        active
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
