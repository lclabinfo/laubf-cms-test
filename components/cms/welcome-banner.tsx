"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Sparkles, MessageSquare, Calendar, Globe, Users } from "lucide-react"

interface WelcomeBannerProps {
  userName: string
  userId: string
  churchName: string
  roleName: string
}

const QUICK_LINKS = [
  {
    icon: MessageSquare,
    label: "Add a new message or sermon",
    href: "/cms/messages/new",
  },
  {
    icon: Calendar,
    label: "Create an upcoming event",
    href: "/cms/events/new",
  },
  {
    icon: Globe,
    label: "Manage your website pages",
    href: "/cms/website/pages",
  },
  {
    icon: Users,
    label: "View and manage your people",
    href: "/cms/people",
  },
]

function getFirstName(fullName: string): string {
  return fullName.split(" ")[0] || fullName
}

function getRoleDescription(roleName: string): string {
  const lower = roleName.toLowerCase()
  if (lower.includes("admin") || lower.includes("owner")) {
    return "As an administrator, you have full access to manage content, people, and site settings."
  }
  if (lower.includes("editor")) {
    return "As an editor, you can create and manage content like messages, events, and pages."
  }
  if (lower.includes("volunteer") || lower.includes("contributor")) {
    return "As a contributor, you can help manage content assigned to you."
  }
  if (!roleName) {
    return "You can manage your church's content and keep your community informed."
  }
  return `As a ${roleName}, you can manage your church's content and keep your community informed.`
}

export function WelcomeBanner({ userName, userId, churchName, roleName }: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true
    return !!localStorage.getItem(`cms-welcome-dismissed-${userId}`)
  })

  function handleDismiss() {
    const key = `cms-welcome-dismissed-${userId}`
    localStorage.setItem(key, "true")
    setDismissed(true)
  }

  if (dismissed) return null

  const firstName = getFirstName(userName)

  return (
    <Card className="relative border-0 ring-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={handleDismiss}
        aria-label="Dismiss welcome banner"
      >
        <X className="h-4 w-4" />
      </Button>
      <CardContent className="pt-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 pr-8">
            <h3 className="text-lg font-semibold tracking-tight">
              Welcome to {churchName}{firstName ? `, ${firstName}` : ""}!
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {getRoleDescription(roleName)}
            </p>
            <div className="mt-4">
              <p className="text-sm font-medium text-foreground">
                Here are some things you can do:
              </p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <link.icon className="h-4 w-4 shrink-0" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
