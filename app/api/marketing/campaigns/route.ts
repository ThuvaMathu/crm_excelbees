import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Campaign, CampaignInput } from "@/types/email-campaigns";
import { generateCampaignId, cleanObject } from "@/lib/email-campaigns/utils";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// GET /api/marketing/campaigns - List all campaigns
// POST /api/marketing/campaigns - Create new campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status"); // filter by status
    const type = searchParams.get("type"); // filter by type
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    let query = adminDb
      .collection(`marketing/email-campaigns/users/${userId}/campaigns`)
      .orderBy("createdAt", "desc")
      .limit(limit);

    // Apply filters
    if (status) {
      query = query.where("status", "==", status) as any;
    }
    if (type) {
      query = query.where("type", "==", type) as any;
    }

    const snapshot = await query.get();
    const campaigns: Campaign[] = [];

    snapshot.forEach((doc) => {
      campaigns.push({ id: doc.id, ...doc.data() } as Campaign);
    });

    return NextResponse.json({ campaigns, total: campaigns.length });
  } catch (error: any) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, campaign } = body as { userId: string; campaign: CampaignInput };

    if (!userId || !campaign) {
      return NextResponse.json(
        { error: "User ID and campaign data required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!campaign.name || !campaign.type || !campaign.from || !campaign.subject) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, from, subject" },
        { status: 400 }
      );
    }

    const campaignId = generateCampaignId();
    const now = Timestamp.now();

    const newCampaign: Campaign = {
      ...campaign,
      id: campaignId,
      status: campaign.status || "draft",
      recipientCount: campaign.recipientCount || 0,
      createdAt: now as any,
      updatedAt: now as any,
    };

    // Clean undefined values
    const cleanedCampaign = cleanObject(newCampaign);

    await adminDb
      .collection(`marketing/email-campaigns/users/${userId}/campaigns`)
      .doc(campaignId)
      .set(cleanedCampaign);

    return NextResponse.json({ campaign: newCampaign, id: campaignId }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign", message: error.message },
      { status: 500 }
    );
  }
}
