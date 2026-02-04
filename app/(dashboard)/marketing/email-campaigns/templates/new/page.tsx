"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AITextarea } from "@/components/ui/ai-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { TemplateInput as EmailTemplateInput, TemplateCategory } from "@/types/email-campaigns";
import { ArrowRight, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AIContentGenerator } from "@/components/email-campaigns/AIContentGenerator";

export default function NewTemplatePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"details" | "content">("details");

    const [formData, setFormData] = useState<Partial<EmailTemplateInput>>({
        name: "",
        description: "",
        category: "marketing",
        subject: "",
        html: "",
        plainText: "",
        thumbnail: "",
        isSystem: false,
        isActive: true,
    });

    const handleNext = () => {
        if (!formData.name) {
            toast.error("Please enter a template name");
            return;
        }
        setStep("content");
    };

    const handleCreate = async () => {
        if (!formData.html) {
            toast.error("Template content is empty");
            return;
        }

        setLoading(true);
        try {
            const template: EmailTemplateInput = {
                name: formData.name!,
                description: formData.description,
                category: (formData.category as TemplateCategory) || "marketing",
                subject: formData.subject || "",
                html: formData.html!,
                plainText: formData.plainText || "",
                thumbnail: formData.thumbnail,
                createdBy: user?.uid || "",
                createdByName: user?.displayName || user?.email || "",
                isSystem: false,
                isActive: true,
            };

            const response = await fetch("/api/marketing/campaigns/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user?.uid, template }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create template");
            }

            toast.success("Template created successfully");
            router.push("/marketing/email-campaigns/templates");
        } catch (error: any) {
            console.error("Error creating template:", error);
            toast.error(error.message || "Failed to create template");
        } finally {
            setLoading(false);
        }
    };

    const handleContentUpdate = (content: { html: string; plainText: string; subject?: string }) => {
        setFormData((prev: Partial<EmailTemplateInput>) => ({
            ...prev,
            html: content.html,
            plainText: content.plainText,
            subject: content.subject || prev.subject || "",
        }));
    };

    return (
        <MarketingLayout
            title="Create Template"
            description="Design a new email template"
        >
            <div className="max-w-5xl mx-auto space-y-6">
                {step === "details" ? (
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Template Details</CardTitle>
                            <CardDescription>Basic information for your template</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Template Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Monthly Newsletter Layout"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(v) => setFormData({ ...formData, category: v as TemplateCategory })}
                                >
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="newsletter">Newsletter</SelectItem>
                                        <SelectItem value="transactional">Transactional</SelectItem>
                                        <SelectItem value="announcement">Announcement</SelectItem>
                                        <SelectItem value="event">Event</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <AITextarea
                                    id="description"
                                    placeholder="Describe this template's purpose"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    minWords={3}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => router.back()}>
                                    Cancel
                                </Button>
                                <Button onClick={handleNext}>
                                    Next: Design
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Editor Side */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Design Content</CardTitle>
                                    <CardDescription>Generate with AI or paste HTML</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AIContentGenerator
                                        onContentGenerated={(result) => handleContentUpdate(result)}
                                    />

                                    <div className="mt-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-background px-2 text-muted-foreground">
                                                    Or paste HTML
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            <Label>HTML Content</Label>
                                            <AITextarea
                                                value={formData.html}
                                                onChange={(e) => handleContentUpdate({ html: e.target.value, plainText: formData.plainText || "" })}
                                                className="font-mono text-xs min-h-[300px]"
                                                placeholder="<html>...</html>"
                                                minWords={1000} // Disable simplified AI for code
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep("details")}>
                                    Back
                                </Button>
                                <Button onClick={handleCreate} disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Template
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Preview Side */}
                        <Card className="h-fit sticky top-6">
                            <CardHeader>
                                <CardTitle>Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-md overflow-hidden bg-white min-h-[500px]">
                                    {formData.html ? (
                                        <iframe
                                            srcDoc={formData.html}
                                            className="w-full h-[600px] border-0"
                                            title="Preview"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-[500px] text-muted-foreground bg-slate-50 dark:bg-slate-900">
                                            Preview will appear here
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </MarketingLayout>
    );
}
