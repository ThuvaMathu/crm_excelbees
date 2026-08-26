"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getTasks, updateTaskStatus } from "@/lib/firestore/tasks";
import { useOrgStore } from "@/store/org";
import { usePermission } from "@/hooks/usePermission";
import type { Task, TaskPriority, TaskStatus } from "@/types/crm";
import { Plus, CheckCircle2, Clock, AlertCircle, LayoutGrid, Calendar as CalendarIcon, Archive, Sparkles, Loader2, Columns } from "lucide-react";
import { format } from "date-fns";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { TaskCalendar } from "@/components/tasks/TaskCalendar";
import { TaskFiltersBar } from "@/components/tasks/TaskFiltersBar";
import { ArchivedTasksDialog } from "@/components/tasks/ArchivedTasksDialog";
import { KanbanTaskColumn } from "@/components/tasks/KanbanTaskColumn";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { prioritizeTasks } from "@/app/actions/ai/task-priority";
import type { TaskPrioritySuggestion } from "@/types/gemini";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RBACGuard } from "@/components/auth/RBACGuard";
import { logger } from "@/lib/logger/client";

export default function TasksPage() {
    return (
        <RBACGuard requirePermission={{ module: "tasks", action: "read" }}>
            <TasksPageContent />
        </RBACGuard>
    );
}

