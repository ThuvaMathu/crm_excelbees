import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice, InvoiceUserSettings } from "@/types/crm";
import { format } from "date-fns";
import { getUserInvoiceSettings } from "@/lib/firestore/users";

// Colors matching the MkEnterprises template
const COLORS = {
  navy: [24, 35, 71] as [number, number, number],    // Dark navy blue
  orange: [255, 126, 33] as [number, number, number], // Accent orange
  gray: [245, 245, 245] as [number, number, number],  // Light gray for table alt rows
  darkGray: [64, 64, 64] as [number, number, number], // Dark gray for table headers
  white: [255, 255, 255] as [number, number, number],
  border: [220, 220, 220] as [number, number, number],
  red: [220, 38, 38] as [number, number, number], // For negative values
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
    : [24, 35, 71]; // Default navy
}

// Helper function to load image as base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;

  try {
    // If already a base64 data URL, validate and return directly
    if (url.startsWith("data:")) {
      return url.includes("base64,") ? url : null;
    }

    // Only attempt cors — no-cors returns an opaque response whose
    // bytes are completely unreadable by the browser, producing a corrupt
    // blob that causes jsPDF to throw "wrong PNG signature".
    const response = await fetch(url, {
      mode: "cors",
      cache: "force-cache",
    });

    if (!response.ok) {
      console.warn(`Logo fetch failed (${response.status}): ${url} — skipping logo.`);
      return null;
    }

    const blob = await response.blob();

    if (blob.size === 0) {
      console.warn("Logo blob is empty — skipping logo.");
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Guard: validate the result is a proper data URL with base64 content
        if (result && result.includes("base64,") && result.length > 50) {
          resolve(result);
        } else {
          console.warn("FileReader produced an invalid base64 string — skipping logo.");
          resolve(null);
        }
      };
      reader.onerror = () => {
        console.warn("FileReader error — skipping logo.");
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(
      "Could not load logo image (CORS or network error):",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}


/**
 * Format currency with proper symbol
 */
function formatCurrency(amount: number, currency: string = "INR"): string {
  const symbol = currency === "INR" || currency === "₹" ? "₹" : currency === "USD" ? "$" : currency + " ";
  return `${symbol}${Math.abs(amount).toFixed(2)}`;
}

/**
 * Get line item type label for display
 */
function getTypeLabel(type?: string): string {
  switch (type) {
    case "Advance":
      return "Advance";
    case "Refund":
      return "Refund";
    case "Credit":
      return "Credit";
    case "Discount":
      return "Discount";
    default:
      return "";
  }
}

/**
 * Check if a value is negative (for adjustments/refunds)
 */
function isNegative(value: number): boolean {
  return value < 0 || (value === 0 && String(value).includes("-"));
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

  // Determine if we're using Indian currency (based on template)
  const isInr = invoice.currency === "INR" || invoice.currency === "₹";
  const currencySymbol = isInr ? "₹" : invoice.currency === "USD" ? "$" : invoice.currency + " ";

  // Payment Details (from template - can be made dynamic)
  const paymentDetails = {
    accountName: settings?.accountName || "Kirutharadevi Selva Jothi",
    accountNumber: settings?.accountNumber || "8236449314",
    bankName: settings?.bankName || "Indian Bank",
    ifsc: settings?.ifsc || "IDIB000T099",
  };

  // ========== HEADER SECTION ==========
  // Top accent line (Orange/Navy gradient effect using two rectangles)
  doc.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
  doc.rect(0, 0, pageWidth / 2, 4, "F");
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(pageWidth / 2, 0, pageWidth / 2, 4, "F");

  let logoY = 15;
  // Add logo if available
  if (settings?.logoUrl) {
    try {
      const logoBase64 = await loadImageAsBase64(settings.logoUrl);
      if (logoBase64) {
        // Auto-detect image format from the data URL prefix
        const formatMatch = logoBase64.match(/^data:image\/(\w+);base64,/);
        const imgFormat = formatMatch ? formatMatch[1].toUpperCase() : "JPEG";
        // Normalize JPEG/JPG variants
        const jsPdfFormat = imgFormat === "JPG" ? "JPEG" : imgFormat;

        doc.addImage(logoBase64, jsPdfFormat, 15, 10, 40, 20);
        logoY = 35;
      }
    } catch (error) {
      console.error("Failed to add logo to PDF:", error);
    }
  }

  // Company Name (Left)
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text(settings?.companyName || companyInfo?.name || "ExcelBees", 15, logoY + 5);

  // Tagline
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.text("Web Solutions & Digital Marketing", 15, logoY + 11);

  // INVOICE Title (Right)
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text("INVOICE", pageWidth - 15, logoY + 8, { align: "right" });

  // Domain below INVOICE
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("EXCELBEES.COM", pageWidth - 15, logoY + 14, { align: "right" });

  // Bottom accent line for header
  doc.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
  doc.rect(0, logoY + 18, pageWidth / 2, 2, "F");
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(pageWidth / 2, logoY + 18, pageWidth / 2, 2, "F");

  // ========== META INFORMATION SECTION ==========
  const metaY = logoY + 30;

  // Left: Invoice To
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text("Invoice to :", 15, metaY);

  let clientY = metaY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(invoice.companyName || invoice.contactName || "Client Name", 15, clientY);
  clientY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (invoice.contactName && invoice.companyName) {
    doc.text(invoice.contactName, 15, clientY);
    clientY += 6;
  }
  if (invoice.billingAddress) {
    const addressLines = doc.splitTextToSize(invoice.billingAddress, 70);
    doc.text(addressLines, 15, clientY);
    clientY += addressLines.length * 5 + 2;
  }
  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, 15, clientY);
    clientY += 6;
  }

  // Right: Invoice Details
  const detailsX = pageWidth - 15;
  let detailsY = metaY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Invoice no :`, detailsX - 55, detailsY);
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text(invoice.invoiceNumber, detailsX, detailsY, { align: "right" });

  detailsY += 8;
  doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
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
    doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  }

  // ========== COMPACT TABLE SECTION ==========
  const tableStartY = Math.max(clientY + 10, detailsY + 20);

  // Check if any item has a type (to show TYPE column)
  const hasTypes = invoice.lineItems.some(item => item.type && item.type !== "Service");

  // Build table data with conditional TYPE column
  const tableHead = hasTypes
    ? [["DESCRIPTION", "TYPE", "PRICE", "QTY", "TOTAL"]]
    : [["DESCRIPTION", "PRICE", "QTY", "TOTAL"]];

  // Store indices for negative value columns
  const priceColIndex = hasTypes ? 2 : 1;
  const totalColIndex = hasTypes ? 4 : 3;

  const tableBody = invoice.lineItems.map((item) => {
    const priceDisplay = (item.price < 0 ? "-" : "") + currencySymbol + Math.abs(item.price).toFixed(2);
    const totalDisplay = (item.total < 0 ? "-" : "") + currencySymbol + Math.abs(item.total).toFixed(2);
    const typeLabel = getTypeLabel(item.type);

    if (hasTypes) {
      return [item.description, typeLabel, priceDisplay, item.quantity.toString(), totalDisplay];
    } else {
      return [item.description, priceDisplay, item.quantity.toString(), totalDisplay];
    }
  });

  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: "plain",
    headStyles: {
      fillColor: COLORS.darkGray,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
      cellPadding: 5, // Reduced for compact layout
    },
    styles: {
      fontSize: 9, // Reduced slightly for compact layout
      cellPadding: 5, // Reduced from 8 for compact layout
      lineColor: COLORS.border,
      lineWidth: 0.2,
      fillColor: COLORS.white,
    },
    columnStyles: hasTypes ? {
      0: { cellWidth: 65 }, // Description
      1: { cellWidth: 25, halign: "center", fontStyle: "italic" }, // Type
      2: { cellWidth: 32, halign: "right" }, // Price
      3: { cellWidth: 23, halign: "center" }, // Qty
      4: { cellWidth: 32, halign: "right" }, // Total
    } : {
      0: { cellWidth: 75 }, // Description
      1: { cellWidth: 35, halign: "right" }, // Price
      2: { cellWidth: 25, halign: "center" }, // Qty
      3: { cellWidth: 35, halign: "right" }, // Total
    },
    // Style negative values and type cells using willDrawCell hook
    willDrawCell: (data) => {
      if (data.section === "body") {
        const rowIndex = data.row.index;
        const item = invoice.lineItems[rowIndex];
        if (!item) return;

        // Set red color for negative values
        if (isNegative(item.total) && (data.column.index === priceColIndex || data.column.index === totalColIndex)) {
          doc.setTextColor(COLORS.red[0], COLORS.red[1], COLORS.red[2]);
        }

        // Add subtle background for type cells
        if (hasTypes && data.column.index === 1 && item.type && item.type !== "Service") {
          doc.setFillColor(245, 245, 250);
        }
      }
    },
  });

  // ========== TOTALS SECTION ==========
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalsX = pageWidth - 60;
  let totalsY = finalY;

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.text("SUB-TOTAL", totalsX, totalsY);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - 15, totalsY, { align: "right" });
  totalsY += 8;

  // Tax
  doc.setFont("helvetica", "normal");
  doc.text(`Tax (${invoice.taxRate}%)`, totalsX, totalsY);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(invoice.taxAmount, invoice.currency), pageWidth - 15, totalsY, { align: "right" });
  totalsY += 8;

  // Discount (if positive)
  if (invoice.discount > 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Discount", totalsX, totalsY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.red[0], COLORS.red[1], COLORS.red[2]);
    doc.text(`-${formatCurrency(invoice.discount, invoice.currency)}`, pageWidth - 15, totalsY, { align: "right" });
    doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
    totalsY += 8;
  }

  // TOTAL (Dark background)
  const totalWidth = 60;
  doc.setFillColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.roundedRect(totalsX - 5, totalsY - 5, totalWidth, 12, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL", totalsX, totalsY + 2);
  doc.text(formatCurrency(invoice.total, invoice.currency), pageWidth - 15, totalsY + 2, { align: "right" });

  // ========== PAYMENT METHOD SECTION ==========
  let paymentY = totalsY + 20;

  // Payment header
  doc.setFillColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.rect(15, paymentY, pageWidth - 30, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PAYMENT METHOD :", 20, paymentY + 5);

  // Payment details (Left side)
  paymentY += 15;
  doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(`Account Name : ${paymentDetails.accountName}`, 20, paymentY);
  paymentY += 6;
  doc.text(`Account Number : ${paymentDetails.accountNumber}`, 20, paymentY);
  paymentY += 6;
  doc.text(`Bank Name : ${paymentDetails.bankName}`, 20, paymentY);
  paymentY += 6;
  doc.text(`IFSC Code : ${paymentDetails.ifsc}`, 20, paymentY);

  // Administrator signature block (Right side of Payment Method)
  const sigStartY = totalsY + 20 + 5; // Aligned with payment section
  const sigX = pageWidth - 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.text("Administrator", sigX, sigStartY + 15, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(settings?.fromName || "ExcelBees", sigX, sigStartY + 21, { align: "right" });

  // ========== TERMS & SIGNATURE SECTION ==========
  const termsY = paymentY + 10;

  // Terms & Conditions (Left side)
  doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const termsText = invoice.terms || "Payment is due within 30 days. A late fee of 10% will be applied to overdue payments.";
  const termsLines = doc.splitTextToSize(`Terms & Conditions:\n${termsText}`, pageWidth - 30);
  doc.text(termsLines, 15, termsY);

  // ========== THANK YOU MESSAGE (Right Aligned) ==========
  const rightX = pageWidth - 15;
  const thankYouY = termsY + (termsLines.length * 4) + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text("Thank you for business with us!", rightX, thankYouY, { align: "right" });

  // ========== BOTTOM ACCENT LINE ==========
  const footerY = thankYouY + 15;

  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(0, footerY - 5, pageWidth / 2, 3, "F");
  doc.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
  doc.rect(pageWidth / 2, footerY - 5, pageWidth / 2, 3, "F");

  // ========== FOOTER INFO (Right Aligned) ==========
  const footerInfoX = pageWidth - 15;
  let footerInfoY = footerY + 5;

  doc.setFontSize(8);
  doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.setFont("helvetica", "normal");

  // Email
  const emailText = `Email: ${settings?.fromEmail || companyInfo?.email || "contact@excelbees.com"}`;
  doc.text(emailText, footerInfoX, footerInfoY, { align: "right" });
  footerInfoY += 5;

  // Phone (if available)
  if (companyInfo?.phone || settings?.fromEmail) {
    const phoneText = `Phone: ${companyInfo?.phone || ""}`;
    if (phoneText !== "Phone: ") {
      doc.text(phoneText, footerInfoX, footerInfoY, { align: "right" });
      footerInfoY += 5;
    }
  }

  // Generated date
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated on ${format(new Date(), "dd MMM yyyy, hh:mm a")}`,
    footerInfoX,
    footerInfoY,
    { align: "right" }
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
