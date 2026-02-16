/**
 * Agent D: The Analyst
 *
 * Role: Semantic grouping and user intent classification using DBSCAN + Gemini
 * Input: Enriched keywords from Agent C
 * Output: Keyword clusters with strategic labels
 */

import { EnrichedKeyword as AuditorKeyword } from "./auditor-agent";
import { clusterKeywords, KeywordCluster, type EnrichedKeyword } from "@/lib/analysis/keyword-clustering";
import { CACHE_TTL } from "@/lib/redis";
import { adminDb as db } from "@/lib/firebase-admin";
import { genAI } from "@/lib/ai/gemini";

export interface AnalystInput {
  keywords: AuditorKeyword[];
  userId?: string;
  workspaceId?: string;
  researchId?: string;
}

export interface AnalystOutput {
  clusters: KeywordCluster[];
  totalKeywords: number;
  totalClusters: number;
  avgKeywordsPerCluster: number;
  funnelBreakdown: {
    awareness: number;
    consideration: number;
    conversion: number;
  };
  topOpportunityClusters: KeywordCluster[];
}

/**
 * Analyze keywords using clustering and intent classification
 */
export async function analyzeKeywords(input: AnalystInput): Promise<AnalystOutput> {
  const { keywords, userId, workspaceId, researchId } = input;

  console.log(`[Analyst Agent] Starting analysis for ${keywords.length} keywords`);

  // Check cache first
  let cachedClusters: KeywordCluster[] = [];
  if (researchId) {
    const cacheRef = db.collection(`marketing/keyword/researches/${researchId}/analysis_cache`);
    const cacheDoc = await cacheRef.doc("clusters").get();

    if (cacheDoc.exists) {
      const data = cacheDoc.data();
      const cachedAt = data?.cachedAt?.toDate?.() || data?.cachedAt;
      const age = Date.now() - (cachedAt?.getTime() || 0);

      // Cache is valid for 24 hours
      if (age < CACHE_TTL.PAGE_CONTENT) {
        console.log("[Analyst Agent] Using cached clusters");
        cachedClusters = data?.clusters || [];
      }
    }
  }

  // Convert AuditorKeyword to EnrichedKeyword format needed by clustering
  const enrichedKeywords: EnrichedKeyword[] = keywords.map(k => ({
    keyword: k.keyword,
    searchIntent: "informational", // Will be refined
    searchVolume: k.searchVolume,
    cpc: k.cpc,
    difficulty: k.difficulty,
    trend: k.trend,
    seedKeyword: k.isSeed,
  }));

  // Filter out keywords that are already in cached clusters
  const cachedKeywordSet = new Set(
    cachedClusters.flatMap(c => c.keywords.map(k => k.keyword.toLowerCase()))
  );
  const keywordsToCluster = enrichedKeywords.filter(
    k => !cachedKeywordSet.has(k.keyword.toLowerCase())
  );

  console.log(`[Analyst Agent] ${cachedClusters.length} cached clusters, ${keywordsToCluster.length} new keywords to cluster`);

  let newClusters: KeywordCluster[] = [];

  if (keywordsToCluster.length > 0) {
    try {
      // Run DBSCAN clustering
      newClusters = await clusterKeywords(keywordsToCluster);
      console.log(`[Analyst Agent] Generated ${newClusters.length} new clusters`);

      // Cache the new clusters
      if (researchId) {
        await db.collection(`marketing/keyword/researches/${researchId}/analysis_cache`)
          .doc("clusters_new")
          .set({
            clusters: newClusters,
            cachedAt: new Date(),
          });
      }
    } catch (error) {
      console.error("[Analyst Agent] Clustering failed:", error);
      // Fallback: Create single cluster per keyword
      newClusters = enrichedKeywords.map(k => createSingleKeywordCluster(k));
    }
  }

  // Merge cached and new clusters
  const allClusters = [...cachedClusters, ...newClusters];

  // Calculate statistics
  const totalClusters = allClusters.length;
  const avgKeywordsPerCluster = allClusters.length > 0
    ? keywords.length / allClusters.length
    : 0;

  // Funnel breakdown
  const funnelBreakdown = {
    awareness: allClusters.filter(c => c.funnelStage === "awareness").length,
    consideration: allClusters.filter(c => c.funnelStage === "consideration").length,
    conversion: allClusters.filter(c => c.funnelStage === "conversion").length,
  };

  // Top opportunity clusters (high average opportunity score)
  const topOpportunityClusters = allClusters
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 10);

  const output: AnalystOutput = {
    clusters: allClusters,
    totalKeywords: keywords.length,
    totalClusters,
    avgKeywordsPerCluster,
    funnelBreakdown,
    topOpportunityClusters,
  };

  console.log(`[Analyst Agent] Analysis complete: ${totalClusters} clusters`);
  console.log(`[Analyst Agent] Funnel breakdown:`, funnelBreakdown);

  return output;
}