function TasksPageContent() {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const { currentMember } = useOrgStore();
    const { can, canEditAll } = usePermission();
    const base = `/org/${orgId}`;
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [view, setView] = useState<"list" | "calendar" | "kanban">("list");
    const [archivedOpen, setArchivedOpen] = useState(false);
    const [aiPriorityMode, setAiPriorityMode] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<TaskPrioritySuggestion[]>([]);
    const [aiLoading, setAiLoading] = useState(false);

    const canEditTasks = canEditAll("tasks");

    const canMoveTask = (task: Task): boolean => {
        if (canEditTasks) return true;
        if (task.assigneeId === currentMember?.userId) return true;
        return task.ownerId === currentMember?.userId && can("tasks", "edit");
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    const [filters, setFilters] = useState<{
        userRole: "all" | "assigned" | "created" | "associated";
        dateRange: { from: Date | null; to: Date | null };
        priorities: TaskPriority[];
        statuses: TaskStatus[];
    }>({
        userRole: "all",
        dateRange: { from: null, to: null },
        priorities: [],
        statuses: [],
    });

    const safeToDate = (date: any): Date | null => {
        if (!date) return null;
        if (typeof date.toDate === 'function') return date.toDate();
        if (date instanceof Date) return date;
        if (typeof date === 'string') return new Date(date);
        return null;
    };

    const fetchTasks = async () => {
        const filterParams: any = {
            userId: currentMember?.userId,
            isArchived: false,
        };

        if (filters.userRole !== "all") {
            filterParams.userRole = filters.userRole;
        }

        if (filters.dateRange.from) {
            filterParams.dueDateFrom = filters.dateRange.from;
        }
        if (filters.dateRange.to) {
            filterParams.dueDateTo = filters.dateRange.to;
        }

        if (filters.priorities.length > 0) {
            filterParams.priorities = filters.priorities;
        }

        if (filters.statuses.length > 0) {
            filterParams.statuses = filters.statuses;
        }

        const { tasks: fetchedTasks, error } = await getTasks(orgId, filterParams);

        if (error) {
            logger.error("Error fetching tasks", { module: "tasks", action: "fetch", orgId, error });
        } else {
            setTasks(fetchedTasks);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const applyFilters = () => {
        fetchTasks();
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, React.ReactElement> = {
            "To Do": <Clock className="h-4 w-4 text-gray-500" />,
            "In Progress": <AlertCircle className="h-4 w-4 text-blue-500" />,
            "Review": <AlertCircle className="h-4 w-4 text-yellow-500" />,
            "Done": <CheckCircle2 className="h-4 w-4 text-green-500" />,
        };
        return icons[status] || <Clock className="h-4 w-4" />;
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

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            "To Do": "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
            "Call": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
            "Email": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
            "Meeting": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        };
        return colors[type] || "bg-gray-100 text-gray-800";
    };

    const shouldShowTask = (task: Task): boolean => {
        if (filters.statuses.length === 0) return true;
        return filters.statuses.includes(task.status);
    };

    const groupedTasks = {
        "To Do": tasks.filter((t) => t.status === "To Do" && shouldShowTask(t)),
        "In Progress": tasks.filter((t) => t.status === "In Progress" && shouldShowTask(t)),
        "Review": tasks.filter((t) => t.status === "Review" && shouldShowTask(t)),
        "Done": tasks.filter((t) => t.status === "Done" && shouldShowTask(t)),
    };

    const handleAIPriority = async () => {
        if (!currentMember?.userId) return;

        if (aiPriorityMode) {
            setAiPriorityMode(false);
            return;
        }

        setAiLoading(true);
        try {
            const result = await prioritizeTasks(currentMember.userId);
            if (result.success && result.data) {
                setAiSuggestions(result.data);
                setAiPriorityMode(true);
                toast.success("Tasks prioritized by AI!");
            } else {
                toast.error(result.error || "Failed to prioritize");
            }
        } catch {
            toast.error("Something went wrong");
        }
        setAiLoading(false);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const taskId = active.id as string;
        const newStatus = over.id as TaskStatus;

        const movedTask = tasks.find((t) => t.id === taskId);
        if (!movedTask || !canMoveTask(movedTask)) {
            toast.error("You don't have permission to move this task");
            fetchTasks();
            return;
        }

        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );

        const { success, error } = await updateTaskStatus(taskId, newStatus, currentMember!.userId);
        if (success) {
            toast.success(`Task moved to ${newStatus}`);
        } else {
            toast.error(error || "Failed to update task");
            fetchTasks();
        }
    };

    const clearFilters = () => {
        setFilters({
            userRole: "all",
            dateRange: { from: null, to: null },
            priorities: [],
            statuses: [],
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-9rem)] flex flex-col gap-6">
            <div className="flex-none">
                <PageHeader
                    title="Tasks"
                    breadcrumbs={[
                        { label: "Dashboard", href: `${base}/dashboard` },
                        { label: "Tasks" },
                    ]}
                    description="Manage your tasks and to-dos"
                    action={
                        <div className="flex items-center gap-2">
                            <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar" | "kanban")}>
                                <TabsList>
                                    <TabsTrigger value="kanban" className="gap-2">
                                        <Columns className="h-4 w-4" />
                                        Kanban
                                    </TabsTrigger>
                                    <TabsTrigger value="list" className="gap-2">
                                        <LayoutGrid className="h-4 w-4" />
                                        List
                                    </TabsTrigger>
                                    <TabsTrigger value="calendar" className="gap-2">
                                        <CalendarIcon className="h-4 w-4" />
                                        Calendar
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Button
                                variant={aiPriorityMode ? "default" : "outline"}
                                onClick={handleAIPriority}
                                disabled={aiLoading}
                                className="gap-2"
                                size="sm"
                            >
                                {aiLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                AI Priority
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setArchivedOpen(true)}
                                className="gap-2"
                            >
                                <Archive className="h-4 w-4" />
                                View Archived
                            </Button>
                            {can("tasks", "create") && (
                                <Button
                                    onClick={() => setCreateOpen(true)}
                                    className="bg-primary hover:bg-primary/90 gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Task
                                </Button>
                            )}
                        </div>
                    }
                />
            </div>

            {(view === "list" || view === "kanban") && (
                <div className="flex-none">
                    <TaskFiltersBar
                        userRole={filters.userRole}
                        onUserRoleChange={(role) => setFilters((f) => ({ ...f, userRole: role }))}
                        dateRange={filters.dateRange}
                        onDateRangeChange={(range) => setFilters((f) => ({ ...f, dateRange: range }))}
                        priorities={filters.priorities}
                        onPrioritiesChange={(priorities) => setFilters((f) => ({ ...f, priorities }))}
                        statuses={filters.statuses}
                        onStatusesChange={(statuses) => setFilters((f) => ({ ...f, statuses }))}
                        onClearFilters={clearFilters}
                        onApply={applyFilters}
                    />
                </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                {tasks.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create your first task to get started
                            </p>
                            {can("tasks", "create") && (
                                <Button
                                    onClick={() => setCreateOpen(true)}
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create Task
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : view === "kanban" ? (
                    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                        <div className="grid gap-6 pb-6 md:grid-cols-2 lg:grid-cols-4">
                            {(["To Do", "In Progress", "Review", "Done"] as TaskStatus[]).map((status) => (
                                <KanbanTaskColumn
                                    key={status}
                                    status={status}
                                    tasks={groupedTasks[status]}
                                    canMove={canMoveTask}
                                    onSelectTask={setSelectedTask}
                                />
                            ))}
                        </div>
                    </DndContext>
                ) : view === "calendar" ? (
                    <TaskCalendar
                        tasks={tasks}
                        onSelectTask={setSelectedTask}
                    />
                ) : aiPriorityMode && aiSuggestions.length > 0 ? (
                    <div className="space-y-3 pb-6">
                        <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-sm">AI Prioritized Tasks</h3>
                            <Badge variant="secondary" className="text-xs">AI sorted</Badge>
                        </div>
                        {aiSuggestions
                            .map((suggestion) => {
                                const task = tasks.find((t) => t.id === suggestion.taskId);
                                return task ? { suggestion, task } : null;
                            })
                            .filter(Boolean)
                            .map((item) => {
                                const { suggestion, task } = item!;
                                const priorityColors: Record<string, string> = {
                                    Urgent: "bg-red-100 text-red-700 border-red-200",
                                    High: "bg-orange-100 text-orange-700 border-orange-200",
                                    Medium: "bg-blue-100 text-blue-700 border-blue-200",
                                    Low: "bg-gray-100 text-gray-700 border-gray-200",
                                };
                                return (
                                <Card
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded border ${priorityColors[suggestion.suggestedPriority] || priorityColors.Medium}`}>
                                            {suggestion.suggestedPriority}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                                                <span className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded ${getTypeColor(task.type)}`}>
                                                    {task.type}
                                                </span>
                                            </div>
                                            {suggestion.reasoning && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{suggestion.reasoning}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                {getStatusIcon(task.status)}
                                                <span>{task.status}</span>
                                                {task.dueDate && safeToDate(task.dueDate) && (
                                                    <span>• Due {format(safeToDate(task.dueDate)!, "MMM d")}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className={cn(
                        "grid gap-6 pb-6",
                        filters.statuses.length === 0
                            ? "md:grid-cols-2 lg:grid-cols-4"
                            : "md:grid-cols-2 lg:grid-cols-3"
                    )}>
                        {Object.entries(groupedTasks).map(([status, statusTasks]) => (
                            <div key={status} className="space-y-3">
                                <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
                                    {getStatusIcon(status)}
                                    <h3 className="font-semibold text-sm">
                                        {status} ({statusTasks.length})
                                    </h3>
                                </div>

                                <div className="space-y-2">
                                    {statusTasks.map((task) => (
                                        <Card
                                            key={task.id}
                                            onClick={() => setSelectedTask(task)}
                                            className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-medium text-sm line-clamp-2 flex-1">
                                                        {task.title}
                                                    </h4>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getTypeColor(task.type)}`}>
                                                        {task.type}
                                                    </span>
                                                </div>

                                                {task.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between text-xs">
                                                    <span className={getPriorityColor(task.priority)}>
                                                        {task.priority}
                                                    </span>
                                                    {task.dueDate && safeToDate(task.dueDate) && (
                                                        <span className="text-muted-foreground">
                                                            {format(safeToDate(task.dueDate)!, "MMM d")}
                                                        </span>
                                                    )}
                                                </div>

                                                {task.projectName && (
                                                    <div className="text-xs text-muted-foreground">
                                                        📁 {task.projectName}
                                                    </div>
                                                )}

                                                {task.assigneeName && (
                                                    <div className="text-xs text-muted-foreground">
                                                        👤 {task.assigneeName}
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    ))}

                                    {statusTasks.length === 0 && (
                                        <div className="text-xs text-muted-foreground text-center py-4">
                                            No {status.toLowerCase()} tasks
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateTaskDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSuccess={fetchTasks}
            />

            <TaskDetailSheet
                task={selectedTask}
                open={!!selectedTask}
                onOpenChange={(open) => !open && setSelectedTask(null)}
                onUpdate={fetchTasks}
                user={currentMember ? { uid: currentMember.userId, role: currentMember.role } as any : undefined}
            />

            <ArchivedTasksDialog
                open={archivedOpen}
                onOpenChange={setArchivedOpen}
                onSelectTask={setSelectedTask}
                onUpdate={fetchTasks}
            />
        </div>
    );
}
