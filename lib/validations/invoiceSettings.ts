import { z } from "zod";

// Org-level invoice settings (admin-only — see
// app/org/[orgId]/settings/invoices/page.tsx). Deliberately excludes
// template (the picker was inert — only one PDF design exists),
// companyName (always the org's own name, not separately editable),
// fromName/fromEmail (always the actual sending user, resolved at send
// time), and logoUrl (managed separately via Organization.logoUrl).
export const invoiceOrgSettingsSchema = z.object({
  colorTheme: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  invoicePrefix: z.string().max(10, "Prefix too long").default("INV-"),
  nextInvoiceNumber: z.number().int().min(0).optional().default(1),

  // Payment Details (optional)
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  ifsc: z.string().optional(),
  upiId: z.string().optional(),
  gstin: z.string().optional(),
});

export type InvoiceOrgSettingsFormData = z.infer<typeof invoiceOrgSettingsSchema>;
