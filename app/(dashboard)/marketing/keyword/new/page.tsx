"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AITextarea } from "@/components/ui/ai-textarea";
import { Loader2, Search, Globe, MapPin, Target, FileText, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function KeywordResearchPage() {
    const router = useRouter();
    const { user } = useAuth();

    // Form state
    const [keywordCount, setKeywordCount] = useState([25]);
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [location, setLocation] = useState("");
    const [competitorSource, setCompetitorSource] = useState<"previous" | "manual" | "auto">("auto");
    const [previousAnalysisId, setPreviousAnalysisId] = useState("");
    const [manualCompetitors, setManualCompetitors] = useState("");
    const [competitorCount, setCompetitorCount] = useState([3]);
    const [pagesPerCompetitor, setPagesPerCompetitor] = useState([10]);

    // Page preferences
    const [prioritizeBlog, setPrioritizeBlog] = useState(false);
    const [prioritizeServices, setPrioritizeServices] = useState(true);
    const [includeLocation, setIncludeLocation] = useState(false);
    const [includeProducts, setIncludeProducts] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const keywordCountOptions = [5, 10, 25, 50, 100, 200];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!websiteUrl || !location) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!user) {
            toast.error("You must be logged in");
            return;
        }

        setIsSubmitting(true);

        try {
            console.log("🚀 Starting keyword research workflow...");

            // Step 1: Extract Business Context
            toast.loading("Analyzing your business...", { id: "keyword-research" });

            const contextRes = await fetch("/api/keyword/extract-business-context", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    websiteUrl,
                    location,
                    userId: user.uid,
                    workspaceId: "demo", // TODO: Get from context
                }),
            });

            if (!contextRes.ok) {
                const error = await contextRes.json();
                throw new Error(error.error || "Failed to analyze business");
            }

            const { businessContext, researchId } = await contextRes.json();
            console.log("✅ Business context extracted", { researchId });

            // Step 2: Identify Competitors
            toast.loading("Identifying competitors...", { id: "keyword-research" });

            const competitorsRes = await fetch("/api/keyword/identify-competitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    researchId,
                    method: competitorSource,
                    data: {
                        previousAnalysisId: competitorSource === "previous" ? previousAnalysisId : undefined,
                        manualUrls: competitorSource === "manual" ? manualCompetitors.split("\n").filter(Boolean) : undefined,
                        autoDiscoverCount: competitorSource === "auto" ? competitorCount[0] : undefined,
                    },
                    businessContext,
                }),
            });

            if (!competitorsRes.ok) {
                const error = await competitorsRes.json();
                throw new Error(error.error || "Failed to identify competitors");
            }

            const { competitors } = await competitorsRes.json();
            console.log(`✅ Found ${competitors.length} competitors`);

            // Step 3: Discover Sitemaps
            toast.loading("Discovering competitor pages...", { id: "keyword-research" });

            const sitemapsRes = await fetch("/api/keyword/discover-sitemaps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    researchId,
                    competitors,
                    pagesPerCompetitor: pagesPerCompetitor[0],
                    pagePreferences: {
                        prioritizeBlog,
                        prioritizeServices,
                        includeLocation,
                        includeProducts,
                    },
                }),
            });

            if (!sitemapsRes.ok) {
                const error = await sitemapsRes.json();
                throw new Error(error.error || "Failed to discover sitemaps");
            }

            const { sitemapsData } = await sitemapsRes.json();
            const allSelectedPages = sitemapsData.flatMap((s: any) =>
                s.selectedPages.map((p: any) => ({
                    ...p,
                    competitorId: s.competitorId,
                    competitorName: s.competitorName,
                }))
            );
            console.log(`✅ Selected ${allSelectedPages.length} pages`);

            // Step 4: Extract Page Content
            toast.loading(`Extracting content from ${allSelectedPages.length} pages...`, { id: "keyword-research" });

            const contentRes = await fetch("/api/keyword/extract-page-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    researchId,
                    selectedPages: allSelectedPages,
                }),
            });

            if (!contentRes.ok) {
                const error = await contentRes.json();
                throw new Error(error.error || "Failed to extract content");
            }

            const { scrapedPages } = await contentRes.json();
            console.log(`✅ Scraped ${scrapedPages.length} pages`);

            // Step 5: Extract Keywords
            toast.loading("Extracting keywords from content...", { id: "keyword-research" });

            const keywordsRes = await fetch("/api/keyword/extract-keywords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    researchId,
                    scrapedPages,
                    businessContext,
                }),
            });

            if (!keywordsRes.ok) {
                const error = await keywordsRes.json();
                throw new Error(error.error || "Failed to extract keywords");
            }

            const { extractedKeywords } = await keywordsRes.json();
            console.log(`✅ Extracted keywords from ${extractedKeywords.length} pages`);

            // Step 6: Aggregate Keywords
            toast.loading("Consolidating keywords...", { id: "keyword-research" });

            const aggregateRes = await fetch("/api/keyword/aggregate-keywords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    researchId,
                    extractedKeywords,
                }),
            });

            if (!aggregateRes.ok) {
                const error = await aggregateRes.json();
                throw new Error(error.error || "Failed to aggregate keywords");
            }

            const { consolidatedKeywords } = await aggregateRes.json();
            console.log(`✅ Consolidated to ${consolidatedKeywords.length} unique keywords`);

            // Step 7: Enrich Keywords
            toast.loading("Enriching keywords with metrics...", { id: "keyword-research" });

            const enrichRes = await fetch("/api/keyword/enrich-keywords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    researchId,
                    consolidatedKeywords,
                    requestedCount: keywordCount[0],
                }),
            });

            if (!enrichRes.ok) {
                const error = await enrichRes.json();
                throw new Error(error.error || "Failed to enrich keywords");
            }

            const { enrichedKeywords } = await enrichRes.json();
            console.log(`✅ Enriched ${enrichedKeywords.length} keywords`);

            // Step 8: Finalize Selection
            toast.loading("Selecting best keywords...", { id: "keyword-research" });

            const selectionRes = await fetch("/api/keyword/finalize-selection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    researchId,
                    enrichedKeywords,
                    requestedCount: keywordCount[0],
                    businessContext,
                    targetSentences: true
                }),
            });

            if (!selectionRes.ok) {
                const error = await selectionRes.json();
                throw new Error(error.error || "Failed to finalize selection");
            }

            const { selectedKeywords } = await selectionRes.json();
            console.log(`✅ Selected ${selectedKeywords.length} final keywords`);

            // Step 9: Generate Strategy
            toast.loading("Generating strategy report...", { id: "keyword-research" });

            const strategyRes = await fetch("/api/keyword/generate-insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    researchId,
                    selectedKeywords,
                    allResearchData: {
                        businessContext,
                        competitors,
                        totalPagesScraped: scrapedPages.length,
                        totalKeywordsExtracted: extractedKeywords.length,
                    },
                }),
            });

            if (!strategyRes.ok) {
                const error = await strategyRes.json();
                throw new Error(error.error || "Failed to generate strategy");
            }

            console.log("✅ Strategy report generated");

            toast.success("Keyword research complete!", { id: "keyword-research" });
            router.push(`/marketing/keyword/${researchId}/results`);
        } catch (error) {
            console.error("Error in keyword research:", error);
            toast.error(error instanceof Error ? error.message : "Failed to complete research", {
                id: "keyword-research",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MarketingLayout
            title="Start New Research"
            description="Discover high-value keywords by analyzing competitor content"
        >
            <div className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Primary Inputs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Research Settings
                            </CardTitle>
                            <CardDescription>
                                Configure your keyword research parameters
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Keyword Count */}
                            <div className="space-y-3">
                                <Label>How many keywords do you want?</Label>
                                <div className="flex items-center gap-4">
                                    <Slider
                                        value={keywordCount}
                                        onValueChange={setKeywordCount}
                                        min={5}
                                        max={200}
                                        step={5}
                                        className="flex-1"
                                    />
                                    <span className="text-2xl font-bold w-16 text-right">{keywordCount[0]}</span>
                                </div>
                                <div className="flex gap-2">
                                    {keywordCountOptions.map((count) => (
                                        <Button
                                            key={count}
                                            type="button"
                                            variant={keywordCount[0] === count ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setKeywordCount([count])}
                                        >
                                            {count}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Website URL */}
                            <div className="space-y-2">
                                <Label htmlFor="website">
                                    <Globe className="h-4 w-4 inline mr-2" />
                                    Your Business Website *
                                </Label>
                                <Input
                                    id="website"
                                    type="url"
                                    placeholder="https://yourbusiness.com"
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <Label htmlFor="location">
                                    <MapPin className="h-4 w-4 inline mr-2" />
                                    Business Location *
                                </Label>
                                <Input
                                    id="location"
                                    placeholder="City, Country"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Competitor Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Competitor Selection
                            </CardTitle>
                            <CardDescription>
                                Choose how to identify competitors for analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <RadioGroup value={competitorSource} onValueChange={(v: any) => setCompetitorSource(v)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="auto" id="auto" />
                                    <Label htmlFor="auto" className="font-normal cursor-pointer">
                                        Auto-discover competitors (AI-powered)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="manual" id="manual" />
                                    <Label htmlFor="manual" className="font-normal cursor-pointer">
                                        Enter competitor URLs manually
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="previous" id="previous" />
                                    <Label htmlFor="previous" className="font-normal cursor-pointer">
                                        Import from previous competitor analysis
                                    </Label>
                                </div>
                            </RadioGroup>

                            {competitorSource === "auto" && (
                                <div className="space-y-3 pl-6">
                                    <Label>Number of Competitors (1-10)</Label>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={competitorCount}
                                            onValueChange={setCompetitorCount}
                                            min={1}
                                            max={10}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <span className="text-xl font-bold w-12 text-right">{competitorCount[0]}</span>
                                    </div>
                                </div>
                            )}

                            {competitorSource === "manual" && (
                                <div className="space-y-2 pl-6">
                                    <Label htmlFor="competitors">Competitor URLs (one per line)</Label>
                                    <AITextarea
                                        id="competitors"
                                        placeholder="https://competitor1.com&#10;https://competitor2.com&#10;https://competitor3.com"
                                        value={manualCompetitors}
                                        onChange={(e) => setManualCompetitors(e.target.value)}
                                        minWords={2}
                                    />
                                </div>
                            )}

                            {competitorSource === "previous" && (
                                <div className="space-y-2 pl-6">
                                    <Label htmlFor="previous-analysis">Previous Analysis ID</Label>
                                    <Input
                                        id="previous-analysis"
                                        placeholder="Enter analysis ID"
                                        value={previousAnalysisId}
                                        onChange={(e) => setPreviousAnalysisId(e.target.value)}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Find this in your competitor analysis history
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Analysis Depth */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Analysis Depth
                            </CardTitle>
                            <CardDescription>
                                Configure how many pages to analyze per competitor
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label>Pages per Competitor (3-20)</Label>
                                <div className="flex items-center gap-4">
                                    <Slider
                                        value={pagesPerCompetitor}
                                        onValueChange={setPagesPerCompetitor}
                                        min={3}
                                        max={20}
                                        step={1}
                                        className="flex-1"
                                    />
                                    <span className="text-xl font-bold w-12 text-right">{pagesPerCompetitor[0]}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Total pages to analyze: <strong>{competitorCount[0] * pagesPerCompetitor[0]}</strong>
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Label>Page Type Preferences</Label>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="blog"
                                            checked={prioritizeBlog}
                                            onCheckedChange={(checked) => setPrioritizeBlog(checked as boolean)}
                                        />
                                        <Label htmlFor="blog" className="font-normal cursor-pointer">
                                            Prioritize blog posts (for content keywords)
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="services"
                                            checked={prioritizeServices}
                                            onCheckedChange={(checked) => setPrioritizeServices(checked as boolean)}
                                        />
                                        <Label htmlFor="services" className="font-normal cursor-pointer">
                                            Prioritize service pages (for commercial keywords)
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="location"
                                            checked={includeLocation}
                                            onCheckedChange={(checked) => setIncludeLocation(checked as boolean)}
                                        />
                                        <Label htmlFor="location" className="font-normal cursor-pointer">
                                            Include location pages (for local keywords)
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="products"
                                            checked={includeProducts}
                                            onCheckedChange={(checked) => setIncludeProducts(checked as boolean)}
                                        />
                                        <Label htmlFor="products" className="font-normal cursor-pointer">
                                            Include product pages (for transactional keywords)
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/marketing/keyword")}
                            disabled={isSubmitting}
                        >
                            View History
                        </Button>
                        <Button type="submit" disabled={isSubmitting} size="lg">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Researching Keywords...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Start Keyword Research
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </MarketingLayout>
    );
}
