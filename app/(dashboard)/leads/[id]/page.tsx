"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getLead, deleteLead } from "@/lib/firestore/leads";
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
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

export default function LeadDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    // Unwrap the params Promise
    const { id } = use(params);

    const router = useRouter();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLead = async () => {
            const { lead: fetchedLead, error } = await getLead(id);

            if (error) {
                toast.error(error);
                router.push("/leads");
            } else {
                setLead(fetchedLead);
            }

            setLoading(false);
        };

        fetchLead();
    }, [id, router]);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this lead?")) return;

        const { success, error } = await deleteLead(id);

        if (success) {
            toast.success("Lead deleted successfully");
            router.push("/leads");
        } else {
            toast.error(error || "Failed to delete lead");
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
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDelete}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                }
            />

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Lead Information</CardTitle>
                                <LeadStatusBadge status={lead.status} />
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
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Building2 className="h-4 w-4" />
                                            <span>Company</span>
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
                                            ${lead.value.toLocaleString()}
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

                    {/* Activity Timeline Placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Timeline</CardTitle>
                            <CardDescription>
                                Track all interactions with this lead
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-sm">Activity timeline coming soon...</p>
                            </div>
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
                            <Button className="w-full justify-start" variant="outline">
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                            </Button>
                            <Button className="w-full justify-start" variant="outline">
                                <Phone className="h-4 w-4 mr-2" />
                                Make Call
                            </Button>
                            <Button className="w-full justify-start" variant="outline">
                                <Briefcase className="h-4 w-4 mr-2" />
                                Convert to Contact
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Related Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-4 text-sm text-muted-foreground">
                                No related items yet
                            </div>
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
        </div>
    );
}
