import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// GET /api/marketing/campaigns/track/open - Track email opens (tracking pixel)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const c = searchParams.get("c"); // campaignId
    const ct = searchParams.get("ct"); // contactId

    if (!c || !ct) {
      // Return 1x1 transparent pixel
      const pixel = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      );
      return new NextResponse(pixel, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    const campaignId = c as string;
    const contactId = ct as string;

    // Extract userId from campaign path (for collection structure)
    // In production, you might want to include userId in the tracking URL
    // For now, we'll try to find the campaign across all users

    // Store the open event
    const eventData = {
      campaignId,
      contactId,
      contactEmail: searchParams.get("email") || "",
      eventType: "opened",
      timestamp: Timestamp.now(),
      metadata: {
        userAgent: request.headers.get("user-agent") || "",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      },
    };

    // Try to find the campaign and add event to the correct user collection
    // In production, you'd want to optimize this with a proper index
    const eventsRef = adminDb
      .collectionGroup("campaign-events")
      .where("campaignId", "==", campaignId)
      .limit(1);

    // For now, store in a shared events collection with userId lookup
    await adminDb
      .collection(`marketing/email-campaigns/events`)
      .add({
        ...eventData,
        userId: searchParams.get("userId") || "",
      });

    // Update campaign stats asynchronously
    // In production, use a counter/sharding strategy for high volume
    updateCampaignStats(campaignId, "opened").catch((err) =>
      console.error("Failed to update campaign stats:", err)
    );

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    return new NextResponse(pixel, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error tracking open:", error);
    // Still return the pixel to avoid broken images
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    return new NextResponse(pixel, {
      headers: { "Content-Type": "image/gif" },
    });
  }
}

// Helper function to update campaign stats
async function updateCampaignStats(
  campaignId: string,
  eventType: "opened" | "clicked" | "bounced" | "unsubscribed"
) {
  // This would typically be handled by a background job
  // For now, it's a no-op that could trigger stats recalculation
  console.log(`Stats update needed for campaign ${campaignId}: ${eventType}`);
}
