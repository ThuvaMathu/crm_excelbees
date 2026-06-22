"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, RefreshCw, ArrowRight, AlertCircle, Clock, TrendingUp } from "lucide-react";
import { getFollowUpSuggestions } from "@/app/actions/ai/follow-up";
import type { FollowUpSuggestion } from "@/types/gemini";
import Link from "next/link";
import { format, parseISO } from "date-fns";

interface SmartFollowUpsProps {
    userId: string;
}

const URGENCY_CONFIG = {
    high: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
    medium: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
    low: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: TrendingUp },
};

const TYPE_URLS: Record<string, string> = {
    lead: "/leads",
    deal: "/deals",
    contact: "/contacts",
};

export function SmartFollowUps({ userId }: SmartFollowUpsProps) {
    const [suggestions, setSuggestions] = useState<FollowUpSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadSuggestions = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const result = await getFollowUpSuggestions(userId);
            if (result.success && result.data) {
                setSuggestions(result.data);
            } else if (!result.success && result.error?.includes("not configured")) {
                setError(false);
                setSuggestions([]);
            } else {
                setError(true);
            }
        } catch {
            setError(true);
        }
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        loadSuggestions();
    }, [loadSuggestions]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Smart Follow-ups
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (suggestions.length === 0) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Smart Follow-ups
                        </CardTitle>
                        <CardDescription>AI-powered priority recommendations</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={loadSuggestions} className="h-8 w-8">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="text-center py-8 text-sm text-muted-foreground">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p>All caught up! No follow-ups needed right now.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Smart Follow-ups
                    </CardTitle>
                    <CardDescription>AI-ranked priorities for today</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={loadSuggestions} className="h-8 w-8">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-3">
                {suggestions.map((s, i) => {
                    const config = URGENCY_CONFIG[s.urgency] || URGENCY_CONFIG.medium;
                    const Icon = config.icon;
                    return (
                        <Link
                            key={`${s.entityType}-${s.entityId}-${i}`}
                            href={`${TYPE_URLS[s.entityType] || ""}/${s.entityId}`}
                        >
                            <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                                <div className={`p-1.5 rounded-full ${config.color}`}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm truncate">{s.entityName}</span>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                                            {s.entityType}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.reason}</p>
                                    <p className="text-xs font-medium text-primary mt-0.5">{s.suggestedAction}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                            </div>
                        </Link>
                    );
                })}
            </CardContent>
        </Card>
    );
}

function CheckCircle({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}
