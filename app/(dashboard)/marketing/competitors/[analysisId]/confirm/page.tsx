"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Globe, Star, MessageSquare, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import type { CompetitorAnalysisDocument, DiscoveredCompetitor } from "@/types/competitor-analysis";

export default function ConfirmCompetitorsPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const analysisId = params.analysisId as string;

    const [analysis, setAnalysis] = useState<CompetitorAnalysisDocument | null>(null);
    const [competitors, setCompetitors] = useState<DiscoveredCompetitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (analysisId) {
            loadAnalysis();
        }
    }, [analysisId]);

    const loadAnalysis = async () => {
        try {
            setIsLoading(true);
            const docRef = doc(db, "marketing/competitor/analyses", analysisId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as CompetitorAnalysisDocument;
                setAnalysis(data);
                setCompetitors(data.competitorsFound || []);
            } else {
                toast.error("Analysis not found");
                router.push("/marketing/competitors");
            }
        } catch (error) {
            console.error("Failed to load analysis:", error);
            toast.error("Failed to load analysis");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCompetitor = (index: number) => {
        setCompetitors(prev =>
            prev.map((c, i) =>
                i === index ? { ...c, selected: !c.selected } : c
            )
        );
    };

    const handleAnalyze = async () => {
        const selectedCompetitors = competitors.filter(c => c.selected);

        if (selectedCompetitors.length === 0) {
            toast.error("Please select at least one competitor");
            return;
        }

        setIsSubmitting(true);

        try {
            // Update analysis document with selected competitors
            await updateDoc(doc(db, "marketing/competitor/analyses", analysisId), {
                competitorsFound: competitors,
                updatedAt: new Date(),
            });

            // Step 4: Scrape competitors
            toast.loading("Scraping competitor websites...", { id: "scraping" });

            const scrapeRes = await fetch("/api/marketing/scrape-competitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    analysisId,
                    competitors: selectedCompetitors.map(c => ({
                        name: c.name,
                        website: c.website,
                    })),
                }),
            });

            if (!scrapeRes.ok) {
                throw new Error("Failed to scrape competitors");
            }

            const { scrapedData } = await scrapeRes.json();

            // Step 5: Analyze content
            toast.loading("Analyzing competitor content...", { id: "scraping" });

            const analyzeRes = await fetch("/api/marketing/analyze-competitor-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    analysisId,
                    scrapedData,
                }),
            });

            if (!analyzeRes.ok) {
                throw new Error("Failed to analyze competitors");
            }

            // Step 8: Generate insights
            toast.loading("Generating competitive insights...", { id: "scraping" });

            const insightsRes = await fetch("/api/marketing/generate-insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    analysisId,
                }),
            });

            if (!insightsRes.ok) {
                throw new Error("Failed to generate insights");
            }

            const { report } = await insightsRes.json();

            toast.success("Analysis complete!", { id: "scraping" });

            // Navigate to report
            router.push(`/marketing/competitors/${analysisId}/report`);

        } catch (error) {
            console.error("Error analyzing competitors:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to analyze competitors",
                { id: "scraping" }
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedCount = competitors.filter(c => c.selected).length;

    if (isLoading) {
        return (
            <MarketingLayout
                title="Confirm Competitors"
                description="Review and select competitors to analyze"
            >
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </MarketingLayout>
        );
    }

    return (
        <MarketingLayout
            title="Confirm Competitors"
            description="Review and select competitors to analyze"
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Summary Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Discovered Competitors</CardTitle>
                        <CardDescription>
                            We found {competitors.length} potential competitors for{" "}
                            <span className="font-semibold text-foreground">
                                {analysis?.userBusinessProfile?.industry}
                            </span>{" "}
                            in {analysis?.location}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <span className="font-semibold">
                                    {selectedCount} of {competitors.length} selected
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCompetitors(prev => prev.map(c => ({ ...c, selected: true })))}
                            >
                                Select All
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Competitors List */}
                <div className="space-y-3">
                    {competitors.map((competitor, index) => (
                        <Card
                            key={index}
                            className={`cursor-pointer transition-all ${competitor.selected
                                ? "border-primary bg-primary/5"
                                : "hover:border-accent-foreground/20"
                                }`}
                            onClick={() => toggleCompetitor(index)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <Checkbox
                                        checked={competitor.selected}
                                        onCheckedChange={() => toggleCompetitor(index)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-lg">{competitor.name}</h4>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                    <Globe className="h-3 w-3" />
                                                    <a
                                                        href={competitor.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {competitor.website}
                                                    </a>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="ml-2">
                                                {competitor.source === "gemini" && "AI Discovery"}
                                                {competitor.source === "google_places" && "AI Discovery"}
                                                {competitor.source === "web_search" && "Web Search"}
                                                {competitor.source === "user_provided" && "User Provided"}
                                            </Badge>
                                        </div>

                                        {(competitor.rating || competitor.reviewCount) && (
                                            <div className="flex items-center gap-4 text-sm">
                                                {competitor.rating && (
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                        <span className="font-medium">{competitor.rating}</span>
                                                    </div>
                                                )}
                                                {competitor.reviewCount && (
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <MessageSquare className="h-4 w-4" />
                                                        <span>{competitor.reviewCount.toLocaleString()} reviews</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/marketing/competitors")}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleAnalyze}
                        disabled={isSubmitting || selectedCount === 0}
                        className="gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                Analyze {selectedCount} Competitor{selectedCount !== 1 ? "s" : ""}
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </MarketingLayout>
    );
}
