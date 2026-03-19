/**
 * API Route: Extract Page Content (Step 4)
 * POST /api/keyword/extract-page-content
 *
 * Scrapes content from selected pages and extracts metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite } from '@/services/jinaAI';
import { getPageMetadataPrompt } from '@/lib/keyword/prompts';
import { batchArray } from '@/lib/keyword/utils';
import { getCachedPageContent, cachePageContent } from '@/lib/keyword/cache';
import { adminDb as db } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_MODELS } from "@/lib/ai/config";
import type {
  ExtractPageContentRequest,
  ExtractPageContentResponse,
  PageContent,
  PageMetadata,
} from '@/types/keyword-research';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body: ExtractPageContentRequest = await request.json();
    const { researchId, selectedPages } = body;

    if (!researchId || !selectedPages) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`🚀 [Keyword API] Extract Page Content: ${selectedPages.length} pages`);

    const scrapedPages: PageContent[] = [];

    // Process pages in batches of 10 (parallel)
    const batches = batchArray(selectedPages, 10);

    for (const batch of batches) {
      const batchPromises = batch.map(async (page: any) => {
        try {
          let targetUrl = page.url;

          // Resolve relative URL if needed
          if (targetUrl.startsWith('/') && page.competitorUrl) {
            try {
               targetUrl = new URL(targetUrl, page.competitorUrl).toString();
            } catch (e) {
               console.warn(`⚠️ [Keyword API] Failed to resolve relative URL ${targetUrl}`);
            }
          }

          console.log(`🔄 [Keyword API] Scraping ${targetUrl}...`);

          // Check cache first
          let content = await getCachedPageContent(targetUrl);

          if (!content) {
            // Scrape with Jina AI
            const result = await scrapeWebsite(targetUrl, 30000);

            if (!result.success || !result.content) {
              console.warn(`⚠️ [Keyword API] Failed to scrape ${targetUrl}`);
              return null;
            }

            content = result.content;

            // Cache the content
            await cachePageContent(targetUrl, content);
          }

          console.log(`✅ [Keyword API] Scraped ${targetUrl} (${content.length} chars)`);

          // Extract metadata with Gemini
          const metadataPrompt = getPageMetadataPrompt(targetUrl, content);

          const model = genAI.getGenerativeModel({
            model: AI_MODELS.GEMINI_PRO,
            generationConfig: { responseMimeType: 'application/json' },
          });

          const systemPrompt = 'You are a content analyst. Extract metadata from web pages. Return valid JSON only.';

          const result = await model.generateContent(`${systemPrompt}\n\n${metadataPrompt}`);

          const metadataResult = result.response.text();
          if (!metadataResult) {
            throw new Error('No metadata result');
          }

          // Clean up response (remove markdown code blocks if present)
          const cleanedMetadata = metadataResult.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
          const metadata: PageMetadata = JSON.parse(cleanedMetadata);

          const pageContent: PageContent = {
            pageId: page.pageId,
            competitorId: page.competitorId || '',
            competitorName: page.competitorName || '',
            pageUrl: targetUrl,
            category: page.category,
            scrapedContent: content,
            metadata,
            scrapedAt: new Date(),
          };

          scrapedPages.push(pageContent);

          // Store in Firestore
          await db
            .collection(`marketing/keyword/researches/${researchId}/page_content`)
            .doc(page.pageId)
            .set(pageContent);

          return pageContent;
        } catch (error) {
          console.error(`Error scraping ${page.url}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      console.log(`✅ [Keyword API] Batch complete: ${batchResults.filter(r => r !== null).length}/${batch.length} successful`);
    }

    // Update research document
    await db.collection('marketing/keyword/researches').doc(researchId).update({
      currentStep: 4,
      updatedAt: new Date(),
    });

    console.log(`✅ [Keyword API] Content extraction complete: ${scrapedPages.length} pages`);

    const response: ExtractPageContentResponse = {
      scrapedPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error extracting page content:', error);

    return NextResponse.json(
      {
        error: 'Failed to extract page content',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
