"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CreateContactDialog } from "@/components/contacts/CreateContactDialog";
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
import { useAuth } from "@/hooks/useAuth";
import type { Contact } from "@/types/crm";
import {
    Plus,
    Search,
    Users,
    Eye,
    Upload,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function ContactsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const filters: any = {};

            if (searchQuery) {
                filters.search = searchQuery;
            }

            const { contacts: fetchedContacts, error } = await getContacts(filters);

            if (error) {
                console.error("Error fetching contacts:", error);
                setContacts([]);
            } else {
                setContacts(fetchedContacts);
            }
        } catch (error) {
            console.error("Failed to fetch contacts:", error);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = () => {
        fetchContacts();
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Contacts"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Contacts" },
                ]}
                description="Manage your business contacts"
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => { }}
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
                    </div>
                }
            />

            {/* Search */}
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

            {/* Contacts Table */}
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
                        action={{
                            label: "Create Contact",
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
                                        <TableCell className="font-medium">
                                            {contact.firstName} {contact.lastName}
                                        </TableCell>
                                        <TableCell>{contact.email}</TableCell>
                                        <TableCell>{contact.phone || "-"}</TableCell>
                                        <TableCell>{contact.companyName || "-"}</TableCell>
                                        <TableCell>{contact.jobTitle || "-"}</TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {format(contact.createdAt.toDate(), "MMM d, yyyy")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/contacts/${contact.id}`}>
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

            {/* Create Contact Dialog */}
            <CreateContactDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={fetchContacts}
            />
        </div>
    );
}
