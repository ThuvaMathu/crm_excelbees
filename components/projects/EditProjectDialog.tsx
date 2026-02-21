"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { AITextarea } from "@/components/ui/ai-textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { updateProject } from "@/lib/firestore/projects";
import type { Project, ProjectPriority, ProjectStatus } from "@/types/crm";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

interface EditProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project;
    onSuccess?: () => void;
}

const PROJECT_STATUSES: ProjectStatus[] = [
    "Planning",
    "Active",
    "On Hold",
    "Completed",
    "Cancelled",
];

const PROJECT_PRIORITIES: ProjectPriority[] = [
    "Low",
    "Medium",
    "High",
    "Critical",
];

// Helper to safely convert Firestore Timestamp or Date to JS Date
const safeToDate = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date.toDate === "function") return date.toDate();
    if (date instanceof Date) return date;
    if (typeof date === "string") return new Date(date);
    if (typeof date === "object" && typeof date.seconds === "number") {
        return new Date(date.seconds * 1000);
    }
    return null;
};

export function EditProjectDialog({
    open,
    onOpenChange,
    project,
    onSuccess,
}: EditProjectDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        defaultValues: {
            name: project.name || "",
            description: project.description || "",
            status: project.status || "Planning",
            priority: project.priority || "Medium",
            startDate: safeToDate(project.startDate)
                ? safeToDate(project.startDate)!.toISOString().split("T")[0]
                : "",
            endDate: safeToDate(project.endDate)
                ? safeToDate(project.endDate)!.toISOString().split("T")[0]
                : "",
            budget: project.budget || 0,
        },
    });

    // Reset form when project changes
    useEffect(() => {
        if (open && project) {
            form.reset({
                name: project.name || "",
                description: project.description || "",
                status: project.status || "Planning",
                priority: project.priority || "Medium",
                startDate: safeToDate(project.startDate)
                    ? safeToDate(project.startDate)!.toISOString().split("T")[0]
                    : "",
                endDate: safeToDate(project.endDate)
                    ? safeToDate(project.endDate)!.toISOString().split("T")[0]
                    : "",
                budget: project.budget || 0,
            });
        }
    }, [open, project]);

    const onSubmit = async (data: any) => {
        setLoading(true);

        const updateData: any = {
            name: data.name,
            description: data.description,
            status: data.status,
            priority: data.priority,
            budget: data.budget ? Number(data.budget) : undefined,
            startDate: data.startDate
                ? Timestamp.fromDate(new Date(data.startDate))
                : undefined,
            endDate: data.endDate
                ? Timestamp.fromDate(new Date(data.endDate))
                : undefined,
        };

        // Remove undefined values
        Object.keys(updateData).forEach((key) => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const { success, error } = await updateProject(project.id, updateData);

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
                    <DialogDescription>
                        Update project details
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Name *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Project name"
                                            {...field}
                                        />
                                    </FormControl>
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
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {PROJECT_STATUSES.map(
                                                    (status) => (
                                                        <SelectItem
                                                            key={status}
                                                            value={status}
                                                        >
                                                            {status}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
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
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {PROJECT_PRIORITIES.map(
                                                    (priority) => (
                                                        <SelectItem
                                                            key={priority}
                                                            value={priority}
                                                        >
                                                            {priority}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
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
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => {
                                    const startDate = form.watch("startDate");
                                    return (
                                        <FormItem>
                                            <FormLabel>End Date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    min={startDate || undefined}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="budget"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Budget ($)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : 0
                                                )
                                            }
                                        />
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
                                        <AITextarea
                                            placeholder="Project description..."
                                            rows={3}
                                            {...field}
                                            minWords={5}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <LoadingSpinner
                                            size="sm"
                                            className="mr-2"
                                        />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
