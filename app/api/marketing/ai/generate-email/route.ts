import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/services/ai/gemini-provider";
import { emailGenerationSchema } from "@/schema/competitor-analysis";

// POST /api/marketing/ai/generate-email - Generate email content with AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, quickPrompt, goal, targetAudience, tone, length, includeElements, customInstructions } = body;

    let prompt = "";

    if (mode === "quick" && quickPrompt) {
      // One-click mode
      prompt = `Generate a professional marketing email about: "${quickPrompt}"

Requirements:
- Create 3 compelling subject line options
- Write engaging email body content (200-300 words)
- Include a clear call-to-action
- Use professional, friendly tone
- Format as HTML with proper structure

Return JSON format:
{
  "subjectLines": ["option1", "option2", "option3"],
  "previewText": "preview text",
  "html": "full HTML content",
  "plainText": "plain text version"
}`;
    } else {
      // Detailed mode with options
      const toneMap: Record<string, string> = {
        professional: "professional and business-like",
        friendly: "warm and conversational",
        urgent: "urgent and action-oriented",
        formal: "formal and corporate",
        casual: "casual and relaxed",
      };

      const lengthMap: Record<string, string> = {
        short: "100-200 words, concise and to the point",
        standard: "200-400 words, balanced detail",
        detailed: "400-600 words, comprehensive information",
      };

      prompt = `Generate a marketing email with the following specifications:

Goal: ${goal || "general marketing"}
Target Audience: ${targetAudience || "general audience"}
Tone: ${toneMap[tone || "professional"]}
Length: ${lengthMap[length || "standard"]}

${includeElements?.cta ? "- Include a prominent call-to-action button" : ""}
${includeElements?.testimonials ? "- Include space for customer testimonials" : ""}
${includeElements?.urgency ? "- Add urgency/scarcity elements" : ""}
${includeElements?.socialProof ? "- Include social proof elements" : ""}
${includeElements?.benefits ? "- Highlight key benefits" : ""}
${includeElements?.personalization ? "- Use merge tags like {{FirstName}}, {{Company}}" : ""}

${customInstructions ? `Additional Instructions: ${customInstructions}` : ""}

Return JSON format:
{
  "subjectLines": ["option1", "option2", "option3"],
  "previewText": "preview text for inbox",
  "html": "full HTML email content with inline CSS",
  "plainText": "plain text version"
}`;
    }

    const content = await generateJSON(
      "flash",
      "You are an expert email marketing copywriter. Generate compelling, conversion-focused email content.",
      prompt,
      emailGenerationSchema
    );

    return NextResponse.json(content);
  } catch (error: any) {
    console.error("Error generating email content:", error);
    return NextResponse.json(
      { error: "Failed to generate content", message: error.message },
      { status: 500 }
    );
  }
}
