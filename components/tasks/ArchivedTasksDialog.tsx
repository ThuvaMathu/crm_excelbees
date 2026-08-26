"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Archive as ArchiveIcon, Package, RotateCcw as Restore, Clock, User as UserIcon, Calendar } from "lucide-react";
import { format } from "date-fns";
import { getTasks } from "@/lib/firestore/tasks";
import { unarchiveTask } from "@/lib/firestore/tasks";
import { toast } from "sonner";
import type { Task } from "@/types/crm";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useOrgStore } from "@/store/org";

interface ArchivedTasksDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectTask: (task: Task) => void;
    onUpdate: () => void;
}

export function ArchivedTasksDialog({
    open,
    onOpenChange,
    onSelectTask,
    onUpdate,
}: ArchivedTasksDialogProps) {
    const { user } = useAuth();
    const { currentOrg } = useOrgStore();
    const organizationId = currentOrg?.id;
    const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [unarchivingIds, setUnarchivingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (open) {
            fetchArchivedTasks();
        }
    }, [open]);

    const fetchArchivedTasks = async () => {
        setLoading(true);
        const { tasks, error } = await getTasks(organizationId, { isArchived: true });
        if (error) {
            toast.error("Failed to load archived tasks");
        } else {
            setArchivedTasks(tasks);
        }
        setLoading(false);
    };

    const handleUnarchive = async (taskId: string, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent opening the detail sheet

        if (!user?.uid) {
            toast.error("You must be logged in to unarchive a task");
            return;
        }

        setUnarchivingIds((prev) => new Set(prev).add(taskId));
        const { success, error } = await unarchiveTask(taskId, user.uid);

        if (success) {
            toast.success("Task unarchived successfully");
            // Remove from local list
            setArchivedTasks((prev) => prev.filter((t) => t.id !== taskId));
            onUpdate();
        } else {
            toast.error(error || "Failed to unarchive task");
        }

        setUnarchivingIds((prev) => {
            const next = new Set(prev);
            next.delete(taskId);
            return next;
        });
    };
    const safeToDate = (date: any): Date => {
        if (!date) return new Date();
        if (typeof date.toDate === "function") return date.toDate();
        if (date instanceof Date) return date;
        if (typeof date === "object" && typeof date.seconds === "number") return new Date(date.seconds * 1000);
        if (typeof date === "string") return new Date(date);
        return new Date();
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            Low: "text-gray-600",
            Medium: "text-blue-600",
            High: "text-orange-600",
            Urgent: "text-red-600 font-semibold",
        };
        return colors[priority] || "text-gray-600";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArchiveIcon className="h-5 w-5 text-muted-foreground" />
                        Archived Tasks
                    </DialogTitle>
                    <DialogDescription>
                        {archivedTasks.length === 0
                            ? "No archived tasks yet."
                            : `${archivedTasks.length} archived task${archivedTasks.length === 1 ? "" : "s"}`
                        }
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 -mx-1 px-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : archivedTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Package className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No archived tasks</h3>
                            <p className="text-sm text-muted-foreground">
                                Completed tasks that are archived will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 pb-4">
                            {archivedTasks.map((task) => (
                                <Card
                                    key={task.id}
                                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => onSelectTask(task)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0 space-y-2">
                                            {/* Title */}
                                            <h4 className="font-medium text-sm truncate">{task.title}</h4>

                                            {/* Description if exists */}
                                            {task.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {task.description}
                                                </p>
                                            )}

                                            {/* Metadata */}
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                {/* Priority */}
                                                <span className={getPriorityColor(task.priority)}>
                                                    {task.priority}
                                                </span>

                                                {/* Due date */}
                                                {task.dueDate && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(safeToDate(task.dueDate), "MMM d, yyyy")}
                                                    </span>
                                                )}

                                                {/* Assignee */}
                                                {task.assigneeName && (
                                                    <span className="flex items-center gap-1">
                                                        <UserIcon className="h-3 w-3" />
                                                        {task.assigneeName}
                                                    </span>
                                                )}

                                                {/* Completed date */}
                                                {task.completedAt && (
                                                    <span className="flex items-center gap-1 text-green-600">
                                                        <Clock className="h-3 w-3" />
                                                        Completed {format(safeToDate(task.completedAt), "MMM d")}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Project name if exists */}
                                            {task.projectName && (
                                                <div className="text-xs text-muted-foreground">
                                                    📁 {task.projectName}
                                                </div>
                                            )}
                                        </div>

                                        {/* Unarchive button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => handleUnarchive(task.id, e)}
                                            disabled={unarchivingIds.has(task.id)}
                                            className="flex-shrink-0 gap-1.5"
                                        >
                                            {unarchivingIds.has(task.id) ? (
                                                <>
                                                    <LoadingSpinner className="h-3 w-3" />
                                                    Restoring...
                                                </>
                                            ) : (
                                                <>
                                                    <Restore className="h-3.5 w-3.5" />
                                                    Restore
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
