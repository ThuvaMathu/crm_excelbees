"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getInvoices, getInvoiceStats } from "@/lib/firestore/invoices";
import { toJsDate } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import type { Invoice } from "@/types/crm";
import { Plus, FileText, DollarSign, AlertCircle, FileCheck, Settings, Lock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { RBACGuard } from "@/components/auth/RBACGuard";
import { logger } from "@/lib/logger/client";

export default function InvoicesPage() {
    return (
        <RBACGuard requirePermission={{ module: "invoices", action: "read" }}>
            <InvoicesPageContent />
        </RBACGuard>
    );
}

function InvoicesPageContent() {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const router = useRouter();
    const { can, isManager, isAdmin } = usePermission();
    const base = `/org/${orgId}`;
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        outstanding: 0,
        overdueCount: 0,
        draftCount: 0,
    });
    const [loading, setLoading] = useState(true);

    const canViewFinancials = isManager();
    const canCreate = can("invoices", "create");

    useEffect(() => {
        const fetchData = async () => {
            const [invoicesResult, statsResult] = await Promise.all([
                getInvoices(orgId),
                getInvoiceStats(orgId),
            ]);

            if (invoicesResult.error) {
                logger.error("Error fetching invoices", { module: "invoices", action: "fetch", orgId, error: invoicesResult.error });
            } else {
                setInvoices(invoicesResult.invoices);
            }

            if (statsResult.error) {
                logger.error("Error fetching invoice stats", { module: "invoices", action: "fetch", orgId, error: statsResult.error });
            } else if (statsResult.stats) {
                setStats(statsResult.stats);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <PageHeader
                    title="Invoices"
                    breadcrumbs={[
                        { label: "Dashboard", href: `${base}/dashboard` },
                        { label: "Invoices" },
                    ]}
                    description="Manage your invoices and track payments"
                    action={
                        canViewFinancials ? (
                            <div className="flex gap-2">
                                {isAdmin() && (
                                    <Button variant="outline" onClick={() => router.push(`${base}/settings/invoices`)} className="gap-2">
                                        <Settings className="h-4 w-4" />
                                        Settings
                                    </Button>
                                )}
                                {canCreate && (
                                    <Button className="bg-primary hover:bg-primary/90 gap-2" asChild>
                                        <Link href={`${base}/invoices/create`}>
                                            <Plus className="h-4 w-4" />
                                            New Invoice
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        ) : undefined
                    }
                />

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                    {canViewFinancials ? (
                                        <DollarSign className="h-6 w-6 text-green-600" />
                                    ) : (
                                        <Lock className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                                    <p className="text-2xl font-bold">
                                        {canViewFinancials ? `$${stats.totalRevenue.toLocaleString()}` : "$•••"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                    {canViewFinancials ? (
                                        <FileCheck className="h-6 w-6 text-blue-600" />
                                    ) : (
                                        <Lock className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Outstanding</p>
                                    <p className="text-2xl font-bold">
                                        {canViewFinancials ? `$${stats.outstanding.toLocaleString()}` : "$•••"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Overdue</p>
                                    <p className="text-2xl font-bold">{stats.overdueCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                                    <FileText className="h-6 w-6 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Drafts</p>
                                    <p className="text-2xl font-bold">{stats.draftCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {invoices.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create your first invoice to get started
                            </p>
                            {canCreate && (
                                <Button className="gap-2" asChild>
                                    <Link href={`${base}/invoices/create`}>
                                        <Plus className="h-4 w-4" />
                                        Create Invoice
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Invoice #
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Client
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Issue Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Due Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {invoices.map((invoice) => (
                                            <tr
                                                key={invoice.id}
                                                className="hover:bg-muted/50 cursor-pointer transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link
                                                        href={`${base}/invoices/${invoice.id}`}
                                                        className="text-sm font-medium text-primary hover:underline"
                                                    >
                                                        {invoice.invoiceNumber}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium">
                                                        {invoice.companyName || invoice.contactName || "N/A"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    {(() => { const d = toJsDate(invoice.issueDate); return d ? format(d, "MMM d, yyyy") : "-"; })()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    {(() => { const d = toJsDate(invoice.dueDate); return d ? format(d, "MMM d, yyyy") : "-"; })()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold">
                                                        {canViewFinancials ? `$${invoice.total.toLocaleString()}` : "$•••"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                                                        {invoice.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
