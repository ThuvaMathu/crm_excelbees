import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { CalendarTemplate } from "@/types/calendar";
import { logger } from "@/lib/logger";

// Pre-built templates
const PRE_BUILT_TEMPLATES: CalendarTemplate[] = [
  {
    id: "template_30day_content",
    name: "30-Day Content Calendar",
    description: "Perfect for consistent content creation. Includes blog posts, social media, and newsletters.",
    category: "content",
    duration: 30,
    planCount: 20,
    frequency: "3x per week",
    isPreBuilt: true,
    plans: [],
    createdAt: new Date(),
    usedCount: 0,
  },
  {
    id: "template_weekly_business",
    name: "Weekly Business Operations",
    description: "Standard weekly tasks for business operations, meetings, and reviews.",
    category: "business",
    duration: 7,
    planCount: 15,
    frequency: "Weekdays only",
    isPreBuilt: true,
    plans: [],
    createdAt: new Date(),
    usedCount: 0,
  },
  {
    id: "template_product_launch",
    name: "Product Launch Campaign",
    description: "Complete 60-day campaign calendar for product launches.",
    category: "campaign",
    duration: 60,
    planCount: 35,
    frequency: "Milestone-based",
    isPreBuilt: true,
    plans: [],
    createdAt: new Date(),
    usedCount: 0,
  },
];

// GET /api/calendar/templates - Fetch all templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const category = searchParams.get("category");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    logger.debug("Fetching templates", { module: "calendar", action: "fetch", userId });

    // Get pre-built templates
    let preBuiltTemplates = PRE_BUILT_TEMPLATES;
    if (category && category !== "all") {
      preBuiltTemplates = PRE_BUILT_TEMPLATES.filter((t) => t.category === category);
    }

    // Get user's custom templates
    let query = db.collection("marketing/calendar/templates").where("userId", "==", userId);

    if (category && category !== "all") {
      query = query.where("category", "==", category) as any;
    }

    const snapshot = await query.get();

    const customTemplates: CalendarTemplate[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      customTemplates.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as CalendarTemplate);
    });

    logger.debug("Found templates", { module: "calendar", action: "fetch", userId, metadata: { preBuilt: preBuiltTemplates.length, custom: customTemplates.length } });

    return NextResponse.json({
      preBuilt: preBuiltTemplates,
      custom: customTemplates,
    });
  } catch (error) {
    logger.error("Error fetching templates", { module: "calendar", action: "fetch", error });
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/calendar/templates - Save custom template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description, category, plans } = body;

    if (!userId || !name || !plans) {
      return NextResponse.json(
        { error: "User ID, name, and plans required" },
        { status: 400 }
      );
    }

    logger.info("Creating template", { module: "calendar", action: "create", metadata: { name } });

    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newTemplate: Omit<CalendarTemplate, "id"> = {
      name,
      description: description || "",
      category: category || "custom",
      duration: plans.length > 0 ? 30 : 0, // Calculate from plans
      planCount: plans.length,
      frequency: "Custom",
      isPreBuilt: false,
      userId,
      plans,
      createdAt: new Date(),
      usedCount: 0,
    };

    await db
      .collection("marketing/calendar/templates")
      .doc(templateId)
      .set(newTemplate);

    logger.info("Template created", { module: "calendar", action: "create", metadata: { templateId } });

    return NextResponse.json({
      template: {
        id: templateId,
        ...newTemplate,
      },
    });
  } catch (error) {
    logger.error("Error creating template", { module: "calendar", action: "create", error });
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
