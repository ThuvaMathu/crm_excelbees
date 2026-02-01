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

    console.log(`🔍 Fetching keyword researches for user: ${userId}`);
    const snapshot = await db
      .collection('marketing/keyword/researches')
      .where('userId', '==', userId)
      .get();
      
    console.log(`✅ Found ${snapshot.size} researches`);

    // Helper to safely convert to Date
    const toDate = (val: any) => {
      if (!val) return new Date();
      if (val.toDate && typeof val.toDate === 'function') return val.toDate();
      if (val instanceof Date) return val;
      if (typeof val === 'string') return new Date(val);
      return new Date();
    };

    const researches = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ researches });
  } catch (error) {
    console.error('Error fetching research history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
