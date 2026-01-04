"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Eye,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    TrendingUp,
    MapPin
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import type { CompetitorAnalysisDocument } from "@/types/competitor-analysis";

export default function CompetitorsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [analyses, setAnalyses] = useState<CompetitorAnalysisDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadAnalyses();
        }
    }, [user]);

    const loadAnalyses = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const q = query(
                collection(db, "marketing/competitor/analyses"),
                where("userId", "==", user.uid),
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            })) as CompetitorAnalysisDocument[];

            setAnalyses(data);
        } catch (error) {
            console.error("Failed to load analyses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "complete":
                return (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                    </Badge>
                );
            case "discovering":
            case "scraping":
            case "analyzing":
                return (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                );
            case "failed":
                return (
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    return (
        <MarketingLayout
            title="Competitor Intelligence"
            description="Discover, analyze, and outmaneuver your competition with AI-powered insights."
        >
            <div className="space-y-6">
                {/* Header with CTA */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Your Analyses</h2>
                        <p className="text-muted-foreground">
                            Track and manage your competitive intelligence reports
                        </p>
                    </div>
                    <Button
                        size="lg"
                        onClick={() => router.push("/marketing/competitors/new")}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Start New Analysis
                    </Button>
                </div>

                {/* Empty State */}
                {!isLoading && analyses.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="rounded-full bg-primary/10 p-4 mb-4">
                                <TrendingUp className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
                            <p className="text-muted-foreground text-center max-w-md mb-6">
                                Get started by creating your first competitive analysis. Discover your competitors,
                                analyze their strategies, and gain actionable insights.
                            </p>
                            <Button
                                onClick={() => router.push("/marketing/competitors/new")}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Create Your First Analysis
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {/* Analyses Table */}
                {!isLoading && analyses.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Analysis History</CardTitle>
                            <CardDescription>
                                View and manage your competitive intelligence reports
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analyses.map((analysis) => (
                                    <div
                                        key={analysis.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-semibold">
                                                    {analysis.userBusinessProfile?.industry || "Analysis"}
                                                </h4>
                                                {getStatusBadge(analysis.status)}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {analysis.location}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="h-3 w-3" />
                                                    {analysis.competitorsFound?.length || 0} competitors
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(analysis.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {analysis.status === "complete" && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => router.push(`/marketing/competitors/${analysis.id}/report`)}
                                                    className="gap-2"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View Report
                                                </Button>
                                            )}
                                            {analysis.status === "failed" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push("/marketing/competitors/new")}
                                                >
                                                    Retry
                                                </Button>
                                            )}
                                            {analysis.status === "discovering" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/marketing/competitors/${analysis.id}/confirm`)}
                                                    className="gap-2"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Review & Confirm
                                                </Button>
                                            )}
                                            {(analysis.status === "scraping" ||
                                                analysis.status === "analyzing") && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => router.push(`/marketing/competitors/${analysis.id}/analyzing`)}
                                                        className="gap-2"
                                                    >
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        View Progress
                                                    </Button>
                                                )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MarketingLayout>
    );
}
