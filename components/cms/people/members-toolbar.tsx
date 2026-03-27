"use client"

import { Table as TanstackTable } from "@tanstack/react-table"
import { Search, SlidersHorizontal, Settings2, Plus, X, Upload, Archive, Users, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { MemberPerson } from "@/lib/members-context"
import type { MembershipStatus } from "@/lib/generated/prisma/client"

const statuses: { value: MembershipStatus; label: string }[] = [
  { value: "VISITOR", label: "Visitor" },
  { value: "REGULAR_ATTENDEE", label: "Regular" },
  { value: "MEMBER", label: "Member" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
]

const columnLabels: Record<string, string> = {
  lastName: "Name",
  email: "Email",
  phone: "Phone",
  membershipStatus: "Status",
  households: "Household",
  groups: "Groups",
  createdAt: "Date Added",
}

interface ToolbarProps {
  table: TanstackTable<MemberPerson>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  /** Server-side membership status filter (single value or empty string for all) */
  membershipFilter: string
  onMembershipFilterChange: (status: string) => void
  onAddMember: () => void
  onImportCSV: () => void
  onBulkUpdateStatus: (status: MembershipStatus) => void
  onBulkArchive: () => void
  onViewArchived: () => void
  archivedCount: number
}

export function MembersToolbar({
  table,
  globalFilter,
  setGlobalFilter,
  membershipFilter,
  onMembershipFilterChange,
  onAddMember,
  onImportCSV,
  onBulkUpdateStatus,
  onBulkArchive,
  onViewArchived,
  archivedCount,
}: ToolbarProps) {
  const selectedCount = table.getSelectedRowModel().rows.length

  function selectStatus(status: MembershipStatus) {
    // Toggle: if already selected, clear the filter
    if (membershipFilter === status) {
      onMembershipFilterChange("")
    } else {
      onMembershipFilterChange(status)
    }
  }

  function clearFilters() {
    onMembershipFilterChange("")
  }

  const hasFilters = !!membershipFilter

  return (
    <div data-tutorial="ppl-toolbar" className="space-y-2">
      {/* Search + filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative w-full sm:w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
            aria-label="Search members"
          />
        </div>

        {/* Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="default">
              <SlidersHorizontal />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  1
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Filters</span>
                {hasFilters && (
                  <Button variant="ghost" size="xs" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              {/* Status filter */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Membership Status
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map((s) => (
                    <Badge
                      key={s.value}
                      variant={membershipFilter === s.value ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => selectStatus(s.value)}
                    >
                      {s.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="default">
              <Settings2 />
              <span className="hidden sm:inline">Columns</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {columnLabels[col.id] ?? col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View archived */}
        <Button
          variant="outline"
          size="default"
          onClick={onViewArchived}
        >
          <Archive />
          <span className="hidden sm:inline">Archived</span>
          {archivedCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {archivedCount}
            </Badge>
          )}
        </Button>

        {/* Active filter badge */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className="gap-1">
              {statuses.find((st) => st.value === membershipFilter)?.label ?? membershipFilter}
              <button
                onClick={clearFilters}
                className="ml-0.5 rounded-full hover:bg-foreground/10"
              >
                <X className="size-3" />
              </button>
            </Badge>
          </div>
        )}

        <div className="flex-1" />

        {/* Right side: primary actions (always visible) */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="default" onClick={onImportCSV}>
            <Upload />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button onClick={onAddMember}>
            <Plus />
            <span className="hidden sm:inline">Add Member</span>
          </Button>
        </div>
      </div>

      {/* Bulk actions bar -- separate row, only when items are selected */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-muted/50 px-3 py-1.5">
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkUpdateStatus("MEMBER")}
            >
              <Users className="size-3.5 mr-1" />
              Set Member
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkUpdateStatus("INACTIVE")}
            >
              <RefreshCw className="size-3.5 mr-1" />
              Set Inactive
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkArchive}
              className="text-warning hover:text-warning"
            >
              <Archive className="size-3.5 mr-1" />
              Archive
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto whitespace-nowrap"
            onClick={() => table.toggleAllRowsSelected(false)}
          >
            Clear selection
          </Button>
        </div>
      )}
    </div>
  )
}
