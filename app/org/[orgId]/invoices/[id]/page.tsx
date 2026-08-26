"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import { InvoiceEmailComposeModal } from "@/components/invoices/InvoiceEmailComposeModal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getInvoice, updateInvoiceStatus } from "@/lib/firestore/invoices";
import { getInvoicePDFBlob } from "@/lib/pdf/invoice-generator";
import { useAuthStore } from "@/store/auth";
import { usePermission } from "@/hooks/usePermission";
import type { Invoice } from "@/types/crm";
import { toast } from "sonner";
import { ArrowLeft, Shield, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RBACGuard } from "@/components/auth/RBACGuard";

export default function InvoiceDetailPage() {
    return (
        <RBACGuard requirePermission={{ module: "invoices", action: "read" }}>
            <InvoiceDetailPageContent />
        </RBACGuard>
    );
}

function InvoiceDetailPageContent() {
    const params = useParams<{ orgId: string; id: string }>();
    const { orgId, id } = params;
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    const { can } = usePermission();
    const base = `/org/${orgId}`;

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [composeOpen, setComposeOpen] = useState(false);

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

    const handleOpenCompose = () => {
        if (!invoice?.clientEmail) {
            toast.error("No email address found for this client");
            return;
        }
        setComposeOpen(true);
    };

    // Invoice creation no longer sends email inline (see
    // app/org/[orgId]/invoices/create/page.tsx) — clicking "Create & Send"
    // there just tags this navigation with ?compose=1 so the real compose
    // modal opens here for review instead of an email firing blind. The
    // query param is stripped right after so a page refresh doesn't
    // reopen it.
    useEffect(() => {
        if (!invoice || loading) return;
        if (searchParams.get("compose") === "1") {
            router.replace(`${base}/invoices/${invoice.id}`);
            handleOpenCompose();
        } else if (searchParams.get("promptSend") === "1") {
            // "Save Draft" was used instead of "Create & Send" — still ask,
            // just less insistently (a dismissible toast instead of forcing
            // the compose modal open).
            router.replace(`${base}/invoices/${invoice.id}`);
            if (invoice.clientEmail) {
                toast("Invoice saved as draft", {
                    description: "Send it to the client now?",
                    duration: 15000,
                    action: {
                        label: "Send Email",
                        onClick: () => handleOpenCompose(),
                    },
                });
            }
        }
    }, [invoice, loading]);

    const handleEmailSent = async () => {
        if (invoice?.status === "Draft") {
            await updateInvoiceStatus(invoice.id, "Sent", user!.uid);
            setInvoice((prev) => prev ? { ...prev, status: "Sent" } : null);
            toast.success("Invoice status updated to Sent");
        }
    };

    const handleDownloadPDF = async () => {
        if (!invoice || !user) return;
        try {
            const pdfBlob = await getInvoicePDFBlob(invoice, orgId, undefined, { name: user.displayName || user.email || "", email: user.email || "" });
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${invoice.invoiceNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Failed to generate PDF");
        }
    };

    const handleMarkPaid = async () => {
        if (!invoice) return;
        if (!canModify) {
            toast.error("Only admins and managers can mark invoices as paid");
            return;
        }
        await updateInvoiceStatus(invoice.id, "Paid", user!.uid, new Date());
        setInvoice((prev) => prev ? { ...prev, status: "Paid" } : null);
        toast.success("Marked as paid");
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
                title={`Invoice ${invoice.invoiceNumber}`}
                breadcrumbs={[
                    { label: "Dashboard", href: `${base}/dashboard` },
                    { label: "Invoices",  href: `${base}/invoices` },
                    { label: invoice.invoiceNumber },
                ]}
                description={`${invoice.companyName || invoice.contactName || "Client"} · ${invoice.status}`}
                action={
                    <div className="flex items-center gap-2">
                        {!canModify && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground px-2 py-1 bg-muted rounded">
                                <Shield className="h-3 w-3" />
                                View Only
                            </span>
                        )}
                        {invoice.status === "Draft" && canModify && (
                            <Button
                                variant="outline"
                                onClick={() => router.push(`${base}/invoices/${invoice.id}/edit`)}
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Invoice
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => router.push(`${base}/invoices`)}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </div>
                }
            />

            <InvoiceDetail
                invoice={invoice}
                onSendEmail={handleOpenCompose}
                onDownloadPDF={handleDownloadPDF}
                onMarkPaid={handleMarkPaid}
                onEdit={() => router.push(`${base}/invoices/${invoice.id}/edit`)}
                sending={false}
                canModify={canModify}
                canViewFinancials={canModify}
            />

            <InvoiceEmailComposeModal
                invoice={invoice}
                open={composeOpen}
                onOpenChange={setComposeOpen}
                onSent={handleEmailSent}
            />
        </div>
    );
}
