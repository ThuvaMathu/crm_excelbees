import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Campaign } from "@/types/email-campaigns";
import { replaceMergeTags, injectTrackingPixel, wrapLinksWithTracking } from "@/lib/email-campaigns/utils";
import { sendEmail } from "@/lib/email/email-service";

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

    // Default personalization data for test emails
    const defaultPersonalization = {
      firstName: "Test",
      lastName: "User",
      email: testEmails[0],
      company: "Acme Corp",
      ...personalizationData,
    };

    // Prepare email content with merge tag replacement
    let htmlContent = campaign.content.html;

    // Replace merge tags with test data
    htmlContent = replaceMergeTags(htmlContent, defaultPersonalization);

    // Inject tracking for test (optional - helps verify tracking works)
    if (campaign.tracking?.trackOpens) {
      htmlContent = injectTrackingPixel(htmlContent, campaignId, "test_contact");
    }

    if (campaign.tracking?.trackClicks) {
      htmlContent = wrapLinksWithTracking(htmlContent, campaignId, "test_contact");
    }

    // Send test emails using the existing working email service
    console.log("[TEST-SEND API] Sending to emails:", validEmails);
    const sendResults = await Promise.allSettled(
      validEmails.map((email) =>
        sendEmail(
          email,
          `[TEST] ${campaign.subject}`,
          htmlContent
        )
      )
    );

    const successful = sendResults.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = validEmails.length - successful;

    if (failed === validEmails.length) {
      const errors = sendResults
        .filter((r) => r.status === "fulfilled" && !r.value.success)
        .map((r: any) => r.value.error);
      const rejectedErrors = sendResults
        .filter((r) => r.status === "rejected")
        .map((r: any) => r.reason?.message);

      return NextResponse.json(
        {
          error: "All test emails failed",
          details: [...errors, ...rejectedErrors],
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
