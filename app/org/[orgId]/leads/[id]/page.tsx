"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { EditLeadDialog } from "@/components/leads/EditLeadDialog";
import { getLead, deleteLead, updateLead, convertLeadToContact, convertLeadToDeal, convertLeadToProject } from "@/lib/firestore/leads";
import { useOrgStore } from "@/store/org";
import { useAuthStore } from "@/store/auth";
import { usePermission } from "@/hooks/usePermission";
import type { Lead, LeadStatus } from "@/types/crm";
import {
    ArrowLeft, Users, Mail, Phone, Building2, Briefcase, DollarSign, Clock,
    Trash2, Pencil, Tag, Calendar, TrendingUp, Zap, UserCheck, Handshake, FolderKanban,
} from "lucide-react";
import { format } from "date-fns";
import { toJsDate } from "@/lib/utils";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RBACGuard } from "@/components/auth/RBACGuard";

export default function LeadDetailPage() {
    return (
        <RBACGuard requirePermission={{ module: "leads", action: "read" }}>
            <LeadDetailPageContent />
        </RBACGuard>
    );
}

function LeadDetailPageContent() {
    const params = useParams<{ orgId: string; id: string }>();
    const { orgId, id } = params;
    const router = useRouter();
    const { currentMember } = useOrgStore();
    const { user } = useAuthStore();
    const { can, canEditAll, canDelete: hasDeletePermission, isManager } = usePermission();
    const base = `/org/${orgId}`;

    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [converting, setConverting] = useState<"contact" | "deal" | "project" | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const { confirm, ConfirmDialog } = useConfirm();

    const canEdit =
        canEditAll("leads") ||
        (lead?.ownerId === currentMember?.userId && can("leads", "edit"));
    const canDelete = hasDeletePermission("leads");
    const canViewFinancials = isManager();

    useEffect(() => {
        const fetchLead = async () => {
            setLoading(true);
            const { lead: fetched, error } = await getLead(id);
            if (error || !fetched) {
                setNotFound(true);
            } else {
                setLead(fetched);
            }
            setLoading(false);
        };
        fetchLead();
    }, [id]);

    const handleEditSuccess = async () => {
        const { lead: refreshed } = await getLead(id);
        if (refreshed) setLead(refreshed);
    };

    const handleDelete = async () => {
        if (!lead) return;
        if (!(await confirm({ title: "Delete Lead", message: "Delete this lead? This action cannot be undone.", confirmLabel: "Delete", destructive: true }))) return;
        setDeleting(true);
        const { error } = await deleteLead(lead.id, user!.uid);
        if (error) {
            toast.error("Failed to delete lead");
            setDeleting(false);
        } else {
            toast.success("Lead deleted");
            router.replace(`${base}/leads`);
        }
    };

    const handleConvert = async (target: "contact" | "deal" | "project") => {
        if (!lead || !user) return;
        if (!(await confirm({ title: "Convert Lead", message: `Convert this lead to a ${target}? This action cannot be undone.`, confirmLabel: "Convert", destructive: false }))) return;
        setConverting(target);
        const displayName = user.displayName || user.email || "Unknown";
        let result: { success: boolean; error: string | null; [k: string]: any };
        if (target === "contact") result = await convertLeadToContact(lead.id, user.uid, displayName, orgId);
        else if (target === "deal") result = await convertLeadToDeal(lead.id, user.uid, displayName, orgId);
        else result = await convertLeadToProject(lead.id, user.uid, displayName, orgId);
        if (!result.success) {
            toast.error(result.error || `Failed to convert to ${target}`);
            setConverting(null);
            return;
        }
        toast.success(`Lead converted to ${target}`);
        // Refresh lead data to show converted state
        const { lead: refreshed } = await getLead(id);
        if (refreshed) setLead(refreshed);
        // Navigate to the new record
        if (target === "contact" && result.contactId) router.push(`${base}/contacts/${result.contactId}`);
        else if (target === "deal" && result.dealId) router.push(`${base}/deals/${result.dealId}`);
        else if (target === "project" && result.projectId) router.push(`${base}/projects/${result.projectId}`);
        setConverting(null);
    };

    const handleStatusChange = async (newStatus: LeadStatus) => {
        if (!lead || !canEdit) return;
        setUpdatingStatus(true);
        const { error } = await updateLead(lead.id, { status: newStatus }, user!.uid);
        if (error) {
            toast.error("Failed to update status");
        } else {
            setLead((prev) => prev ? { ...prev, status: newStatus } : prev);
            toast.success("Status updated");
        }
        setUpdatingStatus(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (notFound || !lead) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Users className="h-16 w-16 text-muted-foreground/40" />
                <h2 className="text-xl font-semibold">Lead not found</h2>
                <p className="text-muted-foreground text-sm">
                    This lead may have been deleted or does not exist.
                </p>
                <Button variant="outline" onClick={() => router.push(`${base}/leads`)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Leads
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${lead.firstName} ${lead.lastName}`}
                breadcrumbs={[
                    { label: "Dashboard", href: `${base}/dashboard` },
                    { label: "Leads", href: `${base}/leads` },
                    { label: `${lead.firstName} ${lead.lastName}` },
                ]}
                description={lead.jobTitle || lead.companyName || "Lead details"}
                action={
                    <div className="flex items-center gap-2">
                        <LeadStatusBadge status={lead.status} />
                        {canEdit && (
                            <Button variant="outline" onClick={() => setEditOpen(true)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        )}
                        {canDelete && (
                            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                                {deleting ? <LoadingSpinner size="sm" className="mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Delete
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Conversion banners */}
            {lead.converted && (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
                    <Zap className="h-4 w-4 shrink-0" />
                    This lead has been converted.{" "}
                    {lead.convertedToContactId && (
                        <button
                            className="underline font-medium"
                            onClick={() => router.push(`${base}/contacts/${lead.convertedToContactId}`)}
                        >
                            View contact
                        </button>
                    )}
                    {lead.convertedToDealId && (
                        <button
                            className="underline font-medium"
                            onClick={() => router.push(`${base}/deals/${lead.convertedToDealId}`)}
                        >
                            View deal
                        </button>
                    )}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Lead Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <InfoRow
                                icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                                label="Email"
                                value={
                                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                                        {lead.email}
                                    </a>
                                }
                            />
                            <InfoRow
                                icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                                label="Phone"
                                value={
                                    lead.phone ? (
                                        <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                                            {lead.phone}
                                        </a>
                                    ) : <span className="text-muted-foreground">—</span>
                                }
                            />
                            <InfoRow
                                icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
                                label="Company"
                                value={lead.companyName || <span className="text-muted-foreground">—</span>}
                            />
                            <InfoRow
                                icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
                                label="Job Title"
                                value={lead.jobTitle || <span className="text-muted-foreground">—</span>}
                            />
                            <InfoRow
                                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                                label="Source"
                                value={<span className="capitalize">{lead.source}</span>}
                            />
                            {lead.value !== undefined && lead.value !== null && (
                                <InfoRow
                                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                                    label="Estimated Value"
                                    value={
                                        canViewFinancials
                                            ? `$${lead.value.toLocaleString()}`
                                            : "$•••"
                                    }
                                />
                            )}
                            {lead.lastContactedAt && (
                                <InfoRow
                                    icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                                    label="Last Contacted"
                                    value={(() => { const d = toJsDate(lead.lastContactedAt); return d ? format(d, "MMM d, yyyy") : "-"; })()}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {lead.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {lead.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {lead.tags && lead.tags.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    Tags
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {lead.tags.map((tag) => (
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

                    {/* AI Score */}
                    {lead.aiScore !== undefined && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-amber-500" />
                                    AI Qualification Score
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl font-bold text-primary">
                                        {lead.aiScore}
                                        <span className="text-base font-normal text-muted-foreground">/100</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full"
                                                style={{ width: `${lead.aiScore}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {lead.aiReasoning && lead.aiReasoning.length > 0 && (
                                    <ul className="mt-3 space-y-1">
                                        {lead.aiReasoning.map((r, i) => (
                                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                                                {r}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick status update */}
                    {canEdit && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Update Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select
                                    value={lead.status}
                                    onValueChange={(v) => handleStatusChange(v as LeadStatus)}
                                    disabled={updatingStatus}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="New">New</SelectItem>
                                        <SelectItem value="Contacted">Contacted</SelectItem>
                                        <SelectItem value="Follow Up">Follow Up</SelectItem>
                                        <SelectItem value="Qualified">Qualified</SelectItem>
                                        <SelectItem value="Lost">Lost</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>
                    )}

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
                                <span>{(() => { const d = toJsDate(lead.createdAt); return d ? format(d, "MMM d, yyyy") : "-"; })()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    Updated
                                </span>
                                <span>{(() => { const d = toJsDate(lead.updatedAt); return d ? format(d, "MMM d, yyyy") : "-"; })()}</span>
                            </div>
                            {lead.ownerName && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Owner</span>
                                    <span>{lead.ownerName}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Conversion actions */}
                    {canEdit && !lead.converted && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Convert Lead</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2"
                                    onClick={() => handleConvert("contact")}
                                    disabled={!!converting}
                                >
                                    {converting === "contact" ? <LoadingSpinner size="sm" /> : <UserCheck className="h-4 w-4" />}
                                    Convert to Contact
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2"
                                    onClick={() => handleConvert("deal")}
                                    disabled={!!converting}
                                >
                                    {converting === "deal" ? <LoadingSpinner size="sm" /> : <Handshake className="h-4 w-4" />}
                                    Convert to Deal
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2"
                                    onClick={() => handleConvert("project")}
                                    disabled={!!converting}
                                >
                                    {converting === "project" ? <LoadingSpinner size="sm" /> : <FolderKanban className="h-4 w-4" />}
                                    Convert to Project
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {lead.converted && (
                        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                            <CardContent className="pt-4">
                                <p className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                                    <Zap className="h-4 w-4 shrink-0" />
                                    Lead already converted
                                </p>
                                <div className="mt-2 space-y-1">
                                    {lead.convertedToContactId && (
                                        <button className="text-xs text-primary underline block" onClick={() => router.push(`${base}/contacts/${lead.convertedToContactId}`)}>
                                            View contact →
                                        </button>
                                    )}
                                    {lead.convertedToDealId && (
                                        <button className="text-xs text-primary underline block" onClick={() => router.push(`${base}/deals/${lead.convertedToDealId}`)}>
                                            View deal →
                                        </button>
                                    )}
                                    {lead.convertedToProjectId && (
                                        <button className="text-xs text-primary underline block" onClick={() => router.push(`${base}/projects/${lead.convertedToProjectId}`)}>
                                            View project →
                                        </button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`${base}/leads`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Leads
                    </Button>
                </div>
            </div>

            <EditLeadDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} onSuccess={handleEditSuccess} />
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
