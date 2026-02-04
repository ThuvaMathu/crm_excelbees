"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Campaign } from "@/types/email-campaigns";
import { formatCampaignDate, estimateSendTime } from "@/lib/email-campaigns/utils";
import { CheckCircle2, AlertCircle, Send, Loader2, Eye, Edit, Lock } from "lucide-react";
import { toast } from "sonner";

export default function CampaignReviewPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const campaignId = params.campaignId as string;

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

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

        if (!confirm(`Send this campaign to ${campaign.recipientCount} recipients?`)) {
            return;
        }

        setSending(true);
        try {
            const response = await fetch(`/api/marketing/campaigns/${campaignId}/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user?.uid }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to send campaign");
            }

            toast.success("Campaign is being sent!");
            router.push(`/marketing/email-campaigns/${campaignId}/analytics`);
        } catch (error: any) {
            console.error("Error sending campaign:", error);
            toast.error(error.message || "Failed to send campaign");
        } finally {
            setSending(false);
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
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Ready to send?</p>
                                <p className="text-sm text-muted-foreground">
                                    This will send to {campaign.recipientCount} recipients
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
                                    onClick={() => router.push(`/marketing/email-campaigns/${campaignId}/build`)}
                                >
                                    Edit Campaign
                                </Button>
                                <Button
                                    onClick={handleSend}
                                    disabled={!allChecked || sending || !canSendCampaign}
                                    title={canSendCampaign ? "Send campaign now" : "You don't have permission to send campaigns"}
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : canSendCampaign ? (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Now
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
        </MarketingLayout>
    );
}
