"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2,
    Download,
    Share2,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Lightbulb,
    Target,
    Eye
} from "lucide-react";
import { toast } from "sonner";
import type { GetReportResponse } from "@/types/competitor-analysis";
import { generateCompetitorReportPDF } from "@/lib/competitor-analysis/pdf-generator";

export default function ReportPage() {
    const router = useRouter();
    const params = useParams();
    const analysisId = params.analysisId as string;

    const [reportData, setReportData] = useState<GetReportResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("summary");

    useEffect(() => {
        if (analysisId) {
            loadReport();
        }
    }, [analysisId]);

    const loadReport = async () => {
        try {
            setIsLoading(true);

            // First, get the report ID from the analysis
            const analysisRes = await fetch(`/api/marketing/reports/${analysisId}`);

            if (!analysisRes.ok) {
                throw new Error("Failed to load report");
            }

            const data: GetReportResponse = await analysisRes.json();
            setReportData(data);
        } catch (error) {
            console.error("Failed to load report:", error);
            toast.error("Failed to load report");
            router.push("/marketing/competitors");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!reportData) return;
        try {
            toast.loading("Generating PDF...", { id: "pdf" });
            generateCompetitorReportPDF(reportData);
            toast.success("PDF Downloaded!", { id: "pdf" });
        } catch (error) {
            console.error("PDF Generation failed:", error);
            toast.error("Failed to generate PDF", { id: "pdf" });
        }
    };

    const getThreatColor = (level: string) => {
        switch (level) {
            case "high":
                return "bg-red-500/10 text-red-600 border-red-500/20";
            case "medium":
                return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
            case "low":
                return "bg-green-500/10 text-green-600 border-green-500/20";
            default:
                return "bg-gray-500/10 text-gray-600 border-gray-500/20";
        }
    };

    const getEffortColor = (effort: string) => {
        switch (effort) {
            case "low":
                return "bg-green-500/10 text-green-600";
            case "medium":
                return "bg-yellow-500/10 text-yellow-600";
            case "high":
                return "bg-red-500/10 text-red-600";
            default:
                return "bg-gray-500/10 text-gray-600";
        }
    };

    if (isLoading) {
        return (
            <MarketingLayout
                title="Competitive Intelligence Report"
                description="Comprehensive analysis of your competitive landscape"
            >
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </MarketingLayout>
        );
    }

    if (!reportData) {
        return null;
    }

    const { report, analysis, competitors } = reportData;
    const sections = report.sections;

    return (
        <MarketingLayout
            title="Competitive Intelligence Report"
            description={`Analysis for ${analysis.userBusinessProfile?.industry} in ${analysis.location}`}
        >
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Generated on {new Date(report.generatedAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* 
                        <Button variant="outline" size="sm" className="gap-2">
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                        */}
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPDF}>
                            <Download className="h-4 w-4" />
                            Download PDF
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Re-run Analysis
                        </Button>
                    </div>
                </div>

                {/* Executive Summary */}
                <Card className="border-l-4 border-l-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Executive Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                            {sections.executiveSummary}
                        </p>
                    </CardContent>
                </Card>

                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="summary">Overview</TabsTrigger>
                        <TabsTrigger value="competitors">Competitors</TabsTrigger>
                        <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                        <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="summary" className="space-y-6">
                        {/* Market Positioning */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Market Positioning</CardTitle>
                                <CardDescription>
                                    Where you and your competitors sit in the market
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                    {sections.marketPositioning}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Key Takeaways */}
                        <Card className="bg-accent/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                                    Key Takeaways
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {sections.keyTakeaways.map((takeaway, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-primary font-bold mt-0.5">•</span>
                                            <span className="text-sm">{takeaway}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Threats */}
                        <Card className="border-orange-500/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    Threats to Watch
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {sections.threats.map((threat, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-orange-500 font-bold mt-0.5">!</span>
                                            <span className="text-sm">{threat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Competitors Tab */}
                    <TabsContent value="competitors" className="space-y-4">
                        {sections.competitorProfiles.map((competitor, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle>{competitor.name}</CardTitle>
                                            <CardDescription className="mt-1">
                                                {competitor.summary}
                                            </CardDescription>
                                        </div>
                                        <Badge className={getThreatColor(competitor.threatLevel)}>
                                            {competitor.threatLevel.toUpperCase()} THREAT
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Threat Explanation */}
                                    <div className="p-3 bg-accent/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">
                                            {competitor.threatExplanation}
                                        </p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {/* Strengths */}
                                        <div>
                                            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-green-600">
                                                <TrendingUp className="h-4 w-4" />
                                                Strengths
                                            </h4>
                                            <ul className="space-y-1">
                                                {competitor.strengths.map((strength, i) => (
                                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                        <span className="text-green-500 mt-0.5">+</span>
                                                        {strength}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Weaknesses */}
                                        <div>
                                            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-red-600">
                                                <TrendingDown className="h-4 w-4" />
                                                Weaknesses
                                            </h4>
                                            <ul className="space-y-1">
                                                {competitor.weaknesses.map((weakness, i) => (
                                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                        <span className="text-red-500 mt-0.5">-</span>
                                                        {weakness}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Pricing & Differentiation */}
                                    <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
                                        <div>
                                            <h4 className="font-semibold text-sm mb-1">Pricing Strategy</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {competitor.pricingStrategy}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm mb-1">Differentiation</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {competitor.differentiation}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* Opportunities Tab */}
                    <TabsContent value="opportunities" className="space-y-4">
                        {sections.opportunities.map((opportunity, index) => (
                            <Card key={index} className="border-l-4 border-l-green-500">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                                            <Badge variant="outline" className="mt-2">
                                                {opportunity.type.replace("_", " ").toUpperCase()}
                                            </Badge>
                                        </div>
                                        <Badge className={getEffortColor(opportunity.effort)}>
                                            {opportunity.effort.toUpperCase()} EFFORT
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">What is it?</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {opportunity.description}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">How to exploit it</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {opportunity.howToExploit}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* Recommendations Tab */}
                    <TabsContent value="recommendations" className="space-y-6">
                        {["quick_win", "medium_term", "long_term"].map((category) => {
                            const recs = sections.recommendations.filter(r => r.category === category);
                            if (recs.length === 0) return null;

                            const categoryLabels = {
                                quick_win: { label: "Quick Wins", subtitle: "1-4 weeks", color: "text-green-600" },
                                medium_term: { label: "Medium-term", subtitle: "1-3 months", color: "text-blue-600" },
                                long_term: { label: "Long-term", subtitle: "3-6 months", color: "text-purple-600" },
                            };

                            const config = categoryLabels[category as keyof typeof categoryLabels];

                            return (
                                <div key={category}>
                                    <h3 className={`text-xl font-bold mb-4 ${config.color}`}>
                                        {config.label}
                                        <span className="text-sm font-normal text-muted-foreground ml-2">
                                            ({config.subtitle})
                                        </span>
                                    </h3>
                                    <div className="space-y-4">
                                        {recs.map((rec, index) => (
                                            <Card key={index}>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Target className="h-5 w-5" />
                                                        {rec.title}
                                                    </CardTitle>
                                                    <CardDescription>{rec.description}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <div>
                                                        <h4 className="font-semibold text-sm mb-2">How to execute:</h4>
                                                        <ol className="space-y-1">
                                                            {rec.howToExecute.map((step, i) => (
                                                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                                    <span className="font-semibold text-primary">{i + 1}.</span>
                                                                    {step}
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                    <div className="p-3 bg-accent/50 rounded-lg">
                                                        <h4 className="font-semibold text-sm mb-1">Expected Impact:</h4>
                                                        <p className="text-sm text-muted-foreground">{rec.expectedImpact}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Monitoring Plan */}
                        <Card className="border-dashed">
                            <CardHeader>
                                <CardTitle>Competitive Monitoring Plan</CardTitle>
                                <CardDescription>
                                    Stay ahead by tracking these metrics regularly
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Tracking Frequency</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {sections.monitoringPlan.trackingFrequency}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Competitors to Watch</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {sections.monitoringPlan.competitorsToWatch.map((comp, i) => (
                                            <Badge key={i} variant="secondary">{comp}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Key Metrics</h4>
                                    <ul className="space-y-1">
                                        {sections.monitoringPlan.keyMetrics.map((metric, i) => (
                                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                <span className="text-primary mt-0.5">•</span>
                                                {metric}
                                            </li>
                                        ))}
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
