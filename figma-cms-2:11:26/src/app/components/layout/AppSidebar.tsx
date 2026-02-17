import * as React from "react";
import {
  Calendar,
  Church,
  CreditCard,
  Globe,
  LayoutDashboard,
  Megaphone,
  Users,
  Settings,
  Image as ImageIcon,
  Cloud,
  Building2,
  ChevronLeft,
  ChevronRight,
  Library,
  Palette,
  Shield
} from "lucide-react";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

// Imported Assets
import imgLclabLogo5121 from "figma:asset/e3c46049618fe66493a3297d0ac4d1fd699d09c1.png";

// Data structure
const data = {
  user: {
    name: "David Lim",
    email: "david.lim",
    handle: "@david.lim",
    plan: "Plus",
    initials: "DA",
  },
  modules: [
    {
      name: "Content",
      icon: Church,
      id: "content",
    },
    {
      name: "Website",
      icon: Globe,
      id: "website",
    },
    {
      name: "People",
      icon: Users,
      id: "people",
    },
    {
      name: "Giving",
      icon: CreditCard,
      id: "giving",
    },
  ],
  navMain: {
    content: [
      {
        title: "Dashboard",
        url: "#dashboard",
        icon: LayoutDashboard,
        id: "dashboard",
      },
      {
        title: "Church Profile",
        url: "#church-profile",
        icon: Building2,
        id: "church-profile",
      },
      {
        title: "Messages",
        url: "#library",
        icon: Library,
        id: "library",
      },
      {
        title: "Events",
        url: "#events",
        icon: Calendar,
        id: "events",
      },
      {
        title: "Announcements",
        url: "#announcements",
        icon: Megaphone,
        id: "announcements",
      },
      {
        title: "Ministries",
        url: "#ministries",
        icon: Users,
        id: "ministries",
      },
      {
        title: "Media",
        url: "#media",
        icon: ImageIcon,
        id: "media",
      },
    ],
    website: [
      {
        title: "Overview",
        url: "#overview",
        icon: LayoutDashboard,
        id: "overview",
      },
      {
        title: "Design",
        url: "#themes",
        icon: Palette,
        id: "themes",
      },
    ],
    people: [
      {
        title: "Directory",
        url: "#directory",
        icon: Users,
        id: "directory",
      },
      {
        title: "Groups",
        url: "#groups",
        icon: Users,
        id: "groups",
      },
      {
        title: "Roles",
        url: "#roles",
        icon: Shield,
        id: "roles",
      },
    ],
    giving: [],
  },
};

