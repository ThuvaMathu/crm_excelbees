/**
 * API Route: Get Competitor Report (Step 10)
 * GET /api/marketing/reports/[reportId]
 * 
 * Retrieves a complete competitor analysis report
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';
import type { GetReportResponse } from '@/types/competitor-analysis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Missing report ID' },
        { status: 400 }
      );
    }

    // Get report document
    // logic: reportId param could be the actual report ID OR the analysis ID
    console.log(`[API] Report: Fetching report for ID/AnalysisID: ${reportId}`);

    let reportDoc = await db.collection('marketing/competitor/reports').doc(reportId).get();
    
    // If not found by ID, try searching by analysisId
    if (!reportDoc.exists) {
      console.log(`[API] Report: direct lookup failed, searching by analysisId: ${reportId}`);
      const q = await db.collection('marketing/competitor/reports')
        .where('analysisId', '==', reportId)
        .limit(1)
        .get();

      if (!q.empty) {
        reportDoc = q.docs[0];
        console.log(`[API] Report: Found report ${reportDoc.id} via analysisId`);
      } else {
        console.error(`[API] Report: Report not found for ${reportId}`);
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }
    }

    const reportData = reportDoc.data();
    const analysisId = reportData?.analysisId;

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Invalid report data' },
        { status: 500 }
      );
    }

    // Get analysis document
    const analysisDoc = await db.collection('marketing/competitor/analyses').doc(analysisId).get();
    
    if (!analysisDoc.exists) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Get all competitor data
    const competitorDataQuery = await db
      .collection('marketing/competitor/data')
      .where('analysisId', '==', analysisId)
      .get();

    const competitors = competitorDataQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Convert Firestore timestamps to dates
    const convertTimestamps = (obj: any) => {
      const converted = { ...obj };
      if (converted.generatedAt?.toDate) {
        converted.generatedAt = converted.generatedAt.toDate();
      }
      if (converted.createdAt?.toDate) {
        converted.createdAt = converted.createdAt.toDate();
      }
      if (converted.updatedAt?.toDate) {
        converted.updatedAt = converted.updatedAt.toDate();
      }
      if (converted.scrapedAt?.toDate) {
        converted.scrapedAt = converted.scrapedAt.toDate();
      }
      return converted;
    };

    const response: GetReportResponse = {
      report: {
        id: reportDoc.id,
        ...convertTimestamps(reportData),
      },
      analysis: {
        id: analysisId,
        ...convertTimestamps(analysisDoc.data()),
      },
      competitors: competitors.map(convertTimestamps),
      generatedAt: reportData.generatedAt?.toDate() || new Date(),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error retrieving report:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
