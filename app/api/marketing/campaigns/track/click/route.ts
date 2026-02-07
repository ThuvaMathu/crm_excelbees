import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// GET /api/marketing/campaigns/track/click - Track link clicks and redirect
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const c = searchParams.get("c"); // campaignId
    const ct = searchParams.get("ct"); // contactId
    const l = searchParams.get("l"); // linkId
    const u = searchParams.get("u"); // originalUrl

    if (!c || !ct || !u) {
      return NextResponse.json({ error: "Invalid tracking parameters" }, { status: 400 });
    }

    const campaignId = c as string;
    const contactId = ct as string;
    const originalUrl = u as string;
    const linkId = l || "unknown";

    // Store the click event
    const eventData = {
      campaignId,
      contactId,
      contactEmail: searchParams.get("email") || "",
      eventType: "clicked" as const,
      timestamp: Timestamp.now(),
      metadata: {
        linkId,
        linkUrl: decodeURIComponent(originalUrl),
        userAgent: request.headers.get("user-agent") || "",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      },
    };

    // Store click event
    await adminDb
      .collection(`marketing/email-campaigns/events`)
      .add({
        ...eventData,
        userId: searchParams.get("userId") || "",
      });

    // Update campaign stats asynchronously
    updateCampaignStats(campaignId, "clicked").catch((err) =>
      console.error("Failed to update campaign stats:", err)
    );

    // Redirect to the original URL
    return NextResponse.redirect(originalUrl, 302);
  } catch (error) {
    console.error("Error tracking click:", error);
    // Try to redirect anyway
    const originalUrl = decodeURIComponent(
      new URL(request.url).searchParams.get("u") || "/"
    );
    return NextResponse.redirect(originalUrl, 302);
  }
}

// Helper function to update campaign stats
async function updateCampaignStats(
  campaignId: string,
  eventType: "opened" | "clicked" | "bounced" | "unsubscribed"
) {
  console.log(`Stats update needed for campaign ${campaignId}: ${eventType}`);
}
