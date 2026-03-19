/**
 * API Route: Extract Keywords (Step 5)
 * POST /api/keyword/extract-keywords
 *
 * Extracts keywords from scraped page content using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getKeywordExtractionPrompt } from '@/lib/keyword/prompts';
import { batchArray, normalizeKeyword, filterBrandedKeywords } from '@/lib/keyword/utils';
import { adminDb as db } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_MODELS } from "@/lib/ai/config";
import type {
  ExtractKeywordsRequest,
  ExtractKeywordsResponse,
  PageKeywords,
} from '@/types/keyword-research';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body: ExtractKeywordsRequest = await request.json();
    const { researchId, scrapedPages, businessContext } = body;

    if (!researchId || !scrapedPages || !businessContext) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`🚀 [Keyword API] Extract Keywords: ${scrapedPages.length} pages`);

    const extractedKeywords: PageKeywords[] = [];

    // Process pages in batches of 5
    const batches = batchArray(scrapedPages, 5);

    for (const batch of batches) {
      try {
        console.log(`🔄 [Keyword API] Processing batch of ${batch.length} pages...`);

        // Prepare batch data for prompt
        const batchData = batch.map(page => ({
          pageUrl: page.pageUrl,
          competitorName: page.competitorName,
          category: page.category,
          content: page.scrapedContent.substring(0, 10000), // Limit content length (increased from 3000)
        }));

        const extractionPrompt = getKeywordExtractionPrompt(batchData, businessContext);

        const model = genAI.getGenerativeModel({
          model: AI_MODELS.GEMINI_PRO,
          generationConfig: { responseMimeType: 'application/json' },
        });

        const systemPrompt = 'You are an SEO keyword expert. Extract valuable keywords from web pages. Return valid JSON only.';

        const result = await model.generateContent(`${systemPrompt}\n\n${extractionPrompt}`);

        const resultText = result.response.text();
        if (!resultText) {
          throw new Error('No extraction result');
        }

        // Clean up response (remove markdown code blocks if present)
        const cleanedResult = resultText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
        const parsed = JSON.parse(cleanedResult);
        const batchKeywords = parsed.keywords || parsed.pages || [];

        for (const pageKeywordData of batchKeywords) {
          // Find corresponding page
          const page = batch.find(p => p.pageUrl === pageKeywordData.pageUrl);
          if (!page) continue;

          // Normalize keywords
          const primaryKeywords = (pageKeywordData.primaryKeywords || []).map((kw: any) => ({
            keyword: normalizeKeyword(kw.keyword),
            occurrences: kw.occurrences || 1,
            prominence: kw.prominence || 5,
          }));

          const secondaryKeywords = (pageKeywordData.secondaryKeywords || []).map((kw: any) => ({
            keyword: normalizeKeyword(kw.keyword),
            occurrences: kw.occurrences || 1,
          }));

          // Filter out branded keywords
          const competitorNames = [page.competitorName];
          const filteredPrimary = filterBrandedKeywords(primaryKeywords, competitorNames);
          const filteredSecondary = filterBrandedKeywords(secondaryKeywords, competitorNames);

          const pageKeywords: PageKeywords = {
            pageId: page.pageId,
            pageUrl: page.pageUrl,
            competitorName: page.competitorName,
            category: page.category,
            primaryKeywords: filteredPrimary,
            secondaryKeywords: filteredSecondary,
            searchIntent: pageKeywordData.searchIntent || 'informational',
            relevanceToUser: pageKeywordData.relevanceToUser || 'medium',
            contentStrategy: pageKeywordData.contentStrategy || '',
          };

          extractedKeywords.push(pageKeywords);

          // Store in Firestore
          await db
            .collection(`marketing/keyword/researches/${researchId}/extracted_keywords`)
            .doc(page.pageId)
            .set(pageKeywords);
        }

        console.log(`✅ [Keyword API] Batch complete: ${batchKeywords.length} pages processed`);
      } catch (error) {
        console.error('Error processing batch:', error);
        // Continue with next batch
      }
    }

    // Update research document
    await db.collection('marketing/keyword/researches').doc(researchId).update({
      currentStep: 5,
      updatedAt: new Date(),
    });

    console.log(`✅ [Keyword API] Keyword extraction complete: ${extractedKeywords.length} pages`);

    const response: ExtractKeywordsResponse = {
      extractedKeywords,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error extracting keywords:', error);

    return NextResponse.json(
      {
        error: 'Failed to extract keywords',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
