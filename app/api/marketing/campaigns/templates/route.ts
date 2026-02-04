import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { EmailTemplate, TemplateInput as EmailTemplateInput } from "@/types/email-campaigns";
import { generateCampaignId, cleanObject } from "@/lib/email-campaigns/utils"; // Reusing ID generator
import { Timestamp } from "firebase-admin/firestore";

// GET /api/marketing/campaigns/templates - List templates
// POST /api/marketing/campaigns/templates - Create template
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const category = searchParams.get("category");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // specific user templates
    const userTemplatesFn = adminDb
      .collection(`marketing/email-campaigns/users/${userId}/templates`)
      .orderBy("createdAt", "desc")
      .get();
      
    // system templates (global) - optional, assuming a shared collection
    // const systemTemplatesFn = adminDb.collection('marketing/email-campaigns/system/templates').get();

    const [userSnapshot] = await Promise.all([userTemplatesFn]);
    
    const templates: EmailTemplate[] = [];

    userSnapshot.forEach((doc) => {
      templates.push({ id: doc.id, ...doc.data() } as EmailTemplate);
    });

    if (category) {
        return NextResponse.json({ 
            templates: templates.filter(t => t.category === category), 
            total: templates.length 
        });
    }

    return NextResponse.json({ templates, total: templates.length });
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, template } = body as { userId: string; template: EmailTemplateInput };

    if (!userId || !template) {
      return NextResponse.json(
        { error: "User ID and template data required" },
        { status: 400 }
      );
    }

    if (!template.name || !template.html) {
      return NextResponse.json(
        { error: "Missing required fields: name, html" },
        { status: 400 }
      );
    }

    const templateId = `temp_${Date.now()}`;
    const now = Timestamp.now();

    const newTemplate: EmailTemplate = {
      ...template,
      id: templateId,
      isSystem: false,
      usageCount: 0,
      createdAt: now as any,
      updatedAt: now as any,
    };

    const cleanedTemplate = cleanObject(newTemplate);

    await adminDb
      .collection(`marketing/email-campaigns/users/${userId}/templates`)
      .doc(templateId)
      .set(cleanedTemplate);

    return NextResponse.json({ template: newTemplate, id: templateId }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template", message: error.message },
      { status: 500 }
    );
  }
}
