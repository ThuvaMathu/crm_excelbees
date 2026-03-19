/**
 * Gemini-based Competitor Discovery Service
 * Uses Google AI with Google Search Grounding for discovering local and global competitors
 */

import { GoogleGenerativeAI, DynamicRetrievalMode } from "@google/generative-ai";
import { AI_MODELS } from "@/lib/ai/config";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface GeminiCompetitor {
  name: string;
  website: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
}

/**
 * Competitor discovery result with metadata
 */
export interface CompetitorDiscoveryResult {
  competitors: GeminiCompetitor[];
  source: 'gemini' | 'fallback';
  queryUsed: string;
}

/**
 * Discover competitors using Gemini AI with Google Search Grounding
 * @param industry - Industry/business type (e.g., "Digital Marketing Agency", "Coffee Shop")
 * @param location - Location to search in (e.g., "Brisbane, Australia")
 * @param maxResults - Maximum number of competitors to return (default: 15)
 * @returns Array of competitors with details
 */
export async function discoverCompetitors(
  industry: string,
  location: string,
  maxResults: number = 15
): Promise<CompetitorDiscoveryResult> {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured');
    return { competitors: [], source: 'fallback', queryUsed: '' };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Use gemini-2.0-flash-exp for grounding capabilities
    const model = genAI.getGenerativeModel(
      { model: AI_MODELS.GEMINI_PRO },
      // Enable Google Search grounding for live web data
      {
        apiVersion: "v1beta",
      }
    );

    const prompt = buildDiscoveryPrompt(industry, location, maxResults);

    console.log(`[Gemini Discovery] Searching for: ${industry} in ${location}`);

    // Generate content with Google Search grounding
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
      // Enable Google Search tool for grounding
      tools: [
        {
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: DynamicRetrievalMode.MODE_DYNAMIC,
              dynamicThreshold: 0.3,
            },
          },
        },
      ],
    });

    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const competitors = parseCompetitorsResponse(text);

    console.log(`[Gemini Discovery] Found ${competitors.length} competitors`);

    return {
      competitors,
      source: 'gemini',
      queryUsed: `${industry} in ${location}`,
    };
  } catch (error) {
    console.error('[Gemini Discovery] Failed:', error);
    return { competitors: [], source: 'fallback', queryUsed: '' };
  }
}

/**
 * Build the discovery prompt for Gemini
 */
function buildDiscoveryPrompt(industry: string, location: string, maxResults: number): string {
  return `You are a market research expert. Find the top ${maxResults} real, active competitors in the "${industry}" industry in ${location}.

IMPORTANT REQUIREMENTS:
1. Search for REAL, existing businesses - not made up examples
2. Each competitor MUST have a valid, working website
3. Use Google Search to find current, accurate information
4. Include ratings and review counts when available
5. Only include businesses that are direct competitors (same industry, similar services)

Return your findings as a JSON object with this exact structure:
{
  "competitors": [
    {
      "name": "Business Name",
      "website": "https://example.com",
      "rating": 4.5,
      "reviewCount": 150,
      "address": "Full street address if available"
    }
  ]
}

NOTES:
- website must be a valid URL starting with https://
- rating is a number from 1.0 to 5.0 (omit if not available)
- reviewCount is a number (omit if not available)
- address is the full street address (omit if not available)`;
}

/**
 * Parse competitors from Gemini's JSON response
 */
function parseCompetitorsResponse(text: string): GeminiCompetitor[] {
  try {
    // Clean the response text - remove markdown code blocks if present
    const cleanText = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const data = JSON.parse(cleanText);
    const competitors = data.competitors || [];

    // Validate and clean competitor data
    return competitors
      .filter((c: any) => {
        // Must have name and valid website
        return c.name && c.website && isValidUrl(c.website);
      })
      .map((c: any) => ({
        name: c.name.trim(),
        website: normalizeUrl(c.website),
        rating: c.rating ? parseFloat(c.rating) : undefined,
        reviewCount: c.reviewCount ? parseInt(c.reviewCount, 10) : undefined,
        address: c.address?.trim() || undefined,
      }));
  } catch (error) {
    console.error('[Gemini Discovery] Failed to parse response:', error);
    return [];
  }
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize URL to ensure it has https:// and no trailing slash
 */
function normalizeUrl(url: string): string {
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(urlWithProtocol);
    urlObj.search = '';
    urlObj.hash = '';
    let cleanUrl = urlObj.toString();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    return cleanUrl;
  } catch {
    return url;
  }
}

/**
 * Discover competitors using natural language search
 * This allows more flexible queries like "Top coffee shops with great ambiance in Brisbane"
 * @param naturalQuery - Natural language search query
 * @param maxResults - Maximum number of results
 */
export async function naturalLanguageSearch(
  naturalQuery: string,
  maxResults: number = 15
): Promise<CompetitorDiscoveryResult> {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured');
    return { competitors: [], source: 'fallback', queryUsed: naturalQuery };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel(
      { model: AI_MODELS.GEMINI_PRO },
      { apiVersion: "v1beta" }
    );

    const prompt = `You are a market research expert. Based on the user's search request, find real businesses that match their criteria.

User Request: "${naturalQuery}"

IMPORTANT REQUIREMENTS:
1. Search for REAL, existing businesses that match the user's request
2. Each business MUST have a valid, working website
3. Use Google Search to find current, accurate information
4. Return up to ${maxResults} results
5. Include ratings, review counts, and addresses when available

Return your findings as a JSON object with this exact structure:
{
  "competitors": [
    {
      "name": "Business Name",
      "website": "https://example.com",
      "rating": 4.5,
      "reviewCount": 150,
      "address": "Full street address if available"
    }
  ]
}

Only include businesses with valid websites.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
      tools: [
        {
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: DynamicRetrievalMode.MODE_DYNAMIC,
              dynamicThreshold: 0.3,
            },
          },
        },
      ],
    });

    const response = await result.response;
    const competitors = parseCompetitorsResponse(response.text());

    return {
      competitors,
      source: 'gemini',
      queryUsed: naturalQuery,
    };
  } catch (error) {
    console.error('[Gemini Natural Search] Failed:', error);
    return { competitors: [], source: 'fallback', queryUsed: naturalQuery };
  }
}

/**
 * Check if Gemini Discovery is configured
 */
export function isGeminiDiscoveryConfigured(): boolean {
  return !!GEMINI_API_KEY;
}
