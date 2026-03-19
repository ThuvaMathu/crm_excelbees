/**
 * API Route: Analyze User's Business (Step 2)
 * POST /api/marketing/analyze-user-business
 *
 * Scrapes user's website and extracts business profile using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite } from '@/services/jinaAI';
import { getBusinessAnalysisPrompt } from '@/lib/competitor-analysis/prompts';
import { adminDb as db } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_MODELS } from "@/lib/ai/config";
import type {
  AnalyzeBusinessRequest,
  AnalyzeBusinessResponse,
  BusinessProfile,
  CompetitorAnalysisDocument
} from '@/types/competitor-analysis';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeBusinessRequest = await request.json();
    const { websiteUrl, location, userId, workspaceId } = body;

    // Validate inputs
    if (!websiteUrl || !location || !userId || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 1: Scrape user's website using Jina AI
    console.log(`🚀 [API] Analyze Business: Starting for ${websiteUrl} in ${location}`);
    const scrapeResult = await scrapeWebsite(websiteUrl, 60000);

    if (!scrapeResult.success || !scrapeResult.content) {
      console.error(`❌ [API] Analyze Business: Scraping failed - ${scrapeResult.error}`);
      return NextResponse.json(
        { error: `Failed to scrape website: ${scrapeResult.error}. Please check the URL or try manually entering business details.` },
        { status: 400 }
      );
    }

    console.log(`✅ [API] Analyze Business: Scrape successful (${scrapeResult.content.length} chars)`);

    // Step 2: Analyze website content with Gemini
    console.log('🔄 [API] Analyze Business: Extracting profile with Gemini...');
    const prompt = getBusinessAnalysisPrompt(scrapeResult.content);

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
    const businessProfile: BusinessProfile = JSON.parse(cleanedAnalysis);
    console.log(`✅ [API] Analyze Business: Profile extracted for ${businessProfile.industry}`);

    // Step 3: Create competitor analysis document in Firestore
    const analysisData: Omit<CompetitorAnalysisDocument, 'id'> = {
      userId,
      workspaceId,
      createdAt: new Date(),
      updatedAt: new Date(),
      userBusinessUrl: websiteUrl,
      location,
      competitorCount: 5, // Default, will be updated later
      preferences: {
        analysisDepth: 'standard'
      },
      userBusinessProfile: businessProfile,
      status: 'discovering',
      currentStep: 2,
    };

    const docRef = await db.collection('marketing/competitor/analyses').add(analysisData);
    const analysisId = docRef.id;

    console.log(`📝 [API] Analyze Business: Document created ${analysisId}`);

    // Step 4: Return business profile and analysis ID
    const response: AnalyzeBusinessResponse = {
      businessProfile,
      analysisId,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error analyzing business:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze business',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
