"use client"

import { useRouter } from "next/navigation"
import { X, ExternalLink, Mail, Phone, MapPin, Archive } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { membershipStatusDisplay } from "@/components/cms/people/members-columns"
import type { MemberPerson } from "@/lib/members-context"

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function formatDate(isoStr: string | null) {
  if (!isoStr) return "—"
  const date = new Date(isoStr)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function calcAge(dateOfBirth: string | null): string | null {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return `${age}`
}

function genderLabel(g: string | null): string {
  if (!g) return "—"
  const map: Record<string, string> = {
    MALE: "Male",
    FEMALE: "Female",
    OTHER: "Other",
    PREFER_NOT_TO_SAY: "Prefer not to say",
  }
  return map[g] ?? g
}

function maritalStatusLabel(s: string | null): string {
  if (!s) return "—"
  const map: Record<string, string> = {
    SINGLE: "Single",
    MARRIED: "Married",
    DIVORCED: "Divorced",
    WIDOWED: "Widowed",
    SEPARATED: "Separated",
    OTHER: "Other",
  }
  return map[s] ?? s
}

interface MemberPreviewPanelProps {
  member: MemberPerson
  onClose: () => void
  onArchive?: (id: string) => void
}

export function MemberPreviewPanel({ member, onClose, onArchive }: MemberPreviewPanelProps) {
  const router = useRouter()
  const displayName = member.preferredName
    ? `${member.preferredName} ${member.lastName}`
    : `${member.firstName} ${member.lastName}`
  const statusConfig = membershipStatusDisplay[member.membershipStatus] ?? {
    label: member.membershipStatus,
    variant: "outline" as const,
  }
  const age = calcAge(member.dateOfBirth)

  return (
    <div className="flex h-full flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Member Details</h2>
        <div className="flex items-center gap-1">
          {onArchive && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onArchive(member.id)}
            >
              <Archive className="size-3.5 mr-1" />
              Archive
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close preview">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Profile summary */}
          <div className="flex items-center gap-3">
            <Avatar className="size-14">
              {member.photoUrl && <AvatarImage src={member.photoUrl} alt={displayName} />}
              <AvatarFallback className="text-lg">
                {getInitials(member.firstName, member.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{displayName}</h3>
              {member.preferredName && (
                <p className="text-muted-foreground text-xs truncate">
                  {member.firstName} {member.lastName}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusConfig.variant} className="text-[10px]">
                  {statusConfig.label}
                </Badge>
                {member.roles.length > 0 && (
                  <div className="flex gap-1">
                    {member.roles.slice(0, 2).map((r) => (
                      <Badge key={r.id} variant="outline" className="text-[10px] h-4">
                        {r.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* View full profile CTA */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/cms/people/members/${member.id}`)}
          >
            <ExternalLink className="size-3.5 mr-1.5" />
            View Full Profile
          </Button>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
              <TabsTrigger value="family" className="text-xs">Family</TabsTrigger>
              <TabsTrigger value="groups" className="text-xs">Groups</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
            </TabsList>

            {/* Details tab */}
            <TabsContent value="details" className="mt-3 space-y-4">
              {/* Personal Information */}
              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  <InfoRow label="Gender" value={genderLabel(member.gender)} />
                  <InfoRow label="Date of Birth" value={
                    member.dateOfBirth
                      ? `${formatDate(member.dateOfBirth)}${age ? ` (${age})` : ""}`
                      : "—"
                  } />
                  <InfoRow label="Marital Status" value={maritalStatusLabel(member.maritalStatus)} />
                  <InfoRow label="Membership Date" value={formatDate(member.membershipDate)} />
                </CardContent>
              </Card>

              {/* Contact & Address */}
              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Contact & Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  {member.email ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="size-3.5 text-muted-foreground shrink-0" />
                      <a href={`mailto:${member.email}`} className="text-primary hover:underline truncate">
                        {member.email}
                      </a>
                    </div>
                  ) : (
                    <InfoRow label="Email" value="—" />
                  )}
                  {member.phone ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="size-3.5 text-muted-foreground shrink-0" />
                      <a href={`tel:${member.phone}`} className="text-primary hover:underline">
                        {member.phone}
                      </a>
                    </div>
                  ) : (
                    <InfoRow label="Phone" value="—" />
                  )}
                  {member.mobilePhone && member.mobilePhone !== member.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="size-3.5 text-muted-foreground shrink-0" />
                      <a href={`tel:${member.mobilePhone}`} className="text-primary hover:underline">
                        {member.mobilePhone}
                      </a>
                      <span className="text-muted-foreground text-xs">(mobile)</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              {member.tags.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="flex flex-wrap gap-1">
                      {member.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
                <p>Added {formatDate(member.createdAt)}</p>
              </div>
            </TabsContent>

            {/* Family tab */}
            <TabsContent value="family" className="mt-3">
              {member.households.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <MapPin className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p>No household assigned</p>
                  <p className="text-xs mt-1">View full profile to manage family connections.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {member.households.map((h) => (
                    <Card key={h.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{h.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {h.role.toLowerCase().replace("_", " ")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Groups tab */}
            <TabsContent value="groups" className="mt-3">
              {member.groups.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <p>Not in any groups</p>
                  <p className="text-xs mt-1">View full profile to add to groups.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {member.groups.map((g) => (
                    <Card key={g.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <p className="text-sm font-medium">{g.name}</p>
                        <Badge variant="outline" className="text-[10px] h-4 capitalize">
                          {g.role.toLowerCase().replace("_", " ")}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Notes tab */}
            <TabsContent value="notes" className="mt-3">
              <div className="text-center py-6 text-sm text-muted-foreground">
                <p>View full profile to see and add notes.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm text-right truncate">{value}</span>
    </div>
  )
}
