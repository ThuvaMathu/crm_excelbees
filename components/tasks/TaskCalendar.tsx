"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UniversalCalendar, CalendarEvent } from "@/components/calendar";
import type { Task } from "@/types/crm";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Phone,
  Mail,
  Users,
  CalendarDays,
} from "lucide-react";
import { isToday, isPast, startOfDay } from "date-fns";

interface TaskCalendarProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

const safeToDate = (date: any): Date => {
  if (typeof date?.toDate === "function") return date.toDate();
  if (date instanceof Date) return date;
  if (typeof date === "object" && typeof date.seconds === "number")
    return new Date(date.seconds * 1000);
  if (typeof date === "string") return new Date(date);
  return new Date();
};

export function TaskCalendar({ tasks, onSelectTask }: TaskCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Convert tasks to calendar events
  const events: CalendarEvent[] = useMemo(
    () =>
      tasks
        .filter((task) => task.dueDate)
        .map((task) => {
          let eventType: CalendarEvent["type"] = "task";
          if (task.type === "Meeting") eventType = "meeting";
          else if (task.type === "Call") eventType = "call";
          else if (task.type === "Email") eventType = "email";

          let eventStatus: CalendarEvent["status"] = "todo";
          if (task.status === "In Progress") eventStatus = "in-progress";
          else if (task.status === "Done") eventStatus = "done";

          return {
            id: task.id,
            title: task.title,
            date: safeToDate(task.dueDate),
            type: eventType,
            status: eventStatus,
            priority: task.priority?.toLowerCase() as CalendarEvent["priority"],
            color:
              task.priority === "High" || task.priority === "Urgent"
                ? "#EF4444"
                : task.priority === "Medium"
                  ? "#F59E0B"
                  : "#10B981",
          };
        }),
    [tasks]
  );

  // Compute stats
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "Done").length;
    const overdue = tasks.filter((t) => {
      if (t.status === "Done") return false;
      if (!t.dueDate) return false;
      const d = safeToDate(t.dueDate);
      return isPast(d) && !isToday(d);
    }).length;
    const dueToday = tasks.filter((t) => {
      if (t.status === "Done") return false;
      if (!t.dueDate) return false;
      return isToday(safeToDate(t.dueDate));
    }).length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    return { total, done, overdue, dueToday, inProgress };
  }, [tasks]);

  const handleEventClick = (event: CalendarEvent) => {
    const task = tasks.find((t) => t.id === event.id);
    if (task) onSelectTask(task);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-slate-200 dark:border-slate-700/50 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <ListTodo className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700/50 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <CalendarDays className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Due Today</p>
              <p className="text-lg font-bold">{stats.dueToday}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700/50 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-slate-900/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
              <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-lg font-bold">{stats.inProgress}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700/50 bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-slate-900/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700/50 bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-slate-900/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-bold">{stats.done}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <UniversalCalendar
            events={events}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            variant="tasks"
          />
        </CardContent>

        {/* Legend */}
        <div className="border-t border-slate-200 dark:border-slate-700/50 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground mr-1">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> High / Urgent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low
            </span>
            <span className="mx-2 text-slate-300 dark:text-slate-600">|</span>
            <span className="flex items-center gap-1.5">
              <ListTodo className="h-3 w-3" /> Task
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3 w-3" /> Meeting
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" /> Call
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> Email
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default TaskCalendar;
