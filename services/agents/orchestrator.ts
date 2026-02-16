/**
 * Keyword Orchestrator - Agentic Workflow Coordinator
 *
 * Coordinates the four-agent workflow:
 * Agent A (Strategist) → Agent B (Researcher) → Agent C (Auditor) → Agent D (Analyst)
 */

import { adminDb as db } from "@/lib/firebase-admin";
import { analyzeBusiness, generateVariations, type StrategistInput } from "./strategist-agent";
import { researchCompetitors, type ResearcherInput } from "./researcher-agent";
import { auditKeywords, type AuditorInput, type AuditorOutput } from "./auditor-agent";
import {
  analyzeKeywords,
  generateContentRecommendations,
  generateStrategicInsights,
  type AnalystOutput
} from "./analyst-agent";
import { KeywordCluster } from "@/lib/analysis/keyword-clustering";
import { generateVariants } from "@/lib/seo/config";

export interface OrchestratorInput {
  type: "quick" | "full-research";
  userId: string;
  workspaceId: string;
  url?: string;
  name?: string;
  description?: string;
  competitors?: string[];
  seoApiKey?: string;
  options?: {
    maxCompetitors?: number;
    pagesPerCompetitor?: number;
    requestedKeywordCount?: number;
    skipCompetitorResearch?: boolean;
  };
}

export interface OrchestratorProgress {
  agent: "strategist" | "researcher" | "auditor" | "analyst" | "complete";
  status: "running" | "complete" | "error";
  message: string;
  result?: any;
}

export type ProgressCallback = (progress: OrchestratorProgress) => void | Promise<void>;

export interface OrchestratorOutput {
  researchId: string;
  success: boolean;
  businessProfile?: any;
  clusters?: KeywordCluster[];
  keywords?: any[];
  contentRecommendations?: any[];
  strategicInsights?: any;
  funnelBreakdown?: {
    awareness: number;
    consideration: number;
    conversion: number;
  };
  statistics?: {
    totalCompetitors: number;
    totalPagesScraped: number;
    totalKeywordsAnalyzed: number;
    totalClusters: number;
  };
  error?: string;
}

/**
 * Run the full agentic keyword research workflow
 */
