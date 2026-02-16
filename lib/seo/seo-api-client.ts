/**
 * SEO API Client - Multi-Provider Abstraction
 *
 * Supports DataForSEO, Semrush, and SerpAPI for keyword metrics.
 * Provides batching, caching, and automatic fallback to save costs.
 */

import { CACHE_TTL } from "@/lib/redis";

export interface SEOMetrics {
  keyword: string;
  searchVolume: number;
  cpc: number;
  difficulty: number;
  trend: "up" | "down" | "stable";
}

export interface SEOAPIClient {
  name: string;
  getMetrics(keywords: string[]): Promise<SEOMetrics[]>;
  getBatchMetrics(keywordGroups: string[][]): Promise<SEOMetrics[][]>;
}

// DataForSEO Client
class DataForSEOClient implements SEOAPIClient {
  name = "dataforseo";
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  async getMetrics(keywords: string[]): Promise<SEOMetrics[]> {
    try {
      const response = await fetch("https://api.dataforseo.com/v1/keyword_metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.key}`,
        },
        body: JSON.stringify({
          keywords: keywords.map(k => ({ keyword: k, domain: "google.com" })),
          metrics: ["search_volume", "cpc", "keyword_difficulty"],
        }),
      });

      if (!response.ok) {
        throw new Error(`DataForSEO error: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform to our format
      return data.results?.map((r: any) => ({
        keyword: r.keyword.keyword,
        searchVolume: r.search_volume || 0,
        cpc: r.cpc || 0,
        difficulty: r.keyword_difficulty || 0,
        trend: "stable",
      })) || [];
    } catch (error) {
      console.error("DataForSEO API error:", error);
      return [];
    }
  }

  async getBatchMetrics(keywordGroups: string[][]): Promise<SEOMetrics[][]> {
    const batchSize = 100;
    const results: SEOMetrics[][] = [];

    for (const group of keywordGroups) {
      const batch = await this.getMetrics(group.flat());
      results.push(batch);
    }

    return results;
  }
}

// SerpAPI Client
class SerpAPIClient implements SEOAPIClient {
  name = "serpapi";
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  async getMetrics(keywords: string[]): Promise<SEOMetrics[]> {
    try {
      const requests = keywords.map(keyword => ({
        keyword,
        domain: "google.com",
        country: "us",
      }));

      const response = await fetch("https://api.serpapi.com/v1/keywords/keyword-metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.key}`,
        },
        body: JSON.stringify({ data: { requests } }),
      });

      if (!response.ok) {
        throw new Error(`SerpAPI error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.data?.map((r: any) => ({
        keyword: r.keyword || r.serp_keyword,
        searchVolume: r.search_volume || 0,
        cpc: r.cpc || 0,
        difficulty: r.difficulty || 0,
        trend: r.trend || "stable",
      })) || [];
    } catch (error) {
      console.error("SerpAPI error:", error);
      return [];
    }
  }

  async getBatchMetrics(keywordGroups: string[][]): Promise<SEOMetrics[][]> {
    const batchSize = 100;
    const results: SEOMetrics[][] = [];

    for (const group of keywordGroups) {
      const batch = await this.getMetrics(group.flat());
      results.push(batch);
    }

    return results;
  }
}

// Semrush Client (Fallback)
class SemrushClient implements SEOAPIClient {
  name = "semrush";
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  async getMetrics(keywords: string[]): Promise<SEOMetrics[]> {
    try {
      const response = await fetch("https://api.semrush.com/v1/keywords/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.key}`,
        },
        body: JSON.stringify({ keywords }),
      });

      if (!response.ok) {
        throw new Error(`Semrush error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.results?.map((r: any) => ({
        keyword: r.keyword,
        searchVolume: r.volume || 0,
        cpc: r.cpc || 0,
        difficulty: r.difficulty || 0,
        trend: r.trend || "stable",
      })) || [];
    } catch (error) {
      console.error("Semrush error:", error);
      return [];
    }
  }

  async getBatchMetrics(keywordGroups: string[][]): Promise<SEOMetrics[][]> {
    const results: SEOMetrics[][] = [];

    for (const group of keywordGroups) {
      const batch = await this.getMetrics(group.flat());
      results.push(batch);
    }

    return results;
  }
}

/**
 * SEO API Client Factory with Fallback
 */
export class SEOAPIClientFactory {
  private primaryProvider: SEOAPIClient | null = null;
  private fallbackProviders: SEOAPIClient[] = [];

  constructor(config: {
    primaryProvider: string;
    fallbackProviders: string[];
    apiKey: string;
  }) {
    // Initialize primary provider
    if (config.primaryProvider === "dataforseo") {
      this.primaryProvider = new DataForSEOClient(config.apiKey);
    } else if (config.primaryProvider === "serpapi") {
      this.primaryProvider = new SerpAPIClient(config.apiKey);
    } else if (config.primaryProvider === "semrush") {
      this.primaryProvider = new SemrushClient(config.apiKey);
    }

    // Initialize fallback providers
    for (const provider of config.fallbackProviders) {
      if (provider === "dataforseo") {
        this.fallbackProviders.push(new DataForSEOClient(config.apiKey));
      } else if (provider === "serpapi") {
        this.fallbackProviders.push(new SerpAPIClient(config.apiKey));
      } else if (provider === "semrush") {
        this.fallbackProviders.push(new SemrushClient(config.apiKey));
      }
    }
  }

  /**
   * Get metrics for a single batch of keywords
   */
  async getMetrics(keywords: string[]): Promise<SEOMetrics[]> {
    // Try primary provider first
    try {
      const result = await this.primaryProvider?.getMetrics(keywords);
      if (result && result.length > 0) {
        return result;
      }
    } catch (error) {
      console.warn(`Primary provider failed, trying fallback:`, error);
    }

    // Try fallback providers
    for (const provider of this.fallbackProviders) {
      try {
        const result = await provider.getMetrics(keywords);
        if (result && result.length > 0) {
          return result;
        }
      } catch (error) {
        console.warn(`Fallback provider ${provider.name} failed:`, error);
      }
    }

    return [];
  }

  /**
   * Get metrics for multiple batches
   */
  async getBatchMetrics(keywordGroups: string[][]): Promise<SEOMetrics[][]> {
    const results: SEOMetrics[][] = [];

    for (const group of keywordGroups) {
      let batchResult: SEOMetrics[] = [];

      // Try primary provider first
      try {
        const batchResults = await this.primaryProvider?.getBatchMetrics([group]) || [];
        batchResult = batchResults[0] || [];
        if (batchResult.length > 0) {
          results.push(batchResult);
          continue;
        }
      } catch (error) {
        console.warn(`Primary provider batch failed, trying fallback:`, error);
      }

      // Try fallback providers
      for (const provider of this.fallbackProviders) {
        try {
          const batchResults = await provider.getBatchMetrics([group]);
          batchResult = batchResults[0] || [];
          if (batchResult.length > 0) {
            results.push(batchResult);
            break;
          }
        } catch (error) {
          console.warn(`Fallback provider batch failed:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Generate variants for keyword expansion
   */
  generateVariants(keyword: string): string[] {
    const variants: string[] = [];
    const words = keyword.split(" ");

    // Add question-based variations
    const questionWords = ["how", "what", "why", "best", "top", "guide", "tutorial"];
    for (const qw of questionWords) {
      variants.push(`${qw} to ${keyword}`);
      variants.push(`${keyword} ${qw}`);
    }

    // Add location-based variations
    const locations = ["near me", "online", "free", "cheap", "affordable", "services"];
    for (const loc of locations) {
      variants.push(`${keyword} ${loc}`);
    }

    // Add comparison-based variations
    const comparisons = ["vs", "versus", "comparison", "alternative"];
    for (const comp of comparisons) {
      variants.push(`${keyword} ${comp}`);
    }

    // Add action-based variations
    const actions = ["for sale", "to buy", "to hire", "services", "providers"];
    for (const act of actions) {
      variants.push(`${keyword} ${act}`);
    }

    return [...new Set(variants)]; // Remove duplicates
  }
}
