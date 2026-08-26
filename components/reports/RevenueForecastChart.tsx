"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyMetric } from './ReportsDataManager';

interface RevenueForecastChartProps {
    data: MonthlyMetric[];
}

export function RevenueForecastChart({ data }: RevenueForecastChartProps) {
    // 1. Calculate simple linear regression for forecast
    // y = mx + b
    // x = index (0, 1, 2...), y = revenue

    // Safety check
    if (!data || data.length === 0) {
        return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available for forecast</div>;
    }

    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    data.forEach((point, i) => {
        sumX += i;
        sumY += point.revenue;
        sumXY += i * point.revenue;
        sumXX += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 2. Generate Forecast Points for next 3 months
    const lastMonthIndex = n - 1;
    const forecastData = [
        ...data.map((d, i) => ({
            ...d,
            forecast: null, // Don't show line for existing history, or show trend? Let's show trend line on history + future
            trend: slope * i + intercept
        })),
        { name: "Next Month", revenue: null, pipeline: 0, leads: 0, forecast: slope * (lastMonthIndex + 1) + intercept, trend: slope * (lastMonthIndex + 1) + intercept },
        { name: "+2 Months", revenue: null, pipeline: 0, leads: 0, forecast: slope * (lastMonthIndex + 2) + intercept, trend: slope * (lastMonthIndex + 2) + intercept },
        { name: "+3 Months", revenue: null, pipeline: 0, leads: 0, forecast: slope * (lastMonthIndex + 3) + intercept, trend: slope * (lastMonthIndex + 3) + intercept },
    ];

    // Format for display (remove messy decimals)
    const displayData = forecastData.map(d => ({
        ...d,
        forecast: d.forecast ? Math.round(d.forecast) : null,
        trend: Math.round(d.trend)
    }));

    // Connect the last actual point to the first forecast point visually
    // Recharts handles nulls by breaking the line, so we might need to "bridge" the gap or just accept the break.
    // A common trick is to repeat the last actual point as the start of the forecast line.
    if (displayData[n - 1]) {
        displayData[n - 1].forecast = displayData[n - 1].revenue; // Start forecast line from last actual
    }

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Revenue Forecast (AI Projection)</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={displayData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis tickFormatter={(value) => `$${value}`} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                formatter={(value: any) => [value ? `$${Number(value).toLocaleString()}` : "", ""]}
                                labelStyle={{ color: "black" }}
                                contentStyle={{ borderRadius: "8px" }}
                            />
                            <Legend />
                            <Bar dataKey="revenue" name="Actual Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                            {/* Trend Line (Historical Context) */}
                            {/* <Line type="monotone" dataKey="trend" stroke="#94a3b8" dot={false} strokeWidth={1} strokeDasharray="3 3" name="Trend" /> */}

                            {/* Forecast Line (Future) */}
                            <Line
                                type="monotone"
                                dataKey="forecast"
                                name="AI Forecast"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                strokeDasharray="5 5"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 rounded-md bg-emerald-50 dark:bg-emerald-900/20 p-3 border border-emerald-100 dark:border-emerald-900">
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                        <strong>AI Insight:</strong> Based on your trailing 6-month performance, revenue is projected to
                        {slope > 0 ? " grow " : " decline "} by roughly <strong>${Math.abs(Math.round(slope)).toLocaleString()}</strong> per month.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
