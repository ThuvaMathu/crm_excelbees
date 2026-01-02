"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Eye } from "lucide-react";
import { getTemplates } from "@/lib/firestore/email-templates";
import type { EmailTemplate, EmailTemplateCategory } from "@/types/email";

interface TemplateSelectorProps {
    onSelectTemplate: (template: EmailTemplate) => void;
    category?: EmailTemplateCategory;
    disabled?: boolean;
}

export function TemplateSelector({
    onSelectTemplate,
    category,
    disabled = false,
}: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, [category]);

    const fetchTemplates = async () => {
        setLoading(true);
        const { templates: fetchedTemplates } = await getTemplates({
            category,
            isActive: true,
        });
        setTemplates(fetchedTemplates);
        setLoading(false);
    };

    const handleSelectTemplate = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = templates.find((t) => t.id === templateId);
        if (template) {
            onSelectTemplate(template);
        }
    };

    const handlePreview = (template: EmailTemplate) => {
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
                    </SelectContent>
                </Select>

                {selectedTemplateId && selectedTemplateId !== "none" && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const template = templates.find((t) => t.id === selectedTemplateId);
                            if (template) handlePreview(template);
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
                                    dangerouslySetInnerHTML={{ __html: previewTemplate.body }}
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
                                        onSelectTemplate(previewTemplate);
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
