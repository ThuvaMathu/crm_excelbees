"use client";

import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    Calendar as CalendarIcon,
    User as UserIcon,
    Briefcase,
    Tag,
    Clock,
    Trash2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateTaskStatus, updateTask, deleteTask } from "@/lib/firestore/tasks";
import type { Task, TaskStatus, TaskPriority } from "@/types/crm";
import { generateText } from "@/app/actions/ai";
import { aiConfig } from "@/lib/ai/config";
import { Sparkles } from "lucide-react";

interface TaskDetailSheetProps {
    task: Task | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

const STATUS_CONFIG: Record<TaskStatus, { color: string; icon: any }> = {
    "To Do": { color: "bg-gray-100 text-gray-800", icon: Clock },
    "In Progress": { color: "bg-blue-100 text-blue-800", icon: AlertCircle },
    "Review": { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
    "Done": { color: "bg-green-100 text-green-800", icon: CheckCircle2 },
};

export function TaskDetailSheet({
    task,
    open,
    onOpenChange,
    onUpdate,
}: TaskDetailSheetProps) {
    const [loading, setLoading] = useState(false);

    if (!task) return null;

    const handleStatusChange = async (newStatus: string) => {
        setLoading(true);
        const { success, error } = await updateTaskStatus(task.id, newStatus as TaskStatus);

        if (success) {
            toast.success(`Status updated to ${newStatus}`);
            onUpdate();
        } else {
            toast.error("Failed to update status");
        }
        setLoading(false);
    };

    const handlePriorityChange = async (newPriority: string) => {
        setLoading(true);
        const { success, error } = await updateTask(task.id, { priority: newPriority as TaskPriority });

        if (success) {
            toast.success(`Priority updated to ${newPriority}`);
            onUpdate();
        } else {
            toast.error("Failed to update priority");
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this task?")) return;

        setLoading(true);
        const { success, error } = await deleteTask(task.id);

        if (success) {
            toast.success("Task deleted");
            onOpenChange(false);
            onUpdate();
        } else {
            toast.error("Failed to delete task");
        }
        setLoading(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <SheetTitle className="text-xl">{task.title}</SheetTitle>
                            <SheetDescription>
                                Created on {format(task.createdAt.toDate(), "MMM d, yyyy")}
                            </SheetDescription>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Badge variant="outline" className={STATUS_CONFIG[task.status]?.color}>
                            {task.status}
                        </Badge>
                        <Badge variant="outline">{task.priority}</Badge>
                        <Badge variant="secondary">{task.type}</Badge>
                    </div>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <Select
                                defaultValue={task.status}
                                onValueChange={handleStatusChange}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Priority</label>
                            <Select
                                defaultValue={task.priority}
                                onValueChange={handlePriorityChange}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {["Low", "Medium", "High", "Urgent"].map((p) => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4 mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            title={`Powered by ${aiConfig.tasks.model}`}
                            onClick={async () => {
                                const toastId = toast.loading("Thinking...");
                                try {
                                    const prompt = `Given the task "${task.title}" with description "${task.description || ''}", suggest 3 concrete next steps to complete it.`;
                                    const { success, data } = await generateText(prompt);
                                    if (success && data) {
                                        toast.dismiss(toastId);
                                        toast.message("AI Suggestions", {
                                            description: data,
                                            duration: 10000,
                                        });
                                    } else {
                                        toast.error("Failed to get suggestions", { id: toastId });
                                    }
                                } catch (e) {
                                    toast.error("Error", { id: toastId });
                                }
                            }}
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Get AI Suggestions
                        </Button>
                    </div>

                    <Separator />

                    {/* Description */}
                    <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                            Description
                        </h4>
                        <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                            {task.description || "No description provided."}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div className="space-y-1">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" /> Due Date
                            </span>
                            <p className="font-medium px-6">
                                {task.dueDate ? format(task.dueDate.toDate(), "MMM d, yyyy") : "No due date"}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <UserIcon className="h-4 w-4" /> Assignee
                            </span>
                            <p className="font-medium px-6">
                                {task.assigneeName || "Unassigned"}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Briefcase className="h-4 w-4" /> Project
                            </span>
                            <p className="font-medium px-6">
                                {task.projectName || "No project"}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Tag className="h-4 w-4" /> Deal
                            </span>
                            <p className="font-medium px-6">
                                Placeholder (Deal Name)
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end pt-4">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            className="gap-2"
                            disabled={loading}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Task
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
