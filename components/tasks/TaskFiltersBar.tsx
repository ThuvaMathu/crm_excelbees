"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
    Filter,
    User,
    Calendar as CalendarIcon,
    AlertCircle,
    CheckCircle,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/types/crm";

const USER_ROLE_OPTIONS = [
    { value: "all", label: "All Tasks" },
    { value: "assigned", label: "Assigned to Me" },
    { value: "created", label: "Created by Me" },
    { value: "associated", label: "Associated with Me" },
];

const PRIORITY_OPTIONS: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];
const STATUS_OPTIONS: TaskStatus[] = ["To Do", "In Progress", "Review", "Done"];

interface TaskFiltersBarProps {
    userRole: "all" | "assigned" | "created" | "associated";
    onUserRoleChange: (value: "all" | "assigned" | "created" | "associated") => void;
    dateRange: { from: Date | null; to: Date | null };
    onDateRangeChange: (range: { from: Date | null; to: Date | null }) => void;
    priorities: TaskPriority[];
    onPrioritiesChange: (priorities: TaskPriority[]) => void;
    statuses: TaskStatus[];
    onStatusesChange: (statuses: TaskStatus[]) => void;
    onClearFilters: () => void;
    onApply?: () => void;
}

export function TaskFiltersBar({
    userRole,
    onUserRoleChange,
    dateRange,
    onDateRangeChange,
    priorities,
    onPrioritiesChange,
    statuses,
    onStatusesChange,
    onClearFilters,
    onApply,
}: TaskFiltersBarProps) {
    const [open, setOpen] = useState(false);

    const activeFilterCount = [
        userRole !== "all" ? 1 : 0,
        dateRange.from || dateRange.to ? 1 : 0,
        priorities.length > 0 ? 1 : 0,
        statuses.length > 0 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const togglePriority = (priority: TaskPriority) => {
        if (priorities.includes(priority)) {
            onPrioritiesChange(priorities.filter((p) => p !== priority));
        } else {
            onPrioritiesChange([...priorities, priority]);
        }
    };

    const toggleStatus = (status: TaskStatus) => {
        if (statuses.includes(status)) {
            onStatusesChange(statuses.filter((s) => s !== status));
        } else {
            onStatusesChange([...statuses, status]);
        }
    };

    const handleClearDateRange = () => {
        onDateRangeChange({ from: null, to: null });
    };

    const getPriorityColor = (priority: TaskPriority): string => {
        const colors: Record<TaskPriority, string> = {
            Low: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
            Medium: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
            High: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
            Urgent: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
        };
        return colors[priority];
    };

    const getStatusColor = (status: TaskStatus): string => {
        const colors: Record<TaskStatus, string> = {
            "To Do": "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
            "In Progress": "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
            Review: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200",
            Done: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
        };
        return colors[status];
    };

    return (
        <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "gap-2",
                            activeFilterCount > 0 && "border-primary/50 bg-primary/5"
                        )}
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="ml-1 h-5 min-w-[20px] rounded-full px-1 text-xs"
                            >
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-4">
                        {/* Header with Clear button */}
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Task Filters</h3>
                            {activeFilterCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClearFilters}
                                    className="h-7 text-xs"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear All
                                </Button>
                            )}
                        </div>

                        {/* User Role Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                Show Tasks
                            </label>
                            <Select
                                value={userRole}
                                onValueChange={(value) =>
                                    onUserRoleChange(value as typeof userRole)
                                }
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {USER_ROLE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                Due Date Range
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start text-left font-normal h-9"
                                    >
                                        <CalendarIcon className="h-4 w-4 mr-2 opacity-50" />
                                        {dateRange.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "MMM d")} -{" "}
                                                    {format(dateRange.to, "MMM d")}
                                                </>
                                            ) : (
                                                format(dateRange.from, "MMM d")
                                            )
                                        ) : (
                                            <span className="text-muted-foreground">Pick dates</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="range"
                                        selected={{
                                            from: dateRange.from || undefined,
                                            to: dateRange.to || undefined,
                                        }}
                                        onSelect={(range) =>
                                            onDateRangeChange({
                                                from: range?.from || null,
                                                to: range?.to || null,
                                            })
                                        }
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                            {(dateRange.from || dateRange.to) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearDateRange}
                                    className="h-7 w-full text-xs"
                                >
                                    Clear date range
                                </Button>
                            )}
                        </div>

                        {/* Priority Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Priorities
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {PRIORITY_OPTIONS.map((priority) => (
                                    <Badge
                                        key={priority}
                                        variant="outline"
                                        className={cn(
                                            "cursor-pointer transition-colors",
                                            getPriorityColor(priority),
                                            priorities.includes(priority)
                                                ? "ring-2 ring-primary ring-offset-1"
                                                : "opacity-60 hover:opacity-100"
                                        )}
                                        onClick={() => togglePriority(priority)}
                                    >
                                        {priority}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Statuses
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {STATUS_OPTIONS.map((status) => (
                                    <Badge
                                        key={status}
                                        variant="outline"
                                        className={cn(
                                            "cursor-pointer transition-colors",
                                            getStatusColor(status),
                                            statuses.includes(status)
                                                ? "ring-2 ring-primary ring-offset-1"
                                                : "opacity-60 hover:opacity-100"
                                        )}
                                        onClick={() => toggleStatus(status)}
                                    >
                                        {status}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Apply button for mobile */}
                        <div className="pt-2 border-t">
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                    setOpen(false);
                                    onApply?.();
                                }}
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
