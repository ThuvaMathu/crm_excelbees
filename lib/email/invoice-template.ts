import type { Invoice } from "@/types/crm";

function safeFormatDate(value: any): string {
  if (!value) return "N/A";
  // Firestore Timestamp
  if (typeof value?.toDate === "function") return value.toDate().toLocaleDateString();
  // Already a Date object
  if (value instanceof Date) return value.toLocaleDateString();
  // ISO string or other string
  if (typeof value === "string") return new Date(value).toLocaleDateString();
  // Seconds-based object (serialized Timestamp: { seconds, nanoseconds })
  if (typeof value === "object" && value.seconds) return new Date(value.seconds * 1000).toLocaleDateString();
  return String(value);
}

export function generateInvoiceEmailHtml(
  invoice: Invoice,
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  }
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .invoice-details { background-color: #fff; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .invoice-details table { width: 100%; }
          .invoice-details td { padding: 8px 0; }
          .invoice-details td:first-child { font-weight: bold; width: 40%; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; color: #2c3e50;">Invoice ${invoice.invoiceNumber}</h2>
            <p style="margin: 5px 0 0 0; color: #6c757d;">From ${companyInfo?.name || "Your Company"}</p>
          </div>
          
          <p>Dear ${invoice.contactName || "Valued Customer"},</p>
          
          <p>Please find attached invoice <strong>${invoice.invoiceNumber}</strong> for your review.</p>
          
          <div class="invoice-details">
            <table>
              <tr>
                <td>Invoice Number:</td>
                <td>${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td>Invoice Date:</td>
                <td>${safeFormatDate(invoice.issueDate)}</td>
              </tr>
              <tr>
                <td>Due Date:</td>
                <td>${safeFormatDate(invoice.dueDate)}</td>
              </tr>
              <tr>
                <td>Amount Due:</td>
                <td><strong>${invoice.currency} ${invoice.total.toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td>Payment Terms:</td>
                <td>${invoice.paymentTerms}</td>
              </tr>
            </table>
          </div>
          
          <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
          
          <p>Thank you for your business!</p>
          
          <div class="footer">
            <p><strong>${companyInfo?.name || "Your Company"}</strong></p>
            ${companyInfo?.address ? `<p>${companyInfo.address}</p>` : ""}
            ${companyInfo?.phone ? `<p>Phone: ${companyInfo.phone}</p>` : ""}
            ${companyInfo?.email ? `<p>Email: ${companyInfo.email}</p>` : ""}
          </div>
        </div>
      </body>
    </html>
  `;
}
