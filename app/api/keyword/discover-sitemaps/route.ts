/**
 * API Route: Discover Sitemaps & Select Pages (Step 3)
 * POST /api/keyword/discover-sitemaps
 * 
 * Discovers sitemaps for each competitor and selects top N pages based on priority
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite } from '@/services/jinaAI';
import { getSitemapCategorizationPrompt } from '@/lib/keyword/prompts';
import { parseSitemapXML, prioritizePages, generateId } from '@/lib/keyword/utils';
import { getCachedSitemap, cacheSitemap } from '@/lib/keyword/cache';
import { adminDb as db } from '@/lib/firebase-admin';
import type {
  DiscoverSitemapsRequest,
  DiscoverSitemapsResponse,
  SitemapData,
  SelectedPage,
} from '@/types/keyword-research';
import { generateJSON } from '@/services/ai/gemini-provider';
import { discoverSitemapsSchema } from '@/schema/keyword-analysis';

export async function POST(request: NextRequest) {
  try {
    const body: DiscoverSitemapsRequest = await request.json();
    const { researchId, competitors, pagesPerCompetitor, pagePreferences } = body;

    if (!researchId || !competitors || !pagesPerCompetitor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`🚀 [Keyword API] Discover Sitemaps: ${competitors.length} competitors`);

    const sitemapsData: SitemapData[] = [];

    // Process each competitor in parallel
    const promises = competitors.map(async (competitor) => {
      try {
        console.log(`🔄 [Keyword API] Processing sitemap for ${competitor.name}...`);

        // Check cache first
        let sitemapUrls = await getCachedSitemap(competitor.url);

        if (!sitemapUrls) {
          // Try common sitemap URLs
          const commonSitemapPaths = [
            '/sitemap.xml',
            '/sitemap_index.xml',
            '/sitemap-index.xml',
            '/sitemap1.xml',
          ];

          let sitemapContent: string | null = null;
          let sitemapUrl: string | null = null;

          for (const path of commonSitemapPaths) {
            const url = new URL(path, competitor.url).toString();
            const result = await scrapeWebsite(url, 30000);

            if (result.success && result.content) {
              sitemapContent = result.content;
              sitemapUrl = url;
              break;
            }
          }

          // If not found, try robots.txt
          if (!sitemapContent) {
            const robotsUrl = new URL('/robots.txt', competitor.url).toString();
            const robotsResult = await scrapeWebsite(robotsUrl, 30000);

            if (robotsResult.success && robotsResult.content) {
              // Extract sitemap URL from robots.txt
              const sitemapMatch = robotsResult.content.match(/Sitemap:\s*(.+)/i);
              if (sitemapMatch) {
                sitemapUrl = sitemapMatch[1].trim();
                const sitemapResult = await scrapeWebsite(sitemapUrl, 30000);
                if (sitemapResult.success) {
                  sitemapContent = sitemapResult.content;
                }
              }
            }
          }

          if (!sitemapContent) {
            console.warn(`⚠️ [Keyword API] No sitemap found for ${competitor.name}`);
            // Fallback: use homepage only
            sitemapUrls = [competitor.url];
          } else {
            // Parse sitemap XML
            sitemapUrls = parseSitemapXML(sitemapContent);

            // If it's a sitemap index, fetch child sitemaps
            if (sitemapUrls.length > 0 && sitemapUrls[0].includes('sitemap')) {
              const childUrls: string[] = [];
              for (const childSitemapUrl of sitemapUrls.slice(0, 5)) {
                // Limit to 5 child sitemaps
                const childResult = await scrapeWebsite(childSitemapUrl, 30000);
                if (childResult.success && childResult.content) {
                  const urls = parseSitemapXML(childResult.content);
                  childUrls.push(...urls);
                }
              }
              if (childUrls.length > 0) {
                sitemapUrls = childUrls;
              }
            }

            // Cache the sitemap
            await cacheSitemap(competitor.url, sitemapUrls);
          }
        }

        console.log(`✅ [Keyword API] Found ${sitemapUrls.length} URLs for ${competitor.name}`);

        // Categorize pages with GPT-4o (limit to 200 URLs to avoid token limits)
        const urlsToAnalyze = sitemapUrls.slice(0, 200);
        const categorizationPrompt = getSitemapCategorizationPrompt(urlsToAnalyze);

        const parsed = await generateJSON<any>(
          'flash',
          'You are a website analyst. Categorize website pages. Return valid JSON only.',
          categorizationPrompt,
          discoverSitemapsSchema
        );
        const categorizedPages: SelectedPage[] = (parsed.categorizedPages || []).map(
          (page: any) => {
            let fullUrl = page.url;
            try {
              // Ensure URL is absolute
              fullUrl = new URL(page.url, competitor.url).toString();
            } catch (e) {
              // Keep original if invalid
            }

            return {
              pageId: generateId(),
              url: fullUrl,
              category: page.category || 'other',
              title: page.title || '',
              priority: page.priority || 5,
              isDynamic: page.isDynamic || false,
              competitorUrl: competitor.url,
              competitorId: competitor.competitorId,
              competitorName: competitor.name,
            };
          }
        );

        // Prioritize and select top N pages
        const selectedPages = prioritizePages(
          categorizedPages,
          pagePreferences,
          pagesPerCompetitor
        );

        const sitemapData: SitemapData = {
          competitorId: competitor.competitorId,
          competitorName: competitor.name,
          sitemapUrl: sitemapUrls[0] || competitor.url,
          totalPagesInSitemap: sitemapUrls.length,
          selectedPages,
        };

        sitemapsData.push(sitemapData);

        // Store in Firestore
        await db
          .collection(`marketing/keyword/researches/${researchId}/sitemaps`)
          .doc(competitor.competitorId)
          .set(sitemapData);

        console.log(`📝 [Keyword API] Selected ${selectedPages.length} pages for ${competitor.name}`);
      } catch (error) {
        console.error(`Error processing ${competitor.name}:`, error);
        // Continue with other competitors
      }
    });

    await Promise.all(promises);

    // Update research document
    const totalPages = sitemapsData.reduce((sum, s) => sum + s.selectedPages.length, 0);
    await db.collection('marketing/keyword/researches').doc(researchId).update({
      'analysisDepth.pagesPerCompetitor': pagesPerCompetitor,
      'analysisDepth.totalPages': totalPages,
      currentStep: 3,
      updatedAt: new Date(),
    });

    console.log(`✅ [Keyword API] Sitemap discovery complete: ${totalPages} total pages`);

    const response: DiscoverSitemapsResponse = {
      sitemapsData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error discovering sitemaps:', error);

    return NextResponse.json(
      {
        error: 'Failed to discover sitemaps',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
