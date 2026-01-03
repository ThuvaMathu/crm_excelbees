import * as z from "zod";

export const invoiceLineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be non-negative"),
  total: z.number().min(0),
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  template: z.enum(["standard", "project", "recurring"]),
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
  issueDate: z.date(),
  dueDate: z.date(),

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
      startDate: z.date(),
      endDate: z.date().optional(),
      status: z.enum(["active", "paused", "ended"]).default("active")
  }).optional().nullable(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
