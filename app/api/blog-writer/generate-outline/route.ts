import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import {
  GenerateOutlineRequest,
  BlogOutline,
  BlogPost,
} from "@/types/blog-writer";
import { getOutlineGenerationPrompt } from "@/lib/blog-writer/utils";
import { generateJSON } from "@/services/ai/gemini-provider";
import { blogOutlineSchema } from "@/schema/blog-writer";

export async function POST(request: NextRequest) {
  try {
    const body: GenerateOutlineRequest = await request.json();
    const { primaryKeyword, secondaryKeywords, configuration, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (!primaryKeyword) {
      return NextResponse.json(
        { error: "Primary keyword required" },
        { status: 400 }
      );
    }

    console.log("🎯 Request payload validated. Generating blog outline for:", primaryKeyword);

    // Generate prompt
    const prompt = getOutlineGenerationPrompt(
      primaryKeyword,
      secondaryKeywords,
      configuration
    );

    // Call Gemini Pro
    console.log("🤖 Calling Gemini Pro...");
    let outline: BlogOutline;
    try {
      outline = await generateJSON<BlogOutline>(
        "pro",
        "You are an expert SEO content strategist. Always respond with valid JSON only following the requested structure.",
        prompt,
        blogOutlineSchema
      );
    } catch (apiError) {
      console.error("❌ Gemini API Error:", apiError);
      throw new Error(`Gemini API failed: ${apiError instanceof Error ? apiError.message : "Unknown error"}`);
    }

    console.log("✅ Outline generated successfully:", outline.workingTitle);

    // Create blog document in database
    // Use a clean ID instead of generating from a dummy doc location
    const blogId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Helper to clean undefined values recursively
    const cleanObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(v => cleanObject(v)).filter(v => v !== undefined);
      } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        return Object.fromEntries(
          Object.entries(obj)
            .map(([k, v]) => [k, cleanObject(v)])
            .filter(([_, v]) => v !== undefined)
        );
      }
      return obj;
    };

    const blogPost = cleanObject({
      id: blogId,
      userId,
      slug: outline.slug || `blog-${Date.now()}`,
      title: outline.workingTitle || "Untitled Blog Post",
      description: outline.metaDescription || "",
      content: "",
      tags: [],

      configuration,

      primaryKeyword,
      secondaryKeywords: secondaryKeywords || [],

      mainImageAIPrompt: outline.mainImageAIPrompt || "",
      imagePlaceholders: (outline.visualContent || []).map((v, i) => ({
        id: `img-${i}`,
        location: v.location || "",
        type: v.type || "section-image",
        description: v.description || "",
        aiPrompt: v.aiImagePrompt || "",
      })),
      ctaPlaceholders: (outline.ctaPlacement || []).map((c, i) => ({
        id: `cta-${i}`,
        location: c.location || "",
        type: c.type || "button",
        suggestedText: c.suggestedText || "Click here",
      })),

      targetWordCount: configuration.wordCount || 2000,
      actualWordCount: 0,
      targetReadingTime: configuration.readingTime || 8,
      actualReadingTime: 0,

      outline,

      seoScore: 0,
      readabilityScore: 0,
      keywordDensity: 0,
      keywordUsage: {
        primary: {
          count: 0,
          density: 0,
          inTitle: false,
          inFirstParagraph: false,
          inHeadings: 0,
        },
        secondary: [],
      },

      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),

      version: 1,
      versionHistory: [],
    });

    // Save to Firestore
    console.log(`💾 Saving blog to: marketing/blog-writer/users/${userId}/blogs/${blogId} (with deep cleaning)`);
    await db
      .collection(`marketing/blog-writer/users/${userId}/blogs`)
      .doc(blogId)
      .set(blogPost);

    console.log("✅ Blog saved to database successfully.");

    return NextResponse.json({
      blogId,
      outline,
      seoStrategy: outline.seoStrategy,
      visualContent: outline.visualContent || [],
      estimatedMetrics: outline.estimatedMetrics,
    });
  } catch (error) {
    console.error("❌ Fatal Error in Generate Outline Route:", error);
    return NextResponse.json(
      {
        error: "Failed to generate outline",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
