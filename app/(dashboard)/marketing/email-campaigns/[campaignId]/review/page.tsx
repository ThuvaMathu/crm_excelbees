"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Campaign } from "@/types/email-campaigns";
import { formatCampaignDate, estimateSendTime } from "@/lib/email-campaigns/utils";
import { CheckCircle2, AlertCircle, Send, Loader2, Eye, Edit, Lock, Play, Clock } from "lucide-react";
import { toast } from "sonner";

type SendMode = "now" | "schedule";

export default function CampaignReviewPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const campaignId = params.campaignId as string;

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [testEmails, setTestEmails] = useState(user?.email || "");
    const [sendingTest, setSendingTest] = useState(false);
    const [sendMode, setSendMode] = useState<SendMode>("now");
    const [scheduledFor, setScheduledFor] = useState("");

    // Role-based access control - only admins and managers can send campaigns
    const canSendCampaign = user?.role === "admin" || user?.role === "manager";

    const logPermissionCheck = (action: string, allowed: boolean) => {
        console.log(`[RBAC] Campaign ${action} for campaign ${campaignId} by user ${user?.uid} (${user?.role}): ${allowed ? "ALLOWED" : "DENIED"}`);
    };

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

    const handleSend = async () => {
        if (!campaign) return;

        if (!canSendCampaign) {
            logPermissionCheck("send", false);
            toast.error("Only admins and managers can send email campaigns");
            return;
        }

        logPermissionCheck("send", true);

        // Validate scheduled date if scheduling
        if (sendMode === "schedule") {
            if (!scheduledFor) {
                toast.error("Please select a date and time to schedule");
                return;
            }
            const scheduledDate = new Date(scheduledFor);
            if (scheduledDate <= new Date()) {
                toast.error("Scheduled time must be in the future");
                return;
            }
        }

        const confirmMessage = sendMode === "now"
            ? `Send this campaign to ${campaign.recipientCount} recipients immediately?`
            : `Schedule this campaign for ${new Date(scheduledFor).toLocaleString()}?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        setSending(true);
        try {
            const response = await fetch(`/api/marketing/campaigns/${campaignId}/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.uid,
                    scheduledFor: sendMode === "schedule" ? scheduledFor : undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to send campaign");
            }

            const data = await response.json();
            toast.success(data.message || "Campaign scheduled successfully!");

            if (sendMode === "now") {
                router.push(`/marketing/email-campaigns/${campaignId}/analytics`);
            } else {
                // Reload campaign to show updated status
                loadCampaign();
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to send campaign";
            console.error("Error sending campaign:", error);
            toast.error(errorMessage);
        } finally {
            setSending(false);
        }
    };

    const handleSendTest = async () => {
        if (!testEmails.trim()) {
            toast.error("Please enter at least one email address");
            return;
        }

        const emails = testEmails.split(",").map((e) => e.trim()).filter(Boolean);

        setSendingTest(true);
        try {
            const response = await fetch(`/api/marketing/campaigns/${campaignId}/test-send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.uid,
                    testEmails: emails,
                    personalizationData: {
                        FirstName: user?.displayName?.split(" ")[0] || "Test",
                        LastName: user?.displayName?.split(" ").slice(1).join(" ") || "User",
                        Email: user?.email,
                        Company: "Your Company",
                    },
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to send test email");
            }

            const data = await response.json();
            toast.success(data.message || "Test email sent successfully!");
            setTestDialogOpen(false);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to send test email";
            console.error("Error sending test email:", error);
            toast.error(errorMessage);
        } finally {
            setSendingTest(false);
        }
    };

    if (loading) {
        return (
            <MarketingLayout title="Review Campaign">
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
                    </CardContent>
                </Card>
            </MarketingLayout>
        );
    }

    const checklist = {
        details: !!campaign.name && !!campaign.from.name && !!campaign.from.email,
        content: !!campaign.subject && !!campaign.content.html,
        audience: campaign.recipientCount > 0,
    };

    const allChecked = Object.values(checklist).every((v) => v);

    return (
        <MarketingLayout
            title="Review & Send"
            description={`Review ${campaign.name} before sending`}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Pre-Send Checklist */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pre-Send Checklist</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            {checklist.details ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <p className="font-medium">Campaign Details</p>
                                <p className="text-sm text-muted-foreground">
                                    Name: {campaign.name} | From: {campaign.from.name} &lt;{campaign.from.email}&gt;
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            {checklist.content ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <p className="font-medium">Email Content</p>
                                <p className="text-sm text-muted-foreground">
                                    Subject: {campaign.subject || "Not set"}
                                </p>
                                {campaign.previewText && (
                                    <p className="text-sm text-muted-foreground">
                                        Preview: {campaign.previewText}
                                    </p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/marketing/email-campaigns/${campaignId}/build`)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-start gap-3">
                            {checklist.audience ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <p className="font-medium">Audience</p>
                                <p className="text-sm text-muted-foreground">
                                    {campaign.recipientCount > 0
                                        ? `${campaign.recipientCount} recipients`
                                        : "No recipients selected"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-medium">Tracking</p>
                                <p className="text-sm text-muted-foreground">
                                    Opens: {campaign.tracking.trackOpens ? "Enabled" : "Disabled"} | Clicks:{" "}
                                    {campaign.tracking.trackClicks ? "Enabled" : "Disabled"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-medium">Sending Settings</p>
                                <p className="text-sm text-muted-foreground">
                                    Throttling: {campaign.throttling.emailsPerHour} emails/hour | Est. time:{" "}
                                    {estimateSendTime(campaign.recipientCount, campaign.throttling.emailsPerHour)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Email Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Email Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg p-6 bg-white dark:bg-slate-900">
                            <div className="mb-4 pb-4 border-b">
                                <p className="text-sm text-muted-foreground">From: {campaign.from.name}</p>
                                <p className="text-lg font-semibold mt-2">{campaign.subject}</p>
                                {campaign.previewText && (
                                    <p className="text-sm text-muted-foreground mt-1">{campaign.previewText}</p>
                                )}
                            </div>
                            <div
                                className="prose dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: campaign.content.html || "<p>No content</p>" }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                    <CardContent className="p-6 space-y-6">
                        {/* Send Mode Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSendMode("now")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                        sendMode === "now"
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    <Send className="h-4 w-4" />
                                    Send Now
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSendMode("schedule")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                        sendMode === "schedule"
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    <Clock className="h-4 w-4" />
                                    Schedule for Later
                                </button>
                            </div>

                            {/* Scheduling Options */}
                            {sendMode === "schedule" && (
                                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                                    <Label htmlFor="scheduledFor">Schedule Date & Time</Label>
                                    <Input
                                        id="scheduledFor"
                                        type="datetime-local"
                                        min={new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16)}
                                        value={scheduledFor}
                                        onChange={(e) => setScheduledFor(e.target.value)}
                                        className="w-full md:w-1/2"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Campaign will be sent automatically at the scheduled time.
                                        You can cancel scheduled campaigns from the campaigns list.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div>
                                <p className="font-medium">
                                    {sendMode === "now" ? "Ready to send?" : "Schedule campaign?"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {sendMode === "now"
                                        ? `This will send to ${campaign.recipientCount} recipients immediately`
                                        : `This will schedule to ${campaign.recipientCount} recipients`}
                                </p>
                                {!canSendCampaign && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <Lock className="h-3 w-3" />
                                        Only admins and managers can send campaigns
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setTestDialogOpen(true)}
                                    disabled={sendingTest}
                                >
                                    {sendingTest ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending Test...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4 mr-2" />
                                            Send Test Email
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/marketing/email-campaigns/${campaignId}/build`)}
                                >
                                    Edit Campaign
                                </Button>
                                <Button
                                    onClick={handleSend}
                                    disabled={!allChecked || sending || !canSendCampaign || (sendMode === "schedule" && !scheduledFor)}
                                    title={canSendCampaign ? (sendMode === "now" ? "Send campaign now" : "Schedule campaign") : "You don't have permission to send campaigns"}
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {sendMode === "now" ? "Sending..." : "Scheduling..."}
                                        </>
                                    ) : canSendCampaign ? (
                                        <>
                                            {sendMode === "now" ? (
                                                <>
                                                    <Send className="h-4 w-4 mr-2" />
                                                    Send Now
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="h-4 w-4 mr-2" />
                                                    Schedule Campaign
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-4 w-4 mr-2" />
                                            Send Locked
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Test Email Dialog */}
            <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Test Email</DialogTitle>
                        <DialogDescription>
                            Send a test email to verify the content and appearance before sending to your audience.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="testEmails">Test Email Addresses</Label>
                            <Input
                                id="testEmails"
                                placeholder="email1@example.com, email2@example.com"
                                value={testEmails}
                                onChange={(e) => setTestEmails(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Separate multiple emails with commas
                            </p>
                        </div>
                        <div className="bg-muted rounded-lg p-4">
                            <p className="text-sm font-medium mb-2">Test Personalization</p>
                            <p className="text-xs text-muted-foreground">
                                The test email will use your information for personalization tags like {`{{FirstName}}`}, {`{{LastName}}`}, etc.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSendTest} disabled={sendingTest || !testEmails.trim()}>
                            {sendingTest ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Test
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MarketingLayout>
    );
}
