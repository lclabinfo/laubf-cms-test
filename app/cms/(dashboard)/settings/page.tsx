"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSession, signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Sun, Moon, Monitor, Check, Palette, User, Loader2, Shield, KeyRound } from "lucide-react"
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
  hasPassword: boolean
  hasGoogle: boolean
  googleEmail: string | null
}

function AccountCard({
  profile,
  loading,
  onProfileUpdate,
}: {
  profile: ProfileData | null
  loading: boolean
  onProfileUpdate: (p: ProfileData) => void
}) {
  const { update: updateSession } = useSession()
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName)
      setLastName(profile.lastName)
    }
  }, [profile])

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
      onProfileUpdate({ ...profile!, firstName: firstName.trim(), lastName: lastName.trim() })
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
                setFirstName(profile!.firstName)
                setLastName(profile!.lastName)
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function SecurityCard({ profile, onProfileRefresh }: { profile: ProfileData | null; onProfileRefresh: () => void }) {
  const searchParams = useSearchParams()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Handle Google link callback
  useEffect(() => {
    if (searchParams.get("googleLinked") === "true") {
      onProfileRefresh()
      toast.success("Google account connected successfully")
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete("googleLinked")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams, onProfileRefresh])

  const handleConnectGoogle = () => {
    setIsGoogleLoading(true)
    signIn("google", { callbackUrl: "/cms/settings?googleLinked=true" })
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/v1/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(profile?.hasPassword ? { currentPassword } : {}),
          newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update password")
      }
      toast.success(profile?.hasPassword ? "Password changed" : "Password set")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      onProfileRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password")
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-4" />
          Security
        </CardTitle>
        <CardDescription>
          Manage your sign-in methods and account security.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Connected accounts */}
        <div className="space-y-3">
          <Label>Connected accounts</Label>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <GoogleIcon />
              <div>
                <p className="text-sm font-medium">Google</p>
                {profile.hasGoogle ? (
                  <p className="text-xs text-muted-foreground">{profile.googleEmail}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Not connected</p>
                )}
              </div>
            </div>
            {profile.hasGoogle ? (
              <Badge variant="secondary">Connected</Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnectGoogle}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : null}
                Connect
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Password section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            <Label>{profile.hasPassword ? "Change password" : "Set password"}</Label>
          </div>
          {!profile.hasPassword && (
            <p className="text-xs text-muted-foreground">
              Add a password so you can also sign in with email and password.
            </p>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            {profile.hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-xs">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs">
                {profile.hasPassword ? "New password" : "Password"}
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Min 8 chars, upper + lower + number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword" className="text-xs">Confirm password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={saving || !newPassword || !confirmPassword}>
                {saving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                {profile.hasPassword ? "Change password" : "Set password"}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const { theme, accent, setTheme, setAccent } = useCmsTheme()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(() => {
    fetch("/api/v1/account")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setProfile(res.data)
        }
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

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
      <AccountCard profile={profile} loading={loading} onProfileUpdate={setProfile} />

      {/* Security card */}
      <Suspense>
        <SecurityCard profile={profile} onProfileRefresh={fetchProfile} />
      </Suspense>

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
