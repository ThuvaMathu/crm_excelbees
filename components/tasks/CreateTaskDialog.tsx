"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { AITextarea } from "@/components/ui/ai-textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Sparkles, Loader2 } from "lucide-react";

import { createTask } from "@/lib/firestore/tasks";
import { getProjects } from "@/lib/firestore/projects";
import { getUsers, type UserProfile } from "@/lib/firestore/users";
import { getDeals } from "@/lib/firestore/deals";
import { taskSchema, type TaskFormData } from "@/lib/validations/task";
import { useAuth } from "@/hooks/useAuth";
import type { Project, User, Deal, TaskStatus, TaskPriority, TaskType } from "@/types/crm";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    defaultProjectId?: string;
    defaultDealId?: string;
}

const TASK_STATUSES: TaskStatus[] = ["To Do", "In Progress", "Review", "Done"];
const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];
const TASK_TYPES: TaskType[] = ["To Do", "Call", "Email", "Meeting"];

export function CreateTaskDialog({
    open,
    onOpenChange,
    onSuccess,
    defaultProjectId,
    defaultDealId,
}: CreateTaskDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const form = useForm({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: "",
            description: "",
            status: "To Do",
            priority: "Medium",
            type: "To Do",
            tags: [],
            projectId: defaultProjectId ?? undefined,
            dealId: defaultDealId ?? undefined,
            dueDate: undefined,
            assigneeId: undefined,
        },
    });

    useEffect(() => {
        if (open) {
            fetchOptions();
        }
    }, [open]);

    // Update default values if props change
    useEffect(() => {
        if (defaultProjectId) {
            form.setValue("projectId", defaultProjectId);
        }
        if (defaultDealId) {
            form.setValue("dealId", defaultDealId);
        }
    }, [defaultProjectId, defaultDealId, form]);

    const fetchOptions = async () => {
        try {
            const projectsRes = await getProjects();
            const dealsRes = await getDeals();
            const usersRes: any = await getUsers();

            if (projectsRes.projects) setProjects(projectsRes.projects);
            if (dealsRes.deals) setDeals(dealsRes.deals);
            if (usersRes.users) setUsers(usersRes.users);
        } catch (error) {
            console.error("Failed to fetch options:", error);
            toast.error("Failed to load form options");
        }
    };

    const onSubmit = async (data: TaskFormData) => {
        if (!user) return;
        setLoading(true);

        try {
            const assignee = users.find(u => u.uid === data.assigneeId);
            const project = projects.find(p => p.id === data.projectId);

            const taskData: any = {
                ...data,
                assigneeName: assignee?.displayName || undefined,
                projectName: project?.name || undefined,
                dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : undefined,
                // Handle "none" values from Select
                projectId: data.projectId === "none" ? undefined : data.projectId,
                dealId: data.dealId === "none" ? undefined : data.dealId,
                assigneeId: data.assigneeId === "none" ? undefined : data.assigneeId,
            };

            // Remove undefined fields
            Object.keys(taskData).forEach(key => taskData[key] === undefined && delete taskData[key]);

            const { success, error } = await createTask(taskData, user.uid);

            if (success) {
                toast.success("Task created successfully");
                form.reset();
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(error || "Failed to create task");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                        Add a new task to your list.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter task title" {...field} />
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {TASK_STATUSES.map((status) => (
                                                    <SelectItem key={status} value={status}>
                                                        {status}
                                                    </SelectItem>
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
                                        <FormLabel>Priority</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {TASK_PRIORITIES.map((priority) => (
                                                    <SelectItem key={priority} value={priority}>
                                                        {priority}
                                                    </SelectItem>
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
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {TASK_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Due Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="assigneeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assignee</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select team member" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {users.map((u) => (
                                                    <SelectItem key={u.uid} value={u.uid}>
                                                        {u.displayName || u.email}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="projectId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Project</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!!defaultProjectId}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Link to project" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {projects.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dealId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deal</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!!defaultDealId}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Link to deal" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {deals.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        {d.title}
                                                    </SelectItem>
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
                                    <FormControl>
                                        <AITextarea
                                            label="Description"
                                            placeholder="Task details..."
                                            className="min-h-[120px]"
                                            minWords={5}
                                            {...field}
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
                                {loading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                                Create Task
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
