"use client";

import { useState, useEffect, useCallback, isValidElement, cloneElement, type ReactElement } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AITextarea } from "@/components/ui/ai-textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
    getQuotes, createQuote, updateQuote, deleteQuote, generateQuoteNumber,
} from "@/lib/firestore/quotes";
import { useOrgStore } from "@/store/org";
import { usePermission } from "@/hooks/usePermission";
import { useAuthStore } from "@/store/auth";
import type { Quote, QuoteStatus, QuoteLineItem } from "@/types/crm";
import {
    Plus, Search, FileText, MoreHorizontal, Trash2, Pencil, ChevronLeft,
    ChevronRight, Send, CheckCircle2, XCircle, Clock, AlertCircle,
    Building2, User, Calendar, DollarSign, Minus, Copy, Eye,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { cn, toJsDate } from "@/lib/utils";
import { logger } from "@/lib/logger/client";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<QuoteStatus, { label: string; icon: React.ElementType; className: string }> = {
    Draft: {
        label: "Draft",
        icon: AlertCircle,
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    },
    Sent: {
        label: "Sent",
        icon: Send,
        className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700",
    },
    Accepted: {
        label: "Accepted",
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
    },
    Rejected: {
        label: "Rejected",
        icon: XCircle,
        className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700",
    },
    Expired: {
        label: "Expired",
        icon: Clock,
        className: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700",
    },
};

function StatusBadge({ status }: { status: QuoteStatus }) {
    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                cfg.className,
            )}
        >
            <Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyLine(): QuoteLineItem {
    return { id: crypto.randomUUID(), description: "", quantity: 1, price: 0, taxRate: 0, total: 0 };
}

