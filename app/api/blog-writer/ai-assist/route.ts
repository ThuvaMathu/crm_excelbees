import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIAssistRequest } from "@/types/blog-writer";
import { getAIAssistPrompt } from "@/lib/blog-writer/utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const body: AIAssistRequest = await request.json();
    const { blogId, action, selection, context, userId, mode } = body;

    if (!userId || !blogId) {
      return NextResponse.json(
        { error: "User ID and Blog ID required" },
        { status: 400 }
      );
    }

    // Get blog configuration
    const blogDoc = await db
      .collection(`marketing/blog-writer/users/${userId}/blogs`)
      .doc(blogId)
      .get();

    if (!blogDoc.exists) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const blog = blogDoc.data();
    const configuration = blog?.configuration;

    if (!configuration) {
      return NextResponse.json(
        { error: "Blog configuration not found" },
        { status: 404 }
      );
    }

    // Generate AI assist prompt
    const prompt = getAIAssistPrompt(
      action,
      selection || "",
      context || "",
      configuration,
      mode || "generate" // Default to generate if missing
    );

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const systemPrompt = "You are an expert blog writing assistant.";

    const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);

    let generatedContent = result.response.text() || "";

    // Remove markdown code blocks if present (e.g., ```html ... ```)
    generatedContent = generatedContent
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```\s*$/, "");

    return NextResponse.json({ generatedContent });
  } catch (error) {
    console.error("Error in AI assist:", error);
    return NextResponse.json(
      { error: "Failed to generate AI assistance" },
      { status: 500 }
    );
  }
}
