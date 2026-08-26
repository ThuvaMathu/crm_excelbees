"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getCompanies } from "@/lib/firestore/companies";
import { getContacts } from "@/lib/firestore/contacts";
import { useOrgStore } from "@/store/org";
import type { Company, Contact } from "@/types/crm";
import { Search, Building2, User, Mail, MapPin } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ClientSelectorProps {
    onClientSelect: (client: {
        companyId?: string;
        companyName?: string;
        contactId?: string;
        contactName?: string;
        clientEmail?: string;
        billingAddress?: string;
    }) => void;
    selectedCompanyId?: string;
    selectedContactId?: string;
}

export function ClientSelector({
    onClientSelect,
    selectedCompanyId,
    selectedContactId,
}: ClientSelectorProps) {
    const { currentOrg } = useOrgStore();
    const organizationId = currentOrg?.id;
    const [companies, setCompanies] = useState<Company[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [companiesResult, contactsResult] = await Promise.all([
            getCompanies(organizationId),
            getContacts(organizationId),
        ]);

        if (!companiesResult.error) {
            setCompanies(companiesResult.companies);
        }
        if (!contactsResult.error) {
            setContacts(contactsResult.contacts);
        }
        setLoading(false);
    };

    const handleCompanySelect = (companyId: string) => {
        const company = companies.find((c) => c.id === companyId);
        if (company) {
            setSelectedCompany(company);

            // Find contacts for this company
            const companyContacts = contacts.filter((c) => c.companyId === companyId);

            // Auto-select first contact if available
            if (companyContacts.length > 0) {
                handleContactSelect(companyContacts[0].id, company);
            } else {
                const billingAddr = company.billingAddress;
                const billingAddressStr = billingAddr
                    ? (typeof billingAddr === 'string'
                        ? billingAddr
                        : `${billingAddr.street || ''}, ${billingAddr.city || ''}, ${billingAddr.state || ''} ${billingAddr.zipCode || ''}`.trim())
                    : undefined;

                onClientSelect({
                    companyId: company.id,
                    companyName: company.name,
                    billingAddress: billingAddressStr,
                });
            }
        }
    };
    const handleContactSelect = (contactId: string, companyOverride?: Company) => {
        const contact = contacts.find((c) => c.id === contactId);
        if (contact) {
            setSelectedContact(contact);

            // `companyOverride` covers the auto-select-first-contact path in
            // handleCompanySelect(), which calls this synchronously right
            // after setSelectedCompany() — the `selectedCompany` state
            // variable hasn't re-rendered yet at that point and is still
            // the *previous* value (null on a first selection), so reading
            // it here sent `companyName: undefined` on every company that
            // had any contacts, silently failing the invoice form's
            // required companyName field.
            const company = companyOverride ?? selectedCompany;
            const billingAddr = company?.billingAddress;
            const billingAddressStr = billingAddr
                ? (typeof billingAddr === 'string'
                    ? billingAddr
                    : `${billingAddr.street || ''}, ${billingAddr.city || ''}, ${billingAddr.state || ''} ${billingAddr.zipCode || ''}`.trim())
                : undefined;

            onClientSelect({
                companyId: company?.id,
                companyName: company?.name,
                contactId: contact.id,
                contactName: `${contact.firstName} ${contact.lastName}`,
                clientEmail: contact.email,
                billingAddress: billingAddressStr,
            });
        }
    };

    const filteredCompanies = companies.filter((company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const companyContacts = selectedCompany
        ? contacts.filter((c) => c.companyId === selectedCompany.id)
        : [];

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <LoadingSpinner />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Company Search */}
                <div className="space-y-2">
                    <Label htmlFor="company-search">Search Company</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="company-search"
                            placeholder="Search companies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9  dark:border-gray-700"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Company Select */}
                    <div className="space-y-2">
                        <Label htmlFor="company">Company *</Label>
                        <Select
                            value={selectedCompany?.id}
                            onValueChange={handleCompanySelect}
                        >
                            <SelectTrigger id="company">
                                <SelectValue placeholder="Select a company" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredCompanies.map((company) => (
                                    <SelectItem key={company.id} value={company.id}>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            {company.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Contact Select */}
                    <div className="space-y-2">
                        <Label htmlFor="contact">Contact Person</Label>
                        <Select
                            value={selectedContact?.id}
                            onValueChange={handleContactSelect}
                            disabled={!selectedCompany || companyContacts.length === 0}
                        >
                            <SelectTrigger id="contact">
                                <SelectValue placeholder={
                                    !selectedCompany
                                        ? "Select company first"
                                        : companyContacts.length === 0
                                            ? "No contacts found"
                                            : "Select a contact"
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {companyContacts.length > 0 ? (
                                    companyContacts.map((contact) => (
                                        <SelectItem key={contact.id} value={contact.id}>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                {contact.firstName} {contact.lastName}
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="no_contacts" disabled>No contacts available</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Selected Client Info Display */}
                {selectedCompany && (
                    <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                        <h4 className="font-semibold text-sm">Bill To:</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedCompany.name}</span>
                            </div>
                            {selectedContact && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {selectedContact.firstName} {selectedContact.lastName}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedContact.email}</span>
                                    </div>
                                </>
                            )}
                            {selectedCompany.billingAddress && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <span className="whitespace-pre-wrap">
                                        {typeof selectedCompany.billingAddress === 'string'
                                            ? selectedCompany.billingAddress
                                            : `${selectedCompany.billingAddress.street || ''}\n${selectedCompany.billingAddress.city || ''}, ${selectedCompany.billingAddress.state || ''} ${selectedCompany.billingAddress.zipCode || ''}`.trim()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
