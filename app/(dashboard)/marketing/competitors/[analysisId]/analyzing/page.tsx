"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import type { CompetitorAnalysisDocument } from "@/types/competitor-analysis";

const STEPS = [
    { id: 1, name: "Business Analysis", description: "Analyzing your website" },
    { id: 2, name: "Competitor Discovery", description: "Finding competitors" },
    { id: 3, name: "Website Scraping", description: "Collecting competitor data" },
    { id: 4, name: "Content Analysis", description: "Analyzing competitor strategies" },
    { id: 5, name: "Insights Generation", description: "Creating your report" },
];

export default function AnalyzingPage() {
    const router = useRouter();
    const params = useParams();
    const analysisId = params.analysisId as string;

    const [analysis, setAnalysis] = useState<CompetitorAnalysisDocument | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (!analysisId) return;

        // Real-time listener for analysis status
        const unsubscribe = onSnapshot(
            doc(db, "marketing/competitor/analyses", analysisId),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data() as CompetitorAnalysisDocument;
                    setAnalysis(data);

                    // Redirect to confirm if discovering (stuck state)
                    if (data.status === "discovering" && data.competitorsFound?.length) {
                        router.push(`/marketing/competitors/${analysisId}/confirm`);
                        return;
                    }

                    // Map status to step number
                    const statusToStep: Record<string, number> = {
                        discovering: 2,
                        scraping: 3,
                        analyzing: 4,
                        complete: 5,
                    };

                    setCurrentStep(statusToStep[data.status] || data.currentStep || 0);

                    // Redirect to report when complete
                    if (data.status === "complete") {
                        setTimeout(() => {
                            router.push(`/marketing/competitors/${analysisId}/report`);
                        }, 2000);
                    }

                    // Handle failed status
                    if (data.status === "failed") {
                        setTimeout(() => {
                            router.push("/marketing/competitors");
                        }, 3000);
                    }
                }
            },
            (error) => {
                console.error("Error listening to analysis:", error);
            }
        );

        return () => unsubscribe();
    }, [analysisId, router]);

    const getStepStatus = (stepId: number) => {
        if (stepId < currentStep) return "complete";
        if (stepId === currentStep) return "active";
        return "pending";
    };

    const progress = (currentStep / STEPS.length) * 100;

    return (
        <MarketingLayout
            title="Analyzing Competitors"
            description="Please wait while we analyze your competitors"
        >
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Progress Bar */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Overall Progress</span>
                                <span className="text-muted-foreground">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-sm text-muted-foreground text-center">
                                {analysis?.status === "complete"
                                    ? "Analysis complete! Redirecting to report..."
                                    : analysis?.status === "failed"
                                        ? "Analysis failed. Redirecting..."
                                        : "This usually takes 2-3 minutes"}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Steps */}
                <div className="space-y-4">
                    {STEPS.map((step, index) => {
                        const status = getStepStatus(step.id);

                        return (
                            <Card
                                key={step.id}
                                className={`transition-all ${status === "active"
                                    ? "border-primary bg-primary/5"
                                    : status === "complete"
                                        ? "border-green-500/20 bg-green-500/5"
                                        : "opacity-60"
                                    }`}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        {/* Icon */}
                                        <div
                                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${status === "complete"
                                                ? "bg-green-500 text-white"
                                                : status === "active"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {status === "complete" ? (
                                                <CheckCircle2 className="h-5 w-5" />
                                            ) : status === "active" ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Circle className="h-5 w-5" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{step.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {status === "complete"
                                                    ? "Completed"
                                                    : status === "active"
                                                        ? step.description
                                                        : "Waiting..."}
                                            </p>
                                        </div>

                                        {/* Step Number */}
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Step {step.id}/{STEPS.length}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Info Card */}
                {analysis && (
                    <Card className="border-dashed">
                        <CardContent className="pt-6">
                            <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Analyzing{" "}
                                    <span className="font-semibold text-foreground">
                                        {analysis.competitorsFound?.filter(c => c.selected).length || 0}
                                    </span>{" "}
                                    competitors for{" "}
                                    <span className="font-semibold text-foreground">
                                        {analysis.userBusinessProfile?.industry}
                                    </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Location: {analysis.location}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MarketingLayout>
    );
}
