"use client";

import React, { useState, useRef } from "react";
import { 
    Search, 
    Calendar, 
    Book, 
    ChevronDown, 
    ArrowRight, 
    FileText, 
    Video,
    Grid,
    List,
    Edit3,
    ArrowUpRight,
    Database
} from "lucide-react";
import { WebsiteNavbar, Page } from "../WebsiteNavbar";
import { mockStudies, mockPageData, Study } from "@/app/components/modules/church/studies/data";
import { cn } from "@/app/components/ui/utils";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";

interface BibleStudyTemplateProps {
    pages: Page[];
    activePageId?: string;
    onNavigate: (id: string) => void;
}

function LaubfLogo() {
  return (
    <div className="h-[48px] relative shrink-0 w-[58px]" data-name="laubf-logo">
      {/* Placeholder SVG matching Home Template */}
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 58 48">
         <path d="M29 0L58 48H0L29 0Z" fill="white" />
      </svg>
    </div>
  );
}

const HeroSection = ({ 
    title, 
    subtitle, 
    description, 
    onEdit 
}: { 
    title: string; 
    subtitle: string; 
    description: string;
    onEdit?: () => void;
}) => {
    return (
        <div 
            className="relative bg-black text-white py-24 px-6 md:px-12 lg:px-24 overflow-hidden group min-h-[400px] flex flex-col justify-center"
        >
             {/* Hover overlay to indicate editability - Positioned BOTTOM RIGHT as requested */}
             {onEdit && (
                <div className="absolute z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-8 right-8">
                     <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex flex-col min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
                        <Button 
                            variant="ghost" 
                            className="justify-start h-9 px-3 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full"
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        >
                            <Edit3 className="w-4 h-4 mr-2 text-gray-500" /> 
                            Edit Header
                        </Button>
                    </div>
                </div>
            )}
            
            {/* Blue border on hover */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-600 pointer-events-none rounded-lg z-10 transition-colors duration-200" />

            <div className="max-w-7xl mx-auto relative z-20">
                <div className="inline-block border border-white/20 rounded-full px-4 py-1.5 mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest">{subtitle}</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-none">
                    {title}
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
};

const StudyCard = ({ study }: { study: Study }) => {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group flex flex-col h-full relative">
            <div className="p-6 flex-1 flex flex-col">
                {/* Header: Series/Book Badge */}
                <div className="flex items-center gap-2 mb-4 opacity-60">
                    <Book className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">{study.series || study.book}</span>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-6">
                    {study.reference}
                </h3>

                {/* Date */}
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{study.date}</span>
                </div>

                {/* Subtitle / Sermon Title */}
                <h4 className="text-lg font-bold text-gray-900 leading-tight mb-4">
                    {study.title}
                </h4>

                {/* Tags */}
                <div className="flex gap-2 mt-auto">
                    {study.hasVideo && (
                        <div className="bg-gray-50 text-gray-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1.5">
                            <Video className="w-3 h-3" /> Video
                        </div>
                    )}
                    {study.hasTranscript && (
                        <div className="bg-gray-50 text-gray-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1.5">
                            <FileText className="w-3 h-3" /> Transcript
                        </div>
                    )}
                </div>
            </div>

            {/* Footer: Link */}
            <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between group-hover:bg-gray-50/50 transition-colors">
                <span className="text-sm font-bold text-blue-700 flex items-center gap-2">
                    Open Study Guide
                </span>
                <ArrowRight className="w-4 h-4 text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0" />
            </div>

            {/* Upcoming Badge */}
            {study.isUpcoming && (
                <div className="absolute top-4 right-4 bg-black text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5 z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Upcoming
                </div>
            )}
        </div>
    );
};

export function BibleStudyTemplate({ pages, activePageId, onNavigate }: BibleStudyTemplateProps) {
    const [pageData, setPageData] = useState(mockPageData);
    const [isHeaderEditorOpen, setIsHeaderEditorOpen] = useState(false);
    
    // Filter States (Visual only for now as requested)
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleUpdateHeader = (field: keyof typeof mockPageData, value: string) => {
        setPageData(prev => ({ ...prev, [field]: value }));
    };

    // Check if there are unsaved changes by comparing current state with initial mock data
    const hasUnsavedChanges = JSON.stringify(pageData) !== JSON.stringify(mockPageData);

    const handleManageContent = () => {
        if (hasUnsavedChanges) {
            const confirmLeave = window.confirm(
                "You have unsaved changes to the page header. Are you sure you want to leave? Your changes may be lost."
            );
            if (!confirmLeave) return;
        }
        
        // Redirect to 'contents' as requested, where the 'messages' module lives
        onNavigate('contents');
    };

    return (
        <div className="min-h-screen bg-white font-['Inter',sans-serif] relative">
            {/* Navbar */}
            <WebsiteNavbar 
                pages={pages} 
                activePageId={activePageId} 
                onNavigate={onNavigate} 
                logo={<LaubfLogo />}
                className="absolute top-0 left-0 right-0 z-50"
            />

            {/* Hero Section (Editable) */}
            <HeroSection 
                title={pageData.heroTitle} 
                subtitle={pageData.heroSubtitle} 
                description={pageData.heroDescription}
                onEdit={() => setIsHeaderEditorOpen(true)}
            />

            {/* Header Editor Dialog */}
            <Dialog open={isHeaderEditorOpen} onOpenChange={setIsHeaderEditorOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Header Content</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Page Title</Label>
                            <Input 
                                value={pageData.heroTitle} 
                                onChange={(e) => handleUpdateHeader('heroTitle', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Subtitle (Tagline)</Label>
                            <Input 
                                value={pageData.heroSubtitle} 
                                onChange={(e) => handleUpdateHeader('heroSubtitle', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input 
                                value={pageData.heroDescription} 
                                onChange={(e) => handleUpdateHeader('heroDescription', e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>Banner Image URL</Label>
                            <Input 
                                value={pageData.bannerImage} 
                                onChange={(e) => handleUpdateHeader('bannerImage', e.target.value)}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Main Content Area */}
            {/* Wrapped in relative container for Overlay */}
            <div className="relative group/content">
                
                {/* Overlay for "Manage Content" */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 opacity-0 group-hover/content:opacity-100 transition-all duration-300 flex flex-col items-center justify-center pointer-events-none group-hover/content:pointer-events-auto p-6 text-center">
                    <div className="max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-300 slide-in-from-bottom-4">
                        <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-2 backdrop-blur-md border border-white/20">
                             <Database className="w-8 h-8 text-blue-400" />
                        </div>
                        
                        <div className="space-y-2">
                             <h3 className="text-2xl font-bold text-white tracking-tight">Managed via Messages Module</h3>
                             <p className="text-gray-300 text-lg leading-relaxed">
                                This content is automatically synced from your Bible Study database. 
                                To add or edit studies, please visit the Messages tab.
                             </p>
                        </div>

                        <Button 
                            size="lg" 
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-8 py-6 rounded-full shadow-xl w-full sm:w-auto transition-all hover:scale-105"
                            onClick={handleManageContent}
                        >
                            Go to Messages
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>

                <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12 filter group-hover/content:blur-[2px] transition-all duration-300">
                    
                    {/* Tabs / Pills */}
                    <div className="flex items-center gap-2 mb-8 pointer-events-none group-hover/content:pointer-events-none">
                        <Button variant="default" className="bg-[#3667b1] hover:bg-[#2c528c] rounded-full px-6 h-9 text-xs font-bold tracking-wide uppercase">
                            All Studies
                        </Button>
                        <Button variant="ghost" className="text-gray-500 hover:text-gray-900 rounded-full px-6 h-9 text-xs font-bold tracking-wide uppercase">
                            <span className="mr-2">📁</span> Series
                        </Button>
                        <Button variant="ghost" className="text-gray-500 hover:text-gray-900 rounded-full px-6 h-9 text-xs font-bold tracking-wide uppercase">
                            <span className="mr-2">📓</span> Books
                        </Button>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 mb-12 items-center pointer-events-none group-hover/content:pointer-events-none">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <Input 
                                placeholder="Search studies..." 
                                className="pl-9 bg-transparent border-transparent hover:bg-gray-50 transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <div className="h-6 w-px bg-gray-200 hidden md:block" />

                        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                            <Button variant="outline" size="sm" className="h-9 gap-2 text-gray-600 border-gray-200">
                                Series <ChevronDown className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 gap-2 text-gray-600 border-gray-200">
                                Books <ChevronDown className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 gap-2 text-gray-600 border-gray-200">
                                <Calendar className="w-3 h-3" /> From Date
                            </Button>
                             <Button variant="outline" size="sm" className="h-9 gap-2 text-gray-600 border-gray-200">
                                <Calendar className="w-3 h-3" /> To Date
                            </Button>
                        </div>

                         <div className="h-6 w-px bg-gray-200 hidden md:block" />

                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mr-2">Sort: Date ↓</span>
                            <div className="flex bg-gray-100 rounded p-1">
                                <button 
                                    className={cn("p-1 rounded hover:bg-white shadow-sm transition-all", viewMode === 'grid' && "bg-white shadow text-black")}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button 
                                    className={cn("p-1 rounded hover:bg-white shadow-sm transition-all", viewMode === 'list' && "bg-white shadow text-black")}
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                         </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pointer-events-none group-hover/content:pointer-events-none">
                        {mockStudies.map(study => (
                            <StudyCard key={study.id} study={study} />
                        ))}
                    </div>

                    {/* Pagination / Footer */}
                    <div className="mt-16 text-center text-xs font-bold text-gray-400 uppercase tracking-widest pointer-events-none group-hover/content:pointer-events-none">
                        Showing {mockStudies.length} of {mockStudies.length} Studies
                    </div>
                </div>
            </div>

             {/* Footer */}
            <div className="bg-[#0a0a0a] text-white py-20 px-6 md:px-12 mt-20">
                <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="space-y-6">
                         <h4 className="font-bold text-lg">About</h4>
                         <ul className="space-y-3 text-gray-400 text-sm">
                            <li>Who We Are</li>
                            <li>Beliefs</li>
                            <li>Mission & Vision</li>
                         </ul>
                    </div>
                     <div className="space-y-6">
                         <h4 className="font-bold text-lg">Get Involved</h4>
                         <ul className="space-y-3 text-gray-400 text-sm">
                            <li>Sunday Worship</li>
                            <li>Bible Study</li>
                            <li>Campus Ministries</li>
                            <li>Events</li>
                         </ul>
                    </div>
                     <div className="space-y-6">
                         <h4 className="font-bold text-lg">Resources</h4>
                         <ul className="space-y-3 text-gray-400 text-sm">
                            <li>Sermons</li>
                            <li>Daily Bread</li>
                            <li>Bible Study Materials</li>
                            <li>Member Resources</li>
                         </ul>
                    </div>
                     <div className="space-y-6">
                         <h4 className="font-bold text-lg">Contact</h4>
                         <ul className="space-y-3 text-gray-400 text-sm">
                            <li>123 Main Street<br/>Los Angeles, CA 90001</li>
                            <li>info@laubf.org</li>
                            <li>(310) 555-1234</li>
                         </ul>
                    </div>
                </div>
                <div className="max-w-[1440px] mx-auto mt-20 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
                    © 2025 LA UBF. All Rights Reserved.
                </div>
            </div>
        </div>
    );
}
