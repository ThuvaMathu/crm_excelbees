/**
 * Agent A: The Strategist
 *
 * Role: Strategic analysis and planning using Google Gemini Flash
 * Input: URL, Name, or Description
 * Output: Business Profile + Initial Seed Keywords (20)
 */

import { scrapeWebsite } from "@/services/jinaAI";
import { geminiClient } from "@/lib/ai/gemini";
import { AI_MODELS } from "@/lib/ai/config";

export interface StrategistInput {
  url?: string;
  name?: string;
  description?: string;
  competitors?: string[];
}

export interface BusinessProfile {
  industry: string;
  mainServices: string[];
  targetAudience: string;
  businessType: "B2B" | "B2C" | "Local" | "E-commerce";
  geographicScope: "Local" | "Regional" | "National" | "Global";
  valueProposition: string[];
  brandVoice: string;
}

export interface StrategistOutput {
  businessProfile: BusinessProfile;
  seedKeywords: string[];
  competitorsIdentified: string[];
  analyzedAt: Date;
}

const STRATEGIST_PROMPT = `
You are a business strategy expert and SEO specialist. Analyze the provided business/website and generate:

1. CORE PRODUCT PILLARS (5-7 main offerings)
2. TARGET AUDIENCE (primary customer segments)
3. VALUE PROPOSITION (unique selling points)
4. BRAND VOICE (tone, personality)

From this analysis, generate 20 SEED KEYWORDS that represent the business's core offerings.
These keywords should:
- Represent actual search terms users would use
- Cover different stages of the buyer journey (awareness, consideration, conversion)
- Include a mix of head terms (short, high volume) and long-tail terms (specific, lower volume)

Format as JSON:
{
  "businessProfile": {
    "industry": "string",
    "mainServices": ["service1", "service2", ...],
    "targetAudience": "string",
    "businessType": "B2B" | "B2C" | "Local" | "E-commerce",
    "geographicScope": "Local" | "Regional" | "National" | "Global",
    "valueProposition": ["value1", "value2", ...],
    "brandVoice": "string"
  },
  "seedKeywords": ["keyword1", "keyword2", ...],
  "competitorsIdentified": ["competitor1", "competitor2", ...]
}

Respond with ONLY valid JSON, no markdown code blocks.
`;

/**
 * Analyze business using Gemini Flash
 */
