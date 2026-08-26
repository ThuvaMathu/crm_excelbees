"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { getProject, deleteProject, updateProject, updateProjectLifecycle } from "@/lib/firestore/projects";
import { getTasksByProject } from "@/lib/firestore/tasks";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { useOrgStore } from "@/store/org";
import { usePermission } from "@/hooks/usePermission";
import type { Project, ProjectPhase } from "@/types/crm";
import {
    ArrowLeft, Briefcase, Calendar, Building2, Users, DollarSign, Clock,
    Pencil, Trash2, TrendingUp, Tag, CheckCircle2, RefreshCw, Plus,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { RBACGuard } from "@/components/auth/RBACGuard";

export default function ProjectDetailPage() {
    return (
        <RBACGuard requirePermission={{ module: "projects", action: "read" }}>
            <ProjectDetailPageContent />
        </RBACGuard>
    );
}

function ProjectDetailPageContent() {
    const params = useParams<{ orgId: string; id: string }>();
    const { orgId, id } = params;
    const router = useRouter();
    const { currentMember } = useOrgStore();
    const { can, canEditAll, canDelete: hasDeletePermission, isManager } = usePermission();
    const base = `/org/${orgId}`;

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const { confirm, ConfirmDialog } = useConfirm();
    const [transitioning, setTransitioning] = useState(false);
    const [savingPhase, setSavingPhase] = useState<string | null>(null);

    const canEdit =
        canEditAll("projects") ||
        (project?.ownerId === currentMember?.userId && can("projects", "edit"));
    const canDelete = hasDeletePermission("projects");
    const canViewFinancials = isManager();

    const safeToDate = (ts: any): Date | null => {
        if (!ts) return null;
        if (typeof ts.toDate === "function") return ts.toDate();
        if (ts instanceof Date) return ts;
        if (typeof ts === "object" && typeof ts.seconds === "number")
            return new Date(ts.seconds * 1000);
        return null;
    };

    useEffect(() => {
        const fetchProject = async () => {
            setLoading(true);
            const { project: fetched, error } = await getProject(id);
            if (error || !fetched) {
                setNotFound(true);
            } else {
                setProject(fetched);
                const tasksResult = await getTasksByProject(orgId, id);
                if (!tasksResult.error) {
                    setTasks(tasksResult.tasks);
                }
            }
            setLoading(false);
        };
        fetchProject();
    }, [id, orgId]);

    const handleEditSuccess = async () => {
        const { project: refreshed } = await getProject(id);
        if (refreshed) setProject(refreshed);
    };

    const handleDelete = async () => {
        if (!project) return;
        if (!(await confirm({ title: "Delete Project", message: "Delete this project? This action cannot be undone.", confirmLabel: "Delete", destructive: true }))) return;
        setDeleting(true);
        const { error } = await deleteProject(project.id, currentMember!.userId);
        if (error) {
            toast.error("Failed to delete project");
            setDeleting(false);
        } else {
            toast.success("Project deleted");
            router.replace(`${base}/projects`);
        }
    };

    const handleMarkComplete = async () => {
        if (!project) return;
        setTransitioning(true);
        await updateProject(project.id, { lifecycle: "maintenance", status: "Completed", progress: 100 }, currentMember!.userId);
        const { project: refreshed } = await getProject(id);
        if (refreshed) setProject(refreshed);
        setTransitioning(false);
        toast.success("Project moved to Maintenance & Completed");
    };

    const handleReactivate = async () => {
        if (!project) return;
        setTransitioning(true);
        await updateProject(project.id, { lifecycle: "active" }, currentMember!.userId);
        const { project: refreshed } = await getProject(id);
        if (refreshed) setProject(refreshed);
        setTransitioning(false);
        toast.success("Project reactivated");
    };

    const handlePhaseProgressChange = async (phaseId: string, progress: number) => {
        if (!project || !canEdit) return;
        setSavingPhase(phaseId);
        const updatedPhases = (project.phases || []).map((p) =>
            p.id === phaseId ? { ...p, progress: Math.min(100, Math.max(0, progress)) } : p
        );
        const avgProgress = Math.round(
            updatedPhases.reduce((sum, p) => sum + p.progress, 0) / updatedPhases.length
        );
        await updateProject(project.id, { phases: updatedPhases, progress: avgProgress }, currentMember!.userId);
        const { project: refreshed } = await getProject(id);
        if (refreshed) setProject(refreshed);
        setSavingPhase(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (notFound || !project) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Briefcase className="h-16 w-16 text-muted-foreground/40" />
                <h2 className="text-xl font-semibold">Project not found</h2>
                <p className="text-muted-foreground text-sm">
                    This project may have been deleted or does not exist.
                </p>
                <Button variant="outline" onClick={() => router.push(`${base}/projects`)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Projects
                </Button>
            </div>
        );
    }

    const statusColors: Record<string, string> = {
        Planning: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
        Active: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        Development: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
        "On Hold": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
        Completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
        Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };

    const lifecycleColors: Record<string, string> = {
        active: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
        maintenance: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    };

    const isComplete = (project?.progress ?? 0) >= 100;

    const priorityColors: Record<string, string> = {
        Low: "text-gray-600",
        Medium: "text-blue-600",
        High: "text-orange-600",
        Critical: "text-red-600",
    };

    const createdAt = safeToDate(project.createdAt);
    const updatedAt = safeToDate(project.updatedAt);
    const startDate = safeToDate(project.startDate);
    const endDate = safeToDate(project.endDate);

    return (
        <div className="space-y-6">
            <PageHeader
                title={project.name}
                breadcrumbs={[
                    { label: "Dashboard", href: `${base}/dashboard` },
                    { label: "Projects", href: `${base}/projects` },
                    { label: project.name },
                ]}
                description={project.description || "Project details"}
                action={
                    <div className="flex gap-2">
                        {canEdit && (
                            <Button variant="outline" onClick={() => setEditOpen(true)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <LoadingSpinner size="sm" className="mr-2" />
                                ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                Delete
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Status & Priority badges */}
            <div className="flex items-center gap-3 flex-wrap">
                <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[project.status] || "bg-gray-100 text-gray-800"}`}
                >
                    {project.status}
                </span>
                <span className={`text-sm font-semibold ${priorityColors[project.priority] || "text-gray-600"}`}>
                    {project.priority} Priority
                </span>
                {project.lifecycle && (
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${lifecycleColors[project.lifecycle]}`}>
                        {project.lifecycle === "active" ? "Active Development" : "Maintenance & Completed"}
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm font-bold text-primary">{project.progress ?? 0}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${project.progress ?? 0}%` }}
                        />
                    </div>
                    {canEdit && isComplete && project.lifecycle === "active" && (
                        <Button
                            variant="default"
                            className="w-full gap-2 bg-green-600 hover:bg-green-700"
                            onClick={handleMarkComplete}
                            disabled={transitioning}
                        >
                            {transitioning ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="h-4 w-4" />}
                            Mark as Complete & Move to Maintenance
                        </Button>
                    )}
                    {canEdit && project.lifecycle === "maintenance" && (
                        <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={handleReactivate}
                            disabled={transitioning}
                        >
                            {transitioning ? <LoadingSpinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
                            Reactivate Project
                        </Button>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Project Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <InfoRow
                                icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                                label="Start Date"
                                value={startDate ? format(startDate, "MMM d, yyyy") : "—"}
                            />
                            <InfoRow
                                icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                                label="End Date"
                                value={endDate ? format(endDate, "MMM d, yyyy") : "—"}
                            />
                            <InfoRow
                                icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
                                label="Company"
                                value={project.companyName || "—"}
                            />
                            <InfoRow
                                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                                label="Team Members"
                                value={`${project.teamMembers?.length ?? 0} members`}
                            />
                            {canViewFinancials && project.budget && (
                                <InfoRow
                                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                                    label="Budget"
                                    value={`$${project.budget.toLocaleString()}`}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Project Scope */}
                    {project.scope && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Project Scope
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {project.scope}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Project Phases */}
                    {project.phases && project.phases.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Phases ({project.phases.filter((p) => p.progress >= 100).length}/{project.phases.length} complete)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {project.phases
                                    .sort((a, b) => a.order - b.order)
                                    .map((phase) => (
                                        <div key={phase.id} className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{phase.name}</span>
                                                    {phase.description && (
                                                        <span className="text-xs text-muted-foreground">— {phase.description}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {canEdit ? (
                                                        <div className="flex items-center gap-1">
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                className="h-7 w-16 text-xs"
                                                                value={phase.progress}
                                                                onChange={(e) => handlePhaseProgressChange(phase.id, Number(e.target.value))}
                                                                disabled={savingPhase === phase.id}
                                                            />
                                                            <span className="text-xs text-muted-foreground">%</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-semibold text-primary">{phase.progress}%</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${phase.progress >= 100 ? "bg-green-500" : "bg-primary"}`}
                                                    style={{ width: `${phase.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </CardContent>
                        </Card>
                    )}

                    {tasks.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Associated Tasks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div
                                                className={`w-2 h-2 rounded-full ${
                                                    task.status === "Done"
                                                        ? "bg-green-500"
                                                        : task.status === "In Progress"
                                                        ? "bg-blue-500"
                                                        : "bg-gray-300"
                                                }`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{task.title}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {task.description}
                                                </p>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {task.assigneeName || "Unassigned"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {project.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {project.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {project.tags && project.tags.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    Tags
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {project.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Record Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    Created
                                </span>
                                <span>{createdAt ? format(createdAt, "MMM d, yyyy") : "—"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    Updated
                                </span>
                                <span>{updatedAt ? format(updatedAt, "MMM d, yyyy") : "—"}</span>
                            </div>
                            {project.ownerName && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Owner</span>
                                    <span>{project.ownerName}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`${base}/projects`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Projects
                    </Button>
                </div>
            </div>

            <EditProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project} onSuccess={handleEditSuccess} />
            <ConfirmDialog />
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">{icon}</div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <div className="text-sm font-medium">{value}</div>
            </div>
        </div>
    );
}
