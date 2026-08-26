"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Plan } from "@/types/calendar";
import { formatPlanDate, getPlanIcon, getPriorityColor } from "@/lib/calendar/utils";

interface CalendarDayViewProps {
    date: Date;
    plans: Plan[];
    calendarId: string;
}

export function CalendarDayView({ date, plans, calendarId }: CalendarDayViewProps) {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to 8 AM by default
    useEffect(() => {
        if (scrollRef.current) {
            const eightAM = 8 * 60; // 8 AM in minutes
            scrollRef.current.scrollTop = eightAM * (64 / 60); // 64px per hour
        }
    }, []);

    // Helper to position plans
    const getPlanPosition = (plan: Plan) => {
        const start = new Date(plan.start);
        const end = new Date(plan.end);

        const startHour = start.getHours();
        const startMinute = start.getMinutes();
        const endHour = end.getHours();
        const endMinute = end.getMinutes();

        const top = (startHour * 60 + startMinute) * (64 / 60); // 64px per hour height
        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        const height = Math.max(durationMinutes * (64 / 60), 32); // Min height 30 mins

        return { top, height };
    };

    // Filter plans for this day
    const dayPlans = plans.filter((plan) => {
        const planDate = new Date(plan.start);
        return (
            planDate.getDate() === date.getDate() &&
            planDate.getMonth() === date.getMonth() &&
            planDate.getFullYear() === date.getFullYear()
        );
    });

    return (
        <Card className="h-[600px] flex flex-col overflow-hidden">
            <CardContent className="p-0 flex-1 overflow-y-auto relative" ref={scrollRef}>
                {/* Time Grid */}
                {Array.from({ length: 24 }).map((_, hour) => (
                    <div key={hour} className="flex border-b border-border dark:border-slate-700 h-16 relative group">
                        {/* Time Label */}
                        <div className="w-16 flex-shrink-0 text-xs text-muted-foreground p-2 text-right border-r border-border dark:border-slate-700 bg-muted/20 sticky left-0">
                            {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                        </div>
                        {/* Hour Slot */}
                        <div
                            className="flex-1 hover:bg-accent/5 cursor-pointer"
                            onClick={() => {
                                // Navigate to create plan with this time pre-filled?
                                // For now just go to new plan page
                                router.push(`/marketing/calendar/${calendarId}/plan/new`);
                            }}
                        />
                    </div>
                ))}

                {/* Plans Layer */}
                {dayPlans.map((plan) => {
                    const { top, height } = getPlanPosition(plan);
                    const isShort = height < 40;

                    return (
                        <div
                            key={plan.id}
                            className={`absolute left-16 right-2 rounded-md p-2 text-xs border cursor-pointer hover:shadow-md transition-all z-10 overflow-hidden ${getPriorityColor(
                                plan.priority
                            ).replace("text-", "border-").replace("bg-", "bg-opacity-90 bg-")}`}
                            style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                backgroundColor: "var(--background)",
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/marketing/calendar/${calendarId}/plan/${plan.id}`);
                            }}
                        >
                            <div className={`h-full w-full rounded p-1 ${getPriorityColor(plan.priority)}`}>
                                <div className="flex items-center gap-1 font-semibold truncate">
                                    <span>{getPlanIcon(plan.type)}</span>
                                    <span>{plan.title}</span>
                                </div>
                                {!isShort && (
                                    <div className="mt-1 opacity-90 truncate">
                                        {formatPlanDate(new Date(plan.start), true).split("at")[1]} -{" "}
                                        {formatPlanDate(new Date(plan.end), true).split("at")[1]}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Current Time Indicator */}
                {date.toDateString() === new Date().toDateString() && (
                    <div
                        className="absolute left-16 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                        style={{
                            top: `${(new Date().getHours() * 60 + new Date().getMinutes()) * (64 / 60)}px`,
                        }}
                    >
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
