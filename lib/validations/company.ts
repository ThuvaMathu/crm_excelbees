import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid company email").optional().or(z.literal("")),
  domain: z.string().optional(),
  industry: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  size: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]).optional(),
  annualRevenue: z.number().min(0, "Revenue must be positive").optional().or(z.literal("")),
  notes: z.string().optional(),
  // Address fields
  billingStreet: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZipCode: z.string().optional(),
  billingCountry: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;
