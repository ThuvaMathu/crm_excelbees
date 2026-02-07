"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Campaign, AIContentResponse } from "@/types/email-campaigns";
import { AIContentGenerator } from "@/components/email-campaigns/AIContentGenerator";
import { replaceMergeTags } from "@/lib/email-campaigns/utils";
import { Sparkles, FileText, Edit3, Eye, ArrowRight, Loader2, User } from "lucide-react";
import { toast } from "sonner";

export default function CampaignBuildPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const campaignId = params.campaignId as string;

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("ai");
    const [generatedContent, setGeneratedContent] = useState<AIContentResponse | null>(null);
    const [selectedSubject, setSelectedSubject] = useState(0);

    // Personalization preview state
    const [showPersonalization, setShowPersonalization] = useState(true);
    const [previewContact, setPreviewContact] = useState({
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        company: "Acme Corporation",
    });
    const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");

    useEffect(() => {
        if (user && campaignId) {
            loadCampaign();
        }
    }, [user, campaignId]);

    const loadCampaign = async () => {
        try {
            const response = await fetch(`/api/marketing/campaigns/${campaignId}?userId=${user?.uid}`);
            if (!response.ok) throw new Error("Failed to load campaign");

            const data = await response.json();
            setCampaign(data.campaign);
        } catch (error) {
            console.error("Error loading campaign:", error);
            toast.error("Failed to load campaign");
        } finally {
            setLoading(false);
        }
    };

    const handleContentGenerated = (content: AIContentResponse) => {
        setGeneratedContent(content);
        setSelectedSubject(0);
    };

    const handleUseContent = async () => {
        if (!generatedContent) return;

        try {
            const updates = {
                subject: generatedContent.subjectLines[selectedSubject],
                previewText: generatedContent.previewText,
                content: {
                    html: generatedContent.html,
                    plainText: generatedContent.plainText,
                },
            };

            const response = await fetch(`/api/marketing/campaigns/${campaignId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user?.uid, updates }),
            });

            if (!response.ok) throw new Error("Failed to save content");

            toast.success("Content saved successfully");
            router.push(`/marketing/email-campaigns/${campaignId}/review`);
        } catch (error) {
            console.error("Error saving content:", error);
            toast.error("Failed to save content");
        }
    };

    if (loading) {
        return (
            <MarketingLayout title="Build Campaign">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </MarketingLayout>
        );
    }

    if (!campaign) {
        return (
            <MarketingLayout title="Campaign Not Found">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Campaign not found</p>
                        <Button onClick={() => router.push("/marketing/email-campaigns")} className="mt-4">
                            Back to Campaigns
                        </Button>
                    </CardContent>
                </Card>
            </MarketingLayout>
        );
    }

    return (
        <MarketingLayout
            title={`Build: ${campaign.name}`}
            description="Create your email content"
        >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="ai">
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Builder
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <FileText className="h-4 w-4 mr-2" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="editor">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editor
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="mt-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Left: AI Generator */}
                        <div>
                            <AIContentGenerator onContentGenerated={handleContentGenerated} />
                        </div>

                        {/* Right: Preview */}
                        <div>
                            <Card className="sticky top-6">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Eye className="h-5 w-5" />
                                            Preview
                                        </CardTitle>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setDevicePreview("desktop")}
                                                className={devicePreview === "desktop" ? "bg-primary/10" : ""}
                                            >
                                                Desktop
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setDevicePreview("mobile")}
                                                className={devicePreview === "mobile" ? "bg-primary/10" : ""}
                                            >
                                                Mobile
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {generatedContent ? (
                                        <div className="space-y-4">
                                            {/* Subject Lines */}
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium">Subject Line Options:</p>
                                                <div className="space-y-2">
                                                    {generatedContent.subjectLines.map((subject, index) => (
                                                        <div
                                                            key={index}
                                                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                                                selectedSubject === index
                                                                    ? "border-primary bg-primary/5"
                                                                    : "border-border hover:border-primary/50"
                                                            }`}
                                                            onClick={() => setSelectedSubject(index)}
                                                        >
                                                            <p className="text-sm font-medium">
                                                                {replaceMergeTags(subject, previewContact)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Preview Text */}
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium">Preview Text:</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {replaceMergeTags(generatedContent.previewText, previewContact)}
                                                </p>
                                            </div>

                                            {/* Personalization Controls */}
                                            <div className="p-3 bg-muted/30 rounded-lg border space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        Personalization Preview
                                                    </p>
                                                </div>
                                                <div className="grid gap-2 text-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <p className="text-muted-foreground">First Name</p>
                                                            <Input
                                                                value={previewContact.firstName}
                                                                onChange={(e) =>
                                                                    setPreviewContact({ ...previewContact, firstName: e.target.value })
                                                                }
                                                                className="h-8"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Last Name</p>
                                                            <Input
                                                                value={previewContact.lastName}
                                                                onChange={(e) =>
                                                                    setPreviewContact({ ...previewContact, lastName: e.target.value })
                                                                }
                                                                className="h-8"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Company</p>
                                                        <Input
                                                            value={previewContact.company}
                                                            onChange={(e) =>
                                                                setPreviewContact({ ...previewContact, company: e.target.value })
                                                            }
                                                            className="h-8"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Changes how merge tags appear in preview
                                                </p>
                                            </div>

                                            {/* Email Content */}
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium">Email Content:</p>
                                                <div
                                                    className={`prose dark:prose-invert max-w-none text-sm p-4 bg-white dark:bg-slate-900 rounded-lg border max-h-96 overflow-y-auto ${
                                                        devicePreview === "mobile" ? "max-w-sm mx-auto" : ""
                                                    }`}
                                                    dangerouslySetInnerHTML={{
                                                        __html: replaceMergeTags(generatedContent.html, previewContact),
                                                    }}
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-4 border-t">
                                                <Button variant="outline" className="flex-1">
                                                    Edit Content
                                                </Button>
                                                <Button onClick={handleUseContent} className="flex-1">
                                                    Use This Content
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Sparkles className="h-12 w-12 mx-auto opacity-20 mb-4" />
                                            <p>Generate content to see preview</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="templates" className="mt-6">
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FileText className="h-12 w-12 mx-auto opacity-20 mb-4" />
                            <p className="text-muted-foreground mb-4">Template gallery coming soon</p>
                            <Button variant="outline" onClick={() => setActiveTab("ai")}>
                                Use AI Builder Instead
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="editor" className="mt-6">
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Edit3 className="h-12 w-12 mx-auto opacity-20 mb-4" />
                            <p className="text-muted-foreground mb-4">Drag-and-drop editor coming soon</p>
                            <Button variant="outline" onClick={() => setActiveTab("ai")}>
                                Use AI Builder Instead
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </MarketingLayout>
    );
}
