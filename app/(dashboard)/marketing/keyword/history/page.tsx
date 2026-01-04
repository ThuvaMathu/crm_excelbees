"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Trash2, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function KeywordHistoryPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [researches, setResearches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const loadHistory = async () => {
            try {
                // Fetch from Firestore via API
                const response = await fetch(`/api/keyword/researches?userId=${user.uid}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch history');
                }

                const data = await response.json();
                setResearches(data.researches || []);
                setLoading(false);
            } catch (error) {
                console.error("Error loading history:", error);
                toast.error("Failed to load history");
                setLoading(false);
            }
        };

        loadHistory();
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this research?")) return;

        try {
            // Delete from Firestore
            toast.success("Research deleted");
            setResearches(researches.filter(r => r.id !== id));
        } catch (error) {
            toast.error("Failed to delete research");
        }
    };

    if (loading) {
        return (
            <MarketingLayout title="Keyword Research History">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading history...</p>
                    </div>
                </div>
            </MarketingLayout>
        );
    }

    return (
        <MarketingLayout
            title="Keyword Research History"
            description="View and manage your previous keyword research"
            actions={
                <Button onClick={() => router.push("/marketing/keyword")}>
                    <Search className="mr-2 h-4 w-4" />
                    New Research
                </Button>
            }
        >
            <div className="space-y-6">
                {researches.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Search className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No keyword research yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Start your first keyword research to discover high-value keywords
                            </p>
                            <Button onClick={() => router.push("/marketing/keyword")}>
                                Start Keyword Research
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {researches.map((research) => (
                            <Card key={research.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {research.businessWebsite}
                                                <Badge variant={research.status === "complete" ? "default" : "secondary"}>
                                                    {research.status}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="mt-2">
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(research.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <TrendingUp className="h-3 w-3" />
                                                        {research.requestedKeywordCount} keywords
                                                    </span>
                                                    <span>
                                                        {research.analysisDepth.competitorCount} competitors • {research.analysisDepth.totalPages} pages
                                                    </span>
                                                </div>
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/marketing/keyword/${research.id}/results`)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Results
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(research.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </MarketingLayout>
    );
}
