"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Globe, MapPin, Target, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { AnalysisDepth, SpecificConcern } from "@/types/competitor-analysis";

export default function NewCompetitorAnalysisPage() {
    const router = useRouter();
    const { user } = useAuth();

    // Form state
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [location, setLocation] = useState("");
    const [competitorCount, setCompetitorCount] = useState([5]);
    const [analysisDepth, setAnalysisDepth] = useState<AnalysisDepth>("standard");
    const [keyProducts, setKeyProducts] = useState("");
    const [specificConcerns, setSpecificConcerns] = useState<SpecificConcern[]>([]);
    const [knownCompetitors, setKnownCompetitors] = useState("");
    const [excludeCompetitors, setExcludeCompetitors] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConcernToggle = (concern: SpecificConcern) => {
        setSpecificConcerns(prev =>
            prev.includes(concern)
                ? prev.filter(c => c !== concern)
                : [...prev, concern]
        );
    };

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
            console.log("🚀 Starting analysis workflow...");
            console.log("📋 Request Details:", {
                websiteUrl,
                location,
                userId: user.uid,
                competitorCount: competitorCount[0],
                analysisDepth
            });

            // Step 1: Analyze user's business
            toast.loading("Analyzing your business...", { id: "analysis" });
            console.log("➡️ Step 1/2: Analyzing user business website...");

            const analyzeRes = await fetch("/api/marketing/analyze-user-business", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    websiteUrl,
                    location,
                    userId: user.uid,
                    workspaceId: "demo", // TODO: Get from context
                }),
            });

            console.log(`⬅️ Business Analysis Status: ${analyzeRes.status}`);

            if (!analyzeRes.ok) {
                const error = await analyzeRes.json();
                console.error("❌ Business Analysis Failed:", error);
                throw new Error(error.error || "Failed to analyze business");
            }

            const { businessProfile, analysisId } = await analyzeRes.json();
            console.log("✅ Business Analysis Complete", { analysisId, businessProfile });

            // Step 2: Discover competitors
            toast.loading("Discovering competitors...", { id: "analysis" });
            console.log("➡️ Step 2/2: Discovering competitors...");

            const discoverPayload = {
                analysisId,
                businessProfile,
                location,
                preferences: {
                    analysisDepth,
                    keyProducts: keyProducts ? keyProducts.split(",").map(p => p.trim()) : undefined,
                    specificConcerns: specificConcerns.length > 0 ? specificConcerns : undefined,
                    knownCompetitors: knownCompetitors ? knownCompetitors.split(",").map(c => c.trim()) : undefined,
                    excludeCompetitors: excludeCompetitors ? excludeCompetitors.split(",").map(c => c.trim()) : undefined,
                },
            };

            console.log("📋 Discovery Payload:", discoverPayload);

            const discoverRes = await fetch("/api/marketing/discover-competitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(discoverPayload),
            });

            console.log(`⬅️ Discovery Status: ${discoverRes.status}`);

            if (!discoverRes.ok) {
                const error = await discoverRes.json();
                console.error("❌ Competitor Discovery Failed:", error);
                throw new Error(error.error || "Failed to discover competitors");
            }

            const discoverData = await discoverRes.json();
            console.log("✅ Competitors Discovered", { count: discoverData.competitors?.length });

            toast.success("Competitors discovered!", { id: "analysis" });

            // Navigate to confirmation page
            router.push(`/marketing/competitors/${analysisId}/confirm`);

        } catch (error) {
            console.error("❌ Error starting analysis:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to start analysis",
                { id: "analysis" }
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MarketingLayout
            title="New Competitor Analysis"
            description="Discover and analyze your competitors with AI-powered insights"
        >
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
                {/* Required Inputs */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>
                            Tell us about your business to find the right competitors
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="websiteUrl">
                                Your Website URL <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="websiteUrl"
                                    type="url"
                                    placeholder="https://yourbusiness.com"
                                    className="pl-9"
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                We'll analyze your website to understand your business
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">
                                Business Location <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="location"
                                    placeholder="Brisbane, Australia"
                                    className="pl-9"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                City and country for local competitor discovery
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="competitorCount">
                                Number of Competitors: {competitorCount[0]}
                            </Label>
                            <Slider
                                id="competitorCount"
                                min={1}
                                max={20}
                                step={1}
                                value={competitorCount}
                                onValueChange={setCompetitorCount}
                                className="py-4"
                            />
                            <p className="text-xs text-muted-foreground">
                                More competitors = deeper insights (but higher cost)
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Analysis Depth */}
                <Card>
                    <CardHeader>
                        <CardTitle>Analysis Depth</CardTitle>
                        <CardDescription>
                            Choose how comprehensive you want the analysis to be
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup value={analysisDepth} onValueChange={(v) => setAnalysisDepth(v as AnalysisDepth)}>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                                <RadioGroupItem value="quick" id="quick" />
                                <Label htmlFor="quick" className="flex-1 cursor-pointer">
                                    <div className="font-semibold">Quick Scan</div>
                                    <div className="text-sm text-muted-foreground">
                                        3 competitors, basic analysis (~$1)
                                    </div>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                                <RadioGroupItem value="standard" id="standard" />
                                <Label htmlFor="standard" className="flex-1 cursor-pointer">
                                    <div className="font-semibold">Standard Analysis</div>
                                    <div className="text-sm text-muted-foreground">
                                        5 competitors, detailed insights (~$2)
                                    </div>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                                <RadioGroupItem value="deep" id="deep" />
                                <Label htmlFor="deep" className="flex-1 cursor-pointer">
                                    <div className="font-semibold">Deep Dive</div>
                                    <div className="text-sm text-muted-foreground">
                                        10 competitors, comprehensive analysis (~$4)
                                    </div>
                                </Label>
                            </div>
                        </RadioGroup>
                    </CardContent>
                </Card>

                {/* Optional Enhancements */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Optional Enhancements
                        </CardTitle>
                        <CardDescription>
                            Customize your analysis with additional focus areas
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="keyProducts">Key Products/Services to Focus On</Label>
                            <div className="relative">
                                <Target className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="keyProducts"
                                    placeholder="SEO, Content Marketing, PPC (comma-separated)"
                                    className="pl-9"
                                    value={keyProducts}
                                    onChange={(e) => setKeyProducts(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Specific Concerns</Label>
                            <div className="space-y-2">
                                {[
                                    { value: "pricing" as const, label: "Pricing Strategy" },
                                    { value: "content" as const, label: "Content Strategy" },
                                    { value: "seo" as const, label: "SEO Performance" },
                                    { value: "social" as const, label: "Social Media Presence" },
                                ].map((concern) => (
                                    <div key={concern.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={concern.value}
                                            checked={specificConcerns.includes(concern.value)}
                                            onCheckedChange={() => handleConcernToggle(concern.value)}
                                        />
                                        <Label htmlFor={concern.value} className="cursor-pointer">
                                            {concern.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="knownCompetitors">Known Competitors to Include</Label>
                            <Textarea
                                id="knownCompetitors"
                                placeholder="https://competitor1.com, https://competitor2.com"
                                rows={2}
                                value={knownCompetitors}
                                onChange={(e) => setKnownCompetitors(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Comma-separated URLs of competitors you want to include
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="excludeCompetitors">Competitors to Exclude</Label>
                            <Textarea
                                id="excludeCompetitors"
                                placeholder="https://notacompetitor.com"
                                rows={2}
                                value={excludeCompetitors}
                                onChange={(e) => setExcludeCompetitors(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Comma-separated URLs to exclude from analysis
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex items-center justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            "Find Competitors"
                        )}
                    </Button>
                </div>
            </form>
        </MarketingLayout>
    );
}
