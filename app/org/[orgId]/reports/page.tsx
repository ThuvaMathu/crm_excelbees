"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AIExecutiveSummary } from "@/components/reports/AIExecutiveSummary";
import { ReportQueryInput } from "@/components/reports/ReportQueryInput";
import { RevenueForecastChart } from "@/components/reports/RevenueForecastChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Calendar, ArrowUpRight, ArrowDownRight, Users, DollarSign, Activity, Shield, Lock } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { toJsDate } from "@/lib/utils";
import { useOrgStore } from "@/store/org";
import { usePermission } from "@/hooks/usePermission";
import { generateReportInsight } from "@/app/actions/ai/report-insights";
import type { ReportInsight as AIReportInsight } from "@/types/gemini";
import { getDeals } from "@/lib/firestore/deals";
import { getLeads } from "@/lib/firestore/leads";
import { getInvoices } from "@/lib/firestore/invoices";
import type { Deal, Lead } from "@/types/crm";
import { RBACGuard } from "@/components/auth/RBACGuard";

export default function ReportsPage() {
    return (
        <RBACGuard requirePermission={{ module: "reports", action: "read" }}>
            <ReportsPageContent />
        </RBACGuard>
    );
}

function ReportsPageContent() {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const { currentMember } = useOrgStore();
    const { isManager } = usePermission();
    const base = `/org/${orgId}`;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [monthlyMetrics, setMonthlyMetrics] = useState<any[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [activeDealsValue, setActiveDealsValue] = useState(0);
    const [totalLeads, setTotalLeads] = useState(0);
    const [churnRiskCount, setChurnRiskCount] = useState(0);
    const [activeTab, setActiveTab] = useState("overview");

    const canViewFinancialData = isManager();

    const [summary, setSummary] = useState("");
    const [insights, setInsights] = useState<{ type: "positive" | "negative" | "warning", text: string }[]>([]);
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const [dealsRes, leadsRes, invoicesRes] = await Promise.all([
                    getDeals(orgId),
                    getLeads(orgId),
                    getInvoices(orgId),
                ]);

                if (dealsRes.error) throw new Error(dealsRes.error);
                if (leadsRes.error) throw new Error(leadsRes.error);
                if (invoicesRes.error) throw new Error(invoicesRes.error);

                const deals = dealsRes.deals || [];
                const leads = leadsRes.leads || [];
                const invoices = invoicesRes.invoices || [];

                const metricsMap = new Map<string, any>();
                for (let i = 5; i >= 0; i--) {
                    const date = subMonths(new Date(), i);
                    const key = format(date, "MMM yyyy");
                    metricsMap.set(key, { name: key, revenue: 0, pipeline: 0, leads: 0 });
                }

                let totalRev = 0;
                let activeVal = 0;

                deals.forEach(deal => {
                    const dealDate = toJsDate(deal.createdAt);
                    if (!dealDate) return;
                    const monthKey = format(dealDate, "MMM yyyy");

                    if (metricsMap.has(monthKey)) {
                        const metric = metricsMap.get(monthKey)!;
                        if (deal.stage === "Won") {
                            metric.revenue += deal.value;
                            totalRev += deal.value;
                        }
                        if (deal.stage !== "Won" && deal.stage !== "Lost") {
                            metric.pipeline += deal.value;
                            activeVal += deal.value;
                        }
                    }
                });

                leads.forEach(lead => {
                    const leadDate = toJsDate(lead.createdAt);
                    if (!leadDate) return;
                    const monthKey = format(leadDate, "MMM yyyy");
                    if (metricsMap.has(monthKey)) {
                        metricsMap.get(monthKey)!.leads += 1;
                    }
                });

                const churnCount = leads.filter(l => {
                    if (l.status === "Lost") return true;
                    if (!l.lastContactedAt) {
                        const created = toJsDate(l.createdAt);
                        if (created) {
                            const daysSince = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
                            return daysSince > 30;
                        }
                    }
                    return false;
                }).length;

                setMonthlyMetrics(Array.from(metricsMap.values()));
                setTotalRevenue(totalRev);
                setActiveDealsValue(activeVal);
                setTotalLeads(leads.length);
                setChurnRiskCount(churnCount);
            } catch (err: any) {
                setError(err.message);
            }
            setIsLoading(false);
        }

        fetchData();
    }, [orgId]);

    const runAIAnalysis = async (query: string = "Provide a comprehensive business overview") => {
        setAiLoading(true);
        try {
            const context = {
                totalRevenue,
                activePipeline: activeDealsValue,
                totalLeads,
                churnRiskCount,
                monthlyBreakdown: monthlyMetrics,
                recentTrend: monthlyMetrics.slice(-3),
            };

            const result = await generateReportInsight(query, context);

            if (result.success && result.data) {
                setSummary(result.data.summary);
                setInsights(result.data.insights);
                setRecommendations(result.data.recommendations);
            } else {
                setSummary(result.error || "AI analysis unavailable. Ensure GEMINI_API_KEY is configured.");
                setInsights([]);
                setRecommendations([]);
            }
        } catch {
            setSummary("Failed to generate AI insight.");
            setInsights([{ type: "negative", text: "Connection error" }]);
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoading && canViewFinancialData) {
            runAIAnalysis();
        }
    }, [isLoading]);

    const handleQuery = async (query: string) => {
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes("lead") || lowerQuery.includes("churn")) {
            setActiveTab("leads");
        } else if (lowerQuery.includes("sales") || lowerQuery.includes("revenue") || lowerQuery.includes("forecast")) {
            setActiveTab("sales");
        }

        await runAIAnalysis(query);
    };

    if (error) {
        return <div className="p-8 text-red-500">Error loading data: {error}</div>;
    }

    const handleExport = () => {
        const headers = ["Month", "Revenue ($)", "Deals", "Leads"];
        const rows = monthlyMetrics.map((m: any) => [
            m.name || "",
            canViewFinancialData ? (m.revenue ?? 0) : "Restricted",
            canViewFinancialData ? (m.pipeline ?? 0) : "Restricted",
            m.leads ?? 0,
        ]);

        rows.push([]);
        rows.push(["Summary"]);
        rows.push(["Total Revenue", canViewFinancialData ? totalRevenue : "Restricted"]);
        rows.push(["Active Pipeline", canViewFinancialData ? activeDealsValue : "Restricted"]);
        rows.push(["Total Leads", totalLeads]);
        rows.push(["Churn Risk Count", churnRiskCount]);

        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `crm-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

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
                    {canViewFinancialData && (
                        <Button onClick={handleExport} disabled={isLoading}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    )}
                </div>
            </div>

            {canViewFinancialData ? (
                <div className="space-y-6">
                    <ReportQueryInput onQuery={handleQuery} isLoading={aiLoading} />
                    <AIExecutiveSummary summary={summary} insights={insights} recommendations={recommendations} isLoading={aiLoading} />
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Lock className="h-10 w-10 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-semibold mb-1">AI Insights Restricted</h3>
                        <p className="text-sm text-muted-foreground text-center">
                            AI-powered summaries and financial insights are only available to administrators and managers.
                        </p>
                    </CardContent>
                </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="sales" disabled={!canViewFinancialData}>
                        {canViewFinancialData ? "Sales & Forecast" : <><Lock className="h-3 w-3 mr-1" />Sales (Restricted)</>}
                    </TabsTrigger>
                    <TabsTrigger value="leads">Leads Intelligence</TabsTrigger>
                </TabsList>

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
                                    Your role: <span className="font-medium">{currentMember?.role || "team"}</span>
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

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
