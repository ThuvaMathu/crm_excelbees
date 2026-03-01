"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getDeal, deleteDeal, updateDealStage, updateDeal } from "@/lib/firestore/deals";
import { getActivities, type Activity } from "@/lib/firestore/activities";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { EmailComposeModal } from "@/components/email/EmailComposeModal";
import { EditDealDialog } from "@/components/deals/EditDealDialog";
import type { Deal, DealStage } from "@/types/crm";
import {
    ArrowLeft,
    Trash2,
    Archive,
    Pencil,
    Shield,
    DollarSign,
    Percent,
    Building2,
    Briefcase,
    Calendar,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    Mail,
    UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

const STAGES: DealStage[] = [
    "Pipeline",
    "Follow Up",
    "Schedule Service",
    "Conversation",
    "Won",
    "Lost",
];

export default function DealDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [deal, setDeal] = useState<Deal | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingStage, setUpdatingStage] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [linkContactOpen, setLinkContactOpen] = useState(false);
    const [availableContacts, setAvailableContacts] = useState<any[]>([]);

    // Role-based access control
    const canEdit = user?.role === "admin" || user?.role === "manager" || deal?.ownerId === user?.uid;
    const canDelete = user?.role === "admin" || user?.role === "manager";
    const canViewFinancials = user?.role === "admin" || user?.role === "manager";

    useEffect(() => {
        fetchDealData();
    }, [id]);

    const fetchAvailableContacts = async () => {
        const { getContacts } = await import("@/lib/firestore/contacts");
        const result = await getContacts();
        if (!result.error && result.contacts) {
            // Filter out already linked contacts
            const available = result.contacts.filter(
                (c: any) => !deal?.contactIds?.includes(c.id)
            );
            setAvailableContacts(available);
        }
    };

    const handleLinkContact = async (contactId: string) => {
        if (!deal) return;
        const updatedContactIds = [...(deal.contactIds || []), contactId];
        const { success, error } = await updateDeal(deal.id, { contactIds: updatedContactIds });
        if (success) {
            toast.success("Contact linked successfully");
            setDeal({ ...deal, contactIds: updatedContactIds });
            setLinkContactOpen(false);
            fetchAvailableContacts();
        } else {
            toast.error(error || "Failed to link contact");
        }
    };

    const handleUnlinkContact = async (contactId: string) => {
        if (!deal) return;
        const updatedContactIds = (deal.contactIds || []).filter((id) => id !== contactId);
        const { success, error } = await updateDeal(deal.id, { contactIds: updatedContactIds });
        if (success) {
            toast.success("Contact unlinked successfully");
            setDeal({ ...deal, contactIds: updatedContactIds });
            fetchAvailableContacts();
        } else {
            toast.error(error || "Failed to unlink contact");
        }
    };

    const fetchDealData = async () => {
        setLoading(true);

        try {
            const [dealResult, activitiesResult] = await Promise.all([
                getDeal(id),
                getActivities("deals", id),
            ]);

            if (dealResult.error) {
                toast.error(dealResult.error);
                router.push("/deals");
            } else {
                setDeal(dealResult.deal);
            }

            if (!activitiesResult.error) {
                setActivities(activitiesResult.activities);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load deal data");
        }

        setLoading(false);
    };

    const handleStageChange = async (newStage: DealStage) => {
        if (!deal || !canEdit || updatingStage) return;

        setUpdatingStage(true);
        const { success, error } = await updateDealStage(id, newStage);

        if (success) {
            toast.success(`Deal moved to ${newStage}`);
            setDeal({ ...deal, stage: newStage });
        } else {
            toast.error(error || "Failed to update stage");
        }
        setUpdatingStage(false);
    };

    const handleDelete = async () => {
        if (!canDelete) {
            toast.error("You don't have permission to delete this deal");
            return;
        }

        if (!confirm("Are you sure you want to delete this deal? This action cannot be undone.")) {
            return;
        }

        const { success, error } = await deleteDeal(id);

        if (success) {
            toast.success("Deal deleted successfully");
            router.push("/deals");
        } else {
            toast.error(error || "Failed to delete deal");
        }
    }


    const handleArchive = async () => {
        if (!canEdit) return;
        if (!confirm("Are you sure you want to archive this deal?")) return;

        const { archiveDeal } = await import("@/lib/firestore/deals");
        const { success, error } = await archiveDeal(id);

        if (success) {
            toast.success("Deal archived successfully");
            fetchDealData();
        } else {
            toast.error(error || "Failed to archive deal");
        }
    };

    const handleUnarchive = async () => {
        if (!canEdit) return;

        const { unarchiveDeal } = await import("@/lib/firestore/deals");
        const { success, error } = await unarchiveDeal(id);

        if (success) {
            toast.success("Deal unarchived successfully");
            fetchDealData();
        } else {
            toast.error(error || "Failed to unarchive deal");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!deal) {
        return null;
    }

    const currentStageIndex = STAGES.indexOf(deal.stage);

    const handleCreateProject = async () => {
        if (!deal || !user || !canEdit) return;

        if (!confirm(`Initialize a Project for "${deal.title}"?\n\nThis will create a new project with details from this deal.`)) return;

        setUpdatingStage(true); // Re-use loading state
        const toastId = toast.loading("Initializing Project...");

        try {
            const { createProjectFromDeal } = await import("@/lib/firestore/deals");
            const { success, projectId, error } = await createProjectFromDeal(
                deal.id,
                user.uid,
                user.displayName || user.email || "Unknown"
            );

            if (success && projectId) {
                toast.success("Project initialized successfully!", { id: toastId });
                router.push(`/projects/${projectId}`);
            } else {
                toast.error(error || "Failed to create project", { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred", { id: toastId });
        } finally {
            setUpdatingStage(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={deal.title}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Deals", href: "/deals" },
                    { label: deal.title },
                ]}
                action={
                    <div className="flex gap-2">
                        {canEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCreateProject}
                            >
                                <Briefcase className="h-4 w-4 mr-2" />
                                Create Project
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEmailModalOpen(true)}
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                        </Button>
                        {canEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditModalOpen(true)}
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
                        {canEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={deal.archived ? handleUnarchive : handleArchive}
                            >
                                <Archive className="h-4 w-4 mr-2" />
                                {deal.archived ? "Unarchive" : "Archive"}
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

            {/* Pipeline Visualizer */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-secondary -translate-y-1/2 hidden md:block" />
                        <div className="flex flex-col md:flex-row justify-between relative z-10 gap-4 md:gap-0">
                            {STAGES.map((stage, index) => {
                                const isActive = stage === deal.stage;
                                const isCompleted = index < currentStageIndex;
                                const isLost = deal.stage === "Lost";

                                // Better visualization logic
                                const statusColor =
                                    isActive ? (stage === "Lost" ? "bg-destructive text-destructive-foreground" : (stage === "Won" ? "bg-green-600 text-white" : "bg-primary text-primary-foreground")) :
                                        isCompleted ? "bg-primary/20 text-primary border-primary/20" :
                                            "bg-secondary text-muted-foreground border-border";

                                return (
                                    <button
                                        key={stage}
                                        disabled={!canEdit || updatingStage}
                                        onClick={() => handleStageChange(stage)}
                                        className={`flex flex-col items-center group transition-all ${!canEdit ? 'cursor-default' : 'hover:scale-105'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors z-10 ${statusColor}`}>
                                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> :
                                                isActive && stage === "Lost" ? <XCircle className="w-5 h-5" /> :
                                                    isActive && stage === "Won" ? <CheckCircle2 className="w-5 h-5" /> :
                                                        <div className="w-3 h-3 rounded-full bg-current" />}
                                        </div>
                                        <span className={`text-xs font-medium mt-2 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                                            {stage}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Deal Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <DollarSign className="h-4 w-4" />
                                        <span>Value</span>
                                    </div>
                                    <p className="text-2xl font-bold">
                                        {canViewFinancials ? `$${deal.value.toLocaleString()}` : "$•••"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Percent className="h-4 w-4" />
                                        <span>Probability</span>
                                    </div>
                                    <p className="text-2xl font-bold">
                                        {deal.probability}%
                                    </p>
                                </div>
                                {deal.companyName && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Building2 className="h-4 w-4" />
                                            <span>Company</span>
                                        </div>
                                        <Link href={`/companies/${deal.companyId}`} className="text-lg font-medium hover:text-primary hover:underline block truncate">
                                            {deal.companyName}
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Created</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {format(deal.createdAt.toDate(), "MMM d, yyyy")}
                                    </p>
                                </div>
                                {deal.closeDate && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>Expected Close</span>
                                        </div>
                                        <p className="text-sm font-medium">
                                            {format(deal.closeDate.toDate(), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {deal.description && (
                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium mb-2">Description</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {deal.description}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Activity Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle>History</CardTitle>
                            <CardDescription>
                                Track stage changes and notes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActivityTimeline
                                entityCollection="deals"
                                entityId={id}
                                activities={activities}
                                onActivityAdded={fetchDealData}
                                canEdit={canEdit}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base">Contacts</CardTitle>
                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => {
                                        fetchAvailableContacts();
                                        setLinkContactOpen(true);
                                    }}
                                >
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Add
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {deal.contactIds?.length > 0 ? (
                                <div className="space-y-2">
                                    {deal.contactIds.map(contactId => (
                                        <div key={contactId} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 group">
                                            <div className="text-sm font-medium">Contact ID: {contactId.substring(0, 8)}...</div>
                                            <div className="flex items-center gap-1">
                                                <Link href={`/contacts/${contactId}`}>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6">
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {canEdit && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 text-destructive hover:text-destructive"
                                                        onClick={() => handleUnlinkContact(contactId)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-sm text-muted-foreground">
                                    No contacts linked
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Link Contact Dialog */}
                    {linkContactOpen && (
                        <Card className="absolute top-0 right-0 w-full z-50 shadow-lg">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Link Contact</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {availableContacts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-2">No contacts available</p>
                                ) : (
                                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                        {availableContacts.map((contact) => (
                                            <button
                                                key={contact.id}
                                                onClick={() => handleLinkContact(contact.id)}
                                                className="w-full text-left p-2 hover:bg-muted rounded flex items-center justify-between"
                                            >
                                                <span className="text-sm">{contact.firstName} {contact.lastName}</span>
                                                <span className="text-xs text-muted-foreground">{contact.email}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={() => setLinkContactOpen(false)}
                                >
                                    Cancel
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <div className="flex justify-start">
                <Link href="/deals">
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Deals
                    </Button>
                </Link>
            </div>

            {/* Email Compose Modal */}
            <EmailComposeModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                context={{
                    type: "deal",
                    relatedRecordId: deal.id,
                    relatedRecordName: deal.title,
                    dealId: deal.id,
                }}
            />

            {/* Edit Deal Dialog */}
            {deal && (
                <EditDealDialog
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    deal={deal}
                    onSuccess={fetchDealData}
                />
            )}
        </div>
    );
}
