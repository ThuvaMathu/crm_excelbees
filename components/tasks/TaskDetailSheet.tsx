"use client";

import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
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
import { Input } from "@/components/ui/input";
import { AITextarea } from "@/components/ui/ai-textarea";
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
    Lock,
    Shield,
    Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateTaskStatus, updateTask, deleteTask } from "@/lib/firestore/tasks";
import type { Task, TaskStatus, TaskPriority } from "@/types/crm";
import type { User } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const safeToDate = (date: any): Date => {
    if (!date) return new Date();
    if (typeof date.toDate === 'function') return date.toDate();
    if (date instanceof Date) return date;
    if (typeof date === 'object' && typeof date.seconds === 'number') return new Date(date.seconds * 1000);
    if (typeof date === 'string') return new Date(date);
    return new Date();
};

interface TaskDetailSheetProps {
    task: Task | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
    user?: User | null;
}

// ============================================================================
// Theme Colors - Matching Calendar Design
// ============================================================================

const THEME = {
    bg: "#1a202c",
    bgSecondary: "#252f3f",
    bgTertiary: "#2d3748",
    bgHover: "#324155",
    textPrimary: "#ffffff",
    textSecondary: "#e2e8f0",
    textMuted: "#a0aec0",
    accent: "#f6ad55",
    accentHover: "#fbd38d",
    border: "#2d3748",
    success: "#48bb78",
    warning: "#ed8936",
    error: "#f56565",
    info: "#4299e1",
};

// ============================================================================
// Status Configuration
// ============================================================================

const STATUS_CONFIG: Record<TaskStatus, { color: string; icon: any; bgColor: string }> = {
    "To Do": {
        color: "text-gray-400",
        bgColor: "bg-gray-500/20 border-gray-500/30",
        icon: Clock,
    },
    "In Progress": {
        color: "text-blue-400",
        bgColor: "bg-blue-500/20 border-blue-500/30",
        icon: AlertCircle,
    },
    "Review": {
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20 border-yellow-500/30",
        icon: AlertCircle,
    },
    "Done": {
        color: "text-green-400",
        bgColor: "bg-green-500/20 border-green-500/30",
        icon: CheckCircle2,
    },
};

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bgColor: string }> = {
    Low: { color: "text-gray-400", bgColor: "bg-gray-500/20" },
    Medium: { color: "text-blue-400", bgColor: "bg-blue-500/20" },
    High: { color: "text-orange-400", bgColor: "bg-orange-500/20" },
    Urgent: { color: "text-red-400", bgColor: "bg-red-500/20" },
};

// ============================================================================
// Skeleton Loading Component
// ============================================================================

