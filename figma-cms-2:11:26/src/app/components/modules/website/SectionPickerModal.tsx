import React, { useState } from "react";
import { Search, Layout, Type, Image as ImageIcon, List, Megaphone, Check } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { Input } from "@/app/components/ui/input";
import { BannerSection } from "./sections/BannerSection";

export type SectionType = 'hero' | 'features' | 'content' | 'gallery' | 'cta' | 'testimonials' | 'banner';

interface SectionOption {
    id: SectionType;
    label: string;
    description: string;
    icon: React.ElementType;
    preview: React.ReactNode;
}

const SECTION_OPTIONS: SectionOption[] = [
    {
        id: 'banner',
        label: 'Text Banner',
        description: 'Statement with buttons.',
        icon: Layout,
        preview: (
            <div className="w-full h-full bg-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center gap-3">
                <div className="w-3/4 h-3 bg-white rounded-sm" />
                <div className="w-full h-1.5 bg-white/60 rounded-sm" />
                <div className="w-5/6 h-1.5 bg-white/60 rounded-sm" />
                <div className="flex gap-2 mt-2">
                    <div className="w-12 h-4 bg-white rounded-full" />
                    <div className="w-12 h-4 border border-white/40 rounded-full" />
                </div>
            </div>
        )
    },
    {
        id: 'hero',
        label: 'Hero Banner',
        description: 'Large banner with heading.',
        icon: Layout,
        preview: (
            <div className="w-full h-full flex flex-col bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 pb-8 gap-4">
                    <div className="flex items-end gap-4">
                        <div className="space-y-1 shrink-0">
                            <div className="w-20 h-3 bg-white/90 rounded-sm" />
                            <div className="w-32 h-6 bg-white rounded-sm font-serif italic" />
                        </div>
                        <div className="w-full h-8 bg-white/20 rounded-sm backdrop-blur-sm mb-1" />
                    </div>
                    <div className="flex gap-2">
                        <div className="w-16 h-6 bg-white rounded-full" />
                        <div className="w-16 h-6 border border-white/50 rounded-full" />
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'features',
        label: 'Feature List',
        description: 'Grid of key benefits.',
        icon: List,
        preview: (
            <div className="w-full h-full flex flex-col bg-white p-6 gap-6 justify-center">
                <div className="w-1/2 h-4 bg-slate-900 rounded-sm opacity-10 mx-auto" />
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col gap-1.5">
                            <div className="aspect-square bg-slate-100 rounded-sm" />
                            <div className="w-3/4 h-2 bg-slate-900 rounded-sm opacity-10" />
                            <div className="w-full h-1 bg-slate-900 rounded-sm opacity-10" />
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    {
        id: 'content',
        label: 'Rich Text',
        description: 'Simple text block.',
        icon: Type,
        preview: (
            <div className="w-full h-full flex flex-col bg-white p-8 justify-center gap-3">
                <div className="w-1/3 h-2 bg-blue-600 rounded-sm opacity-50" />
                <div className="w-2/3 h-6 bg-slate-900 rounded-sm opacity-10" />
                <div className="space-y-1.5 mt-2">
                    <div className="w-full h-1.5 bg-slate-900 rounded-sm opacity-10" />
                    <div className="w-full h-1.5 bg-slate-900 rounded-sm opacity-10" />
                    <div className="w-full h-1.5 bg-slate-900 rounded-sm opacity-10" />
                    <div className="w-5/6 h-1.5 bg-slate-900 rounded-sm opacity-10" />
                </div>
            </div>
        )
    },
    {
        id: 'gallery',
        label: 'Gallery',
        description: 'Photo grid layout.',
        icon: ImageIcon,
        preview: (
            <div className="w-full h-full bg-white p-4 overflow-hidden">
                <div className="grid grid-cols-2 gap-2 h-full">
                    <div className="col-span-1 row-span-2 bg-slate-200 rounded-sm" />
                    <div className="col-span-1 row-span-1 bg-slate-100 rounded-sm" />
                    <div className="col-span-1 row-span-1 bg-slate-100 rounded-sm" />
                </div>
            </div>
        )
    },
    {
        id: 'cta',
        label: 'Call to Action',
        description: 'Drive user action.',
        icon: Megaphone,
        preview: (
            <div className="w-full h-full bg-[#101828] flex items-center justify-center p-8">
                <div className="w-full max-w-xs flex flex-col items-center text-center gap-4">
                    <div className="w-full h-6 bg-white/20 rounded-sm backdrop-blur-sm" />
                    <div className="w-3/4 h-2 bg-white/10 rounded-sm" />
                    <div className="w-24 h-8 bg-white rounded-full mt-1" />
                </div>
            </div>
        )
    },
];

interface SectionPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (sectionId: SectionType) => void;
    position?: 'sidebar' | 'center' | 'popover';
    triggerRect?: DOMRect | null;
}

export function SectionPickerModal({ isOpen, onClose, onSelect, position = 'center', triggerRect }: SectionPickerModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [previewSectionId, setPreviewSectionId] = useState<SectionType>('hero');
    const modalRef = React.useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    // Calculate Popover Position
    let popoverStyle: React.CSSProperties = {};
    if (position === 'popover' && triggerRect) {
        const MODAL_WIDTH = 700;
        const MODAL_HEIGHT = 500;
        const OFFSET = 24;
        
        // Horizontal: Center relative to viewport/screen as requested
        // "center of the modal should align with the center of the + button"
        // Wait, instructions say: "centered based on the editor screen. so the center of the modal should align with the center of the + button."
        // That implies the + button is center of editor screen usually, or if it's offset, the modal should follow.
        // Let's align center of modal to center of triggerRect.
        
        let left = triggerRect.left + (triggerRect.width / 2) - (MODAL_WIDTH / 2);
        
        // Keep within bounds
        const padding = 20;
        if (left < padding) left = padding;
        if (left + MODAL_WIDTH > window.innerWidth - padding) left = window.innerWidth - MODAL_WIDTH - padding;

        // Vertical: Above or Below
        // Check space below first
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        
        let top = 0;
        
        // Default to below if space permits, otherwise above
        if (spaceBelow >= MODAL_HEIGHT + OFFSET) {
            top = triggerRect.bottom + OFFSET;
        } else if (spaceAbove >= MODAL_HEIGHT + OFFSET) {
            top = triggerRect.top - MODAL_HEIGHT - OFFSET;
        } else {
            // Not enough space either way, just center it vertically or put it where it fits best
            // Fallback to center logic if really tight, but let's try to stick to one side
             top = Math.max(padding, (window.innerHeight - MODAL_HEIGHT) / 2);
        }

        popoverStyle = {
            position: 'fixed',
            left: `${left}px`,
            top: `${top}px`,
            margin: 0,
            transform: 'none' // Override any default transforms
        };
    }

    const filteredSections = SECTION_OPTIONS.filter(s => 
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeSection = SECTION_OPTIONS.find(s => s.id === previewSectionId) || SECTION_OPTIONS[0];

    const handleSelect = (id: SectionType) => {
        onSelect(id);
        onClose();
    };

    return (
        <>
            {/* Invisible overlay to handle outside clicks */}
            <div 
                className="fixed inset-0 z-40 bg-transparent" 
                onClick={onClose}
            />

            <div 
                ref={modalRef}
                className={cn(
                    "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col z-50 border border-slate-200 transition-all duration-200 animate-in fade-in zoom-in-95",
                    position === 'sidebar' 
                        ? "absolute left-[70px] top-20 w-[700px] h-[500px] rounded-xl" // Compact Sidebar Mode
                        : position === 'popover'
                            ? "fixed w-[700px] h-[500px] rounded-xl shadow-2xl" // Popover Mode (style applied via inline style)
                            : "fixed inset-0 m-auto w-[700px] h-[500px] rounded-xl" // Center Mode
                )}
                style={position === 'popover' ? popoverStyle : undefined}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="h-14 border-b px-4 flex items-center justify-between shrink-0 bg-white">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search sections..." 
                            className="pl-9 bg-slate-50 border-transparent focus:bg-white h-9 text-sm transition-all focus:ring-1 focus:ring-slate-200"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden bg-slate-50/50">
                    {/* Sidebar List */}
                    <div className="w-[240px] border-r bg-white overflow-y-auto p-2 flex-shrink-0">
                        <div className="space-y-0.5">
                            {filteredSections.map((section) => (
                                <button
                                    key={section.id}
                                    onMouseEnter={() => setPreviewSectionId(section.id)}
                                    onClick={() => handleSelect(section.id)}
                                    className={cn(
                                        "w-full text-left px-3 py-2.5 rounded-md flex items-center gap-3 transition-colors group",
                                        previewSectionId === section.id 
                                            ? "bg-slate-100 text-slate-900" 
                                            : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                                    )}
                                >
                                    <div className={cn(
                                        "p-1.5 rounded-md transition-colors",
                                        previewSectionId === section.id 
                                            ? "bg-white shadow-sm ring-1 ring-slate-200 text-slate-700" 
                                            : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm group-hover:text-slate-600"
                                    )}>
                                        <section.icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-sm truncate">{section.label}</div>
                                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">{section.description}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div 
                        className="flex-1 p-6 flex flex-col relative bg-slate-50/50 cursor-pointer"
                        onClick={() => handleSelect(activeSection.id)}
                    >
                        <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative group transition-all hover:shadow-md hover:border-blue-300">
                            {activeSection.preview}
                            
                            {/* Hover Hint */}
                            <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/10 transition-colors flex items-center justify-center">
                                {/* Invisible touch target mostly, but visual feedback on border */}
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <span className="text-xs font-medium text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                Click to add {activeSection.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
