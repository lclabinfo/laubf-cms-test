"use client"

import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { ChurchIcon, Loader2Icon, CheckCircle2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { PasswordChecklist } from "@/components/ui/password-checklist"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
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

type InviteState = {
  memberStatus: string
  userEmail: string
  churchName: string
  hasGoogle: boolean
  hasPassword: boolean
}

function AcceptInviteForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const afterGoogle = searchParams.get("afterGoogle")

  const [inviteState, setInviteState] = useState<InviteState | null>(null)
  const [loadingState, setLoadingState] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  // Fetch invite state on mount
  useEffect(() => {
    if (!token) {
      setLoadingState(false)
      return
    }
    fetch(`/api/v1/auth/accept-invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setInviteState(res.data)
        } else {
          setLoadError(res.error?.message || "Invalid invitation.")
        }
      })
      .catch(() => setLoadError("Failed to validate invitation."))
      .finally(() => setLoadingState(false))
  }, [token])

  // After Google redirect: auto-activate (guard against double-fire in StrictMode)
  const activatingRef = useRef(false)
  const activateWithGoogle = useCallback(async () => {
    if (!token || activatingRef.current) return
    activatingRef.current = true
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, mode: "google" }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess(true)
      } else {
        setError(data.error?.message || "Failed to activate account.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (afterGoogle === "true" && inviteState && inviteState.memberStatus === "PENDING") {
      activateWithGoogle()
    }
  }, [afterGoogle, inviteState, activateWithGoogle])

  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Invalid Invitation</CardTitle>
          <CardDescription>
            This invitation link is invalid or has expired. Please ask the admin
            to send a new invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/cms/login">Go to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loadingState) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (loadError) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Invalid Invitation</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/cms/login">Go to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Already accepted
  if (inviteState && inviteState.memberStatus !== "PENDING") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CheckCircle2Icon className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <CardTitle className="text-xl">Already Accepted</CardTitle>
          <CardDescription>
            This invitation has already been accepted. Sign in to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/cms/login">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CheckCircle2Icon className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <CardTitle className="text-xl">Welcome!</CardTitle>
          <CardDescription>
            Your account is ready. Sign in to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/cms/login">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // After Google redirect, show loading while auto-activating
  if (afterGoogle === "true") {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
          {error ? (
            <>
              <p className="text-sm text-destructive text-center">{error}</p>
              <Button asChild variant="outline" className="mt-2">
                <Link href="/cms/login">Go to Sign In</Link>
              </Button>
            </>
          ) : (
            <>
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Activating your account...</p>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true)
    const callbackUrl = `/cms/accept-invite?token=${encodeURIComponent(token)}&afterGoogle=true`
    signIn("google", { callbackUrl })
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/v1/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, firstName, lastName, password, mode: "password" }),
      })
      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.error?.message || "Something went wrong.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <ChurchIcon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Accept Invitation</CardTitle>
        <CardDescription>
          {inviteState?.churchName
            ? `You've been invited to join ${inviteState.churchName}. Choose how to set up your account.`
            : "Set up your account to get started."}
        </CardDescription>
        {inviteState?.userEmail && (
          <p className="text-xs text-muted-foreground mt-1">{inviteState.userEmail}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!showPasswordForm ? (
          <>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              <GoogleIcon />
              {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowPasswordForm(true)}
            >
              Set up with password
            </Button>
          </>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Min 8 chars, upper + lower + number"
              />
              <PasswordChecklist password={password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Set Up Account"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setShowPasswordForm(false)}
            >
              Back to options
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Suspense>
        <AcceptInviteForm />
      </Suspense>
    </div>
  )
}
