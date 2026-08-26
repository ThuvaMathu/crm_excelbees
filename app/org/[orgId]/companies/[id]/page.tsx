"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EditCompanyDialog } from "@/components/companies/EditCompanyDialog";
import { getCompany, deleteCompany, getCompanyContacts } from "@/lib/firestore/companies";
import { toJsDate } from "@/lib/utils";
import { getDeals } from "@/lib/firestore/deals";
import { getProjectsByCompany } from "@/lib/firestore/projects";
import { useOrgStore } from "@/store/org";
import { usePermission } from "@/hooks/usePermission";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Company } from "@/types/crm";
import {
    ArrowLeft, ArrowRight, Building2, Globe, Mail, Phone, Users,
    DollarSign, Clock, Trash2, Pencil, MapPin, AlignLeft, Briefcase, FolderKanban,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { RBACGuard } from "@/components/auth/RBACGuard";

export default function CompanyDetailPage() {
    return (
        <RBACGuard requirePermission={{ module: "companies", action: "read" }}>
            <CompanyDetailPageContent />
        </RBACGuard>
    );
}

function CompanyDetailPageContent() {
    const params = useParams<{ orgId: string; id: string }>();
    const { orgId, id } = params;
    const router = useRouter();
    const { currentMember } = useOrgStore();
    const { can, canEditAll, canDelete: hasDeletePermission, isManager } = usePermission();
    const base = `/org/${orgId}`;

    const [company, setCompany] = useState<Company | null>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [deals, setDeals] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { confirm, ConfirmDialog } = useConfirm();
    const [editOpen, setEditOpen] = useState(false);

    const canEdit =
        canEditAll("companies") ||
        (company?.ownerId === currentMember?.userId && can("companies", "edit"));
    const canDelete = hasDeletePermission("companies");
    const canViewFinancials = isManager();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { company: fetched, error } = await getCompany(id);
            if (error || !fetched) {
                setNotFound(true);
                setLoading(false);
                return;
            }
            setCompany(fetched);

            // Load associated contacts in background
            const [contactsResult, dealsResult, projectsResult] = await Promise.all([
                getCompanyContacts(orgId, id),
                getDeals(orgId, { companyId: id }),
                getProjectsByCompany(orgId, id)
            ]);

            setContacts(contactsResult.contacts ?? []);
            setDeals(dealsResult.deals);
            setProjects(projectsResult.projects);
            setLoading(false);
        };
        load();
    }, [id, orgId]);

    const handleEditSuccess = async () => {
        const { company: refreshed } = await getCompany(id);
        if (refreshed) setCompany(refreshed);
    };

    const handleDelete = async () => {
        if (!company) return;
        if (!(await confirm({ title: "Delete Company", message: `Delete "${company.name}"? This action cannot be undone.`, confirmLabel: "Delete", destructive: true }))) return;
        setDeleting(true);
        const { error } = await deleteCompany(company.id, currentMember!.userId);
        if (error) {
            toast.error("Failed to delete company");
            setDeleting(false);
        } else {
            toast.success("Company deleted");
            router.replace(`${base}/companies`);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // ── Not found ────────────────────────────────────────────────────────────
    if (notFound || !company) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Building2 className="h-16 w-16 text-muted-foreground/40" />
                <h2 className="text-xl font-semibold">Company not found</h2>
                <p className="text-muted-foreground text-sm">
                    This company may have been deleted or does not exist.
                </p>
                <Button variant="outline" onClick={() => router.push(`${base}/companies`)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Companies
                </Button>
            </div>
        );
    }

    // ── Detail view ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <PageHeader
                title={company.name}
                breadcrumbs={[
                    { label: "Dashboard", href: `${base}/dashboard` },
                    { label: "Companies", href: `${base}/companies` },
                    { label: company.name },
                ]}
                description={[company.industry, company.size].filter(Boolean).join(" · ") || "Company details"}
                action={
                    <div className="flex gap-2">
                        {canEdit && (
                            <Button variant="outline" onClick={() => setEditOpen(true)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        )}
                        {canDelete && (
                            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                                {deleting
                                    ? <LoadingSpinner size="sm" className="mr-2" />
                                    : <Trash2 className="h-4 w-4 mr-2" />
                                }
                                Delete
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* ── Left / main column ─────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Core info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Company Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            {company.domain && (
                                <InfoRow
                                    icon={<Globe className="h-4 w-4 text-muted-foreground" />}
                                    label="Domain"
                                    value={
                                        <a
                                            href={`https://${company.domain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            {company.domain}
                                        </a>
                                    }
                                />
                            )}
                            {company.email && (
                                <InfoRow
                                    icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                                    label="Email"
                                    value={
                                        <a href={`mailto:${company.email}`} className="text-primary hover:underline">
                                            {company.email}
                                        </a>
                                    }
                                />
                            )}
                            {company.phone && (
                                <InfoRow
                                    icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                                    label="Phone"
                                    value={
                                        <a href={`tel:${company.phone}`} className="text-primary hover:underline">
                                            {company.phone}
                                        </a>
                                    }
                                />
                            )}
                            {company.industry && (
                                <InfoRow
                                    icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
                                    label="Industry"
                                    value={company.industry}
                                />
                            )}
                            {company.size && (
                                <InfoRow
                                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                                    label="Company Size"
                                    value={`${company.size} employees`}
                                />
                            )}
                            {company.annualRevenue !== undefined && (
                                <InfoRow
                                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                                    label="Annual Revenue"
                                    value={
                                        canViewFinancials
                                            ? `$${company.annualRevenue.toLocaleString()}`
                                            : "$•••"
                                    }
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Description */}
                    {company.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <AlignLeft className="h-4 w-4" />
                                    Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {company.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes */}
                    {company.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {company.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Addresses */}
                    {(company.billingAddress || company.shippingAddress) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Addresses
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6 sm:grid-cols-2">
                                {company.billingAddress && (
                                    <AddressBlock label="Billing Address" address={company.billingAddress} />
                                )}
                                {company.shippingAddress && (
                                    <AddressBlock label="Shipping Address" address={company.shippingAddress} />
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Associated contacts */}
                    {contacts.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Contacts
                                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                                        {contacts.length}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="divide-y divide-border">
                                {contacts.map((contact) => (
                                    <Link
                                        key={contact.id}
                                        href={`${base}/contacts/${contact.id}`}
                                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:text-primary transition-colors"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                                            {(contact.firstName?.[0] ?? contact.email?.[0] ?? "?").toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {contact.firstName} {contact.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {contact.jobTitle || contact.email || "—"}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {deals.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    Deals
                                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                                        {deals.length}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="divide-y divide-border">
                                {deals.map((deal) => (
                                    <Link
                                        key={deal.id}
                                        href={`${base}/deals/${deal.id}`}
                                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:text-primary transition-colors"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">{deal.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {deal.stage} • ${deal.value?.toLocaleString() || "0"}
                                            </p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {projects.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FolderKanban className="h-4 w-4" />
                                    Projects
                                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                                        {projects.length}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="divide-y divide-border">
                                {projects.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`${base}/projects/${project.id}`}
                                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:text-primary transition-colors"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">{project.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {project.status} • {project.progress ?? 0}% complete
                                            </p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── Right / sidebar column ─────────────────────────────── */}
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
                                <span>{(() => { const d = toJsDate(company.createdAt); return d ? format(d, "MMM d, yyyy") : "-"; })()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    Updated
                                </span>
                                <span>{(() => { const d = toJsDate(company.updatedAt); return d ? format(d, "MMM d, yyyy") : "-"; })()}</span>
                            </div>
                            {company.ownerName && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Owner</span>
                                    <span className="truncate max-w-[60%] text-right">{company.ownerName}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`${base}/companies`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Companies
                    </Button>
                </div>
            </div>

            <EditCompanyDialog open={editOpen} onOpenChange={setEditOpen} company={company} onSuccess={handleEditSuccess} />
            <ConfirmDialog />
        </div>
    );
}

// ── Helper components ──────────────────────────────────────────────────────────

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

function AddressBlock({
    label,
    address,
}: {
    label: string;
    address: NonNullable<Company["billingAddress"]>;
}) {
    const lines = [
        address.street,
        [address.city, address.state].filter(Boolean).join(", "),
        [address.zipCode, address.country].filter(Boolean).join(" "),
    ].filter(Boolean);

    if (lines.length === 0) return null;

    return (
        <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            {lines.map((line, i) => (
                <p key={i} className="text-sm">
                    {line}
                </p>
            ))}
        </div>
    );
}
