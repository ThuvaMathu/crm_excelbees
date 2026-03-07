/**
 * API Route: Discover Competitors (Step 3)
 * POST /api/marketing/discover-competitors
 *
 * Discovers competitors using Gemini AI with Google Search Grounding
 */

import { NextRequest, NextResponse } from 'next/server';
import { discoverCompetitors as discoverGeminiCompetitors, isGeminiDiscoveryConfigured } from '@/services/competitorDiscovery';
import { getCompetitorValidationPrompt, getCompetitorDiscoveryPrompt } from '@/lib/competitor-analysis/prompts';
import { adminDb as db } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  DiscoverCompetitorsRequest,
  DiscoverCompetitorsResponse,
  DiscoveredCompetitor
} from '@/types/competitor-analysis';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body: DiscoverCompetitorsRequest = await request.json();
    const { analysisId, businessProfile, location, preferences } = body;

    // Validate inputs
    if (!analysisId || !businessProfile || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`🚀 [API] Discover Competitors: Starting for ${businessProfile.industry} in ${location}`);

    let allCompetitors: DiscoveredCompetitor[] = [];

    // METHOD A: Gemini AI with Google Search Grounding (for local and global competitors)
    if (isGeminiDiscoveryConfigured()) {
      console.log('🔄 [API] Discover Competitors: Searching with Gemini AI...');
      try {
        const geminiResult = await discoverGeminiCompetitors(
          businessProfile.industry,
          location,
          15
        );

        allCompetitors.push(...geminiResult.competitors.map(c => ({
          name: c.name,
          website: cleanCompetitorUrl(c.website),
          source: 'gemini' as const,
          selected: true,
          rating: c.rating,
          reviewCount: c.reviewCount,
        })));

        console.log(`✅ [API] Discover Competitors: Found ${geminiResult.competitors.length} via Gemini AI`);
      } catch (error) {
        console.error('❌ [API] Gemini AI failed:', error);
        // Continue to fallback
      }
    }

    // METHOD B: Fallback using Gemini without search grounding
    if (allCompetitors.length < 5) {
      console.log('🔄 [API] Discover Competitors: Using Gemini fallback...');
      try {
        const prompt = getCompetitorDiscoveryPrompt(
          businessProfile.industry,
          businessProfile.industry,
          location
        );

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const systemPrompt = 'You are a market research expert. Find real competitor companies based on industry and location. Return valid JSON only.';

        const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);

        const resultText = result.response.text();
        if (resultText) {
          const cleanedResult = resultText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
          const result = JSON.parse(cleanedResult);
          const webCompetitors = result.competitors || [];

          allCompetitors.push(...webCompetitors.map((c: any) => ({
            name: c.name,
            website: cleanCompetitorUrl(c.website),
            source: 'web_search' as const,
            selected: true,
          })));

          console.log(`✅ [API] Discover Competitors: Found ${webCompetitors.length} via fallback`);
        }
      } catch (error) {
        console.error('❌ [API] Fallback failed:', error);
      }
    }

    // Remove duplicates by domain
    const uniqueCompetitors = removeDuplicatesByDomain(allCompetitors);

    // Remove user's own website if present
    const filteredCompetitors = uniqueCompetitors.filter(c => {
      const competitorDomain = extractDomain(c.website);
      const userDomain = extractDomain(businessProfile.valueProposition); // Assuming URL might be in value prop
      // Also check against potentially original input if we had it, but value prop is what we have
      return competitorDomain !== userDomain;
    });

    // AI Validation: Filter out non-competitors
    console.log(`🔄 [API] Discover Competitors: Validating ${filteredCompetitors.length} candidates...`);
    const validatedCompetitors = await validateCompetitors(
      businessProfile,
      filteredCompetitors
    );
    console.log(`✅ [API] Discover Competitors: Validated ${validatedCompetitors.length} competitors`);

    // Add user-provided competitors
    if (preferences.knownCompetitors && preferences.knownCompetitors.length > 0) {
      validatedCompetitors.push(...preferences.knownCompetitors.map(url => ({
        name: extractDomain(url),
        website: cleanCompetitorUrl(url),
        source: 'user_provided' as const,
        selected: true,
      })));
    }

    // Remove excluded competitors
    let finalCompetitors = validatedCompetitors;
    if (preferences.excludeCompetitors && preferences.excludeCompetitors.length > 0) {
      const excludedDomains = preferences.excludeCompetitors.map(extractDomain);
      finalCompetitors = validatedCompetitors.filter(c => {
        const domain = extractDomain(c.website);
        return !excludedDomains.includes(domain);
      });
    }

    // Limit to requested number (from preferences or default 5)
    const requestedCount = preferences.analysisDepth === 'quick' ? 3
      : preferences.analysisDepth === 'deep' ? 10
      : 5;

    finalCompetitors = finalCompetitors.slice(0, requestedCount);

    // Update analysis document
    await db.collection('marketing/competitor/analyses').doc(analysisId).update({
      competitorsFound: finalCompetitors,
      currentStep: 3,
      updatedAt: new Date(),
    });

    console.log(`📝 [API] Discover Competitors: Final list has ${finalCompetitors.length}. Updating ${analysisId}`);

    const response: DiscoverCompetitorsResponse = {
      competitors: finalCompetitors,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error discovering competitors:', error);

    return NextResponse.json(
      {
        error: 'Failed to discover competitors',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Remove duplicate competitors by domain
 */
function removeDuplicatesByDomain(competitors: DiscoveredCompetitor[]): DiscoveredCompetitor[] {
  const seen = new Set<string>();
  return competitors.filter(c => {
    const domain = extractDomain(c.website);
    if (seen.has(domain)) {
      return false;
    }
    seen.add(domain);
    return true;
  });
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

/**
 * Clean URL by removing query parameters and hashes
 */
function cleanCompetitorUrl(url: string): string {
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(urlWithProtocol);

    // Clear query parameters/tracking codes
    urlObj.search = '';
    urlObj.hash = '';

    // Remove trailing slash for consistency
    let cleanUrl = urlObj.toString();
    if (cleanUrl.endsWith('/')) {
        cleanUrl = cleanUrl.slice(0, -1);
    }

    return cleanUrl;
  } catch (e) {
    return url;
  }
}

/**
 * Validate competitors using AI
 */
async function validateCompetitors(
  businessProfile: any,
  competitors: DiscoveredCompetitor[]
): Promise<DiscoveredCompetitor[]> {
  if (competitors.length === 0) {
    return [];
  }

  try {
    const prompt = getCompetitorValidationPrompt(
      businessProfile,
      competitors.map(c => ({ name: c.name, website: c.website }))
    );

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const systemPrompt = 'You are a business analyst. Validate which companies are actual competitors. Return valid JSON only.';

    const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);

    const resultText = result.response.text();
    if (!resultText) {
      return competitors; // Return all if validation fails
    }

    // Clean up response (remove markdown code blocks if present)
    const cleanedResult = resultText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
    const resultParsed = JSON.parse(cleanedResult);
    const validIndices = resultParsed.validCompetitorIndices || [];

    return competitors.filter((_, index) => validIndices.includes(index));
  } catch (error) {
    console.error('Competitor validation failed:', error);
    return competitors; // Return all if validation fails
  }
}
