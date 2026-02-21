"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
    Search,
    FileText,
    Users,
    Building2,
    Handshake,
    Briefcase,
    CheckSquare,
    DollarSign,
    Loader2,
} from "lucide-react";
import { getLeads } from "@/lib/firestore/leads";
import { getContacts } from "@/lib/firestore/contacts";
import { getCompanies } from "@/lib/firestore/companies";
import { getDeals } from "@/lib/firestore/deals";
import { getProjects } from "@/lib/firestore/projects";
import { getTasks } from "@/lib/firestore/tasks";
import { getInvoices } from "@/lib/firestore/invoices";
import { useUIStore } from "@/store/ui";

interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    type: "lead" | "contact" | "company" | "deal" | "project" | "task" | "invoice";
    url: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    lead: <Users className="h-4 w-4 text-blue-500" />,
    contact: <Users className="h-4 w-4 text-green-500" />,
    company: <Building2 className="h-4 w-4 text-purple-500" />,
    deal: <Handshake className="h-4 w-4 text-amber-500" />,
    project: <Briefcase className="h-4 w-4 text-cyan-500" />,
    task: <CheckSquare className="h-4 w-4 text-pink-500" />,
    invoice: <DollarSign className="h-4 w-4 text-emerald-500" />,
};

const TYPE_LABELS: Record<string, string> = {
    lead: "Leads",
    contact: "Contacts",
    company: "Companies",
    deal: "Deals",
    project: "Projects",
    task: "Tasks",
    invoice: "Invoices",
};

export function CommandPalette() {
    const router = useRouter();
    const { isSearchOpen, setSearchOpen, toggleSearch } = useUIStore();
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    // Keyboard shortcut: Cmd+K / Ctrl+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                e.stopPropagation();
                toggleSearch();
            }
        };

        document.addEventListener("keydown", down, true);
        return () => document.removeEventListener("keydown", down, true);
    }, [toggleSearch]);

    // Reset state when dialog closes
    useEffect(() => {
        if (!isSearchOpen) {
            setSearch("");
            setResults([]);
        }
    }, [isSearchOpen]);

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
                getLeads({ search: query }).catch(() => ({ leads: [] })),
                getContacts({ search: query }).catch(() => ({ contacts: [] })),
                getCompanies({ search: query }).catch(() => ({ companies: [] })),
                getDeals({ search: query }).catch(() => ({ deals: [] })),
                getProjects({ search: query }).catch(() => ({ projects: [] })),
                getTasks({ search: query }).catch(() => ({ tasks: [] })),
                getInvoices({ search: query }).catch(() => ({ invoices: [] })),
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
                    subtitle: `$${deal.value?.toLocaleString() ?? "0"}`,
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
                    subtitle: `$${invoice.total?.toLocaleString() ?? "0"}`,
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
        setResults([]);
        router.push(url);
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
        <Command.Dialog
            open={isSearchOpen}
            onOpenChange={setSearchOpen}
            label="Global Search"
            shouldFilter={false}
            className="fixed inset-0 z-50"
        >
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSearchOpen(false)}
            />

            {/* Dialog Content */}
            <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%]">
                <div className="rounded-lg border bg-background shadow-2xl overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center border-b px-4">
                        <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                        <Command.Input
                            placeholder="Search leads, contacts, companies, deals..."
                            value={search}
                            onValueChange={setSearch}
                            className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        {loading && (
                            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                        )}
                    </div>

                    {/* Results */}
                    <Command.List className="max-h-[400px] overflow-y-auto p-2">
                        {/* Loading state */}
                        {loading && results.length === 0 && (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Searching across all modules...
                            </div>
                        )}

                        {/* Empty state */}
                        {!loading && search.length >= 2 && results.length === 0 && (
                            <Command.Empty>
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No results found for &ldquo;{search}&rdquo;
                                </div>
                            </Command.Empty>
                        )}

                        {/* Results grouped by type */}
                        {results.length > 0 &&
                            Object.entries(groupedResults).map(([type, items]) => (
                                <Command.Group
                                    key={type}
                                    heading={TYPE_LABELS[type] || type}
                                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                                >
                                    {items.map((result) => (
                                        <Command.Item
                                            key={result.id}
                                            value={`${result.type}-${result.id}`}
                                            onSelect={() => handleSelect(result.url)}
                                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md text-sm hover:bg-accent aria-selected:bg-accent transition-colors"
                                        >
                                            <span className="flex-shrink-0">
                                                {TYPE_ICONS[result.type] || <FileText className="h-4 w-4" />}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{result.title}</div>
                                                {result.subtitle && (
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {result.subtitle}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground capitalize flex-shrink-0">
                                                {result.type}
                                            </span>
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            ))}

                        {/* Default state - no search query */}
                        {!search && (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                <p className="font-medium">Type to search across all modules</p>
                                <p className="text-xs mt-2 opacity-70">
                                    Leads • Contacts • Companies • Deals • Projects • Tasks • Invoices
                                </p>
                            </div>
                        )}

                        {/* Minimum characters hint */}
                        {search && search.length < 2 && (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Type at least 2 characters to search...
                            </div>
                        )}
                    </Command.List>

                    {/* Footer */}
                    <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                                    ↑↓
                                </kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                                    ↵
                                </kbd>
                                Open
                            </span>
                        </div>
                        <span className="flex items-center gap-1">
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                                ESC
                            </kbd>
                            Close
                        </span>
                    </div>
                </div>
            </div>
        </Command.Dialog>
    );
}
