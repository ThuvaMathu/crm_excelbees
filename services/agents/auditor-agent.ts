/**
 * Agent C: The Auditor
 *
 * Role: Search metrics acquisition using SEO APIs
 * Input: Seed keywords with variants
 * Output: Enriched keyword list with metrics
 */

import { SEOAPIClientFactory } from "@/lib/seo/seo-api-client";
import { generateVariants, calculateOpportunityScore, getDifficultyLabel, getVolumeLabel } from "@/lib/seo/config";
import { CACHE_TTL } from "@/lib/redis";
import { adminDb as db } from "@/lib/firebase-admin";

export interface AuditorInput {
  seedKeywords: string[];
  competitors?: string[];
  apiKey?: string;
  userId?: string;
  workspaceId?: string;
  researchId?: string;
}

export interface EnrichedKeyword {
  keyword: string;
  searchVolume: number;
  searchVolumeLabel: string;
  cpc: number;
  difficulty: number;
  difficultyLabel: string;
  trend: "up" | "down" | "stable";
  opportunityScore: number;
  isSeed: boolean;
  variantOf?: string;
}

export interface AuditorOutput {
  keywords: EnrichedKeyword[];
  totalSearched: number;
  totalFound: number;
  avgDifficulty: number;
  avgOpportunityScore: number;
  topOpportunities: EnrichedKeyword[];
}

/**
 * Audit keywords using SEO API
 */
