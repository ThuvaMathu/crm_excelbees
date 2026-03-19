/**
 * API Route: Extract Business Context (Step 1)
 * POST /api/keyword/extract-business-context
 *
 * Scrapes user's website and extracts business profile using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite } from '@/services/jinaAI';
import { getBusinessContextPrompt } from '@/lib/keyword/prompts';
import { getCachedBusinessContext, cacheBusinessContext } from '@/lib/keyword/cache';
import { adminDb as db } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_MODELS } from "@/lib/ai/config";
import type {
  ExtractBusinessContextRequest,
  ExtractBusinessContextResponse,
  BusinessContext,
  KeywordResearchDocument,
} from '@/types/keyword-research';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body: ExtractBusinessContextRequest = await request.json();
    const { websiteUrl, location, userId, workspaceId } = body;

    // Validate inputs
    if (!websiteUrl || !location || !userId || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`🚀 [Keyword API] Extract Business Context: Starting for ${websiteUrl}`);

    // Step 1: Check cache for existing business profile
    const cachedContext = await getCachedBusinessContext(userId, websiteUrl);
    if (cachedContext) {
      console.log(`✅ [Keyword API] Using cached business context`);

      // Create research document with cached context
      const researchData: Omit<KeywordResearchDocument, 'id'> = {
        userId,
        workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'analyzing',
        currentStep: 1,
        requestedKeywordCount: 0, // Will be updated later
        businessWebsite: websiteUrl,
        businessLocation: location,
        competitorSource: 'manual', // Default, will be updated
        analysisDepth: {
          competitorCount: 0,
          pagesPerCompetitor: 0,
          totalPages: 0,
        },
        pagePreferences: {
          prioritizeBlog: false,
          prioritizeServices: false,
          includeLocation: false,
          includeProducts: false,
        },
      };

      const docRef = await db.collection('marketing/keyword/researches').add(researchData);
      const researchId = docRef.id;

      // Store business context
      await db.collection(`marketing/keyword/researches/${researchId}/business_context`).add({
        ...cachedContext,
        analyzedAt: new Date(),
      });

      const response: ExtractBusinessContextResponse = {
        businessContext: cachedContext,
        researchId,
      };

      return NextResponse.json(response);
    }

    // Step 2: Scrape user's website using Jina AI
    console.log('🔄 [Keyword API] Scraping website...');
    const scrapeResult = await scrapeWebsite(websiteUrl, 60000);

    if (!scrapeResult.success || !scrapeResult.content) {
      console.error(`❌ [Keyword API] Scraping failed - ${scrapeResult.error}`);
      return NextResponse.json(
        {
          error: `Failed to scrape website: ${scrapeResult.error}. Please check the URL or try manually entering business details.`,
        },
        { status: 400 }
      );
    }

    console.log(`✅ [Keyword API] Scrape successful (${scrapeResult.content.length} chars)`);

    // Step 3: Extract business context with Gemini
    console.log('🔄 [Keyword API] Extracting business profile with Gemini...');
    const prompt = getBusinessContextPrompt(scrapeResult.content);

    const model = genAI.getGenerativeModel({
      model: AI_MODELS.GEMINI_PRO,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const systemPrompt = 'You are a business analyst expert. Extract structured business information from website content. Always return valid JSON only.';

    const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);

    const analysisText = result.response.text();
    if (!analysisText) {
      throw new Error('No response from AI');
    }

    // Clean up response (remove markdown code blocks if present)
    const cleanedAnalysis = analysisText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');

    const businessContext: BusinessContext = {
      ...JSON.parse(cleanedAnalysis),
      analyzedAt: new Date(),
    };

    console.log(`✅ [Keyword API] Business profile extracted for ${businessContext.industry}`);

    // Step 4: Cache business context
    await cacheBusinessContext(userId, websiteUrl, businessContext);

    // Step 5: Create keyword research document in Firestore
    const researchData: Omit<KeywordResearchDocument, 'id'> = {
      userId,
      workspaceId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'analyzing',
      currentStep: 1,
      requestedKeywordCount: 0, // Will be updated later
      businessWebsite: websiteUrl,
      businessLocation: location,
      competitorSource: 'manual', // Default, will be updated
      analysisDepth: {
        competitorCount: 0,
        pagesPerCompetitor: 0,
        totalPages: 0,
      },
      pagePreferences: {
        prioritizeBlog: false,
        prioritizeServices: false,
        includeLocation: false,
        includeProducts: false,
      },
    };

    const docRef = await db.collection('marketing/keyword/researches').add(researchData);
    const researchId = docRef.id;

    // Store business context in subcollection
    await db.collection(`marketing/keyword/researches/${researchId}/business_context`).add(businessContext);

    console.log(`📝 [Keyword API] Research document created ${researchId}`);

    // Step 6: Return business profile and research ID
    const response: ExtractBusinessContextResponse = {
      businessContext,
      researchId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error extracting business context:', error);

    return NextResponse.json(
      {
        error: 'Failed to extract business context',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
