import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { EmailTemplate } from "@/types/email-campaigns";
import { cleanObject } from "@/lib/email-campaigns/utils";
import { Timestamp } from "firebase-admin/firestore";

// GET /api/marketing/campaigns/templates/[templateId]
// PUT /api/marketing/campaigns/templates/[templateId]
// DELETE /api/marketing/campaigns/templates/[templateId]

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { templateId } = params;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const doc = await adminDb
      .collection(`marketing/email-campaigns/users/${userId}/templates`)
      .doc(templateId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const template = { id: doc.id, ...doc.data() } as EmailTemplate;
    return NextResponse.json({ template });
  } catch (error: any) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template", message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const body = await request.json();
    const { userId, updates } = body as { userId: string; updates: Partial<EmailTemplate> };
    const { templateId } = params;

    if (!userId || !updates) {
      return NextResponse.json(
        { error: "User ID and updates required" },
        { status: 400 }
      );
    }

    const templateRef = adminDb
      .collection(`marketing/email-campaigns/users/${userId}/templates`)
      .doc(templateId);

    const doc = await templateRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const cleanedUpdates = cleanObject({
      ...updates,
      updatedAt: Timestamp.now(),
    });

    await templateRef.update(cleanedUpdates);

    const updated = await templateRef.get();
    const template = { id: updated.id, ...updated.data() } as EmailTemplate;

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { templateId } = params;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await adminDb
      .collection(`marketing/email-campaigns/users/${userId}/templates`)
      .doc(templateId)
      .delete();

    return NextResponse.json({ success: true, message: "Template deleted" });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template", message: error.message },
      { status: 500 }
    );
  }
}
