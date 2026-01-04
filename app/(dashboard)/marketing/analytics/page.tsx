"use client";

import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Users, Eye, Target, MousePointer } from "lucide-react";

// Mock Data (To be replaced by real aggregated queries)
const ENGAGEMENT_DATA = [
    { name: 'Mon', views: 4000, clicks: 2400, amt: 2400 },
    { name: 'Tue', views: 3000, clicks: 1398, amt: 2210 },
    { name: 'Wed', views: 2000, clicks: 9800, amt: 2290 },
    { name: 'Thu', views: 2780, clicks: 3908, amt: 2000 },
    { name: 'Fri', views: 1890, clicks: 4800, amt: 2181 },
    { name: 'Sat', views: 2390, clicks: 3800, amt: 2500 },
    { name: 'Sun', views: 3490, clicks: 4300, amt: 2100 },
];

const SEO_TREND_DATA = [
    { day: '1', score: 65 },
    { day: '5', score: 68 },
    { day: '10', score: 72 },
    { day: '15', score: 71 },
    { day: '20', score: 75 },
    { day: '25', score: 82 },
    { day: '30', score: 85 },
];

export default function MarketingAnalyticsPage() {
    const { user } = useAuth();

    return (
        <MarketingLayout
            title="Marketing Analytics"
            description="Unified performance metrics across all your channels."
        >
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Traffic</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12,345</div>
                        <p className="text-xs text-muted-foreground flex items-center text-green-500">
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            +15% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. SEO Score</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">85</div>
                        <p className="text-xs text-muted-foreground flex items-center text-green-500">
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            +5% from last check
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45.2k</div>
                        <p className="text-xs text-muted-foreground flex items-center text-red-500">
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                            -3% from last week
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <MousePointer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3.2%</div>
                        <p className="text-xs text-muted-foreground flex items-center text-green-500">
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            +0.4% steady growth
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Traffic vs. Engagement</CardTitle>
                        <CardDescription>
                            Comparing page views and click-throughs over the last 7 days.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={ENGAGEMENT_DATA}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Page Views" />
                                <Bar dataKey="clicks" fill="#10b981" radius={[4, 4, 0, 0]} name="Clicks" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>SEO Performance Trend</CardTitle>
                        <CardDescription>
                            30-day site health score trajectory.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={SEO_TREND_DATA}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" hide />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#8b5cf6"
                                    fillOpacity={1}
                                    fill="url(#colorScore)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </MarketingLayout>
    );
}
