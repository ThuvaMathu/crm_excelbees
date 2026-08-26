export type CalendarPurpose =
  | "personal"
  | "team"
  | "content"
  | "campaign"
  | "business"
  | "project"
  | "custom";

export type CalendarView = "daily" | "weekly" | "monthly" | "agenda";

export type CalendarVisibility = "private" | "team" | "organization";

export type PlanType =
  | "task"
  | "content"
  | "meeting"
  | "reminder"
  | "campaign"
  | "custom";

export type Priority = "low" | "medium" | "high" | "urgent";

export type PlanStatus = "planned" | "in_progress" | "completed" | "skipped";

export interface CalendarSettings {
  startOfWeek: "sunday" | "monday";
  workingHours: { start: string; end: string };
  timezone: string;
  enableRecurring: boolean;
  defaultRecurrence?: "none" | "daily" | "weekly" | "monthly";
  emailReminders: boolean;
  inAppNotifications: boolean;
  reminderTiming: number; // minutes before
}

export interface Calendar {
  id: string;
  userId: string;
  name: string;
  purpose: CalendarPurpose;
  description?: string;
  defaultView: CalendarView;
  visibility: CalendarVisibility;
  color: string;
  planTypes: PlanType[];
  settings: CalendarSettings;
  createdAt: Date;
  updatedAt: Date;
  activePlansCount: number;
  isArchived: boolean;
}

export interface RecurringConfig {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  interval: number; // repeat every X days/weeks/months
  endType: "never" | "date" | "occurrences";
  endDate?: Date;
  endOccurrences?: number;
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export interface PlanMetadata {
  // For Content Plans
  contentType?: "blog" | "social" | "email" | "video" | "other";
  platforms?: string[];
  linkedKeyword?: string;

  // For Meetings
  location?: string;
  attendees?: string[];
  meetingLink?: string;
  sendInvites?: boolean;

  // For Reminders
  reminderType?: "email" | "in_app" | "push";
  reminderTime?: number; // minutes before

  // For Campaigns
  campaignName?: string;
  budget?: number;
  targetAudience?: string;
  expectedOutcome?: string;
}

export interface Plan {
  id: string;
  calendarId: string;
  userId: string;
  title: string;
  description?: string;
  type: PlanType;
  start: Date;
  end: Date;
  allDay: boolean;
  priority: Priority;
  status: PlanStatus;
  tags: string[];
  assignedTo?: string;
  recurring?: RecurringConfig;
  dependencies?: string[]; // Plan IDs this plan depends on
  attachments?: Attachment[];
  checklist?: ChecklistItem[];
  metadata?: PlanMetadata;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  activityLog?: ActivityLogEntry[];
}

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  userId: string;
  details?: string;
}

export interface CalendarTemplate {
  id: string;
  name: string;
  description: string;
  category: "content" | "business" | "personal" | "campaign" | "custom";
  duration: number; // days
  planCount: number;
  frequency: string;
  isPreBuilt: boolean;
  userId?: string; // undefined for pre-built templates
  plans: Omit<Plan, "id" | "calendarId" | "userId" | "createdAt" | "updatedAt">[];
  createdAt: Date;
  usedCount: number;
}

export interface AIGenerateRequest {
  calendarId: string;
  userId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  purpose: "content" | "business" | "campaign" | "productivity" | "mixed";
  businessContext?: {
    industry: string;
    goal: "growth" | "consistency" | "launch" | "efficiency";
  };
  frequency: "daily" | "weekdays" | "3x_week" | "2x_week" | "custom";
  customFrequency?: number;
  distribution: {
    tasks: number; // percentage
    content: number;
    meetings: number;
    other: number;
  };
}

export interface ExportOptions {
  format: "ics" | "csv" | "json" | "pdf";
  calendarId: string;
  userId: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  pdfOptions?: {
    colorTheme: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
  };
}
