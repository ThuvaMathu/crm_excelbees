"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CreateCompanyDialog } from "@/components/companies/CreateCompanyDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { getCompanies } from "@/lib/firestore/companies";
import { useAuth } from "@/hooks/useAuth";
import type { Company } from "@/types/crm";
import {
    Plus,
    Search,
    Building2,
    Eye,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function CompaniesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCompanies, setTotalCompanies] = useState(0);
    const pageSize = 10;

    // Role-based access - only admin/manager can see financial data
    const canViewFinancials = user?.role === "admin" || user?.role === "manager";

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const filters: any = {};

            if (searchQuery) {
                filters.search = searchQuery;
            }

            const { companies: fetchedCompanies, error } = await getCompanies(filters, {
                pageSize,
                page: currentPage,
            });

            if (error) {
                console.error("Error fetching companies:", error);
                setCompanies([]);
            } else {
                setCompanies(fetchedCompanies);
                setTotalCompanies(fetchedCompanies.length);
            }
        } catch (error) {
            console.error("Failed to fetch companies:", error);
            setCompanies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const handleSearch = () => {
        fetchCompanies();
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Companies"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Companies" },
                ]}
                description="Manage your business accounts and organizations"
                action={
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="bg-primary hover:bg-primary/90 gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Company
                    </Button>
                }
            />

            {/* Search */}
            <Card className="p-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search companies by name, domain, or industry..."
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
            </Card>

            {/* Companies Table */}
            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : companies.length === 0 ? (
                    <EmptyState
                        icon={Building2}
                        title="No companies found"
                        description="Get started by creating your first company account."
                        action={{
                            label: "Create Company",
                            onClick: () => setCreateDialogOpen(true),
                        }}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company Name</TableHead>
                                    <TableHead>Domain</TableHead>
                                    <TableHead>Industry</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Revenue</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {companies.map((company) => (
                                    <TableRow key={company.id}>
                                        <TableCell className="font-medium">
                                            {company.name}
                                        </TableCell>
                                        <TableCell>{company.domain || "-"}</TableCell>
                                        <TableCell>{company.industry || "-"}</TableCell>
                                        <TableCell>{company.size || "-"}</TableCell>
                                        <TableCell>
                                            {company.annualRevenue
                                                ? (canViewFinancials ? `$${company.annualRevenue.toLocaleString()}` : "$•••")
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {format(company.createdAt.toDate(), "MMM d, yyyy")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/companies/${company.id}`}>
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
            {companies.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {Math.min((currentPage - 1) * pageSize + 1, totalCompanies)} to {Math.min(currentPage * pageSize, totalCompanies)} of {totalCompanies} companies
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
                            disabled={companies.length < pageSize}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Create Company Dialog */}
            <CreateCompanyDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={fetchCompanies}
            />
        </div>
    );
}
