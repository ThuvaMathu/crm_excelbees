/**
 * API Route: Enrich Keywords (Step 7)
 * POST /api/keyword/enrich-keywords
 * 
 * Enriches keywords with search metrics using GPT-4o Web Search
 */

import { NextRequest, NextResponse } from 'next/server';
import { batchArray, generateId } from '@/lib/keyword/utils';
import { adminDb as db } from '@/lib/firebase-admin';
import type {
  EnrichKeywordsRequest,
  EnrichKeywordsResponse,
  EnrichedKeyword,
} from '@/types/keyword-research';
import { generateJSON } from '@/services/ai/gemini-provider';
import { enrichKeywordsSchema } from '@/schema/keyword-analysis';

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

        const prompt = `Provide SEO metrics for these keywords:

${keywordList}

For each keyword, provide:
1. Monthly search volume (approximate)
2. Keyword difficulty (low/medium/high)
3. Search trend (rising/stable/declining)
4. CPC (cost per click, if available)
5. Top 3 ranking domains

If exact data unavailable, provide educated estimates based on keyword specificity.`;

        const parsed = await generateJSON<any>(
          'pro',
          'You are an SEO metrics expert. Provide search metrics for keywords. Return valid JSON only.',
          prompt,
          enrichKeywordsSchema
        );

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
