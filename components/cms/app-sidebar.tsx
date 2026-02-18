"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  UsersIcon,
  UserPlusIcon,
  ContactIcon,
  HandCoinsIcon,
  CreditCardIcon,
  BarChart3Icon,
  ChevronsUpDownIcon,
  LogOutIcon,
  SettingsIcon,
  BellIcon,
  MegaphoneIcon,
  PuzzleIcon,
  SmartphoneIcon,
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

const navGroups: NavGroup[] = [
  {
    label: "Contents",
    items: [
      {
        title: "Dashboard",
        href: "/cms/dashboard",
        icon: LayoutDashboardIcon,
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
    label: "Website",
    items: [
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
    ],
  },
  {
    label: "App",
    items: [
      {
        title: "Notifications",
        href: "/cms/app/notifications",
        icon: BellIcon,
      },
      {
        title: "Announcements",
        href: "/cms/app/announcements",
        icon: MegaphoneIcon,
      },
      {
        title: "Mobile App",
        href: "/cms/app/mobile",
        icon: SmartphoneIcon,
      },
      {
        title: "Integrations",
        href: "/cms/app/integrations",
        icon: PuzzleIcon,
      },
    ],
  },
  {
    label: "Giving",
    items: [
      {
        title: "Donations",
        href: "/cms/giving/donations",
        icon: HandCoinsIcon,
      },
      {
        title: "Payments",
        href: "/cms/giving/payments",
        icon: CreditCardIcon,
      },
      {
        title: "Reports",
        href: "/cms/giving/reports",
        icon: BarChart3Icon,
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
        title: "Directory",
        href: "/cms/people/directory",
        icon: ContactIcon,
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()

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
                  <span className="truncate font-semibold">LA UBF</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Church Settings
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push("/cms/church-profile")
                  }}
                  className="ml-auto opacity-0 transition-opacity duration-200 ease-in-out group-hover/header:opacity-100"
                >
                  <SettingsIcon className="size-4 text-muted-foreground/60 hover:text-muted-foreground" />
                </button>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
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
                <CollapsibleTrigger className="w-full">
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
        ))}
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
                    <AvatarFallback className="rounded-lg">PA</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Pastor Admin</span>
                    <span className="truncate text-xs text-muted-foreground">
                      admin@church.org
                    </span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <SettingsIcon />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
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
