import * as z from "zod";
import { coerceTimestamp, coerceTimestampOptional } from "./date-coerce";

const projectPhaseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Phase name is required"),
  description: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  order: z.number().min(0),
});

export const projectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["Planning", "Development", "Active", "On Hold", "Completed", "Management", "Cancelled"]),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  scope: z.string().min(10, "Define the project scope (min 10 characters)"),
  phases: z.array(projectPhaseSchema).min(1, "At least one project phase is required"),
  startDate: coerceTimestamp(),
  endDate: coerceTimestampOptional(),

  lifecycle: z.enum(["active", "maintenance"]).default("active"),

  // Financials
  initialCost: z.number().min(0).optional(),
  annualRecurringCost: z.number().min(0).optional(),
  managementBillingCycle: z.enum(["Quarterly", "Semi-Annual", "None"]).optional(),
  isRecurringEnabled: z.boolean().default(false),

  // Notification Settings
  notificationsEnabled: z.boolean().default(true),
  emailNotificationsEnabled: z.boolean().default(true),

  budget: z.number().min(0).optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  teamMembers: z.array(z.string()).default([]),
});

export type ProjectFormData = z.output<typeof projectSchema>;
export type ProjectFormInput = z.input<typeof projectSchema>;
