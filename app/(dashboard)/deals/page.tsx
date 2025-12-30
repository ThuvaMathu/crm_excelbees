"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CreateDealDialog } from "@/components/deals/CreateDealDialog";
import { getDealsByStage, updateDealStage } from "@/lib/firestore/deals";
import type { Deal, DealStage } from "@/types/crm";
import { Plus } from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "sonner";

const STAGES: DealStage[] = [
    "Pipeline",
    "Follow Up",
    "Schedule Service",
    "Conversation",
    "Won",
    "Lost",
];

const stageColors: Record<DealStage, string> = {
    Pipeline: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    "Follow Up": "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800",
    "Schedule Service": "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    Conversation: "bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800",
    Won: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
    Lost: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
};

export default function DealsPage() {
    const [dealsByStage, setDealsByStage] = useState<Record<DealStage, Deal[]> | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const fetchDeals = async () => {
        try {
            setLoading(true);
            const { dealsByStage: deals, error } = await getDealsByStage();

            if (error) {
                console.error("Error fetching deals:", error);
                setDealsByStage({
                    Pipeline: [],
                    "Follow Up": [],
                    "Schedule Service": [],
                    Conversation: [],
                    Won: [],
                    Lost: [],
                });
            } else if (deals) {
                setDealsByStage(deals);
            }
        } catch (error) {
            console.error("Failed to fetch deals:", error);
            setDealsByStage({
                Pipeline: [],
                "Follow Up": [],
                "Schedule Service": [],
                Conversation: [],
                Won: [],
                Lost: [],
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const deal = Object.values(dealsByStage || {})
            .flat()
            .find((d) => d.id === active.id);
        setActiveDeal(deal || null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDeal(null);

        if (!over || active.id === over.id) return;

        const dealId = active.id as string;
        const newStage = over.id as DealStage;

        // Optimistically update UI
        if (dealsByStage) {
            const updatedDeals = { ...dealsByStage };
            let movedDeal: Deal | null = null;

            // Find and remove deal from old stage
            for (const stage of STAGES) {
                const index = updatedDeals[stage].findIndex((d) => d.id === dealId);
                if (index !== -1) {
                    movedDeal = updatedDeals[stage][index];
                    updatedDeals[stage] = updatedDeals[stage].filter((d) => d.id !== dealId);
                    break;
                }
            }

            // Add to new stage
            if (movedDeal) {
                movedDeal.stage = newStage;
                updatedDeals[newStage].push(movedDeal);
                setDealsByStage(updatedDeals);
            }
        }

        // Update in Firestore
        const { success, error } = await updateDealStage(dealId, newStage);
        if (success) {
            toast.success(`Deal moved to ${newStage}`);
        } else {
            toast.error(error || "Failed to update deal");
            // Revert on error
            fetchDeals();
        }
    };

    const getTotalValue = (deals: Deal[]) => {
        return deals.reduce((sum, deal) => sum + deal.value, 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Deals Pipeline"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Deals" },
                ]}
                description="Manage your sales pipeline"
                actions={
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="bg-primary hover:bg-primary/90 gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Deal
                    </Button>
                }
            />

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {STAGES.map((stage) => {
                        const deals = dealsByStage?.[stage] || [];
                        const totalValue = getTotalValue(deals);

                        return (
                            <Card
                                key={stage}
                                id={stage}
                                className={`p-4 ${stageColors[stage]} border-2`}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-sm">{stage}</h3>
                                        <span className="text-xs text-muted-foreground">
                                            {deals.length}
                                        </span>
                                    </div>
                                    <div className="text-xs font-medium text-muted-foreground">
                                        ${totalValue.toLocaleString()}
                                    </div>

                                    <div className="space-y-2 min-h-[200px]">
                                        {deals.map((deal) => (
                                            <Card
                                                key={deal.id}
                                                id={deal.id}
                                                className="p-3 cursor-move hover:shadow-md transition-shadow bg-card"
                                            >
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-sm line-clamp-2">
                                                        {deal.title}
                                                    </h4>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-semibold text-primary">
                                                            ${deal.value.toLocaleString()}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {deal.probability}%
                                                        </span>
                                                    </div>
                                                    {deal.companyName && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {deal.companyName}
                                                        </p>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <DragOverlay>
                    {activeDeal && (
                        <Card className="p-3 shadow-lg bg-card opacity-90">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">{activeDeal.title}</h4>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-primary">
                                        ${activeDeal.value.toLocaleString()}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {activeDeal.probability}%
                                    </span>
                                </div>
                            </div>
                        </Card>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Create Deal Dialog */}
            <CreateDealDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={fetchDeals}
            />
        </div>
    );
}
