import { AIProviderFactory } from "@/services/ai/provider-factory";
import { MarketingKeyword } from "@/types/marketing";
import { Timestamp } from "firebase/firestore";

export class KeywordResearcherService {
  /**
   * Generates keyword ideas and metrics based on a seed keyword using AI.
   * In a production env, this would wrap Semrush/Ahrefs APIs.
   */
  static async researchKeywords(seed: string, userId: string, workspaceId: string): Promise<Partial<MarketingKeyword>[]> {
    
    const prompt = `
      Act as a high-end SEO Keyword Research tool.
      
      Seed Keyword: "${seed}"
      
      Generate 10 related long-tail keywords.
      For each, ESTIMATE the following metrics based on your training data (2024 standards):
      - Search Volume (monthly)
      - Keyword Difficulty (0-100)
      - Search Intent (informational, transactional, navigational, commercial)
      
      Output ONLY valid JSON matching this structure:
      [
        {
          "keyword": "string",
          "searchVolume": number,
          "difficulty": number,
          "intent": "string"
        }
      ]
    `;

    try {
        const results = await AIProviderFactory.extractJson<Partial<MarketingKeyword>[]>(
            prompt,
            "See prompt",
            { seed },
            { 
                feature: "keyword_research", 
                complexity: "routine", 
                userId, 
                workspaceId 
            } 
        );

        // Sanitize and add defaults
        return results.map(k => ({
            ...k,
            id: crypto.randomUUID(),
            status: "active",
            trackedSince: Timestamp.now(),
            workspaceId
        }));

    } catch (error) {
        console.error("Keyword Research Failed:", error);
        return [];
    }
  }
}
