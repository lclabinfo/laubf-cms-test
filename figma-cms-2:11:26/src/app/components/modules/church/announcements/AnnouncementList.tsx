"use client";

import { useState, useMemo } from "react"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Separator } from "@/app/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"
import { 
    MoreHorizontal, 
    Search, 
    Filter, 
    Copy, 
    Pin, 
    PinOff, 
    Mail, 
    CalendarClock, 
    CheckCircle2, 
    FileText, 
    Eye, 
    Trash2, 
    Archive, 
    Plus, 
    X
} from "lucide-react"
import { format } from "date-fns"
import { mockAnnouncements, AnnouncementStatus } from "./data"
import { cn } from "@/app/components/ui/utils"
import { DataList } from "../shared/DataList"
import { DataTable, type ColumnDef } from "../shared/DataTable"

// Helper to capitalize first letter
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface AnnouncementListProps {
  onEdit: (id: string) => void
  onCreate: () => void
}

type SortKey = 'title' | 'publishDate' | 'category' | 'status' | 'views';

export function AnnouncementList({ onEdit, onCreate }: AnnouncementListProps) {
  // Use local state for items to enable mutations (pin/unpin functionality)
  const [items, setItems] = useState(mockAnnouncements)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'publishDate',
    direction: 'desc'
  });

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key: key as SortKey,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Tab Filter
    let matchesTab = true;
    if (activeTab === 'published') matchesTab = item.status === 'published';
    if (activeTab === 'drafts') matchesTab = item.status === 'draft';
    if (activeTab === 'scheduled') matchesTab = item.status === 'scheduled';
    if (activeTab === 'archived') matchesTab = item.status === 'archived';

    // Dropdown Status Filter (if used on 'all' tab)
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(item.status);

    return matchesSearch && matchesTab && matchesStatus
  })

  // Sort Logic
  const sortedItems = [...filteredItems].sort((a, b) => {
      // Pinned items on top
      if (sortConfig.key === 'publishDate') {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
      }

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      let comparison = 0;
      
      if (sortConfig.key === 'publishDate') {
          comparison = new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  // Bulk Actions Logic
  const selectedAnnouncements = items.filter(item => selectedItems.includes(item.id));
  const allSelectedPinned = selectedAnnouncements.length > 0 && selectedAnnouncements.every(item => item.isPinned);
  const allSelectedUnpinned = selectedAnnouncements.length > 0 && selectedAnnouncements.every(item => !item.isPinned);
  // Show pin/unpin action only if the selection is consistent (all pinned or all unpinned)
  const showPinAction = allSelectedPinned || allSelectedUnpinned;

  const handlePinAction = () => {
    const shouldPin = allSelectedUnpinned; // If all are unpinned, we pin them. If all are pinned, we unpin them.
    
    setItems(prevItems => prevItems.map(item => {
        if (selectedItems.includes(item.id)) {
            return { ...item, isPinned: shouldPin };
        }
        return item;
    }));
  };

  const getStatusColor = (status: AnnouncementStatus) => {
      switch (status) {
          case 'published': return "default";
          case 'draft': return "secondary";
          case 'scheduled': return "outline"; // Or a specific color if available
          case 'archived': return "outline";
          default: return "default";
      }
  }

  const clearFilters = () => {
      setStatusFilter([]);
      setSearchTerm("");
  }

  const activeFilterCount = statusFilter.length > 0 ? 1 : 0;

  const columns: ColumnDef<typeof items[0]>[] = [
      {
          accessorKey: "title",
          header: "Announcement",
          width: "w-[40%]",
          sortable: true,
          cell: (item) => (
              <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                      {item.isPinned && <Pin className="h-3 w-3 rotate-45 text-blue-500 fill-blue-500" />}
                      <span className="font-semibold">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>By {item.author}</span>
                      {/* Email indicator updated to reflect new emailLogs */}
                      {item.emailLogs && item.emailLogs.length > 0 && (
                          <>
                              <span>•</span>
                              <div className="flex items-center gap-1 text-green-600">
                                  <Mail className="h-3 w-3" />
                                  <span>Emailed</span>
                              </div>
                          </>
                      )}
                  </div>
              </div>
          )
      },
      {
          accessorKey: "status",
          header: "Status",
          sortable: true,
          cell: (item) => (
              <Badge variant={getStatusColor(item.status) as any} className="capitalize">
                  {item.status === 'scheduled' && <CalendarClock className="mr-1 h-3 w-3" />}
                  {item.status === 'published' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                  {item.status === 'draft' && <FileText className="mr-1 h-3 w-3" />}
                  {item.status}
              </Badge>
          )
      },
      {
          accessorKey: "category",
          header: "Category",
          sortable: true,
          cell: (item) => (
              <Badge variant="outline" className="capitalize font-normal text-muted-foreground">
                  {item.category}
              </Badge>
          )
      },
      {
          accessorKey: "publishDate",
          header: "Date",
          sortable: true,
          cell: (item) => (
              <div className="flex flex-col text-sm">
                  <span className={cn("font-medium", item.status === 'scheduled' && "text-blue-600")}>
                      {format(item.publishDate, "MMM d, yyyy")}
                  </span>
                  <span className="text-muted-foreground text-xs">
                      {format(item.publishDate, "h:mm a")}
                  </span>
              </div>
          )
      },
      {
          accessorKey: "views",
          header: <div className="text-right">Views</div>,
          sortable: true,
          className: "text-right",
          cell: (item) => (
              <div className="flex items-center justify-end gap-1 text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {item.views}
              </div>
          )
      },
      {
          key: "actions",
          header: "",
          width: "w-[50px]",
          cell: (item) => (
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(item.id)}>
                      View Details
                      </DropdownMenuItem>
                      {item.isPinned ? (
                          <DropdownMenuItem>
                              <PinOff className="mr-2 h-4 w-4" /> Unpin Announcement
                          </DropdownMenuItem>
                      ) : (
                          <DropdownMenuItem>
                              <Pin className="mr-2 h-4 w-4" /> Pin Announcement
                          </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                      </DropdownMenuItem>
                      {item.status !== 'published' && (
                          <DropdownMenuItem className="text-blue-600">
                              Publish Now
                          </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                          Archive
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
          )
      }
  ];

  return (
    <div className="space-y-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            
            <DataList
                search={
                    <div className="relative flex-1 md:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search title, author..."
                            className="pl-8 bg-muted/30 border-muted-foreground/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                }
                filters={
                    <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <PopoverTrigger asChild>
                             <Button 
                                variant={activeFilterCount > 0 ? "secondary" : "outline"} 
                                className={cn(
                                    "gap-2 h-9",
                                    activeFilterCount === 0 && "bg-muted/30 border-muted-foreground/20",
                                    activeFilterCount > 0 && "bg-accent text-accent-foreground border-accent pl-3 pr-2"
                                )}
                            >
                                {activeFilterCount > 0 ? (
                                    <>
                                        <span className="font-medium">{activeFilterCount} active</span>
                                        <div 
                                            role="button" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearFilters();
                                            }}
                                            className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Filter className="h-3.5 w-3.5" />
                                        Filters
                                    </>
                                )}
                             </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-4" align="start">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium leading-none">Filters</h4>
                                    <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-primary" onClick={clearFilters}>
                                        Reset
                                    </Button>
                                </div>
                                <Separator />
                                
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Status</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {['published', 'draft', 'scheduled', 'archived'].map((status) => {
                                            const isSelected = statusFilter.includes(status);
                                            return (
                                                <Badge
                                                    key={status}
                                                    variant={isSelected ? "default" : "outline"}
                                                    className="cursor-pointer capitalize"
                                                    onClick={() => {
                                                        setStatusFilter(prev => 
                                                            isSelected 
                                                                ? prev.filter(s => s !== status)
                                                                : [...prev, status]
                                                        )
                                                    }}
                                                >
                                                    {status}
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                }
                actions={
                    <Button onClick={onCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Announcement
                    </Button>
                }
                selectionActions={selectedItems.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-2 ml-auto">
                        <span className="text-sm text-muted-foreground mr-2">{selectedItems.length} selected</span>
                        
                        {showPinAction && (
                            <Button variant="outline" size="sm" className="h-8" onClick={handlePinAction}>
                                {allSelectedPinned ? (
                                    <>
                                        <PinOff className="mr-2 h-3 w-3" /> Unpin Selected
                                    </>
                                ) : (
                                    <>
                                        <Pin className="mr-2 h-3 w-3" /> Pin Selected
                                    </>
                                )}
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8">
                                    Change Status
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>
                                    <CheckCircle2 className="mr-2 h-3 w-3" /> Publish
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <FileText className="mr-2 h-3 w-3" /> Mark as Draft
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Archive className="mr-2 h-3 w-3" /> Archive
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                         <Button variant="destructive" size="sm" className="h-8">
                            <Trash2 className="mr-2 h-3 w-3" /> Delete
                        </Button>
                    </div>
                ) : null}
            >
                <DataTable
                    data={sortedItems}
                    columns={columns}
                    keyExtractor={(item) => item.id}
                    selectedIds={selectedItems}
                    onSelect={setSelectedItems}
                    onRowClick={(item) => onEdit(item.id)}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    emptyMessage="No announcements found."
                    mobileRenderer={(item) => (
                        <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getStatusColor(item.status) as any} className="h-5 px-1.5 text-[10px] capitalize">
                                            {item.status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{format(item.publishDate, "MMM d")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.isPinned && <Pin className="h-3 w-3 rotate-45 text-blue-500 fill-blue-500" />}
                                        <span className="font-medium truncate leading-snug">{item.title}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {item.category} • {item.views} views
                                    </span>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" className="h-8 w-8 p-0 -mr-2">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(item.id)}>
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">
                                            Archive
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )}
                />
            </DataList>
        </Tabs>
    </div>
  )
}
