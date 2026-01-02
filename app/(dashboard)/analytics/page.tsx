"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { PipelineChart } from "@/components/charts/PipelineChart";
import { ActivityChart } from "@/components/charts/ActivityChart";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getDeals } from "@/lib/firestore/deals";
import { getActivities } from "@/lib/firestore/activities";
import type { Deal } from "@/types/crm";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { toast } from "sonner";

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dealsResult] = await Promise.all([
                getDeals(),
            ]);

            if (dealsResult.error) {
                toast.error(dealsResult.error);
            } else {
                setDeals(dealsResult.deals);
            }
        } catch (error) {
            console.error("Error fetching analytics data:", error);
            toast.error("Failed to load analytics data");
        }
        setLoading(false);
    };

    // Prepare revenue data (last 6 months)
    const revenueData = Array.from({ length: 6 }, (_, i) => {
        const monthDate = subMonths(new Date(), 5 - i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthDeals = deals.filter((deal) => {
            const dealDate = deal.createdAt.toDate();
            return isWithinInterval(dealDate, { start: monthStart, end: monthEnd });
        });

        const wonDeals = monthDeals.filter((d) => d.stage === "Won");

        return {
            month: format(monthDate, "MMM"),
            revenue: wonDeals.reduce((sum, deal) => sum + deal.value, 0),
            deals: wonDeals.length,
        };
    });

    // Prepare pipeline data
    const pipelineData = [
        "Pipeline",
        "Follow Up",
        "Schedule Service",
        "Conversation",
        "Won",
        "Lost",
    ].map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage);
        return {
            stage: stage as any,
            count: stageDeals.length,
            value: stageDeals.reduce((sum, deal) => sum + deal.value, 0),
        };
    });

    // Prepare activity data
    const activityTypes = ["note", "email", "call", "status_change", "log"];
    const activityData = activityTypes.map((type) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1).replace("_", " "),
        count: Math.floor(Math.random() * 50) + 10, // Mock data - replace with real data
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Analytics"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Analytics" },
                ]}
                description="Visualize your CRM data and track performance"
            />

            <div className="grid gap-6 md:grid-cols-2">
                <RevenueChart data={revenueData} />
                <PipelineChart data={pipelineData} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <ActivityChart data={activityData} />

                {/* Placeholder for future charts */}
                <div className="border-2 border-dashed rounded-lg p-8 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <p className="font-medium">More charts coming soon</p>
                        <p className="text-sm mt-1">Lead conversion, team performance, etc.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
