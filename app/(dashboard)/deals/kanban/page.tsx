"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getDealsByStage, updateDealStage } from "@/lib/firestore/deals";
import type { Deal, DealStage } from "@/types/crm";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    useDroppable,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DollarSign, Building2, LayoutList } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const STAGES: DealStage[] = [
    "Pipeline",
    "Follow Up",
    "Schedule Service",
    "Conversation",
    "Won",
    "Lost",
];

const STAGE_COLORS: Record<DealStage, string> = {
    "Pipeline": "bg-blue-100 text-blue-800 border-blue-200",
    "Follow Up": "bg-purple-100 text-purple-800 border-purple-200",
    "Schedule Service": "bg-orange-100 text-orange-800 border-orange-200",
    "Conversation": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Won": "bg-green-100 text-green-800 border-green-200",
    "Lost": "bg-red-100 text-red-800 border-red-200",
};

interface DealCardProps {
    deal: Deal;
    isDragging?: boolean;
}

function DealCard({ deal, isDragging }: DealCardProps) {
    const router = useRouter();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: deal.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleClick = (e: React.MouseEvent) => {
        // Only navigate if not dragging
        if (!isDragging) {
            router.push(`/deals/${deal.id}`);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group"
        >
            <Card
                className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                onClick={handleClick}
            >
                <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm line-clamp-2">
                            {deal.title}
                        </h4>
                        {deal.companyName && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate">{deal.companyName}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm font-bold text-primary">
                            <DollarSign className="h-4 w-4" />
                            {deal.value.toLocaleString()}
                        </div>
                        <Badge variant="outline" className="text-xs">
                            {deal.probability}%
                        </Badge>
                    </div>

                    {deal.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {deal.description}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

interface KanbanColumnProps {
    stage: DealStage;
    deals: Deal[];
    totalValue: number;
}

function KanbanColumn({ stage, deals, totalValue }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: stage,
        data: { type: "column", stage },
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col h-full min-w-[280px] max-w-[320px] transition-all ${isOver ? "ring-2 ring-purple-500 ring-offset-2" : ""
                }`}
        >
            <div className={`rounded-t-lg border-2 p-3 ${STAGE_COLORS[stage]}`}>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{stage}</h3>
                    <Badge variant="secondary" className="text-xs">
                        {deals.length}
                    </Badge>
                </div>
                <div className="text-xs font-medium mt-1">
                    ${totalValue.toLocaleString()}
                </div>
            </div>

            <div className="flex-1 bg-muted/30 border-x-2 border-b-2 border-t-0 rounded-b-lg p-2 overflow-y-auto">
                <SortableContext
                    items={deals.map(d => d.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {deals.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                No deals
                            </div>
                        ) : (
                            deals.map((deal) => (
                                <DealCard key={deal.id} deal={deal} />
                            ))
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}

export default function DealsKanbanPage() {
    const { user } = useAuth();
    const [dealsByStage, setDealsByStage] = useState<Record<DealStage, Deal[]>>({
        "Pipeline": [],
        "Follow Up": [],
        "Schedule Service": [],
        "Conversation": [],
        "Won": [],
        "Lost": [],
    });
    const [loading, setLoading] = useState(true);
    const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

    const canEdit = user?.role === "admin" || user?.role === "manager";

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        setLoading(true);
        const { dealsByStage: fetchedDeals, error } = await getDealsByStage();

        if (error) {
            toast.error(error);
        } else if (fetchedDeals) {
            setDealsByStage(fetchedDeals);
        }

        setLoading(false);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const deal = Object.values(dealsByStage)
            .flat()
            .find((d) => d.id === active.id);
        setActiveDeal(deal || null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDeal(null);

        if (!over || !canEdit) return;

        const dealId = active.id as string;
        const newStage = over.data.current?.stage as DealStage;

        if (!newStage) return;

        // Find the deal and its current stage
        let currentStage: DealStage | null = null;
        let deal: Deal | null = null;

        for (const [stage, deals] of Object.entries(dealsByStage)) {
            const foundDeal = deals.find((d) => d.id === dealId);
            if (foundDeal) {
                currentStage = stage as DealStage;
                deal = foundDeal;
                break;
            }
        }

        if (!deal || !currentStage || currentStage === newStage) return;

        // Optimistic update
        const updatedDealsByStage = { ...dealsByStage };
        updatedDealsByStage[currentStage] = updatedDealsByStage[currentStage].filter(
            (d) => d.id !== dealId
        );
        updatedDealsByStage[newStage] = [
            ...updatedDealsByStage[newStage],
            { ...deal, stage: newStage },
        ];
        setDealsByStage(updatedDealsByStage);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const totalValue = Object.values(dealsByStage)
        .flat()
        .reduce((sum, deal) => sum + deal.value, 0);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Deals Pipeline"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Deals", href: "/deals" },
                    { label: "Kanban" },
                ]}
                actions={
                    <div className="flex gap-2">
                        <Link href="/deals">
                            <Button variant="outline" size="sm">
                                <LayoutList className="h-4 w-4 mr-2" />
                                List View
                            </Button>
                        </Link>
                        {!canEdit && (
                            <Badge variant="secondary">View Only</Badge>
                        )}
                    </div>
                }
            />

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Pipeline Overview</CardTitle>
                        <div className="text-sm text-muted-foreground">
                            Total Value: <span className="font-bold text-foreground">${totalValue.toLocaleString()}</span>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {STAGES.map((stage) => {
                        const deals = dealsByStage[stage];
                        const stageValue = deals.reduce((sum, deal) => sum + deal.value, 0);
                        return (
                            <KanbanColumn
                                key={stage}
                                stage={stage}
                                deals={deals}
                                totalValue={stageValue}
                            />
                        );
                    })}
                </div>

                <DragOverlay>
                    {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
