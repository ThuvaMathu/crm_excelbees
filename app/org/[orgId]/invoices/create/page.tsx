"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { createInvoice } from "@/lib/firestore/invoices";
import { createActivity } from "@/lib/firestore/activities";
import { getOrganization } from "@/lib/firestore/organizations";
import { useAuthStore } from "@/store/auth";
import { useOrgStore } from "@/store/org";
import type { Invoice } from "@/types/crm";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { RBACGuard } from "@/components/auth/RBACGuard";

export default function CreateInvoicePage() {
    return (
        <RBACGuard requirePermission={{ module: "invoices", action: "create" }}>
            <CreateInvoicePageContent />
        </RBACGuard>
    );
}

function CreateInvoicePageContent() {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    const { currentMember } = useOrgStore();
    const base = `/org/${orgId}`;
    const [saving, setSaving] = useState(false);

    // Nudge an admin to configure invoice settings (logo, color theme,
    // payment details) before the org's first invoice — otherwise the
    // generated PDF silently uses generic placeholder branding with no
    // indication anything is unconfigured. Only admins can actually fix
    // this (see app/org/[orgId]/settings/invoices/page.tsx), so team
    // members aren't shown a prompt they have no way to act on.
    useEffect(() => {
        if (!user || currentMember?.role !== "admin") return;
        (async () => {
            const { org } = await getOrganization(orgId);
            if (!org?.invoiceSettings) {
                toast("Set up your invoice details first", {
                    description: "Add your logo, color theme, and payment details so invoices look right.",
                    duration: 15000,
                    action: {
                        label: "Configure now",
                        onClick: () => router.push(`${base}/settings/invoices`),
                    },
                });
            }
        })();
    }, [user, currentMember]);

    const defaultInvoice: Partial<Invoice> = {
        dealId:      searchParams.get("dealId")      || undefined,
        dealName:    searchParams.get("dealName")    || undefined,
        companyId:   searchParams.get("companyId")   || undefined,
        companyName: searchParams.get("companyName") || undefined,
        contactId:   searchParams.get("contactId")   || undefined,
        projectId:   searchParams.get("projectId")   || undefined,
        projectName: searchParams.get("projectName") || undefined,
    };

    const handleSave = async (invoiceData: Partial<Invoice>, sendEmail: boolean) => {
        if (!user) {
            toast.error("You must be logged in");
            return;
        }
        setSaving(true);
        try {
            const completeInvoiceData = {
                ...invoiceData,
                template:     invoiceData.template     || "standard",
                status:       invoiceData.status       || "Draft",
                issueDate:    invoiceData.issueDate    || Timestamp.now(),
                dueDate:      invoiceData.dueDate      || Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
                paymentTerms: invoiceData.paymentTerms || "Net 30",
                currency:     invoiceData.currency     || "USD",
                lineItems:    invoiceData.lineItems    || [],
                subtotal:     invoiceData.subtotal     || 0,
                taxAmount:    invoiceData.taxAmount    || 0,
                taxRate:      invoiceData.taxRate      || 0,
                discount:     invoiceData.discount     || 0,
                total:        invoiceData.total        || 0,
                ownerId:      user.uid,
                ownerName:    user.displayName || user.email || "Unknown",
                createdBy:    user.uid,
                organizationId: orgId,
            };

            const { success, id, invoiceNumber, error } = await createInvoice(completeInvoiceData as any, user.uid, orgId);

            if (!success || !id) {
                toast.error(error || "Failed to create invoice");
                setSaving(false);
                return;
            }

            const finalInvoiceNumber = completeInvoiceData.invoiceNumber || invoiceNumber || id;

            await createActivity({
                type: "created",
                content: `Invoice ${finalInvoiceNumber} created`,
                performedBy: user.uid,
                performedByName: user.displayName || user.email || "Unknown",
                relatedTo: { collection: "invoices", id },
                organizationId: orgId,
            } as any);

            toast.success("Invoice created successfully!");

            // No email is sent as part of creation anymore — this used to
            // silently generate the PDF and POST to /api/invoices/send
            // inline here, with no chance to review/compose it and marking
            // the invoice "Sent" before anything had actually been sent.
            // The detail page now prompts the user to send it (or, if the
            // "Create & Send" button was used here, opens the real compose
            // modal directly) — status only flips to "Sent" once that
            // completes for real.
            router.push(`${base}/invoices/${id}?${sendEmail ? "compose=1" : "promptSend=1"}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to create invoice");
        }
        setSaving(false);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Create Invoice"
                breadcrumbs={[
                    { label: "Dashboard",  href: `${base}/dashboard` },
                    { label: "Invoices",   href: `${base}/invoices` },
                    { label: "Create" },
                ]}
                description="Create a new invoice for your client"
            />
            <InvoiceForm
                mode="create"
                invoice={defaultInvoice as Invoice}
                onSave={handleSave}
                saving={saving}
            />
        </div>
    );
}
