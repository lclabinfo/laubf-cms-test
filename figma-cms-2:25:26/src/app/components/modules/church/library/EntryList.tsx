"use client";

import { useState, useMemo, useEffect } from "react"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/app/components/ui/command"
import { 
    MoreHorizontal, 
    Search, 
    Filter, 
    Trash2, 
    Video,
    FileText,
    Check,
    X,
    Radio,
    Plus
} from "lucide-react"
import { format } from "date-fns"
import { type Entry, mockSeries } from "@/app/data/store"
import { toast } from "sonner"
import { cn } from "@/app/components/ui/utils"
import { DataList } from "../shared/DataList"
import { DataTable, type ColumnDef } from "../shared/DataTable"

interface EntryListProps {
  entries: Entry[]
  onEdit: (id: string) => void
  initialSeriesId?: string | null
  onCreate: () => void
}

const BIBLE_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", 
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", 
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", 
    "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", 
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", 
    "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", 
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", 
    "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", 
    "Mark", "Luke", "John", "Acts", "Romans", 
    "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", 
    "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", 
    "Titus", "Philemon", "Hebrews", "James", "1 Peter", 
    "2 Peter", "1 John", "2 John", "3 John", "Jude", 
    "Revelation"
];

// Helper to extract book from passage
function getBookFromPassage(passage: string): string {
    if (!passage) return "";
    const match = passage.match(/^((?:\d\s+)?\D+?)(?=\s\d|$)/);
    return match ? match[1].trim() : passage;
}

