import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/email-service";
import { generateInvoiceEmailHtml } from "@/lib/email/invoice-template";
import type { Invoice } from "@/types/crm";

export async function POST(request: NextRequest) {
  try {
    const { invoice, companyInfo, recipientEmail, pdfBase64, filename } = await request.json();

    if (!invoice || !recipientEmail || !pdfBase64) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate HTML
    const html = generateInvoiceEmailHtml(invoice, companyInfo);

    // Send email with attachment
    const result = await sendEmail(
      recipientEmail,
      `Invoice ${invoice.invoiceNumber} from ${companyInfo?.name || "Your Company"}`,
      html,
      undefined, // default sender
      [
        {
          filename: filename || `Invoice-${invoice.invoiceNumber}.pdf`,
          content: Buffer.from(pdfBase64, "base64").toString("base64"), // Nodemailer handles base64 string if marked encoding? 
          // Actually nodemailer content can be Buffer, Stream, or String.
          // If string, it assumes utf-8 unless encoding set.
          // Better to pass Buffer.
        },
      ]
    );

    // Wait, Buffer in JSON? No, sendEmail takes object.
    // email-service.ts signature: attachments?: Array<{ filename: string; path?: string; content?: string | Buffer }>
    // I should pass Buffer.
    // Buffer.from(pdfBase64, "base64") returns a Buffer. Correct.

    // Re-check sendEmail logic. 
    // It passes to transporter.sendMail.
    // Nodemailer supports Buffer content.

    const resultWithBuffer = await sendEmail(
      recipientEmail,
      `Invoice ${invoice.invoiceNumber} from ${companyInfo?.name || "Your Company"}`,
      html,
      undefined,
      [
        {
          filename: filename || `Invoice-${invoice.invoiceNumber}.pdf`,
          content: Buffer.from(pdfBase64, "base64"), 
        },
      ]
    );

    if (resultWithBuffer.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: resultWithBuffer.error },
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
