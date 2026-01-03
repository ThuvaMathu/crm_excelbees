"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateProjectStatus } from "@/lib/firestore/projects";
import { toast } from "sonner";
import { Project, ProjectStatus } from "@/types/crm";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectStatusControlProps {
    project: Project;
    onUpdate?: () => void;
}

const STATUS_FLOW: ProjectStatus[] = ["Planning", "Development", "Active", "Management", "Completed"];

export function ProjectStatusControl({ project, onUpdate }: ProjectStatusControlProps) {
    const [loading, setLoading] = useState(false);

    const handleStatusChange = async (newStatus: ProjectStatus) => {
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
            await updateProjectStatus(project.id, newStatus);
            toast.success(`Project moved to ${newStatus}`);
            if (onUpdate) onUpdate();
        } catch (error) {
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
                                disabled={loading}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors",
                                    isCurrent && "bg-primary text-primary-foreground border-primary",
                                    isPast && "bg-muted text-muted-foreground border-transparent hover:bg-muted/80",
                                    isFuture && "bg-background text-muted-foreground border-muted hover:border-primary/50"
                                )}
                            >
                                {isCurrent && <Check className="h-4 w-4" />}
                                {status}
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
