"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getContact, deleteContact } from "@/lib/firestore/contacts";
import { getActivities, type Activity } from "@/lib/firestore/activities";
import { getDeals } from "@/lib/firestore/deals";
import { getTasks } from "@/lib/firestore/tasks";

import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { EmailComposeModal } from "@/components/email/EmailComposeModal";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import type { Contact } from "@/types/crm";
import {
    ArrowLeft,
    Mail,
    Phone,
    Building2,
    Briefcase,
    Calendar,
    MapPin,
    Trash2,
    Pencil,
    Shield,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

export default function ContactDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [contact, setContact] = useState<Contact | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [relatedDeals, setRelatedDeals] = useState<any[]>([]);
    const [relatedTasks, setRelatedTasks] = useState<any[]>([]);

    // Role-based access control
    const canEdit = user?.role === "admin" || user?.role === "manager" || contact?.ownerId === user?.uid;
    const canDelete = user?.role === "admin" || user?.role === "manager";
    const canViewFinancials = user?.role === "admin" || user?.role === "manager";

    useEffect(() => {
        fetchContactData();
    }, [id]);

    const fetchContactData = async () => {
        setLoading(true);

        // Note: We'll assume getContact and deleteContact are available in lib/firestore/contacts
        // If not, we might need to verify or create them.
        // Assuming typical pattern:
        try {
            // Parallel fetch
            const [contactResult, activitiesResult, dealsResult, tasksResult] = await Promise.all([
                getContact(id),
                getActivities("contacts", id),
                getDeals({ search: id }).catch(() => ({ deals: [], error: null })),
                getTasks({ contactId: id }).catch(() => ({ tasks: [], error: null })),
            ]);

            if (contactResult.error) {
                toast.error(contactResult.error);
                router.push("/contacts");
            } else {
                setContact(contactResult.contact);
            }

            if (!activitiesResult.error) {
                setActivities(activitiesResult.activities);
            }

            if (!dealsResult.error && dealsResult.deals) {
                // Filter deals that have this contact in their contactIds array
                const contactDeals = dealsResult.deals.filter((deal: any) =>
                    deal.contactIds?.includes(id)
                );
                setRelatedDeals(contactDeals);
            }

            if (!tasksResult.error && tasksResult.tasks) {
                setRelatedTasks(tasksResult.tasks);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load contact data");
        }

        setLoading(false);
    };

    const handleDelete = async () => {
        if (!canDelete) {
            toast.error("You don't have permission to delete this contact");
            return;
        }

        if (!confirm("Are you sure you want to delete this contact? This action cannot be undone.")) {
            return;
        }

        const { success, error } = await deleteContact(id);

        if (success) {
            toast.success("Contact deleted successfully");
            router.push("/contacts");
        } else {
            toast.error(error || "Failed to delete contact");
        }
    };

    const handleCall = () => {
        if (!contact?.phone) {
            toast.error("No phone number available");
            return;
        }
        window.location.href = `tel:${contact.phone}`;
    };

    const handleCreateProject = async () => {
        if (!contact || !canEdit) return;

        if (!confirm(`Initialize a Project for "${contact.firstName} ${contact.lastName}"?`)) return;

        const toastId = toast.loading("Initializing Project...");

        try {
            const { createProject } = await import("@/lib/firestore/projects");
            const { Timestamp } = await import("firebase/firestore");

            const projectData = {
                name: `Project for ${contact.firstName} ${contact.lastName}`,
                description: `Created for contact: ${contact.firstName} ${contact.lastName}`,
                status: "Planning" as const,
                priority: "Medium" as const,
                budget: 0,
                startDate: Timestamp.now(),
                clientId: contact.id, // Link to this contact
                companyName: contact.companyName || undefined,
                tags: [],
                teamMembers: [user?.uid || ""],
                progress: 0,
            };

            const { success, id: projectId, error } = await createProject(projectData, user?.uid || "");

            if (success && projectId) {
                // Log activity
                const { createActivity } = await import("@/lib/firestore/activities");
                await createActivity({
                    type: "created",
                    content: `Project created for contact by ${user?.displayName || "User"}`,
                    performedBy: user?.uid || "",
                    performedByName: user?.displayName || "User",
                    relatedTo: { collection: "contacts", id: contact.id },
                    metadata: { projectId, action: "create_project" }
                });

                toast.success("Project initialized successfully!", { id: toastId });
                router.push(`/projects/${projectId}`);
            } else {
                toast.error(error || "Failed to create project", { id: toastId });
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "An error occurred", { id: toastId });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!contact) {
        return null; // Or a NotFound component
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${contact.firstName} ${contact.lastName}`}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Contacts", href: "/contacts" },
                    { label: `${contact.firstName} ${contact.lastName}` },
                ]}
                action={
                    <div className="flex gap-2">
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span>Email</span>
                                    </div>
                                    <a
                                        href={`mailto:${contact.email}`}
                                        className="text-sm font-medium hover:text-primary"
                                    >
                                        {contact.email}
                                    </a>
                                </div>

                                {contact.phone && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                            <span>Phone</span>
                                        </div>
                                        <a
                                            href={`tel:${contact.phone}`}
                                            className="text-sm font-medium hover:text-primary"
                                        >
                                            {contact.phone}
                                        </a>
                                    </div>
                                )}

                                {contact.companyName && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Building2 className="h-4 w-4" />
                                            <span>Company</span>
                                        </div>
                                        <p className="text-sm font-medium">{contact.companyName}</p>
                                    </div>
                                )}

                                {contact.jobTitle && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Briefcase className="h-4 w-4" />
                                            <span>Job Title</span>
                                        </div>
                                        <p className="text-sm font-medium">{contact.jobTitle}</p>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Created</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {format(contact.createdAt.toDate(), "MMM d, yyyy 'at' h:mm a")}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Last Updated</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {format(contact.updatedAt.toDate(), "MMM d, yyyy 'at' h:mm a")}
                                    </p>
                                </div>
                            </div>

                            {contact.notes && (
                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium mb-2">Notes</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {contact.notes}
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
                                Track all interactions with this contact
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActivityTimeline
                                entityCollection="contacts"
                                entityId={id}
                                activities={activities}
                                onActivityAdded={fetchContactData}
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
                                onClick={() => setEmailModalOpen(true)}
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                            </Button>
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                disabled={!canEdit || !contact.phone}
                                onClick={handleCall}
                            >
                                <Phone className="h-4 w-4 mr-2" />
                                Make Call
                            </Button>
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                disabled={!canEdit}
                                onClick={handleCreateProject}
                            >
                                <Briefcase className="h-4 w-4 mr-2" />
                                New Project
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Related Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {relatedDeals.length > 0 || relatedTasks.length > 0 ? (
                                <div className="space-y-4">
                                    {relatedDeals.length > 0 && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">Deals ({relatedDeals.length})</p>
                                            <div className="space-y-2">
                                                {relatedDeals.slice(0, 3).map((deal) => (
                                                    <div key={deal.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">{deal.title}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {canViewFinancials ? `$${deal.value?.toLocaleString()}` : "$•••"} • {deal.stage}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {relatedTasks.length > 0 && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">Tasks ({relatedTasks.length})</p>
                                            <div className="space-y-2">
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
                                        </div>
                                    )}
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
                <Link href="/contacts">
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Contacts
                    </Button>
                </Link>
            </div>

            {/* Edit Contact Dialog */}
            {contact && (
                <EditContactDialog
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    contact={contact}
                    onSuccess={fetchContactData}
                />
            )}

            {/* Email Compose Modal */}
            <EmailComposeModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                context={{
                    type: "contact",
                    relatedRecordId: contact.id,
                    relatedRecordName: `${contact.firstName} ${contact.lastName}`,
                    contactId: contact.id,
                    to: [{
                        email: contact.email,
                        name: `${contact.firstName} ${contact.lastName}`,
                        contactId: contact.id,
                        isValid: true,
                    }],
                }}
            />
        </div>
    );
}
