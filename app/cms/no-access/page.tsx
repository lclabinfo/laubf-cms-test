"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ShieldAlertIcon, LogOut } from "lucide-react"

export default function NoAccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <ShieldAlertIcon className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>No Church Access</CardTitle>
          <CardDescription>
            Your account is not yet associated with any church. A church
            administrator needs to invite you before you can access the CMS.
            If you believe this is an error, contact your church administrator
            and ask them to add your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            className="w-full"
            onClick={() => signOut({ callbackUrl: "/cms/login" })}
          >
            <LogOut className="size-4 mr-2" />
            Sign Out & Try Again
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/cms/login">Back to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
