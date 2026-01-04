import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { GetReportResponse } from '@/types/competitor-analysis';

export function generateCompetitorReportPDF(data: GetReportResponse) {
  const doc = new jsPDF();
  const { report, analysis } = data;
  const sections = report.sections;
  const business = analysis.userBusinessProfile;

  // Formatting constants
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = 20;

  // Helper for text wrapping
  const addWrappedText = (text: string, fontSize: number = 10, fontStyle: string = 'normal', color: string = '#000000') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(color);
    
    // Split text to fit width
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    
    // Calculate new Y (approx line height)
    y += (lines.length * fontSize * 0.5) + 5;
  };

  const checkPageBreak = (heightNeeded: number = 20) => {
    if (y + heightNeeded > doc.internal.pageSize.height - margin) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  // --- HEADER ---
  doc.setFontSize(22);
  doc.setTextColor('#1a202c');
  doc.text('Competitor Analysis Report', margin, y);
  y += 12;

  doc.setFontSize(10);
  doc.setTextColor('#718096');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, y);
  y += 15;

  // --- BUSINESS CONTEXT ---
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor('#2d3748');
  doc.setFont('helvetica', 'bold');
  doc.text('Analysis Context:', margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Industry: ${business?.industry || 'Unknown'}`, margin, y);
  y += 5;
  doc.text(`Location: ${analysis.location}`, margin, y);
  y += 15;

  // --- EXECUTIVE SUMMARY ---
  checkPageBreak();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#2b6cb0'); // Blue header
  doc.text('Executive Summary', margin, y);
  y += 8;

  addWrappedText(sections.executiveSummary, 10, 'normal', '#4a5568');
  y += 10;

  // --- COMPETITOR OVERVIEW (Table) ---
  checkPageBreak(50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#2b6cb0');
  doc.text('Competitor Overview', margin, y);
  y += 10;

  const tableBody = sections.competitorProfiles.map(c => [
    c.name,
    c.threatLevel.toUpperCase(),
    c.pricingStrategy.substring(0, 50) + (c.pricingStrategy.length > 50 ? '...' : ''),
    c.differentiation.substring(0, 50) + (c.differentiation.length > 50 ? '...' : '')
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Competitor', 'Threat Level', 'Pricing', 'Differentiation']],
    body: tableBody,
    headStyles: { fillColor: [43, 108, 176] },
    margin: { left: margin, right: margin },
    theme: 'striped',
  });

  // @ts-ignore - autoTable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 15;

  // --- MARKET POSITIONING ---
  checkPageBreak();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#2b6cb0');
  doc.text('Market Positioning', margin, y);
  y += 8;

  addWrappedText(sections.marketPositioning, 10, 'normal', '#4a5568');
  y += 10;

  // --- RECOMMENDATIONS ---
  checkPageBreak();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#2b6cb0');
  doc.text('Strategic Recommendations', margin, y);
  y += 8;

  sections.recommendations.forEach(rec => {
    checkPageBreak(40);
    
    // Category Badge-like text
    const categoryName = rec.category.replace('_', ' ').toUpperCase();
    doc.setFontSize(8);
    doc.setTextColor('#718096');
    doc.text(categoryName, margin, y);
    y += 5;

    // Title
    doc.setFontSize(11);
    doc.setTextColor('#2d3748');
    doc.setFont('helvetica', 'bold');
    doc.text(rec.title, margin, y);
    y += 6;

    // Description
    addWrappedText(rec.description, 10, 'normal', '#4a5568');
    y += 5;
  });

  // --- SAVE ---
  const filename = `competitor-analysis-${analysis.location.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}
