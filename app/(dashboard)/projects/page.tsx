"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getProjects } from "@/lib/firestore/projects";
import type { Project } from "@/types/crm";
import { Plus, Briefcase, Archive } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { useAuth } from "@/hooks/useAuth";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const { user } = useAuth();

    // Role-based access - only admin/manager can see financial data
    const canViewFinancials = user?.role === "admin" || user?.role === "manager";

    // Helper to safely convert Firestore Timestamp or Date to JS Date
    const safeToDate = (date: any): Date | null => {
        if (!date) return null;
        if (typeof date.toDate === 'function') return date.toDate();
        if (date instanceof Date) return date;
        if (typeof date === 'string') return new Date(date);
        // Handle plain {seconds, nanoseconds} objects from Redis cache
        if (typeof date === 'object' && typeof date.seconds === 'number') {
            return new Date(date.seconds * 1000);
        }
        return null;
    };

    const fetchProjects = async () => {
        setLoading(true);

        const { projects: fetchedProjects, error } = await getProjects(
            showArchived ? { archived: true } : undefined
        );

        if (error) {
            console.error("Error fetching projects:", error);
        }
        setProjects(fetchedProjects || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchProjects();
    }, [showArchived]);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            Planning: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
            Active: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
            "On Hold": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
            Completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
            Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            Low: "text-gray-600",
            Medium: "text-blue-600",
            High: "text-orange-600",
            Critical: "text-red-600",
        };
        return colors[priority] || "text-gray-600";
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
                title="Projects"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Projects" },
                ]}
                description="Manage your projects and track progress"
                action={
                    <div className="flex gap-2">
                        <Button
                            variant={showArchived ? "secondary" : "outline"}
                            onClick={() => setShowArchived(!showArchived)}
                            className="gap-2"
                        >
                            <Archive className="h-4 w-4" />
                            {showArchived ? "View Active" : "View Archived"}
                        </Button>
                        <Button
                            onClick={() => setCreateDialogOpen(true)}
                            className="bg-primary hover:bg-primary/90 gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            New Project
                        </Button>
                    </div>
                }
            />

            {projects.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Get started by creating your first project
                        </p>
                        <Button
                            onClick={() => setCreateDialogOpen(true)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create Project
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                                            <CardDescription className="line-clamp-2 mt-1">
                                                {project.description || "No description"}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                                            {project.status}
                                        </span>
                                        <span className={`text-xs font-medium ${getPriorityColor(project.priority)}`}>
                                            {project.priority}
                                        </span>
                                        {project.archived && (
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                                                Archived
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Progress Bar */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-medium">{project.progress}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        {project.startDate && <span>Start: {format(safeToDate(project.startDate)!, "MMM d, yyyy")}</span>}
                                        {project.endDate && (
                                            <span>End: {format(safeToDate(project.endDate)!, "MMM d, yyyy")}</span>
                                        )}
                                    </div>

                                    {/* Company */}
                                    {project.companyName && (
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-medium">Company:</span> {project.companyName}
                                        </div>
                                    )}

                                    {/* Budget */}
                                    {project.budget && (
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-medium">Budget:</span> {canViewFinancials ? `$${project.budget.toLocaleString()}` : "$•••"}
                                        </div>
                                    )}

                                    {/* Team Members */}
                                    {project.teamMembers.length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-medium">Team:</span> {project.teamMembers.length} members
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            <CreateProjectDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={(createdProject) => {
                    // Optimistic update: add new project immediately
                    if (createdProject) {
                        setProjects((prev) => [createdProject, ...prev]);
                    }
                    // No need to fetch - optimistic update handles it and cache is invalidated
                    // Fresh data will be loaded on next page refresh/navigation
                }}
            />
        </div>
    );
}
