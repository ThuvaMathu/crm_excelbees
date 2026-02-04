"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateProjectStatus } from "@/lib/firestore/projects";
import { toast } from "sonner";
import { Project, ProjectStatus } from "@/types/crm";
import { ChevronRight, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectStatusControlProps {
    project: Project;
    onUpdate?: () => void;
    canEdit?: boolean;
}

const STATUS_FLOW: ProjectStatus[] = ["Planning", "Development", "Active", "Management", "Completed"];

export function ProjectStatusControl({ project, onUpdate, canEdit = true }: ProjectStatusControlProps) {
    const [loading, setLoading] = useState(false);

    const handleStatusChange = async (newStatus: ProjectStatus) => {
        if (!canEdit) {
            console.warn(`[RBAC] Project status change denied - user lacks edit permission`);
            toast.error("You don't have permission to change project status");
            return;
        }

        if (newStatus === project.status) return;

        // Validation for Management Phase
        if (newStatus === "Management") {
            if (!project.financials?.annualRecurringCost) {
                toast.error("Cannot enter Management phase without an Annual Recurring Cost set.");
                return;
            }
        }

        setLoading(true);
        try {
            console.log(`[RBAC] User updating project ${project.id} status to ${newStatus}`);
            await updateProjectStatus(project.id, newStatus);
            toast.success(`Project moved to ${newStatus}`);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(`[RBAC] Failed to update project status:`, error);
            toast.error("Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full overflow-x-auto pb-4">
            <div className="flex items-center min-w-max">
                {STATUS_FLOW.map((status, index) => {
                    const isCurrent = project.status === status;
                    const isPast = STATUS_FLOW.indexOf(project.status) > index;
                    const isFuture = STATUS_FLOW.indexOf(project.status) < index;

                    return (
                        <div key={status} className="flex items-center">
                            <button
                                onClick={() => handleStatusChange(status)}
                                disabled={loading || !canEdit}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors relative",
                                    isCurrent && "bg-primary text-primary-foreground border-primary",
                                    isPast && "bg-muted text-muted-foreground border-transparent hover:bg-muted/80",
                                    isFuture && "bg-background text-muted-foreground border-muted hover:border-primary/50",
                                    !canEdit && "cursor-not-allowed opacity-70"
                                )}
                            >
                                {isCurrent && <Check className="h-4 w-4" />}
                                {status}
                                {!canEdit && isCurrent && (
                                    <Lock className="h-3 w-3 ml-1 opacity-70" title="Status locked - you don't have permission to change" />
                                )}
                            </button>
                            {index < STATUS_FLOW.length - 1 && (
                                <div className="h-0.5 w-8 bg-muted mx-2" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
