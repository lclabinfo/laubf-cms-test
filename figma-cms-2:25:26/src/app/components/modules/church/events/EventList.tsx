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
    Trash2,
    CheckCircle2,
    FileText,
    Plus,
    X,
    MapPin
} from "lucide-react"
import { format, isPast, isSameYear } from "date-fns"
import { EventCalendar, CalendarEvent } from "./EventCalendar"
import { mockEvents } from "./data"
import { cn } from "@/app/components/ui/utils"
import { DataList } from "../shared/DataList"
import { DataTable, type ColumnDef } from "../shared/DataTable"

// Helper to capitalize first letter
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Map MockEvent to the UI's Event format
const events: (CalendarEvent & { recurrencePattern: string, isPinned?: boolean })[] = mockEvents.map(e => ({
  id: e.id,
  title: e.title,
  date: e.startDate.toISOString(),
  endDate: e.endDate.toISOString(),
  location: e.location,
  type: capitalize(e.type) as "Event" | "Meeting" | "Program",
  status: e.status,
  registrations: e.registrations,
  ministry: e.ministry,
  description: e.description.replace(/<[^>]*>?/gm, ''), // Strip HTML for simple preview
  recurrencePattern: capitalize(e.recurrence.pattern),
  isPinned: e.isPinned
}));

interface EventListProps {
  onEdit: (id: string) => void
  onCreate: () => void
}

type SortKey = 'title' | 'date' | 'ministry' | 'status' | 'registrations';

