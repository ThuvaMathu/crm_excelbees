"use client";

import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { Task } from "@/types/crm";

interface KanbanTaskCardProps {
    task: Task;
    canMove: boolean;
    onSelect: (task: Task) => void;
}

const STATUS_ICONS: Record<string, React.ReactElement> = {
    "To Do": <Clock className="h-3.5 w-3.5 text-gray-500" />,
    "In Progress": <AlertCircle className="h-3.5 w-3.5 text-blue-500" />,
    "Review": <AlertCircle className="h-3.5 w-3.5 text-amber-500" />,
    "Done": <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
};

const PRIORITY_COLORS: Record<string, string> = {
    Low: "text-gray-600",
    Medium: "text-blue-600",
    High: "text-orange-600",
    Urgent: "text-red-600 font-semibold",
};

const TYPE_COLORS: Record<string, string> = {
    "To Do": "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    "Call": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    "Email": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    "Meeting": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
};

function safeToDate(date: any): Date | null {
    if (!date) return null;
    if (typeof date.toDate === "function") return date.toDate();
    if (date instanceof Date) return date;
    if (typeof date === "string") return new Date(date);
    return null;
}

export function KanbanTaskCard({ task, canMove, onSelect }: KanbanTaskCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        disabled: !canMove,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const dueDate = safeToDate(task.dueDate);

    return (
        <Card
            ref={setNodeRef}
            {...attributes}
            {...(canMove ? listeners : {})}
            style={style}
            className={`p-3 hover:shadow-md transition-shadow bg-card ${isDragging ? "opacity-50" : ""} ${canMove ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
            onClick={canMove ? undefined : () => onSelect(task)}
        >
            <div
                className="space-y-2"
                onClick={canMove ? () => onSelect(task) : undefined}
            >
                <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm line-clamp-2 flex-1">{task.title}</h4>
                    <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 ${TYPE_COLORS[task.type] || TYPE_COLORS["To Do"]}`}>
                        {task.type}
                    </Badge>
                </div>

                {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                )}

                <div className="flex items-center justify-between text-xs">
                    <span className={PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium}>
                        {task.priority}
                    </span>
                    {dueDate && (
                        <span className="text-muted-foreground">{format(dueDate, "MMM d")}</span>
                    )}
                </div>

                {task.projectName && (
                    <p className="text-xs text-muted-foreground truncate">📁 {task.projectName}</p>
                )}

                {task.assigneeName && (
                    <p className="text-xs text-muted-foreground truncate">👤 {task.assigneeName}</p>
                )}
            </div>
        </Card>
    );
}