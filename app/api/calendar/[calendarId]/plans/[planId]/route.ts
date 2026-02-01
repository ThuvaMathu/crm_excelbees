
import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { Plan } from "@/types/calendar";
import { cleanObject } from "@/lib/calendar/utils";

// GET /api/calendar/[calendarId]/plans/[planId] - Fetch single plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string; planId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { planId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    console.log(`📋 Fetching plan: ${planId}`);

    const planDoc = await db
      .collection(`marketing/calendar/users/${userId}/plans`)
      .doc(planId)
      .get();

    if (!planDoc.exists) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    const data = planDoc.data();
    const plan: Plan = {
      id: planDoc.id,
      ...data,
      start: data?.start?.toDate() || new Date(),
      end: data?.end?.toDate() || new Date(),
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
    } as Plan;

    console.log(`✅ Plan fetched: ${plan.title}`);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("❌ Error fetching plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan" },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/[calendarId]/plans/[planId] - Update plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string; planId: string }> }
) {
  try {
    const body = await request.json();
    const { userId, ...updates } = body;
    const { planId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    console.log(`📋 Updating plan: ${planId}`);

    // Verify plan exists
    const planDoc = await db
      .collection(`marketing/calendar/users/${userId}/plans`)
      .doc(planId)
      .get();

    if (!planDoc.exists) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    const existingPlan = planDoc.data();

    // Add activity log entry
    const activityLog = existingPlan?.activityLog || [];
    activityLog.push({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      action: "Plan updated",
      userId,
      details: Object.keys(updates).join(", "),
    });

    const updatedData = cleanObject({
      ...updates,
      updatedAt: new Date(),
      activityLog,
    });

    await db
      .collection(`marketing/calendar/users/${userId}/plans`)
      .doc(planId)
      .update(updatedData);

    console.log(`✅ Plan updated: ${planId}`);

    // Fetch updated plan
    const updated = await db
      .collection(`marketing/calendar/users/${userId}/plans`)
      .doc(planId)
      .get();

    const data = updated.data();
    const plan: Plan = {
      id: updated.id,
      ...data,
      start: data?.start?.toDate() || new Date(),
      end: data?.end?.toDate() || new Date(),
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
    } as Plan;

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("❌ Error updating plan:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/[calendarId]/plans/[planId] - Delete plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string; planId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { calendarId, planId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    console.log(`📋 Deleting plan: ${planId}`);

    // Verify plan exists
    const planDoc = await db
      .collection(`marketing/calendar/users/${userId}/plans`)
      .doc(planId)
      .get();

    if (!planDoc.exists) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Delete the plan
    await db
      .collection(`marketing/calendar/users/${userId}/plans`)
      .doc(planId)
      .delete();

    // Update calendar's active plans count
    const calendarRef = db
      .collection(`marketing/calendar/users/${userId}/calendars`)
      .doc(calendarId);

    await calendarRef.update({
      activePlansCount: FieldValue.increment(-1),
      updatedAt: new Date(),
    });

    console.log(`✅ Plan deleted: ${planId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting plan:", error);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}
