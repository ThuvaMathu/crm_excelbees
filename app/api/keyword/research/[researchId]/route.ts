import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ researchId: string }> }
) {
  const params = await props.params;
  try {
    const researchId = params.researchId;

    if (!researchId) {
      return NextResponse.json({ error: 'Research ID is required' }, { status: 400 });
    }

    // Fetch research document
    const researchDoc = await db
      .collection('marketing/keyword/researches')
      .doc(researchId)
      .get();

    if (!researchDoc.exists) {
      return NextResponse.json({ error: 'Research not found' }, { status: 404 });
    }

    // Fetch subcollections data if needed, or just return the main doc
    // The results page might need more data, but let's start with the main doc
    // and maybe some summary data if available in the doc.
    
    // Actually, the results page fetches keywords from a separate call (or mocked currently?)
    // In results/page.tsx:
    // const researchDoc = await fetch(`/api/keyword/research/${researchId}`);
    // if (researchDoc.ok) { setResearch(data); }
    // setKeywords(...) is currently using placeholder data in the frontend code I wrote earlier.
    
    // Fetch selected keywords
    const keywordsSnapshot = await db
      .collection(`marketing/keyword/researches/${researchId}/selected_keywords`)
      .get();
    
    const keywords = keywordsSnapshot.docs.map(doc => doc.data());

    // Fetch strategy report
    const strategyDoc = await db
      .collection(`marketing/keyword/researches/${researchId}/strategy_report`)
      .doc('main')
      .get();
    
    const strategyReport = strategyDoc.exists ? strategyDoc.data() : null;

    return NextResponse.json({
      id: researchDoc.id,
      ...researchDoc.data(),
      keywords,
      strategyReport,
    });

  } catch (error) {
    console.error('Error fetching research:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research' },
      { status: 500 }
    );
  }
}
