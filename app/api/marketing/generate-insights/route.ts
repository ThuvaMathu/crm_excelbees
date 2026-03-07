/**
 * API Route: Generate Competitive Insights (Step 8)
 * POST /api/marketing/generate-insights
 * 
 * Generates comprehensive competitive intelligence report using OpenAI GPT-4o
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCompetitiveInsightsPrompt } from '@/lib/competitor-analysis/prompts';
import { adminDb as db } from '@/lib/firebase-admin';
import type {
  GenerateInsightsRequest,
  GenerateInsightsResponse,
  CompetitorReport,
  ReportSections
} from '@/types/competitor-analysis';
import { generateJSON } from '@/services/ai/gemini-provider';
import { reportSectionsSchema } from '@/schema/competitor-analysis';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateInsightsRequest = await request.json();
    const { analysisId } = body;

    // Validate input
    if (!analysisId) {
      return NextResponse.json(
        { error: 'Missing analysis ID' },
        { status: 400 }
      );
    }

    console.log(`Generating insights for analysis ${analysisId}...`);

    // Step 1: Gather all data from Firestore
    const analysisDoc = await db.collection('marketing/competitor/analyses').doc(analysisId).get();

    if (!analysisDoc.exists) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    const analysisData = analysisDoc.data();
    const businessProfile = analysisData?.userBusinessProfile;

    if (!businessProfile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 400 }
      );
    }

    // Step 2: Get all competitor data
    const competitorDataQuery = await db
      .collection('marketing/competitor/data')
      .where('analysisId', '==', analysisId)
      .get();

    const competitorAnalyses = competitorDataQuery.docs
      .map(doc => {
        const data = doc.data();
        if (data.analysis) {
          return {
            name: data.competitorName,
            analysis: data.analysis,
          };
        }
        return null;
      })
      .filter((c): c is { name: string; analysis: any } => c !== null);

    if (competitorAnalyses.length === 0) {
      return NextResponse.json(
        { error: 'No competitor analyses found' },
        { status: 400 }
      );
    }

    console.log(`Found ${competitorAnalyses.length} competitor analyses`);

    // Step 3: Generate comprehensive insights with GPT-4o
    const userConcerns = analysisData?.preferences?.specificConcerns;
    const keyProducts = analysisData?.preferences?.keyProducts;

    const prompt = getCompetitiveInsightsPrompt(
      businessProfile,
      competitorAnalyses,
      userConcerns,
      keyProducts
    );

    console.log('Generating competitive intelligence report...');

    const sections = await generateJSON<ReportSections>(
      'pro',
      'You are an expert competitive intelligence analyst with deep expertise in market analysis, strategic planning, and business intelligence. Provide actionable, data-driven insights. Always return valid JSON only.',
      prompt,
      reportSectionsSchema
    );

    const insightsText = JSON.stringify(sections, null, 2);

    // Step 4: Create report document
    const reportData = {
      analysisId,
      generatedAt: new Date(),
      reportContent: insightsText, // Store raw markdown/JSON
      sections,
      reportFormat: 'web' as const,
    };

    const reportRef = await db.collection('marketing/competitor/reports').add(reportData);
    const reportId = reportRef.id;

    // Step 5: Update analysis status to complete
    await db.collection('marketing/competitor/analyses').doc(analysisId).update({
      status: 'complete',
      currentStep: 8,
      updatedAt: new Date(),
    });

    console.log(`Report generated successfully: ${reportId}`);

    const report: CompetitorReport = {
      id: reportId,
      analysisId,
      generatedAt: new Date(),
      reportContent: insightsText,
      sections,
      reportFormat: 'web',
    };

    const response: GenerateInsightsResponse = {
      report,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error generating insights:', error);

    // Update analysis status to failed
    try {
      const body: GenerateInsightsRequest = await request.json();
      await db.collection('marketing/competitor/analyses').doc(body.analysisId).update({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Insights generation failed',
        updatedAt: new Date(),
      });
    } catch (updateError) {
      console.error('Failed to update analysis status:', updateError);
    }

    return NextResponse.json(
      {
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
