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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Calendar as CalendarIcon,
    User as UserIcon,
    Briefcase,
    Tag,
    Clock,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Pencil,
    Check,
    X,
    Lock,
    Shield
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateTaskStatus, updateTask, deleteTask, getDeals } from "@/lib/firestore/tasks";
import type { Task, TaskStatus, TaskPriority } from "@/types/crm";
import { generateText } from "@/app/actions/ai";
import { aiConfig } from "@/lib/ai/config";
import { Sparkles } from "lucide-react";
import type { User } from "firebase/auth";

interface TaskDetailSheetProps {
    task: Task | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
    user?: User | null;
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
    user,
}: TaskDetailSheetProps) {
    const [loading, setLoading] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);
    const [titleValue, setTitleValue] = useState("");
    const [descriptionValue, setDescriptionValue] = useState("");
    const [linkedDeals, setLinkedDeals] = useState<any[]>([]);

    // Role-based access control
    // Users can edit if they are: admin, manager, the task assignee, or the task owner
    const canEdit = user?.role === "admin" ||
                    user?.role === "manager" ||
                    task?.assigneeId === user?.uid ||
                    task?.ownerId === user?.uid;

    // Only admins and managers can delete tasks
    const canDelete = user?.role === "admin" || user?.role === "manager";

    const logPermissionCheck = (action: string, allowed: boolean) => {
        console.log(`[RBAC] Task ${action} for task ${task?.id} by user ${user?.uid} (${user?.role}): ${allowed ? "ALLOWED" : "DENIED"}`);
    };

    if (!task) return null;

    const handleStatusChange = async (newStatus: string) => {
        if (!canEdit) {
            logPermissionCheck("status change", false);
            toast.error("You don't have permission to modify this task");
            return;
        }
        logPermissionCheck("status change", true);

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
        if (!canEdit) {
            logPermissionCheck("priority change", false);
            toast.error("You don't have permission to modify this task");
            return;
        }
        logPermissionCheck("priority change", true);

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
        if (!canDelete) {
            logPermissionCheck("delete", false);
            toast.error("Only admins and managers can delete tasks");
            return;
        }
        if (!confirm("Are you sure you want to delete this task?")) return;

        logPermissionCheck("delete", true);
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

    const handleSaveTitle = async () => {
        if (!titleValue.trim()) return;
        if (!canEdit) {
            toast.error("You don't have permission to modify this task");
            setEditingTitle(false);
            return;
        }

        setLoading(true);
        const { success } = await updateTask(task.id, { title: titleValue });
        if (success) {
            toast.success("Title updated");
            onUpdate();
        }
        setEditingTitle(false);
        setLoading(false);
    };

    const handleSaveDescription = async () => {
        if (!canEdit) {
            toast.error("You don't have permission to modify this task");
            setEditingDescription(false);
            return;
        }

        setLoading(true);
        const { success } = await updateTask(task.id, { description: descriptionValue });
        if (success) {
            toast.success("Description updated");
            onUpdate();
        }
        setEditingDescription(false);
        setLoading(false);
    };

    const startEditingTitle = () => {
        if (!canEdit) {
            toast.error("You don't have permission to edit this task");
            return;
        }
        setTitleValue(task.title);
        setEditingTitle(true);
    };

    const startEditingDescription = () => {
        if (!canEdit) {
            toast.error("You don't have permission to edit this task");
            return;
        }
        setDescriptionValue(task.description || "");
        setEditingDescription(true);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                            {editingTitle ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={titleValue}
                                        onChange={(e) => setTitleValue(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                                        autoFocus
                                        disabled={loading}
                                    />
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveTitle} disabled={loading}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingTitle(false)} disabled={loading}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <SheetTitle className="text-xl">{task.title}</SheetTitle>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={startEditingTitle}
                                        disabled={!canEdit}
                                        title={canEdit ? "Edit title" : "You don't have permission to edit this task"}
                                    >
                                        {canEdit ? <Pencil className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                    </Button>
                                </div>
                            )}
                            <SheetDescription>
                                Created on {format(task.createdAt.toDate(), "MMM d, yyyy")}
                                {!canEdit && (
                                    <span className="ml-2 flex items-center gap-1 text-amber-600">
                                        <Shield className="h-3 w-3" />
                                        Read-only
                                    </span>
                                )}
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
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                Status
                                {!canEdit && <Lock className="h-3 w-3" />}
                            </label>
                            <Select
                                defaultValue={task.status}
                                onValueChange={handleStatusChange}
                                disabled={loading || !canEdit}
                            >
                                <SelectTrigger className={!canEdit ? "opacity-60" : ""}>
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
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                Priority
                                {!canEdit && <Lock className="h-3 w-3" />}
                            </label>
                            <Select
                                defaultValue={task.priority}
                                onValueChange={handlePriorityChange}
                                disabled={loading || !canEdit}
                            >
                                <SelectTrigger className={!canEdit ? "opacity-60" : ""}>
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
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium flex items-center gap-2">
                                Description
                            </h4>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={startEditingDescription}
                                disabled={!canEdit}
                            >
                                {canEdit ? <Pencil className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            </Button>
                        </div>
                        {editingDescription ? (
                            <div className="space-y-2">
                                <Textarea
                                    value={descriptionValue}
                                    onChange={(e) => setDescriptionValue(e.target.value)}
                                    rows={4}
                                    disabled={loading}
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSaveDescription} disabled={loading}>
                                        <Check className="h-4 w-4 mr-1" />
                                        Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingDescription(false)} disabled={loading}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                                {task.description || "No description provided."}
                            </div>
                        )}
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
                                {task.dealName || "No linked deal"}
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
                            disabled={loading || !canDelete}
                            title={canDelete ? "Delete this task" : "Only admins and managers can delete tasks"}
                        >
                            {canDelete ? <Trash2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            {canDelete ? "Delete Task" : "Delete Locked"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
