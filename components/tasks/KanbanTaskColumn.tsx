"use client";

import { useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import type { Task, TaskStatus } from "@/types/crm";
import { KanbanTaskCard } from "./KanbanTaskCard";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface KanbanTaskColumnProps {
    status: TaskStatus;
    tasks: Task[];
    canMove: (task: Task) => boolean;
    onSelectTask: (task: Task) => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ReactElement; color: string }> = {
    "To Do": { label: "To Do", icon: <Clock className="h-4 w-4 text-gray-500" />, color: "bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800" },
    "In Progress": { label: "In Progress", icon: <AlertCircle className="h-4 w-4 text-blue-500" />, color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
    "Review": { label: "Review", icon: <AlertCircle className="h-4 w-4 text-amber-500" />, color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
    "Done": { label: "Done", icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
};

export function KanbanTaskColumn({ status, tasks, canMove, onSelectTask }: KanbanTaskColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: status });
    const config = STATUS_CONFIG[status];

    return (
        <Card
            ref={setNodeRef}
            className={`p-4 ${config.color} border-2 ${isOver ? "ring-2 ring-primary" : ""}`}
        >
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    {config.icon}
                    <h3 className="font-semibold text-sm">{config.label}</h3>
                    <span className="ml-auto text-xs text-muted-foreground">{tasks.length}</span>
                </div>

                <div className="space-y-2 min-h-[200px] max-h-[45vh] overflow-y-auto scrollbar-hide">
                    {tasks.map((task) => (
                        <KanbanTaskCard
                            key={task.id}
                            task={task}
                            canMove={canMove(task)}
                            onSelect={onSelectTask}
                        />
                    ))}

                    {tasks.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-4">
                            No {status.toLowerCase()} tasks
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}