import { AIProviderFactory } from "@/services/ai/provider-factory";

export interface SocialPostContent {
    platform: "linkedin" | "twitter" | "instagram";
    content: string;
    hashtags: string[];
}

export class SocialMediaManagerService {
  
  /**
   * Generate posts for multiple platforms based on a single topic/url
   */
  static async generatePosts(topic: string, platforms: string[], tone: string, userId: string, workspaceId: string): Promise<SocialPostContent[]> {
    const prompt = `
      Act as a Social Media Manager.
      Topic/URL: "${topic}"
      Tone: "${tone}"
      
      Generate a social media post for EACH of the following platforms: ${platforms.join(", ")}.
      
      Requirements:
      - LinkedIn: Professional, engaging, 2-3 short paragraphs.
      - Twitter: Under 280 chars, punchy, thread-style if needed.
      - Instagram: Visual description suggestion + caption + 15-20 hashtags.
      
      Output ONLY a JSON array matching:
      [
        {
          "platform": "linkedin",
          "content": "string",
          "hashtags": ["string"]
        }
      ]
    `;

    return AIProviderFactory.extractJson<SocialPostContent[]>(
      prompt,

      { topic, platforms, tone },
      { 
        feature: "marketingAI", 
        complexity: "creative",
        userId, 
        workspaceId 
      }
    );
  }
}