export async function analyzeBusiness(input: StrategistInput): Promise<StrategistOutput> {
  console.log(`[Strategist Agent] Analyzing business: ${input.url || input.name || input.description?.substring(0, 50)}...`);

  let businessContext = "";

  // Scrape website if URL provided
  if (input.url) {
    console.log(`[Strategist Agent] Scraping website: ${input.url}`);
    try {
      const scrapeResult = await scrapeWebsite(input.url, 30000);
      if (scrapeResult.success && scrapeResult.content) {
        businessContext = `
Website Content:
${scrapeResult.content.substring(0, 10000)} // Limit to 10k chars for prompt
        `.trim();
      }
    } catch (error) {
      console.warn("[Strategist Agent] Scraping failed, continuing with provided info:", error);
    }
  }

  // Build full prompt
  const prompt = `
${STRATEGIST_PROMPT}

Business Information:
${input.url ? `Website URL: ${input.url}` : ""}
${input.name ? `Business Name: ${input.name}` : ""}
${input.description ? `Description: ${input.description}` : ""}
${input.competitors?.length ? `Known Competitors: ${input.competitors.join(", ")}` : ""}

${businessContext ? `
${businessContext}
` : ""}
  `.trim();

  try {
    // Import genAI function
    const { genAI: geminiGenAI } = await import("@/lib/ai/gemini");

    // Use Gemini 1.5 Flash for cost efficiency
    const result = await geminiGenAI({
      model: AI_MODELS.GEMINI_PRO,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const responseText = result.response.text();

    // Clean and parse JSON
    const cleanJson = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (error) {
       console.warn("Strategist: Failed to parse JSON, attempting repair", cleanJson);
       // Simple repair: Try to find the first { and last }
       const start = cleanJson.indexOf("{");
       const end = cleanJson.lastIndexOf("}");
       if (start !== -1 && end !== -1) {
         try {
           parsed = JSON.parse(cleanJson.substring(start, end + 1));
         } catch (e2) {
            console.error("Strategist: JSON repair failed");
            throw new Error("Failed to parse analysis results from Gemini."); 
         }
       } else {
         throw new Error("Failed to parse analysis results: Invalid JSON format.");
       }
    }

    // Validate and structure output
    const output: StrategistOutput = {
      businessProfile: {
        industry: parsed?.businessProfile?.industry || "Unknown",
        mainServices: parsed?.businessProfile?.mainServices || [],
        targetAudience: parsed?.businessProfile?.targetAudience || "",
        businessType: parsed?.businessProfile?.businessType || "B2C",
        geographicScope: parsed?.businessProfile?.geographicScope || "National",
        valueProposition: parsed?.businessProfile?.valueProposition || [],
        brandVoice: parsed?.businessProfile?.brandVoice || "Professional",
      },
      seedKeywords: Array.isArray(parsed?.seedKeywords)
        ? parsed.seedKeywords.slice(0, 20)
        : [],
      competitorsIdentified: Array.isArray(parsed?.competitorsIdentified)
        ? parsed.competitorsIdentified
        : [],
      analyzedAt: new Date(),
    };

    console.log(`[Strategist Agent] Analysis complete: ${output.seedKeywords.length} seed keywords generated`);

    return output;
  } catch (error) {
    console.error("[Strategist Agent] Analysis failed:", error);

    // Fallback: Return minimal output
    return {
      businessProfile: {
        industry: input.name || "Unknown",
        mainServices: [],
        targetAudience: "",
        businessType: "B2C",
        geographicScope: "National",
        valueProposition: [],
        brandVoice: "Professional",
      },
      seedKeywords: [],
      competitorsIdentified: input.competitors || [],
      analyzedAt: new Date(),
    };
  }
}

/**
 * Generate additional keyword variations from seed keywords
 */
export async function generateVariations(seedKeywords: string[]): Promise<string[]> {
  if (seedKeywords.length === 0) {
    return [];
  }

  console.log(`[Strategist Agent] Generating variations for ${seedKeywords.length} seed keywords`);

  const prompt = `
Generate 3-5 keyword variations for each of these seed keywords.
Focus on:
- Question-based variations (how, what, why, best)
- Location-based variations (near me, local, services)
- Intent-based variations (guide, tutorial, cheap, affordable, vs)

Seed Keywords:
${seedKeywords.map((kw, i) => `${i + 1}. ${kw}`).join("\n")}

Respond as a JSON array of strings:
["variation1", "variation2", ...]

Only respond with the JSON array, no other text.
  `.trim();

  try {
    const { genAI: geminiGenAI } = await import("@/lib/ai/gemini");

    const result = await geminiGenAI({
      model: AI_MODELS.GEMINI_PRO,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = result.response.text();

    const cleanJson = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const variations = JSON.parse(cleanJson);

    console.log(`[Strategist Agent] Generated ${variations.length} keyword variations`);

    return Array.isArray(variations) ? variations : [];
  } catch (error) {
    console.error("[Strategist Agent] Variation generation failed:", error);
    return [];
  }
}

/**
 * Identify competitor keywords from a list of competitor URLs
 */
export async function identifyCompetitorKeywords(
  competitorUrls: string[],
  businessContext: BusinessProfile
): Promise<string[]> {
  if (!geminiClient || competitorUrls.length === 0) {
    return [];
  }

  console.log(`[Strategist Agent] Analyzing ${competitorUrls.length} competitors`);

  const prompt = `
Analyze these competitor websites and extract keywords they are likely targeting.

Business Context:
- Industry: ${businessContext.industry}
- Main Services: ${businessContext.mainServices.join(", ")}
- Target Audience: ${businessContext.targetAudience}

Competitor URLs:
${competitorUrls.map((url, i) => `${i + 1}. ${url}`).join("\n")}

Generate a list of 20-30 keywords these competitors are likely targeting.
Focus on keywords that would also be relevant for our business.

Respond as a JSON array of strings:
["keyword1", "keyword2", ...]

Only respond with the JSON array.
  `.trim();

  try {
    const model = geminiClient.getGenerativeModel({
      model: AI_MODELS.GEMINI_PRO,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleanJson = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const competitorKeywords = JSON.parse(cleanJson);

    console.log(`[Strategist Agent] Extracted ${competitorKeywords.length} competitor keywords`);

    return Array.isArray(competitorKeywords) ? competitorKeywords : [];
  } catch (error) {
    console.error("[Strategist Agent] Competitor keyword extraction failed:", error);
    return [];
  }
}
