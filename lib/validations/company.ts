import { z } from "zod";

// Every optional field also accepts `null`, not just `undefined`/`""`.
// createCompany() (lib/firestore/companies.ts) re-validates the *write*
// payload with this same schema after CreateCompanyDialog has already
// converted every empty field to `null` (Firestore rejects `undefined`).
// `.optional()` alone only permits `undefined` — without `.nullable()`,
// that second validation pass rejected every field a user left blank
// with "Invalid input: expected string, received null", so creating a
// company with any empty optional field failed outright, silently
// (a wall of stacked Zod messages in one toast, no console error).
export const companySchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  email: z.string().email("Invalid company email").optional().nullable().or(z.literal("")),
  domain: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  size: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]).optional().nullable(),
  annualRevenue: z.number().min(0, "Revenue must be positive").optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
  // Address fields
  billingStreet: z.string().optional().nullable(),
  billingCity: z.string().optional().nullable(),
  billingState: z.string().optional().nullable(),
  billingZipCode: z.string().optional().nullable(),
  billingCountry: z.string().optional().nullable(),
});

export type CompanyFormData = z.infer<typeof companySchema>;
