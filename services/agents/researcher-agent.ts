/**
 * Agent B: The Researcher
 *
 * Role: Multi-source data collection through parallel web scraping
 * Input: Seed keywords from Agent A, Competitor URLs
 * Output: Structured page content for each competitor
 */

import { scrapeWebsite, scrapeMultipleWebsites } from "@/services/jinaAI";

export interface ResearcherInput {
  seedKeywords: string[];
  competitors: string[];
  pagesPerCompetitor?: number;
}

export interface CompetitorPage {
  competitorId: string;
  competitorName: string;
  competitorUrl: string;
  pageUrl: string;
  category: "home" | "about" | "services" | "blog" | "pricing" | "contact" | "other";
  title: string;
  content: string;
  scrapedAt: Date;
}

export interface ResearcherOutput {
  pages: CompetitorPage[];
  totalCompetitors: number;
  totalPages: number;
  successfulScrapes: number;
  failedScrapes: number;
}

/**
 * Research competitors by scraping their websites
 */
export async function researchCompetitors(
  input: ResearcherInput
): Promise<ResearcherOutput> {
  const { seedKeywords, competitors, pagesPerCompetitor = 5 } = input;

  console.log(`[Researcher Agent] Starting research for ${competitors.length} competitors`);
  console.log(`[Researcher Agent] Seed keywords: ${seedKeywords.slice(0, 5).join(", ")}...`);

  const pages: CompetitorPage[] = [];
  let successfulScrapes = 0;
  let failedScrapes = 0;

  // Common paths to try on each competitor site
  const commonPaths = [
    { path: "", category: "home" as const },
    { path: "/about", category: "about" as const },
    { path: "/services", category: "services" as const },
    { path: "/products", category: "services" as const },
    { path: "/pricing", category: "pricing" as const },
    { path: "/blog", category: "blog" as const },
    { path: "/contact", category: "contact" as const },
  ];

  // Build list of URLs to scrape
  const urlsToScrape: Array<{ url: string; competitorName: string; category: typeof commonPaths[number]["category"] }> = [];

  for (const competitorUrl of competitors) {
    const competitorName = extractDomain(competitorUrl);

    // Add homepage
    urlsToScrape.push({
      url: normalizeUrl(competitorUrl),
      competitorName,
      category: "home",
    });

    // Add common paths (limited by pagesPerCompetitor)
    const pathsToScrape = commonPaths.slice(1, pagesPerCompetitor);
    for (const { path, category } of pathsToScrape) {
      const fullUrl = `${normalizeUrl(competitorUrl)}${path}`;
      urlsToScrape.push({
        url: fullUrl,
        competitorName,
        category,
      });
    }
  }

  console.log(`[Researcher Agent] Queued ${urlsToScrape.length} URLs for scraping`);

  // Scrape in parallel batches
  const batchSize = 5;
  const results: Array<{ url: string; competitorName: string; category: string; content?: string; title?: string; success: boolean }> = [];

  for (let i = 0; i < urlsToScrape.length; i += batchSize) {
    const batch = urlsToScrape.slice(i, i + batchSize);
    console.log(`[Researcher Agent] Scraping batch ${Math.floor(i / batchSize) + 1} (${batch.length} URLs)`);

    const batchPromises = batch.map(async ({ url, competitorName, category }) => {
      try {
        const result = await scrapeWebsite(url, 15000); // 15 second timeout per page

        if (result.success && result.content && result.content.length > 100) {
          const title = extractTitle(result.content);
          return {
            url,
            competitorName,
            category,
            content: result.content,
            title,
            success: true,
          };
        }

        return {
          url,
          competitorName,
          category,
          success: false,
        };
      } catch (error) {
        console.warn(`[Researcher Agent] Failed to scrape ${url}:`, error);
        return {
          url,
          competitorName,
          category,
          success: false,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  // Structure results
  for (const result of results) {
    if (result.success && result.content) {
      pages.push({
        competitorId: generateId(),
        competitorName: result.competitorName,
        competitorUrl: extractBaseUrl(result.url),
        pageUrl: result.url,
        category: result.category as any,
        title: result.title || result.competitorName,
        content: result.content,
        scrapedAt: new Date(),
      });
      successfulScrapes++;
    } else {
      failedScrapes++;
    }
  }

  const output: ResearcherOutput = {
    pages,
    totalCompetitors: competitors.length,
    totalPages: urlsToScrape.length,
    successfulScrapes,
    failedScrapes,
  };

  console.log(`[Researcher Agent] Research complete: ${successfulScrapes}/${urlsToScrape.length} pages scraped`);

  return output;
}

/**
 * Search Google for keywords and extract competitor URLs
 * (Optional enhancement for discovering new competitors)
 */
export async function searchCompetitorUrls(
  keywords: string[],
  maxResultsPerKeyword: number = 5
): Promise<string[]> {
  const competitorUrls = new Set<string>();

  console.log(`[Researcher Agent] Searching competitors for ${keywords.length} keywords`);

  for (const keyword of keywords.slice(0, 10)) { // Limit to 10 keywords
    try {
      // This would use a search API (SerpAPI, Google Custom Search, etc.)
      // For now, we'll return empty and let users provide competitors manually
      // TODO: Implement search API integration
    } catch (error) {
      console.warn(`[Researcher Agent] Failed to search for keyword: ${keyword}`, error);
    }
  }

  return Array.from(competitorUrls);
}

/**
 * Extract keywords from scraped page content
 */
export function extractPageKeywords(content: string, maxKeywords: number = 20): string[] {
  // Remove markdown formatting
  const cleanContent = content
    .replace(/^#+\s+/gm, "") // Headers
    .replace(/\*\*/g, "") // Bold
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
    .replace(/\n{3,}/g, "\n") // Multiple newlines
    .trim();

  // Extract phrases that might be keywords
  const words = cleanContent.toLowerCase().split(/\s+/);
  const phrases: string[] = [];

  // Extract 2-3 word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const twoWord = `${words[i]} ${words[i + 1]}`;
    if (twoWord.length > 5 && twoWord.length < 50) {
      phrases.push(twoWord);
    }

    if (i < words.length - 2) {
      const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (threeWord.length > 10 && threeWord.length < 60) {
        phrases.push(threeWord);
      }
    }
  }

  // Count frequency and return top keywords
  const frequency = new Map<string, number>();
  for (const phrase of phrases) {
    frequency.set(phrase, (frequency.get(phrase) || 0) + 1);
  }

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([phrase]) => phrase);
}

// Helper functions

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function extractBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}`;
  } catch {
    return url;
  }
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function extractTitle(content: string): string {
  // Extract first heading as title
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // Extract first line as fallback
  const lines = content.split("\n").filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    return lines[0].trim().substring(0, 100);
  }

  return "Untitled";
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
