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
  roles: "Roles",
  createdAt: "Date Added",
}

interface ToolbarProps {
  table: TanstackTable<MemberPerson>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  onAddMember: () => void
  onImportCSV: () => void
  onBulkUpdateStatus: (status: MembershipStatus) => void
  onBulkArchive: () => void
}

export function MembersToolbar({
  table,
  globalFilter,
  setGlobalFilter,
  onAddMember,
  onImportCSV,
  onBulkUpdateStatus,
  onBulkArchive,
}: ToolbarProps) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const statusFilter = (table.getColumn("membershipStatus")?.getFilterValue() as MembershipStatus[]) ?? []

  function toggleStatus(status: MembershipStatus) {
    const current = statusFilter
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    table.getColumn("membershipStatus")?.setFilterValue(next.length ? next : undefined)
  }

  function clearFilters() {
    table.getColumn("membershipStatus")?.setFilterValue(undefined)
  }

  const filterCount = statusFilter.length
  const hasFilters = filterCount > 0

  return (
    <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
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
                {filterCount}
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
                    variant={statusFilter.includes(s.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleStatus(s.value)}
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

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-1">
          {statusFilter.map((s) => {
            const label = statuses.find((st) => st.value === s)?.label ?? s
            return (
              <Badge key={`status-${s}`} variant="secondary" className="gap-1">
                {label}
                <button
                  onClick={() => toggleStatus(s)}
                  className="ml-0.5 rounded-full hover:bg-foreground/10"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}

      <div className="flex-1" />

      {/* Right side: bulk actions or primary actions */}
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-muted/50 px-3 py-1">
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
      ) : (
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
      )}
    </div>
  )
}
