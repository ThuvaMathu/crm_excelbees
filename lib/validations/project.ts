import * as z from "zod";

export const projectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["Planning", "Development", "Active", "On Hold", "Completed", "Management", "Cancelled"]),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  startDate: z.date(),
  endDate: z.date().optional(),
  
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

export type ProjectFormData = z.infer<typeof projectSchema>;
