import { cn } from "@/app/components/ui/utils";
import { ReactNode } from "react";

interface PageContainerProps {
    children: ReactNode;
    className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {children}
        </div>
    );
}

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
    return (
        <div className={cn("flex items-center justify-between", className)}>
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                {description && (
                    <p className="text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="ml-4 flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}

interface ListToolbarProps {
    children: ReactNode; // Left side (Search, Filters)
    actions?: ReactNode; // Right side (New Button, Bulk Actions)
    className?: string;
}

export function ListToolbar({ children, actions, className }: ListToolbarProps) {
    return (
        <div className={cn("flex flex-col gap-4 md:flex-row md:items-center justify-between", className)}>
            <div className="flex flex-1 items-center gap-2 max-w-2xl min-w-0">
                {children}
            </div>
            {actions && (
                <div className="flex items-center gap-2 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
