"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AITextarea } from "@/components/ui/ai-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { CampaignType, Audience } from "@/types/email-campaigns";
import { Mail, Zap, Calendar, ArrowRight, Sparkles, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Step = "type" | "details" | "audience";

export default function NewCampaignPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState<Step>("type");
    const [selectedType, setSelectedType] = useState<CampaignType | null>(null);
    const [loading, setLoading] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [loadingAudiences, setLoadingAudiences] = useState(false);
    const [audiences, setAudiences] = useState<Audience[]>([]);
    const [selectedAudienceIds, setSelectedAudienceIds] = useState<string[]>([]);

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

    // Load audiences when component mounts
    useEffect(() => {
        if (user && (step === "details" || step === "audience")) {
            loadAudiences();
        }
    }, [user, step]);

    const loadAudiences = async () => {
        try {
            setLoadingAudiences(true);
            const response = await fetch(`/api/marketing/campaigns/audiences?userId=${user?.uid}`);
            if (!response.ok) throw new Error("Failed to load audiences");

            const data = await response.json();
            setAudiences(data.audiences || []);
        } catch (error) {
            console.error("Error loading audiences:", error);
            // Non-blocking error - audiences can be added later
        } finally {
            setLoadingAudiences(false);
        }
    };

    const handleTypeSelect = (type: CampaignType) => {
        setSelectedType(type);
        setStep("details");
    };

    const toggleAudience = (audienceId: string) => {
        setSelectedAudienceIds((prev) =>
            prev.includes(audienceId)
                ? prev.filter((id) => id !== audienceId)
                : [...prev, audienceId]
        );
    };

    const getTotalRecipients = () => {
        return selectedAudienceIds.reduce((total, audienceId) => {
            const audience = audiences.find((a) => a.id === audienceId);
            return total + (audience?.contactCount || 0);
        }, 0);
    };

    const handleCreateCampaign = async (skipAudience = false) => {
        // Validation
        if (!formData.name || !formData.fromName || !formData.fromEmail || !formData.subject) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Calculate total recipients from selected audiences
        const recipientCount = getTotalRecipients();

        if (!skipAudience && recipientCount === 0) {
            toast.error("Please select at least one audience");
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
                audienceIds: selectedAudienceIds,
                recipientCount,
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
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create campaign";
            console.error("Error creating campaign:", error);
            toast.error(errorMessage);
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
            ) : step === "details" ? (
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
                                                            prompt: `Generate a compelling email subject line for a ${selectedType} campaign called "${formData.name}"`
                                                        }),
                                                    }).then(r => r.json());
                                                    if (generated.subject) {
                                                        setFormData({ ...formData, subject: generated.subject });
                                                        toast.success("Subject line generated!");
                                                    } else {
                                                        // Fallback to a simple generated subject
                                                        const fallback = `${formData.name} - Special Offer Inside!`;
                                                        setFormData({ ...formData, subject: fallback });
                                                        toast.success("Subject line generated!");
                                                    }
                                                } catch {
                                                    // Fallback to a simple generated subject
                                                    const fallback = `${formData.name} - Special Offer Inside!`;
                                                    setFormData({ ...formData, subject: fallback });
                                                    toast.success("Subject line generated!");
                                                }
                                                toast.dismiss(toastId);
                                                setAiGenerating(false);
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
                                <Button onClick={() => {
                                    if (!formData.name || !formData.fromName || !formData.fromEmail || !formData.subject) {
                                        toast.error("Please fill in all required fields");
                                        return;
                                    }
                                    setStep("audience");
                                }} disabled={loading}>
                                    {loading ? "Creating..." : "Continue to Audience Selection"}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : step === "audience" ? (
                <div className="max-w-4xl mx-auto space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Audience</CardTitle>
                            <CardDescription>
                                Choose which audiences to include in this campaign
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loadingAudiences ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : audiences.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                                    <p className="text-muted-foreground mb-4">No audiences found</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push("/marketing/email-campaigns/audiences/new")}
                                    >
                                        Create Your First Audience
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {audiences.map((audience) => (
                                            <div
                                                key={audience.id}
                                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                                    selectedAudienceIds.includes(audience.id)
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border hover:border-primary/50"
                                                }`}
                                                onClick={() => toggleAudience(audience.id)}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <Checkbox
                                                        id={audience.id}
                                                        checked={selectedAudienceIds.includes(audience.id)}
                                                        onCheckedChange={() => toggleAudience(audience.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <label
                                                                htmlFor={audience.id}
                                                                className="font-medium cursor-pointer"
                                                            >
                                                                {audience.name}
                                                            </label>
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                    audience.type === "static"
                                                                        ? "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900"
                                                                        : "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900"
                                                                }`}
                                                            >
                                                                {audience.type === "static" ? "Static" : "Dynamic"}
                                                            </span>
                                                        </div>
                                                        {audience.description && (
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                {audience.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Users className="h-4 w-4" />
                                                                {audience.contactCount.toLocaleString()} contacts
                                                            </span>
                                                            <span>Source: {audience.source}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Summary */}
                                    <div className="border-t pt-4 mt-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {selectedAudienceIds.length} audience{selectedAudienceIds.length !== 1 ? "s" : ""} selected
                                                </p>
                                                <p className="text-2xl font-bold">
                                                    {getTotalRecipients().toLocaleString()} recipients
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep("details")}
                                    disabled={loading}
                                >
                                    Back to Details
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleCreateCampaign(true)}
                                        disabled={loading}
                                    >
                                        Skip for Now
                                    </Button>
                                    <Button
                                        onClick={() => handleCreateCampaign(false)}
                                        disabled={loading || selectedAudienceIds.length === 0}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                Create Campaign
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </MarketingLayout>
    );
}
