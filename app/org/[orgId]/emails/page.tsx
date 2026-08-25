"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmailComposeModal } from "@/components/email/EmailComposeModal";
import {
    getEmails,
    deleteEmail,
    updateEmail,
} from "@/lib/firestore/emails";
import {
    getTemplates,
    deleteTemplate,
    updateTemplate,
    createTemplate,
} from "@/lib/firestore/email-templates";
import { useOrgStore } from "@/store/org";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Email, EmailTemplate } from "@/types/email";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Pencil,
    Trash2,
    Send,
    Plus,
    Search,
    Mail,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Copy,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; icon: React.ElementType; className: string }> = {
        sent:      { label: "Sent",      icon: CheckCircle2, className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
        draft:     { label: "Draft",     icon: FileText,     className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
        sending:   { label: "Sending",   icon: Clock,        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
        scheduled: { label: "Scheduled", icon: Clock,        className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
        failed:    { label: "Failed",    icon: XCircle,      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
        bounced:   { label: "Bounced",   icon: AlertCircle,  className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    };
    const cfg = map[status] || map.draft;
    const Icon = cfg.icon;
    return (
        <Badge variant="secondary" className={`gap-1 ${cfg.className}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </Badge>
    );
}

function EmailRow({
    email,
    onEdit,
    onDelete,
    onSendNow,
}: {
    email: Email;
    onEdit: (e: Email) => void;
    onDelete: (id: string) => void;
    onSendNow?: (e: Email) => void;
}) {
    const toLabel = email.to.map(r => r.name || r.email).join(", ");
    const date = email.sentAt?.toDate?.() ?? email.createdAt?.toDate?.();

    return (
        <div className="flex items-center justify-between px-4 py-3 border-b last:border-0 hover:bg-muted/30 transition-colors">
            <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm truncate">{email.subject || "(No subject)"}</span>
                    <StatusBadge status={email.status} />
                </div>
                <div className="text-xs text-muted-foreground truncate">To: {toLabel || "—"}</div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                {date && (
                    <span className="text-xs text-muted-foreground hidden sm:block">
                        {format(date, "MMM d, yyyy")}
                    </span>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(email)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {email.status === "draft" ? "Edit Draft" : "View"}
                        </DropdownMenuItem>
                        {email.status === "draft" && onSendNow && (
                            <DropdownMenuItem onClick={() => onSendNow(email)}>
                                <Send className="h-4 w-4 mr-2" />
                                Send Now
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDelete(email.id)}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

function TemplateRow({
    template,
    onEdit,
    onDelete,
    onUse,
}: {
    template: EmailTemplate;
    onEdit: (t: EmailTemplate) => void;
    onDelete: (id: string) => void;
    onUse: (t: EmailTemplate) => void;
}) {
    return (
        <div className="flex items-center justify-between px-4 py-3 border-b last:border-0 hover:bg-muted/30 transition-colors">
            <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{template.name}</span>
                    {template.isShared && (
                        <Badge variant="secondary" className="text-xs">Shared</Badge>
                    )}
                    {!template.isActive && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">Inactive</Badge>
                    )}
                </div>
                <div className="text-xs text-muted-foreground">
                    {template.category} · Used {template.usageCount} time{template.usageCount !== 1 ? "s" : ""}
                    {template.description ? ` · ${template.description}` : ""}
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => onUse(template)}>
                    <Copy className="h-3 w-3 mr-1" />
                    Use
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(template)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Template
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDelete(template.id)}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

function TemplateEditorDialog({
    open,
    onOpenChange,
    template,
    userId,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    template?: EmailTemplate;
    userId: string;
    onSaved: () => void;
}) {
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [description, setDescription] = useState("");
    const [isShared, setIsShared] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setName(template?.name ?? "");
            setSubject(template?.subject ?? "");
            setBody(template?.body ?? "");
            setDescription(template?.description ?? "");
            setIsShared(template?.isShared ?? true);
        }
    }, [open, template]);

    const handleSave = async () => {
        if (!name.trim() || !subject.trim()) {
            toast.error("Name and subject are required");
            return;
        }
        setSaving(true);
        const data = { name, subject, body, description, isShared, isActive: true, category: "general" as const };
        const result = template
            ? await updateTemplate(template.id, data)
            : await createTemplate(data, userId);
        setSaving(false);
        if (result.success || (result as any).success !== false) {
            toast.success(template ? "Template updated" : "Template created");
            onOpenChange(false);
            onSaved();
        } else {
            toast.error("Failed to save template");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{template ? "Edit Template" : "New Template"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Name *</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Template name" />
                        </div>
                        <div className="space-y-1">
                            <Label>Description</Label>
                            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Subject *</Label>
                        <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject" />
                    </div>
                    <div className="space-y-1">
                        <Label>Body</Label>
                        <RichTextEditor value={body} onChange={setBody} placeholder="Template body..." />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isShared"
                            checked={isShared}
                            onChange={e => setIsShared(e.target.checked)}
                            className="rounded"
                        />
                        <Label htmlFor="isShared" className="cursor-pointer">Shared with team</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <LoadingSpinner size="sm" /> : null}
                        {template ? "Update" : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function EmailsPage() {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const { currentMember } = useOrgStore();
    const base = `/org/${orgId}`;

    const [tab, setTab] = useState<"sent" | "drafts" | "templates">("sent");
    const [search, setSearch] = useState("");

    const [sentEmails, setSentEmails] = useState<Email[]>([]);
    const [draftEmails, setDraftEmails] = useState<Email[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    const [composeOpen, setComposeOpen] = useState(false);
    const [editingEmail, setEditingEmail] = useState<Email | undefined>(undefined);

    const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | undefined>(undefined);
    const { confirm, ConfirmDialog } = useConfirm();

    const loadData = useCallback(async () => {
        if (!currentMember?.userId) return;
        setLoading(true);
        const [sentRes, draftRes, tplRes] = await Promise.all([
            getEmails(orgId, { status: "sent",  ownerId: currentMember.userId }),
            getEmails(orgId, { status: "draft", ownerId: currentMember.userId }),
            getTemplates(),
        ]);
        setSentEmails(sentRes.emails);
        setDraftEmails(draftRes.emails);
        setTemplates(tplRes.templates);
        setLoading(false);
    }, [orgId, currentMember?.userId]);

    useEffect(() => { loadData(); }, [loadData]);

    const openCompose = () => {
        setEditingEmail(undefined);
        setComposeOpen(true);
    };

    const openEditEmail = (email: Email) => {
        setEditingEmail(email);
        setComposeOpen(true);
    };

    const openSendNow = (email: Email) => {
        setEditingEmail(email);
        setComposeOpen(true);
    };

    const handleDeleteEmail = async (id: string) => {
        if (!(await confirm({ title: "Delete Email", message: "Delete this email?", confirmLabel: "Delete", destructive: true }))) return;
        const { success, error } = await deleteEmail(id);
        if (success) {
            toast.success("Email deleted");
            loadData();
        } else {
            toast.error(error || "Failed to delete email");
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!(await confirm({ title: "Delete Template", message: "Delete this template?", confirmLabel: "Delete", destructive: true }))) return;
        const { success, error } = await deleteTemplate(id);
        if (success) {
            toast.success("Template deleted");
            loadData();
        } else {
            toast.error(error || "Failed to delete template");
        }
    };

    const handleUseTemplate = (template: EmailTemplate) => {
        setEditingEmail(undefined);
        setComposeOpen(true);
        setEditingEmail({
            id: "",
            from: currentMember?.email || "",
            fromName: currentMember?.displayName || "",
            to: [],
            subject: template.subject,
            body: template.body,
            status: "draft",
            tracking: { trackOpens: true, trackClicks: true, opens: 0, clicks: 0 },
            createdBy: currentMember?.userId || "",
            ownerId: currentMember?.userId || "",
            createdAt: null as any,
            updatedAt: null as any,
        } as Email);
    };

    const openNewTemplate = () => {
        setEditingTemplate(undefined);
        setTemplateEditorOpen(true);
    };

    const openEditTemplate = (t: EmailTemplate) => {
        setEditingTemplate(t);
        setTemplateEditorOpen(true);
    };

    const q = search.toLowerCase();
    const filterEmails = (emails: Email[]) =>
        emails.filter(e =>
            !q ||
            e.subject?.toLowerCase().includes(q) ||
            e.to.some(r => r.email.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q))
        );

    const filterTemplates = (tpls: EmailTemplate[]) =>
        tpls.filter(t =>
            !q ||
            t.name.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q)
        );

    const visibleSent      = filterEmails(sentEmails);
    const visibleDrafts    = filterEmails(draftEmails);
    const visibleTemplates = filterTemplates(templates);

    const emptyState = (label: string, icon: React.ElementType) => {
        const Icon = icon;
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Icon className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">No {label} yet</p>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Email"
                breadcrumbs={[
                    { label: "Dashboard", href: `${base}/dashboard` },
                    { label: "Email" },
                ]}
                description="Compose, manage drafts, and organise email templates"
                action={
                    <Button onClick={openCompose}>
                        <Plus className="h-4 w-4 mr-2" />
                        Compose
                    </Button>
                }
            />

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search emails or templates..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <Tabs value={tab} onValueChange={v => setTab(v as any)}>
                <TabsList>
                    <TabsTrigger value="sent">
                        <Mail className="h-4 w-4 mr-1.5" />
                        Sent
                        {sentEmails.length > 0 && (
                            <Badge variant="secondary" className="ml-1.5 h-5 text-xs">{sentEmails.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="drafts">
                        <FileText className="h-4 w-4 mr-1.5" />
                        Drafts
                        {draftEmails.length > 0 && (
                            <Badge variant="secondary" className="ml-1.5 h-5 text-xs">{draftEmails.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <Copy className="h-4 w-4 mr-1.5" />
                        Templates
                        {templates.length > 0 && (
                            <Badge variant="secondary" className="ml-1.5 h-5 text-xs">{templates.length}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sent" className="mt-4">
                    <Card>
                        {loading ? (
                            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
                        ) : visibleSent.length === 0 ? (
                            emptyState("sent emails", Mail)
                        ) : (
                            visibleSent.map(e => (
                                <EmailRow
                                    key={e.id}
                                    email={e}
                                    onEdit={openEditEmail}
                                    onDelete={handleDeleteEmail}
                                />
                            ))
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="drafts" className="mt-4">
                    <Card>
                        {loading ? (
                            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
                        ) : visibleDrafts.length === 0 ? (
                            emptyState("drafts", FileText)
                        ) : (
                            visibleDrafts.map(e => (
                                <EmailRow
                                    key={e.id}
                                    email={e}
                                    onEdit={openEditEmail}
                                    onDelete={handleDeleteEmail}
                                    onSendNow={openSendNow}
                                />
                            ))
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="templates" className="mt-4">
                    <div className="flex justify-end mb-3">
                        <Button variant="outline" size="sm" onClick={openNewTemplate}>
                            <Plus className="h-4 w-4 mr-1" />
                            New Template
                        </Button>
                    </div>
                    <Card>
                        {loading ? (
                            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
                        ) : visibleTemplates.length === 0 ? (
                            emptyState("templates", Copy)
                        ) : (
                            visibleTemplates.map(t => (
                                <TemplateRow
                                    key={t.id}
                                    template={t}
                                    onEdit={openEditTemplate}
                                    onDelete={handleDeleteTemplate}
                                    onUse={handleUseTemplate}
                                />
                            ))
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            <EmailComposeModal
                isOpen={composeOpen}
                onClose={() => {
                    setComposeOpen(false);
                    setEditingEmail(undefined);
                    loadData();
                }}
                initialEmail={editingEmail?.id ? editingEmail : undefined}
                context={
                    editingEmail && !editingEmail.id
                        ? { type: "general", subject: editingEmail.subject, body: editingEmail.body }
                        : undefined
                }
            />

            <TemplateEditorDialog
                open={templateEditorOpen}
                onOpenChange={setTemplateEditorOpen}
                template={editingTemplate}
                userId={currentMember?.userId || ""}
                onSaved={loadData}
            />
            <ConfirmDialog />
        </div>
    );
}
