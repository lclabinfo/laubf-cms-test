"use client";

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Separator } from "@/app/components/ui/separator"
import { 
    Monitor, 
    Smartphone, 
    Tablet, 
    Save, 
    AlertCircle,
    Check,
    X,
    Layout,
    Plus,
    FileText,
    ArrowLeft,
    Undo2,
    Redo2,
    ZoomIn,
    ZoomOut,
    ChevronRight,
    ChevronDown,
    Folder,
    MoreHorizontal,
    Settings,
    Copy,
    Trash2,
    GripVertical,
    File
} from "lucide-react"
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger, 
    DropdownMenuSeparator 
} from "@/app/components/ui/dropdown-menu"
import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
  Measurable
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { mockMinistries, Ministry } from "@/app/components/modules/church/ministries/data"
import { toast } from "sonner"
import { MinistryPageTemplate } from "./templates/MinistryPageTemplate"
import { HomePageTemplate } from "./templates/HomePageTemplate"
import { BibleStudyTemplate } from "./templates/BibleStudyTemplate"
import { BlankPageTemplate } from "./templates/BlankPageTemplate"
import { BuilderSidebar, BuilderDrawer, BuilderTool } from "./BuilderSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Page } from "./WebsiteNavbar"
import { cn } from "@/app/components/ui/utils"
import { AddPageModal } from "@/app/components/modules/website/AddPageModal"
import { PageSettingsModal } from "@/app/components/modules/website/PageSettingsModal"
import { SectionPickerModal, SectionType } from "@/app/components/modules/website/SectionPickerModal"
import { PageSection } from "./templates/HomePageTemplate"
import { BannerEditor } from "@/app/components/modules/website/sections/BannerEditor"
import { BannerSectionData, DEFAULT_BANNER_DATA } from "@/app/components/modules/website/sections/BannerSection"
import { HeroEditor } from "@/app/components/modules/website/sections/HeroEditor"
import { HeroSectionData, DEFAULT_HERO_DATA } from "@/app/components/modules/website/sections/HeroSection"

interface BuilderProps {
    page: any;
    onBack: () => void;
}

// Initial Pages Data
const initialPages: Page[] = [
    { id: 'home', title: 'Home', type: 'home', status: 'published' },
    { 
        id: 'ministries', 
        title: 'Ministries', 
        type: 'folder', 
        status: 'published',
        children: [
            { id: 'lbcc', title: 'LBCC Campus', type: 'ministry', ministryId: 'lbcc', status: 'published' },
            { id: 'usc', title: 'USC Campus', type: 'ministry', ministryId: 'usc', status: 'published' },
            { id: 'csulb', title: 'CSULB Campus', type: 'ministry', ministryId: 'csulb', status: 'draft' },
        ]
    },
    { id: 'about', title: 'About Us', type: 'page', status: 'published' },
    { id: 'bible-study', title: 'Bible Study', type: 'page', status: 'published' },
    { id: 'events', title: 'Events', type: 'page', status: 'published' },
];

const INITIAL_SECTIONS: PageSection[] = [
     { id: 'hero-1', type: 'hero', data: DEFAULT_HERO_DATA },
     { id: 'banner-1', type: 'banner', data: DEFAULT_BANNER_DATA },
     { id: 'feat-1', type: 'custom-features' },
     { id: 'cal-1', type: 'custom-calendar' }
];