/**
 * Generate content recommendations based on clusters
 */
export async function generateContentRecommendations(
  clusters: KeywordCluster[],
  businessContext?: {
    industry: string;
    mainServices: string[];
    targetAudience: string;
  }
): Promise<ContentRecommendation[]> {
  if (!genAI || clusters.length === 0) {
    return [];
  }

  console.log(`[Analyst Agent] Generating content recommendations for ${clusters.length} clusters`);

  // Prepare cluster summaries for the prompt
  const clusterSummaries = clusters
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 20)
    .map(c => ({
      id: c.clusterId,
      topic: c.topic,
      label: c.label,
      funnelStage: c.funnelStage,
      keywordCount: c.keywords.length,
      avgVolume: Math.round(c.keywords.reduce((sum, k) => sum + k.searchVolume, 0) / c.keywords.length),
      opportunityScore: c.opportunityScore,
    }));

  const prompt = `
You are a content strategy expert. Generate content recommendations for these keyword clusters.

${businessContext ? `
Business Context:
- Industry: ${businessContext.industry}
- Services: ${businessContext.mainServices.join(", ")}
- Target Audience: ${businessContext.targetAudience}
` : ""}

Keyword Clusters (sorted by opportunity):
${clusterSummaries.map((c, i) => `
${i + 1}. ${c.topic} (${c.funnelStage})
   - Keywords: ${c.keywordCount}
   - Avg Search Volume: ${c.avgVolume}
   - Opportunity Score: ${c.opportunityScore}
