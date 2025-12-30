"use client";

import { DealStage } from "@/types/crm";
import { cn } from "@/lib/utils";

interface DealStageBadgeProps {
    stage: DealStage;
    className?: string;
}

const stageConfig: Record<DealStage, { label: string; className: string }> = {
    Pipeline: {
        label: "Pipeline",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
    "Follow Up": {
        label: "Follow Up",
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    },
    "Schedule Service": {
        label: "Schedule Service",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    },
    Conversation: {
        label: "Conversation",
        className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
    },
    Won: {
        label: "Won",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    },
    Lost: {
        label: "Lost",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    },
};

export function DealStageBadge({ stage, className }: DealStageBadgeProps) {
    const config = stageConfig[stage];

    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                config.className,
                className
            )}
        >
            {config.label}
        </span>
    );
}
