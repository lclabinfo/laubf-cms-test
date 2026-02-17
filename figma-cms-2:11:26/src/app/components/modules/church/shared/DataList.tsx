import { ReactNode } from "react";
import { cn } from "@/app/components/ui/utils";

interface DataListProps {
    children: ReactNode; // The DataTable
    search?: ReactNode;
    filters?: ReactNode;
    actions?: ReactNode; // Primary CTA (e.g. New Button)
    secondaryActions?: ReactNode; // Secondary CTAs (left of primary, e.g. Livestream Link)
    selectionActions?: ReactNode; // Bulk actions (appears when items are selected)
    className?: string;
}

export function DataList({ 
    children, 
    search, 
    filters, 
    actions, 
    secondaryActions, 
    selectionActions,
    className 
}: DataListProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                {/* Left Side: Search + Filters */}
                <div className="flex flex-wrap flex-1 items-center gap-2 min-w-0">
                    {search}
                    {filters}
                </div>

                {/* Right Side: Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {selectionActions ? (
                        selectionActions
                    ) : (
                        <>
                            {secondaryActions}
                            {actions}
                        </>
                    )}
                </div>
            </div>
            
            {children}
        </div>
    );
}
