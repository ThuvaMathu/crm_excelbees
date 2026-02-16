import { AIProviderFactory } from "@/services/ai/provider-factory";
import { MarketingCompetitor } from "@/types/marketing";
import { Timestamp } from "firebase/firestore";

export interface CompetitorInsight {
  name: string;
  strengths: string[];
  weaknesses: string[];
  mainKeywords: string[];
  trafficEstimate: string; // e.g. "50k-100k"
  strategySummary: string;
}

export class CompetitorAnalyzerService {
  /**
   * Generates a "Battle Card" for a competitor domain.
   */
  static async analyzeCompetitor(domain: string, userId: string, workspaceId: string): Promise<CompetitorInsight> {
    const prompt = `
      Act as a Competitive Intelligence Analyst.
      
      Target Competitor Domain: "${domain}"
      
      Based on your knowledge base, generate a Strategic Analysis Profile (2024 data if possible).
      
      Output ONLY valid JSON matching:
      {
        "name": "Company Name",
        "strengths": ["string"],
        "weaknesses": ["string"],
        "mainKeywords": ["string"],
        "trafficEstimate": "string",
        "strategySummary": "string"
      }
    `;

    return AIProviderFactory.extractJson<CompetitorInsight>(
      prompt,
      { domain },
      { 
        feature: "competitor_analysis", 
        complexity: "complex", // Use smarter model for strategic insight
        userId, 
        workspaceId 
      }
    );
  }
}
