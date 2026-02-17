"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRightIcon,
  LayoutDashboardIcon,
  ChurchIcon,
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

const navGroups = [
  {
    label: "Contents",
    items: [
      { title: "Dashboard", href: "/cms/dashboard", icon: LayoutDashboardIcon },
      { title: "Church Profile", href: "/cms/church-profile", icon: ChurchIcon },
      { title: "Messages", href: "/cms/messages", icon: MessageSquareIcon },
      { title: "Events", href: "/cms/events", icon: CalendarIcon },
      { title: "Media", href: "/cms/media", icon: ImageIcon },
    ],
  },
  {
    label: "Website",
    items: [
      { title: "Pages", href: "/cms/website/pages", icon: FileTextIcon },
      { title: "Navigation", href: "/cms/website/navigation", icon: NavigationIcon },
      { title: "Theme", href: "/cms/website/theme", icon: PaletteIcon },
      { title: "Domains", href: "/cms/website/domains", icon: GlobeIcon },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Members", href: "/cms/people/members", icon: UsersIcon },
      { title: "Groups", href: "/cms/people/groups", icon: UserPlusIcon },
      { title: "Directory", href: "/cms/people/directory", icon: ContactIcon },
    ],
  },
  {
    label: "Giving",
    items: [
      { title: "Donations", href: "/cms/giving/donations", icon: HandCoinsIcon },
      { title: "Payments", href: "/cms/giving/payments", icon: CreditCardIcon },
      { title: "Reports", href: "/cms/giving/reports", icon: BarChart3Icon },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/cms/dashboard">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <ChurchIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Church CMS</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Management Portal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <NavGroup
            key={group.label}
            label={group.label}
            items={group.items}
            pathname={pathname}
          />
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

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string
  items: { title: string; href: string; icon: React.ComponentType<{ className?: string }> }[]
  pathname: string
}) {
  const isGroupActive = items.some((item) => pathname.startsWith(item.href))

  return (
    <SidebarGroup>
      <Collapsible defaultOpen={isGroupActive} className="group/collapsible">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="w-full">
            {label}
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  )
}
