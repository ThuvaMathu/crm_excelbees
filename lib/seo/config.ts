/**
 * SEO API Configuration
 *
 * Central configuration for SEO data providers, caching, and cost management.
 */

export interface SEOConfig {
  primaryProvider: "dataforseo" | "semrush" | "serpapi";
  fallbackProviders: ("dataforseo" | "semrush" | "serpapi")[];
  batchSize: number;
  cacheTTL: number;
  costThresholds: {
    warning: number;
    critical: number;
  };
}

/**
 * Default SEO configuration
 *
 * Caching Strategy:
 * - SEO metrics (volume, CPC, difficulty): 7 days
 * - Page content (competitor data): 24 hours
 * - Business context: 7 days
 * - Sitemap data: 30 days
 */
export const SEO_CONFIG: SEOConfig = {
  // Primary provider (DataForSEO has the best accuracy)
  primaryProvider: "dataforseo",

  // Fallback providers if primary fails
  fallbackProviders: ["semrush", "serpapi"],

  // Batch size for API requests
  batchSize: 100,

  // Cache TTL in seconds
  cacheTTL: 604800000, // 7 days

  // Cost thresholds for alerts
  costThresholds: {
    warning: 10.00, // $10 USD per request
    critical: 50.00, // $50 USD per request
  },
} as const;

/**
 * Generate variants for a keyword
 */
export function generateVariants(keyword: string): string[] {
  const variants: string[] = [];

  // Question-based variations
  const questionWords = [
    "how",
    "what",
    "why",
    "best",
    "top",
    "guide",
    "tutorial",
    "tips",
    "ideas",
    "examples",
    "list",
  ];
  for (const qw of questionWords) {
    variants.push(`${qw} to ${keyword}`);
    variants.push(`${keyword} ${qw}`);
  }

  // Location-based variations
  const locations = [
    "near me",
    "online",
    "free",
    "cheap",
    "affordable",
    "local",
    "services",
    "providers",
    "companies",
  ];
  for (const loc of locations) {
    variants.push(`${keyword} ${loc}`);
  }

  // Comparison-based variations
  const comparisons = [
    "vs",
    "versus",
    "comparison",
    "alternative",
    "alternatives",
    "better than",
    "like",
    "similar",
  ];
  for (const comp of comparisons) {
    variants.push(`${keyword} ${comp}`);
  }

  return [...new Set(variants)]; // Remove duplicates
}

/**
 * Calculate opportunity score from metrics
 */
export function calculateOpportunityScore(
  searchVolume: number,
  cpc: number,
  difficulty: number
): number {
  // Formula: (Volume × CPC) / Difficulty
  // Higher volume and CPC = higher value
  // Higher difficulty = lower value

  if (difficulty === 0) difficulty = 1; // Prevent division by zero

  const rawScore = (searchVolume * cpc) / difficulty;

  // Normalize to 0-100 scale
  // 1000+ searches with $5 CPC and easy difficulty = 100
  // 10 searches with $1 CPC and hard difficulty = ~2
  return Math.min(100, Math.round(rawScore / 50));
}

/**
 * Get difficulty label
 */
export function getDifficultyLabel(difficulty: number): string {
  if (difficulty < 30) return "Easy";
  if (difficulty < 60) return "Medium";
  if (difficulty < 80) return "Hard";
  return "Very Hard";
}

/**
 * Get volume label
 */
export function getVolumeLabel(volume: number): string {
  if (volume < 100) return "Very Low";
  if (volume < 1000) return "Low";
  if (volume < 10000) return "Medium";
  if (volume < 100000) return "High";
  return "Very High";
}
