"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Invoice } from "@/types/crm";
import { format } from "date-fns";
import { Download, Mail, Edit, CheckCircle, Smartphone, Lock } from "lucide-react";
import Link from "next/link";
import { cn, toJsDate } from "@/lib/utils";

interface InvoiceDetailProps {
    invoice: Invoice;
    onSendEmail: () => void;
    onDownloadPDF: () => void;
    onMarkPaid: () => void;
    onEdit?: () => void;
    sending?: boolean;
    canModify?: boolean;
    canViewFinancials?: boolean;
}

export function InvoiceDetail({ invoice, onSendEmail, onDownloadPDF, onMarkPaid, onEdit, sending, canModify = true, canViewFinancials = true }: InvoiceDetailProps) {
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            Draft: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
            Sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
            Paid: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
            Overdue: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
            Cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={cn("border-0 font-medium", getStatusColor(invoice.status))}>
                            {invoice.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            Created on {(() => { const d = toJsDate(invoice.createdAt); return d ? format(d, "MMM d, yyyy") : "-"; })()}
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={onDownloadPDF}>
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                    <Button variant="outline" onClick={onSendEmail} disabled={sending}>
                        <Mail className="mr-2 h-4 w-4" />
                        {sending ? "Sending..." : "Email"}
                    </Button>
                    {invoice.status !== "Paid" && (
                        <Button
                            variant="outline"
                            onClick={onMarkPaid}
                            disabled={!canModify}
                            title={canModify ? "Mark invoice as paid" : "Only admins and managers can mark invoices as paid"}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {canModify ? "Mark Paid" : <><Lock className="h-4 w-4 mr-2" />Locked</>}
                        </Button>
                    )}
                    {canModify ? (
                        <Button onClick={onEdit ?? undefined} asChild={!onEdit}>
                            {onEdit ? (
                                <><Edit className="mr-2 h-4 w-4" />Edit</>
                            ) : (
                                <Link href={`/invoices/${invoice.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            )}
                        </Button>
                    ) : (
                        <Button variant="outline" disabled title="Only admins and managers can edit invoices">
                            <Lock className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Invoice Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Header Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Issue Date</p>
                                    <p className="font-medium">{(() => { const d = toJsDate(invoice.issueDate); return d ? format(d, "MMM d, yyyy") : "-"; })()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Due Date</p>
                                    <p className="font-medium">{(() => { const d = toJsDate(invoice.dueDate); return d ? format(d, "MMM d, yyyy") : "-"; })()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Payment Terms</p>
                                    <p className="font-medium">{invoice.paymentTerms}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Currency</p>
                                    <p className="font-medium">{invoice.currency}</p>
                                </div>
                            </div>

                            <Separator />

                            {/* Line Items */}
                            <div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 font-medium text-muted-foreground">Description</th>
                                            <th className="text-right py-2 font-medium text-muted-foreground">Qty</th>
                                            <th className="text-right py-2 font-medium text-muted-foreground">Price</th>
                                            <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {invoice.lineItems.map((item, i) => (
                                            <tr key={i}>
                                                <td className="py-3">{item.description}</td>
                                                <td className="text-right py-3">{item.quantity}</td>
                                                <td className="text-right py-3">{canViewFinancials ? `${invoice.currency} ${item.price.toFixed(2)}` : "•••"}</td>
                                                <td className="text-right py-3 font-medium">
                                                    {canViewFinancials ? `${invoice.currency} ${(item.quantity * item.price).toFixed(2)}` : "•••"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Separator />

                            {/* Totals */}
                            <div className="flex flex-col items-end gap-2 text-sm">
                                <div className="flex justify-between w-48">
                                    <span className="text-muted-foreground">Subtotal:</span>
                                    <span>{canViewFinancials ? `${invoice.currency} ${invoice.subtotal.toFixed(2)}` : "•••"}</span>
                                </div>
                                <div className="flex justify-between w-48">
                                    <span className="text-muted-foreground">Tax ({invoice.taxRate}%):</span>
                                    <span>{canViewFinancials ? `${invoice.currency} ${invoice.taxAmount.toFixed(2)}` : "•••"}</span>
                                </div>
                                {invoice.discount > 0 && (
                                    <div className="flex justify-between w-48 text-green-600">
                                        <span>Discount:</span>
                                        <span>{canViewFinancials ? `-${invoice.currency} ${invoice.discount.toFixed(2)}` : "•••"}</span>
                                    </div>
                                )}
                                <div className="flex justify-between w-48 text-lg font-bold border-t pt-2 mt-2">
                                    <span>Total:</span>
                                    <span>{canViewFinancials ? `${invoice.currency} ${invoice.total.toFixed(2)}` : "•••"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes & Terms */}
                    {(invoice.notes || invoice.terms) && (
                        <Card>
                            <CardContent className="pt-6 space-y-4 text-sm">
                                {invoice.notes && (
                                    <div>
                                        <p className="font-medium mb-1">Notes</p>
                                        <p className="text-muted-foreground">{invoice.notes}</p>
                                    </div>
                                )}
                                {invoice.terms && (
                                    <div>
                                        <p className="font-medium mb-1">Terms & Conditions</p>
                                        <p className="text-muted-foreground">{invoice.terms}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Client Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Client</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div>
                                <p className="text-muted-foreground">Company</p>
                                <p className="font-medium">{invoice.companyName || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Contact</p>
                                <p className="font-medium">{invoice.contactName || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Email</p>
                                <Link href={`mailto:${invoice.clientEmail}`} className="text-primary hover:underline block truncate">
                                    {invoice.clientEmail || "N/A"}
                                </Link>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Billing Address</p>
                                <p className="whitespace-pre-wrap">{invoice.billingAddress || "N/A"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Related Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Related To</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            {invoice.projectName && (
                                <div>
                                    <p className="text-muted-foreground">Project</p>
                                    <Link href={`/projects/${invoice.projectId}`} className="text-primary hover:underline font-medium">
                                        {invoice.projectName}
                                    </Link>
                                </div>
                            )}
                            {invoice.dealName && (
                                <div>
                                    <p className="text-muted-foreground">Deal</p>
                                    <p className="font-medium">{invoice.dealName}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
