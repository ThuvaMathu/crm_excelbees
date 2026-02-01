"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Plan } from "@/types/calendar";
import { formatPlanDate, getPlanIcon, getPriorityColor, getWeekNumber } from "@/lib/calendar/utils";

interface CalendarWeekViewProps {
    date: Date;
    plans: Plan[];
    calendarId: string;
}

export function CalendarWeekView({ date, plans, calendarId }: CalendarWeekViewProps) {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Get days of the week ensuring we start from Sunday/Monday based on current date
    const getWeekDays = () => {
        const curr = new Date(date);
        const day = curr.getDay(); // 0 is Sunday
        // Assuming start of week is Sunday for now to match month view
        const first = curr.getDate() - day;

        const days = [];
        for (let i = 0; i < 7; i++) {
            const next = new Date(curr);
            next.setDate(first + i);
            days.push(next);
        }
        return days;
    };

    const weekDays = getWeekDays();

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

        // Calculate vertical position (time)
        const startHour = start.getHours();
        const startMinute = start.getMinutes();

        const top = (startHour * 60 + startMinute) * (64 / 60); // 64px per hour height
        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        const height = Math.max(durationMinutes * (64 / 60), 24); // Min height

        return { top, height };
    };

    return (
        <Card className="h-[650px] flex flex-col">
            <div className="grid grid-cols-8 border-b border-border dark:border-slate-700 bg-muted/10 sticky top-0 z-20">
                <div className="w-16 border-r border-border dark:border-slate-700 p-2 text-center text-xs text-muted-foreground flex items-center justify-center">
                    Time
                </div>
                {weekDays.map((day, i) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                        <div key={i} className={`p-2 text-center border-r border-border dark:border-slate-700 last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}>
                            <div className="text-xs text-muted-foreground uppercase">{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
                            <div className={`text-sm font-semibold w-7 h-7 mx-auto flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : ""}`}>
                                {day.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            <CardContent className="p-0 flex-1 overflow-y-auto relative" ref={scrollRef}>
                <div className="grid grid-cols-8 min-h-[1536px]"> {/* 24 * 64px */}
                    {/* Time Column */}
                    <div className="border-r border-border dark:border-slate-700 bg-muted/5">
                        {Array.from({ length: 24 }).map((_, hour) => (
                            <div key={hour} className="h-16 border-b border-border dark:border-slate-700 text-xs text-muted-foreground p-1 text-right pr-2 sticky left-0">
                                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    {weekDays.map((day, dayIndex) => {
                        // Filter plans for this day
                        const dayPlans = plans.filter((plan) => {
                            const planDate = new Date(plan.start);
                            return (
                                planDate.getDate() === day.getDate() &&
                                planDate.getMonth() === day.getMonth() &&
                                planDate.getFullYear() === day.getFullYear()
                            );
                        });

                        return (
                            <div key={dayIndex} className="relative border-r border-border dark:border-slate-700 last:border-r-0">
                                {/* Grid Lines */}
                                {Array.from({ length: 24 }).map((_, hour) => (
                                    <div
                                        key={hour}
                                        className="h-16 border-b border-border dark:border-slate-700 hover:bg-accent/5 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/marketing/calendar/${calendarId}/plan/new`)}
                                    />
                                ))}

                                {/* Plans */}
                                {dayPlans.map((plan) => {
                                    const { top, height } = getPlanPosition(plan);

                                    return (
                                        <div
                                            key={plan.id}
                                            className={`absolute left-1 right-1 rounded p-1 text-[10px] border cursor-pointer hover:brightness-95 hover:shadow-sm z-10 overflow-hidden ${getPriorityColor(plan.priority)}`}
                                            style={{
                                                top: `${top}px`,
                                                height: `${height}px`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/marketing/calendar/${calendarId}/plan/${plan.id}`);
                                            }}
                                        >
                                            <div className="font-semibold truncate leading-tight">
                                                {getPlanIcon(plan.type)} {plan.title}
                                            </div>
                                            {height > 30 && (
                                                <div className="truncate opacity-80">
                                                    {new Date(plan.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Current Time Indicator */}
                                {day.toDateString() === new Date().toDateString() && (
                                    <div
                                        className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                                        style={{
                                            top: `${(new Date().getHours() * 60 + new Date().getMinutes()) * (64 / 60)}px`,
                                        }}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 -mt-[5px]" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
