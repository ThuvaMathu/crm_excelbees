/**
 * API Route: Identify Competitors (Step 2)
 * POST /api/keyword/identify-competitors
 *
 * Identifies competitors through various methods: previous analysis, manual entry, or auto-discovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCompetitorValidationPrompt } from '@/lib/keyword/prompts';
import { isValidUrl, extractDomain, generateId } from '@/lib/keyword/utils';
import { adminDb as db } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  IdentifyCompetitorsRequest,
  IdentifyCompetitorsResponse,
  KeywordCompetitor,
} from '@/types/keyword-research';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body: IdentifyCompetitorsRequest = await request.json();
    const { researchId, method, data, businessContext } = body;

    if (!researchId || !method || !businessContext) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`🚀 [Keyword API] Identify Competitors: Method=${method}`);

    let competitors: KeywordCompetitor[] = [];

    // BRANCH A: Import from Previous Analysis
    if (method === 'previous' || method === 'hybrid') {
      if (data?.previousAnalysisId) {
        console.log('🔄 [Keyword API] Loading competitors from previous analysis...');

        const analysisDoc = await db
          .collection('marketing/competitor/analyses')
          .doc(data.previousAnalysisId)
          .get();

        if (analysisDoc.exists) {
          const analysisData = analysisDoc.data();
          const previousCompetitors = analysisData?.competitorsFound || [];

          for (const comp of previousCompetitors) {
            if (comp.selected && comp.website) {
              competitors.push({
                competitorId: generateId(),
                name: comp.name || extractDomain(comp.website),
                url: comp.website,
                source: 'previous_analysis',
                status: 'pending',
              });
            }
          }

          console.log(`✅ [Keyword API] Loaded ${competitors.length} competitors from previous analysis`);
        }
      }
    }

    // BRANCH B: Manual Entry
    if (method === 'manual' || method === 'hybrid') {
      if (data?.manualUrls && data.manualUrls.length > 0) {
        console.log('🔄 [Keyword API] Processing manual competitor URLs...');

        for (const url of data.manualUrls) {
          const trimmedUrl = url.trim();
          if (trimmedUrl && isValidUrl(trimmedUrl)) {
            // Check for duplicates
            const exists = competitors.find(c => c.url === trimmedUrl);
            if (!exists) {
              competitors.push({
                competitorId: generateId(),
                name: extractDomain(trimmedUrl),
                url: trimmedUrl,
                source: 'manual',
                status: 'pending',
              });
            }
          }
        }

        console.log(`✅ [Keyword API] Added ${data.manualUrls.length} manual competitors`);
      }
    }

    // BRANCH C: Auto-Discover
    if (method === 'auto' || method === 'hybrid') {
      console.log('🔄 [Keyword API] Auto-discovering competitors with Gemini...');

      const searchQuery = `${businessContext.industry} companies in ${businessContext.mainServices.join(', ')}`;
      const count = data?.autoDiscoverCount || 5;

      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const systemPrompt = 'You are a business research expert. Find direct competitors for businesses. Return valid JSON only.';
        const prompt = `Search for ${count} direct competitors of this business:\n\nIndustry: ${businessContext.industry}\nServices: ${businessContext.mainServices.join(', ')}\nTarget Audience: ${businessContext.targetAudience}\nBusiness Type: ${businessContext.businessType}\n\nFind companies offering similar services to the same audience. Return their website URLs.\n\nReturn as JSON array:\n[\n  {\n    "name": "string",\n    "website": "string (full URL with https://)",\n    "relevanceReason": "string (why they are a competitor)"\n  }\n]`;

        const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);

        const resultText = result.response.text();
        if (resultText) {
          const cleanedResult = resultText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
          const parsed = JSON.parse(cleanedResult);
          const discovered = parsed.competitors || parsed.results || [];

          for (const comp of discovered) {
            if (comp.website && isValidUrl(comp.website)) {
              // Check for duplicates
              const exists = competitors.find(c => c.url === comp.website);
              if (!exists) {
                competitors.push({
                  competitorId: generateId(),
                  name: comp.name || extractDomain(comp.website),
                  url: comp.website,
                  source: 'auto_discovered',
                  status: 'pending',
                });
              }
            }
          }

          console.log(`✅ [Keyword API] Auto-discovered ${discovered.length} competitors`);
        }
      } catch (error) {
        console.error('Error auto-discovering competitors:', error);
        // Continue with manual/previous competitors if auto-discovery fails
      }
    }

    // Validate competitors with AI if we have any
    if (competitors.length > 0) {
      console.log('🔄 [Keyword API] Validating competitors with Gemini...');

      try {
        const validationPrompt = getCompetitorValidationPrompt(
          competitors.map(c => ({ name: c.name, website: c.url })),
          businessContext
        );

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const systemPrompt = 'You are a business analyst. Validate if companies are actual competitors. Return valid JSON only.';

        const result = await model.generateContent(`${systemPrompt}\n\n${validationPrompt}`);

        const resultText = result.response.text();
        if (resultText) {
          const cleanedResult = resultText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
          const parsed = JSON.parse(cleanedResult);
          const validatedList = parsed.competitors || parsed.validated || [];

          // Filter out invalid competitors
          competitors = competitors.filter(comp => {
            const validation = validatedList.find((v: any) =>
              v.website === comp.url || v.name === comp.name
            );
            return validation?.isValid !== false;
          });

          console.log(`✅ [Keyword API] Validated ${competitors.length} competitors`);
        }
      } catch (error) {
        console.error('Error validating competitors:', error);
        // Continue with unvalidated list
      }
    }

    // Store competitors in Firestore
    const batch = db.batch();

    for (const competitor of competitors) {
      const competitorRef = db
        .collection(`marketing/keyword/researches/${researchId}/competitors`)
        .doc(competitor.competitorId);

      batch.set(competitorRef, {
        ...competitor,
        addedAt: new Date(),
      });
    }

    await batch.commit();

    // Update research document
    await db.collection('marketing/keyword/researches').doc(researchId).update({
      competitorSource: method,
      'analysisDepth.competitorCount': competitors.length,
      currentStep: 2,
      updatedAt: new Date(),
    });

    console.log(`📝 [Keyword API] Stored ${competitors.length} competitors`);

    const response: IdentifyCompetitorsResponse = {
      competitors,
      totalCompetitors: competitors.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error identifying competitors:', error);

    return NextResponse.json(
      {
        error: 'Failed to identify competitors',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
