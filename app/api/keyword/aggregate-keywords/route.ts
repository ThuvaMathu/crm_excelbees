/**
 * API Route: Aggregate Keywords (Step 6)
 * POST /api/keyword/aggregate-keywords
 * 
 * Aggregates and deduplicates keywords across all pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getKeywordConsolidationPrompt } from '@/lib/keyword/prompts';
import { generateId } from '@/lib/keyword/utils';
import { adminDb as db } from '@/lib/firebase-admin';
import type {
  AggregateKeywordsRequest,
  AggregateKeywordsResponse,
  ConsolidatedKeyword,
} from '@/types/keyword-research';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body: AggregateKeywordsRequest = await request.json();
    const { researchId, extractedKeywords } = body;

    if (!researchId || !extractedKeywords) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`🚀 [Keyword API] Aggregate Keywords: ${extractedKeywords.length} pages`);

    // Collect all keywords
    const keywordMap = new Map<string, {
      keyword: string;
      totalOccurrences: number;
      competitors: Set<string>;
      categories: Set<string>;
      prominences: number[];
      sources: Array<{ competitor: string; pageUrl: string; category: string }>;
    }>();

    for (const page of extractedKeywords) {
      const allKeywords = [...page.primaryKeywords, ...page.secondaryKeywords];

      for (const kw of allKeywords) {
        const existing = keywordMap.get(kw.keyword);

        if (existing) {
          existing.totalOccurrences += kw.occurrences;
          existing.competitors.add(page.competitorName);
          existing.categories.add(page.category);
          if (kw.prominence) existing.prominences.push(kw.prominence);
          existing.sources.push({
            competitor: page.competitorName,
            pageUrl: page.pageUrl,
            category: page.category,
          });
        } else {
          keywordMap.set(kw.keyword, {
            keyword: kw.keyword,
            totalOccurrences: kw.occurrences,
            competitors: new Set([page.competitorName]),
            categories: new Set([page.category]),
            prominences: kw.prominence ? [kw.prominence] : [],
            sources: [{
              competitor: page.competitorName,
              pageUrl: page.pageUrl,
              category: page.category,
            }],
          });
        }
      }
    }

    // Convert to array for AI processing
    const aggregatedKeywords = Array.from(keywordMap.values()).map(kw => ({
      keyword: kw.keyword,
      totalOccurrences: kw.totalOccurrences,
      competitors: Array.from(kw.competitors),
      categories: Array.from(kw.categories),
      avgProminence: kw.prominences.length > 0
        ? kw.prominences.reduce((a, b) => a + b, 0) / kw.prominences.length
        : 5,
    }));

    // Sort by total occurrences and take top 300
    aggregatedKeywords.sort((a, b) => b.totalOccurrences - a.totalOccurrences);
    const topKeywords = aggregatedKeywords.slice(0, 300);

    console.log(`🔄 [Keyword API] Consolidating ${topKeywords.length} keywords with GPT-4o...`);

    // Send to GPT-4o for intelligent deduplication
    const consolidationPrompt = getKeywordConsolidationPrompt(topKeywords);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO keyword expert. Consolidate and deduplicate keywords intelligently. Return valid JSON only.',
        },
        {
          role: 'user',
          content: consolidationPrompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('No consolidation result');
    }

    const parsed = JSON.parse(result);
    const consolidatedList = parsed.keywords || parsed.consolidatedKeywords || [];

    const consolidatedKeywords: ConsolidatedKeyword[] = consolidatedList.map((kw: any) => {
      const originalData = keywordMap.get(kw.primaryKeyword) || keywordMap.values().next().value || {
        totalOccurrences: 0,
        competitors: new Set(),
        prominences: [],
        sources: []
      };

      return {
        keywordId: generateId(),
        primaryKeyword: kw.primaryKeyword,
        variations: kw.variations || [],
        keywordFamily: kw.keywordFamily || '',
        totalOccurrences: kw.totalOccurrences || originalData.totalOccurrences,
        usedByCompetitors: kw.usedByCompetitors || originalData.competitors.size,
        avgProminence: kw.avgProminence || originalData.prominences.reduce((a: number, b: number) => a + b, 0) / originalData.prominences.length || 5,
        searchIntent: kw.searchIntent || 'informational',
        relevanceScore: kw.relevanceScore || 5,
        sources: originalData.sources || [],
      };
    });

    // Store in Firestore
    const batch = db.batch();
    for (const keyword of consolidatedKeywords) {
      const ref = db
        .collection(`marketing/keyword/researches/${researchId}/consolidated_keywords`)
        .doc(keyword.keywordId);
      batch.set(ref, keyword);
    }
    await batch.commit();

    // Update research document
    await db.collection('marketing/keyword/researches').doc(researchId).update({
      currentStep: 6,
      updatedAt: new Date(),
    });

    console.log(`✅ [Keyword API] Aggregation complete: ${consolidatedKeywords.length} consolidated keywords`);

    const response: AggregateKeywordsResponse = {
      consolidatedKeywords,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error aggregating keywords:', error);
    return NextResponse.json(
      {
        error: 'Failed to aggregate keywords',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