function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-gradient-to-r from-[#252f3f] via-[#2d3748] to-[#252f3f]",
                className
            )}
            style={{
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
            }}
        />
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function TaskDetailSheet({
    task,
    open,
    onOpenChange,
    onUpdate,
    user,
}: TaskDetailSheetProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);
    const [titleValue, setTitleValue] = useState("");
    const [descriptionValue, setDescriptionValue] = useState("");

    // Optimistic state for immediate UI updates - use defaults if task is null
    const [localStatus, setLocalStatus] = useState<TaskStatus>(task?.status || "To Do");
    const [localPriority, setLocalPriority] = useState<TaskPriority>(task?.priority || "Low");

    // Sync local state when task prop changes
    useEffect(() => {
        if (task) {
            setLocalStatus(task.status);
            setLocalPriority(task.priority);
        }
    }, [task]);

    // Handle null task case early in JSX
    if (!task) return null;

    // Role-based access control
    const canEdit = user?.role === "admin" ||
        user?.role === "manager" ||
        task?.assigneeId === user?.uid ||
        task?.ownerId === user?.uid;

    const canDelete = user?.role === "admin" || user?.role === "manager";

    const canUseAI = user?.role === "admin" || user?.role === "manager";

    const handleStatusChange = async (newStatus: string) => {
        if (!canEdit) {
            toast.error("You don't have permission to modify this task");
            return;
        }

        // Optimistic update
        setLocalStatus(newStatus as TaskStatus);

        const { success } = await updateTaskStatus(task.id, newStatus as TaskStatus);

        if (success) {
            toast.success(`Status updated to ${newStatus}`);
            onUpdate();
        } else {
            // Revert on failure
            setLocalStatus(task.status);
            toast.error("Failed to update status");
        }
    };

    const handlePriorityChange = async (newPriority: string) => {
        if (!canEdit) {
            toast.error("You don't have permission to modify this task");
            return;
        }

        // Optimistic update
        setLocalPriority(newPriority as TaskPriority);

        const { success } = await updateTask(task.id, { priority: newPriority as TaskPriority });

        if (success) {
            toast.success(`Priority updated to ${newPriority}`);
            onUpdate();
        } else {
            // Revert on failure
            setLocalPriority(task.priority);
            toast.error("Failed to update priority");
        }
    };

    const handleDelete = async () => {
        if (!canDelete) {
            toast.error("Only admins and managers can delete tasks");
            return;
        }
        if (!confirm("Are you sure you want to delete this task?")) return;

        setLoading(true);
        const { success } = await deleteTask(task.id);

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

        setSaving(true);
        const { success } = await updateTask(task.id, { title: titleValue });
        if (success) {
            toast.success("Title updated");
            onUpdate();
        }
        setEditingTitle(false);
        setSaving(false);
    };

    const handleSaveDescription = async () => {
        if (!canEdit) {
            toast.error("You don't have permission to modify this task");
            setEditingDescription(false);
            return;
        }

        setSaving(true);
        const { success } = await updateTask(task.id, { description: descriptionValue });
        if (success) {
            toast.success("Description updated");
            onUpdate();
        }
        setEditingDescription(false);
        setSaving(false);
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
            <SheetContent
                className="w-full sm:w-[500px] overflow-y-auto p-0"
                style={{
                    background: THEME.bg,
                    borderLeft: `1px solid ${THEME.border}`,
                }}
            >
                {/* Custom Scrollbar & Animation Styles */}
                <style>{`
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                    .animate-shimmer {
                        animation: shimmer 1.5s infinite linear;
                    }
                    /* Custom scrollbar for dark theme */
                    .custom-scroll::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scroll::-webkit-scrollbar-track {
                        background: #1a202c;
                    }
                    .custom-scroll::-webkit-scrollbar-thumb {
                        background: #2d3748;
                        border-radius: 3px;
                    }
                    .custom-scroll::-webkit-scrollbar-thumb:hover {
                        background: #324155;
                    }
                `}</style>

                {/* Header Section */}
                <SheetHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: THEME.border }}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            {/* Title Row */}
                            {editingTitle ? (
                                <div className="flex items-center gap-2 mb-3">
                                    <Input
                                        value={titleValue}
                                        onChange={(e) => setTitleValue(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                                        autoFocus
                                        disabled={saving}
                                        className="bg-[#252f3f] border-[#2d3748] text-white focus:border-[#f6ad55] focus:ring-1 focus:ring-[#f6ad55]/20"
                                        style={{ maxHeight: "38px" }}
                                    />
                                    <Button
                                        size="icon"
                                        onClick={handleSaveTitle}
                                        disabled={saving}
                                        className="h-9 w-9 flex-shrink-0 bg-[#48bb78] hover:bg-[#38a169] text-white transition-colors"
                                    >
                                        {saving ? <Lock className="h-4 w-4 animate-pulse" /> : <CheckCircle2 className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => setEditingTitle(false)}
                                        disabled={saving}
                                        className="h-9 w-9 flex-shrink-0 border-[#2d3748] text-[#a0aec0] hover:text-white hover:bg-[#324155] transition-colors"
                                    >
                                        ×
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 mb-3">
                                    <SheetTitle className="text-xl text-white pr-2">
                                        {task.title}
                                    </SheetTitle>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={cn(
                                            "h-7 w-7 flex-shrink-0 transition-colors",
                                            canEdit
                                                ? "text-[#a0aec0] hover:text-[#f6ad55] hover:bg-[#2d3748]"
                                                : "text-[#718096] cursor-not-allowed"
                                        )}
                                        onClick={startEditingTitle}
                                        title={canEdit ? "Edit title" : "You don't have permission to edit this task"}
                                    >
                                        {canEdit ? <Pencil className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                    </Button>
                                </div>
                            )}

                            {/* Metadata Row */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Status Badge */}
                                <Select
                                    value={localStatus}
                                    onValueChange={handleStatusChange}
                                    disabled={!canEdit}
                                >
                                    <SelectTrigger
                                        className={cn(
                                            "h-7 px-3 py-1 text-xs font-medium border rounded-full transition-colors",
                                            STATUS_CONFIG[localStatus].bgColor,
                                            STATUS_CONFIG[localStatus].color,
                                            "border-transparent",
                                            !canEdit && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#252f3f] border-[#2d3748] text-white">
                                        {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((status) => {
                                            const Icon = STATUS_CONFIG[status].icon;
                                            return (
                                                <SelectItem key={status} value={status}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4" />
                                                        <span>{status}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>

                                {/* Priority Badge */}
                                <Select
                                    value={localPriority}
                                    onValueChange={handlePriorityChange}
                                    disabled={!canEdit}
                                >
                                    <SelectTrigger
                                        className={cn(
                                            "h-7 px-3 py-1 text-xs font-medium border rounded-full transition-colors",
                                            PRIORITY_CONFIG[localPriority].bgColor,
                                            PRIORITY_CONFIG[localPriority].color,
                                            "border-transparent",
                                            !canEdit && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#252f3f] border-[#2d3748] text-white">
                                        {["Low", "Medium", "High", "Urgent"].map((p) => (
                                            <SelectItem key={p} value={p}>
                                                <div className={cn("flex items-center gap-2", PRIORITY_CONFIG[p as TaskPriority].color)}>
                                                    <span>{p}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Type Badge */}
                                <Badge
                                    variant="outline"
                                    className="px-3 py-1 text-xs border-[#2d3748] text-[#a0aec0] bg-[#252f3f]/50"
                                >
                                    {task.type}
                                </Badge>

                                {/* Read-only Indicator */}
                                {!canEdit && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f6ad55]/10 border border-[#f6ad55]/30">
                                        <Shield className="h-3 w-3 text-[#f6ad55]" />
                                        <span className="text-xs text-[#f6ad55] font-medium">Read-only</span>
                                    </div>
                                )}
                            </div>

                            {/* Created Date */}
                            <SheetDescription className="text-[#718096] mt-2">
                                Created {format(safeToDate(task.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* Content */}
                <div className="px-6 py-5 space-y-6 custom-scroll">
                    {/* Description Section with AI Rewrite */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                Description
                            </h3>
                            <div className="flex items-center gap-1">
                                {!editingDescription && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={cn(
                                            "h-7 w-7",
                                            canEdit
                                                ? "text-[#a0aec0] hover:text-[#f6ad55]"
                                                : "text-[#718096] cursor-not-allowed"
                                        )}
                                        onClick={startEditingDescription}
                                        title={canEdit ? "Edit description" : "You don't have permission to edit"}
                                    >
                                        {canEdit ? <Pencil className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                    </Button>
                                )}
                                {editingDescription && (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={handleSaveDescription}
                                            disabled={saving}
                                            className="h-7 px-3 bg-[#48bb78] hover:bg-[#38a169] text-white text-xs transition-colors"
                                        >
                                            {saving ? (
                                                <Lock className="h-3 w-3 animate-pulse" />
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Save
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingDescription(false)}
                                            disabled={saving}
                                            className="h-7 px-3 border-[#2d3748] text-[#a0aec0] hover:text-white text-xs transition-colors"
                                        >
                                            Cancel
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {editingDescription ? (
                            <div className="space-y-3">
                                <AITextarea
                                    value={descriptionValue}
                                    onChange={(e: any) => setDescriptionValue(e.target.value)}
                                    placeholder="Add a description for this task..."
                                    rows={5}
                                    disabled={saving}
                                    containerClassName="bg-[#252f3f] rounded-lg overflow-hidden shadow-lg"
                                    className="bg-[#1a202c] text-[#e2e8f0] placeholder-[#718096] border-none resize-none min-h-[120px]"
                                    minWords={3}
                                />
                                {canUseAI && (
                                    <div className="flex items-center gap-2 text-xs text-[#f6ad55] bg-[#f6ad55]/10 px-3 py-2 rounded-lg">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>AI Rewrite powered by GPT-4</span>
                                    </div>
                                )}
                                {!canUseAI && canEdit && (
                                    <div className="flex items-center gap-2 text-xs text-[#718096] bg-[#252f3f] px-3 py-2 rounded-lg">
                                        <Lock className="h-3 w-3.5" />
                                        <span>AI features available for admins and managers</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    "p-4 rounded-lg text-sm leading-relaxed min-h-[80px]",
                                    task.description
                                        ? "text-[#e2e8f0] bg-[#252f3f]/30 border border-[#2d3748]"
                                        : "text-[#718096] bg-[#1a202c] border border-dashed border-[#2d3748]"
                                )}
                            >
                                {task.description || "No description provided."}
                            </div>
                        )}
                    </div>

                    <Separator className="bg-[#2d3748]" />

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Due Date */}
                        <DetailItem
                            icon={CalendarIcon}
                            label="Due Date"
                            value={task.dueDate ? format(safeToDate(task.dueDate), "MMM d, yyyy") : "No due date"}
                        />

                        {/* Assignee */}
                        <DetailItem
                            icon={UserIcon}
                            label="Assignee"
                            value={task.assigneeName || "Unassigned"}
                        />

                        {/* Project */}
                        <DetailItem
                            icon={Briefcase}
                            label="Project"
                            value={task.projectName || "No project"}
                        />

                        {/* Deal */}
                        <DetailItem
                            icon={Tag}
                            label="Deal"
                            value={(task as any).dealName || (task.relatedTo?.type === "deal" ? "Linked to deal" : "No linked deal")}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t flex justify-between items-center" style={{ borderColor: THEME.border }}>
                    <div className="flex items-center gap-2 text-xs text-[#718096]">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Last modified {format(safeToDate(task.updatedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                    </div>

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={loading || !canDelete}
                        className={cn(
                            "gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-600/30 transition-colors",
                            !canDelete && "opacity-50 cursor-not-allowed"
                        )}
                        title={canDelete ? "Delete this task" : "Only admins and managers can delete tasks"}
                    >
                        {loading ? (
                            <>
                                <Lock className="h-4 w-4" />
                                Deleting...
                            </>
                        ) : canDelete ? (
                            <>
                                <Trash2 className="h-4 w-4" />
                                Delete Task
                            </>
                        ) : (
                            <>
                                <Lock className="h-4 w-4" />
                                Delete Locked
                            </>
                        )}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ============================================================================
// Detail Item Component
// ============================================================================

interface DetailItemProps {
    icon: any;
    label: string;
    value: string;
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#718096] uppercase tracking-wide font-medium">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
            <p className="text-sm text-[#e2e8f0]">{value}</p>
        </div>
    );
}
