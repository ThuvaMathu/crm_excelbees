import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice, InvoiceUserSettings } from "@/types/crm";
import { format } from "date-fns";
import { getUserInvoiceSettings } from "@/lib/firestore/users";

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ]
    : [59, 130, 246]; // Default blue
}

// Helper function to load image as base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    // Use cors mode for cross-origin requests
    const response = await fetch(url, {
      mode: 'cors',
      cache: 'no-cache',
    });

    if (!response.ok) {
      console.warn(`Failed to load image: ${response.status} ${response.statusText}`);
      return null;
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => {
        console.warn("FileReader error while converting image to base64");
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // Silently fail and continue without logo
    console.warn("Could not load logo image:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

export async function generateInvoicePDF(
  invoice: Invoice,
  settings?: InvoiceUserSettings | null,
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  }
): Promise<jsPDF> {
  const doc = new jsPDF();

  // Get theme color from hex
  const themeColor = settings?.colorTheme ? hexToRgb(settings.colorTheme) : hexToRgb("#3B82F6");

  // Company Logo/Header
  const pageWidth = doc.internal.pageSize.getWidth();

  // Add logo if available
  let logoHeight = 0;
  if (settings?.logoUrl) {
    try {
      const logoBase64 = await loadImageAsBase64(settings.logoUrl);
      if (logoBase64) {
        const logoWidth = 40;
        const logoHeightCalc = 20; // Adjust proportionally
        doc.addImage(logoBase64, "PNG", 20, 10, logoWidth, logoHeightCalc);
        logoHeight = logoHeightCalc + 5; // Add padding
      }
    } catch (error) {
      console.error("Failed to add logo to PDF:", error);
    }
  }

  // Get template type
  const template = settings?.template || "standard";

  // Company Info (Top Left) - adjust position if logo is present
  const companyInfoY = logoHeight > 0 ? 10 + logoHeight : 20;

  // Apply template-specific styling
  if (template === "professional") {
    // Professional: Add subtle tinted background to header using theme color
    const lightTint: [number, number, number] = [
      Math.min(255, themeColor[0] + Math.round((255 - themeColor[0]) * 0.9)),
      Math.min(255, themeColor[1] + Math.round((255 - themeColor[1]) * 0.9)),
      Math.min(255, themeColor[2] + Math.round((255 - themeColor[2]) * 0.9)),
    ];
    doc.setFillColor(...lightTint);
    doc.rect(0, 0, pageWidth, 50, "F");
    // Add a thin accent line at top
    doc.setFillColor(...themeColor);
    doc.rect(0, 0, pageWidth, 2, "F");
  } else if (template === "creative") {
    // Creative: Add colored accent bar
    doc.setFillColor(...themeColor);
    doc.rect(0, 0, pageWidth, 5, "F");
  } else {
    // Standard: Add a thin accent line at top
    doc.setFillColor(...themeColor);
    doc.rect(0, 0, pageWidth, 3, "F");
  }

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");

  // Apply theme color to company name for all templates
  doc.setTextColor(...themeColor);
  doc.text(settings?.companyName || companyInfo?.name || "Your Company", 20, companyInfoY);
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const infoStartY = companyInfoY + 8;
  let currentY = infoStartY;

  // Use settings for from info
  if (settings?.fromName) {
    doc.text(settings.fromName, 20, currentY);
    currentY += 6;
  }
  if (settings?.fromEmail) {
    doc.text(`Email: ${settings.fromEmail}`, 20, currentY);
    currentY += 6;
  } else if (companyInfo?.email) {
    doc.text(`Email: ${companyInfo.email}`, 20, currentY);
    currentY += 6;
  }

  // Fallback to companyInfo if no settings
  if (!settings && companyInfo?.address) {
    doc.text(companyInfo.address, 20, currentY);
    currentY += 6;
  }
  if (!settings && companyInfo?.phone) {
    doc.text(`Phone: ${companyInfo.phone}`, 20, currentY);
    currentY += 6;
  }

  // Invoice Title (Top Right)
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");

  // Apply theme color to INVOICE title for all templates
  doc.setTextColor(...themeColor);
  doc.text("INVOICE", pageWidth - 20, 20, { align: "right" });
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`#${invoice.invoiceNumber}`, pageWidth - 20, 28, { align: "right" });

  // Status Badge - ONLY show if invoice is PAID
  if (invoice.status === "Paid") {
    const statusColor: [number, number, number] = [34, 197, 94]; // Green for paid
    doc.setFillColor(...statusColor);
    doc.roundedRect(pageWidth - 45, 32, 25, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("PAID", pageWidth - 32.5, 36, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }

  // Bill To Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...themeColor);
  doc.text("Bill To:", 20, 55);
  doc.setTextColor(0, 0, 0);

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
  const issueDateObj = typeof (invoice.issueDate as any)?.toDate === "function" ? (invoice.issueDate as any).toDate() : new Date(invoice.issueDate as any);
  doc.text(format(issueDateObj, "MMM dd, yyyy"), detailsX + 35, detailsY);
  detailsY += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Due Date:", detailsX, detailsY);
  doc.setFont("helvetica", "normal");
  const dueDateObj = typeof (invoice.dueDate as any)?.toDate === "function" ? (invoice.dueDate as any).toDate() : new Date(invoice.dueDate as any);
  doc.text(format(dueDateObj, "MMM dd, yyyy"), detailsX + 35, detailsY);
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
    theme: template === "professional" ? "grid" : "striped",
    headStyles: {
      fillColor: themeColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: template === "professional" ? 11 : 10,
    },
    styles: {
      fontSize: template === "creative" ? 9 : 10,
      cellPadding: template === "professional" ? 4 : 3,
    },
    alternateRowStyles: {
      fillColor: template === "creative" ? [245, 247, 250] : [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 30, halign: "right", fontStyle: template === "professional" ? "bold" : "normal" },
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
  doc.setTextColor(...themeColor);
  doc.text("Total:", totalsX, totalsY);
  doc.text(`${invoice.currency} ${invoice.total.toFixed(2)}`, totalsX + 50, totalsY, { align: "right" });
  doc.setTextColor(0, 0, 0);

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

export async function downloadInvoicePDF(invoice: Invoice, settings?: InvoiceUserSettings | null, companyInfo?: any) {
  const doc = await generateInvoicePDF(invoice, settings, companyInfo);
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
}

export async function getInvoicePDFBlob(invoice: Invoice, userId?: string, companyInfo?: any): Promise<Blob> {
  // Fetch user settings if userId provided
  let settings: InvoiceUserSettings | null = null;
  if (userId) {
    const result = await getUserInvoiceSettings(userId);
    settings = result.settings;
  }

  const doc = await generateInvoicePDF(invoice, settings, companyInfo);
  return doc.output("blob");
}
