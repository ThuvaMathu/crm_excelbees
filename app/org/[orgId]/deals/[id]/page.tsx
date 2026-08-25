"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EditDealDialog } from "@/components/deals/EditDealDialog";
import { getDeal, updateDeal, deleteDeal, archiveDeal, createProjectFromDeal } from "@/lib/firestore/deals";
import { toJsDate } from "@/lib/utils";
import { useOrgStore } from "@/store/org";
import { useAuthStore } from "@/store/auth";
import { usePermission } from "@/hooks/usePermission";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Deal, DealStage } from "@/types/crm";
import {
    ArrowLeft, DollarSign, TrendingUp, Calendar, Building2,
    Clock, Trash2, Archive, Tag, AlignLeft, Pencil, Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RBACGuard } from "@/components/auth/RBACGuard";

const STAGES: DealStage[] = [
    "Pipeline", "Follow Up", "Schedule Service", "Conversation", "Won", "Lost",
];

const stageColors: Record<DealStage, string> = {
    Pipeline: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Follow Up": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    "Schedule Service": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Conversation: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    Won: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function DealDetailPage() {
    return (
        <RBACGuard requirePermission={{ module: "deals", action: "read" }}>
            <DealDetailPageContent />
        </RBACGuard>
    );
}

function DealDetailPageContent() {
    const params = useParams<{ orgId: string; id: string }>();
    const { orgId, id } = params;
    const router = useRouter();
    const { currentMember } = useOrgStore();
    const { user } = useAuthStore();
    const { can, canEditAll, canDelete: hasDeletePermission, isManager } = usePermission();
    const base = `/org/${orgId}`;

    const [deal, setDeal] = useState<Deal | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [updatingStage, setUpdatingStage] = useState(false);
    const { confirm, ConfirmDialog } = useConfirm();
    const [editOpen, setEditOpen] = useState(false);
    const [creatingProject, setCreatingProject] = useState(false);

    const canEdit =
        canEditAll("deals") ||
        (deal?.ownerId === currentMember?.userId && can("deals", "edit"));
    const canDelete = hasDeletePermission("deals");
    const canViewFinancials = isManager();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { deal: fetched, error } = await getDeal(id);
            if (error || !fetched) {
                setNotFound(true);
            } else {
                setDeal(fetched);
            }
            setLoading(false);
        };
        load();
    }, [id]);

    const handleEditSuccess = async () => {
        const { deal: refreshed } = await getDeal(id);
        if (refreshed) setDeal(refreshed);
    };

    const handleCreateProject = async () => {
        if (!deal || !user || !canEdit) return;
        if (!(await confirm({ title: "Create Project", message: `Create a project for "${deal.title}"? This will create a new project with details from this deal.`, confirmLabel: "Create", destructive: false }))) return;
        setCreatingProject(true);
        const { success, projectId, error } = await createProjectFromDeal(
            deal.id, user.uid, user.displayName || user.email || "Unknown", orgId
        );
        setCreatingProject(false);
        if (!success || !projectId) {
            toast.error(error || "Failed to create project");
            return;
        }
        toast.success("Project created successfully!");
        router.push(`${base}/projects/${projectId}`);
    };

    const handleStageChange = async (stage: DealStage) => {
        if (!deal || !canEdit) return;
        setUpdatingStage(true);
        const { error } = await updateDeal(deal.id, { stage }, user!.uid);
        if (error) {
            toast.error("Failed to update stage");
        } else {
            setDeal((prev) => prev ? { ...prev, stage } : prev);
            toast.success(`Moved to ${stage}`);
        }
        setUpdatingStage(false);
    };

    const handleDelete = async () => {
        if (!deal) return;
        if (!(await confirm({ title: "Delete Deal", message: `Delete "${deal.title}"? This action cannot be undone.`, confirmLabel: "Delete", destructive: true }))) return;
        setDeleting(true);
        const { error } = await deleteDeal(deal.id, user!.uid);
        if (error) {
            toast.error("Failed to delete deal");
            setDeleting(false);
        } else {
            toast.success("Deal deleted");
            router.replace(`${base}/deals`);
        }
    };

    const handleArchive = async () => {
        if (!deal) return;
        setArchiving(true);
        const { error } = await archiveDeal(deal.id, user!.uid);
        if (error) {
            toast.error("Failed to archive deal");
        } else {
            toast.success("Deal archived");
            router.replace(`${base}/deals`);
        }
        setArchiving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (notFound || !deal) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <DollarSign className="h-16 w-16 text-muted-foreground/40" />
                <h2 className="text-xl font-semibold">Deal not found</h2>
                <p className="text-muted-foreground text-sm">
                    This deal may have been deleted or does not exist.
                </p>
                <Button variant="outline" onClick={() => router.push(`${base}/deals`)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Deals
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={deal.title}
                breadcrumbs={[
                    { label: "Dashboard", href: `${base}/dashboard` },
                    { label: "Deals", href: `${base}/deals` },
                    { label: deal.title },
                ]}
                description={[deal.companyName, deal.stage].filter(Boolean).join(" · ")}
                action={
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stageColors[deal.stage]}`}>
                            {deal.stage}
                        </span>
                        {canEdit && (
                            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                            </Button>
                        )}
                        {canEdit && deal.stage === "Won" && (
                            <Button variant="outline" size="sm" onClick={handleCreateProject} disabled={creatingProject}>
                                {creatingProject ? <LoadingSpinner size="sm" className="mr-1" /> : <Briefcase className="h-4 w-4 mr-1" />}
                                Create Project
                            </Button>
                        )}
                        {canEdit && (
                            <Button variant="outline" size="sm" onClick={handleArchive} disabled={archiving}>
                                {archiving ? <LoadingSpinner size="sm" className="mr-1" /> : <Archive className="h-4 w-4 mr-1" />}
                                Archive
                            </Button>
                        )}
                        {canDelete && (
                            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                                {deleting ? <LoadingSpinner size="sm" className="mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                                Delete
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* ── Main column ──────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Core metrics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Deal Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <InfoRow
                                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                                label="Value"
                                value={
                                    canViewFinancials
                                        ? <span className="font-bold text-primary">${deal.value.toLocaleString()}</span>
                                        : "$•••"
                                }
                            />
                            <InfoRow
                                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                                label="Probability"
                                value={
                                    <span className="font-semibold">{deal.probability}%</span>
                                }
                            />
                            {deal.companyName && (
                                <InfoRow
                                    icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
                                    label="Company"
                                    value={deal.companyName}
                                />
                            )}
                            {deal.closeDate && (
                                <InfoRow
                                    icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                                    label="Expected Close"
                                    value={format(deal.closeDate.toDate(), "MMM d, yyyy")}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Description */}
                    {deal.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <AlignLeft className="h-4 w-4" />
                                    Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {deal.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes */}
                    {deal.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {deal.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── Sidebar ───────────────────────────────────────────── */}
                <div className="space-y-6">

                    {/* Stage control */}
                    {canEdit && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Pipeline Stage</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select
                                    value={deal.stage}
                                    onValueChange={(v) => handleStageChange(v as DealStage)}
                                    disabled={updatingStage}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STAGES.map((s) => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>
                    )}

                    {/* Record details */}
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
                                <span>{(() => { const d = toJsDate(deal.createdAt); return d ? format(d, "MMM d, yyyy") : "-"; })()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    Updated
                                </span>
                                <span>{(() => { const d = toJsDate(deal.updatedAt); return d ? format(d, "MMM d, yyyy") : "-"; })()}</span>
                            </div>
                            {deal.ownerName && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Owner</span>
                                    <span className="truncate max-w-[60%] text-right">{deal.ownerName}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Button variant="outline" className="w-full" onClick={() => router.push(`${base}/deals`)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Deals
                    </Button>
                </div>
            </div>

            <EditDealDialog open={editOpen} onOpenChange={setEditOpen} deal={deal} onSuccess={handleEditSuccess} />
            <ConfirmDialog />
        </div>
    );
}

function InfoRow({
    icon, label, value,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
}) {
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
