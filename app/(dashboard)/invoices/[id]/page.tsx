"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getInvoice, updateInvoiceStatus, updateInvoice } from "@/lib/firestore/invoices";
import { getInvoicePDFBlob } from "@/lib/pdf/invoice-generator";
import { sendInvoiceEmail } from "@/lib/email/invoice-email";
import type { Invoice } from "@/types/crm";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

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

    const handleSendEmail = async () => {
        if (!invoice) return;
        setSending(true);

        try {
            // 1. Generate PDF
            const pdfBlob = await getInvoicePDFBlob(invoice);

            // 2. Convert to base64 for proper API handling if needed, 
            // but for now let's assume our email util handles it or we send as buffer
            // Since sendInvoiceEmail (server action maybe?) expects something else? 
            // Checking imports... sendInvoiceEmail is likely a server action or client helper.
            // Let's assume client helper first based on previous context.
            // UPDATE: In a real app we might upload to storage first. 
            // For now, let's look at how create page did it?
            // "Updated sendInvoiceEmail to accept base64..."

            // Actually, let's use the API route we created in previous turn? 
            // app/api/invoices/send/route.ts
            // Let's just use the client-side helper if it works, or fetch the API.

            // Wait, looking at Context: "sendInvoiceEmail" is imported from "lib/email/invoice-email".
            // Let's verify what that function does. 
            // If it's pure server action it might need plain objects. 
            // Let's try the fetch to the API route which is safer for client components.

            const reader = new FileReader();
            reader.readAsDataURL(pdfBlob);
            reader.onloadend = async () => {
                const base64data = reader.result?.toString().split(",")[1];

                const response = await fetch("/api/invoices/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        invoice,
                        pdfBase64: base64data
                    })
                });

                if (!response.ok) throw new Error("Failed to send email");

                toast.success("Invoice sent successfully");

                // Update status to Sent
                if (invoice.status === "Draft") {
                    await updateInvoiceStatus(invoice.id, "Sent");
                    setInvoice(prev => prev ? ({ ...prev, status: "Sent" }) : null);
                }
            };

        } catch (error) {
            console.error(error);
            toast.error("Failed to send invoice");
        } finally {
            setSending(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!invoice) return;
        try {
            const pdfBlob = await getInvoicePDFBlob(invoice);
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
                onSendEmail={handleSendEmail}
                onDownloadPDF={handleDownloadPDF}
                onMarkPaid={handleMarkPaid}
                sending={sending}
            />
        </div>
    );
}
