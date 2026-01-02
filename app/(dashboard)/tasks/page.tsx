"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getTasks } from "@/lib/firestore/tasks";
import type { Task } from "@/types/crm";
import { Plus, CheckCircle2, Clock, AlertCircle, LayoutGrid, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { TaskCalendar } from "@/components/tasks/TaskCalendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [view, setView] = useState<"list" | "calendar">("list");

    const fetchTasks = async () => {
        const { tasks: fetchedTasks, error } = await getTasks();

        if (error) {
            console.error("Error fetching tasks:", error);
        } else {
            setTasks(fetchedTasks);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
    }, []);

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

    const groupedTasks = {
        "To Do": tasks.filter((t) => t.status === "To Do"),
        "In Progress": tasks.filter((t) => t.status === "In Progress"),
        "Review": tasks.filter((t) => t.status === "Review"),
        "Done": tasks.filter((t) => t.status === "Done"),
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tasks"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Tasks" },
                ]}
                description="Manage your tasks and to-dos"
                action={
                    <div className="flex items-center gap-2">
                        <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
                            <TabsList>
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
                            onClick={() => setCreateOpen(true)}
                            className="bg-primary hover:bg-primary/90 gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            New Task
                        </Button>
                    </div>
                }
            />

            {tasks.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create your first task to get started
                        </p>
                        <Button
                            onClick={() => setCreateOpen(true)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create Task
                        </Button>
                    </CardContent>
                </Card>
            ) : view === "calendar" ? (
                <TaskCalendar
                    tasks={tasks}
                    onSelectTask={setSelectedTask}
                />
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(groupedTasks).map(([status, statusTasks]) => (
                        <div key={status} className="space-y-3">
                            <div className="flex items-center gap-2">
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
                                                {task.dueDate && (
                                                    <span className="text-muted-foreground">
                                                        {format(task.dueDate.toDate(), "MMM d")}
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
            />
        </div>
    );
}
