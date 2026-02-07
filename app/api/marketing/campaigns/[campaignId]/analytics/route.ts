import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { CampaignEvent, Campaign } from "@/types/email-campaigns";
import { calculateCampaignStats } from "@/lib/email-campaigns/utils";

interface AnalyticsResponse {
  stats: ReturnType<typeof calculateCampaignStats>;
  linkClicks: Record<string, number>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  timeline: Record<string, { opens: number; clicks: number }>;
  totalEvents: number;
}

// GET /api/marketing/campaigns/[campaignId]/analytics - Get campaign analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { campaignId } = params;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get campaign
    const campaignDoc = await adminDb
      .collection(`marketing/email-campaigns/users/${userId}/campaigns`)
      .doc(campaignId)
      .get();

    if (!campaignDoc.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const campaign = campaignDoc.data() as Campaign | undefined;

    // Get all events for this campaign
    const eventsSnapshot = await adminDb
      .collection(`marketing/email-campaigns/users/${userId}/campaigns/${campaignId}/events`)
      .get();

    const events: CampaignEvent[] = [];
    eventsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.eventType && data.contactId) {
        events.push({ id: doc.id, ...data } as CampaignEvent);
      }
    });

    // Use campaign recipient count if no sent events
    const sent = campaign?.recipientCount ?? events.filter((e) => e.eventType === "sent").length;
    const delivered = events.filter((e) => e.eventType === "delivered").length;
    const opened = new Set(
      events.filter((e) => e.eventType === "opened").map((e) => e.contactId)
    ).size;
    const clicked = new Set(
      events.filter((e) => e.eventType === "clicked").map((e) => e.contactId)
    ).size;
    const bounced = events.filter((e) => e.eventType === "bounced").length;
    const unsubscribed = events.filter((e) => e.eventType === "unsubscribed").length;

    const stats = calculateCampaignStats(
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      unsubscribed
    );

    // Get click breakdown
    const clickEvents = events.filter((e) => e.eventType === "clicked");
    const linkClicks: Record<string, number> = {};
    clickEvents.forEach((event) => {
      const url = event.metadata?.linkUrl || "unknown";
      linkClicks[url] = (linkClicks[url] || 0) + 1;
    });

    // Get device breakdown
    const deviceBreakdown = {
      desktop: events.filter((e) => e.metadata?.deviceType === "desktop").length,
      mobile: events.filter((e) => e.metadata?.deviceType === "mobile").length,
      tablet: events.filter((e) => e.metadata?.deviceType === "tablet").length,
    };

    // Get timeline data (opens/clicks over time)
    const timeline: Record<string, { opens: number; clicks: number }> = {};
    events.forEach((event) => {
      if ((event.eventType === "opened" || event.eventType === "clicked") && event.timestamp) {
        const date = event.timestamp.toDate().toISOString().split("T")[0];
        if (!timeline[date]) {
          timeline[date] = { opens: 0, clicks: 0 };
        }
        if (event.eventType === "opened") timeline[date].opens++;
        if (event.eventType === "clicked") timeline[date].clicks++;
      }
    });

    const response: AnalyticsResponse = {
      stats,
      linkClicks,
      deviceBreakdown,
      timeline,
      totalEvents: events.length,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics", message: errorMessage },
      { status: 500 }
    );
  }
}
