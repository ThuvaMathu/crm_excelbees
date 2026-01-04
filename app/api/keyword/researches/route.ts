import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';
import { KeywordResearchDocument } from '@/types/keyword-research';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const snapshot = await db
      .collection('marketing/keyword/researches')
      .where('userId', '==', userId)
      .get();

    const researches = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ researches });
  } catch (error) {
    console.error('Error fetching research history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
