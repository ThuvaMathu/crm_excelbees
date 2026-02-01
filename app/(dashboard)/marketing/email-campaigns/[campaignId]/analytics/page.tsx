"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Campaign, CampaignStats } from "@/types/email-campaigns";
import { formatCampaignDate } from "@/lib/email-campaigns/utils";
import {
    ArrowLeft,
    Mail,
    Eye,
    MousePointerClick,
    TrendingUp,
    Users,
    Loader2,
    Download
} from "lucide-react";
import { toast } from "sonner";

export default function CampaignAnalyticsPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const campaignId = params.campaignId as string;

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

            // Load analytics
            const analyticsRes = await fetch(
                `/api/marketing/campaigns/${campaignId}/analytics?userId=${user?.uid}`
            );
            if (!analyticsRes.ok) throw new Error("Failed to load analytics");
            const analyticsData = await analyticsRes.json();
            setAnalytics(analyticsData);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MarketingLayout title="Campaign Analytics">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </MarketingLayout>
        );
    }

    if (!campaign || !analytics) {
        return (
            <MarketingLayout title="Analytics Not Found">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Analytics data not available</p>
                    </CardContent>
                </Card>
            </MarketingLayout>
        );
    }

    const stats = analytics.stats as CampaignStats;

    return (
        <MarketingLayout
            title={`Analytics: ${campaign.name}`}
            description={`Performance metrics for campaign sent ${campaign.sentAt ? formatCampaignDate(campaign.sentAt.toDate()) : ""}`}
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push("/marketing/email-campaigns")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Campaigns
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Overview Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sent</CardTitle>
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.sent.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                Delivered: {stats.deliveryRate}%
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Opens</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.opened.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                Rate: {stats.openRate}%
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.clicked.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                Rate: {stats.clickRate}%
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Click-to-Open</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.clickToOpenRate}%</div>
                            <p className="text-xs text-muted-foreground">
                                Engagement quality
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Details */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Engagement Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Engagement Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Delivered</span>
                                    <span className="font-medium">{stats.delivered.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full"
                                        style={{ width: `${stats.deliveryRate}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Opened</span>
                                    <span className="font-medium">{stats.opened.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${stats.openRate}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Clicked</span>
                                    <span className="font-medium">{stats.clicked.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-purple-600 h-2 rounded-full"
                                        style={{ width: `${stats.clickRate}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Bounced</span>
                                    <span className="font-medium text-red-600">{stats.bounced.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-red-600 h-2 rounded-full"
                                        style={{ width: `${(stats.bounced / stats.sent) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Unsubscribed</span>
                                    <span className="font-medium text-orange-600">
                                        {stats.unsubscribed.toLocaleString()}
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-orange-600 h-2 rounded-full"
                                        style={{ width: `${stats.unsubscribeRate}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Device Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Device Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {analytics.deviceBreakdown && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Desktop</span>
                                        <span className="text-sm font-medium">
                                            {analytics.deviceBreakdown.desktop || 0} opens
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Mobile</span>
                                        <span className="text-sm font-medium">
                                            {analytics.deviceBreakdown.mobile || 0} opens
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Tablet</span>
                                        <span className="text-sm font-medium">
                                            {analytics.deviceBreakdown.tablet || 0} opens
                                        </span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Link Clicks */}
                {analytics.linkClicks && Object.keys(analytics.linkClicks).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Link Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(analytics.linkClicks)
                                    .sort(([, a]: any, [, b]: any) => b - a)
                                    .slice(0, 10)
                                    .map(([url, clicks]: any) => (
                                        <div key={url} className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground truncate flex-1 mr-4">
                                                {url}
                                            </span>
                                            <span className="text-sm font-medium">{clicks} clicks</span>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Conversion Tracking */}
                {stats.conversions !== undefined && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Conversions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Conversions</p>
                                    <p className="text-2xl font-bold">{stats.conversions}</p>
                                </div>
                                {stats.revenue !== undefined && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Revenue</p>
                                        <p className="text-2xl font-bold">${stats.revenue.toLocaleString()}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                                    <p className="text-2xl font-bold">
                                        {((stats.conversions / stats.delivered) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MarketingLayout>
    );
}
