"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CreateDealDialog } from "@/components/deals/CreateDealDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDealsByStage, updateDealStage } from "@/lib/firestore/deals";
import type { Deal, DealStage } from "@/types/crm";
import { Plus, Search, SlidersHorizontal, X, Lock } from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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

type ValueRange = "all" | "under-10k" | "10k-50k" | "50k-100k" | "over-100k";

export default function DealsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [dealsByStage, setDealsByStage] = useState<Record<DealStage, Deal[]> | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [stageFilter, setStageFilter] = useState<DealStage | "all">("all");
    const [valueFilter, setValueFilter] = useState<ValueRange>("all");
    const [showFilters, setShowFilters] = useState(false);

    // Role-based access control - only admins, managers, and deal owners can edit
    const canEditDeals = user?.role === "admin" || user?.role === "manager";

    // Check if a specific deal can be edited by the current user
    const canEditDeal = (deal: Deal): boolean => {
        if (canEditDeals) return true;
        return deal.ownerId === user?.uid;
    };

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
        const deal = Object.values(displayDealsByStage || {})
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

        // Find the deal being moved
        const movedDeal = Object.values(dealsByStage || {})
            .flat()
            .find((d) => d.id === dealId);

        // Permission check: Verify user can edit this deal
        if (!movedDeal || !canEditDeal(movedDeal)) {
            console.warn(`[RBAC] User ${user?.uid} (${user?.role}) denied permission to move deal ${dealId}`);
            toast.error("You don't have permission to move this deal");
            fetchDeals(); // Revert any UI changes
            return;
        }

        console.log(`[RBAC] User ${user?.uid} (${user?.role}) moving deal ${dealId} to ${newStage}`);

        // Optimistically update UI
        if (dealsByStage) {
            const updatedDeals = { ...dealsByStage };
            let dealToUpdate: Deal | null = null;

            // Find and remove deal from old stage
            for (const stage of STAGES) {
                const index = updatedDeals[stage].findIndex((d) => d.id === dealId);
                if (index !== -1) {
                    dealToUpdate = updatedDeals[stage][index];
                    updatedDeals[stage] = updatedDeals[stage].filter((d) => d.id !== dealId);
                    break;
                }
            }

            // Add to new stage
            if (dealToUpdate) {
                dealToUpdate.stage = newStage;
                updatedDeals[newStage].push(dealToUpdate);
                setDealsByStage(updatedDeals);
            }
        }

        // Update in Firestore
        const { success, error } = await updateDealStage(dealId, newStage);
        if (success) {
            console.log(`[RBAC] Deal ${dealId} successfully moved to ${newStage} by user ${user?.uid}`);
            toast.success(`Deal moved to ${newStage}`);
        } else {
            console.error(`[RBAC] Failed to move deal ${dealId}:`, error);
            toast.error(error || "Failed to update deal");
            // Revert on error
            fetchDeals();
        }
    };

    const getTotalValue = (deals: Deal[]) => {
        return deals.reduce((sum, deal) => sum + deal.value, 0);
    };

    // Filter deals based on search and filters
    const filteredDealsByStage = useMemo(() => {
        if (!dealsByStage) return null;

        const filtered: Record<DealStage, Deal[]> = {
            Pipeline: [],
            "Follow Up": [],
            "Schedule Service": [],
            Conversation: [],
            Won: [],
            Lost: [],
        };

        for (const stage of STAGES) {
            const stageDeals = dealsByStage[stage] || [];

            // Apply filters
            const filteredDeals = stageDeals.filter((deal) => {
                // Search filter
                const matchesSearch =
                    searchQuery === "" ||
                    deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (deal.companyName && deal.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (deal.description && deal.description.toLowerCase().includes(searchQuery.toLowerCase()));

                // Stage filter
                const matchesStage = stageFilter === "all" || deal.stage === stageFilter;

                // Value filter
                let matchesValue = true;
                switch (valueFilter) {
                    case "under-10k":
                        matchesValue = deal.value < 10000;
                        break;
                    case "10k-50k":
                        matchesValue = deal.value >= 10000 && deal.value < 50000;
                        break;
                    case "50k-100k":
                        matchesValue = deal.value >= 50000 && deal.value < 100000;
                        break;
                    case "over-100k":
                        matchesValue = deal.value >= 100000;
                        break;
                }

                return matchesSearch && matchesStage && matchesValue;
            });

            filtered[stage] = filteredDeals;
        }

        return filtered;
    }, [dealsByStage, searchQuery, stageFilter, valueFilter]);

    // Display data - use filtered if filters are active, otherwise use all deals
    const displayDealsByStage = (searchQuery || stageFilter !== "all" || valueFilter !== "all")
        ? filteredDealsByStage
        : dealsByStage;

    const activeFilterCount = [
        searchQuery !== "" ? 1 : 0,
        stageFilter !== "all" ? 1 : 0,
        valueFilter !== "all" ? 1 : 0,
    ].reduce((sum, count) => sum + count, 0);

    const clearFilters = () => {
        setSearchQuery("");
        setStageFilter("all");
        setValueFilter("all");
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
                action={
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="bg-primary hover:bg-primary/90 gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Deal
                    </Button>
                }
            />

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-1 items-center gap-2 w-full sm:max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search deals by title, company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                        className={showFilters ? "bg-accent" : undefined}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                    {activeFilterCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear ({activeFilterCount})
                        </Button>
                    )}
                </div>

                {showFilters && (
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Stage:</span>
                            <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as DealStage | "all")}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Stages</SelectItem>
                                    {STAGES.map((stage) => (
                                        <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                    {canEditDeals && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Value:</span>
                            <Select value={valueFilter} onValueChange={(v) => setValueFilter(v as ValueRange)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Values</SelectItem>
                                    <SelectItem value="under-10k">Under $10k</SelectItem>
                                    <SelectItem value="10k-50k">$10k - $50k</SelectItem>
                                    <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                                    <SelectItem value="over-100k">$100k+</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    </div>
                )}
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={canEditDeals ? handleDragStart : undefined}
                onDragEnd={canEditDeals ? handleDragEnd : undefined}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {STAGES.map((stage) => {
                        const deals = displayDealsByStage?.[stage] || [];
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
                                        {canEditDeals ? `$${totalValue.toLocaleString()}` : "$•••"}
                                    </div>

                                    <div className="space-y-2 min-h-[200px] max-h-[45vh] overflow-y-auto scrollbar-hide">
                                        {deals.map((deal) => {
                                            const dealEditable = canEditDeal(deal);
                                            return (
                                                <Card
                                                    key={deal.id}
                                                    id={deal.id}
                                                    className={`p-3 hover:shadow-md transition-shadow bg-card ${dealEditable && canEditDeals ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                                                    onClick={() => router.push(`/deals/${deal.id}`)}
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className="font-medium text-sm line-clamp-2 flex-1">
                                                                {deal.title}
                                                            </h4>
                                                            {!dealEditable && (
                                                                <span title="You don't have permission to edit this deal">
                                                                    <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-semibold text-primary">
                                                                {canEditDeals ? `$${deal.value.toLocaleString()}` : "$•••"}
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
                                            );
                                        })}
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
