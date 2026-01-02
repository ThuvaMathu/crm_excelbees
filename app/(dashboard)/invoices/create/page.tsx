"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { createInvoice } from "@/lib/firestore/invoices";
// import { sendInvoiceEmail } from "@/lib/email/invoice-email"; // Removed to avoid SSR issues
import { getInvoicePDFBlob } from "@/lib/pdf/invoice-generator";
import { createActivity } from "@/lib/firestore/activities";
import type { Invoice } from "@/types/crm";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";

export default function CreateInvoicePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);

    const handleSave = async (invoiceData: Partial<Invoice>, sendEmail: boolean) => {
        if (!user) {
            toast.error("You must be logged in");
            return;
        }

        setSaving(true);

        try {
            // Add metadata and defaults
            const completeInvoiceData = {
                ...invoiceData,
                template: invoiceData.template || "standard",
                status: invoiceData.status || "Draft",
                invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now()}`,
                issueDate: invoiceData.issueDate || Timestamp.now(),
                dueDate: invoiceData.dueDate || Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
                paymentTerms: invoiceData.paymentTerms || "Net 30",
                currency: invoiceData.currency || "USD",
                lineItems: invoiceData.lineItems || [],
                subtotal: invoiceData.subtotal || 0,
                taxAmount: invoiceData.taxAmount || 0,
                taxRate: invoiceData.taxRate || 0,
                discount: invoiceData.discount || 0,
                total: invoiceData.total || 0,
                ownerId: user.uid,
                ownerName: user.displayName || user.email || "Unknown",
                createdBy: user.uid,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            // Create invoice
            const { success, id, error } = await createInvoice(completeInvoiceData, user.uid);

            if (!success || !id) {
                toast.error(error || "Failed to create invoice");
                setSaving(false);
                return;
            }

            // Log activity
            await createActivity({
                type: "created",
                content: `Invoice ${invoiceData.invoiceNumber} created`,
                performedBy: user.uid,
                performedByName: user.displayName || user.email || "Unknown",
                relatedTo: {
                    collection: "invoices",
                    id: id,
                },
            });

            // Send email if requested
            // Send email if requested
            if (sendEmail && invoiceData.clientEmail) {
                // Generate PDF on client side
                const pdfBlob = getInvoicePDFBlob(
                    { ...completeInvoiceData, id } as Invoice,
                    {
                        name: "Your Company",
                        address: "123 Business St",
                        phone: "+1 234 567 8900",
                        email: "billing@yourcompany.com",
                    }
                );

                // Convert blob to base64
                const reader = new FileReader();
                const pdfBase64 = await new Promise<string>((resolve) => {
                    reader.onloadend = () => {
                        const base64 = reader.result as string;
                        resolve(base64.split(",")[1]);
                    };
                    reader.readAsDataURL(pdfBlob);
                });

                // Send via API route
                const response = await fetch("/api/invoices/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        invoice: { ...completeInvoiceData, id },
                        recipientEmail: invoiceData.clientEmail,
                        companyInfo: {
                            name: "Your Company",
                            address: "123 Business St",
                            phone: "+1 234 567 8900",
                            email: "billing@yourcompany.com",
                        },
                        pdfBase64,
                        filename: `Invoice-${invoiceData.invoiceNumber || "new"}.pdf`
                    }),
                });

                const emailResult = await response.json();

                if (emailResult.success) {
                    toast.success("Invoice created and sent successfully!");

                    // Log email activity
                    await createActivity({
                        type: "email",
                        content: `Invoice ${invoiceData.invoiceNumber} sent to ${invoiceData.clientEmail}`,
                        performedBy: user.uid,
                        performedByName: user.displayName || user.email || "Unknown",
                        relatedTo: {
                            collection: "invoices",
                            id: id,
                        },
                    });
                } else {
                    toast.error(`Invoice created but failed to send email: ${emailResult.error}`);
                }
            } else {
                toast.success("Invoice created successfully!");
            }

            // Redirect to invoice detail
            router.push(`/invoices/${id}`);
        } catch (error: any) {
            console.error("Error creating invoice:", error);
            toast.error(error.message || "Failed to create invoice");
        }

        setSaving(false);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Create Invoice"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Invoices", href: "/invoices" },
                    { label: "Create" },
                ]}
                description="Create a new invoice for your client"
            />

            <InvoiceForm mode="create" onSave={handleSave} saving={saving} />
        </div>
    );
}
