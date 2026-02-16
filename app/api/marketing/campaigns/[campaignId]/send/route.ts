import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Campaign } from "@/types/email-campaigns";
import { addEmailJob, addScheduledJob } from "@/lib/email-campaigns/queue";
import { wrapLinksWithTracking, injectTrackingPixel, replaceMergeTags } from "@/lib/email-campaigns/utils";
import { addUnsubscribeLink } from "@/lib/email-campaigns/mailer";
import { Timestamp } from "firebase-admin/firestore";

interface SendRequest {
  userId: string;
  scheduledFor?: string | Date; // ISO date string for scheduled sends
}

// POST /api/marketing/campaigns/[campaignId]/send - Send or schedule campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;
    const body = await request.json();
    const { userId, scheduledFor } = body as SendRequest;

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
    if (!campaign.content?.html) {
      return NextResponse.json({ error: "Campaign has no content" }, { status: 400 });
    }

    if (campaign.recipientCount === 0) {
      return NextResponse.json({ error: "Campaign has no recipients" }, { status: 400 });
    }

    if (campaign.status === "sent" || campaign.status === "sending" || campaign.status === "scheduled") {
      return NextResponse.json(
        { error: `Campaign already ${campaign.status}` },
        { status: 400 }
      );
    }

    // Check if this is a scheduled send
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);

      // Validate scheduled date is in the future
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: "Scheduled time must be in the future" },
          { status: 400 }
        );
      }

      // Don't allow scheduling more than 1 year in advance
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      if (scheduledDate > maxDate) {
        return NextResponse.json(
          { error: "Cannot schedule more than 1 year in advance" },
          { status: 400 }
        );
      }

      // Update campaign to scheduled status
      await campaignRef.update({
        status: "scheduled",
        scheduledFor: Timestamp.fromDate(scheduledDate) as any,
        updatedAt: Timestamp.now() as any,
      });

      // Add scheduled job to queue
      await addScheduledJob({
        campaignId,
        userId,
        scheduledFor: scheduledDate,
      });

      return NextResponse.json({
        success: true,
        message: `Campaign scheduled for ${scheduledDate.toLocaleString()}`,
        scheduledFor: scheduledDate.toISOString(),
      });
    }

    // Immediate send
    // Update campaign status to sending
    await campaignRef.update({
      status: "sending",
      sentAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
    });

    // Fetch recipients from audiences
    const recipients: Array<{
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      company?: string;
    }> = [];

    for (const audienceId of campaign.audienceIds || []) {
      const audienceDoc = await adminDb
        .collection(`marketing/email-campaigns/users/${userId}/audiences`)
        .doc(audienceId)
        .get();

      if (audienceDoc.exists) {
        const audience = audienceDoc.data();
        const contacts = audience?.contacts || [];
        for (const contact of contacts) {
          if (contact.subscribed && !contact.bounced && !contact.complained) {
            recipients.push({
              id: contact.id,
              email: contact.email,
              firstName: contact.firstName,
              lastName: contact.lastName,
              company: contact.company,
            });
          }
        }
      }
    }

    // Queue email jobs
    const jobIds: string[] = [];
    for (const recipient of recipients) {
      // Prepare email content
      let html = campaign.content.html;

      // Replace merge tags
      html = replaceMergeTags(html, recipient);

      // Add tracking
      if (campaign.tracking?.trackClicks) {
        html = wrapLinksWithTracking(html, campaignId, recipient.id);
      }
      if (campaign.tracking?.trackOpens) {
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
      recipientCount: recipients.length,
      stats: {
        sent: recipients.length,
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
      message: `Campaign queued for sending to ${recipients.length} recipients`,
      jobsCreated: jobIds.length,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to send campaign";
    console.error("Error sending campaign:", error);
    return NextResponse.json(
      { error: "Failed to send campaign", message: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/marketing/campaigns/[campaignId]/send - Cancel scheduled campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { campaignId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const campaignRef = adminDb
      .collection(`marketing/email-campaigns/users/${userId}/campaigns`)
      .doc(campaignId);

    const campaignDoc = await campaignRef.get();
    if (!campaignDoc.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const campaign = campaignDoc.data() as Campaign;

    if (campaign.status !== "scheduled") {
      return NextResponse.json(
        { error: "Only scheduled campaigns can be cancelled" },
        { status: 400 }
      );
    }

    // Reset to draft status
    await campaignRef.update({
      status: "draft",
      scheduledFor: null,
      updatedAt: Timestamp.now() as any,
    });

    // Remove from scheduled queue (implementation depends on queue system)
    await adminDb
      .collection(`marketing/email-campaigns/scheduled`)
      .doc(campaignId)
      .delete();

    return NextResponse.json({
      success: true,
      message: "Scheduled campaign cancelled",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to cancel campaign";
    console.error("Error cancelling campaign:", error);
    return NextResponse.json(
      { error: "Failed to cancel campaign", message: errorMessage },
      { status: 500 }
    );
  }
}
