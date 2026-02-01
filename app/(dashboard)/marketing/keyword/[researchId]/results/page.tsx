"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Download,
    TrendingUp,
    Target,
    Zap,
    Clock,
    Search,
    BarChart3,
    FileText,
    Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { adminDb as db } from "@/lib/firebase-admin";

export default function KeywordResultsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const researchId = params.researchId as string;

    const [loading, setLoading] = useState(true);
    const [keywords, setKeywords] = useState<any[]>([]);
    const [strategyReport, setStrategyReport] = useState<any>(null);
    const [research, setResearch] = useState<any>(null);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !researchId) return;

        const loadData = async () => {
            try {
                // Load research document
                const researchDoc = await fetch(`/api/keyword/research/${researchId}`);
                if (!researchDoc.ok) {
                    if (researchDoc.status === 404) {
                        setError("Research not found");
                    } else {
                        setError("Failed to load research");
                    }
                    setLoading(false);
                    return;
                }

                const data = await researchDoc.json();
                setResearch(data);

                if (data.keywords && data.keywords.length > 0) {
                    setKeywords(data.keywords);
                }

                if (data.strategyReport) {
                    setStrategyReport(data.strategyReport);
                }

                setLoading(false);
            } catch (error) {
                console.error("Error loading results:", error);
                setError("An error occurred while loading results");
                toast.error("Failed to load results");
                setLoading(false);
            }
        };

        loadData();
    }, [user, researchId]);

    if (error) {
        return (
            <MarketingLayout title="Keyword Research Results">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">{error}</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            The requested research could not be found or accessed.
                        </p>
                        <Button onClick={() => router.push("/marketing/keyword")}>
                            Back to Research Hub
                        </Button>
                    </CardContent>
                </Card>
            </MarketingLayout>
        );
    }

    if (loading) {
        return (
            <MarketingLayout title="Keyword Research Results">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading results...</p>
                    </div>
                </div>
            </MarketingLayout>
        );
    }

    const quickWins = keywords.filter(k => k.difficulty === 'low');
    const coreTargets = keywords.filter(k => k.difficulty === 'medium');
    const keySentences = keywords.filter(k =>
        k.primaryKeyword.split(' ').length >= 4 ||
        k.primaryKeyword.includes('?') ||
        k.searchIntent === 'informational'
    );
    const longTermGoals = keywords.filter(k => k.strategicValue === "long-term-goal");

    const totalSearchVolume = keywords.reduce((sum, k) => sum + k.searchVolume, 0);

    return (
        <MarketingLayout
            title="Keyword Research Results"
            description={`Analysis complete • ${keywords.length} keywords found`}
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push("/marketing/keyword/new")}>
                        New Research
                    </Button>
                    <Button onClick={() => toast.info("Export feature coming soon")}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Overview Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Keywords</CardTitle>
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{keywords.length}</div>
                            <p className="text-xs text-muted-foreground">
                                From {research?.analysisDepth?.totalPages || 0} pages analyzed
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Search Volume</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalSearchVolume.toLocaleString()}/mo</div>
                            <p className="text-xs text-muted-foreground">
                                Combined monthly searches
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Quick Wins</CardTitle>
                            <Zap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{quickWins.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Low difficulty keywords
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Core Targets</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{coreTargets.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Medium difficulty keywords
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="keywords">All Keywords</TabsTrigger>
                        <TabsTrigger value="sentences">Key Sentences</TabsTrigger>
                        <TabsTrigger value="families">Keyword Families</TabsTrigger>
                        <TabsTrigger value="strategy">Strategy</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            {/* Quick Wins */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-green-600" />
                                        Quick Wins
                                    </CardTitle>
                                    <CardDescription>Low difficulty, decent volume</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {quickWins.slice(0, 5).map((kw) => (
                                            <div key={kw.rank} className="flex justify-between items-center">
                                                <span className="text-sm">{kw.primaryKeyword}</span>
                                                <Badge variant="outline" className="text-green-600">
                                                    {kw.searchVolume}
                                                </Badge>
                                            </div>
                                        ))}
                                        {quickWins.length === 0 && (
                                            <p className="text-sm text-muted-foreground">No quick wins found</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Core Targets */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5 text-blue-600" />
                                        Core Targets
                                    </CardTitle>
                                    <CardDescription>Medium difficulty, high relevance</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {coreTargets.slice(0, 5).map((kw) => (
                                            <div key={kw.rank} className="flex justify-between items-center">
                                                <span className="text-sm">{kw.primaryKeyword}</span>
                                                <Badge variant="outline" className="text-blue-600">
                                                    {kw.searchVolume}
                                                </Badge>
                                            </div>
                                        ))}
                                        {coreTargets.length === 0 && (
                                            <p className="text-sm text-muted-foreground">No core targets found</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Long-term Goals */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-purple-600" />
                                        Long-term Goals
                                    </CardTitle>
                                    <CardDescription>High difficulty, high volume</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {longTermGoals.slice(0, 5).map((kw) => (
                                            <div key={kw.rank} className="flex justify-between items-center">
                                                <span className="text-sm">{kw.primaryKeyword}</span>
                                                <Badge variant="outline" className="text-purple-600">
                                                    {kw.searchVolume}
                                                </Badge>
                                            </div>
                                        ))}
                                        {longTermGoals.length === 0 && (
                                            <p className="text-sm text-muted-foreground">No long-term goals found</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* All Keywords Tab */}
                    <TabsContent value="keywords" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>All Keywords</CardTitle>
                                <CardDescription>Complete list of discovered keywords</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-2">Rank</th>
                                                <th className="text-left p-2">Keyword</th>
                                                <th className="text-left p-2">Volume</th>
                                                <th className="text-left p-2">Difficulty</th>
                                                <th className="text-left p-2">Intent</th>
                                                <th className="text-left p-2">Strategic Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {keywords.map((kw) => (
                                                <tr key={kw.rank} className="border-b hover:bg-muted/50">
                                                    <td className="p-2">{kw.rank}</td>
                                                    <td className="p-2 font-medium">{kw.primaryKeyword}</td>
                                                    <td className="p-2">{kw.searchVolume.toLocaleString()}</td>
                                                    <td className="p-2">
                                                        <Badge variant={
                                                            kw.difficulty === "low" ? "outline" :
                                                                kw.difficulty === "medium" ? "secondary" : "destructive"
                                                        }>
                                                            {kw.difficulty}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-2 capitalize">{kw.searchIntent}</td>
                                                    <td className="p-2">
                                                        <Badge variant={
                                                            kw.strategicValue === "quick-win" ? "default" :
                                                                kw.strategicValue === "core-target" ? "secondary" : "outline"
                                                        }>
                                                            {kw.strategicValue}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Key Sentences Tab */}
                    <TabsContent value="sentences" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Key Sentences & Long-Tail Queries</CardTitle>
                                <CardDescription>
                                    Found {keySentences.length} sentences. These are valuable for blog posts, FAQ sections, and featured snippets.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-2">Sentence / Query</th>
                                                <th className="text-left p-2">Intent</th>
                                                <th className="text-left p-2">Volume</th>
                                                <th className="text-left p-2">Difficulty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {keySentences.map((kw) => (
                                                <tr key={kw.keywordId} className="border-b hover:bg-muted/50">
                                                    <td className="p-2 font-medium">{kw.primaryKeyword}</td>
                                                    <td className="p-2">
                                                        <Badge variant="secondary">{kw.searchIntent}</Badge>
                                                    </td>
                                                    <td className="p-2">{kw.searchVolume.toLocaleString()}</td>
                                                    <td className="p-2">
                                                        <Badge variant={
                                                            kw.difficulty === 'high' ? 'destructive' :
                                                                kw.difficulty === 'medium' ? 'secondary' : 'outline'
                                                        }>
                                                            {kw.difficulty}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                            {keySentences.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                                        No key sentences found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Keyword Families Tab */}
                    <TabsContent value="families" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Keyword Families</CardTitle>
                                <CardDescription>Keywords grouped by topic clusters</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Keyword family analysis will be displayed here
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Strategy Tab */}
                    <TabsContent value="strategy" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Strategy Report</CardTitle>
                                <CardDescription>Comprehensive keyword strategy and recommendations</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="prose max-w-none">
                                    <h3>Executive Summary</h3>
                                    <p>{strategyReport?.executiveSummary}</p>

                                    <h3>Next Steps</h3>
                                    <ul>
                                        <li>Target quick-win keywords first for immediate results</li>
                                        <li>Create content for core target keywords</li>
                                        <li>Build authority for long-term goal keywords</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MarketingLayout>
    );
}
