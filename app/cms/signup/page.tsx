"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChurchIcon, Loader2Icon, MailIcon } from "lucide-react"
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
import { signIn } from "next-auth/react"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function SignupForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/cms/dashboard"

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true)
    signIn("google", { callbackUrl })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setErrorCode(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      })
      const data = await res.json()

      if (!res.ok && data.error) {
        setError(data.error.message)
        setErrorCode(data.error.code || null)
      } else {
        setSuccess(true)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const [resendCooldown, setResendCooldown] = useState(60) // start with 60s after initial send
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!success || resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [success, resendCooldown])

  const handleResend = useCallback(async () => {
    setResending(true)
    try {
      const res = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.status === 429) {
        setResendCooldown(60)
        return
      }
      setResendCooldown(60)
    } catch {
      // Fail silently — user can try again
    } finally {
      setResending(false)
    }
  }, [email])

  if (success) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <MailIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl">Check Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to <strong>{email}</strong>.
            Click the link to verify your account, then sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground text-center">
            Don&apos;t see the email? Check your spam, junk, or promotions folder. The link expires in 30 minutes.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
          >
            {resending ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {resendCooldown > 0
              ? `Resend email in ${resendCooldown}s`
              : "Resend verification email"}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/cms/login">Back to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <ChurchIcon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Create an Account</CardTitle>
        <CardDescription>Sign up to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          <GoogleIcon />
          {isGoogleLoading ? "Redirecting..." : "Sign up with Google"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot field — hidden from real users */}
          <input
            type="text"
            name="website"
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                placeholder="John"
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
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
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
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              {errorCode === 'EMAIL_EXISTS' && (
                <div className="flex items-center justify-center gap-3 text-xs">
                  <Link href="/cms/login" className="text-primary underline-offset-4 hover:underline font-medium">
                    Sign in
                  </Link>
                  <span className="text-muted-foreground">or</span>
                  <Link href="/cms/forgot-password" className="text-primary underline-offset-4 hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
              )}
              {errorCode === 'GOOGLE_ACCOUNT' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mx-auto"
                  onClick={handleGoogleSignIn}
                >
                  <GoogleIcon />
                  Sign in with Google
                </Button>
              )}
              {errorCode === 'UNVERIFIED' && (
                <p className="text-xs text-muted-foreground">Check your inbox and spam folder for the verification link.</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/cms/login" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Suspense>
        <SignupForm />
      </Suspense>
    </div>
  )
}
