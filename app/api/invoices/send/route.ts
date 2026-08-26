import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/email-service";
import { generateInvoiceEmailHtml } from "@/lib/email/invoice-template";
import { verifyApiRequest } from "@/lib/auth/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { adminDb } from "@/lib/firebase-admin";
import type { Invoice } from "@/types/crm";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiRequest(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized" },
        { status: auth.statusCode || 401 }
      );
    }

    const rateLimit = await checkRateLimit("email", auth.user.uid);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const json = await request.json();

    // Support both old and new payload formats
    const {
      to,
      cc,
      bcc,
      subject,
      body,
      pdfBase64,
      pdfName,
      invoiceId,
      // Legacy fields
      invoice,
      companyInfo,
      recipientEmail,
      filename
    } = json;

    const finalTo = to || recipientEmail;

    // Resolve organizationId server-side from the invoice itself (never
    // trust a client-supplied orgId here) so sendEmail() can route through
    // that org's own configured SMTP account instead of always falling
    // back to the env default — this was previously never passed at all
    // (see the equivalent EmailComposeModal.tsx fix for the compose flow).
    let organizationId: string | undefined = invoice?.organizationId;
    if (!organizationId && invoiceId) {
      const invoiceDoc = await adminDb.collection("invoices").doc(invoiceId).get();
      organizationId = invoiceDoc.data()?.organizationId;
    }
    
    // Validate required fields
    if (!finalTo || !pdfBase64) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine final subject and body
    let finalSubject = subject;
    let finalBody = body;

    // If legacy format, generate them
    if (!subject && invoice && companyInfo) {
       finalSubject = `Invoice ${invoice.invoiceNumber} from ${companyInfo?.name || "Your Company"}`;
       finalBody = generateInvoiceEmailHtml(invoice, companyInfo);
    } else if (body) {
       // Convert plain text body to simple HTML if it's from the modal
       // (Modal sends plain text from textarea)
       finalBody = body.replace(/\n/g, "<br>");
    }

    // Validate we have subject and body now
    if (!finalSubject || !finalBody) {
       return NextResponse.json(
        { success: false, error: "Missing subject or body" },
        { status: 400 }
      );
    }

    // Attachments
    const attachmentName = pdfName || filename || (invoice ? `Invoice-${invoice.invoiceNumber}.pdf` : "Invoice.pdf");
    const attachments = [
        {
          filename: attachmentName,
          content: Buffer.from(pdfBase64, "base64"),
        },
    ];

    const result = await sendEmail(
      finalTo,
      finalSubject,
      finalBody,
      undefined,
      attachments,
      cc,
      bcc,
      undefined,
      undefined,
      organizationId
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error: any) {
    logger.error("Error sending invoice email", { module: "email", action: "send-invoice", error });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