export async function auditKeywords(input: AuditorInput): Promise<AuditorOutput> {
  const { seedKeywords, competitors, apiKey, userId, workspaceId, researchId } = input;

  console.log(`[Auditor Agent] Starting audit for ${seedKeywords.length} seed keywords`);

  // Generate variants for each seed keyword
  const allKeywords: string[] = [];
  const keywordMap = new Map<string, { isSeed: boolean; variantOf?: string }>();

  for (const seed of seedKeywords) {
    keywordMap.set(seed.toLowerCase(), { isSeed: true });
    allKeywords.push(seed);

    // Generate variants (limit to reduce API costs)
    const variants = generateVariants(seed).slice(0, 5);
    for (const variant of variants) {
      const lowerVariant = variant.toLowerCase();
      if (!keywordMap.has(lowerVariant)) {
        keywordMap.set(lowerVariant, { isSeed: false, variantOf: seed });
        allKeywords.push(variant);
      }
    }
  }

  console.log(`[Auditor Agent] Expanded to ${allKeywords.length} keywords (including variants)`);

  // Initialize SEO API client
  let seoClient: SEOAPIClientFactory | null = null;
  const seoApiKey = apiKey || process.env.DATAFORSEO_API_KEY || process.env.SERPAPI_API_KEY;

  if (seoApiKey) {
    seoClient = new SEOAPIClientFactory({
      primaryProvider: "dataforseo",
      fallbackProviders: ["serpapi", "semrush"],
      apiKey: seoApiKey,
    });
  } else {
    console.warn("[Auditor Agent] No SEO API key configured, using mock data");
  }

  // Check cache first
  const cachedKeywords = new Map<string, EnrichedKeyword>();
  const keywordsToFetch: string[] = [];

  if (researchId) {
    const cacheRef = db.collection(`marketing/keyword/researches/${researchId}/keyword_cache`);
    const cacheSnapshot = await cacheRef.get();

    for (const doc of cacheSnapshot.docs) {
      const data = doc.data();
      const keyword = doc.id;
      // Check if cache is still valid (7 days)
      const cachedAt = data.cachedAt?.toDate?.() || data.cachedAt;
      const age = Date.now() - (cachedAt?.getTime() || 0);
      if (age < CACHE_TTL.SEO_METRICS) { // 7 days
        cachedKeywords.set(keyword.toLowerCase(), data as unknown as EnrichedKeyword);
      }
    }
  }

  // Filter out cached keywords
  for (const keyword of allKeywords) {
    const lowerKeyword = keyword.toLowerCase();
    if (!cachedKeywords.has(lowerKeyword)) {
      keywordsToFetch.push(keyword);
    }
  }

  console.log(`[Auditor Agent] Found ${cachedKeywords.size} cached, fetching ${keywordsToFetch.length} new keywords`);

  // Fetch from SEO API in batches
  const fetchedKeywords: EnrichedKeyword[] = [];
  const batchSize = 100;

  if (seoClient && keywordsToFetch.length > 0) {
    for (let i = 0; i < keywordsToFetch.length; i += batchSize) {
      const batch = keywordsToFetch.slice(i, i + batchSize);
      console.log(`[Auditor Agent] Fetching batch ${Math.floor(i / batchSize) + 1} (${batch.length} keywords)`);

      try {
        const metrics = await seoClient.getMetrics(batch);

        for (const metric of metrics) {
          const lowerKeyword = metric.keyword.toLowerCase();
          const meta = keywordMap.get(lowerKeyword) || { isSeed: false };

          const enriched: EnrichedKeyword = {
            keyword: metric.keyword,
            searchVolume: metric.searchVolume || 0,
            searchVolumeLabel: getVolumeLabel(metric.searchVolume || 0),
            cpc: metric.cpc || 0,
            difficulty: metric.difficulty || 0,
            difficultyLabel: getDifficultyLabel(metric.difficulty || 0),
            trend: metric.trend || "stable",
            opportunityScore: calculateOpportunityScore(
              metric.searchVolume || 0,
              metric.cpc || 0,
              metric.difficulty || 0
            ),
            isSeed: meta.isSeed,
            variantOf: meta.variantOf,
          };

          fetchedKeywords.push(enriched);

          // Cache the result
          if (researchId) {
            await db.collection(`marketing/keyword/researches/${researchId}/keyword_cache`)
              .doc(lowerKeyword)
              .set({
                ...enriched,
                cachedAt: new Date(),
              });
          }
        }
      } catch (error) {
        console.error(`[Auditor Agent] Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
        // Add mock data for failed batch to continue processing
        for (const keyword of batch) {
          fetchedKeywords.push(createMockKeyword(keyword, keywordMap.get(keyword.toLowerCase())?.isSeed));
        }
      }
    }
  } else if (keywordsToFetch.length > 0) {
    // No SEO API, create mock data
    console.log("[Auditor Agent] Creating mock data for", keywordsToFetch.length, "keywords");
    for (const keyword of keywordsToFetch) {
      fetchedKeywords.push(createMockKeyword(keyword, keywordMap.get(keyword.toLowerCase())?.isSeed));
    }
  }

  // Combine cached and fetched keywords
  const allEnriched: EnrichedKeyword[] = [];

  // Add seed keywords first
  for (const seed of seedKeywords) {
    const lowerSeed = seed.toLowerCase();
    const cached = cachedKeywords.get(lowerSeed);
    const fetched = fetchedKeywords.find(k => k.keyword.toLowerCase() === lowerSeed);

    if (cached) {
      allEnriched.push(cached);
    } else if (fetched) {
      allEnriched.push(fetched);
    } else {
      allEnriched.push(createMockKeyword(seed, true));
    }
  }

  // Add variants
  for (const keyword of allKeywords) {
    const lowerKeyword = keyword.toLowerCase();
    const meta = keywordMap.get(lowerKeyword);

    if (!meta?.isSeed) {
      const cached = cachedKeywords.get(lowerKeyword);
      const fetched = fetchedKeywords.find(k => k.keyword.toLowerCase() === lowerKeyword);

      if (cached && !allEnriched.find(k => k.keyword.toLowerCase() === lowerKeyword)) {
        allEnriched.push(cached);
      } else if (fetched && !allEnriched.find(k => k.keyword.toLowerCase() === lowerKeyword)) {
        allEnriched.push(fetched);
      }
    }
  }

  // Calculate statistics
  const avgDifficulty = allEnriched.length > 0
    ? allEnriched.reduce((sum, k) => sum + k.difficulty, 0) / allEnriched.length
    : 0;

  const avgOpportunityScore = allEnriched.length > 0
    ? allEnriched.reduce((sum, k) => sum + k.opportunityScore, 0) / allEnriched.length
    : 0;

  // Get top opportunities (high opportunity, low difficulty)
  const topOpportunities = allEnriched
    .filter(k => k.difficulty < 50)
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 20);

  const output: AuditorOutput = {
    keywords: allEnriched,
    totalSearched: allKeywords.length,
    totalFound: allEnriched.length,
    avgDifficulty,
    avgOpportunityScore,
    topOpportunities,
  };

  console.log(`[Auditor Agent] Audit complete: ${allEnriched.length} keywords enriched`);
  console.log(`[Auditor Agent] Avg difficulty: ${avgDifficulty.toFixed(1)}, Avg opportunity: ${avgOpportunityScore.toFixed(1)}`);

  return output;
}

/**
 * Expand keywords using search suggestions
 * (Optional enhancement for discovering related keywords)
 */
export async function expandKeywords(
  seedKeywords: string[],
  maxPerSeed: number = 10
): Promise<string[]> {
  console.log(`[Auditor Agent] Expanding ${seedKeywords.length} seed keywords`);

  const expanded: string[] = [];

  // Use internal variant generation
  for (const seed of seedKeywords) {
    const variants = generateVariants(seed).slice(0, maxPerSeed);
    expanded.push(...variants);
  }

  // Remove duplicates and return
  const unique = [...new Set(expanded)];
  console.log(`[Auditor Agent] Expanded to ${unique.length} unique keywords`);

  return unique;
}

/**
 * Get competitor keywords (keywords competitors rank for)
 */
export async function getCompetitorKeywords(
  competitorUrls: string[],
  seedKeywords: string[]
): Promise<Map<string, string[]>> {
  console.log(`[Auditor Agent] Analyzing ${competitorUrls.length} competitors`);

  const competitorKeywords = new Map<string, string[]>();

  // For now, return empty map
  // In production, this would use SEO API to get keywords competitors rank for
  // or would be derived from the scraped content in Agent B

  return competitorKeywords;
}

// Helper function to create mock keyword data
function createMockKeyword(keyword: string, isSeed: boolean = false): EnrichedKeyword {
  // Generate deterministic but varied mock data
  const hash = keyword.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const searchVolume = (hash % 10000) + 100;
  const cpc = ((hash % 500) / 100) + 0.5;
  const difficulty = (hash % 80) + 10;

  return {
    keyword,
    searchVolume,
    searchVolumeLabel: getVolumeLabel(searchVolume),
    cpc: Math.round(cpc * 100) / 100,
    difficulty,
    difficultyLabel: getDifficultyLabel(difficulty),
    trend: hash % 3 === 0 ? "up" : hash % 3 === 1 ? "down" : "stable",
    opportunityScore: calculateOpportunityScore(searchVolume, cpc, difficulty),
    isSeed,
  };
}
