"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Campaign, CampaignStatus } from "@/types/email-campaigns";
import { formatCampaignStatus, getCampaignStatusColor, formatCampaignDate } from "@/lib/email-campaigns/utils";
import {
    Plus,
    Mail,
    Send,
    Clock,
    CheckCircle2,
    Archive,
    Search,
    BarChart3,
    Users,
    FileText,
    Settings,
    Loader2,
    Copy,
    Eye,
    Edit,
    Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function EmailCampaignsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<CampaignStatus | "all">("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (user) {
            loadCampaigns();
        }
    }, [user, activeTab]);

    const loadCampaigns = async () => {
        if (!user?.uid) return;

        try {
            setLoading(true);
            const params = new URLSearchParams({
                userId: user.uid,
                ...(activeTab !== "all" && { status: activeTab }),
            });

            const response = await fetch(`/api/marketing/campaigns?${params}`);
            if (!response.ok) {
                console.warn("Campaigns API returned error, showing empty state");
                setCampaigns([]);
                return;
            }

            const data = await response.json();
            setCampaigns(data.campaigns || []);
        } catch (error) {
            console.error("Error loading campaigns:", error);
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    };

    const handleClone = async (campaignId: string) => {
        try {
            const response = await fetch(`/api/marketing/campaigns/${campaignId}/clone`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user?.uid }),
            });

            if (!response.ok) throw new Error("Failed to clone campaign");

            toast.success("Campaign cloned successfully");
            loadCampaigns();
        } catch (error) {
            console.error("Error cloning campaign:", error);
            toast.error("Failed to clone campaign");
        }
    };

    const handleDelete = async (campaignId: string) => {
        if (!confirm("Are you sure you want to delete this campaign?")) return;

        try {
            const response = await fetch(
                `/api/marketing/campaigns/${campaignId}?userId=${user?.uid}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            toast.success("Campaign deleted");
            loadCampaigns();
        } catch (error: any) {
            console.error("Error deleting campaign:", error);
            toast.error(error.message || "Failed to delete campaign");
        }
    };

    const filteredCampaigns = campaigns.filter((campaign) =>
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate stats
    const stats = {
        total: campaigns.length,
        draft: campaigns.filter((c) => c.status === "draft").length,
        scheduled: campaigns.filter((c) => c.status === "scheduled").length,
        sent: campaigns.filter((c) => c.status === "sent").length,
    };

    return (
        <MarketingLayout
            title="Email Campaigns"
            description="Create and manage email marketing campaigns"
            actions={
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/marketing/email-campaigns/templates")}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Templates
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/marketing/email-campaigns/audiences")}
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Audiences
                    </Button>
                    <Button onClick={() => router.push("/marketing/email-campaigns/new")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Campaign
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                            <Edit className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.draft}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.scheduled}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sent</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.sent}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search campaigns..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Campaign List */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="draft">Draft</TabsTrigger>
                        <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                        <TabsTrigger value="sent">Sent</TabsTrigger>
                        <TabsTrigger value="archived">Archived</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredCampaigns.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Mail className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                                    <p className="text-muted-foreground">
                                        {searchQuery ? "No campaigns found" : "No campaigns yet"}
                                    </p>
                                    {!searchQuery && (
                                        <Button
                                            onClick={() => router.push("/marketing/email-campaigns/new")}
                                            className="mt-4"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Your First Campaign
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {filteredCampaigns.map((campaign) => (
                                    <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getCampaignStatusColor(
                                                                campaign.status
                                                            )}`}
                                                        >
                                                            {formatCampaignStatus(campaign.status)}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground mb-3">
                                                        {campaign.subject}
                                                    </p>

                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-4 w-4" />
                                                            {campaign.recipientCount} recipients
                                                        </span>
                                                        <span>
                                                            Created {formatCampaignDate(
                                                                (campaign.createdAt as any)?._seconds
                                                                    ? new Date((campaign.createdAt as any)._seconds * 1000)
                                                                    : new Date(campaign.createdAt as any),
                                                                false
                                                            )}
                                                        </span>
                                                        {campaign.sentAt && (
                                                            <span>
                                                                Sent {formatCampaignDate(
                                                                    (campaign.sentAt as any)?._seconds
                                                                        ? new Date((campaign.sentAt as any)._seconds * 1000)
                                                                        : new Date(campaign.sentAt as any)
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {campaign.stats && (
                                                        <div className="flex items-center gap-4 mt-3 text-sm">
                                                            <span className="text-green-600">
                                                                Opens: {campaign.stats.openRate}%
                                                            </span>
                                                            <span className="text-blue-600">
                                                                Clicks: {campaign.stats.clickRate}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {campaign.status === "sent" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                router.push(
                                                                    `/marketing/email-campaigns/${campaign.id}/analytics`
                                                                )
                                                            }
                                                        >
                                                            <BarChart3 className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.push(`/marketing/email-campaigns/${campaign.id}`)
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    {campaign.status === "draft" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                router.push(`/marketing/email-campaigns/${campaign.id}/build`)
                                                            }
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleClone(campaign.id)}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>

                                                    {(campaign.status === "draft" || campaign.status === "archived") && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(campaign.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </MarketingLayout>
    );
}
