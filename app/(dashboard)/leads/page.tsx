"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CreateLeadDialog } from "@/components/leads/CreateLeadDialog";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getLeads } from "@/lib/firestore/leads";
import { useAuth } from "@/hooks/useAuth";
import type { Lead, LeadStatus, LeadSource } from "@/types/crm";
import {
    Plus,
    Search,
    Users,
    Eye,
    Pencil,
    Trash2,
    Filter,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function LeadsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
    const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalLeads, setTotalLeads] = useState(0);
    const pageSize = 10;

    // Role-based access - only admin/manager can see financial data
    const canViewFinancials = user?.role === "admin" || user?.role === "manager";

    const fetchLeads = async () => {
        setLoading(true);
        const filters: any = {};

        if (statusFilter !== "all") {
            filters.status = statusFilter;
        }
        if (sourceFilter !== "all") {
            filters.source = sourceFilter;
        }
        if (searchQuery) {
            filters.search = searchQuery;
        }

        const { leads: fetchedLeads, total } = await getLeads(filters, {
            pageSize,
            page: currentPage,
        });
        setLeads(fetchedLeads);
        setTotalLeads(total ?? fetchedLeads.length);
        setLoading(false);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, sourceFilter, searchQuery]);

    useEffect(() => {
        fetchLeads();
    }, [statusFilter, sourceFilter, searchQuery, currentPage]);

    const handleSearch = () => {
        fetchLeads();
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Leads"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Leads" },
                ]}
                description="Manage your sales leads and prospects"
                action={
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lead
                    </Button>
                }
            />

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search leads by name, email, or company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="pl-10"
                            />
                        </div>
                        <Button onClick={handleSearch} variant="secondary">
                            Search
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => setStatusFilter(value as LeadStatus | "all")}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="New">New</SelectItem>
                                <SelectItem value="Contacted">Contacted</SelectItem>
                                <SelectItem value="Follow Up">Follow Up</SelectItem>
                                <SelectItem value="Qualified">Qualified</SelectItem>
                                <SelectItem value="Lost">Lost</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={sourceFilter}
                            onValueChange={(value) => setSourceFilter(value as LeadSource | "all")}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="Website">Website</SelectItem>
                                <SelectItem value="Referral">Referral</SelectItem>
                                <SelectItem value="Ads">Ads</SelectItem>
                                <SelectItem value="Cold Call">Cold Call</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Leads Table */}
            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : leads.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No leads found"
                        description="Get started by creating your first lead or adjust your filters."
                        action={{
                            label: "Create Lead",
                            onClick: () => setCreateDialogOpen(true),
                        }}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell className="font-medium">
                                            {lead.firstName} {lead.lastName}
                                        </TableCell>
                                        <TableCell>{lead.email}</TableCell>
                                        <TableCell>{lead.companyName || "-"}</TableCell>
                                        <TableCell>
                                            <LeadStatusBadge status={lead.status} />
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {lead.source}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {lead.value ? (canViewFinancials ? `$${lead.value.toLocaleString()}` : "$•••") : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {format(lead.createdAt.toDate(), "MMM d, yyyy")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/leads/${lead.id}`}>
                                                    <Button variant="ghost" size="icon">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>

            {/* Pagination */}
            {leads.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {Math.min((currentPage - 1) * pageSize + 1, totalLeads)} to {Math.min(currentPage * pageSize, totalLeads)} of {totalLeads} leads
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">
                            Page {currentPage}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={leads.length < pageSize}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Create Lead Dialog */}
            <CreateLeadDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={fetchLeads}
            />
        </div>
    );
}
