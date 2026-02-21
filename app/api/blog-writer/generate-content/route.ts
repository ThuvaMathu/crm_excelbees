import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import OpenAI from "openai";
import { GenerateContentRequest, BlogPost } from "@/types/blog-writer";
import {
  getContentGenerationPrompt,
  analyzeKeywordUsage,
  calculateReadabilityScore,
  calculateSEOScore,
  analyzeContentStructure,
  countWords,
} from "@/lib/blog-writer/utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body: GenerateContentRequest = await request.json();
    const { blogId, outline, configuration, userId } = body;

    if (!userId || !blogId) {
      return NextResponse.json(
        { error: "User ID and Blog ID required" },
        { status: 400 }
      );
    }

    console.log(`✍️ Generating blog content for: ${blogId}, User: ${userId}`);

    // Get blog from database
    const blogDoc = await db
      .collection(`marketing/blog-writer/users/${userId}/blogs`)
      .doc(blogId)
      .get();

    if (!blogDoc.exists) {
      console.error(`❌ Blog not found: ${blogId}`);
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const blog = blogDoc.data() as BlogPost;
    console.log(`📖 Blog data loaded: ${blog.title}`);

    // Generate prompt
    const prompt = getContentGenerationPrompt(
      outline || blog.outline,
      configuration || blog.configuration,
      blog.primaryKeyword || "topic",
      blog.secondaryKeywords || []
    );

    // Determine max tokens based on target word count
    const targetWords = (configuration?.wordCount || blog.configuration?.wordCount || 2000);
    let maxTokens = 4000;
    if (targetWords <= 1300) maxTokens = 2500;
    else if (targetWords <= 2600) maxTokens = 4000;
    else if (targetWords <= 3800) maxTokens = 6000;
    else maxTokens = 8500;

    console.log(`🤖 Calling OpenAI GPT-4o with maxTokens: ${maxTokens}...`);

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert blog writer. Write high-quality, SEO-optimized content in HTML format following the provided outline and specifications.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      });
    } catch (openaiError) {
      console.error("❌ OpenAI API Error:", openaiError);
      throw new Error(`OpenAI API failed: ${openaiError instanceof Error ? openaiError.message : "Unknown error"}`);
    }

    let content = completion.choices[0].message.content || "";

    // Remove markdown code blocks if present
    content = content
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```\s*$/, "");
    if (!content) {
      throw new Error("OpenAI returned an empty content response.");
    }

    console.log(`✅ Content generated (${content.length} characters)`);

    // Post-process content
    // Extract image placeholders
    const imageMatches = content.matchAll(/<!--\s*IMAGE:\s*([^-]+)-->/gi);
    const extractedImages = Array.from(imageMatches).map((match, i) => ({
      id: `img-content-${i}-${Date.now()}`,
      location: `Section ${i + 1}`,
      type: "content-image",
      description: (match[1] || "Relevant image").trim(),
    }));

    // Extract CTA placeholders
    const ctaMatches = content.matchAll(/<!--\s*CTA:\s*([^-]+)-->/gi);
    const extractedCTAs = Array.from(ctaMatches).map((match, i) => ({
      id: `cta-content-${i}-${Date.now()}`,
      location: `Section ${i + 1}`,
      type: (match[1] || "button").trim(),
      suggestedText: `Join our ${(match[1] || "newsletter").trim()}`,
    }));

    // Calculate metrics
    console.log("📊 Calculating SEO and Readability metrics...");
    const actualWordCount = countWords(content);
    const actualReadingTime = Math.ceil(actualWordCount / 250);
    const readabilityScore = calculateReadabilityScore(content);

    const currentConfig = configuration || blog.configuration;

    const keywordUsage = analyzeKeywordUsage(
      content,
      blog.title || "Blog Post",
      blog.primaryKeyword || "",
      blog.secondaryKeywords || []
    );
    const seoScore = calculateSEOScore(
      content,
      blog.title || "Blog Post",
      blog.description || "",
      blog.primaryKeyword || "",
      blog.secondaryKeywords || [],
      currentConfig
    );
    const structure = analyzeContentStructure(content);

    console.log(`📊 Metrics: WordCount=${actualWordCount}, SEO=${seoScore.toFixed(0)}, Readability=${readabilityScore.toFixed(0)}`);

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

    // Generate tags from keywords
    const tagsSet = new Set<string>();
    if (blog.primaryKeyword) tagsSet.add(blog.primaryKeyword.toLowerCase().trim());
    (blog.secondaryKeywords || []).forEach((kw: string) => {
      if (kw) tagsSet.add(kw.toLowerCase().trim());
    });
    // Also pull from outline keywords if available
    const outlineData = outline || blog.outline;
    if (outlineData?.seoStrategy?.internalLinkOpportunities) {
      outlineData.seoStrategy.internalLinkOpportunities.forEach((kw: string) => {
        if (kw) tagsSet.add(kw.toLowerCase().trim());
      });
    }
    const generatedTags = Array.from(tagsSet).slice(0, 10); // Cap at 10 tags

    // Update blog in database
    const updatedBlog = cleanObject({
      content,
      tags: generatedTags,
      actualWordCount,
      actualReadingTime,
      readabilityScore,
      seoScore,
      keywordDensity: keywordUsage.primary.density,
      keywordUsage,
      imagePlaceholders: [
        ...(blog.imagePlaceholders || []),
        ...extractedImages,
      ],
      ctaPlaceholders: [...(blog.ctaPlaceholders || []), ...extractedCTAs],
      status: "in_progress",
      updatedAt: new Date(),
      version: (blog.version || 1) + 1,
    });

    // Store version in history
    const versionHistory = cleanObject([
      ...(blog.versionHistory || []),
      {
        version: blog.version || 1,
        content: blog.content || "",
        updatedAt: new Date(),
        changes: "Initial content generation",
        wordCount: actualWordCount,
      },
    ]);

    console.log("💾 Updating blog document in Firestore (with deep cleaning)...");
    await db
      .collection(`marketing/blog-writer/users/${userId}/blogs`)
      .doc(blogId)
      .update({
        ...updatedBlog,
        versionHistory,
      });

    console.log("✅ Blog updated successfully.");

    return NextResponse.json({
      blogId,
      content,
      metrics: {
        actualWordCount,
        targetWordCount: currentConfig.wordCount,
        actualReadingTime,
        readabilityScore,
        seoScore,
        keywordDensity: keywordUsage.primary.density,
        keywordUsage,
        structure,
      },
      imagePlaceholders: extractedImages,
      ctaPlaceholders: extractedCTAs,
    });
  } catch (error) {
    console.error("❌ Fatal Error in Generate Content Route:", error);
    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
