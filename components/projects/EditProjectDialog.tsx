"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AITextarea } from "@/components/ui/ai-textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { updateProject } from "@/lib/firestore/projects";
import type { Project, ProjectPriority, ProjectStatus } from "@/types/crm";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface EditProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project;
    onSuccess?: () => void;
}

interface EditFormData {
    name: string;
    description: string;
    scope: string;
    status: ProjectStatus;
    priority: ProjectPriority;
    startDate: string;
    endDate: string;
    budget: number;
    phases: { id: string; name: string; description?: string; progress: number; order: number }[];
}

const PROJECT_STATUSES: ProjectStatus[] = [
    "Planning", "Active", "On Hold", "Completed", "Cancelled",
];

const PROJECT_PRIORITIES: ProjectPriority[] = [
    "Low", "Medium", "High", "Critical",
];

const safeToDate = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date.toDate === "function") return date.toDate();
    if (date instanceof Date) return date;
    if (typeof date === "string") return new Date(date);
    if (typeof date === "object" && typeof date.seconds === "number") return new Date(date.seconds * 1000);
    return null;
};

export function EditProjectDialog({
    open,
    onOpenChange,
    project,
    onSuccess,
}: EditProjectDialogProps) {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const buildInitial = useCallback(() => ({
        name: project.name || "",
        description: project.description || "",
        scope: project.scope || "",
        status: project.status || "Planning" as ProjectStatus,
        priority: project.priority || "Medium" as ProjectPriority,
        startDate: safeToDate(project.startDate) ? safeToDate(project.startDate)!.toISOString().split("T")[0] : "",
        endDate: safeToDate(project.endDate) ? safeToDate(project.endDate)!.toISOString().split("T")[0] : "",
        budget: project.budget || 0,
        phases: (project.phases || []).map((p: any) => ({
            id: p.id || uuidv4(),
            name: p.name || "",
            description: p.description || "",
            progress: p.progress || 0,
            order: p.order || 0,
        })),
    }), [project]);

    const form = useForm<EditFormData>({
        defaultValues: buildInitial(),
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "phases" as any,
    });

    useEffect(() => {
        if (open) {
            form.reset(buildInitial());
        }
    }, [open, buildInitial, form]);

    const addPhase = () => {
        append({ id: uuidv4(), name: "", description: "", progress: 0, order: fields.length });
    };

    const onSubmit = async (data: EditFormData) => {
        setLoading(true);

        const phases = data.phases.map((p, i) => ({ ...p, order: i }));

        const updateData: any = {
            name: data.name,
            description: data.description,
            scope: data.scope,
            phases,
            status: data.status,
            priority: data.priority,
            budget: data.budget ? Number(data.budget) : undefined,
            startDate: data.startDate ? Timestamp.fromDate(new Date(data.startDate)) : undefined,
            endDate: data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : undefined,
        };

        const avgProgress = phases.length > 0
            ? Math.round(phases.reduce((sum, p) => sum + p.progress, 0) / phases.length)
            : 0;
        if (avgProgress >= 100) updateData.progress = 100;
        else updateData.progress = avgProgress;

        Object.keys(updateData).forEach((key) => {
            if (updateData[key] === undefined) delete updateData[key];
        });

        const { success, error } = await updateProject(project.id, updateData, user?.uid || "");

        setLoading(false);

        if (success) {
            toast.success("Project updated successfully!");
            onOpenChange(false);
            onSuccess?.();
        } else {
            toast.error(error || "Failed to update project");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>Update project details, scope, and phases</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Name *</FormLabel>
                                    <FormControl><Input placeholder="Project name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>{PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>{PROJECT_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="scope"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Scope</FormLabel>
                                    <FormControl>
                                        <AITextarea placeholder="Define what this project aims to achieve..." rows={3} {...field} minWords={5} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Phases</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addPhase} className="gap-1">
                                    <Plus className="h-3.5 w-3.5" /> Add Phase
                                </Button>
                            </div>
                            {(fields as any).map((field: any, index: number) => (
                                <div key={field.id} className="border rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground">Phase {index + 1}</span>
                                        {fields.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="h-6 w-6 p-0 text-destructive">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`phases.${index}.name` as any}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl><Input placeholder="Phase name" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name={`phases.${index}.progress` as any}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <div className="flex items-center gap-1">
                                                            <Input type="number" min={0} max={100} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                                            <span className="text-xs text-muted-foreground">%</span>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <FormField
                            control={form.control}
                            name="budget"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Budget ($)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <AITextarea placeholder="Project description..." rows={3} {...field} minWords={5} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? <><LoadingSpinner size="sm" className="mr-2" />Saving...</> : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
