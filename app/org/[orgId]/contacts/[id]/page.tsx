"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import { CreateDealDialog } from "@/components/deals/CreateDealDialog";
import { getContact, deleteContact } from "@/lib/firestore/contacts";
import { toJsDate } from "@/lib/utils";
import { createLead } from "@/lib/firestore/leads";
import { useOrgStore } from "@/store/org";
import { useAuthStore } from "@/store/auth";
import { usePermission } from "@/hooks/usePermission";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Contact } from "@/types/crm";
import {
    Mail, Phone, Building2, Briefcase, Calendar, ArrowLeft, Pencil, Trash2,
    User, Clock, TrendingUp, Handshake,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { RBACGuard } from "@/components/auth/RBACGuard";

export default function ContactDetailPage() {
    return (
        <RBACGuard requirePermission={{ module: "contacts", action: "read" }}>
            <ContactDetailPageContent />
        </RBACGuard>
    );
}

function ContactDetailPageContent() {
    const params = useParams<{ orgId: string; id: string }>();
    const { orgId, id } = params;
    const router = useRouter();
    const { currentMember } = useOrgStore();
    const { user } = useAuthStore();
    const { can, canEditAll, canDelete: hasDeletePermission } = usePermission();
    const base = `/org/${orgId}`;

    const [contact, setContact] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [convertingToLead, setConvertingToLead] = useState(false);
    const { confirm, ConfirmDialog } = useConfirm();
    const [createDealOpen, setCreateDealOpen] = useState(false);

    const canEdit =
        canEditAll("contacts") ||
        (contact?.ownerId === currentMember?.userId && can("contacts", "edit"));
    const canDelete = hasDeletePermission("contacts");

    useEffect(() => {
        const fetchContact = async () => {
            setLoading(true);
            const { contact: fetched, error } = await getContact(id);
            if (error || !fetched) {
                setNotFound(true);
            } else {
                setContact(fetched);
            }
            setLoading(false);
        };
        fetchContact();
    }, [id]);

    const handleDelete = async () => {
        if (!contact) return;
        if (!(await confirm({ title: "Delete Contact", message: "Delete this contact? This action cannot be undone.", confirmLabel: "Delete", destructive: true }))) return;
        setDeleting(true);
        const { error } = await deleteContact(contact.id, user!.uid);
        if (error) {
            toast.error("Failed to delete contact");
            setDeleting(false);
        } else {
            toast.success("Contact deleted");
            router.replace(`${base}/contacts`);
        }
    };

    const handleConvertToLead = async () => {
        if (!contact || !user) return;
        if (!(await confirm({ title: "Convert to Lead", message: "Convert this contact to a lead? A new lead will be created with this contact's details.", confirmLabel: "Convert", destructive: false }))) return;
        setConvertingToLead(true);
        const { success, id: leadId, error } = await createLead(
            {
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                companyName: contact.companyName,
                jobTitle: contact.jobTitle,
                notes: contact.notes,
                source: "Other",
                status: "New",
                tags: [],
            },
            user.uid,
            orgId
        );
        if (!success) {
            toast.error(error || "Failed to create lead");
        } else {
            toast.success("Contact converted to lead");
            router.push(`${base}/leads/${leadId}`);
        }
        setConvertingToLead(false);
    };

    const handleEditSuccess = async () => {
        setEditOpen(false);
        const { contact: refreshed } = await getContact(id);
        if (refreshed) setContact(refreshed);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (notFound || !contact) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <User className="h-16 w-16 text-muted-foreground/40" />
                <h2 className="text-xl font-semibold">Contact not found</h2>
                <p className="text-muted-foreground text-sm">
                    This contact may have been deleted or does not exist.
                </p>
                <Button variant="outline" onClick={() => router.push(`${base}/contacts`)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Contacts
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${contact.firstName} ${contact.lastName}`}
                breadcrumbs={[
                    { label: "Dashboard", href: `${base}/dashboard` },
                    { label: "Contacts", href: `${base}/contacts` },
                    { label: `${contact.firstName} ${contact.lastName}` },
                ]}
                description={contact.jobTitle || contact.companyName || "Contact details"}
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

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <InfoRow
                                icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                                label="Email"
                                value={
                                    <a
                                        href={`mailto:${contact.email}`}
                                        className="text-primary hover:underline"
                                    >
                                        {contact.email}
                                    </a>
                                }
                            />
                            <InfoRow
                                icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                                label="Phone"
                                value={
                                    contact.phone ? (
                                        <a
                                            href={`tel:${contact.phone}`}
                                            className="text-primary hover:underline"
                                        >
                                            {contact.phone}
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )
                                }
                            />
                            <InfoRow
                                icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
                                label="Company"
                                value={contact.companyName || <span className="text-muted-foreground">—</span>}
                            />
                            <InfoRow
                                icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
                                label="Job Title"
                                value={contact.jobTitle || <span className="text-muted-foreground">—</span>}
                            />
                            <InfoRow
                                icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                                label="Last Contacted"
                                value={
                                    contact.lastContactedAt
                                        ? format(contact.lastContactedAt.toDate(), "MMM d, yyyy")
                                        : <span className="text-muted-foreground">—</span>
                                }
                            />
                        </CardContent>
                    </Card>

                    {contact.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {contact.notes}
                                </p>
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
                                <span>{(() => { const d = toJsDate(contact.createdAt); return d ? format(d, "MMM d, yyyy") : "-"; })()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    Updated
                                </span>
                                <span>{(() => { const d = toJsDate(contact.updatedAt); return d ? format(d, "MMM d, yyyy") : "-"; })()}</span>
                            </div>
                            {contact.ownerName && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Owner</span>
                                    <span>{contact.ownerName}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <a href={`mailto:${contact.email}`} className="block">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <Mail className="h-4 w-4" />
                                    Send Email
                                </Button>
                            </a>
                            {contact.phone && (
                                <a href={`tel:${contact.phone}`} className="block">
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <Phone className="h-4 w-4" />
                                        Call
                                    </Button>
                                </a>
                            )}
                            {canEdit && (
                                <>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-2"
                                        onClick={() => setCreateDealOpen(true)}
                                    >
                                        <Handshake className="h-4 w-4" />
                                        Create Deal
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-2"
                                        onClick={handleConvertToLead}
                                        disabled={convertingToLead}
                                    >
                                        {convertingToLead ? <LoadingSpinner size="sm" /> : <TrendingUp className="h-4 w-4" />}
                                        Convert to Lead
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`${base}/contacts`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Contacts
                    </Button>
                </div>
            </div>

            {contact && (
                <>
                    <EditContactDialog
                        open={editOpen}
                        onOpenChange={setEditOpen}
                        contact={contact}
                        onSuccess={handleEditSuccess}
                    />
                    <CreateDealDialog
                        open={createDealOpen}
                        onOpenChange={setCreateDealOpen}
                        defaultCompanyId={contact?.companyId ?? undefined}
                    />
                    <ConfirmDialog />
                </>
            )}
        </div>
    );
}

function InfoRow({
    icon,
    label,
    value,
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