export function Builder({ page, onBack }: BuilderProps) {
    const [activeTool, setActiveTool] = useState<BuilderTool>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [isSaving, setIsSaving] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);
    
    // Page Editing State
    const [editingPage, setEditingPage] = useState<Page | null>(null);

    // Section Management State
    const [homePageSections, setHomePageSections] = useState<PageSection[]>(INITIAL_SECTIONS);
    const [addSectionIndex, setAddSectionIndex] = useState<number | null>(null);
    const [addSectionTriggerRect, setAddSectionTriggerRect] = useState<DOMRect | null>(null);
    const [editingSectionType, setEditingSectionType] = useState<string | null>(null);

    // Page Management State
    const [pages, setPages] = useState<Page[]>(initialPages);
    const [activePageId, setActivePageId] = useState<string>('home');
    const [expandedFolders, setExpandedFolders] = useState<string[]>(['ministries']);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragItem, setActiveDragItem] = useState<Page | null>(null);
    const [activeDragStartDepth, setActiveDragStartDepth] = useState<number>(0);

    // CMS Content State
    const [ministriesMap, setMinistriesMap] = useState<Record<string, Ministry>>(() => {
        const map: Record<string, Ministry> = {};
        mockMinistries.forEach(m => map[m.id] = m);
        return map;
    });

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Helper to find the active page object
    const findPage = (items: Page[], id: string): Page | null => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findPage(item.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const activePage = findPage(pages, activePageId);

    // Close "Add Section" tool when switching to a restricted page (ministry)
    useEffect(() => {
        if (activePage?.type === 'ministry' && activeTool === 'add') {
            setActiveTool(null);
        }
    }, [activePage?.type, activeTool]);

    // Derived state for the CURRENT ministry being edited based on activePageId
    const currentMinistryId = activePage?.ministryId || (activePage?.type === 'ministry' ? activePage.id : 'lbcc');
    const ministryData = ministriesMap[currentMinistryId] || ministriesMap['lbcc'];

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => 
            prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
        );
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Changes saved successfully");
        }, 800);
    };

    const handleDataUpdate = (field: keyof Ministry, value: any) => {
        const newData = { ...ministryData, [field]: value };
        setMinistriesMap(prev => ({
            ...prev,
            [ministryData.id]: newData
        }));
    };

    const handleNestedUpdate = (parent: keyof Ministry, index: number, field: string, value: any) => {
        const list = [...(ministryData[parent] as any[])];
        list[index] = { ...list[index], [field]: value };
        const newData = { ...ministryData, [parent]: list };
        setMinistriesMap(prev => ({
            ...prev,
            [ministryData.id]: newData
        }));
    };

    const handleAddPage = (newPage: any) => {
        const newPageItem: Page = {
            id: newPage.id,
            title: newPage.title,
            type: newPage.templateId === 'ministry-cms' ? 'ministry' : 'page',
            status: 'draft',
            ministryId: newPage.ministryId,
            url: newPage.url
        };
        
        setPages(prev => [...prev, newPageItem]);
        setActivePageId(newPage.id);
        
        toast.success(`Page "${newPage.title}" created successfully`);
    };

    const handleUpdatePage = (updatedPage: Page) => {
        setPages(prev => {
            const updateRecursive = (items: Page[]): Page[] => {
                return items.map(item => {
                    if (item.id === updatedPage.id) {
                        return updatedPage;
                    }
                    if (item.children) {
                        return { ...item, children: updateRecursive(item.children) };
                    }
                    return item;
                });
            };
            return updateRecursive(prev);
        });
        toast.success("Page updated");
    };

    const handleDeletePage = (pageId: string) => {
        setPages(prev => {
            const deleteRecursive = (items: Page[]): Page[] => {
                return items
                    .filter(item => item.id !== pageId)
                    .map(item => ({
                        ...item,
                        children: item.children ? deleteRecursive(item.children) : undefined
                    }));
            };
            return deleteRecursive(prev);
        });
        
        if (activePageId === pageId) {
            setActivePageId('home');
        }
        
        toast.success("Page deleted");
    };

    const zoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
    const zoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

    // --- Section Logic ---
    const handleAddSectionSelect = (type: SectionType) => {
        const newSection: PageSection = {
            id: `section-${Date.now()}`,
            type,
            data: type === 'banner' ? DEFAULT_BANNER_DATA : type === 'hero' ? DEFAULT_HERO_DATA : undefined
        };
        
        setHomePageSections(prev => {
            const insertIndex = addSectionIndex !== null ? addSectionIndex : prev.length;
            const newSections = [...prev];
            newSections.splice(insertIndex, 0, newSection);
            return newSections;
        });
        
        setAddSectionIndex(null);
        if (activeTool === 'add') setActiveTool(null);
        toast.success(`Added ${type} section`);
    };

    const handleEditSection = (sectionId: string, type: string, data?: any) => {
        setSelectedSectionId(sectionId);
        setEditingSectionType(type);
        setActiveTool('content');
    };
    
    const handleSectionDataUpdate = (sectionId: string, newData: any) => {
         setHomePageSections(prev => {
             return prev.map(s => s.id === sectionId ? { ...s, data: newData } : s);
         });
    };
    
    const handleSectionReorder = (newSections: PageSection[]) => {
        setHomePageSections(newSections);
    };

    const handleSectionDelete = (sectionId: string) => {
        setHomePageSections(prev => {
            return prev.filter(s => s.id !== sectionId);
        });
        toast.success("Section deleted");
        if (selectedSectionId === sectionId) setSelectedSectionId(null);
    };

    // --- DND LOGIC ---

    // Helper to find parent array, the list itself, and index
    const findParentInfo = (items: Page[], id: string, parentId: string | null = null): { items: Page[], index: number, parentId: string | null } | null => {
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) return { items, index, parentId };
        
        for (const item of items) {
            if (item.children) {
                const found = findParentInfo(item.children, id, item.id);
                if (found) return found;
            }
        }
        return null;
    };

    const findDepth = (items: Page[], id: string, depth: number = 0): number | null => {
        for (const item of items) {
            if (item.id === id) return depth;
            if (item.children) {
                const found = findDepth(item.children, id, depth + 1);
                if (found !== null) return found;
            }
        }
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
        setActiveDragItem(findPage(pages, event.active.id as string));
        const depth = findDepth(pages, event.active.id as string);
        setActiveDragStartDepth(depth ?? 0);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over, delta } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        // Find containers
        const activeInfo = findParentInfo(pages, activeId);
        const overInfo = findParentInfo(pages, overId);

        if (!activeInfo || !overInfo) return;

        // --- Live Preview Logic ---
        
        // Calculate indentation
        const INDENTATION_WIDTH = 20; // Decreased threshold for easier un-nesting
        const projectedDepth = activeDragStartDepth + Math.round(delta.x / INDENTATION_WIDTH);
        const currentDepth = findDepth(pages, activeId) ?? 0;

        // 1. Un-nesting (Outdent) - Dragging Left
        if (delta.x < -15 && activeInfo.parentId) { // Explicit check for left drag
            const parentPage = findPage(pages, activeInfo.parentId);
            const parentInfo = parentPage ? findParentInfo(pages, parentPage.id) : null;
            
            if (parentPage && parentInfo) {
                // We want to move active item to be a sibling of its parent
                // Specifically, inserting it AFTER the parent
                
                setPages((prev) => {
                    const clone = JSON.parse(JSON.stringify(prev));
                    
                    // Remove from current parent
                    const removeFromSource = (items: Page[]): Page[] => {
                        return items.map(i => {
                            if (i.id === activeInfo.parentId) {
                                return { ...i, children: i.children?.filter(c => c.id !== activeId) };
                            }
                            if (i.children) return { ...i, children: removeFromSource(i.children) };
                            return i;
                        });
                    };
                    
                    let newPages = removeFromSource(clone);
                    
                    // Add to grandparent list (after parent)
                    const addToDest = (items: Page[], destParentId: string | null): Page[] => {
                        if (destParentId === parentInfo.parentId) {
                            // Found the list where parent lives
                            const parentIndex = items.findIndex(x => x.id === parentPage.id);
                            if (parentIndex !== -1) {
                                const newItems = [...items];
                                // Insert after the parent folder
                                newItems.splice(parentIndex + 1, 0, activeDragItem || findPage(pages, activeId)!);
                                return newItems;
                            }
                        }
                        return items.map(i => {
                            if (i.children) return { ...i, children: addToDest(i.children, i.id) };
                            return i;
                        });
                    };
                    
                    // Special case for root level
                    if (parentInfo.parentId === null) {
                        const parentIndex = newPages.findIndex(x => x.id === parentPage.id);
                        if (parentIndex !== -1) {
                            newPages.splice(parentIndex + 1, 0, activeDragItem || findPage(pages, activeId)!);
                            return newPages;
                        }
                    }

                    return addToDest(newPages, null);
                });
                return;
            }
        }

        // 2. Nesting (Indent) - Dragging Right
        if (currentDepth < projectedDepth) {
            // Can we nest? (Need a sibling above)
            // Look at activeInfo.index
            if (activeInfo.index > 0) {
                const siblingAbove = activeInfo.items[activeInfo.index - 1];
                // Nest into siblingAbove
                if (siblingAbove && siblingAbove.id !== activeId) {
                     setPages((prev) => {
                        const clone = JSON.parse(JSON.stringify(prev));
                        
                        // Remove from current
                        const removeFromSource = (items: Page[]): Page[] => {
                            return items.filter(i => i.id !== activeId).map(i => ({
                                ...i,
                                children: i.children ? removeFromSource(i.children) : undefined
                            }));
                        };
                        const withoutActive = removeFromSource(clone);
                        
                        // Add to sibling
                        const addToDest = (items: Page[]): Page[] => {
                            return items.map(i => {
                                if (i.id === siblingAbove.id) {
                                    if (!expandedFolders.includes(i.id)) {
                                        setExpandedFolders(prev => [...prev, i.id]);
                                    }
                                    return {
                                        ...i,
                                        children: [...(i.children || []), activeDragItem!] 
                                    };
                                }
                                if (i.children) return { ...i, children: addToDest(i.children) };
                                return i;
                            });
                        };
                        
                        return addToDest(withoutActive);
                    });
                    return;
                }
            }
        }

        // 3. Standard Reordering / Moving Between Lists (Visual / Vertical)
        if (activeInfo.parentId !== overInfo.parentId) {
            setPages((prev) => {
                const clone = JSON.parse(JSON.stringify(prev)); 

                // Remove from source
                const removeFromSource = (items: Page[]): Page[] => {
                    return items.filter(i => i.id !== activeId).map(i => ({
                        ...i,
                        children: i.children ? removeFromSource(i.children) : undefined
                    }));
                };
                const pagesWithoutActive = removeFromSource(clone);
                
                const itemToMove = activeDragItem || findPage(pages, activeId);
                if (!itemToMove) return prev;

                // Add to destination
                const addToDest = (items: Page[], parentId: string | null): Page[] => {
                    if (parentId === overInfo.parentId) {
                        const newItems = [...items];
                        newItems.splice(overInfo.index, 0, itemToMove);
                        return newItems;
                    }
                    return items.map(item => {
                        if (item.children) {
                            return { ...item, children: addToDest(item.children, item.id) };
                        }
                        return item;
                    });
                };

                return addToDest(pagesWithoutActive, null);
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);
        setActiveDragItem(null);
        setActiveDragStartDepth(0);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeInfo = findParentInfo(pages, activeId);
        const overInfo = findParentInfo(pages, overId);

        if (activeInfo && overInfo && activeInfo.parentId === overInfo.parentId) {
            // Reordering within same list
            if (activeInfo.index !== overInfo.index) {
                setPages((prev) => {
                    const clone = JSON.parse(JSON.stringify(prev));
                    const updateRecursive = (items: Page[], parentId: string | null) => {
                        if (parentId === activeInfo.parentId) {
                            return arrayMove(items, activeInfo.index, overInfo.index);
                        }
                        return items.map(item => {
                            if (item.children) {
                                return { ...item, children: updateRecursive(item.children, item.id) };
                            }
                            return item;
                        });
                    };
                    return updateRecursive(clone, null);
                });
            }
        }
    };

    const SortablePageItem = ({ item, depth }: { item: Page, depth: number }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging
        } = useSortable({ id: item.id, data: { type: 'page', item } });

        const style = {
            transform: CSS.Translate.toString(transform),
            transition,
            opacity: isDragging ? 0.3 : 1,
            paddingLeft: `${depth * 12 + 8}px`,
            position: 'relative' as const,
            zIndex: isDragging ? 999 : 'auto'
        };

        const isFolder = item.type === 'folder' || (item.type === 'page' && !!item.children?.length);
        const isExpanded = expandedFolders.includes(item.id);
        const isActive = activePageId === item.id;
        
        // Determine actions for this item
        const isSystemPage = item.type === 'home' || item.type === 'ministry';
        
        const handleChangeType = (newType: 'folder' | 'page') => {
            handleUpdatePage({ ...item, type: newType });
        };

        return (
            <div ref={setNodeRef} style={style} {...attributes} className="outline-none">
                <div 
                    className={cn(
                        "flex items-center justify-between p-2 rounded-md cursor-pointer group transition-all my-0.5 relative",
                        isActive ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700",
                        isDragging && "ring-2 ring-blue-500 bg-blue-50 z-50 shadow-xl"
                    )}
                    onClick={() => {
                        if (isFolder && !isActive) {
                            toggleFolder(item.id);
                        } else {
                            setActivePageId(item.id);
                        }
                    }}
                >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div {...listeners} className="cursor-grab hover:text-slate-600 text-slate-300 flex-shrink-0 touch-none">
                            <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        {isFolder && (
                            <div 
                                className="p-0.5 hover:bg-slate-200 rounded cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); toggleFolder(item.id); }}
                            >
                                {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                            </div>
                        )}
                        {!isFolder && <div className="w-4" />}
                        
                        {item.type === 'home' ? <Layout className="w-3.5 h-3.5 opacity-70" /> : 
                         item.type === 'folder' ? <Folder className="w-3.5 h-3.5 opacity-70 fill-slate-200 text-slate-400" /> :
                         <FileText className="w-3.5 h-3.5 opacity-70" />
                        }
                        
                        <span className={cn("text-xs truncate font-medium select-none", isActive && "font-semibold")}>
                            {item.title}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {isActive && !isFolder && <Check className="w-3 h-3 text-blue-600" />}
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-slate-200/50 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity">
                                    <MoreHorizontal className="w-3 h-3 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setEditingPage(item)}>
                                    <Settings className="w-3.5 h-3.5 mr-2" /> Settings
                                </DropdownMenuItem>
                                
                                {!isSystemPage && (
                                    <>
                                        {item.type === 'folder' ? (
                                            <DropdownMenuItem onClick={() => handleChangeType('page')}>
                                                <FileText className="w-3.5 h-3.5 mr-2" /> Change to Page
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem onClick={() => handleChangeType('folder')}>
                                                <Folder className="w-3.5 h-3.5 mr-2" /> Change to Folder
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                )}

                                <DropdownMenuItem onClick={() => {}}>
                                    <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeletePage(item.id)}>
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        );
    };

    // Recursive List with SortableContext
    const SortablePageList = ({ items, depth = 0, parentId = 'root' }: { items: Page[], depth?: number, parentId?: string }) => {
        return (
            <SortableContext 
                items={items.map(p => p.id)} 
                strategy={verticalListSortingStrategy}
                id={parentId}
            >
                <div className="flex flex-col">
                    {items.map(item => (
                        <div key={item.id}>
                            <SortablePageItem item={item} depth={depth} />
                            
                            {/* Children */}
                            {item.children && item.children.length > 0 && expandedFolders.includes(item.id) && (
                                <div className="relative">
                                    {/* Indentation line */}
                                    <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" style={{ left: `${depth * 12 + 23}px` }} />
                                    <SortablePageList 
                                        items={item.children} 
                                        depth={depth + 1} 
                                        parentId={item.id} 
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </SortableContext>
        );
    };

    const renderDrawerContent = () => {
        switch (activeTool) {
            case 'pages':
                return (
                     <div className="flex flex-col h-full">
                         {/* Top Add Button */}
                         <div className="p-4 pb-2 border-b bg-white z-10">
                            <Button 
                                variant="outline" 
                                size="sm"
                                className="w-full justify-start text-xs h-8 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                                onClick={() => setIsAddPageModalOpen(true)}
                            >
                                <Plus className="w-3.5 h-3.5 mr-2" /> Add Page
                            </Button>
                         </div>

                         <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                             <DndContext 
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragOver={handleDragOver}
                             >
                                 <SortablePageList items={pages} />
                                 <DragOverlay dropAnimation={{
                                     sideEffects: defaultDropAnimationSideEffects({
                                         styles: {
                                             active: { opacity: '0.5' },
                                         },
                                     }),
                                 }}>
                                     {activeDragId && activeDragItem ? (
                                         <div className="p-2 bg-white rounded-md shadow-lg border border-slate-200 opacity-90 w-[240px]">
                                             <div className="flex items-center gap-2">
                                                 <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                                                 <span className="text-sm font-medium">{activeDragItem.title}</span>
                                             </div>
                                         </div>
                                     ) : null}
                                 </DragOverlay>
                             </DndContext>
                         </div>
                         
                         {/* Bottom Add Button */}
                         <div className="p-4 border-t bg-slate-50/50">
                            <Button 
                                className="w-full bg-black hover:bg-slate-800 text-white h-10 font-medium shadow-sm transition-all hover:shadow-md"
                                onClick={() => setIsAddPageModalOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Add Page
                            </Button>
                        </div>
                    </div>
                );
            case 'add':
                  return (
                    <div className="p-6 grid gap-4 custom-scrollbar overflow-y-auto">
                        <p className="text-xs text-muted-foreground mb-2">Drag and drop sections onto your page.</p>
                        {[{ title: "Hero Banner", description: "Large image with headline and CTA." },
                          { title: "Ministry Overview", description: "Description text with stats." },
                          { title: "Event List", description: "Dynamic list of upcoming events." },
                          { title: "Staff Directory", description: "Team members with photos and bios." },
                          { title: "FAQ Accordion", description: "Collapsible questions and answers." }
                        ].map((template, i) => (
                             <Card key={i} className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all">
                                <CardHeader className="p-3 pb-2">
                                    <CardTitle className="text-xs font-semibold flex items-center gap-2">
                                        <Layout className="w-3 h-3 text-muted-foreground" />
                                        {template.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                    <p className="text-[10px] text-muted-foreground">{template.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                );
            case 'theme':
                 return (
                    <div className="p-6 space-y-6 custom-scrollbar overflow-y-auto">
                         <div className="space-y-3">
                             <Label className="text-xs">Color Palette</Label>
                             <div className="grid grid-cols-5 gap-2">
                                {['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-rose-600', 'bg-emerald-600'].map(c => (
                                    <div key={c} className={`w-6 h-6 rounded-full ${c} cursor-pointer ring-offset-2 hover:ring-2 ring-slate-300`} />
                                ))}
                             </div>
                         </div>
                         <Separator />
                         <div className="space-y-3">
                             <Label className="text-xs">Typography</Label>
                             <Select defaultValue="inter">
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="inter">Inter & Inter</SelectItem>
                                    <SelectItem value="serif">Merriweather & Sans</SelectItem>
                                </SelectContent>
                             </Select>
                         </div>
                    </div>
                );
            case 'media':
                 return (
                    <div className="p-4 custom-scrollbar overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                             {[1,2,3,4,5,6].map(i => (
                                 <div key={i} className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group cursor-pointer">
                                     <img src={`https://picsum.photos/200?random=${i}`} className="w-full h-full object-cover" />
                                     <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                                         Use
                                     </div>
                                 </div>
                             ))}
                        </div>
                        <Button className="w-full mt-4 h-8 text-xs" variant="secondary">Upload Media</Button>
                    </div>
                );
            case 'content':
                if (!selectedSectionId) return (
                    <div className="p-8 text-center text-muted-foreground text-xs">
                        <p>Select a section to edit.</p>
                    </div>
                );

                // Handle Banner Editor
                if (editingSectionType === 'banner') {
                    const section = homePageSections?.find(s => s.id === selectedSectionId);
                    if (section) {
                        return (
                            <div className="h-full overflow-y-auto custom-scrollbar">
                                <BannerEditor 
                                    data={section.data} 
                                    onUpdate={(newData) => handleSectionDataUpdate(selectedSectionId, newData)} 
                                />
                            </div>
                        );
                    }
                }

                // Handle Hero Editor
                if (editingSectionType === 'hero') {
                    const section = homePageSections?.find(s => s.id === selectedSectionId);
                    if (section) {
                        return (
                            <div className="h-full overflow-y-auto custom-scrollbar">
                                <HeroEditor 
                                    data={section.data || DEFAULT_HERO_DATA} 
                                    onUpdate={(newData) => handleSectionDataUpdate(selectedSectionId, newData)} 
                                />
                            </div>
                        );
                    }
                }

                // Simple content editor for demo
                return (
                    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-right-2 h-full overflow-y-auto custom-scrollbar">
                         <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex gap-3 text-xs text-blue-800 mb-6">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <div>
                                <span className="font-semibold block mb-1">Editing Live CMS Content</span>
                                Updates shared database.
                            </div>
                        </div>
                         <div className="space-y-4">
                             <Label className="text-xs">Edit {selectedSectionId}</Label>
                             <Input className="h-8 text-xs" placeholder="Field value..." />
                             <Textarea className="text-xs" placeholder="Content..." />
                         </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const getDrawerTitle = () => {
        switch(activeTool) {
            case 'add': return 'Add Section';
            case 'pages': return 'Site Pages';
            case 'theme': return 'Theme & Design';
            case 'media': return 'Media Library';
            case 'content': return `Edit ${selectedSectionId || 'Section'}`;
            default: return '';
        }
    }

    const widthClass = device === 'mobile' ? 'max-w-[375px]' : device === 'tablet' ? 'max-w-[768px]' : 'w-full';
    
    const isHomePage = activePageId === 'home';

    return (
        <div className="flex flex-col h-[calc(100vh)] bg-slate-100 absolute inset-0 z-50">
            {/* Top Toolbar */}
            <div className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0 z-40 shadow-sm">
                <div className="flex items-center gap-4 w-[300px]">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900" onClick={() => {
                        if (confirm("Are you sure you want to exit? Any unsaved changes might be lost.")) {
                            onBack();
                        }
                    }}>
                        <ArrowLeft className="w-4 h-4" />
                        Exit
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <span className="font-bold text-lg tracking-tight">Figma<span className="text-blue-600">Make</span></span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 rounded-md p-1 border">
                        <Button variant={device === 'desktop' ? 'white' : 'ghost'} size="icon" className="h-8 w-8 rounded-sm shadow-sm" onClick={() => setDevice('desktop')}>
                            <Monitor className="h-4 w-4" />
                        </Button>
                        <Button variant={device === 'tablet' ? 'white' : 'ghost'} size="icon" className="h-8 w-8 rounded-sm" onClick={() => setDevice('tablet')}>
                            <Tablet className="h-4 w-4" />
                        </Button>
                        <Button variant={device === 'mobile' ? 'white' : 'ghost'} size="icon" className="h-8 w-8 rounded-sm" onClick={() => setDevice('mobile')}>
                            <Smartphone className="h-4 w-4" />
                        </Button>
                    </div>
                     <div className="flex items-center bg-slate-100 rounded-md p-1 border">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut}><ZoomOut className="h-4 w-4 text-slate-600" /></Button>
                        <span className="text-xs font-mono w-10 text-center text-slate-600">{zoom}%</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn}><ZoomIn className="h-4 w-4 text-slate-600" /></Button>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled><Undo2 className="h-4 w-4 text-slate-600" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled><Redo2 className="h-4 w-4 text-slate-600" /></Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-[300px] justify-end">
                    <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-blue-600 hover:bg-blue-700">
                        {isSaving ? <span className="animate-spin mr-2">⏳</span> : <Save className="mr-2 h-4 w-4" />}
                        Publish
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                <BuilderSidebar activeTool={activeTool} setActiveTool={setActiveTool} pageType={activePage?.type} />
                <div className="flex flex-1 relative overflow-hidden">
                    {/* Left Drawer for Tools */}
                    <div className={`bg-white border-r z-20 transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${activeTool && activeTool !== 'add' && activeTool !== 'content' ? 'w-[280px] opacity-100' : 'w-0 opacity-0 border-none'}`}>
                        <div className="w-[280px] h-full flex flex-col">
                             <BuilderDrawer activeTool={activeTool} onClose={() => { setActiveTool(null); setSelectedSectionId(null); }} title={getDrawerTitle()}>
                                {renderDrawerContent()}
                            </BuilderDrawer>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div 
                        className="flex-1 overflow-y-auto bg-slate-200/50 flex flex-col items-center py-8 px-8 relative scroll-smooth custom-scrollbar"
                        onClick={() => { if (activeTool === 'content') { setActiveTool(null); setSelectedSectionId(null); } }}
                    >
                         <div 
                            style={{ 
                                transform: `scale(${zoom / 100})`,
                                transformOrigin: 'top center',
                                marginBottom: `${(zoom - 100) * 8}px`
                            }}
                            className={`transition-all duration-300 shadow-2xl bg-white ${widthClass} min-h-[800px]`}
                            onClick={(e) => e.stopPropagation()} 
                         >
                            {isHomePage ? (
                                <HomePageTemplate 
                                    pages={pages} 
                                    activePageId={activePageId} 
                                    onNavigate={setActivePageId} 
                                    sections={homePageSections}
                                    onAddSection={(index, rect) => {
                                        setAddSectionIndex(index);
                                        if (rect) setAddSectionTriggerRect(rect);
                                    }}
                                    onReorder={handleSectionReorder}
                                    onDeleteSection={handleSectionDelete}
                                    selectedSectionId={selectedSectionId}
                                    onSelectSection={setSelectedSectionId}
                                    onEditSection={handleEditSection}
                                />
                            ) : activePageId === 'bible-study' ? (
                                <BibleStudyTemplate 
                                    pages={pages}
                                    activePageId={activePageId}
                                    onNavigate={setActivePageId}
                                />
                            ) : activePage?.type === 'page' && activePage.id.startsWith('page-') ? (
                                <BlankPageTemplate
                                    pages={pages}
                                    activePageId={activePageId}
                                    onNavigate={setActivePageId}
                                    sections={[]} // TODO: Manage sections state per page
                                    onAddSection={() => toast.info("Adding sections to new pages is coming soon!")}
                                    title={activePage.title}
                                />
                            ) : (
                                <MinistryPageTemplate 
                                    data={ministryData} 
                                    onUpdate={handleDataUpdate}
                                    onNestedUpdate={handleNestedUpdate}
                                    pages={pages}
                                    activePageId={activePageId}
                                    onNavigate={setActivePageId}
                                />
                            )}
                         </div>
                    </div>

                    {/* Right Drawer for Content Editing */}
                    <div className={`bg-white border-l z-20 transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${activeTool === 'content' ? 'w-[320px] opacity-100' : 'w-0 opacity-0 border-none'}`}>
                        <div className="w-[320px] h-full flex flex-col">
                             <BuilderDrawer activeTool={activeTool} onClose={() => { setActiveTool(null); setSelectedSectionId(null); }} title={getDrawerTitle()}>
                                {renderDrawerContent()}
                            </BuilderDrawer>
                        </div>
                    </div>
                </div>
            </div>
            
            <AddPageModal 
                isOpen={isAddPageModalOpen} 
                onClose={() => setIsAddPageModalOpen(false)} 
                onAddPage={handleAddPage} 
            />

            <PageSettingsModal 
                isOpen={!!editingPage}
                onClose={() => setEditingPage(null)}
                page={editingPage}
                ministries={mockMinistries.map(m => ({ id: m.id, name: m.name }))}
                onUpdate={handleUpdatePage}
                onDelete={handleDeletePage}
            />

            <SectionPickerModal 
                isOpen={activeTool === 'add' || addSectionIndex !== null}
                onClose={() => {
                    setAddSectionIndex(null);
                    setAddSectionTriggerRect(null);
                    if (activeTool === 'add') setActiveTool(null);
                }}
                onSelect={handleAddSectionSelect}
                position={activeTool === 'add' ? 'sidebar' : (addSectionTriggerRect ? 'popover' : 'center')}
                triggerRect={addSectionTriggerRect}
            />
        </div>
    );
}
