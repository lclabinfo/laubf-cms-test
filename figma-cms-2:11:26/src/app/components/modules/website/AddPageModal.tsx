"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter, 
    DialogDescription 
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/app/components/ui/select";
import { 
    LayoutTemplate, 
    BookOpen, 
    ArrowRight, 
    Check, 
    Database, 
    Globe,
    FilePlus,
    Layout,
    ArrowLeft,
    Calendar,
    Users,
    Mail,
    Heart,
    Info,
    X
} from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";

interface AddPageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddPage: (page: any) => void;
}

type PageType = "blank" | "template";
type TemplateCategory = "all" | "cms" | "standard";

interface Template {
    id: string;
    title: string;
    description: string;
    icon: any;
    category: "cms" | "standard";
    isLocked?: boolean;
    previewColor: string;
}

const TEMPLATES: Template[] = [
    {
        id: "ministry-cms",
        title: "Ministry Hub",
        description: "Full-featured ministry page connected to your CMS. Auto-populates leaders, events, and stories.",
        icon: Users,
        category: "cms",
        isLocked: true,
        previewColor: "bg-blue-100"
    },
    {
        id: "bible-study-cms",
        title: "Bible Study",
        description: "Scripture-focused layout locked to CMS series data. Automatically syncs latest sermons.",
        icon: BookOpen,
        category: "cms",
        isLocked: true,
        previewColor: "bg-amber-100"
    },
    {
        id: "about",
        title: "About Us",
        description: "Classic introduction page with history, mission statement, and value props.",
        icon: Info,
        category: "standard",
        previewColor: "bg-slate-100"
    },
    {
        id: "events",
        title: "Events Listing",
        description: "Grid view of upcoming events with filters and calendar integration.",
        icon: Calendar,
        category: "standard",
        previewColor: "bg-rose-100"
    },
    {
        id: "giving",
        title: "Giving & Tithing",
        description: "Secure donation portal with recurring giving options and fund designations.",
        icon: Heart,
        category: "standard",
        previewColor: "bg-emerald-100"
    },
    {
        id: "contact",
        title: "Contact & Directions",
        description: "Map integration, contact forms, and service time information.",
        icon: Mail,
        category: "standard",
        previewColor: "bg-indigo-100"
    }
];

const MOCK_MINISTRIES = [
    { id: "m1", name: "Youth Ministry" },
    { id: "m2", name: "Worship Team" },
    { id: "m3", name: "Outreach" },
    { id: "m4", name: "Kids Church" }
];

