"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getInvoice, updateInvoice } from "@/lib/firestore/invoices";
import { getInvoicePDFBlob } from "@/lib/pdf/invoice-generator";
import { useAuthStore } from "@/store/auth";
import { usePermission } from "@/hooks/usePermission";
import type { Invoice } from "@/types/crm";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { RBACGuard } from "@/components/auth/RBACGuard";

export default function EditInvoicePage() {
    return (
        <RBACGuard requirePermission={{ module: "invoices", action: "edit" }}>
            <EditInvoicePageContent />
        </RBACGuard>
    );
}

function EditInvoicePageContent() {
    const params = useParams<{ orgId: string; id: string }>();
    const { orgId, id } = params;
    const router = useRouter();
    const { user } = useAuthStore();
    const { can } = usePermission();
    const base = `/org/${orgId}`;

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const canModify = can("invoices", "edit");

    useEffect(() => {
        const fetch = async () => {
            const { invoice: fetched, error } = await getInvoice(id);
            if (error || !fetched) {
                toast.error("Failed to load invoice");
                router.push(`${base}/invoices`);
            } else {
                setInvoice(fetched);
            }
            setLoading(false);
        };
        fetch();
    }, [id]);

    const handleSave = async (data: Partial<Invoice>, sendEmail: boolean) => {
        if (!invoice || !user) return;
        if (!canModify) {
            toast.error("Only admins and managers can edit invoices");
            return;
        }
        setSaving(true);
        try {
            const { error } = await updateInvoice(invoice.id, data, user!.uid);
            if (error) throw new Error(error);

            if (sendEmail && (data.clientEmail || invoice.clientEmail)) {
                const fullInvoice = { ...invoice, ...data } as Invoice;
                const pdfBlob = await getInvoicePDFBlob(fullInvoice, orgId, undefined, { name: user.displayName || user.email || "", email: user.email || "" });
                const reader = new FileReader();
                const pdfBase64 = await new Promise<string>((resolve) => {
                    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
                    reader.readAsDataURL(pdfBlob);
                });
                // /api/invoices/send is gated by verifyApiRequest(), which
                // requires a Bearer token — same missing-header bug as the
                // create-invoice page (app/org/[orgId]/invoices/create/page.tsx).
                const token = await auth.currentUser?.getIdToken();
                const response = await fetch("/api/invoices/send", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        invoice: fullInvoice,
                        recipientEmail: data.clientEmail || invoice.clientEmail,
                        pdfBase64,
                        filename: `Invoice-${fullInvoice.invoiceNumber}.pdf`,
                    }),
                });
                const emailResult = await response.json();
                if (emailResult.success) {
                    toast.success("Invoice updated and sent successfully!");
                } else {
                    toast.warning(`Invoice updated but email failed: ${emailResult.error}`);
                }
            } else {
                toast.success("Invoice updated successfully!");
            }

            router.push(`${base}/invoices/${invoice.id}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to update invoice");
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!invoice) return null;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Edit Invoice"
                breadcrumbs={[
                    { label: "Dashboard", href: `${base}/dashboard` },
                    { label: "Invoices",  href: `${base}/invoices` },
                    { label: invoice.invoiceNumber, href: `${base}/invoices/${invoice.id}` },
                    { label: "Edit" },
                ]}
                description={`Editing invoice for ${invoice.companyName || invoice.contactName || "client"}`}
            />
            <InvoiceForm
                mode="edit"
                invoice={invoice}
                onSave={handleSave}
                saving={saving}
            />
        </div>
    );
}
