"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { createProject } from "@/lib/firestore/projects";
import { getCompanies } from "@/lib/firestore/companies";
import { projectSchema, type ProjectFormData, type ProjectFormInput } from "@/lib/validations/project";
import { useAuth } from "@/hooks/useAuth";
import { useOrgStore } from "@/store/org";
import type { ProjectInput, ProjectPriority, Company, ProjectStatus } from "@/types/crm";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (createdProject?: any) => void;
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

// Form field values may hold a native Date or (when seeded from an existing
// record) a Firestore Timestamp — both are valid pre-validation input for
// the coerceTimestamp* schema helpers.
function toDate(value: Date | { toDate: () => Date }): Date {
    return value instanceof Date ? value : value.toDate();
}

export function CreateProjectDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateProjectDialogProps) {
    const { user } = useAuth();
    const { currentOrg } = useOrgStore();
    const organizationId = currentOrg?.id;
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);

    const form = useForm<ProjectFormInput, any, ProjectFormData>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: "",
            description: "",
            scope: "",
            phases: [{ id: uuidv4(), name: "", description: "", progress: 0, order: 0 }],
            status: "Planning" as ProjectStatus,
            priority: "Medium" as ProjectPriority,
            startDate: new Date(),
            lifecycle: "active",
            teamMembers: [],
            endDate: undefined,
            budget: undefined,
            companyId: undefined,
            initialCost: undefined,
            annualRecurringCost: undefined,
            isRecurringEnabled: false,
            notificationsEnabled: true,
            emailNotificationsEnabled: true,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "phases",
    });

    useEffect(() => {
        if (open) {
            fetchCompanies();
            form.reset({
                name: "",
                description: "",
                scope: "",
                phases: [{ id: uuidv4(), name: "", description: "", progress: 0, order: 0 }],
                status: "Planning",
                priority: "Medium",
                startDate: new Date(),
                lifecycle: "active",
                teamMembers: [],
                endDate: undefined,
                budget: undefined,
                companyId: undefined,
                initialCost: undefined,
                annualRecurringCost: undefined,
                isRecurringEnabled: false,
                notificationsEnabled: true,
                emailNotificationsEnabled: true,
            });
        }
    }, [open]);

    const fetchCompanies = async () => {
        const { companies } = await getCompanies(organizationId);
        if (companies) {
            setCompanies(companies);
        }
    };

    const addPhase = () => {
        append({ id: uuidv4(), name: "", description: "", progress: 0, order: fields.length });
    };

    const onSubmit = async (data: ProjectFormData) => {
        if (!user) {
            toast.error("You must be logged in to create a project");
            return;
        }
        if (!organizationId) {
            toast.error("No organization selected");
            return;
        }

        setLoading(true);

        let companyName: string | undefined;
        if (data.companyId) {
            const company = companies.find((c) => c.id === data.companyId);
            companyName = company?.name;
        }

        const phasesWithOrder = data.phases.map((p, i) => ({ ...p, order: i }));

        const projectData = {
            ...data,
            phases: phasesWithOrder,
            startDate: Timestamp.fromDate(data.startDate),
            endDate: data.endDate ? Timestamp.fromDate(data.endDate) : undefined,
            companyName,
            progress: 0,
            tags: [],
            teamMembers: data.teamMembers.length > 0 ? data.teamMembers : [user.uid],
            financials: {
                initialCost: data.initialCost || 0,
                annualRecurringCost: data.annualRecurringCost || 0,
                managementBillingCycle: "None" as const,
                isRecurringEnabled: false,
            },
            notificationSettings: {
                enabled: true,
                emailEnabled: true,
            },
        };

        const cleanProjectData = Object.fromEntries(
            Object.entries(projectData).filter(([_, v]) => v !== undefined)
        ) as any;

        const { success, error, id } = await createProject(cleanProjectData, user.uid, organizationId);

        setLoading(false);

        if (success) {
            toast.success("Project created successfully!");
            form.reset();
            const now = Timestamp.now();
            const createdProject = {
                id,
                name: data.name,
                description: data.description,
                scope: data.scope,
                phases: phasesWithOrder,
                lifecycle: "active" as const,
                status: data.status,
                priority: data.priority,
                startDate: Timestamp.fromDate(data.startDate),
                endDate: data.endDate ? Timestamp.fromDate(data.endDate) : undefined,
                budget: data.budget,
                companyId: data.companyId,
                companyName,
                progress: 0,
                tags: [],
                teamMembers: data.teamMembers.length > 0 ? data.teamMembers : [user.uid],
                financials: {
                    initialCost: data.initialCost || 0,
                    annualRecurringCost: data.annualRecurringCost || 0,
                    managementBillingCycle: "None" as const,
                    isRecurringEnabled: false,
                },
                notificationSettings: {
                    enabled: true,
                    emailEnabled: true,
                },
                ownerId: user.uid,
                archived: false,
                createdAt: now,
                updatedAt: now,
            };
            onOpenChange(false);
            onSuccess?.(createdProject);
        } else {
            toast.error(error || "Failed to create project");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Define the project scope and initial phases to get started
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Q1 Marketing Campaign" {...field} />
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
                                        <FormLabel>Status *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {PROJECT_STATUSES.map((status) => (
                                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                                ))}
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
                                        <FormLabel>Priority *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {PROJECT_PRIORITIES.map((priority) => (
                                                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                                                ))}
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
                                        <FormLabel>Start Date *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                min={new Date().toISOString().split("T")[0]}
                                                {...field}
                                                value={field.value ? toDate(field.value).toISOString().split("T")[0] : ""}
                                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                            />
                                        </FormControl>
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
                                        <FormControl>
                                            <Input
                                                type="date"
                                                min={new Date().toISOString().split("T")[0]}
                                                {...field}
                                                value={field.value ? toDate(field.value).toISOString().split("T")[0] : ""}
                                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                            />
                                        </FormControl>
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
                                    <FormLabel>Project Scope *</FormLabel>
                                    <FormControl>
                                        <AITextarea
                                            placeholder="Define what this project aims to achieve, key deliverables, and boundaries..."
                                            rows={3}
                                            {...field}
                                            minWords={5}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Project Phases *</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addPhase} className="gap-1">
                                    <Plus className="h-3.5 w-3.5" /> Add Phase
                                </Button>
                            </div>
                            {fields.map((field, index) => (
                                <div key={field.id} className="border rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground">Phase {index + 1}</span>
                                        {fields.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="h-6 w-6 p-0 text-destructive">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name={`phases.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="Phase name (e.g., Research, Design, Development)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`phases.${index}.description`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="Brief description (optional)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="budget"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Budget ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0.00" {...field}
                                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="companyId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select company (optional)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {companies.map((company) => (
                                                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <AITextarea placeholder="Additional project details and goals..." rows={3} {...field} minWords={5} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                                {loading ? (
                                    <><LoadingSpinner size="sm" className="mr-2" /> Creating...</>
                                ) : (
                                    "Create Project"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
