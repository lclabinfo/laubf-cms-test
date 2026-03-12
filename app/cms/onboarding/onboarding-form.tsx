"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { ChurchIcon, Loader2Icon, CheckCircle2Icon, LogOutIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface OnboardingFormProps {
  userName: { firstName: string; lastName: string }
  userEmail: string
  churchName: string
  roleName: string
  devMode?: boolean
}

export function OnboardingForm({
  userName,
  userEmail,
  churchName,
  roleName,
  devMode,
}: OnboardingFormProps) {
  const router = useRouter()
  const [firstName, setFirstName] = useState(userName.firstName)
  const [lastName, setLastName] = useState(userName.lastName)
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (success) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CheckCircle2Icon className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <CardTitle className="text-xl">You&apos;re all set!</CardTitle>
          <CardDescription>
            Redirecting you to the dashboard...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Dev mode: skip API call, just show success
    if (devMode) {
      setSuccess(true)
      setTimeout(() => {
        router.push("/cms")
      }, 1500)
      return
    }

    try {
      const res = await fetch("/api/v1/auth/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone: phone || undefined }),
      })
      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        // Brief delay so the user sees the success state, then redirect
        setTimeout(() => {
          router.push("/cms")
          router.refresh()
        }, 1000)
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
    <>
    {devMode && (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-700 dark:text-amber-400 backdrop-blur-sm">
        Dev Preview — no data will be saved
      </div>
    )}
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <ChurchIcon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Welcome to {churchName}</CardTitle>
        <CardDescription>
          Complete your profile to get started.
        </CardDescription>
        {roleName && (
          <div className="flex justify-center pt-2">
            <Badge variant="secondary">Invited as {roleName}</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              autoComplete="tel"
            />
          </div>

          <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground text-center">
            {userEmail}
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
              "Complete Setup"
            )}
          </Button>
        </form>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/cms/login" })}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOutIcon className="size-3" />
            Sign out
          </button>
        </div>
      </CardContent>
    </Card>
    </>
  )
}
