import * as z from "zod";
import { coerceTimestamp, coerceTimestampOptional } from "./date-coerce";

export const invoiceLineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be non-negative"),
  total: z.number().min(0),
});

export const invoiceSchema = z.object({
  // Deliberately not required: InvoiceForm leaves this blank on creation by
  // design (comment there: "will be generated server-side on save") and
  // createInvoice() (lib/firestore/invoices.ts) fills in a sequential
  // number as a post-validation fallback when it arrives empty. Requiring
  // a non-empty string here blocked that fallback from ever running —
  // both react-hook-form's client-side resolver and createInvoice()'s own
  // safeParse() call happen *before* the fallback code, so every new
  // invoice failed validation on this field alone, silently (no toast:
  // react-hook-form's handleSubmit just declines to call the submit
  // callback when client-side validation fails).
  invoiceNumber: z.string().optional(),
  template: z.enum(["standard", "professional", "creative"]),
  status: z.enum(["Draft", "Sent", "Paid", "Overdue", "Cancelled"]),

  // Client Info
  companyId: z.string().optional(),
  companyName: z.string().min(1, "Client name is required"),
  contactId: z.string().optional(),
  contactName: z.string().optional(),
  clientEmail: z.union([z.string().email("Invalid client email"), z.literal("")]).optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),

  // Relationships
  dealId: z.string().optional(),
  dealName: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),

  // Dates
  issueDate: coerceTimestamp(),
  dueDate: coerceTimestamp(),

  // Financials
  currency: z.string().default("USD"),
  paymentTerms: z.enum(["Due on Receipt", "Net 15", "Net 30", "Net 60", "Custom"]),
  lineItems: z.array(invoiceLineItemSchema).min(1, "At least one item is required"),

  // Calculations
  subtotal: z.number(),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number(),
  discount: z.number().min(0),
  total: z.number(),

  // Metadata
  notes: z.string().optional(),
  terms: z.string().optional(),

  // Recurring
  isRecurring: z.boolean().default(false).optional(),
  recurring: z.object({
      frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
      interval: z.number().min(1),
      startDate: coerceTimestamp(),
      endDate: coerceTimestampOptional(),
      status: z.enum(["active", "paused", "ended"]).default("active")
  }).optional().nullable(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
