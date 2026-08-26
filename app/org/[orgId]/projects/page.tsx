"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getProjects } from "@/lib/firestore/projects";
import { usePermission } from "@/hooks/usePermission";
import type { Project, ProjectLifecycle } from "@/types/crm";
import { Plus, Briefcase, Sparkles, CheckCircle2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RBACGuard } from "@/components/auth/RBACGuard";
import { logger } from "@/lib/logger/client";

export default function ProjectsPage() {
    return (
        <RBACGuard requirePermission={{ module: "projects", action: "read" }}>
            <ProjectsPageContent />
        </RBACGuard>
    );
}

function ProjectsPageContent() {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const { can, isManager } = usePermission();
    const base = `/org/${orgId}`;
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [tab, setTab] = useState<"active" | "maintenance">("active");

    const canViewFinancials = isManager();
    const canCreate = can("projects", "create");

    const activeProjects = useMemo(
        () => projects.filter((p) => p.lifecycle !== "maintenance" && (p.progress ?? 0) < 100),
        [projects]
    );
    const maintenanceProjects = useMemo(
        () => projects.filter((p) => p.lifecycle === "maintenance" || (p.progress ?? 0) >= 100),
        [projects]
    );

    const visibleProjects = tab === "active" ? activeProjects : maintenanceProjects;

    const safeToDate = (date: any): Date | null => {
        if (!date) return null;
        if (typeof date.toDate === 'function') return date.toDate();
        if (date instanceof Date) return date;
        if (typeof date === 'string') return new Date(date);
        if (typeof date === 'object' && typeof date.seconds === 'number') {
            return new Date(date.seconds * 1000);
        }
        return null;
    };

    const fetchProjects = async () => {
        setLoading(true);
        const { projects: fetchedProjects, error } = await getProjects(orgId);
        if (error) {
            logger.error("Error fetching projects", { module: "projects", action: "fetch", orgId, error });
        }
        setProjects(fetchedProjects || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchProjects();
    }, []);

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
                    { label: "Dashboard", href: `${base}/dashboard` },
                    { label: "Projects" },
                ]}
                description="Manage your projects and track progress"
                action={
                    <div className="flex gap-2">
                        {canCreate && (
                            <Button
                                onClick={() => setCreateDialogOpen(true)}
                                className="bg-primary hover:bg-primary/90 gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                New Project
                            </Button>
                        )}
                    </div>
                }
            />

            <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "maintenance")}>
                <TabsList>
                    <TabsTrigger value="active" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Active Development
                        {activeProjects.length > 0 && (
                            <span className="ml-1 text-xs text-muted-foreground">({activeProjects.length})</span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="maintenance" className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Maintenance & Completed
                        {maintenanceProjects.length > 0 && (
                            <span className="ml-1 text-xs text-muted-foreground">({maintenanceProjects.length})</span>
                        )}
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {visibleProjects.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {canCreate ? "Get started by creating your first project" : "No projects have been created yet"}
                        </p>
                        {canCreate && (
                            <Button
                                onClick={() => setCreateDialogOpen(true)}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Create Project
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {visibleProjects.map((project) => (
                        <Link key={project.id} href={`${base}/projects/${project.id}`}>
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
                                        {tab === "maintenance" && project.lifecycle === "maintenance" && (
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                                Maintenance
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        {project.startDate && <span>Start: {format(safeToDate(project.startDate)!, "MMM d, yyyy")}</span>}
                                        {project.endDate && (
                                            <span>End: {format(safeToDate(project.endDate)!, "MMM d, yyyy")}</span>
                                        )}
                                    </div>

                                    {project.companyName && (
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-medium">Company:</span> {project.companyName}
                                        </div>
                                    )}

                                    {project.phases && project.phases.length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-medium">Phases:</span> {project.phases.length} ({project.phases.filter(p => p.progress >= 100).length} complete)
                                        </div>
                                    )}

                                    {project.budget && (
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-medium">Budget:</span> {canViewFinancials ? `$${project.budget.toLocaleString()}` : "$•••"}
                                        </div>
                                    )}

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
                    if (createdProject) {
                        setProjects((prev) => [createdProject, ...prev]);
                    }
                }}
            />
        </div>
    );
}
