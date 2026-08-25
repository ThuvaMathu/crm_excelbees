"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateProjectStatus } from "@/lib/firestore/projects";
import { toast } from "sonner";
import { Project, ProjectStatus } from "@/types/crm";
import { ChevronRight, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { logger } from "@/lib/logger/client";

interface ProjectStatusControlProps {
    project: Project;
    onUpdate?: () => void;
    canEdit?: boolean;
}

const STATUS_FLOW: ProjectStatus[] = ["Planning", "Development", "Active", "Management", "Completed"];

export function ProjectStatusControl({ project, onUpdate, canEdit = true }: ProjectStatusControlProps) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const handleStatusChange = async (newStatus: ProjectStatus) => {
        if (!canEdit) {
            logger.warn("Project status change denied - user lacks edit permission", { module: "projects", action: "update-status", metadata: { projectId: project.id } });
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
            logger.info("User updating project status", { module: "projects", action: "update-status", metadata: { projectId: project.id, newStatus } });
            await updateProjectStatus(project.id, newStatus, user!.uid);
            toast.success(`Project moved to ${newStatus}`);
            if (onUpdate) onUpdate();
        } catch (error) {
            logger.error("Failed to update project status", { module: "projects", action: "update-status", metadata: { projectId: project.id, newStatus }, error });
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
                                    <span title="Status locked - you don't have permission to change">
                                        <Lock className="h-3 w-3 ml-1 opacity-70" />
                                    </span>
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
