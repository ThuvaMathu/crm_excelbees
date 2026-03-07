import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { AIGenerateRequest, Plan } from "@/types/calendar";
import { getPlanGenerationPrompt } from "@/lib/calendar/ai-prompts";
import { generatePlanId } from "@/lib/calendar/utils";
import { generateJSON } from "@/services/ai/gemini-provider";
import { calendarPlanSchema } from "@/schema/calendar";

// POST /api/calendar/ai-generate - Generate plans using AI
export async function POST(request: NextRequest) {
  try {
    const body: AIGenerateRequest = await request.json();
    const { calendarId, userId, timeRange, purpose, businessContext, frequency, distribution } = body;

    if (!userId || !calendarId || !timeRange) {
      return NextResponse.json(
        { error: "User ID, calendar ID, and time range required" },
        { status: 400 }
      );
    }

    console.log(`🤖 Generating AI plans for calendar: ${calendarId}`);

    // Fetch calendar to get configuration
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

    // Generate AI prompt
    const prompt = getPlanGenerationPrompt(body);

    let aiPlans: any[] = [];
    try {
      const generatedContent = await generateJSON<any>(
        "flash",
        "You are an expert AI planning assistant. Generate realistic, actionable calendar plans in JSON format.",
        prompt,
        calendarPlanSchema
      );
      aiPlans = generatedContent.plans || [];
      console.log(`✅ AI response received, parsed JSON...`);
    } catch (apiError) {
      console.error("❌ Gemini API Error:", apiError);
      return NextResponse.json(
        { error: "Failed to generate AI response", details: apiError instanceof Error ? apiError.message : "Unknown error" },
        { status: 500 }
      );
    }

    // Convert to Plan objects (don't save yet, return for review)
    const plans: Plan[] = aiPlans.map((aiPlan) => ({
      id: generatePlanId(),
      calendarId,
      userId,
      title: aiPlan.title,
      description: aiPlan.description || "",
      type: aiPlan.type || "task",
      start: new Date(aiPlan.start),
      end: new Date(aiPlan.end),
      allDay: aiPlan.allDay || false,
      priority: aiPlan.priority || "medium",
      status: "planned",
      tags: aiPlan.tags || [],
      assignedTo: undefined,
      recurring: undefined,
      dependencies: [],
      attachments: [],
      checklist: aiPlan.checklist || [],
      metadata: aiPlan.metadata,
      aiGenerated: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    console.log(`✅ Generated ${plans.length} plans`);

    return NextResponse.json({
      plans,
      count: plans.length,
    });
  } catch (error) {
    console.error("❌ Error in AI generation:", error);
    return NextResponse.json(
      {
        error: "Failed to generate plans",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