export function EventList({ onEdit, onCreate }: EventListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("list")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  
  // Filter State
  const [activeFilters, setActiveFilters] = useState({
      type: [] as string[],
      status: [] as string[],
      time: "all" as "upcoming" | "past" | "all"
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc' // Default to latest on top
  });

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key: key as SortKey,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const clearFilters = () => {
      setActiveFilters({
          type: [],
          status: [],
          time: "all"
      })
      setSearchTerm("")
  }

  // Filter Logic
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
        const matchesSearch = 
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesType = activeFilters.type.length === 0 || activeFilters.type.includes(event.type)
        const matchesStatus = activeFilters.status.length === 0 || activeFilters.status.includes(event.status)

        const eventDate = new Date(event.date)
        const matchesTime = 
            activeFilters.time === "all" ? true :
            activeFilters.time === "past" ? isPast(eventDate) :
            !isPast(eventDate)

        return matchesSearch && matchesType && matchesStatus && matchesTime
    })
  }, [searchTerm, activeFilters])

  const calendarEvents = filteredEvents; 

  // Sort Logic
  const sortedEvents = useMemo(() => {
      return [...filteredEvents].sort((a, b) => {
        // Always put pinned items at the top if sorting by date (or other default views)
        if (sortConfig.key === 'date') {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
        }

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        let comparison = 0;
        
        if (sortConfig.key === 'date') {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            comparison = dateA - dateB;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
  }, [filteredEvents, sortConfig])

  const activeFilterCount = [
      activeFilters.type.length > 0,
      activeFilters.status.length > 0,
      activeFilters.time !== "all"
  ].filter(Boolean).length;

  const columns: ColumnDef<typeof events[0]>[] = [
    {
        accessorKey: "title",
        header: "Event",
        width: "w-[300px]",
        sortable: true,
        cell: (event) => (
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    {event.isPinned && <Pin className="h-3 w-3 rotate-45 text-blue-500 fill-blue-500" />}
                    <span className="font-semibold">{event.title}</span>
                </div>
                <Badge variant="outline" className="w-fit text-[10px] h-4 px-1 mt-1 font-normal text-muted-foreground border-transparent bg-transparent pl-0">
                    {event.type}
                </Badge>
            </div>
        )
    },
    {
        accessorKey: "date",
        header: "Date & Time",
        sortable: true,
        cell: (event) => {
            const startDate = new Date(event.date);
            const endDate = new Date(event.endDate || event.date);
            const isCurrentYear = isSameYear(startDate, new Date());
            const dateFormat = isCurrentYear ? "EEE, MMM d" : "EEE, MMM d, yyyy";
            
            return (
                <div className="flex flex-col text-sm">
                    <span className="font-medium">{format(startDate, dateFormat)}</span>
                    <span className="text-muted-foreground text-xs">
                        {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                    </span>
                </div>
            );
        }
    },
    {
        accessorKey: "recurrencePattern",
        header: "Recurrence",
        cell: (event) => (
            <div className="text-sm text-muted-foreground">
                {event.recurrencePattern === "None" ? "-" : event.recurrencePattern}
            </div>
        )
    },
    {
        accessorKey: "location",
        header: "Location",
        cell: (event) => (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{event.location}</span>
            </div>
        )
    },
    {
        accessorKey: "ministry",
        header: "Ministry",
        sortable: true,
        cell: (event) => (
            <div className="text-sm">{event.ministry || "-"}</div>
        )
    },
    {
        accessorKey: "status",
        header: "Status",
        sortable: true,
        cell: (event) => (
            <Badge
                variant={
                    event.status === "published"
                    ? "default"
                    : event.status === "draft"
                    ? "secondary"
                    : "outline"
                }
            >
                {event.status}
            </Badge>
        )
    },
    {
        key: "actions",
        header: "",
        width: "w-[50px]",
        cell: (event) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(event.id)}>
                    Edit Details
                    </DropdownMenuItem>
                    {event.isPinned ? (
                        <DropdownMenuItem>
                            <PinOff className="mr-2 h-4 w-4" /> Unpin Event
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem>
                            <Pin className="mr-2 h-4 w-4" /> Pin Event
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                    Cancel Event
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }
  ];

  return (
    <div className="space-y-4">
        <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex items-center justify-between">
                <TabsList>
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                </TabsList>
            </div>
            
            <TabsContent value="list" className="mt-0">
                <DataList
                    search={
                        <div className="relative flex-1 md:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search events..."
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
                                    
                                    {/* Time Filter */}
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Time</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {['upcoming', 'past', 'all'].map((time) => {
                                                const isSelected = activeFilters.time === time;
                                                return (
                                                    <Badge
                                                        key={time}
                                                        variant={isSelected ? "default" : "outline"}
                                                        className="cursor-pointer capitalize"
                                                        onClick={() => {
                                                            setActiveFilters(prev => ({ ...prev, time: time as any }))
                                                        }}
                                                    >
                                                        {time}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Status Filter */}
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Status</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {['published', 'draft', 'scheduled'].map((status) => {
                                                const isSelected = activeFilters.status.includes(status);
                                                return (
                                                    <Badge
                                                        key={status}
                                                        variant={isSelected ? "default" : "outline"}
                                                        className="cursor-pointer capitalize"
                                                        onClick={() => {
                                                            setActiveFilters(prev => ({
                                                                ...prev,
                                                                status: isSelected 
                                                                    ? prev.status.filter(s => s !== status)
                                                                    : [...prev.status, status]
                                                            }))
                                                        }}
                                                    >
                                                        {status}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Type Filter */}
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Type</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Event', 'Meeting', 'Program'].map((type) => {
                                                const isSelected = activeFilters.type.includes(type);
                                                return (
                                                    <Badge
                                                        key={type}
                                                        variant={isSelected ? "default" : "outline"}
                                                        className="cursor-pointer capitalize"
                                                        onClick={() => {
                                                            setActiveFilters(prev => ({
                                                                ...prev,
                                                                type: isSelected 
                                                                    ? prev.type.filter(s => s !== type)
                                                                    : [...prev.type, type]
                                                            }))
                                                        }}
                                                    >
                                                        {type}
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
                            New Event
                        </Button>
                    }
                    selectionActions={selectedEvents.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-2 ml-auto">
                            <span className="text-sm text-muted-foreground mr-2">{selectedEvents.length} selected</span>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8">
                                        <Pin className="mr-2 h-3 w-3" /> Pin / Unpin
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>
                                        <Pin className="mr-2 h-3 w-3" /> Pin Selected
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <PinOff className="mr-2 h-3 w-3" /> Unpin Selected
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

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
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="destructive" size="sm" className="h-8">
                                <Trash2 className="mr-2 h-3 w-3" /> Delete
                            </Button>
                        </div>
                    ) : null}
                >
                    <DataTable
                        data={sortedEvents}
                        columns={columns}
                        keyExtractor={(item) => item.id}
                        selectedIds={selectedEvents}
                        onSelect={setSelectedEvents}
                        onRowClick={(item) => onEdit(item.id)}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        emptyMessage="No events found."
                        mobileRenderer={(event) => (
                            <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    event.status === "published"
                                                    ? "default"
                                                    : event.status === "draft"
                                                    ? "secondary"
                                                    : "outline"
                                                }
                                                className="h-5 px-1.5 text-[10px]"
                                            >
                                                {event.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(event.date), "MMM d")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {event.isPinned && <Pin className="h-3 w-3 rotate-45 text-blue-500 fill-blue-500" />}
                                            <span className="font-medium truncate leading-snug">{event.title}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">{event.location}</span>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" className="h-8 w-8 p-0 -mr-2">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(event.id)}>
                                                Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive">
                                                Cancel Event
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )}
                    />
                </DataList>
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-0">
                <div className="flex justify-end mb-4">
                    <Button onClick={onCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Event
                    </Button>
                </div>
                <EventCalendar events={calendarEvents} onEditEvent={onEdit} />
            </TabsContent>
        </Tabs>
    </div>
  )
}
