"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { PipelineChart } from "@/components/charts/PipelineChart";
import { ActivityChart } from "@/components/charts/ActivityChart";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { getDeals } from "@/lib/firestore/deals";
import { getOrganizationActivities } from "@/lib/firestore/activities";
import { useOrgStore } from "@/store/org";
import { usePermission } from "@/hooks/usePermission";
import type { Deal } from "@/types/crm";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { toJsDate } from "@/lib/utils";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { RBACGuard } from "@/components/auth/RBACGuard";
import { logger } from "@/lib/logger/client";

export default function AnalyticsPage() {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const { currentMember } = useOrgStore();
    const { isManager } = usePermission();
    const base = `/org/${orgId}`;
    const [loading, setLoading] = useState(true);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [activities, setActivities] = useState<any[]>([]);

    const canViewFinancials = isManager();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dealsResult, activitiesResult] = await Promise.all([
                getDeals(orgId),
                getOrganizationActivities(orgId, 500)
            ]);

            if (dealsResult.error) {
                toast.error(dealsResult.error);
            } else {
                setDeals(dealsResult.deals);
            }

            if (activitiesResult.error) {
                logger.error("Error fetching activities", { module: "analytics", action: "fetch", orgId, error: activitiesResult.error });
            } else {
                setActivities(activitiesResult.activities);
            }
        } catch (error) {
            logger.error("Error fetching analytics data", { module: "analytics", action: "fetch", orgId, error });
            toast.error("Failed to load analytics data");
        }
        setLoading(false);
    };

    const revenueData = Array.from({ length: 6 }, (_, i) => {
        const monthDate = subMonths(new Date(), 5 - i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthDeals = deals.filter((deal) => {
            const dealDate = toJsDate(deal.createdAt);
            return dealDate ? isWithinInterval(dealDate, { start: monthStart, end: monthEnd }) : false;
        });

        const wonDeals = monthDeals.filter((d) => d.stage === "Won");

        return {
            month: format(monthDate, "MMM"),
            revenue: wonDeals.reduce((sum, deal) => sum + deal.value, 0),
            deals: wonDeals.length,
        };
    });

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

    const activityTypes = ["note", "email", "call", "status_change", "log"];
    const activityData = activityTypes.map((type) => {
        const count = activities.filter((a) => a.type === type).length;
        return {
            type: type.charAt(0).toUpperCase() + type.slice(1).replace("_", " "),
            count,
        };
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <RBACGuard requirePermission={{ module: "reports", action: "read" }}>
            <div className="space-y-6">
                <PageHeader
                    title="Analytics"
                    breadcrumbs={[
                        { label: "Dashboard", href: `${base}/dashboard` },
                        { label: "Analytics" },
                    ]}
                    description="Visualize your CRM data and track performance"
                />

                {canViewFinancials ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        <RevenueChart data={revenueData} />
                        <PipelineChart data={pipelineData} />
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Financial Analytics Restricted</h3>
                            <p className="text-sm text-muted-foreground text-center max-w-md">
                                Revenue charts and pipeline value analytics are only available to administrators and managers.
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Your role: <span className="font-medium">{currentMember?.role || "team"}</span>
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    <ActivityChart data={activityData} />

                    <div className="border-2 border-dashed rounded-lg p-8 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <p className="font-medium">More charts coming soon</p>
                            <p className="text-sm mt-1">Lead conversion, team performance, etc.</p>
                        </div>
                    </div>
                </div>
            </div>

        </RBACGuard>
    );
}
