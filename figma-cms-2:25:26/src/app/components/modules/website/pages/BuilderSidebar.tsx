"use client";

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/components/ui/utils"
import { 
    Plus, 
    FileText, 
    Palette, 
    Image as ImageIcon,
    Settings,
    Layout,
    Type,
    X,
    Pencil,
    Lock
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TooltipProvider as TooltipProviderPrimitive
} from "@/app/components/ui/tooltip"

export type BuilderTool = 'add' | 'pages' | 'theme' | 'media' | 'content' | null;

interface BuilderSidebarProps {
    activeTool: BuilderTool;
    setActiveTool: (tool: BuilderTool) => void;
    pageType?: string;
}

export function BuilderSidebar({ activeTool, setActiveTool, pageType }: BuilderSidebarProps) {
    // If page is 'ministry', add section is disabled
    const isLockedTemplate = pageType === 'ministry';

    const tools = [
        { 
            id: 'add', 
            icon: isLockedTemplate ? Lock : Plus, 
            label: 'Add Section',
            disabled: isLockedTemplate,
            disabledMessage: "Custom sections cannot be added to this system template."
        },
        { id: 'pages', icon: FileText, label: 'Pages & Menu' },
        { id: 'theme', icon: Palette, label: 'Design' },
        { id: 'media', icon: ImageIcon, label: 'Media' },
    ];

    return (
        <div className="w-[60px] bg-white border-r flex flex-col items-center py-4 gap-4 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-full">
            <TooltipProvider delayDuration={0}>
                {tools.map((tool) => (
                    <Tooltip key={tool.id}>
                        <TooltipTrigger asChild>
                            <span tabIndex={0} className="outline-none rounded-lg"> 
                                <button
                                    onClick={() => !tool.disabled && setActiveTool(activeTool === tool.id ? null : tool.id as BuilderTool)}
                                    disabled={tool.disabled}
                                    className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 relative group",
                                        tool.disabled 
                                            ? "text-slate-300 cursor-not-allowed bg-slate-50/50" 
                                            : activeTool === tool.id 
                                                ? "bg-blue-50 text-blue-600 shadow-sm" 
                                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <tool.icon className="w-5 h-5" strokeWidth={1.5} />
                                </button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="ml-2 bg-slate-900 text-white border-slate-800">
                            {tool.disabled ? (
                                <div className="space-y-1">
                                    <p className="font-semibold text-xs text-slate-300 uppercase tracking-wider">System Template</p>
                                    <p className="text-xs">{tool.disabledMessage}</p>
                                </div>
                            ) : (
                                <p className="text-xs">{tool.label}</p>
                            )}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
            
            <div className="mt-auto flex flex-col gap-4">
                 {/* Content Edit Trigger Removed */}
            </div>
        </div>
    );
}

interface BuilderDrawerProps {
    activeTool: BuilderTool;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export function BuilderDrawer({ activeTool, onClose, children, title, className }: BuilderDrawerProps) {
    if (!activeTool) return null;

    return (
        <div className={cn("bg-white flex flex-col h-full", className)}>
            <div className="h-14 border-b flex items-center justify-between px-4 bg-slate-50/50 shrink-0">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">{title}</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-200/50 rounded-full" onClick={onClose}>
                    <X className="w-3.5 h-3.5 text-slate-500" />
                </Button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
                {children}
            </div>
        </div>
    );
}
