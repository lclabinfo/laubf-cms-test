"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  MailIcon,
} from "lucide-react"
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
import { toast } from "sonner"

function ResendForm() {
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.status === 429) {
        toast.error("Please wait before requesting another email.")
        setCooldown(60)
        return
      }
      if (data.success) {
        toast.success("Verification email sent")
        setCooldown(60)
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="resend-email" className="text-xs">Email address</Label>
        <Input
          id="resend-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <Button
        className="w-full"
        onClick={handleResend}
        disabled={sending || cooldown > 0}
      >
        {sending ? (
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <MailIcon className="mr-2 h-4 w-4" />
        )}
        {cooldown > 0
          ? `Resend in ${cooldown}s`
          : "Send New Verification Email"}
      </Button>
    </div>
  )
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const errorParam = searchParams.get("error")
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">(
    errorParam === "expired" ? "expired" : token ? "loading" : "error"
  )

  useEffect(() => {
    if (!token || errorParam) return

    fetch(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, {
      redirect: "manual",
    })
      .then((res) => {
        if (res.type === "opaqueredirect" || res.ok || res.status === 302) {
          setStatus("success")
        } else {
          setStatus("error")
        }
      })
      .catch(() => setStatus("error"))
  }, [token, errorParam])

  if (status === "loading") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Loader2Icon className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
          <CardTitle className="text-xl">Verifying your email...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CheckCircle2Icon className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <CardTitle className="text-xl">Email Verified!</CardTitle>
          <CardDescription>
            Your email has been verified. You can now sign in.
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

  // expired or error — show resend option
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <XCircleIcon className="mx-auto h-12 w-12 text-destructive mb-4" />
        <CardTitle className="text-xl">
          {status === "expired" ? "Link Expired" : "Verification Failed"}
        </CardTitle>
        <CardDescription>
          {status === "expired"
            ? "This verification link has expired. Request a new one below."
            : "This link is invalid or has expired. Request a new verification email below."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ResendForm />
        <Button asChild variant="outline" className="w-full">
          <Link href="/cms/login">Back to Sign In</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Suspense>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
