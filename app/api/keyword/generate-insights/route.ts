/**
 * API Route: Generate Insights (Step 9)
 * POST /api/keyword/generate-insights
 *
 * Generates comprehensive strategy report from selected keywords
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStrategyGenerationPrompt } from '@/lib/keyword/prompts';
import { adminDb as db } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  GenerateInsightsRequest,
  GenerateInsightsResponse,
  StrategyReport,
} from '@/types/keyword-research';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body: GenerateInsightsRequest = await request.json();
    const { researchId, selectedKeywords, allResearchData } = body;

    if (!researchId || !selectedKeywords || !allResearchData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`🚀 [Keyword API] Generate Insights: ${selectedKeywords.length} keywords`);

    // Generate strategy with Gemini
    const strategyPrompt = getStrategyGenerationPrompt({
      businessContext: allResearchData.businessContext,
      competitors: allResearchData.competitors,
      totalPagesScraped: allResearchData.totalPagesScraped,
      totalKeywordsExtracted: allResearchData.totalKeywordsExtracted,
      selectedKeywords,
    });

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const systemPrompt = 'You are an SEO strategy consultant. Create comprehensive, actionable keyword strategies. Return valid JSON only.';

    const result = await model.generateContent(`${systemPrompt}\n\n${strategyPrompt}`);

    const resultText = result.response.text();
    if (!resultText) {
      throw new Error('No strategy result');
    }

    // Clean up response (remove markdown code blocks if present)
    const cleanedResult = resultText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
    const parsed = JSON.parse(cleanedResult);

    // Organize keywords by strategic value
    const quickWins = selectedKeywords.filter(kw => kw.strategicValue === 'quick-win');
    const coreTargets = selectedKeywords.filter(kw => kw.strategicValue === 'core-target');
    const longTermGoals = selectedKeywords.filter(kw => kw.strategicValue === 'long-term-goal');

    const strategyReport: StrategyReport = {
      generatedAt: new Date(),
      executiveSummary: parsed.executiveSummary || '',
      keywordBreakdown: {
        quickWins,
        coreTargets,
        longTermGoals,
      },
      keywordFamilies: parsed.keywordFamilies || [],
      competitorInsights: parsed.competitorInsights || {
        allCompetitorsTarget: [],
        someCompetitorsTarget: [],
        noCompetitorsTarget: [],
        competitiveGaps: [],
      },
      contentRecommendations: parsed.contentRecommendations || [],
      searchIntentDistribution: parsed.searchIntentDistribution || {
        informational: { count: 0, strategy: '' },
        commercial: { count: 0, strategy: '' },
        transactional: { count: 0, strategy: '' },
      },
      priorityActionPlan: parsed.priorityActionPlan || {
        month1: [],
        month2to3: [],
        month4to6: [],
      },
      successMetrics: parsed.successMetrics || {
        expectedTrafficIncrease: '',
        targetRankings: '',
        conversionPotential: '',
      },
      riskAssessment: parsed.riskAssessment || {
        cannibalizationRisks: [],
        optimizationWarnings: [],
        competitiveThreats: [],
      },
      nextSteps: parsed.nextSteps || [],
    };

    // Store in Firestore
    await db
      .collection(`marketing/keyword/researches/${researchId}/strategy_report`)
      .doc('main')
      .set(strategyReport);

    // Update research document to complete
    await db.collection('marketing/keyword/researches').doc(researchId).update({
      status: 'complete',
      currentStep: 9,
      updatedAt: new Date(),
    });

    console.log(`✅ [Keyword API] Strategy generation complete`);

    const response: GenerateInsightsResponse = {
      strategyReport,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
