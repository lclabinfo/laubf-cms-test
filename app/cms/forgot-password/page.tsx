"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChurchIcon, Loader2Icon, ArrowLeftIcon, CheckCircle2Icon } from "lucide-react"
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"

type Step = "email" | "code" | "password" | "success"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Step 1: Submit email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setErrorCode(null)
    setIsLoading(true)

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.ok) {
        setStep("code")
        setResendCooldown(60)
      } else {
        setError(data.error?.message || "Something went wrong.")
        setErrorCode(data.error?.code || null)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify code
  const handleCodeSubmit = useCallback(async (codeValue: string) => {
    setError(null)
    setErrorCode(null)
    setIsLoading(true)

    try {
      const res = await fetch("/api/v1/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeValue }),
      })
      const data = await res.json()

      if (res.ok && data.data?.token) {
        setResetToken(data.data.token)
        setStep("password")
      } else {
        setError(data.error?.message || "Invalid code.")
        setErrorCode(data.error?.code || null)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [email])

  // Auto-submit when 6 digits are entered
  const handleCodeChange = (value: string) => {
    setCode(value)
    if (value.length === 6) {
      handleCodeSubmit(value)
    }
  }

  // Resend code
  const handleResend = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setResendCooldown(60)
        setCode("")
      }
    } catch {
      // Fail silently
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Reset password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      })
      const data = await res.json()

      if (res.ok) {
        setStep("success")
      } else {
        setError(data.error?.message || "Something went wrong.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Success screen
  if (step === "success") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CheckCircle2Icon className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <CardTitle className="text-xl">Password Reset!</CardTitle>
          <CardDescription>
            Your password has been updated. You can now sign in with your new password.
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

  // Code entry screen
  if (step === "code") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <ChurchIcon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Enter Code</CardTitle>
          <CardDescription>
            We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="size-10 text-base" />
                <InputOTPSlot index={1} className="size-10 text-base" />
                <InputOTPSlot index={2} className="size-10 text-base" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} className="size-10 text-base" />
                <InputOTPSlot index={4} className="size-10 text-base" />
                <InputOTPSlot index={5} className="size-10 text-base" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {isLoading && (
            <div className="flex justify-center">
              <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Didn&apos;t receive the code? Check your spam folder.
          </p>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isLoading}
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend code"}
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => { setStep("email"); setCode(""); setError(null) }}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Use a different email
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Password entry screen
  if (step === "password") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <ChurchIcon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Set New Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
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
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Email entry screen (step === "email")
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <ChurchIcon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a verification code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleEmailSubmit} className="space-y-4">
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

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              {errorCode === 'NOT_FOUND' && (
                <div className="flex items-center justify-center gap-3 text-xs">
                  <Link href="/cms/signup" className="text-primary underline-offset-4 hover:underline font-medium">
                    Create an account
                  </Link>
                </div>
              )}
              {errorCode === 'GOOGLE_ACCOUNT' && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.location.href = "/cms/login"
                    }}
                  >
                    <GoogleIcon />
                    Sign in with Google
                  </Button>
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Verification Code"
            )}
          </Button>
        </form>

        <Button asChild variant="ghost" className="w-full">
          <Link href="/cms/login">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Sign In
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}
