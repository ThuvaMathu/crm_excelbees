import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIGenerateRequest, Plan } from "@/types/calendar";
import { getPlanGenerationPrompt } from "@/lib/calendar/ai-prompts";
import { generatePlanId } from "@/lib/calendar/utils";
import { AI_MODELS } from "@/lib/ai/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

    console.log(`🤖 Calling Gemini...`);

    // Call Gemini
    const model = genAI.getGenerativeModel({
      model: AI_MODELS.GEMINI_PRO,
      generationConfig: { responseMimeType: "application/json" },
    });

    const systemPrompt = "You are an expert AI planning assistant. Generate realistic, actionable calendar plans in JSON format.";

    const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);

    let generatedContent = result.response.text() || "";

    // Remove markdown code blocks if present
    generatedContent = generatedContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```\s*$/, "");

    console.log(`✅ AI response received, parsing JSON...`);

    // Parse JSON response
    let aiPlans: any[];
    try {
      aiPlans = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error("❌ Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response", details: generatedContent },
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
