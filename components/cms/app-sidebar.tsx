"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRightIcon,
  ChurchIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  CalendarIcon,
  ImageIcon,
  GlobeIcon,
  PaletteIcon,
  FileTextIcon,
  NavigationIcon,
  PenToolIcon,
  UsersIcon,
  UserPlusIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
  SettingsIcon,
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
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import type { CmsSessionData } from "@/components/cms/cms-shell"

type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  items?: { title: string; href: string }[]
}

type NavGroup = {
  label: string
  items: NavItem[]
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
        title: "Messages",
        href: "/cms/messages",
        icon: MessageSquareIcon,
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
    ],
  },
  {
    label: "Website",
    items: [
      {
        title: "Builder",
        href: "/cms/website/builder",
        icon: PenToolIcon,
      },
      {
        title: "Pages",
        href: "/cms/website/pages",
        icon: FileTextIcon,
      },
      {
        title: "Navigation",
        href: "/cms/website/navigation",
        icon: NavigationIcon,
      },
      {
        title: "Theme",
        href: "/cms/website/theme",
        icon: PaletteIcon,
      },
      {
        title: "Domains",
        href: "/cms/website/domains",
        icon: GlobeIcon,
      },
      {
        title: "Settings",
        href: "/cms/website/settings",
        icon: SettingsIcon,
      },
    ],
  },
]

export function AppSidebar({ session, ...props }: { session: CmsSessionData } & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

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
                    {group.items.map((item) =>
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
