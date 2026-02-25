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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"
import { 
    MoreHorizontal, 
    Search, 
    Filter, 
    Trash2, 
    Users,
    Calendar,
    Edit,
    Plus,
    X
} from "lucide-react"
import { type Ministry } from "./data"
import { DataList } from "../shared/DataList"
import { DataTable, type ColumnDef } from "../shared/DataTable"
import { cn } from "@/app/components/ui/utils"

interface MinistryListProps {
  ministries: Ministry[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onCreate: () => void
}

type SortKey = 'name' | 'status' | 'memberCount' | 'lastUpdated';

export function MinistryList({ ministries, onEdit, onDelete, onCreate }: MinistryListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  });

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key: key as SortKey,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredMinistries = useMemo(() => {
    return ministries.filter((ministry) => {
        const matchesSearch = 
          ministry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ministry.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(ministry.status);

        return matchesSearch && matchesStatus;
      })
  }, [ministries, searchTerm, statusFilter])

  const sortedMinistries = useMemo(() => {
      return [...filteredMinistries].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        let comparison = 0;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
  }, [filteredMinistries, sortConfig])

  const getStatusVariant = (status: string) => {
      switch (status) {
          case 'published': return 'default';
          case 'draft': return 'secondary';
          case 'archived': return 'outline';
          default: return 'secondary';
      }
  }

  const clearFilters = () => {
      setStatusFilter([]);
      setSearchTerm("");
  }

  const activeFilterCount = statusFilter.length > 0 ? 1 : 0;

  const columns: ColumnDef<Ministry>[] = [
    {
        accessorKey: "name",
        header: "Ministry Name",
        width: "w-[40%]",
        sortable: true,
        className: "pl-6",
        cell: (ministry) => (
            <div className="flex flex-col gap-1">
                <span className="font-medium">{ministry.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                    {ministry.description}
                </span>
            </div>
        )
    },
    {
        accessorKey: "status",
        header: "Status",
        width: "w-[15%]",
        sortable: true,
        cell: (ministry) => (
            <Badge variant={getStatusVariant(ministry.status) as any} className="capitalize">
                {ministry.status}
            </Badge>
        )
    },
    {
        accessorKey: "leaders",
        header: "Leaders",
        width: "w-[15%]",
        sortable: false,
        cell: (ministry) => (
            <div className="flex -space-x-2 overflow-hidden">
                {ministry.leaders.length > 0 ? (
                    ministry.leaders.slice(0, 3).map((leader) => (
                        <div 
                            key={leader.id} 
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-medium"
                            title={leader.name}
                        >
                            {leader.imageUrl ? (
                                <img src={leader.imageUrl} alt={leader.name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                                leader.name.charAt(0)
                            )}
                        </div>
                    ))
                ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                )}
                {ministry.leaders.length > 3 && (
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-medium">
                        +{ministry.leaders.length - 3}
                    </div>
                )}
            </div>
        )
    },
    {
        accessorKey: "memberCount",
        header: "Members",
        width: "w-[15%]",
        sortable: true,
        cell: (ministry) => (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {ministry.memberCount}
            </div>
        )
    },
    {
        accessorKey: "lastUpdated",
        header: "Last Updated",
        width: "w-[15%]",
        sortable: true,
        cell: (ministry) => (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {ministry.lastUpdated}
            </div>
        )
    },
    {
        key: "actions",
        header: "",
        width: "w-[50px]",
        cell: (ministry) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(ministry.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => onDelete(ministry.id)} 
                        className="text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }
  ];

  return (
    <div className="space-y-4">
      <DataList
          actions={(
              <Button onClick={onCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Ministry
              </Button>
          )}
          search={
              <div className="relative flex-1 md:max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Search ministries..."
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
                                  {['published', 'draft', 'archived'].map((status) => {
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
      >
          <DataTable
              data={sortedMinistries}
              columns={columns}
              keyExtractor={(item) => item.id}
              onRowClick={(item) => onEdit(item.id)}
              sortConfig={sortConfig}
              onSort={handleSort}
              emptyMessage="No ministries found."
              mobileRenderer={(ministry) => (
                  <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2">
                                  <Badge variant={getStatusVariant(ministry.status) as any} className="h-5 px-1.5 text-[10px] capitalize">
                                      {ministry.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Users className="h-3 w-3" /> {ministry.memberCount}
                                  </span>
                              </div>
                              <span className="font-medium truncate leading-snug">{ministry.name}</span>
                              <div className="flex -space-x-2 overflow-hidden py-1">
                                  {ministry.leaders.slice(0, 3).map((leader) => (
                                      <div 
                                          key={leader.id} 
                                          className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-medium"
                                      >
                                          {leader.imageUrl ? (
                                              <img src={leader.imageUrl} alt={leader.name} className="h-full w-full rounded-full object-cover" />
                                          ) : (
                                              leader.name.charAt(0)
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </div>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" className="h-8 w-8 p-0 -mr-2">
                                      <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onEdit(ministry.id)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                      onClick={() => onDelete(ministry.id)} 
                                      className="text-destructive"
                                  >
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
    </div>
  )
}
