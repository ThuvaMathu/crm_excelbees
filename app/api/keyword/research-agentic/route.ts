/**
 * API Route: Agentic Keyword Research
 * POST /api/keyword/research-agentic
 *
 * New agentic workflow using 4-agent architecture:
 * Agent A (Strategist) → Agent B (Researcher) → Agent C (Auditor) → Agent D (Analyst)
 */


export const maxDuration = 300; // 5 minutes for agentic workflow

import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { hasFeature } from "@/lib/auth/api-auth";
import { protectedRoute } from "@/lib/api/protected-route";
import { runAgenticResearch, runQuickResearch, type OrchestratorInput } from "@/services/agents/orchestrator";
import type { OrchestratorProgress } from "@/services/agents/orchestrator";

/**
 * Progress tracking map for long-running requests
 * In production, this would use Redis or a database
 */
const progressMap = new Map<string, OrchestratorProgress[]>();

/**
 * POST /api/keyword/research-agentic
 *
 * Request body:
 * {
 *   "type": "full-research" | "quick",
 *   "url": string,
 *   "name": string,
 *   "description": string,
 *   "competitors": string[],
 *   "seoApiKey": string, (optional)
 *   "options": {
 *     "maxCompetitors": number,
 *     "pagesPerCompetitor": number,
 *     "requestedKeywordCount": number,
 *     "skipCompetitorResearch": boolean
 *   }
 * }
 */
export const POST = protectedRoute(async (request, user) => {
  try {
    const body = await request.json();
    const {
      type = "full-research",
      url,
      name,
      description,
      competitors = [],
      seoApiKey,
      options = {},
    } = body;

    // Validate inputs
    if (!url && !name && !description) {
      return Response.json(
        { success: false, error: "At least one of url, name, or description is required" },
        { status: 400 }
      );
    }

    console.log(`[Agentic API] Starting ${type} research for user ${user.uid}`);

    // Check if user has keywordResearch feature
    if (!hasFeature(user, "keywordResearch") && user.role !== "admin") {
      return Response.json(
        { success: false, error: "Keyword Research feature not enabled" },
        { status: 403 }
      );
    }

    // Initialize progress tracking
    const researchId = `pending-${Date.now()}`;
    progressMap.set(researchId, []);

    // Progress callback to track agent execution
    const progressCallback = async (progress: OrchestratorProgress) => {
      const currentProgress = progressMap.get(researchId) || [];
      currentProgress.push(progress);
      progressMap.set(researchId, currentProgress);
      console.log(`[Agentic API] Agent ${progress.agent}: ${progress.status} - ${progress.message}`);
    };

    // Run the appropriate research type
    const input: OrchestratorInput = {
      type,
      userId: user.uid,
      workspaceId: user.uid, // Default workspace to user ID for now
      url,
      name,
      description,
      competitors,
      seoApiKey,
      options,
    };

    // Start research (don't await for synchronous response)
    const resultPromise = type === "quick"
      ? runQuickResearch(input, progressCallback)
      : runAgenticResearch(input, progressCallback);

    // For now, we'll await the result
    // In production, this would return immediately with a researchId for polling
    const result = await resultPromise;

    // Clean up progress tracking
    progressMap.delete(researchId);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error || "Research failed",
          researchId: result.researchId,
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      researchId: result.researchId,
      businessProfile: result.businessProfile,
      statistics: result.statistics,
      funnelBreakdown: result.funnelBreakdown,
      clusters: result.clusters?.map(c => ({
        clusterId: c.clusterId,
        label: c.label,
        topic: c.topic,
        funnelStage: c.funnelStage,
        opportunityScore: c.opportunityScore,
        keywordCount: c.keywords.length,
      })) || [],
      contentRecommendations: result.contentRecommendations || [],
      strategicInsights: result.strategicInsights || [],
    });

  } catch (error) {
    console.error("[Agentic API] Error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}, {
  requireAuth: true,
  requireFeature: "keywordResearch",
});

/**
 * GET /api/keyword/research-agentic?researchId={id}
 *
 * Get progress of a running research
 */
export const GET = protectedRoute(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const researchId = searchParams.get("researchId");

    if (!researchId) {
      return Response.json(
        { success: false, error: "researchId is required" },
        { status: 400 }
      );
    }

    // Check if user has access to this research
    // For pending researches, verify user owns the session
    if (researchId.startsWith("pending-")) {
      const progress = progressMap.get(researchId);
      return Response.json({
        success: true,
        researchId,
        status: "running",
        progress: progress || [],
      });
    }

    // For completed researches, fetch from Firestore
    const { adminDb } = await import('@/lib/firebase-admin');
    const researchDoc = await adminDb.collection("marketing/keyword/researches").doc(researchId).get();

    if (!researchDoc.exists) {
      return Response.json(
        { success: false, error: "Research not found" },
        { status: 404 }
      );
    }

    const researchData = researchDoc.data();

    // Verify ownership
    if (researchData?.userId !== user.uid && user.role !== "admin") {
      return Response.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Get clusters
    const clustersSnapshot = await adminDb.collection(`marketing/keyword/researches/${researchId}/clusters`).get();
    const clusters = clustersSnapshot.docs.map(doc => doc.data());

    return Response.json({
      success: true,
      researchId,
      status: researchData?.status || "unknown",
      currentStep: researchData?.currentStep || 0,
      statistics: {
        competitorCount: researchData?.analysisDepth?.competitorCount || 0,
        totalPages: researchData?.analysisDepth?.totalPages || 0,
        totalClusters: clusters.length,
      },
      clusters: clusters.map(c => ({
        clusterId: c.clusterId,
        label: c.label,
        topic: c.topic,
        funnelStage: c.funnelStage,
        opportunityScore: c.opportunityScore,
        keywordCount: c.keywords?.length || 0,
      })),
    });

  } catch (error) {
    console.error("[Agentic API] GET Error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}, {
  requireAuth: true,
  requireFeature: "keywordResearch",
});
