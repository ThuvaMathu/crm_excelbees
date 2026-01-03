import type { Invoice } from "@/types/crm";
import { format } from "date-fns";

export interface InvoiceEmailTemplate {
  subject: string;
  body: string;
}

/**
 * Generate professional email template for invoice
 * @param invoice - Invoice to generate template for
 * @param companyName - Company name from user settings or default
 * @param fromName - Sender name from user settings
 * @returns Email template with subject and body
 */
export function generateInvoiceEmailTemplate(
  invoice: Invoice,
  companyName: string = "Your Company",
  fromName?: string
): InvoiceEmailTemplate {
  const subject = `Invoice #${invoice.invoiceNumber} from ${companyName}`;

  const body = `Dear ${invoice.contactName || "Valued Customer"},

Please find attached invoice #${invoice.invoiceNumber} for your review.

Invoice Details:
• Invoice Number: ${invoice.invoiceNumber}
• Invoice Date: ${format(invoice.issueDate.toDate(), "MMMM dd, yyyy")}
• Due Date: ${format(invoice.dueDate.toDate(), "MMMM dd, yyyy")}
• Amount Due: ${invoice.currency} ${invoice.total.toFixed(2)}
• Payment Terms: ${invoice.paymentTerms}

${invoice.notes ? `\nAdditional Notes:\n${invoice.notes}\n` : ""}
${invoice.terms ? `\nTerms & Conditions:\n${invoice.terms}\n` : ""}
If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your business!

Best regards,${fromName ? `\n${fromName}` : ""}
${companyName}`;

  return { subject, body };
}

/**
 * Generate plain text version for email body
 */
export function generatePlainTextVersion(body: string): string {
  return body
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown
    .replace(/__(.*?)__/g, "$1") // Remove italic markdown
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .trim();
}
