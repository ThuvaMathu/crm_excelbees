"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import { InvoiceEmailComposeModal } from "@/components/invoices/InvoiceEmailComposeModal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getInvoice, updateInvoiceStatus, updateInvoice } from "@/lib/firestore/invoices";
import { getInvoicePDFBlob } from "@/lib/pdf/invoice-generator";
import type { Invoice } from "@/types/crm";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [composeOpen, setComposeOpen] = useState(false);

    useEffect(() => {
        const fetchInvoice = async () => {
            if (!params.id) return;
            const { invoice, error } = await getInvoice(params.id as string);

            if (error) {
                toast.error("Failed to load invoice");
                router.push("/invoices");
            } else {
                setInvoice(invoice);
            }
            setLoading(false);
        };

        fetchInvoice();
    }, [params.id, router]);

    const handleOpenCompose = () => {
        if (!invoice) return;
        if (!invoice.clientEmail) {
            toast.error("No email address found for this client");
            return;
        }
        setComposeOpen(true);
    };

    const handleEmailSent = async () => {
        // Update invoice status to Sent if it was Draft
        if (invoice?.status === "Draft") {
            try {
                await updateInvoiceStatus(invoice.id, "Sent");
                setInvoice(prev => prev ? ({ ...prev, status: "Sent" }) : null);
                toast.success("Invoice status updated to Sent");
            } catch (error) {
                console.error("Failed to update status:", error);
            }
        }
    };

    const handleDownloadPDF = async () => {
        if (!invoice || !user) return;
        try {
            const pdfBlob = await getInvoicePDFBlob(invoice, user.uid);
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${invoice.invoiceNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to generate PDF");
        }
    };

    const handleMarkPaid = async () => {
        if (!invoice) return;
        try {
            await updateInvoiceStatus(invoice.id, "Paid", new Date());
            setInvoice(prev => prev ? ({ ...prev, status: "Paid" }) : null);
            toast.success("Marked as paid");
        } catch (error) {
            toast.error("Failed to update status");
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
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/invoices">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Back to Invoices</h1>
            </div>

            <InvoiceDetail
                invoice={invoice}
                onSendEmail={handleOpenCompose}
                onDownloadPDF={handleDownloadPDF}
                onMarkPaid={handleMarkPaid}
                sending={false}
            />

            {invoice && (
                <InvoiceEmailComposeModal
                    invoice={invoice}
                    open={composeOpen}
                    onOpenChange={setComposeOpen}
                    onSent={handleEmailSent}
                />
            )}
        </div>
    );
}
