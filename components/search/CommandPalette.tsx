"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, FileText, Users, Building2, Handshake, Briefcase, CheckSquare, DollarSign } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getLeads } from "@/lib/firestore/leads";
import { getContacts } from "@/lib/firestore/contacts";
import { getCompanies } from "@/lib/firestore/companies";
import { getDeals } from "@/lib/firestore/deals";
import { getProjects } from "@/lib/firestore/projects";
import { getTasks } from "@/lib/firestore/tasks";
import { getInvoices } from "@/lib/firestore/invoices";

interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    type: "lead" | "contact" | "company" | "deal" | "project" | "task" | "invoice";
    url: string;
}

import { useUIStore } from "@/store/ui";

export function CommandPalette() {
    const router = useRouter();
    const { isSearchOpen, setSearchOpen, toggleSearch } = useUIStore();
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    // Keyboard shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggleSearch();
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [toggleSearch]);

    // Search function
    const performSearch = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        const searchResults: SearchResult[] = [];

        try {
            // Search all collections in parallel
            const [leads, contacts, companies, deals, projects, tasks, invoices] = await Promise.all([
                getLeads({ search: query }),
                getContacts({ search: query }),
                getCompanies({ search: query }),
                getDeals({ search: query }),
                getProjects({ search: query }),
                getTasks({ search: query }),
                getInvoices({ search: query }),
            ]);

            // Add leads
            leads.leads.slice(0, 5).forEach((lead) => {
                searchResults.push({
                    id: lead.id,
                    title: `${lead.firstName} ${lead.lastName}`,
                    subtitle: lead.email,
                    type: "lead",
                    url: `/leads/${lead.id}`,
                });
            });

            // Add contacts
            contacts.contacts.slice(0, 5).forEach((contact) => {
                searchResults.push({
                    id: contact.id,
                    title: `${contact.firstName} ${contact.lastName}`,
                    subtitle: contact.email,
                    type: "contact",
                    url: `/contacts/${contact.id}`,
                });
            });

            // Add companies
            companies.companies.slice(0, 5).forEach((company) => {
                searchResults.push({
                    id: company.id,
                    title: company.name,
                    subtitle: company.industry,
                    type: "company",
                    url: `/companies/${company.id}`,
                });
            });

            // Add deals
            deals.deals.slice(0, 5).forEach((deal) => {
                searchResults.push({
                    id: deal.id,
                    title: deal.title,
                    subtitle: `$${deal.value.toLocaleString()}`,
                    type: "deal",
                    url: `/deals/${deal.id}`,
                });
            });

            // Add projects
            projects.projects.slice(0, 5).forEach((project) => {
                searchResults.push({
                    id: project.id,
                    title: project.name,
                    subtitle: project.status,
                    type: "project",
                    url: `/projects/${project.id}`,
                });
            });

            // Add tasks
            tasks.tasks.slice(0, 5).forEach((task) => {
                searchResults.push({
                    id: task.id,
                    title: task.title,
                    subtitle: task.status,
                    type: "task",
                    url: `/tasks/${task.id}`,
                });
            });

            // Add invoices
            invoices.invoices.slice(0, 5).forEach((invoice) => {
                searchResults.push({
                    id: invoice.id,
                    title: invoice.invoiceNumber,
                    subtitle: `$${invoice.total.toLocaleString()}`,
                    type: "invoice",
                    url: `/invoices/${invoice.id}`,
                });
            });

            setResults(searchResults);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search, performSearch]);

    const handleSelect = (url: string) => {
        setSearchOpen(false);
        setSearch("");
        router.push(url);
    };

    const getIcon = (type: string) => {
        const icons: Record<string, React.ReactElement> = {
            lead: <Users className="h-4 w-4" />,
            contact: <Users className="h-4 w-4" />,
            company: <Building2 className="h-4 w-4" />,
            deal: <Handshake className="h-4 w-4" />,
            project: <Briefcase className="h-4 w-4" />,
            task: <CheckSquare className="h-4 w-4" />,
            invoice: <DollarSign className="h-4 w-4" />,
        };
        return icons[type] || <FileText className="h-4 w-4" />;
    };

    // Group results by type
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.type]) {
            acc[result.type] = [];
        }
        acc[result.type].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    return (
        <Dialog open={isSearchOpen} onOpenChange={setSearchOpen}>
            <DialogContent className="p-0 max-w-2xl">
                <Command className="rounded-lg border shadow-md">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Command.Input
                            placeholder="Search leads, contacts, deals..."
                            value={search}
                            onValueChange={setSearch}
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <Command.List className="max-h-[400px] overflow-y-auto p-2">
                        {loading && (
                            <Command.Loading>
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    Searching...
                                </div>
                            </Command.Loading>
                        )}

                        {!loading && search && results.length === 0 && (
                            <Command.Empty>
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No results found.
                                </div>
                            </Command.Empty>
                        )}

                        {!loading && results.length > 0 && (
                            <>
                                {Object.entries(groupedResults).map(([type, items]) => (
                                    <Command.Group key={type} heading={type.charAt(0).toUpperCase() + type.slice(1) + "s"}>
                                        {items.map((result) => (
                                            <Command.Item
                                                key={result.id}
                                                value={result.id}
                                                onSelect={() => handleSelect(result.url)}
                                                className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-sm hover:bg-accent"
                                            >
                                                {getIcon(result.type)}
                                                <div className="flex-1">
                                                    <div className="font-medium">{result.title}</div>
                                                    {result.subtitle && (
                                                        <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                                                    )}
                                                </div>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                ))}
                            </>
                        )}

                        {!search && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                <p>Type to search across all modules</p>
                                <p className="text-xs mt-2">Leads • Contacts • Companies • Deals • Projects • Tasks • Invoices</p>
                            </div>
                        )}
                    </Command.List>
                    <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>{" "}
                        to open • <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            ESC
                        </kbd>{" "}
                        to close
                    </div>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
