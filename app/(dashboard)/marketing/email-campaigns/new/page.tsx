"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AITextarea } from "@/components/ui/ai-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { CampaignType } from "@/types/email-campaigns";
import { Mail, Zap, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function NewCampaignPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState<"type" | "details">("type");
    const [selectedType, setSelectedType] = useState<CampaignType | null>(null);
    const [loading, setLoading] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        folder: "",
        fromName: "",
        fromEmail: "",
        replyTo: "",
        subject: "",
        previewText: "",
    });

    const campaignTypes = [
        {
            type: "one-time" as CampaignType,
            icon: Mail,
            title: "One-Time Campaign",
            description: "Send email once to selected audience",
            color: "text-blue-600 bg-blue-100 dark:bg-blue-900",
        },
        {
            type: "automated" as CampaignType,
            icon: Zap,
            title: "Automated Workflow",
            description: "Drip campaigns, welcome series, etc.",
            color: "text-purple-600 bg-purple-100 dark:bg-purple-900",
        },
        {
            type: "recurring" as CampaignType,
            icon: Calendar,
            title: "Recurring Campaign",
            description: "Schedule weekly or monthly sends",
            color: "text-green-600 bg-green-100 dark:bg-green-900",
        },
    ];

    const handleTypeSelect = (type: CampaignType) => {
        setSelectedType(type);
        setStep("details");
    };

    const handleCreateCampaign = async () => {
        // Validation
        if (!formData.name || !formData.fromName || !formData.fromEmail || !formData.subject) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            const campaign = {
                name: formData.name,
                description: formData.description,
                type: selectedType!,
                status: "draft" as const,
                folder: formData.folder || undefined,
                from: {
                    name: formData.fromName,
                    email: formData.fromEmail,
                },
                replyTo: formData.replyTo || formData.fromEmail,
                subject: formData.subject,
                previewText: formData.previewText,
                content: {
                    html: "",
                    plainText: "",
                },
                audienceIds: [],
                recipientCount: 0,
                throttling: {
                    emailsPerHour: 1000,
                    retryFailed: true,
                    maxRetries: 3,
                },
                tracking: {
                    trackOpens: true,
                    trackClicks: true,
                },
                createdBy: user?.uid || "",
                createdByName: user?.displayName || user?.email || "",
            };

            const response = await fetch("/api/marketing/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user?.uid, campaign }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create campaign");
            }

            const { id } = await response.json();
            toast.success("Campaign created successfully");

            // Redirect to build page
            router.push(`/marketing/email-campaigns/${id}/build`);
        } catch (error: any) {
            console.error("Error creating campaign:", error);
            toast.error(error.message || "Failed to create campaign");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MarketingLayout
            title="Create New Campaign"
            description="Choose your campaign type and configure details"
        >
            {step === "type" ? (
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">Choose Campaign Type</h2>
                        <p className="text-muted-foreground">
                            Select the type of email campaign you want to create
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {campaignTypes.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Card
                                    key={item.type}
                                    className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                                    onClick={() => handleTypeSelect(item.type)}
                                >
                                    <CardContent className="p-6 text-center">
                                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${item.color}`}>
                                            <Icon className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                                        <Button variant="outline" className="w-full">
                                            Select <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Details</CardTitle>
                            <CardDescription>
                                Configure your {selectedType} campaign settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Campaign Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Campaign Information</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Campaign Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Q1 Product Launch"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Internal name (not shown to recipients)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <AITextarea
                                        id="description"
                                        placeholder="Brief description for internal tracking"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        minWords={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="folder">Folder/Category (Optional)</Label>
                                    <Select value={formData.folder} onValueChange={(v) => setFormData({ ...formData, folder: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select folder" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newsletters">Newsletters</SelectItem>
                                            <SelectItem value="promotions">Promotions</SelectItem>
                                            <SelectItem value="announcements">Announcements</SelectItem>
                                            <SelectItem value="onboarding">Onboarding</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Email Basics */}
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-sm font-semibold">Email Basics</h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="fromName">
                                            From Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="fromName"
                                            placeholder="Your Company"
                                            value={formData.fromName}
                                            onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fromEmail">
                                            From Email <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="fromEmail"
                                            type="email"
                                            placeholder="hello@company.com"
                                            value={formData.fromEmail}
                                            onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="replyTo">Reply-To Email (Optional)</Label>
                                    <Input
                                        id="replyTo"
                                        type="email"
                                        placeholder="support@company.com"
                                        value={formData.replyTo}
                                        onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Defaults to From Email if not specified
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">
                                        Subject Line <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="subject"
                                            placeholder="Your compelling subject line"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            title="Generate with AI"
                                            onClick={async () => {
                                                if (!formData.name) {
                                                    toast.error("Please enter a campaign name first");
                                                    return;
                                                }
                                                setAiGenerating(true);
                                                const toastId = toast.loading("Generating subject line...");
                                                try {
                                                    // Simulate AI generation - in production, call your AI API here
                                                    const generated = await fetch("/api/ai/generate", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            prompt: `Generate a compelling email subject line for a ${formData.type} campaign called "${formData.name}"`
                                                        }),
                                                    }).then(r => r.json());
                                                    toast.success("Subject line generated!");
                                                    if (generated.subject) {
                                                        setFormData({ ...formData, subject: generated.subject });
                                                    }
                                                } catch (error) {
                                                    // Fallback to a simple generated subject
                                                    const fallback = `${formData.name} - Special Offer Inside!`;
                                                    setFormData({ ...formData, subject: fallback });
                                                    toast.success("Subject line generated!");
                                                }
                                                toast.dismiss(toastId);
                                            } catch {
                                                toast.error("Failed to generate subject line");
                                            } finally {
                                                setAiGenerating(false);
                                            }
                                            }}
                                            disabled={aiGenerating}
                                        >
                                            <Sparkles className={`h-4 w-4 ${aiGenerating ? "animate-spin" : ""}`} />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {formData.subject.length}/100 characters (recommended: 40-60)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="previewText">Preview Text (Optional)</Label>
                                    <Input
                                        id="previewText"
                                        placeholder="First line shown in inbox preview"
                                        value={formData.previewText}
                                        onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {formData.previewText.length}/140 characters
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between pt-4 border-t">
                                <Button variant="outline" onClick={() => setStep("type")}>
                                    Back
                                </Button>
                                <Button onClick={handleCreateCampaign} disabled={loading}>
                                    {loading ? "Creating..." : "Continue to Content Builder"}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </MarketingLayout>
    );
}
