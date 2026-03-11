"use client"

import {
  ShieldIcon,
  CrownIcon,
  UserCogIcon,
  PenLineIcon,
  EyeIcon,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RoleGuard } from "@/components/cms/role-guard"

const roles = [
  {
    name: "Owner",
    level: "OWNER",
    icon: CrownIcon,
    badgeVariant: "default" as const,
    description: "Full access to everything. Can manage users, billing, and transfer ownership.",
    capabilities: [
      "All Admin capabilities",
      "Invite users at any role level",
      "Remove users and transfer ownership",
      "Manage domains and billing",
    ],
  },
  {
    name: "Admin",
    level: "ADMIN",
    icon: UserCogIcon,
    badgeVariant: "secondary" as const,
    description: "Full content and site management. Can invite Editors and Viewers.",
    capabilities: [
      "Create, edit, and delete all content",
      "Manage website pages, navigation, and theme",
      "Edit site settings",
      "Invite users (up to Editor role)",
      "Manage members and people",
    ],
  },
  {
    name: "Editor",
    level: "EDITOR",
    icon: PenLineIcon,
    badgeVariant: "secondary" as const,
    description: "Create and edit their own content. Upload media.",
    capabilities: [
      "Create and edit own Bible studies and events",
      "Upload and manage own media files",
      "View members and people",
      "Access dashboard with quick actions",
    ],
  },
  {
    name: "Viewer",
    level: "VIEWER",
    icon: EyeIcon,
    badgeVariant: "secondary" as const,
    description: "Read-only access to the CMS. Can view all content but not make changes.",
    capabilities: [
      "View all content (Bible studies, events, media)",
      "View members and people",
      "Access the dashboard (read-only)",
      "Download media files",
    ],
  },
]

const permissionMatrix = [
  {
    feature: "Dashboard",
    viewer: "View",
    editor: "View + Actions",
    admin: "Full",
    owner: "Full",
  },
  {
    feature: "Bible Studies",
    viewer: "View",
    editor: "Create, Edit own",
    admin: "Create, Edit all, Delete",
    owner: "Full",
  },
  {
    feature: "Events",
    viewer: "View",
    editor: "Create, Edit own",
    admin: "Create, Edit all, Delete",
    owner: "Full",
  },
  {
    feature: "Media Library",
    viewer: "View",
    editor: "Upload, Edit own",
    admin: "Upload, Edit all, Delete",
    owner: "Full",
  },
  {
    feature: "Members",
    viewer: "View",
    editor: "View",
    admin: "Full CRUD",
    owner: "Full",
  },
  {
    feature: "Website Builder",
    viewer: "\u2014",
    editor: "\u2014",
    admin: "Edit",
    owner: "Full",
  },
  {
    feature: "Domains",
    viewer: "\u2014",
    editor: "\u2014",
    admin: "View",
    owner: "Manage",
  },
  {
    feature: "Site Settings",
    viewer: "\u2014",
    editor: "\u2014",
    admin: "Edit",
    owner: "Full",
  },
  {
    feature: "User Management",
    viewer: "\u2014",
    editor: "\u2014",
    admin: "Invite \u2264 Editor",
    owner: "Full",
  },
]

function RolesPageContent() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldIcon className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold tracking-tight">
            Roles &amp; Permissions
          </h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          View the permission levels for each role in your church.
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.level}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <role.icon className="h-4 w-4 text-muted-foreground" />
                <CardTitle>{role.name}</CardTitle>
                <Badge variant={role.badgeVariant} className="ml-auto">
                  {role.level}
                </Badge>
              </div>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {role.capabilities.map((cap) => (
                  <li key={cap} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 shrink-0">{"\u2713"}</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-3">
          Permission Matrix
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Feature</TableHead>
                  <TableHead>Viewer</TableHead>
                  <TableHead>Editor</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionMatrix.map((row, i) => (
                  <TableRow
                    key={row.feature}
                    className={i % 2 === 0 ? "bg-muted/30" : ""}
                  >
                    <TableCell className="font-medium">
                      {row.feature}
                    </TableCell>
                    <TableCell className={row.viewer === "\u2014" ? "text-muted-foreground" : ""}>
                      {row.viewer}
                    </TableCell>
                    <TableCell className={row.editor === "\u2014" ? "text-muted-foreground" : ""}>
                      {row.editor}
                    </TableCell>
                    <TableCell className={row.admin === "\u2014" ? "text-muted-foreground" : ""}>
                      {row.admin}
                    </TableCell>
                    <TableCell className={row.owner === "\u2014" ? "text-muted-foreground" : ""}>
                      {row.owner}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function RolesPage() {
  return (
    <RoleGuard minRole="ADMIN">
      <div className="pt-5">
        <RolesPageContent />
      </div>
    </RoleGuard>
  )
}
