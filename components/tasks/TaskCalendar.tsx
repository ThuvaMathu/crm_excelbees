"use client";

import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addHours } from "date-fns";
import { enUS } from "date-fns/locale";
import type { Task } from "@/types/crm";
import { useState } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { cn } from "@/lib/utils";
import { CalendarToolbar } from "./CalendarToolbar";

const locales = {
    "en-US": enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface TaskCalendarProps {
    tasks: Task[];
    onSelectTask: (task: Task) => void;
}

export function TaskCalendar({ tasks, onSelectTask }: TaskCalendarProps) {
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());

    const events = tasks
        .filter((task) => task.dueDate)
        .map((task) => {
            // Create an event that spans at least 1 hour for display if no start time
            const start = task.dueDate!.toDate();
            const end = addHours(start, 1);

            return {
                title: task.title,
                start,
                end,
                resource: task,
                allDay: task.type === "To Do", // Simple heuristic
            };
        });

    const eventPropGetter = (event: any) => {
        const task = event.resource as Task;
        // Default styling - muted but visible
        let className = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-l-2 border-slate-500";

        switch (task.priority) {
            case "High":
            case "Urgent":
                // Urgent: Red
                className = "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-l-2 border-red-500";
                break;
            case "Medium":
                // Medium: Blue
                className = "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-l-2 border-blue-500";
                break;
            case "Low":
                // Low: Gray/Green
                className = "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border-l-2 border-emerald-500";
                break;
        }

        if (task.status === "Done") {
            className = "bg-gray-100/50 text-gray-400 dark:text-gray-600 border-gray-300 dark:border-gray-700 line-through opacity-70";
        }

        return {
            className: cn("px-2 py-1 text-xs rounded-r-md border-0 border-l-4 mb-1 truncate", className),
        };
    };

    const handleNavigate = (newDate: Date) => {
        setDate(newDate);
    };

    return (
        <div className="h-[750px] p-2">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                onSelectEvent={(event) => onSelectTask(event.resource)}
                views={["month", "week", "day", "agenda"]}
                view={view}
                onView={setView}
                date={date}
                onNavigate={handleNavigate}
                eventPropGetter={eventPropGetter}
                tooltipAccessor={(event) => event.title}
                components={{
                    toolbar: CalendarToolbar as any,
                }}
            />
        </div>
    );
}
