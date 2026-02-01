import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { Plan } from "@/types/calendar";
import { generatePlanId, cleanObject, filterPlansByDateRange } from "@/lib/calendar/utils";

// GET /api/calendar/[calendarId]/plans - Fetch all plans for a calendar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { calendarId } = await params;

    // Optional filters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    console.log(`📋 Fetching plans for calendar: ${calendarId}`);

    let query = db
      .collection(`marketing/calendar/users/${userId}/plans`)
      .where("calendarId", "==", calendarId);

    // Apply filters
    if (type) {
      query = query.where("type", "==", type) as any;
    }
    if (status) {
      query = query.where("status", "==", status) as any;
    }
    if (priority) {
      query = query.where("priority", "==", priority) as any;
    }

    const snapshot = await query.get();

    let plans: Plan[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      plans.push({
        id: doc.id,
        ...data,
        start: data.start?.toDate() || new Date(),
        end: data.end?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Plan);
    });

    // Sort by start date in memory
    plans.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Apply date range filter if provided
    if (startDate && endDate) {
      plans = filterPlansByDateRange(
        plans,
        new Date(startDate),
        new Date(endDate)
      );
    }

    console.log(`✅ Found ${plans.length} plans`);

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("❌ Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

// POST /api/calendar/[calendarId]/plans - Create new plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const body = await request.json();
    const { userId, ...planData } = body;
    const { calendarId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    if (!planData.title || !planData.start || !planData.end) {
      return NextResponse.json(
        { error: "Title, start, and end dates are required" },
        { status: 400 }
      );
    }

    console.log(`📋 Creating plan: ${planData.title}`);

    const planId = generatePlanId();

    const newPlan: Omit<Plan, "id"> = {
      calendarId,
      userId,
      title: planData.title,
      description: planData.description || "",
      type: planData.type || "task",
      start: new Date(planData.start),
      end: new Date(planData.end),
      allDay: planData.allDay || false,
      priority: planData.priority || "medium",
      status: planData.status || "planned",
      tags: planData.tags || [],
      assignedTo: planData.assignedTo,
      recurring: planData.recurring,
      dependencies: planData.dependencies || [],
      attachments: planData.attachments || [],
      checklist: planData.checklist || [],
      metadata: planData.metadata,
      aiGenerated: planData.aiGenerated || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      activityLog: [
        {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          action: "Plan created",
          userId,
        },
      ],
    };

    const cleanedPlan = cleanObject(newPlan);

    await db
      .collection(`marketing/calendar/users/${userId}/plans`)
      .doc(planId)
      .set(cleanedPlan);

    // Update calendar's active plans count
    const calendarRef = db
      .collection(`marketing/calendar/users/${userId}/calendars`)
      .doc(calendarId);

    await calendarRef.update({
      activePlansCount: FieldValue.increment(1),
      updatedAt: new Date(),
    });

    console.log(`✅ Plan created: ${planId}`);

    return NextResponse.json({
      plan: {
        id: planId,
        ...newPlan,
      },
    });
  } catch (error) {
    console.error("❌ Error creating plan:", error);
    return NextResponse.json(
      { 
        error: "Failed to create plan",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
