import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Campaign } from "@/types/email-campaigns";

// POST /api/marketing/campaigns/[campaignId]/clone - Clone campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const body = await request.json();
    const { userId } = body as { userId: string };
    const { campaignId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get original campaign
    const originalDoc = await adminDb
      .collection(`marketing/email-campaigns/users/${userId}/campaigns`)
      .doc(campaignId)
      .get();

    if (!originalDoc.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const original = originalDoc.data() as Campaign;

    // Create cloned campaign
    const clonedCampaign: Partial<Campaign> = {
      ...original,
      name: `${original.name} (Copy)`,
      status: "draft",
      stats: undefined,
      sentAt: undefined,
      completedAt: undefined,
      scheduledAt: undefined,
    };

    // Use the campaigns POST endpoint logic
    const createResponse = await fetch(
      `${request.nextUrl.origin}/api/marketing/campaigns`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, campaign: clonedCampaign }),
      }
    );

    const result = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(result.error || "Failed to clone campaign");
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error cloning campaign:", error);
    return NextResponse.json(
      { error: "Failed to clone campaign", message: error.message },
      { status: 500 }
    );
  }
}