interface AppSidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AppSidebar({
  activeModule,
  setActiveModule,
  activePage,
  setActivePage,
  isOpen,
  setIsOpen,
}: AppSidebarProps) {
  
  const toggleSidebar = () => setIsOpen(!isOpen);

  // Determine active navigation based on module
  // Ensure we fallback to empty array safely
  const activeNav = data.navMain[activeModule as keyof typeof data.navMain] || [];
  const currentModule = data.modules.find(m => m.id === activeModule);

  return (
    <div
      className={cn(
        "flex h-screen bg-[#fafafa] transition-all duration-300 ease-in-out shrink-0 sticky top-0",
        // Total width calculation: Left Rail (80px) + Right Rail (Expanded 240px / Collapsed 60px)
        // If we want exact control, we can use flex-basis or explicit widths on children
      )}
      data-name="sidebar-container"
    >
      {/* =====================================================================================
            LEFT RAIL
            Fixed width, Full height
        ===================================================================================== */}
      <div className="flex flex-col items-center justify-between py-[14px] px-[8px] w-[68px] border-r border-[rgba(0,0,0,0.1)] bg-[#fafafa] shrink-0 z-20 relative">
        <div className="flex flex-col items-center gap-[12px] w-full">
            {/* Logo */}
            <div className="relative size-[28px] shrink-0">
                <img 
                    src={imgLclabLogo5121} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                />
            </div>

            {/* Modules */}
            <div className="flex flex-col gap-[2px] w-full">
                {data.modules.map((item) => {
                    const isActive = activeModule === item.id;
                    const Icon = item.icon;
                    if (!Icon) return null; // Safety check for undefined icon
                    
                    return (
                    <button
                        key={item.id}
                        onClick={() => {
                        setActiveModule(item.id);
                        if (!isOpen) setIsOpen(true);
                        }}
                        className={cn(
                        "flex flex-col items-center justify-center rounded-[14px] gap-[4px] py-[10px] w-full transition-all duration-200",
                        isActive
                            ? "bg-[#1e1e1e] text-white"
                            : "bg-transparent text-[#0a0a0a] hover:bg-black/5",
                        )}
                    >
                        <Icon
                        className={cn(
                            "size-[16px] shrink-0",
                            isActive ? "text-white" : "text-[#0a0a0a]",
                        )}
                        strokeWidth={1.5}
                        />
                        <span
                        className={cn(
                            "text-[10px] font-medium leading-[12.5px] tracking-[0.11px] text-center w-full",
                            isActive ? "text-white" : "text-[#0a0a0a]",
                        )}
                        >
                        {item.name}
                        </span>
                    </button>
                    );
                })}
            </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-[7px] w-full">
            {/* Settings */}
            <button className="flex items-center justify-center size-[35px] rounded-[8.75px] hover:bg-black/5 text-[#707070] transition-colors">
                {Settings && <Settings className="size-[24px]" strokeWidth={1.5} />}
            </button>
            
            {/* User Profile */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="size-[32px] rounded-[10px] bg-[#ff8904] flex items-center justify-center text-white text-[14px] font-medium hover:opacity-90 transition-opacity">
                        {data.user.initials}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" side="right" align="end" sideOffset={10}>
                    <div className="flex items-center gap-2 p-2">
                        <div className="flex items-center justify-center size-8 rounded-[10px] bg-[#ff8904] shrink-0 text-white text-[14px] font-medium">
                            {data.user.initials}
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{data.user.name}</span>
                            <span className="truncate text-xs text-muted-foreground">{data.user.handle}</span>
                        </div>
                    </div>
                    {DropdownMenuSeparator && <DropdownMenuSeparator />}
                    <DropdownMenuGroup>
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                    </DropdownMenuGroup>
                    {DropdownMenuSeparator && <DropdownMenuSeparator />}
                    <DropdownMenuItem>Log out</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* =====================================================================================
            RIGHT RAIL (Sub-menu)
            Collapsible
        ===================================================================================== */}
      <div 
        className={cn(
            "flex flex-col h-full bg-[#fafafa] border-r border-[rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out overflow-hidden py-[14px] px-[12px] gap-[12px]",
            isOpen ? "w-[204px]" : "w-[60px]"
        )}
      >
        {/* Header */}
        <div className={cn(
            "flex items-center shrink-0 min-h-[28px]",
            isOpen ? "justify-between" : "justify-center"
        )}>
            {isOpen && (
                <h2 className="font-semibold text-[18px] leading-none tracking-[-0.54px] text-[#0a0a0a]">
                    {currentModule?.name}
                </h2>
            )}
            
            <button 
                onClick={toggleSidebar}
                className="p-[2px] rounded-[8.75px] hover:bg-black/5 text-[#A1A1A1] transition-colors shrink-0"
            >
                {isOpen ? (
                    ChevronLeft && <ChevronLeft className="size-[24px]" />
                ) : (
                    ChevronRight && <ChevronRight className="size-[24px]" />
                )}
            </button>
        </div>

        {/* List */}
        <div className="flex-1 flex flex-col gap-[2px] overflow-y-auto no-scrollbar pb-4">
            {activeNav.map((item) => {
                const isActive = activePage === item.id;
                const Icon = item.icon;
                if (!Icon) return null; // Safety check

                return (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActivePage(item.id);
                            if (item.id === "editor") {
                                setIsOpen(false);
                            }
                        }}
                        title={!isOpen ? item.title : undefined}
                        className={cn(
                            "flex items-center h-[36px] rounded-[8px] transition-all duration-200 shrink-0 overflow-hidden group",
                            isOpen ? "px-[10px] gap-[12px] w-full" : "justify-center w-full px-0",
                            isActive ? "bg-[#1e1e1e] text-white" : "text-[#0a0a0a] hover:bg-black/5"
                        )}
                    >
                        <Icon
                            className={cn(
                                "size-[16px] shrink-0",
                                isActive ? "text-white" : "text-[#0a0a0a] group-hover:text-[#0a0a0a]"
                            )}
                            strokeWidth={1.5}
                        />
                        
                        <span
                            className={cn(
                                "font-medium text-[14px] leading-[20px] tracking-[-0.15px] whitespace-nowrap overflow-hidden transition-all duration-300",
                                isActive ? "text-white" : "text-[#0a0a0a]",
                                isOpen ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0 hidden"
                            )}
                        >
                            {item.title}
                        </span>
                    </button>
                )
            })}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