function recalcLine(items: QuoteLineItem[]): QuoteLineItem[] {
    return items.map((l) => ({ ...l, total: +(l.quantity * l.price * (1 + l.taxRate / 100)).toFixed(2) }));
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormData {
    quoteNumber: string;
    status: QuoteStatus;
    companyName: string;
    contactName: string;
    contactEmail: string;
    issueDate: string;
    expiryDate: string;
    executiveSummary: string;
    notes: string;
    terms: string;
    discount: number;
}

const DEFAULT_FORM: FormData = {
    quoteNumber: "",
    status: "Draft",
    companyName: "",
    contactName: "",
    contactEmail: "",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    executiveSummary: "",
    notes: "",
    terms: "",
    discount: 0,
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QuotesPage() {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const { currentMember } = useOrgStore();
    const { isManager } = usePermission();
    const { user } = useAuthStore();
    const base = `/org/${orgId}`;

    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
    const [saving, setSaving] = useState(false);
    const { confirm, ConfirmDialog } = useConfirm();

    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
    const [lineItems, setLineItems] = useState<QuoteLineItem[]>([emptyLine()]);
    const [activeSection, setActiveSection] = useState<"client" | "scope" | "terms">("client");

    const PAGE_SIZE = 10;
    const canEdit = isManager();

    const fetchQuotes = useCallback(async () => {
        setLoading(true);
        const filters: any = {};
        if (statusFilter !== "all") filters.status = statusFilter;
        if (searchQuery) filters.search = searchQuery;
        const { quotes: fetched, error } = await getQuotes(orgId, filters);
        if (error) logger.error("Quotes load error", { module: "quotes", action: "fetch", orgId, error });
        setQuotes(fetched ?? []);
        setLoading(false);
    }, [orgId, statusFilter, searchQuery]);

    useEffect(() => { setCurrentPage(1); }, [statusFilter, searchQuery]);
    useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

    const openCreate = async () => {
        const qNum = await generateQuoteNumber(orgId);
        setEditingQuote(null);
        setFormData({ ...DEFAULT_FORM, quoteNumber: qNum });
        setLineItems([emptyLine()]);
        setActiveSection("client");
        setDialogOpen(true);
    };

    const openEdit = (quote: Quote) => {
        setEditingQuote(quote);
        setFormData({
            quoteNumber: quote.quoteNumber,
            status: quote.status,
            companyName: quote.companyName || "",
            contactName: quote.contactName || "",
            contactEmail: "",
            issueDate: toJsDate(quote.issueDate)?.toISOString().split("T")[0] ?? "",
            expiryDate: quote.expiryDate ? (toJsDate(quote.expiryDate)?.toISOString().split("T")[0] ?? "") : "",
            executiveSummary: (quote as any).executiveSummary || "",
            notes: quote.notes || "",
            terms: quote.terms || "",
            discount: quote.discount,
        });
        setLineItems(quote.lineItems.length > 0 ? quote.lineItems : [emptyLine()]);
        setActiveSection("client");
        setDialogOpen(true);
    };

    const updateLine = (index: number, field: keyof QuoteLineItem, value: any) => {
        const updated = [...lineItems];
        (updated[index] as any)[field] = value;
        setLineItems(recalcLine(updated));
    };

    const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.price, 0);
    const taxAmount = lineItems.reduce((s, l) => s + l.quantity * l.price * (l.taxRate / 100), 0);
    const total = subtotal + taxAmount - (formData.discount || 0);

    const setField = (key: keyof FormData, value: any) =>
        setFormData((f) => ({ ...f, [key]: value }));

    const quoteContext: Record<string, string> = {};
    if (formData.companyName)  quoteContext["Company"]     = formData.companyName;
    if (formData.contactName)  quoteContext["Contact"]     = formData.contactName;
    if (formData.contactEmail) quoteContext["Email"]       = formData.contactEmail;
    if (formData.quoteNumber)  quoteContext["Proposal #"]  = formData.quoteNumber;
    if (formData.status)       quoteContext["Status"]      = formData.status;
    if (formData.expiryDate)   quoteContext["Valid Until"] = formData.expiryDate;
    const lineDesc = lineItems.filter((l) => l.description.trim()).map((l) => l.description).join(", ");
    if (lineDesc)              quoteContext["Services"]    = lineDesc;
    if (total > 0)             quoteContext["Total Value"] = `$${total.toFixed(2)}`;

    const handleSave = async () => {
        if (!formData.quoteNumber.trim()) return toast.error("Quote number is required.");
        if (lineItems.every((l) => !l.description.trim())) {
            return toast.error("Add at least one line item with a description.");
        }
        setSaving(true);

        const payload: any = {
            ...formData,
            lineItems: recalcLine(lineItems),
            subtotal: +subtotal.toFixed(2),
            taxAmount: +taxAmount.toFixed(2),
            total: +total.toFixed(2),
            issueDate: Timestamp.fromDate(new Date(formData.issueDate)),
            expiryDate: formData.expiryDate ? Timestamp.fromDate(new Date(formData.expiryDate)) : null,
        };

        if (editingQuote) {
            const { error } = await updateQuote(editingQuote.id, payload, orgId);
            if (error) toast.error("Failed to update proposal");
            else { toast.success("Proposal updated"); fetchQuotes(); setDialogOpen(false); }
        } else {
            const { error } = await createQuote(
                payload,
                user?.uid || "",
                user?.displayName || user?.email || "",
                orgId,
            );
            if (error) toast.error("Failed to create proposal");
            else { toast.success("Proposal created"); fetchQuotes(); setDialogOpen(false); }
        }
        setSaving(false);
    };

    const handleDelete = async (quoteId: string) => {
        if (!(await confirm({ title: "Delete Proposal", message: "Delete this proposal?", confirmLabel: "Delete", destructive: true }))) return;
        const { error } = await deleteQuote(quoteId, orgId);
        if (error) toast.error("Failed to delete proposal");
        else { toast.success("Proposal deleted"); fetchQuotes(); }
    };

    const paged = quotes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const totalPages = Math.ceil(quotes.length / PAGE_SIZE);

    const stats = {
        total: quotes.length,
        acceptedValue: quotes.filter((q) => q.status === "Accepted").reduce((s, q) => s + q.total, 0),
        pendingCount: quotes.filter((q) => q.status === "Sent").length,
        winRate: quotes.filter((q) => q.status === "Accepted" || q.status === "Rejected").length > 0
            ? Math.round(
                (quotes.filter((q) => q.status === "Accepted").length /
                    quotes.filter((q) => q.status === "Accepted" || q.status === "Rejected").length) *
                100,
            )
            : null,
    };

    const sections: { id: "client" | "scope" | "terms"; label: string }[] = [
        { id: "client", label: "1. Client & Details" },
        { id: "scope", label: "2. Scope & Pricing" },
        { id: "terms", label: "3. Terms & Summary" },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Proposals"
                breadcrumbs={[{ label: "Dashboard", href: `${base}/dashboard` }, { label: "Proposals" }]}
                description="Create enterprise-grade proposals and track client decisions"
                action={
                    canEdit ? (
                        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 gap-2">
                            <Plus className="h-4 w-4" />
                            New Proposal
                        </Button>
                    ) : undefined
                }
            />

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Proposals" value={stats.total} sub="all time" />
                <StatCard
                    label="Accepted Value"
                    value={`$${stats.acceptedValue.toLocaleString()}`}
                    sub="revenue confirmed"
                    highlight
                />
                <StatCard label="Awaiting Response" value={stats.pendingCount} sub="sent proposals" />
                <StatCard
                    label="Win Rate"
                    value={stats.winRate !== null ? `${stats.winRate}%` : "—"}
                    sub="accepted vs rejected"
                />
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by proposal number, company, or contact…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && fetchQuotes()}
                            className="pl-10"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {(Object.keys(STATUS_CONFIG) as QuoteStatus[]).map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={fetchQuotes} variant="secondary">Search</Button>
                </div>
            </Card>

            {/* Table */}
            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : quotes.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="No proposals yet"
                        description="Create your first proposal to start winning clients."
                        action={canEdit ? { label: "New Proposal", onClick: openCreate } : undefined}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="font-semibold">Proposal #</TableHead>
                                    <TableHead className="font-semibold">Client</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold text-right">Value</TableHead>
                                    <TableHead className="font-semibold">Issue Date</TableHead>
                                    <TableHead className="font-semibold">Expiry</TableHead>
                                    {canEdit && <TableHead className="text-right" />}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paged.map((quote) => (
                                    <TableRow key={quote.id} className="hover:bg-muted/20 transition-colors">
                                        <TableCell className="font-mono font-semibold text-primary">
                                            {quote.quoteNumber}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{quote.companyName || quote.contactName || "—"}</p>
                                                {quote.companyName && quote.contactName && (
                                                    <p className="text-xs text-muted-foreground">{quote.contactName}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={quote.status} />
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            ${quote.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {(() => { const d = toJsDate(quote.issueDate); return d ? format(d, "d MMM yyyy") : "-"; })()}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {(() => { const d = toJsDate(quote.expiryDate); return d ? format(d, "d MMM yyyy") : "—"; })()}
                                        </TableCell>
                                        {canEdit && (
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEdit(quote)}>
                                                            <Pencil className="h-4 w-4 mr-2" />Edit Proposal
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDelete(quote.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {Math.min((currentPage - 1) * PAGE_SIZE + 1, quotes.length)}–
                        {Math.min(currentPage * PAGE_SIZE, quotes.length)} of {quotes.length} proposals
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4" />Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                            Next<ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Proposal Builder Dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[92vh] p-0 flex flex-col overflow-hidden">
                    {/* Dialog header */}
                    <div className="px-8 pt-7 pb-4 border-b border-border shrink-0">
                        <DialogHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <DialogTitle className="text-xl font-bold">
                                        {editingQuote ? "Edit Proposal" : "New Proposal"}
                                    </DialogTitle>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {editingQuote
                                            ? "Update the proposal details and pricing."
                                            : "Build a professional proposal for your client."}
                                    </p>
                                </div>
                                {/* Quote number + status */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Proposal #</p>
                                        <p className="font-mono font-bold text-primary">{formData.quoteNumber}</p>
                                    </div>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(v) => setField("status", v as QuoteStatus)}
                                    >
                                        <SelectTrigger className="w-[130px] h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(Object.keys(STATUS_CONFIG) as QuoteStatus[]).map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Section tabs */}
                            <div className="flex gap-1 mt-5">
                                {sections.map((sec) => (
                                    <button
                                        key={sec.id}
                                        onClick={() => setActiveSection(sec.id)}
                                        className={cn(
                                            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                                            activeSection === sec.id
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted",
                                        )}
                                    >
                                        {sec.label}
                                    </button>
                                ))}
                            </div>
                        </DialogHeader>
                    </div>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto px-8 py-6">

                        {/* ── Section 1: Client & Details ── */}
                        {activeSection === "client" && (
                            <div className="space-y-6">
                                <SectionHeading
                                    icon={<Building2 className="h-5 w-5" />}
                                    title="Client Information"
                                    description="Who is this proposal addressed to?"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Company / Organisation" required>
                                        <Input
                                            placeholder="Acme Corporation"
                                            value={formData.companyName}
                                            onChange={(e) => setField("companyName", e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Primary Contact Name">
                                        <Input
                                            placeholder="Jane Smith"
                                            value={formData.contactName}
                                            onChange={(e) => setField("contactName", e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Contact Email">
                                        <Input
                                            type="email"
                                            placeholder="jane@acme.com"
                                            value={formData.contactEmail}
                                            onChange={(e) => setField("contactEmail", e.target.value)}
                                        />
                                    </Field>
                                </div>

                                <Separator />

                                <SectionHeading
                                    icon={<Calendar className="h-5 w-5" />}
                                    title="Proposal Dates"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Issue Date" required>
                                        <Input
                                            type="date"
                                            value={formData.issueDate}
                                            onChange={(e) => setField("issueDate", e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Valid Until">
                                        <Input
                                            type="date"
                                            value={formData.expiryDate}
                                            onChange={(e) => setField("expiryDate", e.target.value)}
                                        />
                                    </Field>
                                </div>

                                <Separator />

                                <div>
                                    <SectionHeading
                                        icon={<Eye className="h-5 w-5" />}
                                        title="Executive Summary"
                                        description="A compelling opening that sets the tone for the proposal."
                                    />
                                    <div className="mt-3">
                                        <AITextarea
                                            placeholder="Provide a high-level overview of the engagement and the value you will deliver…"
                                            value={formData.executiveSummary}
                                            onChange={(e) => setField("executiveSummary", e.target.value)}
                                            rows={5}
                                            className="resize-none text-sm"
                                            context={quoteContext}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Section 2: Scope & Pricing ── */}
                        {activeSection === "scope" && (
                            <div className="space-y-6">
                                <SectionHeading
                                    icon={<DollarSign className="h-5 w-5" />}
                                    title="Services & Deliverables"
                                    description="Define each service, unit price, and applicable tax."
                                />

                                {/* Line items table */}
                                <div className="rounded-xl border border-border overflow-hidden">
                                    <div className="grid grid-cols-12 gap-0 bg-muted/50 px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <span className="col-span-5">Description</span>
                                        <span className="col-span-2 text-center">Qty</span>
                                        <span className="col-span-2 text-right">Unit Price</span>
                                        <span className="col-span-1 text-center">Tax%</span>
                                        <span className="col-span-1 text-right">Total</span>
                                        <span className="col-span-1" />
                                    </div>

                                    {lineItems.map((line, i) => (
                                        <div
                                            key={line.id}
                                            className="grid grid-cols-12 gap-2 items-center px-4 py-2.5 border-t border-border"
                                        >
                                            <Input
                                                className="col-span-5 h-8 text-sm"
                                                placeholder="e.g. Website Design & Development"
                                                value={line.description}
                                                onChange={(e) => updateLine(i, "description", e.target.value)}
                                            />
                                            <Input
                                                className="col-span-2 h-8 text-sm text-center"
                                                type="number"
                                                min={1}
                                                value={line.quantity}
                                                onChange={(e) => updateLine(i, "quantity", Number(e.target.value))}
                                            />
                                            <div className="col-span-2 relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                                <Input
                                                    className="h-8 text-sm text-right pl-6"
                                                    type="number"
                                                    min={0}
                                                    step={0.01}
                                                    value={line.price}
                                                    onChange={(e) => updateLine(i, "price", Number(e.target.value))}
                                                />
                                            </div>
                                            <Input
                                                className="col-span-1 h-8 text-sm text-center"
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={line.taxRate}
                                                onChange={(e) => updateLine(i, "taxRate", Number(e.target.value))}
                                            />
                                            <span className="col-span-1 text-right text-sm font-semibold">
                                                ${recalcLine([line])[0].total.toFixed(2)}
                                            </span>
                                            <div className="col-span-1 flex justify-end">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    onClick={() => setLineItems((l) => l.filter((_, idx) => idx !== i))}
                                                    disabled={lineItems.length === 1}
                                                >
                                                    <Minus className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="px-4 py-3 border-t border-border">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 text-xs"
                                            onClick={() => setLineItems((l) => [...l, emptyLine()])}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add Line Item
                                        </Button>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="flex justify-end">
                                    <div className="w-full max-w-xs space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Tax</span>
                                            <span>${taxAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Discount ($)</span>
                                            <Input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                className="w-24 h-7 text-right text-sm"
                                                value={formData.discount}
                                                onChange={(e) => setField("discount", Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                                            <span>Total</span>
                                            <span className="text-primary">${total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Internal notes */}
                                <Field label="Internal Notes" description="Not visible to the client.">
                                    <AITextarea
                                        placeholder="Add any internal comments about this proposal…"
                                        value={formData.notes}
                                        onChange={(e) => setField("notes", e.target.value)}
                                        rows={3}
                                        className="resize-none text-sm"
                                        context={quoteContext}
                                    />
                                </Field>
                            </div>
                        )}

                        {/* ── Section 3: Terms & Summary ── */}
                        {activeSection === "terms" && (
                            <div className="space-y-6">
                                <div>
                                    <SectionHeading
                                        icon={<FileText className="h-5 w-5" />}
                                        title="Payment Terms & Conditions"
                                        description="Define how and when payment is expected."
                                    />
                                    <div className="mt-3">
                                        <AITextarea
                                            placeholder="e.g. 50% upfront deposit, 50% upon delivery. Net 30 payment terms…"
                                            value={formData.terms}
                                            onChange={(e) => setField("terms", e.target.value)}
                                            rows={6}
                                            className="resize-none text-sm"
                                            context={quoteContext}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Proposal summary */}
                                <div className="rounded-xl bg-muted/40 border border-border p-5 space-y-3">
                                    <h4 className="font-semibold text-sm">Proposal Summary</h4>
                                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                                        <span className="text-muted-foreground">Proposal #</span>
                                        <span className="font-mono font-semibold text-primary">{formData.quoteNumber}</span>
                                        <span className="text-muted-foreground">Client</span>
                                        <span>{formData.companyName || formData.contactName || "—"}</span>
                                        <span className="text-muted-foreground">Issue Date</span>
                                        <span>{formData.issueDate ? format(new Date(formData.issueDate), "d MMM yyyy") : "—"}</span>
                                        <span className="text-muted-foreground">Valid Until</span>
                                        <span>{formData.expiryDate ? format(new Date(formData.expiryDate), "d MMM yyyy") : "—"}</span>
                                        <span className="text-muted-foreground">Line Items</span>
                                        <span>{lineItems.filter((l) => l.description).length}</span>
                                        <span className="text-muted-foreground font-semibold">Total Value</span>
                                        <span className="font-bold text-primary text-base">${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dialog footer */}
                    <div className="px-8 py-4 border-t border-border shrink-0 flex items-center justify-between gap-4 bg-background">
                        <div className="flex gap-2">
                            {activeSection !== "client" && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setActiveSection(activeSection === "terms" ? "scope" : "client")
                                    }
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />Back
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            {activeSection !== "terms" ? (
                                <Button
                                    onClick={() =>
                                        setActiveSection(activeSection === "client" ? "scope" : "terms")
                                    }
                                    className="gap-1.5"
                                >
                                    Continue
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary/90 gap-2 min-w-[140px]"
                                >
                                    {saving ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                    )}
                                    {editingQuote ? "Save Changes" : "Create Proposal"}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <ConfirmDialog />
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    sub,
    highlight,
}: {
    label: string;
    value: string | number;
    sub: string;
    highlight?: boolean;
}) {
    return (
        <Card className={cn(highlight && "border-primary/30 bg-primary/5")}>
            <CardContent className="pt-5 pb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {label}
                </p>
                <p className={cn("text-2xl font-bold", highlight && "text-primary")}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
        </Card>
    );
}

function SectionHeading({
    icon,
    title,
    description,
}: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
}) {
    return (
        <div className="flex items-start gap-2.5 mb-0">
            {icon && <span className="text-primary mt-0.5 shrink-0">{icon}</span>}
            <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                {description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                )}
            </div>
        </div>
    );
}

function Field({
    label,
    required,
    description,
    children,
}: {
    label: string;
    required?: boolean;
    description?: string;
    children: React.ReactNode;
}) {
    // The Label here had no `htmlFor`, so it was never programmatically
    // associated with its input — invisible to screen readers and to
    // `getByLabel`-style lookups. Derive a stable id from the label text
    // and wire it onto both the Label and its (single) child control.
    const fieldId = `proposal-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
    const child = isValidElement(children)
        ? cloneElement(children as ReactElement<{ id?: string }>, { id: fieldId })
        : children;
    return (
        <div className="space-y-1.5">
            <Label htmlFor={fieldId} className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {child}
        </div>
    );
}
