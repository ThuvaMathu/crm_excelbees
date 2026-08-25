"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CreateContactDialog } from "@/components/contacts/CreateContactDialog";
import { ImportCSVDialog } from "@/components/contacts/ImportCSVDialog";
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
import { getContacts } from "@/lib/firestore/contacts";
import { toJsDate } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import type { Contact } from "@/types/crm";
import {
    Plus,
    Search,
    Users,
    Eye,
    Upload,
    Mail,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { EmailComposeModal } from "@/components/email/EmailComposeModal";
import { RBACGuard } from "@/components/auth/RBACGuard";
import { logger } from "@/lib/logger/client";

export default function ContactsPage() {
    return (
        <RBACGuard requirePermission={{ module: "contacts", action: "read" }}>
            <ContactsPageContent />
        </RBACGuard>
    );
}

function ContactsPageContent() {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const { can } = usePermission();
    const canCreate = can("contacts", "create");
    const base = `/org/${orgId}`;
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalContacts, setTotalContacts] = useState(0);
    const pageSize = 10;

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const filters: any = {};

            if (searchQuery) {
                filters.search = searchQuery;
            }

            const { contacts: fetchedContacts, error } = await getContacts(orgId, {
                ...filters,
                pageSize,
                page: currentPage,
            });

            if (error) {
                logger.error("Error fetching contacts", { module: "contacts", action: "fetch", orgId, error });
                setContacts([]);
            } else {
                setContacts(fetchedContacts);
                setTotalContacts(fetchedContacts.length);
            }
        } catch (error) {
            logger.error("Failed to fetch contacts", { module: "contacts", action: "fetch", orgId, error });
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [currentPage]);

    const handleSearch = () => {
        fetchContacts();
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(contacts.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkEmail = () => {
        if (selectedIds.size === 0) return;
        setIsEmailModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Contacts"
                breadcrumbs={[
                    { label: "Dashboard", href: `${base}/dashboard` },
                    { label: "Contacts" },
                ]}
                description="Manage your business contacts"
                action={
                    <div className="flex gap-2">
                        {selectedIds.size > 0 && (
                            <Button variant="secondary" onClick={handleBulkEmail} className="gap-2">
                                <Mail className="h-4 w-4" />
                                Email ({selectedIds.size})
                            </Button>
                        )}
                        {canCreate && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setImportDialogOpen(true)}
                                    className="gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    Import CSV
                                </Button>
                                <Button
                                    onClick={() => setCreateDialogOpen(true)}
                                    className="bg-primary hover:bg-primary/90 gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Contact
                                </Button>
                            </>
                        )}
                    </div>
                }
            />

            <Card className="p-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search contacts by name, email, or company..."
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

            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : contacts.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No contacts found"
                        description="Get started by creating your first contact or import from CSV."
                        action={canCreate ? {
                            label: "Create Contact",
                            onClick: () => setCreateDialogOpen(true),
                        } : undefined}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={contacts.length > 0 && selectedIds.size === contacts.length}
                                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                        />
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Job Title</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.map((contact) => (
                                    <TableRow key={contact.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.has(contact.id)}
                                                onCheckedChange={(checked) => handleSelectOne(contact.id, checked as boolean)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {contact.firstName} {contact.lastName}
                                        </TableCell>
                                        <TableCell>{contact.email}</TableCell>
                                        <TableCell>{contact.phone || "-"}</TableCell>
                                        <TableCell>{contact.companyName || "-"}</TableCell>
                                        <TableCell>{contact.jobTitle || "-"}</TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {(() => { const d = toJsDate(contact.createdAt); return d ? format(d, "MMM d, yyyy") : "-"; })()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`${base}/contacts/${contact.id}`}>
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

            {contacts.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {Math.min((currentPage - 1) * pageSize + 1, totalContacts)} to {Math.min(currentPage * pageSize, totalContacts)} of {totalContacts} contacts
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
                            disabled={contacts.length < pageSize}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <CreateContactDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={fetchContacts}
            />

            <EmailComposeModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                context={{ type: 'general' }}
                initialRecipients={contacts.filter(c => selectedIds.has(c.id)).map(c => ({
                    email: c.email,
                    name: `${c.firstName} ${c.lastName}`,
                    contactId: c.id,
                    isValid: true
                }))}
                isBulkMode={true}
            />

            <ImportCSVDialog
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
                onSuccess={fetchContacts}
                organizationId={orgId}
            />
        </div>
    );
}
