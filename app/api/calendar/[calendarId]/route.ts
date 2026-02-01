import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { Calendar } from "@/types/calendar";
import { cleanObject } from "@/lib/calendar/utils";

// GET /api/calendar/[calendarId] - Fetch single calendar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { calendarId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    console.log(`📅 Fetching calendar: ${calendarId} for user: ${userId}`);

    const calendarDoc = await db
      .collection(`marketing/calendar/users/${userId}/calendars`)
      .doc(calendarId)
      .get();

    if (!calendarDoc.exists) {
      return NextResponse.json(
        { error: "Calendar not found" },
        { status: 404 }
      );
    }

    const data = calendarDoc.data();
    const calendar: Calendar = {
      id: calendarDoc.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
    } as Calendar;

    console.log(`✅ Calendar fetched: ${calendar.name}`);

    return NextResponse.json({ calendar });
  } catch (error) {
    console.error("❌ Error fetching calendar:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar" },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/[calendarId] - Update calendar
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const body = await request.json();
    const { userId, ...updates } = body;
    const { calendarId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    console.log(`📅 Updating calendar: ${calendarId} for user: ${userId}`);

    // Verify calendar exists and belongs to user
    const calendarDoc = await db
      .collection(`marketing/calendar/users/${userId}/calendars`)
      .doc(calendarId)
      .get();

    if (!calendarDoc.exists) {
      return NextResponse.json(
        { error: "Calendar not found" },
        { status: 404 }
      );
    }

    const updatedData = cleanObject({
      ...updates,
      updatedAt: new Date(),
    });

    await db
      .collection(`marketing/calendar/users/${userId}/calendars`)
      .doc(calendarId)
      .update(updatedData);

    console.log(`✅ Calendar updated: ${calendarId}`);

    // Fetch updated calendar
    const updated = await db
      .collection(`marketing/calendar/users/${userId}/calendars`)
      .doc(calendarId)
      .get();

    const data = updated.data();
    const calendar: Calendar = {
      id: updated.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
    } as Calendar;

    return NextResponse.json({ calendar });
  } catch (error) {
    console.error("❌ Error updating calendar:", error);
    return NextResponse.json(
      { error: "Failed to update calendar" },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/[calendarId] - Delete calendar and all plans
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { calendarId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    console.log(`📅 Deleting calendar: ${calendarId} for user: ${userId}`);

    // Verify calendar exists
    const calendarDoc = await db
      .collection(`marketing/calendar/users/${userId}/calendars`)
      .doc(calendarId)
      .get();

    if (!calendarDoc.exists) {
      return NextResponse.json(
        { error: "Calendar not found" },
        { status: 404 }
      );
    }

    // Delete all plans associated with this calendar
    const plansSnapshot = await db
      .collection(`marketing/calendar/users/${userId}/plans`)
      .where("calendarId", "==", calendarId)
      .get();

    const batch = db.batch();

    plansSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the calendar
    batch.delete(
      db.collection(`marketing/calendar/users/${userId}/calendars`).doc(calendarId)
    );

    await batch.commit();

    console.log(`✅ Calendar and ${plansSnapshot.size} plans deleted`);

    return NextResponse.json({
      success: true,
      deletedPlans: plansSnapshot.size,
    });
  } catch (error) {
    console.error("❌ Error deleting calendar:", error);
    return NextResponse.json(
      { error: "Failed to delete calendar" },
      { status: 500 }
    );
  }
}
