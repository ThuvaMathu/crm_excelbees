import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice } from "@/types/crm";
import { format } from "date-fns";

export function generateInvoicePDF(invoice: Invoice, companyInfo?: {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}): jsPDF {
  const doc = new jsPDF();
  
  // Company Logo/Header
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Company Info (Top Left)
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companyInfo?.name || "Your Company", 20, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (companyInfo?.address) {
    doc.text(companyInfo.address, 20, 28);
  }
  if (companyInfo?.phone) {
    doc.text(`Phone: ${companyInfo.phone}`, 20, 34);
  }
  if (companyInfo?.email) {
    doc.text(`Email: ${companyInfo.email}`, 20, 40);
  }

  // Invoice Title (Top Right)
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 20, 20, { align: "right" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`#${invoice.invoiceNumber}`, pageWidth - 20, 28, { align: "right" });
  
  // Status Badge
  const statusColors: Record<string, [number, number, number]> = {
    Draft: [200, 200, 200],
    Sent: [59, 130, 246],
    Paid: [34, 197, 94],
    Overdue: [239, 68, 68],
    Cancelled: [107, 114, 128],
  };
  
  const statusColor = statusColors[invoice.status] || [200, 200, 200];
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - 45, 32, 25, 6, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(invoice.status.toUpperCase(), pageWidth - 32.5, 36, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Bill To Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 20, 55);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let yPos = 62;
  if (invoice.companyName) {
    doc.text(invoice.companyName, 20, yPos);
    yPos += 6;
  }
  if (invoice.contactName) {
    doc.text(invoice.contactName, 20, yPos);
    yPos += 6;
  }
  if (invoice.billingAddress) {
    const addressLines = doc.splitTextToSize(invoice.billingAddress, 80);
    doc.text(addressLines, 20, yPos);
    yPos += addressLines.length * 6;
  }
  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, 20, yPos);
  }

  // Invoice Details (Right Side)
  doc.setFontSize(10);
  const detailsX = pageWidth - 70;
  let detailsY = 55;
  
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Date:", detailsX, detailsY);
  doc.setFont("helvetica", "normal");
  doc.text(format(invoice.issueDate.toDate(), "MMM dd, yyyy"), detailsX + 35, detailsY);
  detailsY += 6;
  
  doc.setFont("helvetica", "bold");
  doc.text("Due Date:", detailsX, detailsY);
  doc.setFont("helvetica", "normal");
  doc.text(format(invoice.dueDate.toDate(), "MMM dd, yyyy"), detailsX + 35, detailsY);
  detailsY += 6;
  
  doc.setFont("helvetica", "bold");
  doc.text("Payment Terms:", detailsX, detailsY);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.paymentTerms, detailsX + 35, detailsY);
  detailsY += 6;
  
  if (invoice.dealName) {
    doc.setFont("helvetica", "bold");
    doc.text("Deal:", detailsX, detailsY);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.dealName, detailsX + 35, detailsY);
    detailsY += 6;
  }

  // Line Items Table
  const tableStartY = Math.max(yPos + 10, detailsY + 10);
  
  autoTable(doc, {
    startY: tableStartY,
    head: [["Description", "Qty", "Price", "Tax", "Total"]],
    body: invoice.lineItems.map((item) => [
      item.description,
      item.quantity.toString(),
      `${invoice.currency} ${item.price.toFixed(2)}`,
      `${item.taxRate}%`,
      `${invoice.currency} ${item.total.toFixed(2)}`,
    ]),
    theme: "striped",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 30, halign: "right" },
    },
  });

  // Totals Section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalsX = pageWidth - 70;
  let totalsY = finalY;

  doc.setFontSize(10);
  
  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", totalsX, totalsY);
  doc.text(`${invoice.currency} ${invoice.subtotal.toFixed(2)}`, totalsX + 50, totalsY, { align: "right" });
  totalsY += 6;
  
  // Tax
  doc.text(`Tax (${invoice.taxRate}%):`, totalsX, totalsY);
  doc.text(`${invoice.currency} ${invoice.taxAmount.toFixed(2)}`, totalsX + 50, totalsY, { align: "right" });
  totalsY += 6;
  
  // Discount
  if (invoice.discount > 0) {
    doc.text("Discount:", totalsX, totalsY);
    doc.text(`-${invoice.currency} ${invoice.discount.toFixed(2)}`, totalsX + 50, totalsY, { align: "right" });
    totalsY += 6;
  }
  
  // Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", totalsX, totalsY);
  doc.text(`${invoice.currency} ${invoice.total.toFixed(2)}`, totalsX + 50, totalsY, { align: "right" });

  // Notes
  if (invoice.notes) {
    totalsY += 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 20, totalsY);
    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 40);
    doc.text(notesLines, 20, totalsY + 6);
    totalsY += notesLines.length * 6 + 6;
  }

  // Terms
  if (invoice.terms) {
    totalsY += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions:", 20, totalsY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const termsLines = doc.splitTextToSize(invoice.terms, pageWidth - 40);
    doc.text(termsLines, 20, totalsY + 6);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Generated on ${format(new Date(), "MMM dd, yyyy")}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  return doc;
}

export function downloadInvoicePDF(invoice: Invoice, companyInfo?: any) {
  const doc = generateInvoicePDF(invoice, companyInfo);
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
}

export function getInvoicePDFBlob(invoice: Invoice, companyInfo?: any): Blob {
  const doc = generateInvoicePDF(invoice, companyInfo);
  return doc.output("blob");
}
