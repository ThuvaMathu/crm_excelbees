import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Campaign } from "@/types/email-campaigns";
import { cleanObject } from "@/lib/email-campaigns/utils";
import { Timestamp } from "firebase-admin/firestore";

// GET /api/marketing/campaigns/[campaignId] - Get single campaign
export async function GET(
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

    const doc = await adminDb
      .collection(`marketing/email-campaigns/users/${userId}/campaigns`)
      .doc(campaignId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const campaign = { id: doc.id, ...doc.data() } as Campaign;
    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign", message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/marketing/campaigns/[campaignId] - Update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const body = await request.json();
    const { userId, updates } = body as { userId: string; updates: Partial<Campaign> };
    const { campaignId } = await params;

    if (!userId || !updates) {
      return NextResponse.json(
        { error: "User ID and updates required" },
        { status: 400 }
      );
    }

    const campaignRef = adminDb
      .collection(`marketing/email-campaigns/users/${userId}/campaigns`)
      .doc(campaignId);

    const doc = await campaignRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const cleanedUpdates = cleanObject({
      ...updates,
      updatedAt: Timestamp.now(),
    });

    await campaignRef.update(cleanedUpdates);

    const updated = await campaignRef.get();
    const campaign = { id: updated.id, ...updated.data() } as Campaign;

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/marketing/campaigns/[campaignId] - Delete campaign
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

    const doc = await campaignRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Check if campaign can be deleted (not sent or sending)
    const campaign = doc.data() as Campaign;
    if (campaign.status === "sending" || campaign.status === "sent") {
      return NextResponse.json(
        { error: "Cannot delete sent or sending campaigns. Archive instead." },
        { status: 400 }
      );
    }

    await campaignRef.delete();

    return NextResponse.json({ success: true, message: "Campaign deleted" });
  } catch (error: any) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign", message: error.message },
      { status: 500 }
    );
  }
}