export async function runAgenticResearch(
  input: OrchestratorInput,
  progressCallback?: ProgressCallback
): Promise<OrchestratorOutput> {
  const {
    type,
    userId,
    workspaceId,
    url,
    name,
    description,
    competitors = [],
    seoApiKey,
    options = {},
  } = input;

  console.log(`[Orchestrator] Starting ${type} research for user ${userId}`);

  // Create research document
  const researchRef = await db.collection("marketing/keyword/researches").add({
    userId,
    workspaceId,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "analyzing",
    currentStep: 0,
    requestedKeywordCount: options.requestedKeywordCount || 100,
    businessWebsite: url || "",
    businessLocation: "",
    competitorSource: competitors.length > 0 ? "manual" : "auto",
    analysisDepth: {
      competitorCount: 0,
      pagesPerCompetitor: options.pagesPerCompetitor || 5,
      totalPages: 0,
    },
    pagePreferences: {
      prioritizeBlog: false,
      prioritizeServices: false,
      includeLocation: false,
      includeProducts: false,
    },
    researchType: "agentic",
  });

  const researchId = researchRef.id;
  console.log(`[Orchestrator] Created research document: ${researchId}`);

  try {
    // ============================
    // AGENT A: STRATEGIST
    // ============================
    await updateProgress(researchId, 1, progressCallback);
    await notifyProgress("strategist", "running", "Analyzing business and generating seed keywords...", progressCallback);

    console.log(`[Orchestrator] Agent A: Starting Strategist analysis`);

    const strategistResult = await analyzeBusiness({
      url,
      name,
      description,
      competitors: competitors.slice(0, 5), // Limit for prompt
    });

    const seedKeywords = strategistResult.seedKeywords;
    const identifiedCompetitors = [
      ...competitors,
      ...strategistResult.competitorsIdentified
    ].slice(0, options.maxCompetitors || 10);

    console.log(`[Orchestrator] Agent A: Generated ${seedKeywords.length} seed keywords`);
    console.log(`[Orchestrator] Agent A: Identified ${identifiedCompetitors.length} competitors`);

    // Store business profile
    await db.collection(`marketing/keyword/researches/${researchId}/business_context`).add({
      ...strategistResult.businessProfile,
      analyzedAt: new Date(),
      seedKeywords,
    });

    await notifyProgress("strategist", "complete", `Generated ${seedKeywords.length} seed keywords`, progressCallback, strategistResult);

    // ============================
    // AGENT B: RESEARCHER
    // ============================
    let competitorPages = 0;

    if (!options.skipCompetitorResearch && identifiedCompetitors.length > 0) {
      await updateProgress(researchId, 2, progressCallback);
      await notifyProgress("researcher", "running", `Researching ${identifiedCompetitors.length} competitors...`, progressCallback);

      console.log(`[Orchestrator] Agent B: Starting Competitor research`);

      const researcherResult = await researchCompetitors({
        seedKeywords,
        competitors: identifiedCompetitors,
        pagesPerCompetitor: options.pagesPerCompetitor || 5,
      });

      competitorPages = researcherResult.successfulScrapes;

      console.log(`[Orchestrator] Agent B: Scraped ${researcherResult.successfulScrapes} pages`);

      // Store scraped pages
      for (const page of researcherResult.pages) {
        await db.collection(`marketing/keyword/researches/${researchId}/competitor_pages`).add(page);
      }

      await notifyProgress("researcher", "complete", `Scraped ${researcherResult.successfulScrapes} competitor pages`, progressCallback, researcherResult);
    } else {
      console.log(`[Orchestrator] Agent B: Skipped (no competitors or skip requested)`);
    }

    // ============================
    // AGENT C: AUDITOR
    // ============================
    await updateProgress(researchId, 3, progressCallback);
    await notifyProgress("auditor", "running", "Enriching keywords with SEO metrics...", progressCallback);

    console.log(`[Orchestrator] Agent C: Starting SEO audit`);

    const auditorResult = await auditKeywords({
      seedKeywords,
      competitors: identifiedCompetitors,
      apiKey: seoApiKey,
      userId,
      workspaceId,
      researchId,
    });

    console.log(`[Orchestrator] Agent C: Enriched ${auditorResult.keywords.length} keywords`);
    console.log(`[Orchestrator] Agent C: Avg opportunity score: ${auditorResult.avgOpportunityScore.toFixed(1)}`);

    // Store enriched keywords
    const keywordsBatch = db.batch();
    for (const keyword of auditorResult.keywords.slice(0, 500)) { // Limit stored keywords
      const keywordRef = db.collection(`marketing/keyword/researches/${researchId}/keywords`).doc();
      keywordsBatch.set(keywordRef, keyword);
    }
    await keywordsBatch.commit();

    await notifyProgress("auditor", "complete", `Enriched ${auditorResult.keywords.length} keywords with SEO metrics`, progressCallback, auditorResult);

    // ============================
    // AGENT D: ANALYST
    // ============================
    await updateProgress(researchId, 4, progressCallback);
    await notifyProgress("analyst", "running", "Clustering keywords and generating insights...", progressCallback);

    console.log(`[Orchestrator] Agent D: Starting keyword analysis`);

    const analystResult = await analyzeKeywords({
      keywords: auditorResult.keywords,
      userId,
      workspaceId,
      researchId,
    });

    console.log(`[Orchestrator] Agent D: Created ${analystResult.totalClusters} keyword clusters`);

    // Store clusters
    for (const cluster of analystResult.clusters) {
      await db.collection(`marketing/keyword/researches/${researchId}/clusters`).add(cluster);
    }

    // Generate content recommendations
    const contentRecommendations = await generateContentRecommendations(
      analystResult.clusters,
      strategistResult.businessProfile
    );

    // Generate strategic insights
    const competitorGaps = identifyCompetitorGaps(auditorResult.keywords, identifiedCompetitors);
    const strategicInsights = await generateStrategicInsights(
      analystResult.clusters,
      competitorGaps
    );

    await notifyProgress("analyst", "complete", `Created ${analystResult.totalClusters} keyword clusters with insights`, progressCallback, {
      clusters: analystResult.clusters,
      contentRecommendations,
      strategicInsights,
    });

    // ============================
    // FINALIZE
    // ============================
    await updateProgress(researchId, 5, progressCallback);

    // Store content recommendations
    for (const rec of contentRecommendations) {
      await db.collection(`marketing/keyword/researches/${researchId}/recommendations`).add(rec);
    }

    // Store strategic insights
    await db.collection(`marketing/keyword/researches/${researchId}/insights`).add({
      ...strategicInsights,
      generatedAt: new Date(),
    });

    // Update research document as complete
    await db.collection("marketing/keyword/researches").doc(researchId).update({
      status: "complete",
      currentStep: 5,
      updatedAt: new Date(),
      "analysisDepth.competitorCount": identifiedCompetitors.length,
      "analysisDepth.totalPages": competitorPages,
    });

    const output: OrchestratorOutput = {
      researchId,
      success: true,
      businessProfile: strategistResult.businessProfile,
      clusters: analystResult.clusters,
      keywords: auditorResult.keywords,
      contentRecommendations,
      strategicInsights,
      funnelBreakdown: analystResult.funnelBreakdown,
      statistics: {
        totalCompetitors: identifiedCompetitors.length,
        totalPagesScraped: competitorPages,
        totalKeywordsAnalyzed: auditorResult.totalFound,
        totalClusters: analystResult.totalClusters,
      },
    };

    await notifyProgress("complete", "complete", `Research complete! ${analystResult.totalClusters} clusters created`, progressCallback, output);

    console.log(`[Orchestrator] Research complete: ${researchId}`);

    return output;

  } catch (error) {
    console.error("[Orchestrator] Research failed:", error);

    // Update research document as failed
    await db.collection("marketing/keyword/researches").doc(researchId).update({
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      updatedAt: new Date(),
    });

    await notifyProgress("analyst", "error", `Research failed: ${error instanceof Error ? error.message : "Unknown error"}`, progressCallback);

    return {
      researchId,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Run quick research (skip competitor research, focus on seed keywords)
 */
export async function runQuickResearch(
  input: OrchestratorInput,
  progressCallback?: ProgressCallback
): Promise<OrchestratorOutput> {
  console.log(`[Orchestrator] Running quick research`);

  // Quick research skips Agent B (Researcher)
  return runAgenticResearch(
    { ...input, options: { ...input.options, skipCompetitorResearch: true } },
    progressCallback
  );
}

// Helper functions

async function updateProgress(researchId: string, step: number, callback?: ProgressCallback) {
  await db.collection("marketing/keyword/researches").doc(researchId).update({
    currentStep: step,
    updatedAt: new Date(),
  });
}

async function notifyProgress(
  agent: OrchestratorProgress["agent"],
  status: OrchestratorProgress["status"],
  message: string,
  callback?: ProgressCallback,
  result?: any
) {
  if (callback) {
    await callback({
      agent,
      status,
      message,
      result,
    });
  }
}

/**
 * Identify competitor gaps - keywords we found that competitors might not be targeting
 */
function identifyCompetitorGaps(
  enrichedKeywords: any[],
  competitorUrls: string[]
): string[] {
  // For now, return top opportunity keywords as potential gaps
  // In production, this would analyze SERP features and competitor rankings
  return enrichedKeywords
    .filter(k => k.opportunityScore > 50 && k.difficulty < 40)
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 10)
    .map(k => k.keyword);
}
