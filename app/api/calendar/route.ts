import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { Calendar } from "@/types/calendar";
import { generateCalendarId, cleanObject } from "@/lib/calendar/utils";

// GET /api/calendar - Fetch all calendars for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const includeArchived = searchParams.get("includeArchived") === "true";

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    console.log(`📅 Fetching calendars for user: ${userId}`);

    const calendarsRef = db.collection(
      `marketing/calendar/users/${userId}/calendars`
    );

    const snapshot = await calendarsRef.get();

    const calendars: Calendar[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Filter archived calendars in code if needed
      if (!includeArchived && data.isArchived) {
        return;
      }
      
      calendars.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Calendar);
    });

    // Sort by createdAt in code
    calendars.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log(`✅ Found ${calendars.length} calendars`);

    return NextResponse.json({ calendars });
  } catch (error) {
    console.error("❌ Error fetching calendars:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendars" },
      { status: 500 }
    );
  }
}

// POST /api/calendar - Create new calendar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, purpose, description, defaultView, visibility, color, planTypes, settings } = body;

    if (!userId || !name || !purpose) {
      return NextResponse.json(
        { error: "User ID, name, and purpose are required" },
        { status: 400 }
      );
    }

    console.log(`📅 Creating calendar: ${name} for user: ${userId}`);

    const calendarId = generateCalendarId();

    const newCalendar: Omit<Calendar, "id"> = {
      userId,
      name,
      purpose,
      description: description || "",
      defaultView: defaultView || "monthly",
      visibility: visibility || "private",
      color: color || "#2196F3",
      planTypes: planTypes || ["task", "content", "meeting", "reminder", "campaign", "custom"],
      settings: settings || {
        startOfWeek: "monday",
        workingHours: { start: "09:00", end: "17:00" },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        enableRecurring: true,
        defaultRecurrence: "none",
        emailReminders: true,
        inAppNotifications: true,
        reminderTiming: 60,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      activePlansCount: 0,
      isArchived: false,
    };

    const cleanedCalendar = cleanObject(newCalendar);

    await db
      .collection(`marketing/calendar/users/${userId}/calendars`)
      .doc(calendarId)
      .set(cleanedCalendar);

    console.log(`✅ Calendar created: ${calendarId}`);

    return NextResponse.json({
      calendar: {
        id: calendarId,
        ...newCalendar,
      },
    });
  } catch (error) {
    console.error("❌ Error creating calendar:", error);
    return NextResponse.json(
      { error: "Failed to create calendar" },
      { status: 500 }
    );
  }
}
