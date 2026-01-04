"use client";

import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useTheme } from "next-themes";
import "@/styles/calendar-custom.css";

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

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource?: any;
    type: "blog" | "social" | "email" | "ad";
}

interface MarketingCalendarProps {
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
    onSlotSelect?: (slot: { start: Date; end: Date }) => void;
}

export function MarketingCalendar({ events, onEventClick, onSlotSelect }: MarketingCalendarProps) {
    const { theme } = useTheme();
    const [view, setView] = useState<View>(Views.MONTH);

    const eventStyleGetter = (event: CalendarEvent) => {
        let backgroundColor = "#3b82f6"; // blue-500

        switch (event.type) {
            case "blog": backgroundColor = "#10b981"; break; // emerald-500
            case "social": backgroundColor = "#8b5cf6"; break; // violet-500
            case "email": backgroundColor = "#f59e0b"; break; // amber-500
        }

        return {
            style: {
                backgroundColor,
                borderRadius: "4px",
                opacity: 0.9,
                color: "white",
                border: "0px",
                display: "block"
            }
        };
    };

    return (
        <Card className="p-4 h-[700px] bg-white dark:bg-secondary-900 border-none shadow-none">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                view={view}
                onView={setView}
                selectable
                onSelectEvent={onEventClick}
                onSelectSlot={onSlotSelect}
                eventPropGetter={eventStyleGetter}
                className={theme === "dark" ? "rbc-dark-mode" : ""}
            />
        </Card>
    );
}