export function EntryList({ entries, onEdit, initialSeriesId, onCreate }: EntryListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  // Default sort by date descending
  const [sortConfig, setSortConfig] = useState<{ key: keyof Entry | "series"; direction: "asc" | "desc" } | null>({ key: "date", direction: "desc" })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Livestream State
  const [livestreamUrl, setLivestreamUrl] = useState("https://youtube.com/live/example")
  const [tempLivestreamUrl, setTempLivestreamUrl] = useState(livestreamUrl)
  const [isLivestreamOpen, setIsLivestreamOpen] = useState(false)

  // Filter State
  const [activeFilters, setActiveFilters] = useState({
      status: [] as string[],
      speaker: "",
      seriesId: initialSeriesId || "",
      book: ""
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Update filters when initialSeriesId changes
  useEffect(() => {
      if (initialSeriesId) {
          setActiveFilters(prev => ({ ...prev, seriesId: initialSeriesId }));
      }
  }, [initialSeriesId]);

  // Derived Data for Filters
  const uniqueSpeakers = useMemo(() => Array.from(new Set(entries.map(e => e.speaker).filter(Boolean))).sort(), [entries])
  
  // Filtering
  const filteredEntries = useMemo(() => {
      return entries.filter((entry) => {
        // Resolve series names for search
        const entrySeriesNames = (entry.seriesIds || []).map(id => mockSeries.find(s => s.id === id)?.name || "").join(" ");

        // Search Term (Text Search)
        const matchesSearch = 
            entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entrySeriesNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.passage.toLowerCase().includes(searchTerm.toLowerCase());

        // Status Filter
        const matchesStatus = activeFilters.status.length === 0 || activeFilters.status.includes(entry.status);

        // Metadata Filters
        const matchesSpeaker = !activeFilters.speaker || entry.speaker === activeFilters.speaker;
        const matchesSeries = !activeFilters.seriesId || (entry.seriesIds && entry.seriesIds.includes(activeFilters.seriesId));
        const matchesBook = !activeFilters.book || getBookFromPassage(entry.passage) === activeFilters.book;

        return matchesSearch && matchesStatus && matchesSpeaker && matchesSeries && matchesBook;
      })
  }, [entries, searchTerm, activeFilters]);

  // Sorting
  const sortedEntries = useMemo(() => {
      return [...filteredEntries].sort((a, b) => {
        if (!sortConfig) return 0
        const { key, direction } = sortConfig
        
        if (key === 'series') {
             // Sort by first series name
             const aSeries = mockSeries.find(s => s.id === (a.seriesIds?.[0]))?.name || "";
             const bSeries = mockSeries.find(s => s.id === (b.seriesIds?.[0]))?.name || "";
             if (aSeries < bSeries) return direction === "asc" ? -1 : 1
             if (aSeries > bSeries) return direction === "asc" ? 1 : -1
             return 0
        }

        // @ts-ignore - Dynamic key access
        if (a[key] < b[key]) return direction === "asc" ? -1 : 1
        // @ts-ignore - Dynamic key access
        if (a[key] > b[key]) return direction === "asc" ? 1 : -1
        return 0
      })
  }, [filteredEntries, sortConfig]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key: key as keyof Entry | "series", direction })
  }

  const handleBulkAction = (action: string) => {
      toast.success(`${action} applied to ${selectedIds.length} items`)
      setSelectedIds([])
  }

  const handleSaveLivestream = () => {
      setLivestreamUrl(tempLivestreamUrl)
      setIsLivestreamOpen(false)
      toast.success("Livestream link updated")
  }

  const clearFilters = () => {
      setActiveFilters({
          status: [],
          speaker: "",
          seriesId: "",
          book: ""
      })
      setSearchTerm("")
  }

  const activeFilterCount = [
      activeFilters.status.length > 0,
      !!activeFilters.speaker,
      !!activeFilters.seriesId,
      !!activeFilters.book
  ].filter(Boolean).length;

  const getStatusVariant = (status: string) => {
      switch (status) {
          case 'published': return 'default';
          case 'draft': return 'secondary';
          case 'scheduled': return 'outline';
          case 'archived': return 'outline';
          default: return 'secondary';
      }
  }

  const getStatusClass = (status: string) => {
      if (status === 'scheduled') return "text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:text-orange-700";
      if (status === 'archived') return "text-muted-foreground border-muted";
      return "";
  }

  const columns: ColumnDef<Entry>[] = [
    {
        accessorKey: "title",
        header: "Title",
        width: "w-[300px]",
        sortable: true,
        cell: (entry) => (
            <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded bg-muted/50 flex items-center justify-center shrink-0 text-muted-foreground">
                    <Video className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-medium truncate leading-none pt-1">{entry.title}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                        <span>{entry.passage || "No passage"}</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        accessorKey: "speaker",
        header: "Speaker",
        width: "w-[20%]",
        sortable: true,
        cell: (entry) => (
            <span className="font-medium text-sm text-muted-foreground">
                {entry.speaker}
            </span>
        )
    },
    {
        accessorKey: "series",
        header: "Series",
        width: "w-[15%]",
        sortable: true,
        cell: (entry) => (
            <div className="flex flex-wrap gap-1">
                {entry.seriesIds && entry.seriesIds.length > 0 ? (
                    entry.seriesIds.map(id => {
                        const s = mockSeries.find(ms => ms.id === id);
                        return s ? (
                            <Badge key={id} variant="outline" className="font-normal text-[10px] h-5 px-1.5">
                                {s.name}
                            </Badge>
                        ) : null;
                    })
                ) : (
                    <span className="text-muted-foreground/50">-</span>
                )}
            </div>
        )
    },
    {
        accessorKey: "date",
        header: "Date",
        width: "w-[15%]",
        sortable: true,
        cell: (entry) => (
            <span className="text-sm text-muted-foreground">
                {format(new Date(entry.date), "MMM d, yyyy")}
            </span>
        )
    },
    {
        accessorKey: "status",
        header: "Status",
        width: "w-[100px]",
        sortable: false,
        cell: (entry) => (
            <Badge 
                variant={getStatusVariant(entry.status) as any} 
                className={cn(
                    "rounded-full px-2.5 font-normal capitalize shadow-none",
                    getStatusClass(entry.status)
                )}
            >
                {entry.status}
            </Badge>
        )
    },
    {
        accessorKey: "resources",
        header: "Resources",
        width: "w-[120px]",
        sortable: false,
        cell: (entry) => (
            <div className="flex items-center gap-3">
                {/* Sermon/Video Indicator */}
                {entry.videoUrl ? (
                    <div title="Sermon Available" className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
                        <Video className="h-4 w-4" />
                    </div>
                ) : (
                    <div title="No Sermon" className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/50 text-muted-foreground/30">
                        <Video className="h-4 w-4" />
                    </div>
                )}

                {/* Bible Study Indicator */}
                {entry.studyTabs.some(t => t.content.length > 20) ? (
                    <div title="Bible Study Available" className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 text-purple-600">
                        <FileText className="h-4 w-4" />
                    </div>
                ) : (
                    <div title="No Bible Study" className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/50 text-muted-foreground/30">
                        <FileText className="h-4 w-4" />
                    </div>
                )}
            </div>
        )
    },
    {
        key: "actions",
        header: "",
        width: "w-[50px]",
        cell: (entry) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(entry.id)}>
                        Edit Message
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }
  ];

  return (
    <DataList
        search={
            <div className="relative flex-1 md:max-w-xl flex gap-2">
              <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Search titles, speakers, passages..."
                      className="pl-8 bg-muted/30 border-muted-foreground/20"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
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
                          
                          {/* Status Filter */}
                          <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Status</Label>
                              <div className="flex flex-wrap gap-2">
                                  {['published', 'draft', 'scheduled', 'archived'].map((status) => {
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

                          {/* Speaker Filter */}
                          <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Speaker</Label>
                              <Popover>
                                  <PopoverTrigger asChild>
                                      <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm font-normal">
                                          {activeFilters.speaker || "Select speaker..."}
                                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[280px] p-0">
                                      <Command>
                                          <CommandInput placeholder="Search speakers..." />
                                          <CommandList>
                                              <CommandEmpty>No speaker found.</CommandEmpty>
                                              <CommandGroup>
                                                  {activeFilters.speaker && (
                                                      <CommandItem onSelect={() => setActiveFilters(prev => ({ ...prev, speaker: "" }))}>
                                                          <X className="mr-2 h-4 w-4" />
                                                          Clear selection
                                                      </CommandItem>
                                                  )}
                                                  {uniqueSpeakers.map((speaker) => (
                                                      <CommandItem
                                                          key={speaker}
                                                          value={speaker}
                                                          onSelect={() => {
                                                              setActiveFilters(prev => ({ 
                                                                  ...prev, 
                                                                  speaker: prev.speaker === speaker ? "" : speaker 
                                                              }))
                                                          }}
                                                      >
                                                          <Check className={cn("mr-2 h-4 w-4", activeFilters.speaker === speaker ? "opacity-100" : "opacity-0")} />
                                                          {speaker}
                                                      </CommandItem>
                                                  ))}
                                              </CommandGroup>
                                          </CommandList>
                                      </Command>
                                  </PopoverContent>
                              </Popover>
                          </div>

                          {/* Series Filter */}
                          <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Series</Label>
                              <Popover>
                                  <PopoverTrigger asChild>
                                      <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm font-normal">
                                          {mockSeries.find(s => s.id === activeFilters.seriesId)?.name || "Select series..."}
                                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[280px] p-0">
                                      <Command>
                                          <CommandInput placeholder="Search series..." />
                                          <CommandList>
                                              <CommandEmpty>No series found.</CommandEmpty>
                                              <CommandGroup>
                                                  {activeFilters.seriesId && (
                                                      <CommandItem onSelect={() => setActiveFilters(prev => ({ ...prev, seriesId: "" }))}>
                                                          <X className="mr-2 h-4 w-4" />
                                                          Clear selection
                                                      </CommandItem>
                                                  )}
                                                  {mockSeries.map((series) => (
                                                      <CommandItem
                                                          key={series.id}
                                                          value={series.name}
                                                          onSelect={() => {
                                                              setActiveFilters(prev => ({ 
                                                                  ...prev, 
                                                                  seriesId: prev.seriesId === series.id ? "" : series.id 
                                                              }))
                                                          }}
                                                      >
                                                          <Check className={cn("mr-2 h-4 w-4", activeFilters.seriesId === series.id ? "opacity-100" : "opacity-0")} />
                                                          {series.name}
                                                      </CommandItem>
                                                  ))}
                                              </CommandGroup>
                                          </CommandList>
                                      </Command>
                                  </PopoverContent>
                              </Popover>
                          </div>

                          {/* Book Filter */}
                          <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Book of the Bible</Label>
                              <Popover>
                                  <PopoverTrigger asChild>
                                      <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm font-normal">
                                          {activeFilters.book || "Select book..."}
                                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[280px] p-0 h-[300px]">
                                      <Command>
                                          <CommandInput placeholder="Search books..." />
                                          <CommandList>
                                              <CommandEmpty>No book found.</CommandEmpty>
                                              <CommandGroup>
                                                  {activeFilters.book && (
                                                      <CommandItem onSelect={() => setActiveFilters(prev => ({ ...prev, book: "" }))}>
                                                          <X className="mr-2 h-4 w-4" />
                                                          Clear selection
                                                      </CommandItem>
                                                  )}
                                                  {BIBLE_BOOKS.map((book) => (
                                                      <CommandItem
                                                          key={book}
                                                          value={book}
                                                          onSelect={() => {
                                                              setActiveFilters(prev => ({ 
                                                                  ...prev, 
                                                                  book: prev.book === book ? "" : book 
                                                              }))
                                                          }}
                                                      >
                                                          <Check className={cn("mr-2 h-4 w-4", activeFilters.book === book ? "opacity-100" : "opacity-0")} />
                                                          {book}
                                                      </CommandItem>
                                                  ))}
                                              </CommandGroup>
                                          </CommandList>
                                      </Command>
                                  </PopoverContent>
                              </Popover>
                          </div>
                      </div>
                  </PopoverContent>
              </Popover>
        }
        actions={
            <Button onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" />
                New Message
            </Button>
        }
        secondaryActions={
            <Dialog open={isLivestreamOpen} onOpenChange={setIsLivestreamOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 hidden md:flex">
                        <Radio className="h-4 w-4 text-red-600" />
                        Livestream Link
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Livestream Settings</DialogTitle>
                        <DialogDescription>
                            Enter the default link for your church's livestream. This will be used across your website.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="url">Stream URL</Label>
                            <Input
                                id="url"
                                value={tempLivestreamUrl}
                                onChange={(e) => setTempLivestreamUrl(e.target.value)}
                                placeholder="https://youtube.com/live/..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLivestreamOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveLivestream}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        }
        selectionActions={selectedIds.length > 0 ? (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="text-sm text-muted-foreground hidden md:inline-block mr-2">
                      {selectedIds.length} selected
                  </span>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                           <Button size="sm">
                              Bulk Actions
                           </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => handleBulkAction("Publish")}>
                               Set as Published
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleBulkAction("Draft")}>
                               Set as Draft
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleBulkAction("Archive")}>
                               Archive
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem onClick={() => handleBulkAction("Delete")} className="text-destructive">
                               Delete
                           </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
          ) : null
        }
    >
      <DataTable
          data={sortedEntries}
          columns={columns}
          keyExtractor={(item) => item.id}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          onRowClick={(item) => onEdit(item.id)}
          sortConfig={sortConfig}
          onSort={handleSort}
          emptyMessage="No messages found matching your filters."
          mobileRenderer={(entry) => (
              <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                              {entry.status && (
                                  <Badge 
                                      variant={getStatusVariant(entry.status) as any} 
                                      className={cn("h-5 px-1.5 text-[10px]", getStatusClass(entry.status))}
                                  >
                                      {entry.status}
                                  </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{format(new Date(entry.date), "MMM d, yyyy")}</span>
                          </div>
                          <span className="font-medium truncate leading-snug">{entry.title}</span>
                          <span className="text-xs text-muted-foreground truncate">
                              {entry.speaker} • {entry.passage || "No passage"}
                          </span>
                      </div>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" className="h-8 w-8 p-0 -mr-2">
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit(entry.id)}>
                                  Edit Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
              </div>
          )}
      />
    </DataList>
  )
}
