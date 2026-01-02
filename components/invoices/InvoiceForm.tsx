"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ClientSelector } from "./ClientSelector";
import { DealProjectLinker } from "./DealProjectLinker";
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations/invoice";
import type { Invoice } from "@/types/crm";
import { Timestamp } from "firebase/firestore";
import { addDays, format } from "date-fns";
import { Save, Send, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
            invoiceNumber: invoice?.invoiceNumber || "",
            template: invoice?.template || "standard",
            status: invoice?.status || "Draft",
            companyId: invoice?.companyId || "",
            companyName: invoice?.companyName || "",
            contactId: invoice?.contactId || "",
            contactName: invoice?.contactName || "",
            clientEmail: invoice?.clientEmail || "",
            billingAddress: invoice?.billingAddress || "",
            dealId: invoice?.dealId || "",
            dealName: invoice?.dealName || "",
            projectId: invoice?.projectId || "",
            projectName: invoice?.projectName || "",
            issueDate: invoice?.issueDate ? invoice.issueDate.toDate() : new Date(),
            dueDate: invoice?.dueDate ? invoice.dueDate.toDate() : addDays(new Date(), 30),
            paymentTerms: invoice?.paymentTerms || "Net 30",
            currency: invoice?.currency || "USD",
            lineItems: invoice?.lineItems.map(item => ({
                ...item,
                total: item.price * item.quantity
            })) || [{ description: "", quantity: 1, price: 0, total: 0 }],
            taxRate: invoice?.taxRate || 0,
            discount: invoice?.discount || 0,
            notes: invoice?.notes || "",
            terms: invoice?.terms || "Payment is due within the specified payment terms.",
        } as any, // Cast to any to avoid DefaultValues deep partial mismatch
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "lineItems",
    });

    // Auto-generate invoice number
    useEffect(() => {
        if (mode === "create" && !invoice?.invoiceNumber) {
            const timestamp = Date.now();
            const randomNum = Math.floor(Math.random() * 1000);
            form.setValue("invoiceNumber", `INV-${timestamp}-${randomNum}`);
        }
    }, [mode, invoice?.invoiceNumber, form]);

    // Watch values for calculations
    // Watch values for calculations
    const lineItems = (form.watch("lineItems") || []) as any[];
    const taxRate = (form.watch("taxRate") || 0) as number;
    const discount = (form.watch("discount") || 0) as number;

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount - discount;

    // Sync calculations to form
    useEffect(() => {
        form.setValue("subtotal", subtotal);
        form.setValue("taxAmount", taxAmount);
        form.setValue("total", total);
    }, [subtotal, taxAmount, total, form]);

    const handleClientSelect = (client: any) => {
        form.setValue("companyId", client.companyId);
        form.setValue("companyName", client.companyName);
        form.setValue("contactId", client.contactId);
        form.setValue("contactName", client.contactName);
        form.setValue("clientEmail", client.clientEmail);
        form.setValue("billingAddress", client.billingAddress);
    };

    const onSubmit = async (data: InvoiceFormData, sendEmail: boolean) => {
        await onSave({
            ...data,
            lineItems: data.lineItems.map(item => ({
                ...item,
                id: item.id || crypto.randomUUID(),
                taxRate: 0,
            })),
            issueDate: Timestamp.fromDate(data.issueDate),
            dueDate: Timestamp.fromDate(data.dueDate),
            status: (sendEmail ? "Sent" : data.status) as any,
        }, sendEmail);
    };

    return (
        <Form {...form}>
            <form className="space-y-6">
                {/* Client Selection */}
                <ClientSelector
                    onClientSelect={handleClientSelect}
                    selectedCompanyId={form.watch("companyId")}
                    selectedContactId={form.watch("contactId")}
                />

                {/* Client Details (Editable) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Billing Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client Name / Company</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Client Name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="clientEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="email" placeholder="billing@client.com" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="billingAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Billing Address</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Full billing address..." rows={3} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="invoiceNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Invoice Number</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="INV-001" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="template"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Template</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select template" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="standard">Standard Business</SelectItem>
                                                <SelectItem value="project">Project/Time-Based</SelectItem>
                                                <SelectItem value="recurring">Recurring/Subscription</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="issueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Issue Date</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                onChange={(e) => field.onChange(new Date(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Due Date</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                onChange={(e) => field.onChange(new Date(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="paymentTerms"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Terms</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select terms" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Net 15">Net 15</SelectItem>
                                                <SelectItem value="Net 30">Net 30</SelectItem>
                                                <SelectItem value="Net 60">Net 60</SelectItem>
                                                <SelectItem value="Custom">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Currency</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select currency" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <DealProjectLinker
                    companyId={form.watch("companyId")}
                    onDealSelect={(id, name) => {
                        form.setValue("dealId", id);
                        form.setValue("dealName", name);
                    }}
                    onProjectSelect={(id, name) => {
                        form.setValue("projectId", id);
                        form.setValue("projectName", name);
                    }}
                    selectedDealId={form.watch("dealId")}
                    selectedProjectId={form.watch("projectId")}
                />

                {/* Line Items */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Line Items</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ description: "", quantity: 1, price: 0, total: 0 })}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                </Button>
                            </div>

                            <div className="border rounded-md divide-y">
                                <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 font-medium text-sm">
                                    <div className="col-span-6">Description</div>
                                    <div className="col-span-2 text-right">Qty</div>
                                    <div className="col-span-2 text-right">Price</div>
                                    <div className="col-span-2 text-right">Total</div>
                                    {/* <div className="col-span-1"></div> */}
                                </div>
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-4 p-4 items-start">
                                        <div className="col-span-6">
                                            <FormField
                                                control={form.control}
                                                name={`lineItems.${index}.description`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Item description" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`lineItems.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                {...field}
                                                                onChange={e => field.onChange(Number(e.target.value))}
                                                                className="text-right"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`lineItems.${index}.price`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                {...field}
                                                                onChange={e => field.onChange(Number(e.target.value))}
                                                                className="text-right"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-2 flex items-center justify-end gap-2">
                                            <span className="text-sm font-mono">
                                                {(form.watch(`lineItems.${index}.quantity`) * form.watch(`lineItems.${index}.price`)).toFixed(2)}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Totals & Notes */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notes</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder="Additional notes..." />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="terms"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Terms & Conditions</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder="Payment terms..." />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{subtotal.toFixed(2)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 items-center">
                                    <span className="text-muted-foreground">Tax Rate (%)</span>
                                    <FormField
                                        control={form.control}
                                        name="taxRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.1"
                                                        {...field}
                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                        className="text-right"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 items-center">
                                    <span className="text-muted-foreground">Discount</span>
                                    <FormField
                                        control={form.control}
                                        name="discount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        {...field}
                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                        className="text-right"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <span className="text-lg font-bold">Total</span>
                                    <span className="text-lg font-bold">
                                        {form.watch("currency")} {total.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
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
                    >
                        <Send className="h-4 w-4 mr-2" />
                        {mode === "create" ? "Create & Send" : "Save & Send"}
                    </Button>
                </div>

            </form>
        </Form>
    );
}
