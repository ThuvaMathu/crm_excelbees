"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getInvoice, updateInvoice } from "@/lib/firestore/invoices";
import { sendInvoiceEmail } from "@/lib/email/invoice-email";
import { getInvoicePDFBlob } from "@/lib/pdf/invoice-generator";
import type { Invoice } from "@/types/crm";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EditInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

    const handleSave = async (data: Partial<Invoice>, sendEmail: boolean) => {
        if (!invoice) return;
        setSaving(true);
        try {
            // Update Firestore
            const { error } = await updateInvoice(invoice.id, data);

            if (error) throw new Error(error);

            if (sendEmail) {
                // Generate PDF and Send Email (Similar to Detail View)
                const fullInvoice = { ...invoice, ...data } as Invoice;
                const pdfBlob = await getInvoicePDFBlob(fullInvoice);

                const reader = new FileReader();
                reader.readAsDataURL(pdfBlob);
                reader.onloadend = async () => {
                    const base64data = reader.result?.toString().split(",")[1];
                    const response = await fetch("/api/invoices/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            invoice: fullInvoice,
                            pdfBase64: base64data
                        })
                    });
                    if (!response.ok) throw new Error("Failed to send email");
                    toast.success("Invoice updated and sent successfully");
                    router.push(`/invoices/${invoice.id}`);
                };
            } else {
                toast.success("Invoice updated successfully");
                router.push(`/invoices/${invoice.id}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update invoice");
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
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/invoices/${invoice.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Back to Invoice</h1>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
                    <p className="text-muted-foreground mt-2">
                        Update invoice details and line items.
                    </p>
                </div>
            </div>

            <InvoiceForm
                mode="edit"
                invoice={invoice}
                onSave={handleSave}
                saving={saving}
            />
        </div>
    );
}
