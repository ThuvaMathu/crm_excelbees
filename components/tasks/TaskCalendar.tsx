"use client";

import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addHours } from "date-fns";
import { enUS } from "date-fns/locale";
import type { Task } from "@/types/crm";
import { useState } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { cn } from "@/lib/utils";

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
        let className = "bg-primary text-primary-foreground border-none text-xs";

        switch (task.priority) {
            case "High":
            case "Urgent":
                className = "bg-red-500 text-white border-none text-xs";
                break;
            case "Medium":
                className = "bg-blue-500 text-white border-none text-xs";
                break;
            case "Low":
                className = "bg-gray-500 text-white border-none text-xs";
                break;
        }

        if (task.status === "Done") {
            className = "bg-green-500 text-white opacity-60 line-through text-xs";
        }

        return {
            className,
        };
    };

    return (
        <div className="h-[700px] bg-white dark:bg-gray-950 rounded-md border p-4 shadow-sm">
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
                eventPropGetter={eventPropGetter}
                tooltipAccessor={(event) => event.title}
            />
        </div>
    );
}