export function AddPageModal({ isOpen, onClose, onAddPage }: AddPageModalProps) {
    // Steps: 1 = Type (Blank/Template), 2 = Template Select, 3 = Config/Connect
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [pageType, setPageType] = useState<PageType | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [templateCategory, setTemplateCategory] = useState<TemplateCategory>("all");
    
    // Config State
    const [pageName, setPageName] = useState("");
    const [connectionType, setConnectionType] = useState<"existing" | "new">("existing");
    const [selectedMinistryId, setSelectedMinistryId] = useState<string>("");
    
    const handleClose = () => {
        setStep(1);
        setPageType(null);
        setSelectedTemplateId(null);
        setPageName("");
        setConnectionType("existing");
        setSelectedMinistryId("");
        onClose();
    };

    const handleTypeSelect = (type: PageType) => {
        setPageType(type);
        if (type === "blank") {
            setStep(3); // Skip template selection
        } else {
            setStep(2); // Go to template gallery
        }
    };

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplateId(templateId);
    };

    const handleTemplateConfirm = () => {
        if (selectedTemplateId) {
            setStep(3);
        }
    };

    const handleCreate = () => {
        // Determine final page details
        let finalTitle = pageName;
        let finalTemplateId = selectedTemplateId;
        let isLocked = false;
        let ministryId = undefined;

        if (pageType === "template" && selectedTemplateId) {
            const template = TEMPLATES.find(t => t.id === selectedTemplateId);
            if (template?.category === "cms") {
                // If CMS, use the ministry name or inputted name
                if (connectionType === "existing") {
                    const m = MOCK_MINISTRIES.find(m => m.id === selectedMinistryId);
                    finalTitle = m ? m.name : "Ministry Page";
                    ministryId = selectedMinistryId;
                } else {
                    finalTitle = pageName || template.title;
                    ministryId = `new-${Date.now()}`;
                }
                isLocked = true;
            } else {
                // Standard template
                finalTitle = pageName || template?.title || "New Page";
            }
        } else {
            // Blank
            finalTitle = pageName || "Untitled Page";
            finalTemplateId = "blank";
        }

        const newPage = {
            id: `page-${Date.now()}`,
            title: finalTitle,
            url: `#${finalTitle.toLowerCase().replace(/\s+/g, '-')}`,
            templateId: finalTemplateId,
            ministryId: ministryId,
            isLocked: isLocked,
            status: 'draft'
        };

        onAddPage(newPage);
        handleClose();
    };

    const selectedTemplate = TEMPLATES.find(t => t.id === selectedTemplateId);
    const filteredTemplates = TEMPLATES.filter(t => 
        templateCategory === "all" ? true : t.category === templateCategory
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className={cn(
                "transition-all duration-300 gap-0",
                step === 2 
                    ? "sm:max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden" 
                    : "sm:max-w-xl"
            )}>
                {/* Custom Close Button for Step 2 to avoid overlap issues if any */}
                {step === 2 && (
                    <button 
                        onClick={handleClose}
                        className="absolute right-4 top-4 z-50 p-2 bg-white/50 hover:bg-white rounded-full transition-colors hidden"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                {step !== 2 && (
                    <DialogHeader className="px-6 pt-6 pb-2">
                        <DialogTitle>
                            {step === 1 ? "Create New Page" : 
                             selectedTemplate?.category === "cms" ? "Connect Data Source" : "Page Details"}
                        </DialogTitle>
                        <DialogDescription>
                            {step === 1 ? "Choose how you want to start building." :
                             selectedTemplate?.category === "cms" ? "Link this page to your Church CMS." : "Name your new page."}
                        </DialogDescription>
                    </DialogHeader>
                )}

                {/* STEP 1: INITIAL CHOICE */}
                {step === 1 && (
                    <div className="p-6 pt-2 grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleTypeSelect("blank")}
                            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group gap-4 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <FilePlus className="w-8 h-8 text-gray-500 group-hover:text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">Blank Page</h3>
                                <p className="text-sm text-gray-500 mt-1">Start from scratch with an empty canvas</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleTypeSelect("template")}
                            className="flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group gap-4 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <Layout className="w-8 h-8 text-purple-600 group-hover:text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">Use Template</h3>
                                <p className="text-sm text-gray-500 mt-1">Browse pre-built layouts and structures</p>
                            </div>
                        </button>
                    </div>
                )}

                {/* STEP 2: TEMPLATE GALLERY */}
                {step === 2 && (
                    <div className="flex flex-1 h-full overflow-hidden">
                        {/* Left Sidebar: List - Fixed Width */}
                        <div className="w-[320px] shrink-0 border-r bg-gray-50/50 flex flex-col h-full">
                            <div className="p-5 border-b bg-white shrink-0">
                                <h2 className="font-bold text-lg mb-4">Select Template</h2>
                                <div className="flex flex-wrap gap-2">
                                    {(['all', 'cms', 'standard'] as const).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setTemplateCategory(cat)}
                                            className={cn(
                                                "text-xs px-3 py-1.5 rounded-full capitalize transition-colors font-medium",
                                                templateCategory === cat 
                                                    ? "bg-gray-900 text-white" 
                                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300"
                                            )}
                                        >
                                            {cat === 'cms' ? 'Data-Driven' : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-4 space-y-3">
                                    {filteredTemplates.map(template => (
                                        <div
                                            key={template.id}
                                            onClick={() => handleTemplateSelect(template.id)}
                                            className={cn(
                                                "p-3 rounded-lg cursor-pointer transition-all border text-left flex items-start gap-3",
                                                selectedTemplateId === template.id
                                                    ? "bg-white border-blue-600 shadow-md ring-1 ring-blue-600"
                                                    : "bg-white border-transparent shadow-sm hover:shadow hover:border-gray-300"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                                                template.category === 'cms' ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                                            )}>
                                                <template.icon className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-sm text-gray-900 truncate">{template.title}</span>
                                                    {template.category === 'cms' && (
                                                        <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wide">
                                                            CMS
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 leading-snug">
                                                    {template.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Right Area: Preview - Flexible */}
                        <div className="flex-1 bg-slate-100 flex flex-col relative min-w-0">
                            {/* Top Navigation Bar for Preview Area */}
                            <div className="h-16 px-6 bg-white border-b shrink-0 flex items-center justify-between shadow-sm z-10">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setStep(1)} 
                                    className="text-gray-500 hover:text-gray-900"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                </Button>
                                
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                                    <Button 
                                        onClick={handleTemplateConfirm} 
                                        disabled={!selectedTemplateId}
                                        className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
                                    >
                                        Use Template <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>

                            {/* Preview Canvas */}
                            <div className="flex-1 overflow-hidden relative p-8 flex items-center justify-center bg-slate-100/50">
                                {selectedTemplate ? (
                                    <div className="w-full h-full max-w-4xl bg-white rounded-xl shadow-xl border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                        {/* Browser Chrome */}
                                        <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-2 shrink-0">
                                            <div className="flex gap-1.5">
                                                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                                                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                                                <div className="w-3 h-3 rounded-full bg-green-400/80" />
                                            </div>
                                            <div className="mx-auto bg-white px-4 py-1.5 rounded-md text-xs text-gray-400 w-1/2 text-center border shadow-sm flex items-center justify-center gap-2">
                                                <Globe className="w-3 h-3" />
                                                church.com/{selectedTemplate.title.toLowerCase().replace(" ", "-")}
                                            </div>
                                        </div>
                                        
                                        {/* Preview Content */}
                                        <div className="flex-1 overflow-y-auto relative bg-white">
                                            {/* Mock Content Placeholder */}
                                            <div className="p-12 max-w-3xl mx-auto space-y-10">
                                                {/* Hero Section */}
                                                <div className={cn("w-full aspect-[21/9] rounded-xl shadow-inner", selectedTemplate.previewColor)} />
                                                
                                                {/* Content Blocks */}
                                                <div className="space-y-6">
                                                    <div className="w-3/4 h-10 bg-gray-100 rounded-lg" />
                                                    <div className="space-y-3">
                                                        <div className="w-full h-4 bg-gray-50 rounded" />
                                                        <div className="w-full h-4 bg-gray-50 rounded" />
                                                        <div className="w-5/6 h-4 bg-gray-50 rounded" />
                                                    </div>
                                                </div>

                                                {/* Grid Section */}
                                                <div className="grid grid-cols-3 gap-6">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="aspect-square bg-gray-50 rounded-xl border border-dashed border-gray-200" />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Watermark/Overlay for CMS */}
                                            {selectedTemplate.category === 'cms' && (
                                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                                                    <div className="bg-white p-8 rounded-2xl shadow-2xl border border-amber-200 max-w-md text-center transform hover:scale-105 transition-transform duration-300">
                                                        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
                                                            <Database className="w-8 h-8 text-amber-600" />
                                                        </div>
                                                        <h3 className="font-bold text-xl text-gray-900 mb-2">Data-Driven Template</h3>
                                                        <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                                            This layout is structurally locked to ensure consistency with your CMS data. 
                                                            Content is managed automatically.
                                                        </p>
                                                        <div className="flex gap-2 justify-center">
                                                             <div className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">
                                                                Read-only Structure
                                                             </div>
                                                             <div className="text-[10px] font-mono bg-amber-50 px-2 py-1 rounded text-amber-700">
                                                                Dynamic Content
                                                             </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-400 p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                                        <Layout className="w-16 h-16 mb-4 opacity-20" />
                                        <p className="font-medium text-lg">Select a template to preview</p>
                                        <p className="text-sm opacity-60">Choose a template from the sidebar</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: CONFIGURATION */}
                {step === 3 && (
                    <>
                        <div className="p-6 py-4">
                            {selectedTemplate?.category === "cms" ? (
                                <div className="space-y-6">
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                                        <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-amber-900 text-sm">CMS Connection Required</h4>
                                            <p className="text-amber-700 text-xs mt-1">
                                                The <strong>{selectedTemplate.title}</strong> template requires a data source.
                                            </p>
                                        </div>
                                    </div>

                                    <RadioGroup 
                                        value={connectionType} 
                                        onValueChange={(v) => setConnectionType(v as "existing" | "new")}
                                        className="grid grid-cols-2 gap-4"
                                    >
                                        <div>
                                            <RadioGroupItem value="existing" id="existing" className="peer sr-only" />
                                            <Label 
                                                htmlFor="existing"
                                                className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                                            >
                                                <Database className="mb-3 h-6 w-6" />
                                                <div className="font-semibold text-center">Existing Ministry</div>
                                                <div className="text-xs text-muted-foreground text-center mt-1">
                                                    Import data from CMS
                                                </div>
                                            </Label>
                                        </div>
                                        <div>
                                            <RadioGroupItem value="new" id="new" className="peer sr-only" />
                                            <Label 
                                                htmlFor="new"
                                                className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                                            >
                                                <Globe className="mb-3 h-6 w-6" />
                                                <div className="font-semibold text-center">Create New</div>
                                                <div className="text-xs text-muted-foreground text-center mt-1">
                                                    Start fresh in Builder
                                                </div>
                                            </Label>
                                        </div>
                                    </RadioGroup>

                                    <div className="pt-4 border-t border-gray-100">
                                        {connectionType === "existing" ? (
                                            <div className="space-y-3">
                                                <Label>Select Ministry Source</Label>
                                                <Select value={selectedMinistryId} onValueChange={setSelectedMinistryId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choose a ministry..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {MOCK_MINISTRIES.map(m => (
                                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <Label>New Ministry Name</Label>
                                                <Input 
                                                    placeholder="e.g. Young Adults" 
                                                    value={pageName}
                                                    onChange={(e) => setPageName(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Page Name</Label>
                                        <Input 
                                            placeholder="e.g. Our Mission" 
                                            value={pageName}
                                            onChange={(e) => setPageName(e.target.value)}
                                            autoFocus
                                        />
                                        <p className="text-xs text-gray-500">
                                            This will be used for the page title and URL.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="px-6 pb-6">
                            <Button variant="ghost" onClick={() => setStep(pageType === "blank" ? 1 : 2)}>Back</Button>
                            <Button 
                                onClick={handleCreate}
                                disabled={
                                    (selectedTemplate?.category === 'cms' && connectionType === 'existing' && !selectedMinistryId) ||
                                    (selectedTemplate?.category === 'cms' && connectionType === 'new' && !pageName) ||
                                    (pageType === 'blank' && !pageName) ||
                                    (pageType === 'template' && selectedTemplate?.category !== 'cms' && !pageName)
                                }
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {selectedTemplate?.category === 'cms' ? 'Create & Connect' : 'Create Page'}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
