import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/types/crm";
import { cn } from "@/lib/utils";

interface LeadStatusBadgeProps {
    status: LeadStatus;
    className?: string;
}

const statusConfig: Record<
    LeadStatus,
    { label: string; className: string }
> = {
    New: {
        label: "New",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    Contacted: {
        label: "Contacted",
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    },
    "Follow Up": {
        label: "Follow Up",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    },
    Qualified: {
        label: "Qualified",
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    Lost: {
        label: "Lost",
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
};

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <Badge
            variant="outline"
            className={cn(
                "border-0 font-medium",
                config.className,
                className
            )}
        >
            {config.label}
        </Badge>
    );
}
