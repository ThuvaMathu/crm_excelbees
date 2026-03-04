"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getLead, deleteLead, updateLead, convertLeadToContact } from "@/lib/firestore/leads";
import { Timestamp } from "firebase/firestore";
import { getActivities, logStatusChange, type Activity } from "@/lib/firestore/activities";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import type { Lead } from "@/types/crm";
import {
    ArrowLeft,
    Mail,
    Phone,
    Building2,
    Briefcase,
    DollarSign,
    Calendar,
    Tag,
    Trash2,
    Pencil,
    Shield,
    Sparkles,
    TrendingUp,
    Lightbulb,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { scoreLead, enrichLead } from "@/app/actions/ai_leads";
import { aiConfig } from "@/lib/ai/config";
import { EmailComposeModal } from "@/components/email/EmailComposeModal";
import { EditLeadDialog } from "@/components/leads/EditLeadDialog";
import { getTasks } from "@/lib/firestore/tasks";

export default function LeadDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    // Unwrap the params Promise
    const { id } = use(params);

    const router = useRouter();
    const { user } = useAuth();
    const [lead, setLead] = useState<Lead | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [relatedTasks, setRelatedTasks] = useState<any[]>([]);

    // Role-based access control
    const canEdit = user?.role === "admin" || user?.role === "manager" || lead?.ownerId === user?.uid;
    const canDelete = user?.role === "admin" || user?.role === "manager";
    const canViewFinancials = user?.role === "admin" || user?.role === "manager";

    useEffect(() => {
        fetchLeadData();
    }, [id]);

    const fetchLeadData = async () => {
        setLoading(true);

        const [leadResult, activitiesResult, tasksResult] = await Promise.all([
            getLead(id),
            getActivities("leads", id),
            getTasks({ leadId: id }),
        ]);

        if (leadResult.error) {
            toast.error(leadResult.error);
            router.push("/leads");
        } else {
            setLead(leadResult.lead);
        }

        if (!activitiesResult.error) {
            setActivities(activitiesResult.activities);
        }

        if (!tasksResult.error && tasksResult.tasks) {
            setRelatedTasks(tasksResult.tasks);
        }

        setLoading(false);
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!lead || !user || !canEdit) return;

        setUpdating(true);
        const oldStatus = lead.status;

        const { success, error } = await updateLead(id, { status: newStatus as any });

        if (success) {
            // Log status change
            await logStatusChange(
                "leads",
                id,
                "status",
                oldStatus,
                newStatus,
                user.uid,
                user.displayName || user.email || "Unknown"
            );

            toast.success("Status updated successfully");
            fetchLeadData();
        } else {
            toast.error(error || "Failed to update status");
        }

        setUpdating(false);
    };

    const handleScoreLead = async () => {
        if (!lead) return;
        setAiLoading(true);
        const toastId = toast.loading("Analyzing lead profile...");

        try {
            // Serialize lead to plain object to avoid passing complex Firestore types (Timestamps) to Server Action
            const plainLead = JSON.parse(JSON.stringify(lead));
            const { success, data, error } = await scoreLead(plainLead as any);

            if (success && data) {
                toast.success("Lead qualification complete", { id: toastId });
                // Update local state with new AI data
                setLead(prev => prev ? ({
                    ...prev,
                    aiScore: data.score,
                    aiReasoning: data.reasoning,
                    aiLastUpdated: Timestamp.now()
                }) : null);
            } else {
                toast.error(error || "Failed to score lead", { id: toastId });
            }
        } catch (err) {
            toast.error("An error occurred", { id: toastId });
        } finally {
            setAiLoading(false);
        }
    };

    const handleEnrichLead = async () => {
        if (!lead?.companyName) {
            toast.error("Company name is required for enrichment");
            return;
        }
        setAiLoading(true);
        const toastId = toast.loading(`Researching ${lead.companyName}...`);

        try {
            const { success, data, error } = await enrichLead(lead.companyName);

            if (success && data) {
                toast.success("Company data found", { id: toastId });
                // Show results in a dialog or toast (For now, just a detailed toast)
                toast.message("Enrichment Results", {
                    description: `${data.summary}\n\nEmployees: ${data.employeeCount}\nIndustry: ${data.industry}`,
                    duration: 10000,
                });
                // In a real app, we would update the lead's company fields here
            } else {
                toast.error(error || "Failed to enrich data", { id: toastId });
            }
        } catch (err) {
            toast.error("AI Error", { id: toastId });
        } finally {
            setAiLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!canDelete) {
            toast.error("You don't have permission to delete this lead");
            return;
        }

        if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
            return;
        }

        const { success, error } = await deleteLead(id);

        if (success) {
            toast.success("Lead deleted successfully");
            router.push("/leads");
        } else {
            toast.error(error || "Failed to delete lead");
        }
    };



    const handleEmail = () => {
        if (!lead?.email) {
            toast.error("No email address available");
            return;
        }
        setIsEmailOpen(true);
    };

    const handleCall = () => {
        if (!lead?.phone) {
            toast.error("No phone number available");
            return;
        }
        window.location.href = `tel:${lead.phone}`;
    };

    const handleConvert = async () => {
        if (!lead || !user || !canEdit) return;

        // Confirm conversion
        const confirmed = confirm(
            `Convert ${lead.firstName} ${lead.lastName} to a contact?\n\n` +
            "This will create a new contact with this lead's information. " +
            "The lead will be marked as converted."
        );

        if (!confirmed) return;

        setIsConverting(true);
        const toastId = toast.loading("Converting lead to contact...");

        try {
            const { success, contactId, error } = await convertLeadToContact(
                id,
                user.uid,
                user.displayName || user.email || "Unknown"
            );

            if (success && contactId) {
                toast.success("Successfully converted to contact!", { id: toastId });
                router.push(`/contacts/${contactId}`);
            } else {
                toast.error(error || "Failed to convert lead", { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred", { id: toastId });
        } finally {
            setIsConverting(false);
        }
    };

    const handleConvertToDeal = async () => {
        if (!lead || !user || !canEdit) return;

        if (!confirm(`Create a Deal for ${lead.firstName} ${lead.lastName}?`)) return;

        setIsConverting(true);
        const toastId = toast.loading("Creating Deal...");

        try {
            // Dynamically import to ensure we have the new function if not reloaded
            const { convertLeadToDeal } = await import("@/lib/firestore/leads");
            const { success, dealId, error } = await convertLeadToDeal(
                id,
                user.uid,
                user.displayName || user.email || "Unknown"
            );

            if (success && dealId) {
                toast.success("Deal created successfully!", { id: toastId });
                router.push(`/deals/${dealId}`);
            } else {
                toast.error(error || "Failed to create deal", { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred", { id: toastId });
        } finally {
            setIsConverting(false);
        }
    };

    const handleConvertToProject = async () => {
        if (!lead || !user || !canEdit) return;

        if (!confirm(`Start a Project for ${lead.firstName} ${lead.lastName}?`)) return;

        setIsConverting(true);
        const toastId = toast.loading("Initializing Project...");

        try {
            // Dynamically import
            const { convertLeadToProject } = await import("@/lib/firestore/leads");
            const { success, projectId, error } = await convertLeadToProject(
                id,
                user.uid,
                user.displayName || user.email || "Unknown"
            );

            if (success && projectId) {
                toast.success("Project started successfully!", { id: toastId });
                router.push(`/projects/${projectId}`);
            } else {
                toast.error(error || "Failed to create project", { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred", { id: toastId });
        } finally {
            setIsConverting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!lead) {
        return null;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${lead.firstName} ${lead.lastName}`}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Leads", href: "/leads" },
                    { label: `${lead.firstName} ${lead.lastName}` },
                ]}
                action={
                    <div className="flex gap-2">
                        {canEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDelete}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        )}
                        {!canEdit && !canDelete && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Shield className="h-4 w-4" />
                                View Only
                            </div>
                        )}
                    </div>
                }
            />

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    {/* AI Lead Qualification */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-indigo-900">
                                    <Sparkles className="h-5 w-5 text-indigo-600" />
                                    AI Qualification Score
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleScoreLead}
                                    disabled={aiLoading}
                                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                >
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    {lead.aiScore !== undefined ? "Recalculate" : "Calculate Score"}
                                </Button>
                            </div>
                            <CardDescription>
                                Powered by {aiConfig.leads.model}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {lead.aiScore !== undefined ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-6">
                                        <div className="relative h-24 w-24 flex items-center justify-center rounded-full border-4 border-indigo-200 bg-white">
                                            <div className="text-2xl font-bold text-indigo-700">
                                                {lead.aiScore}
                                            </div>
                                            <div className="absolute top-0 right-0">
                                                {lead.aiScore >= 80 ? (
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">Consider High</span>
                                                ) : lead.aiScore >= 50 ? (
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">Med</span>
                                                ) : (
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">Low</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <h4 className="font-medium text-sm text-indigo-900 flex items-center gap-2">
                                                <Lightbulb className="h-4 w-4" />
                                                Why this score?
                                            </h4>
                                            <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                                                {lead.aiReasoning?.slice(0, 3).map((reason, i) => (
                                                    <li key={i}>{reason}</li>
                                                )) || <li>No reasoning available.</li>}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground text-right border-t border-indigo-100 pt-2">
                                        Last updated: {lead.aiLastUpdated ? format(lead.aiLastUpdated.toDate(), "MMM d, h:mm a") : "Just now"}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-sm text-muted-foreground">
                                    <p>No qualification score generated yet.</p>
                                    <Button
                                        variant="link"
                                        onClick={handleScoreLead}
                                        className="text-indigo-600 mt-2"
                                    >
                                        Run AI Analysis
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CardTitle>Lead Information</CardTitle>
                                    {lead.converted && (
                                        <div className="flex flex-col gap-1 items-end">
                                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                ✓ Converted
                                            </span>
                                            {lead.convertedToContactId && (
                                                <Link href={`/contacts/${lead.convertedToContactId}`} className="text-xs text-primary hover:underline">
                                                    View Contact →
                                                </Link>
                                            )}
                                            {lead.convertedToDealId && (
                                                <Link href={`/deals/${lead.convertedToDealId}`} className="text-xs text-primary hover:underline">
                                                    View Deal →
                                                </Link>
                                            )}
                                            {lead.convertedToProjectId && (
                                                <Link href={`/projects/${lead.convertedToProjectId}`} className="text-xs text-primary hover:underline">
                                                    View Project →
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {canEdit ? (
                                        <Select
                                            value={lead.status}
                                            onValueChange={handleStatusChange}
                                            disabled={updating}
                                        >
                                            <SelectTrigger className="w-[180px]">
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
                                    ) : (
                                        <LeadStatusBadge status={lead.status} />
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span>Email</span>
                                    </div>
                                    <a
                                        href={`mailto:${lead.email}`}
                                        className="text-sm font-medium hover:text-primary"
                                    >
                                        {lead.email}
                                    </a>
                                </div>

                                {lead.phone && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                            <span>Phone</span>
                                        </div>
                                        <a
                                            href={`tel:${lead.phone}`}
                                            className="text-sm font-medium hover:text-primary"
                                        >
                                            {lead.phone}
                                        </a>
                                    </div>
                                )}

                                {lead.companyName && (
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Building2 className="h-4 w-4" />
                                                <span>Company</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                onClick={handleEnrichLead}
                                                disabled={aiLoading}
                                                title="Find company details with AI"
                                            >
                                                <Sparkles className="h-3 w-3 mr-1" />
                                                Enrich
                                            </Button>
                                        </div>
                                        <p className="text-sm font-medium">{lead.companyName}</p>
                                    </div>
                                )}

                                {lead.jobTitle && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Briefcase className="h-4 w-4" />
                                            <span>Job Title</span>
                                        </div>
                                        <p className="text-sm font-medium">{lead.jobTitle}</p>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Tag className="h-4 w-4" />
                                        <span>Source</span>
                                    </div>
                                    <p className="text-sm font-medium">{lead.source}</p>
                                </div>

                                {lead.value && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <DollarSign className="h-4 w-4" />
                                            <span>Estimated Value</span>
                                        </div>
                                        <p className="text-sm font-medium">
                                            {canViewFinancials ? `$${lead.value.toLocaleString()}` : "$•••"}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Created</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {format(lead.createdAt.toDate(), "MMM d, yyyy 'at' h:mm a")}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Last Updated</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {format(lead.updatedAt.toDate(), "MMM d, yyyy 'at' h:mm a")}
                                    </p>
                                </div>
                            </div>

                            {lead.notes && (
                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium mb-2">Notes</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {lead.notes}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Activity Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Timeline</CardTitle>
                            <CardDescription>
                                Track all interactions with this lead
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActivityTimeline
                                entityCollection="leads"
                                entityId={id}
                                activities={activities}
                                onActivityAdded={fetchLeadData}
                                canEdit={canEdit}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                disabled={!canEdit || !lead.email}
                                onClick={handleEmail}
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                            </Button>
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                disabled={!canEdit || !lead.phone}
                                onClick={handleCall}
                            >
                                <Phone className="h-4 w-4 mr-2" />
                                Make Call
                            </Button>
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                disabled={!canEdit || !!lead.convertedToContactId || isConverting}
                                onClick={handleConvert}
                            >
                                <Briefcase className="h-4 w-4 mr-2" />
                                {lead.convertedToContactId ? "Converted to Contact" : "Convert to Contact"}
                            </Button>

                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                disabled={!canEdit || !!lead.convertedToDealId || isConverting}
                                onClick={handleConvertToDeal}
                            >
                                <DollarSign className="h-4 w-4 mr-2" />
                                {lead.convertedToDealId ? "Converted to Deal" : "Convert to Deal"}
                            </Button>

                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                disabled={!canEdit || !!lead.convertedToProjectId || isConverting}
                                onClick={handleConvertToProject}
                            >
                                <Building2 className="h-4 w-4 mr-2" />
                                {lead.convertedToProjectId ? "Converted to Project" : "Convert to Project"}
                            </Button>

                            {/* Links for already converted items */}
                            {lead.convertedToContactId && (
                                <Link href={`/contacts/${lead.convertedToContactId}`} className="w-full">
                                    <Button className="w-full justify-start" variant="ghost" size="sm">
                                        View Contact →
                                    </Button>
                                </Link>
                            )}
                            {lead.convertedToDealId && (
                                <Link href={`/deals/${lead.convertedToDealId}`} className="w-full">
                                    <Button className="w-full justify-start" variant="ghost" size="sm">
                                        View Deal →
                                    </Button>
                                </Link>
                            )}
                            {lead.convertedToProjectId && (
                                <Link href={`/projects/${lead.convertedToProjectId}`} className="w-full">
                                    <Button className="w-full justify-start" variant="ghost" size="sm">
                                        View Project →
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Related Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {relatedTasks.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground mb-2">Tasks ({relatedTasks.length})</p>
                                    {relatedTasks.slice(0, 3).map((task) => (
                                        <div key={task.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${task.status === "Done" ? "bg-green-500" :
                                                    task.status === "In Progress" ? "bg-blue-500" :
                                                        task.priority === "Urgent" ? "bg-red-500" : "bg-gray-400"
                                                    }`} />
                                                <div className="text-sm">
                                                    <p className="font-medium">{task.title}</p>
                                                    <p className="text-xs text-muted-foreground">{task.status}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-sm text-muted-foreground">
                                    No related items yet
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex justify-start">
                <Link href="/leads">
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Leads
                    </Button>
                </Link>
            </div>

            {/* Email Modal */}
            {lead && (
                <EmailComposeModal
                    isOpen={isEmailOpen}
                    onClose={() => setIsEmailOpen(false)}
                    initialRecipients={[{
                        email: lead.email,
                        name: `${lead.firstName} ${lead.lastName}`,
                        isValid: true
                    }]}
                    context={{
                        type: "lead",
                        relatedRecordId: lead.id,
                        relatedRecordName: `${lead.firstName} ${lead.lastName}`,
                        to: [{
                            email: lead.email,
                            name: `${lead.firstName} ${lead.lastName}`,
                            isValid: true
                        }]
                    }}
                />
            )}

            {/* Edit Lead Dialog */}
            {lead && (
                <EditLeadDialog
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    lead={lead}
                    onSuccess={fetchLeadData}
                />
            )}
        </div>
    );
}