`).join("")}

For each of the top 10 clusters, recommend:
1. Content type (blog post, landing page, case study, etc.)
2. Target word count
3. Key topics to cover
4. Priority (1-10, based on opportunity)

Respond as JSON array:
[
  {
    "clusterId": "cluster-1",
    "contentType": "blog post",
    "targetWordCount": 1500,
    "keyTopics": ["topic1", "topic2"],
    "priority": 8,
    "titleSuggestion": "Compelling title here",
    "funnelStage": "awareness"
  }
]

Only respond with valid JSON, no markdown blocks.
  `.trim();

  try {
    const { genAI: geminiGenAI } = await import("@/lib/ai/gemini");

    const result = await geminiGenAI({
      model: "models/gemini-1.5-flash",
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

    const recommendations = JSON.parse(cleanJson);

    console.log(`[Analyst Agent] Generated ${recommendations.length} content recommendations`);

    return Array.isArray(recommendations) ? recommendations : [];
  } catch (error) {
    console.error("[Analyst Agent] Content recommendation generation failed:", error);
    return [];
  }
}

/**
 * Generate strategic insights from clusters
 */
export async function generateStrategicInsights(
  clusters: KeywordCluster[],
  competitorGaps?: string[]
): Promise<StrategicInsights> {
  console.log(`[Analyst Agent] Generating strategic insights from ${clusters.length} clusters`);

  // High-level cluster statistics
  const topClusters = clusters
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 10);

  const funnelDistribution = {
    awareness: clusters.filter(c => c.funnelStage === "awareness").length,
    consideration: clusters.filter(c => c.funnelStage === "consideration").length,
    conversion: clusters.filter(c => c.funnelStage === "conversion").length,
  };

  const totalVolume = clusters.reduce(
    (sum, c) => sum + c.keywords.reduce((s, k) => s + k.searchVolume, 0),
    0
  );

  const prompt = `
You are an SEO strategy expert. Analyze these keyword clusters and generate strategic insights.

Cluster Statistics:
- Total Clusters: ${clusters.length}
- Total Search Volume: ${totalVolume.toLocaleString()}
- Funnel Distribution: Awareness (${funnelDistribution.awareness}), Consideration (${funnelDistribution.consideration}), Conversion (${funnelDistribution.conversion})

Top 10 Clusters by Opportunity:
${topClusters.map((c, i) => `
${i + 1}. ${c.topic} (${c.label})
   - Funnel Stage: ${c.funnelStage}
   - Keywords: ${c.keywords.length}
   - Opportunity Score: ${c.opportunityScore}
`).join("")}

${competitorGaps && competitorGaps.length > 0 ? `
Competitor Gaps (keywords competitors don't target):
${competitorGaps.join(", ")}
` : ""}

Provide strategic insights in this JSON format:
{
  "quickWins": ["actionable recommendation 1", "actionable recommendation 2"],
  "longTermOpportunities": ["strategic recommendation 1"],
  "contentGaps": ["gap 1", "gap 2"],
  "competitiveAdvantages": ["advantage 1"],
  "recommendedFocus": "main focus area",
  "estimatedTimeline": "timeline description"
}

Only respond with valid JSON.
  `.trim();

  try {
    const { genAI: geminiGenAI } = await import("@/lib/ai/gemini");

    const result = await geminiGenAI({
      model: "models/gemini-1.5-flash",
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = result.response.text();

    const cleanJson = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const insights = JSON.parse(cleanJson);

    console.log("[Analyst Agent] Strategic insights generated");

    return {
      quickWins: insights.quickWins || [],
      longTermOpportunities: insights.longTermOpportunities || [],
      contentGaps: insights.contentGaps || [],
      competitiveAdvantages: insights.competitiveAdvantages || [],
      recommendedFocus: insights.recommendedFocus || "Not specified",
      estimatedTimeline: insights.estimatedTimeline || "Not specified",
    };
  } catch (error) {
    console.error("[Analyst Agent] Insight generation failed:", error);
    return createDefaultInsights();
  }
}

// Helper functions

function createSingleKeywordCluster(keyword: EnrichedKeyword): KeywordCluster {
  return {
    clusterId: `cluster-${keyword.keyword.replace(/\s+/g, "-").toLowerCase()}`,
    keywords: [keyword],
    label: keyword.keyword,
    topic: keyword.keyword,
    funnelStage: "awareness",
    opportunityScore: Math.round((keyword.searchVolume * keyword.cpc) / Math.max(keyword.difficulty, 1)),
    createdAt: new Date(),
  };
}

function createDefaultInsights(): StrategicInsights {
  return {
    quickWins: [
      "Target low-competition keywords with decent search volume",
      "Create content around high-opportunity clusters",
    ],
    longTermOpportunities: [
      "Build authority in high-difficulty topics over time",
      "Develop comprehensive content clusters",
    ],
    contentGaps: [],
    competitiveAdvantages: [],
    recommendedFocus: "Not specified",
    estimatedTimeline: "Not specified",
  };
}

// Type exports

export interface ContentRecommendation {
  clusterId: string;
  contentType: string;
  targetWordCount: number;
  keyTopics: string[];
  priority: number;
  titleSuggestion: string;
  funnelStage: string;
}

export interface StrategicInsights {
  quickWins: string[];
  longTermOpportunities: string[];
  contentGaps: string[];
  competitiveAdvantages: string[];
  recommendedFocus: string;
  estimatedTimeline: string;
}
