import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Audience } from "@/types/email-campaigns";
import { cleanObject } from "@/lib/email-campaigns/utils";
import { Timestamp } from "firebase-admin/firestore";

// GET /api/marketing/campaigns/audiences/[audienceId]
export async function GET(
  request: NextRequest,
  { params }: { params: { audienceId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { audienceId } = params;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const doc = await adminDb
      .collection(`marketing/email-campaigns/users/${userId}/audiences`)
      .doc(audienceId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Audience not found" }, { status: 404 });
    }

    const audience = { id: doc.id, ...doc.data() } as Audience;
    return NextResponse.json({ audience });
  } catch (error: any) {
    console.error("Error fetching audience:", error);
    return NextResponse.json(
      { error: "Failed to fetch audience", message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/marketing/campaigns/audiences/[audienceId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { audienceId: string } }
) {
  try {
    const body = await request.json();
    const { userId, updates } = body as { userId: string; updates: Partial<Audience> };
    const { audienceId } = params;

    if (!userId || !updates) {
      return NextResponse.json(
        { error: "User ID and updates required" },
        { status: 400 }
      );
    }

    const audienceRef = adminDb
      .collection(`marketing/email-campaigns/users/${userId}/audiences`)
      .doc(audienceId);

    const doc = await audienceRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Audience not found" }, { status: 404 });
    }

    const cleanedUpdates = cleanObject({
      ...updates,
      updatedAt: Timestamp.now(),
    });

    await audienceRef.update(cleanedUpdates);

    const updated = await audienceRef.get();
    const audience = { id: updated.id, ...updated.data() } as Audience;

    return NextResponse.json({ audience });
  } catch (error: any) {
    console.error("Error updating audience:", error);
    return NextResponse.json(
      { error: "Failed to update audience", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/marketing/campaigns/audiences/[audienceId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { audienceId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { audienceId } = params;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await adminDb
      .collection(`marketing/email-campaigns/users/${userId}/audiences`)
      .doc(audienceId)
      .delete();

    return NextResponse.json({ success: true, message: "Audience deleted" });
  } catch (error: any) {
    console.error("Error deleting audience:", error);
    return NextResponse.json(
      { error: "Failed to delete audience", message: error.message },
      { status: 500 }
    );
  }
}
