"use client";

import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import type { Deal } from "@/types/crm";

interface KanbanCardProps {
    deal: Deal;
    canMove: boolean;
    onClick: () => void;
}

export function KanbanCard({ deal, canMove, onClick }: KanbanCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: deal.id,
        disabled: !canMove,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <Card
            ref={setNodeRef}
            {...attributes}
            {...(canMove ? listeners : {})}
            style={style}
            className={`p-3 hover:shadow-md transition-shadow bg-card ${isDragging ? "opacity-50" : ""} ${canMove ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
            onClick={canMove ? undefined : onClick}
        >
            <div
                className="space-y-2"
                onClick={canMove ? onClick : undefined}
            >
                <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm line-clamp-2 flex-1">{deal.title}</h4>
                    {!canMove && (
                        <span title="You don't have permission to edit this deal">
                            <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary">
                        ${deal.value.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">{deal.probability}%</span>
                </div>
                {deal.companyName && (
                    <p className="text-xs text-muted-foreground truncate">{deal.companyName}</p>
                )}
            </div>
        </Card>
    );
}