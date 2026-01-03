import { z } from "zod";

export const invoiceUserSettingsSchema = z.object({
  template: z.enum(["standard", "professional", "creative"]),
  companyName: z.string().min(1, "Company name is required"),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("Invalid email address"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  colorTheme: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  invoicePrefix: z.string().max(10, "Prefix too long").default("INV-"),
  nextInvoiceNumber: z.number().int().min(1).optional().default(1),
});

export type InvoiceUserSettingsFormData = z.infer<typeof invoiceUserSettingsSchema>;
