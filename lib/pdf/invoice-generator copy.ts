import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice, InvoiceUserSettings } from "@/types/crm";
import { format } from "date-fns";
import { getUserInvoiceSettings } from "@/lib/firestore/users";

// Enhanced Colors matching the MkEnterprises template
const COLORS = {
  navy: [24, 35, 71] as [number, number, number],        // Dark navy blue
  orange: [255, 107, 53] as [number, number, number],    // Enhanced orange accent #FF6B35
  gray: [245, 245, 245] as [number, number, number],     // Light gray
  darkGray: [74, 74, 74] as [number, number, number],    // Dark gray #4A4A4A for TOTAL
  headerGray: [64, 64, 64] as [number, number, number],  // Header gray
  border: [224, 224, 224] as [number, number, number],   // Subtle border #E0E0E0
  white: [255, 255, 255] as [number, number, number],
  lightText: [150, 150, 150] as [number, number, number],
};

// Page Layout Constants
const LAYOUT = {
  pageMargin: 25,           // 25px all sides
  sectionSpacing: 30,       // 30px between major sections
  totalsRightMargin: 40,    // 40px right margin for totals
  adminRightPadding: 20,    // 20px right padding for admin section
};

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [24, 35, 71];
}

// Helper function to load image as base64 with improved CORS handling
async function loadImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;

  try {
    if (url.startsWith("data:")) {
      return url.includes("base64,") ? url : null;
    }

    const response = await fetch(url, {
      mode: "cors",
      cache: "force-cache",
    });

    if (!response.ok) {
      console.warn(`Logo fetch failed (${response.status}): ${url}`);
      return null;
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      console.warn("Logo blob is empty");
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result && result.includes("base64,") && result.length > 50) {
          resolve(result);
        } else {
          console.warn("Invalid base64 string");
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Could not load logo:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

/**
 * Format currency with proper symbol
 */
function formatCurrency(amount: number, currency: string = "INR"): string {
  const symbol = currency === "INR" || currency === "₹" ? "₹" : currency === "USD" ? "$" : currency + " ";
  return `${symbol}${amount.toFixed(2)}`;
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
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const currencySymbol = invoice.currency === "INR" || invoice.currency === "₹"
    ? "₹"
    : invoice.currency === "USD"
    ? "$"
    : invoice.currency + " ";

  // Payment Details (from template - can be made dynamic)
  const paymentDetails = {
    accountName: settings?.accountName || "thuvarakan",
    accountNumber: settings?.accountNumber || "123456789000",
    bankName: settings?.bankName || "ANZ bank",
    ifsc: settings?.ifsc || "ANZ12123",
  };

  // ========== HEADER SECTION ==========
  // Top accent line (Orange/Navy split)
  doc.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
  doc.rect(0, 0, pageWidth / 2, 4, "F");
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(pageWidth / 2, 0, pageWidth / 2, 4, "F");

  let logoY = LAYOUT.pageMargin - 5;

  // Add logo if available
  if (settings?.logoUrl) {
    try {
      const logoBase64 = await loadImageAsBase64(settings.logoUrl);
      if (logoBase64) {
        const formatMatch = logoBase64.match(/^data:image\/(\w+);base64,/);
        const imgFormat = formatMatch ? (formatMatch[1] === "JPG" ? "JPEG" : formatMatch[1].toUpperCase()) : "JPEG";
        doc.addImage(logoBase64, imgFormat as any, LAYOUT.pageMargin, 10, 40, 20);
        logoY = 38;
      }
    } catch (error) {
      console.error("Failed to add logo:", error);
    }
  }

  // Company Name (Left)
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text(settings?.companyName || companyInfo?.name || "ExcelBees", LAYOUT.pageMargin, logoY + 5);

  // Tagline
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.headerGray[0], COLORS.headerGray[1], COLORS.headerGray[2]);
  doc.text("Web Solutions & Digital Marketing", LAYOUT.pageMargin, logoY + 11);

  // INVOICE Title (Right)
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text("INVOICE", pageWidth - LAYOUT.pageMargin, logoY + 8, { align: "right" });

  // Domain below INVOICE
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("EXCELBEES.COM", pageWidth - LAYOUT.pageMargin, logoY + 14, { align: "right" });

  // Bottom accent line for header
  doc.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
  doc.rect(0, logoY + 18, pageWidth / 2, 2, "F");
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(pageWidth / 2, logoY + 18, pageWidth / 2, 2, "F");

  // ========== META INFORMATION SECTION ==========
  const metaY = logoY + LAYOUT.sectionSpacing;

  // Left: Invoice To
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text("Invoice to :", LAYOUT.pageMargin, metaY);

  let clientY = metaY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(invoice.companyName || invoice.contactName || "Client Name", LAYOUT.pageMargin, clientY);
  clientY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (invoice.contactName && invoice.companyName) {
    doc.text(invoice.contactName, LAYOUT.pageMargin, clientY);
    clientY += 6;
  }
  if (invoice.billingAddress) {
    const addressLines = doc.splitTextToSize(invoice.billingAddress, 70);
    doc.text(addressLines, LAYOUT.pageMargin, clientY);
    clientY += addressLines.length * 5 + 2;
  }
  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, LAYOUT.pageMargin, clientY);
    clientY += 6;
  }

  // Right: Invoice Details
  const detailsX = pageWidth - LAYOUT.pageMargin;
  let detailsY = metaY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Invoice no :`, detailsX - 55, detailsY);
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text(invoice.invoiceNumber, detailsX, detailsY, { align: "right" });

  detailsY += 8;
  doc.setTextColor(COLORS.headerGray[0], COLORS.headerGray[1], COLORS.headerGray[2]);
  doc.setFont("helvetica", "normal");
  doc.text("Date :", detailsX - 55, detailsY);
  const issueDateObj = typeof (invoice.issueDate as any)?.toDate === "function"
    ? (invoice.issueDate as any).toDate()
    : new Date(invoice.issueDate as any);
  doc.text(format(issueDateObj, "dd MMM yyyy"), detailsX, detailsY, { align: "right" });

  // Status Badge (if Paid)
  if (invoice.status === "Paid") {
    doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.roundedRect(detailsX - 45, detailsY + 5, 30, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PAID", detailsX - 30, detailsY + 9, { align: "center" });
    doc.setTextColor(COLORS.headerGray[0], COLORS.headerGray[1], COLORS.headerGray[2]);
  }

  // ========== TABLE SECTION ==========
  const tableStartY = Math.max(clientY + 10, detailsY + 20);

  autoTable(doc, {
    startY: tableStartY,
    head: [["DESCRIPTION", "PRICE", "QTY", "TOTAL"]],
    body: invoice.lineItems.map((item) => [
      item.description,
      currencySymbol + item.price.toFixed(2),
      item.quantity.toString(),
      currencySymbol + item.total.toFixed(2),
    ]),
    theme: "plain",
    headStyles: {
      fillColor: COLORS.headerGray,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 10,
      halign: "left",
      cellPadding: 8,
    },
    styles: {
      fontSize: 10,
      cellPadding: 8,
      lineColor: COLORS.border,
      lineWidth: 0.2,
      fillColor: COLORS.white,
    },
    columnStyles: {
      0: { cellWidth: 75 },
      1: { cellWidth: 35, halign: "right" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
    },
  });

  // ========== TOTALS SECTION (ENHANCED) ==========
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const totalsX = pageWidth - LAYOUT.totalsRightMargin;
  let totalsY = finalY;

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.headerGray[0], COLORS.headerGray[1], COLORS.headerGray[2]);
  doc.text("SUB-TOTAL", totalsX, totalsY);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - LAYOUT.pageMargin, totalsY, { align: "right" });
  totalsY += 8;

  // Tax
  doc.setFont("helvetica", "normal");
  doc.text(`Tax (${invoice.taxRate}%)`, totalsX, totalsY);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(invoice.taxAmount, invoice.currency), pageWidth - LAYOUT.pageMargin, totalsY, { align: "right" });
  totalsY += 8;

  // Discount
  if (invoice.discount > 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Discount", totalsX, totalsY);
    doc.setFont("helvetica", "bold");
    doc.text(`-${formatCurrency(invoice.discount, invoice.currency)}`, pageWidth - LAYOUT.pageMargin, totalsY, { align: "right" });
    totalsY += 8;
  }

  // Horizontal divider line above TOTAL
  totalsY += 5;
  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 10, totalsY, pageWidth - LAYOUT.pageMargin + 5, totalsY);
  totalsY += 8;

  // TOTAL - Enhanced with larger font, rounded corners, dark gray background
  const totalWidth = 80;
  const totalHeight = 16;
  const totalCornerRadius = 3; // ~8px rounded corners

  doc.setFillColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.roundedRect(totalsX - 10, totalsY - 6, totalWidth, totalHeight, totalCornerRadius, totalCornerRadius, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14); // Larger font (approximately 16px equivalent)
  doc.text("TOTAL", totalsX, totalsY + 4);
  doc.text(formatCurrency(invoice.total, invoice.currency), pageWidth - LAYOUT.pageMargin, totalsY + 4, { align: "right" });

  // ========== PAYMENT METHOD SECTION ==========
  let paymentY = totalsY + totalHeight + LAYOUT.sectionSpacing;

  // Payment header - dark gray bar
  doc.setFillColor(COLORS.headerGray[0], COLORS.headerGray[1], COLORS.headerGray[2]);
  doc.rect(LAYOUT.pageMargin, paymentY, pageWidth - LAYOUT.pageMargin * 2, 10, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PAYMENT METHOD :", LAYOUT.pageMargin + 5, paymentY + 6);

  // Payment details with 15px padding
  paymentY += 20;
  doc.setTextColor(COLORS.headerGray[0], COLORS.headerGray[1], COLORS.headerGray[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const paymentLabels = [
    `Account Name : ${paymentDetails.accountName}`,
    `Account Number : ${paymentDetails.accountNumber}`,
    `Bank Name : ${paymentDetails.bankName}`,
    `IFSC Code : ${paymentDetails.ifsc}`,
  ];

  paymentLabels.forEach((label, index) => {
    doc.text(label, LAYOUT.pageMargin + 15, paymentY + index * 7);
  });

  // ========== FOOTER SECTION (TWO-COLUMN LAYOUT) ==========
  const footerY = pageHeight - 70;

  // Footer divider line (Orange/Navy split matching header)
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(0, footerY - 10, pageWidth / 2, 3, "F");
  doc.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
  doc.rect(pageWidth / 2, footerY - 10, pageWidth / 2, 3, "F");

  // ========== LEFT COLUMN (40%) - Terms & Conditions ==========
  const leftColumnX = LAYOUT.pageMargin;
  const leftColumnWidth = (pageWidth - LAYOUT.pageMargin * 2) * 0.4;

  // Navy blue background bar above terms
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(leftColumnX, footerY, leftColumnWidth, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text("Terms & Conditions:", leftColumnX, footerY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.headerGray[0], COLORS.headerGray[1], COLORS.headerGray[2]);

  const termsText = invoice.terms || "Payment is due within the specified payment terms.";
  const termsLines = doc.splitTextToSize(termsText, leftColumnWidth);
  doc.text(termsLines, leftColumnX, footerY + 17);

  // ========== RIGHT COLUMN (60%) - Enhanced Visibility ==========
  const rightColumnX = leftColumnX + leftColumnWidth + 15;
  const rightColumnWidth = (pageWidth - LAYOUT.pageMargin * 2) * 0.6 - 15;

  // Thank You Message - Orange accent, bold, 14px, with top margin
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
  doc.text("Thank you for business with us!", pageWidth - LAYOUT.pageMargin, footerY + 10, { align: "right" });

  // Contact Information
  let contactY = footerY + 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.headerGray[0], COLORS.headerGray[1], COLORS.headerGray[2]);

  const email = settings?.fromEmail || companyInfo?.email || "info@excelbees.com.au";
  doc.text(`Email: ${email}`, pageWidth - LAYOUT.pageMargin, contactY, { align: "right" });

  // Generated timestamp
  contactY += 6;
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText[0], COLORS.lightText[1], COLORS.lightText[2]);
  const generatedDate = format(new Date(), "dd MMM yyyy, hh:mm a");
  doc.text(`Generated on ${generatedDate}`, pageWidth - LAYOUT.pageMargin, contactY, { align: "right" });

  // ========== ADMINISTRATOR SECTION (Right-aligned) ==========
  const adminY = contactY + 15;

  // Label: Administrator (bold, navy blue)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text("Administrator", pageWidth - LAYOUT.adminRightPadding, adminY, { align: "right" });

  // Name: Regular weight, dark gray, 8px spacing below
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.headerGray[0], COLORS.headerGray[1], COLORS.headerGray[2]);
  doc.text(settings?.fromName || "Thuvarakan Selvasothy", pageWidth - LAYOUT.adminRightPadding, adminY + 8, { align: "right" });

  // ========== BOTTOM ACCENT LINE ==========
  const bottomY = pageHeight - 10;
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(0, bottomY, pageWidth / 2, 2, "F");
  doc.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
  doc.rect(pageWidth / 2, bottomY, pageWidth / 2, 2, "F");

  return doc;
}

export async function downloadInvoicePDF(invoice: Invoice, settings?: InvoiceUserSettings | null, companyInfo?: any) {
  const doc = await generateInvoicePDF(invoice, settings, companyInfo);
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
}

export async function getInvoicePDFBlob(invoice: Invoice, userId?: string, companyInfo?: any): Promise<Blob> {
  let settings: InvoiceUserSettings | null = null;
  if (userId) {
    const result = await getUserInvoiceSettings(userId);
    settings = result.settings;
  }

  const doc = await generateInvoicePDF(invoice, settings, companyInfo);
  return doc.output("blob");
}
