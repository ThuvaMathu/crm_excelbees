/**
 * API Route: Export Keywords (Step 10)
 * POST /api/keyword/export
 * 
 * Exports keyword research data in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';
import type { ExportRequest, ExportResponse } from '@/types/keyword-research';

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { researchId, formatType } = body;

    if (!researchId || !formatType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`🚀 [Keyword API] Export: ${formatType} format`);

    // Fetch selected keywords
    const keywordsSnapshot = await db
      .collection(`marketing/keyword/researches/${researchId}/selected_keywords`)
      .get();

    const keywords = keywordsSnapshot.docs.map(doc => doc.data());

    if (formatType === 'csv' || formatType === 'all') {
      // Generate CSV
      const csvHeaders = [
        'Rank',
        'Keyword',
        'Search Volume',
        'Difficulty',
        'Search Intent',
        'Strategic Value',
        'Competitors Ranking',
        'Trend',
        'CPC',
        'Selection Reason',
      ];

      const csvRows = keywords.map((kw: any) => [
        kw.rank,
        kw.primaryKeyword,
        kw.searchVolume,
        kw.difficulty,
        kw.searchIntent,
        kw.strategicValue,
        kw.whichCompetitorsRank?.join('; ') || '',
        kw.trend,
        kw.cpc || '',
        kw.selectionReason || '',
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      // In a real implementation, you would upload this to cloud storage
      // and return a download URL. For now, we'll return the content directly.
      
      const response: ExportResponse = {
        downloadUrl: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`,
      };

      return NextResponse.json(response);
    }

    if (formatType === 'pdf') {
      // PDF generation would use jspdf library
      // This is a placeholder - implement full PDF generation as needed
      return NextResponse.json({
        downloadUrl: '/api/keyword/export/pdf/' + researchId,
      });
    }

    if (formatType === 'excel') {
      // Excel generation would use a library like exceljs
      // This is a placeholder
      return NextResponse.json({
        downloadUrl: '/api/keyword/export/excel/' + researchId,
      });
    }

    return NextResponse.json({ error: 'Invalid format type' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting keywords:', error);
    return NextResponse.json(
      {
        error: 'Failed to export keywords',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
