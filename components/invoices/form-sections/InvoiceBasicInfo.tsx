"use client";

import { useState, useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { AITextarea } from "@/components/ui/ai-textarea";
import { Label } from "@/components/ui/label";
import { DealProjectLinker } from "../DealProjectLinker";
import { getCompanies } from "@/lib/firestore/companies";
import { getContacts } from "@/lib/firestore/contacts";
import { Company, Contact } from "@/types/crm";
import { Building2, User, Search } from "lucide-react";

export function InvoiceBasicInfo() {
    const form = useFormContext();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [companySearch, setCompanySearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Watch values for logic
    const selectedCompanyId = form.watch("companyId");
    const selectedContactId = form.watch("contactId");

    // Fetch Initial Data
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch all for now (optimize later for large datasets)
                const [companiesData, contactsData] = await Promise.all([
                    getCompanies(),
                    getContacts()
                ]);
                setCompanies(companiesData.companies);
                setContacts(contactsData.contacts);
            } catch (error) {
                console.error("Failed to fetch client data", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Filter Companies
    const filteredCompanies = useMemo(() => {
        if (!companySearch) return companies;
        const lower = companySearch.toLowerCase();
        return companies.filter(c =>
            c.name.toLowerCase().includes(lower) ||
            c.email?.toLowerCase().includes(lower)
        );
    }, [companies, companySearch]);

    // Group Contacts logic
    const { companyContacts, otherContacts } = useMemo(() => {
        if (!selectedCompanyId) return { companyContacts: [], otherContacts: contacts };

        const belongs = contacts.filter(c => c.companyId === selectedCompanyId);
        const others = contacts.filter(c => c.companyId !== selectedCompanyId);
        return { companyContacts: belongs, otherContacts: others };
    }, [contacts, selectedCompanyId]);

    // Handle Selections
    const handleCompanySelect = (companyId: string) => {
        const company = companies.find(c => c.id === companyId);
        if (!company) return;

        form.setValue("companyId", company.id);
        form.setValue("companyName", company.name);

        // Auto-fill Billing Address
        const billingAddr = company.billingAddress;
        const billingAddressStr = billingAddr
            ? (typeof billingAddr === 'string'
                ? billingAddr
                : `${billingAddr.street || ''}, ${billingAddr.city || ''}, ${billingAddr.state || ''} ${billingAddr.zipCode || ''}`.trim())
            : "";
        form.setValue("billingAddress", billingAddressStr);
        form.setValue("shippingAddress", billingAddressStr);

        // Auto-fill Email if no contact selected yet
        // If there's a contact already selected for this company, keep it? No, usually reset contact on company change to be safe
        form.setValue("contactId", "");
        form.setValue("contactName", "");
        form.setValue("clientEmail", company.email || "");
        form.setValue("clientTaxId", ""); // Ideally fetch from company taxId if exists
    };

    const handleContactSelect = (contactId: string) => {
        const contact = contacts.find(c => c.id === contactId);
        if (!contact) return;

        form.setValue("contactId", contact.id);
        form.setValue("contactName", `${contact.firstName} ${contact.lastName}`);
        form.setValue("clientEmail", contact.email || "");

        // If contact belongs to a company, auto-select that company
        if (contact.companyId && contact.companyId !== selectedCompanyId) {
            handleCompanySelect(contact.companyId);
            // Re-set contact because handleCompanySelect clears it
            setTimeout(() => {
                form.setValue("contactId", contact.id);
                form.setValue("contactName", `${contact.firstName} ${contact.lastName}`);
                form.setValue("clientEmail", contact.email || "");
            }, 0);
        }
    };

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Client & Links */}
                <div className="space-y-6">
                    <Card className="border-muted/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Client Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search Company Input */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search companies..."
                                    className="pl-9"
                                    value={companySearch}
                                    onChange={(e) => setCompanySearch(e.target.value)}
                                />
                            </div>

                            {/* Company Dropdown */}
                            <div className="space-y-2">
                                <Label htmlFor="company">Company *</Label>
                                <Select
                                    value={selectedCompanyId || ""}
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

                            {/* Selected Company Address Display */}
                            {selectedCompany && (
                                <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                                    <div className="font-medium text-foreground flex items-center gap-2 mb-1">
                                        <Building2 className="h-3.5 w-3.5" />
                                        {selectedCompany.name}
                                    </div>
                                    <div className="pl-6 space-y-0.5">
                                        {selectedCompany.billingAddress && typeof selectedCompany.billingAddress === 'object' ? (
                                            <>
                                                <p>{selectedCompany.billingAddress.street}</p>
                                                <p>
                                                    {selectedCompany.billingAddress.city}, {selectedCompany.billingAddress.state} {selectedCompany.billingAddress.zipCode}
                                                </p>
                                            </>
                                        ) : (
                                            <p>{(selectedCompany.billingAddress as any) || "No address on file"}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Deal/Project Linker */}
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
                </div>

                {/* Right Column: Invoice Details */}
                <div className="space-y-6">
                    <Card className="dark:bg-slate-900/50 dark:border-slate-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-primary">Invoice Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="invoiceNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Invoice Number</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="INV-0001" className="font-mono" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Draft">Draft</SelectItem>
                                                    <SelectItem value="Sent">Sent</SelectItem>
                                                    <SelectItem value="Paid">Paid</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="paymentTerms"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Terms</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                                                    <SelectItem value="Net 15">Net 15</SelectItem>
                                                    <SelectItem value="Net 30">Net 30</SelectItem>
                                                    <SelectItem value="Net 60">Net 60</SelectItem>
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
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="USD">USD ($)</SelectItem>
                                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                                    <SelectItem value="INR">INR (₹)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Point of Contact Card (New Right Column Position) */}
                    <Card className="border-muted/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Contact Person</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Contact Select */}
                            <div className="space-y-2">
                                <Label htmlFor="contact">Select Contact</Label>
                                <Select
                                    value={selectedContactId || ""}
                                    onValueChange={handleContactSelect}
                                >
                                    <SelectTrigger id="contact">
                                        <SelectValue placeholder="Select contact" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedCompanyId ? (
                                            <>
                                                <SelectGroup>
                                                    <SelectLabel>Company Contacts</SelectLabel>
                                                    {companyContacts.length > 0 ? (
                                                        companyContacts.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                                                        ))
                                                    ) : (
                                                        <div className="p-2 text-sm text-muted-foreground text-center">No company contacts</div>
                                                    )}
                                                </SelectGroup>
                                                <SelectSeparator />
                                                <SelectGroup>
                                                    <SelectLabel>Other Contacts</SelectLabel>
                                                    {otherContacts.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </>
                                        ) : (
                                            contacts.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Email Field */}
                            <FormField
                                control={form.control}
                                name="clientEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="email@client.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Read-only Details (Name & Phone) */}
                            {selectedContactId && contacts.find(c => c.id === selectedContactId) && (
                                <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground">Name</span>
                                        <div className="font-medium flex items-center gap-2">
                                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                                            {contacts.find(c => c.id === selectedContactId)?.firstName} {contacts.find(c => c.id === selectedContactId)?.lastName}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground">Phone</span>
                                        <div className="font-medium">
                                            {contacts.find(c => c.id === selectedContactId)?.phone || "N/A"}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Addresses */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Address Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="billingAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Billing Address</FormLabel>
                                <FormControl>
                                    <AITextarea {...field} placeholder="Bill to..." className="min-h-[100px]" minWords={5} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="shippingAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Shipping Address (Optional)</FormLabel>
                                <FormControl>
                                    <AITextarea {...field} placeholder="Ship to..." className="min-h-[100px]" minWords={5} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
