import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Campaign } from "@/types/email-campaigns";
import { replaceMergeTags, injectTrackingPixel, wrapLinksWithTracking } from "@/lib/email-campaigns/utils";
import nodemailer from "nodemailer";

/**
 * POST /api/marketing/campaigns/[campaignId]/test-send
 * Send a test email to verify content and rendering
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const body = await request.json();
    const { userId, testEmails, personalizationData } = body as {
      userId: string;
      testEmails: string[];
      personalizationData?: Record<string, any>;
    };
    const { campaignId } = await params;

    if (!userId || !testEmails || testEmails.length === 0) {
      return NextResponse.json(
        { error: "User ID and at least one test email required" },
        { status: 400 }
      );
    }

    // Validate email addresses
    const validEmails = testEmails.filter((email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    });

    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: "No valid email addresses provided" },
        { status: 400 }
      );
    }

    // Get campaign
    const campaignDoc = await adminDb
      .collection(`marketing/email-campaigns/users/${userId}/campaigns`)
      .doc(campaignId)
      .get();

    if (!campaignDoc.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const campaign = campaignDoc.data() as Campaign;

    // Check if campaign has content
    if (!campaign.content?.html) {
      return NextResponse.json(
        { error: "Campaign has no content to send" },
        { status: 400 }
      );
    }

    // Get SMTP configuration from environment
    const smtpConfig = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    };

    if (!smtpConfig.auth.user) {
      return NextResponse.json(
        { error: "Email service not configured. Please set SMTP credentials." },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport(smtpConfig);

    // Verify SMTP connection
    try {
      await transporter.verify();
    } catch (smtpError) {
      console.error("SMTP verification failed:", smtpError);
      return NextResponse.json(
        { error: "Failed to connect to email server. Please check SMTP configuration." },
        { status: 500 }
      );
    }

    // Default personalization data for test emails
    const defaultPersonalization = {
      FirstName: "Friend",
      LastName: "",
      Email: "test@example.com",
      Company: "Company",
    } as any; // Cast to any to avoid Partial<Contact> mismatch if field names differ

    // Prepare email content with merge tag replacement
    let htmlContent = campaign.content.html;
    let plainTextContent = campaign.content.plainText || "";

    // Replace merge tags with test data
    htmlContent = replaceMergeTags(htmlContent, defaultPersonalization);
    plainTextContent = replaceMergeTags(plainTextContent, defaultPersonalization);

    // Inject tracking for test (optional - helps verify tracking works)
    if (campaign.tracking?.trackOpens) {
      htmlContent = injectTrackingPixel(htmlContent, campaignId, "test_contact");
    }

    if (campaign.tracking?.trackClicks) {
      htmlContent = wrapLinksWithTracking(htmlContent, campaignId, "test_contact");
    }

    // Send test emails
    const sendResults = await Promise.allSettled(
      validEmails.map((email) =>
        transporter.sendMail({
          from: `"${campaign.from.name}" <${campaign.from.email}>`,
          to: email,
          subject: `[TEST] ${campaign.subject}`,
          text: plainTextContent,
          html: htmlContent,
          headers: {
            "X-Campaign-ID": campaignId,
            "X-Email-Category": "test-send",
          },
        })
      )
    );

    const successful = sendResults.filter((r) => r.status === "fulfilled").length;
    const failed = sendResults.filter((r) => r.status === "rejected").length;

    if (failed === validEmails.length) {
      return NextResponse.json(
        {
          error: "All test emails failed",
          details: sendResults
            .filter((r) => r.status === "rejected")
            .map((r: any) => r.reason?.message),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${successful} recipient${successful !== 1 ? "s" : ""}`,
      sent: successful,
      failed,
      total: validEmails.length,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Failed to send test email", message: errorMessage },
      { status: 500 }
    );
  }
}
