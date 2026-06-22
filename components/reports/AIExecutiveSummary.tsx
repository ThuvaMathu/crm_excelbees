"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Insight {
    type: "positive" | "negative" | "warning";
    text: string;
}

interface AIExecutiveSummaryProps {
    summary: string;
    insights: Insight[];
    recommendations?: string[];
    isLoading?: boolean;
}

export function AIExecutiveSummary({ summary, insights, recommendations = [], isLoading = false }: AIExecutiveSummaryProps) {
    if (isLoading) {
        return (
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 border-indigo-100 dark:border-indigo-900">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 animate-pulse">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        <div className="h-4 bg-indigo-200 dark:bg-indigo-900 rounded w-1/3"></div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-slate-900/50 dark:to-slate-900/50 border-indigo-100 dark:border-indigo-900/50 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                        <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                        AI Executive Summary
                    </CardTitle>
                    <Badge variant="outline" className="ml-auto text-xs bg-white dark:bg-slate-900 text-indigo-600 border-indigo-200">
                        Beta
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {summary}
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {insights.map((insight, idx) => (
                        <div
                            key={idx}
                            className="flex items-start gap-2 p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                        >
                            {insight.type === "positive" && <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />}
                            {insight.type === "negative" && <TrendingDown className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />}
                            {insight.type === "warning" && <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
                            <span className="text-xs text-slate-600 dark:text-slate-400">{insight.text}</span>
                        </div>
                    ))}
                </div>

                {recommendations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Recommendations
                        </h4>
                        <ul className="space-y-1.5">
                            {recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                    <span className="text-indigo-500 font-medium shrink-0">{idx + 1}.</span>
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
