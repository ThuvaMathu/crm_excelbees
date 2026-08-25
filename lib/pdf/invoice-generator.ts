import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice, InvoiceOrgSettings } from "@/types/crm";
import { format } from "date-fns";
import { getOrganization } from "@/lib/firestore/organizations";
import { toJsDate } from "@/lib/utils";
import { logger } from "@/lib/logger/client";

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
      logger.warn("Logo fetch failed, skipping logo", { module: "pdf", action: "load-logo", metadata: { status: response.status, url } });
      return null;
    }

    const blob = await response.blob();

    if (blob.size === 0) {
      logger.warn("Logo blob is empty, skipping logo", { module: "pdf", action: "load-logo" });
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
          logger.warn("FileReader produced invalid base64, skipping logo", { module: "pdf", action: "load-logo" });
          resolve(null);
        }
      };
      reader.onerror = () => {
        logger.warn("FileReader error, skipping logo", { module: "pdf", action: "load-logo" });
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    logger.warn(
      "Could not load logo image (CORS or network error)",
      { module: "pdf", action: "load-logo", error }
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
  orgSettings?: InvoiceOrgSettings | null,
  // The current sending user's own name/email — always used for the
  // "from" identity on the PDF instead of a stored setting, so it
  // correctly reflects whichever team member is actually sending it.
  sender?: { name?: string; email?: string },
  companyInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  }
): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // The org's chosen accent color (falls back to the previous hardcoded
  // navy) — replaces every COLORS.navy usage below so the color picker in
  // org invoice settings actually has a visible effect on the PDF.
  const primaryColor = hexToRgb(orgSettings?.colorTheme || "#182347");

  // Determine if we're using Indian currency (based on template)
  const isInr = invoice.currency === "INR" || invoice.currency === "₹";
  const currencySymbol = isInr ? "₹" : invoice.currency === "USD" ? "$" : invoice.currency + " ";

  // Payment details come only from the org's own configured invoice
  // settings — there is no safe generic fallback for bank account details.
  // This previously defaulted to a specific real-looking person's name,
  // account number, and IFSC code, which would print on EVERY invoice PDF
  // for any org that hadn't configured its own payment info — a real data
  // leak, not just a placeholder. Missing fields now render as "Not
  // configured" and the whole section is skipped if nothing was set at all.
  const paymentDetails = {
    accountName: orgSettings?.accountName || "",
    accountNumber: orgSettings?.accountNumber || "",
    bankName: orgSettings?.bankName || "",
    ifsc: orgSettings?.ifsc || "",
  };
  const hasPaymentDetails = Object.values(paymentDetails).some((v) => v);

  // Consistent vertical rhythm between major sections (header, meta, table,
  // totals, payment, terms/footer) — previously each section used its own
  // ad-hoc offset, which is what produced uneven whitespace and, in one
  // case, a header accent line drawn close enough to collide with the
  // "Invoice to:" text directly below it.
  const SECTION_GAP = 15;

  // ========== HEADER SECTION ==========
  // Top accent line (Orange/Navy gradient effect using two rectangles)
  doc.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
  doc.rect(0, 0, pageWidth / 2, 4, "F");
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(pageWidth / 2, 0, pageWidth / 2, 4, "F");

  let logoY = 15;
  // Add logo if available — sourced from the org's own logoUrl (set via
  // org invoice settings, admin-only), not a per-user value.
  const logoUrl = companyInfo?.logoUrl;
  if (logoUrl) {
    try {
      const logoBase64 = await loadImageAsBase64(logoUrl);
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
      logger.error("Failed to add logo to PDF", { module: "pdf", action: "add-logo", error });
    }
  }

  // Company Name (Left) — always the org's own name (Organization.name),
  // never a separately-editable value, so a team member can never send an
  // invoice under a different company name than their actual org.
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(companyInfo?.name || "Your Company", 15, logoY + 5);

  // "From" line — the org's own contact email, distinct from the client's
  // details in the "Invoice to:" block below. Previously there was no
  // sender block at all, so the org's email ended up printed directly
  // under the *client's* address with nothing to distinguish whose
  // details were whose.
  const fromEmail = companyInfo?.email || sender?.email;
  if (fromEmail) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
    doc.text(fromEmail, 15, logoY + 11);
  }

  // INVOICE Title (Right)
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("INVOICE", pageWidth - 15, logoY + 8, { align: "right" });

  // Bottom accent line for header — pushed down far enough to clear the
  // company name + from-email block above it (previously sat only 2-3mm
  // below that text with no margin, so descenders/the from-line collided
  // with the bar itself).
  const headerLineY = logoY + 20;
  doc.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
  doc.rect(0, headerLineY, pageWidth / 2, 2, "F");
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(pageWidth / 2, headerLineY, pageWidth / 2, 2, "F");

  // ========== META INFORMATION SECTION ==========
  const metaY = headerLineY + SECTION_GAP;

  // Left: Invoice To
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Invoice to:", 15, metaY);

  let clientY = metaY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  // Dark gray, not the primary brand color — the client's name shouldn't
  // compete visually with the org's own name/logo above it. Only the org's
  // own branding uses the accent color.
  doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
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

  // Right: Invoice Details — a simple two-column "table" (label at a fixed
  // X, value right-aligned to the page margin at the same X for every
  // row), so the invoice number and date values land on the same right
  // edge regardless of label length.
  const detailsX = pageWidth - 15;
  const detailsLabelX = detailsX - 55;
  let detailsY = metaY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Invoice no:", detailsLabelX, detailsY);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(invoice.invoiceNumber, detailsX, detailsY, { align: "right" });

  detailsY += 8;
  doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.setFont("helvetica", "normal");
  doc.text("Date:", detailsLabelX, detailsY);
  // toJsDate() handles the {seconds,nanoseconds} plain-object shape too
  // (e.g. after a cache round-trip), not just live Firestore Timestamps —
  // the previous `new Date(invoice.issueDate)` fallback produced an
  // Invalid Date for that shape, which format() then threw on
  // ("RangeError: Invalid time value"), crashing PDF generation outright.
  const issueDateObj = toJsDate(invoice.issueDate);
  if (!issueDateObj) {
    logger.warn("Invoice has unparseable issueDate", { module: "pdf", action: "generate", metadata: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber } });
  }
  doc.text(issueDateObj ? format(issueDateObj, "dd MMM yyyy") : "-", detailsX, detailsY, { align: "right" });

  // Status Badge (if Paid)
  if (invoice.status === "Paid") {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(detailsX - 45, detailsY + 5, 30, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PAID", detailsX - 30, detailsY + 9, { align: "center" });
    doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  }

  // ========== COMPACT TABLE SECTION ==========
  const tableStartY = Math.max(clientY, detailsY) + SECTION_GAP;

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
      // No halign here — forcing every header to "left" while
      // columnStyles right/center-aligns the Price/Qty/Total *body*
      // columns made the header labels visibly not line up with their
      // own column's values (PRICE/QTY/TOTAL headers sat left while
      // their amounts sat right/center below). Let columnStyles govern
      // both header and body per column instead, so each header sits
      // directly above its values.
      cellPadding: 5, // Reduced for compact layout
    },
    styles: {
      fontSize: 9, // Reduced slightly for compact layout
      cellPadding: 5, // Reduced from 8 for compact layout
      lineColor: COLORS.border,
      lineWidth: 0.2,
      fillColor: COLORS.white,
    },
    // Description stays left-aligned (the default); every numeric column
    // — Price, Qty, Total — is right-aligned so digits stack for easy
    // scanning. Qty was previously center-aligned, inconsistent with the
    // other two number columns.
    columnStyles: hasTypes ? {
      0: { cellWidth: 65 }, // Description
      1: { cellWidth: 25, halign: "center", fontStyle: "italic" }, // Type (a label, not a number)
      2: { cellWidth: 32, halign: "right" }, // Price
      3: { cellWidth: 23, halign: "right" }, // Qty
      4: { cellWidth: 32, halign: "right" }, // Total
    } : {
      0: { cellWidth: 75 }, // Description
      1: { cellWidth: 35, halign: "right" }, // Price
      2: { cellWidth: 25, halign: "right" }, // Qty
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
  const finalY = (doc as any).lastAutoTable.finalY + SECTION_GAP;
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

  // TOTAL (Dark background) — right edge must land at the same margin as
  // every other right-aligned element on the page (pageWidth - 15, used by
  // the amount text below and the payment-method bar). The previous fixed
  // width of 60 pushed the box's right edge out to pageWidth - 5, a 10mm
  // overshoot past that margin — visibly misaligned with everything above
  // and below it (this was the "alignment mistake" in the generated PDF).
  const totalWidth = (pageWidth - 13) - (totalsX - 5);
  doc.setFillColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.roundedRect(totalsX - 5, totalsY - 5, totalWidth, 12, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL", totalsX, totalsY + 2);
  doc.text(formatCurrency(invoice.total, invoice.currency), pageWidth - 15, totalsY + 2, { align: "right" });

  // ========== PAYMENT METHOD SECTION ==========
  let paymentY = totalsY + SECTION_GAP + 5;

  // Payment header
  doc.setFillColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.rect(15, paymentY, pageWidth - 30, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PAYMENT METHOD:", 20, paymentY + 5);

  // Payment details (Left side)
  const paymentDetailsStartY = paymentY + 15;
  paymentY = paymentDetailsStartY;
  doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  if (hasPaymentDetails) {
    doc.text(`Account Name: ${paymentDetails.accountName || "Not configured"}`, 20, paymentY);
    paymentY += 6;
    doc.text(`Account Number: ${paymentDetails.accountNumber || "Not configured"}`, 20, paymentY);
    paymentY += 6;
    doc.text(`Bank Name: ${paymentDetails.bankName || "Not configured"}`, 20, paymentY);
    paymentY += 6;
    doc.text(` IFSC/BSB Code: ${paymentDetails.ifsc || "Not configured"}`, 20, paymentY);
  } else {
    doc.text("Payment details not configured — please contact us.", 20, paymentY);
  }
  // Bottom of the actual payment-details text, whatever its final line
  // count — used below to anchor the signature block to the same
  // baseline instead of a Y computed independently of it.
  const paymentDetailsBottomY = paymentY;

  // Administrator signature block (Right side of Payment Method) — its
  // bottom line is anchored to paymentDetailsBottomY so the two blocks
  // share a common baseline, rather than each being positioned from an
  // independent offset off totalsY (which left them floating at
  // different heights with no shared anchor).
  const sigX = pageWidth - 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.text("Administrator", sigX, paymentDetailsBottomY - 6, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(sender?.name || companyInfo?.name || "Your Company", sigX, paymentDetailsBottomY, { align: "right" });

  // ========== TERMS & SIGNATURE SECTION ==========
  const termsY = paymentDetailsBottomY + SECTION_GAP;

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
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Thank you for business with us!", rightX, thankYouY, { align: "right" });

  // ========== FOOTER INFO (Right Aligned) ==========
  // Drawn *before* the bottom accent bar (previously the bar was drawn
  // first and this text after it, sandwiching the footer text between the
  // border and the physical page edge with no controlled margin — printer
  // margins could clip it). Text now flows directly under the thank-you
  // message, and the border becomes the final element beneath it.
  const footerInfoX = pageWidth - 15;
  let footerInfoY = thankYouY + SECTION_GAP;

  doc.setFontSize(8);
  doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
  doc.setFont("helvetica", "normal");

  // Email — the actual sending user's email, not a stored setting.
  const emailText = `Email: ${sender?.email || companyInfo?.email || "-"}`;
  doc.text(emailText, footerInfoX, footerInfoY, { align: "right" });
  footerInfoY += 5;

  // Phone (if available)
  if (companyInfo?.phone) {
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

  // ========== BOTTOM ACCENT LINE ==========
  // Last element on the page, below all footer text.
  const footerBarY = footerInfoY + 8;

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, footerBarY, pageWidth / 2, 3, "F");
  doc.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
  doc.rect(pageWidth / 2, footerBarY, pageWidth / 2, 3, "F");

  return doc;
}

export async function downloadInvoicePDF(
  invoice: Invoice,
  orgSettings?: InvoiceOrgSettings | null,
  sender?: { name?: string; email?: string },
  companyInfo?: any
) {
  const doc = await generateInvoicePDF(invoice, orgSettings, sender, companyInfo);
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
}

export async function getInvoicePDFBlob(
  invoice: Invoice,
  orgId?: string,
  companyInfo?: any,
  sender?: { name?: string; email?: string }
): Promise<Blob> {
  let orgSettings: InvoiceOrgSettings | null = null;
  let resolvedCompanyInfo = companyInfo;
  if (orgId) {
    const { org } = await getOrganization(orgId);
    orgSettings = org?.invoiceSettings || null;
    resolvedCompanyInfo = { name: org?.name, logoUrl: org?.logoUrl, ...companyInfo };
  }

  const doc = await generateInvoicePDF(invoice, orgSettings, sender, resolvedCompanyInfo);
  return doc.output("blob");
}
