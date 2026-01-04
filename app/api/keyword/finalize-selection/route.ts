/**
 * API Route: Finalize Selection (Step 8)
 * POST /api/keyword/finalize-selection
 * 
 * Intelligently selects final N keywords with balanced strategic values
 */

import { NextRequest, NextResponse } from 'next/server';
import { getKeywordSelectionPrompt } from '@/lib/keyword/prompts';
import { normalizeKeyword } from '@/lib/keyword/utils';
import { adminDb as db } from '@/lib/firebase-admin';
import type {
  FinalizeSelectionRequest,
  FinalizeSelectionResponse,
  SelectedKeyword,
} from '@/types/keyword-research';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body: FinalizeSelectionRequest = await request.json();
    const { researchId, enrichedKeywords, requestedCount, businessContext } = body;

    if (!researchId || !enrichedKeywords || !requestedCount || !businessContext) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`🚀 [Keyword API] Finalize Selection: ${enrichedKeywords.length} → ${requestedCount} keywords`);

    // Use GPT-4o for intelligent selection
    const selectionPrompt = getKeywordSelectionPrompt(enrichedKeywords, requestedCount, businessContext);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO strategy expert. Select the best keywords for a business. Return valid JSON only.',
        },
        {
          role: 'user',
          content: selectionPrompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('No selection result');
    }

    const parsed = JSON.parse(result);
    const selectedList = parsed.keywords || parsed.selectedKeywords || [];

    const selectedKeywords: SelectedKeyword[] = selectedList.slice(0, requestedCount).map((kw: any, index: number) => {
      // Robust matching using normalization
      const keywordText = kw.primaryKeyword || kw.keyword;
      
      if (!keywordText) {
        console.warn('⚠️ [Keyword API] Missing keyword text in selection result', kw);
        return null;
      }

      const kwNormalized = normalizeKeyword(keywordText);
      const originalKeyword = enrichedKeywords.find(ek => normalizeKeyword(ek.primaryKeyword) === kwNormalized);
      
      if (!originalKeyword) {
        console.warn(`⚠️ [Keyword API] Could not match selected keyword "${keywordText}" to original list. Using fallback.`);
        // Fallback: Create new keyword entry if match fails
        return {
          keywordId: `gen-${Date.now()}-${index}`,
          primaryKeyword: keywordText,
          searchVolume: kw.searchVolume || 0,
          difficulty: kw.difficulty || 'medium',
          searchIntent: kw.searchIntent || 'informational',
          relevanceScore: 5,
          searchVolumeCategory: 'low',
          trend: 'stable',
          topRankingDomains: [],
          whichCompetitorsRank: [],
          variations: [],
          keywordFamily: 'general',
          totalOccurrences: 0,
          usedByCompetitors: 0,
          avgProminence: 5,
          sources: [],
          rank: index + 1,
          strategicValue: kw.strategicValue || 'core-target',
          selectionReason: kw.selectionReason || 'AI Suggested',
          targetContentType: kw.targetContentType || '',
          targetWordCount: kw.targetWordCount || 0,
          status: 'not_started',
        } as SelectedKeyword;
      }

      return {
        ...originalKeyword,
        rank: index + 1,
        strategicValue: kw.strategicValue || 'core-target',
        selectionReason: kw.selectionReason || '',
        targetContentType: kw.targetContentType || '',
        targetWordCount: kw.targetWordCount || 0,
        status: 'not_started',
      };
    }).filter(Boolean) as SelectedKeyword[];

    // Store in Firestore
    const batch = db.batch();
    for (const keyword of selectedKeywords) {
      const ref = db
        .collection(`marketing/keyword/researches/${researchId}/selected_keywords`)
        .doc(keyword.keywordId);
      batch.set(ref, keyword);
    }
    await batch.commit();

    // Check for "Key Sentences" (Questions/Long-tail) count
    const sentenceTarget = Math.floor(requestedCount / 2);
    const existingSentences = selectedKeywords.filter(k => 
      (k.primaryKeyword.split(' ').length >= 4) || 
      k.primaryKeyword.includes('?') || 
      k.searchIntent === 'informational'
    ).length;

    if (existingSentences < sentenceTarget) {
      const remainingNeeded = sentenceTarget - existingSentences;
      console.log(`⚠️ [Keyword API] Missing ${remainingNeeded} key sentences. Generating...`);

      try {
        const sentenceCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an SEO expert specializing in long-tail keywords and user questions. Return valid JSON only.',
            },
            {
              role: 'user',
              content: `Generate ${remainingNeeded} additional "Key Sentences" (Questions or Long-tail keywords with 4+ words) relevant to this business.
              
              BUSINESS:
              - Industry: ${businessContext.industry}
              - Services: ${businessContext.mainServices.join(', ')}
              
              CONTEXT KEYWORDS (Already selected):
              ${selectedKeywords.slice(0, 10).map(k => k.primaryKeyword).join(', ')}...
              
              REQUIREMENTS:
              1. Must be questions (Who, What, Where, How) or long statements (>4 words).
              2. Must be relevant to the business.
              3. Must imply "informational" search intent.
              
              Return as JSON array:
              [
                {
                  "primaryKeyword": "string",
                  "searchVolume": number (estimate),
                  "difficulty": "low" | "medium" | "high",
                  "selectionReason": "string"
                }
              ]`
            }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        });

        const sentenceResult = sentenceCompletion.choices[0].message.content;
        if (sentenceResult) {
          const parsedSentences = JSON.parse(sentenceResult);
          const newSentences = parsedSentences.sentences || parsedSentences.keywords || [];
          
          if (Array.isArray(newSentences)) {
             newSentences.forEach((s: any, idx) => {
               if (selectedKeywords.length >= requestedCount + remainingNeeded) return;
               
               const vol = s.searchVolume || 50;
               const newKeyword: SelectedKeyword = {
                 keywordId: `gen-sent-${Date.now()}-${idx}`,
                 primaryKeyword: s.primaryKeyword,
                 searchVolume: vol,
                 searchVolumeCategory: vol > 1000 ? 'medium' : 'low',
                 difficulty: s.difficulty || 'low',
                 trend: 'stable',
                 topRankingDomains: [],
                 whichCompetitorsRank: [],
                 variations: [],
                 keywordFamily: 'questions',
                 totalOccurrences: 0,
                 usedByCompetitors: 0,
                 avgProminence: 5,
                 sources: [],
                 searchIntent: 'informational',
                 relevanceScore: 8,
                 rank: selectedKeywords.length + 1,
                 strategicValue: 'long-term-goal',
                 selectionReason: s.selectionReason || 'AI Generated Key Sentence',
                 targetContentType: 'blog-post',
                 targetWordCount: 800,
                 status: 'not_started',
               };

               selectedKeywords.push(newKeyword);

               // Save to Firestore
               db.collection(`marketing/keyword/researches/${researchId}/selected_keywords`)
                 .doc(newKeyword.keywordId)
                 .set(newKeyword)
                 .catch(e => console.error('Failed to save generated keyword', e));
             });
          }
        }
      } catch (err) {
        console.error('Error generating extra sentences:', err);
      }
    }

    // Update research document
    await db.collection('marketing/keyword/researches').doc(researchId).update({
      requestedKeywordCount: requestedCount,
      currentStep: 8,
      updatedAt: new Date(),
    });

    console.log(`✅ [Keyword API] Selection complete: ${selectedKeywords.length} keywords`);

    const response: FinalizeSelectionResponse = {
      selectedKeywords,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error finalizing selection:', error);
    return NextResponse.json(
      {
        error: 'Failed to finalize selection',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
