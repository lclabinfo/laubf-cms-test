"use client"

import { useState } from "react"
import {
  Globe,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Lock,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// ── Main Page ──

export default function WebsiteDomainsPage() {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // Dynamic subdomain from env — falls back for dev
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
  const churchSlug = process.env.NEXT_PUBLIC_CHURCH_SLUG || "la-ubf"
  const isLocal = rootDomain.includes("localhost")
  const defaultSubdomain = isLocal
    ? "localhost:3000/website"
    : `${churchSlug}.${rootDomain}`
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || (
    isLocal ? "http://localhost:3000/website" : `https://${defaultSubdomain}`
  )

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(text)
      setTimeout(() => setCopiedText(null), 2000)
    } catch {
      // Clipboard may not be available
    }
  }

  return (
    <div className="pt-5 space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Domains</h1>
        <p className="text-muted-foreground text-sm">
          Manage your website domains.
        </p>
      </div>

      {/* Default Subdomain */}
      <Card>
        <CardHeader>
          <CardTitle>Default Subdomain</CardTitle>
          <CardDescription>
            This is your default subdomain. It is always available and cannot be
            removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-muted-foreground shrink-0" />
            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
              {defaultSubdomain}
            </code>
            <Badge variant="secondary">Default</Badge>
            <Badge variant="default">
              <CheckCircle2 className="size-3" />
              Active
            </Badge>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleCopy(defaultSubdomain)}
              aria-label="Copy subdomain"
            >
              {copiedText === defaultSubdomain ? (
                <Check className="size-3 text-green-600" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => window.open(websiteUrl, "_blank")}
              aria-label="Open website"
            >
              <ExternalLink className="size-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domains — Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Domains</CardTitle>
          <CardDescription>
            Connect your own domain to your church website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex items-center justify-center size-12 rounded-full bg-muted mb-3">
              <Lock className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">
              Coming Soon
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Custom domain support is coming in a future update.
              Your website is always available at your default subdomain above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
