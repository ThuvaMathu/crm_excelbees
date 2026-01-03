"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InvoiceBasicInfo } from "./form-sections/InvoiceBasicInfo";
import { InvoiceLineItems } from "./form-sections/InvoiceLineItems";
import { InvoiceSettings } from "./form-sections/InvoiceSettings";
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations/invoice";
import type { Invoice, InvoiceStatus } from "@/types/crm";
import { Timestamp } from "firebase/firestore";
import { addDays } from "date-fns";
import { Save, Send, Eye } from "lucide-react";

interface InvoiceFormProps {
    invoice?: Invoice;
    mode: "create" | "edit";
    onSave: (invoiceData: Partial<Invoice>, sendEmail: boolean) => Promise<void>;
    saving?: boolean;
}

export function InvoiceForm({ invoice, mode, onSave, saving = false }: InvoiceFormProps) {
    const form = useForm({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            // ... (defaults mapped from prop 'invoice' or hardcoded)
            invoiceNumber: invoice?.invoiceNumber || "",
            template: invoice?.template || "standard",
            status: invoice?.status || "Draft",
            companyId: invoice?.companyId || "",
            companyName: invoice?.companyName || "",
            contactId: invoice?.contactId || "",
            contactName: invoice?.contactName || "",
            clientEmail: invoice?.clientEmail || "",
            billingAddress: invoice?.billingAddress || "",
            shippingAddress: invoice?.shippingAddress || "",
            dealId: invoice?.dealId || undefined,
            dealName: invoice?.dealName || "",
            projectId: invoice?.projectId || undefined,
            projectName: invoice?.projectName || "",
            issueDate: invoice?.issueDate ? invoice.issueDate.toDate() : new Date(),
            dueDate: invoice?.dueDate ? invoice.dueDate.toDate() : addDays(new Date(), 30),
            paymentTerms: invoice?.paymentTerms || "Net 30",
            currency: invoice?.currency || "USD",
            lineItems: invoice?.lineItems?.map(item => ({
                ...item,
                total: item.price * item.quantity
            })) || [{ description: "", quantity: 1, price: 0, total: 0, taxRate: 0 }],
            taxRate: invoice?.taxRate || 0,
            discount: invoice?.discount || 0,
            notes: invoice?.notes || "",
            terms: invoice?.terms || "Payment is due within the specified payment terms.",
            isRecurring: invoice?.isRecurring || false,
            recurring: invoice?.recurring ? {
                ...invoice.recurring,
                startDate: invoice.recurring.startDate.toDate(),
                endDate: invoice.recurring.endDate?.toDate(),
            } : {
                frequency: "monthly",
                interval: 1,
                startDate: new Date(),
                status: "active"
            }
        } as any
    });

    // Auto-generate invoice number
    useEffect(() => {
        if (mode === "create" && !invoice?.invoiceNumber && !form.getValues("invoiceNumber")) {
            const timestamp = Date.now();
            const randomNum = Math.floor(Math.random() * 1000);
            form.setValue("invoiceNumber", `INV-${timestamp}-${randomNum}`);
        }
    }, [mode, invoice?.invoiceNumber, form]);

    // Live Calculations
    const lineItems = (form.watch("lineItems") || []) as any[];
    const taxRate = (form.watch("taxRate") || 0) as number;
    const discount = (form.watch("discount") || 0) as number;
    const currency = form.watch("currency") || "USD";

    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount - discount;

    // Sync calculated fields
    useEffect(() => {
        form.setValue("subtotal", subtotal);
        form.setValue("taxAmount", taxAmount);
        form.setValue("total", total);
    }, [subtotal, taxAmount, total, form]);

    const onSubmit = async (data: any, sendEmail: boolean) => {
        // Prepare data for save
        const submissionData = {
            ...data,
            lineItems: data.lineItems.map((item: any) => ({
                ...item,
                id: item.id || crypto.randomUUID(),
                total: item.quantity * item.price,
                // Ensure number types
                quantity: Number(item.quantity),
                price: Number(item.price),
                taxRate: Number(item.taxRate || 0),
            })),
            issueDate: Timestamp.fromDate(data.issueDate),
            dueDate: Timestamp.fromDate(data.dueDate),
            recurring: data.isRecurring ? {
                ...data.recurring,
                startDate: Timestamp.fromDate(data.recurring.startDate),
                endDate: data.recurring.endDate ? Timestamp.fromDate(data.recurring.endDate) : undefined,
            } : undefined,
            status: (sendEmail ? "Sent" : data.status) as InvoiceStatus,
        };

        // Remove all undefined fields to prevent Firestore errors
        Object.keys(submissionData).forEach(key => {
            if (submissionData[key] === undefined || submissionData[key] === "") {
                delete submissionData[key];
            }
        });

        await onSave(submissionData as Partial<Invoice>, sendEmail);
    };

    return (
        <FormProvider {...form}>
            <Form {...form}>
                <form className="space-y-6 pb-24">
                    <Tabs defaultValue="details" className="w-full pb-32">
                        <TabsList className="grid w-full grid-cols-3 max-w-md">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="lines">Line Items</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <TabsContent value="details" className="space-y-6">
                                <InvoiceBasicInfo />
                            </TabsContent>

                            <TabsContent value="lines" className="space-y-6">
                                <InvoiceLineItems />
                            </TabsContent>

                            <TabsContent value="settings" className="space-y-6">
                                <InvoiceSettings />
                            </TabsContent>
                        </div>
                    </Tabs>

                    {/* Check if user missed line items when not on lines tab */}
                    {form.formState.errors.lineItems && (
                        <div className="text-destructive text-sm font-medium px-4">
                            warning: {(form.formState.errors.lineItems as any).message || "Please check line items"}
                        </div>
                    )}

                    {/* Fixed Bottom Bar for Totals & Actions */}
                    <div className="fixed bottom-0 left-0 md:left-64 right-0 border-t bg-background/95 backdrop-blur shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] py-4 px-6 md:px-12 z-40">
                        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                            {/* Totals Summary */}
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-semibold">{currency} {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="h-8 w-px bg-border/50" />
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Tax</span>
                                    <div className="flex items-center gap-2">
                                        <FormField
                                            control={form.control}
                                            name="taxRate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            className="h-6 w-16 text-right px-1"
                                                            {...field}
                                                            onChange={e => field.onChange(Number(e.target.value))}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <span className="text-xs">%</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Discount</span>
                                    <FormField
                                        control={form.control}
                                        name="discount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        className="h-6 w-20 text-right px-1"
                                                        {...field}
                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="h-8 w-px bg-border/50" />
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Total</span>
                                    <span className="font-bold text-lg text-primary">{currency} {total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={form.handleSubmit((data) => onSubmit(data, false))}
                                    disabled={saving}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Draft
                                </Button>
                                <Button
                                    type="button"
                                    onClick={form.handleSubmit((data) => onSubmit(data, true))}
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    {mode === "create" ? "Create & Send" : "Update & Send"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
        </FormProvider>
    );
}
