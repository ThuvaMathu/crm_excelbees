"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, HeartPulse, CheckCircle2, AlertTriangle } from "lucide-react";
import { analyzeCommunication } from "@/app/actions/ai/sentiment";
import type { SentimentAnalysis } from "@/types/gemini";
import { toast } from "sonner";

interface RelationshipHealthProps {
    entityType: "lead" | "contact" | "company";
    entityId: string;
}

const SENTIMENT_CONFIG = {
    positive: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Positive" },
    neutral: { color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", label: "Neutral" },
    negative: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Needs Attention" },
    mixed: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "Mixed" },
};

export function RelationshipHealth({ entityType, entityId }: RelationshipHealthProps) {
    const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const result = await analyzeCommunication(entityType, entityId);
            if (result.success && result.data) {
                setAnalysis(result.data);
            } else {
                toast.error(result.error || "Analysis failed");
            }
        } catch {
            toast.error("Something went wrong");
        }
        setLoading(false);
    };

    const config = analysis ? SENTIMENT_CONFIG[analysis.sentiment] : null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <HeartPulse className="h-5 w-5 text-primary" />
                            Relationship Health
                        </CardTitle>
                        <CardDescription>AI analysis of communication sentiment</CardDescription>
                    </div>
                    {analysis && !loading && (
                        <Button variant="outline" size="sm" onClick={handleAnalyze}>
                            Refresh
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {!analysis && !loading && (
                    <div className="text-center py-6">
                        <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground mb-3">
                            Analyze recent communications for sentiment and insights
                        </p>
                        <Button onClick={handleAnalyze} size="sm">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Analyze
                        </Button>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                )}

                {analysis && !loading && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Badge className={config?.color}>{config?.label}</Badge>
                            <span className="text-sm text-muted-foreground">
                                Score: {analysis.score > 0 ? "+" : ""}{analysis.score.toFixed(2)}
                            </span>
                        </div>

                        <p className="text-sm text-muted-foreground">{analysis.summary}</p>

                        {analysis.keyTopics.length > 0 && (
                            <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">Key Topics</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {analysis.keyTopics.map((topic, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                            {topic}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {analysis.actionItems.length > 0 && (
                            <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">Action Items</h4>
                                <ul className="space-y-1.5">
                                    {analysis.actionItems.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
