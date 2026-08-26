"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
    SelectSeparator
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Eye, Sparkles } from "lucide-react";
import { getTemplates } from "@/lib/firestore/email-templates";
import type { EmailTemplate, EmailTemplateCategory } from "@/types/email";
import { toast } from "sonner";
import { logger } from "@/lib/logger/client";

interface TemplateSelectorProps {
    onSelectTemplate: (template: EmailTemplate) => void;
    category?: EmailTemplateCategory;
    disabled?: boolean;
}

// Static templates always available
const STATIC_TEMPLATES: Partial<EmailTemplate>[] = [
    {
        id: "static_followup",
        name: "General Follow-up",
        description: "Standard follow-up after initial contact",
        category: "follow-up",
        subject: "Following up on our conversation",
        body: "<p>Hi {{contact.firstName}},</p><p>I hope you're having a great week.</p><p>I'm writing to follow up on our last conversation.</p><p>Do you have any questions or need further information?</p><p>Best regards,<br>{{user.fullName}}</p>",
        isDefault: false
    },
    {
        id: "static_meeting",
        name: "Meeting Invitation",
        description: "Request for a quick sync",
        category: "general",
        subject: "Meeting Request: {{company.name}}",
        body: "<p>Hi {{contact.firstName}},</p><p>I'd love to schedule a quick call to discuss how we can help with your current projects.</p><p>Are you available for a 15-minute chat next Tuesday or Wednesday?</p><p>Looking forward to connecting.</p><p>Thanks,<br>{{user.fullName}}</p>",
        isDefault: false
    },
    {
        id: "static_invoice",
        name: "Standard Invoice",
        description: "Template for sending invoices",
        category: "invoice",
        subject: "Invoice #{{invoice.number}} from {{company.name}}",
        body: "<p>Dear {{contact.firstName}},</p><p>Please find attached the invoice for our recent services.</p><p>Amount Due: {{invoice.total}}</p><p>Due Date: {{invoice.dueDate}}</p><p>If you have any questions, please let me know.</p><p>Regards,<br>{{user.fullName}}</p>",
        isDefault: false
    },
    {
        id: "static_welcome",
        name: "Welcome Email",
        description: "Warm welcome to new clients",
        category: "welcome",
        subject: "Welcome to {{company.name}}!",
        body: "<p>Hi {{contact.firstName}},</p><p>Welcome aboard! We are thrilled to have you as a client.</p><p>We are committed to providing you with the best service possible.</p><p>Let's get started!</p><p>Cheers,<br>{{user.fullName}}</p>",
        isDefault: false
    }
];

export function TemplateSelector({
    onSelectTemplate,
    category,
    disabled = false,
}: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | Partial<EmailTemplate> | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, [category]);

    const fetchTemplates = async () => {
        setLoading(true);
        const { templates: fetchedTemplates, error } = await getTemplates({
            category,
            isActive: true,
        });

        if (error) {
            logger.error("Error fetching templates", { module: "email", action: "fetch", error });
        }

        setTemplates(fetchedTemplates);
        setLoading(false);
    };

    const handleSelectTemplate = (value: string) => {
        setSelectedTemplateId(value);
        if (value === "none") return;

        // Check fetched templates first
        const dbTemplate = templates.find((t) => t.id === value);
        if (dbTemplate) {
            onSelectTemplate(dbTemplate);
            return;
        }

        // Check static templates
        const staticTemplate = STATIC_TEMPLATES.find((t) => t.id === value);
        if (staticTemplate) {
            // Cast to EmailTemplate for strict typing, though Partial is safer in state
            // Ideally we pass simple struct.
            // onSelectTemplate expects EmailTemplate which has IDs/Timestamps. 
            // We should mock them or update type.
            // For now, let's fast-cast, assuming the consumer mostly cares about body/subject.
            onSelectTemplate(staticTemplate as EmailTemplate);
        }
    };

    const handlePreview = (template: EmailTemplate | Partial<EmailTemplate>) => {
        setPreviewTemplate(template);
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <Select
                    value={selectedTemplateId}
                    onValueChange={handleSelectTemplate}
                    disabled={disabled || loading}
                >
                    <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">
                            <span className="text-muted-foreground">No template</span>
                        </SelectItem>

                        {/* Static / System Templates */}
                        <SelectGroup>
                            <SelectLabel className="flex items-center gap-2 text-purple-600">
                                <Sparkles className="h-3 w-3" />
                                Quick Templates
                            </SelectLabel>
                            {STATIC_TEMPLATES.map((template) => (
                                <SelectItem key={template.id} value={template.id!}>
                                    <div className="flex items-center gap-2">
                                        <span>{template.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectGroup>

                        {/* User Templates */}
                        {templates.length > 0 && (
                            <>
                                <SelectSeparator />
                                <SelectGroup>
                                    <SelectLabel>My Templates</SelectLabel>
                                    {templates.map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                <span>{template.name}</span>
                                                {template.isDefault && (
                                                    <span className="text-xs text-muted-foreground">(Default)</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </>
                        )}
                    </SelectContent>
                </Select>

                {selectedTemplateId && selectedTemplateId !== "none" && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const t = templates.find((t) => t.id === selectedTemplateId)
                                || STATIC_TEMPLATES.find((t) => t.id === selectedTemplateId);
                            if (t) handlePreview(t);
                        }}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                    </Button>
                )}
            </div>

            {/* Preview Dialog */}
            <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{previewTemplate?.name}</DialogTitle>
                        <DialogDescription>{previewTemplate?.description}</DialogDescription>
                    </DialogHeader>

                    {previewTemplate && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Subject:</label>
                                <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                                    {previewTemplate.subject}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Body:</label>
                                <div
                                    className="mt-1 p-4 bg-muted rounded-md text-sm prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: previewTemplate.body || "" }}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPreviewTemplate(null)}
                                >
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        // Cast here safely enough for selection purposes
                                        onSelectTemplate(previewTemplate as EmailTemplate);
                                        setPreviewTemplate(null);
                                    }}
                                >
                                    Use Template
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

