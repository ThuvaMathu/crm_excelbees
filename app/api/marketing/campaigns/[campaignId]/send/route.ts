import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Campaign } from "@/types/email-campaigns";
import { addEmailJob } from "@/lib/email-campaigns/queue";
import { wrapLinksWithTracking, injectTrackingPixel, replaceMergeTags } from "@/lib/email-campaigns/utils";
import { addUnsubscribeLink } from "@/lib/email-campaigns/mailer";
import { Timestamp } from "firebase-admin/firestore";

// POST /api/marketing/campaigns/[campaignId]/send - Send campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const body = await request.json();
    const { userId } = body as { userId: string };
    const { campaignId } = params;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get campaign
    const campaignRef = adminDb
      .collection(`marketing/email-campaigns/users/${userId}/campaigns`)
      .doc(campaignId);

    const campaignDoc = await campaignRef.get();
    if (!campaignDoc.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const campaign = campaignDoc.data() as Campaign;

    // Validate campaign is ready to send
    if (!campaign.content.html) {
      return NextResponse.json({ error: "Campaign has no content" }, { status: 400 });
    }

    if (campaign.recipientCount === 0) {
      return NextResponse.json({ error: "Campaign has no recipients" }, { status: 400 });
    }

    if (campaign.status === "sent" || campaign.status === "sending") {
      return NextResponse.json({ error: "Campaign already sent or sending" }, { status: 400 });
    }

    // Update campaign status to sending
    await campaignRef.update({
      status: "sending",
      sentAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
    });

    // For now, create a mock recipient list
    // TODO: Fetch actual recipients from audiences
    const mockRecipients = Array.from({ length: Math.min(campaign.recipientCount, 10) }, (_, i) => ({
      id: `contact_${i}`,
      email: `test${i}@example.com`,
      firstName: `Test${i}`,
      lastName: `User`,
    }));

    // Queue email jobs
    const jobIds: string[] = [];
    for (const recipient of mockRecipients) {
      // Prepare email content
      let html = campaign.content.html;
      
      // Replace merge tags
      html = replaceMergeTags(html, recipient);
      
      // Add tracking
      if (campaign.tracking.trackClicks) {
        html = wrapLinksWithTracking(html, campaignId, recipient.id);
      }
      if (campaign.tracking.trackOpens) {
        html = injectTrackingPixel(html, campaignId, recipient.id);
      }
      
      // Add unsubscribe link
      html = addUnsubscribeLink(html, campaignId, recipient.id);

      // Queue job
      const jobId = await addEmailJob({
        campaignId,
        contactId: recipient.id,
        contactEmail: recipient.email,
        subject: replaceMergeTags(campaign.subject, recipient),
        html,
        plainText: campaign.content.plainText,
      });

      jobIds.push(jobId);
    }

    // Update campaign with job info
    await campaignRef.update({
      stats: {
        sent: mockRecipients.length,
        delivered: 0,
        bounced: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0,
        complained: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        clickToOpenRate: 0,
        unsubscribeRate: 0,
        lastUpdatedAt: Timestamp.now() as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Campaign queued for sending to ${mockRecipients.length} recipients`,
      jobsCreated: jobIds.length,
    });
  } catch (error: any) {
    console.error("Error sending campaign:", error);
    return NextResponse.json(
      { error: "Failed to send campaign", message: error.message },
      { status: 500 }
    );
  }
}
