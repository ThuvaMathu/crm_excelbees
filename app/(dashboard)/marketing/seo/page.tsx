"use client";

import { useState } from "react";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MarketingSEOAudit } from "@/types/marketing";

export default function SEOAnalyzerPage() {
    const { user } = useAuth();
    const [url, setUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [report, setReport] = useState<MarketingSEOAudit | null>(null);

    const handleAnalyze = async () => {
        if (!url) return toast.error("Please enter a URL");

        setIsAnalyzing(true);
        setReport(null);

        try {
            const res = await fetch("/api/marketing/seo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "analyze_page",
                    prompt: `Analyze the SEO for this URL: ${url}`, // Prompt for AI context
                    context: { url },
                    userId: user?.uid,
                    workspaceId: user?.uid || "default"
                })
            });

            if (!res.ok) throw new Error("Analysis failed");

            const data = await res.json();
            // Assuming API returns specific shape. For now, we mock/adapt
            const result = data.content ? JSON.parse(data.content) : data; // Adapt based on generic API return
            setReport(result);
            toast.success("SEO Audit Complete");
        } catch (error) {
            console.error(error);
            toast.error("Failed to analyze page. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <MarketingLayout
            title="SEO Analyzer & Optimizer"
            description="AI-powered technical and on-page SEO audits to boost your rankings."
        >
            <div className="grid gap-6">
                {/* Analysis Input */}
                <Card>
                    <CardHeader>
                        <CardTitle>Run New Audit</CardTitle>
                        <CardDescription>Enter a URL to generate a comprehensive SEO report.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="https://example.com"
                                    className="pl-9"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    "Analyze Page"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                {report && (
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Score Card */}
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle>SEO Health Score</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-6">
                                <div className="relative flex items-center justify-center">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle
                                            className="text-muted/20"
                                            strokeWidth="10"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="56"
                                            cx="64"
                                            cy="64"
                                        />
                                        <circle
                                            className={`${report.score >= 80 ? "text-green-500" :
                                                    report.score >= 50 ? "text-yellow-500" : "text-red-500"
                                                }`}
                                            strokeWidth="10"
                                            strokeDasharray={351.86} // 2 * pi * 56
                                            strokeDashoffset={351.86 - (351.86 * report.score) / 100}
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="56"
                                            cx="64"
                                            cy="64"
                                        />
                                    </svg>
                                    <span className="absolute text-3xl font-bold">{report.score}</span>
                                </div>
                                <p className="mt-4 text-sm text-muted-foreground text-center">
                                    {report.score >= 80 ? "Great job! Minor tweaks needed." : "Needs attention. See recommendations."}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Issues Breakdown */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Audit Findings</CardTitle>
                                <CardDescription>Prioritized list of issues and opportunities.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="all" className="w-full">
                                    <TabsList >
                                        <TabsTrigger value="all">All Issues</TabsTrigger>
                                        <TabsTrigger value="technical">Technical</TabsTrigger>
                                        <TabsTrigger value="content">Content</TabsTrigger>
                                        <TabsTrigger value="ux">UX</TabsTrigger>
                                    </TabsList>

                                    <div className="mt-4 max-h-[300px] overflow-y-auto space-y-3">
                                        {report.issues.map((issue, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                                                {issue.impact === "high" && <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
                                                {issue.impact === "medium" && <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                                                {issue.impact === "low" && <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />}

                                                <div>
                                                    <h4 className="font-medium text-sm">{issue.issue}</h4>
                                                    <p className="text-xs text-muted-foreground capitalize">{issue.category} • {issue.impact} Impact</p>
                                                </div>
                                            </div>
                                        ))}
                                        {report.issues.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                                <p>No issues found!</p>
                                            </div>
                                        )}
                                    </div>
                                </Tabs>
                            </CardContent>
                        </Card>

                        {/* AI Recommendations */}
                        <Card className="md:col-span-3">
                            <CardHeader>
                                <CardTitle>AI Optimization Plan</CardTitle>
                                <CardDescription>Step-by-step guide to improve this page.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {report.recommendations.map((rec, idx) => (
                                        <div key={idx} className="flex gap-4">
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                {idx + 1}
                                            </div>
                                            <p className="text-sm">{rec}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </MarketingLayout>
    );
}
