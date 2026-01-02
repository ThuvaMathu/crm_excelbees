"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getProject } from "@/lib/firestore/projects";
import { getTasks } from "@/lib/firestore/tasks";
import type { Project, Task } from "@/types/crm";
import {
    Briefcase,
    CheckSquare,
    Users,
    FileText,
    Clock,
    DollarSign,
    Calendar,
    BarChart3,
    AlertCircle,
    CheckCircle2,
    Plus
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";

export default function ProjectDetailPage() {
    const params = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [createTaskOpen, setCreateTaskOpen] = useState(false);

    const fetchData = async () => {
        if (!params.id) return;

        const [projectResult, tasksResult] = await Promise.all([
            getProject(params.id as string),
            getTasks({ projectId: params.id as string })
        ]);

        if (projectResult.project) {
            setProject(projectResult.project);
        }

        if (tasksResult.tasks) {
            setTasks(tasksResult.tasks);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [params.id]);

    const getTaskPriorityColor = (priority: string) => {
        switch (priority) {
            case "Urgent": return "text-red-600 font-semibold";
            case "High": return "text-orange-600";
            case "Medium": return "text-blue-600";
            default: return "text-muted-foreground";
        }
    };

    const getTaskTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            "To Do": "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
            "Call": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
            "Email": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
            "Meeting": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        };
        return colors[type] || "bg-gray-100 text-gray-800";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h2 className="text-xl font-semibold mb-2">Project not found</h2>
                <Button variant="outline" onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={project.name}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Projects", href: "/projects" },
                    { label: project.name },
                ]}
                description={project.description || "Project Details"}
                action={
                    <Button variant="outline">Edit Project</Button>
                }
            />

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview" className="gap-2">
                        <Briefcase className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="gap-2">
                        <CheckSquare className="h-4 w-4" />
                        Tasks
                    </TabsTrigger>
                    <TabsTrigger value="team" className="gap-2">
                        <Users className="h-4 w-4" />
                        Team
                    </TabsTrigger>
                    <TabsTrigger value="files" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Files
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Status</CardTitle>
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{project.status}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Progress</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{project.progress}%</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Budget</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ${project.budget?.toLocaleString() || "0"}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Deadline</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-sm">
                                    {project.endDate
                                        ? format(project.endDate.toDate(), "MMM d, yyyy")
                                        : "No deadline"}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {project.description || "No description provided."}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium mb-1">Company</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {project.companyName || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium mb-1">Owner</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {project.ownerName || "Unknown"}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">Created</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {format(project.createdAt.toDate(), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">Priority</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {project.priority}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="tasks">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Project Tasks</CardTitle>
                                <CardDescription>
                                    Manage tasks specific to this project
                                </CardDescription>
                            </div>
                            <Button size="sm" onClick={() => setCreateTaskOpen(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Task
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {tasks.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No tasks found for this project
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 ${task.status === "Done" ? "text-green-500" : "text-muted-foreground"}`}>
                                                    {task.status === "Done" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <h4 className={`font-medium ${task.status === "Done" ? "line-through text-muted-foreground" : ""}`}>
                                                        {task.title}
                                                    </h4>
                                                    {task.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getTaskTypeColor(task.type)}`}>
                                                            {task.type}
                                                        </span>
                                                        {task.assigneeName && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Users className="h-3 w-3" />
                                                                {task.assigneeName}
                                                            </span>
                                                        )}
                                                        {task.dueDate && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {format(task.dueDate.toDate(), "MMM d")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`text-xs ${getTaskPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                                                    {task.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="team">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                {project.teamMembers.length} team members (Functionality coming soon)
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="files">
                    <Card>
                        <CardHeader>
                            <CardTitle>Files</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                No files uploaded (Functionality coming soon)
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <CreateTaskDialog
                open={createTaskOpen}
                onOpenChange={setCreateTaskOpen}
                defaultProjectId={project.id}
                onSuccess={fetchData}
            />
        </div>
    );
}
