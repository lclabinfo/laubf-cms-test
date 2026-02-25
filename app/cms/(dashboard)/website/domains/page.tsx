"use client"

import { useState, useEffect } from "react"
import {
  Globe,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ── Types ──

interface CustomDomain {
  id: string
  churchId: string
  domain: string
  status: "PENDING" | "VERIFIED" | "FAILED"
  verificationToken: string | null
  sslStatus: "PENDING" | "ACTIVE" | "FAILED"
  verifiedAt: string | null
  createdAt: string
}

const statusConfig: Record<
  CustomDomain["status"],
  {
    label: string
    variant: "secondary" | "default" | "destructive" | "warning"
    icon: typeof CheckCircle2
  }
> = {
  PENDING: { label: "Pending", variant: "warning", icon: Clock },
  VERIFIED: { label: "Verified", variant: "default", icon: CheckCircle2 },
  FAILED: { label: "Error", variant: "destructive", icon: AlertCircle },
}

// ── Main Page ──

export default function WebsiteDomainsPage() {
  const [domains, setDomains] = useState<CustomDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomain, setNewDomain] = useState("")
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState("")

  // DNS instructions visibility per domain
  const [showDnsFor, setShowDnsFor] = useState<string | null>(null)

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingDomain, setDeletingDomain] = useState<CustomDomain | null>(
    null
  )
  const [deleting, setDeleting] = useState(false)

  // Copy state
  const [copiedText, setCopiedText] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/v1/domains")
      .then((r) => r.json())
      .then((json) => setDomains(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault()
    const domain = newDomain.trim().toLowerCase()
    if (!domain) return

    // Basic validation
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
      setAddError("Please enter a valid domain name (e.g. www.example.com)")
      return
    }

    setAdding(true)
    setAddError("")

    try {
      const res = await fetch("/api/v1/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      })
      const json = await res.json()

      if (json.success) {
        setDomains((prev) => [json.data, ...prev])
        setNewDomain("")
        setShowDnsFor(json.data.id)
      } else {
        setAddError(
          json.error?.message ?? "Failed to add domain. Please try again."
        )
      }
    } catch {
      setAddError("Failed to add domain. Please try again.")
    } finally {
      setAdding(false)
    }
  }

  function handleDeleteDomain(domain: CustomDomain) {
    setDeletingDomain(domain)
    setDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deletingDomain) return
    setDeleting(true)

    try {
      await fetch(`/api/v1/domains/${deletingDomain.id}`, {
        method: "DELETE",
      })
      setDomains((prev) => prev.filter((d) => d.id !== deletingDomain.id))
    } catch (error) {
      console.error("Failed to delete domain:", error)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setDeletingDomain(null)
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(text)
      setTimeout(() => setCopiedText(null), 2000)
    } catch {
      // Clipboard may not be available
    }
  }

  // Derive subdomain from CHURCH_SLUG (la-ubf is the default)
  const defaultSubdomain = "la-ubf.lclab.io"

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Domains</h1>
          <p className="text-muted-foreground text-sm">
            Manage your website domains.
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Custom Domains */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Domains</CardTitle>
          <CardDescription>
            Connect your own domain to your church website.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {domains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Globe className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                No custom domains configured yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {domains.map((domain) => {
                const config = statusConfig[domain.status]
                const StatusIcon = config.icon
                return (
                  <div key={domain.id} className="space-y-0">
                    <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5">
                      <Globe className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono truncate">
                            {domain.domain}
                          </code>
                          <Badge variant={config.variant}>
                            <StatusIcon className="size-3" />
                            {config.label}
                          </Badge>
                        </div>
                        {domain.verifiedAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Verified{" "}
                            {new Date(domain.verifiedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {domain.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() =>
                              setShowDnsFor(
                                showDnsFor === domain.id ? null : domain.id
                              )
                            }
                          >
                            {showDnsFor === domain.id
                              ? "Hide DNS"
                              : "View DNS Setup"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDeleteDomain(domain)}
                          aria-label="Delete domain"
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* DNS Instructions */}
                    {showDnsFor === domain.id && (
                      <DnsInstructions
                        domain={domain.domain}
                        subdomain={defaultSubdomain}
                        onCopy={handleCopy}
                        copiedText={copiedText}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Add Custom Domain</CardTitle>
          <CardDescription>
            Connect a domain you own to your church website. You will need to
            update your DNS settings with your domain registrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddDomain} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-domain">Domain Name</Label>
              <div className="flex gap-2">
                <Input
                  id="new-domain"
                  placeholder="www.yourchurch.org"
                  value={newDomain}
                  onChange={(e) => {
                    setNewDomain(e.target.value)
                    setAddError("")
                  }}
                  className="flex-1"
                />
                <Button type="submit" disabled={adding || !newDomain.trim()}>
                  {adding ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="size-3.5" />
                      Add Domain
                    </>
                  )}
                </Button>
              </div>
              {addError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3 shrink-0" />
                  {addError}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove custom domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{deletingDomain?.domain}</strong>? Your website will no
              longer be accessible at this domain. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Domain"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── DNS Instructions ──

function DnsInstructions({
  domain,
  subdomain,
  onCopy,
  copiedText,
}: {
  domain: string
  subdomain: string
  onCopy: (text: string) => void
  copiedText: string | null
}) {
  // Determine if it's a www subdomain or apex domain
  const isWww = domain.startsWith("www.")

  return (
    <div className="ml-6 rounded-lg border border-dashed bg-muted/30 p-4 space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-1">DNS Configuration</h4>
        <p className="text-xs text-muted-foreground">
          Add the following DNS record with your domain registrar to verify your
          domain.
        </p>
      </div>

      {isWww ? (
        <DnsRecordRow
          type="CNAME"
          name="www"
          value={subdomain}
          onCopy={onCopy}
          copiedText={copiedText}
        />
      ) : (
        <div className="space-y-3">
          <DnsRecordRow
            type="CNAME"
            name={domain.split(".")[0]}
            value={subdomain}
            onCopy={onCopy}
            copiedText={copiedText}
          />
          <div className="text-center text-xs text-muted-foreground">or</div>
          <DnsRecordRow
            type="A"
            name="@"
            value="76.76.21.21"
            onCopy={onCopy}
            copiedText={copiedText}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        DNS changes may take up to 48 hours to propagate. Your domain status
        will update automatically once verified.
      </p>
    </div>
  )
}

function DnsRecordRow({
  type,
  name,
  value,
  onCopy,
  copiedText,
}: {
  type: string
  name: string
  value: string
  onCopy: (text: string) => void
  copiedText: string | null
}) {
  const isCopied = copiedText === value

  return (
    <div className="grid grid-cols-[4rem_1fr_1fr_2rem] gap-2 items-center text-sm">
      <div>
        <span className="text-xs text-muted-foreground block">Type</span>
        <Badge variant="outline" className="mt-0.5">
          {type}
        </Badge>
      </div>
      <div>
        <span className="text-xs text-muted-foreground block">Name</span>
        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded mt-0.5 inline-block">
          {name}
        </code>
      </div>
      <div>
        <span className="text-xs text-muted-foreground block">Value</span>
        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded mt-0.5 inline-block truncate max-w-full">
          {value}
        </code>
      </div>
      <div className="self-end">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onCopy(value)}
          aria-label="Copy value"
        >
          {isCopied ? (
            <Check className="size-3 text-green-600" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      </div>
    </div>
  )
}
