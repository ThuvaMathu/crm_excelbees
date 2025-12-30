import { z } from "zod";

export const leadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  jobTitle: z.string().optional(),
  status: z.enum(["New", "Contacted", "Follow Up", "Qualified", "Lost"]),
  source: z.enum(["Website", "Referral", "Ads", "Cold Call", "Other"]),
  value: z.number().min(0, "Value must be positive").optional().or(z.literal("")),
  tags: z.array(z.string()),
  notes: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;
