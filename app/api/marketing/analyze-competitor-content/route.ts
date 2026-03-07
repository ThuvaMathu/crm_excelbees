/**
 * API Route: Analyze Competitor Content (Step 5)
 * POST /api/marketing/analyze-competitor-content
 *
 * Analyzes competitor website content using Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCompetitorContentAnalysisPrompt } from '@/lib/competitor-analysis/prompts';
import { adminDb as db } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AnalyzeContentRequest,
  AnalyzeContentResponse,
  CompetitorAnalysis
} from '@/types/competitor-analysis';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeContentRequest = await request.json();
    const { analysisId, scrapedData } = body;

    // Validate inputs
    if (!analysisId || !scrapedData || scrapedData.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`Analyzing ${scrapedData.length} competitor websites...`);

    const analyses: CompetitorAnalysis[] = [];

    // Process competitors in parallel (but with rate limiting)
    const batchSize = 3; // Smaller batch for AI calls to avoid rate limits
    for (let i = 0; i < scrapedData.length; i += batchSize) {
      const batch = scrapedData.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (competitor) => {
          // Skip failed scrapes
          if (competitor.status === 'failed' || !competitor.scrapedContent) {
            console.log(`Skipping ${competitor.competitorName} (scraping failed)`);
            return null;
          }

          try {
            console.log(`Analyzing ${competitor.competitorName}...`);

            const prompt = getCompetitorContentAnalysisPrompt(
              competitor.competitorName,
              competitor.scrapedContent
            );

            // Use Gemini for detailed analysis
            const model = genAI.getGenerativeModel({
              model: 'gemini-2.0-flash',
              generationConfig: { responseMimeType: 'application/json' },
            });

            const systemPrompt = 'You are a competitive intelligence analyst. Extract detailed structured information from competitor websites. Always return valid JSON only.';

            const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);

            const analysisText = result.response.text();
            if (!analysisText) {
              throw new Error('No response from AI');
            }

            // Clean up response (remove markdown code blocks if present)
            const cleanedAnalysis = analysisText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
            const analysis: CompetitorAnalysis = JSON.parse(cleanedAnalysis);

            // Update competitor_data document with analysis
            const competitorDataQuery = await db
              .collection('marketing/competitor/data')
              .where('analysisId', '==', analysisId)
              .where('competitorUrl', '==', competitor.websiteUrl)
              .limit(1)
              .get();

            if (!competitorDataQuery.empty) {
              const docRef = competitorDataQuery.docs[0].ref;
              await docRef.update({
                analysis,
                updatedAt: new Date(),
              });
            }

            console.log(`Analysis complete for ${competitor.competitorName}`);
            return analysis;

          } catch (error) {
            console.error(`Failed to analyze ${competitor.competitorName}:`, error);

            // Store error in database
            const competitorDataQuery = await db
              .collection('marketing/competitor/data')
              .where('analysisId', '==', analysisId)
              .where('competitorUrl', '==', competitor.websiteUrl)
              .limit(1)
              .get();

            if (!competitorDataQuery.empty) {
              const docRef = competitorDataQuery.docs[0].ref;
              await docRef.update({
                scrapingStatus: 'limited_data',
                updatedAt: new Date(),
              });
            }

            return null;
          }
        })
      );

      // Filter out null results and add to analyses
      const validResults = batchResults.filter((r): r is CompetitorAnalysis => r !== null);
      analyses.push(...validResults);

      // Small delay between batches to avoid rate limits
      if (i + batchSize < scrapedData.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update analysis document
    await db.collection('marketing/competitor/analyses').doc(analysisId).update({
      status: 'analyzing',
      currentStep: 5,
      updatedAt: new Date(),
    });

    console.log(`Analysis complete: ${analyses.length}/${scrapedData.length} successful`);

    const response: AnalyzeContentResponse = {
      analyses,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error analyzing competitor content:', error);

    // Update analysis status to failed
    try {
      const body: AnalyzeContentRequest = await request.json();
      await db.collection('marketing/competitor/analyses').doc(body.analysisId).update({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Analysis failed',
        updatedAt: new Date(),
      });
    } catch (updateError) {
      console.error('Failed to update analysis status:', updateError);
    }

    return NextResponse.json(
      {
        error: 'Failed to analyze competitor content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
