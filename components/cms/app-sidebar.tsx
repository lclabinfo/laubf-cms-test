"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRightIcon,
  ChurchIcon,
  LayoutDashboardIcon,
  BookOpenIcon,
  CalendarIcon,
  ImageIcon,
  GlobeIcon,
  PaletteIcon,
  FileTextIcon,
  NavigationIcon,
  PenToolIcon,
  UsersIcon,
  UserPlusIcon,
  ShieldIcon,
  KeyRoundIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
  SettingsIcon,
  Building2Icon,
  MapPinIcon,
  HardDriveIcon,
  InboxIcon,
  EyeOffIcon,
  type LucideIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import type { CmsSessionData } from "@/components/cms/cms-shell"
import type { Permission } from "@/lib/permissions"

type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  items?: { title: string; href: string }[]
  /** Permission required to see this item. If omitted, visible to all authenticated users. */
  requiredPermission?: Permission
  /** If true, only visible to developer accounts (info@lclab.io). Used for WIP pages. */
  devOnly?: boolean
  /** Short hint shown to dev users explaining why this item is hidden from others. */
  devHint?: string
}

type NavGroup = {
  label: string
  items: NavItem[]
  /** Permission required to see this entire group. If omitted, visible to all authenticated users. */
  requiredPermission?: Permission
}

// Items that are stubs / not yet implemented get reduced opacity
const STUB_HREFS = new Set<string>([
])

const navGroups: NavGroup[] = [
  {
    label: "Contents",
    items: [
      {
        title: "Church Profile",
        href: "/cms/church-profile",
        icon: ChurchIcon,
      },
      {
        title: "Bible Studies",
        href: "/cms/messages",
        icon: BookOpenIcon,
      },
      {
        title: "Events",
        href: "/cms/events",
        icon: CalendarIcon,
      },
      {
        title: "Media",
        href: "/cms/media",
        icon: ImageIcon,
      },
      {
        title: "Storage",
        href: "/cms/storage",
        icon: HardDriveIcon,
      },
      {
        title: "Submissions",
        href: "/cms/form-submissions",
        icon: InboxIcon,
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        title: "Members",
        href: "/cms/people/members",
        icon: UsersIcon,
      },
      {
        title: "Groups",
        href: "/cms/people/groups",
        icon: UserPlusIcon,
      },
      {
        title: "Ministries",
        href: "/cms/people/ministries",
        icon: Building2Icon,
      },
      {
        title: "Campuses",
        href: "/cms/people/campuses",
        icon: MapPinIcon,
      },
    ],
  },
  {
    label: "Website",
    items: [
      {
        title: "Builder",
        href: "/cms/website/builder",
        icon: PenToolIcon,
        requiredPermission: "website.pages.edit",
      },
      {
        title: "Pages",
        href: "/cms/website/pages",
        icon: FileTextIcon,
        devOnly: true,
        devHint: "Moving into Builder",
      },
      {
        title: "Navigation",
        href: "/cms/website/navigation",
        icon: NavigationIcon,
        devOnly: true,
        devHint: "Moving into Builder",
      },
      {
        title: "Theme",
        href: "/cms/website/theme",
        icon: PaletteIcon,
        devOnly: true,
        devHint: "Moving into Builder",
      },
      {
        title: "Domains",
        href: "/cms/website/domains",
        icon: GlobeIcon,
        requiredPermission: "website.domains.manage",
      },
      {
        title: "Settings",
        href: "/cms/website/settings",
        icon: SettingsIcon,
        requiredPermission: "website.settings.edit",
        devOnly: true,
        devHint: "Moving into Builder",
      },
    ],
  },
  {
    label: "Admin",
    requiredPermission: "users.view",
    items: [
      {
        title: "Users",
        href: "/cms/people/users",
        icon: KeyRoundIcon,
        requiredPermission: "users.view",
      },
      {
        title: "Roles",
        href: "/cms/admin/roles",
        icon: ShieldIcon,
        requiredPermission: "roles.view",
      },
    ],
  },
]

export function AppSidebar({ session, ...props }: { session: CmsSessionData } & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const userPerms = React.useMemo(() => new Set(session.permissions ?? []), [session.permissions])
  const isDev = session.user.email === "info@lclab.io"
  const [unreadSubmissions, setUnreadSubmissions] = React.useState(0)

  React.useEffect(() => {
    fetch("/api/v1/form-submissions?countOnly=true")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setUnreadSubmissions(json.data.unreadCount)
      })
      .catch(() => {})
  }, [])

  const initials = session.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // Determine which group is active based on current path
  const activeGroup = navGroups.find((group) =>
    group.items.some(
      (item) =>
        pathname === item.href ||
        pathname.startsWith(item.href + "/") ||
        item.items?.some((sub) => pathname === sub.href)
    )
  )
  const [openGroup, setOpenGroup] = React.useState<string | null>(
    activeGroup?.label ?? navGroups[0].label
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group/header">
              <Link href="/cms/dashboard">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <ChurchIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{session.churchName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Church Settings
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/cms/dashboard"}
                  tooltip="Dashboard"
                >
                  <Link href="/cms/dashboard">
                    <LayoutDashboardIcon />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {navGroups.map((group) => {
          if (group.requiredPermission && !userPerms.has(group.requiredPermission)) return null
          const visibleItems = group.items.filter(
            (item) =>
              (!item.requiredPermission || userPerms.has(item.requiredPermission)) &&
              (!item.devOnly || isDev),
          )
          if (visibleItems.length === 0) return null
          const isGroupActive = activeGroup?.label === group.label
          return (
          <Collapsible
            key={group.label}
            open={openGroup === group.label}
            onOpenChange={(open) =>
              setOpenGroup(open ? group.label : null)
            }
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className={cn(
                  "w-full rounded-md transition-colors",
                  isGroupActive && openGroup !== group.label && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                )}>
                  {group.label}
                  <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent forceMount>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) =>
                      item.items ? (
                        <CollapsibleNavItem
                          key={item.title}
                          item={item}
                          pathname={pathname}
                        />
                      ) : (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href}
                            tooltip={item.title}
                            className={STUB_HREFS.has(item.href) ? "opacity-40 pointer-events-none" : undefined}
                          >
                            <Link href={item.href}>
                              <item.icon />
                              <span>{item.title}</span>
                              {item.href === "/cms/form-submissions" && unreadSubmissions > 0 && (
                                <Badge variant="default" className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-semibold justify-center">
                                  {unreadSubmissions}
                                </Badge>
                              )}
                              {item.devOnly && item.devHint && (
                                <Tooltip>
                                  <TooltipTrigger asChild onClick={(e) => e.preventDefault()}>
                                    <EyeOffIcon className="ml-auto size-3 text-muted-foreground/50 shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="text-xs">
                                    {item.devHint}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
          )
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{session.user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {session.user.email}
                    </span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/cms/settings">
                    <SettingsIcon />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/cms/login" })}>
                  <LogOutIcon />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

function CollapsibleNavItem({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const isActive =
    pathname === item.href ||
    item.items?.some((sub) => pathname === sub.href)

  return (
    <Collapsible
      asChild
      defaultOpen={isActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive}>
            <item.icon />
            <span>{item.title}</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((sub) => (
              <SidebarMenuSubItem key={sub.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === sub.href}
                >
                  <Link href={sub.href}>
                    <span>{sub.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
