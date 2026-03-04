"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getCompany, deleteCompany } from "@/lib/firestore/companies";
import { getActivities, type Activity } from "@/lib/firestore/activities";
import { getContacts } from "@/lib/firestore/contacts";
import { getDeals } from "@/lib/firestore/deals";

import { EmailComposeModal } from "@/components/email/EmailComposeModal";
import { EditCompanyDialog } from "@/components/companies/EditCompanyDialog";
import { CreateDealDialog } from "@/components/deals/CreateDealDialog";
import type { Company } from "@/types/crm";
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
    Globe,
    Users,
    DollarSign,
    Target
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";

export default function CompanyDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [company, setCompany] = useState<Company | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [dealModalOpen, setDealModalOpen] = useState(false);
    const [relatedContacts, setRelatedContacts] = useState<any[]>([]);
    const [relatedDeals, setRelatedDeals] = useState<any[]>([]);

    // Role-based access control
    const canEdit = user?.role === "admin" || user?.role === "manager" || company?.ownerId === user?.uid;
    const canDelete = user?.role === "admin" || user?.role === "manager";
    const canViewFinancials = user?.role === "admin" || user?.role === "manager";

    useEffect(() => {
        fetchCompanyData();
    }, [id]);

    const handleCall = () => {
        if (!company?.phone) {
            toast.error("No phone number available");
            return;
        }
        window.location.href = `tel:${company.phone}`;
    };

    const fetchCompanyData = async () => {
        setLoading(true);

        try {
            const [companyResult, activitiesResult, contactsResult, dealsResult] = await Promise.all([
                getCompany(id),
                getActivities("companies", id),
                getContacts({ search: id }).catch(() => ({ contacts: [], error: null })),
                getDeals({ companyId: id }).catch(() => ({ deals: [], error: null })),
            ]);

            if (companyResult.error) {
                toast.error(companyResult.error);
                router.push("/companies");
            } else {
                setCompany(companyResult.company);
            }

            if (!activitiesResult.error) {
                setActivities(activitiesResult.activities);
            }

            if (!contactsResult.error && contactsResult.contacts) {
                // Filter contacts that belong to this company
                const companyContacts = contactsResult.contacts.filter((contact: any) =>
                    contact.companyName === companyResult.company?.name
                );
                setRelatedContacts(companyContacts);
            }

            if (!dealsResult.error && dealsResult.deals) {
                setRelatedDeals(dealsResult.deals);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load company data");
        }

        setLoading(false);
    };

    const handleCreateProject = async () => {
        if (!company || !canEdit) return;

        if (!confirm(`Initialize a Project for "${company.name}"?`)) return;

        const toastId = toast.loading("Initializing Project...");

        try {
            const { createProject } = await import("@/lib/firestore/projects");
            const { Timestamp } = await import("firebase/firestore");

            const projectData = {
                name: `Project for ${company.name}`,
                description: `Created for company: ${company.name}`,
                status: "Planning" as const,
                priority: "Medium" as const,
                budget: 0,
                startDate: Timestamp.now(),
                clientId: "", // No specific contact linked initially
                companyId: company.id,
                companyName: company.name,
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
                    content: `Project created for company by ${user?.displayName || "User"}`,
                    performedBy: user?.uid || "",
                    performedByName: user?.displayName || "User",
                    relatedTo: { collection: "companies", id: company.id },
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

    const handleDelete = async () => {
        if (!canDelete) {
            toast.error("You don't have permission to delete this company");
            return;
        }

        if (!confirm("Are you sure you want to delete this company? All associated contacts and deals may be affected.")) {
            return;
        }

        const { success, error } = await deleteCompany(id);

        if (success) {
            toast.success("Company deleted successfully");
            router.push("/companies");
        } else {
            toast.error(error || "Failed to delete company");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!company) {
        return null;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={company.name}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Companies", href: "/companies" },
                    { label: company.name },
                ]}
                action={
                    <div className="flex gap-2">
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
                            <CardTitle>Company Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {company.industry && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Building2 className="h-4 w-4" />
                                            <span>Industry</span>
                                        </div>
                                        <p className="text-sm font-medium">{company.industry}</p>
                                    </div>
                                )}

                                {company.domain && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Globe className="h-4 w-4" />
                                            <span>Website</span>
                                        </div>
                                        <a
                                            href={company.domain.startsWith('http') ? company.domain : `https://${company.domain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium hover:text-primary hover:underline"
                                        >
                                            {company.domain}
                                        </a>
                                    </div>
                                )}

                                {company.size && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span>Size</span>
                                        </div>
                                        <p className="text-sm font-medium">{company.size} employees</p>
                                    </div>
                                )}

                                {company.annualRevenue && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <DollarSign className="h-4 w-4" />
                                            <span>Annual Revenue</span>
                                        </div>
                                        <p className="text-sm font-medium">
                                            {canViewFinancials ? `$${company.annualRevenue.toLocaleString()}` : "$•••"}
                                        </p>
                                    </div>
                                )}

                                {company.phone && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                            <span>Phone</span>
                                        </div>
                                        <a
                                            href={`tel:${company.phone}`}
                                            className="text-sm font-medium hover:text-primary"
                                        >
                                            {company.phone}
                                        </a>
                                    </div>
                                )}

                                {company.billingAddress && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            <span>Address</span>
                                        </div>
                                        <p className="text-sm font-medium">
                                            {company.billingAddress.street}, {company.billingAddress.city}, {company.billingAddress.state} {company.billingAddress.zipCode}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Created</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {format(company.createdAt.toDate(), "MMM d, yyyy 'at' h:mm a")}
                                    </p>
                                </div>
                            </div>

                            {company.description && (
                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium mb-2">Description</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {company.description}
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
                                Track all interactions with this company
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActivityTimeline
                                entityCollection="companies"
                                entityId={id}
                                activities={activities}
                                onActivityAdded={fetchCompanyData}
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
                                disabled={!canEdit}
                                onClick={() => setEmailModalOpen(true)}
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Email Company
                            </Button>
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                disabled={!canEdit || !company.phone}
                                onClick={handleCall}
                            >
                                <Phone className="h-4 w-4 mr-2" />
                                Call Company
                            </Button>
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                disabled={!canEdit}
                                onClick={() => setDealModalOpen(true)}
                            >
                                <Target className="h-4 w-4 mr-2" />
                                New Deal
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
                            {relatedContacts.length > 0 || relatedDeals.length > 0 ? (
                                <div className="space-y-4">
                                    {relatedContacts.length > 0 && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">Contacts ({relatedContacts.length})</p>
                                            <div className="space-y-2">
                                                {relatedContacts.slice(0, 3).map((contact) => (
                                                    <div key={contact.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">
                                                                {contact.firstName} {contact.lastName}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">{contact.email}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
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
                <Link href="/companies">
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Companies
                    </Button>
                </Link>
            </div>

            {/* Email Compose Modal */}
            <EmailComposeModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                context={{
                    type: "company",
                    relatedRecordId: company.id,
                    relatedRecordName: company.name,
                    companyId: company.id,
                }}
            />

            {/* Edit Company Dialog */}
            <EditCompanyDialog
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                company={company}
                onSuccess={fetchCompanyData}
            />

            {/* Create Deal Dialog */}
            <CreateDealDialog
                open={dealModalOpen}
                onOpenChange={setDealModalOpen}
                defaultCompanyId={company.id}
                onSuccess={() => {
                    fetchCompanyData();
                    // Optionally refresh activities or deals list if displayed
                }}
            />
        </div>
    );
}
