/**
 * API Route: Scrape Competitor Websites (Step 4)
 * POST /api/marketing/scrape-competitors
 * 
 * Scrapes competitor websites using Jina AI with caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeMultipleWebsites } from '@/services/jinaAI';
import { getCachedWebsiteContent, cacheWebsiteContent } from '@/lib/competitor-analysis/cache';
import { adminDb as db } from '@/lib/firebase-admin';
import type { 
  ScrapeCompetitorsRequest,
  ScrapeCompetitorsResponse,
  ScrapedCompetitor 
} from '@/types/competitor-analysis';

export async function POST(request: NextRequest) {
  try {
    const body: ScrapeCompetitorsRequest = await request.json();
    const { analysisId, competitors } = body;

    // Validate inputs
    if (!analysisId || !competitors || competitors.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`Scraping ${competitors.length} competitor websites...`);

    const scrapedData: ScrapedCompetitor[] = [];

    // Process competitors in batches of 5 (parallel)
    const batchSize = 5;
    for (let i = 0; i < competitors.length; i += batchSize) {
      const batch = competitors.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (competitor) => {
          try {
            // Check cache first
            console.log(`Checking cache for ${competitor.website}...`);
            const cachedContent = await getCachedWebsiteContent(competitor.website);

            let content: string;
            let fromCache = false;

            if (cachedContent) {
              console.log(`Cache hit for ${competitor.website}`);
              content = cachedContent;
              fromCache = true;
            } else {
              console.log(`Scraping ${competitor.website}...`);
              const scrapeResult = await scrapeMultipleWebsites([competitor.website], 1);
              const result = scrapeResult[0];

              if (!result.success || !result.content) {
                throw new Error(result.error || 'Scraping failed');
              }

              content = result.content;
              
              // Cache the scraped content
              await cacheWebsiteContent(competitor.website, content);
            }

            // Store in competitor_data collection
            const competitorData = {
              analysisId,
              competitorName: competitor.name,
              competitorUrl: competitor.website,
              scrapedContent: content,
              scrapedAt: new Date(),
              scrapingStatus: 'success' as const,
            };

            await db.collection('marketing/competitor/data').add(competitorData);

            return {
              competitorName: competitor.name,
              websiteUrl: competitor.website,
              scrapedContent: content,
              status: 'success' as const,
            };

          } catch (error) {
            console.error(`Failed to scrape ${competitor.website}:`, error);

            // Store failed scrape in database
            const competitorData = {
              analysisId,
              competitorName: competitor.name,
              competitorUrl: competitor.website,
              scrapedContent: '',
              scrapedAt: new Date(),
              scrapingStatus: 'failed' as const,
            };

            await db.collection('marketing/competitor/data').add(competitorData);

            return {
              competitorName: competitor.name,
              websiteUrl: competitor.website,
              scrapedContent: '',
              status: 'failed' as const,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      scrapedData.push(...batchResults);
    }

    // Update analysis document
    await db.collection('marketing/competitor/analyses').doc(analysisId).update({
      status: 'scraping',
      currentStep: 4,
      updatedAt: new Date(),
    });

    const successCount = scrapedData.filter(d => d.status === 'success').length;
    console.log(`Scraping complete: ${successCount}/${competitors.length} successful`);

    const response: ScrapeCompetitorsResponse = {
      scrapedData,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error scraping competitors:', error);
    
    // Update analysis status to failed
    try {
      const body: ScrapeCompetitorsRequest = await request.json();
      await db.collection('marketing/competitor/analyses').doc(body.analysisId).update({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Scraping failed',
        updatedAt: new Date(),
      });
    } catch (updateError) {
      console.error('Failed to update analysis status:', updateError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to scrape competitors',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
