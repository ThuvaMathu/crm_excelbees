import * as z from "zod";

export const projectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["Planning", "Active", "On Hold", "Completed", "Cancelled"]),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  startDate: z.date(),
  endDate: z.date().optional(),
  budget: z.number().min(0).optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  teamMembers: z.array(z.string()).default([]),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
