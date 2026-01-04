import { GeminiProvider } from "./gemini-provider";
import { OpenAIProvider } from "./openai-provider";
import { CacheManager } from "./cache-manager";

type TaskComplexity = "routine" | "creative" | "complex";

interface AIRequestOptions {
  feature: string;
  complexity?: TaskComplexity;
  userId: string;
  workspaceId: string;
  useCache?: boolean;
  ttl?: number; // Cache TTL in seconds
}

export class AIProviderFactory {
  private static gemini = new GeminiProvider();
  private static openai = new OpenAIProvider();

  static async generate(prompt: string, context: any, options: AIRequestOptions): Promise<string> {
    const { feature, complexity = "routine", userId, workspaceId, useCache = true, ttl = 86400 } = options;

    // 1. Check Cache
    if (useCache) {
      const cached = await CacheManager.get<string>(prompt, feature);
      if (cached) return cached;
    }

    let result = "";

    // 2. Route Request
    try {
      if (complexity === "complex") {
        // Use OpenAI GPT-4o for complex reasoning
        result = await this.openai.analyzeStrategic(prompt, context, userId, workspaceId, feature);
      } else if (complexity === "creative") {
        // Use OpenAI default (GPT-4o-mini) or Gemini Pro
        result = await this.openai.generateContent(prompt, context, userId, workspaceId, feature);
      } else {
        // Use Gemini Flash for routine (cheapest)
        result = await this.gemini.generateContent(prompt, context, userId, workspaceId, feature);
      }
    } catch (error) {
       console.error(`[AI Factory] Provider failed for ${feature}, switching fallback...`, error);
       // Fallback logic could go here (e.g., if OpenAI fails, try Gemini)
       try {
         result = await this.gemini.generateContent(prompt, context, userId, workspaceId, feature);
       } catch (fallbackError) {
         throw new Error("All AI providers failed.");
       }
    }

    // 3. Cache Result
    if (useCache && result) {
      await CacheManager.set(prompt, feature, result, ttl);
    }

    return result;
  }

  static async extractJson<T>(prompt: string, schema: string, context: any, options: AIRequestOptions): Promise<T> {
     // Similar structure but for JSON extraction
     const { feature, complexity = "routine", userId, workspaceId, useCache = true } = options;
     
     // 1. Check Cache
     if (useCache) {
       const cached = await CacheManager.get<T>(prompt, feature);
       if (cached) return cached;
     }

     let result: T;

     try {
       if (complexity === "complex") {
         result = await this.openai.complexReasoning<T>(prompt, schema, context, userId, workspaceId, feature);
       } else {
         result = await this.gemini.extractData<T>(prompt, schema, context, userId, workspaceId, feature);
       }
     } catch (e) {
        console.warn("[AI Factory] JSON Extract failed, retrying with fallback...", e);
        result = await this.gemini.extractData<T>(prompt, schema, context, userId, workspaceId, feature);
     }

     if (useCache && result) {
       await CacheManager.set(prompt, feature, result, options.ttl);
     }

     return result;
  }
}
