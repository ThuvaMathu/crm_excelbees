/**
 * Jina AI Reader Service
 * Scrapes websites and returns clean markdown content
 */

const JINA_AI_BASE_URL = process.env.JINA_AI_BASE_URL || 'https://r.jina.ai';

export interface JinaAIResponse {
  content: string;
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Scrape a website using Jina AI Reader
 * @param url - The URL to scrape
 * @param timeout - Timeout in milliseconds (default: 30000)
 * @returns Clean markdown content of the website
 */
export async function scrapeWebsite(
  url: string,
  timeout: number = 60000
): Promise<JinaAIResponse> {
  try {
    // Remove protocol if present to avoid double protocol
    const cleanUrl = url.replace(/^https?:\/\//, '');
    const jinaUrl = `${JINA_AI_BASE_URL}/${cleanUrl}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(jinaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'markdown',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Jina AI returned status ${response.status}`);
    }

    const content = await response.text();

    return {
      content,
      url,
      success: true,
    };
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    
    return {
      content: '',
      url,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Scrape multiple websites in parallel
 * @param urls - Array of URLs to scrape
 * @param maxParallel - Maximum number of parallel requests (default: 5)
 * @returns Array of scraping results
 */
export async function scrapeMultipleWebsites(
  urls: string[],
  maxParallel: number = 5
): Promise<JinaAIResponse[]> {
  const results: JinaAIResponse[] = [];
  
  // Process in batches
  for (let i = 0; i < urls.length; i += maxParallel) {
    const batch = urls.slice(i, i + maxParallel);
    const batchResults = await Promise.all(
      batch.map(url => scrapeWebsite(url))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Scrape a specific page of a website (e.g., pricing page)
 * @param baseUrl - The base URL of the website
 * @param pagePath - The path to scrape (e.g., '/pricing', '/plans')
 * @returns Clean markdown content
 */
export async function scrapeSpecificPage(
  baseUrl: string,
  pagePath: string
): Promise<JinaAIResponse> {
  const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanPagePath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
  const fullUrl = `${cleanBaseUrl}${cleanPagePath}`;
  
  return scrapeWebsite(fullUrl);
}

/**
 * Try multiple pricing page paths and return the first successful one
 * @param baseUrl - The base URL of the website
 * @returns Pricing page content or null if none found
 */
export async function scrapePricingPage(baseUrl: string): Promise<JinaAIResponse | null> {
  const pricingPaths = ['/pricing', '/plans', '/packages', '/costs', '/buy'];
  
  for (const path of pricingPaths) {
    const result = await scrapeSpecificPage(baseUrl, path);
    if (result.success && result.content.length > 100) {
      return result;
    }
  }
  
  return null;
}
