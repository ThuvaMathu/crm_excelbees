"use client";

import { useState, useEffect } from "react";
import { AIExecutiveSummary } from "@/components/reports/AIExecutiveSummary";
import { ReportQueryInput } from "@/components/reports/ReportQueryInput";
import { RevenueForecastChart } from "@/components/reports/RevenueForecastChart";
import { useReportsData } from "@/components/reports/ReportsDataManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Calendar, ArrowUpRight, ArrowDownRight, Users, DollarSign, Activity } from "lucide-react";
import { format } from "date-fns";
import { generateReportInsight } from "@/actions/generate-report";

export default function ReportsPage() {
    const { monthlyMetrics, totalRevenue, activeDealsValue, totalLeads, churnRiskCount, isLoading, error } = useReportsData();
    const [activeTab, setActiveTab] = useState("overview");

    // AI State
    const [summary, setSummary] = useState("Analyzing your latest business data...");
    const [insights, setInsights] = useState<{ type: "positive" | "negative" | "warning", text: string }[]>([]);
    const [aiLoading, setAiLoading] = useState(true);

    // Initial AI Analysis (Simulated based on real data)
    useEffect(() => {
        if (!isLoading) {
            setAiLoading(true);
            setTimeout(() => {
                // Generate dynamic summary based on real stats
                const revenueTrend = monthlyMetrics.length >= 2
                    ? monthlyMetrics[monthlyMetrics.length - 1].revenue > monthlyMetrics[monthlyMetrics.length - 2].revenue
                    : true;

                setSummary(`Overall performance is ${revenueTrend ? "trending upward" : "stabilizing"}. You have generated $${totalRevenue.toLocaleString()} in total revenue with a healthy pipeline of $${activeDealsValue.toLocaleString()}.`);

                const newInsights: { type: "positive" | "negative" | "warning", text: string }[] = [];

                if (activeDealsValue > totalRevenue * 0.5) newInsights.push({ type: "positive", text: "Strong pipeline coverage (50%+ of revenue)." });
                if (churnRiskCount > 0) newInsights.push({ type: "warning", text: `${churnRiskCount} leads detected with high churn risk.` });
                if (revenueTrend) newInsights.push({ type: "positive", text: "Revenue growth month-over-month." });

                setInsights(newInsights);
                setAiLoading(false);
            }, 1000);
        }
    }, [isLoading, monthlyMetrics, totalRevenue, activeDealsValue, churnRiskCount]);


    const handleQuery = async (query: string) => {
        setAiLoading(true);
        const lowerQuery = query.toLowerCase();

        // 1. Client-Side Intent (UI Switching)
        if (lowerQuery.includes("lead") || lowerQuery.includes("churn")) {
            setActiveTab("leads");
        } else if (lowerQuery.includes("sales") || lowerQuery.includes("revenue") || lowerQuery.includes("forecast")) {
            setActiveTab("sales");
        }

        // 2. Real AI Analysis
        try {
            const context = {
                totalRevenue,
                activePipeline: activeDealsValue,
                totalLeads,
                churnRiskCount,
                recentTrend: monthlyMetrics.slice(-3) // Last 3 months
            };

            const response = await generateReportInsight(query, context);
            setSummary(response.summary);
            setInsights(response.insights);
        } catch (e) {
            console.error(e);
            setSummary("Failed to generate AI insight. Please try again.");
            setInsights([{ type: "negative", text: "Connection error" }]);
        } finally {
            setAiLoading(false);
        }
    };

    if (error) {
        return <div className="p-8 text-red-500">Error loading data: {error}</div>;
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reports & Intelligence</h2>
                    <p className="text-muted-foreground">
                        AI-powered real-time insights for your business.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="hidden md:flex">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(new Date(), "MMM yyyy")}
                    </Button>
                    <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* AI Section */}
            <div className="space-y-6">
                <ReportQueryInput onQuery={handleQuery} isLoading={aiLoading} />
                <AIExecutiveSummary summary={summary} insights={insights} isLoading={aiLoading} />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="sales">Sales & Forecast</TabsTrigger>
                    <TabsTrigger value="leads">Leads Intelligence</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{isLoading ? "..." : `$${totalRevenue.toLocaleString()}`}</div>
                                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Pipeline</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{isLoading ? "..." : `$${activeDealsValue.toLocaleString()}`}</div>
                                <p className="text-xs text-muted-foreground">Potential revenue</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{isLoading ? "..." : totalLeads}</div>
                                <p className="text-xs text-muted-foreground">All time</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-rose-500">Churn Risk</CardTitle>
                                <ArrowDownRight className="h-4 w-4 text-rose-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-rose-600">{isLoading ? "..." : churnRiskCount}</div>
                                <p className="text-xs text-muted-foreground">Leads needing attention</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                        {/* Use the new Forecast Chart here too for consistency */}
                        <div className="col-span-4">
                            <RevenueForecastChart data={monthlyMetrics} />
                        </div>

                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Recent Insights</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Pipeline velocity increased</p>
                                            <p className="text-xs text-muted-foreground">Deals moving 10% faster</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Tech Sector Growth</p>
                                            <p className="text-xs text-muted-foreground">Highest performing source</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{churnRiskCount} leads stagnant</p>
                                            <p className="text-xs text-muted-foreground">Recommendation: Email blast</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* SALES TAB */}
                <TabsContent value="sales" className="space-y-4">
                    <RevenueForecastChart data={monthlyMetrics} />
                </TabsContent>

                {/* LEADS TAB */}
                <TabsContent value="leads" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lead Intelligence</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-10 text-muted-foreground">
                                <p>Detailed lead scoring matrix would go here.</p>
                                <p>Currently tracking <strong>{churnRiskCount}</strong> at-risk leads.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
