import { Plan, Calendar, RecurringConfig } from "@/types/calendar";

/**
 * Generate a unique plan ID
 */
export function generatePlanId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique calendar ID
 */
export function generateCalendarId(): string {
  return `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate duration in minutes between start and end dates
 */
export function calculatePlanDuration(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Check if a plan has recurrence configured
 */
export function isRecurringPlan(plan: Plan): boolean {
  return plan.recurring?.enabled === true;
}

/**
 * Calculate the next occurrence for a recurring plan
 */
export function getNextOccurrence(
  plan: Plan,
  fromDate: Date = new Date()
): Date | null {
  if (!isRecurringPlan(plan) || !plan.recurring) return null;

  const { frequency, interval, endType, endDate, endOccurrences } =
    plan.recurring;

  let nextDate = new Date(fromDate);

  switch (frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + interval * 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
  }

  // Check if we've exceeded the end conditions
  if (endType === "date" && endDate && nextDate > endDate) {
    return null;
  }

  return nextDate;
}

/**
 * Filter plans by date range
 */
export function filterPlansByDateRange(
  plans: Plan[],
  startDate: Date,
  endDate: Date
): Plan[] {
  return plans.filter((plan) => {
    const planStart = new Date(plan.start);
    const planEnd = new Date(plan.end);
    return planStart <= endDate && planEnd >= startDate;
  });
}

/**
 * Group plans by date for agenda view
 */
export function groupPlansByDate(plans: Plan[]): Record<string, Plan[]> {
  const grouped: Record<string, Plan[]> = {};

  plans.forEach((plan) => {
    const dateKey = new Date(plan.start).toISOString().split("T")[0];
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(plan);
  });

  // Sort plans within each date by start time
  Object.keys(grouped).forEach((dateKey) => {
    grouped[dateKey].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  });

  return grouped;
}

/**
 * Export plans to ICS (iCal) format
 */
export function exportToICS(plans: Plan[], calendarName: string): string {
  const icsLines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Excel Bees//Marketing Calendar//EN",
    `X-WR-CALNAME:${calendarName}`,
    "X-WR-TIMEZONE:UTC",
  ];

  plans.forEach((plan) => {
    const start = new Date(plan.start);
    const end = new Date(plan.end);

    icsLines.push("BEGIN:VEVENT");
    icsLines.push(`UID:${plan.id}`);
    icsLines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    icsLines.push(`DTSTART:${formatICSDate(start)}`);
    icsLines.push(`DTEND:${formatICSDate(end)}`);
    icsLines.push(`SUMMARY:${escapeICSText(plan.title)}`);

    if (plan.description) {
      icsLines.push(`DESCRIPTION:${escapeICSText(plan.description)}`);
    }

    if (plan.tags.length > 0) {
      icsLines.push(`CATEGORIES:${plan.tags.join(",")}`);
    }

    icsLines.push(`STATUS:${plan.status.toUpperCase()}`);
    icsLines.push(`PRIORITY:${getPriorityNumber(plan.priority)}`);
    icsLines.push("END:VEVENT");
  });

  icsLines.push("END:VCALENDAR");
  return icsLines.join("\r\n");
}

/**
 * Format date for ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Escape text for ICS format
 */
function escapeICSText(text: string): string {
  return text.replace(/[\\,;]/g, "\\$&").replace(/\n/g, "\\n");
}

/**
 * Convert priority to ICS priority number (1-9)
 */
function getPriorityNumber(priority: string): number {
  const map: Record<string, number> = {
    urgent: 1,
    high: 3,
    medium: 5,
    low: 7,
  };
  return map[priority] || 5;
}

/**
 * Export plans to CSV format
 */
export function exportToCSV(plans: Plan[]): string {
  const headers = [
    "Title",
    "Type",
    "Start Date",
    "End Date",
    "Priority",
    "Status",
    "Tags",
    "Description",
  ];

  const rows = plans.map((plan) => [
    plan.title,
    plan.type,
    new Date(plan.start).toLocaleString(),
    new Date(plan.end).toLocaleString(),
    plan.priority,
    plan.status,
    plan.tags.join("; "),
    plan.description || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}

/**
 * Clean object by removing undefined values (for Firestore)
 */
export function cleanObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => cleanObject(v)).filter((v) => v !== undefined);
  } else if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, cleanObject(v)])
        .filter(([_, v]) => v !== undefined)
    );
  }
  return obj;
}

/**
 * Get plan icon emoji based on type
 */
export function getPlanIcon(type: string): string {
  const icons: Record<string, string> = {
    task: "📝",
    content: "📄",
    meeting: "💼",
    reminder: "🔔",
    campaign: "🎯",
    custom: "⚙️",
  };
  return icons[type] || "📌";
}

/**
 * Get priority color class
 */
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    urgent: "text-red-600 bg-red-50",
    high: "text-orange-600 bg-orange-50",
    medium: "text-yellow-600 bg-yellow-50",
    low: "text-green-600 bg-green-50",
  };
  return colors[priority] || colors.medium;
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planned: "text-blue-600 bg-blue-50",
    in_progress: "text-purple-600 bg-purple-50",
    completed: "text-green-600 bg-green-50",
    skipped: "text-gray-600 bg-gray-50",
  };
  return colors[status] || colors.planned;
}

/**
 * Format date for display
 */
export function formatPlanDate(date: Date, includeTime: boolean = true): string {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!includeTime) return dateStr;

  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateStr} at ${timeStr}`;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  const d = new Date(date);
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Get week number
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
