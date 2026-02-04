import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Audience, AudienceInput } from "@/types/email-campaigns";
import { generateAudienceId, cleanObject } from "@/lib/email-campaigns/utils";
import { Timestamp } from "firebase-admin/firestore";

// GET /api/marketing/campaigns/audiences - List all audiences
// POST /api/marketing/campaigns/audiences - Create new audience
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // filter by type

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    let query = adminDb
      .collection(`marketing/email-campaigns/users/${userId}/audiences`)
      .orderBy("createdAt", "desc");

    if (type) {
      query = query.where("type", "==", type) as any;
    }

    const snapshot = await query.get();
    const audiences: Audience[] = [];

    snapshot.forEach((doc) => {
      audiences.push({ id: doc.id, ...doc.data() } as Audience);
    });

    return NextResponse.json({ audiences, total: audiences.length });
  } catch (error: any) {
    console.error("Error fetching audiences:", error);
    return NextResponse.json(
      { error: "Failed to fetch audiences", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, audience } = body as { userId: string; audience: AudienceInput };

    if (!userId || !audience) {
      return NextResponse.json(
        { error: "User ID and audience data required" },
        { status: 400 }
      );
    }

    if (!audience.name || !audience.type) {
      return NextResponse.json(
        { error: "Missing required fields: name, type" },
        { status: 400 }
      );
    }

    const audienceId = generateAudienceId();
    const now = Timestamp.now();

    const newAudience: Audience = {
      ...audience,
      id: audienceId,
      contactCount: audience.contacts?.length || 0,
      createdAt: now as any,
      updatedAt: now as any,
    };

    const cleanedAudience = cleanObject(newAudience);

    await adminDb
      .collection(`marketing/email-campaigns/users/${userId}/audiences`)
      .doc(audienceId)
      .set(cleanedAudience);

    return NextResponse.json({ audience: newAudience, id: audienceId }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating audience:", error);
    return NextResponse.json(
      { error: "Failed to create audience", message: error.message },
      { status: 500 }
    );
  }
}
