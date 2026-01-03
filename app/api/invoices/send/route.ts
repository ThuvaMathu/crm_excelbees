import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/email-service";
import { generateInvoiceEmailHtml } from "@/lib/email/invoice-template";
import type { Invoice } from "@/types/crm";

export async function POST(request: NextRequest) {
  try {
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
      // Legacy fields
      invoice, 
      companyInfo, 
      recipientEmail, 
      filename 
    } = json;

    const finalTo = to || recipientEmail;
    
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

    // Send email
    // Note: If sendEmail doesn't support CC/BCC yet, they will be ignored for now.
    // We should check email-service.ts if we want to add support, but for now let's get it working.
    // Basic sendEmail signature: (to, subject, html, from, attachments)
    
    // Modify this if sendEmail supports options object in future.
    // For now we just send to 'to'.
    
    const result = await sendEmail(
      finalTo,
      finalSubject,
      finalBody,
      undefined,
      attachments,
      cc,
      bcc
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
    console.error("Error sending invoice email:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
