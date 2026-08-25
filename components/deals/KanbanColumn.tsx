"use client";

import { useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import type { Deal, DealStage } from "@/types/crm";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
    stage: DealStage;
    deals: Deal[];
    stageColor: string;
    totalValue: string;
    canMove: (deal: Deal) => boolean;
    onDealClick: (dealId: string) => void;
}

export function KanbanColumn({
    stage,
    deals,
    stageColor,
    totalValue,
    canMove,
    onDealClick,
}: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: stage });

    return (
        <Card
            ref={setNodeRef}
            className={`p-4 ${stageColor} border-2 ${isOver ? "ring-2 ring-primary" : ""}`}
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{stage}</h3>
                    <span className="text-xs text-muted-foreground">{deals.length}</span>
                </div>
                <div className="text-xs font-medium text-muted-foreground">{totalValue}</div>

                <div className="space-y-2 min-h-[200px] max-h-[45vh] overflow-y-auto scrollbar-hide">
                    {deals.map((deal) => (
                        <KanbanCard
                            key={deal.id}
                            deal={deal}
                            canMove={canMove(deal)}
                            onClick={() => onDealClick(deal.id)}
                        />
                    ))}
                </div>
            </div>
        </Card>
    );
}