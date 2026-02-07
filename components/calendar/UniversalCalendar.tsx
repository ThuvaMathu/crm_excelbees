"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  addMonths,
  subMonths,
  endOfWeek,
  startOfDay,
  addDays,
  differenceInDays,
  isWithinInterval,
} from "date-fns";

// ============================================================================
// Types
// ============================================================================

export type CalendarView = "month" | "week" | "day" | "agenda";

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  type?: "task" | "campaign" | "meeting" | "call" | "email" | "reminder" | "custom";
  status?: "todo" | "in-progress" | "done" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  color?: string;
  description?: string;
  location?: string;
}

export interface UniversalCalendarProps {
  /**
   * Events to display on the calendar
   */
  events?: CalendarEvent[];

  /**
   * Currently selected date
   */
  selectedDate?: Date;

  /**
   * Callback when a date is clicked
   */
  onDateSelect?: (date: Date) => void;

  /**
   * Callback when an event is clicked
   */
  onEventClick?: (event: CalendarEvent) => void;

  /**
   * Callback when month changes
   */
  onMonthChange?: (date: Date) => void;

  /**
   * Additional CSS class for the container
   */
  className?: string;

  /**
   * Theme variant
   */
  variant?: "default" | "marketing" | "tasks";

  /**
   * Minimum selectable date
   */
  minDate?: Date;

  /**
   * Maximum selectable date
   */
  maxDate?: Date;

  /**
   * Events to highlight (holidays, special dates, etc.)
   */
  highlightedDates?: Date[];

  /**
   * Custom event renderer
   */
  renderEvent?: (event: CalendarEvent) => React.ReactNode;
}

// ============================================================================
// Constants - Dark Theme Colors
// ============================================================================

const COLORS = {
  // Background colors
  bgPrimary: "#1a202c",      // Deep navy blue - main background
  bgSecondary: "#2d3748",    // Dark gray - active elements, selected date
  bgTertiary: "#324155",     // Medium gray - hover states
  bgCell: "#252f3f",         // Cell background

  // Text colors
  textPrimary: "#ffffff",    // White - primary text
  textSecondary: "#a0aec0",  // Light gray - secondary text
  textMuted: "#718096",      // Muted gray - disabled/weekend text

  // Accent colors
  accent: "#f6ad55",         // Orange - selected date border, highlights
  accentLight: "#fbd38d",    // Light orange - hover states

  // Event type colors
  event: {
    task: "#4299e1",         // Blue
    campaign: "#9f7aea",     // Purple
    meeting: "#48bb78",      // Green
    call: "#38b2ac",         // Cyan
    email: "#ed64a6",        // Pink
    reminder: "#ed8936",     // Orange
    custom: "#718096",       // Gray
  },
};

// ============================================================================
// Event Type Colors
// ============================================================================

const getEventColor = (event: CalendarEvent): string => {
  if (event.color) return event.color;
  return COLORS.event[event.type || "task"] || COLORS.event.task;
};

const getEventBadgeStyles = (event: CalendarEvent): string => {
  const color = getEventColor(event);
  return cn(
    "px-2 py-1 rounded text-xs font-medium truncate",
    "border-l-2",
    event.status === "done" && "opacity-50 line-through",
    event.status === "cancelled" && "opacity-50 line-through"
  );
};

// ============================================================================
// Header Component
// ============================================================================

