"use client";

import { useState, useEffect } from "react";
import { AIExecutiveSummary } from "@/components/reports/AIExecutiveSummary";
import { ReportQueryInput } from "@/components/reports/ReportQueryInput";
import { RevenueForecastChart } from "@/components/reports/RevenueForecastChart";
import { useReportsData } from "@/components/reports/ReportsDataManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Calendar, ArrowUpRight, ArrowDownRight, Users, DollarSign, Activity, Shield, Lock } from "lucide-react";
import { format } from "date-fns";
import { generateReportInsight } from "@/actions/generate-report";
import { useAuth } from "@/hooks/useAuth";

export default function ReportsPage() {
    const { user } = useAuth();
    const { monthlyMetrics, totalRevenue, activeDealsValue, totalLeads, churnRiskCount, isLoading, error } = useReportsData();
    const [activeTab, setActiveTab] = useState("overview");

    // Role-based access control - only admins and managers can view financial data
    const canViewFinancialData = user?.role === "admin" || user?.role === "manager";

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
                    <TabsTrigger value="sales" disabled={!canViewFinancialData}>
                        {canViewFinancialData ? "Sales & Forecast" : <><Lock className="h-3 w-3 mr-1" />Sales (Restricted)</>}
                    </TabsTrigger>
                    <TabsTrigger value="leads">Leads Intelligence</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {canViewFinancialData ? (
                            <>
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
                            </>
                        ) : (
                            <>
                                <Card className="col-span-2 lg:col-span-2">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-muted-foreground">$•••</div>
                                        <p className="text-xs text-muted-foreground">Contact admin for access</p>
                                    </CardContent>
                                </Card>
                                <Card className="col-span-2 lg:col-span-2">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Active Pipeline</CardTitle>
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-muted-foreground">$•••</div>
                                        <p className="text-xs text-muted-foreground">Contact admin for access</p>
                                    </CardContent>
                                </Card>
                            </>
                        )}
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
                            {canViewFinancialData ? (
                                <RevenueForecastChart data={monthlyMetrics} />
                            ) : (
                                <Card className="h-full">
                                    <CardContent className="flex flex-col items-center justify-center h-64">
                                        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">Financial Data Restricted</h3>
                                        <p className="text-sm text-muted-foreground text-center">
                                            You don't have permission to view revenue forecasts.<br />
                                            Please contact an admin or manager for access.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Recent Insights</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {insights.length > 0 ? insights.map((insight, idx) => (
                                        <div key={idx} className="flex items-start">
                                            <div className={`w-2 h-2 rounded-full mt-1.5 mr-3 ${insight.type === "positive" ? "bg-green-500" :
                                                    insight.type === "negative" ? "bg-red-500" :
                                                        "bg-amber-500"
                                                }`} />
                                            <div className="flex-1">
                                                <p className="text-sm">{insight.text}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-4 text-sm text-muted-foreground">
                                            <p>Analyzing data to generate insights...</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* SALES TAB */}
                <TabsContent value="sales" className="space-y-4">
                    {canViewFinancialData ? (
                        <RevenueForecastChart data={monthlyMetrics} />
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-24">
                                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Access Restricted</h3>
                                <p className="text-muted-foreground text-center max-w-md">
                                    Financial data including revenue, forecasts, and sales analytics are only visible to administrators and managers.
                                </p>
                                <p className="text-sm text-muted-foreground mt-4">
                                    Your role: <span className="font-medium">{user?.role || "team"}</span>
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* LEADS TAB */}
                <TabsContent value="leads" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lead Intelligence</CardTitle>
                            <CardDescription>
                                AI-powered lead scoring and risk analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Summary Metrics */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <p className="text-2xl font-bold text-blue-600">{totalLeads}</p>
                                        <p className="text-xs text-muted-foreground">Total Leads</p>
                                    </div>
                                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                                        <p className="text-2xl font-bold text-amber-600">{churnRiskCount}</p>
                                        <p className="text-xs text-muted-foreground">At Risk</p>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <p className="text-2xl font-bold text-green-600">
                                            {totalLeads > 0 ? Math.round((totalLeads - churnRiskCount) / totalLeads * 100) : 0}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">Healthy Rate</p>
                                    </div>
                                </div>

                                {/* Lead Scoring Matrix */}
                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium mb-4">Lead Scoring Matrix</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                                <span className="text-sm font-medium">High Score (80-100)</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Ready for conversion • High probability
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                                <span className="text-sm font-medium">Medium Score (50-79)</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Needs nurturing • Follow up required
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                                <span className="text-sm font-medium">Low Score (0-49)</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {churnRiskCount} leads at risk • Action needed
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Recommendations */}
                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium mb-2">AI Recommendations</h4>
                                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                                        <p className="font-medium mb-1">Priority Actions:</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            {churnRiskCount > 0 && (
                                                <li>Re-engage {churnRiskCount} stagnant leads with personalized email campaigns</li>
                                            )}
                                            {totalLeads > 0 && (
                                                <li>Focus follow-up efforts on {Math.round(totalLeads * 0.3)} top-scoring leads</li>
                                            )}
                                            <li>Review and update lead source attribution for better ROI tracking</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
