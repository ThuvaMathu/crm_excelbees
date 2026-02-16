import { AIProviderFactory } from "@/services/ai/provider-factory";

export interface AdCopyVariant {
    platform: "google" | "facebook";
    headline: string;
    description: string; // "Primary Text" for FB
    linkDescription?: string; // Optional 2nd line or FB Link Desc
}

export class AdCopyGeneratorService {
  
  /**
   * Generate ad variants for Google or Facebook
   */
  static async generateAdCopy(product: string, audience: string, benefit: string, platform: "google" | "facebook", userId: string, workspaceId: string): Promise<AdCopyVariant[]> {
    const prompt = `
      Act as a PPC Copywriting Expert.
      Product: "${product}"
      Audience: "${audience}"
      Main Benefit: "${benefit}"
      Platform: "${platform}"
      
      Generate 3 distinct ad copy variations.
      
      Constraints:
      ${platform === 'google' ? 
        `- Headlines: Max 30 chars. \n- Descriptions: Max 90 chars.` : 
        `- Primary Text: 125 chars recommended (can be longer). \n- Headline: Max 40 chars. \n- Link Description: Max 30 chars.`
      }
      
      Output ONLY a JSON array matching:
      [
        {
          "platform": "${platform}",
          "headline": "string",
          "description": "string", 
          "linkDescription": "string" 
        }
      ]
    `;

    return AIProviderFactory.extractJson<AdCopyVariant[]>(
      prompt,
      { product, audience, benefit, platform },
      { 
        feature: "ad_copy", 
        complexity: "creative",
        userId, 
        workspaceId 
      }
    );
  }
}
