"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { ToolbarProps } from "react-big-calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export function CalendarToolbar({ label, onNavigate, onView, view }: ToolbarProps) {
    const goToBack = () => {
        onNavigate('PREV');
    };

    const goToNext = () => {
        onNavigate('NEXT');
    };

    const goToCurrent = () => {
        onNavigate('TODAY');
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 p-1">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex bg-muted rounded-md p-1 items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-background shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary"
                        onClick={goToBack}
                        title="Previous"
                        aria-label="Previous range"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-3 text-xs font-semibold hover:bg-background shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary"
                        onClick={goToCurrent}
                        title="Today"
                        aria-label="Go to today"
                    >
                        Today
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-background shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary"
                        onClick={goToNext}
                        title="Next"
                        aria-label="Next range"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <h2 className="text-lg font-bold text-foreground ml-2 capitalize" aria-live="polite">
                    {label}
                </h2>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="flex bg-muted p-1 rounded-md">
                    {['month', 'week', 'day', 'agenda'].map((v) => (
                        <button
                            key={v}
                            onClick={() => onView(v as any)}
                            className={`
                                px-3 py-1 text-xs font-medium rounded-sm transition-all capitalize
                                ${view === v
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}
                            `}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
