"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2Icon, XCircleIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      return
    }

    // The verify-email API route handles the redirect, but if someone
    // navigates directly here, show appropriate state
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
  }, [token])

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

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <XCircleIcon className="mx-auto h-12 w-12 text-destructive mb-4" />
        <CardTitle className="text-xl">Verification Failed</CardTitle>
        <CardDescription>
          This link is invalid or has expired. Please request a new verification email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
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
