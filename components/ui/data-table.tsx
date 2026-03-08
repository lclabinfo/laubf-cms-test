"use client"

import React from "react"
import {
  type ColumnDef,
  type Row,
  type Table as TanstackTable,
  flexRender,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  table: TanstackTable<TData>
  onRowClick?: (row: TData) => void
  /** When set, the row whose `original.id` matches gets a highlight style. */
  activeRowId?: string | null
  /** Render a sub-component below the row when it is expanded. */
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode
  /** Use table-layout:fixed so column sizes are respected regardless of content. */
  fixedLayout?: boolean
  /** Hide the built-in pagination (useful when providing custom server-side pagination). */
  hidePagination?: boolean
  /** Extra HTML attributes for each table row (e.g. draggable, onDragStart). */
  getRowProps?: (row: Row<TData>) => React.HTMLAttributes<HTMLTableRowElement>
}

export function DataTable<TData, TValue>({
  columns,
  table,
  onRowClick,
  activeRowId,
  renderSubComponent,
  fixedLayout,
  hidePagination,
  getRowProps,
}: DataTableProps<TData, TValue>) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-x-auto">
        <Table className={cn("min-w-[750px]", fixedLayout && "table-fixed")}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const size = header.column.columnDef.size
                  return (
                    <TableHead
                      key={header.id}
                      style={fixedLayout && size ? { width: size } : undefined}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isActive = activeRowId != null && (row.original as Record<string, unknown>).id === activeRowId
                const extraProps = getRowProps?.(row)
                return (
                <React.Fragment key={row.id}>
                <TableRow
                  data-state={row.getIsSelected() ? "selected" : isActive ? "active" : undefined}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    isActive && "bg-accent",
                    extraProps?.className,
                  )}
                  {...extraProps}
                  onClick={(e) => {
                    extraProps?.onClick?.(e)
                    if (!onRowClick) return
                    // Don't navigate when clicking interactive elements
                    const target = e.target as HTMLElement
                    if (target.closest("button, a, input, [role=checkbox], [data-no-row-click]")) return
                    onRowClick(row.original)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {renderSubComponent && row.getIsExpanded() && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                      {renderSubComponent({ row })}
                    </TableCell>
                  </TableRow>
                )}
                </React.Fragment>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!hidePagination && <DataTablePagination table={table} />}
    </div>
  )
}

// Follows shadcn recommended data table pagination pattern:
// https://ui.shadcn.com/docs/components/radix/data-table
interface DataTablePaginationProps<TData> {
  table: TanstackTable<TData>
}

function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground text-sm">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center justify-between gap-4 sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="hidden sm:block text-sm font-medium whitespace-nowrap">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" className="w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent position="popper">
              {[10, 20, 25, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm font-medium whitespace-nowrap">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
