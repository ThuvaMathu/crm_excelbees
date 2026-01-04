/**
 * Utility functions for Keyword Research
 */

import type { SelectedPage, ExtractedKeyword, BusinessContext } from '@/types/keyword-research';
import { XMLParser } from 'fast-xml-parser';

/**
 * Parse sitemap XML and extract URLs
 */
export function parseSitemapXML(xmlContent: string): string[] {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
    
    const result = parser.parse(xmlContent);
    const urls: string[] = [];

    // Handle sitemap index (contains multiple sitemaps)
    if (result.sitemapindex?.sitemap) {
      const sitemaps = Array.isArray(result.sitemapindex.sitemap)
        ? result.sitemapindex.sitemap
        : [result.sitemapindex.sitemap];
      
      for (const sitemap of sitemaps) {
        if (sitemap.loc) {
          urls.push(sitemap.loc);
        }
      }
      return urls;
    }

    // Handle regular sitemap (contains URLs)
    if (result.urlset?.url) {
      const urlEntries = Array.isArray(result.urlset.url)
        ? result.urlset.url
        : [result.urlset.url];
      
      for (const entry of urlEntries) {
        if (entry.loc) {
          urls.push(entry.loc);
        }
      }
    }

    return urls;
  } catch (error) {
    console.error('Error parsing sitemap XML:', error);
    return [];
  }
}

/**
 * Prioritize pages based on user preferences and category
 */
export function prioritizePages(
  pages: SelectedPage[],
  preferences: {
    prioritizeBlog: boolean;
    prioritizeServices: boolean;
    includeLocation: boolean;
    includeProducts: boolean;
  },
  limit: number
): SelectedPage[] {
  // Apply preference-based priority boosts
  const scoredPages = pages.map(page => {
    let score = page.priority;

    // Apply user preference boosts
    if (preferences.prioritizeBlog && page.category === 'blog') {
      score += 3;
    }
    if (preferences.prioritizeServices && page.category === 'services') {
      score += 3;
    }
    if (preferences.includeLocation && page.category === 'location') {
      score += 2;
    }
    if (preferences.includeProducts && page.category === 'services') {
      score += 2;
    }

    return { ...page, score };
  });

  // Sort by score descending
  scoredPages.sort((a, b) => b.score - a.score);

  // Ensure variety - don't take only one category
  const selected: SelectedPage[] = [];
  const categoryCount: Record<string, number> = {};

  // Always include homepage first
  const homepage = scoredPages.find(p => p.category === 'home');
  if (homepage) {
    selected.push(homepage);
    categoryCount['home'] = 1;
  }

  // Add remaining pages with category diversity
  for (const page of scoredPages) {
    if (selected.length >= limit) break;
    if (selected.find(p => p.pageId === page.pageId)) continue;

    const catCount = categoryCount[page.category] || 0;
    
    // Limit pages per category to ensure variety
    const maxPerCategory = Math.ceil(limit / 3);
    if (catCount < maxPerCategory) {
      selected.push(page);
      categoryCount[page.category] = catCount + 1;
    }
  }

  // Fill remaining slots if needed
  for (const page of scoredPages) {
    if (selected.length >= limit) break;
    if (!selected.find(p => p.pageId === page.pageId)) {
      selected.push(page);
    }
  }

  return selected.slice(0, limit);
}

/**
 * Normalize keyword format
 */
export function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s-]/g, ''); // Remove special characters except hyphens
}

/**
 * Filter out branded keywords (competitor names)
 */
export function filterBrandedKeywords(
  keywords: ExtractedKeyword[],
  competitorNames: string[]
): ExtractedKeyword[] {
  const brandTerms = competitorNames.map(name => 
    name.toLowerCase().split(/\s+/)
  ).flat();

  return keywords.filter(kw => {
    const kwLower = kw.keyword.toLowerCase();
    // Check if keyword contains any brand term
    return !brandTerms.some(brand => kwLower.includes(brand));
  });
}

/**
 * Calculate relevance score for a keyword based on business context
 */
export function calculateRelevanceScore(
  keyword: string,
  businessContext: BusinessContext
): number {
  let score = 5; // Base score

  const kwLower = keyword.toLowerCase();
  const industry = businessContext.industry.toLowerCase();
  const services = businessContext.mainServices.map(s => s.toLowerCase());

  // Check if keyword contains industry terms
  if (kwLower.includes(industry)) {
    score += 3;
  }

  // Check if keyword contains service terms
  for (const service of services) {
    if (kwLower.includes(service)) {
      score += 2;
      break;
    }
  }

  // Check for location-based keywords if local business
  if (businessContext.geographicScope === 'Local') {
    const locationTerms = ['local', 'near me', 'nearby', businessContext.targetAudience.toLowerCase()];
    if (locationTerms.some(term => kwLower.includes(term))) {
      score += 2;
    }
  }

  // Penalize very generic keywords
  const genericTerms = ['best', 'top', 'good', 'great', 'cheap'];
  if (genericTerms.some(term => kwLower === term)) {
    score -= 3;
  }

  // Bonus for long-tail keywords (3+ words)
  const wordCount = keyword.split(/\s+/).length;
  if (wordCount >= 3) {
    score += 1;
  }

  return Math.max(1, Math.min(10, score)); // Clamp between 1-10
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Batch array into chunks
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Calculate estimated time for research
 */
export function estimateResearchTime(
  competitorCount: number,
  pagesPerCompetitor: number
): number {
  const totalPages = competitorCount * pagesPerCompetitor;
  
  // Rough estimates in seconds
  const businessContextTime = 30;
  const competitorDiscoveryTime = 20;
  const sitemapDiscoveryTime = competitorCount * 10;
  const scrapingTime = Math.ceil(totalPages / 10) * 30; // 10 pages per batch, 30s per batch
  const keywordExtractionTime = Math.ceil(totalPages / 5) * 20; // 5 pages per batch, 20s per batch
  const consolidationTime = 30;
  const enrichmentTime = 40;
  const strategyTime = 20;

  return (
    businessContextTime +
    competitorDiscoveryTime +
    sitemapDiscoveryTime +
    scrapingTime +
    keywordExtractionTime +
    consolidationTime +
    enrichmentTime +
    strategyTime
  );
}

/**
 * Format search volume for display
 */
export function formatSearchVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
}

/**
 * Get difficulty color
 */
export function getDifficultyColor(difficulty: 'low' | 'medium' | 'high'): string {
  switch (difficulty) {
    case 'low':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'high':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Get strategic value badge color
 */
export function getStrategicValueColor(value: 'quick-win' | 'core-target' | 'long-term-goal'): string {
  switch (value) {
    case 'quick-win':
      return 'bg-green-100 text-green-800';
    case 'core-target':
      return 'bg-blue-100 text-blue-800';
    case 'long-term-goal':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
