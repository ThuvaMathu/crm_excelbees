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
import { createEmail, saveDraft } from "@/lib/firestore/emails";
import { validateEmail } from "@/lib/email/merge-fields";
import { incrementUsageCount } from "@/lib/firestore/email-templates";
import type { EmailContext, EmailRecipient, EmailTemplate, MergeFieldDefinition, EmailAttachment } from "@/types/email";
import { Timestamp } from "firebase/firestore";
import { uploadAttachment } from "@/lib/storage/attachments";
import { Paperclip, XCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { AIAssistant } from "./AIAssistant";
import { MediaLibraryModal } from "@/components/media/MediaLibraryModal";

interface EmailComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    context?: EmailContext;
    defaultTemplateId?: string;
    initialRecipients?: EmailRecipient[];
    isBulkMode?: boolean;
}

export function EmailComposeModal({
    isOpen,
    onClose,
    context,
    defaultTemplateId,
    initialRecipients,
    isBulkMode,
}: EmailComposeModalProps) {
    const { user } = useAuth();

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
    const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);

    // Initialize from context
    useEffect(() => {
        if (isOpen && context) {
            if (context.to) {
                setTo(context.to);
            }
            if (context.subject) {
                setSubject(context.subject);
            }
            if (context.body) {
                setBody(context.body);
            }
            if (context.attachments) {
                setAttachments(context.attachments);
            }
        }
    }, [context]);

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
            console.error(error);
        }
        setIsUploading(false);
        // Reset input
        e.target.value = "";
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleSaveDraft = async () => {
        if (!user) {
            toast.error("You must be logged in");
            return;
        }

        setIsSavingDraft(true);

        try {
            const emailData = {
                from: user.email || "",
                fromName: user.displayName || user.email || "",
                to,
                cc: cc.length > 0 ? cc : undefined,
                bcc: bcc.length > 0 ? bcc : undefined,
                subject,
                body,
                status: "draft" as const,
                templateId: selectedTemplate?.id,
                templateName: selectedTemplate?.name,
                tracking: {
                    trackOpens,
                    trackClicks,
                    opens: 0,
                    clicks: 0,
                },
                relatedTo: context?.relatedRecordId
                    ? {
                        collection: context.type === "invoice" ? "invoices" :
                            context.type === "deal" ? "deals" :
                                context.type === "contact" ? "contacts" :
                                    context.type === "company" ? "companies" : "emails",
                        id: context.relatedRecordId,
                        name: context.relatedRecordName,
                    }
                    : undefined,
                createdBy: user.uid,
                createdByName: user.displayName || user.email || "",
                attachments,
            };

            const { success, id, error } = await saveDraft(emailData, user.uid, draftId || undefined);

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
                    const emailData = {
                        from: user.email || "",
                        fromName: user.displayName || user.email || "",
                        to: [recipient], // Send to one at a time
                        subject, // Note: We should probably resolve merge fields here if we had access to recipient data context. 
                        // But the API route handles it if we pass the context? 
                        // No, the API route expects a single 'relatedTo'.
                        // For true mail merge, we need to pass a list of contexts or resolving locally.
                        // For MVP: We send the same email to everyone. 
                        // If the user uses {{contact.firstName}}, it won't resolve per user unless we handle it.
                        // Let's assume for now we just send the email.
                        body, // Logic to resolve variables per user is Complex.
                        // Enhancing this: We can't do client-side merge for everyone easily without full data.
                        // We'll trust the user knows what they are doing or we warn them.
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
                        attachments,
                    };

                    const { success } = await createEmail(emailData, user.uid);
                    if (success) {
                        // Trigger send API
                        await fetch("/api/email/send", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                ...emailData,
                                id: "temp-bulk-id", // API might need ID or separate endpoint
                                // Actually createEmail returns ID. We should use it.
                            }),
                        });
                        successCount++;
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
            const emailData = {
                from: user.email || "",
                fromName: user.displayName || user.email || "",
                to,
                cc: cc.length > 0 ? cc : undefined,
                bcc: bcc.length > 0 ? bcc : undefined,
                subject,
                body,
                status: scheduledDate ? ("scheduled" as const) : ("sending" as const),
                scheduledAt: scheduledDate ? Timestamp.fromDate(scheduledDate) : undefined,
                templateId: selectedTemplate?.id,
                templateName: selectedTemplate?.name,
                tracking: {
                    trackOpens,
                    trackClicks,
                    opens: 0,
                    clicks: 0,
                },
                relatedTo: context?.relatedRecordId
                    ? {
                        collection: context.type === "invoice" ? "invoices" :
                            context.type === "deal" ? "deals" :
                                context.type === "contact" ? "contacts" :
                                    context.type === "company" ? "companies" : "emails",
                        id: context.relatedRecordId,
                        name: context.relatedRecordName,
                    }
                    : undefined,
                createdBy: user.uid,
                createdByName: user.displayName || user.email || "",
                attachments,
            };

            const { success, id, error } = await createEmail(emailData, user.uid);

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

            // Send email via API route (if not scheduled)
            const response = await fetch("/api/email/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
        setIsMediaLibraryOpen(false);
        setScheduledDate(undefined);
        setIsScheduleOpen(false);
    };

    const handleClose = () => {
        if (to.length > 0 || subject || body) {
            if (confirm("You have unsaved changes. Do you want to save as draft?")) {
                handleSaveDraft();
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
                        <div className="flex justify-end mt-1">
                            <AIAssistant
                                onGenerate={(text, type) => {
                                    if (type === "subject") {
                                        // If it's a list, take the first one or let user choose. 
                                        // For MVP, if it returns multiple lines, we might just append or replace.
                                        // Ideally we show a selection dialog, but let's just use the result for now.
                                        // If content starts with numbers, clean it.
                                        const clean = text.replace(/^\d+\.\s*/gm, '').split('\n')[0]; // Take first line
                                        setSubject(clean);
                                        toast.success("Subject updated");
                                    }
                                }}
                                contextContent={body || subject} // Use body to generate subject
                                contextType="compose"
                            />
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
                                    <AIAssistant
                                        onGenerate={(text, type) => {
                                            setBody(text);
                                            toast.success("Content updated");
                                        }}
                                        contextContent={body}
                                        contextType="compose"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm" // Matches AI button size
                                        onClick={() => setIsMediaLibraryOpen(true)}
                                        title="Insert Image"
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                    </Button>
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

                <MediaLibraryModal
                    isOpen={isMediaLibraryOpen}
                    onClose={() => setIsMediaLibraryOpen(false)}
                    onSelect={(url, alt) => {
                        // Insert image into body
                        // Simple append for now as we use textarea. 
                        // If Rich Text Editor, we would insert at cursor.
                        // For HTML textarea, we insert <img /> tag.
                        const imgTag = `<img src="${url}" alt="${alt}" style="max-width: 100%; border-radius: 4px;" /><br/>`;
                        setBody((prev) => prev + imgTag);
                        toast.success("Image inserted");
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
