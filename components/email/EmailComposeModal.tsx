"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RecipientInput } from "./RecipientInput";
import { TemplateSelector } from "./TemplateSelector";
import { MergeFieldDropdown } from "./MergeFieldDropdown";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Send, Save, X, Plus, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useOrgStore } from "@/store/org";
import { AIEmailAssistant } from "./AIEmailAssistant";
import { AIWriteBody } from "./AIWriteBody";
import { createEmail, updateEmail, saveDraft } from "@/lib/firestore/emails";
import { validateEmail } from "@/lib/email/merge-fields";
import { incrementUsageCount, createTemplate } from "@/lib/firestore/email-templates";
import type { Email, EmailContext, EmailRecipient, EmailTemplate, MergeFieldDefinition, EmailAttachment } from "@/types/email";
import { Timestamp } from "firebase/firestore";
import { uploadAttachment } from "@/lib/storage/attachments";
import { Paperclip, XCircle, Loader2 } from "lucide-react";
import { logger } from "@/lib/logger/client";

interface EmailComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    context?: EmailContext;
    defaultTemplateId?: string;
    initialRecipients?: EmailRecipient[];
    isBulkMode?: boolean;
    /** Load an existing draft or email into the composer */
    initialEmail?: Email;
}

export function EmailComposeModal({
    isOpen,
    onClose,
    context,
    defaultTemplateId,
    initialRecipients,
    isBulkMode,
    initialEmail,
}: EmailComposeModalProps) {
    const { user } = useAuth();
    const { confirm, ConfirmDialog } = useConfirm();
    const { currentOrg } = useOrgStore();
    const organizationId = currentOrg?.id;

    // Form state
    const [to, setTo] = useState<EmailRecipient[]>([]);
    const [cc, setCc] = useState<EmailRecipient[]>([]);
    const [bcc, setBcc] = useState<EmailRecipient[]>([]);
    const [showCCBCC, setShowCCBCC] = useState(false);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

    // Options
    const [trackOpens, setTrackOpens] = useState(true);
    const [trackClicks, setTrackClicks] = useState(true);

    // UI state
    const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");
    const [isSending, setIsSending] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [draftId, setDraftId] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);

    // Save as Template State
    const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [templateSelectorKey, setTemplateSelectorKey] = useState(0);

    // Initialize form from initialEmail (draft/existing) or from context / initialRecipients
    useEffect(() => {
        if (!isOpen) return;

        if (initialEmail) {
            setTo(initialEmail.to || []);
            setCc(initialEmail.cc || []);
            setBcc(initialEmail.bcc || []);
            setSubject(initialEmail.subject || "");
            setBody(initialEmail.body || "");
            setAttachments(initialEmail.attachments || []);
            setTrackOpens(initialEmail.tracking?.trackOpens ?? true);
            setTrackClicks(initialEmail.tracking?.trackClicks ?? true);
            setDraftId(initialEmail.id || null);
            return;
        }

        if (initialRecipients && initialRecipients.length > 0) {
            setTo(initialRecipients);
        } else if (context?.to) {
            setTo(context.to);
        }
        if (context?.subject) setSubject(context.subject);
        if (context?.body) setBody(context.body);
        if (context?.attachments) setAttachments(context.attachments);
    }, [isOpen, context, initialRecipients, initialEmail]);

    const handleSelectTemplate = (template: EmailTemplate) => {
        setSelectedTemplate(template);
        setSubject(template.subject);
        setBody(template.body);

        // Increment usage count
        incrementUsageCount(template.id);
    };

    const handleInsertMergeField = (field: MergeFieldDefinition) => {
        // Insert at cursor position in editor
        const mergeFieldText = `{{${field.key}}}`;

        // For now, append to body
        // In a real implementation, you'd insert at cursor position
        setBody((prev) => prev + " " + mergeFieldText);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !user) return;

        const file = e.target.files[0];
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error("File size must be less than 10MB");
            return;
        }

        setIsUploading(true);
        try {
            const url = await uploadAttachment(file, user.uid);
            setAttachments(prev => [...prev, {
                id: crypto.randomUUID(),
                name: file.name,
                size: file.size,
                type: file.type,
                url,
                source: "upload"
            }]);
            toast.success("File attached");
        } catch (error: any) {
            toast.error("Failed to upload attachment");
            logger.error("Failed to upload attachment", { module: "email", action: "upload", userId: user?.uid, error });
        }
        setIsUploading(false);
        // Reset input
        e.target.value = "";
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    // Helper to sanitize email data and remove undefined fields
    const sanitizeEmailData = (data: any) => {
        const sanitized: any = {};

        Object.keys(data).forEach(key => {
            if (data[key] !== undefined) {
                sanitized[key] = data[key];
            }
        });

        return sanitized;
    };

    // AI Assistant handlers
    const handleSaveDraft = async () => {
        if (!user) {
            toast.error("You must be logged in");
            return;
        }
        if (!organizationId) {
            toast.error("No organization selected");
            return;
        }

        setIsSavingDraft(true);

        try {
            const emailData: any = {
                from: user.email || "",
                fromName: user.displayName || user.email || "",
                to,
                cc: cc.length > 0 ? cc : [],
                bcc: bcc.length > 0 ? bcc : [],
                subject: subject || "",
                body: body || "",
                status: "draft" as const,
                templateId: selectedTemplate?.id,
                templateName: selectedTemplate?.name,
                tracking: {
                    trackOpens,
                    trackClicks,
                    opens: 0,
                    clicks: 0,
                },
                createdBy: user.uid,
                createdByName: user.displayName || user.email || "",
                attachments: attachments || [],
            };

            // Add relatedTo only if it exists
            if (context?.relatedRecordId) {
                emailData.relatedTo = {
                    collection: context.type === "invoice" ? "invoices" :
                        context.type === "deal" ? "deals" :
                            context.type === "contact" ? "contacts" :
                                context.type === "company" ? "companies" :
                                    context.type === "lead" ? "leads" : "emails",
                    id: context.relatedRecordId,
                    name: context.relatedRecordName,
                };
            }

            const sanitizedData = sanitizeEmailData(emailData);
            const { success, id, error } = await saveDraft(sanitizedData, user.uid, organizationId, draftId || undefined);

            if (success && id) {
                setDraftId(id);
                toast.success("Draft saved");
            } else {
                toast.error(error || "Failed to save draft");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save draft");
        }

        setIsSavingDraft(false);
    };

    const handleSend = async () => {
        if (!user) {
            toast.error("You must be logged in");
            return;
        }
        if (!organizationId) {
            toast.error("No organization selected");
            return;
        }

        // Validate
        const validation = validateEmail({
            to,
            subject,
            body,
        });

        if (!validation.isValid) {
            const firstError = Object.values(validation.errors)[0];
            toast.error(firstError);
            return;
        }

        setIsSending(true);

        try {
            if (isBulkMode) {
                // Bulk Send Logic
                let successCount = 0;
                let failCount = 0;

                toast.loading(`Sending to ${to.length} recipients...`);

                for (const recipient of to) {
                    const emailData: any = {
                        organizationId,
                        from: user.email || "",
                        fromName: user.displayName || user.email || "",
                        to: [recipient], // Send to one at a time
                        cc: [],
                        bcc: [],
                        subject: subject || "",
                        body: body || "",
                        status: "sending" as const,
                        templateId: selectedTemplate?.id,
                        templateName: selectedTemplate?.name,
                        tracking: {
                            trackOpens,
                            trackClicks,
                            opens: 0,
                            clicks: 0,
                        },
                        createdBy: user.uid,
                        createdByName: user.displayName || user.email || "",
                        attachments: attachments || [],
                    };

                    const sanitizedData = sanitizeEmailData(emailData);
                    const { success, id } = await createEmail(sanitizedData, user.uid, organizationId);
                    if (success && id) {
                        // Trigger send API — needs the caller's ID token
                        // (verifyApiRequest requires it) and the payload
                        // shaped as { email, context }, matching what
                        // app/api/email/send/route.ts actually reads.
                        const token = await auth.currentUser?.getIdToken();
                        const sendRes = await fetch("/api/email/send", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                            body: JSON.stringify({
                                email: { ...sanitizedData, id },
                                context,
                            }),
                        });
                        const sendResult = await sendRes.json();
                        if (sendResult.success) {
                            successCount++;
                        } else {
                            failCount++;
                        }
                    } else {
                        failCount++;
                    }
                }

                toast.dismiss();
                toast.success(`Sent ${successCount} emails. ${failCount > 0 ? `${failCount} failed.` : ""}`);
                onClose();
                return;
            }

            // Normal Send Logic
            // Create email
            const emailData: any = {
                // Required so /api/email/send resolves the org's own SMTP
                // config (lib/email/email-service.ts's getResolvedTransporter)
                // instead of silently falling back to the env default —
                // this field was previously only ever passed as a separate
                // argument to createEmail() (for the Firestore write) and
                // never actually included on the object sent to the send API.
                organizationId,
                from: user.email || "",
                fromName: user.displayName || user.email || "",
                to,
                cc: cc.length > 0 ? cc : [],
                bcc: bcc.length > 0 ? bcc : [],
                subject: subject || "",
                body: body || "",
                status: scheduledDate ? ("scheduled" as const) : ("sending" as const),
                templateId: selectedTemplate?.id,
                templateName: selectedTemplate?.name,
                tracking: {
                    trackOpens,
                    trackClicks,
                    opens: 0,
                    clicks: 0,
                },
                createdBy: user.uid,
                createdByName: user.displayName || user.email || "",
                attachments: attachments || [],
            };

            // Add scheduledAt only if scheduled
            if (scheduledDate) {
                emailData.scheduledAt = Timestamp.fromDate(scheduledDate);
            }

            // Add relatedTo only if it exists
            if (context?.relatedRecordId) {
                emailData.relatedTo = {
                    collection: context.type === "invoice" ? "invoices" :
                        context.type === "deal" ? "deals" :
                            context.type === "contact" ? "contacts" :
                                context.type === "company" ? "companies" : "emails",
                    id: context.relatedRecordId,
                    name: context.relatedRecordName,
                };
            }

            const sanitizedData = sanitizeEmailData(emailData);
            // If this compose session started from an existing draft,
            // update that same doc instead of creating a new one — sending
            // used to always createEmail() regardless, which left the
            // original draft behind untouched (still status "draft"
            // forever) while a separate, duplicate "sent" record appeared.
            let success: boolean, id: string | null | undefined, error: string | null | undefined;
            if (draftId) {
                const result = await updateEmail(draftId, sanitizedData);
                success = result.success;
                id = draftId;
                error = result.error;
            } else {
                const result = await createEmail(sanitizedData, user.uid, organizationId);
                success = result.success;
                id = result.id;
                error = result.error;
            }

            if (!success || !id) {
                toast.error(error || "Failed to create email");
                setIsSending(false);
                return;
            }

            if (scheduledDate) {
                toast.success(`Email scheduled for ${format(scheduledDate, "PPp")}`);
                onClose();
                resetForm();
                return;
            }

            // Send email via API route (if not scheduled). The route is
            // gated by verifyApiRequest(), which requires a Bearer token —
            // without it every send fails with "Authorization header
            // required" regardless of how valid the email itself is.
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch("/api/email/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    email: {
                        ...emailData,
                        id,
                        ownerId: user.uid,
                        ownerName: user.displayName || user.email || "",
                        createdAt: Timestamp.now(),
                        updatedAt: Timestamp.now(),
                    },
                    context,
                }),
            });

            const sendResult = await response.json();

            if (sendResult.success) {
                toast.success("Email sent successfully!");
                onClose();
                resetForm();
            } else {
                toast.error(sendResult.error || "Failed to send email");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to send email");
        }

        setIsSending(false);
    };

    const resetForm = () => {
        setTo([]);
        setCc([]);
        setBcc([]);
        setSubject("");
        setBody("");
        setSelectedTemplate(null);
        setShowCCBCC(false);
        setDraftId(null);
        setAttachments([]);
        setScheduledDate(undefined);
        setIsScheduleOpen(false);
        setNewTemplateName("");
    };

    const handleSaveTemplate = async () => {
        if (!user || !newTemplateName.trim()) return;

        setIsSavingTemplate(true);
        try {
            const { success, error } = await createTemplate({
                name: newTemplateName,
                subject,
                body,
                category: (context?.type as any) || "general",
                isShared: true, // Default to shared for team
                isActive: true,
                description: `Created from compose window on ${new Date().toLocaleDateString()}`
            }, user.uid);

            if (success) {
                toast.success("Template saved successfully");
                setIsSaveTemplateOpen(false);
                setNewTemplateName("");
                // Refresh selector
                setTemplateSelectorKey(prev => prev + 1);
            } else {
                toast.error(error || "Failed to save template");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save template");
        }
        setIsSavingTemplate(false);
    };

    const handleClose = async () => {
        if (to.length > 0 || subject || body) {
            if (await confirm({ title: "Unsaved Changes", message: "You have unsaved changes. Do you want to save as draft?", confirmLabel: "Save Draft", cancelLabel: "Discard" })) {
                await handleSaveDraft();
            }
        }
        onClose();
        resetForm();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Compose Email</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Template Selector */}
                    <div className="flex items-center gap-2">
                        <Label>Template:</Label>
                        <TemplateSelector
                            key={templateSelectorKey}
                            onSelectTemplate={handleSelectTemplate}
                            category={context?.type as any}
                        />
                    </div>

                    {/* Recipients */}
                    <div className="space-y-2">
                        <RecipientInput
                            recipients={to}
                            onChange={setTo}
                            label="To:"
                            placeholder="Add recipients..."
                        />

                        {!showCCBCC && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowCCBCC(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add CC/BCC
                            </Button>
                        )}

                        {showCCBCC && (
                            <>
                                <RecipientInput
                                    recipients={cc}
                                    onChange={setCc}
                                    label="CC:"
                                    placeholder="Add CC recipients..."
                                />
                                <RecipientInput
                                    recipients={bcc}
                                    onChange={setBcc}
                                    label="BCC:"
                                    placeholder="Add BCC recipients..."
                                />
                            </>
                        )}
                    </div>

                    {/* AI Email Assistant */}
                    <div className="flex items-center justify-between">
                        <AIEmailAssistant
                            recipientName={to[0]?.name}
                            companyName={context?.relatedRecordName}
                            context={context?.type}
                            currentBody={body}
                            onDraft={(newSubject, newBody) => {
                                setSubject(newSubject);
                                setBody(newBody);
                            }}
                        />
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject:</Label>
                        <div className="flex gap-2">
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Email subject..."
                            />
                            <MergeFieldDropdown onInsertField={(field) => setSubject((prev) => prev + ` {{${field.key}}}`)} />
                        </div>
                    </div>

                    {/* Body */}
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                        <TabsList>
                            <TabsTrigger value="compose">Compose</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>

                        <TabsContent value="compose" className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Body:</Label>
                                <div className="flex gap-2">
                                    <AIWriteBody
                                        bodyHtml={body}
                                        onInsert={setBody}
                                        recipientName={to[0]?.name}
                                        companyName={context?.relatedRecordName}
                                    />
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                            disabled={isUploading}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => document.getElementById("file-upload")?.click()}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Paperclip className="h-4 w-4 mr-2" />
                                            )}
                                            Attach File
                                        </Button>
                                    </div>
                                    <MergeFieldDropdown onInsertField={handleInsertMergeField} />
                                </div>
                            </div>

                            {/* Attachments List */}
                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {attachments.map(att => (
                                        <div key={att.id} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">
                                            <span>{att.name}</span>
                                            <button onClick={() => removeAttachment(att.id)} className="text-muted-foreground hover:text-destructive">
                                                <XCircle className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <RichTextEditor
                                value={body}
                                onChange={setBody}
                                placeholder="Compose your email..."
                            />
                        </TabsContent>

                        <TabsContent value="preview">
                            <div
                                className="prose prose-sm max-w-none p-4 border rounded-md min-h-[300px]"
                                dangerouslySetInnerHTML={{ __html: body }}
                            />
                        </TabsContent>
                    </Tabs>

                    {/* Options */}
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="track-opens"
                                checked={trackOpens}
                                onCheckedChange={setTrackOpens}
                            />
                            <Label htmlFor="track-opens" className="cursor-pointer">
                                Track opens
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="track-clicks"
                                checked={trackClicks}
                                onCheckedChange={setTrackClicks}
                            />
                            <Label htmlFor="track-clicks" className="cursor-pointer">
                                Track clicks
                            </Label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSaveDraft}
                            disabled={isSending || isSavingDraft}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSavingDraft ? "Saving..." : "Save Draft"}
                        </Button>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsSaveTemplateOpen(true)}
                                disabled={isSending || !subject || !body}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Save as Template
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSending}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSend}
                                disabled={isSending || !to.length || !subject || !body}
                            >
                                <Send className="h-4 w-4 mr-2" />
                                {isSending ? "Sending..." : "Send Email"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Save Template Dialog */}
                <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Save as Template</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="template-name">Template Name</Label>
                                <Input
                                    id="template-name"
                                    placeholder="e.g., Monthly Update"
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsSaveTemplateOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveTemplate} disabled={!newTemplateName.trim() || isSavingTemplate}>
                                {isSavingTemplate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Template
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            <ConfirmDialog />
            </DialogContent>
        </Dialog>
    );
}
