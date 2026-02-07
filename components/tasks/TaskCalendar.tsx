"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { UniversalCalendar, CalendarEvent } from "@/components/calendar";
import type { Task } from "@/types/crm";

interface TaskCalendarProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export function TaskCalendar({ tasks, onSelectTask }: TaskCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Convert tasks to calendar events
  const events: CalendarEvent[] = tasks
    .filter((task) => task.dueDate)
    .map((task) => {
      // Map task type to calendar event type
      let eventType: CalendarEvent["type"] = "task";
      if (task.type === "Meeting") eventType = "meeting";
      else if (task.type === "Call") eventType = "call";
      else if (task.type === "Email") eventType = "email";

      // Map task status to calendar event status
      let eventStatus: CalendarEvent["status"] = "todo";
      if (task.status === "In Progress") eventStatus = "in-progress";
      else if (task.status === "Done") eventStatus = "done";

      return {
        id: task.id,
        title: task.title,
        date: task.dueDate!.toDate(),
        type: eventType,
        status: eventStatus,
        priority: task.priority?.toLowerCase() as CalendarEvent["priority"],
        // Use custom color based on priority
        color: task.priority === "High" || task.priority === "Urgent"
          ? "#EF4444"
          : task.priority === "Medium"
            ? "#F59E0B"
            : "#10B981",
      };
    });

  const handleEventClick = (event: CalendarEvent) => {
    // Find the original task and call onSelectTask
    const task = tasks.find((t) => t.id === event.id);
    if (task) {
      onSelectTask(task);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Could filter tasks by selected date or show a "new task" dialog
  };

  return (
    <Card className="p-4 border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20">
      <UniversalCalendar
        events={events}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        onEventClick={handleEventClick}
        variant="tasks"
        className="bg-transparent"
      />
    </Card>
  );
}

export default TaskCalendar;
