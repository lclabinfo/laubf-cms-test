"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/app/components/ui/utils";

export interface Page {
    id: string;
    title: string;
    type: 'home' | 'ministry' | 'folder' | 'page';
    children?: Page[];
    status?: 'published' | 'draft';
    ministryId?: string;
    url?: string;
    isLocked?: boolean;
}

interface WebsiteNavbarProps {
    pages: Page[];
    activePageId?: string;
    onNavigate: (pageId: string) => void;
    className?: string;
    logo?: React.ReactNode;
}

export function WebsiteNavbar({ pages, activePageId, onNavigate, className, logo }: WebsiteNavbarProps) {
    
    const renderNavItem = (page: Page) => {
        const hasChildren = page.children && page.children.length > 0;
        const isActive = activePageId === page.id;

        if (hasChildren) {
            return (
                <div key={page.id} className="relative group cursor-pointer h-full flex items-center">
                     <div className="flex items-center gap-1 px-4 py-2 text-white hover:text-white/80 transition-colors font-semibold text-[16px] tracking-[-0.3px]">
                        {page.title}
                        <ChevronDown className="w-4 h-4 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
                    </div>
                    
                    {/* Dropdown */}
                    <div className="absolute top-full left-0 mt-0 w-48 bg-white rounded-lg shadow-xl opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 z-50 overflow-hidden ring-1 ring-black/5">
                        <div className="py-2 flex flex-col">
                            {page.children?.map(child => (
                                <button
                                    key={child.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNavigate(child.id);
                                    }}
                                    className="text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors border-l-2 border-transparent hover:border-blue-600"
                                >
                                    {child.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <button
                key={page.id}
                onClick={() => onNavigate(page.id)}
                className={cn(
                    "px-4 py-2 font-semibold text-[16px] tracking-[-0.3px] transition-colors relative",
                    isActive ? "text-white" : "text-white/90 hover:text-white"
                )}
            >
                {page.title}
                {isActive && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-white rounded-full" />
                )}
            </button>
        );
    };

    return (
        <div className={cn("absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-6 max-w-[1440px] mx-auto pointer-events-none", className)}>
            {/* Logo Area */}
            <div className="flex-shrink-0 cursor-pointer pointer-events-auto" onClick={() => onNavigate('home')}>
                {logo || <div className="text-white font-bold text-xl">LOGO</div>}
            </div>

            {/* Navigation Items */}
            <div className="flex items-center gap-2 pointer-events-auto">
                {pages.map(renderNavItem)}
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4 pointer-events-auto">
                 <button className="text-white font-medium hover:text-white/80 transition-colors text-[16px]">
                    Member Login
                </button>
                <button className="bg-transparent border border-white text-white px-6 py-2.5 rounded-full font-bold hover:bg-white hover:text-black transition-all text-[15px] relative group">
                    I'm New
                </button>
            </div>
        </div>
    );
}
