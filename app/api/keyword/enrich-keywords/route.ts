/**
 * API Route: Enrich Keywords (Step 7)
 * POST /api/keyword/enrich-keywords
 *
 * Enriches keywords with search metrics using Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { batchArray, generateId } from '@/lib/keyword/utils';
import { adminDb as db } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_MODELS } from "@/lib/ai/config";
import type {
  EnrichKeywordsRequest,
  EnrichKeywordsResponse,
  EnrichedKeyword,
} from '@/types/keyword-research';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body: EnrichKeywordsRequest = await request.json();
    const { researchId, consolidatedKeywords, requestedCount } = body;

    if (!researchId || !consolidatedKeywords) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`🚀 [Keyword API] Enrich Keywords: ${consolidatedKeywords.length} keywords`);

    // Take top N keywords by relevance score
    const topKeywords = consolidatedKeywords
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, requestedCount || 50);

    const enrichedKeywords: EnrichedKeyword[] = [];

    // Process in batches of 10
    const batches = batchArray(topKeywords, 10);

    for (const batch of batches) {
      try {
        console.log(`🔄 [Keyword API] Enriching batch of ${batch.length} keywords...`);

        const keywordList = batch.map(kw => kw.primaryKeyword).join('\n');

        const model = genAI.getGenerativeModel({
          model: AI_MODELS.GEMINI_PRO,
          generationConfig: { responseMimeType: 'application/json' },
        });

        const systemPrompt = 'You are an SEO metrics expert. Provide search metrics for keywords. Return valid JSON only.';
        const prompt = `Provide SEO metrics for these keywords:\n\n${keywordList}\n\nFor each keyword, provide:\n1. Monthly search volume (approximate)\n2. Keyword difficulty (low/medium/high)\n3. Search trend (rising/stable/declining)\n4. CPC (cost per click, if available)\n5. Top 3 ranking domains\n\nReturn as JSON array:\n[\n  {\n    "keyword": "string",\n    "searchVolume": number,\n    "searchVolumeCategory": "low" | "medium" | "high",\n    "difficulty": "low" | "medium" | "high",
    "trend": "rising" | "stable" | "declining",
    "cpc": "string (optional)",
    "topRankingDomains": ["string"]
  }\n]\n\nIf exact data unavailable, provide educated estimates based on keyword specificity.`;

        const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);

        const resultText = result.response.text();
        if (!resultText) continue;

        // Clean up response (remove markdown code blocks if present)
        const cleanedResult = resultText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
        const parsed = JSON.parse(cleanedResult);
        const metricsData = parsed.keywords || parsed.metrics || [];

        for (const metric of metricsData) {
          const originalKeyword = batch.find(kw => kw.primaryKeyword === metric.keyword);
          if (!originalKeyword) continue;

          const enriched: EnrichedKeyword = {
            ...originalKeyword,
            searchVolume: metric.searchVolume || 0,
            searchVolumeCategory: metric.searchVolumeCategory || 'medium',
            difficulty: metric.difficulty || 'medium',
            trend: metric.trend || 'stable',
            cpc: metric.cpc,
            topRankingDomains: metric.topRankingDomains || [],
            whichCompetitorsRank: Array.from(new Set(originalKeyword.sources.map(s => s.competitor))),
          };

          enrichedKeywords.push(enriched);

          // Store in Firestore
          await db
            .collection(`marketing/keyword/researches/${researchId}/final_keywords`)
            .doc(originalKeyword.keywordId)
            .set(enriched);
        }

        console.log(`✅ [Keyword API] Batch enriched: ${metricsData.length} keywords`);
      } catch (error) {
        console.error('Error enriching batch:', error);
      }
    }

    // Update research document
    await db.collection('marketing/keyword/researches').doc(researchId).update({
      currentStep: 7,
      updatedAt: new Date(),
    });

    console.log(`✅ [Keyword API] Enrichment complete: ${enrichedKeywords.length} keywords`);

    const response: EnrichKeywordsResponse = {
      enrichedKeywords,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error enriching keywords:', error);
    return NextResponse.json(
      {
        error: 'Failed to enrich keywords',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
