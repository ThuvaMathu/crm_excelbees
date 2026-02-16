"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Campaign, CampaignStats } from "@/types/email-campaigns";
import { formatCampaignDate, getCampaignStatusColor, formatCampaignStatus } from "@/lib/email-campaigns/utils";
import {
    ArrowLeft,
    Mail,
    Users,
    Calendar,
    Eye,
    MousePointerClick,
    TrendingUp,
    Edit,
    Send,
    Clock,
    XCircle,
    Loader2,
    Copy,
    Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function CampaignDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const campaignId = params.campaignId as string;

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    // Role-based access control
    const canEdit = user?.role === "admin" || user?.role === "manager";
    const canDelete = user?.role === "admin" || user?.role === "manager";

    useEffect(() => {
        if (user && campaignId) {
            loadData();
        }
    }, [user, campaignId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load campaign
            const campaignRes = await fetch(`/api/marketing/campaigns/${campaignId}?userId=${user?.uid}`);
            if (!campaignRes.ok) throw new Error("Failed to load campaign");

            const campaignData = await campaignRes.json();
            setCampaign(campaignData.campaign);

            // Load analytics if sent
            if (campaignData.campaign.status === "sent" || campaignData.campaign.status === "sending") {
                try {
                    const analyticsRes = await fetch(
                        `/api/marketing/campaigns/${campaignId}/analytics?userId=${user?.uid}`
                    );
                    if (analyticsRes.ok) {
                        const analyticsData = await analyticsRes.json();
                        setAnalytics(analyticsData);
                    }
                } catch {
                    // Analytics not critical
                }
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load campaign");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!campaign) return;

        if (!confirm(`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`)) {
            return;
        }

        setDeleting(true);
        try {
            const response = await fetch(`/api/marketing/campaigns/${campaignId}?userId=${user?.uid}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete campaign");
            }

            toast.success("Campaign deleted successfully");
            router.push("/marketing/email-campaigns");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete campaign";
            console.error("Error deleting campaign:", error);
            toast.error(errorMessage);
        } finally {
            setDeleting(false);
        }
    };

    const handleCancelSchedule = async () => {
        if (!campaign) return;

        if (!confirm(`Cancel the scheduled send for "${campaign.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/marketing/campaigns/${campaignId}/send?userId=${user?.uid}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to cancel schedule");
            }

            toast.success("Schedule cancelled");
            loadData();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to cancel schedule";
            console.error("Error cancelling schedule:", error);
            toast.error(errorMessage);
        }
    };

    if (loading) {
        return (
            <MarketingLayout title="Campaign Details">
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

    const stats = analytics?.stats as CampaignStats | undefined;

    return (
        <MarketingLayout
            title={campaign.name}
            description={campaign.description || campaign.subject}
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push("/marketing/email-campaigns")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    {campaign.status === "draft" && (
                        <Button
                            onClick={() => router.push(`/marketing/email-campaigns/${campaignId}/build`)}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Campaign
                        </Button>
                    )}
                    {(campaign.status === "draft" || campaign.status === "scheduled") && canEdit && (
                        <Button
                            onClick={() => router.push(`/marketing/email-campaigns/${campaignId}/review`)}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {campaign.status === "scheduled" ? "Review Schedule" : "Review & Send"}
                        </Button>
                    )}
                    {(campaign.status === "sent" || campaign.status === "sending") && (
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/marketing/email-campaigns/${campaignId}/analytics`)}
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Analytics
                        </Button>
                    )}
                </div>
            }
        >
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Status Header */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <Badge className={getCampaignStatusColor(campaign.status)}>
                                        {formatCampaignStatus(campaign.status)}
                                    </Badge>
                                    {campaign.folder && (
                                        <Badge variant="outline">{campaign.folder}</Badge>
                                    )}
                                    <Badge variant="outline">{campaign.type}</Badge>
                                </div>
                                <h1 className="text-2xl font-bold">{campaign.name}</h1>
                                {campaign.description && (
                                    <p className="text-muted-foreground">{campaign.description}</p>
                                )}
                            </div>
                            {campaign.status === "scheduled" && canEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelSchedule}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Schedule
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Campaign Tabs */}
                <Tabs defaultValue="details">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="audience">Audience</TabsTrigger>
                        <TabsTrigger value="analytics" disabled={!stats}>
                            Analytics
                        </TabsTrigger>
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Email Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">From Name</p>
                                        <p className="font-medium">{campaign.from.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">From Email</p>
                                        <p className="font-medium">{campaign.from.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Reply-To</p>
                                        <p className="font-medium">{campaign.replyTo}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Subject Line</p>
                                        <p className="font-medium">{campaign.subject}</p>
                                    </div>
                                </div>
                                {campaign.previewText && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Preview Text</p>
                                        <p className="font-medium">{campaign.previewText}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Sending Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Emails Per Hour</p>
                                        <p className="font-medium">{campaign.throttling.emailsPerHour.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Retry Failed</p>
                                        <p className="font-medium">{campaign.throttling.retryFailed ? "Yes" : "No"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-muted-foreground">Track Opens:</p>
                                        <Badge variant={campaign.tracking.trackOpens ? "default" : "secondary"}>
                                            {campaign.tracking.trackOpens ? "Enabled" : "Disabled"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-muted-foreground">Track Clicks:</p>
                                        <Badge variant={campaign.tracking.trackClicks ? "default" : "secondary"}>
                                            {campaign.tracking.trackClicks ? "Enabled" : "Disabled"}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Timeline</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Created</p>
                                        <p className="text-sm">{formatCampaignDate(campaign.createdAt.toDate())}</p>
                                    </div>
                                </div>
                                {campaign.scheduledAt && (
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-4 w-4 text-amber-600" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Scheduled For</p>
                                            <p className="text-sm">{formatCampaignDate(campaign.scheduledAt.toDate())}</p>
                                        </div>
                                    </div>
                                )}
                                {campaign.sentAt && (
                                    <div className="flex items-center gap-3">
                                        <Send className="h-4 w-4 text-green-600" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Sent</p>
                                            <p className="text-sm">{formatCampaignDate(campaign.sentAt.toDate())}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Edit className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Last Updated</p>
                                        <p className="text-sm">{formatCampaignDate(campaign.updatedAt.toDate())}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Content Tab */}
                    <TabsContent value="content">
                        <Card>
                            <CardHeader>
                                <CardTitle>Email Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg p-6 bg-white dark:bg-slate-900 max-h-[600px] overflow-y-auto">
                                    <div className="mb-4 pb-4 border-b">
                                        <p className="text-sm text-muted-foreground">From: {campaign.from.name} &lt;{campaign.from.email}&gt;</p>
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
                    </TabsContent>

                    {/* Audience Tab */}
                    <TabsContent value="audience">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recipient Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="p-4 border rounded-lg">
                                        <p className="text-sm text-muted-foreground">Total Recipients</p>
                                        <p className="text-2xl font-bold">{campaign.recipientCount.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <p className="text-sm text-muted-foreground">Audiences</p>
                                        <p className="text-2xl font-bold">{campaign.audienceIds?.length || 0}</p>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <p className="text-sm text-muted-foreground">Est. Send Time</p>
                                        <p className="text-lg font-bold">
                                            {campaign.throttling.emailsPerHour} emails/hour
                                        </p>
                                    </div>
                                </div>
                                {stats && (
                                    <div className="border-t pt-4">
                                        <p className="font-medium mb-3">Delivery Statistics</p>
                                        <div className="grid gap-4 md:grid-cols-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Sent</p>
                                                <p className="text-xl font-bold">{stats.sent.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Delivered</p>
                                                <p className="text-xl font-bold">{stats.delivered.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Opens</p>
                                                <p className="text-xl font-bold">{stats.opened.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Clicks</p>
                                                <p className="text-xl font-bold">{stats.clicked.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics">
                        {stats ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.openRate}%</div>
                                        <p className="text-xs text-muted-foreground">
                                            {stats.opened} opens
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.clickRate}%</div>
                                        <p className="text-xs text-muted-foreground">
                                            {stats.clicked} clicks
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.deliveryRate}%</div>
                                        <p className="text-xs text-muted-foreground">
                                            {stats.delivered} delivered
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {((stats.bounced / stats.sent) * 100).toFixed(1)}%
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {stats.bounced} bounced
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Eye className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                                    <p className="text-muted-foreground">
                                        Analytics will be available after the campaign is sent
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Danger Zone */}
                {(campaign.status === "draft" || campaign.status === "scheduled") && canDelete && (
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Delete Campaign</p>
                                    <p className="text-sm text-muted-foreground">
                                        Permanently delete this campaign and all its data
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Campaign
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MarketingLayout>
    );
}