interface CalendarHeaderProps {
  currentView: CalendarView;
  currentDate: Date;
  onViewChange: (view: CalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

function CalendarHeader({
  currentView,
  currentDate,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  // Format date range based on view
  const getDateRangeText = () => {
    switch (currentView) {
      case "month":
        return format(currentDate, "MMMM yyyy");
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return format(weekStart, "MMMM yyyy");
        }
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
      case "day":
        return format(currentDate, "EEEE, MMMM d, yyyy");
      case "agenda":
        return format(currentDate, "MMMM yyyy");
    }
  };

  const views: { value: CalendarView; label: string }[] = [
    { value: "agenda", label: "Agenda" },
    { value: "month", label: "Month" },
    { value: "week", label: "Week" },
    { value: "day", label: "Day" },
  ];

  return (
    <div className="flex items-center justify-between mb-6 px-2">
      {/* Left - Navigation Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          className="p-2 rounded-md hover:bg-[#324155] text-white transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="px-4 py-2 rounded-md bg-[#2d3748] text-white font-medium hover:bg-[#324155] transition-colors"
        >
          today
        </button>
        <button
          type="button"
          onClick={onNext}
          className="p-2 rounded-md hover:bg-[#324155] text-white transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Center - Date Range */}
      <h2 className="text-xl font-bold text-white capitalize">
        {getDateRangeText()}
      </h2>

      {/* Right - View Tabs */}
      <div className="flex items-center bg-[#252f3f] rounded-lg p-1">
        {views.map((view) => (
          <button
            key={view.value}
            type="button"
            onClick={() => onViewChange(view.value)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              currentView === view.value
                ? "bg-[#2d3748] text-white"
                : "text-[#a0aec0] hover:text-white"
            )}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Week Day Header Component
// ============================================================================

function WeekDayHeader({ day, index }: { day: string; index: number }) {
  const isWeekend = index === 0 || index === 6;

  return (
    <div
      className={cn(
        "text-center text-sm font-semibold py-2 uppercase tracking-wide",
        isWeekend ? "text-[#718096]" : "text-[#a0aec0]"
      )}
    >
      {day}
    </div>
  );
}

// ============================================================================
// Month View Day Component
// ============================================================================

interface MonthDayProps {
  date: Date;
  currentMonth: Date;
  selectedDate?: Date;
  events?: CalendarEvent[];
  highlightedDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
  onSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

function MonthDay({
  date,
  currentMonth,
  selectedDate,
  events = [],
  highlightedDates = [],
  minDate,
  maxDate,
  onSelect,
  onEventClick,
}: MonthDayProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
  const isTodayDate = isToday(date);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  // Check if date is disabled
  const isDisabled = minDate && date < minDate && !isSameDay(date, minDate);

  const isHighlighted = highlightedDates.some((d) => isSameDay(date, d));

  const dayEvents = events.filter((event) => isSameDay(event.date, date));

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDisabled && onSelect) {
      onSelect(date);
    }
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    if (onEventClick) {
      onEventClick(event);
    }
  };

  return (
    <div
      className={cn(
        "relative min-h-[100px] p-2 border border-[#2d3748] rounded-lg",
        "transition-all duration-200",
        // Background based on month
        isCurrentMonth ? "bg-[#252f3f]" : "bg-[#1a202c]",
        // Weekend styling
        isWeekend && !isCurrentMonth && "bg-[#1a202c]",
        // Hover
        !isDisabled && "hover:bg-[#2d3748] cursor-pointer",
        // Disabled
        isDisabled && "opacity-30 cursor-not-allowed"
      )}
      onClick={handleClick}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      aria-label={format(date, "MMMM d, yyyy")}
      aria-selected={isSelected}
    >
      {/* Day number */}
      <div className={cn("flex items-start", isTodayDate && "justify-center")}>
        <span
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium",
            // Selected date - orange background
            isSelected && "bg-[#f6ad55] text-white",
            // Today - orange border
            isTodayDate && !isSelected && "border-2 border-[#f6ad55] text-white",
            // Default
            !isSelected && !isTodayDate && isCurrentMonth && "text-white",
            !isSelected && !isTodayDate && !isCurrentMonth && "text-[#718096]"
          )}
        >
          {format(date, "d")}
        </span>
      </div>

      {/* Highlighted date indicator */}
      {isHighlighted && !isSelected && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f6ad55]" />
      )}

      {/* Events */}
      <div className="mt-1 space-y-1">
        {dayEvents.slice(0, 3).map((event) => (
          <div
            key={event.id}
            onClick={(e) => handleEventClick(e, event)}
            className={cn(
              "px-2 py-1 rounded text-xs truncate cursor-pointer",
              "hover:brightness-110 transition-all",
              "border-l-2",
              event.status === "done" && "opacity-50 line-through",
              event.status === "cancelled" && "opacity-50 line-through"
            )}
            style={{
              backgroundColor: `${getEventColor(event)}20`,
              borderLeftColor: getEventColor(event),
              color: getEventColor(event),
            }}
            title={event.title}
          >
            {event.title}
          </div>
        ))}

        {/* More events indicator */}
        {dayEvents.length > 3 && (
          <div className="text-xs text-[#a0aec0] px-2 py-1 truncate">
            +{dayEvents.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Week View Component
// ============================================================================

interface WeekViewProps {
  currentDate: Date;
  selectedDate?: Date;
  events?: CalendarEvent[];
  minDate?: Date;
  maxDate?: Date;
  onSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

function WeekView({
  currentDate,
  selectedDate,
  events = [],
  minDate,
  maxDate,
  onSelect,
  onEventClick,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Generate time slots (hourly from 6 AM to 10 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 6; i <= 22; i++) {
      slots.push(i);
    }
    return slots;
  }, []);

  // Group events by date and time
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    weekDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      grouped[key] = events.filter((event) =>
        isSameDay(event.date, day)
      );
    });
    return grouped;
  }, [events, weekDays]);

  const handleDateClick = (date: Date) => {
    if (onSelect) onSelect(date);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    if (onEventClick) onEventClick(event);
  };

  return (
    <div className="border border-[#2d3748] rounded-lg overflow-hidden bg-[#1a202c]">
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b border-[#2d3748]">
        <div className="p-3 text-center text-xs font-medium text-[#718096] border-r border-[#2d3748]">
          GMT+7
        </div>
        {weekDays.map((day) => {
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toString()}
              onClick={() => handleDateClick(day)}
              className={cn(
                "p-3 text-center cursor-pointer hover:bg-[#252f3f] border-r border-[#2d3748] last:border-r-0",
                isTodayDate && "bg-[#252f3f]"
              )}
            >
              <div className="text-xs text-[#718096] uppercase">
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-medium",
                  isSelected && "bg-[#f6ad55] text-white",
                  isTodayDate && !isSelected && "border-2 border-[#f6ad55] text-white",
                  !isSelected && !isTodayDate && "text-white"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {timeSlots.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-[#2d3748]">
            {/* Time label */}
            <div className="p-2 text-center text-xs text-[#718096] border-r border-[#2d3748]">
              {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate[dateKey] || [];
              const hourEvents = dayEvents.filter((event) => {
                const eventHour = event.date.getHours();
                return eventHour === hour;
              });

              return (
                <div
                  key={`${day}-${hour}`}
                  onClick={() => handleDateClick(day)}
                  className="min-h-[50px] p-1 border-r border-[#2d3748] last:border-r-0 hover:bg-[#252f3f] cursor-pointer"
                >
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => handleEventClick(e, event)}
                      className={cn(
                        "px-2 py-1 rounded text-xs truncate mb-1 cursor-pointer",
                        "hover:brightness-110 transition-all",
                        event.status === "done" && "opacity-50 line-through",
                        event.status === "cancelled" && "opacity-50 line-through"
                      )}
                      style={{
                        backgroundColor: `${getEventColor(event)}30`,
                        borderLeft: `3px solid ${getEventColor(event)}`,
                        color: "#ffffff",
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Day View Component
// ============================================================================

interface DayViewProps {
  currentDate: Date;
  selectedDate?: Date;
  events?: CalendarEvent[];
  onSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

function DayView({
  currentDate,
  selectedDate,
  events = [],
  onSelect,
  onEventClick,
}: DayViewProps) {
  const isTodayDate = isToday(currentDate);
  const isSelected = selectedDate ? isSameDay(currentDate, selectedDate) : false;

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      slots.push(i);
    }
    return slots;
  }, []);

  // Group events by hour
  const eventsByHour = useMemo(() => {
    const grouped: Record<number, CalendarEvent[]> = {};
    for (let i = 0; i < 24; i++) {
      grouped[i] = [];
    }
    events.forEach((event) => {
      const hour = event.date.getHours();
      if (!grouped[hour]) grouped[hour] = [];
      grouped[hour].push(event);
    });
    return grouped;
  }, [events]);

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    if (onEventClick) onEventClick(event);
  };

  return (
    <div className="border border-[#2d3748] rounded-lg overflow-hidden bg-[#1a202c]">
      {/* Date header */}
      <div className="p-4 bg-[#252f3f] border-b border-[#2d3748]">
        <div className="flex items-center justify-center gap-4">
          <div
            className={cn(
              "w-16 h-16 flex items-center justify-center rounded-full text-2xl font-bold",
              isSelected && "bg-[#f6ad55] text-white",
              isTodayDate && !isSelected && "border-4 border-[#f6ad55] text-white",
              !isSelected && !isTodayDate && "bg-[#2d3748] text-white"
            )}
          >
            {format(currentDate, "d")}
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {format(currentDate, "EEEE")}
            </div>
            <div className="text-[#a0aec0]">
              {format(currentDate, "MMMM yyyy")}
            </div>
          </div>
        </div>
      </div>

      {/* Time slots */}
      <div className="max-h-[500px] overflow-y-auto">
        {timeSlots.map((hour) => {
          const hourEvents = eventsByHour[hour] || [];

          return (
            <div
              key={hour}
              className="flex border-b border-[#2d3748] hover:bg-[#252f3f]/50"
            >
              <div className="w-20 p-3 text-right text-sm text-[#718096] border-r border-[#2d3748] flex-shrink-0">
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
              <div className="flex-1 p-2 min-h-[60px]">
                {hourEvents.length === 0 ? (
                  <div className="h-full border border-dashed border-[#2d3748] rounded flex items-center justify-center">
                    <span className="text-xs text-[#718096]">Click to add event</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(e, event)}
                        className={cn(
                          "px-3 py-2 rounded text-sm cursor-pointer hover:brightness-110 transition-all",
                          event.status === "done" && "opacity-50 line-through",
                          event.status === "cancelled" && "opacity-50 line-through"
                        )}
                        style={{
                          backgroundColor: `${getEventColor(event)}20`,
                          borderLeft: `4px solid ${getEventColor(event)}`,
                          color: "#ffffff",
                        }}
                      >
                        <div className="font-medium">{event.title}</div>
                        {event.description && (
                          <div className="text-xs text-[#a0aec0] mt-1">{event.description}</div>
                        )}
                        <div className="text-xs text-[#a0aec0] mt-1">
                          {format(event.date, "h:mm a")}
                          {event.endDate && ` - ${format(event.endDate, "h:mm a")}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Agenda View Component
// ============================================================================

interface AgendaViewProps {
  currentDate: Date;
  selectedDate?: Date;
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

type FilterStatus = "all" | "todo" | "in-progress" | "done" | "cancelled";
type FilterType = "all" | "task" | "campaign" | "meeting" | "call" | "email" | "reminder";
type FilterPriority = "all" | "low" | "medium" | "high" | "urgent";

function AgendaView({
  currentDate,
  selectedDate,
  events = [],
  onEventClick,
}: AgendaViewProps) {
  // Local date state for mini calendar navigation
  const [localDate, setLocalDate] = useState<Date>(currentDate);

  // Sync local date with currentDate prop when month changes
  useEffect(() => {
    if (!isSameMonth(localDate, currentDate)) {
      setLocalDate(currentDate);
    }
  }, [currentDate, localDate]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Use localDate for filtering
  const effectiveDate = localDate;

  // Set the function to update date
  const setCurrentDate = setLocalDate;

  // Get events for current month and apply filters
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by current month
    const monthStart = startOfMonth(effectiveDate);
    const monthEnd = endOfMonth(effectiveDate);
    filtered = filtered.filter((event) => {
      const eventDate = startOfDay(event.date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    });

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((event) => event.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((event) => event.type === typeFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((event) => event.priority === priorityFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((event) =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }

    // Sort by date and time
    return filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, effectiveDate, statusFilter, typeFilter, priorityFilter, searchQuery]);

  // Group filtered events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach((event) => {
      const key = format(event.date, "yyyy-MM-dd");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    });
    return grouped;
  }, [filteredEvents]);

  // Get sorted date keys
  const sortedDates = Object.keys(eventsByDate).sort();

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredEvents.length;
    const completed = filteredEvents.filter(e => e.status === "done").length;
    const pending = filteredEvents.filter(e => e.status === "todo" || e.status === "in-progress").length;
    const overdue = filteredEvents.filter(e => {
      const eventDate = startOfDay(e.date);
      const today = startOfDay(new Date());
      return eventDate < today && e.status !== "done" && e.status !== "cancelled";
    }).length;

    return { total, completed, pending, overdue };
  }, [filteredEvents]);

  const handleEventClick = (event: CalendarEvent) => {
    if (onEventClick) onEventClick(event);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setPriorityFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = statusFilter !== "all" || typeFilter !== "all" || priorityFilter !== "all" || searchQuery.trim() !== "";

  return (
    <div className="flex gap-4">
      {/* Left Side - Mini Calendar + Statistics + Filters */}
      <div className="w-80 flex-shrink-0 space-y-4">
        {/* Mini Calendar */}
        <div className="bg-[#252f3f] rounded-lg p-4 border border-[#2d3748]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">{format(effectiveDate, "MMMM yyyy")}</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentDate(subMonths(effectiveDate, 1))}
                className="p-1 rounded hover:bg-[#1a202c] text-[#a0aec0] hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2 py-1 text-xs rounded hover:bg-[#1a202c] text-[#a0aec0] hover:text-white transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(effectiveDate, 1))}
                className="p-1 rounded hover:bg-[#1a202c] text-[#a0aec0] hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mini Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Day headers */}
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div key={index} className="text-[#718096] font-medium py-1">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {(() => {
              const monthStart = startOfMonth(effectiveDate);
              const monthEnd = endOfMonth(effectiveDate);
              const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
              const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
              const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

              // Count events per day
              const eventsCount: Record<string, number> = {};
              events.forEach((event) => {
                const key = format(event.date, "yyyy-MM-dd");
                eventsCount[key] = (eventsCount[key] || 0) + 1;
              });

              return days.map((day) => {
                const isCurrentMonth = isSameMonth(day, effectiveDate);
                const isTodayDate = isToday(day);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const dateKey = format(day, "yyyy-MM-dd");
                const hasEvents = eventsCount[dateKey] > 0;
                const eventCount = eventsCount[dateKey];

                return (
                  <button
                    key={day.toString()}
                    onClick={() => setCurrentDate(day)}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded relative transition-all",
                      isCurrentMonth ? "text-white" : "text-[#718096]",
                      isTodayDate && "ring-1 ring-[#f6ad55]",
                      isSelected && "bg-[#f6ad55] text-white",
                      !isSelected && !isTodayDate && "hover:bg-[#1a202c]"
                    )}
                  >
                    <span>{format(day, "d")}</span>
                    {hasEvents && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#f6ad55]" />
                    )}
                  </button>
                );
              });
            })()}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#252f3f] rounded-lg p-3 border border-[#2d3748]">
            <div className="text-xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-[#a0aec0]">Total</div>
          </div>
          <div className="bg-[#252f3f] rounded-lg p-3 border border-[#2d3748]">
            <div className="text-xl font-bold text-[#48bb78]">{stats.completed}</div>
            <div className="text-xs text-[#a0aec0]">Done</div>
          </div>
          <div className="bg-[#252f3f] rounded-lg p-3 border border-[#2d3748]">
            <div className="text-xl font-bold text-[#ed8936]">{stats.pending}</div>
            <div className="text-xs text-[#a0aec0]">Pending</div>
          </div>
          <div className="bg-[#252f3f] rounded-lg p-3 border border-[#2d3748]">
            <div className="text-xl font-bold text-[#f56565]">{stats.overdue}</div>
            <div className="text-xs text-[#a0aec0]">Overdue</div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-[#252f3f] rounded-lg p-4 border border-[#2d3748]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-[#f6ad55]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-[#f6ad55] hover:text-[#fbd38d] transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#718096]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-2 bg-[#1a202c] border border-[#2d3748] rounded-lg text-white text-sm placeholder-[#718096] focus:outline-none focus:border-[#f6ad55] transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs text-[#a0aec0] mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="w-full px-3 py-2 bg-[#1a202c] border border-[#2d3748] rounded-lg text-white text-sm focus:outline-none focus:border-[#f6ad55] transition-colors"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs text-[#a0aec0] mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as FilterType)}
                className="w-full px-3 py-2 bg-[#1a202c] border border-[#2d3748] rounded-lg text-white text-sm focus:outline-none focus:border-[#f6ad55] transition-colors"
              >
                <option value="all">All Types</option>
                <option value="task">Tasks</option>
                <option value="campaign">Campaigns</option>
                <option value="meeting">Meetings</option>
                <option value="call">Calls</option>
                <option value="email">Emails</option>
                <option value="reminder">Reminders</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-xs text-[#a0aec0] mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
                className="w-full px-3 py-2 bg-[#1a202c] border border-[#2d3748] rounded-lg text-white text-sm focus:outline-none focus:border-[#f6ad55] transition-colors"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Result count */}
            <div className="pt-2 border-t border-[#2d3748]">
              <div className="text-center text-sm text-[#a0aec0]">
                {filteredEvents.length} {filteredEvents.length === 1 ? "task" : "tasks"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Task List */}
      <div className="flex-1 border border-[#2d3748] rounded-lg overflow-hidden bg-[#1a202c]">
        {sortedDates.length === 0 ? (
          <div className="h-full flex items-center justify-center p-12">
            <div className="text-center">
              <svg
                className="mx-auto w-16 h-16 text-[#718096] mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div className="text-[#718096] text-lg">No tasks found</div>
              <div className="text-[#718096] text-sm mt-2">
                {hasActiveFilters
                  ? "Try adjusting your filters to see more results."
                  : "Tasks will appear here once you add them to your calendar."}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-[#f6ad55] text-white rounded-lg text-sm font-medium hover:bg-[#fbd38d] transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto max-h-[600px]">
            <div className="divide-y divide-[#2d3748]">
              {sortedDates.map((dateKey) => {
                const dateEvents = eventsByDate[dateKey];
                const date = new Date(dateKey);
                const isTodayDate = isToday(date);
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                const isPast = date < new Date() && !isTodayDate;

                return (
                  <div key={dateKey} className="p-4">
                    {/* Date header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold flex-shrink-0",
                            isSelected && "bg-[#f6ad55] text-white",
                            isTodayDate && !isSelected && "border-2 border-[#f6ad55] text-white",
                            !isSelected && !isTodayDate && "bg-[#2d3748] text-white"
                          )}
                        >
                          {format(date, "d")}
                        </div>
                        <div>
                          <div className="text-white font-semibold">
                            {format(date, "EEEE")}
                          </div>
                          <div className="text-xs text-[#a0aec0]">
                            {format(date, "MMMM yyyy")}
                            {isTodayDate && <span className="ml-2 text-[#f6ad55]">(Today)</span>}
                            {isPast && <span className="ml-2 text-[#f56565]">(Past)</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-[#718096] bg-[#252f3f] px-3 py-1 rounded-full">
                        {dateEvents.length} {dateEvents.length === 1 ? "task" : "tasks"}
                      </div>
                    </div>

                    {/* Events list */}
                    <div className="space-y-2">
                      {dateEvents.map((event) => {
                        const isOverdue = !isToday(date) && date < new Date() && event.status !== "done" && event.status !== "cancelled";

                        return (
                          <div
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                              "hover:bg-[#252f3f]",
                              event.status === "done" && "opacity-50",
                              event.status === "cancelled" && "opacity-50"
                            )}
                            style={{
                              borderLeft: `4px solid ${getEventColor(event)}`,
                            }}
                          >
                            {/* Status indicator */}
                            <div className="flex-shrink-0">
                              {event.status === "done" ? (
                                <div className="w-6 h-6 rounded-full bg-[#48bb78] flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : event.status === "in-progress" ? (
                                <div className="w-6 h-6 rounded-full bg-[#ed8936] flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              ) : (
                                <div
                                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                                  style={{ borderColor: getEventColor(event) }}
                                >
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getEventColor(event) }} />
                                </div>
                              )}
                            </div>

                            {/* Time */}
                            <div className="w-16 text-sm text-[#a0aec0] flex-shrink-0">
                              {format(event.date, "h:mm a")}
                            </div>

                            {/* Event details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-white">
                                  {event.title}
                                </span>
                                {/* Priority badge */}
                                {event.priority && (
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded text-xs font-medium",
                                      event.priority === "urgent" && "bg-red-900/50 text-red-300 border border-red-700",
                                      event.priority === "high" && "bg-orange-900/50 text-orange-300 border border-orange-700",
                                      event.priority === "medium" && "bg-yellow-900/50 text-yellow-300 border border-yellow-700",
                                      event.priority === "low" && "bg-gray-700/50 text-gray-300 border border-gray-600"
                                    )}
                                  >
                                    {event.priority}
                                  </span>
                                )}
                                {/* Overdue badge */}
                                {isOverdue && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-300 border border-red-700">
                                    Overdue
                                  </span>
                                )}
                                {/* Type badge */}
                                {event.type && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#2d3748] text-[#a0aec0]">
                                    {event.type}
                                  </span>
                                )}
                              </div>
                              {event.description && (
                                <div className="text-sm text-[#a0aec0] mt-1 line-clamp-2">
                                  {event.description}
                                </div>
                              )}
                              {event.location && (
                                <div className="text-xs text-[#718096] mt-1 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {event.location}
                                </div>
                              )}
                            </div>

                            {/* Chevron */}
                            <svg className="w-5 h-5 text-[#718096] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Month View Component
// ============================================================================

interface MonthViewProps {
  currentDate: Date;
  selectedDate?: Date;
  events?: CalendarEvent[];
  highlightedDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
  onSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

function MonthView({
  currentDate,
  selectedDate,
  events = [],
  highlightedDates = [],
  minDate,
  maxDate,
  onSelect,
  onEventClick,
}: MonthViewProps) {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const key = format(event.date, "yyyy-MM-dd");
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });
    return groups;
  }, [events]);

  return (
    <div>
      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day, index) => (
          <WeekDayHeader key={day} day={day} index={index} />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date) => (
          <MonthDay
            key={date.toString()}
            date={date}
            currentMonth={currentDate}
            selectedDate={selectedDate}
            events={groupedEvents[format(date, "yyyy-MM-dd")] || []}
            highlightedDates={highlightedDates}
            minDate={minDate}
            maxDate={maxDate}
            onSelect={onSelect}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Calendar Component
// ============================================================================

export function UniversalCalendar({
  events = [],
  selectedDate,
  onDateSelect,
  onEventClick,
  onMonthChange,
  className,
  variant = "default",
  minDate,
  maxDate,
  highlightedDates = [],
  renderEvent,
}: UniversalCalendarProps) {
  const [currentView, setCurrentView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate || new Date());

  const handlePrevious = () => {
    let newDate: Date;
    switch (currentView) {
      case "month":
        newDate = subMonths(currentDate, 1);
        break;
      case "week":
        newDate = addDays(currentDate, -7);
        break;
      case "day":
        newDate = addDays(currentDate, -1);
        break;
      case "agenda":
        newDate = subMonths(currentDate, 1);
        break;
    }
    setCurrentDate(newDate);
    if (onMonthChange) onMonthChange(newDate);
  };

  const handleNext = () => {
    let newDate: Date;
    switch (currentView) {
      case "month":
        newDate = addMonths(currentDate, 1);
        break;
      case "week":
        newDate = addDays(currentDate, 7);
        break;
      case "day":
        newDate = addDays(currentDate, 1);
        break;
      case "agenda":
        newDate = addMonths(currentDate, 1);
        break;
    }
    setCurrentDate(newDate);
    if (onMonthChange) onMonthChange(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (onMonthChange) onMonthChange(today);
    if (onDateSelect) onDateSelect(today);
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    if (onDateSelect) onDateSelect(date);
  };

  const renderView = () => {
    switch (currentView) {
      case "month":
        return (
          <MonthView
            currentDate={currentDate}
            selectedDate={selectedDate}
            events={events}
            highlightedDates={highlightedDates}
            minDate={minDate}
            maxDate={maxDate}
            onSelect={handleDateSelect}
            onEventClick={onEventClick}
          />
        );
      case "week":
        return (
          <WeekView
            currentDate={currentDate}
            selectedDate={selectedDate}
            events={events}
            minDate={minDate}
            maxDate={maxDate}
            onSelect={handleDateSelect}
            onEventClick={onEventClick}
          />
        );
      case "day":
        return (
          <DayView
            currentDate={currentDate}
            selectedDate={selectedDate}
            events={events}
            onSelect={handleDateSelect}
            onEventClick={onEventClick}
          />
        );
      case "agenda":
        return (
          <AgendaView
            currentDate={currentDate}
            selectedDate={selectedDate}
            events={events}
            onEventClick={onEventClick}
          />
        );
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <CalendarHeader
        currentView={currentView}
        currentDate={currentDate}
        onViewChange={setCurrentView}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
      />

      {/* Main content */}
      {renderView()}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#4299e1]" />
          <span className="text-[#a0aec0]">Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#9f7aea]" />
          <span className="text-[#a0aec0]">Campaigns</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#48bb78]" />
          <span className="text-[#a0aec0]">Meetings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#38b2ac]" />
          <span className="text-[#a0aec0]">Calls</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ed64a6]" />
          <span className="text-[#a0aec0]">Emails</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ed8936]" />
          <span className="text-[#a0aec0]">Reminders</span>
        </div>
      </div>
    </div>
  );
}

// Re-export as default for convenience
export default UniversalCalendar;
