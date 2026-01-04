"use client";

import { useState } from "react";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Send, Mail, RefreshCw, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function EmailCampaignPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("builder");
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Campaign State
    const [campaign, setCampaign] = useState({
        topic: "",
        audience: "",
        tone: "persuasive",
        subject: "",
        content: ""
    });

    // AI Handlers
    const generateSubjects = async () => {
        if (!campaign.topic) return toast.error("Enter a topic first");
        setIsGenerating(true);
        try {
            const res = await fetch("/api/marketing/email", {
                method: "POST",
                body: JSON.stringify({
                    action: "generate_subjects",
                    context: { topic: campaign.topic, audience: campaign.audience },
                    userId: user?.uid,
                    workspaceId: "demo"
                })
            });
            const data = await res.json();
            const subjects = JSON.parse(data.content);
            toast.success("Suggestions generated", {
                description: "Click a subject to use it.",
                action: {
                    label: "Use #1",
                    onClick: () => setCampaign(prev => ({ ...prev, subject: subjects[0] }))
                }
            });
            // Ideally we show these in a selectable list UI, but toast for simplicity in MVP
            setCampaign(prev => ({ ...prev, subject: subjects[0] })); // Auto-pick first for now
        } catch (e) {
            toast.error("Failed to generate subjects");
        } finally {
            setIsGenerating(false);
        }
    };

    const generateContent = async () => {
        if (!campaign.topic) return toast.error("Enter a topic first");
        setIsGenerating(true);
        try {
            const res = await fetch("/api/marketing/email", {
                method: "POST",
                body: JSON.stringify({
                    action: "generate_content",
                    context: { topic: campaign.topic, audience: campaign.audience, tone: campaign.tone },
                    userId: user?.uid,
                    workspaceId: "demo"
                })
            });
            const data = await res.json();
            setCampaign(prev => ({ ...prev, content: data.content }));
        } catch (e) {
            toast.error("Failed to generate content");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSend = async () => {
        setIsLoading(true);
        try {
            // 1. Save
            const saveRes = await fetch("/api/marketing/email", {
                method: "POST",
                body: JSON.stringify({
                    action: "save",
                    context: { campaignData: { ...campaign, title: campaign.subject } },
                    userId: user?.uid,
                    workspaceId: "demo"
                })
            });
            const { id } = await saveRes.json();

            // 2. Send
            await fetch("/api/marketing/email", {
                method: "POST",
                body: JSON.stringify({
                    action: "send",
                    context: { campaignId: id },
                    userId: user?.uid,
                    workspaceId: "demo"
                })
            });
            toast.success("Campaign Sent!");
            setCampaign({ topic: "", audience: "", tone: "persuasive", subject: "", content: "" });
        } catch (e) {
            toast.error("Failed to send campaign");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MarketingLayout
            title="Email Campaigns"
            description="Create and send high-converting emails via AI."
        >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="builder">Campaign Builder</TabsTrigger>
                    <TabsTrigger value="history">Sent History</TabsTrigger>
                </TabsList>

                <TabsContent value="builder" className="grid gap-6 md:grid-cols-2">
                    {/* Left: Inputs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Details</CardTitle>
                            <CardDescription>Configure your target and message.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Campaign Topic / Goal</Label>
                                <Input
                                    placeholder="e.g. End of Year Sale"
                                    value={campaign.topic}
                                    onChange={e => setCampaign({ ...campaign, topic: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Target Audience</Label>
                                <Input
                                    placeholder="e.g. Small Business Owners"
                                    value={campaign.audience}
                                    onChange={e => setCampaign({ ...campaign, audience: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tone</Label>
                                <Select value={campaign.tone} onValueChange={v => setCampaign({ ...campaign, tone: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="persuasive">Persuasive</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                        <SelectItem value="newsletter">Informative</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4 border-t space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label>Subject Line</Label>
                                        <Button variant="ghost" size="sm" onClick={generateSubjects} disabled={isGenerating}>
                                            <Sparkles className="h-3 w-3 mr-1" /> AI Suggestions
                                        </Button>
                                    </div>
                                    <Input
                                        value={campaign.subject}
                                        onChange={e => setCampaign({ ...campaign, subject: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={generateContent} disabled={isGenerating}>
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Generate Content
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Right: Preview */}
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 bg-muted/20 p-6 rounded-md mx-6 mb-6 overflow-y-auto border border-dashed">
                            {campaign.content ? (
                                <div className="prose dark:prose-invert text-sm" dangerouslySetInnerHTML={{ __html: campaign.content }} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                    <Mail className="h-12 w-12 mb-2 opacity-20" />
                                    <p>Content preview will appear here</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/10">
                            <Button variant="outline"><Save className="h-4 w-4 mr-2" /> Save Draft</Button>
                            <Button onClick={handleSend} disabled={isLoading || !campaign.content}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Send Campaign
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader><CardTitle>Past Campaigns</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">No campaigns sent yet.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </MarketingLayout>
    );
}
