import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"
import { Checkbox } from "@/app/components/ui/checkbox"
import { cn } from "@/app/components/ui/utils"
import { ArrowUp, ArrowDown } from "lucide-react"

export interface ColumnDef<T> {
    accessorKey?: string; // For sorting
    header: string | React.ReactNode;
    width?: string;
    sortable?: boolean;
    cell: (item: T) => React.ReactNode;
    className?: string; // For adding specific classes to the cell/header
}

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    keyExtractor: (item: T) => string;
    selectedIds?: string[];
    onSelect?: (ids: string[]) => void;
    onRowClick?: (item: T, e: React.MouseEvent) => void;
    sortConfig?: { key: string; direction: "asc" | "desc" } | null;
    onSort?: (key: string) => void;
    emptyMessage?: string;
    isLoading?: boolean;
    mobileRenderer?: (item: T) => React.ReactNode;
}

export function DataTable<T>({
    data,
    columns,
    keyExtractor,
    selectedIds,
    onSelect,
    onRowClick,
    sortConfig,
    onSort,
    emptyMessage = "No items found.",
    isLoading = false,
    mobileRenderer
}: DataTableProps<T>) {

    const handleSelectAll = (checked: boolean) => {
        if (!onSelect) return;
        if (checked) {
            onSelect(data.map(keyExtractor));
        } else {
            onSelect([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (!onSelect || !selectedIds) return;
        if (checked) {
            onSelect([...selectedIds, id]);
        } else {
            onSelect(selectedIds.filter(sid => sid !== id));
        }
    };

    const renderSortArrow = (columnKey: string) => {
        const isActive = sortConfig?.key === columnKey;
        const direction = isActive ? sortConfig.direction : "asc";
        
        return (
            <span className={cn(
                "ml-2 transition-opacity",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
            )}>
                {direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            </span>
        );
    };

    const isAllSelected = data.length > 0 && selectedIds?.length === data.length;

    return (
        <div className="space-y-4">
            {/* Mobile View */}
            {mobileRenderer && (
                <div className="md:hidden space-y-4">
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
                    ) : (
                        data.map((item) => (
                            <div key={keyExtractor(item)} onClick={(e) => onRowClick?.(item, e)}>
                                {mobileRenderer(item)}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Desktop View */}
            <div className={cn("rounded-md border bg-card", mobileRenderer ? "hidden md:block" : "block")}>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            {onSelect && (
                                <TableHead className="w-[40px] px-4">
                                    <Checkbox 
                                        checked={isAllSelected}
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                            )}
                            {columns.map((col, index) => {
                                const isSortable = col.sortable && onSort && col.accessorKey;
                                
                                return (
                                    <TableHead 
                                        key={index}
                                        className={cn(
                                            col.width,
                                            isSortable ? "cursor-pointer group select-none" : "",
                                            col.className
                                        )}
                                        onClick={() => isSortable && onSort(col.accessorKey!)}
                                    >
                                        <div className="flex items-center">
                                            {col.header}
                                            {isSortable && renderSortArrow(col.accessorKey!)}
                                        </div>
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (onSelect ? 1 : 0)} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (onSelect ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => {
                                const id = keyExtractor(item);
                                const isSelected = selectedIds?.includes(id);

                                return (
                                    <TableRow 
                                        key={id}
                                        className={cn(
                                            onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : "",
                                            isSelected ? "bg-muted/50" : ""
                                        )}
                                        onClick={(e) => {
                                            if (
                                                (e.target as HTMLElement).closest('[role="checkbox"]') ||
                                                (e.target as HTMLElement).closest('button') ||
                                                (e.target as HTMLElement).closest('a')
                                            ) {
                                                return;
                                            }
                                            onRowClick?.(item, e);
                                        }}
                                    >
                                        {onSelect && (
                                            <TableCell className="px-4">
                                                <Checkbox 
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => handleSelectOne(id, !!checked)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </TableCell>
                                        )}
                                        {columns.map((col, index) => (
                                            <TableCell key={index} className={col.className}>
                                                {col.cell(item)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
